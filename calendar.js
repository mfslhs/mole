/*
 * 
 * */

define(['bin/kalendae.standalone'], function() {
    var Module = Class.extend({


        $widget : undefined,

        widget : undefined,

        isShow : undefined,

        date : undefined,

        $dom : undefined,

        props: undefined,

        dateTemp : undefined, //记录点击的日期，只有经过验证才覆盖date

        init: function(args){
            // console.log(args);
            var self = this;
            this.$dom = $(args.container);
            this.date = [];
            var $widget = this.$widget = this.$dom;  
            
            $widget.attr('readonly', 'readonly');
            
            /*if( $widget.attr('props')){
                var props;
                this.props = props =  FY.parseProps($widget.attr('props')); //属性转换成对象
            }*/
            var props;
            this.props = props =  args;

            this._initLang();
            this._initKalendae();
        },

        _initKalendae : function(){
            var self = this;
            this.widget = new Kalendae.Input(this.$widget[0], self.props);
            this.widget.subscribe('show', function (date, action) {
                self._onShow();
            });
            this.widget.subscribe('hide', function (date, action) {
                self._onHide();
            });
            this.widget.subscribe('date-clicked', function (date, action) {
                self._onDateClick(date);
            });
        },

        _setDate : function(date1, date2, ignoreEvent){
            
            if(date1 == date2){ //当两次选中的值相同时
                this._initKalendae();
            }else{
                if(date1 > date2){
                    var temp = date1;
                    date1 = date2;
                    date2 = temp;
                }
                
                this._initKalendae();
            }
        },

        _onShow : function(){
            //console.log('onShow');
            this.isShow = true;
            this.dateTemp = [];
        },

        _onHide : function(){
            if(this.isShow){
                //console.log('onHide');
                this.isShow = false;
                var length = this.dateTemp.length;
                if(length == 2){ //当日历是范围时
                    this._setDate(this.dateTemp[0], this.dateTemp[1]);
                }else if(length == 1){ //只点击了一个日期
                    this._setDate(this.dateTemp[0], this.dateTemp[0]);
                }else if(length == 0){ //什么都没改
                }
            }
        },
        //当months>1时，点击两次关闭日历面板
        _onDateClick : function(date){
            var date = date._i;
            if (this.dateTemp.length == 0) {
                this.dateTemp[0] = date;
                //当months为1时，点一次关闭日历面板
                if (this.props.months == 1) {
                    this.$widget.blur();
                }
            } else if (this.dateTemp.length == 1){
                if (date >= this.dateTemp[0]) {
                    this.dateTemp[1] = date;
                } else {
                    this.dateTemp[1] = this.dateTemp[0];
                    this.dateTemp[0] = date;
                }
                this.$widget.blur();
            }
        },
        //基于moment.js初始化lang, 重写方法
        _initLang : function(){
            Kalendae.moment.lang('zh-cn', {
                months : "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
                monthsShort : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
                weekdays : "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
                weekdaysShort : "周日_周一_周二_周三_周四_周五_周六".split("_"),
                weekdaysMin : "日_一_二_三_四_五_六".split("_"),
                longDateFormat : {
                    LT : "Ah点mm",
                    L : "YYYY年MMMD日",
                    LL : "YYYY年MMMD日",
                    LLL : "YYYY年MMMD日LT",
                    LLLL : "YYYY年MMMD日ddddLT",
                    l : "YYYY年MMMD日",
                    ll : "YYYY年MMMD日",
                    lll : "YYYY年MMMD日LT",
                    llll : "YYYY年MMMD日ddddLT"
                },
                meridiem : function (hour, minute, isLower) {
                    if (hour < 9) {
                        return "早上";
                    } else if (hour < 11 && minute < 30) {
                        return "上午";
                    } else if (hour < 13 && minute < 30) {
                        return "中午";
                    } else if (hour < 18) {
                        return "下午";
                    } else {
                        return "晚上";
                    }
                },
                calendar : {
                    sameDay : '[今天]LT',
                    nextDay : '[明天]LT',
                    nextWeek : '[下]ddddLT',
                    lastDay : '[昨天]LT',
                    lastWeek : '[上]ddddLT',
                    sameElse : 'L'
                },
                ordinal : function (number, period) {
                    switch (period) {
                        case "d" :
                        case "D" :
                        case "DDD" :
                            return number + "日";
                        case "M" :
                            return number + "月";
                        case "w" :
                        case "W" :
                            return number + "周";
                        default :
                            return number;
                    }
                },
                relativeTime : {
                    future : "%s内",
                    past : "%s前",
                    s : "几秒",
                    m : "1分钟",
                    mm : "%d分钟",
                    h : "1小时",
                    hh : "%d小时",
                    d : "1天",
                    dd : "%d天",
                    M : "1个月",
                    MM : "%d个月",
                    y : "1年",
                    yy : "%d年"
                }
            });
        }
    });

    return Module;

});