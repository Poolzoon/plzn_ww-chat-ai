import { getAttachmentFiles, toSerializableAttachment, toSerializableMessage } from './chatModels';

const parseHeaders = headers => {
    if (!headers) return {};
    if (typeof headers === 'object') return headers;

    try {
        const parsed = JSON.parse(headers);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
        return String(headers)
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .reduce((acc, line) => {
                const index = line.indexOf(':');
                if (index > 0) acc[line.slice(0, index).trim()] = line.slice(index + 1).trim();
                return acc;
            }, {});
    }
};

export async function postChatToProxy({ endpoint, authToken, headers, model, message, messages, attachments, metadata }) {
    if (!endpoint) throw new Error('API endpoint is required for proxy mode.');

    const formData = new FormData();
    const serializableMessage = toSerializableMessage(message);
    const serializableMessages = (Array.isArray(messages) ? messages : []).map(toSerializableMessage);
    const serializableAttachments = (Array.isArray(attachments) ? attachments : []).map(toSerializableAttachment);

    formData.append('message', JSON.stringify(serializableMessage));
    formData.append('messages', JSON.stringify(serializableMessages));
    formData.append('attachments', JSON.stringify(serializableAttachments));
    formData.append('metadata', JSON.stringify(metadata || {}));
    if (model) formData.append('model', model);

    getAttachmentFiles(attachments).forEach(file => {
        formData.append('files[]', file, file.name);
    });

    const requestHeaders = parseHeaders(headers);
    if (authToken && !requestHeaders.Authorization) {
        requestHeaders.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
        const messageText =
            typeof payload === 'object' && payload !== null
                ? payload.error || payload.message || `Request failed with status ${response.status}`
                : payload || `Request failed with status ${response.status}`;
        throw new Error(messageText);
    }

    return payload;
}
