import { User } from "../../Models/User";

export enum UserActionType {
    Initialize = -1,
    UpdateUsername = 0,
    UpdateDisplayName = 1,
    UpdateProfilePicture = 2,
    AddConnectionId = 3,
    RemoveConnectionId = 4,
    Clear = 5,
}

export type UserAction =
    | { type: UserActionType.Initialize; payload: User  }
    | { type: UserActionType.UpdateUsername; payload: { username: string } }
    | { type: UserActionType.UpdateDisplayName; payload: { displayName: string | null } }
    | { type: UserActionType.UpdateProfilePicture; payload: { base64ProfilePicture: string | null } }
    | { type: UserActionType.AddConnectionId; payload: { connectionId: string } }
    | { type: UserActionType.RemoveConnectionId; payload: { connectionId: string } }
    | { type: UserActionType.Clear };

export const userReducer = (state: User | null, action: UserAction): User | null => {
    switch (action.type) {
        case UserActionType.Initialize:
            return action.payload;

        case UserActionType.UpdateUsername:
            if (state) {
                return new User(
                    state.id,
                    action.payload.username,
                    state.userTag,
                    state.deviceId,
                    state.connectionId,
                    state.externalConnectionIds,
                    state.base64ProfilePicture,
                    state.displayName
                );
            }
            return state;

        case UserActionType.UpdateDisplayName:
            if (state) {
                return new User(
                    state.id,
                    state.username,
                    state.userTag,
                    state.deviceId,
                    state.connectionId,
                    state.externalConnectionIds,
                    state.base64ProfilePicture,
                    action.payload.displayName
                );
            }
            return state;

        case UserActionType.UpdateProfilePicture:
            if (state) {
                return new User(
                    state.id,
                    state.username,
                    state.userTag,
                    state.deviceId,
                    state.connectionId,
                    state.externalConnectionIds,
                    action.payload.base64ProfilePicture,
                    state.displayName
                );
            }
            return state;

        case UserActionType.AddConnectionId:
            if (state) {
                return new User(
                    state.id,
                    state.username,
                    state.userTag,
                    state.deviceId,
                    state.connectionId,
                    [...state.externalConnectionIds, action.payload.connectionId],
                    state.base64ProfilePicture,
                    state.displayName
                );
            }
            return state;
        case UserActionType.RemoveConnectionId:
            if (state) {
                return new User(
                    state.id,
                    state.username,
                    state.userTag,
                    state.deviceId,
                    state.connectionId,
                    state.externalConnectionIds.filter(id => id !== action.payload.connectionId),
                    state.base64ProfilePicture,
                    state.displayName
                );
            }
            return state;   

        case UserActionType.Clear:
            return null;


        default:
            return state;
    }
};
