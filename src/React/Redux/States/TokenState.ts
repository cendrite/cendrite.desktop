import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TokenState {
    jwt: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
}

const initialState: TokenState = {
    jwt: null,
    refreshToken: null,
    expiresAt: null,
};

const tokenSlice = createSlice({
    name: 'token',
    initialState,
    reducers: {
        setJwt: (state, action: PayloadAction<string>) => {
            state.jwt = action.payload;
        },
        setRefreshToken: (state, action: PayloadAction<string>) => {
            state.refreshToken = action.payload;
        },
        setExpiresAt: (state, action: PayloadAction<Date>) => {
            state.expiresAt = action.payload;
        },
    },
});

export const { setJwt, setRefreshToken, setExpiresAt } = tokenSlice.actions;

export default tokenSlice.reducer;