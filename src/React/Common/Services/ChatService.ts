import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {Result} from "../../../Shared/Result/Result.ts";
import {CreateChatDto} from "../../../Electron/Application/Features/Chat/Commands/CreateChatDto.ts";
import {CreateChatCommand} from "../../../Electron/Application/Features/Chat/Commands/CreateChatCommand.ts";
import {v4 as uuid} from 'uuid';
import {ChatPrivileges} from "../../../Electron/Domain/Enums/ChatPrivileges.ts";
import {ChatMemberViewModel} from "../../Models/ChatMemberViewModel.ts";
import { Contact } from "../../Models/Contact.ts";


export class ChatService {

    public async createChat(contact: Contact): Promise<ChatViewModel>{
        const command = new CreateChatCommand(
            uuid().toString(),
            contact.id,
            uuid().toString(),
            ChatPrivileges.Admin
        )

        const result = await window.electron.sendRequestAsync<Result<CreateChatDto>>(command);
        if (result.success) {
            const memberDto = result.data!.member;
            const chatMember = new ChatMemberViewModel(
                memberDto.id,
                memberDto.privilege,
                memberDto.displayName,
                contact
            );

            return new ChatViewModel(result.data!.id, [chatMember]);

        } else {
            throw new Error("Failed to create chat");
        }
    }
}
