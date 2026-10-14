import { ChatContract } from '../Models/ChatContract.js';
export class GetChatsQuery implements MediatorRequest<ChatContract[]> {
    declare readonly _response?: ChatContract[];
    type: string = GetChatsQuery.name;
    constructor(
        public readonly chatCount: number,
        public readonly msgCountPerChat: number,
    ) { }
}
