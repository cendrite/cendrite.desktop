import React from 'react';
import clsx from 'clsx';
import { initialOf } from './AvatarTemplates.ts';

interface AvatarProps {
    className?: string;
    AvatarKey: string | null;
    Username: string;
}

const avatar_url = 'https://conduit.xhykl49jkg.org/api/profile/avatar';

const Avatar: React.FC<AvatarProps> = ({ className, AvatarKey, Username }) => {
    if (AvatarKey) {
        return (
            <img
                src={`${avatar_url}?fileKey=${AvatarKey}`}
                alt={Username}
                className={clsx('rounded-full object-cover', className)}
            />
        );
    }

    const initial = initialOf(Username);

    return (
        <div
            role="img"
            aria-label={Username}
            className={clsx('shrink-0 overflow-hidden rounded-full bg-accent-soft text-accent-soft-fg', className)}
        >
            <svg viewBox="0 0 100 100" className="h-full w-full select-none" aria-hidden="true">
                <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="currentColor"
                    fontSize={44}
                    fontWeight={500}
                >
                    {initial}
                </text>
            </svg>
        </div>
    );
};

export default Avatar;
