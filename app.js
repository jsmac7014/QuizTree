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
const addAccount = (email, password, nick, token) => {
	return createQuery(`INSERT INTO account SET ?`, {
		email: email,
		password: password,
		nick: nick,
		token: token
	});
};
const addQuiz = (account, info, tags) => {
	if (createQuery(`INSERT INTO quizes SET ?`, {
			id: '',
			account: account,
			information: info
		}) == DBERROR) return DBERROR;
	tags.forEach(v => {
		const r = createQuery(`INSERT INTO tags SET ?`, {
			id: '',
			tag: v
		});
	});
	return DBSUCCESS;
};
const getUID = email => {
	return DB.query(`SELECT * FROM account WHERE email='${email}'`, (err, result) => {
		if (err) return DBERROR;
		return result[0].uid;
	});
};
const getToken = email => {
	return DB.query(`SELECT * FROM account WHERE email='${email}'`, (err, result) => {
		if (err) return DBERROR;
		return result[0].token;
	});
};
const setToken = (email, token) => {
	return DB.query(`UPDATE account SET token='${token}' WHERE email='${email}'`, (err, result) => {
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
const getAccount = param => {
	return DB.query(`SELECT * FROM account WHERE ?`, param, (err, result) => {
		if (err) return DBERROR;
		if (result.length < 0) return DBNONRESULT;
		return result[0];
	});
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
	return [Array(num).keys()].map(v => {
		return callback(callbackdata);
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
		isLogin: isLogin(req)
	});
});
app.get('/login', (req, res) => {
	if (!isLogin(req)) res.render('login', {
		usermsg: ifIsContainReturnUserMsg(req)
	});
	else res.render(URL('/'));
});
app.post('/login', (req, res) => {
	const userdata = getAccount({
		email: req.body.email,
		password: sha512(req.body.password + DBPassword)
	});
	req.session.usermsg = userdata == DBNONRESULT ? '사용자 정보가 잘못되었습니다.' : (userdata == DBERROR ? '죄송합니다. DB 에러입니다.' : '');
	if (req.session.usermsg !== '') res.redirect(URL('/login'));
	const token = sha512('' + req.body.email + new Date().getMilliseconds() + new Date().getTime());
	setToken(req.body.email, token);
	if (token === DBERROR) {
		req.session.usermsg = '로그인에 실패하였습니다. 다시 시도하세요.';
		res.redirect(URL('/login'));
	} else {
		req.session.token = token;
		req.session.username = userdata.nick;
		res.redirect(URL('/'));
	}
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
	res.render('mypage', {});
});
app.get('/email', (req, res) => {
	if (isContains(req.query, 'query')) {
		if (equalToken(req.query.query)) res.redirect('/?msg=success');
		else res.redirect('/?msg=err');
	} else res.redirect('/?msg=err');
});
app.get('/make', (req, res) => {
	if (isLogin(req)) res.render('make', {});
	else res.redirect('/login');
});
app.post('/make', (req, res) => {
	req.session.usermsg = addQuiz(req.session.email, {
		title: req.body.title,
		info: req.body.info,
		radio: mapRange(req.body.quizs, (v, data) => {
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
	}, mapRange(req.body.quizs, (v, data) => {
		return data['tags' + v];
	}, req.body)) == DBERROR ? '퀴즈생성에 실패하였습니다.' : '';
	res.redirect(URL('/make'));
});
app.get('/play', (req, res) => {
	res.render('play', {});
});
const server = require('https').createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/fullchain.pem'),
}, app).listen(443);
