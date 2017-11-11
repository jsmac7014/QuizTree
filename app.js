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
const admin = require("firebase-admin");
const ServiceAccount = require("./quiztree-dec33-firebase-adminsdk-nvlcd-8971655489.json");
const filrebaseApp = admin.initializeApp({
	credential: admin.credential.cert(ServiceAccount),
	databaseURL: "https://quiztree-dec33.firebaseio.com/"
});
const DBERROR = 'DBERROR';
const DBSUCCESS = 'DBSUECCSS';
const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/fullchain.pem'),
};
const DB = MariaDB.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'quiztree',
	password: fs.readFileSync('/home/ubuntu/QuizTree/DBpassword'),
	database: 'quiztree'
});
const addUID = async(email, uid) => {
	return DB.query(`INSERT INTO account (emai,uid) VALUES('${email}','${uid}');`, (err, result) => {
		if (err) return DBERROR;
		return DBSUCCESS;
	});
};
const getUID = email => {
	return DB.query(`SELECT * account WHERE email='${email}'`, (err, result) => {
		if (err) return DBERROR;
		return result[0].uid;
	});
};
const getToken = async email => {
	return DB.query(`SELECT * account WHERE email='${email}'`, (err, result) => {
		if (err) return DBERROR;
		return result[0].token;
	});
};
const setToken = async token => {
	return DB.query(`UPDATE account SET token='${token}'`, (err, result) => {
		if (err) return DBERROR;
		return result[0].token;
	});
};
const defaultAuth = admin.auth();
const db = admin.database();
const ref = db.ref("restricted_access/secret_document");
const query = (url, querys) => {
	querys.filter();

};
const isContains = (it, found) => {
	return Object.keys(it).indexOf(found) > -1 ? true : false
};
const URL = route => {
	return "https://quiztree.xyz" + route
};
const sha512 = key => {
	return Crypto.createHash('sha512').update(key).digest("hex")
};
const isLogin = req => {
	if (req.session.token == getToken(req.session.email)) return true;
	else return false;
}
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
	if (req.session.token != undefined) {

	}
	next();
});
app.get('/', (req, res) => {
	res.render('index', {});
});
app.get('/login', (req, res) => {
	if (!isLogin(req)) res.render('login', {});
	else res.render(URL('/'));
});
app.post('/login', (req, res) => {
	const uid = getUID(req.body.session);
	admin.auth().getUser(uid).then(userRecord => {
		console.log(userRecord);
		const data = userRecord.toJSON();
		req.session.username = data.displayName;
		const token = setToken(sha512(username + "/" + new Date().getTime()));
		if (token == DBERROR) {
			req.session.usermsg = '로그인에 실패하였습니다. 다시 시도하세요.';
			res.redirect(URL('/login'));
		} else {
			req.session.token = token;
			res.redirect(URL('/'));
		}
	}).catch(error => {
		req.session.usermsg = '로그인에 실패하였습니다. 다시 시도하세요.';
		res.redirect(URL('/login'));
	});
});
app.post('/register', (req, res) => {
	admin.auth().createUser({
			email: req.body.email,
			emailVerified: false,
			password: sha512(req.body.password),
			photoURL: 'https://quiztree.xyz/img/QuizTree@2.png',
			displayName: req.body.name,
			disabled: false,
		})
		.then(userRecord => {
			addUID(req.body.email, userRecord.uid).then(v => req.session.dbmsg = v == DBERROR ? 'DB ERROR' : '');
			res.redirect(URL('/login'))
		})
		.catch(error => {
			throw error;
			req.session.usermsg = '오류로 인해 계정을 생성하지 못하였습니다. 다시 시도하세요.';
			res.redirect(URL('/register'))
		});
});
app.get('/register', (req, res) => {
	if (!isLogin(req)) res.render('register', {});
	else res.render(URL('/'));
});
app.get('/mypage', (req, res) => {
	res.render('mypage', {});
});
app.get('/make', (req, res) => {
	res.render('make', {});
});
app.get('/play', (req, res) => {
	res.render('play', {});
});
const https = require('https');
const server = https.createServer(options, app).listen(443);
