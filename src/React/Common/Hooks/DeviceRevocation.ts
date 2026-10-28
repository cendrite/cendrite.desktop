import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalEvent } from '@/React/Common/Utilities';
import { useUser } from '@/React/Context/User/UserContext';
import { ChangeEventType } from '@/Shared/Events/ChangeEventType';
import { ClientDeletedEvent } from '@/Shared/Events/EventData';

export function useDeviceRevocation() {
    const navigate = useNavigate();
    const { user } = useUser();

    useSignalEvent<ClientDeletedEvent>(ChangeEventType.Deleted, (evt) => {
        if (evt.data.connectionId !== user?.connectionId) return;
        navigate('/logout', { replace: true, state: { revoked: true } });
    });

    useEffect(() => {
        return window.electron.on('connectionState', (state) => {
            if (state !== 'revoked') return;
            navigate('/logout', { replace: true, state: { revoked: true } });
        });
    }, [navigate]);
}
