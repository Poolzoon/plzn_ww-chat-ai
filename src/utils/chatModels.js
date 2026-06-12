export const MESSAGE_ROLES = ['user', 'assistant', 'system', 'error'];
export const MESSAGE_STATUSES = ['pending', 'streaming', 'completed', 'failed'];

export const createId = (prefix = 'id') =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const isFileObject = value => typeof File !== 'undefined' && value instanceof File;

export const formatFileSize = bytes => {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size <= 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / Math.pow(1024, index);
    return `${parseFloat(value.toFixed(2))} ${units[index]}`;
};

const normalizeRole = role => (MESSAGE_ROLES.includes(role) ? role : 'assistant');
const normalizeStatus = status => (MESSAGE_STATUSES.includes(status) ? status : 'completed');

export const normalizeAttachment = attachment => {
    const source = isFileObject(attachment) ? { file: attachment } : attachment || {};
    const file = source.file && isFileObject(source.file) ? source.file : isFileObject(source) ? source : undefined;
    const fileName = source.fileName || source.name || file?.name || 'Untitled file';
    const mimeType = source.mimeType || source.type || file?.type || '';
    const size = Number(source.size ?? file?.size ?? 0);

    return {
        id: source.id || createId('file'),
        fileName,
        displayName: source.displayName || fileName,
        name: fileName,
        mimeType,
        type: mimeType,
        size,
        file,
        url: source.url || source.uploadedUrl || source.localUrl || '',
        localUrl: source.localUrl || source.url || '',
        uploadedUrl: source.uploadedUrl || source.url || '',
        storageKey: source.storageKey || source.key || '',
        status: source.status || source.uploadStatus || 'pending',
        uploadStatus: source.uploadStatus || source.status || 'pending',
        error: source.error || '',
        metadata: source.metadata || {},
    };
};

export const normalizeMessage = (message, defaults = {}) => {
    const source = message && typeof message === 'object' ? message : {};
    const createdAt = source.createdAt || source.timestamp || defaults.createdAt || new Date().toISOString();
    const role = normalizeRole(source.role || defaults.role || 'assistant');
    const content = source.content ?? source.text ?? defaults.content ?? '';
    const attachments = Array.isArray(source.attachments) ? source.attachments.map(normalizeAttachment) : [];

    return {
        id: source.id || defaults.id || createId('msg'),
        role,
        content,
        text: content,
        createdAt,
        timestamp: createdAt,
        status: normalizeStatus(source.status || defaults.status || (role === 'error' ? 'failed' : 'completed')),
        attachments,
        metadata: source.metadata || defaults.metadata || {},
        userName: source.userName || defaults.userName || '',
        error: source.error || '',
    };
};

const parseAcceptedTypes = acceptedFileTypes => {
    if (Array.isArray(acceptedFileTypes)) return acceptedFileTypes.map(type => String(type).trim()).filter(Boolean);
    return String(acceptedFileTypes || '')
        .split(',')
        .map(type => type.trim())
        .filter(Boolean);
};

const fileMatchesType = (file, acceptedType) => {
    if (!acceptedType || acceptedType === '*/*') return true;

    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const accepted = acceptedType.toLowerCase();

    if (accepted.startsWith('.')) return fileName.endsWith(accepted);
    if (accepted.endsWith('/*')) return fileType.startsWith(accepted.slice(0, -1));
    return fileType === accepted;
};

export const validateFiles = (files, currentAttachments = [], options = {}) => {
    const acceptedTypes = parseAcceptedTypes(options.acceptedFileTypes);
    const maxFiles = Math.max(0, Number(options.maxFilesPerMessage || 1));
    const maxSizeMb = Number(options.maxFileSizeMb || 10);
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    const allowMultipleFiles = options.allowMultipleFiles !== false;
    const existingCount = Array.isArray(currentAttachments) ? currentAttachments.length : 0;
    const availableSlots = allowMultipleFiles ? Math.max(maxFiles - existingCount, 0) : Math.max(1 - existingCount, 0);

    const accepted = [];
    const rejected = [];

    Array.from(files || []).forEach(file => {
        if (!isFileObject(file)) return;

        if (accepted.length >= availableSlots) {
            rejected.push({ file, error: `Only ${allowMultipleFiles ? maxFiles : 1} file(s) can be attached.` });
            return;
        }

        if (acceptedTypes.length && !acceptedTypes.some(type => fileMatchesType(file, type))) {
            rejected.push({ file, error: `${file.name} is not an accepted file type.` });
            return;
        }

        if (Number.isFinite(maxSizeBytes) && maxSizeBytes > 0 && file.size > maxSizeBytes) {
            rejected.push({ file, error: `${file.name} is larger than ${maxSizeMb} MB.` });
            return;
        }

        accepted.push(file);
    });

    return { accepted, rejected };
};

export const getAttachmentFiles = attachments =>
    (Array.isArray(attachments) ? attachments : []).map(attachment => attachment.file).filter(isFileObject);

export const toSerializableAttachment = attachment => {
    const normalized = normalizeAttachment(attachment);
    const { file, ...serializable } = normalized;
    return serializable;
};

export const toSerializableMessage = message => {
    const normalized = normalizeMessage(message);
    return {
        ...normalized,
        attachments: normalized.attachments.map(toSerializableAttachment),
    };
};
