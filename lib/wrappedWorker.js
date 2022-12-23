const { Worker, MessageChannel } = require('worker_threads');
const workers = {};

const rcePort2 = new MessageChannel().port2;

function newWrappedWorker (name, options = {}) {
	if (typeof name !== 'string') {
		throw new TypeError('name must be of type string');
	}
	if (Object.keys(workers).includes(name)) {
		return;
	}
	let runningTask = false;
	let lastTaskId = 0;
	let initWorker = '';

	if (options.workerData) {
		initWorker += 'const { workerData } = require(\'worker_threads\')';
	}

	initWorker +=
`const { parentPort, MessagePort } = require('worker_threads');

const rcePort1 = new MessageChannel().port1;

parentPort.on('message', async (data) => {
	parentPort.postMessage({ output: await eval(data.func)(...data.args), id: data.id }, [rcePort1]);
});
`;

	const workerThread = new Worker(initWorker, Object.assign(options, { eval: true }));

	workerThread.once('exit', () => {
		delete workers[name];
	});

	const run = async (func, ...args) => {
		return await new Promise((resolve) => {
			const onData = (data) => {
				if (data.id + 1 !== lastTaskId) {
					return;
				}
				workerThread.off('message', onData);
				runningTask = false;
				resolve(data.output);
			};
			runningTask = true;
			workerThread.on('message', onData);
			workerThread.postMessage({ func: func.toString(), args, id: lastTaskId++, options: { type: 'func' } }, [rcePort2]);
		});
	};

	const requireFile = async (filePath) => {
		run('(filePath) => { require(filePath} }', filePath);
	};

	workers[name] = {
		run,
		requireFile,
		runningTask,
		workerThread
	};
}

module.exports = {
	newWrappedWorker,
	workers
};
