/*jshint es3: false, es5: false, esnext: true, moz: true, node: true*/
const Express = require('express');
const MariaDB = require('mysql');
const Path = require('path');
const fs = require('fs');
const Crypto = require('crypto');
const Logger = require('morgan');
const Striptags = require('striptags');
const CookieParser = require('cookie-parser');
const BodyParser = require('body-parser');
const Useragent = require('express-useragent');
const Passport = require('passport');
const ExpressSession = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const app = Express();
const DBERROR = 'DBERROR';
const DBSUCCESS = 'DBSUECCSS';
const DBNONRESULT = 'DBNONRESULT';
const mailer = require('express-mailer');
const shortID = require('shortid');
const AUTH = {
	user: fs.readFileSync('/home/ubuntu/QuizTree/EMAIL_ID'),
	pass: fs.readFileSync('/home/ubuntu/QuizTree/EMAIL_PW'),
};
const DBPassword = fs.readFileSync('/home/ubuntu/QuizTree/DBpassword');
const DB = MariaDB.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'quiztree',
	password: DBPassword,
	database: 'quiztree'
});
const createQuery = (query, params) => {
	return DB.query(query, params, (err, result) => {
		if (err) return DBERROR;
		if (result.length < 0) return DBNONRESULT;
		return DBSUCCESS;
	});
};
const getQuizListByAccount = email => {
	return DB.query(`SELECT * quizs WHERE account = ${DB.escape(email)} ORDER BY timestp DESC LIMIT 0,9999`, (err, result) => {
		if (err) return DBERROR;
		if (result.length < 0) return DBNONRESULT;
		return result;
	});
};
const addAccount = (email, password, nick, token) => {
	return createQuery(`INSERT INTO account SET ?`, {
		email: email,
		password: password,
		nick: nick,
		token: token
	});
};
const addQuiz = (id, account, title, info, tags) => {
	if (createQuery(`INSERT INTO quizes SET ?`, {
			id: id,
			account: account,
			title: title,
			information: JSON.stringify(info),
			time: new Date().getTime()
		}) == DBERROR) return DBERROR;
	tags.forEach(v => {
		if (v !== '') {
			const r = createQuery(`INSERT INTO tags SET ?`, {
				id: id,
				tag: v
			});
		}
	});
	return DBSUCCESS;
};
const getToken = email => {
	return DB.query(`SELECT * FROM account WHERE email=${DB.escape(email)}`, (err, result) => {
		if (err) return DBERROR;
		return result[0].token;
	});
};
const setToken = (email, token) => {
	return DB.query(`UPDATE account SET token='${token}' WHERE email=${DB.escape(email)}`, (err, result) => {
		if (err) return DBERROR;
		return DBSUCCESS;
	});
};
const equalToken = token => {
	const r = createQuery(`SELECT * FROM account WHERE ?`, {
		token: token
	});
	return r == DBERROR || r == DBNONRESULT ? false : true;
};
const isContains = (it, found) => {
	return Object.keys(it).indexOf(found) > -1 ? true : false;
};
const URL = route => {
	return "https://quiztree.xyz" + route;
};
const sha512 = key => {
	return Crypto.createHash('sha512').update(key).digest("hex");
};
const isLogin = req => {
	if (isContains(req.session, 'token'))
		if (equalToken(req.session.token)) return true;
	return false;
};
const ifIsContainReturnUserMsg = req => {
	return req.session.usermsg === undefined ? '' : req.session.usermsg;
};
const mapRange = (num, callback, callbackdata) => {
	return [...Array(num).keys()].map(v => {
		return callback(v, callbackdata);
	});
};
app.set('trust proxy', true);
app.set('views', Path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.enable('view cache');
app.use(Express.static('public'));
app.use(Logger('dev'));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({
	extended: false
}));
app.use(CookieParser());
app.use(session({
	store: new RedisStore({
		host: 'localhost',
		port: 6379
	}),
	key: 'sid',
	resave: false,
	saveUninitialized: true,
	secret: 'quiz@tree.is.abcdefghijklnmopqrstuvwxyz.of.quiz',
	cookie: {
		maxAge: 1000 * 60 * 60
	}
}));
app.use((req, res, next) => {
	req.session.usermsg = '';
	if (isContains(req.query, 'msg')) {
		if (req.query.msg == 'success') req.session.usermsg = '이메일인증에 성공하였습니다.';
		else if (req.query.msg == 'err') req.session.usermsg = '이메일인증에 실패하였습니다.';
	}
	next();
});
mailer.extend(app, {
	from: 'quiztreehelp@gmail.com',
	host: 'smtp.gmail.com', // hostname
	secureConnection: true, // use SSL
	port: 465, // port for secure SMTP
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
	auth: AUTH
});
app.get('/', (req, res) => {
	res.render('index', {
		usermsg: ifIsContainReturnUserMsg(req),
		isLogin: isLogin(req),
		username: req.session.username,
		token: req.session.token
	});
});
app.get('/login', (req, res) => {
	if (!isLogin(req)) res.render('login', {
		usermsg: ifIsContainReturnUserMsg(req)
	});
	else res.render(URL('/'));
});
app.post('/login', (req, res) => {
	DB.query(`SELECT * FROM account WHERE email = ${DB.escape(req.body.email)} AND password = '${sha512(req.body.password+DBPassword)}'`, (err, result) => {
		if (err !== null) {
			req.session.usermsg = '로그인에 실패하였습니다.';
		}
		if (result.length === 0) {
			req.session.usermsg = '사용자 정보가 잘못되었습니다.';
		}
		if (req.session.usermsg !== '') {
			res.redirect(URL('/login'));
		} else {
			const token = sha512('' + req.body.email + new Date().getMilliseconds() + new Date().getTime());
			DB.query(`UPDATE account SET token='${token}' WHERE email=${DB.escape(req.body.email)}`, (err2, result2) => {
				if (err !== null) {
					req.session.usermsg = '로그인에 실패하였습니다.';
				}
				if (req.session.usermsg !== '') {
					res.redirect(URL('/login'));
				} else {
					req.session.token = token;
					req.session.username = result[0].nick;
					req.session.email = req.body.email;
					res.redirect(URL('/'));
				}
			});
		}
	});
});
app.post('/register', (req, res) => {
	const token = sha512(req.body.email + new Date().getMilliseconds() + req.body.password + new Date().getTime());
	req.usermsg = addAccount(req.body.email, sha512(req.body.password + DBPassword), req.body.name, token) != DBERROR ? '' : '회원가입에 실패하였습니다. 다시 시도하세요.';
	app.mailer.send('email', {
		to: req.body.email,
		subject: 'QuizTree 이메일 인증 안내',
		name: req.body.name,
		link: URL('/email/?query=' + token),
		ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress,
	}, err => {
		if (err) throw err;
	});
	res.redirect(URL('/login'));
});
app.get('/register', (req, res) => {
	if (!isLogin(req)) res.render('register', {
		usermsg: ifIsContainReturnUserMsg(req)
	});
	else res.redirect(URL('/'));
});
app.get('/mypage', (req, res) => {
	if (isLogin(req)) res.render('mypage', {
		usermsg: ifIsContainReturnUserMsg(req),
		username: req.session.username,
		token: req.session.token
	});
	else res.redirect('/login');
});
app.get('/email', (req, res) => {
	if (isContains(req.query, 'query')) {
		if (equalToken(req.query.query)) res.redirect('/?msg=success');
	} else res.redirect('/?msg=err');
});
app.get('/make', (req, res) => {
	if (isLogin(req)) res.render('make', {
		token: req.session.token
	});
	else res.redirect('/login');
});
app.get('/logout', (req, res) => {
	req.session.destroy();
	res.clearCookie('sid');
	res.redirect('back');
});
app.post('/make', (req, res) => {
	req.session.usermsg = addQuiz(shortID.generate(), req.session.email, req.body.title, {
		info: req.body.info,
		radio: mapRange(parseInt(req.body.quizs), (v, data) => {
			return data['answerradio' + v];
		}, req.body),
		radioText: mapRange(req.body.quizs, (v, data) => {
			return {
				a: data['answerradio' + v],
				b: data['answerradio' + v],
				c: data['answerradio' + v],
				d: data['answerradio' + v]
			};
		}, req.body),
		questions: mapRange(req.body.quizs, (v, data) => {
			return data['questions' + v];
		}, req.body)
	}, req.body.tags.split('#')) == DBERROR ? '퀴즈생성에 실패하였습니다.' : '';
	res.redirect(URL('/make'));
});
app.get('/play/:id', (req, res) => {
	if (isLogin(req)) {
		res.render('play', {});
	} else res.redirect('/login');
});
app.pos('/search', (req, res) => {
	if (isLogin(req)) {
		res.redirect(URL('/search/' + req.body.word));
	} else res.redirect('/login');
});
app.get('/search/:key', (req, res) => {
	if(req.session.search ==DBERROR){

	}
	if (!isLogin(req)) {
		res.redirect('/login');
	} else {
		const list = [];
		DB.query(`SELECT * FROM quizes WHERE title LIKE %${req.params.key}%`, (err, result) => {
			DB.query(`SELECT * FROM tags WHERE tag LIKE %${req.params.key}%`, (err2, result2) => {
				if (err && err2) {
					req.session.search = DBERROR;
					res.redirect(URL('/search'));
				}
				if (result.length < 0 && result2.length < 0) {
					req.session.search = DBNONRESULT;
					res.redirect(URL('/search'));
				}
				const f = result.length < 0 ? result2 : result;
				const k = result2.length < 0 ? undefined : result2;
				f.forEach(v => {
					list[v.id] = v;
					if (k !== undefined) {
						if (k.indexOf(v.id) > -1) {
							k.remove(v.id);
						}
						k.forEach(v2 => {
							DB.query(`SELECT * FROM quizes WHERE id = ${v2.id}`, (err3, result3) => {
								if (!(err3 || result3.length < 0)) {
									if (result3.indexOf(v2.id)) list[v2.id] = v2;
								}
							});
						});
					}
				});
				res.render('result', {
					list: list
				});
			});
		});
	}
});
const HTTPS = require('https');
const server = HTTPS.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/fullchain.pem'),
}, app).listen(443);

const WebSocketServer = require('websocket').server;
const WebServer = require('https').createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/fullchain.pem'),
}).listen(5782);
let socket_server = new WebSocketServer({
	httpServer: WebServer,
	autoAcceptConnections: false
});

function UserClient(i, cli) {
	this.id = i;
	this.client = cli;
	this.sendData = data => {
		try {
			this.client.sendUTF(JSON.stringify(data));
		} catch (ex) {}
	};
}
let clients = [];
let id = 0;
socket_server.on('request', request => {
	if (request.origin.indexOf("quiztree.xyz") < 0) {
		request.reject();
		return;
	}
	let clientID = id++;
	let connection = request.accept(null, request.origin);
	clients[clientID] = new UserClient(clientID, connection);
	connection.on('message', message => {
		let data = JSON.parse(message.utf8Data);
		if (equalToken(data.token)) {
			switch (data.type) {
				case "like":
					DB.query(`UPDATE quizs SET likes = likes +1 WHERE id = ` + DB.escape(data.quizid));
					DB.query('INSERT INTO quiz_log SET ?', {
						email: data.email,
						id: data.quizid
					});
					break;
				case "likeuser":
					DB.query(`UPDATE account SET likes = likes +1 WHERE email = ` + DB.escape(data.targetemail));
					DB.query('INSERT INTO userlike_log SET ?', {
						email: data.email,
						target: data.targetemail
					});
					break;
				case "rmlike":
					DB.query(`UPDATE quizs SET likes = likes - 1 WHERE id = ` + DB.escape(data.quizid));
					DB.query('DELETE FROM quiz_log WHERE ?', {
						email: data.email,
						id: data.quizid
					});
					break;
				case "rmuser":
					DB.query(`UPDATE account SET likes = likes - 1 WHERE email = ` + DB.escape(data.email));
					DB.query('DELETE FROM  ?', {
						email: data.email,
						target: data.targetemail
					});
					break;
				case "chat":
					DB.query('INSERT INTO chat SET ?', {
						email: data.email,
						target: data.targetemail,
						msg: data.msg
					});
					break;
				default:
					break;
			}
		}
	});
});
