import React, { useState } from 'react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

interface UsernameStepProps {
    initialUsername: string;
    error: string | null;
    busy: boolean;
    onContinue: (username: string) => void;
}

function validate(username: string): string | null {
    if (username.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
    if (username.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
    return null;
}

const UsernameStep: React.FC<UsernameStepProps> = ({ initialUsername, error, busy, onContinue }) => {
    const [username, setUsername] = useState(initialUsername);
    const [touched, setTouched] = useState(false);

    const trimmed = username.trim();
    const validationError = touched ? validate(trimmed) : null;

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setTouched(true);
        if (validate(trimmed) === null) onContinue(trimmed);
    };

    return (
        <form onSubmit={submit} noValidate>
            <label htmlFor="signup-username" className="text-sm font-medium text-fg-muted">
                Username
            </label>
            <input
                id="signup-username"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                maxLength={USERNAME_MAX + 10}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="e.g. alice"
                className="mt-1.5 h-10 w-full rounded-md border border-line-strong bg-field px-3 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="mt-1.5 text-xs text-fg-faint">
                Shown to your friends. You get a tag like <span className="font-mono">alice#4F21KD</span> so names never clash.
            </p>
            <FieldError message={validationError ?? error} />

            <Button type="submit" variant="primary" size="md" disabled={busy} className="mt-6 h-10 w-full">
                Continue
            </Button>
        </form>
    );
};

export default UsernameStep;
