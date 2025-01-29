import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {store} from "./Redux/Store.ts";
import {Provider} from "react-redux";
import {UserProvider} from "./Common/Context/UserContext.tsx";
import {AuthProvider} from "./Common/Context/AuthContext.tsx";
import {OnboardingProvider} from "./Common/Context/OnboardingContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <OnboardingProvider>
                <UserProvider>
                    <AuthProvider>
                        <App/>
                    </AuthProvider>
                </UserProvider>
            </OnboardingProvider>
        </Provider>
    </StrictMode>
);
