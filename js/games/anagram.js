(function (global) {
  var WORDS = [
    "КОШКА", "СОБАКА", "ЯБЛОКО", "КНИГА", "ЛАМПА",
    "ЗАМОК", "КАМЕНЬ", "ДЕРЕВО", "ОБЛАКО", "БЕРЕГ",
    "ВЕТЕР", "ЗВЕЗДА", "КАРМАН", "МОНЕТА", "ПАЛКА",
    "РЫНОК", "САХАР", "ТУМБА", "УЛИЦА", "ФОРМА",
    "ЧАСТЬ", "ШКАФ", "ЭКРАН", "ЮМОР", "ЯЩИК",
    "МЫСЛЬ", "ЗИМА", "ЛИСА", "КРАН", "ПАРУС",
  ];
  var ROUNDS = 8;
  var TIME_PER_ROUND = 20;

  BrainEngine.register({
    id: "anagram",
    title: "Анаграммы",
    emoji: "🔤",
    description: "Составьте слово из перемешанных букв",
    durationHint: "~2 мин",
    start: function (ctx) {
      runAnagram(ctx);
    },
  });

  function runAnagram(ctx) {
    var round = 0;
    var correct = 0;
    var timerId = null;
    var deadline = 0;
    var unmounted = false;
    var usedWords = [];

    ctx.setHint("Введите слово, которое скрыто за анаграммой");

    ctx.onUnmount = function () {
      unmounted = true;
      clearInterval(timerId);
    };

    nextRound();

    function nextRound() {
      if (unmounted) return;
      if (round >= ROUNDS) return finish();
      round += 1;
      ctx.setProgress("Слово " + round + " / " + ROUNDS);

      var word = pickWord();
      var scrambled = scramble(word);

      ctx.area.innerHTML = "";

      var scrambleEl = document.createElement("p");
      scrambleEl.className = "anagram-scramble";
      scrambleEl.textContent = scrambled;
      ctx.area.appendChild(scrambleEl);

      var feedback = document.createElement("p");
      feedback.className = "feedback";
      ctx.area.appendChild(feedback);

      var inputRow = document.createElement("div");
      inputRow.className = "math-input-row";

      var input = document.createElement("input");
      input.type = "text";
      input.className = "math-input";
      input.setAttribute("aria-label", "Ваш ответ");
      input.autocomplete = "off";
      input.autocorrect = "off";
      input.spellcheck = false;
      input.style.textTransform = "uppercase";
      setTimeout(function () { if (!unmounted) input.focus(); }, 80);

      var okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "btn btn--primary";
      okBtn.textContent = "OK";
      okBtn.style.flex = "0 0 auto";
      okBtn.style.minWidth = "72px";

      inputRow.appendChild(input);
      inputRow.appendChild(okBtn);
      ctx.area.appendChild(inputRow);

      var hintBtn = document.createElement("button");
      hintBtn.type = "button";
      hintBtn.className = "btn btn--secondary";
      hintBtn.textContent = "Пропустить";
      hintBtn.style.marginTop = "8px";
      ctx.area.appendChild(hintBtn);

      function submit() {
        clearInterval(timerId);
        var val = input.value.trim().toUpperCase();
        if (val === word) {
          correct += 1;
          feedback.textContent = "Верно! " + word;
          feedback.className = "feedback feedback--ok";
        } else if (val === "") {
          feedback.textContent = "Ответ: " + word;
          feedback.className = "feedback feedback--bad";
        } else {
          feedback.textContent = "Нет. Ответ: " + word;
          feedback.className = "feedback feedback--bad";
        }
        okBtn.disabled = true;
        hintBtn.disabled = true;
        input.disabled = true;
        setTimeout(nextRound, 900);
      }

      okBtn.addEventListener("click", submit);
      hintBtn.addEventListener("click", function () {
        input.value = "";
        submit();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") submit();
      });

      deadline = Date.now() + TIME_PER_ROUND * 1000;
      ctx.showTimer(true);
      timerId = setInterval(function () {
        if (unmounted) { clearInterval(timerId); return; }
        var left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        ctx.setTimer(left);
        if (left <= 0) {
          clearInterval(timerId);
          submit();
        }
      }, 200);
    }

    function finish() {
      ctx.showTimer(false);
      var accuracy = Math.round((correct / ROUNDS) * 100);
      ctx.finish({
        score: correct * 12,
        accuracy: accuracy,
        detail: "Угадано: " + correct + " из " + ROUNDS,
      });
    }

    function pickWord() {
      var pool = WORDS.filter(function (w) { return usedWords.indexOf(w) === -1; });
      if (pool.length === 0) { usedWords = []; pool = WORDS.slice(); }
      var w = pool[Math.floor(Math.random() * pool.length)];
      usedWords.push(w);
      return w;
    }

    function scramble(word) {
      var arr = word.split("");
      var tries = 0;
      do {
        shuffle(arr);
        tries += 1;
      } while (arr.join("") === word && tries < 20);
      return arr.join("");
    }

    function shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
    }
  }
})(window);
