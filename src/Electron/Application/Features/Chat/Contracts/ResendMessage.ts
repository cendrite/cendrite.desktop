export class ResendMessageCommand implements MediatorRequest {
    public readonly type: string = 'ResendMessageCommand'
    constructor(
        public readonly ChatId: string,
        public readonly MessageId: string,
        public readonly connectionIds: string[],
        public readonly participants: string[],
    ) { }
}
