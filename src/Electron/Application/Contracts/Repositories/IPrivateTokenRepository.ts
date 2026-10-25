export interface IPrivateTokenRepository {
    store(origin: string, tokens: Buffer[]): Promise<void>;
    count(origin: string): Promise<number>;
    take(origin: string): Promise<Buffer | null>;
    deleteAll(): Promise<void>;
}
