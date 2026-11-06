import React from 'react';

export interface DeviceLinkRequest {
    pendingLinkId: string;
    devicePlatform: string;
}

export interface DeviceLinkRequestContextType {
    request: DeviceLinkRequest | null;
    clear: () => void;
}

export const DeviceLinkRequestContext = React.createContext<DeviceLinkRequestContextType | undefined>(undefined);

export const useDeviceLinkRequest = () => {
    const context = React.useContext(DeviceLinkRequestContext);
    if (context === undefined) {
        throw new Error('useDeviceLinkRequest must be used within a DeviceLinkRequestProvider');
    }
    return context;
};
