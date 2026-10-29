import React, { useRef, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import TextareaAutosize from 'react-textarea-autosize';
import { MediaType } from '@/Shared/Files/GetMedia.ts';
import { ChatViewModel } from '@/React/Models/ChatViewModel';
import { Media } from '@/React/Models/Media';
import { useMessageService } from '@/React/Common/Hooks/MessageService';
import { MediaService } from '@/React/Common/Services/MediaService';
import { EmojiPicker } from '@/React/Common/Components/Emoji/EmojiPicker';
import { GifPicker } from '@/React/Common/Components/Gifs/GifPicker';
import { ShortcodeSuggestions } from '@/React/Common/Components/Emoji/ShortcodeSuggestions';
import { type TextEdit, useShortcodeAutocomplete } from '@/React/Common/Hooks/ShortcodeAutocomplete';
import { useEmojiSettings } from '@/React/Context/Emoji/EmojiSettingsContext';
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { skinTones, recordUsage } = useEmojiSettings();

    const applyEdit = ({ text, caret }: TextEdit) => {
        setMessage(text);
        requestAnimationFrame(() => textareaRef.current?.setSelectionRange(caret, caret));
    };

    const autocomplete = useShortcodeAutocomplete(applyEdit);

    // The textarea keeps its selection while the picker has focus, so emoji land at the caret.
    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? message.length;
        const end = textarea?.selectionEnd ?? message.length;
        recordUsage(emoji);
        applyEdit({ text: message.slice(0, start) + emoji + message.slice(end), caret: start + emoji.length });
    };

    const sendGif = async (id: string): Promise<boolean> => {
        const gif = await mediaService.getGif(id);
        if (!gif) return false;
        await sendMessage(chat, null, [gif]);
        return true;
    };

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
                <Popover>
                    <PopoverButton
                        className="p-2 rounded-md hover:bg-surface-hover focus:outline-none data-[open]:bg-surface-hover"
                        aria-label="Emoji"
                    >
                        <SmileyIcon className="h-5 w-5 text-fg-muted" />
                    </PopoverButton>
                    <PopoverPanel
                        anchor={{ to: 'top start', gap: 8 }}
                        className="z-[1100] rounded-xl bg-surface shadow-lg ring-1 ring-line-strong overflow-hidden"
                    >
                        {({ close }) => (
                            <TabGroup>
                                <TabList className="flex gap-1 border-b border-line px-2 pt-2">
                                    {['Emoji', 'GIFs'].map((label) => (
                                        <Tab
                                            key={label}
                                            className="rounded-t-md px-3 py-1.5 text-sm text-fg-subtle focus:outline-none
                                                data-[hover]:text-fg-muted data-[selected]:bg-surface-hover data-[selected]:text-fg"
                                        >
                                            {label}
                                        </Tab>
                                    ))}
                                </TabList>
                                {/* Panels unmount when hidden, so GIPHY is only contacted once the GIF tab is opened. */}
                                <TabPanels>
                                    <TabPanel>
                                        <EmojiPicker onEmojiSelect={insertEmoji} />
                                    </TabPanel>
                                    <TabPanel>
                                        <GifPicker
                                            onGifSelect={async (gif) => {
                                                const sent = await sendGif(gif.id);
                                                if (sent) close();
                                                return sent;
                                            }}
                                        />
                                    </TabPanel>
                                </TabPanels>
                            </TabGroup>
                        )}
                    </PopoverPanel>
                </Popover>

                <div className="relative flex-1 bg-field rounded-3xl px-3 py-2">
                    <ShortcodeSuggestions
                        matches={autocomplete.matches}
                        activeIndex={autocomplete.activeIndex}
                        skinTones={skinTones}
                        onHover={autocomplete.setActiveIndex}
                        onSelect={(index) => autocomplete.accept(message, index)}
                    />
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
                        ref={textareaRef}
                        className="w-full bg-transparent text-fg resize-none focus:outline-none"
                        minRows={1}
                        maxRows={5}
                        placeholder={placeholderText}
                        onFocus={() => setPlaceholderText('')}
                        onBlur={() => setPlaceholderText('message')}
                        value={message}
                        onChange={(e) => {
                            const { value, selectionStart } = e.target;
                            if (!autocomplete.handleChange(value, selectionStart)) setMessage(value);
                        }}
                        onSelect={(e) =>
                            autocomplete.updateQuery(e.currentTarget.value, e.currentTarget.selectionStart)
                        }
                        onKeyDown={(e) => {
                            if (autocomplete.handleKeyDown(e)) return;
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
