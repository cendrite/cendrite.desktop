import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { MediaType } from '../../../../Shared/Files/GetMedia.ts';
import { ChatViewModel } from '../../../Models/ChatViewModel';
import { Media } from '../../../Models/Media';
import { useMessageService } from '../../../Common/Hooks/MessageService';
import { MediaService } from '../../../Common/Services/MediaService';
import { MediaItem } from './MediaBox';
import { MicrophoneIcon, PaperclipIcon, SmileyIcon, XIcon } from '@phosphor-icons/react';

interface ChatBarProps {
    chat: ChatViewModel;
}

const MediaPreview: React.FC<{ media: Media; onRemove: () => void }> = ({ media, onRemove }) => {
    return (
        <div className="relative inline-block">
            <MediaItem media={media} className="h-64 w-64 object-cover rounded-lg" />
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-field rounded-full p-1 hover:bg-surface-hover"
            >
                <XIcon className="h-4 w-4 text-fg-muted" />
            </button>
        </div>
    );
};

export const ChatBar: React.FC<ChatBarProps> = ({ chat }) => {
    const { sendMessage } = useMessageService();
    const mediaService = new MediaService();
    const [placeholderText, setPlaceholderText] = useState('message');
    const [media, setMedia] = useState<Media[]>([]);
    const [message, setMessage] = useState<string>('');

    const handleImpageUpload = async () => {
        const selected = await mediaService.getLocalMedia(MediaType.All);
        setMedia((prev) => [...prev, ...selected]);
    };

    const onSendMessage = async (): Promise<void> => {
        if (!message.trim() && media.length === 0) return;
        await sendMessage(chat, message.trim() ? message : null, media);
        setMessage('');
        setMedia([]);
    };

    return (
        <div className="bg-canvas p-3">
            <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md hover:bg-surface-hover">
                    <SmileyIcon className="h-5 w-5 text-fg-muted" />
                </button>

                <div className="flex-1 bg-field rounded-3xl px-3 py-2">
                    {media.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {media.map((m, index) => (
                                <MediaPreview
                                    key={index}
                                    media={m}
                                    onRemove={() => setMedia((prev) => prev.filter((_, i) => i !== index))}
                                />
                            ))}
                        </div>
                    )}
                    <TextareaAutosize
                        className="w-full bg-transparent text-fg resize-none focus:outline-none"
                        minRows={1}
                        maxRows={5}
                        placeholder={placeholderText}
                        onFocus={() => setPlaceholderText('')}
                        onBlur={() => setPlaceholderText('message')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSendMessage();
                            }
                        }}
                    />
                </div>

                <button className="p-2 rounded-md hover:bg-surface-hover">
                    <PaperclipIcon
                        className="h-5 w-5 text-fg-muted"
                        onClick={() => {
                            handleImpageUpload();
                        }}
                    />
                </button>

                <button className="p-2 rounded-md hover:bg-surface-hover">
                    <MicrophoneIcon className="h-5 w-5 text-fg-muted" />
                </button>
            </div>
        </div>
    );
};

export default ChatBar;
