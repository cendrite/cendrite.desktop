import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ChatViewModel } from '../../../Models/ChatViewModel';
import { MessageViewModel } from '../../../Models/MessageViewModel';
import { useMessageService } from '../../../Common/Hooks/MessageService';
import { useUser } from '../../../Context/User/UserContext';
import { useChatContext } from '../../../Context/Chat/ChatContext';
import { ChatActionType } from '../../../Context/Chat/ChatReducer';
import MessageBubble from './MessageBubble';

interface MessageListProps {
    chat: ChatViewModel;
}

const MessageListV2: React.FC<MessageListProps> = ({ chat }) => {
    const { user } = useUser();
    const { chatDispatch } = useChatContext();
    const { loadMessages } = useMessageService();
    const [hasMore, setHasMore] = useState(true);

    const fetchMore = async () => {
        const next = await loadMessages(chat.id, chat.messages.length, 10);
        if (next.length === 0) {
            setHasMore(false);
            return;
        }
        chatDispatch({
            type: ChatActionType.PrependMessages,
            payload: { chatId: chat.id, messages: next },
        });
    };

    function shouldShowStatus(messages: MessageViewModel[], index: number): boolean {
        if (!user?.IsUserConnectionId(messages[index].senderId)) return false;
        for (let i = index + 1; i < messages.length; i++) {
            if (user.IsUserConnectionId(messages[i].senderId)) {
                return messages[i].deliveryStatus !== messages[index].deliveryStatus;
            }
        }
        return true;
    }

    return (
        <div id="chatBox" className="flex-1 overflow-y-auto p-4 pb-8">
            <InfiniteScroll
                dataLength={chat.messages.length}
                next={fetchMore}
                hasMore={hasMore}
                inverse={true}
                loader={<p>Loading older messages...</p>}
                scrollableTarget="chatBox"
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                {chat.messages.map((message, index) => {
                    const showStatus = shouldShowStatus(chat.messages, index);
                    return <MessageBubble key={message.id} message={message} showStatus={showStatus} />;
                })}
            </InfiniteScroll>
        </div>
    );
};

export default MessageListV2;
