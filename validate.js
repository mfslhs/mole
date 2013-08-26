//表单验证组件
define(['widget/validateInput'], function(validateInput){
	var Module = Class.extend({
		
		$dom: undefined,

		inputs : undefined,

		init: function(args){

			var self = this;

			this.$dom = $(args.container);
			
			this.$dom.data('widget', this);

			this.$dom.find('[role="confirm"]').on('click', function(){
				self.validateAll();
			});

			this.initInputs();
		},
		initInputs: function(){
			var self = this;
			
			this.inputs = [];

			this.$dom.find('[rule]').each(function(index){
				self.inputs[index] = new validateInput(this);
			})
		},
		validateAll: function(){
			console.log(this.inputs);
			for (var i = 0, len = this.inputs.length; i < len; i++) {
				this.inputs[i].validate();
				if(!this.inputs[i].isValid){
                    //console.log(i);
                    console.log(this.inputs[i]);
                    if (this.inputs[i].rule.checkbox) {
                        this.inputs[i].$input.children().eq(0).focus();
                    } else {
                        this.inputs[i].$input.focus();
                    }
                    return false;
                }
			}
			return true;
		}

	});

	return Module;
});