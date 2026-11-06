import React, { useCallback, useMemo, useState } from 'react';
import { DeviceAlertContext } from './DeviceAlertContext.tsx';
import { useSignalEvent } from '@/React/Common/Utilities.ts';
import { ChangeEventType } from '@/Shared/Events/ChangeEventType.ts';
import { DeviceAddedEvent } from '@/Shared/Events/EventData.ts';

export const DeviceAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [platform, setPlatform] = useState<string | null>(null);

    useSignalEvent<DeviceAddedEvent>(ChangeEventType.DeviceAdded, (event) => setPlatform(event.data.devicePlatform));

    const dismiss = useCallback(() => setPlatform(null), []);
    const value = useMemo(() => ({ platform, dismiss }), [platform, dismiss]);

    return <DeviceAlertContext.Provider value={value}>{children}</DeviceAlertContext.Provider>;
};

export default DeviceAlertProvider;
