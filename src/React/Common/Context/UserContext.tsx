import React, {createContext} from "react";

interface User {
    id: string;
    username: string;
    userTag: string;
    profilePictureUrl?: string;
    displayName?: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User| null) => void;
    updateUser: (user: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = React.useState<User | null>(null);

    const updateUser = (updates: Partial<User>) => {
        setUser((prev) => {
            if (prev === null) { // If the user is null, we can't update it
                return null;
            }
            return { ...prev, ...updates }; // Otherwise we merge the updates into the user object
        });
    }

    return <UserContext.Provider value={{ user, setUser, updateUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = React.useContext(UserContext);

    if (context === undefined) {
        throw new Error("useUser must be used within an UserProvider");
    }

    return context;
};