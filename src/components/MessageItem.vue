<template>
    <article
        class="ww-message-item"
        :class="[
            `ww-message-item--${message.role}`,
            { 'ww-message-item--own': isOwnMessage, 'ww-message-item--failed': message.status === 'failed' },
        ]"
    >
        <div class="ww-message-item__content" :style="messageStyles" @contextmenu.prevent="handleRightClick">
            <div v-if="senderDisplayName" class="ww-message-item__sender">{{ senderDisplayName }}</div>

            <div v-if="message.content" class="ww-message-item__body">
                <div v-if="enableMarkdown" class="ww-message-item__text ww-message-item__text--markdown" v-html="renderedMarkdown"></div>
                <div v-else class="ww-message-item__text">{{ message.content }}</div>
            </div>

            <div v-if="formattedAttachments.length" class="ww-message-item__attachments">
                <button
                    v-for="attachment in formattedAttachments"
                    :key="attachment.id"
                    type="button"
                    class="ww-message-item__attachment"
                    @click="$emit('attachment-click', attachment.raw)"
                >
                    <img
                        v-if="showFilePreviews && attachment.isImage && attachment.previewUrl"
                        class="ww-message-item__attachment-image"
                        :src="attachment.previewUrl"
                        :alt="attachment.displayName"
                    />
                    <span v-else class="ww-message-item__attachment-icon">FILE</span>
                    <span class="ww-message-item__attachment-info">
                        <span class="ww-message-item__attachment-name">{{ attachment.displayName }}</span>
                        <span class="ww-message-item__attachment-meta">
                            {{ attachment.mimeType || 'file' }} - {{ attachment.formattedSize }}
                        </span>
                        <span v-if="attachment.status" class="ww-message-item__attachment-status">
                            {{ attachment.status }}
                        </span>
                        <span v-if="attachment.error" class="ww-message-item__attachment-error">{{ attachment.error }}</span>
                    </span>
                </button>
            </div>

            <div class="ww-message-item__footer">
                <span v-if="showTimestamp" class="ww-message-item__time">{{ formattedTime }}</span>
                <span v-if="message.status && message.status !== 'completed'" class="ww-message-item__status">
                    {{ message.status }}
                </span>
                <button v-if="enableCopyButton && message.content" type="button" class="ww-message-item__action" @click="$emit('copy-message', message)">
                    Copy
                </button>
                <button v-if="showRetryAction" type="button" class="ww-message-item__action" @click="$emit('retry-message', message)">
                    Retry
                </button>
            </div>
        </div>
    </article>
</template>

<script>
import { computed, inject } from 'vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { formatFileSize } from '../utils/chatModels';
import { formatTime } from '../utils/dateTimeFormatter';

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    highlight(str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value;
            } catch (_) {
                return '';
            }
        }
        return '';
    },
});

export default {
    name: 'MessageItem',
    props: {
        message: { type: Object, required: true },
        isOwnMessage: { type: Boolean, default: false },
        enableMarkdown: { type: Boolean, default: true },
        enableCopyButton: { type: Boolean, default: true },
        enableRetryButton: { type: Boolean, default: true },
        showFilePreviews: { type: Boolean, default: true },
        messageShowTimestamp: { type: Boolean, default: true },
        ownMessageShowTimestamp: { type: Boolean, default: true },
        messageBgColor: { type: String, default: 'transparent' },
        messageTextColor: { type: String, default: '#1f2937' },
        messageFontSize: { type: String, default: '0.9375rem' },
        messageFontWeight: { type: String, default: '400' },
        messageFontFamily: { type: String, default: 'inherit' },
        messageBorder: { type: String, default: 'none' },
        messageRadius: { type: String, default: '8px' },
        ownMessageBgColor: { type: String, default: '#f3f4f6' },
        ownMessageTextColor: { type: String, default: '#111827' },
        ownMessageFontSize: { type: String, default: '0.9375rem' },
        ownMessageFontWeight: { type: String, default: '400' },
        ownMessageFontFamily: { type: String, default: 'inherit' },
        ownMessageBorder: { type: String, default: '1px solid #e5e7eb' },
        ownMessageRadius: { type: String, default: '18px' },
        userLabel: { type: String, default: 'You' },
        assistantLabel: { type: String, default: 'Assistant' },
    },
    emits: ['attachment-click', 'right-click', 'copy-message', 'retry-message'],
    setup(props, { emit }) {
        const chatRootEl = inject('chatRootEl', null);

        const senderDisplayName = computed(() => {
            if (props.message.role === 'system' || props.message.role === 'error') return '';
            if (props.isOwnMessage) return props.userLabel;
            return props.message.userName || props.assistantLabel;
        });

        const showTimestamp = computed(() =>
            props.isOwnMessage ? props.ownMessageShowTimestamp : props.messageShowTimestamp
        );

        const formattedTime = computed(() => formatTime(props.message.createdAt || props.message.timestamp));
        const renderedMarkdown = computed(() => (props.message.content ? md.render(props.message.content) : ''));

        const messageStyles = computed(() => {
            if (props.message.role === 'error') {
                return {
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    '--message-radius': '8px',
                };
            }

            if (props.message.role === 'system') {
                return {
                    backgroundColor: '#f9fafb',
                    color: '#4b5563',
                    border: '1px solid #e5e7eb',
                    '--message-radius': '8px',
                };
            }

            if (props.isOwnMessage) {
                return {
                    backgroundColor: props.ownMessageBgColor,
                    color: props.ownMessageTextColor,
                    fontSize: props.ownMessageFontSize,
                    fontWeight: props.ownMessageFontWeight,
                    fontFamily: props.ownMessageFontFamily,
                    border: props.ownMessageBorder,
                    '--message-radius': props.ownMessageRadius,
                };
            }

            return {
                backgroundColor: props.messageBgColor,
                color: props.messageTextColor,
                fontSize: props.messageFontSize,
                fontWeight: props.messageFontWeight,
                fontFamily: props.messageFontFamily,
                border: props.messageBorder,
                '--message-radius': props.messageRadius,
            };
        });

        const formattedAttachments = computed(() =>
            (Array.isArray(props.message.attachments) ? props.message.attachments : []).map(attachment => {
                const mimeType = attachment.mimeType || attachment.type || '';
                return {
                    id: attachment.id,
                    raw: attachment,
                    displayName: attachment.displayName || attachment.fileName || attachment.name || 'Untitled file',
                    mimeType,
                    formattedSize: formatFileSize(attachment.size),
                    status: attachment.status || attachment.uploadStatus || '',
                    error: attachment.error || '',
                    isImage: mimeType.startsWith('image/'),
                    previewUrl: attachment.localUrl || attachment.url || attachment.uploadedUrl || '',
                };
            })
        );

        const showRetryAction = computed(
            () => props.enableRetryButton && ['failed', 'error'].includes(props.message.status || props.message.role)
        );

        const handleRightClick = event => {
            const root = chatRootEl?.value;
            const rect = root?.getBoundingClientRect?.();
            emit('right-click', {
                message: props.message,
                position: {
                    elementX: rect ? event.clientX - rect.left : event.clientX,
                    elementY: rect ? event.clientY - rect.top : event.clientY,
                    viewportX: event.pageX,
                    viewportY: event.pageY,
                },
            });
        };

        return {
            senderDisplayName,
            showTimestamp,
            formattedTime,
            renderedMarkdown,
            messageStyles,
            formattedAttachments,
            showRetryAction,
            handleRightClick,
        };
    },
};
</script>

<style lang="scss" scoped>
.ww-message-item {
    display: flex;
    width: 100%;

    &--own {
        justify-content: flex-end;
    }

    &--assistant,
    &--system,
    &--error {
        justify-content: flex-start;
    }

    &__content {
        max-width: min(78%, 760px);
        padding: 10px 12px;
        border-radius: var(--message-radius, 8px);
    }

    &--assistant &__content {
        padding-left: 0;
        padding-right: 0;
    }

    &__sender {
        margin-bottom: 4px;
        color: #6b7280;
        font-size: 0.75rem;
        font-weight: 600;
    }

    &__text {
        white-space: pre-line;
        line-height: 1.55;
        word-break: break-word;

        &--markdown {
            white-space: normal;

            :deep(p) {
                margin: 0 0 0.65em;

                &:last-child {
                    margin-bottom: 0;
                }
            }

            :deep(pre) {
                margin: 0.75em 0;
                padding: 12px;
                overflow-x: auto;
                border-radius: 8px;
                background: #111827;
                color: #f9fafb;
            }

            :deep(code) {
                padding: 0.1em 0.25em;
                border-radius: 4px;
                background: #f3f4f6;
                font-family: Consolas, Monaco, monospace;
                font-size: 0.9em;
            }

            :deep(pre code) {
                padding: 0;
                background: transparent;
                color: inherit;
            }

            :deep(a) {
                color: #2563eb;
                text-decoration: underline;
            }

            :deep(ul),
            :deep(ol) {
                margin: 0.5em 0;
                padding-left: 1.5em;
            }
        }
    }

    &__attachments {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 10px;
    }

    &__attachment {
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 320px;
        padding: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        color: #111827;
        cursor: pointer;
        text-align: left;
    }

    &__attachment-image {
        width: 56px;
        height: 56px;
        flex-shrink: 0;
        border-radius: 6px;
        object-fit: cover;
    }

    &__attachment-icon {
        display: inline-flex;
        width: 44px;
        height: 44px;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 6px;
        background: #f3f4f6;
        color: #4b5563;
        font-size: 0.65rem;
        font-weight: 700;
    }

    &__attachment-info {
        display: flex;
        min-width: 0;
        flex-direction: column;
    }

    &__attachment-name,
    &__attachment-meta,
    &__attachment-status,
    &__attachment-error {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__attachment-name {
        font-size: 0.8125rem;
        font-weight: 600;
    }

    &__attachment-meta,
    &__attachment-status {
        color: #6b7280;
        font-size: 0.75rem;
    }

    &__attachment-error {
        color: #b91c1c;
        font-size: 0.75rem;
    }

    &__footer {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
        color: #6b7280;
        font-size: 0.75rem;
    }

    &__status {
        text-transform: capitalize;
    }

    &__action {
        border: 0;
        background: transparent;
        color: #4b5563;
        cursor: pointer;
        font: inherit;
        text-decoration: underline;
    }
}
</style>
