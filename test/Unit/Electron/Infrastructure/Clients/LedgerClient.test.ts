import { describe, expect, test, vi } from 'vitest';
import { AxiosRequestConfig } from 'axios';
import { LedgerClient } from '../../../../../src/Electron/Infrastructure/Clients/LedgerClient.js';
import { ApiClient } from '../../../../../src/Electron/Infrastructure/Clients/Base/ApiClient.js';
import { isLedgerConflict, LedgerAppend } from '../../../../../src/Electron/Application/Contracts/Providers/ILedgerProvider.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

function fakeClient(result: Result<unknown> = Result.success()) {
    const calls: AxiosRequestConfig[] = [];

    const client = {
        handleConduit: vi.fn((config: AxiosRequestConfig) => {
            calls.push(config);
            return Promise.resolve(result);
        }),
    } as unknown as ApiClient;

    return { client, calls, sut: new LedgerClient(client) };
}

function append(): LedgerAppend {
    return new LedgerAppend(
        4,
        Buffer.alloc(32, 0x11),
        Buffer.from([0x09, 0x08]),
        Buffer.alloc(32, 0xa1),
        Buffer.alloc(64, 0x7f),
        [Buffer.alloc(32, 0xb2)],
        [Buffer.alloc(32, 0xc3)],
    );
}

describe('createStream', () => {
    test('posts the stream with base64 encoded bytes', async () => {
        const { calls, sut } = fakeClient();

        await sut.createStream(GROUP_ID, Buffer.from([1, 2, 3]), Buffer.alloc(32, 0xa1), Buffer.alloc(64, 0x7f));

        expect(calls[0].method).toBe('POST');
        expect(calls[0].url).toBeUndefined();
        expect(calls[0].data).toEqual({
            ledgerId: GROUP_ID,
            payload: Buffer.from([1, 2, 3]).toString('base64'),
            writeKey: Buffer.alloc(32, 0xa1).toString('base64'),
            signature: Buffer.alloc(64, 0x7f).toString('base64'),
        });
    });
});

describe('appendEvent', () => {
    test('puts to the events route with every field encoded', async () => {
        const { calls, sut } = fakeClient();

        await sut.appendEvent(GROUP_ID, append());

        expect(calls[0].method).toBe('PUT');
        expect(calls[0].url).toBe(`${GROUP_ID}/events`);
        expect(calls[0].data).toEqual({
            expectedVersion: 4,
            previousHash: Buffer.alloc(32, 0x11).toString('base64'),
            payload: Buffer.from([0x09, 0x08]).toString('base64'),
            writeKeyPublic: Buffer.alloc(32, 0xa1).toString('base64'),
            signature: Buffer.alloc(64, 0x7f).toString('base64'),
            keysAdded: [Buffer.alloc(32, 0xb2).toString('base64')],
            keysRemoved: [Buffer.alloc(32, 0xc3).toString('base64')],
        });
    });

    test('surfaces a conflict so the caller can resync and retry', async () => {
        const conflict = Result.fail(new ErrorMessage('Conflict', 'Ledger is at version 5, append expected 4.'));
        const { sut } = fakeClient(conflict);

        const result = await sut.appendEvent(GROUP_ID, append());

        expect(result.success).toBe(false);
        expect(isLedgerConflict(result)).toBe(true);
    });

    test('does not mistake another failure for a conflict', async () => {
        const forbidden = Result.fail(new ErrorMessage('Forbidden', 'Invalid signature.'));

        expect(isLedgerConflict(forbidden)).toBe(false);
        expect(isLedgerConflict(Result.success())).toBe(false);
    });
});

describe('archiveStream', () => {
    test('puts to the archive route without key changes', async () => {
        const { calls, sut } = fakeClient();

        await sut.archiveStream(GROUP_ID, append());

        expect(calls[0].url).toBe(`${GROUP_ID}/archive`);
        expect(calls[0].data).not.toHaveProperty('keysAdded');
        expect(calls[0].data).not.toHaveProperty('keysRemoved');
    });
});

describe('getEvents', () => {
    test('decodes the page into buffers', async () => {
        const page = {
            version: 2,
            archived: false,
            hasMore: true,
            events: [
                {
                    version: 2,
                    previousHash: Buffer.alloc(32, 0x11).toString('base64'),
                    payload: Buffer.from([0x05]).toString('base64'),
                    writeKeyPublic: Buffer.alloc(32, 0xa1).toString('base64'),
                    signature: Buffer.alloc(64, 0x7f).toString('base64'),
                    keysAdded: [Buffer.alloc(32, 0xb2).toString('base64')],
                    keysRemoved: [],
                },
            ],
        };

        const { calls, sut } = fakeClient(Result.success(page));

        const result = await sut.getEvents(GROUP_ID, 2, 100);

        expect(calls[0].method).toBe('GET');
        expect(calls[0].url).toBe(`${GROUP_ID}/events`);
        expect(calls[0].params).toEqual({ fromVersion: 2, limit: 100 });

        const event = result.data!.events[0];
        expect(result.data!.hasMore).toBe(true);
        expect(event.groupId).toBe(GROUP_ID);
        expect(event.previousHash).toEqual(Buffer.alloc(32, 0x11));
        expect(event.payload).toEqual(Buffer.from([0x05]));
        expect(event.keysAdded[0]).toEqual(Buffer.alloc(32, 0xb2));
        expect(event.keysRemoved).toEqual([]);
    });

    test('omits the limit when the caller does not set one', async () => {
        const { calls, sut } = fakeClient(Result.success({ version: 1, archived: false, hasMore: false, events: [] }));

        await sut.getEvents(GROUP_ID, 1);

        expect(calls[0].params).toEqual({ fromVersion: 1 });
    });

    test('passes a failure through untouched', async () => {
        const { sut } = fakeClient(Result.fail(new ErrorMessage('Not Found', 'Could not find ledger.')));

        const result = await sut.getEvents(GROUP_ID, 1);

        expect(result.success).toBe(false);
        expect(result.errorMessage?.message).toBe('Could not find ledger.');
    });
});

describe('getHead', () => {
    test('decodes the head hash', async () => {
        const hash = Buffer.alloc(32, 0x5a);
        const { calls, sut } = fakeClient(
            Result.success({ version: 12, hash: hash.toString('base64'), archived: true }),
        );

        const result = await sut.getHead(GROUP_ID);

        expect(calls[0].url).toBe(`${GROUP_ID}/head`);
        expect(result.data).toEqual({ version: 12, hash, archived: true });
    });
});
