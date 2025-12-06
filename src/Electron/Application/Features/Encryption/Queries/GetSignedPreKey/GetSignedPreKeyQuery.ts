export class GetSignedPreKeyQuery implements MediatorRequest {
    public type = GetSignedPreKeyQuery.name;
    public constructor(public readonly signedPreKeyId: number) {}
}
