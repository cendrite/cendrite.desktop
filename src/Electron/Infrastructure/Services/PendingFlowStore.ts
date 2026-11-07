import { IPendingFlowStore, PendingFlows } from '#electron/Application/Contracts/Services/IPendingFlowStore';

export class PendingFlowStore implements IPendingFlowStore {
    private entries: Partial<PendingFlows> = {};

    public set<K extends keyof PendingFlows>(key: K, value: PendingFlows[K]): void {
        this.entries[key] = value;
    }

    public get<K extends keyof PendingFlows>(key: K): PendingFlows[K] | null {
        return this.entries[key] ?? null;
    }

    public clear(key: keyof PendingFlows): void {
        delete this.entries[key];
    }

    public clearAll(): void {
        this.entries = {};
    }
}
