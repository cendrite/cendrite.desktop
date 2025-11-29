import React from 'react';
import { UserContext } from './UserContext';
import { userReducer } from './UserReducer';
import { GetUserProfilePictureApi } from '../../Common/Api/UserProfile/GetUserProfilePicture';
import { useUserEvents } from './UserEvents';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, userDispatch] = React.useReducer(userReducer, null);
    const pictureApi = React.useMemo(() => new GetUserProfilePictureApi(), []);

    useUserEvents(user, userDispatch, pictureApi);

    return <UserContext.Provider value={{ user, userDispatch }}>{children}</UserContext.Provider>;
};
