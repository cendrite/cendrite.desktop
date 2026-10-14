/* eslint-disable @typescript-eslint/no-require-imports */
const electron = require('electron');

// Runtime whitelist — types are erased in .cts, so this can't come from AppEventMap.
// Keep in sync with the AppEventMap keys in Types.d.ts.
const ALLOWED_EVENTS: AppEvent[] = ['changeEvent',  'eventMessage', 'connectionState'];

const THEME_ARG = '--initial-theme=';
const initialTheme = (process.argv.find((a) => a.startsWith(THEME_ARG))?.slice(THEME_ARG.length) ??
    'dark') as Theme;

electron.contextBridge.exposeInMainWorld('electron', {
    initialTheme: initialTheme,

    sendRequestAsync: (request: MediatorRequest) => electron.ipcRenderer.invoke('mediator:send', request),

    on: <E extends AppEvent>(event: E, callback: (data: AppEventMap[E]) => void): (() => void) => {
        if (!ALLOWED_EVENTS.includes(event)) {
            throw new Error(`Blocked IPC event channel: ${event}`);
        }
        const listener = (_e: unknown, data: AppEventMap[E]) => callback(data);
        electron.ipcRenderer.on(event, listener);
        return () => electron.ipcRenderer.removeListener(event, listener);
    },
} satisfies Window['electron']);
