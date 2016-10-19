webpackJsonp([12],{

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

/***/ 746:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(747);


/***/ },

/***/ 747:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./b2bleads/index.js": 748,
		"./booktime/index.js": 749,
		"./callmeback/index.js": 751,
		"./callmeback/later/index.js": 752,
		"./countryinfo/index.js": 753,
		"./family-calculator/index.js": 754,
		"./iframe/index.js": 757,
		"./js-link/index.js": 758,
		"./map/index.js": 759,
		"./map/size-adjustment/index.js": 760,
		"./now-interact-notifier/formatter/index.js": 761,
		"./now-interact-notifier/index.js": 762,
		"./operational-status/base.js": 763,
		"./operational-status/choice-group/index.js": 764,
		"./operational-status/subscribe/index.js": 765,
		"./operational-status/unsubscribe/index.js": 766,
		"./press-release-subscribe/index.js": 767,
		"./press-release/index.js": 768,
		"./product-sign-me-up/OSE/index.js": 769,
		"./read-more/index.js": 770,
		"./survey-block/index.js": 771
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
	webpackContext.id = 747;


/***/ },

/***/ 748:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {

			this.$dataSelector = {
				email: 'input[name=email]',
				phone: 'input[name=phone]',
				contactPerson: 'input[name=contactPerson]',
				leadCustomer: 'input[name=leadCustomer]',
				taxNo: 'input[name=taxNo]',
				customerExpectation: 'textarea[name=customerExpectation]',
				zipCode: 'input[name=zipCode]',
				contactLastName: 'input[name=contactLastName]',
				contactFirstName: 'input[name=contactFirstName]',
				numberOfSubs: 'input[name=numberOfSubs]',
				contactTitle: 'input[name=contactTitle]',
				customerRegistNo: 'input[name=ContactFirstName]',
				leadType: 'leadType',
				contactRole: 'contactRole',
				responseList: 'responseList'
			};

			this.$lead = {
				'state': '',
				'source': '',
				'salesLeadId': '',
				'zipCode': '',
				'customerId': '',
				'doneCode': '',
				'email': '',
				'leadName': '',
				'sourceObjectName': '',
				'leadType': '',
				'sourceObjectId': '',
				'taxNo': '',
				'leadCustomerGroup': '',
				'customerExpectation': '',
				'operatorId': '',
				'responseList': '',
				'extInfo': {
					'ext2': '',
					'ext7': '',
					'ext8': '',
					'ext9': '',
					'ext10': '',
					'ext1': '',
					'ext3': '',
					'ext4': '',
					'ext5': '',
					'ext6': ''
				},
				'leadSource': '',
				'customerRegistNo': '',
				'contactRole': '',
				'contactFirstName': '',
				'contactLastName': '',
				'closeComment': '',
				'forecasting': '',
				'leadCustomer': '',
				'contactTitle': '',
				'numberOfSubs': '',
				'contactPerson': '',
				'leadState': '',
				'phone': ''
			};

		},
		events: {
			'click .leads-button': 'submit'
		},

		_validateForms: function() {
			var valid = true;

			$form = this.$el.parent().find('form');
			$form.validate();
			valid = valid && $form.valid();

			return valid;
		},

		submit: function() {
			var lead;
			var createLeadPromise;

			if (this._validateForms()) {
				lead = this._getData();

				createLeadPromise = this._CreateLead(lead);

				createLeadPromise.then(function(response) {

					if (response) {
						if (response.salesLeadId) {
							this.$el.find('.b2b-leads-form').hide();
							this.$el.find('.b2b-leads-response').show();
						} else {
							this.$el.find('.b2b-leads-form').hide();
							this.$el.find('.b2b-leads-error').show();
						}
					}

				}.bind(this));
			}
		},

		_getData: function() {

			var dataSelector = this.$dataSelector;

			//OPTIONS
			this.$lead.leadName = this.$options.leadname;
			this.$lead.leadSource = this.$options.leadsource;
			this.$lead.operatorId = this.$options.agentid;

			//INPUT FIELD
			this.$lead.email = this.$el.find(dataSelector.email) ? this.$el.find(dataSelector.email).val() : '';
			this.$lead.phone = this.$el.find(dataSelector.phone) ? this.$el.find(dataSelector.phone).val() : '';
			this.$lead.contactPerson = this.$el.find(dataSelector.contactPerson) ? this.$el.find(dataSelector.contactPerson).val() : '';
			this.$lead.leadCustomer = this.$el.find(dataSelector.leadCustomer) ? this.$el.find(dataSelector.leadCustomer).val() : '';
			this.$lead.customerExpectation = this.$el.find(dataSelector.customerExpectation) ? this.$el.find(dataSelector.customerExpectation).val() : '';
			this.$lead.taxNo = this.$el.find(dataSelector.taxNo) ? this.$el.find(dataSelector.taxNo).val() : '';
			this.$lead.zipCode = this.$el.find(dataSelector.zipCode) ? this.$el.find(dataSelector.zipCode).val() : '';
			this.$lead.contactLastName = this.$el.find(dataSelector.contactLastName) ? this.$el.find(dataSelector.contactLastName).val() : '';
			this.$lead.contactFirstName = this.$el.find(dataSelector.contactFirstName) ? this.$el.find(dataSelector.contactFirstName).val() : '';
			this.$lead.customerRegistNo = this.$el.find(dataSelector.customerRegistNo) ? this.$el.find(dataSelector.customerRegistNo).val() : '';
			this.$lead.contactTitle = this.$el.find(dataSelector.contactTitle) ? this.$el.find(dataSelector.contactTitle).val() : '';
			this.$lead.numberOfSubs = this.$el.find(dataSelector.numberOfSubs) ? this.$el.find(dataSelector.numberOfSubs).val() : '';

			if ((!this.$lead.contactFirstName && !this.$lead.contactLastName) && this.$lead.contactPerson) {
				this.$lead.contactFirstName = this.$lead.contactPerson.substr(0, this.$lead.contactPerson.indexOf(' '));
				this.$lead.contactLastName = this.$lead.contactPerson.substr(this.$lead.contactPerson.indexOf(' ') + 1);
			}

			//DROPDOWN
			this.$lead.leadType = this._getDropdownValue(dataSelector.leadType);
			this.$lead.contactRole = this._getDropdownValue(dataSelector.contactRole);
			this.$lead.responseList = this._getDropdownValue(dataSelector.responseList);

			this.$lead.source = window.location.href ? window.location.href : document.URL;

			return this.$lead;
		},

		_getDropdownValue: function(id) {
			var temp = document.getElementById(id);
			if (temp) {
				return temp.value != 0 ? temp.value : null;
			}

			return '';
		},

		_CreateLead: function(Templead) {

			var LeadUrl = this.$options.url;
			var ajaxConfig = ({
				type: 'POST',
				url: LeadUrl,
				data: { lead: Templead }
			});

			return this.$tools.data.ajax(ajaxConfig);
		}

	};


/***/ },

/***/ 749:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var filterPrivat = true;
	var sendDataToPHP = {
		'info': {}, // contains message to user(mail) and images url in the mail.
		'bruger': {},
		'butik': {},
		'emner': []
	};
	var shops = [];
	var zips = []; // component global variable (parsed in init)

	module.exports = {
		initialize: function() {
			console.log('init booktime', this);
	        //Static properties from episerver editor (set in the html component tag as data-attribute)
			shops = this.$options.shop.replace(/'/g, '"');
			shops = JSON.parse(shops);
			zips = this.$options.zip.replace(/'/g, '"');
			zips = JSON.parse(zips);
			this.liShopTemplate = this.$tools.template.parse(__webpack_require__(750));
		},
		ready: function() {
			this.checkboxchange();
		},
		events: {
			'click #businessChoosen': 'checkboxchange',
			'click #privateChoosen': 'checkboxchange',
			'keyup .search-shops': 'search',
			'click .button': 'validate'
		},
		_RenderShops: function(ShopsFound, SearchZip) {
			var el = this.$el;
			var index;
			var storeResultsNo = 5;
			var shopWeekendOpen;
			var openhours;
			var liHtml;
			var open;
			var close;
			var index2;

			var sortedShops = ShopsFound.map(function(aShop) {
				return {
					'zipProximity': Math.abs(SearchZip - aShop.zip),
					'store': aShop
				};
			});

	        //Sort shop array
			sortedShops = sortedShops.sort(function(_a, _b) {
				return parseFloat(_a.zipProximity) - parseFloat(_b.zipProximity);
			});

	        // TODO: Add standard error logic, and remove validation from content::booktime
			for (index = 0; index < storeResultsNo; index++) {
				shopWeekendOpen = '';
				openhours = sortedShops[index].store.openhours;
	            //concatinate all opening day into one string:
				for (index2 = 0; index2 < openhours.length; index2++) {
	                //remove :00 from timestamps like 18:00
					open = openhours[index2].open.replace(/:00/, '');
					close = openhours[index2].close.replace(/:00/, '');
					shopWeekendOpen += openhours[index2].day + ' ' + open + ' - ' + close;
					if (index2 < openhours.length - 1) {
						shopWeekendOpen += ', ';
					}
				}
				liHtml = this.liShopTemplate({
					index: index,
					name: sortedShops[i].store.Name,
					address: sortedShops[i].store.street + ' ' + sortedShops[i].store.number + ', ' + sortedShops[i].store.zip + ' ' + sortedShops[i].store.city,
					openhours: shopWeekendOpen
				});

				el.find('.nearestStores').append(liHtml);
			}

			el.find('.nearestStores').wrapInner('<ul class="form-item form-row"></ul>');
		},
		_TimeBook: function() {
			var el = this.$el;
	        //Id of shop choosen
			var id = el.find('form input[name=shopsOptions]:checked').val();

			var Customer = el.find('form input[name=CustomerOrNot]:checked').val();
			var customerType = el.find('form input[name=privateBusiness]:checked').val();

	        //User info
			sendDataToPHP.bruger.navn = el.find('form input[name=nameInput]').val();
			sendDataToPHP.bruger.telefon = el.find('form input[name=phoneInput]').val();
			sendDataToPHP.bruger.email = el.find('form input[name=emailInput]').val();
			sendDataToPHP.bruger.alleredeKunde = Customer;
			sendDataToPHP.bruger.kundetype = customerType;
			sendDataToPHP.bruger.kommentar = el.find('form input[name=commentField]').val();
	        //Store info
			id = parseInt(id);
			sendDataToPHP.butik.email = shops[id].email;
			sendDataToPHP.butik.telefon = shops[id].phone;
			sendDataToPHP.butik.navn = shops[id].Name;
			sendDataToPHP.butik.by = shops[id].city;
			sendDataToPHP.butik.postnr = shops[id].zip;

	        //Topic
			el.find('form input[name=option1]').each(function(index, checkbox) {
				if (checkbox.checked) {
					sendDataToPHP.emner.push(checkbox.value);
				}
			});
			el.find('form input[name=option2]').each(function(index, checkbox) {
				if (checkbox.checked) {
					sendDataToPHP.emner.push(checkbox.value);
				}
			});
	        //Info for mail to user from the service:
			sendDataToPHP.info.message = this.$options.mailmessage; //from episerverv editor
			sendDataToPHP.info.imageurl = this.$options.mailimage; //from episerverv editor


			this.$tools.data.ajax({
				url: this.$options.url,
				data: { json: sendDataToPHP },
				dataType: 'jsonp',
				success: function() {
					// TODO: tell user there are an error (The php server can return "Error: some error"!)
					el.find('.accepted-button').attr('disabled', 'disabled');
					el.find('.container-booktime').hide();
					el.find('.booktime-success').show();
				},
				error: function() {
					// TODO: tell user there are an error
					sendDataToPHP = [];
				}
			});
		},

		checkboxchange: function() {
			var el = this.$el;

			if (el.find('#businessChoosen:checked').length > 0) { //business is selected
				el.find('.businessOptions').removeClass('js-hidden');
				el.find('.privateOptions').addClass('js-hidden');
	            //clear private check boxes (use "prop" not "attr", attr wil only change the html/text, not is js value!)
				el.find('.privateOptions input[type=checkbox]').prop('checked', false);

				filterPrivat = false;
	            //Filter found shops to private
				if (el.find('.search-shops').val() != '') {
					this.search();
				}

			} else {
				el.find('.privateOptions').removeClass('js-hidden');
				el.find('.businessOptions').addClass('js-hidden');
	            //clear business check boxes (use "prop" not "attr", attr wil only change the text, not is js value!)
				el.find('.businessOptions input[type=checkbox]').prop('checked', false);

				filterPrivat = true;
	            //Filter found shops to business

				if (el.find('.search-shops').val() != '') {
					this.search();
				}
			}
		},
		search: function() {
			var el = this.$el;
			var options = this.$options;
			var result;

	        //Users search text:
			var searchValue = el.find('.search-shops').val();

	        //Filter for found shops:
			var ShopsFound = [];

	        //If erhverv eller privat
			if (filterPrivat) {

				this.$tools.util.each(shops, function(index) {
					if ((shops[index].shoptype === '1') && ((shops[index].type === '2') || (shops[index].type === '3'))) {
						ShopsFound.push(shops[index]);
					}
				});

			} else {
				this.$tools.util.each(shops, function(index) {
					if (shops[index].type === '1' || shops[index].type === '3') {
						ShopsFound.push(shops[index]);
					}
				});
			}

	        //Clear div
			el.find('.nearestStores').show().html('');

			if (searchValue !== '' && /^[0-9]{4}$/.test(searchValue)) {  //Zipcode

				result = zips.filter(function(dataZip) {
					return dataZip.zip == searchValue;
				});

				if (result.length === 0) {

					el.find('.nearestStores').html(options.noshopsfound); //+ "undefined tal"

				} else {

					this._RenderShops(ShopsFound, result[0].zip);

				}


			} else if (/\D/.test(searchValue) && searchValue.length > 2) { //City name
				searchValue = searchValue.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();

				result = zips.filter(function(item) {
					return item.bynavn.toLowerCase().indexOf(searchValue) > -1;
				});

				if (!result.length) {

	                //NEED STYLING
					el.find('.nearestStores').html(options.noshopsfound); // + "undefined tekst"

				} else {
					this._RenderShops(ShopsFound, result[0].zip);
				}
			} else {
	            //not (4 digits) and not (more than 2 sign, where one of them are not a number):
				el.find('.nearestStores').hide();
			}
		},
		validate: function(event) {
			var el = this.$el;
			var validated = true;

			var selected = el.find('form input[name=shopsOptions]:checked').val();
			var name = el.find('form input[name=nameInput]').val();
			var phone = el.find('form input[name=phoneInput]').val();
			var email = el.find('form input[name=emailInput]').val();
			var option1 = el.find('form input[name=option1]:checked').val();
			var option2 = el.find('form input[name=option2]:checked').val();

			event.preventDefault();
			if (!selected) {
	            //TODO gice user a message about "not seslected any shop..."
				validated = false;
			}

			if (!name) {
	            //Error class
				el.find('form input[name=nameInput]').parent().addClass('form-item--error');
				validated = false;
			} else {
				el.find('form input[name=nameInput]').parent().removeClass('form-item--error');
			}

			if (!phone || !(/^\d{8}$/.test(phone) || /^\d{2} \d{2} \d{2} \d{2}$/.test(phone))) {
				el.find('form input[name=phoneInput]').parent().addClass('form-item--error');
				validated = false;
			} else {
				el.find('form input[name=phoneInput]').parent().removeClass('form-item--error');
			}

			if (!email || !(/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(email))) {
				el.find('form input[name=emailInput]').parent().addClass('form-item--error');
				validated = false;
			} else {
				el.find('form input[name=emailInput]').parent().removeClass('form-item--error');
			}

			if (!(option1 || option2)) {
	            //var topicError = el.find('#ErrorCheckbox').val();
				if (el.find('.errorCheckbox').length) {
					el.find('.errorCheckbox').remove();
				}

				validated = false;
			} else {
				el.find('.message').remove();
			}
	        //If all tests passes
			if (validated) {
				this._TimeBook();
			}
		}
	};













/***/ },

/***/ 750:
/***/ function(module, exports) {

	module.exports = "<li class=\"form-radio shopid\">\n    <input type=\"radio\" class=\"shop\" id=\"shop<%= index %>\" name=\"shopsOptions\" value=\"<%= index %>\"/>\n    <label class=\"text--med\" for=\"shop<%= index %>\">\n        <strong><%= name %></strong><br />\n        <span class=\"text-size--13\">\n            <%= address %><br />\n            <%= openhours %>\n        </span>\n    </label>\n</li>\n"

/***/ },

/***/ 751:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tools = __webpack_require__(323);
	var base = __webpack_require__(630);

	/**
	name: Callmeback
	type: ui
	desc: Form for asap callback to customer
	options:
		booktimeslotUrl: String. Url where the form will be submited
	 */
	module.exports = tools.util.extend(true, {}, base, {
		events: {
			'submit $ticketForm': '_onSubmit'
		},

		_onSubmit: function(event){
			var request = this.$tools.data.post(this.$options.booktimeslotUrl, this.$components.ticketForm.serialize());

			event.preventDefault();

			request.then(this._onSubmitSuccess.bind(this))
					.catch(this._onSubmitFail.bind(this));
		},

		_onSubmitSuccess: function(response){
			if (response.success) {
				this._showWarn(response.data);
				this.$components.errorMessage.close();
				this.$components.successMessage.show();
				this.$components.ticketForm.hide();
				this.submitAI && this.submitAI.resolve();
				this._submittedState = true;

				return;
			}

			this._onSubmitFail(response);
		},

		_showWarn: function(data){
			if(data && data.warning && data.warning.length) {
				this.$components.warnMessage.alert(data.warning).open();
			}
		},

		_onSubmitFail: function(response){
			if(response.data.clearForm) {
				this.$components.ticketForm.reset();
			}

			this.$components.errorMessage.error(response.data.errorMessage).open();
			this.submitAI && this.submitAI.reject();
		}
	});


/***/ },

/***/ 752:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var tools = __webpack_require__(323);
	var base = __webpack_require__(751);

	var SELECTORS = {
		timeSlotInput: '[data-selector=timeSlotid]'
	};

	/**
	name: Callmeback/later
	type: ui
	desc: Form for delayed callback to customer
	options:
		booktimeslotUrl: String. Url where the form will be submited
		datesUrl: String. Url which returns available dates
		timeRangesUrl: String. Url which returns avalaible time ranges for the specified date
	 */
	module.exports = tools.util.extend(true, {}, base, {
		ready: function() {
			this.form = this.$components.ticketForm;
			this.dateSelect = this.form.$components.dateSelect;
			this.timeSelect = this.form.$components.timeSelect;
			this.$timeSlotId = this.$el.find(SELECTORS.timeSlotInput);

			this.dateSelect.disable();
			this.timeSelect.disable();
		},

		events:{
			'submit $ticketForm': '_onSubmit',
			'change [data-selector=dateSelect]': '_getTimeRanges',
			'change [data-selector=timeSelect]': '_onTimeChange',
			'onChoiceChange $this': '_onChoiceChange'
		},

		_getDates: function(){
			this.dateSelect.disable();
			this.timeSelect.disable();
			this.$tools.data.post(this.$options.datesUrl, this.form.serialize())
					.then(this._onSuccessGetDates.bind(this));
		},

		_getTimeRanges: function(){
			this.timeSelect.disable();
			this.$tools.data.post(this.$options.timeRangesUrl, this.form.serialize())
					.then(this._onSuccessGetTimeRanges.bind(this));
		},

		_onChoiceChange: function(event, data){
			if(data.requestType && data.productCategory){
				this._setCommonFields(data);
				this._getDates();
			}
		},

		_onSuccessGetDates: function(response){
			if(!response || !response.data){
				return;
			}

			this._fillUpSelect(this.dateSelect, response.data);
		},

		_onSuccessGetTimeRanges: function(response){
			if(!response || !response.data){
				return;
			}

			this._fillUpSelect(this.timeSelect, response.data);
		},

		_fillUpSelect: function(selectComponent, html){
			selectComponent.enable();
			selectComponent.resetSelect();
			selectComponent.$select.find('option:gt(0)').remove();
			selectComponent.$select.append(html);
		},

		_onTimeChange: function(){
			this.$timeSlotId.val(this.timeSelect.getCurrentOption().data('timeslotid'));
		}
	});


/***/ },

/***/ 753:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* eslint-disable */
	var $ = __webpack_require__(2);

	module.exports = {
		initialize: function() {
		},

		events: {
			'change .countriesddl': 'changeCountry'
		},

		feedTable: function(tableobj) {
			var $ident = $('.' + tableobj.id);
			$ident.html('');
			$.each([tableobj.header, tableobj.data], function(_index, _obj){
				$.each(_obj, function(index, row){
					var line = '';
					$.each(row, function(key, value){
						if(0 === _index){
							line += '<th>' + value + '</th>';
						} else {
							if(value == 'True' || value == 'true'){
								line += '<td><input type="checkbox" checked="checked" disabled="disabled" /></td>';
							} else if(value == 'False' || value == 'false'){
								line += '<td><input type="checkbox" disabled="disabled" /></td>';
							} else {
								line += '<td>' + value + '</td>';
							}
						}
					});

					line = '<tr>' + line + '</tr>';

					if(0 === _index){
						line = '<thead>' + line + '</thead><tbody>';
					}

					$ident.append(line);
				});
			});

			$ident.append('</tbody>');
		},

		initReadMore: function()  {
		},


		changeCountry: function(){

			var selectedOpt  = this.$el.find('select option:selected').val();
			var selectedContSelector = "input[name^='" + selectedOpt + "']";
			var selectedCont = '';

			if(selectedOpt == '0'){
				$('.here_table').hide();
			} else {
				$('.here_table').show();
			}

			var extMarkersArray = [];
			var operatorsArray = [];

			var index;
			var fieldsNames = ['CaptionText', 'Zone', 'LandCode', 'Notes', 'Name', 'FourG', 'ThreeG', 'Gprs', 'MultiFunctional'];
			for (index = 0; index < fieldsNames.length; index++) {
				selectedContSelector = "input[name*='" + selectedOpt + "'][name*='" + fieldsNames[index]  + "']";

				selectedCont = '';
				var  itemName = fieldsNames[index];
				this.$el.find(selectedContSelector).each(function(index){
					selectedCont = this.defaultValue;

					if(itemName == 'CaptionText'){
						var itemNamed = {CaptionText: selectedCont};
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'Zone'){
						var itemNamed = {Zone: selectedCont};
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'LandCode'){
						var itemNamed = {LandCode: selectedCont};
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'Notes'){
						var itemNamed = {Notes: selectedCont};
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'Name'){
						var itemNamed = {Name: selectedCont};
						operatorsArray.push(itemNamed);
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'FourG'){
						var itemNamed = {FourG: selectedCont};
						operatorsArray.push(itemNamed);
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'ThreeG'){
						var itemNamed = {ThreeG: selectedCont};
						operatorsArray.push(itemNamed);
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'Gprs'){
						var itemNamed = {Gprs: selectedCont};
						operatorsArray.push(itemNamed);
						extMarkersArray.push(itemNamed);
					}

					if(itemName == 'MultiFunctional'){
						var itemNamed = {MultiFunctional: selectedCont};
						operatorsArray.push(itemNamed);
						extMarkersArray.push(itemNamed);
					}

				});
			}

			var empty = '';
			var zoneTable = 'Zone: ' + extMarkersArray[1].Zone;
			var landTable = 'Landekode: ' + extMarkersArray[2].LandCode;
			var operatorTable = 'Operatør';
			var gprsTable = 'GPRS';
			var threeGTable = '3G';
			var fourGTable = '4G';
			var multiFunctionalTable = 'Multiplanfunktionalitet (Camel)';

			var t = {
				'id': 'here_table',
				'header':[{'a': extMarkersArray[0].CaptionText, 'b' : empty, 'c' : empty, 'd': empty, 'e': empty, 'f': empty}],
				'data': [{'a': zoneTable,  'b' : empty,  'c' :landTable, 'd': empty, 'e': empty, 'f': empty },
	            {'a':  operatorTable,  'b' : empty,  'c' :gprsTable, 'd': threeGTable, 'e': fourGTable, 'f': multiFunctionalTable }]
			};

			var selectorNumberOperators = "input[name*='" + selectedOpt + "'][name*='Gprs']";
			var numberOperators = this.$el.find(selectorNumberOperators).length;
			fieldsNames = ['Name', 'FourG', 'ThreeG', 'Gprs', 'MultiFunctional'];
			var tmp = {'a': undefined,  'b' : empty,  'c' : undefined, 'd': undefined, 'e': undefined, 'f': undefined };
			for (var oprIndex = 0; oprIndex < numberOperators; oprIndex++) {
				for (var oprsArrIndex = 0; oprsArrIndex < operatorsArray.length; oprsArrIndex++) {
					for (index = 0; index < fieldsNames.length; index++) {

						var  itemName = fieldsNames[index];

						if(itemName == 'Name'){
							if(operatorsArray[oprsArrIndex].Name != undefined){
								if(tmp.a == undefined){
									tmp.a = operatorsArray[oprsArrIndex].Name;
									operatorsArray[oprsArrIndex].Name = undefined;
								}
							}
						}

						if(itemName == 'FourG'){
							if(operatorsArray[oprsArrIndex].FourG != undefined){
								if(tmp.e == undefined){
									tmp.e = operatorsArray[oprsArrIndex].FourG;
									operatorsArray[oprsArrIndex].FourG = undefined;
								}
							}
						}

						if(itemName == 'ThreeG'){
							if(operatorsArray[oprsArrIndex].ThreeG != undefined){
								if(tmp.d == undefined){
									tmp.d = operatorsArray[oprsArrIndex].ThreeG;
									operatorsArray[oprsArrIndex].ThreeG = undefined;
								}
							}
						}

						if(itemName == 'Gprs'){
							if(operatorsArray[oprsArrIndex].Gprs != undefined){
								if(tmp.c == undefined){
									tmp.c = operatorsArray[oprsArrIndex].Gprs;
									operatorsArray[oprsArrIndex].Gprs = undefined;
								}
							}
						}

						if(itemName == 'MultiFunctional'){
							if(operatorsArray[oprsArrIndex].MultiFunctional != undefined){
								if(tmp.f == undefined){
									tmp.f = operatorsArray[oprsArrIndex].MultiFunctional;
									operatorsArray[oprsArrIndex].MultiFunctional = undefined;
								}
							}
						}
					}

					if(tmp.a != undefined && tmp.b != undefined && tmp.c != undefined && tmp.d != undefined && tmp.e != undefined && tmp.f != undefined){
						t.data.push(tmp);
						tmp = {'a': undefined,  'b' : empty,  'c' : undefined, 'd': undefined, 'e': undefined, 'f': undefined };
					}
				}
			}

			this.feedTable(t);
		}
	};



/***/ },

/***/ 754:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var FAMILY_DISCOUNT_50 = 50;
	var FAMILY_DISCOUNT_100 = 100;

	var DUMMY_DATA = {
		FAMILY_DISCOUNTS: [0, FAMILY_DISCOUNT_50, FAMILY_DISCOUNT_100],
		SUBSCRIPTION_MIN_DURATION: 6,
		SAVES_FACTOR: 12,
		FAMILY_SUBSCRIPTIONS: [
			{
				PRICE: 179,
				CAPACITY: 5
			},
			{
				PRICE: 199,
				CAPACITY: 10
			},
			{
				PRICE: 299,
				CAPACITY: 30
			}
		]
	};

	var selectors = {
		info: '#family-info',
		prices: '#family-prices',
		total: '#family-total',
		select: '#family-select',
		radio: '.family-subscription'
	};

	var selectedSubscriptions = [0, 0, 0, 0, 0];

	module.exports = {
		events: {
			'change #family-select': 'onFamilyCountChange',
			'change .family-subscription': 'onSubscriptionChange',
			'click .add-new-family-member': 'addNewFamilyMember'
		},
		initialize: function() {
			this.$templates = {
				info: this.$tools.template.parse(__webpack_require__(755)),
				prices: this.$tools.template.parse(__webpack_require__(756))
			};

			this.$infoBox = this.$el.find(selectors.info);
			this.$pricesBox = this.$el.find(selectors.prices);
			this.$totalBox = this.$el.find(selectors.total);
			this.$select = this.$el.find(selectors.select);
			this.$radios = null;
		},
		ready: function() {

		},
		onFamilyCountChange: function() {
			this.buildInfoRows();
			this.buildPriceRows();
		},
		onSubscriptionChange: function() {
			this.buildPriceRows();
		},
		addNewFamilyMember: function(event) {
			event.preventDefault();
			this._addNewFamilyMember();
			this.onFamilyCountChange();
		},
		_addNewFamilyMember: function() {
			var count = parseInt(this.$select.val(), 10) || 1;
			count++;
			this.$select.val(count.toString()).change();
		},
		_getFamilySubscriptionsByLevel: function(level) { // NOT USED IF HARDCODED PRICES!!!!!(Talk with ANITA)
			var POINT_LEVEL = 3;
			if (level > POINT_LEVEL) {
				level = POINT_LEVEL;
			}

			return this.$options.subscriptions.filter(function(subscription) {
				return subscription.FamilyLevel === level;
			}).map(function(subscription) {
				return {
					PRICE: subscription.MonthlyPay,
					CAPACITY: subscription.Gigabytes,
					ID: subscription.ProductId
				};
			});
		},
		buildInfoRows: function() {
			var count = this.$select.val();
			var info = { infoRows: [] };
			var index;
			var rowData = {};
			var familyType;

			this.$el.find('.family-calculator-hideable').hide();

			for (index = 0; index < count; index++) {
				familyType = Math.min(index, DUMMY_DATA.FAMILY_DISCOUNTS.length - 1);

				rowData.discount = DUMMY_DATA.FAMILY_DISCOUNTS[familyType];
				rowData.subscriptions = DUMMY_DATA.FAMILY_SUBSCRIPTIONS;
				rowData.subscriptionsNew = this._getFamilySubscriptionsByLevel(index + 1);

				rowData.selected = selectedSubscriptions[index];

				info.infoRows.push(rowData);
			}

			this.$infoBox
					.empty()
					.append(this.$templates.info({ info: info, placeholders: this.$options.placeholders }));

			this.$radios = this.$el.find(selectors.radio);
		},

		_getSubscriptionObject: function(productid, sub) {
			var filteredSubsciptions = sub.filter(function(subscription) {
				return subscription.ProductId === productid;
			});

			return filteredSubsciptions.length > 0 ? filteredSubsciptions[0] : null;
		},

		_getFamilySubscriptionsByLevelObject: function(level) {
			var POINT_LEVEL = 3;
			if (level > POINT_LEVEL) {
				level = POINT_LEVEL;
			}

			return this.$options.subscriptions.filter(function(subscription) {
				return subscription.FamilyLevel == level;
			});
		},

		buildPriceRows: function() {
			var count = this.$select.val();
			var prices = { priceRows: [], total: 0, totalDiscount: 0, yearSaves: 0 };
			var index;
			var html;
			var rowData = {};
			var familyType;
			var subscriptionType;
			var subscriptions;
			var subscription;

			for (index = 0; index < count; index++) {

				familyType = Math.min(index, DUMMY_DATA.FAMILY_DISCOUNTS.length - 1);
				subscriptionType = this.$radios.filter('[name="family-group-' + (index + 1) + '"]:checked').val();

				selectedSubscriptions[index] = subscriptionType;

				subscriptions = this._getFamilySubscriptionsByLevelObject(index + 1);
				subscription = this._getSubscriptionObject(subscriptionType, subscriptions);

				rowData.discount = DUMMY_DATA.FAMILY_DISCOUNTS[familyType];

				rowData.capacity = subscription.Gigabytes;
				rowData.price = subscription.MonthlyPay;
				rowData.priceForDuration = (subscription.MonthlyPay * subscription.BindingPeriode);

				prices.priceRows.push(rowData);
				prices.total += rowData.price;
				prices.totalDiscount += rowData.discount;
				prices.yearSaves += rowData.discount * DUMMY_DATA.SAVES_FACTOR;
			}

			prices.total = this.formatPrice(prices.total);
			prices.totalDiscount = this.formatPrice(prices.totalDiscount);
			prices.yearSaves = this.formatPrice(prices.yearSaves);

			html = this.$templates.prices({ prices: prices, placeholders: this.$options.placeholders });

			this.$pricesBox
					.empty()
					.append(html);
		},

		formatPrice: function(price, separator) { // TODO Price Format
			var GROUP = 3;
			var result;
			separator = separator || '.';

			price = price.toString();
			price = price.split('').reverse().join('');
			result = price.replace(/(\d{3})/ig, function($1) { return $1 + separator; });
			result = result.split('');

			if (price.length % GROUP == 0) {
				result.pop();
			}

			return result.reverse().join('');
		}
	};


/***/ },

/***/ 755:
/***/ function(module, exports) {

	module.exports = "<% var i,j; for(i = 0; i < info.infoRows.length; i++) { %>\n  <% with(info.infoRows[i]) { %>\n<div class=\"price-holder\">\n\t<div class=\"flex-item title-row\" style=\"flex-grow:0.3\"><span class=\"title--xxsmall color-white\">'Til familiemedlem <%=(i+1) %>. Spar <%=discount %> kr./md.'</span></div>\n\t<div class=\"flex-item flex--row\">\n\t\t<% for(j = 0; j < subscriptionsNew.length; j++) { %>\n\t\t<div class=\"flex-item price-cell\">\n\t\t\t<div class=\"form-checkbox form-checkbox--large\">\n\t\t\t\t<input <% if(j == selected || subscriptionsNew[j].ID == selected){ %>checked<% } %> class=\"family-subscription\" name=\"family-group-<%=(i+1) %>\" id=\"family-<%=(i+1) %>-<%=(j+1) %>\" value=\"<%=subscriptionsNew[j].ID %>\" type=\"radio\">\n\t\t\t\t<label class=\"text-size--40 text-light color-blue padding-whole--none family-price-calc\" for=\"family-<%=(i+1) %>-<%=(j+1) %>\"><%=subscriptionsNew[j].PRICE %>,-</label>\n\t\t\t</div>\n\t\t</div>\n\t\t<% } %>\n\t</div>\n</div>\n  <% } %>\n<% } %>\n<% if(i < 5){ %>\n<div class=\"price-holder\">\n\t<div class=\"flex-item title-row next-member\" style=\"flex-grow:0.3\">\n\t\t<a href=\"#\" class=\"add-new-family-member\">\n\t\t\t<span class=\"title--xxsmall color-white\">\n\t\t\t\t+ Tilf&oslash;j familiemedlem <%=(i+1) %>. Spar 100 Kr./md.\n\t\t\t</span>\n\t\t</a>\n\t</div>\n</div>\n<% } %>\n"

/***/ },

/***/ 756:
/***/ function(module, exports) {

	module.exports = "<div id=\"family-prices\">\n<% for(var i = 0; i < prices.priceRows.length; i++) { %>\n\t<% with(prices.priceRows[i]){ %>\n\t<div class=\"info-box text--left\">\n\t\t<strong class=\"title--med text-bold\"><%=placeholders.member %> <%=(i+1) %></strong>\n\t\t<dl class=\"text-size--13\">\n\t\t\t<dt>FRI+ FAMILIE <%=capacity %> GB</dt>\n\t\t\t<dd><%=price %> kr./md.</dd>\n\t\t\t<dt><%=placeholders.discount %></dt>\n\t\t\t<dd><%=discount %> kr./md.</dd>\n\t\t\t<dt class=\"minpris\"><%=placeholders.minimumPrice %></dt>\n\t\t\t<dd><%=priceForDuration %> KR.</dd>\n\t\t</dl>\n\t</div>\n\t<% } %>\n<% } %>\n</div>\n<div id=\"family-total\" class=\"info-box\">\n\t<dl class=\"total\">\n\t\t<dt><%=placeholders.totalPrice %></dt><dd><%=prices.total %> kr./md.</dd>\n\t\t<dt><%=placeholders.totalDiscount %></dt><dd><%=prices.totalDiscount %> kr./md.</dd>\n\t\t<dt class=\"title--small color-green\"><%=placeholders.yearSaves %></dt><dd class=\"title--small color-green\"><%=prices.yearSaves %> KR.</dd>\n\t</dl>\n</div>\n<div class=\"info-box ovh text--right\">\n    <button data-component=\"button\" data-alias=\"selectPlan\" class=\"button button--accept button--flow leader--small float-right button--accept--border\" data-extensions=\"Common::analytics/link\" data-analytics=\"{&quot;actionType&quot;:2,&quot;data&quot;:{&quot;eventInfo&quot;:{&quot;eventName&quot;:&quot;add product to basket&quot;,&quot;attributes&quot;:{&quot;item&quot;:[{&quot;product&quot;:[{&quot;productInfo&quot;:{&quot;sku&quot;:&quot;&quot;,&quot;productName&quot;:&quot;Bredbånd op til 50M/10M&quot;,&quot;category&quot;:&quot;broadband&quot;},&quot;attributes&quot;:{&quot;paymentUpfront&quot;:0.0,&quot;monthlyPayment&quot;:23920.0,&quot;price&quot;:157290.0}}]}]},&quot;category&quot;:&quot;shop&quot;}}}\">\n        <span class=\"button__label icon-arrow-next\">Forsæt</span>\n        <span class=\"button__label--success icon icon--left icon-thumb-up\">Forsæt</span>\n        <span class=\"button__spinner\"><span class=\"button__spinner-container\"><i></i></span></span>\n    </button>\n</div>"

/***/ },

/***/ 757:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'load': 'resize'
		},
		initialize: function() {
			this.resize();
			window.addEventListener('resize', this.resize.bind(this));
		},

		resize: function() {
			var docWidth = this._getSize(document, 'Width');
			var frameHeight = this.$el.height();
			var RESIZE = 0.9;

			if (docWidth < this.$options.breakpoint) {
				frameHeight = docWidth * RESIZE;
			} else {
				try {
					frameHeight = this._getSize(this.$el[0].contentDocument, 'Height');
				} catch (exc) {
				}
			}

			this.$el.height(frameHeight);
		},

		_getSize: function(doc, size) {
			return Math.max(
				doc.body['scroll' + size], doc.documentElement['scroll' + size],
				doc.body['offset' + size], doc.documentElement['offset' + size],
				doc.body['client' + size], doc.documentElement['client' + size]
			);
		}
	};


/***/ },

/***/ 758:
/***/ function(module, exports) {

	'use strict';

	/* Click event for navigating to an url. Used where DOM elements can't be contained in an <a> tag. */
	module.exports = {
		events: {
			'click': function() {
				if (this.$options.url) {
					window.location.href = this.$options.url;
				}
			}
		}
	};


/***/ },

/***/ 759:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// require other providers if needed
	var GoogleMapProvider = __webpack_require__(451);

	var PROVIDERS = {
		GOOGLE: 'google'
	};

	var SELECTORS = {
		shopInfoSelector: '.banner-map-info',
		shopInfoDistanceSelector: '.distance-to-shop',
		searchFieldSelector: '#search',
		searchTriggerSelector: '#search-button',
		searchErrorSelector: '.message.search-error',
		sortSelector: '.map-checkbox',
		optionalSort: '.optSort'
	};

	module.exports = {
		initialize: function() {

			this.$shopIcons = this.$options.shopicon;

			this.mapProvider = null;
			this.$options.provider = this.$options.provider || PROVIDERS.GOOGLE;

			switch (this.$options.provider) {
				case PROVIDERS.GOOGLE:
					{
						this.mapProvider = new GoogleMapProvider(this.$el[0]);
						break;
					}
			}

			this.$searchField = this.$el.parent().find(SELECTORS.searchFieldSelector);
			this.$searchTrigger = this.$el.parent().find(SELECTORS.searchTriggerSelector);
			this.$sortTriggers = this.$el.parent().find(SELECTORS.sortSelector);
			this.$optSortTrigger = this.$el.parent().find(SELECTORS.optionalSort);

			this.$searchTrigger.on('click', this.searchUserPosition.bind(this));
			this.$searchField.on('keypress', this.handleSearchInput.bind(this));

			this.$sortTriggers.on('click', this._SortShops.bind(this));
			this.$optSortTrigger.on('click', this._SortShops.bind(this));

			this.subscribe();
		},

		subscribe: function() {
			this.$tools.data.pubsub.subscribe('/map/initialized', this.onInitialized.bind(this));
			this.$tools.data.pubsub.subscribe('/map/user/position/changed', this.changeUserPosition.bind(this));
			this.$tools.data.pubsub.subscribe('/map/position/found', this.addressFound.bind(this));
			this.$tools.data.pubsub.subscribe('/map/position/not/found', this.addressNotFound.bind(this));
			this.$tools.data.pubsub.subscribe('/map/direction/resolved', this.showDistanceToShop.bind(this));
		},

		onInitialized: function() {
			var coordinates = new Array();
			if (this.$options.defaultcenter) {
				coordinates = this.$options.defaultcenter.split(',');
				this.mapProvider.setCenter(this.mapProvider.createPoint(coordinates[0], coordinates[1]));
			}

			this.loadShopsData();
		},

		changeUserPosition: function() {
			if (this.userMarker) {
				this.userMarker.setMap(null);
			}

			this.drawPathToNearestShop();
		},

		loadShopsData: function() {
			var url = this.$options.url;

			if (url) {
				this.$tools.data.ajax({
					url: url,
					type: 'GET',
					contentType: 'application/json'
				}).then(function(response) {

					if (response.length > 0) {
						this.setShopMarkers(response);
					}
				}.bind(this));
			}
		},

		_SortShops: function() {
			var selectorsSort = this.$el.parent().find('.map-checkbox');
			var optionalSort = this.$el.parent().find('.optSort');

			var sortedData = [];
			var index;
			var tempData = this.shopdata;

			if (selectorsSort.length > 0) {
				//Adds shops that should be searchable

				for (index = 0; index < selectorsSort.length; index++) {
					if (selectorsSort[index].checked) {
						sortedData = sortedData.concat(this._addShopsToArray(tempData, selectorsSort[index].value));
					}
				}
			}

			if (optionalSort.length > 0) {
				//Removes those shops that doesn't fulfill optional sort
				for (index = 0; index < optionalSort.length; index++) {
					if (sortedData.length > 0) {
						if (optionalSort[index].checked) {
							sortedData = this._removeFromArrayByStatus(sortedData, optionalSort[index].value);
						}
					}
				}
			}

			this._setVisibility(selectorsSort, optionalSort);

			this.mapProvider.setItemsData(sortedData);

		},

		_removeFromArrayByStatus: function(data, sortParameter) {
			return data.filter(function(item) {
				return item[sortParameter] === 'true';
			});
		},

		_addShopsToArray: function(data, shopType) {
			return data.filter(function(item) {
				return item.type === shopType;
			});
		},

		_setVisibility: function(selectorsSort, optionalSort) {

			this._SetVisibiltyForAll(true);

			this.shopMarkers.forEach(function(item) {

				selectorsSort.forEach(function(sortOption) {
					if (!sortOption.checked && item.type === sortOption.value) {
						this.mapProvider.SetMarkerVisibility(item, false);
					}
				}, this);

				optionalSort.forEach(function(sortOption) {
					if (sortOption.checked && item[sortOption.value] === 'false') {
						this.mapProvider.SetMarkerVisibility(item, false);
					}
				}, this);

			}, this);
		},

		_SetVisibiltyForAll: function(status) {
			this.shopMarkers.forEach(function(item) {
				this.mapProvider.SetMarkerVisibility(item, status);
			}, this);
		},

		setShopMarkers: function(shops) {
			var index;
			var shop;

			this.shopdata = shops;
			this.mapProvider.setItemsData(shops);
			this.shopMarkers = [];
			for (index = 0; index < shops.length; index++) {
				shop = shops[index];
				if (shop.location.latitude && shop.location.longitude) {

					this.shopMarkers.push(this.mapProvider.addMarker(
						this.mapProvider.createPoint(shop.location.latitude, shop.location.longitude),
						{
							title: shop.title,
							icon: this._getShopImage(shop.type),
							type: shop.type,
							sortopt1: shop.sortopt1,
							sortopt2: shop.sortopt2
						},
						this.setActiveShop.bind(this, shop)
					));
				}
			}

			this.drawPathToNearestShop();
		},

		_getShopImage: function(id) {
			var index = 0;
			for (; index < this.$shopIcons.length; index++) {
				if (this.$shopIcons[index].ID == id) {
					return this.$shopIcons[index].Image;
				}
			}
		},

		drawPathToNearestShop: function() {
			var nearestShop;
			if (this.mapProvider.isReadyToDrawPath()) {
				nearestShop = this.mapProvider.findNearestItemCoords(this.mapProvider.getUserData());
				if (nearestShop) {
					this.setActiveShop(nearestShop);
				}
			}
		},

		setActiveShop: function(shopData) {
			// change shop info
			var infoSelector = this.$options.itemInfo;
			var $shopInfo = this.$el.parent().find(infoSelector || SELECTORS.shopInfoSelector);
			var shopPosition;

			$shopInfo.html(shopData.html);

			// change path from user to shop
			shopPosition = this.mapProvider.createPoint(shopData.location.latitude, shopData.location.longitude);

			//this.mapProvider.changePath.call(this.mapProvider, this.mapProvider.getUserData(), shopPosition);
			this.mapProvider.WithoutRoute.call(this.mapProvider, this.mapProvider.getUserData(), shopPosition);

			this.$events.trigger('onActiveShopSet');
		},

		findShopMarkerByPosition: function(shopData) {
			var index = 0;
			var marker;
			for (; index < this.shopMarkers.length; index++) {
				marker = this.shopMarkers[index];

				if ((this.getRoundPosition(marker.position.lat()) === this.getRoundPosition(shopData.location.latitude))
					&& (this.getRoundPosition(marker.position.lng()) === this.getRoundPosition(shopData.location.longitude))) {
					return marker;
				}
			}
			return null;
		},

		getRoundPosition: function(position) {
			var PERCENT = 100;
			return Math.round(position * PERCENT) / PERCENT;
		},

		showDistanceToShop: function(event, directionResponse) {
			var $distanceToShop = this.$el.parent().find(SELECTORS.shopInfoDistanceSelector);
			$distanceToShop.html(directionResponse.routes[0].legs[0].distance.text);
		},

		searchUserPosition: function() {
			var searchParameter = this.$searchField.val();
			var country = this.$options.country;

			this.mapProvider.getPositionByAddress(searchParameter, country);

			this.$el.parent().find(SELECTORS.searchErrorSelector).addClass('message--closed');
		},
		addressFound: function(event, position) {
			this.mapProvider.setUserData(position);
			this.changeUserPosition(event, position);
		},

		handleSearchInput: function(event) {
			var KEYCODE = {ENTER: 13};
			// hide error

			// trigger address search by pressing Enter key
			if (event.keyCode === KEYCODE.ENTER) {
				this.$el.parent().find(SELECTORS.searchErrorSelector).addClass('message--closed');
				this.searchUserPosition();
				event.preventDefault();
			}
		},
		addressNotFound: function() {
			this.$el.parent().find(SELECTORS.searchErrorSelector).removeClass('message--closed');
		}
	};


/***/ },

/***/ 760:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		initialize: function() {
			this.setHeight();
		},

		ready: function(){
			this.map = this.$components.map[0];
			this.map.$events.on('onActiveShopSet $this', this.setHeight.bind(this));
		},

		setHeight: function(){
			var WIDTH_MOBILE = 600;
			var recalcTreshold = this.$tools.globalConfigs('TN.config.mobileMaxWidth', WIDTH_MOBILE);
			var $banner = this.$el.find('.stores-map__banner-info');

			this.$el.css({height: ''});

			if(window.innerWidth > recalcTreshold) {
				this.$el.css({height: Math.max(window.innerHeight - this.$el.offset().top, $banner.height())});
			} else if(this.map) {
				this.map.$el.css({height: this.$options.mobileMapHeight});
			}
		}
	};


/***/ },

/***/ 761:
/***/ function(module, exports) {

	'use strict';

	/**
	 name: now-interact-notifier/formatter
	 type: ui
	 desc: >
	 visualize format for text field(supports only digits now)
	 expands regexp like format and makes it visible on typing

	 options:
	 format: String. Regex like format. e.g. date - "d{2}.d{2}.d{4}"
	 */
	module.exports = {
		events: {
			'keydown': 'onKeyDown',
			'input': '_applyFormat',
			'change': '_applyFormat'
		},

		initialize: function() {
			this.supportedChars = 'd';
			this.step = this.move = this.caret = 0;
			this.format = this._expandFormat();
		},

		onKeyDown: function(event) {
			var KEYCODE = {BACKSPACE: 8, DELETE: 46};
			this.step = ((event.keyCode === KEYCODE.BACKSPACE) || (event.keyCode === KEYCODE.DELETE)) ? -1 : 1;
			this.move = (event.keyCode === KEYCODE.BACKSPACE) ? -1 : 0;
		},

		_applyFormat: function() {
			var result = '';
			var charAt = 0;
			var value = this.$el.val();

			this.caret = this.$el[0].selectionStart || 0;

			value = value.replace(/[^\d]/g, '');

			if (value.length) {
				result = this.format.replace(/[d]/g, function() {
					var ch = '_';

					if (value[charAt]) {
						ch = value[charAt++];
					}

					return ch;
				});
			}

			this.$el.val(result);
			this._moveCaret();
		},

		_expandFormat: function() {
			var format = this.$options.format;

			return format.replace(/([d])({(\d+)})?/g, function($1, $2, $3, $count) {
				var count = parseInt($count) || 1;

				return Array.prototype.join.call(new Array(count + 1), $2);
			});
		},

		_moveCaret: function() {
			while (this._isNonFormatableCharacter() && this._isInRange()) {
				this.caret += this.step;
			}

			this.$el[0].setSelectionRange(this.caret, this.caret);
		},

		_isInRange: function() {
			return this.caret >= 0 && this.caret <= this.format.length;
		},

		_isNonFormatableCharacter: function() {
			return this.format[this.caret + this.move] !== 'd';
		}
	};


/***/ },

/***/ 762:
/***/ function(module, exports) {

	'use strict';

	/**
		name: now-interact-notifier
		type: ui
		desc: >
		Callback form for customers without NemID

		options:
			interactId: String. Specifies ID of Now Interact account
	*/
	module.exports = {
		events: {
			'submit form': 'onSubmit'
		},

		onSubmit: function(event) {
			event.preventDefault();

			if (typeof IMP !== 'undefined') {
				this.$el.addClass('interact-sent');
				this._sendCustomerData();
			}
		},

		_sendCustomerData: function() {
			var prop;
			this.customerData = this.$components.customerData.serialize();
			this.customerData.Basket = {};

			IMP.initsite(this.$options.interactId, '1');

			for (prop in this.customerData) {
				IMP.appendSiteProp(prop, this.customerData[prop]);
			}

			window.IMP_CB = {receiveInfo: this._receiveInfoHandler.bind(this)};

			IMP.trackEventInteract();
			IMP.trackGetInfo();
		},

		_receiveInfoHandler: function(text, url, id) {
			try {
				IMP.trackSendInfo(this.customerData.Phone, url, id);
				this.$components.customerData.$el.hide();
				this.$components.gratefulMessage.$el.show();
			} catch (exc) {
				this.$components.errorMessage.open();
			}
		}
	};


/***/ },

/***/ 763:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var scrollToComponent = __webpack_require__(555);
	var scrollTo = scrollToComponent.scrollTo.bind(scrollToComponent);

	module.exports = {
		initialize: function() {
			Object.defineProperty(this._verifier, 'tryAll', this._verifier.tryAll);
			Object.defineProperty(this._verifier, 'handle', this._verifier.handle);
		},

		ready: function() {
			this.form = this.$components.customerForm;
			this.confirmation = this.$components.confirmation;
			this.smsConfirmation = this.$components.smsConfirmation;
		},

		_submit: function(data, url) {
			return this.$tools.data.post(url, data)
				.then(this._onSuccess.bind(this))
				.catch(this._onError.bind(this));
		},

		_toggleError: function(flag, text) {
			this.$components.errorMessage.$elements.common.toggle(!!text);
			this.$components.errorMessage.error(text)[flag ? 'open' : 'close']();
		},

		_toConfirmation: function(displayData) {
			this._toggleConfirmationFields(displayData);

			this.form.hide();
			this.confirmation.show();
			//scroll into view
			scrollTo(this.$el);
		},

		_toForm: function() {
			this._toggleError(false);

			this.form.show();
			this.confirmation.hide();
		},

		_verify: function(formData) {
			var isValid = this._verifier.tryAll.call(this, formData);

			this._toggleError(!isValid);

			return isValid;
		},

		_toggleConfirmationFields: function(displayData) {
			this.confirmation.$components.confirmationField.forEach(function(component) {
				var field = component.$options.alias;
				var visible = Boolean(displayData[field] && displayData[field].length);

				component.toggle(visible);

				if (visible) {
					component.html([].concat(displayData[field]).join(', '), 'span');
				}
			});
		},

		_onSuccess: function(response) {
			if (!response.success) {
				return this.$tools.q.reject(response);
			}

			this.$components.successMessage.html(response.data.successMessage);
			this.$components.successMessage.show();
			this.confirmation.hide();

			return this.$tools.q.when(response);
		},

		_onError: function(response) {
			this._toggleError(true, response.errorMessages && response.errorMessages[0]);
			return this.$tools.q.reject(response);
		},

		/* only a wrapper for verifying methods. All methods should be called binded to parent scope */
		_verifier: {
			identifier: function(formData) {
				return this._verifier.handle.call(this, 'identifier', formData.Phone || formData.Email);
			},

		/* utility non enumerable properties */
			tryAll: {
				enumerable: false,
				value: function(formData) {
					return Object.keys(this._verifier).reduce(function(result, key) {
						return this._verifier[key].call(this, formData) && result;
					}.bind(this), true);
				}
			},

			handle: {
				enumerable: false,
				value: function(area, valid) {
					valid = Boolean(valid);

					this.$components.errorMessage.$elements[area].toggle(!valid);

					return valid;
				}
			}
		}
	};


/***/ },

/***/ 764:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'change $$choices': '_onChange'
		},

		getTexts: function(resolver){
			return this.getSelected().map(function(component){
				return resolver ? resolver(component.$options.text) : component.$options.text;
			});
		},

		getValues: function(resolver){
			return this.getSelected().map(function(component){
				return resolver ? resolver(component.$el.val()) : component.$el.val();
			});
		},

		getSelected: function(){
			return this.$components.choices.filter(function(component){
				return component.$el.is(':checked');
			});
		},

		_onChange: function() {
			this.$events.trigger('change', [this.getValues()]);
		}
	};


/***/ },

/***/ 765:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var base = __webpack_require__(763);

	module.exports = app.core.helper.extend({}, base, {
		events: {
			'submit $customerForm': '_validate',
			'submit $smsConfirmation': '_smsCodeSubmit',
			'click $confirmation $backward': '_toForm',
			'click $confirmation $sendInfo': '_signupSubmit',
			'change $customerForm $zipRanges': '_onZipChange',
			'change $customerForm $time': '_onTimeChange',
			'input [data-selector="zipField"]': '_onZipChange'
		},

		ready: function(){
			base.ready.call(this);
			this._onTimeChange(null, this.form.$components.time.getValues());
		},

		_signupSubmit: function(){
			var formData = this._getData();

			this._submit(formData, this.$options.signupUrl)
				.then(this._onSubmitSuccess.bind(this, formData.ValidateSms));
		},

		_smsCodeSubmit: function(){
			this._submit(this.smsConfirmation.serialize(), this.$options.smsConfirmationUrl)
				.then(this._onSubmitSuccess.bind(this, null));
		},

		_validate: function(){
			var preparedData = this._prepareFormData();

			if(this._verify(preparedData.formData)){
				this._toConfirmation(preparedData.displayData);
				this._getData = function(data){ return data; }.bind(this, preparedData.formData);
			}
		},

		_prepareFormData: function(){
			var formData = this.form.serialize();
			var displayData = this._getDisplayData(formData);

			formData.Services = this.form.$components.services.getValues();
			formData.Subscriptions = this.form.$components.subscriptions.getValues();

			formData.ValidateEmail = Boolean(formData.Email);
			formData.ValidateSms = Boolean(formData.Phone);

			return {formData: formData, displayData: displayData};
		},

		_getDisplayData: function(formData){
			var displayData = {};

			displayData.Phone = formData.Phone;
			displayData.Email = formData.Email;
			displayData.Dsl = formData.Dsl;
			displayData.ZipCode = formData.ZipRange.split(',').pop();

			displayData.ZipAreas = this.form.$components.zipRanges.getTexts(function(text) { return text.replace(/\s\(.*\)/ig, ''); });
			displayData.ServicesText = this.form.$components.services.getTexts();
			displayData.SubscriptionsText = this.form.$components.subscriptions.getTexts();
			displayData.Time = this.form.$components.time.getTexts();

			return displayData;
		},

		_getData: function(formData){
			return formData;
		},

		_toSmsConfirmation: function(){
			this.confirmation.hide();
			this.smsConfirmation.show();
		},

		_onZipChange: function(event, values){
			var zipFrom = this.form.$components.zipFromField.$el.val();
			var zipTo = this.form.$components.zipToField.$el.val();

			values = values || this.form.$components.zipRanges.getValues();

			values.push([zipFrom || zipTo, zipTo || zipFrom].sort().join('-').replace(/^-/, ''));

			this.form.$components.zipRangeField.$el.val(values.join(','));
		},

		_onTimeChange: function(event, value){
			var time = value.pop().split('-');

			this.form.$components.timeFromField.$el.val(time[0]);
			this.form.$components.timeToField.$el.val(time[1]);
		},

		_onSubmitSuccess: function(smsConfirmation, response){
			if(smsConfirmation){
				this.smsConfirmation.$components.customerId.$el.val(response.data.customerId);
				this.$components.successMessage.hide();
				this._toSmsConfirmation();
			} else {
				this.smsConfirmation.hide();
			}
		},

		/* only a wrapper for verifying methods. All methods should be called binded to parent scope */
		_verifier: app.core.helper.extend(base._verifier, {
			zip: function(formData) {
				return this._verifier.handle.call(this, 'zip', formData.ZipRange.length);
			},

			service: function(formData) {
				return this._verifier.handle.call(this, 'service', formData.Services.length);
			},

			subscription: function(formData) {
				return this._verifier.handle.call(this, 'subscription', formData.Subscriptions.length);
			}
		})
	});


/***/ },

/***/ 766:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var base = __webpack_require__(763);

	module.exports = module.exports = app.core.helper.extend(base, {
		events: {
			'submit $customerForm': '_validate',
			'click $confirmation $submit': '_signoffSubmit',
			'click $confirmation $backward': '_toForm'
		},

		_validate: function() {
			var formData = this.form.serialize();

			if(this._verify(formData)){
				this._toConfirmation(formData);
			}
		},

		_signoffSubmit: function(){
			this._submit(this.form.serialize(), this.$options.submitUrl);
		}
	});


/***/ },

/***/ 767:
/***/ function(module, exports) {

	'use strict';

	var pressRelaseAction = '';

	module.exports = {
		events: {
			'click .press-release-submit': '_submit'
		},

		_validateForms: function() {

			this.$elements.pressForm.validate();
			return this.$elements.pressForm.valid();
		},

		_resetForm: function() {

			this.$elements.pressUnsubscribe.hide();
			this.$elements.pressSubscribe.hide();

			if (this.$elements.pressMessage) {
				this.$elements.pressMessage.show();
			}
			this.$elements.pressError.hide();
		},

		_submit: function(event) {
			var subscribePromise;
			var Userdata;

			event.preventDefault();

			this._resetForm();

			if (this._validateForms()) {

				Userdata = this._getData(event);

				subscribePromise = this._ajaxCall(Userdata);

				subscribePromise.then(function(result) {

					if (result.Success) {
						if (pressRelaseAction === 'subscribe') {
							this._showSuccess(this.$elements.pressSubscribe);

						} else {
							this._showSuccess(this.$elements.pressUnsubscribe);
						}
						return;
					}
					this._showError(result.ErrorMessage);

				}.bind(this));
			}
		},

		_showSuccess: function(object) {

			if (this.$elements.pressMessage) {
				this.$elements.pressMessage.hide();
			}

			object.show();

			this.$elements.pressSignUpEmail.val('');
			this.$elements.pressSignUpName.val('');
		},

		_showError: function(value) {
			this.$elements.pressMessageSection.html('<p>' + value + '</p>');
			this.$elements.pressError.show();
		},

		_getData: function(event) {

			pressRelaseAction = event.$el[0].name;

			return {
				name: this.$elements.pressSignUpName.val(),
				email: this.$elements.pressSignUpEmail.val(),
				action: pressRelaseAction
			};
		},

		_ajaxCall: function(UserData) {

			var url = this.$options.url;

			var ajaxConfig = ({
				url: url,
				data: UserData,
				type: 'POST'
			});

			return this.$tools.data.ajax(ajaxConfig);
		}
	};


/***/ },

/***/ 768:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var jQuery = __webpack_require__(2);

	module.exports = {
		events: {
			'ready': 'resize'
		},

		initialize: function() {
			var element = this.$el;
			//do this after load
			try {
				jQuery(function() {
					element.css('height', element[0].contentDocument.body.scrollHeight + 'px');
				});

				//do this on resize
				jQuery(window).resize(function() {
	                //[0] to get the dom element
					element.css('height', element[0].contentDocument.body.scrollHeight + 'px');
				});
			} catch (exc) {
				this._errorHandler(exc);
			}
		},

		resize: function() {
			try {
				element.css('height', element[0].contentDocument.body.scrollHeight + 'px');
			} catch (exc) {
				this._errorHandler(exc);
			}
		},

		_errorHandler: function(exc) {
			if (exc instanceof TypeError) {
				// statements to handle TypeError exceptions
			} else if (exc instanceof RangeError) {
				// statements to handle RangeError exceptions
			} else if (exc instanceof EvalError) {
				// statements to handle EvalError exceptions
			} else {
				// statements to handle any unspecified exceptions
				this.$tools.logger.error(exc);   // pass exception object to error consol
			}
		}
	};


/***/ },

/***/ 769:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'submit': 'submitForm'
		},

		ready: function() {
			this.isSubmitting = false;
		},

		submitForm: function(event) {
			var postData;
			var hasAccepted = this.$el.find('input[name=tlnPermission]').is(':checked');
			var thankyou = this.$el.find('.sign-me-up-thankyou');
			var elem = this.$el.find('form');

			event.preventDefault();

	        //There are some kind of error that makes this methods call 2 times on submit.
			if (this.isSubmitting === true || !hasAccepted) {
				if (!hasAccepted) {
					this.$el.find('input[name=tlnPermission]').addClass('form-item--error');
				}
				return;
			}
			this.isSubmitting = true;
	        //Check if the user accepts:


			postData = {
				name: this.$el.find('#signup_name').val(),
				email: this.$el.find('#signup_email').val(),
	            //"phoneNumber": "",
				isprivate: this.$options.isPrivate.toLowerCase(),
				identifyCode: this.$options.identifyCode,
				pageUrl: window.location.pathname,
				productName: this.$options.productName,
				productImage: '/ImageProxy/id/' + this.$options.productImageId,
				tlnPermission: hasAccepted
			};


			this.$tools.data.ajax({
				data: postData,
				url: this.$options.serviceUrl,
				type: 'GET',
				dataType: 'jsonp',
				success: function() {
					thankyou.removeClass('js-hidden');
					elem.hide();
				},
				error: function() {

				}
			});
		}

	};


/***/ },

/***/ 770:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		events: {
			'click .more': 'toggleTeaser'
		},

		initialize: function() {
			this.initReadMore();
		},

		initReadMore: function() {
			this.$teaser = this.$el.find('.teaser');
			this.heightClosed = this.$teaser.outerHeight();
			this.heightOpened = this.$el.find('.teaser-area').height() + this.$teaser.outerHeight() - this.$teaser.height();
		},

		toggleTeaser: function(){
			if (this.$teaser.hasClass('opened')) {
				this.$teaser.removeClass('opened');
				this.$teaser.css( 'height', this.heightClosed);
			} else {
				this.$teaser.addClass('opened');
				this.$teaser.css( 'height', this.heightOpened);
			}
		}

	};



/***/ },

/***/ 771:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var analyticsService = __webpack_require__(412);

	var CLASSES = {
		surveySent: 'survey-sent',
		commentsOpened: 'comments-visible'
	};

	var SELECTORS = {
		answerRadio: '[data-selector="answer"]'
	};

	module.exports = {
		ready: function(){
			this.commentsField = this.$components.commentsField;
			this.sendButton = this.$components.sendButton;
			this.answer = null;

			this.sendButton.disable();
		},

		events: (function(){ //TODO What
			var _events = {
				'click $sendButton': 'sendSurvey'
			};

			_events['change ' + SELECTORS.answerRadio] = 'toggleAnswer';

			return _events;
		}()),

		openComments: function(){
			this.sendButton.enable();
			this.$el.addClass(CLASSES.commentsOpened);
		},

		closeComments: function(){
			this.$el.removeClass(CLASSES.commentsOpened);
		},

		sendSurvey: function(event){

			var analyticsData = {};
			var comments = this.commentsField.$el.val();

			event.preventDefault();

			analyticsData[this.$options.eventProp] = this.answer;
			analyticsData[this.$options.commentProp] = comments;
			analyticsService.link(analyticsData);

			this.$el.addClass(CLASSES.surveySent);
			this.$el.find(SELECTORS.answerRadio).prop('disabled', true);
			this.sendButton.disable();

			this.closeComments();
		},

		toggleAnswer: function(event){
			this.answer = event.$el.val();
			this.openComments();
		}
	};


/***/ }

});