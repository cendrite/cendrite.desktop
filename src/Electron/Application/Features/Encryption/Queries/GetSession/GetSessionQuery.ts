export class GetSessionQuery implements MediatorRequest {
    public type = GetSessionQuery.name;
    constructor(public readonly encodedAddress: string) {}
}
