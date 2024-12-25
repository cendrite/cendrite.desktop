import React from "react";

interface InputBoxProps {
  name?: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRounded?: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ name, type, placeholder, value, onChange, isRounded = false }) => {
  return (
    <div className="w-full mb-4">
      <input
        name={name ?? "default"}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-80 h-10 bg-zinc-800 text-white border border-gray-600 ${
          isRounded ? "rounded-full" : "rounded-md"
        } p-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-gray-700`}
      />
    </div>
  );
};

export default InputBox;
