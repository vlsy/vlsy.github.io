webpackJsonp([14],{

/***/ 786:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(787);


/***/ },

/***/ 787:
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./styleguide/accordion/index.js": 788,
		"./styleguide/controller/index.js": 789,
		"./styleguide/index.js": 790,
		"./styleguide/nav/index.js": 791
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
	webpackContext.id = 787;


/***/ },

/***/ 788:
/***/ function(module, exports) {

	'use strict';

	module.exports = {
		filterContentByValue: function(value) {
			var linkFound = false;
			var normalizedValue = value.toLowerCase();

			this.$elements.navLink.forEach(function(link) {
				if (link.text.toLowerCase().indexOf(normalizedValue) === -1) {
					link.classList.add('js-hidden');
				} else {
					link.classList.remove('js-hidden');
					linkFound = true;
				}
			});

			if (value.length) {
				this.$components.collapse[0].toggle(linkFound);
			}
		}
	};


/***/ },

/***/ 789:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Docs Controller
	type: documentation
	desc: controller for the styleguide
	 */
	module.exports = {
		events: {
			'click navLink': '_onItemClick'
		},

		_onItemClick: function(event) {
			event.preventDefault();

			this.$components.docLoader.turnOn();

			this.$tools.data.get(event.target.dataset.link)
			.then(function(response) {
				this.html(response, this.$elements.componentArea)
					.then(this._onHtmlChange.bind(this));
			}.bind(this));
		},

		_onHtmlChange: function() {
			var scripts = this.$elements.componentArea.find('script');

			scripts.each(function(index, item) {
				window.eval(item.innerHTML);
			});

			window.sgReadyCallback.forEach(function(callback) {
				callback();
			});

			window.sgReadyCallback.length = 0;

			this.$components.docLoader.turnOff();
		}
	};


/***/ },

/***/ 790:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Docs
	type: documentation
	desc: >
	    The purpose of this component is to describe the way of writing documentation in source code.

	    ###Module

	    *name*:
	    module name

	    *desc*:
	    module description, field content will be passed throuth markdown

	    *options*:
	    object containing data-* attributes in component markup.

	    ```
	    options:
	        analytics: Analytics object
	    ```

	    *events* and *pubsub*:
	    object of events triggered by a component

	    *examples*:
	    an array of markup examples:

	    examples:

	    ```
	      - name: Grey
	        tmpl: >
	            <button class="button button--default">Default</button>
	      - name: Included
	        tmpl:
	          include: info.html
	    ```

	    *modifiers*:
	    an object of scss modifiers:

	    ```
	    modifiers:
	      :active: Active state
	      .is-active: Simulates an active state on mobile devices
	    ```

	    ###Function

	    *args*:
	    an object or array that function accepts

	    ```
	    args:
	        newType: sets type of message
	    ```

	    this is the simplest case, if you want to use longer description with some code blocks, use the following form:

	    ```
	    args:
	        name: newType
	        desc: >
	            sets type of message. available options are: `error`, 'info'
	    ```


	    `desc`: description of a function

	*/
	module.exports = {
	};


/***/ },

/***/ 791:
/***/ function(module, exports) {

	'use strict';

	/**
	name: Docs Nav
	type: documentation
	desc: navigation controller for the styleguide
	 */
	module.exports = {
		events: {
			'search $componentSearch': '_onSearch'
		},

		_onSearch: function(event, term) {
			this.$components.accordions.forEach(function(accordion) {
				accordion.filterContentByValue(term);
			});

		}
	};


/***/ }

});