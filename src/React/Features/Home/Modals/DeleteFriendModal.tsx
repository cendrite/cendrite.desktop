import Modal from "react-modal";
import React from "react";
import { Result } from "../../../../Shared/Result/Result.ts";
import { DeleteFriendCommand } from "../../../../Electron/Application/Features/Friends/Contracts/DeleteFriend.ts";
import {useHomePage} from "../../../Context/HomePage/HomePageContext.tsx";
import {HomePageActionType} from "../../../Context/HomePage/HomePageReducer.ts";
import { Contact } from "../../../Models/Contact.ts";
import { useContacts } from "../../../Context/Contacts/ContactContext.tsx";
import { ContactActionType } from "../../../Context/Contacts/ContactReducer.ts";

interface DeleteFriendModalProps {
    contact: Contact;
    isOpen: boolean;
    onClose: () => void;
}

const DeleteFriendModal: React.FC<DeleteFriendModalProps> = ({isOpen, onClose, contact}) => {
    const {contactDispatch} = useContacts();
    const {homeDispatch} = useHomePage();
    console.log(contact);

    const handleDelete = () => {
        window.electron.sendRequestAsync<Result>(new DeleteFriendCommand(contact.id)).then((result) => {
            if (result.success) {
                contactDispatch({type: ContactActionType.Remove, payload: {id: contact.id}});
                homeDispatch({type: HomePageActionType.Clear });
                console.log("Deleted friend successfully");
            } else {
                // Recreate the contact here
                console.error("Failed to delete friend", result.errorMessage);
            }
        });
    }
    return(
        <Modal
            isOpen = {isOpen}
            className= "px-2 py-0.5 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[200px] max-auto relative"
            overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
            <div className="relative h-full flex flex-col">

                {/* Confirmation Text */}
                <div className="text-center mt-10">
                    <h2 className="text-lg font-semibold">Delete friend</h2>
                    <p className="text-sm text-gray-400 mt-2">
                        Deleting this user will remove all chat history between you and this user.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-center mt-8 space-x-4">
                    <button
                        onClick={()=> onClose()}
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={()=> handleDelete()}
                        className="text-[0.8rem] font-semibold bg-red-600 rounded-full px-3.5 py-0.5 text-white hover:bg-red-800"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default DeleteFriendModal;
