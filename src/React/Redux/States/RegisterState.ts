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
        setUserId: (state, action: PayloadAction<string>) => {
            state.UserId = action.payload;
        },
    },
});

export const { setEmail, setUsername, setUserId } = registerSlice.actions;

export default registerSlice.reducer;
