import React from 'react';
import { PendingContact } from '../../Models/PendingContact';
import { PendingContactContextAction } from './PendingContactReducer';

export interface PendingContactContextType {
    pendingContacts: PendingContact[];
    pendingContactDispatch: React.Dispatch<PendingContactContextAction>;
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
