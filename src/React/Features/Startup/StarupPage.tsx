import React, {useEffect} from "react";
import {useAuth} from "../../Common/Context/AuthContext.tsx";
import {useNavigate} from "react-router-dom";

const StartupPage: React.FC = () => {
    const {isLoggedIn, loading} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if(!loading) {
            navigate(isLoggedIn ? "/home" : "/login");
        }
    }, [isLoggedIn, loading, navigate]);

   if(loading) {
       return (
           <div className="flex items-center justify-center h-screen">
               <h1>Loading...</h1>
           </div>
       )
   }

    return null;
};

export default StartupPage;