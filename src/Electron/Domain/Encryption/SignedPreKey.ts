export class SignedPreKey {
  keyId: number;
  publicKey: Buffer;
  privateKey: Buffer;
  signature: Buffer;
  createdAt: Date;

  constructor(
    keyId: number,
    publicKey: Buffer,
    privateKey: Buffer,
    signature: Buffer,
    createdAt: Date,
  ) {
    this.keyId = keyId;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signature = signature;
    this.createdAt = createdAt;
  }
}
