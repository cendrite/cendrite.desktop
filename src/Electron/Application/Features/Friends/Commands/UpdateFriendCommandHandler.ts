import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';

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
