var crypto = require('crypto');

const SERVER = 'localhost';

window.encrypt = function (data, publicKey) {
	let buffer = Buffer.from(data);
	let encrypted = crypto.publicEncrypt(publicKey, buffer);
	return encrypted.toString('base64');
};

window.decrypt = function (data, privateKey, password) {
	let buffer = Buffer.from(data, 'base64');
	let decrypted = crypto.privateDecrypt({
		key: privateKey,
		passphrase: password
	}, buffer);
	return decrypted.toString('utf8');
};

window.pageNewUser = function () {
	this.fetch('/html/newUser.html')
		.then((res) => res.text())
		.then((text) => $('#content').html(text));
};

window.pageLogin = function () {
	this.fetch('/html/login.html')
		.then((res) => res.text())
		.then((body) => $('#content').html(body));
};

window.pageChats = function () {
	this.fetch('/html/chats.html')
		.then((res) => res.text())
		.then((body) => $('#content').html(body));
};

window.signUp = function () {
	$('#loading').show();
	let username = $('#username').val();
	let password = btoa($('#password').val());

	this.fetch(`http://${SERVER}:34682/user/create/${username}/${password}`)
		.then((res) => res.json())
		.then((json) => {
			$('#loading').hide();
			if (json.code != 200) this.alert(json.reason);
			else pageLogin();
		})
		.catch((err) => console.error(err));
};

window.login = function () {
	$('#loading').show();
	let username = $('#username').val();
	let password = btoa($('#password').val());

	this.fetch(`http://${SERVER}:34682/user/login/${username}/${password}`)
		.then((res) => res.json())
		.then((json) => {
			$('#loading').hide();
			if (json.code != 200) this.alert(json.reason);
			else {
				let token = json.data.token;
				console.log(token);
				Cookies.set('token', token, { expires: 7 });
				pageChats();
			}
		});
}

window.listChats = function () {
	let token = Cookies.get('token');
	if (token == null) alert('Please sign in');
	else {
		this.fetch(`http://${SERVER}:34682/chats/list?token=${token}`)
			.then((res) => res.json())
			.then((json) => {
				$('#loading').hide();
				if (json.code != 200) this.alert(json.reason);
				else {
					$('#chat-list').html(JSON.stringify(json.data.chats, null, 4));
				}
			});
	}
}

window.createChat = function () {
	let token = Cookies.get('token');
	if (token == null) alert('Please sign in');
	else {
		let recipient = $('#recipient').val();

		this.fetch(`http://${SERVER}:34682/chats/create/${recipient}?token=${token}`)
			.then((res) => res.json())
			.then((json) => {
				if (json.code != 200) this.alert(json.reason);
				else return json.data.chatId;
			})
			.then((chatId) => sendMessage(chatId));
	}
}

window.sendMessage = function (chatId) {
	let token = Cookies.get('token');
	if (token == null) alert('Please sign in');
	else {
		let message = $('#message').val();
		let recipient = $('#recipient').val();

		this.fetch(`http://${SERVER}:34682/keypairs/public/${recipient}?token=${token}`)
			.then((res) => res.json())
			.then((json) => {
				if (json.code != 200) this.alert(json.reason);
				else return json.data.pubKey;
			})
			.then((pubKey) => encrypt(message, pubKey))
			.then((encrypted) => this.btoa(encrypted))
			.then((encoded) => this.fetch(`http://${SERVER}:34682/messages/create/${chatId}/${encoded}?token=${token}`))
			.then((res) => res.json())
			.then((json) => {
				if (json.code != 200) this.alert(json.reason);
				else alert(json.reason);
		})
	}
}