import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';

export class MediaDto {
    public readonly id: string;
    public readonly type: string;
    public readonly content: Uint8Array;

    constructor(id: string, type: string, content: Uint8Array) {
        this.id = id;
        this.type = type;
        this.content = content;
    }

    public static fromMessageMedia(messageMedia: MessageMedia, content: Uint8Array): MediaDto {
        return new MediaDto(messageMedia.id, messageMedia.type, content);
    }
}
