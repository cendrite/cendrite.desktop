import { useEffect, useState } from 'react';
import { GetGroupEditableQuery } from '@/Shared/Chat/GetGroupEditable';
import { useMessageEdit } from '@/React/Common/Utilities.ts';

export function useGroupEditable(groupId: string): boolean {
    const [editable, setEditable] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setEditable(false);

        window.electron.sendRequestAsync(new GetGroupEditableQuery(groupId)).then((result) => {
            if (cancelled || !result.success) return;
            setEditable(result.data);
        });

        return () => {
            cancelled = true;
        };
    }, [groupId]);

    useMessageEdit('groupEditable', (event) => {
        if (event.groupId === groupId) setEditable(true);
    });

    return editable;
}
