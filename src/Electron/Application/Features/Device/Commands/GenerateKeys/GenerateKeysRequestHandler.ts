import nacl from 'tweetnacl';
import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GenerateKeysDto } from "./GenerateKeysDto.js";
import { GenerateKeysRequest } from "./GenerateKeysRequest.js";

export class GenerateKeysRequestHandler implements Handler<GenerateKeysRequest, GenerateKeysDto> {

    async handle(request: GenerateKeysRequest): Promise<Result<GenerateKeysDto>> {

        try {
            // Generate a Ed25519 key pair
            const keyPair = nacl.sign.keyPair();

            // Convert the private and public keys to base64
            const base64PrivateKey = Buffer.from(keyPair.secretKey).toString('base64');
            const base64PublicKey = Buffer.from(keyPair.publicKey).toString('base64');

            const dto = GenerateKeysDto.MapFrom(base64PrivateKey, base64PublicKey);

            return Result.success(dto);
        }
        catch (error) {
            // Log the error message and stack trace for debugging
            if (error instanceof Error) {
                console.error('Key generation error:', error.message);
                console.error('Stack trace:', error.stack);
                return Result.fail<GenerateKeysDto>(new ErrorMessage(null, error.message));
            } else {
                // For non-standard error objects, log the entire error
                console.error('Unknown error during key generation:', error);
                return Result.fail<GenerateKeysDto>(new ErrorMessage(null, 'An unknown error occurred'));
            }
        }
    }
}