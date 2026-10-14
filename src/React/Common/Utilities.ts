import { useEffect, useRef } from 'react';
import { ChangeEventType } from '@/Shared/Events/ChangeEventType';
import { ChangeEvent } from '@/Shared/Events/ChangeEvent';

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

export function useMessageEdit<K extends EventMessage['kind']>(
    kind: K,
    handler: (event: Extract<EventMessage, { kind: K }>) => void,
) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        return window.electron.on('eventMessage', (evt) => {
            if (evt.kind !== kind) return;
            handlerRef.current(evt as Extract<EventMessage, { kind: K }>);
        });
    }, [kind]);
}
