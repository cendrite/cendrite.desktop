export function generateAddressId(connectionId: string): number {
    let h = 0;
    for (let i = 0; i < connectionId.length; i++) {
        h = (h * 31 + connectionId.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

export function fromBase64(str: string): ArrayBuffer {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

export function convertToBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
}

