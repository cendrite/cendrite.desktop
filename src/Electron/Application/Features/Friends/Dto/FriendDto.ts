import {Friend} from "../../../../Domain/Aggregates/Friend.js";

export class FriendDto {
    public id!: string;
    public username!: string;
    public displayName!: string | null;
    public avatarKey!: string | null;
    public connectionIds!: string[];

    public static MapFrom(friend: Friend): FriendDto
    {
        const dto = new FriendDto();
        dto.id = friend.id;
        dto.username = friend.username;
        dto.displayName = friend.displayName ?? null;
        dto.avatarKey = friend.avatarKey;
        dto.connectionIds = friend.connectionIds.map((connectionId) => connectionId.connectionId);
        return dto;
    }
}
