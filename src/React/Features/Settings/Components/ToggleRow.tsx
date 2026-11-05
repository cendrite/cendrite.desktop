import React from 'react';
import { Description, Field, Label, Switch } from '@headlessui/react';

interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, disabled = false, onChange }) => (
    <Field disabled={disabled} className="flex items-center justify-between gap-6 data-[disabled]:opacity-50">
        <div>
            <Label className="text-sm font-medium text-fg-muted">{label}</Label>
            <Description className="mt-1 text-sm text-fg-subtle">{description}</Description>
        </div>

        <Switch
            checked={checked}
            onChange={onChange}
            className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-line transition-colors data-[checked]:bg-accent data-[disabled]:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
            <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-fg-on-accent transition-transform group-data-[checked]:translate-x-6" />
        </Switch>
    </Field>
);

export default ToggleRow;
