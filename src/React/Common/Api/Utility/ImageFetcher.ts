import {API_URLS} from "../ApiUrls.ts";

export class ImageHelper {
    public static async downloadImageAsBase64(url: string | null): Promise<string | null> {
        if (!url) return null;

        const response = await fetch(`${API_URLS.BUCKET.BUCKET_BASE}/${url}`);
        if (!response.ok) {
            console.error(`Failed to fetch image from ${url}: ${response.statusText}`);
            return null;
        }

        const blob = await response.blob();
        console.log("Blob:", blob);
        console.log("Blob type:", blob.type);
        console.log("Blob size:", blob.size);

        return await this.convertBlobToBase64(blob);
    }

    private static convertBlobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                if (reader.result && typeof reader.result === 'string') {
                    resolve(reader.result); // This is already in data:image/jpeg;base64,... format
                } else {
                    reject("Failed to convert blob to base64 string.");
                }
            };

            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}