/* https://github.com/Shin-JaeHeon/Chat */
const URL = 'ws://URL';
const nick = prompt('Input Nickname', '');
const talk = document.getElementById('talk-window');
let text_node = document.getElementById('text');
let is_reply;
let reply_text;
let reply_nick;
var webSocket = new WebSocket(URL);
webSocket.onopen = event => {
	webSocket.send(JSON.stringify(new sys_msg_jq('join', `${nick} is joined.`, nick)));
};

function enterKey(event) {
	if (event.charCode == 13 || event == 13) {
		if (text_node.value !== '') {
			if (is_reply) {
			document.getElementsByClassName("reply-bar").remove();
			document.getElementsByClassName("reply-text").remove();
			document.getElementsByClassName("reply-nick").remove();
				webSocket.send(JSON.stringify({
					'nick': nick,
					'msg': text_node.value,
					'time': date_ko(new Date()),
					'type': 'reply',
					'reply': reply_text,
					'reply-nick': reply_nick
				}));
			} else {
				webSocket.send(JSON.stringify({
					'nick': nick,
					'msg': text_node.value,
					'time': date_ko(new Date()),
					'type': 'msg'
				}));
			}
			text_node.value = '';
			reply_nick='';
			reply_text='';
			is_reply=false;

		} else {
			alert('Please enter the message.');
		}
	}
}

function reply_l(div) {
	div.addEventListener('click', event => {
		const event_text = div.getElementsByClassName('chat-msg')[0].innerHTML.split('<a href="#msg')[0];
		const event_nick = div.getElementsByClassName('chat-nick')[0].innerHTML;
		document.getElementsByClassName("reply-bar").remove();
		document.getElementsByClassName("reply-text").remove();
		document.getElementsByClassName("reply-nick").remove();
		document.getElementById('reply-br').remove();
		if (is_reply && event_text.substr(0, event_text.length > 39 ? 39 : event_text.length) == reply_text && event_nick == reply_nick) {
			is_reply = false;
		} else {
			let bar = document.createElement('div');
			bar.className = 'reply-bar';
			let intext = document.createElement('div');
			intext.className = 'reply-text';
			let innick = document.createElement('div');
			innick.className = 'msg-reply-nick';
			reply_text = event_text.substr(0, event_text.length > 39 ? 39 : event_text.length);
			reply_nick = event_nick;
			intext.appendChild(document.createTextNode(reply_text));
			document.getElementById('chatting').insertBefore(innick, text_node);
			document.getElementById('chatting').insertBefore(bar, text_node);
			document.getElementById('chatting').insertBefore(intext, text_node);
			document.getElementById('chatting').insertBefore(document.createElement('br').setAttribute('id','#reply-br'),text_node);
			is_reply = true;
		}
	});
}
webSocket.onmessage = event => {
	let msg = JSON.parse(event.data);
	switch (msg.type) {
		case 'text':
			addMsg(msg.msg, msg.nick, msg.time, '');
			break;
		case 'reply-text':
			addMsg(msg.msg, msg.nick, msg.time, (id,msgbox,method) => {
				let a = document.createElement('a');
				a.setAttribute('href',`#${id}`);
				let bar = document.createElement('div');
				bar.className = 'msg-reply-bar';
				let innick = document.createElement('div');
				innick.className = 'msg-reply-nick';
				innick.appendChild(document.createTextNode(msg["reply-nick"]));
				let intext = document.createElement('div');
				intext.className = 'msg-reply-text';
				let inbox = document.createElement('div');
				inbox.className = 'msg-reply';
				intext.appendChild(document.createTextNode(msg.reply));
				inbox.appendChild(innick);
				inbox.appendChild(bar);
				inbox.appendChild(intext);
				a.appendChild(inbox);
				msgbox.appendChild(a);
				method(msgbox);
			});
			break;
		case 'join':
			addSysMsg(msg.msg);
			break;
	}
};

function date_ko(date) {
	return `${date.getHours()}h ${date.getMinutes()}m ${date.getSeconds()}s`;
}

function addMsg(msg, n, time, method) {
	let chat = document.createElement('div');
	chat.className = "user-chat";
	let id =  `msg-${n}-${new Date().getTime()}`;
	chat.setAttribute("id", id);
	reply_l(chat);
	let msgbox = document.createElement('p');
	msgbox.className = "chat-msg";
	msgbox.appendChild(document.createTextNode(msg));
	let timebox = document.createElement('span');
	timebox.className = 'chat-time';
	timebox.appendChild(document.createTextNode(time));
	let nickbox = document.createElement('span');
	nickbox.className = 'chat-nick';
	nickbox.appendChild(document.createTextNode(n));
	chat.appendChild(timebox);
	chat.appendChild(nickbox);
	if(n!=nick){
        var noti = new Notification(`${n} : ${time} `,{body:msg,tag:'msg'});
        noti.onclick= ()=>{ window.focus();noti.close(); };
    }
	if (method !== '') {
		method(id,msgbox,(msgbox) => {
			chat.appendChild(msgbox);
			talk.appendChild(chat);
			var tw = document.getElementById('talk-window');
			tw.scrollTop = tw.scrollHeight;
		});
	} else {
		chat.appendChild(msgbox);
		talk.appendChild(chat);
		var tw = document.getElementById('talk-window');
		tw.scrollTop = tw.scrollHeight;
	}
}
Element.prototype.remove = function () {
	this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
	for (var i = this.length - 1; i >= 0; i--) {
		if (this[i] && this[i].parentElement) {
			this[i].parentElement.removeChild(this[i]);
		}
	}
};
function msg(nickname, msg, time, t, r) {
	this.nick = nickname;
	this.msg = msg;
	this.time = time;
	this.type = t;
	this.reply = r;
}
