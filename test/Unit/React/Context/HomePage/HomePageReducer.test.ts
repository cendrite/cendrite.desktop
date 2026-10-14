import { describe, expect, test } from 'vitest';
import {
    HomePageAction,
    HomePageActionType,
    homePageReducer,
} from '../../../../../src/React/Context/HomePage/HomePageReducer.ts';
import { Contact } from '../../../../../src/React/Models/Contact.ts';
import { PendingContact } from '../../../../../src/React/Models/PendingContact.ts';
import { ChatViewModel } from '../../../../../src/React/Models/ChatViewModel.ts';

const contact = new Contact('c1', 'alice', null, null, []);
const pending = new PendingContact('p1', 'bob', false, null, null);
const chat = new ChatViewModel('chat1', []);

describe('homePageReducer', () => {
    test('selecting a contact', () => {
        const state = homePageReducer(
            { type: 'none' },
            { type: HomePageActionType.SetSelectedContact, payload: contact },
        );

        expect(state).toEqual({ type: 'contact', value: contact });
    });

    test('selecting a pending contact', () => {
        const state = homePageReducer(
            { type: 'none' },
            { type: HomePageActionType.SetSelectedPendingContact, payload: pending },
        );

        expect(state).toEqual({ type: 'pending', value: pending });
    });

    test('selecting a chat', () => {
        const state = homePageReducer(
            { type: 'none' },
            { type: HomePageActionType.SetSelectedChat, payload: chat },
        );

        expect(state).toEqual({ type: 'chat', value: chat });
    });

    test('a new selection replaces the previous one regardless of its kind', () => {
        const state = homePageReducer(
            { type: 'chat', value: chat },
            { type: HomePageActionType.SetSelectedContact, payload: contact },
        );

        expect(state).toEqual({ type: 'contact', value: contact });
    });

    test('clear returns to no selection', () => {
        const state = homePageReducer({ type: 'chat', value: chat }, { type: HomePageActionType.Clear });

        expect(state).toEqual({ type: 'none' });
    });

    test('an unknown action throws', () => {
        const unknown = { type: 99 } as unknown as HomePageAction;

        expect(() => homePageReducer({ type: 'none' }, unknown)).toThrow('Unknown action type in HomePageReducer');
    });
});
