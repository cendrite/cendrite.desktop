import { useEffect, useState } from 'react';
import { GetTamperedGroupsQuery } from '@/Shared/Chat/GetTamperedGroups';
import { useMessageEdit } from '@/React/Common/Utilities.ts';

export function useTamperedGroups(): Set<string> {
    const [groups, setGroups] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetTamperedGroupsQuery()).then((result) => {
            if (cancelled || !result.success) return;
            setGroups((current) => new Set([...current, ...result.data]));
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useMessageEdit('membershipTampered', (event) =>
        setGroups((current) => (current.has(event.groupId) ? current : new Set([...current, event.groupId]))),
    );

    return groups;
}
