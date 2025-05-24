import React from "react";

interface ButtonProps {
  type: "button" | "submit" | "reset";
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ type, text, onClick, disabled }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-72 h-11 bg-gray-300 text-gray-950 font-medium rounded-md hover:bg-gray-50 transition duration-200 ease-in-out transform hover:scale-105 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
