(function (global) {
  var ROUNDS = 8;
  var MIN_WAIT = 1500;
  var MAX_WAIT = 4000;

  BrainEngine.register({
    id: "reaction",
    title: "Реакция",
    emoji: "⚡",
    description: "Нажмите как можно быстрее при сигнале",
    durationHint: "~1 мин",
    start: function (ctx) {
      runReaction(ctx);
    },
  });

  function runReaction(ctx) {
    var round = 0;
    var times = [];
    var waitTimer = null;
    var startTime = 0;
    var phase = "idle";
    var unmounted = false;

    ctx.setHint("Ждите зелёного сигнала, затем жмите!");

    ctx.area.innerHTML = "";

    var circle = document.createElement("button");
    circle.type = "button";
    circle.className = "reaction-circle reaction-circle--wait";
    circle.textContent = "Ждите…";
    circle.setAttribute("aria-label", "Поле реакции");
    ctx.area.appendChild(circle);

    var feedback = document.createElement("p");
    feedback.className = "feedback";
    ctx.area.appendChild(feedback);

    ctx.onUnmount = function () {
      unmounted = true;
      clearTimeout(waitTimer);
    };

    circle.addEventListener("click", onClick);
    nextRound();

    function nextRound() {
      if (unmounted) return;
      round += 1;
      ctx.setProgress("Раунд " + round + " / " + ROUNDS);
      feedback.textContent = "";
      feedback.className = "feedback";
      phase = "waiting";
      circle.className = "reaction-circle reaction-circle--wait";
      circle.textContent = "Ждите…";

      var delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
      waitTimer = setTimeout(function () {
        if (unmounted) return;
        phase = "go";
        circle.className = "reaction-circle reaction-circle--go";
        circle.textContent = "ЖМИ!";
        startTime = Date.now();
      }, delay);
    }

    function onClick() {
      if (phase === "waiting") {
        clearTimeout(waitTimer);
        feedback.textContent = "Слишком рано! Ждите сигнала";
        feedback.className = "feedback feedback--bad";
        phase = "idle";
        waitTimer = setTimeout(function () {
          if (unmounted) return;
          if (round > ROUNDS) return;
          nextRound();
        }, 1000);
        return;
      }

      if (phase !== "go") return;
      var elapsed = Date.now() - startTime;
      phase = "idle";
      times.push(elapsed);

      var label = elapsed < 250 ? "Молниеносно!" : elapsed < 400 ? "Быстро!" : "Реакция: " + elapsed + " мс";
      feedback.textContent = label;
      feedback.className = elapsed < 350 ? "feedback feedback--ok" : "feedback";
      circle.className = "reaction-circle reaction-circle--wait";
      circle.textContent = round >= ROUNDS ? "Готово" : "Ждите…";

      if (round >= ROUNDS) {
        waitTimer = setTimeout(finish, 700);
      } else {
        waitTimer = setTimeout(nextRound, 900);
      }
    }

    function finish() {
      if (unmounted) return;
      if (times.length === 0) {
        ctx.finish({ score: 0, accuracy: 0, detail: "Нет данных" });
        return;
      }
      var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / times.length);
      var best = Math.min.apply(null, times);
      var score = Math.max(10, Math.round(2000 / avg * 100));
      ctx.finish({
        score: score,
        accuracy: null,
        detail: "Среднее: " + avg + " мс · Лучшее: " + best + " мс",
      });
    }
  }
})(window);
