export class InitializeTokenManagerCommand implements MediatorRequest {
    public type = 'InitializeTokenManagerCommand';
    constructor(
        public readonly userId: string,
        public readonly deviceId: string,
    ) { }
}
