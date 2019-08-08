const app = (function() {
    let questionDuration = 60;

    let questions = [];
    let currentQuestionIndex = 0;
    let timerInterval = null;
    
    // converts time in seconds to a user-friendly mm:ss
    const convertToMinutesAndSeconds = function(timer) {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);
        const timerDiv = document.getElementById("timer");
        // add a 0 to seconds if more than 9 seconds left
        if (seconds >= 10 || minutes > 0) {
            seconds = seconds < 10 ? "0" + seconds : seconds;
            timerDiv.textContent = minutes + ":" + seconds;
        } else {
            timerDiv.textContent = seconds;
        }
        // set the width of the timer bar as a percentage of the maximum timer value
        timerDiv.style.width = (100 * timer/questionDuration) + "%";
        return [minutes, seconds];
    }

    // handles actions when user clicks an answer, or times out
    const clickAnswer = function(answerElement) {
        // if the timer is running, allow a click
        if (!timerPaused) {
            // pause the timer
            clearInterval(timerInterval);
            const lis = document.querySelectorAll("#answers li");
            for (let i = 0; i < lis.length; i++) {
                if (lis[i] === answerElement) {
                    // attach the guessed answer to the question object
                    questions[currentQuestionIndex].guess = answerElement.textContent;
                }
            }
            displayAnswer();
            timerPaused = true;
        }
    };

    // sometimes we get html codes from the api. removing them here. this just puts text into an element,
    // then grabs it back out, encoded
    const decodeHtml = function(html) {
        const fakeElement = document.createElement("div");
        fakeElement.innerHTML = html;
        let string = fakeElement.textContent;
        fakeElement.remove();
        return string;
    }

    // show the correct answer, and the answer that was guessed. runs after answer is chosen
    const displayAnswer = function() {
        const lis = document.getElementById("answers").querySelectorAll("li");
        for (let i = 0; i < lis.length; i++) {
            // iterate through lis and set the current one as 'li'
            const li = lis[i];
            const question = questions[currentQuestionIndex];
            // if the text of the current li is the same as the correct answer
            if (li.textContent === question.correct_answer) {
                li.classList.add("correct");
                li.textContent += " (correct answer)";
            // else if the text is the same as the guess
            } else if (li.textContent === question.guess) {
                li.classList.add("guessed");
            }
        }
        // add 1 to the current question index
        currentQuestionIndex++;
        setTimeout(updateQuestion, 3000);
    }

    // show all the questions and their answers, along with the correct and guessed ones, and the user's score
    const displayResults = function() {
        // hide the questions and show the results
        document.getElementById("resultsContainer").style.display = "block";
        document.getElementById("questionContainer").style.display = "none";
        // calculate the number of questions correctly answered
        let right = 0;
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].correct_answer === questions[i].guess) {
                right++;
            }
        }
        document.getElementById("resultsContainer").innerHTML = "<h1>You got " + right + " out of " + questions.length + " correct!</h1>";
        document.getElementById("resultsContainer").innerHTML += "<h1>" + Math.round(100*right/questions.length) + "%</h1>";
        // display results
        for (let i = 0; i < questions.length; i++) {
            const containerElement = document.createElement("div");
            const questionElement = document.createElement("div");
            questionElement.classList.add("question");
            questionElement.innerHTML = (i + 1) + ") " + questions[i].question;
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
        // add retry button and setup listener for it
        document.getElementById("resultsContainer").innerHTML += "<input type=\"button\" id=\"continueButton\" value=\"Try Again?\">";
        document.getElementById("continueButton").addEventListener("click", function() {
            restartGame();
            document.getElementById("continueButton").remove();
        });
    }

    // grab questions and answers from opentdb api
    const getQuestions = function(amount, difficulty, category) {
        questions = [];
        // show the loading container, hide the form container
        document.getElementById("loadingContainer").style.display = "block";
        document.getElementById("textContainer").style.display = "none";
        // build url based on function params
        let url = "https://opentdb.com/api.php?amount=" + amount;
        if (category !== "any") {
            url += "&category=" + category;
        }
        if (difficulty !== "any") {
            url += "&difficulty=" + difficulty;
        }
        url += "&type=multiple";
        // fetch questions
        fetch(url)
        .then(function(response) {
            return response.json();
        }).then(function(responseJson) {
            // hide the loading container, show the question container
            document.getElementById("loadingContainer").style.display = "none";
            document.getElementById("questionContainer").style.display = "block";
            for (let i = 0; i < responseJson.results.length; i++) {
                // iterate through the results, storing the current one as 'result'
                const result = responseJson.results[i];
                const decodedAnswers = [];
                // iterate through the incorrect answer results. trim the individual answer for leading and
                // trailing whitespace, then add it to the decodedAnswers array
                result.incorrect_answers.forEach((answer) => decodedAnswers.push(decodeHtml(answer.trim())));
                // build the question object, again decoding html
                const question = {
                    question: decodeHtml(result.question.trim()),
                    correct_answer: decodeHtml(result.correct_answer.trim()),
                    incorrect_answers: decodedAnswers
                };
                // clone the array (so the original doesn't get modified) and save it to 'answers'
                const answers = question.incorrect_answers.slice();
                // add the correct answer to the answers array
                answers.push(question.correct_answer);
                shuffleArray(answers);
                question.answers = answers;
                // add the newly built question object to the global questions array
                questions.push(question);
            }
            updateQuestion();
            startTimer(questionDuration);
        });
    };

    // randomize the answer order
    const shuffleArray = function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    // start game again after one is finished
    const restartGame = function() {
        document.getElementById("resultsContainer").style.display = "none";
        document.getElementById("textContainer").style.display = "block";
        currentQuestionIndex = 0;
    };

    // initially start game
    const startGame = function() {
        event.preventDefault();
        // grab variables from inputs
        const questionCount = parseInt(document.getElementById("numberOfQuestions").value);
        const difficulty = document.getElementById("difficulty").value;
        const category = document.getElementById("category").value;
        questionDuration = parseInt(document.getElementById("seconds").value);
        timer = questionDuration;
        getQuestions(questionCount, difficulty, category);
    };

    // start the setInterval that is going to handle the timer
    const startTimer = function(duration) {
        // reset things if they need it
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

    // go to the next question, or end the game
    const updateQuestion = function() {
        // if the user just answered the last question
        if (currentQuestionIndex === questions.length) {
            displayResults();
        } else {
            const question = questions[currentQuestionIndex];
            document.getElementById("question").innerHTML = (currentQuestionIndex + 1) + ") " + question.question;
            const answerElements = document.getElementById("answers").querySelectorAll("li");
            // remove the classes from all answers
            for (let i = 0; i < answerElements.length; i++) {
                answerElements[i].innerHTML = question.answers[i];
                answerElements[i].classList = [];
            }
            // restart the timer
            startTimer(questionDuration);
        }
    };

    // event listener setup
    const init = function() {
        document.getElementById("form").addEventListener("submit", startGame);
        document.querySelectorAll("#answers li").forEach(function(answerElement) {
            answerElement.addEventListener("click", function() {clickAnswer(answerElement)});
        });
    };
    document.addEventListener("DOMContentLoaded", init, false);
})();