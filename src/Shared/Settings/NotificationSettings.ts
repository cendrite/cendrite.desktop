export type NotificationSettings = {
    enabled: boolean;
    showMessagePreview: boolean;
};

export const defaultNotificationSettings: NotificationSettings = {
    enabled: true,
    showMessagePreview: false,
};
