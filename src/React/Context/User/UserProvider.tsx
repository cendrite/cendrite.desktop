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

    const handleProfilePictureUpdate = useCallback(
        async (evt: ChangeEvent<ProfilePictureUpdatedEvent>) => {
            try {
                console.log("Received profile picture update event", evt);
                //this is a guard clause cause server fanouts to all client connectionids and will change friend pics too. this should be fixed somehow
                //TODO: improve this server side, so only the relevant client gets the update

                if (user?.userTag !== evt.data.userTag) {
                    console.log("Current userTag:", user?.userTag);
                    console.log("Event userTag:", evt.data.userTag);
                    console.log("Ignoring profile picture update for different userTag");
                    return;
                }
                const result = await pictureApi.getUserProfilePicture({
                    profilePictureUrl: evt.data.profilePictureUrl,
                });

                if (result.success) {
                    userDispatch({
                        type: UserContextActionType.UpdateProfilePicture,
                        payload: { base64ProfilePicture: result.data!.base64ProfilePicture },
                    });
                }
            } catch (err) {
                console.error('Failed to fetch updated profile picture', err);
            }
        },
        [pictureApi, userDispatch],
    );

    useSignalEvent(ChangeEventType.ProfilePictureChanged, handleProfilePictureUpdate);

    return <UserContext.Provider value={{ user, userDispatch }}>{children}</UserContext.Provider>;
};
