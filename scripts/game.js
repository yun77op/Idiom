(function(window) {
	var assetManger = new AssetManger({
		prefix: 'images/',
		items: {
			front: 'front.jpg',
			word: 'word-seq.png'
		}}, function() {
			game.setScene(frontScene);
		});

	var canvas = document.getElementById('game-canvas'),
			ctx = canvas.getContext('2d'),
			stage = new Stage(canvas),
			game = {},
			returnBtn = $('#game-return');

	game.tick = function() {
		$(document).trigger('tick');
		stage.update();
	};

	game.setScene = function(scene) {
		if (this.currentScene == scene) { return; }
		var prevScene = this.currentScene;
		prevScene.destory && prevScene.destory();
		scene.init();
		this.currentScene = scene;
	};

	game.start = function() {
		game.currentScene = loadingScene;
		game.currentScene.init();
		stage.update();
	};

	var loadingScene = (function() {
		return {
			init: function() {
				var text = new Text('Loading...', 'bold 20px Arial', '#000000');
				text.x = canvas.width * 2 / 3;
				text.y = canvas.height * 2 / 3;
				text.textAlign = "center";
				stage.addChild(text);

				stage.update();
			},
			
			destory: function() {
				stage.removeAllChildren();
				stage.update();
			}
		}	
	})();

	var frontScene = (function() {
		//menu
		var menu = {};
		menu.init = function() {
			var el = menu.el = $('#game-menu').hide().menu();

			el.delegate('a', 'click', function(e) {
				var fnName = $(this).attr('class').match(/game-menu-(\w+)(?:\s|$)/)[1];
				menu.el.hide();
				menu.fn[fnName]();
			});
		};

		/**
		 * @namespace
		 */
		menu.fn = {};

		menu.fn.settings = function() {
			var el = $('#ui-dialog-settings');
			el.dialog('open');
		};

		menu.fn.exit = function() {
			var text = new Text('Goodbye!', 'bold 30px Arial', '#FFFFFF');
			text.x = canvas.width / 2;
			text.y = canvas.height / 2;
			text.textAlign = "center";

			stage.addChild(text);
			Ticker.addListener(menu.fn.exit);
			menu.fn.exit.text = text;
		};

		menu.fn.exit.tick = function() {
			var text = menu.fn.exit.text;
			text.alpha -= 0.15;
			if (text.alpha < 0) {
				stage.removeChild(text);
				text.alpha = 1;
				Ticker.removeListener(menu.fn.exit);
			}
		};

		menu.fn.rank = function() {
			alert('Not yet implement!');
		};

		menu.fn.start = function() {
			game.setScene(levelScene);
		};


		function initSettings() {
			settings.registerNamespace('notification', '提示');
			settings.registerKey('notification', 'sound', '声音提示', false, []);
			var data = settings.data();
			var dialogSettings = new EJS({url: 'views/settings-dialog.ejs'}).render({settings: data});
			dialogSettings = $(dialogSettings);
			dialogSettings.hide().tabs().appendTo('body').dialog({
				autoOpen: false,
				title: '填单词游戏'
			});

			dialogSettings.delegate('input', 'change', function() {
				var o = $(this);
				var arr = o.attr('id').split('-');
				var ns = arr[1], key = arr[2], value;

				value = o.attr('type') == 'checkbox'? o.prop('checked') : o.val();
				Settings.set(ns, key, value);
			});

			if (!settings.get('notification', 'sound')) { return; }
			$.getScript('scripts/lib/soundmanager2-nodebug-jsmin.js', function() {
				soundManager.url = '/assets/';
				soundManager.onready(function(oStatus) {
					if (!oStatus.success) { return false; }
					var sound = soundManager.createSound({
						id: 'soundNotify',
						url: '/assets/notify.mp3'
					});
					$(document).bind('game:getScore', function(e) {
						sound.play();
					});
				});
				soundManager.beginDelayedInit();
			});
		}

		menu.init();
		initSettings();

		return {
			init: function() {
				var bitmap = new Bitmap(assetManger.getAsset('front'));
				stage.addChild(bitmap);
				menu.el.show();
				stage.update();
			},

			destory: function() {
				stage.removeAllChildren();
				stage.update();
				menu.el.hide();
			}
		};
	})();

	var levelScene = (function() {
		var el = $('#game-level-scene')
			.delegate('a', 'click', function(e) {
				e.preventDefault();
				if (!$(this).parent().hasClass('locked')) {
					game.setScene(mainScene);
					mainScene.start(parseInt($(this).text()));
				}
			});
		
		return {
			init: function() {
				el.show();
				returnBtn.click(function() {
					game.setScene(frontScene);
				}).show();

				var gameLevel = +localStorage.getItem('game_level');
				if (gameLevel > 0) {
					gameLevel--;
				}
				el.find('li:gt(' + gameLevel + ')').attr('class', 'locked');
			},
			
			destory: function() {
				el.hide();
				returnBtn.unbind('click').hide();
			}
		};
	})();

	var mainScene = (function() {
		var initList = {
			solveBtn: function() {
				var self = this;
				this.btnSolve = $('#game-solve').show().click(function() {
					if (~WORDS.indexOf(self.word.toLowerCase())) {
						var score = self.word.length * 3, word;
						game.messageField.text = '得到' + score + '分';
						game.messageField.slideUp();
						self.updateScore(score);
						$(document).trigger('game:getScore');
						while (word = self.wordAry.pop()) {
							word.animate();
						}
					}
				});
			},

			returnBtn: function() {
				var self = this;
				returnBtn.click(function() {
					if (self.score == 0 || confirm('确定要离开？')) {
						self.end();
						game.setScene(frontScene);
					}
				}).show();
			},

			dialog: function() {
				this.dialog = $('#game-dialog').dialog({
					autoOpen: false
				});
			},

			wordField: function() {
				var wordField = new Text('', 'bold 14px Arial', '#222');
				wordField.x = 0;
				wordField.y = 15;
				stage.addChild(wordField);
				this.wordField = wordField;
			},

			counterField: function() {
				var container = new Container();
				container.x = canvas.width / 2 + 50;
				container.y = 40;

				var counterField = new Text('', 'bold 14px Arial', '#222');
				counterField.x = 50;
				counterField.y = 0;

				var label = new Text('Count: ', 'bold 14px Arial', '#222');
				label.x = 0;
				label.y = 0;

				container.addChild(counterField);
				container.addChild(label);
				stage.addChild(container);

				this.counterField = counterField;
			},
			
			levelField: function() {
				var container = new Container();
				container.x = canvas.width / 2 + 50;
				container.y = 120;

				var label = new Text('Level: ', 'bold 14px Arial', '#222');
				label.x = 0;
				label.y = 0;

				var levelField = new Text('', 'bold 14px Arial', '#222');
				levelField.x = 50;
				levelField.y = 0;

				container.addChild(label);
				container.addChild(levelField);
				stage.addChild(container);
				this.levelField = levelField;
			},

			scoreField: function() {
				var barWidth = this.scoreBarWidth = 100;
				var container = new Container();
				container.x = canvas.width / 2 + 50;
				container.y = 80;

				var label = new Text('Score: ', 'bold 14px Arial', '#222');
				label.x = 0;
				label.y = 0;
				
				var scoreField = new Text('', 'bold 14px Arial', '#222');
				scoreField.x = barWidth + 60;
				scoreField.y = 0;

				var barContainer = new Shape();
				barContainer.x = 50;
				barContainer.y = -10;
				barContainer.graphics.beginStroke("#000").drawRect(0, 0, barWidth,
						10);

				var bar = new Shape();
				bar.x = 50;
				bar.y = -10;
				bar.graphics.beginLinearGradientFill(
						["#00F","#F00"],
						[0,1],
						0, 0,
						barWidth, 0).drawRect(0, 0,
						barWidth, 10);
				bar.scaleX = 0;

				container.addChild(label, barContainer, bar, scoreField);
				stage.addChild(container);

				this.scoreBar = bar;
				this.scoreField = scoreField;
			},

			containerField: function() {
				var count = 48, w = 64, h = 68,
						x, y = -40;
				var container = new Container();
				do {
					var word = new Word();
					if (count % 8 == 0) {
						x = 0;
						y += h;
					} else {
						x += w;
					}
					word.x = x;
					word.y = y;
					container.addChild(word);
				} while(--count);
				stage.addChild(container);
				this.containerField = container;
			},

			messageField: function() {
				var messageField = new MessageField('', 'bold 16px Arial', '#222');
				messageField.x = canvas.width / 2;
				messageField.y = canvas.height / 2;
				stage.addChild(messageField);
				game.messageField = messageField;
			}
		};

		var mainScene = {
			init: function() {
				//Bind Events
				$(document).bind('game:select', _.bind(this.select, this));
				this.totalLevel = _.keys(this.levelData).length;
				for (var i in initList) {
					initList[i].call(mainScene);	
				}
			},

			destory: function() {
				stage.removeAllChildren();
				stage.update();
				$(document).unbind('game:select');
				returnBtn.hide().unbind('click');
				this.btnSolve.hide().unbind('click');
			}
		};

		return mainScene;
	})();

	mainScene.levelData = [{
			time: 60,
			score: 50
		}, {
			time: 40,
			score: 60
		}
	];

	mainScene.start = function(level) {
		var levelData = this.levelData[level - 1];
		if (!levelData) {
			return alert('最后一关了');
		}
		this.currentLevel = level;
		this.wordAry = [];
		
		this.draw();
		this.setupScore(levelData.score);
		this.setupTimer(levelData.time);

		this.levelField.text = level;
		game.messageField.text = '开始关卡' + level;
		game.messageField.slideUp();
		Ticker.addListener(game);
	};

	mainScene.draw = function() {
		var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', count = 48, word;
		while(~--count) {
			word = this.containerField.getChildAt(count);
			word.visible = true;
			word.textField.text = c[Math.floor(Math.random() * c.length)];
		}
	};

	mainScene.setupTimer = function(time) {
		var self = this;
		this.timer = window.setInterval(function() {
			self.counterField.text = --time;
			if (!time) {
				self.end('timeout');
			}
		}, 1000);
	};

	mainScene.setupScore = function(score) {
		this.score = 0;
		this.totalScore = score;
		this.scoreField.text = score;
	};

	mainScene.updateScore = function(score) {
		this.score += score;
		var w = this.score / this.totalScore * this.scoreBarWidth, r;
		if(w >= 100) {
			r = 1;
			this.end('success');
		} else {
			r = w / 100;
		}
		this.scoreBar.scaleX = r;
	};

	mainScene.select = function(e, word, reverse) {
		if (reverse) {
			var i = word.order, j = this.wordAry.length;
			while(i <= (--j)) {
				this.wordAry[j].makeShape();
			}
			this.wordAry = this.wordAry.slice(0, i);
		} else {
			word.order = this.wordAry.length;
			this.wordAry.push(word);
		}

		this.word = _.map(this.wordAry, function(word) {
			return word.textField.text;
		}).join('');
		
		this.wordField.text = this.word;
	};

	mainScene.end = function(type) {
		window.clearInterval(this.timer);
		var text, self = this;
		switch (type) {
			case 'success':
				text = '闯关成功！';
				game.messageField.slideUp();
				this.dialog.text('恭喜，闯关第' + this.currentLevel + '关成功！').dialog('option', 'buttons', [
						{
							text: "返回关卡列表",
							click: function() {
								$(this).dialog("close");
								game.setScene(levelScene);
							}
						},
						{
							text: "下一关",
							click: function() {
								$(this).dialog("close");
								self.start(self.currentLevel + 1);
							}
						}
				]).dialog('open');
				var gameLevel = +localStorage.getItem('game_level');
				if (game.curretnLevel > gameLevel) {
					localStorage.setItem('game_level', game.curretnLevel);
				}
				break;
			case 'timeout':
				text = 'OPS！时间到了';
				this.dialog.text('OPS！闯关第' + this.currentLevel + '关失败！').dialog('option', 'buttons', [
						{
							text: "返回关卡列表",
							click: function() {
								$(this).dialog("close");
								game.setScene(levelScene);
							}
						},
						{
							text: "重玩",
							click: function() {
								$(this).dialog("close");
								self.start(self.currentLevel);
							}
						}
				]).dialog('open');
				break;
		}
		if (text) {
			game.messageField.text = text;
			game.messageField.slideUp(function() {
				Ticker.removeListener(game);
			});
		} else {
			Ticker.removeListener(game);
		}
	};

	game.start();
	game.assetManger = assetManger;
	window.game = game;
})(window);