<template>
    <div ref="chatRoot" class="ww-chat-ai" :class="{ 'ww-chat-ai--disabled': isDisabled }" :style="containerStyles">
        <div ref="messagesContainer" class="ww-chat-ai__messages" :style="messagesContainerStyles">
            <MessageList
                :messages="messages"
                :is-loading="isAssistantLoading"
                :loading-text="loadingText"
                :error-text="activeErrorText"
                :enable-markdown="enableMarkdown"
                :enable-copy-button="enableCopyButton"
                :enable-retry-button="enableRetryButton"
                :show-file-previews="showFilePreviews"
                :user-label="userLabel"
                :assistant-label="assistantLabel"
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
                :empty-message-text="emptyMessageText"
                :empty-message-color="emptyMessageColor"
                @attachment-click="handleAttachmentClick"
                @message-right-click="handleMessageRightClick"
                @copy-message="handleCopyMessage"
                @retry-message="handleRetryMessage"
            />
        </div>

        <InputArea
            v-model="newMessage"
            :is-disabled="isDisabled"
            :is-loading="isAssistantLoading"
            :allow-attachments="allowAttachments"
            :allow-multiple-files="allowMultipleFiles"
            :accepted-file-types="acceptedFileTypes"
            :pending-attachments="pendingAttachments"
            :file-error="activeErrorText"
            :placeholder="inputPlaceholder"
            :loading-text="loadingText"
            :enable-clear-button="enableClearButton"
            :input-bg-color="inputBgColor"
            :input-text-color="inputTextColor"
            :input-font-size="inputFontSize"
            :input-font-weight="inputFontWeight"
            :input-font-family="inputFontFamily"
            :input-placeholder-color="inputPlaceholderColor"
            :input-area-border="inputAreaBorder"
            :textarea-border="textareaBorder"
            :textarea-border-hover="textareaBorderHover"
            :textarea-border-focus="textareaBorderFocus"
            :input-height="inputHeight"
            :input-border-radius="inputBorderRadius"
            :send-icon="sendIcon"
            :send-icon-color="sendIconColor"
            :send-icon-size="sendIconSize"
            :attachment-icon="attachmentIcon"
            :attachment-icon-color="attachmentIconColor"
            :attachment-icon-size="attachmentIconSize"
            :remove-icon="removeIcon"
            :remove-icon-color="removeIconColor"
            :remove-icon-size="removeIconSize"
            :send-button-bg-color="sendButtonBgColor"
            :send-button-hover-bg-color="sendButtonHoverBgColor"
            :send-button-border="sendButtonBorder"
            :send-button-border-radius="sendButtonBorderRadius"
            :send-button-size="sendButtonSize"
            @send="sendMessage"
            @attachment="handleAttachment"
            @remove-attachment="handleRemoveAttachment"
            @pending-attachment-click="handlePendingAttachmentClick"
            @clear="clearConversation"
        />
    </div>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import MessageList from './components/MessageList.vue';
import InputArea from './components/InputArea.vue';
import {
    getAttachmentFiles,
    normalizeAttachment,
    normalizeMessage,
    toSerializableMessage,
    validateFiles,
} from './utils/chatModels';
import { postChatToProxy } from './utils/chatApiProxy';

export default {
    name: 'ChatAI',
    components: {
        MessageList,
        InputArea,
    },
    props: {
        content: {
            type: Object,
            required: true,
        },
        /* wwEditor:start */
        wwEditorState: {
            type: Object,
            required: true,
        },
        /* wwEditor:end */
        uid: {
            type: String,
            required: true,
        },
        wwElementState: {
            type: Object,
            required: true,
        },
    },
    emits: ['trigger-event'],
    setup(props, { emit }) {
        const chatRoot = ref(null);
        const messagesContainer = ref(null);
        const newMessage = ref('');
        const pendingAttachments = ref([]);
        const localMessages = ref([]);
        const componentError = ref('');
        const isProxyLoading = ref(false);
        const initialMessagesLoaded = ref(false);

        const { value: chatState, setValue: setChatState } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'chatState',
            type: 'object',
            defaultValue: {
                messages: [],
                utils: { messageCount: 0, isDisabled: false, isLoading: false },
            },
        });

        const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

        const emitEvent = (name, event = {}) => {
            emit('trigger-event', { name, event });
        };

        const isEditing = computed(() => {
            /* wwEditor:start */
            return props.wwEditorState.isEditing;
            /* wwEditor:end */
            // eslint-disable-next-line no-unreachable
            return false;
        });

        const resolveMapping = (source, formula, fallbackKey) => {
            if (!source || typeof source !== 'object') return undefined;
            if (!formula) return source[fallbackKey];
            return resolveMappingFormula(formula, source);
        };

        const mapAttachmentField = (source, formula, fallbackKey) => {
            if (!source || typeof source !== 'object') return undefined;
            if (!formula) return source[fallbackKey];
            return resolveMappingFormula(formula, source);
        };

        const normalizeExternalMessage = (message, index) => {
            const attachments = resolveMapping(message, props.content?.mappingAttachments, 'attachments');
            const normalizedAttachments = Array.isArray(attachments)
                ? attachments.map(attachment =>
                      normalizeAttachment({
                          id: mapAttachmentField(attachment, props.content?.mappingAttachmentId, 'id'),
                          fileName: mapAttachmentField(attachment, props.content?.mappingAttachmentName, 'fileName') ||
                              mapAttachmentField(attachment, props.content?.mappingAttachmentName, 'name'),
                          displayName: mapAttachmentField(attachment, props.content?.mappingAttachmentName, 'displayName'),
                          mimeType: mapAttachmentField(attachment, props.content?.mappingAttachmentType, 'mimeType') ||
                              mapAttachmentField(attachment, props.content?.mappingAttachmentType, 'type'),
                          size: mapAttachmentField(attachment, props.content?.mappingAttachmentSize, 'size'),
                          url: mapAttachmentField(attachment, props.content?.mappingAttachmentUrl, 'url'),
                          uploadedUrl: mapAttachmentField(
                              attachment,
                              props.content?.mappingAttachmentUploadedUrl,
                              'uploadedUrl'
                          ),
                          storageKey: mapAttachmentField(
                              attachment,
                              props.content?.mappingAttachmentStorageKey,
                              'storageKey'
                          ),
                          status: mapAttachmentField(attachment, props.content?.mappingAttachmentStatus, 'status'),
                          error: mapAttachmentField(attachment, props.content?.mappingAttachmentError, 'error'),
                          file: attachment.file,
                          metadata: attachment.metadata,
                      })
                  )
                : [];

            return normalizeMessage({
                id: resolveMapping(message, props.content?.mappingMessageId, 'id') || `msg-${index}`,
                role: resolveMapping(message, props.content?.mappingRole, 'role'),
                content: resolveMapping(message, props.content?.mappingMessageText, 'content'),
                createdAt:
                    resolveMapping(message, props.content?.mappingMessageCreatedAt, 'createdAt') ||
                    resolveMapping(message, props.content?.mappingTimestamp, 'timestamp'),
                status: resolveMapping(message, props.content?.mappingMessageStatus, 'status'),
                attachments: normalizedAttachments,
                metadata: resolveMapping(message, props.content?.mappingMessageMetadata, 'metadata'),
                error: message.error,
            });
        };

        const isControlled = computed(() => Array.isArray(props.content?.messages));
        const externalMessages = computed(() =>
            isControlled.value ? props.content.messages.map((message, index) => normalizeExternalMessage(message, index)) : []
        );

        watch(
            () => props.content?.initialMessages,
            value => {
                if (isControlled.value || initialMessagesLoaded.value) return;
                if (Array.isArray(value) && value.length) {
                    localMessages.value = value.map(message => normalizeMessage(message));
                    initialMessagesLoaded.value = true;
                }
            },
            { immediate: true }
        );

        const streamingText = computed(() => {
            const value = props.content?.streamingText;
            if (Array.isArray(value)) return value[0] || '';
            return value || '';
        });

        const baseMessages = computed(() => (isControlled.value ? externalMessages.value : localMessages.value));
        const messages = computed(() => {
            if (!props.content?.isStreaming || !streamingText.value) return baseMessages.value;
            return [
                ...baseMessages.value,
                normalizeMessage({
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingText.value,
                    status: 'streaming',
                    userName: assistantLabel.value,
                }),
            ];
        });
        const isDisabled = computed(() => props.content?.disabled || false);
        const apiMode = computed(() => props.content?.apiMode || 'external');
        const apiEndpoint = computed(() => props.content?.apiEndpoint || '');
        const shouldUseProxy = computed(() => ['proxy', 'direct'].includes(apiMode.value) && !!apiEndpoint.value);
        const isAssistantLoading = computed(
            () => isProxyLoading.value || props.content?.isLoading || (props.content?.isStreaming && !streamingText.value)
        );
        const activeErrorText = computed(() => componentError.value || '');

        const allowAttachments = computed(() => props.content?.allowAttachments !== false);
        const allowMultipleFiles = computed(() => props.content?.allowMultipleFiles !== false);
        const acceptedFileTypes = computed(() => props.content?.acceptedFileTypes || 'image/*,.pdf,.txt,.md,.csv,.json,text/*');
        const maxFileSizeMb = computed(() => Number(props.content?.maxFileSizeMb || 10));
        const maxFilesPerMessage = computed(() => Number(props.content?.maxFilesPerMessage || 5));
        const showFilePreviews = computed(() => props.content?.showFilePreviews !== false);
        const enableMarkdown = computed(() => props.content?.enableMarkdown !== false);
        const enableCopyButton = computed(() => props.content?.enableCopyButton !== false);
        const enableRetryButton = computed(() => props.content?.enableRetryButton !== false);
        const enableClearButton = computed(() => props.content?.enableClearButton !== false);

        const userLabel = computed(() => props.content?.userLabel || 'You');
        const assistantLabel = computed(() => props.content?.assistantLabel || 'Assistant');
        const inputPlaceholder = computed(() => props.content?.inputPlaceholder || props.content?.placeholder || 'Message...');
        const emptyMessageText = computed(() => props.content?.emptyMessageText || 'Ask anything to get started.');
        const loadingText = computed(() => props.content?.loadingText || 'Thinking...');
        const messageShowTimestamp = computed(() => props.content?.messageShowTimestamp !== false);
        const ownMessageShowTimestamp = computed(() => props.content?.ownMessageShowTimestamp !== false);

        const containerStyles = computed(() => ({
            fontFamily: props.content?.fontFamily || 'inherit',
        }));

        const messagesContainerStyles = computed(() => ({
            backgroundColor: props.content?.messagesAreaBgColor || '#ffffff',
            padding: props.content?.messagesAreaPadding || '18px',
        }));

        const messageBgColor = computed(() => props.content?.messageBgColor || 'transparent');
        const messageTextColor = computed(() => props.content?.messageTextColor || '#1f2937');
        const messageFontSize = computed(() => props.content?.messageFontSize || '0.9375rem');
        const messageFontWeight = computed(() => props.content?.messageFontWeight || '400');
        const messageFontFamily = computed(() => props.content?.messageFontFamily || 'inherit');
        const messageBorder = computed(() => props.content?.messageBorder || 'none');
        const messageRadius = computed(() => props.content?.messageRadius || '8px');
        const ownMessageBgColor = computed(() => props.content?.ownMessageBgColor || '#f3f4f6');
        const ownMessageTextColor = computed(() => props.content?.ownMessageTextColor || '#111827');
        const ownMessageFontSize = computed(() => props.content?.ownMessageFontSize || '0.9375rem');
        const ownMessageFontWeight = computed(() => props.content?.ownMessageFontWeight || '400');
        const ownMessageFontFamily = computed(() => props.content?.ownMessageFontFamily || 'inherit');
        const ownMessageBorder = computed(() => props.content?.ownMessageBorder || '1px solid #e5e7eb');
        const ownMessageRadius = computed(() => props.content?.ownMessageRadius || '18px');
        const emptyMessageColor = computed(() => props.content?.emptyMessageColor || '#6b7280');

        const inputBgColor = computed(() => props.content?.inputBgColor || '#ffffff');
        const inputTextColor = computed(() => props.content?.inputTextColor || '#111827');
        const inputFontSize = computed(() => props.content?.inputFontSize || '0.9375rem');
        const inputFontWeight = computed(() => props.content?.inputFontWeight || '400');
        const inputFontFamily = computed(() => props.content?.inputFontFamily || 'inherit');
        const inputPlaceholderColor = computed(() => props.content?.inputPlaceholderColor || '#9ca3af');
        const inputAreaBorder = computed(() => props.content?.inputAreaBorder || '1px solid #e5e7eb');
        const textareaBorder = computed(() => props.content?.textareaBorder || '1px solid #d1d5db');
        const textareaBorderHover = computed(() => props.content?.textareaBorderHover || '1px solid #9ca3af');
        const textareaBorderFocus = computed(() => props.content?.textareaBorderFocus || '1px solid #111827');
        const inputHeight = computed(() => props.content?.inputHeight || '44px');
        const inputBorderRadius = computed(() => props.content?.inputBorderRadius || '12px');

        const sendIcon = computed(() => props.content?.sendIcon || 'send');
        const sendIconColor = computed(() => props.content?.sendIconColor || '#ffffff');
        const sendIconSize = computed(() => props.content?.sendIconSize || '18px');
        const attachmentIcon = computed(() => props.content?.attachmentIcon || 'paperclip');
        const attachmentIconColor = computed(() => props.content?.attachmentIconColor || '#374151');
        const attachmentIconSize = computed(() => props.content?.attachmentIconSize || '18px');
        const removeIcon = computed(() => props.content?.removeIcon || 'x');
        const removeIconColor = computed(() => props.content?.removeIconColor || '#374151');
        const removeIconSize = computed(() => props.content?.removeIconSize || '14px');
        const sendButtonBgColor = computed(() => props.content?.sendButtonBgColor || '#111827');
        const sendButtonHoverBgColor = computed(() => props.content?.sendButtonHoverBgColor || '#374151');
        const sendButtonBorder = computed(() => props.content?.sendButtonBorder || 'none');
        const sendButtonBorderRadius = computed(() => props.content?.sendButtonBorderRadius || '12px');
        const sendButtonSize = computed(() => props.content?.sendButtonSize || '42px');

        const scrollToBottom = async () => {
            await nextTick();
            if (!messagesContainer.value) return;
            messagesContainer.value.scrollTo({
                top: messagesContainer.value.scrollHeight,
                behavior: props.content?.autoScrollBehavior || 'auto',
            });
        };

        watch(
            () => messages.value.length,
            () => scrollToBottom()
        );

        watch(isAssistantLoading, value => {
            if (value) scrollToBottom();
        });

        const appendLocalMessage = message => {
            if (isControlled.value) return;
            localMessages.value = [...localMessages.value, normalizeMessage(message)];
        };

        const revokeAttachmentUrl = attachment => {
            if (attachment?.localUrl && attachment.localUrl.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.localUrl);
            }
        };

        const handleAttachment = files => {
            if (isEditing.value || isDisabled.value || !allowAttachments.value) return;

            componentError.value = '';
            const result = validateFiles(files, pendingAttachments.value, {
                acceptedFileTypes: acceptedFileTypes.value,
                maxFileSizeMb: maxFileSizeMb.value,
                maxFilesPerMessage: maxFilesPerMessage.value,
                allowMultipleFiles: allowMultipleFiles.value,
            });

            const attachments = result.accepted.map(file =>
                normalizeAttachment({
                    file,
                    fileName: file.name,
                    displayName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    localUrl: URL.createObjectURL(file),
                    status: 'pending',
                })
            );

            if (attachments.length) {
                pendingAttachments.value = [...pendingAttachments.value, ...attachments];
            }

            if (result.rejected.length) {
                componentError.value = result.rejected.map(item => item.error).join(' ');
                emitEvent('uploadFailed', { rejected: result.rejected });
            }

            emitEvent('filesSelected', {
                files: result.accepted,
                attachments,
                rejected: result.rejected,
            });
        };

        const handleRemoveAttachment = index => {
            if (isEditing.value || isDisabled.value) return;
            const attachment = pendingAttachments.value[index];
            revokeAttachmentUrl(attachment);
            pendingAttachments.value.splice(index, 1);
            emitEvent('fileRemoved', { attachment, file: attachment?.file, index });
        };

        const runProxyRequest = async userMessage => {
            // Browser-visible tokens are only suitable for a trusted backend proxy.
            // Do not put OpenAI or other provider API keys directly in published frontend code.
            isProxyLoading.value = true;
            componentError.value = '';

            const files = getAttachmentFiles(userMessage.attachments);
            if (files.length) emitEvent('uploadStarted', { message: userMessage, files, attachments: userMessage.attachments });
            emitEvent('assistantResponseStarted', { message: userMessage });

            try {
                const baseMessages = messages.value.filter(message => message.id !== userMessage.id);
                const payload = await postChatToProxy({
                    endpoint: apiEndpoint.value,
                    authToken: props.content?.apiAuthToken || '',
                    headers: props.content?.apiHeaders || '',
                    model: props.content?.modelName || '',
                    message: userMessage,
                    messages: [...baseMessages, userMessage],
                    attachments: userMessage.attachments,
                    metadata: {
                        componentUid: props.uid,
                        apiMode: apiMode.value,
                    },
                });

                if (files.length) emitEvent('uploadCompleted', { message: userMessage, response: payload });

                const assistantPayload =
                    payload?.message ||
                    payload?.assistantMessage ||
                    payload?.assistant ||
                    payload?.choices?.[0]?.message ||
                    (typeof payload === 'string' ? { content: payload } : payload);

                const assistantMessage = normalizeMessage(assistantPayload, {
                    role: 'assistant',
                    status: 'completed',
                    userName: assistantLabel.value,
                    content: assistantPayload?.content || assistantPayload?.text || '',
                });

                appendLocalMessage(assistantMessage);
                emitEvent('assistantResponseCompleted', {
                    message: assistantMessage,
                    response: payload,
                });
            } catch (error) {
                const errorMessage = normalizeMessage({
                    role: 'error',
                    content: error?.message || props.content?.errorText || 'The assistant response failed.',
                    status: 'failed',
                    metadata: { retryMessage: userMessage },
                    error: error?.message || '',
                });

                componentError.value = errorMessage.content;
                appendLocalMessage(errorMessage);

                if (files.length) emitEvent('uploadFailed', { message: userMessage, error: errorMessage.content });
                emitEvent('assistantResponseFailed', {
                    message: userMessage,
                    error: errorMessage.content,
                });
            } finally {
                isProxyLoading.value = false;
                scrollToBottom();
            }
        };

        const sendMessage = () => {
            if (isEditing.value || isDisabled.value || isAssistantLoading.value) return;
            if (!newMessage.value.trim() && !pendingAttachments.value.length) return;

            const attachments = pendingAttachments.value.map(attachment =>
                normalizeAttachment({ ...attachment, status: shouldUseProxy.value ? 'uploading' : 'pending' })
            );
            const userMessage = normalizeMessage({
                role: 'user',
                content: newMessage.value.trim(),
                status: 'completed',
                createdAt: new Date().toISOString(),
                attachments,
                userName: userLabel.value,
            });

            newMessage.value = '';
            pendingAttachments.value = [];
            componentError.value = '';

            appendLocalMessage(userMessage);
            emitEvent('messageSent', {
                message: userMessage,
                serializableMessage: toSerializableMessage(userMessage),
                files: getAttachmentFiles(attachments),
                attachments,
            });

            if (shouldUseProxy.value) runProxyRequest(userMessage);
        };

        const handleCopyMessage = async message => {
            let copied = false;
            try {
                if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(message.content || '');
                    copied = true;
                }
            } catch (_) {
                copied = false;
            }

            emitEvent('messageCopied', { message, content: message.content || '', copied });
        };

        const handleRetryMessage = message => {
            const retryMessage = message?.metadata?.retryMessage || message;
            emitEvent('retryClicked', { message, retryMessage });

            if (shouldUseProxy.value && retryMessage?.content) {
                runProxyRequest(normalizeMessage(retryMessage, { role: 'user' }));
            }
        };

        const clearConversation = () => {
            if (isEditing.value || isDisabled.value) return;
            pendingAttachments.value.forEach(revokeAttachmentUrl);
            pendingAttachments.value = [];
            localMessages.value = [];
            componentError.value = '';
            emitEvent('conversationCleared', {});
        };

        const addMessage = message => {
            const normalized = normalizeMessage(message);
            appendLocalMessage(normalized);
            return normalized;
        };

        const handleAttachmentClick = attachment => emitEvent('attachmentClick', { attachment });
        const handlePendingAttachmentClick = ({ attachment, index }) =>
            emitEvent('pendingAttachmentClick', { attachment, file: attachment?.file, index });
        const handleMessageRightClick = payload => emitEvent('messageRightClick', payload);

        const chatData = computed(() => ({
            messages: messages.value,
            pendingAttachments: pendingAttachments.value,
            utils: {
                messageCount: messages.value.length,
                isDisabled: isDisabled.value,
                isLoading: isAssistantLoading.value,
                isControlled: isControlled.value,
            },
        }));

        watch(
            chatData,
            value => {
                setChatState(value);
            },
            { deep: true, immediate: true }
        );

        provide('isEditing', isEditing);
        provide('chatRootEl', chatRoot);

        onMounted(scrollToBottom);
        onBeforeUnmount(() => {
            pendingAttachments.value.forEach(revokeAttachmentUrl);
        });

        return {
            chatRoot,
            messagesContainer,
            newMessage,
            pendingAttachments,
            messages,
            isDisabled,
            isAssistantLoading,
            activeErrorText,
            allowAttachments,
            allowMultipleFiles,
            acceptedFileTypes,
            inputPlaceholder,
            loadingText,
            enableClearButton,
            enableMarkdown,
            enableCopyButton,
            enableRetryButton,
            showFilePreviews,
            userLabel,
            assistantLabel,
            messageShowTimestamp,
            ownMessageShowTimestamp,
            containerStyles,
            messagesContainerStyles,
            messageBgColor,
            messageTextColor,
            messageFontSize,
            messageFontWeight,
            messageFontFamily,
            messageBorder,
            messageRadius,
            ownMessageBgColor,
            ownMessageTextColor,
            ownMessageFontSize,
            ownMessageFontWeight,
            ownMessageFontFamily,
            ownMessageBorder,
            ownMessageRadius,
            emptyMessageText,
            emptyMessageColor,
            inputBgColor,
            inputTextColor,
            inputFontSize,
            inputFontWeight,
            inputFontFamily,
            inputPlaceholderColor,
            inputAreaBorder,
            textareaBorder,
            textareaBorderHover,
            textareaBorderFocus,
            inputHeight,
            inputBorderRadius,
            sendIcon,
            sendIconColor,
            sendIconSize,
            attachmentIcon,
            attachmentIconColor,
            attachmentIconSize,
            removeIcon,
            removeIconColor,
            removeIconSize,
            sendButtonBgColor,
            sendButtonHoverBgColor,
            sendButtonBorder,
            sendButtonBorderRadius,
            sendButtonSize,
            sendMessage,
            handleAttachment,
            handleRemoveAttachment,
            handlePendingAttachmentClick,
            handleAttachmentClick,
            handleMessageRightClick,
            handleCopyMessage,
            handleRetryMessage,
            clearConversation,
            addMessage,
            scrollToBottom,
            chatState,
        };
    },
    methods: {
        actionScrollToBottom() {
            this.scrollToBottom();
        },
        actionClearConversation() {
            this.clearConversation();
        },
        actionAddMessage(message) {
            return this.addMessage(message);
        },
    },
};
</script>

<style lang="scss" scoped>
.ww-chat-ai {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    height: 100%;
    min-height: 320px;
    background: #ffffff;
    font-family: inherit;

    &--disabled {
        opacity: 0.65;
        pointer-events: none;
    }

    &__messages {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
    }
}
</style>
