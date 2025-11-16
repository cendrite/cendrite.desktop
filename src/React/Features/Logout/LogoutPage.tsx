import React, {useEffect} from "react";
import {useUser} from "../../Context/UserContext.tsx";
import {useNavigate} from "react-router-dom";
import Lottie from "lottie-react";
import boxAnimation from "../../Assets/Animations/box_load_animation.json";
import {LogoutService} from "../../Common/Services/LogoutService.ts";


const logoutService = new LogoutService();

const LogoutPage: React.FC = () => {
    const navigate = useNavigate();
    const {user} = useUser();

    useEffect(() => {
        if (user) {
            logoutService.logout().then(() => {
                const timer = setTimeout(() => {
                    navigate("/login");
                }, 3000); 

                return () => clearTimeout(timer);
            });
        }
    }, [user, navigate]);

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
