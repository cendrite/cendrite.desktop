import { MediaPointer } from "../../../Infrastructure/Signal/Messaging/ServerMessage.js";
import { Media } from "../Models/Media.js";

export interface IMediaProvider { 
    get(pointers: MediaPointer[]): Promise<Media[]>;
    upload(senderId: string, media: Media[]): Promise<MediaPointer[]>;
}
