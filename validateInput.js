//表单验证组件
define(function(){
	var Module = Class.extend({
		
		$input : undefined,
        $tip: undefined,
        $tipValid : undefined,
        rule : undefined,
        isValid : true,

        isFloatSelector : false, //是否是弹出式选择器
        isFloatAlertShow: false, //弹出式选择器的特殊Alert

		init: function(args){
			//console.log(args);
			this.$input = $(args);

			var self = this;

			this.$input.data('validateInput', this);

			this.rule = eval('({' + this.$input.attr('rule') + '})');

			//console.log(this.rule);

			//checkbox验证
			if (this.rule.checkbox) {

				this.$input.find('input').on('change', function(){
					self.validate();
				});

			//select验证
			} else if (this.rule.select) {
				this.$input.on('change', function(){
					self.validate();
				});
			} else {
				this.$input.on('keyup', function(event){
					if(event.keyCode != 9){
						self.validate();
					}
				})
			}
		},

		validate: function(){
			if (this._validate()) {
				this.isValid = true;
				this.$input.removeClass('invalid');
				return true;
			} else {
				this.isValid = false;
				this.$input.addClass('invalid');
				return false;
			}
		},

		_validate: function(){
			var val = this.$input.val();
			var rule = this.rule;
			if (rule.select) {
				return !(this.$input[0].selectedIndex == 0);
			}
			if (rule.checkbox) {
				return Boolean(this.$input.find('input:checked').length);
			}
			if (rule.type) {
                if(rule.type == 'integer'){
                    val = parseInt(val); //console.log(val);
                    if(isNaN(val)){
                        val = '';
                    }
                    val = String(val);
                    this.$input.val(val);
                }
            }
            if (rule.maxLength) {
                this.$input.val(this.$input.val().substr(0, rule.maxLength));
            }
            if (rule.required) {
                if(val.trim().length == 0){
                    return false;
                }
                return true;
            }
		}

	});

	return Module;
});