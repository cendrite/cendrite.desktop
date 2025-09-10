import {User} from "../Aggregates/User.js";

export class UserConnectionId {
    id!: string;
    connectionId: string;
    user!: User;
    
    constructor(connectionId: string) {
        this.connectionId = connectionId;
    }
}
