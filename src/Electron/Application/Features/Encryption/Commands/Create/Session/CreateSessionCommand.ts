export class CreateSessionCommand implements MediatorRequest {
    public type = CreateSessionCommand.name;
    constructor(
        public readonly encodedAddress: string,
        public readonly record: string,
    ) { }
}
