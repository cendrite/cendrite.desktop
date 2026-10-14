import { Contact } from '@/React/Models/Contact';

export enum ContactActionType {
    Initialize = -1,
    Add = 0,
    Remove = 1,
    AddConnectionId = 3,
    RemoveConnectionId = 4,
    Clear = 5,
}

export type ContactAction =
    | { type: ContactActionType.Initialize; payload: Contact[] }
    | { type: ContactActionType.Add; payload: Contact }
    | { type: ContactActionType.Remove; payload: { id: string } }
    | { type: ContactActionType.AddConnectionId; payload: { id: string; connectionId: string } }
    | { type: ContactActionType.RemoveConnectionId; payload: { id: string; connectionId: string } }
    | { type: ContactActionType.Clear };

export const contactReducer = (state: Contact[], action: ContactAction): Contact[] => {
    switch (action.type) {
        case ContactActionType.Initialize:
            return action.payload;

        case ContactActionType.Add:
            return [...state, action.payload];

        case ContactActionType.Remove:
            return state.filter((contact) => contact.id !== action.payload.id);

        case ContactActionType.AddConnectionId:
            return state.map((contact) =>
                contact.id === action.payload.id
                    ? new Contact(
                        contact.id, 
                        contact.username, 
                        contact.displayName, 
                        contact.avatarKey, 
                        [...contact.connectionIds,
                        action.payload.connectionId])
                    : contact);

        case ContactActionType.RemoveConnectionId:
            return state.map((contact) =>
                contact.id === action.payload.id
                    ? new Contact(
                        contact.id, 
                        contact.username, 
                        contact.displayName, 
                        contact.avatarKey, 
                        contact.connectionIds.filter((cid) => cid !== action.payload.connectionId))
                    : contact);

        case ContactActionType.Clear:
            return [];

        default:
            return state;
    }
};
