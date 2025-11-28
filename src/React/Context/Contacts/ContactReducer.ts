import { Contact } from '../../Models/Contact';

export enum ContactContextActionType {
    Initialize = -1,
    Add = 0,
    Remove = 1,
    AddConnectionId = 3,
    RemoveConnectionId = 4,
}

export type ContactContextAction =
    | { type: ContactContextActionType.Initialize; payload: Contact[] }
    | { type: ContactContextActionType.Add; payload: Contact }
    | { type: ContactContextActionType.Remove; payload: { id: string } }
    | { type: ContactContextActionType.AddConnectionId; payload: { id: string; connectionId: string } }
    | { type: ContactContextActionType.RemoveConnectionId; payload: { id: string; connectionId: string } };

export const contactReducer = (state: Contact[], action: ContactContextAction): Contact[] => {
    switch (action.type) {
        case ContactContextActionType.Initialize:
            return action.payload;

        case ContactContextActionType.Add:
            return [...state, action.payload];

        case ContactContextActionType.Remove:
            return state.filter((contact) => contact.id !== action.payload.id);

        case ContactContextActionType.AddConnectionId:
            return state.map((contact) =>
                contact.id === action.payload.id
                    ? new Contact(
                        contact.id, 
                        contact.username, 
                        contact.displayName, 
                        contact.profilePicture, 
                        [...contact.connectionIds,
                        action.payload.connectionId])
                    : contact);

        case ContactContextActionType.RemoveConnectionId:
            return state.map((contact) =>
                contact.id === action.payload.id
                    ? new Contact(
                        contact.id, 
                        contact.username, 
                        contact.displayName, 
                        contact.profilePicture, 
                        contact.connectionIds.filter((cid) => cid !== action.payload.connectionId))
                    : contact);

        default:
            return state;
    }
};
