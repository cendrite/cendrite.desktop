import React, {useEffect} from "react";
import Lottie from "lottie-react";
import {useNavigate} from "react-router-dom";
import boxAnimation from "../../Assets/Animations/box_load_animation.json";
import { useAuthSession } from "../../Context/AuthSession/AuthSessionContext.tsx";

const StartupPage: React.FC = () => {
    const {sessionId, loading} = useAuthSession();
    const navigate = useNavigate();

    useEffect(() => {
        if(!loading) {
            // Delay the navigation to the home page or login page by 3 seconds
            const timer = setTimeout(() => {
                navigate(sessionId ? "/home" : "/login");
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [sessionId, loading, navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-zinc-950">
            <div>
                <Lottie animationData={boxAnimation}/>
            </div>
        </div>
    );
};

export default StartupPage;
