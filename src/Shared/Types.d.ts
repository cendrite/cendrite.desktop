type User = {
    id: string;
    name: string;
    username: string;
    userTag: string;
    email: string;
}

type Friend = {
    id: string | null;
    username: string;
    userTag: string;
    connectionId: string;
}