const addBtn = document.getElementById('addBtn');
let QuestionNumber = 0;
function createQuiz() {
	document.getElementsByClassName('wrapper')[0].innerHTML=document.getElementsByClassName('wrapper')[0].innerHTML+'<div class="quiz card"> <div class="field"> <div class="control"> <input class="input is-medium" type="text" placeholder="질문을 입력하세요" name="q'+QuestionNumber+'"> </div></div><div class="answer"> <h3 class="title is-4">정답</h3> <div class="control"> <label class="radio"> <input type="radio" name="answer" name="answerradio'+QuestionNumber+'"> A </label> <label class="radio"> <input type="radio" name="answer" name="answer'+QuestionNumber+'"> B </label> <label class="radioradio"> <input type="radio" name="answer" name="answerradio'+QuestionNumber+'"> C </label> <label class="radio"> <input type="radio" name="answer" name="answerradio'+QuestionNumber+'"> D </label> </div></div><div class="columns"> <div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 A" name="answertext'+QuestionNumber+'"> </div></div></div><div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 B" name="answertext'+QuestionNumber+'"> </div></div></div></div><div class="columns"> <div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 C" name="answertext'+QuestionNumber+'"> </div></div></div><div class="column"> <div class="field"> <div class="control"> <input class="input is-small" type="text" placeholder="옵션 D" name="answertext'+QuestionNumber+'"> </div></div></div></div></div>'
}
addBtn.addEventListener('click',createQuiz);
