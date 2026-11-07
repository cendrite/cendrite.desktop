import { EphemeralEntries, IEphemeralStore } from '#electron/Application/Contracts/Services/IEphemeralStore';

export class EphemeralStore implements IEphemeralStore {
    private entries: Partial<EphemeralEntries> = {};

    public set<K extends keyof EphemeralEntries>(key: K, value: EphemeralEntries[K]): void {
        this.entries[key] = value;
    }

    public get<K extends keyof EphemeralEntries>(key: K): EphemeralEntries[K] | null {
        return this.entries[key] ?? null;
    }

    public clear(key: keyof EphemeralEntries): void {
        delete this.entries[key];
    }

    public clearAll(): void {
        this.entries = {};
    }
}
