import { useCallback } from 'react';
import { User } from '../../Models/User';
import { AddUserConnectionIdCommand } from '../../../Electron/Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommand';
import { RemoveUserConnectionIdCommand } from '../../../Electron/Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommand';
import { UserAction, UserActionType } from './UserReducer';
import { AvatarUpdatedEvent, UserLoggedInEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/EventData';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent';
import { ChangeEventType } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEventType';

export function useUserEvents(user: User | null, dispatch: React.Dispatch<UserAction>) {
    const handleAvatarUpdate = useCallback(
        async (evt: ChangeEvent<AvatarUpdatedEvent>) => {
            if (user?.userTag !== evt.data.userTag) return;
            dispatch({
                type: UserActionType.UpdateAvatar,
                payload: { AvatarKey: evt.data.avatarKey },
            });
        },
        [dispatch, user],
    );

    const handleUserLoginEvent = useCallback(
        async (evt: ChangeEvent<UserLoggedInEvent>) => {
            try {
                if (!isUserEvent(evt.data.userTag, evt.data.connectionId)) return;
                console.log('Handling user login event for connection ID:', evt.data.connectionId);
                dispatch({ type: UserActionType.AddConnectionId, payload: { connectionId: evt.data.connectionId } });

                await window.electron.sendRequestAsync(new AddUserConnectionIdCommand(evt.data.connectionId));
            } catch (err) {
                console.error('Error handling user login event', err);
            }
        },
        [dispatch, user],
    );

    const handleUserLogoutEvent = useCallback(
        async (evt: ChangeEvent<UserLoggedInEvent>) => {
            try {
                if (!isUserEvent(evt.data.userTag, evt.data.connectionId)) return;

                dispatch({ type: UserActionType.RemoveConnectionId, payload: { connectionId: evt.data.connectionId } });

                await window.electron.sendRequestAsync(new RemoveUserConnectionIdCommand(evt.data.connectionId));
            } catch (err) {
                console.error('Error handling user logout event', err);
            }
        },
        [dispatch, user],
    );

    useSignalEvent(ChangeEventType.AvatarChanged, handleAvatarUpdate);
    useSignalEvent(ChangeEventType.UserLoggedIn, handleUserLoginEvent);
    useSignalEvent(ChangeEventType.UserLoggedOut, handleUserLogoutEvent);

    function isUserEvent(tag: string, id: string): boolean {
        if (user?.userTag !== tag || user.connectionId === id) {
            console.log('User event for different userTag received, ignoring.');
            return false;
        }
        return true;
    }
}
