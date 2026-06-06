(function (global) {
  var SIZE = 4;
  var TOTAL = SIZE * SIZE;

  BrainEngine.register({
    id: "puzzle15",
    title: "Пятнашки",
    emoji: "🔢",
    description: "Соберите числа по порядку",
    durationHint: "~3 мин",
    start: function (ctx) {
      runPuzzle(ctx);
    },
  });

  function runPuzzle(ctx) {
    var tiles = [];
    var blank = TOTAL - 1;
    var moves = 0;
    var startTime = Date.now();
    var timerId = null;
    var unmounted = false;

    ctx.setHint("Нажмите плитку рядом с пустой, чтобы сдвинуть");
    ctx.showTimer(true);

    ctx.onUnmount = function () {
      unmounted = true;
      clearInterval(timerId);
    };

    tiles = generateSolvable();
    blank = tiles.indexOf(0);

    ctx.area.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "puzzle-grid";
    ctx.area.appendChild(grid);

    var movesEl = document.createElement("p");
    movesEl.className = "puzzle-moves";
    ctx.area.appendChild(movesEl);

    render();

    timerId = setInterval(function () {
      if (unmounted) { clearInterval(timerId); return; }
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      ctx.setTimer(elapsed);
    }, 1000);

    function render() {
      grid.innerHTML = "";
      for (var i = 0; i < TOTAL; i++) {
        (function (idx) {
          var btn = document.createElement("button");
          btn.type = "button";
          var val = tiles[idx];
          if (val === 0) {
            btn.className = "puzzle-tile puzzle-tile--blank";
            btn.textContent = "";
            btn.disabled = true;
          } else {
            btn.className = "puzzle-tile";
            btn.textContent = val;
            btn.addEventListener("click", function () { tryMove(idx); });
          }
          grid.appendChild(btn);
        })(i);
      }
      movesEl.textContent = "Ходов: " + moves;
      ctx.setProgress("Ходов: " + moves);
    }

    function tryMove(idx) {
      var blankRow = Math.floor(blank / SIZE);
      var blankCol = blank % SIZE;
      var tileRow = Math.floor(idx / SIZE);
      var tileCol = idx % SIZE;
      var adjacent =
        (tileRow === blankRow && Math.abs(tileCol - blankCol) === 1) ||
        (tileCol === blankCol && Math.abs(tileRow - blankRow) === 1);

      if (!adjacent) return;

      tiles[blank] = tiles[idx];
      tiles[idx] = 0;
      blank = idx;
      moves += 1;
      render();

      if (isSolved()) {
        clearInterval(timerId);
        var elapsed = Math.floor((Date.now() - startTime) / 1000);
        var score = Math.max(10, 1000 - moves * 5 - elapsed);
        ctx.finish({
          score: score,
          accuracy: null,
          detail: "Ходов: " + moves + " · Время: " + elapsed + " с",
        });
      }
    }

    function isSolved() {
      for (var i = 0; i < TOTAL - 1; i++) {
        if (tiles[i] !== i + 1) return false;
      }
      return tiles[TOTAL - 1] === 0;
    }

    function generateSolvable() {
      var arr;
      do {
        arr = shuffle(seq(TOTAL));
      } while (!isSolvable(arr));
      return arr;
    }

    function seq(n) {
      var a = [];
      for (var i = 1; i < n; i++) a.push(i);
      a.push(0);
      return a;
    }

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function isSolvable(arr) {
      var inv = 0;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === 0) continue;
        for (var j = i + 1; j < arr.length; j++) {
          if (arr[j] !== 0 && arr[i] > arr[j]) inv += 1;
        }
      }
      var blankRow = Math.floor(arr.indexOf(0) / SIZE);
      var blankFromBottom = SIZE - blankRow;
      if (SIZE % 2 === 1) return inv % 2 === 0;
      if (blankFromBottom % 2 === 0) return inv % 2 === 1;
      return inv % 2 === 0;
    }
  }
})(window);
