import { Result } from '#shared/Result/Result';
import {
    ILedgerProvider,
    LedgerAppend,
    LedgerEventsPage,
    LedgerEventsPageDto,
    LedgerHead,
    LedgerHeadDto,
    LedgerReadProof,
} from '#electron/Application/Contracts/Providers/ILedgerProvider';
import { LedgerEvent } from '#electron/Application/Contracts/Providers/ILedgerProvider';
import { ApiClient } from './Base/ApiClient.js';

export class LedgerClient implements ILedgerProvider {
    private readonly client: ApiClient;

    constructor(ledgerApiClient: ApiClient) {
        this.client = ledgerApiClient;
    }

    public createStream(
        groupId: string,
        payload: Buffer,
        writeKey: Buffer,
        keys: Buffer[],
        signature: Buffer,
    ): Promise<Result<void>> {
        return this.client.handleConduit<void>(
            {
                method: 'POST',
                data: {
                    ledgerId: groupId,
                    payload: toBase64(payload),
                    writeKey: toBase64(writeKey),
                    signature: toBase64(signature),
                    keysAdded: keys.map(toBase64),
                },
            },
            true,
        ) as Promise<Result<void>>;
    }

    public appendEvent(groupId: string, append: LedgerAppend): Promise<Result<void>> {
        return this.client.handleConduit<void>(
            {
                url: `${groupId}/events`,
                method: 'PUT',
                data: {
                    expectedVersion: append.expectedVersion,
                    previousHash: toBase64(append.previousHash),
                    payload: toBase64(append.payload),
                    writeKeyPublic: toBase64(append.writeKeyPublic),
                    signature: toBase64(append.signature),
                    keysAdded: append.keysAdded.map(toBase64),
                    keysRemoved: append.keysRemoved.map(toBase64),
                },
            },
            true,
        ) as Promise<Result<void>>;
    }

    public archiveStream(groupId: string, append: LedgerAppend): Promise<Result<void>> {
        return this.client.handleConduit<void>(
            {
                url: `${groupId}/archive`,
                method: 'PUT',
                data: {
                    expectedVersion: append.expectedVersion,
                    previousHash: toBase64(append.previousHash),
                    payload: toBase64(append.payload),
                    writeKeyPublic: toBase64(append.writeKeyPublic),
                    signature: toBase64(append.signature),
                },
            },
            true,
        ) as Promise<Result<void>>;
    }

    public async getEvents(
        groupId: string,
        fromVersion: number,
        proof: LedgerReadProof,
        limit?: number,
    ): Promise<Result<LedgerEventsPage>> {
        const result = await this.client.handleConduit<LedgerEventsPageDto>({
            url: `${groupId}/events`,
            method: 'GET',
            params: limit === undefined ? { fromVersion } : { fromVersion, limit },
            headers: readHeaders(proof),
        });

        if (!result.success) return Result.fail<LedgerEventsPage>(result.errorMessage);

        const page = result.data;

        return Result.success({
            version: page.version,
            archived: page.archived,
            hasMore: page.hasMore,
            events: page.events.map(
                (event) =>
                    new LedgerEvent(
                        groupId,
                        event.version,
                        fromBase64(event.previousHash),
                        fromBase64(event.payload),
                        fromBase64(event.writeKeyPublic),
                        fromBase64(event.signature),
                        event.keysAdded.map(fromBase64),
                        event.keysRemoved.map(fromBase64),
                    ),
            ),
        });
    }

    public async getHead(groupId: string, proof: LedgerReadProof): Promise<Result<LedgerHead>> {
        const result = await this.client.handleConduit<LedgerHeadDto>({
            url: `${groupId}/head`,
            method: 'GET',
            headers: readHeaders(proof),
        });

        if (!result.success) return Result.fail<LedgerHead>(result.errorMessage);

        const head = result.data;

        return Result.success({
            version: head.version,
            hash: fromBase64(head.hash),
            archived: head.archived,
        });
    }
}

function readHeaders(proof: LedgerReadProof): Record<string, string> {
    return {
        'X-Ledger-Key': toBase64(proof.writeKeyPublic),
        'X-Ledger-Timestamp': proof.timestamp.toString(),
        'X-Ledger-Signature': toBase64(proof.signature),
    };
}

function toBase64(value: Buffer): string {
    return value.toString('base64');
}

function fromBase64(value: string): Buffer {
    return Buffer.from(value, 'base64');
}
