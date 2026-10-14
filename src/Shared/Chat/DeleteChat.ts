export class DeleteChatCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    type: string = DeleteChatCommand.name;
    constructor(public chatId: string) { }
}
