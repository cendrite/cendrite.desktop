export interface IMediaStore {
    store(id: string, content: Uint8Array): Promise<void>;
    get(mediaId: string): Promise<Buffer>;
    delete(mediaId: string): Promise<void>;
    clear(): Promise<void>;
}
