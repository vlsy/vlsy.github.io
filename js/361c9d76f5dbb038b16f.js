webpackJsonp([10],{

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

/***/ 468:
/***/ function(module, exports) {

	'use strict';

	module.exports = function(markup) {
		// Support: IE 11
		// A textarea's placeholder text becomes it's actual value when using innerText, innerHTML or outerHTML
		// https://connect.microsoft.com/IE/feedback/details/811408

		var isIE = !(window.ActiveXObject) && 'ActiveXObject' in window;

		return !(isIE) ? markup
			: markup.replace(/(<\s*textarea[^>]+?)(placeholder\s*=\s*".+?")/mg, '$1');
	};


/***/ },

/***/ 555:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var	pubsub = __webpack_require__(330);
	var jqScrollTo = __webpack_require__(441);

	module.exports = {
		events: {
			'click': '_scrollTo'
		},

		_scrollTo: function(event){

			var isMobile = this.$tools.browser.isMobile;
			var only = this.$options.only;
			var shouldScroll = !only || (isMobile && only === 'mobile') || (!isMobile && only === 'desktop');
			var SCROLL_TO = 200;

			event.preventDefault();

			shouldScroll && this.scrollTo(this.$tools.dom.find(this.$options.target), this.$options.speed || SCROLL_TO);
		},

		scrollTo: function($target, speed, offset){
			pubsub.publish('header.height', function(headerHeight) {
				offset = (-offset || 0) - headerHeight;
				jqScrollTo($target, speed, { offset: offset });
			});
		}
	};


/***/ },

/***/ 567:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(568);


/***/ },

/***/ 568:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./addons/immediate/addon/index.js": 569,
		"./addons/immediate/index.js": 570,
		"./addons/later/addon/index.js": 571,
		"./addons/later/index.js": 572,
		"./admins/activate-profile/index.js": 573,
		"./admins/manage/config/changes.js": 574,
		"./admins/manage/config/customers/accounts/filter/index.js": 575,
		"./admins/manage/config/customers/accounts/index.js": 576,
		"./admins/manage/config/customers/index.js": 577,
		"./admins/manage/config/customers/table/index.js": 578,
		"./admins/manage/config/cvr/index.js": 579,
		"./admins/manage/config/cvr/table/index.js": 580,
		"./admins/manage/config/filter/index.js": 581,
		"./admins/manage/config/index.js": 582,
		"./admins/manage/config/presenter.js": 583,
		"./admins/manage/confirm/index.js": 584,
		"./admins/manage/index.js": 585,
		"./admins/manage/toggle-all/index.js": 586,
		"./admins/profile/index.js": 587,
		"./admins/resend-link/index.js": 588,
		"./admins/reset-password/index.js": 589,
		"./admins/send-reset-link/index.js": 590,
		"./anonymous-payment/index.js": 591,
		"./change-payment-method/config/index.js": 592,
		"./change-payment-method/confirm/index.js": 593,
		"./change-payment-method/index.js": 594,
		"./dsl/change/index.js": 595,
		"./effective-date/index.js": 596,
		"./installment/pay-extra/index.js": 597,
		"./installment/payout/index.js": 598,
		"./invoices/chart/index.js": 599,
		"./invoices/download-dropdown/index.js": 600,
		"./invoices/index.js": 601,
		"./invoices/table-filters/index.js": 602,
		"./invoices/table/index.js": 603,
		"./list/filter/index.js": 604,
		"./list/index.js": 605,
		"./list/load-more/index.js": 606,
		"./list/save-state/index.js": 607,
		"./mobile/change/addons-block/index.js": 608,
		"./mobile/change/config/index.js": 609,
		"./mobile/change/config/reason/index.js": 610,
		"./mobile/change/confirm/index.js": 611,
		"./mobile/change/index.js": 612,
		"./orders/index.js": 613,
		"./profile/index.js": 614,
		"./profile/permissions/marketing/index.js": 615,
		"./profile/permissions/switcher/index.js": 616,
		"./push-communication/index.js": 617,
		"./rebook/config/index.js": 618,
		"./rebook/confirm/index.js": 620,
		"./rebook/index.js": 621,
		"./subscriptions/dropdown/index.js": 622,
		"./subscriptions/msoffice/index.js": 623,
		"./subscriptions/settings/index.js": 624,
		"./tickets/attachments/index.js": 625,
		"./tickets/choices/index.js": 628,
		"./tickets/fault-category/index.js": 629,
		"./tickets/feed/index.js": 630,
		"./tickets/index.js": 631,
		"./tickets/repair/accessories/index.js": 632,
		"./tickets/repair/confirm-device/index.js": 633,
		"./tickets/repair/contacts/index.js": 634,
		"./tickets/repair/cost-limit/index.js": 635,
		"./tickets/repair/fault-description/index.js": 636,
		"./tickets/repair/index.js": 637,
		"./tickets/repair/loan-phone/index.js": 638,
		"./tickets/repair/lock-code/index.js": 639,
		"./tickets/repair/search-device/index.js": 640,
		"./tickets/repair/summary/index.js": 641,
		"./timeline/filter/index.js": 642,
		"./timeline/independentComment/index.js": 643,
		"./timeline/index.js": 644,
		"./timeline/table/index.js": 645,
		"./timeline/tree/comments/form/index.js": 646,
		"./timeline/tree/comments/index.js": 647,
		"./timeline/tree/comments/list/index.js": 648,
		"./timeline/tree/frame/index.js": 649,
		"./timeline/tree/frame/item/index.js": 650,
		"./timeline/tree/index.js": 651,
		"./timeline/tree/period/index.js": 652,
		"./top-ups/index.js": 653,
		"./top-ups/recommended/index.js": 654,
		"./transfer/accept/index.js": 655,
		"./transfer/index.js": 656,
		"./transfer/login/index.js": 657,
		"./usage/details/class-toggler/index.js": 658,
		"./usage/details/index.js": 659,
		"./usage/details/table/index.js": 660,
		"./usage/index.js": 661
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
	webpackContext.id = 568;


/***/ },

/***/ 569:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		openClass: 'addon-block__collapse-block--opened'
	};

	module.exports = {
		events: {
			'click $submit': '_submit',
			'click $callback': '_callback',
			'click $opener': '_loadEffective',
			'click $closer': 'close',
			'transitionend addonsCollapseBlock': '_toggleButtons',
			'changed $accept': '_checkSubmit',
			'change $effective': '_checkSubmit'
		},

		initialize: function() {
			this.toggleDfd = null;

			this.opened = false;

			this.effectiveLoaded = !this.$options.effectiveUrl || Boolean(this.$options.callbackUrl);
		},

		open: function() {
			if (!this.effectiveLoaded) {
				return this._loadEffective();
			}

			this._endToggleDeferred();
			this.toggleDfd = this.$tools.q.defer();

			if (this.opened) {
				this.toggleDfd.resolve();

				return this.toggleDfd.promise();
			}

			this._hideMessages();

			this.$components.closer.enable();

			this._checkSubmit();

			this.$elements.addonsCollapseBlock.addClass(CLASSES.openClass);
			this.$components.opener.disable();

			this.opened = true;

			return this.toggleDfd.promise();
		},

		close: function() {
			this._endToggleDeferred();
			this.toggleDfd = this.$tools.q.defer();

			if (!this.opened) {
				this.toggleDfd.resolve();

				return this.toggleDfd.promise();
			}

			this._hideMessages();

			this.$components.opener.enable();
			this.$components.accept && this.$components.accept.uncheck();
			this.$components.closer.disable();

			this.$elements.addonsCollapseBlock.removeClass(CLASSES.openClass);

			if (this.$components.submit) {
				this.$components.submit.disable();
			}

			this.opened = false;

			return this.toggleDfd.promise();
		},

		remove: function() {
			this.$el.remove();
		},

		_submit: function() {
			var effectiveInfo = this.$components.effective.getData();

			if (!effectiveInfo) {
				return;
			}

			this.$tools.data.post(this.$options.subscribeUrl, {
				subscriberId: this.$options.subscriberId,
				offerId: this.$options.id,
				effectiveType: effectiveInfo.EffectiveType,
				effectiveDate: effectiveInfo.EffectiveDate
			})
				.then(this._addonSubscribeSuccess.bind(this))
				.catch(this._addonSubscribeFailed.bind(this))

				.finally(function() {
					this.$components.submit.resetLoading();
				}.bind(this));

			this.$components.submit.activityIndicator();
		},

		_addonSubscribeSuccess: function(response) {
			if (!response.success) {
				this._addonSubscribeFailed();

				return;
			}

			this.close();

			this.$components.successMessage.setText(response.data.successMessage);
			this.$components.successMessage.open();

			if (!this.$options.multipleOrdersAllowed) {
				this.$components.opener.disable();
			}

			if (response.data.compatibleOffers) {
				this.$events.trigger('compatible', response.data.compatibleOffers);
			}
		},

		_addonSubscribeFailed: function() {
			this.$components.errorMessage.open();
		},

		_callback: function() {
			if (!this.$components.callbackForm.valid()) {
				return;
			}

			this.$tools.data.post(this.$options.callbackUrl, this.$components.callbackForm.serialize())
				.then(this._addonSubscribeSuccess.bind(this))
				.catch(this.$components.errorMessage.open.bind(this.$components.errorMessage))
				.finally(this.$components.callback.resetLoading.bind(this.$components.callback));
		},

		_loadEffective: function() {
			if (this.effectiveLoaded) {
				return this.open();
			}

			this.$events.trigger('busy-mode-on');

			if (this.$options.commitmentUrl) {
				this.load(this.$options.commitmentUrl, this.$elements.commitmentContainer, {});
			}

			return this.load(this.$options.effectiveUrl, this.$elements.effectiveContainer, {})
				.then(this._effectiveLoaded.bind(this))
				.catch(this._effectiveFailed.bind(this))
				.finally(function() {
					this.$events.trigger('busy-mode-off');
				}.bind(this));
		},

		_effectiveLoaded: function(data) {
			if (!data.success) {
				return this.$tools.q.reject(data);
			}

			this.effectiveLoaded = true;

			return this.open();
		},

		_effectiveFailed: function(error) {
			this.$components.errorMessage.open();

			return this.$tools.q.reject(error);
		},

		_endToggleDeferred: function() {
			this.toggleDfd && this.toggleDfd.resolve();

			this.toggleDfd = null;
		},

		_toggleButtons: function($ev) {
			if ($ev.target !== this.$elements.addonsCollapseBlock.get(0)) {
				return;
			}

			this.$components.opener.$el.toggle();
			this.$elements.addonsSaveButtons.toggle();

			this._endToggleDeferred();
		},

		_hideMessages: function() {
			this.$components.successMessage.close();
			this.$components.errorMessage.close();
		},

		_checkSubmit: function() {
			var accept = this.$components.accept;

			if (!this.effectiveLoaded) {
				this.$components.submit.disable();

				return;
			}

			if (!this.$components.effective) {
				return;
			}

			if (accept && accept.isChecked() && this.$components.effective.isValid()) {
				this.$components.submit.enable();
			} else {
				this.$components.submit.disable();
			}
		}
	};


/***/ },

/***/ 570:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'compatible $$orderAddons': '_compatible'
		},

		_compatible: function($ev, ids) {
			this.$components.orderAddons.forEach(function(addon, index) {
				if (ids.indexOf(addon.$options.id) !== -1) {
					return;
				}

				addon.remove();
				this.$components.orderAddons.splice(index, 1);
			}.bind(this));
		}
	};


/***/ },

/***/ 571:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $opener': '_select',
			'loadedclick $opener': '_deselect'
		},

		initialize: function() {
			this.blockedAddons = this.$options.blockedAddons;
			// We need to string because if it will be only one addon id - it will be a number type.
			this.blockedAddons = this.blockedAddons ? this.blockedAddons.toString().split(',') : [];

			this.dependedAddons = this.$options.dependedAddons;
			// We need to string because if it will be only one addon id - it will be a number type.
			this.dependedAddons = this.dependedAddons ? this.dependedAddons.toString().split(',') : [];

			this.blockers = [];
			this.dependers = [];

			this.$options.id = this.$options.id.toString();
		},

		disable: function() {
			this.$components.opener.disable();
		},

		enable: function() {
			this.$components.opener.enable();
		},

		addBlocker: function(blockerId) {
			this.blockers.push(blockerId);

			this.deselect();
			this.disable();
		},

		removeBlocker: function(blockerId) {
			var index = this.blockers.indexOf(blockerId);

			if (index === -1) {
				return;
			}

			this.blockers.splice(index, 1);

			if (this.isCompatible()) {
				this.enable();
			}
		},

		addDepender: function(dependerId) {
			if (dependerId === this.$options.id) {
				return;
			}

			this.dependers.push(dependerId);

			this.disable();
		},

		removeDepender: function(dependerId) {
			var index = this.dependers.indexOf(dependerId);

			if (index === -1) {
				return;
			}

			this.dependers.splice(index, 1);

			if (this.isCompatible()) {
				this.deselect();
				this.enable();
			}
		},

		isCompatible: function() {
			return this.blockers.length === 0 && this.dependers.length === 0;
		},

		select: function() {
			if (!this.isCompatible()) {
				return false;
			}

			this.$components.opener.setAsLoaded();

			return true;
		},

		deselect: function() {
			if (!this.isCompatible()) {
				return false;
			}

			this.$components.opener.resetLoading();

			return true;
		},

		_select: function() {
			if (!this.isCompatible()) {
				this.$components.notCompatibleMessage.open();

				return;
			}

			this.$events.trigger('selected', this._getData());
		},
		_deselect: function() {
			this.$events.trigger('deselected', this._getData());
		},
		_getData: function() {
			return {
				id: this.$options.id,
				dependedAddons: this.dependedAddons,
				blockedAddons: this.blockedAddons
			};
		}
	};


/***/ },

/***/ 572:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'selected $$orderAddons': '_select',
			'deselected $$orderAddons': '_deselect'
		},

		initialize: function() {
			this._addons = [];
		},

		getIds: function() {
			return ([]).concat(this._addons);
		},

		addAddon: function(addonId) {
			if (this._addons.indexOf(addonId) !== -1) {
				return;
			}

			this._addons.push(addonId);
		},

		removeAddon: function(addonId) {
			var index = this._addons.indexOf(addonId);

			if (index === -1) {
				return;
			}

			this._addons.splice(index, 1);
		},

		_select: function($ev, addonsData) {
			this.$components.orderAddons.forEach(function(addon) {
				var id = addon.$options.id;

				if (id === addonsData.id || addonsData.dependedAddons.indexOf(id) !== -1) {
					if (addon.select()) {
						this.addAddon(id);
					}

					addon.addDepender(addonsData.id);

					return;
				}

				if (addonsData.blockedAddons.indexOf(id) !== -1) {
					addon.addBlocker(addonsData.id);
				}
			}.bind(this));
		},

		_deselect: function($ev, addonsData) {
			this.$components.orderAddons.forEach(function(addon) {
				var id = addon.$options.id;

				if (id === addonsData.id || addonsData.dependedAddons.indexOf(id) !== -1) {
					addon.removeDepender(addonsData.id);

					if (addon.deselect()) {
						this.removeAddon(id);
					}

					return;
				}

				if (addonsData.blockedAddons.indexOf(id) !== -1) {
					addon.removeBlocker(addonsData.id);
				}
			}.bind(this));
		}
	};


/***/ },

/***/ 573:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $activationForm': '_onActivationFormSubmit',
			'blur [data-selector=username]': '_validateUsername'
		},

		ready: function() {
			this._$usernameField = this.$el.find('[data-selector=username]');
		},

		_onActivationFormSubmit: function() {
			var formData = this.$components.activationForm.serialize();

			this.$components.errorMessage.close();
			this.$components.activationForm.$components.activateButton.activityIndicator();

			this.$tools.data.post(this.$components.activationForm.getUrl(), formData)
				.then(this._onActivationSuccess.bind(this))
				.catch(this._onActivationFail.bind(this))
				.finally(this._activationRequestComplete.bind(this));
		},

		_onActivationSuccess: function(response) {
			if (response.success) {
				this.$tools.util.redirect(response.data.redirectUrl);

				return;
			}

			this._incorrectData(response.errorMessages[0]);
		},

		_onActivationFail: function(response) {
			this._incorrectData(response.errorMessages[0]);
		},

		_activationRequestComplete: function() {
			this.$components.activationForm.$components.activateButton.resetLoading();
		},

		_validateUsername: function() {
			var formData = this.$components.activationForm.serialize();

			if (!this._$usernameField.valid()) {
				return;
			}

			this.$tools.data.post(this.$options.usernameValidationUrl, formData)
				.then(this._onUsernameValidation.bind(this));
		},

		_onUsernameValidation: function(response) {
			if (response.success) {
				return;
			}

			this.$components.activationForm.$events.trigger('customError', {
				input: this._$usernameField[0],
				message: response.errorMessages[0]
			});
		},

		_incorrectData: function(text) {
			this.$components.errorMessage.setText(text);
			this.$components.errorMessage.open();
		}
	};


/***/ },

/***/ 574:
/***/ function(module, exports) {

	'use strict';

	var idName = 'CustomerId';

	module.exports = {
		_changes: {},
		_temporary: {},

		addLoaded: function(data) {
			data.forEach(function(row) {
				var model = row.model;
				var id = model[idName];

				this._changes[id] = this._changes[id] || {
					newStatus: true
				};

				this._changes[id].model = model;
			}.bind(this));
		},

		getChanges: function() {
			return Object.keys(this._changes).map(function(key) {
				return this.getChangesById(key);
			}.bind(this));
		},

		getChangesById: function(customerId) {
			var changes = this._changes[customerId];
			var change = {
				model: changes.model
			};

			if (typeof changes.newStatus !== 'undefined') {
				change.newStatus = changes.newStatus;
			}

			if (changes.accounts) {
				change.accounts = Object.keys(changes.accounts).map(function(key) {
					return changes.accounts[key];
				});
			}

			return change;
		},

		addStable: function(customerId, changes) {
			this._applyChanges(this._changes, customerId, changes);
		},

		addTemporary: function(customerId, changes) {
			this._applyChanges(this._temporary, customerId, changes);
		},

		resetTemporary: function() {
			this._temporary = {};
		},

		saveTemporary: function() {
			Object.keys(this._temporary).forEach(function(key) {
				var temp = this._temporary[key];

				if (!temp.newStatus && !this._changes[temp.model[idName]]) {
					return;
				}

				this.addStable(key, temp);
			}.bind(this));

			this.resetTemporary();
		},

		_applyChanges: function(result, customerId, changes) {
			if (!Object.keys(changes).length) {
				return;
			}

			if (!result[customerId]) {
				result[customerId] = changes;

				return;
			}

			if (typeof changes.newStatus !== 'undefined') {
				result[customerId].newStatus = changes.newStatus;
			}

			if (changes.accounts) {
				this._applyAccounts(result[customerId], changes.accounts);
			}
		},

		_applyAccounts: function(result, accounts) {
			if (!result.accounts) {
				result.accounts = accounts;

				return;
			}

			Object.keys(accounts).forEach(function(key) {
				result.accounts[key] = accounts[key];
			});
		}
	};


/***/ },

/***/ 575:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tablesChanges = __webpack_require__(574);

	/**
	  name: Datatables hidden changes filter
	  type: ui
	  desc: >
	    Filters table based on saved changes
	*/
	module.exports = {
		/**
			desc: Standard method for getting filter value.
			*/
		filters: function() {
			var changes = tablesChanges.getChangesById(this.$options.customerId);

			return [{
				type: 'changes',
				name: this.$options.column,
				value: changes
			}];
		}
	};


/***/ },

/***/ 576:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tablesChanges = __webpack_require__(574);

	module.exports = {
		events: {
			'change $$switchers': '_switcherChanged'
		},

		_switcherChanged: function($ev) {
			var component = $ev.data.component;
			var name = component.getName();
			var customerId = this.$options.customerId;
			var inst = this.$el.find('table:first').DataTable();
			var $row = component.$el.closest('tr');
			var data = inst.row($row).data();
			var change = {
				accounts: {}
			};

			change.accounts[name] = {
				model: data.Model,
				newStatus: component.isChecked()
			};

			tablesChanges.addStable(customerId, change);
		}
	};


/***/ },

/***/ 577:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $next': '_next'
		},

		ready: function() {
			this.$components.customers.$events.one('loaded $this', this._customersLoaded.bind(this));
		},

		reload: function() {
			this.$components.customers.$events.trigger('reload');
		},

		_customersLoaded: function() {
			this.$components.next.enable();
			this.$events.trigger('customersLoaded');
		},

		_next: function() {
			this.$components.next.activityIndicator();

			this.flow.next()
				.finally(this.$components.next.resetLoading.bind(this.$components.next));
		}
	};


/***/ },

/***/ 578:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tablesChanges = __webpack_require__(574);

	module.exports = {
		initialize: function() {
			this.$events.on('loaded $this', this._loaded.bind(this));
			this.$events.on('drawed $this', this._drawed.bind(this));

			this._switchersHandler = this._switcherChanged.bind(this);
		},

		_loaded: function($ev, data) {
			data = data.data;

			tablesChanges.addLoaded(data.map(function(rowData) {
				return {
					model: rowData.Model
				};
			}));
		},

		_drawed: function() {
			if (!this.$components.switchers) {
				return;
			}

			this.$components.switchers.forEach(function(switcher) {
				switcher.$events.off('change $this', this._switchersHandler);
				switcher.$events.on('change $this', this._switchersHandler);
			}.bind(this));
		},

		_switcherChanged: function($ev) {
			var component = $ev.data.component;
			var customerId = component.getName();
			var inst = this.$el.find('table:first').DataTable();
			var $row = component.$el.closest('tr');
			var data = inst.row($row).data();

			var change = {
				model: data.Model,
				newStatus: component.isChecked()
			};

			tablesChanges.addStable(customerId, change);
		}
	};


/***/ },

/***/ 579:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tablesChanges = __webpack_require__(574);

	module.exports = {
		events: {
			'click $cancel': '_cancel',
			'click $add': '_add'
		},

		_cancel: function() {
			tablesChanges.resetTemporary();

			this.flow.prev();
		},

		_add: function() {
			tablesChanges.saveTemporary();

			this.$events.trigger('save');

			this.flow.prev();
		}
	};


/***/ },

/***/ 580:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tablesChanges = __webpack_require__(574);

	var SELECTORS = {
		searchInput: '[data-selector=searchInput]'
	};

	module.exports = {
		events: {
			'change $$switchers': '_switcherChanged'
		},

		ready: function() {
			this.$el.one('draw.dt', this._focus.bind(this));
		},

		_focus: function() {
			this.$el.find(SELECTORS.searchInput).focus();
		},

		_switcherChanged: function($ev) {
			var component = $ev.data.component;
			var name = component.getName();
			var inst = this.$el.find('table:first').DataTable();
			var $row = component.$el.closest('tr');
			var data = inst.row($row.get(0)).data();

			tablesChanges.addTemporary(name, {
				model: data.Model,
				newStatus: component.isChecked()
			});
		}
	};


/***/ },

/***/ 581:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tablesChanges = __webpack_require__(574);

	/**
	  name: Datatables hidden changes filter
	  type: ui
	  desc: >
	    Filters table based on saved changes
	*/
	module.exports = {
		/**
			desc: Standard method for getting filter value.
			*/
		filters: function() {
			var changes = tablesChanges.getChanges();

			return [{
				type: 'changes',
				name: this.$options.column,
				value: changes
			}];
		}
	};


/***/ },

/***/ 582:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Flow = __webpack_require__(442);
	var Presenter = __webpack_require__(583);

	var SELECTORS = {
		buttons: '[data-selector=buttons]',
		username: '[data-selector=username]',
		serverErrorText: '[data-selector=serverErrorText]'
	};

	var tablesChanges = __webpack_require__(574);

	module.exports = {
		events: {
			'click $submit': '_submit',
			'click $next': '_next',
			'click $delete': '_delete',
			'activate $cvr': '_hideButtons',
			'deactivate $cvr': '_showButtons',
			'save $cvr': '_reloadCustomers',
			'customersLoaded $customers': '_customersLoaded'
		},

		initialize: function() {
			var $username = this.$el.find(SELECTORS.username);

			this.flowSteps = new Flow.FlowController(new Presenter(this), {
				customers: {
					statik: true,
					index: 0,
					infer: function(data) {
						return {
							next: 'cvr',
							payload: data
						};
					}
				},
				cvr: {
					index: 1,
					componentContentURL: this.$options.cvrUrl,
					statik: false,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				}
			}, this.$events);

			this._serverErrorText = this.$el.find(SELECTORS.serverErrorText).text();

			if ($username.length) {
				this.username = $username.val();
			}
		},

		ready: function() {
			this.flowSteps.startWith('customers');
		},

		_customersLoaded: function() {
			if (this.$components.next) {
				this.$components.next.enable();
			}

			if (this.$components.submit) {
				this.$components.submit.enable();
			}
		},

		_getData: function() {
			var data = {};

			data.admin = this.$components.info.serialize();
			data.admin.username = this.username;
			data.changes = tablesChanges.getChanges();

			return data;
		},

		_submit: function() {
			if (!this.$components.info.valid()) {
				return;
			}

			this._hideSubmitError();

			this.$components.submit.activityIndicator();

			this.$tools.data.post(this.$options.saveUrl, this._getData())
				.then(this._submitRedirect.bind(this))

				.catch(function() {
					this._showSubmitError(this._serverErrorText);
					this.$components.submit.resetLoading();
				}.bind(this));
		},

		_submitRedirect: function(response) {
			if (!response.success) {
				this._showSubmitError(response.errorMessages[0]);
				this.$components.submit.resetLoading();

				return;
			}

			this.$tools.util.redirect(response.data.redirectUrl);
		},

		_next: function() {
			if (!this.$components.info.valid()) {
				return;
			}

			this._hideSubmitError();

			this.$components.next.activityIndicator();

			this.$tools.data.post(this.$options.checkChangesUrl, {
				changes: tablesChanges.getChanges()
			})
				.then(this._goNext.bind(this))
				.catch(function() {
					this._showSubmitError(this._serverErrorText);
					this.$components.next.resetLoading();
				}.bind(this));
		},

		_goNext: function(response) {
			var data;

			if (!response.success) {
				this._showSubmitError(response.errorMessages[0]);
				this.$components.next.resetLoading();

				return;
			}

			data = this._getData();

			delete data.changes;

			this.flow.next(data)
				.catch(this._showSubmitError.bind(this, this._serverErrorText))
				.finally(this.$components.next.resetLoading.bind(this.$components.next));
		},

		_showSubmitError: function(text) {
			this.$components.serverErrorMessage.setText(text);
			this.$components.serverErrorMessage.open();
		},

		_hideSubmitError: function() {
			this.$components.serverErrorMessage.close();
		},

		_hideButtons: function() {
			this.hide(SELECTORS.buttons);
		},

		_reloadCustomers: function() {
			this.$components.customers.reload();
		},

		_showButtons: function() {
			this.show(SELECTORS.buttons);
		},

		_delete: function() {
			this.$components.deleteBox.show();
		}
	};


/***/ },

/***/ 583:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Flow = __webpack_require__(442);

	var BaseFlowPresenter = Flow.WizardFlowPresenter;

	var Presenter = module.exports = function() {
		BaseFlowPresenter.apply(this, Array.prototype.slice.call(arguments));
	};

	Presenter.prototype = new BaseFlowPresenter();
	Presenter.prototype.constructor = Presenter;

	Presenter.prototype._hideStep = function() {
		this.component.$components[this.component.flowSteps.currentState.name].$el.hide();
	};

	Presenter.prototype._showComponent = function(placeholder) {
		placeholder.show();
	};


/***/ },

/***/ 584:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tableChanges = __webpack_require__(574);

	var SELECTORS = {
		serverErrorText: '[data-selector=serverErrorText]'
	};

	module.exports = {
		events: {
			'click $confirmForm $back': '_back',
			'submit $confirmForm': '_next'
		},

		initialize: function() {
			this._serverErrorText = this.$el.find(SELECTORS.serverErrorText).text();
		},

		_back: function() {
			this.flow.prev();
		},

		_next: function() {
			var data = this.$components.confirmForm.serialize();

			this.$components.serverErrorMessage.close();

			this.$components.confirmForm.$components.back.disable();
			this.$components.confirmForm.$components.next.activityIndicator();

			data.changes = tableChanges.getChanges();

			this.$tools.data.post(this.$components.confirmForm.getUrl(), data)
				.then(this._redirect.bind(this))
				.catch(function() {
					this._showError(this._serverErrorText);
					this._resetLoading();
				}.bind(this));
		},

		_resetLoading: function() {
			this.$components.confirmForm.$components.back.enable();
			this.$components.confirmForm.$components.next.resetLoading();
		},

		_redirect: function(data) {
			if (!data.success || !data.data.redirectUrl) {
				this._resetLoading();
				this._showError(data.errorMessages[0]);

				return;
			}

			this.$tools.util.redirect(data.data.redirectUrl);
		},

		_showError: function(text) {
			text = text || this._serverErrorText;

			this.$components.serverErrorMessage.setText(text);
			this.$components.serverErrorMessage.open();
		}
	};


/***/ },

/***/ 585:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new Flow.FlowController(new Flow.WizardFlowPresenter(this), {
				config: {
					statik: true,
					index: 0,
					infer: function(data) {
						return {
							next: 'confirm',
							payload: data
						};
					}
				},
				confirm: {
					index: 1,
					componentContentURL: this.$options.confirmUrl,
					statik: false,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				}
			}, this.$events);
		},

		ready: function() {
			this.flow.startWith('config');
		}
	};


/***/ },

/***/ 586:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		toggledAll: 'button--action'
	};

	module.exports = {
		events: {
			'click $toggleAll': '_toggleAll'
		},

		initialize: function() {
			// we already have bindings via events object for "change $$switchers", so we should add events for ones via separate method
			this.$events.on('drawed $this', this._drawed.bind(this));
		},

		_drawed: function() {
			if (!this.$components.switchers) {
				this.$components.toggleAll.disable();

				return;
			}

			this.$components.toggleAll.enable();

			this.$components.switchers.forEach(function(switcher) {
				switcher.$events.on('change $this', this._switcherChanged.bind(this));
			}.bind(this));

			this._switcherChanged();
		},

		_toggleAll: function() {
			var allChecked;

			if (!this.$components.switchers) {
				return;
			}

			allChecked = this._isAllChecked();

			this.$components.switchers.forEach(function(switcher) {
				switcher.setValue(!allChecked);
			});
		},

		_switcherChanged: function() {
			if (!this.$components.switchers) {
				return;
			}

			if (this._isAllChecked()) {
				this.$components.toggleAll.$el.addClass(CLASSES.toggledAll);
			} else {
				this.$components.toggleAll.$el.removeClass(CLASSES.toggledAll);
			}
		},

		_isAllChecked: function() {
			if (!this.$components.switchers) {
				return false;
			}

			return this.$components.switchers.reduce(function(val, switcher) {
				return val && switcher.isChecked();
			}, true);
		}
	};


/***/ },

/***/ 587:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		changePersonalInformationTrigger: '[data-selector=changePersonalInformationTrigger]',
		personalInformationText: '[data-selector=personalInformationText]',
		changeUserInformationTrigger: '[data-selector=changeUserInformationTrigger]',
		userInformationText: '[data-selector=userInformationText]'
	};

	module.exports = {
		events: {
			'submit $personalInformationForm': '_onPersonalInformationFormSubmit',
			'reset $personalInformationForm': '_onPersonalInformationFormReset',
			'submit $userInformationForm': '_onUserInformationFormSubmit',
			'reset $userInformationForm': '_onUserInformationFormReset',
			'click [data-selector=changePersonalInformationTrigger]': '_onPersonalInformationTriggerClick',
			'click [data-selector=changeUserInformationTrigger]': '_onUserInformationTriggerClick'
		},

		_onPersonalInformationTriggerClick: function() {
			this._startEditingPersonalInformation();
			this._resetPersonalInformationMessages();
		},

		_onPersonalInformationFormReset: function() {
			this._finishEditingPersonalInformation();
			this._resetPersonalInformationMessages();
		},

		_startEditingPersonalInformation: function() {
			this.$components.personalInformationForm.show();
			this.hide(SELECTORS.changePersonalInformationTrigger);
			this.hide(SELECTORS.personalInformationText);
		},

		_finishEditingPersonalInformation: function() {
			this.$components.personalInformationForm.hide();
			this.show(SELECTORS.changePersonalInformationTrigger);
			this.show(SELECTORS.personalInformationText);
		},

		_resetPersonalInformationMessages: function() {
			this.$components.personalInformationSuccessMessage.close();
			this.$components.personalInformationErrorMessage.close();
		},

		_onUserInformationTriggerClick: function() {
			this._startEditingUserInformation();
			this._resetUserInformationMessages();
		},

		_onUserInformationFormReset: function() {
			this._finishEditingUserInformation();
			this._resetUserInformationMessages();
		},

		_startEditingUserInformation: function() {
			this.$components.userInformationForm.show();
			this.hide(SELECTORS.changeUserInformationTrigger);
			this.hide(SELECTORS.userInformationText);
		},

		_finishEditingUserInformation: function() {
			this.$components.userInformationForm.hide();
			this.show(SELECTORS.changeUserInformationTrigger);
			this.show(SELECTORS.userInformationText);
		},

		_resetUserInformationMessages: function() {
			this.$components.userInformationSuccessMessage.close();
			this.$components.userInformationErrorMessage.close();
		},

		_onPersonalInformationFormSubmit: function() {
			var form = this.$components.personalInformationForm;

			form.$components.submitButton.activityIndicator();
			this._resetPersonalInformationMessages();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onPersonalInformationSubmitSuccess.bind(this))
				.catch(this._onPersonalInformationSubmitError.bind(this))
				.finally(this._onPersonalInformationSubmitComplete.bind(this));
		},

		_onPersonalInformationSubmitSuccess: function(response) {
			if (response.success) {
				this.html(response.data.html, SELECTORS.personalInformationText);
				this.$components.personalInformationSuccessMessage.open();
				this._finishEditingPersonalInformation();

				return;
			}

			this._incorrectData(this.$components.personalInformationErrorMessage, response.errorMessages[0]);
		},

		_onPersonalInformationSubmitError: function(response) {
			this._incorrectData(this.$components.personalInformationErrorMessage, response.errorMessages[0]);
		},

		_onPersonalInformationSubmitComplete: function() {
			this.$components.personalInformationForm.$components.submitButton.resetLoading();
		},

		_onUserInformationFormSubmit: function() {
			var form = this.$components.userInformationForm;

			form.$components.submitButton.activityIndicator();
			this._resetUserInformationMessages();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onUserInformationSubmitSuccess.bind(this))
				.catch(this._onUserInformationSubmitError.bind(this))
				.finally(this._onUserInformationSubmitComplete.bind(this));
		},

		_onUserInformationSubmitSuccess: function(response) {
			if (response.success) {
				this.$components.userInformationSuccessMessage.open();
				this._finishEditingUserInformation();

				return;
			}

			this._incorrectData(this.$components.userInformationErrorMessage, response.errorMessages[0]);
		},

		_onUserInformationSubmitError: function(response) {
			this._incorrectData(this.$components.userInformationErrorMessage, response.errorMessages[0]);
		},

		_onUserInformationSubmitComplete: function() {
			this.$components.userInformationForm.$components.submitButton.resetLoading();
		},

		_incorrectData: function(messageComponent, text) {
			messageComponent.setText(text);
			messageComponent.open();
		}
	};


/***/ },

/***/ 588:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $resendForm': '_onResendFormSubmit'
		},

		ready: function() {
			this._submitButton = this.$components.resendForm.$components.submitButton;
		},

		_onResendFormSubmit: function() {
			var formData = this.$components.resendForm.serialize();

			this.$components.errorMessage.close();
			this._submitButton.activityIndicator();

			this.$tools.data.post(this.$components.resendForm.getUrl(), formData)
				.then(this._onResendSuccess.bind(this))
				.catch(this._onResendFail.bind(this))
				.finally(this._resendRequestComplete.bind(this));
		},

		_onResendSuccess: function(response) {
			if (!response.success) {
				this._onResendFail(response);

				return;
			}

			this.$components.successMessage.open();
			this.$components.resendForm.hide();
		},

		_onResendFail: function(response) {
			this.$components.errorMessage.setText(response.errorMessages[0]);
			this.$components.errorMessage.open();
		},

		_resendRequestComplete: function() {
			this._submitButton.resetLoading();
		}
	};


/***/ },

/***/ 589:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $resetPasswordForm': '_onResetFormSubmit'
		},

		ready: function() {
			this._submitButton = this.$components.resetPasswordForm.$components.submitButton;
		},

		_onResetFormSubmit: function() {
			var formData = this.$components.resetPasswordForm.serialize();

			this.$components.errorMessage.close();
			this._submitButton.activityIndicator();

			this.$tools.data.post(this.$components.resetPasswordForm.getUrl(), formData)
				.then(this._onResetSuccess.bind(this))
				.catch(this._onResetFail.bind(this))
				.finally(this._resetComplete.bind(this));
		},

		_onResetSuccess: function(response) {
			if (!response.success) {
				this._onResetFail(response);

				return;
			}

			this.$tools.util.redirect(response.data.redirectUrl);
		},

		_onResetFail: function(response) {
			this.$components.errorMessage.setText(response.errorMessages[0]);
			this.$components.errorMessage.open();
		},

		_resetComplete: function() {
			this._submitButton.resetLoading();
		}
	};


/***/ },

/***/ 590:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $sendLinkForm': '_onSendLinkFormSubmit'
		},

		ready: function() {
			this._submitButton = this.$components.sendLinkForm.$components.submitButton;
		},

		_onSendLinkFormSubmit: function() {
			var formData = this.$components.sendLinkForm.serialize();

			this.$components.errorMessage.close();
			this._submitButton.activityIndicator();

			this.$tools.data.post(this.$components.sendLinkForm.getUrl(), formData)
				.then(this._onSendLinkSuccess.bind(this))
				.catch(this._onSendLinkFail.bind(this))
				.finally(this._sendLinkComplete.bind(this));
		},

		_onSendLinkSuccess: function(response) {
			if (!response.success) {
				this._onSendLinkFail(response);

				return;
			}

			this.$components.successMessage.open();
			this.$components.sendLinkForm.hide();
		},

		_onSendLinkFail: function(response) {
			this.$components.errorMessage.setText(response.errorMessages[0]);
			this.$components.errorMessage.open();
		},

		_sendLinkComplete: function() {
			this._submitButton.resetLoading();
		}
	};


/***/ },

/***/ 591:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $paymentSubmit': '_onSubmitForm',
			'changed $termsAndConditions': '_onTermsClick'
		},
		ready: function() {
			if (!this.$components.termsAndConditions && this.$components.paymentSubmit) {
				this.$components.paymentSubmit.enable();
			}
		},
		_onSubmitForm: function() {
			if (!this.$components.phoneCode || !this.$components.confirmationCode) {
				this.$el.submit();
			} else {
				if (this._isValidConfirmationNumber()) {
					this._setFullNumber();
					this.$el.submit();
				} else {
					this.$components.validationWarning.open();
				}
			}
		},
		_onTermsClick: function() {
			if (this.$components.termsAndConditions.isChecked()) {
				this.$components.paymentSubmit.enable();
				this.$components.tcWarning.close();
			} else {
				this.$components.paymentSubmit.disable();
				this.$components.tcWarning.open();
			}
		},
		_isValidConfirmationNumber: function() {
			var numberCode = this.$components.phoneCode.getValue();
			var confirmationCode = this.$components.confirmationCode.getValue();

			return numberCode === confirmationCode;
		},
		_setFullNumber: function() {
			var fullNumber = this.$components.phoneCode.getValue() + this.$components.phoneNumber.$el.val();
			this.$components.identifier.$el.val(fullNumber);
		}
	};


/***/ },

/***/ 592:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		isActive: 'is-active'
	};

	module.exports = {
		events: {
			'click $submit': '_submitClick',
			'panelChanged $this': '_configChanged',
			'changed $$detailsForms $$billAccess': '_configChanged'
		},

		_configChanged: function() {
			var activeDetailsForm = this._getActiveDetailsForm();

			this._checkSubmit(this.isConfirmationRequired(activeDetailsForm));
		},

		isConfirmationRequired: function(activeDetailsForm) {
			return activeDetailsForm.$components.accept
				&& activeDetailsForm.$components[activeDetailsForm.$options.collapseAlias].isExpanded()
				&& !activeDetailsForm.$components.accept.isChecked();
		},

		_checkSubmit: function(required) {
			if (required) {
				this.$components.submit.disable();
			} else {
				this.$components.submit.enable();
			}
		},

		_submitClick: function(event) {
			var formData = this.$components.deliveryForm.serialize();

			var activeDetailsForm = this._getActiveDetailsForm();

			event.preventDefault();

			if (activeDetailsForm) {
				if (!activeDetailsForm.valid()) {
					return;
				}
				this.$tools.util.extend(formData, activeDetailsForm.serialize());
			}

			this.$components.submit.activityIndicator();

			if (formData.PaymentMethod === this.$options.redirectForMethod) {
				this.$tools.data.post(this.$options.confirmUrl, formData)
					.then(function(data) {
						if (!data.success) {
							this._confirmFailed();
							return;
						}

						this._setLocation(data.data.url);
					}.bind(this))
					.catch(this._confirmFailed.bind(this));
			} else {
				this.flow.next(formData)
					.catch(this._confirmFailed.bind(this))
					.finally(this._confirmLoaded.bind(this));
			}

		},

		_getActiveDetailsForm: function() {
			var detailsForms = this.$components.detailsForms;

			if (!detailsForms) {
				return;
			}
			return this.$components.detailsForms.filter(function(form) {
				return form.$el.hasClass(CLASSES.isActive);
			})[0];
		},

		_setLocation: function(url) {
			window.location.href = url;
		},

		_confirmFailed: function() {
			//this.$components.errorMessage.open();
		},

		_confirmLoaded: function() {
			this.$components.submit.resetLoading();
		}
	};


/***/ },

/***/ 593:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'checked $accept': '_enableSubmit',
			'unchecked $accept': '_disableSubmit',
			'click $submit': '_submit',
			'click $cancel': '_cancel'
		},

		_enableSubmit: function() {
			this.$components.submit.enable();
		},

		_disableSubmit: function() {
			this.$components.submit.disable();
		},

		_submit: function() {
			this.$components.submit.activityIndicator();
		},

		_cancel: function() {
			this.flow.prev();
		}
	};


/***/ },

/***/ 594:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new flow.FlowController(new flow.WizardFlowPresenter(this), {
				config: {
					statik: true,
					index: 0,
					infer: function(data) {
						return {
							next: 'confirm',
							payload: data
						};
					}
				},
				confirm: {
					index: 1,
					componentContentURL: this.$options.confirmUrl,
					statik: false
				}
			}, this.$events);
		},
		ready: function() {
			this.flow.startWith('config');
		}
	};


/***/ },

/***/ 595:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new flow.FlowController(new flow.WizardFlowPresenter(this), {
				selectSubscription: {
					componentContentURL: this.$tools.globalConfigs('TN.config.dsl.services.selectSubscription', ''),
					statik: true,
					index: 0,
					infer: function() {
						return {
							next: 'router',
							payload: {}
						};
					}
				},
				router: {
					index: 1,
					componentContentURL: this.$tools.globalConfigs('TN.config.dsl.services.router', ''),
					statik: false,
					infer: function() {
						return {
							next: 'confirmFlow',
							payload: {}
						};
					}
				},
				confirmFlow: {
					index: 2,
					componentContentURL: this.$tools.globalConfigs('TN.config.dsl.services.confirmation', ''),
					statik: false,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				}
			}, this.$events);
		},
		ready: function() {
			this.flow.startWith('selectSubscription');
		}
	};


/***/ },

/***/ 596:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var scrollTo = __webpack_require__(441);

	module.exports = {
		events: {
			'changed $typeForm $$radios': '_radioChanged',
			'change $typeForm $$datepicker': '_dateChanged',
			'click opener': 'startEditing',
			'click closer': 'cancelEditing'
		},

		/**
			desc: Show this block and scroll to this element
			*/
		showBlock: function() {
			var SCROLL_TO = 250;
			this.show();

			scrollTo(this.$el, SCROLL_TO, {
				axis: 'y',
				offset: {
					top: -80
				},
				limit: false
			});
		},

		/**
			desc:  Returns object with inputs values
			*/
		getData: function() {
			if (!this.isValid()) {
				return null;
			}

			return this.$components.typeForm.serialize();
		},

		/**
			desc: Show loader
			*/
		startLoading: function() {
			this.$events.trigger('busy-mode-on');
		},

		/**
			desc: Hide loader
			*/
		endLoading: function() {
			this.$events.trigger('busy-mode-off');
		},

		/**
			desc: Shows penalty message
			*/
		changeMessage: function(data) {
			if (!data.success) {
				this.showError();

				return;
			}

			this.hideError();

			this.html(data.data.html, this.$elements.penalty);
		},

		/**
			desc: Shows error message
			*/
		showError: function() {
			this.$components.errorMessage.open();
		},

		/**
			desc: Hides error message
			*/
		hideError: function() {
			this.$components.errorMessage.close();
		},

		/**
			desc: If form is filled valid - returns true, false - in other case
			*/
		isValid: function() {
			var isDateVisible = this.$components.typeForm.$components.customDate.isChecked();
			var isDateValid = this.$components.typeForm.valid();

			return !isDateVisible || isDateValid;
		},

		/**
			desc: Shows block with radio buttons
			*/
		startEditing: function() {
			this.$elements.defaultHeader.hide();
			this.$elements.changeDateHeader.show();

			this.$elements.changeDateBlock.show();
			this.$elements.changeDateBlock.addClass('effective-day__edit-block--opened');
		},

		/**
			desc: Hides block with radio buttons and shows default header
			*/
		cancelEditing: function() {
			this.$elements.defaultHeader.show();
			this.$elements.changeDateHeader.hide();

			this.$elements.changeDateBlock.hide();
			this.$elements.changeDateBlock.removeClass('effective-day__edit-block--opened');

			this.$components.typeForm.$components.radios[0].check();
		},

		_radioChanged: function() {
			var isDateVisible = this.$components.typeForm.$components.customDate.isChecked();

			this._dateChanged();

			this.$events.trigger('change');

			this.$elements.datepickerContainer.toggle(isDateVisible);
		},

		_dateChanged: function() {
			if (!this.isValid()) {
				return;
			}

			this.$events.trigger('datechanged');
		}
	};


/***/ },

/***/ 597:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.$bills = this.$el.find('[data-type="bills"] .flex-item:not(.paid)');

			this.$bills.each(function(index, elem) {
				var $this = this.$el.find(elem);
				$this.data('origin-classes', $this.attr('class'));
			}.bind(this));

			this._changeHandler();
			this._changeSlider();
		},

		events: {
			'changed $accept': '_changeHandler',
			'change $range': '_changeSlider',
			'click $submit': '_submitClick'
		},

		_submitClick: function() {
			this.$components.submit.activityIndicator();
		},

		_changeSlider: function() {
			var range = this.$components.range.getRange();
			var to = range.to;
			var length = this.$bills.length - 1;

			this.$bills.each(function(index, elem) {
				var $this = this.$el.find(elem);

				if (length - index < to) {
					$this.removeClass('default billed overdue');

					$this.addClass('blue');

					return;
				}

				$this.attr('class', $this.data('origin-classes'));
			}.bind(this));

			this._changeHandler();
		},

		_changeHandler: function() {
			var accept = this.$components.accept;

			if ((!accept || accept.isChecked()) && this.$components.range.getRange().to != 0) {
				this.$components.submit.enable();

				return;
			}

			this.$components.submit.disable();
		}
	};


/***/ },

/***/ 598:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'changed $accept': '_changeHandler',
			'changed $$values': '_updateSum'
		},

		ready: function() {
			this.$options.chunk = this.$options.chunk || '.';
			this.$options.fixed = this.$options.fixed || ',';

			this._updateSum();
		},

		_changeHandler: function() {
			var accept = this.$components.accept;
			var hasValues = this.$components.values.filter(function(value) {
				return value.isChecked();
			}).length !== 0;

			if ((!accept || accept.isChecked()) && hasValues) {
				this.$components.submit.enable();

				return;
			}

			this.$components.submit.disable();
		},

		_updateSum: function() {
			var sum = this.$components.values.reduce(function(previous, value) {
				return previous + (value.isChecked() ? value.$options.value : 0);
			}, 0);

			this.$components.total.$el.text(this._convertNumber(sum));

			this._changeHandler();
		},

		_convertNumber: function(number) { //TODO Format price
			var HUNG = 100;
			var MAX_LENGTH = 6;
			var GROUP = 3;
			var text = (number / HUNG).toFixed(2);
			var whole;
			var fixed;
			var index;
			var res;

			if (text.length < MAX_LENGTH) {
				return text;
			}

			text = text.split('.');

			whole = text[0];

			fixed = text[1];

			res = whole.charAt(whole.length - 1);

			for (index = whole.length - 2; index > -1 ; --index) {
				res = whole.charAt(index) + ((whole.length - index - 1) % GROUP === 0 ? this.$options.chunk : '' ) + res;
			}

			return res + this.$options.fixed + fixed;
		}
	};


/***/ },

/***/ 599:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		active: 'is-active'
	};

	module.exports = {
		ready: function() {
			this._queryGraph();
		},

		_queryGraph: function(event) {
			var chartData = {
				chartSettings: this.$options.chartSettings
			};

			this._showLoadingState();

			if (event) {
				chartData.intervalNumber = event.data.component.$options.intervalIndex;
				if (this.$components.changeMonths) {
					this.$components.changeMonths.forEach(function(button) {
						button.$el.removeClass(CLASSES.active);
					});
				}
				event.data.component.$el.addClass(CLASSES.active);
			}

			this.load(this.$options.billschartUrl, null, chartData)
				.then(function() {
					if (this.$components.changeMonths) {
						this.$components.changeMonths.forEach(function(cm) {
							cm.$events.on('click $this', this._queryGraph.bind(this));
						}.bind(this));
					}

					this._hideLoadingState();
				}.bind(this));

			return false;
		},

		_showLoadingState: function() {
			this.$events.trigger('busy-mode-on');
		},

		_hideLoadingState: function() {
			this.$events.trigger('busy-mode-off');
		}

	};


/***/ },

/***/ 600:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		downloadInputs: '[data-selector=downloadInput]'
	};

	module.exports = {
		/**
			desc: Update count text
			params:
				count: New count value
			*/
		updateCount: function(count) {
			var text = this.$options.text + (count === 0 ? '' : ' (' + count + ')');

			this.$elements.text.text(text);
		},

		/**
			desc: Update hidden input values
			params:
				value: New value for each hidden input
			*/
		updateInputs: function(value) {
			this.$tools.dom.find(SELECTORS.downloadInputs).val(value);
		}
	};


/***/ },

/***/ 601:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $submit': '_submit',
			'invoicesChanged $table': '_selectionChanged'
		},

		_selectionChanged: function($ev, selection) {
			this.$elements.invoiceValues.val(JSON.stringify(selection));

			this._toggleSubmit(selection.length);
		},

		_toggleSubmit: function(length) {
			if (!this.$components.submit) {
				return;
			}

			if (length) {
				this.$components.submit.enable();
			} else {
				this.$components.submit.disable();
			}
		},

		_submit: function() {
			this.$components.submit.activityIndicator();
		}
	};


/***/ },

/***/ 602:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			if (!this.$components['datatables/filters/date-range'] || !this.$components.selectBC) {
				return;
			}

			this.change = false;
			// Wait for fixing defect with unbinding events from events object. Then move this to events object
			this.$components.selectBC.$events.on('change $this', this.clearDatepicker.bind(this));
			this.$components['datatables/filters/date-range'][0].$events.on('change $this', this.clearSelect.bind(this));
		},

		clearSelect: function() {
			if (!this.$components.selectBC) {
				return;
			}

			if (this.change) {
				this.change = false;

				return;
			}

			this.change = true;

			this.$components.selectBC.$extensions.select.selectFirst();

			this.change = false;
		},

		clearDatepicker: function() {
			if (!this.$components['datatables/filters/date-range']) {
				return;
			}

			if (this.change) {
				this.change = false;

				return;
			}

			this.change = true;

			this.$components['datatables/filters/date-range'][0].$extensions.datepicker.reset();

			this.change = false;
		}
	};


/***/ },

/***/ 603:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'selectionChanged $this': '_selectionChanged'
		},

		_selectionChanged: function($ev, selection) {
			this.$events.trigger('invoicesChanged', selection);

			selection = selection.map(function(value) {
				var invoiceData = value.split(';');
				var accountId = invoiceData[0];
				var invoiceId = invoiceData[1];

				return accountId + ',' + invoiceId;
			});

			this._updateDownload(selection);
		},

		_updateDownload: function(selection) {
			var length;
			var enable;

			if (!this.$components.downloadDropdown) {
				return;
			}

			length = selection.length;
			enable = length !== 0 && length <= this.$options.maxDownloads;

			this.$components.downloadDropdown.$extensions['invoices/download-dropdown'].updateCount(length);
			this.$components.downloadDropdown.$extensions['invoices/download-dropdown'].updateInputs(selection.join(';'));

			if (enable) {
				this.$components.downloadDropdown.enable();
				this.$components.downloadDropdown.setTitle(this.$options.downloadsTitle);

				return;
			}

			this.$components.downloadDropdown.disable();

			if (!length) {
				this.$components.downloadDropdown.setTitle(this.$options.noDownloadsTitle);

				return;
			}

			this.$components.downloadDropdown.setTitle(this.$options.maxDownloadsTitle);
		}
	};


/***/ },

/***/ 604:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'search $filterForm $filterSearch': '_change'
		},

		val: function() {
			return this.$components.filterForm.serialize();
		},

		_change: function() {
			this.$events.trigger('filterFor', {
				url: this.$components.filterForm.getUrl(),
				filter: this.val()
			});
		}
	};


/***/ },

/***/ 605:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'loadFor $loadMore': 'loadMore',
			'filterFor $filter': 'filter'
		},

		initialize: function() {
			this.page = 1;
		},

		ready: function() {
			this.filterVal = this.$components.filter && this.$components.filter.val();
			this.filterVal = this.filterVal || {};
		},

		loadMore: function(ev, options) {
			this.filterVal.page = ++this.page;

			this._cancelLastLoadDeferred();

			this.lastLoadDeferred = this.$components.hiddenContainer.load(options.url, this.filterVal)
				.then(function(response) {
					this.$components.container.$el.append(this.$components.hiddenContainer.$el.children());

					this.checkShowMore(response.data.hasMore);

					this.$events.trigger('contentChanged');
				}.bind(this))

				.finally(options.dfd.resolve.bind(options.dfd));
		},

		checkShowMore: function(hasMore) {
			if (!this.$components.loadMore) {
				return;
			}

			if (hasMore) {
				this.$components.loadMore.show();

				return;
			}

			this.$components.loadMore.hide();
		},

		startLoading: function(dfd) {
			this._cancelLastLoadDeferred();

			this.lastLoadDeferred = dfd;

			this.$components.errorMessage && this.$components.errorMessage.close();

			dfd
				.then(function(response) {
					if (!response.success || !response.data.html) {
						return;
					}

					this.$components.container.html(response.data.html);

					this.checkShowMore(response.data.hasMore);

					this.$events.trigger('contentChanged');
				}.bind(this))

				.catch(function(resp) {
					if (resp.statusText === 'abort') {
						return;
					}

					this.$components.errorMessage && this.$components.errorMessage.open();
				}.bind(this));

			if (this.$components.loader) {
				this.$components.loader.$el.show();
				this.$components.container.html('');

				dfd.finally(function() {
					this.$components.loader.$el.hide();

					this.$components.loadMore && this.$components.loadMore.enable();
				}.bind(this));

				this.$components.loadMore && this.$components.loadMore.disable();

				return;
			}

			this.$components.loadMore && this.$components.loadMore.startLoading(dfd);
		},

		filter: function(ev, options) {
			var isSkip = false;
			var loadDfd;

			this.filterVal = options.filter;

			this.$tools.util.each(this.$extensions, function(key, $ext) {
				isSkip = ($ext.filter && $ext.filter(ev, options)) || isSkip;
			});

			if (isSkip) {
				this._cancelLastLoadDeferred();

				return;
			}

			this.page = 1;
			loadDfd = this.$tools.data.post(options.url, options.filter);

			this.startLoading(loadDfd);
		},

		_cancelLastLoadDeferred: function() {
			if (this.lastLoadDeferred) {
				this.lastLoadDeferred.abort && this.lastLoadDeferred.abort();
			}
		}
	};


/***/ },

/***/ 606:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $loadButton': '_click'
		},

		_click: function() {
			var dfd = this.$components.loadButton.activityIndicator();

			this.$events.trigger('loadFor', {
				url: this.$options.url,
				dfd: dfd
			});

			dfd.then(function() {
				this.$components.loadButton.resetLoading();
			}.bind(this));
		},

		startLoading: function(dfd) {
			this.$components.loadButton.activityIndicator();

			dfd.finally(this.$components.loadButton.resetLoading.bind(this.$components.loadButton));
		},

		show: function() {
			this.$el.show();
		},

		hide: function() {
			this.$el.hide();
		},

		enable: function() {
			this.$components.loadButton.enable();
		},

		disable: function() {
			this.$components.loadButton.disable();
		}
	};


/***/ },

/***/ 607:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.prefilled = this.$components.container.$el.html();

			this.hadShowMore = Boolean(this.$components['list/load-more'] && this.$components['list/load-more'][0].$el.is(':visible'));

			this.firstFilter = this.$components['list/filter'] ? this.$components['list/filter'][0].val() : {};
		},

		filter: function(ev, options) {
			if (!this.$tools.helper.isObjectsEqual(this.firstFilter, options.filter)) {
				return false;
			}

			if (this.$components.errorMessage) {
				this.$components.errorMessage.$el.hide();
			}

			this.$components.container.html(this.prefilled);
			this.$events.trigger('contentChanged');

			if (this.hadShowMore) {
				this.$components['list/load-more'][0].show();

				return true;
			}

			this.$components['list/load-more'] && this.$components['list/load-more'][0].hide();

			return true;
		}
	};


/***/ },

/***/ 608:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $next': 'next',
			'click $back': 'back'
		},

		next: function() {
			var data = this.$components.hiddenForm.serialize();
			var addedAddonIds = [];

			this.$components.next.activityIndicator();

			this.$components.back.disable();

			if (this.$components.addonGroup) {
				this.$components.addonGroup.forEach(function(group) {
					if (group.$components.addonsCatalog) {
						group.$components.addonsCatalog.forEach(function(catalog) {
							addedAddonIds = addedAddonIds.concat(catalog.getIds());
						});
					}
				});
			}
			data.AddedAddonIds = addedAddonIds;

			this.flow.next(data)
				.finally(function() {
					this.$components.next.resetLoading();
					this.$components.back.enable();
				}.bind(this));
		},

		back: function() {
			this.flow.prev();
		}
	};


/***/ },

/***/ 609:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $next': 'next',
			'active $planTabs $$categories $$items': '_selectOffer',
			'datechanged $effective': '_dateChanged'
		},

		initialize: function() {
			this.penaltyRequest = null;

			this.penalty = null;

			this._effectiveHtml = this.$elements.effectiveContainer.html();
		},

		next: function() {
			var reason = this._getComponents('effective.reason')[0];
			var data;

			if (reason && !reason.valid()) {
				reason && reason.$events.trigger('focusinput');

				return;
			}

			if (!this.$components.effective.isValid()) {
				return;
			}

			this.$components.next.activityIndicator();

			data = this._getData();

			this.flow.next(data)
				.finally(this.$components.next.resetLoading.bind(this.$components.next));
		},

		_dateChanged: function() {
			this.$components.effective.startLoading();

			this._abort(this.penaltyRequest);

			this.penaltyRequest = this.$tools.data.post(this.$options.messageUrl, this._getData())
				.then(this._updatePenalty.bind(this))
				.catch(this._penaltyRequestFailed.bind(this))
				.finally(this.$components.effective.endLoading.bind(this.$components.effective));
		},

		_penaltyRequestFailed: function(request, status) {
			if (status === 'abort') {
				return;
			}

			this.$components.effective.showError();
		},

		_updatePenalty: function(data) {
			var reason = this._getComponents('effective.reason')[0];
			this.$components.effective.changeMessage(data);
			this.penalty = data.success ? data.data.penalty : 0;

			if (data.data.flowDetails) {
				this.$el.find('[name="FlowDetails"]').val(data.data.flowDetails);
			}

			if (reason) {
				reason.$events.trigger('penaltyChanged', this.penalty);
			}
		},

		_getComponents: function(path) {
			return path.split('.').reduce(function(parents, token) {
				if (parents.length === 0) {
					return parents;
				}

				return parents.map(function(item) {
					return item && item.$components;
				}).filter(function(item) {
					return Boolean(item);
				}).reduce(function(res, parent) {
					parent = parent[token] instanceof Array ? parent[token] : [parent[token]];

					return res.concat(parent);
				}, []);
			}, [this]).filter(function(item) {
				return Boolean(item);
			});
		},

		_getData: function() {
			var data = this.$components.offerForm.serialize();
			var effectiveData = this.$components.effective.getData();
			var reason = this._getComponents('effective.reason')[0];
			var reasonData = {};

			if (reason) {
				reasonData = reason.serialize();
			}

			data.CalculatedPenalty = this.penalty || 0;

			if (!this.selectedOfferId) {
				this.selectedOfferId = this._getOfferId();
			}
			data.SelectedOfferId = this.selectedOfferId;

			return this.$tools.util.extend({}, data, effectiveData, reasonData);
		},

		_getOfferId: function() {
			return this._getItems().filter(function(item) {
				return item.isActive();
			})[0].getItemId();
		},

		_getItems: function() {
			return this._getComponents('planTabs.categories.items');
		},

		_selectOffer: function(event, item) {
			var items = this._getItems();
			this.selectedOfferId = null;

			items.forEach(function(item) {
				item.deactivate();
			});

			item.activate();

			this.$components.next.enable();

			this.html(this._effectiveHtml, this.$elements.effectiveContainer)
				.then(function() {
					this.$components.effective.showBlock();
					this._dateChanged();
					item.deactivate();
				}.bind(this));
		},

		_abort: function(request) {
			request && request.abort && request.abort();
		}
	};


/***/ },

/***/ 610:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $reasonCode': '_codeChange',
			'focusinput $this': '_focusInput',
			'penaltyChanged $this': '_updatePenalty'
		},

		ready: function() {
			this._codeChange();
		},

		_updatePenalty: function($ev, penalty) {
			var validator = this.$el.data('validator');
			var reasonInputName = this.$elements.penaltyReasonCode.prop('name');
			var rule = validator.settings.rules[reasonInputName];

			if (rule) {
				rule.range[1] = penalty;
			}

			this._togglePenaltyBlock(penalty !== 0);
		},

		_focusInput: function() {
			this.$elements.penaltyReasonCode.focus();
		},

		_codeChange: function() {
			var hasPenalty = this.$components.reasonCode.getValue() !== '';

			this._togglePenaltyBlock(hasPenalty);
		},

		_togglePenaltyBlock: function(visible) {
			this.$elements.penalty.toggle(visible);

			if (!visible) {
				this.$elements.penaltyReasonCode.val(0);
			}
		}
	};


/***/ },

/***/ 611:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $back': 'back',
			'click $next': 'next',
			'changed $accept': '_checkNext',
			'changed $read': '_checkNext'
		},

		back: function() {
			this.flow.prev();
		},

		next: function() {
			this.$components.back.disable();
			this.$components.next.activityIndicator();
		},

		_isChecked: function(checkbox) {
			return !checkbox || checkbox.isChecked();
		},

		_checkNext: function() {
			if (this._isChecked(this.$components.read) && this._isChecked(this.$components.accept)) {
				this.$components.next.enable();

				return;
			}

			this.$components.next.disable();
		}
	};


/***/ },

/***/ 612:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new Flow.FlowController(new Flow.WizardFlowPresenter(this), {
				config: {
					statik: true,
					index: 0,
					infer: function(payload) {
						return this.$tools.data.post(this.$options.addonsUrl, payload)
							.then(function(response) {
								if (response.data.skip || !response.data.html.replace(/\s/g, '')) {
									return {
										next: 'confirm',
										payload: payload
									};
								}

								return {
									next: 'addonsBlock',
									payload: {
										html: response.data.html
									}
								};
							});
					}.bind(this)
				},

				addonsBlock: {
					index: 1,
					componentContentURL: this.$options.addonsUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'confirm',
							payload: data
						};
					}
				},

				confirm: {
					index: 2,
					componentContentURL: this.$options.confirmUrl,
					statik: false,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				}
			}, this.$events);
		},

		ready: function() {
			this.flow.startWith('config');
		}
	};


/***/ },

/***/ 613:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var scrollTo = __webpack_require__(555);

	module.exports = {
		initialize: function() {
			this.$tools.dom.find(window).one('scroll', this.scrollTop.bind(this));
		},

		events: {
			'rowSelected $orders': 'onRowSelection'
		},

		scrollTop: function() {
			this.$tools.dom.find(window).scrollTop(0);
		},

		onRowSelection: function(eventName, tableEvent) {
			tableEvent.preventDefault();
			this.loadOrderSummary(tableEvent.action);
		},

		loadOrderSummary: function(url) {
			this.$components.orders.$components.loader.$el.show();
			this.$components.errorMessage.close();

			return this.load(url, this.$elements.orderSummary)
				.then(this.scrollToDetail.bind(this))
				.catch(this._showLoadingError.bind(this))
				.finally(this.hideLoader.bind(this));
		},

		hideLoader: function() {
			this.$components.orders.$components.loader.$el.hide();
		},

		_showLoadingError: function(response) {
			this.$elements.orderSummary.empty();
			if (response.errorMessages && response.errorMessages[0]) {
				this.$components.errorMessage.setText(response.errorMessages[0]);
				this.$components.errorMessage.open();
			}
		},

		scrollToDetail: function() {
			var SCROLL_TO = 100;
			scrollTo.scrollTo(this.$elements.orderSummary, SCROLL_TO);
		}
	};


/***/ },

/***/ 614:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'focus [data-selector=loginEmail]': '_onLoginEmailFocus'
		},

		_onLoginEmailFocus: function() {
			this.$el.find('[data-selector=useAsContactEmail]').removeClass('js-hidden');
		}
	};


/***/ },

/***/ 615:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Marketing Permissions
	type: controller
	desc: Handles Media Channels block on Profile page in Permissions section
	*/
	module.exports = {
		events: {
			'submit $detailsForm': '_saveDetails',
			'reset $detailsForm': '_cancelEditing'
		},

		ready: function() {
			this._detailsForm = this.$components.detailsForm;
			this._saveButton = this._detailsForm.$components.save;

			this._successMessage = this._detailsForm.$components.successMessage;
			this._errorMessage = this._detailsForm.$components.errorMessage;
		},

		/**
		  desc: Sets data required for correct submitting form to the server
		 */
		setExtraData: function(data) {
			this._extraData = data;
		},

		/**
		 decs: Hides all messages in the form
		 */
		hideMessages: function() {
			this._successMessage.close();
			this._errorMessage.close();
		},

		_saveDetails: function() {
			var data = this.$tools.util.extend({}, this._detailsForm.serialize(), this._extraData);
			var url = this._detailsForm.getUrl();

			this.hideMessages();
			this._saveButton.activityIndicator();

			this.$tools.data.post(url, data)
				.then(this._onSaveSuccess.bind(this))
				.finally(this._onSaveFinish.bind(this));
		},

		_onSaveSuccess: function(response) {
			if (!response.success) {
				this._onSaveError();

				return;
			}

			this._successMessage.open();

			this._detailsForm.$components.select.forEach(function(select) {
				select.saveCurrentValue();
			});
		},

		_onSaveError: function() {
			this._errorMessage.open();
		},

		_onSaveFinish: function() {
			this._saveButton.resetLoading();
		},

		_cancelEditing: function() {
			this.hideMessages();

			this._detailsForm.$components.select.forEach(function(select) {
				select.resetSelect();
			});
		}
	};


/***/ },

/***/ 616:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Permissions Switcher
	type: controller
	desc: Handles each Permission on Profile page in Permissions section
	options:
		id: PermissionId to be sent when changing the state of the switcher
		type: PermissionType to be sent when changing the state of the switcher
	 */
	module.exports = {
		events: {
			'change $$switchers': '_onChange'
		},

		ready: function() {
			this._switcher = this.$components.switchers[0];
			this._resetting = false;

			this._description = this.$elements.description.text();
			this._value = this._switcher.isChecked();

			if (this.$components.permissionContent) {
				this.$components.permissionContent.setExtraData(this._getData());
			}
		},

		_onChange: function() {
			if (this.$components.permissionContent) {
				this.$components.permissionContent.setExtraData(this._getData());
			}

			if (this._resetting) {
				this._resetting = false;

				return;
			}

			this.$components.errorMessage.close();

			this._switcher.activityIndicator();

			this.$tools.data.post(this._switcher.$options.url, this._getData())
				.then(this._onSaveSuccess.bind(this))
				.catch(this._onSaveError.bind(this))
				.finally(this._onSaveFinish.bind(this));
		},

		_onSaveSuccess: function(response) {
			if (!response.success) {
				this._onSaveError(response);

				return;
			}

			this._value = !this._value;
		},

		_onSaveError: function() {
			// to avoid unnecessary request to the server when reverting value
			this._resetting = true;

			this._switcher.setValue(this._value);

			this.$components.errorMessage.open();
		},

		_onSaveFinish: function() {
			this._switcher.resetLoading();
		},

		_getData: function() {
			return {
				PermissionId: this.$options.id,
				PermissionType: this.$options.type,
				Toggle: this._switcher.isChecked(),
				Description: this._description
			};
		}
	};


/***/ },

/***/ 617:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		hiddenIframe: 'email-iframe--hidden'
	};

	module.exports = {
		events: {
			'loaded $emailIframe': '_iframeLoaded'
		},

		_iframeLoaded: function() {
			this.$components.emailIframe.$el.removeClass(CLASSES.hiddenIframe);
		}
	};


/***/ },

/***/ 618:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var SELECTORS = {
		checked: ':checked',
		timeSlotsContainer: '#rebook-time-slots'
	};

	var TEMPLATES = {
		loader: __webpack_require__(619)
	};

	module.exports = {
		initialize: function() {
			this.config = this.$tools.globalConfigs('TN.config.rebook.config', {});

			this.dates = {};

			if (this.config.timeslots) {
				this.config.timeslots.forEach(function(item) {
					this.dates[item.date] = item.timeSlots;
				}.bind(this));
			}
		},

		ready: function() {
			if (this.$components.slotsForm) {
				this._update();
			}
		},

		events: {
			'click $submit': '_submitClick',
			'change $slotsForm $$datepickers': '_changeDate',
			'changed $slotsForm $times': '_timesChanged'
		},

		_update: function() {
			if (this.$options.dateOnly) {
				this._changeDate();

				return;
			}

			this._initTimes();
		},

		_submitClick: function() {
			var data;

			if (!this.$components.slotsForm.valid()) {
				return;
			}

			this.$components.submit.activityIndicator();

			data = this.$components.slotsForm.serialize();

			if (this.$components.slotsForm.$components.times) {
				this.$components.slotsForm.$components.times.forEach(function(time) {
					time.disable();
				});
			}

			this.flow.next(data)
				.catch(this._confirmFailed.bind(this))
				.finally(this._confirmLoaded.bind(this));

			this.$components.slotsForm.$components.errorMessage && this.$components.slotsForm.$components.errorMessage.close();
		},

		_confirmFailed: function() {
			this.$components.errorMessage && this.$components.errorMessage.open();
		},

		_confirmLoaded: function() {
			this.$components.submit.resetLoading();

			if (this.$components.slotsForm.$components.times) {
				this.$components.slotsForm.$components.times.forEach(function(time) {
					time.enable();
				});
			}
		},

		_initTimes: function() {
			if (!this.$components.slotsForm.$components.times) {
				return;
			}

			this._timesChanged();
		},

		_changeDate: function() {
			var date = this.$components.slotsForm.serialize().date;

			if (this.$options.dateOnly) {
				if (!date.length) {
					this.$components.submit.disable();

					return;
				}

				this.$components.submit.enable();

				return;
			}

			if (typeof this.dates[date] === 'undefined') {
				if (this.$components.slotsForm.$components.noDate) {
					this.$components.slotsForm.$components.noDate.open();
				}

				this.$el.find(SELECTORS.timeSlotsContainer).empty();

				return;
			}

			if (this.$components.slotsForm.$components.noDate) {
				this.$components.slotsForm.$components.noDate.close();
			}

			this.html(TEMPLATES.loader, SELECTORS.timeSlotsContainer)
				.then(this._loadTimes.bind(this, date))
				.catch(this._updateTimesFailed.bind(this));
		},

		_loadTimes: function(date) {
			this.load(this.config.getTimeSlots, SELECTORS.timeSlotsContainer, this.dates[date])
				.then(this._updateTimes.bind(this))
				.catch(this._updateTimesFailed.bind(this))
				.finally(this._update.bind(this));
		},

		_updateTimes: function() {
			this.$components.slotsForm.$components.errorMessage && this.$components.slotsForm.$components.errorMessage.close();
			this.$el.find(SELECTORS.timeSlotsContainer).hide().slideDown();
		},

		_updateTimesFailed: function() {
			this.$components.slotsForm.$components.errorMessage && this.$components.slotsForm.$components.errorMessage.open();
		},

		_getCheckedTime: function() {
			return this.$components.slotsForm.$components.times.filter(function(time) {
				return time.isChecked();
			});
		},

		_timesChanged: function() {
			if (this.$options.gds || this._getCheckedTime().length) {
				this.$components.submit.enable();

				return;
			}

			this.$components.submit.disable();
		}
	};


/***/ },

/***/ 619:
/***/ function(module, exports) {

	module.exports = "<div class=\"load-tester\" style=\"width: 100%;\">\n  <span class=\"spinner\"></span>\n</div>"

/***/ },

/***/ 620:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'checked $accept': '_enableSubmit',
			'unchecked $accept': '_disableSubmit',
			'click $submit': '_submit',
			'click $cancel': '_cancel'
		},

		_enableSubmit: function() {
			this.$components.submit.enable();
		},

		_disableSubmit: function() {
			this.$components.submit.disable();
		},

		_submit: function() {
			this.$components.submit.activityIndicator();
		},

		_cancel: function() {
			this.flow.prev();
		}
	};


/***/ },

/***/ 621:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new flow.FlowController(new flow.WizardFlowPresenter(this), {
				config: {
					componentContentURL: this.$tools.globalConfigs('TN.config.rebook.services.config', ''),
					statik: true,
					index: 0,
					infer: function(data) {
						return {
							next: 'confirm',
							payload: data
						};
					}
				},
				confirm: {
					index: 1,
					componentContentURL: this.$tools.globalConfigs('TN.config.rebook.services.confirm', ''),
					statik: false,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				}
			}, this.$events);
		},
		ready: function() {
			this.flow.startWith('config');
		}
	};


/***/ },

/***/ 622:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		items: '[data-selector=items]',
		input: '[data-selector=input]',
		label: '[data-selector=label]'
	};

	module.exports = {
		events: {
			'contentChanged $mainList': '_contentChanged'
		},

		initialize: function() {
			this._clickHandler = this._itemClick.bind(this);

			this._initEvents();
		},

		/**
			desc: Returns selected value
			*/
		value: function() {
			return this.$el.find(SELECTORS.input).val();
		},

		/**
			desc: Returns name of hidden input
			*/
		name: function() {
			return this.$el.find(SELECTORS.input).prop('name');
		},

		_initEvents: function() {
			this.$el.find(SELECTORS.items)
				.off('click', this._clickHandler)
				.on('click', this._clickHandler);
		},

		_contentChanged: function() {
			this._initEvents();

			this._updateItems();

			this.$events.trigger('newItemsAdded');
		},

		_itemClick: function($ev) {
			var target = $ev.currentTarget;
			var text = target.getAttribute('data-text');
			var value = target.getAttribute('data-value');

			this.$options.selectedValue = value;

			this._updateItems();

			this.$el.find(SELECTORS.label).text(text);
			this.$el.find(SELECTORS.input).val(value);
			this.$el.prop('title', text);

			this.$events.trigger('changed');
		},

		_updateItems: function() {
			this.show(SELECTORS.items);
			this.hide(SELECTORS.items + '[data-value="' + this.$options.selectedValue + '"]');
		}
	};


/***/ },

/***/ 623:
/***/ function(module, exports) {

	'use strict';

	/**
		name: MS Office activation page
		type: controller
		desc: Activate ms office subscription for user
	 */

	var SELECTORS = {
		loader: '[data-selector=loader]'
	};

	module.exports = {
		events: {
			'click $submit': '_submit'
		},

		initialize: function() {
			this._resolved = false;
		},

		_submit: function() {
			if (this._resolved) {
				return;
			}

			this.$components.submit.disable();

			this.show(SELECTORS.loader);

			this._ping();
		},

		_ping: function() {
			this.$tools.data.post(this.$options.url)
				.then(this._analyzePing.bind(this))
				.catch(this._pingFailed.bind(this, this.$options.failedText));
		},

		_analyzePing: function(data) {
			var MILLISECONDS = 1000;
			if (!data.success) {
				this._pingFailed(data.errorMessages[0]);

				return;
			}

			if (data.data.url) {
				this._pingSuccess(data.data.url);

				return;
			}

			setTimeout(this._ping.bind(this), data.data.timing * MILLISECONDS);
		},

		_pingSuccess: function(url) {
			this.$components.submit.enable();
			this.$components.submit.$el.prop('href', url);
			this.$components.successMessage.open();
			this._resolved = true;

			this.hide(SELECTORS.loader);
		},

		_pingFailed: function(text) {
			this.$components.errorMessage.setText(text);
			this.$components.errorMessage.open();
			this.hide(SELECTORS.loader);
		}
	};


/***/ },

/***/ 624:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $$switchers': '_switcherChanged'
		},

		_switcherChanged: function($ev) {
			var data = this.$components.hiddenForm.serialize();
			var component = $ev.data.component;
			var dfd = component.activityIndicator();
			var checked = component.isChecked();

			if (component.$options.requested) {
				component.$options.requested = false;
				return;
			}

			this._hideErrorMessage();

			this.$components.switchers.forEach(function(switcher) {
				// needs to determine was this switcher enabled or disabled
				switcher.$options.prevEnableState = switcher.isEnabled();

				if (switcher === component) {
					return;
				}

				switcher.disable();
			});

			dfd.catch(function() {
				this.setValue(!checked);
				this.resetLoading();
			}.bind(component));

			this.$tools.data.post(component.$options.url, data)
				.then(this._srartPing.bind(this, dfd))
				.catch(function() {
					this._showErrorMessage();
					this._returnSwitchersState();
					dfd.reject();
				}.bind(this));
		},

		_srartPing: function(dfd, data) {
			if (!data.success) {
				this._showErrorMessage();
				this._returnSwitchersState();
				dfd.reject();

				return;
			}

			this._ping(data.data.url, dfd);
		},

		_ping: function(url, dfd, data) {
			/* first request */
			if (!data) {
				this._doPingRequest(url, dfd);

				return;
			}

			if (!data.success) {
				dfd.reject();
				this._showErrorMessage();
				this._returnSwitchersState();

				return;
			}

			if (!data.data) {
				this._doPingRequest(url, dfd);

				return;
			}

			this._update(data.data);
			dfd.resolve();
		},

		_doPingRequest: function(url, dfd) {
			this.$tools.data.get(url)
				.then(this._ping.bind(this, url, dfd))
				.catch(function() {
					this._showErrorMessage();
					this._returnSwitchersState();
					dfd.reject();
				});
		},

		_returnSwitchersState: function() {
			this.$components.switchers.forEach(function(switcher) {
				switcher.$options.requested = true;
				switcher.$options.prevEnableState ? switcher.enable() : switcher.disable();
			});
		},

		_update: function(data) {
			var switchersData = {};

			data.newValues && Object.keys(data.newValues).forEach(function(key) {
				this.$el.find('[name=' + key + ']').val(data.newValues[key]);
			}.bind(this));

			data.switchers && data.switchers.forEach(function(switcherData) {
				switchersData[switcherData.name] = {
					value: switcherData.value,
					enabled: switcherData.enable
				};
			});

			this._returnSwitchersState();

			this.$components.switchers.forEach(function(switcher) {
				var data = switchersData[switcher.getName()];

				if (!data) {
					return;
				}

				data.enabled ? switcher.enable() : switcher.disable();
				switcher.setValue(data.value);
			});
		},

		_showErrorMessage: function() {
			this.$components.errorMessage.open();
		},

		_hideErrorMessage: function() {
			this.$components.errorMessage.close();
		}
	};


/***/ },

/***/ 625:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var itemTemplate = __webpack_require__(626);
	var adderTemplate = __webpack_require__(627);

	module.exports = {
		ready: function() {
			this._$attachmentsList = this.$el.find('[data-selector=fileList]');
			this._appendFileAdder();
		},

		events: {
			'click [data-selector=fileDelete]': '_removeFileItem',
			'change [data-selector=newFile]': '_addFileItem'
		},

		_removeFileItem: function(event) {
			this.$el.find(event.target).closest('[data-selector=fileItem]').remove();

			this._hideMessages();
			this._appendFileAdder();
		},

		_addFileItem: function() {
			var $newFile = this.$el.find('[data-selector=newFile]');
			var file = $newFile[0].files[0];
			var extension = file.name.split('.').pop();
			var $newItem;

			this._hideMessages();

			if (file.size > this.$options.maxFileSize) {
				this._appendFileAdder();

				this.$components.messageTooLargeFile.open();

				return;
			}

			$newItem = this._appendNewItem({ type: 'attachment-' + extension, name: file.name });
			$newItem.append($newFile);
			$newFile.removeAttr('data-selector');

			this._appendFileAdder();
		},

		_appendFileAdder: function() {
			this._$fileAdder && this._$fileAdder.remove();

			if (this.$el.find('[data-selector=fileItem]').length >= this.$options.maxFilesNumber) {
				this.$components.messageTooManyFiles.open();

				return;
			}

			this._$attachmentsList.append(adderTemplate);

			this._$fileAdder = this.$el.find('[data-selector=fileAdder]');
		},

		_hideMessages: function() {
			this.$components.messageTooLargeFile.close();
			this.$components.messageTooManyFiles.close();
		},

		_appendNewItem: function(data) {
			var newItemHtml = this.$tools.template.parse(itemTemplate)(data);

			this._$attachmentsList.append(newItemHtml);

			return this._$attachmentsList.children().last();
		}
	};


/***/ },

/***/ 626:
/***/ function(module, exports) {

	module.exports = "<li class=\"attachments__item\" data-selector=\"fileItem\">\n\t<span class=\"attachments__icon attachments__icon--<%= type %>\"></span>\n\t<span class=\"attachments__label\"><%= name %></span>\n\t<span class=\"attachments__delete-item\" data-selector=\"fileDelete\"></span>\n</li>"

/***/ },

/***/ 627:
/***/ function(module, exports) {

	module.exports = "<li class=\"float--left\" data-selector=\"fileAdder\">\n\t<label class=\"attachments__add-item\">\n\t\t<input type=\"file\" name=\"attachments\" class=\"js-hidden\" data-selector=\"newFile\">\n\t</label>\n</li>"

/***/ },

/***/ 628:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		choice: '[data-selector="choice"]'
	};

	module.exports = {
		events: {
			'change [data-selector=choice]': '_onChange'
		},

		ready: function() {
			this._choices = this.$el.find(SELECTORS.choice).get();
			this._selection = this._getSelectedChoice();
			this._value = this._selection ? this._selection.value : '';
		},

		_onChange: function(event) {
			this._selection = event.target;
			this._value = this._selection.value;
			this.$events.trigger('change', event.target.value);
		},

		getValue: function() {
			return this._value || '';
		},

		getCustomAttribute: function(attr){
			return this._selection && this._selection.getAttribute(attr);
		},

		_getSelectedChoice: function() {
			return this._choices.filter(function(choice) {
				return choice.checked;
			})[0] || null;
		}
	};


/***/ },

/***/ 629:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $backToList': '_onBackToListClick',
			'click [data-selector=categoryTitle]': '_onTitleClick',
			'change [data-selector=subCategory]': '_onSubcategoryChange'
		},

		ready: function() {
			var subCategories = this.$el[0].querySelectorAll('[data-selector=subCategory]');

			this._subCategories = [].slice.call(subCategories);
			this._category = this.$el[0].querySelector('[data-selector=category]');
		},

		clearSelection: function() {
			this._subCategories.forEach(function(subCategory) {
				subCategory.checked = false;
			});

			this._setSelected(false);
		},

		isSelected: function() {
			return this._category.checked;
		},

		_onTitleClick: function(event) {
			event.preventDefault();

			if (!this._subCategories.length) {
				this._setSelected(!this.isSelected());

				return;
			}

			if (this.$el.hasClass('active')) {
				return;
			}

			this._updateSelectedState();

			this.$el.addClass('active');
			this.$events.trigger('open');
		},

		_onBackToListClick: function() {
			this.$el.removeClass('active');
			this.$events.trigger('close');
		},

		_onSubcategoryChange: function() {
			this._updateSelectedState();
		},

		_updateSelectedState: function() {
			var subcategoryIsChecked = this._subCategories.some(function(subCategory) {
				return subCategory.checked;
			});

			this._setSelected(subcategoryIsChecked);
		},

		_setSelected: function(value) {
			this._category.checked = value;

			this.$events.trigger('change');
		}
	};


/***/ },

/***/ 630:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		requestType: '[data-selector=requestTypeValue]',
		productCategory: '[data-selector=productCategoryValue]',
		customerIdType: '[data-selector="customerIdType"]'
	};

	module.exports = {
		submit: function(data, submitAI){
			var form = this.$components.ticketForm;

			this._setCommonFields(data);
			this.submitAI = submitAI;

			form.submit();
		},

		canProceed: function(){
			return this.$components.ticketForm.valid();
		},

		isSubmitted: function(){
			return this._submittedState;
		},

		_setCommonFields: function(data) {
			this.$el.find(SELECTORS.requestType).val(data.requestType);
			this.$el.find(SELECTORS.productCategory).val(data.productCategory);
			this.$el.find(SELECTORS.customerIdType).val(data.customerIdType);
		}
	};


/***/ },

/***/ 631:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var scrollTo = __webpack_require__(555);

	var SELECTORS = {
		formContainer: '[data-selector=ticketFormContainer]',
		questionMsg: '[data-selector=office365TechQuestionMessage]',
		mobileQuestionMsg: '[data-selector=mobileOffice365QuestionMessage]',
		feeds: '[data-selector="feed"]',
		feedTypes: '[data-selector="feedType"]'
	};

	var ATTRIBUTES = {
		idType: 'data-customeridtype'
	};

	var CLASSES = {
		hidden: 'js-hidden'
	};

	module.exports = {
		events: {
			'click $submitButton': '_onTicketFormSubmit',
			'change $productCategory': '_onProductCategoryChange',
			'change [data-selector="feedType"]': '_onMemberTypeChange',
			'change $requestType': '_onChoiceChange'
		},

		ready: function() {
			this._$feedTypes = this.$el.find(SELECTORS.feedTypes);
			this._$feeds = this.$el.find(SELECTORS.feeds);
			this.activeFeed = this.$components[this._$feedTypes.filter(':checked').val()];
			this.submitButton = this.$components.submitButton;
			this._errorMessage = this.$components.typeNotSelectedMessage;

			this._toggleFeeds();
		},

		_getCommonData: function(){
			return {
				requestType: this.$components.requestType.getValue(),
				productCategory: this.$components.productCategory.getValue(),
				customerIdType: this.$components.productCategory.getCustomAttribute(ATTRIBUTES.idType)
			};
		},

		_onProductCategoryChange: function(event, value) {
			this._toggleVisibleBlocks(value);
			this._onChoiceChange();
		},

		_onChoiceChange: function(){
			if(this._areRequiredFieldsSelected()){
				this.activeFeed.$events.trigger('onChoiceChange', this._getCommonData());
				this._hideRequiredFieldsErrorMessage();
			}
		},

		_onTicketFormSubmit: function() {
			var ai;
			if (!this._areRequiredFieldsSelected()) {
				this._showRequiredFieldsErrorMessage();

				return;
			}

			if(!this.activeFeed.canProceed()){
				return;
			}

			ai = this.submitButton.activityIndicator();
			this.activeFeed.submit(this._getCommonData(), ai);
		},

		_areRequiredFieldsSelected: function() {
			var commonData = this._getCommonData();
			return Boolean( commonData.requestType && commonData.productCategory );
		},

		_showRequiredFieldsErrorMessage: function() {
			var SCROLL_TO = 200;
			this._errorMessage.open();
			scrollTo.scrollTo(this._errorMessage.$el, SCROLL_TO);
		},

		_hideRequiredFieldsErrorMessage: function() {
			this._errorMessage.close();
		},

		_onMemberTypeChange: function(event){
			this.activeFeed = this.$components[event.target.value];
			this._toggleFeeds();
			this._onChoiceChange();
		},

		_toggleFeeds: function(){
			this._$feeds.addClass(CLASSES.hidden);
			this.activeFeed.$el.removeClass(CLASSES.hidden);
			this.activeFeed.isSubmitted() ? this.submitButton.activityIndicator().resolve() : this.submitButton.resetLoading();
		},

		_toggleVisibleBlocks: function(value) {
			this.toggle(SELECTORS.questionMsg, value === this.$options.techQuestionCategory);
			this.toggle(SELECTORS.mobileQuestionMsg, value === this.$options.mobileQuestionCategory);
			this.toggle(SELECTORS.formContainer, value !== this.$options.techQuestionCategory);
		}
	};


/***/ },

/***/ 632:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $stepForm $nextButton': '_onStepFormSubmit',
			'click $stepForm $backButton': '_goBack'
		},

		ready: function() {
		},

		_goBack: function() {
			this.flow.prev();
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;
			var serialize = {};
			//this.$components.errorMessage.close();
			this.$components.stepForm.$components.nextButton.activityIndicator();

			form.$el.serializeArray().forEach(function(item) {
				var field = item.name;
				var value = item.value || '';

				if (!(field in serialize)) {
					serialize[field] = value;
				}
			});

			this.$tools.data.post(form.getUrl(), serialize)
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function() {
			//this.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.nextButton.resetLoading();
		}
	};


/***/ },

/***/ 633:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $confirmationForm $nextButton': '_onConfirmationFormSubmit',
			'click $confirmationForm $backButton': '_goBack',
			'click $confirmationForm $onlyBackButton': '_goBack'
		},

		_onConfirmationFormSubmit: function() {
			var form = this.$components.confirmationForm;

			this.$components.confirmationForm.$components.nextButton.activityIndicator();

			this.$tools.data.ajax({
				type: 'POST',
				url: form.getUrl(),
				contentType: false, // forcing jQuery not to add a Content-Type header for you
				processData: false, // otherwise, jQuery will try to convert your FormData into a string
				data: new FormData(form.$el[0])
			})
				.then(this._onSubmitRequestSuccess.bind(this))
				.catch(this._onSubmitRequestError.bind(this))
				.finally(this._onSubmitRequestFinished.bind(this));
		},

		_onSubmitRequestSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onSubmitRequestError(response);
			}
		},

		_onSubmitRequestError: function() {

		},

		_onSubmitRequestFinished: function() {
			this.$components.confirmationForm.$components.nextButton.resetLoading();
		},

		_goBack: function() {
			this.flow.reset('searchDevice');
		}
	};


/***/ },

/***/ 634:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $stepForm $nextButton': '_onStepFormSubmit',
			'click $stepForm $backButton': '_goBack'
		},

		_goBack: function() {
			this.flow.prev();
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;

			if (!form.valid()) {
				return;
			}

				//this.$components.errorMessage.close();
			this.$components.stepForm.$components.nextButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function() {
			//this.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.nextButton.resetLoading();
		}
	};


/***/ },

/***/ 635:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		costLimitValue: '[data-selector=costLimitValue]',
		paidRepair: '[data-selector=paidRepair]',
		paidRepairBlock: '[data-selector=paidRepairBlock]',
		notPaidRepairBlock: '[data-selector=notPaidRepairBlock]'
	};

	module.exports = {
		events: {
			'click $stepForm $nextButton': '_onStepFormSubmit',
			'click $stepForm $backButton': '_goBack',
			'change [data-selector=paymentType]': '_onPaymentTypeChange',
			'change $stepForm $range': '_onCostLimitChange'
		},

		ready: function() {
			this.tooltip = this.$components.stepForm.$components.range.$components.to.$components.tooltip[0];
			this._costLimitValueElement = this.$el.find(SELECTORS.costLimitValue);
			this._paidRepairElement = this.$el.find(SELECTORS.paidRepair);
		},

		_goBack: function() {
			this.flow.prev();
		},

		_onPaymentTypeChange: function() {
			var isRepairPaid = this._paidRepairElement[0].checked;

			this.toggle(SELECTORS.paidRepairBlock, isRepairPaid);
			this.toggle(SELECTORS.notPaidRepairBlock, !isRepairPaid);
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;

			//this.$components.errorMessage.close();
			this.$components.stepForm.$components.nextButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function() {
			//this.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.nextButton.resetLoading();
		},

		_onCostLimitChange: function(event) {
			this._costLimitValueElement.html(event.data.component.$components.toSelect.$extensions.select.getCurrentText());
			this.tooltip.text(event.data.component.$components.toSelect.$extensions.select.getCurrentText());

		}
	};


/***/ },

/***/ 636:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $stepForm $nextButton': '_onStepFormSubmit',
			'click $stepForm $backButton': '_goBack',
			'click $stepForm $clearSelectionButton': '_clearSelection',
			'change $stepForm $$categories': '_onFaultCategoryChange',
			'open $stepForm $$categories': '_onFaultCategoryListOpen',
			'close $stepForm $$categories': '_onFaultCategoryListClose'
		},

		ready: function() {
			this._$serviceList = this.$el.find('[data-selector=serviceList]');
		},

		_goBack: function() {
			this.flow.reset('searchDevice');
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;
			var formData = this._serializeFormAndKeepPrefix(form.$el);
			var isCategorySelected = this.$components.stepForm.$components.categories.some(function(category) {
				return category.isSelected();
			});

			if (!isCategorySelected) {
				this.$components.errorMessage.open();

				return;
			}

			this.$components.errorMessage.close();

			form.$components.nextButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), formData)
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_clearSelection: function() {
			this.$components.stepForm.$components.categories.forEach(function(category) {
				category.clearSelection();
			});
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function() {
			this.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.nextButton.resetLoading();
		},

		_onFaultCategoryChange: function() {
			this.$components.errorMessage.close();
		},

		_onFaultCategoryListOpen: function() {
			this._$serviceList.addClass('active');
		},

		_onFaultCategoryListClose: function() {
			this._$serviceList.removeClass('active');
		},

		// ToDo: this method is copied from `form.serialize` but keeps prefix `prefix.`
		_serializeFormAndKeepPrefix: function(formEl) {
			var obj = {};
			var item;
			var serializedArray = formEl.serializeArray();
			var index;

			for(index in serializedArray) {
				item = serializedArray[index];

				if (obj[item.name] !== undefined) {
					if (!obj[item.name].push) {
						obj[item.name] = [obj[item.name]];
					}

					obj[item.name].push(item.value || '');
				} else {
					obj[item.name] = item.value || '';
				}
			}

			return obj;
		}
	};


/***/ },

/***/ 637:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new Flow.FlowController(new Flow.WizardFlowPresenter(this), {
				searchDevice: {
					statik: true,
					index: 0,
					infer: function(data) {
						return {
							next: 'confirmDevice',
							payload: data
						};
					}
				},
				confirmDevice: {
					index: 0,
					componentContentURL: this.$options.deviceSelectedUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'lockCode',
							payload: data
						};
					}
				},
				lockCode: {
					index: 0,
					componentContentURL: this.$options.lockCodeUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'faultDescription',
							payload: data
						};
					}
				},
				faultDescription: {
					index: 1,
					componentContentURL: this.$options.faultDescUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'costLimit',
							payload: data
						};
					}
				},
				costLimit: {
					index: 2,
					componentContentURL: this.$options.costLimitUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'accessories',
							payload: data
						};
					}
				},
				accessories: {
					index: 3,
					componentContentURL: this.$options.accessoriesUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'loanPhone',
							payload: data
						};
					}
				},
				loanPhone: {
					index: 4,
					componentContentURL: this.$options.loanPhoneUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'contacts',
							payload: data
						};
					}
				},
				contacts: {
					index: 5,
					componentContentURL: this.$options.contactsUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'summary',
							payload: data
						};
					}
				},
				summary: {
					index: 6,
					componentContentURL: this.$options.summaryUrl,
					statik: false,
					infer: function(data) {
						return {
							next: 'finish',
							payload: data
						};
					}
				}
			}, this.$events);
		},

		ready: function() {
			this.flow.startWith('searchDevice');
		}
	};


/***/ },

/***/ 638:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $stepForm $nextButton': '_onStepFormSubmit',
			'click $stepForm $backButton': '_goBack',
			'change [data-selector=loanPhoneOptions]': '_onLoanPhoneStatusChange'
		},

		ready: function() {
			this._needLoanPhoneElement = this.$el.find('[data-selector=needLoanPhone]');
			this._loanPhoneBlock = this.$el.find('[data-selector=loanPhoneBlock]');
			this._loanDeviceNumberField = this.$el[0].querySelector('[data-selector=loanDeviceNumber]');
		},

		_goBack: function() {
			this.flow.prev();
		},

		_onLoanPhoneStatusChange: function() {
			this.$components.stepForm.$components.errorMessage.close();

			if (this._needLoanPhoneElement.prop('checked')) {
				this.show('[data-selector=loanPhoneBlock]');
				this._loanPhoneBlock.find('input, textarea, button, select').prop('disabled', false);
				this._loanDeviceNumberField.focus();
			} else {
				this.hide('[data-selector=loanPhoneBlock]');
				this._loanPhoneBlock.find('input, textarea, button, select').prop('disabled', true);
			}
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;

			if (!form.valid()) {
				return;
			}

			//this.$components.errorMessage.close();
			this.$components.stepForm.$components.nextButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function(response) {
			this.$components.stepForm.$components.errorMessage.setText(response.errorMessages[0]);
			this.$components.stepForm.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.nextButton.resetLoading();
		}
	};


/***/ },

/***/ 639:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $continueButton': '_onContinueClick',
			'change [data-selector=lockCodeFlag]': '_onLockCodeFlagChange',
			'input [data-selector=lockCodeField]': '_onLockCodeFieldChange',
			'submit $stepForm': '_onStepFormSubmit'
		},

		ready: function() {
			this._lockCodeFlag = this.$el.find('[data-selector=lockCodeFlag]')[0];
			this._lockCodeField = this.$el.find('[data-selector=lockCodeField]')[0];
		},

		_onContinueClick: function() {
			this.$el.find('[data-selector=iphoneBlock]').addClass('js-hidden');
			this.$el.find('[data-selector=mainBlock]').removeClass('js-hidden');
		},

		_onLockCodeFlagChange: function() {
			this.$components.errorMessage.close();

			if (this._lockCodeFlag.checked) {
				this._lockCodeField.value = '';
				this._lockCodeField.disabled = true;
			} else {
				this._lockCodeField.disabled = false;
			}
		},

		_onLockCodeFieldChange: function() {
			this.$components.errorMessage.close();
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;

			if (!this._lockCodeFlag.checked && !this._lockCodeField.value) {
				this.$components.errorMessage.open();

				return;
			}

			this.$components.errorMessage.close();
			this.$components.stepForm.$components.submitButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function(response) {
			this.$components.errorMessage.setText(response.errorMessages && response.errorMessages[0]);
			this.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.submitButton.resetLoading();
		}
	};


/***/ },

/***/ 640:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $searchForm': '_onSearchFormSubmit',
			'activate $this': '_onStepActivation'
		},

		ready: function() {
			this._deviceNumberField = this.$el[0].querySelector('[data-selector=deviceNumber]');
		},

		_onStepActivation: function() {
			this._deviceNumberField.focus();
		},

		_onSearchFormSubmit: function() {
			var form = this.$components.searchForm;

			this.$components.errorMessage.close();
			this.$components.searchForm.$components.submitButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onSubmitRequestSuccess.bind(this))
				.catch(this._onSubmitRequestError.bind(this))
				.finally(this._onSubmitRequestFinished.bind(this));
		},

		_onSubmitRequestSuccess: function(response) {
			if (response.success) {
				this._deviceNumberField.value = '';
				this.flow.next(response.data.nextStepOptions);
			} else {
				this._onSubmitRequestError(response);
			}
		},

		_onSubmitRequestError: function(response) {
			this.$components.errorMessage.setText(response.errorMessages && response.errorMessages[0]);
			this.$components.errorMessage.open();
		},

		_onSubmitRequestFinished: function() {
			this.$components.searchForm.$components.submitButton.resetLoading();
		}
	};


/***/ },

/***/ 641:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $stepForm $nextButton': '_onStepFormSubmit',
			'click $stepForm $backButton': '_goBack'
		},

		ready: function() {
		},

		_goBack: function() {
			this.flow.prev();
		},

		_onStepFormSubmit: function() {
			var form = this.$components.stepForm;

			//this.$components.errorMessage.close();
			this.$components.stepForm.$components.nextButton.activityIndicator();

			this.$tools.data.post(form.getUrl(), form.serialize())
				.then(this._onFormSubmitSuccess.bind(this))
				.catch(this._onFormSubmitError.bind(this))
				.finally(this._onFormSubmitFinished.bind(this));
		},

		_onFormSubmitSuccess: function(response) {
			if (response.success) {
				this.$tools.util.redirect(response.data.redirectUrl);
			} else {
				this._onFormSubmitError(response);
			}
		},

		_onFormSubmitError: function() {
			//this.$components.errorMessage.open();
		},

		_onFormSubmitFinished: function() {
			this.$components.stepForm.$components.nextButton.resetLoading();
		}
	};


/***/ },

/***/ 642:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'changed $inputsForm $$inputs': '_onChange',
			'changed $subscriptionDropdown': '_onChange',
			'change $inputsForm $$datepicker': '_onChange'
		},

		serialize: function() {
			var data = this.$components.inputsForm.serialize();

			if (this.$components.subscriptionDropdown) {
				data[this.$components.subscriptionDropdown.name()] = this.$components.subscriptionDropdown.value();
			}

			return data;
		},

		_onChange: function() {
			this.$events.trigger('change');
		}
	};


/***/ },

/***/ 643:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $createIndependentCommentForm': '_onSubmit',
			'reset $createIndependentCommentForm': '_onReset'
		},
		_onSubmit: function() {
			var dfd;
			if(!this.$components.createIndependentCommentForm.valid()) {
				return false;
			}
			dfd = this.$components.createIndependentCommentForm.$components.submit.activityIndicator();
			this.$components.createIndependentCommentForm.submitAsync().then(function(res) {
				dfd.reject();
				if(res.success) {
					this.$tools.data.pubsub.publish('timeline.reload');
					this._onReset();
				}
			}.bind(this));
			return false;
		},

		_onReset: function() {
			this.$components.createIndependentCommentForm.reset();
			this.$events.trigger('hide');
			return false;
		}
	};


/***/ },

/***/ 644:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		noItems: '[data-selector=noItems]',
		noItemsText: '[data-selector=noItemsText]'
	};

	module.exports = {
		events: {
			'change $filters': '_filter',
			'click $showMore': '_loadMore'
		},

		initialize: function() {
			this.currentPeriod = 0;
			this.sourceEventsProcessed = 0;

			this._request = null;

			this._defaultNoItemsText = this.$el.find(SELECTORS.noItemsText).text();
		},

		ready: function() {
			this._filter()
				.then(this.$components.showMore.enable.bind(this.$components.showMore));

			this.$tools.data.pubsub.subscribe('timeline.reload', function(){
				this._filter();
			}.bind(this));
		},

		_showLoader: function() {
			this.$components.loader.$el.show();
		},

		_hideLoader: function() {
			this.$components.loader.$el.hide();
		},

		_resetRequest: function() {
			this._request && this._request.abort && this._request.abort();
			this._request = null;
		},

		_filter: function() {
			this.currentPeriod = 0;
			this.sourceEventsProcessed = 0;

			return this.$components.line.reset()
				.then(function() {
					this.$components.showMore.hide();
					this._showLoader();
					return this._load()
						.then(function(res) {
							this._addMore(res);
							this._checkItemsLength(res);
						}.bind(this))
						.finally(this._hideLoader.bind(this));
				}.bind(this));
		},

		_loadMore: function() {
			this._load()
				.then(this._addMore.bind(this));
		},

		_addMore: function(data) {
			if (!data || !data.success) {
				return;
			}

			this.$components.line.append(data.data.events);
		},

		_updateStatistic: function(data) {
			if (!data || !data.success) {
				return;
			}

			this.currentPeriod = data.data.currentPeriod;
			this.sourceEventsProcessed = data.data.sourceEventsProcessed;
		},

		_load: function() {
			var dfd = this.$tools.q.defer();
			var data = this.$components.filters.serialize();

			data.currentPeriod = this.currentPeriod;
			data.sourceEventsProcessed = this.sourceEventsProcessed;

			this._resetRequest();

			this.$components.showMore.activityIndicator();

			this._request = this.$tools.data.post(this.$options.url, data)
				.then(function(res) {
					dfd.resolve(res);
					this._checkShowMore(res);
					this._updateStatistic(res);
					this._checkError(res);
				}.bind(this))
				.catch(this._requestFailed.bind(this, dfd))
				.finally(this.$components.showMore.resetLoading.bind(this.$components.showMore));

			this.hide(SELECTORS.noItems);

			return dfd.promise();
		},

		_checkShowMore: function(data) {
			if (!data || !data.success) {
				return;
			}

			data.data.showMore ? this.$components.showMore.show() : this.$components.showMore.hide();
		},

		_checkItemsLength: function(data) {
			if (!data || !data.success) {
				return;
			}

			if (data.data.events.length) {
				this.hide(SELECTORS.noItems);

				return;
			}

			this._showNoItems(data.data.noItemsText || this._defaultNoItemsText);
		},

		_showNoItems: function(text) {
			this.$el.find(SELECTORS.noItemsText).text(text);

			this.show(SELECTORS.noItems);
		},

		_checkError: function(data) {
			if (!data || !data.success) {
				this._showError();

				return;
			}

			this._hideError();
		},

		_requestFailed: function(dfd, data) {
			if (data && data.statusText === 'abort') {
				return;
			}

			dfd.reject(data);
			this._showError();
		},

		_showError: function() {
			this.$components.errorMessage.open();
		},

		_hideError: function() {
			this.$components.errorMessage.close();
		}
	};


/***/ },

/***/ 645:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.$tools.data.pubsub.subscribe('timeline.reload', function(){
				this.$components.grid.$events.trigger('reload');
			}.bind(this));
		}
	};


/***/ },

/***/ 646:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $createCommentForm': '_onSubmit',
			'reset $createCommentForm': '_onReset'
		},
		_onSubmit: function() {
			if (!this.$components.createCommentForm.valid()) {
				return false;
			}
			this.$components.createCommentForm.$components.commit.setLoading();
			this.$components.createCommentForm.submitAsync()
				.then(function(res) {
					if (res.success) {
						this._appendComment(res.data);
					}
				}.bind(this))
				.finally(function() {
					this.$components.createCommentForm.$components.commit.resetLoading();
				}.bind(this));

			return false;
		},
		_onReset: function() {
			this.$components.createCommentForm.reset();
			this.$events.trigger('commentHide');
			return false;
		},
		_appendComment: function(data) {
			this.$events.trigger('addComment', data);
			this._onReset();
		}
	};


/***/ },

/***/ 647:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $commentsToggler': '_toggleComments'
		},

		ready: function() {
			if(this.$options.showComments && this.$components.commentListWrap.$options.countComments) {
				this.$components.commentsToggler.setValue(false);
				this._toggleComments();
			}
		},

		_toggleComments: function() {
			if(!this.$components.commentsToggler.isChecked()) {
				this.$components.commentListWrap.showComments();
			} else {
				this.$components.commentListWrap.hideComments();
			}
			this.$el.trigger('contentChanged');
		}
	};


/***/ },

/***/ 648:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $addComment': '_showForm',
			'click $commentButtonWrap $showMoreComments': '_showMoreComment',
			'click $commentButtonWrap $closeComments': '_hideComment',
			'commentHide $commentFormWrap': '_hideCommentForm',
			'addComment $commentFormWrap': '_addComment'
		},
		ready: function() {
			this.commentButtonWrap = this.$components.commentButtonWrap;
			this.commentButtonWrap.showMoreShow = function() {
				this.$components.showMoreComments.show();
				this.$components.closeComments.hide();
			};
			this.commentButtonWrap.closeCommentShow = function() {
				this.$components.showMoreComments.hide();
				this.$components.closeComments.show();
			};
		},
		showComments: function() {
			if (this.$options.countComments) {
				this._hideCommentForm();
				this.commentButtonWrap.showMoreShow();
			} else {
				this._showForm();
			}
			this.show();
		},
		hideComments: function() {
			this.$components.commentList.$components.showMoreBlock.hide();
			this.commentButtonWrap.showMoreShow();
			this.hide();
		},
		_showForm: function() {
			this.$components.commentFormWrap.show();
			this.$components.addComment.hide();
			this.$el.trigger('contentChanged');
		},
		_showMoreComment: function() {
			this.$components.commentList.$components.showMoreBlock.show();
			this.commentButtonWrap.closeCommentShow();
			this.$el.trigger('contentChanged');
		},
		_hideComment: function() {
			this.$components.commentList.$components.showMoreBlock.hide();
			this.commentButtonWrap.showMoreShow();
			this.$el.trigger('contentChanged');
		},
		_hideCommentForm: function() {
			this.$components.commentFormWrap.hide();
			this.$components.addComment.show();
			if (this.$options.countComments > this.$options.countShowComments) {
				this.$components.commentButtonWrap.show();
			} else {
				this.$components.commentButtonWrap.hide();
			}
			this.$el.trigger('contentChanged');
		},
		_addComment: function(event, data) {
			// ToDo: check if it can work with 'afterbegin'
			this.$components.commentList.html(data.Html + this.$components.commentList.$el.html())
				.then(function() {
					var firstHiddenComment = this.$components.commentList.$components.comments[this.$options.countShowComments];
					var showMoreBlock = this.$components.commentList.$components.showMoreBlock;

					++this.$options.countComments;

					if (this.$options.countComments > this.$options.countShowComments) {
						// ToDo: check if it can work with 'afterbegin'
						showMoreBlock.html(firstHiddenComment.$el.html() + showMoreBlock.$el.html())
							.then(function() {
								this.$components.commentList.destroyChild(firstHiddenComment);
								this.$components.commentButtonWrap.show();
							}.bind(this));
					}

					this.$el.trigger('contentChanged');
				}.bind(this));
		}
	};


/***/ },

/***/ 649:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var replaceTextarePlaceholder = __webpack_require__(468);

	module.exports = {
		events: {
			'loaded $$items': '_itemLoaded'
		},

		ready: function() {
			if (!this.$components.items) {
				return;
			}

			this.items = [];

			this._updateItems(0);
		},

		/**
			desc: Prepend new items
		*/
		prepend: function(markup) {
			// ToDo: check if it can work with 'afterbegin'
			return this.html(replaceTextarePlaceholder(markup) + this.$el.html())
				.then(function() {
					this._updateItems(0);
				}.bind(this));

		},

		/**
			desc: Append new items
		*/
		append: function(items) {
			var length;
			var markup;

			if (!items.length) {
				return;
			}

			length = this.$components.items ? this.$components.items.length : 0;
			markup = items.map(function(item) {
				return item.html;
			}).join('\n');

			// ToDo: check if it can work with 'beforeend'
			return this.html(this.$el.html() + replaceTextarePlaceholder(markup))
				.then(function() {
					this._updateItems(length);
				}.bind(this));
		},

		/**
			desc: Set period for this frame
		*/
		setPeriod: function(period) {
			this._period = period;
		},

		/**
			desc: Returns period for this frame
		*/
		getPeriod: function() {
			return this._period || null;
		},

		_updateItems: function(startIndex) {
			var leftItem = this._findPreviousLeftItem(startIndex - 1);
			var rightItem = this._findPreviousRightItem(startIndex - 1);
			var left = leftItem ? leftItem.getBottom() : 0;
			var right = rightItem ? rightItem.getBottom() : 0;
			var index;
			var item;

			for (index = startIndex; index < this.$components.items.length; ++index) {
				item = this.$components.items[index];
				item.resetMargin();

				if (left > right) {
					item.moveToRight();

					this._updateItemMargin(item, this._findPreviousLeftItem(index));

					right = item.getBottom();
				} else {
					item.moveToLeft();

					this._updateItemMargin(item, this._findPreviousRightItem(index));

					left = item.getBottom();
				}

				item.show();
			}
		},

		_findPreviousLeftItem: function(index) {
			var item;

			for (; index > -1; --index) {
				item = this.$components.items[index];

				if (!item.isRight()) {
					return item;
				}
			}

			return null;
		},

		_findPreviousRightItem: function(index) {
			var item;

			for (; index > -1; --index) {
				item = this.$components.items[index];

				if (item.isRight()) {
					return item;
				}
			}

			return null;
		},

		_itemLoaded: function($ev) {
			var item = $ev.data.component;
			var index = this.$components.items.indexOf(item);

			this._updateItems(index + 1);
		},

		_updateItemMargin: function(currentItem, previousItem) {
			var distance;

			if (!previousItem) {
				return;
			}

			distance = currentItem.getTop() - previousItem.getTop();

			if (distance >= this.$options.minItemsDistance) {
				return;
			}

			currentItem.addMargin(this.$options.minItemsDistance - distance);
		}
	};


/***/ },

/***/ 650:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		'right': 'right-side'
	};

	module.exports = {
		initialize: function() {
			var el = this.$el.get(0);
			var style = el.currentStyle || window.getComputedStyle(el);

			this._originMargin = parseInt(style.marginTop, 10);
		},

		ready: function() {
			this.$el.on('contentChanged', function(){
				this.$events.trigger('loaded');
			}.bind(this));
			if (!this.$options.url) {
				return;
			}

			this._request = null;

			this.load(this.$options.url)
				.then(this._loaded.bind(this))
				.catch(this._showErrorMessage.bind(this));
		},

		/**
			desc: set item as right
			*/
		moveToRight: function() {
			this.$el.addClass(CLASSES.right);
		},

		/**
			desc: Set item as left
			*/
		moveToLeft: function() {
			this.$el.removeClass(CLASSES.right);
		},

		/**
			desc: Check is item on right side
			*/
		isRight: function() {
			return this.$el.hasClass(CLASSES.right);
		},

		/**
			desc: Show element
			*/
		show: function() {
			this.$el.css('opacity', 1);
		},

		/**
			desc: Returns top position of item
			*/
		getTop: function() {
			return this.$el.offset().top;
		},

		/**
			desc: Returns bottom position of item
			*/
		getBottom: function() {
			return this.getTop() + this.$el.height();
		},

		/**
			desc: Sets margin top as origin
			*/
		resetMargin: function() {
			this._setMargin(this._originMargin);
		},

		/**
			desc: Adds additional margin top
			params:
				value: Additional margin in pixels
			*/
		addMargin: function(value) {
			this._setMargin(this._originMargin + value);
		},

		_setMargin: function(value) {
			this.$el.get(0).style.marginTop = value + 'px';
		},

		_loaded: function(data) {
			if (!data.success) {
				this._showErrorMessage();

				return;
			}

			this.$events.trigger('loaded');
		},

		_showErrorMessage: function() {
			this.$components.errorMessage.open();
		}
	};


/***/ },

/***/ 651:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		content: '[data-selector="content"]'
	};

	module.exports = {
		/**
			desc: Append new items to the tree
			*/
		append: function(items) {
			var frames = this.$components.frames;
			var currentPeriodItems = [];
			var currentPeriod;
			var item;
			var currentFrame;

			if (!frames || !frames.length) {
				this._addNewFrames(items);

				return;
			}

			currentFrame = frames[frames.length - 1];
			currentPeriod = currentFrame.getPeriod();

			while(items.length) {
				item = items[0];

				if (this._findPeriod(item) !== currentPeriod) {
					break;
				}

				currentPeriodItems.push(items.shift());
			}

			if (currentPeriodItems.length) {
				currentFrame.append(currentPeriodItems);
			}

			this._addNewFrames(items);
		},

		reset: function() {
			return this.html('', SELECTORS.content);
		},

		_findPeriod: function(item) {
			var date = item.date;

			return this.$components.periods.filter(function(period) {
				return period.check(new Date(date), new Date(this.$options.now));
			}.bind(this))[0];
		},

		_sortItemsByPeriods: function(items) {
			var previosPeriod = this._findPeriod(items[0]);
			var itemsPeriodArray = [];
			var itemsArray = [];

			items.forEach(function(item) {
				var newPeriod = this._findPeriod(item);
				var equal = (newPeriod === previosPeriod);

				if (equal) {
					itemsArray.push(item);

					return;
				}

				itemsPeriodArray.push({
					items: itemsArray,
					period: previosPeriod
				});

				previosPeriod = newPeriod;
				itemsArray = [item];
			}.bind(this));

			itemsPeriodArray.push({
				items: itemsArray,
				period: previosPeriod
			});

			return itemsPeriodArray;
		},

		_addNewFrames: function(items) {
			var sortedItems;
			if (!items.length) {
				return;
			}

			sortedItems = this._sortItemsByPeriods(items);

			return sortedItems.reduce(function(promise, current) {
				return promise.then(function() {
					return this._createNewFrameTo(current.period)
						.then(function(frame) {
							return frame.append(current.items);
						});
				}.bind(this));
			}.bind(this), this.$tools.q.when());
		},

		_createNewFrameTo: function(period) {
			// ToDo: check if it can work with 'beforeend'
			return this.html(this.$el.find(SELECTORS.content).html() + period.getLabelHtml(), SELECTORS.content)
				.then(function() {
					// ToDo: check if it can work with 'beforeend'
					return this.html(this.$el.find(SELECTORS.content).html() + period.getFrameHtml(), SELECTORS.content);
				}.bind(this))

				.then(function() {
					var frame = this.$components.frames[this.$components.frames.length - 1];

					frame.setPeriod(period);

					return frame;
				}.bind(this));
		}
	};


/***/ },

/***/ 652:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		/**
			desc: If date is inside this period - returns true
			params:
				date: date of timeline item
			*/
		check: function(date, now) {
			var mask;
			var DAY = 86400000;
			// for older items
			// Check via typeof because timeMask can be 0 for today period, but for older period is undefined
			if (typeof this.$options.timeMask === 'undefined') {
				return true;
			}

			now = now || new Date();

			mask = this.$options.timeMask;

			now.setHours(0);
			now.setMinutes(0);
			now.setSeconds(0);
			now.setMilliseconds(0);

			return (now.getTime() - date.getTime()) <= mask * DAY;
		},

		/**
			desc: returns html for period label
			*/
		getLabelHtml: function() {
			return this.$components.label.$el[0].innerHTML;
		},

		/**
			desc: returns html for period frame
			*/
		getFrameHtml: function() {
			return this.$components.frame.$el[0].innerHTML;
		}
	};


/***/ },

/***/ 653:
/***/ function(module, exports) {

	'use strict';

	module.exports = {};


/***/ },

/***/ 654:
/***/ function(module, exports) {

	'use strict';

	module.exports = {

		events: {
			'submit $disableRedirectForm': '_onDisableRedirectSubmit'
		},

		ready: function() {
			if(!this.$components.disableRedirectForm) {
				return;
			}
			this.$disableRedirectForm = this.$components.disableRedirectForm;

			this.$disableRedirectButton = this.$disableRedirectForm.$components.disableRedirectButton;
			this.$successDisableRedirectMessage = this.$disableRedirectForm.$components.successMessage;
			this.$failureDisableRedirectMessage = this.$disableRedirectForm.$components.errorMessage;
		},

		_onDisableRedirectSubmit: function() {
			var formData;

			if(!this.$components.disableRedirectForm) {
				return;
			}
			formData = this.$components.disableRedirectForm.serialize();

			this.$failureDisableRedirectMessage.close();
			this.$disableRedirectButton.activityIndicator();

			this.$tools.data.post(this.$options.disableRedirectUrl, formData)
				.then(this._handleSuccessRedirectDisable.bind(this))
				.catch(this._handleFailRedirectDisable.bind(this))
				.finally(this._handleAfterRedirectDisable.bind(this));
		},

		_handleSuccessRedirectDisable: function(response) {
			if (!response.success) {
				this._handleFailRedirectDisable(response);

				return;
			}

			this.$disableRedirectButton.disable();

			this.$successDisableRedirectMessage.open();
		},

		_handleFailRedirectDisable: function() {
			this.$failureDisableRedirectMessage.open();
		},

		_handleAfterRedirectDisable: function() {
			this.$disableRedirectButton.resetLoading();
		}
	};


/***/ },

/***/ 655:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Transfer ownership accept step
		type: controller
		desc: Shows accept information for transfer ownership
	 */

	module.exports = {
		events: {
			'click $next': '_next',
			'checked $accept': '_enableNext',
			'unchecked $accept': '_disableNext',
			'submit': '_submit'
		},

		_submit: function() {
			this.$components.next.activityIndicator();
		},

		_next: function() {
			this._submit();

			this.flow
				.next(this.$extensions.form.serialize())
				.finally(this.$components.next.resetLoading.bind(this.$components.next));
		},

		_enableNext: function() {
			this.$components.next.enable();
		},

		_disableNext: function() {
			this.$components.next.disable();
		}
	};


/***/ },

/***/ 656:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	  name: Transfer ownership flow controller
	  type: controller
	  desc: Manipulates with transfer ownership steps
	  options:
	    loginUrl: Url for getting login step html
	 */

	var flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			this.flow = new flow.FlowController(new flow.WizardFlowPresenter(this), {
				accept: {
					componentContentURL: '',
					statik: true,
					index: 0,
					infer: function(data) {
						return {
							next: 'login',
							payload: data
						};
					}
				},
				login: {
					index: 1,
					componentContentURL: this.$options.loginUrl,
					statik: false,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				}
			}, this.$events);
		},

		ready: function() {
			this.flow.startWith('accept');
		}
	};


/***/ },

/***/ 657:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Transfer ownership login step
		type: controller
		desc: Shows NEMID login form for transfer ownership
		options:
			nemidOrigin: origin url for NEMID iframe
			nemidParams: parameters, which will be sent when we will recieve SendParameters event from NEMID iframe
			nemidUrl: url for sending NEMID result
	 */

	var SELECTORS = {
		fail: '[data-selector=fail]',
		iframe: '[data-selector=iframe]',
		iframeContainer: '[data-selector=iframe-container]',
		loader: '[data-selector=loader]'
	};

	module.exports = {
		events: {
			'click $back': '_back',
			'click $try': '_try'
		},

		initialize: function() {
			this._messageListener = this._onNemIDMessage.bind(this);

			this.$tools.events.listen(window, 'message', this._messageListener);
			this.iframeHTML = this.$el.find(SELECTORS.iframeContainer).html();
		},

		_onNemIDMessage: function(event) {
			var message;

			if (event.origin !== this.$options.nemidOrigin) {
				return;
			}
			try {
				message = JSON.parse(event.data);
			} catch (exc) {
				message = {};
				this.$tools.logger.error(exc);
			}
			switch(message.command) {
				case 'SendParameters':
					if (this.$options.nemidParams) {
						this.$el
						.find(SELECTORS.iframe)[0]
						.contentWindow
						.postMessage(JSON.stringify({
							command: 'parameters',
							content: JSON.stringify(this.$options.nemidParams)
						}), this.$options.nemidOrigin);
					}

					break;

				case 'changeResponseAndSubmit':
					this._checkNemId(message);

					break;
			}
		},

		_checkNemId: function(message) {
			var data = this.$extensions.form.serialize();
			data.nemIdResponse = message.content;

			this._hideIframe();
			this._showLoader();

			this.$tools.data.post(this.$options.nemidUrl, data)
				.then(this._nemIdSuccess.bind(this))
				.catch(this._showFailed.bind(this));
		},

		_nemIdSuccess: function(data) {
			data.success ? this.$el.submit() : this._showFailed();
		},

		_showFailed: function() {
			this._hideLoader();
			this.$el.find(SELECTORS.fail).show();
		},

		_hideIframe: function() {
			this.$el.find(SELECTORS.iframeContainer).hide();
		},

		_showLoader: function() {
			this.$el.find(SELECTORS.loader).show();
		},

		_hideLoader: function() {
			this.$el.find(SELECTORS.loader).hide();
		},

		_back: function() {
			this.$tools.events.unlisten(window, 'message', this._messageListener);

			this.flow.prev();
		},

		_try: function() {
			this.$el.find(SELECTORS.fail).hide();

			this.$el
				.find(SELECTORS.iframeContainer)
				.html(this.iframeHTML)
				.show();
		}
	};


/***/ },

/***/ 658:
/***/ function(module, exports) {

	'use strict';

	/**
	name: class-toggler
	type: ui
	desc: >
		Allows toggle element classes by clicking on another elements
		To set your own "toggled" class use "data-class" attribute.
		If "data-class" attribute doesn't set/exist - component will use default ".js-hidden" class
	*/
	module.exports = {
		events: {
			'click': '_onClick'
		},

		ready: function() {
			this._target = document.querySelector(this.$options.target);

			this._class = this.$options.class || 'js-hidden';
		},

		_onClick: function() {
			this._target.classList.toggle(this._class);
		}
	};


/***/ },

/***/ 659:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		loader: '[data-selector="loader"]',
		totals: '[data-selector="totals"]'
	};

	module.exports = {
		events: {
			'totalUpdated $usages': '_updateTotals'
		},

		ready: function() {
			this.$components.usages.$events.on('ajax $this', this._ajax.bind(this));
		},

		_ajax: function() {
			this.show(SELECTORS.loader);
			this.hide(SELECTORS.totals);
		},

		_updateTotals: function($ev, totals) {
			this.hide(SELECTORS.loader);

			this.html(totals || '', SELECTORS.totals);

			this.show(SELECTORS.totals);
		}
	};


/***/ },

/***/ 660:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		multiFilterContainer: '[data-selector="multiFilterContainer"]',
		exports: '[data-selector="exports"]'
	};

	var CLASSES = {
		hiddenExpand: 'has-hidden-icons'
	};

	module.exports = {
		initialize: function() {
			this.$events.on('loaded $this', this._loaded.bind(this));
			this._totals = '';
			this.$events.on('drawed $this', this._drawed.bind(this));
			this.$events.on('optionsReady $this', this._optionsReady.bind(this));

			this._maxWidthResponsive = 0;
		},

		_loaded: function($ev, data) {
			this._totals = data.usageTotals;

			if (data.multiFilter) {
				this.$components.filter.$components.multiFilter.destroy();

				this.$components.filter.html(data.multiFilter, SELECTORS.multiFilterContainer);
			}

			this.$el.find(SELECTORS.exports).prop('href', data.exportUrl);
		},

		_drawed: function() {
			this.$events.trigger('totalUpdated', this._totals);

			if (this.$tools.dom.find(document.body).width() < this.options.maxResponsiveWidth) {
				this.$el.find('table:first > tbody > tr').removeClass(CLASSES.hiddenExpand);
			}
		},

		_optionsReady: function($ev, options) {
			this.options = options;
		}
	};


/***/ },

/***/ 661:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		usages: '[data-selector="usages"]',
		hiddenContainer: '[data-selector="hiddenContainer"]',
		urls: '[data-selector="urls"]'
	};

	module.exports = {
		ready: function() {
			this.urls = this.$components.urls ? this.$components.urls.map(function(url) {
				return url.$options.url;
			}) : [];

			this.$el.find(SELECTORS.urls).remove();

			this._loadNext();
		},

		_loadNext: function() {
			if (!this.urls.length) {
				this.$components.loader.$el.hide();

				return;
			}

			//empty object for post request
			this.load(this.urls.shift(), SELECTORS.hiddenContainer, {})
				.then(this._added.bind(this))
				.finally(this._loadNext.bind(this));
		},

		_added: function(data) {
			var $container;

			if (!data.success) {
				return;
			}

			$container = this.$el.find(SELECTORS.hiddenContainer);

			this.$el.find(SELECTORS.usages).append($container.find('> *'));

			$container.html('');
		}
	};


/***/ }

});