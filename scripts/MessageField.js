function MessageField() {
	this.initialize.apply(this, arguments);
}

MessageField.prototype = new Text();

MessageField.prototype.Text_initialize = MessageField.prototype.initialize;

MessageField.prototype.initialize = function() {
	this.Text_initialize.apply(this, arguments);
	this.alpha = 0;
};

MessageField.prototype.slideUp = function(callback) {
	var self = this;
	this.originY = this.y;
	this.alpha = 1;
	$(document).bind('tick', function(e) {
		self.alpha -= 0.05;
		self.y -= 2;
		if (self.alpha <= 0) {
			self.alpha = 0;
			self.y = self.originY;
			$(document).unbind(e);
			callback && callback();
		}
	});
};