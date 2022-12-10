
/**
 * The sleep function pauses the execution of a program for a specified number of milliseconds.
 *
 *
 * @param ms Used to Set the time for which the function will sleep.
 * @return The number of milliseconds it was passed.
 *
 */
async function sleep (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = sleep;
