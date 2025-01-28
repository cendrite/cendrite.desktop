export const API_URLS = {
    USER_MANAGEMENT: {
        GET_PROFILE: "http://10.0.0.100:30420/api/UserProfile",
        GET_BY_TAG: "http://10.0.0.100:30420/api/UserProfile/tag",
        UPDATE_PROFILE_PICTURE: "http://10.0.0.100:30420/api/UserProfile/profile-picture",
    },
    IDENTITY: {
        AUTH:{
            LOGOUT: "http://10.0.0.100:30069/api/Authentication/logout",
            LOGIN: "http://10.0.0.100:30069/api/Authentication/login",
            VERIFY_LOGIN: "http://10.0.0.100:30069/api/Authentication/verify-login",
        },
        USER: {
            REGISTER: "http://10.0.0.100:30069/api/User",
            DELETE: "http://10.0.0.100:30069/api/User",
            VERIFY_USER: "http://10.0.0.100:30069/api/User/verify",
            RESEND_VERIFICATION: "http://10.0.0.100:30069/api/User/resend-verification",
            CREATE_DEVICE: "http://10.0.0.100:30069/api/User/device",
            GET_DEVICES: "http://10.0.0.100:30069/api/User/device",
        }
    }
}