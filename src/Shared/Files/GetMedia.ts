import { MediaContract } from '../Models/MediaContract.js';
export enum MediaType {
    Image,
    All
}

export class GetMediaQuery implements MediatorRequest<MediaContract[]> {
    declare readonly _response?: MediaContract[];
    public readonly type = "GetMediaQuery";
    public readonly mediaType: MediaType;

    constructor(mediaType: MediaType){
        this.mediaType = mediaType;
    }
}