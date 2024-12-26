export interface LoginFormValues {
    email: string;
    password: string;
}

export const InitialFormValues: LoginFormValues = {
    email: "",
    password: "",
}

export enum LoginFieldName {
    Email = "email",
    Password = "password",
}