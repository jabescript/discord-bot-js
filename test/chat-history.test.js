const test = require('node:test');
const assert = require('node:assert/strict');

const { ChatHistory } = require('../utils/chat-history.js');

test('ChatHistory starts empty and stores messages in order', () => {
	const history = new ChatHistory();

	assert.deepEqual(history.get('channel-1', 'user-1'), []);

	history.append('channel-1', 'user-1', 'user', 'hello');
	history.append('channel-1', 'user-1', 'assistant', 'hi there');

	assert.deepEqual(history.get('channel-1', 'user-1'), [
		{ role: 'user', content: 'hello' },
		{ role: 'assistant', content: 'hi there' },
	]);
});

test('ChatHistory keeps conversations apart by channel and user', () => {
	const history = new ChatHistory();
	history.append('channel-1', 'user-1', 'user', 'first');
	history.append('channel-2', 'user-1', 'user', 'second');
	history.append('channel-1', 'user-2', 'user', 'third');

	assert.equal(history.get('channel-1', 'user-1').length, 1);
	assert.equal(history.get('channel-2', 'user-1')[0].content, 'second');
	assert.equal(history.get('channel-1', 'user-2')[0].content, 'third');
});

test('ChatHistory trims old turns beyond maxTurns', () => {
	const history = new ChatHistory({ maxTurns: 2 });

	for (let index = 0; index < 5; index++) {
		history.append('channel-1', 'user-1', 'user', `question ${index}`);
		history.append('channel-1', 'user-1', 'assistant', `answer ${index}`);
	}

	const messages = history.get('channel-1', 'user-1');
	assert.equal(messages.length, 4);
	assert.equal(messages[0].content, 'question 3');
	assert.equal(messages[3].content, 'answer 4');
});

test('ChatHistory expires conversations after the idle window', () => {
	let currentTime = 1_000;
	const history = new ChatHistory({ ttlMs: 500, now: () => currentTime });
	history.append('channel-1', 'user-1', 'user', 'hello');

	currentTime = 1_400;
	assert.equal(history.get('channel-1', 'user-1').length, 1);

	currentTime = 1_901;
	assert.deepEqual(history.get('channel-1', 'user-1'), []);
});

test('ChatHistory returns copies and clears on demand', () => {
	const history = new ChatHistory();
	history.append('channel-1', 'user-1', 'user', 'hello');

	const messages = history.get('channel-1', 'user-1');
	messages[0].content = 'mutated';

	assert.equal(history.get('channel-1', 'user-1')[0].content, 'hello');
	assert.equal(history.clear('channel-1', 'user-1'), true);
	assert.equal(history.clear('channel-1', 'user-1'), false);
	assert.deepEqual(history.get('channel-1', 'user-1'), []);
});
