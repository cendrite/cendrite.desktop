import React from 'react';
import { CircleNotchIcon } from '@phosphor-icons/react';

const WorkingStep: React.FC = () => (
    <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
        <CircleNotchIcon className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-4 text-sm text-fg-muted">This only takes a few seconds.</p>
    </div>
);

export default WorkingStep;
