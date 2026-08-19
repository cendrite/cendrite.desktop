import { MessageContract } from '../../../Contracts/Models/MessageContract.js';

export class TransmitMessageCommand implements MediatorRequest {
    type = 'TransmitMessageCommand';
    public readonly message: MessageContract;
    public readonly connectionIds: string[];

    public constructor(message: MessageContract, connectionIds: string[]) {
        this.message = message;
        this.connectionIds = connectionIds;
    }
}
