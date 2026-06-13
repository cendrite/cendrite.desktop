import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MessageViewModel } from '../../../Models/MessageViewModel.ts';
import MessageBubble from './MessageBubble.tsx';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { useChatContext } from '../../../Context/Chat/ChatContext.tsx';
import { useMessageService } from '../../../Common/Hooks/MessageService.ts';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import { ChatActionType } from '../../../Context/Chat/ChatReducer.ts';
import { IconChevronDown } from '@tabler/icons-react';

interface MessageListProps {
    chat: ChatViewModel;
}

const PAGE_SIZE = 10;
const SCROLL_TOP_THRESHOLD = 80;
const BOTTOM_THRESHOLD = 120;

function shouldShowStatus(messages: MessageViewModel[], index: number, isMine: (senderId: string) => boolean): boolean {
    if (!isMine(messages[index].senderId)) return false;

    for (let i = index + 1; i < messages.length; i++) {
        if (isMine(messages[i].senderId)) {
            return messages[i].deliveryStatus !== messages[index].deliveryStatus;
        }
    }

    return true;
}

interface ChatScroll {
    container: React.RefObject<HTMLDivElement>;
    showJump: boolean;
    onScroll: () => void;
    jumpToBottom: () => void;
}

// Encapsulates the scroll behaviour of the message list: infinite scroll of older
// messages with manual anchoring, auto-fill until the viewport overflows, sticking to
// the bottom for new/own messages, and the "jump to latest" pill when reading history.
function useChatScroll(chat: ChatViewModel): ChatScroll {
    const { user } = useUser();
    const { chatDispatch } = useChatContext();
    const { loadMessages } = useMessageService();
    const container = useRef<HTMLDivElement>(null);
    const hasMore = useRef(true);
    const isLoading = useRef(false);
    // Height captured right before an anchored prepend. When set, the layout effect
    // restores scroll position by the added height instead of sticking to the bottom.
    const prevScrollHeight = useRef<number | null>(null);
    const wasNearBottom = useRef(true);
    const prevLength = useRef(0);

    const [showJumpButton, setShowJumpButton] = useState(false);

    // One instance per chat (MessageList is keyed by chat.id), so every ref starts fresh
    // on each chat — no manual chat-switch reset needed.

    // Fetch one page of older messages. `anchor` keeps the current viewport stable
    // (used when the user scrolls up); without it the layout effect sticks to the
    // bottom (used while auto-filling so the newest messages stay in view).
    const fetchMessages = async (anchor: boolean) => {
        if (!container.current || isLoading.current || !hasMore.current) return;

        isLoading.current = true;
        if (anchor) prevScrollHeight.current = container.current.scrollHeight;

        const messages = await loadMessages(chat.id, chat.messages.length, PAGE_SIZE);
        if (messages.length < PAGE_SIZE) hasMore.current = false;

        if (messages.length > 0) {
            chatDispatch({
                type: ChatActionType.PrependMessages,
                payload: { chatId: chat.id, messages },
            });
        } else {
            prevScrollHeight.current = null;
        }

        isLoading.current = false;
    };

    // Decide where to put the scroll position after each render. Runs before paint, so
    // there is no visible jump. Chromium does not reliably anchor scroll on prepend, so
    // we do it manually.
    useLayoutEffect(() => {
        if (!container.current) return;

        if (prevScrollHeight.current !== null) {
            container.current.scrollTop += container.current.scrollHeight - prevScrollHeight.current;
            prevScrollHeight.current = null;
            prevLength.current = chat.messages.length;
            return;
        }

        const grew = chat.messages.length > prevLength.current;
        prevLength.current = chat.messages.length;

        const lastMessage = chat.messages[chat.messages.length - 1];
        const sentByMe = !!lastMessage && (user?.IsUserConnectionId(lastMessage.senderId) ?? false);

        if (wasNearBottom.current || (grew && sentByMe)) {
            // Already following the conversation (or it's our own message): stay pinned.
            container.current.scrollTop = container.current.scrollHeight;
            setShowJumpButton(false);
        } else if (grew) {
            setShowJumpButton(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat.id, chat.messages.length]);

    // Initial load and auto-fill until scrollbar appears. If the chat has few messages, it feels more natural to show them all at once instead of starting in the middle and forcing the user to scroll up.
    useEffect(() => {
        if (!container.current || isLoading.current || !hasMore.current) return;
        if (container.current.scrollHeight <= container.current.clientHeight) {
            void fetchMessages(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat.id, chat.messages.length]);

    const onScroll = () => {
        if (!container.current) return;

        const distanceFromBottom =
            container.current.scrollHeight - container.current.scrollTop - container.current.clientHeight;
        wasNearBottom.current = distanceFromBottom <= BOTTOM_THRESHOLD;
        if (wasNearBottom.current) setShowJumpButton(false);

        if (isLoading.current || !hasMore.current) return;
        if (container.current.scrollTop <= SCROLL_TOP_THRESHOLD) void fetchMessages(true);
    };

    const jumpToBottom = () => {
        if (!container.current) return;
        container.current.scrollTo({ top: container.current.scrollHeight, behavior: 'smooth' });
        wasNearBottom.current = true;
        setShowJumpButton(false);
    };

    return { container: container, showJump: showJumpButton, onScroll, jumpToBottom };
}

const JumpToLatestButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 h-6 w-6">
        {/* Pulsating ring behind the button */}
        <span className="absolute inset-0 rounded-full bg-gray-500/60 animate-ping [animation-duration:2s]" />
        <button
            type="button"
            onClick={onClick}
            aria-label="Scroll to latest messages"
            className="relative flex h-6 w-6 items-center justify-center rounded-full
                bg-gray-700/90 text-white shadow-lg backdrop-blur transition hover:bg-gray-600"
        >
            <IconChevronDown className="h-3 w-3" stroke={2.5} />
        </button>
    </div>
);

const MessageList: React.FC<MessageListProps> = ({ chat }) => {
    const { user } = useUser();
    const { container, showJump, onScroll, jumpToBottom } = useChatScroll(chat);

    const isMine = (senderId: string) => user?.IsUserConnectionId(senderId) ?? false;

    return (
        <div className="relative flex-1 min-h-0">
            <div
                ref={container}
                id="scroll_chat"
                className="h-full overflow-y-auto p-4 pb-8"
                style={{ overflowAnchor: 'none' }}
                onScroll={onScroll}
            >
                {chat.messages.map((message, index) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        showStatus={shouldShowStatus(chat.messages, index, isMine)}
                    />
                ))}
            </div>

            {showJump && <JumpToLatestButton onClick={jumpToBottom} />}
        </div>
    );
};

export default MessageList;
