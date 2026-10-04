export interface ILedgerIdentity {
    sign(data: Buffer): Promise<Buffer>;
    publicKey(): Promise<Buffer>;
    verify(identityKey: Buffer, data: Buffer, signature: Buffer): boolean;
}
