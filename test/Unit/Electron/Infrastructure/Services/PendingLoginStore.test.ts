import { describe, expect, test } from 'vitest';
import { PendingLoginStore } from '../../../../../src/Electron/Infrastructure/Services/PendingLoginStore.js';

describe('PendingLoginStore', () => {
    test('returns the pending login for the same user', () => {
        const store = new PendingLoginStore();
        store.set({ userId: 'user-1', nonceId: 'nonce-id', nonce: 'nonce' });

        expect(store.get('user-1')).toEqual({ userId: 'user-1', nonceId: 'nonce-id', nonce: 'nonce' });
    });

    test('returns null for another user', () => {
        const store = new PendingLoginStore();
        store.set({ userId: 'user-1', nonceId: 'nonce-id', nonce: 'nonce' });

        expect(store.get('user-2')).toBeNull();
    });

    test('returns null after clear', () => {
        const store = new PendingLoginStore();
        store.set({ userId: 'user-1', nonceId: 'nonce-id', nonce: 'nonce' });
        store.clear();

        expect(store.get('user-1')).toBeNull();
    });
});
