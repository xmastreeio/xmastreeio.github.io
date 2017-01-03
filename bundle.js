/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	__webpack_require__(1);
	var L = __webpack_require__(3);
	var $ = __webpack_require__(4);
	var decorationPlacingManager_1 = __webpack_require__(5);
	var justDate_1 = __webpack_require__(30);
	var Resources = __webpack_require__(6);
	var ServerComms = __webpack_require__(31);
	//Configure the map
	var map = L.map('map', {
	    crs: L.CRS.Simple,
	    minZoom: -1,
	    layers: [
	        L.imageOverlay(Resources.treeSvg, L.latLngBounds([[0, 0], [1000, 1000]]), {
	            attribution: '<a href="#" data-toggle="modal" data-target="#modal-attribution">Attribution</a> | <a href="https://docs.google.com/a/cozybarrel.com/forms/d/e/1FAIpQLSdrXYeI1JfL-xOTE4iTlB5H9p2Y4AEbhnYrygKrJsEK-EUJag/viewform" target="_blank">Contact and Feedback</a>'
	        })
	    ]
	});
	map.fitBounds(Resources.maxPlacementBounds, {});
	//Set up auth buttons
	$('a.btn-twitter').attr('href', ServerComms.serverBaseUrl + '/auth/twitter');
	$('a.btn-facebook').attr('href', ServerComms.serverBaseUrl + '/auth/facebook');
	$('a.btn-google').attr('href', ServerComms.serverBaseUrl + '/auth/google');
	//State
	var status;
	//Managers
	var serverComms = new ServerComms.FakeServerComms();
	//let serverComms = new ServerComms.RealServerComms();
	var decorationPlacingManager = new decorationPlacingManager_1.DecorationPlacingManager(map, serverComms);
	serverComms.getStatus(function (err, res) {
	    if (err) {
	        //TODO: Nice looking alert
	        alert('Failed to get status. Server is probably down. Try again soon!');
	    }
	    status = res;
	    showAddDecorationButton();
	    if (status.authenticated) {
	        $('#top-logout').removeClass('hidden').on('click', function () {
	            window.location.assign(ServerComms.serverBaseUrl + '/logout');
	        });
	    }
	    else {
	        $('#modal-welcome').modal('show');
	    }
	});
	serverComms.getAllDecorations(function (res) {
	    if (!res.success) {
	        //TODO: Nice looking alert
	        alert('Failed to load decorations. Server is probably down. Try again soon!');
	        return;
	    }
	    res.decorations.forEach(function (d) {
	        try {
	            map.addLayer(L.imageOverlay(Resources.decorationImages[d[2]], Resources.padLatLngForDecoration(L.latLng(d[1], d[0]), d[2])));
	        }
	        catch (err) {
	            console.log('failed to add decoration server returned', err);
	        }
	    });
	});
	decorationPlacingManager.onComplete = function (nextDecoration, now) {
	    status.amountPlaced++;
	    status.dateLastPlaced = now.value;
	    status.nextDecoration = nextDecoration;
	};
	var loggedIn = true;
	function showAddDecorationButton() {
	    //Global click handlers
	    $('#top-place-decoration').removeClass('hidden').click(function () {
	        if (decorationPlacingManager.enabled) {
	            return;
	        }
	        if (status.authenticated) {
	            var now = justDate_1.JustDate.now();
	            if (now.value <= status.dateLastPlaced) {
	                //TODO: Nice looking alert
	                alert('You have already placed a decoration today. Come back tomorrow');
	            }
	            else {
	                decorationPlacingManager.start(status.nextDecoration);
	            }
	        }
	        else {
	            $('#modal-login').modal('show');
	        }
	    });
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports) {

	module.exports = L;

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = jQuery;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Resources = __webpack_require__(6);
	var justDate_1 = __webpack_require__(30);
	var DecorationPlacingManager = (function () {
	    function DecorationPlacingManager(map, serverComms) {
	        var _this = this;
	        this.map = map;
	        this.serverComms = serverComms;
	        $('#placement-cancel').on('click', function () {
	            _this.map.removeLayer(_this.marker);
	            _this.marker = null;
	            $('#placement-confirm-box').addClass('hidden');
	            $('#placement-instructions').addClass('hidden');
	            _this.enabled = false;
	            if (_this.onCancel) {
	                _this.onCancel();
	            }
	        });
	        $('#placement-locate').on('click', function () {
	            var bounds = _this.marker.getBounds();
	            _this.map.flyTo(bounds.getCenter(), 4);
	        });
	        this.map.on('click', function (ev) {
	            if (_this.marker) {
	                var latlng = ev.latlng;
	                _this.marker.setBounds(Resources.padLatLngForDecoration(latlng, _this.decorationIndex));
	            }
	        });
	        $('#placement-place').on('click', function () {
	            var bounds = _this.marker.getBounds();
	            var center = bounds.getCenter();
	            if (!Resources.maxPlacementBounds.contains(center)) {
	                //TODO: Nice looking alert
	                alert("Please place your decoration on the tree");
	                return;
	            }
	            //TODO: Should disable buttons during submit
	            var now = justDate_1.JustDate.now();
	            _this.serverComms.addDecoration(center.lng, center.lat, now, function (res) {
	                if (res.success) {
	                    //TODO: Nice looking alert
	                    //TODO: Your next decoration is...
	                    alert("Done! You can place another decoration tomorrow");
	                    _this.draggable.disable();
	                    //Undo the interactive flag
	                    L.DomUtil.removeClass(_this.marker._image, 'leaflet-interactive');
	                    $(_this.marker._image).removeClass('pulsate');
	                    _this.marker.removeInteractiveTarget(_this.marker._image);
	                    //TODO: Undo disableClickPropagation?
	                    $('#placement-confirm-box').addClass('hidden');
	                    $('#placement-instructions').addClass('hidden');
	                    _this.enabled = false;
	                    if (_this.onComplete) {
	                        _this.onComplete(res.nextDecoration, now);
	                    }
	                    _this.marker = null;
	                }
	                else {
	                    //TODO: Nice looking alert
	                    alert('Something Failed :( Try again?');
	                }
	            });
	        });
	    }
	    DecorationPlacingManager.prototype.start = function (decorationIndex) {
	        var _this = this;
	        this.enabled = true;
	        this.decorationIndex = decorationIndex;
	        //TODO: highlight the placing one somehow
	        //Random placing
	        //http://stackoverflow.com/questions/19654251/random-point-inside-triangle-inside-java
	        var r1 = Math.random();
	        var r2 = Math.random();
	        //Triangle corners (roughly) of the tree
	        var ax = 342;
	        var ay = 239;
	        var bx = 308;
	        var by = 760;
	        var cx = 953;
	        var cy = 500;
	        var x = (1 - Math.sqrt(r1)) * ax + (Math.sqrt(r1) * (1 - r2)) * bx + (Math.sqrt(r1) * r2) * cx;
	        var y = (1 - Math.sqrt(r1)) * ay + (Math.sqrt(r1) * (1 - r2)) * by + (Math.sqrt(r1) * r2) * cy;
	        var center = L.latLng(x, y);
	        this.marker = L.imageOverlay(Resources.decorationImages[decorationIndex], Resources.padLatLngForDecoration(center, decorationIndex), { interactive: true });
	        //TODO: Appear animation would be cool
	        this.map.addLayer(this.marker);
	        this.map.flyTo(center, 4, { easeLinearity: 6, duration: 1 });
	        L.DomEvent.disableClickPropagation(this.marker._image);
	        $(this.marker._image).addClass('pulsate');
	        this.draggable = new L.Draggable(this.marker._image);
	        this.draggable.enable();
	        //TODO: Keep the decoration on the tree?
	        this.draggable.on('dragend', function () {
	            var endPos = L.DomUtil.getPosition(_this.marker._image);
	            endPos = endPos.add([_this.marker._image.clientWidth / 2, _this.marker._image.clientHeight / 2]);
	            var endLatLng = _this.map.layerPointToLatLng(endPos);
	            _this.marker.setBounds(Resources.padLatLngForDecoration(endLatLng, decorationIndex));
	        });
	        $('#placement-confirm-box').removeClass('hidden');
	        $('#placement-instructions').removeClass('hidden');
	    };
	    return DecorationPlacingManager;
	}());
	exports.DecorationPlacingManager = DecorationPlacingManager;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	__webpack_require__(7);
	__webpack_require__(8);
	__webpack_require__(9);
	exports.treeSvg = __webpack_require__(10);
	exports.maxPlacementBounds = L.latLngBounds([[150, 220], [1000, 780]]);
	exports.decorationImages = [
	    //normal size 0-18
	    __webpack_require__(11),
	    __webpack_require__(12),
	    __webpack_require__(13),
	    __webpack_require__(14),
	    __webpack_require__(15),
	    __webpack_require__(16),
	    __webpack_require__(17),
	    __webpack_require__(18),
	    __webpack_require__(19),
	    __webpack_require__(20),
	    __webpack_require__(21),
	    __webpack_require__(22),
	    __webpack_require__(23),
	    __webpack_require__(24),
	    __webpack_require__(25),
	    __webpack_require__(26),
	    __webpack_require__(27),
	    __webpack_require__(28),
	    __webpack_require__(29),
	    //big size 19-38
	    __webpack_require__(11),
	    __webpack_require__(12),
	    __webpack_require__(13),
	    __webpack_require__(14),
	    __webpack_require__(15),
	    __webpack_require__(16),
	    __webpack_require__(17),
	    __webpack_require__(18),
	    __webpack_require__(19),
	    __webpack_require__(20),
	    __webpack_require__(21),
	    __webpack_require__(22),
	    __webpack_require__(23),
	    __webpack_require__(24),
	    __webpack_require__(25),
	    __webpack_require__(26),
	    __webpack_require__(27),
	    __webpack_require__(28),
	    __webpack_require__(29),
	];
	exports.decorationPadding = 5;
	function padLatLngForDecoration(latLng, decorationIndex) {
	    var padding = exports.decorationPadding;
	    if (decorationIndex >= 19 && decorationIndex <= 38) {
	        padding += 2;
	    }
	    return L.latLngBounds([latLng.lat - padding, latLng.lng - padding], [latLng.lat + padding, latLng.lng + padding]);
	}
	exports.padLatLngForDecoration = padLatLngForDecoration;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "favicon.png";

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "favicon.ico";

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "tree-120.png";

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "2639b7c8be86e2031c0b7fbad0c63fff.svg";

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "581bb72efac53ebaa2728c98c31a6e7a.svg";

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "086f5fd562cbf1ba4f84204f2814dc2b.svg";

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "908f5551f5ee69948421f7cca190bb6e.svg";

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "9b61ec1c07057bc0871a4eceb9597439.svg";

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "35fed1fd63cc24918fd3f96ff7c3e818.svg";

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "a6320043fe59b469bec1767c8c5d8e32.svg";

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "cd270b454d40ce6c14cdb305031c5cec.svg";

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "4b9a5f5e1017dbe2c80e559ad507d7ec.svg";

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "0bf1e553839087615f54880035a62bfc.svg";

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "300268f088609d22638af1e5643a3e12.svg";

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "05f6651c1fbffe05888546f29823e780.svg";

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "92905ac8c5ae568ec4913b409d5698fb.svg";

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "902e31f567254821bd77f1070c2792e0.svg";

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "d8bcd52f10556ebbd0bc6246de936fd1.svg";

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "c9b1cabf769fba98ebb1482d72c97eb5.svg";

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "4b2533c4b86604308759238ced0069e7.svg";

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "e83a71b74c7337e8eea3cf2b54e82614.svg";

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "5e3f158f83342ea64c57c38adbded6ca.svg";

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "cd3767e4a1618264268c7275a6aff637.svg";

/***/ },
/* 30 */
/***/ function(module, exports) {

	"use strict";
	var JustDate = (function () {
	    /** value is in format l.getFullYear() * 10000 + (l.getMonth() + 1) * 100 + l.getDate() */
	    function JustDate(value) {
	        this.value = value;
	    }
	    JustDate.prototype.getFullYear = function () {
	        return Math.floor(this.value / 10000);
	    };
	    JustDate.prototype.getMonthZeroBased = function () {
	        return (Math.floor(this.value / 100) % 100) - 1;
	    };
	    JustDate.prototype.getDate = function () {
	        return this.value % 100;
	    };
	    JustDate.prototype.asDate = function () {
	        return new Date(this.getFullYear(), this.getMonthZeroBased(), this.getDate());
	    };
	    JustDate.create = function (year, monthZeroBased, dayOfMonth) {
	        return new JustDate(year * 10000 + (monthZeroBased + 1) * 100 + dayOfMonth);
	    };
	    JustDate.now = function () {
	        var now = new Date();
	        return JustDate.create(now.getFullYear(), now.getMonth(), now.getDate());
	    };
	    return JustDate;
	}());
	exports.JustDate = JustDate;


/***/ },
/* 31 */
/***/ function(module, exports) {

	"use strict";
	//export const serverBaseUrl = 'http://localhost:3000';
	exports.serverBaseUrl = 'https://api.xmastree.io';
	var FakeServerComms = (function () {
	    function FakeServerComms() {
	    }
	    FakeServerComms.prototype.getStatus = function (callback) {
	        setTimeout(function () {
	            callback(null, {
	                authenticated: false,
	                amountPlaced: 0,
	                nextDecoration: 0
	            });
	        }, 1000);
	    };
	    FakeServerComms.prototype.addDecoration = function (x, y, when, callback) {
	        setTimeout(function () {
	            callback({
	                success: false,
	                nextDecoration: null
	            });
	        }, 1000);
	    };
	    FakeServerComms.prototype.getAllDecorations = function (callback) {
	        callback({
	            success: true,
	            decorations: [[465, 579.1875, 17], [542, 789, 20], [336.25, 462.25, 32], [559.125, 569.25, 8], [462, 571, 13], [506, 886, 34], [460.375, 563.75, 16], [531.5, 579, 24], [497.8125, 553.0625, 2], [457.8125, 556.75, 15], [442, 697, 32], [425.8125, 563.125, 2], [595.5, 564, 9], [568, 424, 2], [500, 575, 18], [500, 575, 37], [501.375, 634.375, 21], [553.59375, 788.9375, 29], [496, 696.75, 29], [300.52001953125, 371.9000244140625, 20], [672, 861.5, 9], [679.5, 870.5, 13], [516.2197494506836, 576.4268131256104, 27], [525.7470016479492, 715.3584899902344, 25], [747.5, 368.5, 23], [489.1875, 572.5, 4], [738, 573, 10], [664.5, 215, 20], [506, 471, 18], [325.9375, 413.375, 9], [458.25, 550.125, 16], [457.875, 542.8125, 14], [424, 449.5, 6], [685.75, 478.5, 19], [594, 555.5, 13], [376.5, 435.3125, 28], [548.375, 782.625, 18], [577, 678, 12], [359.375, 617.75, 1], [687.5, 859.5, 29], [602.5, 563.25, 10], [494.5, 297, 0], [465, 902.75, 5], [322, 371.5, 19], [366, 735, 9], [534.5, 864, 20], [452.75, 536.375, 4], [502.1875, 565.5, 11], [401.5, 438.5, 10], [509.625, 462.75, 33], [534.5, 900.5, 1], [503.125, 925, 28], [245, 879, 21], [392.5, 514.5, 8], [494.125, 648.3125, 18], [346.875, 458.125, 30], [490, 831, 26], [460.125, 579.25, 14], [494.9375, 820.9375, 4], [329.0625, 469.875, 4], [614.875, 458.625, 5], [665.625, 412.9375, 3], [451.5, 528.5, 5], [693.5, 846.75, 29], [451.75, 439.875, 5], [538.75, 769.75, 1], [571.4416272315204, 695.9828840533927, 4], [491.75, 633.25, 22], [646.25, 603, 37], [555.5, 694.5, 9], [606, 483, 7], [546.25, 766.625, 2], [645, 453.5, 37], [361, 610.25, 16], [353, 311.5, 11], [646.5, 592.75, 17], [495.625, 642, 12], [666, 849, 22], [503.3125, 939.9375, 16], [241, 299, 24], [323.5, 460.5, 7], [408.75, 574.75, 36], [462, 688.5, 21], [698.75, 834.25, 21], [649, 583, 33], [466.5, 876, 24], [646.5, 583.625, 18], [541.5, 275.5, 26], [283.5, 878.5, 19], [492, 654, 17], [464.984375, 902.78125, 6], [534.625, 900.4375, 5], [323.375, 460.5625, 8], [518, 688, 16], [457.5, 588, 34], [569.5, 588.5, 6], [621.5, 281.5, 27], [521.5, 222, 14], [458.25, 596.5, 14], [698.40625, 834.40625, 1], [470.5, 543, 32], [473.5, 917, 9], [406.25, 271.5, 26], [448.5, 519.5, 5], [546, 508, 30], [470.5, 578.375, 11], [383.875, 314, 17], [266, 861, 33], [525.5, 520.5, 35], [661.25, 835.25, 20], [495, 659, 36], [496.5, 663.5, 7], [650, 575, 14], [677.8125, 412.25, 19], [701, 823, 0], [502.0625, 297, 1], [706.25, 320, 21], [494.5, 542.5, 26], [409.5, 562.25, 35]]
	        });
	    };
	    return FakeServerComms;
	}());
	exports.FakeServerComms = FakeServerComms;
	var RealServerComms = (function () {
	    function RealServerComms() {
	    }
	    RealServerComms.prototype.getStatus = function (callback) {
	        $.ajax({
	            method: 'GET',
	            url: exports.serverBaseUrl + '/api/status/v1',
	            xhrFields: {
	                withCredentials: true
	            }
	        }).done(function (res) {
	            callback(null, res);
	        }).fail(function (err) {
	            callback(err, null);
	        });
	    };
	    RealServerComms.prototype.addDecoration = function (x, y, when, callback) {
	        $.ajax({
	            method: 'POST',
	            url: exports.serverBaseUrl + '/api/decorations/add/v1',
	            xhrFields: {
	                withCredentials: true
	            },
	            contentType: "application/json; charset=utf-8",
	            data: JSON.stringify({
	                x: x,
	                y: y,
	                date: when.value
	            })
	        }).done(function (res) {
	            callback({
	                success: true,
	                nextDecoration: res.nextDecoration
	            });
	        }).fail(function (err) {
	            console.log(err);
	            callback({
	                success: false,
	                nextDecoration: null
	            });
	        });
	    };
	    RealServerComms.prototype.getAllDecorations = function (callback) {
	        $.ajax({
	            method: 'GET',
	            url: exports.serverBaseUrl + '/api/decorations/v1',
	            xhrFields: {
	                withCredentials: true
	            }
	        }).done(function (res) {
	            callback({
	                decorations: res.decorations,
	                success: true
	            });
	        }).fail(function (err) {
	            console.log(err);
	            callback({
	                success: false,
	                decorations: null
	            });
	        });
	    };
	    return RealServerComms;
	}());
	exports.RealServerComms = RealServerComms;


/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYWUyNzE3YzlmYWM1ZmQ0ZTg3OTgiLCJ3ZWJwYWNrOi8vLy4vaW5kZXgudHMiLCJ3ZWJwYWNrOi8vLy4vaW5kZXguY3NzIiwid2VicGFjazovLy9leHRlcm5hbCBcIkxcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJqUXVlcnlcIiIsIndlYnBhY2s6Ly8vLi9kZWNvcmF0aW9uUGxhY2luZ01hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzLnRzIiwid2VicGFjazovLy8uL2Zhdmljb24ucG5nIiwid2VicGFjazovLy8uL2Zhdmljb24uaWNvIiwid2VicGFjazovLy8uL3RyZWUtMTIwLnBuZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvdHJlZS5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1ibHVlLWNlbnRlci5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1ibHVlLWxlZnQuc3ZnIiwid2VicGFjazovLy8uL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctYmx1ZS1yaWdodC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1wdXJwbGUtbGVmdC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1wdXJwbGUtcmlnaHQuc3ZnIiwid2VicGFjazovLy8uL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcmVkLWxlZnQuc3ZnIiwid2VicGFjazovLy8uL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcmVkLXJpZ2h0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXRlYWwtbGVmdC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy10ZWFsLXJpZ2h0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXllbGxvdy1sZWZ0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXllbGxvdy1yaWdodC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtZG93bi1sZWZ0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC1kb3duLXJpZ2h0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC1taWQtbGVmdC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtbWlkLXJpZ2h0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC11cC1sZWZ0LnN2ZyIsIndlYnBhY2s6Ly8vLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC11cC1yaWdodC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL3BvaW50eS1yZWQtbGVmdC5zdmciLCJ3ZWJwYWNrOi8vLy4vaW1hZ2VzL2RlY29yYXRpb25zL3BvaW50eS1yZWQtcmlnaHQuc3ZnIiwid2VicGFjazovLy8uL2p1c3REYXRlLnRzIiwid2VicGFjazovLy8uL3NlcnZlckNvbW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBLEVBQUM7QUFDRCwrQ0FBOEM7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTCxFQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7Ozs7Ozs7QUN0RkEsMEM7Ozs7Ozs7QUNBQSxvQjs7Ozs7O0FDQUEseUI7Ozs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0lBQThJLG9CQUFvQjtBQUNsSztBQUNBO0FBQ0Esb0NBQW1DLGdDQUFnQztBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRDs7Ozs7OztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUN4REEsd0Q7Ozs7OztBQ0FBLHdEOzs7Ozs7QUNBQSx5RDs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQSxpRjs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQSxpRjs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQSxpRjs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQSxpRjs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQSxpRjs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQSxpRjs7Ozs7O0FDQUEsaUY7Ozs7OztBQ0FBLGlGOzs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNEOzs7Ozs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYixVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQSxFQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBLFVBQVM7QUFDVDtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYiw0Q0FBMkM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2IsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYixVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2IsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYixVQUFTO0FBQ1Q7QUFDQTtBQUNBLEVBQUM7QUFDRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCBhZTI3MTdjOWZhYzVmZDRlODc5OCIsIlwidXNlIHN0cmljdFwiO1xyXG5yZXF1aXJlKCcuL2luZGV4LmNzcycpO1xyXG52YXIgTCA9IHJlcXVpcmUoJ2xlYWZsZXQnKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGRlY29yYXRpb25QbGFjaW5nTWFuYWdlcl8xID0gcmVxdWlyZSgnLi9kZWNvcmF0aW9uUGxhY2luZ01hbmFnZXInKTtcclxudmFyIGp1c3REYXRlXzEgPSByZXF1aXJlKCcuL2p1c3REYXRlJyk7XHJcbnZhciBSZXNvdXJjZXMgPSByZXF1aXJlKCcuL3Jlc291cmNlcycpO1xyXG52YXIgU2VydmVyQ29tbXMgPSByZXF1aXJlKCcuL3NlcnZlckNvbW1zJyk7XHJcbi8vQ29uZmlndXJlIHRoZSBtYXBcclxudmFyIG1hcCA9IEwubWFwKCdtYXAnLCB7XHJcbiAgICBjcnM6IEwuQ1JTLlNpbXBsZSxcclxuICAgIG1pblpvb206IC0xLFxyXG4gICAgbGF5ZXJzOiBbXHJcbiAgICAgICAgTC5pbWFnZU92ZXJsYXkoUmVzb3VyY2VzLnRyZWVTdmcsIEwubGF0TG5nQm91bmRzKFtbMCwgMF0sIFsxMDAwLCAxMDAwXV0pLCB7XHJcbiAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnPGEgaHJlZj1cIiNcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjbW9kYWwtYXR0cmlidXRpb25cIj5BdHRyaWJ1dGlvbjwvYT4gfCA8YSBocmVmPVwiaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vYS9jb3p5YmFycmVsLmNvbS9mb3Jtcy9kL2UvMUZBSXBRTFNkclhZZUkxSmZMLXhPVEU0aVRsQjVIOXAyWTRBRWJobllyeWdLckpzRUstRVVKYWcvdmlld2Zvcm1cIiB0YXJnZXQ9XCJfYmxhbmtcIj5Db250YWN0IGFuZCBGZWVkYmFjazwvYT4nXHJcbiAgICAgICAgfSlcclxuICAgIF1cclxufSk7XHJcbm1hcC5maXRCb3VuZHMoUmVzb3VyY2VzLm1heFBsYWNlbWVudEJvdW5kcywge30pO1xyXG4vL1NldCB1cCBhdXRoIGJ1dHRvbnNcclxuJCgnYS5idG4tdHdpdHRlcicpLmF0dHIoJ2hyZWYnLCBTZXJ2ZXJDb21tcy5zZXJ2ZXJCYXNlVXJsICsgJy9hdXRoL3R3aXR0ZXInKTtcclxuJCgnYS5idG4tZmFjZWJvb2snKS5hdHRyKCdocmVmJywgU2VydmVyQ29tbXMuc2VydmVyQmFzZVVybCArICcvYXV0aC9mYWNlYm9vaycpO1xyXG4kKCdhLmJ0bi1nb29nbGUnKS5hdHRyKCdocmVmJywgU2VydmVyQ29tbXMuc2VydmVyQmFzZVVybCArICcvYXV0aC9nb29nbGUnKTtcclxuLy9TdGF0ZVxyXG52YXIgc3RhdHVzO1xyXG4vL01hbmFnZXJzXHJcbnZhciBzZXJ2ZXJDb21tcyA9IG5ldyBTZXJ2ZXJDb21tcy5GYWtlU2VydmVyQ29tbXMoKTtcclxuLy9sZXQgc2VydmVyQ29tbXMgPSBuZXcgU2VydmVyQ29tbXMuUmVhbFNlcnZlckNvbW1zKCk7XHJcbnZhciBkZWNvcmF0aW9uUGxhY2luZ01hbmFnZXIgPSBuZXcgZGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyXzEuRGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyKG1hcCwgc2VydmVyQ29tbXMpO1xyXG5zZXJ2ZXJDb21tcy5nZXRTdGF0dXMoZnVuY3Rpb24gKGVyciwgcmVzKSB7XHJcbiAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgLy9UT0RPOiBOaWNlIGxvb2tpbmcgYWxlcnRcclxuICAgICAgICBhbGVydCgnRmFpbGVkIHRvIGdldCBzdGF0dXMuIFNlcnZlciBpcyBwcm9iYWJseSBkb3duLiBUcnkgYWdhaW4gc29vbiEnKTtcclxuICAgIH1cclxuICAgIHN0YXR1cyA9IHJlcztcclxuICAgIHNob3dBZGREZWNvcmF0aW9uQnV0dG9uKCk7XHJcbiAgICBpZiAoc3RhdHVzLmF1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgICAkKCcjdG9wLWxvZ291dCcpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oU2VydmVyQ29tbXMuc2VydmVyQmFzZVVybCArICcvbG9nb3V0Jyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAkKCcjbW9kYWwtd2VsY29tZScpLm1vZGFsKCdzaG93Jyk7XHJcbiAgICB9XHJcbn0pO1xyXG5zZXJ2ZXJDb21tcy5nZXRBbGxEZWNvcmF0aW9ucyhmdW5jdGlvbiAocmVzKSB7XHJcbiAgICBpZiAoIXJlcy5zdWNjZXNzKSB7XHJcbiAgICAgICAgLy9UT0RPOiBOaWNlIGxvb2tpbmcgYWxlcnRcclxuICAgICAgICBhbGVydCgnRmFpbGVkIHRvIGxvYWQgZGVjb3JhdGlvbnMuIFNlcnZlciBpcyBwcm9iYWJseSBkb3duLiBUcnkgYWdhaW4gc29vbiEnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICByZXMuZGVjb3JhdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIG1hcC5hZGRMYXllcihMLmltYWdlT3ZlcmxheShSZXNvdXJjZXMuZGVjb3JhdGlvbkltYWdlc1tkWzJdXSwgUmVzb3VyY2VzLnBhZExhdExuZ0ZvckRlY29yYXRpb24oTC5sYXRMbmcoZFsxXSwgZFswXSksIGRbMl0pKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCB0byBhZGQgZGVjb3JhdGlvbiBzZXJ2ZXIgcmV0dXJuZWQnLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuZGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyLm9uQ29tcGxldGUgPSBmdW5jdGlvbiAobmV4dERlY29yYXRpb24sIG5vdykge1xyXG4gICAgc3RhdHVzLmFtb3VudFBsYWNlZCsrO1xyXG4gICAgc3RhdHVzLmRhdGVMYXN0UGxhY2VkID0gbm93LnZhbHVlO1xyXG4gICAgc3RhdHVzLm5leHREZWNvcmF0aW9uID0gbmV4dERlY29yYXRpb247XHJcbn07XHJcbnZhciBsb2dnZWRJbiA9IHRydWU7XHJcbmZ1bmN0aW9uIHNob3dBZGREZWNvcmF0aW9uQnV0dG9uKCkge1xyXG4gICAgLy9HbG9iYWwgY2xpY2sgaGFuZGxlcnNcclxuICAgICQoJyN0b3AtcGxhY2UtZGVjb3JhdGlvbicpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKGRlY29yYXRpb25QbGFjaW5nTWFuYWdlci5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN0YXR1cy5hdXRoZW50aWNhdGVkKSB7XHJcbiAgICAgICAgICAgIHZhciBub3cgPSBqdXN0RGF0ZV8xLkp1c3REYXRlLm5vdygpO1xyXG4gICAgICAgICAgICBpZiAobm93LnZhbHVlIDw9IHN0YXR1cy5kYXRlTGFzdFBsYWNlZCkge1xyXG4gICAgICAgICAgICAgICAgLy9UT0RPOiBOaWNlIGxvb2tpbmcgYWxlcnRcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdZb3UgaGF2ZSBhbHJlYWR5IHBsYWNlZCBhIGRlY29yYXRpb24gdG9kYXkuIENvbWUgYmFjayB0b21vcnJvdycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyLnN0YXJ0KHN0YXR1cy5uZXh0RGVjb3JhdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICQoJyNtb2RhbC1sb2dpbicpLm1vZGFsKCdzaG93Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9pbmRleC50c1xuLy8gbW9kdWxlIGlkID0gMFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCIvLyByZW1vdmVkIGJ5IGV4dHJhY3QtdGV4dC13ZWJwYWNrLXBsdWdpblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW5kZXguY3NzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gTDtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyBleHRlcm5hbCBcIkxcIlxuLy8gbW9kdWxlIGlkID0gM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IGpRdWVyeTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyBleHRlcm5hbCBcImpRdWVyeVwiXG4vLyBtb2R1bGUgaWQgPSA0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUmVzb3VyY2VzID0gcmVxdWlyZSgnLi9yZXNvdXJjZXMnKTtcclxudmFyIGp1c3REYXRlXzEgPSByZXF1aXJlKCcuL2p1c3REYXRlJyk7XHJcbnZhciBEZWNvcmF0aW9uUGxhY2luZ01hbmFnZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gRGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyKG1hcCwgc2VydmVyQ29tbXMpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMubWFwID0gbWFwO1xyXG4gICAgICAgIHRoaXMuc2VydmVyQ29tbXMgPSBzZXJ2ZXJDb21tcztcclxuICAgICAgICAkKCcjcGxhY2VtZW50LWNhbmNlbCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMubWFwLnJlbW92ZUxheWVyKF90aGlzLm1hcmtlcik7XHJcbiAgICAgICAgICAgIF90aGlzLm1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICQoJyNwbGFjZW1lbnQtY29uZmlybS1ib3gnKS5hZGRDbGFzcygnaGlkZGVuJyk7XHJcbiAgICAgICAgICAgICQoJyNwbGFjZW1lbnQtaW5zdHJ1Y3Rpb25zJykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICBfdGhpcy5lbmFibGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5vbkNhbmNlbCkge1xyXG4gICAgICAgICAgICAgICAgX3RoaXMub25DYW5jZWwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJyNwbGFjZW1lbnQtbG9jYXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgYm91bmRzID0gX3RoaXMubWFya2VyLmdldEJvdW5kcygpO1xyXG4gICAgICAgICAgICBfdGhpcy5tYXAuZmx5VG8oYm91bmRzLmdldENlbnRlcigpLCA0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLm1hcC5vbignY2xpY2snLCBmdW5jdGlvbiAoZXYpIHtcclxuICAgICAgICAgICAgaWYgKF90aGlzLm1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxhdGxuZyA9IGV2LmxhdGxuZztcclxuICAgICAgICAgICAgICAgIF90aGlzLm1hcmtlci5zZXRCb3VuZHMoUmVzb3VyY2VzLnBhZExhdExuZ0ZvckRlY29yYXRpb24obGF0bG5nLCBfdGhpcy5kZWNvcmF0aW9uSW5kZXgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJyNwbGFjZW1lbnQtcGxhY2UnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBib3VuZHMgPSBfdGhpcy5tYXJrZXIuZ2V0Qm91bmRzKCk7XHJcbiAgICAgICAgICAgIHZhciBjZW50ZXIgPSBib3VuZHMuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgICAgIGlmICghUmVzb3VyY2VzLm1heFBsYWNlbWVudEJvdW5kcy5jb250YWlucyhjZW50ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAvL1RPRE86IE5pY2UgbG9va2luZyBhbGVydFxyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgcGxhY2UgeW91ciBkZWNvcmF0aW9uIG9uIHRoZSB0cmVlXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vVE9ETzogU2hvdWxkIGRpc2FibGUgYnV0dG9ucyBkdXJpbmcgc3VibWl0XHJcbiAgICAgICAgICAgIHZhciBub3cgPSBqdXN0RGF0ZV8xLkp1c3REYXRlLm5vdygpO1xyXG4gICAgICAgICAgICBfdGhpcy5zZXJ2ZXJDb21tcy5hZGREZWNvcmF0aW9uKGNlbnRlci5sbmcsIGNlbnRlci5sYXQsIG5vdywgZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlcy5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBOaWNlIGxvb2tpbmcgYWxlcnRcclxuICAgICAgICAgICAgICAgICAgICAvL1RPRE86IFlvdXIgbmV4dCBkZWNvcmF0aW9uIGlzLi4uXHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJEb25lISBZb3UgY2FuIHBsYWNlIGFub3RoZXIgZGVjb3JhdGlvbiB0b21vcnJvd1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5kcmFnZ2FibGUuZGlzYWJsZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vVW5kbyB0aGUgaW50ZXJhY3RpdmUgZmxhZ1xyXG4gICAgICAgICAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyhfdGhpcy5tYXJrZXIuX2ltYWdlLCAnbGVhZmxldC1pbnRlcmFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoX3RoaXMubWFya2VyLl9pbWFnZSkucmVtb3ZlQ2xhc3MoJ3B1bHNhdGUnKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5tYXJrZXIucmVtb3ZlSW50ZXJhY3RpdmVUYXJnZXQoX3RoaXMubWFya2VyLl9pbWFnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBVbmRvIGRpc2FibGVDbGlja1Byb3BhZ2F0aW9uP1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNwbGFjZW1lbnQtY29uZmlybS1ib3gnKS5hZGRDbGFzcygnaGlkZGVuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3BsYWNlbWVudC1pbnN0cnVjdGlvbnMnKS5hZGRDbGFzcygnaGlkZGVuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5vbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLm9uQ29tcGxldGUocmVzLm5leHREZWNvcmF0aW9uLCBub3cpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5tYXJrZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBOaWNlIGxvb2tpbmcgYWxlcnRcclxuICAgICAgICAgICAgICAgICAgICBhbGVydCgnU29tZXRoaW5nIEZhaWxlZCA6KCBUcnkgYWdhaW4/Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgRGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChkZWNvcmF0aW9uSW5kZXgpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5kZWNvcmF0aW9uSW5kZXggPSBkZWNvcmF0aW9uSW5kZXg7XHJcbiAgICAgICAgLy9UT0RPOiBoaWdobGlnaHQgdGhlIHBsYWNpbmcgb25lIHNvbWVob3dcclxuICAgICAgICAvL1JhbmRvbSBwbGFjaW5nXHJcbiAgICAgICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE5NjU0MjUxL3JhbmRvbS1wb2ludC1pbnNpZGUtdHJpYW5nbGUtaW5zaWRlLWphdmFcclxuICAgICAgICB2YXIgcjEgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIHZhciByMiA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgLy9UcmlhbmdsZSBjb3JuZXJzIChyb3VnaGx5KSBvZiB0aGUgdHJlZVxyXG4gICAgICAgIHZhciBheCA9IDM0MjtcclxuICAgICAgICB2YXIgYXkgPSAyMzk7XHJcbiAgICAgICAgdmFyIGJ4ID0gMzA4O1xyXG4gICAgICAgIHZhciBieSA9IDc2MDtcclxuICAgICAgICB2YXIgY3ggPSA5NTM7XHJcbiAgICAgICAgdmFyIGN5ID0gNTAwO1xyXG4gICAgICAgIHZhciB4ID0gKDEgLSBNYXRoLnNxcnQocjEpKSAqIGF4ICsgKE1hdGguc3FydChyMSkgKiAoMSAtIHIyKSkgKiBieCArIChNYXRoLnNxcnQocjEpICogcjIpICogY3g7XHJcbiAgICAgICAgdmFyIHkgPSAoMSAtIE1hdGguc3FydChyMSkpICogYXkgKyAoTWF0aC5zcXJ0KHIxKSAqICgxIC0gcjIpKSAqIGJ5ICsgKE1hdGguc3FydChyMSkgKiByMikgKiBjeTtcclxuICAgICAgICB2YXIgY2VudGVyID0gTC5sYXRMbmcoeCwgeSk7XHJcbiAgICAgICAgdGhpcy5tYXJrZXIgPSBMLmltYWdlT3ZlcmxheShSZXNvdXJjZXMuZGVjb3JhdGlvbkltYWdlc1tkZWNvcmF0aW9uSW5kZXhdLCBSZXNvdXJjZXMucGFkTGF0TG5nRm9yRGVjb3JhdGlvbihjZW50ZXIsIGRlY29yYXRpb25JbmRleCksIHsgaW50ZXJhY3RpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgLy9UT0RPOiBBcHBlYXIgYW5pbWF0aW9uIHdvdWxkIGJlIGNvb2xcclxuICAgICAgICB0aGlzLm1hcC5hZGRMYXllcih0aGlzLm1hcmtlcik7XHJcbiAgICAgICAgdGhpcy5tYXAuZmx5VG8oY2VudGVyLCA0LCB7IGVhc2VMaW5lYXJpdHk6IDYsIGR1cmF0aW9uOiAxIH0pO1xyXG4gICAgICAgIEwuRG9tRXZlbnQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24odGhpcy5tYXJrZXIuX2ltYWdlKTtcclxuICAgICAgICAkKHRoaXMubWFya2VyLl9pbWFnZSkuYWRkQ2xhc3MoJ3B1bHNhdGUnKTtcclxuICAgICAgICB0aGlzLmRyYWdnYWJsZSA9IG5ldyBMLkRyYWdnYWJsZSh0aGlzLm1hcmtlci5faW1hZ2UpO1xyXG4gICAgICAgIHRoaXMuZHJhZ2dhYmxlLmVuYWJsZSgpO1xyXG4gICAgICAgIC8vVE9ETzogS2VlcCB0aGUgZGVjb3JhdGlvbiBvbiB0aGUgdHJlZT9cclxuICAgICAgICB0aGlzLmRyYWdnYWJsZS5vbignZHJhZ2VuZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGVuZFBvcyA9IEwuRG9tVXRpbC5nZXRQb3NpdGlvbihfdGhpcy5tYXJrZXIuX2ltYWdlKTtcclxuICAgICAgICAgICAgZW5kUG9zID0gZW5kUG9zLmFkZChbX3RoaXMubWFya2VyLl9pbWFnZS5jbGllbnRXaWR0aCAvIDIsIF90aGlzLm1hcmtlci5faW1hZ2UuY2xpZW50SGVpZ2h0IC8gMl0pO1xyXG4gICAgICAgICAgICB2YXIgZW5kTGF0TG5nID0gX3RoaXMubWFwLmxheWVyUG9pbnRUb0xhdExuZyhlbmRQb3MpO1xyXG4gICAgICAgICAgICBfdGhpcy5tYXJrZXIuc2V0Qm91bmRzKFJlc291cmNlcy5wYWRMYXRMbmdGb3JEZWNvcmF0aW9uKGVuZExhdExuZywgZGVjb3JhdGlvbkluZGV4KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnI3BsYWNlbWVudC1jb25maXJtLWJveCcpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcclxuICAgICAgICAkKCcjcGxhY2VtZW50LWluc3RydWN0aW9ucycpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gRGVjb3JhdGlvblBsYWNpbmdNYW5hZ2VyO1xyXG59KCkpO1xyXG5leHBvcnRzLkRlY29yYXRpb25QbGFjaW5nTWFuYWdlciA9IERlY29yYXRpb25QbGFjaW5nTWFuYWdlcjtcclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9kZWNvcmF0aW9uUGxhY2luZ01hbmFnZXIudHNcbi8vIG1vZHVsZSBpZCA9IDVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnJlcXVpcmUoJy4vZmF2aWNvbi5wbmcnKTtcclxucmVxdWlyZSgnLi9mYXZpY29uLmljbycpO1xyXG5yZXF1aXJlKCcuL3RyZWUtMTIwLnBuZycpO1xyXG5leHBvcnRzLnRyZWVTdmcgPSByZXF1aXJlKCcuL2ltYWdlcy90cmVlLnN2ZycpO1xyXG5leHBvcnRzLm1heFBsYWNlbWVudEJvdW5kcyA9IEwubGF0TG5nQm91bmRzKFtbMTUwLCAyMjBdLCBbMTAwMCwgNzgwXV0pO1xyXG5leHBvcnRzLmRlY29yYXRpb25JbWFnZXMgPSBbXHJcbiAgICAvL25vcm1hbCBzaXplIDAtMThcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1ibHVlLWNlbnRlci5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1ibHVlLWxlZnQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctYmx1ZS1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1wdXJwbGUtbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy1wdXJwbGUtcmlnaHQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcmVkLWxlZnQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcmVkLXJpZ2h0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXRlYWwtbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy10ZWFsLXJpZ2h0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXllbGxvdy1sZWZ0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXllbGxvdy1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtZG93bi1sZWZ0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC1kb3duLXJpZ2h0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC1taWQtbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtbWlkLXJpZ2h0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC11cC1sZWZ0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYm9vdC11cC1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL3BvaW50eS1yZWQtbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL3BvaW50eS1yZWQtcmlnaHQuc3ZnJyksXHJcbiAgICAvL2JpZyBzaXplIDE5LTM4XHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctYmx1ZS1jZW50ZXIuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctYmx1ZS1sZWZ0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLWJsdWUtcmlnaHQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcHVycGxlLWxlZnQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcHVycGxlLXJpZ2h0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXJlZC1sZWZ0LnN2ZycpLFxyXG4gICAgcmVxdWlyZSgnLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXJlZC1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy10ZWFsLWxlZnQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctdGVhbC1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy15ZWxsb3ctbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy15ZWxsb3ctcmlnaHQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9ib290LWRvd24tbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtZG93bi1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtbWlkLWxlZnQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9ib290LW1pZC1yaWdodC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtdXAtbGVmdC5zdmcnKSxcclxuICAgIHJlcXVpcmUoJy4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtdXAtcmlnaHQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9wb2ludHktcmVkLWxlZnQuc3ZnJyksXHJcbiAgICByZXF1aXJlKCcuL2ltYWdlcy9kZWNvcmF0aW9ucy9wb2ludHktcmVkLXJpZ2h0LnN2ZycpLFxyXG5dO1xyXG5leHBvcnRzLmRlY29yYXRpb25QYWRkaW5nID0gNTtcclxuZnVuY3Rpb24gcGFkTGF0TG5nRm9yRGVjb3JhdGlvbihsYXRMbmcsIGRlY29yYXRpb25JbmRleCkge1xyXG4gICAgdmFyIHBhZGRpbmcgPSBleHBvcnRzLmRlY29yYXRpb25QYWRkaW5nO1xyXG4gICAgaWYgKGRlY29yYXRpb25JbmRleCA+PSAxOSAmJiBkZWNvcmF0aW9uSW5kZXggPD0gMzgpIHtcclxuICAgICAgICBwYWRkaW5nICs9IDI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTC5sYXRMbmdCb3VuZHMoW2xhdExuZy5sYXQgLSBwYWRkaW5nLCBsYXRMbmcubG5nIC0gcGFkZGluZ10sIFtsYXRMbmcubGF0ICsgcGFkZGluZywgbGF0TG5nLmxuZyArIHBhZGRpbmddKTtcclxufVxyXG5leHBvcnRzLnBhZExhdExuZ0ZvckRlY29yYXRpb24gPSBwYWRMYXRMbmdGb3JEZWNvcmF0aW9uO1xyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy50c1xuLy8gbW9kdWxlIGlkID0gNlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJmYXZpY29uLnBuZ1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vZmF2aWNvbi5wbmdcbi8vIG1vZHVsZSBpZCA9IDdcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwiZmF2aWNvbi5pY29cIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2Zhdmljb24uaWNvXG4vLyBtb2R1bGUgaWQgPSA4XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInRyZWUtMTIwLnBuZ1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vdHJlZS0xMjAucG5nXG4vLyBtb2R1bGUgaWQgPSA5XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcIjI2MzliN2M4YmU4NmUyMDMxYzBiN2ZiYWQwYzYzZmZmLnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL3RyZWUuc3ZnXG4vLyBtb2R1bGUgaWQgPSAxMFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCI1ODFiYjcyZWZhYzUzZWJhYTI3MjhjOThjMzFhNmU3YS5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctYmx1ZS1jZW50ZXIuc3ZnXG4vLyBtb2R1bGUgaWQgPSAxMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCIwODZmNWZkNTYyY2JmMWJhNGY4NDIwNGYyODE0ZGMyYi5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctYmx1ZS1sZWZ0LnN2Z1xuLy8gbW9kdWxlIGlkID0gMTJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwiOTA4ZjU1NTFmNWVlNjk5NDg0MjFmN2NjYTE5MGJiNmUuc3ZnXCI7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLWJsdWUtcmlnaHQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAxM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCI5YjYxZWMxYzA3MDU3YmMwODcxYTRlY2ViOTU5NzQzOS5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcHVycGxlLWxlZnQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAxNFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCIzNWZlZDFmZDYzY2MyNDkxOGZkM2Y5NmZmN2MzZTgxOC5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctcHVycGxlLXJpZ2h0LnN2Z1xuLy8gbW9kdWxlIGlkID0gMTVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwiYTYzMjAwNDNmZTU5YjQ2OWJlYzE3NjdjOGM1ZDhlMzIuc3ZnXCI7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXJlZC1sZWZ0LnN2Z1xuLy8gbW9kdWxlIGlkID0gMTZcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwiY2QyNzBiNDU0ZDQwY2U2YzE0Y2RiMzA1MDMxYzVjZWMuc3ZnXCI7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9pbWFnZXMvZGVjb3JhdGlvbnMvYmlnLXJlZC1yaWdodC5zdmdcbi8vIG1vZHVsZSBpZCA9IDE3XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcIjRiOWE1ZjVlMTAxN2RiZTJjODBlNTU5YWQ1MDdkN2VjLnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy10ZWFsLWxlZnQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAxOFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCIwYmYxZTU1MzgzOTA4NzYxNWY1NDg4MDAzNWE2MmJmYy5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9iaWctdGVhbC1yaWdodC5zdmdcbi8vIG1vZHVsZSBpZCA9IDE5XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcIjMwMDI2OGYwODg2MDlkMjI2MzhhZjFlNTY0M2EzZTEyLnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy15ZWxsb3ctbGVmdC5zdmdcbi8vIG1vZHVsZSBpZCA9IDIwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcIjA1ZjY2NTFjMWZiZmZlMDU4ODg1NDZmMjk4MjNlNzgwLnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2JpZy15ZWxsb3ctcmlnaHQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAyMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCI5MjkwNWFjOGM1YWU1NjhlYzQ5MTNiNDA5ZDU2OThmYi5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9ib290LWRvd24tbGVmdC5zdmdcbi8vIG1vZHVsZSBpZCA9IDIyXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcIjkwMmUzMWY1NjcyNTQ4MjFiZDc3ZjEwNzBjMjc5MmUwLnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtZG93bi1yaWdodC5zdmdcbi8vIG1vZHVsZSBpZCA9IDIzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcImQ4YmNkNTJmMTA1NTZlYmJkMGJjNjI0NmRlOTM2ZmQxLnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtbWlkLWxlZnQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAyNFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJjOWIxY2FiZjc2OWZiYTk4ZWJiMTQ4MmQ3MmM5N2ViNS5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9ib290LW1pZC1yaWdodC5zdmdcbi8vIG1vZHVsZSBpZCA9IDI1XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcIjRiMjUzM2M0Yjg2NjA0MzA4NzU5MjM4Y2VkMDA2OWU3LnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtdXAtbGVmdC5zdmdcbi8vIG1vZHVsZSBpZCA9IDI2XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcImU4M2E3MWI3NGM3MzM3ZThlZWEzY2YyYjU0ZTgyNjE0LnN2Z1wiO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vaW1hZ2VzL2RlY29yYXRpb25zL2Jvb3QtdXAtcmlnaHQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAyN1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCI1ZTNmMTU4ZjgzMzQyZWE2NGM1N2MzOGFkYmRlZDZjYS5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9wb2ludHktcmVkLWxlZnQuc3ZnXG4vLyBtb2R1bGUgaWQgPSAyOFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJjZDM3NjdlNGExNjE4MjY0MjY4YzcyNzVhNmFmZjYzNy5zdmdcIjtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2ltYWdlcy9kZWNvcmF0aW9ucy9wb2ludHktcmVkLXJpZ2h0LnN2Z1xuLy8gbW9kdWxlIGlkID0gMjlcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBKdXN0RGF0ZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAvKiogdmFsdWUgaXMgaW4gZm9ybWF0IGwuZ2V0RnVsbFllYXIoKSAqIDEwMDAwICsgKGwuZ2V0TW9udGgoKSArIDEpICogMTAwICsgbC5nZXREYXRlKCkgKi9cclxuICAgIGZ1bmN0aW9uIEp1c3REYXRlKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgSnVzdERhdGUucHJvdG90eXBlLmdldEZ1bGxZZWFyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMudmFsdWUgLyAxMDAwMCk7XHJcbiAgICB9O1xyXG4gICAgSnVzdERhdGUucHJvdG90eXBlLmdldE1vbnRoWmVyb0Jhc2VkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoTWF0aC5mbG9vcih0aGlzLnZhbHVlIC8gMTAwKSAlIDEwMCkgLSAxO1xyXG4gICAgfTtcclxuICAgIEp1c3REYXRlLnByb3RvdHlwZS5nZXREYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlICUgMTAwO1xyXG4gICAgfTtcclxuICAgIEp1c3REYXRlLnByb3RvdHlwZS5hc0RhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHRoaXMuZ2V0RnVsbFllYXIoKSwgdGhpcy5nZXRNb250aFplcm9CYXNlZCgpLCB0aGlzLmdldERhdGUoKSk7XHJcbiAgICB9O1xyXG4gICAgSnVzdERhdGUuY3JlYXRlID0gZnVuY3Rpb24gKHllYXIsIG1vbnRoWmVyb0Jhc2VkLCBkYXlPZk1vbnRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBKdXN0RGF0ZSh5ZWFyICogMTAwMDAgKyAobW9udGhaZXJvQmFzZWQgKyAxKSAqIDEwMCArIGRheU9mTW9udGgpO1xyXG4gICAgfTtcclxuICAgIEp1c3REYXRlLm5vdyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcclxuICAgICAgICByZXR1cm4gSnVzdERhdGUuY3JlYXRlKG5vdy5nZXRGdWxsWWVhcigpLCBub3cuZ2V0TW9udGgoKSwgbm93LmdldERhdGUoKSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEp1c3REYXRlO1xyXG59KCkpO1xyXG5leHBvcnRzLkp1c3REYXRlID0gSnVzdERhdGU7XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vanVzdERhdGUudHNcbi8vIG1vZHVsZSBpZCA9IDMwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIlwidXNlIHN0cmljdFwiO1xyXG4vL2V4cG9ydCBjb25zdCBzZXJ2ZXJCYXNlVXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCc7XHJcbmV4cG9ydHMuc2VydmVyQmFzZVVybCA9ICdodHRwczovL2FwaS54bWFzdHJlZS5pbyc7XHJcbnZhciBGYWtlU2VydmVyQ29tbXMgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gRmFrZVNlcnZlckNvbW1zKCkge1xyXG4gICAgfVxyXG4gICAgRmFrZVNlcnZlckNvbW1zLnByb3RvdHlwZS5nZXRTdGF0dXMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBhbW91bnRQbGFjZWQ6IDAsXHJcbiAgICAgICAgICAgICAgICBuZXh0RGVjb3JhdGlvbjogMFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIH07XHJcbiAgICBGYWtlU2VydmVyQ29tbXMucHJvdG90eXBlLmFkZERlY29yYXRpb24gPSBmdW5jdGlvbiAoeCwgeSwgd2hlbiwgY2FsbGJhY2spIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBuZXh0RGVjb3JhdGlvbjogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIH07XHJcbiAgICBGYWtlU2VydmVyQ29tbXMucHJvdG90eXBlLmdldEFsbERlY29yYXRpb25zID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY2FsbGJhY2soe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkZWNvcmF0aW9uczogW1s0NjUsIDU3OS4xODc1LCAxN10sIFs1NDIsIDc4OSwgMjBdLCBbMzM2LjI1LCA0NjIuMjUsIDMyXSwgWzU1OS4xMjUsIDU2OS4yNSwgOF0sIFs0NjIsIDU3MSwgMTNdLCBbNTA2LCA4ODYsIDM0XSwgWzQ2MC4zNzUsIDU2My43NSwgMTZdLCBbNTMxLjUsIDU3OSwgMjRdLCBbNDk3LjgxMjUsIDU1My4wNjI1LCAyXSwgWzQ1Ny44MTI1LCA1NTYuNzUsIDE1XSwgWzQ0MiwgNjk3LCAzMl0sIFs0MjUuODEyNSwgNTYzLjEyNSwgMl0sIFs1OTUuNSwgNTY0LCA5XSwgWzU2OCwgNDI0LCAyXSwgWzUwMCwgNTc1LCAxOF0sIFs1MDAsIDU3NSwgMzddLCBbNTAxLjM3NSwgNjM0LjM3NSwgMjFdLCBbNTUzLjU5Mzc1LCA3ODguOTM3NSwgMjldLCBbNDk2LCA2OTYuNzUsIDI5XSwgWzMwMC41MjAwMTk1MzEyNSwgMzcxLjkwMDAyNDQxNDA2MjUsIDIwXSwgWzY3MiwgODYxLjUsIDldLCBbNjc5LjUsIDg3MC41LCAxM10sIFs1MTYuMjE5NzQ5NDUwNjgzNiwgNTc2LjQyNjgxMzEyNTYxMDQsIDI3XSwgWzUyNS43NDcwMDE2NDc5NDkyLCA3MTUuMzU4NDg5OTkwMjM0NCwgMjVdLCBbNzQ3LjUsIDM2OC41LCAyM10sIFs0ODkuMTg3NSwgNTcyLjUsIDRdLCBbNzM4LCA1NzMsIDEwXSwgWzY2NC41LCAyMTUsIDIwXSwgWzUwNiwgNDcxLCAxOF0sIFszMjUuOTM3NSwgNDEzLjM3NSwgOV0sIFs0NTguMjUsIDU1MC4xMjUsIDE2XSwgWzQ1Ny44NzUsIDU0Mi44MTI1LCAxNF0sIFs0MjQsIDQ0OS41LCA2XSwgWzY4NS43NSwgNDc4LjUsIDE5XSwgWzU5NCwgNTU1LjUsIDEzXSwgWzM3Ni41LCA0MzUuMzEyNSwgMjhdLCBbNTQ4LjM3NSwgNzgyLjYyNSwgMThdLCBbNTc3LCA2NzgsIDEyXSwgWzM1OS4zNzUsIDYxNy43NSwgMV0sIFs2ODcuNSwgODU5LjUsIDI5XSwgWzYwMi41LCA1NjMuMjUsIDEwXSwgWzQ5NC41LCAyOTcsIDBdLCBbNDY1LCA5MDIuNzUsIDVdLCBbMzIyLCAzNzEuNSwgMTldLCBbMzY2LCA3MzUsIDldLCBbNTM0LjUsIDg2NCwgMjBdLCBbNDUyLjc1LCA1MzYuMzc1LCA0XSwgWzUwMi4xODc1LCA1NjUuNSwgMTFdLCBbNDAxLjUsIDQzOC41LCAxMF0sIFs1MDkuNjI1LCA0NjIuNzUsIDMzXSwgWzUzNC41LCA5MDAuNSwgMV0sIFs1MDMuMTI1LCA5MjUsIDI4XSwgWzI0NSwgODc5LCAyMV0sIFszOTIuNSwgNTE0LjUsIDhdLCBbNDk0LjEyNSwgNjQ4LjMxMjUsIDE4XSwgWzM0Ni44NzUsIDQ1OC4xMjUsIDMwXSwgWzQ5MCwgODMxLCAyNl0sIFs0NjAuMTI1LCA1NzkuMjUsIDE0XSwgWzQ5NC45Mzc1LCA4MjAuOTM3NSwgNF0sIFszMjkuMDYyNSwgNDY5Ljg3NSwgNF0sIFs2MTQuODc1LCA0NTguNjI1LCA1XSwgWzY2NS42MjUsIDQxMi45Mzc1LCAzXSwgWzQ1MS41LCA1MjguNSwgNV0sIFs2OTMuNSwgODQ2Ljc1LCAyOV0sIFs0NTEuNzUsIDQzOS44NzUsIDVdLCBbNTM4Ljc1LCA3NjkuNzUsIDFdLCBbNTcxLjQ0MTYyNzIzMTUyMDQsIDY5NS45ODI4ODQwNTMzOTI3LCA0XSwgWzQ5MS43NSwgNjMzLjI1LCAyMl0sIFs2NDYuMjUsIDYwMywgMzddLCBbNTU1LjUsIDY5NC41LCA5XSwgWzYwNiwgNDgzLCA3XSwgWzU0Ni4yNSwgNzY2LjYyNSwgMl0sIFs2NDUsIDQ1My41LCAzN10sIFszNjEsIDYxMC4yNSwgMTZdLCBbMzUzLCAzMTEuNSwgMTFdLCBbNjQ2LjUsIDU5Mi43NSwgMTddLCBbNDk1LjYyNSwgNjQyLCAxMl0sIFs2NjYsIDg0OSwgMjJdLCBbNTAzLjMxMjUsIDkzOS45Mzc1LCAxNl0sIFsyNDEsIDI5OSwgMjRdLCBbMzIzLjUsIDQ2MC41LCA3XSwgWzQwOC43NSwgNTc0Ljc1LCAzNl0sIFs0NjIsIDY4OC41LCAyMV0sIFs2OTguNzUsIDgzNC4yNSwgMjFdLCBbNjQ5LCA1ODMsIDMzXSwgWzQ2Ni41LCA4NzYsIDI0XSwgWzY0Ni41LCA1ODMuNjI1LCAxOF0sIFs1NDEuNSwgMjc1LjUsIDI2XSwgWzI4My41LCA4NzguNSwgMTldLCBbNDkyLCA2NTQsIDE3XSwgWzQ2NC45ODQzNzUsIDkwMi43ODEyNSwgNl0sIFs1MzQuNjI1LCA5MDAuNDM3NSwgNV0sIFszMjMuMzc1LCA0NjAuNTYyNSwgOF0sIFs1MTgsIDY4OCwgMTZdLCBbNDU3LjUsIDU4OCwgMzRdLCBbNTY5LjUsIDU4OC41LCA2XSwgWzYyMS41LCAyODEuNSwgMjddLCBbNTIxLjUsIDIyMiwgMTRdLCBbNDU4LjI1LCA1OTYuNSwgMTRdLCBbNjk4LjQwNjI1LCA4MzQuNDA2MjUsIDFdLCBbNDcwLjUsIDU0MywgMzJdLCBbNDczLjUsIDkxNywgOV0sIFs0MDYuMjUsIDI3MS41LCAyNl0sIFs0NDguNSwgNTE5LjUsIDVdLCBbNTQ2LCA1MDgsIDMwXSwgWzQ3MC41LCA1NzguMzc1LCAxMV0sIFszODMuODc1LCAzMTQsIDE3XSwgWzI2NiwgODYxLCAzM10sIFs1MjUuNSwgNTIwLjUsIDM1XSwgWzY2MS4yNSwgODM1LjI1LCAyMF0sIFs0OTUsIDY1OSwgMzZdLCBbNDk2LjUsIDY2My41LCA3XSwgWzY1MCwgNTc1LCAxNF0sIFs2NzcuODEyNSwgNDEyLjI1LCAxOV0sIFs3MDEsIDgyMywgMF0sIFs1MDIuMDYyNSwgMjk3LCAxXSwgWzcwNi4yNSwgMzIwLCAyMV0sIFs0OTQuNSwgNTQyLjUsIDI2XSwgWzQwOS41LCA1NjIuMjUsIDM1XV1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gRmFrZVNlcnZlckNvbW1zO1xyXG59KCkpO1xyXG5leHBvcnRzLkZha2VTZXJ2ZXJDb21tcyA9IEZha2VTZXJ2ZXJDb21tcztcclxudmFyIFJlYWxTZXJ2ZXJDb21tcyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBSZWFsU2VydmVyQ29tbXMoKSB7XHJcbiAgICB9XHJcbiAgICBSZWFsU2VydmVyQ29tbXMucHJvdG90eXBlLmdldFN0YXR1cyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogZXhwb3J0cy5zZXJ2ZXJCYXNlVXJsICsgJy9hcGkvc3RhdHVzL3YxJyxcclxuICAgICAgICAgICAgeGhyRmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXMpO1xyXG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFJlYWxTZXJ2ZXJDb21tcy5wcm90b3R5cGUuYWRkRGVjb3JhdGlvbiA9IGZ1bmN0aW9uICh4LCB5LCB3aGVuLCBjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IGV4cG9ydHMuc2VydmVyQmFzZVVybCArICcvYXBpL2RlY29yYXRpb25zL2FkZC92MScsXHJcbiAgICAgICAgICAgIHhockZpZWxkczoge1xyXG4gICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgICAgIHk6IHksXHJcbiAgICAgICAgICAgICAgICBkYXRlOiB3aGVuLnZhbHVlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbiAocmVzKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBuZXh0RGVjb3JhdGlvbjogcmVzLm5leHREZWNvcmF0aW9uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICBjYWxsYmFjayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG5leHREZWNvcmF0aW9uOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFJlYWxTZXJ2ZXJDb21tcy5wcm90b3R5cGUuZ2V0QWxsRGVjb3JhdGlvbnMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6IGV4cG9ydHMuc2VydmVyQmFzZVVybCArICcvYXBpL2RlY29yYXRpb25zL3YxJyxcclxuICAgICAgICAgICAgeGhyRmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh7XHJcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9uczogcmVzLmRlY29yYXRpb25zLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2soe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9uczogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUmVhbFNlcnZlckNvbW1zO1xyXG59KCkpO1xyXG5leHBvcnRzLlJlYWxTZXJ2ZXJDb21tcyA9IFJlYWxTZXJ2ZXJDb21tcztcclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9zZXJ2ZXJDb21tcy50c1xuLy8gbW9kdWxlIGlkID0gMzFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==