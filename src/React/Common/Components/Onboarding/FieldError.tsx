import React from 'react';

const FieldError: React.FC<{ message: string | null }> = ({ message }) =>
    message ? (
        <p role="alert" className="mt-3 text-sm text-danger-fg">
            {message}
        </p>
    ) : null;

export default FieldError;
