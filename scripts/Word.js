(function(window) {
	
	function Word(content) {
		this.initialize(content);
	}

	Word.prototype = new Container();
	Word.prototype.Container_initialize = Word.prototype.initialize;

	Word.prototype.initialize = function(text) {
		var self = this;
		this.Container_initialize();
		if (typeof text == 'undefined') {
			text = '';
		}
		
		this.containerShape = new Shape();
		this.addChild(this.containerShape);
		this.makeShape();		

		var textField = new Text(text, 'normal 20px SimSun', '#444');
		textField.x = 32;
		textField.y = 34;
		textField.textAlign = 'center';
		this.addChild(textField);

		this.textField = textField;
		this.selected = false;
		this.onPress = function(e) {
			if (self.active) { return; }
			var args = [self];
			if (!self.selected) {
				self.select();
			} else {
				args.push(true);
			}
			$(document).trigger('game:select', args);
			self.selected = !self.selected;
		};
	};

	Word.prototype.animate = function() {
		var self = this;
		var imgSeq = game.assetManger.getAsset('word');
		var bmpSeq = new BitmapSequence(new SpriteSheet(imgSeq, 64, 68));
		this.containerShape.graphics.clear();
		this.addChild(bmpSeq);
		this.active = true;
		$(document).bind('tick', function(e) {
			if (bmpSeq.currentFrame == 61) {
				$(document).unbind(e);
				self.removeChild(bmpSeq);
				self.visible = false;
				self.active = false;
			}
		});
	};


	Word.prototype.makeShape = function() {
		var g = this.containerShape.graphics;
		//TODO
		g.beginFill('#FFF').beginStroke("#000").setStrokeStyle(5).drawRect(0, 0, 64, 68);
	};

	Word.prototype.select = function() {
		var g = this.containerShape.graphics;
		g.setStrokeStyle(8).beginStroke("#F0F");
		g.beginRadialGradientFill(["#00c9ff","#A7D30C"], [0, 1], 32, 34, 10, 32, 34, 30);
		g.drawCircle(32, 34, 30);
	};

	window.Word = Word;
})(window);