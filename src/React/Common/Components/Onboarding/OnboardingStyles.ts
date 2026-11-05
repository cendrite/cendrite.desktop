import clsx from 'clsx';

export const onboardingLink = 'text-sm text-fg-subtle underline underline-offset-4 hover:text-fg';

export const onboardingButton = 'h-11 w-full text-sm';

export const onboardingActions = 'mt-9 flex flex-col items-center gap-5';

export function onboardingField(invalid = false): string {
    return clsx(
        'h-11 w-full rounded-md border bg-canvas px-3.5 text-[15px] text-fg placeholder:text-fg-faint transition-colors focus:outline-none',
        invalid ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-fg-subtle',
    );
}
