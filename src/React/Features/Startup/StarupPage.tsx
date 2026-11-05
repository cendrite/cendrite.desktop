import React, {useEffect} from "react";
import Lottie from "lottie-react";
import {useNavigate} from "react-router-dom";
import boxAnimation from "@/React/Assets/Animations/box_load_animation.json";
import { useAuthSession } from "@/React/Context/AuthSession/AuthSessionContext.tsx";

const StartupPage: React.FC = () => {
    const {sessionId, loading} = useAuthSession();
    const navigate = useNavigate();

    useEffect(() => {
        if(!loading) {
            const timer = setTimeout(() => {
                navigate(sessionId ? "/home" : "/signup");
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [sessionId, loading, navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-canvas">
            <div>
                <Lottie animationData={boxAnimation}/>
            </div>
        </div>
    );
};

export default StartupPage;
