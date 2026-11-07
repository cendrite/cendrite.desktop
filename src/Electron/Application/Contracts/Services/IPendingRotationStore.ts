export interface PendingRotation {
    words: string[];
    confirmIndices: number[];
}

export interface IPendingRotationStore {
    set(pendingRotation: PendingRotation): void;
    get(): PendingRotation | null;
    clear(): void;
}
