import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/React/Common/Components/Button/Button.tsx';
import OnboardingLayout from '@/React/Common/Components/Onboarding/OnboardingLayout.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import { onboardingActions, onboardingButton, onboardingField, onboardingLink } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import { User } from '@/React/Models/User.ts';
import { CancelDeviceLinkCommand } from '@/Shared/Devices/CancelDeviceLink.ts';
import { CheckDeviceLinkCommand } from '@/Shared/Devices/CheckDeviceLink.ts';
import { StartDeviceLinkCommand } from '@/Shared/Devices/StartDeviceLink.ts';
import { UserContract } from '@/Shared/Models/UserContract.ts';

const POLL_MS = 2000;

const LinkPage: React.FC = () => {
    const navigate = useNavigate();
    const { userDispatch } = useUser();
    const [code, setCode] = useState('');
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const done = useRef(false);

    useEffect(
        () => () => {
            if (!done.current) void window.electron.sendRequestAsync(new CancelDeviceLinkCommand());
        },
        [],
    );

    useEffect(() => {
        if (!fingerprint) return;
        let cancelled = false;

        const signIn = (user: UserContract) => {
            done.current = true;
            userDispatch({
                type: UserActionType.Initialize,
                payload: new User(user.id, user.username, user.tag, user.deviceId, user.connectionId, user.externalConnectionIds, user.avatarKey, user.displayName),
            });
            navigate('/home');
        };

        const poll = async () => {
            while (!cancelled) {
                await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
                if (cancelled) return;

                const result = await window.electron.sendRequestAsync(new CheckDeviceLinkCommand());
                if (cancelled) return;

                if (!result.success) {
                    setError(result.errorMessage.message);
                    continue;
                }

                switch (result.data.status) {
                    case 'approved':
                        if (result.data.user) signIn(result.data.user);
                        return;
                    case 'rejected':
                        setFingerprint(null);
                        setError('The request was rejected on your other device.');
                        return;
                    case 'expired':
                        setFingerprint(null);
                        setError('The request expired. Create a new code on your other device.');
                        return;
                }
            }
        };

        void poll();
        return () => {
            cancelled = true;
        };
    }, [fingerprint, navigate, userDispatch]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (busy) return;

        const trimmed = code.trim();
        if (trimmed.length === 0) {
            setError('Enter the code shown on your other device.');
            return;
        }

        setBusy(true);
        setError(null);
        const result = await window.electron.sendRequestAsync(new StartDeviceLinkCommand(trimmed));
        setBusy(false);

        if (!result.success) {
            setError(result.errorMessage.message);
            return;
        }

        setFingerprint(result.data.fingerprint);
    };

    const cancel = () => {
        void window.electron.sendRequestAsync(new CancelDeviceLinkCommand());
        setFingerprint(null);
        setError(null);
    };

    if (fingerprint) {
        return (
            <OnboardingLayout
                title="Approve on your other device"
                description="On your signed-in device, pick the code that matches this one."
            >
                <p className="text-center font-mono text-3xl tracking-[0.15em] text-fg">{fingerprint}</p>
                <p className="mt-6 text-center text-sm text-fg-subtle" role="status" aria-live="polite">
                    Waiting for approval…
                </p>
                <FieldError message={error} />
                <div className={onboardingActions}>
                    <button type="button" onClick={cancel} className={onboardingLink}>
                        Cancel
                    </button>
                </div>
            </OnboardingLayout>
        );
    }

    return (
        <OnboardingLayout
            title="Link this device"
            description="On a device you're signed in on, open Settings → Devices and get a code."
            footer={
                <>
                    No other device?{' '}
                    <button type="button" className={onboardingLink} onClick={() => navigate('/recover')}>
                        Use your recovery phrase
                    </button>
                </>
            }
        >
            <form onSubmit={submit} noValidate>
                <label htmlFor="link-code" className="text-sm font-medium text-fg-muted">
                    Code
                </label>
                <input
                    id="link-code"
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={20}
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError(null);
                    }}
                    placeholder="XXXXX-XXXXX"
                    aria-invalid={error !== null}
                    className={`mt-2 font-mono tracking-[0.15em] ${onboardingField(error !== null)}`}
                />
                <FieldError message={error} />

                <div className={onboardingActions}>
                    <Button type="submit" variant="solid" size="md" disabled={busy} className={onboardingButton}>
                        Continue
                    </Button>
                    <button type="button" onClick={() => navigate('/signup')} className={onboardingLink}>
                        Back
                    </button>
                </div>
            </form>
        </OnboardingLayout>
    );
};

export default LinkPage;
