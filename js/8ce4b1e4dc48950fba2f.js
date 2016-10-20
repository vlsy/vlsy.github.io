webpackJsonp([6],{

/***/ 380:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(381);


/***/ },

/***/ 381:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./seamless-basket/delivery/index.js": 382,
		"./seamless-basket/identification/identification-flow/index.js": 384,
		"./seamless-basket/identification/index.js": 385,
		"./seamless-basket/identification/nemid/index.js": 386,
		"./seamless-basket/identification/type-selection/index.js": 387,
		"./seamless-basket/joint-poa-page/index.js": 388,
		"./seamless-basket/number-configuration/index.js": 389,
		"./seamless-basket/number-configuration/subscription/common.js": 390,
		"./seamless-basket/number-configuration/subscription/device-only/index.js": 391,
		"./seamless-basket/number-configuration/subscription/index.js": 392,
		"./seamless-basket/number-configuration/subscription/keep-number/index.js": 393,
		"./seamless-basket/number-configuration/subscription/port-number/index.js": 394,
		"./seamless-basket/number-configuration/subscription/port-number/sim-guide/index.js": 395
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
	webpackContext.id = 381;


/***/ },

/***/ 382:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var core = __webpack_require__(383);

	module.exports = app.core.util.extend({}, core, {
		ready: function() {
			core.ready.call(this);

			if (this.$components.homeAddressForm) {
				this._enableEmptyFields(this.$components.homeAddressForm, false);
			}

			if (this.$components.alternativeAddressForm) {
				this._enableEmptyFields(this.$components.alternativeAddressForm, true);
			}
		}
	});


/***/ },

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

/***/ 384:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit $identificationForm': '_submitForm',
			'proceed $nemId': '_proceedNemId',
			'retry $nemId': '_retryNemId'
		},

		_submitForm: function() {
			var form = this.$components.identificationForm;
			var btn = form.$components.proceed;

			var action = form.$el.prop('action') || btn.$options.action;
			form.$options.url = this.$tools.globalConfigs('TN.config.shop.basket.PersonalInformationBlock.services.' + action, null);


			btn.activityIndicator();


			// this.backendModel is set on processSuccess method
			this.whenNextStep(
				submitAsync.call(form, this.backendModel || {}) // TODO: change to form.submitAsync() after .NET refactoring (response.data.model)
			)
				.catch(btn.resetLoading.bind(btn));

			this.backendModel = null;

			function submitAsync(model) {
				var ajaxMethod = this.$tools.data[(this.$el.prop('method') || 'post').toLowerCase()];
				var data = this.$tools.util.extend({}, model, this.serialize());
				return ajaxMethod(this.getUrl(), data);
			}
		},

		_proceedNemId: function(event, opt) {
			this.whenNextStep(this.$tools.data.post(opt.url, opt.data))
				.then(opt.callback);
		},

		_retryNemId: function(event, opt) {
			var url = this.$tools.globalConfigs('TN.config.shop.basket.PersonalInformationBlock.services.' + opt.url, null);

			this.whenNextStep(this.$tools.data.get(url));
		},

		whenNextStep: function(promise) {
			this._hideError();
			return promise
				.then(function(response) {
					if (response.data && response.data.model) {
						this.backendModel = response.data.model;
					}
					if (!response.success) {
						return this.$tools.q.reject(response);
					}
					if(response.data.html) {
						this.html(response.data.html)
							.then(this.$tools.q.resolve.bind(null, response), this.$tools.q.reject.bind(null, response));
					}
					return response;
				}.bind(this))
				.then(this.processSuccess.bind(this))
				.catch(this.processError.bind(this));
		},

		processError: function(response) {
			if (response.errorMessages && response.errorMessages.length) {
				this._showError(response.errorMessages[0]);
			} else if (response.validationErrors && response.validationErrors.length) {
				this._showError(response.validationErrors[0]);
			}
			return this.$tools.q.reject(response);
		},

		_showError: function(error) {
			this.$components.errorMsg.error(error);
			this.$components.errorMsg.open();
		},

		_hideError: function() {
			this.$components.errorMsg.close();
		},

		processSuccess: function(response) {
			var data = response.data;
			if (data.finishBasketFlow === true) {
			} else if (data.loginFlowCompleted === true) {
				this.$events.trigger('loginFlowCompleted');
			} else if (data.authStateChanged === true) {

			}

			return response;
		}
	};


/***/ },

/***/ 385:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'changeIdentificationType $typeSelection': '_changeIdentificationType',
			'loginFlowCompleted $identificationFlow': '_nextStep'
		},
		_changeIdentificationType: function(event, url) {
			this.$components.identificationFlow.whenNextStep(this.$tools.data.get(url));
		},
		_nextStep: function() {
			this.$elements.proceedForm[0].submit();
		}
	};



/***/ },

/***/ 386:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click $retryNemId': '_retryNemId',
			'changeResponseAndSubmit $nemIdFrame': '_changeResponseAndSubmit'
		},
		_retryNemId: function() {
			this.$events.trigger('retry', {
				url: this.$components.retryNemId.$el.data('action')
			});
		},
		_changeResponseAndSubmit: function(event, eventData) {
			this.$events.trigger('busy-mode-on');
			this.$events.trigger('proceed', {
				url: this.$options.nextActionUrl,
				data: eventData,
				callback: function() {
					this.$events.trigger('busy-mode-off');
				}.bind(this)
			});
		}
	};


/***/ },

/***/ 387:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'changed $$types': '_onTypeChange'
		},
		disable: function() {
			this.$components.types
				.forEach(function(type) {
					if (!type.isChecked()) {
						type.disable();
					}
				});
		},
		_onTypeChange: function() {
			var checked = this.$components.types.filter(function(type) {
				return type.isChecked();
			}).pop();
			var url = checked.$options.url;

			this.$events.trigger('changeIdentificationType', url);
		}
	};


/***/ },

/***/ 388:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		authorityCheckbox: '#authority'
	};

	/**
	 name: Joint POA page for B2B
	 type: controller
	 desc: Handles POA form on a separate page where user can add data for all the subscriptions
	 options:
	 action: Specifies URL endpoint to submit POA data.
	 */
	module.exports = {
		events: {
			'click $submitPoa': '_onPoaSubmit',
			'click $skipPoa': '_onSkipCardMessageShow',
			'click #authority': '_onTermsClick'
		},

		ready: function() {
			// Fix for modal-box events
			this.$components.skipCardMessage.$components.skipPoa.$events.on('click $this', this._onSkipCardForm.bind(this));
		},

		_onSkipCardMessageShow: function() {
			if (this.$components.skipCardMessage) {
				this.$components.skipCardMessage.show();
			}
		},

		_onSkipCardForm: function() {
			var poaFormData = this._getPoaFormData();
			this.$components.skipCardMessage.hide();
			this._onSendPoaData(this.$options.skipUrl, poaFormData);
		},

		_onPoaSubmit: function() {
			var infoFormValid = this.$components.infoForm.valid();
			var cardFormValid;

			if (this.$components.cardForm) {
				cardFormValid = this.$components.cardForm.valid();
			}

			this.$components.savePoaError.close();

			if (!infoFormValid) {
				return;
			}

			if (this.$components.cardForm && !cardFormValid) {
				this._onSkipCardMessageShow();
				return;
			}

			this._onSendPoaData(this.$options.submitUrl);
		},

		_onSendPoaData: function(actionUrl) {
			var $authorityCheckbox = this.$el.find(SELECTORS.authorityCheckbox);
			var dfd;

			if ($authorityCheckbox.is(':checked')) {
				this.$components.authorityWarning.close();

				dfd = this.$components.submitPoa.activityIndicator();
				if (actionUrl) {
					this.$tools.data.post(actionUrl, this._getPoaFormData())
						.then(function(response) {
							if (response.success) {
								if (this.$options.redirectUrl) {
									this.$tools.util.redirect(this.$options.redirectUrl);
								} else if (this.$components.success) {
									this._showSuccess();
								}
							} else {
								this.$components.savePoaError.open();
								dfd.reject();
							}
						}.bind(this))

						.catch(function() {
							dfd.reject();
						});
				}
			} else {
				this.$components.authorityWarning.open();
			}
		},

		_getPoaFormData: function() {
			var formData = {};
			var cardData = this.$components.cardForm ? this._getCardFormData() : {};
			if (this.$options.location) {
				formData.location = this.$options.location;
			}

			return this.$tools.util.extend(
				formData,
				cardData,
				this.$components.infoForm.serialize(),
				this.$components.optionsForm.serialize()
			);
		},

		_getCardFormData: function() {
			var numbersData = {
				Items: []
			};

			this.$components.cardForm.$components.number.forEach(function(number) {
				var numberData = {
					BasketItemId: number.$options.basketItemId,
					Number: number.$options.number,
					SimCardNumber: number.$el.find('[data-alias="sim-number"]').val(),
					CustomerNumber: number.$el.find('[data-alias="customer-number"]').val(),
					PoaId: number.$options.poaId,
					Type: number.$options.type,
					OrderCode: number.$options.orderCode,
					CurrentOperator: number.$options.currentOperator
				};
				numbersData.Items.push(numberData);
			});

			return numbersData;
		},

		_onTermsClick: function(event) {
			var $tcCheckbox = event.$el;

			if ($tcCheckbox.is(':checked')) {
				this.$components.submitPoa.enable();
				this.$components.authorityWarning.close();
				if (this.$components.skipPoa) {
					this.$components.skipPoa.enable();
				}
			} else {
				this.$components.submitPoa.disable();
				this.$components.authorityWarning.open();
				if (this.$components.skipPoa) {
					this.$components.skipPoa.disable();
				}
			}
		},

		_showSuccess: function() {
			this.hide('.poa-block');
			this.$components.success.show();
		}
	};


/***/ },

/***/ 389:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Number Selection & Port-in
	type: controller
	desc: Handles Number Selection page
	options:
		clearUrl: Specifies URL for reseting all subscriptions.
	subscriptions:
		checkReady: Check if all subscriptions are submitted.
		resetAll: Fires for reseting all subscriptions.
	*/
	module.exports = {
		events: {
			'click $resetAll': '_checkResetAll',
			'click $numberConfigurationProceed': 'onProceed',
			'checkReady $$subscription': '_setButtonsState',
			'setNumber $$subscription': '_setSubscriptionNumber',
			'resetNumber $$subscription': '_resetSubscriptionNumber',
			'getNewNumbers $$subscription $$numberOptions $numbers': '_getNewNumbers'
		},

		ready: function() {
			this._setButtonsState();

			// Fix for modal-box events
			this.$components.resetAllMessage.$components.resetAll.$events.on('click $this', this._resetAll.bind(this));
		},

		_getNewNumbers: function(event, data) {
			var component = event.data.component;

			component.getNumbersRequest(data.params);
		},

		_resetSubscriptionNumber: function(event, data) {
			var subscriptionComponent = event.data.component;
			var clearData = data.component.getResetOptions();

			this.$tools.util.extend(clearData, data.formsData);
			this.$tools.data.post(data.component.$options.clearUrl, clearData)
				.then(function(response) {
					if (response.success) {
						subscriptionComponent.resetSubscription();
						if (subscriptionComponent.$components.retailForm) {
							subscriptionComponent._resetRetailForm();
						}
						if (subscriptionComponent.$components.simForm) {
							subscriptionComponent._resetSimForm();
						}
					} else {
						data.component._showError(response, 'saveNumbersError');
					}
				})

				.finally(function() {
					data.btnReset && data.btnReset.resetLoading();
				});
		},

		_setSubscriptionNumber: function(event, data) {
			var component = event.data.component;
			var imeiNumber = data.optionData.data.Imei;
			var serializedTokenForm = this.$components.tokenForm.serialize();

			this.$tools.util.extend(data.optionData.data, serializedTokenForm);
			if (imeiNumber && this._hasDublicatedImei(imeiNumber)) {
				component.showImeiError(data);
			} else {
				component.setSubscription(data.optionData, data.optionData.data, data.event.data.component);
			}
		},

		_hasDublicatedImei: function(imeiNumber) {
			var isDublicated = false;
			this.$components.subscription.forEach(function(subscription) {
				var subscriptionImei = subscription.getImeiNumber();
				if (subscription.isAssigned() && subscriptionImei === imeiNumber) {
					isDublicated = true;
				}
			});
			return isDublicated;
		},

		_checkResetAll: function(event) {
			event.preventDefault();

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

		onProceed: function(event) {
			var proceedButton = event.data.component;

			event.preventDefault();

			proceedButton.activityIndicator();
			proceedButton.$el.closest('form')[0].submit();
		},

		_sendResetAllRequest: function(btnAllReset) {
			this.$tools.data.post(this.$options.clearUrl)
				.then(function(response) {
					if (response.success) {
						this.$components.subscription.forEach(function(subscription) {
							subscription.resetSubscription();
						});
					} else {
						this._showError(response);
					}
				}.bind(this))

				.catch(function() {
					btnAllReset.resetLoading();
				});
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

		_getAssignedSubscriptions: function() {
			return this.$components.subscription.filter(function(subscription) {
				return subscription.$options.assigned;
			});
		},

		_checkAllSubscriptionsAssigned: function() {
			var assignedSubscriptions = this._getAssignedSubscriptions();

			return this.$components.subscription.length === assignedSubscriptions.length;
		},

		_checkAnySubscriptionAssigned: function() {
			var assignedSubscriptions = this._getAssignedSubscriptions();

			return assignedSubscriptions.length > 0;
		},

		_setButtonsState: function() {
			this.$components.numberConfigurationProceed.$el.prop('disabled', !this._checkAllSubscriptionsAssigned());
			this.$components.resetAll.$el.prop('disabled', !this._checkAnySubscriptionAssigned());
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

/***/ 391:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		checked: 'checked'
	};
	/**
	name: Number Selection & Port-in for device only
	type: controller
	desc: Handles option for customer without subscription
	options:
		id: Basket item id.
		submitUrl: Specifies URL for submitting imei number.
		clearUrl: Specifies URL for removing imei number.
	 **/

	module.exports = {
		events: {
			'click $resetButton': '_onResetNumber',
			'click $buttonSubmit': '_onSaveNumber'
		},
		/**
		 desc: Fires to reset option for device only customers.
		 */
		resetNumber: function(event) {
			this.$events.trigger('subscriptionUnLock');
			this.$el.removeClass(CLASSES.checked);
			this.$components.buttonSubmit.enable();
			this.$components.buttonSubmit.resetLoading();
			if(event) {
				event.preventDefault();
			}
		},
		/**
		 desc: Fires to get options for reset query.
		 */
		getResetOptions: function() {
			return {};
		},
		/**
		 desc: Fires to get alias of error message.
		 */
		getErrorAlias: function() {
			return 'saveNumbersError';
		},
		_onSaveNumber: function(event) {
			var btnDeferred = this.$components.buttonSubmit.activityIndicator();

			this._hideError();

			this.$events.trigger('setNumber', {
				url: this.$options.submitUrl,
				data: {},
				btnDeferred: btnDeferred,
				successCb: function(response) {
					this.number = response.imeiNumber || '';
				}.bind(this),
				errorCb: function(response) {
					this._showError(response, this.getErrorAlias());
				}.bind(this)
			});

			event.preventDefault();
		},
		_onResetNumber: function(event) {
			this.$events.trigger('resetNumber');

			event.preventDefault();
		},
		_showError: function(error, alias) {
			this.$events.trigger('showError', {error: error, alias: alias});
		},
		_hideError: function() {
			this.$events.trigger('hideError');
		},
		_getNumber: function() {
			return this.number || '';
		}
	};


/***/ },

/***/ 392:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		assigned: 'assigned',
		checked: 'checked',
		required: 'form-item--required'
	};
	var SELECTORS = {
		imeiField: '[data-alias="imei-number"]',
		imeiLabel: '[data-alias="checked-imei-number"]',
		simNumber: '[data-alias="sim-number"]',
		simLabel: '[data-alias="checked-sim-number"]',
		checked: '[data-alias="checked-number"]',
		simField: '[data-selector="simField"]'
	};
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
			'setNumber $$numberOptions': '_setNumber',
			'subscriptionUnLock $$numberOptions': '_subscriptionUnLock',
			'showReset $$numberOptions': '_showReset',
			'resetNumber $$numberOptions': '_resetNumber',
			'showError $$numberOptions': '_showError',
			'hideError $$numberOptions': '_hideError',
			'show $$numberOptions $numberCollapse': '_resetSimFormValidation'
		},
		/**
		 desc: Fires to get Imei number of subscription.
		 */
		getImeiNumber: function() {
			return this.$components.retailForm.$el.find(SELECTORS.imeiField).val() || '';
		},
		/**
		 desc: Fires to get if data is posted and saved.
		 */
		isAssigned: function() {
			return this.$options.assigned;
		},
		/**
		 desc: Fires to send and save subscription data.
		 */
		setSubscription: function(data, formsData, component) {
			this.$tools.data.post(data.url, formsData)
				.then(function(response) {
					if (response.success) {
						data.successCb && data.successCb(response);
						data.btnDeferred && data.btnDeferred.resolve();
						component.$el.addClass(CLASSES.checked);
						component.$components.buttonSubmit.disable();
						this._subscriptionLock();
						if (this.$components.retailForm) {
							this._setRetailRestore();
						}
						if (this.$components.simForm) {
							this._setSimRestore();
						}
					} else {
						data.errorCb && data.errorCb(response);
						data.btnDeferred && data.btnDeferred.reject();
					}
				}.bind(this))

				.catch(function() {
					data.btnDeferred && data.btnDeferred.reject();
				});
		},
		/**
		 desc: Fires to reset method of each selection type.
		 */
		resetSubscription: function() {
			this.$components.numberOptions.forEach(function(numberOption) {
				if (!numberOption.$options.disabled) {
					numberOption.resetNumber();
				}
			});
		},
		/**
		 desc: Fires to show Imei dublicate error
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

		_subscriptionLock: function() {
			this.$el.addClass(CLASSES.assigned);
			this.$options.assigned = true;
			this.$events.trigger('checkReady');
		},
		_subscriptionUnLock: function() {
			this.$el.removeClass(CLASSES.assigned);
			this.$options.assigned = false;
			this.$events.trigger('checkReady');
		},
		_setNumber: function(event, data) {
			var isFormsValid = this._validateForms();

			if (!isFormsValid) {
				data.btnDeferred && data.btnDeferred.reject();
				return false;
			}

			this.$tools.util.extend(data.data, this._getFormsData());

			this.$events.trigger('setNumber', {
				event: event,
				optionData: data
			});
		},

		_validateForms: function() {
			var isValidForms = true;
			if (this.$components.retailForm && !this.$components.retailForm.valid()) {
				isValidForms = false;
			}
			if (this.$components.simForm) {
				if (this.$options.type !== 'existingNumber' && !this.$components.simForm.valid()) {
					isValidForms = false;
				}
			}
			return isValidForms;
		},

		_getFormsData: function() {
			var formsData = {};

			if (this.$components.retailForm) {
				this.$tools.util.extend(formsData, this.$components.retailForm.serialize());
			}
			if (this.$components.simForm) {
				this.$tools.util.extend(formsData, this.$components.simForm.serialize());
			}

			return formsData;
		},

		_getImeiData: function() {
			var imeiData = {};

			if (this.$components.retailForm && this.$components.retailForm.$options.deviceId) {
				imeiData.Device = {
					BasketItemId: this.$components.retailForm.$options.deviceId
				};
			}
			return imeiData;
		},

		_setRetailRestore: function() {
			var imeiNumber = this.getImeiNumber();

			this.$components.retailForm.$el.find(SELECTORS.imeiLabel).text(imeiNumber);
		},

		_resetRetailForm: function() {
			this.$components.retailForm.$el.find(SELECTORS.imeiField).val('');
			this.$components.retailForm.$el.find(SELECTORS.imeiLabel).text('');
		},

		_setSimRestore: function() {
			var simNumber = this.$components.simForm.$el.find(SELECTORS.simNumber).val() || '';

			this.$components.simForm.$el.find(SELECTORS.simLabel).text(simNumber);
		},

		_resetSimForm: function() {
			this.$components.simForm.$el.find(SELECTORS.simNumber).val('');
			this.$components.simForm.$el.find(SELECTORS.simLabel).text('');
		},

		_showReset: function(event) {
			var component = event.data.component;

			component.$components.wantForm.reset();
			component.$components.wantForm.$el.find('select').trigger('change');
			component.$components.wantForm.enable();
			component.$el.removeClass(CLASSES.checked);
			component.$el.find(SELECTORS.checked).text('');
			component.$components.buttonSubmit.enable();
			component.$components.buttonSubmit.resetLoading();
			this._subscriptionUnLock();
		},

		_resetNumber: function(event) {
			var component = event.data.component;
			var btnReset = component.$components.resetButton;

			btnReset.setLoading();
			this._sendResetRequest(component, btnReset);
		},
		_sendResetRequest: function(component, btnReset) {
			this.$events.trigger('resetNumber', {
				component: component,
				btnReset: btnReset,
				formsData: this._getFormsData()
			});
		},
		_resetSimFormValidation: function(event) {
			var component = event.data.component;
			this.$options.type = component.$options.type;

			if (this.$components.simForm) {
				this.$el.find(SELECTORS.simField).toggleClass(CLASSES.required, this.$options.type !== 'existingNumber');
				this.$components.simForm.$events.trigger('formReset');
			}
		}
	};


/***/ },

/***/ 393:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		checked: '[data-alias="checked-number"]'
	};
	/**
	name: Number Selection & Port-in for existing customer
	type: controller
	desc: Handles option for existing customers
	options:
		url: Specifies URL for submitting number.
		penaltyUrl: Specifies URL for numbers with penalty.
		id: Basket item id.
	**/

	module.exports = {
		events: {
			'click .reset-number': '_onResetNumber',
			'click .check-number': '_onSaveNumber',
			'change .secret-field': '_onChangeSecret'
		},

		/**
		 desc: Fires to reset option for existing customers.
		 */
		resetNumber: function(event) {
			this.$components.numberForm.reset();
			this._resetOptions();
			this.$events.trigger('showReset');

			if(event) {
				event.preventDefault();
			}
		},

		/**
		 desc: Fires to get options for reset query.
		 */
		getResetOptions: function() {
			return {
				Subscription: {
					BasketItemId: this.$options.subscriptionId,
					Number: this._getNumber(),
					Mode: this.$options.mode
				}
			};
		},

		/**
		 desc: Fires to get alias of error message.
		 */
		getErrorAlias: function() {
			return 'saveNumbersError';
		},

		_onChangeSecret: function(event) {
			this.$events.trigger('setHiddenNumberState', event.$el[0]);
		},

		_onSaveNumber: function(event) {
			var numberValid = this.$components.numberForm.valid();
			var url = this.$options.url;
			var btnDeferred;

			event.preventDefault();

			if (!numberValid) {
				return;
			}

			if (this.currentNumber === this._getNumber()) {
				if (this._isPenalty) {
					url = this.$options.penaltyUrl;
				}
			} else {
				this._resetOptions();
			}

			this._hideError();

			btnDeferred = this.$components.buttonSubmit.activityIndicator();

			this.$events.trigger('setNumber', {
				url: url,
				data: this._getData(),
				btnDeferred: btnDeferred,
				successCb: function() {
					this._resetOptions();
					this.$el.find(SELECTORS.checked).text(this._getNumber());
					this.$components.numberCollapse.hide();
					this.$components.wantForm.disable();
				}.bind(this),
				errorCb: function(response) {
					if (response.data && response.data.status) {
						this._processErrorResponse(response);
					} else {
						this._showError(response, this.getErrorAlias());
					}
				}.bind(this)
			});
		},

		_onResetNumber: function(event) {
			this.$events.trigger('resetNumber');

			event.preventDefault();
		},

		_processErrorResponse: function(response) {
			var warning = {penalty : 3, subsidy : 4};
			if (response.data && response.data.status === warning.penalty) {
				this._showError(response, 'penaltyWarning');
				this._isPenalty = true;
				this.currentNumber = this._getNumber();
			} else if (response.data && response.data.status === warning.subsidy) {
				this._showError(response, 'subsidyWarning');
			} else {
				this._showError(response, this.getErrorAlias());
			}
		},

		_resetOptions: function() {
			this._isPenalty = false;
			this.currentNumber = null;
			this.$components.penaltyWarning.close();
		},

		_showError: function(error, alias) {
			this.$events.trigger('showError', {error: error, alias: alias});
		},

		_hideError: function() {
			this.$events.trigger('hideError');
		},

		_getData: function() {
			var serializedNumberForm = this.$components.numberForm.serialize();
			var	serializedWantForm = this.$components.wantForm.serialize();
			var $hiddenNumber = this.$el.find('.hidden-field');

			var data = {
				Subscription: {
					BasketItemId: this.$options.subscriptionId,
					IsHidden: $hiddenNumber.is(':checked'),
					OfferId: this.$options.offerId
				}
			};

			this.$tools.util.extend(data.Subscription, serializedWantForm);
			this.$tools.util.extend(data, serializedNumberForm);

			return data;
		},

		_getNumber: function() {
			return this.$el.find('[id ^= "existNumberField"]').val();
		}
	};


/***/ },

/***/ 394:
/***/ function(module, exports) {

	'use strict';

	var CLASSES = {
		checked: 'checked',
		disabled: 'disabled',
		isPoaDisabled: '.is-poa-disabled'
	};

	var SELECTORS = {
		checked: '[data-alias="checked-number"]'
	};

	/**
	name: Number Selection & Port-in for port-in number
	type: controller
	desc: Handles option for port-in number
	options:
		url: Specifies URL for submitting number.
		id: Basket item id.
	*/
	module.exports = {
		events: {
			'click .reset-number': '_onResetNumber',
			'click .check-number': '_onSaveNumber',
			'change .secret-field': '_onChangeSecret',
			'change [name="IsAuthorityProvided"]': '_onAuthorityChange'
		},

		ready: function() {
			if (this.$components.poaForm) {
				this.$tools.data.pubsub.subscribe('autocomplete.changed', this._onZipAutocomplete.bind(this));
			}
		},

		/**
		 desc: Fires to reset option for port-in numbers.
		 */
		resetNumber: function(event) {
			if (event) {
				event.preventDefault();
			}

			this.$components.numberForm.reset();

			if (this.$components.poaForm) {
				this.$components.poaForm.enable();
				this.$components.poaForm.reset();
				this.$components.poaForm.$components.fillPoaNow.$el.prop('checked', false);
				this.$components.poaForm.$components.fillPoaLater.$el.prop('checked', true);
				this.$components.poaForm.$components.fillPoaLater.toggle();
				this.$components.poaForm.$el.find(CLASSES.isPoaDisabled).prop('disabled', true);
			}

			if (this.$components.terminationForm) {
				this.$components.terminationForm.enable();
				this.$components.terminationForm.reset();
			}

			this.$events.trigger('showReset');
		},

		/**
		 desc: Fires to get options for reset query.
		 */
		getResetOptions: function() {
			return {
				Subscription: {
					BasketItemId: this.$options.subscriptionId,
					Number: this._getNumber(),
					Mode: this.$options.mode
				}
			};
		},

		/**
		 desc: Fires to get alias of error message.
		 */
		getErrorAlias: function() {
			return 'saveNumbersError';
		},

		_onChangeSecret: function(event) {
			this.$events.trigger('setHiddenNumberState', event.$el[0]);
		},

		_onSaveNumber: function(event) {
			var numberValid = this.$components.numberForm.valid();
			var btnDeferred;

			if (!numberValid) {
				return false;
			}

			if (this.$components.poaForm && !this._isPoaPostponed() && !this.$components.poaForm.valid()) {
				return false;
			}

			this._hideError();

			btnDeferred = this.$components.buttonSubmit.activityIndicator();

			this.$events.trigger('setNumber', {
				url: this.$options.url,
				data: this._getData(),
				btnDeferred: btnDeferred,
				successCb: function() {
					if (this.$components.poaForm) {
						this.$components.poaForm.disable();
					}
					if (this.$components.terminationForm) {
						this.$components.terminationForm.disable();
					}
					this.$el.find(SELECTORS.checked).text(this._getNumber());
					this.$components.numberCollapse.hide();
					this.$components.wantForm.disable();
				}.bind(this),
				errorCb: function(response) {
					this._showError(response, this.getErrorAlias());
				}.bind(this)
			});

			event.preventDefault();
		},

		_onResetNumber: function(event) {
			this.$events.trigger('resetNumber');

			event.preventDefault();
		},

		_showError: function(error, alias) {
			this.$events.trigger('showError', {error: error, alias: alias});
		},

		_hideError: function() {
			this.$events.trigger('hideError');
		},

		_isPoaPostponed: function() {
			return this.$el.find('[name ^= "IsPoaPostponed"]:checked').val() === 'true';
		},

		_getNumber: function() {
			return this.$el.find('[id ^= "portNumberField"]').val();
		},

		_getData: function() {
			var serializedNumberForm = this.$components.numberForm.serialize();
			var serializedWantForm = this.$components.wantForm.serialize();
			var $hiddenNumber = this.$el.find('.hidden-field');

			var data = {
				Subscription: {
					BasketItemId: this.$options.subscriptionId,
					IsHidden: $hiddenNumber.is(':checked'),
					PoaData: {}
				}
			};

			this.$tools.util.extend(data.Subscription, serializedWantForm);
			this.$tools.util.extend(data, serializedNumberForm);

			if (this.$components.terminationForm) {
				this.$tools.util.extend(data.Subscription.PoaData, this.$components.terminationForm.serialize());
			}

			if (this.$components.poaForm) {
				this.$tools.util.extend(data, this.$components.poaForm.serialize());
			}

			return data;
		},

		_onAuthorityChange: function(event) {
			var isAuthorityChecked = event.$el[0].checked;

			if (isAuthorityChecked) {
				this.$components.buttonSubmit.enable();
			} else {
				this.$components.buttonSubmit.disable();
			}
		},

		_onZipAutocomplete: function(_msg, obj) {
			// process only Zip autocomplete change
			if (obj.alias === 'zip') {
				this.$components.poaForm.$components.city.$el.val(obj.label.replace(/^\d+/, ''));
			}
		},

		_trackDatepicker: function() {
			var showDataPicker = this.$components.terminationForm.$components.terminationModes.filter(function(component) {
				return component.$el[0].checked && component.$options.showPicker;
			}).length;
			this.$components.terminationForm.$components.datepicker[0].toggleDisabled(!!showDataPicker);
		}
	};


/***/ },

/***/ 395:
/***/ function(module, exports) {

	'use strict';

	var SELECTORS = {
		selectOS: '.number-guide__os',
		osGuide: '[data-os]'
	};
	var CLASSES = {
		activeClass: 'is-active'
	};
	/**
	name: Sim guide
	type: controller
	desc: Handles guides displaying for different OS
	 */
	module.exports = {
		initialize: function() {
			this.selectOSBlock = this.$el.find(SELECTORS.selectOS);
			this.guideBlocks = this.$el.find(SELECTORS.osGuide);
		},
		events: {
			'click .number-guide__os .number-guide__os__link': '_openOSGuide',
			'click [data-os] .back-to-os-select__link': '_backToOSSelect'
		},
		_openOSGuide: function(event) {
			var os = event.$el.data('os');

			event.preventDefault();

			this.guideBlocks.removeClass(CLASSES.activeClass);
			this.guideBlocks.filter('[data-os="' + os + '"]').addClass(CLASSES.activeClass);
			this.selectOSBlock.removeClass(CLASSES.activeClass);
		},
		_backToOSSelect: function(event) {
			event.preventDefault();

			this.guideBlocks.removeClass(CLASSES.activeClass);
			this.selectOSBlock.addClass(CLASSES.activeClass);
		}
	};


/***/ }

});