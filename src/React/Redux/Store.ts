import { configureStore } from '@reduxjs/toolkit';
import registerReducer from './States/RegisterState';
import loginReducer from './States/LoginState';

export const store = configureStore({
    reducer: {
        register: registerReducer,
        login: loginReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
