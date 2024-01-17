// Fetch questions from JSON file
async function getQuestions() {
    const response = await fetch('Bio6.json');
    const data = await response.json();
    return data.questions;
}

// Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize quiz
async function startQuiz() {
    const questions = await getQuestions();
    const shuffledQuestions = [...questions];
    shuffleArray(shuffledQuestions);

    const quizContainer = document.getElementById('quiz-container');
    const questionContainer = document.getElementById('question-container');
    const choicesContainer = document.getElementById('choices-container');
    const submitButton = document.getElementById('submit-button');
    const resultContainer = document.getElementById('result-container');

    let currentQuestionIndex = 0;
    let score = 0;

    /*function showQuestion(question) {
        questionContainer.innerHTML = question.text;

        choicesContainer.innerHTML = '';
        question.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.innerText = `${index + 1}. ${choice}`;
            button.addEventListener('click', () => selectAnswer(index));
            choicesContainer.appendChild(button);
        });
    }*/
/*
function showQuestion(question) {
    questionContainer.innerHTML = question.text;

    choicesContainer.innerHTML = '';
    question.choices.forEach((choice, index) => {
        const mainDiv = document.createElement('div');
        mainDiv.className = "form-check";

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = index;
        input.className = 'form-check-input';
        input.id = `choice-${index}`;
        
        const label = document.createElement('label');
        label.innerText = choice;
        label.className = 'form-check-label';
        label.setAttribute('for', `choice-${index}`);

        mainDiv.appendChild(input);
        mainDiv.appendChild(label);
        choicesContainer.appendChild(mainDiv);
        choicesContainer.appendChild(document.createElement('br'));        
    });
}
*/

function showQuestion(question) {
    questionContainer.innerHTML = '';

    // Create Bootstrap card for the question
    const questionCard = document.createElement('div');
    questionCard.className = 'card mb-3';

    // Card header for the question
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.innerText = question.text;

    questionCard.appendChild(cardHeader);

    // Card body for answer choices
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    question.choices.forEach((choice, index) => {
        const mainDiv = document.createElement('div');
        mainDiv.className = 'form-check';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = index;
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

    // Append the Bootstrap card to the question container
    questionContainer.appendChild(questionCard);
}


function selectAnswer(choiceIndex) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    shuffledQuestions[currentQuestionIndex].userAnswer = choiceIndex; // Record user's answer

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
        reviewButton.className = "btn btn-success";
        reviewButton.addEventListener('click', () => showReview());
        quizContainer.appendChild(reviewButton);
    }

    // ...

/*function showReview() {
    quizContainer.innerHTML = '<div class="alert alert-success" role="alert"> <h4 class="alert-heading">Great job...! Keep Learning...!</h4></div>';
    
    shuffledQuestions.forEach((question, index) => {

        const questionDiv = document.createElement('div');
        questionDiv.classList.add('review-question', 'card','text-bg-info mb-3');       
        questionDiv.style="max-width: 36rem;";

        const userAnswer = shuffledQuestions[index].userAnswer;
        const isCorrect = userAnswer === shuffledQuestions[index].answer;

        questionDiv.innerHTML = `<div class="card-header">${index + 1}. ${question.text}</div>`;
        
        question.choices.forEach((choice, choiceIndex) => {
            const mainDiv = document.createElement('div');
            mainDiv.className = "form-check";

            const choiceDiv = document.createElement('div');
            choiceDiv.classList.add('review-choice','card-body');            

            const input = document.createElement('input');
            input.type = 'radio';
            input.disabled = true;
            input.className= 'form-check-input';
            input.checked = choiceIndex === userAnswer;
            
            const label = document.createElement('label');
            label.innerText = choice;
            label.className= 'form-check-label';

            if (isCorrect && choiceIndex === userAnswer) {
                label.classList.add('user-answer', 'correct');
            } else if (!isCorrect && choiceIndex === question.answer) {
                label.classList.add('correct');
            } else if (!isCorrect && choiceIndex === userAnswer) {
                label.classList.add('user-answer', 'incorrect');
            }

            mainDiv.appendChild(input);
            mainDiv.appendChild(label);
            choiceDiv.appendChild(mainDiv);

            // choiceDiv.appendChild(input);
            // choiceDiv.appendChild(label);
            questionDiv.appendChild(choiceDiv);
        });

        quizContainer.appendChild(questionDiv);
    });
}*/

function showReview() {
    quizContainer.innerHTML = '<div class="alert alert-danger" role="alert"> <h4 class="alert-heading">Great job...! Keep Learning...!</h4></div>';

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
            label.setAttribute('for', `choice-${index}-${choiceIndex}`);

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
// quizContainer.innerHTML = '<nav class="navbar fixed-top bg-body-tertiary"><div class="alert text-bg-secondary" role="alert"> <h4 class="alert-heading">All Questions and Answers</h4></div></nav>';

function showAllQuestionsAndAnswers() {
    let currentQuestionIndex = 0;

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
                label.classList.add('correct', 'text-danger');
            }

            choiceDiv.appendChild(label);
            questionDiv.appendChild(choiceDiv);
        });

        quizContainer.innerHTML = '<nav class="navbar fixed-top bg-body-tertiary"><div class="alert text-bg-secondary" role="alert"> <h4 class="alert-heading">Learning.......!</h4></div></nav>';
        quizContainer.appendChild(document.createElement('br'));  
        quizContainer.appendChild(document.createElement('br'));  
        quizContainer.appendChild(document.createElement('br'));  
        quizContainer.appendChild(document.createElement('br'));  
        quizContainer.appendChild(questionDiv);

        // Add "Next" button
        const nextButton = document.createElement('button');
        nextButton.innerText = 'Next';
        nextButton.className = 'btn btn-primary mt-3';
        nextButton.addEventListener('click', () => {
            currentQuestionIndex++;
            if (currentQuestionIndex < shuffledQuestions.length) {
                showQuestionAndAnswers();
            } 
            else{
                showAlert();
            }
            /*else {
                // If all questions are displayed, show the "Back to Questions" button
                showBackToQuestionsButton();
            }*/
        });
        quizContainer.appendChild(nextButton);
    }

    function showAlert() {
        const toastL = document.getElementById('dispElem');
        toastL.style="display:block";
    }
    // Start showing questions and answers
    showQuestionAndAnswers();

    function showBackToQuestionsButton() {
        // Add a button to go back to the original questions page
        const backButton = document.createElement('button');
        backButton.innerText = 'Back to Questions';
        backButton.className = 'btn btn-primary mt-3';
        backButton.addEventListener('click', startQuiz);
        quizContainer.appendChild(backButton);
    }
}

// Add an event listener to the button
const showAllButton = document.getElementById('showAllButton');
showAllButton.addEventListener('click', showAllQuestionsAndAnswers);

    // Start the quiz
    showQuestion(shuffledQuestions[currentQuestionIndex]);

    submitButton.addEventListener('click', () => {
        const selectedChoice = document.querySelector('input[name="answer"]:checked');
        if (selectedChoice) {
            const choiceIndex = parseInt(selectedChoice.value);
            selectAnswer(choiceIndex);
        }
    });
}


// Start the quiz when the page is loaded
startQuiz();