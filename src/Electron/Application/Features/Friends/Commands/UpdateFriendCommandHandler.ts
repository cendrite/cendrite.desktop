import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { Handler } from '../../../Mediator/Handler.js';

export class UpdateFriendCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    type = "UpdateFriendCommand";
    id: string;
    username: string | null;
    displayName: string | null;
    avatarKey: string | null;
    constructor(
        id: string,
        username: string | null = null,
        displayName: string | null = null,
        avatarKey: string | null = null
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarKey = avatarKey;
    }
}

export class UpdateFriendCommandHandler implements Handler<UpdateFriendCommand> {
    constructor(private readonly friendRepository: IFriendRepository) { }

    public async handle(request: UpdateFriendCommand): Promise<Result> {
        const friend = await this.friendRepository.getById(request.id);

        if (!friend) {
            return Result.fail(new ErrorMessage(null, 'Friend not found'));
        }

        if (request.username !== null) {
            friend.username = request.username;
        }
        if (request.displayName !== null) {
            friend.displayName = request.displayName;
        }
        if (request.avatarKey !== null) {
            friend.avatarKey = request.avatarKey;
        }

        await this.friendRepository.update(friend);
        return Result.success();
    }
}
