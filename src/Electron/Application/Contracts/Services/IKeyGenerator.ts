export interface IKeyGenerator {
    generateKeyBundle(connectionId: string): Promise<void>;
}
