import { PreKeyRecord, PrivateKey, SignedPreKeyRecord } from "@signalapp/libsignal-client";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GenerateKeyBundleCommand } from "./GenerateKeyBundleCommand.js";
import { GenerateKeyBundleDto } from "./GenerateKeyBundleDto.js";
import { randomBytes, randomUUID } from "crypto";
import { KeyCacher } from "../../../../../Persistence/Cache/KeyCacher.js";
import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { SignedPreKeyDto } from "../../Dtos/SignedPreKeyDto.js";

export class GenerateKeyBundleCommandHandler implements Handler<GenerateKeyBundleCommand, GenerateKeyBundleDto> {
    public async handle(_request: GenerateKeyBundleCommand): Promise<Result<GenerateKeyBundleDto>> {
        try {
            const identityPrivateKey = PrivateKey.generate();
            const identityPublicKey = identityPrivateKey.getPublicKey();
            const registrationId = this.generateRegistrationId();

            const signedPrekey = PrivateKey.generate();
            const signedPrekeyPublic = signedPrekey.getPublicKey();
            const signedPrekeySignature = identityPrivateKey.sign(signedPrekeyPublic.serialize());
            const signedPreKeyRecord = SignedPreKeyRecord.new(
                1,
                Date.now(),
                signedPrekeyPublic,
                signedPrekey,
                signedPrekeySignature,
            );

            const ecPrekeys: PreKeyRecord[] = [];
            for (let i = 1; i <= 100; i++) {
                const ecPrekeyPrivate = PrivateKey.generate();
                const ecPrekeyPublic = ecPrekeyPrivate.getPublicKey();
                const ecPreKeyRecord = PreKeyRecord.new(1, ecPrekeyPublic, ecPrekeyPrivate);
                ecPrekeys.push(ecPreKeyRecord);
            }

            const cacheToken = randomUUID();
            KeyCacher.getInstance().stashSecrets(cacheToken, {
                registrationId,
                identityPriv: identityPrivateKey,
                identityPub: identityPublicKey,
                signedPreKey: signedPreKeyRecord,
                ecPreKeys: ecPrekeys,
            });

            return Result.success<GenerateKeyBundleDto>(
                new GenerateKeyBundleDto(
                    cacheToken,
                    registrationId,
                    this.b64Encode(identityPublicKey.serialize()),
                    new SignedPreKeyDto(
                        signedPreKeyRecord.id(),
                        this.b64Encode(signedPreKeyRecord.publicKey().serialize()),
                        this.b64Encode(signedPreKeyRecord.signature()),
                        new Date(signedPreKeyRecord.timestamp()),
                    ),
                    ecPrekeys.map((preKey) => ({
                        keyId: preKey.id(),
                        publicKey: this.b64Encode(preKey.publicKey().serialize()),
                    })),
                ),
            );
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Generate Key Bundle Failed:', errorMessage);
            return Result.fail<GenerateKeyBundleDto>(new ErrorMessage(null, 'Generate Key Bundle Failed'));
        }
    }

    private generateRegistrationId(): number {
        const n = randomBytes(2).readUInt16BE(0);
        return n === 0 ? 1 : n;
    }

    private b64Encode(buffer: Uint8Array): string {
        return Buffer.from(buffer).toString('base64');
    }
}
