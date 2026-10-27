import { asClass, asValue, Lifetime } from 'awilix';
import { LogoutManager } from './Services/LogoutManager/LogoutManager.js';
import { MediaService } from './Services/Media/MediaService.js';
import { LoginCommandHandler } from './Features/Authentication/Commands/LoginCommandHandler.js';
import { LogoutCommandHandler } from './Features/Authentication/Commands/LogoutCommandHandler.js';
import { VerifyLoginCommandHandler } from './Features/Authentication/Commands/VerifyLoginCommandHandler.js';
import { StartupCommandHandler } from './Features/Authentication/Commands/StartupCommandHandler.js';
import { RegisterCommandHandler } from './Features/Authentication/Commands/RegisterCommandHandler.js';
import { VerifyUserCommandHandler } from './Features/Authentication/Commands/VerifyUserCommandHandler.js';
import { ResendVerificationCodeCommandHandler } from './Features/Authentication/Commands/ResendVerificationCodeCommandHandler.js';
import { UpdateAvatarCommandHandler } from './Features/User/Commands/UpdateAvatarCommandHandler.js';
import { SendFriendRequestCommandHandler } from './Features/Friends/Commands/SendFriendRequestCommandHandler.js';
import { DeclineFriendRequestCommandHandler } from './Features/Friends/Commands/DeclineFriendRequestCommandHandler.js';
import { AcceptFriendRequestCommandHandler } from './Features/Friends/Commands/AcceptFriendRequestCommandHandler.js';
import { GetFriendRequestsQueryHandler } from './Features/Friends/Queries/GetFriendRequestsQueryHandler.js';
import { SyncFriendsQueryHandler } from './Features/Friends/Queries/SyncFriendsQueryHandler.js';
import { GetProfileByTagQueryHandler } from './Features/Friends/Queries/GetProfileByTagQueryHandler.js';
import { GetDevicesQueryHandler } from './Features/Devices/Queries/GetDevicesQueryHandler.js';
import { GetMediaQueryHandler } from './Features/Files/Queries/GetMediaQueryHandler.js';
import { CreateChatCommandHandler } from './Features/Chat/Commands/CreateChatCommandHandler.js';
import { DeleteChatCommandHandler } from './Features/Chat/Commands/DeleteChatCommandHandler.js';
import { GetChatsQueryHandler } from './Features/Chat/Queries/GetChatsQueryhandler.js';
import { GetMessagesQueryHandler } from './Features/Chat/Queries/GetMessagesQueryHandler.js';
import { AddUserConnectionIdCommandHandler } from './Features/User/Commands/AddUserConnectionIdCommandHandler.js';
import { RemoveUserConnectionIdCommandHandler } from './Features/User/Commands/RemoveUserConnectionIdCommandHandler.js';
import { DeleteFriendCommandHandler } from './Features/Friends/Commands/DeleteFriendCommandHandler.js';
import { AddFriendConnectionIdCommandHandler } from './Features/Friends/Commands/AddFriendConnectionIdCommandHandler.js';
import { RemoveFriendConnectionIdCommandHandler } from './Features/Friends/Commands/RemoveFriendConnectionIdCommandHandler.js';
import { UpdateFriendCommandHandler } from './Features/Friends/Commands/UpdateFriendCommandHandler.js';
import { CreateFriendCommandHandler } from './Features/Friends/Commands/CreateFriendCommandHandler.js';
import { SendMessageCommandHandler } from './Features/Chat/Commands/SendMessageCommandHandler.js';
import { DeliveryStatusUpdatedCommandHandler } from './Features/Chat/Commands/DeliveryStatusUpdatedCommandHandler.js';
import { UpdateDeliveryStatusCommandHandler } from './Features/Chat/Events/UpdateDeliveryStatusEventHandler.js';
import { MessageSentCommandHandler } from './Features/Chat/Events/MessageSentEventHandler.js';
import { ResendMessageCommandHandler } from './Features/Chat/Commands/ResendMessageCommandHandler.js';
import { GetSettingsQueryHandler } from './Features/Settings/Queries/GetSettingsQueryHandler.js';
import { UpdateSettingsCommandHandler } from './Features/Settings/Commands/UpdateSettingsCommandHandler.js';
import { GroupService } from './Services/GroupService.js';

const services = {
    logoutManager: asValue(LogoutManager.getInstance()),
    mediaService: asClass(MediaService, { lifetime: Lifetime.SINGLETON }),
    groupService: asClass(GroupService, { lifetime: Lifetime.SINGLETON }),
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
};

const chatHandlers = {
    getChatsQueryHandler: asClass(GetChatsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    getMessagesQueryHandler: asClass(GetMessagesQueryHandler, { lifetime: Lifetime.SINGLETON }),
    createChatCommandHandler: asClass(CreateChatCommandHandler, { lifetime: Lifetime.SINGLETON }),
    deleteChatCommandHandler: asClass(DeleteChatCommandHandler, { lifetime: Lifetime.SINGLETON }),
    updateDeliveryStatusCommandHandler: asClass(UpdateDeliveryStatusCommandHandler, { lifetime: Lifetime.SINGLETON }),
    deliveryStatusUpdatedCommandHandler: asClass(DeliveryStatusUpdatedCommandHandler, { lifetime: Lifetime.SINGLETON }),
    sendMessageCommandHandler: asClass(SendMessageCommandHandler, { lifetime: Lifetime.SINGLETON }),
    messageSentCommandHandler: asClass(MessageSentCommandHandler, { lifetime: Lifetime.SINGLETON }),
    resendMessageCommandHandler: asClass(ResendMessageCommandHandler, { lifetime: Lifetime.SINGLETON }),
};

const userHandlers = {
    updateAvatarCommandHandler: asClass(UpdateAvatarCommandHandler, { lifetime: Lifetime.SINGLETON }),
    addUserConnectionIdCommandHandler: asClass(AddUserConnectionIdCommandHandler, { lifetime: Lifetime.SINGLETON }),
    removeUserConnectionIdCommandHandler: asClass(RemoveUserConnectionIdCommandHandler, { lifetime: Lifetime.SINGLETON }),
};

const mediaHandlers = {
    getMediaQueryHandler: asClass(GetMediaQueryHandler, { lifetime: Lifetime.SINGLETON }),
};

const friendHandlers = {
    sendFriendRequestCommandHandler: asClass(SendFriendRequestCommandHandler, { lifetime: Lifetime.SINGLETON }),
    declineFriendRequestCommandHandler: asClass(DeclineFriendRequestCommandHandler, { lifetime: Lifetime.SINGLETON }),
    acceptFriendRequestCommandHandler: asClass(AcceptFriendRequestCommandHandler, { lifetime: Lifetime.SINGLETON }),
    getFriendRequestsQueryHandler: asClass(GetFriendRequestsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    deleteFriendCommandHandler: asClass(DeleteFriendCommandHandler, { lifetime: Lifetime.SINGLETON }),
    syncFriendsQueryHandler: asClass(SyncFriendsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    getProfileByTagQueryHandler: asClass(GetProfileByTagQueryHandler, { lifetime: Lifetime.SINGLETON }),
    addFriendConnectionIdCommandHandler: asClass(AddFriendConnectionIdCommandHandler, { lifetime: Lifetime.SINGLETON }),
    removeFriendConnectionIdCommandHandler: asClass(RemoveFriendConnectionIdCommandHandler, { lifetime: Lifetime.SINGLETON }),
    updateFriendCommandHandler: asClass(UpdateFriendCommandHandler, { lifetime: Lifetime.SINGLETON }),
    createFriendCommandHandler: asClass(CreateFriendCommandHandler, { lifetime: Lifetime.SINGLETON }),
};

const deviceHandlers = {
    getDevicesQueryHandler: asClass(GetDevicesQueryHandler, { lifetime: Lifetime.SINGLETON }),
};

const settingsHandlers = {
    getSettingsQueryHandler: asClass(GetSettingsQueryHandler, { lifetime: Lifetime.SINGLETON }),
    updateSettingsCommandHandler: asClass(UpdateSettingsCommandHandler, { lifetime: Lifetime.SINGLETON }),
};

export const applicationResolvers = {
    ...services,
    ...userHandlers,
    ...friendHandlers,
    ...authenticationHandlers,
    ...chatHandlers,
    ...mediaHandlers,
    ...settingsHandlers,
    ...deviceHandlers,
};
