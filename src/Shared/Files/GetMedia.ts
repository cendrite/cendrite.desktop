export enum MediaType {
    Image,
    All
}

export class GetMediaQuery implements MediatorRequest {
    public readonly type = "GetMediaQuery";
    public readonly mediaType: MediaType;

    constructor(mediaType: MediaType){
        this.mediaType = mediaType;
    }
}