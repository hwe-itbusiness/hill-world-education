var http = require('http'),
	path = require('path'),
	JSONB = require('json-buffer'),
	crypto = require("crypto"),
	eccrypto = require("eccrypto"),
	socketio = require('socket.io'),
	express = require('express'),
	SparkPost = require('sparkpost'),
	client = new SparkPost('842aa1d4a4f5b51b5464780650a58ff82b52b2a9'),
	fs = require("fs"),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	app = express(),
	server = http.createServer(app),
	io = socketio.listen(server);

//app.set('view engine', 'pug');
//app.use(express.static(path.resolve(__dirname, 'views')));
app.use(express.static(path.resolve(__dirname, 'client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//app.get('/', function (req, res) {
//	res.render('index', {page: "Home", home: "", pageHeader: "Hill World Education"});
//});

app.get('/user/worldmail/\*', function (req, res) {
	if (req.cookies.id !== null && req.cookies.publicKey !== null) {
		fs.readFile( __dirname + "/" + "users.json", 'utf8', function(err, data) {
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(data);
			switch (req.path.split("/")[3]) {
				case "inbox":
					res.setHeader('Content-Type', 'application/json');
					res.send(data[req.cookies.id].mail.inbox);
					break;
				case "outbox":
					res.setHeader('Content-Type', 'application/json');
					res.send(data[req.cookies.id].mail.outbox);
					break;
				default:
					res.send("false");
			}
		});
	}
});

app.post('/user/worldmail/\*', function (req, res) {
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function(err, data) {
		if (err) {
			return console.log(err);
		}
		data = JSON.parse(data);
		switch (req.path.split("/")[3]) {
			case "send":
				if ("") {
					res.send(data);
				} else {
					res.send("false");
				}
				break;
		}
	});
});

app.get('/user/ids', function (req, res) {
	if (req.query.name !== null && req.query.id !== null) {
		fs.readFile( __dirname + "/" + "id.json", 'utf8', function(err, data) {
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(data);
			for (var i in data) {
				if (data[i].id == req.query.id) {
					if (data[i].name == req.query.name) {
						data[i] = {};
						fs.writeFile(__dirname + "/" + "id.json", JSON.stringify(data, null, 4), function(err) {
							if (err) {
								return console.log(err);
							}
							res.send("true");
						});
					}
				}
			}
		});
	} else {
		res.send("false");
	}
});

app.get('/user/activate', function (req, res) {
	if (req.query.id !== null && req.query.code !== null) {
		fs.readFile( __dirname + "/" + "users.json", 'utf8', function(err, data) {
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(data);
			if (data[req.query.id].activation == req.query.code) {
				data[req.query.id].activation = "BYPASS";
				fs.writeFile(__dirname + "/" + "users.json", JSON.stringify(data, null, 4), function(err) {
					if (err) {
						return console.log(err);
					}
					res.end("<html><h1>Activation Successful!</h1><a href='/login.html'>Go to login.</a></html>");
				});
			}
		});
	}
});

app.post('/user/email', function (req, res) {
	client.transmissions.send({
    	content: {
    	    from: '"Admin" <admin@hillworldenterprise.ml>',
    	    subject: 'Email Confirmation',
    	    html: req.body.message
    	},
    	recipients: [{
    	    address: req.body.email
    	}]
	}).then(data => {
		console.log(data);
		res.send("true");
	}).catch(err => {
		console.log(err);
		res.send("false");
	});
});

app.post('/user/add', function (req, res) {
	if (req.body.name === null || req.body.password === null || req.body.id === null) {
		res.send("Register Invalid");
	}
	var privateKey = crypto.randomBytes(32);
	var publicKey = eccrypto.getPublic(privateKey);
	var password = crypto.createHash("sha256").update(req.body.password).digest();
	var email = crypto.createHash("sha256").update(req.body.email).digest();
	eccrypto.sign(privateKey, password).then(function(sig) {
		var total = {
			"public": JSONB.stringify(publicKey),
			"name": req.body.name,
			"email": JSONB.stringify(email),
			"password": JSONB.stringify(sig),
			"private": JSONB.stringify(privateKey),
			"activation": req.body.activation,
			"mail": {"inbox": [], "outbox": []}
		};
		fs.readFile( __dirname + "/" + "users.json", 'utf8', function(err, data) {
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(data);
			data[req.body.id] = total;
			fs.writeFile(__dirname + "/" + "users.json", JSON.stringify(data, null, 4), function(err) {
				if (err) {
					return console.log(err);
				}
				res.send("true");
			});
		});
	});
});

app.post('/user/login', function (req, res) {
	if (req.body.user === null || req.body.public === null || req.body.password === null) {
		res.send("Signature is NOT ok");
		return console.log("Login Invalid");
	}
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function(err, data) {
		if (err) {
        	return console.log(err);
		}
		data = JSON.parse(data);
		var user = data[req.body.user];
		if (user !== undefined) {
			if (user.activation == "BYPASS") {
				eccrypto.verify(JSONB.parse(user.public), crypto.createHash("sha256").update(req.body.password).digest(), JSONB.parse(user.password)).then(function() {
					res.send(user.name + ";" + user.public);
				}).catch(function(err) {
					res.send("Signature is NOT ok");
					console.log(err);
				});
			} else {
				res.send("Signature is NOT ok");
			}
		} else {
			res.send("Signature is NOT ok");
		}
   });
});

io.on('connection', function(socket) {
	socket.emit('test', "SOCKET TEST: SUCCESSFUL");
	socket.on('check', function(socketData) {
		socketData = socketData.split(";");
		if (socketData[1] != 'undefined') {
			fs.readFile( __dirname + "/" + "users.json", 'utf8', function(err, data) {
				if (err) {
					return console.log(err);
				}
				data = JSON.parse(data);
				if (data[socketData[0]].public == socketData[1]) {
					socket.emit(socketData[0].toString(), "true");
				} else {
					socket.emit(socketData[0].toString(), "false");
				}
			});
		} else {
			socket.emit(socketData[0].toString(), "false");
		}
	});
	socket.on('disconnect', function () {
    	io.emit('user disconnected');
	});
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
	var addr = server.address();
	console.log("Server listening at", addr.address + ":" + addr.port);
});