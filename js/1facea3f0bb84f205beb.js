webpackJsonp([4],{

/***/ 366:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(367);


/***/ },

/***/ 367:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./account/nemid/index.js": 368,
		"./nemid/index.js": 369,
		"./pos/barcode/autosubmit-form/index.js": 370,
		"./pos/barcode/force/index.js": 371,
		"./pos/barcode/index.js": 373,
		"./pos/basket/index.js": 374,
		"./pos/connected/index.js": 375,
		"./pos/external-url/index.js": 376,
		"./pos/print-url/index.js": 377,
		"./pos/service.js": 372
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
	webpackContext.id = 367;


/***/ },

/***/ 368:
/***/ function(module, exports) {

	'use strict';

	/**
	name: ResendSmsCode
	type: Controller
	desc: >
		Works with Common::nemid component and sends its data to the server
		Requires sub-element $nemIdFrame to have an option nextActionUrl
	events:
		submitSuccess: Is triggered when NemId data were successfully stored on the server
	*/
	module.exports = {
		events: {
			'changeResponseAndSubmit $nemIdFrame': '_handleChangeResponseAndSubmit'
		},

		_handleChangeResponseAndSubmit: function(event, eventData) {
			var requestData = this.$tools.util.extend(this.$components.extraDataForm.serialize(), eventData);

			this.$tools.data.post(this.$components.nemIdFrame.$options.nextActionUrl, requestData)
				.then(this._nemIdComplete.bind(this));
		},

		_nemIdComplete: function(response) {
			this.$events.trigger('submitSuccess', response);
		}
	};


/***/ },

/***/ 369:
/***/ function(module, exports) {

	'use strict';

	module.exports = {

		initialize: function() {
			this._onNemIDMessageHandler = this._onNemIDMessage.bind(this);
			this.$tools.events.unlisten(window, 'message');
			this.$tools.events.listen(window, 'message', this._onNemIDMessageHandler);
			this.$el[0].src = this.$options.src;
		},

		_onNemIDMessage: function(originalEvent) {
			var message;
			var nemIdLink = this.$options.nemIdLink;
			var event = originalEvent.originalEvent;
			var htmlParameters;
			var postMessage;
			var win;

			if (event.origin !== nemIdLink) {
				// TODO: redirect to final step?
				this.$tools.logger.error('Received message from unexpected origin : ' + originalEvent.origin);
				return;
			}

			try {
				message = JSON.parse(event.data);
			} catch (exc) {
				message = {};
				this.$tools.logger.error(exc);
			}

			if (message.command === 'SendParameters') {
				htmlParameters = this.$options.json;
				if (htmlParameters) {
					postMessage = {
						command: 'parameters',
						content: JSON.stringify(htmlParameters)
					};

					win = document.getElementById('nemid_iframe').contentWindow;
					win.postMessage(JSON.stringify(postMessage), nemIdLink);
				}
			}

			if (message.command === 'changeResponseAndSubmit') {
				this.$events.trigger('changeResponseAndSubmit', {
					nemIdResponse: message.content
				});
			}
		}
	};


/***/ },

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
			}
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

/***/ 374:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PosService = __webpack_require__(372);

	module.exports = {
		events: {
			'click .button--accept': '_onCancel'
		},

		initialize: function() {
			this._posService = new PosService();
			this._posService.setId(this.$options.name + this.$options._ref);
			this._payBasket();
		},

		_subscribe: function() {
			this._posService.subscribe(PosService.Method.payBasket,
				this._onPaymentStatusSuccess.bind(this),
				this._onPaymentStatusError.bind(this)
			);
		},

		_onPaymentStatusSuccess: function(data) {
			this._log('success', data);
			this._sendPaymentStatus(data);
		},

		_onPaymentStatusError: function(errors) {
			errors.map(this.$tools.logger.error.bind(this.$tools.logger));
			this._log('error', errors);
		},

		_payBasket: function() {
			this.$tools.data.get(this.$options.basketUrl, {
				basketId: this.$options.basketId,
				oseTransactionId: this.$options.oseTransactionId
			})
				.then(function(res) {
					if (res.success) {
						this._sendToPos(res.data);
					}
				}.bind(this))

				.catch(function(res) {
					this.log('get error', res);
				}.bind(this));
		},

		_sendPaymentStatus: function(paymentStatus) {
			this._sendToServer(!!paymentStatus.status);
		},

		_onCancel: function() {
			this._sendToServer(false);
		},

		_sendToServer: function(status) {
			var el = this.$components.hiddenForm.$el[0];

			this._log('_sendToServer', data);

			el.elements.BasketId.value = this.$options.basketId;
			el.elements['PosPaymentStatus.Status'].value = status;
			el.elements['PosPaymentStatus.OseTransactionId'].value = this.$options.oseTransactionId;

			this.$components.hiddenForm.$options.preventSubmit = false;
			this.$components.hiddenForm.submit();

			this._log('', 'Please wait');
		},

		_sendToPos: function(order) {
			this._log('sendToPos', order);

			this._subscribe();
			this._posService.send(PosService.Type.Request, PosService.Method.payBasket, order);

			this._log('', 'Please wait');
		},

		_log: function(name, data) {
			if (true) {
				this._posService.log(name, data);
			}
		}
	};


/***/ },

/***/ 375:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PosService = __webpack_require__(372);

	/**
	name: Checks connection to POS application
	events:
	    posConnected: emitted on successful connected to pos
	*/
	module.exports = {
		initialize: function() {
			this._posService = new PosService();
			this._posService.isConnected()
				.then(function(data) {
					this.$events.trigger('posConnected', data);
				}.bind(this));
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


/***/ }

});