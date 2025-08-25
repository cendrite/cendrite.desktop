import {Handler} from "../../../../Mediator/Handler.js";
import {GetFriendsQuery} from "./GetFriendsQuery.js";
import {FriendDto} from "../../Dto/FriendDto.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import { FriendRepository } from "../../../../../Persistence/Repositories/FriendRepository.js";
import { ImageConverter } from "../../../../Services/Images/ImageConverter.js";

export class GetFriendsQueryHandler implements Handler<GetFriendsQuery, Array<FriendDto>> {

    public async handle(request: GetFriendsQuery): Promise<Result<FriendDto[]>> {
        try{
            const friendRepository = new FriendRepository();
            const friends = await friendRepository.getAll();

            if(friends === null || friends.length === 0)
            {
                return Result.success<FriendDto[]>(new Array<FriendDto>());
            }

            const friendDtos = await Promise.all(friends.map(async (friend) => {
                let profilePictureBase64: string | null = null;

                if (friend.profilePicture) {
                    profilePictureBase64 = await ImageConverter.bufferToBase64(friend.profilePicture);
                }

                return FriendDto.MapFrom(friend, profilePictureBase64);
            }));

            return Result.success<FriendDto[]>(friendDtos);
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('GetFriendsQuery failed:', errorMessage);
            return Result.fail<FriendDto[]>(new ErrorMessage(null, "GetFriendsQuery failed"));
        }
    }

}