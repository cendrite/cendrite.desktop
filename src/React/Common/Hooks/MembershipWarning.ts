import { useEffect, useState } from 'react';
import { GetMembershipWarningQuery } from '@/Shared/Chat/GetMembershipWarning';
import { MembershipWarning } from '@/Shared/Enums/MembershipWarning';
import { useMessageEdit } from '@/React/Common/Utilities.ts';

export function useMembershipWarning(groupId: string): MembershipWarning | null {
    const [warning, setWarning] = useState<MembershipWarning | null>(null);

    useEffect(() => {
        let cancelled = false;
        setWarning(null);

        window.electron.sendRequestAsync(new GetMembershipWarningQuery(groupId)).then((result) => {
            if (cancelled || !result.success) return;
            setWarning(result.data);
        });

        return () => {
            cancelled = true;
        };
    }, [groupId]);

    useMessageEdit('membershipWarning', (event) => {
        if (event.groupId === groupId) setWarning(event.warning);
    });

    return warning;
}
