import { Handler } from "#electron/Application/Mediator/Handler";
import { Result } from "#shared/Result/Result";
import { LeaveGroupCommand } from "#shared/Chat/LeaveGroup";
import { IMessageHubHandler, ServerMessage } from "#electron/Application/Contracts/Services/IMessageHubHandler";
import { IChatStore } from "#electron/Application/Contracts/Repositories/IChatStore";
import { ILedgerWriter } from "#electron/Application/Contracts/Services/ILedgerWriter";
import { MemberRemovedOperation } from "#electron/Domain/Protocol/LedgerOperation";
import { ISessionManager } from "#electron/Application/Contracts/Services/ISessionManager";
import { GroupUpdatedPayload } from "#electron/Domain/Protocol/Payload";
import { IGroupRepository } from "#electron/Application/Contracts/Repositories/IGroupRepository";

export class LeaveGroupCommandHandler implements Handler<LeaveGroupCommand, void> {
    constructor(
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly chatStore: IChatStore,
        private readonly ledgerWriter: ILedgerWriter,
        private readonly sessionManager: ISessionManager,
        private readonly groupRepository: IGroupRepository,
    ) { }

    public async handle(cmd: LeaveGroupCommand): Promise<Result<void>> {
        const chat = await this.chatStore.getChat(cmd.chatId);

        if (!chat) {
            throw new Error(`Chat with ID ${cmd.chatId} not found`);
        }

        const group = await this.groupRepository.get(cmd.chatId);

        if (!group) {
            throw new Error(`Group with ID ${cmd.chatId} not found`);
        }

        await this.ledgerWriter.append(cmd.chatId, new MemberRemovedOperation(
            cmd.userTag,
            cmd.userTag,
        ));


        const msgs: ServerMessage[] = [];

        for (const connectionId of cmd.connectionIds) {
            const envelope = new Envelope([
                new GroupUpdatedPayload(
                    cmd.chatId,
                    chat.groupName,
                ),
            ]);
        }

    }
}
