import { PendingContact } from "@/React/Models/PendingContact";
import { unknownAction } from "../unknownAction.ts";

export enum PendingContactActionType {
    Initialize = -1,
    Add = 0,
    Remove = 1,
    MarkAsSeen = 2,
    Clear = 3,
}

export type PendingContactAction =
    | { type: PendingContactActionType.Initialize; payload: PendingContact[] }
    | { type: PendingContactActionType.Add; payload: PendingContact }
    | { type: PendingContactActionType.Remove; payload: { id: string } }
    | { type: PendingContactActionType.MarkAsSeen; payload: { id: string } }
    | { type: PendingContactActionType.Clear };

export const pendingContactReducer = (
    state: PendingContact[],
    action: PendingContactAction
): PendingContact[] => {
    switch (action.type) {
        case PendingContactActionType.Initialize:
            return action.payload;

        case PendingContactActionType.Add:
            if (state.some((pending) => pending.id === action.payload.id)) return state;
            return [...state, action.payload];

        case PendingContactActionType.Remove:
            return state.filter((pending) => pending.id !== action.payload.id);

        case PendingContactActionType.MarkAsSeen:
            return state.map((pending) =>
                pending.id === action.payload.id
                    ? new PendingContact(
                        pending.id,
                        pending.username,
                        true,
                        pending.displayName,
                        pending.avatarKey)
                    : pending);

        case PendingContactActionType.Clear:
            return [];

        default:
            return unknownAction('PendingContactReducer', action);
    }
};
