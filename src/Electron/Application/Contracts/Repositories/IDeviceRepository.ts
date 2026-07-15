import { Device } from '../../../Domain/Entities/Device.js';

export interface IDeviceRepository {
    create(device: Device): Promise<Device>;
    get(): Promise<Device | null>;
    delete(): Promise<void>;
}
