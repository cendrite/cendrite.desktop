import React from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/logout');
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[1010]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[350px] rounded-xl bg-surface px-6 py-8 text-fg shadow-lg">
                    <div className="text-center">
                        <DialogTitle className="text-lg font-semibold">Confirm logout</DialogTitle>
                        <p className="mt-2 text-sm text-fg-subtle">
                            Logging out will disconnect your account from this device.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="danger" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default LogoutModal;
