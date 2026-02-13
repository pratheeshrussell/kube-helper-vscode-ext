/**
 * Simple JSON stream parser that extracts complete JSON objects from a buffer.
 * It handles:
 * - Concatenated JSON objects (e.g. from kubectl watch)
 * - Pretty-printed JSON (multiline)
 * - JSON strings containing braces (e.g. "foo { bar }")
 * - Escaped characters inside strings
 */
export class JsonStreamParser {
    private buffer: string = '';

    /**
     * Append data to parser buffer
     */
    append(data: string): void {
        this.buffer += data;
    }

    /**
     * Extract next complete JSON object from buffer.
     * Returns null if no complete object is found.
     */
    extractNext(): any | null {
        // Optimization: trim leading whitespace
        const trimmedBuffer = this.buffer.trimStart();
        const trimOffset = this.buffer.length - trimmedBuffer.length;

        if (trimmedBuffer.length === 0) {
            this.buffer = '';
            return null;
        }

        // Only look for objects starting with '{'
        if (trimmedBuffer[0] !== '{') {
            // Find first '{'
            const startIdx = trimmedBuffer.indexOf('{');
            if (startIdx === -1) {
                // No object start found yet, keep buffer (might be partial text)
                // But if buffer gets too large without '{', maybe clear it?
                // For now, minimal logic: keep it.
                return null;
            }
            // Discard garbage before first '{'
            this.buffer = trimmedBuffer.substring(startIdx);
            return this.extractNext();
        }

        // State machine to track JSON object boundaries.
        // We MUST count braces because the input stream can be pretty-printed (multiline),
        // so we can't rely on newlines to separate objects.
        // This implementation is robust because it ignores braces inside strings.
        let braceCount = 0;
        let inString = false;
        let escaped = false;
        let endIndex = -1;

        // Scan from the start of the trimmed buffer
        for (let i = 0; i < trimmedBuffer.length; i++) {
            const char = trimmedBuffer[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endIndex = i + 1;
                        break;
                    }
                }
            }
        }

        if (endIndex !== -1) {
            const jsonStr = trimmedBuffer.substring(0, endIndex);

            // Remove parsed part from original buffer (accounting for trim)
            this.buffer = trimmedBuffer.substring(endIndex);

            try {
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error('[JsonStreamParser] Failed to parse extracted JSON:', e);
                // Return null but buffer is already advanced, so we skip bad data
                return null;
            }
        }

        return null;
    }
}
