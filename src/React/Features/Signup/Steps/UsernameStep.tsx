import React, { useState } from 'react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import { USERNAME_MAX, validateUsername } from '@/React/Common/Components/Onboarding/OnboardingValidation.ts';
import { onboardingActions, onboardingButton, onboardingField } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';

interface UsernameStepProps {
    initialUsername: string;
    error: string | null;
    busy: boolean;
    onContinue: (username: string) => void;
}

const UsernameStep: React.FC<UsernameStepProps> = ({ initialUsername, error, busy, onContinue }) => {
    const [username, setUsername] = useState(initialUsername);
    const [validationError, setValidationError] = useState<string | null>(null);
    const message = validationError ?? error;

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
                placeholder="alice"
                aria-invalid={message !== null}
                className={`mt-2 ${onboardingField(message !== null)}`}
            />
            <p className="mt-2 text-sm text-fg-faint">
                Shown to your friends, with a tag like <span className="font-mono">alice#4F21KD</span> so names never clash.
            </p>
            <FieldError message={message} />

            <div className={onboardingActions}>
                <Button type="submit" variant="solid" size="md" disabled={busy} className={onboardingButton}>
                    Continue
                </Button>
            </div>
        </form>
    );
};

export default UsernameStep;
