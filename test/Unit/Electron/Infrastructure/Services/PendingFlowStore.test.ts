import { describe, expect, test } from 'vitest';
import { PendingFlowStore } from '#electron/Infrastructure/Services/PendingFlowStore';

describe('pending flow store', () => {
    test('keeps each flow under its own key', () => {
        const store = new PendingFlowStore();

        store.set('rotation', { words: ['a'], confirmIndices: [0] });
        store.set('deviceLink', { pendingLinkId: 'p', pollSecret: 's', devicePublicKey: 'pk', devicePrivateKey: 'sk' });
        store.clear('rotation');

        expect(store.get('rotation')).toBeNull();
        expect(store.get('deviceLink')?.pendingLinkId).toBe('p');
    });

    test('clearAll drops every pending flow', () => {
        const store = new PendingFlowStore();
        store.set('signup', { words: ['a'], confirmIndices: [0], registration: null });
        store.set('rotation', { words: ['b'], confirmIndices: [0] });

        store.clearAll();

        expect(store.get('signup')).toBeNull();
        expect(store.get('rotation')).toBeNull();
    });
});
