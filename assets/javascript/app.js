const app = (function() {
    let questionDuration = 60;

    let questions = [];
    let currentQuestion = 0;
    let timerInterval;
    
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
        const lis = document.querySelectorAll("#answers li");
        for (let i = 0; i < lis.length; i++) {
            if (lis[i] === answerElement) {
                questions[currentQuestion].guess = answerElement.textContent;
            }
        }
        clearInterval(timerInterval);
        startTimer(questionDuration);
        if (currentQuestion === questions.length - 1) {
            document.getElementById("textContainer").style.display = "block";
            document.getElementById("questionContainer").style.display = "none";
            let right = 0;
            for (let i = 0; i < questions.length; i++) {
                if (questions[i].correct_answer === questions[i].guess) {
                    right++;
                }
            }
            document.getElementById("textContainer").innerHTML = "<h1>You got " + right + " out of " + questions.length + " correct!</h1>";
            document.getElementById("textContainer").innerHTML += "<h1>" + Math.round(100*right/questions.length) + "%</h1>";
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
                document.getElementById("textContainer").append(containerElement);
            }
            document.getElementById("textContainer").innerHTML += "<input type=\"button\" id=\"continueButton\" value=\"Try Again?\">";
            document.getElementById("continueButton").addEventListener("click", function() {
                location.reload();
            });
        } else {
            currentQuestion++;
            updateQuestion();
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
    const getQuestions = function(amount, difficulty, category) {
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
                result.incorrect_answers.forEach((answer) => decodedAnswers.push(decodeHtml(answer)));
                const question = {
                    question: decodeHtml(result.question),
                    correct_answer: decodeHtml(result.correct_answer),
                    incorrect_answers: decodedAnswers
                };
                const answers = question.incorrect_answers.slice();
                answers.push(question.correct_answer);
                debugger;
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
    const startGame = function() {
        const questionCount = parseInt(document.getElementById("numberOfQuestions").value);
        const difficulty = document.getElementById("difficulty").value;
        const category = document.getElementById("category").value;
        questionDuration = parseInt(document.getElementById("seconds").value);
        getQuestions(questionCount, difficulty, category);
    };
    const startTimer = function(duration) {
        let timer = duration, minutes, seconds;
        document.getElementById("timer").classList.remove("running-out");
        convertToMinutesAndSeconds(questionDuration);
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
        const question = questions[currentQuestion];
        document.getElementById("question").innerHTML = (currentQuestion + 1) + ") " + question.question;
        correctIndex = question.answers.indexOf(question.correct_answer);
        const answerElements = document.getElementById("answers").querySelectorAll("li");
        for (let i = 0; i < answerElements.length; i++) {
            answerElements[i].innerHTML = question.answers[i];
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