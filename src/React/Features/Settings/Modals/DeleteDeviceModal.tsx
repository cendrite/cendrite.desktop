import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import { DeviceDto } from '@/Shared/Devices/GetDevices';

interface DeleteDeviceModalProps {
    device: DeviceDto | null;
    onClose: () => void;
    onDelete: (deviceId: string) => Promise<boolean>;
}

const DeleteDeviceModal: React.FC<DeleteDeviceModalProps> = ({ device, onClose, onDelete }) => {
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);

    const close = () => {
        if (pending) return;
        setFailed(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!device) return;

        setPending(true);
        setFailed(false);

        const deleted = await onDelete(device.id);

        setPending(false);

        if (!deleted) {
            setFailed(true);
            return;
        }

        onClose();
    };

    return (
        <Dialog open={device !== null} onClose={close} className="relative z-[1010]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[380px] rounded-xl bg-surface px-6 py-8 text-fg shadow-lg">
                    <div className="text-center">
                        <DialogTitle className="text-lg font-semibold">Remove device</DialogTitle>
                        <p className="mt-2 text-sm text-fg-subtle">
                            <span className="font-medium text-fg">{device?.name}</span> will be signed out and all
                            data on it will be wiped. This cannot be undone.
                        </p>

                        {failed && <p className="mt-3 text-sm text-danger-fg">Could not remove the device. Try again.</p>}
                    </div>

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={pending}>
                            {pending ? 'Removing…' : 'Remove'}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default DeleteDeviceModal;
