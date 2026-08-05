import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendProvider } from '../../../Contracts/Providers/IFriendProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { DeclineFriendRequestCommand } from '../Contracts/DeclineFriendRequest.js';

export class DeclineFriendRequestCommandHandler implements Handler<DeclineFriendRequestCommand> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public handle(cmd: DeclineFriendRequestCommand): Promise<Result> {
        return this.friendProvider.declineFriendRequest(cmd.friendTag);
    }
}
