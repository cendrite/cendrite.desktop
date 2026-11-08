import { describe, expect, test, vi } from 'vitest';
import { MessageSentCommand, MessageSentCommandHandler } from '#electron/Application/Features/Chat/Events/MessageSentEventHandler';
import { UntrustedDeviceError } from '#electron/Application/Contracts/Services/ISessionManager';
import { ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import { MessageContract } from '#shared/Models/MessageContract';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { Result } from '#shared/Result/Result';

function setup(untrusted: string[]) {
    const sessionManager = {
        encrypt: vi.fn(async (_envelope: unknown, connectionId: string) => {
            if (untrusted.includes(connectionId)) throw new UntrustedDeviceError(connectionId);
            return `cipher-for-${connectionId}`;
        }),
    };
    const messageHubHandler = { sendMessage: vi.fn(async (_messages: ServerMessage[]) => DeliveryStatus.Sent) };
    const mediaService = { upload: vi.fn(async () => Result.success([])) };

    const sut = new MessageSentCommandHandler(sessionManager as never, messageHubHandler as never, mediaService as never);
    const message = new MessageContract('message-1', 'chat-1', 'me', 'hi', new Date(), [], DeliveryStatus.Pending, 'token');

    return { sut, messageHubHandler, message };
}

describe('MessageSentCommandHandler', () => {
    test('skips an untrusted device and still sends to the others', async () => {
        const { sut, messageHubHandler, message } = setup(['bad-device']);

        const result = await sut.handle(new MessageSentCommand(message, ['good-device', 'bad-device'], [], {}));

        expect(result.success && result.data).toBe(DeliveryStatus.Sent);
        const sent = messageHubHandler.sendMessage.mock.calls[0][0];
        expect(sent.map((m) => m.recipientId)).toEqual(['good-device']);
    });

    test('fails without sending when every device is untrusted', async () => {
        const { sut, messageHubHandler, message } = setup(['bad-device']);

        const result = await sut.handle(new MessageSentCommand(message, ['bad-device'], [], {}));

        expect(result.success && result.data).toBe(DeliveryStatus.Failed);
        expect(messageHubHandler.sendMessage).not.toHaveBeenCalled();
    });
});
