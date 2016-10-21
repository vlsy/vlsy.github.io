/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);

/******/ 	};

/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		1:0
/******/ 	};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}

/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);

/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;

/******/ 			script.src = __webpack_require__.p + "js/" + {"2":"ab5b061ad8467aea9704","3":"c9617f588fe935fb82d4","4":"1facea3f0bb84f205beb","5":"30223157cb2a62b7e256","6":"8ce4b1e4dc48950fba2f","7":"7e4e06ff21f2eb6e928c","8":"ce3d3f2f13d774500607","9":"cdab3599f8130f7ea6ca","10":"361c9d76f5dbb038b16f","11":"3a85384d27921ed07dbb","12":"c34c189f461fd7afcac8","13":"58340842fac77a58e497","14":"a9d14460c39ca261f8f8"}[chunkId] + ".js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};

/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(320);
	module.exports = __webpack_require__(792);


/***/ },

/***/ 320:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__.e/* nsure */(2, function(require) {
		undefined;
		var appConfig = {
			name: 'telenor',
			componentAttributes: {
				name: 'component',
				extensions: 'extensions',
				alias: 'alias',
				group: 'group',
				elements: 'element',
				ignore: 'component-ignore'
			},
			componentSelector: '[data-component]',
			contexts: {
				'Denmark#Common': function(ref, callback) {
					__webpack_require__.e/* nsure */(4, function(require) {
						callback(__webpack_require__(366)(ref));
					});
				},
				'Denmark#Framework': function(ref, callback) {
					__webpack_require__.e/* nsure */(5, function(require) {
						callback(__webpack_require__(378)(ref));
					});
				},
				'Denmark#Shop': function(ref, callback) {
					__webpack_require__.e/* nsure */(6, function(require) {
						callback(__webpack_require__(380)(ref));
					});
				},
				'Denmark#Content': function(ref, callback) {
					__webpack_require__.e/* nsure */(7, function(require) {
						callback(__webpack_require__(396)(ref));
					});
				},
				'Common': function(ref, callback) {
					__webpack_require__.e/* nsure */(8, function(require) {
						callback(__webpack_require__(399)(ref));
					});
				},
				'Framework': function(ref, callback) {
					__webpack_require__.e/* nsure */(9, function(require) {
						callback(__webpack_require__(478)(ref));
					});
				},
				'Selfcare': function(ref, callback) {
					__webpack_require__.e/* nsure */(10, function(require) {
						callback(__webpack_require__(567)(ref));
					});
				},
				'Shop': function(ref, callback) {
					__webpack_require__.e/* nsure */(11, function(require) {
						callback(__webpack_require__(662)(ref));
					});
				},
				'Content': function(ref, callback) {
					__webpack_require__.e/* nsure */(12, function(require) {
						callback(__webpack_require__(746)(ref));
					});
				},
				'SAP': function(ref, callback) {
					__webpack_require__.e/* nsure */(13, function(require) {
						callback(__webpack_require__(772)(ref));
					});
				}
			}
		};

		if ((undefined)) {
			appConfig.contexts.Docs = function(ref, callback) {
				__webpack_require__.e/* nsure */(14, function(require) {
					callback(__webpack_require__(786)(ref));
				});
			};
		}

		var Aura = __webpack_require__(321);
		var app = new Aura(appConfig);

		app.start();
		window.app = app;

	});


/***/ },

/***/ 792:
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }

/******/ });