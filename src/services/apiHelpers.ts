/**
 * Parse a Response as JSON and provide a clear error when the body is invalid.
 */
export async function parseResponse(res: Response) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (err) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Invalid JSON returned from API');
    }
}

/**
 * Common headers for API requests.
 * Authentication is handled via HttpOnly cookie (set by the backend at login).
 * We use credentials: 'include' on fetch calls to send the cookie automatically.
 * Content-Type is always application/json.
 */
export function getAuthHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
    };
}

/**
 * Returns the fetch options to always include credentials (cookies).
 * Use this as a spread: fetch(url, { ...credentialOptions, ... })
 */
export const credentialOptions: RequestInit = {
    credentials: 'include',
};
