export interface IMetaDataStripper {
    strip(content: Buffer, mimeType: string): Buffer;
}
