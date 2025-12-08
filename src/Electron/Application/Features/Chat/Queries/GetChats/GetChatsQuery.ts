export class GetChatsQuery implements MediatorRequest {
    type: string = GetChatsQuery.name;
    constructor(
        public readonly chatCount: number,
        public readonly msgCountPerChat: number,
    ) { }
}
