export interface IMediaMetadataStripper {
    strip(content: Buffer, mimeType: string): Buffer;
}
