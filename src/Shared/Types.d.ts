
type MediatorRequest = {
    type: string;
}

interface Window {
    electron: {
        sendRequestAsync: <TResponse> (
            request: MediatorRequest,
        ) => Promise<TResponse>;
    }
}
