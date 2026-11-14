import React from 'react';
import clsx from 'clsx';
import { initialOf, templateBackground, templateFor } from './AvatarTemplates.ts';

interface AvatarProps {
    className?: string;
    AvatarKey: string | null;
    Username: string;
    Seed: string;
}

const avatar_url = 'https://conduit.xhykl49jkg.org/api/profile/avatar';

const Avatar: React.FC<AvatarProps> = ({ className, AvatarKey, Username, Seed }) => {
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
            style={{ backgroundImage: templateBackground(templateFor(Seed)) }}
            className={clsx('shrink-0 overflow-hidden rounded-full', className)}
        >
            <svg viewBox="0 0 100 100" className="h-full w-full select-none" aria-hidden="true">
                <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255, 255, 255, 0.95)"
                    fontSize={44}
                    fontWeight={600}
                >
                    {initial}
                </text>
            </svg>
        </div>
    );
};

export default Avatar;
