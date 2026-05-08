
//【新标签、新时机】
"use strict";
window.yzs = function (lib, game, ui, get, ai, _status) {
	//-----------吟唱------------//
	//本机制原出自扩展《恒宇苍穹》(扩展作者：苍宇)，由“终日羽禁”完成，“白银山幽灵”修复bug，本扩展仅作搬运和部分修改
	/*
	新增吟唱效果，形如player.setCountDown(num, command, prompt);
	输入值均为必选，顺序不可以调换：
	————————————
	也可直接传入{}类型，比如
	player.setCountDown({
		num: 2,
		command: {
			async todu(player) {
				await player.draw();
			},
			list: [player],
		},
		prompt: "摸一张牌",
		skill: "exampleSkill",
	});
	来添加一个持有自定义属性的咏唱，如item.skill == "exampleSkill"的咏唱
	————————————
	吟唱回合数num：必须是整数，当然不是也行，不过我不能保证会发生什么
	描述prompt：对于吟唱完毕的效果的简要描述，用于上面的技能的显示
	吟唱完毕后执行的命令command：形如{
		todo:function(xxx){yyy},
		list:[xxx],
	}
	todo是要执行的函数体，list是会用到的参数数组，后续会给出两个实例帮助理解
	描述prompt：对于吟唱完毕的效果的简要描述，用于上面的技能的显示，方便随时观看正在进行的吟唱的效
	实例1：令玩家摸一张牌
	{
		todo:function(player){
			player.draw();//如果要使用player，一定要传参数传进来，不能直接调用，不可以用this，但是可以用_status.event.player
		},
		list:[player],//注意：即使todo没有任何需要的参数，这里也必须写成空数组，不能不写或者undefined
	}
	实例2：预先指定的角色A弃置预先指定的角色B一定量的牌
	{
		todo:function(target1,target2,num){
			target1.discardPlayerCard(target2,num,true);
		}
		list:[xxx,yyy,2];//list里面的参数顺序必须严格对应function里面的形参

	值得注意的是，这个函数是有返回值的，返回值是这样的形式：{
		num:1,
		command:{
			todo:function(xxx){yyy},
			list:[xxx],
		},
		prompt:"zzz",
	}
	如果你想要单独加速某一个吟唱效果，建议你记录此吟唱效果的返回值，后续会提到
	当然你不记录也可以，所有进行中的吟唱被记录在数组player.yzs_countDowns里面，你也可以检索所需要的
	*/
	//新增吟唱
	lib.get.cdValue=function(item, player) {
		player ??= get.player();
		if ("value" in item) {
			return item.value(item, player);
		}
		return 1;
	},
	lib.element.player.yzs_setCountDown=async function(num, command, prompt, tag = []) {
		this.storage.yzs_countDowns ??= [];
		let id;
		if (!Array.isArray(tag)) {
			tag = [tag];
		}
		let item = arguments.length == 1 ? num : {
			num: num,
			command: command,
			prompt: prompt,
			tag: tag,
		};
		for (let i = 0; i < tag.length; i++) {
			if (typeof tag == "string" && tag.indexOf(":") >= 0) {
				const [key, value] = tag.split(":");
				item[key] = value;
			}
		}
		while (!id || this.storage.yzs_countDowns.some(count => count.id == id)) {
			id = Math.random().toString(36).slice(-8);
		}
		item.id = id;
		const next = game.createEvent("yzs_setCountDown");
		next.countDown = item;
		next.id = id;
		next.player = this;
		next.setContent(async (event, trigger, player) => {
			const { countDown } = event;
			player.storage.yzs_countDowns.push(countDown);
			player.yzs_refreshCountDown();
		});
		return next;
	};
	/*
	用于更新吟唱剩余回合数的函数，形如player.yzs_updateCountDown();
	输入值link不是必选，无输入的情况下默认更新所有的吟唱效果
	第二个输入值count用于判定要减少的回合数
	有输入值的情况下只更新对应的吟唱效果，输入值为需要更新咏唱的id，或输入一个function方法来更新符合条件的咏唱
	如果你前面记录了yzs_setCountDown函数的返回值，你可以直接作为参数使用
	*/
	//更新吟唱剩余回合数
	lib.element.player.yzs_updateCountDown=async function(link, count = 1) {
		const player = this;
		if (Array.isArray(link)) {
			for (const item of link) {
				await this.yzs_updateCountDown(item, count);
			}
			return;
		}
		player.storage.yzs_countDowns ??= [];
		if (player.storage.yzs_countDowns.length) {
			await game.doAsyncInOrder(player.storage.yzs_countDowns, async item => {
				if (link) {
					if (typeof link == "number" && item.id != link) {
						return;
					} else if (typeof link == "function" && !link(item)) {
						return;
					} else if (link != item) {
						return;
					}
				}
				if (count === "all") {
					count = item.num;
				}
				if (typeof count !== "number") {
					count = 1;
				}
				count = Math.min(item.num, count);
				const next = game.createEvent("yzs_updateCountDown");
				next.countDown = item;
				next.player = this;
				next.num = count;
				next.setContent(async (event, trigger, player) => {
					const { countDown, num } = event;
					countDown.num -= num;
					event.set("finalNum", countDown.num);
					player.yzs_refreshCountDown();
				});
				await next;
			}, () => 1);
		}
		const list = player.storage.yzs_countDowns.filter(item => item.num <= 0);
		if (list.length) {
			await game.doAsyncInOrder(list, async item => {
				await player.yzs_executeCountDown(item);
			}, () => 1);
		}
	};
	//清除吟唱效果
	lib.element.player.yzs_clearCountDown = async function (link) {
		if (Array.isArray(link)) {
			for (const item of link) {
				await this.yzs_clearCountDown(item);
			}
			return;
		}
		const next = game.createEvent("yzs_clearCountDown");
		next.countDown = link;
		next.player = this;
		next.setContent(async (event, trigger, player) => {
			const { countDown } = event;
			player.storage.yzs_countDowns.remove(countDown);
			player.yzs_refreshCountDown();
		});
		return next;
	};
	/*
	执行对应的吟唱效果
	除非你确定你清楚你在做什么，否则此函数不应被修改或调用
	*/
	//执行吟唱效果
	lib.element.player.yzs_executeCountDown = async function (link) {
		const next = game.createEvent("yzs_executeCountDown");
		next.countDown = link;
		next.player = this;
		next.skill=link.skill||""
		next.setContent(async (event, trigger, player) => {
			const { countDown: link } = event;
			try {
				let str = `执行了吟唱：`;
				if ("name" in link) {
					str = `${str}<span style='color: #f1e48e'>${get.translation(link.name || "吟唱")}</span>`;
				}
				game.log(player, str, `：${link.prompt}`);
				if (!link.once) {
					link.num = link.repeatNum;
				} else {
					await player.yzs_clearCountDown(link);
				}
				const result = link.command.todo(...link.command.list);
				if (result instanceof Promise) {
					await result;
				}
			} catch (error) {
				console.error("Error:", error);
			}
		});
		return next;
	};
	//刷新吟唱标记
	lib.element.player.yzs_refreshCountDown = async function () {
		this.storage.yzs_countDowns ??= [];
		game.broadcastAll((player, list) => player.storage.yzs_countDowns = list, this, this.storage.yzs_countDowns);
		if (this.storage.yzs_countDowns.length) {
			this.markSkill("yzs_countDowns");
		} else {
			this.unmarkSkill("yzs_countDowns");
		}
		return this;
	};
	/*判断是否持有咏唱
		传入function方法来判断是否持有符合条件的咏唱
		eg:持有tag包含"refresh"的咏唱
		player.yzs_hasCountDown(item => item?.tag?.includes("refresh"));
	*/
	lib.element.player.yzs_hasCountDown = function (func = lib.filter.all) {
		this.storage.yzs_countDowns ??= [];
		if (typeof func == "string") {
			func = item => item?.tag?.includes(func);
		}
		return this.storage.yzs_countDowns.some(func);
	};
	lib.element.player.yzs_getCountDown = function (func = lib.filter.all) {
		this.storage.yzs_countDowns ??= [];
		if (typeof func == "string") {
			func = item => item?.tag?.includes(func);
		}
		return this.storage.yzs_countDowns.filter(func);
	};

    Object.assign(lib.message.server, {
        yzs_shunfaji(name) {
            if (lib.node.observing.includes(this)) {
                return;
            };
            const player = lib.playerOL[this.id];
            if (player) {
                player.yzs_UseShunfaji(name);
            };
       }
	});
	Object.assign(game, {
		yzs_swapPlayerOL(player, target) {
			if (!_status.connectMode || player == target || !player || !target) return;

			const [playerid, targetid] = [player.playerid, target.playerid];
			[target.ws, player.ws] = [player.ws, target.ws];

			lib.wsOL[targetid] = player.ws?.ws;
			lib.wsOL[playerid] = target.ws?.ws;

			for (const key in lib.hook) {
				const hasPlayer = key.startsWith(playerid);
				const hasTarget = key.startsWith(targetid);
				if (hasPlayer || hasTarget) {
					const newKey = key.replace(new RegExp(`^${hasPlayer ? playerid : targetid}`), hasPlayer ? targetid : playerid);
					lib.hook[newKey] = lib.hook[key];
					delete lib.hook[key];
				};
			};

			game.broadcastAll((player, target, playerid, targetid) => {
				const handleBroadcast = () => {
					if ([player, target].includes(game.me)) {
						const source = game.me == target ? player : target;
						const sourceid = game.me == target ? playerid : targetid;

						game.swapPlayerAuto(source);
						game.onlineID = game.wsid = sourceid;

						if (!_status.auto) {
							ui.click.auto('forced');
							ui.click.auto('forced');
						};
					};
				};

				const swapCoreData = () => {
					[target.nickname, player.nickname] = [player.nickname, target.nickname];
					const [playerNickname, targetNickname] = [player.node.nameol.innerHTML, target.node.nameol.innerHTML];

					player.setNickname(targetNickname);
					target.setNickname(playerNickname);

					[player.playerid, target.playerid] = [targetid, playerid];
					lib.playerOL[targetid] = player;
					lib.playerOL[playerid] = target;
				};
				handleBroadcast();
				swapCoreData();
			}, player, target, playerid, targetid);
		}
	});

	// 联机在武将头像上播放gif动画（修改版：中心对齐 + 坐标偏移）
	lib.element.player.playGifOL = function(){
		const player = this;
		const args = Array.from(arguments);

		// 默认值
		let path = '';
		let length = 200, height = 200; // 尺寸默认值
		let x = 0, y = 0;               // 偏移默认值
		let duration = 2000;            // 时长默认值

		let arrayCount = 0; // 用于区分第几个数组

		for(const arg of args) {
			if (typeof arg === 'string') {
				// 识别路径：包含斜杠或后缀名，且不是单纯的数字字符串
				if (arg.includes('.') || arg.includes('/')) {
					path = arg;
				}
			} else if (Array.isArray(arg)) {
				// 识别数组
				arrayCount++;
				if (arrayCount === 1) {
					// 第一个数组分配给 [长, 宽]
					length = arg[0] ?? 200;
					height = arg[1] ?? length; // 如果只填了一个，宽默认等于长
				} else if (arrayCount === 2) {
					// 第二个数组分配给 [x, y]
					x = arg[0] ?? 0;
					y = arg[1] ?? 0;
				}
			} else if (typeof arg === 'number') {
				// 单独的数字识别为时长
				duration = arg;
			}
		}

		if(!path) return;

		const imagePath = lib.assetURL + path;

		game.broadcastAll((imagePath, length, height, duration, x, y, player) => {
			const gifContainer = document.createElement('div');
			gifContainer.className = 'gif-animation-container';

			// 核心居中逻辑
			Object.assign(gifContainer.style, {
				position: 'absolute',
				top: '50%',
				left: '50%',
				width: length + 'px',
				height: height + 'px',
				// 使用 translate 使图片几何中心对齐头像框中心，再叠加 [x, y] 偏移
				transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
				zIndex: '1000',
				pointerEvents: 'none',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			});

			const gifImg = document.createElement('img');
			gifImg.src = imagePath;
			Object.assign(gifImg.style, {
				width: '100%',
				height: '100%',
				objectFit: 'cover',
				pointerEvents: 'none'
			});

			gifContainer.appendChild(gifImg);
			player.appendChild(gifContainer);

			const actualDuration = duration || 2000;

			// 定时移除
			setTimeout(() => {
				if (gifContainer.parentNode) {
					gifContainer.parentNode.removeChild(gifContainer);
				}
			}, actualDuration);

			// 淡出动画
			setTimeout(() => {
				gifContainer.animate([
					{ opacity: 1 }, { opacity: 0 }
				], {
					duration: 300,
					easing: 'ease-out',
					fill: 'forwards'
				});
			}, Math.max(0, actualDuration - 300));
		}, imagePath, length, height, duration, x, y, player);
	};
	//联机在武将头像上播放CSS动画
	/*func例：爆炸特效(AI提示词：以下函数实现了在玩家头像框上播放爆炸动画的效果，我现在希望你不更改函数的参数表，将此函数实现的动画效果改为……)
	  func = function (targetPlayer) {
			// 创建爆炸容器
			const explosion = document.createElement('div');
			explosion.className = 'explosion-effect';

			// 设置爆炸样式
			Object.assign(explosion.style, {
				position: 'absolute',
				top: '-20px',
				left: '50%',
				transform: 'translateX(-50%)',
				width: '100px',
				height: '100px',
				zIndex: '1000',
				pointerEvents: 'none'
			});

			// 插入到玩家头像容器
			targetPlayer.appendChild(explosion);

			// 创建爆炸粒子

			// 动画结束后移除
			setTimeout(() => {
				if (explosion.parentNode) {
					explosion.parentNode.removeChild(explosion);
				}
			}, 800);
			const colors = ['#ff0000', '#ff8800', '#ffff00', '#ff6600'];
			const particleCount = 20;

			for (let i = 0; i < particleCount; i++) {
				const particle = document.createElement('div');
				particle.className = 'explosion-particle';

				// 随机大小
				const size = Math.random() * 300 + 5;
				const color = colors[Math.floor(Math.random() * colors.length)];

				Object.assign(particle.style, {
					position: 'absolute',
					width: `${size}px`,
					height: `${size}px`,
					background: color,
					borderRadius: '50%',
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
					opacity: '0',
					boxShadow: `0 0 ${size}px ${color}`
				});

				explosion.appendChild(particle);

				// 粒子动画
				const angle = (Math.random() * Math.PI * 2);
				const distance = Math.random() * 40 + 30;
				const duration = Math.random() * 300 + 400;

				const animation = particle.animate([
					{
						opacity: 0,
						transform: 'translate(-50%, -50%) scale(0)'
					},
					{
						opacity: 1,
						transform: 'translate(-50%, -50%) scale(1)'
					},
					{
						opacity: 0,
						transform: `translate(${-50 + Math.cos(angle) * distance}%, ${-50 + Math.sin(angle) * distance}%) scale(0.2)`
					}
				], {
					duration: duration,
					easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
				});

				animation.onfinish = () => {
					if (particle.parentNode) {
						particle.parentNode.removeChild(particle);
					}
				};
			}
			// 添加到全局CSS
			if (!document.querySelector('#explosion-style')) {
				const style = document.createElement('style');
				style.id = 'explosion-style';
				style.textContent = `
								@keyframes explosionPulse {
									0% { transform: translateX(-50%) scale(0); opacity: 0; }
									50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
									100% { transform: translateX(-50%) scale(1); opacity: 0; }
								}
            
								.explosion-wave {
									position: absolute;
									width: 80px;
									height: 80px;
									border-radius: 50%;
									border: 4px solid #ff4400;
									opacity: 0;
									left: 50%;
									top: 50%;
									transform: translate(-50%, -50%);
									animation: explosionPulse 0.6s ease-out;
								}
							`;
				document.head.appendChild(style);
			}
		}
	 */
	lib.element.player.playEffectOL = function () {
		let targets = [this]
		let func = () => { };
		const args = Array.from(arguments);
		for (const arg of args) {
			if (typeof arg === 'function') {
				func = arg;
			} else if (get.itemtype(arg) == "players") {
				targets=targets.concat(arg)
			} else if (get.itemtype(arg) == "player") {
				targets.push(arg)
			}
		}
		game.broadcastAll((func, targets) => {
			func(...targets.flat());
		}, func, targets);
	}

	lib.skill.removeBgmOL = {
		charlotte: true,
		forced: true,
		priority: 213412,
		forceDie: true,
		forceOut: true,
		popup: false,
		onremove(player) {
			if (_status.tempMusic != player.storage.removeBgmOL) return;
			game.broadcastAll(() => {
				delete _status.tempMusic;
				game.playBackgroundMusic();
			});
			delete player.storage.removeBgmOL;
			player.markSkill("removeBgmOL")
		},
		trigger: {
			player: "die"
		},
		filter(event, player) {
			return _status.tempMusic = player.storage.removeBgmOL;
		},
		async content(event,trigger,player) {
			game.broadcastAll(() => {
				delete _status.tempMusic;
				game.playBackgroundMusic();
			});
			delete player.storage.removeBgmOL;
			player.markSkill("removeBgmOL")
			player.removeSkill("removeBgmOL")
		}
	};
	//联机切换bgm(持续时间到特定游戏时机或玩家死亡)
	lib.element.player.addTempBgmOL = function (path, expire) {
		const player = this;
		//path例："ext:一中杀/audio/End Like This.mp3"
		game.broadcastAll((path) => {
			_status.tempMusic = path;
			game.playBackgroundMusic();
		},path);
		player.addTempSkill("removeBgmOL", expire)
		player.setStorage("removeBgmOL", path);
	};

	lib.skill.removeBackGroundOL = {
		charlotte: true,
		forced: true,
		forceDie: true,
		forceOut: true,
		priority:213412,
		popup: false,
		onremove(player) {
			if (!player.storage.removeBackGroundOL) return;
			game.broadcastAll((id) => {
				var img = document.getElementById(id);
				if (img) {
					img.style.opacity = "0";
					setTimeout(() => {
						img.remove(); // 渐隐后移除
					}, 600);
				}
			}, player.storage.removeBackGroundOL);
			delete player.storage.removeBackGroundOL;
			player.markSkill("removeBackGroundOL")
		},
		trigger: {
			player: "die"
		},
		filter(event, player) {
			if (!player.storage.removeBackGroundOL) return false;
			return true
		},
		async content(event,trigger,player) {
			game.broadcastAll((id) => {
				var img = document.getElementById(id);
				if (img) {
					img.style.opacity = "0";
					setTimeout(() => {
						img.remove(); // 渐隐后移除
					}, 600);
				}
			}, player.storage.removeBackGroundOL);
			delete player.storage.removeBackGroundOL;
			player.markSkill("removeBackGroundOL")
			player.removeSkill("removeBackGroundOL")
		}
	};
	//联机切换背景图片(持续时间到特定游戏时机或玩家死亡)
	lib.element.player.addTempBackGroundOL = function (path, zIndex = "0", expire) {
		const player = this;
		var imagePath = lib.assetURL + path;//例："/extension/一中杀/image/background/BitetheDust_yzs.gif"
		// 创建一个唯一的ID来标识这个背景
		var id = Math.random().toString(36).slice(-8);

		// 2. 广播创建图片
		game.broadcastAll((imagePath, zIndex, id) => {
			var img = document.createElement("img");
			img.id = id; // 给图片加上唯一标识
			img.src = imagePath;
			img.style.position = "fixed";
			img.style.left = "0";
			img.style.top = "0";
			img.style.width = "100%";
			img.style.height = "100%";
			img.style.objectFit = "cover";
			img.style.zIndex = zIndex;
			img.style.opacity = 0;
			img.style.pointerEvents = "none";
			img.style.transition = "opacity 0.5s ease-out";
			document.body.appendChild(img);
			setTimeout(() => {
				img.style.opacity = "1";
			}, 50);
		}, imagePath, zIndex, id);

		// 3. 将 ID 存入 player 的 storage 供后续调用
		player.setStorage("removeBackGroundOL", id);
		player.addTempSkill("removeBackGroundOL", expire);
	};
	//本地播放弹幕
	lib.game.createDanMu=async function(str = '', num = 1,duration=10) {
		// 1. 初始化容器
		if (!ui.bulletScreen) {
			ui.bulletScreen = ui.create.div('.bulletScreen', document.body);
			ui.bulletScreen.css({
				width: "100%",
				height: "100%",
				left: "0",
				top: "0",
				pointerEvents: "none",
				zIndex: "100",
				overflow: "hidden" // 确保弹幕不溢出容器
			});
		}

		// 辅助函数：生成指定范围内的随机数
		const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

		// 2. 循环发射弹幕
		for (let i = 0; i < num; i++) {
			const danmu = ui.create.div('.danmumode', `${str}`, ui.bulletScreen);

			// 随机高度：覆盖全屏
			const clientHeight = document.body.clientHeight;
			const randomTop = Math.random(0,1) * clientHeight

			// 随机速度：为了让弹幕错开，给 transition 时间加一点点随机扰动
			let duration2 = (0.75+0.5*Math.random(0, 1))*duration;

			// 随机字体大小：24px ~ 48px 之间（可根据需要调整范围）
			const fontSize = 24 * (1 + Math.random(0, 1)) + 'px';

			danmu.css({
				left: '100%',
				top: `${randomTop}px`,
				transition: `left ${duration2}s linear 0s`, // 改为 linear 使匀速移动更自然
				fontSize: fontSize,                        // 使用随机字体大小
				textShadow: "1px 1px 1px black",
				whiteSpace: "nowrap",
				fontFamily: "宋体",
				zIndex: "1000",
				pointerEvents: "none",
				position: "absolute"
			});

			// 3. 触发动画
			// 使用 requestAnimationFrame 确保浏览器已捕获初始 100% 位置
			requestAnimationFrame(() => {
				ui.refresh(danmu);
				danmu.style.left = "-20%"; // 移出屏幕左侧
			});

			// 4. 自动销毁
			const removeNode = function () {
				this.remove();
			};
			danmu.addEventListener('transitionend', removeNode);
			danmu.addEventListener('webkitTransitionEnd', removeNode);

			// 5. 间隔控制
			// 如果还有下一条，则等待一段时间再发射（单位：毫秒）
			if (i < num - 1) {
				const delay = getRandom(3, 5);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}
	//联机更换武将图
	lib.element.player.changeAvatarImageOL = function (path) {
		game.broadcastAll(function (current, path) {
			if (current.node.avatar) current.node.avatar.setBackgroundImage(path); //例："extension/一中杀/image/Unbelieve_xiangzi_yzs.png"
		}, this, path)
	};

	//联机播放BGM(默认不循环)
	lib.game.playBgmOL = function (path, loop = false) {
		//path例："ext:一中杀/audio/Zoltraak.mp3"
		if (!loop) {
			game.broadcastAll((path) => {
				_status.tempMusic = path;
				game.playBackgroundMusic();
			},path);
			return;
		}
		game.broadcastAll((path) => {
			_status.tempMusic = path;
			game.playBackgroundMusic();
			ui.backgroundMusic.addEventListener('ended', () => {
				delete _status.tempMusic;
				game.playBackgroundMusic();
			}, { once: true });
		},path);
	}

	//联机播放图片，允许图片从屏幕外移入
	lib.game.playImageOL = function (path, zIndex = "0", duration = 0, pos) {
		// 预处理 pos
		if (pos && !Array.isArray(pos)) {
			pos = [pos];
		}
		// 简单过滤对向冲突
		if (pos && pos.length >= 2) {
			if ((pos.contains('left') && pos.contains('right')) || (pos.contains('up') && pos.contains('down'))) {
				pos = null;
			}
		}

		game.broadcastAll((path, duration, zIndex, pos) => {
			var imagePath = lib.assetURL + path;
			var img = document.createElement("img");
			img.src = imagePath;
			img.style.position = "fixed";
			img.style.left = "0";
			img.style.top = "0";
			img.style.width = "100vw";
			img.style.height = "100vh";
			img.style.objectFit = "cover";
			img.style.zIndex = zIndex;
			img.style.pointerEvents = "none";

			// 1. 设置初始透明度为0
			img.style.opacity = "0";

			// 2. 根据 pos 设置初始位移（在屏幕外）
			if (pos) {
				var tx = 0, ty = 0;
				if (pos.contains("left")) tx = -100;
				if (pos.contains("right")) tx = 100;
				if (pos.contains("up")) ty = -100;
				if (pos.contains("down")) ty = 100;
				img.style.transform = `translate(${tx}%, ${ty}%)`;
			}

			document.body.appendChild(img);

			// 【关键步骤】强制浏览器重绘 (Read a layout property)
			// 这行代码让浏览器意识到图片当前在屏幕外且透明度为0
			img.offsetWidth;

			// 3. 设置过渡属性
			img.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";

			// 4. 触发动画：回到原点并显示
			setTimeout(() => {
				img.style.opacity = "1";
			}, 50);
			if (pos) {
				img.style.transform = "translate(0, 0)";
			}

			if (!duration) return;
			setTimeout(function () {
				img.style.transition = "opacity 1s ease-out";
				img.style.opacity = 0;
				setTimeout(function () {
					if (img.parentNode) img.parentNode.removeChild(img);
				}, 1100);
			}, duration);
		}, path, duration, zIndex, pos);
	};

	//联机播放视频
	lib.game.playVideoOL = function (path, zIndex = "0", loop = false) {
		game.broadcastAll((path, zIndex, loop) => {
			var video = document.createElement("VIDEO");
			video.className = "anime";
			Object.assign(video, {
				src: lib.assetURL + path,//例："/extension/一中杀/image/background/SSF_Nightmare_yzs_start.MP4"
				autoplay: true,//准备就绪后自动播放
				loop: loop,//是否循环播放(默认只播放一次)
				muted: false,//是否静音
				preload: true,//是否提前加载
			})
			Object.assign(video.style, {
				position: "fixed",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",
				objectFit: "cover",
				minWidth: "100vw",
				minHeight: "100vh",
				opacity: "0",//透明度
				pointerEvents: "none",//不阻挡点击事件
				zIndex: zIndex,//图层默认为最上方
				transition: "opacity 0.5s ease-out",
			})
			if (!loop) {
				video.addEventListener("ended", () => {
					video.style.opacity = "0";
					setTimeout(() => {
						document.body.removeChild(video);
					}, 1000)//播放完毕1s后移除视频
				})
			}
			document.body.appendChild(video);
			setTimeout(() => {
				video.style.opacity = "1";
			}, 50)//50ms后设置视频为可见(防止未加载完毕导致闪屏)
		}, path, zIndex, loop);
	};

	//联机放大缩小武将框(如果游戏总人数发生变化例如召唤的话，会变回原大小)
	lib.element.player.scaleOL = function (scale = 1.0) {
		game.broadcastAll(async function (current, scale) {
			let numberOfPlayers = ui.arena.dataset.number;
			const playerPositions = ui.playerPositions;
			//单个人物的宽度，这里要设置玩家的实际的宽度
			const temporaryPlayer = ui.create.div(".player", ui.arena).hide();
			const computedStyle = getComputedStyle(temporaryPlayer);
			//玩家顶部距离父容器上边缘的距离偏移的单位距离
			const quarterHeight = (parseFloat(computedStyle.height) / 4) * scale;
			const halfWidth = parseFloat(computedStyle.width) / 2;
			temporaryPlayer.remove();
			//列数，即假如8人场，除去自己后，上面7个人占7列
			const columnCount = numberOfPlayers - 1;
			const percentage = 90 / (columnCount - 1);

			const players2 = game.players.concat(game.dead);
			let position = parseInt(current.dataset.position);
			playerPositions.forEach(pos => {
				if (pos == position) game.dynamicStyle.remove(pos);
			});
			if (position == 0) {
				const selector = `#arena[data-number='${ui.arena.dataset.number}']>.player[data-position='${position}']`;
				game.dynamicStyle.add(selector, {
					transform: `scale(${scale})`,
				});
				return;
			}
			players2.forEach((value) => {
				if (value.dataset.position == 0) return;
				const reversedOrdinal = columnCount - value.dataset.position;
				//动态计算玩家的top属性，实现拱桥的效果；只让两边的各两个人向下偏移一些
				const top = Math.max(0, Math.round(ui.arena.dataset.number / 5) - Math.min(Math.abs(value.dataset.position - 1), Math.abs(reversedOrdinal))) * quarterHeight;
				const selector = `#arena[data-number='${ui.arena.dataset.number}']>.player[data-position='${value.dataset.position}']`;
				if (parseInt(value.dataset.position) == position) {
					game.dynamicStyle.add(selector, {
						left: `calc(${percentage * reversedOrdinal + 5}% - ${halfWidth}px)`,
						top: `${top}px`,
						transform: `scale(${scale})`,
					});
				}
			})
		}, this, scale)
	};

	lib.element.player.yzs_getShunfaji = function () {
		let player = this;
		let blocker = player.storage.skill_blocker || [];
		let awaken = player.awakenedSkills || [];
		let skills = [];
		skills.addArray(blocker);
		skills.addArray(awaken);
		skills.addArray(player.getSkills());
		return skills.filter(function (skill) {
			let storage = player.storage.scqh_Shunfaji || [];
			let info = get.info(skill);
			if (!info) return false;
			if (info.clickable && info.scqh_Shunfaji) {
				if (storage.includes(skill)) return true;
			};
			let subSkill = info.subSkill || {};
			for (let ss in subSkill) {
				let skill2 = (skill + "_" + ss);
				let info2 = subSkill[ss] || {};
				if (info2 && info2.clickable && info2.scqh_Shunfaji) {
					if (storage.includes(skill2)) return true;
				};
			};
			return false;
		}) || [];
	};

	//【瞬发技】【1.10.16】(抄自萌将坛，略微修改了部分代码)
	lib.element.player.yzs_InitShunfaji = function (skillname) {
		if (!skillname || typeof skillname != "string") return;
		let player = this;
		let info = lib.skill[skillname] || {};
		if (!info || !info.clickable) return;
		//if (!player.isUnderControl(true)) return;

		// 1. 获取所有可点击的技能列表
		let skills = player.getSkills(null, false, false);
		if (player.name && lib.character[player.name]) skills.addArray(lib.character[player.name][3]);
		if (player.name1 && lib.character[player.name1]) skills.addArray(lib.character[player.name1][3]);
		if (player.name2 && lib.character[player.name2]) skills.addArray(lib.character[player.name2][3]);

		skills = skills.filter(function (skill) {
			let i = lib.skill[skill] || {};
			return i && i.clickable;
		});

		// 2. 清理旧按钮（防止重复刷新时按钮无限堆叠）
		if (player.node.yzs_shunfajiButtons) {
			player.node.yzs_shunfajiButtons.forEach(btn => btn.delete());
		}
		player.node.yzs_shunfajiButtons = [];
		skills=skills.reverse()
		// 3. 循环创建按钮
		skills.forEach((skill, index) => {
			// 创建按钮节点
			let button = ui.create.div(".yzs_Shunfaji", player);

			// 设置显示文本：对应技能名
			button.innerHTML = get.translation(skill) || "无咏唱";

			// 核心修改：动态排列位置
			// 假设每个按钮高度 10%，我们让它从 top 0% 开始，每个间隔 10% (10%高度 + 0%间距)
			button.style.top = 90-(index * 9) + "%";

			// 绑定点击事件
			button.listen(function () {
				if (!player.isUnderControl(true)) return;
				// 触发当前技能的点击效果
				let sInfo = lib.skill[skill];
				if (sInfo && sInfo.clickable) {
					sInfo.clickable(player);
				}
			});

			// 将按钮存入数组方便后续管理
			player.node.yzs_shunfajiButtons.push(button);
		});
	};

	//【使用瞬发技】【1.10.16】
	lib.element.player.yzs_UseShunfaji = async function (skillname) {
	    if (game.online) {
	        if (game.me == this) {
	            game.send('yzs_shunfaji', skillname);
	        };
	        return;
	    };
		let player = this;
		let evt = _status.event;
		let filter = function (trigger) {
			if (!trigger || !trigger.name) return false;
			if (trigger.name === "chooseToUse") return false;
			if (trigger.name.includes("phase")) return true;
			if (trigger.name.includes("dying")) return true;
			return false;
		};
		while (!filter(evt) && evt.parent && !filter(evt.getParent())) evt = evt.getParent();
		if (evt && evt.name) {
			let next = game.createEvent("yzs_Shunfaji");
			_status.event.next.remove(next);
			if(!evt.after.includes(next))evt.after.add(next);
			next.player = player;
			next.skill = skillname;
			next.setContent(async function (event, trigger, player) {
				let skillname = event.skill
				let info = lib.skill[skillname] || {};
				if (!info.clickableContent) return;
				if (info.clickableFilter && !info.clickableFilter(player)) return;
				if (player.disabledSkills[skillname]&&player.disabledSkills[skillname].length == 1 && player.disabledSkills[skillname][0] == skillname + "_awake") return;
				if (!player.hasSkill(skillname) || player.awakenedSkills.includes(skillname) || player.isTempBanned(skillname)) return;
				let next = game.createEvent(skillname);
				next.player = player;
				next.setContent(info.clickableContent);
				await next
			});
		};
	};

	//获取角色的含有【吟唱】标签的技能(已废弃)
	lib.element.player.yzs_getSing = function () {
		let player = this;
		let evt = _status.event;
		let blocker = player.storage.skill_blocker || [];
		let awaken = player.awakenedSkills || [];
		let skills = player.getSkills();
		return skills.filter(function (skill) {
			let info = get.info(skill);
			if (!info) return false;
			if (info.sing) return true;
			return false;
		}) || [];
	};
	//获得激情
	lib.element.player.yzs_addPassion = function (num) {
		let evt = _status.event.getParent();
		var next = game.createEvent("yzs_addPassion");
		if (evt.skill) next.skill = evt.skill;
		next.player = this;
		next.num = num||1;
		next.setContent("yzs_addPassion");
		return next
	};
	lib.element.content.yzs_addPassion = async function (event,trigger,player) {
		player.addMark("Passion_yzs", event.num, false);
		game.log(player, "获得了" + event.num + "点激情")
	};
	//投掷X
	lib.element.player.yzs_throw =function (request, log) {
		let evt = _status.event;
		var next = game.createEvent("yzs_throw", false);
		if (!evt.skill) evt = evt.getParent();
		if (evt.skill) next.skill = evt.skill;
		next.player = this;
		next.request = request;
		next.log = log;
		next.forceDie = true;
		next.setContent("yzs_throw");
		return next//返回投掷结果（点数、是否成功）
	};

	//投掷X
	lib.element.content.yzs_throw = [
		async (event, trigger, player) => {
			if (!event.request || typeof event.request != "number") {
				event.request = 0;//初始化投掷要求为0
			}
			if (!event.extra || typeof event.extra != "number") {
				event.extra = 0;//初始化额外投掷点数为0
			}
			if (!event.number || typeof event.number != "number") {
				event.number = 0;//初始化投掷点数为0（尚未投掷）
			}
			if (!event.log || typeof event.log != "boolean") {
				event.log = true;//默认自动播报
			}
			event.bool = false;
			await event.trigger("yzs_throwBegin");
			if (event.fixedResult) {
				event.result = { cancelled: true, bool: event.fixedResult >= event.request, number: event.number };
				if (event.log) {//播报内容
					player.popup(event.number + event.skill? "(" + get.translation(event.skill) + ")":"");//显示投掷点数和技能名
					let str = "投掷结果为" + event.number;
					if (event.request) str += "投掷要求为" + event.request;
					if (event.bool) str += "，投掷成功！"
					if (event.skill) str += "(" + get.translation(event.skill) + ")"
					game.log(player, str);
				}
				event.finish();
				return;
			}
		},
		async (event, trigger, player) => {
			const resultx = Math.floor(Math.random() * 6) + 1;//投掷点数为1~6之间的随机整数
			event.number += resultx;
			await event.trigger("yzs_throw");
			event.number += event.extra;//最终投掷点数
		},
		async (event, trigger, player) => {
			if (event.request) event.bool = event.number >= event.request;//投掷结果：大于等于投掷要求则成功
			if (event.log) {//播报内容
				player.popup(event.number + "(" + get.translation(event.skill) + ")");//显示投掷点数和技能名
				let str = "投掷结果为" + event.number;
				if (event.request) str += "投掷要求为" + event.request;
				if (event.bool) str += "，投掷成功！"
				if (event.skill) str += "(" + get.translation(event.skill) + ")"
				game.log(player, str);
			}
			await event.trigger("yzs_throwEnd")
			event.result = { cancelled: false, bool: event.bool, number: event.number };
		},
	];

	//体力下限
	lib.element.player.yzs_gainMinHp =  function (num) {
		var next = game.createEvent("yzs_gainMinHp");
		next.player = this;
		next.num = num || 1;
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] === "number") {
				next.num = arguments[i];
			} else if (typeof arguments[i] === "boolean") {
				next.forced = arguments[i];
			}
		}
		next.setContent("yzs_gainMinHp");
		return next;
	};
	lib.element.content.yzs_gainMinHp = [
		async (event, trigger, player) => {
			if (!player.storage.minHp_yzs) player.storage.minHp_yzs = 0;
			game.log(player, "增加了" + get.cnNumber(event.num) + "点体力下限");
			player.storage.minHp_yzs += event.num;
			player.markSkill("minHp_yzs");
			player.update();
		},
		async (event, trigger, player) => {
			if (player.storage.minHp_yzs && player.storage.minHp_yzs >= player.maxHp) {
				player.storage.minHp_yzs = player.maxHp-1;
			}
			player.markSkill("minHp_yzs");
			if (player.storage.minHp_yzs >= player.hp) {
				await player.dying(event);
			}
		}
	]
	lib.element.player.yzs_loseMinHp = function (num) {
		var next = game.createEvent("yzs_loseMinHp");
		next.player = this;
		next.num = num || 1;
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] === "number") {
				next.num = arguments[i];
			} else if (typeof arguments[i] === "boolean") {
				next.forced = arguments[i];
			}
		}
		next.setContent("yzs_loseMinHp");
		return next;
	};
	lib.element.content.yzs_loseMinHp = [
		async (event, trigger, player) => {
			if (!player.storage.minHp_yzs) player.storage.minHp_yzs = 0;
			game.log(player, "减少了" + get.cnNumber(event.num) + "点体力下限");
			player.storage.minHp_yzs -= event.num;
			if (player.storage.minHp_yzs && player.storage.minHp_yzs < 0) {
				player.storage.minHp_yzs = 0;
			}
			player.markSkill("minHp_yzs");
			player.update();
		}
	];
	//-----改函数-----//
	lib.element.player.damage = function (params) {
		const next = game.createEvent("damage");
		next.player = this;
		let noCard = false;
		let noSource = false;
		const event = _status.event;
		const args = [...arguments];
		if (args.length === 1 && typeof params == "object" && get.itemtype(params) == null) {
			Object.assign(next, params);
			if (params.nosource) {
				noSource = true;
				delete next.nosource;
			}
			if (params.nocard) {
				noCard = true;
				delete next.nocard;
			}
			if (params.notrigger) {
				next._triggered = null;
			}
		} else {
			for (const arg of args) {
				if (get.itemtype(arg) == "cards") {
					next.cards = arg.slice();
				} else if (get.itemtype(arg) == "card") {
					next.card = arg;
				} else if (typeof arg == "number") {
					next.num = arg;
				} else if (get.itemtype(arg) == "player") {
					next.source = arg;
				} else if (arg && typeof arg == "object" && arg.name) {
					next.card = arg;
				} else if (arg == "nocard") {
					noCard = true;
				} else if (arg == "nosource") {
					noSource = true;
				} else if (arg == "notrigger") {
					next._triggered = null;
					next.notrigger = true;
				} else if (arg == "unreal") {
					next.unreal = true;
				} else if (arg == "nohujia") {
					next.nohujia = true;
				} else if (get.itemtype(arg) == "nature" && arg != "stab") {
					next.nature = arg;
				} else if (get.itemtype(arg) == "natures") {
					const natures = arg.split(lib.natureSeparator).remove("stab");
					if (natures.length) {
						next.nature = natures.join(lib.natureSeparator);
					}
				}
			}
		}
		if (!next.card && !noCard) {
			next.card = event.card;
		}
		if (!next.cards && !noCard) {
			next.cards = event.cards;
		}
		if (!next.source && !noSource) {
			const source = event.customSource || event.player;
			if (source && !source.isDead()) {
				next.source = source;
			}
		}
		if (typeof next.num != "number") {
			next.num = (typeof event.baseDamage == "number" ? event.baseDamage : 1) + (typeof event.extraDamage == "number" ? event.extraDamage : 0);
		}
		next.original_num = next.num;
		next.change_history = [];
		next.hasNature = function (nature) {
			if (!nature) {
				return Boolean(this.nature && this.nature.length > 0);
			}
			let natures = get.natureList(nature), naturesx = get.natureList(this.nature);
			if (nature == "linked") {
				return naturesx.some((n) => lib.linked.includes(n));
			}
			return get.is.sameNature(natures, naturesx);
		};
		if (next.hasNature("poison")) {
			delete next._triggered;
		} else if (next.unreal) {
			next._triggered = 2;
		}
		next.setContent("damage");
		next.filterStop = function () {
			if (this.source && this.source.isDead()) {
				delete this.source;
			}
			var num = this.original_num;
			for (var i of this.change_history) {
				num += i;
			}
			if (num != this.num) {
				this.change_history.push(this.num - num);
			}
			/*if (this.num <= 0) {
				delete this.filterStop;
				this.trigger("damageZero");
				this.finish();
				this._triggered = null;
				return true;
			}*/
			return false;
		};
		return next;
	};//允许结算中途出现0点伤害
	lib.element.content.damage =  [
		async (event, trigger, player) => {
			event.forceDie = true;
			event.includeOut = true;
			if (event.unreal) {
				event.goto(4);
				return;
			}
			game.callHook("checkDamage1", [event, player]);
			await event.trigger("damageBegin1");
		},
		async (event, trigger, player) => {
			game.callHook("checkDamage2", [event, player]);
			await event.trigger("damageBegin2");
		},
		async (event, trigger, player) => {
			game.callHook("checkDamage3", [event, player]);
			await event.trigger("damageBegin3");
		},
		async (event, trigger, player) => {
			game.callHook("checkDamage4", [event, player]);
			event.trigger("damageBegin4");
		},
		async (event, trigger, player) => {
			const { num, source } = event;
			if (player.hujia > 0 && !player.hasSkillTag("nohujia") && !event.nohujia) {
				var damageAudioInfo = lib.natureAudio.hujia_damage[event.nature];
				if (!damageAudioInfo || damageAudioInfo == "normal") {
					damageAudioInfo = "effect/hujia_damage" + (num > 1 ? "2" : "") + ".mp3";
				} else if (damageAudioInfo == "default") {
					damageAudioInfo = "effect/hujia_damage_" + event.nature + (num > 1 ? "2" : "") + ".mp3";
				} else {
					damageAudioInfo = damageAudioInfo[num > 1 ? 2 : 1];
				}
				game.broadcastAll(function (damageAudioInfo2) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo2);
					}
				}, damageAudioInfo);
			} else {
				var damageAudioInfo = lib.natureAudio.damage[event.nature];
				if (!damageAudioInfo || damageAudioInfo == "normal") {
					damageAudioInfo = "effect/damage" + (num > 1 ? "2" : "") + ".mp3";
				} else if (damageAudioInfo == "default") {
					damageAudioInfo = "effect/damage_" + event.nature + (num > 1 ? "2" : "") + ".mp3";
				} else {
					damageAudioInfo = damageAudioInfo[num > 1 ? 2 : 1];
				}
				game.broadcastAll(function (damageAudioInfo2) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo2);
					}
				}, damageAudioInfo);
			}
			//播放受击音效
			if (get.character(player.name).DamageAudio) {
				let path = "ext:一中杀/audio/damage/";
				path += player.name;
				damageAudioInfo = path;
				if (get.character(player.name).DamageAudio2 && num > 1) {
					damageAudioInfo += 2;
					const index = Math.floor(Math.random() * get.character(player.name).DamageAudio2) + 1;
					damageAudioInfo += "_" + index + ".mp3";
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, damageAudioInfo);
				} else {
					const index = Math.floor(Math.random() * get.character(player.name).DamageAudio) + 1;
					damageAudioInfo += "_" + index + ".mp3";
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, damageAudioInfo);
				}
			}
			var str = event.unreal ? "视为受到了" : "受到了";
			if (source) {
				str += '来自<span class="bluetext">' + (source == player ? "自己" : get.translation(source)) + "</span>的";
			}
			str += get.cnNumber(num>0?num:0) + "点";
			if (event.nature) {
				str += get.translation(event.nature) + "属性";
			}
			str += "伤害";
			game.log(player, str);
			if (player.stat[player.stat.length - 1].damaged == void 0) {
				player.stat[player.stat.length - 1].damaged = num;
			} else {
				player.stat[player.stat.length - 1].damaged += num;
			}
			if (source) {
				source.getHistory("sourceDamage").push(event);
				if (source.stat[source.stat.length - 1].damage == void 0) {
					source.stat[source.stat.length - 1].damage = num;
				} else {
					source.stat[source.stat.length - 1].damage += num;
				}
			}
			player.getHistory("damage").push(event);
			if (!event.unreal && num > 0) {
				if (event.notrigger) {
					player.changeHp(-num, false)._triggered = null;
				} else {
					player.changeHp(-num, false);
				}
			}
			if (event.animate !== false) {
				player.$damage(source);
				var natures = (event.nature || "").split(lib.natureSeparator);
				game.broadcastAll(
					function (natures2, player2) {
						if (lib.config.animation && !lib.config.low_performance) {
							if (natures2.includes("fire")) {
								player2.$fire();
							}
							if (natures2.includes("thunder")) {
								player2.$thunder();
							}
						}
					},
					natures,
					player
				);
				var numx = player.hasSkillTag("nohujia") ? num : Math.max(0, num - player.hujia);
				player.$damagepop(-numx, natures[0]);
			}
			if (event.unreal) {
				event.goto(6);
			}
			if (!event.notrigger) {
				if (num <= 0) {
					await event.trigger("damageZero");
					event._triggered = null;
				} else {
					await event.trigger("damage");
				}
			}
		},
		async (event, trigger, player) => {
			const { source } = event;
			event.minHp = player.storage.minHp_yzs || 0;
			let next;
			if (player.hp <= event.minHp && player.isAlive() && !event.nodying) {
				await game.delayx();
				event._dyinged = true;
				next = player.dying(event);
			}
			if (source && lib.config.border_style == "auto") {
				var dnum = 0;
				for (var j = 0; j < source.stat.length; j++) {
					if (source.stat[j].damage != void 0) {
						dnum += source.stat[j].damage;
					}
				}
				if (dnum >= 2) {
					if (lib.config.autoborder_start == "silver") {
						dnum += 4;
					} else if (lib.config.autoborder_start == "gold") {
						dnum += 8;
					}
				}
				if (lib.config.autoborder_count == "damage") {
					source.node.framebg.dataset.decoration = "";
					if (dnum >= 10) {
						source.node.framebg.dataset.auto = "gold";
						if (dnum >= 12) {
							source.node.framebg.dataset.decoration = "gold";
						}
					} else if (dnum >= 6) {
						source.node.framebg.dataset.auto = "silver";
						if (dnum >= 8) {
							source.node.framebg.dataset.decoration = "silver";
						}
					} else if (dnum >= 2) {
						source.node.framebg.dataset.auto = "bronze";
						if (dnum >= 4) {
							source.node.framebg.dataset.decoration = "bronze";
						}
					}
					if (dnum >= 2) {
						source.classList.add("topcount");
					}
				} else if (lib.config.autoborder_count == "mix") {
					source.node.framebg.dataset.decoration = "";
					switch (source.node.framebg.dataset.auto) {
						case "bronze":
							if (dnum >= 4) {
								source.node.framebg.dataset.decoration = "bronze";
							}
							break;
						case "silver":
							if (dnum >= 8) {
								source.node.framebg.dataset.decoration = "silver";
							}
							break;
						case "gold":
							if (dnum >= 12) {
								source.node.framebg.dataset.decoration = "gold";
							}
							break;
					}
				}
			}
			if (next) {
				return next.forResult();
			}
		},
		async (event, trigger, player) => {
			if (!event.notrigger) {
				await event.trigger("damageSource");
			}
		}
	];
	lib.element.content.loseHp = async function (event, trigger, player) {
		const { num } = event;
		if (event.num <= 0) {
			event._triggered = null;
			return;
		}
		if (lib.config.background_audio) {
			game.playAudio("effect", "loseHp");
		}
		game.broadcast(function () {
			if (lib.config.background_audio) {
				game.playAudio("effect", "loseHp");
			}
		});
		game.log(player, "失去了" + get.cnNumber(num) + "点体力");
		await player.changeHp(-num);
		event.minHp = player.storage.minHp_yzs || 0;
		if (player.hp <= event.minHp && !event.nodying) {
			await game.delayx();
			event._dyinged = true;
			await player.dying(event);
		}
	};
	lib.element.player.recover = function (params) {
		const next = game.createEvent("recover");
		next.player = this;
		let nocard = false;
		let nosource = false;
		const args = [...arguments];
		const event = _status.event;
		if (args.length === 1 && typeof params == "object" && get.itemtype(params) == null) {
			Object.assign(next, params);
			if (params.nocard != null) {
				delete next.nocard;
				nocard = true;
			}
			if (params.nosource != null) {
				delete next.nosource;
				nosource = true;
			}
		} else {
			for (const arg of args) {
				if (get.itemtype(arg) == "cards") {
					next.cards = arg.slice(0);
				} else if (get.itemtype(arg) == "card") {
					next.card = arg;
				} else if (get.itemtype(arg) == "player") {
					next.source = arg;
				} else if (typeof arg == "object" && arg && arg.name) {
					next.card = arg;
				} else if (typeof arg == "number") {
					next.num = arg;
				} else if (arg == "nocard") {
					nocard = true;
				} else if (arg == "nosource") {
					nosource = true;
				}
			}
		}
		if (next.card == void 0 && !nocard) {
			next.card = event.card;
		}
		if (next.cards == void 0 && !nocard) {
			next.cards = event.cards;
		}
		if (next.source == void 0 && !nosource) {
			next.source = event.customSource || event.player;
		}
		if (next.num == void 0) {
			next.num = (event.baseDamage || 1) + (event.extraDamage || 0);
		}
		if (next.overflow == undefined) {
			next.overflow = 0;
		}
		next.filterStop = function () {
			/*if (this.num <= 0 || this.player.isHealthy()) {
				delete this.filterStop;
				this.finish();
				this._triggered = null;
				return true;
			}*/
		};
		next.setContent("recover");
		return next;
	};//增加恢复体力（溢出的值）
	lib.element.content.recover = async function (event, trigger, player) {
		let { num } = event;
		if (num > player.maxHp - player.hp) {
			let overflow = num - (player.maxHp - player.hp);
			num = player.maxHp - player.hp;
			event.num = num;
			event.overflow = overflow;
		}
		if (num > 0||event.overflow>0) {
			delete event.filterStop;
			if (lib.config.background_audio) {
				game.playAudio("effect", "recover");
			}
			game.broadcast(function () {
				if (lib.config.background_audio) {
					game.playAudio("effect", "recover");
				}
			});
			game.broadcastAll(function (player2) {
				if (lib.config.animation && !lib.config.low_performance) {
					player2.$recover();
				}
			}, player);
			player.$damagepop(num, "wood");
			//game.log(player, "回复了" + get.cnNumber(num) + "点体力");
			await player.changeHp(num, false);
		} else {
			event._triggered = null;
		}
		let str = "";
		if (event.num > 0) str += "回复了" + get.cnNumber(num) + "点体力";
		if (event.num > 0 && event.overflow > 0) str += ",";
		if (event.overflow > 0) str += "溢出了" + get.cnNumber(event.overflow) + "点体力";
		if (str != "") game.log(player, str);
	};
	lib.element.content.changeHp = async function (event) {
		let { overflow } = event.getParent();
		if (typeof overflow!="number") overflow = 0;
		let { player, num } = event;
		game.getGlobalHistory().changeHp.push(event);
		if (num < 0 && player.hujia > 0 && event.getParent().name == "damage" && !player.hasSkillTag("nohujia") && !event.getParent().nohujia) {
			event.hujia = Math.min(-num, player.hujia);
			event.getParent().hujia = event.hujia;
			event.num += event.hujia;
			player.changeHujia(-event.hujia).type = "damage";
		}
		num = event.num;
		player.hp += num;
		if (isNaN(player.hp)) {
			player.hp = 0;
		}
		if (player.hp > player.maxHp) {
			player.hp = player.maxHp;
		}
		player.update();
		if (event.popup !== false) {
			player.$damagepop(num, "water");
		}
		var minHp = player.storage.minHp_yzs || 0;
		if(_status.dying.includes(player) && player.hp > minHp && (num > 0||overflow>0)) {
			_status.dying.remove(player);
			game.broadcast(function (list) {
				_status.dying = list;
			}, _status.dying);
			var evt = event.getParent("_save");
			if (evt && evt.finish) {
				evt.finish();
			}
			evt = event.getParent("dying");
			if (evt && evt.finish) {
				evt.finish();
			}
		} else if (player.hp > minHp && (num > 0 || overflow > 0)) {
			evt = event.getParent("dying");
			if (evt && evt.finish && evt.player == player) {
				evt.finish();
			}
		}
		await event.trigger("changeHp");
	};
	lib.element.content.loseMaxHp = async function (event) {
		const { player, num } = event;
		game.log(player, "减少了" + get.cnNumber(num) + "点体力上限");
		player.maxHp -= num;
		if (isNaN(player.maxHp)) {
			player.maxHp = 0;
		}
		event.loseHp = Math.max(0, player.hp - player.maxHp);
		player.update();
		if (player.storage.minHp_yzs && player.storage.minHp_yzs >= player.maxHp) {
			player.storage.minHp_yzs = player.maxHp - 1;
			player.markSkill("minHp_yzs");
		}
		if (player.maxHp <= 0) {
			await player.die(event);
		}
	};
	lib.element.player.dying = function (reason,forceDying) {
		var minHp = this.storage?.minHp_yzs || 0;
		if (this.nodying || (this.hp > minHp&&!forceDying )|| this.isDying()) {
			return;
		}
		var next = game.createEvent("dying");
		next.player = this;
		next.reason = reason;
		next.forceDying = forceDying;
		next.minHp = minHp;
		if (reason && reason.source) {
			next.source = reason.source;
		}
		next.setContent("dying");
		next.filterStop = function () {
			if ((this.player.hp > minHp&&!forceDying )|| this.nodying) {
				delete this.filterStop;
				return true;
			}
		};
		return next;
	};//特殊濒死、体力下限
	lib.element.content.dying=[
		async (event, trigger, player) => {
			event.forceDie = true;
			if (player.isDying() || (player.hp > event.minHp && !event.forceDying)) {
				event.finish();
				return;
			}
			_status.dying.unshift(player);
			game.broadcast(function (list) {
				_status.dying = list;
			}, _status.dying);
			await event.trigger("dying");
			game.log(player, "濒死");
		},
		async (event, trigger, player) => {
			delete event.filterStop;
			if ((player.hp > event.minHp && !event.forceDying) || event.nodying) {
				_status.dying.remove(player);
				game.broadcast(function (list) {
					_status.dying = list;
				}, _status.dying);
				event.finish();
			} else if (!event.skipTao) {
				let start = false;
				const starts = [_status.currentPhase, event.source, event.player, game.me, game.players[0]];
				for (var i = 0; i < starts.length; i++) {
					if (get.itemtype(starts[i]) == "player" && game.players.concat(game.dead).includes(starts[i])) {
						start = game.players.slice().sortBySeat(starts[i]).find((i2) => !i2.isOut());
						if (start) {
							break;
						}
					}
				}
				if (start) {
					const next = game.createEvent("_save");
					next.player = start;
					next._trigger = event;
					next.triggername = "_save";
					next.forceDie = true;
					next.setContent("_save");
					await next;
				}
			}
		},
		async (event, trigger, player) => {
			_status.dying.remove(player);
			game.broadcast(function (list) {
				_status.dying = list;
			}, _status.dying);
			if ((player.hp <= event.minHp || event.forceDying) && !event.nodying && !player.nodying) {
				await player.die(event.reason);
			}
		}
	];
	lib.element.content._save = async function (event, trigger) {
		event.dying = trigger.player;
		const dying = trigger.player;
		const acted = /* @__PURE__ */ new Set();
		const prompt = `${get.translation(trigger.player)}濒死，是否帮助？`;
		outer: while (!trigger.player.isDead()) {
			const player = event.player;
			acted.add(player);
			const taoEnemyConfig = lib.config.tao_enemy && dying.side !== player.side && lib.config.mode != "identity" && lib.config.mode != "guozhan" && !dying.hasSkillTag("revertsave");
			let result = { bool: false };
			if (!taoEnemyConfig && player.canSave(dying) && player.isIn()) {
				result = await player.chooseToUse({
					filterCard(card, player2, event2) {
						event2 = event2 || _status.event;
						return lib.filter.cardSavable(card, player2, event2.dying);
					},
					filterTarget(card, player2, target) {
						if (target != _status.event.dying) {
							return false;
						}
						if (!card) {
							return false;
						}
						var info = get.info(card);
						if (!info.singleCard || ui.selected.targets.length == 0) {
							var mod = game.checkMod(card, player2, target, "unchanged", "playerEnabled", player2);
							if (mod == false) {
								return false;
							}
							var mod = game.checkMod(card, player2, target, "unchanged", "targetEnabled", target);
							if (mod != "unchanged") {
								return mod;
							}
						}
						return true;
					},
					prompt,
					prompt2: `当前体力：${dying.hp}`,
					ai1(card) {
						if (typeof card == "string") {
							var info = get.info(card);
							if (info.ai && info.ai.order) {
								if (typeof info.ai.order == "number") {
									return info.ai.order;
								} else if (typeof info.ai.order == "function") {
									return info.ai.order();
								}
							}
						}
						return 1;
					},
					ai2(target) {
						let effect_use = get.effect_use(target);
						if (effect_use <= 0) {
							return effect_use;
						}
						return get.effect(target);
					},
					type: "dying",
					targetRequired: true,
					dying
				}).forResult();
			}
			if (event.finished) {
				break;
			}
			if (result.bool) {
				if (dying.hp > trigger.minHp || trigger.nodying || dying.nodying || !dying.isAlive() || dying.isOut() || dying.removed) {
					trigger.untrigger();
					break;
				}
			} else {
				let next = player.next;
				const cacheNext = /* @__PURE__ */ new Set();
				while (true) {
					if (acted.has(next) || cacheNext.has(next)) {
						break outer;
					}
					if (!next.isOut()) {
						event.player = next;
						break;
					}
					cacheNext.add(next);
					next = next.next;
				}
			}
		}
	};
	lib.element.content.die = [
		async (event, trigger, player) => {
			const { reason, source } = event;
			event.forceDie = true;
			if (_status.roundStart == player && !event.reserveOut) {
				_status.roundStart = player.next || player.getNext() || game.players[0];
			}
			if (ui.land && ui.land.player == player) {
				game.addVideo("destroyLand");
				ui.land.destroy();
			}
			let unseen = false;
			if (player.classList.contains("unseen")) {
				player.classList.remove("unseen");
				unseen = true;
			}
			const logvid = game.logv(player, "die", source);
			event.logvid = logvid;
			if (unseen) {
				player.classList.add("unseen");
			}
			if (source) {
				game.log(player, "被", source, "杀害");
				if (source.stat[source.stat.length - 1].kill == void 0) {
					source.stat[source.stat.length - 1].kill = 1;
				} else {
					source.stat[source.stat.length - 1].kill++;
				}
			} else {
				game.log(player, "阵亡");
			}
			game.broadcastAll(function (player2) {
				player2.classList.add("dead");
				player2.removeLink();
				player2.classList.remove("turnedover");
				player2.classList.remove("out");
				player2.node.count.innerHTML = "0";
				player2.node.hp.hide();
				player2.node.equips.hide();
				player2.node.count.hide();
				player2.previous.next = player2.next;
				player2.next.previous = player2.previous;
				game.players.remove(player2);
				game.dead.push(player2);
				_status.dying.remove(player2);
			}, player);
			if (!event.noDieAudio) {
				game.tryDieAudio(player);
			}
			if (!event.reserveOut) {
				game.addVideo("diex", player);
				if (event.animate !== false) {
					player.$die(source);
				}
			}
			if (player.hp != 0) {
				await player.changeHp(0 - player.hp, false).set("forceDie", true);
			}
		},
		async (event, trigger, player) => {
			const { source } = event;
			if (player.dieAfter && !event.reserveOut && !event.noDieAfter) {
				await player.dieAfter(source);
			}
		},
		async (event, trigger, player) => {
			game.callHook("checkDie", [event, player]);
			await event.trigger("die");
		},
		async (event, trigger, player) => {
			const { reason, source } = event;
			if (player.isDead()) {
				if (!game.reserveDead) {
					const exclude = event.excludeMark;
					for (const mark in player.marks) {
						if (exclude.includes(mark)) {
							continue;
						}
						player.unmarkSkill(mark);
					}
					let count = 1;
					const list = Array.from(player.node.marks.childNodes);
					count += exclude.filter((name) => list.some((i) => i.name == name)).length;
					const func = function (player2, count2, exclude2) {
						while (player2.node.marks.childNodes.length > count2) {
							let node = player2.node.marks.lastChild;
							if (exclude2.includes(node.name)) {
								node = node.previousSibling;
							}
							node.remove();
						}
					};
					func(player, count, exclude);
					game.broadcast(
						function (func2, player2, count2, exclude2) {
							func2(player2, count2, exclude2);
						},
						func,
						player,
						count,
						exclude
					);
					player.removeTip();
				}
				for (const i in player.tempSkills) {
					player.removeSkill(i);
				}
				const skills = player.getSkills();
				for (let i = 0; i < skills.length; i++) {
					if (lib.skill[skills[i]].temp) {
						player.removeSkill(skills[i]);
					}
				}
				if (_status.characterlist && !event.reserveOut) {
					if (lib.character[player.name] && !player.name.startsWith("gz_shibing") && !player.name.startsWith("gz_jun_")) {
						_status.characterlist.add(player.name);
					}
					if (lib.character[player.name1] && !player.name1.startsWith("gz_shibing") && !player.name1.startsWith("gz_jun_")) {
						_status.characterlist.add(player.name1);
					}
					if (lib.character[player.name2] && !player.name2.startsWith("gz_shibing") && !player.name2.startsWith("gz_jun_")) {
						_status.characterlist.add(player.name2);
					}
				}
				event.cards = player.getCards("hejsx");
				if (event.cards.length) {
					await player.discard(event.cards).set("forceDie", true);
				}
			}
		},
		async (event, trigger, player) => {
			const { source } = event;
			if (player.dieAfter2 && !event.reserveOut && !event.noDieAfter2) {
				await player.dieAfter2(source);
			}
		},
		async (event, trigger, player) => {
			const { reason, source } = event;
			if (!event.reserveOut) {
				game.broadcastAll(function (player2) {
					if (game.online && player2 == game.me && !_status.over && !game.controlOver && !ui.exit) {
						if (lib.mode[lib.configOL.mode].config.dierestart) {
							ui.create.exit();
						}
					}
				}, player);
				if (!_status.connectMode && player == game.me && !_status.over && !game.controlOver) {
					ui.control.show();
					if (get.config("revive") && lib.mode[lib.config.mode].config.revive && !ui.revive) {
						ui.revive = ui.create.control("revive", ui.click.dierevive);
					}
					if (get.config("continue_game") && !ui.continue_game && lib.mode[lib.config.mode].config.continue_game && !_status.brawl && !game.no_continue_game) {
						ui.continue_game = ui.create.control("再战", game.reloadCurrent);
					}
					if (get.config("dierestart") && lib.mode[lib.config.mode].config.dierestart && !ui.restart) {
						ui.restart = ui.create.control("restart", game.reload);
					}
				}
				if (!_status.connectMode && player == game.me && !game.modeSwapPlayer) {
					if (ui.auto) {
						ui.auto.hide();
					}
					if (ui.wuxie) {
						ui.wuxie.hide();
					}
				}
				if (typeof _status.coin == "number" && source && !_status.auto) {
					if (source == game.me || source.isUnderControl()) {
						_status.coin += 10;
					}
				}
			}
			if (source && lib.config.border_style == "auto" && (lib.config.autoborder_count == "kill" || lib.config.autoborder_count == "mix")) {
				switch (source.node.framebg.dataset.auto) {
					case "gold":
					case "silver":
						source.node.framebg.dataset.auto = "gold";
						break;
					case "bronze":
						source.node.framebg.dataset.auto = "silver";
						break;
					default:
						source.node.framebg.dataset.auto = lib.config.autoborder_start || "bronze";
				}
				if (lib.config.autoborder_count == "kill") {
					source.node.framebg.dataset.decoration = source.node.framebg.dataset.auto;
				} else {
					let dnum = 0;
					for (let j = 0; j < source.stat.length; j++) {
						if (source.stat[j].damage != void 0) {
							dnum += source.stat[j].damage;
						}
					}
					source.node.framebg.dataset.decoration = "";
					switch (source.node.framebg.dataset.auto) {
						case "bronze":
							if (dnum >= 4) {
								source.node.framebg.dataset.decoration = "bronze";
							}
							break;
						case "silver":
							if (dnum >= 8) {
								source.node.framebg.dataset.decoration = "silver";
							}
							break;
						case "gold":
							if (dnum >= 12) {
								source.node.framebg.dataset.decoration = "gold";
							}
							break;
					}
				}
				source.classList.add("topcount");
			}
		}
	];//允许死亡不结算游戏，能够复活的武将死亡不会直接结束游戏

	//领域展开
	lib.element.player.yzs_ExpandDomain = function () {
		var next = game.createEvent("yzs_ExpandDomain", false);
		next.player = this;
		const args = Array.from(arguments);
		for (const arg of args) {
			if (typeof arg === 'string') {
				if (!next.domain) next.domain = arg;
				else next.color = arg
			} else if (typeof arg == "number") {
				next.num = arg;
			} else if (arg === true) {
				next.forced=true
			} else if (arg === false) {
				next.log = false;
			}
		}
		if (!next.domain || next.num <= 0 || (_status._yzsDomain==next.domain&&!next.forced)) {
			_status.event.next.remove(next);
			next.resolve();
			return;
		}
		next.setContent("yzs_ExpandDomain");
		return next
	};
	lib.element.content.yzs_ExpandDomain =
		[
			async (event, trigger, player) => {
				if (_status._yzsDomain && typeof _status._yzsDomain == "string") event.before = _status._yzsDomain
				else event.before = "blank";
				if (event.before && event.before != "blank") event.beforeskill = event.before + "_skill"
				if (!event.domain || typeof event.domain != "string") {
					event.domain = "blankDomain";//默认展开“无领域”（异常情况）
				}
				if (!event.domainskill || typeof event.domainskill != "string") {
					event.domainskill = event.domain + "_skill";//领域技能命名格式为“领域名称”+"_skill"
				}
				if (!event.log || typeof event.log != "boolean") {
					event.log = true;//默认自动播报
				}
				await event.trigger("yzs_ExpandDomainBegin");
			},
		async (event, trigger, player) => {
			let num = event.num;
			if (typeof _status._yzsDomainCount=="number")num -= _status._yzsDomainCount;
			if (num <= 0) {
				game.broadcastAll((count) => {
					_status._yzsDomainCount -= count;
					if (_status._yzsDomainCount > 0) return;
					if (ui.domain) {
						ui.domain.destroy();
					} else {
						node.classList.add("hidden");
						document.body.insertBefore(node, ui.window);
						ui.refresh(node);
						node.classList.remove("hidden");
					}
					delete ui.domain
					_status._yzsDomainCount = 0;
					delete _status._yzsDomain;
					delete _status._yzsDomainPlayer;
				},event.num);
				game.log(event.player, `抵消了${event.num}个回合的${get.translation(event.before)}`);
				event.result = { bool: false, domain: event.domain, before: event.before };
				return;
			}

				if (event.log) {//播报内容
					let str = "展开了领域：" + get.translation(event.domain)
					game.log(player, str);
				}
				let parsedPath = "extension/一中杀/image/background/";
				parsedPath += event.domain + ".png";
				event.player.$fullscreenpop("领域展开", event.color);
				await new Promise(r => setTimeout(r, 2500))
				event.player.$fullscreenpop(get.translation(event.domain),event.color);
				await game.broadcastAll(
					(formattedPath, domain, skill, player, count) => {
						_status._yzsDomainCount = count;
						_status._yzsDomainPlayer = player;
						const node = ui.create.div(".background.upper.domain");
						node.setBackgroundImage(formattedPath);
						node.style.backgroundSize = "cover";
						node.style.backgroundRepeat = "no-repeat";
						node.style.backgroundPosition = "center";
						node.style.zIndex = "-1";
						node.style.pointerEvents = "none"; // 防止点击事件被阻挡
						node.destroy = () => {
							if (node.skill) {
								game.removeGlobalSkill(node.skill);
								if (node.system) {
									node.system.remove();
								}
							}
							node.classList.add("hidden");
							setTimeout(() => node.remove(), 3000);
							if (ui.domain == node) {
								ui.domain = null;
							}
						};
						if (ui.domain) {
							document.body.insertBefore(node, ui.domain);
							ui.domain.destroy();
						} else {
							node.classList.add("hidden");
							document.body.insertBefore(node, ui.window);
							ui.refresh(node);
							node.classList.remove("hidden");
						}
						ui.domain = node;
						if (!domain) {
							return;
						}
						node.domain = domain;
						node.skill = skill;
						if (player) {
							node.player = player;
						}
						lib.setPopped(
							(node.system = ui.create.system(lib.translate[skill], null, true, true)),
							() => {
								const uiIntro = ui.create.dialog("hidden");
								uiIntro.addText(player ? `领域的主人：${get.translation(player)}` : get.translation(domain)).style.margin = "0";
								uiIntro._place_text = uiIntro.add(ui.create.div(".text", lib.translate[`${skill}_info`] + `(剩余 ${_status._yzsDomainCount} 回合)`));
								uiIntro.add(ui.create.div(".placeholder.slim"));
								return uiIntro;
							},
							200
						);
						_status._yzsDomain = domain;
					},
					parsedPath,
					event.domain,
					event.domainskill,
					event.player,
					num
				);
			await game.addGlobalSkill(event.domainskill);
			let skills = lib.character[player.name][3].filter(skill => {
				const categories = get.skillCategoriesOf(skill, player);
				return !categories.some(type => lib.skill.AiSi_yzs.bannedType.includes(type)) && player.hasSkill(skill);
			});
			player.tempBanSkill(skills)
				if (lib.skill[event.domainskill + "_instant"]) player.useSkill(event.domainskill + "_instant", false)
				await event.trigger("yzs_ExpandDomainEnd")
				event.result = { bool: true, domain: event.domain, before: event.before };
			},
		];

	//风暴
	lib.element.player.getPossibleStorm = function () {
		let player = this;
		let storms = player.getAllStorm();
		if (player.getStorage("extraStorm").length) storms.add(player.getStorage("extraStorm"));
		storms.flat();
		storms=storms.filter(function(cur){ return cur != _status._yzsStorm })
		return storms;
	};
	lib.element.player.getAllStorm = function () {
		let player = this;
		return ["FireStorm", "ThunderStorm", "WaterStorm", "IceStorm", "BulletStorm", "WindStorm"]
	};
	lib.translate["SummonStorm_yzs"] = "召引风暴";
	lib.element.player.yzs_cancelStorm = async function (log) {
		if (!_status._yzsStorm || typeof _status._yzsStorm !== "string") return;
		var next = game.createEvent("yzs_cancelStorm", false);
		next.player = this;
		next.log = log;
		next.setContent("yzs_cancelStorm");
		return next
	};
	lib.element.content.yzs_cancelStorm =
		[
			async (event, trigger, player) => {
				if (_status._yzsStorm && typeof _status._yzsStorm == "string") event.before = _status._yzsStorm
				else event.before = "blank";
				if (event.before && event.before != "blank") event.beforeskill = event.before + "_skill"
				if (!event.log || typeof event.log != "boolean") {
					event.log = true;//默认自动播报
				}
				await event.trigger("yzs_cancelStormBegin");
			},
			async (event, trigger, player) => {
				if (event.log) {//播报内容
					let str = "终止了" + get.translation(event.before)
					game.log(player, str);
				}
				await game.broadcastAll(
					() => {
						if (ui.storm) {
							ui.storm.destroy();
						} else {
							node.classList.add("hidden");
							document.body.insertBefore(node, ui.window);
							ui.refresh(node);
							node.classList.remove("hidden");
						}
						delete ui.storm
						delete _status._yzsStorm;
					}
				);
				await event.trigger("yzs_cancelStormEnd")
				event.result = { cancelled: false, before: event.before };
			},
		];
	lib.element.player.yzs_SummonStorm = async function (storm, log, forced) {
		if (forced !== true && _status._yzsStorm == storm) return;
		var next = game.createEvent("yzs_SummonStorm",false);
		next.player = this;
		next.storm = storm || "blankStorm";
		next.log = log;
		next.setContent("yzs_SummonStorm");
		return next
	};
	lib.element.content.yzs_SummonStorm =
		[
		async (event, trigger, player) => {
			if (_status._yzsStorm && typeof _status._yzsStorm == "string") event.before = _status._yzsStorm
			else event.before = "blank";
			if(event.before&&event.before!="blank")event.beforeskill=event.before+"_skill"
				if (!event.storm || typeof event.storm != "string") {
					event.storm = "blankStorm";//默认召引“无风暴”（异常情况）
			}
			if (!event.stormskill || typeof event.stormskill != "string") {
				event.stormskill = event.storm +"_skill";//风暴技能命名格式为“风暴名称”+"_skill"
			}
			if (!event.log || typeof event.log != "boolean") {
				event.log = true;//默认自动播报
			}
			await event.trigger("yzs_SummonStormBegin");
		},
		async (event, trigger, player) => {
			if (event.log) {//播报内容
				let str = "召引了" + get.translation(event.storm)
				game.log(player, str);
			}
			let parsedPath = "extension/一中杀/image/card/";
			parsedPath += event.storm + ".png"
			player.$fullscreenpop(get.translation(event.storm));
			await game.broadcastAll(
				(formattedPath, storm, skill, player) => {
					const node = ui.create.div(".background.upper.storm");
					node.setBackgroundImage(formattedPath);
					node.style.backgroundSize = "cover";
					node.style.backgroundRepeat = "no-repeat";
					node.style.backgroundPosition = "center";
					node.style.zIndex = "1";
					node.style.pointerEvents = "none"; // 防止点击事件被阻挡
					node.destroy = () => {
						if (node.skill) {
							game.removeGlobalSkill(node.skill);
							if (node.system) {
								node.system.remove();
							}
						}
						node.classList.add("hidden");
						setTimeout(() => node.remove(), 3000);
						if (ui.storm == node) {
							ui.storm = null;
						}
					};
					if (ui.storm) {
						document.body.insertBefore(node, ui.storm);
						ui.storm.destroy();
					} else {
						node.classList.add("hidden");
						document.body.insertBefore(node, ui.window);
						ui.refresh(node);
						node.classList.remove("hidden");
					}
					ui.storm = node;
					if (!storm) {
						return;
					}
					node.storm = storm;
					node.skill = skill;
					if (player) {
						node.player = player;
					}
					lib.setPopped(
						(node.system = ui.create.system(lib.translate[skill], null, true, true)),
						() => {
							const uiIntro = ui.create.dialog("hidden");
							uiIntro.addText(player ? `召引者：${get.translation(player)}` : get.translation(storm)).style.margin = "0";
							uiIntro._place_text = uiIntro.add(ui.create.div(".text", lib.translate[`${skill}_info`]));
							uiIntro.add(ui.create.div(".placeholder.slim"));
							return uiIntro;
						},
						200
					);
					_status._yzsStorm = storm;
				},
				parsedPath,
				event.storm,
				event.stormskill,
				player
			);
			await game.addGlobalSkill(event.stormskill);
			if (lib.skill[event.stormskill + "_instant"]) player.useSkill(event.stormskill + "_instant", false)
			await event.trigger("yzs_SummonStormEnd")
			event.result = { cancelled: false, storm: event.storm, before: event.before };
		},
	];
	lib.element.player.yzs_changeStorm = async function (storm, log, forced) {
		if (forced !== true && _status._yzsStorm == storm) return;
		var next = game.createEvent("yzs_changeStorm",false);
		next.player = this;
		next.storm = storm || "blankStorm";
		next.log = log;
		next.setContent("yzs_changeStorm");
		return next
	};
	lib.element.content.yzs_changeStorm = [
		async (event, trigger, player) => {
			if (_status._yzsStorm && typeof _status._yzsStorm == "string") event.before = _status._yzsStorm
			else event.before = "blank";
			if (event.before && event.before != "blank") event.beforeskill = event.before + "_skill"
			if (!event.storm || typeof event.storm != "string") {
				event.storm = "blankStorm";//默认召引“无风暴”（异常情况）
			}
			if (!event.stormskill || typeof event.stormskill != "string") {
				event.stormskill = event.storm + "_skill";//风暴技能命名格式为“风暴名称”+"_skill"
			}
			if (!event.log || typeof event.log != "boolean") {
				event.log = true;//默认自动播报
			}
			await event.trigger("yzs_changeStormBegin");
		},
		async (event, trigger, player) => {
			if (event.log) {//播报内容
				let str = "转换至" + get.translation(event.storm)
				game.log(player, str);
			}
			let parsedPath = "extension/一中杀/image/card/";
			parsedPath += event.storm + ".png"
			await game.broadcastAll(
				(formattedPath, storm, skill, player) => {
					const node = ui.create.div(".background.upper.storm");
					node.setBackgroundImage(formattedPath);
					node.style.backgroundSize = "cover";
					node.style.backgroundRepeat = "no-repeat";
					node.style.backgroundPosition = "center";
					node.style.zIndex = "1";
					node.style.pointerEvents = "none"; // 防止点击事件被阻挡
					node.destroy = () => {
						if (node.skill) {
							game.removeGlobalSkill(node.skill);
							if (node.system) {
								node.system.remove();
							}
						}
						node.classList.add("hidden");
						setTimeout(() => node.remove(), 3000);
						if (ui.storm == node) {
							ui.storm = null;
						}
					};
					if (ui.storm) {
						document.body.insertBefore(node, ui.storm);
						ui.storm.destroy();
					} else {
						node.classList.add("hidden");
						document.body.insertBefore(node, ui.window);
						ui.refresh(node);
						node.classList.remove("hidden");
					}
					ui.storm = node;
					if (!storm) {
						return;
					}
					node.storm = storm;
					node.skill = skill;
					if (player) {
						node.player = player;
					}
					lib.setPopped(
						(node.system = ui.create.system(lib.translate[skill], null, true, true)),
						() => {
							const uiIntro = ui.create.dialog("hidden");
							uiIntro.addText(player ? `转换者：${get.translation(player)}` : get.translation(storm)).style.margin = "0";
							uiIntro._place_text = uiIntro.add(ui.create.div(".text", lib.translate[`${skill}_info`]));
							uiIntro.add(ui.create.div(".placeholder.slim"));
							return uiIntro;
						},
						200
					);
					_status._yzsStorm = storm;
				},
				parsedPath,
				event.storm,
				event.stormskill,
				player
			);
			await game.addGlobalSkill(event.stormskill);
			await event.trigger("yzs_changeStormEnd")
			event.result = { cancelled: false, storm: event.storm, before: event.before };
		},
	];

	//砸蛋无限火力
	const original_getNodeIntro = get.nodeintro;
	get.nodeintro = function (node, simple, evt, uiintro) {
		const intro = original_getNodeIntro.call(this, node, simple, evt, uiintro);
		if (!intro) return intro;
		if (intro.content._emotionInjected) {
			return intro;
		}
		const hasEmotionText = intro.content.textContent.includes("发送交互表情");
		if (!hasEmotionText) {
			return intro;
		}
		intro.content._emotionInjected = true;
		if (!game.observe && _status.gameStarted && game.me && node != game.me) {
			intro.content.querySelectorAll('.add-setting, .emotion-custom').forEach(el => el.remove());
			ui.throwEmotion = [];
			const click = function (e) {
				if (e && e.stopPropagation) e.stopPropagation();
				if (_status.dragged || _status.justdragged) return;
				const emotion = this.link;
				if (game.online) {
					game.send("throwEmotion", node, emotion);
				} else {
					game.me.throwEmotion(node, emotion);
				}
				_status.throwEmotionWait = true;
				setTimeout(() => {
					_status.throwEmotionWait = false;
				}, emotion === "flower" || emotion === "egg" ? 500 : 5000);
				if (e && e.preventDefault) e.preventDefault();
				return false;
			};
			const table1 = ui.create.div("add-setting emotion-custom");
			table1.style.margin = "0";
			table1.style.width = "100%";
			const list1 = ["flower", "egg"];
			list1.forEach(item => {
				const td = ui.create.div(".menubutton.reduce_radius.pointerdiv.tdnode");
				td.link = item;
				td.innerHTML = `<span>${get.translation(item)}</span>`;
				td.addEventListener(lib.config.touchscreen ? "touchend" : "click", click);
				table1.appendChild(td);
			});
			intro.content.appendChild(table1);
			const table2 = ui.create.div("add-setting emotion-custom");
			table2.style.margin = "0";
			table2.style.width = "100%";
			let list2 = ["wine", "shoe"];
			if (game.me.storage.zhuSkill_shanli) list2 = ["yuxisx", "jiasuo"];
			list2.forEach(item => {
				const td = ui.create.div(".menubutton.reduce_radius.pointerdiv.tdnode");
				td.link = item;
				td.innerHTML = `<span>${get.translation(item)}</span>`;
				td.addEventListener(lib.config.touchscreen ? "touchend" : "click", click);
				table2.appendChild(td);
			});
			intro.content.appendChild(table2);
		}
		return intro;
	};
	get.nodeintro_yzs = function (node, simple, evt, uiintro) {
		uiintro ??= ui.create.dialog("hidden", "notouchscroll");
		uiintro.setAttribute("id", "nodeintro");
		if (node.classList.contains("player") && !node.name) {
			return uiintro;
		}
		var i, translation, intro, str;
		if (node._nointro) {
			return;
		}
		let created = false;
		const createButtons = function (nameskin, avatarSetter) {
			const srcBase = get.skinPath(nameskin);
			if (!srcBase) {
				return;
			}
			game.getFileList(srcBase, (folders, files) => {
				if (!files.length) {
					return;
				}
				if (!created) {
					created = true;
					uiintro.add('<div class="text center">更改皮肤</div>');
				}
				const avatars = ui.create.div(".buttons.smallzoom.scrollbuttons");
				lib.setMousewheel(avatars);
				uiintro.add(avatars);
				const originButton = ui.create.div(".button.character.pointerdiv", avatars, function () {
					delete lib.config.skin[nameskin];
					if (lib.characterSubstitute[nameskin]) {
						for (const list2 of lib.characterSubstitute[nameskin]) delete lib.config.skin[list2[0]];
					}
					avatarSetter("origin");
					game.saveConfig("skin", lib.config.skin);
				});
				originButton.setBackground(nameskin, "character", "noskin");
				const originSkin = ui.create.caption(`<div class="text" data-nature=shenmm style="font-size: 12px">经典形象</div>`, originButton);
				originSkin.style.left = "1px";
				originSkin.style.bottom = "-1px";
				files.forEach((file) => {
					const src = `${srcBase}${file}`, skinname = file;
					const button = ui.create.div(".button.character.pointerdiv", avatars, function () {
						lib.config.skin[nameskin] = [skinname, src];
						if (lib.characterSubstitute[nameskin]) {
							for (const list2 of lib.characterSubstitute[nameskin]) {
								const sub = list2[0], [fold, prefix] = skinname.split(".");
								lib.config.skin[sub] = [skinname, `${srcBase}${fold}/${sub}.${prefix}`];
							}
						}
						avatarSetter(src);
						game.saveConfig("skin", lib.config.skin);
					});
					button.setBackgroundImage(src);
					const skinCaption = ui.create.caption(`<div class="text" data-nature=shenmm style="font-size: 12px">${get.translation(skinname.slice(0, -4))}</div>`, button);
					skinCaption.style.left = "1px";
					skinCaption.style.bottom = "-1px";
				});
			}, () => {
			});
		};
		if (typeof node._customintro == "function") {
			if (node._customintro(uiintro, evt) === false) {
				return;
			}
			if (evt) {
				lib.placePoppedDialog(uiintro, evt);
			}
		} else if (Array.isArray(node._customintro)) {
			var caption = node._customintro[0];
			var content = node._customintro[1];
			if (typeof caption == "function") {
				caption = caption(node);
			}
			if (typeof content == "function") {
				content = content(node);
			}
			uiintro.add(caption);
			uiintro.add('<div class="text center" style="padding-bottom:5px">' + content + "</div>");
		} else if (node.classList.contains("player") || node.linkplayer) {
			if (node.linkplayer) {
				node = node.link;
			}
			let capt = get.translation(node.name);
			const characterInfo = get.character(node.name), sex = node.sex || characterInfo[0];
			if (sex && sex != "unknown" && lib.config.show_sex) {
				capt += `&nbsp;&nbsp;${sex == "none" ? "无" : get.translation(sex)}`;
			}
			const group = node.group;
			if (group && group != "unknown" && lib.config.show_group) {
				capt += `&nbsp;&nbsp;${get.translation(group)}`;
			}
			uiintro.add(capt);
			if (lib.characterTitle[node.name]) {
				uiintro.addText(get.colorspan(lib.characterTitle[node.name]));
			}
			if (lib.characterAppend[node.name]) {
				uiintro.addText(get.colorspan(lib.characterAppend[node.name]));
			}
			if (lib.config.show_sortPack) {
				for (let packname in lib.characterPack) {
					if (node.name in lib.characterPack[packname]) {
						let pack = lib.translate[packname + "_character_config"], sort;
						if (lib.characterSort[packname]) {
							let sorted = lib.characterSort[packname];
							for (let sortname in sorted) {
								if (sorted[sortname].includes(node.name)) {
									sort = `<span style = "font-size:small">${lib.translate[sortname]}</span>`;
									break;
								}
							}
						}
						const sortPack = document.createElement("div");
						sortPack.innerHTML = `${pack}${sort ? `<br>[${sort}]` : ""}`;
						sortPack.appendChild(document.createElement("hr"));
						sortPack.insertBefore(document.createElement("hr"), sortPack.firstChild);
						uiintro.add(sortPack);
						break;
					}
				}
			}
			if (get.characterInitFilter(node.name)) {
				const initFilters = get.characterInitFilter(node.name).filter((tag) => {
					if (!lib.characterInitFilter[node.name]) {
						return true;
					}
					return lib.characterInitFilter[node.name](tag) !== false;
				});
				if (initFilters.length) {
					const str2 = initFilters.reduce((strx, stry) => strx + lib.InitFilter[stry] + "<br>", "").slice(0, -4);
					uiintro.addText(str2);
				}
			}
			if (!node.noclick) {
				const allShown = node.isUnderControl() || !game.observe && game.me && game.me.hasSkillTag("viewHandcard", null, node, true);
				const shownHs = node.getShownCards();
				if (shownHs.length) {
					uiintro.add('<div class="text center">明置的手牌</div>');
					uiintro.addSmall(shownHs);
					if (allShown) {
						var hs = node.getCards("h");
						hs.removeArray(shownHs);
						if (hs.length) {
							uiintro.add('<div class="text center">其他手牌</div>');
							uiintro.addSmall(hs);
						}
					}
				} else if (allShown) {
					var hs = node.getCards("h");
					if (hs.length) {
						uiintro.add('<div class="text center">手牌</div>');
						uiintro.addSmall(hs);
					}
				}
			}
			var skills = node.getSkills(null, false, false).slice(0);
			var skills2 = game.filterSkills(skills, node);
			if (node == game.me && node.hiddenSkills.length) {
				skills.addArray(node.hiddenSkills);
			}
			for (var i in node.disabledSkills) {
				if (node.disabledSkills[i].length == 1 && node.disabledSkills[i][0] == i + "_awake" && !node.hiddenSkills.includes(i)) {
					skills.add(i);
				}
			}
			for (i = 0; i < skills.length; i++) {
				if (lib.skill[skills[i]] && (lib.skill[skills[i]].nopop || lib.skill[skills[i]].equipSkill)) {
					continue;
				}
				if (lib.translate[skills[i] + "_info"]) {
					if (lib.translate[skills[i] + "_ab"]) {
						translation = lib.translate[skills[i] + "_ab"];
					} else {
						translation = get.translation(skills[i]);
						if (!lib.skill[skills[i]].nobracket) {
							translation = `【${translation.slice(0, 2)}】`;
						}
					}
					if (node.forbiddenSkills[skills[i]]) {
						var forbidstr = '<div style="opacity:0.5"><div class="skill">' + translation + "</div><div>";
						if (node.forbiddenSkills[skills[i]].length) {
							forbidstr += "（与" + get.translation(node.forbiddenSkills[skills[i]]) + "冲突）<br>";
						} else {
							forbidstr += "（双将禁用）<br>";
						}
						forbidstr += get.skillInfoTranslation(skills[i], node, false) + "</div></div>";
						uiintro.add(forbidstr);
					} else if (!skills2.includes(skills[i])) {
						if (lib.skill[skills[i]].preHidden && get.mode() == "guozhan") {
							uiintro.add('<div><div class="skill" style="opacity:0.5">' + translation + '</div><div><span style="opacity:0.5">' + get.skillInfoTranslation(skills[i], node, false) + '</span><br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div></div></div>');
							var underlinenode = uiintro.content.lastChild.querySelector(".underlinenode");
							if (_status.prehidden_skills.includes(skills[i])) {
								underlinenode.classList.remove("on");
							}
							underlinenode.link = skills[i];
							underlinenode.listen(ui.click.hiddenskill);
						} else {
							uiintro.add('<div style="opacity:0.5"><div class="skill">' + translation + "</div><div>" + get.skillInfoTranslation(skills[i], node, false) + "</div></div>");
						}
					} else if (lib.skill[skills[i]].temp || !node.skills.includes(skills[i]) || lib.skill[skills[i]].thundertext) {
						if (lib.skill[skills[i]].frequent || lib.skill[skills[i]].subfrequent) {
							uiintro.add('<div><div class="skill thundertext thunderauto">' + translation + '</div><div class="thundertext thunderauto">' + get.skillInfoTranslation(skills[i], node, false) + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div></div></div>');
							var underlinenode = uiintro.content.lastChild.querySelector(".underlinenode");
							if (lib.skill[skills[i]].frequent) {
								if (lib.config.autoskilllist.includes(skills[i])) {
									underlinenode.classList.remove("on");
								}
							}
							if (lib.skill[skills[i]].subfrequent) {
								for (var j = 0; j < lib.skill[skills[i]].subfrequent.length; j++) {
									if (lib.config.autoskilllist.includes(skills[i] + "_" + lib.skill[skills[i]].subfrequent[j])) {
										underlinenode.classList.remove("on");
									}
								}
							}
							if (lib.config.autoskilllist.includes(skills[i])) {
								underlinenode.classList.remove("on");
							}
							underlinenode.link = skills[i];
							underlinenode.listen(ui.click.autoskill2);
						} else {
							uiintro.add('<div><div class="skill thundertext thunderauto">' + translation + '</div><div class="thundertext thunderauto">' + get.skillInfoTranslation(skills[i], node, false) + "</div></div>");
						}
					} else if (lib.skill[skills[i]].frequent || lib.skill[skills[i]].subfrequent) {
						uiintro.add('<div><div class="skill">' + translation + "</div><div>" + get.skillInfoTranslation(skills[i], node, false) + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div></div></div>');
						var underlinenode = uiintro.content.lastChild.querySelector(".underlinenode");
						if (lib.skill[skills[i]].frequent) {
							if (lib.config.autoskilllist.includes(skills[i])) {
								underlinenode.classList.remove("on");
							}
						}
						if (lib.skill[skills[i]].subfrequent) {
							for (var j = 0; j < lib.skill[skills[i]].subfrequent.length; j++) {
								if (lib.config.autoskilllist.includes(skills[i] + "_" + lib.skill[skills[i]].subfrequent[j])) {
									underlinenode.classList.remove("on");
								}
							}
						}
						if (lib.config.autoskilllist.includes(skills[i])) {
							underlinenode.classList.remove("on");
						}
						underlinenode.link = skills[i];
						underlinenode.listen(ui.click.autoskill2);
					} else if (lib.skill[skills[i]].clickable && node.isIn() && node.isUnderControl(true)) {
						var intronode = uiintro.add('<div><div class="skill">' + translation + "</div><div>" + get.skillInfoTranslation(skills[i], node, false) + '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div></div></div>').querySelector(".skillbutton");
						if (!_status.gameStarted || lib.skill[skills[i]].clickableFilter && !lib.skill[skills[i]].clickableFilter(node)) {
							intronode.classList.add("disabled");
							intronode.style.opacity = 0.5;
						} else {
							intronode.link = node;
							intronode.func = lib.skill[skills[i]].clickable;
							intronode.classList.add("pointerdiv");
							intronode.listen(() => uiintro.close());
							intronode.listen(ui.click.skillbutton);
						}
					} else {
						uiintro.add('<div><div class="skill">' + translation + "</div><div>" + get.skillInfoTranslation(skills[i], node, false) + "</div></div>");
					}
					if (lib.translate[skills[i] + "_append"]) {
						uiintro._place_text = uiintro.add('<div class="text">' + lib.translate[skills[i] + "_append"] + "</div>");
					}
				}
			}
			if (lib.config.right_range && _status.gameStarted) {
				uiintro.add(ui.create.div(".placeholder"));
				var table, tr, td;
				table = document.createElement("table");
				tr = document.createElement("tr");
				table.appendChild(tr);
				td = document.createElement("td");
				td.innerHTML = "距离";
				tr.appendChild(td);
				td = document.createElement("td");
				td.innerHTML = "手牌";
				tr.appendChild(td);
				td = document.createElement("td");
				td.innerHTML = "行动";
				tr.appendChild(td);
				td = document.createElement("td");
				td.innerHTML = "伤害";
				tr.appendChild(td);
				tr = document.createElement("tr");
				table.appendChild(tr);
				td = document.createElement("td");
				if (node == game.me || !game.me || !game.me.isIn()) {
					td.innerHTML = "-";
				} else {
					var dist1 = get.numStr(Math.max(1, game.me.distanceTo(node)));
					var dist2 = get.numStr(Math.max(1, node.distanceTo(game.me)));
					if (dist1 == dist2) {
						td.innerHTML = dist1;
					} else {
						td.innerHTML = dist1 + "/" + dist2;
					}
				}
				tr.appendChild(td);
				td = document.createElement("td");
				let handcardLimit = node.getHandcardLimit();
				td.innerHTML = `${node.countCards("h")}/${handcardLimit >= 114514 ? "∞" : handcardLimit}`;
				tr.appendChild(td);
				td = document.createElement("td");
				td.innerHTML = node.phaseNumber;
				tr.appendChild(td);
				td = document.createElement("td");
				(function () {
					let num = 0;
					for (var j2 = 0; j2 < node.stat.length; j2++) {
						if (typeof node.stat[j2].damage == "number") {
							num += node.stat[j2].damage;
						}
					}
					td.innerHTML = num;
				})();
				tr.appendChild(td);
				table.style.width = "calc(100% - 20px)";
				table.style.marginLeft = "10px";
				uiintro.content.appendChild(table);
				if (!lib.config.show_favourite) {
					table.style.paddingBottom = "5px";
				}
			}
			if (!simple || get.is.phoneLayout()) {
				var es = node.getCards("e");
				for (var i = 0; i < es.length; i++) {
					const special = [es[i]].concat(es[i].cards || []).find((j2) => j2.name == es[i].name && lib.card[j2.name]?.cardPrompt);
					var str = special ? lib.card[special.name].cardPrompt(special, node) : lib.translate[es[i].name + "_info"];
					uiintro.add('<div><div class="skill">' + es[i].outerHTML + "</div><div>" + str + "</div></div>");
					uiintro.content.lastChild.querySelector(".skill>.card").style.transform = "";
					if (lib.translate[es[i].name + "_append"]) {
						uiintro.add('<div class="text">' + lib.translate[es[i].name + "_append"] + "</div>");
					}
				}
				var js = node.getCards("j");
				for (var i = 0; i < js.length; i++) {
					const Vcard2 = js[i][js[i].cardSymbol];
					if (js[i].viewAs && Vcard2.cards.length == 1 && js[i].viewAs != Vcard2.cards[0].name) {
						let html = Vcard2.cards[0].outerHTML;
						let cardInfo2 = lib.card[js[i].viewAs], showCardIntro2 = true;
						if (cardInfo2.blankCard) {
							var cardOwner = get.owner(js[i]);
							if (cardOwner && !cardOwner.isUnderControl(true)) {
								showCardIntro2 = false;
							}
						}
						if (!showCardIntro2) {
							html = ui.create.button(js[i], "blank").outerHTML;
						}
						uiintro.add(`<div><div class="skill">${html}</div><div>${lib.translate[js[i].viewAs]}：${lib.card[js[i].viewAs]?.cardPrompt?.(js[i], node) || lib.translate[`${js[i].viewAs}_info`]}</div></div>`);
					} else {
						uiintro.add(`<div><div class="skill">${js[i].outerHTML}</div><div>${lib.translate[js[i].name]}：${lib.card[js[i].name]?.cardPrompt?.(js[i], node) || lib.translate[`${js[i].name}_info`]}</div></div>`);
					}
					uiintro.content.lastChild.querySelector(".skill>.card").style.transform = "";
				}
				if (get.is.phoneLayout()) {
					var markCoutainer = ui.create.div(".mark-container.marks");
					for (var i in node.marks) {
						var nodemark = node.marks[i].cloneNode(true);
						nodemark.classList.add("pointerdiv");
						nodemark.link = node.marks[i];
						nodemark.style.transform = "";
						markCoutainer.appendChild(nodemark);
						nodemark.listen(function () {
							uiintro.noresume = true;
							var rect = this.link.getBoundingClientRect();
							ui.click.intro.call(this.link, {
								clientX: rect.left + rect.width,
								clientY: rect.top + rect.height / 2
							});
							if (lib.config.touchscreen) {
								uiintro._close();
							}
						});
					}
					if (markCoutainer.childElementCount) {
						uiintro.addText("标记");
						uiintro.add(markCoutainer);
					}
				}
			}
			if (!game.observe && _status.gameStarted && game.me && node != game.me) {
				ui.throwEmotion = [];
				uiintro.addText("发送交互表情");
				var click = function (e) {
					// 阻止事件冒泡，防止触发父元素的关闭逻辑
					if (e && e.stopPropagation) e.stopPropagation();

					if (_status.dragged) {
						return;
					}
					if (_status.justdragged) {
						return;
					}
					/*if (_status.throwEmotionWait) {
						return;
					}*///关闭砸蛋冷却
					var emotion = this.link;
					if (game.online) {
						game.send("throwEmotion", node, emotion);
					} else {
						game.me.throwEmotion(node, emotion);
					}
				//	uiintro._close();
					_status.throwEmotionWait = true;
					setTimeout(
						function () {
							_status.throwEmotionWait = false;
							if (ui.throwEmotion) {
								for (var i2 of ui.throwEmotion) {
									i2.classList.remove("exclude");
								}
							}
						},
						emotion == "flower" || emotion == "egg" ? 500 : 5e3
					);
					// 阻止默认行为
					if (e && e.preventDefault) e.preventDefault();
					return false;
				};
				var td;
				var table = document.createElement("div");
				table.classList.add("add-setting");
				table.style.margin = "0";
				table.style.width = "100%";
				table.style.position = "relative";
				var listi = ["flower", "egg"];
				for (var i = 0; i < listi.length; i++) {
					td = ui.create.div(".menubutton.reduce_radius.pointerdiv.tdnode");
					ui.throwEmotion.add(td);
					if (_status.throwEmotionWait) {
						td.classList.add("exclude");
					}
					td.link = listi[i];
					table.appendChild(td);
					td.innerHTML = "<span>" + get.translation(listi[i]) + "</span>";
					td.addEventListener(lib.config.touchscreen ? "touchend" : "click", click);
				}
				uiintro.content.appendChild(table);
				table = document.createElement("div");
				table.classList.add("add-setting");
				table.style.margin = "0";
				table.style.width = "100%";
				table.style.position = "relative";
				var listi = ["wine", "shoe"];
				if (game.me.storage.zhuSkill_shanli) {
					listi = ["yuxisx", "jiasuo"];
				}
				for (var i = 0; i < listi.length; i++) {
					td = ui.create.div(".menubutton.reduce_radius.pointerdiv.tdnode");
					ui.throwEmotion.add(td);
					if (_status.throwEmotionWait) {
						td.classList.add("exclude");
					}
					td.link = listi[i];
					table.appendChild(td);
					td.innerHTML = "<span>" + get.translation(listi[i]) + "</span>";
					td.addEventListener(lib.config.touchscreen ? "touchend" : "click", click);
				}
				uiintro.content.appendChild(table);
			}
			var modepack = lib.characterPack["mode_" + get.mode()];
			if (lib.config.show_favourite && lib.character[node.name] && game.players.includes(node) && (!modepack || !modepack[node.name]) && (!simple || get.is.phoneLayout())) {
				var addFavourite = ui.create.div(".text.center.pointerdiv");
				addFavourite.link = node.name;
				addFavourite.style.marginRight = "15px";
				if (lib.config.favouriteCharacter.includes(node.name)) {
					addFavourite.innerHTML = "移除收藏";
				} else {
					addFavourite.innerHTML = "添加收藏";
				}
				addFavourite.listen(ui.click.favouriteCharacter);
				uiintro.add(addFavourite);
			}
			if (!simple || get.is.phoneLayout()) {
				let viewInfo = ui.create.div(".text.center.pointerdiv");
				viewInfo.link = node;
				viewInfo.innerHTML = "查看资料";
				viewInfo.listen(function () {
					let player2 = this.link;
					let audioName = player2.skin.name || player2.name1 || player2.name;
					ui.click.charactercard(player2.name1 || player2.name, null, null, true, player2.node.avatar, audioName);
				});
				uiintro.add(viewInfo);
			}
			if ((lib.config.change_skin || lib.skin) && (!simple || get.is.phoneLayout())) {
				[node.name1, node.name2].forEach((nameskin, index) => {
					if (nameskin) {
						createButtons(nameskin, (src) => {
							const avatar = node.node[index ? "avatar2" : "avatar"];
							if (src === "origin") avatar.setBackground(nameskin, "character");
							else avatar.style.backgroundImage = `url('${src}')`;
						});
					}
				});
			}
			uiintro.add(ui.create.div(".placeholder.slim"));
		} else if (node.classList.contains("mark") && node.info && node.parentNode && node.parentNode.parentNode && node.parentNode.parentNode.classList.contains("player")) {
			var info = node.info;
			var player = node.parentNode.parentNode;
			if (info.name) {
				if (typeof info.name == "function") {
					var named = info.name(player.storage[node.skill], player);
					if (named) {
						uiintro.add(named);
					}
				} else {
					uiintro.add(info.name);
				}
			} else if (info.name !== false) {
				uiintro.add(get.translation(node.skill));
			}
			if (typeof info.id == "string" && info.id.startsWith("subplayer") && player.isUnderControl(true) && player.storage[info.id] && !_status.video) {
				var storage = player.storage[info.id];
				uiintro.addText("当前体力：" + storage.hp + "/" + storage.maxHp);
				if (storage.hs.length) {
					uiintro.addText("手牌区");
					uiintro.addSmall(storage.hs);
				}
				if (storage.es.length) {
					uiintro.addText("装备区");
					uiintro.addSmall(storage.es);
				}
			}
			if (typeof info.mark == "function") {
				var stint = info.mark(uiintro, player.storage[node.skill], player, evt, node.skill);
				if (stint instanceof Promise) {
					uiintro.hide();
					stint.then(() => {
						uiintro.show();
						if (evt) {
							lib.placePoppedDialog(uiintro, evt);
						}
					});
				} else if (stint) {
					var placetext = uiintro.add('<div class="text" style="display:inline">' + stint + "</div>");
					if (!stint.startsWith('<div class="skill"')) {
						uiintro._place_text = placetext;
					}
				}
			} else {
				var stint = get.storageintro(info.content, player.storage[node.skill], player, uiintro, node.skill);
				if (stint) {
					if (stint[0] == "@") {
						uiintro.add('<div class="caption">' + stint.slice(1) + "</div>");
					} else {
						var placetext = uiintro.add('<div class="text" style="display:inline">' + stint + "</div>");
						if (!stint.startsWith('<div class="skill"')) {
							uiintro._place_text = placetext;
						}
					}
				}
			}
			uiintro.add(ui.create.div(".placeholder.slim"));
		} else if (node.classList.contains("card")) {
			if (ui.arena.classList.contains("observe") && node.parentNode.classList.contains("handcards")) {
				return;
			}
			var name = node.name, Vcard = node[node.cardSymbol] || false, trueCard = node;
			if (node.parentNode.cardMod) {
				var moded = false;
				for (var i in node.parentNode.cardMod) {
					var item = node.parentNode.cardMod[i](node);
					if (Array.isArray(item)) {
						moded = true;
						uiintro.add(item[0]);
						uiintro._place_text = uiintro.add('<div class="text" style="display:inline">' + item[1] + "</div>");
					}
				}
				if (moded) {
					return uiintro;
				}
			}
			if (node.link?.name && lib.card[node.link.name]) {
				name = node.link.name;
				Vcard = node.link[node.link.cardSymbol] || false;
				trueCard = node.link;
			}
			var cardPosition = get.position(trueCard);
			if ((cardPosition === "e" || cardPosition === "j") && trueCard.viewAs && trueCard.viewAs != name || Vcard && (Vcard.cards.length != 1 || Vcard.cards[0].name != name)) {
				uiintro.add(get.translation(trueCard.viewAs));
				var cardInfo = lib.card[trueCard.viewAs], showCardIntro = true;
				var cardOwner = get.owner(trueCard);
				if (cardInfo.blankCard) {
					if (cardOwner && !cardOwner.isUnderControl(true)) {
						showCardIntro = false;
					}
				}
				if (cardOwner && showCardIntro) {
					uiintro.isNotCard = true;
				}
				name = trueCard.viewAs;
			} else {
				if (node.extraEquip) {
					name = node.extraEquip[1];
					uiintro.add(`${get.translation(node.extraEquip[0])} ${get.translation(node.extraEquip[1])}`);
				} else {
					uiintro.add(get.translation(node));
				}
			}
			if (node._banning) {
				var clickBanned = function () {
					var banned2 = lib.config[this.bannedname] || [];
					if (banned2.includes(name)) {
						banned2.remove(name);
					} else {
						banned2.push(name);
					}
					game.saveConfig(this.bannedname, banned2);
					this.classList.toggle("on");
					if (node.updateBanned) {
						node.updateBanned();
					}
				};
				var modeorder = lib.config.modeorder || [];
				for (var i in lib.mode) {
					modeorder.add(i);
				}
				var list = [];
				uiintro.contentContainer.listen(function (e) {
					ui.click.touchpop();
					e.stopPropagation();
				});
				for (var i = 0; i < modeorder.length; i++) {
					if (node._banning == "online") {
						if (!lib.mode[modeorder[i]].connect) {
							continue;
						}
					} else if (modeorder[i] == "connect" || modeorder[i] == "brawl") {
						continue;
					}
					if (lib.config.all.mode.includes(modeorder[i])) {
						list.push(modeorder[i]);
					}
				}
				if (lib.card[name] && lib.card[name].type == "trick") {
					list.push("zhinang_tricks");
				}
				var page = ui.create.div(".menu-buttons.configpopped", uiintro.content);
				var banall = false;
				for (var i = 0; i < list.length; i++) {
					var cfg = ui.create.div(".config", list[i] == "zhinang_tricks" ? "设为智囊" : lib.translate[list[i]] + "模式", page);
					cfg.classList.add("toggle");
					if (list[i] == "zhinang_tricks") {
						cfg.bannedname = (node._banning == "offline" ? "" : "connect_") + "zhinang_tricks";
					} else if (node._banning == "offline") {
						cfg.bannedname = list[i] + "_bannedcards";
					} else {
						cfg.bannedname = "connect_" + list[i] + "_bannedcards";
					}
					cfg.listen(clickBanned);
					ui.create.div(ui.create.div(cfg));
					var banned = lib.config[cfg.bannedname] || [];
					if (banned.includes(name) == (list[i] == "zhinang_tricks")) {
						cfg.classList.add("on");
						banall = true;
					}
				}
				ui.create.div(".menubutton.pointerdiv", banall ? "全部禁用" : "全部启用", uiintro.content, function () {
					if (this.innerHTML == "全部禁用") {
						for (var i2 = 0; i2 < page.childElementCount; i2++) {
							if (page.childNodes[i2].bannedname.indexOf("zhinang_tricks") == -1 && page.childNodes[i2].bannedname && page.childNodes[i2].classList.contains("on")) {
								clickBanned.call(page.childNodes[i2]);
							}
						}
						this.innerHTML = "全部启用";
					} else {
						for (var i2 = 0; i2 < page.childElementCount; i2++) {
							if (page.childNodes[i2].bannedname.indexOf("zhinang_tricks") == -1 && page.childNodes[i2].bannedname && !page.childNodes[i2].classList.contains("on")) {
								clickBanned.call(page.childNodes[i2]);
							}
						}
						this.innerHTML = "全部禁用";
					}
				}).style.marginTop = "-10px";
				ui.create.div(".placeholder.slim", uiintro.content);
			} else {
				if (lib.translate[name + "_info"]) {
					if (!uiintro.nosub) {
						if (lib.card[name] && lib.card[name].derivation) {
							if (typeof lib.card[name].derivation == "string") {
								uiintro.add('<div class="text center">来源：' + get.translation(lib.card[name].derivation) + "</div>");
							} else if (lib.card[name].derivationpack) {
								uiintro.add('<div class="text center">来源：' + get.translation(lib.card[name].derivationpack + "_card_config") + "包</div>");
							}
						}
						let typeinfo = "";
						if (lib.card[name] && lib.card[name].unique) {
							typeinfo += "特殊" + get.translation(lib.card[name].type) + "牌";
						} else if (lib.card[name] && lib.card[name].type && lib.translate[lib.card[name].type]) {
							typeinfo += get.translation(lib.card[name].type) + "牌";
						}
						let vcard = get.owner(node)?.getVCards(get.position(node))?.find((card) => card.cards?.includes(node));
						if (get.subtypes(vcard || node, get.owner(node))?.length) {
							typeinfo += "-" + get.subtypes(vcard || node, get.owner(node)).map((type) => get.translation(type)).join("/");
						}
						if (typeinfo) {
							uiintro.add('<div class="text center">' + typeinfo + "</div>");
						}
						if (lib.card[name].unique && lib.card[name].type == "equip") {
							if (lib.cardPile.guozhan && lib.cardPack.guozhan.includes(name)) {
								uiintro.add('<div class="text center">专属装备</div>').style.marginTop = "-5px";
							} else {
								uiintro.add('<div class="text center">特殊装备</div>').style.marginTop = "-5px";
							}
						}
						if (lib.card[name] && lib.card[name].addinfomenu) {
							uiintro.add('<div class="text center">' + lib.card[name].addinfomenu + "</div>");
						}
						if (get.subtype(name, false) == "equip1") {
							var added = false;
							if (lib.card[name] && lib.card[name].distance) {
								var dist = lib.card[name].distance;
								if (dist.attackFrom) {
									added = true;
									uiintro.add('<div class="text center">攻击范围：' + (-dist.attackFrom + 1) + "</div>");
								}
							}
							if (!added) {
								uiintro.add('<div class="text center">攻击范围：1</div>');
							}
						}
					}
					if (lib.card[name].cardPrompt) {
						var str = lib.card[name].cardPrompt(node.link || node, get.owner(node)), placetext = uiintro.add('<div class="text" style="display:inline">' + str + "</div>");
						if (!str.startsWith('<div class="skill"')) {
							uiintro._place_text = placetext;
						}
					} else if (lib.translate[name + "_info"]) {
						var placetext = uiintro.add('<div class="text" style="display:inline">' + lib.translate[name + "_info"] + "</div>");
						if (!lib.translate[name + "_info"].startsWith('<div class="skill"')) {
							uiintro._place_text = placetext;
						}
					}
					if (get.is.yingbianConditional(node.link || node)) {
						const yingbianEffects = get.yingbianEffects(node.link || node);
						if (!yingbianEffects.length) {
							const defaultYingbianEffect = get.defaultYingbianEffect(node.link || node);
							if (lib.yingbian.prompt.has(defaultYingbianEffect)) {
								yingbianEffects.push(defaultYingbianEffect);
							}
						}
						if (yingbianEffects.length && showCardIntro) {
							uiintro.add(`<div class="text" style="font-family: yuanli">应变：${yingbianEffects.map((value) => lib.yingbian.prompt.get(value)).join("；")}</div>`);
						}
					}
					if (lib.translate[name + "_append"]) {
						uiintro.add('<div class="text" style="display:inline">' + lib.translate[name + "_append"] + "</div>");
					}
					if (uiintro.isNotCard) {
						if (Vcard?.cards?.length) {
							uiintro.add('<div class="text center">—— 对应实体牌 ——</div>');
							uiintro.addSmall(Vcard.cards);
						} else {
							uiintro.add('<div class="text center">（这是一张虚拟牌）</div>');
						}
					}
					if (node.gaintag?.length) {
						let gaintag = node.gaintag.map((tag) => {
							let translate = get.translation(tag);
							if (translate === tag && tag.startsWith("eternal_")) {
								translate = get.translation(tag.slice(8));
							}
							;
							if (translate === "invisible") {
								return "";
							}
							return translate;
						}).filter((tag) => tag.length);
						if (gaintag?.length) {
							uiintro.add(" ");
							uiintro.add(`<div class="text" style="display:inline">此牌标签：${gaintag}</div>`);
						}
					}
				}
				uiintro.add(ui.create.div(".placeholder.slim"));
			}
		} else if (node.classList.contains("character")) {
			const character = node.link, characterInfo = get.character(node.link);
			let capt = get.translation(character);
			if (characterInfo) {
				const infoSex = characterInfo[0];
				if (infoSex && lib.config.show_sex) {
					capt += `&nbsp;&nbsp;${infoSex == "none" ? "无" : lib.translate[infoSex]}`;
				}
				const infoGroup = characterInfo[1];
				if (infoGroup && lib.config.show_group) {
					const group = get.is.double(character, true);
					if (group) {
						capt += `&nbsp;&nbsp;${group.map((value) => get.translation(value)).join("/")}`;
					} else {
						capt += `&nbsp;&nbsp;${lib.translate[infoGroup]}`;
					}
				}
			}
			uiintro.add(capt);
			if (lib.characterTitle[node.link]) {
				uiintro.addText(get.colorspan(lib.characterTitle[node.link]));
			}
			if (lib.characterAppend[node.link]) {
				uiintro.addText(get.colorspan(lib.characterAppend[node.link]));
			}
			if (lib.config.show_sortPack) {
				for (let packname in lib.characterPack) {
					if (node.link in lib.characterPack[packname]) {
						let pack = lib.translate[packname + "_character_config"], sort;
						if (lib.characterSort[packname]) {
							let sorted = lib.characterSort[packname];
							for (let sortname in sorted) {
								if (sorted[sortname].includes(node.link)) {
									sort = `<span style = "font-size:small">[${lib.translate[sortname]}]</span>`;
									break;
								}
							}
						}
						const sortPack = document.createElement("div");
						sortPack.innerHTML = `${pack}${sort ? `<br>${sort}` : ""}`;
						sortPack.appendChild(document.createElement("hr"));
						sortPack.insertBefore(document.createElement("hr"), sortPack.firstChild);
						uiintro.add(sortPack);
						break;
					}
				}
			}
			if (get.characterInitFilter(node.link)) {
				const initFilters = get.characterInitFilter(node.link).filter((tag) => {
					if (!lib.characterInitFilter[node.link]) {
						return true;
					}
					return lib.characterInitFilter[node.link](tag) !== false;
				});
				if (initFilters.length) {
					const str2 = initFilters.reduce((strx, stry) => strx + lib.InitFilter[stry] + "<br>", "").slice(0, -4);
					uiintro.addText(str2);
				}
			}
			if (node._banning) {
				var clickBanned = function () {
					var banned2 = lib.config[this.bannedname] || [];
					if (banned2.includes(character)) {
						banned2.remove(character);
					} else {
						banned2.push(character);
					}
					game.saveConfig(this.bannedname, banned2);
					this.classList.toggle("on");
					if (node.updateBanned) {
						node.updateBanned();
					}
				};
				var modeorder = lib.config.modeorder || [];
				for (var i in lib.mode) {
					modeorder.add(i);
				}
				var list = [];
				uiintro.contentContainer.listen(function (e) {
					ui.click.touchpop();
					e.stopPropagation();
				});
				for (var i = 0; i < modeorder.length; i++) {
					if (node._banning == "online") {
						if (!lib.mode[modeorder[i]].connect) {
							continue;
						}
						if (!lib.config["connect_" + modeorder[i] + "_banned"]) {
							lib.config["connect_" + modeorder[i] + "_banned"] = [];
						}
					} else if (modeorder[i] == "connect" || modeorder[i] == "brawl") {
						continue;
					}
					if (lib.config.all.mode.includes(modeorder[i])) {
						list.push(modeorder[i]);
					}
				}
				var page = ui.create.div(".menu-buttons.configpopped", uiintro.content);
				var banall = false;
				for (var i = 0; i < list.length; i++) {
					var cfg = ui.create.div(".config", lib.translate[list[i]] + "模式", page);
					cfg.classList.add("toggle");
					if (node._banning == "offline") {
						cfg.bannedname = list[i] + "_banned";
					} else {
						cfg.bannedname = "connect_" + list[i] + "_banned";
					}
					cfg.listen(clickBanned);
					ui.create.div(ui.create.div(cfg));
					var banned = lib.config[cfg.bannedname] || [];
					if (!banned.includes(character)) {
						cfg.classList.add("on");
						banall = true;
					}
				}
				if (node._banning == "offline") {
					var cfg = ui.create.div(".config", "随机选将可用", page);
					cfg.classList.add("toggle");
					cfg.listen(function () {
						this.classList.toggle("on");
						if (this.classList.contains("on")) {
							lib.config.forbidai_user.remove(character);
						} else {
							lib.config.forbidai_user.add(character);
						}
						game.saveConfig("forbidai_user", lib.config.forbidai_user);
					});
					ui.create.div(ui.create.div(cfg));
					if (!lib.config.forbidai_user.includes(character)) {
						cfg.classList.add("on");
					}
				}
				ui.create.div(".menubutton.pointerdiv", banall ? "全部禁用" : "全部启用", uiintro.content, function () {
					if (this.innerHTML == "全部禁用") {
						for (var i2 = 0; i2 < page.childElementCount; i2++) {
							if (page.childNodes[i2].bannedname && page.childNodes[i2].classList.contains("on")) {
								clickBanned.call(page.childNodes[i2]);
							}
						}
						this.innerHTML = "全部启用";
					} else {
						for (var i2 = 0; i2 < page.childElementCount; i2++) {
							if (page.childNodes[i2].bannedname && !page.childNodes[i2].classList.contains("on")) {
								clickBanned.call(page.childNodes[i2]);
							}
						}
						this.innerHTML = "全部禁用";
					}
				}).style.marginTop = "-10px";
				ui.create.div(".placeholder.slim", uiintro.content);
			} else {
				var skills = get.character(character, 3);
				for (i = 0; i < skills.length; i++) {
					if (lib.translate[skills[i] + "_info"]) {
						if (lib.translate[skills[i] + "_ab"]) {
							translation = lib.translate[skills[i] + "_ab"];
						} else {
							translation = get.translation(skills[i]);
							if (!lib.skill[skills[i]].nobracket) {
								translation = `【${translation.slice(0, 2)}】`;
							}
						}
						uiintro.add('<div><div class="skill">' + translation + "</div><div>" + get.skillInfoTranslation(skills[i], null, false) + "</div></div>");
						if (lib.translate[skills[i] + "_append"]) {
							uiintro._place_text = uiintro.add('<div class="text">' + lib.translate[skills[i] + "_append"] + "</div>");
						}
					}
				}
				var modepack = lib.characterPack["mode_" + get.mode()];
				if (lib.config.show_favourite && lib.character[node.link] && (!modepack || !modepack[node.link]) && (!simple || get.is.phoneLayout())) {
					var addFavourite = ui.create.div(".text.center.pointerdiv");
					addFavourite.link = node.link;
					addFavourite.style.marginBottom = "15px";
					addFavourite.style.marginRight = "15px";
					if (lib.config.favouriteCharacter.includes(node.link)) {
						addFavourite.innerHTML = "移除收藏";
					} else {
						addFavourite.innerHTML = "添加收藏";
					}
					addFavourite.listen(ui.click.favouriteCharacter);
					uiintro.add(addFavourite);
				} else {
					uiintro.add(ui.create.div(".placeholder.slim"));
				}
				if (!simple || get.is.phoneLayout()) {
					let viewInfo = ui.create.div(".text.center.pointerdiv");
					viewInfo.link = node.link;
					viewInfo.innerHTML = "查看资料";
					viewInfo.style.marginBottom = "15px";
					viewInfo.listen(function () {
						return ui.click.charactercard(this.link, node);
					});
					uiintro.add(viewInfo);
				}
				if ((lib.config.change_skin || lib.skin) && (!simple || get.is.phoneLayout())) {
					const nameskin = node.link;
					if (nameskin) {
						createButtons(nameskin, (src) => {
							if (src === "origin") node.setBackground(nameskin, "character");
							else node.style.backgroundImage = `url('${src}')`;
						});
					}
				}
			}
		} else if (node.classList.contains("equips") && ui.arena.classList.contains("selecting")) {
			(function () {
				uiintro.add("选择装备");
				uiintro.addSmall(
					Array.from(node.childNodes).filter((node2) => !node2.classList.contains("emptyequip") && !node2.classList.contains("feichu")),
					true
				);
				uiintro.clickintro = true;
				ui.control.hide();
				uiintro._onclose = function () {
					ui.control.show();
				};
				var confirmbutton;
				for (var i2 = 0; i2 < uiintro.buttons.length; i2++) {
					var button = uiintro.buttons[i2];
					button.classList.add("pointerdiv");
					if (button.link.classList.contains("selected")) {
						button.classList.add("selected");
					}
					button.listen(function (e) {
						ui.click.card.call(this.link, "popequip");
						ui.click.window.call(ui.window, e);
						if (this.link.classList.contains("selected")) {
							this.classList.add("selected");
						} else {
							this.classList.remove("selected");
						}
						if (ui.confirm && ui.confirm.str && ui.confirm.str.includes("o")) {
							confirmbutton.classList.remove("disabled");
						} else {
							confirmbutton.classList.add("disabled");
						}
					});
				}
				var buttoncontainer = uiintro.add(ui.create.div());
				buttoncontainer.style.display = "block";
				confirmbutton = ui.create.div(
					".menubutton.large.pointerdiv",
					"确定",
					function () {
						if (ui.confirm && ui.confirm.str && ui.confirm.str.includes("o")) {
							uiintro._clickintro();
							ui.click.ok(ui.confirm.firstChild);
						}
					},
					buttoncontainer
				);
				confirmbutton.style.position = "relative";
				setTimeout(function () {
					if (ui.confirm && ui.confirm.str && ui.confirm.str.includes("o")) {
						confirmbutton.classList.remove("disabled");
					} else {
						confirmbutton.classList.add("disabled");
					}
				}, 300);
			})();
		} else if (node.classList.contains("identity") && node.dataset.career) {
			var career = node.dataset.career;
			uiintro.add(get.translation(career));
			uiintro.add('<div class="text center" style="padding-bottom:5px">' + lib.translate["_" + career + "_skill_info"] + "</div>");
		} else if (node.classList.contains("skillbar")) {
			if (node == ui.friendBar) {
				uiintro.add("友方怒气值");
				uiintro.add('<div class="text center" style="padding-bottom:5px">' + _status.friendRage + "/100</div>");
			} else if (node == ui.enemyBar) {
				uiintro.add("敌方怒气值");
				uiintro.add('<div class="text center" style="padding-bottom:5px">' + _status.enemyRage + "/100</div>");
			}
		} else if (node.parentNode == ui.historybar) {
			if (node.dead) {
				if (!node.source || node.source == node.player) {
					uiintro.add('<div class="text center">' + get.translation(node.player) + "阵亡</div>");
					uiintro.addSmall([node.player]);
				} else {
					uiintro.add('<div class="text center">' + get.translation(node.player) + "被" + get.translation(node.source) + "杀害</div>");
					uiintro.addSmall([node.source]);
				}
			}
			if (node.skill) {
				uiintro.add('<div class="text center">' + get.translation(node.skill) + "</div>");
				uiintro._place_text = uiintro.add('<div class="text" style="display:inline">' + get.translation(node.skill, "info") + "</div>");
			}
			if (node.targets && get.itemtype(node.targets) == "players") {
				uiintro.add('<div class="text center">目标</div>');
				uiintro.addSmall(node.targets);
			}
			if (node.players && node.players.length > 1) {
				uiintro.add('<div class="text center">使用者</div>');
				uiintro.addSmall(node.players);
			}
			if (node.cards && node.cards.length) {
				uiintro.add('<div class="text center">卡牌</div>');
				uiintro.addSmall(node.cards);
			}
			for (var i = 0; i < node.added.length; i++) {
				uiintro.add(node.added[i]);
			}
			if (node.added.length) {
				uiintro.add(ui.create.div(".placeholder.slim"));
			}
			if (uiintro.content.firstChild) {
				uiintro.content.firstChild.style.paddingTop = "3px";
			}
		} else if (node.classList.contains("nodeintro")) {
			if (node.nodeTitle) {
				uiintro.add(node.nodeTitle);
			}
			uiintro._place_text = uiintro.add('<div class="text">' + node.nodeContent + "</div>");
		}
		if (lib.config.touchscreen) {
			lib.setScroll(uiintro.contentContainer);
		}
		return uiintro;
	};
}

