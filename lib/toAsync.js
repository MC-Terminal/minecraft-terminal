async function toAsync (emitter, event) {
	return await new Promise((resolve) => {
		emitter.once(event, (...data) => {
			resolve(data);
		});
	});
}

module.exports = toAsync;
