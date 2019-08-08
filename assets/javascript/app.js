const app = (function() {
    let questionDuration = 60;

    let questions = [];
    let currentQuestion = 0;
    let timerInterval = null;
    
    const convertToMinutesAndSeconds = function(timer) {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);
        const timerDiv = document.getElementById("timer");
        if (seconds >= 10 || minutes > 0) {
            seconds = seconds < 10 ? "0" + seconds : seconds;
            timerDiv.textContent = minutes + ":" + seconds;
        } else {
            timerDiv.textContent = seconds;
        }
        timerDiv.style.width = (100 * timer/questionDuration) + "%";
        return [minutes, seconds];
    }
    const clickAnswer = function(answerElement) {
        if (!timerPaused) {
            clearInterval(timerInterval);
            const lis = document.querySelectorAll("#answers li");
            for (let i = 0; i < lis.length; i++) {
                if (lis[i] === answerElement) {
                    questions[currentQuestion].guess = answerElement.textContent;
                }
            }
            displayAnswer();
            timerPaused = true;
        }
    };
    // sometimes we get html codes from the api. removing them here
    const decodeHtml = function(html) {
        const fakeElement = document.createElement("div");
        fakeElement.innerHTML = html;
        let string = fakeElement.textContent;
        fakeElement.remove();
        return string;
    }
    const displayAnswer = function() {
        const lis = document.getElementById("answers").querySelectorAll("li");
        for (let i = 0; i < lis.length; i++) {
            const li = lis[i];
            const question = questions[currentQuestion];
            if (li.textContent === question.correct_answer) {
                li.classList.add("correct");
                li.textContent += " (correct answer)";
            } else if (li.textContent === question.guess) {
                li.classList.add("guessed");
            }
        }
        currentQuestion++;
        setTimeout(updateQuestion, 3000);
    }
    const displayResults = function() {
        document.getElementById("resultsContainer").style.display = "block";
        document.getElementById("questionContainer").style.display = "none";
        let right = 0;
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].correct_answer === questions[i].guess) {
                right++;
            }
        }
        document.getElementById("resultsContainer").innerHTML = "<h1>You got " + right + " out of " + questions.length + " correct!</h1>";
        document.getElementById("resultsContainer").innerHTML += "<h1>" + Math.round(100*right/questions.length) + "%</h1>";
        for (let i = 0; i < questions.length; i++) {
            const containerElement = document.createElement("div");
            const questionElement = document.createElement("div");
            questionElement.classList.add("question");
            questionElement.innerHTML = questions[i].question;
            containerElement.append(questionElement);
            const answersElement = document.createElement("ul");
            for (let j = 0; j < questions[i].answers.length; j++) {
                const answerElement = document.createElement("li");
                answerElement.innerHTML = questions[i].answers[j];
                if (questions[i].answers[j] === questions[i].correct_answer) {
                    answerElement.classList.add("correct");
                    answerElement.innerHTML += " (correct answer)";
                }
                if (questions[i].answers[j] === questions[i].guess) {
                    answerElement.classList.add("guessed");
                    answerElement.innerHTML += " (your guess)";
                }
                answersElement.append(answerElement);
            }
            containerElement.append(answersElement);
            document.getElementById("resultsContainer").append(containerElement);
        }
        document.getElementById("resultsContainer").innerHTML += "<input type=\"button\" id=\"continueButton\" value=\"Try Again?\">";
        document.getElementById("continueButton").addEventListener("click", function() {
            restartGame();
            document.getElementById("continueButton").remove();
        });
    }
    const getQuestions = function(amount, difficulty, category) {
        questions = [];
        document.getElementById("loadingContainer").style.display = "block";
        document.getElementById("textContainer").style.display = "none";
        let url = "https://opentdb.com/api.php?amount=" + amount;
        if (category !== "any") {
            url += "&category=" + category;
        }
        if (difficulty !== "any") {
            url += "&difficulty=" + difficulty;
        }
        url += "&type=multiple";
        fetch(url)
        .then(function(response) {
            return response.json();
        }).then(function(responseJson) {
            document.getElementById("loadingContainer").style.display = "none";
            document.getElementById("questionContainer").style.display = "block";
            for (let i = 0; i < responseJson.results.length; i++) {
                const result = responseJson.results[i];
                const decodedAnswers = [];
                result.incorrect_answers.forEach((answer) => decodedAnswers.push(decodeHtml(answer.trim())));
                const question = {
                    question: decodeHtml(result.question.trim()),
                    correct_answer: decodeHtml(result.correct_answer.trim()),
                    incorrect_answers: decodedAnswers
                };
                const answers = question.incorrect_answers.slice();
                answers.push(question.correct_answer);
                shuffleArray(answers);
                question.answers = answers;
                questions.push(question);
            }
            updateQuestion();
            startTimer(questionDuration);
        });
    };
    const shuffleArray = function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };
    const restartGame = function() {
        document.getElementById("resultsContainer").style.display = "none";
        document.getElementById("textContainer").style.display = "block";
        currentQuestion = 0;
    };
    const startGame = function() {
        const questionCount = parseInt(document.getElementById("numberOfQuestions").value);
        const difficulty = document.getElementById("difficulty").value;
        const category = document.getElementById("category").value;
        questionDuration = parseInt(document.getElementById("seconds").value);
        timer = questionDuration;
        getQuestions(questionCount, difficulty, category);
    };
    const startTimer = function(duration) {
        let timer = duration, minutes, seconds;
        document.getElementById("timer").classList.remove("running-out");
        convertToMinutesAndSeconds(questionDuration);
        clearInterval(timerInterval);
        timerPaused = false;
        timerInterval = setInterval(function () {
            [minutes, seconds] = convertToMinutesAndSeconds(timer);
            if (timer === Math.ceil(questionDuration / 4)) {
                document.getElementById("timer").classList.add("running-out");
            }
            if (--timer < 0) {
                timer = duration;
                clickAnswer();
            }
        }, 1000);
    };
    const updateQuestion = function() {
        if (currentQuestion === questions.length) {
            displayResults();
        } else {
            const question = questions[currentQuestion];
            document.getElementById("question").innerHTML = (currentQuestion + 1) + ") " + question.question;
            correctIndex = question.answers.indexOf(question.correct_answer);
            const answerElements = document.getElementById("answers").querySelectorAll("li");
            for (let i = 0; i < answerElements.length; i++) {
                answerElements[i].innerHTML = question.answers[i];
                answerElements[i].classList = [];
            }
            startTimer(questionDuration);
        }
    };
    const init = function() {
        document.getElementById("startButton").addEventListener("click", startGame);
        document.querySelectorAll("#answers li").forEach(function(answerElement) {
            answerElement.addEventListener("click", function() {clickAnswer(answerElement)});
        });
    };
    document.addEventListener("DOMContentLoaded", init, false);
})();