import { describe, expect, test } from 'vitest';
import nacl from 'tweetnacl';
import { verifyDeviceChain } from '#electron/Infrastructure/Crypto/DeviceChain';
import { accountRotationMessage, deviceApprovalMessage } from '#electron/Infrastructure/Crypto/AccountKey';
import { ChainDevice, ChainRotation, DeviceChain } from '#electron/Application/Contracts/Providers/IDeviceProvider';

interface Keys { pk: string; sk: Uint8Array }

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const raw = (value: string) => new Uint8Array(Buffer.from(value, 'base64'));
const keys = (): Keys => { const kp = nacl.sign.keyPair(); return { pk: b64(kp.publicKey), sk: kp.secretKey }; };
const signalKey = () => b64(new Uint8Array([5, ...nacl.randomBytes(32)]));
const sign = (message: Uint8Array, signer: Keys) => b64(nacl.sign.detached(message, signer.sk));

let next = 0;

function device(signer: Keys, signedUnder: string, approvedBy: string, removed = false) {
    const own = keys();
    const signal = signalKey();
    const id = `device-${++next}`;
    const record: ChainDevice = {
        id,
        connectionId: `conn-${id}`,
        publicKey: own.pk,
        signalIdentityKey: signal,
        approvedBy,
        approvalSignature: sign(deviceApprovalMessage(raw(signedUnder), raw(own.pk), raw(signal)), signer),
        removed,
    };
    return { record, keys: own };
}

const byAccount = (account: Keys, removed = false) => device(account, account.pk, 'account', removed);
const byDevice = (approver: { record: ChainDevice; keys: Keys }, accountPk: string, removed = false) =>
    device(approver.keys, accountPk, approver.record.id, removed);

function rotation(from: Keys, to: Keys, by: { record: ChainDevice; keys: Keys }): ChainRotation {
    const message = accountRotationMessage(raw(from.pk), raw(to.pk));
    return {
        deviceId: by.record.id,
        oldAccountPublicKey: from.pk,
        newAccountPublicKey: to.pk,
        proof: sign(message, to),
        approval: sign(message, by.keys),
    };
}

const chain = (account: string, devices: ChainDevice[], rotations: ChainRotation[] = []): DeviceChain =>
    ({ userTag: '482177301593', accountPublicKey: account, devices, rotations });

const check = (c: DeviceChain, target: ChainDevice, pinned: string | null = null) =>
    verifyDeviceChain(c, target.connectionId, target.signalIdentityKey, pinned);

describe('device chain', () => {
    test('a device approved by the account key verifies on first contact', () => {
        const account = keys();
        const phone = byAccount(account);

        expect(check(chain(account.pk, [phone.record]), phone.record)).toBe(true);
    });

    test('a device linked from an approved device verifies', () => {
        const account = keys();
        const phone = byAccount(account);
        const laptop = byDevice(phone, account.pk);

        expect(check(chain(account.pk, [phone.record, laptop.record]), laptop.record)).toBe(true);
    });

    test('a device linked from a since-removed device still verifies, but the removed device does not', () => {
        const account = keys();
        const phone = byAccount(account, true);
        const laptop = byDevice(phone, account.pk);
        const c = chain(account.pk, [phone.record, laptop.record]);

        expect(check(c, laptop.record)).toBe(true);
        expect(check(c, phone.record)).toBe(false);
    });

    test('after a rotation, devices from before and after it verify, pinned to the old or the new key', () => {
        const oldAccount = keys();
        const newAccount = keys();
        const phone = byAccount(oldAccount);
        const tablet = byAccount(newAccount);
        const c = chain(newAccount.pk, [phone.record, tablet.record], [rotation(oldAccount, newAccount, phone)]);

        expect(check(c, phone.record, oldAccount.pk)).toBe(true);
        expect(check(c, tablet.record, oldAccount.pk)).toBe(true);
        expect(check(c, tablet.record, newAccount.pk)).toBe(true);
    });

    test('two rotations in a row are followed from the first pinned key', () => {
        const a = keys();
        const b = keys();
        const c3 = keys();
        const phone = byAccount(a);
        const tablet = byAccount(c3);
        const c = chain(c3.pk, [phone.record, tablet.record], [rotation(a, b, phone), rotation(b, c3, phone)]);

        expect(check(c, tablet.record, a.pk)).toBe(true);
    });

    test('a pinned key that the chain never passes through fails', () => {
        const account = keys();
        const phone = byAccount(account);

        expect(check(chain(account.pk, [phone.record]), phone.record, keys().pk)).toBe(false);
    });

    test('a device approved by a key that is not the account key fails', () => {
        const account = keys();
        const forged = byAccount(keys());

        expect(check(chain(account.pk, [forged.record]), forged.record)).toBe(false);
    });

    test('a Signal key that differs from the approved one fails', () => {
        const account = keys();
        const phone = byAccount(account);

        expect(verifyDeviceChain(chain(account.pk, [phone.record]), phone.record.connectionId, signalKey(), null)).toBe(false);
    });

    test('a rotation with a bad proof, or one that does not end at the current key, fails', () => {
        const oldAccount = keys();
        const newAccount = keys();
        const phone = byAccount(oldAccount);
        const good = rotation(oldAccount, newAccount, phone);

        expect(check(chain(newAccount.pk, [phone.record], [{ ...good, proof: sign(new Uint8Array([1]), newAccount) }]), phone.record)).toBe(false);
        expect(check(chain(keys().pk, [phone.record], [good]), phone.record)).toBe(false);
    });

    test('a rotation approved by a device that is not itself approved fails', () => {
        const oldAccount = keys();
        const newAccount = keys();
        const phone = byAccount(oldAccount);
        const stranger = byAccount(keys());

        expect(check(chain(newAccount.pk, [phone.record, stranger.record], [rotation(oldAccount, newAccount, stranger)]), phone.record)).toBe(false);
    });

    test('a device that approves itself is not trusted', () => {
        const account = keys();
        const loop = byAccount(account);
        loop.record.approvedBy = loop.record.id;

        expect(check(chain(account.pk, [loop.record]), loop.record)).toBe(false);
    });
});
