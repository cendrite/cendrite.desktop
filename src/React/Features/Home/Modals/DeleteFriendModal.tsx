import React from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Result } from '../../../../Shared/Result/Result.ts';
import { DeleteFriendCommand } from '../../../../Electron/Application/Features/Friends/Contracts/DeleteFriend.ts';
import { useHomePage } from '../../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../../Context/HomePage/HomePageReducer.ts';
import { Contact } from '../../../Models/Contact.ts';
import { useContacts } from '../../../Context/Contacts/ContactContext.tsx';
import { ContactActionType } from '../../../Context/Contacts/ContactReducer.ts';

interface DeleteFriendModalProps {
    contact: Contact;
    isOpen: boolean;
    onClose: () => void;
}

const DeleteFriendModal: React.FC<DeleteFriendModalProps> = ({ isOpen, onClose, contact }) => {
    const { contactDispatch } = useContacts();
    const { homeDispatch } = useHomePage();

    const handleDelete = () => {
        window.electron.sendRequestAsync<Result>(new DeleteFriendCommand(contact.id)).then((result) => {
            if (result.success) {
                contactDispatch({ type: ContactActionType.Remove, payload: { id: contact.id } });
                homeDispatch({ type: HomePageActionType.Clear });
                onClose();
            } else {
                console.error('Failed to delete friend', result.errorMessage);
            }
        });
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[1010]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[350px] rounded-xl bg-surface px-6 py-8 text-fg shadow-lg">
                    <div className="text-center">
                        <DialogTitle className="text-lg font-semibold">Delete friend</DialogTitle>
                        <p className="mt-2 text-sm text-fg-subtle">
                            Deleting this user will remove all chat history between you and this user.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-center space-x-4">
                        <button
                            onClick={onClose}
                            className="text-[0.8rem] font-semibold bg-overlay rounded-full px-3.5 py-0.5 text-fg hover:bg-surface-hover"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-[0.8rem] font-semibold bg-danger rounded-full px-3.5 py-0.5 text-fg-on-accent hover:bg-danger-hover"
                        >
                            Delete
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default DeleteFriendModal;
