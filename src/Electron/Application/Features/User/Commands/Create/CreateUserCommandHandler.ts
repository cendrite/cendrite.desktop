import { UserRepository } from "../../../../../Persistence/Repositories/UserRepository.js";
import {CreateUserCommand} from "./CreateUserCommand.js";
import {Result} from "../../../../../../Shared/Result/Result.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {CreateUserDto} from "./CreateUserDto.js";
import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import {ImageConverter} from "../../../../Services/Images/ImageConverter.js";
import { User } from "../../../../../Domain/Aggregates/User.js";
import {UserConnectionId} from "../../../../../Domain/Entities/UserConnectionId.js";


export class CreateUserCommandHandler implements Handler<CreateUserCommand, CreateUserDto>
{
    public async handle(request: CreateUserCommand): Promise<Result<CreateUserDto>>
    {
        try
        {
            const _userRepository = new UserRepository();

            const profilePicture = request.base64ProfilePicture ? await ImageConverter.base64ToBuffer(request.base64ProfilePicture) : null;
            const user = new User(request.id, request.username, request.userTag, profilePicture, request.displayName);

             user.connectionIds = request.connectionIds.map(connectionId => new UserConnectionId(connectionId, user));

            const savedUser = await _userRepository.create(user);

            const dto = CreateUserDto.MapFrom(savedUser, request.base64ProfilePicture);

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
