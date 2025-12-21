import { ChatPrivileges } from '../../../../../Domain/Enums/ChatPrivileges.js';
import { MessageDto } from '../../Dtos/MessageDto.js';

export class CreateChatCommand implements MediatorRequest {
    type = CreateChatCommand.name;
    chatId: string;
    friendId: string;
    chatMemberId: string;
    chatMemberPrivilege: ChatPrivileges;
    message: MessageDto | null;

    constructor(
        id: string,
        friendId: string,
        chatMemberId: string,
        chatMemberPrivilege: ChatPrivileges,
        message: MessageDto | null = null,
    ) {
        this.chatId = id;
        this.friendId = friendId;
        this.chatMemberId = chatMemberId;
        this.chatMemberPrivilege = chatMemberPrivilege;
        this.message = message;
    }
}
