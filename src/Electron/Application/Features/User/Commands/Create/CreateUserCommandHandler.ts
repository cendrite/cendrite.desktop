import { UserRepository } from "../../../../../Persistence/Repositories/UserRepository.js";
import {CreateUserCommand} from "./CreateUserCommand.js";
import {Result} from "../../../../../../Shared/Result/Result.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {CreateUserDto} from "./CreateUserDto.js";
import { User } from "../../../../../Persistence/Entities/User.js";
import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import {ImageConverter} from "../../../../Services/Images/ImageConverter.js";


export class CreateUserCommandHandler implements Handler<CreateUserCommand, CreateUserDto>
{
    private readonly ImageConverter = new ImageConverter();
    public async handle(request: CreateUserCommand): Promise<Result<CreateUserDto>>
    {
        try
        {
            const _userRepository = new UserRepository();
            const user = new User();
            user.id = request.id;
            user.username = request.username;
            user.userTag = request.userTag;
            user.profilePicture = request.base64ProfilePicture ? await this.ImageConverter.base64ToBuffer(request.base64ProfilePicture) : null;
            user.displayName = request.displayName;

            console.log('Creating User:', user);

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