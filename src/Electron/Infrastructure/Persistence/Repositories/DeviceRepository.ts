import { Repository } from 'typeorm/repository/Repository.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { CryptographyService } from '../Encryption/CryptographyService.js';
import { Device } from '#electron/Domain/Entities/Device';
import { IDeviceRepository } from '#electron/Application/Contracts/Repositories/IDeviceRepository';

export class DeviceRepository implements IDeviceRepository {
    private repository: Repository<Device>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.repository = getDbContext().getRepository(Device);
    }

    public async create(device: Device): Promise<Device> {
        device.privateKey = await this.cryptoService.encrypt(device.privateKey);
        return await this.repository.save(device);
    }

    public async get(): Promise<Device | null> {
        const device = await this.repository.find({ take: 1 });
        if (device.length === 0) {
            return null;
        }

        device[0].privateKey = await this.cryptoService.decrypt(device[0].privateKey);

        return device[0];
    }

    public async delete(): Promise<void> {
        await this.repository.clear();
    }
}
