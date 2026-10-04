export class GroupWriteKey {
    groupId: string;
    publicKey: Buffer;
    privateKey: Buffer;

    constructor(groupId: string, publicKey: Buffer, privateKey: Buffer) {
        this.groupId = groupId;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}
