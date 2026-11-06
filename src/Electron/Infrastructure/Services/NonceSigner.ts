import nacl from 'tweetnacl';
import { DeviceRepository } from '../Persistence/Repositories/DeviceRepository.js';
import { DeviceKeys, INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { deviceApprovalMessage } from '../Crypto/AccountKey.js';

const AUTH_CONTEXT = Buffer.from('cendrite-auth-v1', 'ascii');

export class NonceSigner implements INonceSigner {
    private readonly deviceRepository: DeviceRepository;

    constructor(deviceRepository: DeviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public async signNonce(nonce: string): Promise<string> {
        const device = await this.deviceRepository.get();
        if (!device || !device.privateKey) {
            throw new Error('Device or private key not found');
        }

        const privateKeyBuffer = Buffer.from(device.privateKey, 'base64');
        const message = Buffer.concat([AUTH_CONTEXT, Buffer.from(nonce, 'base64')]);

        const signatureBuffer = nacl.sign.detached(message, privateKeyBuffer);
        return Buffer.from(signatureBuffer).toString('base64');
    }

    public async signDeviceApproval(accountPublicKey: string, devicePublicKey: string): Promise<string> {
        const device = await this.deviceRepository.get();
        if (!device || !device.privateKey) {
            throw new Error('Device or private key not found');
        }

        const message = deviceApprovalMessage(Buffer.from(accountPublicKey, 'base64'), Buffer.from(devicePublicKey, 'base64'));
        const signature = nacl.sign.detached(message, Buffer.from(device.privateKey, 'base64'));
        return Buffer.from(signature).toString('base64');
    }

    public generateDeviceKeys(): DeviceKeys {
        const keyPair = nacl.sign.keyPair();
        const publicKey = Buffer.from(keyPair.publicKey).toString('base64');
        const privateKey = Buffer.from(keyPair.secretKey).toString('base64');

        return { publicKey, privateKey };
    }
}
