import { Device } from '#electron/Domain/Entities/Device';

export interface IDeviceRepository {
    create(device: Device): Promise<Device>;
    get(): Promise<Device | null>;
    delete(): Promise<void>;
}
