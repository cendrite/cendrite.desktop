import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const Register = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(email, password, confirmPassword);
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
      <div className="flex flex-col items-center w-full max-w-xs">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>

        <div className="mt-4">
          <p>
            Already have an account?{" "}
            <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
