<template>
    <div class="ww-message-list">
        <div v-if="!messages.length && !isLoading" class="ww-message-list__empty">
            <div class="ww-message-list__empty-message" :style="{ color: emptyMessageColor }">
                {{ emptyMessageText }}
            </div>
        </div>

        <MessageItem
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :is-own-message="message.role === 'user'"
            :enable-markdown="enableMarkdown && message.role === 'assistant'"
            :enable-copy-button="enableCopyButton"
            :enable-retry-button="enableRetryButton"
            :show-file-previews="showFilePreviews"
            :message-show-timestamp="messageShowTimestamp"
            :own-message-show-timestamp="ownMessageShowTimestamp"
            :message-bg-color="messageBgColor"
            :message-text-color="messageTextColor"
            :message-font-size="messageFontSize"
            :message-font-weight="messageFontWeight"
            :message-font-family="messageFontFamily"
            :message-border="messageBorder"
            :message-radius="messageRadius"
            :own-message-bg-color="ownMessageBgColor"
            :own-message-text-color="ownMessageTextColor"
            :own-message-font-size="ownMessageFontSize"
            :own-message-font-weight="ownMessageFontWeight"
            :own-message-font-family="ownMessageFontFamily"
            :own-message-border="ownMessageBorder"
            :own-message-radius="ownMessageRadius"
            :user-label="userLabel"
            :assistant-label="assistantLabel"
            @attachment-click="$emit('attachment-click', $event)"
            @right-click="$emit('message-right-click', $event)"
            @copy-message="$emit('copy-message', $event)"
            @retry-message="$emit('retry-message', $event)"
        />

        <div v-if="isLoading" class="ww-message-list__loading">
            <span class="ww-message-list__loading-dot"></span>
            <span>{{ loadingText }}</span>
        </div>

        <div v-if="errorText" class="ww-message-list__error">{{ errorText }}</div>
    </div>
</template>

<script>
import MessageItem from './MessageItem.vue';

export default {
    name: 'MessageList',
    components: {
        MessageItem,
    },
    props: {
        messages: { type: Array, default: () => [] },
        isLoading: { type: Boolean, default: false },
        loadingText: { type: String, default: 'Thinking...' },
        errorText: { type: String, default: '' },
        enableMarkdown: { type: Boolean, default: true },
        enableCopyButton: { type: Boolean, default: true },
        enableRetryButton: { type: Boolean, default: true },
        showFilePreviews: { type: Boolean, default: true },
        userLabel: { type: String, default: 'You' },
        assistantLabel: { type: String, default: 'Assistant' },
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
        emptyMessageText: { type: String, default: 'Ask anything to get started.' },
        emptyMessageColor: { type: String, default: '#6b7280' },
    },
    emits: ['attachment-click', 'message-right-click', 'copy-message', 'retry-message'],
};
</script>

<style lang="scss" scoped>
.ww-message-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 920px;
    min-height: 100%;
    margin: 0 auto;

    &__empty {
        display: flex;
        min-height: 180px;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    &__empty-message {
        font-size: 0.9375rem;
    }

    &__loading,
    &__error {
        align-self: flex-start;
        max-width: 78%;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 0.875rem;
    }

    &__loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #4b5563;
        background: #f9fafb;
    }

    &__loading-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #111827;
        animation: ww-chat-pulse 1s ease-in-out infinite;
    }

    &__error {
        color: #991b1b;
        background: #fef2f2;
        border: 1px solid #fecaca;
    }
}

@keyframes ww-chat-pulse {
    0%,
    100% {
        opacity: 0.35;
    }
    50% {
        opacity: 1;
    }
}
</style>
