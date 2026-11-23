import React from 'react';
import { ShieldWarningIcon } from '@phosphor-icons/react';
import { MembershipWarning } from '@/Shared/Enums/MembershipWarning';
import { useMembershipWarning } from '@/React/Common/Hooks/MembershipWarning.ts';

interface MembershipWarningBannerProps {
    groupId: string;
}

const MembershipWarningBanner: React.FC<MembershipWarningBannerProps> = ({ groupId }) => {
    const warning = useMembershipWarning(groupId);

    if (warning !== MembershipWarning.Tampered) return null;

    return (
        <div role="alert" className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-sm text-fg-muted">
            <ShieldWarningIcon className="h-5 w-5 shrink-0 text-warning" />
            <p>
                This group's membership was changed in a way your device didn't agree to. This can mean the server or
                another member is tampering with the group.
            </p>
        </div>
    );
};

export default MembershipWarningBanner;
