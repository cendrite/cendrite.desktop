import { KeyService } from '../../Common/Services/KeyService';
import { LocalKeyStore } from './LocalKeyStore';
import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { convertToBuffer, generateAddressId } from './Utilities';
import { mapBundleToDevice } from './KeyMapper';
import { MessagePayload } from '../../SignalR/Messaging/ServerChatMessage';

export class SessionManager {
    private keyStore: libsignal.StorageType = new LocalKeyStore();
    private keyService: KeyService = new KeyService();

    constructor(
        private connectionId: string,
    ) { }


    private get address(): libsignal.SignalProtocolAddress {
        return new libsignal.SignalProtocolAddress(this.connectionId, generateAddressId(this.connectionId));
    }

    private async ensureSession(): Promise<void> {
        const session = await this.keyStore.loadSession(this.address.toString());
        if (session) {
            return;
        }

        const preKeyBundleResult = await this.keyService.GetKeyBundle(this.connectionId);
        if (!preKeyBundleResult.success) {
            throw new Error('Failed to retrieve pre-key bundle: ' + preKeyBundleResult.errorMessage);
        }

        const preKeyBundle = preKeyBundleResult.data!;

        const builder = new libsignal.SessionBuilder(this.keyStore, this.address);

        const mappedBundle = mapBundleToDevice(preKeyBundle);

        console.log("prekey bundle:", preKeyBundle);
        console.log(mappedBundle);
        await builder.processPreKey(mappedBundle);
    }

    public async encrypt(plainMessage: MessagePayload): Promise<string> {
        await this.ensureSession();

        const sessionCipher = new libsignal.SessionCipher(this.keyStore, this.address);

        const plainTextStr = JSON.stringify(plainMessage);

        const messageBuffer = convertToBuffer(plainTextStr);

        const ciphertext = await sessionCipher.encrypt(messageBuffer);

        return JSON.stringify({
            type: ciphertext.type,
            body: ciphertext.body ? btoa(ciphertext.body) : '',
        });
    }

    public async decrypt(ciphertext: string): Promise<MessagePayload> {
        const { type, body } = JSON.parse(ciphertext);

        const cipher = new libsignal.SessionCipher(this.keyStore, this.address);

        const bodyBuffer = body ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0)).buffer : new ArrayBuffer(0);

        let plaintextBuffer: ArrayBuffer;

        if (type === 3) {
            plaintextBuffer = await cipher.decryptPreKeyWhisperMessage(bodyBuffer, "binary"); 
        } else {
            plaintextBuffer = await cipher.decryptWhisperMessage(bodyBuffer, "binary");
        }

        const decryptedMsg = new TextDecoder().decode(plaintextBuffer);
        return JSON.parse(decryptedMsg);
    }
}
