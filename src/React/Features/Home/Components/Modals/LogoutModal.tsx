import Modal from "react-modal";
import React from "react";
import {useNavigate} from "react-router-dom";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: (shouldReopenParent: boolean) => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({isOpen, onClose }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        navigate("/logout");
    }
    return(
        <Modal
            isOpen = {isOpen}
            onRequestClose = {()=> onClose(false)}
            className= "px-2 py-0.5 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[200px] max-auto relative"
            overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
            contentLabel="User Details">
            <div className="relative h-full flex flex-col">

                {/* Confirmation Text */}
                <div className="text-center mt-10">
                    <h2 className="text-lg font-semibold">Confirm logout</h2>
                    <p className="text-sm text-gray-400 mt-2">
                        Logging out will disconnect your account from this device.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-center mt-8 space-x-4">
                    <button
                        onClick={()=> onClose(true)}
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={()=> handleLogout()}
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300"
                    >
                        Logout
                    </button>

                </div>
            </div>
        </Modal>
    )
}

export default LogoutModal;