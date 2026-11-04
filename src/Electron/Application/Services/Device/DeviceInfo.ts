import { app } from 'electron';

const DESKTOP_DEVICE_TYPE = 2;

export interface DeviceInfo {
    appVersion: string;
    type: number;
    platform: number;
}

export function currentDeviceInfo(): DeviceInfo {
    return {
        appVersion: currentAppVersion(),
        type: DESKTOP_DEVICE_TYPE,
        platform: currentDevicePlatform(),
    };
}

function currentDevicePlatform(): number {
    switch (process.platform) {
        case 'win32': return 1;
        case 'darwin': return 4;
        case 'linux': return 5;
        default: return 6;
    }
}

function currentAppVersion(): string {
    const [major, minor] = app.getVersion().split('.');
    return `${major}.${minor}`;
}
