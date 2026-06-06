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

  function clearCacheStorage() {
    if (typeof caches === "undefined" || !caches.keys) {
      return Promise.resolve();
    }
    return caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          return caches.delete(key);
        })
      );
    });
  }

  function unregisterServiceWorkers() {
    if (!("serviceWorker" in navigator)) {
      return Promise.resolve();
    }
    return navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(
        regs.map(function (reg) {
          return reg.unregister();
        })
      );
    });
  }

  function clearIndexedDB() {
    if (!window.indexedDB || !indexedDB.databases) {
      return Promise.resolve();
    }
    return indexedDB
      .databases()
      .then(function (dbs) {
        return Promise.all(
          dbs.map(function (db) {
            return new Promise(function (resolve) {
              var req = indexedDB.deleteDatabase(db.name);
              req.onsuccess = resolve;
              req.onerror = resolve;
              req.onblocked = resolve;
            });
          })
        );
      })
      .catch(function () {
        return Promise.resolve();
      });
  }

  function collectSameOriginAssetUrls() {
    var urls = [location.href.split("#")[0].split("?")[0]];
    var seen = {};

    function add(url) {
      try {
        var abs = new URL(url, location.href).href.split("#")[0];
        if (abs.indexOf(location.origin) !== 0 || seen[abs]) return;
        seen[abs] = true;
        urls.push(abs);
      } catch (e) { /* */ }
    }

    document.querySelectorAll("link[href], script[src], img[src]").forEach(function (el) {
      add(el.href || el.src);
    });
    return urls;
  }

  function refreshHttpCache() {
    return Promise.all(
      collectSameOriginAssetUrls().map(function (url) {
        return fetch(url, { cache: "reload", credentials: "same-origin" }).catch(function () {});
      })
    );
  }

  function resetAllSiteData() {
    try {
      localStorage.clear();
    } catch (e) { /* */ }
    try {
      sessionStorage.clear();
    } catch (e) { /* */ }

    return clearCacheStorage()
      .then(unregisterServiceWorkers)
      .then(clearIndexedDB)
      .then(refreshHttpCache);
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
