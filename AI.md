---
name: ww-chat-ai
description: ChatGPT-style WeWeb chat element with messages, markdown, attachments, file validation, proxy API mode, and backend-first events.
keywords: [chat, ai, assistant, chatgpt, llm, files, markdown, weweb]
---

## Purpose

`ww-chat-ai` is a WeWeb custom element for building an AI assistant chat UI. It is designed for backend-first production use: the component emits user messages and real browser `File` objects, while your backend handles storage, LLM calls, persistence, and security.

## Recommended Workflow

1. Bind `messages` to your WeWeb conversation variable or backend result.
2. Listen to `messageSent`.
3. Store/upload any `event.files`.
4. Call your LLM from a backend or WeWeb workflow.
5. Push the user and assistant messages into the bound `messages` array.

If `messages` is not bound, the component keeps local optimistic messages for prototype use.

## Message Shape

```js
{
  id: 'msg-1',
  role: 'user', // user | assistant | system | error
  content: 'Analyze this file',
  createdAt: '2026-06-11T10:00:00.000Z',
  status: 'completed', // pending | streaming | completed | failed
  attachments: [],
  metadata: {}
}
```

## Attachment Shape

```js
{
  id: 'file-1',
  fileName: 'report.pdf',
  displayName: 'report.pdf',
  mimeType: 'application/pdf',
  size: 120000,
  file: File,
  status: 'pending',
  uploadedUrl: '',
  storageKey: '',
  error: ''
}
```

`file` is available only while the attachment is pending or inside emitted frontend events. Persist URLs, storage keys, and metadata instead.

## Main Properties

- `messages`: controlled conversation data.
- `initialMessages`: local prototype seed when `messages` is not bound.
- `apiMode`: `external`, `proxy`, or `direct`.
- `apiEndpoint`: proxy/direct endpoint.
- `apiAuthToken`, `apiHeaders`, `modelName`: optional request configuration.
- `acceptedFileTypes`, `maxFileSizeMb`, `maxFilesPerMessage`, `allowMultipleFiles`.
- `showFilePreviews`, `enableMarkdown`, `enableCopyButton`, `enableRetryButton`, `enableClearButton`.
- `placeholder`, `inputPlaceholder`, `emptyMessageText`, `loadingText`, `errorText`.

## Events

- `messageSent`
- `filesSelected`
- `fileRemoved`
- `uploadStarted`
- `uploadCompleted`
- `uploadFailed`
- `assistantResponseStarted`
- `assistantResponseCompleted`
- `assistantResponseFailed`
- `retryClicked`
- `messageCopied`
- `conversationCleared`
- `attachmentClick`
- `pendingAttachmentClick`
- `messageRightClick`

## Proxy API Contract

For `apiMode = proxy` or `direct`, the component posts `multipart/form-data`:

- `message`: JSON user message without raw files.
- `messages`: JSON conversation history.
- `attachments`: JSON attachment metadata.
- `metadata`: JSON component metadata.
- `model`: optional model name.
- `files[]`: selected browser files.

The proxy should return an assistant message as `message`, `assistantMessage`, OpenAI-like `choices[0].message`, or plain text.

## Security Notes

Never hardcode provider API keys in this component or expose them through frontend properties in production. Use a backend proxy for OpenAI, Anthropic, or other provider calls. File-to-LLM discussion usually requires backend processing, extraction, or provider-specific file references; this component supplies the frontend contract and preserves real `File` objects for that backend flow.
