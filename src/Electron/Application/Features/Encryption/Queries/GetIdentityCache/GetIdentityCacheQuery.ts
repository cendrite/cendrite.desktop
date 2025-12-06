export class GetIdentityCacheQuery implements MediatorRequest {
    public type = GetIdentityCacheQuery.name;
    constructor(public readonly encodedAddress: string) {}
}
