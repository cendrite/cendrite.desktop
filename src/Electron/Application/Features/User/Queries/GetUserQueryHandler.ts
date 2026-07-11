import {GetUserQuery} from "./GetUserQuery.js";
import {GetUserDto} from "./GetUserDto.js";
import { Handler } from "../../../Mediator/Handler.js";
import { Result } from "../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../Shared/Result/ErrorMessage.js";
import { UserRepository } from "../../../../Infrastructure/Persistence/Repositories/UserRepository.js";

export class GetUserQueryHandler implements Handler<GetUserQuery, GetUserDto> {
    public async handle(_request: GetUserQuery): Promise<Result<GetUserDto>> {
        try {
            const _userRepository = new UserRepository();
            const user = await _userRepository.get(true);

            if(user == null){
                return Result.fail<GetUserDto>(new ErrorMessage(null, "User not found"));
            }

            const dto = GetUserDto.MapFrom(user);

            return Result.success<GetUserDto>(dto);
        }
        catch(error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Get User Failed:', errorMessage);
            return Result.fail<GetUserDto>(new ErrorMessage(null, "Get User Failed"));
        }
    }
}
