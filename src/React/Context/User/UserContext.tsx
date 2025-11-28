import React from "react";
import { User } from "../../Models/User";
import { UserContextAction } from "./UserReducer";

interface UserContextType {
    user: User | null;
    userDispatch: React.Dispatch<UserContextAction>;
}

export const UserContext = React.createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
    const context = React.useContext(UserContext);

    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }

    return {
        user: context.user,
        userDispatch: context.userDispatch,
    }
}
