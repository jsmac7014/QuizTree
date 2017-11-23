/*jshint es3: false, es5: false, esnext: true, moz: true, node: true*/
let MariaDB = require('mysql');
let fs = require('fs');
const app = require('express')();
let DBPassword = fs.readFileSync('/home/ubuntu/QuizTree/DBpassword');
let DB = MariaDB.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'quiztree',
	password: DBPassword,
	database: 'quiztree'
});

const DBERROR = 'DBERROR';
const DBSUCCESS = 'DBSUECCSS';
const DBNONRESULT = 'DBNONRESULT';
const createQuery = (query, params) => {
	return DB.query(query, params, (err, result) => {
		if (err) return DBERROR;
		if (result.length < 0) return DBNONRESULT;
		return DBSUCCESS;
	});
};
const equalToken = token => {
	const r = createQuery(`SELECT * FROM account WHERE ?`, {
		token: token
	});
	return r == DBERROR || r == DBNONRESULT ? false : true;
};
let options = {
	key: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/quiztree.xyz/fullchain.pem'),
};

const server = require('https').createServer(options, app);
const io = require('socket.io')(server);
server.listen(5782);
io.sockets.on('connection', socket => {
	socket.on('like', data => {
		if (equalToken(data.token)) {
			DB.query(`UPDATE quizes SET likes = likes + 1 WHERE id = ` + DB.escape(data.quizid),(err,result)=>{
			});
		}
	});
	socket.on('rmlike', data => {
		if (equalToken(data.token)) {
			DB.query(`UPDATE quizes SET likes = likes - 1 WHERE id = ` + DB.escape(data.quizid));
		}
	});
});
