import {User} from "../Aggregates/User.js";

export class UserConnectionId {
    id!: string;
    connectionId: string;
    user: User;
    
    constructor(connectionId: string, user: User) { 
        this.user = user;
        this.connectionId = connectionId;
    }
}
