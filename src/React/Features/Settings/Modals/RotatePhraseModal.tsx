import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import FieldError from '@/React/Common/Components/Onboarding/FieldError.tsx';
import PhraseStep from '@/React/Features/Signup/Steps/PhraseStep.tsx';
import ConfirmStep from '@/React/Features/Signup/Steps/ConfirmStep.tsx';
import { BeginRotatePhraseCommand } from '@/Shared/Authentication/BeginRotatePhrase.ts';
import { CompleteRotatePhraseCommand } from '@/Shared/Authentication/CompleteRotatePhrase.ts';
import { CancelRotatePhraseCommand } from '@/Shared/Authentication/CancelRotatePhrase.ts';

type Step = 'warning' | 'phrase' | 'confirm' | 'done';

const TITLES: Record<Step, string> = {
    warning: 'Regenerate recovery phrase',
    phrase: 'Your new recovery phrase',
    confirm: 'Confirm your new phrase',
    done: 'Recovery phrase changed',
};

interface RotatePhraseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RotatePhraseModal: React.FC<RotatePhraseModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('warning');
    const [words, setWords] = useState<string[]>([]);
    const [confirmIndices, setConfirmIndices] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);

    useEffect(() => {
        if (!isOpen) return;

        setStep('warning');
        setWords([]);
        setConfirmIndices([]);
        setError(null);
    }, [isOpen]);

    const close = () => {
        if (pending.current) {
            pending.current = false;
            void window.electron.sendRequestAsync(new CancelRotatePhraseCommand());
        }
        setWords([]);
        onClose();
    };

    const begin = async () => {
        setError(null);
        setBusy(true);
        const result = await window.electron.sendRequestAsync(new BeginRotatePhraseCommand());
        setBusy(false);

        if (!result.success) {
            setError('Something went wrong. Please try again.');
            return;
        }

        pending.current = true;
        setWords(result.data.words);
        setConfirmIndices(result.data.confirmIndices);
        setStep('phrase');
    };

    const confirm = async (answers: string[]) => {
        if (busy) return;

        setError(null);
        setBusy(true);
        const result = await window.electron.sendRequestAsync(new CompleteRotatePhraseCommand(answers));
        setBusy(false);

        if (!result.success) {
            if (result.errorMessage.code === 'Expired') {
                pending.current = false;
                setStep('warning');
            }
            setError(result.errorMessage.message);
            return;
        }

        pending.current = false;
        setWords([]);
        setStep('done');
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1010]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[560px] rounded-xl bg-surface px-8 py-8 text-fg shadow-lg">
                    <DialogTitle className="text-lg font-semibold">{TITLES[step]}</DialogTitle>

                    {step === 'warning' && (
                        <>
                            <p className="mt-2 text-sm leading-relaxed text-fg-subtle">
                                You'll get 12 new words. Your current recovery phrase stops working as soon as you confirm
                                the new one, and your other devices are told about the change.
                            </p>
                            <FieldError message={error} />
                            <div className="mt-8 flex justify-end gap-3">
                                <Button onClick={close}>Cancel</Button>
                                <Button variant="solid" disabled={busy} onClick={begin}>
                                    Continue
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'phrase' && (
                        <div className="mt-6">
                            <PhraseStep words={words} onBack={close} onContinue={() => setStep('confirm')} />
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="mt-6">
                            <ConfirmStep
                                confirmIndices={confirmIndices}
                                error={error}
                                submitLabel="Change recovery phrase"
                                onBack={() => {
                                    setError(null);
                                    setStep('phrase');
                                }}
                                onConfirm={confirm}
                            />
                        </div>
                    )}

                    {step === 'done' && (
                        <>
                            <p className="mt-2 text-sm leading-relaxed text-fg-subtle">
                                Your old recovery phrase no longer works. Use the new one if you ever need to recover your account.
                            </p>
                            <div className="mt-8 flex justify-end">
                                <Button variant="solid" onClick={close}>
                                    Done
                                </Button>
                            </div>
                        </>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default RotatePhraseModal;
