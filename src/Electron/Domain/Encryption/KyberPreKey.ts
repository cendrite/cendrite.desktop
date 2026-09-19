export class KyberPreKey {
    public readonly id: number;
    public readonly record: Buffer;

    constructor(id: number, record: Buffer) {
        this.id = id;
        this.record = record;
    }
}
