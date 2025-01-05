import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RegisterState {
    email: string | null;
    username: string | null;
    UserId: string | null;
}

const initialState: RegisterState = {
    email: null,
    username: null,
    UserId: null,
};

const registerSlice = createSlice({
    name: 'register',
    initialState,
    reducers: {
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setRegisterUserId: (state, action: PayloadAction<string>) => {
            state.UserId = action.payload;
        },
    },
});

export const { setEmail, setUsername, setRegisterUserId: setRegisterUserId } = registerSlice.actions;

export default registerSlice.reducer;
