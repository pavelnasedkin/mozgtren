(function () {
  if (location.search.indexOf("_reset=") !== -1) {
    history.replaceState(null, "", location.pathname || "/");
  }

  var screenHome = document.getElementById("screen-home");
  var screenGame = document.getElementById("screen-game");
  var screenResult = document.getElementById("screen-result");
  var gameArea = document.getElementById("game-area");
  var gameTitle = document.getElementById("game-title");
  var gameProgress = document.getElementById("game-progress");
  var gameHint = document.getElementById("game-hint");
  var gameTimer = document.getElementById("game-timer");
  var statsPanel = document.getElementById("stats-panel");
  var gameList = document.getElementById("game-list");
  var gameSettings = document.getElementById("game-settings");

  var queue = [];
  var queueIndex = 0;
  var isDaily = false;
  var currentGameId = null;
  var currentUnmount = null;

  document.getElementById("btn-daily").addEventListener("click", startDaily);
  document.getElementById("btn-back").addEventListener("click", goHome);
  document.getElementById("btn-home").addEventListener("click", goHome);
  document.getElementById("btn-next").addEventListener("click", onNext);
  document.getElementById("btn-reset-site").addEventListener("click", resetSiteSettings);
  document.querySelector(".result-actions").addEventListener("click", function (e) {
    var target = e.target.closest("#btn-replay");
    if (target) onReplay();
  });

  renderHome();

  function renderHome() {
    statsPanel.innerHTML = BrainStorage.statsHtml();
    gameList.innerHTML = "";
    BrainEngine.all().forEach(function (game) {
      var li = document.createElement("li");
      li.className = "game-list__item";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--game";
      btn.innerHTML =
        '<span class="emoji">' +
        game.emoji +
        "</span><span><strong>" +
        game.title +
        "</strong><br><small style='color:var(--muted);font-weight:400'>" +
        game.description +
        "</small></span>";
      btn.addEventListener("click", function () {
        startSingle(game.id);
      });
      li.appendChild(btn);
      gameList.appendChild(li);
    });
  }

  function startDaily() {
    isDaily = true;
    queue = BrainEngine.pickDaily(3).map(function (g) {
      return g.id;
    });
    queueIndex = 0;
    BrainStorage.recordSession();
    startGame(queue[0]);
  }

  function startSingle(id) {
    isDaily = false;
    queue = [id];
    queueIndex = 0;
    startGame(id);
  }

  function startGame(id) {
    var game = BrainEngine.get(id);
    if (!game) return;

    currentGameId = id;
    cleanupGame();
    showScreen("game");
    mountGameSettings(game, function () {
      startGame(id);
    });
    gameTitle.textContent = game.emoji + " " + game.title;
    gameProgress.textContent = isDaily
      ? "Тренировка " + (queueIndex + 1) + " / " + queue.length
      : game.durationHint || "";
    gameHint.textContent = "";
    gameArea.innerHTML = "<p style='color:var(--muted)'>Загрузка…</p>";
    gameTimer.hidden = true;

    var ctx = {
      area: gameArea,
      setHint: function (t) {
        gameHint.textContent = t;
      },
      setProgress: function (t) {
        if (!isDaily) gameProgress.textContent = t;
        else
          gameProgress.textContent =
            "Тренировка " + (queueIndex + 1) + " / " + queue.length + " · " + t;
      },
      showTimer: function (on) {
        gameTimer.hidden = !on;
      },
      setTimer: function (n) {
        gameTimer.textContent = String(n);
      },
      finish: function (result) {
        showResult(game, result);
      },
      onUnmount: null,
    };

    setTimeout(function () {
      gameArea.innerHTML = "";
      game.start(ctx);
      currentUnmount = ctx.onUnmount;
    }, 50);
  }

  function showResult(game, result) {
    currentGameId = game.id;
    var rec = BrainStorage.recordGame(game.id, result.score, result.accuracy);
    cleanupGame();
    showScreen("result");

    document.getElementById("result-title").textContent = game.title + " — готово!";
    document.getElementById("result-score").textContent = result.score + " очков";
    var detail = result.detail || "";
    if (result.accuracy != null) detail += (detail ? " · " : "") + "Точность " + result.accuracy + "%";
    if (rec.isRecord) detail += " · 🏆 рекорд!";
    document.getElementById("result-detail").textContent = detail;

    var nextBtn = document.getElementById("btn-next");
    if (isDaily && queueIndex < queue.length - 1) {
      nextBtn.textContent = "Следующая игра";
      nextBtn.classList.remove("result-action--hidden");
    } else if (isDaily && queueIndex >= queue.length - 1) {
      nextBtn.textContent = "Завершить тренировку";
      nextBtn.classList.remove("result-action--hidden");
    } else {
      nextBtn.classList.add("result-action--hidden");
    }
  }

  function onNext() {
    if (isDaily && queueIndex < queue.length - 1) {
      queueIndex += 1;
      startGame(queue[queueIndex]);
      return;
    }
    goHome();
  }

  function onReplay() {
    var id = currentGameId || queue[queueIndex];
    if (!id) return;
    startGame(id);
  }

  function mountGameSettings(game, onSettingChange) {
    gameSettings.innerHTML = "";
    if (game && typeof game.getSettingsEl === "function") {
      gameSettings.appendChild(
        game.getSettingsEl({ restart: onSettingChange })
      );
      gameSettings.hidden = false;
    } else {
      gameSettings.hidden = true;
    }
  }

  function cleanupGame() {
    if (typeof currentUnmount === "function") {
      try {
        currentUnmount();
      } catch (e) { /* */ }
    }
    currentUnmount = null;
    gameSettings.innerHTML = "";
    gameSettings.hidden = true;
  }

  function goHome() {
    cleanupGame();
    renderHome();
    showScreen("home");
  }

  function resetSiteSettings() {
    var ok = window.confirm(
      "Сбросить все данные сайта?\n\nБудут удалены прогресс, рекорды, настройки, кэш и сохранённые файлы сайта. Страница перезагрузится. Действие нельзя отменить."
    );
    if (!ok) return;

    document.getElementById("btn-reset-site").disabled = true;

    BrainStorage.resetAllSiteData().then(function () {
      var path = location.pathname || "/";
      location.replace(path + "?_reset=" + Date.now());
    });
  }

  function showScreen(name) {
    screenHome.classList.toggle("screen--active", name === "home");
    screenHome.hidden = name !== "home";
    screenGame.classList.toggle("screen--active", name === "game");
    screenGame.hidden = name !== "game";
    screenResult.classList.toggle("screen--active", name === "result");
    screenResult.hidden = name !== "result";
  }
})();
