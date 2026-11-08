export class PinnedAccountKey {
    userTag: string;
    accountPublicKey: string;
    timestamp: number;

    constructor(userTag: string, accountPublicKey: string, timestamp: number) {
        this.userTag = userTag;
        this.accountPublicKey = accountPublicKey;
        this.timestamp = timestamp;
    }
}
