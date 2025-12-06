export class CreateIdentityCommand implements MediatorRequest {
    public type = CreateIdentityCommand.name;
    constructor(
        public readonly encodedAddress: string,
        public readonly pubKey: Buffer,
        public readonly nonBlockingApproval: boolean
    ) { }
}
