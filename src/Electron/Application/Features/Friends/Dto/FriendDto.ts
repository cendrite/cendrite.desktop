import {Friend} from "../../../../Domain/Aggregates/Friend.js";

export class FriendDto {
    public id!: string;

    public username!: string;

    public displayName!: string | null;

    public profilePicture!: string | null;

    public connectionIds!: string[];

    public static MapFrom(friend: Friend, profilePictureBase64: string | null): FriendDto
    {
        const dto = new FriendDto();
        dto.id = friend.id;
        dto.username = friend.username;
        dto.displayName = friend.displayName ?? null;
        dto.profilePicture = profilePictureBase64;
        dto.connectionIds = friend.connectionIds.map((connectionId) => connectionId.connectionId);
        return dto;
    }
}