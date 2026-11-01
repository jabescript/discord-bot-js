const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX_TURNS = 10;

/**
 * In-memory conversation store keyed by channel and user.
 * A conversation expires after a period of inactivity.
 */
class ChatHistory {
	constructor({ ttlMs = DEFAULT_TTL_MS, maxTurns = DEFAULT_MAX_TURNS, now = Date.now } = {}) {
		this.ttlMs = ttlMs;
		this.maxTurns = maxTurns;
		this.now = now;
		this.conversations = new Map();
	}

	static key(channelId, userId) {
		return `${channelId}:${userId}`;
	}

	get(channelId, userId) {
		const key = ChatHistory.key(channelId, userId);
		const conversation = this.conversations.get(key);

		if (!conversation) {
			return [];
		}

		if (this.isExpired(conversation)) {
			this.conversations.delete(key);
			return [];
		}

		conversation.lastUsed = this.now();
		return conversation.messages.map((message) => ({ ...message }));
	}

	append(channelId, userId, role, content) {
		const key = ChatHistory.key(channelId, userId);
		const timestamp = this.now();
		let conversation = this.conversations.get(key);

		if (!conversation || this.isExpired(conversation)) {
			conversation = { messages: [], lastUsed: timestamp };
			this.conversations.set(key, conversation);
		}

		conversation.messages.push({ role, content });
		conversation.lastUsed = timestamp;

		const limit = this.maxTurns * 2;
		if (conversation.messages.length > limit) {
			conversation.messages.splice(0, conversation.messages.length - limit);
		}
	}

	clear(channelId, userId) {
		return this.conversations.delete(ChatHistory.key(channelId, userId));
	}

	isExpired(conversation) {
		return this.now() - conversation.lastUsed > this.ttlMs;
	}
}

module.exports = {
	DEFAULT_MAX_TURNS,
	DEFAULT_TTL_MS,
	ChatHistory,
};
