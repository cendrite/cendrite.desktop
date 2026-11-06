import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Button from '@/React/Common/Components/Button/Button.tsx';
import { useDeviceLinkRequest } from '@/React/Context/DeviceLink/DeviceLinkRequestContext.tsx';
import { ApproveDeviceLinkCommand } from '@/Shared/Devices/ApproveDeviceLink.ts';
import { CreateLinkCodeCommand, LinkCodeContract } from '@/Shared/Devices/CreateLinkCode.ts';
import { GetPendingLinkQuery, PendingLinkContract } from '@/Shared/Devices/GetPendingLink.ts';
import { RejectDeviceLinkCommand } from '@/Shared/Devices/RejectDeviceLink.ts';

interface LinkDevicePanelProps {
    onLinked: () => void;
}

function formatCode(code: string): string {
    return `${code.slice(0, 5)}-${code.slice(5)}`;
}

function useCountdown(expiresAt: string | null): string | null {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!expiresAt) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [expiresAt]);

    if (!expiresAt) return null;
    const seconds = Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const LinkDevicePanel: React.FC<LinkDevicePanelProps> = ({ onLinked }) => {
    const { request, clear } = useDeviceLinkRequest();
    const [code, setCode] = useState<LinkCodeContract | null>(null);
    const [pending, setPending] = useState<PendingLinkContract | null>(null);
    const [chosen, setChosen] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const countdown = useCountdown(code?.expiresAt ?? null);

    useEffect(() => {
        if (!request) return;
        let cancelled = false;

        setCode(null);
        setChosen(null);
        setMessage(null);
        window.electron.sendRequestAsync(new GetPendingLinkQuery(request.pendingLinkId)).then((result) => {
            if (cancelled) return;
            if (result.success) {
                setPending(result.data);
            } else {
                setMessage(result.errorMessage.message);
                clear();
            }
        });

        return () => {
            cancelled = true;
        };
    }, [request, clear]);

    const createCode = async () => {
        setBusy(true);
        setMessage(null);
        const result = await window.electron.sendRequestAsync(new CreateLinkCodeCommand());
        setBusy(false);
        if (result.success) setCode(result.data);
        else setMessage(result.errorMessage.message);
    };

    const finish = (text: string) => {
        setPending(null);
        setChosen(null);
        setMessage(text);
        clear();
    };

    const approve = async () => {
        if (!pending || !chosen) return;
        setBusy(true);
        const result = await window.electron.sendRequestAsync(new ApproveDeviceLinkCommand(pending.pendingLinkId, chosen));
        setBusy(false);
        if (result.success) {
            finish(`The ${pending.devicePlatform} device is now linked.`);
            onLinked();
        } else {
            finish(result.errorMessage.message);
        }
    };

    const reject = async () => {
        if (!pending) return;
        setBusy(true);
        await window.electron.sendRequestAsync(new RejectDeviceLinkCommand(pending.pendingLinkId));
        setBusy(false);
        finish('The request was rejected.');
    };

    if (pending) {
        return (
            <div className="rounded-lg border border-line p-5">
                <p className="text-sm font-medium text-fg">Link a {pending.devicePlatform} device?</p>
                <p className="mt-1 text-sm text-fg-subtle">Pick the code shown on the new device. If none match, reject.</p>

                <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Device code">
                    {pending.fingerprints.map((fingerprint) => (
                        <button
                            key={fingerprint}
                            type="button"
                            role="radio"
                            aria-checked={chosen === fingerprint}
                            onClick={() => setChosen(fingerprint)}
                            className={clsx(
                                'h-11 rounded-md border px-4 text-left font-mono text-[15px] tracking-wider transition-colors',
                                chosen === fingerprint ? 'border-fg text-fg' : 'border-line-strong text-fg-muted hover:border-fg-subtle',
                            )}
                        >
                            {fingerprint}
                        </button>
                    ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <Button type="button" variant="solid" size="md" disabled={!chosen || busy} onClick={approve} className="h-9 px-4">
                        Approve
                    </Button>
                    <Button type="button" variant="ghost" size="md" disabled={busy} onClick={reject} className="h-9 px-4">
                        Reject
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-line p-5">
            {code ? (
                <>
                    <p className="text-sm text-fg-subtle">Enter this code on the new device:</p>
                    <p className="mt-3 select-all font-mono text-2xl tracking-[0.2em] text-fg">{formatCode(code.code)}</p>
                    <p className="mt-3 text-xs text-fg-faint">
                        {countdown === '0:00' ? 'This code has expired.' : `Expires in ${countdown}. Keep this window open.`}
                    </p>
                    <button type="button" className="mt-4 text-sm text-fg-subtle underline underline-offset-4 hover:text-fg" onClick={() => setCode(null)}>
                        Cancel
                    </button>
                </>
            ) : (
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <p className="text-sm font-medium text-fg">Link a new device</p>
                        <p className="mt-1 text-sm text-fg-subtle">Sign in on another computer without your recovery phrase.</p>
                    </div>
                    <Button type="button" variant="solid" size="md" disabled={busy} onClick={createCode} className="h-9 shrink-0 px-4">
                        Get code
                    </Button>
                </div>
            )}
            {message && <p className="mt-4 text-sm text-fg-muted">{message}</p>}
        </div>
    );
};

export default LinkDevicePanel;
