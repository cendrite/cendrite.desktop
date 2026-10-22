import { Result } from "#shared/Result/Result";

export interface IMediaProvider {
    upload(cipher: Uint8Array): Promise<Result<string>>;
    get(id: string): Promise<Result<Uint8Array>>;
}
