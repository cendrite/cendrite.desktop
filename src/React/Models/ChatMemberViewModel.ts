import {ChatPrivileges} from "../../Electron/Domain/Enums/ChatPrivileges.ts";
import {Contact} from "../Context/ContactContext.tsx";

export class ChatMemberViewModel {
    id: string;
    privilege: ChatPrivileges;
    displayName: string | null;
    contact: Contact;

    constructor(id: string, privilege: ChatPrivileges, displayName: string | null, contact: Contact) {
        this.id = id;
        this.privilege = privilege;
        this.displayName = displayName;
        this.contact = contact;
    }
}