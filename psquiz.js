async function getJsonFileList() {
    const response = await fetch('jsonFilesList.json');
    const jsonFiles = await response.json();

    const jsonFilesList = document.getElementById('jsonFilesList');

    jsonFiles.forEach((fileName) => {
        const link = document.createElement('a');
        link.href = '#';
        link.innerText = fileName;
        link.addEventListener('click', () => startQuiz(fileName));
        jsonFilesList.appendChild(link);
        jsonFilesList.appendChild(document.createElement('br'));
    });
}

async function getQuestions(fileName) {
    const response = await fetch(fileName);
    const data = await response.json();
    return data.questions;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const showAllButton = document.getElementById('showAllButton');
const quizContainer = document.getElementById('quiz-container');
const questionContainer = document.getElementById('question-container');
const submitButton = document.getElementById('submit-button');

let currentQuestionIndex = 0;
let shuffledQuestions = [];
let score = 0;

async function startQuiz(fileName) {
    const questions = await getQuestions(fileName);
    shuffledQuestions = [...questions];
    shuffleArray(shuffledQuestions);

    quizContainer.style.display = 'block';

    currentQuestionIndex = 0;
    score = 0;

    showQuestion(shuffledQuestions[currentQuestionIndex]);
}

function showQuestion(question) {
    questionContainer.innerHTML = '';

    const questionCard = document.createElement('div');
    questionCard.className = 'card mb-3';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.innerText = question.text;

    questionCard.appendChild(cardHeader);

    const shuffledChoices = [...question.choices];
    shuffleArray(shuffledChoices);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    shuffledChoices.forEach((choice, index) => {
        const mainDiv = document.createElement('div');
        mainDiv.className = 'form-check';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = shuffledChoices.indexOf(choice);
        input.className = 'form-check-input';
        input.id = `choice-${index}`;

        const label = document.createElement('label');
        label.innerText = choice;
        label.className = 'form-check-label';
        label.setAttribute('for', `choice-${index}`);

        mainDiv.appendChild(input);
        mainDiv.appendChild(label);

        cardBody.appendChild(mainDiv);
    });

    questionCard.appendChild(cardBody);
    questionContainer.appendChild(questionCard);
}

function selectAnswer(choiceIndex) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (choiceIndex === currentQuestion.answer) {
        score++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < shuffledQuestions.length) {
        showQuestion(shuffledQuestions[currentQuestionIndex]);
    } else {
        showResult();
    }
}

function showResult() {
    quizContainer.innerHTML = `<div class="shadow-lg p-3 mb-5 bg-white rounded">Your Score: ${score} out of ${shuffledQuestions.length}</div>`;

    const reviewButton = document.createElement('button');
    reviewButton.innerText = 'Review Answers';
    reviewButton.className = 'btn btn-success';
    reviewButton.addEventListener('click', () => showReview());
    quizContainer.appendChild(reviewButton);
}

function showReview() {
    quizContainer.innerHTML = '<div class="alert alert-success" role="alert"> <h4 class="alert-heading">Great job...! Keep Learning...!</h4></div>';

    shuffledQuestions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.classList.add('card', 'mb-4');

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header', 'font-weight-bold');
        cardHeader.innerText = `${index + 1}. ${question.text}`;

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        question.choices.forEach((choice, choiceIndex) => {
            const formCheckDiv = document.createElement('div');
            formCheckDiv.classList.add('form-check', 'mb-2');

            const input = document.createElement('input');
            input.type = 'radio';
            input.disabled = true;
            input.checked = choiceIndex === question.userAnswer;
            input.classList.add('form-check-input');
            input.id = `choice-${index}-${choiceIndex}`;

            const label = document.createElement('label');
            label.innerText = choice;
            label.classList.add('form-check-label');

            if (choiceIndex === question.userAnswer) {
                formCheckDiv.classList.add('user-answer');
            }

            if (question.userAnswer === question.answer) {
                label.classList.add('text-success');
            } else if (choiceIndex === question.answer) {
                label.classList.add('text-danger');
            } else if (choiceIndex === question.userAnswer) {
                label.classList.add('text-info');
            }

            formCheckDiv.appendChild(input);
            formCheckDiv.appendChild(label);
            cardBody.appendChild(formCheckDiv);
        });

        questionCard.appendChild(cardHeader);
        questionCard.appendChild(cardBody);
        quizContainer.appendChild(questionCard);
    });
}

submitButton.addEventListener('click', () => {
    const selectedChoice = document.querySelector('input[name="answer"]:checked');
    if (selectedChoice) {
        const choiceIndex = parseInt(selectedChoice.value);
        selectAnswer(choiceIndex);
    }
});

showAllButton.addEventListener('click', showAllQuestionsAndAnswers);

function showAllQuestionsAndAnswers() {
    currentQuestionIndex = 0;

    function showQuestionAndAnswers() {
        const question = shuffledQuestions[currentQuestionIndex];

        const questionDiv = document.createElement('div');
        questionDiv.classList.add('review-question', 'card', 'text-bg-info', 'mb-3');
        questionDiv.style = "max-width: 36rem;";

        questionDiv.innerHTML = `<div class="card-header">${currentQuestionIndex + 1}. ${question.text}</div>`;

        question.choices.forEach((choice, choiceIndex) => {
            const mainDiv = document.createElement('div');
            mainDiv.className = "form-check";

            const choiceDiv = document.createElement('div');
            choiceDiv.classList.add('review-choice', 'card-body');

            const label = document.createElement('label');
            label.innerText = choice;
            label.className = 'form-check-label';

            if (choiceIndex === question.answer) {
                label.classList.add('correct');
            }

            choiceDiv.appendChild(label);
            questionDiv.appendChild(choiceDiv);
        });

        quizContainer.innerHTML = '';
        quizContainer.innerHTML = '<nav class="navbar fixed-top bg-body-tertiary"><div class="alert text-bg-secondary" role="alert"> <h4 class="alert-heading">Learning.......!</h4></div></nav>';
        quizContainer.appendChild(document.createElement('br'));
        quizContainer.appendChild(document.createElement('br'));
        quizContainer.appendChild(document.createElement('br'));
        quizContainer.appendChild(document.createElement('br'));
        quizContainer.appendChild(questionDiv);

        const nextButton = document.createElement('button');
        nextButton.innerText = 'Next';
        nextButton.className = 'btn btn-primary mt-3';
        nextButton.addEventListener('click', () => {
            currentQuestionIndex++;
            if (currentQuestionIndex < shuffledQuestions.length) {
                showQuestionAndAnswers();
            } else {
                showBackToQuestionsButton();
            }
        });
        quizContainer.appendChild(nextButton);
    }

    showQuestionAndAnswers();

    function showBackToQuestionsButton() {
        const backButton = document.createElement('button');
        backButton.innerText = 'Back to Questions';
        backButton.className = 'btn btn-primary mt-3';
        backButton.addEventListener('click', () => {
            currentQuestionIndex = 0;
            startQuiz(fileName);
        });
        quizContainer.appendChild(document.createElement('br'));
        quizContainer.appendChild(document.createElement('br'));
        quizContainer.appendChild(backButton);
        quizContainer.style.display = 'none';
    }
}

// Add an event listener for the showAllButton
getJsonFileList();
