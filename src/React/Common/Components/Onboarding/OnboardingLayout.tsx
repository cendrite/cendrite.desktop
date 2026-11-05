import React from 'react';
import clsx from 'clsx';

interface OnboardingLayoutProps {
    step?: number;
    totalSteps?: number;
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ step, totalSteps, title, description, children, footer }) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-fg">
        <div className="w-[440px] max-w-full rounded-xl border border-line bg-surface p-8 shadow-lg">
            {step !== undefined && totalSteps !== undefined && (
                <div className="mb-6 flex items-center gap-2" aria-label={`Step ${step} of ${totalSteps}`}>
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <span
                            key={i}
                            className={clsx('h-1.5 flex-1 rounded-full transition-colors', i < step ? 'bg-accent' : 'bg-line')}
                        />
                    ))}
                </div>
            )}

            <h1 className="text-xl font-semibold">{title}</h1>
            {description && <div className="mt-2 text-sm leading-relaxed text-fg-subtle">{description}</div>}

            <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-sm text-fg-subtle">{footer}</div>}
    </div>
);

export default OnboardingLayout;
