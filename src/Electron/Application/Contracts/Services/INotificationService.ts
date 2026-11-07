export interface INotificationService {
    notifyMessage(title: string, preview: string): Promise<void>;
    notifyDeviceAdded(platform: string): void;
    notifyAccountKeyRotated(deviceName: string): void;
}
