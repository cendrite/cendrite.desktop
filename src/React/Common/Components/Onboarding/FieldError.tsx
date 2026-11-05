import React from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';

const FieldError: React.FC<{ message: string | null }> = ({ message }) =>
    message ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger-fg">
            <WarningCircleIcon className="h-4 w-4 shrink-0" />
            {message}
        </p>
    ) : null;

export default FieldError;
