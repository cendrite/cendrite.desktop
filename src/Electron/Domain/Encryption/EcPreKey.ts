export class EcPreKey {
  id: number;
  publicKey: Buffer;
  privateKey: Buffer;
  consumed: boolean; // 0 = not consumed, 1 = consumed,

  constructor(
    id: number,
    publicKey: Buffer,
    privateKey: Buffer,
    consumed: boolean,
  ) {
    this.id = id;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.consumed = consumed;
  }
}
