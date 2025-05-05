export const API_URLS = {
    USER_MANAGEMENT: {
        GET_PROFILE: "https://usermanagement.xhykl49jkg.org/api/UserProfile",
        GET_BY_TAG: "https://usermanagement.xhykl49jkg.org/api/UserProfile/tag",
        UPDATE_PROFILE_PICTURE: "https://usermanagement.xhykl49jkg.org/api/UserProfile/profile-picture",
        GET_PROFILE_PICTURE: "https://usermanagement.xhykl49jkg.org/api/UserProfile/profile-picture",
        SEND_FRIEND_REQUEST: "https://usermanagement.xhykl49jkg.org/api/UserProfile/friendship/create",
        DELETE_FRIENDSHIP: "https://usermanagement.xhykl49jkg.org/api/UserProfile/friendship/delete",
        DECLINE_FRIEND_REQUEST: "https://usermanagement.xhykl49jkg.org/api/UserProfile/friendship/reject",
        ACCEPT_FRIENDSHIP: "https://usermanagement.xhykl49jkg.org/api/UserProfile/friendship/accept",
        GET_FRIENDS: "https://usermanagement.xhykl49jkg.org/api/UserProfile/friendships",
        GET_FRIEND_REQUESTS: "https://usermanagement.xhykl49jkg.org/api/UserProfile/friendship/requests",
    },
    IDENTITY: {
        AUTH: {
            LOGOUT: "https://identity.xhykl49jkg.org/api/Authentication/logout",
            LOGIN: "https://identity.xhykl49jkg.org/api/Authentication/login",
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
    }
}