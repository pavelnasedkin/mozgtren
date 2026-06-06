(function (global) {
  var KEY = "mozgtren_v1";

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      var data = JSON.parse(raw);
      return merge(defaultData(), data);
    } catch (e) {
      return defaultData();
    }
  }

  function defaultData() {
    return {
      lastPlayDate: null,
      streak: 0,
      best: {},
      totals: { sessions: 0, games: 0 },
    };
  }

  function merge(base, patch) {
    var out = Object.assign({}, base, patch);
    out.best = Object.assign({}, base.best, patch.best || {});
    out.totals = Object.assign({}, base.totals, patch.totals || {});
    return out;
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* quota */ }
  }

  function recordSession() {
    var data = load();
    var today = todayKey();
    if (data.lastPlayDate !== today) {
      var yesterday = yesterdayKey();
      data.streak = data.lastPlayDate === yesterday ? data.streak + 1 : 1;
      data.lastPlayDate = today;
    }
    data.totals.sessions += 1;
    save(data);
    return data;
  }

  function yesterdayKey() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function recordGame(gameId, score, accuracy) {
    var data = load();
    data.totals.games += 1;
    var prev = data.best[gameId] || 0;
    if (score > prev) data.best[gameId] = score;
    save(data);
    return { best: data.best[gameId], isRecord: score > prev };
  }

  function statsHtml() {
    var data = load();
    var streak = data.streak || 0;
    var sessions = data.totals.sessions || 0;
    return (
      '<div class="stats__row"><span>Серия дней</span><strong>' +
      streak +
      "</strong></div>" +
      '<div class="stats__row"><span>Тренировок</span><strong>' +
      sessions +
      "</strong></div>"
    );
  }

  function resetAllSiteData() {
    try {
      localStorage.clear();
    } catch (e) { /* */ }
    try {
      sessionStorage.clear();
    } catch (e) { /* */ }

    if (typeof caches !== "undefined" && caches.keys) {
      return caches.keys().then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            return caches.delete(key);
          })
        );
      });
    }
    return Promise.resolve();
  }

  global.BrainStorage = {
    load: load,
    save: save,
    recordSession: recordSession,
    recordGame: recordGame,
    statsHtml: statsHtml,
    todayKey: todayKey,
    resetAllSiteData: resetAllSiteData,
  };
})(window);
