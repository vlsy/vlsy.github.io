webpackJsonp([7],{

/***/ 396:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(397);


/***/ },

/***/ 397:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./newsletter/index.js": 398
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
	webpackContext.id = 397;


/***/ },

/***/ 398:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click .newsLetterCall': 'clickSend',
			'click .message__close': 'closeSection'
		},

		initialize: function() {
			this.$errorSection = this.$el.find('.errorSection');
			this.$messageSection = this.$el.find('.messageSection');
			this.$messageDivClass = this.$errorSection.find('div.message');
			this.$messageDivSpanClass = this.$errorSection.find('div div span');
		},

		initReadMore: function() {
		},

		collectFormData: function() {

			var returnVal;
			var CampaignName = 'Newsletter';
			var Channel = 'telenordk';
			var CurrentDate = new Date();
			var getMonthStr = (CurrentDate.getMonth() + 1).toString();
			var getDateStr = CurrentDate.getDate().toString();
			var getHoursStr = CurrentDate.getHours().toString();
			var getMinutesStr = CurrentDate.getMinutes().toString();
			var CurrentDateStr;

			var Name = this.$el.find('.contactName').val() != undefined
	                ? this.$el.find('.contactName').val()
	                : '';
			var EMail = this.$el.find('.contactEmail').val() != undefined
	                ? this.$el.find('.contactEmail').val()
	                : '';
			var Mobile = this.$el.find('.contactMobile').val() != undefined
	                ? this.$el.find('.contactMobile').val()
	                : '';
			var Usage = this.$el.find('.contactUsage:checked').val() ? 1 : 0;
			var UsageText = this.$el.find('input.contactUsage').parent().parent().text().trim() != undefined
	                ? this.$el.find('input.contactUsage').parent().parent().text().trim()
	                : '';
			var Permission = this.$el.find('.permission:checked').val() ? 1 : 0;
			var PermissionText = this.$el.find('input.permission').parent().parent().text().trim() != undefined
	                ? this.$el.find('input.permission').parent().parent().text().trim()
	                : '';
			var Address = this.$el.find('.contactAddress').val() != undefined
	                ? this.$el.find('.contactAddress').val()
	                : '';
			var Post = this.$el.find('.contactPost').val() != undefined
	                ? this.$el.find('.contactPost').val()
	                : '';
			var By = this.$el.find('.contactBy').val() != undefined
	                ? this.$el.find('.contactBy').val()
	                : '';
			var AlreadyTelenorCustomerSelected = this.$el.find('.alreadyTelenorCustomer:checked').val() ? 1 : 0;
			var YourInterestInTelenor = this.$el.find('input[name=YourInterestInTelenor]:checked').parent().text().trim() != undefined
	                ? this.$el.find('input[name=YourInterestInTelenor]:checked').parent().text().trim()
	                : '';
			// var OwnProductType = this.$el.find('.ownProductTypeMobile:checked').val() != undefined
	     //            ? this.$el.find('.ownProductTypeMobile:checked').val()
	     //                ? 'M'
	     //                : 'B'
	     //            : '';
			var OwnProductType = this.$el.find('.ownProductTypeBredband:checked').val() != undefined
	                ? this.$el.find('.ownProductTypeBredband:checked').val()
	                    ? 'B'
	                    : 'M'
	                : '';

			if (getMonthStr.length <= 1) {
				getMonthStr = '0' + getMonthStr;
			}

			if (getDateStr.length <= 1) {
				getDateStr = '0' + getDateStr;
			}

			if (getHoursStr.length <= 1) {
				getHoursStr = '0' + getHoursStr;
			}

			if (getMinutesStr.length <= 1) {
				getMinutesStr = '0' + getMinutesStr;
			}

			CurrentDateStr = CurrentDate.getFullYear() + '/' + getMonthStr + '/' + getDateStr + ' ' + getHoursStr + ':' + getMinutesStr + ':11';

			returnVal = 'https://nl2.telenor.dk/tln/Private_Newsletter_WS_SaveSignup.jssp?';
			returnVal += 'name=' + Name + '&email=' + EMail + '&phone=' + Mobile + '&callback=?&permission=' + Permission + '&permissionText=' + PermissionText + '&usage=' + Usage + '&usageText=' + UsageText + '&address=' + Address;
			returnVal += '&post=' + Post + '&by=' + By + '&customer=' + AlreadyTelenorCustomerSelected + '&interest=' + YourInterestInTelenor + '&productType=' + OwnProductType;
			returnVal += '&campaignName=' + CampaignName + '&channel=' + Channel + '&date=' + CurrentDateStr;

			return returnVal;
		},

		_validateForms: function() {
			var required = this.$el.find('.permission:checked').is(':checked');
			var valid = this.$extensions.form.valid();

			return valid && required;
		},

		newLetterCall: function(event) {

			var tmpThis = this;

			this.$tools.data.getJSON(event, function(result) {

				if (result.status.code == 0) {
					this.successfullySend(tmpThis);
				} else {
					this.errorResult(tmpThis);
				}
			}.bind(this));

		},

		clickSend: function() {
			var parametersCollection = this.collectFormData();
			var showingMessage = '';

			this.$messageDivClass.removeClass('message--error');
			this.$messageDivClass.removeClass('message--success');
			this.$messageDivClass.addClass('message--error');

			this.$messageDivSpanClass.removeClass('icon-check-grey');
			this.$messageDivSpanClass.removeClass('icon-reject');
			this.$messageDivSpanClass.addClass('icon-reject');

			this.$errorSection.hide().addClass('js-hidden');


			this.$el.find('.Error2Message').each(function() {
				showingMessage = this.defaultValue;
			});

			if (this._validateForms()) {
				this.newLetterCall(parametersCollection);
			} else {
				this.showMessage(showingMessage);
			}
		},
		showMessage: function(msg) {
			this.$messageSection.html('<p>' + msg + '</p>');
			this.$errorSection.show().removeClass('js-hidden');
			this.$errorSection.find('.message').show().removeClass('is-hidden');
		},


		closeSection: function() {
			this.$errorSection.hide().addClass('js-hidden');
		},

		successfullySend : function(){
			var showingMessage = '';

			this.$messageDivClass.addClass('message--success');
			this.$messageDivClass.removeClass('message--error');
			this.$messageDivSpanClass.addClass('icon-check-grey');
			this.$messageDivSpanClass.removeClass('icon-reject');

			this.$el.find('.OkMessage').each(function() {
				showingMessage = this.defaultValue;
			});

			this.showMessage(showingMessage);
		},

		errorResult: function() {
			var showingMessage = '';

			this.$messageDivClass.addClass('message--error');
			this.$messageDivClass.removeClass('message--success');
			this.$messageDivSpanClass.addClass('icon-reject');
			this.$messageDivSpanClass.removeClass('icon-check-grey');

			this.$el.find('.Error1Message').each(function() {
				showingMessage = this.defaultValue;
			});

			this.showMessage(showingMessage);
		}
	};



/***/ }

});