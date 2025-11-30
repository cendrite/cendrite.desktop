export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sha256(input: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(input);

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join('');

    return hashHex;
}
