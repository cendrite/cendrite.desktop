import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {UserProvider} from "./Context/UserContext.tsx";
import {AuthProvider} from "./Context/AuthContext.tsx";
import {OnboardingProvider} from "./Context/OnboardingContext.tsx";
import {ContactProvider} from "./Context/ContactContext.tsx";
import {HomePageProvider} from "./Context/HomePageContext.tsx";
import {StrictMode} from "react";
import {SignalRProvider} from "./SignalR/SignalRProvider.tsx";
import {PendingContactProvider} from "./Context/PendingContactsContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnboardingProvider>
            <UserProvider>
                <AuthProvider>
                    <SignalRProvider>
                        <ContactProvider>
                            <PendingContactProvider>
                                <HomePageProvider>
                                    <App/>
                                </HomePageProvider>
                            </PendingContactProvider>
                        </ContactProvider>
                    </SignalRProvider>
                </AuthProvider>
            </UserProvider>
        </OnboardingProvider>
    </StrictMode>
);
