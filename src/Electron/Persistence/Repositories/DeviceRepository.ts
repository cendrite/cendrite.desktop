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
        device.privateKey = await this.cryptoSerivce.encrypt(device.privateKey);
        return await this.repository.save(device);
    }

    public async get(): Promise<Device> {
        const device = await this.repository.find({ take: 1 });
        if (device.length === 0) {
            throw new Error("No device found");
        }
        device[0].privateKey = await this.cryptoSerivce.decrypt(device[0].privateKey);

        return device[0];
    }
}