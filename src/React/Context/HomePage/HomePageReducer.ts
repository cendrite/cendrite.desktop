import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { SelectedItem } from './HomePageContext.tsx';
import { Contact } from '@/React/Models/Contact.ts';
import { PendingContact } from '@/React/Models/PendingContact.ts';

export enum HomePageActionType {
    SetSelectedContact = 0,
    SetSelectedPendingContact = 1,
    SetSelectedChat = 2,
    Clear = 3,
}

export type HomePageAction =
    | { type: HomePageActionType.SetSelectedContact; payload: Contact }
    | { type: HomePageActionType.SetSelectedPendingContact; payload: PendingContact }
    | { type: HomePageActionType.SetSelectedChat; payload: ChatViewModel }
    | { type: HomePageActionType.Clear };

export const homePageReducer = (_state: SelectedItem, action: HomePageAction): SelectedItem => {
    switch (action.type) {
        case HomePageActionType.SetSelectedContact:
            return { type: 'contact', value: action.payload };
        case HomePageActionType.SetSelectedPendingContact:
            return { type: 'pending', value: action.payload };
        case HomePageActionType.SetSelectedChat:
            return { type: 'chat', value: action.payload };
        case HomePageActionType.Clear:
            return { type: 'none' };
        default:
            throw new Error(`Unhandled action type`);
    }
};
