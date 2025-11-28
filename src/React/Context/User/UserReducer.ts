import { User } from "../../Models/User";

export enum UserContextActionType {
    Initialize = -1,
    UpdateUsername = 0,
    UpdateDisplayName = 1,
    UpdateProfilePicture = 2
}

export type UserContextAction =
    | { type: UserContextActionType.Initialize; payload: User  }
    | { type: UserContextActionType.UpdateUsername; payload: { username: string } }
    | { type: UserContextActionType.UpdateDisplayName; payload: { displayName: string | null } }
    | { type: UserContextActionType.UpdateProfilePicture; payload: { base64ProfilePicture: string | null } };

export const userReducer = (state: User | null, action: UserContextAction): User | null => {
    switch (action.type) {
        case UserContextActionType.Initialize:
            return action.payload;

        case UserContextActionType.UpdateUsername:
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

        case UserContextActionType.UpdateDisplayName:
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

        case UserContextActionType.UpdateProfilePicture:
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

        default:
            return state;
    }
};
