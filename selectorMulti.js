/**
 *
 * 初始参数说明：
 * url:必须，请求基地址
 * data:必须，初始数据
 *
 */

define(['widget/float-layout', 'bin/jquery.pagination'], function(floatLayout) {
    var Module = Class.extend({

        $dom : undefined,

        $domShow : undefined,

        floatLayout : undefined,

        url : undefined,

        selectedData: [],

        dataCache: false,  //是否缓存数据

        dataIdKey: 'id', // 数据id键名

        dataNameKey: 'name', // 数据name键名

        dataItemTag: 'a', // 数据项标签

        pageParamName: 'p', // 分页参数的名称

        dataItemTmpl: '<a href="javascript:;" hidefoucs val="<%=id%>" title="<%=title%>"><em><%=name%></em><i></i></a>', // 数据项模板

        dataItemSelectedClass: 'selected', // 选择项样式类名
    
        dataItemSelectedDataName: 'selected', // 选择项数据名   

        linkTo: null, // 与xx联动，设置的是实例的id
    
        linkFrom: null, // 被xx联动，设置的是实例的id

        multiSelect: true, // 多/单选模式切换

        valRefInputName: 'vals', // 选择的值保存到哪，一般是input的name

        txtRefNode: null, // 文本写入区域

        init : function(args){
            var self = this;
            console.log(args);
            this.$dom = $(args.container);

            this.url = args['url'];
            this.selectedData = args['selectedData'] ? args['selectedData'] : [];  //初始化选中的值

            this.storeData = {};  //所有已经拉取到的数据
            this.dataParam = {}; // 拉取数据的参数

            this.$domShow = $('<div class="selector-layer"><div class="selectedWrap clearfix" role="selected"></div><div class="filter" role="search"><input type="text" class="in-t" name="" placeholder="关键字" /><span class="btn btn-search" role="searchBtn">搜 索</span></div><div class="data-list selector-tag clearfix" role="dataList"></div><div class="page" role="page"></div><div class="button"><a href="javascript:;" role="okBtn"><span class="btn btn-active btn-mini">保 存</span></a><a href="javascript:;" role="cancelBtn"><span class="btn btn-negative btn-mini">取 消</span></a></div></div>');
            this.floatLayout  = new floatLayout({
                $domClick: self.$dom,
                $domShow : self.$domShow,
                onOpen : function(){
                    self._onOpen();
                }
            });
            
            this.dataListSection = $('[role="dataList"]', this.$domShow);   //数据列表区
            this.selectedSection = $('[role="selected"]', this.$domShow);   //已选择区
            this.searchSection = $('[role="search"]', this.$domShow);       //搜索区
            this.pageSection = $('[role="page"]', this.$domShow);           //分页区
            this.okBtn = $('[role="okBtn"]', this.$domShow);                //确定
            this.cancelBtn = $('[role="cancelBtn"]', this.$domShow);        //取消

            // 文本值写入点
            if (!this.txtRefNode) {
                this.txtRefNode = this.$dom;
            }

            // id值写入点
            this.valRefInput = $(':input[name="'+ this.valRefInputName +'"]', this.$domShow);

            // 存在搜索，绑定相关操作
            if (this.searchSection.length) {
                $('[role="searchBtn"]', this.searchSection).click(function() {
                    self._search();
                    return false;
                });
            }

            this.dataListSection.on('click', this.dataItemTag, function(){
                self._select(this);
            });

             // 绑定已选择区删除
            this.selectedSection.on('click', this.dataItemTag + ' i', function() {
                self._unSelectItem($(this).closest(self.dataItemTag).get(0));
            });

            this.okBtn.on('click', function(){
                self._ok();
            });

            this.cancelBtn.on('click', function(){
                self._cancel();
            });
            
        },
        _onOpen: function(){
            //不要初始化就请求,当打开弹层时再请求
            this._get();
        },
        _get: function(){
            var self = this;
            var dataUrl = self.url;
            if (!this.dataCache) {
                if (!~dataUrl.indexOf('?')) {
                  dataUrl = dataUrl + '?' + new Date().getTime();;
                } else {
                  dataUrl = dataUrl + '&' + new Date().getTime();;
                }
            }
            $.getJSON(dataUrl, this.dataParam, function(data){
                self.data = data;
                self._saveData();   //保存数据
                self._fetch();
                self._init();   //初始化更新
            });
        },
        _search: function(){

        },
        _saveData: function(){
            for (var i = 0, data; data = this.data.list[i]; i++) {
                var id = data[this.dataIdKey];
                if (!this.storeData.hasOwnProperty(id)) {
                  this.storeData[id] = data;
                }
            }
        },
        _fetch: function(){
            var self = this;
            var dataItemsHtml = [];
            for (var i = 0, item; item = this.data.list[i]; i++) {
              var dataItem = JSTMPL(this.dataItemTmpl, {id: item[this.dataIdKey], name: item[this.dataNameKey]});
              dataItemsHtml.push(dataItem);
            }
            
            this.dataListSection.html(dataItemsHtml.join(''));

            // 没建立过页面才建立
            if (!this.dataParam[this.pageParamName]) {
                this._displayPage(this.data.page);
            }

            this._show();
            
            this._update();
        },
        _init: function(){
            var self = this;
            self.selectedSection.html('');
            $(this.dataItemTag, this.dataListSection).each(function() {
                var dataItem = $(this), dataItemInfo = self._getDataItemInfo(this);
                var dataItemVal = dataItemInfo.val, dataItemTitle = dataItemInfo.text;
                // 根据选中值更新选中样式
                if (self.selectedData.length > 0) {
                    for (var i = 0; i < self.selectedData.length; i++) {
                        var v = self.selectedData[i];
                        if (dataItemVal == v) {
                            dataItem.addClass(self.dataItemSelectedClass);
                            dataItem.data(self.dataItemSelectedDataName, true);
                            //console.log(dataItem[0]);
                            self.selectedSection.append(dataItem.clone());
                            self.selectedSection.find('i').addClass('icon-cancel');
                            break;
                        }
                    }
                }
                
            });
        },
        //数据选择区的select
        _select: function(dataItem){
            
            var $dataItem = $(dataItem), dataItemInfo = this._getDataItemInfo(dataItem);    
            if (dataItemInfo.selected) {     
              this._unSelectItem(dataItem);
            } else {
              this._selectItem(dataItem);
            }
        },
        //数据选择区的数据信息
        _getDataItemInfo: function(dataItem){
            var $dataItem = $(dataItem);
            return {
                val: $dataItem.attr('val'),
                text: $dataItem.text(),
                selected: $dataItem.data(this.dataItemSelectedDataName)
            };
        },
        //已选择区的数据信息
        _getSelectedItemInfo: function(selectedItem) {
            var $selectedItem = $(selectedItem);
            return {
                val: $selectedItem.attr('val'),
                text: $selectedItem.text()
            };
        },
        //select事件
        _selectItem: function(dataItem){
            var $dataItem = $(dataItem), dataItemInfo = this._getDataItemInfo(dataItem);
            var $selectedItem = $dataItem.clone().removeClass();      
            //多选
            if (this.multiSelect) {
                this.selectedData.push(dataItemInfo.val);
                $dataItem.addClass(this.dataItemSelectedClass);
                $dataItem.data(this.dataItemSelectedDataName, true);
                this.selectedSection.append($selectedItem);
            //单选
            } else {
                this.selectedData = [dataItemInfo.val];
                $dataItem.addClass(this.dataItemSelectedClass).data(this.dataItemSelectedDataName, true).siblings().removeClass(this.dataItemSelectedClass).data(this.dataItemSelectedDataName, false);
                this.selectedSection.html($selectedItem);
            }
            this.selectedSection.find('i').addClass('icon-cancel');
            this._update();
        },
        //取消select事件
        _unSelectItem: function(item){
            var $item = $(item), itemInfo;
            var fromParentRole = $item.parent().attr('role');
            var $selectedItem, $dataItem;
            
            if (fromParentRole == 'selected') {
                itemInfo = this._getSelectedItemInfo(item);
                $selectedItem = $item;
                $dataItem = $(this.dataItemTag + '[val="'+ itemInfo.val +'"]', this.dataListSection);
            } else if (fromParentRole == 'dataList') {
                itemInfo = this._getDataItemInfo(item, true);
                $dataItem = $item;
                $selectedItem = $(this.dataItemTag + '[val="'+ itemInfo.val +'"]', this.selectedSection);
            }
            $selectedItem.remove();
            $dataItem.removeClass(this.dataItemSelectedClass);
            $dataItem.data(this.dataItemSelectedDataName, false);
            this.selectedData.splice(this.selectedData.indexOf(itemInfo.val), 1);
            this._update();
        },
        _ok: function(){
            var self = this;

            if (this.valRefInput.length) {
                this.valRefInput.val(this.selectedData.join(','));
            } else {
                this.valRefInput = $('<input type="hidden" name="'+ this.valRefInputName +'" />');
                this.valRefInput.val(this.selectedData.join(',')).appendTo(this.$domShow);
            }
            // text值存储
            var selectedTxt = [];
            $(this.dataItemTag, this.selectedSection).each(function() {
              var info = self._getSelectedItemInfo(this);
              selectedTxt.push(info.text);
            });

            if (this.txtRefNode[0].tagName == "INPUT") {
              this.txtRefNode.val(selectedTxt.join(','));
            } else {
              this.txtRefNode.text(selectedTxt.join(','));
            }
            this.txtRefNode.attr('title', selectedTxt.join(', '));

            if (this.linkTo) {
                // 将自己选择的值作为参数附加到被联动的子级中
                var linkTos = this.linkTo.split(',');
                for (var i = 0, l = linkTos.length; i < l; i++) {
                    var to = linkTos[i];
                    if (to && widget.form[to]) {        
                        var linkToInst = widget.form[to];
                        linkToInst.dataParam[this.valRefInputName] = this.selectedData;
                        linkToInst.selectedSection.html('');
                        linkToInst.txtRefNode.val('');
                        linkToInst.updateSelectedData([]);
                    }
                }
            }

            this._hide();
        },
        _cancel: function(){
            this._hide();
        },
        _hide: function(){
            this.floatLayout.close();
        },
        // 分页callback
        _doPage: function(p, el) {      
            this.dataParam[this.pageParamName] = p;
            /*if (p == undefined) {
               self.__extraParams__.p = 0;
            }*/
            this._get();
        },
        // 调用分页组件显示分页
        _displayPage: function(config) {
            var self = this;
            this.pageSection.pagination(config.count, {
                callback: function(p, el) {
                    self._doPage(p, el);
                },
                items_per_page: config.size,
                link_to: 'javascript:;',
                prev_text: '上一页',
                next_text: '下一页',
                num_edge_entries: 2,
                num_display_entries: 2,
                load_first_page: false
            });
        },
        _show: function(){

        },
        _update: function(){
            
            //调整selector的视窗位置

            var offset = this.$domShow.offset();
            var width = this.$domShow.outerWidth(true);
            var height = this.$domShow.outerHeight(true);
            console.log(width, height);
            //调整水平超出宽度
            if (offset.left + width > $(window).width()) {
                this.$domShow.offset({left: $(window).width() - width - 20});
            }
            //调整垂直超出宽度
            if (offset.top + height > $(window).height()){
                this.$domShow.offset({top: $(window).height() - height - 40});
            }
        }

    });

    // 必须返回定义的模块
    return Module;
});
