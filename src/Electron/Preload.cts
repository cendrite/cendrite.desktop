const electron = require('electron');

electron.contextBridge.exposeInMainWorld("electron", {
    sendRequestAsync: async <TResponse extends any>(request: MediatorRequest): Promise<TResponse> => {
        console.log("hello from preload");
        return await electron.ipcRenderer.invoke("mediator:send", request);
    },
} satisfies Window["electron"]);