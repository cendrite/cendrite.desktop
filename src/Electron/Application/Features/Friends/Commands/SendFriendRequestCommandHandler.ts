import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendProvider } from '../../../Contracts/Providers/IFriendProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendFriendRequestCommand } from '../Contracts/SendFriendRequest.js';

export class SendFriendRequestCommandHandler implements Handler<SendFriendRequestCommand> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public handle(cmd: SendFriendRequestCommand): Promise<Result> {
        return this.friendProvider.sendFriendRequest(cmd.friendTag);
    }
}
