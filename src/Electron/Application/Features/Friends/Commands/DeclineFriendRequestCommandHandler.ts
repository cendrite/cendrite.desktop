import { Result } from '#shared/Result/Result';
import { IFriendProvider } from '#electron/Application/Contracts/Providers/IFriendProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { DeclineFriendRequestCommand } from '#shared/Friends/DeclineFriendRequest';

export class DeclineFriendRequestCommandHandler implements Handler<DeclineFriendRequestCommand> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public handle(cmd: DeclineFriendRequestCommand): Promise<Result> {
        return this.friendProvider.declineFriendRequest(cmd.friendTag);
    }
}
