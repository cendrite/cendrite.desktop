import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./Features/Login/LoginPage";
import RegisterPage from "./Features/Register/RegisterPage";
import VerifyUserPage from "./Features/VerifyUser/VerifyUserPage";
import VerifyDevicePage from "./Features/VerifyDevice/VerifyDevicePage";
import HomePage from "./Features/Home/HomePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verifyUser" element={<VerifyUserPage />} />
        <Route path="/verifyDevice" element={<VerifyDevicePage />} />
        <Route path="/homePage" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
