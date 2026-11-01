const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ReminderStore } = require('../utils/reminders.js');

function tempFile() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reminders-'));
	return path.join(dir, 'reminders.json');
}

test('ReminderStore persists and reloads reminders', () => {
	const filePath = tempFile();
	const store = new ReminderStore(filePath);
	const reminder = store.add({
		userId: 'user-1',
		channelId: 'channel-1',
		message: 'stretch',
		fireAt: Date.now() + 60_000,
	});

	assert.equal(store.countFor('user-1'), 1);

	const reloaded = new ReminderStore(filePath);
	assert.equal(reloaded.all().length, 1);
	assert.equal(reloaded.all()[0].id, reminder.id);
	assert.equal(reloaded.all()[0].message, 'stretch');
	assert.equal(reloaded.all()[0].channelId, 'channel-1');
});

test('ReminderStore tolerates a missing or corrupt file', () => {
	const filePath = tempFile();
	fs.writeFileSync(filePath, 'not json');

	assert.deepEqual(new ReminderStore(filePath).all(), []);
	assert.deepEqual(new ReminderStore(path.join(path.dirname(filePath), 'absent.json')).all(), []);
});

test('ReminderStore remove persists the deletion', () => {
	const filePath = tempFile();
	const store = new ReminderStore(filePath);
	const reminder = store.add({ userId: 'user-1', message: 'water', fireAt: Date.now() });

	store.remove(reminder.id);

	assert.equal(store.countFor('user-1'), 0);
	assert.deepEqual(new ReminderStore(filePath).all(), []);
});

test('ReminderStore counts reminders per user', () => {
	const store = new ReminderStore(tempFile());
	store.add({ userId: 'a', message: 'one', fireAt: Date.now() });
	store.add({ userId: 'a', message: 'two', fireAt: Date.now() });
	store.add({ userId: 'b', message: 'three', fireAt: Date.now() });

	assert.equal(store.countFor('a'), 2);
	assert.equal(store.countFor('b'), 1);
	assert.equal(store.countFor('c'), 0);
});
