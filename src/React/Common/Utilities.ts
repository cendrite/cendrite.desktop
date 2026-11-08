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

const USER_TAG_LENGTH = 12;

export function formatUserTag(tag: string): string {
    return tag.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function normalizeUserTag(input: string): string | null {
    const digits = input.replace(/\s/g, '');
    return /^\d+$/.test(digits) && digits.length === USER_TAG_LENGTH ? digits : null;
}
