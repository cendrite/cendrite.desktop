import React from 'react';
import clsx from 'clsx';
import { Contact } from '../../../Models/Contact.ts';
import Avatar from '../Avatar/Avatar.tsx';

export type ContactCardVariant = 'plain' | 'outlined';

interface ContactCardProps {
    contact: Pick<Contact, 'username' | 'displayName' | 'avatarKey'>;
    selected: boolean;
    onClick: () => void;
    variant?: ContactCardVariant;
    trailing?: React.ReactNode;
}

const variants: Record<ContactCardVariant, { base: string; selected: string; idle: string }> = {
    plain: {
        base: 'rounded-md px-2 py-2',
        selected: 'bg-surface-hover',
        idle: 'hover:bg-surface-hover',
    },
    outlined: {
        base: 'rounded-xl border px-4 py-3.5',
        selected: 'border-accent bg-surface-hover',
        idle: 'border-line hover:bg-surface-hover',
    },
};

const ContactCard: React.FC<ContactCardProps> = ({ contact, selected, onClick, variant = 'plain', trailing }) => {
    const styles = variants[variant];

    return (
        <button
            onClick={onClick}
            className={clsx(
                'relative flex w-full items-center gap-3 text-left transition-colors',
                styles.base,
                selected ? styles.selected : styles.idle,
            )}
        >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-media">
                <Avatar className="h-11 w-11 text-sm" AvatarKey={contact.avatarKey} Username={contact.username} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{contact.displayName ?? contact.username}</p>
                {contact.displayName && <p className="mt-1 truncate text-xs text-fg-subtle">{contact.username}</p>}
            </div>
            {trailing}
        </button>
    );
};

export default ContactCard;
