import React, { useState } from 'react';
import { KeyIcon } from '@phosphor-icons/react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import RotatePhraseModal from '../Modals/RotatePhraseModal.tsx';

const PrivacySection: React.FC = () => {
    const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);

    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Recovery</h3>
            <p className="mt-1 text-sm text-fg-subtle">The phrase that lets you get back into your account without another device.</p>

            <div className="mt-4 flex items-center gap-4 rounded-lg border border-line px-4 py-4">
                <KeyIcon className="h-8 w-8 shrink-0 text-fg-muted" />

                <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">Recovery phrase</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">Get a new phrase. Your current one stops working.</p>
                </div>

                <Button className="ml-auto shrink-0" onClick={() => setIsRotateModalOpen(true)}>
                    Regenerate
                </Button>
            </div>

            <RotatePhraseModal isOpen={isRotateModalOpen} onClose={() => setIsRotateModalOpen(false)} />
        </section>
    );
};

export default PrivacySection;
