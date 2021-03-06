var crypto = require('crypto');

// Encrypt raw data using a public key
// Returned data should be encoded using btoa()
// before sending to server
window.encrypt = function (data, publicKey) {
	let buffer = Buffer.from(data);
	let encrypted = crypto.publicEncrypt(publicKey, buffer);
	return encrypted.toString('base64');
};

// Decrypt data using a private key and password
window.decrypt = function (data, privateKey, password) {
	let buffer = Buffer.from(data, 'base64');
	let decrypted = crypto.privateDecrypt({
		key: privateKey,
		passphrase: password
	}, buffer);
	return decrypted.toString('utf8');
};

window.validatePassword = (password) => {
	let MIN_LENGTH = 12;
	let MIN_EACH = 1;
	let LOWER = new RegExp(/[a-z]/g);
	let UPPER = new RegExp(/[A-Z]/g);
	let NUMBER = new RegExp(/[0-9]/g);
	let SYMBOL = new RegExp(/[`~!@#$%^&*()\-_=+\[{\]}\\|;:'",<.>\/?]/g);
	let ALLOWED_CHARS = RegExp(/[A-z0-9`~!@#$%^&*()\-_=+\[{\]}\\|;:'",<.>\/?]/g);

	if (
		password.length >= MIN_LENGTH &&
		password.match(LOWER).length >= MIN_EACH &&
		password.match(UPPER).length >= MIN_EACH &&
		password.match(NUMBER).length >= MIN_EACH &&
		password.match(SYMBOL).length >= MIN_EACH &&
		password.length == password.match(ALLOWED_CHARS).length
	) return true;
	else return false;
}

window.passwordRequirements = function () {
	let requirements = `
	<pre style="text-align: left;">
	Password must meet requirements:
	- Minimum length of 12
	- Mix of upper and lower case
	- Numbers
	- Symbols
	</pre>
	`;
	return requirements;
}

window.validateUsername = (username) => {
	let MAX_LENGTH = 24;
	let MIN_LENGTH = 3;
	let REGEX = /[A-z0-9._]/g;
	let ALLOWED_CHARS = new RegExp(REGEX);

	if (
		username.length <= MAX_LENGTH &&
		username.length >= MIN_LENGTH &&
		username.length == username.match(ALLOWED_CHARS).length
	) return true;
	else return false;
}