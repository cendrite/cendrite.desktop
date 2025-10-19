import { RefreshTokenRepository } from '../../../Persistence/Repositories/RefreshTokenRepository.js';
import { DeviceRepository } from '../../../Persistence/Repositories/DeviceRepository.js';
import { UserRepository } from '../../../Persistence/Repositories/UserRepository.js';
import { FriendRepository } from '../../../Persistence/Repositories/FriendRepository.js';
import { ChatRepository } from '../../../Persistence/Repositories/ChatRepository.js';
import { IdentityCacheRepository } from '../../../Persistence/Repositories/IdentityCacheRepository.js';
import { SenderKeyRepository } from '../../../Persistence/Repositories/SenderKeyRepository.js';
import { SessionRecordRepository } from '../../../Persistence/Repositories/SessionRecordRepository.js';
import { EcPreKeyRepository } from '../../../Persistence/Repositories/EcPreKeyRepository.js';
import { SignedPreKeysRepository } from '../../../Persistence/Repositories/SignedPreKeysRepository.js';

export class PurgeLocalDataService {
    public async purgeLocalData(): Promise<void> {
        console.log('Purging local data...');

        const userRepo = new UserRepository();
        const deviceRepo = new DeviceRepository();
        const refreshTokenRepo = new RefreshTokenRepository();
        const friendRepo = new FriendRepository();
        const chatRepo = new ChatRepository();

        await userRepo.delete();
        await deviceRepo.delete();
        await refreshTokenRepo.delete();
        await friendRepo.deleteAll();
        await chatRepo.deleteAll();
        await this.clearKeyStore();

        console.log('Local data purged.');
    }

    private async clearKeyStore(): Promise<void> {
        const seshRecordRepo = new SessionRecordRepository();
        const senderKeyRepo = new SenderKeyRepository();
        const identityCacheRepo = new IdentityCacheRepository();
        const ecPrekeyRepo = new EcPreKeyRepository(); 
        const signedPrekeyRepo = new SignedPreKeysRepository();
        await seshRecordRepo.deleteAll();
        await senderKeyRepo.deleteAll();
        await identityCacheRepo.deleteAll();
        await ecPrekeyRepo.deleteAll();
        await signedPrekeyRepo.deleteAll();
    }
}
