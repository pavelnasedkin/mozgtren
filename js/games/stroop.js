(function (global) {
  var COLORS = [
    { name: "красный", hex: "#ef4444" },
    { name: "синий", hex: "#3b82f6" },
    { name: "зелёный", hex: "#22c55e" },
    { name: "жёлтый", hex: "#eab308" },
  ];

  var ROUNDS = 12;
  var TIME_LIMIT = 45;

  BrainEngine.register({
    id: "stroop",
    title: "Струп",
    emoji: "🎨",
    description: "Нажмите цвет слова, не читая текст",
    durationHint: "~1 мин",
    start: function (ctx) {
      runStroop(ctx);
    },
  });

  function runStroop(ctx) {
    var round = 0;
    var correct = 0;
    var timerId = null;
    var secondsLeft = TIME_LIMIT;
    var ended = false;

    ctx.setHint("Выберите цвет НАДПИСИ, а не слово");
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
      if (secondsLeft <= 0) return;
      round += 1;
      ctx.setProgress("Раунд " + round);

      var wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      var inkColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      var words = COLORS.map(function (c) {
        return c.name;
      });
      var wordText = words[Math.floor(Math.random() * words.length)];

      ctx.area.innerHTML = "";
      var wordEl = document.createElement("p");
      wordEl.className = "stroop-word";
      wordEl.textContent = wordText;
      wordEl.style.color = inkColor.hex;
      ctx.area.appendChild(wordEl);

      var grid = document.createElement("div");
      grid.className = "stroop-colors";
      ctx.area.appendChild(grid);

      COLORS.forEach(function (c) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "stroop-swatch";
        btn.style.background = c.hex;
        btn.setAttribute("aria-label", c.name);
        btn.addEventListener("click", function () {
          if (ended) return;
          if (c.hex === inkColor.hex) correct += 1;
          if (round >= ROUNDS) endGame();
          else nextRound();
        });
        grid.appendChild(btn);
      });
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
})(window);
