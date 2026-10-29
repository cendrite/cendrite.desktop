export const API_URLS = {
    USER: 'https://conduit.xhykl49jkg.org/api/profile',
    USER_MANAGEMENT: {
        GET_PROFILE: 'https://conduit.xhykl49jkg.org/api/profile',
        GET_BY_TAG: 'https://conduit.xhykl49jkg.org/api/profile/tag',
        UPDATE_AVATAR: 'https://conduit.xhykl49jkg.org/api/profile/avatar',
        GET_AVATAR: 'https://conduit.xhykl49jkg.org/api/profile/avatar',
        GET_FRIENDS: 'https://conduit.xhykl49jkg.org/api/friend/list',
    },
    IDENTITY: {
        AUTH: 'https://conduit.xhykl49jkg.org/api/identity',
        DEVICE: 'https://conduit.xhykl49jkg.org/api/identity/user/device',
        USER: {
            BASE: 'https://conduit.xhykl49jkg.org/api/identity/user',
            REGISTER: 'https://conduit.xhykl49jkg.org/api/identity/user',
            VERIFY_USER: 'https://conduit.xhykl49jkg.org/api/identity/user/verify',
            RESEND_VERIFICATION: 'https://conduit.xhykl49jkg.org/api/identity/user/resend-verification',
        },
    },
    FRIEND: {
        BASE: 'https://conduit.xhykl49jkg.org/api/friend',
    },
    LEDGER: {
        BASE: 'https://conduit.xhykl49jkg.org/api/ledger/streams',
    },
    KEYSTORE: {
        BASE: 'https://conduit.xhykl49jkg.org/api/keys',
        UPLOAD_OTPS: 'https://conduit.xhykl49jkg.org/api/keys/otps',
    },
    MEDIA: {
        BASE: 'https://chatserver.xhykl49jkg.org/api/media',
    },
    GIPHY: {
        // GIPHY's terms require these calls to come straight from the client, so they are never proxied.
        GIFS: 'https://api.giphy.com/v1/gifs',
        MEDIA_HOST_SUFFIX: '.giphy.com',
    },
    PRIVACY_PASS: {
        ISSUER_DIRECTORY: 'https://conduit.xhykl49jkg.org/.well-known/private-token-issuer-directory',
    },
};
