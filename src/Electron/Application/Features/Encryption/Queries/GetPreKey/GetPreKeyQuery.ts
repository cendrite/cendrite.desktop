export class GetPreKeyQuery implements MediatorRequest {
    public type = GetPreKeyQuery.name;
    constructor(public readonly preKeyId: number) {}
}
