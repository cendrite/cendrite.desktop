import { DeliveryStatus } from '../../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { MessageViewModel } from '../../../Models/MessageViewModel.ts';
import {
    IconCircleDashed,
    IconCircleChevronRight,
    IconCircleChevronsRight,
    IconCircleChevronsRightFilled,
    IconCircleX
} from '@tabler/icons-react';
import React from 'react';

export interface ChatBubbleProps {
    message: MessageViewModel;
}

function statusIcon(status: DeliveryStatus): React.ReactElement {
    switch (status) {
        case DeliveryStatus.Pending:
            return <IconCircleDashed className="w-3.5 h-3.5 text-gray-300" />;
        case DeliveryStatus.Sent:
            return <IconCircleChevronRight className="w-3.5 h-3.5 text-gray-400" />;
        case DeliveryStatus.Delivered:
            return <IconCircleChevronsRight className="w-3.5 h-3.5 text-gray-300" />;
        case DeliveryStatus.Read:
            return <IconCircleChevronsRightFilled className="w-3.5 h-3.5 text-gray-200" />;
        case DeliveryStatus.Failed:
            return <IconCircleX className="w-3.5 h-3.5 text-red-500" />;
        case DeliveryStatus.Received:
        default:
            throw new Error('Invalid delivery status for icon');
    }
}

export const MessageBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const { user } = useUser();
    const isMine = message.senderId === user!.connectionId || user!.externalConnectionIds.includes(message.senderId);
    const icon = isMine ? statusIcon(message.deliveryStatus) : null;

    return (
        <>
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                <div
                    className={`
                        break-words whitespace-pre-wrap px-4 py-2 rounded-2xl text-sm
                        ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}
                        max-w-[75%] sm:max-w-[60%] md:max-w-[50%]
                    `}
                >
                    {message.text}
                </div>
            </div>

            {isMine && icon && <div className="flex justify-end mb-1.5 mr-1.5">{icon}</div>}
        </>
    );
};

export default MessageBubble;
