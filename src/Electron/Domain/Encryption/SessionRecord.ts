export class SessionRecord {
    encodedAddress: string;
    record: Buffer;

    constructor(connectionId: string, record: Buffer) {
        this.encodedAddress = connectionId;
        this.record = record;
    }
}
