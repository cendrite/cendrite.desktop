import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { MessageSentCommand } from '#electron/Application/Features/Chat/Events/MessageSentEventHandler';
import { Mediator } from '#electron/Application/Mediator/Mediator';
import { IGroupService } from '#electron/Application/Services/GroupService';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { Payload } from '#electron/Domain/Protocol/Payload';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { SignalManager } from '../Signal/SignalManager.js';
import { Pump } from './Pump.js';

const GROUP_CHANGE_RETRY_MS = 5_000;
const MAX_PENDING_GROUP_CHANGES = 200;

export class MessagePump extends Pump {
    private readonly nextChangeAttempt = new Map<string, number>();

    constructor(
        private readonly chatStore: IChatStore,
        private readonly eventRepository: IOutboxRepository,
        private readonly mediator: Mediator,
        private readonly mainWindow: Electron.BrowserWindow,
        private readonly signalManager: SignalManager,
        private readonly groupRepository: IGroupRepository,
        private readonly groupService: IGroupService,
        private readonly userRepository: IUserRepository,
    ) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            if (!this.signalManager.isConnected('Messaging')) {
                await this.sleep(5_000);
                continue;
            }

            if (await this.processGroupChange()) continue;

            const msgEvent = await this.eventRepository.getEvent<MessageSentEvent>(MessageSentEvent.type);

            if (!msgEvent) {
                await this.sleep(1_000);
                continue;
            }

            await this.processMessageEvent(msgEvent);
        }
    }

    public async processGroupChange(): Promise<boolean> {
        const pending = await this.eventRepository.getEvents<GroupChangeEvent>(GroupChangeEvent.type, MAX_PENDING_GROUP_CHANGES);
        const attempted = new Set<string>();

        for (const change of pending) {
            if (attempted.has(change.groupId)) continue;
            attempted.add(change.groupId);

            if (Date.now() < (this.nextChangeAttempt.get(change.groupId) ?? 0)) continue;

            try {
                if (await this.groupService.deliverChange(change)) {
                    this.nextChangeAttempt.delete(change.groupId);
                    return true;
                }
            } catch (error) {
                console.error(`MessagePump: could not deliver a change for group ${change.groupId}`, error);
            }

            this.nextChangeAttempt.set(change.groupId, Date.now() + GROUP_CHANGE_RETRY_MS);
        }

        return false;
    }

    public async processMessageEvent(msgEvent: MessageSentEvent): Promise<void> {
        const pendingMessage = await this.chatStore.getMessage(msgEvent.message.chatId, msgEvent.message.id);

        if (!pendingMessage) {
            console.error(
                `MessagePump: Message with ID ${msgEvent.message.id} not found in chat ${msgEvent.message.chatId}`,
            );
            await this.eventRepository.deleteEvent(msgEvent.id);
            return;
        }

        const outcome = await this.send(msgEvent);

        await this.chatStore.markMessage(pendingMessage.id, outcome.status);

        if (outcome.status === DeliveryStatus.Failed) {
            await this.eventRepository.markAsFailed(msgEvent.id, outcome.error);
        } else {
            await this.eventRepository.deleteEvent(msgEvent.id);
        }

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'deliveryStatus',
            chatId: pendingMessage.chatId,
            messageIds: [pendingMessage.id],
            status: outcome.status,
        });
    }

    private async send(msgEvent: MessageSentEvent): Promise<{ status: DeliveryStatus; error: string }> {
        let event = msgEvent;
        const isGroup = (await this.groupRepository.get(event.message.chatId)) !== null;

        if (isGroup) {
            const startGroupResult = await this.groupService.startGroup(event.message.chatId);
            if (!startGroupResult.success) return { status: DeliveryStatus.Failed, error: startGroupResult.errorMessage.message };

            if (startGroupResult.data) {
                const payloads: Record<string, Payload[]> = {};
                for (const [connectionId, strap] of Object.entries(startGroupResult.data)) {
                    payloads[connectionId] = [strap];
                }

                event = new MessageSentEvent(event.id, event.message, event.connectionIds, event.participants, event.occurredOn, payloads);
                await this.eventRepository.appendEvent(event);
                this.nextChangeAttempt.delete(event.message.chatId);
            }
        }

        const recipients = isGroup ? await this.currentGroupDevices(event) : event.connectionIds;

        const messageSentResult = await this.mediator.send(
            new MessageSentCommand(event.message, recipients, event.participants, event.payloads),
        );

        if (!messageSentResult.success) return { status: DeliveryStatus.Failed, error: messageSentResult.errorMessage.message };
        if (messageSentResult.data === DeliveryStatus.Failed) return { status: DeliveryStatus.Failed, error: 'No device accepted the message' };

        return { status: messageSentResult.data, error: '' };
    }

    private async currentGroupDevices(event: MessageSentEvent): Promise<string[]> {
        const chat = await this.chatStore.getChatWithMembers(event.message.chatId);
        const user = await this.userRepository.get(true);
        const current = new Set([
            ...chat.members.flatMap((member) => member.devices),
            ...(user.connectionIds ?? []).map((connection) => connection.connectionId),
        ]);

        return event.connectionIds.filter((connectionId) => current.has(connectionId));
    }
}
