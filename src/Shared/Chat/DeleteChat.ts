export class DeleteChatCommand implements MediatorRequest {
    type: string = DeleteChatCommand.name;
    constructor(public chatId: string) { }
}
