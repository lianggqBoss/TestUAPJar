//全局函数
function $getParam(name,url) {
  var result = null, tmp = [], search = url || location.search;
  if (!search || search.length < 1) return result;
  search = search.substr(search.indexOf('?') + 1);
  if(!search) return result;
  var items = search.split("&");
  for (var index = 0; index < items.length; index++) {
    tmp = items[index].split("=");
    if (tmp[0] === name) result = decodeURIComponent(tmp[1]);
  }
  return result;
};
function $url(url) {
  if (!url || url.indexOf('http:') == 0 || url.indexOf('https:') == 0 || !pageContext.contextPath || url.indexOf(pageContext.contextPath) == 0) {
    return url;
  } else if (url.charAt(0) == '~') {
    return url.substring(1);
  } else if (url.charAt(0) == '/') {
    return pageContext.contextPath + url;
  } else {
    return url;
  }
};
function $rest(rest, method) {
  return $url('/rest/' + rest + '/' + method + '.json');
};
function $postJSON(url, data, cb, error) {
  $.ajax({
    url: url,
    data: typeof(data) == 'string' ? data : JSON.stringify(data),
    contentType: 'application/json;charset=utf-8',
    success: cb,
    type: 'POST',
    dataType: 'JSON',
    error: error
  });
};
function $isChildWin() {
  return top.window != window;
}
function $addListener(event, listener) {
    if (window.attachEvent) {
        window.attachEvent('on'+event, listener);
    } else {
        window.addEventListener(event, listener, false);
    }
}
function $isValidValue(value) {
	if(value === null || value === undefined || (typeof(value) == 'string' && value === '')){
		return false;
	}
	return true;
}
var fmx = this['fmx'] || (this['fmx'] = {});
fmx['pageContext'] = window['pageContext'] || {};
(function ($, fmx) {
  var CommonExporter = new function () {
    var url = $url('/commonExport/');
    function doPost(method, params) {
      var form = document.createElement("form");
      form.setAttribute("method", "post");
      form.setAttribute("action", url + method + '.do');
      form.setAttribute("target", "_blank");
      $.each(params, function (key, val) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", ($.isPlainObject(val) || $.isArray(val)) ? JSON.stringify(val) : val);
        form.appendChild(hiddenField);
      });
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }
    this.doExportQuery = function (exportInfo, queryInfo, columns) {
      doPost("exportQuery", {
        exportInfo: exportInfo,
        queryInfo: queryInfo,
        columns: columns
      });
    }
    this.doExport = function (exportInfo, data) {
      doPost("export", {
        exportInfo: exportInfo,
        data: data
      });
    }
  };
  var CommonQueryService = new function () {
    function doPost(method, params, success, error) {
      var url = $rest('commonQueryRest', method);
      $postJSON(url, params, success, error);
    }
    this.getSelectCodeData = function (queryInfo, success, error) {
      doPost("getSelectCodeData", queryInfo, success, error);
    }
    this.getSelectCodeDatas = function (queryInfos, success, error) {
      doPost('getSelectCodeDatas', queryInfos, success, error);
    }
    this.getSelectCodeValuesByKeys = function (codeValues, success, error) {
      doPost('getSelectCodeValuesByKeys', codeValues, success, error);
    }
    this.getSelectCodeOpts = function (codeTypes, success, error) {
      doPost('getSelectCodeOpts', codeTypes, success, error);
    }
    this.getSelectCodeOpt = function (codeType, success, error) {
      $.ajax({
        url: $rest('commonQueryRest', 'getSelectCodeOpt'),
        data: 'codeType=' + codeType,
        type: 'POST',
        dataType: 'json',
        success: success,
        error: error
      });
    }
    this.query = function (queryInfo, success, error) {
      doPost('query', queryInfo, success, error);
    }
  };

  //缓存数据
  var SELECT_CODE_VALUES = {}, SELECT_CODE_DATAS = {}, SELECT_CODE_OPTS = {}, AUTHORIZED_FUNCTIONS = [];
  function getSelectCodeValues() {
    if (!fmx.pageContext.easyui.useGlobalCodeData || !$isChildWin()) {
      return SELECT_CODE_VALUES;
    } else if (window.top.fmx && window.top.fmx.getSelectCodeValues) {
      return window.top.fmx.getSelectCodeValues();
    } else {
      return SELECT_CODE_VALUES;
    }
  };

  function getSelectCodeDatas() {
    if (!fmx.pageContext.easyui.useGlobalCodeData || !$isChildWin()) {
      return SELECT_CODE_DATAS;
    } else if (window.top.fmx && window.top.fmx.getSelectCodeDatas) {
      return window.top.fmx.getSelectCodeDatas();
    } else {
      return SELECT_CODE_DATAS;
    }
  }

  function getSelectCodeOpts() {
    if (!$isChildWin()) {
      return SELECT_CODE_OPTS;
    } else if (window.top.fmx && window.top.fmx.getSelectCodeOpts) {
      return window.top.fmx.getSelectCodeOpts();
    } else {
      return SELECT_CODE_OPTS;
    }
  }

  function getSelectCodeValue(codeType,key,isDisplay) {
	  function getValue(codeValue,k){
		  var value = codeValue[k];
		  if(!$isValidValue(value)){
			  k = k.toLowerCase();
			 $.each(codeValue,function(k1,v){
				if(k1.toLowerCase() == k){
					value = v;
					return false;
				} 
			 });
		  }
		  return value;
	  }
	  if(codeType){
		  var codeValues = getSelectCodeValues();
		  var codeValue = codeValues[codeType];
		  if(codeValue && $isValidValue(key)){
			  key = key.toString();
			  if(key.indexOf(',') > -1){
				  var vals = [];
				  $.each(key.split(','),function(i,item){
					 if($isValidValue(item)){
						 vals.push(getValue(codeValue,item.toString())); 
					 }
				  });
				  if(isDisplay){
					  return vals.join(',');
				  }
				  return vals;
			  }else{
				  return getValue(codeValue,key);
			  }
		  }
	  }
	  return '';
  }
  
  function mergeSelectCodeValues(codeType,codeTypeValues) {
	  if($.isPlainObject(codeType)){
		  $.each(codeType,function(k,v){
			  mergeSelectCodeValues(k,v);
		  });
	  }else if(codeType && $.isPlainObject(codeTypeValues) && !$.isEmptyObject(codeTypeValues)){
		  var codeValues = getSelectCodeValues();
		  var _codeTypeValues = codeValues[codeType];
		  if(!_codeTypeValues){
			  codeValues[codeType] = _codeTypeValues = {};
		  }
		  $.each(codeTypeValues,function(k,v){
			  _codeTypeValues[k] = v;
		  });
	  }
  }  
  
  function mergeSelectCodeValue(codeType, keyField, labelField, dataList) {
    if (codeType && keyField && labelField && $.isArray(dataList)) {
      var values = {};
      $.each(dataList, function (i, item) {
        values[item[keyField]] = item[labelField];
      });
      if (!$.isEmptyObject(values)) {
        var codeValues = {};
        codeValues[codeType] = values;
        $.extend(true, getSelectCodeValues(), codeValues);
      }
    }
  }

  /** ******** function authorization ********* */
  function getAuthorizedFunctions() {
    if (top.pageContext && top.pageContext.permissionCodes) {
      return top.pageContext.permissionCodes;
    } else if (!$isChildWin()) {
      return AUTHORIZED_FUNCTIONS;
    } else if (window.top.fmx && window.top.fmx.getAuthorizedFunctions) {
      return window.top.fmx.getAuthorizedFunctions();
    } else {
      return AUTHORIZED_FUNCTIONS;
    }
  };
  function checkFunctionAuthorization(funcCode) {
    return getAuthorizedFunctions().indexOf(funcCode) >= 0;
  };
  function textSelected() {
    if (document.selection) {
      var selection = document.selection;
      return selection.type == "Text";
    } else if (window.getSelection) {
      var selection = window.getSelection();
      if ('type' in selection) {
        return (selection.type == "Range");
      }
      return (selection.focusNode && selection.focusNode.nodeName == "#text" && !selection.isCollapsed);
    }
    return false;
  };
  function getI18nTitle(i18nRoot, i18nKey, defaultTitle) {
    if (defaultTitle) {
      return defaultTitle;
    }
    if (!i18nRoot) {
      return i18nKey;
    }
    var i18nRoots = i18nRoot.split(",");
    for (var i = 0; i < i18nRoots.length; i++) {
      var root = "i18n." + $.trim(i18nRoots[i]);
      if (eval(root) && eval(root)[i18nKey]) {
        return eval(root)[i18nKey];
      }
    }
    return i18nKey;
  }
  
  $.extend($.easyui,{
	  indexOfArray : function(array, prop, value){
		var strVal = value == undefined ? new String(prop).toString() : new String(value).toString();
		for(var i=0,len=array.length; i<len; i++){
			if (value == undefined){
				var val = array[i];
				if (val == prop || (typeof(val) != typeof(prop) && new String(val).toString() == strVal)){
					return i;
				}
			} else {
				var val = array[i][prop];
				if (val === value){return i;}
				else if(typeof(value) != typeof(val) && new String(val).toString() == strVal){
					return i;
				}
			}
		}
		return -1;
	  }
  });

  /**
   * 格式化工具
   **/
  var formatters = {
    formatNumber: function (num, format) {
      //if (!$.isNumeric(num) && (num == '' || num == null || num == undefined)) return num;
      return numeral(num).format(format || '0.00');
    },
    parseNumber: function (val) {
      return numeral().unformat(val);
    },
    formatCurrency: function (num, format) {
      //if (!$.isNumeric(num) && (num == '' || num == null || num == undefined)) return num;
      return numeral(num).format(format || '$0.00');
    },
    parseCurrency: function (val) {
      return numeral().unformat(val);
    },
    formatDate: function (date, format) {
      if (!date) return date;
      return moment(date).format(format || pageContext.defaultDateFormat || 'YYYY-MM-DD');
    },
    formatDatetime: function (date, format) {
      if (!format) format = pageContext.defaultDatetimeFormat || 'YYYY-MM-DD HH:mm:ss';
      return formatters.formatDate(date, format);
    },
    formatTime: function (date, format) {
      if (!format) format = pageContext.defaultDatetimeFormat || 'HH:mm:ss';
      return formatters.formatDate(date, format);
    },
    parseDate: function (val, format) {
      if (!val) return val;
      return moment(val, format || pageContext.defaultDateFormat || 'YYYY-MM-DD',true).toDate();
    }
  };

  //工具集
  var Utils = function () {
    var rbracket = /\[\]$/;
    function buildParams(prefix, obj, add) {
      var name;
      if ($.isArray(obj)) {
        // Serialize array item.
        $.each(obj, function (i, v) {
          if (rbracket.test(prefix)) {
            // Treat each array item as a scalar.
            add(prefix, v);
          } else {
            // Item is non-scalar (array or object), encode its numeric index.
            buildParams(
              prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
              v,
              add
            );
          }
        });
      } else if ($.type(obj) === "object") {
        for (name in obj) {
          buildParams((prefix ? prefix + "." : "") + name, obj[name], add);
        }
      } else {
        add(prefix, obj);
      }
    }
    function paramObject(a) {
      var prefix, result = {},
        add = function (key, valueOrFunction) {
          var value = $.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
          result[key] = value;
          //s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value == null ? "" : value );
        };
      if ($.isArray(a) || (a.jquery && !$.isPlainObject(a))) {
        $.each(a, function () {
          add(this.name, this.value);
        });
      } else if ($.isPlainObject(a)) {
        for (prefix in a) {
          buildParams(prefix, a[prefix], add);
        }
      }
      return result;
    }
    function convert(value) {
      if (value == undefined || value == null) return "";
      else if (typeof value == 'string') {
        return value;
      } else if ('toJSON' in value) {
        return value.toJSON();
      } else if ('toString' in value) {
        return value.toString();
      }
      return value + '';
    }
    function paramStr(obj) {
      var array = [];
      if ($.isPlainObject(obj)) {
        $.each(obj, function (k, v) {
          array.push(encodeURIComponent(k) + '=' + encodeURIComponent(convert(v)));
        });
      }
      return array.join('&');
    }

    var $maskitMsg;
    function maskit($it, bMask,noMsg) {
      if(!$it) return;
      //initial
      if(typeof $it == 'string'){
    	  var $el = $($it);
    	  if(!$el.size()) $el = $('#' + $it);
    	  $it = $el;
    	  if(!$it.size()) return
      }
      var _maskit = $it.data('_maskit');
      if (!_maskit){
    	  if($it.children().length){
    		  _maskit = $('<div class="maskit"></div>').hide().appendTo($it);
    	  }else{
    		  _maskit = $('<div class="maskit"></div>').hide().insertAfter($it);
    	  }
	      $it.data('_maskit',_maskit);
      }
      if(!noMsg && !$maskitMsg){
    	  var loadMsg = $.fn.datagrid.defaults.loadMsg || "正在处理，请稍待。。。";
    	  $maskitMsg = $("<div></div>").attr("class","maskit-msg").hide().text(loadMsg);
    	  $maskitMsg.appendTo("body");
      }
      if(bMask === undefined) return false;
      else if (!bMask) {
        _maskit.hide();
        if(!noMsg && $maskitMsg){
        	$maskitMsg.hide();
        }
        $it.find('.easyui-linkbutton').removeAttr('masking');
      } else {
        $it.find('.easyui-linkbutton').attr('masking', true);
        var offset = $it.offset();
        var zIndex = $it.css('z-index');
        if ($.isNumeric(zIndex)) zIndex = parseInt(zIndex) + 10;
        var height = $it.outerHeight()+"px";
        _maskit.css({
          zIndex: zIndex,
          left: offset.left,
          top: offset.top,
          width: $it.outerWidth(),
          "height": height,
          "line-height":height
        }).show();
        if(!noMsg){
        	$maskitMsg.show();
        }
      }
    }

    return {
      paramObject: paramObject,
      paramStr: paramStr,
      maskit: maskit,
      getUuid : function() {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
              return v.toString(16);
          });
      },
      parseJSON : function(json) {
    	  if(typeof json == 'string') return JSON.parse(json);
    	  return json;
      },
      getJquery : function(selector) {
    	  var $mi = $(selector);
			if($mi.length){
				return $mi;
			}else if(document.getElementById(selector)){
				return $('#'+selector);
			}else{
				return null;
			}    	  
      },
      htmlencode : function(html) {
    	   return $("<div></div>").text(html).html();     	  
      },
      htmldecode : function(html) {
    	  return $("<div></div>").html(html).text();   
      }
    }
  }

  $.extend(true, fmx, {
	    CommonExporter: CommonExporter,
	    CommonQueryService: CommonQueryService,
	    mergeSelectCodeValue: mergeSelectCodeValue,
	    mergeSelectCodeValues: mergeSelectCodeValues,
	    getSelectCodeOpts: getSelectCodeOpts,
	    getSelectCodeDatas: getSelectCodeDatas,
	    getSelectCodeValues: getSelectCodeValues,
	    getSelectCodeValue: getSelectCodeValue,
	    textSelected: textSelected,
	    checkFunctionAuthorization: checkFunctionAuthorization,
	    formatters: formatters,
	    utils: new Utils(),
        getI18nTitle: getI18nTitle
  });
})(jQuery, fmx);
//! moment.js
//! version : 2.15.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        var k;
        for (k in obj) {
            // even if its not own property I'd still call it non-empty
            return false;
        }
        return true;
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    function isUndefined(input) {
        return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (utils_hooks__hooks.deprecationHandler != null) {
                utils_hooks__hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (utils_hooks__hooks.deprecationHandler != null) {
            utils_hooks__hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;
    utils_hooks__hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
        if (mom.isValid()) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        if (!m) {
            return this._months;
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        if (!m) {
            return this._monthsShort;
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function units_month__handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = create_utc__createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return units_month__handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        //the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        if (!m) {
            return this._weekdays;
        }
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function day_of_week__handleStrictParse(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = create_utc__createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return day_of_week__handleStrictParse.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = create_utc__createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        ordinalParse: defaultOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    // treat as if there is no base config
                    deprecateSimple('parentLocaleUndefined',
                            'specified parentLocale is not defined yet. See http://momentjs.com/guides/#/warnings/parent-locale/');
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, parentConfig = baseConfig;
            // MERGE
            if (locales[name] != null) {
                parentConfig = locales[name]._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function locale_locales__listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(utils_hooks__hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (isDate(input)) {
            config._d = input;
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!valid__isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date(utils_hooks__hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = ((string || '').match(matcher) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : local__createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
            } else if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);

            if (tZone === 0) {
                this.utcOffset(0, true);
            } else {
                this.utcOffset(offsetFromString(matchOffset, this._i));
            }
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])                         * sign,
                h  : toInt(match[HOUR])                         * sign,
                m  : toInt(match[MINUTE])                       * sign,
                s  : toInt(match[SECOND])                       * sign,
                ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = utils_hooks__hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            delta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    utils_hooks__hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? utils_hooks__hooks.defaultFormatUtc : utils_hooks__hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIOROITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = stringGet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = stringSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    momentPrototype__proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var prototype__proto = Locale.prototype;

    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto.ordinal         = ordinal;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    prototype__proto.weekdaysRegex       =        weekdaysRegex;
    prototype__proto.weekdaysShortRegex  =        weekdaysShortRegex;
    prototype__proto.weekdaysMinRegex    =        weekdaysMinRegex;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = lists__get(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = locale_locales__getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return lists__get(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = lists__get(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function lists__listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function lists__listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function lists__listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function lists__listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes <= 1           && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   <= 1           && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    <= 1           && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  <= 1           && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   <= 1           && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function duration_humanize__getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.15.1';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeRounding = duration_humanize__getSetRelativeTimeRounding;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.calendarFormat        = getCalendarFormat;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
/*!
 * numeral.js
 * version : 1.5.3
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */
(function(){function a(a){this._value=a}function b(a,b,c,d){var e,f,g=Math.pow(10,b);return f=(c(a*g)/g).toFixed(b),d&&(e=new RegExp("0{1,"+d+"}$"),f=f.replace(e,"")),f}function c(a,b,c){var d;return d=b.indexOf("$")>-1?e(a,b,c):b.indexOf("%")>-1?f(a,b,c):b.indexOf(":")>-1?g(a,b):i(a._value,b,c)}function d(a,b){var c,d,e,f,g,i=b,j=["KB","MB","GB","TB","PB","EB","ZB","YB"],k=!1;if(b.indexOf(":")>-1)a._value=h(b);else if(b===q)a._value=0;else{for("."!==o[p].delimiters.decimal&&(b=b.replace(/\./g,"").replace(o[p].delimiters.decimal,".")),c=new RegExp("[^a-zA-Z]"+o[p].abbreviations.thousand+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),d=new RegExp("[^a-zA-Z]"+o[p].abbreviations.million+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),e=new RegExp("[^a-zA-Z]"+o[p].abbreviations.billion+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),f=new RegExp("[^a-zA-Z]"+o[p].abbreviations.trillion+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),g=0;g<=j.length&&!(k=b.indexOf(j[g])>-1?Math.pow(1024,g+1):!1);g++);a._value=(k?k:1)*(i.match(c)?Math.pow(10,3):1)*(i.match(d)?Math.pow(10,6):1)*(i.match(e)?Math.pow(10,9):1)*(i.match(f)?Math.pow(10,12):1)*(b.indexOf("%")>-1?.01:1)*((b.split("-").length+Math.min(b.split("(").length-1,b.split(")").length-1))%2?1:-1)*Number(b.replace(/[^0-9\.]+/g,"")),a._value=k?Math.ceil(a._value):a._value}return a._value}function e(a,b,c){var d,e,f=b.indexOf("$"),g=b.indexOf("("),h=b.indexOf("-"),j="";return b.indexOf(" $")>-1?(j=" ",b=b.replace(" $","")):b.indexOf("$ ")>-1?(j=" ",b=b.replace("$ ","")):b=b.replace("$",""),e=i(a._value,b,c),1>=f?e.indexOf("(")>-1||e.indexOf("-")>-1?(e=e.split(""),d=1,(g>f||h>f)&&(d=0),e.splice(d,0,o[p].currency.symbol+j),e=e.join("")):e=o[p].currency.symbol+j+e:e.indexOf(")")>-1?(e=e.split(""),e.splice(-1,0,j+o[p].currency.symbol),e=e.join("")):e=e+j+o[p].currency.symbol,e}function f(a,b,c){var d,e="",f=100*a._value;return b.indexOf(" %")>-1?(e=" ",b=b.replace(" %","")):b=b.replace("%",""),d=i(f,b,c),d.indexOf(")")>-1?(d=d.split(""),d.splice(-1,0,e+"%"),d=d.join("")):d=d+e+"%",d}function g(a){var b=Math.floor(a._value/60/60),c=Math.floor((a._value-60*b*60)/60),d=Math.round(a._value-60*b*60-60*c);return b+":"+(10>c?"0"+c:c)+":"+(10>d?"0"+d:d)}function h(a){var b=a.split(":"),c=0;return 3===b.length?(c+=60*Number(b[0])*60,c+=60*Number(b[1]),c+=Number(b[2])):2===b.length&&(c+=60*Number(b[0]),c+=Number(b[1])),Number(c)}function i(a,c,d){var e,f,g,h,i,j,k=!1,l=!1,m=!1,n="",r=!1,s=!1,t=!1,u=!1,v=!1,w="",x="",y=Math.abs(a),z=["B","KB","MB","GB","TB","PB","EB","ZB","YB"],A="",B=!1;if(0===a&&null!==q)return q;if(c.indexOf("(")>-1?(k=!0,c=c.slice(1,-1)):c.indexOf("+")>-1&&(l=!0,c=c.replace(/\+/g,"")),c.indexOf("a")>-1&&(r=c.indexOf("aK")>=0,s=c.indexOf("aM")>=0,t=c.indexOf("aB")>=0,u=c.indexOf("aT")>=0,v=r||s||t||u,c.indexOf(" a")>-1?(n=" ",c=c.replace(" a","")):c=c.replace("a",""),y>=Math.pow(10,12)&&!v||u?(n+=o[p].abbreviations.trillion,a/=Math.pow(10,12)):y<Math.pow(10,12)&&y>=Math.pow(10,9)&&!v||t?(n+=o[p].abbreviations.billion,a/=Math.pow(10,9)):y<Math.pow(10,9)&&y>=Math.pow(10,6)&&!v||s?(n+=o[p].abbreviations.million,a/=Math.pow(10,6)):(y<Math.pow(10,6)&&y>=Math.pow(10,3)&&!v||r)&&(n+=o[p].abbreviations.thousand,a/=Math.pow(10,3))),c.indexOf("b")>-1)for(c.indexOf(" b")>-1?(w=" ",c=c.replace(" b","")):c=c.replace("b",""),g=0;g<=z.length;g++)if(e=Math.pow(1024,g),f=Math.pow(1024,g+1),a>=e&&f>a){w+=z[g],e>0&&(a/=e);break}return c.indexOf("o")>-1&&(c.indexOf(" o")>-1?(x=" ",c=c.replace(" o","")):c=c.replace("o",""),x+=o[p].ordinal(a)),c.indexOf("[.]")>-1&&(m=!0,c=c.replace("[.]",".")),h=a.toString().split(".")[0],i=c.split(".")[1],j=c.indexOf(","),i?(i.indexOf("[")>-1?(i=i.replace("]",""),i=i.split("["),A=b(a,i[0].length+i[1].length,d,i[1].length)):A=b(a,i.length,d),h=A.split(".")[0],A=A.split(".")[1].length?o[p].delimiters.decimal+A.split(".")[1]:"",m&&0===Number(A.slice(1))&&(A="")):h=b(a,null,d),h.indexOf("-")>-1&&(h=h.slice(1),B=!0),j>-1&&(h=h.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1"+o[p].delimiters.thousands)),0===c.indexOf(".")&&(h=""),(k&&B?"(":"")+(!k&&B?"-":"")+(!B&&l?"+":"")+h+A+(x?x:"")+(n?n:"")+(w?w:"")+(k&&B?")":"")}function j(a,b){o[a]=b}function k(a){var b=a.toString().split(".");return b.length<2?1:Math.pow(10,b[1].length)}function l(){var a=Array.prototype.slice.call(arguments);return a.reduce(function(a,b){var c=k(a),d=k(b);return c>d?c:d},-1/0)}var m,n="1.5.3",o={},p="en",q=null,r="0,0",s="undefined"!=typeof module&&module.exports;m=function(b){return m.isNumeral(b)?b=b.value():0===b||"undefined"==typeof b?b=0:Number(b)||(b=m.fn.unformat(b)),new a(Number(b))},m.version=n,m.isNumeral=function(b){return b instanceof a},m.language=function(a,b){if(!a)return p;if(a&&!b){if(!o[a])throw new Error("Unknown language : "+a);p=a}return(b||!o[a])&&j(a,b),m},m.languageData=function(a){if(!a)return o[p];if(!o[a])throw new Error("Unknown language : "+a);return o[a]},m.language("en",{delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"$"}}),m.zeroFormat=function(a){q="string"==typeof a?a:null},m.defaultFormat=function(a){r="string"==typeof a?a:"0.0"},"function"!=typeof Array.prototype.reduce&&(Array.prototype.reduce=function(a,b){"use strict";if(null===this||"undefined"==typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!=typeof a)throw new TypeError(a+" is not a function");var c,d,e=this.length>>>0,f=!1;for(1<arguments.length&&(d=b,f=!0),c=0;e>c;++c)this.hasOwnProperty(c)&&(f?d=a(d,this[c],c,this):(d=this[c],f=!0));if(!f)throw new TypeError("Reduce of empty array with no initial value");return d}),m.fn=a.prototype={clone:function(){return m(this)},format:function(a,b){return c(this,a?a:r,void 0!==b?b:Math.round)},unformat:function(a){return"[object Number]"===Object.prototype.toString.call(a)?a:d(this,a?a:r)},value:function(){return this._value},valueOf:function(){return this._value},set:function(a){return this._value=Number(a),this},add:function(a){function b(a,b){return a+c*b}var c=l.call(null,this._value,a);return this._value=[this._value,a].reduce(b,0)/c,this},subtract:function(a){function b(a,b){return a-c*b}var c=l.call(null,this._value,a);return this._value=[a].reduce(b,this._value*c)/c,this},multiply:function(a){function b(a,b){var c=l(a,b);return a*c*b*c/(c*c)}return this._value=[this._value,a].reduce(b,1),this},divide:function(a){function b(a,b){var c=l(a,b);return a*c/(b*c)}return this._value=[this._value,a].reduce(b),this},difference:function(a){return Math.abs(m(this._value).subtract(a).value())}},s&&(module.exports=m),"undefined"==typeof ender&&(this.numeral=m),"function"==typeof define&&define.amd&&define([],function(){return m})}).call(this);


(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:" mln",billion:" mld",trillion:" bln"},ordinal:function(a){var b=a%100;return 0!==a&&1>=b||8===b||b>=20?"ste":"de"},currency:{symbol:"€ "}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("be-nl",a)})(); 

(function(){var a={delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百万",billion:"十亿",trillion:"兆"},ordinal:function(){return"."},currency:{symbol:"¥"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("chs",a)})();
 
(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tis.",million:"mil.",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"Kč"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("cs",a)})(); 

(function(){var a={delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mio",billion:"mia",trillion:"b"},ordinal:function(){return"."},currency:{symbol:"DKK"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("da-dk",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"CHF"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("de-ch",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("de",a)})(); 

(function(){var a={delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"£"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("en-gb",a)})(); 

(function(){var a={delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mm",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===b||3===b?"er":2===b?"do":7===b||0===b?"mo":8===b?"vo":9===b?"no":"to"},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("es",a)})(); 

(function(){var a={delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mm",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===b||3===b?"er":2===b?"do":7===b||0===b?"mo":8===b?"vo":9===b?"no":"to"},currency:{symbol:"$"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("es",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:" tuh",million:" mln",billion:" mld",trillion:" trl"},ordinal:function(){return"."},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("et",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"M",billion:"G",trillion:"T"},ordinal:function(){return"."},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("fi",a)})();

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"M",billion:"G",trillion:"T"},ordinal:function(a){return 1===a?"er":"e"},currency:{symbol:"$"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("fr-CA",a)})(); 

(function(){var a={delimiters:{thousands:"'",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){return 1===a?"er":"e"},currency:{symbol:"CHF"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("fr-ch",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){return 1===a?"er":"e"},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("fr",a)})();
 
(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"E",million:"M",billion:"Mrd",trillion:"T"},ordinal:function(){return"."},currency:{symbol:" Ft"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("hu",a)})(); 

(function(){var a={delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"mila",million:"mil",billion:"b",trillion:"t"},ordinal:function(){return"º"},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("it",a)})(); 

(function(){var a={delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百万",billion:"十億",trillion:"兆"},ordinal:function(){return"."},currency:{symbol:"¥"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("ja",a)})(); 

(function(){var a={delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mln",billion:"mrd",trillion:"bln"},ordinal:function(a){var b=a%100;return 0!==a&&1>=b||8===b||b>=20?"ste":"de"},currency:{symbol:"€ "}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("nl-nl",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tys.",million:"mln",billion:"mld",trillion:"bln"},ordinal:function(){return"."},currency:{symbol:"PLN"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("pl",a)})(); 

(function(){var a={delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"mil",million:"milhões",billion:"b",trillion:"t"},ordinal:function(){return"º"},currency:{symbol:"R$"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("pt-br",a)})(); 

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"тыс.",million:"млн",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"руб."}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("ru",a)})();

(function(){var a={delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tis.",million:"mil.",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"€"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("sk",a)})(); 

(function(){var a={delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"พัน",million:"ล้าน",billion:"พันล้าน",trillion:"ล้านล้าน"},ordinal:function(){return"."},currency:{symbol:"฿"}};"undefined"!=typeof window&&this.numeral&&this.numeral.language&&this.numeral.language("th",a)})(); 

(function (fmx) {
    // Store.js
    var store = {},
        win = (typeof window != 'undefined' ? window : global),
        doc = win.document,
        localStorageName = 'localStorage',
        scriptTag = 'script',
        storage

    store.disabled = false
    store.version = '1.3.20'
    store.set = function (key, value) { }
    store.get = function (key, defaultVal) { }
    store.has = function (key) { return store.get(key) !== undefined }
    store.remove = function (key) { }
    store.clear = function () { }
    store.transact = function (key, defaultVal, transactionFn) {
        if (transactionFn == null) {
            transactionFn = defaultVal
            defaultVal = null
        }
        if (defaultVal == null) {
            defaultVal = {}
        }
        var val = store.get(key, defaultVal)
        transactionFn(val)
        store.set(key, val)
    }
    store.getAll = function () {
        var ret = {}
        store.forEach(function (key, val) {
            ret[key] = val
        })
        return ret
    }
    store.forEach = function () { }
    store.serialize = function (value) {
        return JSON.stringify(value)
    }
    store.deserialize = function (value) {
        if (typeof value != 'string') { return undefined }
        try { return JSON.parse(value) }
        catch (e) { return value || undefined }
    }

    // Functions to encapsulate questionable FireFox 3.6.13 behavior
    // when about.config::dom.storage.enabled === false
    // See https://github.com/marcuswestin/store.js/issues#issue/13
    function isLocalStorageNameSupported() {
        try { return (localStorageName in win && win[localStorageName]) }
        catch (err) { return false }
    }

    if (isLocalStorageNameSupported()) {
        storage = win[localStorageName]
        store.set = function (key, val) {
            if (val === undefined) { return store.remove(key) }
            storage.setItem(key, store.serialize(val))
            return val
        }
        store.get = function (key, defaultVal) {
            var val = store.deserialize(storage.getItem(key))
            return (val === undefined ? defaultVal : val)
        }
        store.remove = function (key) { storage.removeItem(key) }
        store.clear = function () { storage.clear() }
        store.forEach = function (callback) {
            for (var i = 0; i < storage.length; i++) {
                var key = storage.key(i)
                callback(key, store.get(key))
            }
        }
    } else if (doc && doc.documentElement.addBehavior) {
        var storageOwner,
            storageContainer
        // Since #userData storage applies only to specific paths, we need to
        // somehow link our data to a specific path.  We choose /favicon.ico
        // as a pretty safe option, since all browsers already make a request to
        // this URL anyway and being a 404 will not hurt us here.  We wrap an
        // iframe pointing to the favicon in an ActiveXObject(htmlfile) object
        // (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
        // since the iframe access rules appear to allow direct access and
        // manipulation of the document element, even for a 404 page.  This
        // document can be used instead of the current document (which would
        // have been limited to the current path) to perform #userData storage.
        try {
            storageContainer = new ActiveXObject('htmlfile')
            storageContainer.open()
            storageContainer.write('<' + scriptTag + '>document.w=window</' + scriptTag + '><iframe src="/favicon.ico"></iframe>')
            storageContainer.close()
            storageOwner = storageContainer.w.frames[0].document
            storage = storageOwner.createElement('div')
        } catch (e) {
            // somehow ActiveXObject instantiation failed (perhaps some special
            // security settings or otherwse), fall back to per-path storage
            storage = doc.createElement('div')
            storageOwner = doc.body
        }
        var withIEStorage = function (storeFunction) {
            return function () {
                var args = Array.prototype.slice.call(arguments, 0)
                args.unshift(storage)
                // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
                // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
                storageOwner.appendChild(storage)
                storage.addBehavior('#default#userData')
                storage.load(localStorageName)
                var result = storeFunction.apply(store, args)
                storageOwner.removeChild(storage)
                return result
            }
        }

        // In IE7, keys cannot start with a digit or contain certain chars.
        // See https://github.com/marcuswestin/store.js/issues/40
        // See https://github.com/marcuswestin/store.js/issues/83
        var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
        var ieKeyFix = function (key) {
            return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
        }
        store.set = withIEStorage(function (storage, key, val) {
            key = ieKeyFix(key)
            if (val === undefined) { return store.remove(key) }
            storage.setAttribute(key, store.serialize(val))
            storage.save(localStorageName)
            return val
        })
        store.get = withIEStorage(function (storage, key, defaultVal) {
            key = ieKeyFix(key)
            var val = store.deserialize(storage.getAttribute(key))
            return (val === undefined ? defaultVal : val)
        })
        store.remove = withIEStorage(function (storage, key) {
            key = ieKeyFix(key)
            storage.removeAttribute(key)
            storage.save(localStorageName)
        })
        store.clear = withIEStorage(function (storage) {
            var attributes = storage.XMLDocument.documentElement.attributes
            storage.load(localStorageName)
            for (var i = attributes.length - 1; i >= 0; i--) {
                storage.removeAttribute(attributes[i].name)
            }
            storage.save(localStorageName)
        })
        store.forEach = withIEStorage(function (storage, callback) {
            var attributes = storage.XMLDocument.documentElement.attributes
            for (var i = 0, attr; attr = attributes[i]; ++i) {
                callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
            }
        })
    }

    try {
        var testKey = '__storejs__'
        store.set(testKey, testKey)
        if (store.get(testKey) != testKey) { store.disabled = true }
        store.remove(testKey)
    } catch (e) {
        store.disabled = true
    }
    store.enabled = !store.disabled

    fmx.store = store;
})(fmx);
;
(function($, fmx) {
	/** ********text box********** */
	$.extend($.fn.textbox.defaults, {
		validateOnCreate : false,
		trimValue : true
	});
	$.extend($.fn.textbox.methods, {
		_setText : $.fn.textbox.methods.setText,
		setText : function(jq, value) {
			return jq.each(function() {
				var opts = $(this).textbox('options');
				var input = $(this).textbox('textbox');
				value = value == undefined ? '' : String(value);

				if ($(this).textbox('getText') != value) {
					input.val(value);
				}
				opts.value = value;
				if (!input.is(':focus')) {
					if (value) {
						input.removeClass('textbox-prompt');
					} else {
						input.val(opts.prompt).addClass('textbox-prompt');
					}
				}
				// 有值的时候才执行校验
				if (value)
					$(this).textbox('validate');
			});
		},
		_setValue : $.fn.textbox.methods.setValue,
		setValue : function(jq, value) {
			return jq.each(function() {
				var $jq = $(this);
				var state = $jq.data("textbox");
				if(value && $.isFunction(value.trim) && state && state.options.trimValue){
					value = value.trim();
				}
				$jq.textbox("_setValue",value);
			});
		}
	});
})(jQuery, fmx);
;(function($){
	var _parseOpts = $.fn.validatebox.parseOptions,
	    _validatebox = $.fn.validatebox,
	    _focusEventHandler = $.fn.validatebox.defaults.events.focus,
	    _blurEventHandler = $.fn.validatebox.defaults.events.blur;
	
	$.fn.validatebox.parseOptions = function(target) {
		var opts = _parseOpts(target);
		var clsName = target.getAttribute('validateClassName');
		if(clsName) {
			opts.validateClassName = clsName;
		}
		if(!opts.maxLength){
			opts.maxLength = target.getAttribute('maxlength');
		}
		return opts;		
	}
	$.extend($.fn.validatebox.defaults,{
		//默认的类名
		validateClassName : 'fmx-validate-required',
		validateOnCreate : false,
		validateUseTextboxValue:true,
		val : function(target) {
			var $el = $(target),opts = $el.data('validatebox').options;
			if(opts && opts.validateUseTextboxValue){
				var $next = $el.next();
				if($next.hasClass("textbox-value")){
					return $next.val();
				}
			}
			return $el.val();
		}
	});
	//修改默认焦点事件,如果控件没有输入,则不进行校验
	$.fn.validatebox.defaults.events.focus = function(e) {
		var target = e.data.target;
		var state = $.data(target, 'validatebox');
		var opts = state.options;
		var val = opts.val(target);
		if(!state.message && (val == null || val == undefined || val == '')){
			return;
		}
		return _focusEventHandler(e);
	}
	$.fn.validatebox.defaults.events.blur = function(e) {
		var target = e.data.target;
		var state = $.data(target, 'validatebox');
		var opts = state.options;
		var val = opts.val(target);
		if(!state.message && (val == null || val == undefined || val == '')){
			return;
		}		
		return _blurEventHandler(e);
	}
	$.fn.validatebox.defaults.rules.minLength = {
			validator: function(value, param){
				var len = $.trim(value).length;
				return len >= param[0];
			},
			message: 'Please enter a value a least {0}.'			
	}
	
	$.fn.validatebox.defaults.rules.maxLength = {
			validator: function(value, param){
				var len = $.trim(value).length;
				return len <= param[0];
			},
			message: 'Please enter a value a less than {0}.'			
	}	
	
	$.fn.validatebox = function(options, param) {
		if(typeof options == 'string'){
			return _validatebox.call(this,options,param);
		}
		var val = _validatebox.call(this,options,param);
		this.each(function(){
			var opts = $.data(this, 'validatebox').options,$jq = $(this);
			if(opts.validateClassName && !$jq.hasClass(opts.validateClassName) && opts.required){
				$jq.addClass(opts.validateClassName);
			}
			if(opts.maxLength){
				var maxLenVt = 'maxLength['+opts.maxLength+']';
				var validType = opts.validType;
				if($.isArray(validType)){
					validType.push(maxLenVt);
				}else if(typeof validType == 'string'){
					opts.validType = [validType,maxLenVt]
				}else{
					opts.validType = maxLenVt;
				}
			}				
		});
		return val;
	}
	$.extend($.fn.validatebox,_validatebox);
})(jQuery);
;(function ($, fmx) {
    /** ******** combo ********* */
	var _combo = $.fn.combo;
	$.fn.combo = function(options,params) {
		if(typeof options == 'string') {
			return _combo.apply(this,[options,params]);
		}
		return this.each(function() {
			var $that = $(this);
			_combo.call($that,options);
			var state = $.data(this,"combo");
			var panelState = state.panel.data("panel");
			var _onCloseFn = panelState.options.onClose;
			panelState.options.onClose = function() {
				if(_onCloseFn) _onCloseFn.call(this);
				doValidateInputText($that);
			}
		});
	}
	$.extend($.fn.combo,_combo);
	
    $.fn.combo._parseOptions = $.fn.combo.parseOptions;
    // fix bug in easyui-1.2.4, attr 'multiple' value is 'multiple', not 'true'
    $.fn.combo.parseOptions = function (target) {
        var options = $.fn.combo._parseOptions(target);
        var t = $(target);
        var temp = t.attr("multiple");
        if((temp ? (temp == "true" || temp == true || temp == "multiple"): undefined)){
        	options['multiple'] = true;
        }
        temp = t.attr('limitToList');
        if(temp) {
        	options['limitToList'] = temp == 'true' || temp == true;
        }
        return options;
    };
    function doValidateInputText($target) {
    	var comboState = $target.data("combo");
    	if(!comboState.doValidating && comboState.options.limitToList && comboState.options.keyHandler.enter){
    		comboState.doValidating = true
    		comboState.options.keyHandler.enter.call($target[0]);
    		comboState.doValidating = false;
    	}
    	var comboGridState = $target.data("combogrid");
    	if(comboGridState){
			var opts = comboGridState.grid.data("datagrid").options;
			if(opts.queryParams && opts.queryParams.q){
				opts.queryParams.q=undefined;
			}
    	}
    }
    function getComboValues(target) {
        var state = $.data(target, 'combo');
        if(!state) return ($(target).val() || '').split(opts.separator);
        var opts = state.options;
        var combo = state.combo;
        var values = combo.find('.textbox-value').val();
        if(values){
        	values = values.split(opts.separator);
        }else{
        	values = [];
        }
        var opts = state.options;
        var cbb = $.data(target,'combobox');
        if(cbb && cbb.options.emptyItemEnable && values.length == 0){
        	return [cbb.options.emptyItemValue];
        }
        return values;
    }
    function setComboValues(target, values) {
        var state = $.data(target, 'combo');
        if(!state) {
            var el = $(target);
            var val = (values && $.isArray(values)) ? values.join(',') : values;
            el.val(val);
            return;
        }
        var opts = state.options;
        var combo = state.combo;
        if (!$.isArray(values)) { 
        	values = (typeof values == 'string') ? values.split(opts.separator) : [values]; 
        }

        var oldValues = getComboValues(target);
        combo.find('.textbox-value').remove();
        var name = $(target).attr('textboxName') || '';
        var input = $('<input type="hidden" class="textbox-value">').appendTo(combo);
        input.attr('name', name);
        if (opts.disabled) {
            input.attr('disabled', 'disabled');
        }
        input.val(values.join(opts.separator));

        var changed = (function () {
            if (oldValues.length != values.length) { return true; }
            var a1 = $.extend(true, [], oldValues);
            var a2 = $.extend(true, [], values);
            a1.sort();
            a2.sort();
            for (var i = 0; i < a1.length; i++) {
                if (a1[i] != a2[i]) { return true; }
            }
            return false;
        })();

        if (changed) {
            if (opts.multiple) {
                opts.onChange.call(target, values, oldValues);
            } else {
                opts.onChange.call(target, values[0], oldValues[0]);
            }
            $(target).closest('form').trigger('_change', [target]);
        }
    }
    
    /** 
     * The key event handler on input box
     */
    function inputEventHandler(e){
      if (e.ctrlKey) {
    	  return _defaultInputEvent(e);
      }      
      var target = e.data.target;
      var t = $(target);
      var state = t.data('combo');
      var opts = t.combo('options');
      state.panel.panel('options').comboTarget = target;
      
      switch(e.keyCode){
      case 38:  // up
        e.preventDefault();
        t.combo('showPanel');
        opts.keyHandler.up.call(target, e);
        break;
      case 40:  // down
        e.preventDefault();
        t.combo('showPanel');        
        opts.keyHandler.down.call(target, e);
        break;
      case 37:  // left
        opts.keyHandler.left.call(target, e);
        break;
      case 39:  // right
        opts.keyHandler.right.call(target, e);
        break;
      case 13:  // enter
        //e.preventDefault();
        opts.keyHandler.enter.call(target, e);
      default:
         return _defaultInputEvent(e);
        //return false;
//      case 9:   // tab
//      case 27:  // esc
//        t.combo('hidePanel');
//        break;
      }
    }
    var _defaultInputEvent = $.fn.combo.defaults.inputEvents.keydown;
    $.fn.combo.defaults.inputEvents.keydown = inputEventHandler;
    $.fn.combobox.defaults.inputEvents.keydown = inputEventHandler;
    $.fn.combogrid.defaults.inputEvents.keydown = inputEventHandler;
    
    $.extend($.fn.combo.methods, {
        _getValue: $.fn.combo.methods.getValue,

        getValue: function (jq) {
            var $combo = $(jq[0]);
            return $combo.combo("getValues").join(",");
        },
        setValue: function (jq, value) {
            return jq.combo("setValues", (value === null || value === undefined) ? '' : value);
        },
        setValues: function (jq, values) {
            return jq.each(function () {
                setComboValues(this, values);
            });
        },
        getValues: function (jq) {
            return getComboValues(jq[0]);
        }
    });
})(jQuery, fmx);
;
(function($, fmx) {
//  
//  var nodeIndex = 1;
//  var defaultView = {
//      render: function(target, ul, data) {
//        var state = $.data(target, 'tree');
//        var opts = state.options;
//        var pnode = $(ul).prev('.tree-node');
//        var pdata = pnode.length ? $(target).tree('getNode', pnode[0]) : null;
//        var depth = pnode.find('span.tree-indent, span.tree-hit').length;
//        var cc = getTreeData.call(this, depth, data);
//        $(ul).append(cc.join(''));
//        
//        function getTreeData(depth, children){
//          var cc = [];
//          for(var i=0; i<children.length; i++){
//            var item = children[i];
//            if (item.state != 'open' && item.state != 'closed'){
//              item.state = 'open';
//            }
//            item.domId = '_easyui_tree_' + nodeIndex++;
//            
//            cc.push('<li>');
//            cc.push('<div id="' + item.domId + '" class="tree-node">');
//            for(var j=0; j<depth; j++){
//              cc.push('<span class="tree-indent"></span>');
//            }
//            if (item.state == 'closed'){
//              cc.push('<span class="tree-hit tree-collapsed"></span>');
//              cc.push('<span class="tree-icon ' + (item.iconCls?item.iconCls:'') + '"></span>');
//            } else {
//              if (item.children && item.children.length){
//                cc.push('<span class="tree-hit tree-expanded"></span>');
//                cc.push('<span class="tree-icon ' + (item.iconCls?item.iconCls:'') + '"></span>');
//              } else {
//                cc.push('<span class="tree-indent"></span>');
//                cc.push('<span class="tree-icon ' + (item.iconCls?item.iconCls:'') + '"></span>');
//              }
//            }
//            if (this.hasCheckbox(target, item)){
//              var flag = 0;
//              if (pdata && pdata.checkState=='checked' && opts.cascadeCheck){
//                flag = 1;
//                item.checked = true;
//              } else if (item.checked){
//                $.easyui.addArrayItem(state.tmpIds, item.domId);
//              }
//              item.checkState = flag ? 'checked' : 'unchecked';
//              cc.push('<span class="tree-checkbox tree-checkbox' + flag + '"></span>');
//            } else {
//              item.checkState = undefined;
//              item.checked = undefined;
//            }
//            cc.push('<span class="tree-title">' + opts.formatter.call(target, item) + '</span>');
//            cc.push('</div>');
//            
//            if (item.children && item.children.length){
//              var tmp = getTreeData.call(this, depth+1, item.children);
//              cc.push('<ul style="display:' + (item.state=='closed'?'none':'block') + '">');
//              cc = cc.concat(tmp);
//              cc.push('</ul>');
//            }
//            cc.push('</li>');
//          }
//          return cc;
//        }
//      }
//  };
	/** ******** tree ********* */
	var treeDefaults = {
		loadDataErrorMsg : "Error loading data.",
		//view : $.extend($.fn.tree.defaults.view,defaultView),
		_loader : $.fn.tree.defaults.loader,
		loader : function(param, success, error) {
			var $tree = $(this), options = $tree.tree("options");
			if (!options.query) return $.fn.tree.defaults._loader.call(this, param, success, error);
			var queryFields = [];
			if (options.queryFields) {
				queryFields = queryFields.concat(options.queryFields);
			}
			if (options.commonQueryFields) {
				queryFields = queryFields.concat(options.commonQueryFields);
			}
			if (param && param.queryFields) {
				if ($.isArray(param.queryFields)) {
					queryFields = queryFields.concat(param.queryFields);
				} else if ($.isPlainObject(param.queryFields)) {
					queryFields.push(param.queryFields);
				}
			}
			if (param.id) {
				parentQueryField = {
					fieldName : options.parentField || "parentId",
					fieldStringValue : param.id
				};
				queryFields.push(parentQueryField);
			}
			var queryInfo = {
				query : options.query,
				orderBy : options.orderBy,
				queryFields : queryFields
			};
			options.queryInfo = queryInfo;
			fmx.CommonQueryService.query(queryInfo, success, error);
		},

		// query result
		loadFilter : function(data) {
			var $tree = $(this), options = $tree.tree("options");
			if (!options.query) return data;
			if (data['code'] < 0) {
				var message = data.errors || data.message;
				$.messager.alert("Message", $.fn.tree.defaults.loadDataErrorMsg + message, "warning");
				return null;
			}

			var idField = options.idField || "id";
			var textField = options.textField || "text";
			var parentField = options.parentField || "parentId";
			var checkedField = options.checkedField || "checked";
			var stateField = options.stateField || "state";
			var iconClsField = options.iconClsField || "iconCls";
			var dataList = $.isArray(data) ? null : (data.data ? data.data.dataList : data);
			if (dataList) {
				// returned from commonquery
				var allNodeMap = {};
				var allNodeArray = [];
				$.each(dataList, function(index, dataItem) {
					if(dataItem['attributes']){
						dataItem = dataItem.attributes.data;
					}
					var node = {
						id : dataItem[idField],
						text : dataItem[textField],
						checked : dataItem[checkedField],
						state : dataItem[stateField],
						iconCls : dataItem[iconClsField],
						attributes : {
							data : dataItem
						}
					};
					if ($tree.data("collapsedIds") && $tree.data("collapsedIds").indexOf(node.id) >= 0) {
						node.state = "closed";
					}
					allNodeMap[node.id] = node;
					allNodeArray.push(node);
				});
				var result = [];
				$.each(allNodeArray, function(index, node) {
					if (node.attributes.data[parentField]) {
						var parent = allNodeMap[node.attributes.data[parentField]];
						if (parent) {
							if (!parent.children) {
								parent.children = [];
							}
							parent.children.push(node);
						} else {
							result.push(node);
						}
					} else {
						result.push(node);
					}
				});
				return result;
			}
			if ($.isArray(data)) {
				function bindAttributes(node) {
					$.extend(true, node, {
						id : node.id || node[idField],
						text : node.text || node[textField],
						checked : node.checked || node[checkedField],
						state : node.state || node[stateField],
						iconCls : node.iconCls || node[iconClsField],
						attributes : {
							data : node.attributes && node.attributes.data ? node.attributes.data : node
						}
					});
					if ($tree.data("collapsedIds") && $tree.data("collapsedIds").indexOf(node.id) >= 0) {
						node.state = "closed";
					}
					//$.extend(true, node.attributes, node.attributes.data.attributes);
					if (node.children) {
						$.each(node.children, function(index, child) {
							bindAttributes(child);
						});
					}
				}
				;
				$.each(data, function(index, node) {
					bindAttributes(node);
				});
			}
			return data;
		},

		onLoadSuccess : function(node, data) {
			var $tree = $(this);
			var options = $tree.tree("options");
			$tree.data("deletedData", []);
			function handleNode(node) {
				if (node.attributes) {
					node.attributes.oldJsonValue = JSON.stringify(node.attributes.data);
				}
				if (options.titleField) {
					$(node.target).attr("title", node.attributes.data[options.titleField]);
				}
				var data = $tree.tree("getData", node.target);
				if (data && data.children) {
					$.each(data.children, function(index, child) {
						handleNode(child);
					});
				}
			}
			$.each($tree.tree("getRoots"), function(index, root) {
				handleNode(root);
			});
			var previousSelectedId = $tree.data("selectedId");
			if (previousSelectedId) {
				var previousSelectedNode = $tree.tree("find", previousSelectedId);
				if (previousSelectedNode) {
					$tree.tree("select", previousSelectedNode.target);
					return;
				}
			}
			var previousSelectedPosition = $tree.data("selectedPosition");
			if (previousSelectedPosition != undefined) {
				$tree.tree("select", $tree.find(".tree-node:visible")[previousSelectedPosition]);
			}
		},

		onLoadError : function( ) {
			$.messager.confirm("Message", $.fn.datagrid.defaults.reLoginMsg, function(b) {
				if (b) {
					window.location.reload();
				}
			});
		}

	};

	$.extend($.fn.tree.defaults, treeDefaults);

	$.extend($.fn.tree.methods, {

		_reload : $.fn.tree.methods.reload,

		reload : function(jq, target) {
			return jq.each(function( ) {
				var $tree = $(this);
				// rememeber collapse status
				var collapsedIds = [];
				$.each($tree.find(".tree-collapsed").parent(), function(index, node) {
					collapsedIds.push($(node).attr("node-id"));
				});
				$tree.data("collapsedIds", collapsedIds);
				// remember selectd node
				var selected = $tree.tree("getSelected");
				if (selected) {
					$tree.data("selectedId", selected.id);
					$tree.data("selectedPosition", $tree.find(".tree-node:visible").index(selected.target));
				}
				$tree.tree("_reload", target);
			});
		},

		// commonQuery
		commonQuery : function(jq, queryInfo) {
			return jq.each(function( ) {
				var $tree = $(this);
				var options = $tree.tree("options");
				options.commonQueryFields = null;
				if (queryInfo) {
					if (queryInfo.queryFields) {
						options.commonQueryFields = queryInfo.queryFields;
					}
					if (queryInfo.query) {
						options.query = queryInfo.query;
					}
					if (queryInfo.orderBy) {
						options.orderBy = queryInfo.orderBy;
					}
				}
				$tree.tree("reload");
			});
		},

		setQueryFields : function(jq, queryFields) {
			return jq.each(function( ) {
				$(this).tree("options").queryFields = queryFields;
			});
		},

		getChanges : function(jq) {
			var $tree = $(jq[0]);
			var options = $tree.tree("options");
			var idField = options.idField;
			var parentField = options.parentField;
			var seqField = options.seqField;
			var textField = options.textField;
			var data = [];
			function addData(node, parentId, seq) {
				var nodeData = node.attributes.data;
				delete nodeData['rowState'];
				nodeData[idField] = node.id;
				nodeData[parentField] = parentId;
				nodeData.checked = node.checked;
				nodeData.iconCls = node.iconCls;
				nodeData[textField] = node.text;
				if (seqField) {
					nodeData[seqField] = seq;
				}
				var oldJsonValue = node.attributes.oldJsonValue;
				if (oldJsonValue) {
					if (oldJsonValue != JSON.stringify(nodeData)) {
						nodeData.rowState = "Modified";
						data.push(nodeData);
					}
				} else {
					if (nodeData.rowState == "Deleted") {
						nodeData.rowState = "Modified";
					} else {
						nodeData.rowState = "Added";
					}
					data.push(nodeData);
				}
				$.each($tree.tree("getData", node.target).children, function(index, child) {
					addData(child, nodeData[idField], index);
				});
			}
			$.each($tree.tree("getRoots"), function(index, root) {
				addData(root, "0", index);
			});
			$.each($tree.data("deletedData"), function(index, deletedData) {
				if (data.indexOf(deletedData) == -1 && !$tree.tree("find", deletedData[idField])) {
					deletedData.rowState = "Deleted";
					data.push(deletedData);
				}
			});
			return data;
		},

		getHalfChecked : function(jq) {
			var target = jq[0];
			var checkedNodes = [];
			$(target).find('.tree-checkbox2').each(function( ) {
				var node = $(this).parent();
				checkedNodes.push($(target).tree("getNode", node[0]));
			});
			return checkedNodes;
		},

		appendAfterSelected : function(jq, node) {
			return jq.each(function( ) {
				var $tree = $(this);
				$.extend(true, node, {
					id : node.id || $.now(),
					text : node.text || "",
					attributes : {
						data : node
					}
				});
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) {
					$tree.tree("append", {
						data : [ node ]
					});
				} else {
					$tree.tree("insert", {
						after : selectedNode.target,
						data : node
					});
				}
				node = $tree.tree("find", node.id);
				$tree.tree("select", node.target);
			});
		},

		insertBeforeSelected : function(jq, node) {
			return jq.each(function( ) {
				var $tree = $(this);
				$.extend(true, node, {
					id : node.id || $.now(),
					text : node.text || "",
					attributes : {
						data : node
					}
				});
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				$tree.tree("insert", {
					before : selectedNode.target,
					data : node
				});
				node = $tree.tree("find", node.id);
				$tree.tree("select", node.target);
			});
		},

		addChildToSelected : function(jq, node) {
			return jq.each(function( ) {
				var $tree = $(this);
				$.extend(true, node, {
					id : node.id || $.now(),
					text : node.text || "",
					attributes : {
						data : node
					}
				});
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				$tree.tree("append", {
					parent : selectedNode.target,
					data : [ node ]
				});
				node = $tree.tree("find", node.id);
				$tree.tree("select", node.target);
			});
		},

		_remove : $.fn.tree.methods.remove,

		remove : function(jq, target) {
			jq.each(function( ) {
				var $tree = $(this),opts = $tree.tree('options');
				if(!opts.query) return;
				var deletedData = $tree.data("deletedData");
				function addDeletedData(node) {
					var nodeData = node.attributes.data;
					deletedData.push(nodeData);
					var children = $tree.tree("getData", node.target).children;
					if($.isArray(children)){
						$.each(children, function(index, child) {
							addDeletedData(child);
						});
					}
				}
				addDeletedData($tree.tree("getData", target));
			});
			return this._remove(jq, target);
		},

		removeSelected : function(jq) {
			return jq.each(function( ) {
				var $tree = $(this);
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				var $next = $(selectedNode.target).parent().next();
				if ($next.size() > 0) {
					$tree.tree("select", $next.children().get(0));
				} else {
					var $prev = $(selectedNode.target).parent().prev();
					if ($prev.size() > 0) {
						$tree.tree("select", $prev.children().get(0));
					} else {
						var parentNode = $tree.tree("getParent", selectedNode.target);
						if (parentNode != null) {
							$tree.tree("select", parentNode.target);
						}
					}
				}
				$tree.tree("remove", selectedNode.target);
			});
		},

		moveSelectedUp : function(jq) {
			return jq.each(function( ) {
				var $tree = $(this);
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				var $prev = $(selectedNode.target).parent().prev();
				if ($prev.size() > 0) {
					$tree.tree("insert", {
						before : $prev.children().get(0),
						data : $tree.tree("pop", selectedNode.target)
					});
					$tree.tree("select", $tree.tree("find", selectedNode.id).target);
				}
			});
		},

		moveSelectedDown : function(jq) {
			return jq.each(function( ) {
				var $tree = $(this);
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				var $next = $(selectedNode.target).parent().next();
				if ($next.size() > 0) {
					$tree.tree("insert", {
						after : $next.children().get(0),
						data : $tree.tree("pop", selectedNode.target)
					});
					$tree.tree("select", $tree.tree("find", selectedNode.id).target);
				}
			});
		},

		moveSelectedLeft : function(jq) {
			return jq.each(function( ) {
				var $tree = $(this);
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				var parentNode = $tree.tree("getParent", selectedNode.target);
				if (parentNode != null) {
					$tree.tree("insert", {
						after : parentNode.target,
						data : $tree.tree("pop", selectedNode.target)
					});
					$tree.tree("select", $tree.tree("find", selectedNode.id).target);
				}
			});
		},

		moveSelectedRight : function(jq) {
			return jq.each(function( ) {
				var $tree = $(this);
				var selectedNode = $tree.tree("getSelected");
				if (selectedNode == null) { return; }
				var $prev = $(selectedNode.target).parent().prev();
				if ($prev.size() > 0) {
					$tree.tree("append", {
						parent : $prev.children().get(0),
						data : [ $tree.tree("pop", selectedNode.target) ]
					});
					$tree.tree("select", $tree.tree("find", selectedNode.id).target);
				}
			});
		},

		reloadAndSelect : function(jq, id) {
			return jq.each(function( ) {
				var $tree = $(this);
				$tree.data("selectedId", id);
				$tree.tree("reload");
			});
		}

	});

	// init trees
	function initTrees(jq, findings) {
		jq.each(function( ) {
			var $tree = $(this);
			var options = $.extend({}, $.fn.tree.parseOptions(this), {
				idField : $tree.attr("idField"),
				textField : $tree.attr("textField"),
				parentField : $tree.attr("parentField"),
				seqField : $tree.attr("seqField"),
				titleField : $tree.attr("titleField"),
				checkedField : $tree.attr("checkedField"),
				stateField : $tree.attr("stateField"),
				iconClsField : $tree.attr("iconClsField"),
				query : $tree.attr("query"),
				orderBy: $tree.attr("orderBy")
			});
			// if use static data, do not query
			if ($tree.children().size() > 0) {
				options.query = null;
			}
			if ($tree.attr("queryFields")) {
				options.queryFields = eval($tree.attr("queryFields"));
			}
			$tree.tree(options);
		});
		delete findings.tree;
	}
	$($.parser).on("onBefore",function(e,ctx,findings){
	  initTrees(findings.tree,findings);
	});
})(jQuery, fmx);
/**
 * jQuery EasyUI 1.5
 * 
 * Copyright (c) 2009-2016 www.jeasyui.com. All rights reserved.
 *
 * Licensed under the commercial license: http://www.jeasyui.com/license_commercial.php
 * To use it on other terms please contact us: info@jeasyui.com
 *
 */
/**
 * datagrid - jQuery EasyUI
 * 
 * Dependencies:
 *  panel
 * 	resizable
 * 	linkbutton
 * 	pagination
 * 
 */
; (function ($, fmx) {
	function getStoreKey(opts) {
		return document.location.pathname +'.'+opts.id;
	}
	function restoreColumns(opts){
		if(!opts.id || !opts.storeColumns) return;
		var storeInfo = fmx.utils.parseJSON(fmx.store.get(getStoreKey(opts)));
		if(!storeInfo || $.isEmptyObject(storeInfo)) return;
		//storeColumnsWithWidth
		function doCompare(col1,col2,c1,c2){
			var idx1 = 1000,idx2 = 1000;
			if(c1){
				if(opts.storeColumnsWithWidth){
					col1.width = c1.width;
				}
				if(c1.hidden) col1.hidden = true;
				idx1 = c1.index;
			}
			if(c2){
				if(opts.storeColumnsWithWidth){
					col2.width = c2.width;
				}
				if(c2.hidden) col2.hidden = true;
				idx2 = c2.index;
			}				
			if(idx1 < idx2) return -1;
			else if(idx1 == idx2) return 0;
			else return 1;
		}		
		if(!$.isEmptyObject(storeInfo.columns) && $.isArray(opts.columns) && opts.columns.length > 0){
			var pos = opts.columns.length - 1;
			$.each(opts.columns[pos],function(){
				var col = storeInfo.columns[this.field];
				if(col && col.hidden){
					this.hidden = true;
				}
			});
//			opts.columns[0].sort(function(col1,col2){
//				var c1 = storeInfo.columns[col1.field];
//				var c2 = storeInfo.columns[col2.field];
//				return doCompare(col1,col2,c1,c2);
//			});
		}
		if(!$.isEmptyObject(storeInfo.frozenColumns) && $.isArray(opts.frozenColumns) && opts.frozenColumns.length > 0){
			var pos = opts.frozenColumns.length - 1;
			$.each(opts.frozenColumns[pos],function(){
				var col = storeInfo.frozenColumns[this.field];
				if(col && col.hidden){
					this.hidden = true;
				}
			});			
//			opts.frozenColumns[0].sort(function(col1,col2){
//				var c1 = storeInfo.frozenColumns[col1.field];
//				var c2 = storeInfo.frozenColumns[col2.field];		
//				return doCompare(col1,col2,c1,c2);				
//			});
		}		
	}
	function storeColumnsInfo(target) {
		var opts = $.data(target,"datagrid").options;
		if(!opts.id || !opts.storeColumns || !opts._initialized) {
			return;
		}
		var cols = {},frozenColumns={};
		if($.isArray(opts.columns) && opts.columns.length > 0){
			var pos = opts.columns.length - 1;
			$.each(opts.columns[pos],function(i,col){
				if(col.field == 'ck') return;
				var column = {
					width : col.width,
					index : i
				};
				if(col.hidden) {
					column.hidden = col.hidden
				}
				cols[col.field] = column;
			});
		}
		if($.isArray(opts.frozenColumns) && opts.frozenColumns.length > 0 && $.isArray(opts.frozenColumns[0])){
			var pos = opts.frozenColumns.length - 1;
			$.each(opts.frozenColumns[pos],function(i,col){
				if(col.field == 'ck') return;
				var column = {
					width : col.width,
					index : i
				};
				if(col.hidden) {
					column.hidden = col.hidden
				}
				frozenColumns[col.field] = column;
			});
		}
		var key = getStoreKey(opts);
		fmx.store.set(key,{columns : cols,frozenColumns : frozenColumns});
	}
	
	/**
	 * wrap and return the grid object, fields and columns
	 */
	function wrapGrid(target, rownumbers, opts) {
		function getColumns() {
			var frozenColumns = [];
			var columns = [];
			var str;
			$(target).children('thead').each(function () {
				var opt = $.parser.parseOptions(this, [{ frozen: 'boolean' }]);
				$(this).find('tr').each(function () {
					var cols = [];
					$(this).find('th').each(function () {
						var th = $(this);
						var col = $.extend({}, $.parser.parseOptions(this, [
							'id', 'field', 'align','valign','halign','orderBy', 'order', 'width', 'format','formatter','exportFormatter','exportFormat',
							{ sortable: 'boolean', checkbox: 'boolean', resizable: 'boolean', fixed: 'boolean' },
							{ rowspan: 'number', colspan: 'number' }
						]), {
								title: (th.html() || undefined),
								hidden: (th.attr('hidden') ? true : undefined),
								//formatter: (th.attr('formatter') ? eval(th.attr('formatter')) : undefined),
								styler: (th.attr('styler') ? eval(th.attr('styler')) : undefined),
								sorter: (th.attr('sorter') ? eval(th.attr('sorter')) : undefined)
							});
						if(col.i18n) {
							col.title = $.fn.i18n.methods.getMessage(col.i18n);
						}
						if ((str = th.attr('formatter'))) {
							if ((str in opts.formatters)) {
								col.formatter = opts.formatters[str];
							} else {
								col.formatter = eval(str);
							}
						}
						if (col.width && String(col.width).indexOf('%') == -1) {
							col.width = parseInt(col.width);
						}
						if ((str = th.attr('codetype'))) {
							col.codeType = str;
						}

						if ((str = th.attr('editor'))) {
							var s = $.trim(str);
							if (s.substr(0, 1) == '{') {
								col.editor = eval('(' + s + ')');
							} else {
								col.editor = s;
							}
							if (th.attr("required")) {
								if (typeof col.editor == "string") {
									col.editor = {
										type: col.editor
									};
								}
								if (col.editor.type == "text") {
									col.editor.type = "validatebox";
								}
								if (!col.editor.options) {
									col.editor.options = {};
								}
								col.editor.options.required = true;
							}
							if(col.codeType){
							   if (typeof col.editor == "string") {
				                  col.editor = {
				                    type: col.editor
				                  };
				                }
				                if (!col.editor.options) {
				                  col.editor.options = {};
				                }
				                if(!col.editor.options.codeType){
				                  col.editor.options.codeType = col.codeType;
				                }
							}
						}

						cols.push(col);
					});

					opt.frozen ? frozenColumns.push(cols) : columns.push(cols);
				});
			});
			return [frozenColumns, columns];
		}

		var panel = $(
			'<div class="datagrid-wrap">' +
			'<div class="datagrid-view">' +
			'<div class="datagrid-view1">' +
			'<div class="datagrid-header">' +
			'<div class="datagrid-header-inner"></div>' +
			'</div>' +
			'<div class="datagrid-body">' +
			'<div class="datagrid-body-inner"></div>' +
			'</div>' +
			'<div class="datagrid-footer">' +
			'<div class="datagrid-footer-inner"></div>' +
			'</div>' +
			'</div>' +
			'<div class="datagrid-view2">' +
			'<div class="datagrid-header">' +
			'<div class="datagrid-header-inner"></div>' +
			'</div>' +
			'<div class="datagrid-body"></div>' +
			'<div class="datagrid-footer">' +
			'<div class="datagrid-footer-inner"></div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>'
		).insertAfter(target);

		panel.panel({
			doSize: false,
			cls: 'datagrid'
		});

		$(target).addClass('datagrid-f').hide().appendTo(panel.children('div.datagrid-view'));

		var cc = getColumns();
		var view = panel.children('div.datagrid-view');
		var view1 = view.children('div.datagrid-view1');
		var view2 = view.children('div.datagrid-view2');

		return {
			panel: panel,
			frozenColumns: cc[0],
			columns: cc[1],
			dc: {	// some data container
				view: view,
				view1: view1,
				view2: view2,
				header1: view1.children('div.datagrid-header').children('div.datagrid-header-inner'),
				header2: view2.children('div.datagrid-header').children('div.datagrid-header-inner'),
				body1: view1.children('div.datagrid-body').children('div.datagrid-body-inner'),
				body2: view2.children('div.datagrid-body'),
				footer1: view1.children('div.datagrid-footer').children('div.datagrid-footer-inner'),
				footer2: view2.children('div.datagrid-footer').children('div.datagrid-footer-inner')
			}
		};
	}
	// use cached editors
	(function cacheEditors() {
		for (var editorType in $.fn.datagrid.defaults.editors) {
			var editor = $.fn.datagrid.defaults.editors[editorType];
			$.extend(editor, {
				_getValue: editor.getValue,
				getValue: function (target) {
					var value = this._getValue(target);
					if ($.trim(value) === "") {
						return null;
					}
					return value;
				}
			});
		}
	})();
	
	$.fn._datagrid = $.fn.datagrid;
	$.fn.datagrid = function (options, param) {
		if (typeof options == 'string') {
			return $.fn.datagrid.methods[options](this, param);
		}

		options = options || {};
		return this.each(function () {
			var state = $.data(this, 'datagrid'), opts;
			if (state) {
				opts = $.extend(state.options, options);
				state.options = opts;
			} else {
				opts = $.extend({}, $.extend({}, $.fn.datagrid.defaults, { queryParams: {} }), $.fn.datagrid.parseOptions(this), options);
				$(this).css('width', '').css('height', '');

				var wrapResult = wrapGrid(this, opts.rownumbers, opts);
				if (!opts.columns) opts.columns = wrapResult.columns;
				if (!opts.frozenColumns) opts.frozenColumns = wrapResult.frozenColumns;
				opts.columns = $.extend(true, [], opts.columns);
				opts.frozenColumns = $.extend(true, [], opts.frozenColumns);
				restoreColumns(opts);
				var allColumns = [], fieldCodeTypes = {};
				for (var i = 0; i < opts.frozenColumns.length; i++) {
					Array.prototype.push.apply(allColumns, opts.frozenColumns[i]);
				}
				for (var i = 0; i < opts.columns.length; i++) {
					Array.prototype.push.apply(allColumns, opts.columns[i]);
				}
				var hasEditor = false;
				$.each(allColumns, function (i, col) {
					if (col.codeType) {
						if (col.formatter) {
							col._formatter = col.formatter;
						}
						col.formatter = $.fn.datagrid.defaults.formatter;
						fieldCodeTypes[col.field] = col.codeType;
					}
					if (col.sortable == undefined || col.sortable == null) {
						col.sortable = true;
					}
					if (typeof (col.formatter) == 'string') {
						col.formatter = opts.formatters[col.formatter];
					} else if (!col.formatter && col.format) {
						col.formatter = opts.formatters.replace;
					}
					if(col.editor){
					  hasEditor = true;
					}
				});
				if (opts.checkbox !== false) {
					if(opts.frozenCheckbox){
						if (opts.frozenColumns.length == 0) {
							opts.frozenColumns = [[]];
						}
						opts.frozenColumns[0].unshift({
							field: "ck",
							checkbox: true
						});
					}else {
						if (opts.columns.length == 0) {
							opts.columns = [[]];
						}	
						opts.columns[0].unshift({
							field: "ck",
							checkbox: true
						});						
					}
				}
				
				$.data(this,'editable',hasEditor);
				if(opts.code){
				   var editable = fmx.checkFunctionAuthorization(opts.code);
				   $.data(this,'editable',editable);
				}
				
				opts.fieldCodeTypes = fieldCodeTypes;
				//opts.view = $.extend({}, opts.view);
				$.data(this, 'datagrid', {
					options: opts,
					panel: wrapResult.panel,
					dc: wrapResult.dc,
					ss: null,
					selectedRows: [],
					checkedRows: [],
					data: { total: 0, rows: [] },
					originalRows: [],
					updatedRows: [],
					insertedRows: [],
					deletedRows: []
				});
			}
			opts._autoLoad = false;
			if(opts.maskit && typeof opts.maskit == 'string'){
				opts.maskit = fmx.utils.getJquery(opts.maskit);
			}
			$.fn._datagrid.call($(this), {});
			//after initial
			afterInitial(this);
		});
	};
	function afterInitial(target) {
		var state = $.data(target,'datagrid');
		if(state.options.singleSelect && state.options.checkbox !== false){
			//hidden header checkbox for single select
			var view = state.options.frozenCheckbox ? state.dc.header1 : state.dc.header2;
			if(view) view.find('.datagrid-header-check').css({visibility:"hidden"})
		}
		state.options._initialized = true;
	}
	function canEdit(target) {
	  if(!$.data(target,'editable')){
	    return false;
	  }
	  var state = $.data(target,'datagrid');
	  if(state && state.options.readonly) return false;
	  return true;
	}
	$.extend($.fn.datagrid, $.fn._datagrid);
	var _beginEdit = $.fn.datagrid.methods.beginEdit;
	var _endEdit = $.fn.datagrid.methods.endEdit;
	var _fitColumns = $.fn.datagrid.methods.fitColumns;
	$.extend($.fn.datagrid.methods, {
	  fitColumns: function(jq){
		  _fitColumns(jq);
		return jq.each(function(){
			storeColumnsInfo(this);
		});
	  },	
	  beginEdit : function(jq,index){
	    return jq.each(function(){
	      //console.log("beginEdit:"+index);
	      if(canEdit(this)){
	        _beginEdit($(this),index);
	        $.data(this,'currentRow',index);
	      }
	    });
	  },
	  endEdit: function(jq,index){
	    return jq.each(function(){
	      _endEdit($(this),index);
	      var curRow = $.data(this,'currentRow');
	      //console.log("endEdit:"+index);
	      if(curRow == index) $.removeData(this,'currentRow');
	    });
	  },

		commonQuery: function (jq, queryInfo) {
			return jq.each(function () {
				var $datagrid = $(this);
				var options = $datagrid.datagrid("options");
				options.commonQueryFields = null;
				if (queryInfo) {
					if (queryInfo.paramForm) {
						options.paramForm = queryInfo.paramForm;
					}
					if (queryInfo.queryFields) {
						options.commonQueryFields = queryInfo.queryFields;
					}
					if (queryInfo.query) {
						options.query = queryInfo.query;
					}
					if (queryInfo.orderBy) {
						options.orderBy = queryInfo.orderBy;
					}
					if(queryInfo.txManager) {
						options.txManager = queryInfo.txManager;
					}
				}
				if ($datagrid.hasClass("easyui-treegrid")) {
					$datagrid.treegrid("reload");
				} else {
					$datagrid.datagrid("load");
				}
			});
		},
		setQueryFields: function (jq, queryFields) {
			return jq.each(function () {
				$(this).datagrid("options").queryFields = queryFields;
			});
		},
	    getSelectedIndex: function (jq) {
	      var $datagrid = $(jq[0]);
	      return $datagrid.datagrid("getRowIndex", $datagrid
	          .datagrid("getSelected"));
	    },		
		getSelectionsIndex: function (jq) {
			var $datagrid = $(jq[0]);
			var rows = $datagrid.datagrid("getSelections");
			var selectionsIndex = [];
			for (var i = 0; i < rows.length; i++) {
				selectionsIndex
					.push($datagrid.datagrid("getRowIndex", rows[i]));
			}
			return selectionsIndex;
		},

		setCurrentRow: function (jq, index) {
			return jq.each(function () {
				if (index == undefined) {
					//$(this).removeData("currentRow");
				  $.removeData(jq[0],'currentRow');
				} else {
					//$(this).data("currentRow", index);
				  $.data(jq[0],'currentRow',index);
				}
			});
		},
		getCurrentRow: function (jq) {
		  return $.data(jq[0],'currentRow');
			//return $(jq[0]).data("currentRow");
		},
		validate: function (jq) {
			var $datagrid = $(jq[0]);
			var index = $datagrid.datagrid("getCurrentRow");
			if (index != undefined) {
				return $datagrid.datagrid("validateRow", index);
			}
			return true;
		},
		
		forceEndEdit: function (jq, index) {
			return jq.each(function () {
				var $datagrid = $(this);
				if (index == undefined) {
					index = $datagrid.datagrid("getCurrentRow");
				}
				if(index >= 0) {
				  $datagrid.datagrid("endEdit",index);
				}
				$datagrid.datagrid("setCurrentRow", undefined);
			});
		},
		_getChanges : $.fn.datagrid.methods.getChanges,
	    getChanges: function (jq, type) {
	        var $datagrid = $(jq[0]);
	        this.forceEndEdit(jq);
	        var insertedRows = this._getChanges(jq, "inserted");
	        var updatedRows = this._getChanges(jq, "updated");
	        var deletedRows = this._getChanges(jq, "deleted");
	        $.each(insertedRows, function (index, row) {
	            row.modelState = "Added";
	        });
	        $.each(updatedRows, function (index, row) {
	            row.modelState = "Modified";
	        });
	        $.each(deletedRows, function (index, row) {
	            row.modelState = "Deleted";
	        });
	        var data;
	        if (!type) {
	        	data=[];
	        	Array.prototype.push.apply(data, insertedRows);
	        	Array.prototype.push.apply(data, updatedRows);
	        	var row;
	            for(var i = 0;i<deletedRows.length;i++) {
	            	row = deletedRows[i];
	            	if(data.indexOf(row) == -1) {
	            		data.push(row);
	            	}
	            }
	        } else {
	            switch (type) {
	                case "inserted":
	                    data = insertedRows;
	                case "updated":
	                    data = updatedRows;
	                case "deleted":
	                    data = deletedRows;
	            }
	        }
	        return data;
	    },		
    	_reload : $.fn.datagrid.methods.reload,
    	reload : function(jq,params){
    		if(params == true){
    			$.fn.datagrid.methods.query(jq);
    		}else{
    			jq.each(function(){
    				var state = $.data(this,'datagrid');
    				if(!state.options.pageNumber){
    					state.options.pageNumber = 1;
    				}
    			});
    			$.fn.datagrid.methods._reload(jq,params);
    		}
    		return jq;
    	},
		query: function (jq,params) {
			return jq.each(function () {
				var $datagrid = $(this),options;
				if ($datagrid.hasClass("easyui-treegrid")) {
					options = $datagrid.treegrid("options");
				} else {
					options = $datagrid.datagrid("options");
				}
				if(options.sortOrder || options.sortName){
					$datagrid.datagrid("getPanel")
					         .children(".datagrid-view")
						     .children(".datagrid-view1,.datagrid-view2")
						     .children(".datagrid-header")
						     .find(".datagrid-cell").removeClass("datagrid-sort-asc datagrid-sort-desc")
						     .find(".datagrid-sort-count").remove();
					options.sortName = undefined;
					options.sortOrder = undefined;
					options.sortCount = undefined;
				}
				if ($datagrid.hasClass("easyui-treegrid")) {
					$datagrid.treegrid("reload",params);
				} else {
					$datagrid.datagrid("load",params);
				}
			});
		},

		exportExcel: function (jq, currentPageOnly) {
			function getFormatter(opts,colOpt) {
				if(!colOpt.formatter){
					return null;
				}
				var fmtter;
				$.each(opts.formatters,function(k,v){
					if(v == colOpt.formatter){
						fmtter = k;
						return false;
					}
				});
				if(fmtter){
					return fmtter;
				}else if(colOpt.formatter instanceof String){
					return colOpt.formatter;
				}
			}
			return jq.each(function () {
				var $datagrid = $(this), opts = $datagrid.datagrid('options');
				if (!opts.query) {
					$.messager.alert("Message", $.fn.datagrid.defaults.exportExcelErrorMsg, "warning");
					return;
				} else if (!opts.queryInfo) return;
				var exportInfo = {
					params: $.extend({}, opts.exportParams),
					type: opts.exportType || $.fn.datagrid.defaults.exportType,
					fileName: opts.exportFilename,
					template: opts.exportTemplate
				};
				var queryInfo = $.extend(true, {}, opts.queryInfo), columns = [];
				if (!currentPageOnly) {
					queryInfo.pagingInfo = null;
				}
				var $headerTr = $datagrid.datagrid("getPanel").children(".datagrid-view").children(".datagrid-view1,.datagrid-view2").children(".datagrid-header").find("tr");
				$.each($datagrid.datagrid("getColumnFields", true).concat($datagrid.datagrid("getColumnFields", false)),
					function (index, field) {
						var columnOption = $datagrid.datagrid("getColumnOption", field);
						if (!columnOption.title) {
							return;
						}
						$field = $headerTr.find("td[field='" + columnOption.field + "']");
						columns.push({
							field: columnOption.field,
							title: columnOption.title,
							codeType: columnOption.codeType,
							format : columnOption.exportFormat || columnOption.format,
							formatter: columnOption.exportFormatter || getFormatter(opts,columnOption),
							width: $field.width() + 10
						});
					});
				fmx.CommonExporter.doExportQuery(exportInfo, queryInfo, columns);
			});
		},
		refreshFooter: function (jq) {
			return jq.each(function () {
				var $datagrid = $(this);
				if (!$datagrid.attr("showFooter")) {
					return;
				}
				$datagrid.datagrid("forceEndEdit");
				var footerRows = [];
				$datagrid.find("tfoot tr").each(
					function (indextf, tr) {
						var $tr = $(tr);
						var footerRow = {};
						$tr.find("td").each(
							function (indextd, td) {
								var $td = $(td);
								var field = $td.attr("field");
								var value = 0;
								var footerType = $td.attr("footerType");
								switch (footerType) {
									case "count":
										value = $datagrid.datagrid("getRows").length;
										break;
									case "sum":
										$.each($datagrid.datagrid("getRows"), function (
											rowIndex, row) {
											value += isNaN(+row[field]) ? 0 : +row[field];
										});
										break;
									case "average":
										var count = $datagrid.datagrid("getRows").length;
										if (count == 0) {
											value = 0;
										} else {
											$.each($datagrid.datagrid("getRows"),
												function (rowIndex, row) {
													value += isNaN(+row[field]) ? 0
														: +row[field];
												});
											value = value / count;
										}
										break;
									default:
										value = $td.html();
								}
								footerRow[field] = value;
							});
						footerRows.push(footerRow);
					});
				if (footerRows.length) {
					$datagrid.datagrid("reloadFooter", footerRows);
				}
			});
		},
//    getColumnEditor: function (jq, field) {
//      return $(jq[0]).data("editorTargets")[field] ? $(jq[0]).data(
//          "editorTargets")[field][0] : null;
//    },
    _loading : $.fn.datagrid.methods.loading,
    _loaded : $.fn.datagrid.methods.loaded,
    loading : function(jq){
      jq.each(function(){
        var opts = $.data(this, 'datagrid').options;
        if(opts.maskit) opts.maskit.maskit(true,true);
      });
      return $.fn.datagrid.methods._loading(jq);
    },
    loaded : function(jq){
      jq.each(function(){
        var opts = $.data(this, 'datagrid').options;
        if(opts.maskit) opts.maskit.maskit('unmask',true);
      });
      return $.fn.datagrid.methods._loaded(jq);
    }
	});

	$.fn.datagrid.parseOptions = function (target) {
		var t = $(target), exportParams = t.attr('exportParams'), columns = t.attr('columns'), frozenColumns = t.attr('frozenColumns');
		if (exportParams && exportParams.charAt(0) == '{') {
			exportParams = eval(exportParams);
		} else exportParams = undefined;
		if (columns && columns.charAt(0) == '{') {
			columns = eval(columns);
		} else columns = undefined;
		if (frozenColumns && frozenColumns.charAt(0) == '{') {
			frozenColumns = eval(frozenColumns);
		} else frozenColumns = undefined;
		var onQueryField = t.attr('onQueryField') ? eval(t.attr('onQueryField')) : undefined;
		return $.extend({ exportParams: exportParams, columns: columns, frozenColumns: frozenColumns, onQueryField: onQueryField }, $.fn.panel.parseOptions(target), $.parser.parseOptions(target, [
			'url', 'toolbar', 'idField', 'sortName', 'sortOrder', 'pagePosition', 'resizeHandle', 'query',
			'exportTemplate', 'exportFilename', 'exportType', 'paramForm', 'orderBy', 'groupField', 'parentField',
			'iconClsField','code','txManager',
			{ sharedStyleSheet: 'boolean', fitColumns: 'boolean', autoRowHeight: 'boolean', striped: 'boolean', nowrap: 'boolean' },
			{ rownumbers: 'boolean', singleSelect: 'boolean', ctrlSelect: 'boolean', checkOnSelect: 'boolean', selectOnCheck: 'boolean' },
			{ storeColumns:'boolean',storeColumnsWithWidth:'boolean' },
			{ pagination: 'boolean', pageSize: 'number', pageNumber: 'number' },
			{ multiSort: 'boolean', remoteSort: 'boolean', showHeader: 'boolean', showFooter: 'boolean' },
			{ scrollbarSize: 'number','maxRowLimit':'number', autoLoad: 'boolean',readonly:'boolean',showContextMenu:'boolean',showExportContextMenu:'boolean',frozenCheckbox:'boolean' }
		]), {
				pageList: (t.attr('pageList') ? eval(t.attr('pageList')) : undefined),
				loadMsg: (t.attr('loadMsg') != undefined ? t.attr('loadMsg') : undefined),
				maskit: t.attr('maskit'),
				rowStyler: (t.attr('rowStyler') ? eval(t.attr('rowStyler')) : undefined),
				queryFields: (t.attr('queryFields') ? eval(t.attr('queryFields')) : undefined)
			});
	};

	//formatters
	var formatters = {
		number: function (value, rowData, rowIndex) {
			value = fmx.formatters.formatNumber(value, this.format);
			return "<span style='float:right;'>" + value + "</span>";
		},
		currency: function (value, rowData, rowIndex) {
			value = fmx.formatters.formatCurrency(value, this.format);
			return "<span style='float:right;'>" + value + "</span>";
		},
		date: function (value, rowData, rowIndex) {
			return fmx.formatters.formatDate(value, this.format);
		},
		datetime: function (value, rowData, rowIndex) {
			return fmx.formatters.formatDatetime(value, this.format);
		},
		time: function (value, rowData, rowIndex) {
			value = fmx.formatters.formatTime(value, this.format);
			return "<span style='float:right;'>" + value + "</span>";
		},
		replace: function (value, rowData, rowIndex) {
			if (this.format) {
				value = this.format.replace(/{value}/g, value);
				value = value.replace(/{index}/g, rowIndex);
			}
			return value;
		},
		dynamic: function (value, rowData, rowIndex) {
			if (this.format) {
				if (!this._formatter) {
					this._formatter = new Function("value", "rowData", "index", "return " + this.format);
				}
				value = this._formatter.call(this, value, rowData, rowIndex);
			}
			return value;
		},
		htmlencode : function(value,rowData,rowIndx) {
			return value ? fmx.utils.htmlencode(value) : value;
		},
		htmldecode : function(value,rowData,rowIndx) {
			return value ? fmx.utils.htmldecode(value) : value;
		}
	};
	var onViewAfterRender = $.fn.datagrid.defaults.view.onAfterRender;
	$.fn.datagrid.defaults = $.extend($.fn.datagrid.defaults, {
		url: true,
		singleSelect:true,
		striped:true,
		fit:true,
		fitColumns: true,
		storeColumns : true,
		storeColumnsWithWidth : true,
		rownumbers: true,
		pagination: true,
		selectOnCheck: true,
		pagePosition: 'bottom',	// top,bottom,both
		pageNumber: 0,
		readonly : false,
		showContextMenu : true,
		showExportContextMenu:true,
		frozenCheckbox : true,
		autoLoad: !!fmx.pageContext.easyui['dataGridAutoLoad'],
		pageSize: fmx.pageContext.easyui['dataGridPageSize'] || 10,
		pageList: fmx.pageContext.easyui['dataGridPageList'] || [10, 20, 30, 40, 50],
		refreshText: "Refresh",
		resetSortText: "Default Sort Order",
		exportExcelCurrentPageText: "Export Excel (Current Page)",
		exportExcelAllText: "Export Excel (All)",
		showColumnsText: "Show Columns",
		exportExcelErrorMsg: "Can not export Excel for this table.",
		dataChangedMsg: "Data changed. Discard changes?",
		loadDataErrorMsg: "Error loading data.",
		reLoginMsg: "Error loading data. Please re-login and try again.",
		exportParams: {},
		exportType: fmx.pageContext.easyui['dataGridExportType'] || "jxls",
		exportFilename: 'datagrid-data',
		exportTemplate: "",
		formatters: formatters,
		onQueryField: $.noop,
		txManager : null,
		loader: function (param, success, error) {
			var $datagrid = $(this), opts = $datagrid.datagrid('options');
			if (!opts._autoLoad) { //第一次加载
				opts._autoLoad = true;
				if (opts.url === true) {
					opts.url = '';
				}
				if (!opts.autoLoad) {
					return false;
				}
			}
			if (opts.url) {
				$.ajax({
					type: opts.method,
					url: opts.url,
					data: param,
					dataType: 'json',
					success: function (data) {
						success(data);
					},
					error: function () {
						error.apply(this, arguments);
					}
				});
			} else if (opts.query) {
				var queryFields = [];
				if (opts.queryFields) {
					queryFields = queryFields.concat(opts.queryFields);
				}
				if (opts.commonQueryFields) {
					queryFields = queryFields.concat(opts.commonQueryFields);
				}
				if (param && param.queryFields) {
					if ($.isArray(param.queryFields)) {
						queryFields = queryFields.concat(param.queryFields);
					} else if ($.isPlainObject(param.queryFields)) {
						queryFields.push(param.queryFields);
					}
				}
				if (param && param.q) {
					queryFields.push({
						fieldName: $datagrid.datagrid("getColumnFields").join(","),
						fieldValue: param.q,
						operator: "ilikeAnywhere"
					});
				}
				if (opts.paramForm) {
					var $parent = $datagrid.parent();
					var $paramForm = null;
					while (true) {
						$paramForm = $parent.find("#" + opts.paramForm);
						if ($paramForm.size() > 0) {
							break;
						} else {
							$parent = $parent.parent();
							if ($parent.size() == 0) {
								break;
							}
						}
					}
					if ($paramForm) {
						if($paramForm.form('validate') === false) return false;
						var paramFormQueryFields = $paramForm.form("getQueryFields");
						if (paramFormQueryFields) {
							queryFields = queryFields.concat(paramFormQueryFields);
						}
					}
				}
				if ($.isFunction(opts.onQueryField)) {
					var qf = opts.onQueryField.call(this);
					if ($.isArray(qf)) {
						queryFields = queryFields.concat(qf);
					} else if ($.isPlainObject(qf)) {
						queryFields.push(qf);
					}
				}
				var queryInfo = {
					query: opts.query,
					fieldCodeTypes: opts.fieldCodeTypes,
					queryFields: queryFields,
					orderBy: (param.sort ? param.sort + " " + param.order : (opts.orderBy || ""))
				};
				if(opts.txManager){
					queryInfo.txManager = opts.txManager;
				}
				if(opts.maxRowLimit) {
					queryInfo.maxRowLimit = opts.maxRowLimit;
				}
				if (opts.pagination) {
					queryInfo['pagingInfo'] = {
						pageSize: param.rows,
						currentPage: param.page,
						pageNo: param.page,
						totalRows : $datagrid.datagrid('getPager').pagination('options').total
					};
				}
				// cache queryInfo
				opts['queryInfo'] = queryInfo;
				fmx.CommonQueryService.query(queryInfo, function (data) {
					if (!data || data.code < 0) {
						error(data.message);
					} else if(data.data) {
						success(data);
					}
				}, error);
			} else {
				return false;
			}
		},
		loadFilter: function (data) {
			if (!data) {
				return { total: 0, rows: [] };
			}else if($.isArray(data.rows)) return data;
//			var opts = $.data(this, 'datagrid').options;
//			if(opts.url && typeof opts.url == 'string'){
//				return data;
//			}
			if (data['code'] < 0) {
				var message;
				if(data.errors){
				  message = JSON.stringify( data.errors );
				} else message = data.message || data.exception;
				$.messager.alert("Message", $.fn.datagrid.defaults.loadDataErrorMsg + message, "warning");
				return { total: 0, rows: [] };
			}
			var dataList,total;
			if($.isArray(data.data)){
				dataList = data.data;
				if(data.pagingInfo) total = data.pagingInfo.totalRows;
				if(data.total > 0) total = data.total;
			}else if(data.data && $.isArray(data.data.dataList)){
				dataList = data.data.dataList;
				if(data.data.selectCodeValues){
					fmx.mergeSelectCodeValues(data.data.selectCodeValues);
				}
				if(data.data.pagingInfo){
					total = data.data.pagingInfo.totalRows;
				}
				if(data.data.total > 0) total = data.data.total;
			}else if($.isArray(data)){
				dataList = data;
			}else return { total: 0, rows: [] };
			data={rows : dataList,total : total || dataList.length};
			var $datagrid = $(this);
			if ($datagrid.hasClass("easyui-treegrid") && $.isArray(data.rows)) {
				var options = $datagrid.treegrid("options");
				var parentField = options.parentField || "parentId";
				var iconClsField = options.iconClsField || "iconCls";
				$.each(data.rows, function (index, row) {
					if (row[parentField] && row[parentField] != "0") {
						row._parentId = row[parentField];
					}
					if (row[iconClsField]) {
						row.iconCls = row[iconClsField];
					}
				});
			}
			return data;
		},
		formatter: function (value, rowData, rowIndex) {
			var _formatter = this._formatter, that = this;
			if (this.codeType && $isValidValue(value)) {
				var field = this.field;
				var codeType = this.codeType;
				var val = fmx.getSelectCodeValue(codeType,value,true);
				if($isValidValue(val)){
					value = val;
				} else {
					var selectCodeKeys = {};
					selectCodeKeys[codeType] = value;
					var id = field + (new Date().valueOf());
					fmx.CommonQueryService.getSelectCodeValuesByKeys(selectCodeKeys, function (result) {
					  if(result.message){
					    $.messager.alert('提示',result.message);
					  }else if(result.data){
	  					fmx.mergeSelectCodeValue(result.data);
	  					value = fmx.getSelectCodeValue(codeType,value,true);
  						if (_formatter) {
  							value = _formatter.call(that, value, rowData, rowIndex);
  						}
					   }
					   $("#" + id).replaceWith(value);
					});
					return "<div id='" + id + "'>...</div>";
				}
			}
			return _formatter ? _formatter.call(this, value, rowData, rowIndex) : value;
		},

		//onBeforeLoad: function (param) { },
		onLoadSuccess: function (row, data) {
			var $datagrid = $(this);
			if (!data) {
				data = row;
			}
			$(this).datagrid("setCurrentRow", undefined);
			$(this).data("lastSelectedIndex", null);
			if (!data) {
				return;
			}
			//groupDatagrid(this, data.rows);
			$(this).datagrid("refreshFooter");
			if ($datagrid.hasClass("easyui-treegrid")) {
				var previousSelectedId = $datagrid.data("selectedId");
				if (previousSelectedId) {
					$datagrid.treegrid("select", previousSelectedId);
				}
			}
		},
		onLoadError: function (message) {
			if(typeof message !== 'string'){
				if(typeof message.message == 'string') message = message.message;
				else if(typeof message.errors == 'string') message = message.errors;
				else if($.isFunction(message.state)) message = message.state();
				else message = null;
			}
			$.messager.confirm(message ? $.fn.datagrid.defaults.reLoginMsg : "Message", message ? message : $.fn.datagrid.defaults.reLoginMsg,
				function (b) {
					if (b) {
						top.window.location.reload();
					}
				});
		},
		onBeforeSortColumn : function() {
			//当表格为空时,不允许排序加载数据
			var state = $.data(this,'datagrid');
			if(!state.data || !state.data.rows || state.data.rows.length == 0){
				return false;
			}
		},
		onClickRow: function (rowIndex, rowData) {
			var $datagrid = $(this);
			// datagrid.onClickRow(rowIndex, rowData)
			// treegrid.onClickRow(row)
			// clicking only select one row when singleSelect not defined
			var opts = $datagrid.datagrid('options');
			if (opts.singleSelect) {
				if ($datagrid.hasClass("easyui-treegrid")) {
					// treegrid
					rowData = rowIndex;
					var idField = opts.idField;
					var rowId = rowData[idField];
					var selectionsId = $datagrid.treegrid("getSelectionsId");
					$.each(selectionsId, function (index, selectedId) {
						if (selectedId != rowId) {
							$datagrid.treegrid("unselect", selectedId);
						}
					});
					if (selectionsId.indexOf(rowId) == -1) {
						$datagrid.treegrid("select", rowId);
					}
				} else {
					// datagrid
					/*var selectionsIndex = $datagrid.datagrid("getSelectionsIndex");
					$.each(selectionsIndex, function (index, selectedIndex) {
						if (selectedIndex != rowIndex) {
							$datagrid.datagrid("unselectRow", selectedIndex);
						}
					});
					if (selectionsIndex.indexOf(rowIndex) == -1) {
						$datagrid.datagrid("selectRow", rowIndex);
					}*/
				}
			}
		},
		onClickCell: function (rowIndex, field, value) {
			var $datagrid = $(this);
			$datagrid.data("focusField", field);
		},
	    onUnselect: function (rowIndex, rowData) {
	      var $datagrid = $(this);
	      var options = $datagrid.datagrid("options");
	      // datagrid.onUnselect(rowIndex, rowData)
	      // treegrid.onUnselect(id)
	      if (canEdit(this)) {
	          options.unselectTimer = setTimeout(function () {
	              if ($datagrid.datagrid("getCurrentRow") == rowIndex) {
	                  if ($datagrid.datagrid("validateRow", rowIndex)) {
	                      $datagrid.datagrid("endEdit", rowIndex);
	                  } else {
	                      $datagrid.datagrid("selectRow", rowIndex);
	                  }
	              }
	          }, 0);
	      }
	    },
		onSelect: function (rowIndex, rowData) {
			var $datagrid = $(this);
			var options = $datagrid.datagrid("options");
			if (options.unselectTimer) {
		        clearTimeout(options.unselectTimer);
		        options.unselectTimer = false;
			}
			if(canEdit(this)){
	  		  var currentRow = $datagrid.datagrid("getCurrentRow");
	  		  if(currentRow != rowIndex) {
	  		    if($datagrid.datagrid('validateRow',currentRow)){
	  		      $datagrid.datagrid("endEdit", currentRow);
	  		      setTimeout(function(){
	  		        $datagrid.datagrid("beginEdit", rowIndex);
	  		      },0);
	  		    }else{
	            $datagrid.datagrid("unselectRow", rowIndex);
	            setTimeout(function(){
	              $datagrid.datagrid("selectRow", currentRow);
	            },0);     
	            return;
	  		    }
	  		  }
		  	}
			// datagrid.onSelect(rowIndex, rowData)
			// treegrid.onSelect(id)
			if ($datagrid.hasClass("easyui-treegrid")) {
				var id = rowIndex;
				$datagrid.data("selectedId", id);
			} else {
				// use shift key to multi select rows
				if (!$datagrid.datagrid("options").singleSelect) {
					if ($datagrid.data("shiftKey")) {
						$datagrid.removeData("shiftKey");
						var lastSelectedIndex = $datagrid.data("lastSelectedIndex");
						if (lastSelectedIndex != undefined) {
							if (lastSelectedIndex < rowIndex) {
								for (var i = lastSelectedIndex; i < rowIndex; i++) {
									$datagrid.datagrid("selectRow", i);
								}
							} else {
								for (var i = rowIndex; i < lastSelectedIndex; i++) {
									$datagrid.datagrid("selectRow", i);
								}
							}
						}
					}
					$datagrid.data("lastSelectedIndex", rowIndex);
				}else{
					var idx = $datagrid.data("lastSelectedIndex");
					if(idx == rowIndex){
						setTimeout(function(){
							$datagrid.datagrid("unselectRow",idx);
						},10);
						$datagrid.data("lastSelectedIndex",null);
					}else{
						$datagrid.data("lastSelectedIndex",rowIndex);
					}
				}
			}
		},
		onAfterEdit: function (rowIndex, rowData, changes) {
			if (!$.isEmptyObject(changes)) {
				$(this).datagrid("refreshFooter");
			}
		},
		//onCancelEdit: function (rowIndex, rowData) { },
		onHeaderContextMenu: function (e, field) {
			$.fn.datagrid.defaults.onRowContextMenu.apply(this, [e, null, null]);
		},
		onContextMenu: function (e, row) {
			$.fn.datagrid.defaults.onRowContextMenu.apply(this, [e, null, row]);
		},
		onRowContextMenu: function (e, rowIndex, rowData) {
			if (fmx.textSelected()) {
				return;
			}
			var $datagrid = $(this);
			var options = $datagrid.datagrid("options");
			if(!options.showContextMenu) return;
			e.preventDefault();
			if (options.contextMenu) {
				options.contextMenu.menu("show", {
					left: e.pageX,
					top: e.pageY
				});
				return;
			}
			var menu = [];
			menu.push("<div class='easyui-menu' style='width:200px;'>");
			menu.push("<div id='Refresh'>" + $.fn.datagrid.defaults.refreshText);
			menu.push("</div>" + "<div id='ResetSort'>");
			menu.push($.fn.datagrid.defaults.resetSortText + "</div>");
			if(options.showExportContextMenu){
				menu.push("<div class='menu-sep'></div>");
				menu.push("<div id='ExportExcelCurrentPage'>");
				menu.push($.fn.datagrid.defaults.exportExcelCurrentPageText + "</div>");
				menu.push("<div id='ExportExcelAll'>");
				menu.push($.fn.datagrid.defaults.exportExcelAllText + "</div>");
			}
			menu.push("<div class='menu-sep'></div>" + "<div><span>");
			menu.push($.fn.datagrid.defaults.showColumnsText);
			menu.push("</span><div style='width:180px;'>");
			$.each($datagrid.datagrid("getColumnFields"), function (index, field) {
				var columnOption = $datagrid.datagrid("getColumnOption", field);
				if(columnOption.hidden){
					menu.push("<div data-field='" + field + "' data-title='"+columnOption.title+"' hidding='true'>&nbsp;&nbsp;&nbsp;" + columnOption.title + "</div>");
				}else{
					menu.push("<div data-field='" + field + "' data-title='"+columnOption.title+"'>√ " + columnOption.title + "</div>");
				}
			});
			menu.push("</div></div></div>");
			var $menu = $(menu.join('')).appendTo($datagrid.closest(".datagrid"));
			options.contextMenu = $menu;
			$menu.menu({
				left: e.pageX,
				top: e.pageY,
				events : {
					mouseenter: $.fn.menu.defaults.events.mouseenter,
					mouseleave: $.fn.menu.defaults.events.mouseleave,
					mouseover: $.fn.menu.defaults.events.mouseover,
					mouseout: $.fn.menu.defaults.events.mouseout,
					click : function(e) {
						var target = e.data.target;
						var $item = $(e.target).closest('.menu-item');
						var item = $(target).menu('getItem', $item[0]);
						if(!item.id && $item.attr('data-field')){
							var opts = $(target).data('menu').options;
							$item.trigger('mouseenter');
							opts.onClick.call(target, item);
							return;
						}
						$.fn.menu.defaults.events.click.call(this,e);
					}
				},
				onClick: function (item) {
					switch (item.id) {
						case "Refresh":
							if ($datagrid.hasClass("easyui-treegrid")) {
								$datagrid.treegrid("reload");
							} else {
								$datagrid.datagrid("reload");
							}
							break;
						case "ResetSort":
							$datagrid.datagrid("query");
							break;
						case "ExportExcelCurrentPage":
							$datagrid.datagrid("exportExcel", true);
							break;
						case "ExportExcelAll":
							$datagrid.datagrid("exportExcel");
							break;
						default:
							var $item = $(item.target);
						    var field = $item.attr('data-field');
							if (field) {
								var $text = $item.children(".menu-text");
								if ($item.attr("hidding")) {
									$datagrid.datagrid("showColumn", field);
									$item.removeAttr("hidding");
									$text.text("√ " + $item.attr('data-title'));
								} else {
									$datagrid.datagrid("hideColumn", field);
									$item.attr("hidding", true);
									$text.html("&nbsp;&nbsp;&nbsp;"+$item.attr('data-title'));
								}
								return false;
							}
					}
				}
			}).menu("show");
		},
		view : $.extend($.fn.datagrid.defaults.view,{
			render: function(target, container, frozen){
				var rows = $(target).datagrid('getRows');
				container[0].innerHTML = this.renderTable(target, 0, rows, frozen);
			},
			renderFooter: function(target, container, frozen){
				var opts = $.data(target, 'datagrid').options;
				var rows = $.data(target, 'datagrid').footer || [];
				var fields = $(target).datagrid('getColumnFields', frozen);
				var table = ['<table class="datagrid-ftable" cellspacing="0" cellpadding="0" border="0"><tbody>'];
				for(var i=0; i<rows.length; i++){
					table.push('<tr class="datagrid-row" datagrid-row-index="' + i + '">');
					table.push(this.renderRow.call(this, target, fields, frozen, i, rows[i]));
					table.push('</tr>');
				}
				table.push('</tbody></table>');
				container[0].innerHTML = table.join('');
			},
			updateRow: function(target, rowIndex, row){
				var opts = $.data(target, 'datagrid').options;
				var rowData = opts.finder.getRow(target, rowIndex);

				$.extend(rowData, row);
				var cs = _getRowStyle.call(this, rowIndex);
				var style = cs.s;
				var cls = 'datagrid-row ' + (rowIndex % 2 && opts.striped ? 'datagrid-row-alt ' : ' ') + cs.c;
				
				function _getRowStyle(rowIndex){
					var css = opts.rowStyler ? opts.rowStyler.call(target, rowIndex, rowData) : '';
					return this.getStyleValue(css);
				}
				function _update(frozen){
					var fields = $(target).datagrid('getColumnFields', frozen);
					var tr = opts.finder.getTr(target, rowIndex, 'body', (frozen?1:2));
					//var checked = tr.find('div.datagrid-cell-check input[type=checkbox]').is(':checked');
					tr.html(this.renderRow.call(this, target, fields, frozen, rowIndex, rowData));
					tr.attr('style', style).attr('class', cls);
				}
				
				_update.call(this, true);
				_update.call(this, false);
				$(target).datagrid('fixRowHeight', rowIndex);
			},
			renderRow: function(target, fields, frozen, rowIndex, rowData){
				var opts = $.data(target, 'datagrid').options;
				
				var cc = [];
				if (frozen && opts.rownumbers){
					var rownumber = rowIndex + 1;
					if (opts.pagination){
						rownumber += (opts.pageNumber-1)*opts.pageSize;
					}
					cc.push('<td class="datagrid-td-rownumber"><div class="datagrid-cell-rownumber">'+rownumber+'</div></td>');
				}
				for(var i=0; i<fields.length; i++){
					var field = fields[i];
					var col = $(target).datagrid('getColumnOption', field);
					if (col){
						var value = rowData[field];	// the field value
						value = value == null || value == undefined ? '' : value; 
						var css = col.styler ? (col.styler(value, rowData, rowIndex)||'') : '';
						var cs = this.getStyleValue(css);
						var cls = cs.c ? 'class="' + cs.c + '"' : '';
						var style = col.hidden ? 'style="display:none;' + cs.s + '"' : (cs.s ? 'style="' + cs.s + '"' : '');
						var valign = col.valign ? ' valign="'+col.valign+'"':'';
						cc.push('<td field="' + field + '" ' + cls + ' ' + style + valign + '>');
						
						var style = '';
						if (!col.checkbox){
							if (col.align){style += 'text-align:' + col.align + ';'}
							if (!opts.nowrap){
								style += 'white-space:normal;height:auto;';
							} else if (opts.autoRowHeight){
								style += 'height:auto;';
							}
						}
						
						cc.push('<div style="' + style + '" ');
						cc.push(col.checkbox ? 'class="datagrid-cell-check"' : 'class="datagrid-cell ' + col.cellClass + '"');
						cc.push('>');
						
						if (col.checkbox){
							cc.push('<input type="checkbox" ' + (rowData.checked ? 'checked="checked"' : ''));
							cc.push(' name="' + field + '" value="' + (value!=undefined ? value : '') + '">');
						} else if (col.formatter){
							cc.push(col.formatter(value, rowData, rowIndex));
						} else {
							cc.push(value);
						}
						
						cc.push('</div>');
						cc.push('</td>');
					}
				}
				return cc.join('');
			},
			onAfterRender : function(target) {
				onViewAfterRender.call(this,target);
				var state = $.data(target, 'datagrid');
				var opts = state.options;
				if(opts.rownumbers){
					if(!state.rowNumberWidth) {
						var width = opts.showHeader ? state.dc.header1.find(".datagrid-header-rownumber").eq(0).width() : state.dc.body1.find(".datagrid-cell-rownumber:first").eq(0).width();
						state.rowNumberWidth = width;
					}else{
						var rn = state.data && $.isArray(state.data.rows) ? state.data.rows.length : 0;
						if(opts.pagination){
							rn += (opts.pageNumber-1)*opts.pageSize;
						}
						var width = state.rowNumberWidth;
						var len = rn.toString().length - 2;
						if(len > 0){
							width += 8 * len;
						}
						var w = opts.showHeader ? state.dc.header1.find(".datagrid-header-rownumber").eq(0).width() : state.dc.body1.find(".datagrid-cell-rownumber:first").eq(0).width();
						if(w !== state.rowNumberWidth || w !== width){
							state.dc.body1.find(".datagrid-cell-rownumber").width(width);
							if(opts.showHeader){
								state.dc.header1.find(".datagrid-header-rownumber").width(width);
							}
							$(target).datagrid("fixColumnSize");
							if(opts.showFooter) {
								state.dc.footer1.find(".datagrid-cell-rownumber").width(width);
							}
						}
					}
				}
			}
		})
	});
	$.extend($.fn.datalist.defaults,{
		url: true,
		autoLoad : $.fn.datagrid.defaults.autoLoad,
		loader : $.fn.datagrid.defaults.loader,
		loadFilter : $.fn.datagrid.defaults.loadFilter
	});
	$.extend($.fn.treegrid.defaults,{
		url: true,
		autoLoad : $.fn.datagrid.defaults.autoLoad,
		loader : $.fn.datagrid.defaults.loader,
		loadFilter : $.fn.datagrid.defaults.loadFilter,
		formatters : $.fn.datagrid.defaults.formatters,
		formatter :  $.fn.datagrid.defaults.formatter
	});
})(jQuery, fmx);

; (function ($, fmx) {
    var SELECT_CODE_DATAS = fmx.getSelectCodeDatas(), SELECT_CODE_OPTS = fmx.getSelectCodeOpts();
    
    /** ******** combobox ********* */
    var _combobox = $.fn.combobox;

    $.fn.combobox = function (options, param) {
        if (typeof options == "string") {
            this.each(function () {
                if (!$.data(this, "combobox")) {
                    $(this).combobox({});
                }
            });
            return _combobox.apply(this, [options, param]);
        }
        initCombobox(this, options || {});
        return this;
    };
    $.extend($.fn.combobox,_combobox);    
    
    function addEmptyItem(opts,dataList) {
    	if(!opts.emptyItemEnable || opts.multiple) return dataList;
    	var item = {};
    	item[opts.valueField] = opts.emptyItemValue;
    	item[opts.textField] = opts.emptyItemText;
    	if($.isArray(dataList)) {
//    		$.each(dataList,function(i,data){
//    			if(data['selected']){
//    				//item.selected = false;
//    				return false;
//    			}
//    		});
    		dataList.unshift(item);
    	}else dataList = [item];
    	return dataList;
    }
    var _parseOpts = $.fn.combobox.parseOptions;
    $.fn.combobox.parseOptions = function(target) {
    	var opts = _parseOpts(target);
    	if(target.getAttribute('emptyItemEnable') === 'false'){
    		opts['emptyItemEnable'] = false;
    	}
    	var val = target.getAttribute('emptyItemValue');
    	if(val) opts['emptyItemValue'] = val;
    	val = target.getAttribute('emptyItemText');
    	if(val) opts['emptyItemText'] = val;
    	if(opts.multiple){
    		opts.emptyItemEnable = false;
    	}
    	
    	val = target.getAttribute('query');
    	if(val) opts.query = val;
    	
    	val = target.getAttribute('codeType');
    	if(val) opts.codeType=val;
    	
    	val = target.getAttribute('orderBy');
    	if(val) opts.orderBy=val;
    	
    	val = target.getAttribute('queryFields');
    	if(val && val.charAt(0) == '{') opts.queryFields = eval(val);
    	
    	return opts;
    }    
    
//    var blurEvt = $.fn.combobox.defaults.inputEvents.blur;
//    $.fn.combobox.defaults.inputEvents.blur = function(e) {
//    	var target = e.data.target,state = $.data(target, 'combobox');
//    	if(!state) return;
//    	var comboState = $.data(target,"combo");
//    	if(comboState && comboState.panel){
//    		var plOpts = comboState.panel.panel("options");
//    		if(!plOpts.closed) return;
//    	}
//    	var opts = state.options;
//    	if(opts.multiple){
//    		var $jq = $(target);
//	    	if(opts.limitToList){
//	    		blurEvt(e);
//	    	}
//    	}else {
//    		var fn = $.fn.combobox.methods.hidePanel;
//    		$.fn.combobox.methods.hidePanel = $.noop;
//    		blurEvt(e);
//    		$.fn.combobox.methods.hidePanel = fn;
//    	}
//    }
    $.extend($.fn.combobox.defaults, {
        width: 155,
        limitToList : true,
        lazyLoad: true,
        emptyItemEnable : true,
        emptyItemValue : "",
        emptyItemText : "",
        filter: function (q, row) {
        	var opts = $.data(this, 'combobox').options;
            return (row[opts.textField] + "").toUpperCase().indexOf(q.toUpperCase()) >= 0;
        },
        loadFilter : function(data){
        	var opts = $.data(this, 'combobox').options;
        	data = addEmptyItem(opts,data);
        	$.data(this,'combo').options.panelHeight = Math.min(data.length, 10) * 25 + 2;
        	return data;
        },
        _loader: $.fn.combobox.defaults.loader,
        loader: function (param, success, error) {
            var $jq = $(this), opts = $jq.combobox('options');
            if(opts.loading) return false;
            if (!opts.query && !opts.codeType) {
            	return opts._loader.call(this, param, success, error);
            }
            function parseData(result) {
                if (result.code < 0 || !result.data) {
                    return error.call($jq[0], result.message);
                }
                result = result.data;
                mergeCodeData(opts,result.dataList);
                success((result.dataList));
            }
            function doLoad() {
                var queryInfo = getQueryInfo(opts,param);
                if (opts.query) {
                    fmx.CommonQueryService.query(queryInfo, parseData, error);
                } else if(opts.codeType) {
                    fmx.CommonQueryService.getSelectCodeData(queryInfo, parseData, error);
                }
            }
            if (opts.codeType) {
                var data = SELECT_CODE_DATAS[opts.codeType];
                if (data) {
                    return success($.extend([],data));
                }
            }
            doLoad();
        }
    });
    
    function mergeCodeData(opts,data) {
    	if(opts.codeType){
	        fmx.mergeSelectCodeValue(opts.codeType, opts.valueField, opts.textField, data);
	        SELECT_CODE_DATAS[opts.codeType] = $.extend([],data);   
    	}
    }
    
    function getQueryInfo(opts,param) {
    	var queryFields = [];
        if (opts.queryFields) {
            Array.prototype.push.apply(queryFields, opts.queryFields);
        }
        if (param && param.q) {
            if (opts.textField) {
                queryFields.push({
                    fieldName: opts.textField,
                    fieldValue: param.q,
                    operator: "ilikeAnywhere"
                });
            }
        }
        var queryInfo = {
            query: opts.query || opts.codeType,
            queryFields: queryFields,
            orderBy: opts.orderBy
        }
        return queryInfo;
    }
    
    $.extend($.fn.combobox.methods, {
        _setValue: $.fn.combobox.methods.setValue,
        setValue: function (jq, value) {
            return jq.each(function () {
                var $combobox = $(this);
                $combobox.combobox("setValues", value);
                $combobox.data("oldValues", $combobox.combobox("getValues"));
                $combobox.data("oldText", $combobox.combobox("getText"));
            });
        }

    });
    
    // init combobox
    function initCombobox($jq, options) {
        var comboboxList = [],codeTypes={};
        $jq.each(function () {
            var $combobox = $(this);
            var opts = $.extend({},$.fn.combobox.parseOptions(this), options);
            var codeType = opts['codeType'];
            if (!codeType){
                return _combobox.call($(this), opts);
            }
            $combobox.attr('comboname', $combobox.attr('name'));
            if (SELECT_CODE_OPTS[codeType]) {//select code options已加载,但data未加载
            	opts = extendComboboxCodeOpts(opts,SELECT_CODE_OPTS[codeType]);
            	if((!$.isArray(opts.queryFields) || opts.queryFields.length == 0) && SELECT_CODE_DATAS[codeType]){
            		opts.data = $.extend([],SELECT_CODE_DATAS[codeType]);
            		return _combobox.call($combobox, opts);
            	}
            	opts.loading=true;
            	_combobox.call($combobox, opts);
            	comboboxList.push($combobox);
            } else {//options和data都未加载
            	opts.loading=true;
                if (codeTypes[codeType]) codeTypes[codeType].push($combobox);
                else codeTypes[codeType] = [$combobox];
                _combobox.call($combobox, opts);
            }
        });
        var keys = Object.keys(codeTypes);
        if (keys.length > 0) {
            fmx.CommonQueryService.getSelectCodeOpts(keys, function (result) {
                if (result.code < 0 || !result.data) {
                    return $.fn.combogrid.defaults.onLoadError(result.message);
                };
                $.each(result.data, function (idx, item) {
                    SELECT_CODE_OPTS[item.codeType] = item;
                    $.each(codeTypes[item.codeType], function (i, jq) {
                    	var opts = extendComboboxCodeOpts(jq.data('combobox').options,item);
                    	if((!$.isArray(opts.queryFields) || opts.queryFields.length == 0) && SELECT_CODE_DATAS[item.codeType]){
                    		jq.combobox('loadData',$.extend([],SELECT_CODE_DATAS[item.codeType]));
                    	}else{                   	
                    		comboboxList.push(jq)
                    	}
                    });
                });
                if(comboboxList.length > 0){
                	initComboboxData(comboboxList);
                }
                $("body").trigger("resize");
            });
        }else if(comboboxList.length > 0){
        	initComboboxData(comboboxList);
        }
    }
    function extendComboboxCodeOpts(options, codeOpts) {
        var comboboxOptions, codeType = codeOpts.codeType;
        if (window['COMBO_OPTIONS'] && window['COMBO_OPTIONS'][codeType]) {
            comboboxOptions = window['COMBO_OPTIONS'][codeType];
        } else comboboxOptions = codeOpts;
       
        var opts = {
            codeType: codeType,
            idField: comboboxOptions.keyFieldName || codeOpts.keyFieldName,
            valueField: comboboxOptions.keyFieldName || codeOpts.keyFieldName,
            textField: comboboxOptions.labelFieldName || codeOpts.labelFieldName,
            queryFields: comboboxOptions.queryFields || codeOpts.queryFields
        };
        return $.extend(options,opts);
    }
   
    function initComboboxData(comboboxList){
    	var queryInfos = [],_queryInfos = [],codeComboboxs = {};
    	$.each(comboboxList,function(idx,$combobox){
    		var opts = $combobox.data('combobox').options;
    		var queryInfo = getQueryInfo(opts);
    		var _queryInfo = JSON.stringify(queryInfo);
    		var idx = _queryInfos.indexOf(_queryInfo);
    		if(idx == -1){
    			idx = queryInfos.length;
    			queryInfos.push(queryInfo);
    			_queryInfos.push(_queryInfo);
    		}
            if (codeComboboxs[idx]) codeComboboxs[idx].push($combobox);
            else codeComboboxs[idx] = [$combobox];
    	});
    	fmx.CommonQueryService.getSelectCodeDatas(queryInfos,function(result){
            if (result.code < 0) {
                return error(result.message);
            }    
            $.each(result.data,function(idx,data){
            	var cbs = codeComboboxs[idx];
            	$.each(cbs,function(i,$combobox){
            		var opts = $combobox.data('combobox').options;
            		//只保存没查询条件的数据
            		if(!$.isArray(opts.queryFields) || opts.queryFields.length == 0){
            			mergeCodeData(opts,data.dataList);
            		}
            		$combobox.combobox('loadData',$.extend([],data.dataList));
            	});
            });
    	},$.fn.combogrid.defaults.onLoadError);
    }
})(jQuery, fmx);
; (function ($, fmx) {
    var SELECT_CODE_OPTS = fmx.getSelectCodeOpts();
    
    function getQueryFields($jq,opts,param) {
    	 var queryFields = [];
         if (opts.queryFields) {
             queryFields = queryFields.concat(opts.queryFields);
         }
         if (opts.commonQueryFields) {
             queryFields = queryFields.concat(opts.commonQueryFields);
         }
         if (param && param.q) {
             queryFields.push({
                 fieldName: $jq.datagrid("getColumnFields").join(","),
                 fieldValue: param.q,
                 operator: "ilikeAnywhere"
             });
         }
         return queryFields;
    }
    
    /** ******** combogrid ********* */
    var _combogrid = $.fn.combogrid;

    $.fn.combogrid = function (options, param) {
        if (typeof options == "string") {
            this.each(function () {
                if (!$.data(this, "combogrid")) {
                    $(this).combogrid({});
                }
            });
            return _combogrid.apply(this, [options, param]);
        }
        initCombogrid(this, options || {});
        return this;
    };
    $.extend($.fn.combogrid,_combogrid);

    $.extend($.fn.combogrid.defaults, {
        width: 155,
        lazyLoad: true,
        panelWidth: 470,
        panelHeight: 200,
        pagination: true,
        rownumbers: true,
        limitToGrid:true,
        mode: "remote",
        _loader : $.fn.combogrid.defaults.loader,
        loader: function (param, success, error) {
            var $jq = $(this), opts = $jq.datagrid("options");
            if (!opts.codeType){
                return opts._loader.call(this, param, success, error);
            }
            //$jq.data("loading", true);
            if(!opts._autoLoad){ //第一次加载
            	opts._autoLoad = opts.value ? 2 : 1;
            	if(opts._autoLoad == 1){
            		return;
            	}
            }
            var queryFields = getQueryFields($jq, opts, param);
            if(opts._autoLoad == 2){
            	var queryField = {
            		fieldName : opts.valueField,
            		fieldValue : opts.value
            	}
        		if(opts.singleSelect){
        			queryField.fieldValue = opts.value;
        		}else{
        			queryField.operator='in';
        			queryField.fieldValue = opts.value.toString().split(opts.separator);			
        		}            	
            	queryFields.push(queryField);
            }
            var queryInfo = {
                query: opts.codeType,
                fieldCodeTypes: opts.fieldCodeTypes,
                queryFields: queryFields,
                orderBy: (param.sort ? param.sort + " " + param.order : (opts.orderBy || ""))
            };
            if (opts.pagination) {
                queryInfo['pagingInfo'] = {
                    pageSize: param.rows,
                    currentPage: param.page,
                    pageNo: param.page,
                    totalRows : $jq.datagrid('getPager').pagination('options').total
                };
            }
            fmx.CommonQueryService.getSelectCodeData(queryInfo, function(result){
                if(!result || result.code < 0) {
                    return error(result ? result.message : $.fn.datagrid.defaults.loadDataErrorMsg);
                }
                success(result);
            }, error);
        },

        // query result
        loadFilter: $.fn.datagrid.defaults.loadFilter,
        onShowPanel : function() {
        	var state = $.data(this,"combogrid");
        	if(state && state.grid) {
        		var state1 = state.grid.data("datagrid");
        		if(!state1.data || !state1.data.rows || state1.data.rows.length == 0 || state1.options._autoLoad == 2){
        			state1.options._autoLoad = 1;
        			state.grid.datagrid('reload');
        		}
        	}
        },
        /*onLoadSuccess: function (data) {
            var $combogrid = $(this), opts = $combogrid.combo("options");
            // cache selectCodeValues
            fmx.mergeSelectCodeValue(opts.codeType, opts.valueField, opts.textField, data.rows);
            //var $datagrid = $combogrid.combogrid("grid");
            //$datagrid.removeData("loading");
        },*/
        onLoadError: $.fn.datagrid.defaults.onLoadError,
//        inputEvents : $.extend({},$.fn.combogrid.defaults.inputEvents,{
//			blur: function(e){
//				var target = e.data.target;
//				var state = $.data(target, 'combogrid');
//				if(!state) return;
//				var opts = state.grid.data("datagrid").options;
//				if(opts.queryParams && opts.queryParams.q){
//					opts.queryParams.q=undefined;
//				}
//				$jq = $(target);
//				if(!$jq.combogrid("getText")){
//					$jq.combogrid("setValue",'');
//				}else if(state.options.limitToList && state.options.keyHandler.enter){
//					state.options.keyHandler.enter.call(target);
//				}
//			}        	
//        })
    });
    
    var setValuesMethod = $.fn.combogrid.methods.setValues;
    function loadValueText($jq,values) {
    	var state = $jq.data('combogrid');
    	if(!values){
    		values = [];
    	}else if(!$.isArray(values)){
    		values= values.toString().split(state.options.separator);
    	}    	
		var val=  $jq.combo('getValue');
		var strVal = values.join(state.options.separator);
		if(val && val == strVal){
			return;
		}else if(values.length == 0){
			state.options.selectedRows = [];
			setValuesMethod($jq,values);
			return;
		}
		//$.easyui.removeArrayItem(array,idField,idValue);
		//$.easyui.addArrayItem(array,idField,item);
		if(!state.options.codeType) {
			var gdState = state.grid.data('datagrid');
			var rows = [];
			if(gdState && gdState.data && $.isArray(gdState.data.rows)){
				for(var i = 0 ; i < gdState.data.rows.length;i++){
					$.easyui.addArrayItem(rows,state.options.idField,gdState.data.rows[i]);
				}
			}
			state.options.selectedRows = rows;
			setValuesMethod($jq,values);
			return;
		}
		var queryFields = getQueryFields($jq,state.options);
		var queryField = {
    		fieldName : state.options.valueField
    	};
		if(state.options.multiple){
			queryField.operator='in';
			queryField.fieldValue = values;
		}else{
			queryField.fieldValue = strVal;
		}
    	queryFields.push(queryField);
		var queryInfo = {
			query: state.options.codeType,
			queryFields : queryFields
		}
        function error(message) {
        	$.fn.datagrid.defaults.onLoadError(message);
        }
        fmx.CommonQueryService.getSelectCodeData(queryInfo, function(result){
            if(!result || result.code < 0 || !result.data) {
                return error(result ? result.message : $.fn.datagrid.defaults.loadDataErrorMsg);
            }
            var dataList = result.data.dataList;
            var txtField = state.options.textField;
            var valField = state.options.idField;
            var text = [],vals = [];
            var selectedRows = [];
        	$.each(dataList,function(i,item){
        		var v = item[valField] + "";
        		if(v == undefined || v == null){
        			return;
        		}
        		var found = false;
        		for(var i = 0 ;i<values.length;i++){
        			if((values[i] + "") == v){
        				found = true;
        				break;
        			}
        		}
        		if(!found){
        			return;
        		}
        		selectedRows.push(item);
        		var txt = item[txtField];
        		if(txt){
        			text.push(txt);
        		}
        		vals.push(v);
        		
        		if(!state.options.multiple){
        			return false;
        		}
        	});
        	state.options.selectedRows = selectedRows;
            $jq.combo('setText', text.join(state.options.separator));
            $jq.combo('setValues',vals);
        }, error);		
    }    
    
    // combogrid methods
    $.extend($.fn.combogrid.methods, {
        setQueryFields: function (jq, queryFields) {
            return jq.each(function () {
                $(this).combogrid("grid").datagrid("options").queryFields = queryFields;
            });
        },
		setValues: function(jq, values){
			return jq.each(function(){
				var $jq = $(this);
				loadValueText($jq,values);
			});
		}        
    });

    // init combogrids
    function initCombogrid($jq, options) {
        var codeTypes = {};
        $jq.each(function () {
            var $combogrid = $(this);
            var opts = $.extend({
            	unselectedValues:[],
            	mappingRows:[],
            	selectedRows: [],
            },$.fn.combogrid.parseOptions(this), options);
             var codeType = opts['codeType'] || $combogrid.attr("codeType");
            if (!codeType){
                return _combogrid.call($combogrid, opts);
            }
            $combogrid.attr('comboname', $combogrid.attr('name'));
            if (SELECT_CODE_OPTS[codeType]) {
            	initCombogridByCodeOpts($combogrid, opts, SELECT_CODE_OPTS[codeType]);
            } else {
            	$combogrid.data("opts",opts);
                if (codeTypes[codeType]) codeTypes[codeType].push($combogrid);
                else codeTypes[codeType] = [$combogrid];
            }
        });
        var keys = Object.keys(codeTypes);
        if (keys.length > 0) {
            fmx.CommonQueryService.getSelectCodeOpts(keys, function (result) {
                if (result.code < 0 || !result.data || result.data.length == 0) {
                    return $.fn.combogrid.defaults.onLoadError(result.message);
                };
                $.each(result.data, function (idx, item) {
                    SELECT_CODE_OPTS[item.codeType] = item;
                    $.each(codeTypes[item.codeType], function (i, jq) {
                    	var opts = jq.data("opts");
                    	jq.removeData("opts");
                    	initCombogridByCodeOpts(jq, opts,item);
                    });
                });
                $("body").trigger("resize");
            });
        }
    }
    function initCombogridByCodeOpts($combogrid, options, codeOpts) {
        var combogridOptions, codeType = codeOpts.codeType;
        if (window['COMBO_OPTIONS'] && window['COMBO_OPTIONS'][codeType]) {
            combogridOptions = window['COMBO_OPTIONS'][codeType];
        } else
            combogridOptions = $.extend({},codeOpts);
        var columns = combogridOptions.columns;
        if (!columns || columns.length == 0) {
            columns = [{
                field: combogridOptions.keyFieldName || codeOpts.keyFieldName
            }, {
                field: combogridOptions.labelFieldName || codeOpts.labelFieldName
            }];
        }
        var fieldCodeTypes = {},cols = [];
        $.each(columns,function(idx,column){
            var columnOption = $.extend({},column, {
               title: fmx.getI18nTitle(combogridOptions.i18nRoot,column.field, column.title),
               sortable: column.sortable == undefined ? true : (column.sortable == true || column.sortable == "true"),
               formatter: column.formatter || $.fn.datagrid.defaults.formatter
           });
           if (columnOption.codeType) {
               fieldCodeTypes[columnOption.field] = columnOption.codeType;
           }
           cols.push(columnOption);        	
        });
        var opts = {
            codeType: codeType,
            idField: combogridOptions.keyFieldName || codeOpts.keyFieldName,
            valueField : combogridOptions.keyFieldName || codeOpts.keyFieldName,
            textField: combogridOptions.labelFieldName || codeOpts.labelFieldName,
            columns: [cols],
            fieldCodeTypes: fieldCodeTypes,
            queryFields: combogridOptions.queryFields || codeOpts.queryFields
        };
        _combogrid.call($combogrid, $.extend(opts, options));
    }
})(jQuery, fmx);
;(function ($, fmx) {
    var SELECT_CODE_OPTS = fmx.getSelectCodeOpts();

    /** ******** combotree ********* */
    $.fn._combotree = $.fn.combotree;

    $.fn.combotree = function (options, param) {
        if (typeof options == "string") {
            this.each(function () {
                if (!$.data(this, "combotree")) {
                    $(this).combotree({});
                }
            });
        }
        return $.fn._combotree.apply(this, [options, param]);
    };

    $.fn.combotree.methods = $.fn._combotree.methods;
    $.fn.combotree.parseOptions = $.fn._combotree.parseOptions;
    $.fn.combotree.defaults = $.fn._combotree.defaults;

    $.extend($.fn.combotree.defaults, $.fn.tree.defaults, {
        panelWidth: 250,
        panelHeight: 300,
        width: 155,

        onLoadSuccess: function (node, data) {
            var $combotree = $(this);
            // cache selectCodeValues
            var codeType = $combotree.tree("options").codeType;
            var selectCodeDataObject = {};
            function handleNode(node) {
                selectCodeDataObject[node.id] = node.text;
                if (node.children) {
                    $.each(node.children, function (index, child) {
                        handleNode(child);
                    });
                }
            }
            $.each(data, function (index, node) {
                handleNode(node);
            });
            fmx.mergeSelectCodeValues(codeType,selectCodeDataObject);
        }
    });

    $.extend($.fn.combotree.methods, {

        _setValue: $.fn.combotree.methods.setValue,

        setValue: function (jq, value) {
            return jq
                .each(function () {
                    var $combotree = $(this);
                    $combotree.combotree("setValues", value ? (value + "").split(","): []);
                });
        }

    });

    // init combotrees
    function initCombotrees(jqInput, findings) {
        jqInput.each(function () {
            var $combotree = $(this);
            $combotree.attr("comboname", $combotree.attr("name"));
        });
        var codeTypes = {};
        jqInput.each(function () {
            var $combotree = $(this);
            var codeType = $combotree.attr("codeType");
            if (codeType && !codeTypes[codeType]) {
                codeTypes[codeType] = {};
            }
        });
        if ($.isEmptyObject(codeTypes)) {
            return;
        }
        var readyCodeTypes = [];
        var codeTypeList = [];
        for (var codeType in codeTypes) {
            if (SELECT_CODE_OPTS[codeType]) {
                readyCodeTypes.push(codeType);
            } else {
                codeTypeList.push(codeType);
            }
        }
        if (readyCodeTypes.length > 0) {
            setTimeout(function () {
                $.each(readyCodeTypes, function (i, codeType) {
                    initCombotreesByCodeType(jqInput, codeType,
                        SELECT_CODE_OPTS[codeType]);
                });
            }, 0);
        }
        if (codeTypeList.length > 0) {
            fmx.CommonQueryService.getSelectCodeOpts(codeTypeList, function (result) {
                setTimeout(function () {
                    for (var codeType in result) {
                        var selectCodeDefinition = result[codeType];
                        SELECT_CODE_OPTS[codeType] = selectCodeDefinition;
                        initCombotreesByCodeType(jqInput, codeType,
                            selectCodeDefinition);
                    }
                }, 0);
            });
        }
        delete findings.combotree;
    }
    
    function initCombotreesByCodeType(jqInput, codeType,
        selectCodeDefinition) {
        var options = {
            codeType: codeType,
            idField: selectCodeDefinition.keyFieldName,
            textField: selectCodeDefinition.labelFieldName,
            parentField: selectCodeDefinition.parentFieldName,
            orderBy: selectCodeDefinition.orderBy,
            queryFields: selectCodeDefinition.queryFields
        };
        jqInput.filter("[codeType='" + codeType + "']").each(function () {
            var $combotree = $(this);
            var value = $.data(this, "combotree") ? $combotree
                .combotree("getValue") : $(this).val();
            if ($.data(this, "combotree")) {
                $combotree._combotree($.extend(true, $combotree.combotree("options"), options));
            } else if ($.data(this, "combo")) {
                $combotree._combotree($.extend(true, $combotree.combo("options"),$.fn.combotree.parseOptions(this), options));
            } else {
                $combotree.combotree($.extend(true, $.fn.combotree.parseOptions(this), options));
            }
            if (value) {
                $combotree.combotree("setValue", value);
            }
            if ($combotree.combotree("options").onReady) {
                $combotree.combotree("options").onReady.apply($combotree[0]);
            }
            if ($combotree.data("onReady")) {
                $combotree.data("onReady").apply($combotree[0]);
            }
        });
        // jqTh.filter("[codeType='" + codeType + "']").each(function () {
        //     var $th = $(this);
        //     var $datagrid = $th.closest("table");
        //     var columnOption = $datagrid.datagrid("getColumnOption", $th
        //         .attr("field"));
        //     columnOption.editor = {
        //         type: "combotree",
        //         init: true,
        //         options: columnOption.editor.options ? $.extend(
        //             columnOption.editor.options, options) : options
        //     };
        // });
    }
    $($.parser).on("onBefore",function(e,ctx,findings){
      initCombotrees(findings.combotree,findings);
    });
})(jQuery, fmx);
;(function ($) {

    // treegrid methods
    $.extend($.fn.treegrid.methods, {

        getSelectedId: function (jq) {
            var $datagrid = $(jq[0]);
            var selected = $datagrid.treegrid("getSelected");
            if (selected) {
                var idField = $datagrid.treegrid("options").idField;
                return $datagrid.treegrid("getSelected")[idField];
            } else {
                return null;
            }
        },

        getSelectionsId: function (jq) {
            var $datagrid = $(jq[0]);
            var idField = $datagrid.treegrid("options").idField;
            var rows = $datagrid.treegrid("getSelections");
            var selectionsId = [];
            for (var i = 0; i < rows.length; i++) {
                selectionsId.push(rows[i][idField]);
            }
            return selectionsId;
        },

        forceEndEdit: $.fn.datagrid.methods.forceEndEdit,

        _append: $.fn.treegrid.methods.append,

        append: function (jq, param) {
            return jq.each(function () {
                var $datagrid = $(this);
                if (!$datagrid.treegrid("endEditWithReturn")) {
                    return;
                }
                var idField = $datagrid.treegrid("options").idField;
                var parentField = $datagrid.treegrid("options").parentField;
                var treeField = $datagrid.treegrid("options").treeField;
                if (!$.isArray(param.data)) {
                    param.data = [param.data];
                }
                $.each(param.data, function (index, row) {
                    row[parentField] = param.parent;
                    if (!row[idField]) {
                        row[idField] = "id_" + new Date().getTime();
                    }
                    if (!row[treeField]) {
                        row[treeField] = "new";
                    }
                });
                $datagrid.treegrid("_append", param);
                // select and edit
                var $tr = $datagrid.treegrid("options").editConfig.getTr(this,
                    param.data[0][idField])[0];
                if ($tr) {
                    $tr.click();
                }
                $.data(this, "datagrid").insertedRows.push(param.data[0]);
            });
        },

        updateRow: function (jq, param) {
            var $datagrid = $(jq[0]);
            $datagrid.treegrid("forceEndEdit");
            var target = jq[0];
            var opts = $.data(target, "datagrid").options;
            var insertedRows = $.data(target, "datagrid").insertedRows;
            var updatedRows = $.data(target, "datagrid").updatedRows;
            if (insertedRows.indexOf(param.row) == -1) {
                var oldRow = opts.editConfig.getRow(target, param.id);
                if (oldRow == param.row) {
                    // no way to check if the row has been changed
                    updatedRows.push(param.row);
                } else {
                    var changed = false;
                    for (var field in oldRow) {
                        if (oldRow[field] != param.row[field]) {
                            changed = true;
                            break;
                        }
                    }
                    ;
                    $.extend(oldRow, param.row);
                    param.row = oldRow;
                    if (changed) {
                        if (updatedRows.indexOf(param.row) == -1) {
                            updatedRows.push(param.row);
                        }
                    }
                }
            }
            return $datagrid.treegrid("refresh", param.id);
        },

        __remove: $.fn.treegrid.methods.remove,

        _remove: function (jq, id) {
            return jq.each(function () {
                var $datagrid = $(this);
                var insertedRows = $datagrid
                    .treegrid("_getChanges", "inserted");
                var deletedRows = $datagrid.treegrid("_getChanges", "deleted");
                var row = $datagrid.treegrid("find", id);
                markDeletedRows(row);
                function markDeletedRows(row) {
                    if (insertedRows.indexOf(row) >= 0) {
                        insertedRows.remove(row);
                    } else {
                        if (deletedRows.indexOf(row) == -1) {
                            deletedRows.push(row);
                        }
                    }
                    if (row.children) {
                        $.each(row.children, function (index, row) {
                            markDeletedRows(row);
                        });
                    }
                }
                ;
                $datagrid.treegrid("__remove", id);
            });
        },

        remove: function (jq, id) {
            return jq.each(function () {
                var $datagrid = $(this);
                $datagrid.treegrid("forceEndEdit").treegrid("_remove", id);
            });
        },

        removeSelectedNodes: function (jq) {
            return jq.each(function () {
                var $datagrid = $(this);
                $datagrid.treegrid("forceEndEdit");
                $.each($datagrid.treegrid("getSelectionsId"), function (index,
                    selectedId) {
                    $datagrid.treegrid("_remove", selectedId);
                });
            });
        },

        _loadData: $.fn.treegrid.methods.loadData,

        loadData: function (jq, data) {
            return jq.each(function () {
                var $datagrid = $(this);
                $datagrid.treegrid("forceEndEdit");
                $datagrid.treegrid("_loadData", data);
            });
        },

        getChanges: function (jq, type) {
            var $datagrid = $(jq[0]);
            var idField = $datagrid.treegrid("options").idField;
            var parentField = $datagrid.treegrid("options").parentField;
            var rows = $datagrid.datagrid("getChanges", type);
            $.each(rows, function (index, row) {
                fixChildrenParentId(row);
            });
            function fixChildrenParentId(row) {
                if (row.children) {
                    $.each(row.children, function (childIndex, childRow) {
                        childRow[parentField] = row[idField];
                        fixChildrenParentId(childRow);
                    });
                }
            }
            return rows;
        },

        refreshSavedData: function (jq, savedRows) {
            return jq.each(function () {
                var $datagrid = $(this);
                var idField = $datagrid.treegrid("options").idField;
                var insertedRows = $datagrid
                    .treegrid("_getChanges", "inserted");
                var updatedRows = $datagrid.treegrid("_getChanges", "updated");
                var refreshRows = [].concat(insertedRows).concat(updatedRows);
                for (var i = 0; i < refreshRows.length; i++) {
                    $datagrid.treegrid("options").editConfig.getTr(this,
                        refreshRows[i][idField]).attr("node-id",
                        savedRows[i][idField]);
                    $.extend(refreshRows[i], savedRows[i]);
                    $datagrid.treegrid("refresh", savedRows[i][idField]);
                }
                $datagrid.datagrid("acceptChanges");
            });
        },

        reloadAndSelect: function (jq, id) {
            return jq.each(function () {
                var $treegrid = $(this);
                $treegrid.data("selectedId", id);
                $treegrid.treegrid("reload");
            });
        }

    });
})(jQuery);
;(function ($,fmx) {
	
	function isValidDate(el,date) {
		var d = parser.call(el,date);
		if(d instanceof Date) {
			return !isNaN(d.getYear()) && d.getYear() > 0;
		}else if(!d) {
			return false;
		}
		return true;
	}
	
	function parser(s){
        if(!s) return null;
        if(s instanceof Date) return s;
        if(typeof s == 'string' && s.indexOf('T') > -1){
        	return new Date(s);
        }
        var pattern = getPattern(this);
        var mom = moment(s, pattern,true);
        if(mom.isValid()) {
        	return mom.toDate();
        }
        return null;		
	}
	
	function getPattern(el) {
		var state = $.data(el,"datebox") || $.data(el,'validatebox');
		if(!state){
			return  pageContext.defaultDateFormat || 'YYYY-MM-DD';
		}
		return (state.options ?  state.options.pattern : null) ||  pageContext.defaultDateFormat || 'YYYY-MM-DD';
	}
	var _parseOptions = $.fn.datebox.parseOptions;
	$.fn.datebox.parseOptions = function(target){
		var opts = _parseOptions(target);
		var pattern = target.getAttribute('pattern');
		if(pattern){
			opts.pattern = pattern;
		}
		return opts;
	};
	
    /** ******** datebox ********* */
    $.extend($.fn.datebox.defaults, {
        width: 155,
        validType : 'date',
        formatter: function (date) {
        	var pattern = getPattern(this);
            var val = fmx.formatters.formatDate(date,pattern);
            return val == 'Invalid date' ? null : val;
        },

        parser: function (s) {
        	return parser.call(this,s);
        },
        validator : function(date){
        	return isValidDate(this,date);
        },
        validateOnBlur : true
    });
    //日期规则
    $.extend($.fn.datebox.defaults.rules,{
    	date : {
    		validator : function(value){
    			return isValidDate(this,value);
    		},
    		message : '请输入正确的日期格式！'
    	}
    });
    var _setVal = $.fn.datebox.methods.setValue;
    $.fn.datebox.methods.setValue = function(jq, value) {
    	if(value instanceof Date){
    		return _setVal(jq,value);
    	}
    	var val = parser.call(this,value);
    	if(val){
    		return _setVal(jq,val);
    	}
    	return _setVal(jq,null);
    }
    $.fn.calendar.defaults.validator = $.fn.datebox.defaults.validator;
    
/****************************    
easyui-datetimebox
****************************/    
    function parseTime(el,s) {
		if ($.trim(s) == ''){
			return new Date();
		}
		var state = $.data(el,"datetimebox") || $.data(el,'validatebox');
		if(!state || !state.options) return null;
		if(!state.options.strict){
			var dt = s.split(' ');
			var d = $.fn.datebox.defaults.parser.call(el,dt[0]);
			if (dt.length < 2 || !d){
				return d;
			}
			var pattern; 
			if(state.options.showSeconds){
				pattern = 'HH'+state.options.timeSeparator+'mm'+state.options.timeSeparator+'ss';
			}else{
				pattern = 'HH'+state.options.timeSeparator+'mm';
			}
			var time = moment(dt[1],pattern,true);
			if(time.isValid()){
				d.setHours(time.hour());
				d.setMinutes(time.minute());
				d.setSeconds(time.second());
				return d;
			}
		}else{
			var pattern = getPattern(el);
			if(state.options.showSeconds){
				pattern = pattern + ' HH'+state.options.timeSeparator+'mm'+state.options.timeSeparator+'ss';
			}else{
				pattern = pattern + ' HH'+state.options.timeSeparator+'mm';
			}
			var m = moment(s,pattern,true);
			if(m.isValid()){
				return m.toDate();
			}
		}
		return null;
    }
	
    $.extend($.fn.datetimebox.defaults, {
    	validType : 'datetime',
    	validateOnBlur : true,
    	strict: false,/**严格模式,即是必须输入时分秒**/
        parser: function (s) {
        	return parseTime(this,s);
        },
        validator : function(date){
        	return !!parseTime(this,date);
        }    	
    });
    
    $.extend($.fn.datetimebox.defaults.rules,{
    	datetime : {
    		validator : function(value){
    			return !!parseTime(this,value);
    		},
    		message : '请输入正确的日期时间格式！'
    	}
    });
})(jQuery,fmx);
; (function ($, fmx) {
    /** ******** form ********* */
    $.fn.form._parseOptions = $.fn.form.parseOptions;
    $.fn.form.parseOptions = function (target) {
        var opts = $.fn.form._parseOptions.call(target, target);
        if (!opts['contentType']) {
            opts['contentType'] = target.getAttribute('contentType') || target.getAttribute('content-type') || target.getAttribute('enctype');
        }
        if(!opts['validateOnClearAndRest']){
        	var val = target.getAttribute('validateOnClearAndRest');
        	opts.validateOnClearAndRest = val == true || val == 'true';
        }
        if (opts['url']) {
            opts.url = $url(opts.url);
        }
        if (opts['contentType']) {
            opts.iframe = opts.contentType.toLowerCase().indexOf('json') < 0;
        }
        if(target.getAttribute('maskit')){
          opts['maskit'] = target.getAttribute('maskit');
        }
        if(opts['maskit']){
        	opts['maskit'] = fmx.utils.getJquery(opts['maskit']);
        }
        
        return opts;
    };
    
    function submitForm(target, options) {
        var opts = $.data(target, 'form').options;
        $.extend(opts, options || {});

        var param = $.extend({}, opts.queryParams);
        if (opts.onSubmit.call(target, param) == false) {
            return;
        }
        if(!opts.isDownload){
          if ($.data(target, 'submitting'))
              return $.messager.alert('', $.fn.form.defaults.submittingMsg);
          else {
            $.data(target, 'submitting', true);
            if(opts.maskit) opts.maskit.maskit();
          }
        }
        // $(target).find('.textbox-text:focus').blur();
        var input = $(target).find('.textbox-text:focus');
        input.triggerHandler('blur');
        input.focus();

        var disabledFields = null; // the fields to be disabled
        if (opts.dirty) {
            var ff = []; // all the dirty fields
            $.map(opts.dirtyFields, function (f) {
                if ($(f).hasClass('textbox-f')) {
                    $(f).next().find('.textbox-value').each(function () {
                        ff.push(this);
                    });
                } else {
                    ff.push(f);
                }
            });
            disabledFields = $(target).find('input[name]:enabled,textarea[name]:enabled,select[name]:enabled')
                .filter(function () {
                    return $.inArray(this, ff) == -1;
                });
            disabledFields.attr('disabled', 'disabled');
        }
        
        if (opts.ajax) {
            if (opts.iframe) {
                submitFormByIframe(target, param);
            } else {
                submitFormByXhr(target, param);
            }
        } else {
            $(target).submit();
        }

        if (opts.dirty) {
            disabledFields.removeAttr('disabled');
        }
    }

    function submitFormByIframe(target, param) {
        var opts = $.data(target, 'form').options;
        var frameId = 'easyui_frame_' + (new Date().getTime());
        var frame = $('<iframe id=' + frameId + ' name=' + frameId + '></iframe>').appendTo('body').attr('src', window.ActiveXObject ? 'javascript:false' : 'about:blank');
        frame.css({
            position: 'absolute',
            top: -1000,
            left: -1000
        });
        frame.bind('load', cb);

        submit(param);

        function submit(param) {
            var form = $(target);
            if (opts.url) {
                form.attr('action', opts.url);
            }
            var t = form.attr('target'), a = form.attr('action');
            form.attr('target', frameId);
            var paramFields = $();
            try {
                for (var n in param) {
                    var field = $('<input type="hidden" name="' + n + '">').val(param[n]).appendTo(form);
                    paramFields = paramFields.add(field);
                }
                checkState();
                form[0].submit();
            } finally {
                form.attr('action', a);
                t ? form.attr('target', t) : form.removeAttr('target');
                paramFields.remove();
            }
        }

        function checkState() {
            var f = $('#' + frameId);
            if (!f.length) {
                return
            }
            try {
                var s = f.contents()[0].readyState;
                if (s && s.toLowerCase() == 'uninitialized') {
                    setTimeout(checkState, 100);
                }
            } catch (e) {
                cb();
            }
        }

        var checkCount = 10;
        function cb() {
            var f = $('#' + frameId);
            if (!f.length) {
                return
            }
            f.unbind();
            var data = '';
            try {
                var body = f.contents().find('body');
                data = body.html();
                if (data == '') {
                    if (--checkCount) {
                        setTimeout(cb, 100);
                        return;
                    }
                }
                var ta = body.find('>textarea');
                if (ta.length) {
                    data = ta.val();
                } else {
                    var pre = body.find('>pre');
                    if (pre.length) {
                        data = pre.html();
                    }
                }
            } catch (e) {
            }
            opts.success.call(target, data);
            setTimeout(function () {
                $.data(target, 'submitting', false);
                if(opts.maskit) opts.maskit.maskit('unmask');
                f.unbind();
                f.remove();
            }, 100);
        }
    }
    function submitFormByXhr(target, param) {
        var opts = $.data(target, 'form').options, formData, contentType = false;
        if (!opts.contentType || opts.contentType.toLowerCase().indexOf('json') == -1) {
            formData = new FormData($(target)[0]);
            for (var name in param) {
                formData.append(name, param[name]);
            }
        } else {
            var data = $(target).form('getData');
            $.extend(true, data, param);
            formData = JSON.stringify(data);
            contentType = 'application/json;charset=utf-8';
        }
        $.ajax({
            url: opts.url,
            type: 'post',
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            var total = e.total;
                            var position = e.loaded || e.position;
                            var percent = Math.ceil(position * 100 / total);
                            opts.onProgress.call(target, percent);
                        }
                    }, false);
                }
                return xhr;
            },
            data: formData,
            dataType: 'html',
            cache: false,
            contentType: contentType,
            processData: false,
            complete: function (res) {
                $.data(target, 'submitting', false);
                if(opts.maskit) opts.maskit.maskit('unmask');
                opts.success.call(target, res.responseText,res);
            }
        });
    }
    
	/**
	 * clear the form fields
	 */
	function clear(target){
		$('input,select,textarea', target).each(function(){
			var t = this.type, tag = this.tagName.toLowerCase();
			if (t == 'text' || t == 'hidden' || t == 'password' || tag == 'textarea'){
				this.value = '';
			} else if (t == 'file'){
				var file = $(this);
				if (!file.hasClass('textbox-value')){
					var newfile = file.clone().val('');
					newfile.insertAfter(file);
					if (file.data('validatebox')){
						file.validatebox('destroy');
						newfile.validatebox();
					} else {
						file.remove();
					}
				}
			} else if (t == 'checkbox' || t == 'radio'){
				this.checked = false;
			} else if (tag == 'select'){
				this.selectedIndex = -1;
			}
			
		});
		
		var form = $(target);
		var opts = $.data(target, 'form').options;
		for(var i=opts.fieldTypes.length-1; i>=0; i--){
			var type = opts.fieldTypes[i];
			var field = form.find('.'+type+'-f');
			if (field.length && field[type]){
				field[type]('clear');
			}
		}
		if(opts.validateOnClearAndRest){
			form.form('validate');
		}
	}    
	
	function reset(target){
		target.reset();
		var form = $(target);
		var opts = $.data(target, 'form').options;
		for(var i=opts.fieldTypes.length-1; i>=0; i--){
			var type = opts.fieldTypes[i];
			var field = form.find('.'+type+'-f');
			if (field.length && field[type]){
				field[type]('reset');
			}
		}
		if(opts.validateOnClearAndRest){
			form.form('validate');
		}
	}	
    
    var _load = $.fn.form.methods.load;
    function parseLoadData(target,data){
      if(data && ($.isPlainObject(data))){
        data = fmx.utils.paramObject(data);
        _load($(target),data);
        $.data(target,'oldData',data);
      }
    }
    function load(target,data) {
      var opts = $.data(target, 'form').options;
      
      if (typeof data == 'string'){
        var param = {};
        if (opts.onBeforeLoad.call(target, param) == false) return;
        if(data.indexOf('/rest/') == 0){
          data = $url(data);
        }
        $.ajax({
          url: data,
          data: param,
          dataType: 'json',
          success: function(data){
            if($.type(data) == 'string'){
              data = $.parseJSON(data);
            }
            if(data.code < 0){
              $.messager.alert('错误提示',data.message || '数据加载出错了!','error');
              opts.onLoadError.apply(target, data);
              return;
            }else if(data.data){
              data = data.data;
            }
            parseLoadData(target,data);
          },
          error: function(){
            opts.onLoadError.apply(target, arguments);
          }
        });
      } else {
        parseLoadData(target,data);
      }
    }
    
    $.extend($.fn.form.defaults, {
        submittingMsg: 'Please waiting for the form is submitting.',
        validateOnClearAndRest : false
    });
    $.extend($.fn.form.methods, {
		clear: function(jq){
			return jq.each(function(){
				clear(this);
			});
		},
		reset: function(jq){
			return jq.each(function(){
				reset(this);
			});
		},    	
        load: function(jq, data){
          return jq.each(function(){
            load(this, data);
          });
        },
        submit: function (jq, options) {
            return jq.each(function () {
                submitForm(this, options);
            });
        },
        setData: function (jq, data) {
            return jq.form("load", data);
        },

        getData: function (jq) {
            var $form = $(jq[0]);
            var formValues = {};
            var input = $form.find('.textbox-text:focus');
            input.triggerHandler('blur');
            input.focus();            
            $form.find("input[name][class!='textbox-value'],textarea[name],select[name]").each(function () {
                var $input = $(this);
                var name = $input.attr("name");
                if ($input.attr("type") == "checkbox") {
                    formValues[name] = function () {
                        var values = [];
                        $form.find("input[name='" + name + "']:checked").each(
                            function () {
                                values.push($(this).attr("on")
                                    || $(this).attr("value"));
                            });
                        return values.join(',');
                    } ();
                } else if ($input.attr("type") == "radio") {
                    formValues[name] = $form.find("input[name='" + name + "']:checked").attr("value");
                } else if ($input.hasClass("easyui-numberbox")) {
                    formValues[name] = $input.numberbox("getValue");
                } else {
                    formValues[name] = $input.val();
                }
            });
            $form.find("input[comboname],select[comboname],input[textboxname]").each(function () {
                var $input = $(this), name = $input.attr("comboname") || $input.attr("textboxname");
                var state = $.data(this, 'combo') || $.data(this, 'textbox'), value;
                var multiple = !!$input.attr('multiple');
                if (!state) {
                    formValues[name] = $input.val();
                } else if (multiple) {
                    formValues[name] = $input.combo("getValues").join(',');
                } else {
                    formValues[name] = $input.textbox('getValue');
                }
            });
            return $.extend({}, $form.data("data"), formValues);
        },

        getQueryFields: function (jq) {
            var $form = $(jq[0]);
            var input = $form.find('.textbox-text:focus');
            input.triggerHandler('blur');
            input.focus();               
            var queryFields = [];
            var handledMultiples = [];
            $form.find("input[name][class!='textbox-value'],textarea[name],select[name]").each(function () {
                var $input = $(this);
                var name = $input.attr("name");
                var value = $input.val();
                if (!value || handledMultiples.indexOf(name) >= 0) {
                    return;
                }
                var fieldType = $input.attr("dataType");
                var operator = $input.attr("operator");
                if ($input.attr("type") == "checkbox") {
                    operator = $input.closest("[operator]").attr("operator");
                    var values = [];
                    $form.find("input[name='" + name + "']:checked").each(function () {
                        values.push($(this).attr("on") || $(this).attr("value"));
                    });
                    queryFields.push({
                        fieldName: name,
                        fieldType: "String[]",
                        fieldStringValue: values.join(","),
                        operator: operator
                    });
                    handledMultiples.push(name);
                    return;
                }
                if ($input.attr("type") == "radio") {
                    operator = $input.closest("[operator]").attr("operator");
                    value = $form.find("input[name='" + name + "']:checked").attr("value");
                    queryFields.push({
                        fieldName: name,
                        fieldType: fieldType,
                        fieldStringValue: value,
                        operator: operator
                    });
                    handledMultiples.push(name);
                    return;
                }
                if ($input.hasClass("easyui-numberbox")) {
                    value = $input.numberbox("getValue");
                }
                queryFields.push({
                    fieldName: name,
                    fieldType: fieldType,
                    fieldStringValue: value + "",
                    operator: operator
                });
            });
            $form.find("input[comboname],select[comboname],input[textboxname]").each(function () {
                var $input = $(this), operator = $input.attr("operator");
                var state = $.data(this, 'combo'), name = $input.attr("comboname") || $input.attr('textboxname'), value;
                var multiple = !!$input.attr('multiple');
                if (!state) {
                    value = $input.val();
                } else if (multiple) {
                    value = $input.combo("getValues");
                } else {
                    value = $input.textbox("getValue");
                }
                if (!value || value == '' || value.length == 0) return;
                queryFields.push({
                    fieldName: name,
                    fieldType: multiple ? ($input.attr('dataType') || "String[]") : $input.attr('dataType'),
                    fieldStringValue: multiple ? value.join(",") : value,
                    operator: operator
                });
            });
            return queryFields;
        },

        dataChanged: function (jq) {
            var $form = $(jq[0]);
            return JSON.stringify($form.data("oldData")) != JSON.stringify($form.form("getData"));
        },

        disable: function (jq) {
            return jq.each(function () {
                var $form = $(this);
                $form.find("input[name]:not(.combo-value):not([disabled_fixed],[readonly_fixed])").attr("disabled", "disabled");
                $form.find("textarea[name]:not([disabled_fixed],[readonly_fixed])").attr("disabled", "disabled");
                $form.find("input.combo-f:not([disabled_fixed],[readonly_fixed])").combo("disable");
            });
        },

        enable: function (jq) {
            return jq.each(function () {
                var $form = $(this);
                $form.find("input[name]:not(.combo-value):not([disabled_fixed],[readonly_fixed])").removeAttr("disabled");
                $form.find("textarea[name]:not([disabled_fixed],[readonly_fixed])").removeAttr("disabled");
                $form.find("input.combo-f:not([disabled_fixed],[readonly_fixed])").combo("enable");
            });
        },

        readonly: function (jq, readonly) {
            return jq.each(function () {
                var $form = $(this);
                readonly = readonly == undefined ? true : readonly;
                $form.find("input[name]:not(.combo-value):not([disabled_fixed],[readonly_fixed])")
                     .attr("readonly", readonly);
                $form.find("textarea[name]:not([disabled_fixed],[readonly_fixed])")
                     .attr("readonly", readonly);
                $form.find("input.combo-f:not([disabled_fixed],[readonly_fixed])")
                     .combo("readonly", readonly);
            });
        },

        fitHeight: function (jq) {
            return jq.each(function () {
                var $form = $(this);
                if ($form.data("fittedHeight")) {
                    return;
                }
                if ($form.find("table").size() == 0) {
                    return;
                }
                if ($form.closest(".panel:hidden").size() != 0) {
                    return;
                }
                var $panel = $form.closest("div[region='north'], div[region='south']");
                if ($panel.size() > 0) {
                    var $div = $("<div/>");
                    $div.append($panel.children()).appendTo($panel);
                    var height = $div.height() + 4;
                    if (!$panel.panel("options").noheader
                        && $panel.panel("options").title) {
                        height += 26;
                    }
                    $panel.panel("resize", {
                        height: height
                    });
                    $panel.closest(".easyui-layout").layout("resize");
                }
                $form.data("fittedHeight", true);
            });
        },
        resetOld : $.fn.form.methods.reset,
		reset: function(jq){
			return jq.each(function(){
				var target = this;
				//$.fn.form.methods.resetOld($(target));
				$('input,select,textarea', target).each(function(){
					var $jq = $(this),t = this.type, tag = this.tagName.toLowerCase();
					if(this.hasAttribute('textboxname')) {
						var cls = $jq.attr('class') || '';
						if(cls.indexOf('combogrid-f') > -1){
							$jq.combogrid('reset');
						}else if(cls.indexOf('combobox-f') > -1){
							$jq.combobox('reset');
						}else if(cls.indexOf('textbox-f') > -1){
							$jq.textbox('reset');
						}
					}else if($jq.hasClass('textbox-value') || $jq.hasClass('textbox-text')){
						return;
					}else if (t == 'text' || t == 'hidden' || t == 'password' || tag == 'textarea'){
						this.value = '';
					} else if (t == 'file'){
						var file = $(this);
						if (!file.hasClass('textbox-value')){
							var newfile = file.clone().val('');
							newfile.insertAfter(file);
							if (file.data('validatebox')){
								file.validatebox('destroy');
								newfile.validatebox();
							} else {
								file.remove();
							}
						}
					} else if (t == 'checkbox' || t == 'radio'){
						this.checked = false;
					} else if (tag == 'select'){
						this.selectedIndex = -1;
					}
					
				});
			});
		}

    });

//    var _form = $.fn.form;
//    $.fn.form = function(options, param) {
//      var isMethod = typeof options == 'string',val;
//      this.each(function(){
//        var state = $.data(this,'form');
//        if(state) {
//          val = _form.call($(this),options,param);
//        }else{
//           $jq = $(this);
//           val = _form.call($jq,options,param);
//           var data = $.fn.form.methods.getData($jq);
//           $.data(this,'oldData',data);
//        }
//      });
//      if(isMethod) return val;
//      return this;
//    }
//    $.extend(true,$.fn.form,_form);
    
    // init forms
    function initForms(jq) {
        // mark the disabled and readonly fields
        $("input[disabled]", jq).attr("disabled_fixed", true);
        $("textarea[disabled]", jq).attr("disabled_fixed", true);
        $("input[readonly]", jq).attr("readonly_fixed", true);
        $("textarea[readonly]", jq).attr("readonly_fixed", true);
        // add validatebox class for required input
        // $("input[required]:not(.easyui-validatebox)", jq).validatebox();
        // auto format form items into columns
        jq.filter("[columns]").each(function () {
            var $form = $(this);
            var $div = $("<div/>").insertBefore($form);
            var columns = $form.attr("columns") || 3;
            var vertical = ($form.attr("direction") || pageContext['formTabIndexDirection']) == "down";
            // $form.find("textarea").each(function (index, textarea) {
            //     var $textarea = $(textarea);
            //     if ($textarea.css("display") == "none") {
            //         $textarea.attr("type", "hidden");
            //     }
            // });
            var $inputs = $form.children(":not([type=hidden])");
            $form.detach();
            if (vertical) {
                var rows = Math.floor($inputs.size() / columns);
                if ($inputs.length % columns > 0) {
                    rows++;
                }
                var verticalInputs = [];
                for (var i = 0; i < rows; i++) {
                    for (var j = 0; j < columns; j++) {
                        verticalInputs.push($inputs[i + j * rows]);
                    }
                }
                $inputs = $(verticalInputs);
                $form.find("input").each(function (index, input) {
                    $(input).attr("tabindex", index + 1);
                });
            }
            var $table = $("<table/>").appendTo($form);
            var $tr;
            var indexInRow = 0;
            $inputs.each(function (index, input) {
                var $input = $(input);
                if (indexInRow == 0 || indexInRow >= columns) {
                    $tr = $("<tr/>").appendTo($table);
                    indexInRow = 0;
                }
                if (!input) {
                    return;
                }
                var $next = $input.next();
                var i18nKey = $input.attr("name");
                if (!i18nKey) {
                    i18nKey = $input.find("[name]").attr("name");
                }
                if (!i18nKey && $next.hasClass("combo")) {
                    i18nKey = $next.find("[name]").attr("name");
                }
                if (!i18nKey) {
                    i18nKey = $input.attr("comboname");
                }
                if (!i18nKey) {
                    i18nKey = $input.find("[comboname]").attr("comboname");
                }
                var title = $input.attr("title");
                if (title) {
                    $input.removeAttr("title");
                } else {
                    title = $input.find("[name]").attr("title");
                    if (title) {
                        $input.find("[name]").removeAttr("title");
                    }
                }
                var colspan = $input.attr("colspan");
                if (!colspan) {
                    colspan = $input.find("[name]").attr("colspan");
                }
                var label = fmx.getI18nTitle($form.attr("i18nRoot"), i18nKey, title);
                if (label == "NONE") {
                    //
                } else if (label) {
                    if ($input.attr("required")
                        || $input.find("[required]").size() > 0) {
                        label = "<span style='color: red;'>* </span>" + label;
                    }
                    $tr.append("<td class='form-label' align='right'> " + label
                        + "</td>");
                } else {
                    $tr.append("<td class='form-label' />");
                }
                var $td = $("<td/>").appendTo($tr).append($input);
                if ($next.hasClass("combo")) {
                    $td.append($next);
                }
                indexInRow++;
                if ((colspan && !vertical) || label == "NONE") {
                    colspan = parseInt(colspan) || 1;
                    indexInRow += colspan - 1;
                    colspan = colspan * 2 - 1;
                    if (label == "NONE") {
                        colspan++;
                    }
                    $td.attr("colspan", colspan);
                    $input.css("width", "100%");
                }
            });
            $form.insertAfter($div);
            $div.detach();
        });
    }
    $($.parser).on("onBefore",function(e,ctx,findings){
      initForms(findings.form);
    }).on("onComplete",function(e,ctx,findings){
      findings.form.each(function(){
        var data = $.fn.form.methods.getData($(this));
        $.data(this,'oldData',data);
      });
    });
})(jQuery, fmx);
;(function ($,fmx) {
    /** ******** linkbuttons ********* */
//    $.fn.linkbutton._parseOptions = $.fn.linkbutton.parseOptions;
//    $.fn.linkbutton.parseOptions = function (target) {
//        var $jq = $(target), opts = $.fn.linkbutton._parseOptions(target);
//        var cmd = opts['command'] || $jq.attr('command');
//        if (cmd) {
//            opts['command'] = new Function(cmd);
//        }
//        return opts;
//    }
    $.extend($.fn.linkbutton.methods, {
        forceDisable: function (jq) {
            return jq.each(function () {
                var $linkbutton = $(this);
                $linkbutton.data("forceDisable", true);
                $linkbutton.linkbutton("disable");
            });
        },

        _enable: $.fn.linkbutton.methods.enable,

        enable: function (jq) {
            return jq.each(function () {
                var $linkbutton = $(this);
                if (!$linkbutton.data("forceDisable")) {
                    $linkbutton.linkbutton("_enable");
                }
            });
        }
    });

    // init linkbuttons
    function initLinkbuttons(jq) {
        jq.each(function () {
            var $linkbutton = $(this);
            var code = $linkbutton.attr("code");
            if (code && !fmx.checkFunctionAuthorization(code)) {
            	if($linkbutton.attr('hideNoPermission')){
            		$linkbutton.detach();
            	}else{
            		$linkbutton.linkbutton("forceDisable");
            	}
            }
        });
    }
    $($.parser).on("onComplete",function(e,ctx,findings){
      initLinkbuttons(findings.linkbutton);
    });
})(jQuery,fmx);
;(function ($) {

    /** ******** messager ********* */
    $.extend(true,$.messager.defaults, {
        toastTimeout: 1000
    });

    $.messager.toast = function (title, msg, icon, fn) {
        var $win = $.messager.alert(title, msg, icon, fn);
        $win.parent().find(".window-header").hide();
        $win.find(".messager-button").hide();
        $win.parent().next().height($win.parent().height() + 12);
        setTimeout(function () {
            $win.window("close");
        }, $.messager.defaults.toastTimeout);
    };

})(jQuery);
;(function ($, fmx) {
    /** ******** numberbox ********* */
    $.fn._numberbox = $.fn.numberbox;

    $.fn.numberbox = function (options, param) {
        var result = $.fn._numberbox.apply(this, [options, param]);
        if (typeof options != "string") {
            this.each(function () {
                var target = this;
                $(target).unbind("blur.numberbox").bind("blur.numberbox", function () {
                    $(target).numberbox("fix");
                });
            });
        }
        return result;
    };

    $.fn.numberbox.methods = $.fn._numberbox.methods;
    $.fn.numberbox.defaults = $.fn._numberbox.defaults;
    $.fn.numberbox.parseOptions = $.fn._numberbox.parseOptions;

    $.extend($.fn.numberbox.methods, {
        _fix: $.fn.numberbox.methods.fix,

        fix: function (jq) {
            return jq.each(function () {
                var $numberbox = $(this);
                $numberbox.val($numberbox.numberbox("getValue"));
                $numberbox.numberbox("_fix");
                $numberbox.numberbox("setValue", $numberbox.numberbox("getValue"));
            });
        }//,

//        getValue: function (jq) {
//            var $numberbox = $(jq[0]);
//            var format = $.data(jq[0], "numberbox").options.format;
//            var value = $numberbox.val();
//            if (!value) {
//                return value;
//            }
//            if (format) {
//                value = $.parseNumber(value, {
//                    format: format
//                });
//            }
//            return parseFloat(value);
//        },
//
//        setValue: function (jq, value) {
//            return jq.each(function () {
//                var $numberbox = $(this);
//                var format = $.data(this, "numberbox").options.format;
//                if (format && (value || value === 0)) {
//                    value = $.formatNumber(value, {
//                        format: format
//                    });
//                }
//                $numberbox.val(value);
//            });
//        }
    });

    function initNumberboxes(jqInput, jqTh) {
        jqInput.each(function () {
            var $numberbox = $(this);
            var options = $.data(this, "numberbox").options;
            $.extend(options, {
                format: $numberbox.attr("format") ? $numberbox.attr("format") : null,
                precision: $numberbox.attr("format") ? 10 : options.precision
            });
        });
        // jqTh.each(function () {
        //     var $th = $(this);
        //     var $datagrid = $th.closest("table");
        //     var columnOption = $datagrid.datagrid("getColumnOption", $th.attr("field"));
        //     var options = columnOption.editor.options || {};
        //     $.extend(options, {
        //         format: $th.attr("format") ? $th.attr("format") : options.format,
        //         precision: $th.attr("format") || options.format ? 10
        //             : options.precision
        //     });
        //     columnOption.editor = {
        //         type: "numberbox",
        //         options: options
        //     };
        // });
    }
    $($.parser).on("onComplete",function(e,ctx,findings){
      initNumberboxes(findings.numberbox);
    });    
})(jQuery, fmx)
;(function ($) {
    /** ******** panels ********* */
    $.extend($.fn.panel.defaults, {
        reLoginMsg: "Session timeout. Please re-login and try again.",
        setDefaultContextErrorMsg: "JQuery selectors detected in the page. But default context can't be set automatically cause '$(function(){...})' can't be located. Please fix the page source code!",

        extractor: function (data) {
            if (/<!--LoginPage-->/im.exec(data)) {
                $.messager.confirm("Message", $.fn.panel.defaults.reLoginMsg,
                    function (b) {
                        if (b) {
                            window.location.reload();
                        }
                    });
                return "";
            }
            var index1 = data.indexOf("$(function(");
            if (index1 >= 0) {
                index2 = data.indexOf("{", index1);
                if (index2 >= 0) {
                    var contextid = $.now();
                    $(this).attr("_contextid", contextid);
                    data = data.substring(0, index1) +
                        // "var __onLoad = $('[_contextid=" + contextid +
                        // "]').panel('options').onLoad;\n" +
                        "($('[_contextid=" + contextid
                        + "]').panel('options').onLoadAsync = "
                        + data.substring(index1 + 2, index2 + 1) + "\n\n"
                        + "var _pageContext = jQuery('[_contextid=" + contextid
                        + "]');\n" + "var $ = function(selector, context) {\n"
                        + "	if (context) {\n"
                        + "		return jQuery(selector, context);\n" + "	} else {\n"
                        + "		return jQuery(selector, _pageContext);\n" + "	}\n"
                        + "};\n" + "jQuery.extend($, jQuery);\n"
                        + "PREVENT_REINIT_PLUGINS = true;\n"
                        + "setTimeout(function() {\n"
                        + "	PREVENT_REINIT_PLUGINS = false;\n" + "}, 0);\n" +
                        // "__onLoad.apply(this);\n" +
                        data.substring(index2 + 1);
                    return data;
                }
            }
            if (data.indexOf("$(") >= 0) {
                $.messager.alert("Message",
                    $.fn.panel.defaults.setDefaultContextErrorMsg, "error");
            }
            return data;
        }
    });

    $.extend($.fn.panel.methods, {
        loading: function (jq) {
            return jq.each(function () {
                var wrap = $(this);
                $(
                    "<div class='datagrid-mask panel' style='z-index: 10000;'></div>")
                    .css({
                        display: "block",
                        width: wrap.width(),
                        height: wrap.height()
                    }).appendTo(wrap);
                $(
                    "<div class='datagrid-mask-msg panel' style='z-index: 10000;'></div>")
                    .html($.fn.datagrid.defaults.loadMsg).appendTo(wrap)
                    .css(
                    {
                        display: "block",
                        left: (wrap.width() - $("div.datagrid-mask-msg",
                            wrap).outerWidth()) / 2,
                        top: (wrap.height() - $("div.datagrid-mask-msg",
                            wrap).outerHeight()) / 2
                    });
            });
        },

        loaded: function (jq) {
            return jq.each(function () {
                var wrap = $(this);
                wrap.children("div.datagrid-mask-msg").remove();
                wrap.children("div.datagrid-mask").remove();
            });
        }
    });
})(jQuery);
;(function ($) {
    /** ******** menu ********* */
//    $.extend(true,$.fn.menu.defaults, {
//        onShow: function () {
//            var $menu = $(this);
//            $menu.data("originalTop", $menu.position().top);
//            $menu.menu("fixPosition");
//        }
//    });
//
//    $.extend($.fn.menu.methods, {
//        fixPosition: function (jq) {
//            return jq.each(function () {
//                var $menu = $(this);
//                if ($menu.position().top + $menu.outerHeight() > $("body")
//                    .height() - 5) {
//                    var top = $menu.data("originalTop") - $menu.outerHeight()
//                        - 2;
//                    if (top < 0) {
//                        top = $("body").height() - $menu.outerHeight() - 5;
//                    }
//                    $menu.css("top", top + "px");
//                }
//            });
//        }
//    });
})(jQuery);
;(function ($, fmx) {

    /** ******** window & dialog ********* */
    $.extend($.fn.window.defaults, {
        inline: true,
        modal : true,
        onOpen: function () {
            var $window = $(this);
            $window.window("resize");
            var position = $window.parent().position();
            var offset = $window.parent().offset();
            var left = (window.document.body.clientWidth - $window.parent().outerWidth()) / 2;
            var top = (window.document.body.clientHeight - $window.parent().outerHeight()) / 2;
            $window.window("move", {
                left: position.left - (offset.left - left),
                top: position.top - (offset.top - top)
            });
            $window.data("preFocus", $("*:focus"));
            $window.find("a").unbind("keydown").bind("keydown", function (e) {
                // 13:Return; 32:Space; 27:Esc;
                if (e.keyCode == 13 || e.keyCode == 32) {
                    e.target.click();
                    e.preventDefault();
                } else if (e.keyCode == 27) {
                    $(this).closest(".window").find(".panel-tool-close").click();
                    e.preventDefault();
                }
            });
            $window.find("a:first").focus();
            $window.find("input:visible:enabled:first").focus();
        },

        onBeforeClose: function () {
            var $window = $(this);
            if ($window.data("preFocus")) {
                $window.data("preFocus").focus();
            }
        },

        onMove: function (left, top) {
            var $window = $(this);
            var offset = $window.parent().offset();
            if (offset.left < 0 || offset.top < 0) {
                $window.window("move", {
                    left: left - Math.min(offset.left, 0),
                    top: top - Math.min(offset.top, 0)
                });
            }
        }
    });

    $.extend($.fn.dialog.defaults, {
        inline: true,
        onOpen: $.fn.window.defaults.onOpen,
        onBeforeClose: $.fn.window.defaults.onBeforeClose,
        onMove: $.fn.window.defaults.onMove
    });

    function initDialogs(jq) {
        jq.each(function () {
            var $dialog = $(this);
            var $content = $dialog.children().children();
            $content.children(".dialog-buttons").addClass("dialog-button").appendTo($dialog);
            $content.children(".dialog-toolbars").addClass("dialog-toolbar").prependTo($dialog);
            $content.children(".dialog-button").appendTo($dialog);
            $content.children(".dialog-toolbar").prependTo($dialog);
        });
    }
    $($.parser).on('onComplete',function(e,ctx,findings){
      initDialogs(findings.dialog);
    });
})(jQuery, fmx);
/**
 * report - jQuery EasyUI
 * 
 * Dependencies:
 *   pagination 
 * 
 */
; (function ($, fmx) {
    var htmlUrl = $url('/rest/reportRest/showHtmlReport.json'),
        exportUrl = $url('/rest/reportRest/exportReport.json'),
        printUrl = $url('/rest/reportRest/printReport.json');
    function Buttons($jq, options) {
        var buttons = [{
            iconCls: 'icon-search',
            text: "查询",
            default: true,
            handler: function () {
                var queryParam = getReportParam(options.paramForm);
                if(queryParam == false) return;
                var pageNo = options.pagination.pagination('options').pageNumber;
                showLoading(options, true,true);
                queryParam['pageNo'] = pageNo;
                queryParam['reportId'] = options.reportId;
                queryParam['rptCode'] = options.rptCode;
                options.form.form('submit', {
                    queryParams: queryParam,
                    url: htmlUrl,
                    iframe: false,
                    isDownload:false,
                    ajax: true,
                    success: function (html, resp) {
                    	showLoading(options,false,true);
                        if (resp && $.isFunction(resp['getResponseHeader'])) {
                            var total = parseInt(resp.getResponseHeader('total-page'));
                            if (total && total != options.pagination.pagination('options').total) {
                                options.pagination.pagination('refresh', { total: total });
                            }
                        }
                        showReportContent(html,options);
                    }
                });
            }
        }, {
            iconCls: 'icon-save',
            text: "导出当前页",
            menu: 1,
            handler: function (item) {
                if(!item || !item.name){
                    $.messager.alert("提示", "unknow export type！");
                    return;
                }
                var pageNo = options.pagination.pagination('options').pageNumber;
                exportReport(options.form,options.paramForm,{
                	exportType : item.name,
                	reportId : options.reportId,
                	rptCode : options.rptCode,
                	startPageNo : pageNo,
                	endPageNo : pageNo,
                	exportParam : getExportParam(options,item.name),
                	success : function (result){
                        if (typeof (result) == 'string') {
                            result = JSON.parse(result);
                            if (result.message) {
                                $.messager.alert("提示", result.message);
                            }
                        }                		
                	}
                });  
            }
        }, {
            iconCls: 'icon-save',
            menu: 2,
            text: "导出全部",
            handler: function (item) {
                if(!item || !item.name){
                    $.messager.alert("提示", "unknow export type！");
                    return;
                }
                exportReport(options.form,options.paramForm,{
                	exportType : item.name,
                	reportId : options.reportId,
                	rptCode : options.rptCode,
                	exportParam : getExportParam(options,item.name),
                	success : function (result){
                        if (typeof (result) == 'string') {
                            result = JSON.parse(result);
                            if (result.message) {
                                $.messager.alert("提示", result.message);
                            }
                        }                		
                	}
                });
            }
        }, {
            iconCls: 'icon-print',
            text: "打印当前页",
            handler: function () {
            	showLoading(options,true);
            	var pageNo = options.pagination.pagination('options').pageNumber;
            	printReport(options.form,options.paramForm,{
            		reportId : options.reportId,
            		rptCode : options.rptCode,
            		printParam : getPrintParam(options),
                	startPageNo : pageNo,
                	endPageNo : pageNo,
            		success : function(result) {
            			showLoading(options,false);
                        result = JSON.parse(result);
                        if (result.code == 0) {
                            $.messager.alert("提示", "后台已成功发送打印任务！");
                        } else if (result.message) {
                            $.messager.alert("提示", result.message);
                        }            			
            		}
            	});
            }
        }, {
            iconCls: 'icon-print',
            text: "打印全部",
            handler: function () {
            	showLoading(options,true);
            	printReport(options.form,options.paramForm,{
            		reportId : options.reportId,
            		rptCode : options.rptCode,
            		printParam : getPrintParam(options),
            		success : function(result) {
            			showLoading(options,false);
                        result = JSON.parse(result);
                        if (result.code == 0) {
                            $.messager.alert("提示", "后台已成功发送打印任务！");
                        } else if (result.message) {
                            $.messager.alert("提示", result.message);
                        }            			
            		}
            	});
            }
        }];
        return buttons;
    }
    
    function exportReport(form,paramForm,params) {
        var queryParam = getReportParam(paramForm,params.reportParam);
        if(queryParam == false) return;
        queryParam['exportType'] = params.exportType;
        queryParam['reportId'] = params.reportId;
        queryParam['rptCode'] = params.rptCode;
        queryParam['exportParam'] = params.exportParam;
        if(params.startPageNo){
        	queryParam['startPageNo'] = params.startPageNo;
        }
        if(params.endPageNo){
        	queryParam['endPageNo'] = params.endPageNo;
        }
        form.form('submit', {
            queryParams: queryParam,
            url: exportUrl,
            iframe: true,
            isDownload:true,
            ajax: true,
            success: params.success
        });    	    	
    }
    
    function printReport(form,paramForm,params) {
        var queryParam = getReportParam(paramForm,params.reportParam);
        if(queryParam == false) return;
        queryParam['reportId'] = params.reportId;
        queryParam['rptCode'] = params.rptCode;
        queryParam['printParam'] = params.printParam;
        if(params.startPageNo){
        	queryParam['startPageNo'] = params.startPageNo;
        }
        if(params.endPageNo){
        	queryParam['endPageNo'] = params.endPageNo;
        }
        form.form('submit', {
            queryParams: queryParam,
            url: printUrl,
            iframe: false,
            isDownload:false,
            ajax: true,
            success: params.success
        });    	
    }
    
    function getExportParam(opts,exportType) {
        var param = opts.exportParam || {};
        if(opts.onExportParam) {
            opts.onExportParam(param,exportType);
        }
        return JSON.stringify(param);
    }    
    function getPrintParam(opts) {
        var param = opts.printParam || {};
        if(opts.onPrintParam) {
            opts.onPrintParam(param);
        }
        return JSON.stringify(param);
    }
    function getReportParam(paramForm,params) {
        var param = {};
        if (paramForm) {
            var $form = fmx.utils.getJquery(paramForm);
            if(!$form){
            	$.messager.alert("message","unkow selector："+paramForm);
            	return false;
            }
            if($form.form('validate') == false) return false;
            $.extend(param, $form.form('getData'));
            $.extend(param, getQueryInfos($form));
        }
        if(params){
        	$.extend(param,params);
        }
        $.each(param, function (k, v) {
            if ($.isPlainObject(v) || $.isArray(v)) {
                param[k] = JSON.stringify(v);
            }
        });
        return { reportParam: JSON.stringify(param) };
    }
    function getQueryInfos($form) {
        var queryInfos = {};
        $form.find("input[queryField],textarea[queryField],select[queryField]").each(function () {
            var $jq = $(this), state = $.data(this, 'combo') || $.data(this, 'textbox');
            var name = $jq.attr('queryField') || $jq.attr('textboxname') || $jq.attr('comboname') || $jq.attr('name');
            if (!name) return;
            var val = null, multiple = !!$jq.attr('multiple');
            if (!state) val = $jq.val();
            else if (multiple) {
                val = $jq.combo("getValues").join(',');
            } else val = $jq.textbox("getValue");
            if (!val || val == '' || val.length == 0) return;
            var jrField = $jq.attr('jrField') || 'queryFields';
            var fields = queryInfos[jrField] || (queryInfos[jrField] = []);
            fields.push({
                fieldName: name,
                fieldType: multiple ? ($jq.attr('dataType') || "String[]") : $jq.attr('dataType'),
                fieldStringValue: val,
                operator: $jq.attr("operator")
            });
        });
        return queryInfos;
    }
    
    function showLoading(opts,bLoading,isQuery) {
    	if(bLoading) {
    		opts.pagination.pagination("loading");
    		opts.container.maskit();
    		if(isQuery) {
    			var $jq = opts.view.parent();
    			if(!$jq.children('div.datagrid-mask').length){
    				$('<div class="datagrid-mask" style="display:block"></div>').appendTo($jq);
    				var msg = $('<div class="datagrid-mask-msg" style="display:block;left:50%"></div>').html(opts.loadMsg).appendTo($jq);
					msg._outerHeight(40);
					msg.css({
						marginLeft: (-msg.outerWidth()/2),
						lineHeight: (msg.height()+'px')
					});    				
    			}
    		}
    	}else{
    		opts.pagination.pagination("loaded");
    		opts.container.maskit('unmask');
    		if(isQuery) {
    			var $jq = opts.view.parent();
    			$jq.children('div.datagrid-mask-msg').remove();
    			$jq.children('div.datagrid-mask').remove();
    		}    		
    	}
    }

    function buildMenu(button, opts) {
        var ct = $('<div style="width:120px;display:none"></div>');
        $.each(opts.exportTypes, function (i, item) {
            ct.append('<div name="' + item.type + '">' + item.text + '</div>');
        });
        ct.attr('id', 'exportMenu_' + button.menu);
        ct.appendTo("body");
        return ct;
    }

    function buildButtons($jq, opts) {
        var ct = $('<div style="padding:2px 0;float:left;">');
        var buttons = new Buttons($jq, opts);
        $.each(buttons, function (i, button) {
            var $btn = $('<a href="#"></a>').text(button.text).appendTo(ct);
            if (button.default) {
                $btn.attr('default', button.default);
            }
            if (button.menu) {
                var m = buildMenu(button, opts).menu({ onClick: button.handler });
                $btn.menubutton({ menu: '#' + m.attr('id'), iconCls: button.iconCls });
            } else {
                $btn.linkbutton({ iconCls: button.iconCls, onClick: button.handler });
            }
        });
        ct.appendTo(opts.container);
    }

    function buildForm() {
        return $('<form></form>').form({ iframe: false }).appendTo('body');
    }

    function buildReportView(target) {
        if (!target) {
            target = 'body';
        } else if (target.charAt(0) != '#') {
            target = '#' + target;
        }
        var view = $("<iframe scrolling='auto' frameborder='0' style='width:100%;height:99%' marginwidth='0px' marginheight='0px' ></iframe>");
        view.appendTo(target).attr('src', window.ActiveXObject ? 'javascript:false' : 'about:blank');
        return view;
    }

    function showReportContent(html,opts) {
        if(html && html.charAt(0)=='{'){
            var json = JSON.parse(html);
            $.messager.alert("错误","展现报表错误："+json.message);
            return;
        }
        var $el = opts.view, $contents = $el.contents();
        $contents.find('html').html(html || '');//IE8　以上支持
        var height = $contents[0].documentElement.scrollHeight;
        $el.height(height);
    }

    function init($jq) {
        var state = $.data($jq[0], 'report'), opts = state.options;
        if (!opts.reportId && !opts.rptCode) {
            $.messager.alert('提示', '请为控件绑定报表代码！');
            return;
        }
        opts.container = $jq.empty();
        opts.view = buildReportView(opts.reportView);
        opts.form = buildForm();
        buildButtons($jq, opts);
        var options = {
            total: 1,
            pageSize: 1,
            pageList: [1],
            showPageList: false,
            showRefresh: false,
            layout: ['first', 'prev','manual', 'next', 'last','links'],
            onSelectPage: function (pageNo) {
                opts.container.find('a[default]').click();
            },
            onRefresh: function () {
                opts.container.find('a[default]').click();
            }
        }
        opts.pagination = $("<div></div>").appendTo($jq).pagination(options);
    }

    function parseOptions($jq) {
        var rptId = $jq.attr('rptId') || $jq.attr('reportId'), opts = {};
        var rptCode = $jq.attr('reportCode') || $jq.attr('rptCode');
        var paramForm = $jq.attr('paramForm');
        var reportView = $jq.attr('reportView');
        if (paramForm && paramForm.charAt(0) != '#') {
            paramForm = '#' + paramForm;
        }
        if (reportView && reportView.charAt(0) != '#') {
            reportView = '#' + reportView;
        }
        if (!rptId) {
            rptId = $getParam('rptId') || $getParam('reportId');
        }
        if(!rptCode) {
        	rptCode = $getParam('reportCode') || $getParam('rptCode');
        }
        var temp = $jq.attr('exportParam');
        if (temp && temp.charAt(0) == '{') {
            opts['exportParam'] = eval(temp);
        }
        temp = $jq.attr('printParam');
        if (temp && temp.charAt(0) == '{') {
            opts['printParam'] = eval(temp);
        }
        temp = $jq.attr('exportTypes');
        if (temp && temp.charAt(0) == '[') {
            opts['exportTypes'] = eval(temp);
        }
        temp = $jq.attr('onReportParam');
        if(temp){
            opts['onReportParam'] = eval(temp);
        }
        temp = $jq.attr('onPrintParam');
        if(temp){
            opts['onPrintParam'] = eval(temp);
        } 
        temp = $jq.attr('onExportParam');
        if(temp){
            opts['onExportParam'] = eval(temp);
        }                 
        if (rptId) opts['reportId'] = rptId;
        if(rptCode) opts['rptCode'] = rptCode;
        if (paramForm) opts['paramForm'] = paramForm;
        if (reportView) opts['reportView'] = reportView;
        return opts;
    }

    $.fn.report = function (options, param) {
        if (typeof options == 'string') {
            var method = $.fn.pagination.methods[options];
            if (method) {
                return method(this, param);
            }
            return this;
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, 'report'), $jq = $(this);
            if (state) {
                $.extend(state.options, options);
            } else {
                $.data(this, 'report', {
                    options: $.extend({}, $.fn.report.defaults, parseOptions($jq), options)
                })
            }
            init($jq);
        });
    }
    $.fn.report.methods = {
    	
    };
    //扩展表单方法,实现直接调用表单方法即可导出或打印报表
   /* $("#conditionForm").form("exportReport",{
    	//报表代码
    	rptCode : 'TestReport',
    	//导出类型:xlsx,docx,pdf,csv,pptx,rtf
    	exportType : 'xlsx',
    	//导出页码,如果不传则导出全部
    	startPageNo : 1,
    	endPageNo : 2
	});*/
    $.fn.form.methods.exportReport = function(jq,params) {
    	if(!$.isPlainObject(params)){
    		$.messager.alert("错误","请传入正确的报表参数！");
    		return jq;
    	}
    	return jq.each(function(){
    		var $form = $.data(this,'report_form');
    		if(!$form){
    			$form = buildForm();
    			$.data(this,'report_form',$form);
    		}
    		exportReport($form,this,params);
    	});
    }
    //调用示例:
    //$('#condition').form('printReport',{rptCode:'xxxx',pageNo:1,printParam:{printer:'打印机名'}})    
    $.fn.form.methods.printReport = function(jq,params) {
    	if(!$.isPlainObject(params)){
    		$.messager.alert("错误","请传入正确的报表参数！");
    		return jq;
    	}
    	return jq.each(function(){
    		var $form = $.data(this,'report_form');
    		if(!$form){
    			$form = buildForm();
    			$.data(this,'report_form',$form);
    		}
    		printReport($form,this,params);
    	});    	
    }
    
    $.fn.report.defaults = {
        reportId: '',
        rptCode : '',
        paramForm: '',
        reportView: '',
        exportParam: {},
        printParam: {},
        loadMsg : $.fn.datagrid.defaults.loadMsg,
        onReportParam: $.noop,
        onPrintParam: $.noop,
        onExportParam: $.noop,
        exportTypes : [{
            type: 'xlsx',
            text: '导出Excel文档'
        }, {
            type: 'docx',
            text: '导出Word文档'
        }, {
            type: 'pdf',
            text: '导出PDF文档'
        }, {
            type: 'csv',
            text: '导出CSV文档'
        }, {
            type: 'pptx',
            text: '导出pptx文档'
        }, {
            type: 'rtf',
            text: '导出rtf文档'
        }]
    }
    $.parser.plugins.push('report');
})(jQuery, fmx);
/** ******** PREVENT_REINIT_PLUGINS 防止多次初始化 ********* */
//var PREVENT_REINIT_PLUGINS = false;
; (function ($, fmx) {

    //页面初始化
    if ($isChildWin() && top.window.fmx) {
        var pageListener = {
            onTabActive: function () {
                $(window).triggerHandler('tabActive');
            },
            hasDataChanges : function() {
            	return $(window).triggerHandler("hasDataChanges");
            }
        };
        var tabPages = top.window.fmx.tabPages;
        var _pageKey = $getParam('_pageKey');
        if (_pageKey && tabPages) {
            tabPages.$regListener(_pageKey, pageListener);
            $addListener('unload',function(){
                tabPages.$removeListener(_pageKey);
            })
        }
    }
    /******mask it ****/
    $.fn.maskit = function (method,noMsg) {
        return this.each(function () {
            var $it = $(this);
            if (!$.data(this, '_maskit')) {
                fmx.utils.maskit($it);
            }
            if (method === 'unmask') {
                fmx.utils.maskit($it, false,noMsg);
            } else {
                fmx.utils.maskit($it, true,noMsg);
            }
        });
    }

    /**********easyui dialog**********/
    $.fn.dialog.defaults.modal = true;

    /*****locale and formatting initial********/
    (function () {
        if (fmx.pageContext.locale) {
            if (fmx.pageContext.locale.indexOf('cn') > -1) numeral.language('chs');
        }
        $.toJSON = JSON.stringify;
    })();

    /** ******** searchboxes ********* */
    function initSearchboxes(jq) {
        jq.each(function () {
            var $searchbox = $(this);
            var $resetBtn = $("<span><span class='clear-input'></span></span>");
            $resetBtn.click(function () {
                $searchbox.searchbox("setValue", null);
                $(this).parent().find(".searchbox-button").click();
            });
            $searchbox.searchbox("textbox").parent().append($resetBtn);
        });
    }

    function initial() {
        //        $("body").bind("contextmenu", function (e) {
        //            if ($(e.target).is("input:not([type]), input[type='text'], textarea")) {
        //                return true;
        //            }
        //            if (fmx.textSelected()) {
        //                return true;
        //            }
        //            return false;
        //        });
        $.each($.parser.plugins, function (index, plugin) {
            /** ******** add a bind event method for each plugin ********* */
        	var p = $.fn[plugin].methods;
        	if(!p) return;
            p.bind = function (jq, eventHandlers) {
                return jq.each(function () {
                    var _this = this;
                    $.each(eventHandlers, function (event, handler) {
                        $.data(_this, plugin).options[event] = function () {
                            $.fn[plugin].defaults[event].apply(_this, arguments);
                            return handler.apply(_this, arguments);
                        };
                        if ($.data(_this, "combo")) {
                            $.data(_this, "combo").options[event] = function () {
                                $.fn["combo"].defaults[event].apply(_this, arguments);
                                return handler.apply(_this, arguments);
                            };
                        }
                    });
                });
            };
            // var _plugin = "__" + plugin;
            // $.fn[_plugin] = $.fn[plugin];
            // $.fn[plugin] = function (options, param) {
            // if (PREVENT_REINIT_PLUGINS && typeof options != "string") {
            // return this.each(function () {
            // var state = $.data(this, plugin);
            // if (state) {
            // if (options) {
            // $.extend(state.options, options);
            // if ($.data(this, "combo")) {
            // $.extend($.data(this, "combo").options, options);
            // };
            // }
            // } else {
            // $.fn[_plugin].apply($(this), [options, param]);
            // }
            // });
            // } else {
            // return $.fn[_plugin].apply(this, [options, param]);
            // }
            // };
            // $.extend($.fn[plugin], $.fn[_plugin]);
        });
        setTimeout(function () {
            $('input:visible:enabled:first').focus();
        }, 50);
    }
    $(initial);
})(jQuery, fmx);

(function ($) {
    function findParent($target, selector) {
        $jq = $target.children(selector);
        if ($jq.length) {
            return $jq;
        }
        while (($target = $target.parent()) && $target.length) {
            var $jq = $target.find(selector);
            if ($jq.length) {
                return $jq;
            }
        }
        return [];
    }
    function fireClick($btn) {
        if (!$btn || !$btn.length || $btn.hasClass('l-btn-disabled') || $btn.attr('masking')) return;
        $btn.click();
    }
    /** ******** global shortcuts ********* */
    // 8:BackSpace; 9:Tab; 13:Return;
    // 16:Shift; 17:Ctrl; 18:Alt;
    // 27:Esc; 32:Space;
    // 37:Left; 38:Up; 39:Right; 40:Down;
    // 65-90:A-Z;
    document.onkeydown = function (event) {
        if (!event) {
            event = window.event;
        }
        if (event.keyCode == 8) {
        	if(event.target) {
        		if(event.target.contentEditable == "true" || event.target.contentEditable == true){
        			return true;
        		}
        		var type = event.target.type;
        		if(type == 'text' || type == 'textarea' || type == 'password'){
        			if(event.target.getAttribute('readonly') || event.target.getAttribute('disabled')){
        				return false;
        			}
        			return true;
        		}
        	}
        	if(event.srcElement) {
        		if(event.srcElement.contentEditable == "true" || event.srcElement.contentEditable == true) {
        			return true;
        		}
        		var type = event.srcElement.type;
        		if(type == 'text' || type == 'textarea' || type == 'password'){
        			if(event.srcElement.getAttribute('readonly') || event.srcElement.getAttribute('disabled')){
        				return false;
        			}
        			return true;
        		}      
        	}
        	return false;
        	
        } else if (event.keyCode == 13 && event.target) {
            var $jq = $(event.target || event.data.target);
            setTimeout(function () {
                fireClick(findParent($jq, 'a.easyui-linkbutton[default]:first'));
            }, 0);
        } else if (event.altKey && (event.keyCode == 37 || event.keyCode == 39)) {
            return false;
        } else if (event.ctrlKey && event.keyCode >= 65 && event.keyCode <= 90) {
            var keyChar = String.fromCharCode(event.keyCode);
            if (keyChar != "C" && keyChar != "X" && keyChar != "V" && keyChar != "Z") {
                var $jq = $(event.target || event.data.target);
                if ($jq.size()) {
                    keyChar = keyChar.toLowerCase();
                    fireClick(findParent($jq, "a[key='" + keyChar + "']:visible:first"));
                } else {
                    var $topWindow = $("body");
                    $("div.panel[style*='z-index']:visible").each(function () {
                        if ($(this).css("z-index") > ($topWindow.css("z-index") == "auto" ? 0 : $topWindow.css("z-index"))) {
                            $topWindow = $(this);
                        }
                    });
                    fireClick($topWindow.find("a[key='" + keyChar + "']:visible:first"));
                }
                return false;
            }
        } else if (event.ctrlKey && event.keyCode >= 37 && event.keyCode <= 40) {
            var $focus = $(":focus");
            if ($focus.closest(".datagrid-editable").size() > 0) {
                event.preventDefault();
                switch (event.keyCode) {
                    case 37: // left
                    case 39: // right
                        var $inputs = $focus.closest(".datagrid-row-editing").find("input:visible");
                        var index = $inputs.index($focus);
                        if (event.keyCode == 37) {
                            index--;
                        } else {
                            index++;
                        }
                        if (index >= $inputs.size()) {
                            index -= $inputs.size();
                        }
                        $inputs.eq(index).focus();
                        break;
                    case 38: // up
                    case 40: // down
                        var columnIndex = $focus.closest("td[field]").index();
                        var $rows = $focus.closest("tr.datagrid-row-editing").parent().children();
                        var rowIndex = $focus.closest("tr.datagrid-row-editing").index();
                        if (event.keyCode == 38) {
                            rowIndex--;
                        } else {
                            rowIndex++;
                        }
                        if (rowIndex >= $rows.size()) {
                            rowIndex -= $rows.size();
                        }
                        $rows.eq(rowIndex).children()[columnIndex].click();
                        break;
                }
            }
        }
    };
})(jQuery);
/** ******** parser ********* */
;(function ($,fmx) {
    var $parser = {
        onBefore: function (context, findings) {
            // disable unwanted scrolling bars in Chrome
            $("[fit='true']", context).parent().css("overflow", "hidden");

            $("[tooltip]", context).tooltip();
            $($.parser).triggerHandler('onBefore',[context,findings]);
        },
        parse: function (context) {
            // cache findings
            var findings = {};
            for (var i = 0; i < $.parser.plugins.length; i++) {
                var name = $.parser.plugins[i];
                var r = $('.easyui-' + name, context);
                findings[name] = r;
            }

            $.parser.onBefore.call($.parser, context, findings);

            var aa = [];
            $.each(findings, function (name, r) {
                if (r && r.length) {
                    if (r[name]) {
                        r[name]();
                    } else {
                        aa.push({
                            name: name,
                            jq: r
                        });
                    }
                }
            });
            if (aa.length && window.easyloader) {
                var names = [];
                for (var i = 0; i < aa.length; i++) {
                    names.push(aa[i].name);
                }
                easyloader.load(names, function () {
                    for (var i = 0; i < aa.length; i++) {
                        var name = aa[i].name;
                        var jq = aa[i].jq;
                        jq[name]();
                    }
                    $.parser.onComplete.call($.parser, context, findings);
                });
            } else {
                $.parser.onComplete.call($.parser, context, findings);
            }
        },
        onComplete: function (context, findings) {
            $($.parser).triggerHandler('onComplete',[context,findings]);
            if(!context){
            	$('body').css('visibility','visible');
            }
        }
    };
    $.extend($.parser, $parser);
})(jQuery,fmx);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVhc3l1aS5mbXguanMiLCJmbXgubW9tZW50LmpzIiwiZm14Lm51bWVyYWwuanMiLCJmbXguc3RvcmUuanMiLCJlYXN5dWkudGV4dGJveC5qcyIsImVhc3l1aS52YWxpZGF0ZWJveC5qcyIsImVhc3l1aS5jb21iby5qcyIsImVhc3l1aS50cmVlLmpzIiwiZWFzeXVpLmRhdGFncmlkLmpzIiwiZWFzeXVpLmNvbWJvYm94LmpzIiwiZWFzeXVpLmNvbWJvZ3JpZC5qcyIsImVhc3l1aS5jb21ib3RyZWUuanMiLCJlYXN5dWkudHJlZWdyaWQuanMiLCJlYXN5dWkuZGF0ZWJveC5qcyIsImVhc3l1aS5mb3JtLmpzIiwiZWFzeXVpLmxpbmtidXR0b24uanMiLCJlYXN5dWkubWVzc2FnZXIuanMiLCJlYXN5dWkubnVtYmVyYm94LmpzIiwiZWFzeXVpLnBhbmVsLmpzIiwiZWFzeXVpLm1lbnUuanMiLCJlYXN5dWkud2luZG93LmpzIiwiZWFzeXVpLnJlcG9ydC5qcyIsImVhc3l1aS5pbml0LmpzIiwiZWFzeXVpLnBhcnNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDem9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuc0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoianF1ZXJ5LmVhc3l1aS5leHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvL+WFqOWxgOWHveaVsFxyXG5mdW5jdGlvbiAkZ2V0UGFyYW0obmFtZSx1cmwpIHtcclxuICB2YXIgcmVzdWx0ID0gbnVsbCwgdG1wID0gW10sIHNlYXJjaCA9IHVybCB8fCBsb2NhdGlvbi5zZWFyY2g7XHJcbiAgaWYgKCFzZWFyY2ggfHwgc2VhcmNoLmxlbmd0aCA8IDEpIHJldHVybiByZXN1bHQ7XHJcbiAgc2VhcmNoID0gc2VhcmNoLnN1YnN0cihzZWFyY2guaW5kZXhPZignPycpICsgMSk7XHJcbiAgaWYoIXNlYXJjaCkgcmV0dXJuIHJlc3VsdDtcclxuICB2YXIgaXRlbXMgPSBzZWFyY2guc3BsaXQoXCImXCIpO1xyXG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBpdGVtcy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgIHRtcCA9IGl0ZW1zW2luZGV4XS5zcGxpdChcIj1cIik7XHJcbiAgICBpZiAodG1wWzBdID09PSBuYW1lKSByZXN1bHQgPSBkZWNvZGVVUklDb21wb25lbnQodG1wWzFdKTtcclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuZnVuY3Rpb24gJHVybCh1cmwpIHtcclxuICBpZiAoIXVybCB8fCB1cmwuaW5kZXhPZignaHR0cDonKSA9PSAwIHx8IHVybC5pbmRleE9mKCdodHRwczonKSA9PSAwIHx8ICFwYWdlQ29udGV4dC5jb250ZXh0UGF0aCB8fCB1cmwuaW5kZXhPZihwYWdlQ29udGV4dC5jb250ZXh0UGF0aCkgPT0gMCkge1xyXG4gICAgcmV0dXJuIHVybDtcclxuICB9IGVsc2UgaWYgKHVybC5jaGFyQXQoMCkgPT0gJ34nKSB7XHJcbiAgICByZXR1cm4gdXJsLnN1YnN0cmluZygxKTtcclxuICB9IGVsc2UgaWYgKHVybC5jaGFyQXQoMCkgPT0gJy8nKSB7XHJcbiAgICByZXR1cm4gcGFnZUNvbnRleHQuY29udGV4dFBhdGggKyB1cmw7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB1cmw7XHJcbiAgfVxyXG59O1xyXG5mdW5jdGlvbiAkcmVzdChyZXN0LCBtZXRob2QpIHtcclxuICByZXR1cm4gJHVybCgnL3Jlc3QvJyArIHJlc3QgKyAnLycgKyBtZXRob2QgKyAnLmpzb24nKTtcclxufTtcclxuZnVuY3Rpb24gJHBvc3RKU09OKHVybCwgZGF0YSwgY2IsIGVycm9yKSB7XHJcbiAgJC5hamF4KHtcclxuICAgIHVybDogdXJsLFxyXG4gICAgZGF0YTogdHlwZW9mKGRhdGEpID09ICdzdHJpbmcnID8gZGF0YSA6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTgnLFxyXG4gICAgc3VjY2VzczogY2IsXHJcbiAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgZXJyb3I6IGVycm9yXHJcbiAgfSk7XHJcbn07XHJcbmZ1bmN0aW9uICRpc0NoaWxkV2luKCkge1xyXG4gIHJldHVybiB0b3Aud2luZG93ICE9IHdpbmRvdztcclxufVxyXG5mdW5jdGlvbiAkYWRkTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSB7XHJcbiAgICBpZiAod2luZG93LmF0dGFjaEV2ZW50KSB7XHJcbiAgICAgICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbicrZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gJGlzVmFsaWRWYWx1ZSh2YWx1ZSkge1xyXG5cdGlmKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgKHR5cGVvZih2YWx1ZSkgPT0gJ3N0cmluZycgJiYgdmFsdWUgPT09ICcnKSl7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdHJldHVybiB0cnVlO1xyXG59XHJcbnZhciBmbXggPSB0aGlzWydmbXgnXSB8fCAodGhpc1snZm14J10gPSB7fSk7XHJcbmZteFsncGFnZUNvbnRleHQnXSA9IHdpbmRvd1sncGFnZUNvbnRleHQnXSB8fCB7fTtcclxuKGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuICB2YXIgQ29tbW9uRXhwb3J0ZXIgPSBuZXcgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHVybCA9ICR1cmwoJy9jb21tb25FeHBvcnQvJyk7XHJcbiAgICBmdW5jdGlvbiBkb1Bvc3QobWV0aG9kLCBwYXJhbXMpIHtcclxuICAgICAgdmFyIGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9ybVwiKTtcclxuICAgICAgZm9ybS5zZXRBdHRyaWJ1dGUoXCJtZXRob2RcIiwgXCJwb3N0XCIpO1xyXG4gICAgICBmb3JtLnNldEF0dHJpYnV0ZShcImFjdGlvblwiLCB1cmwgKyBtZXRob2QgKyAnLmRvJyk7XHJcbiAgICAgIGZvcm0uc2V0QXR0cmlidXRlKFwidGFyZ2V0XCIsIFwiX2JsYW5rXCIpO1xyXG4gICAgICAkLmVhY2gocGFyYW1zLCBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcclxuICAgICAgICB2YXIgaGlkZGVuRmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XHJcbiAgICAgICAgaGlkZGVuRmllbGQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICBoaWRkZW5GaWVsZC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIGtleSk7XHJcbiAgICAgICAgaGlkZGVuRmllbGQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgKCQuaXNQbGFpbk9iamVjdCh2YWwpIHx8ICQuaXNBcnJheSh2YWwpKSA/IEpTT04uc3RyaW5naWZ5KHZhbCkgOiB2YWwpO1xyXG4gICAgICAgIGZvcm0uYXBwZW5kQ2hpbGQoaGlkZGVuRmllbGQpO1xyXG4gICAgICB9KTtcclxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKTtcclxuICAgICAgZm9ybS5zdWJtaXQoKTtcclxuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChmb3JtKTtcclxuICAgIH1cclxuICAgIHRoaXMuZG9FeHBvcnRRdWVyeSA9IGZ1bmN0aW9uIChleHBvcnRJbmZvLCBxdWVyeUluZm8sIGNvbHVtbnMpIHtcclxuICAgICAgZG9Qb3N0KFwiZXhwb3J0UXVlcnlcIiwge1xyXG4gICAgICAgIGV4cG9ydEluZm86IGV4cG9ydEluZm8sXHJcbiAgICAgICAgcXVlcnlJbmZvOiBxdWVyeUluZm8sXHJcbiAgICAgICAgY29sdW1uczogY29sdW1uc1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuZG9FeHBvcnQgPSBmdW5jdGlvbiAoZXhwb3J0SW5mbywgZGF0YSkge1xyXG4gICAgICBkb1Bvc3QoXCJleHBvcnRcIiwge1xyXG4gICAgICAgIGV4cG9ydEluZm86IGV4cG9ydEluZm8sXHJcbiAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG4gIHZhciBDb21tb25RdWVyeVNlcnZpY2UgPSBuZXcgZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gZG9Qb3N0KG1ldGhvZCwgcGFyYW1zLCBzdWNjZXNzLCBlcnJvcikge1xyXG4gICAgICB2YXIgdXJsID0gJHJlc3QoJ2NvbW1vblF1ZXJ5UmVzdCcsIG1ldGhvZCk7XHJcbiAgICAgICRwb3N0SlNPTih1cmwsIHBhcmFtcywgc3VjY2VzcywgZXJyb3IpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5nZXRTZWxlY3RDb2RlRGF0YSA9IGZ1bmN0aW9uIChxdWVyeUluZm8sIHN1Y2Nlc3MsIGVycm9yKSB7XHJcbiAgICAgIGRvUG9zdChcImdldFNlbGVjdENvZGVEYXRhXCIsIHF1ZXJ5SW5mbywgc3VjY2VzcywgZXJyb3IpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5nZXRTZWxlY3RDb2RlRGF0YXMgPSBmdW5jdGlvbiAocXVlcnlJbmZvcywgc3VjY2VzcywgZXJyb3IpIHtcclxuICAgICAgZG9Qb3N0KCdnZXRTZWxlY3RDb2RlRGF0YXMnLCBxdWVyeUluZm9zLCBzdWNjZXNzLCBlcnJvcik7XHJcbiAgICB9XHJcbiAgICB0aGlzLmdldFNlbGVjdENvZGVWYWx1ZXNCeUtleXMgPSBmdW5jdGlvbiAoY29kZVZhbHVlcywgc3VjY2VzcywgZXJyb3IpIHtcclxuICAgICAgZG9Qb3N0KCdnZXRTZWxlY3RDb2RlVmFsdWVzQnlLZXlzJywgY29kZVZhbHVlcywgc3VjY2VzcywgZXJyb3IpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5nZXRTZWxlY3RDb2RlT3B0cyA9IGZ1bmN0aW9uIChjb2RlVHlwZXMsIHN1Y2Nlc3MsIGVycm9yKSB7XHJcbiAgICAgIGRvUG9zdCgnZ2V0U2VsZWN0Q29kZU9wdHMnLCBjb2RlVHlwZXMsIHN1Y2Nlc3MsIGVycm9yKTtcclxuICAgIH1cclxuICAgIHRoaXMuZ2V0U2VsZWN0Q29kZU9wdCA9IGZ1bmN0aW9uIChjb2RlVHlwZSwgc3VjY2VzcywgZXJyb3IpIHtcclxuICAgICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6ICRyZXN0KCdjb21tb25RdWVyeVJlc3QnLCAnZ2V0U2VsZWN0Q29kZU9wdCcpLFxyXG4gICAgICAgIGRhdGE6ICdjb2RlVHlwZT0nICsgY29kZVR5cGUsXHJcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgc3VjY2Vzczogc3VjY2VzcyxcclxuICAgICAgICBlcnJvcjogZXJyb3JcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnF1ZXJ5ID0gZnVuY3Rpb24gKHF1ZXJ5SW5mbywgc3VjY2VzcywgZXJyb3IpIHtcclxuICAgICAgZG9Qb3N0KCdxdWVyeScsIHF1ZXJ5SW5mbywgc3VjY2VzcywgZXJyb3IpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8v57yT5a2Y5pWw5o2uXHJcbiAgdmFyIFNFTEVDVF9DT0RFX1ZBTFVFUyA9IHt9LCBTRUxFQ1RfQ09ERV9EQVRBUyA9IHt9LCBTRUxFQ1RfQ09ERV9PUFRTID0ge30sIEFVVEhPUklaRURfRlVOQ1RJT05TID0gW107XHJcbiAgZnVuY3Rpb24gZ2V0U2VsZWN0Q29kZVZhbHVlcygpIHtcclxuICAgIGlmICghZm14LnBhZ2VDb250ZXh0LmVhc3l1aS51c2VHbG9iYWxDb2RlRGF0YSB8fCAhJGlzQ2hpbGRXaW4oKSkge1xyXG4gICAgICByZXR1cm4gU0VMRUNUX0NPREVfVkFMVUVTO1xyXG4gICAgfSBlbHNlIGlmICh3aW5kb3cudG9wLmZteCAmJiB3aW5kb3cudG9wLmZteC5nZXRTZWxlY3RDb2RlVmFsdWVzKSB7XHJcbiAgICAgIHJldHVybiB3aW5kb3cudG9wLmZteC5nZXRTZWxlY3RDb2RlVmFsdWVzKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gU0VMRUNUX0NPREVfVkFMVUVTO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIGdldFNlbGVjdENvZGVEYXRhcygpIHtcclxuICAgIGlmICghZm14LnBhZ2VDb250ZXh0LmVhc3l1aS51c2VHbG9iYWxDb2RlRGF0YSB8fCAhJGlzQ2hpbGRXaW4oKSkge1xyXG4gICAgICByZXR1cm4gU0VMRUNUX0NPREVfREFUQVM7XHJcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy50b3AuZm14ICYmIHdpbmRvdy50b3AuZm14LmdldFNlbGVjdENvZGVEYXRhcykge1xyXG4gICAgICByZXR1cm4gd2luZG93LnRvcC5mbXguZ2V0U2VsZWN0Q29kZURhdGFzKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gU0VMRUNUX0NPREVfREFUQVM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRTZWxlY3RDb2RlT3B0cygpIHtcclxuICAgIGlmICghJGlzQ2hpbGRXaW4oKSkge1xyXG4gICAgICByZXR1cm4gU0VMRUNUX0NPREVfT1BUUztcclxuICAgIH0gZWxzZSBpZiAod2luZG93LnRvcC5mbXggJiYgd2luZG93LnRvcC5mbXguZ2V0U2VsZWN0Q29kZU9wdHMpIHtcclxuICAgICAgcmV0dXJuIHdpbmRvdy50b3AuZm14LmdldFNlbGVjdENvZGVPcHRzKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gU0VMRUNUX0NPREVfT1BUUztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFNlbGVjdENvZGVWYWx1ZShjb2RlVHlwZSxrZXksaXNEaXNwbGF5KSB7XHJcblx0ICBmdW5jdGlvbiBnZXRWYWx1ZShjb2RlVmFsdWUsayl7XHJcblx0XHQgIHZhciB2YWx1ZSA9IGNvZGVWYWx1ZVtrXTtcclxuXHRcdCAgaWYoISRpc1ZhbGlkVmFsdWUodmFsdWUpKXtcclxuXHRcdFx0ICBrID0gay50b0xvd2VyQ2FzZSgpO1xyXG5cdFx0XHQgJC5lYWNoKGNvZGVWYWx1ZSxmdW5jdGlvbihrMSx2KXtcclxuXHRcdFx0XHRpZihrMS50b0xvd2VyQ2FzZSgpID09IGspe1xyXG5cdFx0XHRcdFx0dmFsdWUgPSB2O1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH0gXHJcblx0XHRcdCB9KTtcclxuXHRcdCAgfVxyXG5cdFx0ICByZXR1cm4gdmFsdWU7XHJcblx0ICB9XHJcblx0ICBpZihjb2RlVHlwZSl7XHJcblx0XHQgIHZhciBjb2RlVmFsdWVzID0gZ2V0U2VsZWN0Q29kZVZhbHVlcygpO1xyXG5cdFx0ICB2YXIgY29kZVZhbHVlID0gY29kZVZhbHVlc1tjb2RlVHlwZV07XHJcblx0XHQgIGlmKGNvZGVWYWx1ZSAmJiAkaXNWYWxpZFZhbHVlKGtleSkpe1xyXG5cdFx0XHQgIGtleSA9IGtleS50b1N0cmluZygpO1xyXG5cdFx0XHQgIGlmKGtleS5pbmRleE9mKCcsJykgPiAtMSl7XHJcblx0XHRcdFx0ICB2YXIgdmFscyA9IFtdO1xyXG5cdFx0XHRcdCAgJC5lYWNoKGtleS5zcGxpdCgnLCcpLGZ1bmN0aW9uKGksaXRlbSl7XHJcblx0XHRcdFx0XHQgaWYoJGlzVmFsaWRWYWx1ZShpdGVtKSl7XHJcblx0XHRcdFx0XHRcdCB2YWxzLnB1c2goZ2V0VmFsdWUoY29kZVZhbHVlLGl0ZW0udG9TdHJpbmcoKSkpOyBcclxuXHRcdFx0XHRcdCB9XHJcblx0XHRcdFx0ICB9KTtcclxuXHRcdFx0XHQgIGlmKGlzRGlzcGxheSl7XHJcblx0XHRcdFx0XHQgIHJldHVybiB2YWxzLmpvaW4oJywnKTtcclxuXHRcdFx0XHQgIH1cclxuXHRcdFx0XHQgIHJldHVybiB2YWxzO1xyXG5cdFx0XHQgIH1lbHNle1xyXG5cdFx0XHRcdCAgcmV0dXJuIGdldFZhbHVlKGNvZGVWYWx1ZSxrZXkpO1xyXG5cdFx0XHQgIH1cclxuXHRcdCAgfVxyXG5cdCAgfVxyXG5cdCAgcmV0dXJuICcnO1xyXG4gIH1cclxuICBcclxuICBmdW5jdGlvbiBtZXJnZVNlbGVjdENvZGVWYWx1ZXMoY29kZVR5cGUsY29kZVR5cGVWYWx1ZXMpIHtcclxuXHQgIGlmKCQuaXNQbGFpbk9iamVjdChjb2RlVHlwZSkpe1xyXG5cdFx0ICAkLmVhY2goY29kZVR5cGUsZnVuY3Rpb24oayx2KXtcclxuXHRcdFx0ICBtZXJnZVNlbGVjdENvZGVWYWx1ZXMoayx2KTtcclxuXHRcdCAgfSk7XHJcblx0ICB9ZWxzZSBpZihjb2RlVHlwZSAmJiAkLmlzUGxhaW5PYmplY3QoY29kZVR5cGVWYWx1ZXMpICYmICEkLmlzRW1wdHlPYmplY3QoY29kZVR5cGVWYWx1ZXMpKXtcclxuXHRcdCAgdmFyIGNvZGVWYWx1ZXMgPSBnZXRTZWxlY3RDb2RlVmFsdWVzKCk7XHJcblx0XHQgIHZhciBfY29kZVR5cGVWYWx1ZXMgPSBjb2RlVmFsdWVzW2NvZGVUeXBlXTtcclxuXHRcdCAgaWYoIV9jb2RlVHlwZVZhbHVlcyl7XHJcblx0XHRcdCAgY29kZVZhbHVlc1tjb2RlVHlwZV0gPSBfY29kZVR5cGVWYWx1ZXMgPSB7fTtcclxuXHRcdCAgfVxyXG5cdFx0ICAkLmVhY2goY29kZVR5cGVWYWx1ZXMsZnVuY3Rpb24oayx2KXtcclxuXHRcdFx0ICBfY29kZVR5cGVWYWx1ZXNba10gPSB2O1xyXG5cdFx0ICB9KTtcclxuXHQgIH1cclxuICB9ICBcclxuICBcclxuICBmdW5jdGlvbiBtZXJnZVNlbGVjdENvZGVWYWx1ZShjb2RlVHlwZSwga2V5RmllbGQsIGxhYmVsRmllbGQsIGRhdGFMaXN0KSB7XHJcbiAgICBpZiAoY29kZVR5cGUgJiYga2V5RmllbGQgJiYgbGFiZWxGaWVsZCAmJiAkLmlzQXJyYXkoZGF0YUxpc3QpKSB7XHJcbiAgICAgIHZhciB2YWx1ZXMgPSB7fTtcclxuICAgICAgJC5lYWNoKGRhdGFMaXN0LCBmdW5jdGlvbiAoaSwgaXRlbSkge1xyXG4gICAgICAgIHZhbHVlc1tpdGVtW2tleUZpZWxkXV0gPSBpdGVtW2xhYmVsRmllbGRdO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCEkLmlzRW1wdHlPYmplY3QodmFsdWVzKSkge1xyXG4gICAgICAgIHZhciBjb2RlVmFsdWVzID0ge307XHJcbiAgICAgICAgY29kZVZhbHVlc1tjb2RlVHlwZV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgZ2V0U2VsZWN0Q29kZVZhbHVlcygpLCBjb2RlVmFsdWVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqICoqKioqKioqIGZ1bmN0aW9uIGF1dGhvcml6YXRpb24gKioqKioqKioqICovXHJcbiAgZnVuY3Rpb24gZ2V0QXV0aG9yaXplZEZ1bmN0aW9ucygpIHtcclxuICAgIGlmICh0b3AucGFnZUNvbnRleHQgJiYgdG9wLnBhZ2VDb250ZXh0LnBlcm1pc3Npb25Db2Rlcykge1xyXG4gICAgICByZXR1cm4gdG9wLnBhZ2VDb250ZXh0LnBlcm1pc3Npb25Db2RlcztcclxuICAgIH0gZWxzZSBpZiAoISRpc0NoaWxkV2luKCkpIHtcclxuICAgICAgcmV0dXJuIEFVVEhPUklaRURfRlVOQ1RJT05TO1xyXG4gICAgfSBlbHNlIGlmICh3aW5kb3cudG9wLmZteCAmJiB3aW5kb3cudG9wLmZteC5nZXRBdXRob3JpemVkRnVuY3Rpb25zKSB7XHJcbiAgICAgIHJldHVybiB3aW5kb3cudG9wLmZteC5nZXRBdXRob3JpemVkRnVuY3Rpb25zKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gQVVUSE9SSVpFRF9GVU5DVElPTlM7XHJcbiAgICB9XHJcbiAgfTtcclxuICBmdW5jdGlvbiBjaGVja0Z1bmN0aW9uQXV0aG9yaXphdGlvbihmdW5jQ29kZSkge1xyXG4gICAgcmV0dXJuIGdldEF1dGhvcml6ZWRGdW5jdGlvbnMoKS5pbmRleE9mKGZ1bmNDb2RlKSA+PSAwO1xyXG4gIH07XHJcbiAgZnVuY3Rpb24gdGV4dFNlbGVjdGVkKCkge1xyXG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xyXG4gICAgICB2YXIgc2VsZWN0aW9uID0gZG9jdW1lbnQuc2VsZWN0aW9uO1xyXG4gICAgICByZXR1cm4gc2VsZWN0aW9uLnR5cGUgPT0gXCJUZXh0XCI7XHJcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5nZXRTZWxlY3Rpb24pIHtcclxuICAgICAgdmFyIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcclxuICAgICAgaWYgKCd0eXBlJyBpbiBzZWxlY3Rpb24pIHtcclxuICAgICAgICByZXR1cm4gKHNlbGVjdGlvbi50eXBlID09IFwiUmFuZ2VcIik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIChzZWxlY3Rpb24uZm9jdXNOb2RlICYmIHNlbGVjdGlvbi5mb2N1c05vZGUubm9kZU5hbWUgPT0gXCIjdGV4dFwiICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH07XHJcbiAgZnVuY3Rpb24gZ2V0STE4blRpdGxlKGkxOG5Sb290LCBpMThuS2V5LCBkZWZhdWx0VGl0bGUpIHtcclxuICAgIGlmIChkZWZhdWx0VGl0bGUpIHtcclxuICAgICAgcmV0dXJuIGRlZmF1bHRUaXRsZTtcclxuICAgIH1cclxuICAgIGlmICghaTE4blJvb3QpIHtcclxuICAgICAgcmV0dXJuIGkxOG5LZXk7XHJcbiAgICB9XHJcbiAgICB2YXIgaTE4blJvb3RzID0gaTE4blJvb3Quc3BsaXQoXCIsXCIpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpMThuUm9vdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHJvb3QgPSBcImkxOG4uXCIgKyAkLnRyaW0oaTE4blJvb3RzW2ldKTtcclxuICAgICAgaWYgKGV2YWwocm9vdCkgJiYgZXZhbChyb290KVtpMThuS2V5XSkge1xyXG4gICAgICAgIHJldHVybiBldmFsKHJvb3QpW2kxOG5LZXldO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaTE4bktleTtcclxuICB9XHJcbiAgXHJcbiAgJC5leHRlbmQoJC5lYXN5dWkse1xyXG5cdCAgaW5kZXhPZkFycmF5IDogZnVuY3Rpb24oYXJyYXksIHByb3AsIHZhbHVlKXtcclxuXHRcdHZhciBzdHJWYWwgPSB2YWx1ZSA9PSB1bmRlZmluZWQgPyBuZXcgU3RyaW5nKHByb3ApLnRvU3RyaW5nKCkgOiBuZXcgU3RyaW5nKHZhbHVlKS50b1N0cmluZygpO1xyXG5cdFx0Zm9yKHZhciBpPTAsbGVuPWFycmF5Lmxlbmd0aDsgaTxsZW47IGkrKyl7XHJcblx0XHRcdGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRcdHZhciB2YWwgPSBhcnJheVtpXTtcclxuXHRcdFx0XHRpZiAodmFsID09IHByb3AgfHwgKHR5cGVvZih2YWwpICE9IHR5cGVvZihwcm9wKSAmJiBuZXcgU3RyaW5nKHZhbCkudG9TdHJpbmcoKSA9PSBzdHJWYWwpKXtcclxuXHRcdFx0XHRcdHJldHVybiBpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR2YXIgdmFsID0gYXJyYXlbaV1bcHJvcF07XHJcblx0XHRcdFx0aWYgKHZhbCA9PT0gdmFsdWUpe3JldHVybiBpO31cclxuXHRcdFx0XHRlbHNlIGlmKHR5cGVvZih2YWx1ZSkgIT0gdHlwZW9mKHZhbCkgJiYgbmV3IFN0cmluZyh2YWwpLnRvU3RyaW5nKCkgPT0gc3RyVmFsKXtcclxuXHRcdFx0XHRcdHJldHVybiBpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdCAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiDmoLzlvI/ljJblt6XlhbdcclxuICAgKiovXHJcbiAgdmFyIGZvcm1hdHRlcnMgPSB7XHJcbiAgICBmb3JtYXROdW1iZXI6IGZ1bmN0aW9uIChudW0sIGZvcm1hdCkge1xyXG4gICAgICAvL2lmICghJC5pc051bWVyaWMobnVtKSAmJiAobnVtID09ICcnIHx8IG51bSA9PSBudWxsIHx8IG51bSA9PSB1bmRlZmluZWQpKSByZXR1cm4gbnVtO1xyXG4gICAgICByZXR1cm4gbnVtZXJhbChudW0pLmZvcm1hdChmb3JtYXQgfHwgJzAuMDAnKTtcclxuICAgIH0sXHJcbiAgICBwYXJzZU51bWJlcjogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICByZXR1cm4gbnVtZXJhbCgpLnVuZm9ybWF0KHZhbCk7XHJcbiAgICB9LFxyXG4gICAgZm9ybWF0Q3VycmVuY3k6IGZ1bmN0aW9uIChudW0sIGZvcm1hdCkge1xyXG4gICAgICAvL2lmICghJC5pc051bWVyaWMobnVtKSAmJiAobnVtID09ICcnIHx8IG51bSA9PSBudWxsIHx8IG51bSA9PSB1bmRlZmluZWQpKSByZXR1cm4gbnVtO1xyXG4gICAgICByZXR1cm4gbnVtZXJhbChudW0pLmZvcm1hdChmb3JtYXQgfHwgJyQwLjAwJyk7XHJcbiAgICB9LFxyXG4gICAgcGFyc2VDdXJyZW5jeTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICByZXR1cm4gbnVtZXJhbCgpLnVuZm9ybWF0KHZhbCk7XHJcbiAgICB9LFxyXG4gICAgZm9ybWF0RGF0ZTogZnVuY3Rpb24gKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICBpZiAoIWRhdGUpIHJldHVybiBkYXRlO1xyXG4gICAgICByZXR1cm4gbW9tZW50KGRhdGUpLmZvcm1hdChmb3JtYXQgfHwgcGFnZUNvbnRleHQuZGVmYXVsdERhdGVGb3JtYXQgfHwgJ1lZWVktTU0tREQnKTtcclxuICAgIH0sXHJcbiAgICBmb3JtYXREYXRldGltZTogZnVuY3Rpb24gKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICBpZiAoIWZvcm1hdCkgZm9ybWF0ID0gcGFnZUNvbnRleHQuZGVmYXVsdERhdGV0aW1lRm9ybWF0IHx8ICdZWVlZLU1NLUREIEhIOm1tOnNzJztcclxuICAgICAgcmV0dXJuIGZvcm1hdHRlcnMuZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdFRpbWU6IGZ1bmN0aW9uIChkYXRlLCBmb3JtYXQpIHtcclxuICAgICAgaWYgKCFmb3JtYXQpIGZvcm1hdCA9IHBhZ2VDb250ZXh0LmRlZmF1bHREYXRldGltZUZvcm1hdCB8fCAnSEg6bW06c3MnO1xyXG4gICAgICByZXR1cm4gZm9ybWF0dGVycy5mb3JtYXREYXRlKGRhdGUsIGZvcm1hdCk7XHJcbiAgICB9LFxyXG4gICAgcGFyc2VEYXRlOiBmdW5jdGlvbiAodmFsLCBmb3JtYXQpIHtcclxuICAgICAgaWYgKCF2YWwpIHJldHVybiB2YWw7XHJcbiAgICAgIHJldHVybiBtb21lbnQodmFsLCBmb3JtYXQgfHwgcGFnZUNvbnRleHQuZGVmYXVsdERhdGVGb3JtYXQgfHwgJ1lZWVktTU0tREQnLHRydWUpLnRvRGF0ZSgpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8v5bel5YW36ZuGXHJcbiAgdmFyIFV0aWxzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHJicmFja2V0ID0gL1xcW1xcXSQvO1xyXG4gICAgZnVuY3Rpb24gYnVpbGRQYXJhbXMocHJlZml4LCBvYmosIGFkZCkge1xyXG4gICAgICB2YXIgbmFtZTtcclxuICAgICAgaWYgKCQuaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgLy8gU2VyaWFsaXplIGFycmF5IGl0ZW0uXHJcbiAgICAgICAgJC5lYWNoKG9iaiwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgIGlmIChyYnJhY2tldC50ZXN0KHByZWZpeCkpIHtcclxuICAgICAgICAgICAgLy8gVHJlYXQgZWFjaCBhcnJheSBpdGVtIGFzIGEgc2NhbGFyLlxyXG4gICAgICAgICAgICBhZGQocHJlZml4LCB2KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIEl0ZW0gaXMgbm9uLXNjYWxhciAoYXJyYXkgb3Igb2JqZWN0KSwgZW5jb2RlIGl0cyBudW1lcmljIGluZGV4LlxyXG4gICAgICAgICAgICBidWlsZFBhcmFtcyhcclxuICAgICAgICAgICAgICBwcmVmaXggKyBcIltcIiArICh0eXBlb2YgdiA9PT0gXCJvYmplY3RcIiAmJiB2ICE9IG51bGwgPyBpIDogXCJcIikgKyBcIl1cIixcclxuICAgICAgICAgICAgICB2LFxyXG4gICAgICAgICAgICAgIGFkZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2UgaWYgKCQudHlwZShvYmopID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9iaikge1xyXG4gICAgICAgICAgYnVpbGRQYXJhbXMoKHByZWZpeCA/IHByZWZpeCArIFwiLlwiIDogXCJcIikgKyBuYW1lLCBvYmpbbmFtZV0sIGFkZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFkZChwcmVmaXgsIG9iaik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBhcmFtT2JqZWN0KGEpIHtcclxuICAgICAgdmFyIHByZWZpeCwgcmVzdWx0ID0ge30sXHJcbiAgICAgICAgYWRkID0gZnVuY3Rpb24gKGtleSwgdmFsdWVPckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICB2YXIgdmFsdWUgPSAkLmlzRnVuY3Rpb24odmFsdWVPckZ1bmN0aW9uKSA/IHZhbHVlT3JGdW5jdGlvbigpIDogdmFsdWVPckZ1bmN0aW9uO1xyXG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgIC8vc1sgcy5sZW5ndGggXSA9IGVuY29kZVVSSUNvbXBvbmVudCgga2V5ICkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCggdmFsdWUgPT0gbnVsbCA/IFwiXCIgOiB2YWx1ZSApO1xyXG4gICAgICAgIH07XHJcbiAgICAgIGlmICgkLmlzQXJyYXkoYSkgfHwgKGEuanF1ZXJ5ICYmICEkLmlzUGxhaW5PYmplY3QoYSkpKSB7XHJcbiAgICAgICAgJC5lYWNoKGEsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGFkZCh0aGlzLm5hbWUsIHRoaXMudmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2UgaWYgKCQuaXNQbGFpbk9iamVjdChhKSkge1xyXG4gICAgICAgIGZvciAocHJlZml4IGluIGEpIHtcclxuICAgICAgICAgIGJ1aWxkUGFyYW1zKHByZWZpeCwgYVtwcmVmaXhdLCBhZGQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gY29udmVydCh2YWx1ZSkge1xyXG4gICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09IG51bGwpIHJldHVybiBcIlwiO1xyXG4gICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgIH0gZWxzZSBpZiAoJ3RvSlNPTicgaW4gdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUudG9KU09OKCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoJ3RvU3RyaW5nJyBpbiB2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB2YWx1ZSArICcnO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGFyYW1TdHIob2JqKSB7XHJcbiAgICAgIHZhciBhcnJheSA9IFtdO1xyXG4gICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9iaikpIHtcclxuICAgICAgICAkLmVhY2gob2JqLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICAgICAgYXJyYXkucHVzaChlbmNvZGVVUklDb21wb25lbnQoaykgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoY29udmVydCh2KSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhcnJheS5qb2luKCcmJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyICRtYXNraXRNc2c7XHJcbiAgICBmdW5jdGlvbiBtYXNraXQoJGl0LCBiTWFzayxub01zZykge1xyXG4gICAgICBpZighJGl0KSByZXR1cm47XHJcbiAgICAgIC8vaW5pdGlhbFxyXG4gICAgICBpZih0eXBlb2YgJGl0ID09ICdzdHJpbmcnKXtcclxuICAgIFx0ICB2YXIgJGVsID0gJCgkaXQpO1xyXG4gICAgXHQgIGlmKCEkZWwuc2l6ZSgpKSAkZWwgPSAkKCcjJyArICRpdCk7XHJcbiAgICBcdCAgJGl0ID0gJGVsO1xyXG4gICAgXHQgIGlmKCEkaXQuc2l6ZSgpKSByZXR1cm5cclxuICAgICAgfVxyXG4gICAgICB2YXIgX21hc2tpdCA9ICRpdC5kYXRhKCdfbWFza2l0Jyk7XHJcbiAgICAgIGlmICghX21hc2tpdCl7XHJcbiAgICBcdCAgaWYoJGl0LmNoaWxkcmVuKCkubGVuZ3RoKXtcclxuICAgIFx0XHQgIF9tYXNraXQgPSAkKCc8ZGl2IGNsYXNzPVwibWFza2l0XCI+PC9kaXY+JykuaGlkZSgpLmFwcGVuZFRvKCRpdCk7XHJcbiAgICBcdCAgfWVsc2V7XHJcbiAgICBcdFx0ICBfbWFza2l0ID0gJCgnPGRpdiBjbGFzcz1cIm1hc2tpdFwiPjwvZGl2PicpLmhpZGUoKS5pbnNlcnRBZnRlcigkaXQpO1xyXG4gICAgXHQgIH1cclxuXHQgICAgICAkaXQuZGF0YSgnX21hc2tpdCcsX21hc2tpdCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYoIW5vTXNnICYmICEkbWFza2l0TXNnKXtcclxuICAgIFx0ICB2YXIgbG9hZE1zZyA9ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZE1zZyB8fCBcIuato+WcqOWkhOeQhu+8jOivt+eojeW+heOAguOAguOAglwiO1xyXG4gICAgXHQgICRtYXNraXRNc2cgPSAkKFwiPGRpdj48L2Rpdj5cIikuYXR0cihcImNsYXNzXCIsXCJtYXNraXQtbXNnXCIpLmhpZGUoKS50ZXh0KGxvYWRNc2cpO1xyXG4gICAgXHQgICRtYXNraXRNc2cuYXBwZW5kVG8oXCJib2R5XCIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmKGJNYXNrID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcclxuICAgICAgZWxzZSBpZiAoIWJNYXNrKSB7XHJcbiAgICAgICAgX21hc2tpdC5oaWRlKCk7XHJcbiAgICAgICAgaWYoIW5vTXNnICYmICRtYXNraXRNc2cpe1xyXG4gICAgICAgIFx0JG1hc2tpdE1zZy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICRpdC5maW5kKCcuZWFzeXVpLWxpbmtidXR0b24nKS5yZW1vdmVBdHRyKCdtYXNraW5nJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgJGl0LmZpbmQoJy5lYXN5dWktbGlua2J1dHRvbicpLmF0dHIoJ21hc2tpbmcnLCB0cnVlKTtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gJGl0Lm9mZnNldCgpO1xyXG4gICAgICAgIHZhciB6SW5kZXggPSAkaXQuY3NzKCd6LWluZGV4Jyk7XHJcbiAgICAgICAgaWYgKCQuaXNOdW1lcmljKHpJbmRleCkpIHpJbmRleCA9IHBhcnNlSW50KHpJbmRleCkgKyAxMDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gJGl0Lm91dGVySGVpZ2h0KCkrXCJweFwiO1xyXG4gICAgICAgIF9tYXNraXQuY3NzKHtcclxuICAgICAgICAgIHpJbmRleDogekluZGV4LFxyXG4gICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQsXHJcbiAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXHJcbiAgICAgICAgICB3aWR0aDogJGl0Lm91dGVyV2lkdGgoKSxcclxuICAgICAgICAgIFwiaGVpZ2h0XCI6IGhlaWdodCxcclxuICAgICAgICAgIFwibGluZS1oZWlnaHRcIjpoZWlnaHRcclxuICAgICAgICB9KS5zaG93KCk7XHJcbiAgICAgICAgaWYoIW5vTXNnKXtcclxuICAgICAgICBcdCRtYXNraXRNc2cuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHBhcmFtT2JqZWN0OiBwYXJhbU9iamVjdCxcclxuICAgICAgcGFyYW1TdHI6IHBhcmFtU3RyLFxyXG4gICAgICBtYXNraXQ6IG1hc2tpdCxcclxuICAgICAgZ2V0VXVpZCA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XHJcbiAgICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSBcInhcIiA/IHIgOiByICYgMyB8IDg7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHBhcnNlSlNPTiA6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgIFx0ICBpZih0eXBlb2YganNvbiA9PSAnc3RyaW5nJykgcmV0dXJuIEpTT04ucGFyc2UoanNvbik7XHJcbiAgICBcdCAgcmV0dXJuIGpzb247XHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEpxdWVyeSA6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICBcdCAgdmFyICRtaSA9ICQoc2VsZWN0b3IpO1xyXG5cdFx0XHRpZigkbWkubGVuZ3RoKXtcclxuXHRcdFx0XHRyZXR1cm4gJG1pO1xyXG5cdFx0XHR9ZWxzZSBpZihkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3Rvcikpe1xyXG5cdFx0XHRcdHJldHVybiAkKCcjJytzZWxlY3Rvcik7XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0XHR9ICAgIFx0ICBcclxuICAgICAgfSxcclxuICAgICAgaHRtbGVuY29kZSA6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgIFx0ICAgcmV0dXJuICQoXCI8ZGl2PjwvZGl2PlwiKS50ZXh0KGh0bWwpLmh0bWwoKTsgICAgIFx0ICBcclxuICAgICAgfSxcclxuICAgICAgaHRtbGRlY29kZSA6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgIFx0ICByZXR1cm4gJChcIjxkaXY+PC9kaXY+XCIpLmh0bWwoaHRtbCkudGV4dCgpOyAgIFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAkLmV4dGVuZCh0cnVlLCBmbXgsIHtcclxuXHQgICAgQ29tbW9uRXhwb3J0ZXI6IENvbW1vbkV4cG9ydGVyLFxyXG5cdCAgICBDb21tb25RdWVyeVNlcnZpY2U6IENvbW1vblF1ZXJ5U2VydmljZSxcclxuXHQgICAgbWVyZ2VTZWxlY3RDb2RlVmFsdWU6IG1lcmdlU2VsZWN0Q29kZVZhbHVlLFxyXG5cdCAgICBtZXJnZVNlbGVjdENvZGVWYWx1ZXM6IG1lcmdlU2VsZWN0Q29kZVZhbHVlcyxcclxuXHQgICAgZ2V0U2VsZWN0Q29kZU9wdHM6IGdldFNlbGVjdENvZGVPcHRzLFxyXG5cdCAgICBnZXRTZWxlY3RDb2RlRGF0YXM6IGdldFNlbGVjdENvZGVEYXRhcyxcclxuXHQgICAgZ2V0U2VsZWN0Q29kZVZhbHVlczogZ2V0U2VsZWN0Q29kZVZhbHVlcyxcclxuXHQgICAgZ2V0U2VsZWN0Q29kZVZhbHVlOiBnZXRTZWxlY3RDb2RlVmFsdWUsXHJcblx0ICAgIHRleHRTZWxlY3RlZDogdGV4dFNlbGVjdGVkLFxyXG5cdCAgICBjaGVja0Z1bmN0aW9uQXV0aG9yaXphdGlvbjogY2hlY2tGdW5jdGlvbkF1dGhvcml6YXRpb24sXHJcblx0ICAgIGZvcm1hdHRlcnM6IGZvcm1hdHRlcnMsXHJcblx0ICAgIHV0aWxzOiBuZXcgVXRpbHMoKSxcclxuICAgICAgICBnZXRJMThuVGl0bGU6IGdldEkxOG5UaXRsZVxyXG4gIH0pO1xyXG59KShqUXVlcnksIGZteCk7IiwiLy8hIG1vbWVudC5qc1xuLy8hIHZlcnNpb24gOiAyLjE1LjFcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuXG47KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgICBnbG9iYWwubW9tZW50ID0gZmFjdG9yeSgpXG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGhvb2tDYWxsYmFjaztcblxuICAgIGZ1bmN0aW9uIHV0aWxzX2hvb2tzX19ob29rcyAoKSB7XG4gICAgICAgIHJldHVybiBob29rQ2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGRvbmUgdG8gcmVnaXN0ZXIgdGhlIG1ldGhvZCBjYWxsZWQgd2l0aCBtb21lbnQoKVxuICAgIC8vIHdpdGhvdXQgY3JlYXRpbmcgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgIGZ1bmN0aW9uIHNldEhvb2tDYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICAgICAgaG9va0NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNBcnJheShpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzT2JqZWN0KGlucHV0KSB7XG4gICAgICAgIC8vIElFOCB3aWxsIHRyZWF0IHVuZGVmaW5lZCBhbmQgbnVsbCBhcyBvYmplY3QgaWYgaXQgd2Fzbid0IGZvclxuICAgICAgICAvLyBpbnB1dCAhPSBudWxsXG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgICAgIHZhciBrO1xuICAgICAgICBmb3IgKGsgaW4gb2JqKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIGl0cyBub3Qgb3duIHByb3BlcnR5IEknZCBzdGlsbCBjYWxsIGl0IG5vbi1lbXB0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRGF0ZShpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBEYXRlIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IERhdGVdJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXAoYXJyLCBmbikge1xuICAgICAgICB2YXIgcmVzID0gW10sIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKGZuKGFycltpXSwgaSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzT3duUHJvcChhLCBiKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYSwgYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSBpbiBiKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChiLCBpKSkge1xuICAgICAgICAgICAgICAgIGFbaV0gPSBiW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc093blByb3AoYiwgJ3RvU3RyaW5nJykpIHtcbiAgICAgICAgICAgIGEudG9TdHJpbmcgPSBiLnRvU3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc093blByb3AoYiwgJ3ZhbHVlT2YnKSkge1xuICAgICAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlX3V0Y19fY3JlYXRlVVRDIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgdHJ1ZSkudXRjKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW1wdHkgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICB1bnVzZWRUb2tlbnMgICAgOiBbXSxcbiAgICAgICAgICAgIHVudXNlZElucHV0ICAgICA6IFtdLFxuICAgICAgICAgICAgb3ZlcmZsb3cgICAgICAgIDogLTIsXG4gICAgICAgICAgICBjaGFyc0xlZnRPdmVyICAgOiAwLFxuICAgICAgICAgICAgbnVsbElucHV0ICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICBpbnZhbGlkTW9udGggICAgOiBudWxsLFxuICAgICAgICAgICAgaW52YWxpZEZvcm1hdCAgIDogZmFsc2UsXG4gICAgICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcbiAgICAgICAgICAgIGlzbyAgICAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgcGFyc2VkRGF0ZVBhcnRzIDogW10sXG4gICAgICAgICAgICBtZXJpZGllbSAgICAgICAgOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UGFyc2luZ0ZsYWdzKG0pIHtcbiAgICAgICAgaWYgKG0uX3BmID09IG51bGwpIHtcbiAgICAgICAgICAgIG0uX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtLl9wZjtcbiAgICB9XG5cbiAgICB2YXIgc29tZTtcbiAgICBpZiAoQXJyYXkucHJvdG90eXBlLnNvbWUpIHtcbiAgICAgICAgc29tZSA9IEFycmF5LnByb3RvdHlwZS5zb21lO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNvbWUgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgICAgICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBsZW4gPSB0Lmxlbmd0aCA+Pj4gMDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpIGluIHQgJiYgZnVuLmNhbGwodGhpcywgdFtpXSwgaSwgdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRfX2lzVmFsaWQobSkge1xuICAgICAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgZmxhZ3MgPSBnZXRQYXJzaW5nRmxhZ3MobSk7XG4gICAgICAgICAgICB2YXIgcGFyc2VkUGFydHMgPSBzb21lLmNhbGwoZmxhZ3MucGFyc2VkRGF0ZVBhcnRzLCBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpICE9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBpc05vd1ZhbGlkID0gIWlzTmFOKG0uX2QuZ2V0VGltZSgpKSAmJlxuICAgICAgICAgICAgICAgIGZsYWdzLm92ZXJmbG93IDwgMCAmJlxuICAgICAgICAgICAgICAgICFmbGFncy5lbXB0eSAmJlxuICAgICAgICAgICAgICAgICFmbGFncy5pbnZhbGlkTW9udGggJiZcbiAgICAgICAgICAgICAgICAhZmxhZ3MuaW52YWxpZFdlZWtkYXkgJiZcbiAgICAgICAgICAgICAgICAhZmxhZ3MubnVsbElucHV0ICYmXG4gICAgICAgICAgICAgICAgIWZsYWdzLmludmFsaWRGb3JtYXQgJiZcbiAgICAgICAgICAgICAgICAhZmxhZ3MudXNlckludmFsaWRhdGVkICYmXG4gICAgICAgICAgICAgICAgKCFmbGFncy5tZXJpZGllbSB8fCAoZmxhZ3MubWVyaWRpZW0gJiYgcGFyc2VkUGFydHMpKTtcblxuICAgICAgICAgICAgaWYgKG0uX3N0cmljdCkge1xuICAgICAgICAgICAgICAgIGlzTm93VmFsaWQgPSBpc05vd1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmNoYXJzTGVmdE92ZXIgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICBmbGFncy5iaWdIb3VyID09PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChPYmplY3QuaXNGcm96ZW4gPT0gbnVsbCB8fCAhT2JqZWN0LmlzRnJvemVuKG0pKSB7XG4gICAgICAgICAgICAgICAgbS5faXNWYWxpZCA9IGlzTm93VmFsaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNOb3dWYWxpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS5faXNWYWxpZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2YWxpZF9fY3JlYXRlSW52YWxpZCAoZmxhZ3MpIHtcbiAgICAgICAgdmFyIG0gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoTmFOKTtcbiAgICAgICAgaWYgKGZsYWdzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGV4dGVuZChnZXRQYXJzaW5nRmxhZ3MobSksIGZsYWdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhtKS51c2VySW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVbmRlZmluZWQoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09PSB2b2lkIDA7XG4gICAgfVxuXG4gICAgLy8gUGx1Z2lucyB0aGF0IGFkZCBwcm9wZXJ0aWVzIHNob3VsZCBhbHNvIGFkZCB0aGUga2V5IGhlcmUgKG51bGwgdmFsdWUpLFxuICAgIC8vIHNvIHdlIGNhbiBwcm9wZXJseSBjbG9uZSBvdXJzZWx2ZXMuXG4gICAgdmFyIG1vbWVudFByb3BlcnRpZXMgPSB1dGlsc19ob29rc19faG9va3MubW9tZW50UHJvcGVydGllcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gY29weUNvbmZpZyh0bywgZnJvbSkge1xuICAgICAgICB2YXIgaSwgcHJvcCwgdmFsO1xuXG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faXNBTW9tZW50T2JqZWN0KSkge1xuICAgICAgICAgICAgdG8uX2lzQU1vbWVudE9iamVjdCA9IGZyb20uX2lzQU1vbWVudE9iamVjdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2kpKSB7XG4gICAgICAgICAgICB0by5faSA9IGZyb20uX2k7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9mKSkge1xuICAgICAgICAgICAgdG8uX2YgPSBmcm9tLl9mO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fbCkpIHtcbiAgICAgICAgICAgIHRvLl9sID0gZnJvbS5fbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3N0cmljdCkpIHtcbiAgICAgICAgICAgIHRvLl9zdHJpY3QgPSBmcm9tLl9zdHJpY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl90em0pKSB7XG4gICAgICAgICAgICB0by5fdHptID0gZnJvbS5fdHptO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faXNVVEMpKSB7XG4gICAgICAgICAgICB0by5faXNVVEMgPSBmcm9tLl9pc1VUQztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX29mZnNldCkpIHtcbiAgICAgICAgICAgIHRvLl9vZmZzZXQgPSBmcm9tLl9vZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9wZikpIHtcbiAgICAgICAgICAgIHRvLl9wZiA9IGdldFBhcnNpbmdGbGFncyhmcm9tKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2xvY2FsZSkpIHtcbiAgICAgICAgICAgIHRvLl9sb2NhbGUgPSBmcm9tLl9sb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9tZW50UHJvcGVydGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbW9tZW50UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHByb3AgPSBtb21lbnRQcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgICAgIHZhbCA9IGZyb21bcHJvcF07XG4gICAgICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvW3Byb3BdID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0bztcbiAgICB9XG5cbiAgICB2YXIgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XG4gICAgICAgIGNvcHlDb25maWcodGhpcywgY29uZmlnKTtcbiAgICAgICAgdGhpcy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5fZCAhPSBudWxsID8gY29uZmlnLl9kLmdldFRpbWUoKSA6IE5hTik7XG4gICAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCBpbiBjYXNlIHVwZGF0ZU9mZnNldCBjcmVhdGVzIG5ldyBtb21lbnRcbiAgICAgICAgLy8gb2JqZWN0cy5cbiAgICAgICAgaWYgKHVwZGF0ZUluUHJvZ3Jlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc01vbWVudCAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNb21lbnQgfHwgKG9iaiAhPSBudWxsICYmIG9iai5faXNBTW9tZW50T2JqZWN0ICE9IG51bGwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic0Zsb29yIChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIC8vIC0wIC0+IDBcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKSB8fCAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvSW50KGFyZ3VtZW50Rm9yQ29lcmNpb24pIHtcbiAgICAgICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcbiAgICAgICAgICAgIHZhbHVlID0gMDtcblxuICAgICAgICBpZiAoY29lcmNlZE51bWJlciAhPT0gMCAmJiBpc0Zpbml0ZShjb2VyY2VkTnVtYmVyKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBhYnNGbG9vcihjb2VyY2VkTnVtYmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgICAgIGRpZmZzID0gMCxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcbiAgICAgICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdhcm4obXNnKSB7XG4gICAgICAgIGlmICh1dGlsc19ob29rc19faG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID09PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgICh0eXBlb2YgY29uc29sZSAhPT0gICd1bmRlZmluZWQnKSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRGVwcmVjYXRpb24gd2FybmluZzogJyArIG1zZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXByZWNhdGUobXNnLCBmbikge1xuICAgICAgICB2YXIgZmlyc3RUaW1lID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gZXh0ZW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG51bGwsIG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgYXJnO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyArPSAnXFxuWycgKyBpICsgJ10gJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmcgKz0ga2V5ICsgJzogJyArIGFyZ3VtZW50c1swXVtrZXldICsgJywgJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy5zbGljZSgwLCAtMik7IC8vIFJlbW92ZSB0cmFpbGluZyBjb21tYSBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2Fybihtc2cgKyAnXFxuQXJndW1lbnRzOiAnICsgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncykuam9pbignJykgKyAnXFxuJyArIChuZXcgRXJyb3IoKSkuc3RhY2spO1xuICAgICAgICAgICAgICAgIGZpcnN0VGltZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGZuKTtcbiAgICB9XG5cbiAgICB2YXIgZGVwcmVjYXRpb25zID0ge307XG5cbiAgICBmdW5jdGlvbiBkZXByZWNhdGVTaW1wbGUobmFtZSwgbXNnKSB7XG4gICAgICAgIGlmICh1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy5kZXByZWNhdGlvbkhhbmRsZXIobmFtZSwgbXNnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlcHJlY2F0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgd2Fybihtc2cpO1xuICAgICAgICAgICAgZGVwcmVjYXRpb25zW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHV0aWxzX2hvb2tzX19ob29rcy5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPSBmYWxzZTtcbiAgICB1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIGlzRnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRnVuY3Rpb24gfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVfc2V0X19zZXQgKGNvbmZpZykge1xuICAgICAgICB2YXIgcHJvcCwgaTtcbiAgICAgICAgZm9yIChpIGluIGNvbmZpZykge1xuICAgICAgICAgICAgcHJvcCA9IGNvbmZpZ1tpXTtcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHByb3ApKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXNbJ18nICsgaV0gPSBwcm9wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gTGVuaWVudCBvcmRpbmFsIHBhcnNpbmcgYWNjZXB0cyBqdXN0IGEgbnVtYmVyIGluIGFkZGl0aW9uIHRvXG4gICAgICAgIC8vIG51bWJlciArIChwb3NzaWJseSkgc3R1ZmYgY29taW5nIGZyb20gX29yZGluYWxQYXJzZUxlbmllbnQuXG4gICAgICAgIHRoaXMuX29yZGluYWxQYXJzZUxlbmllbnQgPSBuZXcgUmVnRXhwKHRoaXMuX29yZGluYWxQYXJzZS5zb3VyY2UgKyAnfCcgKyAoL1xcZHsxLDJ9Lykuc291cmNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjaGlsZENvbmZpZykge1xuICAgICAgICB2YXIgcmVzID0gZXh0ZW5kKHt9LCBwYXJlbnRDb25maWcpLCBwcm9wO1xuICAgICAgICBmb3IgKHByb3AgaW4gY2hpbGRDb25maWcpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKGNoaWxkQ29uZmlnLCBwcm9wKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc09iamVjdChwYXJlbnRDb25maWdbcHJvcF0pICYmIGlzT2JqZWN0KGNoaWxkQ29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5kKHJlc1twcm9wXSwgcGFyZW50Q29uZmlnW3Byb3BdKTtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5kKHJlc1twcm9wXSwgY2hpbGRDb25maWdbcHJvcF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGRDb25maWdbcHJvcF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSBjaGlsZENvbmZpZ1twcm9wXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVzW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHByb3AgaW4gcGFyZW50Q29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChwYXJlbnRDb25maWcsIHByb3ApICYmXG4gICAgICAgICAgICAgICAgICAgICFoYXNPd25Qcm9wKGNoaWxkQ29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgICAgICBpc09iamVjdChwYXJlbnRDb25maWdbcHJvcF0pKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIGNoYW5nZXMgdG8gcHJvcGVydGllcyBkb24ndCBtb2RpZnkgcGFyZW50IGNvbmZpZ1xuICAgICAgICAgICAgICAgIHJlc1twcm9wXSA9IGV4dGVuZCh7fSwgcmVzW3Byb3BdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIExvY2FsZShjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnNldChjb25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGtleXM7XG5cbiAgICBpZiAoT2JqZWN0LmtleXMpIHtcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGtleXMgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICB2YXIgaSwgcmVzID0gW107XG4gICAgICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc093blByb3Aob2JqLCBpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0Q2FsZW5kYXIgPSB7XG4gICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5IGF0XSBMVCcsXG4gICAgICAgIG5leHREYXkgOiAnW1RvbW9ycm93IGF0XSBMVCcsXG4gICAgICAgIG5leHRXZWVrIDogJ2RkZGQgW2F0XSBMVCcsXG4gICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheSBhdF0gTFQnLFxuICAgICAgICBsYXN0V2VlayA6ICdbTGFzdF0gZGRkZCBbYXRdIExUJyxcbiAgICAgICAgc2FtZUVsc2UgOiAnTCdcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbG9jYWxlX2NhbGVuZGFyX19jYWxlbmRhciAoa2V5LCBtb20sIG5vdykge1xuICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fY2FsZW5kYXJba2V5XSB8fCB0aGlzLl9jYWxlbmRhclsnc2FtZUVsc2UnXTtcbiAgICAgICAgcmV0dXJuIGlzRnVuY3Rpb24ob3V0cHV0KSA/IG91dHB1dC5jYWxsKG1vbSwgbm93KSA6IG91dHB1dDtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvbmdEYXRlRm9ybWF0ID0ge1xuICAgICAgICBMVFMgIDogJ2g6bW06c3MgQScsXG4gICAgICAgIExUICAgOiAnaDptbSBBJyxcbiAgICAgICAgTCAgICA6ICdNTS9ERC9ZWVlZJyxcbiAgICAgICAgTEwgICA6ICdNTU1NIEQsIFlZWVknLFxuICAgICAgICBMTEwgIDogJ01NTU0gRCwgWVlZWSBoOm1tIEEnLFxuICAgICAgICBMTExMIDogJ2RkZGQsIE1NTU0gRCwgWVlZWSBoOm1tIEEnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGxvbmdEYXRlRm9ybWF0IChrZXkpIHtcbiAgICAgICAgdmFyIGZvcm1hdCA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV0sXG4gICAgICAgICAgICBmb3JtYXRVcHBlciA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXTtcblxuICAgICAgICBpZiAoZm9ybWF0IHx8ICFmb3JtYXRVcHBlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV0gPSBmb3JtYXRVcHBlci5yZXBsYWNlKC9NTU1NfE1NfEREfGRkZGQvZywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbC5zbGljZSgxKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV07XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRJbnZhbGlkRGF0ZSA9ICdJbnZhbGlkIGRhdGUnO1xuXG4gICAgZnVuY3Rpb24gaW52YWxpZERhdGUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faW52YWxpZERhdGU7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRPcmRpbmFsID0gJyVkJztcbiAgICB2YXIgZGVmYXVsdE9yZGluYWxQYXJzZSA9IC9cXGR7MSwyfS87XG5cbiAgICBmdW5jdGlvbiBvcmRpbmFsIChudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29yZGluYWwucmVwbGFjZSgnJWQnLCBudW1iZXIpO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0UmVsYXRpdmVUaW1lID0ge1xuICAgICAgICBmdXR1cmUgOiAnaW4gJXMnLFxuICAgICAgICBwYXN0ICAgOiAnJXMgYWdvJyxcbiAgICAgICAgcyAgOiAnYSBmZXcgc2Vjb25kcycsXG4gICAgICAgIG0gIDogJ2EgbWludXRlJyxcbiAgICAgICAgbW0gOiAnJWQgbWludXRlcycsXG4gICAgICAgIGggIDogJ2FuIGhvdXInLFxuICAgICAgICBoaCA6ICclZCBob3VycycsXG4gICAgICAgIGQgIDogJ2EgZGF5JyxcbiAgICAgICAgZGQgOiAnJWQgZGF5cycsXG4gICAgICAgIE0gIDogJ2EgbW9udGgnLFxuICAgICAgICBNTSA6ICclZCBtb250aHMnLFxuICAgICAgICB5ICA6ICdhIHllYXInLFxuICAgICAgICB5eSA6ICclZCB5ZWFycydcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcmVsYXRpdmVfX3JlbGF0aXZlVGltZSAobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbc3RyaW5nXTtcbiAgICAgICAgcmV0dXJuIChpc0Z1bmN0aW9uKG91dHB1dCkpID9cbiAgICAgICAgICAgIG91dHB1dChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIDpcbiAgICAgICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhc3RGdXR1cmUgKGRpZmYsIG91dHB1dCkge1xuICAgICAgICB2YXIgZm9ybWF0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW2RpZmYgPiAwID8gJ2Z1dHVyZScgOiAncGFzdCddO1xuICAgICAgICByZXR1cm4gaXNGdW5jdGlvbihmb3JtYXQpID8gZm9ybWF0KG91dHB1dCkgOiBmb3JtYXQucmVwbGFjZSgvJXMvaSwgb3V0cHV0KTtcbiAgICB9XG5cbiAgICB2YXIgYWxpYXNlcyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gYWRkVW5pdEFsaWFzICh1bml0LCBzaG9ydGhhbmQpIHtcbiAgICAgICAgdmFyIGxvd2VyQ2FzZSA9IHVuaXQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgYWxpYXNlc1tsb3dlckNhc2VdID0gYWxpYXNlc1tsb3dlckNhc2UgKyAncyddID0gYWxpYXNlc1tzaG9ydGhhbmRdID0gdW5pdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVVbml0cyh1bml0cykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHVuaXRzID09PSAnc3RyaW5nJyA/IGFsaWFzZXNbdW5pdHNdIHx8IGFsaWFzZXNbdW5pdHMudG9Mb3dlckNhc2UoKV0gOiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplT2JqZWN0VW5pdHMoaW5wdXRPYmplY3QpIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IHt9LFxuICAgICAgICAgICAgbm9ybWFsaXplZFByb3AsXG4gICAgICAgICAgICBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBpbnB1dE9iamVjdCkge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3AoaW5wdXRPYmplY3QsIHByb3ApKSB7XG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3AgPSBub3JtYWxpemVVbml0cyhwcm9wKTtcbiAgICAgICAgICAgICAgICBpZiAobm9ybWFsaXplZFByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZElucHV0W25vcm1hbGl6ZWRQcm9wXSA9IGlucHV0T2JqZWN0W3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub3JtYWxpemVkSW5wdXQ7XG4gICAgfVxuXG4gICAgdmFyIHByaW9yaXRpZXMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFVuaXRQcmlvcml0eSh1bml0LCBwcmlvcml0eSkge1xuICAgICAgICBwcmlvcml0aWVzW3VuaXRdID0gcHJpb3JpdHk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0c09iaikge1xuICAgICAgICB2YXIgdW5pdHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgdSBpbiB1bml0c09iaikge1xuICAgICAgICAgICAgdW5pdHMucHVzaCh7dW5pdDogdSwgcHJpb3JpdHk6IHByaW9yaXRpZXNbdV19KTtcbiAgICAgICAgfVxuICAgICAgICB1bml0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdW5pdHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUdldFNldCAodW5pdCwga2VlcFRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBnZXRfc2V0X19zZXQodGhpcywgdW5pdCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQodGhpcywga2VlcFRpbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0X3NldF9fZ2V0KHRoaXMsIHVuaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldF9zZXRfX2dldCAobW9tLCB1bml0KSB7XG4gICAgICAgIHJldHVybiBtb20uaXNWYWxpZCgpID9cbiAgICAgICAgICAgIG1vbS5fZFsnZ2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSgpIDogTmFOO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldF9zZXRfX3NldCAobW9tLCB1bml0LCB2YWx1ZSkge1xuICAgICAgICBpZiAobW9tLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIHN0cmluZ0dldCAodW5pdHMpIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBzdHJpbmdTZXQgKHVuaXRzLCB2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHVuaXRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVPYmplY3RVbml0cyh1bml0cyk7XG4gICAgICAgICAgICB2YXIgcHJpb3JpdGl6ZWQgPSBnZXRQcmlvcml0aXplZFVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJpb3JpdGl6ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzW3ByaW9yaXRpemVkW2ldLnVuaXRdKHVuaXRzW3ByaW9yaXRpemVkW2ldLnVuaXRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odGhpc1t1bml0c10pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB6ZXJvRmlsbChudW1iZXIsIHRhcmdldExlbmd0aCwgZm9yY2VTaWduKSB7XG4gICAgICAgIHZhciBhYnNOdW1iZXIgPSAnJyArIE1hdGguYWJzKG51bWJlciksXG4gICAgICAgICAgICB6ZXJvc1RvRmlsbCA9IHRhcmdldExlbmd0aCAtIGFic051bWJlci5sZW5ndGgsXG4gICAgICAgICAgICBzaWduID0gbnVtYmVyID49IDA7XG4gICAgICAgIHJldHVybiAoc2lnbiA/IChmb3JjZVNpZ24gPyAnKycgOiAnJykgOiAnLScpICtcbiAgICAgICAgICAgIE1hdGgucG93KDEwLCBNYXRoLm1heCgwLCB6ZXJvc1RvRmlsbCkpLnRvU3RyaW5nKCkuc3Vic3RyKDEpICsgYWJzTnVtYmVyO1xuICAgIH1cblxuICAgIHZhciBmb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KFtIaF1tbShzcyk/fE1vfE1NP00/TT98RG98REREb3xERD9EP0Q/fGRkZD9kP3xkbz98d1tvfHddP3xXW298V10/fFFvP3xZWVlZWVl8WVlZWVl8WVlZWXxZWXxnZyhnZ2c/KT98R0coR0dHPyk/fGV8RXxhfEF8aGg/fEhIP3xraz98bW0/fHNzP3xTezEsOX18eHxYfHp6P3xaWj98LikvZztcblxuICAgIHZhciBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFRTfExUfExMP0w/TD98bHsxLDR9KS9nO1xuXG4gICAgdmFyIGZvcm1hdEZ1bmN0aW9ucyA9IHt9O1xuXG4gICAgdmFyIGZvcm1hdFRva2VuRnVuY3Rpb25zID0ge307XG5cbiAgICAvLyB0b2tlbjogICAgJ00nXG4gICAgLy8gcGFkZGVkOiAgIFsnTU0nLCAyXVxuICAgIC8vIG9yZGluYWw6ICAnTW8nXG4gICAgLy8gY2FsbGJhY2s6IGZ1bmN0aW9uICgpIHsgdGhpcy5tb250aCgpICsgMSB9XG4gICAgZnVuY3Rpb24gYWRkRm9ybWF0VG9rZW4gKHRva2VuLCBwYWRkZWQsIG9yZGluYWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBmdW5jID0gY2FsbGJhY2s7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBmdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2NhbGxiYWNrXSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSA9IGZ1bmM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhZGRlZCkge1xuICAgICAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbcGFkZGVkWzBdXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gemVyb0ZpbGwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBwYWRkZWRbMV0sIHBhZGRlZFsyXSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcmRpbmFsKSB7XG4gICAgICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1tvcmRpbmFsXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkub3JkaW5hbChmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRva2VuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5tYXRjaCgvXFxbW1xcc1xcU10vKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcXFwvZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gJycsIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJyYXlbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxuICAgIGZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcbiAgICAgICAgaWYgKCFtLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG0ubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBleHBhbmRGb3JtYXQoZm9ybWF0LCBtLmxvY2FsZURhdGEoKSk7XG4gICAgICAgIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdID0gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gfHwgbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCk7XG5cbiAgICAgICAgcmV0dXJuIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKG0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4cGFuZEZvcm1hdChmb3JtYXQsIGxvY2FsZSkge1xuICAgICAgICB2YXIgaSA9IDU7XG5cbiAgICAgICAgZnVuY3Rpb24gcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKGlucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlLmxvbmdEYXRlRm9ybWF0KGlucHV0KSB8fCBpbnB1dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy5sYXN0SW5kZXggPSAwO1xuICAgICAgICB3aGlsZSAoaSA+PSAwICYmIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy50ZXN0KGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKGxvY2FsRm9ybWF0dGluZ1Rva2VucywgcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKTtcbiAgICAgICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy5sYXN0SW5kZXggPSAwO1xuICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcm1hdDtcbiAgICB9XG5cbiAgICB2YXIgbWF0Y2gxICAgICAgICAgPSAvXFxkLzsgICAgICAgICAgICAvLyAgICAgICAwIC0gOVxuICAgIHZhciBtYXRjaDIgICAgICAgICA9IC9cXGRcXGQvOyAgICAgICAgICAvLyAgICAgIDAwIC0gOTlcbiAgICB2YXIgbWF0Y2gzICAgICAgICAgPSAvXFxkezN9LzsgICAgICAgICAvLyAgICAgMDAwIC0gOTk5XG4gICAgdmFyIG1hdGNoNCAgICAgICAgID0gL1xcZHs0fS87ICAgICAgICAgLy8gICAgMDAwMCAtIDk5OTlcbiAgICB2YXIgbWF0Y2g2ICAgICAgICAgPSAvWystXT9cXGR7Nn0vOyAgICAvLyAtOTk5OTk5IC0gOTk5OTk5XG4gICAgdmFyIG1hdGNoMXRvMiAgICAgID0gL1xcZFxcZD8vOyAgICAgICAgIC8vICAgICAgIDAgLSA5OVxuICAgIHZhciBtYXRjaDN0bzQgICAgICA9IC9cXGRcXGRcXGRcXGQ/LzsgICAgIC8vICAgICA5OTkgLSA5OTk5XG4gICAgdmFyIG1hdGNoNXRvNiAgICAgID0gL1xcZFxcZFxcZFxcZFxcZFxcZD8vOyAvLyAgIDk5OTk5IC0gOTk5OTk5XG4gICAgdmFyIG1hdGNoMXRvMyAgICAgID0gL1xcZHsxLDN9LzsgICAgICAgLy8gICAgICAgMCAtIDk5OVxuICAgIHZhciBtYXRjaDF0bzQgICAgICA9IC9cXGR7MSw0fS87ICAgICAgIC8vICAgICAgIDAgLSA5OTk5XG4gICAgdmFyIG1hdGNoMXRvNiAgICAgID0gL1srLV0/XFxkezEsNn0vOyAgLy8gLTk5OTk5OSAtIDk5OTk5OVxuXG4gICAgdmFyIG1hdGNoVW5zaWduZWQgID0gL1xcZCsvOyAgICAgICAgICAgLy8gICAgICAgMCAtIGluZlxuICAgIHZhciBtYXRjaFNpZ25lZCAgICA9IC9bKy1dP1xcZCsvOyAgICAgIC8vICAgIC1pbmYgLSBpbmZcblxuICAgIHZhciBtYXRjaE9mZnNldCAgICA9IC9afFsrLV1cXGRcXGQ6P1xcZFxcZC9naTsgLy8gKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG4gICAgdmFyIG1hdGNoU2hvcnRPZmZzZXQgPSAvWnxbKy1dXFxkXFxkKD86Oj9cXGRcXGQpPy9naTsgLy8gKzAwIC0wMCArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcblxuICAgIHZhciBtYXRjaFRpbWVzdGFtcCA9IC9bKy1dP1xcZCsoXFwuXFxkezEsM30pPy87IC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXG5cbiAgICAvLyBhbnkgd29yZCAob3IgdHdvKSBjaGFyYWN0ZXJzIG9yIG51bWJlcnMgaW5jbHVkaW5nIHR3by90aHJlZSB3b3JkIG1vbnRoIGluIGFyYWJpYy5cbiAgICAvLyBpbmNsdWRlcyBzY290dGlzaCBnYWVsaWMgdHdvIHdvcmQgYW5kIGh5cGhlbmF0ZWQgbW9udGhzXG4gICAgdmFyIG1hdGNoV29yZCA9IC9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pO1xuXG5cbiAgICB2YXIgcmVnZXhlcyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gYWRkUmVnZXhUb2tlbiAodG9rZW4sIHJlZ2V4LCBzdHJpY3RSZWdleCkge1xuICAgICAgICByZWdleGVzW3Rva2VuXSA9IGlzRnVuY3Rpb24ocmVnZXgpID8gcmVnZXggOiBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZURhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiAoaXNTdHJpY3QgJiYgc3RyaWN0UmVnZXgpID8gc3RyaWN0UmVnZXggOiByZWdleDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4gKHRva2VuLCBjb25maWcpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHJlZ2V4ZXMsIHRva2VuKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodW5lc2NhcGVGb3JtYXQodG9rZW4pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZWdleGVzW3Rva2VuXShjb25maWcuX3N0cmljdCwgY29uZmlnLl9sb2NhbGUpO1xuICAgIH1cblxuICAgIC8vIENvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjE0OTMvaXMtdGhlcmUtYS1yZWdleHAtZXNjYXBlLWZ1bmN0aW9uLWluLWphdmFzY3JpcHRcbiAgICBmdW5jdGlvbiB1bmVzY2FwZUZvcm1hdChzKSB7XG4gICAgICAgIHJldHVybiByZWdleEVzY2FwZShzLnJlcGxhY2UoJ1xcXFwnLCAnJykucmVwbGFjZSgvXFxcXChcXFspfFxcXFwoXFxdKXxcXFsoW15cXF1cXFtdKilcXF18XFxcXCguKS9nLCBmdW5jdGlvbiAobWF0Y2hlZCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgICAgIHJldHVybiBwMSB8fCBwMiB8fCBwMyB8fCBwNDtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlZ2V4RXNjYXBlKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgfVxuXG4gICAgdmFyIHRva2VucyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gYWRkUGFyc2VUb2tlbiAodG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBpLCBmdW5jID0gY2FsbGJhY2s7XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0b2tlbiA9IFt0b2tlbl07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbY2FsbGJhY2tdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdG9rZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRva2Vuc1t0b2tlbltpXV0gPSBmdW5jO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkV2Vla1BhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgICAgICBhZGRQYXJzZVRva2VuKHRva2VuLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XG4gICAgICAgICAgICBjYWxsYmFjayhpbnB1dCwgY29uZmlnLl93LCBjb25maWcsIHRva2VuKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIGlucHV0LCBjb25maWcpIHtcbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwgJiYgaGFzT3duUHJvcCh0b2tlbnMsIHRva2VuKSkge1xuICAgICAgICAgICAgdG9rZW5zW3Rva2VuXShpbnB1dCwgY29uZmlnLl9hLCBjb25maWcsIHRva2VuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBZRUFSID0gMDtcbiAgICB2YXIgTU9OVEggPSAxO1xuICAgIHZhciBEQVRFID0gMjtcbiAgICB2YXIgSE9VUiA9IDM7XG4gICAgdmFyIE1JTlVURSA9IDQ7XG4gICAgdmFyIFNFQ09ORCA9IDU7XG4gICAgdmFyIE1JTExJU0VDT05EID0gNjtcbiAgICB2YXIgV0VFSyA9IDc7XG4gICAgdmFyIFdFRUtEQVkgPSA4O1xuXG4gICAgdmFyIGluZGV4T2Y7XG5cbiAgICBpZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICAgICAgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4T2YgPSBmdW5jdGlvbiAobykge1xuICAgICAgICAgICAgLy8gSSBrbm93XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IG8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCArIDEsIDApKS5nZXRVVENEYXRlKCk7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ00nLCBbJ01NJywgMl0sICdNbycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignTU1NJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdNTU1NJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzKHRoaXMsIGZvcm1hdCk7XG4gICAgfSk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ21vbnRoJywgJ00nKTtcblxuICAgIC8vIFBSSU9SSVRZXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ21vbnRoJywgOCk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdNJywgICAgbWF0Y2gxdG8yKTtcbiAgICBhZGRSZWdleFRva2VuKCdNTScsICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ01NTScsICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLm1vbnRoc1Nob3J0UmVnZXgoaXNTdHJpY3QpO1xuICAgIH0pO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ01NTU0nLCBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLm1vbnRoc1JlZ2V4KGlzU3RyaWN0KTtcbiAgICB9KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydNJywgJ01NJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbTU9OVEhdID0gdG9JbnQoaW5wdXQpIC0gMTtcbiAgICB9KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydNTU0nLCAnTU1NTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHZhciBtb250aCA9IGNvbmZpZy5fbG9jYWxlLm1vbnRoc1BhcnNlKGlucHV0LCB0b2tlbiwgY29uZmlnLl9zdHJpY3QpO1xuICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBhIG1vbnRoIG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZC5cbiAgICAgICAgaWYgKG1vbnRoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGFycmF5W01PTlRIXSA9IG1vbnRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZE1vbnRoID0gaW5wdXQ7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIExPQ0FMRVNcblxuICAgIHZhciBNT05USFNfSU5fRk9STUFUID0gL0Rbb0RdPyhcXFtbXlxcW1xcXV0qXFxdfFxccyspK01NTU0/LztcbiAgICB2YXIgZGVmYXVsdExvY2FsZU1vbnRocyA9ICdKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyJy5zcGxpdCgnXycpO1xuICAgIGZ1bmN0aW9uIGxvY2FsZU1vbnRocyAobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRocztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHMpID8gdGhpcy5fbW9udGhzW20ubW9udGgoKV0gOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzWyh0aGlzLl9tb250aHMuaXNGb3JtYXQgfHwgTU9OVEhTX0lOX0ZPUk1BVCkudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCA9ICdKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlYycuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHNTaG9ydCAobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRoc1Nob3J0KSA/IHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV0gOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRbTU9OVEhTX0lOX0ZPUk1BVC50ZXN0KGZvcm1hdCkgPyAnZm9ybWF0JyA6ICdzdGFuZGFsb25lJ11bbS5tb250aCgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bml0c19tb250aF9faGFuZGxlU3RyaWN0UGFyc2UobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gbW9udGhOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IHVzZWRcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgKytpKSB7XG4gICAgICAgICAgICAgICAgbW9tID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRocyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHNQYXJzZSAobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuaXRzX21vbnRoX19oYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIHNvcnRpbmdcbiAgICAgICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSBtb250aCAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlclxuICAgICAgICAvLyBzZWUgc29ydGluZyBpbiBjb21wdXRlTW9udGhzUGFyc2VcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICAgICAgbW9tID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnJykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdHJpY3QgJiYgIXRoaXMuX21vbnRoc1BhcnNlW2ldKSB7XG4gICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NTScgJiYgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NJyAmJiB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgZnVuY3Rpb24gc2V0TW9udGggKG1vbSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGRheU9mTW9udGg7XG5cbiAgICAgICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAvLyBObyBvcFxuICAgICAgICAgICAgcmV0dXJuIG1vbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRvSW50KHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBtb20ubG9jYWxlRGF0YSgpLm1vbnRoc1BhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb207XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksIGRheXNJbk1vbnRoKG1vbS55ZWFyKCksIHZhbHVlKSk7XG4gICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyAnTW9udGgnXSh2YWx1ZSwgZGF5T2ZNb250aCk7XG4gICAgICAgIHJldHVybiBtb207XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0TW9udGggKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzZXRNb250aCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0X3NldF9fZ2V0KHRoaXMsICdNb250aCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGF5c0luTW9udGggKCkge1xuICAgICAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRNb250aHNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuICAgIGZ1bmN0aW9uIG1vbnRoc1Nob3J0UmVnZXggKGlzU3RyaWN0KSB7XG4gICAgICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gZGVmYXVsdE1vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdE1vbnRoc1JlZ2V4ID0gbWF0Y2hXb3JkO1xuICAgIGZ1bmN0aW9uIG1vbnRoc1JlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgICAgIGNvbXB1dGVNb250aHNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUmVnZXggPSBkZWZhdWx0TW9udGhzUmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4IDogdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlTW9udGhzUGFyc2UgKCkge1xuICAgICAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICAgICAgaSwgbW9tO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgICAgIHNob3J0UGllY2VzLnB1c2godGhpcy5tb250aHNTaG9ydChtb20sICcnKSk7XG4gICAgICAgICAgICBsb25nUGllY2VzLnB1c2godGhpcy5tb250aHMobW9tLCAnJykpO1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRocyhtb20sICcnKSk7XG4gICAgICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAgICAgLy8gd2lsbCBtYXRjaCB0aGUgbG9uZ2VyIHBpZWNlLlxuICAgICAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgICAgICBtaXhlZFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICBzaG9ydFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKHNob3J0UGllY2VzW2ldKTtcbiAgICAgICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9tb250aHNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRSZWdleCA9IHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgICAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgICAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdZJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeSA9IHRoaXMueWVhcigpO1xuICAgICAgICByZXR1cm4geSA8PSA5OTk5ID8gJycgKyB5IDogJysnICsgeTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnWVknLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy55ZWFyKCkgJSAxMDA7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVknLCAgIDRdLCAgICAgICAwLCAneWVhcicpO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWVknLCAgNV0sICAgICAgIDAsICd5ZWFyJyk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWVknLCA2LCB0cnVlXSwgMCwgJ3llYXInKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygneWVhcicsICd5Jyk7XG5cbiAgICAvLyBQUklPUklUSUVTXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3llYXInLCAxKTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1knLCAgICAgIG1hdGNoU2lnbmVkKTtcbiAgICBhZGRSZWdleFRva2VuKCdZWScsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignWVlZWScsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1lZWVlZJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbiAgICBhZGRSZWdleFRva2VuKCdZWVlZWVknLCBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnWVlZWVknLCAnWVlZWVlZJ10sIFlFQVIpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1lZWVknLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W1lFQVJdID0gaW5wdXQubGVuZ3RoID09PSAyID8gdXRpbHNfaG9va3NfX2hvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KSA6IHRvSW50KGlucHV0KTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdZWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbWUVBUl0gPSB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1knLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W1lFQVJdID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIGZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xuICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgICAgICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xuICAgIH1cblxuICAgIC8vIEhPT0tTXG5cbiAgICB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcbiAgICB9O1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgdmFyIGdldFNldFllYXIgPSBtYWtlR2V0U2V0KCdGdWxsWWVhcicsIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gZ2V0SXNMZWFwWWVhciAoKSB7XG4gICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHRoaXMueWVhcigpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEYXRlICh5LCBtLCBkLCBoLCBNLCBzLCBtcykge1xuICAgICAgICAvL2Nhbid0IGp1c3QgYXBwbHkoKSB0byBjcmVhdGUgYSBkYXRlOlxuICAgICAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTgxMzQ4L2luc3RhbnRpYXRpbmctYS1qYXZhc2NyaXB0LW9iamVjdC1ieS1jYWxsaW5nLXByb3RvdHlwZS1jb25zdHJ1Y3Rvci1hcHBseVxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKTtcblxuICAgICAgICAvL3RoZSBkYXRlIGNvbnN0cnVjdG9yIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgICAgICBpZiAoeSA8IDEwMCAmJiB5ID49IDAgJiYgaXNGaW5pdGUoZGF0ZS5nZXRGdWxsWWVhcigpKSkge1xuICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVVVENEYXRlICh5KSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG5cbiAgICAgICAgLy90aGUgRGF0ZS5VVEMgZnVuY3Rpb24gcmVtYXBzIHllYXJzIDAtOTkgdG8gMTkwMC0xOTk5XG4gICAgICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpKSB7XG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIC8vIHN0YXJ0LW9mLWZpcnN0LXdlZWsgLSBzdGFydC1vZi15ZWFyXG4gICAgZnVuY3Rpb24gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSB7XG4gICAgICAgIHZhciAvLyBmaXJzdC13ZWVrIGRheSAtLSB3aGljaCBqYW51YXJ5IGlzIGFsd2F5cyBpbiB0aGUgZmlyc3Qgd2VlayAoNCBmb3IgaXNvLCAxIGZvciBvdGhlcilcbiAgICAgICAgICAgIGZ3ZCA9IDcgKyBkb3cgLSBkb3ksXG4gICAgICAgICAgICAvLyBmaXJzdC13ZWVrIGRheSBsb2NhbCB3ZWVrZGF5IC0tIHdoaWNoIGxvY2FsIHdlZWtkYXkgaXMgZndkXG4gICAgICAgICAgICBmd2RsdyA9ICg3ICsgY3JlYXRlVVRDRGF0ZSh5ZWFyLCAwLCBmd2QpLmdldFVUQ0RheSgpIC0gZG93KSAlIDc7XG5cbiAgICAgICAgcmV0dXJuIC1md2RsdyArIGZ3ZCAtIDE7XG4gICAgfVxuXG4gICAgLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgICAgIHZhciBsb2NhbFdlZWtkYXkgPSAoNyArIHdlZWtkYXkgLSBkb3cpICUgNyxcbiAgICAgICAgICAgIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciwgZG93LCBkb3kpLFxuICAgICAgICAgICAgZGF5T2ZZZWFyID0gMSArIDcgKiAod2VlayAtIDEpICsgbG9jYWxXZWVrZGF5ICsgd2Vla09mZnNldCxcbiAgICAgICAgICAgIHJlc1llYXIsIHJlc0RheU9mWWVhcjtcblxuICAgICAgICBpZiAoZGF5T2ZZZWFyIDw9IDApIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSB5ZWFyIC0gMTtcbiAgICAgICAgICAgIHJlc0RheU9mWWVhciA9IGRheXNJblllYXIocmVzWWVhcikgKyBkYXlPZlllYXI7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyKSkge1xuICAgICAgICAgICAgcmVzWWVhciA9IHllYXIgKyAxO1xuICAgICAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyIC0gZGF5c0luWWVhcih5ZWFyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSB5ZWFyO1xuICAgICAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IHJlc1llYXIsXG4gICAgICAgICAgICBkYXlPZlllYXI6IHJlc0RheU9mWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdlZWtPZlllYXIobW9tLCBkb3csIGRveSkge1xuICAgICAgICB2YXIgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldChtb20ueWVhcigpLCBkb3csIGRveSksXG4gICAgICAgICAgICB3ZWVrID0gTWF0aC5mbG9vcigobW9tLmRheU9mWWVhcigpIC0gd2Vla09mZnNldCAtIDEpIC8gNykgKyAxLFxuICAgICAgICAgICAgcmVzV2VlaywgcmVzWWVhcjtcblxuICAgICAgICBpZiAod2VlayA8IDEpIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpIC0gMTtcbiAgICAgICAgICAgIHJlc1dlZWsgPSB3ZWVrICsgd2Vla3NJblllYXIocmVzWWVhciwgZG93LCBkb3kpO1xuICAgICAgICB9IGVsc2UgaWYgKHdlZWsgPiB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSkpIHtcbiAgICAgICAgICAgIHJlc1dlZWsgPSB3ZWVrIC0gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpO1xuICAgICAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCkgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCk7XG4gICAgICAgICAgICByZXNXZWVrID0gd2VlaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWVrOiByZXNXZWVrLFxuICAgICAgICAgICAgeWVhcjogcmVzWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdlZWtzSW5ZZWFyKHllYXIsIGRvdywgZG95KSB7XG4gICAgICAgIHZhciB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgICAgIHdlZWtPZmZzZXROZXh0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIgKyAxLCBkb3csIGRveSk7XG4gICAgICAgIHJldHVybiAoZGF5c0luWWVhcih5ZWFyKSAtIHdlZWtPZmZzZXQgKyB3ZWVrT2Zmc2V0TmV4dCkgLyA3O1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCd3JywgWyd3dycsIDJdLCAnd28nLCAnd2VlaycpO1xuICAgIGFkZEZvcm1hdFRva2VuKCdXJywgWydXVycsIDJdLCAnV28nLCAnaXNvV2VlaycpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrJywgJ3cnKTtcbiAgICBhZGRVbml0QWxpYXMoJ2lzb1dlZWsnLCAnVycpO1xuXG4gICAgLy8gUFJJT1JJVElFU1xuXG4gICAgYWRkVW5pdFByaW9yaXR5KCd3ZWVrJywgNSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrJywgNSk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCd3JywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignd3cnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignVycsICBtYXRjaDF0bzIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1dXJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG4gICAgYWRkV2Vla1BhcnNlVG9rZW4oWyd3JywgJ3d3JywgJ1cnLCAnV1cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHdlZWtbdG9rZW4uc3Vic3RyKDAsIDEpXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIC8vIExPQ0FMRVNcblxuICAgIGZ1bmN0aW9uIGxvY2FsZVdlZWsgKG1vbSkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb20sIHRoaXMuX3dlZWsuZG93LCB0aGlzLl93ZWVrLmRveSkud2VlaztcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvY2FsZVdlZWsgPSB7XG4gICAgICAgIGRvdyA6IDAsIC8vIFN1bmRheSBpcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZXZWVrICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWsuZG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZZZWFyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWsuZG95O1xuICAgIH1cblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFNldFdlZWsgKGlucHV0KSB7XG4gICAgICAgIHZhciB3ZWVrID0gdGhpcy5sb2NhbGVEYXRhKCkud2Vlayh0aGlzKTtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT1dlZWsgKGlucHV0KSB7XG4gICAgICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xuICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2QnLCAwLCAnZG8nLCAnZGF5Jyk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c01pbih0aGlzLCBmb3JtYXQpO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2RkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdkZGRkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdlJywgMCwgMCwgJ3dlZWtkYXknKTtcbiAgICBhZGRGb3JtYXRUb2tlbignRScsIDAsIDAsICdpc29XZWVrZGF5Jyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2RheScsICdkJyk7XG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrZGF5JywgJ2UnKTtcbiAgICBhZGRVbml0QWxpYXMoJ2lzb1dlZWtkYXknLCAnRScpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2RheScsIDExKTtcbiAgICBhZGRVbml0UHJpb3JpdHkoJ3dlZWtkYXknLCAxMSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrZGF5JywgMTEpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignZCcsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignZScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignRScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNNaW5SZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG4gICAgYWRkUmVnZXhUb2tlbignZGRkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzU2hvcnRSZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG4gICAgYWRkUmVnZXhUb2tlbignZGRkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1JlZ2V4KGlzU3RyaWN0KTtcbiAgICB9KTtcblxuICAgIGFkZFdlZWtQYXJzZVRva2VuKFsnZGQnLCAnZGRkJywgJ2RkZGQnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5ID0gY29uZmlnLl9sb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAgICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIHdlZWtkYXkgbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkXG4gICAgICAgIGlmICh3ZWVrZGF5ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHdlZWsuZCA9IHdlZWtkYXk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pbnZhbGlkV2Vla2RheSA9IGlucHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhZGRXZWVrUGFyc2VUb2tlbihbJ2QnLCAnZScsICdFJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgICAgICB3ZWVrW3Rva2VuXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGlucHV0LCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCA9IGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlSXNvV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpICUgNyB8fCA3O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc05hTihpbnB1dCkgPyBudWxsIDogaW5wdXQ7XG4gICAgfVxuXG4gICAgLy8gTE9DQUxFU1xuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5cyA9ICdTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheScuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5cyAobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzW20uZGF5KCldIDpcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzW3RoaXMuX3dlZWtkYXlzLmlzRm9ybWF0LnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLmRheSgpXTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQgPSAnU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0Jy5zcGxpdCgnXycpO1xuICAgIGZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzU2hvcnQgKG0pIHtcbiAgICAgICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV0gOiB0aGlzLl93ZWVrZGF5c1Nob3J0O1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0TG9jYWxlV2Vla2RheXNNaW4gPSAnU3VfTW9fVHVfV2VfVGhfRnJfU2EnLnNwbGl0KCdfJyk7XG4gICAgZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNNaW4gKG0pIHtcbiAgICAgICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNNaW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5X29mX3dlZWtfX2hhbmRsZVN0cmljdFBhcnNlKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gd2Vla2RheU5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7ICsraSkge1xuICAgICAgICAgICAgICAgIG1vbSA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c01pbihtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0gPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2RkZGQnKSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5c1BhcnNlICh3ZWVrZGF5TmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGRheV9vZl93ZWVrX19oYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuXG4gICAgICAgICAgICBtb20gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9mdWxsV2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkZGQnICYmIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZGQnICYmIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGQnICYmIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRTZXREYXlPZldlZWsgKGlucHV0KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoaW5wdXQgLSBkYXksICdkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZGF5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3cpICUgNztcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoaW5wdXQgLSB3ZWVrZGF5LCAnZCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT0RheU9mV2VlayAoaW5wdXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgICAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgICAgICAvLyBhcyBhIHNldHRlciwgc3VuZGF5IHNob3VsZCBiZWxvbmcgdG8gdGhlIHByZXZpb3VzIHdlZWsuXG5cbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciB3ZWVrZGF5ID0gcGFyc2VJc29XZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXkodGhpcy5kYXkoKSAlIDcgPyB3ZWVrZGF5IDogd2Vla2RheSAtIDcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCkgfHwgNztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWZhdWx0V2Vla2RheXNSZWdleCA9IG1hdGNoV29yZDtcbiAgICBmdW5jdGlvbiB3ZWVrZGF5c1JlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNSZWdleCA9IGRlZmF1bHRXZWVrZGF5c1JlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRXZWVrZGF5c1Nob3J0UmVnZXggPSBtYXRjaFdvcmQ7XG4gICAgZnVuY3Rpb24gd2Vla2RheXNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzU2hvcnRSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWZhdWx0V2Vla2RheXNNaW5SZWdleCA9IG1hdGNoV29yZDtcbiAgICBmdW5jdGlvbiB3ZWVrZGF5c01pblJlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNNaW5SZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5SZWdleCA9IGRlZmF1bHRXZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBjb21wdXRlV2Vla2RheXNQYXJzZSAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNtcExlblJldihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtaW5QaWVjZXMgPSBbXSwgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICAgICAgaSwgbW9tLCBtaW5wLCBzaG9ydHAsIGxvbmdwO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgICAgIG1vbSA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgIG1pbnAgPSB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgc2hvcnRwID0gdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgbG9uZ3AgPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpO1xuICAgICAgICAgICAgbWluUGllY2VzLnB1c2gobWlucCk7XG4gICAgICAgICAgICBzaG9ydFBpZWNlcy5wdXNoKHNob3J0cCk7XG4gICAgICAgICAgICBsb25nUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgICAgIG1peGVkUGllY2VzLnB1c2goc2hvcnRwKTtcbiAgICAgICAgICAgIG1peGVkUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgd2Vla2RheSAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlciBpdFxuICAgICAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgICAgIG1pblBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIHNob3J0UGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICAgICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgICAgICAgICBtaXhlZFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKG1peGVkUGllY2VzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBtaXhlZFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleCA9IHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzTWluUmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuXG4gICAgICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgICAgICB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWluUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB9XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBmdW5jdGlvbiBoRm9ybWF0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga0Zvcm1hdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKSB8fCAyNDtcbiAgICB9XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSCcsIFsnSEgnLCAyXSwgMCwgJ2hvdXInKTtcbiAgICBhZGRGb3JtYXRUb2tlbignaCcsIFsnaGgnLCAyXSwgMCwgaEZvcm1hdCk7XG4gICAgYWRkRm9ybWF0VG9rZW4oJ2snLCBbJ2trJywgMl0sIDAsIGtGb3JtYXQpO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2htbScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdobW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSG1tJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJycgKyB0aGlzLmhvdXJzKCkgKyB6ZXJvRmlsbCh0aGlzLm1pbnV0ZXMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJyArIHRoaXMuaG91cnMoKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXJpZGllbSAodG9rZW4sIGxvd2VyY2FzZSkge1xuICAgICAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGxvd2VyY2FzZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG1lcmlkaWVtKCdhJywgdHJ1ZSk7XG4gICAgbWVyaWRpZW0oJ0EnLCBmYWxzZSk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2hvdXInLCAnaCcpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2hvdXInLCAxMyk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBmdW5jdGlvbiBtYXRjaE1lcmlkaWVtIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUuX21lcmlkaWVtUGFyc2U7XG4gICAgfVxuXG4gICAgYWRkUmVnZXhUb2tlbignYScsICBtYXRjaE1lcmlkaWVtKTtcbiAgICBhZGRSZWdleFRva2VuKCdBJywgIG1hdGNoTWVyaWRpZW0pO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0gnLCAgbWF0Y2gxdG8yKTtcbiAgICBhZGRSZWdleFRva2VuKCdoJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignSEgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignaGgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5cbiAgICBhZGRSZWdleFRva2VuKCdobW0nLCBtYXRjaDN0bzQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ2htbXNzJywgbWF0Y2g1dG82KTtcbiAgICBhZGRSZWdleFRva2VuKCdIbW0nLCBtYXRjaDN0bzQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0htbXNzJywgbWF0Y2g1dG82KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydIJywgJ0hIJ10sIEhPVVIpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydhJywgJ0EnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5faXNQbSA9IGNvbmZpZy5fbG9jYWxlLmlzUE0oaW5wdXQpO1xuICAgICAgICBjb25maWcuX21lcmlkaWVtID0gaW5wdXQ7XG4gICAgfSk7XG4gICAgYWRkUGFyc2VUb2tlbihbJ2gnLCAnaGgnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdobW0nLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvcykpO1xuICAgICAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvcykpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdobW1zcycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgICAgIHZhciBwb3MyID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICAgICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zMSkpO1xuICAgICAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICAgICAgYXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MyKSk7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB0cnVlO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ0htbScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICB2YXIgcG9zID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICAgICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zKSk7XG4gICAgfSk7XG4gICAgYWRkUGFyc2VUb2tlbignSG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBvczEgPSBpbnB1dC5sZW5ndGggLSA0O1xuICAgICAgICB2YXIgcG9zMiA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICAgICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MxLCAyKSk7XG4gICAgICAgIGFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMikpO1xuICAgIH0pO1xuXG4gICAgLy8gTE9DQUxFU1xuXG4gICAgZnVuY3Rpb24gbG9jYWxlSXNQTSAoaW5wdXQpIHtcbiAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAvLyBVc2luZyBjaGFyQXQgc2hvdWxkIGJlIG1vcmUgY29tcGF0aWJsZS5cbiAgICAgICAgcmV0dXJuICgoaW5wdXQgKyAnJykudG9Mb3dlckNhc2UoKS5jaGFyQXQoMCkgPT09ICdwJyk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlID0gL1thcF1cXC4/bT9cXC4/L2k7XG4gICAgZnVuY3Rpb24gbG9jYWxlTWVyaWRpZW0gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XG4gICAgICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgLy8gU2V0dGluZyB0aGUgaG91ciBzaG91bGQga2VlcCB0aGUgdGltZSwgYmVjYXVzZSB0aGUgdXNlciBleHBsaWNpdGx5XG4gICAgLy8gc3BlY2lmaWVkIHdoaWNoIGhvdXIgaGUgd2FudHMuIFNvIHRyeWluZyB0byBtYWludGFpbiB0aGUgc2FtZSBob3VyIChpblxuICAgIC8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuICAgIC8vIHRoaXMgcnVsZS5cbiAgICB2YXIgZ2V0U2V0SG91ciA9IG1ha2VHZXRTZXQoJ0hvdXJzJywgdHJ1ZSk7XG5cbiAgICB2YXIgYmFzZUNvbmZpZyA9IHtcbiAgICAgICAgY2FsZW5kYXI6IGRlZmF1bHRDYWxlbmRhcixcbiAgICAgICAgbG9uZ0RhdGVGb3JtYXQ6IGRlZmF1bHRMb25nRGF0ZUZvcm1hdCxcbiAgICAgICAgaW52YWxpZERhdGU6IGRlZmF1bHRJbnZhbGlkRGF0ZSxcbiAgICAgICAgb3JkaW5hbDogZGVmYXVsdE9yZGluYWwsXG4gICAgICAgIG9yZGluYWxQYXJzZTogZGVmYXVsdE9yZGluYWxQYXJzZSxcbiAgICAgICAgcmVsYXRpdmVUaW1lOiBkZWZhdWx0UmVsYXRpdmVUaW1lLFxuXG4gICAgICAgIG1vbnRoczogZGVmYXVsdExvY2FsZU1vbnRocyxcbiAgICAgICAgbW9udGhzU2hvcnQ6IGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCxcblxuICAgICAgICB3ZWVrOiBkZWZhdWx0TG9jYWxlV2VlayxcblxuICAgICAgICB3ZWVrZGF5czogZGVmYXVsdExvY2FsZVdlZWtkYXlzLFxuICAgICAgICB3ZWVrZGF5c01pbjogZGVmYXVsdExvY2FsZVdlZWtkYXlzTWluLFxuICAgICAgICB3ZWVrZGF5c1Nob3J0OiBkZWZhdWx0TG9jYWxlV2Vla2RheXNTaG9ydCxcblxuICAgICAgICBtZXJpZGllbVBhcnNlOiBkZWZhdWx0TG9jYWxlTWVyaWRpZW1QYXJzZVxuICAgIH07XG5cbiAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsb2NhbGUgY29uZmlnIGZpbGVzXG4gICAgdmFyIGxvY2FsZXMgPSB7fTtcbiAgICB2YXIgZ2xvYmFsTG9jYWxlO1xuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5ID8ga2V5LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnXycsICctJykgOiBrZXk7XG4gICAgfVxuXG4gICAgLy8gcGljayB0aGUgbG9jYWxlIGZyb20gdGhlIGFycmF5XG4gICAgLy8gdHJ5IFsnZW4tYXUnLCAnZW4tZ2InXSBhcyAnZW4tYXUnLCAnZW4tZ2InLCAnZW4nLCBhcyBpbiBtb3ZlIHRocm91Z2ggdGhlIGxpc3QgdHJ5aW5nIGVhY2hcbiAgICAvLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG4gICAgZnVuY3Rpb24gY2hvb3NlTG9jYWxlKG5hbWVzKSB7XG4gICAgICAgIHZhciBpID0gMCwgaiwgbmV4dCwgbG9jYWxlLCBzcGxpdDtcblxuICAgICAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaV0pLnNwbGl0KCctJyk7XG4gICAgICAgICAgICBqID0gc3BsaXQubGVuZ3RoO1xuICAgICAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xuICAgICAgICAgICAgd2hpbGUgKGogPiAwKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2FsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZExvY2FsZShuYW1lKSB7XG4gICAgICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgICAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheSB0byByZWdpc3RlciBhbmQgbG9hZCBhbGwgdGhlIGxvY2FsZXMgaW4gTm9kZVxuICAgICAgICBpZiAoIWxvY2FsZXNbbmFtZV0gJiYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSAmJlxuICAgICAgICAgICAgICAgIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBvbGRMb2NhbGUgPSBnbG9iYWxMb2NhbGUuX2FiYnI7XG4gICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9sb2NhbGUvJyArIG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2UgZGVmaW5lTG9jYWxlIGN1cnJlbnRseSBhbHNvIHNldHMgdGhlIGdsb2JhbCBsb2NhbGUsIHdlXG4gICAgICAgICAgICAgICAgLy8gd2FudCB0byB1bmRvIHRoYXQgZm9yIGxhenkgbG9hZGVkIGxvY2FsZXNcbiAgICAgICAgICAgICAgICBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlKG9sZExvY2FsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsb2NhbGUgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbG9jYWxlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxvY2FsZSBrZXkuXG4gICAgZnVuY3Rpb24gbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChpc1VuZGVmaW5lZCh2YWx1ZXMpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIG1vbWVudC5kdXJhdGlvbi5fbG9jYWxlID0gbW9tZW50Ll9sb2NhbGUgPSBkYXRhO1xuICAgICAgICAgICAgICAgIGdsb2JhbExvY2FsZSA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2xvYmFsTG9jYWxlLl9hYmJyO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmluZUxvY2FsZSAobmFtZSwgY29uZmlnKSB7XG4gICAgICAgIGlmIChjb25maWcgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAgICAgY29uZmlnLmFiYnIgPSBuYW1lO1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlcHJlY2F0ZVNpbXBsZSgnZGVmaW5lTG9jYWxlT3ZlcnJpZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3VzZSBtb21lbnQudXBkYXRlTG9jYWxlKGxvY2FsZU5hbWUsIGNvbmZpZykgdG8gY2hhbmdlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2FuIGV4aXN0aW5nIGxvY2FsZS4gbW9tZW50LmRlZmluZUxvY2FsZShsb2NhbGVOYW1lLCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb25maWcpIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNyZWF0aW5nIGEgbmV3IGxvY2FsZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kZWZpbmUtbG9jYWxlLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbbmFtZV0uX2NvbmZpZztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdLl9jb25maWc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJlYXQgYXMgaWYgdGhlcmUgaXMgbm8gYmFzZSBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKCdwYXJlbnRMb2NhbGVVbmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzcGVjaWZpZWQgcGFyZW50TG9jYWxlIGlzIG5vdCBkZWZpbmVkIHlldC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvcGFyZW50LWxvY2FsZS8nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbmV3IExvY2FsZShtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpKTtcblxuICAgICAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdCBmb3Igbm93OiBhbHNvIHNldCB0aGUgbG9jYWxlXG4gICAgICAgICAgICBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHVzZWZ1bCBmb3IgdGVzdGluZ1xuICAgICAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUxvY2FsZShuYW1lLCBjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgbG9jYWxlLCBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW25hbWVdLl9jb25maWc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25maWcgPSBtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpO1xuICAgICAgICAgICAgbG9jYWxlID0gbmV3IExvY2FsZShjb25maWcpO1xuICAgICAgICAgICAgbG9jYWxlLnBhcmVudExvY2FsZSA9IGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbG9jYWxlO1xuXG4gICAgICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgICAgIGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGUobmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBwYXNzIG51bGwgZm9yIGNvbmZpZyB0byB1bnVwZGF0ZSwgdXNlZnVsIGZvciB0ZXN0c1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBsb2NhbGUgZGF0YVxuICAgIGZ1bmN0aW9uIGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUgKGtleSkge1xuICAgICAgICB2YXIgbG9jYWxlO1xuXG4gICAgICAgIGlmIChrZXkgJiYga2V5Ll9sb2NhbGUgJiYga2V5Ll9sb2NhbGUuX2FiYnIpIHtcbiAgICAgICAgICAgIGtleSA9IGtleS5fbG9jYWxlLl9hYmJyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWxMb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShrZXkpO1xuICAgICAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXkgPSBba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaG9vc2VMb2NhbGUoa2V5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVfbG9jYWxlc19fbGlzdExvY2FsZXMoKSB7XG4gICAgICAgIHJldHVybiBrZXlzKGxvY2FsZXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cgKG0pIHtcbiAgICAgICAgdmFyIG92ZXJmbG93O1xuICAgICAgICB2YXIgYSA9IG0uX2E7XG5cbiAgICAgICAgaWYgKGEgJiYgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID09PSAtMikge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPVxuICAgICAgICAgICAgICAgIGFbTU9OVEhdICAgICAgIDwgMCB8fCBhW01PTlRIXSAgICAgICA+IDExICA/IE1PTlRIIDpcbiAgICAgICAgICAgICAgICBhW0RBVEVdICAgICAgICA8IDEgfHwgYVtEQVRFXSAgICAgICAgPiBkYXlzSW5Nb250aChhW1lFQVJdLCBhW01PTlRIXSkgPyBEQVRFIDpcbiAgICAgICAgICAgICAgICBhW0hPVVJdICAgICAgICA8IDAgfHwgYVtIT1VSXSAgICAgICAgPiAyNCB8fCAoYVtIT1VSXSA9PT0gMjQgJiYgKGFbTUlOVVRFXSAhPT0gMCB8fCBhW1NFQ09ORF0gIT09IDAgfHwgYVtNSUxMSVNFQ09ORF0gIT09IDApKSA/IEhPVVIgOlxuICAgICAgICAgICAgICAgIGFbTUlOVVRFXSAgICAgIDwgMCB8fCBhW01JTlVURV0gICAgICA+IDU5ICA/IE1JTlVURSA6XG4gICAgICAgICAgICAgICAgYVtTRUNPTkRdICAgICAgPCAwIHx8IGFbU0VDT05EXSAgICAgID4gNTkgID8gU0VDT05EIDpcbiAgICAgICAgICAgICAgICBhW01JTExJU0VDT05EXSA8IDAgfHwgYVtNSUxMSVNFQ09ORF0gPiA5OTkgPyBNSUxMSVNFQ09ORCA6XG4gICAgICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gREFURTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93V2Vla3MgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSBXRUVLO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrZGF5ICYmIG92ZXJmbG93ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gV0VFS0RBWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbTtcbiAgICB9XG5cbiAgICAvLyBpc28gODYwMSByZWdleFxuICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgIHZhciBleHRlbmRlZElzb1JlZ2V4ID0gL15cXHMqKCg/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzpcXGRcXGQtXFxkXFxkfFdcXGRcXGQtXFxkfFdcXGRcXGR8XFxkXFxkXFxkfFxcZFxcZCkpKD86KFR8ICkoXFxkXFxkKD86OlxcZFxcZCg/OjpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPy87XG4gICAgdmFyIGJhc2ljSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pKD86XFxkXFxkXFxkXFxkfFdcXGRcXGRcXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzpcXGRcXGQoPzpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPy87XG5cbiAgICB2YXIgdHpSZWdleCA9IC9afFsrLV1cXGRcXGQoPzo6P1xcZFxcZCk/LztcblxuICAgIHZhciBpc29EYXRlcyA9IFtcbiAgICAgICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkXFxkLVxcZFxcZC9dLFxuICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZFxcZC1cXGQvXSxcbiAgICAgICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkXFxkLywgZmFsc2VdLFxuICAgICAgICBbJ1lZWVktREREJywgL1xcZHs0fS1cXGR7M30vXSxcbiAgICAgICAgWydZWVlZLU1NJywgL1xcZHs0fS1cXGRcXGQvLCBmYWxzZV0sXG4gICAgICAgIFsnWVlZWVlZTU1ERCcsIC9bKy1dXFxkezEwfS9dLFxuICAgICAgICBbJ1lZWVlNTUREJywgL1xcZHs4fS9dLFxuICAgICAgICAvLyBZWVlZTU0gaXMgTk9UIGFsbG93ZWQgYnkgdGhlIHN0YW5kYXJkXG4gICAgICAgIFsnR0dHR1tXXVdXRScsIC9cXGR7NH1XXFxkezN9L10sXG4gICAgICAgIFsnR0dHR1tXXVdXJywgL1xcZHs0fVdcXGR7Mn0vLCBmYWxzZV0sXG4gICAgICAgIFsnWVlZWURERCcsIC9cXGR7N30vXVxuICAgIF07XG5cbiAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgdmFyIGlzb1RpbWVzID0gW1xuICAgICAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgICAgIFsnSEg6bW06c3MsU1NTUycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZCxcXGQrL10sXG4gICAgICAgIFsnSEg6bW06c3MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxcbiAgICAgICAgWydISDptbScsIC9cXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgIFsnSEhtbXNzLlNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkXFwuXFxkKy9dLFxuICAgICAgICBbJ0hIbW1zcyxTU1NTJywgL1xcZFxcZFxcZFxcZFxcZFxcZCxcXGQrL10sXG4gICAgICAgIFsnSEhtbXNzJywgL1xcZFxcZFxcZFxcZFxcZFxcZC9dLFxuICAgICAgICBbJ0hIbW0nLCAvXFxkXFxkXFxkXFxkL10sXG4gICAgICAgIFsnSEgnLCAvXFxkXFxkL11cbiAgICBdO1xuXG4gICAgdmFyIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2k7XG5cbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdFxuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21JU08oY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBsLFxuICAgICAgICAgICAgc3RyaW5nID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2ggPSBleHRlbmRlZElzb1JlZ2V4LmV4ZWMoc3RyaW5nKSB8fCBiYXNpY0lzb1JlZ2V4LmV4ZWMoc3RyaW5nKSxcbiAgICAgICAgICAgIGFsbG93VGltZSwgZGF0ZUZvcm1hdCwgdGltZUZvcm1hdCwgdHpGb3JtYXQ7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pc28gPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb0RhdGVzW2ldWzFdLmV4ZWMobWF0Y2hbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQgPSBpc29EYXRlc1tpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dUaW1lID0gaXNvRGF0ZXNbaV1bMl0gIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0ZUZvcm1hdCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNvVGltZXNbaV1bMV0uZXhlYyhtYXRjaFszXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzJdIHNob3VsZCBiZSAnVCcgb3Igc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVGb3JtYXQgPSAobWF0Y2hbMl0gfHwgJyAnKSArIGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVGb3JtYXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYWxsb3dUaW1lICYmIHRpbWVGb3JtYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtYXRjaFs0XSkge1xuICAgICAgICAgICAgICAgIGlmICh0elJlZ2V4LmV4ZWMobWF0Y2hbNF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHR6Rm9ybWF0ID0gJ1onO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uZmlnLl9mID0gZGF0ZUZvcm1hdCArICh0aW1lRm9ybWF0IHx8ICcnKSArICh0ekZvcm1hdCB8fCAnJyk7XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZyhjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhjb25maWcuX2kpO1xuXG4gICAgICAgIGlmIChtYXRjaGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWdGcm9tSVNPKGNvbmZpZyk7XG4gICAgICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xuICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgICAgICd2YWx1ZSBwcm92aWRlZCBpcyBub3QgaW4gYSByZWNvZ25pemVkIElTTyBmb3JtYXQuIG1vbWVudCBjb25zdHJ1Y3Rpb24gZmFsbHMgYmFjayB0byBqcyBEYXRlKCksICcgK1xuICAgICAgICAnd2hpY2ggaXMgbm90IHJlbGlhYmxlIGFjcm9zcyBhbGwgYnJvd3NlcnMgYW5kIHZlcnNpb25zLiBOb24gSVNPIGRhdGUgZm9ybWF0cyBhcmUgJyArXG4gICAgICAgICdkaXNjb3VyYWdlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIG1ham9yIHJlbGVhc2UuIFBsZWFzZSByZWZlciB0byAnICtcbiAgICAgICAgJ2h0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvanMtZGF0ZS8gZm9yIG1vcmUgaW5mby4nLFxuICAgICAgICBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShjb25maWcuX2kgKyAoY29uZmlnLl91c2VVVEMgPyAnIFVUQycgOiAnJykpO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBpY2sgdGhlIGZpcnN0IGRlZmluZWQgb2YgdHdvIG9yIHRocmVlIGFyZ3VtZW50cy5cbiAgICBmdW5jdGlvbiBkZWZhdWx0cyhhLCBiLCBjKSB7XG4gICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChiICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKSB7XG4gICAgICAgIC8vIGhvb2tzIGlzIGFjdHVhbGx5IHRoZSBleHBvcnRlZCBtb21lbnQgb2JqZWN0XG4gICAgICAgIHZhciBub3dWYWx1ZSA9IG5ldyBEYXRlKHV0aWxzX2hvb2tzX19ob29rcy5ub3coKSk7XG4gICAgICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICAgICAgcmV0dXJuIFtub3dWYWx1ZS5nZXRVVENGdWxsWWVhcigpLCBub3dWYWx1ZS5nZXRVVENNb250aCgpLCBub3dWYWx1ZS5nZXRVVENEYXRlKCldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbbm93VmFsdWUuZ2V0RnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0TW9udGgoKSwgbm93VmFsdWUuZ2V0RGF0ZSgpXTtcbiAgICB9XG5cbiAgICAvLyBjb252ZXJ0IGFuIGFycmF5IHRvIGEgZGF0ZS5cbiAgICAvLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuICAgIC8vIG5vdGU6IGFsbCB2YWx1ZXMgcGFzdCB0aGUgeWVhciBhcmUgb3B0aW9uYWwgYW5kIHdpbGwgZGVmYXVsdCB0byB0aGUgbG93ZXN0IHBvc3NpYmxlIHZhbHVlLlxuICAgIC8vIFt5ZWFyLCBtb250aCwgZGF5ICwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kXVxuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21BcnJheSAoY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBkYXRlLCBpbnB1dCA9IFtdLCBjdXJyZW50RGF0ZSwgeWVhclRvVXNlO1xuXG4gICAgICAgIGlmIChjb25maWcuX2QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGVBcnJheShjb25maWcpO1xuXG4gICAgICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICAgICAgaWYgKGNvbmZpZy5fdyAmJiBjb25maWcuX2FbREFURV0gPT0gbnVsbCAmJiBjb25maWcuX2FbTU9OVEhdID09IG51bGwpIHtcbiAgICAgICAgICAgIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pZiB0aGUgZGF5IG9mIHRoZSB5ZWFyIGlzIHNldCwgZmlndXJlIG91dCB3aGF0IGl0IGlzXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhcikge1xuICAgICAgICAgICAgeWVhclRvVXNlID0gZGVmYXVsdHMoY29uZmlnLl9hW1lFQVJdLCBjdXJyZW50RGF0ZVtZRUFSXSk7XG5cbiAgICAgICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhciA+IGRheXNJblllYXIoeWVhclRvVXNlKSkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd0RheU9mWWVhciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKHllYXJUb1VzZSwgMCwgY29uZmlnLl9kYXlPZlllYXIpO1xuICAgICAgICAgICAgY29uZmlnLl9hW01PTlRIXSA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtEQVRFXSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IGRhdGUuXG4gICAgICAgIC8vICogaWYgbm8geWVhciwgbW9udGgsIGRheSBvZiBtb250aCBhcmUgZ2l2ZW4sIGRlZmF1bHQgdG8gdG9kYXlcbiAgICAgICAgLy8gKiBpZiBkYXkgb2YgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgbW9udGggYW5kIHllYXJcbiAgICAgICAgLy8gKiBpZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBvbmx5IHllYXJcbiAgICAgICAgLy8gKiBpZiB5ZWFyIGlzIGdpdmVuLCBkb24ndCBkZWZhdWx0IGFueXRoaW5nXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzICYmIGNvbmZpZy5fYVtpXSA9PSBudWxsOyArK2kpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gY3VycmVudERhdGVbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBaZXJvIG91dCB3aGF0ZXZlciB3YXMgbm90IGRlZmF1bHRlZCwgaW5jbHVkaW5nIHRpbWVcbiAgICAgICAgZm9yICg7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gKGNvbmZpZy5fYVtpXSA9PSBudWxsKSA/IChpID09PSAyID8gMSA6IDApIDogY29uZmlnLl9hW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIDI0OjAwOjAwLjAwMFxuICAgICAgICBpZiAoY29uZmlnLl9hW0hPVVJdID09PSAyNCAmJlxuICAgICAgICAgICAgICAgIGNvbmZpZy5fYVtNSU5VVEVdID09PSAwICYmXG4gICAgICAgICAgICAgICAgY29uZmlnLl9hW1NFQ09ORF0gPT09IDAgJiZcbiAgICAgICAgICAgICAgICBjb25maWcuX2FbTUlMTElTRUNPTkRdID09PSAwKSB7XG4gICAgICAgICAgICBjb25maWcuX25leHREYXkgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IGNyZWF0ZVVUQ0RhdGUgOiBjcmVhdGVEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XG4gICAgICAgIC8vIEFwcGx5IHRpbWV6b25lIG9mZnNldCBmcm9tIGlucHV0LiBUaGUgYWN0dWFsIHV0Y09mZnNldCBjYW4gYmUgY2hhbmdlZFxuICAgICAgICAvLyB3aXRoIHBhcnNlWm9uZS5cbiAgICAgICAgaWYgKGNvbmZpZy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZC5zZXRVVENNaW51dGVzKGNvbmZpZy5fZC5nZXRVVENNaW51dGVzKCkgLSBjb25maWcuX3R6bSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLl9uZXh0RGF5KSB7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAyNDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpIHtcbiAgICAgICAgdmFyIHcsIHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSwgdGVtcCwgd2Vla2RheU92ZXJmbG93O1xuXG4gICAgICAgIHcgPSBjb25maWcuX3c7XG4gICAgICAgIGlmICh3LkdHICE9IG51bGwgfHwgdy5XICE9IG51bGwgfHwgdy5FICE9IG51bGwpIHtcbiAgICAgICAgICAgIGRvdyA9IDE7XG4gICAgICAgICAgICBkb3kgPSA0O1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBXZSBuZWVkIHRvIHRha2UgdGhlIGN1cnJlbnQgaXNvV2Vla1llYXIsIGJ1dCB0aGF0IGRlcGVuZHMgb25cbiAgICAgICAgICAgIC8vIGhvdyB3ZSBpbnRlcnByZXQgbm93IChsb2NhbCwgdXRjLCBmaXhlZCBvZmZzZXQpLiBTbyBjcmVhdGVcbiAgICAgICAgICAgIC8vIGEgbm93IHZlcnNpb24gb2YgY3VycmVudCBjb25maWcgKHRha2UgbG9jYWwvdXRjL29mZnNldCBmbGFncywgYW5kXG4gICAgICAgICAgICAvLyBjcmVhdGUgbm93KS5cbiAgICAgICAgICAgIHdlZWtZZWFyID0gZGVmYXVsdHMody5HRywgY29uZmlnLl9hW1lFQVJdLCB3ZWVrT2ZZZWFyKGxvY2FsX19jcmVhdGVMb2NhbCgpLCAxLCA0KS55ZWFyKTtcbiAgICAgICAgICAgIHdlZWsgPSBkZWZhdWx0cyh3LlcsIDEpO1xuICAgICAgICAgICAgd2Vla2RheSA9IGRlZmF1bHRzKHcuRSwgMSk7XG4gICAgICAgICAgICBpZiAod2Vla2RheSA8IDEgfHwgd2Vla2RheSA+IDcpIHtcbiAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG93ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG93O1xuICAgICAgICAgICAgZG95ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG95O1xuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuZ2csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihsb2NhbF9fY3JlYXRlTG9jYWwoKSwgZG93LCBkb3kpLnllYXIpO1xuICAgICAgICAgICAgd2VlayA9IGRlZmF1bHRzKHcudywgMSk7XG5cbiAgICAgICAgICAgIGlmICh3LmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIHdlZWtkYXkgLS0gbG93IGRheSBudW1iZXJzIGFyZSBjb25zaWRlcmVkIG5leHQgd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmQ7XG4gICAgICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCAwIHx8IHdlZWtkYXkgPiA2KSB7XG4gICAgICAgICAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGxvY2FsIHdlZWtkYXkgLS0gY291bnRpbmcgc3RhcnRzIGZyb20gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmUgKyBkb3c7XG4gICAgICAgICAgICAgICAgaWYgKHcuZSA8IDAgfHwgdy5lID4gNikge1xuICAgICAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byBiZWdpbmluZyBvZiB3ZWVrXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IGRvdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAod2VlayA8IDEgfHwgd2VlayA+IHdlZWtzSW5ZZWFyKHdlZWtZZWFyLCBkb3csIGRveSkpIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtzID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh3ZWVrZGF5T3ZlcmZsb3cgIT0gbnVsbCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuX292ZXJmbG93V2Vla2RheSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0ZW1wID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgICAgICAgICBjb25maWcuX2FbWUVBUl0gPSB0ZW1wLnllYXI7XG4gICAgICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc3RhbnQgdGhhdCByZWZlcnMgdG8gdGhlIElTTyBzdGFuZGFyZFxuICAgIHV0aWxzX2hvb2tzX19ob29rcy5JU09fODYwMSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZ1xuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKSB7XG4gICAgICAgIC8vIFRPRE86IE1vdmUgdGhpcyB0byBhbm90aGVyIHBhcnQgb2YgdGhlIGNyZWF0aW9uIGZsb3cgdG8gcHJldmVudCBjaXJjdWxhciBkZXBzXG4gICAgICAgIGlmIChjb25maWcuX2YgPT09IHV0aWxzX2hvb2tzX19ob29rcy5JU09fODYwMSkge1xuICAgICAgICAgICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLl9hID0gW107XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gdHJ1ZTtcblxuICAgICAgICAvLyBUaGlzIGFycmF5IGlzIHVzZWQgdG8gbWFrZSBhIERhdGUsIGVpdGhlciB3aXRoIGBuZXcgRGF0ZWAgb3IgYERhdGUuVVRDYFxuICAgICAgICB2YXIgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXG4gICAgICAgICAgICBpLCBwYXJzZWRJbnB1dCwgdG9rZW5zLCB0b2tlbiwgc2tpcHBlZCxcbiAgICAgICAgICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcblxuICAgICAgICB0b2tlbnMgPSBleHBhbmRGb3JtYXQoY29uZmlnLl9mLCBjb25maWcuX2xvY2FsZSkubWF0Y2goZm9ybWF0dGluZ1Rva2VucykgfHwgW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICAgICAgICBwYXJzZWRJbnB1dCA9IChzdHJpbmcubWF0Y2goZ2V0UGFyc2VSZWdleEZvclRva2VuKHRva2VuLCBjb25maWcpKSB8fCBbXSlbMF07XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndG9rZW4nLCB0b2tlbiwgJ3BhcnNlZElucHV0JywgcGFyc2VkSW5wdXQsXG4gICAgICAgICAgICAvLyAgICAgICAgICdyZWdleCcsIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSk7XG4gICAgICAgICAgICBpZiAocGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBza2lwcGVkID0gc3RyaW5nLnN1YnN0cigwLCBzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkpO1xuICAgICAgICAgICAgICAgIGlmIChza2lwcGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBwYXJzZWRJbnB1dCwgY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbmZpZy5fc3RyaWN0ICYmICFwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgICAgIGlmIChzdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkSW5wdXQucHVzaChzdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2xlYXIgXzEyaCBmbGFnIGlmIGhvdXIgaXMgPD0gMTJcbiAgICAgICAgaWYgKGNvbmZpZy5fYVtIT1VSXSA8PSAxMiAmJlxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID4gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnBhcnNlZERhdGVQYXJ0cyA9IGNvbmZpZy5fYS5zbGljZSgwKTtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykubWVyaWRpZW0gPSBjb25maWcuX21lcmlkaWVtO1xuICAgICAgICAvLyBoYW5kbGUgbWVyaWRpZW1cbiAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gbWVyaWRpZW1GaXhXcmFwKGNvbmZpZy5fbG9jYWxlLCBjb25maWcuX2FbSE9VUl0sIGNvbmZpZy5fbWVyaWRpZW0pO1xuXG4gICAgICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBtZXJpZGllbUZpeFdyYXAgKGxvY2FsZSwgaG91ciwgbWVyaWRpZW0pIHtcbiAgICAgICAgdmFyIGlzUG07XG5cbiAgICAgICAgaWYgKG1lcmlkaWVtID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgIHJldHVybiBob3VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbGUubWVyaWRpZW1Ib3VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbGUubWVyaWRpZW1Ib3VyKGhvdXIsIG1lcmlkaWVtKTtcbiAgICAgICAgfSBlbHNlIGlmIChsb2NhbGUuaXNQTSAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBGYWxsYmFja1xuICAgICAgICAgICAgaXNQbSA9IGxvY2FsZS5pc1BNKG1lcmlkaWVtKTtcbiAgICAgICAgICAgIGlmIChpc1BtICYmIGhvdXIgPCAxMikge1xuICAgICAgICAgICAgICAgIGhvdXIgKz0gMTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzUG0gJiYgaG91ciA9PT0gMTIpIHtcbiAgICAgICAgICAgICAgICBob3VyID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBob3VyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBub3Qgc3VwcG9zZWQgdG8gaGFwcGVuXG4gICAgICAgICAgICByZXR1cm4gaG91cjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGFycmF5IG9mIGZvcm1hdCBzdHJpbmdzXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZykge1xuICAgICAgICB2YXIgdGVtcENvbmZpZyxcbiAgICAgICAgICAgIGJlc3RNb21lbnQsXG5cbiAgICAgICAgICAgIHNjb3JlVG9CZWF0LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZTtcblxuICAgICAgICBpZiAoY29uZmlnLl9mLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudFNjb3JlID0gMDtcbiAgICAgICAgICAgIHRlbXBDb25maWcgPSBjb3B5Q29uZmlnKHt9LCBjb25maWcpO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZW1wQ29uZmlnLl91c2VVVEMgPSBjb25maWcuX3VzZVVUQztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KHRlbXBDb25maWcpO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkX19pc1ZhbGlkKHRlbXBDb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGFueSBpbnB1dCB0aGF0IHdhcyBub3QgcGFyc2VkIGFkZCBhIHBlbmFsdHkgZm9yIHRoYXQgZm9ybWF0XG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLmNoYXJzTGVmdE92ZXI7XG5cbiAgICAgICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLnVudXNlZFRva2Vucy5sZW5ndGggKiAxMDtcblxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLnNjb3JlID0gY3VycmVudFNjb3JlO1xuXG4gICAgICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xuICAgICAgICAgICAgICAgIHNjb3JlVG9CZWF0ID0gY3VycmVudFNjb3JlO1xuICAgICAgICAgICAgICAgIGJlc3RNb21lbnQgPSB0ZW1wQ29uZmlnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKGNvbmZpZywgYmVzdE1vbWVudCB8fCB0ZW1wQ29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maWdGcm9tT2JqZWN0KGNvbmZpZykge1xuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaSA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGNvbmZpZy5faSk7XG4gICAgICAgIGNvbmZpZy5fYSA9IG1hcChbaS55ZWFyLCBpLm1vbnRoLCBpLmRheSB8fCBpLmRhdGUsIGkuaG91ciwgaS5taW51dGUsIGkuc2Vjb25kLCBpLm1pbGxpc2Vjb25kXSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIG9iaiAmJiBwYXJzZUludChvYmosIDEwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRnJvbUNvbmZpZyAoY29uZmlnKSB7XG4gICAgICAgIHZhciByZXMgPSBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3cocHJlcGFyZUNvbmZpZyhjb25maWcpKSk7XG4gICAgICAgIGlmIChyZXMuX25leHREYXkpIHtcbiAgICAgICAgICAgIC8vIEFkZGluZyBpcyBzbWFydCBlbm91Z2ggYXJvdW5kIERTVFxuICAgICAgICAgICAgcmVzLmFkZCgxLCAnZCcpO1xuICAgICAgICAgICAgcmVzLl9uZXh0RGF5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlQ29uZmlnIChjb25maWcpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgZm9ybWF0ID0gY29uZmlnLl9mO1xuXG4gICAgICAgIGNvbmZpZy5fbG9jYWxlID0gY29uZmlnLl9sb2NhbGUgfHwgbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZShjb25maWcuX2wpO1xuXG4gICAgICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCAoZm9ybWF0ID09PSB1bmRlZmluZWQgJiYgaW5wdXQgPT09ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkX19jcmVhdGVJbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGNvbmZpZy5fbG9jYWxlLnByZXBhcnNlKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc01vbWVudChpbnB1dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3coaW5wdXQpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCkge1xuICAgICAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgICAgICB9ICBlbHNlIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21JbnB1dChjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZF9faXNWYWxpZChjb25maWcpKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maWdGcm9tSW5wdXQoY29uZmlnKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faTtcbiAgICAgICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHV0aWxzX2hvb2tzX19ob29rcy5ub3coKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNEYXRlKGlucHV0KSkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQudmFsdWVPZigpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYSA9IG1hcChpbnB1dC5zbGljZSgwKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChvYmosIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21PYmplY3QoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgLy8gZnJvbSBtaWxsaXNlY29uZHNcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlTG9jYWxPclVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGlzVVRDKSB7XG4gICAgICAgIHZhciBjID0ge307XG5cbiAgICAgICAgaWYgKHR5cGVvZihsb2NhbGUpID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHN0cmljdCA9IGxvY2FsZTtcbiAgICAgICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoaXNPYmplY3QoaW5wdXQpICYmIGlzT2JqZWN0RW1wdHkoaW5wdXQpKSB8fFxuICAgICAgICAgICAgICAgIChpc0FycmF5KGlucHV0KSAmJiBpbnB1dC5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgICBpbnB1dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICAgICAgYy5fdXNlVVRDID0gYy5faXNVVEMgPSBpc1VUQztcbiAgICAgICAgYy5fbCA9IGxvY2FsZTtcbiAgICAgICAgYy5faSA9IGlucHV0O1xuICAgICAgICBjLl9mID0gZm9ybWF0O1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG5cbiAgICAgICAgcmV0dXJuIGNyZWF0ZUZyb21Db25maWcoYyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9jYWxfX2NyZWF0ZUxvY2FsIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgZmFsc2UpO1xuICAgIH1cblxuICAgIHZhciBwcm90b3R5cGVNaW4gPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQoKS5taW4gaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5tYXggaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdGhlciA9IGxvY2FsX19jcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZF9fY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIHZhciBwcm90b3R5cGVNYXggPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQoKS5tYXggaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5taW4gaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdGhlciA9IGxvY2FsX19jcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZF9fY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBpY2sgYSBtb21lbnQgbSBmcm9tIG1vbWVudHMgc28gdGhhdCBtW2ZuXShvdGhlcikgaXMgdHJ1ZSBmb3IgYWxsXG4gICAgLy8gb3RoZXIuIFRoaXMgcmVsaWVzIG9uIHRoZSBmdW5jdGlvbiBmbiB0byBiZSB0cmFuc2l0aXZlLlxuICAgIC8vXG4gICAgLy8gbW9tZW50cyBzaG91bGQgZWl0aGVyIGJlIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzIG9yIGFuIGFycmF5LCB3aG9zZVxuICAgIC8vIGZpcnN0IGVsZW1lbnQgaXMgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMuXG4gICAgZnVuY3Rpb24gcGlja0J5KGZuLCBtb21lbnRzKSB7XG4gICAgICAgIHZhciByZXMsIGk7XG4gICAgICAgIGlmIChtb21lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc0FycmF5KG1vbWVudHNbMF0pKSB7XG4gICAgICAgICAgICBtb21lbnRzID0gbW9tZW50c1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1vbWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxfX2NyZWF0ZUxvY2FsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzID0gbW9tZW50c1swXTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IG1vbWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghbW9tZW50c1tpXS5pc1ZhbGlkKCkgfHwgbW9tZW50c1tpXVtmbl0ocmVzKSkge1xuICAgICAgICAgICAgICAgIHJlcyA9IG1vbWVudHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBVc2UgW10uc29ydCBpbnN0ZWFkP1xuICAgIGZ1bmN0aW9uIG1pbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgICAgIHJldHVybiBwaWNrQnkoJ2lzQmVmb3JlJywgYXJncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF4ICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xuICAgIH1cblxuICAgIHZhciBub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdyA/IERhdGUubm93KCkgOiArKG5ldyBEYXRlKCkpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBEdXJhdGlvbiAoZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGR1cmF0aW9uKSxcbiAgICAgICAgICAgIHllYXJzID0gbm9ybWFsaXplZElucHV0LnllYXIgfHwgMCxcbiAgICAgICAgICAgIHF1YXJ0ZXJzID0gbm9ybWFsaXplZElucHV0LnF1YXJ0ZXIgfHwgMCxcbiAgICAgICAgICAgIG1vbnRocyA9IG5vcm1hbGl6ZWRJbnB1dC5tb250aCB8fCAwLFxuICAgICAgICAgICAgd2Vla3MgPSBub3JtYWxpemVkSW5wdXQud2VlayB8fCAwLFxuICAgICAgICAgICAgZGF5cyA9IG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgMCxcbiAgICAgICAgICAgIGhvdXJzID0gbm9ybWFsaXplZElucHV0LmhvdXIgfHwgMCxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBub3JtYWxpemVkSW5wdXQubWludXRlIHx8IDAsXG4gICAgICAgICAgICBzZWNvbmRzID0gbm9ybWFsaXplZElucHV0LnNlY29uZCB8fCAwLFxuICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kIHx8IDA7XG5cbiAgICAgICAgLy8gcmVwcmVzZW50YXRpb24gZm9yIGRhdGVBZGRSZW1vdmVcbiAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gK21pbGxpc2Vjb25kcyArXG4gICAgICAgICAgICBzZWNvbmRzICogMWUzICsgLy8gMTAwMFxuICAgICAgICAgICAgbWludXRlcyAqIDZlNCArIC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgaG91cnMgKiAxMDAwICogNjAgKiA2MDsgLy91c2luZyAxMDAwICogNjAgKiA2MCBpbnN0ZWFkIG9mIDM2ZTUgdG8gYXZvaWQgZmxvYXRpbmcgcG9pbnQgcm91bmRpbmcgZXJyb3JzIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8yOTc4XG4gICAgICAgIC8vIEJlY2F1c2Ugb2YgZGF0ZUFkZFJlbW92ZSB0cmVhdHMgMjQgaG91cnMgYXMgZGlmZmVyZW50IGZyb20gYVxuICAgICAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XG4gICAgICAgIHRoaXMuX2RheXMgPSArZGF5cyArXG4gICAgICAgICAgICB3ZWVrcyAqIDc7XG4gICAgICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXG4gICAgICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXG4gICAgICAgIC8vIGl0IHNlcGFyYXRlbHkuXG4gICAgICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xuICAgICAgICAgICAgcXVhcnRlcnMgKiAzICtcbiAgICAgICAgICAgIHllYXJzICogMTI7XG5cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIHRoaXMuX2xvY2FsZSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoKTtcblxuICAgICAgICB0aGlzLl9idWJibGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0R1cmF0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIER1cmF0aW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic1JvdW5kIChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKC0xICogbnVtYmVyKSAqIC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGZ1bmN0aW9uIG9mZnNldCAodG9rZW4sIHNlcGFyYXRvcikge1xuICAgICAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMudXRjT2Zmc2V0KCk7XG4gICAgICAgICAgICB2YXIgc2lnbiA9ICcrJztcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gLW9mZnNldDtcbiAgICAgICAgICAgICAgICBzaWduID0gJy0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNpZ24gKyB6ZXJvRmlsbCh+fihvZmZzZXQgLyA2MCksIDIpICsgc2VwYXJhdG9yICsgemVyb0ZpbGwofn4ob2Zmc2V0KSAlIDYwLCAyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb2Zmc2V0KCdaJywgJzonKTtcbiAgICBvZmZzZXQoJ1paJywgJycpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignWicsICBtYXRjaFNob3J0T2Zmc2V0KTtcbiAgICBhZGRSZWdleFRva2VuKCdaWicsIG1hdGNoU2hvcnRPZmZzZXQpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydaJywgJ1paJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICBjb25maWcuX3VzZVVUQyA9IHRydWU7XG4gICAgICAgIGNvbmZpZy5fdHptID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG4gICAgfSk7XG5cbiAgICAvLyBIRUxQRVJTXG5cbiAgICAvLyB0aW1lem9uZSBjaHVua2VyXG4gICAgLy8gJysxMDowMCcgPiBbJzEwJywgICcwMCddXG4gICAgLy8gJy0xNTMwJyAgPiBbJy0xNScsICczMCddXG4gICAgdmFyIGNodW5rT2Zmc2V0ID0gLyhbXFwrXFwtXXxcXGRcXGQpL2dpO1xuXG4gICAgZnVuY3Rpb24gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaGVyLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSAoKHN0cmluZyB8fCAnJykubWF0Y2gobWF0Y2hlcikgfHwgW10pO1xuICAgICAgICB2YXIgY2h1bmsgICA9IG1hdGNoZXNbbWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXTtcbiAgICAgICAgdmFyIHBhcnRzICAgPSAoY2h1bmsgKyAnJykubWF0Y2goY2h1bmtPZmZzZXQpIHx8IFsnLScsIDAsIDBdO1xuICAgICAgICB2YXIgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XG5cbiAgICAgICAgcmV0dXJuIHBhcnRzWzBdID09PSAnKycgPyBtaW51dGVzIDogLW1pbnV0ZXM7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGEgbW9tZW50IGZyb20gaW5wdXQsIHRoYXQgaXMgbG9jYWwvdXRjL3pvbmUgZXF1aXZhbGVudCB0byBtb2RlbC5cbiAgICBmdW5jdGlvbiBjbG9uZVdpdGhPZmZzZXQoaW5wdXQsIG1vZGVsKSB7XG4gICAgICAgIHZhciByZXMsIGRpZmY7XG4gICAgICAgIGlmIChtb2RlbC5faXNVVEMpIHtcbiAgICAgICAgICAgIHJlcyA9IG1vZGVsLmNsb25lKCk7XG4gICAgICAgICAgICBkaWZmID0gKGlzTW9tZW50KGlucHV0KSB8fCBpc0RhdGUoaW5wdXQpID8gaW5wdXQudmFsdWVPZigpIDogbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KS52YWx1ZU9mKCkpIC0gcmVzLnZhbHVlT2YoKTtcbiAgICAgICAgICAgIC8vIFVzZSBsb3ctbGV2ZWwgYXBpLCBiZWNhdXNlIHRoaXMgZm4gaXMgbG93LWxldmVsIGFwaS5cbiAgICAgICAgICAgIHJlcy5fZC5zZXRUaW1lKHJlcy5fZC52YWx1ZU9mKCkgKyBkaWZmKTtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQocmVzLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsX19jcmVhdGVMb2NhbChpbnB1dCkubG9jYWwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERhdGVPZmZzZXQgKG0pIHtcbiAgICAgICAgLy8gT24gRmlyZWZveC4yNCBEYXRlI2dldFRpbWV6b25lT2Zmc2V0IHJldHVybnMgYSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvcHVsbC8xODcxXG4gICAgICAgIHJldHVybiAtTWF0aC5yb3VuZChtLl9kLmdldFRpbWV6b25lT2Zmc2V0KCkgLyAxNSkgKiAxNTtcbiAgICB9XG5cbiAgICAvLyBIT09LU1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxuICAgIC8vIEl0IGlzIGludGVuZGVkIHRvIGtlZXAgdGhlIG9mZnNldCBpbiBzeW5jIHdpdGggdGhlIHRpbWV6b25lLlxuICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIC8vIGtlZXBMb2NhbFRpbWUgPSB0cnVlIG1lYW5zIG9ubHkgY2hhbmdlIHRoZSB0aW1lem9uZSwgd2l0aG91dFxuICAgIC8vIGFmZmVjdGluZyB0aGUgbG9jYWwgaG91ci4gU28gNTozMToyNiArMDMwMCAtLVt1dGNPZmZzZXQoMiwgdHJ1ZSldLS0+XG4gICAgLy8gNTozMToyNiArMDIwMCBJdCBpcyBwb3NzaWJsZSB0aGF0IDU6MzE6MjYgZG9lc24ndCBleGlzdCB3aXRoIG9mZnNldFxuICAgIC8vICswMjAwLCBzbyB3ZSBhZGp1c3QgdGhlIHRpbWUgYXMgbmVlZGVkLCB0byBiZSB2YWxpZC5cbiAgICAvL1xuICAgIC8vIEtlZXBpbmcgdGhlIHRpbWUgYWN0dWFsbHkgYWRkcy9zdWJ0cmFjdHMgKG9uZSBob3VyKVxuICAgIC8vIGZyb20gdGhlIGFjdHVhbCByZXByZXNlbnRlZCB0aW1lLiBUaGF0IGlzIHdoeSB3ZSBjYWxsIHVwZGF0ZU9mZnNldFxuICAgIC8vIGEgc2Vjb25kIHRpbWUuIEluIGNhc2UgaXQgd2FudHMgdXMgdG8gY2hhbmdlIHRoZSBvZmZzZXQgYWdhaW5cbiAgICAvLyBfY2hhbmdlSW5Qcm9ncmVzcyA9PSB0cnVlIGNhc2UsIHRoZW4gd2UgaGF2ZSB0byBhZGp1c3QsIGJlY2F1c2VcbiAgICAvLyB0aGVyZSBpcyBubyBzdWNoIHRpbWUgaW4gdGhlIGdpdmVuIHRpbWV6b25lLlxuICAgIGZ1bmN0aW9uIGdldFNldE9mZnNldCAoaW5wdXQsIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuX29mZnNldCB8fCAwLFxuICAgICAgICAgICAgbG9jYWxBZGp1c3Q7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG9mZnNldEZyb21TdHJpbmcobWF0Y2hTaG9ydE9mZnNldCwgaW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNikge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5faXNVVEMgJiYga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgICAgIGxvY2FsQWRqdXN0ID0gZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX29mZnNldCA9IGlucHV0O1xuICAgICAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGxvY2FsQWRqdXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZChsb2NhbEFkanVzdCwgJ20nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvZmZzZXQgIT09IGlucHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFrZWVwTG9jYWxUaW1lIHx8IHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkX3N1YnRyYWN0X19hZGRTdWJ0cmFjdCh0aGlzLCBjcmVhdGVfX2NyZWF0ZUR1cmF0aW9uKGlucHV0IC0gb2Zmc2V0LCAnbScpLCAxLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBvZmZzZXQgOiBnZXREYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0Wm9uZSAoaW5wdXQsIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSAtaW5wdXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KGlucHV0LCBrZWVwTG9jYWxUaW1lKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gLXRoaXMudXRjT2Zmc2V0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRPZmZzZXRUb1VUQyAoa2VlcExvY2FsVGltZSkge1xuICAgICAgICByZXR1cm4gdGhpcy51dGNPZmZzZXQoMCwga2VlcExvY2FsVGltZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0T2Zmc2V0VG9Mb2NhbCAoa2VlcExvY2FsVGltZSkge1xuICAgICAgICBpZiAodGhpcy5faXNVVEMpIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgICAgICAgICAgdGhpcy5faXNVVEMgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnRyYWN0KGdldERhdGVPZmZzZXQodGhpcyksICdtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0T2Zmc2V0VG9QYXJzZWRPZmZzZXQgKCkge1xuICAgICAgICBpZiAodGhpcy5fdHptKSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCh0aGlzLl90em0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFyIHRab25lID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaE9mZnNldCwgdGhpcy5faSk7XG5cbiAgICAgICAgICAgIGlmICh0Wm9uZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnV0Y09mZnNldChvZmZzZXRGcm9tU3RyaW5nKG1hdGNoT2Zmc2V0LCB0aGlzLl9pKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzQWxpZ25lZEhvdXJPZmZzZXQgKGlucHV0KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpbnB1dCA9IGlucHV0ID8gbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KS51dGNPZmZzZXQoKSA6IDA7XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLnV0Y09mZnNldCgpIC0gaW5wdXQpICUgNjAgPT09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXlsaWdodFNhdmluZ1RpbWUgKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCgwKS51dGNPZmZzZXQoKSB8fFxuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCg1KS51dGNPZmZzZXQoKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRGF5bGlnaHRTYXZpbmdUaW1lU2hpZnRlZCAoKSB7XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5faXNEU1RTaGlmdGVkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzRFNUU2hpZnRlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjID0ge307XG5cbiAgICAgICAgY29weUNvbmZpZyhjLCB0aGlzKTtcbiAgICAgICAgYyA9IHByZXBhcmVDb25maWcoYyk7XG5cbiAgICAgICAgaWYgKGMuX2EpIHtcbiAgICAgICAgICAgIHZhciBvdGhlciA9IGMuX2lzVVRDID8gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKGMuX2EpIDogbG9jYWxfX2NyZWF0ZUxvY2FsKGMuX2EpO1xuICAgICAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gdGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICAgICBjb21wYXJlQXJyYXlzKGMuX2EsIG90aGVyLnRvQXJyYXkoKSkgPiAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTG9jYWwgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyAhdGhpcy5faXNVVEMgOiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1V0Y09mZnNldCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMuX2lzVVRDIDogZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVdGMgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9pc1VUQyAmJiB0aGlzLl9vZmZzZXQgPT09IDAgOiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBBU1AuTkVUIGpzb24gZGF0ZSBmb3JtYXQgcmVnZXhcbiAgICB2YXIgYXNwTmV0UmVnZXggPSAvXihcXC0pPyg/OihcXGQqKVsuIF0pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKShcXC5cXGQqKT8pPyQvO1xuXG4gICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbiAgICAvLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXG4gICAgLy8gYW5kIGZ1cnRoZXIgbW9kaWZpZWQgdG8gYWxsb3cgZm9yIHN0cmluZ3MgY29udGFpbmluZyBib3RoIHdlZWsgYW5kIGRheVxuICAgIHZhciBpc29SZWdleCA9IC9eKC0pP1AoPzooLT9bMC05LC5dKilZKT8oPzooLT9bMC05LC5dKilNKT8oPzooLT9bMC05LC5dKilXKT8oPzooLT9bMC05LC5dKilEKT8oPzpUKD86KC0/WzAtOSwuXSopSCk/KD86KC0/WzAtOSwuXSopTSk/KD86KC0/WzAtOSwuXSopUyk/KT8kLztcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24gKGlucHV0LCBrZXkpIHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXG4gICAgICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsLFxuICAgICAgICAgICAgc2lnbixcbiAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgIGRpZmZSZXM7XG5cbiAgICAgICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtcyA6IGlucHV0Ll9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICAgICAgZCAgOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNICA6IGlucHV0Ll9tb250aHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uLm1pbGxpc2Vjb25kcyA9IGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gYXNwTmV0UmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeSAgOiAwLFxuICAgICAgICAgICAgICAgIGQgIDogdG9JbnQobWF0Y2hbREFURV0pICAgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgICAgICBoICA6IHRvSW50KG1hdGNoW0hPVVJdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbSAgOiB0b0ludChtYXRjaFtNSU5VVEVdKSAgICAgICAgICAgICAgICAgICAgICAgKiBzaWduLFxuICAgICAgICAgICAgICAgIHMgIDogdG9JbnQobWF0Y2hbU0VDT05EXSkgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgICAgICBtcyA6IHRvSW50KGFic1JvdW5kKG1hdGNoW01JTExJU0VDT05EXSAqIDEwMDApKSAqIHNpZ24gLy8gdGhlIG1pbGxpc2Vjb25kIGRlY2ltYWwgcG9pbnQgaXMgaW5jbHVkZWQgaW4gdGhlIG1hdGNoXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvUmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeSA6IHBhcnNlSXNvKG1hdGNoWzJdLCBzaWduKSxcbiAgICAgICAgICAgICAgICBNIDogcGFyc2VJc28obWF0Y2hbM10sIHNpZ24pLFxuICAgICAgICAgICAgICAgIHcgOiBwYXJzZUlzbyhtYXRjaFs0XSwgc2lnbiksXG4gICAgICAgICAgICAgICAgZCA6IHBhcnNlSXNvKG1hdGNoWzVdLCBzaWduKSxcbiAgICAgICAgICAgICAgICBoIDogcGFyc2VJc28obWF0Y2hbNl0sIHNpZ24pLFxuICAgICAgICAgICAgICAgIG0gOiBwYXJzZUlzbyhtYXRjaFs3XSwgc2lnbiksXG4gICAgICAgICAgICAgICAgcyA6IHBhcnNlSXNvKG1hdGNoWzhdLCBzaWduKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChkdXJhdGlvbiA9PSBudWxsKSB7Ly8gY2hlY2tzIGZvciBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdvYmplY3QnICYmICgnZnJvbScgaW4gZHVyYXRpb24gfHwgJ3RvJyBpbiBkdXJhdGlvbikpIHtcbiAgICAgICAgICAgIGRpZmZSZXMgPSBtb21lbnRzRGlmZmVyZW5jZShsb2NhbF9fY3JlYXRlTG9jYWwoZHVyYXRpb24uZnJvbSksIGxvY2FsX19jcmVhdGVMb2NhbChkdXJhdGlvbi50bykpO1xuXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICAgICAgZHVyYXRpb24ubXMgPSBkaWZmUmVzLm1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIGR1cmF0aW9uLk0gPSBkaWZmUmVzLm1vbnRocztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldCA9IG5ldyBEdXJhdGlvbihkdXJhdGlvbik7XG5cbiAgICAgICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpICYmIGhhc093blByb3AoaW5wdXQsICdfbG9jYWxlJykpIHtcbiAgICAgICAgICAgIHJldC5fbG9jYWxlID0gaW5wdXQuX2xvY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgY3JlYXRlX19jcmVhdGVEdXJhdGlvbi5mbiA9IER1cmF0aW9uLnByb3RvdHlwZTtcblxuICAgIGZ1bmN0aW9uIHBhcnNlSXNvIChpbnAsIHNpZ24pIHtcbiAgICAgICAgLy8gV2UnZCBub3JtYWxseSB1c2Ugfn5pbnAgZm9yIHRoaXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0IGFsc29cbiAgICAgICAgLy8gY29udmVydHMgZmxvYXRzIHRvIGludHMuXG4gICAgICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICAgICAgdmFyIHJlcyA9IGlucCAmJiBwYXJzZUZsb2F0KGlucC5yZXBsYWNlKCcsJywgJy4nKSk7XG4gICAgICAgIC8vIGFwcGx5IHNpZ24gd2hpbGUgd2UncmUgYXQgaXRcbiAgICAgICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICAgICAgdmFyIHJlcyA9IHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG5cbiAgICAgICAgcmVzLm1vbnRocyA9IG90aGVyLm1vbnRoKCkgLSBiYXNlLm1vbnRoKCkgK1xuICAgICAgICAgICAgKG90aGVyLnllYXIoKSAtIGJhc2UueWVhcigpKSAqIDEyO1xuICAgICAgICBpZiAoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpLmlzQWZ0ZXIob3RoZXIpKSB7XG4gICAgICAgICAgICAtLXJlcy5tb250aHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXMubWlsbGlzZWNvbmRzID0gK290aGVyIC0gKyhiYXNlLmNsb25lKCkuYWRkKHJlcy5tb250aHMsICdNJykpO1xuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICAgICAgdmFyIHJlcztcbiAgICAgICAgaWYgKCEoYmFzZS5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG4gICAgICAgIH1cblxuICAgICAgICBvdGhlciA9IGNsb25lV2l0aE9mZnNldChvdGhlciwgYmFzZSk7XG4gICAgICAgIGlmIChiYXNlLmlzQmVmb3JlKG90aGVyKSkge1xuICAgICAgICAgICAgcmVzID0gcG9zaXRpdmVNb21lbnRzRGlmZmVyZW5jZShiYXNlLCBvdGhlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKG90aGVyLCBiYXNlKTtcbiAgICAgICAgICAgIHJlcy5taWxsaXNlY29uZHMgPSAtcmVzLm1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHJlcy5tb250aHMgPSAtcmVzLm1vbnRocztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogcmVtb3ZlICduYW1lJyBhcmcgYWZ0ZXIgZGVwcmVjYXRpb24gaXMgcmVtb3ZlZFxuICAgIGZ1bmN0aW9uIGNyZWF0ZUFkZGVyKGRpcmVjdGlvbiwgbmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCwgcGVyaW9kKSB7XG4gICAgICAgICAgICB2YXIgZHVyLCB0bXA7XG4gICAgICAgICAgICAvL2ludmVydCB0aGUgYXJndW1lbnRzLCBidXQgY29tcGxhaW4gYWJvdXQgaXRcbiAgICAgICAgICAgIGlmIChwZXJpb2QgIT09IG51bGwgJiYgIWlzTmFOKCtwZXJpb2QpKSB7XG4gICAgICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKG5hbWUsICdtb21lbnQoKS4nICsgbmFtZSAgKyAnKHBlcmlvZCwgbnVtYmVyKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIG1vbWVudCgpLicgKyBuYW1lICsgJyhudW1iZXIsIHBlcmlvZCkuICcgK1xuICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9hZGQtaW52ZXJ0ZWQtcGFyYW0vIGZvciBtb3JlIGluZm8uJyk7XG4gICAgICAgICAgICAgICAgdG1wID0gdmFsOyB2YWwgPSBwZXJpb2Q7IHBlcmlvZCA9IHRtcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgPyArdmFsIDogdmFsO1xuICAgICAgICAgICAgZHVyID0gY3JlYXRlX19jcmVhdGVEdXJhdGlvbih2YWwsIHBlcmlvZCk7XG4gICAgICAgICAgICBhZGRfc3VidHJhY3RfX2FkZFN1YnRyYWN0KHRoaXMsIGR1ciwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9zdWJ0cmFjdF9fYWRkU3VidHJhY3QgKG1vbSwgZHVyYXRpb24sIGlzQWRkaW5nLCB1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IGR1cmF0aW9uLl9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICBkYXlzID0gYWJzUm91bmQoZHVyYXRpb24uX2RheXMpLFxuICAgICAgICAgICAgbW9udGhzID0gYWJzUm91bmQoZHVyYXRpb24uX21vbnRocyk7XG5cbiAgICAgICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAvLyBObyBvcFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlT2Zmc2V0ID0gdXBkYXRlT2Zmc2V0ID09IG51bGwgPyB0cnVlIDogdXBkYXRlT2Zmc2V0O1xuXG4gICAgICAgIGlmIChtaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIG1vbS5fZC5zZXRUaW1lKG1vbS5fZC52YWx1ZU9mKCkgKyBtaWxsaXNlY29uZHMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRheXMpIHtcbiAgICAgICAgICAgIGdldF9zZXRfX3NldChtb20sICdEYXRlJywgZ2V0X3NldF9fZ2V0KG1vbSwgJ0RhdGUnKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vbnRocykge1xuICAgICAgICAgICAgc2V0TW9udGgobW9tLCBnZXRfc2V0X19nZXQobW9tLCAnTW9udGgnKSArIG1vbnRocyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXBkYXRlT2Zmc2V0KSB7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KG1vbSwgZGF5cyB8fCBtb250aHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGFkZF9zdWJ0cmFjdF9fYWRkICAgICAgPSBjcmVhdGVBZGRlcigxLCAnYWRkJyk7XG4gICAgdmFyIGFkZF9zdWJ0cmFjdF9fc3VidHJhY3QgPSBjcmVhdGVBZGRlcigtMSwgJ3N1YnRyYWN0Jyk7XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxlbmRhckZvcm1hdChteU1vbWVudCwgbm93KSB7XG4gICAgICAgIHZhciBkaWZmID0gbXlNb21lbnQuZGlmZihub3csICdkYXlzJywgdHJ1ZSk7XG4gICAgICAgIHJldHVybiBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgLTEgPyAnbGFzdFdlZWsnIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XG4gICAgICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxuICAgICAgICAgICAgICAgIGRpZmYgPCAyID8gJ25leHREYXknIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudF9jYWxlbmRhcl9fY2FsZW5kYXIgKHRpbWUsIGZvcm1hdHMpIHtcbiAgICAgICAgLy8gV2Ugd2FudCB0byBjb21wYXJlIHRoZSBzdGFydCBvZiB0b2RheSwgdnMgdGhpcy5cbiAgICAgICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgbG9jYWwvdXRjL29mZnNldCBvciBub3QuXG4gICAgICAgIHZhciBub3cgPSB0aW1lIHx8IGxvY2FsX19jcmVhdGVMb2NhbCgpLFxuICAgICAgICAgICAgc29kID0gY2xvbmVXaXRoT2Zmc2V0KG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgICAgICBmb3JtYXQgPSB1dGlsc19ob29rc19faG9va3MuY2FsZW5kYXJGb3JtYXQodGhpcywgc29kKSB8fCAnc2FtZUVsc2UnO1xuXG4gICAgICAgIHZhciBvdXRwdXQgPSBmb3JtYXRzICYmIChpc0Z1bmN0aW9uKGZvcm1hdHNbZm9ybWF0XSkgPyBmb3JtYXRzW2Zvcm1hdF0uY2FsbCh0aGlzLCBub3cpIDogZm9ybWF0c1tmb3JtYXRdKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXQob3V0cHV0IHx8IHRoaXMubG9jYWxlRGF0YSgpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcywgbG9jYWxfX2NyZWF0ZUxvY2FsKG5vdykpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9uZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KHRoaXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgICAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICAgICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPiBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbElucHV0LnZhbHVlT2YoKSA8IHRoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKS52YWx1ZU9mKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0JlZm9yZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQpO1xuICAgICAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKCFpc1VuZGVmaW5lZCh1bml0cykgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgICAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKSA8IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0JldHdlZW4gKGZyb20sIHRvLCB1bml0cywgaW5jbHVzaXZpdHkpIHtcbiAgICAgICAgaW5jbHVzaXZpdHkgPSBpbmNsdXNpdml0eSB8fCAnKCknO1xuICAgICAgICByZXR1cm4gKGluY2x1c2l2aXR5WzBdID09PSAnKCcgPyB0aGlzLmlzQWZ0ZXIoZnJvbSwgdW5pdHMpIDogIXRoaXMuaXNCZWZvcmUoZnJvbSwgdW5pdHMpKSAmJlxuICAgICAgICAgICAgKGluY2x1c2l2aXR5WzFdID09PSAnKScgPyB0aGlzLmlzQmVmb3JlKHRvLCB1bml0cykgOiAhdGhpcy5pc0FmdGVyKHRvLCB1bml0cykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzU2FtZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQpLFxuICAgICAgICAgICAgaW5wdXRNcztcbiAgICAgICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyB8fCAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPT09IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5wdXRNcyA9IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKS52YWx1ZU9mKCkgPD0gaW5wdXRNcyAmJiBpbnB1dE1zIDw9IHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTYW1lT3JBZnRlciAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzU2FtZShpbnB1dCwgdW5pdHMpIHx8IHRoaXMuaXNBZnRlcihpbnB1dCx1bml0cyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTYW1lT3JCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQmVmb3JlKGlucHV0LHVuaXRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaWZmIChpbnB1dCwgdW5pdHMsIGFzRmxvYXQpIHtcbiAgICAgICAgdmFyIHRoYXQsXG4gICAgICAgICAgICB6b25lRGVsdGEsXG4gICAgICAgICAgICBkZWx0YSwgb3V0cHV0O1xuXG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0ID0gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCB0aGlzKTtcblxuICAgICAgICBpZiAoIXRoYXQuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgem9uZURlbHRhID0gKHRoYXQudXRjT2Zmc2V0KCkgLSB0aGlzLnV0Y09mZnNldCgpKSAqIDZlNDtcblxuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJyB8fCB1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBtb250aERpZmYodGhpcywgdGhhdCk7XG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbHRhID0gdGhpcyAtIHRoYXQ7XG4gICAgICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkZWx0YSAvIDFlMyA6IC8vIDEwMDBcbiAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ21pbnV0ZScgPyBkZWx0YSAvIDZlNCA6IC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgICAgIHVuaXRzID09PSAnaG91cicgPyBkZWx0YSAvIDM2ZTUgOiAvLyAxMDAwICogNjAgKiA2MFxuICAgICAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkZWx0YSAtIHpvbmVEZWx0YSkgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ3dlZWsnID8gKGRlbHRhIC0gem9uZURlbHRhKSAvIDYwNDhlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgZGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFzRmxvYXQgPyBvdXRwdXQgOiBhYnNGbG9vcihvdXRwdXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbnRoRGlmZiAoYSwgYikge1xuICAgICAgICAvLyBkaWZmZXJlbmNlIGluIG1vbnRoc1xuICAgICAgICB2YXIgd2hvbGVNb250aERpZmYgPSAoKGIueWVhcigpIC0gYS55ZWFyKCkpICogMTIpICsgKGIubW9udGgoKSAtIGEubW9udGgoKSksXG4gICAgICAgICAgICAvLyBiIGlzIGluIChhbmNob3IgLSAxIG1vbnRoLCBhbmNob3IgKyAxIG1vbnRoKVxuICAgICAgICAgICAgYW5jaG9yID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiwgJ21vbnRocycpLFxuICAgICAgICAgICAgYW5jaG9yMiwgYWRqdXN0O1xuXG4gICAgICAgIGlmIChiIC0gYW5jaG9yIDwgMCkge1xuICAgICAgICAgICAgYW5jaG9yMiA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYgLSAxLCAnbW9udGhzJyk7XG4gICAgICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvciAtIGFuY2hvcjIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5jaG9yMiA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYgKyAxLCAnbW9udGhzJyk7XG4gICAgICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvcjIgLSBhbmNob3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jaGVjayBmb3IgbmVnYXRpdmUgemVybywgcmV0dXJuIHplcm8gaWYgbmVnYXRpdmUgemVyb1xuICAgICAgICByZXR1cm4gLSh3aG9sZU1vbnRoRGlmZiArIGFkanVzdCkgfHwgMDtcbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3MuZGVmYXVsdEZvcm1hdCA9ICdZWVlZLU1NLUREVEhIOm1tOnNzWic7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlZmF1bHRGb3JtYXRVdGMgPSAnWVlZWS1NTS1ERFRISDptbTpzc1taXSc7XG5cbiAgICBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkubG9jYWxlKCdlbicpLmZvcm1hdCgnZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlonKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfZm9ybWF0X190b0lTT1N0cmluZyAoKSB7XG4gICAgICAgIHZhciBtID0gdGhpcy5jbG9uZSgpLnV0YygpO1xuICAgICAgICBpZiAoMCA8IG0ueWVhcigpICYmIG0ueWVhcigpIDw9IDk5OTkpIHtcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBpcyB+NTB4IGZhc3RlciwgdXNlIGl0IHdoZW4gd2UgY2FuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9EYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXQgKGlucHV0U3RyaW5nKSB7XG4gICAgICAgIGlmICghaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlucHV0U3RyaW5nID0gdGhpcy5pc1V0YygpID8gdXRpbHNfaG9va3NfX2hvb2tzLmRlZmF1bHRGb3JtYXRVdGMgOiB1dGlsc19ob29rc19faG9va3MuZGVmYXVsdEZvcm1hdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmcm9tICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgICAgIGxvY2FsX19jcmVhdGVMb2NhbCh0aW1lKS5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlX19jcmVhdGVEdXJhdGlvbih7dG86IHRoaXMsIGZyb206IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmcm9tTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZyb20obG9jYWxfX2NyZWF0ZUxvY2FsKCksIHdpdGhvdXRTdWZmaXgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgICAgIGxvY2FsX19jcmVhdGVMb2NhbCh0aW1lKS5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlX19jcmVhdGVEdXJhdGlvbih7ZnJvbTogdGhpcywgdG86IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b05vdyAod2l0aG91dFN1ZmZpeCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhsb2NhbF9fY3JlYXRlTG9jYWwoKSwgd2l0aG91dFN1ZmZpeCk7XG4gICAgfVxuXG4gICAgLy8gSWYgcGFzc2VkIGEgbG9jYWxlIGtleSwgaXQgd2lsbCBzZXQgdGhlIGxvY2FsZSBmb3IgdGhpc1xuICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbiAgICAvLyB2YXJpYWJsZXMgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAgZnVuY3Rpb24gbG9jYWxlIChrZXkpIHtcbiAgICAgICAgdmFyIG5ld0xvY2FsZURhdGE7XG5cbiAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9jYWxlLl9hYmJyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3TG9jYWxlRGF0YSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIGlmIChuZXdMb2NhbGVEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2NhbGUgPSBuZXdMb2NhbGVEYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFuZyA9IGRlcHJlY2F0ZShcbiAgICAgICAgJ21vbWVudCgpLmxhbmcoKSBpcyBkZXByZWNhdGVkLiBJbnN0ZWFkLCB1c2UgbW9tZW50KCkubG9jYWxlRGF0YSgpIHRvIGdldCB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvbi4gVXNlIG1vbWVudCgpLmxvY2FsZSgpIHRvIGNoYW5nZSBsYW5ndWFnZXMuJyxcbiAgICAgICAgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVEYXRhICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydE9mICh1bml0cykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgICAgICAvLyB0byB1dGlsaXplIGZhbGxpbmcgdGhyb3VnaCB0aGUgY2FzZXMuXG4gICAgICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAncXVhcnRlcic6XG4gICAgICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnaXNvV2Vlayc6XG4gICAgICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5ob3VycygwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgICAgICAgICB0aGlzLm1pbnV0ZXMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnbWludXRlJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNlY29uZHMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcygwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlZWtzIGFyZSBhIHNwZWNpYWwgY2FzZVxuICAgICAgICBpZiAodW5pdHMgPT09ICd3ZWVrJykge1xuICAgICAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XG4gICAgICAgICAgICB0aGlzLmlzb1dlZWtkYXkoMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBxdWFydGVycyBhcmUgYWxzbyBzcGVjaWFsXG4gICAgICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgICAgICB0aGlzLm1vbnRoKE1hdGguZmxvb3IodGhpcy5tb250aCgpIC8gMykgKiAzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZE9mICh1bml0cykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSB1bmRlZmluZWQgfHwgdW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ2RhdGUnIGlzIGFuIGFsaWFzIGZvciAnZGF5Jywgc28gaXQgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYXMgc3VjaC5cbiAgICAgICAgaWYgKHVuaXRzID09PSAnZGF0ZScpIHtcbiAgICAgICAgICAgIHVuaXRzID0gJ2RheSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zdGFydE9mKHVuaXRzKS5hZGQoMSwgKHVuaXRzID09PSAnaXNvV2VlaycgPyAnd2VlaycgOiB1bml0cykpLnN1YnRyYWN0KDEsICdtcycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvX3R5cGVfX3ZhbHVlT2YgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZC52YWx1ZU9mKCkgLSAoKHRoaXMuX29mZnNldCB8fCAwKSAqIDYwMDAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bml4ICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy52YWx1ZU9mKCkgLyAxMDAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b0RhdGUgKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUodGhpcy52YWx1ZU9mKCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvQXJyYXkgKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXM7XG4gICAgICAgIHJldHVybiBbbS55ZWFyKCksIG0ubW9udGgoKSwgbS5kYXRlKCksIG0uaG91cigpLCBtLm1pbnV0ZSgpLCBtLnNlY29uZCgpLCBtLm1pbGxpc2Vjb25kKCldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvT2JqZWN0ICgpIHtcbiAgICAgICAgdmFyIG0gPSB0aGlzO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeWVhcnM6IG0ueWVhcigpLFxuICAgICAgICAgICAgbW9udGhzOiBtLm1vbnRoKCksXG4gICAgICAgICAgICBkYXRlOiBtLmRhdGUoKSxcbiAgICAgICAgICAgIGhvdXJzOiBtLmhvdXJzKCksXG4gICAgICAgICAgICBtaW51dGVzOiBtLm1pbnV0ZXMoKSxcbiAgICAgICAgICAgIHNlY29uZHM6IG0uc2Vjb25kcygpLFxuICAgICAgICAgICAgbWlsbGlzZWNvbmRzOiBtLm1pbGxpc2Vjb25kcygpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgICAgICAgLy8gbmV3IERhdGUoTmFOKS50b0pTT04oKSA9PT0gbnVsbFxuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLnRvSVNPU3RyaW5nKCkgOiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudF92YWxpZF9faXNWYWxpZCAoKSB7XG4gICAgICAgIHJldHVybiB2YWxpZF9faXNWYWxpZCh0aGlzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzaW5nRmxhZ3MgKCkge1xuICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCBnZXRQYXJzaW5nRmxhZ3ModGhpcykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludmFsaWRBdCAoKSB7XG4gICAgICAgIHJldHVybiBnZXRQYXJzaW5nRmxhZ3ModGhpcykub3ZlcmZsb3c7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRpb25EYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5wdXQ6IHRoaXMuX2ksXG4gICAgICAgICAgICBmb3JtYXQ6IHRoaXMuX2YsXG4gICAgICAgICAgICBsb2NhbGU6IHRoaXMuX2xvY2FsZSxcbiAgICAgICAgICAgIGlzVVRDOiB0aGlzLl9pc1VUQyxcbiAgICAgICAgICAgIHN0cmljdDogdGhpcy5fc3RyaWN0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydnZycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndlZWtZZWFyKCkgJSAxMDA7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ0dHJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMDtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4gKHRva2VuLCBnZXR0ZXIpIHtcbiAgICAgICAgYWRkRm9ybWF0VG9rZW4oMCwgW3Rva2VuLCB0b2tlbi5sZW5ndGhdLCAwLCBnZXR0ZXIpO1xuICAgIH1cblxuICAgIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ2dnZ2cnLCAgICAgJ3dlZWtZZWFyJyk7XG4gICAgYWRkV2Vla1llYXJGb3JtYXRUb2tlbignZ2dnZ2cnLCAgICAnd2Vla1llYXInKTtcbiAgICBhZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHJywgICdpc29XZWVrWWVhcicpO1xuICAgIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ0dHR0dHJywgJ2lzb1dlZWtZZWFyJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ3dlZWtZZWFyJywgJ2dnJyk7XG4gICAgYWRkVW5pdEFsaWFzKCdpc29XZWVrWWVhcicsICdHRycpO1xuXG4gICAgLy8gUFJJT1JJVFlcblxuICAgIGFkZFVuaXRQcmlvcml0eSgnd2Vla1llYXInLCAxKTtcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2lzb1dlZWtZZWFyJywgMSk7XG5cblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ0cnLCAgICAgIG1hdGNoU2lnbmVkKTtcbiAgICBhZGRSZWdleFRva2VuKCdnJywgICAgICBtYXRjaFNpZ25lZCk7XG4gICAgYWRkUmVnZXhUb2tlbignR0cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ2dnJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdHR0dHJywgICBtYXRjaDF0bzQsIG1hdGNoNCk7XG4gICAgYWRkUmVnZXhUb2tlbignZ2dnZycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0dHR0dHJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbiAgICBhZGRSZWdleFRva2VuKCdnZ2dnZycsICBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbiAgICBhZGRXZWVrUGFyc2VUb2tlbihbJ2dnZ2cnLCAnZ2dnZ2cnLCAnR0dHRycsICdHR0dHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICAgICAgd2Vla1t0b2tlbi5zdWJzdHIoMCwgMildID0gdG9JbnQoaW5wdXQpO1xuICAgIH0pO1xuXG4gICAgYWRkV2Vla1BhcnNlVG9rZW4oWydnZycsICdHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICAgICAgd2Vla1t0b2tlbl0gPSB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xuICAgIH0pO1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgZnVuY3Rpb24gZ2V0U2V0V2Vla1llYXIgKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICAgICAgaW5wdXQsXG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrKCksXG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrZGF5KCksXG4gICAgICAgICAgICAgICAgdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93LFxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRveSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0SVNPV2Vla1llYXIgKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICAgICAgaW5wdXQsIHRoaXMuaXNvV2VlaygpLCB0aGlzLmlzb1dlZWtkYXkoKSwgMSwgNCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0SVNPV2Vla3NJblllYXIgKCkge1xuICAgICAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIDEsIDQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFdlZWtzSW5ZZWFyICgpIHtcbiAgICAgICAgdmFyIHdlZWtJbmZvID0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWs7XG4gICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgd2Vla0luZm8uZG93LCB3ZWVrSW5mby5kb3kpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldFdlZWtZZWFySGVscGVyKGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgICAgICB2YXIgd2Vla3NUYXJnZXQ7XG4gICAgICAgIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gd2Vla09mWWVhcih0aGlzLCBkb3csIGRveSkueWVhcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdlZWtzVGFyZ2V0ID0gd2Vla3NJblllYXIoaW5wdXQsIGRvdywgZG95KTtcbiAgICAgICAgICAgIGlmICh3ZWVrID4gd2Vla3NUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICB3ZWVrID0gd2Vla3NUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2V0V2Vla0FsbC5jYWxsKHRoaXMsIGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRXZWVrQWxsKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgICAgICB2YXIgZGF5T2ZZZWFyRGF0YSA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpLFxuICAgICAgICAgICAgZGF0ZSA9IGNyZWF0ZVVUQ0RhdGUoZGF5T2ZZZWFyRGF0YS55ZWFyLCAwLCBkYXlPZlllYXJEYXRhLmRheU9mWWVhcik7XG5cbiAgICAgICAgdGhpcy55ZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSk7XG4gICAgICAgIHRoaXMubW9udGgoZGF0ZS5nZXRVVENNb250aCgpKTtcbiAgICAgICAgdGhpcy5kYXRlKGRhdGUuZ2V0VVRDRGF0ZSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ1EnLCAwLCAnUW8nLCAncXVhcnRlcicpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdxdWFydGVyJywgJ1EnKTtcblxuICAgIC8vIFBSSU9SSVRZXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3F1YXJ0ZXInLCA3KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1EnLCBtYXRjaDEpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1EnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W01PTlRIXSA9ICh0b0ludChpbnB1dCkgLSAxKSAqIDM7XG4gICAgfSk7XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRTZXRRdWFydGVyIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IE1hdGguY2VpbCgodGhpcy5tb250aCgpICsgMSkgLyAzKSA6IHRoaXMubW9udGgoKGlucHV0IC0gMSkgKiAzICsgdGhpcy5tb250aCgpICUgMyk7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ0QnLCBbJ0REJywgMl0sICdEbycsICdkYXRlJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2RhdGUnLCAnRCcpO1xuXG4gICAgLy8gUFJJT1JPSVRZXG4gICAgYWRkVW5pdFByaW9yaXR5KCdkYXRlJywgOSk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdEJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignREQnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignRG8nLCBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gaXNTdHJpY3QgPyBsb2NhbGUuX29yZGluYWxQYXJzZSA6IGxvY2FsZS5fb3JkaW5hbFBhcnNlTGVuaWVudDtcbiAgICB9KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydEJywgJ0REJ10sIERBVEUpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgICAgICBhcnJheVtEQVRFXSA9IHRvSW50KGlucHV0Lm1hdGNoKG1hdGNoMXRvMilbMF0sIDEwKTtcbiAgICB9KTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIHZhciBnZXRTZXREYXlPZk1vbnRoID0gbWFrZUdldFNldCgnRGF0ZScsIHRydWUpO1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ0RERCcsIFsnRERERCcsIDNdLCAnREREbycsICdkYXlPZlllYXInKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygnZGF5T2ZZZWFyJywgJ0RERCcpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2RheU9mWWVhcicsIDQpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignREREJywgIG1hdGNoMXRvMyk7XG4gICAgYWRkUmVnZXhUb2tlbignRERERCcsIG1hdGNoMyk7XG4gICAgYWRkUGFyc2VUb2tlbihbJ0RERCcsICdEREREJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFNldERheU9mWWVhciAoaW5wdXQpIHtcbiAgICAgICAgdmFyIGRheU9mWWVhciA9IE1hdGgucm91bmQoKHRoaXMuY2xvbmUoKS5zdGFydE9mKCdkYXknKSAtIHRoaXMuY2xvbmUoKS5zdGFydE9mKCd5ZWFyJykpIC8gODY0ZTUpICsgMTtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSBkYXlPZlllYXIpLCAnZCcpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdtJywgWydtbScsIDJdLCAwLCAnbWludXRlJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ21pbnV0ZScsICdtJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdtaW51dGUnLCAxNCk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdtJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignbW0nLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUGFyc2VUb2tlbihbJ20nLCAnbW0nXSwgTUlOVVRFKTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIHZhciBnZXRTZXRNaW51dGUgPSBtYWtlR2V0U2V0KCdNaW51dGVzJywgZmFsc2UpO1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ3MnLCBbJ3NzJywgMl0sIDAsICdzZWNvbmQnKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygnc2Vjb25kJywgJ3MnKTtcblxuICAgIC8vIFBSSU9SSVRZXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3NlY29uZCcsIDE1KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ3MnLCAgbWF0Y2gxdG8yKTtcbiAgICBhZGRSZWdleFRva2VuKCdzcycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRQYXJzZVRva2VuKFsncycsICdzcyddLCBTRUNPTkQpO1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgdmFyIGdldFNldFNlY29uZCA9IG1ha2VHZXRTZXQoJ1NlY29uZHMnLCBmYWxzZSk7XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBhZGRGb3JtYXRUb2tlbignUycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwMCk7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwKTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnU1NTJywgM10sIDAsICdtaWxsaXNlY29uZCcpO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnU1NTUycsIDRdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTJywgNV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTUycsIDZdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwO1xuICAgIH0pO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTUycsIDddLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTJywgOF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTUycsIDldLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDAwO1xuICAgIH0pO1xuXG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ21pbGxpc2Vjb25kJywgJ21zJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdtaWxsaXNlY29uZCcsIDE2KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1MnLCAgICBtYXRjaDF0bzMsIG1hdGNoMSk7XG4gICAgYWRkUmVnZXhUb2tlbignU1MnLCAgIG1hdGNoMXRvMywgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdTU1MnLCAgbWF0Y2gxdG8zLCBtYXRjaDMpO1xuXG4gICAgdmFyIHRva2VuO1xuICAgIGZvciAodG9rZW4gPSAnU1NTUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICAgICAgYWRkUmVnZXhUb2tlbih0b2tlbiwgbWF0Y2hVbnNpZ25lZCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VNcyhpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbTUlMTElTRUNPTkRdID0gdG9JbnQoKCcwLicgKyBpbnB1dCkgKiAxMDAwKTtcbiAgICB9XG5cbiAgICBmb3IgKHRva2VuID0gJ1MnOyB0b2tlbi5sZW5ndGggPD0gOTsgdG9rZW4gKz0gJ1MnKSB7XG4gICAgICAgIGFkZFBhcnNlVG9rZW4odG9rZW4sIHBhcnNlTXMpO1xuICAgIH1cbiAgICAvLyBNT01FTlRTXG5cbiAgICB2YXIgZ2V0U2V0TWlsbGlzZWNvbmQgPSBtYWtlR2V0U2V0KCdNaWxsaXNlY29uZHMnLCBmYWxzZSk7XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBhZGRGb3JtYXRUb2tlbigneicsICAwLCAwLCAnem9uZUFiYnInKTtcbiAgICBhZGRGb3JtYXRUb2tlbignenonLCAwLCAwLCAnem9uZU5hbWUnKTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFpvbmVBYmJyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gJ1VUQycgOiAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRab25lTmFtZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdDb29yZGluYXRlZCBVbml2ZXJzYWwgVGltZScgOiAnJztcbiAgICB9XG5cbiAgICB2YXIgbW9tZW50UHJvdG90eXBlX19wcm90byA9IE1vbWVudC5wcm90b3R5cGU7XG5cbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmFkZCAgICAgICAgICAgICAgID0gYWRkX3N1YnRyYWN0X19hZGQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5jYWxlbmRhciAgICAgICAgICA9IG1vbWVudF9jYWxlbmRhcl9fY2FsZW5kYXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5jbG9uZSAgICAgICAgICAgICA9IGNsb25lO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGlmZiAgICAgICAgICAgICAgPSBkaWZmO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZW5kT2YgICAgICAgICAgICAgPSBlbmRPZjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmZvcm1hdCAgICAgICAgICAgID0gZm9ybWF0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZnJvbSAgICAgICAgICAgICAgPSBmcm9tO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZnJvbU5vdyAgICAgICAgICAgPSBmcm9tTm93O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG8gICAgICAgICAgICAgICAgPSB0bztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvTm93ICAgICAgICAgICAgID0gdG9Ob3c7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5nZXQgICAgICAgICAgICAgICA9IHN0cmluZ0dldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmludmFsaWRBdCAgICAgICAgID0gaW52YWxpZEF0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNBZnRlciAgICAgICAgICAgPSBpc0FmdGVyO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNCZWZvcmUgICAgICAgICAgPSBpc0JlZm9yZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzQmV0d2VlbiAgICAgICAgID0gaXNCZXR3ZWVuO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNTYW1lICAgICAgICAgICAgPSBpc1NhbWU7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1NhbWVPckFmdGVyICAgICA9IGlzU2FtZU9yQWZ0ZXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1NhbWVPckJlZm9yZSAgICA9IGlzU2FtZU9yQmVmb3JlO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNWYWxpZCAgICAgICAgICAgPSBtb21lbnRfdmFsaWRfX2lzVmFsaWQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sYW5nICAgICAgICAgICAgICA9IGxhbmc7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sb2NhbGUgICAgICAgICAgICA9IGxvY2FsZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmxvY2FsZURhdGEgICAgICAgID0gbG9jYWxlRGF0YTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1heCAgICAgICAgICAgICAgID0gcHJvdG90eXBlTWF4O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWluICAgICAgICAgICAgICAgPSBwcm90b3R5cGVNaW47XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5wYXJzaW5nRmxhZ3MgICAgICA9IHBhcnNpbmdGbGFncztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnNldCAgICAgICAgICAgICAgID0gc3RyaW5nU2V0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uc3RhcnRPZiAgICAgICAgICAgPSBzdGFydE9mO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uc3VidHJhY3QgICAgICAgICAgPSBhZGRfc3VidHJhY3RfX3N1YnRyYWN0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9BcnJheSAgICAgICAgICAgPSB0b0FycmF5O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9PYmplY3QgICAgICAgICAgPSB0b09iamVjdDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvRGF0ZSAgICAgICAgICAgID0gdG9EYXRlO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9JU09TdHJpbmcgICAgICAgPSBtb21lbnRfZm9ybWF0X190b0lTT1N0cmluZztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvSlNPTiAgICAgICAgICAgID0gdG9KU09OO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9TdHJpbmcgICAgICAgICAgPSB0b1N0cmluZztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnVuaXggICAgICAgICAgICAgID0gdW5peDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnZhbHVlT2YgICAgICAgICAgID0gdG9fdHlwZV9fdmFsdWVPZjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmNyZWF0aW9uRGF0YSAgICAgID0gY3JlYXRpb25EYXRhO1xuXG4gICAgLy8gWWVhclxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ueWVhciAgICAgICA9IGdldFNldFllYXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0xlYXBZZWFyID0gZ2V0SXNMZWFwWWVhcjtcblxuICAgIC8vIFdlZWsgWWVhclxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2Vla1llYXIgICAgPSBnZXRTZXRXZWVrWWVhcjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzb1dlZWtZZWFyID0gZ2V0U2V0SVNPV2Vla1llYXI7XG5cbiAgICAvLyBRdWFydGVyXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5xdWFydGVyID0gbW9tZW50UHJvdG90eXBlX19wcm90by5xdWFydGVycyA9IGdldFNldFF1YXJ0ZXI7XG5cbiAgICAvLyBNb250aFxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubW9udGggICAgICAgPSBnZXRTZXRNb250aDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRheXNJbk1vbnRoID0gZ2V0RGF5c0luTW9udGg7XG5cbiAgICAvLyBXZWVrXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by53ZWVrICAgICAgICAgICA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2Vla3MgICAgICAgID0gZ2V0U2V0V2VlaztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzb1dlZWsgICAgICAgID0gbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrcyAgICAgPSBnZXRTZXRJU09XZWVrO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2Vla3NJblllYXIgICAgPSBnZXRXZWVrc0luWWVhcjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzb1dlZWtzSW5ZZWFyID0gZ2V0SVNPV2Vla3NJblllYXI7XG5cbiAgICAvLyBEYXlcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRhdGUgICAgICAgPSBnZXRTZXREYXlPZk1vbnRoO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGF5ICAgICAgICA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGF5cyAgICAgICAgICAgICA9IGdldFNldERheU9mV2VlaztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLndlZWtkYXkgICAgPSBnZXRTZXRMb2NhbGVEYXlPZldlZWs7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrZGF5ID0gZ2V0U2V0SVNPRGF5T2ZXZWVrO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGF5T2ZZZWFyICA9IGdldFNldERheU9mWWVhcjtcblxuICAgIC8vIEhvdXJcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmhvdXIgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmhvdXJzID0gZ2V0U2V0SG91cjtcblxuICAgIC8vIE1pbnV0ZVxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWludXRlID0gbW9tZW50UHJvdG90eXBlX19wcm90by5taW51dGVzID0gZ2V0U2V0TWludXRlO1xuXG4gICAgLy8gU2Vjb25kXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5zZWNvbmQgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnNlY29uZHMgPSBnZXRTZXRTZWNvbmQ7XG5cbiAgICAvLyBNaWxsaXNlY29uZFxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWlsbGlzZWNvbmQgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1pbGxpc2Vjb25kcyA9IGdldFNldE1pbGxpc2Vjb25kO1xuXG4gICAgLy8gT2Zmc2V0XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by51dGNPZmZzZXQgICAgICAgICAgICA9IGdldFNldE9mZnNldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnV0YyAgICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9VVEM7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sb2NhbCAgICAgICAgICAgICAgICA9IHNldE9mZnNldFRvTG9jYWw7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5wYXJzZVpvbmUgICAgICAgICAgICA9IHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaGFzQWxpZ25lZEhvdXJPZmZzZXQgPSBoYXNBbGlnbmVkSG91ck9mZnNldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzRFNUICAgICAgICAgICAgICAgID0gaXNEYXlsaWdodFNhdmluZ1RpbWU7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0xvY2FsICAgICAgICAgICAgICA9IGlzTG9jYWw7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1V0Y09mZnNldCAgICAgICAgICA9IGlzVXRjT2Zmc2V0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNVdGMgICAgICAgICAgICAgICAgPSBpc1V0YztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzVVRDICAgICAgICAgICAgICAgID0gaXNVdGM7XG5cbiAgICAvLyBUaW1lem9uZVxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uem9uZUFiYnIgPSBnZXRab25lQWJicjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnpvbmVOYW1lID0gZ2V0Wm9uZU5hbWU7XG5cbiAgICAvLyBEZXByZWNhdGlvbnNcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRhdGVzICA9IGRlcHJlY2F0ZSgnZGF0ZXMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIGRhdGUgaW5zdGVhZC4nLCBnZXRTZXREYXlPZk1vbnRoKTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1vbnRocyA9IGRlcHJlY2F0ZSgnbW9udGhzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb250aCBpbnN0ZWFkJywgZ2V0U2V0TW9udGgpO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ueWVhcnMgID0gZGVwcmVjYXRlKCd5ZWFycyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgeWVhciBpbnN0ZWFkJywgZ2V0U2V0WWVhcik7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by56b25lICAgPSBkZXByZWNhdGUoJ21vbWVudCgpLnpvbmUgaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudCgpLnV0Y09mZnNldCBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL3pvbmUvJywgZ2V0U2V0Wm9uZSk7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0RTVFNoaWZ0ZWQgPSBkZXByZWNhdGUoJ2lzRFNUU2hpZnRlZCBpcyBkZXByZWNhdGVkLiBTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kc3Qtc2hpZnRlZC8gZm9yIG1vcmUgaW5mb3JtYXRpb24nLCBpc0RheWxpZ2h0U2F2aW5nVGltZVNoaWZ0ZWQpO1xuXG4gICAgdmFyIG1vbWVudFByb3RvdHlwZSA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG87XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfX2NyZWF0ZVVuaXggKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQgKiAxMDAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfX2NyZWF0ZUluWm9uZSAoKSB7XG4gICAgICAgIHJldHVybiBsb2NhbF9fY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5wYXJzZVpvbmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVQYXJzZVBvc3RGb3JtYXQgKHN0cmluZykge1xuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIHZhciBwcm90b3R5cGVfX3Byb3RvID0gTG9jYWxlLnByb3RvdHlwZTtcblxuICAgIHByb3RvdHlwZV9fcHJvdG8uY2FsZW5kYXIgICAgICAgID0gbG9jYWxlX2NhbGVuZGFyX19jYWxlbmRhcjtcbiAgICBwcm90b3R5cGVfX3Byb3RvLmxvbmdEYXRlRm9ybWF0ICA9IGxvbmdEYXRlRm9ybWF0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8uaW52YWxpZERhdGUgICAgID0gaW52YWxpZERhdGU7XG4gICAgcHJvdG90eXBlX19wcm90by5vcmRpbmFsICAgICAgICAgPSBvcmRpbmFsO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ucHJlcGFyc2UgICAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ucG9zdGZvcm1hdCAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ucmVsYXRpdmVUaW1lICAgID0gcmVsYXRpdmVfX3JlbGF0aXZlVGltZTtcbiAgICBwcm90b3R5cGVfX3Byb3RvLnBhc3RGdXR1cmUgICAgICA9IHBhc3RGdXR1cmU7XG4gICAgcHJvdG90eXBlX19wcm90by5zZXQgICAgICAgICAgICAgPSBsb2NhbGVfc2V0X19zZXQ7XG5cbiAgICAvLyBNb250aFxuICAgIHByb3RvdHlwZV9fcHJvdG8ubW9udGhzICAgICAgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ubW9udGhzU2hvcnQgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzU2hvcnQ7XG4gICAgcHJvdG90eXBlX19wcm90by5tb250aHNQYXJzZSAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHNQYXJzZTtcbiAgICBwcm90b3R5cGVfX3Byb3RvLm1vbnRoc1JlZ2V4ICAgICAgID0gbW9udGhzUmVnZXg7XG4gICAgcHJvdG90eXBlX19wcm90by5tb250aHNTaG9ydFJlZ2V4ICA9IG1vbnRoc1Nob3J0UmVnZXg7XG5cbiAgICAvLyBXZWVrXG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrID0gbG9jYWxlV2VlaztcbiAgICBwcm90b3R5cGVfX3Byb3RvLmZpcnN0RGF5T2ZZZWFyID0gbG9jYWxlRmlyc3REYXlPZlllYXI7XG4gICAgcHJvdG90eXBlX19wcm90by5maXJzdERheU9mV2VlayA9IGxvY2FsZUZpcnN0RGF5T2ZXZWVrO1xuXG4gICAgLy8gRGF5IG9mIFdlZWtcbiAgICBwcm90b3R5cGVfX3Byb3RvLndlZWtkYXlzICAgICAgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNNaW4gICAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNNaW47XG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrZGF5c1Nob3J0ICA9ICAgICAgICBsb2NhbGVXZWVrZGF5c1Nob3J0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNQYXJzZSAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNQYXJzZTtcblxuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNSZWdleCAgICAgICA9ICAgICAgICB3ZWVrZGF5c1JlZ2V4O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNTaG9ydFJlZ2V4ICA9ICAgICAgICB3ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrZGF5c01pblJlZ2V4ICAgID0gICAgICAgIHdlZWtkYXlzTWluUmVnZXg7XG5cbiAgICAvLyBIb3Vyc1xuICAgIHByb3RvdHlwZV9fcHJvdG8uaXNQTSA9IGxvY2FsZUlzUE07XG4gICAgcHJvdG90eXBlX19wcm90by5tZXJpZGllbSA9IGxvY2FsZU1lcmlkaWVtO1xuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2dldCAoZm9ybWF0LCBpbmRleCwgZmllbGQsIHNldHRlcikge1xuICAgICAgICB2YXIgbG9jYWxlID0gbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZSgpO1xuICAgICAgICB2YXIgdXRjID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKCkuc2V0KHNldHRlciwgaW5kZXgpO1xuICAgICAgICByZXR1cm4gbG9jYWxlW2ZpZWxkXSh1dGMsIGZvcm1hdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdE1vbnRoc0ltcGwgKGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZm9ybWF0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsaXN0c19fZ2V0KGZvcm1hdCwgaW5kZXgsIGZpZWxkLCAnbW9udGgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICBvdXRbaV0gPSBsaXN0c19fZ2V0KGZvcm1hdCwgaSwgZmllbGQsICdtb250aCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgLy8gKClcbiAgICAvLyAoNSlcbiAgICAvLyAoZm10LCA1KVxuICAgIC8vIChmbXQpXG4gICAgLy8gKHRydWUpXG4gICAgLy8gKHRydWUsIDUpXG4gICAgLy8gKHRydWUsIGZtdCwgNSlcbiAgICAvLyAodHJ1ZSwgZm10KVxuICAgIGZ1bmN0aW9uIGxpc3RXZWVrZGF5c0ltcGwgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgZmllbGQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBsb2NhbGVTb3J0ZWQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBsb2NhbGVTb3J0ZWQ7XG4gICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgIGxvY2FsZVNvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsb2NhbGUgPSBsb2NhbGVfbG9jYWxlc19fZ2V0TG9jYWxlKCksXG4gICAgICAgICAgICBzaGlmdCA9IGxvY2FsZVNvcnRlZCA/IGxvY2FsZS5fd2Vlay5kb3cgOiAwO1xuXG4gICAgICAgIGlmIChpbmRleCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdHNfX2dldChmb3JtYXQsIChpbmRleCArIHNoaWZ0KSAlIDcsIGZpZWxkLCAnZGF5Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICBvdXRbaV0gPSBsaXN0c19fZ2V0KGZvcm1hdCwgKGkgKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RNb250aHMgKGZvcm1hdCwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHMnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0c19fbGlzdE1vbnRoc1Nob3J0IChmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBsaXN0TW9udGhzSW1wbChmb3JtYXQsIGluZGV4LCAnbW9udGhzU2hvcnQnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0c19fbGlzdFdlZWtkYXlzIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXMnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0c19fbGlzdFdlZWtkYXlzU2hvcnQgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgICAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c1Nob3J0Jyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RXZWVrZGF5c01pbiAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzTWluJyk7XG4gICAgfVxuXG4gICAgbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSgnZW4nLCB7XG4gICAgICAgIG9yZGluYWxQYXJzZTogL1xcZHsxLDJ9KHRofHN0fG5kfHJkKS8sXG4gICAgICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwLFxuICAgICAgICAgICAgICAgIG91dHB1dCA9ICh0b0ludChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyICsgb3V0cHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxhbmcgPSBkZXByZWNhdGUoJ21vbWVudC5sYW5nIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlIGluc3RlYWQuJywgbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSk7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxhbmdEYXRhID0gZGVwcmVjYXRlKCdtb21lbnQubGFuZ0RhdGEgaXMgZGVwcmVjYXRlZC4gVXNlIG1vbWVudC5sb2NhbGVEYXRhIGluc3RlYWQuJywgbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZSk7XG5cbiAgICB2YXIgbWF0aEFicyA9IE1hdGguYWJzO1xuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYWJzX19hYnMgKCkge1xuICAgICAgICB2YXIgZGF0YSAgICAgICAgICAgPSB0aGlzLl9kYXRhO1xuXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9IG1hdGhBYnModGhpcy5fbWlsbGlzZWNvbmRzKTtcbiAgICAgICAgdGhpcy5fZGF5cyAgICAgICAgID0gbWF0aEFicyh0aGlzLl9kYXlzKTtcbiAgICAgICAgdGhpcy5fbW9udGhzICAgICAgID0gbWF0aEFicyh0aGlzLl9tb250aHMpO1xuXG4gICAgICAgIGRhdGEubWlsbGlzZWNvbmRzICA9IG1hdGhBYnMoZGF0YS5taWxsaXNlY29uZHMpO1xuICAgICAgICBkYXRhLnNlY29uZHMgICAgICAgPSBtYXRoQWJzKGRhdGEuc2Vjb25kcyk7XG4gICAgICAgIGRhdGEubWludXRlcyAgICAgICA9IG1hdGhBYnMoZGF0YS5taW51dGVzKTtcbiAgICAgICAgZGF0YS5ob3VycyAgICAgICAgID0gbWF0aEFicyhkYXRhLmhvdXJzKTtcbiAgICAgICAgZGF0YS5tb250aHMgICAgICAgID0gbWF0aEFicyhkYXRhLm1vbnRocyk7XG4gICAgICAgIGRhdGEueWVhcnMgICAgICAgICA9IG1hdGhBYnMoZGF0YS55ZWFycyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYWRkX3N1YnRyYWN0X19hZGRTdWJ0cmFjdCAoZHVyYXRpb24sIGlucHV0LCB2YWx1ZSwgZGlyZWN0aW9uKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24oaW5wdXQsIHZhbHVlKTtcblxuICAgICAgICBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzICs9IGRpcmVjdGlvbiAqIG90aGVyLl9taWxsaXNlY29uZHM7XG4gICAgICAgIGR1cmF0aW9uLl9kYXlzICAgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX2RheXM7XG4gICAgICAgIGR1cmF0aW9uLl9tb250aHMgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX21vbnRocztcblxuICAgICAgICByZXR1cm4gZHVyYXRpb24uX2J1YmJsZSgpO1xuICAgIH1cblxuICAgIC8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIGFkZCgxLCAncycpIG9yIGFkZChkdXJhdGlvbilcbiAgICBmdW5jdGlvbiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX2FkZCAoaW5wdXQsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX2FkZFN1YnRyYWN0KHRoaXMsIGlucHV0LCB2YWx1ZSwgMSk7XG4gICAgfVxuXG4gICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgc3VidHJhY3QoMSwgJ3MnKSBvciBzdWJ0cmFjdChkdXJhdGlvbilcbiAgICBmdW5jdGlvbiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX3N1YnRyYWN0IChpbnB1dCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uX2FkZF9zdWJ0cmFjdF9fYWRkU3VidHJhY3QodGhpcywgaW5wdXQsIHZhbHVlLCAtMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWJzQ2VpbCAobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnViYmxlICgpIHtcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcbiAgICAgICAgdmFyIGRheXMgICAgICAgICA9IHRoaXMuX2RheXM7XG4gICAgICAgIHZhciBtb250aHMgICAgICAgPSB0aGlzLl9tb250aHM7XG4gICAgICAgIHZhciBkYXRhICAgICAgICAgPSB0aGlzLl9kYXRhO1xuICAgICAgICB2YXIgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzLCBtb250aHNGcm9tRGF5cztcblxuICAgICAgICAvLyBpZiB3ZSBoYXZlIGEgbWl4IG9mIHBvc2l0aXZlIGFuZCBuZWdhdGl2ZSB2YWx1ZXMsIGJ1YmJsZSBkb3duIGZpcnN0XG4gICAgICAgIC8vIGNoZWNrOiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMjE2NlxuICAgICAgICBpZiAoISgobWlsbGlzZWNvbmRzID49IDAgJiYgZGF5cyA+PSAwICYmIG1vbnRocyA+PSAwKSB8fFxuICAgICAgICAgICAgICAgIChtaWxsaXNlY29uZHMgPD0gMCAmJiBkYXlzIDw9IDAgJiYgbW9udGhzIDw9IDApKSkge1xuICAgICAgICAgICAgbWlsbGlzZWNvbmRzICs9IGFic0NlaWwobW9udGhzVG9EYXlzKG1vbnRocykgKyBkYXlzKSAqIDg2NGU1O1xuICAgICAgICAgICAgZGF5cyA9IDA7XG4gICAgICAgICAgICBtb250aHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgICAgICAvLyBleGFtcGxlcyBvZiB3aGF0IHRoYXQgbWVhbnMuXG4gICAgICAgIGRhdGEubWlsbGlzZWNvbmRzID0gbWlsbGlzZWNvbmRzICUgMTAwMDtcblxuICAgICAgICBzZWNvbmRzICAgICAgICAgICA9IGFic0Zsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApO1xuICAgICAgICBkYXRhLnNlY29uZHMgICAgICA9IHNlY29uZHMgJSA2MDtcblxuICAgICAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgICAgIGRhdGEubWludXRlcyAgICAgID0gbWludXRlcyAlIDYwO1xuXG4gICAgICAgIGhvdXJzICAgICAgICAgICAgID0gYWJzRmxvb3IobWludXRlcyAvIDYwKTtcbiAgICAgICAgZGF0YS5ob3VycyAgICAgICAgPSBob3VycyAlIDI0O1xuXG4gICAgICAgIGRheXMgKz0gYWJzRmxvb3IoaG91cnMgLyAyNCk7XG5cbiAgICAgICAgLy8gY29udmVydCBkYXlzIHRvIG1vbnRoc1xuICAgICAgICBtb250aHNGcm9tRGF5cyA9IGFic0Zsb29yKGRheXNUb01vbnRocyhkYXlzKSk7XG4gICAgICAgIG1vbnRocyArPSBtb250aHNGcm9tRGF5cztcbiAgICAgICAgZGF5cyAtPSBhYnNDZWlsKG1vbnRoc1RvRGF5cyhtb250aHNGcm9tRGF5cykpO1xuXG4gICAgICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICAgICAgeWVhcnMgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgICAgIG1vbnRocyAlPSAxMjtcblxuICAgICAgICBkYXRhLmRheXMgICA9IGRheXM7XG4gICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzO1xuICAgICAgICBkYXRhLnllYXJzICA9IHllYXJzO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheXNUb01vbnRocyAoZGF5cykge1xuICAgICAgICAvLyA0MDAgeWVhcnMgaGF2ZSAxNDYwOTcgZGF5cyAodGFraW5nIGludG8gYWNjb3VudCBsZWFwIHllYXIgcnVsZXMpXG4gICAgICAgIC8vIDQwMCB5ZWFycyBoYXZlIDEyIG1vbnRocyA9PT0gNDgwMFxuICAgICAgICByZXR1cm4gZGF5cyAqIDQ4MDAgLyAxNDYwOTc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9udGhzVG9EYXlzIChtb250aHMpIHtcbiAgICAgICAgLy8gdGhlIHJldmVyc2Ugb2YgZGF5c1RvTW9udGhzXG4gICAgICAgIHJldHVybiBtb250aHMgKiAxNDYwOTcgLyA0ODAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzICh1bml0cykge1xuICAgICAgICB2YXIgZGF5cztcbiAgICAgICAgdmFyIG1vbnRocztcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcblxuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICBpZiAodW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgZGF5cyAgID0gdGhpcy5fZGF5cyAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMgKyBkYXlzVG9Nb250aHMoZGF5cyk7XG4gICAgICAgICAgICByZXR1cm4gdW5pdHMgPT09ICdtb250aCcgPyBtb250aHMgOiBtb250aHMgLyAxMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBtaWxsaXNlY29uZHMgc2VwYXJhdGVseSBiZWNhdXNlIG9mIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIChpc3N1ZSAjMTg2NylcbiAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzICsgTWF0aC5yb3VuZChtb250aHNUb0RheXModGhpcy5fbW9udGhzKSk7XG4gICAgICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnd2VlaycgICA6IHJldHVybiBkYXlzIC8gNyAgICAgKyBtaWxsaXNlY29uZHMgLyA2MDQ4ZTU7XG4gICAgICAgICAgICAgICAgY2FzZSAnZGF5JyAgICA6IHJldHVybiBkYXlzICAgICAgICAgKyBtaWxsaXNlY29uZHMgLyA4NjRlNTtcbiAgICAgICAgICAgICAgICBjYXNlICdob3VyJyAgIDogcmV0dXJuIGRheXMgKiAyNCAgICArIG1pbGxpc2Vjb25kcyAvIDM2ZTU7XG4gICAgICAgICAgICAgICAgY2FzZSAnbWludXRlJyA6IHJldHVybiBkYXlzICogMTQ0MCAgKyBtaWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Vjb25kJyA6IHJldHVybiBkYXlzICogODY0MDAgKyBtaWxsaXNlY29uZHMgLyAxMDAwO1xuICAgICAgICAgICAgICAgIC8vIE1hdGguZmxvb3IgcHJldmVudHMgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgaGVyZVxuICAgICAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDg2NGU1KSArIG1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdW5pdCAnICsgdW5pdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzogVXNlIHRoaXMuYXMoJ21zJyk/XG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYXNfX3ZhbHVlT2YgKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzICtcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKiA4NjRlNSArXG4gICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgICAgIHRvSW50KHRoaXMuX21vbnRocyAvIDEyKSAqIDMxNTM2ZTZcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQXMgKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcyhhbGlhcyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGFzTWlsbGlzZWNvbmRzID0gbWFrZUFzKCdtcycpO1xuICAgIHZhciBhc1NlY29uZHMgICAgICA9IG1ha2VBcygncycpO1xuICAgIHZhciBhc01pbnV0ZXMgICAgICA9IG1ha2VBcygnbScpO1xuICAgIHZhciBhc0hvdXJzICAgICAgICA9IG1ha2VBcygnaCcpO1xuICAgIHZhciBhc0RheXMgICAgICAgICA9IG1ha2VBcygnZCcpO1xuICAgIHZhciBhc1dlZWtzICAgICAgICA9IG1ha2VBcygndycpO1xuICAgIHZhciBhc01vbnRocyAgICAgICA9IG1ha2VBcygnTScpO1xuICAgIHZhciBhc1llYXJzICAgICAgICA9IG1ha2VBcygneScpO1xuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fZ2V0X19nZXQgKHVuaXRzKSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICByZXR1cm4gdGhpc1t1bml0cyArICdzJ10oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlR2V0dGVyKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBtaWxsaXNlY29uZHMgPSBtYWtlR2V0dGVyKCdtaWxsaXNlY29uZHMnKTtcbiAgICB2YXIgc2Vjb25kcyAgICAgID0gbWFrZUdldHRlcignc2Vjb25kcycpO1xuICAgIHZhciBtaW51dGVzICAgICAgPSBtYWtlR2V0dGVyKCdtaW51dGVzJyk7XG4gICAgdmFyIGhvdXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ2hvdXJzJyk7XG4gICAgdmFyIGRheXMgICAgICAgICA9IG1ha2VHZXR0ZXIoJ2RheXMnKTtcbiAgICB2YXIgbW9udGhzICAgICAgID0gbWFrZUdldHRlcignbW9udGhzJyk7XG4gICAgdmFyIHllYXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ3llYXJzJyk7XG5cbiAgICBmdW5jdGlvbiB3ZWVrcyAoKSB7XG4gICAgICAgIHJldHVybiBhYnNGbG9vcih0aGlzLmRheXMoKSAvIDcpO1xuICAgIH1cblxuICAgIHZhciByb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgdmFyIHRocmVzaG9sZHMgPSB7XG4gICAgICAgIHM6IDQ1LCAgLy8gc2Vjb25kcyB0byBtaW51dGVcbiAgICAgICAgbTogNDUsICAvLyBtaW51dGVzIHRvIGhvdXJcbiAgICAgICAgaDogMjIsICAvLyBob3VycyB0byBkYXlcbiAgICAgICAgZDogMjYsICAvLyBkYXlzIHRvIG1vbnRoXG4gICAgICAgIE06IDExICAgLy8gbW9udGhzIHRvIHllYXJcbiAgICB9O1xuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbiAgICBmdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkdXJhdGlvbl9odW1hbml6ZV9fcmVsYXRpdmVUaW1lIChwb3NOZWdEdXJhdGlvbiwgd2l0aG91dFN1ZmZpeCwgbG9jYWxlKSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24ocG9zTmVnRHVyYXRpb24pLmFicygpO1xuICAgICAgICB2YXIgc2Vjb25kcyAgPSByb3VuZChkdXJhdGlvbi5hcygncycpKTtcbiAgICAgICAgdmFyIG1pbnV0ZXMgID0gcm91bmQoZHVyYXRpb24uYXMoJ20nKSk7XG4gICAgICAgIHZhciBob3VycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdoJykpO1xuICAgICAgICB2YXIgZGF5cyAgICAgPSByb3VuZChkdXJhdGlvbi5hcygnZCcpKTtcbiAgICAgICAgdmFyIG1vbnRocyAgID0gcm91bmQoZHVyYXRpb24uYXMoJ00nKSk7XG4gICAgICAgIHZhciB5ZWFycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCd5JykpO1xuXG4gICAgICAgIHZhciBhID0gc2Vjb25kcyA8IHRocmVzaG9sZHMucyAmJiBbJ3MnLCBzZWNvbmRzXSAgfHxcbiAgICAgICAgICAgICAgICBtaW51dGVzIDw9IDEgICAgICAgICAgICYmIFsnbSddICAgICAgICAgICB8fFxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPCB0aHJlc2hvbGRzLm0gJiYgWydtbScsIG1pbnV0ZXNdIHx8XG4gICAgICAgICAgICAgICAgaG91cnMgICA8PSAxICAgICAgICAgICAmJiBbJ2gnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICBob3VycyAgIDwgdGhyZXNob2xkcy5oICYmIFsnaGgnLCBob3Vyc10gICB8fFxuICAgICAgICAgICAgICAgIGRheXMgICAgPD0gMSAgICAgICAgICAgJiYgWydkJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICAgICAgZGF5cyAgICA8IHRocmVzaG9sZHMuZCAmJiBbJ2RkJywgZGF5c10gICAgfHxcbiAgICAgICAgICAgICAgICBtb250aHMgIDw9IDEgICAgICAgICAgICYmIFsnTSddICAgICAgICAgICB8fFxuICAgICAgICAgICAgICAgIG1vbnRocyAgPCB0aHJlc2hvbGRzLk0gJiYgWydNTScsIG1vbnRoc10gIHx8XG4gICAgICAgICAgICAgICAgeWVhcnMgICA8PSAxICAgICAgICAgICAmJiBbJ3knXSAgICAgICAgICAgfHwgWyd5eScsIHllYXJzXTtcblxuICAgICAgICBhWzJdID0gd2l0aG91dFN1ZmZpeDtcbiAgICAgICAgYVszXSA9ICtwb3NOZWdEdXJhdGlvbiA+IDA7XG4gICAgICAgIGFbNF0gPSBsb2NhbGU7XG4gICAgICAgIHJldHVybiBzdWJzdGl0dXRlVGltZUFnby5hcHBseShudWxsLCBhKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IHRoZSByb3VuZGluZyBmdW5jdGlvbiBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG4gICAgZnVuY3Rpb24gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVJvdW5kaW5nIChyb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIGlmIChyb3VuZGluZ0Z1bmN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByb3VuZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mKHJvdW5kaW5nRnVuY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByb3VuZCA9IHJvdW5kaW5nRnVuY3Rpb247XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCBhIHRocmVzaG9sZCBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG4gICAgZnVuY3Rpb24gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVRocmVzaG9sZCAodGhyZXNob2xkLCBsaW1pdCkge1xuICAgICAgICBpZiAodGhyZXNob2xkc1t0aHJlc2hvbGRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGltaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRocmVzaG9sZHNbdGhyZXNob2xkXTtcbiAgICAgICAgfVxuICAgICAgICB0aHJlc2hvbGRzW3RocmVzaG9sZF0gPSBsaW1pdDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaHVtYW5pemUgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgdmFyIGxvY2FsZSA9IHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICB2YXIgb3V0cHV0ID0gZHVyYXRpb25faHVtYW5pemVfX3JlbGF0aXZlVGltZSh0aGlzLCAhd2l0aFN1ZmZpeCwgbG9jYWxlKTtcblxuICAgICAgICBpZiAod2l0aFN1ZmZpeCkge1xuICAgICAgICAgICAgb3V0cHV0ID0gbG9jYWxlLnBhc3RGdXR1cmUoK3RoaXMsIG91dHB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbG9jYWxlLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICB9XG5cbiAgICB2YXIgaXNvX3N0cmluZ19fYWJzID0gTWF0aC5hYnM7XG5cbiAgICBmdW5jdGlvbiBpc29fc3RyaW5nX190b0lTT1N0cmluZygpIHtcbiAgICAgICAgLy8gZm9yIElTTyBzdHJpbmdzIHdlIGRvIG5vdCB1c2UgdGhlIG5vcm1hbCBidWJibGluZyBydWxlczpcbiAgICAgICAgLy8gICogbWlsbGlzZWNvbmRzIGJ1YmJsZSB1cCB1bnRpbCB0aGV5IGJlY29tZSBob3Vyc1xuICAgICAgICAvLyAgKiBkYXlzIGRvIG5vdCBidWJibGUgYXQgYWxsXG4gICAgICAgIC8vICAqIG1vbnRocyBidWJibGUgdXAgdW50aWwgdGhleSBiZWNvbWUgeWVhcnNcbiAgICAgICAgLy8gVGhpcyBpcyBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvbnRleHQtZnJlZSBjb252ZXJzaW9uIGJldHdlZW4gaG91cnMgYW5kIGRheXNcbiAgICAgICAgLy8gKHRoaW5rIG9mIGNsb2NrIGNoYW5nZXMpXG4gICAgICAgIC8vIGFuZCBhbHNvIG5vdCBiZXR3ZWVuIGRheXMgYW5kIG1vbnRocyAoMjgtMzEgZGF5cyBwZXIgbW9udGgpXG4gICAgICAgIHZhciBzZWNvbmRzID0gaXNvX3N0cmluZ19fYWJzKHRoaXMuX21pbGxpc2Vjb25kcykgLyAxMDAwO1xuICAgICAgICB2YXIgZGF5cyAgICAgICAgID0gaXNvX3N0cmluZ19fYWJzKHRoaXMuX2RheXMpO1xuICAgICAgICB2YXIgbW9udGhzICAgICAgID0gaXNvX3N0cmluZ19fYWJzKHRoaXMuX21vbnRocyk7XG4gICAgICAgIHZhciBtaW51dGVzLCBob3VycywgeWVhcnM7XG5cbiAgICAgICAgLy8gMzYwMCBzZWNvbmRzIC0+IDYwIG1pbnV0ZXMgLT4gMSBob3VyXG4gICAgICAgIG1pbnV0ZXMgICAgICAgICAgID0gYWJzRmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICAgICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgICAgICBzZWNvbmRzICU9IDYwO1xuICAgICAgICBtaW51dGVzICU9IDYwO1xuXG4gICAgICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICAgICAgeWVhcnMgID0gYWJzRmxvb3IobW9udGhzIC8gMTIpO1xuICAgICAgICBtb250aHMgJT0gMTI7XG5cblxuICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgICAgICB2YXIgWSA9IHllYXJzO1xuICAgICAgICB2YXIgTSA9IG1vbnRocztcbiAgICAgICAgdmFyIEQgPSBkYXlzO1xuICAgICAgICB2YXIgaCA9IGhvdXJzO1xuICAgICAgICB2YXIgbSA9IG1pbnV0ZXM7XG4gICAgICAgIHZhciBzID0gc2Vjb25kcztcbiAgICAgICAgdmFyIHRvdGFsID0gdGhpcy5hc1NlY29uZHMoKTtcblxuICAgICAgICBpZiAoIXRvdGFsKSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIHRoZSBzYW1lIGFzIEMjJ3MgKE5vZGEpIGFuZCBweXRob24gKGlzb2RhdGUpLi4uXG4gICAgICAgICAgICAvLyBidXQgbm90IG90aGVyIEpTIChnb29nLmRhdGUpXG4gICAgICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHRvdGFsIDwgMCA/ICctJyA6ICcnKSArXG4gICAgICAgICAgICAnUCcgK1xuICAgICAgICAgICAgKFkgPyBZICsgJ1knIDogJycpICtcbiAgICAgICAgICAgIChNID8gTSArICdNJyA6ICcnKSArXG4gICAgICAgICAgICAoRCA/IEQgKyAnRCcgOiAnJykgK1xuICAgICAgICAgICAgKChoIHx8IG0gfHwgcykgPyAnVCcgOiAnJykgK1xuICAgICAgICAgICAgKGggPyBoICsgJ0gnIDogJycpICtcbiAgICAgICAgICAgIChtID8gbSArICdNJyA6ICcnKSArXG4gICAgICAgICAgICAocyA/IHMgKyAnUycgOiAnJyk7XG4gICAgfVxuXG4gICAgdmFyIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8gPSBEdXJhdGlvbi5wcm90b3R5cGU7XG5cbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFicyAgICAgICAgICAgID0gZHVyYXRpb25fYWJzX19hYnM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hZGQgICAgICAgICAgICA9IGR1cmF0aW9uX2FkZF9zdWJ0cmFjdF9fYWRkO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uc3VidHJhY3QgICAgICAgPSBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX3N1YnRyYWN0O1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXMgICAgICAgICAgICAgPSBhcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzTWlsbGlzZWNvbmRzID0gYXNNaWxsaXNlY29uZHM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc1NlY29uZHMgICAgICA9IGFzU2Vjb25kcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzTWludXRlcyAgICAgID0gYXNNaW51dGVzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNIb3VycyAgICAgICAgPSBhc0hvdXJzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNEYXlzICAgICAgICAgPSBhc0RheXM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc1dlZWtzICAgICAgICA9IGFzV2Vla3M7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc01vbnRocyAgICAgICA9IGFzTW9udGhzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNZZWFycyAgICAgICAgPSBhc1llYXJzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8udmFsdWVPZiAgICAgICAgPSBkdXJhdGlvbl9hc19fdmFsdWVPZjtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLl9idWJibGUgICAgICAgID0gYnViYmxlO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uZ2V0ICAgICAgICAgICAgPSBkdXJhdGlvbl9nZXRfX2dldDtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLm1pbGxpc2Vjb25kcyAgID0gbWlsbGlzZWNvbmRzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uc2Vjb25kcyAgICAgICAgPSBzZWNvbmRzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8ubWludXRlcyAgICAgICAgPSBtaW51dGVzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uaG91cnMgICAgICAgICAgPSBob3VycztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmRheXMgICAgICAgICAgID0gZGF5cztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLndlZWtzICAgICAgICAgID0gd2Vla3M7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5tb250aHMgICAgICAgICA9IG1vbnRocztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnllYXJzICAgICAgICAgID0geWVhcnM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5odW1hbml6ZSAgICAgICA9IGh1bWFuaXplO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8udG9JU09TdHJpbmcgICAgPSBpc29fc3RyaW5nX190b0lTT1N0cmluZztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnRvU3RyaW5nICAgICAgID0gaXNvX3N0cmluZ19fdG9JU09TdHJpbmc7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by50b0pTT04gICAgICAgICA9IGlzb19zdHJpbmdfX3RvSVNPU3RyaW5nO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8ubG9jYWxlICAgICAgICAgPSBsb2NhbGU7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5sb2NhbGVEYXRhICAgICA9IGxvY2FsZURhdGE7XG5cbiAgICAvLyBEZXByZWNhdGlvbnNcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnRvSXNvU3RyaW5nID0gZGVwcmVjYXRlKCd0b0lzb1N0cmluZygpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgdG9JU09TdHJpbmcoKSBpbnN0ZWFkIChub3RpY2UgdGhlIGNhcGl0YWxzKScsIGlzb19zdHJpbmdfX3RvSVNPU3RyaW5nKTtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmxhbmcgPSBsYW5nO1xuXG4gICAgLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ1gnLCAwLCAwLCAndW5peCcpO1xuICAgIGFkZEZvcm1hdFRva2VuKCd4JywgMCwgMCwgJ3ZhbHVlT2YnKTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ3gnLCBtYXRjaFNpZ25lZCk7XG4gICAgYWRkUmVnZXhUb2tlbignWCcsIG1hdGNoVGltZXN0YW1wKTtcbiAgICBhZGRQYXJzZVRva2VuKCdYJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQsIDEwKSAqIDEwMDApO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ3gnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUodG9JbnQoaW5wdXQpKTtcbiAgICB9KTtcblxuICAgIC8vIFNpZGUgZWZmZWN0IGltcG9ydHNcblxuXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnZlcnNpb24gPSAnMi4xNS4xJztcblxuICAgIHNldEhvb2tDYWxsYmFjayhsb2NhbF9fY3JlYXRlTG9jYWwpO1xuXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmZuICAgICAgICAgICAgICAgICAgICA9IG1vbWVudFByb3RvdHlwZTtcbiAgICB1dGlsc19ob29rc19faG9va3MubWluICAgICAgICAgICAgICAgICAgID0gbWluO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5tYXggICAgICAgICAgICAgICAgICAgPSBtYXg7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm5vdyAgICAgICAgICAgICAgICAgICA9IG5vdztcbiAgICB1dGlsc19ob29rc19faG9va3MudXRjICAgICAgICAgICAgICAgICAgID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy51bml4ICAgICAgICAgICAgICAgICAgPSBtb21lbnRfX2NyZWF0ZVVuaXg7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm1vbnRocyAgICAgICAgICAgICAgICA9IGxpc3RzX19saXN0TW9udGhzO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5pc0RhdGUgICAgICAgICAgICAgICAgPSBpc0RhdGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxvY2FsZSAgICAgICAgICAgICAgICA9IGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmludmFsaWQgICAgICAgICAgICAgICA9IHZhbGlkX19jcmVhdGVJbnZhbGlkO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5kdXJhdGlvbiAgICAgICAgICAgICAgPSBjcmVhdGVfX2NyZWF0ZUR1cmF0aW9uO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5pc01vbWVudCAgICAgICAgICAgICAgPSBpc01vbWVudDtcbiAgICB1dGlsc19ob29rc19faG9va3Mud2Vla2RheXMgICAgICAgICAgICAgID0gbGlzdHNfX2xpc3RXZWVrZGF5cztcbiAgICB1dGlsc19ob29rc19faG9va3MucGFyc2Vab25lICAgICAgICAgICAgID0gbW9tZW50X19jcmVhdGVJblpvbmU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxvY2FsZURhdGEgICAgICAgICAgICA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmlzRHVyYXRpb24gICAgICAgICAgICA9IGlzRHVyYXRpb247XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm1vbnRoc1Nob3J0ICAgICAgICAgICA9IGxpc3RzX19saXN0TW9udGhzU2hvcnQ7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLndlZWtkYXlzTWluICAgICAgICAgICA9IGxpc3RzX19saXN0V2Vla2RheXNNaW47XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlZmluZUxvY2FsZSAgICAgICAgICA9IGRlZmluZUxvY2FsZTtcbiAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlTG9jYWxlICAgICAgICAgID0gdXBkYXRlTG9jYWxlO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5sb2NhbGVzICAgICAgICAgICAgICAgPSBsb2NhbGVfbG9jYWxlc19fbGlzdExvY2FsZXM7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLndlZWtkYXlzU2hvcnQgICAgICAgICA9IGxpc3RzX19saXN0V2Vla2RheXNTaG9ydDtcbiAgICB1dGlsc19ob29rc19faG9va3Mubm9ybWFsaXplVW5pdHMgICAgICAgID0gbm9ybWFsaXplVW5pdHM7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnJlbGF0aXZlVGltZVJvdW5kaW5nID0gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVJvdW5kaW5nO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5yZWxhdGl2ZVRpbWVUaHJlc2hvbGQgPSBkdXJhdGlvbl9odW1hbml6ZV9fZ2V0U2V0UmVsYXRpdmVUaW1lVGhyZXNob2xkO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5jYWxlbmRhckZvcm1hdCAgICAgICAgPSBnZXRDYWxlbmRhckZvcm1hdDtcbiAgICB1dGlsc19ob29rc19faG9va3MucHJvdG90eXBlICAgICAgICAgICAgID0gbW9tZW50UHJvdG90eXBlO1xuXG4gICAgdmFyIF9tb21lbnQgPSB1dGlsc19ob29rc19faG9va3M7XG5cbiAgICByZXR1cm4gX21vbWVudDtcblxufSkpOyIsIi8qIVxuICogbnVtZXJhbC5qc1xuICogdmVyc2lvbiA6IDEuNS4zXG4gKiBhdXRob3IgOiBBZGFtIERyYXBlclxuICogbGljZW5zZSA6IE1JVFxuICogaHR0cDovL2FkYW13ZHJhcGVyLmdpdGh1Yi5jb20vTnVtZXJhbC1qcy9cbiAqL1xuKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gYShhKXt0aGlzLl92YWx1ZT1hfWZ1bmN0aW9uIGIoYSxiLGMsZCl7dmFyIGUsZixnPU1hdGgucG93KDEwLGIpO3JldHVybiBmPShjKGEqZykvZykudG9GaXhlZChiKSxkJiYoZT1uZXcgUmVnRXhwKFwiMHsxLFwiK2QrXCJ9JFwiKSxmPWYucmVwbGFjZShlLFwiXCIpKSxmfWZ1bmN0aW9uIGMoYSxiLGMpe3ZhciBkO3JldHVybiBkPWIuaW5kZXhPZihcIiRcIik+LTE/ZShhLGIsYyk6Yi5pbmRleE9mKFwiJVwiKT4tMT9mKGEsYixjKTpiLmluZGV4T2YoXCI6XCIpPi0xP2coYSxiKTppKGEuX3ZhbHVlLGIsYyl9ZnVuY3Rpb24gZChhLGIpe3ZhciBjLGQsZSxmLGcsaT1iLGo9W1wiS0JcIixcIk1CXCIsXCJHQlwiLFwiVEJcIixcIlBCXCIsXCJFQlwiLFwiWkJcIixcIllCXCJdLGs9ITE7aWYoYi5pbmRleE9mKFwiOlwiKT4tMSlhLl92YWx1ZT1oKGIpO2Vsc2UgaWYoYj09PXEpYS5fdmFsdWU9MDtlbHNle2ZvcihcIi5cIiE9PW9bcF0uZGVsaW1pdGVycy5kZWNpbWFsJiYoYj1iLnJlcGxhY2UoL1xcLi9nLFwiXCIpLnJlcGxhY2Uob1twXS5kZWxpbWl0ZXJzLmRlY2ltYWwsXCIuXCIpKSxjPW5ldyBSZWdFeHAoXCJbXmEtekEtWl1cIitvW3BdLmFiYnJldmlhdGlvbnMudGhvdXNhbmQrXCIoPzpcXFxcKXwoXFxcXFwiK29bcF0uY3VycmVuY3kuc3ltYm9sK1wiKT8oPzpcXFxcKSk/KT8kXCIpLGQ9bmV3IFJlZ0V4cChcIlteYS16QS1aXVwiK29bcF0uYWJicmV2aWF0aW9ucy5taWxsaW9uK1wiKD86XFxcXCl8KFxcXFxcIitvW3BdLmN1cnJlbmN5LnN5bWJvbCtcIik/KD86XFxcXCkpPyk/JFwiKSxlPW5ldyBSZWdFeHAoXCJbXmEtekEtWl1cIitvW3BdLmFiYnJldmlhdGlvbnMuYmlsbGlvbitcIig/OlxcXFwpfChcXFxcXCIrb1twXS5jdXJyZW5jeS5zeW1ib2wrXCIpPyg/OlxcXFwpKT8pPyRcIiksZj1uZXcgUmVnRXhwKFwiW15hLXpBLVpdXCIrb1twXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uK1wiKD86XFxcXCl8KFxcXFxcIitvW3BdLmN1cnJlbmN5LnN5bWJvbCtcIik/KD86XFxcXCkpPyk/JFwiKSxnPTA7Zzw9ai5sZW5ndGgmJiEoaz1iLmluZGV4T2YoaltnXSk+LTE/TWF0aC5wb3coMTAyNCxnKzEpOiExKTtnKyspO2EuX3ZhbHVlPShrP2s6MSkqKGkubWF0Y2goYyk/TWF0aC5wb3coMTAsMyk6MSkqKGkubWF0Y2goZCk/TWF0aC5wb3coMTAsNik6MSkqKGkubWF0Y2goZSk/TWF0aC5wb3coMTAsOSk6MSkqKGkubWF0Y2goZik/TWF0aC5wb3coMTAsMTIpOjEpKihiLmluZGV4T2YoXCIlXCIpPi0xPy4wMToxKSooKGIuc3BsaXQoXCItXCIpLmxlbmd0aCtNYXRoLm1pbihiLnNwbGl0KFwiKFwiKS5sZW5ndGgtMSxiLnNwbGl0KFwiKVwiKS5sZW5ndGgtMSkpJTI/MTotMSkqTnVtYmVyKGIucmVwbGFjZSgvW14wLTlcXC5dKy9nLFwiXCIpKSxhLl92YWx1ZT1rP01hdGguY2VpbChhLl92YWx1ZSk6YS5fdmFsdWV9cmV0dXJuIGEuX3ZhbHVlfWZ1bmN0aW9uIGUoYSxiLGMpe3ZhciBkLGUsZj1iLmluZGV4T2YoXCIkXCIpLGc9Yi5pbmRleE9mKFwiKFwiKSxoPWIuaW5kZXhPZihcIi1cIiksaj1cIlwiO3JldHVybiBiLmluZGV4T2YoXCIgJFwiKT4tMT8oaj1cIiBcIixiPWIucmVwbGFjZShcIiAkXCIsXCJcIikpOmIuaW5kZXhPZihcIiQgXCIpPi0xPyhqPVwiIFwiLGI9Yi5yZXBsYWNlKFwiJCBcIixcIlwiKSk6Yj1iLnJlcGxhY2UoXCIkXCIsXCJcIiksZT1pKGEuX3ZhbHVlLGIsYyksMT49Zj9lLmluZGV4T2YoXCIoXCIpPi0xfHxlLmluZGV4T2YoXCItXCIpPi0xPyhlPWUuc3BsaXQoXCJcIiksZD0xLChnPmZ8fGg+ZikmJihkPTApLGUuc3BsaWNlKGQsMCxvW3BdLmN1cnJlbmN5LnN5bWJvbCtqKSxlPWUuam9pbihcIlwiKSk6ZT1vW3BdLmN1cnJlbmN5LnN5bWJvbCtqK2U6ZS5pbmRleE9mKFwiKVwiKT4tMT8oZT1lLnNwbGl0KFwiXCIpLGUuc3BsaWNlKC0xLDAsaitvW3BdLmN1cnJlbmN5LnN5bWJvbCksZT1lLmpvaW4oXCJcIikpOmU9ZStqK29bcF0uY3VycmVuY3kuc3ltYm9sLGV9ZnVuY3Rpb24gZihhLGIsYyl7dmFyIGQsZT1cIlwiLGY9MTAwKmEuX3ZhbHVlO3JldHVybiBiLmluZGV4T2YoXCIgJVwiKT4tMT8oZT1cIiBcIixiPWIucmVwbGFjZShcIiAlXCIsXCJcIikpOmI9Yi5yZXBsYWNlKFwiJVwiLFwiXCIpLGQ9aShmLGIsYyksZC5pbmRleE9mKFwiKVwiKT4tMT8oZD1kLnNwbGl0KFwiXCIpLGQuc3BsaWNlKC0xLDAsZStcIiVcIiksZD1kLmpvaW4oXCJcIikpOmQ9ZCtlK1wiJVwiLGR9ZnVuY3Rpb24gZyhhKXt2YXIgYj1NYXRoLmZsb29yKGEuX3ZhbHVlLzYwLzYwKSxjPU1hdGguZmxvb3IoKGEuX3ZhbHVlLTYwKmIqNjApLzYwKSxkPU1hdGgucm91bmQoYS5fdmFsdWUtNjAqYio2MC02MCpjKTtyZXR1cm4gYitcIjpcIisoMTA+Yz9cIjBcIitjOmMpK1wiOlwiKygxMD5kP1wiMFwiK2Q6ZCl9ZnVuY3Rpb24gaChhKXt2YXIgYj1hLnNwbGl0KFwiOlwiKSxjPTA7cmV0dXJuIDM9PT1iLmxlbmd0aD8oYys9NjAqTnVtYmVyKGJbMF0pKjYwLGMrPTYwKk51bWJlcihiWzFdKSxjKz1OdW1iZXIoYlsyXSkpOjI9PT1iLmxlbmd0aCYmKGMrPTYwKk51bWJlcihiWzBdKSxjKz1OdW1iZXIoYlsxXSkpLE51bWJlcihjKX1mdW5jdGlvbiBpKGEsYyxkKXt2YXIgZSxmLGcsaCxpLGosaz0hMSxsPSExLG09ITEsbj1cIlwiLHI9ITEscz0hMSx0PSExLHU9ITEsdj0hMSx3PVwiXCIseD1cIlwiLHk9TWF0aC5hYnMoYSksej1bXCJCXCIsXCJLQlwiLFwiTUJcIixcIkdCXCIsXCJUQlwiLFwiUEJcIixcIkVCXCIsXCJaQlwiLFwiWUJcIl0sQT1cIlwiLEI9ITE7aWYoMD09PWEmJm51bGwhPT1xKXJldHVybiBxO2lmKGMuaW5kZXhPZihcIihcIik+LTE/KGs9ITAsYz1jLnNsaWNlKDEsLTEpKTpjLmluZGV4T2YoXCIrXCIpPi0xJiYobD0hMCxjPWMucmVwbGFjZSgvXFwrL2csXCJcIikpLGMuaW5kZXhPZihcImFcIik+LTEmJihyPWMuaW5kZXhPZihcImFLXCIpPj0wLHM9Yy5pbmRleE9mKFwiYU1cIik+PTAsdD1jLmluZGV4T2YoXCJhQlwiKT49MCx1PWMuaW5kZXhPZihcImFUXCIpPj0wLHY9cnx8c3x8dHx8dSxjLmluZGV4T2YoXCIgYVwiKT4tMT8obj1cIiBcIixjPWMucmVwbGFjZShcIiBhXCIsXCJcIikpOmM9Yy5yZXBsYWNlKFwiYVwiLFwiXCIpLHk+PU1hdGgucG93KDEwLDEyKSYmIXZ8fHU/KG4rPW9bcF0uYWJicmV2aWF0aW9ucy50cmlsbGlvbixhLz1NYXRoLnBvdygxMCwxMikpOnk8TWF0aC5wb3coMTAsMTIpJiZ5Pj1NYXRoLnBvdygxMCw5KSYmIXZ8fHQ/KG4rPW9bcF0uYWJicmV2aWF0aW9ucy5iaWxsaW9uLGEvPU1hdGgucG93KDEwLDkpKTp5PE1hdGgucG93KDEwLDkpJiZ5Pj1NYXRoLnBvdygxMCw2KSYmIXZ8fHM/KG4rPW9bcF0uYWJicmV2aWF0aW9ucy5taWxsaW9uLGEvPU1hdGgucG93KDEwLDYpKTooeTxNYXRoLnBvdygxMCw2KSYmeT49TWF0aC5wb3coMTAsMykmJiF2fHxyKSYmKG4rPW9bcF0uYWJicmV2aWF0aW9ucy50aG91c2FuZCxhLz1NYXRoLnBvdygxMCwzKSkpLGMuaW5kZXhPZihcImJcIik+LTEpZm9yKGMuaW5kZXhPZihcIiBiXCIpPi0xPyh3PVwiIFwiLGM9Yy5yZXBsYWNlKFwiIGJcIixcIlwiKSk6Yz1jLnJlcGxhY2UoXCJiXCIsXCJcIiksZz0wO2c8PXoubGVuZ3RoO2crKylpZihlPU1hdGgucG93KDEwMjQsZyksZj1NYXRoLnBvdygxMDI0LGcrMSksYT49ZSYmZj5hKXt3Kz16W2ddLGU+MCYmKGEvPWUpO2JyZWFrfXJldHVybiBjLmluZGV4T2YoXCJvXCIpPi0xJiYoYy5pbmRleE9mKFwiIG9cIik+LTE/KHg9XCIgXCIsYz1jLnJlcGxhY2UoXCIgb1wiLFwiXCIpKTpjPWMucmVwbGFjZShcIm9cIixcIlwiKSx4Kz1vW3BdLm9yZGluYWwoYSkpLGMuaW5kZXhPZihcIlsuXVwiKT4tMSYmKG09ITAsYz1jLnJlcGxhY2UoXCJbLl1cIixcIi5cIikpLGg9YS50b1N0cmluZygpLnNwbGl0KFwiLlwiKVswXSxpPWMuc3BsaXQoXCIuXCIpWzFdLGo9Yy5pbmRleE9mKFwiLFwiKSxpPyhpLmluZGV4T2YoXCJbXCIpPi0xPyhpPWkucmVwbGFjZShcIl1cIixcIlwiKSxpPWkuc3BsaXQoXCJbXCIpLEE9YihhLGlbMF0ubGVuZ3RoK2lbMV0ubGVuZ3RoLGQsaVsxXS5sZW5ndGgpKTpBPWIoYSxpLmxlbmd0aCxkKSxoPUEuc3BsaXQoXCIuXCIpWzBdLEE9QS5zcGxpdChcIi5cIilbMV0ubGVuZ3RoP29bcF0uZGVsaW1pdGVycy5kZWNpbWFsK0Euc3BsaXQoXCIuXCIpWzFdOlwiXCIsbSYmMD09PU51bWJlcihBLnNsaWNlKDEpKSYmKEE9XCJcIikpOmg9YihhLG51bGwsZCksaC5pbmRleE9mKFwiLVwiKT4tMSYmKGg9aC5zbGljZSgxKSxCPSEwKSxqPi0xJiYoaD1oLnRvU3RyaW5nKCkucmVwbGFjZSgvKFxcZCkoPz0oXFxkezN9KSsoPyFcXGQpKS9nLFwiJDFcIitvW3BdLmRlbGltaXRlcnMudGhvdXNhbmRzKSksMD09PWMuaW5kZXhPZihcIi5cIikmJihoPVwiXCIpLChrJiZCP1wiKFwiOlwiXCIpKyghayYmQj9cIi1cIjpcIlwiKSsoIUImJmw/XCIrXCI6XCJcIikraCtBKyh4P3g6XCJcIikrKG4/bjpcIlwiKSsodz93OlwiXCIpKyhrJiZCP1wiKVwiOlwiXCIpfWZ1bmN0aW9uIGooYSxiKXtvW2FdPWJ9ZnVuY3Rpb24gayhhKXt2YXIgYj1hLnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpO3JldHVybiBiLmxlbmd0aDwyPzE6TWF0aC5wb3coMTAsYlsxXS5sZW5ndGgpfWZ1bmN0aW9uIGwoKXt2YXIgYT1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO3JldHVybiBhLnJlZHVjZShmdW5jdGlvbihhLGIpe3ZhciBjPWsoYSksZD1rKGIpO3JldHVybiBjPmQ/YzpkfSwtMS8wKX12YXIgbSxuPVwiMS41LjNcIixvPXt9LHA9XCJlblwiLHE9bnVsbCxyPVwiMCwwXCIscz1cInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlJiZtb2R1bGUuZXhwb3J0czttPWZ1bmN0aW9uKGIpe3JldHVybiBtLmlzTnVtZXJhbChiKT9iPWIudmFsdWUoKTowPT09Ynx8XCJ1bmRlZmluZWRcIj09dHlwZW9mIGI/Yj0wOk51bWJlcihiKXx8KGI9bS5mbi51bmZvcm1hdChiKSksbmV3IGEoTnVtYmVyKGIpKX0sbS52ZXJzaW9uPW4sbS5pc051bWVyYWw9ZnVuY3Rpb24oYil7cmV0dXJuIGIgaW5zdGFuY2VvZiBhfSxtLmxhbmd1YWdlPWZ1bmN0aW9uKGEsYil7aWYoIWEpcmV0dXJuIHA7aWYoYSYmIWIpe2lmKCFvW2FdKXRocm93IG5ldyBFcnJvcihcIlVua25vd24gbGFuZ3VhZ2UgOiBcIithKTtwPWF9cmV0dXJuKGJ8fCFvW2FdKSYmaihhLGIpLG19LG0ubGFuZ3VhZ2VEYXRhPWZ1bmN0aW9uKGEpe2lmKCFhKXJldHVybiBvW3BdO2lmKCFvW2FdKXRocm93IG5ldyBFcnJvcihcIlVua25vd24gbGFuZ3VhZ2UgOiBcIithKTtyZXR1cm4gb1thXX0sbS5sYW5ndWFnZShcImVuXCIse2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIixcIixkZWNpbWFsOlwiLlwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcImtcIixtaWxsaW9uOlwibVwiLGJpbGxpb246XCJiXCIsdHJpbGxpb246XCJ0XCJ9LG9yZGluYWw6ZnVuY3Rpb24oYSl7dmFyIGI9YSUxMDtyZXR1cm4gMT09PX5+KGElMTAwLzEwKT9cInRoXCI6MT09PWI/XCJzdFwiOjI9PT1iP1wibmRcIjozPT09Yj9cInJkXCI6XCJ0aFwifSxjdXJyZW5jeTp7c3ltYm9sOlwiJFwifX0pLG0uemVyb0Zvcm1hdD1mdW5jdGlvbihhKXtxPVwic3RyaW5nXCI9PXR5cGVvZiBhP2E6bnVsbH0sbS5kZWZhdWx0Rm9ybWF0PWZ1bmN0aW9uKGEpe3I9XCJzdHJpbmdcIj09dHlwZW9mIGE/YTpcIjAuMFwifSxcImZ1bmN0aW9uXCIhPXR5cGVvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlJiYoQXJyYXkucHJvdG90eXBlLnJlZHVjZT1mdW5jdGlvbihhLGIpe1widXNlIHN0cmljdFwiO2lmKG51bGw9PT10aGlzfHxcInVuZGVmaW5lZFwiPT10eXBlb2YgdGhpcyl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQXJyYXkucHJvdG90eXBlLnJlZHVjZSBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWRcIik7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKGErXCIgaXMgbm90IGEgZnVuY3Rpb25cIik7dmFyIGMsZCxlPXRoaXMubGVuZ3RoPj4+MCxmPSExO2ZvcigxPGFyZ3VtZW50cy5sZW5ndGgmJihkPWIsZj0hMCksYz0wO2U+YzsrK2MpdGhpcy5oYXNPd25Qcm9wZXJ0eShjKSYmKGY/ZD1hKGQsdGhpc1tjXSxjLHRoaXMpOihkPXRoaXNbY10sZj0hMCkpO2lmKCFmKXRocm93IG5ldyBUeXBlRXJyb3IoXCJSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlXCIpO3JldHVybiBkfSksbS5mbj1hLnByb3RvdHlwZT17Y2xvbmU6ZnVuY3Rpb24oKXtyZXR1cm4gbSh0aGlzKX0sZm9ybWF0OmZ1bmN0aW9uKGEsYil7cmV0dXJuIGModGhpcyxhP2E6cix2b2lkIDAhPT1iP2I6TWF0aC5yb3VuZCl9LHVuZm9ybWF0OmZ1bmN0aW9uKGEpe3JldHVyblwiW29iamVjdCBOdW1iZXJdXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSk/YTpkKHRoaXMsYT9hOnIpfSx2YWx1ZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLl92YWx1ZX0sdmFsdWVPZjpmdW5jdGlvbigpe3JldHVybiB0aGlzLl92YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLl92YWx1ZT1OdW1iZXIoYSksdGhpc30sYWRkOmZ1bmN0aW9uKGEpe2Z1bmN0aW9uIGIoYSxiKXtyZXR1cm4gYStjKmJ9dmFyIGM9bC5jYWxsKG51bGwsdGhpcy5fdmFsdWUsYSk7cmV0dXJuIHRoaXMuX3ZhbHVlPVt0aGlzLl92YWx1ZSxhXS5yZWR1Y2UoYiwwKS9jLHRoaXN9LHN1YnRyYWN0OmZ1bmN0aW9uKGEpe2Z1bmN0aW9uIGIoYSxiKXtyZXR1cm4gYS1jKmJ9dmFyIGM9bC5jYWxsKG51bGwsdGhpcy5fdmFsdWUsYSk7cmV0dXJuIHRoaXMuX3ZhbHVlPVthXS5yZWR1Y2UoYix0aGlzLl92YWx1ZSpjKS9jLHRoaXN9LG11bHRpcGx5OmZ1bmN0aW9uKGEpe2Z1bmN0aW9uIGIoYSxiKXt2YXIgYz1sKGEsYik7cmV0dXJuIGEqYypiKmMvKGMqYyl9cmV0dXJuIHRoaXMuX3ZhbHVlPVt0aGlzLl92YWx1ZSxhXS5yZWR1Y2UoYiwxKSx0aGlzfSxkaXZpZGU6ZnVuY3Rpb24oYSl7ZnVuY3Rpb24gYihhLGIpe3ZhciBjPWwoYSxiKTtyZXR1cm4gYSpjLyhiKmMpfXJldHVybiB0aGlzLl92YWx1ZT1bdGhpcy5fdmFsdWUsYV0ucmVkdWNlKGIpLHRoaXN9LGRpZmZlcmVuY2U6ZnVuY3Rpb24oYSl7cmV0dXJuIE1hdGguYWJzKG0odGhpcy5fdmFsdWUpLnN1YnRyYWN0KGEpLnZhbHVlKCkpfX0scyYmKG1vZHVsZS5leHBvcnRzPW0pLFwidW5kZWZpbmVkXCI9PXR5cGVvZiBlbmRlciYmKHRoaXMubnVtZXJhbD1tKSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQmJmRlZmluZShbXSxmdW5jdGlvbigpe3JldHVybiBtfSl9KS5jYWxsKHRoaXMpO1xuXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIgXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJrXCIsbWlsbGlvbjpcIiBtbG5cIixiaWxsaW9uOlwiIG1sZFwiLHRyaWxsaW9uOlwiIGJsblwifSxvcmRpbmFsOmZ1bmN0aW9uKGEpe3ZhciBiPWElMTAwO3JldHVybiAwIT09YSYmMT49Ynx8OD09PWJ8fGI+PTIwP1wic3RlXCI6XCJkZVwifSxjdXJyZW5jeTp7c3ltYm9sOlwi4oKsIFwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcImJlLW5sXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIixcIixkZWNpbWFsOlwiLlwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcIuWNg1wiLG1pbGxpb246XCLnmb7kuIdcIixiaWxsaW9uOlwi5Y2B5Lq/XCIsdHJpbGxpb246XCLlhYZcIn0sb3JkaW5hbDpmdW5jdGlvbigpe3JldHVyblwiLlwifSxjdXJyZW5jeTp7c3ltYm9sOlwiwqVcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJjaHNcIixhKX0pKCk7XG4gXG4oZnVuY3Rpb24oKXt2YXIgYT17ZGVsaW1pdGVyczp7dGhvdXNhbmRzOlwiIFwiLGRlY2ltYWw6XCIsXCJ9LGFiYnJldmlhdGlvbnM6e3Rob3VzYW5kOlwidGlzLlwiLG1pbGxpb246XCJtaWwuXCIsYmlsbGlvbjpcImJcIix0cmlsbGlvbjpcInRcIn0sb3JkaW5hbDpmdW5jdGlvbigpe3JldHVyblwiLlwifSxjdXJyZW5jeTp7c3ltYm9sOlwiS8SNXCJ9fTtcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93JiZ0aGlzLm51bWVyYWwmJnRoaXMubnVtZXJhbC5sYW5ndWFnZSYmdGhpcy5udW1lcmFsLmxhbmd1YWdlKFwiY3NcIixhKX0pKCk7IFxuXG4oZnVuY3Rpb24oKXt2YXIgYT17ZGVsaW1pdGVyczp7dGhvdXNhbmRzOlwiLlwiLGRlY2ltYWw6XCIsXCJ9LGFiYnJldmlhdGlvbnM6e3Rob3VzYW5kOlwia1wiLG1pbGxpb246XCJtaW9cIixiaWxsaW9uOlwibWlhXCIsdHJpbGxpb246XCJiXCJ9LG9yZGluYWw6ZnVuY3Rpb24oKXtyZXR1cm5cIi5cIn0sY3VycmVuY3k6e3N5bWJvbDpcIkRLS1wifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcImRhLWRrXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIiBcIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcImtcIixtaWxsaW9uOlwibVwiLGJpbGxpb246XCJiXCIsdHJpbGxpb246XCJ0XCJ9LG9yZGluYWw6ZnVuY3Rpb24oKXtyZXR1cm5cIi5cIn0sY3VycmVuY3k6e3N5bWJvbDpcIkNIRlwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcImRlLWNoXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIiBcIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcImtcIixtaWxsaW9uOlwibVwiLGJpbGxpb246XCJiXCIsdHJpbGxpb246XCJ0XCJ9LG9yZGluYWw6ZnVuY3Rpb24oKXtyZXR1cm5cIi5cIn0sY3VycmVuY3k6e3N5bWJvbDpcIuKCrFwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcImRlXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIixcIixkZWNpbWFsOlwiLlwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcImtcIixtaWxsaW9uOlwibVwiLGJpbGxpb246XCJiXCIsdHJpbGxpb246XCJ0XCJ9LG9yZGluYWw6ZnVuY3Rpb24oYSl7dmFyIGI9YSUxMDtyZXR1cm4gMT09PX5+KGElMTAwLzEwKT9cInRoXCI6MT09PWI/XCJzdFwiOjI9PT1iP1wibmRcIjozPT09Yj9cInJkXCI6XCJ0aFwifSxjdXJyZW5jeTp7c3ltYm9sOlwiwqNcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJlbi1nYlwiLGEpfSkoKTsgXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIuXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJrXCIsbWlsbGlvbjpcIm1tXCIsYmlsbGlvbjpcImJcIix0cmlsbGlvbjpcInRcIn0sb3JkaW5hbDpmdW5jdGlvbihhKXt2YXIgYj1hJTEwO3JldHVybiAxPT09Ynx8Mz09PWI/XCJlclwiOjI9PT1iP1wiZG9cIjo3PT09Ynx8MD09PWI/XCJtb1wiOjg9PT1iP1widm9cIjo5PT09Yj9cIm5vXCI6XCJ0b1wifSxjdXJyZW5jeTp7c3ltYm9sOlwi4oKsXCJ9fTtcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93JiZ0aGlzLm51bWVyYWwmJnRoaXMubnVtZXJhbC5sYW5ndWFnZSYmdGhpcy5udW1lcmFsLmxhbmd1YWdlKFwiZXNcIixhKX0pKCk7IFxuXG4oZnVuY3Rpb24oKXt2YXIgYT17ZGVsaW1pdGVyczp7dGhvdXNhbmRzOlwiLlwiLGRlY2ltYWw6XCIsXCJ9LGFiYnJldmlhdGlvbnM6e3Rob3VzYW5kOlwia1wiLG1pbGxpb246XCJtbVwiLGJpbGxpb246XCJiXCIsdHJpbGxpb246XCJ0XCJ9LG9yZGluYWw6ZnVuY3Rpb24oYSl7dmFyIGI9YSUxMDtyZXR1cm4gMT09PWJ8fDM9PT1iP1wiZXJcIjoyPT09Yj9cImRvXCI6Nz09PWJ8fDA9PT1iP1wibW9cIjo4PT09Yj9cInZvXCI6OT09PWI/XCJub1wiOlwidG9cIn0sY3VycmVuY3k6e3N5bWJvbDpcIiRcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJlc1wiLGEpfSkoKTsgXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIgXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCIgdHVoXCIsbWlsbGlvbjpcIiBtbG5cIixiaWxsaW9uOlwiIG1sZFwiLHRyaWxsaW9uOlwiIHRybFwifSxvcmRpbmFsOmZ1bmN0aW9uKCl7cmV0dXJuXCIuXCJ9LGN1cnJlbmN5OntzeW1ib2w6XCLigqxcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJldFwiLGEpfSkoKTsgXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIgXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJrXCIsbWlsbGlvbjpcIk1cIixiaWxsaW9uOlwiR1wiLHRyaWxsaW9uOlwiVFwifSxvcmRpbmFsOmZ1bmN0aW9uKCl7cmV0dXJuXCIuXCJ9LGN1cnJlbmN5OntzeW1ib2w6XCLigqxcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJmaVwiLGEpfSkoKTtcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIiBcIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcImtcIixtaWxsaW9uOlwiTVwiLGJpbGxpb246XCJHXCIsdHJpbGxpb246XCJUXCJ9LG9yZGluYWw6ZnVuY3Rpb24oYSl7cmV0dXJuIDE9PT1hP1wiZXJcIjpcImVcIn0sY3VycmVuY3k6e3N5bWJvbDpcIiRcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJmci1DQVwiLGEpfSkoKTsgXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCInXCIsZGVjaW1hbDpcIi5cIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJrXCIsbWlsbGlvbjpcIm1cIixiaWxsaW9uOlwiYlwiLHRyaWxsaW9uOlwidFwifSxvcmRpbmFsOmZ1bmN0aW9uKGEpe3JldHVybiAxPT09YT9cImVyXCI6XCJlXCJ9LGN1cnJlbmN5OntzeW1ib2w6XCJDSEZcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJmci1jaFwiLGEpfSkoKTsgXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIgXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJrXCIsbWlsbGlvbjpcIm1cIixiaWxsaW9uOlwiYlwiLHRyaWxsaW9uOlwidFwifSxvcmRpbmFsOmZ1bmN0aW9uKGEpe3JldHVybiAxPT09YT9cImVyXCI6XCJlXCJ9LGN1cnJlbmN5OntzeW1ib2w6XCLigqxcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJmclwiLGEpfSkoKTtcbiBcbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIgXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJFXCIsbWlsbGlvbjpcIk1cIixiaWxsaW9uOlwiTXJkXCIsdHJpbGxpb246XCJUXCJ9LG9yZGluYWw6ZnVuY3Rpb24oKXtyZXR1cm5cIi5cIn0sY3VycmVuY3k6e3N5bWJvbDpcIiBGdFwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcImh1XCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIi5cIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcIm1pbGFcIixtaWxsaW9uOlwibWlsXCIsYmlsbGlvbjpcImJcIix0cmlsbGlvbjpcInRcIn0sb3JkaW5hbDpmdW5jdGlvbigpe3JldHVyblwiwrpcIn0sY3VycmVuY3k6e3N5bWJvbDpcIuKCrFwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcIml0XCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIixcIixkZWNpbWFsOlwiLlwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcIuWNg1wiLG1pbGxpb246XCLnmb7kuIdcIixiaWxsaW9uOlwi5Y2B5YSEXCIsdHJpbGxpb246XCLlhYZcIn0sb3JkaW5hbDpmdW5jdGlvbigpe3JldHVyblwiLlwifSxjdXJyZW5jeTp7c3ltYm9sOlwiwqVcIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJqYVwiLGEpfSkoKTsgXG5cbihmdW5jdGlvbigpe3ZhciBhPXtkZWxpbWl0ZXJzOnt0aG91c2FuZHM6XCIuXCIsZGVjaW1hbDpcIixcIn0sYWJicmV2aWF0aW9uczp7dGhvdXNhbmQ6XCJrXCIsbWlsbGlvbjpcIm1sblwiLGJpbGxpb246XCJtcmRcIix0cmlsbGlvbjpcImJsblwifSxvcmRpbmFsOmZ1bmN0aW9uKGEpe3ZhciBiPWElMTAwO3JldHVybiAwIT09YSYmMT49Ynx8OD09PWJ8fGI+PTIwP1wic3RlXCI6XCJkZVwifSxjdXJyZW5jeTp7c3ltYm9sOlwi4oKsIFwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcIm5sLW5sXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIiBcIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcInR5cy5cIixtaWxsaW9uOlwibWxuXCIsYmlsbGlvbjpcIm1sZFwiLHRyaWxsaW9uOlwiYmxuXCJ9LG9yZGluYWw6ZnVuY3Rpb24oKXtyZXR1cm5cIi5cIn0sY3VycmVuY3k6e3N5bWJvbDpcIlBMTlwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcInBsXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIi5cIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcIm1pbFwiLG1pbGxpb246XCJtaWxow7Vlc1wiLGJpbGxpb246XCJiXCIsdHJpbGxpb246XCJ0XCJ9LG9yZGluYWw6ZnVuY3Rpb24oKXtyZXR1cm5cIsK6XCJ9LGN1cnJlbmN5OntzeW1ib2w6XCJSJFwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcInB0LWJyXCIsYSl9KSgpOyBcblxuKGZ1bmN0aW9uKCl7dmFyIGE9e2RlbGltaXRlcnM6e3Rob3VzYW5kczpcIiBcIixkZWNpbWFsOlwiLFwifSxhYmJyZXZpYXRpb25zOnt0aG91c2FuZDpcItGC0YvRgS5cIixtaWxsaW9uOlwi0LzQu9C9XCIsYmlsbGlvbjpcImJcIix0cmlsbGlvbjpcInRcIn0sb3JkaW5hbDpmdW5jdGlvbigpe3JldHVyblwiLlwifSxjdXJyZW5jeTp7c3ltYm9sOlwi0YDRg9CxLlwifX07XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmdGhpcy5udW1lcmFsJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UmJnRoaXMubnVtZXJhbC5sYW5ndWFnZShcInJ1XCIsYSl9KSgpO1xuXG4oZnVuY3Rpb24oKXt2YXIgYT17ZGVsaW1pdGVyczp7dGhvdXNhbmRzOlwiIFwiLGRlY2ltYWw6XCIsXCJ9LGFiYnJldmlhdGlvbnM6e3Rob3VzYW5kOlwidGlzLlwiLG1pbGxpb246XCJtaWwuXCIsYmlsbGlvbjpcImJcIix0cmlsbGlvbjpcInRcIn0sb3JkaW5hbDpmdW5jdGlvbigpe3JldHVyblwiLlwifSxjdXJyZW5jeTp7c3ltYm9sOlwi4oKsXCJ9fTtcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93JiZ0aGlzLm51bWVyYWwmJnRoaXMubnVtZXJhbC5sYW5ndWFnZSYmdGhpcy5udW1lcmFsLmxhbmd1YWdlKFwic2tcIixhKX0pKCk7IFxuXG4oZnVuY3Rpb24oKXt2YXIgYT17ZGVsaW1pdGVyczp7dGhvdXNhbmRzOlwiLFwiLGRlY2ltYWw6XCIuXCJ9LGFiYnJldmlhdGlvbnM6e3Rob3VzYW5kOlwi4Lie4Lix4LiZXCIsbWlsbGlvbjpcIuC4peC5ieC4suC4mVwiLGJpbGxpb246XCLguJ7guLHguJnguKXguYnguLLguJlcIix0cmlsbGlvbjpcIuC4peC5ieC4suC4meC4peC5ieC4suC4mVwifSxvcmRpbmFsOmZ1bmN0aW9uKCl7cmV0dXJuXCIuXCJ9LGN1cnJlbmN5OntzeW1ib2w6XCLguL9cIn19O1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJnRoaXMubnVtZXJhbCYmdGhpcy5udW1lcmFsLmxhbmd1YWdlJiZ0aGlzLm51bWVyYWwubGFuZ3VhZ2UoXCJ0aFwiLGEpfSkoKTsgXG4iLCIoZnVuY3Rpb24gKGZteCkge1xyXG4gICAgLy8gU3RvcmUuanNcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIHdpbiA9ICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKSxcclxuICAgICAgICBkb2MgPSB3aW4uZG9jdW1lbnQsXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZSA9ICdsb2NhbFN0b3JhZ2UnLFxyXG4gICAgICAgIHNjcmlwdFRhZyA9ICdzY3JpcHQnLFxyXG4gICAgICAgIHN0b3JhZ2VcclxuXHJcbiAgICBzdG9yZS5kaXNhYmxlZCA9IGZhbHNlXHJcbiAgICBzdG9yZS52ZXJzaW9uID0gJzEuMy4yMCdcclxuICAgIHN0b3JlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7IH1cclxuICAgIHN0b3JlLmdldCA9IGZ1bmN0aW9uIChrZXksIGRlZmF1bHRWYWwpIHsgfVxyXG4gICAgc3RvcmUuaGFzID0gZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gc3RvcmUuZ2V0KGtleSkgIT09IHVuZGVmaW5lZCB9XHJcbiAgICBzdG9yZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7IH1cclxuICAgIHN0b3JlLmNsZWFyID0gZnVuY3Rpb24gKCkgeyB9XHJcbiAgICBzdG9yZS50cmFuc2FjdCA9IGZ1bmN0aW9uIChrZXksIGRlZmF1bHRWYWwsIHRyYW5zYWN0aW9uRm4pIHtcclxuICAgICAgICBpZiAodHJhbnNhY3Rpb25GbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uRm4gPSBkZWZhdWx0VmFsXHJcbiAgICAgICAgICAgIGRlZmF1bHRWYWwgPSBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZWZhdWx0VmFsID09IG51bGwpIHtcclxuICAgICAgICAgICAgZGVmYXVsdFZhbCA9IHt9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB2YWwgPSBzdG9yZS5nZXQoa2V5LCBkZWZhdWx0VmFsKVxyXG4gICAgICAgIHRyYW5zYWN0aW9uRm4odmFsKVxyXG4gICAgICAgIHN0b3JlLnNldChrZXksIHZhbClcclxuICAgIH1cclxuICAgIHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmV0ID0ge31cclxuICAgICAgICBzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIHZhbCkge1xyXG4gICAgICAgICAgICByZXRba2V5XSA9IHZhbFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHJldFxyXG4gICAgfVxyXG4gICAgc3RvcmUuZm9yRWFjaCA9IGZ1bmN0aW9uICgpIHsgfVxyXG4gICAgc3RvcmUuc2VyaWFsaXplID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxyXG4gICAgfVxyXG4gICAgc3RvcmUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7IHJldHVybiB1bmRlZmluZWQgfVxyXG4gICAgICAgIHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHZhbHVlKSB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgcmV0dXJuIHZhbHVlIHx8IHVuZGVmaW5lZCB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRnVuY3Rpb25zIHRvIGVuY2Fwc3VsYXRlIHF1ZXN0aW9uYWJsZSBGaXJlRm94IDMuNi4xMyBiZWhhdmlvclxyXG4gICAgLy8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qcy9pc3N1ZXMjaXNzdWUvMTNcclxuICAgIGZ1bmN0aW9uIGlzTG9jYWxTdG9yYWdlTmFtZVN1cHBvcnRlZCgpIHtcclxuICAgICAgICB0cnkgeyByZXR1cm4gKGxvY2FsU3RvcmFnZU5hbWUgaW4gd2luICYmIHdpbltsb2NhbFN0b3JhZ2VOYW1lXSkgfVxyXG4gICAgICAgIGNhdGNoIChlcnIpIHsgcmV0dXJuIGZhbHNlIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNMb2NhbFN0b3JhZ2VOYW1lU3VwcG9ydGVkKCkpIHtcclxuICAgICAgICBzdG9yYWdlID0gd2luW2xvY2FsU3RvcmFnZU5hbWVdXHJcbiAgICAgICAgc3RvcmUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxyXG4gICAgICAgICAgICBzdG9yYWdlLnNldEl0ZW0oa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcclxuICAgICAgICAgICAgcmV0dXJuIHZhbFxyXG4gICAgICAgIH1cclxuICAgICAgICBzdG9yZS5nZXQgPSBmdW5jdGlvbiAoa2V5LCBkZWZhdWx0VmFsKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEl0ZW0oa2V5KSlcclxuICAgICAgICAgICAgcmV0dXJuICh2YWwgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWwgOiB2YWwpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHsgc3RvcmFnZS5yZW1vdmVJdGVtKGtleSkgfVxyXG4gICAgICAgIHN0b3JlLmNsZWFyID0gZnVuY3Rpb24gKCkgeyBzdG9yYWdlLmNsZWFyKCkgfVxyXG4gICAgICAgIHN0b3JlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdG9yYWdlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gc3RvcmFnZS5rZXkoaSlcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGtleSwgc3RvcmUuZ2V0KGtleSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGRvYyAmJiBkb2MuZG9jdW1lbnRFbGVtZW50LmFkZEJlaGF2aW9yKSB7XHJcbiAgICAgICAgdmFyIHN0b3JhZ2VPd25lcixcclxuICAgICAgICAgICAgc3RvcmFnZUNvbnRhaW5lclxyXG4gICAgICAgIC8vIFNpbmNlICN1c2VyRGF0YSBzdG9yYWdlIGFwcGxpZXMgb25seSB0byBzcGVjaWZpYyBwYXRocywgd2UgbmVlZCB0b1xyXG4gICAgICAgIC8vIHNvbWVob3cgbGluayBvdXIgZGF0YSB0byBhIHNwZWNpZmljIHBhdGguICBXZSBjaG9vc2UgL2Zhdmljb24uaWNvXHJcbiAgICAgICAgLy8gYXMgYSBwcmV0dHkgc2FmZSBvcHRpb24sIHNpbmNlIGFsbCBicm93c2VycyBhbHJlYWR5IG1ha2UgYSByZXF1ZXN0IHRvXHJcbiAgICAgICAgLy8gdGhpcyBVUkwgYW55d2F5IGFuZCBiZWluZyBhIDQwNCB3aWxsIG5vdCBodXJ0IHVzIGhlcmUuICBXZSB3cmFwIGFuXHJcbiAgICAgICAgLy8gaWZyYW1lIHBvaW50aW5nIHRvIHRoZSBmYXZpY29uIGluIGFuIEFjdGl2ZVhPYmplY3QoaHRtbGZpbGUpIG9iamVjdFxyXG4gICAgICAgIC8vIChzZWU6IGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9hYTc1MjU3NCh2PVZTLjg1KS5hc3B4KVxyXG4gICAgICAgIC8vIHNpbmNlIHRoZSBpZnJhbWUgYWNjZXNzIHJ1bGVzIGFwcGVhciB0byBhbGxvdyBkaXJlY3QgYWNjZXNzIGFuZFxyXG4gICAgICAgIC8vIG1hbmlwdWxhdGlvbiBvZiB0aGUgZG9jdW1lbnQgZWxlbWVudCwgZXZlbiBmb3IgYSA0MDQgcGFnZS4gIFRoaXNcclxuICAgICAgICAvLyBkb2N1bWVudCBjYW4gYmUgdXNlZCBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IGRvY3VtZW50ICh3aGljaCB3b3VsZFxyXG4gICAgICAgIC8vIGhhdmUgYmVlbiBsaW1pdGVkIHRvIHRoZSBjdXJyZW50IHBhdGgpIHRvIHBlcmZvcm0gI3VzZXJEYXRhIHN0b3JhZ2UuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgc3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXHJcbiAgICAgICAgICAgIHN0b3JhZ2VDb250YWluZXIub3BlbigpXHJcbiAgICAgICAgICAgIHN0b3JhZ2VDb250YWluZXIud3JpdGUoJzwnICsgc2NyaXB0VGFnICsgJz5kb2N1bWVudC53PXdpbmRvdzwvJyArIHNjcmlwdFRhZyArICc+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxyXG4gICAgICAgICAgICBzdG9yYWdlQ29udGFpbmVyLmNsb3NlKClcclxuICAgICAgICAgICAgc3RvcmFnZU93bmVyID0gc3RvcmFnZUNvbnRhaW5lci53LmZyYW1lc1swXS5kb2N1bWVudFxyXG4gICAgICAgICAgICBzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXHJcbiAgICAgICAgICAgIC8vIHNlY3VyaXR5IHNldHRpbmdzIG9yIG90aGVyd3NlKSwgZmFsbCBiYWNrIHRvIHBlci1wYXRoIHN0b3JhZ2VcclxuICAgICAgICAgICAgc3RvcmFnZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICAgICAgICBzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgd2l0aElFU3RvcmFnZSA9IGZ1bmN0aW9uIChzdG9yZUZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcclxuICAgICAgICAgICAgICAgIGFyZ3MudW5zaGlmdChzdG9yYWdlKVxyXG4gICAgICAgICAgICAgICAgLy8gU2VlIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTA4MSh2PVZTLjg1KS5hc3B4XHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxNDI0KHY9VlMuODUpLmFzcHhcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2VPd25lci5hcHBlbmRDaGlsZChzdG9yYWdlKVxyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5hZGRCZWhhdmlvcignI2RlZmF1bHQjdXNlckRhdGEnKVxyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5sb2FkKGxvY2FsU3RvcmFnZU5hbWUpXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gc3RvcmVGdW5jdGlvbi5hcHBseShzdG9yZSwgYXJncylcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2VPd25lci5yZW1vdmVDaGlsZChzdG9yYWdlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJbiBJRTcsIGtleXMgY2Fubm90IHN0YXJ0IHdpdGggYSBkaWdpdCBvciBjb250YWluIGNlcnRhaW4gY2hhcnMuXHJcbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXHJcbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzgzXHJcbiAgICAgICAgdmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxyXG4gICAgICAgIHZhciBpZUtleUZpeCA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleS5yZXBsYWNlKC9eZC8sICdfX18kJicpLnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24gKHN0b3JhZ2UsIGtleSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGllS2V5Rml4KGtleSlcclxuICAgICAgICAgICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2V0QXR0cmlidXRlKGtleSwgc3RvcmUuc2VyaWFsaXplKHZhbCkpXHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxyXG4gICAgICAgICAgICByZXR1cm4gdmFsXHJcbiAgICAgICAgfSlcclxuICAgICAgICBzdG9yZS5nZXQgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uIChzdG9yYWdlLCBrZXksIGRlZmF1bHRWYWwpIHtcclxuICAgICAgICAgICAga2V5ID0gaWVLZXlGaXgoa2V5KVxyXG4gICAgICAgICAgICB2YXIgdmFsID0gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoa2V5KSlcclxuICAgICAgICAgICAgcmV0dXJuICh2YWwgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWwgOiB2YWwpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBzdG9yZS5yZW1vdmUgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uIChzdG9yYWdlLCBrZXkpIHtcclxuICAgICAgICAgICAga2V5ID0gaWVLZXlGaXgoa2V5KVxyXG4gICAgICAgICAgICBzdG9yYWdlLnJlbW92ZUF0dHJpYnV0ZShrZXkpXHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgc3RvcmUuY2xlYXIgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uIChzdG9yYWdlKSB7XHJcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVzID0gc3RvcmFnZS5YTUxEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXR0cmlidXRlc1xyXG4gICAgICAgICAgICBzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGF0dHJpYnV0ZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZXNbaV0ubmFtZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHN0b3JlLmZvckVhY2ggPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uIChzdG9yYWdlLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlcyA9IHN0b3JhZ2UuWE1MRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmF0dHJpYnV0ZXNcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGF0dHI7IGF0dHIgPSBhdHRyaWJ1dGVzW2ldOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGF0dHIubmFtZSwgc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoYXR0ci5uYW1lKSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHRlc3RLZXkgPSAnX19zdG9yZWpzX18nXHJcbiAgICAgICAgc3RvcmUuc2V0KHRlc3RLZXksIHRlc3RLZXkpXHJcbiAgICAgICAgaWYgKHN0b3JlLmdldCh0ZXN0S2V5KSAhPSB0ZXN0S2V5KSB7IHN0b3JlLmRpc2FibGVkID0gdHJ1ZSB9XHJcbiAgICAgICAgc3RvcmUucmVtb3ZlKHRlc3RLZXkpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgc3RvcmUuZGlzYWJsZWQgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBzdG9yZS5lbmFibGVkID0gIXN0b3JlLmRpc2FibGVkXHJcblxyXG4gICAgZm14LnN0b3JlID0gc3RvcmU7XHJcbn0pKGZteCk7IiwiO1xyXG4oZnVuY3Rpb24oJCwgZm14KSB7XHJcblx0LyoqICoqKioqKioqdGV4dCBib3gqKioqKioqKioqICovXHJcblx0JC5leHRlbmQoJC5mbi50ZXh0Ym94LmRlZmF1bHRzLCB7XHJcblx0XHR2YWxpZGF0ZU9uQ3JlYXRlIDogZmFsc2UsXHJcblx0XHR0cmltVmFsdWUgOiB0cnVlXHJcblx0fSk7XHJcblx0JC5leHRlbmQoJC5mbi50ZXh0Ym94Lm1ldGhvZHMsIHtcclxuXHRcdF9zZXRUZXh0IDogJC5mbi50ZXh0Ym94Lm1ldGhvZHMuc2V0VGV4dCxcclxuXHRcdHNldFRleHQgOiBmdW5jdGlvbihqcSwgdmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIG9wdHMgPSAkKHRoaXMpLnRleHRib3goJ29wdGlvbnMnKTtcclxuXHRcdFx0XHR2YXIgaW5wdXQgPSAkKHRoaXMpLnRleHRib3goJ3RleHRib3gnKTtcclxuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlID09IHVuZGVmaW5lZCA/ICcnIDogU3RyaW5nKHZhbHVlKTtcclxuXHJcblx0XHRcdFx0aWYgKCQodGhpcykudGV4dGJveCgnZ2V0VGV4dCcpICE9IHZhbHVlKSB7XHJcblx0XHRcdFx0XHRpbnB1dC52YWwodmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRvcHRzLnZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0aWYgKCFpbnB1dC5pcygnOmZvY3VzJykpIHtcclxuXHRcdFx0XHRcdGlmICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpbnB1dC5yZW1vdmVDbGFzcygndGV4dGJveC1wcm9tcHQnKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlucHV0LnZhbChvcHRzLnByb21wdCkuYWRkQ2xhc3MoJ3RleHRib3gtcHJvbXB0Jyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIOacieWAvOeahOaXtuWAmeaJjeaJp+ihjOagoemqjFxyXG5cdFx0XHRcdGlmICh2YWx1ZSlcclxuXHRcdFx0XHRcdCQodGhpcykudGV4dGJveCgndmFsaWRhdGUnKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cdFx0X3NldFZhbHVlIDogJC5mbi50ZXh0Ym94Lm1ldGhvZHMuc2V0VmFsdWUsXHJcblx0XHRzZXRWYWx1ZSA6IGZ1bmN0aW9uKGpxLCB2YWx1ZSkge1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgJGpxID0gJCh0aGlzKTtcclxuXHRcdFx0XHR2YXIgc3RhdGUgPSAkanEuZGF0YShcInRleHRib3hcIik7XHJcblx0XHRcdFx0aWYodmFsdWUgJiYgJC5pc0Z1bmN0aW9uKHZhbHVlLnRyaW0pICYmIHN0YXRlICYmIHN0YXRlLm9wdGlvbnMudHJpbVZhbHVlKXtcclxuXHRcdFx0XHRcdHZhbHVlID0gdmFsdWUudHJpbSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQkanEudGV4dGJveChcIl9zZXRWYWx1ZVwiLHZhbHVlKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn0pKGpRdWVyeSwgZm14KTsiLCI7KGZ1bmN0aW9uKCQpe1xyXG5cdHZhciBfcGFyc2VPcHRzID0gJC5mbi52YWxpZGF0ZWJveC5wYXJzZU9wdGlvbnMsXHJcblx0ICAgIF92YWxpZGF0ZWJveCA9ICQuZm4udmFsaWRhdGVib3gsXHJcblx0ICAgIF9mb2N1c0V2ZW50SGFuZGxlciA9ICQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMuZXZlbnRzLmZvY3VzLFxyXG5cdCAgICBfYmx1ckV2ZW50SGFuZGxlciA9ICQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMuZXZlbnRzLmJsdXI7XHJcblx0XHJcblx0JC5mbi52YWxpZGF0ZWJveC5wYXJzZU9wdGlvbnMgPSBmdW5jdGlvbih0YXJnZXQpIHtcclxuXHRcdHZhciBvcHRzID0gX3BhcnNlT3B0cyh0YXJnZXQpO1xyXG5cdFx0dmFyIGNsc05hbWUgPSB0YXJnZXQuZ2V0QXR0cmlidXRlKCd2YWxpZGF0ZUNsYXNzTmFtZScpO1xyXG5cdFx0aWYoY2xzTmFtZSkge1xyXG5cdFx0XHRvcHRzLnZhbGlkYXRlQ2xhc3NOYW1lID0gY2xzTmFtZTtcclxuXHRcdH1cclxuXHRcdGlmKCFvcHRzLm1heExlbmd0aCl7XHJcblx0XHRcdG9wdHMubWF4TGVuZ3RoID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgnbWF4bGVuZ3RoJyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3B0cztcdFx0XHJcblx0fVxyXG5cdCQuZXh0ZW5kKCQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMse1xyXG5cdFx0Ly/pu5jorqTnmoTnsbvlkI1cclxuXHRcdHZhbGlkYXRlQ2xhc3NOYW1lIDogJ2ZteC12YWxpZGF0ZS1yZXF1aXJlZCcsXHJcblx0XHR2YWxpZGF0ZU9uQ3JlYXRlIDogZmFsc2UsXHJcblx0XHR2YWxpZGF0ZVVzZVRleHRib3hWYWx1ZTp0cnVlLFxyXG5cdFx0dmFsIDogZnVuY3Rpb24odGFyZ2V0KSB7XHJcblx0XHRcdHZhciAkZWwgPSAkKHRhcmdldCksb3B0cyA9ICRlbC5kYXRhKCd2YWxpZGF0ZWJveCcpLm9wdGlvbnM7XHJcblx0XHRcdGlmKG9wdHMgJiYgb3B0cy52YWxpZGF0ZVVzZVRleHRib3hWYWx1ZSl7XHJcblx0XHRcdFx0dmFyICRuZXh0ID0gJGVsLm5leHQoKTtcclxuXHRcdFx0XHRpZigkbmV4dC5oYXNDbGFzcyhcInRleHRib3gtdmFsdWVcIikpe1xyXG5cdFx0XHRcdFx0cmV0dXJuICRuZXh0LnZhbCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gJGVsLnZhbCgpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cdC8v5L+u5pS56buY6K6k54Sm54K55LqL5Lu2LOWmguaenOaOp+S7tuayoeaciei+k+WFpSzliJnkuI3ov5vooYzmoKHpqoxcclxuXHQkLmZuLnZhbGlkYXRlYm94LmRlZmF1bHRzLmV2ZW50cy5mb2N1cyA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdHZhciB0YXJnZXQgPSBlLmRhdGEudGFyZ2V0O1xyXG5cdFx0dmFyIHN0YXRlID0gJC5kYXRhKHRhcmdldCwgJ3ZhbGlkYXRlYm94Jyk7XHJcblx0XHR2YXIgb3B0cyA9IHN0YXRlLm9wdGlvbnM7XHJcblx0XHR2YXIgdmFsID0gb3B0cy52YWwodGFyZ2V0KTtcclxuXHRcdGlmKCFzdGF0ZS5tZXNzYWdlICYmICh2YWwgPT0gbnVsbCB8fCB2YWwgPT0gdW5kZWZpbmVkIHx8IHZhbCA9PSAnJykpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gX2ZvY3VzRXZlbnRIYW5kbGVyKGUpO1xyXG5cdH1cclxuXHQkLmZuLnZhbGlkYXRlYm94LmRlZmF1bHRzLmV2ZW50cy5ibHVyID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0dmFyIHRhcmdldCA9IGUuZGF0YS50YXJnZXQ7XHJcblx0XHR2YXIgc3RhdGUgPSAkLmRhdGEodGFyZ2V0LCAndmFsaWRhdGVib3gnKTtcclxuXHRcdHZhciBvcHRzID0gc3RhdGUub3B0aW9ucztcclxuXHRcdHZhciB2YWwgPSBvcHRzLnZhbCh0YXJnZXQpO1xyXG5cdFx0aWYoIXN0YXRlLm1lc3NhZ2UgJiYgKHZhbCA9PSBudWxsIHx8IHZhbCA9PSB1bmRlZmluZWQgfHwgdmFsID09ICcnKSl7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cdFx0XHJcblx0XHRyZXR1cm4gX2JsdXJFdmVudEhhbmRsZXIoZSk7XHJcblx0fVxyXG5cdCQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMucnVsZXMubWluTGVuZ3RoID0ge1xyXG5cdFx0XHR2YWxpZGF0b3I6IGZ1bmN0aW9uKHZhbHVlLCBwYXJhbSl7XHJcblx0XHRcdFx0dmFyIGxlbiA9ICQudHJpbSh2YWx1ZSkubGVuZ3RoO1xyXG5cdFx0XHRcdHJldHVybiBsZW4gPj0gcGFyYW1bMF07XHJcblx0XHRcdH0sXHJcblx0XHRcdG1lc3NhZ2U6ICdQbGVhc2UgZW50ZXIgYSB2YWx1ZSBhIGxlYXN0IHswfS4nXHRcdFx0XHJcblx0fVxyXG5cdFxyXG5cdCQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMucnVsZXMubWF4TGVuZ3RoID0ge1xyXG5cdFx0XHR2YWxpZGF0b3I6IGZ1bmN0aW9uKHZhbHVlLCBwYXJhbSl7XHJcblx0XHRcdFx0dmFyIGxlbiA9ICQudHJpbSh2YWx1ZSkubGVuZ3RoO1xyXG5cdFx0XHRcdHJldHVybiBsZW4gPD0gcGFyYW1bMF07XHJcblx0XHRcdH0sXHJcblx0XHRcdG1lc3NhZ2U6ICdQbGVhc2UgZW50ZXIgYSB2YWx1ZSBhIGxlc3MgdGhhbiB7MH0uJ1x0XHRcdFxyXG5cdH1cdFxyXG5cdFxyXG5cdCQuZm4udmFsaWRhdGVib3ggPSBmdW5jdGlvbihvcHRpb25zLCBwYXJhbSkge1xyXG5cdFx0aWYodHlwZW9mIG9wdGlvbnMgPT0gJ3N0cmluZycpe1xyXG5cdFx0XHRyZXR1cm4gX3ZhbGlkYXRlYm94LmNhbGwodGhpcyxvcHRpb25zLHBhcmFtKTtcclxuXHRcdH1cclxuXHRcdHZhciB2YWwgPSBfdmFsaWRhdGVib3guY2FsbCh0aGlzLG9wdGlvbnMscGFyYW0pO1xyXG5cdFx0dGhpcy5lYWNoKGZ1bmN0aW9uKCl7XHJcblx0XHRcdHZhciBvcHRzID0gJC5kYXRhKHRoaXMsICd2YWxpZGF0ZWJveCcpLm9wdGlvbnMsJGpxID0gJCh0aGlzKTtcclxuXHRcdFx0aWYob3B0cy52YWxpZGF0ZUNsYXNzTmFtZSAmJiAhJGpxLmhhc0NsYXNzKG9wdHMudmFsaWRhdGVDbGFzc05hbWUpICYmIG9wdHMucmVxdWlyZWQpe1xyXG5cdFx0XHRcdCRqcS5hZGRDbGFzcyhvcHRzLnZhbGlkYXRlQ2xhc3NOYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZihvcHRzLm1heExlbmd0aCl7XHJcblx0XHRcdFx0dmFyIG1heExlblZ0ID0gJ21heExlbmd0aFsnK29wdHMubWF4TGVuZ3RoKyddJztcclxuXHRcdFx0XHR2YXIgdmFsaWRUeXBlID0gb3B0cy52YWxpZFR5cGU7XHJcblx0XHRcdFx0aWYoJC5pc0FycmF5KHZhbGlkVHlwZSkpe1xyXG5cdFx0XHRcdFx0dmFsaWRUeXBlLnB1c2gobWF4TGVuVnQpO1xyXG5cdFx0XHRcdH1lbHNlIGlmKHR5cGVvZiB2YWxpZFR5cGUgPT0gJ3N0cmluZycpe1xyXG5cdFx0XHRcdFx0b3B0cy52YWxpZFR5cGUgPSBbdmFsaWRUeXBlLG1heExlblZ0XVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0b3B0cy52YWxpZFR5cGUgPSBtYXhMZW5WdDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gdmFsO1xyXG5cdH1cclxuXHQkLmV4dGVuZCgkLmZuLnZhbGlkYXRlYm94LF92YWxpZGF0ZWJveCk7XHJcbn0pKGpRdWVyeSk7IiwiOyhmdW5jdGlvbiAoJCwgZm14KSB7XHJcbiAgICAvKiogKioqKioqKiogY29tYm8gKioqKioqKioqICovXHJcblx0dmFyIF9jb21ibyA9ICQuZm4uY29tYm87XHJcblx0JC5mbi5jb21ibyA9IGZ1bmN0aW9uKG9wdGlvbnMscGFyYW1zKSB7XHJcblx0XHRpZih0eXBlb2Ygb3B0aW9ucyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gX2NvbWJvLmFwcGx5KHRoaXMsW29wdGlvbnMscGFyYW1zXSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgJHRoYXQgPSAkKHRoaXMpO1xyXG5cdFx0XHRfY29tYm8uY2FsbCgkdGhhdCxvcHRpb25zKTtcclxuXHRcdFx0dmFyIHN0YXRlID0gJC5kYXRhKHRoaXMsXCJjb21ib1wiKTtcclxuXHRcdFx0dmFyIHBhbmVsU3RhdGUgPSBzdGF0ZS5wYW5lbC5kYXRhKFwicGFuZWxcIik7XHJcblx0XHRcdHZhciBfb25DbG9zZUZuID0gcGFuZWxTdGF0ZS5vcHRpb25zLm9uQ2xvc2U7XHJcblx0XHRcdHBhbmVsU3RhdGUub3B0aW9ucy5vbkNsb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYoX29uQ2xvc2VGbikgX29uQ2xvc2VGbi5jYWxsKHRoaXMpO1xyXG5cdFx0XHRcdGRvVmFsaWRhdGVJbnB1dFRleHQoJHRoYXQpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblx0JC5leHRlbmQoJC5mbi5jb21ibyxfY29tYm8pO1xyXG5cdFxyXG4gICAgJC5mbi5jb21iby5fcGFyc2VPcHRpb25zID0gJC5mbi5jb21iby5wYXJzZU9wdGlvbnM7XHJcbiAgICAvLyBmaXggYnVnIGluIGVhc3l1aS0xLjIuNCwgYXR0ciAnbXVsdGlwbGUnIHZhbHVlIGlzICdtdWx0aXBsZScsIG5vdCAndHJ1ZSdcclxuICAgICQuZm4uY29tYm8ucGFyc2VPcHRpb25zID0gZnVuY3Rpb24gKHRhcmdldCkge1xyXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5mbi5jb21iby5fcGFyc2VPcHRpb25zKHRhcmdldCk7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRhcmdldCk7XHJcbiAgICAgICAgdmFyIHRlbXAgPSB0LmF0dHIoXCJtdWx0aXBsZVwiKTtcclxuICAgICAgICBpZigodGVtcCA/ICh0ZW1wID09IFwidHJ1ZVwiIHx8IHRlbXAgPT0gdHJ1ZSB8fCB0ZW1wID09IFwibXVsdGlwbGVcIik6IHVuZGVmaW5lZCkpe1xyXG4gICAgICAgIFx0b3B0aW9uc1snbXVsdGlwbGUnXSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRlbXAgPSB0LmF0dHIoJ2xpbWl0VG9MaXN0Jyk7XHJcbiAgICAgICAgaWYodGVtcCkge1xyXG4gICAgICAgIFx0b3B0aW9uc1snbGltaXRUb0xpc3QnXSA9IHRlbXAgPT0gJ3RydWUnIHx8IHRlbXAgPT0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgICB9O1xyXG4gICAgZnVuY3Rpb24gZG9WYWxpZGF0ZUlucHV0VGV4dCgkdGFyZ2V0KSB7XHJcbiAgICBcdHZhciBjb21ib1N0YXRlID0gJHRhcmdldC5kYXRhKFwiY29tYm9cIik7XHJcbiAgICBcdGlmKCFjb21ib1N0YXRlLmRvVmFsaWRhdGluZyAmJiBjb21ib1N0YXRlLm9wdGlvbnMubGltaXRUb0xpc3QgJiYgY29tYm9TdGF0ZS5vcHRpb25zLmtleUhhbmRsZXIuZW50ZXIpe1xyXG4gICAgXHRcdGNvbWJvU3RhdGUuZG9WYWxpZGF0aW5nID0gdHJ1ZVxyXG4gICAgXHRcdGNvbWJvU3RhdGUub3B0aW9ucy5rZXlIYW5kbGVyLmVudGVyLmNhbGwoJHRhcmdldFswXSk7XHJcbiAgICBcdFx0Y29tYm9TdGF0ZS5kb1ZhbGlkYXRpbmcgPSBmYWxzZTtcclxuICAgIFx0fVxyXG4gICAgXHR2YXIgY29tYm9HcmlkU3RhdGUgPSAkdGFyZ2V0LmRhdGEoXCJjb21ib2dyaWRcIik7XHJcbiAgICBcdGlmKGNvbWJvR3JpZFN0YXRlKXtcclxuXHRcdFx0dmFyIG9wdHMgPSBjb21ib0dyaWRTdGF0ZS5ncmlkLmRhdGEoXCJkYXRhZ3JpZFwiKS5vcHRpb25zO1xyXG5cdFx0XHRpZihvcHRzLnF1ZXJ5UGFyYW1zICYmIG9wdHMucXVlcnlQYXJhbXMucSl7XHJcblx0XHRcdFx0b3B0cy5xdWVyeVBhcmFtcy5xPXVuZGVmaW5lZDtcclxuXHRcdFx0fVxyXG4gICAgXHR9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRDb21ib1ZhbHVlcyh0YXJnZXQpIHtcclxuICAgICAgICB2YXIgc3RhdGUgPSAkLmRhdGEodGFyZ2V0LCAnY29tYm8nKTtcclxuICAgICAgICBpZighc3RhdGUpIHJldHVybiAoJCh0YXJnZXQpLnZhbCgpIHx8ICcnKS5zcGxpdChvcHRzLnNlcGFyYXRvcik7XHJcbiAgICAgICAgdmFyIG9wdHMgPSBzdGF0ZS5vcHRpb25zO1xyXG4gICAgICAgIHZhciBjb21ibyA9IHN0YXRlLmNvbWJvO1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBjb21iby5maW5kKCcudGV4dGJveC12YWx1ZScpLnZhbCgpO1xyXG4gICAgICAgIGlmKHZhbHVlcyl7XHJcbiAgICAgICAgXHR2YWx1ZXMgPSB2YWx1ZXMuc3BsaXQob3B0cy5zZXBhcmF0b3IpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgIFx0dmFsdWVzID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvcHRzID0gc3RhdGUub3B0aW9ucztcclxuICAgICAgICB2YXIgY2JiID0gJC5kYXRhKHRhcmdldCwnY29tYm9ib3gnKTtcclxuICAgICAgICBpZihjYmIgJiYgY2JiLm9wdGlvbnMuZW1wdHlJdGVtRW5hYmxlICYmIHZhbHVlcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgXHRyZXR1cm4gW2NiYi5vcHRpb25zLmVtcHR5SXRlbVZhbHVlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHNldENvbWJvVmFsdWVzKHRhcmdldCwgdmFsdWVzKSB7XHJcbiAgICAgICAgdmFyIHN0YXRlID0gJC5kYXRhKHRhcmdldCwgJ2NvbWJvJyk7XHJcbiAgICAgICAgaWYoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBlbCA9ICQodGFyZ2V0KTtcclxuICAgICAgICAgICAgdmFyIHZhbCA9ICh2YWx1ZXMgJiYgJC5pc0FycmF5KHZhbHVlcykpID8gdmFsdWVzLmpvaW4oJywnKSA6IHZhbHVlcztcclxuICAgICAgICAgICAgZWwudmFsKHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG9wdHMgPSBzdGF0ZS5vcHRpb25zO1xyXG4gICAgICAgIHZhciBjb21ibyA9IHN0YXRlLmNvbWJvO1xyXG4gICAgICAgIGlmICghJC5pc0FycmF5KHZhbHVlcykpIHsgXHJcbiAgICAgICAgXHR2YWx1ZXMgPSAodHlwZW9mIHZhbHVlcyA9PSAnc3RyaW5nJykgPyB2YWx1ZXMuc3BsaXQob3B0cy5zZXBhcmF0b3IpIDogW3ZhbHVlc107IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG9sZFZhbHVlcyA9IGdldENvbWJvVmFsdWVzKHRhcmdldCk7XHJcbiAgICAgICAgY29tYm8uZmluZCgnLnRleHRib3gtdmFsdWUnKS5yZW1vdmUoKTtcclxuICAgICAgICB2YXIgbmFtZSA9ICQodGFyZ2V0KS5hdHRyKCd0ZXh0Ym94TmFtZScpIHx8ICcnO1xyXG4gICAgICAgIHZhciBpbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgY2xhc3M9XCJ0ZXh0Ym94LXZhbHVlXCI+JykuYXBwZW5kVG8oY29tYm8pO1xyXG4gICAgICAgIGlucHV0LmF0dHIoJ25hbWUnLCBuYW1lKTtcclxuICAgICAgICBpZiAob3B0cy5kaXNhYmxlZCkge1xyXG4gICAgICAgICAgICBpbnB1dC5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbnB1dC52YWwodmFsdWVzLmpvaW4ob3B0cy5zZXBhcmF0b3IpKTtcclxuXHJcbiAgICAgICAgdmFyIGNoYW5nZWQgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAob2xkVmFsdWVzLmxlbmd0aCAhPSB2YWx1ZXMubGVuZ3RoKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgICAgIHZhciBhMSA9ICQuZXh0ZW5kKHRydWUsIFtdLCBvbGRWYWx1ZXMpO1xyXG4gICAgICAgICAgICB2YXIgYTIgPSAkLmV4dGVuZCh0cnVlLCBbXSwgdmFsdWVzKTtcclxuICAgICAgICAgICAgYTEuc29ydCgpO1xyXG4gICAgICAgICAgICBhMi5zb3J0KCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYTEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChhMVtpXSAhPSBhMltpXSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KSgpO1xyXG5cclxuICAgICAgICBpZiAoY2hhbmdlZCkge1xyXG4gICAgICAgICAgICBpZiAob3B0cy5tdWx0aXBsZSkge1xyXG4gICAgICAgICAgICAgICAgb3B0cy5vbkNoYW5nZS5jYWxsKHRhcmdldCwgdmFsdWVzLCBvbGRWYWx1ZXMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3B0cy5vbkNoYW5nZS5jYWxsKHRhcmdldCwgdmFsdWVzWzBdLCBvbGRWYWx1ZXNbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQodGFyZ2V0KS5jbG9zZXN0KCdmb3JtJykudHJpZ2dlcignX2NoYW5nZScsIFt0YXJnZXRdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKiBcclxuICAgICAqIFRoZSBrZXkgZXZlbnQgaGFuZGxlciBvbiBpbnB1dCBib3hcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaW5wdXRFdmVudEhhbmRsZXIoZSl7XHJcbiAgICAgIGlmIChlLmN0cmxLZXkpIHtcclxuICAgIFx0ICByZXR1cm4gX2RlZmF1bHRJbnB1dEV2ZW50KGUpO1xyXG4gICAgICB9ICAgICAgXHJcbiAgICAgIHZhciB0YXJnZXQgPSBlLmRhdGEudGFyZ2V0O1xyXG4gICAgICB2YXIgdCA9ICQodGFyZ2V0KTtcclxuICAgICAgdmFyIHN0YXRlID0gdC5kYXRhKCdjb21ibycpO1xyXG4gICAgICB2YXIgb3B0cyA9IHQuY29tYm8oJ29wdGlvbnMnKTtcclxuICAgICAgc3RhdGUucGFuZWwucGFuZWwoJ29wdGlvbnMnKS5jb21ib1RhcmdldCA9IHRhcmdldDtcclxuICAgICAgXHJcbiAgICAgIHN3aXRjaChlLmtleUNvZGUpe1xyXG4gICAgICBjYXNlIDM4OiAgLy8gdXBcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdC5jb21ibygnc2hvd1BhbmVsJyk7XHJcbiAgICAgICAgb3B0cy5rZXlIYW5kbGVyLnVwLmNhbGwodGFyZ2V0LCBlKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSA0MDogIC8vIGRvd25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdC5jb21ibygnc2hvd1BhbmVsJyk7ICAgICAgICBcclxuICAgICAgICBvcHRzLmtleUhhbmRsZXIuZG93bi5jYWxsKHRhcmdldCwgZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgMzc6ICAvLyBsZWZ0XHJcbiAgICAgICAgb3B0cy5rZXlIYW5kbGVyLmxlZnQuY2FsbCh0YXJnZXQsIGUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDM5OiAgLy8gcmlnaHRcclxuICAgICAgICBvcHRzLmtleUhhbmRsZXIucmlnaHQuY2FsbCh0YXJnZXQsIGUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDEzOiAgLy8gZW50ZXJcclxuICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBvcHRzLmtleUhhbmRsZXIuZW50ZXIuY2FsbCh0YXJnZXQsIGUpO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgICByZXR1cm4gX2RlZmF1bHRJbnB1dEV2ZW50KGUpO1xyXG4gICAgICAgIC8vcmV0dXJuIGZhbHNlO1xyXG4vLyAgICAgIGNhc2UgOTogICAvLyB0YWJcclxuLy8gICAgICBjYXNlIDI3OiAgLy8gZXNjXHJcbi8vICAgICAgICB0LmNvbWJvKCdoaWRlUGFuZWwnKTtcclxuLy8gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgX2RlZmF1bHRJbnB1dEV2ZW50ID0gJC5mbi5jb21iby5kZWZhdWx0cy5pbnB1dEV2ZW50cy5rZXlkb3duO1xyXG4gICAgJC5mbi5jb21iby5kZWZhdWx0cy5pbnB1dEV2ZW50cy5rZXlkb3duID0gaW5wdXRFdmVudEhhbmRsZXI7XHJcbiAgICAkLmZuLmNvbWJvYm94LmRlZmF1bHRzLmlucHV0RXZlbnRzLmtleWRvd24gPSBpbnB1dEV2ZW50SGFuZGxlcjtcclxuICAgICQuZm4uY29tYm9ncmlkLmRlZmF1bHRzLmlucHV0RXZlbnRzLmtleWRvd24gPSBpbnB1dEV2ZW50SGFuZGxlcjtcclxuICAgIFxyXG4gICAgJC5leHRlbmQoJC5mbi5jb21iby5tZXRob2RzLCB7XHJcbiAgICAgICAgX2dldFZhbHVlOiAkLmZuLmNvbWJvLm1ldGhvZHMuZ2V0VmFsdWUsXHJcblxyXG4gICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgdmFyICRjb21ibyA9ICQoanFbMF0pO1xyXG4gICAgICAgICAgICByZXR1cm4gJGNvbWJvLmNvbWJvKFwiZ2V0VmFsdWVzXCIpLmpvaW4oXCIsXCIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0VmFsdWU6IGZ1bmN0aW9uIChqcSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmNvbWJvKFwic2V0VmFsdWVzXCIsICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSA/ICcnIDogdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0VmFsdWVzOiBmdW5jdGlvbiAoanEsIHZhbHVlcykge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRDb21ib1ZhbHVlcyh0aGlzLCB2YWx1ZXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldFZhbHVlczogZnVuY3Rpb24gKGpxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRDb21ib1ZhbHVlcyhqcVswXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSwgZm14KTsiLCI7XHJcbihmdW5jdGlvbigkLCBmbXgpIHtcclxuLy8gIFxyXG4vLyAgdmFyIG5vZGVJbmRleCA9IDE7XHJcbi8vICB2YXIgZGVmYXVsdFZpZXcgPSB7XHJcbi8vICAgICAgcmVuZGVyOiBmdW5jdGlvbih0YXJnZXQsIHVsLCBkYXRhKSB7XHJcbi8vICAgICAgICB2YXIgc3RhdGUgPSAkLmRhdGEodGFyZ2V0LCAndHJlZScpO1xyXG4vLyAgICAgICAgdmFyIG9wdHMgPSBzdGF0ZS5vcHRpb25zO1xyXG4vLyAgICAgICAgdmFyIHBub2RlID0gJCh1bCkucHJldignLnRyZWUtbm9kZScpO1xyXG4vLyAgICAgICAgdmFyIHBkYXRhID0gcG5vZGUubGVuZ3RoID8gJCh0YXJnZXQpLnRyZWUoJ2dldE5vZGUnLCBwbm9kZVswXSkgOiBudWxsO1xyXG4vLyAgICAgICAgdmFyIGRlcHRoID0gcG5vZGUuZmluZCgnc3Bhbi50cmVlLWluZGVudCwgc3Bhbi50cmVlLWhpdCcpLmxlbmd0aDtcclxuLy8gICAgICAgIHZhciBjYyA9IGdldFRyZWVEYXRhLmNhbGwodGhpcywgZGVwdGgsIGRhdGEpO1xyXG4vLyAgICAgICAgJCh1bCkuYXBwZW5kKGNjLmpvaW4oJycpKTtcclxuLy8gICAgICAgIFxyXG4vLyAgICAgICAgZnVuY3Rpb24gZ2V0VHJlZURhdGEoZGVwdGgsIGNoaWxkcmVuKXtcclxuLy8gICAgICAgICAgdmFyIGNjID0gW107XHJcbi8vICAgICAgICAgIGZvcih2YXIgaT0wOyBpPGNoaWxkcmVuLmxlbmd0aDsgaSsrKXtcclxuLy8gICAgICAgICAgICB2YXIgaXRlbSA9IGNoaWxkcmVuW2ldO1xyXG4vLyAgICAgICAgICAgIGlmIChpdGVtLnN0YXRlICE9ICdvcGVuJyAmJiBpdGVtLnN0YXRlICE9ICdjbG9zZWQnKXtcclxuLy8gICAgICAgICAgICAgIGl0ZW0uc3RhdGUgPSAnb3Blbic7XHJcbi8vICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgIGl0ZW0uZG9tSWQgPSAnX2Vhc3l1aV90cmVlXycgKyBub2RlSW5kZXgrKztcclxuLy8gICAgICAgICAgICBcclxuLy8gICAgICAgICAgICBjYy5wdXNoKCc8bGk+Jyk7XHJcbi8vICAgICAgICAgICAgY2MucHVzaCgnPGRpdiBpZD1cIicgKyBpdGVtLmRvbUlkICsgJ1wiIGNsYXNzPVwidHJlZS1ub2RlXCI+Jyk7XHJcbi8vICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8ZGVwdGg7IGorKyl7XHJcbi8vICAgICAgICAgICAgICBjYy5wdXNoKCc8c3BhbiBjbGFzcz1cInRyZWUtaW5kZW50XCI+PC9zcGFuPicpO1xyXG4vLyAgICAgICAgICAgIH1cclxuLy8gICAgICAgICAgICBpZiAoaXRlbS5zdGF0ZSA9PSAnY2xvc2VkJyl7XHJcbi8vICAgICAgICAgICAgICBjYy5wdXNoKCc8c3BhbiBjbGFzcz1cInRyZWUtaGl0IHRyZWUtY29sbGFwc2VkXCI+PC9zcGFuPicpO1xyXG4vLyAgICAgICAgICAgICAgY2MucHVzaCgnPHNwYW4gY2xhc3M9XCJ0cmVlLWljb24gJyArIChpdGVtLmljb25DbHM/aXRlbS5pY29uQ2xzOicnKSArICdcIj48L3NwYW4+Jyk7XHJcbi8vICAgICAgICAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICAgICAgIGlmIChpdGVtLmNoaWxkcmVuICYmIGl0ZW0uY2hpbGRyZW4ubGVuZ3RoKXtcclxuLy8gICAgICAgICAgICAgICAgY2MucHVzaCgnPHNwYW4gY2xhc3M9XCJ0cmVlLWhpdCB0cmVlLWV4cGFuZGVkXCI+PC9zcGFuPicpO1xyXG4vLyAgICAgICAgICAgICAgICBjYy5wdXNoKCc8c3BhbiBjbGFzcz1cInRyZWUtaWNvbiAnICsgKGl0ZW0uaWNvbkNscz9pdGVtLmljb25DbHM6JycpICsgJ1wiPjwvc3Bhbj4nKTtcclxuLy8gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbi8vICAgICAgICAgICAgICAgIGNjLnB1c2goJzxzcGFuIGNsYXNzPVwidHJlZS1pbmRlbnRcIj48L3NwYW4+Jyk7XHJcbi8vICAgICAgICAgICAgICAgIGNjLnB1c2goJzxzcGFuIGNsYXNzPVwidHJlZS1pY29uICcgKyAoaXRlbS5pY29uQ2xzP2l0ZW0uaWNvbkNsczonJykgKyAnXCI+PC9zcGFuPicpO1xyXG4vLyAgICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgIH1cclxuLy8gICAgICAgICAgICBpZiAodGhpcy5oYXNDaGVja2JveCh0YXJnZXQsIGl0ZW0pKXtcclxuLy8gICAgICAgICAgICAgIHZhciBmbGFnID0gMDtcclxuLy8gICAgICAgICAgICAgIGlmIChwZGF0YSAmJiBwZGF0YS5jaGVja1N0YXRlPT0nY2hlY2tlZCcgJiYgb3B0cy5jYXNjYWRlQ2hlY2spe1xyXG4vLyAgICAgICAgICAgICAgICBmbGFnID0gMTtcclxuLy8gICAgICAgICAgICAgICAgaXRlbS5jaGVja2VkID0gdHJ1ZTtcclxuLy8gICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS5jaGVja2VkKXtcclxuLy8gICAgICAgICAgICAgICAgJC5lYXN5dWkuYWRkQXJyYXlJdGVtKHN0YXRlLnRtcElkcywgaXRlbS5kb21JZCk7XHJcbi8vICAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgICBpdGVtLmNoZWNrU3RhdGUgPSBmbGFnID8gJ2NoZWNrZWQnIDogJ3VuY2hlY2tlZCc7XHJcbi8vICAgICAgICAgICAgICBjYy5wdXNoKCc8c3BhbiBjbGFzcz1cInRyZWUtY2hlY2tib3ggdHJlZS1jaGVja2JveCcgKyBmbGFnICsgJ1wiPjwvc3Bhbj4nKTtcclxuLy8gICAgICAgICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgICAgICAgaXRlbS5jaGVja1N0YXRlID0gdW5kZWZpbmVkO1xyXG4vLyAgICAgICAgICAgICAgaXRlbS5jaGVja2VkID0gdW5kZWZpbmVkO1xyXG4vLyAgICAgICAgICAgIH1cclxuLy8gICAgICAgICAgICBjYy5wdXNoKCc8c3BhbiBjbGFzcz1cInRyZWUtdGl0bGVcIj4nICsgb3B0cy5mb3JtYXR0ZXIuY2FsbCh0YXJnZXQsIGl0ZW0pICsgJzwvc3Bhbj4nKTtcclxuLy8gICAgICAgICAgICBjYy5wdXNoKCc8L2Rpdj4nKTtcclxuLy8gICAgICAgICAgICBcclxuLy8gICAgICAgICAgICBpZiAoaXRlbS5jaGlsZHJlbiAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCl7XHJcbi8vICAgICAgICAgICAgICB2YXIgdG1wID0gZ2V0VHJlZURhdGEuY2FsbCh0aGlzLCBkZXB0aCsxLCBpdGVtLmNoaWxkcmVuKTtcclxuLy8gICAgICAgICAgICAgIGNjLnB1c2goJzx1bCBzdHlsZT1cImRpc3BsYXk6JyArIChpdGVtLnN0YXRlPT0nY2xvc2VkJz8nbm9uZSc6J2Jsb2NrJykgKyAnXCI+Jyk7XHJcbi8vICAgICAgICAgICAgICBjYyA9IGNjLmNvbmNhdCh0bXApO1xyXG4vLyAgICAgICAgICAgICAgY2MucHVzaCgnPC91bD4nKTtcclxuLy8gICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgY2MucHVzaCgnPC9saT4nKTtcclxuLy8gICAgICAgICAgfVxyXG4vLyAgICAgICAgICByZXR1cm4gY2M7XHJcbi8vICAgICAgICB9XHJcbi8vICAgICAgfVxyXG4vLyAgfTtcclxuXHQvKiogKioqKioqKiogdHJlZSAqKioqKioqKiogKi9cclxuXHR2YXIgdHJlZURlZmF1bHRzID0ge1xyXG5cdFx0bG9hZERhdGFFcnJvck1zZyA6IFwiRXJyb3IgbG9hZGluZyBkYXRhLlwiLFxyXG5cdFx0Ly92aWV3IDogJC5leHRlbmQoJC5mbi50cmVlLmRlZmF1bHRzLnZpZXcsZGVmYXVsdFZpZXcpLFxyXG5cdFx0X2xvYWRlciA6ICQuZm4udHJlZS5kZWZhdWx0cy5sb2FkZXIsXHJcblx0XHRsb2FkZXIgOiBmdW5jdGlvbihwYXJhbSwgc3VjY2VzcywgZXJyb3IpIHtcclxuXHRcdFx0dmFyICR0cmVlID0gJCh0aGlzKSwgb3B0aW9ucyA9ICR0cmVlLnRyZWUoXCJvcHRpb25zXCIpO1xyXG5cdFx0XHRpZiAoIW9wdGlvbnMucXVlcnkpIHJldHVybiAkLmZuLnRyZWUuZGVmYXVsdHMuX2xvYWRlci5jYWxsKHRoaXMsIHBhcmFtLCBzdWNjZXNzLCBlcnJvcik7XHJcblx0XHRcdHZhciBxdWVyeUZpZWxkcyA9IFtdO1xyXG5cdFx0XHRpZiAob3B0aW9ucy5xdWVyeUZpZWxkcykge1xyXG5cdFx0XHRcdHF1ZXJ5RmllbGRzID0gcXVlcnlGaWVsZHMuY29uY2F0KG9wdGlvbnMucXVlcnlGaWVsZHMpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcHRpb25zLmNvbW1vblF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdFx0cXVlcnlGaWVsZHMgPSBxdWVyeUZpZWxkcy5jb25jYXQob3B0aW9ucy5jb21tb25RdWVyeUZpZWxkcyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhcmFtICYmIHBhcmFtLnF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdFx0aWYgKCQuaXNBcnJheShwYXJhbS5xdWVyeUZpZWxkcykpIHtcclxuXHRcdFx0XHRcdHF1ZXJ5RmllbGRzID0gcXVlcnlGaWVsZHMuY29uY2F0KHBhcmFtLnF1ZXJ5RmllbGRzKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKCQuaXNQbGFpbk9iamVjdChwYXJhbS5xdWVyeUZpZWxkcykpIHtcclxuXHRcdFx0XHRcdHF1ZXJ5RmllbGRzLnB1c2gocGFyYW0ucXVlcnlGaWVsZHMpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocGFyYW0uaWQpIHtcclxuXHRcdFx0XHRwYXJlbnRRdWVyeUZpZWxkID0ge1xyXG5cdFx0XHRcdFx0ZmllbGROYW1lIDogb3B0aW9ucy5wYXJlbnRGaWVsZCB8fCBcInBhcmVudElkXCIsXHJcblx0XHRcdFx0XHRmaWVsZFN0cmluZ1ZhbHVlIDogcGFyYW0uaWRcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHF1ZXJ5RmllbGRzLnB1c2gocGFyZW50UXVlcnlGaWVsZCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIHF1ZXJ5SW5mbyA9IHtcclxuXHRcdFx0XHRxdWVyeSA6IG9wdGlvbnMucXVlcnksXHJcblx0XHRcdFx0b3JkZXJCeSA6IG9wdGlvbnMub3JkZXJCeSxcclxuXHRcdFx0XHRxdWVyeUZpZWxkcyA6IHF1ZXJ5RmllbGRzXHJcblx0XHRcdH07XHJcblx0XHRcdG9wdGlvbnMucXVlcnlJbmZvID0gcXVlcnlJbmZvO1xyXG5cdFx0XHRmbXguQ29tbW9uUXVlcnlTZXJ2aWNlLnF1ZXJ5KHF1ZXJ5SW5mbywgc3VjY2VzcywgZXJyb3IpO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBxdWVyeSByZXN1bHRcclxuXHRcdGxvYWRGaWx0ZXIgOiBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdHZhciAkdHJlZSA9ICQodGhpcyksIG9wdGlvbnMgPSAkdHJlZS50cmVlKFwib3B0aW9uc1wiKTtcclxuXHRcdFx0aWYgKCFvcHRpb25zLnF1ZXJ5KSByZXR1cm4gZGF0YTtcclxuXHRcdFx0aWYgKGRhdGFbJ2NvZGUnXSA8IDApIHtcclxuXHRcdFx0XHR2YXIgbWVzc2FnZSA9IGRhdGEuZXJyb3JzIHx8IGRhdGEubWVzc2FnZTtcclxuXHRcdFx0XHQkLm1lc3NhZ2VyLmFsZXJ0KFwiTWVzc2FnZVwiLCAkLmZuLnRyZWUuZGVmYXVsdHMubG9hZERhdGFFcnJvck1zZyArIG1lc3NhZ2UsIFwid2FybmluZ1wiKTtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGlkRmllbGQgPSBvcHRpb25zLmlkRmllbGQgfHwgXCJpZFwiO1xyXG5cdFx0XHR2YXIgdGV4dEZpZWxkID0gb3B0aW9ucy50ZXh0RmllbGQgfHwgXCJ0ZXh0XCI7XHJcblx0XHRcdHZhciBwYXJlbnRGaWVsZCA9IG9wdGlvbnMucGFyZW50RmllbGQgfHwgXCJwYXJlbnRJZFwiO1xyXG5cdFx0XHR2YXIgY2hlY2tlZEZpZWxkID0gb3B0aW9ucy5jaGVja2VkRmllbGQgfHwgXCJjaGVja2VkXCI7XHJcblx0XHRcdHZhciBzdGF0ZUZpZWxkID0gb3B0aW9ucy5zdGF0ZUZpZWxkIHx8IFwic3RhdGVcIjtcclxuXHRcdFx0dmFyIGljb25DbHNGaWVsZCA9IG9wdGlvbnMuaWNvbkNsc0ZpZWxkIHx8IFwiaWNvbkNsc1wiO1xyXG5cdFx0XHR2YXIgZGF0YUxpc3QgPSAkLmlzQXJyYXkoZGF0YSkgPyBudWxsIDogKGRhdGEuZGF0YSA/IGRhdGEuZGF0YS5kYXRhTGlzdCA6IGRhdGEpO1xyXG5cdFx0XHRpZiAoZGF0YUxpc3QpIHtcclxuXHRcdFx0XHQvLyByZXR1cm5lZCBmcm9tIGNvbW1vbnF1ZXJ5XHJcblx0XHRcdFx0dmFyIGFsbE5vZGVNYXAgPSB7fTtcclxuXHRcdFx0XHR2YXIgYWxsTm9kZUFycmF5ID0gW107XHJcblx0XHRcdFx0JC5lYWNoKGRhdGFMaXN0LCBmdW5jdGlvbihpbmRleCwgZGF0YUl0ZW0pIHtcclxuXHRcdFx0XHRcdGlmKGRhdGFJdGVtWydhdHRyaWJ1dGVzJ10pe1xyXG5cdFx0XHRcdFx0XHRkYXRhSXRlbSA9IGRhdGFJdGVtLmF0dHJpYnV0ZXMuZGF0YTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHZhciBub2RlID0ge1xyXG5cdFx0XHRcdFx0XHRpZCA6IGRhdGFJdGVtW2lkRmllbGRdLFxyXG5cdFx0XHRcdFx0XHR0ZXh0IDogZGF0YUl0ZW1bdGV4dEZpZWxkXSxcclxuXHRcdFx0XHRcdFx0Y2hlY2tlZCA6IGRhdGFJdGVtW2NoZWNrZWRGaWVsZF0sXHJcblx0XHRcdFx0XHRcdHN0YXRlIDogZGF0YUl0ZW1bc3RhdGVGaWVsZF0sXHJcblx0XHRcdFx0XHRcdGljb25DbHMgOiBkYXRhSXRlbVtpY29uQ2xzRmllbGRdLFxyXG5cdFx0XHRcdFx0XHRhdHRyaWJ1dGVzIDoge1xyXG5cdFx0XHRcdFx0XHRcdGRhdGEgOiBkYXRhSXRlbVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0aWYgKCR0cmVlLmRhdGEoXCJjb2xsYXBzZWRJZHNcIikgJiYgJHRyZWUuZGF0YShcImNvbGxhcHNlZElkc1wiKS5pbmRleE9mKG5vZGUuaWQpID49IDApIHtcclxuXHRcdFx0XHRcdFx0bm9kZS5zdGF0ZSA9IFwiY2xvc2VkXCI7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRhbGxOb2RlTWFwW25vZGUuaWRdID0gbm9kZTtcclxuXHRcdFx0XHRcdGFsbE5vZGVBcnJheS5wdXNoKG5vZGUpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSBbXTtcclxuXHRcdFx0XHQkLmVhY2goYWxsTm9kZUFycmF5LCBmdW5jdGlvbihpbmRleCwgbm9kZSkge1xyXG5cdFx0XHRcdFx0aWYgKG5vZGUuYXR0cmlidXRlcy5kYXRhW3BhcmVudEZpZWxkXSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFyZW50ID0gYWxsTm9kZU1hcFtub2RlLmF0dHJpYnV0ZXMuZGF0YVtwYXJlbnRGaWVsZF1dO1xyXG5cdFx0XHRcdFx0XHRpZiAocGFyZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCFwYXJlbnQuY2hpbGRyZW4pIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudC5jaGlsZHJlbiA9IFtdO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRwYXJlbnQuY2hpbGRyZW4ucHVzaChub2RlKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRyZXN1bHQucHVzaChub2RlKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0cmVzdWx0LnB1c2gobm9kZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoJC5pc0FycmF5KGRhdGEpKSB7XHJcblx0XHRcdFx0ZnVuY3Rpb24gYmluZEF0dHJpYnV0ZXMobm9kZSkge1xyXG5cdFx0XHRcdFx0JC5leHRlbmQodHJ1ZSwgbm9kZSwge1xyXG5cdFx0XHRcdFx0XHRpZCA6IG5vZGUuaWQgfHwgbm9kZVtpZEZpZWxkXSxcclxuXHRcdFx0XHRcdFx0dGV4dCA6IG5vZGUudGV4dCB8fCBub2RlW3RleHRGaWVsZF0sXHJcblx0XHRcdFx0XHRcdGNoZWNrZWQgOiBub2RlLmNoZWNrZWQgfHwgbm9kZVtjaGVja2VkRmllbGRdLFxyXG5cdFx0XHRcdFx0XHRzdGF0ZSA6IG5vZGUuc3RhdGUgfHwgbm9kZVtzdGF0ZUZpZWxkXSxcclxuXHRcdFx0XHRcdFx0aWNvbkNscyA6IG5vZGUuaWNvbkNscyB8fCBub2RlW2ljb25DbHNGaWVsZF0sXHJcblx0XHRcdFx0XHRcdGF0dHJpYnV0ZXMgOiB7XHJcblx0XHRcdFx0XHRcdFx0ZGF0YSA6IG5vZGUuYXR0cmlidXRlcyAmJiBub2RlLmF0dHJpYnV0ZXMuZGF0YSA/IG5vZGUuYXR0cmlidXRlcy5kYXRhIDogbm9kZVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdGlmICgkdHJlZS5kYXRhKFwiY29sbGFwc2VkSWRzXCIpICYmICR0cmVlLmRhdGEoXCJjb2xsYXBzZWRJZHNcIikuaW5kZXhPZihub2RlLmlkKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRcdG5vZGUuc3RhdGUgPSBcImNsb3NlZFwiO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8kLmV4dGVuZCh0cnVlLCBub2RlLmF0dHJpYnV0ZXMsIG5vZGUuYXR0cmlidXRlcy5kYXRhLmF0dHJpYnV0ZXMpO1xyXG5cdFx0XHRcdFx0aWYgKG5vZGUuY2hpbGRyZW4pIHtcclxuXHRcdFx0XHRcdFx0JC5lYWNoKG5vZGUuY2hpbGRyZW4sIGZ1bmN0aW9uKGluZGV4LCBjaGlsZCkge1xyXG5cdFx0XHRcdFx0XHRcdGJpbmRBdHRyaWJ1dGVzKGNoaWxkKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdDtcclxuXHRcdFx0XHQkLmVhY2goZGF0YSwgZnVuY3Rpb24oaW5kZXgsIG5vZGUpIHtcclxuXHRcdFx0XHRcdGJpbmRBdHRyaWJ1dGVzKG5vZGUpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0fSxcclxuXHJcblx0XHRvbkxvYWRTdWNjZXNzIDogZnVuY3Rpb24obm9kZSwgZGF0YSkge1xyXG5cdFx0XHR2YXIgJHRyZWUgPSAkKHRoaXMpO1xyXG5cdFx0XHR2YXIgb3B0aW9ucyA9ICR0cmVlLnRyZWUoXCJvcHRpb25zXCIpO1xyXG5cdFx0XHQkdHJlZS5kYXRhKFwiZGVsZXRlZERhdGFcIiwgW10pO1xyXG5cdFx0XHRmdW5jdGlvbiBoYW5kbGVOb2RlKG5vZGUpIHtcclxuXHRcdFx0XHRpZiAobm9kZS5hdHRyaWJ1dGVzKSB7XHJcblx0XHRcdFx0XHRub2RlLmF0dHJpYnV0ZXMub2xkSnNvblZhbHVlID0gSlNPTi5zdHJpbmdpZnkobm9kZS5hdHRyaWJ1dGVzLmRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAob3B0aW9ucy50aXRsZUZpZWxkKSB7XHJcblx0XHRcdFx0XHQkKG5vZGUudGFyZ2V0KS5hdHRyKFwidGl0bGVcIiwgbm9kZS5hdHRyaWJ1dGVzLmRhdGFbb3B0aW9ucy50aXRsZUZpZWxkXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBkYXRhID0gJHRyZWUudHJlZShcImdldERhdGFcIiwgbm9kZS50YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChkYXRhICYmIGRhdGEuY2hpbGRyZW4pIHtcclxuXHRcdFx0XHRcdCQuZWFjaChkYXRhLmNoaWxkcmVuLCBmdW5jdGlvbihpbmRleCwgY2hpbGQpIHtcclxuXHRcdFx0XHRcdFx0aGFuZGxlTm9kZShjaGlsZCk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0JC5lYWNoKCR0cmVlLnRyZWUoXCJnZXRSb290c1wiKSwgZnVuY3Rpb24oaW5kZXgsIHJvb3QpIHtcclxuXHRcdFx0XHRoYW5kbGVOb2RlKHJvb3QpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0dmFyIHByZXZpb3VzU2VsZWN0ZWRJZCA9ICR0cmVlLmRhdGEoXCJzZWxlY3RlZElkXCIpO1xyXG5cdFx0XHRpZiAocHJldmlvdXNTZWxlY3RlZElkKSB7XHJcblx0XHRcdFx0dmFyIHByZXZpb3VzU2VsZWN0ZWROb2RlID0gJHRyZWUudHJlZShcImZpbmRcIiwgcHJldmlvdXNTZWxlY3RlZElkKTtcclxuXHRcdFx0XHRpZiAocHJldmlvdXNTZWxlY3RlZE5vZGUpIHtcclxuXHRcdFx0XHRcdCR0cmVlLnRyZWUoXCJzZWxlY3RcIiwgcHJldmlvdXNTZWxlY3RlZE5vZGUudGFyZ2V0KTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIHByZXZpb3VzU2VsZWN0ZWRQb3NpdGlvbiA9ICR0cmVlLmRhdGEoXCJzZWxlY3RlZFBvc2l0aW9uXCIpO1xyXG5cdFx0XHRpZiAocHJldmlvdXNTZWxlY3RlZFBvc2l0aW9uICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdCR0cmVlLnRyZWUoXCJzZWxlY3RcIiwgJHRyZWUuZmluZChcIi50cmVlLW5vZGU6dmlzaWJsZVwiKVtwcmV2aW91c1NlbGVjdGVkUG9zaXRpb25dKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHJcblx0XHRvbkxvYWRFcnJvciA6IGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0JC5tZXNzYWdlci5jb25maXJtKFwiTWVzc2FnZVwiLCAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLnJlTG9naW5Nc2csIGZ1bmN0aW9uKGIpIHtcclxuXHRcdFx0XHRpZiAoYikge1xyXG5cdFx0XHRcdFx0d2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdH07XHJcblxyXG5cdCQuZXh0ZW5kKCQuZm4udHJlZS5kZWZhdWx0cywgdHJlZURlZmF1bHRzKTtcclxuXHJcblx0JC5leHRlbmQoJC5mbi50cmVlLm1ldGhvZHMsIHtcclxuXHJcblx0XHRfcmVsb2FkIDogJC5mbi50cmVlLm1ldGhvZHMucmVsb2FkLFxyXG5cclxuXHRcdHJlbG9hZCA6IGZ1bmN0aW9uKGpxLCB0YXJnZXQpIHtcclxuXHRcdFx0cmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oICkge1xyXG5cdFx0XHRcdHZhciAkdHJlZSA9ICQodGhpcyk7XHJcblx0XHRcdFx0Ly8gcmVtZW1lYmVyIGNvbGxhcHNlIHN0YXR1c1xyXG5cdFx0XHRcdHZhciBjb2xsYXBzZWRJZHMgPSBbXTtcclxuXHRcdFx0XHQkLmVhY2goJHRyZWUuZmluZChcIi50cmVlLWNvbGxhcHNlZFwiKS5wYXJlbnQoKSwgZnVuY3Rpb24oaW5kZXgsIG5vZGUpIHtcclxuXHRcdFx0XHRcdGNvbGxhcHNlZElkcy5wdXNoKCQobm9kZSkuYXR0cihcIm5vZGUtaWRcIikpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdCR0cmVlLmRhdGEoXCJjb2xsYXBzZWRJZHNcIiwgY29sbGFwc2VkSWRzKTtcclxuXHRcdFx0XHQvLyByZW1lbWJlciBzZWxlY3RkIG5vZGVcclxuXHRcdFx0XHR2YXIgc2VsZWN0ZWQgPSAkdHJlZS50cmVlKFwiZ2V0U2VsZWN0ZWRcIik7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGVkKSB7XHJcblx0XHRcdFx0XHQkdHJlZS5kYXRhKFwic2VsZWN0ZWRJZFwiLCBzZWxlY3RlZC5pZCk7XHJcblx0XHRcdFx0XHQkdHJlZS5kYXRhKFwic2VsZWN0ZWRQb3NpdGlvblwiLCAkdHJlZS5maW5kKFwiLnRyZWUtbm9kZTp2aXNpYmxlXCIpLmluZGV4KHNlbGVjdGVkLnRhcmdldCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQkdHJlZS50cmVlKFwiX3JlbG9hZFwiLCB0YXJnZXQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gY29tbW9uUXVlcnlcclxuXHRcdGNvbW1vblF1ZXJ5IDogZnVuY3Rpb24oanEsIHF1ZXJ5SW5mbykge1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbiggKSB7XHJcblx0XHRcdFx0dmFyICR0cmVlID0gJCh0aGlzKTtcclxuXHRcdFx0XHR2YXIgb3B0aW9ucyA9ICR0cmVlLnRyZWUoXCJvcHRpb25zXCIpO1xyXG5cdFx0XHRcdG9wdGlvbnMuY29tbW9uUXVlcnlGaWVsZHMgPSBudWxsO1xyXG5cdFx0XHRcdGlmIChxdWVyeUluZm8pIHtcclxuXHRcdFx0XHRcdGlmIChxdWVyeUluZm8ucXVlcnlGaWVsZHMpIHtcclxuXHRcdFx0XHRcdFx0b3B0aW9ucy5jb21tb25RdWVyeUZpZWxkcyA9IHF1ZXJ5SW5mby5xdWVyeUZpZWxkcztcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChxdWVyeUluZm8ucXVlcnkpIHtcclxuXHRcdFx0XHRcdFx0b3B0aW9ucy5xdWVyeSA9IHF1ZXJ5SW5mby5xdWVyeTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChxdWVyeUluZm8ub3JkZXJCeSkge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25zLm9yZGVyQnkgPSBxdWVyeUluZm8ub3JkZXJCeTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0JHRyZWUudHJlZShcInJlbG9hZFwiKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cclxuXHRcdHNldFF1ZXJ5RmllbGRzIDogZnVuY3Rpb24oanEsIHF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0XHQkKHRoaXMpLnRyZWUoXCJvcHRpb25zXCIpLnF1ZXJ5RmllbGRzID0gcXVlcnlGaWVsZHM7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHJcblx0XHRnZXRDaGFuZ2VzIDogZnVuY3Rpb24oanEpIHtcclxuXHRcdFx0dmFyICR0cmVlID0gJChqcVswXSk7XHJcblx0XHRcdHZhciBvcHRpb25zID0gJHRyZWUudHJlZShcIm9wdGlvbnNcIik7XHJcblx0XHRcdHZhciBpZEZpZWxkID0gb3B0aW9ucy5pZEZpZWxkO1xyXG5cdFx0XHR2YXIgcGFyZW50RmllbGQgPSBvcHRpb25zLnBhcmVudEZpZWxkO1xyXG5cdFx0XHR2YXIgc2VxRmllbGQgPSBvcHRpb25zLnNlcUZpZWxkO1xyXG5cdFx0XHR2YXIgdGV4dEZpZWxkID0gb3B0aW9ucy50ZXh0RmllbGQ7XHJcblx0XHRcdHZhciBkYXRhID0gW107XHJcblx0XHRcdGZ1bmN0aW9uIGFkZERhdGEobm9kZSwgcGFyZW50SWQsIHNlcSkge1xyXG5cdFx0XHRcdHZhciBub2RlRGF0YSA9IG5vZGUuYXR0cmlidXRlcy5kYXRhO1xyXG5cdFx0XHRcdGRlbGV0ZSBub2RlRGF0YVsncm93U3RhdGUnXTtcclxuXHRcdFx0XHRub2RlRGF0YVtpZEZpZWxkXSA9IG5vZGUuaWQ7XHJcblx0XHRcdFx0bm9kZURhdGFbcGFyZW50RmllbGRdID0gcGFyZW50SWQ7XHJcblx0XHRcdFx0bm9kZURhdGEuY2hlY2tlZCA9IG5vZGUuY2hlY2tlZDtcclxuXHRcdFx0XHRub2RlRGF0YS5pY29uQ2xzID0gbm9kZS5pY29uQ2xzO1xyXG5cdFx0XHRcdG5vZGVEYXRhW3RleHRGaWVsZF0gPSBub2RlLnRleHQ7XHJcblx0XHRcdFx0aWYgKHNlcUZpZWxkKSB7XHJcblx0XHRcdFx0XHRub2RlRGF0YVtzZXFGaWVsZF0gPSBzZXE7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBvbGRKc29uVmFsdWUgPSBub2RlLmF0dHJpYnV0ZXMub2xkSnNvblZhbHVlO1xyXG5cdFx0XHRcdGlmIChvbGRKc29uVmFsdWUpIHtcclxuXHRcdFx0XHRcdGlmIChvbGRKc29uVmFsdWUgIT0gSlNPTi5zdHJpbmdpZnkobm9kZURhdGEpKSB7XHJcblx0XHRcdFx0XHRcdG5vZGVEYXRhLnJvd1N0YXRlID0gXCJNb2RpZmllZFwiO1xyXG5cdFx0XHRcdFx0XHRkYXRhLnB1c2gobm9kZURhdGEpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAobm9kZURhdGEucm93U3RhdGUgPT0gXCJEZWxldGVkXCIpIHtcclxuXHRcdFx0XHRcdFx0bm9kZURhdGEucm93U3RhdGUgPSBcIk1vZGlmaWVkXCI7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRub2RlRGF0YS5yb3dTdGF0ZSA9IFwiQWRkZWRcIjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGRhdGEucHVzaChub2RlRGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdCQuZWFjaCgkdHJlZS50cmVlKFwiZ2V0RGF0YVwiLCBub2RlLnRhcmdldCkuY2hpbGRyZW4sIGZ1bmN0aW9uKGluZGV4LCBjaGlsZCkge1xyXG5cdFx0XHRcdFx0YWRkRGF0YShjaGlsZCwgbm9kZURhdGFbaWRGaWVsZF0sIGluZGV4KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHQkLmVhY2goJHRyZWUudHJlZShcImdldFJvb3RzXCIpLCBmdW5jdGlvbihpbmRleCwgcm9vdCkge1xyXG5cdFx0XHRcdGFkZERhdGEocm9vdCwgXCIwXCIsIGluZGV4KTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdCQuZWFjaCgkdHJlZS5kYXRhKFwiZGVsZXRlZERhdGFcIiksIGZ1bmN0aW9uKGluZGV4LCBkZWxldGVkRGF0YSkge1xyXG5cdFx0XHRcdGlmIChkYXRhLmluZGV4T2YoZGVsZXRlZERhdGEpID09IC0xICYmICEkdHJlZS50cmVlKFwiZmluZFwiLCBkZWxldGVkRGF0YVtpZEZpZWxkXSkpIHtcclxuXHRcdFx0XHRcdGRlbGV0ZWREYXRhLnJvd1N0YXRlID0gXCJEZWxldGVkXCI7XHJcblx0XHRcdFx0XHRkYXRhLnB1c2goZGVsZXRlZERhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0fSxcclxuXHJcblx0XHRnZXRIYWxmQ2hlY2tlZCA6IGZ1bmN0aW9uKGpxKSB7XHJcblx0XHRcdHZhciB0YXJnZXQgPSBqcVswXTtcclxuXHRcdFx0dmFyIGNoZWNrZWROb2RlcyA9IFtdO1xyXG5cdFx0XHQkKHRhcmdldCkuZmluZCgnLnRyZWUtY2hlY2tib3gyJykuZWFjaChmdW5jdGlvbiggKSB7XHJcblx0XHRcdFx0dmFyIG5vZGUgPSAkKHRoaXMpLnBhcmVudCgpO1xyXG5cdFx0XHRcdGNoZWNrZWROb2Rlcy5wdXNoKCQodGFyZ2V0KS50cmVlKFwiZ2V0Tm9kZVwiLCBub2RlWzBdKSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gY2hlY2tlZE5vZGVzO1xyXG5cdFx0fSxcclxuXHJcblx0XHRhcHBlbmRBZnRlclNlbGVjdGVkIDogZnVuY3Rpb24oanEsIG5vZGUpIHtcclxuXHRcdFx0cmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oICkge1xyXG5cdFx0XHRcdHZhciAkdHJlZSA9ICQodGhpcyk7XHJcblx0XHRcdFx0JC5leHRlbmQodHJ1ZSwgbm9kZSwge1xyXG5cdFx0XHRcdFx0aWQgOiBub2RlLmlkIHx8ICQubm93KCksXHJcblx0XHRcdFx0XHR0ZXh0IDogbm9kZS50ZXh0IHx8IFwiXCIsXHJcblx0XHRcdFx0XHRhdHRyaWJ1dGVzIDoge1xyXG5cdFx0XHRcdFx0XHRkYXRhIDogbm9kZVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHZhciBzZWxlY3RlZE5vZGUgPSAkdHJlZS50cmVlKFwiZ2V0U2VsZWN0ZWRcIik7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGVkTm9kZSA9PSBudWxsKSB7XHJcblx0XHRcdFx0XHQkdHJlZS50cmVlKFwiYXBwZW5kXCIsIHtcclxuXHRcdFx0XHRcdFx0ZGF0YSA6IFsgbm9kZSBdXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0JHRyZWUudHJlZShcImluc2VydFwiLCB7XHJcblx0XHRcdFx0XHRcdGFmdGVyIDogc2VsZWN0ZWROb2RlLnRhcmdldCxcclxuXHRcdFx0XHRcdFx0ZGF0YSA6IG5vZGVcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRub2RlID0gJHRyZWUudHJlZShcImZpbmRcIiwgbm9kZS5pZCk7XHJcblx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCBub2RlLnRhcmdldCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHJcblx0XHRpbnNlcnRCZWZvcmVTZWxlY3RlZCA6IGZ1bmN0aW9uKGpxLCBub2RlKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0XHR2YXIgJHRyZWUgPSAkKHRoaXMpO1xyXG5cdFx0XHRcdCQuZXh0ZW5kKHRydWUsIG5vZGUsIHtcclxuXHRcdFx0XHRcdGlkIDogbm9kZS5pZCB8fCAkLm5vdygpLFxyXG5cdFx0XHRcdFx0dGV4dCA6IG5vZGUudGV4dCB8fCBcIlwiLFxyXG5cdFx0XHRcdFx0YXR0cmlidXRlcyA6IHtcclxuXHRcdFx0XHRcdFx0ZGF0YSA6IG5vZGVcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR2YXIgc2VsZWN0ZWROb2RlID0gJHRyZWUudHJlZShcImdldFNlbGVjdGVkXCIpO1xyXG5cdFx0XHRcdGlmIChzZWxlY3RlZE5vZGUgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuXHRcdFx0XHQkdHJlZS50cmVlKFwiaW5zZXJ0XCIsIHtcclxuXHRcdFx0XHRcdGJlZm9yZSA6IHNlbGVjdGVkTm9kZS50YXJnZXQsXHJcblx0XHRcdFx0XHRkYXRhIDogbm9kZVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdG5vZGUgPSAkdHJlZS50cmVlKFwiZmluZFwiLCBub2RlLmlkKTtcclxuXHRcdFx0XHQkdHJlZS50cmVlKFwic2VsZWN0XCIsIG5vZGUudGFyZ2V0KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cclxuXHRcdGFkZENoaWxkVG9TZWxlY3RlZCA6IGZ1bmN0aW9uKGpxLCBub2RlKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0XHR2YXIgJHRyZWUgPSAkKHRoaXMpO1xyXG5cdFx0XHRcdCQuZXh0ZW5kKHRydWUsIG5vZGUsIHtcclxuXHRcdFx0XHRcdGlkIDogbm9kZS5pZCB8fCAkLm5vdygpLFxyXG5cdFx0XHRcdFx0dGV4dCA6IG5vZGUudGV4dCB8fCBcIlwiLFxyXG5cdFx0XHRcdFx0YXR0cmlidXRlcyA6IHtcclxuXHRcdFx0XHRcdFx0ZGF0YSA6IG5vZGVcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR2YXIgc2VsZWN0ZWROb2RlID0gJHRyZWUudHJlZShcImdldFNlbGVjdGVkXCIpO1xyXG5cdFx0XHRcdGlmIChzZWxlY3RlZE5vZGUgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuXHRcdFx0XHQkdHJlZS50cmVlKFwiYXBwZW5kXCIsIHtcclxuXHRcdFx0XHRcdHBhcmVudCA6IHNlbGVjdGVkTm9kZS50YXJnZXQsXHJcblx0XHRcdFx0XHRkYXRhIDogWyBub2RlIF1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRub2RlID0gJHRyZWUudHJlZShcImZpbmRcIiwgbm9kZS5pZCk7XHJcblx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCBub2RlLnRhcmdldCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHJcblx0XHRfcmVtb3ZlIDogJC5mbi50cmVlLm1ldGhvZHMucmVtb3ZlLFxyXG5cclxuXHRcdHJlbW92ZSA6IGZ1bmN0aW9uKGpxLCB0YXJnZXQpIHtcclxuXHRcdFx0anEuZWFjaChmdW5jdGlvbiggKSB7XHJcblx0XHRcdFx0dmFyICR0cmVlID0gJCh0aGlzKSxvcHRzID0gJHRyZWUudHJlZSgnb3B0aW9ucycpO1xyXG5cdFx0XHRcdGlmKCFvcHRzLnF1ZXJ5KSByZXR1cm47XHJcblx0XHRcdFx0dmFyIGRlbGV0ZWREYXRhID0gJHRyZWUuZGF0YShcImRlbGV0ZWREYXRhXCIpO1xyXG5cdFx0XHRcdGZ1bmN0aW9uIGFkZERlbGV0ZWREYXRhKG5vZGUpIHtcclxuXHRcdFx0XHRcdHZhciBub2RlRGF0YSA9IG5vZGUuYXR0cmlidXRlcy5kYXRhO1xyXG5cdFx0XHRcdFx0ZGVsZXRlZERhdGEucHVzaChub2RlRGF0YSk7XHJcblx0XHRcdFx0XHR2YXIgY2hpbGRyZW4gPSAkdHJlZS50cmVlKFwiZ2V0RGF0YVwiLCBub2RlLnRhcmdldCkuY2hpbGRyZW47XHJcblx0XHRcdFx0XHRpZigkLmlzQXJyYXkoY2hpbGRyZW4pKXtcclxuXHRcdFx0XHRcdFx0JC5lYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihpbmRleCwgY2hpbGQpIHtcclxuXHRcdFx0XHRcdFx0XHRhZGREZWxldGVkRGF0YShjaGlsZCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRhZGREZWxldGVkRGF0YSgkdHJlZS50cmVlKFwiZ2V0RGF0YVwiLCB0YXJnZXQpKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiB0aGlzLl9yZW1vdmUoanEsIHRhcmdldCk7XHJcblx0XHR9LFxyXG5cclxuXHRcdHJlbW92ZVNlbGVjdGVkIDogZnVuY3Rpb24oanEpIHtcclxuXHRcdFx0cmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oICkge1xyXG5cdFx0XHRcdHZhciAkdHJlZSA9ICQodGhpcyk7XHJcblx0XHRcdFx0dmFyIHNlbGVjdGVkTm9kZSA9ICR0cmVlLnRyZWUoXCJnZXRTZWxlY3RlZFwiKTtcclxuXHRcdFx0XHRpZiAoc2VsZWN0ZWROb2RlID09IG51bGwpIHsgcmV0dXJuOyB9XHJcblx0XHRcdFx0dmFyICRuZXh0ID0gJChzZWxlY3RlZE5vZGUudGFyZ2V0KS5wYXJlbnQoKS5uZXh0KCk7XHJcblx0XHRcdFx0aWYgKCRuZXh0LnNpemUoKSA+IDApIHtcclxuXHRcdFx0XHRcdCR0cmVlLnRyZWUoXCJzZWxlY3RcIiwgJG5leHQuY2hpbGRyZW4oKS5nZXQoMCkpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR2YXIgJHByZXYgPSAkKHNlbGVjdGVkTm9kZS50YXJnZXQpLnBhcmVudCgpLnByZXYoKTtcclxuXHRcdFx0XHRcdGlmICgkcHJldi5zaXplKCkgPiAwKSB7XHJcblx0XHRcdFx0XHRcdCR0cmVlLnRyZWUoXCJzZWxlY3RcIiwgJHByZXYuY2hpbGRyZW4oKS5nZXQoMCkpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0dmFyIHBhcmVudE5vZGUgPSAkdHJlZS50cmVlKFwiZ2V0UGFyZW50XCIsIHNlbGVjdGVkTm9kZS50YXJnZXQpO1xyXG5cdFx0XHRcdFx0XHRpZiAocGFyZW50Tm9kZSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCBwYXJlbnROb2RlLnRhcmdldCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0JHRyZWUudHJlZShcInJlbW92ZVwiLCBzZWxlY3RlZE5vZGUudGFyZ2V0KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cclxuXHRcdG1vdmVTZWxlY3RlZFVwIDogZnVuY3Rpb24oanEpIHtcclxuXHRcdFx0cmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oICkge1xyXG5cdFx0XHRcdHZhciAkdHJlZSA9ICQodGhpcyk7XHJcblx0XHRcdFx0dmFyIHNlbGVjdGVkTm9kZSA9ICR0cmVlLnRyZWUoXCJnZXRTZWxlY3RlZFwiKTtcclxuXHRcdFx0XHRpZiAoc2VsZWN0ZWROb2RlID09IG51bGwpIHsgcmV0dXJuOyB9XHJcblx0XHRcdFx0dmFyICRwcmV2ID0gJChzZWxlY3RlZE5vZGUudGFyZ2V0KS5wYXJlbnQoKS5wcmV2KCk7XHJcblx0XHRcdFx0aWYgKCRwcmV2LnNpemUoKSA+IDApIHtcclxuXHRcdFx0XHRcdCR0cmVlLnRyZWUoXCJpbnNlcnRcIiwge1xyXG5cdFx0XHRcdFx0XHRiZWZvcmUgOiAkcHJldi5jaGlsZHJlbigpLmdldCgwKSxcclxuXHRcdFx0XHRcdFx0ZGF0YSA6ICR0cmVlLnRyZWUoXCJwb3BcIiwgc2VsZWN0ZWROb2RlLnRhcmdldClcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCAkdHJlZS50cmVlKFwiZmluZFwiLCBzZWxlY3RlZE5vZGUuaWQpLnRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0bW92ZVNlbGVjdGVkRG93biA6IGZ1bmN0aW9uKGpxKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0XHR2YXIgJHRyZWUgPSAkKHRoaXMpO1xyXG5cdFx0XHRcdHZhciBzZWxlY3RlZE5vZGUgPSAkdHJlZS50cmVlKFwiZ2V0U2VsZWN0ZWRcIik7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGVkTm9kZSA9PSBudWxsKSB7IHJldHVybjsgfVxyXG5cdFx0XHRcdHZhciAkbmV4dCA9ICQoc2VsZWN0ZWROb2RlLnRhcmdldCkucGFyZW50KCkubmV4dCgpO1xyXG5cdFx0XHRcdGlmICgkbmV4dC5zaXplKCkgPiAwKSB7XHJcblx0XHRcdFx0XHQkdHJlZS50cmVlKFwiaW5zZXJ0XCIsIHtcclxuXHRcdFx0XHRcdFx0YWZ0ZXIgOiAkbmV4dC5jaGlsZHJlbigpLmdldCgwKSxcclxuXHRcdFx0XHRcdFx0ZGF0YSA6ICR0cmVlLnRyZWUoXCJwb3BcIiwgc2VsZWN0ZWROb2RlLnRhcmdldClcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCAkdHJlZS50cmVlKFwiZmluZFwiLCBzZWxlY3RlZE5vZGUuaWQpLnRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0bW92ZVNlbGVjdGVkTGVmdCA6IGZ1bmN0aW9uKGpxKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0XHR2YXIgJHRyZWUgPSAkKHRoaXMpO1xyXG5cdFx0XHRcdHZhciBzZWxlY3RlZE5vZGUgPSAkdHJlZS50cmVlKFwiZ2V0U2VsZWN0ZWRcIik7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGVkTm9kZSA9PSBudWxsKSB7IHJldHVybjsgfVxyXG5cdFx0XHRcdHZhciBwYXJlbnROb2RlID0gJHRyZWUudHJlZShcImdldFBhcmVudFwiLCBzZWxlY3RlZE5vZGUudGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAocGFyZW50Tm9kZSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHQkdHJlZS50cmVlKFwiaW5zZXJ0XCIsIHtcclxuXHRcdFx0XHRcdFx0YWZ0ZXIgOiBwYXJlbnROb2RlLnRhcmdldCxcclxuXHRcdFx0XHRcdFx0ZGF0YSA6ICR0cmVlLnRyZWUoXCJwb3BcIiwgc2VsZWN0ZWROb2RlLnRhcmdldClcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCAkdHJlZS50cmVlKFwiZmluZFwiLCBzZWxlY3RlZE5vZGUuaWQpLnRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0bW92ZVNlbGVjdGVkUmlnaHQgOiBmdW5jdGlvbihqcSkge1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbiggKSB7XHJcblx0XHRcdFx0dmFyICR0cmVlID0gJCh0aGlzKTtcclxuXHRcdFx0XHR2YXIgc2VsZWN0ZWROb2RlID0gJHRyZWUudHJlZShcImdldFNlbGVjdGVkXCIpO1xyXG5cdFx0XHRcdGlmIChzZWxlY3RlZE5vZGUgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuXHRcdFx0XHR2YXIgJHByZXYgPSAkKHNlbGVjdGVkTm9kZS50YXJnZXQpLnBhcmVudCgpLnByZXYoKTtcclxuXHRcdFx0XHRpZiAoJHByZXYuc2l6ZSgpID4gMCkge1xyXG5cdFx0XHRcdFx0JHRyZWUudHJlZShcImFwcGVuZFwiLCB7XHJcblx0XHRcdFx0XHRcdHBhcmVudCA6ICRwcmV2LmNoaWxkcmVuKCkuZ2V0KDApLFxyXG5cdFx0XHRcdFx0XHRkYXRhIDogWyAkdHJlZS50cmVlKFwicG9wXCIsIHNlbGVjdGVkTm9kZS50YXJnZXQpIF1cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0JHRyZWUudHJlZShcInNlbGVjdFwiLCAkdHJlZS50cmVlKFwiZmluZFwiLCBzZWxlY3RlZE5vZGUuaWQpLnRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0cmVsb2FkQW5kU2VsZWN0IDogZnVuY3Rpb24oanEsIGlkKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0XHR2YXIgJHRyZWUgPSAkKHRoaXMpO1xyXG5cdFx0XHRcdCR0cmVlLmRhdGEoXCJzZWxlY3RlZElkXCIsIGlkKTtcclxuXHRcdFx0XHQkdHJlZS50cmVlKFwicmVsb2FkXCIpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0fSk7XHJcblxyXG5cdC8vIGluaXQgdHJlZXNcclxuXHRmdW5jdGlvbiBpbml0VHJlZXMoanEsIGZpbmRpbmdzKSB7XHJcblx0XHRqcS5lYWNoKGZ1bmN0aW9uKCApIHtcclxuXHRcdFx0dmFyICR0cmVlID0gJCh0aGlzKTtcclxuXHRcdFx0dmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJC5mbi50cmVlLnBhcnNlT3B0aW9ucyh0aGlzKSwge1xyXG5cdFx0XHRcdGlkRmllbGQgOiAkdHJlZS5hdHRyKFwiaWRGaWVsZFwiKSxcclxuXHRcdFx0XHR0ZXh0RmllbGQgOiAkdHJlZS5hdHRyKFwidGV4dEZpZWxkXCIpLFxyXG5cdFx0XHRcdHBhcmVudEZpZWxkIDogJHRyZWUuYXR0cihcInBhcmVudEZpZWxkXCIpLFxyXG5cdFx0XHRcdHNlcUZpZWxkIDogJHRyZWUuYXR0cihcInNlcUZpZWxkXCIpLFxyXG5cdFx0XHRcdHRpdGxlRmllbGQgOiAkdHJlZS5hdHRyKFwidGl0bGVGaWVsZFwiKSxcclxuXHRcdFx0XHRjaGVja2VkRmllbGQgOiAkdHJlZS5hdHRyKFwiY2hlY2tlZEZpZWxkXCIpLFxyXG5cdFx0XHRcdHN0YXRlRmllbGQgOiAkdHJlZS5hdHRyKFwic3RhdGVGaWVsZFwiKSxcclxuXHRcdFx0XHRpY29uQ2xzRmllbGQgOiAkdHJlZS5hdHRyKFwiaWNvbkNsc0ZpZWxkXCIpLFxyXG5cdFx0XHRcdHF1ZXJ5IDogJHRyZWUuYXR0cihcInF1ZXJ5XCIpLFxyXG5cdFx0XHRcdG9yZGVyQnk6ICR0cmVlLmF0dHIoXCJvcmRlckJ5XCIpXHJcblx0XHRcdH0pO1xyXG5cdFx0XHQvLyBpZiB1c2Ugc3RhdGljIGRhdGEsIGRvIG5vdCBxdWVyeVxyXG5cdFx0XHRpZiAoJHRyZWUuY2hpbGRyZW4oKS5zaXplKCkgPiAwKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5xdWVyeSA9IG51bGw7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCR0cmVlLmF0dHIoXCJxdWVyeUZpZWxkc1wiKSkge1xyXG5cdFx0XHRcdG9wdGlvbnMucXVlcnlGaWVsZHMgPSBldmFsKCR0cmVlLmF0dHIoXCJxdWVyeUZpZWxkc1wiKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0JHRyZWUudHJlZShvcHRpb25zKTtcclxuXHRcdH0pO1xyXG5cdFx0ZGVsZXRlIGZpbmRpbmdzLnRyZWU7XHJcblx0fVxyXG5cdCQoJC5wYXJzZXIpLm9uKFwib25CZWZvcmVcIixmdW5jdGlvbihlLGN0eCxmaW5kaW5ncyl7XHJcblx0ICBpbml0VHJlZXMoZmluZGluZ3MudHJlZSxmaW5kaW5ncyk7XHJcblx0fSk7XHJcbn0pKGpRdWVyeSwgZm14KTsiLCIvKipcclxuICogalF1ZXJ5IEVhc3lVSSAxLjVcclxuICogXHJcbiAqIENvcHlyaWdodCAoYykgMjAwOS0yMDE2IHd3dy5qZWFzeXVpLmNvbS4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIGNvbW1lcmNpYWwgbGljZW5zZTogaHR0cDovL3d3dy5qZWFzeXVpLmNvbS9saWNlbnNlX2NvbW1lcmNpYWwucGhwXHJcbiAqIFRvIHVzZSBpdCBvbiBvdGhlciB0ZXJtcyBwbGVhc2UgY29udGFjdCB1czogaW5mb0BqZWFzeXVpLmNvbVxyXG4gKlxyXG4gKi9cclxuLyoqXHJcbiAqIGRhdGFncmlkIC0galF1ZXJ5IEVhc3lVSVxyXG4gKiBcclxuICogRGVwZW5kZW5jaWVzOlxyXG4gKiAgcGFuZWxcclxuICogXHRyZXNpemFibGVcclxuICogXHRsaW5rYnV0dG9uXHJcbiAqIFx0cGFnaW5hdGlvblxyXG4gKiBcclxuICovXHJcbjsgKGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuXHRmdW5jdGlvbiBnZXRTdG9yZUtleShvcHRzKSB7XHJcblx0XHRyZXR1cm4gZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWUgKycuJytvcHRzLmlkO1xyXG5cdH1cclxuXHRmdW5jdGlvbiByZXN0b3JlQ29sdW1ucyhvcHRzKXtcclxuXHRcdGlmKCFvcHRzLmlkIHx8ICFvcHRzLnN0b3JlQ29sdW1ucykgcmV0dXJuO1xyXG5cdFx0dmFyIHN0b3JlSW5mbyA9IGZteC51dGlscy5wYXJzZUpTT04oZm14LnN0b3JlLmdldChnZXRTdG9yZUtleShvcHRzKSkpO1xyXG5cdFx0aWYoIXN0b3JlSW5mbyB8fCAkLmlzRW1wdHlPYmplY3Qoc3RvcmVJbmZvKSkgcmV0dXJuO1xyXG5cdFx0Ly9zdG9yZUNvbHVtbnNXaXRoV2lkdGhcclxuXHRcdGZ1bmN0aW9uIGRvQ29tcGFyZShjb2wxLGNvbDIsYzEsYzIpe1xyXG5cdFx0XHR2YXIgaWR4MSA9IDEwMDAsaWR4MiA9IDEwMDA7XHJcblx0XHRcdGlmKGMxKXtcclxuXHRcdFx0XHRpZihvcHRzLnN0b3JlQ29sdW1uc1dpdGhXaWR0aCl7XHJcblx0XHRcdFx0XHRjb2wxLndpZHRoID0gYzEud2lkdGg7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKGMxLmhpZGRlbikgY29sMS5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHRcdGlkeDEgPSBjMS5pbmRleDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZihjMil7XHJcblx0XHRcdFx0aWYob3B0cy5zdG9yZUNvbHVtbnNXaXRoV2lkdGgpe1xyXG5cdFx0XHRcdFx0Y29sMi53aWR0aCA9IGMyLndpZHRoO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZihjMi5oaWRkZW4pIGNvbDIuaGlkZGVuID0gdHJ1ZTtcclxuXHRcdFx0XHRpZHgyID0gYzIuaW5kZXg7XHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRpZihpZHgxIDwgaWR4MikgcmV0dXJuIC0xO1xyXG5cdFx0XHRlbHNlIGlmKGlkeDEgPT0gaWR4MikgcmV0dXJuIDA7XHJcblx0XHRcdGVsc2UgcmV0dXJuIDE7XHJcblx0XHR9XHRcdFxyXG5cdFx0aWYoISQuaXNFbXB0eU9iamVjdChzdG9yZUluZm8uY29sdW1ucykgJiYgJC5pc0FycmF5KG9wdHMuY29sdW1ucykgJiYgb3B0cy5jb2x1bW5zLmxlbmd0aCA+IDApe1xyXG5cdFx0XHR2YXIgcG9zID0gb3B0cy5jb2x1bW5zLmxlbmd0aCAtIDE7XHJcblx0XHRcdCQuZWFjaChvcHRzLmNvbHVtbnNbcG9zXSxmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHZhciBjb2wgPSBzdG9yZUluZm8uY29sdW1uc1t0aGlzLmZpZWxkXTtcclxuXHRcdFx0XHRpZihjb2wgJiYgY29sLmhpZGRlbil7XHJcblx0XHRcdFx0XHR0aGlzLmhpZGRlbiA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuLy9cdFx0XHRvcHRzLmNvbHVtbnNbMF0uc29ydChmdW5jdGlvbihjb2wxLGNvbDIpe1xyXG4vL1x0XHRcdFx0dmFyIGMxID0gc3RvcmVJbmZvLmNvbHVtbnNbY29sMS5maWVsZF07XHJcbi8vXHRcdFx0XHR2YXIgYzIgPSBzdG9yZUluZm8uY29sdW1uc1tjb2wyLmZpZWxkXTtcclxuLy9cdFx0XHRcdHJldHVybiBkb0NvbXBhcmUoY29sMSxjb2wyLGMxLGMyKTtcclxuLy9cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdGlmKCEkLmlzRW1wdHlPYmplY3Qoc3RvcmVJbmZvLmZyb3plbkNvbHVtbnMpICYmICQuaXNBcnJheShvcHRzLmZyb3plbkNvbHVtbnMpICYmIG9wdHMuZnJvemVuQ29sdW1ucy5sZW5ndGggPiAwKXtcclxuXHRcdFx0dmFyIHBvcyA9IG9wdHMuZnJvemVuQ29sdW1ucy5sZW5ndGggLSAxO1xyXG5cdFx0XHQkLmVhY2gob3B0cy5mcm96ZW5Db2x1bW5zW3Bvc10sZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2YXIgY29sID0gc3RvcmVJbmZvLmZyb3plbkNvbHVtbnNbdGhpcy5maWVsZF07XHJcblx0XHRcdFx0aWYoY29sICYmIGNvbC5oaWRkZW4pe1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHRcdFx0XHJcbi8vXHRcdFx0b3B0cy5mcm96ZW5Db2x1bW5zWzBdLnNvcnQoZnVuY3Rpb24oY29sMSxjb2wyKXtcclxuLy9cdFx0XHRcdHZhciBjMSA9IHN0b3JlSW5mby5mcm96ZW5Db2x1bW5zW2NvbDEuZmllbGRdO1xyXG4vL1x0XHRcdFx0dmFyIGMyID0gc3RvcmVJbmZvLmZyb3plbkNvbHVtbnNbY29sMi5maWVsZF07XHRcdFxyXG4vL1x0XHRcdFx0cmV0dXJuIGRvQ29tcGFyZShjb2wxLGNvbDIsYzEsYzIpO1x0XHRcdFx0XHJcbi8vXHRcdFx0fSk7XHJcblx0XHR9XHRcdFxyXG5cdH1cclxuXHRmdW5jdGlvbiBzdG9yZUNvbHVtbnNJbmZvKHRhcmdldCkge1xyXG5cdFx0dmFyIG9wdHMgPSAkLmRhdGEodGFyZ2V0LFwiZGF0YWdyaWRcIikub3B0aW9ucztcclxuXHRcdGlmKCFvcHRzLmlkIHx8ICFvcHRzLnN0b3JlQ29sdW1ucyB8fCAhb3B0cy5faW5pdGlhbGl6ZWQpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0dmFyIGNvbHMgPSB7fSxmcm96ZW5Db2x1bW5zPXt9O1xyXG5cdFx0aWYoJC5pc0FycmF5KG9wdHMuY29sdW1ucykgJiYgb3B0cy5jb2x1bW5zLmxlbmd0aCA+IDApe1xyXG5cdFx0XHR2YXIgcG9zID0gb3B0cy5jb2x1bW5zLmxlbmd0aCAtIDE7XHJcblx0XHRcdCQuZWFjaChvcHRzLmNvbHVtbnNbcG9zXSxmdW5jdGlvbihpLGNvbCl7XHJcblx0XHRcdFx0aWYoY29sLmZpZWxkID09ICdjaycpIHJldHVybjtcclxuXHRcdFx0XHR2YXIgY29sdW1uID0ge1xyXG5cdFx0XHRcdFx0d2lkdGggOiBjb2wud2lkdGgsXHJcblx0XHRcdFx0XHRpbmRleCA6IGlcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGlmKGNvbC5oaWRkZW4pIHtcclxuXHRcdFx0XHRcdGNvbHVtbi5oaWRkZW4gPSBjb2wuaGlkZGVuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNvbHNbY29sLmZpZWxkXSA9IGNvbHVtbjtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRpZigkLmlzQXJyYXkob3B0cy5mcm96ZW5Db2x1bW5zKSAmJiBvcHRzLmZyb3plbkNvbHVtbnMubGVuZ3RoID4gMCAmJiAkLmlzQXJyYXkob3B0cy5mcm96ZW5Db2x1bW5zWzBdKSl7XHJcblx0XHRcdHZhciBwb3MgPSBvcHRzLmZyb3plbkNvbHVtbnMubGVuZ3RoIC0gMTtcclxuXHRcdFx0JC5lYWNoKG9wdHMuZnJvemVuQ29sdW1uc1twb3NdLGZ1bmN0aW9uKGksY29sKXtcclxuXHRcdFx0XHRpZihjb2wuZmllbGQgPT0gJ2NrJykgcmV0dXJuO1xyXG5cdFx0XHRcdHZhciBjb2x1bW4gPSB7XHJcblx0XHRcdFx0XHR3aWR0aCA6IGNvbC53aWR0aCxcclxuXHRcdFx0XHRcdGluZGV4IDogaVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0aWYoY29sLmhpZGRlbikge1xyXG5cdFx0XHRcdFx0Y29sdW1uLmhpZGRlbiA9IGNvbC5oaWRkZW5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnJvemVuQ29sdW1uc1tjb2wuZmllbGRdID0gY29sdW1uO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdHZhciBrZXkgPSBnZXRTdG9yZUtleShvcHRzKTtcclxuXHRcdGZteC5zdG9yZS5zZXQoa2V5LHtjb2x1bW5zIDogY29scyxmcm96ZW5Db2x1bW5zIDogZnJvemVuQ29sdW1uc30pO1xyXG5cdH1cclxuXHRcclxuXHQvKipcclxuXHQgKiB3cmFwIGFuZCByZXR1cm4gdGhlIGdyaWQgb2JqZWN0LCBmaWVsZHMgYW5kIGNvbHVtbnNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiB3cmFwR3JpZCh0YXJnZXQsIHJvd251bWJlcnMsIG9wdHMpIHtcclxuXHRcdGZ1bmN0aW9uIGdldENvbHVtbnMoKSB7XHJcblx0XHRcdHZhciBmcm96ZW5Db2x1bW5zID0gW107XHJcblx0XHRcdHZhciBjb2x1bW5zID0gW107XHJcblx0XHRcdHZhciBzdHI7XHJcblx0XHRcdCQodGFyZ2V0KS5jaGlsZHJlbigndGhlYWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR2YXIgb3B0ID0gJC5wYXJzZXIucGFyc2VPcHRpb25zKHRoaXMsIFt7IGZyb3plbjogJ2Jvb2xlYW4nIH1dKTtcclxuXHRcdFx0XHQkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHR2YXIgY29scyA9IFtdO1xyXG5cdFx0XHRcdFx0JCh0aGlzKS5maW5kKCd0aCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgdGggPSAkKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHR2YXIgY29sID0gJC5leHRlbmQoe30sICQucGFyc2VyLnBhcnNlT3B0aW9ucyh0aGlzLCBbXHJcblx0XHRcdFx0XHRcdFx0J2lkJywgJ2ZpZWxkJywgJ2FsaWduJywndmFsaWduJywnaGFsaWduJywnb3JkZXJCeScsICdvcmRlcicsICd3aWR0aCcsICdmb3JtYXQnLCdmb3JtYXR0ZXInLCdleHBvcnRGb3JtYXR0ZXInLCdleHBvcnRGb3JtYXQnLFxyXG5cdFx0XHRcdFx0XHRcdHsgc29ydGFibGU6ICdib29sZWFuJywgY2hlY2tib3g6ICdib29sZWFuJywgcmVzaXphYmxlOiAnYm9vbGVhbicsIGZpeGVkOiAnYm9vbGVhbicgfSxcclxuXHRcdFx0XHRcdFx0XHR7IHJvd3NwYW46ICdudW1iZXInLCBjb2xzcGFuOiAnbnVtYmVyJyB9XHJcblx0XHRcdFx0XHRcdF0pLCB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogKHRoLmh0bWwoKSB8fCB1bmRlZmluZWQpLFxyXG5cdFx0XHRcdFx0XHRcdFx0aGlkZGVuOiAodGguYXR0cignaGlkZGVuJykgPyB0cnVlIDogdW5kZWZpbmVkKSxcclxuXHRcdFx0XHRcdFx0XHRcdC8vZm9ybWF0dGVyOiAodGguYXR0cignZm9ybWF0dGVyJykgPyBldmFsKHRoLmF0dHIoJ2Zvcm1hdHRlcicpKSA6IHVuZGVmaW5lZCksXHJcblx0XHRcdFx0XHRcdFx0XHRzdHlsZXI6ICh0aC5hdHRyKCdzdHlsZXInKSA/IGV2YWwodGguYXR0cignc3R5bGVyJykpIDogdW5kZWZpbmVkKSxcclxuXHRcdFx0XHRcdFx0XHRcdHNvcnRlcjogKHRoLmF0dHIoJ3NvcnRlcicpID8gZXZhbCh0aC5hdHRyKCdzb3J0ZXInKSkgOiB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdGlmKGNvbC5pMThuKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29sLnRpdGxlID0gJC5mbi5pMThuLm1ldGhvZHMuZ2V0TWVzc2FnZShjb2wuaTE4bik7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKChzdHIgPSB0aC5hdHRyKCdmb3JtYXR0ZXInKSkpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoKHN0ciBpbiBvcHRzLmZvcm1hdHRlcnMpKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRjb2wuZm9ybWF0dGVyID0gb3B0cy5mb3JtYXR0ZXJzW3N0cl07XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbC5mb3JtYXR0ZXIgPSBldmFsKHN0cik7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGlmIChjb2wud2lkdGggJiYgU3RyaW5nKGNvbC53aWR0aCkuaW5kZXhPZignJScpID09IC0xKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29sLndpZHRoID0gcGFyc2VJbnQoY29sLndpZHRoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAoKHN0ciA9IHRoLmF0dHIoJ2NvZGV0eXBlJykpKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29sLmNvZGVUeXBlID0gc3RyO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoKHN0ciA9IHRoLmF0dHIoJ2VkaXRvcicpKSkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBzID0gJC50cmltKHN0cik7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHMuc3Vic3RyKDAsIDEpID09ICd7Jykge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y29sLmVkaXRvciA9IGV2YWwoJygnICsgcyArICcpJyk7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbC5lZGl0b3IgPSBzO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAodGguYXR0cihcInJlcXVpcmVkXCIpKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNvbC5lZGl0b3IgPT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRjb2wuZWRpdG9yID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6IGNvbC5lZGl0b3JcclxuXHRcdFx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdGlmIChjb2wuZWRpdG9yLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y29sLmVkaXRvci50eXBlID0gXCJ2YWxpZGF0ZWJveFwiO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFjb2wuZWRpdG9yLm9wdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y29sLmVkaXRvci5vcHRpb25zID0ge307XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRjb2wuZWRpdG9yLm9wdGlvbnMucmVxdWlyZWQgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZihjb2wuY29kZVR5cGUpe1xyXG5cdFx0XHRcdFx0XHRcdCAgIGlmICh0eXBlb2YgY29sLmVkaXRvciA9PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgY29sLmVkaXRvciA9IHtcclxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNvbC5lZGl0b3JcclxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICB9O1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICB9XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIGlmICghY29sLmVkaXRvci5vcHRpb25zKSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgY29sLmVkaXRvci5vcHRpb25zID0ge307XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIH1cclxuXHRcdFx0XHQgICAgICAgICAgICAgICAgaWYoIWNvbC5lZGl0b3Iub3B0aW9ucy5jb2RlVHlwZSl7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgY29sLmVkaXRvci5vcHRpb25zLmNvZGVUeXBlID0gY29sLmNvZGVUeXBlO1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICB9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRjb2xzLnB1c2goY29sKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdG9wdC5mcm96ZW4gPyBmcm96ZW5Db2x1bW5zLnB1c2goY29scykgOiBjb2x1bW5zLnB1c2goY29scyk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gW2Zyb3plbkNvbHVtbnMsIGNvbHVtbnNdO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBwYW5lbCA9ICQoXHJcblx0XHRcdCc8ZGl2IGNsYXNzPVwiZGF0YWdyaWQtd3JhcFwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLXZpZXdcIj4nICtcclxuXHRcdFx0JzxkaXYgY2xhc3M9XCJkYXRhZ3JpZC12aWV3MVwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWhlYWRlclwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWhlYWRlci1pbm5lclwiPjwvZGl2PicgK1xyXG5cdFx0XHQnPC9kaXY+JyArXHJcblx0XHRcdCc8ZGl2IGNsYXNzPVwiZGF0YWdyaWQtYm9keVwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWJvZHktaW5uZXJcIj48L2Rpdj4nICtcclxuXHRcdFx0JzwvZGl2PicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWZvb3RlclwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWZvb3Rlci1pbm5lclwiPjwvZGl2PicgK1xyXG5cdFx0XHQnPC9kaXY+JyArXHJcblx0XHRcdCc8L2Rpdj4nICtcclxuXHRcdFx0JzxkaXYgY2xhc3M9XCJkYXRhZ3JpZC12aWV3MlwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWhlYWRlclwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWhlYWRlci1pbm5lclwiPjwvZGl2PicgK1xyXG5cdFx0XHQnPC9kaXY+JyArXHJcblx0XHRcdCc8ZGl2IGNsYXNzPVwiZGF0YWdyaWQtYm9keVwiPjwvZGl2PicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWZvb3RlclwiPicgK1xyXG5cdFx0XHQnPGRpdiBjbGFzcz1cImRhdGFncmlkLWZvb3Rlci1pbm5lclwiPjwvZGl2PicgK1xyXG5cdFx0XHQnPC9kaXY+JyArXHJcblx0XHRcdCc8L2Rpdj4nICtcclxuXHRcdFx0JzwvZGl2PicgK1xyXG5cdFx0XHQnPC9kaXY+J1xyXG5cdFx0KS5pbnNlcnRBZnRlcih0YXJnZXQpO1xyXG5cclxuXHRcdHBhbmVsLnBhbmVsKHtcclxuXHRcdFx0ZG9TaXplOiBmYWxzZSxcclxuXHRcdFx0Y2xzOiAnZGF0YWdyaWQnXHJcblx0XHR9KTtcclxuXHJcblx0XHQkKHRhcmdldCkuYWRkQ2xhc3MoJ2RhdGFncmlkLWYnKS5oaWRlKCkuYXBwZW5kVG8ocGFuZWwuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC12aWV3JykpO1xyXG5cclxuXHRcdHZhciBjYyA9IGdldENvbHVtbnMoKTtcclxuXHRcdHZhciB2aWV3ID0gcGFuZWwuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC12aWV3Jyk7XHJcblx0XHR2YXIgdmlldzEgPSB2aWV3LmNoaWxkcmVuKCdkaXYuZGF0YWdyaWQtdmlldzEnKTtcclxuXHRcdHZhciB2aWV3MiA9IHZpZXcuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC12aWV3MicpO1xyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdHBhbmVsOiBwYW5lbCxcclxuXHRcdFx0ZnJvemVuQ29sdW1uczogY2NbMF0sXHJcblx0XHRcdGNvbHVtbnM6IGNjWzFdLFxyXG5cdFx0XHRkYzoge1x0Ly8gc29tZSBkYXRhIGNvbnRhaW5lclxyXG5cdFx0XHRcdHZpZXc6IHZpZXcsXHJcblx0XHRcdFx0dmlldzE6IHZpZXcxLFxyXG5cdFx0XHRcdHZpZXcyOiB2aWV3MixcclxuXHRcdFx0XHRoZWFkZXIxOiB2aWV3MS5jaGlsZHJlbignZGl2LmRhdGFncmlkLWhlYWRlcicpLmNoaWxkcmVuKCdkaXYuZGF0YWdyaWQtaGVhZGVyLWlubmVyJyksXHJcblx0XHRcdFx0aGVhZGVyMjogdmlldzIuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC1oZWFkZXInKS5jaGlsZHJlbignZGl2LmRhdGFncmlkLWhlYWRlci1pbm5lcicpLFxyXG5cdFx0XHRcdGJvZHkxOiB2aWV3MS5jaGlsZHJlbignZGl2LmRhdGFncmlkLWJvZHknKS5jaGlsZHJlbignZGl2LmRhdGFncmlkLWJvZHktaW5uZXInKSxcclxuXHRcdFx0XHRib2R5MjogdmlldzIuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC1ib2R5JyksXHJcblx0XHRcdFx0Zm9vdGVyMTogdmlldzEuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC1mb290ZXInKS5jaGlsZHJlbignZGl2LmRhdGFncmlkLWZvb3Rlci1pbm5lcicpLFxyXG5cdFx0XHRcdGZvb3RlcjI6IHZpZXcyLmNoaWxkcmVuKCdkaXYuZGF0YWdyaWQtZm9vdGVyJykuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC1mb290ZXItaW5uZXInKVxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdH1cclxuXHQvLyB1c2UgY2FjaGVkIGVkaXRvcnNcclxuXHQoZnVuY3Rpb24gY2FjaGVFZGl0b3JzKCkge1xyXG5cdFx0Zm9yICh2YXIgZWRpdG9yVHlwZSBpbiAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmVkaXRvcnMpIHtcclxuXHRcdFx0dmFyIGVkaXRvciA9ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMuZWRpdG9yc1tlZGl0b3JUeXBlXTtcclxuXHRcdFx0JC5leHRlbmQoZWRpdG9yLCB7XHJcblx0XHRcdFx0X2dldFZhbHVlOiBlZGl0b3IuZ2V0VmFsdWUsXHJcblx0XHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IHRoaXMuX2dldFZhbHVlKHRhcmdldCk7XHJcblx0XHRcdFx0XHRpZiAoJC50cmltKHZhbHVlKSA9PT0gXCJcIikge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiB2YWx1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0pKCk7XHJcblx0XHJcblx0JC5mbi5fZGF0YWdyaWQgPSAkLmZuLmRhdGFncmlkO1xyXG5cdCQuZm4uZGF0YWdyaWQgPSBmdW5jdGlvbiAob3B0aW9ucywgcGFyYW0pIHtcclxuXHRcdGlmICh0eXBlb2Ygb3B0aW9ucyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gJC5mbi5kYXRhZ3JpZC5tZXRob2RzW29wdGlvbnNdKHRoaXMsIHBhcmFtKTtcclxuXHRcdH1cclxuXHJcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHRcdHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR2YXIgc3RhdGUgPSAkLmRhdGEodGhpcywgJ2RhdGFncmlkJyksIG9wdHM7XHJcblx0XHRcdGlmIChzdGF0ZSkge1xyXG5cdFx0XHRcdG9wdHMgPSAkLmV4dGVuZChzdGF0ZS5vcHRpb25zLCBvcHRpb25zKTtcclxuXHRcdFx0XHRzdGF0ZS5vcHRpb25zID0gb3B0cztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRvcHRzID0gJC5leHRlbmQoe30sICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLCB7IHF1ZXJ5UGFyYW1zOiB7fSB9KSwgJC5mbi5kYXRhZ3JpZC5wYXJzZU9wdGlvbnModGhpcyksIG9wdGlvbnMpO1xyXG5cdFx0XHRcdCQodGhpcykuY3NzKCd3aWR0aCcsICcnKS5jc3MoJ2hlaWdodCcsICcnKTtcclxuXHJcblx0XHRcdFx0dmFyIHdyYXBSZXN1bHQgPSB3cmFwR3JpZCh0aGlzLCBvcHRzLnJvd251bWJlcnMsIG9wdHMpO1xyXG5cdFx0XHRcdGlmICghb3B0cy5jb2x1bW5zKSBvcHRzLmNvbHVtbnMgPSB3cmFwUmVzdWx0LmNvbHVtbnM7XHJcblx0XHRcdFx0aWYgKCFvcHRzLmZyb3plbkNvbHVtbnMpIG9wdHMuZnJvemVuQ29sdW1ucyA9IHdyYXBSZXN1bHQuZnJvemVuQ29sdW1ucztcclxuXHRcdFx0XHRvcHRzLmNvbHVtbnMgPSAkLmV4dGVuZCh0cnVlLCBbXSwgb3B0cy5jb2x1bW5zKTtcclxuXHRcdFx0XHRvcHRzLmZyb3plbkNvbHVtbnMgPSAkLmV4dGVuZCh0cnVlLCBbXSwgb3B0cy5mcm96ZW5Db2x1bW5zKTtcclxuXHRcdFx0XHRyZXN0b3JlQ29sdW1ucyhvcHRzKTtcclxuXHRcdFx0XHR2YXIgYWxsQ29sdW1ucyA9IFtdLCBmaWVsZENvZGVUeXBlcyA9IHt9O1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb3B0cy5mcm96ZW5Db2x1bW5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShhbGxDb2x1bW5zLCBvcHRzLmZyb3plbkNvbHVtbnNbaV0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG9wdHMuY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYWxsQ29sdW1ucywgb3B0cy5jb2x1bW5zW2ldKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFyIGhhc0VkaXRvciA9IGZhbHNlO1xyXG5cdFx0XHRcdCQuZWFjaChhbGxDb2x1bW5zLCBmdW5jdGlvbiAoaSwgY29sKSB7XHJcblx0XHRcdFx0XHRpZiAoY29sLmNvZGVUeXBlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb2wuZm9ybWF0dGVyKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29sLl9mb3JtYXR0ZXIgPSBjb2wuZm9ybWF0dGVyO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGNvbC5mb3JtYXR0ZXIgPSAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmZvcm1hdHRlcjtcclxuXHRcdFx0XHRcdFx0ZmllbGRDb2RlVHlwZXNbY29sLmZpZWxkXSA9IGNvbC5jb2RlVHlwZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChjb2wuc29ydGFibGUgPT0gdW5kZWZpbmVkIHx8IGNvbC5zb3J0YWJsZSA9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdGNvbC5zb3J0YWJsZSA9IHRydWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIChjb2wuZm9ybWF0dGVyKSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRjb2wuZm9ybWF0dGVyID0gb3B0cy5mb3JtYXR0ZXJzW2NvbC5mb3JtYXR0ZXJdO1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmICghY29sLmZvcm1hdHRlciAmJiBjb2wuZm9ybWF0KSB7XHJcblx0XHRcdFx0XHRcdGNvbC5mb3JtYXR0ZXIgPSBvcHRzLmZvcm1hdHRlcnMucmVwbGFjZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmKGNvbC5lZGl0b3Ipe1xyXG5cdFx0XHRcdFx0ICBoYXNFZGl0b3IgPSB0cnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGlmIChvcHRzLmNoZWNrYm94ICE9PSBmYWxzZSkge1xyXG5cdFx0XHRcdFx0aWYob3B0cy5mcm96ZW5DaGVja2JveCl7XHJcblx0XHRcdFx0XHRcdGlmIChvcHRzLmZyb3plbkNvbHVtbnMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRcdFx0XHRvcHRzLmZyb3plbkNvbHVtbnMgPSBbW11dO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdG9wdHMuZnJvemVuQ29sdW1uc1swXS51bnNoaWZ0KHtcclxuXHRcdFx0XHRcdFx0XHRmaWVsZDogXCJja1wiLFxyXG5cdFx0XHRcdFx0XHRcdGNoZWNrYm94OiB0cnVlXHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fWVsc2Uge1xyXG5cdFx0XHRcdFx0XHRpZiAob3B0cy5jb2x1bW5zLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdFx0XHRcdFx0b3B0cy5jb2x1bW5zID0gW1tdXTtcclxuXHRcdFx0XHRcdFx0fVx0XHJcblx0XHRcdFx0XHRcdG9wdHMuY29sdW1uc1swXS51bnNoaWZ0KHtcclxuXHRcdFx0XHRcdFx0XHRmaWVsZDogXCJja1wiLFxyXG5cdFx0XHRcdFx0XHRcdGNoZWNrYm94OiB0cnVlXHJcblx0XHRcdFx0XHRcdH0pO1x0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHQkLmRhdGEodGhpcywnZWRpdGFibGUnLGhhc0VkaXRvcik7XHJcblx0XHRcdFx0aWYob3B0cy5jb2RlKXtcclxuXHRcdFx0XHQgICB2YXIgZWRpdGFibGUgPSBmbXguY2hlY2tGdW5jdGlvbkF1dGhvcml6YXRpb24ob3B0cy5jb2RlKTtcclxuXHRcdFx0XHQgICAkLmRhdGEodGhpcywnZWRpdGFibGUnLGVkaXRhYmxlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0b3B0cy5maWVsZENvZGVUeXBlcyA9IGZpZWxkQ29kZVR5cGVzO1xyXG5cdFx0XHRcdC8vb3B0cy52aWV3ID0gJC5leHRlbmQoe30sIG9wdHMudmlldyk7XHJcblx0XHRcdFx0JC5kYXRhKHRoaXMsICdkYXRhZ3JpZCcsIHtcclxuXHRcdFx0XHRcdG9wdGlvbnM6IG9wdHMsXHJcblx0XHRcdFx0XHRwYW5lbDogd3JhcFJlc3VsdC5wYW5lbCxcclxuXHRcdFx0XHRcdGRjOiB3cmFwUmVzdWx0LmRjLFxyXG5cdFx0XHRcdFx0c3M6IG51bGwsXHJcblx0XHRcdFx0XHRzZWxlY3RlZFJvd3M6IFtdLFxyXG5cdFx0XHRcdFx0Y2hlY2tlZFJvd3M6IFtdLFxyXG5cdFx0XHRcdFx0ZGF0YTogeyB0b3RhbDogMCwgcm93czogW10gfSxcclxuXHRcdFx0XHRcdG9yaWdpbmFsUm93czogW10sXHJcblx0XHRcdFx0XHR1cGRhdGVkUm93czogW10sXHJcblx0XHRcdFx0XHRpbnNlcnRlZFJvd3M6IFtdLFxyXG5cdFx0XHRcdFx0ZGVsZXRlZFJvd3M6IFtdXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0b3B0cy5fYXV0b0xvYWQgPSBmYWxzZTtcclxuXHRcdFx0aWYob3B0cy5tYXNraXQgJiYgdHlwZW9mIG9wdHMubWFza2l0ID09ICdzdHJpbmcnKXtcclxuXHRcdFx0XHRvcHRzLm1hc2tpdCA9IGZteC51dGlscy5nZXRKcXVlcnkob3B0cy5tYXNraXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQuZm4uX2RhdGFncmlkLmNhbGwoJCh0aGlzKSwge30pO1xyXG5cdFx0XHQvL2FmdGVyIGluaXRpYWxcclxuXHRcdFx0YWZ0ZXJJbml0aWFsKHRoaXMpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHRmdW5jdGlvbiBhZnRlckluaXRpYWwodGFyZ2V0KSB7XHJcblx0XHR2YXIgc3RhdGUgPSAkLmRhdGEodGFyZ2V0LCdkYXRhZ3JpZCcpO1xyXG5cdFx0aWYoc3RhdGUub3B0aW9ucy5zaW5nbGVTZWxlY3QgJiYgc3RhdGUub3B0aW9ucy5jaGVja2JveCAhPT0gZmFsc2Upe1xyXG5cdFx0XHQvL2hpZGRlbiBoZWFkZXIgY2hlY2tib3ggZm9yIHNpbmdsZSBzZWxlY3RcclxuXHRcdFx0dmFyIHZpZXcgPSBzdGF0ZS5vcHRpb25zLmZyb3plbkNoZWNrYm94ID8gc3RhdGUuZGMuaGVhZGVyMSA6IHN0YXRlLmRjLmhlYWRlcjI7XHJcblx0XHRcdGlmKHZpZXcpIHZpZXcuZmluZCgnLmRhdGFncmlkLWhlYWRlci1jaGVjaycpLmNzcyh7dmlzaWJpbGl0eTpcImhpZGRlblwifSlcclxuXHRcdH1cclxuXHRcdHN0YXRlLm9wdGlvbnMuX2luaXRpYWxpemVkID0gdHJ1ZTtcclxuXHR9XHJcblx0ZnVuY3Rpb24gY2FuRWRpdCh0YXJnZXQpIHtcclxuXHQgIGlmKCEkLmRhdGEodGFyZ2V0LCdlZGl0YWJsZScpKXtcclxuXHQgICAgcmV0dXJuIGZhbHNlO1xyXG5cdCAgfVxyXG5cdCAgdmFyIHN0YXRlID0gJC5kYXRhKHRhcmdldCwnZGF0YWdyaWQnKTtcclxuXHQgIGlmKHN0YXRlICYmIHN0YXRlLm9wdGlvbnMucmVhZG9ubHkpIHJldHVybiBmYWxzZTtcclxuXHQgIHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQkLmV4dGVuZCgkLmZuLmRhdGFncmlkLCAkLmZuLl9kYXRhZ3JpZCk7XHJcblx0dmFyIF9iZWdpbkVkaXQgPSAkLmZuLmRhdGFncmlkLm1ldGhvZHMuYmVnaW5FZGl0O1xyXG5cdHZhciBfZW5kRWRpdCA9ICQuZm4uZGF0YWdyaWQubWV0aG9kcy5lbmRFZGl0O1xyXG5cdHZhciBfZml0Q29sdW1ucyA9ICQuZm4uZGF0YWdyaWQubWV0aG9kcy5maXRDb2x1bW5zO1xyXG5cdCQuZXh0ZW5kKCQuZm4uZGF0YWdyaWQubWV0aG9kcywge1xyXG5cdCAgZml0Q29sdW1uczogZnVuY3Rpb24oanEpe1xyXG5cdFx0ICBfZml0Q29sdW1ucyhqcSk7XHJcblx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbigpe1xyXG5cdFx0XHRzdG9yZUNvbHVtbnNJbmZvKHRoaXMpO1xyXG5cdFx0fSk7XHJcblx0ICB9LFx0XHJcblx0ICBiZWdpbkVkaXQgOiBmdW5jdGlvbihqcSxpbmRleCl7XHJcblx0ICAgIHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCl7XHJcblx0ICAgICAgLy9jb25zb2xlLmxvZyhcImJlZ2luRWRpdDpcIitpbmRleCk7XHJcblx0ICAgICAgaWYoY2FuRWRpdCh0aGlzKSl7XHJcblx0ICAgICAgICBfYmVnaW5FZGl0KCQodGhpcyksaW5kZXgpO1xyXG5cdCAgICAgICAgJC5kYXRhKHRoaXMsJ2N1cnJlbnRSb3cnLGluZGV4KTtcclxuXHQgICAgICB9XHJcblx0ICAgIH0pO1xyXG5cdCAgfSxcclxuXHQgIGVuZEVkaXQ6IGZ1bmN0aW9uKGpxLGluZGV4KXtcclxuXHQgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oKXtcclxuXHQgICAgICBfZW5kRWRpdCgkKHRoaXMpLGluZGV4KTtcclxuXHQgICAgICB2YXIgY3VyUm93ID0gJC5kYXRhKHRoaXMsJ2N1cnJlbnRSb3cnKTtcclxuXHQgICAgICAvL2NvbnNvbGUubG9nKFwiZW5kRWRpdDpcIitpbmRleCk7XHJcblx0ICAgICAgaWYoY3VyUm93ID09IGluZGV4KSAkLnJlbW92ZURhdGEodGhpcywnY3VycmVudFJvdycpO1xyXG5cdCAgICB9KTtcclxuXHQgIH0sXHJcblxyXG5cdFx0Y29tbW9uUXVlcnk6IGZ1bmN0aW9uIChqcSwgcXVlcnlJbmZvKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuXHRcdFx0XHR2YXIgb3B0aW9ucyA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcIm9wdGlvbnNcIik7XHJcblx0XHRcdFx0b3B0aW9ucy5jb21tb25RdWVyeUZpZWxkcyA9IG51bGw7XHJcblx0XHRcdFx0aWYgKHF1ZXJ5SW5mbykge1xyXG5cdFx0XHRcdFx0aWYgKHF1ZXJ5SW5mby5wYXJhbUZvcm0pIHtcclxuXHRcdFx0XHRcdFx0b3B0aW9ucy5wYXJhbUZvcm0gPSBxdWVyeUluZm8ucGFyYW1Gb3JtO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHF1ZXJ5SW5mby5xdWVyeUZpZWxkcykge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25zLmNvbW1vblF1ZXJ5RmllbGRzID0gcXVlcnlJbmZvLnF1ZXJ5RmllbGRzO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHF1ZXJ5SW5mby5xdWVyeSkge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25zLnF1ZXJ5ID0gcXVlcnlJbmZvLnF1ZXJ5O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHF1ZXJ5SW5mby5vcmRlckJ5KSB7XHJcblx0XHRcdFx0XHRcdG9wdGlvbnMub3JkZXJCeSA9IHF1ZXJ5SW5mby5vcmRlckJ5O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYocXVlcnlJbmZvLnR4TWFuYWdlcikge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25zLnR4TWFuYWdlciA9IHF1ZXJ5SW5mby50eE1hbmFnZXI7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICgkZGF0YWdyaWQuaGFzQ2xhc3MoXCJlYXN5dWktdHJlZWdyaWRcIikpIHtcclxuXHRcdFx0XHRcdCRkYXRhZ3JpZC50cmVlZ3JpZChcInJlbG9hZFwiKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwibG9hZFwiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHRcdHNldFF1ZXJ5RmllbGRzOiBmdW5jdGlvbiAoanEsIHF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRhdGFncmlkKFwib3B0aW9uc1wiKS5xdWVyeUZpZWxkcyA9IHF1ZXJ5RmllbGRzO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblx0ICAgIGdldFNlbGVjdGVkSW5kZXg6IGZ1bmN0aW9uIChqcSkge1xyXG5cdCAgICAgIHZhciAkZGF0YWdyaWQgPSAkKGpxWzBdKTtcclxuXHQgICAgICByZXR1cm4gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0Um93SW5kZXhcIiwgJGRhdGFncmlkXHJcblx0ICAgICAgICAgIC5kYXRhZ3JpZChcImdldFNlbGVjdGVkXCIpKTtcclxuXHQgICAgfSxcdFx0XHJcblx0XHRnZXRTZWxlY3Rpb25zSW5kZXg6IGZ1bmN0aW9uIChqcSkge1xyXG5cdFx0XHR2YXIgJGRhdGFncmlkID0gJChqcVswXSk7XHJcblx0XHRcdHZhciByb3dzID0gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0U2VsZWN0aW9uc1wiKTtcclxuXHRcdFx0dmFyIHNlbGVjdGlvbnNJbmRleCA9IFtdO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJvd3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRzZWxlY3Rpb25zSW5kZXhcclxuXHRcdFx0XHRcdC5wdXNoKCRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldFJvd0luZGV4XCIsIHJvd3NbaV0pKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc2VsZWN0aW9uc0luZGV4O1xyXG5cdFx0fSxcclxuXHJcblx0XHRzZXRDdXJyZW50Um93OiBmdW5jdGlvbiAoanEsIGluZGV4KSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRpZiAoaW5kZXggPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHQvLyQodGhpcykucmVtb3ZlRGF0YShcImN1cnJlbnRSb3dcIik7XHJcblx0XHRcdFx0ICAkLnJlbW92ZURhdGEoanFbMF0sJ2N1cnJlbnRSb3cnKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Ly8kKHRoaXMpLmRhdGEoXCJjdXJyZW50Um93XCIsIGluZGV4KTtcclxuXHRcdFx0XHQgICQuZGF0YShqcVswXSwnY3VycmVudFJvdycsaW5kZXgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cdFx0Z2V0Q3VycmVudFJvdzogZnVuY3Rpb24gKGpxKSB7XHJcblx0XHQgIHJldHVybiAkLmRhdGEoanFbMF0sJ2N1cnJlbnRSb3cnKTtcclxuXHRcdFx0Ly9yZXR1cm4gJChqcVswXSkuZGF0YShcImN1cnJlbnRSb3dcIik7XHJcblx0XHR9LFxyXG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uIChqcSkge1xyXG5cdFx0XHR2YXIgJGRhdGFncmlkID0gJChqcVswXSk7XHJcblx0XHRcdHZhciBpbmRleCA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldEN1cnJlbnRSb3dcIik7XHJcblx0XHRcdGlmIChpbmRleCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gJGRhdGFncmlkLmRhdGFncmlkKFwidmFsaWRhdGVSb3dcIiwgaW5kZXgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSxcclxuXHRcdFxyXG5cdFx0Zm9yY2VFbmRFZGl0OiBmdW5jdGlvbiAoanEsIGluZGV4KSB7XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuXHRcdFx0XHRpZiAoaW5kZXggPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRpbmRleCA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldEN1cnJlbnRSb3dcIik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKGluZGV4ID49IDApIHtcclxuXHRcdFx0XHQgICRkYXRhZ3JpZC5kYXRhZ3JpZChcImVuZEVkaXRcIixpbmRleCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdCRkYXRhZ3JpZC5kYXRhZ3JpZChcInNldEN1cnJlbnRSb3dcIiwgdW5kZWZpbmVkKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cdFx0X2dldENoYW5nZXMgOiAkLmZuLmRhdGFncmlkLm1ldGhvZHMuZ2V0Q2hhbmdlcyxcclxuXHQgICAgZ2V0Q2hhbmdlczogZnVuY3Rpb24gKGpxLCB0eXBlKSB7XHJcblx0ICAgICAgICB2YXIgJGRhdGFncmlkID0gJChqcVswXSk7XHJcblx0ICAgICAgICB0aGlzLmZvcmNlRW5kRWRpdChqcSk7XHJcblx0ICAgICAgICB2YXIgaW5zZXJ0ZWRSb3dzID0gdGhpcy5fZ2V0Q2hhbmdlcyhqcSwgXCJpbnNlcnRlZFwiKTtcclxuXHQgICAgICAgIHZhciB1cGRhdGVkUm93cyA9IHRoaXMuX2dldENoYW5nZXMoanEsIFwidXBkYXRlZFwiKTtcclxuXHQgICAgICAgIHZhciBkZWxldGVkUm93cyA9IHRoaXMuX2dldENoYW5nZXMoanEsIFwiZGVsZXRlZFwiKTtcclxuXHQgICAgICAgICQuZWFjaChpbnNlcnRlZFJvd3MsIGZ1bmN0aW9uIChpbmRleCwgcm93KSB7XHJcblx0ICAgICAgICAgICAgcm93Lm1vZGVsU3RhdGUgPSBcIkFkZGVkXCI7XHJcblx0ICAgICAgICB9KTtcclxuXHQgICAgICAgICQuZWFjaCh1cGRhdGVkUm93cywgZnVuY3Rpb24gKGluZGV4LCByb3cpIHtcclxuXHQgICAgICAgICAgICByb3cubW9kZWxTdGF0ZSA9IFwiTW9kaWZpZWRcIjtcclxuXHQgICAgICAgIH0pO1xyXG5cdCAgICAgICAgJC5lYWNoKGRlbGV0ZWRSb3dzLCBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG5cdCAgICAgICAgICAgIHJvdy5tb2RlbFN0YXRlID0gXCJEZWxldGVkXCI7XHJcblx0ICAgICAgICB9KTtcclxuXHQgICAgICAgIHZhciBkYXRhO1xyXG5cdCAgICAgICAgaWYgKCF0eXBlKSB7XHJcblx0ICAgICAgICBcdGRhdGE9W107XHJcblx0ICAgICAgICBcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGRhdGEsIGluc2VydGVkUm93cyk7XHJcblx0ICAgICAgICBcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGRhdGEsIHVwZGF0ZWRSb3dzKTtcclxuXHQgICAgICAgIFx0dmFyIHJvdztcclxuXHQgICAgICAgICAgICBmb3IodmFyIGkgPSAwO2k8ZGVsZXRlZFJvd3MubGVuZ3RoO2krKykge1xyXG5cdCAgICAgICAgICAgIFx0cm93ID0gZGVsZXRlZFJvd3NbaV07XHJcblx0ICAgICAgICAgICAgXHRpZihkYXRhLmluZGV4T2Yocm93KSA9PSAtMSkge1xyXG5cdCAgICAgICAgICAgIFx0XHRkYXRhLnB1c2gocm93KTtcclxuXHQgICAgICAgICAgICBcdH1cclxuXHQgICAgICAgICAgICB9XHJcblx0ICAgICAgICB9IGVsc2Uge1xyXG5cdCAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG5cdCAgICAgICAgICAgICAgICBjYXNlIFwiaW5zZXJ0ZWRcIjpcclxuXHQgICAgICAgICAgICAgICAgICAgIGRhdGEgPSBpbnNlcnRlZFJvd3M7XHJcblx0ICAgICAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVkXCI6XHJcblx0ICAgICAgICAgICAgICAgICAgICBkYXRhID0gdXBkYXRlZFJvd3M7XHJcblx0ICAgICAgICAgICAgICAgIGNhc2UgXCJkZWxldGVkXCI6XHJcblx0ICAgICAgICAgICAgICAgICAgICBkYXRhID0gZGVsZXRlZFJvd3M7XHJcblx0ICAgICAgICAgICAgfVxyXG5cdCAgICAgICAgfVxyXG5cdCAgICAgICAgcmV0dXJuIGRhdGE7XHJcblx0ICAgIH0sXHRcdFxyXG4gICAgXHRfcmVsb2FkIDogJC5mbi5kYXRhZ3JpZC5tZXRob2RzLnJlbG9hZCxcclxuICAgIFx0cmVsb2FkIDogZnVuY3Rpb24oanEscGFyYW1zKXtcclxuICAgIFx0XHRpZihwYXJhbXMgPT0gdHJ1ZSl7XHJcbiAgICBcdFx0XHQkLmZuLmRhdGFncmlkLm1ldGhvZHMucXVlcnkoanEpO1xyXG4gICAgXHRcdH1lbHNle1xyXG4gICAgXHRcdFx0anEuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgXHRcdFx0XHR2YXIgc3RhdGUgPSAkLmRhdGEodGhpcywnZGF0YWdyaWQnKTtcclxuICAgIFx0XHRcdFx0aWYoIXN0YXRlLm9wdGlvbnMucGFnZU51bWJlcil7XHJcbiAgICBcdFx0XHRcdFx0c3RhdGUub3B0aW9ucy5wYWdlTnVtYmVyID0gMTtcclxuICAgIFx0XHRcdFx0fVxyXG4gICAgXHRcdFx0fSk7XHJcbiAgICBcdFx0XHQkLmZuLmRhdGFncmlkLm1ldGhvZHMuX3JlbG9hZChqcSxwYXJhbXMpO1xyXG4gICAgXHRcdH1cclxuICAgIFx0XHRyZXR1cm4ganE7XHJcbiAgICBcdH0sXHJcblx0XHRxdWVyeTogZnVuY3Rpb24gKGpxLHBhcmFtcykge1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dmFyICRkYXRhZ3JpZCA9ICQodGhpcyksb3B0aW9ucztcclxuXHRcdFx0XHRpZiAoJGRhdGFncmlkLmhhc0NsYXNzKFwiZWFzeXVpLXRyZWVncmlkXCIpKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zID0gJGRhdGFncmlkLnRyZWVncmlkKFwib3B0aW9uc1wiKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0b3B0aW9ucyA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcIm9wdGlvbnNcIik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKG9wdGlvbnMuc29ydE9yZGVyIHx8IG9wdGlvbnMuc29ydE5hbWUpe1xyXG5cdFx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0UGFuZWxcIilcclxuXHRcdFx0XHRcdCAgICAgICAgIC5jaGlsZHJlbihcIi5kYXRhZ3JpZC12aWV3XCIpXHJcblx0XHRcdFx0XHRcdCAgICAgLmNoaWxkcmVuKFwiLmRhdGFncmlkLXZpZXcxLC5kYXRhZ3JpZC12aWV3MlwiKVxyXG5cdFx0XHRcdFx0XHQgICAgIC5jaGlsZHJlbihcIi5kYXRhZ3JpZC1oZWFkZXJcIilcclxuXHRcdFx0XHRcdFx0ICAgICAuZmluZChcIi5kYXRhZ3JpZC1jZWxsXCIpLnJlbW92ZUNsYXNzKFwiZGF0YWdyaWQtc29ydC1hc2MgZGF0YWdyaWQtc29ydC1kZXNjXCIpXHJcblx0XHRcdFx0XHRcdCAgICAgLmZpbmQoXCIuZGF0YWdyaWQtc29ydC1jb3VudFwiKS5yZW1vdmUoKTtcclxuXHRcdFx0XHRcdG9wdGlvbnMuc29ydE5hbWUgPSB1bmRlZmluZWQ7XHJcblx0XHRcdFx0XHRvcHRpb25zLnNvcnRPcmRlciA9IHVuZGVmaW5lZDtcclxuXHRcdFx0XHRcdG9wdGlvbnMuc29ydENvdW50ID0gdW5kZWZpbmVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoJGRhdGFncmlkLmhhc0NsYXNzKFwiZWFzeXVpLXRyZWVncmlkXCIpKSB7XHJcblx0XHRcdFx0XHQkZGF0YWdyaWQudHJlZWdyaWQoXCJyZWxvYWRcIixwYXJhbXMpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJsb2FkXCIscGFyYW1zKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHJcblx0XHRleHBvcnRFeGNlbDogZnVuY3Rpb24gKGpxLCBjdXJyZW50UGFnZU9ubHkpIHtcclxuXHRcdFx0ZnVuY3Rpb24gZ2V0Rm9ybWF0dGVyKG9wdHMsY29sT3B0KSB7XHJcblx0XHRcdFx0aWYoIWNvbE9wdC5mb3JtYXR0ZXIpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBmbXR0ZXI7XHJcblx0XHRcdFx0JC5lYWNoKG9wdHMuZm9ybWF0dGVycyxmdW5jdGlvbihrLHYpe1xyXG5cdFx0XHRcdFx0aWYodiA9PSBjb2xPcHQuZm9ybWF0dGVyKXtcclxuXHRcdFx0XHRcdFx0Zm10dGVyID0gaztcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGlmKGZtdHRlcil7XHJcblx0XHRcdFx0XHRyZXR1cm4gZm10dGVyO1xyXG5cdFx0XHRcdH1lbHNlIGlmKGNvbE9wdC5mb3JtYXR0ZXIgaW5zdGFuY2VvZiBTdHJpbmcpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIGNvbE9wdC5mb3JtYXR0ZXI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR2YXIgJGRhdGFncmlkID0gJCh0aGlzKSwgb3B0cyA9ICRkYXRhZ3JpZC5kYXRhZ3JpZCgnb3B0aW9ucycpO1xyXG5cdFx0XHRcdGlmICghb3B0cy5xdWVyeSkge1xyXG5cdFx0XHRcdFx0JC5tZXNzYWdlci5hbGVydChcIk1lc3NhZ2VcIiwgJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5leHBvcnRFeGNlbEVycm9yTXNnLCBcIndhcm5pbmdcIik7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fSBlbHNlIGlmICghb3B0cy5xdWVyeUluZm8pIHJldHVybjtcclxuXHRcdFx0XHR2YXIgZXhwb3J0SW5mbyA9IHtcclxuXHRcdFx0XHRcdHBhcmFtczogJC5leHRlbmQoe30sIG9wdHMuZXhwb3J0UGFyYW1zKSxcclxuXHRcdFx0XHRcdHR5cGU6IG9wdHMuZXhwb3J0VHlwZSB8fCAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmV4cG9ydFR5cGUsXHJcblx0XHRcdFx0XHRmaWxlTmFtZTogb3B0cy5leHBvcnRGaWxlbmFtZSxcclxuXHRcdFx0XHRcdHRlbXBsYXRlOiBvcHRzLmV4cG9ydFRlbXBsYXRlXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHR2YXIgcXVlcnlJbmZvID0gJC5leHRlbmQodHJ1ZSwge30sIG9wdHMucXVlcnlJbmZvKSwgY29sdW1ucyA9IFtdO1xyXG5cdFx0XHRcdGlmICghY3VycmVudFBhZ2VPbmx5KSB7XHJcblx0XHRcdFx0XHRxdWVyeUluZm8ucGFnaW5nSW5mbyA9IG51bGw7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciAkaGVhZGVyVHIgPSAkZGF0YWdyaWQuZGF0YWdyaWQoXCJnZXRQYW5lbFwiKS5jaGlsZHJlbihcIi5kYXRhZ3JpZC12aWV3XCIpLmNoaWxkcmVuKFwiLmRhdGFncmlkLXZpZXcxLC5kYXRhZ3JpZC12aWV3MlwiKS5jaGlsZHJlbihcIi5kYXRhZ3JpZC1oZWFkZXJcIikuZmluZChcInRyXCIpO1xyXG5cdFx0XHRcdCQuZWFjaCgkZGF0YWdyaWQuZGF0YWdyaWQoXCJnZXRDb2x1bW5GaWVsZHNcIiwgdHJ1ZSkuY29uY2F0KCRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldENvbHVtbkZpZWxkc1wiLCBmYWxzZSkpLFxyXG5cdFx0XHRcdFx0ZnVuY3Rpb24gKGluZGV4LCBmaWVsZCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgY29sdW1uT3B0aW9uID0gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0Q29sdW1uT3B0aW9uXCIsIGZpZWxkKTtcclxuXHRcdFx0XHRcdFx0aWYgKCFjb2x1bW5PcHRpb24udGl0bGUpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0JGZpZWxkID0gJGhlYWRlclRyLmZpbmQoXCJ0ZFtmaWVsZD0nXCIgKyBjb2x1bW5PcHRpb24uZmllbGQgKyBcIiddXCIpO1xyXG5cdFx0XHRcdFx0XHRjb2x1bW5zLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRcdGZpZWxkOiBjb2x1bW5PcHRpb24uZmllbGQsXHJcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGNvbHVtbk9wdGlvbi50aXRsZSxcclxuXHRcdFx0XHRcdFx0XHRjb2RlVHlwZTogY29sdW1uT3B0aW9uLmNvZGVUeXBlLFxyXG5cdFx0XHRcdFx0XHRcdGZvcm1hdCA6IGNvbHVtbk9wdGlvbi5leHBvcnRGb3JtYXQgfHwgY29sdW1uT3B0aW9uLmZvcm1hdCxcclxuXHRcdFx0XHRcdFx0XHRmb3JtYXR0ZXI6IGNvbHVtbk9wdGlvbi5leHBvcnRGb3JtYXR0ZXIgfHwgZ2V0Rm9ybWF0dGVyKG9wdHMsY29sdW1uT3B0aW9uKSxcclxuXHRcdFx0XHRcdFx0XHR3aWR0aDogJGZpZWxkLndpZHRoKCkgKyAxMFxyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGZteC5Db21tb25FeHBvcnRlci5kb0V4cG9ydFF1ZXJ5KGV4cG9ydEluZm8sIHF1ZXJ5SW5mbywgY29sdW1ucyk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHRcdHJlZnJlc2hGb290ZXI6IGZ1bmN0aW9uIChqcSkge1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcblx0XHRcdFx0aWYgKCEkZGF0YWdyaWQuYXR0cihcInNob3dGb290ZXJcIikpIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwiZm9yY2VFbmRFZGl0XCIpO1xyXG5cdFx0XHRcdHZhciBmb290ZXJSb3dzID0gW107XHJcblx0XHRcdFx0JGRhdGFncmlkLmZpbmQoXCJ0Zm9vdCB0clwiKS5lYWNoKFxyXG5cdFx0XHRcdFx0ZnVuY3Rpb24gKGluZGV4dGYsIHRyKSB7XHJcblx0XHRcdFx0XHRcdHZhciAkdHIgPSAkKHRyKTtcclxuXHRcdFx0XHRcdFx0dmFyIGZvb3RlclJvdyA9IHt9O1xyXG5cdFx0XHRcdFx0XHQkdHIuZmluZChcInRkXCIpLmVhY2goXHJcblx0XHRcdFx0XHRcdFx0ZnVuY3Rpb24gKGluZGV4dGQsIHRkKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgJHRkID0gJCh0ZCk7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgZmllbGQgPSAkdGQuYXR0cihcImZpZWxkXCIpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBmb290ZXJUeXBlID0gJHRkLmF0dHIoXCJmb290ZXJUeXBlXCIpO1xyXG5cdFx0XHRcdFx0XHRcdFx0c3dpdGNoIChmb290ZXJUeXBlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJjb3VudFwiOlxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlID0gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0Um93c1wiKS5sZW5ndGg7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJzdW1cIjpcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHQkLmVhY2goJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0Um93c1wiKSwgZnVuY3Rpb24gKFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cm93SW5kZXgsIHJvdykge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWUgKz0gaXNOYU4oK3Jvd1tmaWVsZF0pID8gMCA6ICtyb3dbZmllbGRdO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiYXZlcmFnZVwiOlxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhciBjb3VudCA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldFJvd3NcIikubGVuZ3RoO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChjb3VudCA9PSAwKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQuZWFjaCgkZGF0YWdyaWQuZGF0YWdyaWQoXCJnZXRSb3dzXCIpLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRmdW5jdGlvbiAocm93SW5kZXgsIHJvdykge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlICs9IGlzTmFOKCtyb3dbZmllbGRdKSA/IDBcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdDogK3Jvd1tmaWVsZF07XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZSAvIGNvdW50O1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZSA9ICR0ZC5odG1sKCk7XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRmb290ZXJSb3dbZmllbGRdID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdGZvb3RlclJvd3MucHVzaChmb290ZXJSb3cpO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0aWYgKGZvb3RlclJvd3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJyZWxvYWRGb290ZXJcIiwgZm9vdGVyUm93cyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcbi8vICAgIGdldENvbHVtbkVkaXRvcjogZnVuY3Rpb24gKGpxLCBmaWVsZCkge1xyXG4vLyAgICAgIHJldHVybiAkKGpxWzBdKS5kYXRhKFwiZWRpdG9yVGFyZ2V0c1wiKVtmaWVsZF0gPyAkKGpxWzBdKS5kYXRhKFxyXG4vLyAgICAgICAgICBcImVkaXRvclRhcmdldHNcIilbZmllbGRdWzBdIDogbnVsbDtcclxuLy8gICAgfSxcclxuICAgIF9sb2FkaW5nIDogJC5mbi5kYXRhZ3JpZC5tZXRob2RzLmxvYWRpbmcsXHJcbiAgICBfbG9hZGVkIDogJC5mbi5kYXRhZ3JpZC5tZXRob2RzLmxvYWRlZCxcclxuICAgIGxvYWRpbmcgOiBmdW5jdGlvbihqcSl7XHJcbiAgICAgIGpxLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgb3B0cyA9ICQuZGF0YSh0aGlzLCAnZGF0YWdyaWQnKS5vcHRpb25zO1xyXG4gICAgICAgIGlmKG9wdHMubWFza2l0KSBvcHRzLm1hc2tpdC5tYXNraXQodHJ1ZSx0cnVlKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiAkLmZuLmRhdGFncmlkLm1ldGhvZHMuX2xvYWRpbmcoanEpO1xyXG4gICAgfSxcclxuICAgIGxvYWRlZCA6IGZ1bmN0aW9uKGpxKXtcclxuICAgICAganEuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvcHRzID0gJC5kYXRhKHRoaXMsICdkYXRhZ3JpZCcpLm9wdGlvbnM7XHJcbiAgICAgICAgaWYob3B0cy5tYXNraXQpIG9wdHMubWFza2l0Lm1hc2tpdCgndW5tYXNrJyx0cnVlKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiAkLmZuLmRhdGFncmlkLm1ldGhvZHMuX2xvYWRlZChqcSk7XHJcbiAgICB9XHJcblx0fSk7XHJcblxyXG5cdCQuZm4uZGF0YWdyaWQucGFyc2VPcHRpb25zID0gZnVuY3Rpb24gKHRhcmdldCkge1xyXG5cdFx0dmFyIHQgPSAkKHRhcmdldCksIGV4cG9ydFBhcmFtcyA9IHQuYXR0cignZXhwb3J0UGFyYW1zJyksIGNvbHVtbnMgPSB0LmF0dHIoJ2NvbHVtbnMnKSwgZnJvemVuQ29sdW1ucyA9IHQuYXR0cignZnJvemVuQ29sdW1ucycpO1xyXG5cdFx0aWYgKGV4cG9ydFBhcmFtcyAmJiBleHBvcnRQYXJhbXMuY2hhckF0KDApID09ICd7Jykge1xyXG5cdFx0XHRleHBvcnRQYXJhbXMgPSBldmFsKGV4cG9ydFBhcmFtcyk7XHJcblx0XHR9IGVsc2UgZXhwb3J0UGFyYW1zID0gdW5kZWZpbmVkO1xyXG5cdFx0aWYgKGNvbHVtbnMgJiYgY29sdW1ucy5jaGFyQXQoMCkgPT0gJ3snKSB7XHJcblx0XHRcdGNvbHVtbnMgPSBldmFsKGNvbHVtbnMpO1xyXG5cdFx0fSBlbHNlIGNvbHVtbnMgPSB1bmRlZmluZWQ7XHJcblx0XHRpZiAoZnJvemVuQ29sdW1ucyAmJiBmcm96ZW5Db2x1bW5zLmNoYXJBdCgwKSA9PSAneycpIHtcclxuXHRcdFx0ZnJvemVuQ29sdW1ucyA9IGV2YWwoZnJvemVuQ29sdW1ucyk7XHJcblx0XHR9IGVsc2UgZnJvemVuQ29sdW1ucyA9IHVuZGVmaW5lZDtcclxuXHRcdHZhciBvblF1ZXJ5RmllbGQgPSB0LmF0dHIoJ29uUXVlcnlGaWVsZCcpID8gZXZhbCh0LmF0dHIoJ29uUXVlcnlGaWVsZCcpKSA6IHVuZGVmaW5lZDtcclxuXHRcdHJldHVybiAkLmV4dGVuZCh7IGV4cG9ydFBhcmFtczogZXhwb3J0UGFyYW1zLCBjb2x1bW5zOiBjb2x1bW5zLCBmcm96ZW5Db2x1bW5zOiBmcm96ZW5Db2x1bW5zLCBvblF1ZXJ5RmllbGQ6IG9uUXVlcnlGaWVsZCB9LCAkLmZuLnBhbmVsLnBhcnNlT3B0aW9ucyh0YXJnZXQpLCAkLnBhcnNlci5wYXJzZU9wdGlvbnModGFyZ2V0LCBbXHJcblx0XHRcdCd1cmwnLCAndG9vbGJhcicsICdpZEZpZWxkJywgJ3NvcnROYW1lJywgJ3NvcnRPcmRlcicsICdwYWdlUG9zaXRpb24nLCAncmVzaXplSGFuZGxlJywgJ3F1ZXJ5JyxcclxuXHRcdFx0J2V4cG9ydFRlbXBsYXRlJywgJ2V4cG9ydEZpbGVuYW1lJywgJ2V4cG9ydFR5cGUnLCAncGFyYW1Gb3JtJywgJ29yZGVyQnknLCAnZ3JvdXBGaWVsZCcsICdwYXJlbnRGaWVsZCcsXHJcblx0XHRcdCdpY29uQ2xzRmllbGQnLCdjb2RlJywndHhNYW5hZ2VyJyxcclxuXHRcdFx0eyBzaGFyZWRTdHlsZVNoZWV0OiAnYm9vbGVhbicsIGZpdENvbHVtbnM6ICdib29sZWFuJywgYXV0b1Jvd0hlaWdodDogJ2Jvb2xlYW4nLCBzdHJpcGVkOiAnYm9vbGVhbicsIG5vd3JhcDogJ2Jvb2xlYW4nIH0sXHJcblx0XHRcdHsgcm93bnVtYmVyczogJ2Jvb2xlYW4nLCBzaW5nbGVTZWxlY3Q6ICdib29sZWFuJywgY3RybFNlbGVjdDogJ2Jvb2xlYW4nLCBjaGVja09uU2VsZWN0OiAnYm9vbGVhbicsIHNlbGVjdE9uQ2hlY2s6ICdib29sZWFuJyB9LFxyXG5cdFx0XHR7IHN0b3JlQ29sdW1uczonYm9vbGVhbicsc3RvcmVDb2x1bW5zV2l0aFdpZHRoOidib29sZWFuJyB9LFxyXG5cdFx0XHR7IHBhZ2luYXRpb246ICdib29sZWFuJywgcGFnZVNpemU6ICdudW1iZXInLCBwYWdlTnVtYmVyOiAnbnVtYmVyJyB9LFxyXG5cdFx0XHR7IG11bHRpU29ydDogJ2Jvb2xlYW4nLCByZW1vdGVTb3J0OiAnYm9vbGVhbicsIHNob3dIZWFkZXI6ICdib29sZWFuJywgc2hvd0Zvb3RlcjogJ2Jvb2xlYW4nIH0sXHJcblx0XHRcdHsgc2Nyb2xsYmFyU2l6ZTogJ251bWJlcicsJ21heFJvd0xpbWl0JzonbnVtYmVyJywgYXV0b0xvYWQ6ICdib29sZWFuJyxyZWFkb25seTonYm9vbGVhbicsc2hvd0NvbnRleHRNZW51Oidib29sZWFuJyxzaG93RXhwb3J0Q29udGV4dE1lbnU6J2Jvb2xlYW4nLGZyb3plbkNoZWNrYm94Oidib29sZWFuJyB9XHJcblx0XHRdKSwge1xyXG5cdFx0XHRcdHBhZ2VMaXN0OiAodC5hdHRyKCdwYWdlTGlzdCcpID8gZXZhbCh0LmF0dHIoJ3BhZ2VMaXN0JykpIDogdW5kZWZpbmVkKSxcclxuXHRcdFx0XHRsb2FkTXNnOiAodC5hdHRyKCdsb2FkTXNnJykgIT0gdW5kZWZpbmVkID8gdC5hdHRyKCdsb2FkTXNnJykgOiB1bmRlZmluZWQpLFxyXG5cdFx0XHRcdG1hc2tpdDogdC5hdHRyKCdtYXNraXQnKSxcclxuXHRcdFx0XHRyb3dTdHlsZXI6ICh0LmF0dHIoJ3Jvd1N0eWxlcicpID8gZXZhbCh0LmF0dHIoJ3Jvd1N0eWxlcicpKSA6IHVuZGVmaW5lZCksXHJcblx0XHRcdFx0cXVlcnlGaWVsZHM6ICh0LmF0dHIoJ3F1ZXJ5RmllbGRzJykgPyBldmFsKHQuYXR0cigncXVlcnlGaWVsZHMnKSkgOiB1bmRlZmluZWQpXHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdC8vZm9ybWF0dGVyc1xyXG5cdHZhciBmb3JtYXR0ZXJzID0ge1xyXG5cdFx0bnVtYmVyOiBmdW5jdGlvbiAodmFsdWUsIHJvd0RhdGEsIHJvd0luZGV4KSB7XHJcblx0XHRcdHZhbHVlID0gZm14LmZvcm1hdHRlcnMuZm9ybWF0TnVtYmVyKHZhbHVlLCB0aGlzLmZvcm1hdCk7XHJcblx0XHRcdHJldHVybiBcIjxzcGFuIHN0eWxlPSdmbG9hdDpyaWdodDsnPlwiICsgdmFsdWUgKyBcIjwvc3Bhbj5cIjtcclxuXHRcdH0sXHJcblx0XHRjdXJyZW5jeTogZnVuY3Rpb24gKHZhbHVlLCByb3dEYXRhLCByb3dJbmRleCkge1xyXG5cdFx0XHR2YWx1ZSA9IGZteC5mb3JtYXR0ZXJzLmZvcm1hdEN1cnJlbmN5KHZhbHVlLCB0aGlzLmZvcm1hdCk7XHJcblx0XHRcdHJldHVybiBcIjxzcGFuIHN0eWxlPSdmbG9hdDpyaWdodDsnPlwiICsgdmFsdWUgKyBcIjwvc3Bhbj5cIjtcclxuXHRcdH0sXHJcblx0XHRkYXRlOiBmdW5jdGlvbiAodmFsdWUsIHJvd0RhdGEsIHJvd0luZGV4KSB7XHJcblx0XHRcdHJldHVybiBmbXguZm9ybWF0dGVycy5mb3JtYXREYXRlKHZhbHVlLCB0aGlzLmZvcm1hdCk7XHJcblx0XHR9LFxyXG5cdFx0ZGF0ZXRpbWU6IGZ1bmN0aW9uICh2YWx1ZSwgcm93RGF0YSwgcm93SW5kZXgpIHtcclxuXHRcdFx0cmV0dXJuIGZteC5mb3JtYXR0ZXJzLmZvcm1hdERhdGV0aW1lKHZhbHVlLCB0aGlzLmZvcm1hdCk7XHJcblx0XHR9LFxyXG5cdFx0dGltZTogZnVuY3Rpb24gKHZhbHVlLCByb3dEYXRhLCByb3dJbmRleCkge1xyXG5cdFx0XHR2YWx1ZSA9IGZteC5mb3JtYXR0ZXJzLmZvcm1hdFRpbWUodmFsdWUsIHRoaXMuZm9ybWF0KTtcclxuXHRcdFx0cmV0dXJuIFwiPHNwYW4gc3R5bGU9J2Zsb2F0OnJpZ2h0Oyc+XCIgKyB2YWx1ZSArIFwiPC9zcGFuPlwiO1xyXG5cdFx0fSxcclxuXHRcdHJlcGxhY2U6IGZ1bmN0aW9uICh2YWx1ZSwgcm93RGF0YSwgcm93SW5kZXgpIHtcclxuXHRcdFx0aWYgKHRoaXMuZm9ybWF0KSB7XHJcblx0XHRcdFx0dmFsdWUgPSB0aGlzLmZvcm1hdC5yZXBsYWNlKC97dmFsdWV9L2csIHZhbHVlKTtcclxuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL3tpbmRleH0vZywgcm93SW5kZXgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB2YWx1ZTtcclxuXHRcdH0sXHJcblx0XHRkeW5hbWljOiBmdW5jdGlvbiAodmFsdWUsIHJvd0RhdGEsIHJvd0luZGV4KSB7XHJcblx0XHRcdGlmICh0aGlzLmZvcm1hdCkge1xyXG5cdFx0XHRcdGlmICghdGhpcy5fZm9ybWF0dGVyKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9mb3JtYXR0ZXIgPSBuZXcgRnVuY3Rpb24oXCJ2YWx1ZVwiLCBcInJvd0RhdGFcIiwgXCJpbmRleFwiLCBcInJldHVybiBcIiArIHRoaXMuZm9ybWF0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFsdWUgPSB0aGlzLl9mb3JtYXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSwgcm93RGF0YSwgcm93SW5kZXgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB2YWx1ZTtcclxuXHRcdH0sXHJcblx0XHRodG1sZW5jb2RlIDogZnVuY3Rpb24odmFsdWUscm93RGF0YSxyb3dJbmR4KSB7XHJcblx0XHRcdHJldHVybiB2YWx1ZSA/IGZteC51dGlscy5odG1sZW5jb2RlKHZhbHVlKSA6IHZhbHVlO1xyXG5cdFx0fSxcclxuXHRcdGh0bWxkZWNvZGUgOiBmdW5jdGlvbih2YWx1ZSxyb3dEYXRhLHJvd0luZHgpIHtcclxuXHRcdFx0cmV0dXJuIHZhbHVlID8gZm14LnV0aWxzLmh0bWxkZWNvZGUodmFsdWUpIDogdmFsdWU7XHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgb25WaWV3QWZ0ZXJSZW5kZXIgPSAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLnZpZXcub25BZnRlclJlbmRlcjtcclxuXHQkLmZuLmRhdGFncmlkLmRlZmF1bHRzID0gJC5leHRlbmQoJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cywge1xyXG5cdFx0dXJsOiB0cnVlLFxyXG5cdFx0c2luZ2xlU2VsZWN0OnRydWUsXHJcblx0XHRzdHJpcGVkOnRydWUsXHJcblx0XHRmaXQ6dHJ1ZSxcclxuXHRcdGZpdENvbHVtbnM6IHRydWUsXHJcblx0XHRzdG9yZUNvbHVtbnMgOiB0cnVlLFxyXG5cdFx0c3RvcmVDb2x1bW5zV2l0aFdpZHRoIDogdHJ1ZSxcclxuXHRcdHJvd251bWJlcnM6IHRydWUsXHJcblx0XHRwYWdpbmF0aW9uOiB0cnVlLFxyXG5cdFx0c2VsZWN0T25DaGVjazogdHJ1ZSxcclxuXHRcdHBhZ2VQb3NpdGlvbjogJ2JvdHRvbScsXHQvLyB0b3AsYm90dG9tLGJvdGhcclxuXHRcdHBhZ2VOdW1iZXI6IDAsXHJcblx0XHRyZWFkb25seSA6IGZhbHNlLFxyXG5cdFx0c2hvd0NvbnRleHRNZW51IDogdHJ1ZSxcclxuXHRcdHNob3dFeHBvcnRDb250ZXh0TWVudTp0cnVlLFxyXG5cdFx0ZnJvemVuQ2hlY2tib3ggOiB0cnVlLFxyXG5cdFx0YXV0b0xvYWQ6ICEhZm14LnBhZ2VDb250ZXh0LmVhc3l1aVsnZGF0YUdyaWRBdXRvTG9hZCddLFxyXG5cdFx0cGFnZVNpemU6IGZteC5wYWdlQ29udGV4dC5lYXN5dWlbJ2RhdGFHcmlkUGFnZVNpemUnXSB8fCAxMCxcclxuXHRcdHBhZ2VMaXN0OiBmbXgucGFnZUNvbnRleHQuZWFzeXVpWydkYXRhR3JpZFBhZ2VMaXN0J10gfHwgWzEwLCAyMCwgMzAsIDQwLCA1MF0sXHJcblx0XHRyZWZyZXNoVGV4dDogXCJSZWZyZXNoXCIsXHJcblx0XHRyZXNldFNvcnRUZXh0OiBcIkRlZmF1bHQgU29ydCBPcmRlclwiLFxyXG5cdFx0ZXhwb3J0RXhjZWxDdXJyZW50UGFnZVRleHQ6IFwiRXhwb3J0IEV4Y2VsIChDdXJyZW50IFBhZ2UpXCIsXHJcblx0XHRleHBvcnRFeGNlbEFsbFRleHQ6IFwiRXhwb3J0IEV4Y2VsIChBbGwpXCIsXHJcblx0XHRzaG93Q29sdW1uc1RleHQ6IFwiU2hvdyBDb2x1bW5zXCIsXHJcblx0XHRleHBvcnRFeGNlbEVycm9yTXNnOiBcIkNhbiBub3QgZXhwb3J0IEV4Y2VsIGZvciB0aGlzIHRhYmxlLlwiLFxyXG5cdFx0ZGF0YUNoYW5nZWRNc2c6IFwiRGF0YSBjaGFuZ2VkLiBEaXNjYXJkIGNoYW5nZXM/XCIsXHJcblx0XHRsb2FkRGF0YUVycm9yTXNnOiBcIkVycm9yIGxvYWRpbmcgZGF0YS5cIixcclxuXHRcdHJlTG9naW5Nc2c6IFwiRXJyb3IgbG9hZGluZyBkYXRhLiBQbGVhc2UgcmUtbG9naW4gYW5kIHRyeSBhZ2Fpbi5cIixcclxuXHRcdGV4cG9ydFBhcmFtczoge30sXHJcblx0XHRleHBvcnRUeXBlOiBmbXgucGFnZUNvbnRleHQuZWFzeXVpWydkYXRhR3JpZEV4cG9ydFR5cGUnXSB8fCBcImp4bHNcIixcclxuXHRcdGV4cG9ydEZpbGVuYW1lOiAnZGF0YWdyaWQtZGF0YScsXHJcblx0XHRleHBvcnRUZW1wbGF0ZTogXCJcIixcclxuXHRcdGZvcm1hdHRlcnM6IGZvcm1hdHRlcnMsXHJcblx0XHRvblF1ZXJ5RmllbGQ6ICQubm9vcCxcclxuXHRcdHR4TWFuYWdlciA6IG51bGwsXHJcblx0XHRsb2FkZXI6IGZ1bmN0aW9uIChwYXJhbSwgc3VjY2VzcywgZXJyb3IpIHtcclxuXHRcdFx0dmFyICRkYXRhZ3JpZCA9ICQodGhpcyksIG9wdHMgPSAkZGF0YWdyaWQuZGF0YWdyaWQoJ29wdGlvbnMnKTtcclxuXHRcdFx0aWYgKCFvcHRzLl9hdXRvTG9hZCkgeyAvL+esrOS4gOasoeWKoOi9vVxyXG5cdFx0XHRcdG9wdHMuX2F1dG9Mb2FkID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAob3B0cy51cmwgPT09IHRydWUpIHtcclxuXHRcdFx0XHRcdG9wdHMudXJsID0gJyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghb3B0cy5hdXRvTG9hZCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3B0cy51cmwpIHtcclxuXHRcdFx0XHQkLmFqYXgoe1xyXG5cdFx0XHRcdFx0dHlwZTogb3B0cy5tZXRob2QsXHJcblx0XHRcdFx0XHR1cmw6IG9wdHMudXJsLFxyXG5cdFx0XHRcdFx0ZGF0YTogcGFyYW0sXHJcblx0XHRcdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxyXG5cdFx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0c3VjY2VzcyhkYXRhKTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRlcnJvcjogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRlcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2UgaWYgKG9wdHMucXVlcnkpIHtcclxuXHRcdFx0XHR2YXIgcXVlcnlGaWVsZHMgPSBbXTtcclxuXHRcdFx0XHRpZiAob3B0cy5xdWVyeUZpZWxkcykge1xyXG5cdFx0XHRcdFx0cXVlcnlGaWVsZHMgPSBxdWVyeUZpZWxkcy5jb25jYXQob3B0cy5xdWVyeUZpZWxkcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChvcHRzLmNvbW1vblF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdFx0XHRxdWVyeUZpZWxkcyA9IHF1ZXJ5RmllbGRzLmNvbmNhdChvcHRzLmNvbW1vblF1ZXJ5RmllbGRzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHBhcmFtICYmIHBhcmFtLnF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdFx0XHRpZiAoJC5pc0FycmF5KHBhcmFtLnF1ZXJ5RmllbGRzKSkge1xyXG5cdFx0XHRcdFx0XHRxdWVyeUZpZWxkcyA9IHF1ZXJ5RmllbGRzLmNvbmNhdChwYXJhbS5xdWVyeUZpZWxkcyk7XHJcblx0XHRcdFx0XHR9IGVsc2UgaWYgKCQuaXNQbGFpbk9iamVjdChwYXJhbS5xdWVyeUZpZWxkcykpIHtcclxuXHRcdFx0XHRcdFx0cXVlcnlGaWVsZHMucHVzaChwYXJhbS5xdWVyeUZpZWxkcyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChwYXJhbSAmJiBwYXJhbS5xKSB7XHJcblx0XHRcdFx0XHRxdWVyeUZpZWxkcy5wdXNoKHtcclxuXHRcdFx0XHRcdFx0ZmllbGROYW1lOiAkZGF0YWdyaWQuZGF0YWdyaWQoXCJnZXRDb2x1bW5GaWVsZHNcIikuam9pbihcIixcIiksXHJcblx0XHRcdFx0XHRcdGZpZWxkVmFsdWU6IHBhcmFtLnEsXHJcblx0XHRcdFx0XHRcdG9wZXJhdG9yOiBcImlsaWtlQW55d2hlcmVcIlxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChvcHRzLnBhcmFtRm9ybSkge1xyXG5cdFx0XHRcdFx0dmFyICRwYXJlbnQgPSAkZGF0YWdyaWQucGFyZW50KCk7XHJcblx0XHRcdFx0XHR2YXIgJHBhcmFtRm9ybSA9IG51bGw7XHJcblx0XHRcdFx0XHR3aGlsZSAodHJ1ZSkge1xyXG5cdFx0XHRcdFx0XHQkcGFyYW1Gb3JtID0gJHBhcmVudC5maW5kKFwiI1wiICsgb3B0cy5wYXJhbUZvcm0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoJHBhcmFtRm9ybS5zaXplKCkgPiAwKSB7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0JHBhcmVudCA9ICRwYXJlbnQucGFyZW50KCk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCRwYXJlbnQuc2l6ZSgpID09IDApIHtcclxuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKCRwYXJhbUZvcm0pIHtcclxuXHRcdFx0XHRcdFx0aWYoJHBhcmFtRm9ybS5mb3JtKCd2YWxpZGF0ZScpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFyYW1Gb3JtUXVlcnlGaWVsZHMgPSAkcGFyYW1Gb3JtLmZvcm0oXCJnZXRRdWVyeUZpZWxkc1wiKTtcclxuXHRcdFx0XHRcdFx0aWYgKHBhcmFtRm9ybVF1ZXJ5RmllbGRzKSB7XHJcblx0XHRcdFx0XHRcdFx0cXVlcnlGaWVsZHMgPSBxdWVyeUZpZWxkcy5jb25jYXQocGFyYW1Gb3JtUXVlcnlGaWVsZHMpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICgkLmlzRnVuY3Rpb24ob3B0cy5vblF1ZXJ5RmllbGQpKSB7XHJcblx0XHRcdFx0XHR2YXIgcWYgPSBvcHRzLm9uUXVlcnlGaWVsZC5jYWxsKHRoaXMpO1xyXG5cdFx0XHRcdFx0aWYgKCQuaXNBcnJheShxZikpIHtcclxuXHRcdFx0XHRcdFx0cXVlcnlGaWVsZHMgPSBxdWVyeUZpZWxkcy5jb25jYXQocWYpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmICgkLmlzUGxhaW5PYmplY3QocWYpKSB7XHJcblx0XHRcdFx0XHRcdHF1ZXJ5RmllbGRzLnB1c2gocWYpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR2YXIgcXVlcnlJbmZvID0ge1xyXG5cdFx0XHRcdFx0cXVlcnk6IG9wdHMucXVlcnksXHJcblx0XHRcdFx0XHRmaWVsZENvZGVUeXBlczogb3B0cy5maWVsZENvZGVUeXBlcyxcclxuXHRcdFx0XHRcdHF1ZXJ5RmllbGRzOiBxdWVyeUZpZWxkcyxcclxuXHRcdFx0XHRcdG9yZGVyQnk6IChwYXJhbS5zb3J0ID8gcGFyYW0uc29ydCArIFwiIFwiICsgcGFyYW0ub3JkZXIgOiAob3B0cy5vcmRlckJ5IHx8IFwiXCIpKVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0aWYob3B0cy50eE1hbmFnZXIpe1xyXG5cdFx0XHRcdFx0cXVlcnlJbmZvLnR4TWFuYWdlciA9IG9wdHMudHhNYW5hZ2VyO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZihvcHRzLm1heFJvd0xpbWl0KSB7XHJcblx0XHRcdFx0XHRxdWVyeUluZm8ubWF4Um93TGltaXQgPSBvcHRzLm1heFJvd0xpbWl0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAob3B0cy5wYWdpbmF0aW9uKSB7XHJcblx0XHRcdFx0XHRxdWVyeUluZm9bJ3BhZ2luZ0luZm8nXSA9IHtcclxuXHRcdFx0XHRcdFx0cGFnZVNpemU6IHBhcmFtLnJvd3MsXHJcblx0XHRcdFx0XHRcdGN1cnJlbnRQYWdlOiBwYXJhbS5wYWdlLFxyXG5cdFx0XHRcdFx0XHRwYWdlTm86IHBhcmFtLnBhZ2UsXHJcblx0XHRcdFx0XHRcdHRvdGFsUm93cyA6ICRkYXRhZ3JpZC5kYXRhZ3JpZCgnZ2V0UGFnZXInKS5wYWdpbmF0aW9uKCdvcHRpb25zJykudG90YWxcclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGNhY2hlIHF1ZXJ5SW5mb1xyXG5cdFx0XHRcdG9wdHNbJ3F1ZXJ5SW5mbyddID0gcXVlcnlJbmZvO1xyXG5cdFx0XHRcdGZteC5Db21tb25RdWVyeVNlcnZpY2UucXVlcnkocXVlcnlJbmZvLCBmdW5jdGlvbiAoZGF0YSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkYXRhIHx8IGRhdGEuY29kZSA8IDApIHtcclxuXHRcdFx0XHRcdFx0ZXJyb3IoZGF0YS5tZXNzYWdlKTtcclxuXHRcdFx0XHRcdH0gZWxzZSBpZihkYXRhLmRhdGEpIHtcclxuXHRcdFx0XHRcdFx0c3VjY2VzcyhkYXRhKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LCBlcnJvcik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0bG9hZEZpbHRlcjogZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFx0aWYgKCFkYXRhKSB7XHJcblx0XHRcdFx0cmV0dXJuIHsgdG90YWw6IDAsIHJvd3M6IFtdIH07XHJcblx0XHRcdH1lbHNlIGlmKCQuaXNBcnJheShkYXRhLnJvd3MpKSByZXR1cm4gZGF0YTtcclxuLy9cdFx0XHR2YXIgb3B0cyA9ICQuZGF0YSh0aGlzLCAnZGF0YWdyaWQnKS5vcHRpb25zO1xyXG4vL1x0XHRcdGlmKG9wdHMudXJsICYmIHR5cGVvZiBvcHRzLnVybCA9PSAnc3RyaW5nJyl7XHJcbi8vXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuLy9cdFx0XHR9XHJcblx0XHRcdGlmIChkYXRhWydjb2RlJ10gPCAwKSB7XHJcblx0XHRcdFx0dmFyIG1lc3NhZ2U7XHJcblx0XHRcdFx0aWYoZGF0YS5lcnJvcnMpe1xyXG5cdFx0XHRcdCAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KCBkYXRhLmVycm9ycyApO1xyXG5cdFx0XHRcdH0gZWxzZSBtZXNzYWdlID0gZGF0YS5tZXNzYWdlIHx8IGRhdGEuZXhjZXB0aW9uO1xyXG5cdFx0XHRcdCQubWVzc2FnZXIuYWxlcnQoXCJNZXNzYWdlXCIsICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZERhdGFFcnJvck1zZyArIG1lc3NhZ2UsIFwid2FybmluZ1wiKTtcclxuXHRcdFx0XHRyZXR1cm4geyB0b3RhbDogMCwgcm93czogW10gfTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgZGF0YUxpc3QsdG90YWw7XHJcblx0XHRcdGlmKCQuaXNBcnJheShkYXRhLmRhdGEpKXtcclxuXHRcdFx0XHRkYXRhTGlzdCA9IGRhdGEuZGF0YTtcclxuXHRcdFx0XHRpZihkYXRhLnBhZ2luZ0luZm8pIHRvdGFsID0gZGF0YS5wYWdpbmdJbmZvLnRvdGFsUm93cztcclxuXHRcdFx0XHRpZihkYXRhLnRvdGFsID4gMCkgdG90YWwgPSBkYXRhLnRvdGFsO1xyXG5cdFx0XHR9ZWxzZSBpZihkYXRhLmRhdGEgJiYgJC5pc0FycmF5KGRhdGEuZGF0YS5kYXRhTGlzdCkpe1xyXG5cdFx0XHRcdGRhdGFMaXN0ID0gZGF0YS5kYXRhLmRhdGFMaXN0O1xyXG5cdFx0XHRcdGlmKGRhdGEuZGF0YS5zZWxlY3RDb2RlVmFsdWVzKXtcclxuXHRcdFx0XHRcdGZteC5tZXJnZVNlbGVjdENvZGVWYWx1ZXMoZGF0YS5kYXRhLnNlbGVjdENvZGVWYWx1ZXMpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZihkYXRhLmRhdGEucGFnaW5nSW5mbyl7XHJcblx0XHRcdFx0XHR0b3RhbCA9IGRhdGEuZGF0YS5wYWdpbmdJbmZvLnRvdGFsUm93cztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYoZGF0YS5kYXRhLnRvdGFsID4gMCkgdG90YWwgPSBkYXRhLmRhdGEudG90YWw7XHJcblx0XHRcdH1lbHNlIGlmKCQuaXNBcnJheShkYXRhKSl7XHJcblx0XHRcdFx0ZGF0YUxpc3QgPSBkYXRhO1xyXG5cdFx0XHR9ZWxzZSByZXR1cm4geyB0b3RhbDogMCwgcm93czogW10gfTtcclxuXHRcdFx0ZGF0YT17cm93cyA6IGRhdGFMaXN0LHRvdGFsIDogdG90YWwgfHwgZGF0YUxpc3QubGVuZ3RofTtcclxuXHRcdFx0dmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcblx0XHRcdGlmICgkZGF0YWdyaWQuaGFzQ2xhc3MoXCJlYXN5dWktdHJlZWdyaWRcIikgJiYgJC5pc0FycmF5KGRhdGEucm93cykpIHtcclxuXHRcdFx0XHR2YXIgb3B0aW9ucyA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIik7XHJcblx0XHRcdFx0dmFyIHBhcmVudEZpZWxkID0gb3B0aW9ucy5wYXJlbnRGaWVsZCB8fCBcInBhcmVudElkXCI7XHJcblx0XHRcdFx0dmFyIGljb25DbHNGaWVsZCA9IG9wdGlvbnMuaWNvbkNsc0ZpZWxkIHx8IFwiaWNvbkNsc1wiO1xyXG5cdFx0XHRcdCQuZWFjaChkYXRhLnJvd3MsIGZ1bmN0aW9uIChpbmRleCwgcm93KSB7XHJcblx0XHRcdFx0XHRpZiAocm93W3BhcmVudEZpZWxkXSAmJiByb3dbcGFyZW50RmllbGRdICE9IFwiMFwiKSB7XHJcblx0XHRcdFx0XHRcdHJvdy5fcGFyZW50SWQgPSByb3dbcGFyZW50RmllbGRdO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHJvd1tpY29uQ2xzRmllbGRdKSB7XHJcblx0XHRcdFx0XHRcdHJvdy5pY29uQ2xzID0gcm93W2ljb25DbHNGaWVsZF07XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHR9LFxyXG5cdFx0Zm9ybWF0dGVyOiBmdW5jdGlvbiAodmFsdWUsIHJvd0RhdGEsIHJvd0luZGV4KSB7XHJcblx0XHRcdHZhciBfZm9ybWF0dGVyID0gdGhpcy5fZm9ybWF0dGVyLCB0aGF0ID0gdGhpcztcclxuXHRcdFx0aWYgKHRoaXMuY29kZVR5cGUgJiYgJGlzVmFsaWRWYWx1ZSh2YWx1ZSkpIHtcclxuXHRcdFx0XHR2YXIgZmllbGQgPSB0aGlzLmZpZWxkO1xyXG5cdFx0XHRcdHZhciBjb2RlVHlwZSA9IHRoaXMuY29kZVR5cGU7XHJcblx0XHRcdFx0dmFyIHZhbCA9IGZteC5nZXRTZWxlY3RDb2RlVmFsdWUoY29kZVR5cGUsdmFsdWUsdHJ1ZSk7XHJcblx0XHRcdFx0aWYoJGlzVmFsaWRWYWx1ZSh2YWwpKXtcclxuXHRcdFx0XHRcdHZhbHVlID0gdmFsO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR2YXIgc2VsZWN0Q29kZUtleXMgPSB7fTtcclxuXHRcdFx0XHRcdHNlbGVjdENvZGVLZXlzW2NvZGVUeXBlXSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0dmFyIGlkID0gZmllbGQgKyAobmV3IERhdGUoKS52YWx1ZU9mKCkpO1xyXG5cdFx0XHRcdFx0Zm14LkNvbW1vblF1ZXJ5U2VydmljZS5nZXRTZWxlY3RDb2RlVmFsdWVzQnlLZXlzKHNlbGVjdENvZGVLZXlzLCBmdW5jdGlvbiAocmVzdWx0KSB7XHJcblx0XHRcdFx0XHQgIGlmKHJlc3VsdC5tZXNzYWdlKXtcclxuXHRcdFx0XHRcdCAgICAkLm1lc3NhZ2VyLmFsZXJ0KCfmj5DnpLonLHJlc3VsdC5tZXNzYWdlKTtcclxuXHRcdFx0XHRcdCAgfWVsc2UgaWYocmVzdWx0LmRhdGEpe1xyXG5cdCAgXHRcdFx0XHRcdGZteC5tZXJnZVNlbGVjdENvZGVWYWx1ZShyZXN1bHQuZGF0YSk7XHJcblx0ICBcdFx0XHRcdFx0dmFsdWUgPSBmbXguZ2V0U2VsZWN0Q29kZVZhbHVlKGNvZGVUeXBlLHZhbHVlLHRydWUpO1xyXG4gIFx0XHRcdFx0XHRcdGlmIChfZm9ybWF0dGVyKSB7XHJcbiAgXHRcdFx0XHRcdFx0XHR2YWx1ZSA9IF9mb3JtYXR0ZXIuY2FsbCh0aGF0LCB2YWx1ZSwgcm93RGF0YSwgcm93SW5kZXgpO1xyXG4gIFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdCAgIH1cclxuXHRcdFx0XHRcdCAgICQoXCIjXCIgKyBpZCkucmVwbGFjZVdpdGgodmFsdWUpO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gXCI8ZGl2IGlkPSdcIiArIGlkICsgXCInPi4uLjwvZGl2PlwiO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gX2Zvcm1hdHRlciA/IF9mb3JtYXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSwgcm93RGF0YSwgcm93SW5kZXgpIDogdmFsdWU7XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vb25CZWZvcmVMb2FkOiBmdW5jdGlvbiAocGFyYW0pIHsgfSxcclxuXHRcdG9uTG9hZFN1Y2Nlc3M6IGZ1bmN0aW9uIChyb3csIGRhdGEpIHtcclxuXHRcdFx0dmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcblx0XHRcdGlmICghZGF0YSkge1xyXG5cdFx0XHRcdGRhdGEgPSByb3c7XHJcblx0XHRcdH1cclxuXHRcdFx0JCh0aGlzKS5kYXRhZ3JpZChcInNldEN1cnJlbnRSb3dcIiwgdW5kZWZpbmVkKTtcclxuXHRcdFx0JCh0aGlzKS5kYXRhKFwibGFzdFNlbGVjdGVkSW5kZXhcIiwgbnVsbCk7XHJcblx0XHRcdGlmICghZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL2dyb3VwRGF0YWdyaWQodGhpcywgZGF0YS5yb3dzKTtcclxuXHRcdFx0JCh0aGlzKS5kYXRhZ3JpZChcInJlZnJlc2hGb290ZXJcIik7XHJcblx0XHRcdGlmICgkZGF0YWdyaWQuaGFzQ2xhc3MoXCJlYXN5dWktdHJlZWdyaWRcIikpIHtcclxuXHRcdFx0XHR2YXIgcHJldmlvdXNTZWxlY3RlZElkID0gJGRhdGFncmlkLmRhdGEoXCJzZWxlY3RlZElkXCIpO1xyXG5cdFx0XHRcdGlmIChwcmV2aW91c1NlbGVjdGVkSWQpIHtcclxuXHRcdFx0XHRcdCRkYXRhZ3JpZC50cmVlZ3JpZChcInNlbGVjdFwiLCBwcmV2aW91c1NlbGVjdGVkSWQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdG9uTG9hZEVycm9yOiBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG5cdFx0XHRpZih0eXBlb2YgbWVzc2FnZSAhPT0gJ3N0cmluZycpe1xyXG5cdFx0XHRcdGlmKHR5cGVvZiBtZXNzYWdlLm1lc3NhZ2UgPT0gJ3N0cmluZycpIG1lc3NhZ2UgPSBtZXNzYWdlLm1lc3NhZ2U7XHJcblx0XHRcdFx0ZWxzZSBpZih0eXBlb2YgbWVzc2FnZS5lcnJvcnMgPT0gJ3N0cmluZycpIG1lc3NhZ2UgPSBtZXNzYWdlLmVycm9ycztcclxuXHRcdFx0XHRlbHNlIGlmKCQuaXNGdW5jdGlvbihtZXNzYWdlLnN0YXRlKSkgbWVzc2FnZSA9IG1lc3NhZ2Uuc3RhdGUoKTtcclxuXHRcdFx0XHRlbHNlIG1lc3NhZ2UgPSBudWxsO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQubWVzc2FnZXIuY29uZmlybShtZXNzYWdlID8gJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5yZUxvZ2luTXNnIDogXCJNZXNzYWdlXCIsIG1lc3NhZ2UgPyBtZXNzYWdlIDogJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5yZUxvZ2luTXNnLFxyXG5cdFx0XHRcdGZ1bmN0aW9uIChiKSB7XHJcblx0XHRcdFx0XHRpZiAoYikge1xyXG5cdFx0XHRcdFx0XHR0b3Aud2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSxcclxuXHRcdG9uQmVmb3JlU29ydENvbHVtbiA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvL+W9k+ihqOagvOS4uuepuuaXtizkuI3lhYHorrjmjpLluo/liqDovb3mlbDmja5cclxuXHRcdFx0dmFyIHN0YXRlID0gJC5kYXRhKHRoaXMsJ2RhdGFncmlkJyk7XHJcblx0XHRcdGlmKCFzdGF0ZS5kYXRhIHx8ICFzdGF0ZS5kYXRhLnJvd3MgfHwgc3RhdGUuZGF0YS5yb3dzLmxlbmd0aCA9PSAwKXtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHRvbkNsaWNrUm93OiBmdW5jdGlvbiAocm93SW5kZXgsIHJvd0RhdGEpIHtcclxuXHRcdFx0dmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcblx0XHRcdC8vIGRhdGFncmlkLm9uQ2xpY2tSb3cocm93SW5kZXgsIHJvd0RhdGEpXHJcblx0XHRcdC8vIHRyZWVncmlkLm9uQ2xpY2tSb3cocm93KVxyXG5cdFx0XHQvLyBjbGlja2luZyBvbmx5IHNlbGVjdCBvbmUgcm93IHdoZW4gc2luZ2xlU2VsZWN0IG5vdCBkZWZpbmVkXHJcblx0XHRcdHZhciBvcHRzID0gJGRhdGFncmlkLmRhdGFncmlkKCdvcHRpb25zJyk7XHJcblx0XHRcdGlmIChvcHRzLnNpbmdsZVNlbGVjdCkge1xyXG5cdFx0XHRcdGlmICgkZGF0YWdyaWQuaGFzQ2xhc3MoXCJlYXN5dWktdHJlZWdyaWRcIikpIHtcclxuXHRcdFx0XHRcdC8vIHRyZWVncmlkXHJcblx0XHRcdFx0XHRyb3dEYXRhID0gcm93SW5kZXg7XHJcblx0XHRcdFx0XHR2YXIgaWRGaWVsZCA9IG9wdHMuaWRGaWVsZDtcclxuXHRcdFx0XHRcdHZhciByb3dJZCA9IHJvd0RhdGFbaWRGaWVsZF07XHJcblx0XHRcdFx0XHR2YXIgc2VsZWN0aW9uc0lkID0gJGRhdGFncmlkLnRyZWVncmlkKFwiZ2V0U2VsZWN0aW9uc0lkXCIpO1xyXG5cdFx0XHRcdFx0JC5lYWNoKHNlbGVjdGlvbnNJZCwgZnVuY3Rpb24gKGluZGV4LCBzZWxlY3RlZElkKSB7XHJcblx0XHRcdFx0XHRcdGlmIChzZWxlY3RlZElkICE9IHJvd0lkKSB7XHJcblx0XHRcdFx0XHRcdFx0JGRhdGFncmlkLnRyZWVncmlkKFwidW5zZWxlY3RcIiwgc2VsZWN0ZWRJZCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0aWYgKHNlbGVjdGlvbnNJZC5pbmRleE9mKHJvd0lkKSA9PSAtMSkge1xyXG5cdFx0XHRcdFx0XHQkZGF0YWdyaWQudHJlZWdyaWQoXCJzZWxlY3RcIiwgcm93SWQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvLyBkYXRhZ3JpZFxyXG5cdFx0XHRcdFx0Lyp2YXIgc2VsZWN0aW9uc0luZGV4ID0gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0U2VsZWN0aW9uc0luZGV4XCIpO1xyXG5cdFx0XHRcdFx0JC5lYWNoKHNlbGVjdGlvbnNJbmRleCwgZnVuY3Rpb24gKGluZGV4LCBzZWxlY3RlZEluZGV4KSB7XHJcblx0XHRcdFx0XHRcdGlmIChzZWxlY3RlZEluZGV4ICE9IHJvd0luZGV4KSB7XHJcblx0XHRcdFx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwidW5zZWxlY3RSb3dcIiwgc2VsZWN0ZWRJbmRleCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0aWYgKHNlbGVjdGlvbnNJbmRleC5pbmRleE9mKHJvd0luZGV4KSA9PSAtMSkge1xyXG5cdFx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJzZWxlY3RSb3dcIiwgcm93SW5kZXgpO1xyXG5cdFx0XHRcdFx0fSovXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0b25DbGlja0NlbGw6IGZ1bmN0aW9uIChyb3dJbmRleCwgZmllbGQsIHZhbHVlKSB7XHJcblx0XHRcdHZhciAkZGF0YWdyaWQgPSAkKHRoaXMpO1xyXG5cdFx0XHQkZGF0YWdyaWQuZGF0YShcImZvY3VzRmllbGRcIiwgZmllbGQpO1xyXG5cdFx0fSxcclxuXHQgICAgb25VbnNlbGVjdDogZnVuY3Rpb24gKHJvd0luZGV4LCByb3dEYXRhKSB7XHJcblx0ICAgICAgdmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcblx0ICAgICAgdmFyIG9wdGlvbnMgPSAkZGF0YWdyaWQuZGF0YWdyaWQoXCJvcHRpb25zXCIpO1xyXG5cdCAgICAgIC8vIGRhdGFncmlkLm9uVW5zZWxlY3Qocm93SW5kZXgsIHJvd0RhdGEpXHJcblx0ICAgICAgLy8gdHJlZWdyaWQub25VbnNlbGVjdChpZClcclxuXHQgICAgICBpZiAoY2FuRWRpdCh0aGlzKSkge1xyXG5cdCAgICAgICAgICBvcHRpb25zLnVuc2VsZWN0VGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHQgICAgICAgICAgICAgIGlmICgkZGF0YWdyaWQuZGF0YWdyaWQoXCJnZXRDdXJyZW50Um93XCIpID09IHJvd0luZGV4KSB7XHJcblx0ICAgICAgICAgICAgICAgICAgaWYgKCRkYXRhZ3JpZC5kYXRhZ3JpZChcInZhbGlkYXRlUm93XCIsIHJvd0luZGV4KSkge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAkZGF0YWdyaWQuZGF0YWdyaWQoXCJlbmRFZGl0XCIsIHJvd0luZGV4KTtcclxuXHQgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAkZGF0YWdyaWQuZGF0YWdyaWQoXCJzZWxlY3RSb3dcIiwgcm93SW5kZXgpO1xyXG5cdCAgICAgICAgICAgICAgICAgIH1cclxuXHQgICAgICAgICAgICAgIH1cclxuXHQgICAgICAgICAgfSwgMCk7XHJcblx0ICAgICAgfVxyXG5cdCAgICB9LFxyXG5cdFx0b25TZWxlY3Q6IGZ1bmN0aW9uIChyb3dJbmRleCwgcm93RGF0YSkge1xyXG5cdFx0XHR2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuXHRcdFx0dmFyIG9wdGlvbnMgPSAkZGF0YWdyaWQuZGF0YWdyaWQoXCJvcHRpb25zXCIpO1xyXG5cdFx0XHRpZiAob3B0aW9ucy51bnNlbGVjdFRpbWVyKSB7XHJcblx0XHQgICAgICAgIGNsZWFyVGltZW91dChvcHRpb25zLnVuc2VsZWN0VGltZXIpO1xyXG5cdFx0ICAgICAgICBvcHRpb25zLnVuc2VsZWN0VGltZXIgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZihjYW5FZGl0KHRoaXMpKXtcclxuXHQgIFx0XHQgIHZhciBjdXJyZW50Um93ID0gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0Q3VycmVudFJvd1wiKTtcclxuXHQgIFx0XHQgIGlmKGN1cnJlbnRSb3cgIT0gcm93SW5kZXgpIHtcclxuXHQgIFx0XHQgICAgaWYoJGRhdGFncmlkLmRhdGFncmlkKCd2YWxpZGF0ZVJvdycsY3VycmVudFJvdykpe1xyXG5cdCAgXHRcdCAgICAgICRkYXRhZ3JpZC5kYXRhZ3JpZChcImVuZEVkaXRcIiwgY3VycmVudFJvdyk7XHJcblx0ICBcdFx0ICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdCAgXHRcdCAgICAgICAgJGRhdGFncmlkLmRhdGFncmlkKFwiYmVnaW5FZGl0XCIsIHJvd0luZGV4KTtcclxuXHQgIFx0XHQgICAgICB9LDApO1xyXG5cdCAgXHRcdCAgICB9ZWxzZXtcclxuXHQgICAgICAgICAgICAkZGF0YWdyaWQuZGF0YWdyaWQoXCJ1bnNlbGVjdFJvd1wiLCByb3dJbmRleCk7XHJcblx0ICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdCAgICAgICAgICAgICAgJGRhdGFncmlkLmRhdGFncmlkKFwic2VsZWN0Um93XCIsIGN1cnJlbnRSb3cpO1xyXG5cdCAgICAgICAgICAgIH0sMCk7ICAgICBcclxuXHQgICAgICAgICAgICByZXR1cm47XHJcblx0ICBcdFx0ICAgIH1cclxuXHQgIFx0XHQgIH1cclxuXHRcdCAgXHR9XHJcblx0XHRcdC8vIGRhdGFncmlkLm9uU2VsZWN0KHJvd0luZGV4LCByb3dEYXRhKVxyXG5cdFx0XHQvLyB0cmVlZ3JpZC5vblNlbGVjdChpZClcclxuXHRcdFx0aWYgKCRkYXRhZ3JpZC5oYXNDbGFzcyhcImVhc3l1aS10cmVlZ3JpZFwiKSkge1xyXG5cdFx0XHRcdHZhciBpZCA9IHJvd0luZGV4O1xyXG5cdFx0XHRcdCRkYXRhZ3JpZC5kYXRhKFwic2VsZWN0ZWRJZFwiLCBpZCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Ly8gdXNlIHNoaWZ0IGtleSB0byBtdWx0aSBzZWxlY3Qgcm93c1xyXG5cdFx0XHRcdGlmICghJGRhdGFncmlkLmRhdGFncmlkKFwib3B0aW9uc1wiKS5zaW5nbGVTZWxlY3QpIHtcclxuXHRcdFx0XHRcdGlmICgkZGF0YWdyaWQuZGF0YShcInNoaWZ0S2V5XCIpKSB7XHJcblx0XHRcdFx0XHRcdCRkYXRhZ3JpZC5yZW1vdmVEYXRhKFwic2hpZnRLZXlcIik7XHJcblx0XHRcdFx0XHRcdHZhciBsYXN0U2VsZWN0ZWRJbmRleCA9ICRkYXRhZ3JpZC5kYXRhKFwibGFzdFNlbGVjdGVkSW5kZXhcIik7XHJcblx0XHRcdFx0XHRcdGlmIChsYXN0U2VsZWN0ZWRJbmRleCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAobGFzdFNlbGVjdGVkSW5kZXggPCByb3dJbmRleCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IGxhc3RTZWxlY3RlZEluZGV4OyBpIDwgcm93SW5kZXg7IGkrKykge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJzZWxlY3RSb3dcIiwgaSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSByb3dJbmRleDsgaSA8IGxhc3RTZWxlY3RlZEluZGV4OyBpKyspIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwic2VsZWN0Um93XCIsIGkpO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0JGRhdGFncmlkLmRhdGEoXCJsYXN0U2VsZWN0ZWRJbmRleFwiLCByb3dJbmRleCk7XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHR2YXIgaWR4ID0gJGRhdGFncmlkLmRhdGEoXCJsYXN0U2VsZWN0ZWRJbmRleFwiKTtcclxuXHRcdFx0XHRcdGlmKGlkeCA9PSByb3dJbmRleCl7XHJcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJ1bnNlbGVjdFJvd1wiLGlkeCk7XHJcblx0XHRcdFx0XHRcdH0sMTApO1xyXG5cdFx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YShcImxhc3RTZWxlY3RlZEluZGV4XCIsbnVsbCk7XHJcblx0XHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdFx0JGRhdGFncmlkLmRhdGEoXCJsYXN0U2VsZWN0ZWRJbmRleFwiLHJvd0luZGV4KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHRvbkFmdGVyRWRpdDogZnVuY3Rpb24gKHJvd0luZGV4LCByb3dEYXRhLCBjaGFuZ2VzKSB7XHJcblx0XHRcdGlmICghJC5pc0VtcHR5T2JqZWN0KGNoYW5nZXMpKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kYXRhZ3JpZChcInJlZnJlc2hGb290ZXJcIik7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHQvL29uQ2FuY2VsRWRpdDogZnVuY3Rpb24gKHJvd0luZGV4LCByb3dEYXRhKSB7IH0sXHJcblx0XHRvbkhlYWRlckNvbnRleHRNZW51OiBmdW5jdGlvbiAoZSwgZmllbGQpIHtcclxuXHRcdFx0JC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5vblJvd0NvbnRleHRNZW51LmFwcGx5KHRoaXMsIFtlLCBudWxsLCBudWxsXSk7XHJcblx0XHR9LFxyXG5cdFx0b25Db250ZXh0TWVudTogZnVuY3Rpb24gKGUsIHJvdykge1xyXG5cdFx0XHQkLmZuLmRhdGFncmlkLmRlZmF1bHRzLm9uUm93Q29udGV4dE1lbnUuYXBwbHkodGhpcywgW2UsIG51bGwsIHJvd10pO1xyXG5cdFx0fSxcclxuXHRcdG9uUm93Q29udGV4dE1lbnU6IGZ1bmN0aW9uIChlLCByb3dJbmRleCwgcm93RGF0YSkge1xyXG5cdFx0XHRpZiAoZm14LnRleHRTZWxlY3RlZCgpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciAkZGF0YWdyaWQgPSAkKHRoaXMpO1xyXG5cdFx0XHR2YXIgb3B0aW9ucyA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcIm9wdGlvbnNcIik7XHJcblx0XHRcdGlmKCFvcHRpb25zLnNob3dDb250ZXh0TWVudSkgcmV0dXJuO1xyXG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmIChvcHRpb25zLmNvbnRleHRNZW51KSB7XHJcblx0XHRcdFx0b3B0aW9ucy5jb250ZXh0TWVudS5tZW51KFwic2hvd1wiLCB7XHJcblx0XHRcdFx0XHRsZWZ0OiBlLnBhZ2VYLFxyXG5cdFx0XHRcdFx0dG9wOiBlLnBhZ2VZXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciBtZW51ID0gW107XHJcblx0XHRcdG1lbnUucHVzaChcIjxkaXYgY2xhc3M9J2Vhc3l1aS1tZW51JyBzdHlsZT0nd2lkdGg6MjAwcHg7Jz5cIik7XHJcblx0XHRcdG1lbnUucHVzaChcIjxkaXYgaWQ9J1JlZnJlc2gnPlwiICsgJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5yZWZyZXNoVGV4dCk7XHJcblx0XHRcdG1lbnUucHVzaChcIjwvZGl2PlwiICsgXCI8ZGl2IGlkPSdSZXNldFNvcnQnPlwiKTtcclxuXHRcdFx0bWVudS5wdXNoKCQuZm4uZGF0YWdyaWQuZGVmYXVsdHMucmVzZXRTb3J0VGV4dCArIFwiPC9kaXY+XCIpO1xyXG5cdFx0XHRpZihvcHRpb25zLnNob3dFeHBvcnRDb250ZXh0TWVudSl7XHJcblx0XHRcdFx0bWVudS5wdXNoKFwiPGRpdiBjbGFzcz0nbWVudS1zZXAnPjwvZGl2PlwiKTtcclxuXHRcdFx0XHRtZW51LnB1c2goXCI8ZGl2IGlkPSdFeHBvcnRFeGNlbEN1cnJlbnRQYWdlJz5cIik7XHJcblx0XHRcdFx0bWVudS5wdXNoKCQuZm4uZGF0YWdyaWQuZGVmYXVsdHMuZXhwb3J0RXhjZWxDdXJyZW50UGFnZVRleHQgKyBcIjwvZGl2PlwiKTtcclxuXHRcdFx0XHRtZW51LnB1c2goXCI8ZGl2IGlkPSdFeHBvcnRFeGNlbEFsbCc+XCIpO1xyXG5cdFx0XHRcdG1lbnUucHVzaCgkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmV4cG9ydEV4Y2VsQWxsVGV4dCArIFwiPC9kaXY+XCIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdG1lbnUucHVzaChcIjxkaXYgY2xhc3M9J21lbnUtc2VwJz48L2Rpdj5cIiArIFwiPGRpdj48c3Bhbj5cIik7XHJcblx0XHRcdG1lbnUucHVzaCgkLmZuLmRhdGFncmlkLmRlZmF1bHRzLnNob3dDb2x1bW5zVGV4dCk7XHJcblx0XHRcdG1lbnUucHVzaChcIjwvc3Bhbj48ZGl2IHN0eWxlPSd3aWR0aDoxODBweDsnPlwiKTtcclxuXHRcdFx0JC5lYWNoKCRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldENvbHVtbkZpZWxkc1wiKSwgZnVuY3Rpb24gKGluZGV4LCBmaWVsZCkge1xyXG5cdFx0XHRcdHZhciBjb2x1bW5PcHRpb24gPSAkZGF0YWdyaWQuZGF0YWdyaWQoXCJnZXRDb2x1bW5PcHRpb25cIiwgZmllbGQpO1xyXG5cdFx0XHRcdGlmKGNvbHVtbk9wdGlvbi5oaWRkZW4pe1xyXG5cdFx0XHRcdFx0bWVudS5wdXNoKFwiPGRpdiBkYXRhLWZpZWxkPSdcIiArIGZpZWxkICsgXCInIGRhdGEtdGl0bGU9J1wiK2NvbHVtbk9wdGlvbi50aXRsZStcIicgaGlkZGluZz0ndHJ1ZSc+Jm5ic3A7Jm5ic3A7Jm5ic3A7XCIgKyBjb2x1bW5PcHRpb24udGl0bGUgKyBcIjwvZGl2PlwiKTtcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdG1lbnUucHVzaChcIjxkaXYgZGF0YS1maWVsZD0nXCIgKyBmaWVsZCArIFwiJyBkYXRhLXRpdGxlPSdcIitjb2x1bW5PcHRpb24udGl0bGUrXCInPuKImiBcIiArIGNvbHVtbk9wdGlvbi50aXRsZSArIFwiPC9kaXY+XCIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdG1lbnUucHVzaChcIjwvZGl2PjwvZGl2PjwvZGl2PlwiKTtcclxuXHRcdFx0dmFyICRtZW51ID0gJChtZW51LmpvaW4oJycpKS5hcHBlbmRUbygkZGF0YWdyaWQuY2xvc2VzdChcIi5kYXRhZ3JpZFwiKSk7XHJcblx0XHRcdG9wdGlvbnMuY29udGV4dE1lbnUgPSAkbWVudTtcclxuXHRcdFx0JG1lbnUubWVudSh7XHJcblx0XHRcdFx0bGVmdDogZS5wYWdlWCxcclxuXHRcdFx0XHR0b3A6IGUucGFnZVksXHJcblx0XHRcdFx0ZXZlbnRzIDoge1xyXG5cdFx0XHRcdFx0bW91c2VlbnRlcjogJC5mbi5tZW51LmRlZmF1bHRzLmV2ZW50cy5tb3VzZWVudGVyLFxyXG5cdFx0XHRcdFx0bW91c2VsZWF2ZTogJC5mbi5tZW51LmRlZmF1bHRzLmV2ZW50cy5tb3VzZWxlYXZlLFxyXG5cdFx0XHRcdFx0bW91c2VvdmVyOiAkLmZuLm1lbnUuZGVmYXVsdHMuZXZlbnRzLm1vdXNlb3ZlcixcclxuXHRcdFx0XHRcdG1vdXNlb3V0OiAkLmZuLm1lbnUuZGVmYXVsdHMuZXZlbnRzLm1vdXNlb3V0LFxyXG5cdFx0XHRcdFx0Y2xpY2sgOiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0XHRcdHZhciB0YXJnZXQgPSBlLmRhdGEudGFyZ2V0O1xyXG5cdFx0XHRcdFx0XHR2YXIgJGl0ZW0gPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCcubWVudS1pdGVtJyk7XHJcblx0XHRcdFx0XHRcdHZhciBpdGVtID0gJCh0YXJnZXQpLm1lbnUoJ2dldEl0ZW0nLCAkaXRlbVswXSk7XHJcblx0XHRcdFx0XHRcdGlmKCFpdGVtLmlkICYmICRpdGVtLmF0dHIoJ2RhdGEtZmllbGQnKSl7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG9wdHMgPSAkKHRhcmdldCkuZGF0YSgnbWVudScpLm9wdGlvbnM7XHJcblx0XHRcdFx0XHRcdFx0JGl0ZW0udHJpZ2dlcignbW91c2VlbnRlcicpO1xyXG5cdFx0XHRcdFx0XHRcdG9wdHMub25DbGljay5jYWxsKHRhcmdldCwgaXRlbSk7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdCQuZm4ubWVudS5kZWZhdWx0cy5ldmVudHMuY2xpY2suY2FsbCh0aGlzLGUpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DbGljazogZnVuY3Rpb24gKGl0ZW0pIHtcclxuXHRcdFx0XHRcdHN3aXRjaCAoaXRlbS5pZCkge1xyXG5cdFx0XHRcdFx0XHRjYXNlIFwiUmVmcmVzaFwiOlxyXG5cdFx0XHRcdFx0XHRcdGlmICgkZGF0YWdyaWQuaGFzQ2xhc3MoXCJlYXN5dWktdHJlZWdyaWRcIikpIHtcclxuXHRcdFx0XHRcdFx0XHRcdCRkYXRhZ3JpZC50cmVlZ3JpZChcInJlbG9hZFwiKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwicmVsb2FkXCIpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdFx0Y2FzZSBcIlJlc2V0U29ydFwiOlxyXG5cdFx0XHRcdFx0XHRcdCRkYXRhZ3JpZC5kYXRhZ3JpZChcInF1ZXJ5XCIpO1xyXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHRjYXNlIFwiRXhwb3J0RXhjZWxDdXJyZW50UGFnZVwiOlxyXG5cdFx0XHRcdFx0XHRcdCRkYXRhZ3JpZC5kYXRhZ3JpZChcImV4cG9ydEV4Y2VsXCIsIHRydWUpO1xyXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHRjYXNlIFwiRXhwb3J0RXhjZWxBbGxcIjpcclxuXHRcdFx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJleHBvcnRFeGNlbFwiKTtcclxuXHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdFx0XHR2YXIgJGl0ZW0gPSAkKGl0ZW0udGFyZ2V0KTtcclxuXHRcdFx0XHRcdFx0ICAgIHZhciBmaWVsZCA9ICRpdGVtLmF0dHIoJ2RhdGEtZmllbGQnKTtcclxuXHRcdFx0XHRcdFx0XHRpZiAoZmllbGQpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciAkdGV4dCA9ICRpdGVtLmNoaWxkcmVuKFwiLm1lbnUtdGV4dFwiKTtcclxuXHRcdFx0XHRcdFx0XHRcdGlmICgkaXRlbS5hdHRyKFwiaGlkZGluZ1wiKSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHQkZGF0YWdyaWQuZGF0YWdyaWQoXCJzaG93Q29sdW1uXCIsIGZpZWxkKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0JGl0ZW0ucmVtb3ZlQXR0cihcImhpZGRpbmdcIik7XHJcblx0XHRcdFx0XHRcdFx0XHRcdCR0ZXh0LnRleHQoXCLiiJogXCIgKyAkaXRlbS5hdHRyKCdkYXRhLXRpdGxlJykpO1xyXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0JGRhdGFncmlkLmRhdGFncmlkKFwiaGlkZUNvbHVtblwiLCBmaWVsZCk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdCRpdGVtLmF0dHIoXCJoaWRkaW5nXCIsIHRydWUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHQkdGV4dC5odG1sKFwiJm5ic3A7Jm5ic3A7Jm5ic3A7XCIrJGl0ZW0uYXR0cignZGF0YS10aXRsZScpKTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KS5tZW51KFwic2hvd1wiKTtcclxuXHRcdH0sXHJcblx0XHR2aWV3IDogJC5leHRlbmQoJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy52aWV3LHtcclxuXHRcdFx0cmVuZGVyOiBmdW5jdGlvbih0YXJnZXQsIGNvbnRhaW5lciwgZnJvemVuKXtcclxuXHRcdFx0XHR2YXIgcm93cyA9ICQodGFyZ2V0KS5kYXRhZ3JpZCgnZ2V0Um93cycpO1xyXG5cdFx0XHRcdGNvbnRhaW5lclswXS5pbm5lckhUTUwgPSB0aGlzLnJlbmRlclRhYmxlKHRhcmdldCwgMCwgcm93cywgZnJvemVuKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0cmVuZGVyRm9vdGVyOiBmdW5jdGlvbih0YXJnZXQsIGNvbnRhaW5lciwgZnJvemVuKXtcclxuXHRcdFx0XHR2YXIgb3B0cyA9ICQuZGF0YSh0YXJnZXQsICdkYXRhZ3JpZCcpLm9wdGlvbnM7XHJcblx0XHRcdFx0dmFyIHJvd3MgPSAkLmRhdGEodGFyZ2V0LCAnZGF0YWdyaWQnKS5mb290ZXIgfHwgW107XHJcblx0XHRcdFx0dmFyIGZpZWxkcyA9ICQodGFyZ2V0KS5kYXRhZ3JpZCgnZ2V0Q29sdW1uRmllbGRzJywgZnJvemVuKTtcclxuXHRcdFx0XHR2YXIgdGFibGUgPSBbJzx0YWJsZSBjbGFzcz1cImRhdGFncmlkLWZ0YWJsZVwiIGNlbGxzcGFjaW5nPVwiMFwiIGNlbGxwYWRkaW5nPVwiMFwiIGJvcmRlcj1cIjBcIj48dGJvZHk+J107XHJcblx0XHRcdFx0Zm9yKHZhciBpPTA7IGk8cm93cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRcdFx0XHR0YWJsZS5wdXNoKCc8dHIgY2xhc3M9XCJkYXRhZ3JpZC1yb3dcIiBkYXRhZ3JpZC1yb3ctaW5kZXg9XCInICsgaSArICdcIj4nKTtcclxuXHRcdFx0XHRcdHRhYmxlLnB1c2godGhpcy5yZW5kZXJSb3cuY2FsbCh0aGlzLCB0YXJnZXQsIGZpZWxkcywgZnJvemVuLCBpLCByb3dzW2ldKSk7XHJcblx0XHRcdFx0XHR0YWJsZS5wdXNoKCc8L3RyPicpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0YWJsZS5wdXNoKCc8L3Rib2R5PjwvdGFibGU+Jyk7XHJcblx0XHRcdFx0Y29udGFpbmVyWzBdLmlubmVySFRNTCA9IHRhYmxlLmpvaW4oJycpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR1cGRhdGVSb3c6IGZ1bmN0aW9uKHRhcmdldCwgcm93SW5kZXgsIHJvdyl7XHJcblx0XHRcdFx0dmFyIG9wdHMgPSAkLmRhdGEodGFyZ2V0LCAnZGF0YWdyaWQnKS5vcHRpb25zO1xyXG5cdFx0XHRcdHZhciByb3dEYXRhID0gb3B0cy5maW5kZXIuZ2V0Um93KHRhcmdldCwgcm93SW5kZXgpO1xyXG5cclxuXHRcdFx0XHQkLmV4dGVuZChyb3dEYXRhLCByb3cpO1xyXG5cdFx0XHRcdHZhciBjcyA9IF9nZXRSb3dTdHlsZS5jYWxsKHRoaXMsIHJvd0luZGV4KTtcclxuXHRcdFx0XHR2YXIgc3R5bGUgPSBjcy5zO1xyXG5cdFx0XHRcdHZhciBjbHMgPSAnZGF0YWdyaWQtcm93ICcgKyAocm93SW5kZXggJSAyICYmIG9wdHMuc3RyaXBlZCA/ICdkYXRhZ3JpZC1yb3ctYWx0ICcgOiAnICcpICsgY3MuYztcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmdW5jdGlvbiBfZ2V0Um93U3R5bGUocm93SW5kZXgpe1xyXG5cdFx0XHRcdFx0dmFyIGNzcyA9IG9wdHMucm93U3R5bGVyID8gb3B0cy5yb3dTdHlsZXIuY2FsbCh0YXJnZXQsIHJvd0luZGV4LCByb3dEYXRhKSA6ICcnO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0U3R5bGVWYWx1ZShjc3MpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiBfdXBkYXRlKGZyb3plbil7XHJcblx0XHRcdFx0XHR2YXIgZmllbGRzID0gJCh0YXJnZXQpLmRhdGFncmlkKCdnZXRDb2x1bW5GaWVsZHMnLCBmcm96ZW4pO1xyXG5cdFx0XHRcdFx0dmFyIHRyID0gb3B0cy5maW5kZXIuZ2V0VHIodGFyZ2V0LCByb3dJbmRleCwgJ2JvZHknLCAoZnJvemVuPzE6MikpO1xyXG5cdFx0XHRcdFx0Ly92YXIgY2hlY2tlZCA9IHRyLmZpbmQoJ2Rpdi5kYXRhZ3JpZC1jZWxsLWNoZWNrIGlucHV0W3R5cGU9Y2hlY2tib3hdJykuaXMoJzpjaGVja2VkJyk7XHJcblx0XHRcdFx0XHR0ci5odG1sKHRoaXMucmVuZGVyUm93LmNhbGwodGhpcywgdGFyZ2V0LCBmaWVsZHMsIGZyb3plbiwgcm93SW5kZXgsIHJvd0RhdGEpKTtcclxuXHRcdFx0XHRcdHRyLmF0dHIoJ3N0eWxlJywgc3R5bGUpLmF0dHIoJ2NsYXNzJywgY2xzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0X3VwZGF0ZS5jYWxsKHRoaXMsIHRydWUpO1xyXG5cdFx0XHRcdF91cGRhdGUuY2FsbCh0aGlzLCBmYWxzZSk7XHJcblx0XHRcdFx0JCh0YXJnZXQpLmRhdGFncmlkKCdmaXhSb3dIZWlnaHQnLCByb3dJbmRleCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdHJlbmRlclJvdzogZnVuY3Rpb24odGFyZ2V0LCBmaWVsZHMsIGZyb3plbiwgcm93SW5kZXgsIHJvd0RhdGEpe1xyXG5cdFx0XHRcdHZhciBvcHRzID0gJC5kYXRhKHRhcmdldCwgJ2RhdGFncmlkJykub3B0aW9ucztcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR2YXIgY2MgPSBbXTtcclxuXHRcdFx0XHRpZiAoZnJvemVuICYmIG9wdHMucm93bnVtYmVycyl7XHJcblx0XHRcdFx0XHR2YXIgcm93bnVtYmVyID0gcm93SW5kZXggKyAxO1xyXG5cdFx0XHRcdFx0aWYgKG9wdHMucGFnaW5hdGlvbil7XHJcblx0XHRcdFx0XHRcdHJvd251bWJlciArPSAob3B0cy5wYWdlTnVtYmVyLTEpKm9wdHMucGFnZVNpemU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRjYy5wdXNoKCc8dGQgY2xhc3M9XCJkYXRhZ3JpZC10ZC1yb3dudW1iZXJcIj48ZGl2IGNsYXNzPVwiZGF0YWdyaWQtY2VsbC1yb3dudW1iZXJcIj4nK3Jvd251bWJlcisnPC9kaXY+PC90ZD4nKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Zm9yKHZhciBpPTA7IGk8ZmllbGRzLmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0XHRcdHZhciBmaWVsZCA9IGZpZWxkc1tpXTtcclxuXHRcdFx0XHRcdHZhciBjb2wgPSAkKHRhcmdldCkuZGF0YWdyaWQoJ2dldENvbHVtbk9wdGlvbicsIGZpZWxkKTtcclxuXHRcdFx0XHRcdGlmIChjb2wpe1xyXG5cdFx0XHRcdFx0XHR2YXIgdmFsdWUgPSByb3dEYXRhW2ZpZWxkXTtcdC8vIHRoZSBmaWVsZCB2YWx1ZVxyXG5cdFx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlID09IG51bGwgfHwgdmFsdWUgPT0gdW5kZWZpbmVkID8gJycgOiB2YWx1ZTsgXHJcblx0XHRcdFx0XHRcdHZhciBjc3MgPSBjb2wuc3R5bGVyID8gKGNvbC5zdHlsZXIodmFsdWUsIHJvd0RhdGEsIHJvd0luZGV4KXx8JycpIDogJyc7XHJcblx0XHRcdFx0XHRcdHZhciBjcyA9IHRoaXMuZ2V0U3R5bGVWYWx1ZShjc3MpO1xyXG5cdFx0XHRcdFx0XHR2YXIgY2xzID0gY3MuYyA/ICdjbGFzcz1cIicgKyBjcy5jICsgJ1wiJyA6ICcnO1xyXG5cdFx0XHRcdFx0XHR2YXIgc3R5bGUgPSBjb2wuaGlkZGVuID8gJ3N0eWxlPVwiZGlzcGxheTpub25lOycgKyBjcy5zICsgJ1wiJyA6IChjcy5zID8gJ3N0eWxlPVwiJyArIGNzLnMgKyAnXCInIDogJycpO1xyXG5cdFx0XHRcdFx0XHR2YXIgdmFsaWduID0gY29sLnZhbGlnbiA/ICcgdmFsaWduPVwiJytjb2wudmFsaWduKydcIic6Jyc7XHJcblx0XHRcdFx0XHRcdGNjLnB1c2goJzx0ZCBmaWVsZD1cIicgKyBmaWVsZCArICdcIiAnICsgY2xzICsgJyAnICsgc3R5bGUgKyB2YWxpZ24gKyAnPicpO1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0dmFyIHN0eWxlID0gJyc7XHJcblx0XHRcdFx0XHRcdGlmICghY29sLmNoZWNrYm94KXtcclxuXHRcdFx0XHRcdFx0XHRpZiAoY29sLmFsaWduKXtzdHlsZSArPSAndGV4dC1hbGlnbjonICsgY29sLmFsaWduICsgJzsnfVxyXG5cdFx0XHRcdFx0XHRcdGlmICghb3B0cy5ub3dyYXApe1xyXG5cdFx0XHRcdFx0XHRcdFx0c3R5bGUgKz0gJ3doaXRlLXNwYWNlOm5vcm1hbDtoZWlnaHQ6YXV0bzsnO1xyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAob3B0cy5hdXRvUm93SGVpZ2h0KXtcclxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlICs9ICdoZWlnaHQ6YXV0bzsnO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0Y2MucHVzaCgnPGRpdiBzdHlsZT1cIicgKyBzdHlsZSArICdcIiAnKTtcclxuXHRcdFx0XHRcdFx0Y2MucHVzaChjb2wuY2hlY2tib3ggPyAnY2xhc3M9XCJkYXRhZ3JpZC1jZWxsLWNoZWNrXCInIDogJ2NsYXNzPVwiZGF0YWdyaWQtY2VsbCAnICsgY29sLmNlbGxDbGFzcyArICdcIicpO1xyXG5cdFx0XHRcdFx0XHRjYy5wdXNoKCc+Jyk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRpZiAoY29sLmNoZWNrYm94KXtcclxuXHRcdFx0XHRcdFx0XHRjYy5wdXNoKCc8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgJyArIChyb3dEYXRhLmNoZWNrZWQgPyAnY2hlY2tlZD1cImNoZWNrZWRcIicgOiAnJykpO1xyXG5cdFx0XHRcdFx0XHRcdGNjLnB1c2goJyBuYW1lPVwiJyArIGZpZWxkICsgJ1wiIHZhbHVlPVwiJyArICh2YWx1ZSE9dW5kZWZpbmVkID8gdmFsdWUgOiAnJykgKyAnXCI+Jyk7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoY29sLmZvcm1hdHRlcil7XHJcblx0XHRcdFx0XHRcdFx0Y2MucHVzaChjb2wuZm9ybWF0dGVyKHZhbHVlLCByb3dEYXRhLCByb3dJbmRleCkpO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGNjLnB1c2godmFsdWUpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRjYy5wdXNoKCc8L2Rpdj4nKTtcclxuXHRcdFx0XHRcdFx0Y2MucHVzaCgnPC90ZD4nKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGNjLmpvaW4oJycpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkFmdGVyUmVuZGVyIDogZnVuY3Rpb24odGFyZ2V0KSB7XHJcblx0XHRcdFx0b25WaWV3QWZ0ZXJSZW5kZXIuY2FsbCh0aGlzLHRhcmdldCk7XHJcblx0XHRcdFx0dmFyIHN0YXRlID0gJC5kYXRhKHRhcmdldCwgJ2RhdGFncmlkJyk7XHJcblx0XHRcdFx0dmFyIG9wdHMgPSBzdGF0ZS5vcHRpb25zO1xyXG5cdFx0XHRcdGlmKG9wdHMucm93bnVtYmVycyl7XHJcblx0XHRcdFx0XHRpZighc3RhdGUucm93TnVtYmVyV2lkdGgpIHtcclxuXHRcdFx0XHRcdFx0dmFyIHdpZHRoID0gb3B0cy5zaG93SGVhZGVyID8gc3RhdGUuZGMuaGVhZGVyMS5maW5kKFwiLmRhdGFncmlkLWhlYWRlci1yb3dudW1iZXJcIikuZXEoMCkud2lkdGgoKSA6IHN0YXRlLmRjLmJvZHkxLmZpbmQoXCIuZGF0YWdyaWQtY2VsbC1yb3dudW1iZXI6Zmlyc3RcIikuZXEoMCkud2lkdGgoKTtcclxuXHRcdFx0XHRcdFx0c3RhdGUucm93TnVtYmVyV2lkdGggPSB3aWR0aDtcclxuXHRcdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0XHR2YXIgcm4gPSBzdGF0ZS5kYXRhICYmICQuaXNBcnJheShzdGF0ZS5kYXRhLnJvd3MpID8gc3RhdGUuZGF0YS5yb3dzLmxlbmd0aCA6IDA7XHJcblx0XHRcdFx0XHRcdGlmKG9wdHMucGFnaW5hdGlvbil7XHJcblx0XHRcdFx0XHRcdFx0cm4gKz0gKG9wdHMucGFnZU51bWJlci0xKSpvcHRzLnBhZ2VTaXplO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHZhciB3aWR0aCA9IHN0YXRlLnJvd051bWJlcldpZHRoO1xyXG5cdFx0XHRcdFx0XHR2YXIgbGVuID0gcm4udG9TdHJpbmcoKS5sZW5ndGggLSAyO1xyXG5cdFx0XHRcdFx0XHRpZihsZW4gPiAwKXtcclxuXHRcdFx0XHRcdFx0XHR3aWR0aCArPSA4ICogbGVuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHZhciB3ID0gb3B0cy5zaG93SGVhZGVyID8gc3RhdGUuZGMuaGVhZGVyMS5maW5kKFwiLmRhdGFncmlkLWhlYWRlci1yb3dudW1iZXJcIikuZXEoMCkud2lkdGgoKSA6IHN0YXRlLmRjLmJvZHkxLmZpbmQoXCIuZGF0YWdyaWQtY2VsbC1yb3dudW1iZXI6Zmlyc3RcIikuZXEoMCkud2lkdGgoKTtcclxuXHRcdFx0XHRcdFx0aWYodyAhPT0gc3RhdGUucm93TnVtYmVyV2lkdGggfHwgdyAhPT0gd2lkdGgpe1xyXG5cdFx0XHRcdFx0XHRcdHN0YXRlLmRjLmJvZHkxLmZpbmQoXCIuZGF0YWdyaWQtY2VsbC1yb3dudW1iZXJcIikud2lkdGgod2lkdGgpO1xyXG5cdFx0XHRcdFx0XHRcdGlmKG9wdHMuc2hvd0hlYWRlcil7XHJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5kYy5oZWFkZXIxLmZpbmQoXCIuZGF0YWdyaWQtaGVhZGVyLXJvd251bWJlclwiKS53aWR0aCh3aWR0aCk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdCQodGFyZ2V0KS5kYXRhZ3JpZChcImZpeENvbHVtblNpemVcIik7XHJcblx0XHRcdFx0XHRcdFx0aWYob3B0cy5zaG93Rm9vdGVyKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5kYy5mb290ZXIxLmZpbmQoXCIuZGF0YWdyaWQtY2VsbC1yb3dudW1iZXJcIikud2lkdGgod2lkdGgpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9KTtcclxuXHQkLmV4dGVuZCgkLmZuLmRhdGFsaXN0LmRlZmF1bHRzLHtcclxuXHRcdHVybDogdHJ1ZSxcclxuXHRcdGF1dG9Mb2FkIDogJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5hdXRvTG9hZCxcclxuXHRcdGxvYWRlciA6ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZGVyLFxyXG5cdFx0bG9hZEZpbHRlciA6ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZEZpbHRlclxyXG5cdH0pO1xyXG5cdCQuZXh0ZW5kKCQuZm4udHJlZWdyaWQuZGVmYXVsdHMse1xyXG5cdFx0dXJsOiB0cnVlLFxyXG5cdFx0YXV0b0xvYWQgOiAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmF1dG9Mb2FkLFxyXG5cdFx0bG9hZGVyIDogJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5sb2FkZXIsXHJcblx0XHRsb2FkRmlsdGVyIDogJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5sb2FkRmlsdGVyLFxyXG5cdFx0Zm9ybWF0dGVycyA6ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMuZm9ybWF0dGVycyxcclxuXHRcdGZvcm1hdHRlciA6ICAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmZvcm1hdHRlclxyXG5cdH0pO1xyXG59KShqUXVlcnksIGZteCk7XHJcbiIsIjsgKGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuICAgIHZhciBTRUxFQ1RfQ09ERV9EQVRBUyA9IGZteC5nZXRTZWxlY3RDb2RlRGF0YXMoKSwgU0VMRUNUX0NPREVfT1BUUyA9IGZteC5nZXRTZWxlY3RDb2RlT3B0cygpO1xyXG4gICAgXHJcbiAgICAvKiogKioqKioqKiogY29tYm9ib3ggKioqKioqKioqICovXHJcbiAgICB2YXIgX2NvbWJvYm94ID0gJC5mbi5jb21ib2JveDtcclxuXHJcbiAgICAkLmZuLmNvbWJvYm94ID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmFtKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghJC5kYXRhKHRoaXMsIFwiY29tYm9ib3hcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNvbWJvYm94KHt9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29tYm9ib3guYXBwbHkodGhpcywgW29wdGlvbnMsIHBhcmFtXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluaXRDb21ib2JveCh0aGlzLCBvcHRpb25zIHx8IHt9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICAkLmV4dGVuZCgkLmZuLmNvbWJvYm94LF9jb21ib2JveCk7ICAgIFxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBhZGRFbXB0eUl0ZW0ob3B0cyxkYXRhTGlzdCkge1xyXG4gICAgXHRpZighb3B0cy5lbXB0eUl0ZW1FbmFibGUgfHwgb3B0cy5tdWx0aXBsZSkgcmV0dXJuIGRhdGFMaXN0O1xyXG4gICAgXHR2YXIgaXRlbSA9IHt9O1xyXG4gICAgXHRpdGVtW29wdHMudmFsdWVGaWVsZF0gPSBvcHRzLmVtcHR5SXRlbVZhbHVlO1xyXG4gICAgXHRpdGVtW29wdHMudGV4dEZpZWxkXSA9IG9wdHMuZW1wdHlJdGVtVGV4dDtcclxuICAgIFx0aWYoJC5pc0FycmF5KGRhdGFMaXN0KSkge1xyXG4vLyAgICBcdFx0JC5lYWNoKGRhdGFMaXN0LGZ1bmN0aW9uKGksZGF0YSl7XHJcbi8vICAgIFx0XHRcdGlmKGRhdGFbJ3NlbGVjdGVkJ10pe1xyXG4vLyAgICBcdFx0XHRcdC8vaXRlbS5zZWxlY3RlZCA9IGZhbHNlO1xyXG4vLyAgICBcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuLy8gICAgXHRcdFx0fVxyXG4vLyAgICBcdFx0fSk7XHJcbiAgICBcdFx0ZGF0YUxpc3QudW5zaGlmdChpdGVtKTtcclxuICAgIFx0fWVsc2UgZGF0YUxpc3QgPSBbaXRlbV07XHJcbiAgICBcdHJldHVybiBkYXRhTGlzdDtcclxuICAgIH1cclxuICAgIHZhciBfcGFyc2VPcHRzID0gJC5mbi5jb21ib2JveC5wYXJzZU9wdGlvbnM7XHJcbiAgICAkLmZuLmNvbWJvYm94LnBhcnNlT3B0aW9ucyA9IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgXHR2YXIgb3B0cyA9IF9wYXJzZU9wdHModGFyZ2V0KTtcclxuICAgIFx0aWYodGFyZ2V0LmdldEF0dHJpYnV0ZSgnZW1wdHlJdGVtRW5hYmxlJykgPT09ICdmYWxzZScpe1xyXG4gICAgXHRcdG9wdHNbJ2VtcHR5SXRlbUVuYWJsZSddID0gZmFsc2U7XHJcbiAgICBcdH1cclxuICAgIFx0dmFyIHZhbCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2VtcHR5SXRlbVZhbHVlJyk7XHJcbiAgICBcdGlmKHZhbCkgb3B0c1snZW1wdHlJdGVtVmFsdWUnXSA9IHZhbDtcclxuICAgIFx0dmFsID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgnZW1wdHlJdGVtVGV4dCcpO1xyXG4gICAgXHRpZih2YWwpIG9wdHNbJ2VtcHR5SXRlbVRleHQnXSA9IHZhbDtcclxuICAgIFx0aWYob3B0cy5tdWx0aXBsZSl7XHJcbiAgICBcdFx0b3B0cy5lbXB0eUl0ZW1FbmFibGUgPSBmYWxzZTtcclxuICAgIFx0fVxyXG4gICAgXHRcclxuICAgIFx0dmFsID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgncXVlcnknKTtcclxuICAgIFx0aWYodmFsKSBvcHRzLnF1ZXJ5ID0gdmFsO1xyXG4gICAgXHRcclxuICAgIFx0dmFsID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgnY29kZVR5cGUnKTtcclxuICAgIFx0aWYodmFsKSBvcHRzLmNvZGVUeXBlPXZhbDtcclxuICAgIFx0XHJcbiAgICBcdHZhbCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ29yZGVyQnknKTtcclxuICAgIFx0aWYodmFsKSBvcHRzLm9yZGVyQnk9dmFsO1xyXG4gICAgXHRcclxuICAgIFx0dmFsID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgncXVlcnlGaWVsZHMnKTtcclxuICAgIFx0aWYodmFsICYmIHZhbC5jaGFyQXQoMCkgPT0gJ3snKSBvcHRzLnF1ZXJ5RmllbGRzID0gZXZhbCh2YWwpO1xyXG4gICAgXHRcclxuICAgIFx0cmV0dXJuIG9wdHM7XHJcbiAgICB9ICAgIFxyXG4gICAgXHJcbi8vICAgIHZhciBibHVyRXZ0ID0gJC5mbi5jb21ib2JveC5kZWZhdWx0cy5pbnB1dEV2ZW50cy5ibHVyO1xyXG4vLyAgICAkLmZuLmNvbWJvYm94LmRlZmF1bHRzLmlucHV0RXZlbnRzLmJsdXIgPSBmdW5jdGlvbihlKSB7XHJcbi8vICAgIFx0dmFyIHRhcmdldCA9IGUuZGF0YS50YXJnZXQsc3RhdGUgPSAkLmRhdGEodGFyZ2V0LCAnY29tYm9ib3gnKTtcclxuLy8gICAgXHRpZighc3RhdGUpIHJldHVybjtcclxuLy8gICAgXHR2YXIgY29tYm9TdGF0ZSA9ICQuZGF0YSh0YXJnZXQsXCJjb21ib1wiKTtcclxuLy8gICAgXHRpZihjb21ib1N0YXRlICYmIGNvbWJvU3RhdGUucGFuZWwpe1xyXG4vLyAgICBcdFx0dmFyIHBsT3B0cyA9IGNvbWJvU3RhdGUucGFuZWwucGFuZWwoXCJvcHRpb25zXCIpO1xyXG4vLyAgICBcdFx0aWYoIXBsT3B0cy5jbG9zZWQpIHJldHVybjtcclxuLy8gICAgXHR9XHJcbi8vICAgIFx0dmFyIG9wdHMgPSBzdGF0ZS5vcHRpb25zO1xyXG4vLyAgICBcdGlmKG9wdHMubXVsdGlwbGUpe1xyXG4vLyAgICBcdFx0dmFyICRqcSA9ICQodGFyZ2V0KTtcclxuLy9cdCAgICBcdGlmKG9wdHMubGltaXRUb0xpc3Qpe1xyXG4vL1x0ICAgIFx0XHRibHVyRXZ0KGUpO1xyXG4vL1x0ICAgIFx0fVxyXG4vLyAgICBcdH1lbHNlIHtcclxuLy8gICAgXHRcdHZhciBmbiA9ICQuZm4uY29tYm9ib3gubWV0aG9kcy5oaWRlUGFuZWw7XHJcbi8vICAgIFx0XHQkLmZuLmNvbWJvYm94Lm1ldGhvZHMuaGlkZVBhbmVsID0gJC5ub29wO1xyXG4vLyAgICBcdFx0Ymx1ckV2dChlKTtcclxuLy8gICAgXHRcdCQuZm4uY29tYm9ib3gubWV0aG9kcy5oaWRlUGFuZWwgPSBmbjtcclxuLy8gICAgXHR9XHJcbi8vICAgIH1cclxuICAgICQuZXh0ZW5kKCQuZm4uY29tYm9ib3guZGVmYXVsdHMsIHtcclxuICAgICAgICB3aWR0aDogMTU1LFxyXG4gICAgICAgIGxpbWl0VG9MaXN0IDogdHJ1ZSxcclxuICAgICAgICBsYXp5TG9hZDogdHJ1ZSxcclxuICAgICAgICBlbXB0eUl0ZW1FbmFibGUgOiB0cnVlLFxyXG4gICAgICAgIGVtcHR5SXRlbVZhbHVlIDogXCJcIixcclxuICAgICAgICBlbXB0eUl0ZW1UZXh0IDogXCJcIixcclxuICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChxLCByb3cpIHtcclxuICAgICAgICBcdHZhciBvcHRzID0gJC5kYXRhKHRoaXMsICdjb21ib2JveCcpLm9wdGlvbnM7XHJcbiAgICAgICAgICAgIHJldHVybiAocm93W29wdHMudGV4dEZpZWxkXSArIFwiXCIpLnRvVXBwZXJDYXNlKCkuaW5kZXhPZihxLnRvVXBwZXJDYXNlKCkpID49IDA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBsb2FkRmlsdGVyIDogZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgXHR2YXIgb3B0cyA9ICQuZGF0YSh0aGlzLCAnY29tYm9ib3gnKS5vcHRpb25zO1xyXG4gICAgICAgIFx0ZGF0YSA9IGFkZEVtcHR5SXRlbShvcHRzLGRhdGEpO1xyXG4gICAgICAgIFx0JC5kYXRhKHRoaXMsJ2NvbWJvJykub3B0aW9ucy5wYW5lbEhlaWdodCA9IE1hdGgubWluKGRhdGEubGVuZ3RoLCAxMCkgKiAyNSArIDI7XHJcbiAgICAgICAgXHRyZXR1cm4gZGF0YTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9sb2FkZXI6ICQuZm4uY29tYm9ib3guZGVmYXVsdHMubG9hZGVyLFxyXG4gICAgICAgIGxvYWRlcjogZnVuY3Rpb24gKHBhcmFtLCBzdWNjZXNzLCBlcnJvcikge1xyXG4gICAgICAgICAgICB2YXIgJGpxID0gJCh0aGlzKSwgb3B0cyA9ICRqcS5jb21ib2JveCgnb3B0aW9ucycpO1xyXG4gICAgICAgICAgICBpZihvcHRzLmxvYWRpbmcpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKCFvcHRzLnF1ZXJ5ICYmICFvcHRzLmNvZGVUeXBlKSB7XHJcbiAgICAgICAgICAgIFx0cmV0dXJuIG9wdHMuX2xvYWRlci5jYWxsKHRoaXMsIHBhcmFtLCBzdWNjZXNzLCBlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2VEYXRhKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5jb2RlIDwgMCB8fCAhcmVzdWx0LmRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IuY2FsbCgkanFbMF0sIHJlc3VsdC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgbWVyZ2VDb2RlRGF0YShvcHRzLHJlc3VsdC5kYXRhTGlzdCk7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzKChyZXN1bHQuZGF0YUxpc3QpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBkb0xvYWQoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnlJbmZvID0gZ2V0UXVlcnlJbmZvKG9wdHMscGFyYW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMucXVlcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBmbXguQ29tbW9uUXVlcnlTZXJ2aWNlLnF1ZXJ5KHF1ZXJ5SW5mbywgcGFyc2VEYXRhLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYob3B0cy5jb2RlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZteC5Db21tb25RdWVyeVNlcnZpY2UuZ2V0U2VsZWN0Q29kZURhdGEocXVlcnlJbmZvLCBwYXJzZURhdGEsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0cy5jb2RlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBTRUxFQ1RfQ09ERV9EQVRBU1tvcHRzLmNvZGVUeXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoJC5leHRlbmQoW10sZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRvTG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBtZXJnZUNvZGVEYXRhKG9wdHMsZGF0YSkge1xyXG4gICAgXHRpZihvcHRzLmNvZGVUeXBlKXtcclxuXHQgICAgICAgIGZteC5tZXJnZVNlbGVjdENvZGVWYWx1ZShvcHRzLmNvZGVUeXBlLCBvcHRzLnZhbHVlRmllbGQsIG9wdHMudGV4dEZpZWxkLCBkYXRhKTtcclxuXHQgICAgICAgIFNFTEVDVF9DT0RFX0RBVEFTW29wdHMuY29kZVR5cGVdID0gJC5leHRlbmQoW10sZGF0YSk7ICAgXHJcbiAgICBcdH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgZnVuY3Rpb24gZ2V0UXVlcnlJbmZvKG9wdHMscGFyYW0pIHtcclxuICAgIFx0dmFyIHF1ZXJ5RmllbGRzID0gW107XHJcbiAgICAgICAgaWYgKG9wdHMucXVlcnlGaWVsZHMpIHtcclxuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkocXVlcnlGaWVsZHMsIG9wdHMucXVlcnlGaWVsZHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocGFyYW0gJiYgcGFyYW0ucSkge1xyXG4gICAgICAgICAgICBpZiAob3B0cy50ZXh0RmllbGQpIHtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5RmllbGRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkTmFtZTogb3B0cy50ZXh0RmllbGQsXHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZTogcGFyYW0ucSxcclxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvcjogXCJpbGlrZUFueXdoZXJlXCJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBxdWVyeUluZm8gPSB7XHJcbiAgICAgICAgICAgIHF1ZXJ5OiBvcHRzLnF1ZXJ5IHx8IG9wdHMuY29kZVR5cGUsXHJcbiAgICAgICAgICAgIHF1ZXJ5RmllbGRzOiBxdWVyeUZpZWxkcyxcclxuICAgICAgICAgICAgb3JkZXJCeTogb3B0cy5vcmRlckJ5XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBxdWVyeUluZm87XHJcbiAgICB9XHJcbiAgICBcclxuICAgICQuZXh0ZW5kKCQuZm4uY29tYm9ib3gubWV0aG9kcywge1xyXG4gICAgICAgIF9zZXRWYWx1ZTogJC5mbi5jb21ib2JveC5tZXRob2RzLnNldFZhbHVlLFxyXG4gICAgICAgIHNldFZhbHVlOiBmdW5jdGlvbiAoanEsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkY29tYm9ib3ggPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgJGNvbWJvYm94LmNvbWJvYm94KFwic2V0VmFsdWVzXCIsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICRjb21ib2JveC5kYXRhKFwib2xkVmFsdWVzXCIsICRjb21ib2JveC5jb21ib2JveChcImdldFZhbHVlc1wiKSk7XHJcbiAgICAgICAgICAgICAgICAkY29tYm9ib3guZGF0YShcIm9sZFRleHRcIiwgJGNvbWJvYm94LmNvbWJvYm94KFwiZ2V0VGV4dFwiKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gaW5pdCBjb21ib2JveFxyXG4gICAgZnVuY3Rpb24gaW5pdENvbWJvYm94KCRqcSwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBjb21ib2JveExpc3QgPSBbXSxjb2RlVHlwZXM9e307XHJcbiAgICAgICAgJGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJGNvbWJvYm94ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwkLmZuLmNvbWJvYm94LnBhcnNlT3B0aW9ucyh0aGlzKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIHZhciBjb2RlVHlwZSA9IG9wdHNbJ2NvZGVUeXBlJ107XHJcbiAgICAgICAgICAgIGlmICghY29kZVR5cGUpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb21ib2JveC5jYWxsKCQodGhpcyksIG9wdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRjb21ib2JveC5hdHRyKCdjb21ib25hbWUnLCAkY29tYm9ib3guYXR0cignbmFtZScpKTtcclxuICAgICAgICAgICAgaWYgKFNFTEVDVF9DT0RFX09QVFNbY29kZVR5cGVdKSB7Ly9zZWxlY3QgY29kZSBvcHRpb25z5bey5Yqg6L29LOS9hmRhdGHmnKrliqDovb1cclxuICAgICAgICAgICAgXHRvcHRzID0gZXh0ZW5kQ29tYm9ib3hDb2RlT3B0cyhvcHRzLFNFTEVDVF9DT0RFX09QVFNbY29kZVR5cGVdKTtcclxuICAgICAgICAgICAgXHRpZigoISQuaXNBcnJheShvcHRzLnF1ZXJ5RmllbGRzKSB8fCBvcHRzLnF1ZXJ5RmllbGRzLmxlbmd0aCA9PSAwKSAmJiBTRUxFQ1RfQ09ERV9EQVRBU1tjb2RlVHlwZV0pe1xyXG4gICAgICAgICAgICBcdFx0b3B0cy5kYXRhID0gJC5leHRlbmQoW10sU0VMRUNUX0NPREVfREFUQVNbY29kZVR5cGVdKTtcclxuICAgICAgICAgICAgXHRcdHJldHVybiBfY29tYm9ib3guY2FsbCgkY29tYm9ib3gsIG9wdHMpO1xyXG4gICAgICAgICAgICBcdH1cclxuICAgICAgICAgICAgXHRvcHRzLmxvYWRpbmc9dHJ1ZTtcclxuICAgICAgICAgICAgXHRfY29tYm9ib3guY2FsbCgkY29tYm9ib3gsIG9wdHMpO1xyXG4gICAgICAgICAgICBcdGNvbWJvYm94TGlzdC5wdXNoKCRjb21ib2JveCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7Ly9vcHRpb25z5ZKMZGF0YemDveacquWKoOi9vVxyXG4gICAgICAgICAgICBcdG9wdHMubG9hZGluZz10cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvZGVUeXBlc1tjb2RlVHlwZV0pIGNvZGVUeXBlc1tjb2RlVHlwZV0ucHVzaCgkY29tYm9ib3gpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBjb2RlVHlwZXNbY29kZVR5cGVdID0gWyRjb21ib2JveF07XHJcbiAgICAgICAgICAgICAgICBfY29tYm9ib3guY2FsbCgkY29tYm9ib3gsIG9wdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjb2RlVHlwZXMpO1xyXG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgZm14LkNvbW1vblF1ZXJ5U2VydmljZS5nZXRTZWxlY3RDb2RlT3B0cyhrZXlzLCBmdW5jdGlvbiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNvZGUgPCAwIHx8ICFyZXN1bHQuZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkLmZuLmNvbWJvZ3JpZC5kZWZhdWx0cy5vbkxvYWRFcnJvcihyZXN1bHQubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKHJlc3VsdC5kYXRhLCBmdW5jdGlvbiAoaWR4LCBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgU0VMRUNUX0NPREVfT1BUU1tpdGVtLmNvZGVUeXBlXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGNvZGVUeXBlc1tpdGVtLmNvZGVUeXBlXSwgZnVuY3Rpb24gKGksIGpxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXHR2YXIgb3B0cyA9IGV4dGVuZENvbWJvYm94Q29kZU9wdHMoanEuZGF0YSgnY29tYm9ib3gnKS5vcHRpb25zLGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFx0aWYoKCEkLmlzQXJyYXkob3B0cy5xdWVyeUZpZWxkcykgfHwgb3B0cy5xdWVyeUZpZWxkcy5sZW5ndGggPT0gMCkgJiYgU0VMRUNUX0NPREVfREFUQVNbaXRlbS5jb2RlVHlwZV0pe1xyXG4gICAgICAgICAgICAgICAgICAgIFx0XHRqcS5jb21ib2JveCgnbG9hZERhdGEnLCQuZXh0ZW5kKFtdLFNFTEVDVF9DT0RFX0RBVEFTW2l0ZW0uY29kZVR5cGVdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHR9ZWxzZXsgICAgICAgICAgICAgICAgICAgXHRcclxuICAgICAgICAgICAgICAgICAgICBcdFx0Y29tYm9ib3hMaXN0LnB1c2goanEpXHJcbiAgICAgICAgICAgICAgICAgICAgXHR9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmKGNvbWJvYm94TGlzdC5sZW5ndGggPiAwKXtcclxuICAgICAgICAgICAgICAgIFx0aW5pdENvbWJvYm94RGF0YShjb21ib2JveExpc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJChcImJvZHlcIikudHJpZ2dlcihcInJlc2l6ZVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWVsc2UgaWYoY29tYm9ib3hMaXN0Lmxlbmd0aCA+IDApe1xyXG4gICAgICAgIFx0aW5pdENvbWJvYm94RGF0YShjb21ib2JveExpc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGV4dGVuZENvbWJvYm94Q29kZU9wdHMob3B0aW9ucywgY29kZU9wdHMpIHtcclxuICAgICAgICB2YXIgY29tYm9ib3hPcHRpb25zLCBjb2RlVHlwZSA9IGNvZGVPcHRzLmNvZGVUeXBlO1xyXG4gICAgICAgIGlmICh3aW5kb3dbJ0NPTUJPX09QVElPTlMnXSAmJiB3aW5kb3dbJ0NPTUJPX09QVElPTlMnXVtjb2RlVHlwZV0pIHtcclxuICAgICAgICAgICAgY29tYm9ib3hPcHRpb25zID0gd2luZG93WydDT01CT19PUFRJT05TJ11bY29kZVR5cGVdO1xyXG4gICAgICAgIH0gZWxzZSBjb21ib2JveE9wdGlvbnMgPSBjb2RlT3B0cztcclxuICAgICAgIFxyXG4gICAgICAgIHZhciBvcHRzID0ge1xyXG4gICAgICAgICAgICBjb2RlVHlwZTogY29kZVR5cGUsXHJcbiAgICAgICAgICAgIGlkRmllbGQ6IGNvbWJvYm94T3B0aW9ucy5rZXlGaWVsZE5hbWUgfHwgY29kZU9wdHMua2V5RmllbGROYW1lLFxyXG4gICAgICAgICAgICB2YWx1ZUZpZWxkOiBjb21ib2JveE9wdGlvbnMua2V5RmllbGROYW1lIHx8IGNvZGVPcHRzLmtleUZpZWxkTmFtZSxcclxuICAgICAgICAgICAgdGV4dEZpZWxkOiBjb21ib2JveE9wdGlvbnMubGFiZWxGaWVsZE5hbWUgfHwgY29kZU9wdHMubGFiZWxGaWVsZE5hbWUsXHJcbiAgICAgICAgICAgIHF1ZXJ5RmllbGRzOiBjb21ib2JveE9wdGlvbnMucXVlcnlGaWVsZHMgfHwgY29kZU9wdHMucXVlcnlGaWVsZHNcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiAkLmV4dGVuZChvcHRpb25zLG9wdHMpO1xyXG4gICAgfVxyXG4gICBcclxuICAgIGZ1bmN0aW9uIGluaXRDb21ib2JveERhdGEoY29tYm9ib3hMaXN0KXtcclxuICAgIFx0dmFyIHF1ZXJ5SW5mb3MgPSBbXSxfcXVlcnlJbmZvcyA9IFtdLGNvZGVDb21ib2JveHMgPSB7fTtcclxuICAgIFx0JC5lYWNoKGNvbWJvYm94TGlzdCxmdW5jdGlvbihpZHgsJGNvbWJvYm94KXtcclxuICAgIFx0XHR2YXIgb3B0cyA9ICRjb21ib2JveC5kYXRhKCdjb21ib2JveCcpLm9wdGlvbnM7XHJcbiAgICBcdFx0dmFyIHF1ZXJ5SW5mbyA9IGdldFF1ZXJ5SW5mbyhvcHRzKTtcclxuICAgIFx0XHR2YXIgX3F1ZXJ5SW5mbyA9IEpTT04uc3RyaW5naWZ5KHF1ZXJ5SW5mbyk7XHJcbiAgICBcdFx0dmFyIGlkeCA9IF9xdWVyeUluZm9zLmluZGV4T2YoX3F1ZXJ5SW5mbyk7XHJcbiAgICBcdFx0aWYoaWR4ID09IC0xKXtcclxuICAgIFx0XHRcdGlkeCA9IHF1ZXJ5SW5mb3MubGVuZ3RoO1xyXG4gICAgXHRcdFx0cXVlcnlJbmZvcy5wdXNoKHF1ZXJ5SW5mbyk7XHJcbiAgICBcdFx0XHRfcXVlcnlJbmZvcy5wdXNoKF9xdWVyeUluZm8pO1xyXG4gICAgXHRcdH1cclxuICAgICAgICAgICAgaWYgKGNvZGVDb21ib2JveHNbaWR4XSkgY29kZUNvbWJvYm94c1tpZHhdLnB1c2goJGNvbWJvYm94KTtcclxuICAgICAgICAgICAgZWxzZSBjb2RlQ29tYm9ib3hzW2lkeF0gPSBbJGNvbWJvYm94XTtcclxuICAgIFx0fSk7XHJcbiAgICBcdGZteC5Db21tb25RdWVyeVNlcnZpY2UuZ2V0U2VsZWN0Q29kZURhdGFzKHF1ZXJ5SW5mb3MsZnVuY3Rpb24ocmVzdWx0KXtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdC5jb2RlIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yKHJlc3VsdC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgJC5lYWNoKHJlc3VsdC5kYXRhLGZ1bmN0aW9uKGlkeCxkYXRhKXtcclxuICAgICAgICAgICAgXHR2YXIgY2JzID0gY29kZUNvbWJvYm94c1tpZHhdO1xyXG4gICAgICAgICAgICBcdCQuZWFjaChjYnMsZnVuY3Rpb24oaSwkY29tYm9ib3gpe1xyXG4gICAgICAgICAgICBcdFx0dmFyIG9wdHMgPSAkY29tYm9ib3guZGF0YSgnY29tYm9ib3gnKS5vcHRpb25zO1xyXG4gICAgICAgICAgICBcdFx0Ly/lj6rkv53lrZjmsqHmn6Xor6LmnaHku7bnmoTmlbDmja5cclxuICAgICAgICAgICAgXHRcdGlmKCEkLmlzQXJyYXkob3B0cy5xdWVyeUZpZWxkcykgfHwgb3B0cy5xdWVyeUZpZWxkcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgIFx0XHRcdG1lcmdlQ29kZURhdGEob3B0cyxkYXRhLmRhdGFMaXN0KTtcclxuICAgICAgICAgICAgXHRcdH1cclxuICAgICAgICAgICAgXHRcdCRjb21ib2JveC5jb21ib2JveCgnbG9hZERhdGEnLCQuZXh0ZW5kKFtdLGRhdGEuZGF0YUxpc3QpKTtcclxuICAgICAgICAgICAgXHR9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICBcdH0sJC5mbi5jb21ib2dyaWQuZGVmYXVsdHMub25Mb2FkRXJyb3IpO1xyXG4gICAgfVxyXG59KShqUXVlcnksIGZteCk7IiwiOyAoZnVuY3Rpb24gKCQsIGZteCkge1xyXG4gICAgdmFyIFNFTEVDVF9DT0RFX09QVFMgPSBmbXguZ2V0U2VsZWN0Q29kZU9wdHMoKTtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gZ2V0UXVlcnlGaWVsZHMoJGpxLG9wdHMscGFyYW0pIHtcclxuICAgIFx0IHZhciBxdWVyeUZpZWxkcyA9IFtdO1xyXG4gICAgICAgICBpZiAob3B0cy5xdWVyeUZpZWxkcykge1xyXG4gICAgICAgICAgICAgcXVlcnlGaWVsZHMgPSBxdWVyeUZpZWxkcy5jb25jYXQob3B0cy5xdWVyeUZpZWxkcyk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgaWYgKG9wdHMuY29tbW9uUXVlcnlGaWVsZHMpIHtcclxuICAgICAgICAgICAgIHF1ZXJ5RmllbGRzID0gcXVlcnlGaWVsZHMuY29uY2F0KG9wdHMuY29tbW9uUXVlcnlGaWVsZHMpO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGlmIChwYXJhbSAmJiBwYXJhbS5xKSB7XHJcbiAgICAgICAgICAgICBxdWVyeUZpZWxkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICBmaWVsZE5hbWU6ICRqcS5kYXRhZ3JpZChcImdldENvbHVtbkZpZWxkc1wiKS5qb2luKFwiLFwiKSxcclxuICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlOiBwYXJhbS5xLFxyXG4gICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBcImlsaWtlQW55d2hlcmVcIlxyXG4gICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIHF1ZXJ5RmllbGRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKiogKioqKioqKiogY29tYm9ncmlkICoqKioqKioqKiAqL1xyXG4gICAgdmFyIF9jb21ib2dyaWQgPSAkLmZuLmNvbWJvZ3JpZDtcclxuXHJcbiAgICAkLmZuLmNvbWJvZ3JpZCA9IGZ1bmN0aW9uIChvcHRpb25zLCBwYXJhbSkge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISQuZGF0YSh0aGlzLCBcImNvbWJvZ3JpZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY29tYm9ncmlkKHt9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29tYm9ncmlkLmFwcGx5KHRoaXMsIFtvcHRpb25zLCBwYXJhbV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbml0Q29tYm9ncmlkKHRoaXMsIG9wdGlvbnMgfHwge30pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgICQuZXh0ZW5kKCQuZm4uY29tYm9ncmlkLF9jb21ib2dyaWQpO1xyXG5cclxuICAgICQuZXh0ZW5kKCQuZm4uY29tYm9ncmlkLmRlZmF1bHRzLCB7XHJcbiAgICAgICAgd2lkdGg6IDE1NSxcclxuICAgICAgICBsYXp5TG9hZDogdHJ1ZSxcclxuICAgICAgICBwYW5lbFdpZHRoOiA0NzAsXHJcbiAgICAgICAgcGFuZWxIZWlnaHQ6IDIwMCxcclxuICAgICAgICBwYWdpbmF0aW9uOiB0cnVlLFxyXG4gICAgICAgIHJvd251bWJlcnM6IHRydWUsXHJcbiAgICAgICAgbGltaXRUb0dyaWQ6dHJ1ZSxcclxuICAgICAgICBtb2RlOiBcInJlbW90ZVwiLFxyXG4gICAgICAgIF9sb2FkZXIgOiAkLmZuLmNvbWJvZ3JpZC5kZWZhdWx0cy5sb2FkZXIsXHJcbiAgICAgICAgbG9hZGVyOiBmdW5jdGlvbiAocGFyYW0sIHN1Y2Nlc3MsIGVycm9yKSB7XHJcbiAgICAgICAgICAgIHZhciAkanEgPSAkKHRoaXMpLCBvcHRzID0gJGpxLmRhdGFncmlkKFwib3B0aW9uc1wiKTtcclxuICAgICAgICAgICAgaWYgKCFvcHRzLmNvZGVUeXBlKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcHRzLl9sb2FkZXIuY2FsbCh0aGlzLCBwYXJhbSwgc3VjY2VzcywgZXJyb3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vJGpxLmRhdGEoXCJsb2FkaW5nXCIsIHRydWUpO1xyXG4gICAgICAgICAgICBpZighb3B0cy5fYXV0b0xvYWQpeyAvL+esrOS4gOasoeWKoOi9vVxyXG4gICAgICAgICAgICBcdG9wdHMuX2F1dG9Mb2FkID0gb3B0cy52YWx1ZSA/IDIgOiAxO1xyXG4gICAgICAgICAgICBcdGlmKG9wdHMuX2F1dG9Mb2FkID09IDEpe1xyXG4gICAgICAgICAgICBcdFx0cmV0dXJuO1xyXG4gICAgICAgICAgICBcdH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcXVlcnlGaWVsZHMgPSBnZXRRdWVyeUZpZWxkcygkanEsIG9wdHMsIHBhcmFtKTtcclxuICAgICAgICAgICAgaWYob3B0cy5fYXV0b0xvYWQgPT0gMil7XHJcbiAgICAgICAgICAgIFx0dmFyIHF1ZXJ5RmllbGQgPSB7XHJcbiAgICAgICAgICAgIFx0XHRmaWVsZE5hbWUgOiBvcHRzLnZhbHVlRmllbGQsXHJcbiAgICAgICAgICAgIFx0XHRmaWVsZFZhbHVlIDogb3B0cy52YWx1ZVxyXG4gICAgICAgICAgICBcdH1cclxuICAgICAgICBcdFx0aWYob3B0cy5zaW5nbGVTZWxlY3Qpe1xyXG4gICAgICAgIFx0XHRcdHF1ZXJ5RmllbGQuZmllbGRWYWx1ZSA9IG9wdHMudmFsdWU7XHJcbiAgICAgICAgXHRcdH1lbHNle1xyXG4gICAgICAgIFx0XHRcdHF1ZXJ5RmllbGQub3BlcmF0b3I9J2luJztcclxuICAgICAgICBcdFx0XHRxdWVyeUZpZWxkLmZpZWxkVmFsdWUgPSBvcHRzLnZhbHVlLnRvU3RyaW5nKCkuc3BsaXQob3B0cy5zZXBhcmF0b3IpO1x0XHRcdFxyXG4gICAgICAgIFx0XHR9ICAgICAgICAgICAgXHRcclxuICAgICAgICAgICAgXHRxdWVyeUZpZWxkcy5wdXNoKHF1ZXJ5RmllbGQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBxdWVyeUluZm8gPSB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogb3B0cy5jb2RlVHlwZSxcclxuICAgICAgICAgICAgICAgIGZpZWxkQ29kZVR5cGVzOiBvcHRzLmZpZWxkQ29kZVR5cGVzLFxyXG4gICAgICAgICAgICAgICAgcXVlcnlGaWVsZHM6IHF1ZXJ5RmllbGRzLFxyXG4gICAgICAgICAgICAgICAgb3JkZXJCeTogKHBhcmFtLnNvcnQgPyBwYXJhbS5zb3J0ICsgXCIgXCIgKyBwYXJhbS5vcmRlciA6IChvcHRzLm9yZGVyQnkgfHwgXCJcIikpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChvcHRzLnBhZ2luYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5SW5mb1sncGFnaW5nSW5mbyddID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VTaXplOiBwYXJhbS5yb3dzLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiBwYXJhbS5wYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VObzogcGFyYW0ucGFnZSxcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbFJvd3MgOiAkanEuZGF0YWdyaWQoJ2dldFBhZ2VyJykucGFnaW5hdGlvbignb3B0aW9ucycpLnRvdGFsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZteC5Db21tb25RdWVyeVNlcnZpY2UuZ2V0U2VsZWN0Q29kZURhdGEocXVlcnlJbmZvLCBmdW5jdGlvbihyZXN1bHQpe1xyXG4gICAgICAgICAgICAgICAgaWYoIXJlc3VsdCB8fCByZXN1bHQuY29kZSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IocmVzdWx0ID8gcmVzdWx0Lm1lc3NhZ2UgOiAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmxvYWREYXRhRXJyb3JNc2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3VjY2VzcyhyZXN1bHQpO1xyXG4gICAgICAgICAgICB9LCBlcnJvcik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gcXVlcnkgcmVzdWx0XHJcbiAgICAgICAgbG9hZEZpbHRlcjogJC5mbi5kYXRhZ3JpZC5kZWZhdWx0cy5sb2FkRmlsdGVyLFxyXG4gICAgICAgIG9uU2hvd1BhbmVsIDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHR2YXIgc3RhdGUgPSAkLmRhdGEodGhpcyxcImNvbWJvZ3JpZFwiKTtcclxuICAgICAgICBcdGlmKHN0YXRlICYmIHN0YXRlLmdyaWQpIHtcclxuICAgICAgICBcdFx0dmFyIHN0YXRlMSA9IHN0YXRlLmdyaWQuZGF0YShcImRhdGFncmlkXCIpO1xyXG4gICAgICAgIFx0XHRpZighc3RhdGUxLmRhdGEgfHwgIXN0YXRlMS5kYXRhLnJvd3MgfHwgc3RhdGUxLmRhdGEucm93cy5sZW5ndGggPT0gMCB8fCBzdGF0ZTEub3B0aW9ucy5fYXV0b0xvYWQgPT0gMil7XHJcbiAgICAgICAgXHRcdFx0c3RhdGUxLm9wdGlvbnMuX2F1dG9Mb2FkID0gMTtcclxuICAgICAgICBcdFx0XHRzdGF0ZS5ncmlkLmRhdGFncmlkKCdyZWxvYWQnKTtcclxuICAgICAgICBcdFx0fVxyXG4gICAgICAgIFx0fVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLypvbkxvYWRTdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgJGNvbWJvZ3JpZCA9ICQodGhpcyksIG9wdHMgPSAkY29tYm9ncmlkLmNvbWJvKFwib3B0aW9uc1wiKTtcclxuICAgICAgICAgICAgLy8gY2FjaGUgc2VsZWN0Q29kZVZhbHVlc1xyXG4gICAgICAgICAgICBmbXgubWVyZ2VTZWxlY3RDb2RlVmFsdWUob3B0cy5jb2RlVHlwZSwgb3B0cy52YWx1ZUZpZWxkLCBvcHRzLnRleHRGaWVsZCwgZGF0YS5yb3dzKTtcclxuICAgICAgICAgICAgLy92YXIgJGRhdGFncmlkID0gJGNvbWJvZ3JpZC5jb21ib2dyaWQoXCJncmlkXCIpO1xyXG4gICAgICAgICAgICAvLyRkYXRhZ3JpZC5yZW1vdmVEYXRhKFwibG9hZGluZ1wiKTtcclxuICAgICAgICB9LCovXHJcbiAgICAgICAgb25Mb2FkRXJyb3I6ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMub25Mb2FkRXJyb3IsXHJcbi8vICAgICAgICBpbnB1dEV2ZW50cyA6ICQuZXh0ZW5kKHt9LCQuZm4uY29tYm9ncmlkLmRlZmF1bHRzLmlucHV0RXZlbnRzLHtcclxuLy9cdFx0XHRibHVyOiBmdW5jdGlvbihlKXtcclxuLy9cdFx0XHRcdHZhciB0YXJnZXQgPSBlLmRhdGEudGFyZ2V0O1xyXG4vL1x0XHRcdFx0dmFyIHN0YXRlID0gJC5kYXRhKHRhcmdldCwgJ2NvbWJvZ3JpZCcpO1xyXG4vL1x0XHRcdFx0aWYoIXN0YXRlKSByZXR1cm47XHJcbi8vXHRcdFx0XHR2YXIgb3B0cyA9IHN0YXRlLmdyaWQuZGF0YShcImRhdGFncmlkXCIpLm9wdGlvbnM7XHJcbi8vXHRcdFx0XHRpZihvcHRzLnF1ZXJ5UGFyYW1zICYmIG9wdHMucXVlcnlQYXJhbXMucSl7XHJcbi8vXHRcdFx0XHRcdG9wdHMucXVlcnlQYXJhbXMucT11bmRlZmluZWQ7XHJcbi8vXHRcdFx0XHR9XHJcbi8vXHRcdFx0XHQkanEgPSAkKHRhcmdldCk7XHJcbi8vXHRcdFx0XHRpZighJGpxLmNvbWJvZ3JpZChcImdldFRleHRcIikpe1xyXG4vL1x0XHRcdFx0XHQkanEuY29tYm9ncmlkKFwic2V0VmFsdWVcIiwnJyk7XHJcbi8vXHRcdFx0XHR9ZWxzZSBpZihzdGF0ZS5vcHRpb25zLmxpbWl0VG9MaXN0ICYmIHN0YXRlLm9wdGlvbnMua2V5SGFuZGxlci5lbnRlcil7XHJcbi8vXHRcdFx0XHRcdHN0YXRlLm9wdGlvbnMua2V5SGFuZGxlci5lbnRlci5jYWxsKHRhcmdldCk7XHJcbi8vXHRcdFx0XHR9XHJcbi8vXHRcdFx0fSAgICAgICAgXHRcclxuLy8gICAgICAgIH0pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdmFyIHNldFZhbHVlc01ldGhvZCA9ICQuZm4uY29tYm9ncmlkLm1ldGhvZHMuc2V0VmFsdWVzO1xyXG4gICAgZnVuY3Rpb24gbG9hZFZhbHVlVGV4dCgkanEsdmFsdWVzKSB7XHJcbiAgICBcdHZhciBzdGF0ZSA9ICRqcS5kYXRhKCdjb21ib2dyaWQnKTtcclxuICAgIFx0aWYoIXZhbHVlcyl7XHJcbiAgICBcdFx0dmFsdWVzID0gW107XHJcbiAgICBcdH1lbHNlIGlmKCEkLmlzQXJyYXkodmFsdWVzKSl7XHJcbiAgICBcdFx0dmFsdWVzPSB2YWx1ZXMudG9TdHJpbmcoKS5zcGxpdChzdGF0ZS5vcHRpb25zLnNlcGFyYXRvcik7XHJcbiAgICBcdH0gICAgXHRcclxuXHRcdHZhciB2YWw9ICAkanEuY29tYm8oJ2dldFZhbHVlJyk7XHJcblx0XHR2YXIgc3RyVmFsID0gdmFsdWVzLmpvaW4oc3RhdGUub3B0aW9ucy5zZXBhcmF0b3IpO1xyXG5cdFx0aWYodmFsICYmIHZhbCA9PSBzdHJWYWwpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9ZWxzZSBpZih2YWx1ZXMubGVuZ3RoID09IDApe1xyXG5cdFx0XHRzdGF0ZS5vcHRpb25zLnNlbGVjdGVkUm93cyA9IFtdO1xyXG5cdFx0XHRzZXRWYWx1ZXNNZXRob2QoJGpxLHZhbHVlcyk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdC8vJC5lYXN5dWkucmVtb3ZlQXJyYXlJdGVtKGFycmF5LGlkRmllbGQsaWRWYWx1ZSk7XHJcblx0XHQvLyQuZWFzeXVpLmFkZEFycmF5SXRlbShhcnJheSxpZEZpZWxkLGl0ZW0pO1xyXG5cdFx0aWYoIXN0YXRlLm9wdGlvbnMuY29kZVR5cGUpIHtcclxuXHRcdFx0dmFyIGdkU3RhdGUgPSBzdGF0ZS5ncmlkLmRhdGEoJ2RhdGFncmlkJyk7XHJcblx0XHRcdHZhciByb3dzID0gW107XHJcblx0XHRcdGlmKGdkU3RhdGUgJiYgZ2RTdGF0ZS5kYXRhICYmICQuaXNBcnJheShnZFN0YXRlLmRhdGEucm93cykpe1xyXG5cdFx0XHRcdGZvcih2YXIgaSA9IDAgOyBpIDwgZ2RTdGF0ZS5kYXRhLnJvd3MubGVuZ3RoO2krKyl7XHJcblx0XHRcdFx0XHQkLmVhc3l1aS5hZGRBcnJheUl0ZW0ocm93cyxzdGF0ZS5vcHRpb25zLmlkRmllbGQsZ2RTdGF0ZS5kYXRhLnJvd3NbaV0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRzdGF0ZS5vcHRpb25zLnNlbGVjdGVkUm93cyA9IHJvd3M7XHJcblx0XHRcdHNldFZhbHVlc01ldGhvZCgkanEsdmFsdWVzKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHF1ZXJ5RmllbGRzID0gZ2V0UXVlcnlGaWVsZHMoJGpxLHN0YXRlLm9wdGlvbnMpO1xyXG5cdFx0dmFyIHF1ZXJ5RmllbGQgPSB7XHJcbiAgICBcdFx0ZmllbGROYW1lIDogc3RhdGUub3B0aW9ucy52YWx1ZUZpZWxkXHJcbiAgICBcdH07XHJcblx0XHRpZihzdGF0ZS5vcHRpb25zLm11bHRpcGxlKXtcclxuXHRcdFx0cXVlcnlGaWVsZC5vcGVyYXRvcj0naW4nO1xyXG5cdFx0XHRxdWVyeUZpZWxkLmZpZWxkVmFsdWUgPSB2YWx1ZXM7XHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cXVlcnlGaWVsZC5maWVsZFZhbHVlID0gc3RyVmFsO1xyXG5cdFx0fVxyXG4gICAgXHRxdWVyeUZpZWxkcy5wdXNoKHF1ZXJ5RmllbGQpO1xyXG5cdFx0dmFyIHF1ZXJ5SW5mbyA9IHtcclxuXHRcdFx0cXVlcnk6IHN0YXRlLm9wdGlvbnMuY29kZVR5cGUsXHJcblx0XHRcdHF1ZXJ5RmllbGRzIDogcXVlcnlGaWVsZHNcclxuXHRcdH1cclxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XHJcbiAgICAgICAgXHQkLmZuLmRhdGFncmlkLmRlZmF1bHRzLm9uTG9hZEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmbXguQ29tbW9uUXVlcnlTZXJ2aWNlLmdldFNlbGVjdENvZGVEYXRhKHF1ZXJ5SW5mbywgZnVuY3Rpb24ocmVzdWx0KXtcclxuICAgICAgICAgICAgaWYoIXJlc3VsdCB8fCByZXN1bHQuY29kZSA8IDAgfHwgIXJlc3VsdC5kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IocmVzdWx0ID8gcmVzdWx0Lm1lc3NhZ2UgOiAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmxvYWREYXRhRXJyb3JNc2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBkYXRhTGlzdCA9IHJlc3VsdC5kYXRhLmRhdGFMaXN0O1xyXG4gICAgICAgICAgICB2YXIgdHh0RmllbGQgPSBzdGF0ZS5vcHRpb25zLnRleHRGaWVsZDtcclxuICAgICAgICAgICAgdmFyIHZhbEZpZWxkID0gc3RhdGUub3B0aW9ucy5pZEZpZWxkO1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IFtdLHZhbHMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHNlbGVjdGVkUm93cyA9IFtdO1xyXG4gICAgICAgIFx0JC5lYWNoKGRhdGFMaXN0LGZ1bmN0aW9uKGksaXRlbSl7XHJcbiAgICAgICAgXHRcdHZhciB2ID0gaXRlbVt2YWxGaWVsZF0gKyBcIlwiO1xyXG4gICAgICAgIFx0XHRpZih2ID09IHVuZGVmaW5lZCB8fCB2ID09IG51bGwpe1xyXG4gICAgICAgIFx0XHRcdHJldHVybjtcclxuICAgICAgICBcdFx0fVxyXG4gICAgICAgIFx0XHR2YXIgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICBcdFx0Zm9yKHZhciBpID0gMCA7aTx2YWx1ZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgXHRcdFx0aWYoKHZhbHVlc1tpXSArIFwiXCIpID09IHYpe1xyXG4gICAgICAgIFx0XHRcdFx0Zm91bmQgPSB0cnVlO1xyXG4gICAgICAgIFx0XHRcdFx0YnJlYWs7XHJcbiAgICAgICAgXHRcdFx0fVxyXG4gICAgICAgIFx0XHR9XHJcbiAgICAgICAgXHRcdGlmKCFmb3VuZCl7XHJcbiAgICAgICAgXHRcdFx0cmV0dXJuO1xyXG4gICAgICAgIFx0XHR9XHJcbiAgICAgICAgXHRcdHNlbGVjdGVkUm93cy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIFx0XHR2YXIgdHh0ID0gaXRlbVt0eHRGaWVsZF07XHJcbiAgICAgICAgXHRcdGlmKHR4dCl7XHJcbiAgICAgICAgXHRcdFx0dGV4dC5wdXNoKHR4dCk7XHJcbiAgICAgICAgXHRcdH1cclxuICAgICAgICBcdFx0dmFscy5wdXNoKHYpO1xyXG4gICAgICAgIFx0XHRcclxuICAgICAgICBcdFx0aWYoIXN0YXRlLm9wdGlvbnMubXVsdGlwbGUpe1xyXG4gICAgICAgIFx0XHRcdHJldHVybiBmYWxzZTtcclxuICAgICAgICBcdFx0fVxyXG4gICAgICAgIFx0fSk7XHJcbiAgICAgICAgXHRzdGF0ZS5vcHRpb25zLnNlbGVjdGVkUm93cyA9IHNlbGVjdGVkUm93cztcclxuICAgICAgICAgICAgJGpxLmNvbWJvKCdzZXRUZXh0JywgdGV4dC5qb2luKHN0YXRlLm9wdGlvbnMuc2VwYXJhdG9yKSk7XHJcbiAgICAgICAgICAgICRqcS5jb21ibygnc2V0VmFsdWVzJyx2YWxzKTtcclxuICAgICAgICB9LCBlcnJvcik7XHRcdFxyXG4gICAgfSAgICBcclxuICAgIFxyXG4gICAgLy8gY29tYm9ncmlkIG1ldGhvZHNcclxuICAgICQuZXh0ZW5kKCQuZm4uY29tYm9ncmlkLm1ldGhvZHMsIHtcclxuICAgICAgICBzZXRRdWVyeUZpZWxkczogZnVuY3Rpb24gKGpxLCBxdWVyeUZpZWxkcykge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNvbWJvZ3JpZChcImdyaWRcIikuZGF0YWdyaWQoXCJvcHRpb25zXCIpLnF1ZXJ5RmllbGRzID0gcXVlcnlGaWVsZHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblx0XHRzZXRWYWx1ZXM6IGZ1bmN0aW9uKGpxLCB2YWx1ZXMpe1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHZhciAkanEgPSAkKHRoaXMpO1xyXG5cdFx0XHRcdGxvYWRWYWx1ZVRleHQoJGpxLHZhbHVlcyk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSAgICAgICAgXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBpbml0IGNvbWJvZ3JpZHNcclxuICAgIGZ1bmN0aW9uIGluaXRDb21ib2dyaWQoJGpxLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIGNvZGVUeXBlcyA9IHt9O1xyXG4gICAgICAgICRqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICRjb21ib2dyaWQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgXHR1bnNlbGVjdGVkVmFsdWVzOltdLFxyXG4gICAgICAgICAgICBcdG1hcHBpbmdSb3dzOltdLFxyXG4gICAgICAgICAgICBcdHNlbGVjdGVkUm93czogW10sXHJcbiAgICAgICAgICAgIH0sJC5mbi5jb21ib2dyaWQucGFyc2VPcHRpb25zKHRoaXMpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgIHZhciBjb2RlVHlwZSA9IG9wdHNbJ2NvZGVUeXBlJ10gfHwgJGNvbWJvZ3JpZC5hdHRyKFwiY29kZVR5cGVcIik7XHJcbiAgICAgICAgICAgIGlmICghY29kZVR5cGUpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb21ib2dyaWQuY2FsbCgkY29tYm9ncmlkLCBvcHRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkY29tYm9ncmlkLmF0dHIoJ2NvbWJvbmFtZScsICRjb21ib2dyaWQuYXR0cignbmFtZScpKTtcclxuICAgICAgICAgICAgaWYgKFNFTEVDVF9DT0RFX09QVFNbY29kZVR5cGVdKSB7XHJcbiAgICAgICAgICAgIFx0aW5pdENvbWJvZ3JpZEJ5Q29kZU9wdHMoJGNvbWJvZ3JpZCwgb3B0cywgU0VMRUNUX0NPREVfT1BUU1tjb2RlVHlwZV0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBcdCRjb21ib2dyaWQuZGF0YShcIm9wdHNcIixvcHRzKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2RlVHlwZXNbY29kZVR5cGVdKSBjb2RlVHlwZXNbY29kZVR5cGVdLnB1c2goJGNvbWJvZ3JpZCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGNvZGVUeXBlc1tjb2RlVHlwZV0gPSBbJGNvbWJvZ3JpZF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGNvZGVUeXBlcyk7XHJcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmbXguQ29tbW9uUXVlcnlTZXJ2aWNlLmdldFNlbGVjdENvZGVPcHRzKGtleXMsIGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuY29kZSA8IDAgfHwgIXJlc3VsdC5kYXRhIHx8IHJlc3VsdC5kYXRhLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQuZm4uY29tYm9ncmlkLmRlZmF1bHRzLm9uTG9hZEVycm9yKHJlc3VsdC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAkLmVhY2gocmVzdWx0LmRhdGEsIGZ1bmN0aW9uIChpZHgsIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBTRUxFQ1RfQ09ERV9PUFRTW2l0ZW0uY29kZVR5cGVdID0gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goY29kZVR5cGVzW2l0ZW0uY29kZVR5cGVdLCBmdW5jdGlvbiAoaSwganEpIHtcclxuICAgICAgICAgICAgICAgICAgICBcdHZhciBvcHRzID0ganEuZGF0YShcIm9wdHNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgXHRqcS5yZW1vdmVEYXRhKFwib3B0c1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBcdGluaXRDb21ib2dyaWRCeUNvZGVPcHRzKGpxLCBvcHRzLGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS50cmlnZ2VyKFwicmVzaXplXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBpbml0Q29tYm9ncmlkQnlDb2RlT3B0cygkY29tYm9ncmlkLCBvcHRpb25zLCBjb2RlT3B0cykge1xyXG4gICAgICAgIHZhciBjb21ib2dyaWRPcHRpb25zLCBjb2RlVHlwZSA9IGNvZGVPcHRzLmNvZGVUeXBlO1xyXG4gICAgICAgIGlmICh3aW5kb3dbJ0NPTUJPX09QVElPTlMnXSAmJiB3aW5kb3dbJ0NPTUJPX09QVElPTlMnXVtjb2RlVHlwZV0pIHtcclxuICAgICAgICAgICAgY29tYm9ncmlkT3B0aW9ucyA9IHdpbmRvd1snQ09NQk9fT1BUSU9OUyddW2NvZGVUeXBlXTtcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgY29tYm9ncmlkT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LGNvZGVPcHRzKTtcclxuICAgICAgICB2YXIgY29sdW1ucyA9IGNvbWJvZ3JpZE9wdGlvbnMuY29sdW1ucztcclxuICAgICAgICBpZiAoIWNvbHVtbnMgfHwgY29sdW1ucy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICBjb2x1bW5zID0gW3tcclxuICAgICAgICAgICAgICAgIGZpZWxkOiBjb21ib2dyaWRPcHRpb25zLmtleUZpZWxkTmFtZSB8fCBjb2RlT3B0cy5rZXlGaWVsZE5hbWVcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6IGNvbWJvZ3JpZE9wdGlvbnMubGFiZWxGaWVsZE5hbWUgfHwgY29kZU9wdHMubGFiZWxGaWVsZE5hbWVcclxuICAgICAgICAgICAgfV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBmaWVsZENvZGVUeXBlcyA9IHt9LGNvbHMgPSBbXTtcclxuICAgICAgICAkLmVhY2goY29sdW1ucyxmdW5jdGlvbihpZHgsY29sdW1uKXtcclxuICAgICAgICAgICAgdmFyIGNvbHVtbk9wdGlvbiA9ICQuZXh0ZW5kKHt9LGNvbHVtbiwge1xyXG4gICAgICAgICAgICAgICB0aXRsZTogZm14LmdldEkxOG5UaXRsZShjb21ib2dyaWRPcHRpb25zLmkxOG5Sb290LGNvbHVtbi5maWVsZCwgY29sdW1uLnRpdGxlKSxcclxuICAgICAgICAgICAgICAgc29ydGFibGU6IGNvbHVtbi5zb3J0YWJsZSA9PSB1bmRlZmluZWQgPyB0cnVlIDogKGNvbHVtbi5zb3J0YWJsZSA9PSB0cnVlIHx8IGNvbHVtbi5zb3J0YWJsZSA9PSBcInRydWVcIiksXHJcbiAgICAgICAgICAgICAgIGZvcm1hdHRlcjogY29sdW1uLmZvcm1hdHRlciB8fCAkLmZuLmRhdGFncmlkLmRlZmF1bHRzLmZvcm1hdHRlclxyXG4gICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgIGlmIChjb2x1bW5PcHRpb24uY29kZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgZmllbGRDb2RlVHlwZXNbY29sdW1uT3B0aW9uLmZpZWxkXSA9IGNvbHVtbk9wdGlvbi5jb2RlVHlwZTtcclxuICAgICAgICAgICB9XHJcbiAgICAgICAgICAgY29scy5wdXNoKGNvbHVtbk9wdGlvbik7ICAgICAgICBcdFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciBvcHRzID0ge1xyXG4gICAgICAgICAgICBjb2RlVHlwZTogY29kZVR5cGUsXHJcbiAgICAgICAgICAgIGlkRmllbGQ6IGNvbWJvZ3JpZE9wdGlvbnMua2V5RmllbGROYW1lIHx8IGNvZGVPcHRzLmtleUZpZWxkTmFtZSxcclxuICAgICAgICAgICAgdmFsdWVGaWVsZCA6IGNvbWJvZ3JpZE9wdGlvbnMua2V5RmllbGROYW1lIHx8IGNvZGVPcHRzLmtleUZpZWxkTmFtZSxcclxuICAgICAgICAgICAgdGV4dEZpZWxkOiBjb21ib2dyaWRPcHRpb25zLmxhYmVsRmllbGROYW1lIHx8IGNvZGVPcHRzLmxhYmVsRmllbGROYW1lLFxyXG4gICAgICAgICAgICBjb2x1bW5zOiBbY29sc10sXHJcbiAgICAgICAgICAgIGZpZWxkQ29kZVR5cGVzOiBmaWVsZENvZGVUeXBlcyxcclxuICAgICAgICAgICAgcXVlcnlGaWVsZHM6IGNvbWJvZ3JpZE9wdGlvbnMucXVlcnlGaWVsZHMgfHwgY29kZU9wdHMucXVlcnlGaWVsZHNcclxuICAgICAgICB9O1xyXG4gICAgICAgIF9jb21ib2dyaWQuY2FsbCgkY29tYm9ncmlkLCAkLmV4dGVuZChvcHRzLCBvcHRpb25zKSk7XHJcbiAgICB9XHJcbn0pKGpRdWVyeSwgZm14KTsiLCI7KGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuICAgIHZhciBTRUxFQ1RfQ09ERV9PUFRTID0gZm14LmdldFNlbGVjdENvZGVPcHRzKCk7XHJcblxyXG4gICAgLyoqICoqKioqKioqIGNvbWJvdHJlZSAqKioqKioqKiogKi9cclxuICAgICQuZm4uX2NvbWJvdHJlZSA9ICQuZm4uY29tYm90cmVlO1xyXG5cclxuICAgICQuZm4uY29tYm90cmVlID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmFtKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghJC5kYXRhKHRoaXMsIFwiY29tYm90cmVlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jb21ib3RyZWUoe30pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICQuZm4uX2NvbWJvdHJlZS5hcHBseSh0aGlzLCBbb3B0aW9ucywgcGFyYW1dKTtcclxuICAgIH07XHJcblxyXG4gICAgJC5mbi5jb21ib3RyZWUubWV0aG9kcyA9ICQuZm4uX2NvbWJvdHJlZS5tZXRob2RzO1xyXG4gICAgJC5mbi5jb21ib3RyZWUucGFyc2VPcHRpb25zID0gJC5mbi5fY29tYm90cmVlLnBhcnNlT3B0aW9ucztcclxuICAgICQuZm4uY29tYm90cmVlLmRlZmF1bHRzID0gJC5mbi5fY29tYm90cmVlLmRlZmF1bHRzO1xyXG5cclxuICAgICQuZXh0ZW5kKCQuZm4uY29tYm90cmVlLmRlZmF1bHRzLCAkLmZuLnRyZWUuZGVmYXVsdHMsIHtcclxuICAgICAgICBwYW5lbFdpZHRoOiAyNTAsXHJcbiAgICAgICAgcGFuZWxIZWlnaHQ6IDMwMCxcclxuICAgICAgICB3aWR0aDogMTU1LFxyXG5cclxuICAgICAgICBvbkxvYWRTdWNjZXNzOiBmdW5jdGlvbiAobm9kZSwgZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgJGNvbWJvdHJlZSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIGNhY2hlIHNlbGVjdENvZGVWYWx1ZXNcclxuICAgICAgICAgICAgdmFyIGNvZGVUeXBlID0gJGNvbWJvdHJlZS50cmVlKFwib3B0aW9uc1wiKS5jb2RlVHlwZTtcclxuICAgICAgICAgICAgdmFyIHNlbGVjdENvZGVEYXRhT2JqZWN0ID0ge307XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZU5vZGUobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0Q29kZURhdGFPYmplY3Rbbm9kZS5pZF0gPSBub2RlLnRleHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChub2RlLmNoaWxkcmVuLCBmdW5jdGlvbiAoaW5kZXgsIGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZU5vZGUoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbiAoaW5kZXgsIG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU5vZGUobm9kZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBmbXgubWVyZ2VTZWxlY3RDb2RlVmFsdWVzKGNvZGVUeXBlLHNlbGVjdENvZGVEYXRhT2JqZWN0KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAkLmV4dGVuZCgkLmZuLmNvbWJvdHJlZS5tZXRob2RzLCB7XHJcblxyXG4gICAgICAgIF9zZXRWYWx1ZTogJC5mbi5jb21ib3RyZWUubWV0aG9kcy5zZXRWYWx1ZSxcclxuXHJcbiAgICAgICAgc2V0VmFsdWU6IGZ1bmN0aW9uIChqcSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxXHJcbiAgICAgICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRjb21ib3RyZWUgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICRjb21ib3RyZWUuY29tYm90cmVlKFwic2V0VmFsdWVzXCIsIHZhbHVlID8gKHZhbHVlICsgXCJcIikuc3BsaXQoXCIsXCIpOiBbXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gaW5pdCBjb21ib3RyZWVzXHJcbiAgICBmdW5jdGlvbiBpbml0Q29tYm90cmVlcyhqcUlucHV0LCBmaW5kaW5ncykge1xyXG4gICAgICAgIGpxSW5wdXQuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkY29tYm90cmVlID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgJGNvbWJvdHJlZS5hdHRyKFwiY29tYm9uYW1lXCIsICRjb21ib3RyZWUuYXR0cihcIm5hbWVcIikpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciBjb2RlVHlwZXMgPSB7fTtcclxuICAgICAgICBqcUlucHV0LmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJGNvbWJvdHJlZSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciBjb2RlVHlwZSA9ICRjb21ib3RyZWUuYXR0cihcImNvZGVUeXBlXCIpO1xyXG4gICAgICAgICAgICBpZiAoY29kZVR5cGUgJiYgIWNvZGVUeXBlc1tjb2RlVHlwZV0pIHtcclxuICAgICAgICAgICAgICAgIGNvZGVUeXBlc1tjb2RlVHlwZV0gPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QoY29kZVR5cGVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByZWFkeUNvZGVUeXBlcyA9IFtdO1xyXG4gICAgICAgIHZhciBjb2RlVHlwZUxpc3QgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBjb2RlVHlwZSBpbiBjb2RlVHlwZXMpIHtcclxuICAgICAgICAgICAgaWYgKFNFTEVDVF9DT0RFX09QVFNbY29kZVR5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICByZWFkeUNvZGVUeXBlcy5wdXNoKGNvZGVUeXBlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvZGVUeXBlTGlzdC5wdXNoKGNvZGVUeXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVhZHlDb2RlVHlwZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQuZWFjaChyZWFkeUNvZGVUeXBlcywgZnVuY3Rpb24gKGksIGNvZGVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdENvbWJvdHJlZXNCeUNvZGVUeXBlKGpxSW5wdXQsIGNvZGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBTRUxFQ1RfQ09ERV9PUFRTW2NvZGVUeXBlXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlVHlwZUxpc3QubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmbXguQ29tbW9uUXVlcnlTZXJ2aWNlLmdldFNlbGVjdENvZGVPcHRzKGNvZGVUeXBlTGlzdCwgZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgY29kZVR5cGUgaW4gcmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RDb2RlRGVmaW5pdGlvbiA9IHJlc3VsdFtjb2RlVHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFNFTEVDVF9DT0RFX09QVFNbY29kZVR5cGVdID0gc2VsZWN0Q29kZURlZmluaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRDb21ib3RyZWVzQnlDb2RlVHlwZShqcUlucHV0LCBjb2RlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdENvZGVEZWZpbml0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCAwKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRlbGV0ZSBmaW5kaW5ncy5jb21ib3RyZWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIGluaXRDb21ib3RyZWVzQnlDb2RlVHlwZShqcUlucHV0LCBjb2RlVHlwZSxcclxuICAgICAgICBzZWxlY3RDb2RlRGVmaW5pdGlvbikge1xyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBjb2RlVHlwZTogY29kZVR5cGUsXHJcbiAgICAgICAgICAgIGlkRmllbGQ6IHNlbGVjdENvZGVEZWZpbml0aW9uLmtleUZpZWxkTmFtZSxcclxuICAgICAgICAgICAgdGV4dEZpZWxkOiBzZWxlY3RDb2RlRGVmaW5pdGlvbi5sYWJlbEZpZWxkTmFtZSxcclxuICAgICAgICAgICAgcGFyZW50RmllbGQ6IHNlbGVjdENvZGVEZWZpbml0aW9uLnBhcmVudEZpZWxkTmFtZSxcclxuICAgICAgICAgICAgb3JkZXJCeTogc2VsZWN0Q29kZURlZmluaXRpb24ub3JkZXJCeSxcclxuICAgICAgICAgICAgcXVlcnlGaWVsZHM6IHNlbGVjdENvZGVEZWZpbml0aW9uLnF1ZXJ5RmllbGRzXHJcbiAgICAgICAgfTtcclxuICAgICAgICBqcUlucHV0LmZpbHRlcihcIltjb2RlVHlwZT0nXCIgKyBjb2RlVHlwZSArIFwiJ11cIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkY29tYm90cmVlID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gJC5kYXRhKHRoaXMsIFwiY29tYm90cmVlXCIpID8gJGNvbWJvdHJlZVxyXG4gICAgICAgICAgICAgICAgLmNvbWJvdHJlZShcImdldFZhbHVlXCIpIDogJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgaWYgKCQuZGF0YSh0aGlzLCBcImNvbWJvdHJlZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgJGNvbWJvdHJlZS5fY29tYm90cmVlKCQuZXh0ZW5kKHRydWUsICRjb21ib3RyZWUuY29tYm90cmVlKFwib3B0aW9uc1wiKSwgb3B0aW9ucykpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuZGF0YSh0aGlzLCBcImNvbWJvXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAkY29tYm90cmVlLl9jb21ib3RyZWUoJC5leHRlbmQodHJ1ZSwgJGNvbWJvdHJlZS5jb21ibyhcIm9wdGlvbnNcIiksJC5mbi5jb21ib3RyZWUucGFyc2VPcHRpb25zKHRoaXMpLCBvcHRpb25zKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkY29tYm90cmVlLmNvbWJvdHJlZSgkLmV4dGVuZCh0cnVlLCAkLmZuLmNvbWJvdHJlZS5wYXJzZU9wdGlvbnModGhpcyksIG9wdGlvbnMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICRjb21ib3RyZWUuY29tYm90cmVlKFwic2V0VmFsdWVcIiwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkY29tYm90cmVlLmNvbWJvdHJlZShcIm9wdGlvbnNcIikub25SZWFkeSkge1xyXG4gICAgICAgICAgICAgICAgJGNvbWJvdHJlZS5jb21ib3RyZWUoXCJvcHRpb25zXCIpLm9uUmVhZHkuYXBwbHkoJGNvbWJvdHJlZVswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCRjb21ib3RyZWUuZGF0YShcIm9uUmVhZHlcIikpIHtcclxuICAgICAgICAgICAgICAgICRjb21ib3RyZWUuZGF0YShcIm9uUmVhZHlcIikuYXBwbHkoJGNvbWJvdHJlZVswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBqcVRoLmZpbHRlcihcIltjb2RlVHlwZT0nXCIgKyBjb2RlVHlwZSArIFwiJ11cIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gICAgIHZhciAkdGggPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vICAgICB2YXIgJGRhdGFncmlkID0gJHRoLmNsb3Nlc3QoXCJ0YWJsZVwiKTtcclxuICAgICAgICAvLyAgICAgdmFyIGNvbHVtbk9wdGlvbiA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldENvbHVtbk9wdGlvblwiLCAkdGhcclxuICAgICAgICAvLyAgICAgICAgIC5hdHRyKFwiZmllbGRcIikpO1xyXG4gICAgICAgIC8vICAgICBjb2x1bW5PcHRpb24uZWRpdG9yID0ge1xyXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogXCJjb21ib3RyZWVcIixcclxuICAgICAgICAvLyAgICAgICAgIGluaXQ6IHRydWUsXHJcbiAgICAgICAgLy8gICAgICAgICBvcHRpb25zOiBjb2x1bW5PcHRpb24uZWRpdG9yLm9wdGlvbnMgPyAkLmV4dGVuZChcclxuICAgICAgICAvLyAgICAgICAgICAgICBjb2x1bW5PcHRpb24uZWRpdG9yLm9wdGlvbnMsIG9wdGlvbnMpIDogb3B0aW9uc1xyXG4gICAgICAgIC8vICAgICB9O1xyXG4gICAgICAgIC8vIH0pO1xyXG4gICAgfVxyXG4gICAgJCgkLnBhcnNlcikub24oXCJvbkJlZm9yZVwiLGZ1bmN0aW9uKGUsY3R4LGZpbmRpbmdzKXtcclxuICAgICAgaW5pdENvbWJvdHJlZXMoZmluZGluZ3MuY29tYm90cmVlLGZpbmRpbmdzKTtcclxuICAgIH0pO1xyXG59KShqUXVlcnksIGZteCk7IiwiOyhmdW5jdGlvbiAoJCkge1xyXG5cclxuICAgIC8vIHRyZWVncmlkIG1ldGhvZHNcclxuICAgICQuZXh0ZW5kKCQuZm4udHJlZWdyaWQubWV0aG9kcywge1xyXG5cclxuICAgICAgICBnZXRTZWxlY3RlZElkOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgdmFyICRkYXRhZ3JpZCA9ICQoanFbMF0pO1xyXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkZGF0YWdyaWQudHJlZWdyaWQoXCJnZXRTZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWRGaWVsZCA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIikuaWRGaWVsZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkZGF0YWdyaWQudHJlZWdyaWQoXCJnZXRTZWxlY3RlZFwiKVtpZEZpZWxkXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0U2VsZWN0aW9uc0lkOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgdmFyICRkYXRhZ3JpZCA9ICQoanFbMF0pO1xyXG4gICAgICAgICAgICB2YXIgaWRGaWVsZCA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIikuaWRGaWVsZDtcclxuICAgICAgICAgICAgdmFyIHJvd3MgPSAkZGF0YWdyaWQudHJlZWdyaWQoXCJnZXRTZWxlY3Rpb25zXCIpO1xyXG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uc0lkID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uc0lkLnB1c2gocm93c1tpXVtpZEZpZWxkXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGlvbnNJZDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmb3JjZUVuZEVkaXQ6ICQuZm4uZGF0YWdyaWQubWV0aG9kcy5mb3JjZUVuZEVkaXQsXHJcblxyXG4gICAgICAgIF9hcHBlbmQ6ICQuZm4udHJlZWdyaWQubWV0aG9kcy5hcHBlbmQsXHJcblxyXG4gICAgICAgIGFwcGVuZDogZnVuY3Rpb24gKGpxLCBwYXJhbSkge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmICghJGRhdGFncmlkLnRyZWVncmlkKFwiZW5kRWRpdFdpdGhSZXR1cm5cIikpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaWRGaWVsZCA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIikuaWRGaWVsZDtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRGaWVsZCA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIikucGFyZW50RmllbGQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJlZUZpZWxkID0gJGRhdGFncmlkLnRyZWVncmlkKFwib3B0aW9uc1wiKS50cmVlRmllbGQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoISQuaXNBcnJheShwYXJhbS5kYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtLmRhdGEgPSBbcGFyYW0uZGF0YV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkLmVhY2gocGFyYW0uZGF0YSwgZnVuY3Rpb24gKGluZGV4LCByb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dbcGFyZW50RmllbGRdID0gcGFyYW0ucGFyZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcm93W2lkRmllbGRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd1tpZEZpZWxkXSA9IFwiaWRfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyb3dbdHJlZUZpZWxkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb3dbdHJlZUZpZWxkXSA9IFwibmV3XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkZGF0YWdyaWQudHJlZWdyaWQoXCJfYXBwZW5kXCIsIHBhcmFtKTtcclxuICAgICAgICAgICAgICAgIC8vIHNlbGVjdCBhbmQgZWRpdFxyXG4gICAgICAgICAgICAgICAgdmFyICR0ciA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIikuZWRpdENvbmZpZy5nZXRUcih0aGlzLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtLmRhdGFbMF1baWRGaWVsZF0pWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCR0cikge1xyXG4gICAgICAgICAgICAgICAgICAgICR0ci5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJC5kYXRhKHRoaXMsIFwiZGF0YWdyaWRcIikuaW5zZXJ0ZWRSb3dzLnB1c2gocGFyYW0uZGF0YVswXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHVwZGF0ZVJvdzogZnVuY3Rpb24gKGpxLCBwYXJhbSkge1xyXG4gICAgICAgICAgICB2YXIgJGRhdGFncmlkID0gJChqcVswXSk7XHJcbiAgICAgICAgICAgICRkYXRhZ3JpZC50cmVlZ3JpZChcImZvcmNlRW5kRWRpdFwiKTtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IGpxWzBdO1xyXG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZGF0YSh0YXJnZXQsIFwiZGF0YWdyaWRcIikub3B0aW9ucztcclxuICAgICAgICAgICAgdmFyIGluc2VydGVkUm93cyA9ICQuZGF0YSh0YXJnZXQsIFwiZGF0YWdyaWRcIikuaW5zZXJ0ZWRSb3dzO1xyXG4gICAgICAgICAgICB2YXIgdXBkYXRlZFJvd3MgPSAkLmRhdGEodGFyZ2V0LCBcImRhdGFncmlkXCIpLnVwZGF0ZWRSb3dzO1xyXG4gICAgICAgICAgICBpZiAoaW5zZXJ0ZWRSb3dzLmluZGV4T2YocGFyYW0ucm93KSA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9sZFJvdyA9IG9wdHMuZWRpdENvbmZpZy5nZXRSb3codGFyZ2V0LCBwYXJhbS5pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkUm93ID09IHBhcmFtLnJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIHdheSB0byBjaGVjayBpZiB0aGUgcm93IGhhcyBiZWVuIGNoYW5nZWRcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkUm93cy5wdXNoKHBhcmFtLnJvdyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZmllbGQgaW4gb2xkUm93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRSb3dbZmllbGRdICE9IHBhcmFtLnJvd1tmaWVsZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKG9sZFJvdywgcGFyYW0ucm93KTtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbS5yb3cgPSBvbGRSb3c7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVwZGF0ZWRSb3dzLmluZGV4T2YocGFyYW0ucm93KSA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZFJvd3MucHVzaChwYXJhbS5yb3cpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAkZGF0YWdyaWQudHJlZWdyaWQoXCJyZWZyZXNoXCIsIHBhcmFtLmlkKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfX3JlbW92ZTogJC5mbi50cmVlZ3JpZC5tZXRob2RzLnJlbW92ZSxcclxuXHJcbiAgICAgICAgX3JlbW92ZTogZnVuY3Rpb24gKGpxLCBpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHZhciBpbnNlcnRlZFJvd3MgPSAkZGF0YWdyaWRcclxuICAgICAgICAgICAgICAgICAgICAudHJlZWdyaWQoXCJfZ2V0Q2hhbmdlc1wiLCBcImluc2VydGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRlbGV0ZWRSb3dzID0gJGRhdGFncmlkLnRyZWVncmlkKFwiX2dldENoYW5nZXNcIiwgXCJkZWxldGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJvdyA9ICRkYXRhZ3JpZC50cmVlZ3JpZChcImZpbmRcIiwgaWQpO1xyXG4gICAgICAgICAgICAgICAgbWFya0RlbGV0ZWRSb3dzKHJvdyk7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtYXJrRGVsZXRlZFJvd3Mocm93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluc2VydGVkUm93cy5pbmRleE9mKHJvdykgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFJvd3MucmVtb3ZlKHJvdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGV0ZWRSb3dzLmluZGV4T2Yocm93KSA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlZFJvd3MucHVzaChyb3cpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyb3cuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJvdy5jaGlsZHJlbiwgZnVuY3Rpb24gKGluZGV4LCByb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtEZWxldGVkUm93cyhyb3cpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICA7XHJcbiAgICAgICAgICAgICAgICAkZGF0YWdyaWQudHJlZWdyaWQoXCJfX3JlbW92ZVwiLCBpZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGpxLCBpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICRkYXRhZ3JpZC50cmVlZ3JpZChcImZvcmNlRW5kRWRpdFwiKS50cmVlZ3JpZChcIl9yZW1vdmVcIiwgaWQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmVTZWxlY3RlZE5vZGVzOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAkZGF0YWdyaWQudHJlZWdyaWQoXCJmb3JjZUVuZEVkaXRcIik7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goJGRhdGFncmlkLnRyZWVncmlkKFwiZ2V0U2VsZWN0aW9uc0lkXCIpLCBmdW5jdGlvbiAoaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICRkYXRhZ3JpZC50cmVlZ3JpZChcIl9yZW1vdmVcIiwgc2VsZWN0ZWRJZCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2xvYWREYXRhOiAkLmZuLnRyZWVncmlkLm1ldGhvZHMubG9hZERhdGEsXHJcblxyXG4gICAgICAgIGxvYWREYXRhOiBmdW5jdGlvbiAoanEsIGRhdGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRkYXRhZ3JpZCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAkZGF0YWdyaWQudHJlZWdyaWQoXCJmb3JjZUVuZEVkaXRcIik7XHJcbiAgICAgICAgICAgICAgICAkZGF0YWdyaWQudHJlZWdyaWQoXCJfbG9hZERhdGFcIiwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldENoYW5nZXM6IGZ1bmN0aW9uIChqcSwgdHlwZSkge1xyXG4gICAgICAgICAgICB2YXIgJGRhdGFncmlkID0gJChqcVswXSk7XHJcbiAgICAgICAgICAgIHZhciBpZEZpZWxkID0gJGRhdGFncmlkLnRyZWVncmlkKFwib3B0aW9uc1wiKS5pZEZpZWxkO1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50RmllbGQgPSAkZGF0YWdyaWQudHJlZWdyaWQoXCJvcHRpb25zXCIpLnBhcmVudEZpZWxkO1xyXG4gICAgICAgICAgICB2YXIgcm93cyA9ICRkYXRhZ3JpZC5kYXRhZ3JpZChcImdldENoYW5nZXNcIiwgdHlwZSk7XHJcbiAgICAgICAgICAgICQuZWFjaChyb3dzLCBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG4gICAgICAgICAgICAgICAgZml4Q2hpbGRyZW5QYXJlbnRJZChyb3cpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZml4Q2hpbGRyZW5QYXJlbnRJZChyb3cpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyb3cuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2gocm93LmNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGRJbmRleCwgY2hpbGRSb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRSb3dbcGFyZW50RmllbGRdID0gcm93W2lkRmllbGRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXhDaGlsZHJlblBhcmVudElkKGNoaWxkUm93KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcm93cztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZWZyZXNoU2F2ZWREYXRhOiBmdW5jdGlvbiAoanEsIHNhdmVkUm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGRhdGFncmlkID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHZhciBpZEZpZWxkID0gJGRhdGFncmlkLnRyZWVncmlkKFwib3B0aW9uc1wiKS5pZEZpZWxkO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluc2VydGVkUm93cyA9ICRkYXRhZ3JpZFxyXG4gICAgICAgICAgICAgICAgICAgIC50cmVlZ3JpZChcIl9nZXRDaGFuZ2VzXCIsIFwiaW5zZXJ0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlZFJvd3MgPSAkZGF0YWdyaWQudHJlZWdyaWQoXCJfZ2V0Q2hhbmdlc1wiLCBcInVwZGF0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVmcmVzaFJvd3MgPSBbXS5jb25jYXQoaW5zZXJ0ZWRSb3dzKS5jb25jYXQodXBkYXRlZFJvd3MpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZyZXNoUm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICRkYXRhZ3JpZC50cmVlZ3JpZChcIm9wdGlvbnNcIikuZWRpdENvbmZpZy5nZXRUcih0aGlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoUm93c1tpXVtpZEZpZWxkXSkuYXR0cihcIm5vZGUtaWRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZWRSb3dzW2ldW2lkRmllbGRdKTtcclxuICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZChyZWZyZXNoUm93c1tpXSwgc2F2ZWRSb3dzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAkZGF0YWdyaWQudHJlZWdyaWQoXCJyZWZyZXNoXCIsIHNhdmVkUm93c1tpXVtpZEZpZWxkXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkZGF0YWdyaWQuZGF0YWdyaWQoXCJhY2NlcHRDaGFuZ2VzXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZWxvYWRBbmRTZWxlY3Q6IGZ1bmN0aW9uIChqcSwgaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0cmVlZ3JpZCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAkdHJlZWdyaWQuZGF0YShcInNlbGVjdGVkSWRcIiwgaWQpO1xyXG4gICAgICAgICAgICAgICAgJHRyZWVncmlkLnRyZWVncmlkKFwicmVsb2FkXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSk7IiwiOyhmdW5jdGlvbiAoJCxmbXgpIHtcclxuXHRcclxuXHRmdW5jdGlvbiBpc1ZhbGlkRGF0ZShlbCxkYXRlKSB7XHJcblx0XHR2YXIgZCA9IHBhcnNlci5jYWxsKGVsLGRhdGUpO1xyXG5cdFx0aWYoZCBpbnN0YW5jZW9mIERhdGUpIHtcclxuXHRcdFx0cmV0dXJuICFpc05hTihkLmdldFllYXIoKSkgJiYgZC5nZXRZZWFyKCkgPiAwO1xyXG5cdFx0fWVsc2UgaWYoIWQpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIHBhcnNlcihzKXtcclxuICAgICAgICBpZighcykgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgaWYocyBpbnN0YW5jZW9mIERhdGUpIHJldHVybiBzO1xyXG4gICAgICAgIGlmKHR5cGVvZiBzID09ICdzdHJpbmcnICYmIHMuaW5kZXhPZignVCcpID4gLTEpe1xyXG4gICAgICAgIFx0cmV0dXJuIG5ldyBEYXRlKHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcGF0dGVybiA9IGdldFBhdHRlcm4odGhpcyk7XHJcbiAgICAgICAgdmFyIG1vbSA9IG1vbWVudChzLCBwYXR0ZXJuLHRydWUpO1xyXG4gICAgICAgIGlmKG1vbS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICBcdHJldHVybiBtb20udG9EYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1x0XHRcclxuXHR9XHJcblx0XHJcblx0ZnVuY3Rpb24gZ2V0UGF0dGVybihlbCkge1xyXG5cdFx0dmFyIHN0YXRlID0gJC5kYXRhKGVsLFwiZGF0ZWJveFwiKSB8fCAkLmRhdGEoZWwsJ3ZhbGlkYXRlYm94Jyk7XHJcblx0XHRpZighc3RhdGUpe1xyXG5cdFx0XHRyZXR1cm4gIHBhZ2VDb250ZXh0LmRlZmF1bHREYXRlRm9ybWF0IHx8ICdZWVlZLU1NLUREJztcclxuXHRcdH1cclxuXHRcdHJldHVybiAoc3RhdGUub3B0aW9ucyA/ICBzdGF0ZS5vcHRpb25zLnBhdHRlcm4gOiBudWxsKSB8fCAgcGFnZUNvbnRleHQuZGVmYXVsdERhdGVGb3JtYXQgfHwgJ1lZWVktTU0tREQnO1xyXG5cdH1cclxuXHR2YXIgX3BhcnNlT3B0aW9ucyA9ICQuZm4uZGF0ZWJveC5wYXJzZU9wdGlvbnM7XHJcblx0JC5mbi5kYXRlYm94LnBhcnNlT3B0aW9ucyA9IGZ1bmN0aW9uKHRhcmdldCl7XHJcblx0XHR2YXIgb3B0cyA9IF9wYXJzZU9wdGlvbnModGFyZ2V0KTtcclxuXHRcdHZhciBwYXR0ZXJuID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgncGF0dGVybicpO1xyXG5cdFx0aWYocGF0dGVybil7XHJcblx0XHRcdG9wdHMucGF0dGVybiA9IHBhdHRlcm47XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3B0cztcclxuXHR9O1xyXG5cdFxyXG4gICAgLyoqICoqKioqKioqIGRhdGVib3ggKioqKioqKioqICovXHJcbiAgICAkLmV4dGVuZCgkLmZuLmRhdGVib3guZGVmYXVsdHMsIHtcclxuICAgICAgICB3aWR0aDogMTU1LFxyXG4gICAgICAgIHZhbGlkVHlwZSA6ICdkYXRlJyxcclxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uIChkYXRlKSB7XHJcbiAgICAgICAgXHR2YXIgcGF0dGVybiA9IGdldFBhdHRlcm4odGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBmbXguZm9ybWF0dGVycy5mb3JtYXREYXRlKGRhdGUscGF0dGVybik7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWwgPT0gJ0ludmFsaWQgZGF0ZScgPyBudWxsIDogdmFsO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcnNlcjogZnVuY3Rpb24gKHMpIHtcclxuICAgICAgICBcdHJldHVybiBwYXJzZXIuY2FsbCh0aGlzLHMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdmFsaWRhdG9yIDogZnVuY3Rpb24oZGF0ZSl7XHJcbiAgICAgICAgXHRyZXR1cm4gaXNWYWxpZERhdGUodGhpcyxkYXRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHZhbGlkYXRlT25CbHVyIDogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICAvL+aXpeacn+inhOWImVxyXG4gICAgJC5leHRlbmQoJC5mbi5kYXRlYm94LmRlZmF1bHRzLnJ1bGVzLHtcclxuICAgIFx0ZGF0ZSA6IHtcclxuICAgIFx0XHR2YWxpZGF0b3IgOiBmdW5jdGlvbih2YWx1ZSl7XHJcbiAgICBcdFx0XHRyZXR1cm4gaXNWYWxpZERhdGUodGhpcyx2YWx1ZSk7XHJcbiAgICBcdFx0fSxcclxuICAgIFx0XHRtZXNzYWdlIDogJ+ivt+i+k+WFpeato+ehrueahOaXpeacn+agvOW8j++8gSdcclxuICAgIFx0fVxyXG4gICAgfSk7XHJcbiAgICB2YXIgX3NldFZhbCA9ICQuZm4uZGF0ZWJveC5tZXRob2RzLnNldFZhbHVlO1xyXG4gICAgJC5mbi5kYXRlYm94Lm1ldGhvZHMuc2V0VmFsdWUgPSBmdW5jdGlvbihqcSwgdmFsdWUpIHtcclxuICAgIFx0aWYodmFsdWUgaW5zdGFuY2VvZiBEYXRlKXtcclxuICAgIFx0XHRyZXR1cm4gX3NldFZhbChqcSx2YWx1ZSk7XHJcbiAgICBcdH1cclxuICAgIFx0dmFyIHZhbCA9IHBhcnNlci5jYWxsKHRoaXMsdmFsdWUpO1xyXG4gICAgXHRpZih2YWwpe1xyXG4gICAgXHRcdHJldHVybiBfc2V0VmFsKGpxLHZhbCk7XHJcbiAgICBcdH1cclxuICAgIFx0cmV0dXJuIF9zZXRWYWwoanEsbnVsbCk7XHJcbiAgICB9XHJcbiAgICAkLmZuLmNhbGVuZGFyLmRlZmF1bHRzLnZhbGlkYXRvciA9ICQuZm4uZGF0ZWJveC5kZWZhdWx0cy52YWxpZGF0b3I7XHJcbiAgICBcclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKiogICAgXHJcbmVhc3l1aS1kYXRldGltZWJveFxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqLyAgICBcclxuICAgIGZ1bmN0aW9uIHBhcnNlVGltZShlbCxzKSB7XHJcblx0XHRpZiAoJC50cmltKHMpID09ICcnKXtcclxuXHRcdFx0cmV0dXJuIG5ldyBEYXRlKCk7XHJcblx0XHR9XHJcblx0XHR2YXIgc3RhdGUgPSAkLmRhdGEoZWwsXCJkYXRldGltZWJveFwiKSB8fCAkLmRhdGEoZWwsJ3ZhbGlkYXRlYm94Jyk7XHJcblx0XHRpZighc3RhdGUgfHwgIXN0YXRlLm9wdGlvbnMpIHJldHVybiBudWxsO1xyXG5cdFx0aWYoIXN0YXRlLm9wdGlvbnMuc3RyaWN0KXtcclxuXHRcdFx0dmFyIGR0ID0gcy5zcGxpdCgnICcpO1xyXG5cdFx0XHR2YXIgZCA9ICQuZm4uZGF0ZWJveC5kZWZhdWx0cy5wYXJzZXIuY2FsbChlbCxkdFswXSk7XHJcblx0XHRcdGlmIChkdC5sZW5ndGggPCAyIHx8ICFkKXtcclxuXHRcdFx0XHRyZXR1cm4gZDtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgcGF0dGVybjsgXHJcblx0XHRcdGlmKHN0YXRlLm9wdGlvbnMuc2hvd1NlY29uZHMpe1xyXG5cdFx0XHRcdHBhdHRlcm4gPSAnSEgnK3N0YXRlLm9wdGlvbnMudGltZVNlcGFyYXRvcisnbW0nK3N0YXRlLm9wdGlvbnMudGltZVNlcGFyYXRvcisnc3MnO1xyXG5cdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRwYXR0ZXJuID0gJ0hIJytzdGF0ZS5vcHRpb25zLnRpbWVTZXBhcmF0b3IrJ21tJztcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgdGltZSA9IG1vbWVudChkdFsxXSxwYXR0ZXJuLHRydWUpO1xyXG5cdFx0XHRpZih0aW1lLmlzVmFsaWQoKSl7XHJcblx0XHRcdFx0ZC5zZXRIb3Vycyh0aW1lLmhvdXIoKSk7XHJcblx0XHRcdFx0ZC5zZXRNaW51dGVzKHRpbWUubWludXRlKCkpO1xyXG5cdFx0XHRcdGQuc2V0U2Vjb25kcyh0aW1lLnNlY29uZCgpKTtcclxuXHRcdFx0XHRyZXR1cm4gZDtcclxuXHRcdFx0fVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBwYXR0ZXJuID0gZ2V0UGF0dGVybihlbCk7XHJcblx0XHRcdGlmKHN0YXRlLm9wdGlvbnMuc2hvd1NlY29uZHMpe1xyXG5cdFx0XHRcdHBhdHRlcm4gPSBwYXR0ZXJuICsgJyBISCcrc3RhdGUub3B0aW9ucy50aW1lU2VwYXJhdG9yKydtbScrc3RhdGUub3B0aW9ucy50aW1lU2VwYXJhdG9yKydzcyc7XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHBhdHRlcm4gPSBwYXR0ZXJuICsgJyBISCcrc3RhdGUub3B0aW9ucy50aW1lU2VwYXJhdG9yKydtbSc7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIG0gPSBtb21lbnQocyxwYXR0ZXJuLHRydWUpO1xyXG5cdFx0XHRpZihtLmlzVmFsaWQoKSl7XHJcblx0XHRcdFx0cmV0dXJuIG0udG9EYXRlKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cdFxyXG4gICAgJC5leHRlbmQoJC5mbi5kYXRldGltZWJveC5kZWZhdWx0cywge1xyXG4gICAgXHR2YWxpZFR5cGUgOiAnZGF0ZXRpbWUnLFxyXG4gICAgXHR2YWxpZGF0ZU9uQmx1ciA6IHRydWUsXHJcbiAgICBcdHN0cmljdDogZmFsc2UsLyoq5Lil5qC85qih5byPLOWNs+aYr+W/hemhu+i+k+WFpeaXtuWIhuenkioqL1xyXG4gICAgICAgIHBhcnNlcjogZnVuY3Rpb24gKHMpIHtcclxuICAgICAgICBcdHJldHVybiBwYXJzZVRpbWUodGhpcyxzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHZhbGlkYXRvciA6IGZ1bmN0aW9uKGRhdGUpe1xyXG4gICAgICAgIFx0cmV0dXJuICEhcGFyc2VUaW1lKHRoaXMsZGF0ZSk7XHJcbiAgICAgICAgfSAgICBcdFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgICQuZXh0ZW5kKCQuZm4uZGF0ZXRpbWVib3guZGVmYXVsdHMucnVsZXMse1xyXG4gICAgXHRkYXRldGltZSA6IHtcclxuICAgIFx0XHR2YWxpZGF0b3IgOiBmdW5jdGlvbih2YWx1ZSl7XHJcbiAgICBcdFx0XHRyZXR1cm4gISFwYXJzZVRpbWUodGhpcyx2YWx1ZSk7XHJcbiAgICBcdFx0fSxcclxuICAgIFx0XHRtZXNzYWdlIDogJ+ivt+i+k+WFpeato+ehrueahOaXpeacn+aXtumXtOagvOW8j++8gSdcclxuICAgIFx0fVxyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSxmbXgpOyIsIjsgKGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuICAgIC8qKiAqKioqKioqKiBmb3JtICoqKioqKioqKiAqL1xyXG4gICAgJC5mbi5mb3JtLl9wYXJzZU9wdGlvbnMgPSAkLmZuLmZvcm0ucGFyc2VPcHRpb25zO1xyXG4gICAgJC5mbi5mb3JtLnBhcnNlT3B0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICB2YXIgb3B0cyA9ICQuZm4uZm9ybS5fcGFyc2VPcHRpb25zLmNhbGwodGFyZ2V0LCB0YXJnZXQpO1xyXG4gICAgICAgIGlmICghb3B0c1snY29udGVudFR5cGUnXSkge1xyXG4gICAgICAgICAgICBvcHRzWydjb250ZW50VHlwZSddID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgnY29udGVudFR5cGUnKSB8fCB0YXJnZXQuZ2V0QXR0cmlidXRlKCdjb250ZW50LXR5cGUnKSB8fCB0YXJnZXQuZ2V0QXR0cmlidXRlKCdlbmN0eXBlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFvcHRzWyd2YWxpZGF0ZU9uQ2xlYXJBbmRSZXN0J10pe1xyXG4gICAgICAgIFx0dmFyIHZhbCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ3ZhbGlkYXRlT25DbGVhckFuZFJlc3QnKTtcclxuICAgICAgICBcdG9wdHMudmFsaWRhdGVPbkNsZWFyQW5kUmVzdCA9IHZhbCA9PSB0cnVlIHx8IHZhbCA9PSAndHJ1ZSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRzWyd1cmwnXSkge1xyXG4gICAgICAgICAgICBvcHRzLnVybCA9ICR1cmwob3B0cy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0c1snY29udGVudFR5cGUnXSkge1xyXG4gICAgICAgICAgICBvcHRzLmlmcmFtZSA9IG9wdHMuY29udGVudFR5cGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdqc29uJykgPCAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0YXJnZXQuZ2V0QXR0cmlidXRlKCdtYXNraXQnKSl7XHJcbiAgICAgICAgICBvcHRzWydtYXNraXQnXSA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ21hc2tpdCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihvcHRzWydtYXNraXQnXSl7XHJcbiAgICAgICAgXHRvcHRzWydtYXNraXQnXSA9IGZteC51dGlscy5nZXRKcXVlcnkob3B0c1snbWFza2l0J10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gb3B0cztcclxuICAgIH07XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIHN1Ym1pdEZvcm0odGFyZ2V0LCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIG9wdHMgPSAkLmRhdGEodGFyZ2V0LCAnZm9ybScpLm9wdGlvbnM7XHJcbiAgICAgICAgJC5leHRlbmQob3B0cywgb3B0aW9ucyB8fCB7fSk7XHJcblxyXG4gICAgICAgIHZhciBwYXJhbSA9ICQuZXh0ZW5kKHt9LCBvcHRzLnF1ZXJ5UGFyYW1zKTtcclxuICAgICAgICBpZiAob3B0cy5vblN1Ym1pdC5jYWxsKHRhcmdldCwgcGFyYW0pID09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIW9wdHMuaXNEb3dubG9hZCl7XHJcbiAgICAgICAgICBpZiAoJC5kYXRhKHRhcmdldCwgJ3N1Ym1pdHRpbmcnKSlcclxuICAgICAgICAgICAgICByZXR1cm4gJC5tZXNzYWdlci5hbGVydCgnJywgJC5mbi5mb3JtLmRlZmF1bHRzLnN1Ym1pdHRpbmdNc2cpO1xyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICQuZGF0YSh0YXJnZXQsICdzdWJtaXR0aW5nJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmKG9wdHMubWFza2l0KSBvcHRzLm1hc2tpdC5tYXNraXQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gJCh0YXJnZXQpLmZpbmQoJy50ZXh0Ym94LXRleHQ6Zm9jdXMnKS5ibHVyKCk7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gJCh0YXJnZXQpLmZpbmQoJy50ZXh0Ym94LXRleHQ6Zm9jdXMnKTtcclxuICAgICAgICBpbnB1dC50cmlnZ2VySGFuZGxlcignYmx1cicpO1xyXG4gICAgICAgIGlucHV0LmZvY3VzKCk7XHJcblxyXG4gICAgICAgIHZhciBkaXNhYmxlZEZpZWxkcyA9IG51bGw7IC8vIHRoZSBmaWVsZHMgdG8gYmUgZGlzYWJsZWRcclxuICAgICAgICBpZiAob3B0cy5kaXJ0eSkge1xyXG4gICAgICAgICAgICB2YXIgZmYgPSBbXTsgLy8gYWxsIHRoZSBkaXJ0eSBmaWVsZHNcclxuICAgICAgICAgICAgJC5tYXAob3B0cy5kaXJ0eUZpZWxkcywgZnVuY3Rpb24gKGYpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkKGYpLmhhc0NsYXNzKCd0ZXh0Ym94LWYnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoZikubmV4dCgpLmZpbmQoJy50ZXh0Ym94LXZhbHVlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZmLnB1c2godGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGZmLnB1c2goZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBkaXNhYmxlZEZpZWxkcyA9ICQodGFyZ2V0KS5maW5kKCdpbnB1dFtuYW1lXTplbmFibGVkLHRleHRhcmVhW25hbWVdOmVuYWJsZWQsc2VsZWN0W25hbWVdOmVuYWJsZWQnKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQuaW5BcnJheSh0aGlzLCBmZikgPT0gLTE7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZGlzYWJsZWRGaWVsZHMuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKG9wdHMuYWpheCkge1xyXG4gICAgICAgICAgICBpZiAob3B0cy5pZnJhbWUpIHtcclxuICAgICAgICAgICAgICAgIHN1Ym1pdEZvcm1CeUlmcmFtZSh0YXJnZXQsIHBhcmFtKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN1Ym1pdEZvcm1CeVhocih0YXJnZXQsIHBhcmFtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICQodGFyZ2V0KS5zdWJtaXQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcHRzLmRpcnR5KSB7XHJcbiAgICAgICAgICAgIGRpc2FibGVkRmllbGRzLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHN1Ym1pdEZvcm1CeUlmcmFtZSh0YXJnZXQsIHBhcmFtKSB7XHJcbiAgICAgICAgdmFyIG9wdHMgPSAkLmRhdGEodGFyZ2V0LCAnZm9ybScpLm9wdGlvbnM7XHJcbiAgICAgICAgdmFyIGZyYW1lSWQgPSAnZWFzeXVpX2ZyYW1lXycgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xyXG4gICAgICAgIHZhciBmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9JyArIGZyYW1lSWQgKyAnIG5hbWU9JyArIGZyYW1lSWQgKyAnPjwvaWZyYW1lPicpLmFwcGVuZFRvKCdib2R5JykuYXR0cignc3JjJywgd2luZG93LkFjdGl2ZVhPYmplY3QgPyAnamF2YXNjcmlwdDpmYWxzZScgOiAnYWJvdXQ6YmxhbmsnKTtcclxuICAgICAgICBmcmFtZS5jc3Moe1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgdG9wOiAtMTAwMCxcclxuICAgICAgICAgICAgbGVmdDogLTEwMDBcclxuICAgICAgICB9KTtcclxuICAgICAgICBmcmFtZS5iaW5kKCdsb2FkJywgY2IpO1xyXG5cclxuICAgICAgICBzdWJtaXQocGFyYW0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBzdWJtaXQocGFyYW0pIHtcclxuICAgICAgICAgICAgdmFyIGZvcm0gPSAkKHRhcmdldCk7XHJcbiAgICAgICAgICAgIGlmIChvcHRzLnVybCkge1xyXG4gICAgICAgICAgICAgICAgZm9ybS5hdHRyKCdhY3Rpb24nLCBvcHRzLnVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHQgPSBmb3JtLmF0dHIoJ3RhcmdldCcpLCBhID0gZm9ybS5hdHRyKCdhY3Rpb24nKTtcclxuICAgICAgICAgICAgZm9ybS5hdHRyKCd0YXJnZXQnLCBmcmFtZUlkKTtcclxuICAgICAgICAgICAgdmFyIHBhcmFtRmllbGRzID0gJCgpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiBpbiBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWVsZCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIicgKyBuICsgJ1wiPicpLnZhbChwYXJhbVtuXSkuYXBwZW5kVG8oZm9ybSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1GaWVsZHMgPSBwYXJhbUZpZWxkcy5hZGQoZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2hlY2tTdGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgZm9ybVswXS5zdWJtaXQoKTtcclxuICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgIGZvcm0uYXR0cignYWN0aW9uJywgYSk7XHJcbiAgICAgICAgICAgICAgICB0ID8gZm9ybS5hdHRyKCd0YXJnZXQnLCB0KSA6IGZvcm0ucmVtb3ZlQXR0cigndGFyZ2V0Jyk7XHJcbiAgICAgICAgICAgICAgICBwYXJhbUZpZWxkcy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY2hlY2tTdGF0ZSgpIHtcclxuICAgICAgICAgICAgdmFyIGYgPSAkKCcjJyArIGZyYW1lSWQpO1xyXG4gICAgICAgICAgICBpZiAoIWYubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSBmLmNvbnRlbnRzKClbMF0ucmVhZHlTdGF0ZTtcclxuICAgICAgICAgICAgICAgIGlmIChzICYmIHMudG9Mb3dlckNhc2UoKSA9PSAndW5pbml0aWFsaXplZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrU3RhdGUsIDEwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjaGVja0NvdW50ID0gMTA7XHJcbiAgICAgICAgZnVuY3Rpb24gY2IoKSB7XHJcbiAgICAgICAgICAgIHZhciBmID0gJCgnIycgKyBmcmFtZUlkKTtcclxuICAgICAgICAgICAgaWYgKCFmLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZi51bmJpbmQoKTtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSAnJztcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBib2R5ID0gZi5jb250ZW50cygpLmZpbmQoJ2JvZHknKTtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBib2R5Lmh0bWwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhID09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC0tY2hlY2tDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNiLCAxMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHRhID0gYm9keS5maW5kKCc+dGV4dGFyZWEnKTtcclxuICAgICAgICAgICAgICAgIGlmICh0YS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhID0gdGEudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmUgPSBib2R5LmZpbmQoJz5wcmUnKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gcHJlLmh0bWwoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcHRzLnN1Y2Nlc3MuY2FsbCh0YXJnZXQsIGRhdGEpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQuZGF0YSh0YXJnZXQsICdzdWJtaXR0aW5nJywgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgaWYob3B0cy5tYXNraXQpIG9wdHMubWFza2l0Lm1hc2tpdCgndW5tYXNrJyk7XHJcbiAgICAgICAgICAgICAgICBmLnVuYmluZCgpO1xyXG4gICAgICAgICAgICAgICAgZi5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzdWJtaXRGb3JtQnlYaHIodGFyZ2V0LCBwYXJhbSkge1xyXG4gICAgICAgIHZhciBvcHRzID0gJC5kYXRhKHRhcmdldCwgJ2Zvcm0nKS5vcHRpb25zLCBmb3JtRGF0YSwgY29udGVudFR5cGUgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIW9wdHMuY29udGVudFR5cGUgfHwgb3B0cy5jb250ZW50VHlwZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2pzb24nKSA9PSAtMSkge1xyXG4gICAgICAgICAgICBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkKHRhcmdldClbMF0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lIGluIHBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQobmFtZSwgcGFyYW1bbmFtZV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSAkKHRhcmdldCkuZm9ybSgnZ2V0RGF0YScpO1xyXG4gICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBkYXRhLCBwYXJhbSk7XHJcbiAgICAgICAgICAgIGZvcm1EYXRhID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtOCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogb3B0cy51cmwsXHJcbiAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcclxuICAgICAgICAgICAgeGhyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gJC5hamF4U2V0dGluZ3MueGhyKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnVwbG9hZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHhoci51cGxvYWQuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG90YWwgPSBlLnRvdGFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gZS5sb2FkZWQgfHwgZS5wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50ID0gTWF0aC5jZWlsKHBvc2l0aW9uICogMTAwIC8gdG90YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5vblByb2dyZXNzLmNhbGwodGFyZ2V0LCBwZXJjZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2h0bWwnLFxyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBjb250ZW50VHlwZSxcclxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICAgICAgJC5kYXRhKHRhcmdldCwgJ3N1Ym1pdHRpbmcnLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZihvcHRzLm1hc2tpdCkgb3B0cy5tYXNraXQubWFza2l0KCd1bm1hc2snKTtcclxuICAgICAgICAgICAgICAgIG9wdHMuc3VjY2Vzcy5jYWxsKHRhcmdldCwgcmVzLnJlc3BvbnNlVGV4dCxyZXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuXHQvKipcclxuXHQgKiBjbGVhciB0aGUgZm9ybSBmaWVsZHNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBjbGVhcih0YXJnZXQpe1xyXG5cdFx0JCgnaW5wdXQsc2VsZWN0LHRleHRhcmVhJywgdGFyZ2V0KS5lYWNoKGZ1bmN0aW9uKCl7XHJcblx0XHRcdHZhciB0ID0gdGhpcy50eXBlLCB0YWcgPSB0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcclxuXHRcdFx0aWYgKHQgPT0gJ3RleHQnIHx8IHQgPT0gJ2hpZGRlbicgfHwgdCA9PSAncGFzc3dvcmQnIHx8IHRhZyA9PSAndGV4dGFyZWEnKXtcclxuXHRcdFx0XHR0aGlzLnZhbHVlID0gJyc7XHJcblx0XHRcdH0gZWxzZSBpZiAodCA9PSAnZmlsZScpe1xyXG5cdFx0XHRcdHZhciBmaWxlID0gJCh0aGlzKTtcclxuXHRcdFx0XHRpZiAoIWZpbGUuaGFzQ2xhc3MoJ3RleHRib3gtdmFsdWUnKSl7XHJcblx0XHRcdFx0XHR2YXIgbmV3ZmlsZSA9IGZpbGUuY2xvbmUoKS52YWwoJycpO1xyXG5cdFx0XHRcdFx0bmV3ZmlsZS5pbnNlcnRBZnRlcihmaWxlKTtcclxuXHRcdFx0XHRcdGlmIChmaWxlLmRhdGEoJ3ZhbGlkYXRlYm94Jykpe1xyXG5cdFx0XHRcdFx0XHRmaWxlLnZhbGlkYXRlYm94KCdkZXN0cm95Jyk7XHJcblx0XHRcdFx0XHRcdG5ld2ZpbGUudmFsaWRhdGVib3goKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGZpbGUucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2UgaWYgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpe1xyXG5cdFx0XHRcdHRoaXMuY2hlY2tlZCA9IGZhbHNlO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHRhZyA9PSAnc2VsZWN0Jyl7XHJcblx0XHRcdFx0dGhpcy5zZWxlY3RlZEluZGV4ID0gLTE7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9KTtcclxuXHRcdFxyXG5cdFx0dmFyIGZvcm0gPSAkKHRhcmdldCk7XHJcblx0XHR2YXIgb3B0cyA9ICQuZGF0YSh0YXJnZXQsICdmb3JtJykub3B0aW9ucztcclxuXHRcdGZvcih2YXIgaT1vcHRzLmZpZWxkVHlwZXMubGVuZ3RoLTE7IGk+PTA7IGktLSl7XHJcblx0XHRcdHZhciB0eXBlID0gb3B0cy5maWVsZFR5cGVzW2ldO1xyXG5cdFx0XHR2YXIgZmllbGQgPSBmb3JtLmZpbmQoJy4nK3R5cGUrJy1mJyk7XHJcblx0XHRcdGlmIChmaWVsZC5sZW5ndGggJiYgZmllbGRbdHlwZV0pe1xyXG5cdFx0XHRcdGZpZWxkW3R5cGVdKCdjbGVhcicpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZihvcHRzLnZhbGlkYXRlT25DbGVhckFuZFJlc3Qpe1xyXG5cdFx0XHRmb3JtLmZvcm0oJ3ZhbGlkYXRlJyk7XHJcblx0XHR9XHJcblx0fSAgICBcclxuXHRcclxuXHRmdW5jdGlvbiByZXNldCh0YXJnZXQpe1xyXG5cdFx0dGFyZ2V0LnJlc2V0KCk7XHJcblx0XHR2YXIgZm9ybSA9ICQodGFyZ2V0KTtcclxuXHRcdHZhciBvcHRzID0gJC5kYXRhKHRhcmdldCwgJ2Zvcm0nKS5vcHRpb25zO1xyXG5cdFx0Zm9yKHZhciBpPW9wdHMuZmllbGRUeXBlcy5sZW5ndGgtMTsgaT49MDsgaS0tKXtcclxuXHRcdFx0dmFyIHR5cGUgPSBvcHRzLmZpZWxkVHlwZXNbaV07XHJcblx0XHRcdHZhciBmaWVsZCA9IGZvcm0uZmluZCgnLicrdHlwZSsnLWYnKTtcclxuXHRcdFx0aWYgKGZpZWxkLmxlbmd0aCAmJiBmaWVsZFt0eXBlXSl7XHJcblx0XHRcdFx0ZmllbGRbdHlwZV0oJ3Jlc2V0Jyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmKG9wdHMudmFsaWRhdGVPbkNsZWFyQW5kUmVzdCl7XHJcblx0XHRcdGZvcm0uZm9ybSgndmFsaWRhdGUnKTtcclxuXHRcdH1cclxuXHR9XHRcclxuICAgIFxyXG4gICAgdmFyIF9sb2FkID0gJC5mbi5mb3JtLm1ldGhvZHMubG9hZDtcclxuICAgIGZ1bmN0aW9uIHBhcnNlTG9hZERhdGEodGFyZ2V0LGRhdGEpe1xyXG4gICAgICBpZihkYXRhICYmICgkLmlzUGxhaW5PYmplY3QoZGF0YSkpKXtcclxuICAgICAgICBkYXRhID0gZm14LnV0aWxzLnBhcmFtT2JqZWN0KGRhdGEpO1xyXG4gICAgICAgIF9sb2FkKCQodGFyZ2V0KSxkYXRhKTtcclxuICAgICAgICAkLmRhdGEodGFyZ2V0LCdvbGREYXRhJyxkYXRhKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9hZCh0YXJnZXQsZGF0YSkge1xyXG4gICAgICB2YXIgb3B0cyA9ICQuZGF0YSh0YXJnZXQsICdmb3JtJykub3B0aW9ucztcclxuICAgICAgXHJcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgdmFyIHBhcmFtID0ge307XHJcbiAgICAgICAgaWYgKG9wdHMub25CZWZvcmVMb2FkLmNhbGwodGFyZ2V0LCBwYXJhbSkgPT0gZmFsc2UpIHJldHVybjtcclxuICAgICAgICBpZihkYXRhLmluZGV4T2YoJy9yZXN0LycpID09IDApe1xyXG4gICAgICAgICAgZGF0YSA9ICR1cmwoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICB1cmw6IGRhdGEsXHJcbiAgICAgICAgICBkYXRhOiBwYXJhbSxcclxuICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICAgICAgaWYoJC50eXBlKGRhdGEpID09ICdzdHJpbmcnKXtcclxuICAgICAgICAgICAgICBkYXRhID0gJC5wYXJzZUpTT04oZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoZGF0YS5jb2RlIDwgMCl7XHJcbiAgICAgICAgICAgICAgJC5tZXNzYWdlci5hbGVydCgn6ZSZ6K+v5o+Q56S6JyxkYXRhLm1lc3NhZ2UgfHwgJ+aVsOaNruWKoOi9veWHuumUmeS6hiEnLCdlcnJvcicpO1xyXG4gICAgICAgICAgICAgIG9wdHMub25Mb2FkRXJyb3IuYXBwbHkodGFyZ2V0LCBkYXRhKTtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKGRhdGEuZGF0YSl7XHJcbiAgICAgICAgICAgICAgZGF0YSA9IGRhdGEuZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYXJzZUxvYWREYXRhKHRhcmdldCxkYXRhKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgb3B0cy5vbkxvYWRFcnJvci5hcHBseSh0YXJnZXQsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGFyc2VMb2FkRGF0YSh0YXJnZXQsZGF0YSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgJC5leHRlbmQoJC5mbi5mb3JtLmRlZmF1bHRzLCB7XHJcbiAgICAgICAgc3VibWl0dGluZ01zZzogJ1BsZWFzZSB3YWl0aW5nIGZvciB0aGUgZm9ybSBpcyBzdWJtaXR0aW5nLicsXHJcbiAgICAgICAgdmFsaWRhdGVPbkNsZWFyQW5kUmVzdCA6IGZhbHNlXHJcbiAgICB9KTtcclxuICAgICQuZXh0ZW5kKCQuZm4uZm9ybS5tZXRob2RzLCB7XHJcblx0XHRjbGVhcjogZnVuY3Rpb24oanEpe1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGNsZWFyKHRoaXMpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblx0XHRyZXNldDogZnVuY3Rpb24oanEpe1xyXG5cdFx0XHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHJlc2V0KHRoaXMpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sICAgIFx0XHJcbiAgICAgICAgbG9hZDogZnVuY3Rpb24oanEsIGRhdGEpe1xyXG4gICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgbG9hZCh0aGlzLCBkYXRhKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VibWl0OiBmdW5jdGlvbiAoanEsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc3VibWl0Rm9ybSh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXREYXRhOiBmdW5jdGlvbiAoanEsIGRhdGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmZvcm0oXCJsb2FkXCIsIGRhdGEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldERhdGE6IGZ1bmN0aW9uIChqcSkge1xyXG4gICAgICAgICAgICB2YXIgJGZvcm0gPSAkKGpxWzBdKTtcclxuICAgICAgICAgICAgdmFyIGZvcm1WYWx1ZXMgPSB7fTtcclxuICAgICAgICAgICAgdmFyIGlucHV0ID0gJGZvcm0uZmluZCgnLnRleHRib3gtdGV4dDpmb2N1cycpO1xyXG4gICAgICAgICAgICBpbnB1dC50cmlnZ2VySGFuZGxlcignYmx1cicpO1xyXG4gICAgICAgICAgICBpbnB1dC5mb2N1cygpOyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAkZm9ybS5maW5kKFwiaW5wdXRbbmFtZV1bY2xhc3MhPSd0ZXh0Ym94LXZhbHVlJ10sdGV4dGFyZWFbbmFtZV0sc2VsZWN0W25hbWVdXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9ICRpbnB1dC5hdHRyKFwibmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmICgkaW5wdXQuYXR0cihcInR5cGVcIikgPT0gXCJjaGVja2JveFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9ybVZhbHVlc1tuYW1lXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZm9ybS5maW5kKFwiaW5wdXRbbmFtZT0nXCIgKyBuYW1lICsgXCInXTpjaGVja2VkXCIpLmVhY2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goJCh0aGlzKS5hdHRyKFwib25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgJCh0aGlzKS5hdHRyKFwidmFsdWVcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZXMuam9pbignLCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCRpbnB1dC5hdHRyKFwidHlwZVwiKSA9PSBcInJhZGlvXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JtVmFsdWVzW25hbWVdID0gJGZvcm0uZmluZChcImlucHV0W25hbWU9J1wiICsgbmFtZSArIFwiJ106Y2hlY2tlZFwiKS5hdHRyKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCRpbnB1dC5oYXNDbGFzcyhcImVhc3l1aS1udW1iZXJib3hcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JtVmFsdWVzW25hbWVdID0gJGlucHV0Lm51bWJlcmJveChcImdldFZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JtVmFsdWVzW25hbWVdID0gJGlucHV0LnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJGZvcm0uZmluZChcImlucHV0W2NvbWJvbmFtZV0sc2VsZWN0W2NvbWJvbmFtZV0saW5wdXRbdGV4dGJveG5hbWVdXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyksIG5hbWUgPSAkaW5wdXQuYXR0cihcImNvbWJvbmFtZVwiKSB8fCAkaW5wdXQuYXR0cihcInRleHRib3huYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gJC5kYXRhKHRoaXMsICdjb21ibycpIHx8ICQuZGF0YSh0aGlzLCAndGV4dGJveCcpLCB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsZSA9ICEhJGlucHV0LmF0dHIoJ211bHRpcGxlJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9ybVZhbHVlc1tuYW1lXSA9ICRpbnB1dC52YWwoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobXVsdGlwbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JtVmFsdWVzW25hbWVdID0gJGlucHV0LmNvbWJvKFwiZ2V0VmFsdWVzXCIpLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9ybVZhbHVlc1tuYW1lXSA9ICRpbnB1dC50ZXh0Ym94KCdnZXRWYWx1ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHt9LCAkZm9ybS5kYXRhKFwiZGF0YVwiKSwgZm9ybVZhbHVlcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0UXVlcnlGaWVsZHM6IGZ1bmN0aW9uIChqcSkge1xyXG4gICAgICAgICAgICB2YXIgJGZvcm0gPSAkKGpxWzBdKTtcclxuICAgICAgICAgICAgdmFyIGlucHV0ID0gJGZvcm0uZmluZCgnLnRleHRib3gtdGV4dDpmb2N1cycpO1xyXG4gICAgICAgICAgICBpbnB1dC50cmlnZ2VySGFuZGxlcignYmx1cicpO1xyXG4gICAgICAgICAgICBpbnB1dC5mb2N1cygpOyAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgcXVlcnlGaWVsZHMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZWRNdWx0aXBsZXMgPSBbXTtcclxuICAgICAgICAgICAgJGZvcm0uZmluZChcImlucHV0W25hbWVdW2NsYXNzIT0ndGV4dGJveC12YWx1ZSddLHRleHRhcmVhW25hbWVdLHNlbGVjdFtuYW1lXVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkaW5wdXQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSAkaW5wdXQuYXR0cihcIm5hbWVcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkaW5wdXQudmFsKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZhbHVlIHx8IGhhbmRsZWRNdWx0aXBsZXMuaW5kZXhPZihuYW1lKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkVHlwZSA9ICRpbnB1dC5hdHRyKFwiZGF0YVR5cGVcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3BlcmF0b3IgPSAkaW5wdXQuYXR0cihcIm9wZXJhdG9yXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCRpbnB1dC5hdHRyKFwidHlwZVwiKSA9PSBcImNoZWNrYm94XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICRpbnB1dC5jbG9zZXN0KFwiW29wZXJhdG9yXVwiKS5hdHRyKFwib3BlcmF0b3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dFtuYW1lPSdcIiArIG5hbWUgKyBcIiddOmNoZWNrZWRcIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCQodGhpcykuYXR0cihcIm9uXCIpIHx8ICQodGhpcykuYXR0cihcInZhbHVlXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBxdWVyeUZpZWxkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGROYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFR5cGU6IFwiU3RyaW5nW11cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRTdHJpbmdWYWx1ZTogdmFsdWVzLmpvaW4oXCIsXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3JcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkTXVsdGlwbGVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCRpbnB1dC5hdHRyKFwidHlwZVwiKSA9PSBcInJhZGlvXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICRpbnB1dC5jbG9zZXN0KFwiW29wZXJhdG9yXVwiKS5hdHRyKFwib3BlcmF0b3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAkZm9ybS5maW5kKFwiaW5wdXRbbmFtZT0nXCIgKyBuYW1lICsgXCInXTpjaGVja2VkXCIpLmF0dHIoXCJ2YWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBxdWVyeUZpZWxkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGROYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFR5cGU6IGZpZWxkVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRTdHJpbmdWYWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBvcGVyYXRvclxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWRNdWx0aXBsZXMucHVzaChuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoJGlucHV0Lmhhc0NsYXNzKFwiZWFzeXVpLW51bWJlcmJveFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJGlucHV0Lm51bWJlcmJveChcImdldFZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcXVlcnlGaWVsZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGROYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVHlwZTogZmllbGRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkU3RyaW5nVmFsdWU6IHZhbHVlICsgXCJcIixcclxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3JcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJGZvcm0uZmluZChcImlucHV0W2NvbWJvbmFtZV0sc2VsZWN0W2NvbWJvbmFtZV0saW5wdXRbdGV4dGJveG5hbWVdXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyksIG9wZXJhdG9yID0gJGlucHV0LmF0dHIoXCJvcGVyYXRvclwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9ICQuZGF0YSh0aGlzLCAnY29tYm8nKSwgbmFtZSA9ICRpbnB1dC5hdHRyKFwiY29tYm9uYW1lXCIpIHx8ICRpbnB1dC5hdHRyKCd0ZXh0Ym94bmFtZScpLCB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsZSA9ICEhJGlucHV0LmF0dHIoJ211bHRpcGxlJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAkaW5wdXQudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG11bHRpcGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAkaW5wdXQuY29tYm8oXCJnZXRWYWx1ZXNcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJGlucHV0LnRleHRib3goXCJnZXRWYWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghdmFsdWUgfHwgdmFsdWUgPT0gJycgfHwgdmFsdWUubGVuZ3RoID09IDApIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5RmllbGRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkTmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZFR5cGU6IG11bHRpcGxlID8gKCRpbnB1dC5hdHRyKCdkYXRhVHlwZScpIHx8IFwiU3RyaW5nW11cIikgOiAkaW5wdXQuYXR0cignZGF0YVR5cGUnKSxcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZFN0cmluZ1ZhbHVlOiBtdWx0aXBsZSA/IHZhbHVlLmpvaW4oXCIsXCIpIDogdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IG9wZXJhdG9yXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBxdWVyeUZpZWxkcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkYXRhQ2hhbmdlZDogZnVuY3Rpb24gKGpxKSB7XHJcbiAgICAgICAgICAgIHZhciAkZm9ybSA9ICQoanFbMF0pO1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoJGZvcm0uZGF0YShcIm9sZERhdGFcIikpICE9IEpTT04uc3RyaW5naWZ5KCRmb3JtLmZvcm0oXCJnZXREYXRhXCIpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkaXNhYmxlOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRmb3JtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dFtuYW1lXTpub3QoLmNvbWJvLXZhbHVlKTpub3QoW2Rpc2FibGVkX2ZpeGVkXSxbcmVhZG9ubHlfZml4ZWRdKVwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lXTpub3QoW2Rpc2FibGVkX2ZpeGVkXSxbcmVhZG9ubHlfZml4ZWRdKVwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dC5jb21iby1mOm5vdChbZGlzYWJsZWRfZml4ZWRdLFtyZWFkb25seV9maXhlZF0pXCIpLmNvbWJvKFwiZGlzYWJsZVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZW5hYmxlOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRmb3JtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dFtuYW1lXTpub3QoLmNvbWJvLXZhbHVlKTpub3QoW2Rpc2FibGVkX2ZpeGVkXSxbcmVhZG9ubHlfZml4ZWRdKVwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgICAgICAgICAkZm9ybS5maW5kKFwidGV4dGFyZWFbbmFtZV06bm90KFtkaXNhYmxlZF9maXhlZF0sW3JlYWRvbmx5X2ZpeGVkXSlcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgJGZvcm0uZmluZChcImlucHV0LmNvbWJvLWY6bm90KFtkaXNhYmxlZF9maXhlZF0sW3JlYWRvbmx5X2ZpeGVkXSlcIikuY29tYm8oXCJlbmFibGVcIik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlYWRvbmx5OiBmdW5jdGlvbiAoanEsIHJlYWRvbmx5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkZm9ybSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZWFkb25seSA9IHJlYWRvbmx5ID09IHVuZGVmaW5lZCA/IHRydWUgOiByZWFkb25seTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dFtuYW1lXTpub3QoLmNvbWJvLXZhbHVlKTpub3QoW2Rpc2FibGVkX2ZpeGVkXSxbcmVhZG9ubHlfZml4ZWRdKVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAuYXR0cihcInJlYWRvbmx5XCIsIHJlYWRvbmx5KTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lXTpub3QoW2Rpc2FibGVkX2ZpeGVkXSxbcmVhZG9ubHlfZml4ZWRdKVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAuYXR0cihcInJlYWRvbmx5XCIsIHJlYWRvbmx5KTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dC5jb21iby1mOm5vdChbZGlzYWJsZWRfZml4ZWRdLFtyZWFkb25seV9maXhlZF0pXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgIC5jb21ibyhcInJlYWRvbmx5XCIsIHJlYWRvbmx5KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZml0SGVpZ2h0OiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRmb3JtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmICgkZm9ybS5kYXRhKFwiZml0dGVkSGVpZ2h0XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCRmb3JtLmZpbmQoXCJ0YWJsZVwiKS5zaXplKCkgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICgkZm9ybS5jbG9zZXN0KFwiLnBhbmVsOmhpZGRlblwiKS5zaXplKCkgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciAkcGFuZWwgPSAkZm9ybS5jbG9zZXN0KFwiZGl2W3JlZ2lvbj0nbm9ydGgnXSwgZGl2W3JlZ2lvbj0nc291dGgnXVwiKTtcclxuICAgICAgICAgICAgICAgIGlmICgkcGFuZWwuc2l6ZSgpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkZGl2ID0gJChcIjxkaXYvPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAkZGl2LmFwcGVuZCgkcGFuZWwuY2hpbGRyZW4oKSkuYXBwZW5kVG8oJHBhbmVsKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gJGRpdi5oZWlnaHQoKSArIDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkcGFuZWwucGFuZWwoXCJvcHRpb25zXCIpLm5vaGVhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmICRwYW5lbC5wYW5lbChcIm9wdGlvbnNcIikudGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICs9IDI2O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkcGFuZWwucGFuZWwoXCJyZXNpemVcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICRwYW5lbC5jbG9zZXN0KFwiLmVhc3l1aS1sYXlvdXRcIikubGF5b3V0KFwicmVzaXplXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJGZvcm0uZGF0YShcImZpdHRlZEhlaWdodFwiLCB0cnVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXNldE9sZCA6ICQuZm4uZm9ybS5tZXRob2RzLnJlc2V0LFxyXG5cdFx0cmVzZXQ6IGZ1bmN0aW9uKGpxKXtcclxuXHRcdFx0cmV0dXJuIGpxLmVhY2goZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2YXIgdGFyZ2V0ID0gdGhpcztcclxuXHRcdFx0XHQvLyQuZm4uZm9ybS5tZXRob2RzLnJlc2V0T2xkKCQodGFyZ2V0KSk7XHJcblx0XHRcdFx0JCgnaW5wdXQsc2VsZWN0LHRleHRhcmVhJywgdGFyZ2V0KS5lYWNoKGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHR2YXIgJGpxID0gJCh0aGlzKSx0ID0gdGhpcy50eXBlLCB0YWcgPSB0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcclxuXHRcdFx0XHRcdGlmKHRoaXMuaGFzQXR0cmlidXRlKCd0ZXh0Ym94bmFtZScpKSB7XHJcblx0XHRcdFx0XHRcdHZhciBjbHMgPSAkanEuYXR0cignY2xhc3MnKSB8fCAnJztcclxuXHRcdFx0XHRcdFx0aWYoY2xzLmluZGV4T2YoJ2NvbWJvZ3JpZC1mJykgPiAtMSl7XHJcblx0XHRcdFx0XHRcdFx0JGpxLmNvbWJvZ3JpZCgncmVzZXQnKTtcclxuXHRcdFx0XHRcdFx0fWVsc2UgaWYoY2xzLmluZGV4T2YoJ2NvbWJvYm94LWYnKSA+IC0xKXtcclxuXHRcdFx0XHRcdFx0XHQkanEuY29tYm9ib3goJ3Jlc2V0Jyk7XHJcblx0XHRcdFx0XHRcdH1lbHNlIGlmKGNscy5pbmRleE9mKCd0ZXh0Ym94LWYnKSA+IC0xKXtcclxuXHRcdFx0XHRcdFx0XHQkanEudGV4dGJveCgncmVzZXQnKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fWVsc2UgaWYoJGpxLmhhc0NsYXNzKCd0ZXh0Ym94LXZhbHVlJykgfHwgJGpxLmhhc0NsYXNzKCd0ZXh0Ym94LXRleHQnKSl7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1lbHNlIGlmICh0ID09ICd0ZXh0JyB8fCB0ID09ICdoaWRkZW4nIHx8IHQgPT0gJ3Bhc3N3b3JkJyB8fCB0YWcgPT0gJ3RleHRhcmVhJyl7XHJcblx0XHRcdFx0XHRcdHRoaXMudmFsdWUgPSAnJztcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodCA9PSAnZmlsZScpe1xyXG5cdFx0XHRcdFx0XHR2YXIgZmlsZSA9ICQodGhpcyk7XHJcblx0XHRcdFx0XHRcdGlmICghZmlsZS5oYXNDbGFzcygndGV4dGJveC12YWx1ZScpKXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgbmV3ZmlsZSA9IGZpbGUuY2xvbmUoKS52YWwoJycpO1xyXG5cdFx0XHRcdFx0XHRcdG5ld2ZpbGUuaW5zZXJ0QWZ0ZXIoZmlsZSk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGZpbGUuZGF0YSgndmFsaWRhdGVib3gnKSl7XHJcblx0XHRcdFx0XHRcdFx0XHRmaWxlLnZhbGlkYXRlYm94KCdkZXN0cm95Jyk7XHJcblx0XHRcdFx0XHRcdFx0XHRuZXdmaWxlLnZhbGlkYXRlYm94KCk7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZpbGUucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpe1xyXG5cdFx0XHRcdFx0XHR0aGlzLmNoZWNrZWQgPSBmYWxzZTtcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGFnID09ICdzZWxlY3QnKXtcclxuXHRcdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEluZGV4ID0gLTE7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG4gICAgfSk7XHJcblxyXG4vLyAgICB2YXIgX2Zvcm0gPSAkLmZuLmZvcm07XHJcbi8vICAgICQuZm4uZm9ybSA9IGZ1bmN0aW9uKG9wdGlvbnMsIHBhcmFtKSB7XHJcbi8vICAgICAgdmFyIGlzTWV0aG9kID0gdHlwZW9mIG9wdGlvbnMgPT0gJ3N0cmluZycsdmFsO1xyXG4vLyAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpe1xyXG4vLyAgICAgICAgdmFyIHN0YXRlID0gJC5kYXRhKHRoaXMsJ2Zvcm0nKTtcclxuLy8gICAgICAgIGlmKHN0YXRlKSB7XHJcbi8vICAgICAgICAgIHZhbCA9IF9mb3JtLmNhbGwoJCh0aGlzKSxvcHRpb25zLHBhcmFtKTtcclxuLy8gICAgICAgIH1lbHNle1xyXG4vLyAgICAgICAgICAgJGpxID0gJCh0aGlzKTtcclxuLy8gICAgICAgICAgIHZhbCA9IF9mb3JtLmNhbGwoJGpxLG9wdGlvbnMscGFyYW0pO1xyXG4vLyAgICAgICAgICAgdmFyIGRhdGEgPSAkLmZuLmZvcm0ubWV0aG9kcy5nZXREYXRhKCRqcSk7XHJcbi8vICAgICAgICAgICAkLmRhdGEodGhpcywnb2xkRGF0YScsZGF0YSk7XHJcbi8vICAgICAgICB9XHJcbi8vICAgICAgfSk7XHJcbi8vICAgICAgaWYoaXNNZXRob2QpIHJldHVybiB2YWw7XHJcbi8vICAgICAgcmV0dXJuIHRoaXM7XHJcbi8vICAgIH1cclxuLy8gICAgJC5leHRlbmQodHJ1ZSwkLmZuLmZvcm0sX2Zvcm0pO1xyXG4gICAgXHJcbiAgICAvLyBpbml0IGZvcm1zXHJcbiAgICBmdW5jdGlvbiBpbml0Rm9ybXMoanEpIHtcclxuICAgICAgICAvLyBtYXJrIHRoZSBkaXNhYmxlZCBhbmQgcmVhZG9ubHkgZmllbGRzXHJcbiAgICAgICAgJChcImlucHV0W2Rpc2FibGVkXVwiLCBqcSkuYXR0cihcImRpc2FibGVkX2ZpeGVkXCIsIHRydWUpO1xyXG4gICAgICAgICQoXCJ0ZXh0YXJlYVtkaXNhYmxlZF1cIiwganEpLmF0dHIoXCJkaXNhYmxlZF9maXhlZFwiLCB0cnVlKTtcclxuICAgICAgICAkKFwiaW5wdXRbcmVhZG9ubHldXCIsIGpxKS5hdHRyKFwicmVhZG9ubHlfZml4ZWRcIiwgdHJ1ZSk7XHJcbiAgICAgICAgJChcInRleHRhcmVhW3JlYWRvbmx5XVwiLCBqcSkuYXR0cihcInJlYWRvbmx5X2ZpeGVkXCIsIHRydWUpO1xyXG4gICAgICAgIC8vIGFkZCB2YWxpZGF0ZWJveCBjbGFzcyBmb3IgcmVxdWlyZWQgaW5wdXRcclxuICAgICAgICAvLyAkKFwiaW5wdXRbcmVxdWlyZWRdOm5vdCguZWFzeXVpLXZhbGlkYXRlYm94KVwiLCBqcSkudmFsaWRhdGVib3goKTtcclxuICAgICAgICAvLyBhdXRvIGZvcm1hdCBmb3JtIGl0ZW1zIGludG8gY29sdW1uc1xyXG4gICAgICAgIGpxLmZpbHRlcihcIltjb2x1bW5zXVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICRmb3JtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyICRkaXYgPSAkKFwiPGRpdi8+XCIpLmluc2VydEJlZm9yZSgkZm9ybSk7XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW5zID0gJGZvcm0uYXR0cihcImNvbHVtbnNcIikgfHwgMztcclxuICAgICAgICAgICAgdmFyIHZlcnRpY2FsID0gKCRmb3JtLmF0dHIoXCJkaXJlY3Rpb25cIikgfHwgcGFnZUNvbnRleHRbJ2Zvcm1UYWJJbmRleERpcmVjdGlvbiddKSA9PSBcImRvd25cIjtcclxuICAgICAgICAgICAgLy8gJGZvcm0uZmluZChcInRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24gKGluZGV4LCB0ZXh0YXJlYSkge1xyXG4gICAgICAgICAgICAvLyAgICAgdmFyICR0ZXh0YXJlYSA9ICQodGV4dGFyZWEpO1xyXG4gICAgICAgICAgICAvLyAgICAgaWYgKCR0ZXh0YXJlYS5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgJHRleHRhcmVhLmF0dHIoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAvLyB9KTtcclxuICAgICAgICAgICAgdmFyICRpbnB1dHMgPSAkZm9ybS5jaGlsZHJlbihcIjpub3QoW3R5cGU9aGlkZGVuXSlcIik7XHJcbiAgICAgICAgICAgICRmb3JtLmRldGFjaCgpO1xyXG4gICAgICAgICAgICBpZiAodmVydGljYWwpIHtcclxuICAgICAgICAgICAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcigkaW5wdXRzLnNpemUoKSAvIGNvbHVtbnMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCRpbnB1dHMubGVuZ3RoICUgY29sdW1ucyA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dzKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgdmVydGljYWxJbnB1dHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm93czsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb2x1bW5zOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWxJbnB1dHMucHVzaCgkaW5wdXRzW2kgKyBqICogcm93c10pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICRpbnB1dHMgPSAkKHZlcnRpY2FsSW5wdXRzKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dFwiKS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgaW5wdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hdHRyKFwidGFiaW5kZXhcIiwgaW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciAkdGFibGUgPSAkKFwiPHRhYmxlLz5cIikuYXBwZW5kVG8oJGZvcm0pO1xyXG4gICAgICAgICAgICB2YXIgJHRyO1xyXG4gICAgICAgICAgICB2YXIgaW5kZXhJblJvdyA9IDA7XHJcbiAgICAgICAgICAgICRpbnB1dHMuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGlucHV0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGlucHV0ID0gJChpbnB1dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhJblJvdyA9PSAwIHx8IGluZGV4SW5Sb3cgPj0gY29sdW1ucykge1xyXG4gICAgICAgICAgICAgICAgICAgICR0ciA9ICQoXCI8dHIvPlwiKS5hcHBlbmRUbygkdGFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4SW5Sb3cgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciAkbmV4dCA9ICRpbnB1dC5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaTE4bktleSA9ICRpbnB1dC5hdHRyKFwibmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmICghaTE4bktleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGkxOG5LZXkgPSAkaW5wdXQuZmluZChcIltuYW1lXVwiKS5hdHRyKFwibmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghaTE4bktleSAmJiAkbmV4dC5oYXNDbGFzcyhcImNvbWJvXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaTE4bktleSA9ICRuZXh0LmZpbmQoXCJbbmFtZV1cIikuYXR0cihcIm5hbWVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWkxOG5LZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpMThuS2V5ID0gJGlucHV0LmF0dHIoXCJjb21ib25hbWVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWkxOG5LZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpMThuS2V5ID0gJGlucHV0LmZpbmQoXCJbY29tYm9uYW1lXVwiKS5hdHRyKFwiY29tYm9uYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gJGlucHV0LmF0dHIoXCJ0aXRsZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICRpbnB1dC5yZW1vdmVBdHRyKFwidGl0bGVcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJGlucHV0LmZpbmQoXCJbbmFtZV1cIikuYXR0cihcInRpdGxlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQuZmluZChcIltuYW1lXVwiKS5yZW1vdmVBdHRyKFwidGl0bGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGNvbHNwYW4gPSAkaW5wdXQuYXR0cihcImNvbHNwYW5cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbHNwYW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xzcGFuID0gJGlucHV0LmZpbmQoXCJbbmFtZV1cIikuYXR0cihcImNvbHNwYW5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSBmbXguZ2V0STE4blRpdGxlKCRmb3JtLmF0dHIoXCJpMThuUm9vdFwiKSwgaTE4bktleSwgdGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsID09IFwiTk9ORVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFiZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJGlucHV0LmF0dHIoXCJyZXF1aXJlZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAkaW5wdXQuZmluZChcIltyZXF1aXJlZF1cIikuc2l6ZSgpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IFwiPHNwYW4gc3R5bGU9J2NvbG9yOiByZWQ7Jz4qIDwvc3Bhbj5cIiArIGxhYmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkdHIuYXBwZW5kKFwiPHRkIGNsYXNzPSdmb3JtLWxhYmVsJyBhbGlnbj0ncmlnaHQnPiBcIiArIGxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI8L3RkPlwiKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRyLmFwcGVuZChcIjx0ZCBjbGFzcz0nZm9ybS1sYWJlbCcgLz5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgJHRkID0gJChcIjx0ZC8+XCIpLmFwcGVuZFRvKCR0cikuYXBwZW5kKCRpbnB1dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJG5leHQuaGFzQ2xhc3MoXCJjb21ib1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0ZC5hcHBlbmQoJG5leHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaW5kZXhJblJvdysrO1xyXG4gICAgICAgICAgICAgICAgaWYgKChjb2xzcGFuICYmICF2ZXJ0aWNhbCkgfHwgbGFiZWwgPT0gXCJOT05FXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29sc3BhbikgfHwgMTtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleEluUm93ICs9IGNvbHNwYW4gLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gPSBjb2xzcGFuICogMiAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsID09IFwiTk9ORVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHNwYW4rKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJHRkLmF0dHIoXCJjb2xzcGFuXCIsIGNvbHNwYW4pO1xyXG4gICAgICAgICAgICAgICAgICAgICRpbnB1dC5jc3MoXCJ3aWR0aFwiLCBcIjEwMCVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkZm9ybS5pbnNlcnRBZnRlcigkZGl2KTtcclxuICAgICAgICAgICAgJGRpdi5kZXRhY2goKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgICQoJC5wYXJzZXIpLm9uKFwib25CZWZvcmVcIixmdW5jdGlvbihlLGN0eCxmaW5kaW5ncyl7XHJcbiAgICAgIGluaXRGb3JtcyhmaW5kaW5ncy5mb3JtKTtcclxuICAgIH0pLm9uKFwib25Db21wbGV0ZVwiLGZ1bmN0aW9uKGUsY3R4LGZpbmRpbmdzKXtcclxuICAgICAgZmluZGluZ3MuZm9ybS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIGRhdGEgPSAkLmZuLmZvcm0ubWV0aG9kcy5nZXREYXRhKCQodGhpcykpO1xyXG4gICAgICAgICQuZGF0YSh0aGlzLCdvbGREYXRhJyxkYXRhKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxufSkoalF1ZXJ5LCBmbXgpOyIsIjsoZnVuY3Rpb24gKCQsZm14KSB7XHJcbiAgICAvKiogKioqKioqKiogbGlua2J1dHRvbnMgKioqKioqKioqICovXHJcbi8vICAgICQuZm4ubGlua2J1dHRvbi5fcGFyc2VPcHRpb25zID0gJC5mbi5saW5rYnV0dG9uLnBhcnNlT3B0aW9ucztcclxuLy8gICAgJC5mbi5saW5rYnV0dG9uLnBhcnNlT3B0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuLy8gICAgICAgIHZhciAkanEgPSAkKHRhcmdldCksIG9wdHMgPSAkLmZuLmxpbmtidXR0b24uX3BhcnNlT3B0aW9ucyh0YXJnZXQpO1xyXG4vLyAgICAgICAgdmFyIGNtZCA9IG9wdHNbJ2NvbW1hbmQnXSB8fCAkanEuYXR0cignY29tbWFuZCcpO1xyXG4vLyAgICAgICAgaWYgKGNtZCkge1xyXG4vLyAgICAgICAgICAgIG9wdHNbJ2NvbW1hbmQnXSA9IG5ldyBGdW5jdGlvbihjbWQpO1xyXG4vLyAgICAgICAgfVxyXG4vLyAgICAgICAgcmV0dXJuIG9wdHM7XHJcbi8vICAgIH1cclxuICAgICQuZXh0ZW5kKCQuZm4ubGlua2J1dHRvbi5tZXRob2RzLCB7XHJcbiAgICAgICAgZm9yY2VEaXNhYmxlOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRsaW5rYnV0dG9uID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICRsaW5rYnV0dG9uLmRhdGEoXCJmb3JjZURpc2FibGVcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAkbGlua2J1dHRvbi5saW5rYnV0dG9uKFwiZGlzYWJsZVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2VuYWJsZTogJC5mbi5saW5rYnV0dG9uLm1ldGhvZHMuZW5hYmxlLFxyXG5cclxuICAgICAgICBlbmFibGU6IGZ1bmN0aW9uIChqcSkge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGxpbmtidXR0b24gPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkbGlua2J1dHRvbi5kYXRhKFwiZm9yY2VEaXNhYmxlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGxpbmtidXR0b24ubGlua2J1dHRvbihcIl9lbmFibGVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGluaXQgbGlua2J1dHRvbnNcclxuICAgIGZ1bmN0aW9uIGluaXRMaW5rYnV0dG9ucyhqcSkge1xyXG4gICAgICAgIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJGxpbmtidXR0b24gPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgY29kZSA9ICRsaW5rYnV0dG9uLmF0dHIoXCJjb2RlXCIpO1xyXG4gICAgICAgICAgICBpZiAoY29kZSAmJiAhZm14LmNoZWNrRnVuY3Rpb25BdXRob3JpemF0aW9uKGNvZGUpKSB7XHJcbiAgICAgICAgICAgIFx0aWYoJGxpbmtidXR0b24uYXR0cignaGlkZU5vUGVybWlzc2lvbicpKXtcclxuICAgICAgICAgICAgXHRcdCRsaW5rYnV0dG9uLmRldGFjaCgpO1xyXG4gICAgICAgICAgICBcdH1lbHNle1xyXG4gICAgICAgICAgICBcdFx0JGxpbmtidXR0b24ubGlua2J1dHRvbihcImZvcmNlRGlzYWJsZVwiKTtcclxuICAgICAgICAgICAgXHR9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgICQoJC5wYXJzZXIpLm9uKFwib25Db21wbGV0ZVwiLGZ1bmN0aW9uKGUsY3R4LGZpbmRpbmdzKXtcclxuICAgICAgaW5pdExpbmtidXR0b25zKGZpbmRpbmdzLmxpbmtidXR0b24pO1xyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSxmbXgpOyIsIjsoZnVuY3Rpb24gKCQpIHtcclxuXHJcbiAgICAvKiogKioqKioqKiogbWVzc2FnZXIgKioqKioqKioqICovXHJcbiAgICAkLmV4dGVuZCh0cnVlLCQubWVzc2FnZXIuZGVmYXVsdHMsIHtcclxuICAgICAgICB0b2FzdFRpbWVvdXQ6IDEwMDBcclxuICAgIH0pO1xyXG5cclxuICAgICQubWVzc2FnZXIudG9hc3QgPSBmdW5jdGlvbiAodGl0bGUsIG1zZywgaWNvbiwgZm4pIHtcclxuICAgICAgICB2YXIgJHdpbiA9ICQubWVzc2FnZXIuYWxlcnQodGl0bGUsIG1zZywgaWNvbiwgZm4pO1xyXG4gICAgICAgICR3aW4ucGFyZW50KCkuZmluZChcIi53aW5kb3ctaGVhZGVyXCIpLmhpZGUoKTtcclxuICAgICAgICAkd2luLmZpbmQoXCIubWVzc2FnZXItYnV0dG9uXCIpLmhpZGUoKTtcclxuICAgICAgICAkd2luLnBhcmVudCgpLm5leHQoKS5oZWlnaHQoJHdpbi5wYXJlbnQoKS5oZWlnaHQoKSArIDEyKTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHdpbi53aW5kb3coXCJjbG9zZVwiKTtcclxuICAgICAgICB9LCAkLm1lc3NhZ2VyLmRlZmF1bHRzLnRvYXN0VGltZW91dCk7XHJcbiAgICB9O1xyXG5cclxufSkoalF1ZXJ5KTsiLCI7KGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuICAgIC8qKiAqKioqKioqKiBudW1iZXJib3ggKioqKioqKioqICovXHJcbiAgICAkLmZuLl9udW1iZXJib3ggPSAkLmZuLm51bWJlcmJveDtcclxuXHJcbiAgICAkLmZuLm51bWJlcmJveCA9IGZ1bmN0aW9uIChvcHRpb25zLCBwYXJhbSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAkLmZuLl9udW1iZXJib3guYXBwbHkodGhpcywgW29wdGlvbnMsIHBhcmFtXSk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zICE9IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgJCh0YXJnZXQpLnVuYmluZChcImJsdXIubnVtYmVyYm94XCIpLmJpbmQoXCJibHVyLm51bWJlcmJveFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0YXJnZXQpLm51bWJlcmJveChcImZpeFwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcblxyXG4gICAgJC5mbi5udW1iZXJib3gubWV0aG9kcyA9ICQuZm4uX251bWJlcmJveC5tZXRob2RzO1xyXG4gICAgJC5mbi5udW1iZXJib3guZGVmYXVsdHMgPSAkLmZuLl9udW1iZXJib3guZGVmYXVsdHM7XHJcbiAgICAkLmZuLm51bWJlcmJveC5wYXJzZU9wdGlvbnMgPSAkLmZuLl9udW1iZXJib3gucGFyc2VPcHRpb25zO1xyXG5cclxuICAgICQuZXh0ZW5kKCQuZm4ubnVtYmVyYm94Lm1ldGhvZHMsIHtcclxuICAgICAgICBfZml4OiAkLmZuLm51bWJlcmJveC5tZXRob2RzLmZpeCxcclxuXHJcbiAgICAgICAgZml4OiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRudW1iZXJib3ggPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgJG51bWJlcmJveC52YWwoJG51bWJlcmJveC5udW1iZXJib3goXCJnZXRWYWx1ZVwiKSk7XHJcbiAgICAgICAgICAgICAgICAkbnVtYmVyYm94Lm51bWJlcmJveChcIl9maXhcIik7XHJcbiAgICAgICAgICAgICAgICAkbnVtYmVyYm94Lm51bWJlcmJveChcInNldFZhbHVlXCIsICRudW1iZXJib3gubnVtYmVyYm94KFwiZ2V0VmFsdWVcIikpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Ly8sXHJcblxyXG4vLyAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uIChqcSkge1xyXG4vLyAgICAgICAgICAgIHZhciAkbnVtYmVyYm94ID0gJChqcVswXSk7XHJcbi8vICAgICAgICAgICAgdmFyIGZvcm1hdCA9ICQuZGF0YShqcVswXSwgXCJudW1iZXJib3hcIikub3B0aW9ucy5mb3JtYXQ7XHJcbi8vICAgICAgICAgICAgdmFyIHZhbHVlID0gJG51bWJlcmJveC52YWwoKTtcclxuLy8gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XHJcbi8vICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuLy8gICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgaWYgKGZvcm1hdCkge1xyXG4vLyAgICAgICAgICAgICAgICB2YWx1ZSA9ICQucGFyc2VOdW1iZXIodmFsdWUsIHtcclxuLy8gICAgICAgICAgICAgICAgICAgIGZvcm1hdDogZm9ybWF0XHJcbi8vICAgICAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgICAgIH1cclxuLy8gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbi8vICAgICAgICB9LFxyXG4vL1xyXG4vLyAgICAgICAgc2V0VmFsdWU6IGZ1bmN0aW9uIChqcSwgdmFsdWUpIHtcclxuLy8gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbi8vICAgICAgICAgICAgICAgIHZhciAkbnVtYmVyYm94ID0gJCh0aGlzKTtcclxuLy8gICAgICAgICAgICAgICAgdmFyIGZvcm1hdCA9ICQuZGF0YSh0aGlzLCBcIm51bWJlcmJveFwiKS5vcHRpb25zLmZvcm1hdDtcclxuLy8gICAgICAgICAgICAgICAgaWYgKGZvcm1hdCAmJiAodmFsdWUgfHwgdmFsdWUgPT09IDApKSB7XHJcbi8vICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICQuZm9ybWF0TnVtYmVyKHZhbHVlLCB7XHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBmb3JtYXRcclxuLy8gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgICAgICRudW1iZXJib3gudmFsKHZhbHVlKTtcclxuLy8gICAgICAgICAgICB9KTtcclxuLy8gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXROdW1iZXJib3hlcyhqcUlucHV0LCBqcVRoKSB7XHJcbiAgICAgICAganFJbnB1dC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICRudW1iZXJib3ggPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZGF0YSh0aGlzLCBcIm51bWJlcmJveFwiKS5vcHRpb25zO1xyXG4gICAgICAgICAgICAkLmV4dGVuZChvcHRpb25zLCB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICRudW1iZXJib3guYXR0cihcImZvcm1hdFwiKSA/ICRudW1iZXJib3guYXR0cihcImZvcm1hdFwiKSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBwcmVjaXNpb246ICRudW1iZXJib3guYXR0cihcImZvcm1hdFwiKSA/IDEwIDogb3B0aW9ucy5wcmVjaXNpb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8ganFUaC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyAgICAgdmFyICR0aCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gICAgIHZhciAkZGF0YWdyaWQgPSAkdGguY2xvc2VzdChcInRhYmxlXCIpO1xyXG4gICAgICAgIC8vICAgICB2YXIgY29sdW1uT3B0aW9uID0gJGRhdGFncmlkLmRhdGFncmlkKFwiZ2V0Q29sdW1uT3B0aW9uXCIsICR0aC5hdHRyKFwiZmllbGRcIikpO1xyXG4gICAgICAgIC8vICAgICB2YXIgb3B0aW9ucyA9IGNvbHVtbk9wdGlvbi5lZGl0b3Iub3B0aW9ucyB8fCB7fTtcclxuICAgICAgICAvLyAgICAgJC5leHRlbmQob3B0aW9ucywge1xyXG4gICAgICAgIC8vICAgICAgICAgZm9ybWF0OiAkdGguYXR0cihcImZvcm1hdFwiKSA/ICR0aC5hdHRyKFwiZm9ybWF0XCIpIDogb3B0aW9ucy5mb3JtYXQsXHJcbiAgICAgICAgLy8gICAgICAgICBwcmVjaXNpb246ICR0aC5hdHRyKFwiZm9ybWF0XCIpIHx8IG9wdGlvbnMuZm9ybWF0ID8gMTBcclxuICAgICAgICAvLyAgICAgICAgICAgICA6IG9wdGlvbnMucHJlY2lzaW9uXHJcbiAgICAgICAgLy8gICAgIH0pO1xyXG4gICAgICAgIC8vICAgICBjb2x1bW5PcHRpb24uZWRpdG9yID0ge1xyXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogXCJudW1iZXJib3hcIixcclxuICAgICAgICAvLyAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnNcclxuICAgICAgICAvLyAgICAgfTtcclxuICAgICAgICAvLyB9KTtcclxuICAgIH1cclxuICAgICQoJC5wYXJzZXIpLm9uKFwib25Db21wbGV0ZVwiLGZ1bmN0aW9uKGUsY3R4LGZpbmRpbmdzKXtcclxuICAgICAgaW5pdE51bWJlcmJveGVzKGZpbmRpbmdzLm51bWJlcmJveCk7XHJcbiAgICB9KTsgICAgXHJcbn0pKGpRdWVyeSwgZm14KSIsIjsoZnVuY3Rpb24gKCQpIHtcclxuICAgIC8qKiAqKioqKioqKiBwYW5lbHMgKioqKioqKioqICovXHJcbiAgICAkLmV4dGVuZCgkLmZuLnBhbmVsLmRlZmF1bHRzLCB7XHJcbiAgICAgICAgcmVMb2dpbk1zZzogXCJTZXNzaW9uIHRpbWVvdXQuIFBsZWFzZSByZS1sb2dpbiBhbmQgdHJ5IGFnYWluLlwiLFxyXG4gICAgICAgIHNldERlZmF1bHRDb250ZXh0RXJyb3JNc2c6IFwiSlF1ZXJ5IHNlbGVjdG9ycyBkZXRlY3RlZCBpbiB0aGUgcGFnZS4gQnV0IGRlZmF1bHQgY29udGV4dCBjYW4ndCBiZSBzZXQgYXV0b21hdGljYWxseSBjYXVzZSAnJChmdW5jdGlvbigpey4uLn0pJyBjYW4ndCBiZSBsb2NhdGVkLiBQbGVhc2UgZml4IHRoZSBwYWdlIHNvdXJjZSBjb2RlIVwiLFxyXG5cclxuICAgICAgICBleHRyYWN0b3I6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmICgvPCEtLUxvZ2luUGFnZS0tPi9pbS5leGVjKGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAkLm1lc3NhZ2VyLmNvbmZpcm0oXCJNZXNzYWdlXCIsICQuZm4ucGFuZWwuZGVmYXVsdHMucmVMb2dpbk1zZyxcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgaW5kZXgxID0gZGF0YS5pbmRleE9mKFwiJChmdW5jdGlvbihcIik7XHJcbiAgICAgICAgICAgIGlmIChpbmRleDEgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaW5kZXgyID0gZGF0YS5pbmRleE9mKFwie1wiLCBpbmRleDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4MiA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRleHRpZCA9ICQubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKFwiX2NvbnRleHRpZFwiLCBjb250ZXh0aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhLnN1YnN0cmluZygwLCBpbmRleDEpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gXCJ2YXIgX19vbkxvYWQgPSAkKCdbX2NvbnRleHRpZD1cIiArIGNvbnRleHRpZCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFwiXScpLnBhbmVsKCdvcHRpb25zJykub25Mb2FkO1xcblwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCIoJCgnW19jb250ZXh0aWQ9XCIgKyBjb250ZXh0aWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIl0nKS5wYW5lbCgnb3B0aW9ucycpLm9uTG9hZEFzeW5jID0gXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBkYXRhLnN1YnN0cmluZyhpbmRleDEgKyAyLCBpbmRleDIgKyAxKSArIFwiXFxuXFxuXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcInZhciBfcGFnZUNvbnRleHQgPSBqUXVlcnkoJ1tfY29udGV4dGlkPVwiICsgY29udGV4dGlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJdJyk7XFxuXCIgKyBcInZhciAkID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcXG5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiXHRpZiAoY29udGV4dCkge1xcblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcdFx0cmV0dXJuIGpRdWVyeShzZWxlY3RvciwgY29udGV4dCk7XFxuXCIgKyBcIlx0fSBlbHNlIHtcXG5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiXHRcdHJldHVybiBqUXVlcnkoc2VsZWN0b3IsIF9wYWdlQ29udGV4dCk7XFxuXCIgKyBcIlx0fVxcblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJ9O1xcblwiICsgXCJqUXVlcnkuZXh0ZW5kKCQsIGpRdWVyeSk7XFxuXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIlBSRVZFTlRfUkVJTklUX1BMVUdJTlMgPSB0cnVlO1xcblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xcblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcdFBSRVZFTlRfUkVJTklUX1BMVUdJTlMgPSBmYWxzZTtcXG5cIiArIFwifSwgMCk7XFxuXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBcIl9fb25Mb2FkLmFwcGx5KHRoaXMpO1xcblwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5zdWJzdHJpbmcoaW5kZXgyICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGRhdGEuaW5kZXhPZihcIiQoXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgICQubWVzc2FnZXIuYWxlcnQoXCJNZXNzYWdlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJC5mbi5wYW5lbC5kZWZhdWx0cy5zZXREZWZhdWx0Q29udGV4dEVycm9yTXNnLCBcImVycm9yXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICQuZXh0ZW5kKCQuZm4ucGFuZWwubWV0aG9kcywge1xyXG4gICAgICAgIGxvYWRpbmc6IGZ1bmN0aW9uIChqcSkge1xyXG4gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgd3JhcCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZGF0YWdyaWQtbWFzayBwYW5lbCcgc3R5bGU9J3otaW5kZXg6IDEwMDAwOyc+PC9kaXY+XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IFwiYmxvY2tcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdyYXAud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB3cmFwLmhlaWdodCgpXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuYXBwZW5kVG8od3JhcCk7XHJcbiAgICAgICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZGF0YWdyaWQtbWFzay1tc2cgcGFuZWwnIHN0eWxlPSd6LWluZGV4OiAxMDAwMDsnPjwvZGl2PlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZE1zZykuYXBwZW5kVG8od3JhcClcclxuICAgICAgICAgICAgICAgICAgICAuY3NzKFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogXCJibG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAod3JhcC53aWR0aCgpIC0gJChcImRpdi5kYXRhZ3JpZC1tYXNrLW1zZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd3JhcCkub3V0ZXJXaWR0aCgpKSAvIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogKHdyYXAuaGVpZ2h0KCkgLSAkKFwiZGl2LmRhdGFncmlkLW1hc2stbXNnXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cmFwKS5vdXRlckhlaWdodCgpKSAvIDJcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbG9hZGVkOiBmdW5jdGlvbiAoanEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpxLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHdyYXAgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgd3JhcC5jaGlsZHJlbihcImRpdi5kYXRhZ3JpZC1tYXNrLW1zZ1wiKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHdyYXAuY2hpbGRyZW4oXCJkaXYuZGF0YWdyaWQtbWFza1wiKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSk7IiwiOyhmdW5jdGlvbiAoJCkge1xyXG4gICAgLyoqICoqKioqKioqIG1lbnUgKioqKioqKioqICovXHJcbi8vICAgICQuZXh0ZW5kKHRydWUsJC5mbi5tZW51LmRlZmF1bHRzLCB7XHJcbi8vICAgICAgICBvblNob3c6IGZ1bmN0aW9uICgpIHtcclxuLy8gICAgICAgICAgICB2YXIgJG1lbnUgPSAkKHRoaXMpO1xyXG4vLyAgICAgICAgICAgICRtZW51LmRhdGEoXCJvcmlnaW5hbFRvcFwiLCAkbWVudS5wb3NpdGlvbigpLnRvcCk7XHJcbi8vICAgICAgICAgICAgJG1lbnUubWVudShcImZpeFBvc2l0aW9uXCIpO1xyXG4vLyAgICAgICAgfVxyXG4vLyAgICB9KTtcclxuLy9cclxuLy8gICAgJC5leHRlbmQoJC5mbi5tZW51Lm1ldGhvZHMsIHtcclxuLy8gICAgICAgIGZpeFBvc2l0aW9uOiBmdW5jdGlvbiAoanEpIHtcclxuLy8gICAgICAgICAgICByZXR1cm4ganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbi8vICAgICAgICAgICAgICAgIHZhciAkbWVudSA9ICQodGhpcyk7XHJcbi8vICAgICAgICAgICAgICAgIGlmICgkbWVudS5wb3NpdGlvbigpLnRvcCArICRtZW51Lm91dGVySGVpZ2h0KCkgPiAkKFwiYm9keVwiKVxyXG4vLyAgICAgICAgICAgICAgICAgICAgLmhlaWdodCgpIC0gNSkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9ICRtZW51LmRhdGEoXCJvcmlnaW5hbFRvcFwiKSAtICRtZW51Lm91dGVySGVpZ2h0KClcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICAtIDI7XHJcbi8vICAgICAgICAgICAgICAgICAgICBpZiAodG9wIDwgMCkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9ICQoXCJib2R5XCIpLmhlaWdodCgpIC0gJG1lbnUub3V0ZXJIZWlnaHQoKSAtIDU7XHJcbi8vICAgICAgICAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgICAgICAgICAkbWVudS5jc3MoXCJ0b3BcIiwgdG9wICsgXCJweFwiKTtcclxuLy8gICAgICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgfVxyXG4vLyAgICB9KTtcclxufSkoalF1ZXJ5KTsiLCI7KGZ1bmN0aW9uICgkLCBmbXgpIHtcclxuXHJcbiAgICAvKiogKioqKioqKiogd2luZG93ICYgZGlhbG9nICoqKioqKioqKiAqL1xyXG4gICAgJC5leHRlbmQoJC5mbi53aW5kb3cuZGVmYXVsdHMsIHtcclxuICAgICAgICBpbmxpbmU6IHRydWUsXHJcbiAgICAgICAgbW9kYWwgOiB0cnVlLFxyXG4gICAgICAgIG9uT3BlbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHdpbmRvdyA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICR3aW5kb3cud2luZG93KFwicmVzaXplXCIpO1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSAkd2luZG93LnBhcmVudCgpLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkd2luZG93LnBhcmVudCgpLm9mZnNldCgpO1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9ICh3aW5kb3cuZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCAtICR3aW5kb3cucGFyZW50KCkub3V0ZXJXaWR0aCgpKSAvIDI7XHJcbiAgICAgICAgICAgIHZhciB0b3AgPSAod2luZG93LmRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0IC0gJHdpbmRvdy5wYXJlbnQoKS5vdXRlckhlaWdodCgpKSAvIDI7XHJcbiAgICAgICAgICAgICR3aW5kb3cud2luZG93KFwibW92ZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBwb3NpdGlvbi5sZWZ0IC0gKG9mZnNldC5sZWZ0IC0gbGVmdCksXHJcbiAgICAgICAgICAgICAgICB0b3A6IHBvc2l0aW9uLnRvcCAtIChvZmZzZXQudG9wIC0gdG9wKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJHdpbmRvdy5kYXRhKFwicHJlRm9jdXNcIiwgJChcIio6Zm9jdXNcIikpO1xyXG4gICAgICAgICAgICAkd2luZG93LmZpbmQoXCJhXCIpLnVuYmluZChcImtleWRvd25cIikuYmluZChcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIDEzOlJldHVybjsgMzI6U3BhY2U7IDI3OkVzYztcclxuICAgICAgICAgICAgICAgIGlmIChlLmtleUNvZGUgPT0gMTMgfHwgZS5rZXlDb2RlID09IDMyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAyNykge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY2xvc2VzdChcIi53aW5kb3dcIikuZmluZChcIi5wYW5lbC10b29sLWNsb3NlXCIpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJHdpbmRvdy5maW5kKFwiYTpmaXJzdFwiKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAkd2luZG93LmZpbmQoXCJpbnB1dDp2aXNpYmxlOmVuYWJsZWQ6Zmlyc3RcIikuZm9jdXMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvbkJlZm9yZUNsb3NlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkd2luZG93ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZGF0YShcInByZUZvY3VzXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAkd2luZG93LmRhdGEoXCJwcmVGb2N1c1wiKS5mb2N1cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb25Nb3ZlOiBmdW5jdGlvbiAobGVmdCwgdG9wKSB7XHJcbiAgICAgICAgICAgIHZhciAkd2luZG93ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9ICR3aW5kb3cucGFyZW50KCkub2Zmc2V0KCk7XHJcbiAgICAgICAgICAgIGlmIChvZmZzZXQubGVmdCA8IDAgfHwgb2Zmc2V0LnRvcCA8IDApIHtcclxuICAgICAgICAgICAgICAgICR3aW5kb3cud2luZG93KFwibW92ZVwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdCAtIE1hdGgubWluKG9mZnNldC5sZWZ0LCAwKSxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCAtIE1hdGgubWluKG9mZnNldC50b3AsIDApXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICQuZXh0ZW5kKCQuZm4uZGlhbG9nLmRlZmF1bHRzLCB7XHJcbiAgICAgICAgaW5saW5lOiB0cnVlLFxyXG4gICAgICAgIG9uT3BlbjogJC5mbi53aW5kb3cuZGVmYXVsdHMub25PcGVuLFxyXG4gICAgICAgIG9uQmVmb3JlQ2xvc2U6ICQuZm4ud2luZG93LmRlZmF1bHRzLm9uQmVmb3JlQ2xvc2UsXHJcbiAgICAgICAgb25Nb3ZlOiAkLmZuLndpbmRvdy5kZWZhdWx0cy5vbk1vdmVcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXREaWFsb2dzKGpxKSB7XHJcbiAgICAgICAganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkZGlhbG9nID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyICRjb250ZW50ID0gJGRpYWxvZy5jaGlsZHJlbigpLmNoaWxkcmVuKCk7XHJcbiAgICAgICAgICAgICRjb250ZW50LmNoaWxkcmVuKFwiLmRpYWxvZy1idXR0b25zXCIpLmFkZENsYXNzKFwiZGlhbG9nLWJ1dHRvblwiKS5hcHBlbmRUbygkZGlhbG9nKTtcclxuICAgICAgICAgICAgJGNvbnRlbnQuY2hpbGRyZW4oXCIuZGlhbG9nLXRvb2xiYXJzXCIpLmFkZENsYXNzKFwiZGlhbG9nLXRvb2xiYXJcIikucHJlcGVuZFRvKCRkaWFsb2cpO1xyXG4gICAgICAgICAgICAkY29udGVudC5jaGlsZHJlbihcIi5kaWFsb2ctYnV0dG9uXCIpLmFwcGVuZFRvKCRkaWFsb2cpO1xyXG4gICAgICAgICAgICAkY29udGVudC5jaGlsZHJlbihcIi5kaWFsb2ctdG9vbGJhclwiKS5wcmVwZW5kVG8oJGRpYWxvZyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAkKCQucGFyc2VyKS5vbignb25Db21wbGV0ZScsZnVuY3Rpb24oZSxjdHgsZmluZGluZ3Mpe1xyXG4gICAgICBpbml0RGlhbG9ncyhmaW5kaW5ncy5kaWFsb2cpO1xyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSwgZm14KTsiLCIvKipcclxuICogcmVwb3J0IC0galF1ZXJ5IEVhc3lVSVxyXG4gKiBcclxuICogRGVwZW5kZW5jaWVzOlxyXG4gKiAgIHBhZ2luYXRpb24gXHJcbiAqIFxyXG4gKi9cclxuOyAoZnVuY3Rpb24gKCQsIGZteCkge1xyXG4gICAgdmFyIGh0bWxVcmwgPSAkdXJsKCcvcmVzdC9yZXBvcnRSZXN0L3Nob3dIdG1sUmVwb3J0Lmpzb24nKSxcclxuICAgICAgICBleHBvcnRVcmwgPSAkdXJsKCcvcmVzdC9yZXBvcnRSZXN0L2V4cG9ydFJlcG9ydC5qc29uJyksXHJcbiAgICAgICAgcHJpbnRVcmwgPSAkdXJsKCcvcmVzdC9yZXBvcnRSZXN0L3ByaW50UmVwb3J0Lmpzb24nKTtcclxuICAgIGZ1bmN0aW9uIEJ1dHRvbnMoJGpxLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIGJ1dHRvbnMgPSBbe1xyXG4gICAgICAgICAgICBpY29uQ2xzOiAnaWNvbi1zZWFyY2gnLFxyXG4gICAgICAgICAgICB0ZXh0OiBcIuafpeivolwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnlQYXJhbSA9IGdldFJlcG9ydFBhcmFtKG9wdGlvbnMucGFyYW1Gb3JtKTtcclxuICAgICAgICAgICAgICAgIGlmKHF1ZXJ5UGFyYW0gPT0gZmFsc2UpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlTm8gPSBvcHRpb25zLnBhZ2luYXRpb24ucGFnaW5hdGlvbignb3B0aW9ucycpLnBhZ2VOdW1iZXI7XHJcbiAgICAgICAgICAgICAgICBzaG93TG9hZGluZyhvcHRpb25zLCB0cnVlLHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbVsncGFnZU5vJ10gPSBwYWdlTm87XHJcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtWydyZXBvcnRJZCddID0gb3B0aW9ucy5yZXBvcnRJZDtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1bJ3JwdENvZGUnXSA9IG9wdGlvbnMucnB0Q29kZTtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZm9ybS5mb3JtKCdzdWJtaXQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlQYXJhbXM6IHF1ZXJ5UGFyYW0sXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBodG1sVXJsLFxyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNEb3dubG9hZDpmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBhamF4OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChodG1sLCByZXNwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXHRzaG93TG9hZGluZyhvcHRpb25zLGZhbHNlLHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcCAmJiAkLmlzRnVuY3Rpb24ocmVzcFsnZ2V0UmVzcG9uc2VIZWFkZXInXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3RhbCA9IHBhcnNlSW50KHJlc3AuZ2V0UmVzcG9uc2VIZWFkZXIoJ3RvdGFsLXBhZ2UnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG90YWwgJiYgdG90YWwgIT0gb3B0aW9ucy5wYWdpbmF0aW9uLnBhZ2luYXRpb24oJ29wdGlvbnMnKS50b3RhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGFnaW5hdGlvbi5wYWdpbmF0aW9uKCdyZWZyZXNoJywgeyB0b3RhbDogdG90YWwgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1JlcG9ydENvbnRlbnQoaHRtbCxvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgaWNvbkNsczogJ2ljb24tc2F2ZScsXHJcbiAgICAgICAgICAgIHRleHQ6IFwi5a+85Ye65b2T5YmN6aG1XCIsXHJcbiAgICAgICAgICAgIG1lbnU6IDEsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpZighaXRlbSB8fCAhaXRlbS5uYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICAkLm1lc3NhZ2VyLmFsZXJ0KFwi5o+Q56S6XCIsIFwidW5rbm93IGV4cG9ydCB0eXBl77yBXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBwYWdlTm8gPSBvcHRpb25zLnBhZ2luYXRpb24ucGFnaW5hdGlvbignb3B0aW9ucycpLnBhZ2VOdW1iZXI7XHJcbiAgICAgICAgICAgICAgICBleHBvcnRSZXBvcnQob3B0aW9ucy5mb3JtLG9wdGlvbnMucGFyYW1Gb3JtLHtcclxuICAgICAgICAgICAgICAgIFx0ZXhwb3J0VHlwZSA6IGl0ZW0ubmFtZSxcclxuICAgICAgICAgICAgICAgIFx0cmVwb3J0SWQgOiBvcHRpb25zLnJlcG9ydElkLFxyXG4gICAgICAgICAgICAgICAgXHRycHRDb2RlIDogb3B0aW9ucy5ycHRDb2RlLFxyXG4gICAgICAgICAgICAgICAgXHRzdGFydFBhZ2VObyA6IHBhZ2VObyxcclxuICAgICAgICAgICAgICAgIFx0ZW5kUGFnZU5vIDogcGFnZU5vLFxyXG4gICAgICAgICAgICAgICAgXHRleHBvcnRQYXJhbSA6IGdldEV4cG9ydFBhcmFtKG9wdGlvbnMsaXRlbS5uYW1lKSxcclxuICAgICAgICAgICAgICAgIFx0c3VjY2VzcyA6IGZ1bmN0aW9uIChyZXN1bHQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChyZXN1bHQpID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLm1lc3NhZ2VyLmFsZXJ0KFwi5o+Q56S6XCIsIHJlc3VsdC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcdFx0XHJcbiAgICAgICAgICAgICAgICBcdH1cclxuICAgICAgICAgICAgICAgIH0pOyAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIGljb25DbHM6ICdpY29uLXNhdmUnLFxyXG4gICAgICAgICAgICBtZW51OiAyLFxyXG4gICAgICAgICAgICB0ZXh0OiBcIuWvvOWHuuWFqOmDqFwiLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaWYoIWl0ZW0gfHwgIWl0ZW0ubmFtZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5tZXNzYWdlci5hbGVydChcIuaPkOekulwiLCBcInVua25vdyBleHBvcnQgdHlwZe+8gVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBleHBvcnRSZXBvcnQob3B0aW9ucy5mb3JtLG9wdGlvbnMucGFyYW1Gb3JtLHtcclxuICAgICAgICAgICAgICAgIFx0ZXhwb3J0VHlwZSA6IGl0ZW0ubmFtZSxcclxuICAgICAgICAgICAgICAgIFx0cmVwb3J0SWQgOiBvcHRpb25zLnJlcG9ydElkLFxyXG4gICAgICAgICAgICAgICAgXHRycHRDb2RlIDogb3B0aW9ucy5ycHRDb2RlLFxyXG4gICAgICAgICAgICAgICAgXHRleHBvcnRQYXJhbSA6IGdldEV4cG9ydFBhcmFtKG9wdGlvbnMsaXRlbS5uYW1lKSxcclxuICAgICAgICAgICAgICAgIFx0c3VjY2VzcyA6IGZ1bmN0aW9uIChyZXN1bHQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChyZXN1bHQpID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLm1lc3NhZ2VyLmFsZXJ0KFwi5o+Q56S6XCIsIHJlc3VsdC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcdFx0XHJcbiAgICAgICAgICAgICAgICBcdH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBpY29uQ2xzOiAnaWNvbi1wcmludCcsXHJcbiAgICAgICAgICAgIHRleHQ6IFwi5omT5Y2w5b2T5YmN6aG1XCIsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgXHRzaG93TG9hZGluZyhvcHRpb25zLHRydWUpO1xyXG4gICAgICAgICAgICBcdHZhciBwYWdlTm8gPSBvcHRpb25zLnBhZ2luYXRpb24ucGFnaW5hdGlvbignb3B0aW9ucycpLnBhZ2VOdW1iZXI7XHJcbiAgICAgICAgICAgIFx0cHJpbnRSZXBvcnQob3B0aW9ucy5mb3JtLG9wdGlvbnMucGFyYW1Gb3JtLHtcclxuICAgICAgICAgICAgXHRcdHJlcG9ydElkIDogb3B0aW9ucy5yZXBvcnRJZCxcclxuICAgICAgICAgICAgXHRcdHJwdENvZGUgOiBvcHRpb25zLnJwdENvZGUsXHJcbiAgICAgICAgICAgIFx0XHRwcmludFBhcmFtIDogZ2V0UHJpbnRQYXJhbShvcHRpb25zKSxcclxuICAgICAgICAgICAgICAgIFx0c3RhcnRQYWdlTm8gOiBwYWdlTm8sXHJcbiAgICAgICAgICAgICAgICBcdGVuZFBhZ2VObyA6IHBhZ2VObyxcclxuICAgICAgICAgICAgXHRcdHN1Y2Nlc3MgOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgXHRcdFx0c2hvd0xvYWRpbmcob3B0aW9ucyxmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5jb2RlID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQubWVzc2FnZXIuYWxlcnQoXCLmj5DnpLpcIiwgXCLlkI7lj7Dlt7LmiJDlip/lj5HpgIHmiZPljbDku7vliqHvvIFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0Lm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQubWVzc2FnZXIuYWxlcnQoXCLmj5DnpLpcIiwgcmVzdWx0Lm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgXHRcdFx0XHJcbiAgICAgICAgICAgIFx0XHR9XHJcbiAgICAgICAgICAgIFx0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIGljb25DbHM6ICdpY29uLXByaW50JyxcclxuICAgICAgICAgICAgdGV4dDogXCLmiZPljbDlhajpg6hcIixcclxuICAgICAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBcdHNob3dMb2FkaW5nKG9wdGlvbnMsdHJ1ZSk7XHJcbiAgICAgICAgICAgIFx0cHJpbnRSZXBvcnQob3B0aW9ucy5mb3JtLG9wdGlvbnMucGFyYW1Gb3JtLHtcclxuICAgICAgICAgICAgXHRcdHJlcG9ydElkIDogb3B0aW9ucy5yZXBvcnRJZCxcclxuICAgICAgICAgICAgXHRcdHJwdENvZGUgOiBvcHRpb25zLnJwdENvZGUsXHJcbiAgICAgICAgICAgIFx0XHRwcmludFBhcmFtIDogZ2V0UHJpbnRQYXJhbShvcHRpb25zKSxcclxuICAgICAgICAgICAgXHRcdHN1Y2Nlc3MgOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgXHRcdFx0c2hvd0xvYWRpbmcob3B0aW9ucyxmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5jb2RlID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQubWVzc2FnZXIuYWxlcnQoXCLmj5DnpLpcIiwgXCLlkI7lj7Dlt7LmiJDlip/lj5HpgIHmiZPljbDku7vliqHvvIFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0Lm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQubWVzc2FnZXIuYWxlcnQoXCLmj5DnpLpcIiwgcmVzdWx0Lm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgXHRcdFx0XHJcbiAgICAgICAgICAgIFx0XHR9XHJcbiAgICAgICAgICAgIFx0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XTtcclxuICAgICAgICByZXR1cm4gYnV0dG9ucztcclxuICAgIH1cclxuICAgIFxyXG4gICAgZnVuY3Rpb24gZXhwb3J0UmVwb3J0KGZvcm0scGFyYW1Gb3JtLHBhcmFtcykge1xyXG4gICAgICAgIHZhciBxdWVyeVBhcmFtID0gZ2V0UmVwb3J0UGFyYW0ocGFyYW1Gb3JtLHBhcmFtcy5yZXBvcnRQYXJhbSk7XHJcbiAgICAgICAgaWYocXVlcnlQYXJhbSA9PSBmYWxzZSkgcmV0dXJuO1xyXG4gICAgICAgIHF1ZXJ5UGFyYW1bJ2V4cG9ydFR5cGUnXSA9IHBhcmFtcy5leHBvcnRUeXBlO1xyXG4gICAgICAgIHF1ZXJ5UGFyYW1bJ3JlcG9ydElkJ10gPSBwYXJhbXMucmVwb3J0SWQ7XHJcbiAgICAgICAgcXVlcnlQYXJhbVsncnB0Q29kZSddID0gcGFyYW1zLnJwdENvZGU7XHJcbiAgICAgICAgcXVlcnlQYXJhbVsnZXhwb3J0UGFyYW0nXSA9IHBhcmFtcy5leHBvcnRQYXJhbTtcclxuICAgICAgICBpZihwYXJhbXMuc3RhcnRQYWdlTm8pe1xyXG4gICAgICAgIFx0cXVlcnlQYXJhbVsnc3RhcnRQYWdlTm8nXSA9IHBhcmFtcy5zdGFydFBhZ2VObztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYocGFyYW1zLmVuZFBhZ2VObyl7XHJcbiAgICAgICAgXHRxdWVyeVBhcmFtWydlbmRQYWdlTm8nXSA9IHBhcmFtcy5lbmRQYWdlTm87XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcm0uZm9ybSgnc3VibWl0Jywge1xyXG4gICAgICAgICAgICBxdWVyeVBhcmFtczogcXVlcnlQYXJhbSxcclxuICAgICAgICAgICAgdXJsOiBleHBvcnRVcmwsXHJcbiAgICAgICAgICAgIGlmcmFtZTogdHJ1ZSxcclxuICAgICAgICAgICAgaXNEb3dubG9hZDp0cnVlLFxyXG4gICAgICAgICAgICBhamF4OiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBwYXJhbXMuc3VjY2Vzc1xyXG4gICAgICAgIH0pOyAgICBcdCAgICBcdFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBwcmludFJlcG9ydChmb3JtLHBhcmFtRm9ybSxwYXJhbXMpIHtcclxuICAgICAgICB2YXIgcXVlcnlQYXJhbSA9IGdldFJlcG9ydFBhcmFtKHBhcmFtRm9ybSxwYXJhbXMucmVwb3J0UGFyYW0pO1xyXG4gICAgICAgIGlmKHF1ZXJ5UGFyYW0gPT0gZmFsc2UpIHJldHVybjtcclxuICAgICAgICBxdWVyeVBhcmFtWydyZXBvcnRJZCddID0gcGFyYW1zLnJlcG9ydElkO1xyXG4gICAgICAgIHF1ZXJ5UGFyYW1bJ3JwdENvZGUnXSA9IHBhcmFtcy5ycHRDb2RlO1xyXG4gICAgICAgIHF1ZXJ5UGFyYW1bJ3ByaW50UGFyYW0nXSA9IHBhcmFtcy5wcmludFBhcmFtO1xyXG4gICAgICAgIGlmKHBhcmFtcy5zdGFydFBhZ2VObyl7XHJcbiAgICAgICAgXHRxdWVyeVBhcmFtWydzdGFydFBhZ2VObyddID0gcGFyYW1zLnN0YXJ0UGFnZU5vO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihwYXJhbXMuZW5kUGFnZU5vKXtcclxuICAgICAgICBcdHF1ZXJ5UGFyYW1bJ2VuZFBhZ2VObyddID0gcGFyYW1zLmVuZFBhZ2VObztcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9ybS5mb3JtKCdzdWJtaXQnLCB7XHJcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zOiBxdWVyeVBhcmFtLFxyXG4gICAgICAgICAgICB1cmw6IHByaW50VXJsLFxyXG4gICAgICAgICAgICBpZnJhbWU6IGZhbHNlLFxyXG4gICAgICAgICAgICBpc0Rvd25sb2FkOmZhbHNlLFxyXG4gICAgICAgICAgICBhamF4OiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBwYXJhbXMuc3VjY2Vzc1xyXG4gICAgICAgIH0pOyAgICBcdFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBnZXRFeHBvcnRQYXJhbShvcHRzLGV4cG9ydFR5cGUpIHtcclxuICAgICAgICB2YXIgcGFyYW0gPSBvcHRzLmV4cG9ydFBhcmFtIHx8IHt9O1xyXG4gICAgICAgIGlmKG9wdHMub25FeHBvcnRQYXJhbSkge1xyXG4gICAgICAgICAgICBvcHRzLm9uRXhwb3J0UGFyYW0ocGFyYW0sZXhwb3J0VHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJhbSk7XHJcbiAgICB9ICAgIFxyXG4gICAgZnVuY3Rpb24gZ2V0UHJpbnRQYXJhbShvcHRzKSB7XHJcbiAgICAgICAgdmFyIHBhcmFtID0gb3B0cy5wcmludFBhcmFtIHx8IHt9O1xyXG4gICAgICAgIGlmKG9wdHMub25QcmludFBhcmFtKSB7XHJcbiAgICAgICAgICAgIG9wdHMub25QcmludFBhcmFtKHBhcmFtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBhcmFtKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldFJlcG9ydFBhcmFtKHBhcmFtRm9ybSxwYXJhbXMpIHtcclxuICAgICAgICB2YXIgcGFyYW0gPSB7fTtcclxuICAgICAgICBpZiAocGFyYW1Gb3JtKSB7XHJcbiAgICAgICAgICAgIHZhciAkZm9ybSA9IGZteC51dGlscy5nZXRKcXVlcnkocGFyYW1Gb3JtKTtcclxuICAgICAgICAgICAgaWYoISRmb3JtKXtcclxuICAgICAgICAgICAgXHQkLm1lc3NhZ2VyLmFsZXJ0KFwibWVzc2FnZVwiLFwidW5rb3cgc2VsZWN0b3LvvJpcIitwYXJhbUZvcm0pO1xyXG4gICAgICAgICAgICBcdHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZigkZm9ybS5mb3JtKCd2YWxpZGF0ZScpID09IGZhbHNlKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHBhcmFtLCAkZm9ybS5mb3JtKCdnZXREYXRhJykpO1xyXG4gICAgICAgICAgICAkLmV4dGVuZChwYXJhbSwgZ2V0UXVlcnlJbmZvcygkZm9ybSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihwYXJhbXMpe1xyXG4gICAgICAgIFx0JC5leHRlbmQocGFyYW0scGFyYW1zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJC5lYWNoKHBhcmFtLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHYpIHx8ICQuaXNBcnJheSh2KSkge1xyXG4gICAgICAgICAgICAgICAgcGFyYW1ba10gPSBKU09OLnN0cmluZ2lmeSh2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB7IHJlcG9ydFBhcmFtOiBKU09OLnN0cmluZ2lmeShwYXJhbSkgfTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldFF1ZXJ5SW5mb3MoJGZvcm0pIHtcclxuICAgICAgICB2YXIgcXVlcnlJbmZvcyA9IHt9O1xyXG4gICAgICAgICRmb3JtLmZpbmQoXCJpbnB1dFtxdWVyeUZpZWxkXSx0ZXh0YXJlYVtxdWVyeUZpZWxkXSxzZWxlY3RbcXVlcnlGaWVsZF1cIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkanEgPSAkKHRoaXMpLCBzdGF0ZSA9ICQuZGF0YSh0aGlzLCAnY29tYm8nKSB8fCAkLmRhdGEodGhpcywgJ3RleHRib3gnKTtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSAkanEuYXR0cigncXVlcnlGaWVsZCcpIHx8ICRqcS5hdHRyKCd0ZXh0Ym94bmFtZScpIHx8ICRqcS5hdHRyKCdjb21ib25hbWUnKSB8fCAkanEuYXR0cignbmFtZScpO1xyXG4gICAgICAgICAgICBpZiAoIW5hbWUpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IG51bGwsIG11bHRpcGxlID0gISEkanEuYXR0cignbXVsdGlwbGUnKTtcclxuICAgICAgICAgICAgaWYgKCFzdGF0ZSkgdmFsID0gJGpxLnZhbCgpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChtdWx0aXBsZSkge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gJGpxLmNvbWJvKFwiZ2V0VmFsdWVzXCIpLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHZhbCA9ICRqcS50ZXh0Ym94KFwiZ2V0VmFsdWVcIik7XHJcbiAgICAgICAgICAgIGlmICghdmFsIHx8IHZhbCA9PSAnJyB8fCB2YWwubGVuZ3RoID09IDApIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIGpyRmllbGQgPSAkanEuYXR0cignanJGaWVsZCcpIHx8ICdxdWVyeUZpZWxkcyc7XHJcbiAgICAgICAgICAgIHZhciBmaWVsZHMgPSBxdWVyeUluZm9zW2pyRmllbGRdIHx8IChxdWVyeUluZm9zW2pyRmllbGRdID0gW10pO1xyXG4gICAgICAgICAgICBmaWVsZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBmaWVsZE5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBmaWVsZFR5cGU6IG11bHRpcGxlID8gKCRqcS5hdHRyKCdkYXRhVHlwZScpIHx8IFwiU3RyaW5nW11cIikgOiAkanEuYXR0cignZGF0YVR5cGUnKSxcclxuICAgICAgICAgICAgICAgIGZpZWxkU3RyaW5nVmFsdWU6IHZhbCxcclxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiAkanEuYXR0cihcIm9wZXJhdG9yXCIpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBxdWVyeUluZm9zO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBzaG93TG9hZGluZyhvcHRzLGJMb2FkaW5nLGlzUXVlcnkpIHtcclxuICAgIFx0aWYoYkxvYWRpbmcpIHtcclxuICAgIFx0XHRvcHRzLnBhZ2luYXRpb24ucGFnaW5hdGlvbihcImxvYWRpbmdcIik7XHJcbiAgICBcdFx0b3B0cy5jb250YWluZXIubWFza2l0KCk7XHJcbiAgICBcdFx0aWYoaXNRdWVyeSkge1xyXG4gICAgXHRcdFx0dmFyICRqcSA9IG9wdHMudmlldy5wYXJlbnQoKTtcclxuICAgIFx0XHRcdGlmKCEkanEuY2hpbGRyZW4oJ2Rpdi5kYXRhZ3JpZC1tYXNrJykubGVuZ3RoKXtcclxuICAgIFx0XHRcdFx0JCgnPGRpdiBjbGFzcz1cImRhdGFncmlkLW1hc2tcIiBzdHlsZT1cImRpc3BsYXk6YmxvY2tcIj48L2Rpdj4nKS5hcHBlbmRUbygkanEpO1xyXG4gICAgXHRcdFx0XHR2YXIgbXNnID0gJCgnPGRpdiBjbGFzcz1cImRhdGFncmlkLW1hc2stbXNnXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO2xlZnQ6NTAlXCI+PC9kaXY+JykuaHRtbChvcHRzLmxvYWRNc2cpLmFwcGVuZFRvKCRqcSk7XHJcblx0XHRcdFx0XHRtc2cuX291dGVySGVpZ2h0KDQwKTtcclxuXHRcdFx0XHRcdG1zZy5jc3Moe1xyXG5cdFx0XHRcdFx0XHRtYXJnaW5MZWZ0OiAoLW1zZy5vdXRlcldpZHRoKCkvMiksXHJcblx0XHRcdFx0XHRcdGxpbmVIZWlnaHQ6IChtc2cuaGVpZ2h0KCkrJ3B4JylcclxuXHRcdFx0XHRcdH0pOyAgICBcdFx0XHRcdFxyXG4gICAgXHRcdFx0fVxyXG4gICAgXHRcdH1cclxuICAgIFx0fWVsc2V7XHJcbiAgICBcdFx0b3B0cy5wYWdpbmF0aW9uLnBhZ2luYXRpb24oXCJsb2FkZWRcIik7XHJcbiAgICBcdFx0b3B0cy5jb250YWluZXIubWFza2l0KCd1bm1hc2snKTtcclxuICAgIFx0XHRpZihpc1F1ZXJ5KSB7XHJcbiAgICBcdFx0XHR2YXIgJGpxID0gb3B0cy52aWV3LnBhcmVudCgpO1xyXG4gICAgXHRcdFx0JGpxLmNoaWxkcmVuKCdkaXYuZGF0YWdyaWQtbWFzay1tc2cnKS5yZW1vdmUoKTtcclxuICAgIFx0XHRcdCRqcS5jaGlsZHJlbignZGl2LmRhdGFncmlkLW1hc2snKS5yZW1vdmUoKTtcclxuICAgIFx0XHR9ICAgIFx0XHRcclxuICAgIFx0fVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkTWVudShidXR0b24sIG9wdHMpIHtcclxuICAgICAgICB2YXIgY3QgPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6MTIwcHg7ZGlzcGxheTpub25lXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgJC5lYWNoKG9wdHMuZXhwb3J0VHlwZXMsIGZ1bmN0aW9uIChpLCBpdGVtKSB7XHJcbiAgICAgICAgICAgIGN0LmFwcGVuZCgnPGRpdiBuYW1lPVwiJyArIGl0ZW0udHlwZSArICdcIj4nICsgaXRlbS50ZXh0ICsgJzwvZGl2PicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGN0LmF0dHIoJ2lkJywgJ2V4cG9ydE1lbnVfJyArIGJ1dHRvbi5tZW51KTtcclxuICAgICAgICBjdC5hcHBlbmRUbyhcImJvZHlcIik7XHJcbiAgICAgICAgcmV0dXJuIGN0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkQnV0dG9ucygkanEsIG9wdHMpIHtcclxuICAgICAgICB2YXIgY3QgPSAkKCc8ZGl2IHN0eWxlPVwicGFkZGluZzoycHggMDtmbG9hdDpsZWZ0O1wiPicpO1xyXG4gICAgICAgIHZhciBidXR0b25zID0gbmV3IEJ1dHRvbnMoJGpxLCBvcHRzKTtcclxuICAgICAgICAkLmVhY2goYnV0dG9ucywgZnVuY3Rpb24gKGksIGJ1dHRvbikge1xyXG4gICAgICAgICAgICB2YXIgJGJ0biA9ICQoJzxhIGhyZWY9XCIjXCI+PC9hPicpLnRleHQoYnV0dG9uLnRleHQpLmFwcGVuZFRvKGN0KTtcclxuICAgICAgICAgICAgaWYgKGJ1dHRvbi5kZWZhdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAkYnRuLmF0dHIoJ2RlZmF1bHQnLCBidXR0b24uZGVmYXVsdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGJ1dHRvbi5tZW51KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IGJ1aWxkTWVudShidXR0b24sIG9wdHMpLm1lbnUoeyBvbkNsaWNrOiBidXR0b24uaGFuZGxlciB9KTtcclxuICAgICAgICAgICAgICAgICRidG4ubWVudWJ1dHRvbih7IG1lbnU6ICcjJyArIG0uYXR0cignaWQnKSwgaWNvbkNsczogYnV0dG9uLmljb25DbHMgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkYnRuLmxpbmtidXR0b24oeyBpY29uQ2xzOiBidXR0b24uaWNvbkNscywgb25DbGljazogYnV0dG9uLmhhbmRsZXIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjdC5hcHBlbmRUbyhvcHRzLmNvbnRhaW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRGb3JtKCkge1xyXG4gICAgICAgIHJldHVybiAkKCc8Zm9ybT48L2Zvcm0+JykuZm9ybSh7IGlmcmFtZTogZmFsc2UgfSkuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZFJlcG9ydFZpZXcodGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gJ2JvZHknO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmNoYXJBdCgwKSAhPSAnIycpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gJyMnICsgdGFyZ2V0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdmlldyA9ICQoXCI8aWZyYW1lIHNjcm9sbGluZz0nYXV0bycgZnJhbWVib3JkZXI9JzAnIHN0eWxlPSd3aWR0aDoxMDAlO2hlaWdodDo5OSUnIG1hcmdpbndpZHRoPScwcHgnIG1hcmdpbmhlaWdodD0nMHB4JyA+PC9pZnJhbWU+XCIpO1xyXG4gICAgICAgIHZpZXcuYXBwZW5kVG8odGFyZ2V0KS5hdHRyKCdzcmMnLCB3aW5kb3cuQWN0aXZlWE9iamVjdCA/ICdqYXZhc2NyaXB0OmZhbHNlJyA6ICdhYm91dDpibGFuaycpO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNob3dSZXBvcnRDb250ZW50KGh0bWwsb3B0cykge1xyXG4gICAgICAgIGlmKGh0bWwgJiYgaHRtbC5jaGFyQXQoMCk9PSd7Jyl7XHJcbiAgICAgICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShodG1sKTtcclxuICAgICAgICAgICAgJC5tZXNzYWdlci5hbGVydChcIumUmeivr1wiLFwi5bGV546w5oql6KGo6ZSZ6K+v77yaXCIranNvbi5tZXNzYWdlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgJGVsID0gb3B0cy52aWV3LCAkY29udGVudHMgPSAkZWwuY29udGVudHMoKTtcclxuICAgICAgICAkY29udGVudHMuZmluZCgnaHRtbCcpLmh0bWwoaHRtbCB8fCAnJyk7Ly9JRTjjgIDku6XkuIrmlK/mjIFcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gJGNvbnRlbnRzWzBdLmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQ7XHJcbiAgICAgICAgJGVsLmhlaWdodChoZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQoJGpxKSB7XHJcbiAgICAgICAgdmFyIHN0YXRlID0gJC5kYXRhKCRqcVswXSwgJ3JlcG9ydCcpLCBvcHRzID0gc3RhdGUub3B0aW9ucztcclxuICAgICAgICBpZiAoIW9wdHMucmVwb3J0SWQgJiYgIW9wdHMucnB0Q29kZSkge1xyXG4gICAgICAgICAgICAkLm1lc3NhZ2VyLmFsZXJ0KCfmj5DnpLonLCAn6K+35Li65o6n5Lu257uR5a6a5oql6KGo5Luj56CB77yBJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3B0cy5jb250YWluZXIgPSAkanEuZW1wdHkoKTtcclxuICAgICAgICBvcHRzLnZpZXcgPSBidWlsZFJlcG9ydFZpZXcob3B0cy5yZXBvcnRWaWV3KTtcclxuICAgICAgICBvcHRzLmZvcm0gPSBidWlsZEZvcm0oKTtcclxuICAgICAgICBidWlsZEJ1dHRvbnMoJGpxLCBvcHRzKTtcclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdG90YWw6IDEsXHJcbiAgICAgICAgICAgIHBhZ2VTaXplOiAxLFxyXG4gICAgICAgICAgICBwYWdlTGlzdDogWzFdLFxyXG4gICAgICAgICAgICBzaG93UGFnZUxpc3Q6IGZhbHNlLFxyXG4gICAgICAgICAgICBzaG93UmVmcmVzaDogZmFsc2UsXHJcbiAgICAgICAgICAgIGxheW91dDogWydmaXJzdCcsICdwcmV2JywnbWFudWFsJywgJ25leHQnLCAnbGFzdCcsJ2xpbmtzJ10sXHJcbiAgICAgICAgICAgIG9uU2VsZWN0UGFnZTogZnVuY3Rpb24gKHBhZ2VObykge1xyXG4gICAgICAgICAgICAgICAgb3B0cy5jb250YWluZXIuZmluZCgnYVtkZWZhdWx0XScpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uUmVmcmVzaDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgb3B0cy5jb250YWluZXIuZmluZCgnYVtkZWZhdWx0XScpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgb3B0cy5wYWdpbmF0aW9uID0gJChcIjxkaXY+PC9kaXY+XCIpLmFwcGVuZFRvKCRqcSkucGFnaW5hdGlvbihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZU9wdGlvbnMoJGpxKSB7XHJcbiAgICAgICAgdmFyIHJwdElkID0gJGpxLmF0dHIoJ3JwdElkJykgfHwgJGpxLmF0dHIoJ3JlcG9ydElkJyksIG9wdHMgPSB7fTtcclxuICAgICAgICB2YXIgcnB0Q29kZSA9ICRqcS5hdHRyKCdyZXBvcnRDb2RlJykgfHwgJGpxLmF0dHIoJ3JwdENvZGUnKTtcclxuICAgICAgICB2YXIgcGFyYW1Gb3JtID0gJGpxLmF0dHIoJ3BhcmFtRm9ybScpO1xyXG4gICAgICAgIHZhciByZXBvcnRWaWV3ID0gJGpxLmF0dHIoJ3JlcG9ydFZpZXcnKTtcclxuICAgICAgICBpZiAocGFyYW1Gb3JtICYmIHBhcmFtRm9ybS5jaGFyQXQoMCkgIT0gJyMnKSB7XHJcbiAgICAgICAgICAgIHBhcmFtRm9ybSA9ICcjJyArIHBhcmFtRm9ybTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlcG9ydFZpZXcgJiYgcmVwb3J0Vmlldy5jaGFyQXQoMCkgIT0gJyMnKSB7XHJcbiAgICAgICAgICAgIHJlcG9ydFZpZXcgPSAnIycgKyByZXBvcnRWaWV3O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXJwdElkKSB7XHJcbiAgICAgICAgICAgIHJwdElkID0gJGdldFBhcmFtKCdycHRJZCcpIHx8ICRnZXRQYXJhbSgncmVwb3J0SWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIXJwdENvZGUpIHtcclxuICAgICAgICBcdHJwdENvZGUgPSAkZ2V0UGFyYW0oJ3JlcG9ydENvZGUnKSB8fCAkZ2V0UGFyYW0oJ3JwdENvZGUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRlbXAgPSAkanEuYXR0cignZXhwb3J0UGFyYW0nKTtcclxuICAgICAgICBpZiAodGVtcCAmJiB0ZW1wLmNoYXJBdCgwKSA9PSAneycpIHtcclxuICAgICAgICAgICAgb3B0c1snZXhwb3J0UGFyYW0nXSA9IGV2YWwodGVtcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRlbXAgPSAkanEuYXR0cigncHJpbnRQYXJhbScpO1xyXG4gICAgICAgIGlmICh0ZW1wICYmIHRlbXAuY2hhckF0KDApID09ICd7Jykge1xyXG4gICAgICAgICAgICBvcHRzWydwcmludFBhcmFtJ10gPSBldmFsKHRlbXApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0ZW1wID0gJGpxLmF0dHIoJ2V4cG9ydFR5cGVzJyk7XHJcbiAgICAgICAgaWYgKHRlbXAgJiYgdGVtcC5jaGFyQXQoMCkgPT0gJ1snKSB7XHJcbiAgICAgICAgICAgIG9wdHNbJ2V4cG9ydFR5cGVzJ10gPSBldmFsKHRlbXApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0ZW1wID0gJGpxLmF0dHIoJ29uUmVwb3J0UGFyYW0nKTtcclxuICAgICAgICBpZih0ZW1wKXtcclxuICAgICAgICAgICAgb3B0c1snb25SZXBvcnRQYXJhbSddID0gZXZhbCh0ZW1wKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGVtcCA9ICRqcS5hdHRyKCdvblByaW50UGFyYW0nKTtcclxuICAgICAgICBpZih0ZW1wKXtcclxuICAgICAgICAgICAgb3B0c1snb25QcmludFBhcmFtJ10gPSBldmFsKHRlbXApO1xyXG4gICAgICAgIH0gXHJcbiAgICAgICAgdGVtcCA9ICRqcS5hdHRyKCdvbkV4cG9ydFBhcmFtJyk7XHJcbiAgICAgICAgaWYodGVtcCl7XHJcbiAgICAgICAgICAgIG9wdHNbJ29uRXhwb3J0UGFyYW0nXSA9IGV2YWwodGVtcCk7XHJcbiAgICAgICAgfSAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgaWYgKHJwdElkKSBvcHRzWydyZXBvcnRJZCddID0gcnB0SWQ7XHJcbiAgICAgICAgaWYocnB0Q29kZSkgb3B0c1sncnB0Q29kZSddID0gcnB0Q29kZTtcclxuICAgICAgICBpZiAocGFyYW1Gb3JtKSBvcHRzWydwYXJhbUZvcm0nXSA9IHBhcmFtRm9ybTtcclxuICAgICAgICBpZiAocmVwb3J0Vmlldykgb3B0c1sncmVwb3J0VmlldyddID0gcmVwb3J0VmlldztcclxuICAgICAgICByZXR1cm4gb3B0cztcclxuICAgIH1cclxuXHJcbiAgICAkLmZuLnJlcG9ydCA9IGZ1bmN0aW9uIChvcHRpb25zLCBwYXJhbSkge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gJC5mbi5wYWdpbmF0aW9uLm1ldGhvZHNbb3B0aW9uc107XHJcbiAgICAgICAgICAgIGlmIChtZXRob2QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtZXRob2QodGhpcywgcGFyYW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gJC5kYXRhKHRoaXMsICdyZXBvcnQnKSwgJGpxID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzdGF0ZS5vcHRpb25zLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCAncmVwb3J0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6ICQuZXh0ZW5kKHt9LCAkLmZuLnJlcG9ydC5kZWZhdWx0cywgcGFyc2VPcHRpb25zKCRqcSksIG9wdGlvbnMpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGluaXQoJGpxKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgICQuZm4ucmVwb3J0Lm1ldGhvZHMgPSB7XHJcbiAgICBcdFxyXG4gICAgfTtcclxuICAgIC8v5omp5bGV6KGo5Y2V5pa55rOVLOWunueOsOebtOaOpeiwg+eUqOihqOWNleaWueazleWNs+WPr+WvvOWHuuaIluaJk+WNsOaKpeihqFxyXG4gICAvKiAkKFwiI2NvbmRpdGlvbkZvcm1cIikuZm9ybShcImV4cG9ydFJlcG9ydFwiLHtcclxuICAgIFx0Ly/miqXooajku6PnoIFcclxuICAgIFx0cnB0Q29kZSA6ICdUZXN0UmVwb3J0JyxcclxuICAgIFx0Ly/lr7zlh7rnsbvlnos6eGxzeCxkb2N4LHBkZixjc3YscHB0eCxydGZcclxuICAgIFx0ZXhwb3J0VHlwZSA6ICd4bHN4JyxcclxuICAgIFx0Ly/lr7zlh7rpobXnoIEs5aaC5p6c5LiN5Lyg5YiZ5a+85Ye65YWo6YOoXHJcbiAgICBcdHN0YXJ0UGFnZU5vIDogMSxcclxuICAgIFx0ZW5kUGFnZU5vIDogMlxyXG5cdH0pOyovXHJcbiAgICAkLmZuLmZvcm0ubWV0aG9kcy5leHBvcnRSZXBvcnQgPSBmdW5jdGlvbihqcSxwYXJhbXMpIHtcclxuICAgIFx0aWYoISQuaXNQbGFpbk9iamVjdChwYXJhbXMpKXtcclxuICAgIFx0XHQkLm1lc3NhZ2VyLmFsZXJ0KFwi6ZSZ6K+vXCIsXCLor7fkvKDlhaXmraPnoa7nmoTmiqXooajlj4LmlbDvvIFcIik7XHJcbiAgICBcdFx0cmV0dXJuIGpxO1xyXG4gICAgXHR9XHJcbiAgICBcdHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICBcdFx0dmFyICRmb3JtID0gJC5kYXRhKHRoaXMsJ3JlcG9ydF9mb3JtJyk7XHJcbiAgICBcdFx0aWYoISRmb3JtKXtcclxuICAgIFx0XHRcdCRmb3JtID0gYnVpbGRGb3JtKCk7XHJcbiAgICBcdFx0XHQkLmRhdGEodGhpcywncmVwb3J0X2Zvcm0nLCRmb3JtKTtcclxuICAgIFx0XHR9XHJcbiAgICBcdFx0ZXhwb3J0UmVwb3J0KCRmb3JtLHRoaXMscGFyYW1zKTtcclxuICAgIFx0fSk7XHJcbiAgICB9XHJcbiAgICAvL+iwg+eUqOekuuS+izpcclxuICAgIC8vJCgnI2NvbmRpdGlvbicpLmZvcm0oJ3ByaW50UmVwb3J0Jyx7cnB0Q29kZToneHh4eCcscGFnZU5vOjEscHJpbnRQYXJhbTp7cHJpbnRlcjon5omT5Y2w5py65ZCNJ319KSAgICBcclxuICAgICQuZm4uZm9ybS5tZXRob2RzLnByaW50UmVwb3J0ID0gZnVuY3Rpb24oanEscGFyYW1zKSB7XHJcbiAgICBcdGlmKCEkLmlzUGxhaW5PYmplY3QocGFyYW1zKSl7XHJcbiAgICBcdFx0JC5tZXNzYWdlci5hbGVydChcIumUmeivr1wiLFwi6K+35Lyg5YWl5q2j56Gu55qE5oql6KGo5Y+C5pWw77yBXCIpO1xyXG4gICAgXHRcdHJldHVybiBqcTtcclxuICAgIFx0fVxyXG4gICAgXHRyZXR1cm4ganEuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgXHRcdHZhciAkZm9ybSA9ICQuZGF0YSh0aGlzLCdyZXBvcnRfZm9ybScpO1xyXG4gICAgXHRcdGlmKCEkZm9ybSl7XHJcbiAgICBcdFx0XHQkZm9ybSA9IGJ1aWxkRm9ybSgpO1xyXG4gICAgXHRcdFx0JC5kYXRhKHRoaXMsJ3JlcG9ydF9mb3JtJywkZm9ybSk7XHJcbiAgICBcdFx0fVxyXG4gICAgXHRcdHByaW50UmVwb3J0KCRmb3JtLHRoaXMscGFyYW1zKTtcclxuICAgIFx0fSk7ICAgIFx0XHJcbiAgICB9XHJcbiAgICBcclxuICAgICQuZm4ucmVwb3J0LmRlZmF1bHRzID0ge1xyXG4gICAgICAgIHJlcG9ydElkOiAnJyxcclxuICAgICAgICBycHRDb2RlIDogJycsXHJcbiAgICAgICAgcGFyYW1Gb3JtOiAnJyxcclxuICAgICAgICByZXBvcnRWaWV3OiAnJyxcclxuICAgICAgICBleHBvcnRQYXJhbToge30sXHJcbiAgICAgICAgcHJpbnRQYXJhbToge30sXHJcbiAgICAgICAgbG9hZE1zZyA6ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZE1zZyxcclxuICAgICAgICBvblJlcG9ydFBhcmFtOiAkLm5vb3AsXHJcbiAgICAgICAgb25QcmludFBhcmFtOiAkLm5vb3AsXHJcbiAgICAgICAgb25FeHBvcnRQYXJhbTogJC5ub29wLFxyXG4gICAgICAgIGV4cG9ydFR5cGVzIDogW3tcclxuICAgICAgICAgICAgdHlwZTogJ3hsc3gnLFxyXG4gICAgICAgICAgICB0ZXh0OiAn5a+85Ye6RXhjZWzmlofmoaMnXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB0eXBlOiAnZG9jeCcsXHJcbiAgICAgICAgICAgIHRleHQ6ICflr7zlh7pXb3Jk5paH5qGjJ1xyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgdHlwZTogJ3BkZicsXHJcbiAgICAgICAgICAgIHRleHQ6ICflr7zlh7pQREbmlofmoaMnXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB0eXBlOiAnY3N2JyxcclxuICAgICAgICAgICAgdGV4dDogJ+WvvOWHukNTVuaWh+ahoydcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdwcHR4JyxcclxuICAgICAgICAgICAgdGV4dDogJ+WvvOWHunBwdHjmlofmoaMnXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB0eXBlOiAncnRmJyxcclxuICAgICAgICAgICAgdGV4dDogJ+WvvOWHunJ0ZuaWh+ahoydcclxuICAgICAgICB9XVxyXG4gICAgfVxyXG4gICAgJC5wYXJzZXIucGx1Z2lucy5wdXNoKCdyZXBvcnQnKTtcclxufSkoalF1ZXJ5LCBmbXgpOyIsIi8qKiAqKioqKioqKiBQUkVWRU5UX1JFSU5JVF9QTFVHSU5TIOmYsuatouWkmuasoeWIneWni+WMliAqKioqKioqKiogKi9cclxuLy92YXIgUFJFVkVOVF9SRUlOSVRfUExVR0lOUyA9IGZhbHNlO1xyXG47IChmdW5jdGlvbiAoJCwgZm14KSB7XHJcblxyXG4gICAgLy/pobXpnaLliJ3lp4vljJZcclxuICAgIGlmICgkaXNDaGlsZFdpbigpICYmIHRvcC53aW5kb3cuZm14KSB7XHJcbiAgICAgICAgdmFyIHBhZ2VMaXN0ZW5lciA9IHtcclxuICAgICAgICAgICAgb25UYWJBY3RpdmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQod2luZG93KS50cmlnZ2VySGFuZGxlcigndGFiQWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGhhc0RhdGFDaGFuZ2VzIDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIFx0cmV0dXJuICQod2luZG93KS50cmlnZ2VySGFuZGxlcihcImhhc0RhdGFDaGFuZ2VzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgdGFiUGFnZXMgPSB0b3Aud2luZG93LmZteC50YWJQYWdlcztcclxuICAgICAgICB2YXIgX3BhZ2VLZXkgPSAkZ2V0UGFyYW0oJ19wYWdlS2V5Jyk7XHJcbiAgICAgICAgaWYgKF9wYWdlS2V5ICYmIHRhYlBhZ2VzKSB7XHJcbiAgICAgICAgICAgIHRhYlBhZ2VzLiRyZWdMaXN0ZW5lcihfcGFnZUtleSwgcGFnZUxpc3RlbmVyKTtcclxuICAgICAgICAgICAgJGFkZExpc3RlbmVyKCd1bmxvYWQnLGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0YWJQYWdlcy4kcmVtb3ZlTGlzdGVuZXIoX3BhZ2VLZXkpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKioqKiptYXNrIGl0ICoqKiovXHJcbiAgICAkLmZuLm1hc2tpdCA9IGZ1bmN0aW9uIChtZXRob2Qsbm9Nc2cpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICRpdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmICghJC5kYXRhKHRoaXMsICdfbWFza2l0JykpIHtcclxuICAgICAgICAgICAgICAgIGZteC51dGlscy5tYXNraXQoJGl0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobWV0aG9kID09PSAndW5tYXNrJykge1xyXG4gICAgICAgICAgICAgICAgZm14LnV0aWxzLm1hc2tpdCgkaXQsIGZhbHNlLG5vTXNnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZteC51dGlscy5tYXNraXQoJGl0LCB0cnVlLG5vTXNnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqZWFzeXVpIGRpYWxvZyoqKioqKioqKiovXHJcbiAgICAkLmZuLmRpYWxvZy5kZWZhdWx0cy5tb2RhbCA9IHRydWU7XHJcblxyXG4gICAgLyoqKioqbG9jYWxlIGFuZCBmb3JtYXR0aW5nIGluaXRpYWwqKioqKioqKi9cclxuICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKGZteC5wYWdlQ29udGV4dC5sb2NhbGUpIHtcclxuICAgICAgICAgICAgaWYgKGZteC5wYWdlQ29udGV4dC5sb2NhbGUuaW5kZXhPZignY24nKSA+IC0xKSBudW1lcmFsLmxhbmd1YWdlKCdjaHMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJC50b0pTT04gPSBKU09OLnN0cmluZ2lmeTtcclxuICAgIH0pKCk7XHJcblxyXG4gICAgLyoqICoqKioqKioqIHNlYXJjaGJveGVzICoqKioqKioqKiAqL1xyXG4gICAgZnVuY3Rpb24gaW5pdFNlYXJjaGJveGVzKGpxKSB7XHJcbiAgICAgICAganEuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkc2VhcmNoYm94ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyICRyZXNldEJ0biA9ICQoXCI8c3Bhbj48c3BhbiBjbGFzcz0nY2xlYXItaW5wdXQnPjwvc3Bhbj48L3NwYW4+XCIpO1xyXG4gICAgICAgICAgICAkcmVzZXRCdG4uY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHNlYXJjaGJveC5zZWFyY2hib3goXCJzZXRWYWx1ZVwiLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChcIi5zZWFyY2hib3gtYnV0dG9uXCIpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkc2VhcmNoYm94LnNlYXJjaGJveChcInRleHRib3hcIikucGFyZW50KCkuYXBwZW5kKCRyZXNldEJ0bik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdGlhbCgpIHtcclxuICAgICAgICAvLyAgICAgICAgJChcImJvZHlcIikuYmluZChcImNvbnRleHRtZW51XCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgLy8gICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuaXMoXCJpbnB1dDpub3QoW3R5cGVdKSwgaW5wdXRbdHlwZT0ndGV4dCddLCB0ZXh0YXJlYVwiKSkge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgICAgIC8vICAgICAgICAgICAgaWYgKGZteC50ZXh0U2VsZWN0ZWQoKSkge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgICAgIC8vICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAgICB9KTtcclxuICAgICAgICAkLmVhY2goJC5wYXJzZXIucGx1Z2lucywgZnVuY3Rpb24gKGluZGV4LCBwbHVnaW4pIHtcclxuICAgICAgICAgICAgLyoqICoqKioqKioqIGFkZCBhIGJpbmQgZXZlbnQgbWV0aG9kIGZvciBlYWNoIHBsdWdpbiAqKioqKioqKiogKi9cclxuICAgICAgICBcdHZhciBwID0gJC5mbltwbHVnaW5dLm1ldGhvZHM7XHJcbiAgICAgICAgXHRpZighcCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBwLmJpbmQgPSBmdW5jdGlvbiAoanEsIGV2ZW50SGFuZGxlcnMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBqcS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChldmVudEhhbmRsZXJzLCBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5kYXRhKF90aGlzLCBwbHVnaW4pLm9wdGlvbnNbZXZlbnRdID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5mbltwbHVnaW5dLmRlZmF1bHRzW2V2ZW50XS5hcHBseShfdGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyLmFwcGx5KF90aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJC5kYXRhKF90aGlzLCBcImNvbWJvXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmRhdGEoX3RoaXMsIFwiY29tYm9cIikub3B0aW9uc1tldmVudF0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5mbltcImNvbWJvXCJdLmRlZmF1bHRzW2V2ZW50XS5hcHBseShfdGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlci5hcHBseShfdGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyB2YXIgX3BsdWdpbiA9IFwiX19cIiArIHBsdWdpbjtcclxuICAgICAgICAgICAgLy8gJC5mbltfcGx1Z2luXSA9ICQuZm5bcGx1Z2luXTtcclxuICAgICAgICAgICAgLy8gJC5mbltwbHVnaW5dID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmFtKSB7XHJcbiAgICAgICAgICAgIC8vIGlmIChQUkVWRU5UX1JFSU5JVF9QTFVHSU5TICYmIHR5cGVvZiBvcHRpb25zICE9IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIHZhciBzdGF0ZSA9ICQuZGF0YSh0aGlzLCBwbHVnaW4pO1xyXG4gICAgICAgICAgICAvLyBpZiAoc3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gaWYgKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gJC5leHRlbmQoc3RhdGUub3B0aW9ucywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIC8vIGlmICgkLmRhdGEodGhpcywgXCJjb21ib1wiKSkge1xyXG4gICAgICAgICAgICAvLyAkLmV4dGVuZCgkLmRhdGEodGhpcywgXCJjb21ib1wiKS5vcHRpb25zLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgLy8gfTtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAkLmZuW19wbHVnaW5dLmFwcGx5KCQodGhpcyksIFtvcHRpb25zLCBwYXJhbV0pO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIC8vIH0pO1xyXG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyByZXR1cm4gJC5mbltfcGx1Z2luXS5hcHBseSh0aGlzLCBbb3B0aW9ucywgcGFyYW1dKTtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAvLyB9O1xyXG4gICAgICAgICAgICAvLyAkLmV4dGVuZCgkLmZuW3BsdWdpbl0sICQuZm5bX3BsdWdpbl0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKCdpbnB1dDp2aXNpYmxlOmVuYWJsZWQ6Zmlyc3QnKS5mb2N1cygpO1xyXG4gICAgICAgIH0sIDUwKTtcclxuICAgIH1cclxuICAgICQoaW5pdGlhbCk7XHJcbn0pKGpRdWVyeSwgZm14KTtcclxuXHJcbihmdW5jdGlvbiAoJCkge1xyXG4gICAgZnVuY3Rpb24gZmluZFBhcmVudCgkdGFyZ2V0LCBzZWxlY3Rvcikge1xyXG4gICAgICAgICRqcSA9ICR0YXJnZXQuY2hpbGRyZW4oc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICgkanEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkanE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlICgoJHRhcmdldCA9ICR0YXJnZXQucGFyZW50KCkpICYmICR0YXJnZXQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciAkanEgPSAkdGFyZ2V0LmZpbmQoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoJGpxLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRqcTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmaXJlQ2xpY2soJGJ0bikge1xyXG4gICAgICAgIGlmICghJGJ0biB8fCAhJGJ0bi5sZW5ndGggfHwgJGJ0bi5oYXNDbGFzcygnbC1idG4tZGlzYWJsZWQnKSB8fCAkYnRuLmF0dHIoJ21hc2tpbmcnKSkgcmV0dXJuO1xyXG4gICAgICAgICRidG4uY2xpY2soKTtcclxuICAgIH1cclxuICAgIC8qKiAqKioqKioqKiBnbG9iYWwgc2hvcnRjdXRzICoqKioqKioqKiAqL1xyXG4gICAgLy8gODpCYWNrU3BhY2U7IDk6VGFiOyAxMzpSZXR1cm47XHJcbiAgICAvLyAxNjpTaGlmdDsgMTc6Q3RybDsgMTg6QWx0O1xyXG4gICAgLy8gMjc6RXNjOyAzMjpTcGFjZTtcclxuICAgIC8vIDM3OkxlZnQ7IDM4OlVwOyAzOTpSaWdodDsgNDA6RG93bjtcclxuICAgIC8vIDY1LTkwOkEtWjtcclxuICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGlmICghZXZlbnQpIHtcclxuICAgICAgICAgICAgZXZlbnQgPSB3aW5kb3cuZXZlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09IDgpIHtcclxuICAgICAgICBcdGlmKGV2ZW50LnRhcmdldCkge1xyXG4gICAgICAgIFx0XHRpZihldmVudC50YXJnZXQuY29udGVudEVkaXRhYmxlID09IFwidHJ1ZVwiIHx8IGV2ZW50LnRhcmdldC5jb250ZW50RWRpdGFibGUgPT0gdHJ1ZSl7XHJcbiAgICAgICAgXHRcdFx0cmV0dXJuIHRydWU7XHJcbiAgICAgICAgXHRcdH1cclxuICAgICAgICBcdFx0dmFyIHR5cGUgPSBldmVudC50YXJnZXQudHlwZTtcclxuICAgICAgICBcdFx0aWYodHlwZSA9PSAndGV4dCcgfHwgdHlwZSA9PSAndGV4dGFyZWEnIHx8IHR5cGUgPT0gJ3Bhc3N3b3JkJyl7XHJcbiAgICAgICAgXHRcdFx0aWYoZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgncmVhZG9ubHknKSB8fCBldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpKXtcclxuICAgICAgICBcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuICAgICAgICBcdFx0XHR9XHJcbiAgICAgICAgXHRcdFx0cmV0dXJuIHRydWU7XHJcbiAgICAgICAgXHRcdH1cclxuICAgICAgICBcdH1cclxuICAgICAgICBcdGlmKGV2ZW50LnNyY0VsZW1lbnQpIHtcclxuICAgICAgICBcdFx0aWYoZXZlbnQuc3JjRWxlbWVudC5jb250ZW50RWRpdGFibGUgPT0gXCJ0cnVlXCIgfHwgZXZlbnQuc3JjRWxlbWVudC5jb250ZW50RWRpdGFibGUgPT0gdHJ1ZSkge1xyXG4gICAgICAgIFx0XHRcdHJldHVybiB0cnVlO1xyXG4gICAgICAgIFx0XHR9XHJcbiAgICAgICAgXHRcdHZhciB0eXBlID0gZXZlbnQuc3JjRWxlbWVudC50eXBlO1xyXG4gICAgICAgIFx0XHRpZih0eXBlID09ICd0ZXh0JyB8fCB0eXBlID09ICd0ZXh0YXJlYScgfHwgdHlwZSA9PSAncGFzc3dvcmQnKXtcclxuICAgICAgICBcdFx0XHRpZihldmVudC5zcmNFbGVtZW50LmdldEF0dHJpYnV0ZSgncmVhZG9ubHknKSB8fCBldmVudC5zcmNFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSl7XHJcbiAgICAgICAgXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgXHRcdFx0fVxyXG4gICAgICAgIFx0XHRcdHJldHVybiB0cnVlO1xyXG4gICAgICAgIFx0XHR9ICAgICAgXHJcbiAgICAgICAgXHR9XHJcbiAgICAgICAgXHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgXHRcclxuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT0gMTMgJiYgZXZlbnQudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHZhciAkanEgPSAkKGV2ZW50LnRhcmdldCB8fCBldmVudC5kYXRhLnRhcmdldCk7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZmlyZUNsaWNrKGZpbmRQYXJlbnQoJGpxLCAnYS5lYXN5dWktbGlua2J1dHRvbltkZWZhdWx0XTpmaXJzdCcpKTtcclxuICAgICAgICAgICAgfSwgMCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5hbHRLZXkgJiYgKGV2ZW50LmtleUNvZGUgPT0gMzcgfHwgZXZlbnQua2V5Q29kZSA9PSAzOSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY3RybEtleSAmJiBldmVudC5rZXlDb2RlID49IDY1ICYmIGV2ZW50LmtleUNvZGUgPD0gOTApIHtcclxuICAgICAgICAgICAgdmFyIGtleUNoYXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LmtleUNvZGUpO1xyXG4gICAgICAgICAgICBpZiAoa2V5Q2hhciAhPSBcIkNcIiAmJiBrZXlDaGFyICE9IFwiWFwiICYmIGtleUNoYXIgIT0gXCJWXCIgJiYga2V5Q2hhciAhPSBcIlpcIikge1xyXG4gICAgICAgICAgICAgICAgdmFyICRqcSA9ICQoZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmRhdGEudGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGlmICgkanEuc2l6ZSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAga2V5Q2hhciA9IGtleUNoYXIudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBmaXJlQ2xpY2soZmluZFBhcmVudCgkanEsIFwiYVtrZXk9J1wiICsga2V5Q2hhciArIFwiJ106dmlzaWJsZTpmaXJzdFwiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkdG9wV2luZG93ID0gJChcImJvZHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcImRpdi5wYW5lbFtzdHlsZSo9J3otaW5kZXgnXTp2aXNpYmxlXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5jc3MoXCJ6LWluZGV4XCIpID4gKCR0b3BXaW5kb3cuY3NzKFwiei1pbmRleFwiKSA9PSBcImF1dG9cIiA/IDAgOiAkdG9wV2luZG93LmNzcyhcInotaW5kZXhcIikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdG9wV2luZG93ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcmVDbGljaygkdG9wV2luZG93LmZpbmQoXCJhW2tleT0nXCIgKyBrZXlDaGFyICsgXCInXTp2aXNpYmxlOmZpcnN0XCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY3RybEtleSAmJiBldmVudC5rZXlDb2RlID49IDM3ICYmIGV2ZW50LmtleUNvZGUgPD0gNDApIHtcclxuICAgICAgICAgICAgdmFyICRmb2N1cyA9ICQoXCI6Zm9jdXNcIik7XHJcbiAgICAgICAgICAgIGlmICgkZm9jdXMuY2xvc2VzdChcIi5kYXRhZ3JpZC1lZGl0YWJsZVwiKS5zaXplKCkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzNzogLy8gbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkaW5wdXRzID0gJGZvY3VzLmNsb3Nlc3QoXCIuZGF0YWdyaWQtcm93LWVkaXRpbmdcIikuZmluZChcImlucHV0OnZpc2libGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICRpbnB1dHMuaW5kZXgoJGZvY3VzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT0gMzcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAkaW5wdXRzLnNpemUoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggLT0gJGlucHV0cy5zaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgJGlucHV0cy5lcShpbmRleCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDQwOiAvLyBkb3duXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2x1bW5JbmRleCA9ICRmb2N1cy5jbG9zZXN0KFwidGRbZmllbGRdXCIpLmluZGV4KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkcm93cyA9ICRmb2N1cy5jbG9zZXN0KFwidHIuZGF0YWdyaWQtcm93LWVkaXRpbmdcIikucGFyZW50KCkuY2hpbGRyZW4oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvd0luZGV4ID0gJGZvY3VzLmNsb3Nlc3QoXCJ0ci5kYXRhZ3JpZC1yb3ctZWRpdGluZ1wiKS5pbmRleCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSAzOCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93SW5kZXgtLTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvd0luZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvd0luZGV4ID49ICRyb3dzLnNpemUoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93SW5kZXggLT0gJHJvd3Muc2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb3dzLmVxKHJvd0luZGV4KS5jaGlsZHJlbigpW2NvbHVtbkluZGV4XS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pKGpRdWVyeSk7IiwiLyoqICoqKioqKioqIHBhcnNlciAqKioqKioqKiogKi9cclxuOyhmdW5jdGlvbiAoJCxmbXgpIHtcclxuICAgIHZhciAkcGFyc2VyID0ge1xyXG4gICAgICAgIG9uQmVmb3JlOiBmdW5jdGlvbiAoY29udGV4dCwgZmluZGluZ3MpIHtcclxuICAgICAgICAgICAgLy8gZGlzYWJsZSB1bndhbnRlZCBzY3JvbGxpbmcgYmFycyBpbiBDaHJvbWVcclxuICAgICAgICAgICAgJChcIltmaXQ9J3RydWUnXVwiLCBjb250ZXh0KS5wYXJlbnQoKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTtcclxuXHJcbiAgICAgICAgICAgICQoXCJbdG9vbHRpcF1cIiwgY29udGV4dCkudG9vbHRpcCgpO1xyXG4gICAgICAgICAgICAkKCQucGFyc2VyKS50cmlnZ2VySGFuZGxlcignb25CZWZvcmUnLFtjb250ZXh0LGZpbmRpbmdzXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYXJzZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgLy8gY2FjaGUgZmluZGluZ3NcclxuICAgICAgICAgICAgdmFyIGZpbmRpbmdzID0ge307XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJC5wYXJzZXIucGx1Z2lucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSAkLnBhcnNlci5wbHVnaW5zW2ldO1xyXG4gICAgICAgICAgICAgICAgdmFyIHIgPSAkKCcuZWFzeXVpLScgKyBuYW1lLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIGZpbmRpbmdzW25hbWVdID0gcjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJC5wYXJzZXIub25CZWZvcmUuY2FsbCgkLnBhcnNlciwgY29udGV4dCwgZmluZGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFhID0gW107XHJcbiAgICAgICAgICAgICQuZWFjaChmaW5kaW5ncywgZnVuY3Rpb24gKG5hbWUsIHIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyICYmIHIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJbbmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcltuYW1lXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpxOiByXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChhYS5sZW5ndGggJiYgd2luZG93LmVhc3lsb2FkZXIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzLnB1c2goYWFbaV0ubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlYXN5bG9hZGVyLmxvYWQobmFtZXMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gYWFbaV0ubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGpxID0gYWFbaV0uanE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpxW25hbWVdKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICQucGFyc2VyLm9uQ29tcGxldGUuY2FsbCgkLnBhcnNlciwgY29udGV4dCwgZmluZGluZ3MpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkLnBhcnNlci5vbkNvbXBsZXRlLmNhbGwoJC5wYXJzZXIsIGNvbnRleHQsIGZpbmRpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKGNvbnRleHQsIGZpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgICQoJC5wYXJzZXIpLnRyaWdnZXJIYW5kbGVyKCdvbkNvbXBsZXRlJyxbY29udGV4dCxmaW5kaW5nc10pO1xyXG4gICAgICAgICAgICBpZighY29udGV4dCl7XHJcbiAgICAgICAgICAgIFx0JCgnYm9keScpLmNzcygndmlzaWJpbGl0eScsJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAkLmV4dGVuZCgkLnBhcnNlciwgJHBhcnNlcik7XHJcbn0pKGpRdWVyeSxmbXgpOyJdfQ==
