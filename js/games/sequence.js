(function (global) {
  var ROUNDS = 6;
  var SHOW_MS = 1300;
  var NEXT_MS = 700;

  BrainEngine.register({
    id: "sequence",
    title: "Последовательность",
    emoji: "🔐",
    description: "Запомните цифры и выберите правильный вариант",
    durationHint: "~2 мин",
    start: function (ctx) {
      runSequence(ctx);
    },
  });

  function runSequence(ctx) {
    var round = 0;
    var correct = 0;
    var timeoutId = null;

    ctx.setHint("Сначала запомните, потом выберите ответ");
    ctx.onUnmount = function () {
      clearTimeout(timeoutId);
    };

    nextRound();

    function nextRound() {
      if (round >= ROUNDS) {
        finish();
        return;
      }
      round += 1;
      ctx.setProgress("Раунд " + round + " / " + ROUNDS);
      ctx.area.innerHTML = "";

      var len = Math.min(3 + round, 8);
      var answer = buildDigits(len);

      var show = document.createElement("p");
      show.className = "sequence-display";
      show.textContent = answer;
      ctx.area.appendChild(show);

      timeoutId = setTimeout(function () {
        show.textContent = "•••";
        renderOptions(answer);
      }, SHOW_MS);
    }

    function renderOptions(answer) {
      var options = [answer, mutate(answer), mutate(answer), mutate(answer)];
      shuffle(options);

      var grid = document.createElement("div");
      grid.className = "sequence-options";
      options.forEach(function (value) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sequence-option";
        btn.textContent = value;
        btn.addEventListener("click", function () {
          var isCorrect = value === answer;
          if (isCorrect) correct += 1;
          btn.classList.add(isCorrect ? "sequence-option--ok" : "sequence-option--bad");
          Array.prototype.forEach.call(grid.children, function (child) {
            child.disabled = true;
            if (child.textContent === answer) child.classList.add("sequence-option--ok");
          });
          timeoutId = setTimeout(nextRound, NEXT_MS);
        });
        grid.appendChild(btn);
      });
      ctx.area.appendChild(grid);
    }

    function finish() {
      var accuracy = Math.round((correct / ROUNDS) * 100);
      ctx.finish({
        score: correct * 14,
        accuracy: accuracy,
        detail: "Верно: " + correct + " из " + ROUNDS,
      });
    }
  }

  function buildDigits(len) {
    var out = "";
    for (var i = 0; i < len; i++) out += String(Math.floor(Math.random() * 10));
    return out;
  }

  function mutate(s) {
    var arr = s.split("");
    var idx = Math.floor(Math.random() * arr.length);
    var newDigit = String((Number(arr[idx]) + 1 + Math.floor(Math.random() * 8)) % 10);
    arr[idx] = newDigit;
    return arr.join("");
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }
})(window);
