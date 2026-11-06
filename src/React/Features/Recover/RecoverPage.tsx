import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import Button from '@/React/Common/Components/Button/Button.tsx';
import LoadingScreen from '@/React/Common/Components/Loading/LoadingScreen.tsx';
import OnboardingLayout from '@/React/Common/Components/Onboarding/OnboardingLayout.tsx';
import { onboardingActions, onboardingButton, onboardingLink } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import { User } from '@/React/Models/User.ts';
import { RecoverAccountCommand } from '@/Shared/Authentication/Recover.ts';
import WordInput from './Components/WordInput.tsx';
import { findInvalidWords } from '@/React/Common/Components/Onboarding/OnboardingValidation.ts';

const WORD_COUNT = 12;

const RecoverPage: React.FC = () => {
    const navigate = useNavigate();
    const { userDispatch } = useUser();
    const known = useMemo(() => new Set(wordlist), []);

    const [words, setWords] = useState<string[]>(() => Array(WORD_COUNT).fill(''));
    const [invalid, setInvalid] = useState<ReadonlySet<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const normalized = words.map((word) => word.trim().toLowerCase());

    const setWordsFrom = (index: number, values: string[]) => {
        setWords((current) => current.map((word, i) => (i >= index && i < index + values.length ? values[i - index] : word)));
        setError(null);
        setInvalid((current) => new Set([...current].filter((i) => i < index || i >= index + values.length)));
    };

    const pick = (index: number, word: string, viaTab: boolean) => {
        setWordsFrom(index, [word]);
        if (!viaTab) inputs.current[index + 1]?.focus();
    };

    const onPaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
        const parts = event.clipboardData.getData('text').trim().split(/\s+/);
        if (parts.length < 2) return;
        event.preventDefault();
        setWordsFrom(index, parts.slice(0, WORD_COUNT - index));
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (working) return;

        const problems = findInvalidWords(words, known);
        setInvalid(new Set(problems));
        if (problems.length > 0) {
            setError('Some words are missing or not in the word list. Check the highlighted boxes.');
            return;
        }

        setWorking(true);
        setError(null);

        const result = await window.electron.sendRequestAsync(new RecoverAccountCommand(normalized));

        if (!result.success) {
            setWorking(false);
            setError(result.errorMessage.message);
            return;
        }

        setWords(Array(WORD_COUNT).fill(''));

        userDispatch({
            type: UserActionType.Initialize,
            payload: new User(
                result.data.id,
                result.data.username,
                result.data.tag,
                result.data.deviceId,
                result.data.connectionId,
                result.data.externalConnectionIds,
                result.data.avatarKey,
                result.data.displayName,
            ),
        });

        navigate('/home');
    };

    if (working) {
        return <LoadingScreen label="Recovering">This only takes a few seconds.</LoadingScreen>;
    }

    return (
        <OnboardingLayout
            title="Recover your account"
            description="Enter the 12 words of your recovery phrase. This computer is added as a new device and your other devices are told about it. Message history isn't restored."
            footer={
                <>
                    Signed in on another device?{' '}
                    <button type="button" className={onboardingLink} onClick={() => navigate('/link')}>
                        Link this one instead
                    </button>
                </>
            }
        >
            <form onSubmit={submit} noValidate>
                <ol className="grid grid-cols-3 gap-3" aria-label="Recovery phrase">
                    {words.map((word, i) => (
                        <li key={i}>
                            <WordInput
                                ref={(el) => {
                                    inputs.current[i] = el;
                                }}
                                index={i}
                                value={word}
                                autoFocus={i === 0}
                                invalid={invalid.has(i)}
                                onChange={(value) => setWordsFrom(i, [value])}
                                onPick={(picked, viaTab) => pick(i, picked, viaTab)}
                                onPaste={(e) => onPaste(i, e)}
                            />
                        </li>
                    ))}
                </ol>

                <p className="mt-3 text-center text-sm text-fg-faint">You can paste the whole phrase into the first box.</p>
                <FieldError message={error} />

                <div className={onboardingActions}>
                    <Button type="submit" variant="solid" size="md" className={onboardingButton}>
                        Recover account
                    </Button>
                    <button type="button" onClick={() => navigate('/signup')} className={onboardingLink}>
                        Back
                    </button>
                </div>
            </form>
        </OnboardingLayout>
    );
};

export default RecoverPage;
