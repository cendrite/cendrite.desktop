import React from 'react';
import { ShieldWarningIcon, XIcon } from '@phosphor-icons/react';
import { useDeviceAlert } from '@/React/Context/DeviceAlert/DeviceAlertContext.tsx';

interface DeviceAlertBannerProps {
    onReview: (deviceId: string) => void;
}

const DeviceAlertBanner: React.FC<DeviceAlertBannerProps> = ({ onReview }) => {
    const { alert, dismiss } = useDeviceAlert();

    if (alert === null) return null;

    const message =
        alert.kind === 'deviceAdded'
            ? `A new ${alert.platform} device was added to your account. Not you?`
            : `Your recovery phrase was changed on ${alert.deviceName}. Not you? Remove that device, then regenerate your phrase.`;

    return (
        <div
            role="alert"
            className="absolute inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-sm text-fg-muted shadow-sm"
        >
            <ShieldWarningIcon className="h-5 w-5 shrink-0 text-warning" />
            <p className="flex-1">
                {message}{' '}
                <button
                    type="button"
                    className="text-fg underline underline-offset-4 hover:text-fg-subtle"
                    onClick={() => {
                        dismiss();
                        onReview(alert.deviceId);
                    }}
                >
                    Review device
                </button>
            </p>
            <button type="button" aria-label="Dismiss" className="text-fg-subtle hover:text-fg" onClick={dismiss}>
                <XIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default DeviceAlertBanner;
