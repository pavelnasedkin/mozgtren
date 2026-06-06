(function (global) {
  var MAX_LEVEL = 8;

  BrainEngine.register({
    id: "simon",
    title: "Саймон",
    emoji: "🔔",
    description: "Повторите последовательность цветов",
    durationHint: "~2 мин",
    start: function (ctx) {
      runSimon(ctx);
    },
  });

  function runSimon(ctx) {
    var sequence = [];
    var level = 0;
    var inputIndex = 0;
    var accepting = false;

    ctx.setHint("Смотрите и повторяйте");

    var status = document.createElement("p");
    status.className = "simon-status";
    var pad = document.createElement("div");
    pad.className = "simon-pad";
    var buttons = [];

    ctx.area.innerHTML = "";
    ctx.area.appendChild(status);
    ctx.area.appendChild(pad);

    for (var i = 0; i < 4; i++) {
      (function (idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "simon-btn simon-btn--" + idx;
        btn.disabled = true;
        btn.addEventListener("click", function () {
          if (!accepting) return;
          flash(btn);
          if (idx !== sequence[inputIndex]) {
            fail();
            return;
          }
          inputIndex += 1;
          if (inputIndex >= sequence.length) {
            accepting = false;
            level += 1;
            ctx.setProgress("Уровень " + level);
            if (level >= MAX_LEVEL) {
              win();
            } else {
              setTimeout(nextLevel, 800);
            }
          }
        });
        pad.appendChild(btn);
        buttons.push(btn);
      })(i);
    }

    nextLevel();

    function nextLevel() {
      sequence.push(Math.floor(Math.random() * 4));
      inputIndex = 0;
      accepting = false;
      setButtonsEnabled(false);
      status.textContent = "Запоминайте…";
      playSequence(0);
    }

    function playSequence(i) {
      if (i >= sequence.length) {
        status.textContent = "Ваш ход!";
        accepting = true;
        setButtonsEnabled(true);
        return;
      }
      var idx = sequence[i];
      flash(buttons[idx]);
      setTimeout(function () {
        playSequence(i + 1);
      }, 550);
    }

    function flash(btn) {
      btn.classList.add("simon-btn--active");
      setTimeout(function () {
        btn.classList.remove("simon-btn--active");
      }, 280);
    }

    function setButtonsEnabled(on) {
      buttons.forEach(function (b) {
        b.disabled = !on;
      });
    }

    function fail() {
      accepting = false;
      setButtonsEnabled(false);
      status.textContent = "Ошибка на уровне " + (level + 1);
      var score = level * 15;
      ctx.finish({
        score: score,
        accuracy: Math.round((level / MAX_LEVEL) * 100),
        detail: "Дошли до уровня " + level,
      });
    }

    function win() {
      ctx.finish({
        score: MAX_LEVEL * 15,
        accuracy: 100,
        detail: "Все уровни пройдены!",
      });
    }
  }
})(window);
