(function (global) {
  var ROUNDS = 20;
  var N = 1;
  var LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "К", "Л", "М", "Н"];
  var DELAY_SHOW = 1200;
  var DELAY_BLANK = 600;

  BrainEngine.register({
    id: "nback",
    title: "1-back",
    emoji: "🧠",
    description: "Совпадает ли буква с предыдущей?",
    durationHint: "~2 мин",
    start: function (ctx) {
      runNback(ctx);
    },
  });

  function runNback(ctx) {
    var sequence = [];
    var step = 0;
    var correct = 0;
    var total = 0;
    var answered = false;
    var timerId = null;
    var unmounted = false;

    ctx.setHint('Нажмите ДА, если буква та же, что и предыдущая');

    ctx.area.innerHTML = "";

    var letterEl = document.createElement("p");
    letterEl.className = "nback-letter";
    ctx.area.appendChild(letterEl);

    var feedbackEl = document.createElement("p");
    feedbackEl.className = "feedback";
    ctx.area.appendChild(feedbackEl);

    var btnRow = document.createElement("div");
    btnRow.className = "nback-btns";

    var btnYes = document.createElement("button");
    btnYes.type = "button";
    btnYes.className = "btn btn--primary nback-btn";
    btnYes.textContent = "ДА";
    btnYes.disabled = true;

    var btnNo = document.createElement("button");
    btnNo.type = "button";
    btnNo.className = "btn btn--secondary nback-btn";
    btnNo.textContent = "НЕТ";
    btnNo.disabled = true;

    btnYes.addEventListener("click", function () { answer(true); });
    btnNo.addEventListener("click", function () { answer(false); });

    btnRow.appendChild(btnYes);
    btnRow.appendChild(btnNo);
    ctx.area.appendChild(btnRow);

    ctx.onUnmount = function () {
      unmounted = true;
      clearTimeout(timerId);
    };

    nextStep();

    function nextStep() {
      if (unmounted) return;
      if (step >= ROUNDS) return finish();

      var letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      sequence.push(letter);

      var isTarget = step >= N && sequence[step] === sequence[step - N];
      answered = false;

      letterEl.textContent = letter;
      feedbackEl.textContent = "";
      feedbackEl.className = "feedback";
      ctx.setProgress("Шаг " + (step + 1) + " / " + ROUNDS);

      if (step >= N) {
        total += 1;
        btnYes.disabled = false;
        btnNo.disabled = false;
        timerId = setTimeout(function () {
          if (!answered) {
            showFeedback(false, isTarget);
          }
          hideAndNext(isTarget);
        }, DELAY_SHOW);
      } else {
        btnYes.disabled = true;
        btnNo.disabled = true;
        timerId = setTimeout(function () {
          hideAndNext(false);
        }, DELAY_SHOW);
      }

      step += 1;

      function answer(yes) {
        if (answered || btnYes.disabled) return;
        answered = true;
        clearTimeout(timerId);
        btnYes.disabled = true;
        btnNo.disabled = true;
        var isCorrect = (yes === isTarget);
        if (isCorrect) correct += 1;
        showFeedback(isCorrect, isTarget);
        timerId = setTimeout(function () { hideAndNext(isTarget); }, DELAY_BLANK);
      }
    }

    function hideAndNext(isTarget) {
      if (unmounted) return;
      letterEl.textContent = "·";
      btnYes.disabled = true;
      btnNo.disabled = true;
      timerId = setTimeout(nextStep, DELAY_BLANK);
    }

    function showFeedback(isCorrect, isTarget) {
      if (isCorrect) {
        feedbackEl.textContent = "Верно!";
        feedbackEl.className = "feedback feedback--ok";
      } else {
        feedbackEl.textContent = isTarget ? "Была такая же!" : "Не совпадает";
        feedbackEl.className = "feedback feedback--bad";
      }
    }

    function finish() {
      var accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      ctx.finish({
        score: correct * 6,
        accuracy: accuracy,
        detail: "Верно: " + correct + " из " + total,
      });
    }
  }
})(window);
