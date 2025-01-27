import {RefreshTokenRepository} from "../../../Persistence/Repositories/RefreshTokenRepository.js";
import {DeviceRepository} from "../../../Persistence/Repositories/DeviceRepository.js";
import {UserRepository} from "../../../Persistence/Repositories/UserRepository.js";

export class PurgeLocalDataService {

    public async purgeLocalData(): Promise<void>{
        console.log("Purging local data...");

        const userRepo = new UserRepository();
        const deviceRepo = new DeviceRepository();
        const refreshTokenRepo = new RefreshTokenRepository();

        await userRepo.delete();
        await deviceRepo.delete();
        await refreshTokenRepo.delete();

        console.log("Local data purged.");
    }
}