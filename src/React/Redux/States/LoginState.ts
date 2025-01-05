import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LoginState {
    UserId: string | null;
    DeviceId: string | null;
    PrivateKey: string | null;
    PublicKey: string | null;
}

const initialState: LoginState = {
    UserId: null,
    DeviceId: null,
    PrivateKey: null,
    PublicKey: null,
};

const loginSlice = createSlice({
    name: 'login',
    initialState,
    reducers: {
        setLoginUserId: (state, action: PayloadAction<string>) => {
            state.UserId = action.payload;
        },
        setLoginDeviceId: (state, action: PayloadAction<string>) => {
            state.DeviceId = action.payload;
        },
        setLoginPrKey: (state, action: PayloadAction<string>) => {
            state.PrivateKey = action.payload;
        },
        setLoginPuKey: (state, action: PayloadAction<string>) => {
            state.PublicKey = action.payload;
        },
    },
});

export const { setLoginUserId: setLoginUserId, setLoginDeviceId: setLoginDeviceId, setLoginPrKey: setLoginPrKey, setLoginPuKey: setLoginPuKey } = loginSlice.actions;

export default loginSlice.reducer;