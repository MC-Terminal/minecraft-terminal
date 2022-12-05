const Socks = require('socks').SocksClient;
const ProxyAgent = require('proxy-agent');
const log = require('../lib/log');

const before = (A) => {
	const proxySettings = A.settings.settings.config.config.plugins.settings.socks5Proxy;
	const minecraftHost = A.settings.options.host;
	const minecraftPort = A.settings.options.port;
	const proxyHost = proxySettings.host;
	const proxyPort = proxySettings.port;
	const proxyUsername = proxySettings.username || undefined;
	const proxyPassword = proxySettings.password || undefined;
	const stream = (client) => {
		Socks.createConnection({
			proxy: {
				host: proxyHost,
				port: proxyPort,
				userId: proxyUsername,
				password: proxyPassword,
				type: 5
			},
			command: 'connect',
			destination: {
				host: minecraftHost,
				port: Number.parseInt(minecraftPort)
			}
		}, (err, info) => {
			if (err) {
				log.error(`Proxy: ${err.message}`, 2);
				process.exit();
			}
			client.setSocket(info.socket);
			client.emit('connect');
		});
	};
	delete A.settings.options.host;
	delete A.settings.options.port;
	A.settings.options.connect = stream;
	A.settings.options.agent = new ProxyAgent({ protocol: 'socks5:', host: proxyHost, port: proxyPort });
	log.info(`Connecting with Socks5 proxy.\nhost: ${proxyHost}\nport: ${proxyPort}`, 2);
};

module.exports = {
	before,
	name: 'Socks5 Proxy'
};
