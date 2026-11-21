import React from 'react';
import { ShieldWarningIcon } from '@phosphor-icons/react';
import { MembershipWarning } from '@/Shared/Enums/MembershipWarning';
import { useMembershipWarning } from '@/React/Common/Hooks/MembershipWarning.ts';

interface MembershipWarningBannerProps {
    groupId: string;
}

const MESSAGES: Record<MembershipWarning, string> = {
    [MembershipWarning.LostAccess]:
        "This device can no longer read the group's membership. You may have been removed, or the server is keeping you out.",
    [MembershipWarning.Tampered]:
        "This group's membership was changed in a way your device didn't agree to. This can mean the server or another member is tampering with the group.",
};

const MembershipWarningBanner: React.FC<MembershipWarningBannerProps> = ({ groupId }) => {
    const warning = useMembershipWarning(groupId);

    if (warning === null) return null;

    return (
        <div role="alert" className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-sm text-fg-muted">
            <ShieldWarningIcon className="h-5 w-5 shrink-0 text-warning" />
            <p>{MESSAGES[warning]}</p>
        </div>
    );
};

export default MembershipWarningBanner;
