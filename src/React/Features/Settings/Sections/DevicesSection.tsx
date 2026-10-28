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
import { useUser } from '@/React/Context/User/UserContext';

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

const DeviceRow: React.FC<{ device: DeviceDto; isCurrent: boolean }> = ({ device, isCurrent }) => {
    const Icon = platformIcons[device.platform] ?? (device.type === 'Mobile' ? DeviceMobileIcon : DesktopIcon);

    return (
        <li className="flex items-center gap-4 rounded-lg border border-line px-4 py-4">
            <Icon className="h-8 w-8 shrink-0 text-fg-muted" />

            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{device.name}</p>
                <p className="mt-0.5 text-xs text-fg-subtle">
                    {device.platform} · {device.type}
                </p>
            </div>

            {isCurrent && (
                <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent ring-1 ring-inset ring-accent/25">
                    This device
                </span>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-fg-subtle">
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
    const { user } = useUser();
    const currentDeviceId = user?.deviceId;

    const sortedDevices = devices
        ? [
              ...devices.filter((d) => d.id === currentDeviceId),
              ...devices.filter((d) => d.id !== currentDeviceId),
          ]
        : null;

    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Your devices</h3>
            <p className="mt-1 text-sm text-fg-subtle">Devices that are signed in to your account.</p>

            {devices === null && failed && <p className="mt-4 text-sm text-danger-fg">Could not load your devices.</p>}

            {devices === null && !failed && <p className="mt-4 text-sm text-fg-subtle">Loading devices…</p>}

            {sortedDevices && (
                <ul className="mt-4 space-y-2">
                    {sortedDevices.map((device) => (
                        <DeviceRow key={device.id} device={device} isCurrent={device.id === currentDeviceId} />
                    ))}
                </ul>
            )}
        </section>
    );
};

export default DevicesSection;
