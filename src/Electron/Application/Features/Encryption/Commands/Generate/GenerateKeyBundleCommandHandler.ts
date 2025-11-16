import * as libsignal from '@privacyresearch/libsignal-protocol-typescript'
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GenerateKeyBundleCommand } from "./GenerateKeyBundleCommand.js";
import { GenerateKeyBundleDto } from "./GenerateKeyBundleDto.js";
import { randomUUID } from "crypto";
import { KeyCacher } from "../../../../../Persistence/Cache/KeyCacher.js";
import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { SignedPreKeyDto } from "../../Dtos/SignedPreKeyDto.js";
import generateNumberId from '../../../../Utilities/IdHelpers.js';

export class GenerateKeyBundleCommandHandler implements Handler<GenerateKeyBundleCommand, GenerateKeyBundleDto> {
    public async handle(_request: GenerateKeyBundleCommand): Promise<Result<GenerateKeyBundleDto>> {
        try {
            const registrationId = libsignal.KeyHelper.generateRegistrationId(); 

            const identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair();
    
            const baseKeyId = generateNumberId();
            const signedPrekey = await libsignal.KeyHelper.generateSignedPreKey(identityKeyPair, baseKeyId);


            const ecPrekeys: libsignal.PreKeyPairType[] = [];
            for (let i = 1; i <= 100; i++) {
                const preKey = await libsignal.KeyHelper.generatePreKey(baseKeyId + i);
                ecPrekeys.push(preKey);
            }

            const cacheToken = randomUUID();
            KeyCacher.getInstance().stashSecrets(cacheToken, {
                registrationId,
                identityKey: identityKeyPair,
                signedPreKey: signedPrekey,
                signedPrekeyTimestamp: new Date(), 
                ecPreKeys: ecPrekeys,
            });

            return Result.success<GenerateKeyBundleDto>(
                new GenerateKeyBundleDto(
                    cacheToken,
                    registrationId,
                    this.b64Encode(identityKeyPair.pubKey),
                    new SignedPreKeyDto(
                        signedPrekey.keyId,
                        this.b64Encode(signedPrekey.keyPair.pubKey),
                        this.b64Encode(signedPrekey.signature),
                        new Date(),
                    ),
                    ecPrekeys.map((preKey) => ({
                        keyId: preKey.keyId,
                        publicKey: this.b64Encode(preKey.keyPair.pubKey),
                    })),
                ),
            );
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Generate Key Bundle Failed:', errorMessage);
            return Result.fail<GenerateKeyBundleDto>(new ErrorMessage(null, 'Generate Key Bundle Failed'));
        }
    }

    private b64Encode(buffer: ArrayBuffer): string {
        return Buffer.from(buffer).toString('base64');
    }
}
