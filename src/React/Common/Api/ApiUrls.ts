export const API_URLS = {
    USER_MANAGEMENT: {
        GET_PROFILE: "http://10.0.0.100:30420/api/UserProfile",
        GET_BY_TAG: "http://10.0.0.100:30420/api/UserProfile/tag",
        UPDATE_PROFILE_PICTURE: "http://10.0.0.100:30420/api/UserProfile/profile-picture",
        GET_PROFILE_PICTURE: "http://10.0.0.100:30420/api/UserProfile/profile-picture",
        SEND_FRIEND_REQUEST: "http://10.0.0.100:30420/api/UserProfile/friendship/create",
        DELETE_FRIEND_REQUEST: "http://10.0.0.100:30420/api/UserProfile/friendship/delete",
        ACCEPT_FRIENDSHIP: "http://10.0.0.100:30420/api/UserProfile/friendship/accept",
    },
    IDENTITY: {
        AUTH: {
            LOGOUT: "http://10.0.0.100:30069/api/Authentication/logout",
            LOGIN: "http://10.0.0.100:30069/api/Authentication/login",
            VERIFY_LOGIN: "http://10.0.0.100:30069/api/Authentication/verify-login",
            GET_NONCE: "http://10.0.0.100:30069/api/Authentication/nonce",
            REFRESH_TOKEN: "http://10.0.0.100:30069/api/Authentication/refresh-token",
            VERIFY_NONCE: "http://10.0.0.100:30069/api/Authentication/verify-nonce",
        },
        USER: {
            REGISTER: "http://10.0.0.100:30069/api/User",
            DELETE: "http://10.0.0.100:30069/api/User",
            VERIFY_USER: "http://10.0.0.100:30069/api/User/verify",
            RESEND_VERIFICATION: "http://10.0.0.100:30069/api/User/resend-verification",
            CREATE_DEVICE: "http://10.0.0.100:30069/api/User/device",
            GET_DEVICES: "http://10.0.0.100:30069/api/User/device",
        }
    },
    BUCKET: {
        BUCKET_BASE: "http://10.0.0.100:30000",
    }
}