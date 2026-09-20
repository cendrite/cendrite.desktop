import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { OnboardingProvider } from './Context/OnboardingContext.tsx';
import { StrictMode } from 'react';
import { ChatProvider } from './Context/Chat/ChatProvider.tsx';
import { NotificationProvider } from './Context/Notification/NotitficationProvider.tsx';
import { HomePageProvider } from './Context/HomePage/HomePageProvider.tsx';
import { ContactProvider } from './Context/Contacts/ContactProvider.tsx';
import { UserProvider } from './Context/User/UserProvider.tsx';
import { PendingContactProvider } from './Context/PendingContact/PendingContactProvider.tsx';
import { AuthSessionProvider } from './Context/AuthSession/AuthSessionProvider.tsx';
import { ThemeProvider } from './Context/Theme/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <OnboardingProvider>
                <UserProvider>
                    <AuthSessionProvider>
                        <NotificationProvider>
                            <ContactProvider>
                                <PendingContactProvider>
                                    <HomePageProvider>
                                        <ChatProvider>
                                            <App />
                                        </ChatProvider>
                                    </HomePageProvider>
                                </PendingContactProvider>
                            </ContactProvider>
                        </NotificationProvider>
                    </AuthSessionProvider>
                </UserProvider>
            </OnboardingProvider>
        </ThemeProvider>
    </StrictMode>,
);
