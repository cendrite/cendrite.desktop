import React from 'react';

export interface DeviceAlertContextType {
    platform: string | null;
    dismiss: () => void;
}

export const DeviceAlertContext = React.createContext<DeviceAlertContextType | undefined>(undefined);

export const useDeviceAlert = () => {
    const context = React.useContext(DeviceAlertContext);
    if (context === undefined) {
        throw new Error('useDeviceAlert must be used within a DeviceAlertProvider');
    }
    return context;
};
