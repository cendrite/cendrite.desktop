export interface ILedgerIdentity {
    sign(data: Buffer): Promise<Buffer>;
    publicKey(): Promise<Buffer>;

    /** A peer's identity key as this device knows it, or null if we have never spoken to that device. */
    peerPublicKey(connectionId: string): Promise<Buffer | null>;
    verify(identityKey: Buffer, data: Buffer, signature: Buffer): boolean;
}
