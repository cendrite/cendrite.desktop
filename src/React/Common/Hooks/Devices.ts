import { useEffect, useState } from 'react';
import { DeviceDto, GetDevicesQuery } from '@/Shared/Devices/GetDevices';

export function useDevices(isOpen: boolean) {
    const [devices, setDevices] = useState<DeviceDto[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        window.electron.sendRequestAsync(new GetDevicesQuery()).then((result) => {
            if (cancelled) return;

            if (!result.success) {
                setFailed(true);
                return;
            }

            setFailed(false);
            setDevices(result.data);
        });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    return { devices, failed };
}
