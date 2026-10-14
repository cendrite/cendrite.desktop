import React from 'react';
import { PendingContact } from '@/React/Models/PendingContact';
import { PendingContactAction } from './PendingContactReducer';

export interface PendingContactContextType {
    pendingContacts: PendingContact[];
    pendingContactDispatch: React.Dispatch<PendingContactAction>;
}

export const PendingContactContext = React.createContext<PendingContactContextType | undefined>(undefined);

export const usePendingContacts = () => {
    const context = React.useContext(PendingContactContext);

    if (context === undefined) {
        throw new Error('usePendingContacts must be used within a PendingContactProvider');
    }

    const { pendingContacts, pendingContactDispatch } = context;

    return {
        pendingContacts: pendingContacts,
        pendingContactDispatch: pendingContactDispatch,
    };
};
