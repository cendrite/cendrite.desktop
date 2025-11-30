export const API_URLS = {
    USER_MANAGEMENT: {
        GET_PROFILE: "https://conduit.xhykl49jkg.org/api/profile",
        GET_BY_TAG: "https://conduit.xhykl49jkg.org/api/profile/tag",
        UPDATE_PROFILE_PICTURE: "https://social.xhykl49jkg.org/api/UserProfile/profile-picture",
        GET_PROFILE_PICTURE: "https://social.xhykl49jkg.org/api/UserProfile/profile-picture",
        SEND_FRIEND_REQUEST: "https://social.xhykl49jkg.org/api/UserProfile/friendship",
        DELETE_FRIENDSHIP: "https://social.xhykl49jkg.org/api/UserProfile/friendship/delete",
        DECLINE_FRIEND_REQUEST: "https://social.xhykl49jkg.org/api/UserProfile/friendship/reject",
        ACCEPT_FRIENDSHIP: "https://social.xhykl49jkg.org/api/UserProfile/friendship/accept",
        GET_FRIENDS: "https://conduit.xhykl49jkg.org/api/friend/list",
        GET_FRIEND_REQUESTS: "https://social.xhykl49jkg.org/api/UserProfile/friendship/requests",
    },
    IDENTITY: {
        AUTH: {
            LOGOUT: "https://identity.xhykl49jkg.org/api/Authentication/logout",
            LOGIN: "https://conduit.xhykl49jkg.org/api/identity/login",
            VERIFY_LOGIN: "https://identity.xhykl49jkg.org/api/Authentication/verify-login",
            GET_NONCE: "https://identity.xhykl49jkg.org/api/Authentication/nonce",
            REFRESH_TOKEN: "https://identity.xhykl49jkg.org/api/Authentication/refresh-token",
            VERIFY_NONCE: "https://identity.xhykl49jkg.org/api/Authentication/verify-nonce",
        },
        USER: {
            REGISTER: "https://identity.xhykl49jkg.org/api/User",
            DELETE: "https://identity.xhykl49jkg.org/api/User",
            VERIFY_USER: "https://identity.xhykl49jkg.org/api/User/verify",
            RESEND_VERIFICATION: "https://identity.xhykl49jkg.org/api/User/resend-verification",
            CREATE_DEVICE: "https://identity.xhykl49jkg.org/api/User/device",
            GET_DEVICES: "https://identity.xhykl49jkg.org/api/User/device",
        }
    },
    BUCKET: {
        BUCKET_BASE: "https://bucket-console.xhykl49jkg.org",
    },
    KEYSTORE: {
        CREATE_KEY_BUNDLE: "https://conduit.xhykl49jkg.org/api/keys",   
        UPLOAD_OTPS: "https://conduit.xhykl49jkg.org/api/keys/otps",
    }
}
