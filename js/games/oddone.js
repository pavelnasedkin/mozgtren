(function (global) {
  var ROUNDS = 10;
  var GRID_SIZE = 16;
  var PAIRS = [
    ["🍎", "🍏"],
    ["🐱", "🐯"],
    ["🌙", "⭐"],
    ["⚽", "🏀"],
    ["🚗", "🚕"],
    ["📘", "📗"],
    ["🎵", "🎶"],
    ["🍓", "🍒"],
  ];

  BrainEngine.register({
    id: "oddone",
    title: "Лишний символ",
    emoji: "🧩",
    description: "Найдите один отличный символ",
    durationHint: "~1 мин",
    start: function (ctx) {
      runOddOne(ctx);
    },
  });

  function runOddOne(ctx) {
    var round = 0;
    var correct = 0;
    var locked = false;

    ctx.setHint("Нажмите на символ, который отличается");

    nextRound();

    function nextRound() {
      if (round >= ROUNDS) {
        finish();
        return;
      }
      round += 1;
      locked = false;
      ctx.setProgress("Раунд " + round + " / " + ROUNDS);
      ctx.area.innerHTML = "";

      var pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
      var main = pair[0];
      var odd = pair[1];
      if (Math.random() > 0.5) {
        main = pair[1];
        odd = pair[0];
      }

      var oddIndex = Math.floor(Math.random() * GRID_SIZE);
      var grid = document.createElement("div");
      grid.className = "oddone-grid";

      for (var i = 0; i < GRID_SIZE; i++) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "oddone-cell";
        btn.textContent = i === oddIndex ? odd : main;
        (function (idx) {
          btn.addEventListener("click", function () {
            if (locked) return;
            locked = true;
            var isCorrect = idx === oddIndex;
            if (isCorrect) {
              correct += 1;
              btn.classList.add("oddone-cell--ok");
            } else {
              btn.classList.add("oddone-cell--bad");
            }
            setTimeout(nextRound, 350);
          });
        })(i);
        grid.appendChild(btn);
      }

      ctx.area.appendChild(grid);
    }

    function finish() {
      var accuracy = Math.round((correct / ROUNDS) * 100);
      ctx.finish({
        score: correct * 10,
        accuracy: accuracy,
        detail: "Верно: " + correct + " из " + ROUNDS,
      });
    }
  }
})(window);
