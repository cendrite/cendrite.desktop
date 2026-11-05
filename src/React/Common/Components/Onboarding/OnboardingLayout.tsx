import React from 'react';
import clsx from 'clsx';
import FinchMark from '@/React/Common/Components/Loading/FinchMark.tsx';

interface OnboardingLayoutProps {
    step?: number;
    totalSteps?: number;
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ step, totalSteps, title, description, children, footer }) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12 text-fg antialiased">
        <FinchMark className="mb-8 h-9 w-auto" />

        <div className="w-[600px] max-w-full rounded-2xl border border-line bg-surface px-12 py-11">
            {step !== undefined && totalSteps !== undefined && (
                <div className="mx-auto mb-9 flex w-40 items-center gap-2" aria-label={`Step ${step} of ${totalSteps}`}>
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <span
                            key={i}
                            className={clsx('h-1 flex-1 rounded-full transition-colors', i < step ? 'bg-fg' : 'bg-line-strong')}
                        />
                    ))}
                </div>
            )}

            <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
                {description && (
                    <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-balance text-fg-subtle">{description}</p>
                )}
            </div>

            <div className="mt-10">{children}</div>
        </div>

        {footer && <div className="mt-8 text-sm text-fg-subtle">{footer}</div>}
    </div>
);

export default OnboardingLayout;
