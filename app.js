/**
 * 主框架实现
 */

define(function() {
	var app = {};

	app.startup = function() {
		this.ready();

		this.api(window);
		// console.log(this);
	};

	/**
	 * DOMContentLoaded做各个模块的初始化
	 */
	app.ready = function() {
		var app = this;
		$(function() {

			app.page.init();

			app.module.init();

			app.tab.init();

			$(window).resize(function() {
	      app.resize();
	    });

	    $(document).click(function() {
	      app.docClick();
	    });

		});
	};

	/**
	 * window.resize需要做的
	 */
	app.resize = function() {  
    this.page.setFrameHeight();
    
    this.frame.update();
    
    this.tab.update();
	};

	/**
	 * document的click
	 */
	app.docClick = function() {  
    // 隐藏popup出来的元素  
	  $('[pos]:visible', app.page.main).each(function() {
	    $(this).trigger('hide.fangyun');
	  });
	};
	
	/**
	 * 掌管页面层面的控制
	 */
	app.page = {
		init: function() {
			// 页面上模块的各个DOM节点先找到
			this.struct = {
				header: $('#header'),
				tab: $('#tab'),
				tabContainer: $('#tabContainer'),
				tabItems: $('#tabContainer [role="tab"]'),
				tabDropdown: $('#tab [role="dropdown"]'),
				container: $('#container'),
				moduleContainer: $('#container [layout="moduleContainer"]'),
				tabFNMenu: $('#tabFNMenu'),
				readyState: $('#readyState')
			};
		},

		getClientWidth: function() {
    	return $(window).width();
	  },

	  getClientHeight: function() {
	    return $(window).height();
	  },

		// 设置主内容区可用高度
		setFrameHeight: function() {
	    var frameHeight = this.getFrameHeight();
	    var $moduleContainer = this.reloadStruct('moduleContainer');
	    
	    $moduleContainer.each(function() {
	      $(this).height(frameHeight);
	    });
	  },

		// 获取主内容区可用高度
		getFrameHeight: function() {
	    var clientHeight = this.getClientHeight(),
	      headerHeight = this.struct.header.outerHeight(true);
	    var frameHeight = clientHeight - headerHeight;
	    return frameHeight;
	  },

		// 以重找一次的方式来获取名称是k的页面结构DOM，打破JQ缓存
		// 未传递k则全部更新一遍
		reloadStruct: function(k) {
	    if (this.struct.hasOwnProperty(k)) {
	      return this.struct[k] = $(this.struct[k].selector);
	    } else {
	      for (var k in this.struct) {
	        this.struct[k] = $(this.struct[k].selector);
	      }
	      return this.struct;
	    }
	  }
	};

	app.tab = {
		init: function() {
			var page = app.page;

			var $tabSection = page.struct.tab;
			var self = this;

			$tabSection.on('click', '[role="close"]', function() { // 点关闭
	      var id = self.getIdByDom($(this).closest('[role="tab"]')[0]);
	      self.close(id);
	      return false;
	    }).on('click', '[role="tab"]', function() { // 点标签
	    	self.show(self.getIdByDom(this), false);
	    }).on('click', '[role="dropdown"]', function() { // 功能菜单按钮
	      self.showFNMenu(this);

	      return false;
	    });

	    this.buildFNMenu();
		},

		// 只负责新增一个tab
		open: function(id) {
			// console.log(app.module.ids[id], 'open');
			var module = app.module, frame = app.frame, router = app.router;
			var modSettings = module.getModuleById(id);
			var tabId = this.idPrefix + modSettings.id,
				tabName = modSettings.tabName,
				tabTitle = modSettings.tabTitle || tabName,
				target = modSettings.target; // 打开方式_blank新开 _self当前标签打开，默认_blank

			var $container = this.container();
			var $tab;

			if (target !== '_self' && target !== 'main') { // 新开标签页
				// 加一个标签到页面tab区域
				$container.append(JSTMPL(this.htmlTmpl, {id: modSettings.id, tabId: tabId, tabName: tabName, tabTitle: tabTitle}));

				this.show2top(id);

				// 加入到tab队列中
				this.ids.push({
					id: id,
					name: tabName
				});
			} else { // 在当前标签打开

				// 改变标签的名称与产品讨论确定不需要改变名称
				/*$tab = this.getDomById();

				$tab.attr('title', tabTitle).find('[role="name"]').text(tabName);*/

				// 当前标签打开会创建一个module，但不创建一个tab标签
				var currentTabId = router.current();
				var idIndex = this.getIdIndex(currentTabId);

				// 加_tabid属性，记录当前模块内容的标签id
				modSettings._tabid = currentTabId;

				module.setParam('_parent', currentTabId, id);

				this.ids[idIndex]._id = modSettings;
			}

			frame.open(id);
		},

		// 只负责显示tab
		show: function(id, refresh) {
			var module = app.module;
			var frame = app.frame;

			var args = arguments;

			var id = id, idIndex;

			var refresh;
			if (args.length > 1) {
				refresh = args[1];
			} else {
				refresh = appConfig.alwaysReloadTab;
			}

			var modSettings = module.getModuleById(id);

			// 寄生模式打开的，把id指回到父标签从属的那个标签
			if (modSettings.target == 'main' || modSettings.target == '_self') {
				id = modSettings._parent;

				// 更新标签内容模块到最新
				idIndex = this.getIdIndex(id);
				this.ids[idIndex]._id = modSettings;
			}

	    if (!modSettings.del) {
	      this.show2top(id);

	      // 刷新仅此一句
	      if (refresh === true) {
	      	this.refresh(id);
	      }

	      frame.show(id);
	    } else { // 找不到id了，目前出现的情况是父子级联动，父tab被关闭掉了，子级返回的时候报错
	      // 这样就打它重新打开，但同时产生一个问题是此模块是全新打开的，页面中所有子模块的打开将会重新打开，暂未处理
	      module.add(modSettings);
	    }
		},

		close: function(id, show) {
			var frame = app.frame;
			var router = app.router;
			var module = app.module;

			var current = router.current();
			var id = id, show = show;

			// router.to调用close时只传递一个参数过来且是false
			if (id === false) {
				id = current;
				show = false;
			}

			// 防止id都没传过来
			var id = id || current;

			var $tab = this.getDomById(id);

			// 移除标签DOM
			$tab.remove();

			// 调用frame的关闭方法，移除掉主内容区
			frame.close(id);

			// 显示出"下一个"标签页
			/*var idIndex = module.getIdIndex(id), nextMod;
			if (id === current) {				
        while(module.ids[--idIndex]) {
          nextMod = module.ids[idIndex];
          if (nextMod.del === false) { // 确保是非删除的模块
            // 把"下一个"show出来
            this.show(nextMod.id);
            break;
          }
        }
			}*/

      // 与v1版本不同，这里直接使用tab模块的ids来show
      var idIndex = this.getIdIndex(id);
      if (id === current && show !== false) {
      	this.show(this.ids[--idIndex].id);
    	}

			// 从模块队列中删除，作del=false的标记
    	module.del(id);
    	this.del(id);

    	// 有标签DOM移除，需要update
    	this.update();
		},

		refresh: function(id) {
			var router = app.router;
			var module = app.module;

			var id = id || router.current();

			var modSettings = module.getModuleById(id);
			var tabSettings;

			var idIndex = this.getIdIndex(id);

			// 标签是标签，承载的内容是承载的内容，两者可以分开来看
			// 标签用于控制展示和导航，而内容允许不断变化，但最新的内容是最后一次
			// 被写入到tab模块_id中的模块，如果指定的标签页没有_id属性则说明其承载的内容
			// 就是初始配置的内容即原始的模块
			// 能在tab模块的ids队列中找到说明是一个以新开方式打开的独立标签
			if (~idIndex) {
				// 这个标签的配置
				tabSettings = this.ids[idIndex];

				// 这个标签底下有没挂内容，如果它作为模块配置传递过去
				// 否则就把直接从module中出到的配置传递过去，这里有可能是一个独立的模块也有可以是
				// 挂载到某个独立标签下的模块
				modSettings = tabSettings._id || modSettings;
			}


			app.frame.refresh(modSettings);

		},

		// 有且只有一个设置成当前状态并且更新路由
		show2top: function(id) {
			var router = app.router;
			var $tab = this.getDomById(id);

	    // 设置路由来源模块ID
	    router.referrer(router.current());

	    // 设置路由当前模块ID
	    router.current(id);
	    
	    $tab.addClass('selected').siblings().removeClass('selected');

	    this.update();
		},

		update: function() {
			var page = app.page;

			var $tabSection = page.struct.tab;
			var $tabContainer = page.struct.tabContainer;

			var clientWidth = page.getClientWidth();
			var tabSectionOffset = $tabSection.offset();
			var tabContainerWidth = $tabContainer.outerWidth(true);

			var $tabItems = page.reloadStruct('tabItems');
			var $tabDropdown = page.struct.tabDropdown;

			var tabContainerMaxWidth = clientWidth - tabSectionOffset.left - $tabDropdown.outerWidth(true);

      var $tabItem = $tabItems.eq(0),
      	tabLength = $tabItems.length,
      	tabItemOuterWidthNow = $tabItem.outerWidth(true),
      	tabItemInnerWidthNow = $tabItem.width(),
      	tabItemOffsetWidth = tabItemOuterWidthNow - tabItemInnerWidthNow, // 补白和边框的宽度
      	tabItemWidthNew = Math.floor(tabContainerMaxWidth / tabLength) - tabItemOffsetWidth; // 平均分配后，可以设置给tab元素width的值

    	// 所有标签加起来的宽度 > 标签容器可用的宽度
			if (tabContainerWidth > tabContainerMaxWidth) {
				tabItemWidthNew = Math.max(tabItemWidthNew, this.minWidth);

				$tabItems.width(tabItemWidthNew);
			} else { // 标签容器能放得下所有标签
				tabItemWidthNew = Math.min(tabItemWidthNew, this.maxWidth);

	      $tabItems.width(tabItemWidthNew);
			}

		},

		// 获取tab组件容器
		container: function(reload) {
	    var $tabContainer;

	    var page = app.page;

	    if (!reload) {
	      $tabContainer = page.struct.tabContainer;
	    } else {
	      $tabContainer = page.reloadStruct('tabContainer');
	    }

	    return $tabContainer;
	  },

	  del: function(id) {
	  	var index = -1;
	  	for (var i = 0, tab; tab = this.ids[i]; i++) {
	      if (tab.id == id) {
	        index = i;
	      }
	    }
	    if (~index) {
				this.ids.splice(index, 1);
	    }
	  },

	  // 根据id来获取标签项的DOM
	  getDomById: function(id) {
	  	var router = app.router;

			var id = id, idPrefix = this.idPrefix;

			// 如果没有传递过来id，就到router模块中拿当前模块id
			if (!id) {
				id = router.current();
			}

	    if (!~id.indexOf(idPrefix)) {
	      id = idPrefix + id;
	    }
	    return $('#' + id);
	  },

	  // 根据DOM来获取模块id，去掉标签id前缀
	  getIdByDom: function(dom) {
	  	var id = dom.id, idPrefix = this.idPrefix;
	  	id = id.replace(this.idPrefix, '');
	  	return id;
	  },

	  // 根据id值获取索引
	  getIdIndex: function(id) {
	    for (var i = 0, tab; tab = this.ids[i]; i++) {
	      if (tab.id == id) {
	        return i;
	      }
	    }
	    return -1;
	  },

	  idPrefix: 'tab-',

		htmlTmpl: '<li class="page-tabs-item <% if (id == "home") {%>page-tabs-home<% } %>" id="<%=tabId%>" title="<%=tabTitle%>" role="tab"><span role="name"><%=tabName%></span><i class="close icon-cancel" role="close"></i></li>',

		// 构建功能菜单层并放置到body中
		buildFNMenu: function() {
			var self = this;

			var page = app.page;

			var $menuWrap = $('<div class="page-drop-down drop-down" id="tabFNMenu" pos="tabFNMenu"></div>').on('hide.fangyun', function() {
				$(this).hide();
			});
			var menuHTML = [];
			menuHTML.push('<p class="dorp-down-item" fn="close-all"><span>关闭全部</span></p>');
			menuHTML.push('<p class="hr"></p>');
			menuHTML.push('<div class="menu-scroll vscroll" role="list"></div>');

			// 构建出功能菜单的结构并放到body中去
			$menuWrap.html(menuHTML.join('')).appendTo('body');

			// 绑定事件
			$menuWrap.on('click', '[fn="close-all"]', function() { // 全部关闭
				var tab, ids = self.ids.slice(), i = 0, l = ids.length;
				for (; i < l; i++) {
	        tab = ids[i];
	        if (tab.id === 'home') {
	          continue; // 排除'home'
	        }        
	        self.close(tab.id);
	      }

	      // 隐藏掉菜单
	      $menuWrap.hide();
			}).on('click', '[role="tab"]', function() { // 点标签
				var id = $(this).attr('i');
				self.show(id);

				// 隐藏掉菜单
				$menuWrap.hide();
			}).on('click', '[role="close"]', function() { // 点关闭
				var id = $(this).closest('[role="tab"]').attr('i');
				
				self.close(id);

				// 隐藏掉菜单
				$menuWrap.hide();

				// 阻止冒泡防止执行到点标签去
				return false;
			});

		},

		// 展开功能菜单时触发，用tab列队更新菜单项和当前状态及定位设置
		// 参数btn是触发的按钮，要根据它来做定位
		showFNMenu: function(btn) {
			var page = app.page;
			var router = app.router;
			var $tabFNMenu = page.reloadStruct('tabFNMenu');

			var $btn = $(btn);
			var $tabFNMenuList = $tabFNMenu.find('[role="list"]');
			var tabFNMenuListHTML = [], itemHTML = '';
			var currentModId = router.current();

			// 更新菜单条目
			for (var i = 0, tab; tab = this.ids[i]; i++) {	
				itemHTML +=	'<p class="dorp-down-item'+ ((tab.id === currentModId) ? ' show-tag' : '') +'" i="'+ tab.id +'" role="tab">';				
				itemHTML +=	'<i class="tag"></i>';
				itemHTML +=	'<span>'+ tab.name +'</span>';
				if (tab.id != 'home') {
					itemHTML +=	'<i class="close icon-cancel" role="close"></i>';
				}
				itemHTML +=	'</p>';
				
				tabFNMenuListHTML.push(itemHTML);
				itemHTML = '';
	    }
	    $tabFNMenuList.html(tabFNMenuListHTML.join(''));

	    // 定位
	    var btnOffset = $btn.offset();

	    //$tabFNMenu.show();
	    var tabFNMenuWidth = $tabFNMenu.outerWidth(true),
	    	tabFNMenuHeight = $tabFNMenu.outerHeight(true),
	    	btnWidth = $btn.outerWidth(true),
	    	btnHeight = $btn.outerHeight(true);

	    $tabFNMenu.toggle().css({
	    	left: btnOffset.left - (tabFNMenuWidth - btnWidth),
	    	top: btnOffset.top + btnHeight
	    });

		},

		minWidth: 0,
		maxWidth: 80,

		ids: []
	};

	app.frame = {
		// 负责新开一个标签页
		open: function(id) {
			var self = this;

			var module = app.module;
			var page = app.page;
			var router = app.router;

			var modSettings = module.getModuleById(id);
			var modSrc = modSettings.src;
			var modId = modSettings.id;

			// v2版本新加入的属性，用于配置当前模块是叫什么
			// 直接关联解析机制中的交互解析，交互解析用这个名称去取得
			// 交互模块
			var modName = modSettings.name;

			var target = modSettings.target; // 标签打开方式

			// 把模块id作到url里，暴露给模板使用
			if (!~modSrc.indexOf('?')) {
	      modSrc = modSrc + '?__mid__=' + modId;
	    } else {
	      modSrc = modSrc + '&__mid__=' + modId;
	    }
	    
	    // 打破页面请求缓存，加上当前时间
	    if (!appConfig.cache) {
	      modSrc = modSrc + '&__ts__=' + FY.now();
	    }

	    // 把组织好的src记回到ids
	    module.setParam('_src', modSrc, id);

	    // 模块内容容器
			var $container = page.struct.container;

			// HTML内容包裹层
			var $wrap;

			if (modSettings.iframe === undefined || modSettings.iframe === false) { // ajax方式来加载页面
				this.getHTML(modSrc).done(function(html) {
					if (target === '_self' || target === 'main') { // 在当前标签打开，用当前包裹层来装载取到的HTML
						// 当前的包裹层
						$wrap = self.getDomById();

						if (target !== 'main') {
							// 重写当前包裹层内容
							$wrap.html(html);

							// 实现业务逻辑-整个frame区域
							app.implementation($wrap, modName);
						} else {
							// main区域
							$main = $wrap.find('[layout="main"]');

							// 只重写main区域
							$main.replaceWith(html);

							// replaceWith关联的仍是未替换前的元素，所以需要重新找一下拿到新元素
							$main = $wrap.find('[layout="main"]');
							
							// 实现业务逻辑-仅main区域
							app.implementation($main, modName);
						}

						// 做一次必要的update，因内容发生改变
						self.update();
					} else { // 新开标签来打开
						// 创建一个新的包裹层
						$wrap = $('<div id="'+ self.idPrefix + modId +'" layout="moduleContainer"></div>');

						// 追加到模块容器
						$container.append($wrap.append(html));

						// 实现业务逻辑-整个frame区域
						app.implementation($wrap, modName);

						// show包含了show2top和update
						self.show(id);
					}
				});
			} else { // iframe方式来加载页面
				var iframe = this.buildIframe(modSrc);
				$container.append($wrap.append(iframe));
			}

		},

		// 负责显示一个标签页
		show: function(id) {
			this.show2top(id); // 一定要先show2top
	    this.update(id);
		},

		close: function(id) {
			var $frame = this.getDomById(id);

			$frame.remove();
		},

		// modSettings，可能是一个独立的模块也可能是个附属的模块
		refresh: function(modSettings) {
			var self = this;
			var module = app.module;

			// 标签是标签，承载的内容是承载的内容，两者可以分开来看
			// 标签用于控制展示和导航，而内容允许不断变化，但最新的内容是最后一次
			// 被写入到tab模块_id中的模块，如果指定的标签页没有_id属性则说明其承载的内容
			// 就是初始配置的内容即原始的模块
			//var modSettings = tabSettings._id || module.getModuleById(tabSettings.id);

			var modSrc = modSettings._src, // 这里拿的是上一次打开时组织过的src
				target = modSettings.target;
			//console.log(modSettings);

			this.getHTML(modSrc).done(function(html) {
				// 当前的包裹层
				// 如果是个附属的模块则通过_tabid来取得所附属的包裹层
				$wrap = self.getDomById(modSettings._tabid || modSettings.id);

				if (target !== 'main') {
					// 重写当前包裹层内容
					$wrap.html(html);

					// 实现业务逻辑-整个frame区域
					app.implementation($wrap);
				} else {
					// main区域
					$main = $wrap.find('[layout="main"]');

					// 只重写main区域
					$main.replaceWith(html);

					// replaceWith关联的仍是未替换前的元素，所以需要重新找一下拿到新元素
					$main = $wrap.find('[layout="main"]');

					// 实现业务逻辑-仅main区域
					app.implementation($main);
				}

				// 做一次必要的update，因内容发生改变
				self.update();
			});

		},

		show2top: function(id) {
			var self = this;
	    var $frame = this.getDomById(id);

	    $frame.show().siblings().hide();
		},

		// 通过ajax方式去取得html
		getHTML: function(src) {
			var $readyState = app.page.struct.readyState;
			var request = $.ajax({
				url: src,
				type: 'get',
				dataType: 'html',
				beforeSend: function() {
					$readyState.show();
				},
				error: function(xhr, ts, e) {
					// todo 显示错误信息
				},
				complete: function(xhr, ts) {
					$readyState.hide();
				}
			});

			return request;
		},

		// 通过创建iframe的方式来加载页面
		buildIframe: function(src) {
			var $iframe = $('<iframe src="'+ src +'" scrolling="no" frameborder="0" class=""></iframe>');

			// todo 显示loading
			$iframe.on('load', function() {
				// todo 1.把提示层隐藏掉
			});

			// 返回iframe的原生dom
			return $iframe[0];
		},

		update: function(id, section) {
			var $frame = this.getDomById(id);
			var page = app.page;
			var pageStruct = page.struct;

			var $main = $frame.find('[layout="main"]'),
				$mainHD = $frame.find('[layout="mainHD"]:visible'),
				$mainBD = $frame.find('[layout="mainBD"]:visible'),
				$mainBDCont = $frame.find('[layout="mainBDCont"]:visible'),
				$mainFT = $frame.find('[layout="mainFT"]:visible'),
				$sidebar = $frame.find('[layout="sidebar"]:visible'),
				$sidebarHD = $frame.find('[layout="sidebarHD"]:visible'),
				$sidebarBD = $frame.find('[layout="sidebarBD"]:visible'),
				$sidebarBDCont = $frame.find('[layout="sidebarBDCont"]:visible'),
				$sidebarFT = $frame.find('[layout="sidebarFT"]:visible'),

				// 大标签的页面布局，整个main区域是包裹tab组件内的
				$tabPage = $frame.find('[layout="tabPage"]'),
				// 这个是tab组件内生成的tab标题栏，计算mainBD高度时需要减去的区域
				$tabPageTit = $tabPage.children('.tab');


			// 主内容区可用高度
			var frameInnerHeight = page.getFrameHeight();

			$frame.height(frameInnerHeight);

			if (section == undefined || section == 'main') {
				// main的可滚动区域可用高度
				var mainBDMaxHeight = frameInnerHeight
	      - ($mainHD.length ? $mainHD.outerHeight(true) : 0)
	      - ($mainFT.length ? $mainFT.outerHeight(true) : 0)
	      - ($tabPage.length ? $tabPageTit.outerHeight(true) : 0);

	      // main的可滚动区域实际高度即mainBDCont节点的高度
	      var mainBDNowHeight = $mainBDCont.outerHeight(true);

	      // 实现实际高度大于可用高度才出现滚动条否则去掉滚动样式并把高度写成实际高度
				if (mainBDNowHeight > mainBDMaxHeight) {
		      $mainBD.height(mainBDMaxHeight);
		      $mainBD.addClass('scroll');
		    } else {
		      $mainBD.height(mainBDNowHeight);
		      $mainBD.removeClass('scroll');
		    }
			}

			if (section == undefined || section == 'sidebar') {
				// sidebar的可滚动区域可用高度
				var sidebarBDMaxHeight = frameInnerHeight
	      - ($sidebarHD.length ? $sidebarHD.outerHeight(true) : 0)
	      - ($sidebarFT.length ? $sidebarFT.outerHeight(true) : 0);

	      // sidebar的可滚动区域实际高度即sidebarBDCont节点的高度
	      var sidebarBDNowHeight = $sidebarBDCont.outerHeight(true);

	      // 实现实际高度大于可用高度才出现滚动条否则去掉滚动样式并把高度写成实际高度
				if (sidebarBDNowHeight > sidebarBDMaxHeight) {
		      $sidebarBD.height(sidebarBDMaxHeight);
		      $sidebarBD.addClass('scroll');
		    } else {
		      $sidebarBD.height(sidebarBDNowHeight);
		      $sidebarBD.removeClass('scroll');
		    }
	  	}

		},

		getDomById: function(id) {
			var router = app.router;

			var tabIdPrefix = app.tab.idPrefix, frameIdPrefix = this.idPrefix;

			// 未传递id过来，则表示取当前frame的id
			if (!id) {
				id = router.current();
			}

	    var id = id.replace(tabIdPrefix, '');
	    id = id.replace(frameIdPrefix, '');
	    if (!~id.indexOf(frameIdPrefix)) {
	      id = frameIdPrefix + id;
	    }
	    return $('#' + id);
	  },

	  getFrameStruct: function(id) {
			var $frame = this.getDomById(id);

			return {
				main: $frame.find('[layout="main"]'),
				mainHD: $frame.find('[layout="mainHD"]'),
				mainBD: $frame.find('[layout="mainBD"]'),
				mainBDCont: $frame.find('[layout="mainBDCont"]'),
				mainFT: $frame.find('[layout="mainFT"]'),
				sidebar: $frame.find('[layout="sidebar"]'),
				sidebarHD: $frame.find('[layout="sidebarHD"]'),
				sidebarBD: $frame.find('[layout="sidebarBD"]'),
				sidebarBDCont: $frame.find('[layout="sidebarBDCont"]'),
				sidebarFT: $frame.find('[layout="sidebarFT"]')
			};
			
	  },

	  getMainWidth: function(id) {
	  	var frameStruct = this.getFrameStruct(id);

	  	var $main = frameStruct.main;

	  	return $main.width();
	  },

	  // 重生，内容区被重写过后
	  rebirth: function($scope) {
	  	var module = app.module;

	  	$('[m][auto]', $scope).each(function() {
	  		module.add(this);
	  	});
	  },

		idPrefix: 'frame-'

	};

	app.module = {
		init: function() {
			// 加载home			
			this.add({
				id: 'home',
			 	src:'ajax.php?html='+ appConfig.home,
			 	tabName:'首页',
			 	iframe: false,
			 	name: 'workbench'
		 	});
		},
		add: function() {
			var param = arguments[0]; // dom元素或原生对象
			var src, // 模块的url
			 tabName, // 标签显示的文字
			 tabTitle, // 标签的title文字
			 target, // 标签的打开方式，_blank表示新开，_self表示当前，默认_blank
			 section, // 更新的区域，默认nav+main，可指定仅更新main
			 iframe; // iframe模式，默认ajax模式

			var id; // 模块id

			var $dom;
						
			if (param.nodeType) { // 传递进来的是一个dom元素
				$dom = $(param);
				src = $dom.attr('m');
				tabName = $dom.attr('tabname') || $.trim($dom.text());
				tabTitle = $dom.attr('tabtitle');
				target = $dom.attr('target');
				section = $dom.attr('section');
				iframe = $dom.attr('iframe');
				name = $dom.attr('name');

				id = $dom.attr('i'); // 已经打开过才会自动生成此属性
				if (!id) {
					// 再做一层检测，为了是修补当此标签页被关闭了，但存在由
					// 此标签打开的从属标签页，当再次触发打开时会重复打开而检测不到已打开过
					// 原因是关闭后重新打开的标签页原本挂在dom上的标识也就找不回来了
					// 这一层检测是到模块长河中匹配是否有相同的模块url，如果有就认定是同一标签页
					id = this.getIdByUrl(src);

					if (!id) { // 确实是未打开过
						id = this.createId() + (this.ids.length + 1);
						$dom.attr('i', id); // 挂在dom上
					}
				}
			} else {
				src = param.src;
				tabName = param.tabName;
				tabTitle = param.tabTitle;
				target = param.target;
				section = param.section;
				iframe = param.iframe;
				name = param.name;

				id = param.id;

				if (!id) { // 未指定id则使用自动生成的id
					id = this.createId() + (this.ids.length + 1);
				}
			}

			if (!src) {
				throw new Error('模块url未定义');
			}

			var idIndex = this.getIdIndex(id);
	    if (!~idIndex) { // 未打开过的新模块，加到ids队列中
	      this.ids.push({
	        id: id,
	        src: src,
	        tabName: tabName,
	        tabTitle: tabTitle,
	        target: target,
	        section: section,
	        iframe: iframe,
	        name: name,
	        
	        del: false // 元数据，标记是否删除
	      });
	      // 打开一个新的标签页
	      app.tab.open(id);
	    } else {
	      if (this.ids[idIndex].del === true) { // 如果是被关闭的，要重新打开
	      	app.tab.open(id);
	      	this.ids[idIndex].del = false; // 更新标识
	      } else { // 否则直接显示
		      // 显示标签页
		      app.tab.show(id);
	      }
	    }

		},

		del: function(id) {	    
	    var index = this.getIdIndex(id);
    	this.ids[index].del = true;
	  },

	  setParam: function(k, v, id) {
			var index = this.getIdIndex(id);
    	this.ids[index][k] = v;
	  },

		createId: function() {
    	return new Date().getTime().toString(16);
  	},

  	getIdIndex: function(id) {
	    for (var i = 0, mod; mod = this.ids[i]; i++) {
	      if (mod.id == id) {
	        return i;
	      }
	    }
	    return -1;
	  },

	  getIdByUrl: function(url) {
			for (var i = 0, mod; mod = this.ids[i]; i++) {
	      if (mod.src == url) {
	        return mod.id;
	      }
	    }
	  },

		getIdIndex: function(id) {
	    for (var i = 0, mod; mod = this.ids[i]; i++) {
	      if (mod.id == id) {
	        return i;        
	      }
	    }
	    return -1;
	  },

	  getModuleById: function(id) {
	    for (var i = 0, mod; mod = this.ids[i]; i++) {
	      if (mod.id == id) {
	        return mod;
	      }
	    }
	  },

	  ids: []

	};


	/**
	 * 路由管理器
	 */
	app.router = {
	  back: function() {
	  	var referrer = this.referrer();
	  	app.tab.show(referrer);
	  },

	  go: function(id, refresh) {
	  	app.tab.show(id, refresh);
	  },

	  to: function() {
	  	var self = this;
    	var args = arguments;
    	var tourl = args[0], refresh = args[1], close = args[2], param = args[3], delay = args[4] * 1000;

			var callback; // 不管什么动作的方法，统一托管到这个局部量里来
	    var that; // 保存托管方法中this的指向
	    
	    if (FY.util.isString(tourl)) { // 认为是模块id
	      that = self;
	      callback = self.go; // 跳转到指定模块的方法，是否刷新只有在这里会做，并且在这里进到frame去刷新
	    }
	    
	    if (FY.util.isObject(tourl)) { // 认为是模块m
	      that = app.module;
	      callback = app.module.add; // 新打开一个模块的方法
	      refresh = false; // 肯定不需要刷新，且执行方法中也无视参数refresh
	      if (tourl.src && param) {
	        var _param = $.param(param);
	        if (!~tourl.src.indexOf('?')) {
	          tourl.src = tourl.src + '?' + _param;
	        } else {
	          tourl.src = tourl.src + '&' + _param;
	        }
	      }
	    }
	    
	    // 延时执行动作方法
	    setTimeout(function() {
	      // 这里执行close
	      if (close) {
	      	// 参数flase指明在close标签后不自动show出下一个
	      	// 因为即将发生的跳转会show出一个标签来
	        app.tab.close.call(app.tab, false); 
	      }
	      
	      callback.call(that, tourl, refresh); // 方法的执行
	      
	    }, delay);
	  },

	  current: function() {
	  	var args = arguments;
	    if (args.length) { // set
	      this._current = args[0];
	    } else { // get      
	      return this._current;
	    }
	  },

	  referrer: function(v) {
	  	var args = arguments;
	    if (args.length) { // set
	      this._referrer = args[0];
	    } else { // get
	      if (!this._referrer) {
	        // 拿不到的时候，取第一个模块，总是存在的而且是默认首页
	        //return app.module.ids[0];
	        return app.module.ids[0].id;
	      }
	      return this._referrer;
	    }
	  },

	  _current: null,
	  _referrer: null
	};


	/**
	 * 提供API给外部使用
	 */
	app.api = function(global) {
		var tab = this.tab;
		var module = this.module;
		var frame = this.frame;
		var router = this.router;

		global.loadModule = function() {
			module.add.apply(module, arguments);
		};

		global.Router = {
			back: function() {
				router.back.apply(router, arguments);
			},
			go: function() {
				router.go.apply(router, arguments);
			},
			to: function() {
				router.to.apply(router, arguments);
			}			
		};

		global.Tab = {
			close: function() {
				tab.close.apply(tab, arguments);
			},
			refresh: function() {
				tab.refresh.apply(tab, arguments);
			}
		};

		global.Frame = {
			// 更新框架(高度等)
			update: function() {
		    frame.update.apply(frame, arguments);
		  },

		  // 获得frame区域中的各个页面节点DOM
		  getStruct: function() {
		  	return frame.getFrameStruct.apply(frame, arguments);
		  },

		  // 获得整个frame区域，可指定id，未指定就拿到当前的
		  get: function() {
		  	return frame.getDomById.apply(frame, arguments);
		  }
		};

		// 更新框架(高度等)
	  global.updateFrame = function() {
	    frame.update.apply(frame, arguments);
	  };

	  // 获得layout="main"区域的宽度
	  global.getMainWidth = function() {
	  	return frame.getMainWidth.apply(frame, arguments);
	  };

	};

	// 实现业务
	app.implementation = function($scope, name) {
		var $scope = $scope,
			name = name;

		require(['parse'], function(parse) {
			parse.startup({
				scope: $scope,
				name: name
			});
		});
	};

	return app;
});