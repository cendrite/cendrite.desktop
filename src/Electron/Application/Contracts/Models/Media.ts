export class Media {
    public readonly id: string;
    public readonly type: string;
    public readonly content: Uint8Array;

    constructor(id: string, type: string, content: Uint8Array) {
        this.id = id;
        this.type = type;
        this.content = content;
    }
}
