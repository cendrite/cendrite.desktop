import React, { forwardRef, useMemo, useState } from 'react';
import clsx from 'clsx';
import { suggestWords } from './SuggestWords.ts';
import { onboardingField } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';

interface WordInputProps {
    index: number;
    value: string;
    invalid: boolean;
    autoFocus?: boolean;
    onChange: (value: string) => void;
    onPick: (word: string, viaTab: boolean) => void;
    onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}

const WordInput = forwardRef<HTMLInputElement, WordInputProps>(
    ({ index, value, invalid, autoFocus, onChange, onPick, onPaste }, ref) => {
        const [focused, setFocused] = useState(false);
        const [active, setActive] = useState(0);

        const prefix = value.trim().toLowerCase();
        const suggestions = useMemo(() => suggestWords(prefix), [prefix]);

        const open = focused && suggestions.length > 0;
        const listId = `recover-word-${index}-suggestions`;
        const activeIndex = Math.min(active, suggestions.length - 1);

        const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (!open) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setActive((activeIndex + 1) % suggestions.length);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setActive((activeIndex - 1 + suggestions.length) % suggestions.length);
                    break;
                case 'Enter':
                    event.preventDefault();
                    onPick(suggestions[activeIndex], false);
                    break;
                case 'Tab':
                    if (!event.shiftKey) onPick(suggestions[activeIndex], true);
                    break;
                case 'Escape':
                    event.preventDefault();
                    setFocused(false);
                    break;
            }
        };

        return (
            <div className="relative">
                <label htmlFor={`recover-word-${index}`} className="sr-only">
                    Word {index + 1}
                </label>
                <span className="pointer-events-none absolute left-3 top-1/2 w-5 -translate-y-1/2 text-right text-sm tabular-nums text-fg-faint">
                    {index + 1}
                </span>
                <input
                    ref={ref}
                    id={`recover-word-${index}`}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
                    aria-invalid={invalid}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setActive(0);
                        setFocused(true);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    className={`${onboardingField(invalid)} pl-10 font-mono`}
                />

                {open && (
                    <ul
                        id={listId}
                        role="listbox"
                        className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-md border border-line bg-overlay py-1 shadow-lg"
                    >
                        {suggestions.map((word, i) => (
                            <li
                                key={word}
                                id={`${listId}-${i}`}
                                role="option"
                                aria-selected={i === activeIndex}
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => onPick(word, false)}
                                className={clsx(
                                    'cursor-pointer px-3.5 py-2 font-mono text-[15px]',
                                    i === activeIndex ? 'bg-overlay-hover text-fg' : 'text-fg-muted',
                                )}
                            >
                                <span className="font-semibold text-fg">{word.slice(0, prefix.length)}</span>
                                {word.slice(prefix.length)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    },
);

WordInput.displayName = 'WordInput';

export default WordInput;
