const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-flash';
const MAX_TOKENS = 600;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_CONTEXT_CHARS = 12_000;
const MAX_REPLY_CHARS = 2_000;

const SYSTEM_PROMPT = [
	'You are a friendly Discord bot replying to short chat messages.',
	'Keep answers concise and under 1500 characters when possible.',
	'Use Discord markdown. Never use em dashes.',
].join(' ');

class ChatApiError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'ChatApiError';
		this.status = status;
	}
}

/**
 * Builds the request payload from history and the new prompt, trimming the
 * oldest history entries until the context fits inside the character budget.
 * @param {Array<{ role: string, content: string }>} history
 * @param {string} prompt
 * @returns {Array<{ role: string, content: string }>}
 */
function buildMessages(history, prompt) {
	const recent = [];
	let budget = MAX_CONTEXT_CHARS - prompt.length;

	for (let index = history.length - 1; index >= 0; index--) {
		const message = history[index];
		if (message.content.length > budget) {
			break;
		}
		budget -= message.content.length;
		recent.unshift({ role: message.role, content: message.content });
	}

	return [
		{ role: 'system', content: SYSTEM_PROMPT },
		...recent,
		{ role: 'user', content: prompt },
	];
}

/**
 * Splits text into Discord-sized chunks, preferring line and word boundaries.
 * @param {string} text
 * @param {number} [limit]
 * @returns {string[]}
 */
function splitMessage(text, limit = MAX_REPLY_CHARS) {
	const chunks = [];
	let remaining = text.trim();

	while (remaining.length > limit) {
		let slice = remaining.slice(0, limit);
		const breakAt = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '));

		if (breakAt > limit / 2) {
			slice = slice.slice(0, breakAt);
		}

		chunks.push(slice.trim());
		remaining = remaining.slice(slice.length).trim();
	}

	if (remaining.length > 0) {
		chunks.push(remaining);
	}

	return chunks;
}

/**
 * Calls the DeepSeek chat completions endpoint and returns the reply text.
 * @param {Array<{ role: string, content: string }>} messages
 * @param {{ apiKey: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<string>}
 */
async function requestChat(messages, { apiKey, fetchImpl = fetch } = {}) {
	if (!apiKey) {
		throw new ChatApiError('DEEPSEEK_API_KEY is not set.', 0);
	}

	let response;
	try {
		response = await fetchImpl(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: MODEL,
				messages,
				max_tokens: MAX_TOKENS,
				temperature: 0.7,
				stream: false,
			}),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
	}
	catch (requestError) {
		throw new ChatApiError(`DeepSeek request failed: ${requestError.message}`, 0);
	}

	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		throw new ChatApiError(`DeepSeek responded with ${response.status}: ${detail.slice(0, 200)}`, response.status);
	}

	const data = await response.json().catch(() => null);
	const content = data?.choices?.[0]?.message?.content;

	if (typeof content !== 'string' || content.trim().length === 0) {
		throw new ChatApiError('DeepSeek returned an empty response.', 0);
	}

	return content.trim();
}

module.exports = {
	API_URL,
	ChatApiError,
	MAX_CONTEXT_CHARS,
	MAX_REPLY_CHARS,
	MAX_TOKENS,
	MODEL,
	SYSTEM_PROMPT,
	buildMessages,
	requestChat,
	splitMessage,
};
