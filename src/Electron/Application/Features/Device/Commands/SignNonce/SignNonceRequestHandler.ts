import nacl from 'tweetnacl';
import { ErrorMessage } from '../../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../../Shared/Result/Result.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { SignNonceDto } from './SignNonceDto.js';
import { SignNonceRequest } from './SignNonceRequest.js';
import { IDeviceRepository } from '../../../../Contracts/Repositories/IDeviceRepository.js';

export class SignNonceRequestHandler implements Handler<SignNonceRequest, SignNonceDto> {
    constructor(private readonly deviceRepository: IDeviceRepository) { }

    async handle(request: SignNonceRequest): Promise<Result<SignNonceDto>> {
        try {
            const device = await this.deviceRepository.get();
            if (!device) {
                throw new Error('Device not found');
            }

            const nonceBuffer = Buffer.from(request.nonce, 'base64');

            const privateKeyBuffer = Buffer.from(device.privateKey, 'base64');

            const signatureBuffer = nacl.sign.detached(nonceBuffer, privateKeyBuffer);

            const signature = Buffer.from(signatureBuffer).toString('base64');

            const dto = SignNonceDto.MapFrom(signature);

            return Result.success(dto);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Nonce signing error:', errorMessage);
            return Result.fail<SignNonceDto>(new ErrorMessage(null, 'NonceSigningFailed'));
        }
    }
}
