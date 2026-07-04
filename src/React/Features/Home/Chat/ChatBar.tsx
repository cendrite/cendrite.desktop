import { FaceSmileIcon, MicrophoneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { MediaType } from '../../../../Electron/Application/Features/Files/Queries/GetMedia/GetMediaQuery';
import { ChatViewModel } from '../../../Models/ChatViewModel';
import { Media } from '../../../Models/Media';
import { useMessageService } from '../../../Common/Hooks/MessageService';
import { MediaService } from '../../../Common/Services/MediaService';
import { MediaItem } from './MediaBox';

interface ChatBarProps {
    chat: ChatViewModel;
}

const MediaPreview: React.FC<{ media: Media; onRemove: () => void }> = ({ media, onRemove }) => {
    return (
        <div className="relative inline-block">
            <MediaItem media={media} className="h-64 w-64 object-cover rounded-lg" />
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 hover:bg-darkGray-300"
            >
                <XMarkIcon className="h-4 w-4 text-gray-200" />
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
        <div className="bg-zinc-950 p-3">
            <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md hover:bg-darkGray-300">
                    <FaceSmileIcon className="h-5 w-5 text-gray-200" />
                </button>

                <div className="flex-1 bg-darkGray-700 rounded-3xl px-3 py-2">
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
                        className="w-full bg-transparent text-white resize-none focus:outline-none"
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

                <button className="p-2 rounded-md hover:bg-darkGray-300">
                    <PaperClipIcon
                        className="h-5 w-5 text-gray-200"
                        onClick={() => {
                            handleImpageUpload();
                        }}
                    />
                </button>

                <button className="p-2 rounded-md hover:bg-darkGray-300">
                    <MicrophoneIcon className="h-5 w-5 text-gray-200" />
                </button>
            </div>
        </div>
    );
};

export default ChatBar;
