import { KeyService } from '../../Common/Services/KeyService';
import { LocalKeyStore } from './LocalKeyStore';
import * as libsignal from '@privacyresearch/libsignal-protocol-typescript';
import { convertToBuffer, generateAddressId } from './Utilities';

class SessionManager {
    constructor(
        private keyStore: LocalKeyStore,
        private keyService: KeyService,
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
        //TODO: map the preKeyBundle to a libsignal DeviceType 
        await builder.processPreKey(preKeyBundle);
    }

    public async encrypt(plaintext: string): Promise<string> {
        await this.ensureSession();

        const sessionCipher = new libsignal.SessionCipher(this.keyStore, this.address);

        const messageBuffer = convertToBuffer(plaintext);

        const ciphertext = await sessionCipher.encrypt(messageBuffer);

        return JSON.stringify({
            type: ciphertext.type,
            body: ciphertext.body ? btoa(ciphertext.body) : '',
        });
    }

    public async decrypt(ciphertext: string): Promise<string> {
        const { type, body } = JSON.parse(ciphertext);

        const cipher = new libsignal.SessionCipher(this.keyStore, this.address);

        const bodyBuffer = body ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0)).buffer : new ArrayBuffer(0);

        let plaintextBuffer: ArrayBuffer;

        if (type === 3) {
            plaintextBuffer = await cipher.decryptPreKeyWhisperMessage(bodyBuffer, "binary"); 
        } else {
            plaintextBuffer = await cipher.decryptWhisperMessage(bodyBuffer, "binary");
        }

        return new TextDecoder().decode(plaintextBuffer);
    }
}
