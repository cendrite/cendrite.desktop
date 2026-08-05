export const API_URLS = {
    USER: 'https://conduit.xhykl49jkg.org/api/profile',
    USER_MANAGEMENT: {
        GET_PROFILE: 'https://conduit.xhykl49jkg.org/api/profile',
        GET_BY_TAG: 'https://conduit.xhykl49jkg.org/api/profile/tag',
        UPDATE_AVATAR: 'https://conduit.xhykl49jkg.org/api/profile/avatar',
        GET_AVATAR: 'https://conduit.xhykl49jkg.org/api/profile/avatar',
        SEND_FRIEND_REQUEST: 'https://social.xhykl49jkg.org/api/UserProfile/friendship',
        DELETE_FRIENDSHIP: 'https://social.xhykl49jkg.org/api/UserProfile/friendship/delete',
        DECLINE_FRIEND_REQUEST: 'https://social.xhykl49jkg.org/api/UserProfile/friendship/reject',
        ACCEPT_FRIENDSHIP: 'https://social.xhykl49jkg.org/api/UserProfile/friendship/accept',
        GET_FRIENDS: 'https://conduit.xhykl49jkg.org/api/friend/list',
        GET_FRIEND_REQUESTS: 'https://social.xhykl49jkg.org/api/UserProfile/friendship/requests',
    },
    IDENTITY: {
        AUTH: 'https://conduit.xhykl49jkg.org/api/identity',
        DEVICE: 'https://identity.xhykl49jkg.org/api/User/device',
        USER: {
            REGISTER: 'https://identity.xhykl49jkg.org/api/User',
            VERIFY_USER: 'https://identity.xhykl49jkg.org/api/User/verify',
            RESEND_VERIFICATION: 'https://identity.xhykl49jkg.org/api/User/resend-verification',
            GET_DEVICES: 'https://identity.xhykl49jkg.org/api/User/device',
        },
    },
    FRIEND: {
        BASE: 'https://conduit.xhykl49jkg.org/api/friend',
        FRIENDSHIP: 'https://social.xhykl49jkg.org/api/UserProfile/friendship',
    },
    KEYSTORE: {
        BASE: 'https://conduit.xhykl49jkg.org/api/keys',
        UPLOAD_OTPS: 'https://conduit.xhykl49jkg.org/api/keys/otps',
    },
    MEDIA: {
        BASE: 'https://chatserver.xhykl49jkg.org/api/media',
    },
};
