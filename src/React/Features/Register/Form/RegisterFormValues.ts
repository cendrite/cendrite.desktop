export interface RegisterFormValues {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export enum RegisterFieldName {
    Username = "username",
    Email = "email",
    Password = "password",
    ConfirmPassword = "confirmPassword"
}