import { useEffect, useState } from 'react';
import { GetUntrustedDevicesQuery } from '@/Shared/Devices/GetUntrustedDevices';
import { useMessageEdit } from '@/React/Common/Utilities.ts';

export function useUntrustedDevices(): Set<string> {
    const [devices, setDevices] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetUntrustedDevicesQuery()).then((result) => {
            if (cancelled || !result.success) return;
            setDevices((current) => new Set([...current, ...result.data]));
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useMessageEdit('untrustedDevice', (event) =>
        setDevices((current) => (current.has(event.connectionId) ? current : new Set([...current, event.connectionId]))),
    );

    return devices;
}
