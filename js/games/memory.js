(function (global) {
  var EMOJIS = ["🍎", "🌟", "🎵", "🐱", "🚗", "🌈", "⚽", "📚"];
  var PREVIEW_KEY = "mozgtren_memory_preview";
  var PREVIEW_DEFAULT = 5;
  var PREVIEW_MIN = 0;
  var PREVIEW_MAX = 20;
  var CELLS_KEY = "mozgtren_memory_cells";
  var CELLS_DEFAULT = 6;
  var CELLS_MIN = 4;
  var CELLS_MAX = 24;

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

  function normalizeCells(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = CELLS_DEFAULT;
    n = Math.min(CELLS_MAX, Math.max(CELLS_MIN, n));
    if (n % 2 !== 0) n -= 1;
    if (n < CELLS_MIN) n = CELLS_MIN;
    return n;
  }

  function getCellCount() {
    try {
      var raw = localStorage.getItem(CELLS_KEY);
      if (raw == null || raw === "") return CELLS_DEFAULT;
      return normalizeCells(raw);
    } catch (e) {
      return CELLS_DEFAULT;
    }
  }

  function setCellCount(cells) {
    var n = normalizeCells(cells);
    try {
      localStorage.setItem(CELLS_KEY, String(n));
    } catch (e) { /* */ }
    return n;
  }

  function pairCountFromCells(cells) {
    return cells / 2;
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
    previewInput.setAttribute("aria-label", "Секунд показа всех карточек в начале игры");
    bindNumericInput(previewInput, getPreviewSec, setPreviewSec, restart);

    var cellsInput = document.createElement("input");
    cellsInput.id = "memory-cells";
    cellsInput.type = "number";
    cellsInput.className = "memory-settings__input";
    cellsInput.min = String(CELLS_MIN);
    cellsInput.max = String(CELLS_MAX);
    cellsInput.step = "2";
    cellsInput.inputMode = "numeric";
    cellsInput.value = String(getCellCount());
    cellsInput.setAttribute("aria-label", "Количество ячеек на поле");
    bindNumericInput(cellsInput, getCellCount, setCellCount, restart);

    wrap.appendChild(
      createSettingsRow("memory-preview-sec", "Просмотр в начале (сек)", previewInput)
    );
    wrap.appendChild(createSettingsRow("memory-cells", "Количество ячеек", cellsInput));
    return wrap;
  }

  BrainEngine.register({
    id: "memory",
    title: "Память",
    emoji: "🃏",
    description: "Найдите все пары карточек",
    durationHint: "~2 мин",
    start: function (ctx) {
      runMemory(ctx, pairCountFromCells(getCellCount()));
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
    var previewTimer = null;
    var previewSec = getPreviewSec();
    var deck = buildDeck(pairCount);

    area.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "memory-grid";
    grid.style.gridTemplateColumns = "repeat(" + gridColumns(cellCount) + ", 1fr)";
    area.appendChild(grid);

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
      if (previewTimer) clearTimeout(previewTimer);
    };

    if (previewSec > 0) {
      lock = true;
      ctx.setHint("Запоминайте карточки · " + previewSec + " сек");
      previewTimer = setTimeout(endPreview, previewSec * 1000);
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

    function endPreview() {
      previewTimer = null;
      hideAllCards();
      lock = false;
      ctx.setHint("Откройте две одинаковые карточки");
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
