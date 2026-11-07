import React, { useCallback, useMemo, useState } from 'react';
import { DeviceAlert, DeviceAlertContext } from './DeviceAlertContext.tsx';
import { useSignalEvent } from '@/React/Common/Utilities.ts';
import { ChangeEventType } from '@/Shared/Events/ChangeEventType.ts';
import { AccountKeyRotatedEvent, DeviceAddedEvent } from '@/Shared/Events/EventData.ts';

export const DeviceAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alert, setAlert] = useState<DeviceAlert | null>(null);

    useSignalEvent<DeviceAddedEvent>(ChangeEventType.DeviceAdded, (event) =>
        setAlert({ kind: 'deviceAdded', deviceId: event.data.deviceId, platform: event.data.devicePlatform }),
    );
    useSignalEvent<AccountKeyRotatedEvent>(ChangeEventType.AccountKeyRotated, (event) =>
        setAlert({ kind: 'phraseChanged', deviceId: event.data.deviceId, deviceName: event.data.deviceName }),
    );

    const dismiss = useCallback(() => setAlert(null), []);
    const value = useMemo(() => ({ alert, dismiss }), [alert, dismiss]);

    return <DeviceAlertContext.Provider value={value}>{children}</DeviceAlertContext.Provider>;
};

export default DeviceAlertProvider;
