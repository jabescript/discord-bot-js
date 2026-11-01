const MIN_DICE = 1;
const MAX_DICE = 100;
const MIN_SIDES = 2;
const MAX_SIDES = 1000;

/**
 * Parses dice notation such as `2d6` or `1d20`.
 * @param {unknown} input
 * @returns {{ count: number, sides: number } | { error: 'format' | 'range' }}
 */
function parseDice(input) {
	if (typeof input !== 'string') {
		return { error: 'format' };
	}

	const match = input.trim().toLowerCase().match(/^(\d+)d(\d+)$/);
	if (!match) {
		return { error: 'format' };
	}

	const count = Number.parseInt(match[1], 10);
	const sides = Number.parseInt(match[2], 10);

	if (!Number.isFinite(count) || !Number.isFinite(sides)) {
		return { error: 'format' };
	}

	if (count < MIN_DICE || count > MAX_DICE || sides < MIN_SIDES || sides > MAX_SIDES) {
		return { error: 'range' };
	}

	return { count, sides };
}

/**
 * Rolls `count` dice with `sides` faces each.
 * @param {number} count
 * @param {number} sides
 * @param {() => number} [random]
 * @returns {number[]}
 */
function rollDice(count, sides, random = Math.random) {
	const rolls = [];
	for (let i = 0; i < count; i++) {
		rolls.push(Math.floor(random() * sides) + 1);
	}
	return rolls;
}

module.exports = {
	MAX_DICE,
	MAX_SIDES,
	MIN_DICE,
	MIN_SIDES,
	parseDice,
	rollDice,
};
