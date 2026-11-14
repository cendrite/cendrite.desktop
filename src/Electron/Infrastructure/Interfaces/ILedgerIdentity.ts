export interface ILedgerIdentity {
    sign(data: Buffer): Promise<Buffer>;
    publicKey(): Promise<Buffer>;
    connectionId(): Promise<string>;
    verify(identityKey: Buffer, data: Buffer, signature: Buffer): boolean;
}
