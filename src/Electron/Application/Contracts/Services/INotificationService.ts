export interface INotificationService {
    notifyMessage(title: string, preview: string): Promise<void>;
}
