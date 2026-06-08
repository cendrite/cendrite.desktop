import React from 'react';
import { UserContext } from './UserContext';
import { userReducer } from './UserReducer';
import { useUserEvents } from './UserEvents';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, userDispatch] = React.useReducer(userReducer, null);

    useUserEvents(user, userDispatch);

    return <UserContext.Provider value={{ user, userDispatch }}>{children}</UserContext.Provider>;
};
