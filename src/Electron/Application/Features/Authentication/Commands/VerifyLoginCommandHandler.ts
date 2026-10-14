import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { Device } from '#electron/Domain/Entities/Device';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { ITokenManager } from '#electron/Application/Contracts/Services/ITokenManager';
import { IDeviceRepository } from '#electron/Application/Contracts/Repositories/IDeviceRepository';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { VerifyLoginCommand } from '#shared/Authentication/VerifyLogin';
import { IKeyGenerator } from '#electron/Application/Contracts/Services/IKeyGenerator';
import { ISignalManager } from '#electron/Application/Contracts/Services/ISignalManager';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IUserProvider } from '#electron/Application/Contracts/Providers/IUserProvider';
import { UserContract } from '#shared/Models/UserContract';
import { User } from '#electron/Domain/Aggregates/User';
import { UserConnectionId } from '#electron/Domain/Entities/UserConnectionId';
import { IPump } from '#electron/Application/Contracts/Services/IPump';

export class VerifyLoginCommandHandler implements Handler<VerifyLoginCommand, UserContract> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly deviceProvider: IDeviceProvider,
        private readonly nonceSigner: INonceSigner,
        private readonly deviceRepository: IDeviceRepository,
        private readonly tokenManager: ITokenManager,
        private readonly keyGenerator: IKeyGenerator,
        private readonly signalManager: ISignalManager,
        private readonly userRepository: IUserRepository,
        private readonly userProvider: IUserProvider,
        private readonly messagePump: IPump,
        private readonly deliveryStatusUpdatePump: IPump,
    ) { }

    public async handle(cmd: VerifyLoginCommand): Promise<Result<UserContract>> {
        const verifyLoginResult = await this.authenticationProvider.verifyLogin({
            userId: cmd.userId,
            loginVerificationCode: cmd.loginVerificationCode,
        });

        if (!verifyLoginResult.success) {
            console.log('Login verification failed:', verifyLoginResult.errorMessage);
            return Result.fail<UserContract>(
                new ErrorMessage(null, verifyLoginResult.errorMessage.message || 'Failed to verify login'),
            );
        }

        const devPk = this.nonceSigner.generateDeviceKeys();

        const deviceRegistrationResult = await this.deviceProvider.createDevice({
            userId: cmd.userId,
            loginNonceId: verifyLoginResult.data.nonceId,
            loginNonce: verifyLoginResult.data.nonce,
            deviceAppVersion: '1.0', // Replace with actual app version
            deviceType: 1, // Replace with actual device type
            devicePlatform: 1, // Replace with actual platform
            base64DevicePublicKey: devPk.publicKey,
        });

        if (!deviceRegistrationResult.success) {
            console.log('Device registration failed:', deviceRegistrationResult.errorMessage);
            return Result.fail<UserContract>(new ErrorMessage(null, 'Failed to register device'));
        }

        const device = new Device(
            deviceRegistrationResult.data.deviceId,
            deviceRegistrationResult.data.deviceConnectionId,
            devPk.privateKey,
            devPk.publicKey,
        );

        await this.deviceRepository.create(device);

        await this.tokenManager.init(cmd.userId, device.id);

        await this.keyGenerator.generateKeyBundle(device.connectionId);

        await this.signalManager.connect();

        const userProfileResponse = await this.userProvider.getUserProfile({
            exclusiveConnectionId: device.connectionId,
        });

        if (!userProfileResponse.success || !userProfileResponse.data) {
            return Result.fail<UserContract>(new ErrorMessage(null, 'Failed to retrieve user profile from provider'));
        }

        const user = new User(
            userProfileResponse.data.id,
            userProfileResponse.data.username,
            userProfileResponse.data.userTag,
            userProfileResponse.data.avatarKey,
            userProfileResponse.data.displayName,
        );

        user.connectionIds = userProfileResponse.data.connectionIds.map(
            (connectionId) => new UserConnectionId(connectionId, user),
        );

        const savedUser = await this.userRepository.create(user);

        const userContract = new UserContract(
            savedUser.id,
            savedUser.username,
            savedUser.userTag,
            device.id,
            device.connectionId,
            savedUser.connectionIds.map((conn) => conn.connectionId),
            savedUser.avatarKey,
            savedUser.displayName,
        );

        this.messagePump.start();
        this.deliveryStatusUpdatePump.start();

        return Result.success<UserContract>(userContract);
    }
}
