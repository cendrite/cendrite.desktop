import React, { useState } from 'react';
import {
    AndroidLogoIcon,
    AppleLogoIcon,
    DesktopIcon,
    DeviceMobileIcon,
    LinuxLogoIcon,
    PencilSimpleIcon,
    TrashIcon,
    WindowsLogoIcon,
} from '@phosphor-icons/react';
import { DeviceDto } from '@/Shared/Devices/GetDevices';
import { DEVICE_NAME_MAX_LENGTH } from '@/Shared/Devices/RenameDevice';
import { useUser } from '@/React/Context/User/UserContext';
import DeleteDeviceModal from '../Modals/DeleteDeviceModal.tsx';
import LinkDevicePanel from '../Components/LinkDevicePanel.tsx';

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

interface DeviceRowProps {
    device: DeviceDto;
    isCurrent: boolean;
    onRemove: () => void;
    onRename: (name: string) => Promise<boolean>;
}

const DeviceRow: React.FC<DeviceRowProps> = ({ device, isCurrent, onRemove, onRename }) => {
    const Icon = platformIcons[device.platform] ?? (device.type === 'Mobile' ? DeviceMobileIcon : DesktopIcon);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(device.name);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const startEditing = () => {
        setName(device.name);
        setError(null);
        setEditing(true);
    };

    const save = async () => {
        const trimmed = name.trim();
        if (trimmed.length === 0) return setError('Name cannot be empty.');
        if (trimmed.length > DEVICE_NAME_MAX_LENGTH) return setError(`Name can be at most ${DEVICE_NAME_MAX_LENGTH} characters.`);
        if (trimmed === device.name) return setEditing(false);

        setBusy(true);
        const ok = await onRename(trimmed);
        setBusy(false);

        if (!ok) return setError('Could not rename the device.');
        setEditing(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            void save();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setEditing(false);
        }
    };

    return (
        <li className="flex items-center gap-4 rounded-lg border border-line px-4 py-4">
            <Icon className="h-8 w-8 shrink-0 text-fg-muted" />

            <div className="min-w-0">
                {editing ? (
                    <>
                        <input
                            autoFocus
                            value={name}
                            disabled={busy}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={onKeyDown}
                            onBlur={() => !busy && setEditing(false)}
                            aria-label="Device name"
                            aria-invalid={error !== null}
                            className="w-full rounded-md border border-line bg-transparent px-2 py-1 text-sm font-medium text-fg outline-none focus:border-accent aria-[invalid=true]:border-danger"
                        />
                        {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
                    </>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-fg">{device.name}</p>
                        <button
                            onClick={startEditing}
                            className="shrink-0 rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg"
                            aria-label={`Rename ${device.name}`}
                        >
                            <PencilSimpleIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
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

            {!isCurrent && (
                <button
                    onClick={onRemove}
                    className="shrink-0 rounded-md p-1.5 text-fg-subtle hover:bg-danger/10 hover:text-danger-fg"
                    aria-label={`Remove ${device.name}`}
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            )}
        </li>
    );
};

interface DevicesSectionProps {
    devices: DeviceDto[] | null;
    failed: boolean;
    onDelete: (deviceId: string) => Promise<boolean>;
    onRename: (deviceId: string, name: string) => Promise<boolean>;
    onLinked: () => void;
}

const DevicesSection: React.FC<DevicesSectionProps> = ({ devices, failed, onDelete, onRename, onLinked }) => {
    const { user } = useUser();
    const [deviceToRemove, setDeviceToRemove] = useState<DeviceDto | null>(null);
    const currentDeviceId = user?.deviceId;

    const sortedDevices = devices
        ? [
              ...devices.filter((d) => d.id === currentDeviceId),
              ...devices.filter((d) => d.id !== currentDeviceId),
          ]
        : null;

    return (
        <section>
            <LinkDevicePanel onLinked={onLinked} />

            <h3 className="mt-8 text-sm font-medium text-fg-muted">Your devices</h3>
            <p className="mt-1 text-sm text-fg-subtle">Devices that are signed in to your account.</p>

            {devices === null && failed && <p className="mt-4 text-sm text-danger-fg">Could not load your devices.</p>}

            {devices === null && !failed && <p className="mt-4 text-sm text-fg-subtle">Loading devices…</p>}

            {sortedDevices && (
                <ul className="mt-4 space-y-2">
                    {sortedDevices.map((device) => (
                        <DeviceRow
                            key={device.id}
                            device={device}
                            isCurrent={device.id === currentDeviceId}
                            onRemove={() => setDeviceToRemove(device)}
                            onRename={(name) => onRename(device.id, name)}
                        />
                    ))}
                </ul>
            )}

            <DeleteDeviceModal device={deviceToRemove} onClose={() => setDeviceToRemove(null)} onDelete={onDelete} />
        </section>
    );
};

export default DevicesSection;
