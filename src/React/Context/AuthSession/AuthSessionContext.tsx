import React from 'react';
import { AuthSessionAction } from './AuthSessionReducer';

interface AuthSessionContextType {
    sessionId: string | null;
    loading: boolean;
    authSessionDispatch: React.Dispatch<AuthSessionAction>;
}

export const AuthSessionContext = React.createContext<AuthSessionContextType | undefined>(undefined);

export const useAuthSession = () => {
    const context = React.useContext(AuthSessionContext);

    if (context === undefined) {
        throw new Error('useAuthSession must be used within an AuthSessionProvider');
    }

    return context;
};
;
