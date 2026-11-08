import nacl from 'tweetnacl';
import { ChainDevice, DeviceChain } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { accountRotationMessage, deviceApprovalMessage } from './AccountKey.js';

const APPROVED_BY_ACCOUNT = 'account';

export function verifyDeviceChain(
    chain: DeviceChain,
    connectionId: string,
    signalIdentityKey: string,
    pinnedAccountKey: string | null,
): boolean {
    const accountKeys = accountKeyHistory(chain);
    if (!accountKeys) return false;
    if (pinnedAccountKey !== null && !accountKeys.includes(pinnedAccountKey)) return false;

    const rotationsApproved = chain.rotations.every((rotation, i) => {
        const device = chain.devices.find((d) => d.id === rotation.deviceId);
        return (
            device !== undefined &&
            isApproved(chain, device, accountKeys.slice(0, i + 1), new Set()) &&
            verify(accountRotationMessage(bytes(rotation.oldAccountPublicKey), bytes(rotation.newAccountPublicKey)), rotation.approval, device.publicKey)
        );
    });
    if (!rotationsApproved) return false;

    const target = chain.devices.find((d) => d.connectionId === connectionId);
    return (
        target !== undefined &&
        !target.removed &&
        target.signalIdentityKey === signalIdentityKey &&
        isApproved(chain, target, accountKeys, new Set())
    );
}

function accountKeyHistory(chain: DeviceChain): string[] | null {
    const keys = [chain.rotations[0]?.oldAccountPublicKey ?? chain.accountPublicKey];

    for (const rotation of chain.rotations) {
        if (rotation.oldAccountPublicKey !== keys[keys.length - 1]) return null;

        const message = accountRotationMessage(bytes(rotation.oldAccountPublicKey), bytes(rotation.newAccountPublicKey));
        if (!verify(message, rotation.proof, rotation.newAccountPublicKey)) return null;

        keys.push(rotation.newAccountPublicKey);
    }

    return keys[keys.length - 1] === chain.accountPublicKey ? keys : null;
}

function isApproved(chain: DeviceChain, device: ChainDevice, accountKeys: string[], seen: Set<string>): boolean {
    if (seen.has(device.id) || !device.approvedBy || !device.approvalSignature) return false;
    seen.add(device.id);

    const signature = device.approvalSignature;
    const signedBy = (accountKey: string) =>
        deviceApprovalMessage(bytes(accountKey), bytes(device.publicKey), bytes(device.signalIdentityKey));

    if (device.approvedBy === APPROVED_BY_ACCOUNT) {
        return accountKeys.some((accountKey) => verify(signedBy(accountKey), signature, accountKey));
    }

    const approver = chain.devices.find((d) => d.id === device.approvedBy);
    if (!approver || !isApproved(chain, approver, accountKeys, seen)) return false;

    return accountKeys.some((accountKey) => verify(signedBy(accountKey), signature, approver.publicKey));
}

function verify(message: Uint8Array, signature: string, publicKey: string): boolean {
    try {
        return nacl.sign.detached.verify(message, bytes(signature), bytes(publicKey));
    } catch {
        return false;
    }
}

function bytes(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}
