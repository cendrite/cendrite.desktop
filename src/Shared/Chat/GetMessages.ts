import { MessageContract } from '../Models/MessageContract.js';
export class GetMessagesQuery implements MediatorRequest<MessageContract[]> {
    declare readonly _response?: MessageContract[];
    type: string = GetMessagesQuery.name;
    constructor(
        public readonly chatId: string,
        public readonly offset: number,
        public readonly take: number,
    ) { }
}
