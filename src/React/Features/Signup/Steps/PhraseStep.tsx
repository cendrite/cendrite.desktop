import React, { useState } from 'react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import { onboardingActions, onboardingButton, onboardingLink } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';

interface PhraseStepProps {
    words: string[];
    onBack: () => void;
    onContinue: () => void;
}

const PhraseStep: React.FC<PhraseStepProps> = ({ words, onBack, onContinue }) => {
    const [savedIt, setSavedIt] = useState(false);

    return (
        <div>
            <ol className="grid select-none grid-cols-3 gap-3" aria-label="Recovery phrase">
                {words.map((word, i) => (
                    <li
                        key={i}
                        className="relative flex h-11 items-center rounded-md border border-line-strong bg-canvas pl-10 pr-3.5"
                    >
                        <span className="absolute left-3 w-5 text-right text-sm tabular-nums text-fg-faint">{i + 1}</span>
                        <span className="font-mono text-[15px] text-fg">{word}</span>
                    </li>
                ))}
            </ol>

            <p className="mt-7 border-l-2 border-warning pl-4 text-sm leading-relaxed text-fg-subtle">
                Keep these words somewhere safe. We strongly advise against saving them in a file or a screenshot.
                Anyone who has them can take over your account, and if you lose them without another device to link,
                it's gone for good.
            </p>

            <label className="mt-7 flex cursor-pointer items-center justify-center gap-3 text-sm text-fg-muted">
                <input
                    type="checkbox"
                    checked={savedIt}
                    onChange={(e) => setSavedIt(e.target.checked)}
                    className="h-4 w-4 accent-[rgb(var(--color-fg))]"
                />
                I've written down all 12 words
            </label>

            <div className={onboardingActions}>
                <Button type="button" variant="solid" size="md" disabled={!savedIt} onClick={onContinue} className={onboardingButton}>
                    Continue
                </Button>
                <button type="button" onClick={onBack} className={onboardingLink}>
                    Back
                </button>
            </div>
        </div>
    );
};

export default PhraseStep;
