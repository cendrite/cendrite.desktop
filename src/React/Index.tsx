import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StrictMode } from 'react';
import { ChatProvider } from './Context/Chat/ChatProvider.tsx';
import { NotificationProvider } from './Context/Notification/NotitficationProvider.tsx';
import { DeviceAlertProvider } from './Context/DeviceAlert/DeviceAlertProvider.tsx';
import { HomePageProvider } from './Context/HomePage/HomePageProvider.tsx';
import { ContactProvider } from './Context/Contacts/ContactProvider.tsx';
import { UserProvider } from './Context/User/UserProvider.tsx';
import { PendingContactProvider } from './Context/PendingContact/PendingContactProvider.tsx';
import { AuthSessionProvider } from './Context/AuthSession/AuthSessionProvider.tsx';
import { ThemeProvider } from './Context/Theme/ThemeProvider.tsx';
import { IconContext } from '@phosphor-icons/react';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <IconContext.Provider value={{ weight: 'light' }}>
                <UserProvider>
                    <AuthSessionProvider>
                        <DeviceAlertProvider>
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
                        </DeviceAlertProvider>
                    </AuthSessionProvider>
                </UserProvider>
            </IconContext.Provider>
        </ThemeProvider>
    </StrictMode>,
);
