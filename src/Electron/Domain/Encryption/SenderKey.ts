export class SenderKey{
  groupId: string;
  connectionId: string;
  record: Buffer;
  
  constructor(groupId: string, connectionId: string, record: Buffer) {
    this.groupId = groupId;
    this.connectionId = connectionId;
    this.record = record;
  }
}
