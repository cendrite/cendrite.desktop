import { asClass, asValue, Lifetime } from 'awilix';
import { LogoutManager } from './Services/LogoutManager/LogoutManager.js';
import { KeyGenerator } from './Services/Cryptography/KeyService.js';
import { MediaService } from './Services/Media/MediaService.js';
import { PurgeLocalDataService } from './Services/Data/PurgeLocalDataService.js';
import { InitializeTokenManagerCommandHandler } from './Features/Tokens/Commands/Initialize/InitializeTokenCommandHandler.js';
import { RefreshTokenCommandHandler } from './Features/Tokens/Commands/Refresh/RefreshTokenCommandHandler.js';
import { GetTokenQueryHandler } from './Features/Tokens/Queries/GetTokenQueryHandler.js';
import { LoginCommandHandler } from './Features/Authentication/Commands/LoginCommandHandler.js';
import { LogoutCommandHandler } from './Features/Authentication/Commands/LogoutCommandHandler.js';
import { VerifyLoginCommandHandler } from './Features/Authentication/Commands/VerifyLoginCommandHandler.js';
import { StartupCommandHandler } from './Features/Authentication/Commands/StartupCommandHandler.js';
import { RegisterCommandHandler } from './Features/Authentication/Commands/RegisterCommandHandler.js';
import { VerifyUserCommandHandler } from './Features/Authentication/Commands/VerifyUserCommandHandler.js';
import { ResendVerificationCodeCommandHandler } from './Features/Authentication/Commands/ResendVerificationCodeCommandHandler.js';
import { SignNonceRequestHandler } from './Features/Device/Commands/SignNonce/SignNonceRequestHandler.js';
import { SendMessageCommandHandler } from './Features/Chat/Commands/SendMessageCommandHandler.js';
import { AddMessageCommandHandler } from './Features/Chat/Commands/AddMessage/AddMessageCommandHandler.js';
import { GetChatsQueryHandler } from './Features/Chat/Queries/GetChats/GetChatsQueryhandler.js';
import { GetMessagesQueryHandler } from './Features/Chat/Queries/GetMessages/GetMessagesQueryHandler.js';
import { UpdateAvatarCommandHandler } from './Features/User/Commands/UpdateAvatarCommandHandler.js';
import { SendFriendRequestCommandHandler } from './Features/Friends/Commands/SendFriendRequestCommandHandler.js';
import { DeclineFriendRequestCommandHandler } from './Features/Friends/Commands/DeclineFriendRequestCommandHandler.js';
import { AcceptFriendRequestCommandHandler } from './Features/Friends/Commands/AcceptFriendRequestCommandHandler.js';
import { GetFriendRequestsQueryHandler } from './Features/Friends/Queries/GetFriendRequestsQueryHandler.js';
import { DeleteFriendCommandHandler } from './Features/Friends/Commands/Delete/DeleteFriendCommandHandler.js';
import { SyncFriendsQueryHandler } from './Features/Friends/Queries/SyncFriendsQueryHandler.js';
import { GetProfileByTagQueryHandler } from './Features/Friends/Queries/GetProfileByTagQueryHandler.js';

const services = {
    logoutManager: asValue(LogoutManager.getInstance()),
    keyGenerator: asClass(KeyGenerator, { lifetime: Lifetime.SINGLETON }),
    mediaService: asClass(MediaService, { lifetime: Lifetime.SINGLETON }),
    purgeLocalDataService: asClass(PurgeLocalDataService, { lifetime: Lifetime.SINGLETON }),
};

const tokenHandlers = {
    initializeTokenManagerCommandHandler: asClass(InitializeTokenManagerCommandHandler, {
        lifetime: Lifetime.TRANSIENT,
    }),
    refreshTokenCommandHandler: asClass(RefreshTokenCommandHandler, { lifetime: Lifetime.SINGLETON }),
    getTokenQueryHandler: asClass(GetTokenQueryHandler, { lifetime: Lifetime.SINGLETON }),
};

const authenticationHandlers = {
    loginCommandHandler: asClass(LoginCommandHandler, { lifetime: Lifetime.SINGLETON }),
    logoutCommandHandler: asClass(LogoutCommandHandler, { lifetime: Lifetime.SINGLETON }),
    verifyLoginCommandHandler: asClass(VerifyLoginCommandHandler, { lifetime: Lifetime.SINGLETON }),
    startupCommandHandler: asClass(StartupCommandHandler, { lifetime: Lifetime.SINGLETON }),
    registerCommandHandler: asClass(RegisterCommandHandler, { lifetime: Lifetime.SINGLETON }),
    verifyUserCommandHandler: asClass(VerifyUserCommandHandler, { lifetime: Lifetime.SINGLETON }),
    resendVerificationCodeCommandHandler: asClass(ResendVerificationCodeCommandHandler, {
        lifetime: Lifetime.SINGLETON,
    }),
    signNonceRequestHandler: asClass(SignNonceRequestHandler, { lifetime: Lifetime.SINGLETON }),
};

const chatHandlers = {
    sendMessageCommandHandler: asClass(SendMessageCommandHandler, { lifetime: Lifetime.SINGLETON }),
    addMessageCommandHandler: asClass(AddMessageCommandHandler, { lifetime: Lifetime.SINGLETON }),
    getChatsQueryHandler: asClass(GetChatsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    getMessagesQueryHandler: asClass(GetMessagesQueryHandler, { lifetime: Lifetime.SINGLETON }),
};

const userHandlers = {
    updateAvatarCommandHandler: asClass(UpdateAvatarCommandHandler, { lifetime: Lifetime.SINGLETON }),
};

const friendHandlers = {
    sendFriendRequestCommandHandler: asClass(SendFriendRequestCommandHandler, { lifetime: Lifetime.SINGLETON }),
    declineFriendRequestCommandHandler: asClass(DeclineFriendRequestCommandHandler, { lifetime: Lifetime.SINGLETON }),
    acceptFriendRequestCommandHandler: asClass(AcceptFriendRequestCommandHandler, { lifetime: Lifetime.SINGLETON }),
    getFriendRequestsQueryHandler: asClass(GetFriendRequestsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    deleteFriendCommandHandler: asClass(DeleteFriendCommandHandler, { lifetime: Lifetime.SINGLETON }),
    syncFriendsQueryHandler: asClass(SyncFriendsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    getProfileByTagQueryHandler: asClass(GetProfileByTagQueryHandler, { lifetime: Lifetime.SINGLETON }),
};

export const applicationResolvers = {
    ...services,
    ...userHandlers,
    ...friendHandlers,
    ...tokenHandlers,
    ...authenticationHandlers,
    ...chatHandlers,
};
