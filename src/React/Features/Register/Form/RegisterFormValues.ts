export interface RegisterFormValues {
    username: string;
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export enum RegisterFieldName {
    Username = "username",
    DisplayName = "displayName",
    Email = "email",
    Password = "password",
    ConfirmPassword = "confirmPassword"
}