import { Result } from "../../../../Shared/Result/Result.js";

export interface IMediaProvider {
    upload(id: string, cipher: Uint8Array): Promise<Result>;
    get(id: string): Promise<Result<Uint8Array>>;
    ack(id: string): Promise<Result>;
}
