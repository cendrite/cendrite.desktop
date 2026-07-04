const electron = require('electron');

// Runtime whitelist — types are erased in .cts, so this can't come from AppEventMap.
// Keep in sync with the AppEventMap keys in Types.d.ts.
const ALLOWED_EVENTS = ['changeEvent', 'hubMessage', 'connectionState'];

electron.contextBridge.exposeInMainWorld('electron', {
    sendRequestAsync: async <TResponse,>(request: MediatorRequest): Promise<TResponse> => {
        return await electron.ipcRenderer.invoke('mediator:send', request);
    },

    on: (event: string, callback: (data: any) => void): (() => void) => {
        if (!ALLOWED_EVENTS.includes(event)) {
            throw new Error(`Blocked IPC event channel: ${event}`);
        }
        const listener = (_e: unknown, data: any) => callback(data);
        electron.ipcRenderer.on(event, listener);
        return () => electron.ipcRenderer.removeListener(event, listener);
    },
} satisfies Window['electron']);
