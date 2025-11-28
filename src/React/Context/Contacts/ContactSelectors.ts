import { Contact } from "../../Models/Contact";

export function getById(contacts: Contact[], id: string): Contact | undefined {
    return contacts.find(contact => contact.id === id);
}

export function getByConnectionId(contacts: Contact[], connectionId: string): Contact | undefined {
    return contacts.find(contact => contact.connectionIds.includes(connectionId));
}

