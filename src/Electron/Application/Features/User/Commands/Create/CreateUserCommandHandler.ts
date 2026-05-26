import { UserRepository } from '../../../../../Persistence/Repositories/UserRepository.js';
import { CreateUserCommand } from './CreateUserCommand.js';
import { Result } from '../../../../../../Shared/Result/Result.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { CreateUserDto } from './CreateUserDto.js';
import { ErrorMessage } from '../../../../../../Shared/Result/ErrorMessage.js';
import { User } from '../../../../../Domain/Aggregates/User.js';
import { UserConnectionId } from '../../../../../Domain/Entities/UserConnectionId.js';

export class CreateUserCommandHandler implements Handler<CreateUserCommand, CreateUserDto> {

    public async handle(cmd: CreateUserCommand): Promise<Result<CreateUserDto>> {
        try {
            const _userRepository = new UserRepository();

            const user = new User(
                cmd.id,
                cmd.username,
                cmd.userTag,
                cmd.avatarKey,
                cmd.displayName,
            );

            user.connectionIds = cmd.connectionIds.map((connectionId) => new UserConnectionId(connectionId, user));

            const savedUser = await _userRepository.create(user);

            const dto = CreateUserDto.MapFrom(savedUser, cmd.avatarKey);

            return Result.success<CreateUserDto>(dto);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Create User Failed:', errorMessage);
            return Result.fail<CreateUserDto>(new ErrorMessage(null, 'Create User Failed'));
        }
    }
}
