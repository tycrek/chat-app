var crypto = require('crypto');
var bcrypt = require('bcrypt');
var uuidv4 = require('uuid/v4');
var fse = require('fs-extra');

var Utils = require('./utils');

// Generate a Bcrypt hash of the provided password. Salt is generated by Bcrypt library.
// Salt rounds set in config.json
exports.generateHash = (password) => {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(Utils.config().security.saltRounds)
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

// Generate a V4 UUID
exports.generateUuid = () => uuidv4();

// Generate a hex token of length 32 (string length = 64 after converting bytes to hex)
exports.generateToken = (length = Utils.config().security.tokenLength) => crypto.randomBytes(length).toString('hex');

// Check if the password meets the requirements
exports.passwordMeetsRequirements = (password) => {
	let MIN_LENGTH = 12;
	let MIN_EACH = 1;
	let LOWER = new RegExp(/[a-z]/g);
	let UPPER = new RegExp(/[A-Z]/g);
	let NUMBER = new RegExp(/[0-9]/g);
	let SYMBOL = new RegExp(/[ `~!@#$%^&*()\-_=+\[{\]}\\|;:'",<.>\/?]/g);
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

// Generate public/private keypairs
exports.generateKeyPair = (password) => {
	return new Promise((resolve, reject) => {
		crypto.generateKeyPair('rsa', {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: 'pkcs1',
				format: 'pem'
			},
			privateKeyEncoding: {
				type: 'pkcs1',
				format: 'pem',
				cipher: 'aes-256-cbc',
				passphrase: password
			}
		}, (err, publicKey, privateKey) => {
				if (err) reject(err);
				else resolve([publicKey, privateKey]);
		});
	})
}

// Encrypt data with public key
//TODO: Move to client-side
exports.encrypt = (data, publicKey) => {
	let buffer = Buffer.from(data);
	let encrypted = crypto.publicEncrypt(publicKey, buffer);
	return encrypted.toString('base64');
}

// Decrypt data with private key
//TODO: Move to client-side
exports.decrypt = (data, privateKey, password) => {
	let buffer = Buffer.from(data, 'base64');
	let decrypted = crypto.privateDecrypt({
		key: privateKey,
		passphrase: password
	}, buffer);
	return decrypted.toString('utf8');
}