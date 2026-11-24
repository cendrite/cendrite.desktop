export class CryptoError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'CryptoError';
    }
}

export class DeviceRevokedError extends Error {
    constructor() {
        super('This device has been removed from the account.');
        this.name = 'DeviceRevokedError';
    }
}

export class UnreachableDeviceError extends Error {
    constructor(public readonly connectionId: string, message: string) {
        super(message);
        this.name = 'UnreachableDeviceError';
    }
}

export class UntrustedDeviceError extends UnreachableDeviceError {
    constructor(connectionId: string) {
        super(connectionId, `The identity key of device ${connectionId} changed and is not trusted.`);
        this.name = 'UntrustedDeviceError';
    }
}

export class DeviceGoneError extends UnreachableDeviceError {
    constructor(connectionId: string) {
        super(connectionId, `Device ${connectionId} has no key bundle, so it has logged out or been removed.`);
        this.name = 'DeviceGoneError';
    }
}
