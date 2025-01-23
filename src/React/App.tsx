import React from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import LoginPage from "./Features/Login/LoginPage";
import RegisterPage from "./Features/Register/RegisterPage";
import VerifyUserPage from "./Features/VerifyUser/VerifyUserPage";
import HomePage from "./Features/Home/HomePage";
import VerifyLoginPage from "./Features/VerifyLogin/VerifyLoginPage";
import StartupPage from "./Features/Startup/StarupPage.tsx";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartupPage/>} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verifyUser" element={<VerifyUserPage />} />
        <Route path="/verifyLogin" element={<VerifyLoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
