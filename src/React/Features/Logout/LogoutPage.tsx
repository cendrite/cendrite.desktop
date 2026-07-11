import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import boxAnimation from '../../Assets/Animations/box_load_animation.json';
import { useUser } from '../../Context/User/UserContext.tsx';
import { useAuthSession } from '../../Context/AuthSession/AuthSessionContext.tsx';
import { useContacts } from '../../Context/Contacts/ContactContext.tsx';
import { useChatContext } from '../../Context/Chat/ChatContext.tsx';
import { usePendingContacts } from '../../Context/PendingContact/PendingContactContext.tsx';
import { useNotifications } from '../../Context/Notification/NotificationContext.tsx';
import { AuthSessionActionType } from '../../Context/AuthSession/AuthSessionReducer.ts';
import { ContactActionType } from '../../Context/Contacts/ContactReducer.ts';
import { PendingContactActionType } from '../../Context/PendingContact/PendingContactReducer.ts';
import { ChatActionType } from '../../Context/Chat/ChatReducer.ts';
import { NotificationActionType } from '../../Context/Notification/NotificationReducer.ts';
import { UserActionType } from '../../Context/User/UserReducer.ts';
import { useHomePage } from '../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../Context/HomePage/HomePageReducer.ts';
import { LogoutCommand } from '../../../Electron/Application/Features/Authentication/Contracts/Logout.ts';

const LogoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { authSessionDispatch } = useAuthSession();
    const { contactDispatch } = useContacts();
    const { pendingContactDispatch } = usePendingContacts();
    const { chatDispatch } = useChatContext();
    const { notificationDispatch } = useNotifications();
    const { userDispatch, user } = useUser();
    const { homeDispatch } = useHomePage();
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        window.electron.sendRequestAsync(new LogoutCommand())
            .catch((err) => {
                console.error('Logout error:', err);
            })
            .finally(() => {
                const id = window.setTimeout(() => {
                    authSessionDispatch({ type: AuthSessionActionType.Clear });
                    contactDispatch({ type: ContactActionType.Clear });
                    pendingContactDispatch({ type: PendingContactActionType.Clear });
                    chatDispatch({ type: ChatActionType.Clear });
                    notificationDispatch({ type: NotificationActionType.Clear });
                    userDispatch({ type: UserActionType.Clear });
                    homeDispatch({ type: HomePageActionType.Clear });

                    navigate('/login', { replace: true });
                }, 3000);

                timerRef.current = id;
            });

        return () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [
        user,
        navigate,
        homeDispatch,
        authSessionDispatch,
        contactDispatch,
        pendingContactDispatch,
        chatDispatch,
        notificationDispatch,
        userDispatch,
    ]);

    return (
        <div className="flex items-center justify-center h-screen bg-zinc-950">
            <div>
                <Lottie animationData={boxAnimation} />
                <h1 className="text-white text-center">Please wait while we log you out</h1>
            </div>
        </div>
    );
};

export default LogoutPage;
