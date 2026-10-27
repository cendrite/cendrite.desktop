export class GetDevicesQuery implements MediatorRequest<DeviceDto[]> {
    declare readonly _response?: DeviceDto[];
    public readonly type = 'GetDevicesQuery';
}

export interface DeviceDto {
    id: string;
    name: string;
    type: string;
    platform: string;
    lastSeen: string | null;
    online: boolean | null;
}
