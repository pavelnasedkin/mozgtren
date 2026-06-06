(function (global) {
  var EMOJIS = ["🍎", "🌟", "🎵", "🐱", "🚗", "🌈", "⚽", "📚"];
  var PREVIEW_KEY = "mozgtren_memory_preview";
  var PREVIEW_DEFAULT = 5;
  var PREVIEW_MIN = 0;
  var PREVIEW_MAX = 20;
  var PAIRS_KEY = "mozgtren_memory_pairs";
  var CELLS_KEY_LEGACY = "mozgtren_memory_cells";
  var PAIRS_DEFAULT = 6;
  var PAIRS_MIN = 2;
  var PAIRS_MAX = 12;

  function getPreviewSec() {
    try {
      var raw = localStorage.getItem(PREVIEW_KEY);
      if (raw == null || raw === "") return PREVIEW_DEFAULT;
      var n = parseInt(raw, 10);
      if (isNaN(n)) return PREVIEW_DEFAULT;
      return Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, n));
    } catch (e) {
      return PREVIEW_DEFAULT;
    }
  }

  function setPreviewSec(sec) {
    var n = parseInt(sec, 10);
    if (isNaN(n)) n = PREVIEW_DEFAULT;
    n = Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, n));
    try {
      localStorage.setItem(PREVIEW_KEY, String(n));
    } catch (e) { /* */ }
    return n;
  }

  function normalizePairs(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = PAIRS_DEFAULT;
    return Math.min(PAIRS_MAX, Math.max(PAIRS_MIN, n));
  }

  function getPairCount() {
    try {
      var raw = localStorage.getItem(PAIRS_KEY);
      if (raw != null && raw !== "") return normalizePairs(raw);

      var legacy = localStorage.getItem(CELLS_KEY_LEGACY);
      if (legacy != null && legacy !== "") {
        var cells = parseInt(legacy, 10);
        if (isNaN(cells)) cells = PAIRS_DEFAULT * 2;
        if (cells % 2 !== 0) cells -= 1;
        cells = Math.min(PAIRS_MAX * 2, Math.max(PAIRS_MIN * 2, cells));
        var fromCells = normalizePairs(cells / 2);
        localStorage.setItem(PAIRS_KEY, String(fromCells));
        localStorage.removeItem(CELLS_KEY_LEGACY);
        return fromCells;
      }
      return PAIRS_DEFAULT;
    } catch (e) {
      return PAIRS_DEFAULT;
    }
  }

  function setPairCount(pairs) {
    var n = normalizePairs(pairs);
    try {
      localStorage.setItem(PAIRS_KEY, String(n));
    } catch (e) { /* */ }
    return n;
  }

  function createSettingsRow(id, text, input) {
    var label = document.createElement("label");
    label.className = "memory-settings__label";
    label.setAttribute("for", id);
    label.textContent = text;
    label.appendChild(input);
    return label;
  }

  function bindNumericInput(input, getValue, setValue, restart) {
    function sync() {
      var before = getValue();
      var after = setValue(input.value);
      input.value = String(after);
      if (after !== before && typeof restart === "function") {
        restart();
      }
    }
    input.addEventListener("change", sync);
    input.addEventListener("blur", sync);
  }

  function createSettingsEl(options) {
    options = options || {};
    var restart = options.restart;

    var wrap = document.createElement("div");
    wrap.className = "memory-settings";

    var previewInput = document.createElement("input");
    previewInput.id = "memory-preview-sec";
    previewInput.type = "number";
    previewInput.className = "memory-settings__input";
    previewInput.min = String(PREVIEW_MIN);
    previewInput.max = String(PREVIEW_MAX);
    previewInput.step = "1";
    previewInput.inputMode = "numeric";
    previewInput.value = String(getPreviewSec());
    previewInput.setAttribute("aria-label", "Время просмотра карточек в секундах");
    bindNumericInput(previewInput, getPreviewSec, setPreviewSec, restart);

    var pairsInput = document.createElement("input");
    pairsInput.id = "memory-pairs";
    pairsInput.type = "number";
    pairsInput.className = "memory-settings__input";
    pairsInput.min = String(PAIRS_MIN);
    pairsInput.max = String(PAIRS_MAX);
    pairsInput.step = "1";
    pairsInput.inputMode = "numeric";
    pairsInput.value = String(getPairCount());
    pairsInput.setAttribute("aria-label", "Количество пар на поле");
    bindNumericInput(pairsInput, getPairCount, setPairCount, restart);

    wrap.appendChild(
      createSettingsRow("memory-preview-sec", "Время просмотра (сек)", previewInput)
    );
    wrap.appendChild(createSettingsRow("memory-pairs", "Количество пар", pairsInput));
    return wrap;
  }

  BrainEngine.register({
    id: "memory",
    title: "Память",
    emoji: "🃏",
    description: "Найдите все пары карточек",
    durationHint: "~2 мин",
    start: function (ctx) {
      runMemory(ctx, getPairCount());
    },
    getSettingsEl: createSettingsEl,
  });

  function gridColumns(cellCount) {
    if (cellCount <= 6) return 3;
    if (cellCount <= 12) return 4;
    if (cellCount <= 20) return 5;
    return 6;
  }

  function runMemory(ctx, pairCount) {
    var area = ctx.area;
    var cellCount = pairCount * 2;
    var flipped = [];
    var matched = 0;
    var moves = 0;
    var lock = false;
    var countdownId = null;
    var rememberBtn = null;
    var hintBtn = null;
    var actionsEl = null;
    var inPreview = false;
    var previewSec = getPreviewSec();
    var deck = buildDeck(pairCount);

    area.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "memory-grid";
    grid.style.gridTemplateColumns = "repeat(" + gridColumns(cellCount) + ", 1fr)";
    area.appendChild(grid);

    actionsEl = document.createElement("div");
    actionsEl.className = "memory-actions";
    area.appendChild(actionsEl);

    ctx.setProgress("Пары: 0 / " + pairCount);

    deck.forEach(function (symbol, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-card";
      btn.textContent = symbol;
      btn.dataset.index = String(index);
      btn.dataset.symbol = symbol;
      btn.addEventListener("click", onFlip);
      grid.appendChild(btn);
    });

    ctx.onUnmount = function () {
      if (countdownId) clearInterval(countdownId);
    };

    if (previewSec > 0) {
      ensureHintBtn();
      startPreview();
    } else {
      hideAllCards();
      ctx.setHint("Откройте две одинаковые карточки");
    }

    function hideAllCards() {
      var cards = grid.querySelectorAll(".memory-card");
      for (var i = 0; i < cards.length; i++) {
        if (!cards[i].classList.contains("memory-card--matched")) {
          cards[i].classList.add("memory-card--hidden");
        }
      }
    }

    function showAllUnmatchedCards() {
      var cards = grid.querySelectorAll(".memory-card");
      for (var i = 0; i < cards.length; i++) {
        if (!cards[i].classList.contains("memory-card--matched")) {
          cards[i].classList.remove("memory-card--hidden");
        }
      }
    }

    function setActionVisible(btn, visible) {
      if (!btn) return;
      btn.classList.toggle("memory-action--hidden", !visible);
    }

    function ensureRememberBtn() {
      if (rememberBtn) {
        setActionVisible(rememberBtn, true);
        return rememberBtn;
      }
      rememberBtn = document.createElement("button");
      rememberBtn.type = "button";
      rememberBtn.className = "btn btn--primary memory-remember-btn";
      rememberBtn.textContent = "Запомнил";
      rememberBtn.addEventListener("click", function () {
        endPreview();
      });
      actionsEl.appendChild(rememberBtn);
      return rememberBtn;
    }

    function ensureHintBtn() {
      if (hintBtn) return hintBtn;
      hintBtn = document.createElement("button");
      hintBtn.type = "button";
      hintBtn.className = "btn btn--secondary memory-hint-btn";
      hintBtn.textContent = "Подсказка";
      hintBtn.addEventListener("click", function () {
        if (inPreview || lock || previewSec <= 0 || matched >= pairCount) return;
        startPreview();
      });
      actionsEl.appendChild(hintBtn);
      return hintBtn;
    }

    function updateHintBtn() {
      if (previewSec <= 0) {
        setActionVisible(hintBtn, false);
        return;
      }
      ensureHintBtn();
      setActionVisible(hintBtn, !inPreview && matched < pairCount);
    }

    function startPreview() {
      if (previewSec <= 0) return;
      if (countdownId) {
        clearInterval(countdownId);
        countdownId = null;
      }

      inPreview = true;
      flipped = [];
      lock = true;
      showAllUnmatchedCards();
      ensureRememberBtn();
      setActionVisible(rememberBtn, true);
      setActionVisible(hintBtn, false);

      var secondsLeft = previewSec;
      ctx.setHint("Запоминайте карточки");
      ctx.showTimer(true);
      ctx.setTimer(secondsLeft);
      countdownId = setInterval(function () {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          endPreview();
          return;
        }
        ctx.setTimer(secondsLeft);
      }, 1000);
    }

    function endPreview() {
      if (countdownId) {
        clearInterval(countdownId);
        countdownId = null;
      }
      inPreview = false;
      hideAllCards();
      flipped = [];
      lock = false;
      setActionVisible(rememberBtn, false);
      ctx.showTimer(false);
      ctx.setHint("Откройте две одинаковые карточки");
      updateHintBtn();
    }

    function onFlip() {
      if (lock || this.disabled || !this.classList.contains("memory-card--hidden")) return;
      this.classList.remove("memory-card--hidden");
      flipped.push(this);

      if (flipped.length < 2) return;

      lock = true;
      moves += 1;
      var a = flipped[0];
      var b = flipped[1];

      if (a.dataset.symbol === b.dataset.symbol) {
        a.classList.add("memory-card--matched");
        b.classList.add("memory-card--matched");
        a.disabled = true;
        b.disabled = true;
        matched += 1;
        ctx.setProgress("Пары: " + matched + " / " + pairCount);
        flipped = [];
        lock = false;
        if (matched >= pairCount) {
          setActionVisible(hintBtn, false);
          var score = Math.max(10, 100 - moves * 3);
          var accuracy = Math.round((pairCount / moves) * 100);
          ctx.finish({ score: score, accuracy: Math.min(100, accuracy), detail: "Ходов: " + moves });
        }
      } else {
        setTimeout(function () {
          a.classList.add("memory-card--hidden");
          b.classList.add("memory-card--hidden");
          flipped = [];
          lock = false;
        }, 700);
      }
    }
  }

  function buildDeck(pairCount) {
    var items = [];
    var i;
    for (i = 0; i < pairCount; i++) {
      var s = EMOJIS[i % EMOJIS.length];
      items.push(s, s);
    }
    return shuffle(items);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
})(window);
