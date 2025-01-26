import React, {useEffect} from "react";
import {LogoutService} from "../../Common/LogoutService/LogoutService.ts";
import {useUser} from "../../Common/Context/UserContext.tsx";
import {useNavigate} from "react-router-dom";
import Lottie from "lottie-react";
import boxAnimation from "../../Assets/Animations/box_load_animation.json";


const logoutService = new LogoutService();

const LogoutPage: React.FC = () => {
    const navigate = useNavigate();
    const {user} = useUser();

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                console.log("Logging out user", user.id);
                console.log("Device id", user.deviceId);
                logoutService.logout(user.id, user.deviceId).then(() => {
                    navigate("/login");
                });
            }, 3000);

            // Cleanup the timeout to avoid issues
            return () => clearTimeout(timer);
        }
    }, [user]);

    return (
        <div className="flex items-center justify-center h-screen bg-zinc-950">
            <div>
                <Lottie animationData={boxAnimation}/>
                <h1 className="text-white text-center">Please wait while we log you out</h1>
            </div>
        </div>
    );
}

export default LogoutPage;