import React from 'react';
import clsx from 'clsx';
import { ChatMemberViewModel } from '@/React/Models/ChatMemberViewModel.ts';
import Avatar from './Avatar.tsx';

interface AvatarStackProps {
    members: ChatMemberViewModel[];
    className?: string;
    textClassName?: string;
}

const positions: Record<number, string[]> = {
    2: ['top-0 left-0', 'bottom-0 right-0'],
    3: ['top-0 left-1/2 -translate-x-1/2', 'bottom-0 left-0', 'bottom-0 right-0'],
};

const AvatarStack: React.FC<AvatarStackProps> = ({ members, className, textClassName = '!text-[0.6rem]' }) => {
    const shown = members.slice(0, 3);

    if (shown.length < 2) {
        const member = shown[0];
        return (
            <div className={clsx('shrink-0 overflow-hidden rounded-full bg-media', className)}>
                <Avatar
                    className="h-full w-full"
                    AvatarKey={member?.avatar ?? null}
                    Username={member?.name ?? '?'}
                />
            </div>
        );
    }

    return (
        <div className={clsx('relative shrink-0', className)}>
            {shown.map((member, i) => (
                <div
                    key={member.id}
                    className={clsx(
                        'absolute h-[62%] w-[62%] overflow-hidden rounded-full bg-media ring-2 ring-surface',
                        positions[shown.length][i],
                    )}
                >
                    <Avatar
                        className={clsx('h-full w-full', textClassName)}
                        AvatarKey={member.avatar}
                        Username={member.name}
                    />
                </div>
            ))}
        </div>
    );
};

export default AvatarStack;
