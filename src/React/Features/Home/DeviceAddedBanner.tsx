import React from 'react';
import { ShieldWarningIcon, XIcon } from '@phosphor-icons/react';
import { useDeviceAlert } from '@/React/Context/DeviceAlert/DeviceAlertContext.tsx';

interface DeviceAddedBannerProps {
    onReview: () => void;
}

const DeviceAddedBanner: React.FC<DeviceAddedBannerProps> = ({ onReview }) => {
    const { platform, dismiss } = useDeviceAlert();

    if (platform === null) return null;

    return (
        <div
            role="alert"
            className="absolute inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-sm text-fg-muted shadow-sm"
        >
            <ShieldWarningIcon className="h-5 w-5 shrink-0 text-warning" />
            <p className="flex-1">
                A new {platform} device was added to your account. Not you?{' '}
                <button
                    type="button"
                    className="text-fg underline underline-offset-4 hover:text-fg-subtle"
                    onClick={() => {
                        dismiss();
                        onReview();
                    }}
                >
                    Review devices
                </button>
            </p>
            <button type="button" aria-label="Dismiss" className="text-fg-subtle hover:text-fg" onClick={dismiss}>
                <XIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default DeviceAddedBanner;
