// Contact.tsx
import React from "react";

interface ContactProps {
  name: string;
}

const Contact: React.FC<ContactProps> = ({ name }) => {
  return (
    <div className="flex items-center py-3 px-3 hover:bg-zinc-700 rounded-md">
      {/* Circular Avatar */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-beige-500 text-black mr-3">
        {name.charAt(0).toUpperCase()}
      </div>
      <span>{name}</span>
    </div>
  );
};

export default Contact;
