(function (global) {
  var games = {};

  function register(game) {
    games[game.id] = game;
  }

  function get(id) {
    return games[id];
  }

  function all() {
    return Object.keys(games).map(function (id) {
      return games[id];
    });
  }

  function pickDaily(count) {
    var list = all();
    var shuffled = shuffle(list.slice());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  global.BrainEngine = {
    register: register,
    get: get,
    all: all,
    pickDaily: pickDaily,
  };
})(window);
