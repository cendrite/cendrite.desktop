import React, { useState } from 'react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';

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
            <div className="grid grid-cols-3 gap-3">
                {confirmIndices.map((index, i) => (
                    <div key={index}>
                        <label htmlFor={`confirm-${index}`} className="text-xs font-medium text-fg-subtle">
                            Word #{index + 1}
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
                            className="mt-1 h-10 w-full rounded-md border border-line-strong bg-field px-2.5 font-mono text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                ))}
            </div>
            <FieldError message={error} />

            <div className="mt-6 flex gap-3">
                <Button type="button" variant="ghost" size="md" onClick={onBack} className="h-10 flex-1">
                    Show words
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={!complete} className="h-10 flex-[2]">
                    Create account
                </Button>
            </div>
        </form>
    );
};

export default ConfirmStep;
