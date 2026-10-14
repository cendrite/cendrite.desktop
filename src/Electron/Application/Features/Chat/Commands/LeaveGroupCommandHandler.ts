import { Handler } from "#electron/Application/Mediator/Handler";
import { Result } from "#shared/Result/Result";
import { LeaveGroupCommand } from "#shared/Chat/LeaveGroup";
import { IMessageHubHandler } from "#electron/Application/Contracts/Services/IMessageHubHandler";
import { IChatStore } from "#electron/Application/Contracts/Repositories/IChatStore";
import { ILedgerWriter } from "#electron/Application/Contracts/Services/ILedgerWriter";
import { MemberRemovedOperation } from "#electron/Domain/Protocol/LedgerOperation";
import { ISessionManager } from "#electron/Application/Contracts/Services/ISessionManager";

export class LeaveGroupCommandHandler implements Handler<LeaveGroupCommand, void> {
    constructor(
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly chatStore: IChatStore,
        private readonly ledgerWriter: ILedgerWriter,
        private readonly sessionManager: ISessionManager,
    ) { }

    public async handle(cmd: LeaveGroupCommand): Promise<Result<void>> {
        const chat = await this.chatStore.getChat(cmd.chatId);

        if (!chat) {
            throw new Error(`Chat with ID ${cmd.chatId} not found`);
        }

        await this.ledgerWriter.append(cmd.chatId, new MemberRemovedOperation(
            cmd.userTag,
            cmd.userTag,
        ))

    }
}
