
/**
 * Waits for a specified amount of time.
 *
 * @async
 * @param {number} ms - The amount of time to sleep in milliseconds.
 * @returns {Promise} - A promise that will be resolved after the specified time has elapsed.
 */
async function sleep (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = sleep;
