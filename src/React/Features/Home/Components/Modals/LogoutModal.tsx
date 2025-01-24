import Modal from "react-modal";
import React from "react";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: (shouldReopenParent: boolean) => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({isOpen, onClose }) => {

    return(
        <Modal
            isOpen = {isOpen}
            onRequestClose = {()=> onClose(false)}
            className= "p-4 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[200px] max-auto relative"
            overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
            contentLabel="User Details">
            <div className="relative h-full flex flex-col">
                {/* Close Button */}
                <button
                    onClick={()=> {
                        onClose(true);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-300"
                >
                    ✕
                </button>

            </div>
        </Modal>
    )
}

export default LogoutModal;