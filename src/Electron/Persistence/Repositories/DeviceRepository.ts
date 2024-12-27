import { Repository } from "typeorm/repository/Repository.js";
import { Device } from "../Entities/Device.js";
import { DatabaseContext } from "../Context/DatabaseContext.js";
import { CryptographyService } from "../Encryption/CryptographyService.js";

export class DeviceRepository {
    private repository: Repository<Device>;
    private readonly cryptoSerivce = CryptographyService.getInstance();

    public constructor() {
        this.repository = DatabaseContext.getRepository(Device);
    }

    public async create(device: Device): Promise<Device> {
        return await this.repository.save(device);
    }
}