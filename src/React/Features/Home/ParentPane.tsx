import React from 'react';
import ContactsPane from './Contact/ContactsPane';
import ChatsPane from './Chat/ChatsPane';

interface ParentPaneProps {
    paneType: 'chats' | 'contacts';
}

export const ParentPane: React.FC<ParentPaneProps> = ({ paneType }) => {
    return (
        <div className="bg-surface h-full border-r border-line transition-all duration-300 min-w-[275px]">
            {paneType === 'chats' ? <ChatsPane /> : <ContactsPane />}
        </div>
    );
};

export default ParentPane;
