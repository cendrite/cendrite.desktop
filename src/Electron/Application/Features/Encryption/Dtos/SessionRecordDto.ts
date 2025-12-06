export class SessionRecordDto {
    encodedAddress: string;
    record: string;

    constructor(encodedAddress: string, record: string) {
        this.encodedAddress = encodedAddress;
        this.record = record;
    }
}
