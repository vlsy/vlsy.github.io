webpackJsonp([8],{

/***/ 370:
/***/ function(module, exports) {

	'use strict';

	/**
	name: autosubmit form (barcode scanner)
	desc: >
	    Autosubmit form on barcode scan
	    This component should be attached to a form element.
	    Scan events from the inputs with data-group="scanAutosubmit" will be automatically submitted.
	    Example:

	        <form data-component="Common::pos/barcode/autosubmit-form">
	            <input type="text" data-component="Common::pos/barcode" data-group="scanAutosubmit" />
	        </form>
	*/
	module.exports = {
		events: {
			'scan $$scanAutosubmit': '_onScan'
		},
		_onScan: function() {
			this.$el.submit();
		}
	};


/***/ },

/***/ 371:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PosService = __webpack_require__(372);

	/**
	name: Barcode scanner force
	events:
	    scan: emitted on successful read data from barcode scanner
	    change: emitted on any value change (both on scan and on manual input)
	desc: >
	    Catches the barcode scanner input and puts it to the input's value.
	    Example:

	        <input type="text" data-component="Common::pos/barcode/force" />
	*/
	module.exports = {
		initialize: function() {
			this._posService = new PosService();

			this._posService.setId(this.$options.name + this.$options._ref);
			if (!this.$el.prop('disabled')) {
				this._subscribeForBarcodeScan();
			}
		},

		events: {
			'input': '_onInput'
		},

		getValue: function() {
			return this.$el.val();
		},

		_onBarcodeScanSuccess: function(data) {
			this.$el.val(data.barcode);

			this.$events.trigger('scan');
			this.$events.trigger('change');
		},

		_onBarcodeScanError: function(error) {
			this.$tools.logger.error(error);
		},

		_onInput: function() {
			this.$events.trigger('change');
		},

		_subscribeForBarcodeScan: function() {
			this._posService.subscribe(
				PosService.Method.subscribeForBarcodeScan,
				this._onBarcodeScanSuccess.bind(this),
				this._onBarcodeScanError.bind(this)
			);

			this._posService.send(PosService.Type.Subscription, PosService.Method.subscribeForBarcodeScan);
		},

		destroy: function() {
			this._posService.unsubscribe();
			this._posService.send('unsubscribeFromBarcodeScan', 'subscribeForBarcodeScan', '', PosService.Unsubscribing);
		}
	};


/***/ },

/***/ 372:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tools = __webpack_require__(323);
	var PosService = module.exports = function() {
	};

	PosService.Type = {
		Request: 'request',
		Subscription: 'subscription',
		Unsubscribing: 'unsubscribing'
	};
	PosService.Method = {
		isConnected: 'isConnected',
		payBasket: 'payBasket',
		subscribeForBarcodeScan: 'subscribeForBarcodeScan',
		printDocumentWithData: 'printDocumentWithData',
		printDocumentAtURL: 'printDocumentAtURL',
		openURL: 'openURL'
	};


	PosService.prototype.setId = function(id) {
		this._id = id;
	};

	PosService.prototype.isConnected = function() {

		this.setId('isConnected');
		var dfd = tools.q.defer();

		this.subscribe(PosService.Method.isConnected,
			function(data) {
				if (data.isConnected) {
					dfd.resolve(data);
				} else {
					dfd.reject();
				}
				this.unsubscribe();
			}.bind(this),
			function() {
				dfd.reject();
			}.bind(this)
		);
		this.send(PosService.Type.Request, PosService.Method.isConnected);
		return dfd.promise();

	};

	PosService.prototype.send = function(type, method, data, callback) {
		window.parent.postMessage({
			id: this._id,
			callback: callback || method,
			method: method,
			request: data || '',
			type: type
		}, '*');
	};

	PosService.prototype.subscribe = function(method, success, error) {
		this._method = method;
		this._response = this.response(success, error).bind(this);
		window.addEventListener('message', this._response, false);
	};

	PosService.prototype.unsubscribe = function() {
		if (this._response) {
			window.removeEventListener('message', this._response, false);
		}
	};

	PosService.prototype.response = function(success, error) {
		return function(event) {
			var e = event.data;
			if (e.method !== this._method || e.id !== this._id) {
				return;
			}
			if (e.success) {
				success(e.data);
			} else if (typeof error === 'function') {
				error(e.errors);
			}
		}.bind(this);
	};

	PosService.prototype.log = function(message, data) {
		if (tools.dom.find('[data-alias="logs"]')) {
			tools.dom.find('[data-alias="logs"]').append('<p>' + message + ' = ' + JSON.stringify(data) + '</p>');
		}
	};



/***/ },

/***/ 373:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PosService = __webpack_require__(372);

	/**
	name: Barcode scanner
	events:
	    scan: emitted on successful read data from barcode scanner
	    change: emitted on any value change (both on scan and on manual input)
	options:
	    prefix: Number. If it's existing will be added before barcode.
	desc: >
	    Catches the barcode scanner input and puts it to the input's value.
	    See also: Common/pos/barcode/autosubmit-form
	    Example:

	        <input type="text" data-component="Common::pos/barcode" />
	*/
	module.exports = {
		initialize: function() {
			this._posService = new PosService();

			this._posService.setId(this.$options.name + this.$options._ref);

			if (this.$el[0] === document.activeElement) {
				this._subscribeForBarcodeScan();
			}
		},

		events: {
			'focus': '_onFocus',
			'blur': '_onBlur',
			'input': '_onInput'
		},

		getValue: function() {
			return this.$el.val();
		},

		_onFocus: function() {
			this._subscribeForBarcodeScan();
		},

		_onBlur: function() {
			this._unsubscribeFromBarcodeScan();
		},

		_onBarcodeScanSuccess: function(data) {
			if (this.$options.prefixAdded) {
				data.barcode = this.$options.prefixAdded.toString() + data.barcode;
			}
			this.$el.val(data.barcode);

			this.$events.trigger('scan');
			this.$events.trigger('change');
		},

		_onBarcodeScanError: function(error) {
			this.$tools.logger.error(error);
		},

		_onInput: function() {
			this.$events.trigger('change');
		},

		_subscribeForBarcodeScan: function() {
			this._posService.subscribe(
				PosService.Method.subscribeForBarcodeScan,
				this._onBarcodeScanSuccess.bind(this),
				this._onBarcodeScanError.bind(this)
			);

			this._posService.send(PosService.Type.Subscription, PosService.Method.subscribeForBarcodeScan);
		},

		_unsubscribeFromBarcodeScan: function() {
			this._posService.unsubscribe();
			this._posService.send(PosService.Type.Unsubscribing, PosService.Method.subscribeForBarcodeScan, '', 'unsubscribeFromBarcodeScan');
		}
	};


/***/ },

/***/ 376:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PosService = __webpack_require__(372);

	/**
	name: Open external link in POS application
	desc: >
		Open print window in POS application.
		Example:
			<a href="http://google.com" target="" >Open</a>
			<a href="http://google.com" download >Download</a>
	*/
	module.exports = {
		initialize: function() {
			this._posService = new PosService();

			this._posService.isConnected()
				.then(function() {
					document.body.addEventListener('click', this._delegateEvent.bind(this));
				}.bind(this));
		},

		_delegateEvent: function(event) {
			var target = event.target;
			var component = target.getAttribute('data-component');

			if (component != 'Common::pos/print-url' && (target.hasAttribute('download') || target.hasAttribute('target'))) {
				event.preventDefault();

				this._posService.setId('openURL');

				this._posService.subscribe(
					PosService.Method.openURL,

					function() {
						this._posService.unsubscribe();
					}.bind(this),

					function() {
						this._posService.unsubscribe();
					}.bind(this)
				);

				this._posService.send(PosService.Type.Request, PosService.Method.openURL, target.href);
			}
		}
	};


/***/ },

/***/ 377:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PosService = __webpack_require__(372);

	/**
	name: Print in POS application
	desc: >
		Open print window in POS application.
		Example:
			<a href="http://google.com" data-component="Common::pos/print-url">Print</a>
	*/
	module.exports = {
		initialize: function() {
			this._posService = new PosService();

			this._posService.isConnected()
				.then(function() {
					this.$el[0].addEventListener('click', this._printDocument.bind(this));
				}.bind(this));
		},

		_printDocument: function(event) {
			var type = this.$el[0].href.indexOf('data:') === 0 ? PosService.Method.printDocumentWithData : PosService.Method.printDocumentAtURL;

			event.preventDefault();

			this._posService.setId(type);

			this._posService.subscribe(
				type,

				function() {
					this._posService.unsubscribe();
				}.bind(this),

				function() {
					this._posService.unsubscribe();
				}.bind(this)
			);

			this._posService.send(PosService.Type.Request, type, this.$el[0].href);
		}
	};


/***/ },

/***/ 399:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(400);


/***/ },

/***/ 400:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./account/index.js": 401,
		"./account/multi/index.js": 403,
		"./account/opener/index.js": 405,
		"./account/resend-sms-code/index.js": 406,
		"./account/signup-terms-validator/index.js": 407,
		"./advert/index.js": 408,
		"./ajax-interceptor/config/index.js": 409,
		"./ajax-interceptor/index.js": 410,
		"./analytics/index.js": 411,
		"./analytics/link/index.js": 413,
		"./analytics/service.js": 412,
		"./analytics/view/index.js": 414,
		"./aura/index.js": 321,
		"./aura/js/aura.extensions.js": 341,
		"./aura/js/aura.js": 322,
		"./aura/js/base.js": 323,
		"./aura/js/deferred.js": 332,
		"./aura/js/ext/components.js": 342,
		"./aura/js/helpers/events.js": 343,
		"./aura/js/helpers/object-helpers.js": 333,
		"./aura/js/logger.js": 334,
		"./aura/js/platform.js": 331,
		"./basket/service.js": 415,
		"./cookie-policy/index.js": 416,
		"./csrf-protection/index.js": 417,
		"./dsl/available-subscriptions/index.js": 418,
		"./dsl/available-subscriptions/item/index.js": 419,
		"./dsl/buy-voip/index.js": 420,
		"./dsl/confirm/index.js": 421,
		"./dsl/dsl-installation/index.js": 422,
		"./dsl/dsl-plans/index.js": 424,
		"./dsl/pstn-validation/index.js": 425,
		"./dsl/router/address/index.js": 427,
		"./dsl/router/index.js": 428,
		"./dsl/speed/index.js": 429,
		"./dsl/speed/service.js": 430,
		"./dsl/spinner/index.js": 431,
		"./dsl/spinner/result/index.js": 432,
		"./editable-block/block/index.js": 433,
		"./editable-block/index.js": 434,
		"./editable-block/load-animation/index.js": 435,
		"./flow/BaseFlowPresenter.js": 436,
		"./flow/FlowController.js": 437,
		"./flow/SheetFlowPresenter.js": 438,
		"./flow/StackedFlowPresenter.js": 439,
		"./flow/WizardFlowPresenter.js": 440,
		"./flow/index.js": 442,
		"./flow/tabs/item/index.js": 443,
		"./header-user-info/index.js": 444,
		"./iframe/index.js": 445,
		"./login/blocked/index.js": 446,
		"./login/etm/index.js": 447,
		"./login/index.js": 448,
		"./login/opener/index.js": 450,
		"./login/service/util.js": 449,
		"./map/googleProvider.js": 451,
		"./map/provider.js": 452,
		"./nav/desktop/index.js": 453,
		"./nav/flex/index.js": 454,
		"./nav/mobile/index.js": 455,
		"./nav/mobile/opener/index.js": 456,
		"./nav/sticky/index.js": 457,
		"./ping/index.js": 458,
		"./ping/service.js": 459,
		"./plans/list/index.js": 460,
		"./plans/list/mutually-exclusive/index.js": 461,
		"./plans/plan/index.js": 462,
		"./pos/barcode/autosubmit-form/index.js": 463,
		"./pos/barcode/force/index.js": 464,
		"./pos/barcode/index.js": 465,
		"./pos/external-url/index.js": 466,
		"./pos/print-url/index.js": 467,
		"./replace-textarea-placeholder/service.js": 468,
		"./responsive-image-proxy/index.js": 469,
		"./side-panel/index.js": 470,
		"./site-search/index.js": 471,
		"./site-search/top-search/index.js": 472,
		"./steps/index.js": 473,
		"./sticky/index.js": 474,
		"./sync-script-loader/index.js": 475,
		"./throttle-banner/index.js": 476,
		"./trim/index.js": 477
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
	webpackContext.id = 400;


/***/ },

/***/ 401:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var modalBoxHelper = __webpack_require__(402);

	/**
		name: Account
		type: controller
		desc: >
			Handles all interactions with account popup
			To open popup on page load just add component Common::account/opener inside
			with alias "autoOpener"
		subscriptions:
			account/open: Pubsub event that opens account popup and loads content from given url (as event data)
	*/
	module.exports = {
		events: {
			'click closeButton': '_onCloseButtonClick',
			'click loginOverlay': '_onOverlayClick',
			'submit $stepForm': '_onStepFormSubmit',
			'submitSuccess $$customController': '_onCustomSubmitSuccess',
			'actionSuccess $$customController': '_onCustomActionSuccess'
		},

		ready: function() {
			// to block other requests while we are processing current one
			this._isLoading = false;

			// used to check if we need to reload page on close
			this._isCompleted = false;

			// listen's to global event of Common::account/opener
			this.$tools.data.pubsub.subscribe('account/open', this._onLoginOpen.bind(this));

			// to trigger login process on page load
			if (this.$components.autoOpener) {
				this._open(this.$components.autoOpener.$options.href);
			}

			modalBoxHelper.attachEvents(this.$elements.loginOverlay);
		},

		_onLoginOpen: function(event, url) {
			this._open(url);
		},

		_onCloseButtonClick: function() {
			this._close();
		},

		_onOverlayClick: function(event) {
			if (event.target !== this.$elements.loginOverlay[0]) {
				return;
			}

			this._close();
		},

		_onStepFormSubmit: function() {
			if (!this._isValid()) {
				this.$components.stepForm.$components.errorMessage.setText(this._customErrorMessageText);
				this.$components.stepForm.$components.errorMessage.open();

				return;
			}

			if (this._isLoading) {
				return;
			}

			this._isLoading = true;

			if (this.$components.successMessage) {
				this.$components.successMessage.close();
			}

			this.$components.stepForm.$components.errorMessage.close();
			this.$components.stepForm.$components.submitButton.activityIndicator();

			this.$components.stepForm.submitAsync()
				.then(this._onRequestSuccess.bind(this))
				.catch(this._resetLoading.bind(this));
		},

		_onRequestSuccess: function(response) {
			var container;

			if (!this._isLoading) {
				return;
			}

			if (!response.success) {
				this._onRequestFail(response);

				return;
			}

			response.data = response.data || {};

			if (!response.data.html) {
				this._completeFlow(response.data.returnUrl);

				return;
			}

			this._isCompleted = Boolean(response.data.isCompleted);
			this._resetLoading();

			container = response.data.isPartial ? this.$elements.stepFormContainer : this.$elements.popupContentContainer;

			this.html(response.data.html, container)
				.then(this._showPopup.bind(this));
		},

		_onRequestFail: function(error) {
			if (!this.$components.stepForm) {
				return;
			}

			this.$components.stepForm.$components.errorMessage.setText(error.errorMessages[0]);
			this.$components.stepForm.$components.errorMessage.open();

			this._resetLoading();
		},

		_onCustomSubmitSuccess: function(event, eventData) {
			this._isLoading = true;

			this._onRequestSuccess(eventData);
		},

		_onCustomActionSuccess: function(event, successMessage) {
			if (successMessage) {
				this.$components.successMessage.setText(successMessage);
			}

			this.$components.successMessage.open();
		},

		_isValid: function() {
			if (!this.$components.customValidators) {
				return true;
			}

			return this.$components.customValidators.every(function(validator) {
				this._customErrorMessageText = validator.getMessage();

				return validator.isValid();
			}.bind(this));
		},

		_open: function(url) {
			if (this._isLoading) {
				return;
			}

			this._hidePopup();
			modalBoxHelper.showOverlay(this.$elements.loginOverlay);

			this._isLoading = true;

			this.$tools.data.get(url)
				.then(this._onRequestSuccess.bind(this))
				.catch(this._close.bind(this))
				.finally(this._resetLoading.bind(this));
		},

		_close: function() {
			// ToDo: cancel outstanding request here

			this._hidePopup();
			modalBoxHelper.hideOverlay(this.$elements.loginOverlay);

			if (this._isCompleted) {
				this.$tools.util.reload();
			}

			this._isCompleted = false;
			this._resetLoading();
		},

		_showPopup: function() {
			this.show(this.$elements.loginPopup);
		},

		_hidePopup: function() {
			this.hide(this.$elements.loginPopup);
		},

		_resetLoading: function() {
			this._isLoading = false;

			if (this.$components.stepForm && this.$components.stepForm.$components.submitButton) {
				this.$components.stepForm.$components.submitButton.resetLoading();
			}
		},

		_completeFlow: function(url) {
			if (url) {
				this.$tools.util.redirect(url);
			} else {
				this.$tools.util.reload();
			}
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

/***/ 403:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var CLASSES = {
		popupOpen: 'modal-box--is-open'
	};

	var spinnerTemplate = __webpack_require__(404);

	/**
		name: AccountMulti
		type: controller
		desc: >
			Handles customer selection dropdown
			Sends AJAX requests for links with data-element="customerLink"
	*/
	module.exports = {
		events: {
			'click customerLink': '_onCustomerLinkClick'
		},

		ready: function() {
			this.$overlay = this.$tools.dom.find(spinnerTemplate);

			this.$tools.dom.find('body').append(this.$overlay);
		},

		_onCustomerLinkClick: function(event) {
			event.preventDefault();

			if (event.$el[0].dataset.current) {
				return;
			}

			this._showSpinner();

			this.$tools.data.get(event.$el[0].href)
				.then(this._onSuccess.bind(this))
				.catch(this._hideSpinner.bind(this));
		},

		_onSuccess: function() {
			this.$tools.util.reload();
		},

		_showSpinner: function() {
			this.$overlay.addClass(CLASSES.popupOpen);
		},

		_hideSpinner: function() {
			this.$overlay.removeClass(CLASSES.popupOpen);
		}
	};


/***/ },

/***/ 404:
/***/ function(module, exports) {

	module.exports = "<div class=\"modal-box__overlay\">\r\n\t<div class=\"loader--centered\">\r\n\t\t<div class=\"lightbox-spinner\"></div>\r\n\t</div>\r\n</div>"

/***/ },

/***/ 405:
/***/ function(module, exports) {

	'use strict';

	/**
		name: AccountOpener
		type: controller
		desc: >
			Triggers account popup opening
		options:
			href: The URL to load popup content from
		events:
			account/open: Pubsub event that is triggered when you click on root element
	*/
	module.exports = {
		events: {
			'click': '_openLogin'
		},

		_openLogin: function(event) {
			event.preventDefault();

			this.$tools.data.pubsub.publish('account/open', this.$options.href);
		}
	};


/***/ },

/***/ 406:
/***/ function(module, exports) {

	'use strict';

	/**
		name: ResendSmsCode
		type: Controller
		desc: Handles sms code resend functionality.
		events:
			actionSuccess: Fires when code was resent successfully.
	*/
	module.exports = {
		events: {
			'click resendLink': '_onResendLinkClick'
		},

		_onResendLinkClick: function(event) {
			event.preventDefault();

			this.$tools.data.get(this.$options.url)
				.then(this._onResendSuccess.bind(this));
		},

		_onResendSuccess: function(response) {
			if (!response.success) {
				return;
			}

			this.$events.trigger('actionSuccess');
		}
	};


/***/ },

/***/ 407:
/***/ function(module, exports) {

	'use strict';

	/**
		name: SignupTermsValidator
		type: controller
		desc: >
			Is used to check is the user has agreed with terms and conditions
			Handled inside Common::account by data-group=customValidators
		options:
			message: Validation message
	*/
	module.exports = {
		/**
			desc: Returns `true` if checked. `false` otherwise
		*/
		isValid: function() {
			return this.$components.agreedToTermsAndConditions.isChecked();
		},

		/**
			desc: Returns message to be shown if not checked
		*/
		getMessage: function() {
			return this.$options.message;
		}
	};


/***/ },

/***/ 408:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click iframe' : 'onClickSendResponseToTeradata'
		},

		onClickSendResponseToTeradata : function() {
			var sendResponseUrl = this.$options.framesendresponseurl;
			var iPoint = this.$options.frameinteractionpoint;
			var msgId = this.$options.framemessagepathid;
			var clickResponse = this.$options.responselevel;

			this.$tools.data.ajax({
				type: 'POST',
				url: sendResponseUrl,
				data: {interactionPoint : iPoint, messagePathId : msgId, responselevel : clickResponse}
			});
		}

	};


/***/ },

/***/ 409:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Configutaion for ajax interceptor
	desc: a storage for common used ajax configuration parameters
	type: configuration
	*/
	module.exports = {
		errorCode: {
			redirect: 397,
			unauthorized: 401
		},
		httpStatus: {
			forgeryError: 498
		}
	};


/***/ },

/***/ 410:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _error = null;
	var componentsReady = false;
	var ajaxConfig = __webpack_require__(409);

	/**
	name: ajax-interceptor
	desc: >
		A globally applied component for pre-processing ajax responses.
		Main features are:
		On error response (http status code 500) it will show Ooops popup.
		It will redirect browser to new page if appropriate data.errorCode is set
		(see Common/ajax-interceptor/config for redirect error code)
		It will show session expired popup if data.errorCode === 401

		In any case it will call original success/error handlers.
	*/
	module.exports = {
		initialize: function() {
			this.$tools._tmp_.ajaxPrefilter(function(options) {
				options.success = this._onSuccess.bind(this, options.success);
				options.error = this._onError.bind(this, options.error);
			}.bind(this));
		},

		ready: function() {
			componentsReady = true;
			if (_error) {
				this._showError.apply(this, _error);
			}
		},

		_onSuccess: function(originalSuccess, resp) {
			if (resp.data) {
				switch (resp.data.errorCode) {
					case ajaxConfig.errorCode.redirect:
						// Hack to overcome iOS issue with back-forward cache ONESCREEN-12476.
						// We attach event handler to the 'window' object that could be cached.
						// If we go back to this page, 'window' object will be restored and event handler
						// will check that page was got from cache and reload the page to get the initial state.
						window.addEventListener('pageshow', function(ev) { if (ev.persisted) { window.location.reload(); } });

						window.location.href = resp.data.redirectUrl;
						break;
					case ajaxConfig.errorCode.unauthorized:
						this._showError('sessionExpiredError', function(component) {
							component.$components.redirectLink.$el.attr('href', resp.data.redirectUrl);
						});
						break;
				}
			}

			if (typeof originalSuccess === 'function') {
				originalSuccess(resp);
			}
		},

		_onError: function(originalError, resp, status, statusText) {
			if (statusText !== 'abort') {
				if (resp.status === ajaxConfig.httpStatus.forgeryError) {
					this._showError('forgeryError');
				} else if (resp.status !== 0) { // don't show ajaxError if request aborted (when user leaves the page for example)
					this._showError('ajaxError');
				}
			}

			if (typeof originalError === 'function') {
				originalError(resp);
			}
		},
		_showError: function(componentName, callback) {
			var component;

			if (!componentsReady) {
				_error = [componentName, callback];
				return;
			}

			component = this.$components[componentName];

			if (component) {
				component.show();
				(typeof callback === 'function') && callback(component);
			} else {
				this.$tools.logger.error('Can\'t found component ' + componentName);
			}
		}
	};


/***/ },

/***/ 411:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var analyticsService = __webpack_require__(412);

	/**
	name: Analytics
	type: ui
	desc: >
		This components is initialized at app start.

		By adding an http interceptor, it checks if http response has an `analytics` object and passes it to Tealium.

		Analytics object structure:

			```js
			{
				actionType, //PageView: 1, Event: 2
				data // data to be passed to Tealium
			}
			```

		If its required to update Tealium with dynamic data from JS code, use Analytics service:

			```js
			var analyticsService = require('Common/analytics/service');
			analyticsService.link({
				actionType: analyticsService.ActionTypes.PageView,
				data: {}
			})
			```
	*/
	module.exports = {
		initialize: function() {
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

/***/ 413:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var analyticsService = __webpack_require__(412);

	/**
	    name: Analytics link
	    type: ui
	    desc: >
	        Comes in handy when you need to update analytics after some UI events, like button is clicked, options choosen, etc.

	        Currenty supported elements: `button`, `checkbox`, `select`
	    options:
	        analytics: Analytics object
	*/
	module.exports = {
		initialize: function() {
			if (this.$el.is(':button')) {
				this.$el.on('click', this._link_analytics.bind(this, this.$options.analytics.data));
			} else if (this.$el.is(':checkbox')) {
				this.$el.one('change', this._link_analytics.bind(this, this.$options.analytics.data));
			} else if (this.$el.is('select')) {
				this.$el.on('change', function(event) {
					var el = this.$tools.dom.find(event.currentTarget);
					var option = this.$tools.dom.find('option:selected', el);

					this._link_analytics(option.data('analytics').data);
				}.bind(this));
			}
		},
		_link_analytics: function(data) {
			analyticsService.link(data);
		}
	};


/***/ },

/***/ 414:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var analyticsService = __webpack_require__(412);

	/**
	    name: Analytics view
	    type: ui
	    desc: >
	        Once initialized components is firing Tealium `view` event. Suitable for dynamic components loaded via AJAX.
	    options:
	        analytics: Analytics object
	*/
	module.exports = {
		ready: function() {
			if (this.$options.analytics.data) {
				analyticsService.view(this.$options.analytics.data);
			}
		}
	};


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

/***/ 416:
/***/ function(module, exports) {

	'use strict';

	var MODIFIERS = {
		active: 'cookie-popup--active'
	};

	/**
	name: Cookie policy
	type: ui
	desc: Shows cookie popup and sets flag if customer agreed of using cookies
	options:
		cookieName: String. Name of the cookie which is used as flag for customer's consent
		lifetime: Number. Lifetime of the flag-cookie (days)
		delay: Number. Delay before popup's appearing (milliseconds)
	*/
	module.exports = {
		events: {
			'click closeButton': '_hide'
		},

		initialize: function(){
			this._show();
		},

		_show: function() {
			setTimeout(this.$el.addClass.bind(this.$el, MODIFIERS.active), this.$options.delay);
		},

		_hide: function() {
			var date = new Date();
			var DAY = 86400000;
			date.setTime(date.getTime() + (DAY * this.$options.lifetime));
			document.cookie = this.$options.cookieName + '=true;path=/;expires=' + date.toUTCString();

			this.$el.removeClass(MODIFIERS.active);
		}
	};


/***/ },

/***/ 417:
/***/ function(module, exports) {

	'use strict';

	/**
	  name: CSRF token protection
	  type: ui
	  desc: >
	    Initialized at app start. Sets `RequestVerificationToken` header.
	  options:
	    requestVerificationToken: CSRF token
	*/
	module.exports = {
		initialize: function() {
			var token = this.$options.requestVerificationToken;

			this.$tools._tmp_.ajaxSend(function($ev, req, options) {
				if (options.type === 'GET') {
					return;
				}

				req.setRequestHeader('RequestVerificationToken', token);
			});

			this.$tools._tmp_.ajaxSuccess(function($ev, req, options, resp) {
				if (resp.data && resp.data.requestVerificationToken) {
					token = resp.data.requestVerificationToken;
				}
			});
		}
	};


/***/ },

/***/ 418:
/***/ function(module, exports) {

	'use strict';

	var itemsPath = 'planTabs.panels.items';

	module.exports = {
		events: {
			'success $speedTest': 'prequalificationComplete',
			'fail $speedTest': 'prequalificationFailed',
			'active $planTabs $$panels $$items': '_selectSubscription'
		},

		prequalificationComplete: function() {
			if (this.$options.disableOffers) {
				return;
			}

			this._showLoader();

			this.load(this.$tools.globalConfigs('TN.config.availableSubscriptionsHTMLUrl', ''), '#available-subscriptions', {
				sessionId: this.$options.sessionId
			})
				.finally(this._hideLoader.bind(this));
		},

		stopSpinner: function() {
			this.$components.speedTest.reject();
		},

		deactivate: function() {
			this._getComponents(itemsPath).forEach(function(item) {
				item.deactivate();
				item.enable();
			});
		},

		back: function() {
			this.flow.prev();
		},

		next: function() {
			var active = this._getActiveItem();

			this.$tools.data.post(this.$tools.globalConfigs('TN.config.dsl.services.saveSubscriptionUrl', ''), {
				offerId: active.$options.itemId,
				offerCode: active.$options.offerCode
			})
				.then(function(resp) {
					if (resp.success) {
						this.flow.next()
							.finally(this.deactivate.bind(this));

						return;
					}

					this.deactivate();
				}.bind(this))

				.catch(this.deactivate.bind(this));
		},

		prequalificationFailed: function() {
			if (this.$options.disableOffers) {
				return;
			}

			this.$components.prequalificationFailed.open();
		},

		_selectSubscription: function(event, item) {
			this._getComponents(itemsPath).forEach(function(item) {
				item.disable();
			});

			item.activate();
			item.enable();

			this.next();
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

		_getActiveItem: function() {
			return this._getComponents(itemsPath).filter(function(item) {
				return item.isActive();
			})[0];
		},

		_showLoader: function() {
			this.$components.loader.$el.show();
		},

		_hideLoader: function() {
			this.$components.loader.$el.hide();
		}
	};



/***/ },

/***/ 419:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		itemChecked: 'is-active'
	};

	module.exports = {
		events: {
			'click': '_activateClick',
			'select $plan': '_propagateEvent'
		},

		activate: function() {
			this.$el.addClass(CLASSES.itemChecked);

			this.$components.activateButton.activityIndicator();
		},

		isActive: function() {
			return this.$el.hasClass(CLASSES.itemChecked);
		},

		getItemId: function() {
			return this.$options.itemId;
		},

		deactivate: function() {
			this.$el.removeClass(CLASSES.itemChecked);
			this.$components.activateButton.resetLoading();
		},

		enable: function() {
			if (this.$options.disabled) {
				return;
			}

			this.$components.activateButton.enable();
		},

		disable: function() {
			this.$components.activateButton.disable();
		},

		_activateClick: function() {
			if (!this.$options.disabled) {
				this.$events.trigger('active', this);
			}
		},

		_propagateEvent: function(event, obj) {
			this.$events.trigger('select', obj);
		}
	};


/***/ },

/***/ 420:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.$events.on('deactivate $this', this._deactivate.bind(this));
		},
		events: {
			'click #radio-voip': 'onShowVoip',
			'click #radio-no-voip': 'onHideVoip'
		},
		ready: function() {
			this.$components.voipPlans.$events.on('select $this', this._next.bind(this));
			this.$components.skipFVOIP.$events.on('click $this', this.onSkipVOIP.bind(this));
		},
		_tempDisableEnabledButtonsExcept: function(planToIgnore) {
			var ids = [];

			this.$components.voipPlans.$components.plans.forEach(function(planComponent) {
				if (planComponent.id() !== planToIgnore.id && planComponent.$el.find('button').is(':enabled')) {
					planComponent.$el.find('button').prop('disabled', true);
					ids.push(planComponent.id());
				}

				planComponent.$el.find('.toggle__radio').prop('disabled', true);
			});

			return ids;
		},
		_next: function(_e, obj) {
			if (!this.flow.data.voip) {
				this.flow.next({voip: obj.plan, voip_addons: this._addons(obj.plan)})
					.then(function(response) {
						obj.dfd.resolve(response);
					})

					.catch(obj.dfd.reject.bind(obj.dfd));
			} else {
				this.flow.merge({voip: obj.plan, voip_addons: this._addons(obj.plan)});
				obj.dfd.resolve();
			}

			this.$components.skipFVOIP.disable();

			return false;
		},
		_deactivate: function() {
			delete this.flow.data.voip;
		},
		_addons: function(plan) {
			var addons = [];

			this.$el.find('input[data-product-id="' + plan.id + '"]:checked').each(function(_i, el) {
				addons.push(this.$tools.dom.find(el).data('addonId'));
			}.bind(this));

			return addons;
		},
		onSkipVOIP: function() {
			this.$components.voipPlans.hide();
			this.$components.voipPlans.$el.removeClass('is-active');
			this.$components.skipFVOIP.activityIndicator();

			if (!this.flow.data.voip) {
				this.flow.next({voip: {skip: true}});
			}
		},
		onShowVoip: function() {
			this.$components.voipPlans.show();
			this.$components.voipPlans.$el.addClass('is-active');
			this.$components.skipFVOIP.hide();
		},
		onHideVoip: function() {
			this.$components.voipPlans.hide();
			this.$components.voipPlans.$el.removeClass('is-active');
			this.$components.skipFVOIP.show();
		}
	};


/***/ },

/***/ 421:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'checked $accept': '_enableNextButton',
			'unchecked $accept': '_disableNextButton',
			'click $backButton': 'back'
		},

		back: function() {
			this.flow.prev();
		},

		_enableNextButton: function() {
			this.$components.confirmForm.$components.nextButton.enable();
		},

		_disableNextButton: function() {
			this.$components.confirmForm.$components.nextButton.disable();
		}
	};


/***/ },

/***/ 422:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.index = 0;
		},

		events: {
			'click .proceed': 'onProceedClick'
		},

		_save: function(params) {
			var dfd = this.$tools.q.defer();

			params.preQualificationResultId = this.flow.data.preQualificationResultId;

			this.$tools.data.post(TN.config.dsl.services.saveInstallationOptions, params)
				.then(function(response) {
					if (response.success) {
						dfd.resolve(response.data);
					} else {
						dfd.reject({
							errorMessages: response.errorMessages,
							validationErrors: response.validationErrors
						});
					}
				});

			return dfd.promise();
		},

		_clear: function() {
			this.$tools.dom.find('.installationError').empty();
			this.$components.selectPlan.resetLoading();
		},

		onProceedClick: function() {
			var form = this.$components.dslInstForm;
			var dfd;
			var formData;

			if (form && form.valid()) {
				dfd = this.$components.selectPlan.activityIndicator();

				formData = form.serialize();

				this._save(formData)
					.then(function() {
						this.flow.next({}, dfd);
					}.bind(this))

					.catch(function(obj) {
						var html = __webpack_require__(423);
						var compiled = this.$tools.template.parse(html);
						var errorMessage = '';
						var errKey;

						if (obj.errorMessages && obj.errorMessages.length) {
							errorMessage = obj.errorMessages.join(' ');
						} else if (obj.validationErrors) {
							for (errKey in obj.validationErrors) {
								errorMessage += obj.validationErrors[errKey] + ' ';
							}
						}

						this.html(compiled({messageText: errorMessage, messageType: 'error'}), '.installationError');

						dfd.reject();
					}.bind(this));
			}

			return false;
		}
	};


/***/ },

/***/ 423:
/***/ function(module, exports) {

	module.exports = "\t<div class=\"message message--<%= messageType || 'alert' %>\" data-component=\"message\">\n\t\t<div class=\"message__inner trailer leader\" data-element=\"messageContent\">\n\t\t\t<span class=\"message__icon icon icon-<%= messageType || 'alert' %>-no-bg\"></span>\n\n\t\t\t<div class=\"text-size--13 message__text\">\n\t\t\t\t<p data-element=\"messageText\"><%= messageText %></p>\n\t\t\t</div>\n\n\t\t\t<a class=\"message__close\" data-element=\"messageClose\">\n\t\t\t\t<span class=\"icon-remove\"></span>\n\t\t\t</a>\n\t\t</div>\n\t</div>"

/***/ },

/***/ 424:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.$events.on('activate $this', this._activate.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.start', function() {
				this.flow.reset('dslPlans');
			}.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.reset-wanted-product', function() {
				delete this.flow.data.planIDWanted;
			}.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.success', function(_msg, aqResult) {
				var data;
				this._disableAll();
				this._enableSome(aqResult.availableDslOfferIds);

				this._planListsGroupForEach(function(planListComponent) {
					planListComponent.$events.off('select $this');
					planListComponent.$events.on('select $this', this._next.bind(this));
				});

				this.flow.merge(aqResult);

				data = this.flow.data;
				if (data.planIDWanted && data.availableDslOfferIds.indexOf(data.planIDWanted) !== -1) {
					this._planListsGroupForEach(function(planListComponent) {
						planListComponent.$components.plans.forEach(function(planComponent) {
							if (planComponent.id() == data.planIDWanted) {
								planComponent.select();
							}
						}, this);
					});
				}

				delete this.flow.data.planIDWanted;
			}.bind(this));

			this.$tools.data.pubsub.subscribe('address-qualification.fail', function() {
				this._disableAll();
			}.bind(this));
		},

		ready: function() {
			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.$events.off('select $this');
				planListComponent.$events.on('select $this', this._askAddressQualification.bind(this));
			});
		},

		_activate: function() {
			delete this.flow.data.dsl;

			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.resetAll();
			});

			this._enableAll();
		},

		_enableAll: function() {
			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.enableAll();
			});
		},

		_disableAll: function() {
			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.disableAll();
			});
		},

		_enableSome: function(ids) {
			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.enable(ids);
			});
		},

		_planListsGroupForEach: function(fn) {
			this.$tools.util.each(this.$components.planTabs.$components.planListsGroup || [], (function(_e, planListComponent) {
				fn.call(this, planListComponent);
			}).bind(this));
		},

		_askAddressQualification: function(_e, obj) {
			this.flow.merge({
				planIDWanted: obj.plan.id
			});

			obj.dfd.reject();

			this.$tools.data.pubsub.publish('address-qualification.qualify');
		},

		_tempDisableEnabledButtonsExcept: function(planToIgnore) {
			var ids = [];

			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.$components.plans.forEach(function(planComponent) {
					if (planComponent.id() !== planToIgnore.id && planComponent.$el.find('button').is(':enabled')) {
						planComponent.$el.find('button').prop('disabled', true);
						ids.push(planComponent.id());
					}
				}, planListComponent);
			});

			return ids;
		},

		_next: function(_e, obj) {
			var tempDisabled;

			this._planListsGroupForEach(function(planListComponent) {
				planListComponent.$components.plans.forEach(function(planComponent) {
					if (planComponent.id() !== obj.plan.id) {
						planComponent.$components.selectPlan.resetLoading();
					}
				}, planListComponent);
			});

			tempDisabled = this._tempDisableEnabledButtonsExcept(obj.plan);

			if (!this.flow.data.dsl) {
				this.flow.next({dsl: obj.plan})
					.then(function() {
						obj.dfd.resolve();
						this._enableSome(tempDisabled);
					}.bind(this))

					.catch(obj.dfd.reject.bind(obj.dfd));
			} else {
				this.flow.merge({dsl: obj.plan});
				obj.dfd.resolve();
				this._enableSome(tempDisabled);
			}
		}
	};


/***/ },

/***/ 425:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var message = __webpack_require__(426);

	function ErrorStrategy() {
		this.$components.pstnValidationResultMsg
			.error(this.$tools.globalConfigs('TN.config.dsl.errors.pstnValidationErrorMessage', ''))
			.open();

		this.validationFailedStrategy = WarningStrategy;
	}

	function WarningStrategy() {
		this.$components.pstnValidationResultMsg
			.alert(this.$tools.globalConfigs('TN.config.dsl.errors.pstnSecondValidationErrorMessage', ''))
			.open();

		this.command = GoToNextStepCommand;
	}

	function ValidatePstnCommand() {
		var loadingDfd = this.$components.pstnProceed.activityIndicator();

		this.$tools.q.when(this.checkPstnAsync())
			.then(loadingDfd.resolve.bind(loadingDfd), loadingDfd.reject.bind(loadingDfd))
			.then(function() {
				this.$components.pstnValidationResultMsg.close();
				GoToNextStepCommand.call(this);
			}.bind(this))

			.catch(function() {
				this.validationFailedStrategy.call(this);
			}.bind(this));
	}

	function GoToNextStepCommand() {
		var dfd = this.$components.pstnProceed.activityIndicator();

		this.$tools.data.post(this.$tools.globalConfigs('TN.config.dsl.services.saveDslPstnValidationStepUrl'), {
			preQualificationResultId: this.flow.data.preQualificationResultId,
			validationResult: !!this.validationResult
		})
			.then(function() {
				this.flow.next()
					.then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			}.bind(this));
	}

	module.exports = {
		initialize: function() {
			this.command = ValidatePstnCommand;
			this.validationFailedStrategy = ErrorStrategy;
		},

		ready: function() {
			this.pstnContainer = this.$el.find('.pstn-wrapper');
			this.actionSelect = this.$el.find('select');
		},

		events: {
			'click .proceed': 'onProceedClick',
			'change select': 'onActionSelect'
		},

		checkPstnAsync: function() {
			var dfd = this.$tools.q.defer();

			this.$tools.data.post(this.$tools.globalConfigs('TN.config.dsl.services.validatePstn'), {
				preQualificationResultId: this.flow.data.preQualificationResultId,
				pstn: this.$el.find('#Pstn').val()
			})
				.then(function(response) {
					if (response.data && response.data.pstnIsValid == true) {
						this.validationResult = true;

						dfd.resolve();
					} else {
						this.validationResult = false;

						dfd.reject();
					}
				}.bind(this))

				.catch(function() {
					dfd.reject();
				});

			return dfd.promise();
		},
		onProceedClick: function() {
			this.$components.pstnValidationResultMsg.close();

			if (this.$components.pstnForm.valid()) {
				this.command.call(this);
			}

			return false;
		},
		onActionSelect: function() {
			var val = this.actionSelect.val();

			if (val.indexOf('EnterPstn') !== -1) {
				this.pstnContainer.show();

				this.command = ValidatePstnCommand;
			} else {
				this.pstnContainer.hide();

				this.command = GoToNextStepCommand;
			}
		}
	};


/***/ },

/***/ 426:
/***/ function(module, exports) {

	'use strict';

	var STATES = {
		opened: 'open',
		closed: 'close'
	};

	var CLASSES = {
		prefix: 'message--',
		closed: 'closed',
		alert: 'alert',
		error: 'error',
		warning: 'warning',
		collapsing: 'collapsing'
	};

	var animationName = 'height';

	/**
	name: Message
	type: ui
	desc: Can show notification to user.
	options:
		autoclose: Number. Sets time for auto close the message in milliseconds.
	events:
		click: Fires by click on close button if it exists.
		transitionend: Fires after finishing of show/hide animations.
	 */
	module.exports = {
		events: {
			'click messageClose': '_onClick',
			'transitionend': '_onTransitionEnd'
		},

		ready: function() {
			if ('autoclose' in this.$options) {
				this._startAutoCloseTimer(this.$options.autoclose);
			}

			this.$options.state = this.$el.hasClass(CLASSES.prefix + CLASSES.closed) ? STATES.closed : STATES.opened;
		},

		/**
		desc:
			Sets text for the message
		args:
			newText: String
		*/
		setText: function(newText) {
			this.$elements.messageText.text(newText);
		},

		/**
		desc:
			Sets type of message, possible values - 'error', 'warning', 'alert'.
		args:
			newType: String
		*/
		setType: function(newType) {
			var typeClasses = this._getTypeClasses();
			this.$el.removeClass(typeClasses).addClass(CLASSES.prefix + newType);
		},

		/**
		desc:
			Sets 'error' type of message and sets text for the message.
		args:
			text: String
		*/
		error: function(text) {
			this._message(text, CLASSES.error);

			return this;
		},

		/**
		desc:
			Sets 'warning' type of message and sets text for the message.
		args:
			text: String
		*/
		warning: function(text) {
			this._message(text, CLASSES.warning);

			return this;
		},

		/**
		desc:
			Sets 'alert' type of message and sets text for the message.
		args:
			text: String
		*/
		alert: function(text) {
			this._message(text, CLASSES.alert);

			return this;
		},

		/**
		desc:
			Shows the message.
		*/
		open: function() {
			if (this.$options.state === STATES.opened) {
				return;
			}
			this._setHeight();
			this.$el.addClass(CLASSES.collapsing);
			this.$options.state = STATES.opened;
		},

		/**
		desc:
			Closes the message.
		*/
		close: function() {
			if (this.$options.state === STATES.closed) {
				return;
			}

			requestAnimationFrame(function() {
				this._setHeight();

				requestAnimationFrame(function() {
					this.$el.css('height', 0);
					this.$el.addClass(CLASSES.collapsing);
					this.$options.state = STATES.closed;

					if (this.$options.closeAction) {
						this.$tools.data.get(this.$options.closeAction);
					}
				}.bind(this));
			}.bind(this));
		},

		_onClick: function(event) {
			event.preventDefault();
			this.close();
		},

		_onTransitionEnd: function(event) {
			if (event.propertyName !== animationName) {
				return;
			}

			this.$el.removeClass(CLASSES.collapsing);

			if (this.$options.state === STATES.opened) {
				this.$el.css('height', 'auto');
			}

			this.$events.trigger(this.$options.state);
		},

		_startAutoCloseTimer: function(closeTime) {
			setTimeout(this.close, closeTime || 0);
		},

		_message: function(msg, type) {
			this.setText(msg);
			this.setType(type);
		},

		_setHeight: function() {
			this.$el.css('height', this._getHeight());
		},

		_getHeight: function() {
			return this.$elements.messageContent.outerHeight(true);
		},

		_getTypeClasses: function() {
			return [CLASSES.prefix + CLASSES.alert, CLASSES.prefix + CLASSES.error, CLASSES.prefix + CLASSES.warning].join(' ');
		}
	};


/***/ },

/***/ 427:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.$tools.data.pubsub.subscribe('autocomplete.zip.changed', this.onZipAutocomplete.bind(this));
		},

		onZipAutocomplete: function(_msg, obj) {
			var city = obj.label.replace(/^\d+/, '');

			this.$components.city.$el.val(city).trigger('blur');
		}
	};


/***/ },

/***/ 428:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this._changeDate();
		},

		events: {
			'click $nextButton': 'save',
			'click $backButton': 'back',
			'checked $customAddress': 'showAddressForm',
			'unchecked $customAddress': 'hideAddressForm',
			'change $dateForm $$datepickers': '_changeDate'
		},

		back: function() {
			this.flow.prev();
		},

		_changeDate: function() {
			if (this._getDate()) {
				this.$components.nextButton.enable();

				return;
			}

			this.$components.nextButton.disable();
		},

		save: function() {
			var data;

			if (!this.isValid()) {
				return false;
			}

			this.$components.nextButton.activityIndicator();

			data = this.$tools.util.extend({}, this._getAddress(), {
				CustomAddress: this._getRadios(),
				effectiveDate: this._getDate()
			});

			this.$tools.data.post(this.$options.saveUrl, data)
				.then(this.next.bind(this))
				.catch(this._stopLoading.bind(this));
		},

		isValid: function() {
			return (!this._getRadios() || this._validateAddres()) && this.$components.dateForm.valid();
		},

		_stopLoading: function() {
			this.$components.nextButton.resetLoading();
		},

		next: function() {
			this.flow.next()
				.finally(this._stopLoading.bind(this));
		},

		showAddressForm: function() {
			this.$components.addressForm.show();
			this.$components.addressForm.$el.slideDown();

			this.$components.defaultAddress.$el.slideUp(function() {
				this.$components.defaultAddress.hide();
			}.bind(this));
		},

		hideAddressForm: function() {
			this.$components.addressForm.$el.slideUp(function() {
				this.$components.addressForm.hide();
			}.bind(this));

			this.$components.defaultAddress.show();
			this.$components.defaultAddress.$el.slideDown();
		},

		_getAddress: function() {
			var addressForm = this.$components.addressForm;
			return addressForm ? addressForm.serialize() : {};
		},

		_getRadios: function() {
			var customAddress = this.$components.customAddress;
			return customAddress && customAddress.isChecked();
		},

		_validateAddres: function() {
			var addressForm = this.$components.addressForm;
			return addressForm ? addressForm.valid() : true;
		},

		_getDate: function() {
			return this.$components.dateForm.serialize().startDate;
		}
	};


/***/ },

/***/ 429:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var AQService = __webpack_require__(430);

	var statuses = {
		failed: 2
	};

	module.exports = {
		initialize: function() {
			this.aqservice = new AQService();
		},

		ready: function() {
			this.qualify(this.$options.resultId);
		},

		reject: function() {
			this.$components.spinner.reject();
		},

		qualify: function(resultId) {
			this.aqservice.request({}, this.$options.pageId, resultId)
				.then(this._success.bind(this))
				.catch(this._fail.bind(this));
		},

		_success: function(data) {
			if (data.NewPrequalificationId) {
				this.qualify(data.NewPrequalificationId);

				return;
			}

			switch (data.preQualificationResultStatus) {
				case statuses.failed:
					this.$components.spinner.reject();

					break;

				default:
					this.$components.spinner.resolve({
						speed: data.LineSpeedTextValue || '0 Mbit'
					});
			}

			this.$events.trigger('success', data);
		},

		_fail: function() {
			this.reject();
			this.$events.trigger('fail');
		}
	};


/***/ },

/***/ 430:
/***/ function(module, exports) {

	'use strict';

	module.exports = QualifyAddressService;

	function QualifyAddressService() {}

	QualifyAddressService.prototype._start = function(address) {
		return app.core.data.post(TN.config.dsl.services.startPreQualificationUrl, address);
	};

	QualifyAddressService.prototype._ping = function(preQualificationResultId, pageID, dfd, sessionId) {
		app.core.data.post(TN.config.dsl.services.getPreQualificationUrl, {
			preQualificationResultId: preQualificationResultId,
			pageId: pageID,
			sessionId: sessionId
		})
			.then(function(response) {
				var TIMEOUT_PING = 1000;
				if (response.success) {
					if (response.data) {
						dfd.resolve(response.data);
					} else {
						setTimeout(function() {
							this._ping(preQualificationResultId, pageID, dfd);
						}.bind(this), TIMEOUT_PING);
					}
				} else {
					dfd.reject({
						errorMessages: response.errorMessages
					});
				}
			}.bind(this))

			.catch(dfd.reject.bind(dfd));
	};

	QualifyAddressService.prototype.request = function(address, pageID, preQualificationResultId) {
		var dfd = app.core.q.defer();

		address.pageId = pageID;

		if (preQualificationResultId) {
			this._ping(preQualificationResultId, pageID, dfd);

			return dfd.promise();
		}

		this._start(address)
			.then(function(response) {
				if (response.success) {
					this._ping(response.data.preQualificationResultId, pageID, dfd);
				} else {
					dfd.reject({
						errorMessages: response.errorMessages
					});
				}
			}.bind(this))

			.catch(dfd.reject.bind(dfd));

		return dfd.promise();
	};


/***/ },

/***/ 431:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		error: 'error',
		result: 'result',
		hidden: 'hidden',
		fading: 'fading'
	};

	var animationName = 'opacity';

	module.exports = {
		events: {
			'transitionend': '_onTransitionEnd'
		},
		ready: function() {
			this.index = 0;

			this.current = this.$components.holders[this.index];

			this.timeout = null;

			if (this.$components.holders.length < 2) {
				return;
			}

			this._startNext();
		},

		_startNext: function() {
			var TIMEOUT_NEXT = 5000;
			if (this.isResolved()) {
				return;
			}

			this.timeout = setTimeout(this._showNext.bind(this), TIMEOUT_NEXT);
		},

		_showNext: function() {
			this._fade(this.current.$el)
				.then(this._goToNext.bind(this));
		},

		_fade: function() {
			this.currentDfd = this.$tools.q.defer();
			this.current.$el.addClass(CLASSES.fading);
			this.current.$el.toggleClass(CLASSES.hidden);

			return this.currentDfd.promise();
		},

		_goToNext: function() {
			if (this.isResolved()) {
				return;
			}

			this.current = this._getNext();
			this._fade(this.current.$el)
				.then(this._startNext.bind(this));
		},

		isResolved: function() {
			return this.$el.hasClass(CLASSES.result) || this.$el.hasClass(CLASSES.error);
		},

		_hideHolders: function() {
			this.$components.holders.forEach(function(holder) {
				holder.$el.addClass(CLASSES.hidden);
			});
		},

		resolve: function(data) {
			this.$components.resultHolder.setText(data.speed);

			this._hideHolders();

			this.$components.resultHolder.$el.show();

			this.$el.addClass(CLASSES.result);

			clearTimeout(this.timeout);
		},

		reject: function() {
			this._hideHolders();

			this.$components.errorHolder.$el.show();

			this.$el.addClass(CLASSES.error);

			clearTimeout(this.timeout);
		},

		_getNext: function() {
			++this.index;

			this.index = this.index % this.$components.holders.length;

			return this.$components.holders[this.index];
		},

		_onTransitionEnd: function(event) {
			if (event.propertyName !== animationName) {
				return;
			}
			this.current.$el.removeClass(CLASSES.fading);
			this.currentDfd.resolve();
		}
	};


/***/ },

/***/ 432:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		setText: function(text) {
			this.$components.speed.$el.text(text);
		}
	};


/***/ },

/***/ 433:
/***/ function(module, exports) {

	'use strict';

	/**
		name: editable-block/block
		type: ui
		desc: Editable form
	*/

	module.exports = {
		events: {
			'click $edit': 'edit',
			'reset $editForm': 'cancel',
			'submit $editForm': 'save'
		},

		ready: function() {
			this._editingMode = false;
			this._request = null;

			this._animation = this.$extensions['editable-block/load-animation'];

			this._showEditIcon();
		},

		/**
			desc: start edit form
		*/
		edit: function() {
			if (this._editingMode) {
				return;
			}

			this._editingMode = true;

			this.$events.trigger('editing');

			this._cacheContent();

			this._request = this.$tools.data.post(this.$options.edit, this._getData());

			this._startLoading()
				.then(function() {
					return this._request;
				}.bind(this))

				.then(function(data) {
					this._toggle(data);
					this._editing(data);
					this._completeLoading(data.data && data.data.html);
				}.bind(this))

				.catch(function(error) {
					this._failed(error);
					this.cancel();
					this._completeLoading();
				}.bind(this));
		},

		/**
			desc: cancel editing
		*/
		cancel: function() {
			var html;
			
			if (!this._editingMode) {
				return;
			}

			html = this.cachedContent || '';

			this._editingMode = false;

			this._startLoading()
				.then(function() {
					this.changeContent(html);
				}.bind(this))

				.finally(function() {
					this._completeLoading(html);
				}.bind(this));

			this._abortRequest();
			this._showEditIcon();
		},

		/**
			desc: save changes
		 */
		save: function() {
			if (!this.$components.editForm.valid()) {
				return;
			}

			this._request = this.$tools.data.post(this.$options.save, this.$components.editForm.serialize());

			this._startLoading()
				.then(function() {
					return this._request;
				}.bind(this))

				.then(function(data) {
					this._toggle(data);
					this._saved(data);
					this._completeLoading(data.data && data.data.html);
				}.bind(this))

				.catch(function(error) {
					this._failed(error);
					this._completeLoading();
				}.bind(this));
		},


		/**
			desc: change block content
		 */
		changeContent: function(html) {
			this.html(html, this.$elements.container);
		},

		_startLoading: function() {
			if (this._animation) {
				return this._animation.start();
			}

			return this.$tools.q.when();
		},

		_completeLoading: function(html) {
			if (this._animation) {
				this._animation.end(html);
			}
		},

		_cacheContent: function() {
			this.cachedContent = this.$elements.container.html();
		},

		_editing: function(data) {
			if (data.success) {
				this._hideEditIcon();
				return;
			}

			this._failed(data);
		},

		_getData: function() {
			if (this.$components.hiddenForm) {
				return this.$components.hiddenForm.serialize();
			}

			return {};
		},

		_showError: function(errorMessage) {
			if (!this.$components.errorMessage) {
				return;
			}

			this.$components.errorMessage.setText(errorMessage);
			this.$components.errorMessage.open();
		},

		_toggle: function(data) {
			this._request = null;

			if (!data.success) {
				this._showError(data.errorMessages && data.errorMessages[0]);

				return;
			}

			this.changeContent(data.data.html);
		},

		_abortRequest: function() {
			this._request && this._request.abort();
			this._request = null;
		},

		_saved: function(data) {
			if (data.success) {
				this._editingMode = false;
				this._showEditIcon();

				this.$events.trigger('saved', data.data);

				return;
			}

			this._failed(data);
		},

		_failed: function(data) {
			if(data.statusText !== 'abort'){
				this.$events.trigger('failed', data.errorMessages && data.errorMessages[0]);
			}
		},

		_showEditIcon: function() {
			if(this.$components.edit){
				this.$components.edit.show();
			}
		},

		_hideEditIcon: function() {
			if(this.$components.edit){
				this.$components.edit.hide();
			}
		}
	};


/***/ },

/***/ 434:
/***/ function(module, exports) {

	'use strict';

	/**
		name: editable-block
		type: ui
		desc: Listens to 'failed', 'saved', 'editing' events from nested 'editable-block/block' components
			  Displays messages and populates content if some child have to change content of another
	*/

	module.exports = {
		events: {
			'failed $$editables': '_failed',
			'saved $$editables': '_saved',
			'editing $$editables': '_editing'
		},

		ready: function(){
			this._defaultSuccessText = this.$options.successMessage;
			this._defaultErrorText = this.$options.errorMessage;
		},

		_failed: function(event, message) {
			this.$components.errorMessage.setText(message || this._defaultErrorText);
			this.$components.errorMessage.open();
			this.$components.successMessage.close();
		},

		_saved: function(event, data) {
			var message = data.successMessage || this._defaultSuccessText;

			this.$components.successMessage.setText(message);
			this.$components.successMessage.open();
			this.$components.errorMessage.close();

			if(data.allyContent){
				this._populateAllyContent(data.allyContent);
			}
		},

		_populateAllyContent: function(allyContent){
			var ally;
			for(ally in allyContent){
				this.$components[ally] && this.$components[ally].changeContent(allyContent[ally]);
			}
		},

		_editing: function(event) {
			this.$components.editables.forEach(function(editable) {
				if (editable !== event.data.component) {
					editable.cancel();
				}
			});

			this.$components.errorMessage.close();
			this.$components.successMessage.close();
		}
	};



/***/ },

/***/ 435:
/***/ function(module, exports) {

	'use strict';

	/**
		name: editable-block/load-animation
		type: ui
		desc: Extension with preloader and fade animation for editable-block
	*/

	var CLASSES = {
		toggleEdit: 'toggle-edit'
	};

	module.exports = {
		events: {
			'transitionend container': '_transEnd'
		},

		start: function() {
			if (this._transition) {
				return this.$tools.q.when();
			}

			this._setFixedHeight();

			this._transition = this.$tools.q.defer();

			this.$elements.container.addClass(CLASSES.toggleEdit);

			this._transition
				.then(function() {
					this._showSpinner();
					this._transition = null;
				}.bind(this));

			return this._transition.promise();
		},

		end: function(html) {
			this.$elements.container.removeClass(CLASSES.toggleEdit);

			this._hideSpinner();
			this._setFixedHeight(html);
		},

		_transEnd: function() {
			if (this._transition) {
				this._transition.resolve();
			}
		},

		_setFixedHeight: function(html) {
			var height = 0;
			var clone;

			if (!html) {
				this.$elements.container.css({height: this.$elements.container.outerHeight(true)});

				return;
			}

			clone = this.$elements.container.clone();

			this._transition = this.$tools.q.defer();
			this.$elements.container.after(clone);

			clone.html(html);
			height = clone.css({height: ''}).outerHeight(true);
			clone.remove();

			this.$elements.container.css({height: height});

			this._transition
				.then(function() {
					this._clearHeight();
					this._transition = null;
				}.bind(this));
		},

		_clearHeight: function(){
			this.$elements.container.css({height: ''});
		},

		_showSpinner: function() {
			if (this.$components.spinner) {
				this.$components.spinner.$events.trigger('busy-mode-on');
			}
		},

		_hideSpinner: function() {
			if (this.$components.spinner) {
				this.$components.spinner.$events.trigger('busy-mode-off');
			}
		}
	};


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

/***/ 443:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		activate: function() {
			this.$el.addClass('active');
		},

		isActive: function() {
			return this.$el.is('.active');
		},

		getGroupNum: function() {
			return this.$options.groupNum;
		},

		deactivate: function() {
			this.$el.removeClass('active');
		}
	};


/***/ },

/***/ 444:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.$tools.data.pubsub.subscribe('update-user-info', this.updateUserPanel.bind(this));
			this.$el.parent().toggleClass('menu--user--empty', this.$el.is(':empty'));
		},
		updateUserPanel: function() {
			var service = this.$tools.globalConfigs('TN.config.updatePanelConfig.' + this.$options.updatePanel, null);
			if (service) {
				this.load(service);
			}
		}
	};


/***/ },

/***/ 445:
/***/ function(module, exports) {

	'use strict';

	/**
		desc: Component for setting right height attribute for iframe after this one will be loaded
		*/

	module.exports = {
		initialize: function() {
			this.$el.load(this._iframeLoaded.bind(this));
			this.$el.prop('src', this.$options.src);
		},

		_iframeLoaded: function() {
			var iframe = this.$el.get(0);
			var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
			var iframeBody = iframeDocument.body;
			var height;

			iframeBody.style.width = '100%';
			iframeBody.style.padding = '0';

			height = Math.max(iframeDocument.height || 0,
				iframeBody.scrollHeight || 0,
				iframeBody.offsetHeight || 0,
				iframeBody.height || 0,
				iframeDocument.documentElement.clientHeight || 0,
				iframeDocument.documentElement.scrollHeight || 0,
				iframeDocument.documentElement.offsetHeight || 0);

			this.$el.attr('height', height + 'px');

			this.$events.trigger('loaded');
		}
	};


/***/ },

/***/ 446:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		password: '[data-selector="password"]'
	};

	module.exports = {
		events: {
			'submit $loginForm': '_onLoginFormSubmit'
		},

		ready: function() {
			this._$password = this.$el.find(SELECTORS.password);
			this._$loginButton = this.$components.loginForm.$components.loginButton;
		},

		_onLoginFormSubmit: function(event, mixedProductsDecision) {
			var formData;

			if (!this.$components.loginForm.valid()) {
				return;
			}

			formData = this.$components.loginForm.serialize();

			if (mixedProductsDecision) {
				formData.mixedProductsDecision = mixedProductsDecision;
			}

			this._$loginButton.activityIndicator();

			this.$tools.data.post(this.$components.loginForm.getUrl(), formData)
				.then(this._onLoginComplete.bind(this))
				.catch(this._onLoginFail.bind(this));
		},

		_onLoginComplete: function(response) {
			if (response.success) {
				this.$tools.util.redirect(response.data.redirectUrl);
			} else if (this._getProductsChecker() && this._getProductsChecker().hasMixedProducts(response)) {
				response.data.callback = this._onLoginFormSubmit.bind(this);
				this._getProductsChecker().checkMixedProducts(response, this._$loginButton);
			} else {
				this._incorrectData(response.errorMessages[0]);
			}
		},

		_onLoginFail: function() {
			this._incorrectData(this.$options.serverErrorText);
		},

		_incorrectData: function(text) {
			this.$components.errorMessage.setText(text);
			this.$components.errorMessage.open();

			this._$password.val('');
			this._$loginButton.resetLoading();
		},

		_getProductsChecker: function() {
			return this.$extensions['products-checker'];
		}
	};


/***/ },

/***/ 447:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $loginEtmForm': 'login'
		},
		login: function(event) {
			var form = this.$components.loginEtmForm;
			var formComponents = form.$components;

			event.preventDefault();

			formComponents.errorMessage.close();
			formComponents.loginEtmButton.activityIndicator();


			form.submitAsync()
				.then(this.loginComplete.bind(this))
				.catch(this.loginFailed.bind(this));
		},

		loginComplete: function(response) {
			var _win = window;

			if (response.success) {
				while(_win.self !== _win.top) {
					try {
						_win = _win.parent;
					} catch(exc) {
						break;
					}
				}

				_win.location.href = response.data.redirectUrl;
			} else {
				this.incorrectData(response.errorMessages[0]);
			}
		},

		incorrectData: function(text) {
			var formComponents = this.$components.loginEtmForm.$components;

			formComponents.errorMessage.setText(text);
			formComponents.errorMessage.open();
			formComponents.etmPassword.$el.val('');
			formComponents.loginEtmButton.resetLoading();
		},

		loginFailed: function() {
			this.incorrectData(this.$options.serverErrorText);
		}
	};


/***/ },

/***/ 448:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var UtilService = __webpack_require__(449);

	var settings = {
		isBusyClass: 'login--block--is-busy',
		btnSubmitPrimaryClass: '.button--primary-action',
		blockErrors: '.block--errors',
		errorMessages: '.message--error',
		newStepHtml: '<div class="login--block__step"></div>'
	};

	var startURL = null;
	var isBusy = false;

	module.exports = {
		initialize: function() {
			this._isSidePanelOpened = false;

			this._onOpenerEventHandler = this._onOpenerEventHandler.bind(this);
			this._onCloserEventHandler = this._onCloserEventHandler.bind(this);
			this._onKeyHandler = this._onKeyHandler.bind(this);
			this.checkSuccess = this.checkSuccess.bind(this);
			this.clearCurrentData();
			this.refreshElements();
			this.attachEvents();

			this.currentData = {};

			this.refreshCurrentData({});
		},

		events: {
			'click [data-login="closer"]' : '_onCloserHandler',
			'click [data-login="get"]' : '_onResponseHandler',
			'click [data-login="post"]' : '_onResponseHandler',
			'click [data-login="redirect"]' : '_onRedirectHandler'
		},

		refreshElements: function() {
			this.$set = this.$el.find('.login--block__set');
			this.$stepActive = this.$el.find('.login--block__step:eq(0)');
			this.$stepNext = this.$el.find('.login--block__step:eq(1)');
		},

		attachEvents: function() {
			this.$el.on('keydown', 'input, textarea', this._onKeyHandler);
			this.$tools.data.pubsub.subscribe('login/open', this._onOpenerEventHandler);

			this.$tools.data.pubsub.subscribe('side-panel/open', function() {
				this._isSidePanelOpened = true;
			}.bind(this));

			this.$tools.data.pubsub.subscribe('side-panel/closed', this._onCloserEventHandler);
			this.$tools.data.pubsub.subscribe('changeResponseAndSubmit', function(event, eventData) {
				if(this.$components.nemId) {
					this.turnBusyOn();
					this.request({
						url: this.$components.nemId.$options.nextActionUrl,
						success: this.checkSuccess
					}, JSON.stringify(eventData));
				}
			}.bind(this));
		},

		// EventHandler
		_onResponseHandler: function(event) {
			var url;
			var self;

			event.preventDefault();

			if (isBusy ||
				(this.currentData.currentForm.length &&
				this.currentData.currentForm.valid &&
				!this.currentData.currentForm.valid())
			) {
				return false;
			}

			this.currentBtn = event.$el;
			this.turnBusyOn();

			url = this.currentBtn.data('href');
			self = this;

			if (this.currentBtn.data('login').toLowerCase() === 'post') {
				this.request({
					url: url,
					success: this.checkSuccess
				});
			} else {
				this.request({
					url: url,
					type: 'GET',
					success: function(newFlowData) {
						if (newFlowData.data.redirectUrl) {
							self.afterRequestRedirect(newFlowData.data);
							return false;
						}

						if (newFlowData.data.close) {
							self.closeBlock();
							self.clearCurrentData();
							return false;
						}

						self.switchSteps(newFlowData.data.html, function() {
							self.refreshCurrentData(newFlowData.data.model);
						});
					}
				});
			}
		},

		_onCloserHandler: function(event) {
			event.preventDefault();
			this.closeBlock();
			this.clearCurrentData();
		},

		_onRedirectHandler: function(event) {
			var currentTarget = event.$el;
			var newFlowUrl = currentTarget.data('href');
			var isReverse = currentTarget.data('reverse');
			var self;

			event.preventDefault();

			if (isBusy) {
				return false;
			}

			if(!newFlowUrl) return;
			startURL = newFlowUrl;
			this.turnBusyOn();

			self = this;

			this.request({
				url: newFlowUrl,
				type: 'GET',
				success: function(newFlowData) {
					if (!newFlowData.success) {
						if (newFlowData.errorMessages) {
							self.errorsHandler(newFlowData);
						}
					} else {
						self.switchSteps(newFlowData.data.html, function() {
							self.refreshCurrentData(newFlowData.data.model);
						}, isReverse);
					}
				}
			});
		},
		_onKeyHandler: function(event) {
			var btnPrimary;
			var KEYCODE = {ENTER: 13};
			if (event.keyCode === KEYCODE.ENTER) {
				event.preventDefault();
				btnPrimary = this.$stepActive.find(settings.btnSubmitPrimaryClass).eq(0);

				if (btnPrimary.length) {
					btnPrimary.click();
				}
			}
		},
		_onOpenerEventHandler: function(event, newFlowUrl) {
			var self;
			if (this._isSidePanelOpened) {
				return;
			}

			if (isBusy) {
				return false;
			}

			startURL = newFlowUrl;
			this.turnBusyOn();
			self = this;

			this.request({
				url: newFlowUrl,
				type: 'GET',
				success: function(newFlowData) {
					if (newFlowData.data.redirectUrl) {
						self.afterRequestRedirect(newFlowData.data);
						return false;
					}

					self.html(newFlowData.data.html, self.$stepActive);
					self.openBlock();
					self.refreshCurrentData(newFlowData.data.model);
				}
			});
		},
		_onCloserEventHandler: function() {
			this._isSidePanelOpened = false;
			this.hide();
		},


		// RequestService
		request: function(options, incomeData) {
			var self = this;
			var data = '';

			if (incomeData) {
				data = incomeData;
			} else if (!options.type) {
				data = this.getCurrentData();
			}

			UtilService.getRequest(this.$tools.util.extend({}, {
				data: data,
				complete: function() {
					self.turnBusyOff();
				}
			}, options));
		},

		// ResultHandler
		checkSuccess: function(resultData) {
			if (!resultData.success) {
				if (resultData.data.html) {
					this.redrawHandler(resultData.data);
				}

				if (resultData.errorMessages) {
					this.errorsHandler(resultData);
				}
			} else {
				if (resultData.errorMessages) {
					this.tmpErrorMessages = resultData.errorMessages;
				}

				this.successHandler(resultData.data);
			}
		},
		redrawHandler: function(data) {
			this.html(data.html, this.$stepActive);
			this.refreshElements();
			this.refreshCurrentData(data.model);

			if (this.currentData.currentForm.length && this.currentData.currentForm.valid) {
				this.currentData.currentForm.valid();
			}
		},
		errorsHandler: function(data) {
			this.clearErrors();
			this.html(UtilService.buildError(data.errorMessages), settings.blockErrors);
			this.tmpErrorMessages = null;
		},
		successHandler: function(data) {
			if (data.close) {
				this.closeBlock();
				this.$tools.data.pubsub.publish('update-user-info', true);
			} else if (data.redirectUrl) {
				this.afterRequestRedirect(data);
			} else if (data.getUrl) {
				this.afterRequest(data.getUrl, data, 'GET');
			} else if (data.postUrl) {
				this.afterRequest(data.postUrl, data, 'POST');
			}
		},
		afterRequestRedirect: function(data) {
			this.delayRedirect(this, data.redirectUrl, data.delay);
		},
		afterRequest: function(url, data, type) {
			var self;

			this.refreshCurrentData(data.model);

			if (type.toLowerCase() === 'get' && url === startURL) {
				this.clearCurrentData();
			} else if (this.currentData.currentForm.length) {
				this.currentData.state =
					this.$tools.util.extend({}, this.currentData.state, UtilService.serializeObject(this.currentData.currentForm));
			}

			self = this;
			this.request({
				url: url,
				type: type,
				success: function(newFlowData) {
					self.switchSteps(newFlowData.data.html, function() {
						self.refreshCurrentData(newFlowData.data.model);
						if (newFlowData.data.redirectUrl) {
							self.delayRedirect(self, newFlowData.data.redirectUrl, newFlowData.data.delay);
						}
					});
				}
			});
		},
		delayRedirect: function(self, redirectUrl, delay) {
			setTimeout(function() {
				self.closeBlock();
				location = decodeURIComponent(redirectUrl);
			}, delay || 0);
		},

		switchSteps: function(source, refreshCurrentData, isReverse) {
			var self = this;
			var TIMEOUT_ANIMATE = 300;
			this.html(source, this.$stepNext);

			if (isReverse) {
				this.$stepNext.prependTo(this.$set.css({left: '-100%'}));

				this.$set.animate({left: 0}, TIMEOUT_ANIMATE, function() {
					self.$set[0].insertAdjacentHTML('beforeend', settings.newStepHtml);
					self.$stepActive.remove();
					self.refreshElements();

					if (self.tmpErrorMessages) {
						self.errorsHandler({
							errorMessages: self.tmpErrorMessages
						});
					}

					if (typeof refreshCurrentData === 'function') {
						refreshCurrentData();
					}
				});
			} else {
				this.$set.animate({left: '-100%'}, TIMEOUT_ANIMATE, function() {
					self.$set.css({left: 0})[0].insertAdjacentHTML('beforeend', settings.newStepHtml);
					self.$stepActive.remove();
					self.refreshElements();

					if (self.tmpErrorMessages) {
						self.errorsHandler({
							errorMessages: self.tmpErrorMessages
						});
					}

					if (typeof refreshCurrentData === 'function') {
						refreshCurrentData();
					}

				});
			}
		},

		openBlock: function() {
			this.show();
			this.$tools.data.pubsub.publish('side-panel/open', true);
		},

		closeBlock: function() {
			var redirectUrl;
			this.$tools.data.pubsub.publish('side-panel/close');
			redirectUrl = this.checkRefreshPageFlag();

			if (redirectUrl) {
				switch (redirectUrl.toString()) {
					case 'true':
						location.reload();
						break;

					default:
						location = decodeURIComponent(redirectUrl);
						break;
				}
			}
		},
		checkRefreshPageFlag: function() {
			return this.$el.find('[data-login="closer"]').data('refresh');
		},

		turnBusyOn: function() {
			isBusy = true;
			this.$events.trigger('busy-mode-on');
		},

		turnBusyOff: function() {
			isBusy = false;
			this.$events.trigger('busy-mode-off');
		},

		// DataService
		getCurrentData: function() {
			var currentState = this.$tools.util.extend({}, this.currentData.state);
			currentState = this.$tools.util.extend(currentState, UtilService.serializeObject(this.currentData.currentForm));
			return JSON.stringify(currentState);
		},

		clearCurrentData: function() {
			this.currentData = {
				state: {},
				currentForm: {}
			};

			startURL = null;
		},

		refreshCurrentData: function(newFlowData) {
			this.currentData = {
				state: this.$tools.util.extend({}, this.currentData.state, newFlowData),
				currentForm: this.$el.find('form:eq(0)')
			};
		},

		clearErrors: function() {
			this.$el.find(settings.errorMessages).detach();
		}
	};


/***/ },

/***/ 449:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var jQuery = __webpack_require__(2);
	var messageTemplate = app.core.template.parse(__webpack_require__(423));

	module.exports = {
		serializeObject: function(arr) {
			var obj = {};
			var serizlizedArray = arr.serializeArray();

			jQuery.each(serizlizedArray, function() {
				if (obj[this.name]) {
					if (!obj[this.name].push) {
						obj[this.name] = [obj[this.name]];
					}
					obj[this.name].push(this.value || '');
				} else {
					obj[this.name] = this.value || '';
				}
			});
			return obj;
		},
		getRequest: function(options) {
			jQuery.ajax({
				url: options.url || '/',
				type: options.type || 'POST',
				contentType: options.contentType || 'application/json; charset=utf-8',
				dataType: options.dataType || 'json',
				data: options.data || '',
				success: function(data) {
					if (options.success) {
						options.success(data);
					}
				},
				error: function() {
					if (options.error) {
						options.error();
					}
				},
				complete: function() {
					if (options.complete) {
						options.complete();
					}
				}
			});
		},
		buildError: function(arr) {
			var result = '';
			var index;

			if (!arr) {
				return '';
			}

			for (index = arr.length - 1; index >= 0; index--) {
				result += messageTemplate({messageText: arr[index], messageType: 'error'});
			}

			return result;
		}
	};


/***/ },

/***/ 450:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.openLogin = this.openLogin.bind(this);
			this.$el.on('click', this.openLogin);

			if (this.$options.invoke) {
				this.openLogin();
			}
		},
		openLogin: function(event) {
			if (event) {
				event.preventDefault();
			}

			this.$tools.data.pubsub.publish('login/open', this.$options.href);
		}
	};


/***/ },

/***/ 451:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var MapProvider = __webpack_require__(452);
	var pubsub = __webpack_require__(330);

	// Constants
	var MAP_OPTIONS = {
		zoom: 7,
		zoomControl: true,
		panControl: false,
		scrollwheel: false,
		mapTypeControl: false,
		styles: [{
			stylers: [
				{saturation: -100},
				{lightness: 25}
			]
		}
		]
	};

	var PATH_OPTIONS = {
		polylineOptions: {
			strokeColor: '#6b2377',
			strokeWeight: 5
		},
		markerOptions: {
			visible: false
		}
	};

	var GoogleMapProvider = module.exports = function(domNode) {
		this.domNode = domNode;
		window.googleMapApiLoaded = this.googleMapApiLoaded.bind(this);
	};

	GoogleMapProvider.prototype = MapProvider;

	GoogleMapProvider.prototype.googleMapApiLoaded = function() {
		this.load(this.domNode);
	};

	// Public methods
	GoogleMapProvider.prototype.init = function(domNode) {
		MAP_OPTIONS.zoomControlOptions = {
			style: window.google.maps.ZoomControlStyle.SMALL,
			position: window.google.maps.ControlPosition.LEFT_TOP
		};
		MAP_OPTIONS.mapTypeId = window.google.maps.MapTypeId.ROADMAP;

		this.map = new window.google.maps.Map(domNode, MAP_OPTIONS);
		this.directionsRenderer = new window.google.maps.DirectionsRenderer(PATH_OPTIONS);
		this.directionsService = new window.google.maps.DirectionsService();
		this.geocoder = new window.google.maps.Geocoder();
		this.directionsRenderer.setMap(this.map);

		pubsub.publish('/map/initialized');
	};

	GoogleMapProvider.prototype.setCenter = function(position) {
		this.map.setCenter(new window.google.maps.LatLng(position.lat, position.lng));
	};

	GoogleMapProvider.prototype.addMarker = function(position, options, clickHandler) {
		var latLng = new window.google.maps.LatLng(position.lat, position.lng);
		var marker;

		options = options || {}; //TODO type need check

		marker = new window.google.maps.Marker(app.core.helper.extend({
			position: latLng,
			map: this.map,
			type: options.type
		}, options));

		if (typeof clickHandler === 'function') {
			window.google.maps.event.addListener(marker, 'click', clickHandler);
		}

		return marker;
	};

	GoogleMapProvider.prototype.removeMarker = function(markerObject) {
		markerObject.setMap(null);
	};

	GoogleMapProvider.prototype.getPositionByAddress = function(address, country) {
		country = country || 'DK'; //TODO Why DK

		this.geocoder.geocode({
			address: address,
			componentRestrictions: {country: country}
		}, function(results, status) {
			var location;
			if ((status === window.google.maps.GeocoderStatus.OK)
				&& (results[0].address_components[0].short_name !== country)) {
				location = results[0].geometry.location;
				pubsub.publish('/map/position/found', this.createPoint(location.lat(), location.lng()));
			} else {
				pubsub.publish('/map/position/not/found', status);
			}
		}.bind(this));
	};

	GoogleMapProvider.prototype.drawPath = function(start, end) {
		this.getRoute(start, end, function(response) {
			this.directionsRenderer.setDirections(response);
			this.directionsRenderer.setMap(this.map);
			this.map.getStreetView().setVisible(false);
		}.bind(this));
	};

	GoogleMapProvider.prototype.changePath = function(startPosition, endPosition) {
		this.cleanPaths();
		this.drawPath(startPosition, endPosition);

		pubsub.publish('/map/path/changed');
	};

	GoogleMapProvider.prototype.cleanPaths = function() {
		this.directionsRenderer.setMap(null);
		pubsub.publish('/map/path/removed');
	};

	GoogleMapProvider.prototype.getRoute = function(start, end, onRouteResolve) {
		var request = {
			origin: new window.google.maps.LatLng(start.lat, start.lng),
			destination: new window.google.maps.LatLng(end.lat, end.lng),
			travelMode: window.google.maps.TravelMode.DRIVING
		};
		this.directionsService.route(request, function(response, status) {
			if (status === window.google.maps.DirectionsStatus.OK) {
				onRouteResolve && onRouteResolve(response);
				pubsub.publish('/map/direction/resolved', response);
			}
		});
	};

	GoogleMapProvider.prototype.SetMarkerVisibility = function(markerObject, status) {
		markerObject.setVisible(status);
	};

	/*  Without route */

	GoogleMapProvider.prototype.SetWithoutRoute = function(start, end) {
		var MAP_ZOOM = 11;
		this.map.setZoom(MAP_ZOOM);
		this.map.setCenter(new google.maps.LatLng(end.lat, end.lng));
		this.map.getStreetView().setVisible(false);

		this.getRoute(start, end);
	};

	GoogleMapProvider.prototype.WithoutRoute = function(startPosition, endPosition) {
		this.SetWithoutRoute(startPosition, endPosition);

		pubsub.publish('/map/path/changed');
	};


/***/ },

/***/ 452:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var pubsub = __webpack_require__(330);

	var MapProvider = function() {
	};

	// Instantiate provider
	module.exports = new MapProvider();

	/**
	 * Initializes map provider.
	 * Please, do NOT override it. Use 'init' method.
	 *
	 * @param domNode - specifies DOM node where map should be rendered
	 */
	MapProvider.prototype.load = function(domNode) {
		this._initCurrentLocation(); // init Geolocation position
		this.loadAPI();
		this.init.call(this, domNode);
	};

	// Interface methods (can be overridden in specific map provider)

	/**
	 * Loads needed script for specific map provider.
	 * Broadcasts specific event when API is ready.
	 */
	MapProvider.prototype.loadAPI = function() {
		pubsub.publish('/map/api/loaded');
	};

	/**
	 * Initializes map view.
	 * Broadcasts specific event when map is ready.
	 */
	MapProvider.prototype.init = function() {
		pubsub.publish('/map/initialized');
	};

	/**
	 * Creates marker on a map.
	 * Broadcasts event when marker is created and send marker object.
	 *
	 * @param position - coordinates where marker should be added
	 * @param options - additional marker properties
	 * @param clickHandler - function to handle marker's click event
	 */
	MapProvider.prototype.addMarker = function() {
		pubsub.publish('/map/marker/added', {});
	};

	/**
	 * Removes marker from map.
	 * Broadcasts event when marker is removed.
	 *
	 * @param markerObject - marker to remove
	 */
	MapProvider.prototype.removeMarker = function() {
		pubsub.publish('/map/marker/removed');
	};

	/**
	 * Draws path between two points.
	 * Broadcasts event when path is draw.
	 */
	MapProvider.prototype.drawPath = function() {
		pubsub.publish('/map/path/added');
	};

	/**
	 * Cleans all paths on a map and draws new.
	 * Broadcasts event when path is draw.
	 */
	MapProvider.prototype.changePath = function() {
		pubsub.publish('/map/path/changed');
	};

	/**
	 * Removes all paths from the map.
	 * Broadcasts event when paths is removed.
	 */
	MapProvider.prototype.cleanPaths = function() {
		pubsub.publish('/map/path/removed');
	};

	/**
	 * Broadcasts event when set location.
	 */
	MapProvider.prototype.SetWithoutRoute = function() {
		pubsub.publish('/map/path/added');
	};

	/**
	 * Cleans old response, and set a new.
	 * Broadcasts event when set location
	 */
	MapProvider.prototype.WithoutRoute = function() {
		pubsub.publish('/map/path/changed');
	};

	/**
	 * get route to store from google API
	 */
	MapProvider.prototype.getRoute = function() {
	};

	/**
	 * Determines coordinates by specified address.
	 * Broadcasts event when position is determined.
	 *
	 * @param address - string address to search position.
	 */
	MapProvider.prototype.getPositionByAddress = function() {
		pubsub.publish('/map/position/found', {});
	};

	/**
	 * Locates center of the map to the specified position.
	 *
	 * @param position - position to be the center
	 */
	MapProvider.prototype.setCenter = function() {
		pubsub.publish('/map/centered');
	};

	// Reusable methods

	/**
	 * Creates universal structure to describe point on a map.
	 *
	 * @param latitude - geographical value of latitude
	 * @param longitude - geographical value of longitude
	 * @returns {{lat: *, lng: *}}
	 */
	MapProvider.prototype.createPoint = function(latitude, longitude) {
		return {
			lat: latitude,
			lng: longitude
		};
	};

	MapProvider.prototype.setItemsData = function(items) {
		this.itemsData = items;
	};

	MapProvider.prototype.getItemsData = function() {
		return this.itemsData || [];
	};

	MapProvider.prototype.getUserData = function() {
		return this.userPosition || {};
	};

	MapProvider.prototype.setUserData = function(position) {
		this.userPosition = position;
	};

	MapProvider.prototype.isReadyToDrawPath = function() {
		return this.getItemsData().length > 0 && this.userPosition;
	};

	MapProvider.prototype.findNearestItemCoords = function(userlocation) {
		var items = this.getItemsData();
		var nearestItem;
		var minDistance;
		var index;
		var item;
		var distance;

		if (items.length) {
			nearestItem = items[0];
			minDistance = this._calcDistance(userlocation,
				this.createPoint(nearestItem.location.latitude, nearestItem.location.longitude));

			for (index = 1; index < items.length; index++) {
				item = items[index];
				if (item.location.latitude && item.location.longitude) {
					distance = this._calcDistance(userlocation,
						this.createPoint(item.location.latitude, item.location.longitude));

					if (distance < minDistance) {
						minDistance = distance;
						nearestItem = item;
					}
				}
			}

			return nearestItem;
		}
		return null;
	};

	// Private methods

	MapProvider.prototype._calcDistance = function(start, end) {
		var RADIUS = 6371; // Radius of the earth in km
		var dLat = this._degToRad(end.lat - start.lat);
		var dLon = this._degToRad(end.lng - start.lng);
		var _a = (Math.sin(dLat / 2) * Math.sin(dLat / 2)) +
			(Math.cos(this._degToRad(start.lat)) * Math.cos(this._degToRad(end.lat)) *
			Math.sin(dLon / 2) * Math.sin(dLon / 2));
		var delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - _a));
		return RADIUS * delta;
	};

	MapProvider.prototype._degToRad = function(deg) {
		var DEGREE = 180;
		return deg * Math.PI / DEGREE;
	};

	MapProvider.prototype._initCurrentLocation = function() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this._initCurrentLocationSuccess.bind(this));
		}
	};

	MapProvider.prototype._initCurrentLocationSuccess = function(position) {
		var userPoint = this.createPoint(position.coords.latitude, position.coords.longitude);
		this.userPosition = userPoint;
		pubsub.publish('/map/user/position/changed', userPoint);
	};


/***/ },

/***/ 453:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.items = {};

			this.$tools.data.pubsub.subscribe('header.height', function(ev, callback){
				var sticky;
				if (callback && typeof callback === 'function'){
					sticky = this.$elements && this.$elements.headerSticky.filter(':visible');
					callback(sticky && sticky.height ? sticky.height() : 0);
				}
			}.bind(this));
		},
		ready: function() {
			this.$child = this._getSticky();

			this._listElements();

			if (this.$child) {
				this._listen();

				this.$components.menuSubnav.isSticky() && this._insertElements();
			}
		},
		_getSticky: function() {
			var $container;
			var $child;

			if (!this.$components.menuSubnav) {
				return false;
			}

			$child = this.$components.menuSubnav.$el;

			if ($child.length !== 1) {
				$child = false;
			} else {
				$container = $child.find('[data-hook="nav.desktop.wrapper"]').first();

				if ($container.length !== 1) {
					$child.container = false;
				} else {
					$child.container = $container;
				}
			}

			return $child;
		},
		_listen: function() {
			this.$child.on('sticky-start', this._insertElements.bind(this));
			this.$child.on('sticky-end', this._returnElements.bind(this));
		},
		_listElements: function() {
			var key;
			var hookF = this.$el
							.append('<span style="display: none;"></span>')
							.children()
							.last()
							.detach();

			this.items.logo = {};

			for(key in this.items) {
				if (Object.prototype.hasOwnProperty.call(this.items, key)) {
					this.items[key].hook = hookF.clone();
				}
			}

			this.items.logo.el = this.$el.find('#logo');

			if (!!this.$child) {
				this.$child.target = this.$child.container.find('[data-hook="nav.desktop.target"]');
			}
		},

		_insertElements: function() {
			var key;
			for(key in this.items) {
				if (Object.prototype.hasOwnProperty.call(this.items, key)) {
					this.items[key].el.replaceWith(this.items[key].hook).prependTo(this.$child.target);
				}
			}
		},

		_returnElements: function() {
			var key;
			for(key in this.items) {
				if (Object.prototype.hasOwnProperty.call(this.items, key)) {
					this.items[key].hook.replaceWith(this.items[key].el).prependTo(this.$child.target);
				}
			}
		}
	};


/***/ },

/***/ 454:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Nav flex
		type: ui
		desc:
			Ensures that menu items are fit a viewport by calculating their width
	*/
	module.exports = {
		initialize: function() {
			var TIMEOUT_RESIZE = 200;
			this.flexnav = false;
			this.subnav = false;
			this.isUpdating = false;
			this.isOpen = false;

			this.hasFilterButton = this.$el.find('.flexnav__filter').length;

			this.subnavTag = this.$el.prop('tagName').toLowerCase();
			this.flexnavTag = this.options[this.subnavTag] || 'div';

			this.$el.addClass('flexnav--inited');

			this._updateFlexnav();

			this.$tools.dom.find(window).on('resize', this.$tools.helper.throttle(this.onWindowResize.bind(this), TIMEOUT_RESIZE));
		},

		options: {
			ol: 'li',
			ul: 'li',
			dl: 'dd'
		},

		_open: function() {
			this.isOpen = true;
			this.$el.find('.flexnav').addClass('is-open');

			// add global listener to close when clicked outside
			this.$tools.dom.find(window).on('touchstart', this.onGlobalClick.bind(this));
			this.$tools.dom.find('html').on('click', this.onGlobalClick.bind(this));
		},

		_close: function() {
			this.isOpen = false;
			this.$el.find('.flexnav').removeClass('is-open');

			// remove global listener
			this.$tools.dom.find(window).off('touchstart');
			this.$tools.dom.find('html').off('click');
		},

		_toggle: function() {
			if (this.isOpen) {
				this._close();
			} else {
				this._open();
			}
		},

		_updateFlexnav: function() {
			var count = 0;
			var MAX_COUNT = 20;

			// escape if element or parent is not displayed
			if (!this.$el.outerWidth() || !this._getAvailableWidth()) {
				this._cleanUp();
				return;
			}

			// do update
			if (this._checkWidth()) {
				while (this._checkWidth() && this.$el.find('.flexnav__subnav li').length) {
					this._removeFromFlexnav();

					// check overflow
					count++;
					if (count > MAX_COUNT) {
						return;
					}
				}
				// check if has sub navigation
				if (!this.$el.find('.flexnav__subnav li').length && this._checkWidth()) {
					this._removeFlexnav();
				} else if (!this._checkWidth()) {
					// remove one if to long
					this._addToFlexnav();
				}
			} else {
				// adds to dropdown until width of buttons are in bound
				while (!this._checkWidth() && this._getAvailableWidth()) {
					if (!this.flexnav) {
						this._addFlexnav();
					}

					this._addToFlexnav();

					// check overflow
					count++;
					if (count > MAX_COUNT) {
						return;
					}
				}
			}

			// If all nav items are hidden except for the "More" button then anchor the subnav dropdown to the left
			// instead of to the right so that the content won't overflow out of the view on low res devices.
			if (this.$el.find('> ' + this.flexnavTag).length == 1) {
				this.$el.find('.flexnav__subnav').addClass('nav-left');
			} else {
				this.$el.find('.flexnav__subnav').removeClass('nav-left');
			}

			this._cleanUp();
		},

		_cleanUp: function() {
			this.isUpdating = false;
		},

		_getAvailableWidth: function() {
			var compensate = this.flexnav ? this.flexnav.outerWidth(true) : 0;
			return this.$el.width() - compensate;
		},

		_getItemsWidth: function() {
			var width = 0;
			var items = this.$el.children();

			items.each((function(_i, el) {
				var $item = this.$tools.dom.find(el);

				if (!$item.hasClass('flexnav')) {
					width += $item.outerWidth(true);
				}
			}).bind(this));

			return width;
		},

		_checkWidth: function() {
			return this._getAvailableWidth() > this._getItemsWidth();
		},

		_addFlexnav: function() {

			if (!this.flexnav) {
				if (this.hasFilterButton) {
					this.$el
						.children(this.flexnavTag + ':last')
						.before('<' + this.flexnavTag + '  class="flexnav"><a class="flexnav__toggler">' + this.$options.moreText + '</a><' + this.subnavTag + ' class="flexnav__subnav"></' + this.subnavTag + '></' + this.flexnavTag + '>');
				} else {
					this.$el
						.append('<' + this.flexnavTag + '  class="flexnav"><a class="flexnav__toggler">' + this.$options.moreText + '</a><' + this.subnavTag + ' class="flexnav__subnav"></' + this.subnavTag + '></' + this.flexnavTag + '>');
				}

				this.flexnav = this.$el.find('.flexnav');
				this.subnav = this.$el.find('.flexnav__subnav');

				this.$el.find('.flexnav__toggler').click(this._toggle.bind(this));

				setTimeout(function() {
					this.$el.addClass('flexnav--active');
				}.bind(this), 0);
			}
		},

		_removeFlexnav: function() {
			if (this.flexnav) {
				if (this.isOpen) {
					this._toggleSubnav();
				}

				this.flexnav.remove();
				this.flexnav = false;
				this.subnav = false;

				// remove active class
				this.$el.removeClass('flexnav--active');
			}
		},
		_addToFlexnav: function() {
			var item = this.flexnav.prev();

			if (item) {
				this.subnav.prepend(item);
				return true;
			}

			return false;
		},
		_removeFromFlexnav: function() {
			var item = this.subnav && this.subnav.find('>:first');

			if (item) {
				this.flexnav.before(item);
				return true;
			}

			return false;
		},
		_toggleSubnav: function() {
			if (this.flexnav) {
				this._toggle();
			}
		},
		onWindowResize: function() {
			if (!this.isUpdating) {
				this.isUpdating = true;
				this._updateFlexnav();
			}
		},
		onGlobalClick: function(event) {
			var TIMEOUT_CLOSE = 150;
			if (!this.$tools.dom.find(event.target).parents('.flexnav').length && this.isOpen) {
				this._close();
			} else if (this.$options.closeOnChildClick && this.isOpen && this.$tools.dom.find(event.target).parents('.flexnav__subnav').length) {
				// Cannot close the flex nav immediately on iDevices or it won't work.
				this.$tools.dom.find(window).off('touchstart');
				this.$tools.dom.find('html').off('click');
				setTimeout(function() {
					this._close();
				}.bind(this), TIMEOUT_CLOSE);
			}
		}
	};


/***/ },

/***/ 455:
/***/ function(module, exports) {

	'use strict';

	/**
	    name: Nav mobile
	    type: ui
	    desc:
	        Displays navigation panel on mobile devices
	    pubsub:
	        side-panel/open: fires when panel is opened
	*/
	module.exports = {
		initialize: function() {
			this._isSidePanelOpened = false;

			this.$tools.data.pubsub.subscribe('nav/mobile/open', this._onOpenerEventHandler.bind(this));

			this.$tools.data.pubsub.subscribe('side-panel/open', function() {
				this._isSidePanelOpened = true;
			}.bind(this));

			this.$tools.data.pubsub.subscribe('side-panel/closed', this._onCloserEventHandler.bind(this));
		},

		_onOpenerEventHandler: function() {
			if (this._isSidePanelOpened) {
				return;
			}

			this.show();
			this.$tools.data.pubsub.publish('side-panel/open');
		},

		_onCloserEventHandler: function() {
			this._isSidePanelOpened = false;

			this.hide();
		}
	};


/***/ },

/***/ 456:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.openMobileNav = this.openMobileNav.bind(this);
			this.$el.on('click', this.openMobileNav);
		},

		openMobileNav: function(event) {
			event.preventDefault();
			this.$tools.data.pubsub.publish('nav/mobile/open');
		}
	};


/***/ },

/***/ 457:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Nav sticky
		type: ui
		desc: >
			Nav sticky is a component that gives you the ability to make any element on your page always stay visible.
		options:
			target: selector of a dom element whos height is used as top spacing
		pubsub:
			nav.sticky: fires on sticky start
			nav.unstick: fires on sticky end
	*/
	module.exports = {
		initialize: function() {
			var targetSel = this.$options.target;

			this.on = false;

			if (!!targetSel) {
				this.$target = this.$tools.dom.find(targetSel);
			} else {
				this.$target = false;
			}

			this.media = this.$options.media;

			this.config = {};
			this.config.topSpacing = this.$target ? this.$target.height() : 0;
			this.config.className = 'section--sticky';
			this.config.wrapperClassName = '';

			this.enable();
		},
		enable: function() {
			if (!this.on) {
				this.on = true;
				this.$el.sticky(this.config);
				this._subscribe();
			}
		},
		disable: function() {
			if (this.on) {
				this.on = false;
				this.$el.unstick();
				this._unSubscribe();
			}
		},
		isSticky: function(){
			return this._isSticky;
		},
		_subscribe: function() {
			this.$el.on('sticky-start', function() {
				this._isSticky = true;
				this.$tools.data.pubsub.publish('nav.sticky');
			}.bind(this));

			this.$el.on('sticky-end', function() {
				this._isSticky = false;
				this.$tools.data.pubsub.publish('nav.unstick');
			}.bind(this));
		},
		_unSubscribe: function() {
			this.$el.off('sticky-start');
			this.$el.off('sticky-end');
		}
	};


/***/ },

/***/ 458:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PingService = __webpack_require__(459);

	module.exports = {
		initialize: function() {
			var REPING_TIME = 20;
			this.pingService = new PingService();

			this.defaultClass = 'status-badge--neutral';
			this.onlineClass = 'status-badge--accept';
			this.offlineClass = 'status-badge--warning';
			this.$options.repingTime = this.$options.repingTime || REPING_TIME;
		},

		ready: function() {
			this.startPing();
		},

		startPing: function() {
			this.pingService.ping(this.$options.url).then(this.setOnline.bind(this))
				.catch(this.setOffline.bind(this))

				.finally(function() {
					var MILLISECOND = 1000;
					setTimeout(this.startPing.bind(this), this.$options.repingTime * MILLISECOND);
				}.bind(this));
		},

		setOnline: function() {
			this.$el.removeClass([this.defaultClass, this.offlineClass].join(' '));
			this.$el.addClass(this.onlineClass);
		},

		setOffline: function() {
			this.$el.removeClass([this.defaultClass, this.onlineClass].join(' '));
			this.$el.addClass(this.offlineClass);
		}
	};


/***/ },

/***/ 459:
/***/ function(module, exports) {

	'use strict';

	function PingService() {}

	module.exports = PingService;

	PingService.prototype.ping = function(url) {
		var dfd = app.core.q.defer();

		app.core.data.get(url)
			.then(function(response) {
				if (response.success) {
					dfd.resolve(response);

					return;
				}

				dfd.reject(response);
			})

			.catch(dfd.reject.bind(dfd));

		return dfd.promise();
	};


/***/ },

/***/ 460:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Plan list
		type: ui
	*/
	module.exports = {
		initialize: function() {
		},
		ready: function() {
			// workaround for case when plan list is empty
			this.$components.plans = this.$components.plans || [];

			this.$components.plans.forEach(function(planComponent) {
				planComponent.$events.on('select $this', this._propagate.bind(this));
			}, this);
		},
		/**
			desc: Enables all plan list items
		*/
		enableAll: function() {
			this.$components.plans.forEach(function(planComponent) {
				planComponent.enable();
			});
		},
		/**
			desc: Disables all plan list items
		*/
		disableAll: function() {
			this.$components.plans.forEach(function(planComponent) {
				planComponent.disable();
			});
		},
		/**
			desc: Resets all plan list items
		*/
		resetAll: function() {
			this.$components.plans.forEach(function(planComponent) {
				planComponent.reset();
			});
		},
		enable: function(ids) {
			ids = [].concat(ids);

			this.$components.plans.forEach(function(planComponent) {
				if (ids.indexOf(planComponent.id()) !== -1) {
					planComponent.enable();
				}
			});
		},
		disable: function() {

		},
		_propagate: function(_e, obj) {
			this.$events.trigger('select', obj);
		}
	};


/***/ },

/***/ 461:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'select $$plans': 'onPlanSelect'
		},
		onPlanSelect: function(_e, obj) {
			this.$components.plans.forEach(function(planComponent) {
				if (planComponent.id() !== obj.plan.id) {
					planComponent.disable();
				}
			});

			obj.dfd.then(function() {
				this.$components.plans.forEach(function(planComponent) {
					if (planComponent.id() !== obj.plan.id) {
						planComponent.enable();
					}
				});
			}.bind(this));
		}
	};


/***/ },

/***/ 462:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Plan item
		type: ui
		desc: Represents an item in plan list
		options:
			productId: ID of a product
			planName: Name of a product
		events:
			select: Fires when plan been selected
	*/
	module.exports = {
		events: {
			'click .select-plan': 'onSelectPlanClick',
			'click $planForm $selectPlan': '_onSelectPlan'
		},

		/**
			desc: Returns plan id as a string
		*/
		id: function() {
			return String(this.$options.productId);
		},

		/**
			desc: Returns product name
		*/
		name: function() {
			return String(this.$options.planName);
		},

		/**
			desc: Converts plan to JSON. Includes `id` and `name`
		*/
		toJSON: function() {
			return {
				id: this.id(),
				name: this.name()
			};
		},

		/**
			desc: Enable plan
		*/
		enable: function() {
			this.$el
				.removeClass('row-disabled')
				.find('button')
				.removeClass('button--default')
				.addClass('button--accept--border')
				.prop('disabled', false);
		},

		/**
			desc: Disable plan
		*/
		disable: function() {
			this.$el
				.addClass('row-disabled')
				.find('button')
				.addClass('button--default')
				.removeClass('button--accept--border')
				.prop('disabled', true);
		},

		/**
			desc: Returns true if plan is enables
		*/
		enabled: function() {
			return this.$el.find('button').is(':enabled');
		},

		/**
			desc: Returns true if plan is disabled
		*/
		disabled: function() {
			return this.$el.find('button').is(':disabled');
		},

		/**
			desc: Reset plan state
		*/
		reset: function() {
			this.enable();

			this.$components.selectPlan.resetLoading();
		},

		/**
			desc: Makes plan **selected** by firing `select` event
		*/
		select: function() {
			var dfd = this.$components.selectPlan.activityIndicator();

			this.$events.trigger('select', {
				plan: this.toJSON(),
				url: this.$components.selectPlan.$options.url,
				dfd: dfd
			});
		},
		onSelectPlanClick: function() {
			this.select();
		},
		_onSelectPlan: function(event) {
			var dfd = event.data.component.activityIndicator();

			this.$events.trigger('select', {
				plan: this.$components.planForm.serialize(),
				url: this.$components.planForm.$options.url,
				button: event.data.component,
				dfd: dfd
			});
		}
	};


/***/ },

/***/ 463:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(370);


/***/ },

/***/ 464:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(371);


/***/ },

/***/ 465:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(373);


/***/ },

/***/ 466:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(376);


/***/ },

/***/ 467:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(377);


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

/***/ 469:
/***/ function(module, exports) {

	'use strict';

	var COOKIE_NAME = 'pixelRatio';
	var COOKIE_NAME_ANGULAR = 'pixelRatioSet';

	/**
	    name: Responsive image proxy
	    type: ui
	    desc:
	        Initialized at app start. Adds `Pixel Ratio` cookie making it possible to return resized images by ImageVault
	*/
	module.exports = {
		initialize: function() {
			this._setPixelRatioCookie();
		},

		_setPixelRatioCookie: function() {
			if(document.cookie.indexOf(COOKIE_NAME_ANGULAR) === -1) {
				document.cookie = COOKIE_NAME + '=' + this._calculatePixelRatio() + ';domain=' + this._getDomain() + ';path=/;';
			}
		},

		_calculatePixelRatio: function() {
			var ROUND_HELPER = 2;
			if (!window.devicePixelRatio || window.devicePixelRatio <= 1) {
				return 1;
			}
			return Math.round(window.devicePixelRatio * ROUND_HELPER) / ROUND_HELPER;
		},

		_getDomain: function() {
			return this.$options.cookieDomain || window.location.hostname;
		}
	};



/***/ },

/***/ 470:
/***/ function(module, exports) {

	'use strict';

	var settings = {
		bodyActiveClass: 'offcanvas--open',
		onCanvasElementActiveClass: 'is-disabled'
	};

	/**
		name: Side panel
		type: ui
		pubsub:
			side-panel/closed: fires when panel has been closed
	 */
	module.exports = {
		initialize: function() {
			this.$body = this.$tools.dom.find('body').addClass('offcanvas');
			this.$onCanvasElement = this.$tools.dom.find('.section--oncanvas');
			this.openedState = false;

			this.$tools.data.pubsub.subscribe('side-panel/open', this.openPanel.bind(this));
			this.$tools.data.pubsub.subscribe('side-panel/close', this.closePanel.bind(this));
		},

		ready: function() {
			this.$el.on('touchmove', function() {
				return (this.$el[0].scrollHeight > this.$el.height());
			}.bind(this));

			if (!this.$options.preventOutsideClick) {
				this.$tools.dom.find(document).on('click touchstart', '.section--oncanvas.is-disabled', this._onCanvasHandler.bind(this));
			}
		},

		closePanel: function() {
			var TIMEOUT_CLOSE = 300;
			this.togglePanel(false);
			setTimeout(this.closedEvent.bind(this), TIMEOUT_CLOSE);
		},

		openPanel: function(event, wideWidth) {
			this.togglePanel(true, wideWidth);
		},

		closedEvent: function() {
			this.$tools.data.pubsub.publish('side-panel/closed');
		},

		togglePanel: function(state, wideWidth) {
			this.$body.toggleClass(settings.bodyActiveClass, state).toggleClass('side-panel--wide', !!wideWidth);

			this.$onCanvasElement.toggleClass(settings.onCanvasElementActiveClass, state);
			this.openedState = state;
		},

		_onCanvasHandler: function() {
			if (this.openedState) {
				this.closePanel();
			}
		}
	};


/***/ },

/***/ 471:
/***/ function(module, exports) {

	'use strict';

	var MIN_QUERY_LENGTH = 2;

	/**
	 name: Search
	 type: ui
	 desc: Shows search results for text query.
	 options: >
		searchUrl: Url of service, to use for search queries.
		initialQuery: query example .../search?query=term_for_initial_search.
		limitResults: Total number of results that can be displayed.
		searchPageLink: Link to main search page to redirect from top-search, when viewAll clicked.
	 */
	module.exports = {
		events: {
			'submit form': '_onSearch',
			'click clear': '_onClearInput',
			'click suggestion': '_onSuggest',
			'click $showMore': '_onShowMore',
			'typeWatch $searchInput': '_onInput',
			'valueIsSet $searchInput': '_onSearch',
			'filterChange $filters': '_onFilter'
		},

		initialize: function() {
			this.$options.limitResults = this.$options.limitResults > 0
				? this.$options.limitResults
				: Number.MAX_VALUE;
		},

		ready: function() {
			this._initialSearch();
		},
		/**
		 desc: Hides results, clears input
		 */
		hideResults: function() {
			this._onClearInput();

			this.$elements.searchResult.hide();
		},

		_onInput: function() {
			this.$elements.clear.toggle(!!this.$components.searchInput.$el.val());
		},

		_onSearch: function(event) {
			event.preventDefault();

			this._seekOut();
		},

		_onClearInput: function() {
			this.$components.searchInput.$el.val('');
			this.$elements.clear.hide();
		},

		_onSuggest: function(event) {
			var suggestion = event.$el.text();

			event.preventDefault();

			this.$components.searchInput.$el.val(suggestion);
			this._seekOut();
		},

		_onShowMore: function() {
			this._getResults({
				query: this._lastResponse.query,
				page: this._lastResponse.nextPage,
				categories: this.$components.filters.getCurrentState().values
			}, false);
		},

		_setShowAllButtonLink: function() {
			var url = this.$options.searchPageLink + '?query=' + this._lastResponse.query;

			this.$components.showAll.$el.attr('href', url);
		},

		_initialSearch: function() {
			if (!this.$options.initialQuery) {
				return;
			}

			this.$components.searchInput.$el.val(this.$options.initialQuery);
			this.$elements.clear.show();
			this._seekOut();
		},

		_seekOut: function(categories) {
			var query = this.$components.searchInput.$el.val();

			if (query.length < MIN_QUERY_LENGTH) {
				return;
			}

			this._lastResponse = {};
			this._receivedResults = 0;

			this._getResults({
				page: 1,
				newQuery: true,
				query: query,
				categories: categories || []
			}, true);
		},

		_getResults: function(requestData) {
			requestData.query = encodeURIComponent(requestData.query);
			requestData.categories = requestData.categories.concat({
				categoryName: this.$options.pageTypeCategory,
				values: [this.$options.pageType]
			});

			this.$tools.data.post(this.$options.searchUrl, requestData)
				.then(this._processResults.bind(this, requestData.newQuery));
		},

		_onFilter: function(event, data) {
			this._seekOut(data.values);
		},

		_processResults: function(newQuery, response) {
			var data;
			if (!response.data) {
				return;
			}

			data = response.data;

			this._receivedResults += data.resultsCount;
			this._lastResponse = {
				query: response.data.query,
				nextPage: response.data.nextPage,
				totalResults: response.data.totalResults
			};

			if (data.itemsHtml) {
				this.html(data.itemsHtml, this.$elements.items, newQuery ? null : 'beforeend');
			} else if (newQuery) {
				this.html('', this.$elements.items);
			}

			if (data.headlineHtml) {
				this.html(data.headlineHtml, this.$elements.headline);
			}

			this.$elements.searchResult.show();
			this._setShowAllButtonLink();
			this.$elements.buttonSet.toggle(!this._isLastPage());
		},

		_isLastPage: function() {
			return Math.min(this.$options.limitResults, this._lastResponse.totalResults) <= (this._receivedResults || 0);
		}
	};


/***/ },

/***/ 472:
/***/ function(module, exports) {

	'use strict';

	var MODIFIERS = {
		active : 'search-block--active'
	};

	/**
	 name: Top Search
	 type: ui
	 desc: Resizeable search box for headers
	 */
	module.exports = {
		events: {
			'click': '_expand'
		},

		initialize: function() {
			this._anchor = this.$tools.dom.find('[data-element="searchAnchor"]');
			this._boundary = this.$tools.dom.find('[data-element="searchBoundary"]');
			this._active = false;
		},

		ready: function() {
			window.addEventListener('click', this._onOuterClick.bind(this));
		},

		_expand: function() {
			var width;

			if (!this._anchor.length || this._active) {
				return;
			}

			width = this._anchor.width() - (this._boundary.length ? this._boundary.outerWidth(true) : 0);

			this.$components.siteSearch.$el.css({width: width});
			this.$el.addClass(MODIFIERS.active);
			this._active = true;
		},

		_shrink: function() {
			this.$components.siteSearch.$el.css({width: ''});
			this.$components.siteSearch.hideResults(true);

			this.$el.removeClass(MODIFIERS.active);
			this._active = false;
		},

		_onOuterClick: function(event) {
			if (this._active && (this.$el[0] === event.target || this.$el[0].contains(event.target))) {
				return;
			}

			this._shrink();
		}
	};


/***/ },

/***/ 473:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this._activateItem({}, this.$components.flow.flow.getActiveStepIndex());
		},

		events: {
			'activateStep $flow': '_activateItem'
		},

		_activateItem: function(ev, index) {
			var groupNum;
			if (index < 0 || index > this.$components.items.length - 1) {
				return;
			}

			groupNum = this.$components.items[index].getGroupNum();

			this.$components.items.forEach(function(item) {
				item.deactivate();
			});

			this.$components.texts.forEach(function(text) {
				if (text.getGroupNum() === groupNum) {
					text.activate();
				} else {
					text.deactivate();
				}
			});

			this.$components.items[index].activate();
		}
	};


/***/ },

/***/ 474:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var CLASSES = {
		sticky: 'is-sticky'
	};

	var	pubsub = __webpack_require__(330);
	/**
	name: Sticky
	type: ui
	desc: >
		makes DOM element to follow the scroll.
		The bounding box of the parent element is respected

	options:
		ignoreHeaderHeight: do not call for header.height, consider header height as 0. Default is to respect header height
	*/
	module.exports = {
		initialize: function() {
			var parentBoundingBox = this.$el[0].parentElement.getBoundingClientRect();
			// set initial width according to parent bounding box
			this.$el[0].style.width = parentBoundingBox.width + 'px';
			this._isSticky = false;
			window.addEventListener('scroll', this._onScroll.bind(this), false);
			this._onScroll();
		},

		_onScroll: function() {
			if (this.$options.ignoreHeaderHeight) {
				this._recalculate(0);
			} else {
				pubsub.publish('header.height', this._recalculate.bind(this));
			}
		},

		_enableSticky: function(top) {
			this._isSticky = true;
			this.$el.addClass(CLASSES.sticky);
			this.$el[0].style.top = top ? top + 'px' : '';
		},

		_disableSticky: function(top) {
			this._isSticky = false;
			this.$el.removeClass(CLASSES.sticky);
			this.$el[0].style.top = top ? top + 'px' : '';
		},

		_recalculate: function(headerHeight) {
			if (!this._isSticky) {
				this._treatNonSticky(headerHeight);
			}

			if (this._isSticky) {
				this._treatSticky(headerHeight);
			}
		},

		_treatNonSticky: function(headerHeight) {
			var clientRect = this.$el[0].getBoundingClientRect();
			var relativeTop = parseInt(this.$el[0].style.top || 0, 10);

			// if element is stuck at bottom
			if (relativeTop > 0) {
				if (clientRect.top > headerHeight) {
					this._enableSticky(headerHeight);
				}
				return;
			}
			// if element is stuck to bottom
			if (clientRect.top < headerHeight) {
				this._enableSticky(headerHeight);
			}

		},

		_treatSticky: function(headerHeight) {
			var clientRect = this.$el[0].getBoundingClientRect();
			var containerRect = this.$el[0].parentElement.getBoundingClientRect();
			var style;
			var clientHeight;

			// if element should not be stuck at container bottom
			if ((clientRect.height + headerHeight) > (containerRect.top + containerRect.height)) {
				style = window.getComputedStyle(this.$el[0], null);
				// calculate inner height (ignoring padding), sice sticky and non-sticky block have different paddings
				clientHeight = parseInt(style.height, 10) - parseInt(style.paddingTop, 10) - parseInt(style.paddingBottom, 10);
				this._disableSticky(containerRect.height - clientHeight);
				return;
			}

			// if element should be stuck at container top
			if (containerRect.top > headerHeight) {
				this._disableSticky(0);
			}
		}
	};


/***/ },

/***/ 475:
/***/ function(module, exports) {

	'use strict';

	// stores promises of loaded scripts by URLs
	var loadedUrls = [];

	/**
	name: Sync script loader
	type: ui
	desc: >
		Component for synchronous loading of JavaScript files.
		Could be used as component extension or as separate service.

		For case of component extension returns Promise on Ready,
		so, parent component should be ready only when script loaded.

		Example:

			<div data-component="Common::sync-script-loader" data-script-url="//tags.tiqcdn.com/utag/telenor/main/dev/utag.js"></div>
	*/
	module.exports = {
		initialize: function() {
			if (loadedUrls[this.$options.scriptUrl]) { // has cached instance
				this.deferred = loadedUrls[this.$options.scriptUrl];
			} else {
				this.deferred = this.loadScriptSynchronously();
			}
		},

		ready: function() {
			return this.deferred;
		},

		loadScriptSynchronously: function(url) {
			var dfd = this.$tools.q.defer();
			var ready;
			var script;

			url = url || this.$options.scriptUrl;

			if (!url) {
				return;
			}

			this.isReady = false;

			loadedUrls[url] = dfd;

			dfd.finally(function() {
				this.isReady = true;
			}.bind(this));

			if (this.isReady) {
				dfd.resolve();
			} else {
				script = document.createElement('script');
				ready = false;

				script.type = 'text/javascript';
				script.src = url;

				script.onload = script.onreadystatechange = function() {
					if (!ready && (!this.readyState || this.readyState == 'complete')) {
						ready = true;
						dfd.resolve();
					}
				};

				document.body.appendChild(script);
			}

			return dfd.promise();
		}
	};


/***/ },

/***/ 476:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		ready: function() {
			this.$tools.data.get(this.$options.throttleStateAction)
				.then(this._throttleStateDone.bind(this));
		},

		_throttleStateDone: function(data) {
			this.toggle(Boolean(data.success));
		}
	};


/***/ },

/***/ 477:
/***/ function(module, exports) {

	'use strict';

	/**
		name: Trim
		type: ui
		desc: Make sure `input` has neither leading nor following spaces
		events:
			updateValue: fires when `input` value has been trimed
	*/
	module.exports = {
		events: {
			'typeWatch $this': '_onTypeWatch'
		},

		initialize: function() {
			this._onTypeWatch(null, this.$el.val());
		},

		_onTypeWatch: function(event, value) {
			var trimValue = value.replace(/^\s+|\s+$/g, '');
			if(value != trimValue) {
				this.$el.val(trimValue);
			}
		}
	};


/***/ }

});