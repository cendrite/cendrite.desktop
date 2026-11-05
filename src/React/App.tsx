import React from "react";
import {HashRouter as Router, Route, Routes} from "react-router-dom";
import SignupPage from "./Features/Signup/SignupPage";
import RecoverPage from "./Features/Recover/RecoverPage";
import HomePage from "./Features/Home/HomePage";
import StartupPage from "./Features/Startup/StarupPage.tsx";
import LogoutPage from "./Features/Logout/LogoutPage.tsx";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartupPage/>} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/recover" element={<RecoverPage />} />
        <Route path="/logout" element={<LogoutPage />} />
      </Routes>
    </Router>
  );
};

export default App;
