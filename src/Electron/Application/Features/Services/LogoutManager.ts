export class LogoutManager{
    private static instance : LogoutManager;
    private isLoggingOut = false;

    private constructor(){
    }

    public static getInstance(){
        if(!LogoutManager.instance){
            LogoutManager.instance = new LogoutManager();
        }
        return LogoutManager.instance;
    }

    public get IsLoggingOut(){
        return this.isLoggingOut;
    }

    public set IsLoggingOut(value: boolean){
        this.isLoggingOut = value;
    }
}