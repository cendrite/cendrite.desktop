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
import {PendingContactProvider} from "./Context/PendingContactContext.tsx";
import { ChatProvider } from "./Context/Chat/ChatProvider.tsx";
import { NotificationProvider } from "./Context/Notification/NotitficationProvider.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnboardingProvider>
            <UserProvider>
                <AuthProvider>
                    <SignalRProvider>
                        <NotificationProvider>
                            <ContactProvider>
                                <PendingContactProvider>
                                    <HomePageProvider>
                                        <ChatProvider>
                                            <App/>
                                        </ChatProvider>
                                    </HomePageProvider>
                                </PendingContactProvider>
                            </ContactProvider>
                        </NotificationProvider>
                    </SignalRProvider>
                </AuthProvider>
            </UserProvider>
        </OnboardingProvider>
    </StrictMode>
);
