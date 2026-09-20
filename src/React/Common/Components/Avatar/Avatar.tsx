import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
    className?: string;
    AvatarKey: string | null;
    Username: string;
}

const avatar_url =  'https://conduit.xhykl49jkg.org/api/profile/avatar';

const Avatar: React.FC<AvatarProps> = ({ className, AvatarKey, Username }) => {
    const src = AvatarKey ? `${avatar_url}?fileKey=${AvatarKey}` : null;
    console.log(src);

    return src ? (
        <img src={src} alt="Profile Picture" className={clsx('rounded-full', className)} />
    ) : (
        <div
            className={clsx(
                'rounded-full bg-accent-soft flex items-center justify-center text-2xl font-extralight text-accent-soft-fg',
                className,
            )}
        >
            {Username.slice(0, 2).toUpperCase() || '?'}
        </div>
    );
};

export default Avatar;
