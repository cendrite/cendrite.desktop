import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import boxAnimation from '@/React/Assets/Animations/box_load_animation.json';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { useAuthSession } from '@/React/Context/AuthSession/AuthSessionContext.tsx';
import { useContacts } from '@/React/Context/Contacts/ContactContext.tsx';
import { useChatContext } from '@/React/Context/Chat/ChatContext.tsx';
import { usePendingContacts } from '@/React/Context/PendingContact/PendingContactContext.tsx';
import { useNotifications } from '@/React/Context/Notification/NotificationContext.tsx';
import { AuthSessionActionType } from '@/React/Context/AuthSession/AuthSessionReducer.ts';
import { ContactActionType } from '@/React/Context/Contacts/ContactReducer.ts';
import { PendingContactActionType } from '@/React/Context/PendingContact/PendingContactReducer.ts';
import { ChatActionType } from '@/React/Context/Chat/ChatReducer.ts';
import { NotificationActionType } from '@/React/Context/Notification/NotificationReducer.ts';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import { useHomePage } from '@/React/Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '@/React/Context/HomePage/HomePageReducer.ts';
import { LogoutCommand } from '@/Shared/Authentication/Logout.ts';

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
        <div className="flex items-center justify-center h-screen bg-canvas">
            <div>
                <Lottie animationData={boxAnimation} />
                <h1 className="text-fg text-center">Please wait while we log you out</h1>
            </div>
        </div>
    );
};

export default LogoutPage;
