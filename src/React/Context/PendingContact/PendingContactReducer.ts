import { PendingContact } from "../../Models/PendingContact";

export enum PendingContactContextActionType {
    Initialize = -1,
    Add = 0,
    Remove = 1,
    MarkAsSeen = 2,
}

export type PendingContactContextAction =
    | { type: PendingContactContextActionType.Initialize; payload: PendingContact[] }
    | { type: PendingContactContextActionType.Add; payload: PendingContact }
    | { type: PendingContactContextActionType.Remove; payload: { id: string } }
    | { type: PendingContactContextActionType.MarkAsSeen; payload: { id: string } };

export const pendingContactReducer = (
    state: PendingContact[],
    action: PendingContactContextAction
): PendingContact[] => {
    switch (action.type) {
        case PendingContactContextActionType.Initialize:
            return action.payload;

        case PendingContactContextActionType.Add:
            return [...state, action.payload];

        case PendingContactContextActionType.Remove:
            return state.filter((pending) => pending.id !== action.payload.id);

        case PendingContactContextActionType.MarkAsSeen:
            return state.map((pending) =>
                pending.id === action.payload.id
                    ? new PendingContact(
                        pending.id,
                        pending.username,
                        true,
                        pending.displayName,
                        pending.profilePicture)
                    : pending);

        default:
            return state;
    }
};
