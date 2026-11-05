import React, { useState } from 'react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import { USERNAME_MAX, validateUsername } from '@/React/Common/Components/Onboarding/OnboardingValidation.ts';

interface UsernameStepProps {
    initialUsername: string;
    error: string | null;
    busy: boolean;
    onContinue: (username: string) => void;
}

const UsernameStep: React.FC<UsernameStepProps> = ({ initialUsername, error, busy, onContinue }) => {
    const [username, setUsername] = useState(initialUsername);
    const [validationError, setValidationError] = useState<string | null>(null);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const problem = validateUsername(username);
        setValidationError(problem);
        if (problem === null) onContinue(username.trim());
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
                onChange={(e) => {
                    setUsername(e.target.value);
                    setValidationError(null);
                }}
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
