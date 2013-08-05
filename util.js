/*
* Mole v1.0
* author: 摩帆士
* Date: 2013-05-21
* https://github.com/mfslhs
*/
;(function( window , undefined){

	window.Mole  = Mole = {};

	/*
	 * 选择器，以后会扩展
	*/
	$ = function(id){
		return "string" == typeof(id) ? document.getElementById(id) : id;
	};

	/**
	 * 扩展继承
	 */
	(function(Mole){

		/*创建一个空壳函数*/
		Mole.emptyFunction = function(){};

		//extend扩展对象
		Mole.extend = function (destination, source, override) {
			if (override === undefined) override = true;
			for (var property in source) {
				if (override || !(property in destination)) {
					destination[property] = source[property];
				}
			}
			return destination;
		};

		//深度扩展(深度克隆)
		Mole.deepextend = function (destination, source) {
			for (var property in source) {
				var copy = source[property];
				if ( destination === copy ) continue;
				if ( typeof copy === "object" ){
					destination[property] = arguments.callee( destination[property] || {}, copy );
				}else{
					destination[property] = copy;
				}
			}
			return destination;
		};

		/*from youa*/
		Mole.wrapper = function(me, parent) {
		    var ins = function() { me.apply(this, arguments); };
		    var subclass = function() {};
		    subclass.prototype = parent.prototype;
		    ins.prototype = new subclass;
		    return ins;
		};

	})(Mole);


	/*浏览器版本检测*/
	Mole.UA = (function(ua){
		var b = {
			msie: /msie/.test(ua) && !/opera/.test(ua),
			opera: /opera/.test(ua),
			safari: /webkit/.test(ua) && !/chrome/.test(ua),
			firefox: /firefox/.test(ua),
			chrome: /chrome/.test(ua)
		};
		var vMark = "";
		for (var i in b) {
			if (b[i]) { vMark = "safari" == i ? "version" : i; break; }
		}
		b.version = vMark && RegExp("(?:" + vMark + ")[\\/: ]([\\d.]+)").test(ua) ? RegExp.$1 : "0";
		
		b.ie = b.msie;
		b.ie6 = b.msie && parseInt(b.version, 10) == 6;
		b.ie7 = b.msie && parseInt(b.version, 10) == 7;
		b.ie8 = b.msie && parseInt(b.version, 10) == 8;
		
		return b;
	})(window.navigator.userAgent.toLowerCase());

	/**
	 * 实用工具
	 */
	Mole.util = (function(util) {

	  var toString = Object.prototype.toString;
	  var AP = Array.prototype;

	 /**
	 * @overview 语言增强
	 */
	  util.isString = function(val) {
	    return toString.call(val) === '[object String]';
	  };
	  
	  util.isNumber = function(val) {
	    return toString.call(val) === '[object Number]';
	  };

	  util.isObject = function(val) {
	    return val === Object(val);
	  };
	  
	  util.isRegExp = function(val) {
	    return toString.call(val) === '[object RegExp]';
	  };

	  util.isFunction = function(val) {
	    return toString.call(val) === '[object Function]';
	  };


	  util.isArray = Array.isArray || function(val) {
	    return toString.call(val) === '[object Array]';
	  };


	  util.indexOf = AP.indexOf ?
	      function(arr, item) {        
	        return arr.indexOf(item);
	      } :
	      function(arr, item) {
	        for (var i = 0, len = arr.length; i < len; i++) {
	          if (arr[i] === item) {
	            return i;
	          }
	        }
	        return -1;
	      };


	  var forEach = util.forEach = AP.forEach ?
	      function(arr, fn) {
	        arr.forEach(fn);
	      } :
	      function(arr, fn) {
	        for (var i = 0, len = arr.length; i < len; i++) {
	          fn(arr[i], i, arr);
	        }
	      };


	  util.map = AP.map ?
	      function(arr, fn) {
	        return arr.map(fn);
	      } :
	      function(arr, fn) {
	        var ret = [];
	        forEach(arr, function(item, i, arr) {
	          ret.push(fn(item, i, arr));
	        });
	        return ret;
	      };


	  util.filter = AP.filter ?
	      function(arr, fn) {
	        return arr.filter(fn);
	      } :
	      function(arr, fn) {
	        var ret = [];
	        forEach(arr, function(item, i, arr) {
	          if (fn(item, i, arr)) {
	            ret.push(item);
	          }
	        });
	        return ret;
	      };


	  util.unique = function(arr) {
	    var ret = [];
	    var o = {};

	    forEach(arr, function(item) {
	      o[item] = 1;
	    });

	    if (Object.keys) {
	      ret = Object.keys(o);
	    }
	    else {
	      for (var p in o) {
	        if (o.hasOwnProperty(p)) {
	          ret.push(p);
	        }
	      }
	    }

	    return ret;
	  };


	  util.now = Date.now || function() {
	    return new Date().getTime();
	  };

	  return util;

	})({});


	/**
	 * 储存一些Dom操作，并解决一些兼容性问题
	 */
	Mole.Dom = {
		/*getScrollTop和getScrollLeft分别是获取文档滚动的scrollTop和scrollLeft。
		一般来说如果在标准模式下应该用documentElement获取，否则用body获取。
		但chrome和safari（都是用WebKit渲染引擎）即使在标准模式下也要用body来获取
		*/
		getScrollTop: function(node) {
			var doc = node ? node.ownerDocument : document;
			return doc.documentElement.scrollTop || doc.body.scrollTop;
		},
		getScrollLeft: function(node) {
			var doc = node ? node.ownerDocument : document;
			return doc.documentElement.scrollLeft || doc.body.scrollLeft;
		},

		/*contains方法是判断参数1元素对象是否包含了参数2元素对象*/
		contains: document.defaultView
			? function (a, b) { return !!( a.compareDocumentPosition(b) & 16 ); }
			: function (a, b) { return a != b && a.contains(b); },

		/*rect是相对浏览器文档的位置，clientRect是相对浏览器视窗的位置*/
		rect: function(node){
			var left = 0, top = 0, right = 0, bottom = 0;
			if ( !node.getBoundingClientRect || B.ie8 ) {
				var n = node;
				while (n) { left += n.offsetLeft, top += n.offsetTop; n = n.offsetParent; };
				right = left + node.offsetWidth; bottom = top + node.offsetHeight;
			} else {
				var rect = node.getBoundingClientRect();
				left = right = D.getScrollLeft(node); top = bottom = D.getScrollTop(node);
				left += rect.left; right += rect.right;
				top += rect.top; bottom += rect.bottom;
			};
			return { "left": left, "top": top, "right": right, "bottom": bottom };
		},
		clientRect: function(node) {
			var rect = D.rect(node), sLeft = D.getScrollLeft(node), sTop = D.getScrollTop(node);
			rect.left -= sLeft; rect.right -= sLeft;
			rect.top -= sTop; rect.bottom -= sTop;
			return rect;
		},
		curStyle: document.defaultView
			? function (elem) { return document.defaultView.getComputedStyle(elem, null); }
			: function (elem) { return elem.currentStyle; },
		getStyle: document.defaultView
			? function (elem, name) {
				var style = document.defaultView.getComputedStyle(elem, null);
				return name in style ? style[ name ] : style.getPropertyValue( name );
			}
			: function (elem, name) {
				var style = elem.style, curStyle = elem.currentStyle;
				if ( name == "opacity" ) {
					if ( /alpha\(opacity=(.*)\)/i.test(curStyle.filter) ) {
						var opacity = parseFloat(RegExp.$1);
						return opacity ? opacity / 100 : 0;
					}
					return 1;
				}
				if ( name == "float" ) { name = "styleFloat"; }
				var ret = curStyle[ name ] || curStyle[ S.camelize( name ) ];
				if ( !/^-?\d+(?:px)?$/i.test( ret ) && /^\-?\d/.test( ret ) ) {
					var left = style.left, rtStyle = elem.runtimeStyle, rsLeft = rtStyle.left;
					
					rtStyle.left = curStyle.left;
					style.left = ret || 0;
					ret = style.pixelLeft + "px";
					
					style.left = left;
					rtStyle.left = rsLeft;
				}
				return ret;
			},
		setStyle: function(elems, style, value) {
			if ( !elems.length ) { elems = [ elems ]; }
			if ( typeof style == "string" ) { var s = style; style = {}; style[s] = value; }
			A.forEach( elems, function(elem ) {
				for (var name in style) {
					var value = style[name];
					if (name == "opacity" && B.ie) {
						elem.style.filter = (elem.currentStyle && elem.currentStyle.filter || "").replace( /alpha\([^)]*\)/, "" ) + " alpha(opacity=" + (value * 100 | 0) + ")";
					} else if (name == "float") {
						elem.style[ B.ie ? "styleFloat" : "cssFloat" ] = value;
					} else {
						elem.style[ S.camelize( name ) ] = value;
					}
				};
			});
		},
		getSize: function(elem) {
			var width = elem.offsetWidth, height = elem.offsetHeight;
			if ( !width && !height ) {
				var repair = !D.contains( document.body, elem ), parent;
				if ( repair ) {
					parent = elem.parentNode;
					document.body.insertBefore(elem, document.body.childNodes[0]);
				}
				var style = elem.style,
					cssShow = { position: "absolute", visibility: "hidden", display: "block", left: "-9999px", top: "-9999px" },
					cssBack = { position: style.position, visibility: style.visibility, display: style.display, left: style.left, top: style.top };
				D.setStyle( elem, cssShow );
				width = elem.offsetWidth; height = elem.offsetHeight;
				D.setStyle( elem, cssBack );
				if ( repair ) {
					parent ? parent.appendChild(elem) : document.body.removeChild(elem);
				}
			}
			return { "width": width, "height": height };
		}
	};


	/**
	 * Event事件处理
	 */
	Mole.Event = (function(){
		/*from dean edwards*/
		addEvent = function(element, type, handler) {
			if (element.addEventListener) {
				element.addEventListener(type, handler, false);
			} else {
				// assign each event handler a unique ID
				if (!handler.$$guid) handler.$$guid = addEvent.guid++;
				// create a hash table of event types for the element
				if (!element.events) element.events = {};
				// create a hash table of event handlers for each element/event pair
				var handlers = element.events[type];
				if (!handlers) {
					handlers = element.events[type] = {};
					// store the existing event handler (if there is one)
					if (element["on" + type]) {
						handlers[0] = element["on" + type];
					}
				}
				// store the event handler in the hash table
				handlers[handler.$$guid] = handler;
				// assign a global event handler to do all the work
				element["on" + type] = handleEvent;
			}
		};
		// a counter used to create unique IDs
		addEvent.guid = 1;

		removeEvent = function(element, type, handler) {
			if (element.removeEventListener) {
				element.removeEventListener(type, handler, false);
			} else {
				// delete the event handler from the hash table
				if (element.events && element.events[type]) {
					delete element.events[type][handler.$$guid];
				}
			}
		};

		handleEvent = function(event) {
			var returnValue = true;
			// grab the event object (IE uses a global event object)
			event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
			// get a reference to the hash table of event handlers
			var handlers = this.events[event.type];
			// execute each event handler
			for (var i in handlers) {
				this.$$handleEvent = handlers[i];
				if (this.$$handleEvent(event) === false) {
					returnValue = false;
				}
			}
			return returnValue;
		};

		fixEvent = function(event) {
			// add W3C standard event methods
			event.preventDefault = fixEvent.preventDefault;
			event.stopPropagation = fixEvent.stopPropagation;
			return event;
		};
		fixEvent.preventDefault = function() {
			this.returnValue = false;
		};
		fixEvent.stopPropagation = function() {
			this.cancelBubble = true;
		};

		return {
			'addEvent' : addEvent,
			'removeEvent' : removeEvent,
			'handleEvent' : handleEvent,
			'fixEvent' : fixEvent
		}
	})();

	/**
	 * WindowUtil
	 */
	Mole.WindowUtil = {
		camelize: function(s){
			return s.replace(/-([a-z])/ig, function(all, letter) { return letter.toUpperCase(); });
		},
		//获取url参数值
		getRequest:function (name) {
	       var url = location.search; //获取url中"?"符后的字串
	       var theValue = "";
	       if (url.indexOf("?") != -1) {
	         var str = url.substr(1);   
	          strs = str.split("&");
	          for(var i = 0; i < strs.length; i ++) {
	            if(strs[i].split("=")[0]==name){
	                theValue=strs[i].split("=")[1];
	            }
	          } 
	       }
	       return theValue;
	    },
	    //四舍五入方法
	    roundData:function (number,fractionDigits){  
	        with(Math){  
	            return round(number*pow(10,fractionDigits))/pow(10,fractionDigits);  
	        }  
	    },
	    //给url添加参数
	    addURLParam:function(url,name,value){
	    	url+=(url.indexOf("?")==-1 ? "?":"&");
	    	url+=encodeURIComponent(name)+"="+encodeURIComponent(value);
	    	return url;
	    },
	    //获取浏览器cookies
	    getCookie:function(name){
	    	var cookieName=encodeURIComponent(name) + "=",
	    	cookieStart=document.cookie.indexOf(cookieName),
	    	cookieValue=null;
	    	if(cookieStart>-1){
	    		var cookieEnd=document.cookie.indexOf(";",cookieStart);
	    		if(cookieEnd==-1){
	    			cookieEnd=document.cookie.length;
	    		}
	    		cookieValue=decodeURIComponent(document.cookie.substring(cookieStart+cookieName.length,cookieEnd));
	    	}
	    	return cookieValue;
	    },
	    //设置浏览器cookies
	    setCookie:function(name,value,expires,path,domain,secure){
	    	var cookieText=encodeURIComponent(name)+"="+encodeURIComponent(value);
	    	if(expires instanceof Date){
	    		cookieText +="; expires="+expires.toGMTString();
	    	}
	    	if(path){
	    		cookieText +="; path="+path;
	    	}
	    	if(domain){
	    		cookieText +="; domain="+domain;
	    	}
	    	if(secure){
	    		cookieText += "; secure";
	    	}
	    	document.cookie=cookieText;
	    },
	    //删除cookies
	    removeCookie:function(name,path,domain,secure){
	    	this.set(name,"",new Date(0),path,domain,secure);
	    },
	    //从一个数组里面随机获得N个不重复的随机数
	    getNrand:function(min,max,num){
			function randomsort(a, b) {
				return Math.random()>.5 ? -1 : 1;//用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
			}
			var arr = new Array();
			for(i=min;i<=max;i++){
			    arr.push(i)
			}
			var  b = arr.sort(randomsort);
			b = b.slice(0,num)
			return b
		}
	};

	/**
	 * WindowUtil
	 */
	Mole.CheckUtil={
		//去除空格函数
	    trim:function(str){
	        return str.replace(/(^\s*)|(\s*$)/g, "");
	    },

	    //验证邮箱函数
	    isEmail:function(email){
	        var regex = /^[a-zA-Z0-9]+([\._-][a-zA-Z0-9]+)*@(([a-zA-Z0-9]+([\.-][a-zA-Z0-9]+)?)+\.)+[a-zA-Z]+$/;
	        return regex.test(email);
	    },

	    //验证非零正整数函数
	    isNumber:function(num) {
	        var regex = /^(0|[1-9][0-9]*)$/;
	        return regex.test(num);
	    },

	    //验证QQ号码
	    isQQ:function(qq){
	    	var regex = /^[1-9]*[1-9][0-9]*$/;
	        return regex.test(qq);
	    },

	    //验证是否是日期
	    isDate:function(date){
	    	var regex = /^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/;
	        return regex.test(date);
	    },

	    //验证用户名，中文、英文字母、数字组合，5-20个字符。
	    isUserName:function(name){
	    	var regex = /^[a-zA-Z0-9\u4E00-\u9FA5\uF900-\uFA2D]{5,20}$/;
	        return regex.test(name);
	    },
	    
	    //验证手机号码
	    isPhoneNum:function(phone){
	    	var regex = /^13[0-9]{9}|15[012356789][0-9]{8}|18[0256789][0-9]{8}|147[0-9]{8}$/;
	        return regex.test(phone);
	    },

	    //验证电话号码(包括验证国内区号,国际区号,分机号)
	    isTellNum:function(tell){
	    	var regex = /^(([0\+]\d{2,3}-)?(0\d{2,3})-)?(\d{7,8})(-(\d{3,}))?$/;
	        return regex.test(tell);
	    },

	    //仅中文
	    isChinese:function(data){
	    	var regex = /^[\u4E00-\u9FA5\uF900-\uFA2D]+$/;
	        return regex.test(data);
	    },
	    
	    //非空
	    isNotempty:function(data){
	    	var regex = /^\S+$/;
	        return regex.test(data);
	    }	
	}

	/************************************************* Function *****************************************************/
	Mole.Function = {
		timeout: function (fun, time) {
			return setTimeout(fun, time);
		},
		interval: function (fun, time) {
			return setInterval(fun, time);
		},
		//apply scope, and can transfer some arguments
		bind: function(fun) {
			var  _this = arguments[1], args = [];
			for (var i = 2, il = arguments.length; i < il; i++) {
				args.push(arguments[i]);
			}
			return function(){
				var thisArgs =  args.concat();
				for (var i=0, il = arguments.length; i < il; i++) {
					thisArgs.push(arguments[i]);
				}
				return fun.apply(_this || this, thisArgs);
			}
		},
		//apply scope, and transfer event and some ohter arguments
		bindEvent: function(fun) {
			var  _this = arguments[1], args = [];
			for (var i = 2, il = arguments.length; i < il; i++) {
				args.push(arguments[i]);
			}
			return function(e){
				var thisArgs = args.concat();
				thisArgs.unshift(e || window.event);
				return fun.apply(_this || this, thisArgs);
			}
		},
		//clone function
		clone: function(fun){
			var clone = function(){
				return fun.apply(this, arguments);	
			};
			clone.prototype = fun.prototype;
			for(prototype in fun){
				if(fun.hasOwnProperty(prototype) && prototype != 'prototype'){
					clone[prototype] = fun[prototype];
				}
			}
			return clone;
		}
	};

	/************************************************** String *******************************************************/
	Mole.String = {
		//remove space of head and end
		trim: function(str) {
			return str.replace(/^\s+|\s+$/g, '');
		},
		//escapeHTML
		escapeHTML: function(str) {
			return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		},
		//unescapeHTML
		unescapeHTML: function(str) {
			return str.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
		},
		//get the string's length, a Chinese char is two lengths
		byteLength: function(str) {
	  		return str.replace(/[^\x00-\xff]/g,"**").length;
		},
		//remove the last char
		delLast: function(str){
			return str.substring(0, str.length - 1);
		},
		//String to Int
		toInt: function(str) {
			return Math.floor(str);
		},
		//String to Array
		toArray: function(str, o){
			return str.split(o||'');
		},
		//substring, start from head, and a Chinese char is two lengths
		left: function(str, n){
	        var s = str.replace(/\*/g, " ").replace(/[^\x00-\xff]/g, "**");
			s = s.slice(0, n).replace(/\*\*/g, " ").replace(/\*/g, "").length;
	        return str.slice(0, s);
	    },
	    //substring, start from end, and a Chinese char is two lengths
	    right: function(str, n){
			var len = str.length;
			var s = str.replace(/\*/g, " ").replace(/[^\x00-\xff]/g, "**");
			s = s.slice(s.length - n, s.length).replace(/\*\*/g, " ").replace(/\*/g, "").length;
	        return str.slice(len - s, len);
	    },
	    //remove HTML tags 
	    removeHTML: function(str){
	        return str.replace(/<\/?[^>]+>/gi, '');
	    },
	    //format string
		//eg. "<div>{0}</div>{1}".format(txt0,txt1);
	    format: function(){
	        var  str = arguments[0], args = [];
			for (var i = 1, il = arguments.length; i < il; i++) {
				args.push(arguments[i]);
			}
	        return str.replace(/\{(\d+)\}/g, function(m, i){
	            return args[i];
	        });
	    },
	    // toLowerCase
	    toLower: function(str){
	        return str.toLowerCase();
	    },
	    // toUpperCase
	    toUpper: function(str){
	        return str.toUpperCase();
	    },
		// toString(16)
		on16: function(str){
			var a = [], i = 0;
	        for (; i < str.length ;) a[i] = ("00" + str.charCodeAt(i ++).toString(16)).slice(-4);
	        return "\\u" + a.join("\\u");
		},
		// unString(16)
		un16: function(str){
			return unescape(str.replace(/\\/g, "%"));
		}
	};

	/************************************************** Array *******************************************************/
	Mole.Array = {
		_each: function(arr, ca, collect, only) {
			var r = [];
	        for (var i = 0, il = arr.length; i<il; i++) {
	            var v = ca(arr[i], i);
	            if (collect && typeof(v) != 'undefined'){
					if(only){
						r = _onlyPush(r, v);
					} else {
						r.push(v);
					}
				} else {
					if(!collect && v == 'break') break;
				}
	        }
			return r;
		},
		each: function(arr, ca) {
			this._each(arr, ca, false);
			return this;
		},
		collect: function(arr, ca, only) {
			return this._each(arr, ca, true, only);
		},
		//whether an Array include th value or object 
		include: function(arr, value) {
			return this.index(arr, value) != -1;
		},
		//take the index that the value in an Array
		index: function(arr, value) {
			for (var i=0, il = arr.length; i < il; i++) {
				if (arr[i] == value) return i;
			}
			return -1;
		},
		//unique
		unique: function(arr) {
			if(arr.length && typeof (arr[0]) == 'object'){
				var len = arr.length;
				for (var i=0, il = len; i < il; i++) {
					var it = arr[i];
					for (var j = len - 1; j>i; j--) {
						if (arr[j] == it) arr.splice(j, 1);
					}
				}
				return arr;
			} else {
				var result = [], hash = {};
				for(var i = 0, key; (key = arr[i]) != null; i++){
					if(!hash[key]){
						result.push(key);
						hash[key] = true;
					}
				}
				return result;
			}
		},
		//remove the item
		remove: function(arr, o) {
			if (typeof o == 'number' && !Como.Array.include(arr, o)) {
				arr.splice(o, 1);
			} else {
				var i=Como.Array.index(arr, o);
				arr.splice(i, 1);
			}
			return arr;
		},
		//take a random item
		random: function(arr){
			var i = Math.round(Math.random() * (arr.length-1));
			return arr[i];
		}
	};

	/************************************************** Date *******************************************************/
	Mole.Date = {
		//eg. new Date().format('yyyy-MM-dd');
		format: function(date, f){
	        var o = {
	            "M+": date.getMonth() + 1,
	            "d+": date.getDate(),
	            "h+": date.getHours(),
	            "m+": date.getMinutes(),
	            "s+": date.getSeconds(),
	            "q+": Math.floor((date.getMonth() + 3) / 3),
	            "S": date.getMilliseconds()
	        };
	        if (/(y+)/.test(f))
	            f = f.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	        for (var k in o)
	            if (new RegExp("(" + k + ")").test(f))
	                f = f.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
	        return f;
	    }
	};
})(window);