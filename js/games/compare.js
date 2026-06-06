(function (global) {
  var ROUNDS = 15;
  var TIME_LIMIT = 45;

  BrainEngine.register({
    id: "compare",
    title: "Больше / меньше",
    emoji: "⚖️",
    description: "Быстро выбирайте большее число",
    durationHint: "~1 мин",
    start: function (ctx) {
      runCompare(ctx);
    },
  });

  function runCompare(ctx) {
    var round = 0;
    var correct = 0;
    var secondsLeft = TIME_LIMIT;
    var timerId = null;
    var ended = false;

    ctx.setHint("Нажмите число, которое больше");
    ctx.showTimer(true);
    ctx.setTimer(secondsLeft);

    timerId = setInterval(function () {
      secondsLeft -= 1;
      ctx.setTimer(secondsLeft);
      if (secondsLeft <= 0) endGame();
    }, 1000);

    ctx.onUnmount = function () {
      clearInterval(timerId);
    };

    nextRound();

    function nextRound() {
      if (ended) return;
      if (round >= ROUNDS) {
        endGame();
        return;
      }

      round += 1;
      ctx.setProgress("Раунд " + round + " / " + ROUNDS);
      ctx.area.innerHTML = "";

      var left = rand(10, 999);
      var right = rand(10, 999);
      while (right === left) right = rand(10, 999);
      var maxVal = Math.max(left, right);

      var row = document.createElement("div");
      row.className = "compare-row";

      addChoice(left);
      addChoice(right);

      ctx.area.appendChild(row);

      function addChoice(value) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "compare-choice";
        btn.textContent = String(value);
        btn.addEventListener("click", function () {
          if (ended) return;
          var isCorrect = value === maxVal;
          if (isCorrect) {
            correct += 1;
            btn.classList.add("compare-choice--ok");
          } else {
            btn.classList.add("compare-choice--bad");
          }
          Array.prototype.forEach.call(row.children, function (child) {
            child.disabled = true;
            if (Number(child.textContent) === maxVal) child.classList.add("compare-choice--ok");
          });
          setTimeout(nextRound, 280);
        });
        row.appendChild(btn);
      }
    }

    function endGame() {
      if (ended) return;
      ended = true;
      clearInterval(timerId);
      var accuracy = round > 0 ? Math.round((correct / round) * 100) : 0;
      var score = correct * 8 + secondsLeft;
      ctx.finish({
        score: score,
        accuracy: accuracy,
        detail: "Верно: " + correct + " из " + round,
      });
    }
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
})(window);
