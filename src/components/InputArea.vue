<template>
    <div class="ww-chat-input-area">
        <div v-if="pendingAttachments.length" class="ww-chat-input-area__attachments">
            <button
                v-for="(attachment, index) in pendingAttachments"
                :key="attachment.id || index"
                type="button"
                class="ww-chat-input-area__attachment"
                @click="onPendingAttachmentClick(attachment, index)"
            >
                <span class="ww-chat-input-area__attachment-icon" aria-hidden="true">FILE</span>
                <span class="ww-chat-input-area__attachment-info">
                    <span class="ww-chat-input-area__attachment-name">{{ attachment.displayName || attachment.fileName }}</span>
                    <span class="ww-chat-input-area__attachment-meta">
                        {{ attachment.mimeType || attachment.type || 'file' }} - {{ formatFileSize(attachment.size) }}
                        <span v-if="attachment.status" class="ww-chat-input-area__attachment-status">
                            - {{ attachment.status }}
                        </span>
                    </span>
                    <span v-if="attachment.error" class="ww-chat-input-area__attachment-error">{{ attachment.error }}</span>
                </span>
                <span
                    type="button"
                    class="ww-chat-input-area__attachment-remove"
                    :style="{ color: removeIconColor }"
                    @click.stop="removeAttachment(index)"
                >
                    <span
                        class="ww-chat-input-area__icon"
                        :style="{ width: removeIconSize, height: removeIconSize }"
                        v-html="removeIconHtml"
                    ></span>
                </span>
            </button>
        </div>

        <div v-if="fileError" class="ww-chat-input-area__error">{{ fileError }}</div>

        <div class="ww-chat-input-area__row">
            <label
                v-if="allowAttachments"
                class="ww-chat-input-area__icon-button"
                :class="{ 'ww-chat-input-area__icon-button--disabled': isUiDisabled || isLoading }"
                :style="attachmentButtonStyle"
                title="Attach files"
            >
                <input
                    class="ww-chat-input-area__file-input"
                    type="file"
                    :accept="acceptedFileTypes"
                    :multiple="allowMultipleFiles"
                    :disabled="isUiDisabled || isLoading"
                    @change="handleAttachment"
                />
                <span
                    class="ww-chat-input-area__icon"
                    :style="{ width: attachmentIconSize, height: attachmentIconSize }"
                    v-html="attachmentIconHtml"
                ></span>
            </label>

            <textarea
                ref="textareaRef"
                v-model="inputValue"
                class="ww-chat-input-area__input"
                :placeholder="placeholder"
                :disabled="isUiDisabled || isLoading"
                :style="inputStyles"
                rows="1"
                @keydown.enter="onEnterPress"
            ></textarea>

            <button
                v-if="enableClearButton"
                type="button"
                class="ww-chat-input-area__clear"
                :disabled="isUiDisabled || isLoading"
                title="Clear conversation"
                @click="$emit('clear')"
            >
                Clear
            </button>

            <button
                type="button"
                class="ww-chat-input-area__send"
                :class="{ 'ww-chat-input-area__send--loading': isLoading }"
                :disabled="!canSend || isUiDisabled || isLoading"
                :style="sendButtonStyle"
                :title="isLoading ? loadingText : 'Send message'"
                @click="sendMessage"
            >
                <span v-if="isLoading" class="ww-chat-input-area__spinner" aria-hidden="true"></span>
                <span
                    v-else
                    class="ww-chat-input-area__icon"
                    :style="{ width: sendIconSize, height: sendIconSize }"
                    v-html="sendIconHtml"
                ></span>
            </button>
        </div>
    </div>
</template>

<script>
import { computed, inject, ref, watch, watchEffect } from 'vue';
import { formatFileSize } from '../utils/chatModels';

export default {
    name: 'InputArea',
    props: {
        modelValue: { type: String, default: '' },
        isDisabled: { type: Boolean, default: false },
        isLoading: { type: Boolean, default: false },
        allowAttachments: { type: Boolean, default: true },
        allowMultipleFiles: { type: Boolean, default: true },
        acceptedFileTypes: { type: String, default: '' },
        pendingAttachments: { type: Array, default: () => [] },
        fileError: { type: String, default: '' },
        placeholder: { type: String, default: 'Message...' },
        loadingText: { type: String, default: 'Thinking...' },
        enableClearButton: { type: Boolean, default: true },
        inputBgColor: { type: String, default: '#ffffff' },
        inputTextColor: { type: String, default: '#111827' },
        inputFontSize: { type: String, default: '0.9375rem' },
        inputFontWeight: { type: String, default: '400' },
        inputFontFamily: { type: String, default: 'inherit' },
        inputPlaceholderColor: { type: String, default: '#9ca3af' },
        inputAreaBorder: { type: String, default: '1px solid #e5e7eb' },
        textareaBorder: { type: String, default: '1px solid #d1d5db' },
        textareaBorderHover: { type: String, default: '1px solid #9ca3af' },
        textareaBorderFocus: { type: String, default: '1px solid #111827' },
        inputHeight: { type: String, default: '44px' },
        inputBorderRadius: { type: String, default: '12px' },
        sendIcon: { type: String, default: 'send' },
        sendIconColor: { type: String, default: '#ffffff' },
        sendIconSize: { type: String, default: '18px' },
        attachmentIcon: { type: String, default: 'paperclip' },
        attachmentIconColor: { type: String, default: '#374151' },
        attachmentIconSize: { type: String, default: '18px' },
        removeIcon: { type: String, default: 'x' },
        removeIconColor: { type: String, default: '#374151' },
        removeIconSize: { type: String, default: '14px' },
        sendButtonBgColor: { type: String, default: '#111827' },
        sendButtonHoverBgColor: { type: String, default: '#374151' },
        sendButtonBorder: { type: String, default: 'none' },
        sendButtonBorderRadius: { type: String, default: '12px' },
        sendButtonSize: { type: String, default: '42px' },
    },
    emits: ['update:modelValue', 'send', 'attachment', 'remove-attachment', 'pending-attachment-click', 'clear'],
    setup(props, { emit }) {
        const isEditing = inject(
            'isEditing',
            computed(() => false)
        );
        const textareaRef = ref(null);
        const inputValue = ref(props.modelValue);
        const sendIconText = ref(null);
        const attachmentIconText = ref(null);
        const removeIconText = ref(null);
        const { getIcon } = wwLib.useIcons();

        const defaultIcons = {
            send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
            attachment:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
            remove:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        };

        watchEffect(async () => {
            try {
                sendIconText.value = props.sendIcon ? await getIcon(props.sendIcon) : null;
            } catch (_) {
                sendIconText.value = null;
            }
        });

        watchEffect(async () => {
            try {
                attachmentIconText.value = props.attachmentIcon ? await getIcon(props.attachmentIcon) : null;
            } catch (_) {
                attachmentIconText.value = null;
            }
        });

        watchEffect(async () => {
            try {
                removeIconText.value = props.removeIcon ? await getIcon(props.removeIcon) : null;
            } catch (_) {
                removeIconText.value = null;
            }
        });

        watch(
            () => props.modelValue,
            value => {
                inputValue.value = value;
            }
        );

        watch(inputValue, value => emit('update:modelValue', value));

        const isUiDisabled = computed(() => props.isDisabled || isEditing.value);
        const canSend = computed(() => inputValue.value.trim().length > 0 || props.pendingAttachments.length > 0);
        const sendIconHtml = computed(() => sendIconText.value || defaultIcons.send);
        const attachmentIconHtml = computed(() => attachmentIconText.value || defaultIcons.attachment);
        const removeIconHtml = computed(() => removeIconText.value || defaultIcons.remove);

        const inputStyles = computed(() => ({
            backgroundColor: props.inputBgColor,
            color: props.inputTextColor,
            fontSize: props.inputFontSize,
            fontWeight: props.inputFontWeight,
            fontFamily: props.inputFontFamily,
            minHeight: props.inputHeight,
            borderRadius: props.inputBorderRadius,
            '--placeholder-color': props.inputPlaceholderColor,
            '--textarea-border': props.textareaBorder,
            '--textarea-border-hover': props.textareaBorderHover,
            '--textarea-border-focus': props.textareaBorderFocus,
        }));

        const sendButtonStyle = computed(() => ({
            color: props.sendIconColor,
            width: props.sendButtonSize,
            height: props.sendButtonSize,
            border: props.sendButtonBorder,
            borderRadius: props.sendButtonBorderRadius,
            '--send-bg': props.sendButtonBgColor,
            '--send-hover-bg': props.sendButtonHoverBgColor,
        }));

        const attachmentButtonStyle = computed(() => ({
            color: props.attachmentIconColor,
        }));

        const onEnterPress = event => {
            if (event.shiftKey) return;
            event.preventDefault();
            sendMessage();
        };

        const sendMessage = () => {
            if (!canSend.value || isUiDisabled.value || props.isLoading) return;
            emit('send');
            inputValue.value = '';
        };

        const handleAttachment = event => {
            const files = event.target.files;
            if (files && files.length) emit('attachment', files);
            event.target.value = '';
        };

        const removeAttachment = index => emit('remove-attachment', index);
        const onPendingAttachmentClick = (attachment, index) => emit('pending-attachment-click', { attachment, index });

        return {
            textareaRef,
            inputValue,
            isUiDisabled,
            canSend,
            sendIconHtml,
            attachmentIconHtml,
            removeIconHtml,
            inputStyles,
            sendButtonStyle,
            attachmentButtonStyle,
            formatFileSize,
            onEnterPress,
            sendMessage,
            handleAttachment,
            removeAttachment,
            onPendingAttachmentClick,
        };
    },
};
</script>

<style lang="scss" scoped>
.ww-chat-input-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border-top: v-bind('inputAreaBorder');
    background: v-bind('inputBgColor');

    &__attachments {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    &__attachment {
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 260px;
        padding: 8px 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #f9fafb;
        color: #111827;
        cursor: pointer;
        text-align: left;
    }

    &__attachment-info {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
    }

    &__attachment-name,
    &__attachment-meta,
    &__attachment-error {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__attachment-name {
        font-size: 0.8125rem;
        font-weight: 600;
    }

    &__attachment-meta {
        color: #6b7280;
        font-size: 0.75rem;
    }

    &__attachment-error {
        color: #b91c1c;
        font-size: 0.75rem;
    }

    &__attachment-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__error {
        color: #b91c1c;
        font-size: 0.8125rem;
    }

    &__row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
    }

    &__input {
        flex: 1;
        width: 100%;
        max-height: 180px;
        padding: 11px 13px;
        border: var(--textarea-border);
        resize: vertical;
        line-height: 1.45;

        &::placeholder {
            color: var(--placeholder-color);
        }

        &:hover {
            border: var(--textarea-border-hover);
        }

        &:focus {
            outline: none;
            border: var(--textarea-border-focus);
        }
    }

    &__file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
    }

    &__icon-button,
    &__send,
    &__clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        cursor: pointer;
    }

    &__icon-button {
        width: 42px;
        height: 42px;
        background: #ffffff;

        &--disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }
    }

    &__clear {
        height: 42px;
        padding: 0 12px;
        background: #ffffff;
        color: #374151;
        font-size: 0.8125rem;
    }

    &__send {
        background: var(--send-bg);

        &:hover:not(:disabled) {
            background: var(--send-hover-bg);
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.45;
        }
    }

    &__icon {
        display: inline-flex;

        :deep(svg) {
            width: 100%;
            height: 100%;
        }
    }

    &__spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.45);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: ww-chat-spin 0.8s linear infinite;
    }
}

@keyframes ww-chat-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
