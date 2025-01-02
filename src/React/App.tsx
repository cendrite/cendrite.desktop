import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./Features/Login/LoginPage";
import RegisterPage from "./Features/Register/RegisterPage";
import VerifyUserPage from "./Features/VerifyUser/VerifyUserPage";
import VerifyDevicePage from "./Features/VerifyDevice/VerifyDevicePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verifyUser" element={<VerifyUserPage />} />
        <Route path="/veriyDevice" element={<VerifyDevicePage />} />
      </Routes>
    </Router>
  );
};

export default App;
