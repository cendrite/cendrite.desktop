import React, { useCallback, useMemo, useState } from 'react';
import { DeviceLinkRequest, DeviceLinkRequestContext } from './DeviceLinkRequestContext.tsx';
import { useSignalEvent } from '@/React/Common/Utilities.ts';
import { ChangeEventType } from '@/Shared/Events/ChangeEventType.ts';
import { DeviceLinkRequestedEvent } from '@/Shared/Events/EventData.ts';

export const DeviceLinkRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [request, setRequest] = useState<DeviceLinkRequest | null>(null);

    useSignalEvent<DeviceLinkRequestedEvent>(ChangeEventType.DeviceLinkRequested, (event) =>
        setRequest({ pendingLinkId: event.data.pendingLinkId, devicePlatform: event.data.devicePlatform }),
    );

    const clear = useCallback(() => setRequest(null), []);
    const value = useMemo(() => ({ request, clear }), [request, clear]);

    return <DeviceLinkRequestContext.Provider value={value}>{children}</DeviceLinkRequestContext.Provider>;
};

export default DeviceLinkRequestProvider;
