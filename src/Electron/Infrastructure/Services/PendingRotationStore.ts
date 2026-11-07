import { IPendingRotationStore, PendingRotation } from '#electron/Application/Contracts/Services/IPendingRotationStore';

export class PendingRotationStore implements IPendingRotationStore {
    private pendingRotation: PendingRotation | null = null;

    public set(pendingRotation: PendingRotation): void {
        this.pendingRotation = pendingRotation;
    }

    public get(): PendingRotation | null {
        return this.pendingRotation;
    }

    public clear(): void {
        if (this.pendingRotation) {
            this.pendingRotation.words.fill('');
        }
        this.pendingRotation = null;
    }
}
