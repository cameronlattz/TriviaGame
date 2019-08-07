const app = (function() {
    const startTimer = function(duration) {
        let timer = duration, minutes, seconds;
        setInterval(function () {
            minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10);
            seconds = seconds < 10 ? "0" + seconds : seconds;
    
            const timerDiv = document.getElementById("timer");
            timerDiv.textContent = minutes + ":" + seconds;
            timerDiv.style.width = (100 * timer/duration) + "%";
    
            if (timer === 10) {
                timerDiv.classList.add("running-out");
            }
            if (--timer < 0) {
                timer = duration;
            }
        }, 1000);
    };
    const init = function() {
        startTimer(60);
    };
    document.addEventListener('DOMContentLoaded', init, false);
})();