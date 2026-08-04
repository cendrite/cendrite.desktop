import React from 'react';
import clsx from 'clsx';
import { API_URLS } from '../../Api/ApiUrls.ts';

interface AvatarProps {
    className?: string;
    AvatarKey: string | null;
    Username: string;
}

const Avatar: React.FC<AvatarProps> = ({ className, AvatarKey, Username }) => {
    const src = AvatarKey ? `${API_URLS.USER_MANAGEMENT.GET_AVATAR}?fileKey=${AvatarKey}` : null;
    console.log(src);

    return src ? (
        <img src={src} alt="Profile Picture" className={clsx('rounded-full', className)} />
    ) : (
        <div
            className={clsx(
                'rounded-full bg-blue-200 flex items-center justify-center text-2xl font-extralight text-blue-900',
                className,
            )}
        >
            {Username.slice(0, 2).toUpperCase() || '?'}
        </div>
    );
};

export default Avatar;
