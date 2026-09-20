import React from 'react';

interface ButtonProps {
    type: 'button' | 'submit' | 'reset';
    text: string;
    onClick?: () => void;
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ type, text, onClick, disabled }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`w-72 h-11 bg-inverted text-fg-inverted font-medium rounded-md hover:bg-inverted-hover transition duration-200 ease-in-out transform hover:scale-105 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default Button;
