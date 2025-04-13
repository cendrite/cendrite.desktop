import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {UserProvider} from "./Context/UserContext.tsx";
import {AuthProvider} from "./Context/AuthContext.tsx";
import {OnboardingProvider} from "./Context/OnboardingContext.tsx";
import {SignalRProvider} from "./SignalR/SignalRContext.tsx";
import { ContactProvider } from "./Context/ContactContext.tsx";
import { HomePageProvider } from "./Context/HomePageContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnboardingProvider>
            <UserProvider>
                <AuthProvider>
                    <SignalRProvider>
                        <ContactProvider>
                            <HomePageProvider>
                                <App/>
                            </HomePageProvider>
                        </ContactProvider>
                    </SignalRProvider>
                </AuthProvider>
            </UserProvider>
        </OnboardingProvider>
    </StrictMode>
);
