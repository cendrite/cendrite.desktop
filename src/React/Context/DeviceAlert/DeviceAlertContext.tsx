import React from 'react';

export type DeviceAlert =
    | { kind: 'deviceAdded'; deviceId: string; platform: string }
    | { kind: 'phraseChanged'; deviceId: string; deviceName: string };

export interface DeviceAlertContextType {
    alert: DeviceAlert | null;
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
