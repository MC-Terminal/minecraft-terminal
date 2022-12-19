const sleep = require('./sleep');

async function withPriority (priority = 0, cooldown = 0, doIfOnCooldown = true, countSamePriority = false, cache = { priority: 0, cooldown: 0 }, callback = () => {}) {
	if (isNaN(cooldown)) {
		return;
	}
	let done = false;
	if (priority < cache.priority || (countSamePriority === true && priority <= cache.priority)) {
		const slp = cache.cooldown - Date.now();
		if (slp > 0) {
			await sleep(slp);
			done = true;
		}
	}
	if (cache.cooldown < Date.now() + cooldown) {
		cache.priority = priority;
		cache.cooldown = Date.now() + cooldown;
	}

	if (done === false || doIfOnCooldown === true) {
		callback?.();
	}
}

module.exports = withPriority;
