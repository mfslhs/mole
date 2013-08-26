/**
 * 解析组件和交互
 */

define({

	startup: function(args) {
		// 必要的配置信息，从app传递而来
		var options = args,
			$scope = options.scope, // 解析的范围
			name = options.name; // 交互模块的名称

		this.parseWidget($scope);

		// 指定有name才去解析交互 
		if (name) {
			this.parseInteraction($scope, name);
		}
	},

	// 解析组件
	parseWidget: function($scope) {
		var self = this;

		// 限定范围的目的
		// 1.防止同一组件在未被重新载入的情况下被解析多次
		// 2.精准解析范围
		// 依赖Frame.get()可能导致当前frame区域被改变而无法正常解析到，目前发现的情况是通过auto
		// 打开的标签页由于共享app中的router模块中的current，打开标签又是一个异步的操作，所以当current
		// 变更到最新的标签页时再来到这里解析就会出现拿到的是最新的frame区域而跳过原本设定的解析范围
		var $scope = $scope || Frame.get();

		var selectors = this.getWidgetSelector();

		$(selectors, $scope).each(function(i) {
			var $self = $(this), dom = this;
			var widget = $self.attr('widget');

			var widgetSettings = self.WIDGETS[widget];
			var module = 'widget/' + widgetSettings.module;

			var props = self.getWidgetProps(dom);
			
			var instance;
			require([module], function(Module) {
				// 作个性化参数设置
				if (widgetSettings.container !== false) {
					props.container = dom;
				}

				var widgetId = props.id;
				
				instance = new Module(props);

				if (widgetId) {
					window.widget[widgetId] = instance;
				}
			});

		});
	},

	// 解析交互
	parseInteraction: function($scope, name) {
		var $scope = $scope || Frame.get();

		var interactionSettings = this.INTERACTION[name];
		var module;

		if (interactionSettings) {
			module = 'interaction/' + interactionSettings.module;
			require([module], function(Module) {
				Module.main({
					scope: $scope
				});
			});
		}
		// console.log($scope, name, 'parseInteraction');
	},

	// 获取组件参数
	getWidgetProps: function(dom) {
		var props = $(dom).attr('props');
		return FY.parseProps(props);
	},

	// 获取组件选择器，多个以“,”分隔
	getWidgetSelector: function() {
		var widgets = this.WIDGETS;
		var selectors = [], selector;

		for (var k in widgets) {
			selector = '[widget="'+ k +'"]';

			selectors.push(selector);
		};

		return selectors.join(',');
	},

	// 组件队列，key部分是挂在DOM元素中的widget属性值
	WIDGETS: {
		treeMenu: {module: 'tree-menu'},
        grid : {module: 'grid'},
        pagination : {module: 'pagination'},
        selectorLevel : {module: 'selector-level'},
        selectorMulti : {module: 'selector-multi'},
        tab : {module: 'tab'},
        calendar : {module: 'calendar'},
        validate : {module: 'validate'}
	},
	
	// 交互队列
	INTERACTION: {
		workbench: {module: 'workbench'}
	}

});