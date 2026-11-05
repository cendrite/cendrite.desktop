import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { UserContract } from '#shared/Models/UserContract';
import { Handler } from '#electron/Application/Mediator/Handler';
import { RecoverAccountCommand } from '#shared/Authentication/Recover';
import { Device } from '#electron/Domain/Entities/Device';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { IDeviceSessionService } from '#electron/Application/Services/Device/DeviceSessionService';
import { currentDeviceInfo } from '#electron/Application/Services/Device/DeviceInfo';
import {
    deriveAccountKey,
    isValidRecoveryPhrase,
    signDeviceApproval,
    signRecoveryChallenge,
} from '#electron/Infrastructure/Crypto/AccountKey';

const TOO_MANY_REQUESTS = 'Too Many Requests';

export class RecoverAccountCommandHandler implements Handler<RecoverAccountCommand, UserContract> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly nonceSigner: INonceSigner,
        private readonly deviceSessionService: IDeviceSessionService,
    ) { }

    public async handle(cmd: RecoverAccountCommand): Promise<Result<UserContract>> {
        const words = cmd.words.map((word) => word.trim().toLowerCase());

        if (words.length !== 12 || !isValidRecoveryPhrase(words)) {
            return Result.fail<UserContract>(
                new ErrorMessage('Validation', "That isn't a valid recovery phrase. Check each word for typos."),
            );
        }

        const accountKey = deriveAccountKey(words);
        words.fill('');

        try {
            const accountPublicKey = Buffer.from(accountKey.publicKey).toString('base64');

            const challengeResult = await this.authenticationProvider.getRecoveryChallenge(accountPublicKey);
            if (!challengeResult.success) return failure(challengeResult.errorMessage);

            const challenge = challengeResult.data;
            const deviceKeys = this.nonceSigner.generateDeviceKeys();
            const device = currentDeviceInfo();

            const recoverResult = await this.authenticationProvider.recover({
                accountPublicKey,
                challengeId: challenge.challengeId,
                challengeSignature: signRecoveryChallenge(accountKey, Buffer.from(challenge.challenge, 'base64')),
                devicePublicKey: deviceKeys.publicKey,
                deviceApproval: signDeviceApproval(accountKey, Buffer.from(deviceKeys.publicKey, 'base64')),
                deviceAppVersion: device.appVersion,
                deviceType: device.type,
                devicePlatform: device.platform,
            });
            if (!recoverResult.success) return failure(recoverResult.errorMessage);

            const { userId, deviceId, deviceConnectionId } = recoverResult.data;
            return this.deviceSessionService.start(
                userId,
                new Device(deviceId, deviceConnectionId, deviceKeys.privateKey, deviceKeys.publicKey),
            );
        } finally {
            accountKey.secretKey.fill(0);
        }
    }
}

function failure(error: ErrorMessage): Result<UserContract> {
    if (error.code === TOO_MANY_REQUESTS) {
        return Result.fail<UserContract>(new ErrorMessage('TooManyRequests', 'Too many attempts. Please wait a while and try again.'));
    }
    return Result.fail<UserContract>(
        new ErrorMessage('RecoveryFailed', "We couldn't recover an account with this phrase. Check the words and try again."),
    );
}
