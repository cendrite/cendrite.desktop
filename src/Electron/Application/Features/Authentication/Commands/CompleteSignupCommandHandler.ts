import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { UserContract } from '#shared/Models/UserContract';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CompleteSignupCommand } from '#shared/Authentication/CompleteSignup';
import { Device } from '#electron/Domain/Entities/Device';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { IPendingSignupStore, PendingSignup, SignupRegistration } from '#electron/Application/Contracts/Services/IPendingSignupStore';
import { deriveAccountKey, signDeviceApproval, signSignupChallenge } from '#electron/Infrastructure/Crypto/AccountKey';
import { solveProofOfWork } from '#electron/Infrastructure/Crypto/ProofOfWork';
import { IDeviceSessionService } from '#electron/Application/Services/Device/DeviceSessionService';
import { currentDeviceInfo } from '#electron/Application/Services/Device/DeviceInfo';

const MAX_DIFFICULTY = 24;

export class CompleteSignupCommandHandler implements Handler<CompleteSignupCommand, UserContract> {
    constructor(
        private readonly pendingSignupStore: IPendingSignupStore,
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly nonceSigner: INonceSigner,
        private readonly deviceSessionService: IDeviceSessionService,
    ) { }

    public async handle(cmd: CompleteSignupCommand): Promise<Result<UserContract>> {
        const pending = this.pendingSignupStore.get();
        if (!pending) {
            return Result.fail<UserContract>(new ErrorMessage('Expired', 'Your signup has expired. Please start again.'));
        }

        if (!confirmationsMatch(pending, cmd.confirmations)) {
            return Result.fail<UserContract>(new ErrorMessage('Validation', "Those words don't match your recovery phrase."));
        }

        if (!pending.registration) {
            const registration = await this.register(pending.words, cmd.username);
            if (!registration.success) return registration;
            pending.registration = registration.data;
        }

        const { userId, deviceId, connectionId, devicePrivateKey, devicePublicKey } = pending.registration;
        const result = await this.deviceSessionService.start(userId, new Device(deviceId, connectionId, devicePrivateKey, devicePublicKey));

        if (result.success) this.pendingSignupStore.clear();

        return result;
    }

    private async register(words: string[], username: string): Promise<Result<SignupRegistration>> {
        const challengeResult = await this.authenticationProvider.getSignupChallenge();
        if (!challengeResult.success) return challengeResult;

        const challenge = challengeResult.data;
        if (challenge.difficulty > MAX_DIFFICULTY) {
            return Result.fail<SignupRegistration>(new ErrorMessage('ApiError', 'Signup is unavailable right now. Please try again later.'));
        }

        const accountKey = deriveAccountKey(words);
        const deviceKeys = this.nonceSigner.generateDeviceKeys();
        const device = currentDeviceInfo();

        try {
            const challengeBytes = Buffer.from(challenge.challenge, 'base64');
            const powNonce = await solveProofOfWork(challengeBytes, challenge.difficulty);

            const signupResult = await this.authenticationProvider.signup({
                username,
                accountPublicKey: Buffer.from(accountKey.publicKey).toString('base64'),
                challengeId: challenge.challengeId,
                powNonce: Number(powNonce),
                challengeSignature: signSignupChallenge(accountKey, challengeBytes),
                devicePublicKey: deviceKeys.publicKey,
                deviceApproval: signDeviceApproval(accountKey, Buffer.from(deviceKeys.publicKey, 'base64')),
                deviceAppVersion: device.appVersion,
                deviceType: device.type,
                devicePlatform: device.platform,
            });
            if (!signupResult.success) return signupResult;

            return Result.success({
                userId: signupResult.data.userId,
                deviceId: signupResult.data.deviceId,
                connectionId: signupResult.data.deviceConnectionId,
                devicePublicKey: deviceKeys.publicKey,
                devicePrivateKey: deviceKeys.privateKey,
            });
        } finally {
            accountKey.secretKey.fill(0);
        }
    }
}

function confirmationsMatch(pending: PendingSignup, confirmations: string[]): boolean {
    return (
        confirmations.length === pending.confirmIndices.length &&
        pending.confirmIndices.every((index, i) => confirmations[i]?.trim().toLowerCase() === pending.words[index])
    );
}
