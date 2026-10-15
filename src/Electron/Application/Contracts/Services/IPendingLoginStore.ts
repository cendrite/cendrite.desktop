export interface PendingLogin {
    userId: string;
    nonceId: string;
    nonce: string;
}

export interface IPendingLoginStore {
    set(pendingLogin: PendingLogin): void;
    get(userId: string): PendingLogin | null;
    clear(): void;
}
