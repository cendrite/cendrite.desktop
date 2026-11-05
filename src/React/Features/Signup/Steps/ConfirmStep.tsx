import React, { useState } from 'react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import { onboardingActions, onboardingButton, onboardingField, onboardingLink } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';

interface ConfirmStepProps {
    confirmIndices: number[];
    error: string | null;
    onBack: () => void;
    onConfirm: (answers: string[]) => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({ confirmIndices, error, onBack, onConfirm }) => {
    const [answers, setAnswers] = useState<string[]>(() => confirmIndices.map(() => ''));

    const complete = answers.every((answer) => answer.trim().length > 0);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (complete) onConfirm(answers.map((answer) => answer.trim().toLowerCase()));
    };

    return (
        <form onSubmit={submit} noValidate>
            <div className="grid grid-cols-3 gap-4">
                {confirmIndices.map((index, i) => (
                    <div key={index}>
                        <label htmlFor={`confirm-${index}`} className="text-sm font-medium text-fg-muted">
                            Word {index + 1}
                        </label>
                        <input
                            id={`confirm-${index}`}
                            autoFocus={i === 0}
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={answers[i]}
                            onChange={(e) =>
                                setAnswers((current) => current.map((value, j) => (j === i ? e.target.value : value)))
                            }
                            className={`mt-2 font-mono ${onboardingField()}`}
                        />
                    </div>
                ))}
            </div>
            <FieldError message={error} />

            <div className={onboardingActions}>
                <Button type="submit" variant="solid" size="md" disabled={!complete} className={onboardingButton}>
                    Create account
                </Button>
                <button type="button" onClick={onBack} className={onboardingLink}>
                    Show words again
                </button>
            </div>
        </form>
    );
};

export default ConfirmStep;
