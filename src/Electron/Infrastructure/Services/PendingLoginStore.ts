import { IPendingLoginStore, PendingLogin } from '#electron/Application/Contracts/Services/IPendingLoginStore';

export class PendingLoginStore implements IPendingLoginStore {
    private pendingLogin: PendingLogin | null = null;

    public set(pendingLogin: PendingLogin): void {
        this.pendingLogin = pendingLogin;
    }

    public get(userId: string): PendingLogin | null {
        return this.pendingLogin?.userId === userId ? this.pendingLogin : null;
    }

    public clear(): void {
        this.pendingLogin = null;
    }
}
