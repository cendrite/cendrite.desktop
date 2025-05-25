import Modal from "react-modal";
import React from "react";
import { FriendService } from "../../../Common/Services/FriendService";
import {useUser} from "../../../Context/UserContext.tsx";
import {Contact, useContacts} from "../../../Context/ContactContext.tsx";
import {useHomePageContext} from "../../../Context/HomePage/HomePageContext.tsx";
import {HomePageContextActionType} from "../../../Context/HomePage/HomePageReducer.ts";

interface DeleteFriendModalProps {
    contact: Contact;
    isOpen: boolean;
    onClose: () => void;
}

const DeleteFriendModal: React.FC<DeleteFriendModalProps> = ({isOpen, onClose, contact}) => {
    const {user} = useUser();
    const {setContacts} = useContacts();
    const {homeDispatch} = useHomePageContext();
    const friendService = new FriendService();
    console.log(contact);

    const handleDelete = () => {
        friendService.DeleteFriend(user!.id,contact.id).then((result) => {
            if (result.success) {
                setContacts(prev => prev.filter(c => c.id !== contact.id));
                homeDispatch({type: HomePageContextActionType.ClearSelection, payload: null}); // Clear selection after deletion
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