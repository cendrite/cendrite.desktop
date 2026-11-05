import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import LoadingScreen from "@/React/Common/Components/Loading/LoadingScreen.tsx";
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

    return <LoadingScreen label="Loading" />;
};

export default StartupPage;
