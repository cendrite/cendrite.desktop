import {PendingContact} from "../PendingContactContext.tsx";
import {Contact} from "../ContactContext.tsx";
import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {SelectedItem} from "./HomePageContext.tsx";

export enum HomePageContextActionType {
    SetSelectedContact = 0,
    SetSelectedPendingContact = 1,
    SetSelectedChat = 2,
    ClearSelection = 3
}

export type HomePageContextAction =
    | { type: HomePageContextActionType.SetSelectedContact; payload: Contact | null }
    | { type: HomePageContextActionType.SetSelectedPendingContact; payload: PendingContact | null }
    | { type: HomePageContextActionType.SetSelectedChat; payload: ChatViewModel | null }
    | { type: HomePageContextActionType.ClearSelection; payload: null  };

export const homePageReducer = (
    _state: SelectedItem,
    action: HomePageContextAction
): SelectedItem => {
    switch (action.type) {
        case HomePageContextActionType.SetSelectedContact:
            return { type: 'contact', value: action.payload };
        case HomePageContextActionType.SetSelectedPendingContact:
            return { type: 'pending', value: action.payload };
        case HomePageContextActionType.SetSelectedChat:
            return { type: 'chat', value: action.payload };
        case HomePageContextActionType.ClearSelection:
            return { type: 'none' };
        default:
            throw new Error(`Unhandled action type`);
    }
};
