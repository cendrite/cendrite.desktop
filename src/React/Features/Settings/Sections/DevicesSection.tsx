import React from 'react';
import {
    AndroidLogoIcon,
    AppleLogoIcon,
    DesktopIcon,
    DeviceMobileIcon,
    LinuxLogoIcon,
    WindowsLogoIcon,
} from '@phosphor-icons/react';
import { DeviceDto } from '@/Shared/Devices/GetDevices';

const platformIcons: Record<string, React.ElementType> = {
    Windows: WindowsLogoIcon,
    MacOS: AppleLogoIcon,
    iOS: AppleLogoIcon,
    Linux: LinuxLogoIcon,
    Android: AndroidLogoIcon,
};

function formatLastSeen(lastSeen: string | null): string {
    if (!lastSeen) return 'Never connected';

    return `Last seen ${new Date(lastSeen).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    })}`;
}

const DeviceRow: React.FC<{ device: DeviceDto }> = ({ device }) => {
    const Icon = platformIcons[device.platform] ?? (device.type === 'Mobile' ? DeviceMobileIcon : DesktopIcon);

    return (
        <li className="flex items-center gap-3 rounded-lg border border-line p-3">
            <Icon className="h-6 w-6 shrink-0 text-fg-muted" />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{device.name}</p>
                <p className="text-xs text-fg-subtle">
                    {device.platform} · {device.type}
                </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-fg-subtle">
                {device.online ? (
                    <>
                        <span className="h-2 w-2 rounded-full bg-success" />
                        Online
                    </>
                ) : (
                    formatLastSeen(device.lastSeen)
                )}
            </div>
        </li>
    );
};

interface DevicesSectionProps {
    devices: DeviceDto[] | null;
    failed: boolean;
}

const DevicesSection: React.FC<DevicesSectionProps> = ({ devices, failed }) => {
    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Your devices</h3>
            <p className="mt-1 text-sm text-fg-subtle">Devices that are signed in to your account.</p>

            {devices === null && failed && <p className="mt-4 text-sm text-danger-fg">Could not load your devices.</p>}

            {devices === null && !failed && <p className="mt-4 text-sm text-fg-subtle">Loading devices…</p>}

            {devices && (
                <ul className="mt-4 space-y-2">
                    {devices.map((device) => (
                        <DeviceRow key={device.id} device={device} />
                    ))}
                </ul>
            )}
        </section>
    );
};

export default DevicesSection;
