import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Result } from "../../../Shared/Result/Result";
import { GetDeviceDto } from "../../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceDto";
import { GetDeviceQuery } from "../../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceQuery";

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeApp().then(isLoggedIn => {
      setIsLoggedIn(isLoggedIn);
      setLoading(false);

      navigate(isLoggedIn ? "/home" : "/login");
    });
  });

  return <AuthContext.Provider value={{ isLoggedIn, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

async function initializeApp(): Promise<boolean> {
  try {
    const deviceResult = await window.electron.sendRequestAsync<Result<GetDeviceDto>>(new GetDeviceQuery());

    if (deviceResult.success == false) {
      return false;
    }

    const userResult = await window.electron.SendRequestAsync<Result<GetUserDto>>(new GetUserQuery());

    if (userResult.success == false) {
      return false;
    }
  } catch (error: unknown) {
    console.error("Error getting device", error);
  }
  return false;
}
