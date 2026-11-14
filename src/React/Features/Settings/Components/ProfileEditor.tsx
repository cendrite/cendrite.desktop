import React, { useState } from 'react';
import clsx from 'clsx';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { MediaType } from '@/Shared/Files/GetMedia.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { UserActionType } from '@/React/Context/User/UserReducer.ts';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import {
    AvatarTemplate,
    avatarTemplates,
    initialOf,
    renderAvatarTemplate,
    templateBackground,
} from '@/React/Common/Components/Avatar/AvatarTemplates.ts';
import Button from '@/React/Common/Components/Button/Button.tsx';
import { Media } from '@/React/Models/Media.ts';
import { MediaService } from '@/React/Common/Services/MediaService.ts';
import { MediaItem } from '@/React/Features/Home/Chat/MediaBox.tsx';
import { Result } from '@/Shared/Result/Result.ts';
import { UpdateAvatarCommand } from '@/Shared/User/UpdateAvatar.ts';
import { RemoveAvatarCommand } from '@/Shared/User/RemoveAvatar.ts';
import { formatUserTag } from '@/React/Common/Utilities.ts';

const updateAvatar = (avatar: Media): Promise<Result<string>> =>
    window.electron.sendRequestAsync(new UpdateAvatarCommand(avatar.content, avatar.type, 'profilePicture.png'));

const removeAvatar = (): Promise<Result> => window.electron.sendRequestAsync(new RemoveAvatarCommand());

const ProfileEditor: React.FC = () => {
    const { user, userDispatch } = useUser();
    const [pending, setPending] = useState<Media | null>(null);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    const name = user?.displayName || user?.username || '?';

    const choose = (media: Media | null) => {
        setFailed(false);
        setPending(media);
    };

    const run = async (action: () => Promise<boolean>) => {
        setBusy(true);
        setFailed(false);
        try {
            setFailed(!(await action()));
        } catch (e) {
            console.error(e);
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };

    const pickFile = async () => {
        const [media] = await new MediaService().getLocalMedia(MediaType.Image);
        if (media) choose(media);
    };

    const pickTemplate = async (template: AvatarTemplate) => {
        try {
            choose(new Media(template.id, 'image/png', await renderAvatarTemplate(initialOf(name), template)));
        } catch (e) {
            console.error(e);
        }
    };

    const save = () =>
        run(async () => {
            const result = await updateAvatar(pending!);
            if (!result.success) return false;

            userDispatch({ type: UserActionType.UpdateAvatar, payload: { AvatarKey: result.data } });
            setPending(null);
            return true;
        });

    const remove = () =>
        run(async () => {
            const result = await removeAvatar();
            if (!result.success) return false;

            userDispatch({ type: UserActionType.UpdateAvatar, payload: { AvatarKey: null } });
            return true;
        });

    return (
        <div className="mt-4 rounded-lg border border-line">
            <div className="flex items-center gap-4 px-4 py-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    {pending ? (
                        <MediaItem media={pending} className="h-full w-full object-cover" />
                    ) : (
                        <Avatar className="h-full w-full" AvatarKey={user?.avatarKey ?? null} Username={name} />
                    )}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{name}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle tabular-nums">{user ? formatUserTag(user.userTag) : null}</p>
                </div>

                <Popover className="ml-auto shrink-0">
                    <PopoverButton
                        disabled={busy}
                        className="inline-flex h-7 items-center justify-center rounded-md bg-overlay px-3 text-xs font-medium text-fg transition-colors hover:bg-overlay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[open]:bg-overlay-hover disabled:pointer-events-none disabled:opacity-50"
                    >
                        Edit picture
                    </PopoverButton>
                    <PopoverPanel
                        anchor={{ to: 'bottom end', gap: 8 }}
                        className="z-[1100] w-56 rounded-xl bg-surface p-2 shadow-lg ring-1 ring-line-strong"
                    >
                        {({ close }) => (
                            <>
                                <div className="grid grid-cols-4 gap-2 p-2">
                                    {avatarTemplates.map((template) => {
                                        const selected = pending?.id === template.id;
                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                aria-label={template.id}
                                                aria-pressed={selected}
                                                onClick={async () => {
                                                    await pickTemplate(template);
                                                    close();
                                                }}
                                                style={{ backgroundImage: templateBackground(template) }}
                                                className={clsx(
                                                    'h-10 w-10 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-surface transition focus:outline-none focus-visible:ring-accent',
                                                    selected ? 'ring-accent' : 'ring-transparent hover:ring-line',
                                                )}
                                            >
                                                <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
                                                    <text
                                                        x="50"
                                                        y="50"
                                                        textAnchor="middle"
                                                        dominantBaseline="central"
                                                        fill="rgba(255,255,255,0.95)"
                                                        fontSize={44}
                                                        fontWeight={600}
                                                    >
                                                        {initialOf(name)}
                                                    </text>
                                                </svg>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="my-1 border-t border-line" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        pickFile();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-hover"
                                >
                                    <UploadSimpleIcon className="h-4 w-4 text-fg-muted" />
                                    Upload a photo
                                </button>

                                {user?.avatarKey && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
                                            remove();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-danger-fg hover:bg-surface-hover"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Remove picture
                                    </button>
                                )}
                            </>
                        )}
                    </PopoverPanel>
                </Popover>
            </div>

            {(pending || failed) && (
                <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                    <p className={clsx('text-xs', failed ? 'text-danger-fg' : 'text-fg-subtle')}>
                        {failed ? 'That didn’t work. Try again.' : 'Preview. Save to show it to your contacts.'}
                    </p>
                    {pending && (
                        <div className="ml-auto flex gap-2">
                            <Button variant="ghost" onClick={() => choose(null)} disabled={busy}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={save} disabled={busy} className={busy ? 'cursor-wait' : undefined}>
                                Save
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileEditor;
