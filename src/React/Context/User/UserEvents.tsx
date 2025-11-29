import { useCallback } from 'react';
import { User } from '../../Models/User';
import { UserAction, UserActionType } from './UserReducer';
import { ChangeEvent } from '../../SignalR/ChangeEvent/ChangeEvent';
import { ProfilePictureUpdatedEvent } from '../../SignalR/ChangeEvent/EventData';
import { GetUserProfilePictureApi } from '../../Common/Api/UserProfile/GetUserProfilePicture';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEventType } from '../../SignalR/ChangeEvent/ChangeEventType';

export function useUserEvents(
    user: User | null,
    dispatch: React.Dispatch<UserAction>,
    profilePictureApi: GetUserProfilePictureApi,
) {
    const handleProfilePictureUpdate = useCallback(
        async (evt: ChangeEvent<ProfilePictureUpdatedEvent>) => {
            try {
                console.log('Received profile picture update event', evt);
                //this is a guard clause cause server fanouts to all client connectionids and will change friend pics too. this should be fixed somehow
                //TODO: improve this server side, so only the relevant client gets the update

                if (user?.userTag !== evt.data.userTag) {
                    console.log('Current userTag:', user?.userTag);
                    console.log('Event userTag:', evt.data.userTag);
                    console.log('Ignoring profile picture update for different userTag');
                    return;
                }

                const result = await profilePictureApi.getUserProfilePicture({
                    profilePictureUrl: evt.data.profilePictureUrl,
                });

                if (result.success) {
                    dispatch({
                        type: UserActionType.UpdateProfilePicture,
                        payload: { base64ProfilePicture: result.data!.base64ProfilePicture },
                    });
                }
            } catch (err) {
                console.error('Failed to fetch updated profile picture', err);
            }
        },
        [profilePictureApi, dispatch, user],
    );

    useSignalEvent(ChangeEventType.ProfilePictureChanged, handleProfilePictureUpdate);
}
