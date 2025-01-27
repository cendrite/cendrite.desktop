import { Device } from "../../../../../Persistence/Entities/Device.js";

export class GetDeviceDto {
    id!: string;

    private constructor() {
    }

    public static MapFrom(device: Device): GetDeviceDto {
        const dto = new GetDeviceDto();
        dto.id = device.id;
        return dto;
    }
}