import React from 'react';
import { ShieldWarningIcon } from '@phosphor-icons/react';
import { useTamperedGroups } from '@/React/Common/Hooks/TamperedGroups.ts';

interface MembershipTamperedBannerProps {
    chatId: string;
}

const MembershipTamperedBanner: React.FC<MembershipTamperedBannerProps> = ({ chatId }) => {
    const tampered = useTamperedGroups();

    if (!tampered.has(chatId)) return null;

    return (
        <div role="alert" className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-sm text-fg-muted">
            <ShieldWarningIcon className="h-5 w-5 shrink-0 text-warning" />
            <p>
                This device lost its place in the group's membership. If nobody removed you, someone may have tampered
                with the group.
            </p>
        </div>
    );
};

export default MembershipTamperedBanner;
