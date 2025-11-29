import React from "react";
import { User } from "../../Models/User";
import { UserAction } from "./UserReducer";

interface UserContextType {
    user: User | null;
    userDispatch: React.Dispatch<UserAction>;
}

export const UserContext = React.createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = React.useContext(UserContext);

    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }

    return {
        user: context.user,
        userDispatch: context.userDispatch,
    }
}
