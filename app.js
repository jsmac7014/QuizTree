const Express = require('express');
const Mysql = require('mysql');
const Path = require('path');
const Crypto = require('crypto');
const Logger = require('morgan');
const Striptags = require('striptags');
const CookieParser = require('cookie-parser');
const BodyParser = require('body-parser');
const Useragent = require('express-useragent');
const Passport = require('passport');
const app = Express();
const isContains = (it, found) => {
	return Object.keys(it).indexOf(found) > -1 ? true : false;
};
const URL = route => {
	return "https://localhost" + route;
};
const query = (url, querys) => {
	querys.filter
}
app.set('views', Path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.enable('view cache');
app.use(Express.static('public'));
app.use(Logger('dev'));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({
	extended: false
}));
app.use(CookieParser());
app.use((req, res, next) => {
	if (isContains(req.query, 'msg')) {
		if (req.query['msg'] == "error") req.usermsg = "오류가 발생하였습니다.";
	}
	next();
});
app.get('/', (req, res) => {

});
app.get('/login', (req, res) => {

	res.render('login',{});
});
app.get('/register', (req, res) => {
	res.render('register',{});
});
app.get('/mypage', (req, res) => {
	res.render('mypage',{});
});
