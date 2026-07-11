import nacl from "tweetnacl";
import { DeviceRepository } from "../../Persistence/Repositories/DeviceRepository.js";

export interface INonceSigner {
    signNonce(nonce: string): Promise<string>;
}

export class NonceSigner implements INonceSigner {
    private readonly deviceRepository: DeviceRepository;
    
    constructor(deviceRepository: DeviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public async signNonce(nonce: string): Promise<string> {
        const device = await this.deviceRepository.get();
        if (!device || !device.privateKey) {
            throw new Error("Device or private key not found");
        }

        const privateKeyBuffer = Buffer.from(device.privateKey, 'base64');
        const nonceBuffer = Buffer.from(nonce, 'base64');

        const signatureBuffer = nacl.sign.detached(nonceBuffer, privateKeyBuffer);
        return Buffer.from(signatureBuffer).toString('base64');
    }
}
