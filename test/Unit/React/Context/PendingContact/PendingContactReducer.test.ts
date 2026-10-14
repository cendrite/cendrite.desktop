import { describe, expect, test } from 'vitest';
import {
    PendingContactAction,
    PendingContactActionType,
    pendingContactReducer,
} from '../../../../../src/React/Context/PendingContact/PendingContactReducer.ts';
import { PendingContact } from '../../../../../src/React/Models/PendingContact.ts';

const alice = new PendingContact('a', 'alice', false, 'Alice', 'alice-key');
const bob = new PendingContact('b', 'bob', false, null, null);

describe('pendingContactReducer', () => {
    test('initialize replaces the list', () => {
        const state = pendingContactReducer([alice], {
            type: PendingContactActionType.Initialize,
            payload: [bob],
        });

        expect(state).toEqual([bob]);
    });

    test('add appends to the end', () => {
        const state = pendingContactReducer([alice], { type: PendingContactActionType.Add, payload: bob });

        expect(state).toEqual([alice, bob]);
    });

    test('adding a pending contact that is already there returns the same list', () => {
        const before = [alice];

        const state = pendingContactReducer(before, { type: PendingContactActionType.Add, payload: alice });

        expect(state).toBe(before);
    });

    test('remove drops only the matching id', () => {
        const state = pendingContactReducer([alice, bob], {
            type: PendingContactActionType.Remove,
            payload: { id: 'a' },
        });

        expect(state).toEqual([bob]);
    });

    test('remove of an unknown id leaves the list as it was', () => {
        const state = pendingContactReducer([alice, bob], {
            type: PendingContactActionType.Remove,
            payload: { id: 'zzz' },
        });

        expect(state).toEqual([alice, bob]);
    });

    test('mark as seen flips only the matching contact and keeps its other fields', () => {
        const state = pendingContactReducer([alice, bob], {
            type: PendingContactActionType.MarkAsSeen,
            payload: { id: 'a' },
        });

        expect(state[0]).toEqual({ ...alice, IsSeen: true });
        expect(state[1]).toBe(bob);
    });

    test('mark as seen does not mutate the original contact', () => {
        pendingContactReducer([alice], {
            type: PendingContactActionType.MarkAsSeen,
            payload: { id: 'a' },
        });

        expect(alice.IsSeen).toBe(false);
    });

    test('clear empties the list', () => {
        expect(pendingContactReducer([alice, bob], { type: PendingContactActionType.Clear })).toEqual([]);
    });

    test('an unknown action throws', () => {
        const unknown = { type: 99 } as unknown as PendingContactAction;

        expect(() => pendingContactReducer([], unknown)).toThrow('Unknown action type in PendingContactReducer');
    });
});
