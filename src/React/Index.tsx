import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {store} from "./Redux/Store.ts";
import {Provider} from "react-redux";
import {UserProvider} from "./Common/Context/UserContext.tsx";
import {AuthProvider} from "./Common/Context/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <UserProvider>
                <AuthProvider>
                    <App/>
                </AuthProvider>
            </UserProvider>
        </Provider>
    </StrictMode>
);
