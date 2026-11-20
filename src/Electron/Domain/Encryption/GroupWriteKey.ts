export class GroupWriteKey {
    groupId: string;
    publicKey: Buffer;
    privateKey: Buffer;
    isInvite: boolean;

    constructor(groupId: string, publicKey: Buffer, privateKey: Buffer, isInvite: boolean = false) {
        this.groupId = groupId;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.isInvite = isInvite;
    }
}
