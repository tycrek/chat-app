var fse    = require('fs-extra');
var uuidv4 = require('uuid/v4');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var moment = require('moment');

var Psql = require('./sql/psql');
var utils = this;

var config = {};
exports.config = () => config;

// Initialize the server (read configs and connect to SQL)
exports.init = () => {
	return new Promise((resolve, reject) => {
		_readConfig()
			.then(() => _connectSql())
			.then(() => resolve(utils.config().server))
			.catch((err) => reject(err));
	});

	function _readConfig() {
		return new Promise((resolve, reject) => fse.readJson(utils.getPath('config.json'), (err, data) => err ? reject(err) : (config = data, resolve())));
	}

	function _connectSql() {
		return new Promise((resolve, reject) => {
			Psql.init()
				.then(() => resolve())
				.catch((err) => reject(err));
		});
	}
}

// Return full path for given filename. Calls from other directories must also specify directory.
exports.getPath = (filename) => require('path').join(__dirname, filename);

// Encode a string as Base64
exports.str2b64 = (str) => Buffer.from(str).toString('base64');

// Decode Base64 data into a string
exports.b642str = (str) => Buffer.from(str, 'base64').toString();

// Generate a V4 UUID
exports.generateUuid = () => uuidv4();

// Generate a hex token of length 32 (string length = 64 after converting bytes to hex)
exports.generateToken = (length = 32) => crypto.randomBytes(length).toString('hex');

// Generate a Bcrypt hash of the provided password. Salt is generated by Bcrypt library.
// Salt rounds set in config.json
exports.generateHash = (password) => {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(this.config().saltRounds)
			.then((salt) => bcrypt.hash(password, salt))
			.then((hash) => resolve(hash))
			.catch((err) => reject(err));
	});
}

// Compare a password with a hash
exports.comparePassHash = (password, hash) => {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, hash)
			.then((same) => resolve(same))
			.catch((err) => reject(err));
	});
}

// Check if the password meets the requirements
exports.passwordMeetsRequirements = (password) => {
	let MIN_LENGTH = 12;
	let MIN_EACH   = 2;
	let LOWER      = new RegExp(/([a-z])/g);
	let UPPER      = new RegExp(/[A-Z]/g);
	let NUMBER     = new RegExp(/[0-9]/g);
	let SYMBOL     = new RegExp(/[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g);
	//TODO: Fix regex (do I need to have () or not?)
	//TODO: Any characters not included in the above should be denied (maybe?)

	if (
		password.length >= MIN_LENGTH &&
		password.match(LOWER).length >= MIN_EACH &&
		password.match(UPPER).length >= MIN_EACH &&
		password.match(NUMBER).length >= MIN_EACH &&
		password.match(SYMBOL).length >= MIN_EACH
	) return true;
	else return false;
}

// Send an Express response
// (with multiple routers, having this done here makes more sense)
exports.respond = (res, payload, status = 200, type = 'json') => {
	res.status(status);
	res.type(type);
	res.send(payload);
}

// Return the current UTC timestamp in Unix format
exports.utcStamp = () => moment.utc().format('x');

// Convert the provided timestamp into Unix format as UTC time
exports.tdFormat = (td, f) => moment(td, f).utc().format(f);

// Validate if a token is permitted to access the requested resource
exports.validate = (req) => {
	return new Promise((resolve, reject) => {
		let path = req.path;
		let token = req.query.token;

		if (_isPublicRoute(path)) return resolve();
		if (token == null) return reject(utils.config().response.unauthorized);

		Psql.sessionGet(token).then((dataset) => {
			if (dataset.length === 0) reject();
			else {
				let now = utils.utcStamp();
				let expiry = utils.tdFormat(dataset[0].expiry, 'x');
				if (expiry > now) resolve();
				else reject(utils.config().response.forbidden);
			}
		})//TODO: this needs a catch
	});

	function _isPublicRoute(path) {
		let routes = utils.config().publicRoutes;
		for (i = 0; i < routes.length; i++) {
			route = routes[i];
			if (path === '/' || path.includes(route)) return true;
		}
		return false;
	}
}

// Build a JSON response object to send to clients
exports.buildResponse = (code, reason, data={}) => {
	let response = {
		code: code,
		reason: reason,
		data: data
	};

	return response;
}