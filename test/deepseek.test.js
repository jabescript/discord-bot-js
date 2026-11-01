const test = require('node:test');
const assert = require('node:assert/strict');

const {
	API_URL,
	ChatApiError,
	MAX_CONTEXT_CHARS,
	MAX_REPLY_CHARS,
	MODEL,
	SYSTEM_PROMPT,
	buildMessages,
	requestChat,
	splitMessage,
} = require('../utils/deepseek.js');

test('buildMessages keeps the system prompt first and the prompt last', () => {
	const messages = buildMessages(
		[
			{ role: 'user', content: 'earlier question' },
			{ role: 'assistant', content: 'earlier answer' },
		],
		'new question',
	);

	assert.equal(messages[0].role, 'system');
	assert.equal(messages[0].content, SYSTEM_PROMPT);
	assert.deepEqual(messages.slice(1), [
		{ role: 'user', content: 'earlier question' },
		{ role: 'assistant', content: 'earlier answer' },
		{ role: 'user', content: 'new question' },
	]);
});

test('buildMessages drops the oldest history once the budget is exceeded', () => {
	const history = [];
	for (let index = 0; index < 20; index++) {
		history.push({ role: 'user', content: `${index}`.padEnd(1_000, 'x') });
	}

	const messages = buildMessages(history, 'prompt');
	const historyChars = messages
		.filter((message) => message.role !== 'system' && message.content !== 'prompt')
		.reduce((total, message) => total + message.content.length, 0);

	assert.ok(historyChars <= MAX_CONTEXT_CHARS);
	assert.ok(messages.length < history.length + 2);
	assert.equal(messages[messages.length - 1].content, 'prompt');
});

test('splitMessage keeps every chunk within the limit', () => {
	const text = Array.from({ length: 12 }, (_, index) => `Line ${index} with some words in it.`).join('\n');
	const chunks = splitMessage(text, 80);

	assert.ok(chunks.length > 1);
	for (const chunk of chunks) {
		assert.ok(chunk.length <= 80);
	}

	const normalize = (value) => value.replace(/\s+/g, ' ').trim();
	assert.equal(normalize(chunks.join('\n')), normalize(text));
});

test('splitMessage returns short text untouched', () => {
	assert.deepEqual(splitMessage('short reply'), ['short reply']);
	assert.deepEqual(splitMessage('   spaced   '), ['spaced']);
});

test('requestChat posts the expected payload and returns the reply', async () => {
	let captured;
	const fakeFetch = async (url, options) => {
		captured = { url, options };
		return new Response(JSON.stringify({ choices: [{ message: { content: '  hello there  ' } }] }), { status: 200 });
	};

	const content = await requestChat([{ role: 'user', content: 'hi' }], { apiKey: 'test-key', fetchImpl: fakeFetch });
	const body = JSON.parse(captured.options.body);

	assert.equal(content, 'hello there');
	assert.equal(captured.url, API_URL);
	assert.equal(captured.options.headers.Authorization, 'Bearer test-key');
	assert.equal(body.model, MODEL);
	assert.equal(body.stream, false);
});

test('requestChat surfaces HTTP failures as ChatApiError', async () => {
	const fakeFetch = async () => new Response('denied', { status: 401 });

	await assert.rejects(
		() => requestChat([{ role: 'user', content: 'hi' }], { apiKey: 'test-key', fetchImpl: fakeFetch }),
		(error) => error instanceof ChatApiError && error.status === 401,
	);
});

test('requestChat rejects empty responses', async () => {
	const fakeFetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), { status: 200 });

	await assert.rejects(
		() => requestChat([{ role: 'user', content: 'hi' }], { apiKey: 'test-key', fetchImpl: fakeFetch }),
		(error) => error instanceof ChatApiError,
	);
});

test('requestChat rejects a missing key without calling fetch', async () => {
	let called = false;
	const fakeFetch = async () => {
		called = true;
		return new Response('{}', { status: 200 });
	};

	await assert.rejects(
		() => requestChat([{ role: 'user', content: 'hi' }], { apiKey: '', fetchImpl: fakeFetch }),
		(error) => error instanceof ChatApiError,
	);

	assert.equal(called, false);
});

test('reply limit stays within the Discord message cap', () => {
	assert.equal(MAX_REPLY_CHARS, 2_000);
});
