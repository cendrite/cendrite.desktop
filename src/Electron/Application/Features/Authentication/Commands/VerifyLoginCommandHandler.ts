import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { Device } from '../../../../Domain/Entities/Device.js';
import { INonceSigner } from '../../../Contracts/Services/INonceSigner.js';
import { ITokenManager } from '../../../Contracts/Services/ITokenManager.js';
import { IDeviceRepository } from '../../../Contracts/Repositories/IDeviceRepository.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { IDeviceProvider } from '../../../Contracts/Providers/IDeviceProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { VerifyLoginCommand } from '../../../../../Shared/Authentication/VerifyLogin.js';
import { IKeyGenerator } from '../../../Contracts/Services/IKeyGenerator.js';
import { ISignalManager } from '../../../Contracts/Services/ISignalManager.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { IUserProvider } from '../../../Contracts/Providers/IUserProvider.js';
import { UserContract } from '../../../../../Shared/Models/UserContract.js';
import { User } from '../../../../Domain/Aggregates/User.js';
import { UserConnectionId } from '../../../../Domain/Entities/UserConnectionId.js';
import { IPump } from '../../../Contracts/Services/IPump.js';

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
