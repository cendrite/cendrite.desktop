
export type HubKey = keyof typeof HubPaths;

export const HubPaths = {
    ChangeEvents: "https://chatserver.xhykl49jkg.org/change-eventhub",
} as const;

