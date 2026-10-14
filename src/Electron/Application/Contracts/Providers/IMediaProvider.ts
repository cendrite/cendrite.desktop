import { Result } from "#shared/Result/Result";

export interface IMediaProvider {
    upload(id: string, cipher: Uint8Array): Promise<Result>;
    get(id: string): Promise<Result<Uint8Array>>;
    ack(id: string): Promise<Result>;
}
