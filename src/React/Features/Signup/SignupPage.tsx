import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import { User } from '@/React/Models/User.ts';
import { BeginSignupCommand } from '@/Shared/Authentication/BeginSignup.ts';
import { CancelSignupCommand } from '@/Shared/Authentication/CancelSignup.ts';
import { CompleteSignupCommand } from '@/Shared/Authentication/CompleteSignup.ts';
import LoadingScreen from '@/React/Common/Components/Loading/LoadingScreen.tsx';
import OnboardingLayout from '@/React/Common/Components/Onboarding/OnboardingLayout.tsx';
import { onboardingLink } from '@/React/Common/Components/Onboarding/OnboardingStyles.ts';
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
                <OnboardingLayout
                    step={1}
                    totalSteps={TOTAL_STEPS}
                    title="Create your account"
                    footer={
                        <>
                            Already have an account?{' '}
                            <button type="button" className={onboardingLink} onClick={() => navigate('/link')}>
                                Link this device
                            </button>
                            {' or '}
                            <button type="button" className={onboardingLink} onClick={() => navigate('/recover')}>
                                recover it
                            </button>
                        </>
                    }
                >
                    <UsernameStep initialUsername={username} error={error} busy={busy} onContinue={chooseUsername} />
                </OnboardingLayout>
            );
        case 'phrase':
            return (
                <OnboardingLayout
                    step={2}
                    totalSteps={TOTAL_STEPS}
                    title="Save your recovery phrase"
                    description="These 12 words are the only way back into your account if you lose every device you're signed in on."
                >
                    <PhraseStep words={words} onBack={() => setStep('username')} onContinue={() => setStep('confirm')} />
                </OnboardingLayout>
            );
        case 'confirm':
            return (
                <OnboardingLayout
                    step={3}
                    totalSteps={TOTAL_STEPS}
                    title="Confirm your phrase"
                    description="Enter these words from your recovery phrase to make sure you saved it."
                >
                    <ConfirmStep
                        confirmIndices={confirmIndices}
                        error={error}
                        submitLabel="Create account"
                        onBack={() => {
                            setError(null);
                            setStep('phrase');
                        }}
                        onConfirm={confirm}
                    />
                </OnboardingLayout>
            );
        case 'working':
            return <LoadingScreen label="Setting up">This only takes a few seconds.</LoadingScreen>;
    }
};

export default SignupPage;
