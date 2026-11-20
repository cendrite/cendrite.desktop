import { WriteKeyRole } from '../Enums/WriteKeyRole.js';

export interface KeyGrant {
    publicKey: string;
    role: WriteKeyRole;
}

export interface KeyChanges {
    added: string[];
    invites: KeyGrant[];
    removed: string[];
    roles: KeyGrant[];
}
