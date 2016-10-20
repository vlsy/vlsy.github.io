webpackJsonp([11],{

/***/ 383:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $deliveryType': '_onDeliveryTypeChange',
			'click $submitDelivery': '_onSubmit',
			'click $optionalLogin': '_onSubmitLogin',
			'storesLoading $pickStoreForm $stores': '_onStoresLoading',
			'storesLoaded $pickStoreForm $stores': '_onStoresLoaded'
		},

		initialize: function() {
			this.optionalLogin = false;
			this.$tools.data.pubsub.subscribe('autocomplete.changed', this._onAutocompleteChange.bind(this));
		},

		ready: function() {
			if (this.$components.deliveryType.getValue() === 'shop') {
				this._shopTypeChangeProcessor();
			}
			if (this.$components.homeAddressForm) {
				this.$components.homeAddressForm.$elements.email.prop('disabled', this.$components.homeAddressForm.$elements.email.val());
				this.$components.homeAddressForm.$elements.phoneNumber.prop('disabled', this.$components.homeAddressForm.$elements.phoneNumber.val());
			}

			if (this.$components.pickStoreForm) {
				this._enableEmptyFields(this.$components.pickStoreForm, false);
			}
		},

		_onDeliveryTypeChange: function(event) {
			var deliveryType = event.data.component.getValue();
			this.$elements.deliveryType.hide();
			this.show('[data-alias="' + deliveryType + '"]');
			this._callProcessor(deliveryType, 'TypeChange');
		},

		_onSubmit: function(event) {
			var formType = this.$components.deliveryType.getValue();

			event.preventDefault();

			this.optionalLogin = false;
			this.$components.submitDelivery.activityIndicator();
			this._callProcessor(formType, 'Submit');

			return false;
		},

		_onSubmitLogin: function() {
			var formType = this.$components.deliveryType.getValue();

			this.optionalLogin = true;
			this.$components.optionalLogin.activityIndicator();
			this._callProcessor(formType, 'Submit');

			return false;
		},

		_onStoresLoading: function() {
			this.$components.button.forEach(function(button) {
				button.disable();
			});
		},

		_onStoresLoaded: function() {
			this.$components.button.forEach(function(button) {
				button.enable();
				button.resetLoading();
			});
		},

		_enableEmptyFields: function(form, force) {
			form.$el.find('input[disabled]').filter(function(ind, el) {
				return force || form.$el.find(el).val().length === 0;
			}).prop('disabled', false);

			if (form.$components.select) {
				form.$components.select.forEach(function(component) {
					if (force || !component.getValue()) {
						component.enable();
					}
				});
			}
		},
		_onAutocompleteChange: function(event, data) {
			var city;
			if (data.relatedFields && this.$components.alternativeAddressForm) {
				this.$components.alternativeAddressForm.reset(data.relatedFields);
			}

			if (data.alias === 'zip') {
				city = data.label.replace(/^\d+/, '');
				this.$components.alternativeAddressForm.$el.find('[data-alias="city"]').val(city).keyup();
			}
		},
		_callProcessor: function(type, event) {
			var processorName = ['_', type, event, 'Processor'].join('');
			if (typeof this[processorName] === 'function') {
				this[processorName]();
			}
		},
		_submitForm: function(form) {
			var url;
			var $disabledInputs;
			var data;

			this._onStoresLoading();
			if (!form.valid()) {
				this._onStoresLoaded();
				return;
			}
			url = form.$el.attr('action');

			$disabledInputs = form.$el.find(':input[disabled]');
			$disabledInputs.prop('disabled', false);

			data = form.serialize();
			data.deliveryType = this.$components.deliveryType.getValue();
			data.needOptionalLogin = this.optionalLogin || false;

			$disabledInputs.prop('disabled', true);

			this.$components.submitAddressError.close();

			this.$tools.data.post(url, data)
				.then(function(response) {
					if (response.success && response.data.nextStepUrl) {
						this.$tools.util.redirect(response.data.nextStepUrl);
					} else {
						this.$components.submitAddressError.open();
						this._onStoresLoaded();
					}
				}.bind(this))
				.catch(function() {
					this._onStoresLoaded();
				}.bind(this));
		},
		// internal event processors
		_shopTypeChangeProcessor: function() {
			this.$components.pickStoreForm.$components.stores.refreshStoresList();
		},
		_homeSubmitProcessor: function() {
			this._submitForm(this.$components.homeAddressForm);
		},
		_alternativeSubmitProcessor: function() {
			this._submitForm(this.$components.alternativeAddressForm);
		},
		_companySubmitProcessor: function() {
			this._submitForm(this.$components.homeAddressForm);
		},
		_otherSubmitProcessor: function() {
			this._submitForm(this.$components.alternativeAddressForm);
		},
		_shopSubmitProcessor: function() {
			this._submitForm(this.$components.pickStoreForm);
		},
		_retailCurrentShopSubmitProcessor: function() {
			this._submitForm(this.$components.retailCurrentShopForm);
		}
	};


/***/ },

/***/ 390:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $secretNumberOption': '_onSecretNumber',
			'click $buttonSubmit': '_onSaveNumber'
		},

		ready: function() {
			this._onSecretNumber();
		},

		validate: function() {
			return !(this.$components.numberForm && !this.$components.numberForm.valid());
		},

		/**
		 desc: Fires to get alias of error message.
		 */
		getErrorAlias: function() {
			return 'saveNumbersError';
		},

		errorSave: function(response) {
			this._showError(response, this.getErrorAlias());
		},

		_onSecretNumber: function() {
			var option = this.$components.secretNumberOption;
			var element;

			if (!option) {
				return;
			}
			option.hide();

			element = option.filter('[data-type="' + option.getValue() + '"]');

			if (element) {
				element[0].classList.remove('js-hidden');
			}
		},

		_getData: function() {
			var data = this.$components.numberForm.serialize();
			data.BasketItemId = this.$options.basketItemId;
			return data;
		},

		_onResetNumber: function(event) {
			event.preventDefault();
			this.$events.trigger('resetNumber');
		},

		_onSaveNumber: function(event) {
			var btnDeferred = this.$components.buttonSubmit.activityIndicator();
			event.preventDefault();

			if (!this.validate.call(this)) {
				btnDeferred.reject();
				return false;
			}

			this._hideError();
			this.$tools.data.post(this.$options.url, this._getData())
				.then(function(response) {
					if (response.success) {
						this.$events.trigger('updateNumber', response.data);
					} else {
						this.errorSave(response);
						btnDeferred.reject();
					}
				}.bind(this))
				.catch(function() {
					btnDeferred.reject();
				});
		},

		_hideError: function() {
			this.$events.trigger('hideError');
		},

		_showError: function(error, alias) {
			this.$events.trigger('showError', {error: error, alias: alias || this.getErrorAlias()});
		}
	};


/***/ },

/***/ 402:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		overlay: 'modal-box--is-open',
		html: 'modal-box--is-open'
	};

	module.exports = {
		/**
		 desc: fix for prevent bouncing, when you scroll modalbox on position fixed
		 */
		attachEvents: function($overlay) {
			var startY = 0;

			$overlay.on('touchmove', function(event) {

				// Get the current Y position of the touch
				var curY = event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.originalEvent.screenY;
				var scrollHeight = $overlay[0].scrollHeight;
				var scrollTop = $overlay[0].scrollTop;

				// Determine if the user is trying to scroll past the top or bottom
				// In this case, the window will bounce, so we have to prevent scrolling completely
				var isAtTop = (startY <= curY && scrollTop === 0);
				var isAtBottom = (startY >= curY && scrollHeight - scrollTop === this.$overlay.height());

				if (isAtTop || isAtBottom) {
					event.preventDefault();
				}

			}.bind(this));

			$overlay.on('touchstart', function(event) {
				startY = event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.originalEvent.screenY;
			});
		},

		showOverlay: function($overlay) {
			$overlay.addClass(CLASSES.overlay);
			document.documentElement.classList.add(CLASSES.html);
		},

		hideOverlay: function($overlay) {
			$overlay.removeClass(CLASSES.overlay);
			document.documentElement.classList.remove(CLASSES.html);
		}
	};


/***/ },

/***/ 412:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var jQuery = __webpack_require__(2);

	function AnalyticsService() {
		this.initAjaxInterceptor();
	}

	AnalyticsService.prototype.ActionTypes = {
		PageView: 1,
		Event: 2
	};

	AnalyticsService.prototype.initAjaxInterceptor = function() {
		jQuery.ajaxSetup({
			dataFilter: function(data) {
				var jsonData = {};
				var analyticsData;

				try {
					jsonData = jQuery.parseJSON(data);
				} catch(ex) { // if response is not a valid JSON
					jsonData = {};
				}

	            // handle WEB-analytics data
				if (jsonData.analytics) {
					analyticsData = jsonData.analytics.data;

					switch (jsonData.analytics.actionType) {
						case this.ActionTypes.PageView:
							this.view(analyticsData);
							break;
						default:
							this.link(analyticsData);
							break;
					}
				}

				return data;
			}.bind(this)
		});
	};

	AnalyticsService.prototype.link = function(data) {
		if (window.utag) {
			window.utag.link(data);
		}
	};

	AnalyticsService.prototype.view = function(data) {
		if (window.utag) {
			window.utag.view(data);
		}
	};

	module.exports = new AnalyticsService();


/***/ },

/***/ 415:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var pubsub = __webpack_require__(330);

	module.exports = BasketService;

	function BasketService() {}

	BasketService.prototype.removeProducts = function(params) {
		var promises = params.map(function(item) {
			return this.removeProduct(item.url, item.basketItemId);
		}.bind(this));

		return app.core.q.all(promises);
	};

	BasketService.prototype.removeProduct = function(url, productId) {
		var params = {
			id: productId
		};

		var promise = triggerRequest(url, params);

		promise.then(function(response) {
			pubsub.publish('basket.product.remove', response.data);
		});

		return promise;
	};

	BasketService.prototype.emptyBasket = function(url) {
		var promise = triggerRequest(url, {});

		promise.then(function(response) {
			pubsub.publish('basket.product.empty', response.data);
		});

		return promise;
	};

	function triggerRequest(url, params) {
		var dfd = app.core.q.defer();

		if (!url) {
			dfd.reject();
			return dfd.promise();
		}

		app.core.data.ajax({
			url: url,
			type: params ? 'POST' : 'GET',
			async: true,
			contentType: 'application/json',
			data: params ? JSON.stringify(params) : '',
			success: function(response) {
				if (response.success) {
					dfd.resolve({
						data: response.data,
						notifications: response.notifications
					});
				} else {
					dfd.reject({
						errorMessages: response.errorMessages,
						notifications: response.notifications
					});
				}
			}
		});

		return dfd.promise();
	}


/***/ },

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

/***/ 533:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Filtering bar
	type: UI
	desc: Basic controller for filtering panel handling
	events:
		filterChange: Fires when some filter was changed (criteria, filterValue, etc).
	 */
	module.exports = {
		events: {
			'change filterControl': '_onFilterChange',
			'change filterAll': '_onFiltersReset'
		},

		ready: function() {
			this.selectedValues = this._getSelectedValues();
		},

		/**
		desc: return current filter state as object. Contains selected values and criteria
		*/
		getCurrentState: function() {
			return {
				criteria: this.$options.filterGroup,
				values: this.selectedValues
			};
		},

		hasSelectedFilters: function() {
			return this.selectedValues.length > 0;
		},

		_onFilterChange: function() {
			this.selectedValues = this._getSelectedValues();

			this.$elements.filterAll.prop('checked', !this.selectedValues.length);

			this.$events.trigger('filterChange', this.getCurrentState());
		},

		_getSelectedValues: function() {
			return this.$elements.filterControl.get()
				.filter(function(filter) {
					return filter.checked;
				})
				.map(function(filter) {
					return filter.value;
				});
		},

		_onFiltersReset: function() {
			this.$elements.filterControl.forEach(function(filterControl) {
				filterControl.checked = false;
			});

			this._onFilterChange();
		}
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

/***/ 662:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(663);


/***/ },

/***/ 663:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./agreement-panel/index.js": 664,
		"./agreement-panel/new-agreement/index.js": 665,
		"./agreement-panel/remove-new-agreement/index.js": 666,
		"./b2b-identification/index.js": 667,
		"./b2b-personal-info/cvr-identification/index.js": 668,
		"./b2b-personal-info/index.js": 669,
		"./b2b-personal-info/kob-identification/index.js": 670,
		"./b2b-personal-info/show-control/index.js": 671,
		"./b2b-user-validation/index.js": 672,
		"./dsl/new-order/address-qualification/fail/index.js": 673,
		"./dsl/new-order/address-qualification/form/index.js": 674,
		"./dsl/new-order/address-qualification/index.js": 675,
		"./dsl/new-order/address-qualification/line-options/index.js": 677,
		"./dsl/new-order/address-qualification/modal-box/index.js": 678,
		"./dsl/new-order/address-qualification/optional-addresses/index.js": 679,
		"./dsl/new-order/address-qualification/service.js": 676,
		"./dsl/new-order/address-qualification/spinner/index.js": 680,
		"./dsl/new-order/address-qualification/success/index.js": 681,
		"./dsl/new-order/index.js": 682,
		"./dsl/termination/index.js": 683,
		"./dsl/termination/item/index.js": 684,
		"./family-plan/configuration/index.js": 685,
		"./family-plan/family-offer-message/index.js": 686,
		"./family-plan/member/index.js": 687,
		"./family-plan/modal-wizard/index.js": 688,
		"./family-plan/modal-wizard/modal-view.js": 689,
		"./family-plan/modal-wizard/phone-details/index.js": 690,
		"./family-plan/modal-wizard/phones-list/index.js": 691,
		"./family-plan/modal-wizard/subscriptions/index.js": 692,
		"./gsm-subscriptions/index.js": 693,
		"./mbb-hardware/index.js": 694,
		"./mbb-hardware/mbb-device/index.js": 695,
		"./product/accessory/category/index.js": 696,
		"./product/accessory/category/item/index.js": 699,
		"./product/accessory/details/index.js": 701,
		"./product/accessory/details/info/index.js": 702,
		"./product/common/category/filter/index.js": 704,
		"./product/common/category/index.js": 697,
		"./product/common/category/item/index.js": 700,
		"./product/common/details/index.js": 703,
		"./product/family/category/index.js": 705,
		"./product/family/details/configurations/index.js": 707,
		"./product/family/details/index.js": 709,
		"./product/handset/category/index.js": 706,
		"./product/handset/details/configurations/addons/addon/index.js": 711,
		"./product/handset/details/configurations/addons/index.js": 712,
		"./product/handset/details/configurations/capacity/index.js": 713,
		"./product/handset/details/configurations/color/index.js": 714,
		"./product/handset/details/configurations/index.js": 708,
		"./product/handset/details/configurations/installment/index.js": 715,
		"./product/handset/details/configurations/insurance/index.js": 716,
		"./product/handset/details/configurations/subscription/index.js": 717,
		"./product/handset/details/index.js": 710,
		"./product/url-parser/index.js": 698,
		"./products-checker/index.js": 718,
		"./seamless-basket/basket-discount/index.js": 719,
		"./seamless-basket/basket-items/basket-item/index.js": 720,
		"./seamless-basket/basket-items/index.js": 721,
		"./seamless-basket/delivery/index.js": 383,
		"./seamless-basket/number-configuration/index.js": 722,
		"./seamless-basket/number-configuration/subscription/chosen/index.js": 723,
		"./seamless-basket/number-configuration/subscription/index.js": 724,
		"./seamless-basket/number-configuration/subscription/keep-number/index.js": 725,
		"./seamless-basket/number-configuration/subscription/new-number/index.js": 726,
		"./seamless-basket/number-configuration/subscription/new-number/numbers/index.js": 727,
		"./seamless-basket/obsolete-controller/index.js": 729,
		"./seamless-basket/offer/accept/index.js": 730,
		"./seamless-basket/offer/create/index.js": 731,
		"./seamless-basket/offer/details/index.js": 732,
		"./seamless-basket/offer/dialogs/alternate-offer-confirmation/index.js": 733,
		"./seamless-basket/offer/dialogs/customer-email-confirmation/index.js": 734,
		"./seamless-basket/offer/dialogs/decline-offer-confirmation/index.js": 735,
		"./seamless-basket/offer/dialogs/delete-basket-confirmation/index.js": 736,
		"./seamless-basket/order-summary/billing-address/index.js": 737,
		"./seamless-basket/order-summary/dialogs/verbal-accept-agent-initials/index.js": 738,
		"./seamless-basket/order-summary/hardware-pool/index.js": 739,
		"./seamless-basket/order-summary/index.js": 740,
		"./seamless-basket/order-summary/payment/index.js": 741,
		"./seamless-basket/share/index.js": 742,
		"./seamless-basket/summary/index.js": 743,
		"./stores-list/index.js": 744,
		"./subscription/below-the-line/index.js": 745
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
	webpackContext.id = 663;


/***/ },

/***/ 664:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		existingAgreementOption: '[data-alias="changeAgreement"]:checked',
		newAgreementOption: '[data-alias="newAgreement"]:checked'
	};

	/**
	name: Agreement Panel
	type: controller
	desc: Shows panel under the main menu on all B2B shop pages. Handles agreement's selection for B2B customers.
	options:
		changeAgreementUrl: URL for agreement change.
	*/
	module.exports = {
		events: {
			'change $agreement': '_onAgreementChange'
		},

		ready: function() {
			if (this.$components.noAgreementPopup) {
				this.$components.noAgreementPopup.show();
			}

			// Fix for modal-box events
			this.$components.existingAgreementPopup.$components.continue.$events.on('click $this', this._onAgreementChangeAccepted.bind(this));
			this.$components.noAgreementPopup.$components.continue.$events.on('click $this', this._onSelectNewAgreement.bind(this));
		},

		_onAgreementChange: function(event) {
			if (this.$components.existingAgreementPopup) {
				this.$components.existingAgreementPopup.show();
			} else {
				this._changeAgreement(event.data.component.getValue());
			}
		},

		_onAgreementChangeAccepted: function() {
			var decision = this.$components.existingAgreementPopup.$el.find(SELECTORS.existingAgreementOption).val();
			if (decision === 'true') {
				this.$components.existingAgreementPopup.$components.continue.activityIndicator();
				this._changeAgreement(this.$components.agreement.getValue());
			} else {
				this.$components.existingAgreementPopup.$components.continue.resetLoading();
				this.$components.existingAgreementPopup.hide();
			}
		},

		_onSelectNewAgreement: function() {
			var selectedAgreementId = this.$components.noAgreementPopup.$el.find(SELECTORS.newAgreementOption).val();
			this.$components.noAgreementPopup.$components.continue.activityIndicator();
			this._changeAgreement(selectedAgreementId);
		},

		_changeAgreement: function(agreementId) {
			this.$tools.data.post(this.$options.changeAgreementUrl, {
				agreementId: agreementId
			}).then(function(response) {
				if (response.success) {
					this.$tools.util.reload();
				}
			}.bind(this));
		}
	};


/***/ },

/***/ 665:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		commitmentDescription: '[data-group="commitmentDescription"]'
	};

	var CLASSES = {
		activeCommitment: 'is-active'
	};

	/**
	name: New Agreement Popup
	type: controller
	desc: Handles popup for creating New Agreement for B2B customers
	options:
		createAgreementUrl: URL for agreement creation.
	 */
	module.exports = {
		events: {
			'click $$agreementCommitment': '_onCommitmentChange',
			'click $createAgreement': '_onCreateAgreement'
		},

		_onCommitmentChange: function(event) {
			this.$components.agreementCommitment.forEach(function(commitment) {
				commitment.$el[0].classList.remove(CLASSES.activeCommitment);
			});
			event.data.component.$el[0].classList.add(CLASSES.activeCommitment);

			this.hide(SELECTORS.commitmentDescription);
			this.show('[data-alias="' + event.data.component.$options.description + '"]');
		},

		_onCreateAgreement: function(event) {
			var commitment = this._getSelectedCommitment();
			event.data.component.activityIndicator();

			this.$tools.data.post(this.$options.createAgreementUrl, {
				agreementLevelId: this.$options.agreementLevelId,
				months: commitment
			}).then(function(response) {
				if (response.success) {
					this.$tools.util.reload();
				} else {
					event.data.component.resetLoading();
				}
			}.bind(this));
		},

		_getSelectedCommitment: function() {
			var commitment = null;
			this.$components.agreementCommitment.forEach(function(commitmentItem) {
				if (commitmentItem.$el[0].classList.contains(CLASSES.activeCommitment)) {
					commitment = commitmentItem.$options.value;
				}
			});
			return commitment;
		}
	};


/***/ },

/***/ 666:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Remove New Agreement Popup
	type: controller
	desc: Handles popup for confirmation of removal of the new agreement from the basket for B2B customers
	options:
		removeAgreementUrl: URL for agreement removal.
	 */
	module.exports = {
		events: {
			'click $removeAgreement': '_onRemoveAgreement'
		},

		_onRemoveAgreement: function(event) {
			event.data.component.activityIndicator();
			this.$tools.data.post(this.$options.removeAgreementUrl, {})
			.then(function(response) {
				if (response.success) {
					this.$tools.util.reload();
				}
			}.bind(this));
		}
	};


/***/ },

/***/ 667:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'loginFinished $identificationFlow': '_onLoginFinished'
		},
		_onLoginFinished: function() {
			this.$components.nextStep.submit();
		}
	};


/***/ },

/***/ 668:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $identificationForm': '_next'
		},
		_next: function() {
			var form = this.$components.identificationForm;
			var dfd = form.$components.identificationFormSubmit.activityIndicator();
			var promise = form.submitAsync().catch(dfd.reject.bind(dfd));

			this.$events.trigger('next', promise);
		}
	};


/***/ },

/***/ 669:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'next $identificationStep': '_next'
		},

		_next: function(event, promise) {
			promise.then(function(res) {
				var data = null;
				var html = '';

				if (!res.success) return res;

				if (data = res.data) {
					if (html = data.html) {
						this.html(html);
					}
				} else {
					this.$events.trigger('loginFinished');
				}

			}.bind(this));
		}
	};


/***/ },

/***/ 670:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $identificationForm': '_next',
			'click $reset'              : '_onReset'
		},

		_onReset: function(event) {
			event.preventDefault();
			window.location.reload(true);
		},

		_next: function() {
			var form = this.$components.identificationForm;
			var dfd = form.$components.identificationFormSubmit.activityIndicator();
			var promise = form.submitAsync().catch(dfd.reject.bind(dfd));

			this.$events.trigger('next', promise);
		}
	};


/***/ },

/***/ 671:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Show control
	type: controller
	desc: Handle trigger changing.
	options:
		trigger: select alias name.
		cases: cases group name
	*/
	module.exports = {
		initialize: function() {
			var trigger = this.$components[this.$options.trigger];

			if (trigger) {
				trigger.$events.on('change $this', this._onChange.bind(this));
			}
		},

		_onChange: function() {
			var value = this.$components[this.$options.trigger].getValue();

			this.$components[this.$options.cases].forEach(function(component) {
				component.toggle(component.$options.when === value);
			});
		}
	};


/***/ },

/***/ 672:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			//'submit $customerNotIdentified $customerNotIdentified': '_onSubmit'
		},

		ready: function() {
			this.$components.customerNotIdentified.show();

			// Fix for modal-box events
			this.$components.customerNotIdentified.$components.customerNotIdentified.$events.on('submit $this', this._onSubmit.bind(this));
		},

		_onSubmit: function() {
			var customerNotIdentifiedForm = this.$components.customerNotIdentified.$components.customerNotIdentified;

			customerNotIdentifiedForm.submitAsync()
				.then(function(res) {
					if (res.success) {
						location.reload(false);
					}
				});
		}
	};


/***/ },

/***/ 673:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
		},
		events: {
			'click .test-again': 'onTestAgainClick'
		},
		onTestAgainClick: function() {
			delete this.flow.data.preQualificationResultId;

			this.flow.reset('form');

			return false;
		}
	};


/***/ },

/***/ 674:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $addressForm': 'onQualifyAddress'
		},

		initialize: function() {
			this.$tools.data.pubsub.subscribe('autocomplete.changed', this.onZipAutocomplete.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.reset', function() {
				this.$components.addressForm.reset();

				this.flow.reset('form');
			}.bind(this));

			this.$events.on('activate $this', function() {
				if (this.flow.data.address) {
					this.$components.addressForm.deserialize(this.flow.data.address);

					delete this.flow.data.address;
				}
			}.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.showModal', function() {
				this.$el.find('[autofocus]').focus();
			}.bind(this));
		},

		ready: function() {
			var _this = this;

			this.$components.addressForm.$components['street-number'].$events.on('valueWillSet $this', this.onStreetNumberWillSet.bind(this));

			// focus on next input after selecting value from autocomplete
			this.$components.addressForm.$components.autocomplete.forEach(function(component) {
				component.$events.on('valueWillSet $this', function() {
					var index = component.$el.prop('tabindex') + 1;

					setTimeout(function() {
						_this.$components.addressForm.$el.find('[tabindex=' + index + ']').focus();
					}, 0);
				});
			});
		},
		qualifyAddress: function(address) {
			this.flow.next({
				pageId: this.$options.pageId,
				address: address
			});
		},

		onQualifyAddress: function() {
			this.qualifyAddress(this.$components.addressForm.serialize());

			return false;
		},

		onZipAutocomplete: function(_msg, obj) {
			var city;
			// process only Zip autocomplete change
			if (obj.alias === 'zip') {
				city = obj.label.replace(/^\d+/, '');
				this.$el.find('[data-alias="city"]').val(city);
			}
		},
		onStreetNumberWillSet: function(event, data) {
			var streetNumber = data.value.replace(/\D+/, '');
			var houseLetter = data.value.replace(/^\d+/, '');

			this.$el.find('[data-alias="house-letter"]').val(houseLetter);

			data.mutate(streetNumber);
		}
	};


/***/ },

/***/ 675:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var flow = __webpack_require__(442);
	var AQService = __webpack_require__(676);
	var scrollTo = __webpack_require__(441);

	var finishInfer = function() {
		return {
			next: 'finish',
			payload: {
			}
		};
	};

	var flowStatusInfer = function(data) {
		return {
			next: map[data.flowStatus],
			payload: {
				html: data.html
			}
		};
	};

	var map = {};
	map[AQService.PreQualificationFlowStatus.Successful] = 'success';
	map[AQService.PreQualificationFlowStatus.Failed] = 'fail';
	map[AQService.PreQualificationFlowStatus.LineOptions] = 'line-options';
	map[AQService.PreQualificationFlowStatus.OptionalAddresses] = 'optional-addresses';

	map[AQService.PreQualificationFlowStatus.Error] = 'error';

	module.exports = {
		initialize: function() {
			var component;

			this.aqService = new AQService();

			component = this;

			this.flow = new flow.FlowController(new flow.StackedFlowPresenter(this), {
				form: {
					statik: true,
					infer: function(data) {
						return {
							next: 'spinner',
							payload: {
								html: data.html
							}
						};
					}
				},
				spinner: {
					statik: true,
					infer: flowStatusInfer
				},
				fail: {
					infer: finishInfer
				},
				'line-options': {
					infer: flowStatusInfer
				},
				'optional-addresses': {
					infer: function(data) {
						if (data.address) {
							return {
								next: 'spinner',
								payload: {
								}
							};
						}
						return flowStatusInfer(data);
					}
				},
				error: {
					infer: finishInfer
				},
				success: {
					infer: finishInfer
				}
			}, component.$events);
		},

		finish: function() {
			var signal = this.flow.data.availableDslOfferIds ? 'address-qualification.success' : 'address-qualification.fail';
			var SCROLL_TO = 200;
			var SCROLL_OFFSET = -60;

			this.$tools.data.pubsub.publish(signal, this.flow.data);

			if (this.$tools.browser.isMobile) {
				scrollTo(this.$tools.dom.find('.scroll-to-target-0'), SCROLL_TO, { offset: SCROLL_OFFSET });
			} else {
				scrollTo(this.$tools.dom.find('.section--dsl--plan'), SCROLL_TO, { offset: SCROLL_OFFSET });
			}
		},

		ready: function() {
			this.$events.on('activateStep $this', this.onActivateStep.bind(this));
			this.flow.startWith('form');
		},
		onActivateStep: function() {
			var el = this.$el.find('.address-title');

			if (this.flow.data.address) {
				el.text(this.aqService.stringifyAddress(this.flow.data.address));
			}
		}
	};


/***/ },

/***/ 676:
/***/ function(module, exports) {

	'use strict';

	var FORMATS = [
		':StreetName :HouseNumber:HouseLetter, :Floor :DoorNumber',
		':StreetName :HouseNumber:HouseLetter, :Floor',
		':StreetName :HouseNumber:HouseLetter, :DoorNumber',
		':StreetName :HouseNumber:HouseLetter',
		':StreetName :HouseNumber, :Floor :DoorNumber',
		':StreetName :HouseNumber, :Floor',
		':StreetName :HouseNumber, :DoorNumber',
		':StreetName :HouseNumber'
	];

	var QualifyAddressService = module.exports = function(pageID) {
		this.pageID = pageID;
	};

	var PreQualificationFlowStatus = module.exports.PreQualificationFlowStatus = {
		InProgress: 1,
		Successful: 2,
		Failed: 3,
		LineOptions: 4,
		OptionalAddresses: 5,
		Error: 6
	};
	QualifyAddressService.prototype.start = function(address, prevPreQualificationId) {
		var dfd = app.core.q.defer();

		var canceled = false;

		dfd.catch(function(data) {
			if (data.canceled) {
				canceled = true;
			}
		});
		address.pageId = this.pageID;

		address.prevPreQualificationId = prevPreQualificationId;

		app.core.data.post(TN.config.dsl.services.startPreQualificationUrl, address)
			.then(function(response) {
				if (canceled) {
					return;
				}

				if (response.success) {
					this._ping(response.data.Id, dfd, function() {
						return canceled;
					});
				} else {
					dfd.reject({
						errorMessages: response.errorMessages,
						canceled: false,
						html: response.data.html,
						flowStatus: PreQualificationFlowStatus.Error
					});
				}
			}.bind(this));
		return dfd;
	};

	QualifyAddressService.prototype._ping = function(preQualificationResultId, dfd, returnIfCancellationRequested) {
		return app.core.data.post(
			TN.config.dsl.services.getPreQualificationUrl,
			{
				preQualificationResultId: preQualificationResultId,
				pageId: this.pageID
			}
		).then(function(response) {
			var TIMEOUT_PING = 500;
			if (returnIfCancellationRequested()) {
				return;
			}

			if (response.success) {
				if (response.data) {
					dfd.resolve(response.data);
				} else {
					setTimeout(function() {
						this._ping(preQualificationResultId, dfd, returnIfCancellationRequested);
					}.bind(this), TIMEOUT_PING);
				}
			} else {
				dfd.reject({
					errorMessages: response.errorMessages,
					canceled: false,
					html: response.data.html,
					flowStatus: PreQualificationFlowStatus.Error
				});
			}
		}.bind(this));
	};


	QualifyAddressService.prototype.stringifyAddress = function(addressObj) {
		var index;
		var format;
		var expected = 0;
		var got = 0;
		var formatted;


		var formats = FORMATS.sort(function(_a, _b) {
			return (_a.length < _b.length) ? 1 : (_a.length > _b.length) ? -1 : 0;
		});


		for (index = 0; index < formats.length; index++) {
			format = formats[index];

			formatted = format.replace(/(:[a-zA-Z-_]{1,})/g, function(match) {
				expected += 1;

				match = match.substr(1);

				if (!!addressObj[match]) {
					got += 1;
					return addressObj[match];
				}
				return '';
			});

			if (expected === got) {
				return formatted;
			}
		}

		return '';
	};


/***/ },

/***/ 677:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
		},
		events: {
			'click .continue': 'onProceedClick',
			'click .testNewAddress': 'onTestNewAddressClick'
		},
		optionCode: function() {
			return this.$el.find('input[name="line-option"]:checked').val();
		},
		onTestNewAddressClick: function() {
			this.flow.reset('form');

			return false;
		},
		onProceedClick: function() {
			var btnDfd = this.$components.continue.activityIndicator();
			var dfd = this.$tools.q.defer();

			this.$tools.data.post(this.$tools.globalConfigs('TN.config.dsl.services.saveResolutionOptionUrl'), {
				preQualificationResultId: this.flow.data.preQualificationResultId,
				optionCode: this.optionCode(),
				pageId: this.flow.data.pageId
			}).then((function(response) {
				if (response.success) {
					dfd.resolve(response.data);
				} else {
					dfd.reject(response.data);
				}
			}));

			dfd.then(function(data) {
				delete this.flow.data.availableDslOfferIds;

				this.flow.next({
					html: data.Html,
					flowStatus: data.FlowStatus,
					availableDslOfferIds: data.AvailableDslOfferIds
				})
				.finally(btnDfd.reject.bind(btnDfd));
			}.bind(this));

			return false;
		}
	};


/***/ },

/***/ 678:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var analyticsService = __webpack_require__(412);

	module.exports = {
		initialize: function() {
			this.$streetName = this.$el.find('#AddressData_StreetName');

			this.$tools.data.pubsub.subscribe('address-qualification.qualify', function() {
				this.$events.trigger('show');
			}.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.success', function() {
				this.$events.trigger('hide');
			}.bind(this));

			this.$events.on('onShow $this', function() {
				if (this.$options.analytics && this.$options.analytics.data) {
					analyticsService.view(this.$options.analytics.data);
				}

				this.$streetName.focus();
				this.$tools.data.pubsub.publish('address-qualification.showModal');
			}.bind(this));

			this.$events.on('onHide $this', function() {
				this.$tools.data.pubsub.publish('address-qualification.reset');
			}.bind(this));
		}
	};


/***/ },

/***/ 679:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click .testNewAddress': 'onTestNewAddressClick',
			'click .testSelectedAddress': 'onTestSelectedAddressClick',
			'click .continueAnyway': 'onContinueAnywayClick'
		},

		address: function() {
			var address = this.$tools.dom.find('option:selected', this.$el).data();
			var clone = {};

			Object.keys(address).forEach(function(key) {
				var cloneKey = key.charAt(0).toUpperCase() + key.slice(1);

				clone[cloneKey] = address[key];
			});

			return clone;
		},

		onContinueAnywayClick: function() {
			this.$tools.data.post(this.$tools.globalConfigs('TN.config.dsl.services.proceedWithUnknownAddressUrl'), {
				preQualificationResultId: this.flow.data.preQualificationResultId,
				pageId: this.flow.data.pageId
			}).finally(function(response) {
				if (response.success && response.data) {
					delete this.flow.data.availableDslOfferIds;
					delete this.flow.data.address;

					this.flow.next({
						html: response.data.Html,
						flowStatus: response.data.FlowStatus,
						availableDslOfferIds: response.data.AvailableDslOfferIds
					});
				}
			}.bind(this));

			return false;
		},

		onTestNewAddressClick: function() {
			this.flow.reset('form');

			return false;
		},

		onTestSelectedAddressClick: function() {
			this.flow.next({
				address: this.address(),
				oldPreQualificationId: this.flow.data.preQualificationResultId
			});

			return false;
		}
	};


/***/ },

/***/ 680:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var AQService = __webpack_require__(676);

	module.exports = {
		initialize: function() {
			var transferOnCancel = true;

			this.$tools.data.pubsub.subscribe('address-qualification.reset', function() {
				if (this.aqDfd) {
					this.aqDfd.reject({
						canceled: true
					});

					transferOnCancel = false;
				}
			}.bind(this));

			this.$events.on('activate $this', function() {
				var aqService = new AQService(this.flow.data.pageId);

				this.$tools.data.pubsub.publish('address-qualification.start');

				this.willShow();

				this.aqDfd = aqService.start(this.flow.data.address, this.flow.data.oldPreQualificationId);
				this.aqDfd.then(function(data) {
					this.flow.next({
						availableDslOfferIds: data.AvailableDslOfferIds,
						preQualificationResultId: data.Id,
						html: data.Html,
						flowStatus: data.FlowStatus
					});
					hide.call(this);
					return data;
				}.bind(this))

					.catch(function(data) {
						if (data.canceled) {
							if (transferOnCancel) {
								this.flow.reset('form');
							}
						} else {
							this.flow.next({
								flowStatus: data.flowStatus,
								html: data.Html
							});
						}
						hide.call(this);
						return data;
					}.bind(this));

				function hide() {
					delete this.flow.data.oldPreQualificationId;
					this.willHide();
				}
			}.bind(this));
		},
		events: {
			'click .cancel-aq': 'onCancelAQClick'
		},
		onCancelAQClick: function() {
			this.aqDfd.reject({
				canceled: true
			});

			return false;
		},
		willShow: function() {
			this.index = 0;

			this.$components.promoTexts.$children[this.index % this.$components.promoTexts.$children.length].show();

			this.intervalID = setInterval((function(){
				this.$components.promoTexts.$children[this.index % this.$components.promoTexts.$children.length].hide();
				this.$components.promoTexts.$children[++this.index % this.$components.promoTexts.$children.length].show();
			}).bind(this), parseInt(this.$components.promoTexts.$options.speed, 10));
		},
		willHide: function() {
			if (!this.intervalID) {
				return;
			}

			clearInterval(this.intervalID);

			this.$components.promoTexts.$children.forEach(function(component) {
				component.hide();
			});
		}
	};


/***/ },

/***/ 681:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click testAgain': 'onTestAgainClick',
			'click continue': 'onContinueClick'
		},

		onContinueClick: function(event) {
			event.preventDefault();

			this.flow.next();
		},

		onTestAgainClick: function(event) {
			event.preventDefault();

			delete this.flow.data.preQualificationResultId;

			this.flow.reset('form');
		}
	};


/***/ },

/***/ 682:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var flow = __webpack_require__(442);

	module.exports = {
		initialize: function() {
			var component = this;

			this.flow = new flow.FlowController(new flow.SheetFlowPresenter(this), {
				buyVOIP: {
					componentContentURL: TN.config.dsl.services.voipLines,
					infer: function() {
						return {
							next: 'finish',
							payload: {}
						};
					}
				},
				dslInstallation: {
					componentContentURL: TN.config.dsl.services.dslInstallationState,
					infer: function(data) {
						var dfd = component.$tools.q.defer();

						component.$tools.data.post(
							component.$tools.globalConfigs('TN.config.dsl.services.getPstnValueActionUrl'),
							{
								preQualificationResultId: component.flow.data.preQualificationResultId
							}
						).then(function(resp) {
							if (resp.data && resp.data.hasPstn) {
								dfd.resolve({
									next: 'pstnValidation',
									payload: {
										preQualificationResultId: data.preQualificationResultId
									}
								});
							} else {
								dfd.resolve({
									next: 'buyVOIP',
									payload: {
										preQualificationResultId: data.preQualificationResultId,
										prodOfferingId: data.dsl.id
									}
								});
							}
						});

						return dfd.promise();
					}
				},
				dslPlans: {
					statik: true,
					infer: function(data) {
						return {
							next: 'dslInstallation',
							payload: {
								preQualificationResultId: data.preQualificationResultId,
								gig: true
							}
						};
					}
				},
				pstnValidation: {
					componentContentURL: TN.config.dsl.services.dslPstnValidationStepUrl,
					infer: function(data) {
						return {
							next: 'buyVOIP',
							payload: {
								preQualificationResultId: data.preQualificationResultId,
								prodOfferingId: data.dsl.id
							}
						};
					}
				},
				prequalificationDialogs: {
					infer: function(data) {
						return {
							next: 'dslPlans',
							payload: {
								preQualificationResultId: data.preQualificationResultId
							}
						};
					}
				}
			});
		},
		ready: function() {
			this.flow.startWith('dslPlans');
		},
		events: {
			'click #preQTrigger': 'onPreQTriggerClick'
		},
		onPreQTriggerClick: function() {
			this.$tools.data.pubsub.publish('address-qualification.reset-wanted-product');
		},
		finish: function(obj) {
			var data = {
				ProductId: obj.dsl.id,
				Quantity: 1,
				Chars: [
					{
						SpecificationCode: 'preQId',
						Value: obj.preQualificationResultId
					}
				],
				RelatedProducts: []
			};

			if (obj.voip && obj.voip.id) {
				data.RelatedProducts.push({
					ProductId: obj.voip.id,
					Quantity: 1,
					RelatedProducts: obj.voip_addons.map(function(addon) {
						return {
							ProductId: addon,
							Quantity: 1
						};
					})
				});
			}

			return this.$tools.data.ajax({
				url: TN.config.dsl.services.routers += '?prodOfferingId=' + data.ProductId,
				type: 'GET',
				contentType: 'application/json'
			}).then(function(response) {
				if (response.data.routers[0].ProductId) {
					data.RelatedProducts.push({
						ProductId: response.data.routers[0].ProductId,
						Quantity: 1,
						RelatedProducts: null
					});
				}
				return this.$tools.data.ajax({
					url: TN.config.dsl.services.addToBasket,
					type: 'POST',
					contentType: 'application/json',
					data: JSON.stringify(data)
				});
			}.bind(this));
		}
	};


/***/ },

/***/ 683:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this._checkProceed();
			if (this.$components.dslTerminations) {
				this.$components.dslTerminations.forEach(function(item) {
					item.$events.on('dsl.saved $this', this._checkProceed.bind(this));
				}, this);
			}
		},
		_checkProceed: function() {
			if (this.$components.dslTerminations) {
				if (this.$components.dslTerminations.every(function(event) {
					return event.$components.dslTermination.$options.canProceed;
				})) {
					this.$components.form[0].$components.dslProceed.enable();
				} else {
					this.$components.form[0].$components.dslProceed.disable();
				}
			} else {
				this.$components.form[0].$components.dslProceed.enable();
			}
		}
	};


/***/ },

/***/ 684:
/***/ function(module, exports) {

	'use strict';

	var TIMEOUT_PING = 1000;
	module.exports = {
		events: {
			'click .termination-validate': 'onProceedClick',
			'change input': '_resetButton',
			'change select': '_resetButton'
		},
		initialize: function() {
			this.checkPrevalidationQty = 0;
		},
		ready: function() {
			if (this.$components.dslTermination.$options.canProceed) {
				this.$components.dslTermination.$components.dslTerminationSend.setAsLoaded();
			}
		},
		onProceedClick: function(event) {
			var loading = this.$components.dslTermination.$components.dslTerminationSend.activityIndicator();
			event.preventDefault();

			if (!this.$components.dslTermination.valid()) {
				this._hasError(loading);
				return false;
			}
			this.$components.dslTermination.$components.preValidationWarning.close();
			this.checkPrevalidationQty++;

			this.$components.dslTermination.submitAsync()
				.then(function(res) {
					if (res.success) {
						if (res.data.State == 1) {
							this._saved(loading);
						} else {
							this._waitProcess(res.data)
								.then(function() {
									this._saved(loading);
								}.bind(this))

								.catch(function() {
									this._hasError(loading);
								}.bind(this));
						}
					} else {
						this._hasError(loading);
					}
				}.bind(this));

		},
		_waitProcess: function(data) {
			var dfd = this.$tools.q.defer();
			this._pingProcess(data, dfd);
			return dfd.promise();
		},
		_pingProcess: function(data, dfd) {
			this.$tools.data.post(this.$components.dslTermination.$options.prevalidationStatusUrl, data)
				.then(
					function(res) {
						if (res.success) {
							if (res.data.State === 1) {
								dfd.resolve();
							} else if(res.data.State === 2) {
								dfd.reject();
							}else {
								setTimeout(function() {
									this._pingProcess(res.data, dfd);
								}.bind(this), TIMEOUT_PING);
							}
						} else {
							dfd.reject();
						}
					}.bind(this)
				);
		},
		_saved: function(loading) {
			loading.resolve();
			this.$components.dslTermination.$options.canProceed = true;
			this.$events.trigger('dsl.saved');
		},
		_hasError: function(loading) {
			var preValidationWarning = this.$components.dslTermination.$components.preValidationWarning;

			loading.reject();
			this.$components.dslTermination.$options.canProceed = false;

			if (this.checkPrevalidationQty === 1) {
				preValidationWarning.setText(this.$components.dslTermination.$options.messageTry);
			} else {
				preValidationWarning.setText(this.$components.dslTermination.$options.messageAllow);
				this.$components.dslTermination.$options.canProceed = true;
			}

			this.$events.trigger('dsl.saved');
			this.$components.dslTermination.$components.preValidationWarning.open();

		},
		_resetButton: function() {
			this.$components.dslTermination.$options.canProceed = false;
			this.$components.dslTermination.$components.dslTerminationSend.resetLoading();
			this.checkPrevalidationQty = 0;
			this.$components.dslTermination.$components.preValidationWarning.close();
			this.$events.trigger('dsl.saved');
		}
	};


/***/ },

/***/ 685:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		pageWrapper:  '.section--oncanvas'
	};

	var CLASSES = {
		familySection: 'family-section',
		planSpinner: 'plan-spinner',
		summarySpinner: 'spinner-active'
	};

	var requestCache = {};

	module.exports = {
		initialize: function() {
			this._stockType = null;
		},

		ready: function() {

			this._memberTemplate = this.$components.memberTemplate.$el.html();

			this._scrollableContainer = document.querySelector(SELECTORS.pageWrapper);

			this._scrollableContainer.classList.add(CLASSES.familySection);
			window.addEventListener('scroll', this._onMobileScroll.bind(this));

			this.$components.modalWizard.addView('subscriptions');
			this.$components.modalWizard.addView('phoneDetails');
			this.$components.modalWizard.addView('phonesList');

			this._load('phonesList', this._generatePhonesListUrl(this.$options.defaultSubscriptionId), true);

			this._prepareMembersViews();
			this._showMobilePriceSummary();
		},

		events: {
			'click $submitButton': '_submit',
			'click seePaymentDetails': '_onSeePaymentDetail',

			'add                $$familyMembers': '_onMemberAdd',
			'remove             $$familyMembers': '_onMemberRemove',
			'addPhone           $$familyMembers': '_onAddMemberPhone',
			'removePhone        $$familyMembers': '_onRemoveMemberPhone',
			'changeSubscription $$familyMembers': '_onMemberSubscriptionChange',

			'subscriptionSelected $modalWizard $subscriptions': '_onSubscriptionSelected',

			'phoneSelected      $modalWizard $phonesList': '_onPhoneSelected',
			'storeChanged       $modalWizard $phonesList': '_onStoreChangedInPhonesList',

			'backToPhonesList   $modalWizard $phoneDetails': '_onBackToPhonesList',
			'phoneConfirmed     $modalWizard $phoneDetails': '_onPhoneConfirmed',
			'storeChanged       $modalWizard $phoneDetails': '_onStoreChangedInPhoneDetails'
		},

		_animateMemberSummary: function() {
			// remove 'closed' class from member summary items for each member which isActive()
			this.$components.familyMembers.forEach(function(member, index) {
				this.$elements.memberSummary.eq(index).toggleClass('closed', !member.isActive());
			}.bind(this));
		},

		_onMobileScroll: function() {
			this._showMobilePriceSummary();
		},

		_showMobilePriceSummary: function() {
			var elementOffset = this.$elements.priceSummaryAnchor.offset().top;
			var bodyHeight = this.$tools.dom.find('body').height();

			this.$elements.mobilePriceSummary.toggleClass('show', (elementOffset - bodyHeight) > document.body.scrollTop);
		},

		_onSeePaymentDetail: function() {
			var elementOffset = this.$elements.priceSummaryAnchor.offset().top;
			// FIXME: need to make data-selector for mobile menu
			var menuHeight = this.$tools.dom.find('.nav-mobile').height();
			var MARGIN_TOP = 10;

			this._scrollableContainer.scrollTop += elementOffset - menuHeight - MARGIN_TOP;
			this._showMobilePriceSummary();
		},

		// Event Handlers

		_onMemberAdd: function() {
			this._animateMemberSummary();
			this._recalculate([]);
		},

		_onMemberRemove: function(event, data) {
			data.member.setActive(false);
			this._animateMemberSummary();

			data.promise
				.then(function() {
					var deletedMemberIndex = this._getMemberIndex(data.member);
					var parent = data.member.$el.parent();
					this.destroyChild(data.member);
					parent.remove();
					this._appendEmptyMember();

					this._recalculate(this.$components.familyMembers.slice(deletedMemberIndex));
				}.bind(this));
		},

		_onAddMemberPhone: function(event, data) {
			this._currentMember = data.member;

			this._openPhonesList();
		},

		_onPhoneSelected: function(event, data) {
			this._currentPhoneIdentifyCode = data.identifyCode;
			this._openPhoneDetails(this._currentPhoneIdentifyCode);
		},

		_onStoreChangedInPhonesList: function(event, data) {
			this._stockType = data.stockType;

			this._openPhonesList();
		},

		_onStoreChangedInPhoneDetails: function(event, data) {
			this._stockType = data.stockType;

			this._openPhoneDetails(this._currentPhoneIdentifyCode);
		},

		_onBackToPhonesList: function() {
			this._backToPhonesList();
		},

		_onPhoneConfirmed: function(event, data) {
			this._currentMember.setPhone(data);

			this.$components.modalWizard.close();

			this._recalculate([this._currentMember]);
		},

		_onRemoveMemberPhone: function(event, data) {
			this._currentMember = data.member;

			this._recalculate([this._currentMember]);
		},

		_onMemberSubscriptionChange: function(event, data) {
			this._currentMember = data.member;

			if (this._currentMember.hasPhone()) {
				this._openPhoneDetails();
			} else {
				this._openSubscriptions();
			}
		},

		_onSubscriptionSelected: function(event, data) {
			this.$components.modalWizard.close({ to: 'top' });

			this._currentMember.setSubscription(data);

			this._recalculate([this._currentMember]);
		},


		// recalculate

		_recalculate: function(membersToRefresh) {
			this.$el.addClass(CLASSES.summarySpinner);

			membersToRefresh.forEach(function(member) {
				member.$el.addClass(CLASSES.planSpinner);
			});

			return this.$tools.data.post(this.$options.recalculateUrl, this._getData())
				.then(function(response) {
					var promises;

					if (!response.success) {
						this._onRecalculateError(response);
						return;
					}

					promises = membersToRefresh.map(function(member) {
						var index = this._getMemberIndex(member);
						var partial = response.data.membersHtml[index];

						return this.html(partial, member.$el.parent());
					}.bind(this));

					promises.push(this.html(response.data.summaryHtml, this.$elements.summaryBlock));

					return this.$tools.q.all(promises);
				}.bind(this))

				.then(function() {
					this._prepareMembersViews();
					this._onMobileScroll();
				}.bind(this))

				.catch(this._onRecalculateError.bind(this))

				.finally(function() {
					this.$el.removeClass(CLASSES.summarySpinner);

					membersToRefresh.forEach(function(member) {
						member.$el.removeClass(CLASSES.planSpinner);
					});

					this._prepareMembersViews();
				}.bind(this));
		},

		_getMemberIndex: function(member) {
			return this.$components.familyMembers.indexOf(member);
		},

		_onRecalculateError: function() {
			// ToDo: Implement error handling
		},

		// submit

		_submit: function(event, mixedProductsDecision) {
			var data = this._getData();

			if (mixedProductsDecision) {
				data.mixedProductsDecision = mixedProductsDecision;
			}

			this.$components.submitButton.activityIndicator();

			this.$tools.data.post(this.$options.submitUrl, data)
				.then(this._onSubmitSuccess.bind(this))
				.catch(this._onSubmitError.bind(this));
		},

		_onSubmitSuccess: function(response) {
			if (response.success) {
				this.$tools.util.redirect(this.$options.redirectToBasketUrl);
			} else if (response.errorMessages && response.errorMessages.length) {
				this._onSubmitError(response);
			} else if (this._getProductsChecker().hasMixedProducts(response)) {
				response.data.callback = this._submit.bind(this);
				this._getProductsChecker().checkMixedProducts(response, this.$components.submitButton);
			}
		},

		_onSubmitError: function() {
			this.$components.submitButton.resetLoading();
			// ToDo: handle error here if needed
		},

		// Handle modal windows

		_openSubscriptions: function() {
			var subscriptions;
			this.$components.modalWizard.open('subscriptions', {
				from: 'top'
			});

			subscriptions = this.$components.modalWizard.$components.subscriptions;
			subscriptions.setSubscription(this._currentMember.getSubscriptionId());
			subscriptions.setHeader(this._currentMember.$options.subscriptionListHeader);
			subscriptions.setDiscountText(this._currentMember.$options.discountInfoHeader);

			this.$components.modalWizard.setCloseAnimation('top');
		},

		_openPhonesList: function() {
			var subscriptionID = this._currentMember.getSubscriptionId();
			var promise = this._load('phonesList', this._generatePhonesListUrl(subscriptionID), true);

			promise
				.then(function() {
					var phonesList = this.$components.modalWizard.$components.phonesList;
					phonesList.setHeader(this._currentMember.$options.phoneListHeader);
					phonesList.setDiscountText(this._currentMember.$options.discountInfoHeader);
				}.bind(this))

				.catch(function() {
					this.$components.modalWizard.close();
				}.bind(this));

			this.$components.modalWizard.open('phonesList', {
				promise: promise
			});
		},

		_backToPhonesList: function() {
			var subscriptionID = this._currentMember.getSubscriptionId();
			var promise = this._load('phonesList', this._generatePhonesListUrl(subscriptionID), true);

			promise
				.then(function() {
					var phonesList = this.$components.modalWizard.$components.phonesList;
					phonesList.setHeader(this._currentMember.$options.phoneListHeader);
					phonesList.setDiscountText(this._currentMember.$options.discountInfoHeader);
				}.bind(this))

				.catch(function() {
					this.$components.modalWizard.close();
				}.bind(this));

			this.$components.modalWizard.open('phonesList', {
				promise: promise,
				from: 'left',
				to: 'right'
			});
		},

		_openPhoneDetails: function(identifyCode) {
			var promise = this._load('phoneDetails', this._generatePhoneDetailsUrl(identifyCode));

			promise
				.then(function() {
					this._getView('phoneDetails').setHeader(this._currentMember.$options.phoneDetailsHeader);
					this._getView('phoneDetails').setDiscountText(this._currentMember.$options.discountInfoHeader);
				}.bind(this))

				.catch(function() {
					this.$components.modalWizard.close();
				}.bind(this));

			this.$components.modalWizard.open('phoneDetails', {
				promise: promise,
				from: 'right',
				to: 'left'
			});
		},


		// private methods
		/**
		desc: >
			interate over members and set selectable only the member next to the last
			active member.
			Prevent deletion of the first member if only one member is active
		*/
		_prepareMembersViews: function() {
			var isPreviousActive = true;
			var activeCount = 0;
			var members = this.$components.familyMembers;

			members.forEach(function(member) {
				member.setSelectable(true);
				member.setDeletable(true);

				if (!isPreviousActive) {
					member.setSelectable(false);
				}

				if (member.isActive()) {
					activeCount++;
				} else {
					isPreviousActive = false;
				}
			});

			if (activeCount <= 1) {
				this.$components.familyMembers[0].setDeletable(false);
			}
		},

		_appendEmptyMember: function() {
			this.html(this._memberTemplate, this.$elements.membersBlock, 'beforeend');
		},

		_generatePhonesListUrl: function(subscriptionId) {
			var params = {
				subscriptionId: subscriptionId,
				stockType: this._stockType || ''
			};

			return this.$tools.util.addParamsToUrl(this.$options.getPhonesListBaseUrl, params);
		},

		_generatePhoneDetailsUrl: function(identifyCode) {
			var params = {
				identifyCode: identifyCode || this._currentMember.getIdentifyCode(),
				subscriptionId: this._currentMember.getSubscriptionId(),
				installmentId: this._currentMember.getInstallmentId(),
				installmentCycleCount: this._currentMember.getInstallmentCycleCount(),
				insuranceId: this._currentMember.getInsuranceId(),
				stockType: this._stockType || ''
			};

			return this.$tools.util.addParamsToUrl(this.$options.getPhoneDetailsBaseUrl, params);
		},

		_getData: function() {
			var members = this.$components.familyMembers.map(function(member) {
				return member.getData();
			});

			return {
				FamilyTreeMembers: members,
				Configuration: this.$components.configurationForm.serialize()
			};
		},

		_getView: function(alias) {
			return this.$components.modalWizard.$components[alias];
		},

		_getProductsChecker: function() {
			return this.$extensions['products-checker'];
		},

		_load: function(alias, url, withCache) {
			var view = this._getView(alias);

			if (withCache && requestCache[url]) {
				view.html(requestCache[url]);

				return this.$tools.q.when();
			}

			return view.load(url)
				.then(function(response) {
					if (withCache) {
						requestCache[url] = response.data.html;
					}
				});
		}
	};


/***/ },

/***/ 686:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.$components.hasFamilyOffers.show();
		}
	};


/***/ },

/***/ 687:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		opened: 'opened',
		closed: 'closed',
		inactive: 'inactive',
		last: 'last-member'
	};

	module.exports = {
		initialize: function() {
			this._data = {};
		},

		ready: function() {
			this._updateData(this.$components.memberForm.serialize());

			this._data.IsActive = this._data.IsActive === 'True';

			this._deletable = true;
			this._selectable = true;
		},

		events: {
			'click addPhoneLink': '_onAddPhone',
			'click changePhoneLink': '_onAddPhone',
			'click removePhoneLink': '_onRemovePhone',
			'click changeSubscriptionLink': '_onChangeSubscriptionLinkClick',
			'click removeMember': '_onRemoveMemberClick',
			'click addMember': '_onAddMemberClick'
		},

		setDeletable: function(value) {
			this._deletable = Boolean(value);

			this.$el.toggleClass(CLASSES.last, !value);
		},

		setSelectable: function(value) {
			this._selectable = Boolean(value);

			this.$el.toggleClass(CLASSES.inactive, !value);
		},

		getData: function() {
			return this._data;
		},

		setPhone: function(phoneDetails) {
			this._updateData(phoneDetails);
		},

		setSubscription: function(subscriptionData) {
			this._updateData(subscriptionData);
		},

		getSubscriptionId: function() {
			return this._data.SubscriptionId;
		},

		getInstallmentId: function() {
			return this._data.InstallmentId;
		},

		getInstallmentCycleCount: function() {
			return this._data.InstallmentCycleCount;
		},

		getIdentifyCode: function() {
			return this._data.IdentifyCode;
		},

		getName: function() {
			return this._data.Name;
		},

		getInsuranceId: function() {
			return this._data.InsuranceProductId;
		},

		hasPhone: function() {
			return Boolean(this._data.MainBasketInputId);
		},

		isActive: function() {
			return this._data.IsActive;
		},

		setActive: function(value) {
			this._data.IsActive = value;
			this.$components.memberForm.$el[0].elements['FamilyTreeMember.IsActive'].value = value ? 'True' : 'False';
		},

		_onAddMemberClick: function(event) {
			event.preventDefault();

			if (!this._selectable) {
				return;
			}

			this.setActive(true);

			this.$el.addClass(CLASSES.opened);
			this.$el.removeClass(CLASSES.closed);
			this.$events.trigger('add');
		},

		_onAddPhone: function(event) {
			event.preventDefault();

			this.$events.trigger('addPhone', { member: this });
		},

		_onRemovePhone: function(event) {
			event.preventDefault();

			this._removePhone();

			this.$events.trigger('removePhone', { member: this });
		},

		_onChangeSubscriptionLinkClick: function(event) {
			event.preventDefault();

			this.$events.trigger('changeSubscription', { member: this });
		},

		_onRemoveMemberClick: function(event) {
			var dfd = this.$tools.q.defer();

			event.preventDefault();

			if (!this._deletable) {
				return;
			}

			this.$el[0].addEventListener('transitionend', function(ev) {
				if (ev.target !== ev.currentTarget) {
					return;
				}
				dfd.resolve();
			}, false);

			this.$el.addClass(CLASSES.closed).removeClass(CLASSES.opened);
			this.$events.trigger('remove', { member: this, promise: dfd.promise() });
		},

		_updateData: function(changedData) {
			this.$tools.util.extend(this._data, changedData);
		},

		_removePhone: function() {
			this._data.MainBasketInputId = '';
		}
	};


/***/ },

/***/ 688:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var modalBoxHelper = __webpack_require__(402);
	var ModalView = __webpack_require__(689);

	/**
	name: Modal Wizard
	type: ui
	desc: >
		Controls several popups in Lightbox. Adds overlay around the content.
		Content will be centered horizontally and vertically. Can be closed by click on overlay.
		You need to call `addView(alias) to let wizard know about the popup
		Then you can switch popups by calling `open(alias, [options])` method.
		And finally close the wizard with `close([options])`
		You should add base element for each popup with `data-element="{alias}"` inside wizard to be able to control popup
	*/
	module.exports = {
		initialize: function() {
			this._views = {};

			this.$overlay = this.$elements.wizardOverlay;
			this._closeToAnimation = null;

			modalBoxHelper.attachEvents(this.$elements.wizardOverlay);
		},

		events: {
			'click wizardOverlay': '_onOverlayClick',
			'close $$modalViews': '_onCloseClick'
		},

		/**
			name: addView
			desc: >
				Tells wizard about the popup initialization.
				if `url` is set then it loads popup content to the component with given alias
		*/
		addView: function(alias) {
			var viewHolder;

			if (this._views[alias]) {
				this.$tools.logger.error(alias + ' view already exists in wizard.');

				return;
			}

			viewHolder = this.$elements[alias];

			this._views[alias] = new ModalView(viewHolder);
		},

		/**
			desc: Shows page with specified alias
			args:
				alias: (string) a view alias to open
				options: (object) a configuration object for the page.
		*/
		open: function(alias, options) {
			options = options || {};
			options.promise = options.promise || this.$tools.q.when();
			this._currentPromise = options.promise;

			this._showModal();

			if (this._currentView) {
				this._hideView(this._currentView, options.to);
			}

			this._currentView = this._views[alias];

			this.$elements.wizardSpinner.show();

			this._currentPromise
				.then(function() {
					// show current view only if the resolved promise match the currentView.promise
					if (this._currentPromise === options.promise) {
						this._showView(this._currentView, options.from);
					} else {
						this.$tools.logger.warn('Resolved promise does not match the currentView');
					}
				}.bind(this))

				.finally(function() {
					this.$elements.wizardSpinner.hide();
				}.bind(this));
		},

		/**
			name: close
			desc: >
				Closes wizard
				If `options.to` is given - uses it as animation for last shown popup
		 */
		close: function(options) {
			if (options && options.to) {
				this._currentView.doAfterAnimation(this._hideModal.bind(this));
				this._hideView(this._currentView, options.to);
			} else {
				this._hideModal();
			}
		},

		/**
			name: setCloseAnimation
			desc: Sets direction to slide modal before closing
		 */
		setCloseAnimation: function(toPosition) {
			this._closeToAnimation = toPosition || null;
		},

		_onOverlayClick: function(event) {
			// ToDo: Fix markup to listen only for direct clicks on overlay
			var elementsToCheck = [
				event.target,
				event.target.parentNode
			];

			if (elementsToCheck.indexOf(this.$elements.wizardOverlay[0]) !== -1) {
				this.close({ to: this._closeToAnimation });
			}
		},

		_onCloseClick: function() {
			this.close({ to: this._closeToAnimation });
		},

		_showView: function(view, fromPosition) {
			this.$elements.wizardSpinner.hide();

			view
				.removeAnimation()
				.move(fromPosition)
				.show();

			if (!fromPosition) {
				return;
			}

			requestAnimationFrame(function() {
				view
					.addAnimation()
					.move();
			});
		},

		_hideView: function(view, toPosition) {
			if (!toPosition) {
				hideView();

				return;
			}

			view
				.doAfterAnimation(hideView)
				.addAnimation()
				.move(toPosition);

			function hideView() {
				view
					.removeAnimation()
					.hide();
			}
		},

		_showModal: function() {
			this.show();

			modalBoxHelper.showOverlay(this.$elements.wizardOverlay);
		},

		_hideModal: function() {
			modalBoxHelper.hideOverlay(this.$elements.wizardOverlay);

			Object.keys(this._views).forEach(function(alias) {
				this._views[alias]
					.removeAnimation()
					.hide()
					.move();
			}, this);

			this._currentView = null;
			this._currentPromise = null;
			this._closeToAnimation = null;
			this.hide();
		}
	};


/***/ },

/***/ 689:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		animate: 'modal-wizard__animate',
		inactive: 'modal-wizard__inactive'
	};

	var POSITION_CLASSES = {
		right: 'modal-wizard__right',
		left: 'modal-wizard__left',
		top: 'modal-wizard__top'
	};

	module.exports = ModalView;

	function ModalView(holder) {
		this.holder = holder;
	}

	ModalView.prototype.hide = function() {
		this.holder.addClass(CLASSES.inactive);

		return this;
	};

	ModalView.prototype.show = function() {
		this.holder.removeClass(CLASSES.inactive);

		return this;
	};

	ModalView.prototype.addAnimation = function() {
		this.holder.addClass(CLASSES.animate);

		return this;
	};

	ModalView.prototype.removeAnimation = function() {
		this.holder.removeClass(CLASSES.animate);

		return this;
	};

	ModalView.prototype.move = function(position) {
		Object.keys(POSITION_CLASSES).forEach(function(key) {
			this.holder.removeClass(POSITION_CLASSES[key]);
		}.bind(this));

		if (position) {
			this.holder.addClass(POSITION_CLASSES[position]);
		}

		return this;
	};

	ModalView.prototype.doAfterAnimation = function(callback) {
		var holder = this.holder;

		holder[0].addEventListener('transitionend', animationCallback);

		function animationCallback(event) {
			if (event.propertyName !== 'transform') {
				return;
			}

			callback();
			holder[0].removeEventListener('transitionend', animationCallback);
		}

		return this;
	};


/***/ },

/***/ 690:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click backToPhonesList': '_onBackToPhonesClicked',
			'click closeButton': '_onCloseClicked',
			'phoneConfirmed $productDetailsBlock': '_onPhoneConfirmed',
			'storeChanged $productDetailsBlock': '_onStoreChanged'
		},

		setHeader: function(text) {
			this.$elements.modalHeader.html(text);
		},

		setDiscountText: function(text) {
			this.$elements.discountInfo.html(text);
		},

		_onBackToPhonesClicked: function() {
			this.$events.trigger('backToPhonesList');
		},

		_onPhoneConfirmed: function(event, data) {
			this.$events.trigger('phoneConfirmed', data);
		},

		_onStoreChanged: function(event, data) {
			this.$events.trigger('storeChanged', data);
		},

		_onCloseClicked: function() {
			this.$events.trigger('close');
		}
	};


/***/ },

/***/ 691:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'phoneSelected $productCategory': '_onPhoneSelected',
			'storeChanged $productCategory': '_onStoreChanged',
			'click closeButton': '_onCloseClicked'
		},

		setHeader: function(text) {
			this.$elements.modalHeader.html(text);
		},

		setDiscountText: function(text) {
			this.$elements.discountInfo.html(text);
		},

		_onPhoneSelected: function(event, data) {
			this.$events.trigger('phoneSelected', data);
		},

		_onStoreChanged: function(event, data) {
			this.$events.trigger('storeChanged', data);
		},

		_onCloseClicked: function() {
			this.$events.trigger('close');
		}
	};


/***/ },

/***/ 692:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'checked $$subscription': '_onSubscriptionSelected',
			'click closeButton': '_onCloseClicked'
		},

		setSubscription: function(subscriptionId) {
			this.$components.subscription.forEach(function(subscriptionComponent) {
				if (subscriptionComponent.$el.val() === subscriptionId) {
					subscriptionComponent.$el.prop('checked', true);
				}
			}, this);
		},

		setHeader: function(text) {
			this.$elements.modalHeader.html(text);
		},

		setDiscountText: function(text) {
			this.$elements.discountInfo.html(text);
		},

		_onSubscriptionSelected: function(event) {
			var tempData = event.data.component.$options;
			var data = {};
			var fieldMap = {
				SubscriptionId: 'subscriptionId',
				SubscriptionPrice: 'subscriptionPrice',
				SubscriptionName: 'subscriptionName'
			};

			Object.keys(fieldMap).forEach(function(field) {
				data[field] = tempData[fieldMap[field]];
			});

			this.$events.trigger('subscriptionSelected', data);
		},

		_onCloseClicked: function() {
			this.$events.trigger('close');
		}
	};


/***/ },

/***/ 693:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		subscriptionPanel: '[data-group="planListsGroup"]'
	};

	var CLASSES = {
		activeSubscriptionType: 'is-active'
	};

	module.exports = {
		initialize: function() {
			this.selectedPlan = {};
		},
		events: {
			'select $$planListsGroup': '_onSelectPlan',
			'click $$subscriptionType': '_onSubscriptionTypeChange',
			'changed $btlCheckbox': '_onBelowTheLineOptionChange'
		},
		ready: function() {
			this._productChecker = this.$extensions['products-checker'];
		},

		_onSelectPlan: function(event, planData) {
			this.selectedPlan = planData;
			this.$components.planListsGroup.forEach(function(planList){ planList.disableAll(); });
			this._addToBasket();
		},

		_addToBasket: function(event, mixedProductsDecision) {
			if (mixedProductsDecision) {
				this.selectedPlan.plan.mixedProductsDecision = mixedProductsDecision;
			}

			this.$tools.data.post(this.selectedPlan.url, this.selectedPlan.plan)
				.then(function(response) {
					if (response.success) {
						this.selectedPlan = {};
					} else if (this._productChecker && this._productChecker.hasMixedProducts(response)) {
						response.data.callback = this._addToBasket.bind(this);
						this._productChecker.checkMixedProducts(response, this.selectedPlan.button);
					} else {
						this.$components.planListsGroup.forEach(function(planList){ planList.resetAll(); });
						this._showError(response);
						this._resetLoading();
					}
				}.bind(this))

				.catch(function() {
					this.$components.planListsGroup.forEach(function(planList){ planList.resetAll(); });
					this._resetLoading();
				}.bind(this));
		},

		_resetLoading: function(){
			this.selectedPlan.button.resetLoading();
			this.selectedPlan = {};
		},

		_showError: function(error){
			if (error && this.$tools.helper.isObject(error) && error.errorMessages && error.errorMessages[0]) {
				this.$components.gsmError.setText(error.errorMessages[0]);
				this.$components.gsmError.open();
			}
		},

		_onBelowTheLineOptionChange: function() {
			this._switchSubscriptionsList(this._getActiveSubscriptionType());
			return false;
		},

		_onSubscriptionTypeChange: function(event) {
			this.$components.subscriptionType.forEach(function(subscriptionType) {
				subscriptionType.$el[0].classList.remove(CLASSES.activeSubscriptionType);
			});

			event.data.component.$el[0].classList.add(CLASSES.activeSubscriptionType);

			this._switchSubscriptionsList(event.data.component.$options.type);
			return false;
		},

		_switchSubscriptionsList: function(activeType) {
			if (this._isBelowTheLineChecked()) {
				activeType += '_btl';
			}

			this.hide(SELECTORS.subscriptionPanel);
			this.show('[data-alias="' + activeType + '"]');
			this.$el.find(SELECTORS.subscriptionPanel).removeClass(CLASSES.activeSubscriptionType);
			this.$el.find('[data-alias="' + activeType + '"]').addClass(CLASSES.activeSubscriptionType);
		},

		_isBelowTheLineChecked: function() {
			return this.$components.btlCheckbox ? this.$components.btlCheckbox.isChecked() : false;
		},

		_getActiveSubscriptionType: function() {
			var subscriptionType = 'no_agreement';
			if (this.$components.subscriptionType) {
				this.$components.subscriptionType.forEach(function(subscriptionTypeComponent) {
					if (subscriptionTypeComponent.$el[0].classList.contains(CLASSES.activeSubscriptionType)) {
						subscriptionType = subscriptionTypeComponent.$options.type;
					}
				});
			}
			return subscriptionType;
		}
	};


/***/ },

/***/ 694:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.selectedPlan = {};
		},
		events: {
			'select $$mbbSubscriptions': '_onSelectPlan'
		},

		_onSelectPlan: function(event, planData) {
			this.selectedPlan = planData;
			this._addToBasket();
		},

		_addToBasket: function(event, mixedProductsDecision) {
			if (mixedProductsDecision) {
				this.selectedPlan.plan.mixedProductsDecision = mixedProductsDecision;
			}
			this.selectedPlan.button.setLoading();
			this._onSelect();
			this.$tools.data.post(this.selectedPlan.url, this.selectedPlan.plan).then(function(response) {
				if (response.success) {
					this.selectedPlan = {};
				} else if (this._getProductsChecker && this._getProductsChecker().hasMixedProducts(response)) {
					response.data.callback = this._addToBasket.bind(this);
					this._getProductsChecker().checkMixedProducts(response, this.selectedPlan.button);
				}
			}.bind(this))

				.catch(function() {
					this.selectedPlan.button.resetLoading();
					this.selectedPlan = {};
				}.bind(this))

				.finally(function() {
					this.$components.mbbSubscriptions.forEach(function(planComponent) {
						planComponent.enable();
					});
				}.bind(this));
		},
		_onSelect: function() {
			this.$components.mbbSubscriptions.forEach(function(planComponent) {
				planComponent.disable();
			});
		},
		_getProductsChecker: function() {
			return this.$extensions['products-checker'];
		}

	};


/***/ },

/***/ 695:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $selectPlan': '_onProceed'
		},

		_onProceed: function() {
			var quantity = 1;
			var data = {};

			data.url = this.$options.url;
			data.plan = {
				subscriptionId: this.$options.subscriptionId
			};
			data.id = this.$options._ref;
			data.button = this.$components.selectPlan;
			if (typeof this.$components.quantity !== 'undefined') {
				quantity = this.$components.quantity.val();
			}
			if (this.$options.type === 'sim') {
				data.plan.simOnlyQuantity = quantity;
			} else {
				data.plan.deviceId = this.$options.deviceId;
				data.plan.deviceQuantity = quantity;
				data.plan.commitment = this.$options.commitment;
			}

			this.$events.trigger('select', data);
		},

		disable: function() {
			this.$components.selectPlan.disable();
		},

		enable: function() {
			this.$components.selectPlan.enable();
		}
	};


/***/ },

/***/ 696:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productCategory = __webpack_require__(697);

	/**
	name: Accessories Category
	type: controller
	desc: Handles Accessories Category page
	 */
	module.exports = app.core.util.extend({}, productCategory, {
	    // called on any filter change
		_updateFilter: function(event, data) {
			var filter = productCategory._transformFilterParams.call(this, data);

			productCategory._doFiltering.call(this, filter, data, this.$components.catalogItems);
			this._toggleProductBlocks();
		},
		_toggleProductBlocks: function() {
			var showProducts = this._hasSelectedFilters();

			this.$components.frontPage.toggle(!showProducts);

			if (showProducts) {
				productCategory._checkVisibleProducts.call(this);
			} else {
				this.$components.noProductsMessage.close();
			}
		},
		_hasSelectedFilters: function() {
			var hasFilters = false;
			this.$components.filters.forEach(function(filter) {
				if(filter.hasSelectedFilters()) {
					hasFilters = true;
				}
			});
			return hasFilters;
		}
	});


/***/ },

/***/ 697:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var urlParserService = __webpack_require__(698);

	/**
	 name: Product Category
	 type: controller
	 desc: Basic controller for any Product Category page
	 options:
	 baseUrl: Specifies relative URL for the current page, without host/port.
	 subscriptions:
	 filterChange: Filters products by brand, color, subscription, etc, and updates browser URL without page reload.
	 */
	module.exports = {
		initialize: function() {
			this.FILTERS = {
				COLOR: 'Color',
				CRITERIA: 'Criteria'
			};

			this.urlParser = new urlParserService(this.$options.baseUrl);
		},
		ready: function() {
			if (this.$elements.productForm && this.$elements.productForm.length) {
				this.$elements.productForm[0].reset();
			}

			// Hot fix for ONESCREEN-9057 - Issue with rendering page on UIWebView
			if (this.$tools.browser.isMobile) {
				this.$el[0].classList.add('transform-translate');
			}

			// initialize items if they don't exist (in case of any filters)
			this.$components.catalogItems = this.$components.catalogItems || [];

			if (this.urlParser.getProductParams()[this.urlParser.PARAMS.BRAND]) {
				this._updateFilter(null, {
					values: this.urlParser.getProductParams()[this.urlParser.PARAMS.BRAND],
					criteria: this.$components.filters[0].$options.filterGroup
				});
			}

			this.productsData = this._initProductsData();
		},
		events: {
			'filterChange $$filters': '_updateFilter',
			'filterChange $$catalogItems': '_updateFilter',
			'resetProductColor $$catalogItems': '_resetProductColor',
			'change $$stockType': '_onStockTypeChange'
		},
		_updateFilter: function(event, data) {
			this._doFiltering(this._transformFilterParams(data), data, this.$components.catalogItems);
			this._checkVisibleProducts();
		},
		_transformFilterParams: function(data) {
			var filter = null;

			if (data.color && data.productId) {
				data = this.$tools.util.extend(data, this._findFilterParams(data.color, data.productId));
				filter = this.FILTERS.COLOR;
			}

			if (data.criteria) {
				filter = this.FILTERS.CRITERIA;
				if (!data.skipUrlUpdate) {
					this.urlParser.updateParam(this.urlParser.PARAMS.BRAND, data.values);
				}
			}

			return filter;
		},

		_doFiltering: function(filter, params, itemsToFilter) {
			var productsWithChangedColor;

			if (!filter || !params || !itemsToFilter) {
				return;
			}

			productsWithChangedColor = this._findChangedColors();
			itemsToFilter.forEach(function(item) {
				item['filter' + filter](params, productsWithChangedColor);
			});
		},

		_checkVisibleProducts: function() {
			if (this.$components.noProductsMessage) {
				if (this._hasVisibleProducts()) {
					this.$components.noProductsMessage.close();
				} else {
					this.$components.noProductsMessage.open();
				}
			}
		},

		_initProductsData: function() {
			return this.$components.catalogItems ? this.$components.catalogItems.reduce(function(acc, curr) {
				var group = acc[curr.$options.productId] || (acc[curr.$options.productId] = []);
				group.push(curr.$options);
				return acc;
			}, {}) : {};
		},

		_findFilterParams: function(color, productId) {
			var productWithMinPrice = {price: Number.MAX_VALUE};
			var productData = this.productsData[productId] || [];
			var defaultProduct = productData.filter(function(product) {
				return product.isDefault;
			});

			// check if default offer has needed color
			if (defaultProduct.length === 1 && defaultProduct[0].color === color) {
				return this._extendColorFilter(defaultProduct[0]);
			}

			// search by min price
			productData.forEach(function(product) {
				if (product.color === color && product.price < productWithMinPrice.price) {
					productWithMinPrice = product;
				}
			});

			return this._extendColorFilter(productWithMinPrice);
		},

		_extendColorFilter: function(product) {
			return {
				capacity: product.capacity,
				price: product.price
			};
		},

		_resetProductColor: function(event) {
			var updatedProduct = event.data.component;
			var productId = updatedProduct.$options.productId;

			this.$components.catalogItems.forEach(function(catalogItem) {
				if (catalogItem.$options.productId === productId) {
					catalogItem.$el.removeAttr('data-color-changed');
				}
			});

			updatedProduct.$el.attr('data-color-changed', updatedProduct.$options.color);
		},

		_findChangedColors: function() {
			var changedProducts = {};

			this.$components.catalogItems.filter(function(catalogItem) {
				return !!catalogItem.$el.attr('data-color-changed');
			}).forEach(function(catalogItem) {
				changedProducts[catalogItem.$options.productId] = catalogItem.$el.data('colorChanged');
			});

			return changedProducts;
		},

		_hasVisibleProducts: function() {
			var hasVisibleProducts = false;
			this.$components.catalogItems.forEach(function(catalogItem) {
				if (!catalogItem.$el[0].classList.contains('js-hidden')) {
					hasVisibleProducts = true;
				}
			});
			return hasVisibleProducts;
		},

		_onStockTypeChange: function(event) {
			this.urlParser.updateParam('stockType', event.$el.val());
			window.location.reload(true);
		}
	};


/***/ },

/***/ 698:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var jQuery = __webpack_require__(2);

	var PARAMETERS = {
		BRAND: 'brands',
		MODEL: 'model',
		CATEGORY: 'category',
		COLOR: 'color',
		CAPACITY: 'capacity'
	};

	var _parseParamValue = function(value) {
		var values = [];

		if (value && value.indexOf(',') !== -1) {
			values = value.split(',').map(function(param) {
				return param.trim();
			});
		} else {
			values.push(value || '');
		}

		return values;
	};

	var _parseQueryParams = function() {
		var params = {};

		if (!document.location.search) {
			return {};
		}

		document.location.search.substr(1).split('&').forEach(function(paramString){
			var item = paramString.split('=');
			var name = item[0].toString();
			var valueToken = item[1].toString();

			params[name] = _parseParamValue(valueToken);
		});

		return params;
	};

	var _parseTokens = function(baseUrl) {
		var path = window.location.pathname.replace(baseUrl, '');
		var tokens = path.split('/');
		var params = {};

		tokens = tokens.filter(function(token) {
			return token.trim().length > 0;
		});


		if (tokens.length) {
			params.brands = _parseParamValue(tokens[0]);
		}

		if (tokens.length === 2) {
			params.model = _parseParamValue(tokens[1]);
		}

		return params;
	};

	var _buildUrl = function(baseUrl, params) {
		var url = baseUrl;
		var cloned = jQuery.extend({}, params);
		var iter;

		if (cloned.brands) {
			url += '/' + cloned.brands.join(',');
		}

		if (cloned.model) {
			url += '/' + cloned.model.join(',');
		}

		delete cloned.brands;
		delete cloned.model;

	    // if we have other parameters append them as query parameters
		if (cloned && Object.keys(cloned).length) {
			url += '?';
			for (iter in cloned) {
				url += iter + '=' + cloned[iter].join(',') + '&';
			}
			url = url.replace(/&?$/, '');
		}
		return url;
	};

	var _processParam = function(name, value) {
		if (value === null) {
			delete this.params[name];
		} else {
			value = [].concat(value);
			this.params[name] = value;
		}
	};

	var mockedMethod = function() {
		return {};
	};

	var UrlParser = function(baseUrl) {
		var property;
		this.PARAMS = PARAMETERS;

		if (baseUrl) {
			this.baseUrl = baseUrl || '';
			this.PARAMS = PARAMETERS;
			this.hiddenParams = null;
			this.params = this.getProductParams();
		} else { // create mocked service
			for (property in this) {
				if (typeof this[property] === 'function') {
					this[property] = mockedMethod;
				}
			}
			this.params = {};
		}
	};

	/**
		name: URL Parser
		type: ui
		desc: >
			Parses browser's URL and retrieves product parameters.
			Has ability to update parameters and stores new state in history.
			To handle navigation by history use `popstate` event. For example:

				```
	 				window.addEventListener('popstate', function(e) {
						var data = e.state;
						// Do some work
					});
				```
	 */
	module.exports = UrlParser;

	/**
		desc: Gets current product parameters or parses URL to init them.
	 */
	UrlParser.prototype.getProductParams = function() {
		if (!this.params) {
			this.params = jQuery.extend({}, _parseQueryParams(), _parseTokens(this.baseUrl));
		}

		return this.params;
	};

	/**
		desc: Updates parameter in cached object and refreshes URL. Removes previous value. If parameter value is 'null' - parameter will be removed.
		args:
			paramName: parameter key
			paramValue: parameter value
			skipUrlUpdate: optional boolean parameter. If `true` - skips history refreshing.
	 */
	UrlParser.prototype.updateParam = function(paramName, paramValue, skipUrlUpdate) {
		_processParam.call(this, paramName, paramValue);

		if (!skipUrlUpdate) {
			this.refreshUrl();
		}
	};

	/**
		desc: Updates several parameters at once and refreshes URL.
		args:
			params: Object. key-value to update URL
	 */
	UrlParser.prototype.updateBulkParams = function(params) {
		var name;
		if (params) {
			for (name in params) {
				_processParam.call(this, name, params[name]);
			}
			this.refreshUrl();
		}
	};

	/**
		desc: Appends parameter value to the existed values by key.
		args:
			paramName: parameter key
			paramValue: parameter value
	 */
	UrlParser.prototype.addParam = function(paramName, paramValue) {
		this.params[paramName] = this.params[paramName] || [];

		if (this.params[paramName].indexOf(paramValue) === -1) {
			this.params[paramName].push(paramValue);
			this.refreshUrl();
		}
	};

	/**
		desc: Removes specified parameter value from existed values by key.
		args:
			paramName: parameter key
			paramValue: parameter value to remove
	 */
	UrlParser.prototype.removeParam = function(paramName, paramValue) {
		var idx;

		if (!this.params[paramName] || this.params[paramName].indexOf(paramValue) === -1) {
			return;
		}

		idx = this.params[paramName].indexOf(paramValue);
		this.params[paramName].splice(idx, 1);

		if (!this.params[paramName].length) {
			delete this.params[paramName];
		}

		this.refreshUrl();
	};

	/**
		desc: Removes all values by specified key.
		args:
			paramName: parameter key to clear
			skipUrlUpdate: optional boolean parameter. If `true` - skips history refreshing.
	 */
	UrlParser.prototype.clearParam = function(paramName, skipUrlUpdate) {
		delete this.params[paramName];

		if (!skipUrlUpdate) {
			this.refreshUrl();
		}
	};

	/**
		desc: Sets parameters that should be added to history state but should not be visible in URL.
		args:
			params: Object. parameters to set.
	 */
	UrlParser.prototype.setHiddenStateParams = function(params) {
		this.hiddenParams = params;
	};

	/**
		desc: >
			Refreshes browser URL by current state of cached parameters without page reload.
			Stores new URL in browser history.
	 */
	UrlParser.prototype.refreshUrl = function(replaceState) {
		var method = replaceState ? 'replaceState' : 'pushState';
		var stateParams;
		var newUrl;

		if (window.history && window.history[method]) {
			stateParams = this.params;
			newUrl = _buildUrl(this.baseUrl, this.params);

			if (this.hiddenParams) {
				stateParams = app.core.util.extend({}, stateParams, this.hiddenParams);
			}

			if (replaceState) {
				window.history.replaceState(stateParams, '', newUrl);
			} else if (newUrl !== (window.location.pathname + window.location.search)) {
				window.history.pushState(stateParams, '', newUrl);
			}

			this.hiddenParams = null;
		}
	};

	/**
		desc: Returns URL by current state of cached parameters.
	 */
	UrlParser.prototype.buildUrl = function() {
		return _buildUrl(this.baseUrl, this.params);
	};


/***/ },

/***/ 699:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productCategoryItem = __webpack_require__(700);

	/**
	name: Accessory Category Item
	type: controller
	desc: Handles accessory item on Category page
	*/
	module.exports = app.core.util.extend({}, productCategoryItem, {
		filterColor: function(filters) {
			var visible;
			if (filters.productId === this.$options.productId) {
				visible = (filters.color === this.$options.color);

				this.toggle(visible);
				this._selectColor(filters.color);

				if (visible) {
					this.$events.trigger('resetProductColor');
				}
			}
		}
	});


/***/ },

/***/ 700:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Product Category Item
	type: controller
	desc: Basic controller for specific product item on Product Category page
	events:
	    filterChange: Fires when product color was changed.
	 */
	module.exports = {
		events: {
			'change $$colors': '_colorChange'
		},
	    /**
	     desc: Checks if this product criteria is applicable for selected filters.
	     args:
	        filters: Object with selected filters (criteria, productId, color).
	     */
		filterCriteria: function(filters, productsWithChangedColor) {
			var visible = this._checkVisibilityForCriteria(productsWithChangedColor);
			var filterName;

			if (filters.values && filters.values.length && filters.criteria) {
				filterName = 'filter' + filters.criteria[0].toUpperCase() + filters.criteria.slice(1);
				visible = visible && filters.values.indexOf(this.$options[filterName]) !== -1;
			}

			this.toggle(visible);
		},
	    /**
	     desc: Filters current product by color and all related fields.
	     args:
	        filters: Object with selected filters (criteria, productId, color).
	     */
		filterColor: function(filters) {
			var visible = true;
			if (filters.productId === this.$options.productId) {

				visible = visible && (filters.color === this.$options.color);
				visible = visible && (filters.capacity === this.$options.capacity);
				visible = visible && (filters.price === this.$options.price);

				this.toggle(visible);
				this._selectColor(filters.color);

				if (visible) {
					this.$events.trigger('resetProductColor');
				}
			}
		},
		_colorChange: function(event) {
			this.$events.trigger('filterChange', {
				color: event.$el.val(),
				productId: this.$options.productId,
				skipUrlUpdate: false
			});
		},
		_selectColor: function(color) {
			this.$components.colors.forEach(function(colorControl) {
				colorControl.$el.prop('checked', colorControl.$el[0].value === color);
			});
		},
		_checkVisibilityForCriteria: function(productsWithChangedColor) {
			if (productsWithChangedColor[this.$options.productId]) {
				return this.$options.color === productsWithChangedColor[this.$options.productId]
	                && this.$el.data('colorChanged') === productsWithChangedColor[this.$options.productId];
			}
			return this.$options.isDefault;
		}
	};


/***/ },

/***/ 701:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var urlParserService = __webpack_require__(698);
	var scrollToComponent = __webpack_require__(555);
	var	scrollTo = scrollToComponent.scrollTo.bind(scrollToComponent);

	/**
	name: Accessory Details
	type: controller
	desc: Handles Accessory Details page
	options:
	    baseUrl: Specifies relative URL for the current page, without host/port.
	subscriptions:
		colorChange: Fires when accessory color changed. Switches information block by selected color.
	*/
	module.exports = {
		initialize: function() {
			this.urlParser = new urlParserService(this.$options.baseUrl);
		},

		events: {
			'colorChange $$accessoryInfo': '_onColorChanged',
			'identifyCodeChange $$accessoryInfo': '_onIdentifyCodeChanged',
			'click [data-alias="readMoreLink"]': '_onReadMore'
		},

		_onColorChanged: function(event, color) {
			this.$components.accessoryInfo.forEach(function(infoComponent) {
				var isVisible = infoComponent.$options.color === color;
				infoComponent.toggle(isVisible);

				if (isVisible) {
					this.urlParser.updateParam(this.urlParser.PARAMS.MODEL, infoComponent.getIdentifyCode());
				}
			}.bind(this));
		},

		_onIdentifyCodeChanged: function(event, identifyCode) {
			this.$components.accessoryInfo.forEach(function(infoComponent) {
				infoComponent.toggle(infoComponent.getIdentifyCode() === identifyCode);
			});
		},

		_onReadMore: function() {
			var aboutTab;
			var SCROOL_TO = 200;
			if (this.$components.accessoryDetailsTabpanel) {
				scrollTo(this.$components.accessoryDetailsTabpanel.$el, SCROOL_TO);
				aboutTab = this.$components.accessoryDetailsTabpanel.$components.aboutTab[0].$el;
				this.$components.accessoryDetailsTabpanel.changeTab(aboutTab);
			}

			return false;
		}
	};


/***/ },

/***/ 702:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productDetails = __webpack_require__(703);

	var SELECTORS = {
		slideContent: '[data-element="slideContent"]'
	};

	var CLASSES = {
		active: 'is-active',
		selected: 'is-selected'
	};

	/**
	name: Accessory Details Info
	type: controller
	desc: Handles Information block on Accessory Details page
	options:
		stockCount: Identifies count of products available in store for Agent.
	events:
		colorChange: Fires when color in color picker was changed.
	 */
	module.exports = app.core.util.extend({}, productDetails, {

		events: app.core.util.extend({}, productDetails.events, {
			'click $$colors': '_onColorChanged',
			'click configOverlay': '_onHideSlide',
			'click showStores': '_onToggleStores'
		}),

		ready: function() {
			productDetails.ready.call(this);
			if (this.$components.storesRow && this.$components.storesRow.$components.stores) {
				this.$components.storesRow.$components.stores.refreshStoresList();
			}
			this.$storesWrapper = this.$components.storesRow.$el;
			this.$overlay = this.$elements.configOverlay;
			// initialize available stock count
			if (this.$components.addToBasketForm.$components.quantity) {
				this._onQuantityChange(null, 1);
			}
		},

		_updateState: function(event) {
			var data = event.state;
			if (data && data.model && data.model.length) {
				this.$events.trigger('identifyCodeChange', data.model[0]); // first token of model should be identify code
			}
		},

		/**
		 desc: Returns offer identify code by selected color.
		 */
		getIdentifyCode: function() {
			return this.$components.addToBasketForm.$components.identifyCode.$el.val();
		},

		_onColorChanged: function(event) {
			this.$events.trigger('colorChange', event.$el.val());
		},

		_showOverlay: function($currentToggle) {
			this.$overlay.addClass(CLASSES.active);
			$currentToggle.addClass(CLASSES.selected);
		},

		_hideOverlay: function() {
			this.$overlay.removeClass(CLASSES.active);
			this.$storesWrapper.removeClass(CLASSES.selected);
		},

		_onHideSlide: function(event) {
			var target = this.$el.find(event.target);

			if (!(target.is(this.$elements.slideContent) || target.parents(SELECTORS.slideContent).length)) {
				this._hideOverlay();
			}
		},

		_onToggleStores: function(event) {
			event.preventDefault();
			this._toggleOverlay(this.$storesWrapper);
		},

		_toggleOverlay: function($currentToggle) {
			var	activeToggle = $currentToggle.hasClass(CLASSES.selected);

			if (activeToggle) {
				this._hideOverlay();
			} else {
				this._showOverlay($currentToggle);
			}
		},

		_changeSelected: function($currentToggle) {
			this.$storesWrapper.removeClass(CLASSES.selected);
			$currentToggle.addClass(CLASSES.selected);
		},

		_addToBasket: function(event, mixedProductsDecision) {
			productDetails._onAddToBasket.call(this, event, mixedProductsDecision);
		},

		_getProductsChecker: function() {
			return this.$extensions['products-checker'];
		}
	});


/***/ },

/***/ 703:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var urlParserService = __webpack_require__(698);

	/**
	name: Common Product Details
	type: controller
	desc: Basic controller for Product Details page
	options:
		baseUrl: Specifies relative URL for the current page, without host/port.
	 */
	module.exports = {
		events: {
			'click $flipContainer $$flipTrigger': '_flipImage',
			'change $$stockType': '_onStockTypeChange',
			'click $addToBasketForm $addToBasket': '_onAddToBasket',
			'change $addToBasketForm $quantity': '_onQuantityChange',
			'max-limit-exceeded $addToBasketForm $quantity': '_onQuantityMaxLimitExceeded'
		},

		initialize: function() {
			this.urlParser = new urlParserService(this.$options.baseUrl);
		},

		ready: function() {
			window.addEventListener('popstate', this._updateState.bind(this));
		},

		// overload this method in child component
		_updateState: function() {},

		_flipImage: function() {
			this.$components.flipContainer.$el.toggleClass('flipped');
		},

		_onStockTypeChange: function(event) {
			this.urlParser.updateParam('stockType', event.$el.val());
			window.location.reload(true);
		},

		_onAddToBasket: function(event, mixedProductsDecision) {
			var submitButton = event.data.component;
			var addToBasketForm = this.$components.addToBasketForm;
			var formData;

			if (addToBasketForm) {
				submitButton.activityIndicator();
				this.$components.addToBasketError.close();
				formData = addToBasketForm.serialize();

				if (mixedProductsDecision) {
					formData.mixedProductsDecision = mixedProductsDecision;
				}

				this.$tools.data.post(addToBasketForm.$options.action, formData)
					.then(function(response) {
						if (response.success) {
							if (response.data && response.data.RedirectUrl) {
								this.$tools.util.redirect(response.data.RedirectUrl);
							} else {
								submitButton.resetLoading();
							}
						} else if (response.errorMessages && response.errorMessages.length) {
							this.$components.addToBasketError.setText(response.errorMessages[0]);
							this.$components.addToBasketError.open();
							submitButton.resetLoading();
						} else if (this._getProductsChecker().hasMixedProducts(response)) {
							response.data.callback = this._addToBasket.bind(this);
							this._getProductsChecker().checkMixedProducts(response, submitButton);
						}
					}.bind(this))
					.catch(function() {
						submitButton.resetLoading();
					});
			}
		},

		_onQuantityChange: function(event, newValue) {
			var itemsLeft = this.$options.stockCount - newValue;

			if (this.$options.stockSwitch) {
				this.$components.stockCount.html(itemsLeft);
			}

			if (itemsLeft > 0) {
				this.$components.quantityWarning.close();
			}
		},

		_onQuantityMaxLimitExceeded: function() {
			this.$components.quantityWarning.open();
		}
	};


/***/ },

/***/ 704:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var urlParserService = __webpack_require__(698);
	var filter = __webpack_require__(533);

	/**
	 name: Product Category Filter
	 type: controller
	 desc: Basic controller for any Product Category page that handles filtering panel
	 */
	module.exports = app.core.util.extend(true, {}, filter, {
		initialize: function() {
			this.urlParser = new urlParserService(this.$options.baseUrl);
			window.addEventListener('popstate', this._updateState.bind(this));
		},

		_updateState: function(event) {
			var data = event.state;
			var selectedBrands = [];
			var filtersFromUrl = this.urlParser.getProductParams()[this.urlParser.PARAMS.BRAND] || [];

			if (data) {
				selectedBrands = data[this.urlParser.PARAMS.BRAND] || [];
			} else if (filtersFromUrl.length) {
				selectedBrands = filtersFromUrl;
			}

			this.selectedValues = selectedBrands;

			// update checkboxes state
			if (this.$elements.filterControl) {
				this.$elements.filterControl.forEach(function(filterControl) {
					filterControl.checked = selectedBrands.indexOf(filterControl.value) !== -1;
				});
			}

			this._onFilterChange();
		}
	});


/***/ },

/***/ 705:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productCategory = __webpack_require__(706);

	/**
	name: Family Category
	type: controller
	desc: Proxy component for Shop::family/modal-wizard/product-list
	*/
	module.exports = app.core.util.extend({}, productCategory, {
		events: app.core.util.extend({}, productCategory.events, {
			'click [data-selector=showDetailsLink]': '_onDetailsLinkClick',
			'click $$stockType': '_onStockTypeChange'
		}),

		/*
			ToDo: see below
				It seems we need to extend Handset category component to trigger event instead of reloading the page
				Then we can remove this component and use Handset category instead
		*/
		_onDetailsLinkClick: function(event) {
			event.preventDefault();

			this.$events.trigger('phoneSelected', {
				identifyCode: event.$el[0].dataset.identifyCode
			});
		},

		_onStockTypeChange: function(event) {
			event.preventDefault();

			this.$events.trigger('storeChanged', {
				stockType: event.$el.val()
			});
		}
	});


/***/ },

/***/ 706:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productCategory = __webpack_require__(697);

	/**
	name: Handset Category
	type: controller
	desc: Handles Phones/Tablets Category page
	*/
	module.exports = app.core.util.extend({}, productCategory, {
		events: app.core.util.extend({}, productCategory.events, {
			'change $subscription': '_updateSubscription'
		}),

		_updateSubscription: function(event, subscriptionId) {
			var disabledControls = this.$components.stockType || [];

			this.$components.filters.forEach(function(filter) {
				disabledControls = disabledControls.concat(filter.$elements.filterControl);
			});

			disabledControls.forEach(function(disabledItem) {
				disabledItem[0].disabled = true;
			});

			if (subscriptionId === '0') {
				this.urlParser.clearParam('subscriptionId', true);
			} else {
				this.urlParser.updateParam('subscriptionId', subscriptionId, true);
			}

			this.$tools.util.redirect(this.urlParser.buildUrl());
		}
	});


/***/ },

/***/ 707:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productDetailsConfigurations = __webpack_require__(708);

	/**
	 name: Handset Category
	 type: controller
	 desc: Handles Phones/Tablets Category page
	 */
	module.exports = app.core.util.extend({}, productDetailsConfigurations, {
		_addToBasket: function(event) {
			var phoneData = this.$components.addToBasketForm.serialize();

			event.preventDefault();

			this.$events.trigger('phoneConfirmed', phoneData);
		}
	});


/***/ },

/***/ 708:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productDetails = __webpack_require__(703);
	var scrollTo = __webpack_require__(555);

	var SELECTORS = {
		toggleLinks: '[data-element="configRow"]',
		slideContent: '[data-element="slideContent"]'
	};

	var CLASSES = {
		active: 'is-active',
		selected: 'is-selected',
		singleOption: 'single-option',
		loading: '.product-container.is-loading'
	};

	/**
	name: Product Details Configurations
	type: controller
	desc: Handles Product options (color, capacity, etc)
	options:
		stockCount: Identifies count of products available in store for Agent.
	*/
	module.exports = {
		events: {
			'click configOverlay': '_onHideSlide',
			'click configRowTrigger': '_onToggleConfig',
			'click showStores': '_onToggleStores',
			'click $addToBasket': '_addToBasket',
			'change $quantity': '_onQuantityChange',
			'max-limit-exceeded $quantity': '_onQuantityMaxLimitExceeded'
		},

		initialize: function() {
			this._scrollToToggleHandler = this._scrollToToggle.bind(this);
		},

		ready: function() {
			this.$toggleLinks = this.$el.find(SELECTORS.toggleLinks);
			this.$storesWrapper = this.$components.storesRow.$el;

			this.checkSingleOptions();
			// initialize available stock count
			if (this.$components.addToBasketForm.$components.quantity) {
				productDetails._onQuantityChange.call(this, null, 1);
			}

			if (this.$components.storesRow && this.$components.storesRow.$components.stores) {
				this.$components.storesRow.$components.stores.refreshStoresList();
			}
		},


		/**
		 desc: Open options dropdown, show overlay.
		 args:
			$currentToggle: jQuery DOM element of configuration's menu trigger.
		 */
		show: function($currentToggle) {
			this.$elements.configOverlay.addClass(CLASSES.active);
			$currentToggle.addClass(CLASSES.selected);
		},

		/**
		 desc: Close all options dropdowns, hide overlay.
		 */
		hide: function() {
			this.$elements.configOverlay.removeClass(CLASSES.active);
			this.$elements.configRow.removeClass(CLASSES.selected);
			this.$storesWrapper.removeClass(CLASSES.selected);
		},

		/**
		 desc: Adds specific class for configuration option if it has only one value available.
		 */
		checkSingleOptions: function() {
			var that = this;
			this.$elements.configRow.each(function() {
				var $configBlock = that.$el.find(this);
				var $options = $configBlock.find('.product-slide li');
				$configBlock.toggleClass(CLASSES.singleOption, $options.length < 2);
			});
		},

		destroyMixedProductsPopup: function() {
			if (this._getProductsChecker() && this._getProductsChecker().$components.mixedContentDialog) {
				this._getProductsChecker().$components.mixedContentDialog.destroy();
			}
		},

		/**
		 desc: Disables all valuable controls when any action is in progress.
		 */
		disableControls: function() {
			var addToBasketButton = this.$components.addToBasketForm.$components.addToBasket;
			var quantity = this.$components.addToBasketForm.$components.quantity;
			addToBasketButton && addToBasketButton.disable();
			quantity && quantity.disable();
		},

		/**
		 desc: Enables all valuable controls.
		 */
		enableControls: function() {
			var addToBasketButton = this.$components.addToBasketForm.$components.addToBasket;
			var quantity = this.$components.addToBasketForm.$components.quantity;
			addToBasketButton && addToBasketButton.enable();
			quantity && quantity.enable();
		},

		toggleConfig: function(component) {
			var $currentToggle = component.$el.parents(SELECTORS.toggleLinks);

			this._toggle($currentToggle);
		},

		_onHideSlide: function(event) {
			if (!event.target.closest(SELECTORS.slideContent)) {
				this.hide();
			}
		},


		_onToggleConfig: function(event) {
			var $currentToggle = this.$el.find(event.target).parents(SELECTORS.toggleLinks);

			this._toggle($currentToggle);

			event.preventDefault();
			event.stopPropagation();
		},

		_onToggleStores: function(event) {
			this._toggle(this.$storesWrapper);

			event.preventDefault();
		},

		_toggle: function($currentToggle) {
			var isShown = this.$elements.configRow.filter('.' + CLASSES.selected).length > 0 || this.$storesWrapper.hasClass(CLASSES.selected);
			var activeToggle = $currentToggle.hasClass(CLASSES.selected);
			var singleOption = $currentToggle.hasClass(CLASSES.singleOption);
			var isLoading = !!$currentToggle.parents(CLASSES.loading).length;

			if (singleOption || isLoading) {
				return;
			}

			if (isShown) {
				if (activeToggle) {
					this.hide();
				} else {
					this._changeSelected($currentToggle);
				}
			} else {
				this.show($currentToggle);
			}
		},

		_changeSelected: function($currentToggle) {
			this.$elements.configRow.removeClass(CLASSES.selected);
			this.$storesWrapper.removeClass(CLASSES.selected);

			// Workaround for mobile devices to scroll to $currentToggle
			if (this.$tools.browser.isMobile) {
				$currentToggle[0].addEventListener('transitionend', this._scrollToToggleHandler, false);
			}

			$currentToggle.addClass(CLASSES.selected);
		},

		_scrollToToggle: function(event) {
			if (event.propertyName.indexOf('height') < 0) {
				return;
			}

			event.currentTarget.getBoundingClientRect().top > 0 || scrollTo.scrollTo(event.currentTarget);
			event.currentTarget.removeEventListener('transitionend', this._scrollToToggleHandler, false);
		},

		_addToBasket: function(event, mixedProductsDecision) {
			productDetails._onAddToBasket.call(this, event, mixedProductsDecision);
		},

		_onQuantityChange: function(event, newValue) {
			productDetails._onQuantityChange.call(this, event, newValue);
			this.$events.trigger('updateQuantity', newValue);
		},

		_onQuantityMaxLimitExceeded: function(event, newValue) {
			productDetails._onQuantityMaxLimitExceeded.call(this, event, newValue);
		},

		_getProductsChecker: function() {
			return this.$extensions['products-checker'];
		}
	};


/***/ },

/***/ 709:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productDetails = __webpack_require__(710);

	/**
	name: Family Handset Details
	type: controller
	desc: Handles Phones/Tablets Details page
	*/
	module.exports = app.core.util.extend({}, productDetails, {
		events: app.core.util.extend({}, productDetails.events, {
			'phoneConfirmed $configurations': '_onPhoneConfirmed',
			'click $$stockType': '_onStockTypeChange'
		}),

		_onPhoneConfirmed: function(event, data) {
			this.$events.trigger('phoneConfirmed', data);
		},

		_onStockTypeChange: function(event) {
			event.preventDefault();

			this.$events.trigger('storeChanged', {
				stockType: event.$el.val()
			});
		}
	});


/***/ },

/***/ 710:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var productDetails = __webpack_require__(703);

	var CLASSES = {
		loading: 'is-loading'
	};

	/**
	name: Handset Details
	type: controller
	desc: Handles Handset Details page
	options:
		baseUrl: Specifies relative URL for the current page, without host/port.
	subscriptions:
		refreshConfigurations: Reloads product details block.
	*/
	module.exports = app.core.util.extend({}, productDetails, {
		ready: function() {
			productDetails.ready.call(this);
			this._initDefaultConfigs();
		},

		events: app.core.util.extend({}, productDetails.events, {
			'refreshConfigurations $configurations $$configuration': '_refreshConfigurations',
			'updateQuantity $configurations': '_updateQuantity'
		}),

		_initDefaultConfigs: function() {
			this.configurationsData = {
				quantity: 1
			};
			this.urlData = {};

			this.$components.configurations.$components.configuration.forEach(function(configuration) {
				this.configurationsData =
					this.$tools.util.extend(this.configurationsData, configuration.getDefaultConfig() || {});
			}.bind(this));
		},

		_updateState: function(event) {
			var stateData = event.state;
			var configData = {
				configurationsData: {}
			};

			if (stateData) {
				if (stateData.cycleCount) {
					configData.configurationsData.cycleCount = stateData.cycleCount[0];
				}
				if (stateData.subscriptionId) {
					configData.configurationsData.subscriptionId = stateData.subscriptionId[0];
				}
				if (stateData.color) {
					configData.configurationsData.color = stateData.color;
				}
				if (stateData.capacity) {
					configData.configurationsData.capacity = stateData.capacity;
				}

				this._refreshConfigurations(null, configData, true);
			}
		},

		_refreshConfigurations: function(eventName, data, skipUrlUpdate) {
			this.configurationsData = this.$tools.util.extend(this.configurationsData, data.configurationsData || {});
			this.urlData = data.urlData || {};
			this.$components.configurations.hide();

			this._refreshDetails(this.configurationsData, skipUrlUpdate);
		},

		_updateQuantity: function(eventName, quantity) {
			this.configurationsData.quantity = quantity;
		},

		/* protected method */
		_prepareRequestOptions: function(data) {
			return {
				productModelId: this.$options.modelId,
				colorCode: data.color,
				memoryCode: data.capacity,
				quantity: this.configurationsData.quantity,
				subscriptionId: data.subscriptionId,
				subscriptionType: data.subscriptionType,
				cycleCount: data.cycleCount,
				insuranceId: data.insuranceId,
				addons: data.addons
			};
		},

		_refreshDetails: function(data, skipUrlUpdate) {
			var requestOptions;
			if (!this.$options.refreshDetailsUrl) {
				return;
			}

			this.$elements.infoBlock.addClass(CLASSES.loading);

			this.$components.configurations.disableControls();
			this.$components.configurations.destroyMixedProductsPopup();

			requestOptions = this._prepareRequestOptions(data);

			this.load(this.$options.refreshDetailsUrl, this.$elements.infoBlock, requestOptions)
				.finally(function() {
					this.$elements.infoBlock.removeClass(CLASSES.loading);
					this.$components.configurations.checkSingleOptions();

					if (this.$components.configurations.$components.price.$options.isProductAvailable) {
						this.$components.configurations.enableControls();
					}
				}.bind(this))

				.then(function(response) {
					if (!response || !response.success) {
						return;
					}

					if (!skipUrlUpdate) {
						this._updateHistory(response);
					}

					this._updateTabs(response.data.identifyCode);
				}.bind(this));
		},

		_updateHistory: function(response) {
			this.urlData[this.urlParser.PARAMS.MODEL] = response.data.identifyCode;

			if (this.configurationsData.subscriptionId === 'none') {
				this.urlData.cycleCount = null;
			}

			this.urlParser.setHiddenStateParams({
				color: response.data.color,
				capacity: response.data.capacity
			});
			this.urlParser.updateBulkParams(this.urlData);
			this.urlData = {};
		},

		_updateTabs: function(identifyCode) {
			if (this.$options.aboutTabUrl) {
				this.load(this.$options.aboutTabUrl + '?identifyCode=' + identifyCode, '#phone-details');
			}

			if (this.$options.techSpecsTabUrl) {
				this.load(this.$options.techSpecsTabUrl + '?identifyCode=' + identifyCode, '#specification');
			}

			if (this.$options.topContentAreaUrl) {
				this.load(this.$options.topContentAreaUrl + '?identifyCode=' + identifyCode, '#phone-topcontentarea');
			}

		}
	});


/***/ },

/***/ 711:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		descriptionWrapper: '[data-selector="addonDescriptionWrapper"]',
		shortDescription: '[data-selector="addonShortDescription"]',
		description: '[data-selector="addonDescription"]',
		showLessLink: '[data-selector="showLessLink"]'
	};

	var CLASSES = {
		descriptionExpanded: 'expanded'
	};

	module.exports = {
		events: {
			'click [data-selector="showMoreLink"]': '_onShowMore',
			'click [data-selector="showLessLink"]': '_onShowLess'
		},
		_onShowMore: function() {
			this.$el.find(SELECTORS.descriptionWrapper).addClass(CLASSES.descriptionExpanded);
			this.hide(SELECTORS.shortDescription);
			this.show(SELECTORS.description);
			this.show(SELECTORS.showLessLink);
			return false;
		},
		_onShowLess: function() {
			this.$el.find(SELECTORS.descriptionWrapper).removeClass(CLASSES.descriptionExpanded);
			this.hide(SELECTORS.showLessLink);
			this.hide(SELECTORS.description);
			this.show(SELECTORS.shortDescription);
			return false;
		}
	};


/***/ },

/***/ 712:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Product details - addons configuration
	type: controller
	desc: Handles addons and propagate event to the parent
	events:
		refreshConfigurations: Fires when addons were changed
	*/
	module.exports = {
		events: {
			'click $applyAddons': '_onApplyAddons'
		},
		/**
		 desc: Retrieves default settings for current configuration. If it's not selected - returns empty array.
		 */
		getDefaultConfig: function() {
			var selectedAddons = this._getSelectedAddons();
			return {
				addons: selectedAddons
			};
		},
		_onApplyAddons: function() {
			var selectedAddons = this._getSelectedAddons();
			this.$events.trigger('refreshConfigurations', {
				configurationsData: {
					addons: selectedAddons
				}
			});
		},
		_getSelectedAddons: function() {
			var selectedAddons = [];
			(this.$components.addons || []).forEach(function(addon) {
				if (addon.$components.addonCheckbox.isChecked()) {
					selectedAddons.push(addon.$components.addonCheckbox.value());
				}
			});
			return selectedAddons;
		}
	};


/***/ },

/***/ 713:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Product details - capacity configuration
	type: controller
	desc: Handles capacity change and propagate event to the parent
	events:
	    refreshConfigurations: Fires when selected capacity was changed
	*/
	module.exports = {
		events: {
			'change': '_capacityChanged'
		},
	    /**
	     desc: Retrieves default settings for current configuration. If it's not selected - returns `null`.
	     */
		getDefaultConfig: function() {
			if (this.$el[0].checked) {
				return {
					capacity: this.$el[0].value
				};
			}

			return null;
		},
		_capacityChanged: function() {
			this.$events.trigger('refreshConfigurations', {
				configurationsData: {
					capacity: this.$el[0].value
				}
			});
		}
	};


/***/ },

/***/ 714:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Product details - color configuration
	type: controller
	desc: Handles color change and propagate event to the parent
	events:
	    refreshConfigurations: Fires when selected color was changed
	*/
	module.exports = {
		events: {
			'change': '_colorChanged'
		},
	    /**
	     desc: Retrieves default settings for current configuration. If it's not selected - returns `null`.
	     */
		getDefaultConfig: function() {
			if (this.$el[0].checked) {
				return {
					color: this.$el[0].value
				};
			}

			return null;
		},
		_colorChanged: function() {
			this.$events.trigger('refreshConfigurations', {
				configurationsData: {
					color: this.$el[0].value
				}
			});
		}
	};


/***/ },

/***/ 715:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Product details - installment configuration
	type: controller
	desc: Handles installment change and propagate event to the parent
	events:
	    refreshConfigurations: Fires when selected installment was changed and passes current value
	*/
	module.exports = {
		events: {
			'change': '_installmentChanged'
		},
	    /**
	     desc: Retrieves default settings for current configuration. If it's not selected - returns `null`.
	     */
		getDefaultConfig: function() {
			if (this.$el[0].checked) {
				return {
					cycleCount: this.$el[0].value
				};
			}

			return null;
		},
		_installmentChanged: function() {
			var data = {
				cycleCount: this.$el[0].value,
				subscriptionId: this.$options.subscriptionId
			};

			this.$events.trigger('refreshConfigurations', {
				configurationsData: data,
				urlData: data
			});
		}
	};


/***/ },

/***/ 716:
/***/ function(module, exports) {

	'use strict';

	/**
	 name: Product details - insurance configuration
	 type: controller
	 desc: Handles installment change and propagate event to the parent
	 events:
	 refreshConfigurations: Fires when selected insurance was changed and passes current value
	 */
	module.exports = {
		events: {
			'click': '_insuranceChanged'
		},
		/**
		 desc: Retrieves default settings for current configuration. If it's not selected - returns `null`.
		 */
		getDefaultConfig: function() {
			if (this.$el.hasClass('selected')) {
				return {
					insuranceId: this.$options.insuranceId
				};
			}

			return null;
		},
		_insuranceChanged: function(event) {
			var data = {
				insuranceId: this.$options.insuranceId
			};
			event.preventDefault();

			this.$events.trigger('refreshConfigurations', {
				configurationsData: data
			});
		}
	};


/***/ },

/***/ 717:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		subscriptionPanel: '[data-group="subscriptionPanel"]'
	};

	var CLASSES = {
		activeSubscriptionType: 'is-active'
	};

	/**
	name: Product details - subscription configuration
	type: controller
	desc: Handles subscription change and propagate event to the parent
	events:
		refreshConfigurations: Fires when selected subscription was changed and passes current value
	*/
	module.exports = {
		events: {
			'change $$subscriptions': '_onSubscriptionChanged',
			'click $$subscriptionType': '_onSubscriptionTypeChange',
			'changed $btlCheckbox': '_onBelowTheLineOptionChange'
		},

		/**
		desc: Retrieves default settings for current configuration. If it's not selected - returns `null`.
		*/
		getDefaultConfig: function() {
			var subscriptionId = null;

			this.$components.subscriptions.forEach(function(subscription) {
				if (subscription.$el[0].checked) {
					subscriptionId = subscription.$el[0].value;
				}
			});

			return this._getConfigurationsData(subscriptionId);
		},

		_onSubscriptionChanged: function(event) {
			var subscriptionId = event.data.component.$el[0].value;

			this.$events.trigger('refreshConfigurations', {
				configurationsData: this._getConfigurationsData(subscriptionId),
				urlData: {
					subscriptionId: subscriptionId
				}
			});
		},

		_onBelowTheLineOptionChange: function(event) {
			event.preventDefault();
			this._switchSubscriptionsList(this._getActiveSubscriptionType());
		},

		_onSubscriptionTypeChange: function(event) {
			event.preventDefault();
			this.$components.subscriptionType.forEach(function(subscriptionType) {
				subscriptionType.$el[0].classList.remove(CLASSES.activeSubscriptionType);
			});

			event.data.component.$el[0].classList.add(CLASSES.activeSubscriptionType);

			this._switchSubscriptionsList(event.data.component.$options.type);
		},

		_switchSubscriptionsList: function(activeType) {
			if (this._isBelowTheLineChecked()) {
				activeType += 'Btl';
			}

			this.hide(SELECTORS.subscriptionPanel);
			this.show('[data-alias="' + activeType + '"]');
		},

		_getConfigurationsData: function(subscriptionId) {
			return {
				subscriptionId: subscriptionId,
				subscriptionType: this._getActiveSubscriptionType(),
				isBtl: this._isBelowTheLineChecked()
			};
		},

		_getActiveSubscriptionType: function() {
			var subscriptionType = 'default';
			if (this.$components.subscriptionType) {
				this.$components.subscriptionType.forEach(function(subscriptionTypeComponent) {
					if (subscriptionTypeComponent.$el[0].classList.contains(CLASSES.activeSubscriptionType)) {
						subscriptionType = subscriptionTypeComponent.$options.type;
					}
				});
			}
			return subscriptionType;
		},

		_isBelowTheLineChecked: function() {
			return this.$components.btlCheckbox ? this.$components.btlCheckbox.isChecked() : false;
		}
	};


/***/ },

/***/ 718:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		mixedProductsOption: '[data-alias="mixedProductsDecision"]'
	};

	/**
		name: Products Checker
		type: controller
		desc: >
			Component that should be used as extension for other components
			which add something to the basket. It checks if current customer
			has different types of products in his basket. In that case we need
			to show modal box with options which products should be keep.
	*/
	module.exports = {
		events: {
			'click $mixedContentDialog $continue': '_onContinueWithMixedProducts',
			'click $mixedPayTypeContentDialog $continue': '_onContinueWithMixedPayType'
		},

		ready: function() {
			// Fix for modal-box events
			if (this.$components.mixedContentDialog) {
				this.$components.mixedContentDialog.$components.continue.$events.on('click $this', this._onContinueWithMixedProducts.bind(this));
			}

			if (this.$components.mixedPayTypeContentDialog) {
				this.$components.mixedPayTypeContentDialog.$components.continue.$events.on('click $this', this._onContinueWithMixedPayType.bind(this));
			}
		},

		/**
			desc: this function should be called in AJAX-response handler when trying to add something to the basket.
			args:
				response: AJAX-response object
				submitButton: button component that triggers request
		*/
		checkMixedProducts: function(response, submitButton) {
			if (response.data.canViewMixedProductsError) {
				submitButton.resetLoading();
				submitButton.disable();
				this.$components.mixedProductsError.open();
			} else if (response.data.mixedProducts === 'paytype') {
				this._showMixedPayTypeDialog(response.data);
				submitButton.resetLoading();
			} else {
				this._showMixedProductsDialog(response.data);
				submitButton.resetLoading();
			}
		},

		/**
		 desc: Checks that Basket contains products of different types B2C/B2B. Closes popup before any action.
		 args:
		 	response: AJAX-response object
		 */
		hasMixedProducts: function(response) {
			var requestFailed = response && !response.success;
			if (requestFailed && this.$components.mixedContentDialog) {
				this.$components.mixedContentDialog.hide();
			}
			return requestFailed && response.data && response.data.mixedProducts;
		},

		_showMixedProductsDialog: function(data) {
			this.mixedProductsData = data;
			this.$components.mixedContentDialog.find(SELECTORS.mixedProductsOption + '[value=' + this.mixedProductsData.addedProductType + ']').prop('checked', true);
			this.$components.mixedContentDialog.show();
		},

		_showMixedPayTypeDialog: function(data) {
			this.mixedProductsData = data;
			this.$components.mixedPayTypeContentDialog.show();
		},

		_onContinueWithMixedProducts: function(event) {
			var decision = this.$components.mixedContentDialog.find(SELECTORS.mixedProductsOption + ':checked').val();

			event.data.component.activityIndicator();

			if (decision !== this.mixedProductsData.addedProductType) {
				this.mixedProductsData.callback.call(this, event, decision);

				return;
			}

			if (this.mixedProductsData.shopUrl) {
				this.$tools.util.redirect(this.mixedProductsData.shopUrl);
			} else {
				this.$components.mixedContentDialog.$components.continue.resetLoading();
				this.$components.mixedContentDialog.hide();
			}
		},

		_onContinueWithMixedPayType: function(event) {
			event.data.component.activityIndicator();
			this.$tools.util.redirect(this.mixedProductsData.shopUrl);
		}
	};


/***/ },

/***/ 719:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		active: 'active',
		parentActive: 'is-active'
	};

	var SELECTORS = {
		discountLine: '[data-selector="discount-line"]',
		valueField: '[data-selector="value"]'
	};
	/**
	name: Basket discount
	type: controller
	desc: Handles discount option in basket list
	options:
	    addUrl: Specifies URL for applying discount.
	    removeUrl: Specifies URL for removing discount.
	    loadSuggestionUrl: Specifies URL for getting discount description.
	    dataFailMessage: message for tooltip if BE didn't send response.
	 */
	module.exports = {
		ready: function() {
			this._initElements();
			this._setValueLimits();
		},
		events: {
			'click $$switchButtons': '_onSwitchClick',
			'click $submitDiscount': '_onAddDiscountData',
			'click $removeDiscount': '_onRemoveDiscountData',
			'change [data-selector="value"]': '_onChangeCheck',
			'keyup [data-selector="value"]': '_onValueCheck',
			'keypress [data-selector="value"]': '_onValueKeypress',
			'beforeShow $discountTooltip': '_setTooltipDiscount'
		},

		_initElements: function() {
			this.$valueField = this.$el.find(SELECTORS.valueField);
		},

		_setValueLimits: function() {
			var activeSwitchComponent;

			if (!this.$components.switchButtons) {
				return;
			}
			activeSwitchComponent = this._getActiveTypeEl();

			if (!activeSwitchComponent) {
				return;
			}

			this.$options.max = activeSwitchComponent.$options.max;
			this.$options.min = activeSwitchComponent.$options.min;
			this._onValueCheck();
		},

		_onSwitchClick: function(event) {
			var component = event.data.component;

			if (component.$options.active !== true) {
				this._showNumberType(component);
				this._setValueLimits();
			}

			return false;
		},

		_showNumberType: function(switchComponent) {
			if (!this.$components.switchButtons) {
				return;
			}
			this.$components.switchButtons.forEach(function(component) {
				component.$el.removeClass(CLASSES.active);
				component.$options.active = false;
				component.$el.parent().removeClass(CLASSES.parentActive);
			});
			switchComponent.$el.addClass(CLASSES.active);
			switchComponent.$el.parent().addClass(CLASSES.parentActive);
			switchComponent.$options.active = true;
		},

		_getActiveTypeEl: function() {
			var activeSwitchComponent = null;
			if (!this.$components.switchButtons) {
				return;
			}
			this.$components.switchButtons.forEach(function(component) {
				if (component.$options.active === true) {
					activeSwitchComponent = component;
				}
			});
			return activeSwitchComponent;
		},

		_getDiscountType: function() {
			if (!this.$components.switchButtons) {
				return;
			}

			return this._getActiveTypeEl().$options.type;
		},

		_getDiscountValue: function() {
			return this.$valueField.val();
		},

		_setDiscountValue: function(value) {
			this.$valueField.val(value);
		},

		_getDiscountData: function() {
			return {
				amountType: this._getDiscountType(),
				amountValue: this._getDiscountValue()
			};
		},

		_onAddDiscountData: function(event) {
			var btn = event.data.component;
			this._onSendDiscountData(btn, this.$options.addUrl);
		},

		_onRemoveDiscountData: function(event) {
			var btn = event.data.component;
			this._onSendDiscountData(btn, this.$options.removeUrl);
		},

		_onSendDiscountData: function(btn, actionUrl, data) {
			var dfd = btn.activityIndicator();
			var discountData = data || this._getDiscountData();

			this.$components.discountError.close();
			this.$tools.data.post(actionUrl, discountData)
				.then(function(response) {
					if (response.success) {
						this.$tools.util.reload();
					} else if (response.data && response.data.errorMessage) {
						this.$components.discountError.setText(response.data.errorMessage);
						this.$components.discountError.open();
					}
				}.bind(this))

				.catch(function() {
					this.$components.discountError.open();
				}.bind(this))

				.finally(function() {
					dfd.reject();
				});
		},

		_onChangeCheck: function() {
			var currentValue = this._getDiscountValue() || '0';
			if (currentValue === '0') {
				this._setDiscountValue(currentValue);
			}
			this._onValueCheck();
		},

		_onValueCheck: function() {
			var currentValue = this._getDiscountValue();

			if (this.$tools.helper.isNumber(this.$options.max) && currentValue > this.$options.max) {
				currentValue = this.$options.max;
			}

			if (this.$tools.helper.isNumber(this.$options.min) && currentValue < this.$options.min) {
				currentValue = this.$options.min;
			}

			this._setDiscountValue(currentValue);
		},

		_onValueKeypress: function(event) {
			var key = String.fromCharCode(event.keyCode || event.which);
			var currentValue = this.$valueField.val();

			if ((!/[0-9,]/.test(key) || /[,]/.test(key)) && /[,]/.test(currentValue)) {
				return false;
			}
		},

		_isUpdatedValue: function() {
			var currentValue = this._getDiscountValue();
			var currentType = this._getDiscountType();

			return this.currentValue !== currentValue || this.currentType !== currentType;
		},

		_setUpdatedValue: function() {
			this.currentValue = this._getDiscountValue();
			this.currentType = this._getDiscountType();
		},

		_setTooltipDiscount: function() {
			var discountData;
			var $discountLine = this.$components.discountTooltip.$el.find(SELECTORS.discountLine);
			var isUpdatedValue = this._isUpdatedValue();

			if (isUpdatedValue) {
				this._setUpdatedValue();
				discountData = this._getDiscountData();
				this.$components.discountTooltip.setLoading();
				this.$tools.data.get(this.$options.loadSuggestionUrl, discountData)
					.then(function(response) {
						if (response.success && response.data) {
							$discountLine.html(response.data);
						} else {
							$discountLine.html(this.$options.failMessage);
						}
					}.bind(this))

					.catch(function() {
						$discountLine.html(this.$options.failMessage);
					}.bind(this))

					.finally(function() {
						this.$components.discountTooltip.resetLoading();
					}.bind(this));
			}
		}
	};


/***/ },

/***/ 720:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Basket Item
	type: controller
	desc: Handles specific item in basket items list.
	options:
		basketItemId: Specifies current basket.
	events:
		removeProduct: Fires on click to remove basket item from a basket.
	*/
	module.exports = {
		events: {
			'click $removeBasketItem': '_onRemoveClick'
		},
		/**
		 desc: Disables all links/buttons.
		 */
		disableControls: function() {
			if (this.$components.removeBasketItem) {
				this.$components.removeBasketItem.$el[0].classList.add('hidden-events');
			}
		},
		/**
		 desc: Enables all links/buttons.
		 */
		enableControls: function() {
			if (this.$components.removeBasketItem) {
				this.$components.removeBasketItem.$el[0].classList.remove('hidden-events');
			}
		},

		_onRemoveClick: function(event) {
			event.preventDefault();

			this.$events.trigger('removeProduct', this._getParams());
		},

		_getParams: function() {
			return {
				url: this.$components.removeBasketItem.$options.url,
				basketItemId: this.$options.basketItemId,
				seqNo: this.$options.seqNo || null
			};
		}
	};


/***/ },

/***/ 721:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var BasketService = __webpack_require__(415);

	module.exports = {
		events: {
			'removeProduct $$basket-item': '_checkFamilyRemove'
		},

		initialize: function() {
			this.basketService = new BasketService();
		},

		ready: function() {
			// Fix for modal-box events
			this.$components.removeFamilyPopup.$components.removeFamily.$events.on('click $this', this._removeFamily.bind(this));
		},

		empty: function(optionalUrl) {
			return this.basketService.emptyBasket(optionalUrl || this.$options.emptyUrl)
				.then(this._refreshBasket.bind(this));
		},

		_checkFamilyRemove: function(event, data) {
			if (data.seqNo) {
				this.$components.removeFamilyPopup.show();
			} else {
				this._remove(data);
			}
		},

		_getProductsParams: function() {
			return this.$components['basket-item'].map(function(item) {
				return item._getParams();
			});
		},

		_getFamilyParams: function() {
			var productsParams = this._getProductsParams();

			return productsParams.filter(function(params) {
				return params.seqNo;
			});
		},

		_removeFamily: function() {
			var params = this._getFamilyParams();

			this.$components.removeFamilyPopup.hide();

			return this.basketService.removeProducts(params)
				.then(this._refreshBasket.bind(this));
		},

		_remove: function(data) {
			if (this.removeInProgress) {
				return;
			}

			this.$components['basket-item'].forEach(function(item) {
				item.disableControls();
			});

			this.$components.loaderOverlay.turnOn();

			this.removeInProgress = true;

			this.basketService.removeProduct(data.url, data.basketItemId)
				.then(this._refreshBasket.bind(this))

				.catch(function() {
					this.$components['basket-item'].forEach(function(item) {
						item.enableControls();
						this.removeInProgress = false;
					}.bind(this));
				}.bind(this));
		},

		_refreshBasket: function(resp) {
			var data = (resp && resp.data) || {};

			if (data && data.redirectUrl) {
				window.location.replace(data.redirectUrl);
			} else {
				window.location.reload();
			}
		}
	};


/***/ },

/***/ 722:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Number Selection & Port-in
	type: controller
	desc: Handles Number Selection page
	options:
		clearUrl: Specifies URL for reset all subscriptions.
	subscriptions:
		checkReady: Check if all subscriptions are submitted.
		resetAll: Fires for reset all subscriptions.
	*/
	module.exports = {
		events: {
			'click $resetAll': '_checkResetAll',
			'checkReady $$subscription': '_setButtonsState',
			'resetNumber $$subscription': '_resetSubscriptionNumber'
		},

		ready: function() {
			this._setButtonsState();

			// Fix for modal-box events
			this.$components.resetAllMessage.$components.resetAll.$events.on('click $this', this._resetAll.bind(this));
		},

		_resetSubscriptionNumber: function(event, data) {
			var subscriptionComponent = event.data.component;

			this.$tools.data.post(data.component.$options.clearUrl, data.formsData)
				.then(function(response) {
					if (response.success) {
						subscriptionComponent.resetSubscription(response.data).then(this._setButtonsState.bind(this));
					} else {
						data.component._showError(response, 'saveNumbersError');
					}
				}.bind(this));
		},

		_checkResetAll: function() {
			this.$components.resetAllMessage.show();
		},

		_resetAll: function(event) {
			var btnAllReset = this.$components.resetAll;

			event.preventDefault();

			btnAllReset.setLoading();
			this.$components.resetAllMessage.hide();
			this._hideError();
			this._sendResetAllRequest(btnAllReset);
		},

		_sendResetAllRequest: function(btnAllReset) {
			this.$tools.data.post(this.$options.clearUrl)
				.then(function(response) {
					if (!response.success) {
						this._showError(response);
						btnAllReset.resetLoading();
					}
				}.bind(this));
		},

		_showError: function(error) {
			if (error && this.$tools.helper.isObject(error) && error.errorMessages && error.errorMessages[0]){
				this.$components.resetError.setText(error.errorMessages[0]);
				this.$components.resetError.open();
			}
		},

		_hideError: function() {
			this.$components.resetError.close();
		},

		_checkAllSubscriptionsAssigned: function() {
			return this.$components.subscription.every(function(subscription) {
				return subscription.canProceedConfiguration();
			});
		},

		_checkAnySubscriptionAssigned: function() {
			return this.$components.subscription.some(function(subscription) {
				return subscription.canResetConfiguration();
			});
		},

		_setButtonsState: function() {
			this.$components.numberConfigurationProceed[this._checkAllSubscriptionsAssigned() ? 'enable' : 'disable']();
			this.$components.resetAll[this._checkAnySubscriptionAssigned() ? 'enable' : 'disable']();
		}

	};


/***/ },

/***/ 723:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Number Selection & Port-in for a saved number
	type: controller
	desc: Handles option to a saved number
	options:
		basketItemId: Basket item id.
		clearUrl: Specifies URL for clearing number
	*/
	module.exports = {
		events: {
			'click $resetButton': '_onResetNumber'
		},
		/**
		 desc: Fires to reset option for a new number.
		 */
		_onResetNumber: function(event) {
			var btnDeferred = this.$components.resetButton.activityIndicator();

			event.preventDefault();

			this.$components.saveNumbersError.close();

			this.$tools.data.post(
				this.$options.clearUrl,
				{
					BasketItemId: this.$options.basketItemId
				}
			).then(function(response) {
				if (response.success) {
					this.$events.trigger('resetNumber', response.data);
				} else {
					btnDeferred.reject();
					if (this.$tools.helper.isObject(response) && response.errorMessages && response.errorMessages[0]){
						this.$components.saveNumbersError.setText(response.errorMessages[0]);
						this.$components.saveNumbersError.open();
					}
				}
			}.bind(this));
		}

	};


/***/ },

/***/ 724:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Number Selection & Port-in subscription
	type: controller
	desc: Handles Number Selection subscription
	options:
		clearUrl: Specifies URL for reseting current subscription.
	subscriptions:
		setNumber: Show chosen number and lock subscription for editing
		showReset: Fires for reseting all subscriptions.
		resetNumber: Reset current subscription.
		showError: Show error in case of unsuccessful ajax calls.
		hideError: Show error in case of unsuccessful ajax calls.
	*/
	module.exports = {
		events: {
			'updateNumber $$numberOptions': '_setSubscription',
			'hideError $$numberOptions': '_hideError',
			'showError $$numberOptions': '_showError',
			'updatePhone $product': '_subscriptionCheck',
			'resetNumber $product': '_subscriptionCheck',
			'resetNumber $chosen': '_resetSubscription'
		},

		ready: function() {
			if (this._isAssignedNumberOption()) {
				this._deviceUnlock();
			} else {
				this._deviceLock();
			}
		},

		/**
		 desc: Fires to get Imei number of subscription.
		 */
		getImeiNumber: function() {
			if (this.$elements.imeiNumber) {
				return this.$elements.imeiNumber.val() || '';
			}

			return '';
		},

		/**
		 desc: Fires to get Imei number of subscription.
		 */
		canResetConfiguration: function() {
			return this.$components.chosen || (this.$components.product && this.$components.product.$options.saved);
		},

		/**
		 desc: Fires to get Imei number of subscription.
		 */
		canProceedConfiguration: function() {
			return !(this.$components.numberOptions || (this.$components.product && !this.$components.product.$options.saved));
		},

		/**
		 desc: Fires to reset method of each selection type.
		 */
		resetSubscription: function(data) {
			return this.html(data.html, this.$elements.options).then(
				function() {
					this._deviceLock();
					this._subscriptionCheck();
				}.bind(this));
		},

		/**
		 desc: Fires to show Imei duplicate error
		 */
		showImeiError: function(subscriptionData) {
			var optionData = subscriptionData.optionData;
			var optionEvent = subscriptionData.event;
			var optionComponent = optionEvent.data.component;
			var errorData = {
				error: {
					errorMessages: [this.$options.imeiError]
				},
				alias: optionComponent.getErrorAlias()
			};

			this._showError(optionEvent, errorData);
			optionData.btnDeferred && optionData.btnDeferred.reject();
		},

		_showError: function(event, params) {
			var component = event.data.component;
			var error = params.error;
			var alias = params.alias;
			var errorComponent = component.$components[alias];

			if (errorComponent && error && this.$tools.helper.isObject(error) && error.errorMessages && error.errorMessages[0]){
				errorComponent.setText(error.errorMessages[0]);
				errorComponent.open();
			}
		},

		_hideError: function(event) {
			var component = event.data.component;

			component.$components.saveNumbersError.close();
		},

		_subscriptionCheck: function() {
			this.$elements.options[0].scrollIntoView();
			this.$events.trigger('checkReady');
		},

		_showReset: function() {
			this._subscriptionCheck();
		},

		_isAssignedNumberOption: function() {
			return !this.$components.numberOptions;
		},

		_setSubscription: function(event, data) {
			this.html(data.html, this.$elements.options).then(function() {
				this._deviceUnlock();
				this._subscriptionCheck();
			}.bind(this));
		},

		_resetSubscription: function(event, data) {
			this.resetSubscription(data);
		},

		_deviceUnlock: function() {
			this.$components.product && this.$components.product.unlock();
		},

		_deviceLock: function() {
			this.$components.product && this.$components.product.lock();
		}
	};


/***/ },

/***/ 725:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var common = __webpack_require__(390);

	/**
	name: Number Selection & Port-in for existing customer
	type: controller
	desc: Handles option for existing customers
	options:
		url: Specifies URL for submitting number.
		penaltyUrl: Specifies URL for numbers with penalty.
		id: Basket item id.
	**/
	module.exports = app.core.util.extend({}, common, {
		events: app.core.util.extend({}, common.events, {
			'change needNewSimCardInfo': '_checked'
		}),
		_checked: function() {
			this.$elements.simCardType && this.$elements.simCardType.toggle();
		},

		_getData: function() {
			var data = common._getData.call(this);

			if (this._isPenalty) {
				data.IsWarned = true;
			}

			return data;
		},

		errorSave: function(response) {
			if (response.data && response.data.status) {
				this._processErrorResponse(response);
			} else {
				common._showError.call(this, response, this.getErrorAlias());
			}
		},

		_processErrorResponse: function(response) {
			var warning = {penalty : 3, subsidy : 4};
			if (response.data && response.data.status === warning.penalty) {
				common._showError.call(this, response, 'penaltyWarning');
				this._isPenalty = true;
				this.currentNumber = this._getNumber();
			} else if (response.data && response.data.status === warning.subsidy) {
				common._showError.call(this, response, 'subsidyWarning');
			} else {
				common._showError.call(this, response, this.getErrorAlias());
			}
		},

		_getNumber: function() {
			return this.$components.numberForm.$components.existNumber.getValue();
		}

	});


/***/ },

/***/ 726:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var common = __webpack_require__(390);

	/**
	name: Number Selection & Port-in for a new number
	type: controller
	desc: Handles option for a new number
	options:
		url: Specifies URL for submitting number.
		id: Basket item id.
	*/
	module.exports = app.core.util.extend({}, common, {
		events: app.core.util.extend({}, common.events, {
			'setProceed $numbers': '_setProceed'
		}),

		_setProceed: function(event, isDisabled) {
			this.$el.find('.check-number').prop('disabled', isDisabled);
		},

		_getNumber: function() {
			return this.$components.numbers._getNumber();
		}

	});


/***/ },

/***/ 727:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var numberTemplate = __webpack_require__(728);

	/**
	 name: Number Selection & Port-in for a new number
	 type: controller
	 desc: Handles option or a new number
	 options:
	 url: Specifies URL for getting set of new numbers.
	 basketItemId: Basket item id.
	 */
	module.exports = {
		events: {
			'click refreshLink': '_getNumbers',
			'search $search': 'getNumbers',
			'input formSearchInput': '_onSearchKeypress',
			'change comboSwitcher': '_onSwitchClick'
		},

		_onSearchKeypress: function(event) {
			event.preventDefault();
			event.$el.val(parseInt(event.$el.val(), 10));
		},

		_onSwitchClick: function() {
			this._showNumberType();
			this.getNumbers();
		},

		_getNumbers: function(event) {
			event.preventDefault();
			this.getNumbers();
		},

		/**
		 desc: Loads a set of new numbers.
		 */
		getNumbers: function() {
			var params = this._getSearchOptions();

			this._hideUpdateError();
			this._processLoading(true);
			this.getNumbersRequest(params);
		},

		/**
		 desc: Gets new numbers and updates numbers list.
		 */
		getNumbersRequest: function(params) {
			this.$tools.data.get(this.$options.url, params)
				.then(function(response) {
					if (response.success && response.data && response.data.numberList) {
						this._renderNumbersList(response.data);
					} else {
						this.$elements.numberPortingList.empty();
						this._showUpdateError(response);
					}
				}.bind(this))

				.finally(function() {
					this._processLoading(false);
				}.bind(this));
		},

		_showNumberType: function() {
			var type = this._getNumberLevel();
			if (type !== 'normal') {
				this.$components.goldNumbersWarning.open();
			} else {
				this.$components.goldNumbersWarning.close();
			}
		},

		_renderNumbersList: function(data) {
			var numbers = data.numberList;
			var template = [];
			var index;
			if (!numbers.length) {
				return;
			}

			this.$elements.numberPortingList.empty();

			for (index = 0; index < numbers.length; index++) {
				numbers[index].BasketItemId = this.$options.basketItemId;
				numbers[index].checked = (index === 0) ? 'checked' : '';

				template.push(this.$tools.template.parse(numberTemplate)(numbers[index]));
			}

			this.html(template.join(''), this.$elements.numberPortingList);

		},

		_hideUpdateError: function() {
			this.$components.updateNumbersError.close();
		},

		_showUpdateError: function(error) {
			if (error && this.$tools.helper.isObject(error) && error.errorMessages && error.errorMessages[0]) {
				this.$components.updateNumbersError.setText(error.errorMessages[0]);
				this.$components.updateNumbersError.open();
			}
		},

		_processLoading: function(isLoading) {
			this.$el.toggleClass('loading', isLoading);
			this.$elements.comboSwitcher.prop('disabled', isLoading);
			this.$events.trigger('setProceed', isLoading);
		},

		_getNumberLevel: function() {
			return this.$elements.comboSwitcher.filter(':checked').data('type');
		},

		_getMask: function() {
			return '*' + this.$elements.formSearchInput.val() + '*' || '';
		},

		_getNumber: function() {
			if (this.$elements.numberPortingList.find('input:checked')) {
				return this.$elements.numberPortingList.find('input:checked')[0].value;
			}
			return '';
		},

		_getSearchOptions: function() {
			return {
				basketItemId: this.$options.basketItemId,
				numberLevel: this._getNumberLevel(),
				searchMask: this._getMask()
			};
		}

	};


/***/ },

/***/ 728:
/***/ function(module, exports) {

	module.exports = "<li class=\"col-md-4 trailer--small \">\n\t<div class=\"rel form-radio ovh\">\n\t\t<input type=\"radio\" name=\"PhoneNumber\" value=\"<%= PhoneNumber %>\" id=\"number-<%= PhoneNumber %>-<%= BasketItemId %>\" <%= checked %>  />\n\t\t<label for=\"number-<%= PhoneNumber %>-<%= BasketItemId %>\">\n\t\t\t<%= DisplayPhoneNumber %>\n\t\t</label>\n\t\t<div class=\"loader loader--centered\">\n\t\t\t<div class=\"loader__spinner\"><i></i></div>\n\t\t</div>\n\t</div>\n</li>\n"

/***/ },

/***/ 729:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// TODO: This is obsolete component for old basket, but it's still used on Identification page (Denmark). Must be removed!

	var scrollToComponent = __webpack_require__(555);

	var DEFAULT_SUBSCRIPTION_TYPE = 'GsmSubscription';

	module.exports = {
		initialize: function() {
			this.properties = {};
		},

		ready: function() {
			this.$components.BasketList.$events.on('basket-proceeded $this', function() {
				this.$el.addClass('basket-proceeded');
			}.bind(this));
			this.$components.BasketList.$events.on('basketLock $this', this._basketLock.bind(this));

			this._subscribeToChildrenEvents();
		},

		events: {
			'click [data-currentblock]': 'proceedToNextBlock'
		},

		proceedToNextBlock: function(event) {
			var buttonAlias = event.$el.data('alias');
			var btnDeferred = null;
			var buttonComponent;

			event.preventDefault();

			if (event.$el.data('loaded') === '1') {
				return;
			}

			if (buttonAlias) {
				buttonComponent = this._searchProceedButtonComponent(buttonAlias);

				if (buttonComponent) {
					btnDeferred = buttonComponent.activityIndicator();
				}
			}

			this._loadNextBlock(event.$el.data('currentblock'), btnDeferred);

			event.$el.data('loaded', '1');
		},

		_loadNextBlock: function(currentBlockName, btnDeferred) {
			var service = this.$tools.globalConfigs('TN.config.shop.basket.BasketList.services.NextFlowBasket', null);
			var params;

			if (service) {
				params = {
					current: currentBlockName || null,
					subscriptionType: this._getSubscriptionType()
				};

				this.$tools.data.get(service, params)
					.then(function(response) {
						this._processNextBlock(response, currentBlockName, btnDeferred);
					}.bind(this));
			}
		},

		_processNextBlock: function(response, currentBlockName, btnDeferred) {
			var flowData;
			if (response.success === true) {
				if (response.data) {
					flowData = response.flowData || {};

					if (flowData.subscriptionType) {
						this.properties.subscriptionType = flowData.subscriptionType;
					}

					this._callChildProcessor(currentBlockName, '_loadedNextBlock', response);
					this._appendBlock(response.data, flowData.div, btnDeferred);
				}
			} else {
				btnDeferred.reject();
				this.$el.find('[data-currentblock = "' + currentBlockName + '"]').data('loaded', '0');
				this._callChildProcessor(currentBlockName, 'validateProceedErrors', response);
			}
		},

		_appendBlock: function(data, el, btnDeferred) {
			var $targetBlock = el;
			if (data && data.html) {

				if ($targetBlock && typeof $targetBlock === 'string') {
					$targetBlock = this.$tools.dom.find('#' + el); // try to find target block by block ID
				}

				if ($targetBlock === undefined || !$targetBlock.length) {
					$targetBlock = this.$el;
				}

				$targetBlock.addClass('js-hidden');

				this.html(data.html, $targetBlock).then(function() {
					var SCROLL = 200;
					this._updateChildrenOptions(data);
					this._subscribeToChildrenEvents();
					$targetBlock.slideDown();
					scrollToComponent.scrollTo($targetBlock, SCROLL);

					btnDeferred && btnDeferred.resolve();

					if (data.flowFinished) {
						this._basketLock();
					}
				}.bind(this));
			}
		},

		_basketLock: function() {
			this.$el.find('input, button, select').attr('disabled', true);
			this.$el.find('[data-component="select"]').addClass('form-select--disabled');
			this.$el.find('[data-component="Shop::numbers-dropdown"], .button--switch, .empty-basket, .icon-remove, .section--new-number').addClass('disabled');
		},

		_validateForms: function() {
			var valid = true;
			var $parent = this;
			var $forms = this.$el.find('form').filter(function() {
				return typeof $parent.$tools.dom.find(this).validate === 'function';
			});
			var $form;

			$forms.each(function() {
				$form = $parent.$tools.dom.find(this);

				$form.validate();

				valid = valid && $form.valid();
			});

			return valid;
		},

		_updateChildrenOptions: function(params) {
			params = params || {};
			delete params.html; // HTML is redundant in child

			this.$children.forEach(function(childComponent) {
				this._callChildProcessor(childComponent.$options.alias, 'updateOptions', params);
			}, this);
		},

		_subscribeToChildrenEvents: function() {
			this.$children.forEach(function(childComponent) {
				childComponent.$events.off('basketNextStep $this');

				childComponent.$events.on('basketNextStep $this', function(event, data) {
					this._loadNextBlock(data.blockName, data.btnDeferred);
				}.bind(this));

				childComponent.$events.off('deleteChildModule $this');
				childComponent.$events.on('deleteChildModule $this', this._deleteChildModule.bind(this));

				childComponent.$events.off('reloadBasketSummary $this');
				childComponent.$events.on('reloadBasketSummary $this', this._reloadBasketSummary.bind(this));
			}.bind(this));
		},

		_deleteChildModule: function(event, data) {
			if (data.delAlias && data.delAlias.length) {
				data.delAlias.forEach(function(toDelete) {
					if (this.$components[toDelete]) {
						this.destroyChild(this.$components[toDelete]);
					}
				}.bind(this));
			}
		},

		_reloadBasketSummary: function() {
			var service = this.$tools.globalConfigs('TN.config.shop.basket.BasketList.services.GetBlock', null);
			if (service) {
				this.load(service, '#mainBasket', null, function(response) { // ToDo: 4th argument in .load()
					if (response.success) {
						this._deleteChildModule(null, {
							delAlias: ['BasketList']
						});
					}
				}.bind(this));
			}
		},

		_getSubscriptionType: function() {
			return this.properties.subscriptionType || DEFAULT_SUBSCRIPTION_TYPE;
		},

		_searchProceedButtonComponent: function(alias) {
			var filtered = this.$children.filter(function(child) {
				return !!child.$components[alias];
			});

			return filtered.length === 1 ? filtered[0].$components[alias] : null;
		},

		_callChildProcessor: function(childBlockName, processorName, data) {
			if (this.$components[childBlockName] && typeof this.$components[childBlockName][processorName] === 'function') {
				this.$components[childBlockName][processorName](data);
			}
		}
	};


/***/ },

/***/ 730:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Accept offer
	type: controller
	desc: Handles Accept offer page
	*/
	module.exports = {
		events: {
			'click $declineOffer': 'onDeclineOfferClick',
			'click $acceptOffer': 'onAcceptOfferClick',
			'changed $termsAndConditions': 'onTermsChange'
		},

		ready: function() {
			if (!this.$components.termsAndConditions && this.$components.acceptOffer) {
				this.$components.acceptOffer.enable();
			}

			// Fix for modal-box events
			this.$components.declineOfferDialog.$events.on('declineOfferConfirm $this', this.declineOffer.bind(this));
			this.$components.declineOfferDialog.$events.on('requestCallback $this', this.requestCallback.bind(this));
		},

		onDeclineOfferClick: function() {
			this.$components.declineOfferDialog.$events.trigger('show');
		},

		declineOffer: function() {
			var declineOfferBtn = this.$components.declineOffer;

			this._execute(declineOfferBtn)
				.then(function(res) {
					this.$tools.util.redirect(res.data.redirectUrl);
				}.bind(this));
		},

		requestCallback: function(event, redirectUrl) {
			this.$tools.util.redirect(redirectUrl);
		},

		onAcceptOfferClick: function() {
			var acceptOfferBtn = this.$components.acceptOffer;

			this._execute(acceptOfferBtn)
				.then(function(res) {
					this.$tools.util.redirect(res.data.redirectUrl);
				}.bind(this));
		},

		onTermsChange: function() {
			if (this.$components.termsAndConditions.isChecked()) {
				this.$components.acceptOffer.enable();
				this.$components.tcWarning.close();
			} else {
				this.$components.acceptOffer.disable();
				this.$components.tcWarning.open();
			}
		},

		_execute: function(actionBtn) {
			var dfd = actionBtn.activityIndicator();
			var url = actionBtn.$options.url;

			this.$tools.data.ajax({
				url: url,
				type: 'POST',
				contentType: 'application/json'
			}).then(function(res) {
				dfd[res.success ? 'resolve' : 'reject'](res);
			}).catch(dfd.reject.bind(dfd));

			return dfd;
		}
	};


/***/ },

/***/ 731:
/***/ function(module, exports) {

	'use strict';

	/**
	name: New offer
	type: controller
	desc: Handles New Offer page
	subscriptions:
		createOffer: Open create offer confirmation dialog.
		deleteBasket: Open delete basket confirmation dialog.
		createOfferConfirm: Set email value, check validation state, submit createOffer form.
		deleteBasketConfirm: Delete basket.
		cleanPersonalMessage: Remove text from he personalMessage field.
		resetGreatings: Set default value to the greetings field
	 */
	module.exports = {
		events: {
			'click $createOffer': 'onCreateOfferClick',
			//'customerEmailConfirm $customerEmailConfirmDialog': 'createOffer',
			'click $deleteBasket': 'onDeleteBasketClick',
			//'deleteBasketConfirm $deleteBasketConfirmationDialog': 'deleteBasket',
			'click [data-selector="cleanPersonalMessage"]': 'onCleanPersonalMessageClick',
			'click [data-selector="resetGreatings"]': 'onResetGreatingsClick'
		},

		ready: function() {
			// Fix for modal-box events
			this.$components.customerEmailConfirmDialog.$events.on('customerEmailConfirm $this', this.createOffer.bind(this));
			this.$components.deleteBasketConfirmationDialog.$events.on('deleteBasketConfirm $this', this.deleteBasket.bind(this));
		},

		onCreateOfferClick: function() {
			if (this.valid()) {
				this.$components.customerEmailConfirmDialog.$events.trigger('show');
				this.$components.customerEmailConfirmDialog.$events.trigger('setEmail', this.getCustomerEmail());
			}
		},

		createOffer: function(event, confirmedCustomerEmail) {
			this.$el.find('[data-selector="customerEmail"]').val(confirmedCustomerEmail);
			if (this.valid()) {
				this.submit();
			}
		},

		onDeleteBasketClick: function() {
			this.$components.deleteBasketConfirmationDialog.$events.trigger('show');
		},

		deleteBasket: function() {
			this.$components.deleteBasket.activityIndicator();
			if (this.$components.basketItems) {
				this.$components.basketItems.empty(this.$components.deleteBasket.$options.url);
			}
		},

		onResetGreatingsClick: function(event) {
			var greatingsField = this.$el.find('[data-selector="greatings"]');
			var standartMessage = greatingsField.data('standart');

			event.preventDefault();

			greatingsField.val(standartMessage);
			greatingsField.trigger('keyup');
		},

		onCleanPersonalMessageClick: function(event) {
			event.preventDefault();

			this.$el.find('[data-selector="personalMessage"]').val('').focus();
		},

		getCustomerEmail: function() {
			var form = this.$components.createOfferForm;
			return (form.serialize() || {}).CustomerEmail || '';
		},

		submit: function() {
			var form = this.$components.createOfferForm;
			var formData = form.serialize();
			var action = form.$options.action;
			var dfd = this.$components.createOffer.activityIndicator();

			return this.$tools.data.ajax({
				url: action,
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(formData)
			}).then(function(res){
				var redirectUrl;
				if (!res.success) {
					dfd.reject();
					return;
				}

				redirectUrl = (res.data || {}).redirectUrl;

				if (this.$tools.util.iniframe()) {
					this.backToPipeline(this.getCustomerEmail());
				} else if (redirectUrl) {
					this.$tools.util.redirect(redirectUrl);
				}
			}.bind(this))
			.catch(dfd.reject.bind(dfd));
		},

		backToPipeline: function(confirmedCustomerEmail) {
			window.parent.postMessage({
				method: 'backToPipeline',
				type: 'action',
				email: confirmedCustomerEmail || ''
			}, '*');
		},

		valid: function() {
			var form = this.$components.createOfferForm;
			return form.valid();
		}
	};


/***/ },

/***/ 732:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Offer details
	type: controller
	desc: Handles offer details page
	*/
	module.exports = {
		events: {
			'click $resendOffer': 'onResendOfferClick',
			'customerEmailConfirm $customerEmailConfirmDialog': 'resendOffer',
			'click $declineOffer': 'onDeclineOfferClick',
			'click $alternateOffer': 'onAlternateOfferClick',
			'click $getBack': 'onGetBackClick'
		},

		ready: function() {
			// Fix for modal-box events
			this.$components.alternateOfferDialog.$events.on('alternateOfferConfirm $this', this.alternateOffer.bind(this));
			this.$components.declineOfferDialog.$events.on('declineOfferConfirm $this', this.declineOffer.bind(this));
		},

		onResendOfferClick: function() {
			if (this.valid()) {
				this.$components.customerEmailConfirmDialog.$events.trigger('show');
				this.$components.customerEmailConfirmDialog.$events.trigger('setEmail', this.getCustomerEmail());
			}
		},

		resendOffer: function(event, confirmedCustomerEmail) {
			this.$el.find('[data-selector="customerEmail"]').val(confirmedCustomerEmail);

			if (this.valid()) {
				this.submit();
			}
		},

		onAlternateOfferClick: function() {
			this.$components.alternateOfferDialog.$events.trigger('show');
		},

		alternateOffer: function() {
			var alternateOfferBtn = this.$components.alternateOffer;
			var alternateOfferUrl = alternateOfferBtn.$options.url;

			this._execute(alternateOfferBtn, alternateOfferUrl)
				.then(function(res) {
					this.$tools.util.redirect(res.data.redirectUrl);
				}.bind(this));
		},

		onDeclineOfferClick: function(event) {
			event.preventDefault();

			this.$components.declineOfferDialog.$events.trigger('show');
		},

		declineOffer: function() {
			var declineOfferBtn = this.$components.declineOffer;
			var declineOfferUrl = declineOfferBtn.$options.url;

			this._execute(declineOfferBtn, declineOfferUrl)
				.then(function(res) {
					var redirectUrl = (res.data || {}).redirectUrl;

					if (this.$tools.util.iniframe()) {
						this.backToPipeline();
					} else if (redirectUrl) {
						this.$tools.util.redirect(redirectUrl);
					}
				}.bind(this));
		},

		onGetBackClick: function(event) {
			event.preventDefault();

			this.backToPipeline();
		},

		getCustomerEmail: function() {
			var form = this.$components.resendOfferForm;

			return (form.serialize() || {}).CustomerEmail || '';
		},

		submit: function() {
			var resendOfferForm = this.$components.resendOfferForm;
			var resendOfferBtn = this.$components.resendOffer;
			var resendOfferUrl = resendOfferForm.$options.url;
			var resendOfferData = resendOfferForm.serialize();

			this._execute(resendOfferBtn, resendOfferUrl, resendOfferData)
				.then(function(res) {
					var redirectUrl = (res.data || {}).redirectUrl;

					if (this.$tools.util.iniframe()) {
						this.backToPipeline(this.getCustomerEmail());
					} else if (redirectUrl) {
						this.$tools.util.redirect(redirectUrl);
					}
				}.bind(this));
		},

		backToPipeline: function(confirmedCustomerEmail) {
			window.parent.postMessage({
				method: 'backToPipeline',
				type: 'action',
				email: confirmedCustomerEmail || ''
			}, '*');
		},

		valid: function() {
			var form = this.$components.resendOfferForm;

			return form.valid();
		},

		_execute: function(actionBtn, actionUrl, data) {
			actionBtn.activityIndicator();

			return this.$tools.data.ajax({
				url: actionUrl,
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(data)
			})
				.then(function(res) {
					if (res.success) {
						return res;
					}

					return this.$tools.q.reject(res);
				}.bind(this))

				.finally(function() {
					actionBtn.resetLoading();
				});
		}
	};


/***/ },

/***/ 733:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Alternate offer dialog
	type: controller
	desc: Handles alternate offer dialog
	 */

	module.exports = {
		events: {
			'click $cancel': 'hide',
			'click $alternate': 'onAlternateClick'
		},
		onAlternateClick: function() {
			this.$events.trigger('alternateOfferConfirm');
			this.hide();
		},
		hide: function() {
			this.$events.trigger('hide');
		}
	};


/***/ },

/***/ 734:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Create offer confirmation dialog
	type: controller
	desc: Handles create offer confirmation dialog
	subscriptions:
		cancel: Close current dialog.
		confirm: Trigger 'createOfferConfirm' event with email
	 */

	module.exports = {
		events: {
			'click $cancel': 'hide',
			'click $confirm': 'onConfirmClick'
		},
		initialize: function() {
			this.$events.on('setEmail $this', this.onSetEmail.bind(this));
		},
		onSetEmail: function(event, email) {
			this.$el.find('[data-selector="confirmCustomerEmail"]').val(email);
		},
		onConfirmClick: function() {
			var form = this.$components.confirmCustomerEmailForm;
			if (form.valid()) {
				this.confirm(form);
			}
		},
		confirm: function(form) {
			var formData = form.serialize();
			this.$events.trigger('customerEmailConfirm', formData.ConfirmCustomerEmail);
			this.hide();
		},
		hide: function() {
			this.$events.trigger('hide');
		}
	};


/***/ },

/***/ 735:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Decline offer customer dialog
	type: controller
	desc: Handles decline offer customer dialog
	 */

	module.exports = {
		events: {
			'click $cancel': 'hide',
			'click $decline': 'onDeclineClick',
			'click $callback': 'onCallbackClick'
		},
		onDeclineClick: function() {
			this.$events.trigger('declineOfferConfirm');
			this.hide();
		},
		onCallbackClick: function() {
			var redirectUrl = this.$components.callback.$options.redirectUrl;
			this.$events.trigger('requestCallback', redirectUrl);
			this.hide();
		},
		hide: function() {
			this.$events.trigger('hide');
		}
	};


/***/ },

/***/ 736:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Delete basket confirmation dialog
	type: controller
	desc: Handles delete basket confirmation dialog
	subscriptions:
		cancel: Close current dialog.
		confirm: Trigger 'deleteBasketConfirm' event
	 */

	module.exports = {
		events: {
			'click $cancel': 'hide',
			'click $confirm': 'onConfirmClick'
		},
		onConfirmClick: function() {
			this.$events.trigger('deleteBasketConfirm');
			this.hide();
		},
		hide: function() {
			this.$events.trigger('hide');
		}
	};


/***/ },

/***/ 737:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Billing addressForm
	type: controller
	desc: Handles changing address's source
	 */
	module.exports = {
		events: {
			'change source': '_onSourceChange'
		},

		ready: function() {
			[].slice.call(this.$elements.source || [])
				.filter(function(el) { return el.checked; })
				.forEach(this._changeSource.bind(this));
		},

		_onSourceChange: function(event) {
			this._changeSource(event.$el[0]);
		},

		_changeSource: function(el) {
			[].slice.call(this.$elements.source)
				.map(this._getSourceTarget.bind(this))
				.forEach(this._hide.bind(this));

			this._show(this._getSourceTarget(el));
		},

		_getSourceTarget: function(el) {
			return el.dataset.sourceTarget;
		},

		_show: function(sourceTarget) {
			this.$elements[sourceTarget].show();
		},

		_hide: function(sourceTarget) {
			this.$elements[sourceTarget].hide();
		}
	};


/***/ },

/***/ 738:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Verbal accept agent initials dialog
	type: controller
	desc: Handles delete basket confirmation dialog
	subscriptions:
		cancel: Close current dialog.
		confirm: Trigger 'deleteBasketConfirm' event
	 */

	module.exports = {
		events: {
			'click $verbalAcceptAgentInitialsForm $cancel': 'hide',
			'click $verbalAcceptAgentInitialsForm $confirm': 'onConfirmClick'
		},

		onConfirmClick: function() {
			var form = this.$components.verbalAcceptAgentInitialsForm;
			if (form.valid()) {
				this.confirm(form);
			}
		},

		confirm: function(form) {
			var formData = form.serialize();
			this.$events.trigger('etmAgentInitials', formData.EtmAgentInitials);
			this.hide();
		},

		hide: function() {
			this.$events.trigger('hide');
		}
	};


/***/ },

/***/ 739:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'typeWatch $Amount': 'update',
			'change $UpfrontPaymentMethods': 'update'
		},
		update: function() {
			var amountField = this.$components.Amount.$el;
			var amount = amountField.val();
			var billingFee = this.$components.UpfrontPaymentMethods ? this.$components.UpfrontPaymentMethods.getCurrentOption().data('price') : 0;

			if (!amountField.valid || amountField.valid()) {
				this._getRemaining(amount, billingFee);
			}
		},
		_getRemaining: function(amount, billingFee) {
			return this.$tools.data.get(this.$options.getRemainingUrl, {
				amountFromHardwarePool: amount,
				totalAmount: this.$options.price,
				billingFee: billingFee
			})
				.then(function(res) {
					var data;
					if (!res.success) return;
					if (data = res.data) {
						(!this.$el.hasClass('js-hidden')) && this.$events.trigger('remainingAmount', data.remainingAmount || 0);
						this._amount = amount;
					}
				}.bind(this));
		}
	};


/***/ },

/***/ 740:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $leaveBasketReview $retryCreditCheck': 'onRetryClick',
			'click $leaveBasketReview $basketReviewProceed': 'onProceedClick',
			'click $leaveBasketReview $emptyBasket': 'onEmptyClick',
			'changed $leaveBasketReview $termsAndConditions': 'onTermsClick',
			'click $leaveBasketReview $declineOffer': 'onDeclineOfferClick',
			'posConnected $this': 'onDisabled',
			'upfrontChanged $this': '_changeUpfront'
		},

		initialize: function() {
			this.needDisableButtonProceed = {
				workOnlyPos: false,
				posConnected: false,
				termAndCondition: false,
				canProceed: false
			};

			this.needDisableButtonProceed.posConnected = this.$options.checkPosConnection || false;
			this.needDisableButtonProceed.canProceed = this.$options.canProceed || false;
		},

		ready: function() {
			var agentInitialsDialog = this.$components.verbalAcceptAgentInitialsDialog;
			var form = this.$components.leaveBasketReview;
			var basketPayment;
			var upfrontPaymentMethods;
			var recurringPaymentMethods;

			if(!form.$components.termsAndConditions) {
				this.needDisableButtonProceed.termAndCondition = true;
			}

			if (agentInitialsDialog) {
				agentInitialsDialog.$events.on('etmAgentInitials $this', this.submitEtm.bind(this));
			}

			// ToDo: Fixme
			if (basketPayment = form.$components.basketPayment) {
				if (upfrontPaymentMethods = basketPayment.$components.UpfrontPaymentMethods) {
					upfrontPaymentMethods.$events.on('change $this', this.onSelectChange.bind(this));
				}

				if (recurringPaymentMethods = basketPayment.$components.RecurringPaymentMethods) {
					recurringPaymentMethods.$events.on('change $this', this.onSelectChange.bind(this));
					recurringPaymentMethods.$events.on('change $this', this._changeBillingForm.bind(this));
				}
			}

			this._checkContinueButton();

			// Fix for modal-box events
			if (this.$components.declineOfferDialog) {
				this.$components.declineOfferDialog.$events.on('declineOfferConfirm $this', this.declineOffer.bind(this));
				this.$components.declineOfferDialog.$events.on('requestCallback $this', this.requestCallback.bind(this));
			}
		},

		onTermsClick: function() {
			var form = this.$components.leaveBasketReview;

			if (form.$components.termsAndConditions.isChecked()) {
				this.needDisableButtonProceed.termAndCondition = true;
				form.$components.tcWarning.close();
			} else {
				this.needDisableButtonProceed.termAndCondition = false;
				form.$components.tcWarning.open();
			}
			this._checkContinueButton();
		},

		onDisabled: function(event, data) {
			this.needDisableButtonProceed.posConnected = data.isConnected || false;
		},

		_changeUpfront: function(event, data) {
			this.needDisableButtonProceed.workOnlyPos = data;
			this._checkContinueButton();
		},

		_checkContinueButton: function() {
			var form = this.$components.leaveBasketReview;
			form.$components.basketReviewProceed.disable();
			form.$components.disabledProceedButtonErrorMessage && form.$components.disabledProceedButtonErrorMessage.hide();
			if (!this.needDisableButtonProceed.canProceed) {
				return;
			}
			if (!this.needDisableButtonProceed.termAndCondition) {
				return;
			}
			if(this.needDisableButtonProceed.workOnlyPos && !this.needDisableButtonProceed.posConnected) {
				form.$components.disabledProceedButtonErrorMessage && form.$components.disabledProceedButtonErrorMessage.show();
				return;
			}
			form.$components.basketReviewProceed.enable();
		},

		onRetryClick: function(event) {
			var btn = event.data.component;

			event.preventDefault();

			this._setFormUrl(event.data.component.$options.url);

			if (this.valid()) {
				this.submit(btn);
			}
		},
		onProceedClick: function(event) {
			var agentInitialsDialog = this.$components.verbalAcceptAgentInitialsDialog;
			var emptyBasketButton = this.$components.leaveBasketReview.$components.emptyBasket;
			var btn = event.data.component;

			event.preventDefault();

			this._setFormUrl(btn.$options.url);

			if (!this.valid()) return;

			if (agentInitialsDialog) {
				agentInitialsDialog.show(btn);
			} else {
				this.submit(btn);
			}

			if (emptyBasketButton) {
				emptyBasketButton.hide();
			}


		},
		_setFormUrl: function(url) {
			var form = this.$components.leaveBasketReview;
			form.$options.url = url;
		},
		onSelectChange: function() {
			var form = this.$components.leaveBasketReview;

			if (form.$components.retryCreditCheck) { // DK only
				form.$components.retryCreditCheck.hide();
			}
			form.$components.basketReviewProceed.show();
		},
		_changeBillingForm: function(event, value) {
			var select;
			if (!this.$elements.billingAddressForm) return;

			select = event.data.component;
			this.$components.billingAddressLoader.turnOn();
			this.load(select.$options.updateBillingFormUrl, this.$elements.billingAddressForm, {selectedPaymentMethod: value})
				.finally(this.$components.billingAddressLoader.turnOff.bind(this.$components.billingAddressLoader));
		},
		submitEtm: function(event, etmAgentInitials) {
			this.$el.find('[data-selector="etmAgentInitials"]').val(etmAgentInitials);
			if (this.valid()) {
				this.submit(this.$components.leaveBasketReview.$components.basketReviewProceed);
			}
		},
		valid: function() {
			return this.$components.leaveBasketReview.valid();
		},
		submit: function(btn) {
			var form = this.$components.leaveBasketReview;
			var loading = btn.activityIndicator();

			this._hideError();
			this._hideWarning();

			form.submitAsync()
				.then(function(res) {
					if (res.success) {
						if (res.data.redirectUrl && !res.data.ping) {
							this.$tools.util.redirect(res.data.redirectUrl);
						} else if (res.data.ping) {
							this._ping(res.data)
								.then(function(res) {
									this.$tools.util.redirect(res.data.redirectUrl);
								}.bind(this))

								.catch(function(res) {
									this._showError(res, loading);
								}.bind(this));
						} else {
							this._showError(res, loading);
						}
					} else {
						if (res.data && res.data.retryCreditCheck) {
							form.$components.retryCreditCheck.show();
							form.$components.basketReviewProceed.hide();
							this._showWarning(res, loading);
						} else {
							this._showError(res, loading);
						}
					}
				}.bind(this));
		},
		onEmptyClick: function() {
			this.$components.leaveBasketReview.$components.emptyBasket.activityIndicator();
			this.$components.basketItems.empty(this.$components.leaveBasketReview.$components.emptyBasket.$options.url);

			return false;
		},
		onDeclineOfferClick: function() {
			this.$components.declineOfferDialog.$events.trigger('show');
		},
		declineOffer: function() {
			var declineOfferBtn = this.$components.leaveBasketReview.$components.declineOffer;

			declineOfferBtn.activityIndicator();
			this.$components.basketItems.empty(declineOfferBtn.$options.url);

			return false;
		},
		requestCallback: function(event, redirectUrl) {
			this.$tools.util.redirect(redirectUrl);
		},
		onEtmDialogOpen: function() {
			this.$components.verbalAcceptAgentInititalsDialog.$events.trigger('show');
		},
		_showError: function(error, loading) {
			loading.reject();
			if (error && this.$tools.helper.isObject(error) && error.errorMessages && error.errorMessages[0]) {
				this.$components.leaveBasketReview.$components.basketPaymentFormAjaxError.setText(error.errorMessages[0]);
				this.$components.leaveBasketReview.$components.basketPaymentFormAjaxError.open();
			}
		},
		_hideError: function() {
			this.$components.leaveBasketReview.$components.basketPaymentFormAjaxError.close();
		},
		_showWarning: function(error, loading) {
			loading.reject();
			if (error && this.$tools.helper.isObject(error) && error.errorMessages && error.errorMessages[0]) {
				this.$components.leaveBasketReview.$components.basketPaymentFormAjaxWarning.setText(error.errorMessages[0]);
				this.$components.leaveBasketReview.$components.basketPaymentFormAjaxWarning.open();
			}
		},
		_hideWarning: function() {
			this.$components.leaveBasketReview.$components.basketPaymentFormAjaxWarning.close();
		},
		_ping: function(data) {
			var dfd = this.$tools.q.defer();

			this._pingProcess(data, dfd);
			return dfd.promise();

		},
		_pingProcess: function(data, dfd) {
			var PING_TIMEOUT = 1000;
			this.$tools.data.post(data.redirectUrl)
				.then(
					function(res) {
						if (res.success) {
							if (!res.data.ping) {
								dfd.resolve(res);
							} else {
								setTimeout(function() {
									this._pingProcess(res.data, dfd);
								}.bind(this), PING_TIMEOUT);
							}
						} else {
							dfd.reject(res);
						}
					}.bind(this)
				);
		}
	};


/***/ },

/***/ 741:
/***/ function(module, exports) {

	'use strict';

	var SELECTOR = {
		'regNumber': '#RegNumber',
		'accountNumber': '#AccountNumber'
	};

	/**
		name: Payment controller
		type: controller
		desc: Controller for payment
	*/
	module.exports = {
		events: {
			'change $RecurringPaymentMethods': '_onRecurringPaymentMethodsChange',
			'change $UpfrontPaymentTypes': '_onUpfrontPaymentTypesChange',
			'remainingAmount $HardwarePool': '_onRemainingAmount'
		},

		ready: function() {
			if (this.$components.RecurringPaymentMethods) {
				this._onRecurringPaymentMethodsChange();
			}

			if (this.$components.UpfrontPaymentTypes) {
				this._onUpfrontPaymentTypesChange();
			}

		},

		_onRecurringPaymentMethodsChange: function() {
			var accountNumber;
			var priceFormatted;
			if (!!this.$components.RecurringPaymentMethods.getCurrentOption().data().showPbs) {
				this.$components.optionalPbsPartial.show();
			} else {
				this.$components.optionalPbsPartial.hide();
				this.$components.optionalPbsPartial.$el.find(SELECTOR.regNumber).val('');
				this.$components.optionalPbsPartial.$el.find(SELECTOR.accountNumber).val('');
				accountNumber = this.$components.RecurringPaymentMethods.getCurrentOption().data().accountNumber;
				if (accountNumber) {
					this.$components.optionalPbsPartial.$el.find(SELECTOR.accountNumber).val(accountNumber);
				}
			}

			priceFormatted = this.$components.RecurringPaymentMethods.getCurrentOption().data('price');

			this.$components.RecurringSummaryPrice.forEach(function(component) {
				component.html(priceFormatted);
			});
		},

		_onUpfrontPaymentTypesChange: function() {
			var data = this.$components.UpfrontPaymentTypes.getCurrentOption().data();
			var price = data.price;
			var showHardwarePool = data.showHardwarePool || false;

			this.$components.UpfrontSummaryPrice.forEach(function(component) {
				component.html(price || '');
			});

			this.$events.trigger('upfrontChanged', data.proceedPosOnly || false);

			this.$components.HardwarePool && this._hardwarePoolUpdate(showHardwarePool);
		},

		_hardwarePoolUpdate: function(showHardwarePool) {
			if (showHardwarePool) {
				this.$components.HardwarePool.show();
				this.$components.HardwarePool.update();
			} else {
				this.$components.HardwarePool.hide();
			}
		},

		_onRemainingAmount: function(event, price) {
			this.$components.UpfrontSummaryPrice.forEach(function(component) {
				component.html(price || '');
			});
		}
	};


/***/ },

/***/ 742:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click button.send': 'onSubmit'
		},

		onSubmit: function(event) {
			var formValid = this.$components.shareBasketForm.valid();
			var dfd;

			event.preventDefault();

			if (!formValid){
				return;
			}

			dfd = this.$components.shareBasketForm.$components.save.activityIndicator();
			this.$tools.data.post(this.$components.shareBasketForm.getUrl(), this.$components.shareBasketForm.serialize())
				.then(function(response) {
					if (response.success === true) {
						this.html(response.data.html)
							.then(dfd.resolve.bind(dfd));
					}
				}.bind(this), dfd.reject.bind(dfd));
		}
	};


/***/ },

/***/ 743:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'changed $termsAndConditions': '_onTermsClick',
			'click $basketSummaryProceed': '_onProceed',
			'click $emptyBasket': '_onEmptyClick',
			'click $basketValidationMsg $removeOutOfStockItemsFromBasket': '_onRemoveOutOfStockItemsFromBasketClick',
			'change $$stockType': '_onStockTypeChange'
		},

		_onProceed: function() {
			this.$components.basketSummaryProceed.activityIndicator();
			this.$components.emptyBasket.hide();
			this.$components.saveAndSend && this.$components.saveAndSend.disable();
			this.$components.buyMore && this.$components.buyMore.disable();
			this.$el.closest('form').submit();
		},

		_onTermsClick: function() {
			if(!this.$components.basketSummaryProceed) {
				return;
			}

			if (this.$components.termsAndConditions.isChecked()) {
				this.$components.basketSummaryProceed.enable();
				this.$components.tcWarning.close();
			} else {
				this.$components.basketSummaryProceed.disable();
				this.$components.tcWarning.open();
			}
		},

		_onEmptyClick: function(event) {
			event.preventDefault();

			this.$components.emptyBasket.activityIndicator();
			this.$components.basketItems.empty(this.$components.emptyBasket.$options.url);
		},

		_onRemoveOutOfStockItemsFromBasketClick: function(event) {
			event.preventDefault();

			this.$tools.data.post(e.data.component.$options.url);
		},

		_onStockTypeChange: function(event) {
			var newUrl = this.$tools.util.addParamsToUrl(window.location.href, {
				stockType: {
					value: event.$el.val(),
					single: true
				}
			});

			this.$tools.util.redirect(newUrl);
		}
	};


/***/ },

/***/ 744:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		searchForm: '[data-alias="search-form"]',
		storesList: '[data-alias="stores"]',
		search: '[data-alias="search-address"]',
		onlyInStock: '[data-alias="only-in-stock"]'
	};

	/**
	name: Stores List
	type: controller
	desc: Handles search and selection of Store with a device.
	options:
		loadUrl: contains URL for reloading stores list.
		guid: contains identifier to restore component in .NET
	events:
		storesLoading: fires when stores list starts reloading.
		storesLoaded: fires when stores were just loaded and component is ready.
	 */
	module.exports = {
		initialize: function() {
			this.userPosition = null;
			this._loadingPromise = null;
			this._getUserPosition();
		},
		events: {
			'search $componentSearch': '_onSearch',
			'pageChanged $pagination': '_onPageChange',
			'click $resetStore': '_onSelectedStoreReset',
			'change [data-alias="only-in-stock"]': '_onSearch'
		},
		refreshStoresList: function(page, url) {
			var onlyInStockCheckbox;
			page = page || 1;

			if (this._loadingPromise) {
				return this._loadingPromise;
			}

			this.$events.trigger('storesLoading');
			this.$events.trigger('busy-mode-on');

			onlyInStockCheckbox = this.$el.find(SELECTORS.onlyInStock);

			this._loadingPromise = this.load(url || this.$options.loadUrl, SELECTORS.storesList, {
				criteria: {
					showOnlyInStock: !!(onlyInStockCheckbox.length && onlyInStockCheckbox.is(':checked')),
					offerId: this.$options.offerId,
					zipCode: this.$el.find(SELECTORS.search).val(),
					latitude: this.userPosition ? this.userPosition.lat : '',
					longitude: this.userPosition ? this.userPosition.lng : '',
					pageNumber: page.toString()
				}
			})
				.then(function(response){
					if (response.success) {
						this.$components.pagination.updateSettings(response.data.pageSize,
																	response.data.totalCount,
																	response.data.pageNumber);

						this.$el.find(SELECTORS.searchForm).toggleClass('js-hidden', response.data.hasSelectedStore);
					}
				}.bind(this))
				.finally(function(){
					this.$events.trigger('busy-mode-off');
					this.$events.trigger('storesLoaded');
					this._loadingPromise = null;
				}.bind(this));

			return this._loadingPromise;
		},
		_getUserPosition: function() {
			if (!this.userPosition) {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(this._geoLocationCallback.bind(this));
				}
			}
		},
		_geoLocationCallback: function(position) {
			this.userPosition = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
		},
		_onSearch: function() {
			this.refreshStoresList(1);
		},
		_onPageChange: function(event, selectedPage) {
			this.refreshStoresList(selectedPage);
		},
		_onSelectedStoreReset: function(event) {
			this.refreshStoresList(1, event.data.component.$options.url);
		}
	};


/***/ },

/***/ 745:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $subscriptions': '_onSubscriptionSelect',
			'submit $tile $planForm': '_onSelectTilePlan'
		},

		_onSubscriptionSelect: function(_e, subscriptionId) {
			this.$components.tile.load(this.$options.url, {
				pageId: this.$options.pageId,
				subscriptionId: subscriptionId
			});
		},
		_onSelectTilePlan: function() {
			this.$components.tile.$components.planForm.$components.selectPlan.activityIndicator();

			this.$events.trigger('select', {
				plan: this.$components.tile.$components.planForm.serialize(),
				url: this.$components.tile.$components.planForm.$options.url,
				button: this.$components.tile.$components.planForm.$components.selectPlan
			});
		}
	};


/***/ }

});