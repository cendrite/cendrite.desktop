import { RefreshTokenRepository } from '../../../Infrastructure/Persistence/Repositories/RefreshTokenRepository.js';
import { DeviceRepository } from '../../../Infrastructure/Persistence/Repositories/DeviceRepository.js';
import { UserRepository } from '../../../Infrastructure/Persistence/Repositories/UserRepository.js';
import { FriendRepository } from '../../../Infrastructure/Persistence/Repositories/FriendRepository.js';
import { ProtocolStore } from '../../../Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { ChatStore } from '../../../Infrastructure/Persistence/Repositories/ChatStore.js';

export class PurgeLocalDataService {

    public async purgeLocalData(): Promise<void> {
        console.log('Purging local data...');

        const userRepo = new UserRepository();
        const deviceRepo = new DeviceRepository();
        const refreshTokenRepo = new RefreshTokenRepository();
        const friendRepo = new FriendRepository();
        const chatStore = new ChatStore();
        const protocolStore = new ProtocolStore();

        await userRepo.delete();
        await deviceRepo.delete();
        await refreshTokenRepo.delete();
        await friendRepo.deleteAll();
        await chatStore.clearStore();
        await protocolStore.deleteAll();

        console.log('Local data purged.');
    }
}
