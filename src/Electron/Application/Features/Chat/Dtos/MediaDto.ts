export class MediaDto {
    public readonly url: string;
    public readonly type: string;
    public readonly content: string;

    constructor(url: string, type: string, content: string) {
        this.url = url;
        this.type = type;
        this.content = content;
    }
}
