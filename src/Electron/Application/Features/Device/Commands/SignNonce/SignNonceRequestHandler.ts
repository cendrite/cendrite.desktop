import nacl from 'tweetnacl';
import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { DeviceRepository } from "../../../../../Infrastructure/Persistence/Repositories/DeviceRepository.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { SignNonceDto } from "./SignNonceDto.js";
import { SignNonceRequest } from "./SignNonceRequest.js";

export class SignNonceRequestHandler implements Handler<SignNonceRequest, SignNonceDto> {

    async handle(request: SignNonceRequest): Promise<Result<SignNonceDto>> {
        try {

            const repo = new DeviceRepository();
            const device = await repo.get();

            const nonceBuffer = Buffer.from(request.nonce, 'base64');

            const privateKeyBuffer = Buffer.from(device.privateKey, 'base64');

            const signatureBuffer = nacl.sign.detached(nonceBuffer, privateKeyBuffer);

            const signature = Buffer.from(signatureBuffer).toString('base64');

            const dto = SignNonceDto.MapFrom(signature);

            return Result.success(dto);

        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Nonce signing error:', errorMessage);
            return Result.fail<SignNonceDto>(new ErrorMessage(null, "NonceSigningFailed"));
        }
    }
}
