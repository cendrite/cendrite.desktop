import { useEffect, useState } from 'react';
import { GetGroupEditableQuery } from '@/Shared/Chat/GetGroupEditable';
import { useMessageEdit } from '@/React/Common/Utilities.ts';

export function useGroupEditable(groupId: string): boolean {
    const [editable, setEditable] = useState(false);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        setEditable(false);
    }, [groupId]);

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetGroupEditableQuery(groupId)).then((result) => {
            if (cancelled || !result.success) return;
            setEditable(result.data);
        });

        return () => {
            cancelled = true;
        };
    }, [groupId, revision]);

    const refresh = (event: { groupId: string }) => {
        if (event.groupId === groupId) setRevision((current) => current + 1);
    };

    useMessageEdit('groupEditable', refresh);
    useMessageEdit('groupChanged', refresh);

    return editable;
}
