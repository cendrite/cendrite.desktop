import {Result} from "../../../../../Shared/Result/Result.js";
import {Handler} from "../../../Mediator/Handler.js";
import {CreateChatCommand} from "./CreateChatCommand.js";
import {CreateChatDto} from "./CreateChatDto.js";
import {ErrorMessage} from "../../../../../Shared/Result/ErrorMessage.js";
import {Chat} from "../../../../Domain/Aggregates/Chat.js";
import {ChatMember} from "../../../../Domain/Entities/ChatMember.js";
import {FriendRepository} from "../../../../Persistence/Repositories/FriendRepository.js";
import {ChatRepository} from "../../../../Persistence/Repositories/ChatRepository.js";
import {Friend} from "../../../../Domain/Aggregates/Friend.js";

export class CreateChatCommandHandler implements Handler<CreateChatCommand, CreateChatDto> {
    async handle(request: CreateChatCommand): Promise<Result<CreateChatDto>> {
        try{
            const friend = await this.getFriend(request.friendId);
            const chatMember = ChatMember.create(request.chatMemberId, request.chatMemberPrivilege, friend);

            const _chatRepository = new ChatRepository();
            const chat = await _chatRepository.create(new Chat(request.chatId, [chatMember]));

            const chatMemberDto = new CreateChatDto(chat, chatMember);

            return Result.success<CreateChatDto>(chatMemberDto);

        }catch(error: unknown){
            console.log('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Create Device Failed:', errorMessage);
            return Result.fail<CreateChatDto>(new ErrorMessage(null, "Create Device Failed"));
        }
    }

    private async getFriend(id: string) : Promise<Friend>{
        const friendRepository = new FriendRepository();
        const friend = await friendRepository.getById(id);
        if (!friend) {
            throw new Error("Friend not found");
        }
        return friend;
    }
}