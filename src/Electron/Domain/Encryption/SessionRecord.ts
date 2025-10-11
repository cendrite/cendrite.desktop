export class SessionRecord{
  connectionId: string; 
  record: Buffer;

  constructor(connectionId: string, record: Buffer) {
    this.connectionId = connectionId;
    this.record = record;
  }
}
