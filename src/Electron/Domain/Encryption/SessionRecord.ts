export class SessionRecord {
    encodedAddress: string;
    record: string;

    constructor(connectionId: string, record: string) {
        this.encodedAddress = connectionId;
        this.record = record;
    }
}
