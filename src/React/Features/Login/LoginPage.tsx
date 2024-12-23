import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputBox from "../../Common/Components/InputBox";
import FormButton from "../../Common/Components/FormButton";

const LoginPage: React.FC = () => {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const Login = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(email, password);
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
      <div className="flex flex-col items-center w-full max-w-xs">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={Login} className="flex flex-col items-center w-full space-y-4">
          {/* Form input fields */}
          <InputBox type="text" placeholder="Username" value={email} onChange={e => setUsername(e.target.value)} />
          <InputBox
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </form>

        {/* Form submit button */}
        <div className="mt-8">
          <FormButton type="submit" text="Login" disabled={email === "" || password === ""} />
        </div>

        {/* Navigation link */}
        <div className="mt-4">
          <p>
            Don't have an account?{" "}
            <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate("/register")}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
