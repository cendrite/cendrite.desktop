export class GetUntrustedDevicesQuery implements MediatorRequest<string[]> {
    declare readonly _response?: string[];
    public readonly type = 'GetUntrustedDevicesQuery';
}
