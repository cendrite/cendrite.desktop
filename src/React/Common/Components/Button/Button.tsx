import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50';

const sizes: Record<ButtonSize, string> = {
    sm: 'h-7 px-3 text-xs',
    md: 'h-8 px-3.5 text-sm',
};

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-fg-on-accent hover:bg-accent-hover',
    secondary: 'bg-overlay text-fg hover:bg-overlay-hover',
    danger: 'bg-danger text-fg-on-accent hover:bg-danger-hover',
    ghost: 'text-fg-muted hover:bg-surface-hover',
};

export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'sm', className, ...props }) => (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />
);

export default Button;
