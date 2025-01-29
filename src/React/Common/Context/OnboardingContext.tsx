import React, {createContext, useContext, useState} from "react";
interface OnboardingData {
    email: string | null;
    username: string | null;
    UserId: string | null;
    PrivateKey: string | null;
    PublicKey: string | null;
    deviceId: string | null;
}

interface OnboardingContextType {
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

const defaultOnboardingData: OnboardingData = {
    email: null,
    username: null,
    UserId: null,
    PrivateKey: null,
    PublicKey: null,
    deviceId: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);

    const updateOnboardingData = (updates: Partial<OnboardingData>) => {
        setOnboardingData((prev) => ({
            ...prev,
            ...updates,
        }));
    };

    return (<OnboardingContext.Provider value={{onboardingData, updateOnboardingData}}>{children}</OnboardingContext.Provider>);
};

export const useOnboarding = (): OnboardingContextType => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within an OnboardingProvider");
    }
    return context;
};
