import React from 'react';
import { ShieldWarningIcon } from '@phosphor-icons/react';
import { ChatMemberViewModel } from '@/React/Models/ChatMemberViewModel.ts';
import { useUntrustedDevices } from '@/React/Common/Hooks/UntrustedDevices.ts';

interface UntrustedDeviceBannerProps {
    members: ChatMemberViewModel[];
}

const UntrustedDeviceBanner: React.FC<UntrustedDeviceBannerProps> = ({ members }) => {
    const untrusted = useUntrustedDevices();
    const affected = members.filter((member) => member.devices.some((device) => untrusted.has(device)));

    if (affected.length === 0) return null;

    const names = affected.map((member) => member.name).join(', ');

    return (
        <div role="alert" className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-sm text-fg-muted">
            <ShieldWarningIcon className="h-5 w-5 shrink-0 text-warning" />
            <p>
                One of {names}'s devices couldn't be verified. Messages aren't sent to it or accepted from it. This can
                mean someone is trying to intercept your messages.
            </p>
        </div>
    );
};

export default UntrustedDeviceBanner;
