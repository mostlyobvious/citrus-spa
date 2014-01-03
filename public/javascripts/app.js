(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("citrus_console", function(exports, require, module) {
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

window.citrus = {};

window.citrus.console = {};

require('utils');

citrus.console.Application = (function() {
  function Application() {
    var glue, gui, serverSide, usecase;
    usecase = new citrus.console.Usecase();
    gui = new citrus.console.Gui();
    serverSide = new citrus.console.ServerSide('http://api.citrus.arkency');
    glue = new citrus.console.Glue(usecase, gui, serverSide);
    usecase.start();
  }

  return Application;

})();

citrus.Build = (function() {
  function Build(uuid, output) {
    this.uuid = uuid;
    this.output = output != null ? output : "";
  }

  return Build;

})();

citrus.console.Usecase = (function() {
  function Usecase() {
    this.addConsoleEntry = __bind(this.addConsoleEntry, this);
    this.setBuild = __bind(this.setBuild, this);
    this.start = __bind(this.start, this);
  }

  Usecase.prototype.start = function() {};

  Usecase.prototype.setBuild = function(build) {
    this.build = build;
  };

  Usecase.prototype.addConsoleEntry = function(entry) {
    return this.build.output << entry;
  };

  return Usecase;

})();

citrus.console.Glue = (function() {
  function Glue(usecase, gui, serverSide) {
    this.usecase = usecase;
    this.gui = gui;
    this.serverSide = serverSide;
    this.applyLogging = __bind(this.applyLogging, this);
    this.appendConsoleEntry = __bind(this.appendConsoleEntry, this);
    this.addConsoleEntry = __bind(this.addConsoleEntry, this);
    this.fetchConsole = __bind(this.fetchConsole, this);
    this.showConsole = __bind(this.showConsole, this);
    this.loadData = __bind(this.loadData, this);
    this.applyLogging();
    Before(this.usecase, 'start', this.loadData);
    After(this.usecase, 'setBuild', this.showConsole);
    After(this.usecase, 'setBuild', this.fetchConsole);
    After(this.serverSide, 'consoleDataReceived', this.addConsoleEntry);
    After(this.usecase, 'addConsoleEntry', this.appendConsoleEntry);
  }

  Glue.prototype.loadData = function() {
    var uuid;
    uuid = this.gui.getBuildIdFromUrl();
    return this.usecase.setBuild(new citrus.Build(uuid));
  };

  Glue.prototype.showConsole = function(build) {
    return this.gui.showConsole(build);
  };

  Glue.prototype.fetchConsole = function(build) {
    return this.serverSide.fetchConsole(build);
  };

  Glue.prototype.addConsoleEntry = function(entry) {
    return this.usecase.addConsoleEntry(entry);
  };

  Glue.prototype.appendConsoleEntry = function(entry) {
    return this.gui.appendConsoleEntry(entry);
  };

  Glue.prototype.applyLogging = function() {
    var _this = this;
    return [this.usecase, this.gui, this.serverSide].map(function(component) {
      return LogAll(component);
    });
  };

  return Glue;

})();

citrus.console.Gui = (function() {
  function Gui() {
    this.appendConsoleEntry = __bind(this.appendConsoleEntry, this);
    this.showConsole = __bind(this.showConsole, this);
    this.getBuildIdFromUrl = __bind(this.getBuildIdFromUrl, this);
  }

  Gui.prototype.getBuildIdFromUrl = function() {
    return $.url().param('uuid');
  };

  Gui.prototype.showConsole = function(build) {
    return $('[data-role="build-name"]').html("Build " + build.uuid);
  };

  Gui.prototype.appendConsoleEntry = function(entry) {
    return $('[data-role="build-console"]').append(entry);
  };

  return Gui;

})();

citrus.console.InMemoryServerSide = (function() {
  function InMemoryServerSide() {
    this.consoleDataReceived = __bind(this.consoleDataReceived, this);
    this.fetchConsole = __bind(this.fetchConsole, this);
  }

  InMemoryServerSide.prototype.fetchConsole = function(build) {
    var intervalId,
      _this = this;
    this.consoleDataReceived('........');
    intervalId = setInterval((function() {
      return _this.consoleDataReceived('.');
    }), 25);
    return setTimeout((function() {
      clearInterval(intervalId);
      return _this.consoleDataReceived('\n\nFinished in 0.84704 seconds\n62 examples, 0 failures\n\nRandomized with seed 15015');
    }), 1000);
  };

  InMemoryServerSide.prototype.consoleDataReceived = function(data) {};

  return InMemoryServerSide;

})();

citrus.console.ServerSide = (function() {
  function ServerSide(apiUrl) {
    this.apiUrl = apiUrl;
    this.consoleDataReceived = __bind(this.consoleDataReceived, this);
    this.fetchConsole = __bind(this.fetchConsole, this);
  }

  ServerSide.prototype.fetchConsole = function(build) {
    var eventSource,
      _this = this;
    eventSource = new EventSource("" + this.apiUrl + "/builds/" + build.uuid + "/console");
    return eventSource.addEventListener('message', function(message) {
      return _this.consoleDataReceived(message.data);
    });
  };

  ServerSide.prototype.consoleDataReceived = function(data) {};

  return ServerSide;

})();

$(document).ready(function() {
  return new citrus.console.Application();
});
});

;require.register("utils", function(exports, require, module) {
var __hasProp = {}.hasOwnProperty;

_.defaults(this, {
  LogAll: function(object) {
    var key, value, _results;
    _results = [];
    for (key in object) {
      if (!__hasProp.call(object, key)) continue;
      value = object[key];
      if (_.isFunction(value)) {
        _results.push((function(key) {
          return Before(object, key, function() {
            return console.log("#" + key);
          });
        })(key));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  }
});
});

;
//# sourceMappingURL=app.js.map