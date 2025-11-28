import React, { useCallback } from 'react';
import { UserContext } from './UserContext';
import { UserContextActionType, userReducer } from './UserReducer';
import { GetUserProfilePictureApi } from '../../Common/Api/UserProfile/GetUserProfilePicture';
import { ChangeEvent } from '../../SignalR/ChangeEvent/ChangeEvent';
import { ProfilePictureUpdatedEvent } from '../../SignalR/ChangeEvent/EventData';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEventType } from '../../SignalR/ChangeEvent/ChangeEventType';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, userDispatch] = React.useReducer(userReducer, null);
    const pictureApi = React.useMemo(() => new GetUserProfilePictureApi(), []);

    const handleProfilePictureUpdate = useCallback(async (evt: ChangeEvent<ProfilePictureUpdatedEvent>) => {
        try {
            const result = await pictureApi.getUserProfilePicture({
                profilePictureUrl: evt.data.profilePictureUrl,
            });

            if (result.success) {
                userDispatch({
                    type: UserContextActionType.UpdateProfilePicture,
                    payload: { base64ProfilePicture: result.data!.base64ProfilePicture }
                });
            }
        } catch (err) {
            console.error("Failed to fetch updated profile picture", err);
        }
    }, [pictureApi, userDispatch]);


    useSignalEvent(ChangeEventType.ProfilePictureChanged, handleProfilePictureUpdate);

    return <UserContext.Provider value={{ user, userDispatch }}>
        {children}
    </UserContext.Provider>;
};
