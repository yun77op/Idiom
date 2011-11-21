(function(window) {

	var defaults = {
		prefix: ''
	};

	function AssetManger(defaults, callback) {
		this.options = $.extend({}, defaults, defaults);
		if (typeof callback != 'undefined') {
			this.options.callback = callback;
		}

		this.set(this.options);
		this.init();
	}

	AssetManger.prototype.init = function() {
		var self = this;
		this.cache = {};
		this.successCount = 0;
		this.failCount = 0;
		this.totalCount = _.keys(this.options.items).length;
		this.download(this.options.items);
	};

	AssetManger.prototype.download = function(items) {
		var self = this;
		$.each(items, function(name, src) {
			var img = new Image();
			
			img.onload = function() {
				self.successCount++;
				self.cache[name] = this;
				self._checkDone('success');
			};

			img.onerror = function() {
				self.failCount++;
				self._checkDone('error');
			};

			if (src.indexOf('http://') == -1 && src.indexOf('https://') == -1) {
				src = self.options.prefix + src;
			}

			img.src = src;
		});
	};

	AssetManger.prototype.getAsset = function(name) {
		return this.cache[name];
	};

	AssetManger.prototype._checkDone = function(status) {
		if (this.failCount + this.successCount == this.totalCount) {
			this.options.callback(status);
		}
	};

	AssetManger.prototype.set = function(key, value) {
		if (!key) { return; }
		if (typeof key == 'object') {
			var options = key;
			for (var i in options) {
				this._set(i, options[i]);
			}
		} else {
			this._set(key, value);
		}
	};
	
	AssetManger.prototype._set = function(key, value) {
		this.options[key] = value;
	};

	window.AssetManger = AssetManger;
})(window);