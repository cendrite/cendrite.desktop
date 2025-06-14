import { Device } from "../../../../../Domain/Entities/Device.js";

export class GetDeviceDto {
    id!: string;
    connectionId!: string;

    private constructor() {
    }

    public static MapFrom(device: Device): GetDeviceDto {
        const dto = new GetDeviceDto();
        dto.id = device.id;
        dto.connectionId = device.connectionId;
        return dto;
    }
}