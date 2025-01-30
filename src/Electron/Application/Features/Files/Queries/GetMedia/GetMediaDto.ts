
export class GetMediaDto{
    public readonly media: string;
    private constructor(media: string){
        this.media = media;
    }
    public static MapFrom(media: string): GetMediaDto{
        return new GetMediaDto(media);
    }
}