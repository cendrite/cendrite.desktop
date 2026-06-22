import { FaceSmileIcon, MicrophoneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import {
    GetMediaQuery,
    MediaType,
} from '../../../../Electron/Application/Features/Files/Queries/GetMedia/GetMediaQuery';
import { MediaDto } from '../../../../Electron/Application/Features/Chat/Dtos/MediaDto';
import { Result } from '../../../../Shared/Result/Result';
import { ChatViewModel } from '../../../Models/ChatViewModel';
import { Media } from '../../../Models/Media';
import { useMessageService } from '../../../Common/Hooks/MessageService';

interface ChatBarProps {
    chat: ChatViewModel;
}

const MediaPreview: React.FC<{ media: Media; onRemove: () => void }> = ({ media, onRemove }) => {
    const isVideo = media.type.startsWith('video/');
    return (
        <div className="relative mb-2 inline-block">
            {isVideo ? (
                <video src={media.url} className="max-h-40 rounded-lg" controls />
            ) : (
                <img src={media.url} alt="preview" className="max-h-40 rounded-lg" />
            )}
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
    const [placeholderText, setPlaceholderText] = useState('message');
    const [media, setMedia] = useState<Media[]>([]);
    const [message, setMessage] = useState<string>('');

    const handleImpageUpload = async () => {
        console.log('Uploading image...');
        const result = await window.electron.sendRequestAsync<Result<MediaDto[]>>(
            new GetMediaQuery(MediaType.All),
        );
        if (result.success) {
            setMedia((prev) => [...prev, ...result.data!]);
        } else {
            console.error('Failed to upload image');
        }
    };

    const onSendMessage = async (text: string): Promise<void> => {
        if (!text.trim() && media.length === 0) return;
        await sendMessage(chat, text.trim() ? text : null, media);
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
                    {media.map((m, index) => (
                        <MediaPreview
                            key={index}
                            media={m}
                            onRemove={() => setMedia((prev) => prev.filter((_, i) => i !== index))}
                        />
                    ))}
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
                                onSendMessage(message);
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
