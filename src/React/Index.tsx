import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {UserProvider} from "./Common/Context/UserContext.tsx";
import {AuthProvider} from "./Common/Context/AuthContext.tsx";
import {OnboardingProvider} from "./Common/Context/OnboardingContext.tsx";
import {SignalRProvider} from "./SignalR/SignalRContext.tsx";
import {ContactProvider} from "./Features/Home/Components/Panes/Contact/ContactContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnboardingProvider>
            <UserProvider>
                <AuthProvider>
                    <SignalRProvider>
                        <ContactProvider>
                            <App/>
                        </ContactProvider>
                    </SignalRProvider>
                </AuthProvider>
            </UserProvider>
        </OnboardingProvider>
    </StrictMode>
);
