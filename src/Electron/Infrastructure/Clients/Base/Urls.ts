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
    KLIPY: {
        BASE: 'https://api.klipy.com/api/v1',
        MEDIA_HOST_SUFFIXES: ['.klipy.com', '.klipy.co'],
    },
    PRIVACY_PASS: {
        ISSUER_DIRECTORY: 'https://conduit.xhykl49jkg.org/.well-known/private-token-issuer-directory',
    },
};
