import { Result } from '#shared/Result/Result';
import { IFriendProvider } from '#electron/Application/Contracts/Providers/IFriendProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { SendFriendRequestCommand } from '#shared/Friends/SendFriendRequest';

export class SendFriendRequestCommandHandler implements Handler<SendFriendRequestCommand> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public handle(cmd: SendFriendRequestCommand): Promise<Result> {
        return this.friendProvider.sendFriendRequest(cmd.friendTag);
    }
}
