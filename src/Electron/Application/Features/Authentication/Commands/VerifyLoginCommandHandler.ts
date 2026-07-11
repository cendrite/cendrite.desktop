import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { Device } from '../../../../Domain/Entities/Device.js';
import { INonceSigner } from '../../../../Infrastructure/Interfaces/INonceSigner.js';
import { TokenManager } from '../../../../Infrastructure/Services/TokenManager.js';
import { DeviceRepository } from '../../../../Persistence/Repositories/DeviceRepository.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { IDeviceProvider } from '../../../Contracts/Providers/IDeviceProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { VerifyLoginCommand, VerifyLoginResponse } from '../Contracts/VerifyLogin.js';

export class VerifyLoginCommandHandler implements Handler<VerifyLoginCommand, VerifyLoginResponse> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly deviceProvider: IDeviceProvider,
        private readonly nonceSigner: INonceSigner,
        private readonly deviceRepository: DeviceRepository,
        private readonly tokenManager: TokenManager,
    ) { }

    public async handle(cmd: VerifyLoginCommand): Promise<Result<VerifyLoginResponse>> {
        try {
            const verifyLoginResult = await this.authenticationProvider.verifyLogin({
                userId: cmd.userId,
                loginVerificationCode: cmd.loginVerificationCode,
            });

            if (!verifyLoginResult.success) {
                console.log('Login verification failed:', verifyLoginResult.errorMessage);
                return Result.fail<VerifyLoginResponse>(
                    new ErrorMessage(null, verifyLoginResult.errorMessage?.message || 'Failed to verify login'),
                );
            }

            const devPk = this.nonceSigner.generateDeviceKeys();

            const deviceRegistrationResult = await this.deviceProvider.createDevice({
                userId: cmd.userId,
                loginNonceId: verifyLoginResult.data!.nonceId,
                loginNonce: verifyLoginResult.data!.nonce,
                deviceAppVersion: '1.0', // Replace with actual app version
                deviceType: 1, // Replace with actual device type
                devicePlatform: 1, // Replace with actual platform
                base64DevicePublicKey: devPk.publicKey,
            });

            if (!deviceRegistrationResult.success) {
                console.log('Device registration failed:', deviceRegistrationResult.errorMessage);
                return Result.fail<VerifyLoginResponse>(new ErrorMessage(null, 'Failed to register device'));
            }

            const device = new Device(
                deviceRegistrationResult.data!.deviceId,
                deviceRegistrationResult.data!.deviceConnectionId,
                devPk.privateKey,
                devPk.publicKey,
            );

            await this.deviceRepository.create(device);

            await this.tokenManager.init(cmd.userId, device.id);

            return Result.success<VerifyLoginResponse>({
                deviceId: device.id,
                connectionId: device.connectionId,
            });
        } catch (error) {
            console.error('Error verifying login:', error);
            return Result.fail<VerifyLoginResponse>(new ErrorMessage(null, 'Error verifying login'));
        }
    }
}
