import { useCallback, useEffect, useState } from 'react';
import { DeviceDto, GetDevicesQuery } from '@/Shared/Devices/GetDevices';
import { DeleteDeviceCommand } from '@/Shared/Devices/DeleteDevice';

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

    const deleteDevice = useCallback(async (deviceId: string): Promise<boolean> => {
        const result = await window.electron.sendRequestAsync(new DeleteDeviceCommand(deviceId));

        if (!result.success) return false;

        setDevices((current) => current?.filter((d) => d.id !== deviceId) ?? null);
        return true;
    }, []);

    return { devices, failed, deleteDevice };
}
