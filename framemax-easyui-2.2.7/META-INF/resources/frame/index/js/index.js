(function ($, fmx) {
	if (window != top.window && window.location.href == top.window.location.href) {
		top.window.location.href = window.location.href;
	}
	var menuUrlCodes = {};
	$(function () {
		var tabs = new TabPages($('#tabPages'));
		var menuBuilder = new MenuBuilder();
		menuBuilder.imageRoot = $url('/frame/index/image');
		var defMenuCodes = fmx.pageContext.defaultMenuCodes || [], defMenus = [];
		var targetUrl = fmx.store.get("targetUrl"),targetCode,targetParam, targetMenu;
		if(targetUrl){
			fmx.store.remove('targetUrl');
			var idx = targetUrl.indexOf('?');
			if(idx > -1){
				targetCode = $getParam('menuCode',targetUrl);
				targetParam=targetUrl.substr(idx + 1);
				if(targetCode) targetUrl = null;
				else targetUrl = targetUrl.substr(0,idx);
			}
		}else {
			targetCode = $getParam('menuCode');
			var search = location.search;
			if(search) {
				targetParam = search.substr(1);
			}
		}
		menuBuilder.onIteratorItem = function (menu) {
			if (menu.menuUrl) {
				if ((targetUrl && menu.menuUrl === targetUrl) || (targetCode && menu.menuCode == targetCode)) {
					targetMenu = $.extend({},menu);
					if(targetParam) {
						var idx = targetMenu.menuUrl.indexOf('?');
						if(idx > -1) targetMenu.menuUrl = targetMenu.menuUrl + '&' + targetParam;
						else targetMenu.menuUrl = targetMenu.menuUrl + '?' + targetParam;
					}
				} else if (defMenuCodes.indexOf(menu.menuCode) > -1) defMenus.push(menu);
				menuUrlCodes[menu.menuUrl] = menu.menuCode;
			}
		}
		menuBuilder.onMenuClick = function (menu) {
			var opts = { title: menu.menuTitle, url: menu.menuUrl, iconCls: menu.menuIcon, closable: true, menuCode: menu.menuCode };
			tabs.openTab(opts);
		}
		fmx.tabPages = tabs;
		$.getJSON($url("/rest/fmxMenuRest/getCurrentNavigableMenus.json"), function (data) {
			if (data.code == 0) {
				menuBuilder.buildMenu(data.data);
				if (defMenus.length > 0 || targetMenu) {
					setTimeout(doOpenDefaultMenus, 10);
				}
			}
		});
		function doOpenDefaultMenus() {
			$.each(defMenus, function (i, menu) {
				tabs.openTab({ url: menu.menuUrl, title: menu.menuTitle, menuCode: menu.menuCode });
			});
			if (targetMenu) {
				tabs.openTab({ url: targetMenu.menuUrl, title: targetMenu.menuTitle, menuCode: targetMenu.menuCode,focus : true });
			}
		}
		
		$("body").bind("contextmenu", function (e) {
		    if ($(e.target).is("input:not([type]), input[type='text'], textarea")) {
		        return true;
		    }
		    if (fmx.textSelected()) {
		        return true;
		    }
		    return false;
		});		
	});


	var MenuBuilder = function () {
		var $topBar = $('#topMenuBar').empty(), $leftBar = $('#leftMenuBar'), that = this;
		this.buildMenu = buildMenu;
		this.onMenuClick = $.noop;
		this.onIteratorItem = $.noop;
		this.imageRoot = '';
		function getImagePath(img) {
			return that.imageRoot + '/' + img + '.png';
		}
		function onItemClick() {
			var menu = $.data(this, '$data');
			if (menu) {
				that.onMenuClick.call(this, menu);
			}
		}
		function onIteratorItem(menu) {
			that.onIteratorItem.call(this, menu);
		}
		function onTopMenuClick() {
			var $cur = $topBar.find('li.nav_choose_active');
			if ($cur.length > 0) {
				$cur.removeClass('nav_choose_active');
				$cur.data('$left').detach();
			}
			var $el = $(this);
			$el.addClass('nav_choose_active').data('$left').appendTo($leftBar);
			onItemClick.apply(this);
		}
		function toggleMainTitleBox() {
			var $el = $(this), $img = $el.find('img');
			if ($img.hasClass('minus_umar')) {
				$img.removeClass('minus_umar').addClass('plus_umar').attr('src', getImagePath('plus'));
				$el.siblings('.system_setting_bigbox').hide();
			} else {
				$img.removeClass('plus_umar').addClass('minus_umar').attr('src', getImagePath('minus'));
				$el.siblings('.system_setting_bigbox').show();
			}
		}
		function toggleChildrenTitleBox() {
			var $el = $(this), $img = $el.find('img'), $ct = $el.next('[level]');
			if ($ct.css('display') == 'none') {
				$img.attr('src', getImagePath('triangle'));
				$ct.show();
			} else {
				$img.attr('src', getImagePath('triangle_right'));
				$ct.hide();
			}
		}
		function onMainTitleBoxBuilt($titleBox, index) {
			$titleBox.on('click', toggleMainTitleBox);
			//默认展开第1个
			if (index > 0) {
				$titleBox.click();
			}
		}
		function onChildTitleBoxBuilt($titleBox, level, index) {
			$titleBox.on('click', toggleChildrenTitleBox);
			//默认展开第1 2层
			if (level > 2) {
				$titleBox.click();
			}
		}
		function buildMenu(menus) {
			var items = [];
			if ($.isArray(menus)) {
				$.each(menus, function (i, menu) {
					onIteratorItem(menu);
					var $item = $('<li class="float_l nav_cont nav_text"></li>').attr('title',menu.menuTitle).html(menu.menuTitle).on('click', onTopMenuClick);
					var $ctLeft = buildLeftMenu(menu.childrens);
					$item.data('$left', $ctLeft);
					if (menu.menuUrl) {
						menu.childrens = null;
						$item.data('$data', menu);
					}
					items.push($item);
				});
			}
			$.each(items, function (i, $item) {
				$topBar.append($item);
			});
			if (items.length > 0) $leftBar.empty();
			$topBar.find('li:first').click();
		}
		function buildLeftMenu(menus) {
			//菜单容器
			var $container = $('<div class="aside_cont" style="height:100%;"></div>');
			if (!$.isArray(menus)) return $container;
			$.each(menus, function (i, menu) {
				onIteratorItem(menu);
				var $titleBox = $('<div class="system_bigbox"></div>').appendTo($container);
				var $titleBox1 = $('<div class="system_box clearfloat"></div>').appendTo($titleBox);
				var $el = $('<div class="system float_l"></div>').attr('title',menu.menuTitle).html(menu.menuTitle).appendTo($titleBox1);
				$('<div class="minus float_r"><img class="minus_umar" src="' + getImagePath('minus') + '"></div>').appendTo($titleBox1);
				buildLeftMenuChildrens($('<div class="system_setting_bigbox"></div>').appendTo($titleBox), menu.childrens, 0);
				if (menu.menuUrl) {
					menu.childrens = null;
					$el.data('$data', menu).on('click', onItemClick);
				}
				onMainTitleBoxBuilt($titleBox1, i);
			});
			return $container;
		}
		function buildLeftMenuChildrens($box, menus, level) {
			if (!$.isArray(menus)) return;
			$.each(menus, function (i, menu) {
				onIteratorItem(menu);
				var $ct = $('<div class="system_setting_list"></div>').css('padding-left', (level) * 24 + 10).appendTo($box), $el;
				if ($.isArray(menu.childrens) && menu.childrens.length > 0) {
					$ct.append('<div class="middle_left but"><img src="' + getImagePath('triangle') + '"></div>');
					$el = $('<div class="system_setting middle_left"></div>').attr('title',menu.menuTitle).html(menu.menuTitle).appendTo($ct);
					buildLeftMenuChildrens($('<div></div>').appendTo($box).attr('level', level), menu.childrens, level + 1);
					onChildTitleBoxBuilt($ct, level, i);

				} else {
					$ct.append('<div class="middle_left but"><img src="' + getImagePath('blank') + '"></div>');
					$el = $('<div class="system_setting middle_left"></div>').attr('title',menu.menuTitle).html(menu.menuTitle).appendTo($ct);
				}
				if (menu.menuUrl) {
					menu.childrens = null;
					$ct.data('$data', menu).on('click', onItemClick);
				}
			});
		}
	}

	var TabPages = function ($tabs) {
		var that = this, pageListeners = {},maxCount = fmx.pageContext.easyui.tabMaxPageCount || 8,$tabCtxMenu=$("#tabCtxMenu");
		var count = 0;
		$addListener('beforeunload',function(evt){
			var bYes = false;
			$.each(pageListeners,function(k,v){
				if($.isFunction(v.hasDataChanges)){
					bYes = bYes || v.hasDataChanges();
				}
			});
			if(bYes){
				evt.returnVal = "你有修改的数据没保存，确认要继续吗？";
			}
		});
		$tabCtxMenu.find('[act]').on('click',function(e){
		     var act = this.getAttribute('act');
		     switch (act) {
			     case 'refresh'://刷新
			    	 var page = $tabs.tabs("getSelected").find('iframe:first');
			    	 page.attr('src',page.attr('src'));
			    	 break;
			     case 'close'://关闭
			    	 var tabs = $tabs.tabs('tabs');
			    	 if(tabs){
			    		 var left = $tabCtxMenu.offset().left;
			    		 for(var i = 0 ; i< tabs.length;i++){
		    			 	var opts = tabs[i].panel("options");
		    			 	var min = opts.tab.offset().left;
		    			 	var max = min + opts.tab.outerWidth();
		    			 	//if (opts.tab.hasClass('tabs-selected')){
		    			 	if(min <= left && max >= left){
		    			 		$tabs.tabs('close',opts.title);
		    			 		break;
		    			 	}
			    		 }
			    	 } 
			    	 break;
			     case 'closeAll'://关闭所有
			    	 $tabs.find("div.tabs-header ul.tabs span.tabs-closable").each(function(i,el){
			    		 $tabs.tabs('close',$(el).text());
			    	 });
			    	 break;
			     case 'closeOther'://关闭其他
			    	 $tabs.find('div.tabs-header ul.tabs span.tabs-closable').each(function(i,el){
			    		 var $el = $(el);
			    		 if(!$el.parent().parent().hasClass('tabs-selected')){
			    			 $tabs.tabs('close',$(el).text());
			    		 }
			    	 }); 
			    	 break;
			     case 'closeRight': //关闭右边
			    	 $tabs.find('div.tabs-header ul.tabs li.tabs-selected').nextAll().each(function(i,el){
			    		 var text = $(el).find('.tabs-closable').text();
			    		 if(text){
			    			 $tabs.tabs('close',text);
			    		 }
			    	 });
			    	 break;
			     case 'closeLeft'://关闭左边
			    	 $tabs.find('div.tabs-header ul.tabs li.tabs-selected').prevAll().each(function(i,el){
			    		 var text = $(el).find('.tabs-closable').text();
			    		 if(text){
			    			 $tabs.tabs('close',text);
			    		 }
			    	 });
			    	 break;
		     }
		});
		$tabs.tabs("options").onContextMenu = function(e,title,idx){
			$tabCtxMenu.menu("show", {
				left: e.pageX,
				top: e.pageY
			});
		};
		$tabs.tabs({
			fit: true,
			border: false,
			onSelect: function (title, index) {
				var listener = getListener(index);
				if (listener && $.isFunction(listener.onTabActive)) listener.onTabActive();
			},
			onBeforeClose: function (title, index) {
				var listener = getListener(index);
				if (listener && $.isFunction(listener.hasDataChanges)){
					var ret = listener.hasDataChanges();
					if(ret === true){
						$.messager.confirm('提示信息','你有修改的数据没保存，确认要关闭吗？',function(bYes){
							if(bYes){
								var opts = $tabs.tabs('options');
								var fn = opts.onBeforeClose;
								opts.onBeforeClose=$.noop;
								$tabs.tabs('close',index);
								opts.onBeforeClose = fn;
							}
						});
						return false;
					}
				}
			}
		});
		function getListener(index) {
			var pageKey = getPageKey(index);
			return pageListeners[pageKey];
		}
		function getPageKey(index) {
			var tab = $tabs.tabs('getTab', index);
			return tab.find('iframe').attr('pagekey');
		}
		function addParam(url, key, param) {
			if (url.indexOf('?') > 0) {
				return url + '&' + key + '=' + param;
			}
			return url + '?' + key + '=' + param;
		}
		/**
		 * opts 打开tab的参数
		 * {
		 * 	  url:"", //tab页面的url地址
		 *    title:"",//tab页显示的标题
		 *    closable: true,//是否允许关闭
		 *    focus : false //如果存在相同的标题的tab页是否强制重新加载页面
		 * }
		 */
		function openTab(opts) {
			if(opts.url && opts.url.indexOf('javascript:') == 0){
				try {
					eval(opts.url);
				} catch (e) {
					$.messager.alert('错误信息',e,'error');
				}
				return;
			}
			if (!opts.url || !opts.title) {
				$.messager.alert('错误信息', '打开tab的参数缺少的url和title参数！','error');
				return;
			}
			if (!opts.menuCode) {
				opts.menuCode = menuUrlCodes[opts.url];
			}
			var url = $url(opts.url);
			if (opts.menuCode && url.indexOf('menuCode=') == -1) {
				url = addParam(url, 'menuCode', opts.menuCode);
			}
			count++;
			var _pageKey = (opts.menuCode || 'tabPage')+'-' + count;
			url = addParam(url, '_pageKey', _pageKey);
			var tabs = $tabs.tabs('tabs');
			function getTabOptions() {
				var content = "<iframe scrolling='auto' pagekey='" + _pageKey + "' frameborder='0' style='width:100%;height:99%' marginwidth='0px' marginheight='0px' src='" + url + "'></iframe>";
				return {
					title: opts.title,
					iconCls: opts.iconCls,
					closable: opts.closable == undefined || !!opts.closable,
					fit: true,
					width: $tabs.parent().width(),
					height: "auto",
					content: content
				};
			}
			function createTab() {
				if (tabs.length > maxCount) {
					$.messager.alert("提示信息", "你打开的页面数量太多了，请关掉一部分！",'warning');
					return;
				}
				$tabs.tabs("add", getTabOptions());
			}
			var tab = $tabs.tabs("getTab", opts.title);
			if (tab) {//已存在
				if (opts.focus) {
					//$tabs.tabs("close", opts.title);
					//createTab();
					tab.find('iframe').attr('src', url);
					$tabs.tabs("select", opts.title);
				} else {
					$tabs.tabs("select", opts.title);
				}
			} else if(maxCount == 1 && tabs.length) {
				$tabs.tabs("update",{
					tab : tabs[0],
					options : getTabOptions()
				});
			}else {
				createTab();
			}
		}
		that.openTab = openTab;
		that.$regListener = function (_pageKey, listener) {
			if (_pageKey && listener) {
				pageListeners[_pageKey] = listener;
			}
		}
		that.$removeListener = function (_pageKey) {
			if (_pageKey) {
				delete pageListeners[_pageKey];
			}
		}
	}

})(jQuery, fmx);
