# WW Chat AI

WeWeb custom element for a ChatGPT-like chat UI with text messages, markdown assistant responses, file attachments, loading/error states, copy, retry, and clear-conversation behavior.

## Architecture

Production usage should use external backend mode:

1. The component emits events when the user sends a message or selects files.
2. Your WeWeb workflow, Xano, Supabase, or custom backend stores files, calls the LLM, and persists conversation state.
3. The component receives the authoritative `messages` array back through a bound WeWeb property.

Optional proxy/direct mode is available for prototypes or trusted backend proxies. Do not expose OpenAI or other provider API keys in frontend code. Use `apiAuthToken` only for your own backend/proxy authentication.

## Message Model

```js
{
  id: 'msg-1',
  role: 'user', // user | assistant | system | error
  content: 'Please summarize this file.',
  createdAt: '2026-06-11T10:00:00.000Z',
  status: 'completed', // pending | streaming | completed | failed
  attachments: [],
  metadata: {}
}
```

## Attachment Model

```js
{
  id: 'file-1',
  fileName: 'report.pdf',
  displayName: 'report.pdf',
  mimeType: 'application/pdf',
  size: 123456,
  file: File, // available while pending or in emitted browser events
  status: 'pending',
  uploadedUrl: '',
  storageKey: '',
  error: ''
}
```

Persisted messages should store metadata, URLs, and storage keys. Real `File` objects are browser-only and should be uploaded or processed before persistence.

## Important Properties

- `messages`: authoritative conversation array. When bound, the component is controlled by WeWeb/backend state.
- `initialMessages`: used only when `messages` is not bound.
- `apiMode`: `external`, `proxy`, or `direct`.
- `apiEndpoint`: backend/proxy endpoint for optional HTTP mode.
- `apiAuthToken`, `apiHeaders`, `modelName`: optional proxy request configuration.
- `acceptedFileTypes`: comma-separated accept list, for example `image/*,.pdf,.txt`.
- `maxFileSizeMb`, `maxFilesPerMessage`, `allowMultipleFiles`: upload limits.
- `showFilePreviews`, `enableMarkdown`, `enableCopyButton`, `enableRetryButton`, `enableClearButton`.
- `placeholder` / `inputPlaceholder`, `emptyMessageText`, `loadingText`, `errorText`.

## Events

- `messageSent`: user sent text and/or files. Payload includes `message`, `serializableMessage`, `files`, and `attachments`.
- `filesSelected`: files were selected and validated. Payload includes accepted `files`, normalized `attachments`, and `rejected`.
- `fileRemoved`: pending file removed.
- `uploadStarted`, `uploadCompleted`, `uploadFailed`: proxy/direct upload lifecycle.
- `assistantResponseStarted`, `assistantResponseCompleted`, `assistantResponseFailed`: LLM response lifecycle.
- `retryClicked`: retry/regenerate requested.
- `messageCopied`: copy button clicked; payload includes `copied`.
- `conversationCleared`: local conversation/pending files cleared.
- `attachmentClick`, `pendingAttachmentClick`, `messageRightClick`: UI interaction hooks.

## Backend Proxy Contract

When `apiMode` is `proxy` or `direct`, the component sends `multipart/form-data` to `apiEndpoint`:

- `message`: JSON serialized user message without raw `File` objects.
- `messages`: JSON serialized conversation messages.
- `attachments`: JSON serialized attachment metadata.
- `metadata`: JSON object with component metadata.
- `model`: optional model name.
- `files[]`: one entry per real selected browser `File`.

Expected response can be any of:

```json
{ "message": { "role": "assistant", "content": "Answer text" } }
```

```json
{ "assistantMessage": { "content": "Answer text" } }
```

```json
{ "choices": [{ "message": { "content": "Answer text" } }] }
```

or plain text.

For file discussion, the backend should upload/store files, extract text or create provider-specific file references, call the LLM, and return the assistant message plus any attachment URLs/storage keys.

## Development

Install dependencies:

```sh
npm install
```

Serve locally for WeWeb development:

```sh
npm run serve -- --port=8080
```

Build:

```sh
npm run build
```

## Limitations

- The component does not parse arbitrary documents in the browser.
- Real `File` objects cannot be persisted in WeWeb state; upload them through a workflow/backend.
- Direct frontend calls are not recommended for production because browser code exposes tokens.
