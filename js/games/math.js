(function (global) {
  var ROUNDS = 15;
  var TIME_PER_ROUND = 8;

  BrainEngine.register({
    id: "math",
    title: "Счёт",
    emoji: "🔢",
    description: "Решайте примеры на скорость",
    durationHint: "~2 мин",
    start: function (ctx) {
      runMath(ctx);
    },
  });

  function runMath(ctx) {
    var round = 0;
    var correct = 0;
    var timerId = null;
    var deadline = 0;

    ctx.setHint("Введите ответ и нажмите OK");

    function nextRound() {
      if (round >= ROUNDS) return finish();
      round += 1;
      ctx.setProgress("Пример " + round + " / " + ROUNDS);

      var a = rand(2, 12);
      var b = rand(2, 12);
      var op = Math.random() > 0.5 ? "+" : "×";
      var answer = op === "+" ? a + b : a * b;

      ctx.area.innerHTML = "";
      var problem = document.createElement("p");
      problem.className = "math-problem";
      problem.textContent = a + " " + op + " " + b + " = ?";
      ctx.area.appendChild(problem);

      var feedback = document.createElement("p");
      feedback.className = "feedback";
      ctx.area.appendChild(feedback);

      var input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.className = "math-input";
      input.setAttribute("aria-label", "Ответ");
      input.readOnly = true;

      var row = document.createElement("div");
      row.className = "math-input-row";
      row.appendChild(input);

      var okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "btn btn--primary";
      okBtn.textContent = "OK";
      okBtn.style.flex = "0 0 auto";
      okBtn.style.minWidth = "72px";
      row.appendChild(okBtn);
      ctx.area.appendChild(row);

      var keypad = document.createElement("div");
      keypad.className = "math-keypad";
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].forEach(function (key) {
        var k = document.createElement("button");
        k.type = "button";
        k.className = "math-key";
        k.textContent = key;
        k.addEventListener("click", function () {
          if (key === "C") input.value = "";
          else if (key === "⌫") input.value = input.value.slice(0, -1);
          else input.value += key;
        });
        keypad.appendChild(k);
      });
      ctx.area.appendChild(keypad);

      function submit() {
        clearTimeout(timerId);
        var val = parseInt(input.value, 10);
        if (val === answer) {
          correct += 1;
          feedback.textContent = "Верно!";
          feedback.className = "feedback feedback--ok";
        } else {
          feedback.textContent = "Было: " + answer;
          feedback.className = "feedback feedback--bad";
        }
        okBtn.disabled = true;
        setTimeout(nextRound, 600);
      }

      okBtn.addEventListener("click", submit);

      deadline = Date.now() + TIME_PER_ROUND * 1000;
      ctx.showTimer(true);
      tick();
      timerId = setInterval(tick, 200);

      function tick() {
        var left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        ctx.setTimer(left);
        if (left <= 0) {
          clearInterval(timerId);
          feedback.textContent = "Время! Ответ: " + answer;
          feedback.className = "feedback feedback--bad";
          okBtn.disabled = true;
          setTimeout(nextRound, 700);
        }
      }
    }

    function finish() {
      ctx.showTimer(false);
      var accuracy = Math.round((correct / ROUNDS) * 100);
      ctx.finish({
        score: correct * 10,
        accuracy: accuracy,
        detail: "Верно: " + correct + " из " + ROUNDS,
      });
    }

    ctx.onUnmount = function () {
      clearInterval(timerId);
    };

    nextRound();
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
})(window);
