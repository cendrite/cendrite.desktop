import { describe, expect, test } from 'vitest';
import { ContactAction, ContactActionType, contactReducer } from '../../../../../src/React/Context/Contacts/ContactReducer.ts';
import { Contact } from '../../../../../src/React/Models/Contact.ts';

const alice = new Contact('a', 'alice', 'Alice', 'alice-key', ['d1']);
const bob = new Contact('b', 'bob', null, null, []);

describe('contactReducer', () => {
    test('initialize replaces the list', () => {
        expect(contactReducer([alice], { type: ContactActionType.Initialize, payload: [bob] })).toEqual([bob]);
    });

    test('add appends to the end', () => {
        expect(contactReducer([alice], { type: ContactActionType.Add, payload: bob })).toEqual([alice, bob]);
    });

    test('adding a contact that is already there returns the same list', () => {
        const before = [alice];

        expect(contactReducer(before, { type: ContactActionType.Add, payload: alice })).toBe(before);
    });

    test('remove drops only the matching id', () => {
        const state = contactReducer([alice, bob], { type: ContactActionType.Remove, payload: { id: 'a' } });

        expect(state).toEqual([bob]);
    });

    test('adding a connection id appends it to that contact only and keeps the rest of the contact', () => {
        const state = contactReducer([alice, bob], {
            type: ContactActionType.AddConnectionId,
            payload: { id: 'a', connectionId: 'd2' },
        });

        expect(state[0]).toEqual({ ...alice, connectionIds: ['d1', 'd2'] });
        expect(state[1]).toBe(bob);
    });

    test('adding a connection id does not mutate the previous contact', () => {
        contactReducer([alice], {
            type: ContactActionType.AddConnectionId,
            payload: { id: 'a', connectionId: 'd2' },
        });

        expect(alice.connectionIds).toEqual(['d1']);
    });

    test('adding a connection id the contact already has returns the same list', () => {
        const before = [alice];

        const state = contactReducer(before, {
            type: ContactActionType.AddConnectionId,
            payload: { id: 'a', connectionId: 'd1' },
        });

        expect(state).toBe(before);
    });

    test('adding a connection id for an unknown contact changes nothing', () => {
        const state = contactReducer([alice], {
            type: ContactActionType.AddConnectionId,
            payload: { id: 'zzz', connectionId: 'd2' },
        });

        expect(state).toEqual([alice]);
    });

    test('removing a connection id drops only that id', () => {
        const withTwo = new Contact('a', 'alice', 'Alice', 'alice-key', ['d1', 'd2']);

        const state = contactReducer([withTwo], {
            type: ContactActionType.RemoveConnectionId,
            payload: { id: 'a', connectionId: 'd1' },
        });

        expect(state[0].connectionIds).toEqual(['d2']);
    });

    test('clear empties the list', () => {
        expect(contactReducer([alice, bob], { type: ContactActionType.Clear })).toEqual([]);
    });

    test('an unknown action throws', () => {
        const unknown = { type: 99 } as unknown as ContactAction;

        expect(() => contactReducer([], unknown)).toThrow('Unknown action type in ContactReducer');
    });
});
