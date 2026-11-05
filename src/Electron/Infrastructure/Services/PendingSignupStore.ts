import { IPendingSignupStore, PendingSignup } from '#electron/Application/Contracts/Services/IPendingSignupStore';

export class PendingSignupStore implements IPendingSignupStore {
    private pendingSignup: PendingSignup | null = null;

    public set(pendingSignup: PendingSignup): void {
        this.pendingSignup = pendingSignup;
    }

    public get(): PendingSignup | null {
        return this.pendingSignup;
    }

    public clear(): void {
        if (this.pendingSignup) {
            this.pendingSignup.words.fill('');
        }
        this.pendingSignup = null;
    }
}
