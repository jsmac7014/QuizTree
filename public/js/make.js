const addBtn = document.getElementById('addBtn');
let QuestionNumber = 2;

function createQuiz() {
	const d = document.createElement('div');
	d.className = 'quiz card';
	d.setAttribute('id', 'card' + QuestionNumber);
	d.innerHTML = '<div class="field"> <div class="control"> <input class="input is-medium" type="text" placeholder="질문을 입력하세요" name="questions' + QuestionNumber + '"> </div></div><div class="answer"> <h3 class="title is-4">정답</h3> <div class="control"> <label class="radio"> <input type="radio" name="answerradio' + QuestionNumber + '" value="a"> A </label> <label class="radio"> <input type="radio" name="answerradio' + QuestionNumber + '" value="b"> B </label> <label class="radio"> <input type="radio" name="answerradio' + QuestionNumber + '" value="c"> C </label> <label class="radio"> <input type="radio" name="answerradio' + QuestionNumber + '" value="d"> D </label> </div></div><div class="columns"> <div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 A" name="answertexta' + QuestionNumber + '"> </div></div></div><div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 B" name="answertextb' + QuestionNumber + '"> </div></div></div></div><div class="columns"> <div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 C" name="answertextc' + QuestionNumber + '"> </div></div></div><div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 D" name="answertextd' + QuestionNumber + '"> </div></div></div></div>';
	document.getElementById('fo').appendChild(d);
	QuestionNumber++;
	document.getElementById('quizs').value = parseInt(document.getElementById('quizs').value) + 1;
}
addBtn.addEventListener('click', createQuiz);
