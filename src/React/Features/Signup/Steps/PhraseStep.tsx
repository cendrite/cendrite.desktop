import React, { useState } from 'react';
import { ShieldWarningIcon } from '@phosphor-icons/react';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface PhraseStepProps {
    words: string[];
    onBack: () => void;
    onContinue: () => void;
}

const PhraseStep: React.FC<PhraseStepProps> = ({ words, onBack, onContinue }) => {
    const [savedIt, setSavedIt] = useState(false);

    return (
        <div>
            <ol className="grid select-none grid-cols-3 gap-2" aria-label="Recovery phrase">
                {words.map((word, i) => (
                    <li key={i} className="flex items-baseline gap-2 rounded-md border border-line bg-field px-2.5 py-2">
                        <span className="w-4 text-right text-xs tabular-nums text-fg-faint">{i + 1}</span>
                        <span className="font-mono text-sm text-fg">{word}</span>
                    </li>
                ))}
            </ol>

            <div className="mt-5 flex gap-2.5 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-fg-muted">
                <ShieldWarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p>
                    Write these down on paper. Don't screenshot or copy them. Anyone with these words can take over your
                    account, and we can't recover them for you.
                </p>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
                <input
                    type="checkbox"
                    checked={savedIt}
                    onChange={(e) => setSavedIt(e.target.checked)}
                    className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                />
                I've written down all 12 words
            </label>

            <div className="mt-6 flex gap-3">
                <Button type="button" variant="ghost" size="md" onClick={onBack} className="h-10 flex-1">
                    Back
                </Button>
                <Button type="button" variant="primary" size="md" disabled={!savedIt} onClick={onContinue} className="h-10 flex-[2]">
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default PhraseStep;
