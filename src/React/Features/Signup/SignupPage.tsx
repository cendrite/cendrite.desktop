import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import { User } from '@/React/Models/User.ts';
import { BeginSignupCommand, CancelSignupCommand, CompleteSignupCommand } from '@/Shared/Authentication/Signup.ts';
import LoadingScreen from '@/React/Common/Components/Loading/LoadingScreen.tsx';
import SignupLayout from './Components/SignupLayout.tsx';
import UsernameStep from './Steps/UsernameStep.tsx';
import PhraseStep from './Steps/PhraseStep.tsx';
import ConfirmStep from './Steps/ConfirmStep.tsx';

type Step = 'username' | 'phrase' | 'confirm' | 'working';

const TOTAL_STEPS = 3;

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { userDispatch } = useUser();

    const [step, setStep] = useState<Step>('username');
    const [username, setUsername] = useState('');
    const [words, setWords] = useState<string[]>([]);
    const [confirmIndices, setConfirmIndices] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const completed = useRef(false);

    useEffect(
        () => () => {
            if (!completed.current) void window.electron.sendRequestAsync(new CancelSignupCommand());
        },
        [],
    );

    const chooseUsername = async (value: string) => {
        setUsername(value);
        setError(null);

        if (words.length > 0) {
            setStep('phrase');
            return;
        }

        setBusy(true);
        const result = await window.electron.sendRequestAsync(new BeginSignupCommand());
        setBusy(false);

        if (!result.success) {
            setError('Something went wrong. Please try again.');
            return;
        }

        setWords(result.data.words);
        setConfirmIndices(result.data.confirmIndices);
        setStep('phrase');
    };

    const confirm = async (answers: string[]) => {
        setError(null);
        setStep('working');

        const result = await window.electron.sendRequestAsync(new CompleteSignupCommand(username, answers));

        if (!result.success) {
            if (result.errorMessage.code === 'Expired') {
                setWords([]);
                setConfirmIndices([]);
                setStep('username');
            } else {
                setStep('confirm');
            }
            setError(result.errorMessage.message);
            return;
        }

        completed.current = true;
        setWords([]);

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

    switch (step) {
        case 'username':
            return (
                <SignupLayout
                    step={1}
                    totalSteps={TOTAL_STEPS}
                    title="Create your account"
                    description="No email and no password. Your account is protected by a recovery phrase that only you have."
                >
                    <UsernameStep initialUsername={username} error={error} busy={busy} onContinue={chooseUsername} />
                </SignupLayout>
            );
        case 'phrase':
            return (
                <SignupLayout
                    step={2}
                    totalSteps={TOTAL_STEPS}
                    title="Save your recovery phrase"
                    description="These 12 words are the only way back into your account if you lose every device you're signed in on."
                >
                    <PhraseStep words={words} onBack={() => setStep('username')} onContinue={() => setStep('confirm')} />
                </SignupLayout>
            );
        case 'confirm':
            return (
                <SignupLayout
                    step={3}
                    totalSteps={TOTAL_STEPS}
                    title="Confirm your phrase"
                    description="Enter these words from your recovery phrase to make sure you saved it."
                >
                    <ConfirmStep
                        confirmIndices={confirmIndices}
                        error={error}
                        onBack={() => {
                            setError(null);
                            setStep('phrase');
                        }}
                        onConfirm={confirm}
                    />
                </SignupLayout>
            );
        case 'working':
            return <LoadingScreen label="Setting up">This only takes a few seconds.</LoadingScreen>;
    }
};

export default SignupPage;
