export class IdentityCache {
  connectionId: string;
  identityKeyPublic: Buffer;
  trusted: boolean;
  timestamp: number;

  constructor(
    connectionId: string,
    identityKeyPublic: Buffer,
    trusted: boolean,
    timestamp: number,
  ) {
    this.connectionId = connectionId;
    this.identityKeyPublic = identityKeyPublic;
    this.trusted = trusted;
    this.timestamp = timestamp;
  }
}
