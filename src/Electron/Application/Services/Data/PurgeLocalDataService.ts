import {RefreshTokenRepository} from "../../../Persistence/Repositories/RefreshTokenRepository.js";
import {DeviceRepository} from "../../../Persistence/Repositories/DeviceRepository.js";
import {UserRepository} from "../../../Persistence/Repositories/UserRepository.js";
import {FriendRepository} from "../../../Persistence/Repositories/FriendRepository.js";
import { ChatRepository } from "../../../Persistence/Repositories/ChatRepository.js";

export class PurgeLocalDataService {

    public async purgeLocalData(): Promise<void>{
        console.log("Purging local data...");

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

        console.log("Local data purged.");
    }
}