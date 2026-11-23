import { useEffect, useState } from 'react';
import { GetGroupPrivilegeQuery } from '@/Shared/Chat/GetGroupPrivilege';
import { ChatPrivileges } from '@/Shared/Enums/ChatPrivileges';
import { useMessageEdit } from '@/React/Common/Utilities.ts';

export function useGroupPrivilege(groupId: string): ChatPrivileges {
    const [privilege, setPrivilege] = useState(ChatPrivileges.None);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        setPrivilege(ChatPrivileges.None);
    }, [groupId]);

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetGroupPrivilegeQuery(groupId)).then((result) => {
            if (cancelled || !result.success) return;
            setPrivilege(result.data);
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

    return privilege;
}
