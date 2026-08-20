import { IRetryPolicy } from "@microsoft/signalr";

export class InfiniteRetryPolicy implements IRetryPolicy {
    private readonly _retryIntervalInMilliseconds: number;

    public constructor(retryIntervalInMilliseconds: number) {
        this._retryIntervalInMilliseconds = retryIntervalInMilliseconds;
    }

    public nextRetryDelayInMilliseconds(_retryContext: { elapsedMilliseconds: number; previousRetryCount: number; retryReason: Error }): number | null {
        return this._retryIntervalInMilliseconds;
    }
}
