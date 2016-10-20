webpackJsonp([13],{

/***/ 436:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Element = __webpack_require__(336);

	var BaseFlowPresenter = module.exports = function(component) {
		this.component = component;
	};

	BaseFlowPresenter.prototype.unfold = function(nextState, withPayload) {
		var dfd;

		if (nextState.statik) {
			if (nextState.statikRemovable) {
				this._initPlaceholder(nextState, withPayload);
			}

			return;
		}

		dfd = this.component.$tools.q.defer();

		this._loadContent(nextState, withPayload)
			.then((function(data) {
				this.component.$tools.q.when(this._showInAWay(nextState.placeholder))
					.then(dfd.resolve.bind(dfd, data), dfd.reject.bind(dfd));
			}).bind(this), dfd.reject.bind(dfd));

		return dfd.promise();
	};

	BaseFlowPresenter.prototype.fold = function(thisState) {
		var dfd;

		if (thisState.statik && !thisState.statikRemovable) {
			return;
		}

		dfd = this.component.$tools.q.defer();

		this.component.$tools.q.when(this._hideInAWay(thisState.placeholder))
			.then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));

		return dfd.promise();
	};

	BaseFlowPresenter.prototype.find = function(selector) {
		return this.component.$el.find(selector);
	};

	BaseFlowPresenter.prototype._loadContent = function(forNextState, withPayload) {

		this._initPlaceholder(forNextState, withPayload);

		if (withPayload.html) {
			return this.component.html(withPayload.html, forNextState.placeholder);
		} else if(forNextState.placeholder instanceof Element) {
			return this.component.load(forNextState.componentContentURL, forNextState.placeholder, withPayload);
		}
		return this.component.load(forNextState.componentContentURL, '#' + forNextState.placeholder.prop('id'), withPayload);
	};

	BaseFlowPresenter.prototype._initPlaceholder = function(forNextState, withPayload) {
		if (forNextState.placeholder) {
			return;
		}
		if (withPayload.selector) {
			forNextState.placeholder = withPayload.selector;
		} else {
			forNextState.placeholder = this._placeholder();
		}
	};

	BaseFlowPresenter.prototype._showInAWay = function() {
	};

	BaseFlowPresenter.prototype._hideInAWay = function() {
	};

	BaseFlowPresenter.prototype._placeholder = function() {
		var id = Number(new Date());
		var html = '<div id="' + id + '" class="js-hidden" />';

		this.component.$el.append(html);

		return this.component.$el.find('#' + id);
	};


/***/ },

/***/ 437:
/***/ function(module, exports) {

	'use strict';

	var FlowController = module.exports = function(presenter, states, $events, extra) {
		this.presenter = presenter;
		this.states = states;
		this.data = {};
		this.stack = [];
		this.currentState = void 0;
		this.extra = extra || {
			foldPrev: false
		};
		this.$events = $events;
	};

	FlowController.prototype.startWith = function(stateByName) {
		Object.keys(this.states).forEach(function(key) {
			this.states[key].name = key;
		}.bind(this));

		this.activateStep(stateByName);
		return this._unfold(this.states[stateByName]);
	};

	FlowController.prototype.merge = function(source) {
		this.data = app.core.helper.extend(this.data, source);
	};

	FlowController.prototype.next = function(withStateData, andOptionalDfd) {
		var nextState;
		var nextStatePayload;
		var dfd = this.presenter.component.$tools.q.defer();

		this.merge(withStateData || {});

		if (this.extra.foldPrev) {
			this._fold(this.currentState);
		}

		this.presenter.component.$tools.q.when(this.currentState.infer(this.data))
			.then(function(nextStateInfo) {
				nextStatePayload = nextStateInfo.payload;
				nextState = this.states[nextStateInfo.next];

				if (nextStateInfo.next !== 'finish') {
					this.activateStep(nextStateInfo.next);
					this.presenter.component.$tools.q.when(this._unfold(nextState, nextStatePayload))
						.then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
				} else {
					if (typeof this.presenter.component.finish === 'function') {
						this.presenter.component.$tools.q.when(this.presenter.component.finish(this.data))
							.then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
					} else {
						dfd.resolve();
					}
				}

				if (andOptionalDfd) {
					dfd.then(andOptionalDfd.resolve.bind(andOptionalDfd), andOptionalDfd.reject.bind(andOptionalDfd));
				}
			}.bind(this));

		return dfd.promise();
	};

	FlowController.prototype.prev = function() {
		var prevState = this.stack.pop();
		var nextState = this.stack[this.stack.length - 1];

		this.currentState = nextState;

		return this.presenter.component.$tools.q.when(this._fold(prevState))
			.then(this.activateStep.bind(this, nextState.name));
	};

	FlowController.prototype.getActiveStepIndex = function() {
		return this.states[this.currentState] ? this.states[this.currentState].index : 0;
	};

	FlowController.prototype.activateStep = function(stepName) {
		if (!this.$events) {
			return;
		}

		this.$events.trigger('activateStep', this.states[stepName].index);
	};

	FlowController.prototype.reset = function(toState, withStateData) {
		var state;
		var index;

		toState = typeof toState === 'string' ? this.states[toState] : toState;

		this.merge(withStateData || {});

		for (index = this.stack.slice().length - 1; index >= 0; index--) {
			state = this.stack[index];

			if (state.name !== toState.name) {
				this.prev();
			} else {
				this._unfold(toState);
				break;
			}
		}
	};

	FlowController.prototype.updateState = function(nextState) {
		this.currentState = nextState;

		this.stack.push(nextState);

		return this._activate(this.presenter.component.$components[nextState.name]);
	};

	FlowController.prototype._unfold = function(nextState, withPayload) {
		return this.presenter.component.$tools.q.when(this.presenter.unfold(nextState, withPayload))
			.then(this.updateState.bind(this, nextState, withPayload));
	};

	FlowController.prototype._fold = function(thisState) {
		var component = this.presenter.component.$components[thisState.name];

		if (component) {
			component.$events.trigger('deactivate', this.data);
		}

		return this.presenter.component.$tools.q.when(this.presenter.fold(thisState, this.currentState))
			.then(function() {
				if (thisState.statik && !thisState.statikRemovable) {
					return;
				}

				if (component) {
					component.$el.remove();
				}

				delete this.presenter.component.$components[thisState.name];
			}.bind(this));
	};

	FlowController.prototype._activate = function(component) {
		var dfd = this.presenter.component.$tools.q.defer();

		if (!component) {
			return;
		}
		component.flow = this;
		component.$events.trigger('activate', this.data);
		dfd.resolve();

		return dfd.promise();
	};

	FlowController.prototype._resetAsync = function(toState, dfd) {
		var state;

		toState = typeof toState === 'string' ? this.states[toState] : toState;
		state = this.stack[this.stack.length - 1];

		if (state.name === toState.name) {
			dfd.resolve();

			return;
		}

		this.prev()
			.then(this._resetAsync.bind(this, toState, dfd));
	};

	FlowController.prototype.resetAsync = function(toState, withStateData) {
		var dfd = this.presenter.component.$tools.q.defer();

		this.merge(withStateData || {});

		this._resetAsync(toState, dfd);

		return dfd.promise();
	};


/***/ },

/***/ 438:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var BaseFlowPresenter = __webpack_require__(436);

	var SheetFlowPresenter = module.exports = function() {
		BaseFlowPresenter.apply(this, Array.prototype.slice.call(arguments));
	};

	SheetFlowPresenter.prototype = new BaseFlowPresenter();
	SheetFlowPresenter.prototype.constructor = SheetFlowPresenter;

	SheetFlowPresenter.prototype._showInAWay = function(placeholder) {
		var dfd = this.component.$tools.q.defer();
		placeholder.show();
		placeholder.slideDown(function() {
			dfd.resolve();
			scrollTo(placeholder);
		});

		return dfd.promise();
	};

	SheetFlowPresenter.prototype._hideInAWay = function(placeholder) {
		var dfd = this.component.$tools.q.defer();

		if (placeholder) {
			placeholder.slideUp(function() {
				placeholder.hide();
				dfd.resolve();
			});
		} else {
			dfd.resolve();
		}


		return dfd.promise();
	};

	function scrollTo(placeholder) {
		var prevTop = -100;
		var scrollTop = ++document.body.scrollTop;
		var interval;
		var top;
		var delta;
		var FRAME_PER_SECOND = 30;
		var TIMEOUT = 16;


		if (document.body.scrollTop !== scrollTop) {
			placeholder[0].scrollIntoView();
			return;
		}

		top = placeholder.offset().top;
		delta = (top - window.document.body.scrollTop) / FRAME_PER_SECOND;

		interval = setInterval(function() {
			window.document.body.scrollTop += delta;

			if (prevTop === window.document.body.scrollTop || Math.abs(window.document.body.scrollTop - top) < delta) {
				window.document.body.scrollTop = top + 1;
				clearInterval(interval);
			}

			prevTop = window.document.body.scrollTop;
		}, TIMEOUT);
	}


/***/ },

/***/ 439:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var BaseFlowPresenter = __webpack_require__(436);

	var StackedFlowPresenter = module.exports = function() {
		BaseFlowPresenter.apply(this, Array.prototype.slice.call(arguments));
	};

	StackedFlowPresenter.prototype = new BaseFlowPresenter();
	StackedFlowPresenter.prototype.constructor = StackedFlowPresenter;

	StackedFlowPresenter.prototype.unfold = function(nextState) {
		if (nextState.statik) {
			this.component.$el.find('> *').hide();
			this.component.$components[nextState.name].show();
			this.component.$components[nextState.name].$el.show();
		}

		return BaseFlowPresenter.prototype.unfold.apply(this, Array.prototype.slice.call(arguments));
	};

	StackedFlowPresenter.prototype._showInAWay = function(placeholder) {
		this.component.$el.find('> *').hide();
		placeholder.show();
	};

	StackedFlowPresenter.prototype._hideInAWay = function(placeholder) {
		placeholder.hide();
	};


/***/ },

/***/ 440:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var scrollTo = __webpack_require__(441);
	var BaseFlowPresenter = __webpack_require__(436);

	var WizardFlowPresenter = module.exports = function() {
		BaseFlowPresenter.apply(this, Array.prototype.slice.call(arguments));
	};

	WizardFlowPresenter.prototype = new BaseFlowPresenter();
	WizardFlowPresenter.prototype.constructor = WizardFlowPresenter;

	WizardFlowPresenter.prototype.fold = function(current, old) {
		var dfd = this.component.$tools.q.defer();
		BaseFlowPresenter.prototype.fold.apply(this, arguments)
			.then(function() {
				this._showInAWay(old.placeholder ? old.placeholder : this.component.$components[old.name].$el)
					.then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			}.bind(this));

		return dfd.promise();
	};

	WizardFlowPresenter.prototype._showInAWay = function(placeholder) {
		var SCROLL_TO = 200;
		var TIMEOUT_RESOLVE = 200;
		var MARGIN_TOP = 150;

		var dfd = this.component.$tools.q.defer();

		this._hideStep();

		this._showComponent(placeholder);

		scrollTo(this.component.$el.position().top - MARGIN_TOP, SCROLL_TO);

		setTimeout(dfd.resolve.bind(dfd), TIMEOUT_RESOLVE);

		return dfd.promise();
	};

	WizardFlowPresenter.prototype._showComponent = function(placeholder) {
		placeholder.show();
	};

	WizardFlowPresenter.prototype._hideStep = function() {
		this.component.$el.find('> *').hide();
	};

	WizardFlowPresenter.prototype._hideInAWay = function() {
		var SCROLL_TO = 200;
		var TIMEOUT_RESOLVE = 200;
		var MARGIN_TOP = 150;
		var dfd = this.component.$tools.q.defer();

		scrollTo(this.component.$el.position().top - MARGIN_TOP, SCROLL_TO);

		setTimeout(dfd.resolve.bind(dfd), TIMEOUT_RESOLVE);

		return dfd.promise();
	};


/***/ },

/***/ 441:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*!
	 * jQuery.scrollTo
	 * Copyright (c) 2007-2015 Ariel Flesler - aflesler<a>gmail<d>com | http://flesler.blogspot.com
	 * Licensed under MIT
	 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
	 * @projectDescription Lightweight, cross-browser and highly customizable animated scrolling with jQuery
	 * @author Ariel Flesler
	 * @version 2.1.2
	 */
	;(function(factory) {
		'use strict';
		if (true) {
			// AMD
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (typeof module !== 'undefined' && module.exports) {
			// CommonJS
			module.exports = factory(require('jquery'));
		} else {
			// Global
			factory(jQuery);
		}
	})(function($) {
		'use strict';

		var $scrollTo = $.scrollTo = function(target, duration, settings) {
			return $(window).scrollTo(target, duration, settings);
		};

		$scrollTo.defaults = {
			axis:'xy',
			duration: 0,
			limit:true
		};

		function isWin(elem) {
			return !elem.nodeName ||
				$.inArray(elem.nodeName.toLowerCase(), ['iframe','#document','html','body']) !== -1;
		}		

		$.fn.scrollTo = function(target, duration, settings) {
			if (typeof duration === 'object') {
				settings = duration;
				duration = 0;
			}
			if (typeof settings === 'function') {
				settings = { onAfter:settings };
			}
			if (target === 'max') {
				target = 9e9;
			}

			settings = $.extend({}, $scrollTo.defaults, settings);
			// Speed is still recognized for backwards compatibility
			duration = duration || settings.duration;
			// Make sure the settings are given right
			var queue = settings.queue && settings.axis.length > 1;
			if (queue) {
				// Let's keep the overall duration
				duration /= 2;
			}
			settings.offset = both(settings.offset);
			settings.over = both(settings.over);

			return this.each(function() {
				// Null target yields nothing, just like jQuery does
				if (target === null) return;

				var win = isWin(this),
					elem = win ? this.contentWindow || window : this,
					$elem = $(elem),
					targ = target, 
					attr = {},
					toff;

				switch (typeof targ) {
					// A number will pass the regex
					case 'number':
					case 'string':
						if (/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)) {
							targ = both(targ);
							// We are done
							break;
						}
						// Relative/Absolute selector
						targ = win ? $(targ) : $(targ, elem);
						/* falls through */
					case 'object':
						if (targ.length === 0) return;
						// DOMElement / jQuery
						if (targ.is || targ.style) {
							// Get the real position of the target
							toff = (targ = $(targ)).offset();
						}
				}

				var offset = $.isFunction(settings.offset) && settings.offset(elem, targ) || settings.offset;

				$.each(settings.axis.split(''), function(i, axis) {
					var Pos	= axis === 'x' ? 'Left' : 'Top',
						pos = Pos.toLowerCase(),
						key = 'scroll' + Pos,
						prev = $elem[key](),
						max = $scrollTo.max(elem, axis);

					if (toff) {// jQuery / DOMElement
						attr[key] = toff[pos] + (win ? 0 : prev - $elem.offset()[pos]);

						// If it's a dom element, reduce the margin
						if (settings.margin) {
							attr[key] -= parseInt(targ.css('margin'+Pos), 10) || 0;
							attr[key] -= parseInt(targ.css('border'+Pos+'Width'), 10) || 0;
						}

						attr[key] += offset[pos] || 0;

						if (settings.over[pos]) {
							// Scroll to a fraction of its width/height
							attr[key] += targ[axis === 'x'?'width':'height']() * settings.over[pos];
						}
					} else {
						var val = targ[pos];
						// Handle percentage values
						attr[key] = val.slice && val.slice(-1) === '%' ?
							parseFloat(val) / 100 * max
							: val;
					}

					// Number or 'number'
					if (settings.limit && /^\d+$/.test(attr[key])) {
						// Check the limits
						attr[key] = attr[key] <= 0 ? 0 : Math.min(attr[key], max);
					}

					// Don't waste time animating, if there's no need.
					if (!i && settings.axis.length > 1) {
						if (prev === attr[key]) {
							// No animation needed
							attr = {};
						} else if (queue) {
							// Intermediate animation
							animate(settings.onAfterFirst);
							// Don't animate this axis again in the next iteration.
							attr = {};
						}
					}
				});

				animate(settings.onAfter);

				function animate(callback) {
					var opts = $.extend({}, settings, {
						// The queue setting conflicts with animate()
						// Force it to always be true
						queue: true,
						duration: duration,
						complete: callback && function() {
							callback.call(elem, targ, settings);
						}
					});
					$elem.animate(attr, opts);
				}
			});
		};

		// Max scrolling position, works on quirks mode
		// It only fails (not too badly) on IE, quirks mode.
		$scrollTo.max = function(elem, axis) {
			var Dim = axis === 'x' ? 'Width' : 'Height',
				scroll = 'scroll'+Dim;

			if (!isWin(elem))
				return elem[scroll] - $(elem)[Dim.toLowerCase()]();

			var size = 'client' + Dim,
				doc = elem.ownerDocument || elem.document,
				html = doc.documentElement,
				body = doc.body;

			return Math.max(html[scroll], body[scroll]) - Math.min(html[size], body[size]);
		};

		function both(val) {
			return $.isFunction(val) || $.isPlainObject(val) ? val : { top:val, left:val };
		}

		// Add special hooks so that window scroll properties can be animated
		$.Tween.propHooks.scrollLeft = 
		$.Tween.propHooks.scrollTop = {
			get: function(t) {
				return $(t.elem)[t.prop]();
			},
			set: function(t) {
				var curr = this.get(t);
				// If interrupt is true and user scrolled, stop animating
				if (t.options.interrupt && t._last && t._last !== curr) {
					return $(t.elem).stop();
				}
				var next = Math.round(t.now);
				// Don't waste CPU
				// Browsers don't render floating point scroll
				if (curr !== next) {
					$(t.elem)[t.prop](next);
					t._last = this.get(t);
				}
			}
		};

		// AMD requirement
		return $scrollTo;
	});


/***/ },

/***/ 442:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports.FlowController = __webpack_require__(437);

	module.exports.SheetFlowPresenter = __webpack_require__(438);
	module.exports.WizardFlowPresenter = __webpack_require__(440);
	module.exports.StackedFlowPresenter = __webpack_require__(439);


/***/ },

/***/ 772:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(773);


/***/ },

/***/ 773:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./helpers/checkbox-group/index.js": 774,
		"./helpers/select-on-focus/index.js": 775,
		"./helpers/show-element/index.js": 776,
		"./inventory/initial-stock-counting/index.js": 777,
		"./sim-card/change/customers/index.js": 778,
		"./sim-card/change/index.js": 779,
		"./sim-card/change/search/index.js": 780,
		"./sim-card/change/sim/barcode/index.js": 781,
		"./sim-card/change/sim/index.js": 783,
		"./transfers/recall-order/index.js": 784,
		"./transfers/recall-order/order-item/index.js": 785
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 773;


/***/ },

/***/ 774:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Checkbox group toggler
	desc: >
		Controls a group of checkboxes with group toggle checkbox. Group toggle checkbox
		must be data-element="groupToggle", other toggles should be
		data-element="checkboxToggle"

	type: controller
	*/
	module.exports = {
		events: {
			'click groupToggle': '_onGroupToggle',
			'click checkboxToggle': '_onCheckboxToggle'
		},

		initialize: function() {
			this._onCheckboxToggle();
		},

		_onGroupToggle: function(ev) {
			var targetState = ev.$el[0].checked;

			this.$elements.checkboxToggle.forEach(function(checkbox) {
				checkbox.checked = targetState;
			});
		},

		_onCheckboxToggle: function() {
			var hasUnchecked = this.$elements.checkboxToggle.some(function(checkbox) {
				return checkbox.checked === false;
			});

			// set correct state to group toggle depending on child toggles
			this.$elements.groupToggle.prop('checked', !hasUnchecked);
		}
	};


/***/ },

/***/ 775:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.el = this.$el[0];
			// select input contents on initialization if field has autofocus attribute
			if (this.el.autofocus) {
				this._select();
			}
		},

		events: {
			'focus': '_onFocus',
			'mouseup': '_unselectWorkaround'
		},

		_select: function() {
			var MAX_LENGTH = 9999;
			this.el.setSelectionRange(0, this.el.value.length || MAX_LENGTH);
		},

		_onFocus: function() {
			this._select();
		},

		_unselectWorkaround: function(event) {
			// as suggested http://stackoverflow.com/a/6813211/1075459
			// need to check if it's required.
			event.preventDefault();
		}
	};


/***/ },

/***/ 776:
/***/ function(module, exports) {

	'use strict';

	/**
	name: show-element
	type: ui
	desc: Show element when POS is connected.
	*/

	module.exports = {
		events: {
			'posConnected $this': '_onShow'
		},
		_onShow: function(event, data) {
			if (!data.isConnected) {
				this.show();
			}
		}
	};


/***/ },

/***/ 777:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'scan $materialId': '_onMaterialIdScan',
			'scan $serialNumber': '_onSerialNumberScan'
		},

		_onMaterialIdScan: function() {
			this._submitBarcodeForm();
		},

		_onSerialNumberScan: function() {
			this._submitBarcodeForm();
		},

		_submitBarcodeForm: function() {
			this.$elements.barcodeForm[0].submit();
		}
	};


/***/ },

/***/ 778:
/***/ function(module, exports) {

	'use strict';

	/**
	 * This component is used for customer validation in change sim card flow.
	 */
	module.exports = {
		events: {
			'submit $this': 'nextStep',
			'activate $this': '_activate',
			'change $documentType': '_documentTypeChanged'
		},

		ready: function() {
			this._updateNumberInput();
		},

		/**
		 desc: Reset component's state to initial.
		 */
		reset: function() {
			this.$components.documentType.enable();
			this.$components.autoFocusInput.$el.prop('disabled', false);
			this.$components.autoFocusInput.$el[0].value = '';
			this.$components.next.enable();
		},

		_lock: function() {
			this.$components.documentType.disable();
			this.$components.autoFocusInput.$el.prop('disabled', true);
			this.$components.next.disable();
		},

		_showError: function() {
			this.$components.errorMessage.open();
		},

		_hideError: function() {
			this.$components.errorMessage.close();
		},

		_activate: function() {
			this.$components.autoFocusInput.$el.focus();
		},

		nextStep: function() {
			var formComponent = this.$extensions.form;

			if (!formComponent.valid()) {
				return;
			}

			this._hideError();

			this.$components.next.activityIndicator();

			return this.flow.resetAsync('customer')
				.then(function() {
					this._next();
					this._lock();
				}.bind(this));
		},

		isDataPresent: function() {
			return !!this.$components.autoFocusInput.$el[0].value;
		},

		_getData: function() {
			return this.$extensions.form.serialize();
		},

		_next: function() {
			this.flow.next(this._getData())
				.finally(this.$components.next.resetLoading.bind(this.$components.next))
				.catch(this._showError.bind(this));
		},

		_updateNumberInput: function() {
			var data = this.$components.documentType.getCurrentOption().data();
			var $input = this.$components.autoFocusInput.$el;
			var validator = this.$el.data('validator');
			var inputName = $input.prop('name');

			$input.prop('placeholder', data.placeholder);

			if (data.rgx) {
				validator.settings.rules[inputName].regex = data.rgx;
				validator.settings.messages[inputName].regex = data.errmsg;
			} else {
				delete validator.settings.rules[inputName].regex;
				delete validator.settings.messages[inputName].regex;
			}
		},

		_documentTypeChanged: function() {
			this._updateNumberInput();

			if (this.$components.autoFocusInput.$el.val()) {
				this.$extensions.form.valid();
			}
		}
	};


/***/ },

/***/ 779:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Flow = __webpack_require__(442);

	module.exports = {
		events: {
			'click $$clear': '_clear',
			'click $cancel': '_cancel',
			'submit $search': '_startSearch',
			'click $confirmationSubmit': '_submitConfirmation',
			'deactivate $sim': '_hideSubmits',
			'submit $sim': '_submit',
			'click $submit': '_submit',
			'click $printContracts': '_getTerms',
			'close $successMessage': '_hideSuccess'
		},
		ready: function() {
			var searchComponent = this.$components.search;
			var customerComponent = this.$components.customer;

			this._setFlow()
				.then(function() {
					if (searchComponent.isDataPresent()) {
						searchComponent.nextStep()
							.then(function() {
								this.flow.states.customer.statik = false;
								this.flow.states.customer.statikRemovable = false;
								if (customerComponent.isDataPresent()) {
									customerComponent.nextStep().then(function() {
										this.flow.states.sim.statik = false;
										this.flow.states.sim.statikRemovable = false;
										if (this.$options.showConfirmation) {
											this._showConfirmationState();
											this.$components.sim.lock();
										}
										this._showSubmitBlock();
									}.bind(this));
								}
							}.bind(this));
					}
				}.bind(this));
		},

		_setFlow: function() {
			this.flow = new Flow.FlowController(new Flow.SheetFlowPresenter(this), {
				search: {
					statik: true,
					index: 0,
					infer: function(data) {
						data.selector = this.$elements.customerBlock;

						this._hideSuccess();

						return {
							next: 'customer',
							payload: data
						};
					}.bind(this)
				},
				customer: {
					index: 1,
					componentContentURL: this.$options.customerUrl,
					statik: !!this.$components.customer,
					statikRemovable: true,
					infer: function(data) {
						data.selector = this.$elements.simBlock;
						this._showSubmitBlock();
						return {
							next: 'sim',
							payload: data
						};
					}.bind(this)
				},
				sim: {
					index: 2,
					componentContentURL: this.$options.simUrl,
					statik: !!this.$components.sim,
					statikRemovable: true,
					infer: function(data) {
						return {
							next: 'finish',
							payload: data
						};
					}
				}
			}, this.$events);

			return this.flow.startWith('search');
		},

		_startSearch: function() {
			this.$components.search.nextStep();
		},

		_hideError: function() {
			this.$components.errorMessage.close();
		},

		_showError: function() {
			this.$components.errorMessage.open();
		},

		_clear: function(event) {
			var btnComponent = event.data.component;
			btnComponent.activityIndicator();

			if (this.$components.confirmationSubmit) {
				this._hideConfirmationState();
			}

			this.$tools.data.post(btnComponent.$options.action)
				.then(
					function() {
						this._hideError();
						this.flow.reset('search');
						this.$components.search.reset();
						this._hideSuccess();
					}.bind(this)
				)
				.catch(this._showError.bind(this))
				.finally(btnComponent.resetLoading.bind(btnComponent));
		},

		_cancel: function(event) {
			var btnComponent = event.data.component;
			var data = {
				goToPrevStep: btnComponent.$options.goToPrevStep || false
			};
			btnComponent.activityIndicator();

			this.$tools.data.post(btnComponent.$options.action, data)
				.then(
					function() {
						this._hideError();
						this.$components.customer.reset();
						this.flow.prev();
					}.bind(this)
				)
				.catch(this._showError.bind(this))
				.finally(btnComponent.resetLoading.bind(btnComponent));
		},

		_showSubmitBlock: function() {
			this.$elements.submitBlock.show();
		},

		_hideSubmits: function() {
			this.$elements.submitBlock.hide();
		},

		_showConfirmationState: function() {
			this.$components.submit.hide();
			this.$components.confirmationSubmit.show();
			if (this.$options.showPrintButton) {
				this.$components.printContracts.show();
			}
			this.$components.cancel.disable();
		},

		_hideConfirmationState: function() {
			this.$components.submit.show();
			this.$components.confirmationSubmit.hide();
			this.$components.printContracts.hide();
			this.$components.cancel.enable();
		},

		_submit: function() {
			var simCardData;

			if (!this.$components.sim.valid()) {
				return;
			}

			this._hideError();

			simCardData = this.$components.sim.serialize();

			this.$components.submit.activityIndicator();

			this.$components.sim.validateSimType()
				.then(function() {
					this.$components.sim.lock();
					this.$tools.data.post(this.$options.activateUrl, simCardData)
						.then(function(res) {
							if (!res.success) {
								this.$components.sim.unlock();
								this._showError();
								return;
							}
							if (this.$options.needsConfirmation) {
								this._getTerms(res.data)
									.then(function() {
										this._showConfirmationState();
									}.bind(this));
							} else {
								this._hideSubmits();
								this._submitted(res);
							}
						}.bind(this))
						.catch(function() {
							this.$components.sim.unlock();
							this._showError();
						}.bind(this))
						.finally(this.$components.submit.resetLoading.bind(this.$components.submit));
				}.bind(this))
				.catch(this.$components.submit.resetLoading.bind(this.$components.submit));

		},
		_submitConfirmation: function() {
			this.$components.confirmationSubmit.activityIndicator();

			this.$tools.data.post(this.$options.confirmUrl, this._getConfirmationData())
				.then(function(res) {
					this._hideSubmits();
					this._submitted(res);
				}.bind(this))
				.finally(this.$components.confirmationSubmit.resetLoading.bind(this.$components.confirmationSubmit));
		},
		_openTerms: function(terms) {
			terms.forEach(function(term) {
				this._printDocument(term.TermsData);
			}.bind(this));
		},
		_printDocument: function(data) {
			window.open('data:application/pdf;base64,' + data, '_blank');
		},
		_getTerms: function(data) {
			var dfd = this.$tools.q.defer();

			this._ping(this._getConfirmationData(data))
				.then(function(res) {
					if (res.data.terms && res.data.terms.length) {
						this._openTerms(res.data.terms);
						dfd.resolve();
					}
				}.bind(this));

			return dfd.promise();
		},
		_getConfirmationData: function(data) {
			if (!data) {
				return this.confirmationData || {};
			}
			return this.confirmationData = {
				custId: data.custId,
				oseOrderId: data.oseOrderId,
				verisOrderId: data.verisOrderId
			};
		},

		_ping: function(data) {
			var dfd = this.$tools.q.defer();

			this._pingConfirmation(data, dfd);
			return dfd.promise();
		},

		_pingConfirmation: function(data, dfd) {
			this.$tools.data.get(this.$options.contractsUrl, data)
				.then(
					function(res) {
						var TIMEOUT_PING = 1000;
						if (res.success) {
							dfd.resolve(res);
						} else {
							setTimeout(function() {
								this._pingConfirmation(data, dfd);
							}.bind(this), TIMEOUT_PING);
						}
					}.bind(this)
				);
		},

		_submitted: function(response) {
			if (!response.success) {
				this._showError();

				return;
			}

			this.html(response.data.html, this.$elements.successBlock)
				.then(this._showSuccess.bind(this));
		},

		_hideSuccess: function() {
			this.$elements.successBlock.hide();
		},

		_showSuccess: function() {
			this.$components.sim.$events.trigger('hideMessage');
			this.$elements.successBlock.show();
			this.$components.successMessage.open();
		}
	};


/***/ },

/***/ 780:
/***/ function(module, exports) {

	'use strict';

	/**
	 * This component is used for search step in change sim card flow.
	 */
	module.exports = {
		events: {},

		/**
		 desc: Detects is element is filled with data.
		 @return boolean
		 */
		isDataPresent: function() {
			return !!this.$elements.searchInput.val();
		},

		/**
		 desc: validates component data.
		 @return boolean
		 */
		isDataValid: function() {
			return this.$extensions.form.valid();
		},

		/**
		 desc: Reset component's state to initial.
		 */
		reset: function() {
			this.$elements.searchInput.val('').focus();
			this._hideError();
		},

		_hideError: function() {
			this.$components.errorMessage.close();
		},

		_showError: function() {
			this.$components.errorMessage.open();
		},

		/**
		 * desc: Activates next step via flow controller.
		 * @returns Promise
	     */
		nextStep: function() {
			if (!this.isDataValid()) {
				return;
			}

			this._hideError();

			this.$components.next.activityIndicator();

			return this.flow.resetAsync('search')
				.then(this._next.bind(this));
		},

		_next: function() {
			return this.flow.next(this.$extensions.form.serialize())
				.finally(this.$components.next.resetLoading.bind(this.$components.next))
				.catch(this._showError.bind(this));
		}
	};


/***/ },

/***/ 781:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var barcode = __webpack_require__(782);

	module.exports = app.core.util.extend({}, barcode, {
		initialize: function() {
			this.$options.prefix = this.$options.prefix.toString();
		},

		_checkValue: function() {
			var value = this.$el.val();

			if (value.length <= this.$options.minLength || value.indexOf(this.$options.prefix) !== 0) {
				this._triggerChecked();

				return;
			}

			this.$el.val(value.substr(this.$options.prefix.length));

			this._triggerChecked();
		}
	});


/***/ },

/***/ 782:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'scan $this': '_checkValue',
			'change': '_triggerChange'
		},

		_triggerChange: function() {
			this.$events.trigger('onChange');
		},

		_triggerChecked: function() {
			this.$events.trigger('scanSuccess');
		}
	};


/***/ },

/***/ 783:
/***/ function(module, exports) {

	'use strict';

	/**
	 * This component is used for sim card change initiation in change sim card flow.
	 */
	module.exports = {
		events: {
			'scanSuccess $barcode': '_scan',
			'onChange $barcode': '_simTypeChanged',
			'hideMessage $this': '_hideMessage',
			'activate $this': '_activate',
			'change $reasonCode': '_reasonChanged'
		},

		ready: function() {
			this._reasonChanged();
		},

		/**
		 * desc: Disable component's input and controls.
		 */
		lock: function() {
			this.$components.barcode.$el.prop('disabled', true);
		},

		/**
		 * desc: Enable component's input and controls.
		 */
		unlock: function() {
			this.$components.barcode.$el.prop('disabled', false);
		},

		/**
		 * desc: Validate component's data.
		 * @return boolean
		 */
		valid: function() {
			return this.$extensions.form.valid();
		},

		/**
		 * desc: Validate sim number type.
		 */
		validateSimType: function() {
			var data = this.$extensions.form.serialize();
			var dfd = this.$tools.q.defer();

			if (this.$options.isSimValid) {
				dfd.resolve();
			} else {
				if (!this.$extensions.form.valid()) {
					return;
				}
				this.$components.simLoading.show();
				this.$tools.data.post(this.$options.validationUrl, data)
					.then(function(response) {
						if (!response.success) {
							this._showSimError();
							dfd.reject();
							return;
						}
						if (response.data && response.data.cardType) {
							this.$elements.cardType.val(response.data.cardType);
						}
						this._hideSimError();
						dfd.resolve();
						this.$options.isSimValid = true;
					}.bind(this))
					.catch(function() {
						dfd.reject();
						this._showSimError();
					})
					.finally(function() {
						this.$components.simLoading.hide();
					}.bind(this));
			}

			return dfd.promise();
		},

		serialize: function() {
			var data = this.$extensions.form.serialize();
			data.fee = this._fee;

			data[this.$elements.prefix.prop('name')] = this.$elements.prefix.val();

			return data;
		},

		_activate: function() {
			this.$components.barcode.$el.focus();
		},

		_scan: function() {
			this.validateSimType();
			this.$elements.prefix.prop('disabled', true);
		},

		_hideMessage: function() {
			this.$components.informMessage.close();
		},

		_showSimError: function() {
			this.$options.isSimValid = false;
			this.$components.simErrorMessage.open();
		},

		_hideSimError: function() {
			this.$components.simErrorMessage.close();
		},

		_simTypeChanged: function() {
			this.$options.isSimValid = false;
			this.validateSimType();
		},

		_reasonChanged: function() {
			var data = this.$extensions.form.serialize();

			this._hideFeeError();
			this._showFeeLoading();

			this.$tools.data.post(this.$options.feeUrl, data)
				.then(this._feeSuccess.bind(this))
				.catch(this._showFeeError.bind(this))
				.finally(this._hideFeeLoading.bind(this));
		},

		_showFeeLoading: function() {
			this.$components.fee.hide();
			this.$components.loading.show();
		},

		_hideFeeLoading: function() {
			this.$components.fee.show();
			this.$components.loading.hide();
		},

		_showFeeError: function() {
			this.$components.feeErrorMessage.open();
		},

		_hideFeeError: function() {
			this.$components.feeErrorMessage.close();
		},

		_feeSuccess: function(response) {
			if (!response.success) {
				this._showFeeError();

				return;
			}

			this._fee = response.data.feeValue;

			this.$components.fee.$el.text(response.data.feeValue ?
				response.data.feeDisplayValue :
				this.$components.fee.$options.freeText);
		}
	};


/***/ },

/***/ 784:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Recall order page controller
	type: controller
	desc: Page controller for recall order.
	*/
	module.exports = {
		events: {
			'submit $scanForm': '_submit',
			'submit $finishForm': '_submit',
			'deleteSerial $$orderItem': '_onUpdate',
			'updateQuantity $$orderItem': '_onUpdate'
		},

		_submit: function(ev) {
			var form = ev.data.component;
			var formData = form.serialize();
			form.$components.submitButton.activityIndicator();
			this.load(form.getUrl(), null, formData);
		},

		_onUpdate: function(ev, data) {
			this.load(data.url, null, data.data);
		}

	};


/***/ },

/***/ 785:
/***/ function(module, exports) {

	'use strict';

	/**
	name: order-item controller
	desc: >
		Controller for single material id item which have deleteable serials.
		Expects to have components with data-group="deleteSerial"

	type: controller
	*/
	module.exports = {
		events: {
			'submit $$deleteSerial': '_onDeleteSerial',
			'click $editQuantity': '_onEditQuantityClick',
			'click $viewMode': '_onViewMode',
			'submit $quantityForm': '_onQuantitySubmit'
		},

		_onDeleteSerial: function(ev) {
			var component = ev.data.component;
			this.$events.trigger('deleteSerial', {url: component.$options.deleteUrl, data: {}});
		},

		_onEditQuantityClick: function() {
			this.$elements.viewMode.hide();
			this.$elements.editMode.show();
			requestAnimationFrame(function() {
				this.$elements.quantityInput.focus();
			}.bind(this));
		},

		_onViewMode: function() {
			this.$elements.viewMode.show();
			this.$elements.editMode.hide();
		},

		_onQuantitySubmit: function(ev) {
			var component = ev.data.component;
			var data = component.serialize();
			var updateUrl = component.$options.updateUrl;
			this.$events.trigger('updateQuantity', {url: updateUrl, data: data});
		}
	};


/***/ }

});