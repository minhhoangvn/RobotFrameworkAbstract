/**
 * @copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * @copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * @copyright (c) 2012-2016, SOASTA, Inc. All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

/**
 * @namespace Boomerang
 * @desc
 * boomerang measures various performance characteristics of your user's browsing
 * experience and beacons it back to your server.
 *
 * To use this you'll need a web site, lots of users and the ability to do
 * something with the data you collect.  How you collect the data is up to
 * you, but we have a few ideas.
*/

/**
 * @memberof Boomerang
 * @type {TimeStamp}
 * @desc
 * Measure the time the script started
 * This has to be global so that we don't wait for the entire
 * BOOMR function to download and execute before measuring the
 * time.  We also declare it without `var` so that we can later
 * `delete` it.  This is the only way that works on Internet Explorer
*/
BOOMR_start = new Date().getTime();

/**
 * @function
 * @desc
 * Check the value of document.domain and fix it if incorrect.
 * This function is run at the top of boomerang, and then whenever
 * init() is called.  If boomerang is running within an iframe, this
 * function checks to see if it can access elements in the parent
 * iframe.  If not, it will fudge around with document.domain until
 * it finds a value that works.
 *
 * This allows site owners to change the value of document.domain at
 * any point within their page's load process, and we will adapt to
 * it.
 * @param {string} domain - domain name as retrieved from page url
 */
function BOOMR_check_doc_domain(domain) {
	/*eslint no-unused-vars:0*/
	var test;

	if (!window) {
		return;
	}

	// If domain is not passed in, then this is a global call
	// domain is only passed in if we call ourselves, so we
	// skip the frame check at that point
	if (!domain) {
		// If we're running in the main window, then we don't need this
		if (window.parent === window || !document.getElementById("boomr-if-as")) {
			return;// true;	// nothing to do
		}

		if (window.BOOMR && BOOMR.boomerang_frame && BOOMR.window) {
			try {
				// If document.domain is changed during page load (from www.blah.com to blah.com, for example),
				// BOOMR.window.location.href throws "Permission Denied" in IE.
				// Resetting the inner domain to match the outer makes location accessible once again
				if (BOOMR.boomerang_frame.document.domain !== BOOMR.window.document.domain) {
					BOOMR.boomerang_frame.document.domain = BOOMR.window.document.domain;
				}
			}
			catch (err) {
				if (!BOOMR.isCrossOriginError(err)) {
					BOOMR.addError(err, "BOOMR_check_doc_domain.domainFix");
				}
			}
		}
		domain = document.domain;
	}

	if (domain.indexOf(".") === -1) {
		return;// false;	// not okay, but we did our best
	}

	// 1. Test without setting document.domain
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 2. Test with document.domain
	catch (err) {
		document.domain = domain;
	}
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 3. Strip off leading part and try again
	catch (err) {
		domain = domain.replace(/^[\w\-]+\./, "");
	}

	BOOMR_check_doc_domain(domain);
}

BOOMR_check_doc_domain();


// beaconing section
// the parameter is the window
(function(w) {

	var impl, boomr, d, myurl, createCustomEvent, dispatchEvent, visibilityState, visibilityChange, orig_w = w;

	// This is the only block where we use document without the w. qualifier
	if (w.parent !== w &&
	    document.getElementById("boomr-if-as") &&
	    document.getElementById("boomr-if-as").nodeName.toLowerCase() === "script") {
		w = w.parent;
		myurl = document.getElementById("boomr-if-as").src;
	}

	d = w.document;

	// Short namespace because I don't want to keep typing BOOMERANG
	if (!w.BOOMR) { w.BOOMR = {}; }
	BOOMR = w.BOOMR;
	// don't allow this code to be included twice
	if (BOOMR.version) {
		return;
	}

	BOOMR.version = "%boomerang_version%";
	BOOMR.window = w;
	BOOMR.boomerang_frame = orig_w;

	if (!BOOMR.plugins) { BOOMR.plugins = {}; }

	// CustomEvent proxy for IE9 & 10 from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
	(function() {
		try {
			if (new w.CustomEvent("CustomEvent") !== undefined) {
				createCustomEvent = function(e_name, params) {
					return new w.CustomEvent(e_name, params);
				};
			}
		}
		catch (ignore) {
			// empty
		}

		try {
			if (!createCustomEvent && d.createEvent && d.createEvent("CustomEvent")) {
				createCustomEvent = function(e_name, params) {
					var evt = d.createEvent("CustomEvent");
					params = params || { cancelable: false, bubbles: false };
					evt.initCustomEvent(e_name, params.bubbles, params.cancelable, params.detail);

					return evt;
				};
			}
		}
		catch (ignore) {
			// empty
		}

		if (!createCustomEvent && d.createEventObject) {
			createCustomEvent = function(e_name, params) {
				var evt = d.createEventObject();
				evt.type = evt.propertyName = e_name;
				evt.detail = params.detail;

				return evt;
			};
		}

		if (!createCustomEvent) {
			createCustomEvent = function() { return undefined; };
		}
	}());

	/**
	 dispatch a custom event to the browser
	 @param e_name	The custom event name that consumers can subscribe to
	 @param e_data	Any data passed to subscribers of the custom event via the `event.detail` property
	 @param async	By default, custom events are dispatched immediately.
			Set to true if the event should be dispatched once the browser has finished its current
			JavaScript execution.
	 */
	dispatchEvent = function(e_name, e_data, async) {
		var ev = createCustomEvent(e_name, {"detail": e_data});
		if (!ev) {
			return;
		}

		function dispatch() {
			try {
				if (d.dispatchEvent) {
					d.dispatchEvent(ev);
				}
				else if (d.fireEvent) {
					d.fireEvent("onpropertychange", ev);
				}
			}
			catch (e) {
				BOOMR.debug("Error when dispatching " + e_name);
			}
		}

		if (async) {
			BOOMR.setImmediate(dispatch);
		}
		else {
			dispatch();
		}
	};

	// visibilitychange is useful to detect if the page loaded through prerender
	// or if the page never became visible
	// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
	// http://www.nczonline.net/blog/2011/08/09/introduction-to-the-page-visibility-api/
	// https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API

	// Set the name of the hidden property and the change event for visibility
	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
		visibilityState = "visibilityState";
		visibilityChange = "visibilitychange";
	}
	else if (typeof document.mozHidden !== "undefined") {
		visibilityState = "mozVisibilityState";
		visibilityChange = "mozvisibilitychange";
	}
	else if (typeof document.msHidden !== "undefined") {
		visibilityState = "msVisibilityState";
		visibilityChange = "msvisibilitychange";
	}
	else if (typeof document.webkitHidden !== "undefined") {
		visibilityState = "webkitVisibilityState";
		visibilityChange = "webkitvisibilitychange";
	}

	// impl is a private object not reachable from outside the BOOMR object
	// users can set properties by passing in to the init() method
	impl = {
		// properties
		beacon_url: "",
		// beacon request method, either GET, POST or AUTO. AUTO will check the
		// request size then use GET if the request URL is less than MAX_GET_LENGTH chars
		// otherwise it will fall back to a POST request.
		beacon_type: "AUTO",
		//  beacon authorization key value.  Most systems will use the 'Authentication' keyword, but some
		//  some services use keys like 'X-Auth-Token' or other custom keys
		beacon_auth_key: "Authorization",
		//  beacon authorization token.  This is only needed if your are using a POST and
		//  the beacon requires an Authorization token to accept your data
		beacon_auth_token: undefined,
		// strip out everything except last two parts of hostname.
		// This doesn't work well for domains that end with a country tld,
		// but we allow the developer to override site_domain for that.
		// You can disable all cookies by setting site_domain to a falsy value
		site_domain: w.location.hostname.
					replace(/.*?([^.]+\.[^.]+)\.?$/, "$1").
					toLowerCase(),
		//! User's ip address determined on the server.  Used for the BA cookie
		user_ip: "",
		// Whether or not to send beacons on page load
		autorun: true,

		// Whether or not we've sent a page load beacon
		hasSentPageLoadBeacon: false,

		// cookie referrer
		r: undefined,

		// document.referrer
		r2: undefined,

		//! strip_query_string: false,

		//! onloadfired: false,

		//! handlers_attached: false,
		events: {
			"page_ready": [],
			"page_unload": [],
			"before_unload": [],
			"dom_loaded": [],
			"visibility_changed": [],
			"prerender_to_visible": [],
			"before_beacon": [],
			"onbeacon": [],
			"page_load_beacon": [],
			"xhr_load": [],
			"click": [],
			"form_submit": [],
			"onconfig": [],
			"xhr_init": [],
			"spa_init": [],
			"spa_navigation": [],
			"xhr_send": []
		},

		public_events: {
			"before_beacon": "onBeforeBoomerangBeacon",
			"onbeacon": "onBoomerangBeacon",
			"onboomerangloaded": "onBoomerangLoaded"
		},

		listenerCallbacks: {},

		vars: {},

		/**
		 * Variable priority lists:
		 * -1 = first
		 *  1 = last
		 */
		varPriority: {
			"-1": {},
			"1": {}
		},

		errors: {},

		disabled_plugins: {},

		xb_handler: function(type) {
			return function(ev) {
				var target;
				if (!ev) { ev = w.event; }
				if (ev.target) { target = ev.target; }
				else if (ev.srcElement) { target = ev.srcElement; }
				if (target.nodeType === 3) {// defeat Safari bug
					target = target.parentNode;
				}

				// don't capture events on flash objects
				// because of context slowdowns in PepperFlash
				if (target && target.nodeName.toUpperCase() === "OBJECT" && target.type === "application/x-shockwave-flash") {
					return;
				}
				impl.fireEvent(type, target);
			};
		},

		clearEvents: function() {
			var eventName;

			for (eventName in this.events) {
				if (this.events.hasOwnProperty(eventName)) {
					this.events[eventName] = [];
				}
			}
		},

		clearListeners: function() {
			var type, i;

			for (type in impl.listenerCallbacks) {
				if (impl.listenerCallbacks.hasOwnProperty(type)) {
					// remove all callbacks -- removeListener is guaranteed
					// to remove the element we're calling with
					while (impl.listenerCallbacks[type].length) {
						BOOMR.utils.removeListener(
						    impl.listenerCallbacks[type][0].el,
						    type,
						    impl.listenerCallbacks[type][0].fn);
					}
				}
			}

			impl.listenerCallbacks = {};
		},

		fireEvent: function(e_name, data) {
			var i, handler, handlers, handlersLen;

			e_name = e_name.toLowerCase();

			if (!this.events.hasOwnProperty(e_name)) {
				return;// false;
			}

			if (this.public_events.hasOwnProperty(e_name)) {
				dispatchEvent(this.public_events[e_name], data);
			}

			handlers = this.events[e_name];

			// Before we fire any event listeners, let's call real_sendBeacon() to flush
			// any beacon that is being held by the setImmediate.
			if (e_name !== "before_beacon" && e_name !== "onbeacon") {
				BOOMR.real_sendBeacon();
			}

			// only call handlers at the time of fireEvent (and not handlers that are
			// added during this callback to avoid an infinite loop)
			handlersLen = handlers.length;
			for (i = 0; i < handlersLen; i++) {
				try {
					handler = handlers[i];
					handler.fn.call(handler.scope, data, handler.cb_data);
				}
				catch (err) {
					BOOMR.addError(err, "fireEvent." + e_name + "<" + i + ">");
				}
			}

			// remove any 'once' handlers now that we've fired all of them
			for (i = 0; i < handlersLen; i++) {
				if (handlers[i].once) {
					handlers.splice(i, 1);
					handlersLen--;
					i--;
				}
			}

			return;// true;
		},

		spaNavigation: function() {
			// a SPA navigation occured, force onloadfired to true
			impl.onloadfired = true;
		}
	};

	// We create a boomr object and then copy all its properties to BOOMR so that
	// we don't overwrite anything additional that was added to BOOMR before this
	// was called... for example, a plugin.
	boomr = {
		//! t_lstart: value of BOOMR_lstart set in host page
		t_start: BOOMR_start,
		//! t_end: value set in zzz-last-plugin.js

		url: myurl,

		// constants visible to the world
		constants: {
			// SPA beacon types
			BEACON_TYPE_SPAS: ["spa", "spa_hard"],
			// using 2000 here as a de facto maximum URL length based on:
			// http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
			MAX_GET_LENGTH: 2000
		},

		// Utility functions
		utils: {
			objectToString: function(o, separator, nest_level) {
				var value = [], k;

				if (!o || typeof o !== "object") {
					return o;
				}
				if (separator === undefined) {
					separator = "\n\t";
				}
				if (!nest_level) {
					nest_level = 0;
				}

				if (Object.prototype.toString.call(o) === "[object Array]") {
					for (k = 0; k < o.length; k++) {
						if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
							value.push(
								this.objectToString(
									o[k],
									separator + (separator === "\n\t" ? "\t" : ""),
									nest_level - 1
								)
							);
						}
						else {
							if (separator === "&") {
								value.push(encodeURIComponent(o[k]));
							}
							else {
								value.push(o[k]);
							}
						}
					}
					separator = ",";
				}
				else {
					for (k in o) {
						if (Object.prototype.hasOwnProperty.call(o, k)) {
							if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
								value.push(encodeURIComponent(k) + "=" +
									this.objectToString(
										o[k],
										separator + (separator === "\n\t" ? "\t" : ""),
										nest_level - 1
									)
								);
							}
							else {
								if (separator === "&") {
									value.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k]));
								}
								else {
									value.push(k + "=" + o[k]);
								}
							}
						}
					}
				}

				return value.join(separator);
			},

			getCookie: function(name) {
				if (!name) {
					return null;
				}

				name = " " + name + "=";

				var i, cookies;
				cookies = " " + d.cookie + ";";
				if ((i = cookies.indexOf(name)) >= 0) {
					i += name.length;
					cookies = cookies.substring(i, cookies.indexOf(";", i)).replace(/^"/, "").replace(/"$/, "");
					return cookies;
				}
			},

			setCookie: function(name, subcookies, max_age) {
				var value, nameval, savedval, c, exp;

				if (!name || !impl.site_domain) {
					BOOMR.debug("No cookie name or site domain: " + name + "/" + impl.site_domain);
					return false;
				}

				value = this.objectToString(subcookies, "&");
				nameval = name + "=\"" + value + "\"";

				c = [nameval, "path=/", "domain=" + impl.site_domain];
				if (max_age) {
					exp = new Date();
					exp.setTime(exp.getTime() + max_age * 1000);
					exp = exp.toGMTString();
					c.push("expires=" + exp);
				}

				if (nameval.length < 500) {
					d.cookie = c.join("; ");
					// confirm cookie was set (could be blocked by user's settings, etc.)
					savedval = this.getCookie(name);
					if (value === savedval) {
						return true;
					}
					BOOMR.warn("Saved cookie value doesn't match what we tried to set:\n" + value + "\n" + savedval);
				}
				else {
					BOOMR.warn("Cookie too long: " + nameval.length + " " + nameval);
				}

				return false;
			},

			getSubCookies: function(cookie) {
				var cookies_a,
				    i, l, kv,
				    gotcookies = false,
				    cookies = {};

				if (!cookie) {
					return null;
				}

				if (typeof cookie !== "string") {
					BOOMR.debug("TypeError: cookie is not a string: " + typeof cookie);
					return null;
				}

				cookies_a = cookie.split("&");

				for (i = 0, l = cookies_a.length; i < l; i++) {
					kv = cookies_a[i].split("=");
					if (kv[0]) {
						kv.push("");	// just in case there's no value
						cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
						gotcookies = true;
					}
				}

				return gotcookies ? cookies : null;
			},

			removeCookie: function(name) {
				return this.setCookie(name, {}, -86400);
			},

			/**
			 * Cleans up a URL by removing the query string (if configured), and
			 * limits the URL to the specified size.
			 *
			 * @param {string} url URL to clean
			 * @param {number} urlLimit Maximum size, in characters, of the URL
			 *
			 * @returns {string} Cleaned up URL
			 */
			cleanupURL: function(url, urlLimit) {
				if (!url || Object.prototype.toString.call(url) === "[object Array]") {
					return "";
				}

				if (impl.strip_query_string) {
					url = url.replace(/\?.*/, "?qs-redacted");
				}

				if (typeof urlLimit !== "undefined" && url && url.length > urlLimit) {
					// We need to break this URL up.  Try at the query string first.
					var qsStart = url.indexOf("?");
					if (qsStart !== -1 && qsStart < urlLimit) {
						url = url.substr(0, qsStart) + "?...";
					}
					else {
						// No query string, just stop at the limit
						url = url.substr(0, urlLimit - 3) + "...";
					}
				}

				return url;
			},

			hashQueryString: function(url, stripHash) {
				if (!url) {
					return url;
				}
				if (!url.match) {
					BOOMR.addError("TypeError: Not a string", "hashQueryString", typeof url);
					return "";
				}
				if (url.match(/^\/\//)) {
					url = location.protocol + url;
				}
				if (!url.match(/^(https?|file):/)) {
					BOOMR.error("Passed in URL is invalid: " + url);
					return "";
				}
				if (stripHash) {
					url = url.replace(/#.*/, "");
				}
				if (!BOOMR.utils.MD5) {
					return url;
				}
				return url.replace(/\?([^#]*)/, function(m0, m1) { return "?" + (m1.length > 10 ? BOOMR.utils.MD5(m1) : m1); });
			},

			pluginConfig: function(o, config, plugin_name, properties) {
				var i, props = 0;

				if (!config || !config[plugin_name]) {
					return false;
				}

				for (i = 0; i < properties.length; i++) {
					if (config[plugin_name][properties[i]] !== undefined) {
						o[properties[i]] = config[plugin_name][properties[i]];
						props++;
					}
				}

				return (props > 0);
			},
			/**
			 * `filter` for arrays
			 *
			 * @private
			 * @param {Array} array The array to iterate over.
			 * @param {Function} predicate The function invoked per iteration.
			 * @returns {Array} Returns the new filtered array.
			 */
			arrayFilter: function(array, predicate) {
				var result = [];

				if (typeof array.filter === "function") {
					result = array.filter(predicate);
				}
				else {
					var index = -1,
					    length = array.length,
					    value;

					while (++index < length) {
						value = array[index];
						if (predicate(value, index, array)) {
							result[result.length] = value;
						}
					}
				}
				return result;
			},
			/**
			 * @desc
			 * Add a MutationObserver for a given element and terminate after `timeout`ms.
			 * @param el		DOM element to watch for mutations
			 * @param config		MutationObserverInit object (https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit)
			 * @param timeout		Number of milliseconds of no mutations after which the observer should be automatically disconnected
			 * 			If set to a falsy value, the observer will wait indefinitely for Mutations.
			 * @param callback	Callback function to call either on timeout or if mutations are detected.  The signature of this method is:
			 * 				function(mutations, callback_data)
			 * 			Where:
			 * 				mutations is the list of mutations detected by the observer or `undefined` if the observer timed out
			 * 				callback_data is the passed in `callback_data` parameter without modifications
			 *
			 * 						The callback function may return a falsy value to disconnect the observer after it returns, or a truthy value to
			 * 			keep watching for mutations. If the return value is numeric and greater than 0, then this will be the new timeout
			 * 			if it is boolean instead, then the timeout will not fire any more so the caller MUST call disconnect() at some point
			 * @param callback_data	Any data to be passed to the callback function as its second parameter
			 * @param callback_ctx	An object that represents the `this` object of the `callback` method.  Leave unset the callback function is not a method of an object
			 *
			 * @returns {?object} - `null` if a MutationObserver could not be created OR
			 * 		- An object containing the observer and the timer object:
			 * 		  { observer: <MutationObserver>, timer: <Timeout Timer if any> }
			 *
			 * 		The caller can use this to disconnect the observer at any point by calling `retval.observer.disconnect()`
			 * 		Note that the caller should first check to see if `retval.observer` is set before calling `disconnect()` as it may
			 * 		have been cleared automatically.
			 */
			addObserver: function(el, config, timeout, callback, callback_data, callback_ctx) {
				var o = {observer: null, timer: null};

				if (!BOOMR.window || !BOOMR.window.MutationObserver || !callback || !el) {
					return null;
				}

				function done(mutations) {
					var run_again = false;

					if (o.timer) {
						clearTimeout(o.timer);
						o.timer = null;
					}

					if (callback) {
						run_again = callback.call(callback_ctx, mutations, callback_data);

						if (!run_again) {
							callback = null;
						}
					}

					if (!run_again && o.observer) {
						o.observer.disconnect();
						o.observer = null;
					}

					if (typeof run_again === "number" && run_again > 0) {
						o.timer = setTimeout(done, run_again);
					}
				}

				o.observer = new BOOMR.window.MutationObserver(done);

				if (timeout) {
					o.timer = setTimeout(done, o.timeout);
				}

				o.observer.observe(el, config);

				return o;
			},

			addListener: function(el, type, fn) {
				if (el.addEventListener) {
					el.addEventListener(type, fn, false);
				}
				else if (el.attachEvent) {
					el.attachEvent("on" + type, fn);
				}

				// ensure the type arry exists
				impl.listenerCallbacks[type] = impl.listenerCallbacks[type] || [];

				// save a reference to the target object and function
				impl.listenerCallbacks[type].push({ el: el, fn: fn});
			},

			removeListener: function(el, type, fn) {
				var i;

				if (el.removeEventListener) {
					el.removeEventListener(type, fn, false);
				}
				else if (el.detachEvent) {
					el.detachEvent("on" + type, fn);
				}

				if (impl.listenerCallbacks.hasOwnProperty(type)) {
					for (var i = 0; i < impl.listenerCallbacks[type].length; i++) {
						if (fn === impl.listenerCallbacks[type][i].fn &&
						    el === impl.listenerCallbacks[type][i].el) {
							impl.listenerCallbacks[type].splice(i, 1);
							return;
						}
					}
				}
			},

			pushVars: function(form, vars, prefix) {
				var k, i, l = 0, input;

				for (k in vars) {
					if (vars.hasOwnProperty(k)) {
						if (Object.prototype.toString.call(vars[k]) === "[object Array]") {
							for (i = 0; i < vars[k].length; ++i) {
								l += BOOMR.utils.pushVars(form, vars[k][i], k + "[" + i + "]");
							}
						}
						else {
							input = document.createElement("input");
							input.type = "hidden";	// we need `hidden` to preserve newlines. see commit message for more details
							input.name = (prefix ? (prefix + "[" + k + "]") : k);
							input.value = (vars[k] === undefined || vars[k] === null ? "" : vars[k]);

							form.appendChild(input);

							l += encodeURIComponent(input.name).length + encodeURIComponent(input.value).length + 2;
						}
					}
				}

				return l;
			},

			isArray: function(ary) {
				return Object.prototype.toString.call(ary) === "[object Array]";
			},

			inArray: function(val, ary) {
				var i;

				if (typeof val === "undefined" || typeof ary === "undefined" || !ary.length) {
					return false;
				}

				for (i = 0; i < ary.length; i++) {
					if (ary[i] === val) {
						return true;
					}
				}

				return false;
			},

			/**
			 * Get a query parameter value from a URL's query string
			 *
			 * @param {string} param Query parameter name
			 * @param {string|Object} [url] URL containing the query string, or a link object. Defaults to BOOMR.window.location
			 *
			 * @returns {string|null} URI decoded value or null if param isn't a query parameter
			 */
			getQueryParamValue: function(param, url) {
				var l, params, i, kv;
				if (!param) {
					return null;
				}

				if (typeof url === "string") {
					l = BOOMR.window.document.createElement("a");
					l.href = url;
				}
				else if (typeof url === "object" && typeof url.search === "string") {
					l = url;
				}
				else {
					l = BOOMR.window.location;
				}

				// Now that we match, pull out all query string parameters
				params = l.search.slice(1).split(/&/);

				for (i = 0; i < params.length; i++) {
					if (params[i]) {
						kv = params[i].split("=");
						if (kv.length && kv[0] === param) {
							return decodeURIComponent(kv[1].replace(/\+/g, " "));
						}
					}
				}
				return null;
			},

			/**
			 * Generates a pseudo-random UUID (Version 4):
			 * https://en.wikipedia.org/wiki/Universally_unique_identifier
			 *
			 * @returns {string} UUID
			 */
			generateUUID: function() {
				return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
					var r = Math.random() * 16 | 0;
					var v = c === "x" ? r : (r & 0x3 | 0x8);
					return v.toString(16);
				});
			},

			/**
			 * Generates a random ID based on the specified number of characters.  Uses
			 * characters a-z0-9.
			 *
			 * @param {number} chars Number of characters (max 40)
			 * @returns {string} Random ID
			 */
			generateId: function(chars) {
				return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".substr(0, chars || 40).replace(/x/g, function(c) {
					var c = (Math.random() || 0.01).toString(36);

					// some implementations may return "0" for small numbers
					if (c === "0") {
						return "0";
					}
					else {
						return c.substr(2, 1);
					}
				});
			}
		},

		init: function(config) {
			var i, k,
			    properties = [
				    "beacon_url",
				    "beacon_type",
				    "beacon_auth_key",
				    "beacon_auth_token",
				    "site_domain",
				    "user_ip",
				    "strip_query_string",
				    "secondary_beacons",
				    "autorun",
				    "site_domain"
			    ];

			BOOMR_check_doc_domain();

			if (!config) {
				config = {};
			}

			if (!this.pageId) {
				// generate a random page ID for this page's lifetime
				this.pageId = BOOMR.utils.generateId(8);
			}

			if (config.primary && impl.handlers_attached) {
				return this;
			}

			if (config.log !== undefined) {
				this.log = config.log;
			}
			if (!this.log) {
				this.log = function(/* m,l,s */) {};
			}

			// Set autorun if in config right now, as plugins that listen for page_ready
			// event may fire when they .init() if onload has already fired, and whether
			// or not we should fire page_ready depends on config.autorun.
			if (typeof config.autorun !== "undefined") {
				impl.autorun = config.autorun;
			}

			for (k in this.plugins) {
				if (this.plugins.hasOwnProperty(k)) {
					// config[plugin].enabled has been set to false
					if (config[k] &&
					    config[k].hasOwnProperty("enabled") &&
					    config[k].enabled === false) {
						impl.disabled_plugins[k] = 1;

						if (typeof this.plugins[k].disable === "function") {
							this.plugins[k].disable();
						}

						continue;
					}

					// plugin was previously disabled
					if (impl.disabled_plugins[k]) {

						// and has not been explicitly re-enabled
						if (!config[k] ||
						    !config[k].hasOwnProperty("enabled") ||
						    config[k].enabled !== true) {
							continue;
						}

						if (typeof this.plugins[k].enable === "function") {
							this.plugins[k].enable();
						}

						// plugin is now enabled
						delete impl.disabled_plugins[k];
					}

					// plugin exists and has an init method
					if (typeof this.plugins[k].init === "function") {
						try {
							this.plugins[k].init(config);
						}
						catch (err) {
							BOOMR.addError(err, k + ".init");
						}
					}
				}
			}

			for (i = 0; i < properties.length; i++) {
				if (config[properties[i]] !== undefined) {
					impl[properties[i]] = config[properties[i]];
				}
			}

			if (impl.handlers_attached) {
				return this;
			}

			// The developer can override onload by setting autorun to false
			if (!impl.onloadfired && (config.autorun === undefined || config.autorun !== false)) {
				if (d.readyState && d.readyState === "complete") {
					BOOMR.loadedLate = true;
					this.setImmediate(BOOMR.page_ready_autorun, null, null, BOOMR);
				}
				else {
					if (w.onpagehide || w.onpagehide === null) {
						BOOMR.utils.addListener(w, "pageshow", BOOMR.page_ready_autorun);
					}
					else {
						BOOMR.utils.addListener(w, "load", BOOMR.page_ready_autorun);
					}
				}
			}

			BOOMR.utils.addListener(w, "DOMContentLoaded", function() { impl.fireEvent("dom_loaded"); });
			BOOMR.fireEvent("onconfig", config);
			BOOMR.subscribe("onconfig", function(beaconConfig) {
				if (beaconConfig.beacon_url) {
					impl.beacon_url = beaconConfig.beacon_url;
				}
			});

			BOOMR.subscribe("spa_navigation", impl.spaNavigation, null, impl);

			(function() {
				var forms, iterator;
				if (visibilityChange !== undefined) {
					BOOMR.utils.addListener(d, visibilityChange, function() { impl.fireEvent("visibility_changed"); });

					// save the current visibility state
					impl.lastVisibilityState = BOOMR.visibilityState();

					BOOMR.subscribe("visibility_changed", function() {
						var visState = BOOMR.visibilityState();

						// record the last time each visibility state occurred
						BOOMR.lastVisibilityEvent[visState] = BOOMR.now();
						BOOMR.debug("Visibility changed from " + impl.lastVisibilityState + " to " + visState);

						// if we transitioned from prerender to hidden or visible, fire the prerender_to_visible event
						if (impl.lastVisibilityState === "prerender" &&
						    visState !== "prerender") {
							// note that we transitioned from prerender on the beacon for debugging
							BOOMR.addVar("vis.pre", "1");

							// let all listeners know
							impl.fireEvent("prerender_to_visible");
						}

						impl.lastVisibilityState = visState;
					});
				}

				BOOMR.utils.addListener(d, "mouseup", impl.xb_handler("click"));

				forms = d.getElementsByTagName("form");
				for (iterator = 0; iterator < forms.length; iterator++) {
					BOOMR.utils.addListener(forms[iterator], "submit", impl.xb_handler("form_submit"));
				}

				if (!w.onpagehide && w.onpagehide !== null) {
					// This must be the last one to fire
					// We only clear w on browsers that don't support onpagehide because
					// those that do are new enough to not have memory leak problems of
					// some older browsers
					BOOMR.utils.addListener(w, "unload", function() { BOOMR.window = w = null; });
				}
			}());

			impl.handlers_attached = true;
			return this;
		},

		/**
		 * Attach a callback to the onload event if the onload has not
		 * been fired yet
		 *
		 * @param {function} cb - Callback to run when onload fires or page is visible (pageshow)
		 */
		attach_page_ready: function(cb) {
			if (d.readyState && d.readyState === "complete") {
				this.setImmediate(cb, null, null, BOOMR);
			}
			else {
				if (w.onpagehide || w.onpagehide === null) {
					BOOMR.utils.addListener(w, "pageshow", cb);
				}
				else {
					BOOMR.utils.addListener(w, "load", cb);
				}
			}
		},

		/**
		 * Sends the page_ready beacon only if 'autorun' is still true after init
		 * is called.
		 */
		page_ready_autorun: function(ev) {
			if (impl.autorun) {
				BOOMR.page_ready(ev);
			}
		},

		// The page dev calls this method when they determine the page is usable.
		// Only call this if autorun is explicitly set to false
		page_ready: function(ev) {
			if (!ev) { ev = w.event; }
			if (!ev) { ev = { name: "load" }; }
			if (impl.onloadfired) {
				return this;
			}
			impl.fireEvent("page_ready", ev);
			impl.onloadfired = true;
			return this;
		},

		/**
		 * Determines whether or not the page's `onload` event has fired, or
		 * if `autorun` is false, whether `BOOMR.page_ready()` was called.
		 *
		 * @returns {boolean} True if onload or page_ready() were called
		 */
		onloadFired: function() {
			return impl.onloadfired;
		},

		/**
		 * Defer the function `fn` until the next instant the browser is free from user tasks
		 * @param [Function] fn The callback function.  This function accepts the following arguments:
		 *     - data: The passed in data object
		 *     - cb_data: The passed in cb_data object
		 *     - call stack: An Error object that holds the callstack for when setImmediate was called, used to determine what called the callback
		 * @param [object] data Any data to pass to the callback function
		 * @param [object] cb_data Any passthrough data for the callback function. This differs from `data` when setImmediate is called via an event handler and `data` is the Event object
		 * @param [object] cb_scope The scope of the callback function if it is a method of an object
		 * @returns nothing
		 */
		setImmediate: function(fn, data, cb_data, cb_scope) {
			var cb, cstack;

			// DEBUG: This is to help debugging, we'll see where setImmediate calls were made from
			if (typeof Error !== "undefined") {
				cstack = new Error();
				cstack = cstack.stack ? cstack.stack.replace(/^Error/, "Called") : undefined;
			}
			// END-DEBUG

			cb = function() {
				fn.call(cb_scope || null, data, cb_data || {}, cstack);
				cb = null;
			};

			if (w.requestIdleCallback) {
				w.requestIdleCallback(cb);
			}
			else if (w.setImmediate) {
				w.setImmediate(cb);
			}
			else {
				setTimeout(cb, 10);
			}
		},

		/**
		 * Gets the current time in milliseconds since the Unix Epoch (Jan 1 1970).
		 *
		 * In browsers that support DOMHighResTimeStamp, this will be replaced
		 * by a function that adds BOOMR.now() to navigationStart
		 * (with milliseconds.microseconds resolution).
		 *
		 * @returns {Number} Milliseconds since Unix Epoch
		 */
		now: (function() {
			return Date.now || function() { return new Date().getTime(); };
		}()),

		getPerformance: function() {
			try {
				if (BOOMR.window) {
					if ("performance" in BOOMR.window && BOOMR.window.performance) {
						return BOOMR.window.performance;
					}

					// vendor-prefixed fallbacks
					return BOOMR.window.msPerformance || BOOMR.window.webkitPerformance || BOOMR.window.mozPerformance;
				}
			}
			catch (ignore) {
				// empty
			}
		},

		visibilityState: (visibilityState === undefined ? function() { return "visible"; } : function() { return d[visibilityState]; }),

		lastVisibilityEvent: {},

		/**
		 * Registers an event
		 *
		 * @param {string} e_name Event name
		 *
		 * @returns {BOOMR} Boomerang object
		 */
		registerEvent: function(e_name) {
			if (impl.events.hasOwnProperty(e_name)) {
				// already registered
				return this;
			}

			// create a new queue of handlers
			impl.events[e_name] = [];

			return this;
		},

		/**
		 * Disables boomerang from doing anything further:
		 * 1. Clears event handlers (such as onload)
		 * 2. Clears all event listeners
		 */
		disable: function() {
			impl.clearEvents();
			impl.clearListeners();
		},

		/**
		 * Fires an event
		 *
		 * @param {string} e_name Event name
		 * @param {object} data Event payload
		 *
		 * @returns {BOOMR} Boomerang object
		 */
		fireEvent: function(e_name, data) {
			return impl.fireEvent(e_name, data);
		},

		subscribe: function(e_name, fn, cb_data, cb_scope, once) {
			var i, handler, ev;

			e_name = e_name.toLowerCase();

			if (!impl.events.hasOwnProperty(e_name)) {
				// allow subscriptions before they're registered
				impl.events[e_name] = [];
			}

			ev = impl.events[e_name];

			// don't allow a handler to be attached more than once to the same event
			for (i = 0; i < ev.length; i++) {
				handler = ev[i];
				if (handler && handler.fn === fn && handler.cb_data === cb_data && handler.scope === cb_scope) {
					return this;
				}
			}

			ev.push({
				fn: fn,
				cb_data: cb_data || {},
				scope: cb_scope || null,
				once: once || false
			});

			// attaching to page_ready after onload fires, so call soon
			if (e_name === "page_ready" && impl.onloadfired && impl.autorun) {
				this.setImmediate(fn, null, cb_data, cb_scope);
			}

			// Attach unload handlers directly to the window.onunload and
			// window.onbeforeunload events. The first of the two to fire will clear
			// fn so that the second doesn't fire. We do this because technically
			// onbeforeunload is the right event to fire, but all browsers don't
			// support it.  This allows us to fall back to onunload when onbeforeunload
			// isn't implemented
			if (e_name === "page_unload" || e_name === "before_unload") {
				(function() {
					var unload_handler, evt_idx = ev.length;

					unload_handler = function(evt) {
						if (fn) {
							fn.call(cb_scope, evt || w.event, cb_data);
						}

						// If this was the last unload handler, we'll try to send the beacon immediately after it is done
						// The beacon will only be sent if one of the handlers has queued it
						if (e_name === "page_unload" && evt_idx === impl.events[e_name].length) {
							BOOMR.real_sendBeacon();
						}
					};

					if (e_name === "page_unload") {
						// pagehide is for iOS devices
						// see http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
						if (w.onpagehide || w.onpagehide === null) {
							BOOMR.utils.addListener(w, "pagehide", unload_handler);
						}
						else {
							BOOMR.utils.addListener(w, "unload", unload_handler);
						}
					}
					BOOMR.utils.addListener(w, "beforeunload", unload_handler);
				}());
			}

			return this;
		},

		addError: function BOOMR_addError(err, src, extra) {
			var str, E = BOOMR.plugins.Errors;

			//
			// Use the Errors plugin if it's enabled
			//
			if (E && E.is_supported()) {
				if (typeof err === "string") {
					E.send({
						message: err,
						extra: extra,
						functionName: src,
						noStack: true
					}, E.VIA_APP, E.SOURCE_BOOMERANG);
				}
				else {
					if (typeof src === "string") {
						err.functionName = src;
					}

					if (typeof extra !== "undefined") {
						err.extra = extra;
					}

					E.send(err, E.VIA_APP, E.SOURCE_BOOMERANG);
				}

				return;
			}

			if (typeof err !== "string") {
				str = String(err);
				if (str.match(/^\[object/)) {
					str = err.name + ": " + (err.description || err.message).replace(/\r\n$/, "");
				}
				err = str;
			}
			if (src !== undefined) {
				err = "[" + src + ":" + BOOMR.now() + "] " + err;
			}
			if (extra) {
				err += ":: " + extra;
			}

			if (impl.errors[err]) {
				impl.errors[err]++;
			}
			else {
				impl.errors[err] = 1;
			}
		},

		isCrossOriginError: function(err) {
			// These are expected for cross-origin iframe access, although the Internet Explorer check will only
			// work for browsers using English.
			return err.name === "SecurityError" ||
				(err.name === "TypeError" && err.message === "Permission denied") ||
				(err.name === "Error" && err.message && err.message.match(/^(Permission|Access is) denied/));
		},

		addVar: function(name, value) {
			if (typeof name === "string") {
				impl.vars[name] = value;
			}
			else if (typeof name === "object") {
				var o = name, k;
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						impl.vars[k] = o[k];
					}
				}
			}
			return this;
		},

		removeVar: function(arg0) {
			var i, params;
			if (!arguments.length) {
				return this;
			}

			if (arguments.length === 1 &&
			    Object.prototype.toString.apply(arg0) === "[object Array]") {
				params = arg0;
			}
			else {
				params = arguments;
			}

			for (i = 0; i < params.length; i++) {
				if (impl.vars.hasOwnProperty(params[i])) {
					delete impl.vars[params[i]];
				}
			}

			return this;
		},

		hasVar: function(name) {
			return impl.vars.hasOwnProperty(name);
		},

		/**
		 * Sets a variable's priority in the beacon URL.
		 * -1 = beginning of the URL
		 * 0  = middle of the URL (default)
		 * 1  = end of the URL
		 *
		 * @param {string} name Variable name
		 * @param {number} pri Priority (-1 or 1)
		 */
		setVarPriority: function(name, pri) {
			if (typeof pri !== "number" || Math.abs(pri) !== 1) {
				return this;
			}

			impl.varPriority[pri][name] = 1;

			return this;
		},

		/**
		 * Sets the Referrers
		 * @param {string} r Referrer from the cookie
		 * @param {string} [r2] Referrer from document.referrer, if different
		 */
		setReferrer: function(r, r2) {
			// cookie referrer
			impl.r = r;

			// document.referrer, if different
			if (r2 && r !== r2) {
				impl.r2 = r2;
			}
			else {
				impl.r2 = undefined;
			}
		},

		requestStart: function(name) {
			var t_start = BOOMR.now();
			BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);

			return {
				loaded: function(data) {
					BOOMR.responseEnd(name, t_start, data);
				}
			};
		},

		/**
		 * Determines is Boomerang can send a beacon.
		 *
		 * Queryies all plugins to see if they implement readyToSend(),
		 * and if so, that they return true;
		 *
		 * If not, the beacon cannot be sent.
		 *
		 * @returns {boolean} True if Boomerang can send a beacon
		 */
		readyToSend: function() {
			var plugin;

			for (plugin in this.plugins) {
				if (this.plugins.hasOwnProperty(plugin)) {
					if (impl.disabled_plugins[plugin]) {
						continue;
					}

					if (typeof this.plugins[plugin].readyToSend === "function" &&
					    this.plugins[plugin].readyToSend() === false) {
						BOOMR.debug("Plugin " + plugin + " is not ready to send");
						return false;
					}
				}
			}

			return true;
		},

		responseEnd: function(name, t_start, data, t_end) {
			// take the now timestamp for start and end, if unspecified, in case we delay this beacon
			t_start = typeof t_start === "number" ? t_start : BOOMR.now();
			t_end = typeof t_end === "number" ? t_end : BOOMR.now();

			// wait until all plugins are ready to send
			if (!BOOMR.readyToSend()) {
				BOOMR.debug("Attempted to call responseEnd before all plugins were Ready to Send, trying again...");

				// try again later
				setTimeout(function() {
					BOOMR.responseEnd(name, t_start, data, t_end);
				}, 1000);

				return;
			}

			// Wait until we've sent the Page Load beacon first
			if (!BOOMR.hasSentPageLoadBeacon() &&
			    !BOOMR.utils.inArray(name.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// wait for a beacon, then try again
				BOOMR.subscribe("page_load_beacon", function() {
					BOOMR.responseEnd(name, t_start, data, t_end);
				}, null, BOOMR, true);

				return;
			}

			if (typeof name === "object") {
				if (!name.url) {
					BOOMR.debug("BOOMR.responseEnd: First argument must have a url property if it's an object");
					return;
				}

				impl.fireEvent("xhr_load", name);
			}
			else {
				// flush out any queue'd beacons before we set the Page Group
				// and timers
				BOOMR.real_sendBeacon();

				BOOMR.addVar("xhr.pg", name);
				BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);
				impl.fireEvent("xhr_load", {
					name: "xhr_" + name,
					data: data,
					timing: {
						loadEventEnd: t_end
					}
				});
			}
		},

		//
		// uninstrumentXHR and instrumentXHR are stubs that will be replaced
		// by auto-xhr.js if active.
		//
		/**
		 * Undo XMLHttpRequest instrumentation and reset the original
		 */
		uninstrumentXHR: function() {
		},
		/**
		 * Instrument all requests made via XMLHttpRequest to send beacons
		 * This is implemented in plugins/auto-xhr.js
		 */
		instrumentXHR: function() { },

		sendBeacon: function(beacon_url_override) {
			// This plugin wants the beacon to go somewhere else,
			// so update the location
			if (beacon_url_override) {
				impl.beacon_url_override = beacon_url_override;
			}

			if (!impl.beaconQueued) {
				impl.beaconQueued = true;
				BOOMR.setImmediate(BOOMR.real_sendBeacon, null, null, BOOMR);
			}

			return true;
		},

		real_sendBeacon: function() {
			var k, form, url, img, errors = [], params = [], paramsJoined, useImg = 1,
			    varsSent = {}, varsToSend = {}, urlFirst = [], urlLast = [],
			    xhr;

			if (!impl.beaconQueued) {
				return false;
			}

			impl.beaconQueued = false;

			BOOMR.debug("Checking if we can send beacon");

			// At this point someone is ready to send the beacon.  We send
			// the beacon only if all plugins have finished doing what they
			// wanted to do
			for (k in this.plugins) {
				if (this.plugins.hasOwnProperty(k)) {
					if (impl.disabled_plugins[k]) {
						continue;
					}
					if (!this.plugins[k].is_complete()) {
						BOOMR.debug("Plugin " + k + " is not complete, deferring beacon send");
						return false;
					}
				}
			}

			// Sanity test that the browser is still available (and not shutting down)
			if (!window || !window.Image || !window.navigator || !BOOMR.window) {
				BOOMR.debug("DOM not fully available, not sending a beacon");
				return false;
			}

			// For SPA apps, don't strip hashtags as some SPA frameworks use #s for tracking routes
			// instead of History pushState() APIs. Use d.URL instead of location.href because of a
			// Safari bug.
			var isSPA = BOOMR.utils.inArray(impl.vars["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS);
			var isPageLoad = typeof impl.vars["http.initiator"] === "undefined" || isSPA;

			var pgu = isSPA ? d.URL : d.URL.replace(/#.*/, "");
			impl.vars.pgu = BOOMR.utils.cleanupURL(pgu);

			// Use the current document.URL if it hasn't already been set, or for SPA apps,
			// on each new beacon (since each SPA soft navigation might change the URL)
			if (!impl.vars.u || isSPA) {
				impl.vars.u = impl.vars.pgu;
			}

			if (impl.vars.pgu === impl.vars.u) {
				delete impl.vars.pgu;
			}

			// Add cleaned-up referrer URLs to the beacon, if available
			if (impl.r) {
				impl.vars.r = BOOMR.utils.cleanupURL(impl.r);
			}
			else {
				delete impl.vars.r;
			}

			if (impl.r2) {
				impl.vars.r2 = BOOMR.utils.cleanupURL(impl.r2);
			}
			else {
				delete impl.vars.r2;
			}

			impl.vars.v = BOOMR.version;

			if (BOOMR.visibilityState()) {
				impl.vars["vis.st"] = BOOMR.visibilityState();
				if (BOOMR.lastVisibilityEvent.visible) {
					impl.vars["vis.lv"] = BOOMR.now() - BOOMR.lastVisibilityEvent.visible;
				}
				if (BOOMR.lastVisibilityEvent.hidden) {
					impl.vars["vis.lh"] = BOOMR.now() - BOOMR.lastVisibilityEvent.hidden;
				}
			}

			impl.vars["ua.plt"] = navigator.platform;
			impl.vars["ua.vnd"] = navigator.vendor;

			if (this.pageId) {
				impl.vars.pid = this.pageId;
			}

			if (w !== window) {
				impl.vars["if"] = "";
			}

			for (k in impl.errors) {
				if (impl.errors.hasOwnProperty(k)) {
					errors.push(k + (impl.errors[k] > 1 ? " (*" + impl.errors[k] + ")" : ""));
				}
			}

			if (errors.length > 0) {
				impl.vars.errors = errors.join("\n");
			}

			impl.errors = {};

			// If we reach here, all plugins have completed
			impl.fireEvent("before_beacon", impl.vars);

			// Use the override URL if given
			impl.beacon_url = impl.beacon_url_override || impl.beacon_url;

			// Don't send a beacon if no beacon_url has been set
			// you would do this if you want to do some fancy beacon handling
			// in the `before_beacon` event instead of a simple GET request
			BOOMR.debug("Ready to send beacon: " + BOOMR.utils.objectToString(impl.vars));
			if (!impl.beacon_url) {
				BOOMR.debug("No beacon URL, so skipping.");
				return true;
			}

			//
			// Try to send an IMG beacon if possible (which is the most compatible),
			// otherwise send an XHR beacon if the  URL length is longer than 2,000 bytes.
			//

			// clone the vars object for two reasons: first, so all listeners of
			// onbeacon get an exact clone (in case listeners are doing
			// BOOMR.removeVar), and second, to help build our priority list of vars.
			for (k in impl.vars) {
				if (impl.vars.hasOwnProperty(k)) {
					varsSent[k] = impl.vars[k];
					varsToSend[k] = impl.vars[k];
				}
			}

			// get high- and low-priority variables first, which remove any of
			// those vars from varsToSend
			urlFirst = this.getVarsOfPriority(varsToSend, -1);
			urlLast  = this.getVarsOfPriority(varsToSend, 1);

			// merge the 3 lists
			params = urlFirst.concat(this.getVarsOfPriority(varsToSend, 0), urlLast);
			paramsJoined = params.join("&");

			// if there are already url parameters in the beacon url,
			// change the first parameter prefix for the boomerang url parameters to &
			url = impl.beacon_url + ((impl.beacon_url.indexOf("?") > -1) ? "&" : "?") + paramsJoined;

			if (impl.beacon_type === "POST" || url.length > BOOMR.constants.MAX_GET_LENGTH) {
				// switch to a XHR beacon if the the user has specified a POST OR GET length is too long
				useImg = false;
			}

			BOOMR.removeVar("qt");

			// If we reach here, we've transferred all vars to the beacon URL.
			// The only thing that can stop it now is if we're rate limited
			impl.fireEvent("onbeacon", varsSent);

			// keep track of page load beacons
			if (!impl.hasSentPageLoadBeacon && isPageLoad) {
				impl.hasSentPageLoadBeacon = true;

				// let this beacon go out first
				BOOMR.setImmediate(function() {
					impl.fireEvent("page_load_beacon", varsSent);
				});
			}

			if (params.length === 0) {
				// do not make the request if there is no data
				return this;
			}

			if (!BOOMR.orig_XMLHttpRequest && (!BOOMR.window || !BOOMR.window.XMLHttpRequest)) {
				// if we don't have XHR available, force an image beacon and hope
				// for the best
				useImg = true;
			}

			if (useImg) {
				// just in case Image isn't a valid constructor
				try {
					img = new Image();
				}
				catch (e) {
					BOOMR.debug("Image is not a constructor, not sending a beacon");
					return false;
				}

				img.src = url;

				if (impl.secondary_beacons) {
					for (k = 0; k < impl.secondary_beacons.length; k++) {
						url = impl.secondary_beacons[k] + "?" + paramsJoined;

						img = new Image();
						img.src = url;
					}
				}
			}
			else {
				// Send a form-encoded XHR POST beacon
				xhr = new (BOOMR.window.orig_XMLHttpRequest || BOOMR.orig_XMLHttpRequest || BOOMR.window.XMLHttpRequest)();
				try {
					this.sendXhrPostBeacon(xhr, paramsJoined);
				}
				catch (e) {
					// if we had an exception with the window XHR object, try our IFRAME XHR
					xhr = new BOOMR.boomerang_frame.XMLHttpRequest();
					this.sendXhrPostBeacon(xhr, paramsJoined);
				}
			}

			return true;
		},

		/**
		 * Determines whether or not a Page Load beacon has been sent.
		 *
		 * @returns {boolean} True if a Page Load beacon has been sent.
		 */
		hasSentPageLoadBeacon: function() {
			return impl.hasSentPageLoadBeacon;
		},

		/**
		 * Sends an XHR beacon
		 *
		 * @param {object} xhr XMLHttpRequest object
		 * @param {object} [paramsJoined] XMLHttpRequest.send() argument
		 */
		sendXhrPostBeacon: function(xhr, paramsJoined) {
			xhr.open("POST", impl.beacon_url);

			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

			if (typeof impl.beacon_auth_token !== "undefined") {
				if (typeof impl.beacon_auth_key === "undefined") {
					impl.beacon_auth_key = "Authorization";
				}

				xhr.setRequestHeader(impl.beacon_auth_key, impl.beacon_auth_token);
			}

			xhr.send(paramsJoined);
		},

		/**
		 * Gets all variables of the specified priority
		 *
		 * @param {object} vars Variables (will be modified for pri -1 and 1)
		 * @param {number} pri Priority (-1, 0, or 1)
		 *
		 * @return {string[]} Array of URI-encoded vars
		 */
		getVarsOfPriority: function(vars, pri) {
			var name, url = [];

			if (pri !== 0) {
				// if we were given a priority, iterate over that list
				for (name in impl.varPriority[pri]) {
					if (impl.varPriority[pri].hasOwnProperty(name)) {
						// if this var is set, add it to our URL array
						if (vars.hasOwnProperty(name)) {
							url.push(this.getUriEncodedVar(name, vars[name]));

							// remove this name from vars so it isn't also added
							// to the non-prioritized list when pri=0 is called
							delete vars[name];
						}
					}
				}
			}
			else {
				// if we weren't given a priority, iterate over all of the vars
				// that are left (from not being removed via earlier pri -1 or 1)
				for (name in vars) {
					if (vars.hasOwnProperty(name)) {
						url.push(this.getUriEncodedVar(name, vars[name]));
					}
				}
			}

			return url;
		},

		/**
		 * Gets a URI-encoded name/value pair.
		 *
		 * @param {string} name Name
		 * @param {string} value Value
		 *
		 * @returns {string} URI-encoded string
		 */
		getUriEncodedVar: function(name, value) {
			var result = encodeURIComponent(name) +
				"=" +
				(
					value === undefined || value === null ?
						"" :
						encodeURIComponent(value)
				);

			return result;
		},

		/**
		 * Gets the latest ResourceTiming entry for the specified URL
		 * Default sort order is chronological startTime
		 * @param {string} url Resource URL
		 * @param {function} [sort] Sort the entries before returning the last one
		 * @returns {PerformanceEntry|undefined} Entry, or undefined if ResourceTiming is not
		 *          supported or if the entry doesn't exist
		 */
		getResourceTiming: function(url, sort) {
			var entries;

			try {
				if (BOOMR.getPerformance() &&
				    typeof BOOMR.getPerformance().getEntriesByName === "function") {
					entries = BOOMR.getPerformance().getEntriesByName(url);
					if (entries && entries.length) {
						if (typeof sort === "function") {
							entries.sort(sort);
						}
						return entries[entries.length - 1];
					}
				}
			}
			catch (ignore) {
				// empty
			}
		}

	};

	delete BOOMR_start;

	if (typeof BOOMR_lstart === "number") {
		boomr.t_lstart = BOOMR_lstart;
		delete BOOMR_lstart;
	}
	else if (typeof BOOMR.window.BOOMR_lstart === "number") {
		boomr.t_lstart = BOOMR.window.BOOMR_lstart;
	}

	if (typeof BOOMR.window.BOOMR_onload === "number") {
		boomr.t_onload = BOOMR.window.BOOMR_onload;
	}

	(function() {
		var make_logger;

		if (typeof console === "object" && console.log !== undefined) {
			boomr.log = function(m, l, s) { console.log(s + ": [" + l + "] " + m); };
		}

		make_logger = function(l) {
			return function(m, s) {
				this.log(m, l, "boomerang" + (s ? "." + s : ""));
				return this;
			};
		};

		boomr.debug = make_logger("debug");
		boomr.info = make_logger("info");
		boomr.warn = make_logger("warn");
		boomr.error = make_logger("error");
	}());

	// If the browser supports performance.now(), swap that in for BOOMR.now
	try {
		var p = boomr.getPerformance();
		if (p &&
		    typeof p.now === "function" &&
		    /\[native code\]/.test(String(p.now)) &&		// #545 handle bogus performance.now from broken shims
		    p.timing &&
		    p.timing.navigationStart) {
			boomr.now = function() {
				return Math.round(p.now() + p.timing.navigationStart);
			};
		}
	}
	catch (ignore) {
		// empty
	}

	(function() {
		var ident;
		for (ident in boomr) {
			if (boomr.hasOwnProperty(ident)) {
				BOOMR[ident] = boomr[ident];
			}
		}
		if (!BOOMR.xhr_excludes) {
			//! URLs to exclude from automatic XHR instrumentation
			BOOMR.xhr_excludes = {};
		}
	}());

	dispatchEvent("onBoomerangLoaded", { "BOOMR": BOOMR }, true);

}(window));

// end of boomerang beaconing section
;(function() {
	var d, handler, a, impl,
	    singlePageApp = false,
	    autoXhrEnabled = false,
	    alwaysSendXhr = false,
	    readyStateMap = [ "uninitialized", "open", "responseStart", "domInteractive", "responseEnd" ],
	    ie10or11;

	/**
	 * @constant
	 * @desc
	 * Single Page Applications get an additional timeout for all XHR Requests to settle in.
	 * This is used after collecting resources for a SPA routechange
	 * @type {number}
	 * @default
	 */
	var SPA_TIMEOUT = 1000;

	/**
	 * How long to wait if we're not ready to send a beacon to try again.
	 * @constant
	 * @type {number}
	 * @default
	 */
	var READY_TO_SEND_WAIT = 500;

	/**
	 * @constant
	 * @desc Timeout event fired for XMLHttpRequest resource
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_TIMEOUT        = -1001;
	/**
	 * @constant
	 * @desc XMLHttpRequest was aborted
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_ABORT          = -999;
	/**
	 * @constant
	 * @desc An error code was returned by the HTTP Server
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_ERROR          = -998;
	/**
	 * @constant
	 * @desc An exception occured as we tried to request resource
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_OPEN_EXCEPTION = -997;

	// Default resources to count as Back-End during a SPA nav
	var SPA_RESOURCES_BACK_END = ["xmlhttprequest", "script"];

	// If this browser cannot support XHR, we'll just skip this plugin which will
	// save us some execution time.

	// XHR not supported or XHR so old that it doesn't support addEventListener
	// (IE 6, 7, 8, as well as newer running in quirks mode.)
	if (!window.XMLHttpRequest || !(new XMLHttpRequest()).addEventListener) {
		// Nothing to instrument
		return;
	}

	// User-agent sniff IE 10 and IE 11 to apply a workaround for an XHR bug (see below when
	// this variable is used).  We can only detect this bug by UA sniffing.  IE 11 requires a
	// different way of detection than IE 11.
	ie10or11 = (window.navigator && navigator.appVersion && navigator.appVersion.indexOf("MSIE 10") !== -1) ||
	           (window.navigator && navigator.userAgent && navigator.userAgent.match(/Trident.*rv[ :]*11\./));

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.AutoXHR) {
		return;
	}

	function log(msg) {
		BOOMR.debug(msg, "AutoXHR");
	}
	/**
	 * @memberof AutoXHR
	 * @desc
	 * Tries to resolve href links from relative URLs
	 * This implementation takes into account a bug in the way IE handles relative paths on anchors and resolves this
	 * by assigning a.href to itself which triggers the URL resolution in IE and will fix missing leading slashes if
	 * necessary
	 *
	 * @param {string} anchor - the anchor object to resolve
	 * @returns {string} - The unrelativized URL href
	 */
	function getPathName(anchor) {
		if (!anchor) {
			return null;
		}

		/*
		 correct relativism in IE
		 anchor.href = "./path/file";
		 anchor.pathname == "./path/file"; //should be "/path/file"
		 */
		anchor.href = anchor.href;

		/*
		 correct missing leading slash in IE
		 anchor.href = "path/file";
		 anchor.pathname === "path/file"; //should be "/path/file"
		 */
		var pathName = anchor.pathname;
		if (pathName.charAt(0) !== "/") {
			pathName = "/" + pathName;
		}

		return pathName;
	}

	/**
	 * @memberof AutoXHR
	 * @private
	 * @desc
	 * Based on the contents of BOOMR.xhr_excludes check if the URL that we instrumented as XHR request
	 * matches any of the URLs we are supposed to not send a beacon about.
	 *
	 * @param {HTMLAnchorElement} anchor - <a> element with URL of the element checked agains BOOMR.xhr_excludes
	 * @returns {boolean} - `true` if intended to be excluded, `false` if it is not in the list of excludables
	 */
	function shouldExcludeXhr(anchor) {
		if (anchor.href && anchor.href.match(/^(about:|javascript:|data:)/i)) {
			return true;
		}

		return BOOMR.xhr_excludes.hasOwnProperty(anchor.href) ||
			BOOMR.xhr_excludes.hasOwnProperty(anchor.hostname) ||
			BOOMR.xhr_excludes.hasOwnProperty(getPathName(anchor));
	}

	/**
	 * @class MutationHandler
	 * @desc
	 * If MutationObserver is supported on the browser we are running on this will handle [case 1]{@link AutoXHR#description} of the AutoXHR
	 * class.
	 */

	/**
	 * @constructor
	 */
	function MutationHandler() {
		this.watch = 0;
		this.timer = null;

		this.pending_events = [];
	}

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Disable internal MutationObserver instance. Use this when uninstrumenting the site we're on.
	 */
	MutationHandler.stop = function() {
		MutationHandler.pause();
		MutationHandler.observer = null;
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Pauses the MutationObserver.  Call [resume]{@link handler#resume} to start it back up.
	 */
	MutationHandler.pause = function() {
		if (MutationHandler.observer &&
		    MutationHandler.observer.observer &&
		    !MutationHandler.isPaused) {
			MutationHandler.isPaused = true;
			MutationHandler.observer.observer.disconnect();
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Resumes the MutationObserver after a [pause]{@link handler#pause}.
	 */
	MutationHandler.resume = function() {
		if (MutationHandler.observer &&
		    MutationHandler.observer.observer &&
		    MutationHandler.isPaused) {
			MutationHandler.isPaused = false;
			MutationHandler.observer.observer.observe(d, MutationHandler.observer.config);
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Initiate {@link MutationHandler.observer} on the [outer parent document]{@link BOOMR.window.document}.
	 * Uses [addObserver}{@link BOOMR.utils.addObserver} to instrument. [Our internal handler]{@link handler#mutation_cb}
	 * will be called if something happens
	 */
	MutationHandler.start = function() {
		if (MutationHandler.observer) {
			// don't start twice
			return;
		}

		var config = {
			childList: true,
			attributes: true,
			subtree: true,
			attributeFilter: ["src", "href"]
		};

		// Add a perpetual observer
		MutationHandler.observer = BOOMR.utils.addObserver(
			d,
			config,
			null, // no timeout
			handler.mutation_cb, // will always return true
			null, // no callback data
			handler
		);

		if (MutationHandler.observer) {
			MutationHandler.observer.config = config;

			BOOMR.subscribe("page_unload", MutationHandler.stop, null, MutationHandler);
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 *
	 * @desc
	 * If an event has triggered a resource to be fetched we add it to the list of pending events
	 * here and wait for it to eventually resolve.
	 *
	 * @param {object} resource - [Resource]{@link AutoXHR#Resource} object we are waiting for
	 *
	 * @returns {?index} - If we are already waiting for an event of this type null otherwise index in the [queue]{@link MutationHandler#pending_event}.
	 */
	MutationHandler.prototype.addEvent = function(resource) {
		var ev = {
			type: resource.initiator,
			resource: resource,
			nodes_to_wait: 0,
			resources: [],
			complete: false
		},
		    i,
		    last_ev,
		    index = this.pending_events.length;

		for (i = index - 1; i >= 0; i--) {
			if (this.pending_events[i] && !this.pending_events[i].complete) {
				last_ev = this.pending_events[i];
				break;
			}
		}

		if (last_ev) {
			if (last_ev.type === "click") {
				// 3.1 & 3.3
				if (last_ev.nodes_to_wait === 0 || !last_ev.resource.url) {
					this.pending_events[i] = undefined;
					return null;// abort
				}
				// last_ev will no longer receive watches as ev will receive them
				// last_ev will wait fall interesting nodes and then send event
			}
			else if (last_ev.type === "xhr") {
				// 3.2
				if (ev.type === "click") {
					return null;
				}

				// 3.4
				// nothing to do
			}
			else if (BOOMR.utils.inArray(last_ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// This could occur if this event started prior to the SPA taking
				// over, and is now completing while the SPA event is occuring.  Let
				// the SPA event take control.
				if (ev.type === "xhr") {
					return null;
				}
			}
		}

		this.watch++;
		this.pending_events.push(ev);

		// If we don't have a MutationObserver, then we just abort
		if (!MutationHandler.observer) {
			if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// try to start it, in case we haven't had the chance to yet
				MutationHandler.start();

				// Give SPAs a bit more time to do something since we know this was
				// an interesting event (e.g. XHRs)
				this.setTimeout(SPA_TIMEOUT, index);

				return index;
			}

			// If we already have detailed resource we can forward the event
			if (resource.url && resource.timing.loadEventEnd) {
				this.sendEvent(index);
			}

			return null;
		}
		else {
			if (!BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// Give clicks and history changes 50ms to see if they resulted
				// in DOM mutations (and thus it is an 'interesting event').
				this.setTimeout(50, index);
			}
			else {
				// Give SPAs a bit more time to do something since we know this was
				// an interesting event.
				this.setTimeout(SPA_TIMEOUT, index);
			}

			return index;
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @desc
	 *
	 * If called with an event in the [pending events list]{@link MutationHandler#pending_events}
	 * trigger a beacon for this event.
	 *
	 * When the beacon is sent for this event is depending on either having a crumb, in which case this
	 * beacon will be sent immediately. If that is not the case we wait 5 seconds and attempt to send the
	 * event again.
	 *
	 * @param {number} i - index in event list to send
	 *
	 * @returns {undefined} - returns early if the event already completed
	 */
	MutationHandler.prototype.sendEvent = function(i) {
		var ev = this.pending_events[i], self = this;

		if (!ev || ev.complete) {
			return;
		}

		this.clearTimeout();
		if (BOOMR.readyToSend()) {
			ev.complete = true;

			this.watch--;

			ev.resource.resources = ev.resources;

			// if this was an SPA nav that triggered no additional resources, substract the
			// SPA_TIMEOUT from now to determine the end time
			if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS) && ev.resources.length === 0) {
				ev.resource.timing.loadEventEnd = BOOMR.now() - SPA_TIMEOUT;
			}

			this.sendResource(ev.resource, i);
		}
		else {
			// No crumb, so try again after 500ms seconds
			setTimeout(function() { self.sendEvent(i); }, READY_TO_SEND_WAIT);
		}
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Creates and triggers sending a beacon for a Resource that has finished loading.
	 *
	 * @param {Resource} resource - The Resource to send a beacon on
	 * @param {number} eventIndex - index of the event in the pending_events array
	 */
	MutationHandler.prototype.sendResource = function(resource, eventIndex) {
		var self = this;

		// Use 'requestStart' as the startTime of the resource, if given
		var startTime = resource.timing ? resource.timing.requestStart : undefined;

		/**
		  * Called once the resource can be sent
		  * @param markEnd Sets loadEventEnd once the function is run
		 */
		var sendResponseEnd = function(markEnd) {
			if (markEnd) {
				resource.timing.loadEventEnd = BOOMR.now();
			}

			// send any queued beacons first
			BOOMR.real_sendBeacon();

			// If the resource has an onComplete event, trigger it.
			if (resource.onComplete) {
				resource.onComplete(resource);
			}

			// Add ResourceTiming data to the beacon, starting at when 'requestStart'
			// was for this resource.
			if (BOOMR.plugins.ResourceTiming &&
			    BOOMR.plugins.ResourceTiming.is_supported() &&
			    resource.timing &&
			    resource.timing.requestStart) {
				var r = BOOMR.plugins.ResourceTiming.getCompressedResourceTiming(
						resource.timing.requestStart,
						resource.timing.loadEventEnd
					);

				BOOMR.addVar({
					restiming: JSON.stringify(r.restiming)
				});
			}

			// For SPAs, calculate Back-End and Front-End timings
			if (BOOMR.utils.inArray(resource.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				self.calculateSpaTimings(resource);
			}

			BOOMR.responseEnd(resource, startTime, resource);

			if (eventIndex) {
				self.pending_events[eventIndex] = undefined;
			}
		};

		// send the beacon if we were not told to hold it
		if (!resource.wait) {
			// if this is a SPA event, make sure it doesn't fire until onload
			if (BOOMR.utils.inArray(resource.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				if (d && d.readyState && d.readyState !== "complete") {
					BOOMR.window.addEventListener("load", function() {
						sendResponseEnd(true);
					});

					return;
				}
			}

			sendResponseEnd(false);
		}
		else {
			// waitComplete() should be called once the held beacon is complete
			resource.waitComplete = function() {
				sendResponseEnd(true);
			};
		}
	};

	/**
	  * Calculates SPA Back-End and Front-End timings for Hard and Soft
	  * SPA navigations.
	  *
	  * @param resource Resouce to calculate for
	 */
	MutationHandler.prototype.calculateSpaTimings = function(resource) {
		var p = BOOMR.getPerformance();
		if (!p || !p.timing) {
			return;
		}

		//
		// Hard Navigation:
		// Use same timers as a traditional navigation, where the root HTML's
		// timestamps are used for Back-End calculation.
		//
		if (resource.initiator === "spa_hard") {
			// ensure RT picks up the correct timestamps
			resource.timing.responseEnd = p.timing.responseStart;

			// use navigationStart instead of fetchStart to ensure Back-End time
			// includes any redirects
			resource.timing.fetchStart = p.timing.navigationStart;
		}
		else {
			//
			// Soft Navigation:
			// We need to overwrite two timers: Back-End (t_resp) and Front-End (t_page).
			//
			// For Single Page Apps, we're defining these as:
			// Back-End: Any timeslice where a XHR or JavaScript was outstanding
			// Front-End: Total Time - Back-End
			//
			if (!BOOMR.plugins.ResourceTiming) {
				return;
			}

			// first, gather all Resources that were outstanding during this SPA nav
			var resources = BOOMR.plugins.ResourceTiming.getFilteredResourceTiming(
				resource.timing.requestStart,
				resource.timing.loadEventEnd,
				impl.spaBackEndResources);

			// determine the total time based on the SPA logic
			var totalTime = Math.round(resource.timing.loadEventEnd - resource.timing.requestStart);

			if (!resources || !resources.length) {
				if (BOOMR.plugins.ResourceTiming.is_supported()) {
					// If ResourceTiming is supported, but there were no entries,
					// this was all Front-End time
					resource.timers = {
						t_resp: 0,
						t_page: totalTime,
						t_done: totalTime
					};
				}

				return;
			}

			// we currently can't reliably tell when a SCRIPT has loaded
			// set an upper bound on responseStart/responseEnd for the resources to the SPA's loadEventEnd
			var maxResponseEnd = resource.timing.loadEventEnd - p.timing.navigationStart;
			for (var i = 0; i < resources.length; i++) {
				if (resources[i].responseStart > maxResponseEnd) {
					resources[i].responseStart = maxResponseEnd;
					resources[i].responseEnd = maxResponseEnd;
				}
				else if (resources[i].responseEnd > maxResponseEnd) {
					resources[i].responseEnd = maxResponseEnd;
				}
			}

			// calculate the Back-End time based on any time those resources were active
			var backEndTime = Math.round(BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion(resources));

			// front-end time is anything left over
			var frontEndTime = totalTime - backEndTime;

			if (backEndTime < 0 || totalTime < 0 || frontEndTime < 0) {
				// some sort of error, don't put on the beacon
				BOOMR.addError("Incorrect SPA time calculation");
				return;
			}

			// set timers on the resource so RT knows to use them
			resource.timers = {
				t_resp: backEndTime,
				t_page: frontEndTime,
				t_done: totalTime
			};
		}
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Will create a new timer waiting for `timeout` milliseconds to wait until a resources load time has ended or should have ended.
	 * If the timeout expires the Resource at `index` will be marked as timedout and result in an error Resource marked with
	 * [XHR_STATUS_TIMEOUT]{@link AutoXHR#XHR_STATUS_TIMEOUT} as status information.
	 *
	 * @param {number} timeout - time ot wait for the resource to be loaded
	 * @param {number} index - Index of the {@link Resource} in our {@link MutationHandler#pending_events}
	 */
	MutationHandler.prototype.setTimeout = function(timeout, index) {
		var self = this;
		if (!timeout) {
			return;
		}

		this.clearTimeout();

		this.timer = setTimeout(function() { self.timedout(index); }, timeout);
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Sends a Beacon for the [Resource]{@link AutoXHR#Resource} at `index` with the status
	 * [XHR_STATUS_TIMEOUT]{@link AutoXHR#XHR_STATUS_TIMEOUT} code, If there are multiple resources attached to the
	 * `pending_events` array at `index`.
	 *
	 * @param {number} index - Index of the event in pending_events array
	 */
	MutationHandler.prototype.timedout = function(index) {
		var ev;
		this.clearTimeout();

		ev = this.pending_events[index];

		if (ev && BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS.concat("xhr"))) {
			// XHRs or SPA page loads
			if (ev.nodes_to_wait === 0) {
				// send page loads (SPAs) if there are no outstanding downloads
				this.sendEvent(index);
			}

			// if there are outstanding downloads left, they will trigger a sendEvent for the SPA once complete
		}
		else {
			if (this.watch > 0) {
				this.watch--;
			}
			this.pending_events[index] = undefined;
		}
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * If this instance of the {@link MutationHandler} has a `timer` set, clear it
	 */
	MutationHandler.prototype.clearTimeout = function() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	};

	/**
	 * @memberof MutationHandler
	 * @callback load_cb
	 *
	 * @desc
	 * Once an asset has been loaded and the resource appeared in the page we check if it was part of the interesting events
	 * on the page and mark it as finished.
	 *
	 * @param {Event} ev - Load event Object
	 */
	MutationHandler.prototype.load_cb = function(ev, resourceNum) {
		var target, index, now = BOOMR.now();

		target = ev.target || ev.srcElement;
		if (!target || !target._bmr) {
			return;
		}

		index = target._bmr.idx;
		resourceNum = typeof resourceNum !== "undefined" ? resourceNum : (target._bmr.res || 0);

		if (target._bmr.end[resourceNum]) {
			// If we've already set the end value, don't call load_finished
			// again.  This might occur on IMGs that are 404s, which fire
			// 'error' then 'load' events
			return;
		}

		target._bmr.end[resourceNum] = now;

		this.load_finished(index, now);
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Decrement the number of [nodes_to_wait]{@link AutoXHR#.PendingEvent} for the the
	 * [PendingEvent Object]{@link AutoXHR#.PendingEvent}.
	 *
	 * If the nodes_to_wait is decremented to 0 and the event type was SPA:
	 *
	 * When we're finished waiting on the last node,
	 * the MVC engine (eg AngularJS) might still be doing some processing (eg
	 * on an XHR) before it adds some additional content (eg IMGs) to the page.
	 * We should wait a while (1 second) longer to see if this happens.  If
	 * something else is added, we'll continue to wait for that content to
	 * complete.  If nothing else is added, the end event will be the
	 * timestamp for when this load_finished(), not 1 second from now.
	 *
	 * @param {number} index - Index of the event found in the pending_events array
	 * @param {TimeStamp} loadEventEnd - TimeStamp at which the resource was finnished loading
	 */
	MutationHandler.prototype.load_finished = function(index, loadEventEnd) {
		var current_event = this.pending_events[index];

		// event aborted
		if (!current_event) {
			return;
		}

		current_event.nodes_to_wait--;

		if (current_event.nodes_to_wait === 0) {
			// mark the end timestamp with what was given to us, or, now
			current_event.resource.timing.loadEventEnd = loadEventEnd || BOOMR.now();

			// For Single Page Apps, when we're finished waiting on the last node,
			// the MVC engine (eg AngularJS) might still be doing some processing (eg
			// on an XHR) before it adds some additional content (eg IMGs) to the page.
			// We should wait a while (1 second) longer to see if this happens.  If
			// something else is added, we'll continue to wait for that content to
			// complete.  If nothing else is added, the end event will be the
			// timestamp for when this load_finished(), not 1 second from now.
			if (BOOMR.utils.inArray(current_event.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				this.setTimeout(SPA_TIMEOUT, index);
			}
			else {
				this.sendEvent(index);
			}
		}
	};

	MutationHandler.prototype.wait_for_node = function(node, index) {
		var self = this, current_event, els, interesting = false, i, l, url, exisitingNodeSrcUrlChanged = false, resourceNum;

		// only images, scripts, iframes and links if stylesheet
		// nodeName for SVG:IMAGE returns `image` in lowercase
		if (node.nodeName.toUpperCase().match(/^(IMG|SCRIPT|IFRAME|IMAGE)$/) || (node.nodeName === "LINK" && node.rel && node.rel.match(/\<stylesheet\>/i))) {

			// if the attribute change affected the src/currentSrc attributes we want to know that
			// as that means we need to fetch a new Resource from the server
			if (node._bmr && node._bmr.res && node._bmr.end[node._bmr.res]) {
				exisitingNodeSrcUrlChanged = true;
			}

			// we put xlink:href before href because node.href works for <SVG:IMAGE> elements, but does not return a string
			url = node.src || node.getAttribute("xlink:href") || node.href;

			if (node.nodeName === "IMG") {
				if (node.naturalWidth && !exisitingNodeSrcUrlChanged) {
					// img already loaded
					return false;
				}
				else if (node.getAttribute("src") === "") {
					// placeholder IMG
					return false;
				}
			}

			// no URL or javascript: or about: or data: URL, so no network activity
			if (!url || url.match(/^(about:|javascript:|data:)/i)) {
				return false;
			}

			current_event = this.pending_events[index];

			if (!current_event) {
				return false;
			}

			// determine the resource number for this request
			resourceNum = current_event.resources.length;

			// create a placeholder ._bmr attribute
			if (!node._bmr) {
				node._bmr = {
					end: {}
				};
			}

			// keep track of all resources (URLs) seen for the root resource
			if (!current_event.urls) {
				current_event.urls = {};
			}

			if (current_event.urls[url]) {
				// we've already seen this URL, no point in waiting on it twice
				return false;
			}

			if (node.nodeName === "SCRIPT" && singlePageApp) {
				// TODO: we currently can't reliably tell when a SCRIPT has already loaded
				return false;
				/*
				 a.href = url;

				 var p = BOOMR.getPerformance()

				 // Check ResourceTiming to see if this was already seen.  If so,
				 // we won't see a 'load' or 'error' event fire, so skip this.
				 if (p && typeof p.getEntriesByType === "function") {
				 entries = p.getEntriesByName(a.href);
				 if (entries && entries.length > 0) {
				 console.error("Skipping " + a.href);
				 return false;
				 }
				 }
				 */
			}

			// if we don't have a URL yet (i.e. a click started this), use
			// this element's URL
			if (!current_event.resource.url) {
				a.href = url;

				if (impl.excludeFilter(a)) {
					BOOMR.debug("Exclude for " + a.href + " matched. Excluding", "AutoXHR");
					// excluded resource, so abort
					return false;
				}

				current_event.resource.url = a.href;
			}

			// update _bmr with details about this resource
			node._bmr.res = resourceNum;
			node._bmr.idx = index;

			node.addEventListener("load", function(ev) { self.load_cb(ev, resourceNum); });
			node.addEventListener("error", function(ev) { self.load_cb(ev, resourceNum); });

			current_event.nodes_to_wait++;
			current_event.resources.push(node);

			// Note that we're tracking this URL
			current_event.urls[url] = 1;

			interesting = true;
		}
		else if (node.nodeType === Node.ELEMENT_NODE) {
			["IMAGE", "IMG"].forEach(function(tagName) {
				els = node.getElementsByTagName(tagName);
				if (els && els.length) {
					for (i = 0, l = els.length; i < l; i++) {
						interesting |= this.wait_for_node(els[i], index);
					}
				}
			}, this);
		}

		return interesting;
	};

	/**
	  * Adds a resource to the current event.
	  *
	  * Might fail (return -1) if:
	  * a) There are no pending events
	  * b) The current event is complete
	  * c) There's no passed-in resource
	  *
	  * @param resource Resource
	  * @return Event index, or -1 on failure
	 */
	MutationHandler.prototype.add_event_resource = function(resource) {
		var index = this.pending_events.length - 1, current_event;
		if (index < 0) {
			return -1;
		}

		current_event = this.pending_events[index];
		if (!current_event) {
			return -1;
		}

		if (!resource) {
			return -1;
		}

		// increase the number of outstanding resources by one
		current_event.nodes_to_wait++;

		resource.index = index;

		return index;
	};

	/**
	 * @callback mutation_cb
	 * @memberof MutationHandler
	 * @desc
	 * Callback called once [Mutation Observer instance]{@link MutationObserver#observer} noticed a mutation on the page.
	 * This method will determine if a mutation on the page is interesting or not.
	 * @param {Mutation[]} mutations - Mutation array describing changes to the DOM
	 */
	MutationHandler.prototype.mutation_cb = function(mutations) {
		var self, index, evt;

		if (!this.watch) {
			return true;
		}

		self = this;
		index = this.pending_events.length - 1;

		if (index < 0 || !this.pending_events[index]) {
			// Nothing waiting for mutations
			return true;
		}

		evt = this.pending_events[index];
		if (typeof evt.interesting === "undefined") {
			evt.interesting = false;
		}

		if (mutations && mutations.length) {
			evt.resource.timing.domComplete = BOOMR.now();

			mutations.forEach(function(mutation) {
				var i, l, node;
				if (mutation.type === "attributes") {
					evt.interesting |= self.wait_for_node(mutation.target, index);
				}
				else if (mutation.type === "childList") {
					// Go through any new nodes and see if we should wait for them
					l = mutation.addedNodes.length;
					for (i = 0; i < l; i++) {
						evt.interesting |= self.wait_for_node(mutation.addedNodes[i], index);
					}

					// Go through any removed nodes, and for IFRAMEs, see if we were
					// waiting for them.  If so, stop waiting, as removed IFRAMEs
					// don't trigger load or error events.
					l = mutation.removedNodes.length;
					for (i = 0; i < l; i++) {
						node = mutation.removedNodes[i];
						if (node.nodeName === "IFRAME" && node._bmr) {
							self.load_cb({target: node, type: "removed"});
						}
					}
				}
			});
		}

		if (!evt.interesting) {
			// if we didn't have any interesting nodes for this MO callback or
			// any prior callbacks, timeout the event
			this.setTimeout(SPA_TIMEOUT, index);
		}

		return true;
	};

	/**
	 * @desc
	 * Determines if the resources queue is empty
	 * @return {boolean} True if there are no outstanding resources
	 */
	MutationHandler.prototype.queue_is_empty = function() {
		if (this.pending_events.length === 0) {
			return true;
		}

		var index = this.pending_events.length - 1;

		if (!this.pending_events[index]) {
			return true;
		}

		if (this.pending_events[index].nodes_to_wait === 0) {
			return true;
		}

		return false;
	};

	handler = new MutationHandler();

	/**
	 * @function
	 * @desc
	 * Subscribe to click events on the page and see if they are triggering new
	 * resources fetched from the network in which case they are interesting
	 * to us!
	 */
	function instrumentClick() {
		// Capture clicks and wait 50ms to see if they result in DOM mutations
		BOOMR.subscribe("click", function() {
			if (singlePageApp) {
				// In a SPA scenario, only route changes (or events from the SPA
				// framework) trigger an interesting event.
				return;
			}

			var resource = { timing: {}, initiator: "click" };

			if (!BOOMR.orig_XMLHttpRequest || BOOMR.orig_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
				// do nothing if we have un-instrumented XHR
				return;
			}

			resource.timing.requestStart = BOOMR.now();

			handler.addEvent(resource);
		});
	}

	/**
	 * @function
	 * @desc
	 * Replace original window.XMLHttpRequest with our implementation instrumenting any AJAX Requests happening afterwards.
	 * This will also enable instrumentation of mouse events (clicks) and start the {@link MutationHandler}
	 *
	 * @returns {null} - returns early if we need to re-instrument
	 */
	function instrumentXHR() {
		if (BOOMR.proxy_XMLHttpRequest && BOOMR.proxy_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
			// already instrumented
			return;
		}
		if (BOOMR.proxy_XMLHttpRequest && BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
			// was once instrumented and then uninstrumented, so just reapply the old instrumented object

			BOOMR.window.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
			MutationHandler.start();

			return;
		}

		// if there's a orig_XMLHttpRequest on the window, use that first (if another lib is overwriting XHR)
		BOOMR.orig_XMLHttpRequest = BOOMR.window.orig_XMLHttpRequest || BOOMR.window.XMLHttpRequest;

		MutationHandler.start();

		instrumentClick();

		/**
		 * @memberof ProxyXHRImplementation
		 * @desc
		 * Open an XMLHttpRequest.
		 * If the URL passed as a second argument is in the BOOMR.xhr_exclude list ignore it and move on to request it
		 * Otherwise add it to our list of resources to monitor and later beacon on.
		 *
		 * If an exception is caught will call loadFinished and set resource.status to {@link XHR_STATUS_OPEN_EXCEPTION}
		 * Should the resource fail to load for any of the following reasons resource.stat status code will be set to:
		 *
		 * - timeout {Event} {@link XHR_STATUS_TIMEOUT}
		 * - error {Event} {@link XHR_STATUS_ERROR}
		 * - abort {Event} {@link XHR_STATUS_ABORT}
		 *
		 * @param method {String} - HTTP request method
		 * @param url {String} - URL to request on
		 * @param async {boolean} - [optional] if true will setup the EventListeners for XHR events otherwise will set the resource
		 *                          to synchronous. If true or undefined will be automatically set to asynchronous
		 */
		BOOMR.proxy_XMLHttpRequest = function() {
			var req, resource = { timing: {}, initiator: "xhr" }, orig_open, orig_send,
			    opened = false;

			req = new BOOMR.orig_XMLHttpRequest();

			orig_open = req.open;
			orig_send = req.send;

			req.open = function(method, url, async) {
				a.href = url;

				if (impl.excludeFilter(a)) {
					BOOMR.debug("Exclude found for resource: " + a.href + " Skipping instrumentation!", "AutoXHR");
					// skip instrumentation and call the original open method
					return orig_open.apply(req, arguments);
				}

				// Default value of async is true
				if (async === undefined) {
					async = true;
				}

				BOOMR.fireEvent("xhr_init", "xhr");

				/**
				 * @memberof ProxyXHRImplementation
				 * @desc
				 * Mark this as the time load ended via resources loadEventEnd property, if this resource has been added
				 * to the {@link MutationHandler} already notify that the resource has finished.
				 * Otherwise add this call to the lise of Events that occured.
				 */
				function loadFinished() {
					var entry, navSt, useRT = false, now = BOOMR.now(), entryStartTime, entryResponseEnd;

					// if we already finished via readystatechange or an error event,
					// don't do work again
					if (resource.timing.loadEventEnd) {
						return;
					}

					// fire an event for anyone listening
					if (resource.status) {
						BOOMR.fireEvent("onxhrerror", resource);
					}

					// set the loadEventEnd timestamp to when this callback fired
					resource.timing.loadEventEnd = now;

					// if ResourceTiming is available, fix-up the .timings with ResourceTiming data, as it will be more accurate
					entry = BOOMR.getResourceTiming(resource.url, function(x, y) { return x.responseEnd - y.responseEnd; });
					if (entry) {
						navSt = BOOMR.getPerformance().timing.navigationStart;

						// re-set the loadEventEnd timestamp to make sure it's greater than values in ResourceTiming entry
						resource.timing.loadEventEnd = BOOMR.now();

						// convert the start time to Epoch
						entryStartTime = Math.floor(navSt + entry.startTime);

						// validate the start time to make sure it's not from another entry
						if (resource.timing.requestStart - entryStartTime >= 2) {
							// if the ResourceTiming startTime is more than 2ms earlier
							// than when we thought the XHR started, this is probably
							// an entry for a different fetch
							useRT = false;
						}
						else {
							// set responseEnd as long as it looks sane
							if (entry.responseEnd !== 0) {
								// convert to Epoch
								entryResponseEnd = Math.floor(navSt + entry.responseEnd);

								// sanity check to see if the entry should be used for this resource
								if (entryResponseEnd <= resource.timing.loadEventEnd) {
									resource.timing.responseEnd = entryResponseEnd;

									// use this entry's other timestamps
									useRT = true;

									// save the entry for later use
									resource.restiming = entry;
								}
							}

							// set more timestamps if we think the entry is valid
							if (useRT) {
								// use the startTime from ResourceTiming instead
								resource.timing.requestStart = entryStartTime;

								// also track it as the fetchStart time
								resource.timing.fetchStart = entryStartTime;

								// use responseStart if it's valid
								if (entry.responseStart !== 0) {
									resource.timing.responseStart = Math.floor(navSt + entry.responseStart);
								}
							}
						}
					}

					if (resource.index > -1) {
						// If this XHR was added to an existing event, fire the
						// load_finished handler for that event.
						handler.load_finished(resource.index, resource.timing.responseEnd);
					}
					else if (alwaysSendXhr) {
						handler.sendResource(resource);
					}
					else if (!singlePageApp || autoXhrEnabled) {
						// Otherwise, if this is a SPA+AutoXHR or just plain
						// AutoXHR, use addEvent() to see if this will trigger
						// a new interesting event.
						handler.addEvent(resource);
					}
				}

				/**
				 * @memberof ProxyXHRImplementation
				 * @desc
				 * Setup an {EventListener} for Event @param{ename}. This function will make sure the timestamp for the resources request is set and calls
				 * loadFinished should the resource have finished. See {@link open()} for it's usage
				 *
				 * @param ename {String} Eventname to listen on via addEventListener
				 * @param stat {String} if that {@link ename} is reached set this as the status of the resource
				 */
				function addListener(ename, stat) {
					req.addEventListener(
						ename,
						function() {
							if (ename === "readystatechange") {
								resource.timing[readyStateMap[req.readyState]] = BOOMR.now();

								// For IE 10 and 11, we need to turn off the MutationObserver before responseXML
								// is first referenced, otherwise responseXML might be malformed due to a browser
								// bug (where extra newlines get added in nodes with UTF-8 content)
								if (impl.ie1011fix && ie10or11 && req.readyState === 4) {
									MutationHandler.pause();

									// this reference to responseXML with MO off is enough to ensure the browser
									// bug is not triggered
									var nop = req.responseXML;

									MutationHandler.resume();
								}

								// Listen here as well, as DOM changes might happen on other listeners
								// of readyState = 4 (complete), and we want to make sure we've
								// started the addEvent() if so.  Only listen if the status is non-zero,
								// meaning the request wasn't aborted.  Aborted requests will fire the
								// next handler.
								if (req.readyState === 4 && req.status !== 0) {
									if (req.status < 200 || req.status >= 400) {
										// put the HTTP error code on the resource if it's not a success
										resource.status = req.status;
									}

									resource.response = {
										text: (req.responseType === "" || req.responseType === "text") ? req.responseText : null,
										xml: (req.responseType === "" || req.responseType === "document") ? req.responseXML : null,
										raw: req.response,
										json: req.responseJSON
									};

									loadFinished();
								}
							}
							else {// load, timeout, error, abort
								resource.status = (stat === undefined ? req.status : stat);
								loadFinished();
							}
						},
						false
					);
				}

				// .open() can be called multiple times (before .send()) - just make
				// sure that we don't track this as a new request, or add additional
				// event listeners
				if (!opened) {
					if (singlePageApp && handler.watch && !alwaysSendXhr) {
						// If this is a SPA and we're already watching for resources due
						// to a route change or other interesting event, add this to the
						// current event.
						handler.add_event_resource(resource);
					}

					if (async) {
						addListener("readystatechange");
					}

					addListener("load");
					addListener("timeout", XHR_STATUS_TIMEOUT);
					addListener("error",   XHR_STATUS_ERROR);
					addListener("abort",   XHR_STATUS_ABORT);
				}

				resource.url = a.href;
				resource.method = method;

				// reset any statuses from previous calls to .open()
				delete resource.status;

				if (!async) {
					resource.synchronous = true;
				}

				// note we've called .open
				opened = true;

				// call the original open method
				try {
					return orig_open.apply(req, arguments);
				}
				catch (e) {
					// if there was an exception during .open(), .send() won't work either,
					// so let's fire loadFinished now
					resource.status = XHR_STATUS_OPEN_EXCEPTION;
					loadFinished();
				}
			};

			/**
			 * @memberof ProxyXHRImplementation
			 * @desc
			 * Mark requestStart timestamp and start the request unless the resource has already been marked as having an error code or a result to itself.
			 * @returns {Object} The data normal XHR.send() would return
			 */
			req.send = function(data) {
				req.resource.requestPayload = data;
				BOOMR.fireEvent("xhr_send", req);
				resource.timing.requestStart = BOOMR.now();

				// call the original send method unless there was an error
				// during .open
				if (typeof resource.status === "undefined" ||
				    resource.status !== XHR_STATUS_OPEN_EXCEPTION) {
					return orig_send.apply(req, arguments);
				}
			};

			req.resource = resource;

			return req;
		};

		BOOMR.proxy_XMLHttpRequest.UNSENT = 0;
		BOOMR.proxy_XMLHttpRequest.OPENED = 1;
		BOOMR.proxy_XMLHttpRequest.HEADERS_RECEIVED = 2;
		BOOMR.proxy_XMLHttpRequest.LOADING = 3;
		BOOMR.proxy_XMLHttpRequest.DONE = 4;
		// set our proxy's prototype to the original XHR prototype, in case anyone
		// is using it to save state
		BOOMR.proxy_XMLHttpRequest.prototype = BOOMR.orig_XMLHttpRequest.prototype;

		BOOMR.window.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
	}

	/**
	 * @function
	 * @desc
	 * Put original XMLHttpRequest Configuration back into place
	 */
	function uninstrumentXHR() {
		if (BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest !== BOOMR.window.XMLHttpRequest) {
			BOOMR.window.XMLHttpRequest = BOOMR.orig_XMLHttpRequest;
		}
	}

	/**
	 * Sends an XHR resource
	 */
	function sendResource(resource) {
		resource.initiator = "xhr";
		BOOMR.responseEnd(resource);
	}

	/**
	 * Container for AutoXHR plugin Closure specific state configuration data
	 * @property {string[]} spaBackendResources - Default resources to count as Back-End during a SPA nav
	 * @property {boolean} ie1011fix - If true, the MutationObserver  will be paused on IE10/11 to avoid delayed processing, see {@link ProxyXHRImplementation#addListener} for more info
	 * @property {FilterObject[]} filters - Array of {@link FilterObject} that is used to apply filters on XHR Requests
	 * @property {boolean} initialized - Set to true after the first run of {@link BOOMR.plugins.AutoXHR#init}
	 */
	impl = {
		spaBackEndResources: SPA_RESOURCES_BACK_END,
		ie1011fix: true,
		excludeFilters: [],
		initialized: false,
		/**
		 * Filter function iterating over all available {@link FilterObject}s if returns true will not instrument an XHR
		 * @param {HTMLAnchorElement} anchor - HTMLAnchorElement node created with the XHRs URL as `href` to evaluate by {@link FilterObject}s and passed to {@link FilterObject#cb} callbacks.
		 *                                     NOTE: The anchor needs to be created from the host document (ie. BOOMR.window.document) to enable us to resolve relative
		 *                                     URLs to a full valid path and BASE HREF mechanics can take effect.
		 * @return {boolean} true if the XHR should not be instrumented false if it should be instrumented
		 */
		excludeFilter: function(anchor) {
			var idx, ret, ctx;

			// If anchor is null we just throw it out period
			if (!anchor || !anchor.href) {
				return false;
			}

			for (idx = 0; idx < impl.excludeFilters.length; idx++) {
				if (typeof impl.excludeFilters[idx].cb === "function") {
					ctx = impl.excludeFilters[idx].ctx;
					if (impl.excludeFilters[idx].name) {
						log("Running filter: " + impl.excludeFilters[idx].name + " on URL: " + anchor.href);
					}

					try {
						ret = impl.excludeFilters[idx].cb.call(ctx, anchor);
						if (ret) {
							BOOMR.debug("Found matching filter at: " + impl.excludeFilters[idx].name + " for URL: " + anchor.href, "AutoXHR");
							return true;
						}
					}
					catch (exception) {
						BOOMR.addError(exception, "BOOMR.plugins.AutoXHR.impl.excludeFilter()");
					}
				}
			}
			return false;
		}
	};

	/**
	 * @module AutoXHR
	 * @desc
	 * How should this work?
	 *
	 * 0. History changed
	 *
	 * - Pass new URL and timestamp of change on to most recent event (which might not have happened yet)
	 *
	 * 0.1. History changes as a result of a pushState or replaceState
	 * - In this case we get the new URL when the developer calls pushState or replaceState
	 * - we do not know if they plan to make an XHR call or use a dynamic script node, or do nothing interesting
	 *  (eg: just make a div visible/invisible)
	 * - we also do not know if they will do this before or after they've called pushState/replaceState
	 * - so our best bet is to check if either an XHR event or an interesting Mutation event happened in the last 50ms,
	 *  and if not, then hold on to this state for 50ms to see if an interesting event will happen.
	 *
	 * 0.2. History changes as a result of the user hitting Back/Forward and we get a window.popstate event
	 * - In this case we get the new URL from location.href when our event listener runs
	 * - we do not know if this event change will result in some interesting network activity or not
	 * - we do not know if the developer's event listener has already run before ours or if it will run in the future
	 *  or even if they do have an event listener
	 * - so our best bet is the same as 0.1 above
	 *
	 *
	 * 1. Click initiated
	 *
	 * - User clicks on something
	 * - We create a resource with the start time and no URL
	 * - We turn on DOM observer, and wait up to 50 milliseconds for something
	 *  - If nothing happens after the timeout, we stop watching and clear the resource without firing the event
	 *  - If a history event happened recently/will happen shortly, use the URL as the resource.url
	 *  - Else if something uninteresting happens, we extend the timeout for 1 second
	 *  - Else if an interesting node is added, we add load and error listeners and turn off the timeout but keep watching
	 *    - If we do not have a resource.url, and if this is a script, then we use the script's URL
	 *    - Once all listeners have fired, we stop watching, fire the event and clear the resource
	 *
	 *
	 * 2. XHR initiated
	 *
	 * - XHR request is sent
	 * - We create a resource with the start time and the request URL
	 * - If a history event happened recently/will happen shortly, use the URL as the resource.url
	 * - We watch for all changes in state (for async requests) and for load (for all requests)
	 * - On load, we turn on DOM observer, and wait up to 50 milliseconds for something
	 *  - If something uninteresting happens, we extend the timeout for 1 second
	 *  - Else if an interesting node is added, we add load and error listeners and turn off the timeout
	 *    - Once all listeners have fired, we stop watching, fire the event and clear the resource
	 *  - If nothing happens after the timeout, we stop watching fire the event and clear the resource
	 *
	 *
	 * 3. What about overlap?
	 *
	 * 3.1. XHR initiated while click watcher is on
	 *
	 * - If first click watcher has not detected anything interesting or does not have a URL, abort it
	 * - If the click watcher has detected something interesting and has a URL, then
	 *  - Proceed with 2 above.
	 *  - concurrently, click stops watching for new resources
	 *   - once all resources click is waiting for have completed, fire the event and clear click resource
	 *
	 * 3.2. click initiated while XHR watcher is on
	 *
	 * - Ignore click
	 *
	 * 3.3. click initiated while click watcher is on
	 *
	 * - If first click watcher has not detected anything interesting or does not have a URL, abort it
	 * - Else proceed with parallel resource steps from 3.1 above
	 *
	 * 3.4. XHR initiated while XHR watcher is on
	 *
	 * - Allow anything interesting detected by first XHR watcher to complete and fire event
	 * - Start watching for second XHR and proceed with 2 above.
	 */
	BOOMR.plugins.AutoXHR = {
		is_complete: function() { return true; },
		init: function(config) {
			var i, idx;

			// if we don't have window, abort
			if (!BOOMR.window || !BOOMR.window.document) {
				return;
			}

			d = BOOMR.window.document;
			a = BOOMR.window.document.createElement("A");

			// gather config and config overrides
			BOOMR.utils.pluginConfig(impl, config, "AutoXHR", ["spaBackEndResources", "ie1011fix"]);

			BOOMR.instrumentXHR = instrumentXHR;
			BOOMR.uninstrumentXHR = uninstrumentXHR;

			// Ensure we're only once adding the shouldExcludeXhr
			if (!impl.initialized) {
				this.addExcludeFilter(shouldExcludeXhr, null, "shouldExcludeXhr");

				impl.initialized = true;
			}

			// Add filters from config
			if (config && config.AutoXHR && config.AutoXHR.excludeFilters && config.AutoXHR.excludeFilters.length > 0) {
				for (idx = 0; idx < config.AutoXHR.excludeFilters.length; idx++) {
					impl.excludeFilters.push(config.AutoXHR.excludeFilters[idx]);
				}
			}

			autoXhrEnabled = config.instrument_xhr;

			// check to see if any of the SPAs were enabled
			if (BOOMR.plugins.SPA && BOOMR.plugins.SPA.supported_frameworks) {
				var supported = BOOMR.plugins.SPA.supported_frameworks();
				for (i = 0; i < supported.length; i++) {
					var spa = supported[i];
					if (config[spa] && config[spa].enabled) {
						singlePageApp = true;
						break;
					}
				}
			}

			// Whether or not to always send XHRs.  If a SPA is enabled, this means it will
			// send XHRs during the hard and soft navs.  If enabled, it will also disable
			// listening for MutationObserver events after an XHR is complete.
			alwaysSendXhr = config.AutoXHR && config.AutoXHR.alwaysSendXhr;
			if (alwaysSendXhr && autoXhrEnabled && BOOMR.xhr && typeof BOOMR.xhr.stop === "function") {
				function sendXhrs(resources) {
					if (resources.length) {
						for (i = 0; i < resources.length; i++) {
							sendResource(resources[i]);
						}
					}
					else {
						// single resoruce
						sendResource(resources);
					}
				};

				var resources = BOOMR.xhr.stop(sendXhrs);

				if (resources && resources.length) {
					BOOMR.setImmediate(sendXhrs, resources);
				}
			}

			if (singlePageApp) {
				if (!alwaysSendXhr) {
					// Disable auto-xhr until the SPA has fired its first beacon.  The
					// plugin will re-enable after it's ready.
					autoXhrEnabled = false;
				}

				if (autoXhrEnabled) {
					BOOMR.instrumentXHR();
				}
			}
			else if (autoXhrEnabled) {
				BOOMR.instrumentXHR();
			}
			else if (autoXhrEnabled === false) {
				BOOMR.uninstrumentXHR();
			}

			BOOMR.registerEvent("onxhrerror");
		},
		getMutationHandler: function() {
			return handler;
		},
		getPathname: getPathName,
		enableAutoXhr: function() {
			if (!autoXhrEnabled) {
				BOOMR.instrumentXHR();
			}

			autoXhrEnabled = true;
		},
		/**
		 * Add a filter function to the list of functions to run to validate if an XHR should be instrumented
		 * For a description of the params see properties of the {@link AutoXHR#FilterObject} type definition
		 *
		 * @example
		 * BOOMR.plugins.AutoXHR.addExcludeFilter(function(anchor) {
		 *   var m = anchor.href.match(/some-page\.html/g);
		 *
		 *   // If matching flag to not instrument
		 *   if (m && m.length > 0) {
		 *     return true;
		 *   }
		 *   return false;
		 * }, null, "exampleFilter");
		 * @param {function} cb - Callback to run to validate filtering of an XHR Request
		 * @param {Object} ctx - Context to run {@param cb} in
		 * @param {string} [name] - Optional name for the filter, called out when running exclude filters for debugging purposes
		 */
		addExcludeFilter: function(cb, ctx, name) {
			impl.excludeFilters.push({cb: cb, ctx: ctx, name: name});
		}
	};

	/**
	 * @typedef {Object} Resource
	 * @memberof AutoXHR
	 *
	 * @desc
	 * Resource objects define properties of a page element or resource monitored by {@link AutoXHR}.
	 *
	 * @property {string} initiator - Type of source that initiated the resource to be fetched:
	 * 				  `click`, `xhr` or SPA initiated
	 * @property {string} url - Path to the resource fetched from either the HTMLElement or XHR request that triggered it
	 * @property {object} timing - Resource timing information gathered from internal timers or ResourceTiming if supported
	 * @property {Timing} timing - Object containing start and end timings of the resource if set
	 * @property {?onComplete} [onComplete] - called once the resource has been fetched
	 */

	/**
	 * @callback onComplete
	 * @desc
	 * Hook called once a resource is found to be loaded and timers have been set.
	 */

	/**
	 * @typedef PendingEvent
	 * @memberof AutoXHR
	 * @private
	 * @desc
	 * An event on a page instrumented by {@link AutoXHR#MutationHandler} and monitored by AutoXHR
	 *
	 * @property {string} type - The type of event that we are watching (`xhr`, `click`, [SPAs]{@link BOOMR#constants.BEACON_TYPE_SPAS})
	 * @property {number} nodes_to_wait - Number of nodes to wait for before event completes
	 * @property {Resource} resource - The resource this event is attached to
	 * @property {boolean} complete - `true` if event completed `false` if not
	 * @property {?Resource[]} resources - multiple resources that are attached to this event
	 */

	/**
	 * @typedef Timing
	 * @memberof AutoXHR
	 * @private
	 * @desc
	 * Timestamps for start of a request and end of loading
	 *
	 * @property {TimeStamp} loadEventEnd - Timestamp when the resource arrived in the browser
	 * @property {TimeStamp} requestStart - High resolution timestamp when the resource was started to be loaded
	 */

	/**
	 * @typedef FilterObject
	 * @property {function} cb - Callback called with context accepts one param which is: AnchorElement referring
	 *                           to the fully qualified URL of the XHR Request BOOMR is determining to instrument
	 * @property {Object} ctx - Execution context to use when running `cb`
	 * @property {string} [name] - Name of the filter used for logging and debugging purposes (This is an entirely optional property)
	 */
})();
;/*global BOOMR*/
(function() {
	var impl = {
		auto: false,
		enabled: true,
		hooked: false,
		routeHooked: false,
		hadMissedRouteChange: false,
		routeChangeInProgress: false
	};

	// Checking for Plugins required and if already integrated
	if (BOOMR.plugins.History || typeof BOOMR.plugins.SPA === "undefined" || typeof BOOMR.plugins.AutoXHR === "undefined") {
		return;
	}

	// History object not available on the window object
	if (!BOOMR.window || !BOOMR.window.history) {
		return;
	}

	// register as a SPA plugin
	BOOMR.plugins.SPA.register("History");

	/**
	 * Debug logging for this instance
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(msg, "History");
	}

	/**
	 * @method
	 * @desc
	 * If enabled and another route change is not in progress send a route_change() event
	 * Otherwise log a warning and set hadMissed a routeChange as missed
	 */
	function routeChange() {
		if (!impl.enabled) {
			log("Not enabled - we've missed a routeChange");
			impl.hadMissedRouteChange = true;
			impl.routeChangeInProgress = false;
		}
		else {
			if (!impl.routeChangeInProgress) {
				log("routeChange triggered, sending route_change() event");
				impl.routeChangeInProgress = true;
				BOOMR.plugins.SPA.route_change();
			}
			else {
				log("routeChangeInProgress, not triggering");
			}
		}
	}

	/**
	 * @method
	 * @desc
	 * Hook into History Object either custom to your application or general on the window object
	 *
	 * This function will override the following functions if available:
	 *   - listen
	 *   - transitionTo
	 *   - pushState
	 *   - setState
	 *   - replaceState
	 *   - go
	 *
	 * @param {object} history - Custom or global History object instance
	 */
	function hook(history) {
		if (!history) {
			history = BOOMR.window.history;
		}

		var orig_history = {
			listen: history.listen,
			transitionTo: history.transitionTo,
			pushState: history.pushState,
			setState: history.setState,
			replaceState: history.replaceState,
			go: history.go
		};

		function spa_init(title, url) {
			if (!impl.routeChangeInProgress) {
				if (title && url) {
					BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), url]);
				}
				else if (title && !url) {
					BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), title]);
				}
			}
		}

		history.setState = function() {
			log("setState");
			routeChange();
			orig_history.setState.apply(this, arguments);
		};

		history.listen = function() {
			log("listen");
			routeChange();
			orig_history.listen.apply(this, arguments);
		};

		history.transitionTo = function() {
			log("transitionTo");
			routeChange();
			orig_history.transitionTo.apply(this, arguments);
		};

		history.pushState = function(state, title, url) {
			log("pushState");
			spa_init(title, url);
			routeChange();
			orig_history.pushState.apply(this, arguments);
		};

		history.replaceState = function(state, title, url) {
			log("replaceState");
			spa_init(title, url);
			routeChange();
			orig_history.replaceState.apply(this, arguments);
		};

		history.go = function() {
			log("go");
			routeChange();
			orig_history.go.apply(this, arguments);
		};

		BOOMR.window.addEventListener("hashchange", function(event) {
			log("hashchange");
			if (!impl.routeChangeInProgress && event) {
				BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), event.newURL]);
			}
			routeChange();
		});

		BOOMR.subscribe("onbeacon", function() {
			log("Beacon sending, resetting routeChangeInProgress.");
			impl.routeChangeInProgress = false;
		});

		return true;
	}

	BOOMR.plugins.History = {
		is_complete: function() {
			return true;
		},
		hook: function(history, hadRouteChange, options) {
			if (impl.hooked) {
				return this;
			}

			if (hook(history)) {
				BOOMR.plugins.SPA.hook(hadRouteChange, options);
				impl.hooked = true;
			}

			return this;
		},
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "History", ["auto", "enabled"]);

			if (impl.auto && impl.enabled) {
				this.hook(undefined, true, {});
			}
		},
		disable: function() {
			impl.enabled = false;
			return this;
		},
		enable: function() {
			impl.enabled = true;

			if (impl.hooked && impl.hadMissedRouteChange) {
				impl.hadMissedRouteChange = false;
				BOOMR.plugins.SPA.route_change();
				impl.routeChangeInProgress = true;
				log("Hooked and hadMissedRouteChange sending route_change!");
			}

			return this;
		}
	};
}());
;/*
 * Copyright (c), Log-Normal, Inc.
 */

/**
\file memory.js
Plugin to collect memory metrics when available.
see: http://code.google.com/p/chromium/issues/detail?id=43281
*/

(function() {
	var w, p = {}, d, m, s, n, b, impl;
	// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
	// you'll need this.
	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.Memory) {
		return;
	}

	/**
	 * Count elements of a given type and return the count or an object with the `key` mapped to the `count` if a `key` is specified.
	 * If one or more filters are included, apply them incrementally to the `element` array, assigning each intermediate count to the
	 * corresponding `key` in the return object
	 *
	 * @param {string} type Element type to search DOM for
	 *
	 * @param {string[]} [keys] List of keys for return object
	 * If not included, just the tag count is returned.
	 * If included then an object is returned with each element in this array as a key, and the element count as the value.
	 * For keys[1] onwards, the element count is the number of elements returned from each corresponding filter function.
	 *
	 * @param {function} [filter] List of filters to apply incrementally to element array
	 * This is NOT an array
	 * The input to each function in the argument list is the array returned by the previous function
	 * The first function receives the array returned by the `getElementsByTagName` function
	 * Each function MUST return a NodeList or an Array with a `length` property
	 *
	 * @returns {number|object}
	 * If only one argument is passed in, returns a nodeCount matching that element type
	 * If multiple arguments are passed in, returns an object with key to count mapping based on the rules above
	 */
	function nodeCount(type, keys /*, filter...*/) {
		var tags, r, o, i, filter;
		try {
			tags = d.getElementsByTagName(type);
			r = tags.length;

			if (keys && keys.length) {
				o = {};
				o[keys[0]] = r;

				// Iterate through all remaining arguments checking for filters
				// Remember that keys.length will be at least 1 and arguments.length will be at least 2
				// so the first key we use is keys[1] for arguments[2]
				for (i = 2; r > 0 && i < arguments.length && i - 1 < keys.length; i++) {
					filter = arguments[i];

					if (typeof filter !== "function") {
						continue;
					}

					try {
						tags = BOOMR.utils.arrayFilter(tags, filter);
						// Only add this if different from the previous
						if (tags.length !== r) {
							r = tags.length;
							o[keys[i - 1]] = r;
						}
					}
					catch (err) {
						BOOMR.addError(err, "Memory.nodeList." + type + ".filter[" + (i - 2) + "]");
					}
				}

			}
			return o || r;
		}
		catch (err) {
			BOOMR.addError(err, "Memory.nodeList." + type);
			return 0;
		}
	}

	function errorWrap(condition, callback, component) {
		if (condition) {
			try {
				callback();
			}
			catch (err) {
				BOOMR.addError(err, "Memory.done." + component);
			}
		}
	}

	// A private object to encapsulate all your implementation details
	impl = {
		done: function() {
			if (!w) {
				return;		// this can happen for an unload beacon
			}

			// If we have resource timing, get number of resources
			BOOMR.removeVar("dom.res");
			errorWrap(true,
				function() {
					var res, doms = {}, a;

					if (!p || typeof p.getEntriesByType !== "function") {
						return;
					}

					res = p.getEntriesByType("resource");
					if (!res || !res.length) {
						return;
					}

					BOOMR.addVar("dom.res", res.length);

					a = BOOMR.window.document.createElement("a");

					[].forEach.call(res, function(r) {
						a.href = r.name;
						doms[a.hostname] = true;
					});

					BOOMR.addVar("dom.doms", Object.keys(doms).length);
				},
				"resources"
			);

			if (m) {
				BOOMR.addVar({
					"mem.total": m.totalJSHeapSize,
					"mem.limit": m.jsHeapSizeLimit,
					"mem.used": m.usedJSHeapSize
				});
			}

			errorWrap(s,
				function() {
					var sx, sy;
					BOOMR.addVar({
						"scr.xy": s.width + "x" + s.height,
						"scr.bpp": s.colorDepth + "/" + (s.pixelDepth || "")
					});
					if (s.orientation) {
						BOOMR.addVar("scr.orn", s.orientation.angle + "/" + s.orientation.type);
					}
					if (w.devicePixelRatio > 1) {
						BOOMR.addVar("scr.dpx", w.devicePixelRatio);
					}
					if (w.scrollX || w.scrollY) {
						// Apparently some frameworks set scrollX and scrollY to functions that return the actual values
						sx = typeof w.scrollX === "function" ? w.scrollX() : w.scrollX;
						sy = typeof w.scrollY === "function" ? w.scrollY() : w.scrollY;

						if (typeof sx === "number" && typeof sy === "number") {
							BOOMR.addVar("scr.sxy", sx + "x" + sy);
						}
					}
				},
				"screen"
			);

			errorWrap(n,
				function() {
					if (n.hardwareConcurrency) {
						BOOMR.addVar("cpu.cnc", n.hardwareConcurrency);
					}
					if (n.maxTouchPoints) {
						BOOMR.addVar("scr.mtp", n.maxTouchPoints);
					}
				},
				"navigator"
			);

			errorWrap(b,
				function() {
					BOOMR.addVar("bat.lvl", b.level);
				},
				"battery"
			);

			errorWrap(true,
				function() {
					var uniqUrls;

					BOOMR.addVar({
						"dom.ln": nodeCount("*"),
						"dom.sz": d.documentElement.innerHTML.length
					});

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"img",
						["dom.img", "dom.img.ext", "dom.img.uniq"],
						function(el) {
							return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|data:|#)/);
						},
						function(el) {
							return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
						}
					));

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"script",
						["dom.script", "dom.script.ext", "dom.script.uniq"],
						function(el) {
							return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|#)/);
						},
						function(el) {
							return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
						}
					));

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"iframe",
						["dom.iframe", "dom.iframe.ext", "dom.iframe.uniq"],
						function(el) {
							return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|#)/);
						},
						function(el) {
							return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
						}
					));

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"link",
						["dom.link", "dom.link.css", "dom.link.css.uniq"],
						function(link) {
							return link.rel && link.rel.toLowerCase() === "stylesheet" &&
								link.href && !link.href.toLowerCase().match(/^(?:about:|javascript:|#)/);
						},
						function(link) {
							return !(uniqUrls[link.href] = uniqUrls.hasOwnProperty(link.href));
						}
					));
				},
				"dom"
			);

			// no need to call BOOMR.sendBeacon because we're called when the beacon is being sent
		}
	};

	BOOMR.plugins.Memory = {
		init: function() {
			var c;

			try {
				w = BOOMR.window;
				d = w.document;
				p = BOOMR.getPerformance();
				c = w.console;
				s = w.screen;
				n = w.navigator;
				if (n && n.battery) {
					b = n.battery;
				}
				// There are cases where getBattery exists but is not a function
				// No need to check for existence because typeof will return undefined anyway
				else if (n && typeof n.getBattery === "function") {
					var batPromise = n.getBattery();

					// some UAs implement getBattery without a promise
					if (batPromise && typeof batPromise.then === "function") {
						batPromise.then(function(battery) {
							b = battery;
						});
					}
					// If batPromise is an object and it has a `level` property, then it's probably the battery object
					else if (typeof batPromise === "object" && batPromise.hasOwnProperty("level")) {
						b = batPromise;
					}
					// else do nothing
				}
			}
			catch (err) {
				BOOMR.addError(err, "Memory.init");
			}

			m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

			if (impl.initialized) {
				return this;
			}

			impl.initialized = true;

			// we do this before sending a beacon to get the snapshot when the beacon is sent
			BOOMR.subscribe("before_beacon", impl.done, null, impl);
			return this;
		},

		is_complete: function() {
			// Always true since we run on before_beacon, which happens after the check
			return true;
		}
	};

}());
;/*
 * Copyright (c), Buddy Brewer.
 */

/**
\file navtiming.js
Plugin to collect metrics from the W3C Navigation Timing API. For more information about Navigation Timing,
see: http://www.w3.org/TR/navigation-timing/
*/

(function() {

	// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
	// you'll need this.
	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.NavigationTiming) {
		return;
	}

	// A private object to encapsulate all your implementation details
	var impl = {
		complete: false,
		sendBeacon: function() {
			this.complete = true;
			BOOMR.sendBeacon();
		},
		xhr_done: function(edata) {
			var p;

			if (edata && edata.initiator === "spa_hard") {
				// Single Page App - Hard refresh: Send page's NavigationTiming data, if
				// available.
				impl.done(edata);
				return;
			}
			else if (edata && edata.initiator === "spa") {
				// Single Page App - Soft refresh: The original hard navigation is no longer
				// relevant for this soft refresh, nor is the "URL" for this page, so don't
				// add NavigationTiming or ResourceTiming metrics.
				impl.sendBeacon();
				return;
			}

			var w = BOOMR.window, res, data = {}, k;

			if (!edata) {
				return;
			}

			if (edata.data) {
				edata = edata.data;
			}

			p = BOOMR.getPerformance();

			// if we previous saved the correct ResourceTiming entry, use it
			if (p && edata.restiming) {
				data = {
					nt_red_st: edata.restiming.redirectStart,
					nt_red_end: edata.restiming.redirectEnd,
					nt_fet_st: edata.restiming.fetchStart,
					nt_dns_st: edata.restiming.domainLookupStart,
					nt_dns_end: edata.restiming.domainLookupEnd,
					nt_con_st: edata.restiming.connectStart,
					nt_con_end: edata.restiming.connectEnd,
					nt_req_st: edata.restiming.requestStart,
					nt_res_st: edata.restiming.responseStart,
					nt_res_end: edata.restiming.responseEnd
				};

				if (edata.restiming.secureConnectionStart) {
					// secureConnectionStart is OPTIONAL in the spec
					data.nt_ssl_st = edata.restiming.secureConnectionStart;
				}

				for (k in data) {
					if (data.hasOwnProperty(k) && data[k]) {
						data[k] += p.timing.navigationStart;

						// don't need to send microseconds
						data[k] = Math.floor(data[k]);
					}
				}
			}

			if (edata.timing) {
				res = edata.timing;
				if (!data.nt_req_st) {
					// requestStart will be 0 if Timing-Allow-Origin header isn't set on the xhr response
					data.nt_req_st = res.requestStart;
				}
				if (!data.nt_res_st) {
					// responseStart will be 0 if Timing-Allow-Origin header isn't set on the xhr response
					data.nt_res_st = res.responseStart;
				}
				if (!data.nt_res_end) {
					data.nt_res_end = res.responseEnd;
				}
				data.nt_domint = res.domInteractive;
				data.nt_domcomp = res.domComplete;
				data.nt_load_st = res.loadEventEnd;
				data.nt_load_end = res.loadEventEnd;
			}

			for (k in data) {
				if (data.hasOwnProperty(k) && !data[k]) {
					delete data[k];
				}
			}

			BOOMR.addVar(data);

			try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
			catch (ignore) { /* empty */ }

			impl.sendBeacon();
		},

		done: function() {
			var w = BOOMR.window, p, pn, pt, data;

			if (this.complete) {
				return this;
			}

			impl.addedVars = [];

			p = BOOMR.getPerformance();
			if (p && p.timing && p.navigation) {
				BOOMR.info("This user agent supports NavigationTiming.", "nt");
				pn = p.navigation;
				pt = p.timing;
				data = {
					nt_red_cnt: pn.redirectCount,
					nt_nav_type: pn.type,
					nt_nav_st: pt.navigationStart,
					nt_red_st: pt.redirectStart,
					nt_red_end: pt.redirectEnd,
					nt_fet_st: pt.fetchStart,
					nt_dns_st: pt.domainLookupStart,
					nt_dns_end: pt.domainLookupEnd,
					nt_con_st: pt.connectStart,
					nt_con_end: pt.connectEnd,
					nt_req_st: pt.requestStart,
					nt_res_st: pt.responseStart,
					nt_res_end: pt.responseEnd,
					nt_domloading: pt.domLoading,
					nt_domint: pt.domInteractive,
					nt_domcontloaded_st: pt.domContentLoadedEventStart,
					nt_domcontloaded_end: pt.domContentLoadedEventEnd,
					nt_domcomp: pt.domComplete,
					nt_load_st: pt.loadEventStart,
					nt_load_end: pt.loadEventEnd,
					nt_unload_st: pt.unloadEventStart,
					nt_unload_end: pt.unloadEventEnd
				};

				if (pt.secureConnectionStart) {
					// secureConnectionStart is OPTIONAL in the spec
					data.nt_ssl_st = pt.secureConnectionStart;
				}

				if (pt.msFirstPaint) {
					// msFirstPaint is IE9+ http://msdn.microsoft.com/en-us/library/ff974719
					data.nt_first_paint = pt.msFirstPaint;
				}

				BOOMR.addVar(data);

				//
				// Basic browser bug detection for known cases where NavigationTiming
				// timestamps might not be trusted.
				//
				if ((pt.requestStart && pt.navigationStart && pt.requestStart < pt.navigationStart) ||
				    (pt.responseStart && pt.navigationStart && pt.responseStart < pt.navigationStart) ||
				    (pt.responseStart && pt.fetchStart && pt.responseStart < pt.fetchStart) ||
				    (pt.navigationStart && pt.fetchStart < pt.navigationStart) ||
				    (pt.responseEnd && pt.responseEnd > BOOMR.now() + 8.64e+7)) {
					BOOMR.addVar("nt_bad", 1);
					impl.addedVars.push("nt_bad");
				}

				try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
				catch (ignore) { /* empty */ }
			}

			// XXX Inconsistency warning.  msFirstPaint above is in milliseconds while
			//     firstPaintTime below is in seconds.microseconds.  The server needs to deal with this.

			// This is Chrome only, so will not overwrite nt_first_paint above
			if (w.chrome && w.chrome.loadTimes) {
				pt = w.chrome.loadTimes();
				if (pt) {
					data = {
						nt_spdy: (pt.wasFetchedViaSpdy ? 1 : 0),
						nt_cinf: pt.connectionInfo,
						nt_first_paint: pt.firstPaintTime
					};

					BOOMR.addVar(data);

					try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
					catch (ignore) { /* empty */ }
				}
			}

			impl.sendBeacon();
		},

		clear: function() {
			if (impl.addedVars && impl.addedVars.length > 0) {
				BOOMR.removeVar(impl.addedVars);
				impl.addedVars = [];
			}
			this.complete = false;
		},

		prerenderToVisible: function() {
			// ensure we add our data to the beacon even if we had added it
			// during prerender (in case another beacon went out in between)
			this.complete = false;

			// add our data to the beacon
			this.done();
		}
	};

	BOOMR.plugins.NavigationTiming = {
		init: function() {
			if (!impl.initialized) {
				// we'll fire on whichever happens first
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
				BOOMR.subscribe("xhr_load", impl.xhr_done, null, impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);
				BOOMR.subscribe("onbeacon", impl.clear, null, impl);

				impl.initialized = true;
			}
			return this;
		},

		is_complete: function() {
			return true;
		}
	};

}());
;/**
\file restiming.js
Plugin to collect metrics from the W3C Resource Timing API.
For more information about Resource Timing,
see: http://www.w3.org/TR/resource-timing/
*/

(function() {

	var impl;

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.ResourceTiming) {
		return;
	}

	//
	// Constants
	//
	var INITIATOR_TYPES = {
		"other": 0,
		"img": 1,
		"link": 2,
		"script": 3,
		"css": 4,
		"xmlhttprequest": 5,
		"html": 6,
		// IMAGE element inside a SVG
		"image": 7,
		// sendBeacon: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
		"beacon": 8,
		// Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
		"fetch": 9
	};

	// Words that will be broken (by ensuring the optimized trie doesn't contain
	// the whole string) in URLs, to ensure NoScript doesn't think this is an XSS attack
	var DEFAULT_XSS_BREAK_WORDS = [
		/(h)(ref)/gi,
		/(s)(rc)/gi,
		/(a)(ction)/gi
	];

	// Delimiter to use to break a XSS word
	var XSS_BREAK_DELIM = "\n";

	// Maximum number of characters in a URL
	var DEFAULT_URL_LIMIT = 500;

	// Any ResourceTiming data time that starts with this character is not a time,
	// but something else (like dimension data)
	var SPECIAL_DATA_PREFIX = "*";

	// Dimension data special type
	var SPECIAL_DATA_DIMENSION_TYPE = "0";

	// Dimension data special type
	var SPECIAL_DATA_SIZE_TYPE = "1";

	// Script attributes
	var SPECIAL_DATA_SCRIPT_ATTR_TYPE = "2";
	// The following make up a bitmask
	var ASYNC_ATTR = 0x1;
	var DEFER_ATTR = 0x2;
	var LOCAT_ATTR = 0x4;	// 0 => HEAD, 1 => BODY

	/**
	 * Converts entries to a Trie:
	 * http://en.wikipedia.org/wiki/Trie
	 *
	 * Assumptions:
	 * 1) All entries have unique keys
	 * 2) Keys cannot have "|" in their name.
	 * 3) All key's values are strings
	 *
	 * Leaf nodes in the tree are the key's values.
	 *
	 * If key A is a prefix to key B, key A will be suffixed with "|"
	 *
	 * @param [object] entries Performance entries
	 * @return A trie
	 */
	function convertToTrie(entries) {
		var trie = {}, url, urlFixed, i, value, letters, letter, cur, node;

		for (url in entries) {
			urlFixed = url;

			// find any strings to break
			for (i = 0; i < impl.xssBreakWords.length; i++) {
				// Add a XSS_BREAK_DELIM character after the first letter.  optimizeTrie will
				// ensure this sequence doesn't get combined.
				urlFixed = urlFixed.replace(impl.xssBreakWords[i], "$1" + XSS_BREAK_DELIM + "$2");
			}

			if (!entries.hasOwnProperty(url)) {
				continue;
			}

			value = entries[url];
			letters = urlFixed.split("");
			cur = trie;

			for (i = 0; i < letters.length; i++) {
				letter = letters[i];
				node = cur[letter];

				if (typeof node === "undefined") {
					// nothing exists yet, create either a leaf if this is the end of the word,
					// or a branch if there are letters to go
					cur = cur[letter] = (i === (letters.length - 1) ? value : {});
				}
				else if (typeof node === "string") {
					// this is a leaf, but we need to go further, so convert it into a branch
					cur = cur[letter] = { "|": node };
				}
				else {
					if (i === (letters.length - 1)) {
						// this is the end of our key, and we've hit an existing node.  Add our timings.
						cur[letter]["|"] = value;
					}
					else {
						// continue onwards
						cur = cur[letter];
					}
				}
			}
		}

		return trie;
	}

	/**
	 * Optimize the Trie by combining branches with no leaf
	 *
	 * @param [object] cur Current Trie branch
	 * @param [boolean] top Whether or not this is the root node
	 */
	function optimizeTrie(cur, top) {
		var num = 0, node, ret, topNode;

		// capture trie keys first as we'll be modifying it
		var keys = [];

		for (node in cur) {
			if (cur.hasOwnProperty(node)) {
				keys.push(node);
			}
		}

		for (var i = 0; i < keys.length; i++) {
			node = keys[i];
			if (typeof cur[node] === "object") {
				// optimize children
				ret = optimizeTrie(cur[node], false);
				if (ret) {
					// swap the current leaf with compressed one
					delete cur[node];

					if (node === XSS_BREAK_DELIM) {
						// If this node is a newline, which can't be in a regular URL,
						// it's due to the XSS patch.  Remove the placeholder character,
						// and make sure this node isn't compressed by incrementing
						// num to be greater than one.
						node = ret.name;
						num++;
					}
					else {
						node = node + ret.name;
					}
					cur[node] = ret.value;
				}
			}
			num++;
		}

		if (num === 1) {
			// compress single leafs
			if (top) {
				// top node gets special treatment so we're not left with a {node:,value:} at top
				topNode = {};
				topNode[node] = cur[node];
				return topNode;
			}
			else {
				// other nodes we return name and value separately
				return { name: node, value: cur[node] };
			}
		}
		else if (top) {
			// top node with more than 1 child, return it as-is
			return cur;
		}
		else {
			// more than two nodes and not the top, we can't compress any more
			return false;
		}
	}

	/**
	 * Trims the timing, returning an offset from the startTime in ms
	 *
	 * @param [number] time Time
	 * @param [number] startTime Start time
	 * @return [number] Number of ms from start time
	 */
	function trimTiming(time, startTime) {
		if (typeof time !== "number") {
			time = 0;
		}

		if (typeof startTime !== "number") {
			startTime = 0;
		}

		// strip from microseconds to milliseconds only
		var timeMs = Math.round(time ? time : 0),
		    startTimeMs = Math.round(startTime ? startTime : 0);

		return timeMs === 0 ? 0 : (timeMs - startTimeMs);
	}

	/**
	 * Checks if the current execution context can haz cheezburger from the specified frame
	 * @param {Window} frame The frame to check if access can haz
	 * @return {boolean} true if true, false otherwise
	 */
	function isFrameAccessible(frame) {
		var dummy;

		try {
			// Try to access location.href first to trigger any Cross-Origin
			// warnings.  There's also a bug in Chrome ~48 that might cause
			// the browser to crash if accessing X-O frame.performance.
			// https://code.google.com/p/chromium/issues/detail?id=585871
			// This variable is not otherwise used.
			dummy = frame.location && frame.location.href;

			// Try to access frame.document to trigger X-O exceptions with that
			dummy = frame.document;

			if (("performance" in frame) && frame.performance) {
				return true;
			}
		}
		catch (e) {
			// empty
		}

		return false;
	}

	/**
	 * Attempts to get the navigationStart time for a frame.
	 * @returns navigationStart time, or 0 if not accessible
	 */
	function getNavStartTime(frame) {
		var navStart = 0;

		if (isFrameAccessible(frame) && frame.performance.timing && frame.performance.timing.navigationStart) {
			navStart = frame.performance.timing.navigationStart;
		}

		return navStart;
	}

	/**
	 * Gets all of the performance entries for a frame and its subframes
	 *
	 * @param {Frame} frame Frame
	 * @param {boolean} top This is the top window
	 * @param {string} offset Offset in timing from root IFRAME
	 * @param {number} depth Recursion depth
	 * @param {number[]} [frameDims] position and size of the frame if it is visible as returned by getVisibleEntries
	 * @return {PerformanceEntry[]} Performance entries
	 */
	function findPerformanceEntriesForFrame(frame, isTopWindow, offset, depth, frameDims) {
		var entries = [], i, navEntries, navStart, frameNavStart, frameOffset, subFrames, subFrameDims,
		    navEntry, t, rtEntry, visibleEntries, scripts = {}, a;

		if (typeof isTopWindow === "undefined") {
			isTopWindow = true;
		}

		if (typeof offset === "undefined") {
			offset = 0;
		}

		if (typeof depth === "undefined") {
			depth = 0;
		}

		if (depth > 10) {
			return entries;
		}

		try {
			if (!isFrameAccessible(frame)) {
				return entries;
			}

			navStart = getNavStartTime(frame);

			// gather visible entries on the page
			visibleEntries = getVisibleEntries(frame, frameDims);

			a = frame.document.createElement("a");

			// get all scripts as an object keyed on script.src
			Array.prototype
				.forEach
				.call(frame.document.getElementsByTagName("script"), function(s) {
					a.href = s.src;	// Get canonical URL

					// only get external scripts
					if (a.href.match(/^https?:\/\//)) {
						scripts[a.href] = s;
					}
				});

			subFrames = frame.document.getElementsByTagName("iframe");

			// get sub-frames' entries first
			if (subFrames && subFrames.length) {
				for (i = 0; i < subFrames.length; i++) {
					frameNavStart = getNavStartTime(subFrames[i].contentWindow);
					frameOffset = 0;
					if (frameNavStart > navStart) {
						frameOffset = offset + (frameNavStart - navStart);
					}

					a.href = subFrames[i].src;	// Get canonical URL

					entries = entries.concat(findPerformanceEntriesForFrame(frame.frames[i], false, frameOffset, depth + 1, visibleEntries[a.href]));
				}
			}

			if (typeof frame.performance.getEntriesByType !== "function") {
				return entries;
			}

			// add an entry for the top page
			if (isTopWindow) {
				navEntries = frame.performance.getEntriesByType("navigation");
				if (navEntries && navEntries.length === 1) {
					navEntry = navEntries[0];

					// replace document with the actual URL
					entries.push({
						name: frame.location.href,
						startTime: 0,
						initiatorType: "html",
						redirectStart: navEntry.redirectStart,
						redirectEnd: navEntry.redirectEnd,
						fetchStart: navEntry.fetchStart,
						domainLookupStart: navEntry.domainLookupStart,
						domainLookupEnd: navEntry.domainLookupEnd,
						connectStart: navEntry.connectStart,
						secureConnectionStart: navEntry.secureConnectionStart,
						connectEnd: navEntry.connectEnd,
						requestStart: navEntry.requestStart,
						responseStart: navEntry.responseStart,
						responseEnd: navEntry.responseEnd,
						workerStart: navEntry.workerStart,
						encodedBodySize: navEntry.encodedBodySize,
						decodedBodySize: navEntry.decodedBodySize,
						transferSize: navEntry.transferSize
					});
				}
				else if (frame.performance.timing) {
					// add a fake entry from the timing object
					t = frame.performance.timing;

					//
					// Avoid browser bugs:
					// 1. navigationStart being 0 in some cases
					// 2. responseEnd being ~2x what navigationStart is
					//    (ensure the end is within 60 minutes of start)
					//
					if (t.navigationStart !== 0 &&
						t.responseEnd <= (t.navigationStart + (60 * 60 * 1000))) {
						entries.push({
							name: frame.location.href,
							startTime: 0,
							initiatorType: "html",
							redirectStart: t.redirectStart ? (t.redirectStart - t.navigationStart) : 0,
							redirectEnd: t.redirectEnd ? (t.redirectEnd - t.navigationStart) : 0,
							fetchStart: t.fetchStart ? (t.fetchStart - t.navigationStart) : 0,
							domainLookupStart: t.domainLookupStart ? (t.domainLookupStart - t.navigationStart) : 0,
							domainLookupEnd: t.domainLookupEnd ? (t.domainLookupEnd - t.navigationStart) : 0,
							connectStart: t.connectStart ? (t.connectStart - t.navigationStart) : 0,
							secureConnectionStart: t.secureConnectionStart ? (t.secureConnectionStart - t.navigationStart) : 0,
							connectEnd: t.connectEnd ? (t.connectEnd - t.navigationStart) : 0,
							requestStart: t.requestStart ? (t.requestStart - t.navigationStart) : 0,
							responseStart: t.responseStart ? (t.responseStart - t.navigationStart) : 0,
							responseEnd: t.responseEnd ? (t.responseEnd - t.navigationStart) : 0
						});
					}
				}
			}

			// offset all of the entries by the specified offset for this frame
			var frameEntries = frame.performance.getEntriesByType("resource"),
			    frameFixedEntries = [];

			for (i = 0; frameEntries && i < frameEntries.length; i++) {
				t = frameEntries[i];
				rtEntry = {
					name: t.name,
					initiatorType: t.initiatorType,
					startTime: t.startTime + offset,
					redirectStart: t.redirectStart ? (t.redirectStart + offset) : 0,
					redirectEnd: t.redirectEnd ? (t.redirectEnd + offset) : 0,
					fetchStart: t.fetchStart ? (t.fetchStart + offset) : 0,
					domainLookupStart: t.domainLookupStart ? (t.domainLookupStart + offset) : 0,
					domainLookupEnd: t.domainLookupEnd ? (t.domainLookupEnd + offset) : 0,
					connectStart: t.connectStart ? (t.connectStart + offset) : 0,
					secureConnectionStart: t.secureConnectionStart ? (t.secureConnectionStart + offset) : 0,
					connectEnd: t.connectEnd ? (t.connectEnd + offset) : 0,
					requestStart: t.requestStart ? (t.requestStart + offset) : 0,
					responseStart: t.responseStart ? (t.responseStart + offset) : 0,
					responseEnd: t.responseEnd ? (t.responseEnd + offset) : 0,
					workerStart: t.workerStart ? (t.workerStart + offset) : 0,
					encodedBodySize: t.encodedBodySize,
					decodedBodySize: t.decodedBodySize,
					transferSize: t.transferSize,
					visibleDimensions: visibleEntries[t.name],
					latestTime: getResourceLatestTime(t)
				};

				// If this is a script, set its flags
				if (t.initiatorType === "script" && scripts[t.name]) {
					var s = scripts[t.name];

					// Add async & defer based on attribute values
					rtEntry.scriptAttrs = (s.async ? ASYNC_ATTR : 0) | (s.defer ? DEFER_ATTR : 0);

					while (s.nodeType === 1 && s.nodeName !== "BODY") {
						s = s.parentNode;
					}

					// Add location by traversing up the tree until we either hit BODY or document
					rtEntry.scriptAttrs |= (s.nodeName === "BODY" ? LOCAT_ATTR : 0);
				}

				frameFixedEntries.push(rtEntry);
			}

			entries = entries.concat(frameFixedEntries);
		}
		catch (e) {
			return entries;
		}

		return entries;
	}

	/**
	 * Converts a number to base-36.
	 *
	 * If not a number or a string, or === 0, return "". This is to facilitate
	 * compression in the timing array, where "blanks" or 0s show as a series
	 * of trailing ",,,," that can be trimmed.
	 *
	 * If a string, return a string.
	 *
	 * @param [number] n Number
	 * @return Base-36 number, empty string, or string
	 */
	function toBase36(n) {
		return (typeof n === "number" && n !== 0) ?
			n.toString(36) :
			(typeof n === "string" ? n : "");
	}

	/**
	 * Finds all remote resources in the selected window that are visible, and returns an object
	 * keyed by the url with an array of height,width,top,left as the value
	 *
	 * @param {Window} win Window to search
	 * @param {number[]} [winDims] position and size of the window if it is an embedded iframe in the format returned by this function
	 * @return {Object} Object with URLs of visible assets as keys, and Array[height, width, top, left, naturalHeight, naturalWidth] as value
	 */
	function getVisibleEntries(win, winDims) {
		// lower-case tag names should be used: https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
		var els = ["img", "iframe", "image"], entries = {}, x, y, doc = win.document, a = doc.createElement("A");

		winDims = winDims || [0, 0, 0, 0];

		// https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
		x = winDims[3] + (win.pageXOffset !== undefined) ? win.pageXOffset : (doc.documentElement || doc.body.parentNode || doc.body).scrollLeft;
		y = winDims[2] + (win.pageYOffset !== undefined) ? win.pageYOffset : (doc.documentElement || doc.body.parentNode || doc.body).scrollTop;

		// look at each IMG and IFRAME
		els.forEach(function(elname) {
			var elements = doc.getElementsByTagName(elname), el, i, rect, src;

			for (i = 0; i < elements.length; i++) {
				el = elements[i];

				// look at this element if it has a src attribute or xlink:href, and we haven't already looked at it
				if (el) {
					// src = IMG, IFRAME
					// xlink:href = svg:IMAGE
					src = el.src || el.getAttribute("src") || el.getAttribute("xlink:href");

					// change src to be relative
					a.href = src;
					src = a.href;

					if (src && !entries[src]) {
						rect = el.getBoundingClientRect();

						// Require both height & width to be non-zero
						// IE <= 8 does not report rect.height/rect.width so we need offsetHeight & width
						if ((rect.height || el.offsetHeight) && (rect.width || el.offsetWidth)) {
							entries[src] = [
								rect.height || el.offsetHeight,
								rect.width || el.offsetWidth,
								Math.round(rect.top + y),
								Math.round(rect.left + x)
							];

							// If this is an image, it has a naturalHeight & naturalWidth
							// if these are different from its display height and width, we should report that
							// because it indicates scaling in HTML
							if ((el.naturalHeight || el.naturalWidth) && (entries[src][0] !== el.naturalHeight || entries[src][1] !== el.naturalWidth)) {
								entries[src].push(el.naturalHeight, el.naturalWidth);
							}
						}
					}
				}
			}
		});

		return entries;
	}

	/**
	 * Gathers a filtered list of performance entries.
	 * @param [number] from Only get timings from
	 * @param [number] to Only get timings up to
	 * @param [string[]] initiatorTypes Array of initiator types
	 * @return [ResourceTiming[]] Matching ResourceTiming entries
	 */
	function getFilteredResourceTiming(from, to, initiatorTypes) {
		var entries = findPerformanceEntriesForFrame(BOOMR.window, true, 0, 0),
		    i, e, results = {}, initiatorType, url, data,
		    navStart = getNavStartTime(BOOMR.window);

		if (!entries || !entries.length) {
			return [];
		}

		// sort entries by start time
		entries.sort(function(a, b) {
			return a.startTime - b.startTime;
		});

		var filteredEntries = [];
		for (i = 0; i < entries.length; i++) {
			e = entries[i];

			// skip non-resource URLs
			if (e.name.indexOf("about:") === 0 ||
			    e.name.indexOf("javascript:") === 0 ||
			    e.name.indexOf("res:") === 0) {
				continue;
			}

			// skip boomerang.js and config URLs
			if (e.name.indexOf(BOOMR.url) > -1 ||
			    e.name.indexOf(BOOMR.config_url) > -1 ||
			    (typeof BOOMR.getBeaconURL === "function" && BOOMR.getBeaconURL() && e.name.indexOf(BOOMR.getBeaconURL()) > -1)) {
				continue;
			}

			// if the user specified a "from" time, skip resources that started before then
			if (from && (navStart + e.startTime) < from) {
				continue;
			}

			// if we were given a final timestamp, don't add any resources that started after it
			if (to && (navStart + e.startTime) > to) {
				// We can also break at this point since the array is time sorted
				break;
			}

			// if given an array of initiatorTypes to include, skip anything else
			if (typeof initiatorTypes !== "undefined" && initiatorTypes !== "*" && initiatorTypes.length) {
				if (!e.initiatorType || !BOOMR.utils.inArray(e.initiatorType, initiatorTypes)) {
					continue;
				}
			}

			filteredEntries.push(e);
		}

		return filteredEntries;
	}

	/**
	 * Gets compressed content and transfer size information, if available
	 *
	 * @param [ResourceTiming] resource ResourceTiming bject
	 *
	 * @returns [string] Compressed data (or empty string, if not available)
	 */
	function compressSize(resource) {
		var sTrans, sEnc, sDec, sizes;

		// check to see if we can add content sizes
		if (resource.encodedBodySize ||
			resource.decodedBodySize ||
			resource.transferSize) {
			//
			// transferSize: how many bytes were over the wire. It can be 0 in the case of X-O,
			// or if it was fetched from a cache.
			//
			// encodedBodySize: the size after applying encoding (e.g. gzipped size).  It is 0 if X-O.
			//
			// decodedBodySize: the size after removing encoding (e.g. the original content size).  It is 0 if X-O.
			//
			// Here are the possible combinations of values: [encodedBodySize, transferSize, decodedBodySize]
			//
			// Cross-Origin resources w/out Timing-Allow-Origin set: [0, 0, 0] -> [0, 0, 0] -> [empty]
			// 204: [0, t, 0] -> [0, t, 0] -> [e, t-e] -> [, t]
			// 304: [e, t: t <=> e, d: d>=e] -> [e, t-e, d-e]
			// 200 non-gzipped: [e, t: t>=e, d: d=e] -> [e, t-e]
			// 200 gzipped: [e, t: t>=e, d: d>=e] -> [e, t-e, d-e]
			// retrieved from cache non-gzipped: [e, 0, d: d=e] -> [e]
			// retrieved from cache gzipped: [e, 0, d: d>=e] -> [e, _, d-e]
			//
			sTrans = resource.transferSize;
			sEnc = resource.encodedBodySize;
			sDec = resource.decodedBodySize;

			// convert to an array
			sizes = [sEnc, sTrans ? sTrans - sEnc : "_", sDec ? sDec - sEnc : 0];

			// change everything to base36 and remove any trailing ,s
			return sizes.map(toBase36).join(",").replace(/,+$/, "");
		}
		else {
			return "";
		}
	}

	/* BEGIN_DEBUG */
	/**
	 * Decompresses size information back into the specified resource
	 *
	 * @param [string] compressed Compressed string
	 * @param [ResourceTiming] resource ResourceTiming object
	 */
	function decompressSize(compressed, resource) {
		var split, i;

		if (typeof resource === "undefined") {
			resource = {};
		}

		split = compressed.split(",");

		for (i = 0; i < split.length; i++) {
			if (split[i] === "_") {
				// special non-delta value
				split[i] = 0;
			}
			else {
				// fill in missing numbers
				if (split[i] === "") {
					split[i] = 0;
				}

				// convert back from Base36
				split[i] = parseInt(split[i], 36);

				if (i > 0) {
					// delta against first number
					split[i] += split[0];
				}
			}
		}

		// fill in missing
		if (split.length === 1) {
			// transferSize is a delta from encodedSize
			split.push(split[0]);
		}

		if (split.length === 2) {
			// decodedSize is a delta from encodedSize
			split.push(split[0]);
		}

		// re-add attributes to the resource
		resource.encodedBodySize = split[0];
		resource.transferSize = split[1];
		resource.decodedBodySize = split[2];

		return resource;
	}

	/**
	 * Decompress compressed timepoints into a timepoint object with painted and finalized pixel counts
	 * @param {string} comp The compressed timePoint object returned by getOptimizedTimepoints
	 * @return {object} An object in the form { <timePoint>: [ <pixel count>, <finalized pixel count>], ... }
	 */
	function decompressTimePoints(comp) {
		var result = {}, timePoints, i, split, prevs = [0, 0, 0];

		timePoints = comp.split("!");

		for (i = 0; i < timePoints.length; i++) {
			split = timePoints[i]
				.replace(/^~/, "Infinity~")
				.replace("-", "~0~")
				.split("~")
				.map(function(v, j) {
					v = (v === "Infinity" ? Infinity : parseInt(v, 36));

					if (j === 2) {
						v = prevs[1] - v;
					}
					else {
						v = v + prevs[j];
					}

					prevs[j] = v;

					return v;
				});

			result[split[0]] = [ split[1], split[2] || split[1] ];
		}

		return result;
	}
	/* END_DEBUG */

	/**
	 * Trims the URL according to the specified URL trim patterns,
	 * then applies a length limit.
	 *
	 * @param {string} url URL to trim
	 * @param {string} urlsToTrim List of URLs (strings or regexs) to trim
	 * @return {string} Trimmed URL
	 */
	function trimUrl(url, urlsToTrim) {
		var i, urlIdx, trim;

		if (url && urlsToTrim) {
			// trim the payload from any of the specified URLs
			for (i = 0; i < urlsToTrim.length; i++) {
				trim = urlsToTrim[i];

				if (typeof trim === "string") {
					urlIdx = url.indexOf(trim);
					if (urlIdx !== -1) {
						url = url.substr(0, urlIdx + trim.length) + "...";
						break;
					}
				}
				else if (trim instanceof RegExp) {
					if (trim.test(url)) {
						// replace the URL with the first capture group
						url = url.replace(trim, "$1") + "...";
					}
				}
			}
		}

		// apply limits
		return BOOMR.utils.cleanupURL(url, impl.urlLimit);
	}

	/**
	 * Get the latest timepoint for this resource from ResourceTiming. If the resource hasn't started downloading yet, return Infinity
	 * @param {PerformanceResourceEntry} res The resource entry to get the latest time for
	 * @return {number} latest timepoint for the resource or now if the resource is still in progress
	 */
	function getResourceLatestTime(res) {
		// If responseEnd is non zero, return it
		if (res.responseEnd) {
			return res.responseEnd;
		}

		// If responseStart is non zero, assume it accounts for 80% of the load time, and bump it by 20%
		if (res.responseStart && res.startTime) {
			return res.responseStart + (res.responseStart - res.startTime) * 0.2;
		}

		// If the resource hasn't even started loading, assume it will come at some point in the distant future (after the beacon)
		// we'll let the server determine what to do
		return Infinity;
	}

	/**
	 * Given a 2D array representing the screen and a list of rectangular dimension tuples, turn on the screen pixels that match the dimensions.
	 * Previously set pixels that are also set with the current call will be overwritten with the new value of pixelValue
	 * @param {number[][]} currentPixels A 2D sparse array of numbers representing set pixels or undefined if no pixels are currently set.
	 * @param {number[][]} dimList A list of rectangular dimension tuples in the form [height, width, top, left] for resources to be painted on the virtual screen
	 * @param {number} pixelValue The numeric value to set all new pixels to
	 * @return {number[][]} An updated version of currentPixels.
	 */
	function mergePixels(currentPixels, dimList, pixelValue) {
		var s = BOOMR.window.screen,
		    h = s.height, w = s.width;

		return dimList.reduce(
			function(acc, val) {
				var x_min, x_max,
				    y_min, y_max,
				    x, y;

				x_min = Math.max(0, val[3]);
				y_min = Math.max(0, val[2]);
				x_max = Math.min(val[3] + val[1], w);
				y_max = Math.min(val[2] + val[0], h);

				// Object is off-screen
				if (x_min >= x_max || y_min >= y_max) {
					return acc;
				}

				// We fill all pixels of this resource with a true
				// this is needed to correctly account for overlapping resources
				for (y = y_min; y < y_max; y++) {
					if (!acc[y]) {
						acc[y] = [];
					}

					for (x = x_min; x < x_max; x++) {
						acc[y][x] = pixelValue;
					}
				}

				return acc;
			},
			currentPixels || []
		);
	}

	/**
	 * Counts the number of pixels that are set in the given 2D array representing the screen
	 * @param {number[][]} pixels A 2D boolean array representing the screen with painted pixels set to true
	 * @param {number} [rangeMin] If included, will only count pixels >= this value
	 * @param {number} [rangeMax] If included, will only count pixels <= this value
	 * @return {number} The number of pixels set in the passed in array
	 */
	function countPixels(pixels, rangeMin, rangeMax) {
		rangeMin = rangeMin || 0;
		rangeMax = rangeMax || Infinity;

		return pixels
			.reduce(function(acc, val) {
				return acc +
					val.filter(function(v) {
						return rangeMin <= v && v <= rangeMax;
					}).length;
			},
			0
		);
	}

	/**
	 * Returns a compressed string representation of a hash of timepoints to painted pixel count and finalized pixel count.
	 * - Timepoints are reduced to milliseconds relative to the previous timepoint while pixel count is reduced to pixels relative to the previous timepoint. Finalized pixels are reduced to be relative (negated) to full pixels for that timepoint
	 * - The relative timepoint and relative pixels are then each Base36 encoded and combined with a ~
	 * - Finally, the list of timepoints is merged, separated by ! and returned
	 * @param {object} timePoints An object in the form { "<timePoint>" : [ <object dimensions>, <object dimensions>, ...], <timePoint>: [...], ...}, where <object dimensions> is [height, width, top, left]
	 * @return {string} The serialized compressed timepoint object with ! separating individual triads and ~ separating timepoint and pixels within the triad. The elements of the triad are the timePoint, number of pixels painted at that point, and the number of pixels finalized at that point (ie, no further paints). If the third part of the triad is 0, it is omitted, if the second part of the triad is 0, it is omitted and the repeated ~~ is replaced with a -
	 */
	function getOptimizedTimepoints(timePoints) {
		var i, roundedTimePoints = {}, timeSequence, tPixels,
		    t_prev, t, p_prev, p, f_prev, f,
		    comp, result = [];

		// Round timepoints to the nearest integral ms
		timeSequence = Object.keys(timePoints);

		for (i = 0; i < timeSequence.length; i++) {
			t = Math.round(Number(timeSequence[i]));
			if (typeof roundedTimePoints[t] === "undefined") {
				roundedTimePoints[t] = [];
			}

			// Merge
			Array.prototype.push.apply(roundedTimePoints[t], timePoints[timeSequence[i]]);
		}

		// Get all unique timepoints nearest ms sorted in ascending order
		timeSequence = Object.keys(roundedTimePoints).map(Number).sort(function(a, b) { return a - b; });

		if (timeSequence.length === 0) {
			return {};
		}

		// First loop identifies pixel first paints
		for (i = 0; i < timeSequence.length; i++) {
			t = timeSequence[i];
			tPixels = mergePixels(tPixels, roundedTimePoints[t], t);

			p = countPixels(tPixels);
			timeSequence[i] = [t, p];
		}

		// We'll make all times and pixel counts relative to the previous ones
		t_prev = 0;
		p_prev = 0;
		f_prev = 0;

		// Second loop identifies pixel final paints
		for (i = 0; i < timeSequence.length; i++) {
			t = timeSequence[i][0];
			p = timeSequence[i][1];
			f = countPixels(tPixels, 0, t);

			if (p > p_prev || f > f_prev) {
				comp = (t === Infinity ? "" : toBase36(Math.round(t - t_prev))) + "~" + toBase36(p - p_prev) + "~" + toBase36(p - f);

				comp = comp.replace(/~~/, "-").replace(/~$/, "");

				result.push(comp);

				t_prev = t;
				p_prev = p;
				f_prev = f;
			}
		}

		return result.join("!").replace(/!+$/, "");
	}

	/**
	 * Gathers performance entries and compresses the result.
	 * @param [number] from Only get timings from
	 * @param [number] to Only get timings up to
	 * @return An object containing the Optimized performance entries trie and the Optimized timepoints array
	 */
	function getCompressedResourceTiming(from, to) {
		/*eslint no-script-url:0*/
		var entries = getFilteredResourceTiming(from, to, impl.trackedResourceTypes),
		    i, e, results = {}, initiatorType, url, data,
		    timePoints = {};

		if (!entries || !entries.length) {
			return {};
		}

		for (i = 0; i < entries.length; i++) {
			e = entries[i];

			//
			// Compress the RT data into a string:
			//
			// 1. Start with the initiator type, which is mapped to a number.
			// 2. Put the timestamps into an array in a set order (reverse chronological order),
			//    which pushes timestamps that are more likely to be zero (duration since
			//    startTime) towards the end of the array (eg redirect* and domainLookup*).
			// 3. Convert these timestamps to Base36, with empty or zero times being an empty string
			// 4. Join the array on commas
			// 5. Trim all trailing empty commas (eg ",,,")
			//

			// prefix initiatorType to the string
			initiatorType = INITIATOR_TYPES[e.initiatorType];
			if (typeof initiatorType === "undefined") {
				initiatorType = 0;
			}

			data = initiatorType + [
				trimTiming(e.startTime, 0),
				trimTiming(e.responseEnd, e.startTime),
				trimTiming(e.responseStart, e.startTime),
				trimTiming(e.requestStart, e.startTime),
				trimTiming(e.connectEnd, e.startTime),
				trimTiming(e.secureConnectionStart, e.startTime),
				trimTiming(e.connectStart, e.startTime),
				trimTiming(e.domainLookupEnd, e.startTime),
				trimTiming(e.domainLookupStart, e.startTime),
				trimTiming(e.redirectEnd, e.startTime),
				trimTiming(e.redirectStart, e.startTime)
			].map(toBase36).join(",").replace(/,+$/, "");

			// add content and transfer size info
			var compSize = compressSize(e);
			if (compSize !== "") {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_SIZE_TYPE + compSize;
			}

			if (e.hasOwnProperty("scriptAttrs")) {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_SCRIPT_ATTR_TYPE + e.scriptAttrs;
			}

			url = trimUrl(e.name, impl.trimUrls);

			// if this entry already exists, add a pipe as a separator
			if (results[url] !== undefined) {
				results[url] += "|" + data;
			}
			else if (e.visibleDimensions) {
				// We use * as an additional separator to indicate it is not a new resource entry
				// The following characters will not be URL encoded:
				// *!-.()~_ but - and . are special to number representation so we don't use them
				// After the *, the type of special data (ResourceTiming = 0) is added
				results[url] =
					SPECIAL_DATA_PREFIX +
					SPECIAL_DATA_DIMENSION_TYPE +
					e.visibleDimensions.map(Math.round).map(toBase36).join(",").replace(/,+$/, "") +
					"|" +
					data;
			}
			else {
				results[url] = data;
			}

			if (e.visibleDimensions) {
				if (!timePoints[e.latestTime]) {
					timePoints[e.latestTime] = [];
				}
				timePoints[e.latestTime].push(e.visibleDimensions);
			}
		}

		return { restiming: optimizeTrie(convertToTrie(results), true) };
	}

	/**
	 * Compresses an array of ResourceTiming-like objects (those with a fetchStart
	 * and a responseStart/responseEnd) by reducing multiple objects with the same
	 * fetchStart down to a single object with the longest duration.
	 *
	 * Array must be pre-sorted by fetchStart, then by responseStart||responseEnd
	 *
	 * @param [ResourceTiming[]] resources ResourceTiming-like resources, with just
	 *  a fetchStart and responseEnd
	 *
	 * @returns Duration, in milliseconds
	 */
	function reduceFetchStarts(resources) {
		var times = [];

		if (!resources || !resources.length) {
			return times;
		}

		for (var i = 0; i < resources.length; i++) {
			var res = resources[i];

			// if there is a subsequent resource with the same fetchStart, use
			// its value instead (since pre-sort guarantee is that it's end
			// will be >= this one)
			if (i !== resources.length - 1 &&
				res.fetchStart === resources[i + 1].fetchStart) {
				continue;
			}

			// track just the minimum fetchStart and responseEnd
			times.push({
				fetchStart: res.fetchStart,
				responseEnd: res.responseStart || res.responseEnd
			});
		}

		return times;
	}

	/**
	 * Calculates the union of durations of the specified resources.  If
	 * any resources overlap, those timeslices are not double-counted.
	 *
	 * @param [ResourceTiming[]] resources Resources
	 *
	 * @returns Duration, in milliseconds
	 */
	function calculateResourceTimingUnion(resources) {
		var i;

		if (!resources || !resources.length) {
			return 0;
		}

		// First, sort by start time, then end time
		resources.sort(function(a, b) {
			if (a.fetchStart !== b.fetchStart) {
				return a.fetchStart - b.fetchStart;
			}
			else {
				var ae = a.responseStart || a.responseEnd;
				var be = b.responseStart || b.responseEnd;

				return ae - be;
			}
		});

		// Next, find all resources with the same start time, and reduce
		// them to the largest end time.
		var times = reduceFetchStarts(resources);

		// Third, for every resource, if the start is less than the end of
		// any previous resource, change its start to the end.  If the new start
		// time is more than the end time, we can discard this one.
		var times2 = [];
		var furthestEnd = 0;

		for (i = 0; i < times.length; i++) {
			var res = times[i];

			if (res.fetchStart < furthestEnd) {
				res.fetchStart = furthestEnd;
			}

			// as long as this resource has > 0 duration, add it to our next list
			if (res.fetchStart < res.responseEnd) {
				times2.push(res);

				// keep track of the furthest end point
				furthestEnd = res.responseEnd;
			}
		}

		// Reduce down again to same start times again, and now we should
		// have no overlapping regions
		var times3 = reduceFetchStarts(times2);

		// Finally, calculate the overall time from our non-overlapping regions
		var totalTime = 0;
		for (i = 0; i < times3.length; i++) {
			totalTime += times3[i].responseEnd - times3[i].fetchStart;
		}

		return totalTime;
	}

	/**
	 * Adds 'restiming' to the beacon
	 *
	 * @param [number] from Only get timings from
	 * @param [number] to Only get timings up to
	 */
	function addResourceTimingToBeacon(from, to) {
		var r;

		// Can't send if we don't support JSON
		if (typeof JSON === "undefined") {
			return;
		}

		BOOMR.removeVar("restiming");
		r = getCompressedResourceTiming(from, to);
		if (r) {
			BOOMR.info("Client supports Resource Timing API", "restiming");

			BOOMR.addVar({
				restiming: JSON.stringify(r.restiming)
			});
		}
	}

	impl = {
		complete: false,
		sentNavBeacon: false,
		initialized: false,
		supported: false,
		xhr_load: function() {
			if (this.complete) {
				return;
			}

			// page load might not have happened, or will happen later, so
			// set us as complete so we don't hold the page load
			this.complete = true;
			BOOMR.sendBeacon();
		},
		xssBreakWords: DEFAULT_XSS_BREAK_WORDS,
		urlLimit: DEFAULT_URL_LIMIT,
		clearOnBeacon: false,
		trimUrls: [],
		/**
		 * Array of resource types to track, or "*" for all.
		 *  @type {string[]|string}
		 */
		trackedResourceTypes: "*",
		done: function() {
			// Stop if we've already sent a nav beacon (both xhr and spa* beacons
			// add restiming manually).
			if (this.sentNavBeacon) {
				return;
			}

			addResourceTimingToBeacon();

			this.complete = true;
			this.sentNavBeacon = true;

			BOOMR.sendBeacon();
		},

		onBeacon: function(vars) {
			var p = BOOMR.getPerformance();

			// clear metrics
			if (vars.hasOwnProperty("restiming")) {
				BOOMR.removeVar("restiming");
			}

			if (impl.clearOnBeacon && p) {
				var clearResourceTimings = p.clearResourceTimings || p.webkitClearResourceTimings;
				if (clearResourceTimings && typeof clearResourceTimings === "function") {
					clearResourceTimings.call(p);
				}
			}
		},

		prerenderToVisible: function() {
			// ensure we add our data to the beacon even if we had added it
			// during prerender (in case another beacon went out in between)
			this.sentNavBeacon = false;

			// add our data to the beacon
			this.done();
		}
	};

	BOOMR.plugins.ResourceTiming = {
		init: function(config) {
			var p = BOOMR.getPerformance();

			BOOMR.utils.pluginConfig(impl, config, "ResourceTiming",
				["xssBreakWords", "clearOnBeacon", "urlLimit", "trimUrls", "trackedResourceTypes"]);

			if (impl.initialized) {
				return this;
			}

			if (p && typeof p.getEntriesByType === "function") {
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
				BOOMR.subscribe("xhr_load", impl.xhr_load, null, impl);
				BOOMR.subscribe("onbeacon", impl.onBeacon, null, impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);
				impl.supported = true;
			}
			else {
				impl.complete = true;
			}

			impl.initialized = true;

			return this;
		},
		is_complete: function() {
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		},
		//
		// Public Exports
		//
		getCompressedResourceTiming: getCompressedResourceTiming,
		getFilteredResourceTiming: getFilteredResourceTiming,
		calculateResourceTimingUnion: calculateResourceTimingUnion,
		addResourceTimingToBeacon: addResourceTimingToBeacon

		//
		// Test Exports (only for debug)
		//
		/* BEGIN_DEBUG */,
		trimTiming: trimTiming,
		convertToTrie: convertToTrie,
		optimizeTrie: optimizeTrie,
		findPerformanceEntriesForFrame: findPerformanceEntriesForFrame,
		toBase36: toBase36,
		getVisibleEntries: getVisibleEntries,
		reduceFetchStarts: reduceFetchStarts,
		compressSize: compressSize,
		decompressSize: decompressSize,
		trimUrl: trimUrl,
		getResourceLatestTime: getResourceLatestTime,
		mergePixels: mergePixels,
		countPixels: countPixels,
		getOptimizedTimepoints: getOptimizedTimepoints,
		decompressTimePoints: decompressTimePoints,
		SPECIAL_DATA_PREFIX: SPECIAL_DATA_PREFIX,
		SPECIAL_DATA_DIMENSION_TYPE: SPECIAL_DATA_DIMENSION_TYPE,
		SPECIAL_DATA_SIZE_TYPE: SPECIAL_DATA_SIZE_TYPE,
		SPECIAL_DATA_SCRIPT_ATTR_TYPE: SPECIAL_DATA_SCRIPT_ATTR_TYPE,
		ASYNC_ATTR: ASYNC_ATTR,
		DEFER_ATTR: DEFER_ATTR,
		LOCAT_ATTR: LOCAT_ATTR
		/* END_DEBUG */
	};

}());
;/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

// This is the Round Trip Time plugin.  Abbreviated to RT
// the parameter is the window
(function(w) {

/*eslint no-underscore-dangle:0*/

	var d, impl,
	    COOKIE_EXP = 60 * 60 * 24 * 7;


	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.RT) {
		return;
	}

	// private object
	impl = {
		onloadfired: false,	//! Set when the page_ready event fires
					//  Use this to determine if unload fires before onload
		unloadfired: false,	//! Set when the first unload event fires
					//  Use this to make sure we don't beacon twice for beforeunload and unload
		visiblefired: false,	//! Set when page becomes visible (Chrome/IE)
					//  Use this to determine if user bailed without opening the tab
		initialized: false,	//! Set when init has completed to prevent double initialization
		complete: false,	//! Set when this plugin has completed
		autorun: true,
		timers: {},		//! Custom timers that the developer can use
					// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
		cookie: "RT",		//! Name of the cookie that stores the start time and referrer
		cookie_exp: COOKIE_EXP,	//! Cookie expiry in seconds (7 days)
		strict_referrer: true,	//! By default, don't beacon if referrers don't match.
					// If set to false, beacon both referrer values and let
					// the back end decide

		navigationType: 0,	// Navigation Type from the NavTiming API.  We mainly care if this was BACK_FORWARD
					// since cookie time will be incorrect in that case
		navigationStart: undefined,
		responseStart: undefined,
		t_start: undefined,	// t_start that came off the cookie
		cached_t_start: undefined,	// cached value of t_start once we know its real value
		cached_xhr_start: undefined,	// cached value of xhr t_start once we know its real value
		t_fb_approx: undefined,	// approximate first byte time for browsers that don't support navtiming
		r: undefined,		// referrer from the cookie
		r2: undefined,		// referrer from document.referer

		// These timers are added directly as beacon variables
		basic_timers: { t_done: 1, t_resp: 1, t_page: 1},

		// Vars that were added to the beacon that we can remove after beaconing
		addedVars: [],

		/**
		 * Merge new cookie `params` onto current cookie, and set `timer` param on cookie to current timestamp
		 * @param params object containing keys & values to merge onto current cookie.  A value of `undefined`
		 *		 will remove the key from the cookie
		 * @param timer  string key name that will be set to the current timestamp on the cookie
		 *
		 * @returns true if the cookie was updated, false if the cookie could not be set for any reason
		 */
		updateCookie: function(params, timer) {
			var t_end, t_start, subcookies, k;

			// Disable use of RT cookie by setting its name to a falsy value
			if (!this.cookie) {
				return false;
			}

			subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(this.cookie)) || {};

			if (typeof params === "object") {
				for (k in params) {
					if (params.hasOwnProperty(k)) {
						if (params[k] === undefined) {
							if (subcookies.hasOwnProperty(k)) {
								delete subcookies[k];
							}
						}
						else {
							if (k === "nu" || k === "r") {
								params[k] = BOOMR.utils.hashQueryString(params[k], true);
							}

							subcookies[k] = params[k];
						}
					}
				}
			}

			t_start = BOOMR.now();

			if (timer) {
				subcookies[timer] = t_start;
				impl.lastActionTime = t_start;
			}

			BOOMR.debug("Setting cookie (timer=" + timer + ")\n" + BOOMR.utils.objectToString(subcookies), "rt");
			if (!BOOMR.utils.setCookie(this.cookie, subcookies, this.cookie_exp)) {
				BOOMR.error("cannot set start cookie", "rt");
				return false;
			}

			t_end = BOOMR.now();
			if (t_end - t_start > 50) {
				// It took > 50ms to set the cookie
				// The user Most likely has cookie prompting turned on so
				// t_start won't be the actual unload time
				// We bail at this point since we can't reliably tell t_done
				BOOMR.utils.removeCookie(this.cookie);

				// at some point we may want to log this info on the server side
				BOOMR.error("took more than 50ms to set cookie... aborting: " +
					t_start + " -> " + t_end, "rt");
			}

			return true;
		},

		/**
		 * Read initial values from cookie and clear out cookie values it cares about after reading.
		 * This makes sure that other pages (eg: loaded in new tabs) do not get an invalid cookie time.
		 * This method should only be called from init, and may be called more than once.
		 *
		 * Request start time is the greater of last page beforeunload or last click time
		 * If start time came from a click, we check that the clicked URL matches the current URL
		 * If it came from a beforeunload, we check that cookie referrer matches document.referrer
		 *
		 * If we had a pageHide time or unload time, we use that as a proxy for first byte on non-navtiming
		 * browsers.
		 */
		initFromCookie: function() {
			var url, subcookies;
			subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(this.cookie));

			if (!subcookies) {
				return;
			}

			subcookies.s = Math.max(+subcookies.ld || 0, Math.max(+subcookies.ul || 0, +subcookies.cl || 0));

			BOOMR.debug("Read from cookie " + BOOMR.utils.objectToString(subcookies), "rt");

			// If we have a start time, and either a referrer, or a clicked on URL,
			// we check if the start time is usable
			if (subcookies.s && (subcookies.r || subcookies.nu)) {
				this.r = subcookies.r;
				url = BOOMR.utils.hashQueryString(d.URL, true);

				// Either the URL of the page setting the cookie needs to match document.referrer
				BOOMR.debug(this.r + " =?= " + this.r2, "rt");

				// Or the start timer was no more than 15ms after a click or form submit
				// and the URL clicked or submitted to matches the current page's URL
				// (note the start timer may be later than click if both click and beforeunload fired
				// on the previous page)
				BOOMR.debug(subcookies.s + " <? " + (+subcookies.cl + 15), "rt");
				BOOMR.debug(subcookies.nu + " =?= " + url, "rt");

				if (!this.strict_referrer ||
					(subcookies.nu && subcookies.nu === url && subcookies.s < +subcookies.cl + 15) ||
					(subcookies.s === +subcookies.ul && this.r === this.r2)
				) {
					this.t_start = subcookies.s;

					// additionally, if we have a pagehide, or unload event, that's a proxy
					// for the first byte of the current page, so use that wisely
					if (+subcookies.hd > subcookies.s) {
						this.t_fb_approx = parseInt(subcookies.hd, 10);
					}
				}
				else {
					this.t_start = this.t_fb_approx = undefined;
				}
			}

			// Now that we've pulled out the timers, we'll clear them so they don't pollute future calls
			this.updateCookie({
				s: undefined,	// start timer
				r: undefined,	// referrer
				nu: undefined,	// clicked url
				ul: undefined,	// onbeforeunload time
				cl: undefined,	// onclick time
				hd: undefined,	// onunload or onpagehide time
				ld: undefined,	// last load time
				rl: undefined
			});
		},

		/**
		 * Figure out how long boomerang and other URLs took to load using
		 * ResourceTiming if available, or built in timestamps.
		 */
		getBoomerangTimings: function() {
			var res, urls, url, startTime, data;

			function trimTiming(time, st) {
				// strip from microseconds to milliseconds only
				var timeMs = Math.round(time ? time : 0),
				    startTimeMs = Math.round(st ? st : 0);

				timeMs = (timeMs === 0 ? 0 : (timeMs - startTimeMs));

				return timeMs ? timeMs : "";
			}

			if (BOOMR.t_start) {
				// How long does it take Boomerang to load up and execute (fb to lb)?
				BOOMR.plugins.RT.startTimer("boomerang", BOOMR.t_start);
				BOOMR.plugins.RT.endTimer("boomerang", BOOMR.t_end);	// t_end === null defaults to current time

				// How long did it take from page request to boomerang fb?
				BOOMR.plugins.RT.endTimer("boomr_fb", BOOMR.t_start);

				if (BOOMR.t_lstart) {
					// when did the boomerang loader start loading boomerang on the page?
					BOOMR.plugins.RT.endTimer("boomr_ld", BOOMR.t_lstart);
					// What was the network latency for boomerang (request to first byte)?
					BOOMR.plugins.RT.setTimer("boomr_lat", BOOMR.t_start - BOOMR.t_lstart);
				}
			}

			// use window and not w because we want the inner iframe
			try {
				if (window &&
				    "performance" in window &&
				    window.performance &&
				    typeof window.performance.getEntriesByName === "function") {
					urls = { "rt.bmr": BOOMR.url };


					for (url in urls) {
						if (urls.hasOwnProperty(url) && urls[url]) {
							res = window.performance.getEntriesByName(urls[url]);
							if (!res || res.length === 0 || !res[0]) {
								continue;
							}

							res = res[0];

							startTime = trimTiming(res.startTime, 0);
							data = [
								startTime,
								trimTiming(res.responseEnd, startTime),
								trimTiming(res.responseStart, startTime),
								trimTiming(res.requestStart, startTime),
								trimTiming(res.connectEnd, startTime),
								trimTiming(res.secureConnectionStart, startTime),
								trimTiming(res.connectStart, startTime),
								trimTiming(res.domainLookupEnd, startTime),
								trimTiming(res.domainLookupStart, startTime),
								trimTiming(res.redirectEnd, startTime),
								trimTiming(res.redirectStart, startTime)
							].join(",").replace(/,+$/, "");

							BOOMR.addVar(url, data);
							impl.addedVars.push(url);
						}
					}
				}
			}
			catch (e) {
				BOOMR.addError(e, "rt.getBoomerangTimings");
			}
		},

		/**
		 * Check if we're in a prerender state, and if we are, set additional timers.
		 * In Chrome/IE, a prerender state is when a page is completely rendered in an in-memory buffer, before
		 * a user requests that page.  We do not beacon at this point because the user has not shown intent
		 * to view the page.  If the user opens the page, the visibility state changes to visible, and we
		 * fire the beacon at that point, including any timing details for prerendering.
		 *
		 * Sets the `t_load` timer to the actual value of page load time (request initiated by browser to onload)
		 *
		 * @returns true if this is a prerender state, false if not (or not supported)
		 */
		checkPreRender: function() {
			if (BOOMR.visibilityState() !== "prerender") {
				return false;
			}

			// This means that onload fired through a pre-render.  We'll capture this
			// time, but wait for t_done until after the page has become either visible
			// or hidden (ie, it moved out of the pre-render state)
			// http://code.google.com/chrome/whitepapers/pagevisibility.html
			// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
			// http://code.google.com/chrome/whitepapers/prerender.html

			BOOMR.plugins.RT.startTimer("t_load", this.navigationStart);
			BOOMR.plugins.RT.endTimer("t_load");					// this will measure actual onload time for a prerendered page
			BOOMR.plugins.RT.startTimer("t_prerender", this.navigationStart);
			BOOMR.plugins.RT.startTimer("t_postrender");				// time from prerender to visible or hidden

			return true;
		},

		/**
		 * Initialise timers from the NavigationTiming API.  This method looks at various sources for
		 * Navigation Timing, and also patches around bugs in various browser implementations.
		 * It sets the beacon parameter `rt.start` to the source of the timer
		 */
		initFromNavTiming: function() {
			var ti, p, source;

			if (this.navigationStart) {
				return;
			}

			// Get start time from WebTiming API see:
			// https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html
			// http://blogs.msdn.com/b/ie/archive/2010/06/28/measuring-web-page-performance.aspx
			// http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
			p = BOOMR.getPerformance();

			if (p && p.navigation) {
				this.navigationType = p.navigation.type;
			}

			if (p && p.timing) {
				ti = p.timing;
			}
			else if (w.chrome && w.chrome.csi && w.chrome.csi().startE) {
				// Older versions of chrome also have a timing API that's sort of documented here:
				// http://ecmanaut.blogspot.com/2010/06/google-bom-feature-ms-since-pageload.html
				// source here:
				// http://src.chromium.org/viewvc/chrome/trunk/src/chrome/renderer/loadtimes_extension_bindings.cc?view=markup
				ti = {
					navigationStart: w.chrome.csi().startE
				};
				source = "csi";
			}
			else if (w.gtbExternal && w.gtbExternal.startE()) {
				// The Google Toolbar exposes navigation start time similar to old versions of chrome
				// This would work for any browser that has the google toolbar installed
				ti = {
					navigationStart: w.gtbExternal.startE()
				};
				source = "gtb";
			}

			if (ti) {
				// Always use navigationStart since it falls back to fetchStart (not with redirects)
				// If not set, we leave t_start alone so that timers that depend
				// on it don't get sent back.  Never use requestStart since if
				// the first request fails and the browser retries, it will contain
				// the value for the new request.
				BOOMR.addVar("rt.start", source || "navigation");
				this.navigationStart = ti.navigationStart || ti.fetchStart || undefined;
				this.responseStart = ti.responseStart || undefined;

				// bug in Firefox 7 & 8 https://bugzilla.mozilla.org/show_bug.cgi?id=691547
				if (navigator.userAgent.match(/Firefox\/[78]\./)) {
					this.navigationStart = ti.unloadEventStart || ti.fetchStart || undefined;
				}
			}
			else {
				BOOMR.warn("This browser doesn't support the WebTiming API", "rt");
			}

			return;
		},

		/**
		 * Validate that the time we think is the load time is correct.  This can be wrong if boomerang was loaded
		 * after onload, so in that case, if navigation timing is available, we use that instead.
		 */
		validateLoadTimestamp: function(t_now, data, ename) {
			var p;

			// beacon with detailed timing information
			if (data && data.timing && data.timing.loadEventEnd) {
				return data.timing.loadEventEnd;
			}
			else if (ename === "xhr" && (!data || !BOOMR.utils.inArray(data.initiator, BOOMR.constants.BEACON_TYPE_SPAS))) {
				// if this is an XHR event, trust the input end "now" timestamp
				return t_now;
			}
			// Boomerang loaded late and...
			else if (BOOMR.loadedLate) {
				p = BOOMR.getPerformance();

				// We have navigation timing,
				if (p && p.timing) {
					// and boomerang loaded after onload fired
					if (p.timing.loadEventStart && p.timing.loadEventStart < BOOMR.t_end) {
						return p.timing.loadEventStart;
					}
				}
				// We don't have navigation timing,
				else {
					// So we'll just use the time when boomerang was added to the page
					// Assuming that this means boomerang was added in onload.  If we logged the
					// onload timestamp (via loader snippet), use that first.
					return BOOMR.t_onload || BOOMR.t_lstart || BOOMR.t_start || t_now;
				}
			}

			// default to now
			return t_now;
		},

		/**
		 * Set timers appropriate at page load time.  This method should be called from done() only when
		 * the page_ready event fires.  It sets the following timer values:
		 *		- t_resp:	time from request start to first byte
		 *		- t_page:	time from first byte to load
		 *		- t_postrender	time from prerender state to visible state
		 *		- t_prerender	time from navigation start to visible state
		 *
		 * @param ename  The Event name that initiated this control flow
		 * @param t_done The timestamp when the done() method was called
		 * @param data   Event data passed in from the caller.  For xhr beacons, this may contain detailed timing information
		 *
		 * @returns true if timers were set, false if we're in a prerender state, caller should abort on false.
		 */
		setPageLoadTimers: function(ename, t_done, data) {
			var t_resp_start, t_fetch_start, p, navSt;

			if (ename !== "xhr") {
				impl.initFromCookie();
				impl.initFromNavTiming();

				if (impl.checkPreRender()) {
					return false;
				}
			}

			if (ename === "xhr") {
				if (data.timers) {
					// If we were given a list of timers, set those first
					for (var timerName in data.timers) {
						if (data.timers.hasOwnProperty(timerName)) {
							BOOMR.plugins.RT.setTimer(timerName, data.timers[timerName]);
						}
					}
				}
				else if (data && data.timing) {
					// Use details from XHR object to figure out responce latency and page time. Use
					// responseEnd (instead of responseStart) since it's not until responseEnd
					// that the browser can consume the data, and responseEnd is the only guarateed
					// timestamp with cross-origin XHRs if ResourceTiming is enabled.

					t_fetch_start = data.timing.fetchStart;

					if (typeof t_fetch_start === "undefined" || data.timing.responseEnd >= t_fetch_start) {
						t_resp_start = data.timing.responseEnd;
					}
				}
			}
			else if (impl.responseStart) {
				// Use NavTiming API to figure out resp latency and page time
				// t_resp will use the cookie if available or fallback to NavTiming

				// only use if the time looks legit (after navigationStart)
				if (impl.responseStart >= impl.cached_t_start) {
					t_resp_start = impl.responseStart;
				}
			}
			else if (impl.timers.hasOwnProperty("t_page")) {
				// If the dev has already started t_page timer, we can end it now as well
				BOOMR.plugins.RT.endTimer("t_page");
			}
			else if (impl.t_fb_approx) {
				// If we have an approximate first byte time from the cookie, use it
				t_resp_start = impl.t_fb_approx;
			}

			if (t_resp_start) {
				// if we have a fetch start as well, set the specific timestamps instead of from rt.start
				if (t_fetch_start) {
					BOOMR.plugins.RT.setTimer("t_resp", t_fetch_start, t_resp_start);
				}
				else {
					BOOMR.plugins.RT.endTimer("t_resp", t_resp_start);
				}

				// t_load is the actual time load completed if using prerender
				if (ename === "load" && impl.timers.t_load) {
					BOOMR.plugins.RT.setTimer("t_page", impl.timers.t_load.end - t_resp_start);
				}
				else {
					//
					// Ensure that t_done is after t_resp_start.  If not, set a var so we
					// knew there was an inversion.  This can happen due to bugs in NavTiming
					// clients, where responseEnd happens after all other NavTiming events.
					//
					if (t_done < t_resp_start) {
						BOOMR.addVar("t_page.inv", 1);
					}
					else {
						BOOMR.plugins.RT.setTimer("t_page", t_done - t_resp_start);
					}
				}
			}

			// If a prerender timer was started, we can end it now as well
			if (ename === "load" && impl.timers.hasOwnProperty("t_postrender")) {
				BOOMR.plugins.RT.endTimer("t_postrender");
				BOOMR.plugins.RT.endTimer("t_prerender");
			}

			return true;
		},

		/**
		 * Writes a bunch of timestamps onto the beacon that help in request tracing on the server
		 * - rt.tstart: The value of t_start that we determined was appropriate
		 * - rt.nstart: The value of navigationStart if different from rt.tstart
		 * - rt.cstart: The value of t_start from the cookie if different from rt.tstart
		 * - rt.bstart: The timestamp when boomerang started
		 * - rt.blstart:The timestamp when boomerang was added to the host page
		 * - rt.end:    The timestamp when the t_done timer ended
		 *
		 * @param t_start The value of t_start that we plan to use
		 */
		setSupportingTimestamps: function(t_start) {
			if (t_start) {
				BOOMR.addVar("rt.tstart", t_start);
			}
			if (typeof impl.navigationStart === "number" && impl.navigationStart !== t_start) {
				BOOMR.addVar("rt.nstart", impl.navigationStart);
			}
			if (typeof impl.t_start === "number" && impl.t_start !== t_start) {
				BOOMR.addVar("rt.cstart", impl.t_start);
			}
			BOOMR.addVar("rt.bstart", BOOMR.t_start);
			if (BOOMR.t_lstart) {
				BOOMR.addVar("rt.blstart", BOOMR.t_lstart);
			}
			BOOMR.addVar("rt.end", impl.timers.t_done.end);	// don't just use t_done because dev may have called endTimer before we did
		},

		/**
		 * Determines the best value to use for t_start.
		 * If called from an xhr call, then use the start time for that call
		 * Else, If we have navigation timing, use that
		 * Else, If we have a cookie time, and this isn't the result of a BACK button, use the cookie time
		 * Else, if we have a cached timestamp from an earlier call, use that
		 * Else, give up
		 *
		 * @param ename	The event name that resulted in this call. Special consideration for "xhr"
		 * @param data  Data passed in from the event caller. If the event name is "xhr",
		 *              this should contain the page group name for the xhr call in an attribute called `name`
		 *		and optionally, detailed timing information in a sub-object called `timing`
		 *              and resource information in a sub-object called `resource`
		 *
		 * @returns the determined value of t_start or undefined if unknown
		 */
		determineTStart: function(ename, data) {
			var t_start;
			if (ename === "xhr") {
				if (data && data.name && impl.timers[data.name]) {
					// For xhr timers, t_start is stored in impl.timers.xhr_{page group name}
					// and xhr.pg is set to {page group name}
					t_start = impl.timers[data.name].start;
				}
				else if (data && data.timing && data.timing.requestStart) {
					// For automatically instrumented xhr timers, we have detailed timing information
					t_start = data.timing.requestStart;
				}

				if (typeof t_start === "undefined" && data && BOOMR.utils.inArray(data.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
					// if we don't have a start time, set to none so it can possibly be fixed up
					BOOMR.addVar("rt.start", "none");
				}
				else {
					BOOMR.addVar("rt.start", "manual");
				}

				impl.cached_xhr_start = t_start;
			}
			else {
				if (impl.navigationStart) {
					t_start = impl.navigationStart;
				}
				else if (impl.t_start && impl.navigationType !== 2) {
					t_start = impl.t_start;			// 2 is TYPE_BACK_FORWARD but the constant may not be defined across browsers
					BOOMR.addVar("rt.start", "cookie");	// if the user hit the back button, referrer will match, and cookie will match
				}						// but will have time of previous page start, so t_done will be wrong
				else if (impl.cached_t_start) {
					t_start = impl.cached_t_start;
				}
				else {
					BOOMR.addVar("rt.start", "none");
					t_start = undefined;			// force all timers to NaN state
				}

				impl.cached_t_start = t_start;
			}

			BOOMR.debug("Got start time: " + t_start, "rt");
			return t_start;
		},

		page_ready: function() {
			// we need onloadfired because it's possible to reset "impl.complete"
			// if you're measuring multiple xhr loads, but not possible to reset
			// impl.onloadfired
			this.onloadfired = true;
		},

		check_visibility: function() {
			// we care if the page became visible at some point
			if (BOOMR.visibilityState() === "visible") {
				impl.visiblefired = true;
			}
		},

		prerenderToVisible: function() {
			if (impl.onloadfired &&
			    impl.autorun) {
				BOOMR.debug("Transitioned from prerender to " + BOOMR.visibilityState(), "rt");

				// note that we transitioned from prerender on the beacon for debugging
				BOOMR.addVar("vis.pre", "1");

				// send a beacon
				BOOMR.plugins.RT.done(null, "visible");
			}
		},

		page_unload: function(edata) {
			BOOMR.debug("Unload called when unloadfired = " + this.unloadfired, "rt");
			if (!this.unloadfired) {
				// run done on abort or on page_unload to measure session length
				BOOMR.plugins.RT.done(edata, "unload");
			}

			// set cookie for next page
			// We use document.URL instead of location.href because of a bug in safari 4
			// where location.href is URL decoded
			this.updateCookie({ "r": d.URL }, edata.type === "beforeunload" ? "ul" : "hd");


			this.unloadfired = true;
		},

		_iterable_click: function(name, element, etarget, value_cb) {
			var value;
			if (!etarget) {
				return;
			}
			BOOMR.debug(name + " called with " + etarget.nodeName, "rt");
			while (etarget && etarget.nodeName.toUpperCase() !== element) {
				etarget = etarget.parentNode;
			}
			if (etarget && etarget.nodeName.toUpperCase() === element) {
				BOOMR.debug("passing through", "rt");

				// user event, they may be going to another page
				// if this page is being opened in a different tab, then
				// our unload handler won't fire, so we need to set our
				// cookie on click or submit
				value = value_cb(etarget);
				this.updateCookie({ "nu": value }, "cl");
				BOOMR.addVar("nu", BOOMR.utils.cleanupURL(value));
				impl.addedVars.push("nu");
			}
		},

		onclick: function(etarget) {
			impl._iterable_click("Click", "A", etarget, function(t) { return t.href; });
		},

		onerror: function() {
			if (this.onloadfired) {
				// allow error beacons to send outside of page load without adding
				// RT variables to the beacon
				impl.complete = true;
			}
		},

		onsubmit: function(etarget) {
			impl._iterable_click("Submit", "FORM", etarget, function(t) {
				var v = t.getAttribute("action") || d.URL || "";
				return v.match(/\?/) ? v : v + "?";
			});
		},

		onconfig: function(config) {
			if (config.beacon_url) {
				impl.beacon_url = config.beacon_url;
			}

			if (config.RT) {
				if (config.RT.oboError && !isNaN(config.RT.oboError) && config.RT.oboError > impl.oboError) {
					impl.oboError = config.RT.oboError;
				}

				if (config.RT.loadTime && !isNaN(config.RT.loadTime) && config.RT.loadTime > impl.loadTime) {
					impl.loadTime = config.RT.loadTime;

					if (!isNaN(impl.timers.t_done.delta)) {
						impl.loadTime += impl.timers.t_done.delta;
					}
				}
			}
		},

		domloaded: function() {
			BOOMR.plugins.RT.endTimer("t_domloaded");
		},

		clear: function() {
			BOOMR.removeVar("rt.start");
			if (impl.addedVars && impl.addedVars.length > 0) {
				BOOMR.removeVar(impl.addedVars);
				impl.addedVars = [];
			}
		},

		spaNavigation: function() {
			// a SPA navigation occured, force onloadfired to true
			impl.onloadfired = true;
		}
	};

	BOOMR.plugins.RT = {
		// Methods

		init: function(config) {
			BOOMR.debug("init RT", "rt");
			if (w !== BOOMR.window) {
				w = BOOMR.window;
			}

			// protect against undefined window/document
			if (!w || !w.document) {
				return;
			}

			d = w.document;

			BOOMR.utils.pluginConfig(impl, config, "RT",
						["cookie", "cookie_exp", "session_exp", "strict_referrer"]);

			if (config && typeof config.autorun !== "undefined") {
				impl.autorun = config.autorun;
			}

			// A beacon may be fired automatically on page load or if the page dev fires
			// it manually with their own timers.  It may not always contain a referrer
			// (eg: XHR calls).  We set default values for these cases.
			// This is done before reading from the cookie because the cookie overwrites
			// impl.r
			if (typeof d !== "undefined") {
				impl.r = impl.r2 = BOOMR.utils.hashQueryString(d.referrer, true);
			}

			// Now pull out start time information and session information from the cookie
			// We'll do this every time init is called, and every time we call it, it will
			// overwrite values already set (provided there are values to read out)
			impl.initFromCookie();

			// only initialize once.  we still collect config and check/set cookies
			// every time init is called, but we attach event handlers only once
			if (impl.initialized) {
				return this;
			}

			impl.complete = false;
			impl.timers = {};

			impl.check_visibility();

			BOOMR.subscribe("page_ready", impl.page_ready, null, impl);
			BOOMR.subscribe("visibility_changed", impl.check_visibility, null, impl);
			BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
			BOOMR.subscribe("page_ready", this.done, "load", this);
			BOOMR.subscribe("xhr_load", this.done, "xhr", this);
			BOOMR.subscribe("dom_loaded", impl.domloaded, null, impl);
			BOOMR.subscribe("page_unload", impl.page_unload, null, impl);
			BOOMR.subscribe("click", impl.onclick, null, impl);
			BOOMR.subscribe("form_submit", impl.onsubmit, null, impl);
			BOOMR.subscribe("before_beacon", this.addTimersToBeacon, "beacon", this);
			BOOMR.subscribe("onbeacon", impl.clear, null, impl);
			BOOMR.subscribe("onerror", impl.onerror, null, impl);
			BOOMR.subscribe("onconfig", impl.onconfig, null, impl);
			BOOMR.subscribe("spa_navigation", impl.spaNavigation, null, impl);

			// Override any getBeaconURL method to make sure we return the one from the
			// cookie and not the one hardcoded into boomerang
			BOOMR.getBeaconURL = function() { return impl.beacon_url; };

			impl.initialized = true;
			return this;
		},

		startTimer: function(timer_name, time_value) {
			if (timer_name) {
				if (timer_name === "t_page") {
					this.endTimer("t_resp", time_value);
				}
				impl.timers[timer_name] = {start: (typeof time_value === "number" ? time_value : BOOMR.now())};
			}

			return this;
		},

		endTimer: function(timer_name, time_value) {
			if (timer_name) {
				impl.timers[timer_name] = impl.timers[timer_name] || {};
				if (impl.timers[timer_name].end === undefined) {
					impl.timers[timer_name].end =
							(typeof time_value === "number" ? time_value : BOOMR.now());
				}
			}

			return this;
		},

		/**
		 * Clears (removes) the specified timer
		 *
		 * @param {string} timer_name Timer name
		 */
		clearTimer: function(timer_name) {
			if (timer_name) {
				delete impl.timers[timer_name];
			}

			return this;
		},

		setTimer: function(timer_name, time_delta_or_start, timer_end) {
			if (timer_name) {
				if (typeof timer_end !== "undefined") {
					// in this case, we were given three args, the name, start, and end,
					// so time_delta_or_start is the start time
					impl.timers[timer_name] = {
						start: time_delta_or_start,
						end: timer_end,
						delta: timer_end - time_delta_or_start
					};
				}
				else {
					// in this case, we were just given two args, the name and delta
					impl.timers[timer_name] = { delta: time_delta_or_start };
				}
			}

			return this;
		},

		addTimersToBeacon: function(vars, source) {
			var t_name, timer,
			    t_other = [];

			for (t_name in impl.timers) {
				if (impl.timers.hasOwnProperty(t_name)) {
					timer = impl.timers[t_name];

					// if delta is a number, then it was set using setTimer
					// if not, then we have to calculate it using start & end
					if (typeof timer.delta !== "number") {
						if (typeof timer.start !== "number") {
							timer.start = source === "xhr" ? impl.cached_xhr_start : impl.cached_t_start;
						}
						timer.delta = timer.end - timer.start;
					}

					// If the caller did not set a start time, and if there was no start cookie
					// Or if there was no end time for this timer,
					// then timer.delta will be NaN, in which case we discard it.
					if (isNaN(timer.delta)) {
						continue;
					}

					if (impl.basic_timers.hasOwnProperty(t_name)) {
						BOOMR.addVar(t_name, timer.delta);
						impl.addedVars.push(t_name);
					}
					else {
						t_other.push(t_name + "|" + timer.delta);
					}
				}
			}

			if (t_other.length) {
				BOOMR.addVar("t_other", t_other.join(","));
				impl.addedVars.push("t_other");
			}

			if (source === "beacon") {
				impl.timers = {};
				impl.complete = false;	// reset this state for the next call
			}
		},

		// Called when the page has reached a "usable" state.  This may be when the
		// onload event fires, or it could be at some other moment during/after page
		// load when the page is usable by the user
		done: function(edata, ename) {
			BOOMR.debug("Called done: " + ename, "rt");

			var t_start, t_done, t_now = BOOMR.now(),
			    subresource = false;

			// We may have to rerun if this was a pre-rendered page, so set complete to false, and only set to true when we're done
			impl.complete = false;

			t_done = impl.validateLoadTimestamp(t_now, edata, ename);

			if (ename === "load" || ename === "visible" || ename === "xhr") {
				if (!impl.setPageLoadTimers(ename, t_done, edata)) {
					return this;
				}
			}

			if (ename === "load" ||
			    ename === "visible" ||
				(ename === "xhr" && edata && edata.initiator === "spa_hard")) {
				// Only add Boomerang timings to page load and SPA beacons
				impl.getBoomerangTimings();
			}

			t_start = impl.determineTStart(ename, edata);

			// If the dev has already called endTimer, then this call will do nothing
			// else, it will stop the page load timer
			this.endTimer("t_done", t_done);

			// For XHR events, ensure t_done is set with the proper start, end, and
			// delta timestamps.  Until Issue #195 is fixed, if this XHR is firing
			// a beacon very quickly after a previous XHR, the previous XHR might
			// not yet have had time to fire a beacon and clear its own t_done,
			// so the preceeding endTimer() wouldn't have set this XHR's timestamps.
			if (edata && edata.initiator === "xhr") {
				this.setTimer("t_done", edata.timing.requestStart, edata.timing.loadEventEnd);
			}

			// make sure old variables don't stick around
			BOOMR.removeVar(
				"t_done", "t_page", "t_resp", "t_postrender", "t_prerender", "t_load", "t_other",
				"rt.tstart", "rt.nstart", "rt.cstart", "rt.bstart", "rt.end", "rt.subres", "rt.abld",
				"http.errno", "http.method", "xhr.sync"
			);

			impl.setSupportingTimestamps(t_start);

			this.addTimersToBeacon(null, ename);

			BOOMR.setReferrer(impl.r, impl.r2);

			if (ename === "xhr" && edata) {
				if (edata && edata.data) {
					edata = edata.data;
				}
			}

			if (ename === "xhr" && edata) {
				subresource = edata.subresource;

				if (edata.url) {
					BOOMR.addVar("u", BOOMR.utils.cleanupURL(edata.url.replace(/#.*/, "")));
					impl.addedVars.push("u");
				}

				if (edata.status && (edata.status < -1 || edata.status >= 400)) {
					BOOMR.addVar("http.errno", edata.status);
				}

				if (edata.method && edata.method !== "GET") {
					BOOMR.addVar("http.method", edata.method);
				}

				if (edata.headers) {
					BOOMR.addVar("http.hdr", edata.headers);
				}

				if (edata.synchronous) {
					BOOMR.addVar("xhr.sync", 1);
				}

				if (edata.initiator) {
					BOOMR.addVar("http.initiator", edata.initiator);
				}

				impl.addedVars.push("http.errno", "http.method", "http.hdr", "xhr.sync", "http.initiator");
			}

			// This is an explicit subresource
			if (subresource && subresource !== "passive") {
				BOOMR.addVar("rt.subres", 1);
				impl.addedVars.push("rt.subres");
			}

			impl.updateCookie();

			if (ename === "unload") {
				BOOMR.addVar("rt.quit", "");

				if (!impl.onloadfired) {
					BOOMR.addVar("rt.abld", "");
				}

				if (!impl.visiblefired) {
					BOOMR.addVar("rt.ntvu", "");
				}
			}

			impl.complete = true;

			BOOMR.sendBeacon(impl.beacon_url);

			return this;
		},

		is_complete: function() { return impl.complete; },

		/**
		 * @desc
		 * Publicly accessible function to updating implementation private data of the RT plugin on the RT cookie
		 */
		updateCookie: function() {
			impl.updateCookie();
		},

		navigationStart: function() {
			if (!impl.navigationStart) {
				impl.initFromNavTiming();
			}
			return impl.navigationStart;
		}
	};

}(window));
// End of RT plugin
;(function() {
	var hooked = false,
	    initialRouteChangeStarted = false,
	    initialRouteChangeCompleted = false,
	    lastLocationChange = "",
	    autoXhrEnabled = false,
	    firstSpaNav = true,
	    routeFilter = false,
	    routeChangeWaitFilter = false,
	    supported = [],
	    latestResource,
	    waitingOnHardMissedComplete = false;

	if (BOOMR.plugins.SPA) {
		return;
	}

	var impl = {
		/**
		 * Called after a SPA Hard navigation that missed the route change
		 * completes.
		 *
		 * We may want to fix-up the timings of the SPA navigation if there was
		 * any other activity after onload.
		 *
		 * If there was not activity after onload, using the timings for
		 * onload from NavigationTiming.
		 *
		 * If there was activity after onload, use the end time of the latest
		 * resource.
		 */
		spaHardMissedOnComplete: function(resource) {
			waitingOnHardMissedComplete = false;

			var p = BOOMR.getPerformance(), startTime, stopTime;

			// gather start times from NavigationTiming if available
			if (p && p.timing && p.timing.navigationStart && p.timing.loadEventStart) {
				startTime = p.timing.navigationStart;
				stopTime = p.timing.loadEventStart;
			}
			else {
				startTime = BOOMR.t_start;
			}

			// note that we missed the route change on the beacon for debugging
			BOOMR.addVar("spa.missed", "1");

			// ensure t_done is the time we've specified
			BOOMR.plugins.RT.clearTimer("t_done");

			// always use the start time of navigationStart
			resource.timing.requestStart = startTime;

			if (resource.resources.length === 0 && stopTime) {
				// No other resources were fetched, so set the end time
				// to NavigationTiming's performance.loadEventStart (instead of 'now')
				resource.timing.loadEventEnd = stopTime;
			}
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.SPA = {
		/**
		 * Determines if the plugin is complete
		 *
		 * @returns {boolean} True if the plugin is complete
		 */
		is_complete: function() {
			return !waitingOnHardMissedComplete;
		},
		/**
		 * Called to initialize the plugin via BOOMR.init()
		 *
		 * @param {object} config Configuration
		 */
		init: function(config) {
			if (config && config.instrument_xhr) {
				autoXhrEnabled = config.instrument_xhr;

				// if AutoXHR is enabled, and we've already had
				// a route change, make sure to turn AutoXHR back on
				if (initialRouteChangeStarted && autoXhrEnabled) {
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}
			}
		},
		/**
		 * Registers a framework with the SPA plugin
		 *
		 * @param {string} pluginName Plugin name
		 */
		register: function(pluginName) {
			supported.push(pluginName);
		},
		/**
		 * Gets a list of supported SPA frameworks
		 *
		 * @returns {string[]} List of supported frameworks
		 */
		supported_frameworks: function() {
			return supported;
		},
		/**
		 * Fired when onload happens (or immediately if onload has already fired)
		 * to monitor for additional resources for a SPA Hard navigation
		 */
		onLoadSpaHardMissed: function() {
			if (initialRouteChangeStarted) {
				// we were told the History event was missed, but it happened anyways
				// before onload
				return;
			}

			// We missed the initial route change (we loaded too slowly), so we're too
			// late to monitor for new DOM elements.  Don't hold the initial page load beacon.
			initialRouteChangeCompleted = true;

			if (autoXhrEnabled) {
				// re-enable AutoXHR if it's enabled
				BOOMR.plugins.AutoXHR.enableAutoXhr();
			}

			// ensure the beacon is held until this SPA hard beacon is ready
			waitingOnHardMissedComplete = true;

			// Trigger a route change
			BOOMR.plugins.SPA.route_change(impl.spaHardMissedOnComplete);
		},
		/**
		 * Called by a framework when it has hooked into the target SPA
		 *
		 * @param {boolean} hadRouteChange True if a route change has already fired
		 * @param {Object} options Additional options
		 *
		 * @returns {BOOMR} Boomerang object
		 */
		hook: function(hadRouteChange, options) {
			options = options || {};

			if (hooked) {
				return this;
			}

			if (hadRouteChange) {
				// kick off onLoadSpaHardMissed once onload has fired, or immediately
				// if onload has already fired
				BOOMR.attach_page_ready(this.onLoadSpaHardMissed);
			}

			if (typeof options.routeFilter === "function") {
				routeFilter = options.routeFilter;
			}

			if (typeof options.routeChangeWaitFilter === "function") {
				routeChangeWaitFilter = options.routeChangeWaitFilter;
			}

			hooked = true;

			return this;
		},
		/**
		 * Called by a framework when a route change has happened
		 *
		 * @param {function} onComplete Called on completion
		 */
		route_change: function(onComplete) {
			// if we have a routeFilter, see if they want to track this route
			if (routeFilter) {
				try {
					if (!routeFilter.apply(null, arguments)) {
						return;
					}
				}
				catch (e) {
					BOOMR.addError(e, "SPA.route_change.routeFilter");
				}
			}

			// note we've had at least one route change
			initialRouteChangeStarted = true;

			// If this was the first request, use navStart as the begin timestamp.  Otherwise, use
			// "now" as the begin timestamp.
			var requestStart = initialRouteChangeCompleted ? BOOMR.now() : BOOMR.plugins.RT.navigationStart();

			// if we were given a URL by $locationChangeStart use that, otherwise, use the document.URL
			var url = lastLocationChange ? lastLocationChange : BOOMR.window.document.URL;

			// construct the resource we'll be waiting for
			var resource = {
				timing: {
					requestStart: requestStart
				},
				initiator: firstSpaNav ? "spa_hard" : "spa",
				url: url
			};

			firstSpaNav = false;

			if (!initialRouteChangeCompleted || typeof onComplete === "function") {
				// if we haven't completed our initial SPA navigation yet (this is a hard nav), wait
				// for all of the resources to be downloaded
				resource.onComplete = function(onCompleteResource) {
					if (!initialRouteChangeCompleted) {
						initialRouteChangeCompleted = true;

						// fire a SPA navigation completed event so that other plugins can act on it
						BOOMR.fireEvent("spa_navigation");
					}

					if (typeof onComplete === "function") {
						onComplete(onCompleteResource);
					}
				};
			}

			// if we have a routeChangeWaitFilter, make sure AutoXHR waits on the custom event
			if (routeChangeWaitFilter) {
				try {
					if (routeChangeWaitFilter.apply(null, arguments)) {
						resource.wait = true;

						latestResource = resource;
					}
				}
				catch (e) {
					BOOMR.addError(e, "SPA.route_change.routeChangeWaitFilter");
				}
			}

			// start listening for changes
			resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

			// re-enable AutoXHR if it's enabled
			if (autoXhrEnabled) {
				BOOMR.plugins.AutoXHR.enableAutoXhr();
			}
		},
		/**
		 * Called by a framework when the location has changed to the specified URL.  This
		 * should be called prior to route_change() to use the specified URL.
		 * @param {string} url URL
		 */
		last_location: function(url) {
			lastLocationChange = url;
		},
		current_spa_nav: function() {
			return !initialRouteChangeCompleted ? "spa_hard" : "spa";
		},
		/**
		 * Called by the SPA consumer if they have a routeChangeWaitFilter and are manually
		 * triggering navigation complete events.
		 */
		wait_complete: function() {
			if (latestResource) {
				latestResource.wait = false;

				if (latestResource.waitComplete) {
					latestResource.waitComplete();
				}

				latestResource = null;
			}
		}
	};

}(BOOMR.window));
;/**
 * @module UserTiming
 * @desc
 * Plugin to collect metrics from the W3C User Timing API.
 * For more information about User Timing,
 * see: http://www.w3.org/TR/user-timing/
 *
 * This plugin is dependent on the UserTimingCompression library
 * see: https://github.com/nicjansma/usertiming-compression.js
 * UserTimingCompression must be loaded before this plugin's init is called.
 */

/*global UserTimingCompression*/

(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.UserTiming) {
		return;
	}

	var impl = {
		complete: false,
		initialized: false,
		supported: false,
		options: {"from": 0, "window": BOOMR.window},

		/**
		 * Calls the UserTimingCompression library to get the compressed user timing data
		 * that occurred since the last call
		 *
		 * @returns {string} compressed user timing data
		 */
		getUserTiming: function() {
			var timings, res, now = BOOMR.now();
			var utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;

			timings = utc.getCompressedUserTiming(impl.options);
			res = utc.compressForUri(timings);
			this.options.from = now;

			return res;
		},

		/**
		 * Callback for `before_beacon` boomerang event
		 * Adds the `usertiming` param to the beacon
		 */
		addEntriesToBeacon: function() {
			var r;

			if (this.complete) {
				return;
			}

			BOOMR.removeVar("usertiming");
			r = this.getUserTiming();
			if (r) {
				BOOMR.addVar({
					"usertiming": r
				});
			}

			this.complete = true;
		},

		/**
		 * Callback for `onbeacon` boomerang event
		 * Clears the `usertiming` beacon param
		 */
		clearMetrics: function(vars) {
			if (vars.hasOwnProperty("usertiming")) {
				BOOMR.removeVar("usertiming");
			}
			this.complete = false;
		},

		/**
		 * Subscribe to boomerang events that will handle the `usertiming` beacon param
		 */
		subscribe: function() {
			BOOMR.subscribe("before_beacon", this.addEntriesToBeacon, null, this);
			BOOMR.subscribe("onbeacon", this.clearMetrics, null, this);
		},

		/**
		 * Callback for boomerang page_ready event
		 * At page_ready, all javascript should be loaded. We'll call `checkSupport` again
		 * to see if a polyfill for User Timing is available
		 */
		pageReady: function() {
			if (this.checkSupport()) {
				this.subscribe();
			}
		},

		/**
		 * Checks if the browser supports the User Timing API and that the UserTimingCompression library is available
		 *
		 * @returns {boolean} true if supported, false if not
		 */
		checkSupport: function() {
			if (this.supported) {
				return true;
			}

			// Check that the required UserTimingCompression library is available
			var utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;
			if (typeof utc === "undefined") {
				BOOMR.warn("UserTimingCompression library not found", "usertiming");
				return false;
			}

			var p = BOOMR.getPerformance();
			// Check that we have getEntriesByType
			if (p && typeof p.getEntriesByType === "function") {
				var marks = p.getEntriesByType("mark");
				var measures = p.getEntriesByType("measure");
				// Check that the results of getEntriesByType for marks and measures are Arrays
				// Some polyfill libraries may incorrectly implement this
				if (BOOMR.utils.isArray(marks) && BOOMR.utils.isArray(measures)) {
					BOOMR.info("Client supports User Timing API", "usertiming");
					this.supported = true;
					return true;
				}
			}
			return false;
		}
	};

	BOOMR.plugins.UserTiming = {
		init: function(config) {
			if (impl.initialized) {
				return this;
			}

			if (impl.checkSupport()) {
				impl.subscribe();
			}
			else {
				// usertiming isn't supported by the browser or the UserTimingCompression library isn't loaded.
				// Let's check again when the page is ready to see if a polyfill was loaded.
				BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
			}

			impl.initialized = true;
			return this;
		},
		is_complete: function() {
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		}
	};

}());
