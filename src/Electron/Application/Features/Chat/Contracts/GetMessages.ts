export class GetMessagesQuery implements MediatorRequest {
    type: string = GetMessagesQuery.name;
    constructor(
        public readonly chatId: string,
        public readonly offset: number,
        public readonly take: number,
    ) { }
}
