export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterResponse {
    email: string;
    id: string;
}