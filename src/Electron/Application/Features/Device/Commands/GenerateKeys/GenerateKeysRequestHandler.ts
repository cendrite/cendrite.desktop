import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GenerateKeysDto } from "./GenerateKeysDto.js";
import { GenerateKeysRequest } from "./GenerateKeysRequest.js";
import { generateKeyPairSync } from "crypto";

export class GenerateKeysRequestHandler implements Handler<GenerateKeysRequest, GenerateKeysDto> {

    async handle(request: GenerateKeysRequest): Promise<Result<GenerateKeysDto>> {

        try {
            const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'der' // Der format for raw key
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'der' // Der format for raw key
                }
            });

            const rawPublicKey = Buffer.from(publicKey).toString('base64');
            const rawPrivateKey = Buffer.from(privateKey).toString('base64');

            const dto = GenerateKeysDto.MapFrom(rawPrivateKey, rawPublicKey);

            return Result.success(dto);
        }

        catch (error) {
            return Result.fail<GenerateKeysDto>(new ErrorMessage(null, 'Failed to generate keys'));
        }
    }
}