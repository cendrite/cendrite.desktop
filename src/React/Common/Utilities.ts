import { useEffect, useRef } from 'react';
import { ChangeEventType } from '../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEventType';
import { ChangeEvent } from '../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent';

export function useSignalEvent<T>(type: ChangeEventType, handler: (event: ChangeEvent<T>) => void) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        return window.electron.on('changeEvent', (evt) => {
            if (evt.type !== type) return;
            handlerRef.current(evt as ChangeEvent<T>);
        });
    }, [type]);
}
