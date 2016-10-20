webpackJsonp([3],{

/***/ 348:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = function(app) {
		[
			//Big Chris must go first!
			__webpack_require__(349),
			__webpack_require__(350),
			__webpack_require__(351),
			__webpack_require__(352),
			__webpack_require__(353),
			__webpack_require__(354),
			__webpack_require__(355),
			__webpack_require__(357),
			__webpack_require__(359),
			__webpack_require__(360),
			__webpack_require__(362),
			__webpack_require__(364),
			__webpack_require__(365)
		].forEach(function(module) {
			module(app);
		});
	};


/***/ },

/***/ 349:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		var data = {
			url: window.location.pathname
		};

		app.logger.snitch = function() {
			var args = [].slice.call(arguments);

			var keys = args.concat().reduce(function(keys, arg) {
				if (typeof arg === 'string'){
					keys.push(args.shift());
				}

				return keys;
			}, []);

			var obj = args.shift();
			var last = keys.pop();
			var context = data;
			var key;

			while(key = keys.shift()) {
				context = context[key] || (context[key] = {});
			}

			if (typeof obj === 'undefined') {
				return context[last];
			}

			if (!context[last]) {
				context[last] = obj;
			} else if (Array.isArray(obj)) {
				context[last].push.apply(context[last], obj);
			} else if (typeof obj === 'object') {
				context[last] = obj;
			}
			return context[last];
		};

		window.onbeforeunload = function() {
			window.fetch && fetch('http://telenor.team/snitch/performance', {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
		};
	};


/***/ },

/***/ 350:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {

		var body = app.core.dom.find('body');

		var validators = [

			function() {
				var modules = body.find('[data-component]:not([data-module])');
				if(modules.length){
					console.groupCollapsed('%cUsing [data-component]: %d', 'color:#00B050', modules.length);
					modules.each(function(index, element) {
						console.log('Module %o', element);
					});
					console.groupEnd();
				}
			},

			function() {
				var modules = body.find('[data-module]');
				if (modules.length) {
					console.groupCollapsed('%cOutstanding [data-module]: %c%d', 'color:#f79646', 'color:#ff0000', modules.length);
					modules.each(function(index, element) {
						console.log('Module %o', element);
					});
					console.groupEnd();
				}
			}
		];

		console.groupCollapsed('%cTelenor Aura refactoring notifications', 'color:#24aaaa; font-size:14px');
		validators.forEach(function(fn) { fn(); });
		console.groupEnd();
	};


/***/ },

/***/ 351:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		app.logger.snitch('warnings', 'js', []);

		window.onerror = function(errorMsg, url, lineNumber, column) {
			app.logger.snitch('warnings', 'js', [{
				msg: errorMsg,
				url: url,
				lineNumber: lineNumber,
				column: column
			}]);
		};
	};


/***/ },

/***/ 352:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		var frames = 0;
		var maxElapsed = 1000;
		var maxSamples = 1000;
		var time;
		var tick;
		var previousTime;

		previousTime = window.performance.now();

		tick = function() {
			var elapsed;

			time = window.performance.now();
			elapsed = time - previousTime;

			if (elapsed < maxElapsed) {
				++frames;

				requestAnimationFrame(tick);

			} else {
				app.logger.snitch('fps', [frames]);
				maxSamples--;

				previousTime = time;
				frames = 0;

				if (maxSamples > 0) {
					requestAnimationFrame(tick);
				}
			}
		};

		requestAnimationFrame(tick);
	};


/***/ },

/***/ 353:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		var flagsOff;
		var maxSamples = 1000;
		var id;
		var TIMEOUT = 1000;

		if (!(window.performance && window.performance.memory)) {
			return;
		}

		flagsOff = performance.memory.usedJSHeapSize === (new Date(), performance.memory.usedJSHeapSize) && /0{3}$/.test(String(performance.memory.usedJSHeapSize));

		if (flagsOff) {
			console.error('Please, open chrome with these flags --enable-precise-memory-info --enable-memory-info --enable-memory-benchmarking');
		} else {
			id = setInterval(function() {
				var memory = window.performance.memory;

				app.logger.snitch('memory', [{
					used: memory.usedJSHeapSize,
					alloc: memory.totalJSHeapSize
				}]);
				maxSamples--;

				if (maxSamples <= 0) {
					clearInterval(id);
				}
			}, TIMEOUT);
		}
	};


/***/ },

/***/ 354:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		var oldGlobalConfigs = app.sandbox.globalConfigs;

		app.sandbox.globalConfigs = function(property, defaultValue) {
			app.logger.snitch('warnings', 'js', [{
				msg: "TN.config is deprecated. Property '" + property + "' is used. Please pass properties with data-attributes instead."
			}]);
			return oldGlobalConfigs(property, defaultValue);
		};
	};


/***/ },

/***/ 355:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function getResources() {
		return window.performance.getEntries().map(function(entry) {
			return {
				type: entry.initiatorType,
				time: entry.duration,
				name: entry.name,
				host: window.location.protocol + '//' + window.location.hostname
			};
		});
	}

	module.exports = function(app) {
		var sizeTracker;
		var blob;
		var blobURL;
		var worker;

		if (!window.performance || !window.performance.getEntries) {
			return;
		}

		sizeTracker = __webpack_require__(356);
		blob = new Blob([sizeTracker], { type: 'text/javascript' });
		blobURL = window.URL.createObjectURL(blob);
		worker = new Worker(blobURL);

		worker.postMessage(getResources());

		worker.onmessage = function(event) {
			app.logger.snitch('resources', event.data);
		};
	};


/***/ },

/***/ 356:
/***/ function(module, exports) {

	module.exports = "'use strict';\n\nvar pipeSize = function(entry) {\n\treturn new Promise(function(resolve) {\n\t\tif (entry.name.indexOf(entry.host) === -1) {\n\t\t\tentry.size = 0;\n\t\t\tresolve(entry);\n\t\t\treturn;\n\t\t}\n\n\t\tfetch && fetch(entry.name, {credentials: 'same-origin'}).then(function(response) {\n\t\t\treturn response.blob();\n\t\t}).then(function(blob) {\n\t\t\tentry.size = blob.size;\n\t\t\tresolve(entry);\n\t\t}).catch(function() {\n\t\t\tentry.size = 0;\n\t\t\tresolve(entry);\n\t\t});\n\t});\n};\n\nonmessage = function(event) {\n\tPromise.all(event.data.map(pipeSize)).then(function(results) {\n\t\tpostMessage(results);\n\t});\n};\n"

/***/ },

/***/ 357:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var pageStylesService = __webpack_require__(358);

	module.exports = function(app) {
		var selectors = pageStylesService.getSelectors();
		var userRulesCache = {};

		var statistics = {
			totalCount: selectors.length,
			nodes: document.querySelectorAll('*').length,
			usedRules: []
		};

		selectors.forEach(function(selector) {
			if (userRulesCache[selector]) {
				return;
			}

			try {
				if (document.querySelector(selector)) {
					userRulesCache[selector] = true;
				}
			} catch (ex) {
				console.log('Not valid selector: %s', selector);
			}
		});

		statistics.usedRules = Object.keys(userRulesCache);
		statistics.used = statistics.usedRules.length;

		app.logger.snitch('css', statistics);
	};


/***/ },

/***/ 358:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		getSelectors: function() {
			var selectors = [];

			[].slice.call(document.styleSheets).forEach(function(styleSheet) {
				_getStylesheetRules(styleSheet).forEach(function(rule) {
					selectors = selectors.concat(_getRuleSelectors(rule));
				});
			});

			return selectors;
		},

		getClasses: function() {
			var classes = {};

			this.getSelectors().forEach(function(selector) {
				selector.split(' ').forEach(function(token) {
					var dotIndex = token.indexOf('.');
					if (dotIndex !== -1) {
						classes[token.slice(dotIndex + 1)] = true;
					}
				});
			});

			return classes;
		}
	};

	function _getStylesheetRules(styleSheet) {
		var rules = [];
		var index;
		var rule;

		if (!styleSheet.cssRules) {
			return rules;
		}

		for (index = 0; index < styleSheet.cssRules.length; index++) {
			rule = styleSheet.cssRules[index];

			rules = rules.concat(rule.cssRules ? [].slice.call(rule.cssRules) : rule);
		}

		return rules;
	}

	function _getRuleSelectors(cssRule) {
		var selectors = [];

		if (!cssRule.selectorText) {
			return selectors;
		}

		cssRule.selectorText.split(',').forEach(function(selector) {
			var pseudoSelectorIndex = selector.indexOf(':');

			if (pseudoSelectorIndex !== -1) {
				selector = selector.substring(0, pseudoSelectorIndex).replace(/\s*[>+~]\s*$/, '');
			}

			selectors.push(selector.trim());
		});

		return selectors;
	}


/***/ },

/***/ 359:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		var id;
		var entry;
		var INTERVAL = 500;

		if (!window.performance) {
			return;
		}

		id = setInterval(function() {
			if (document.readyState == 'complete') {
				entry = window.performance.timing;

				app.logger.snitch('timing', {
					doc: entry.responseEnd - entry.requestStart,
					dom: entry.domComplete - entry.domLoading,
					load: entry.loadEventEnd - entry.domLoading,
					aura: app.timestamp - entry.domContentLoadedEventEnd
				});

				clearInterval(id);
			}
		}, INTERVAL);
	};


/***/ },

/***/ 360:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var info = __webpack_require__(361);

	module.exports = function(app) {
		app.logger.snitch('tags', Object.keys(info).map(function(key) {
			return info[key];
		}));
	};


/***/ },

/***/ 361:
/***/ function(module, exports) {

	'use strict';

	module.exports = {user: "", email: "", branch: "technical/int/DK-13-blocks-prototyping"};

/***/ },

/***/ 362:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var blackList = __webpack_require__(363);

	module.exports = function(app) {
		function track(context) {
			var bl = [];
			var index;

			for (index = blackList.length - 1; index >= 0; index--) {
				if (app.core.dom.find(blackList[index], context).length) {
					app.logger.snitch('warnings', 'css', [{
						rule: blackList[index],
						comment: 'Black listed CSS rules'
					}]);

					bl.push(blackList[index]);
				}
			}

			if (bl.length) {
				console.groupCollapsed('%cTelenor SCSS refactoring notifications', 'color:#B19CD9; font-size:14px');

				bl.forEach(function(rule){
					console.log('%cDeprecated css rule: %s', 'color:#f79646', rule);
				});

				console.groupEnd();
			}
		}

		new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				var index;
				if (mutation.type === 'childList' && mutation.addedNodes.length) {
					for (index = mutation.addedNodes.length - 1; index >= 0; index--) {
						track(mutation.addedNodes[index]);
					}
				}
			});
		}).observe(document.querySelector('body'), {subtree: true, childList: true});

		track(document.querySelector('body'));
	};


/***/ },

/***/ 363:
/***/ function(module, exports) {

	'use strict';

	module.exports = [];

/***/ },

/***/ 364:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(app) {
		var sel = '[data-' + app.config.componentAttributes.name + ']';
		var attr = 'data-' + app.config.componentAttributes.name;

		app.logger.snitch('components', app.core.dom.find(sel).toArray().map(function(el) {
			return el.getAttribute(attr);
		}));
	};


/***/ },

/***/ 365:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var pageStylesService = __webpack_require__(358);

	module.exports = function(app) {
		var pageClassesCache = pageStylesService.getClasses();
		var blackListedClasses = {};

		function track(nodes) {
			[].slice.call(nodes).forEach(function(domNode) {
				if (!domNode || !domNode.classList) {
					return;
				}

				[].slice.call(domNode.classList).forEach(checkClassUsage);
			});
		}

		function checkClassUsage(className) {
			if (pageClassesCache[className] || blackListedClasses[className]) {
				return;
			}

			app.logger.snitch('warnings', 'js', [{
				rule: className,
				comment: 'Class is redundant or used only in JS'
			}]);

			console.log('%cClass is redundant or used only in JS: %s', 'color:#f79646', className);

			blackListedClasses[className] = true;
		}

		new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.type === 'childList' && mutation.addedNodes.length) {
					track(mutation.addedNodes);
				}
			});
		}).observe(document.querySelector('body'), { subtree: true, childList: true});

		track(document.querySelectorAll('*'));
	};


/***/ }

});