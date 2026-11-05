import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import Button from '@/React/Common/Components/Button/Button.tsx';
import LoadingScreen from '@/React/Common/Components/Loading/LoadingScreen.tsx';
import OnboardingLayout from '@/React/Common/Components/Onboarding/OnboardingLayout.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import { User } from '@/React/Models/User.ts';
import { RecoverAccountCommand } from '@/Shared/Authentication/Recover.ts';
import WordInput from './Components/WordInput.tsx';

const WORD_COUNT = 12;

const RecoverPage: React.FC = () => {
    const navigate = useNavigate();
    const { userDispatch } = useUser();
    const known = useMemo(() => new Set(wordlist), []);

    const [words, setWords] = useState<string[]>(() => Array(WORD_COUNT).fill(''));
    const [touched, setTouched] = useState<boolean[]>(() => Array(WORD_COUNT).fill(false));
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const normalized = words.map((word) => word.trim().toLowerCase());
    const complete = normalized.every((word) => known.has(word));

    const setWordsFrom = (index: number, values: string[]) => {
        setWords((current) => current.map((word, i) => (i >= index && i < index + values.length ? values[i - index] : word)));
        setError(null);
    };

    const touch = (index: number) => setTouched((current) => current.map((t, j) => (j === index ? true : t)));

    const pick = (index: number, word: string, viaTab: boolean) => {
        setWordsFrom(index, [word]);
        touch(index);
        if (!viaTab) inputs.current[index + 1]?.focus();
    };

    const onPaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
        const parts = event.clipboardData.getData('text').trim().split(/\s+/);
        if (parts.length < 2) return;
        event.preventDefault();
        setWordsFrom(index, parts.slice(0, WORD_COUNT - index));
        setTouched(Array(WORD_COUNT).fill(true));
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!complete || working) return;

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
            description="Enter the 12 words of your recovery phrase. This computer is added as a new device, and your other devices are told about it. Message history isn't restored."
            footer={
                <>
                    Don't have an account?{' '}
                    <button type="button" className="text-link hover:underline" onClick={() => navigate('/signup')}>
                        Create one
                    </button>
                </>
            }
        >
            <form onSubmit={submit} noValidate>
                <ol className="grid grid-cols-3 gap-2" aria-label="Recovery phrase">
                    {words.map((word, i) => (
                        <li key={i}>
                            <WordInput
                                ref={(el) => {
                                    inputs.current[i] = el;
                                }}
                                index={i}
                                value={word}
                                autoFocus={i === 0}
                                invalid={touched[i] && normalized[i].length > 0 && !known.has(normalized[i])}
                                onChange={(value) => setWordsFrom(i, [value])}
                                onPick={(picked, viaTab) => pick(i, picked, viaTab)}
                                onBlur={() => touch(i)}
                                onPaste={(e) => onPaste(i, e)}
                            />
                        </li>
                    ))}
                </ol>

                <p className="mt-2 text-xs text-fg-faint">Tip: paste the whole phrase into the first box.</p>
                <FieldError message={error} />

                <div className="mt-6 flex gap-3">
                    <Button type="button" variant="ghost" size="md" onClick={() => navigate('/signup')} className="h-10 flex-1">
                        Back
                    </Button>
                    <Button type="submit" variant="primary" size="md" disabled={!complete} className="h-10 flex-[2]">
                        Recover account
                    </Button>
                </div>
            </form>
        </OnboardingLayout>
    );
};

export default RecoverPage;
