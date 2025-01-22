import {CreateUserCommand} from "./CreateUserCommand.js";
import {Handler} from "../../../Mediator/Handler.js";
import {CreateUserDto} from "./CreateUserDto.js";
import { Result } from "../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../Shared/Result/ErrorMessage.js";
import {UserRepository} from "../../../../Persistence/Repositories/UserRepository.js";
import {User} from "../../../../Persistence/Entities/User.js";

export class CreateUserCommandHandler implements Handler<CreateUserCommand, CreateUserDto>
{
    public async handle(request: CreateUserCommand): Promise<Result<CreateUserDto>>
    {
        try
        {
            const _userRepository = new UserRepository();
            const user = new User();
            user.id = request.id;
            user.username = request.username;
            user.userTag = request.userTag;
            user.profilePictureUrl = request.profilePictureUrl;
            user.displayName = request.displayName;

            console.log('Creating User:', user);

            await _userRepository.create(user);

            const dto = CreateUserDto.MapFrom(user);

            return Result.success<CreateUserDto>(dto);
        }
        catch(error: unknown)
        {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Create User Failed:', errorMessage);
            return Result.fail<CreateUserDto>(new ErrorMessage(null, "Create User Failed"));
        }
    }
}