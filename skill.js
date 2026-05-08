import {
    lib,
    game,
    ui,
    get,
    ai,
    _status
} from "../../noname.js";
/** @type { importCharacterConfig['skill'] } */
const skills = {
	_RoundHujia: {
		ruleSkill: true,
		group: "_RoundHujia_count",
		subSkill: {
			count: {
				trigger: {
					player: "changeHujiaEnd"
				},
				popup: false,
				priority: 1001,
				locked: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					return event.num < 0 && player.countMark("_RoundHujia")
				},
				async content(event, trigger, player) {
					player.removeMark("_RoundHujia", -trigger.num, false);
				}
			}
		},
		trigger: {
			global: "roundStart",
		},
		popup: false,
		priority: 1001,
		locked: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			return player.countMark("_RoundHujia")
		},
		async content(event, trigger, player) {
			const num = player.countMark("_RoundHujia");
			player.clearMark("_RoundHujia", false);
			await player.changeHujia(-num);
		}
	},
	// 播放音乐
	_yzsmusic: {
		ruleSkill: true,
		trigger: {
			global: ["gameStart"],
		},
		direct: true,
		superCharlotte: true,
		filter(event, player) {
			return game.hasPlayer(p => p.name in lib.characterPack['SCHyzs']) && lib.config.extension_一中杀_yzs_bgm
		},
		async content(event, trigger, player) {
			var targets = game.filterPlayer(p => get.character(p.name).BGM);
			let num = 0;
			const max = Math.max(4, game.countPlayer());
			lib.config.all.background_music = [];
			if (targets.length) for (let target of targets) {
				const bgm = get.character(target.name).BGM
				lib.config.all.background_music.add(`ext:一中杀/audio/${bgm}.mp3`)
				num++;
			}
			let list = ["My Sunset", "泡沫、哀のまほろば", "Time Bomb", "inhuman", "Lupinus", "Pigstep (Stereo Mix)",
				"Puppet in the Dark(PartⅡBuried Away)", "RYUKYUVANIA V2", "Vagrant",
				"果てなき風の軌跡さえ", "月に叢雲華に風"]
			while (num < max && list.length) {
				let i = list[Math.floor(Math.random() * list.length)];
				list.remove(i);
				lib.config.all.background_music.add(`ext:一中杀/audio/${i}.mp3`)
				num++;
			}
			const bgms = lib.config.all.background_music
			game.broadcastAll(function (bgms) {
				lib.config.all.background_music = bgms;
				game.playBackgroundMusic()
			}, bgms);
		},
	},
	//召引风暴
	_yzsSummonStorm: {
		subSkill: {
			backup: {
				"skill_id": "_yzsSummonStorm_backup",
				sub: true,
				sourceSkill: "_yzsSummonStorm",
				"_priority": 0,
			},
		},
		ruleSkill: true,
		enable: "phaseUse",
		usable: 1,
		locked: true,
		filter(event, player) {
			if (!player.hasMark("Totem_yzs")) return false;
			let possible = player.getPossibleStorm();
			if (!possible.length) return false;
			return true;
		},
		chooseButton: {
			dialog(event, player) {
				let dialog = ui.create.dialog("召引风暴：请选择要召引的风暴", "hidden");
				let possible = player.getPossibleStorm();
				for (let i = 0; i < possible.length; i++) {
					possible[i] = [possible[i], get.translation(possible[i] + "_instant_info")]
				}
				possible.flat()
				dialog.add([
					possible,
					"textbutton",
				]);
				return dialog;
			},
			filter(button, player) {
				if (button.link == _status._yzsStorm) return false;
				return true
			},
			backup(links, player) {
				const storm = links[0];
				return {
					storm: storm,
					filterCard: () => false,
					selectCard: -1,
					async content(event, trigger, player) {
						const storm = lib.skill._yzsSummonStorm_backup.storm;
						player.removeMark("Totem_yzs")
						await player.yzs_SummonStorm(storm);
					},
				};
			},
			check(button) {
				const player = get.player();
				let v = 0;
				if (button.link == "FireStorm") {
					v += player.getUseValue({ name: "jiu" })-2
				} else if (button.link == "ThunderStorm") {
					v += player.getUseValue({name:"tiesuo"})-2
				} else if (button.link == "WaterStorm") {
					v += Math.min(player.getUseValue({ name: "tao" }), player.getUseValue({ name: "taoyuan" }))-2
				} else if (button.link == "IceStorm") {
					v += 2;
					if (player.countCards("h") > 3) v += 2;
				} else if (button.link == "BulletStorm") {
					let usable = player.getCardUsable("sha");
					if (usable < 1) v += 1.5;
					if (player.hasSha()) v += 1.5;
					if (player.hp >= player.maxHp / 2) v += 2.2;
				} else if (button.link == "WindStorm") {
					v += player.getUseValue({ name: "wuzhong" })-2
					v += 0.2 * player.countCards("h")
				} else return 114;
				return v > 5;
			},
			prompt(links, player) {
				const storm = links[0],
					str = "###召引风暴###";
				return str + '<div class="text center">' + "请选择要召引的风暴</div>";
			},
		},
		ai: {
			order: 9,
			result: {
				player(player, target) {
					return 3;
				},
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	//分发图腾
	_yzsTotem: {
		ruleSkill: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		charlotte: true,
		filter(event, player) {
			if (!(event.name != "phase" || game.phaseNumber == 0) && game.hasPlayer(current => current != player)) return false;
			if (get.character(player.name).Storm) return true;
			if (!lib.config.extension_一中杀_yzsTotem) return false;
			return true;
		},
		async content(event, trigger, player) {
			player.addMark("Totem_yzs");
		},
	},
	//风暴属性伤害
	_yzsNatureDamage: {
		ruleSkill: true,
		popup: false,
		charlotte: false,
		forced: true,
		firstDo: true,
		trigger: {
			source: "damageBefore",
		},
		filter(event, trigger, player) {
			const evt = event;
			if (!evt || !evt.card || !evt.card.storage || !evt.card.storage.yzsNature || !evt.card.storage.yzsNature.length) return false;
			return true;
		},
		async content(event, trigger, player) {
			trigger.nature = trigger.card.storage.yzsNature[0];
		}
	},
	//护甲保护
	_yzsProtect: {
		ruleSkill: true,
		popup: false,
		locked: true,
		forced: true,
		charlotte: true,
		trigger: {
			global: "roundStart",
		},
		filter: function (event, player) {
			return game.roundNumber <= lib.config.extension_一中杀_yzsProtect;
		},
		async content(event, trigger, player) {
			await player.changeHujia(1);
			player.addMark("_RoundHujia", 1, false)
		}
	},
	//分发不死保护
	_yzsUndying: {
		ruleSkill: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		charlotte: true,
		filter(event, player) {
			if (!lib.config.extension_一中杀_yzsUndying) return false;
			return (event.name != "phase" || game.phaseNumber == 0) && game.hasPlayer(current => current != player);
		},
		async content(event, trigger, player) {
			player.addSkill("Undying_yzs");
			player.addTip("Undying_yzs", "不死保护生效中", false);
		},
	},
	//不死保护
	Undying_yzs: {
		ruleSkill: true,
		group: "Undying_yzs_lose",
		subSkill: {
			lose: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseBefore"
				},
				async content(event, trigger, player) {
					await player.removeSkill("Undying_yzs")
					player.removeTip("Undying_yzs");
				}
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		forced: true,
		charlotte: true,
		trigger: {
			player: ["changeHp"]
		},
		filter(event, player) {
			if (event.getParent(2).name == "sheshen_yzs") return false;
			if (event.getParent(2).name == "jiandun_yzs") return false;
			if (event.num >= 0) return false;
			//	if (!player.storage.minHp_yzs) player.storage.minHp_yzs = 0;
			return player.hp <= 1;
		},
		async content(event, trigger, player) {
			player.hp = 1;
			player.update();
		}
	},
	//普奇神父·天堂制造
	"speedup_yzs": {
		group: ["speedup_yzs_Begin"],
		unique: true,
		LastDo: true,
		direct: true,
		init: function (player) {
			if (!player.storage.speedup_yzs_x) {
				player.storage.speedup_yzs_x = 0;
				player.markSkill("speedup_yzs_x");
			}
			if (!player.storage.phasenum) {
				player.storage.phasenum = 0;
				player.markSkill("phasenum");

			}
		},
		subSkill: {
			Begin: {
				popup: false,
				direct: true,
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, player) {
					return !event.skill
				},
				content: function () {
					++player.storage.speedup_yzs_x;
					player.storage.phasenum = player.storage.speedup_yzs_x;
					player.markSkill("speedup_yzs_x");
					player.markSkill("phasenum");
				},
				sub: true,
				sourceSkill: "speedup_yzs",
				"_priority": 0,
			},
		},
		trigger: {
			player: "phaseAfter",
		},
		content: () => {
			while (player.storage.phasenum > 0) {
				player.insertPhase().skill = "speedup_yzs";
				player.storage.phasenum--;
				player.markSkill("phasenum");
			}
		},
		"_priority": 0,
	},
	"create_newworld_yzs": {
		nobracket: true,
		mod: {
			attackRange(player, num) {
				return num + game.roundNumber;
			},
			maxHandcard(player, num) {
				return num + game.roundNumber;
			},
		},
		"_priority": 0,
	},
	//尤贝尔
	"wangzhan_yzs": {
		marktext: "斩",
		intro: {
			content: "mark",
			name: "妄斩",
		},
		group: ["wangzhan_yzs_DamageRecord"],
		audio: "ext:一中杀/audio/skill:1",
		enable: "phaseUse",
		usable: 1,
		subSkill: {
			DamageRecord: {
				charlotte: true,
				direct: true,
				trigger: {
					source: "damageSource",
					player: "damageSource",
				},
				filter(event, player) {
					return event.getParent().name !== "wangzhan_yzs" && event.num > player.countMark("wangzhan_yzs");
				},
				async content(event, trigger, player) {
					player.setMark("wangzhan_yzs", trigger.num, false);
				},
				sub: true,
				sourceSkill: "wangzhan_yzs",
				"_priority": 0,
			},
		},
		async content(event, trigger, player) {
			let num = 5 - player.countMark("wangzhan_yzs") - player.countCards("h");
			if (num > 0) {
				await player.draw(num);
			}
			else if (num < 0) {
				await player.chooseToDiscard("h", true, -num);
			}
			let result = await player.chooseTarget("妄斩", "请选择一名距离为1的角色", false)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return get.distance(player, target) <= 1 && target != player
				})
				.forResult()
			if (result.bool && player.countMark("wangzhan_yzs")) {
				if (player.countMark("wangzhan_yzs") > 1) {
					game.broadcastAll((player) => {
						player.$skill("妄斩", "legend", "thunder");
						game.delay(2);
						var imagePath = lib.assetURL + "/extension/一中杀/image/wangzhan_yzs.png";
						var duration = 1500;

						var img = document.createElement("img");
						img.src = imagePath;

						// 设置图片样式 - 竖向图片居中显示
						img.style.position = "fixed";
						img.style.left = "50%";
						img.style.top = "0";
						img.style.transform = "translateX(-50%)";
						img.style.width = "auto";
						img.style.height = "100%";
						img.style.maxWidth = "none";
						img.style.zIndex = "0";
						img.style.opacity = "0"; // 初始透明度设为0
						img.style.pointerEvents = "none";

						// 设置过渡效果 - 同时作用于opacity属性
						img.style.transition = "opacity 1s ease-out";

						// 添加到DOM
						document.body.appendChild(img);

						// 使用requestAnimationFrame确保过渡生效
						requestAnimationFrame(function () {
							// 触发透明度渐入效果
							img.style.opacity = "0.9";
						});

						// 延迟后开始渐出
						setTimeout(function () {
							img.style.opacity = "0";
							setTimeout(function () {
								if (img.parentNode) {
									img.parentNode.removeChild(img);
								}
							}, 1000); // 等待1秒过渡完成后再移除
						}, duration);

					}, player);
				}
				game.broadcastAll(() => {
					game.playAudio("ext:一中杀/audio/skill/wangzhan_yzs.mp3");
				});
				result.targets[0].damage(Math.max(player.countMark("wangzhan_yzs") - 1, 0))
			}
		},
		ai: {
			order(item, player) {
				let num = 5 - player.countMark("wangzhan_yzs");
				if (player.countCards("h") - num >= 3 || player.countMark("wangzhan_yzs") > 2) return 10;
				return 1
			},
			result: {
				player(player) {
					let discard = player.storage.suixin_yzs_Discard || 0;
					let num = 5 - player.countMark("wangzhan_yzs");
					if (player.countCards("h") >= num && player.countCards("h") <= discard + num) return 0.1;
					if (player.countCards("h") < num) return num - player.countCards("h") + 1;
				},
			},
			threaten: 1,
			nokeep: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "nokeep") {
					return player.isPhaseUsing() && !player.getStat().skill.wangzhan_yzs;
				}
			},
		},
	},
	"suixin_yzs": {
		group: ["suixin_yzs_Draw", "suixin_yzs_DrawRecord", "suixin_yzs_Discard", "suixin_yzs_DiscardRecord", "suixin_yzs_DiscardRecord2", "suixin_yzs_Targetnum", "suixin_yzs_TargetnumRecord"],
		locked: true,
		init: function (player) {
			if (!player.storage.suixin_yzs_Draw) {
				player.storage.suixin_yzs_Draw = 0;
				player.markSkill("suixin_yzs_Draw");
			}
			if (!player.storage.suixin_yzs_Discard) {
				player.storage.suixin_yzs_Discard = 0;
				player.markSkill("suixin_yzs_Discard");
			}
			if (!player.storage.suixin_yzs_Targetnum) {
				player.storage.suixin_yzs_Targetnum = 0;
				player.markSkill("suixin_yzs_Targetnum");
			}
		},
		subSkill: {
			Draw: {
				prompt: function (event) {
					const player = event.player
					return "你即将摸" + event.num + "张牌。是否将摸牌数修改为" + player.storage.suixin_yzs_Draw + "?"
				},
				trigger: {
					player: "drawBegin",
				},
				usable: 1,
				filter(event, player) {
					return (event.num < player.storage.suixin_yzs_Draw)
				},
				priority: 5,
				content() {
					trigger.num = player.storage.suixin_yzs_Draw;
				},
				sub: true,
				sourceSkill: "suixin_yzs",
				"_priority": 500,
			},
			DrawRecord: {
				popup: false,
				forced: true,
				trigger: {
					player: "drawBegin",
				},
				filter(event, player) {
					return (event.num > player.storage.suixin_yzs_Draw)
				},
				content() {
					player.storage.suixin_yzs_Draw = trigger.num;
					player.markSkill("suixin_yzs_Draw");
				},
				sub: true,
				sourceSkill: "suixin_yzs",
				"_priority": 0,
			},
			Discard: {
				prompt: function (event) {
					const player = event.player
					return "是否将弃牌数修改为" + player.storage.suixin_yzs_Discard + "?"
				},
				trigger: {
					player: "discardPlayerCardBegin",
				},
				usable: 1,
				filter(event, player) {
					var range = get.select(event.selectButton);
					if (range[0] == range[1]) {
						return range[0] < player.storage.suixin_yzs_Discard;
					} else if (range[1] == Infinity) {
						return false;
					} else {
						return range[1] < player.storage.suixin_yzs_Discard;
					}
				},
				async content(event, trigger, player) {
					trigger.selectButton = player.storage.suixin_yzs_Discard;
				},
				sub: true,
				sourceSkill: "suixin_yzs",
				"_priority": 0,
			},
			DiscardRecord: {
				forced: true,
				trigger: {
					player: ["discardPlayerCardAfter"]
				},
				sourceSkill: "suixin_yzs",
				filter(event, player, name) {
					return event.cards.length > player.storage.suixin_yzs_Discard;
				},
				async content(event, trigger, player) {
					player.storage.suixin_yzs_Discard = trigger.cards.length;
					player.markSkill("suixin_yzs_Discard");
				},
				sub: true,
				"_priority": 0,
			},
			DiscardRecord2: {
				forced: true,
				trigger: {
					player: ["chooseToDiscardAfter"]
				},
				sourceSkill: "suixin_yzs",
				filter(event, player, name) {
					return event.result.bool && event.result.cards.length > player.storage.suixin_yzs_Discard;
				},
				async content(event, trigger, player) {
					player.storage.suixin_yzs_Discard = trigger.result.cards.length;
					player.markSkill("suixin_yzs_Discard");
				},
				sub: true,
				"_priority": 0,
			},
			Targetnum: {
				prompt: function (event) {
					const player = event.player
					return "是否将最大目标数修改为" + player.storage.suixin_yzs_Targetnum + "?"
				},
				trigger: {
					player: "useCard2",
				},
				usable: 1,
				sourceSkill: "suixin_yzs",
				filter(event, player) {
					var info = get.info(event.card);
					if (event.targets.length >= player.storage.suixin_yzs_Targetnum) return false;
					if (info.allowMultiple == false) return false;
					if (event.targets && !info.multitarget) {
						if (
							game.hasPlayer(function (current) {
								return !event.targets.includes(current) && lib.filter.targetEnabled2(event.card, player, current) && lib.filter.targetInRange(event.card, player, current);
							})
						) {
							return true;
						}
					}
					return false;
				},
				content() {
					"step 0";
					var num = player.storage.suixin_yzs_Targetnum - trigger.targets.length
					var prompt2 = "为" + get.translation(trigger.card) + "增加至多" + get.cnNumber(num) + "个目标";
					player
						.chooseTarget(
							get.prompt("suixin_yzs"),
							function (card, player, target) {
								if (_status.event.targets.includes(target)) return false;
								var player = _status.event.player;
								return lib.filter.targetEnabled2(_status.event.card, player, target) && lib.filter.targetInRange(_status.event.card, player, target);
							},
							[1, num]
						)
						.set("prompt2", prompt2)
						.set("ai", function (target) {
							var trigger = _status.event.getTrigger();
							var player = _status.event.player;
							return get.effect(target, trigger.card, player, player);
						})
						.set("card", trigger.card)
						.set("targets", trigger.targets);
					"step 1";
					if (result.bool) {
						if (!_status.event.isMine() && !_status.event.isOnline()) game.delayx();
						_status.event.targets = result.targets;
					} else {
						_status.event.finish();
					}
					"step 2";
					if (_status.event.targets) {
						player.logSkill("suixin_yzs", _status.event.targets);
						trigger.targets.addArray(_status.event.targets);
					}
				},
				"_priority": 0,
				sub: true,
			},
			TargetnumRecord: {
				popup: false,
				forced: true,
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					return event.targets.length > player.storage.suixin_yzs_Targetnum;
				},
				content() {
					player.storage.suixin_yzs_Targetnum = trigger.targets.length;
					player.markSkill("suixin_yzs_Targetnum");
				},
				sub: true,
				sourceSkill: "suixin_yzs",
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	//奖励队长
	"jiangli_yzs": {
		locked: true,
		mod: {
			targetInRange(card, player, target) {
				if (card.cards && card.cards.some(c=>c.hasGaintag("jiangli_yzs"))) return true;
			},
		},
		init: function (player) {
			if (Array.isArray(player.storage.jiangli_HasSkippedphase)) return;
			player.storage.jiangli_HasSkippedphase = [false, false, false, false, false, false];
			player.markSkill("jiangli_HasSkippedphase");
		},
		trigger: {
			player: "phaseBegin",
		},
		async cost(event, trigger, player) {
			const choiceList = ["1.跳过准备阶段", "2.跳过判定阶段", "3.跳过摸牌阶段", "4.跳过出牌阶段", "5.跳过弃牌阶段", "6.跳过结束阶段"];
			for (let i = 0; i < choiceList.length; i++) {
				if (player.storage.jiangli_HasSkippedphase[i]) {
					choiceList[i] = `<span style="text-decoration: line-through;">${choiceList[i]}</span>`;
				}
			}
			const result = (event.result = await player
				.chooseButton([get.prompt("jiangli_yzs"), [choiceList.slice(0, 2), "tdnodes"], [choiceList.slice(2, 4), "tdnodes"], [choiceList.slice(4, 6), "tdnodes"]])
				.set("filterButton", button => {
					const player = get.player();
					return player.storage.jiangli_HasSkippedphase[parseInt(button.link.slice(0, 1)) - 1] == false;
				})
				.set("ai", button => {
					return get.player().getUseValue(button.link, true, false);
				})
				.set("selectButton", [1, 6])
				.forResult());

			if (result?.links?.length) event.result.cost_data = event.result.links;
			else player.recover();
			player.storage.jiangli_HasSkippedphase = [false, false, false, false, false, false]
			player.markSkill("jiangli_HasSkippedphase");
		},
		async content(event, trigger, player) {
			const choice = event.cost_data;
			let drawnum = choice.length;
			game.broadcastAll(function (current, num) {
				function shakeElement(element, times = 6, distance = 20, duration = 200) {
					// 初始位置
					element.style.transition = `transform ${duration}ms ease`;
					element.style.transform = "translate(0, 0)";

					let count = 0;
					function step() {
						if (count >= times) {
							// 抖动结束，回到原点
							element.style.transform = "translate(0, 0)";
							return;
						}

						// 交替上下移动
						const direction = count % 2 === 0 ? -1 : 0;
						element.style.transform = `translate(0, ${direction * distance}px)`;

						count++;
						setTimeout(step, duration);
					}

					step();
				}
				shakeElement(current, 2 * num);
			}, player, drawnum)
			await game.delay(drawnum);
			for (let i = 0; i < drawnum; i++) {
				player.storage.jiangli_HasSkippedphase[parseInt(choice[i].slice(0, 1)) - 1] = true;
				player.markSkill("jiangli_HasSkippedphase");
				if (parseInt(choice[i].slice(0, 1)) == 1) player.skip("phaseZhunbei");
				if (parseInt(choice[i].slice(0, 1)) == 2) player.skip("phaseJudge");
				if (parseInt(choice[i].slice(0, 1)) == 3) player.skip("phaseDraw");
				if (parseInt(choice[i].slice(0, 1)) == 4) player.skip("phaseUse");
				if (parseInt(choice[i].slice(0, 1)) == 5) player.skip("phaseDiscard");
				if (parseInt(choice[i].slice(0, 1)) == 6) player.skip("phaseJieshu");
			}
			var cards = game.cardsGotoOrdering(get.cards(drawnum)).cards;
			player.addGaintag(cards, "jiangli_yzs");
			player.$gain2(cards, false);
			await player.showCards(cards, `${get.translation(player)}发动了【奖励】`, true);
			while (cards.some(i => player.hasUseTarget(i))) {
				let result = await player
					.chooseButton(["奖励：是否使用其中的一张牌？", cards])
					.set("filterButton", button => {
						return _status.event.player.hasUseTarget(button.link);
					})
					.forResult();
				if (!result.bool) break;
				let card = result.links[0];
				cards.remove(card);
				await player.chooseUseTarget(true, card, false, "nodistance");
			}
			player.$throw(cards, false);
			for (let i = 0; i < cards.length; i++) { cards[i].discard(); }
			if (drawnum <= 3) await player.recover();
			if (drawnum >= 3) {
				await player.useSkill("jiangli_Discard_yzs")
			}
		},
		"_priority": 0,
	},
	"jiangli_Discard_yzs": {
		popup: false,
		direct: true,
		enable: "phaseUse",
		usable: 1,
		async content(event, trigger, player) {
			const result = await player.chooseTarget("是否弃置场上的一张牌？", false)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.countDiscardableCards(player, "hej")
				})
				.forResult();
			if (result.bool) {
				player.discardPlayerCard(result.targets[0], "hej", true);
			}
		},
		"_priority": 0,
	},
	//黄JOJO
	"nengliyoudaxiao_yzs": {
		nobracket: true,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			if (!game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canCompare(target) && target != player
			})) return false;
			return player.countCards("h") > 0;
		},
		filterTarget: function (card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return player.canCompare(target) && target != player
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			const result = await player.chooseToCompare(event.targets[0]).forResult();
			if (result.tie) { return }
			var players = [player, event.targets[0]];
			if (result.bool) players.reverse();
			await players[1].draw();
			players[0].addTempSkill("nengliyoudaxiao_yzs_effect", "phaseUseAfter");
			if (player == players[1]) player.chat("你的能力还是太小了");
		},
		ai: {
			order(name, player) {
				return 9;
			},
			result: {
				player(player) {
					let value = 0;
					if (player.hasCard(function (card) {
						if (get.position(card) != "h") {
							return false;
						}
						var val = get.value(card);
						if (val < 0) {
							return true;
						}
						if (val <= 5) {
							return card.number >= 11;
						}
						if (val <= 6) {
							return card.number >= 13;
						}
						return false;
					})) {
						value++;
					}
					if (player.hasCard(function (card) {
						if (get.position(card) != "h") {
							return false;
						}
						return get.color(card, player) == "red" && get.name(card, player) != "sha"
					})) {
						value += 0.5;
					}
					return value;
				},
				target(player, target) {
					if (!player.hasCard(function (card) {
						if (get.position(card) != "h") {
							return false;
						}
						var val = get.value(card);
						if (val < 0) {
							return true;
						}
						if (val <= 5) {
							return card.number >= 11;
						}
						if (val <= 6) {
							return card.number >= 13;
						}
						return false;
					})) {
						return 1;
					}
					return -1.2;
				},
			},
			threaten: 1.6,
		},
	},
	"nengliyoudaxiao_yzs_effect": {
		nopop: true,
		intro: {
			content: "本阶段红色手牌视为普通【杀】",
		},
		mod: {
			cardname(card, player, name) {
				if (get.color(card) == "red") return "sha";
			},
			cardnature(card, player) {
				if (get.color(card) == "red") return false;
			},
		},
		sub: true,
		sourceSkill: "nengliyoudaxiao_yzs",
		"_priority": 0,
	},
	"huangjinzhixing_yzs": {
		nobracket: true,
		locked: true,
		audio: "ext:一中杀/audio/skill:2",
		group: ["huangjinzhixing_yzs_effect"],
		subSkill: {
			effect: {
				mod: {
					cardname(card, player, name) {
						if (get.color(card) == "black" && card.name == "sha") return "shan";
					},
					cardnature(card, player) {
						if (get.color(card) == "black") return false;
					},
				},
				sub: true,
				sourceSkill: "huangjinzhixing_yzs",
				"_priority": 0,
			},
		},
		trigger: {
			player: "phaseUseEnd",
		},
		filter(event, player) {
			if (!player.countCards("h")) {
				game.broadcastAll(() => {
					if (!_status.huangjinzhixing_yzs) return;
					_status.huangjinzhixing_yzs = false;
					document.documentElement.style.filter = "none";
					//↑消除之前技能里的黑白等效果
					game.playAudio("ext:一中杀/audio/skill/TheWorldExit.mp3");
					//↑播放时停结束的语音
					game.delay(3);
					var music = lib.config.background_music;
					if (music && music != "music_off") ui.backgroundMusic.play();
					//↑播放背景音乐
				});
			}
			return player.countCards("h")
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseToDiscard("弃置1张手牌，若点数大于" + player.countMark("huangjinzhixing_yzs") + "，则你摸2张牌并执行出牌阶段")
				.set("position", "h")
				.set("ai", function (card) {
					const player = get.event().player;
					if (get.number(card, player) > player.countMark("huangjinzhixing_yzs")) {
						return Math.max(30 - 2 * (get.number(card, player) - player.countMark("huangjinzhixing_yzs")) - get.useful(card, player), 1)
					} else {
						if (!player.hasCard(c => get.number(c, player) > player.countMark("huangjinzhixing_yzs"))) return Math.max(30 - get.number(card, player) - get.useful(card, player), 1);
						return -1;
					}
				})
				.set("chooseonly", true)
				.forResult();
			if (!event.result.bool) {
				game.broadcastAll(() => {
					if (!_status.huangjinzhixing_yzs) return;
					_status.huangjinzhixing_yzs = false;
					document.documentElement.style.filter = "none";
					//↑消除之前技能里的黑白等效果
					game.playAudio("ext:一中杀/audio/skill/TheWorldExit.mp3");
					//↑播放时停结束的语音
					game.delay(3);
					var music = lib.config.background_music;
					if (music && music != "music_off") ui.backgroundMusic.play();
					//↑播放背景音乐
				});
			}
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			const result = { cards: event.cards };
			if (result.cards[0].number > player.countMark("huangjinzhixing_yzs")) {
				if (player.getHistory("useSkill", evt => evt.skill == "huangjinzhixing_yzs").length == 1) {
					game.broadcastAll((player) => {
						_status.huangjinzhixing_yzs = true;
						game.playAudio("ext:一中杀/audio/skill/huangjinzhixing_yzs.mp3");
						game.playAudio("ext:一中杀/audio/skill/TheWorldEnter.mp3");
						ui.backgroundMusic.pause();
						player.$skill("THE WORLD", "legend", "thunder");
						var imagePath = lib.assetURL + "/extension/一中杀/image/background/timeStop.gif";
						var duration = 4000;

						var img = document.createElement("img");
						img.src = imagePath;

						// 改进的样式设置
						img.style.position = "fixed";
						img.style.left = "0";
						img.style.top = "0";
						img.style.width = "100%"; // 改为100%
						img.style.height = "100%"; // 改为100%
						img.style.objectFit = "cover";

						// 确保覆盖整个视口
						img.style.minWidth = "100vw";
						img.style.minHeight = "100vh";

						// 防止图片被缩放影响
						img.style.transform = "none";

						img.style.zIndex = "9999";
						img.style.opacity = 0.5;
						img.style.pointerEvents = "none"; // 防止点击事件被阻挡

						document.body.appendChild(img);

						// 确保图片在视口最前方
						img.style.transition = "opacity 1s ease-out";

						setTimeout(function () {
							img.style.opacity = 0;
							setTimeout(function () {
								if (img.parentNode) {
									img.parentNode.removeChild(img);
								}
							}, 1000);
						}, duration);

						// 其他效果保持不变...
						document.documentElement.style.transform = "scale(1.2)";
						document.body.style.filter = "invert(100%)";

						setTimeout(function () {
							document.body.style.filter = "none";
							document.documentElement.style.transform = "scale(1)";
							document.documentElement.style.position = "fixed";
							document.documentElement.style.top = "0";
							document.documentElement.style.left = "0";
						}, 2000);

						document.documentElement.style.filter = "invert(100%)";
						setTimeout(function () {
							document.documentElement.style.filter = "none";
							document.documentElement.style.filter = "grayscale(70%)";
						}, 3000);
					}, player);
					await new Promise(r => setTimeout(r, 4000))
					player
						.when("dieBefore")
						.filter(() => document.documentElement.style.filter == "grayscale(70%)")
						.then((trigger) => {
							game.broadcastAll(() => {
								if (!_status.huangjinzhixing_yzs) return;
								_status.huangjinzhixing_yzs = false;
								document.documentElement.style.filter = "none";
								//↑消除之前技能里的黑白等效果
								game.playAudio("ext:一中杀/audio/skill/TheWorldExit.mp3");
								//↑播放时停结束的语音
								game.delay(3);
								var music = lib.config.background_music;
								if (music && music != "music_off") ui.backgroundMusic.play();
								//↑播放背景音乐
							});
						});
				}
				if (result.cards[0].number < 3) {
					if (_status.tempMusic != `ext:一中杀/audio/Jotaro's Theme.mp3`) {
						game.broadcastAll(() => {
							_status.tempMusic = `ext:一中杀/audio/Jotaro's Theme.mp3`;
							game.playBackgroundMusic();
							ui.backgroundMusic.addEventListener('ended', () => {
								delete _status.tempMusic;
								game.playBackgroundMusic();
							}, { once: true });
						});
					}
				}
				await player.draw(2);
				if (trigger.getParent("phase", true)) trigger.getParent("phase", true).phaseList.splice(trigger.getParent("phase", true).num, 0, "phaseUse|huangjinzhixing_yzs");
			} else {
				game.broadcastAll(() => {
					if (!_status.huangjinzhixing_yzs) return;
					_status.huangjinzhixing_yzs = false;
					document.documentElement.style.filter = "none";
					//↑消除之前技能里的黑白等效果
					game.playAudio("ext:一中杀/audio/skill/TheWorldExit.mp3");
					//↑播放时停结束的语音
					game.delay(3);
					var music = lib.config.background_music;
					if (music && music != "music_off") ui.backgroundMusic.play();
					//↑播放背景音乐
				});
			}
			player.addTip("huangjinzhixing_yzs", "黄金之星 ＞" + get.number(result.cards[0]), false);
			player.setMark("huangjinzhixing_yzs", result.cards[0].number, false);
		},
		"_priority": 0,
	},
	//吉良吉涛
	"first_bomb_yzs": {
		nobracket: true,
		locked: true,
		group: ["first_bomb_yzs_damage", "first_bomb_yzs_changeJudge", "first_bomb_yzs_normal"],
		prompt: `扣置任意张手牌称为“弹”，上限为 3`,
		enable: "phaseUse",
		position: "h",
		filterCard: true,
		discard: false,
		lose: false,
		delay: 0,
		check(card) {
			if (player.hasSkill("normal_life_yzs")) return 10 - get.value(card);
			return 6- get.value(card);
		},
		selectCard() {
			const player = get.event().player
			return [1, 3 - (player.countExpansions("first_bomb_yzs"))]
		},
		filter(event, player) { return player.countCards("h") > 0 && player.countExpansions("first_bomb_yzs") < 3 },
		async content(event, trigger, player) {
			let next = player.addToExpansion(event.cards, player, "giveAuto")
			next.gaintag.add("first_bomb_yzs");
			await next;
		},
		mark: true,
		marktext: "弹",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("first_bomb_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张“弹”";
			},
		},
		subSkill: {
			damage: {
				audio: "ext:一中杀/audio/skill:1",
				logTarget: "player",
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					if (event.player.hasSkill("hidden_yzs")) return false;
					if (!lib.suit.includes(get.suit(event.card))) return false;
					return event.player.getHistory("useCard").length == 1;
				},
				check(event, player) {
					return get.attitude(player, event.player) <= 0;
				},
				async content(event, trigger, player) {
					let result = await player.judge().forResult();
					if (result.suit == get.suit(trigger.card)) {
						game.broadcastAll(function () {
							if (lib.config.background_audio) {
								game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.mp3");
							}
						});
						trigger.player.playEffectOL(lib.skill.boom_yzs.Effect);
						trigger.player.damage(player)
					} else {
						player.chat("孩子们吉良吉涛需要加强");
					}
				},
				ai: {
					expose: 0.3,
					threaten: 1.4,
				},
				sub: true,
				sourceSkill: "first_bomb_yzs",
				"_priority": 0,
			},
			changeJudge: {
				logTarget: "player",
				trigger: {
					player: "judge",
				},
				filter(event, player) {
					if (event.player.hasSkill("hidden_yzs")) return false;
					return player.countExpansions("first_bomb_yzs") > 0
				},
				async cost(event, trigger, player) {
					let cards = player.getExpansions("first_bomb_yzs")
					let result = await player.chooseButton(["第一炸弹", "用 1 张【弹】代替判定牌", cards], false)
						.set("filterCardx", (card, player) => {
							return get.suit(card)
						})
						.set("ai", (button) => {
							const trigger2 = get.event().getTrigger();
							const { player: player2, judging } = get.event();
							const result = trigger2.judge(button) - trigger2.judge(judging);
							const attitude = get.attitude(player2, trigger2.player);
							let val = get.value(button);
							if (get.subtype(button) == "equip2") {
								val /= 2;
							} else {
								val /= 4;
							}
							if (attitude == 0 || result == 0) {
								return 0;
							}
							if (attitude > 0) {
								return result - val;
							}
							return -result - val;
						}).set("judging", trigger.player.judging[0]).setHiddenSkill(event.skill)
						.forResult()
					if (result.bool == false) return
					event.result = {
						bool: result.bool,
						cost_data: result.links[0],
					};
				},
				async content(event, trigger, player) {
					const chooseCardResultCards = event.cost_data;
					await player.discard(chooseCardResultCards)
					if (trigger.player.judging[0].clone) {
						trigger.player.judging[0].clone.classList.remove("thrownhighlight");
						game.broadcast(function (card) {
							if (card.clone) {
								card.clone.classList.remove("thrownhighlight");
							}
						}, trigger.player.judging[0]);
						game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
					}
					game.cardsDiscard(trigger.player.judging[0]);
					trigger.player.judging[0] = chooseCardResultCards;
					trigger.orderingCards.add(chooseCardResultCards);
					game.log(trigger.player, "的判定牌改为", chooseCardResultCards);
					await game.delay(2);
				},
				sub: true,
				sourceSkill: "first_bomb_yzs",
				"_priority": 0,
			},
			normal: {
				forced: true,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) { return player.hasMark("BitetheDust_awaken_yzs") },
				async content(event, trigger, player) {
					player.clearMark("BitetheDust_awaken_yzs")
					game.broadcastAll(() => {
						_status.tempMusic = `ext:一中杀/audio/killer.mp3`;
						game.playBackgroundMusic();
					});
					player.addSkill("normal_life_yzs");
				},
				sub: true,
				sourceSkill: "first_bomb_yzs",
				"_priority": 0,
			},
		},
		"_priority": 0,
		ai: {
			rejudge: true,
		}
	},
	"BitetheDust_yzs": {
		nobracket: true,
		derivation: "normal_life_yzs",
		locked: true,
		logTarget: "player",
		group: ["BitetheDust_yzs_effect", "BitetheDust_yzs_youdie"],
		init: function (player) {
			if (!player.storage.BitetheDust) {
				player.storage.BitetheDust = 1;
				player.markSkill("BitetheDust");
			}
			if (!player.storage.BitetheDust_num) {
				player.storage.BitetheDust_num = 0;
				player.markSkill("BitetheDust_num");
			}
			if (player.hasMark("BitetheDust_yzs")) player.clearMark("BitetheDust_yzs")
		},
		trigger: {
			global: "dyingBegin",
		},
		filter(event, player) {
			if (event.player.hasSkill("hidden_yzs")) return false;
			return !player.hasMark("BitetheDust_yzs")
		},
		check(event, player) {
			if (event.player == player) return true;
			if (get.recoverEffect(event.player, player, player) <= 0) {
				return false;
			}
			if (player.storage.BitetheDust || 1 == 1) {
				return get.attitude(player, event.player) > 2;
			} else {
				let taos = 0;
				for (let p of game.filterPlayer()) {
					if (get.attitude(p, event.player) > 0) {
						taos += p.countCards("h", { name: "tao" });
					}
				}
				if (taos > 3) return get.attitude(player, event.player) < 0;
				return get.attitude(player, event.player) > 0 && get.attitude(player, event.player) < 4;
			}
		},
		async content(event, trigger, player) {
			game.broadcastAll((player) => {
				game.playAudio("ext:一中杀/audio/skill/BitetheDust_yzs.mp3");
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/BitetheDust_yzs.gif";
				//弄一个变量在后面用于决定多长时间后消除屏幕特效
				var duration = 4110;
				var img = document.createElement("img");
				img.src = imagePath;
				img.style.position = "fixed";
				img.style.left = "0";
				img.style.top = "0";
				img.style.width = "100%"; // 改为100%
				img.style.height = "100%"; // 改为100%
				img.style.objectFit = "cover";
				//以上是建立一个元素，令元素为图片，位置为绝对，src(路径)为上面定义的路径,left,top指图片的位置
				//这个数指图片的叠加图层，越大越不会被其他东西挡住

				// 确保覆盖整个视口
				img.style.minWidth = "100vw";
				img.style.minHeight = "100vh";

				// 防止图片被缩放影响
				img.style.transform = "none";
				img.style.zIndex = "9999";
				//初始化透明度为0
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡
				//在document.body也就是主界面，添加一个子元素(appendChild)，(img)是子元素的名字，也就是上面定义的那个局部变量img
				document.body.appendChild(img);
				img.style.transition = "opacity 1s ease-out";
				setTimeout(function () {
					img.parentNode.removeChild(img);
					game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.mp3");
				}, duration);
			}, player);
			await new Promise(r => setTimeout(r, 4110))
			if (player.storage.BitetheDust == 1) game.broadcastAll((time) => {
				_status.tempMusic = `ext:一中杀/audio/Great Days.mp3`;

				// 2. 调用播放逻辑
				game.playBackgroundMusic();

				// 3. 核心修改：等待音频加载并跳转时间
				if (ui.backgroundMusic) {
					// 如果音频已经加载完成（通常是本地资源），直接跳转
					if (ui.backgroundMusic.readyState >= 2) {
						ui.backgroundMusic.currentTime = time;
					} else {
						// 否则监听加载完成事件
						ui.backgroundMusic.addEventListener('canplay', function () {
							this.currentTime = time;
						}, { once: true });
					}
				}
			},164);
			if (trigger.player == player) {
				player.recover(2 / player.storage.BitetheDust);
				player.draw(4 / player.storage.BitetheDust);
				if (player.storage.BitetheDust == 1) player.storage.BitetheDust = 2;
				if (!player.storage.BitetheDust_num) {
					player.storage.BitetheDust_num = 1;
				} else {
					player.useSkill("BitetheDust_awaken_yzs")
				}
				player.markSkill("BitetheDust");
				player.markSkill("BitetheDust_num");
			}
			else {
				if (player.hp < 2 / player.storage.BitetheDust) await player.recover(2 / player.storage.BitetheDust - player.hp);
				else if (player.hp > 2 / player.storage.BitetheDust) await player.loseHp(player.hp - 2 / player.storage.BitetheDust);
				if (trigger.player.hp < 2 / player.storage.BitetheDust) await trigger.player.recover(2 / player.storage.BitetheDust - trigger.player.hp);
				else if (trigger.player.hp > 2 / player.storage.BitetheDust) await trigger.player.loseHp(trigger.player.hp - 2 / player.storage.BitetheDust);
				await player.draw(4 / player.storage.BitetheDust);
				player.addMark("BitetheDust_yzs", 1, false);
				player.updateMark("BitetheDust_yzs");

				trigger.player.addTip("mingyun_yzs", "命运", false);
				game.broadcastAll(function (target) {
					if (target.node.avatar) {
						let overlay = document.createElement('div');
						overlay.style.position = 'absolute';
						overlay.style.top = '0px'; // 可根据实际调整
						overlay.style.left = '0px';
						overlay.style.width = '100%';
						overlay.style.height = '100%'; // 覆盖头部区域
						overlay.style.backgroundSize = "cover";
						overlay.style.backgroundImage = "url('extension/一中杀/image/background/BitetheDust_yzs.png')"; // 替换为你自己的图片路径
						overlay.style.backgroundSize = 'contain';
						overlay.style.backgroundRepeat = 'no-repeat';
						overlay.style.backgroundPosition = 'center top';
						overlay.style.zIndex = '9';
						overlay.style.pointerEvents = 'none'; // 避免阻挡点击事件

						// 清除旧图层防止重复添加
						if (target.node.avatar.overlayElement_BitetheDust_yzs) {
							target.node.avatar.overlayElement_BitetheDust_yzs.remove();
						}

						target.node.avatar.appendChild(overlay);  //将新创建的遮罩图层
						target.node.avatar.overlayElement_BitetheDust_yzs = overlay;//将这个遮罩图层保存为 avatar 元素的一个自定义属性,便于后续操作（如修改或清除该图层），避免重复查找或创建；
					}
				}, trigger.player)
				await trigger.player.draw(4 / player.storage.BitetheDust);
				trigger.player.addMark("BitetheDust_yzs", 1, false);
				trigger.player.updateMark("BitetheDust_yzs");
			}
		},
		subSkill: {
			effect: {
				forced: true,
				trigger: {
					global: "roundStart",
				},
				filter(event, player) { return player.hasMark("BitetheDust_yzs") },
				async content(event, triggger, player) {
					if (player.storage.BitetheDust == 1) player.storage.BitetheDust = 2;
					else {
						let target = game.filterPlayer(function (current) {
							return current != player && current.hasMark("BitetheDust_yzs");
						});
						if (!target[0]) {
							player.clearMark("BitetheDust_yzs", false)
							if (!player.storage.BitetheDust_num) {
								player.storage.BitetheDust_num = 1;
							} else {
								player.useSkill("BitetheDust_awaken_yzs")
							}
							return
						}
						target = target[0];
						target.clearMark("BitetheDust_yzs", false)
						target.removeTip("mingyun_yzs");
						game.broadcastAll(function (target) {
							if (target.node.avatar && target.node.avatar.overlayElement_BitetheDust_yzs) {
								target.node.avatar.overlayElement_BitetheDust_yzs.remove();
								delete target.node.avatar.overlayElement_BitetheDust_yzs;
							}
						}, target);
						game.broadcastAll(function () {
							if (lib.config.background_audio) {
								game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.mp3");
							}
						});
						await target.die();
						player.clearMark("BitetheDust_yzs", false)
						if (!player.storage.BitetheDust_num) {
							player.storage.BitetheDust_num = 1;
							player.markSkill("BitetheDust_num")
						} else {
							player.useSkill("BitetheDust_awaken_yzs")
						}
					}
					player.markSkill("BitetheDust");
					player.markSkill("BitetheDust_num");
				},
				sub: true,
				sourceSkill: "BitetheDust_yzs",
				"_priority": 0,
			},
			youdie: {
				forced: true,
				priority: 2,
				trigger: {
					player: "dieBefore",
				},
				forceDie: true,
				filter(event, player) {
					return player.hasMark("BitetheDust_yzs")
				},
				async content(event, trigger, player) {
					trigger.cancel(event.name);
					if (!player.storage.BitetheDust_num) {
						player.storage.BitetheDust_num = 1;
					} else {
						player.useSkill("BitetheDust_awaken_yzs")
					}
					if (player.maxHp > player.hp) await player.recover(player.maxHp - player.hp);
					let target = game.filterPlayer(function (current) {
						return current != player && current.hasMark("BitetheDust_yzs");
					});
					if (target.length) {
						target = target[0];
						target.clearMark("BitetheDust_yzs", false);
						target.removeTip("mingyun_yzs");
						game.broadcastAll(function (target) {
							if (target.node.avatar && target.node.avatar.overlayElement_BitetheDust_yzs) {
								target.node.avatar.overlayElement_BitetheDust_yzs.remove();
								delete target.node.avatar.overlayElement_BitetheDust_yzs;
							}
						}, target);
						target.draw(4 / player.storage.BitetheDust_yzs)
					}
					player.clearMark("BitetheDust_yzs", false)

				},
				sub: true,
				sourceSkill: "BitetheDust_yzs",
				"_priority": 0,
			},
		},
		ai: {
			expose: 0.7,
			threaten: 2.3,
		},
		"_priority": 0,
	},
	"BitetheDust_awaken_yzs": {
		nobracket: true,
		locked: true,
		unique: true,
		skillAnimation: true,
		animationColor: "gray",
		marktext: "平凡",
		intro: {
			name: "平凡",
			nocount: true,
		},
		async content(event, trigger, player) {
			player.removeSkill("BitetheDust_yzs");
			player.addMark("BitetheDust_awaken_yzs");
			player.updateMark("BitetheDust_awaken_yzs");
		},
		sub: true,
		sourceSkill: "BitetheDust_yzs",
		"_priority": 0,
	},
	"normal_life_yzs": {
		nobracket: true,
		locked: true,
		group: ["normal_life_yzs_changebomb", "normal_life_yzs_jiashang"],
		trigger: {
			player: "damageBegin3",
		},
		filter(event, player) { return (player.countExpansions("first_bomb_yzs") > 0) },
		async cost(event, trigger, player) {
			let cards = player.getExpansions("first_bomb_yzs")
			let result = await player.chooseButton(["第一炸弹", "移去 1 张“弹”以令伤害-1", cards], false)
				.set("ai", (button) => {
					return 6 - get.value(button);
				})
				.forResult()
			if (result.bool == false) return
			event.result = {
				bool: result.bool,
				cost_data: result.links[0],
			};
		},
		async content(event, trigger, player) {
			await player.loseToDiscardpile(event.cost_data)
			trigger.num--;
		},
		subSkill: {
			jiashang: {
				trigger: {
					source: "damageBegin1",
				},
				forced: true,
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					trigger.num++;
					if (trigger.getParent()?.name == "first_bomb_yzs_damage") return;
					game.broadcastAll(function () {
						if (lib.config.background_audio) {
							game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.mp3");
						}
					});
					trigger.player.playEffectOL(lib.skill.boom_yzs.Effect);
				},
				sub: true,
				sourceSkill: "normal_life_yzs",
				"_priority": 0,
			},
			changebomb: {
				locked: true,
				enable: "phaseUse",
				usable: 1,
				filter(event, player) { return player.countExpansions("first_bomb_yzs") > 0 && player.countCards("h") > 0 },
				async content(event, trigger, player) {
					let cards = player.getExpansions("first_bomb_yzs");
					let result = await player.chooseToMove("平凡生活：是否交换“弹”和手牌？")
						.set("list", [
							[get.translation(player) + "（你）的“弹”", cards],
							["手牌区", player.getCards("h")],
						])
						.set("filterMove", function (from, to) {
							return typeof to != "number";
						})
						.set("processAI", list => {
							const num = Math.min(list[0][1].length, list[1][1].length);
							const cards1 = list[0][1].slice().sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
							const cards2 = list[1][1].slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
							return [cards1.slice().addArray(cards2.slice(0, num)), cards2.slice().addArray(cards1.slice(0, num))];
						})
						.forResult();
					if (result.bool) {
						var pushs = result.moved[0],
							gains = result.moved[1];
						pushs.removeArray(player.getExpansions("first_bomb_yzs"));
						gains.removeArray(player.getCards("h"));
						if (!pushs.length || pushs.length != gains.length) return;
						let next = player.addToExpansion(pushs, player, "giveAuto")
						next.gaintag.add("first_bomb_yzs");
						await next;
						await player.gain(gains, "draw");
					}
				},
				sub: true,
				sourceSkill: "normal_life_yzs",
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	//神厂长
	"tudao_yzs": {
		"prompt2": "你可防止此伤害，并摸等量张牌，然后可将至多等量张手牌扣置为【刀】",
		group: ["tudao_yzs_jiashang"],
		locked: true,
		marktext: "刀",
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				player.loseToDiscardpile(cards);
			}
		},
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("tudao_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【刀】";
			},
		},
		logTarget: "player",
		subSkill: {
			jiashang: {
				trigger: {
					source: "damageBegin1",
				},
				sourceSkill: "tudao_yzs",
				filter(event) {
					return event.card && (event.card.name == "sha") && event.notLink();
				},
				charlotte: true,
				forced: true,
				async content(event, trigger, player) {
					trigger.num++;
				},
				ai: {
					damageBonus: true,
				},
				"_priority": 6,
				sub: true,
			},
		},
		audio: "guding_skill",
		priority: 3,
		trigger: {
			source: "damageBegin2",
		},
		filter(event) {
			return event.num > 0;
		},
		check(event, player) {
			if (get.attitude(player, event.player) > 0) return true;
			if (!player.countExpansions("tudao_yzs")) return true;
			return false;
		},
		async content(event, trigger, player) {
			const num = trigger.num;
			trigger.cancel();
			await player.draw(Math.min(num, 5));
			if (player.countExpansions("tudao_yzs") >= player.maxHp) return;
			let result = await player.chooseCard("h", false, [1, Math.min(num, player.maxHp - player.countExpansions("tudao_yzs"))], "屠刀", "扣置至多" + num + "张手牌称为【刀】，上限为你体力上限")
				.set("ai", (card) => {
					if (card.name == "du") {
						return 20;
					}
					var player = _status.event.player;
					var nh = player.countCards("h");
					if (!player.needsToDiscard()) {
						if (nh < 3) {
							return 0;
						}
						if (nh == 3) {
							return 5 - get.value(card);
						}
						return 7 - get.value(card);
					}
					return 10 - get.useful(card);
				},)
				.forResult()
			if (result && result.bool) {
				let next = player.addToExpansion(result.cards, player, "giveAuto");
				next.gaintag.add("tudao_yzs");
				await next;
			}
		},
		ai: {
			threaten: 1.1,
			expose: 0.2,
		},
	},
	"tuzai_yzs": {
		locked: true,
		group: ["tuzai_yzs_renew", "tuzai_yzs_use"],
		enable: "phaseUse",
		mod: {
			cardUsable(card) {
				if (card.name == "sha" && card?.storage?.tuzai_yzs) return Infinity;
			},
			targetInRange(card, player, target) {
				if (card.name == "sha" && card?.storage?.tuzai_yzs) return true;
			},
		},
		subSkill: {
			effect: {
				init: function (player) {
					if (player.name != "shenChangzhang_yzs") return;
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/shenChangzhang_yzs2.png");
					}, player)
				},
				onremove(player) {
					if (player.name != "shenChangzhang_yzs") return;
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/shenChangzhang_yzs.png");
					}, player)
				},
				locked: true,
				priority: 3,
				charlotte: true,
				forced: true,
				trigger: {
					source: "damageAfter",
				},
				async content(event, trigger, player) {
					await player.gainMaxHp();
					await player.recover()
				},
				"_priority": 0,
				sub: true,
				sourceSkill: "tuzai_yzs",
			},
			use: {
				priority: 5,
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.tuzai_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
				mod: {
					targetInRange: function (card) {
						if (card?.storage?.tuzai_yzs) {
							return true;
						}
					},
					cardUsable(card, player, num) {
						if (card?.storage?.tuzai_yzs) {
							return Infinity
						}
					},
				}
			},
			renew: {
				popup: false,
				forced: true,
				trigger: {
					player: "phaseUseBegin",
				},
				async content(event, trigger, player) {
					player.storage.tuzai_had[0] = false;
					player.storage.tuzai_had[1] = false;
					player.markSkill("tuzai_had");
				},
				sub: true,
				sourceSkill: "tuzai_yzs",
				"_priority": 0,
			},
		},
		init: function (player) {
			if (Array.isArray(player.storage.tuzai_had)) return;
			player.storage.tuzai_had = [false, false];
			player.markSkill("tuzai_had");
		},
		filter(event, player) {
			if (player.storage.tuzai_had[0] && player.countExpansions("tudao_yzs") < 2) return false;
			return (player.storage.tuzai_had[0] == false || player.storage.tuzai_had[1] == false) && player.countExpansions("tudao_yzs") > 0;
		},
		chooseButton: {
			dialog(event, player) {
				const cards = player.getExpansions("tudao_yzs");
				let prompt = `选择1张则将之当做无次数距离限制的普通【杀】使用，选择多张则获得之`;
				if (player.storage.tuzai_had[0]) {
					prompt = `获得其中至少2张`
				}
				if (player.storage.tuzai_had[1]) {
					prompt = `将其中1张当做无次数距离限制的普通【杀】使用`
				}
				return ui.create.dialog(prompt, cards, "hidden");
			},
			select() {
				const player = _status.event.player
				let select = [1, Infinity];
				if (player.storage.tuzai_had[0]) {
					select = [2, Infinity];
				}
				if (player.storage.tuzai_had[1]) {
					select = 1;
				}
				return select;
			},
			filter(button, player) {
				return true;
			},
			check(button) {
				const player = get.player();
				let cards = player.getExpansions("tudao_yzs");
				if (cards.length <= 2 && ui.selected.buttons?.length) return 0;
				if (ui.selected.buttons?.length) {
					return get.value(button)
				} else {
					return 5 - get.value(button)
				}
			},
			backup(links, player) {
				if (links.length > 1) return {
					name: "屠宰",
					cards: links,
					filterCard(card) {
						return lib.skill.tuzai_yzs_backup.cards.includes(card);
					},
					selectCard: -1,
					discard: false,
					lose: false,
					position: "x",
					async content(event, trigger, player) {
						player.storage.tuzai_had[1] = true;
						player.markSkill("tuzai_had");
						player.$damage()
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, "effect/damage2.mp3");
						await player.gain(event.cards)
						player.addTempSkills("tuzai_yzs_effect", "phaseUseAfter");
					}
				}
				return {
					name: "屠宰",
					filterCard(card) {
						return lib.skill.tuzai_yzs_backup.cards.includes(card);
					},
					selectCard: -1,
					position: "x",
					viewAs: {
						name: "sha",
						storage: { tuzai_yzs: true }
					},
					cards: links,
					async precontent(event, trigger, player) {
						player.storage.tuzai_had[0] = true;
						player.markSkill("tuzai_had");
					}
				};
			},
			prompt(links, player) {
				let str = `选择1张则将之当做无次数距离限制的普通【杀】使用，选择多张则获得之`;
				if (player.storage.tuzai_had[0]) {
					str = `获得其中至少2张`
				}
				if (player.storage.tuzai_had[1]) {
					str = `将其中1张当做无次数距离限制的普通【杀】使用`
				}
				return str
			},
		},
		ai: {
			order: 9,
			threaten: 2.1,
			result: {
				player:2
			},
		},
	},
	//神父李木
	"yifuzhiming_yzs": {
		nobracket: true,
		derivation: ["dangxian_yzs", "wushuang_yzs", "qiancaogangmu_yzs"],
		"prompt2": "你可摸1张牌并展示之，然后可重复本操作直至展示黑桃牌或依此法获得3张牌",
		locked: true,
		forced: true,
		group: ["yifuzhiming_yzs_loseSkill"],
		subSkill: {
			loseSkill: {
				forced: true,
				popup: false,
				trigger: {
					player: "phaseEnd",
				},
				filter(event, player) {
					return (player.hasSkill("dangxian_yzs") && player.hasSkill("wushuang_yzs") && player.hasSkill("qiancaogangmu_yzs"))
				},
				async content(event, trigger, player) {
					let result = await player.chooseButton([
						get.prompt("yifuzhiming_yzs"),
						[
							[
								["dangxian_yzs", "失去技能【当先】"],
								["wushuang_yzs", "失去技能【无双】"],
								["qiancaogangmu_yzs", "失去技能【芊草纲目】"],
								["yifuzhiming_yzs", "失去技能【以父之名】"],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							return player.hasSkill(button.link)
						})
						.set("ai", (button) => {
							let value = 0;
							if (button.link == "wushuang_yzs") value += 9;
							if (button.link == "qiancaogangmu_yzs") value += 7;
							if (button.link == "dangxian_yzs") value += 5;
							return 10-value;
						})
						.forResult();
					if (!result.bool) return
					player.removeSkills(result.links[0]);
				},
				sub: true,
				sourceSkill: "yifuzhiming_yzs",
				"_priority": 0,
			},
		},
		trigger: {
			player: "phaseZhunbei",
		},
		async content(event, trigger, player) {
			let num = 0;
			let is_spade = false;
			while (num < 3) {
				const result = await player.chooseBool("是否摸1张牌？")
					.set("ai", function () {
						return 6;
					})
					.forResult();
				if (!result.bool) return
				let cards = await player.draw().forResult();
				cards = cards.cards;
				await player.showCards(get.translation(player) + "【以父之名】展示牌", cards);
				num++;
				let suits = cards.map(card => get.suit(card)).toUniqued();
				if (suits.includes("spade")) {
					is_spade = true;
					break;
				}
			}
			if (is_spade) {
				player.skip("phaseUse")
			}
			if (num == 3) {
				if (player.hasSkill("dangxian_yzs") && player.hasSkill("wushuang_yzs") && player.hasSkill("qiancaogangmu_yzs")) return
				let result = await player.chooseButton([
					get.prompt("yifuzhiming_yzs"),
					[
						[
							["dangxian_yzs", "获得技能【当先】"],
							["wushuang_yzs", "获得技能【无双】"],
							["qiancaogangmu_yzs", "获得技能【芊草纲目】"],
						],
						"textbutton",
					],
				])
					.set("forced", true)
					.set("selectButton", 1)
					.set("filterButton", function (button) {
						let player = _status.event.player
						return !player.hasSkill(button.link)
						return true
					})
					.set("ai", (button) => {
						let value = 0;
						if (button.link == "wushuang_yzs") value += 9;
						if (button.link == "qiancaogangmu_yzs") value += 7;
						if (button.link == "dangxian_yzs") value += 5;
						return value;
					})
					.forResult();
				if (!result.bool) return
				player.addSkill(result.links[0]);
				player.popup(result.links[0]);
				game.log(player, "获得了", "【" + get.translation(result.links[0]) + "】");

			}
		},
		ai: {
			threaten: 0.9
		},
		"_priority": 0,
	},
	"dangxian_yzs": {
		trigger: {
			player: "phaseChange",
		},
		filter(event, player) {
			if (event.phaseList[event.num].startsWith("phaseDraw")) return true;
			return false;
		},
		async content(event, trigger, player) {
			trigger.phaseList[trigger.num] = "phaseUse|dangxian_yzs";
		},
		ai: {
			threaten: 0.9
		},
		"_priority": 0,
	},
	"wushuang_yzs": {
		enable: "phaseUse",
		usable: 1,
		group: ["wushuang_yzs_effect"],
		subSkill: {
			effect: {
				trigger: {
					global: "useCardAfter",
				},
				filter(event, player) {
					return event.card.storage && event.card.storage.wushuang_yzs;
				},
				charlotte: true,
				direct: true,
				content() {
					var targets = game
						.filterPlayer(current => {
							return current.hasHistory("sourceDamage", function (evt) {
								return evt.card == trigger.card;
							});
						})
						.sortBySeat();
					for (var target of targets) {
						target.draw();
					}
				},
				sub: true,
				sourceSkill: "wushuang_yzs",
				"_priority": 0,
			},
		},
		filter(event, player) {
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canUse({ name: "juedou" }, target)
			}))
		},
		viewAs: {
			name: "juedou",
			isCard: true,
			storage: { wushuang_yzs: true }
		},
		viewAsFilter(player) {
			return true
		},
		filterCard: () => false,
		selectCard: -1,
	},
	"qiancaogangmu_yzs": {
		nobracket: true,
		direct: true,
		popup: true,
		trigger: {
			player: "phaseUseBegin",
		},
		async content(event, trigger, player) {
			let result = await player.chooseButton([
				get.prompt("yifuzhiming_yzs"),
				[
					[
						["qiancaogangmu_yzs_effect1", "本阶段你造成伤害+1直至你致角色濒死"],
						["qiancaogangmu_yzs_effect2", "本阶段其他角色不可使用【桃】直至你致角色死亡"],
					],
					"textbutton",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.forResult();
			if (!result.bool) return
			player.addTempSkill(result.links[0], "phaseUseAfter");
		},
		"_priority": 0,
	},
	"qiancaogangmu_yzs_effect1": {
		forced: true,
		popup: false,
		group: ["qiancaogangmu_yzs_effect1_add_damage"],
		subSkill: {
			"add_damage": {
				popup: false,
				trigger: {
					source: "damageBegin1",
				},
				forced: true,
				content() {
					trigger.num++;
				},
				sub: true,
				sourceSkill: "qiancaogangmu_yzs_effect1",
				"_priority": 0,
			},
		},
		trigger: {
			source: "dying",
		},
		content() { player.removeSkill("qiancaogangmu_yzs_effect1") },
		sub: true,
		sourceSkill: "qiancaogangmu_yzs",
		"_priority": 0,
	},
	"qiancaogangmu_yzs_effect2": {
		forced: true,
		popup: false,
		group: ["qiancaogangmu_yzs_effect1_wansha"],
		subSkill: {
			wansha: {
				mod: {
					cardSavable: function (card, player) {
						if (
							card.name == "tao" &&
							!_status.event.skill &&
							game.hasPlayer(function (current) {
								return current != player && current.hasSkill("qiancaogangmu_yzs_effect2") && _status.currentPhase == current;
							})
						) {
							return false;
						}
					},
					cardEnabled: function (card, player) {
						if (
							card.name == "tao" &&
							!_status.event.skill &&
							game.hasPlayer(function (current) {
								return current != player && current.hasSkill("qiancaogangmu_yzs_effect2") && _status.currentPhase == current;
							})
						) {
							return false;
						}
					},
				},
				"_priority": 0,
				sub: true,
				sourceSkill: "qiancaogangmu_yzs_effect2",
			},
		},
		trigger: {
			source: "dieAfter",
		},
		content() { player.removeSkill("qiancaogangmu_yzs_effect2") },
		sub: true,
		sourceSkill: "qiancaogangmu_yzs",
		"_priority": 0,
	},
	//标李立新
	"zhengli_yzs": {
		group: ["zhengli_yzs_mod"],
		audio: "ext:一中杀/audio/skill:2",
		subSkill: {
			mod: {
				mod: {
					targetInRange(card, player, target) {
						if (get.name(card) == "shunshou") return true;
					},
				},
				direct: true,
				popup: false,
				trigger: {
					target: "useCardToBefore",
				},
				filter: function (trigger, player) {
					return trigger.card.name == "shunshou";
				},
				content: function () {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "zhengli_yzs",
				"_priority": 0,
			},
		},
		enable: "phaseUse",
		usable: 1,
		allowChooseAll: true,
		position: "he",
		filterCard: true,
		selectCard: [1, Infinity],
		prompt: "弃置任意张牌然后视为使用等量-1张【顺手牵羊】",
		check(card) {
			return 114514;
		},
		async content(event, trigger, player) {
			const num = event.cards.length;
			if (num < 2) event.finish();
			for (let i = 1; i < num; i++) {
				await player.chooseUseTarget("争利", "请选择【顺手牵羊】的目标（第" + i + "/" + (num - 1) + "张）", { name: "shunshou", isCard: true }, false)
			}
		},
		ai: {
			order: 10,
			threaten: 2,
			result: {
				player(player, target) {
					return 2 * (player.countCards("h") - 1)
				},
			},
			effect: {
				target(card2, player2, target) {
					if (card2.name === "shunshou") {
						return 0
					}
				},
			},
		}
	},
	"zhujiu_yzs": {
		logTarget: "player",
		marktext: "酒",
		intro: {
			name: "祝酒",
			"name2": "祝酒",
			content: "共有$枚【祝酒】",
		},
		mod: {
			maxHandcard: function (player, num) {
				return num - player.hp + 4;
			},
		},
		group: ["zhujiu_yzs_gainjiu", "zhujiu_yzs_start"],
		subSkill: {
			start: {
				audio: "zhujiu_yzs_gainjiu",
				direct: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return event.name != 'phase' || game.phaseNumber == 0;
				},
				async content(event, trigger, player) {
					player.addMark("zhujiu_yzs", 3);
				},
				sub: true,
				sourceSkill: "zhujiu_yzs",
				"_priority": 0,
			},
			gainjiu: {
				audio: "ext:一中杀/audio/skill:1",
				direct: true,
				trigger: {
					player: ["phaseBegin"],
				},
				filter(event, player, name) {
					return player.countMark("zhujiu_yzs") < 3;
				},
				async content(event, trigger, player) {
					player.addMark("zhujiu_yzs", 1);
				},
				sub: true,
				sourceSkill: "zhujiu_yzs",
				"_priority": 0,
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		"prompt2": "你可移除1枚【祝酒】标记以令其视为使用【酒】",
		trigger: {
			global: ["dying", "phaseUseBegin"],
		},
		filter: function (event, player) {
			if (event.player.hasSkill("hidden_yzs")) return false;
			return player.countMark("zhujiu_yzs") > 0;
		},
		check(event, player) {
			if (get.attitude(player, event.player) < 1) return false;
			if (event.name == "phaseUse") {
				if (!event.player.hasSha()) return false;//如果手牌没有杀，则AI不发动该技能
				//上述都不满足，则如果player可以使用杀并且有其他角色可以杀（在攻击范围内），则可以发动该技能
				return game.hasPlayer(current => get.attitude(player, current) < 0 && event.player.canUse("sha", current));
			}
			return true;
		},
		async content(event, trigger, player) {
			player.removeMark("zhujiu_yzs", 1);
			player.line(trigger.player);
			await trigger.player.chooseUseTarget({ name: "jiu" }, true, "noTargetDelay", "nodelayx");
		},
		ai: {
			order: 10,
			threaten: 2,
			expose: 0.2
		}
	},
	//普厂长
	"yangzhu_yzs": {
		logTarget: "player",
		locked: true,
		prompt2: "扣除1点体力上限然后无效此伤害",
		group: ["yangzhu_yzs_draw", "yangzhu_yzs_discard"],
		init: function (player) {
			player.storage.yangzhu = player.maxHp - player.hp;
			player.markSkill("lostHp");
		},
		subSkill: {
			draw: {
				prompt2: "你可失去1点体力，然后摸3张牌",
				preHidden: true,
				trigger: {
					player: "phaseEnd",
				},
				priority: 3,
				filter(event, player) {
					return player.isHealthy();
				},
				check(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					await player.loseHp();
					await player.draw(3);
				},
				sub: true,
				sourceSkill: "yangzhu_yzs",
				"_priority": 0,
			},
			discard: {
				forced: true,
				priority: 3,
				trigger: {
					player: ["changeHpEnd", "gainMaxHpAfter", "loseMaxHpAfter"],
				},
				filter(event, player) { return player.storage.yangzhu != player.maxHp - player.hp; },
				async content(event, trigger, player) {
					player.storage.yangzhu = player.maxHp - player.hp;
					player.markSkill("yangzhu");
					const result = await player.chooseTarget("是否弃置场上的一张牌？", false)
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return target.countDiscardableCards(player, "hej")
						})
						.set('ai', target => {
							const player = _status.event.player;
							return get.effect(target, { name: "guohe" }, player, player);
						})
						.forResult();
					if (result.bool) {
						await player.discardPlayerCard(result.targets[0], "hej", true);
					}
				},
				sub: true,
				sourceSkill: "yangzhu_yzs",
				"_priority": 0,
			},
		},
		priority: 3,
		trigger: {
			global: "damageBegin4",
		},
		filter(event, player) {
			if (event.player.hasSkill("hidden_yzs")) return false;
			return player.maxHp > 1
		},
		check(event, player) {
			if (player.isHealthy()) {
				if (player == event.player) return false;
				return get.attitude(player, event.player) > 2;
			}
			return get.attitude(player, event.player) > 1;
		},
		async content(event, trigger, player) {
			player.$damage()
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/damage2.mp3");
			await player.loseMaxHp();
			trigger.cancel();
		},
		ai: {
			maixie: true,
			expose: 0.4,
			threaten: 0.5,
		},
	},
	"lastclass_yzs": {
		nobracket: true,
		logTarget: "player",
		skillAnimation: true,
		animationColor: "gray",
		unique: true,
		limited: true,
		frequent(event, player) {
			return event.player === player;
		},
		trigger: {
			global: "dieBefore",
		},
		filter(event, player) {
			if (event.player.maxHp <= 0) return false;
			if (event.getParent().name == "giveup") return false;
			if (event.player.hasSkill("hidden_yzs")) return false;
			return true
		},
		check(event, player) {
			if (player == event.player) return true;
			return get.attitude(player, event.player) > 3;
		},
		async content(event, trigger, player) {
			player.awakenSkill()
			trigger.cancel("lastclass_yzs");
			if (trigger.player === player) {
				await player.recover(player.maxHp - player.hp);
			}
			else {
				if (trigger.player.hp > 1) {
					await trigger.player.loseHp(trigger.player.hp - 1);
				}
				else if (trigger.player.hp < 1) {
					await trigger.player.recover(1 - trigger.player.hp);
				}
				trigger.player.addSkill("lastclass_effect_yzs");
			}
		},
		mark: true,
		intro: {
			content: "limited",
		},
		"_priority": 0,
	},
	"lastclass_effect_yzs": {
		nobracket: true,
		mark: true,
		nopop: true,
		marktext: "<span style=\"text-decoration: line-through;\">课</span>",
		intro: {
			content: `体力值不可下降至下回合开始`,
		},
		forced: true,
		popup: false,
		group: ["lastclass_effect_yzs_lose"],
		subSkill: {
			lose: {
				forced: true,
				popup: false,
				trigger: {
					player: "phaseBegin",
				},
				async content(event, trigger, player) {
					player.removeSkill("lastclass_effect_yzs");
				},
				sub: true,
				sourceSkill: "lastclass_effect_yzs",
				"_priority": 0,
			},
		},
		priority:4,
		trigger: {
			player: ["changeHpBegin"],
		},
		filter(event, player) {
			if (event.num < 0) return true;
			return false;
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
		ai: {
			nodamage: true,
		},
		sub: true,
		sourceSkill: "lastclass_yzs",
		"_priority": 0,
	},
	//嫉妒魔女W
	"love_circle_yzs": {
		nobracket: true,
		locked: true,
		mark: "auto",
		marktext: "爱",
		intro: {
			markcount: "expansion",
			name: "病爱",
			mark(dialog, content, player) {
				if (!player.countExpansions("love_circle_yzs") && !player.hasSkill("love_circle_yzs")) {
					dialog.addText("当前未持有【病爱】");
					return;
				};
				if (player.countExpansions("love_circle_yzs")) dialog.addAuto(player.getExpansions("love_circle_yzs"))
				let lovemap = [0, 0, 0, 0, 0];
				let jealoustarget = -1;
				let lovetarget = -1;
				const players = game.filterPlayer(target => target.countExpansions("love_circle_yzs"));
				for (let i = 0; i < players.length; i++) {
					if (players[i].hasSkill("love_circle_yzs")) continue;
					lovemap[players[i].countExpansions("love_circle_yzs")]++;
				}
				for (let i = player.hasSkill("love_circle_yzs") ? 4 : player.countExpansions("love_circle_yzs") - 1; i > 0; i--) {
					if (lovemap[i] == 1) {
						lovetarget = i;
						break;
					}
				}
				for (let i = lovetarget - 1; i > 0; i--) {
					if (lovemap[i] == 1) {
						jealoustarget = i;
						break;
					}
				}
				const lt = game.filterPlayer(target => target.countExpansions("love_circle_yzs") == lovetarget && target != player);
				const jt = game.filterPlayer(target => target.countExpansions("love_circle_yzs") == jealoustarget && target != player);
				if (lt.length) {
					dialog.addText("你的“爱慕对象”是：" + get.translation(lt));
					const str = player.hasSkill("love_circle_yzs") ? "你受到 " + get.translation(lt) + " 对你造成的伤害时，可弃1张牌然后转移给其" : "你对" + get.translation(lt) + "造成伤害无效";
					dialog.addText(str);
				} else {
					dialog.addText("当前没有“爱慕对象”");
				}
				if (jt.length) {
					dialog.addText("你的“嫉妒对象”是：" + get.translation(jt));
					dialog.addText("你对" + get.translation(jt) + "造成伤害+1");
					if (player.hasSkill("love_circle_yzs")) dialog.addText("你对 " + get.translation(jt) + " 使用【杀】无距离限制且不可响应");
				} else {
					dialog.addText("当前没有“嫉妒对象”");
				}
			},
		},
		group: ["love_circle_yzs_effect", "love_circle_yzs_damageenhance", "love_circle_yzs_damagecancel"],
		forced: true,
		audio: "ext:一中杀/audio/skill:1",
		priority:2,
		trigger: {
			player: "phaseUseEnd",
		},
		filter(event, player) {
			return player.countCards("h");
		},
		async content(event, trigger, player) {
			await player.showHandcards(player, "发动了【恋爱循环】");
			let cardx = player.getCards("h", card => get.color(card, player) == "red");
			if (!cardx.length) return;
			// 第一行：进入弃牌堆的牌（索引 0）
			let list = [["你的手牌", cardx]];
			for (let target of game.filterPlayer(cur=>player!=cur)) {
				list.push([target, target.getExpansions("love_circle_yzs")])
			}
			let result = await player.chooseToMove_new(`恋爱循环：将任意张红色手牌明置于任意名其他角色的角色牌旁，称为【病爱】`)
				.set("list", list)
				.set("filterMove", function (from, to, moved) {

					let targetIndex = typeof to == 'number' ? to : moved.findIndex(l => l.includes(to.link));
					let fromIndex = typeof from == 'number' ? from : moved.findIndex(l => l.includes(from.link));

					if (targetIndex === 0) return false;
					if (fromIndex !== 0) return false;
					let targetList = moved[targetIndex];
					if (targetList?.length >= 4) return false;
					return true; // 目标为空，可以移入

				})
				.set("processAI", function (list) {
					const player = get.player();

					let sourceCards = (list[0] && list[0][1]) ? list[0][1].slice() : [];
					let resultMoved = list.map(item => (Array.isArray(item[1]) ? item[1].slice() : []));
					if (!sourceCards.length) {
						return resultMoved;
					}
					for (let i = sourceCards.length - 1; i >= 0; i--) {
						let card = sourceCards[i];
						let hasMoved = false;
						for (let j = 1; j < resultMoved.length; j++) {
							let targetRow = resultMoved[j];
							let target = list[j][0];
							if (targetRow.length == 0 && get.attitude(player, target) > 0) {
								targetRow.push(card);
								sourceCards.splice(i, 1);
								hasMoved = true;
								break;
							}
						}

						if (hasMoved) continue;
					}
					resultMoved[0] = sourceCards;
					return resultMoved;
				})
				.forResult();
			if (result?.bool) {
				let moved = result?.moved;
				if (!moved) return;
				for (let i = 1; i < moved.length; i++) {
					let next = list[i][0].addToExpansion(moved[i], player, "giveAuto")
					next.gaintag.add("love_circle_yzs")
					await next
				}
			}
		},
		subSkill: {
			effect: {
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				mark: true,
				trigger: {
					global: "phaseBegin",
				},
				filter(event, player) { return event.player.countExpansions("love_circle_yzs") || event.player == player },
				async content(event, trigger, player) { trigger.player.draw(); },
				sub: true,
				sourceSkill: "love_circle_yzs",
				"_priority": 0,
			},
			damageenhance: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					global: "damageBegin1",
				},
				filter(event, player) {
					if (!event.source) return false;
					if (!event.player.countExpansions("love_circle_yzs")) return false;
					if (event.player == player) return false;
					if (event.source.countExpansions("love_circle_yzs") <= event.player.countExpansions("love_circle_yzs") && event.source != player) return false;
					let lovemap = [0, 0, 0, 0, 0];
					let jealoustarget = -1;
					let lovetarget = -1;
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						lovemap[players[i].countExpansions("love_circle_yzs")]++;
					}
					if (lovemap[event.source.countExpansions("love_circle_yzs")] > 1 && event.source != player) return false;
					if (lovemap[event.player.countExpansions("love_circle_yzs")] > 1) return false;
					for (let i = (event.source == player ? 4 : (event.source.countExpansions("love_circle_yzs") - 1)); i > 0; i--) {
						if (lovemap[i] == 1) {
							lovetarget = i;
							break;
						}
					}
					for (let i = lovetarget - 1; i > 0; i--) {
						if (lovemap[i] == 1) {
							jealoustarget = i;
							break;
						}
					}
					return (event.player.countExpansions("love_circle_yzs") == jealoustarget);
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
				sub: true,
				sourceSkill: "love_circle_yzs",
				"_priority": 0,
			},
			damagecancel: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					global: "damageBegin2",
				},
				filter(event, player) {
					if (!event.source) return false;
					if (!event.player.countExpansions("love_circle_yzs")) return false;
					if (player == event.source || player == event.player) return false;
					if (event.source.countExpansions("love_circle_yzs") <= event.player.countExpansions("love_circle_yzs")) return false;
					let lovemap = [0, 0, 0, 0, 0];
					let lovetarget = -1;
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						lovemap[players[i].countExpansions("love_circle_yzs")]++;
					}
					if (lovemap[event.source.countExpansions("love_circle_yzs")] > 1) return false;
					if (lovemap[event.player.countExpansions("love_circle_yzs")] > 1) return false;
					for (let i = event.source.countExpansions("love_circle_yzs") - 1; i > 0; i--) {
						if (lovemap[i] == 1) {
							lovetarget = i;
							break;
						}
					}
					return (event.player.countExpansions("love_circle_yzs") == lovetarget);
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "love_circle_yzs",
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"fantasy_train_yzs": {
		nobracket: true,
		locked: true,
		"prompt2": "你可获得场上至多X张【病爱】。（X为【病爱】持有者数）",
		group: ["fantasy_train_yzs_qingguo", "fantasy_train_yzs_damage", "fantasy_train_yzs_direct"],
		mod: {
			targetInRange: function (card, player, target) {
				let lovemap = [0, 0, 0, 0, 0];
				let jealoustarget = -1;
				let lovetarget = -1;
				const players = game.filterPlayer();
				for (let i = 0; i < players.length; i++) {
					lovemap[players[i].countExpansions("love_circle_yzs")]++;
				}
				for (let i = 4; i > 0; i--) {
					if (lovemap[i] == 1) {
						lovetarget = i;
						break;
					}
				}
				for (let i = lovetarget - 1; i > 0; i--) {
					if (lovemap[i] == 1) {
						jealoustarget = i;;
						break;
					}
				}
				if ((target.countExpansions("love_circle_yzs") == jealoustarget) && card.name == "sha") return true;
			},
		},
		audio: "love_circle_yzs",
		trigger: {
			player: "phaseBegin",
		},
		frequent:true,
		filter(event, player) {
			return game.hasPlayer(function (current) {
				return current.countExpansions("love_circle_yzs");
			});
		},
		async content(event, trigger, player) {
			let gainnum = 0;
			const players = game.filterPlayer();
			for (let i = 0; i < players.length; i++) {
				if (players[i].countExpansions("love_circle_yzs")) gainnum++;
			}
			let list = [["你的手牌", []]];
			for (let target of game.filterPlayer(cur => cur.countExpansions("love_circle_yzs"))) {
				list.push([target, target.getExpansions("love_circle_yzs")])
			}

			let result = await player.chooseToMove_new(`妄想特快：回合开始时，你可获得场上至多${gainnum}张【病爱】`)
				.set("list", list)
				.set("filterMove", function (from, to, moved) {

					let targetIndex = typeof to == 'number' ? to : moved.findIndex(l => l.includes(to.link));
					let fromIndex = typeof from == 'number' ? from : moved.findIndex(l => l.includes(from.link));

					if (targetIndex !== 0) return false;
					if (fromIndex === 0) return false;
					let targetList = moved[targetIndex];
					if (targetList?.length >= get.event().max) return false;
					return true; // 目标为空，可以移入

				})
				.set("max",gainnum)
				.set("processAI", function (list) {
					let sourceCards = (list[0] && list[0][1]) ? list[0][1].slice() : [];
					let resultMoved = list.map(item => (Array.isArray(item[1]) ? item[1].slice() : []));
					return resultMoved;
				})
				.forResult();
			if (result?.bool) {
				let moved = result?.moved;
				if (!moved) return;
				let gains = moved[0];
				await player.gain(gains,"gain2");
			}
		},
		subSkill: {
			qingguo: {
				audio: "ext:一中杀/audio/skill:1",
				mod: {
					aiValue(player, card, num) {
						if (get.name(card) != "shan" && get.color(card) != "black") {
							return;
						}
						const cards = player.getCards("hs", card => get.name(card) == "shan" || get.color(card) == "black");
						cards.sort((a, b) => {
							return (get.name(b) == "shan" ? 1 : 2) - (get.name(a) == "shan" ? 1 : 2);
						});
						const geti = () => {
							if (cards.includes(card)) {
								cards.indexOf(card);
							}
							return cards.length;
						};
						if (get.name(card) == "shan") {
							return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
						}
						return Math.max(num, [6.5, 4, 3][Math.min(geti(), 2)]);
					},
					aiUseful() {
						return lib.skill.qingguo.mod.aiValue.apply(this, arguments);
					},
				},
				locked: false,
				enable: ["chooseToRespond", "chooseToUse"],
				filterCard(card) {
					return get.color(card) == "black";
				},
				viewAs: {
					name: "shan",
				},
				viewAsFilter(player) {
					if (!player.countCards("hs", { color: "black" })) {
						return false;
					}
				},
				position: "hs",
				prompt: "将一张黑色手牌当闪使用或打出",
				check() {
					return 1;
				},
				ai: {
					order: 3,
					respondShan: true,
					skillTagFilter(player) {
						if (!player.countCards("hs", { color: "black" })) {
							return false;
						}
					},
					effect: {
						target(card, player, target, current) {
							if (get.tag(card, "respondShan") && current < 0) {
								return 0.6;
							}
						},
					},
					basic: {
						useful: (card, i) => {
							let player = _status.event.player,
								basic = [7, 5.1, 2],
								num = basic[Math.min(2, i)];
							if (player.hp > 2 && player.hasSkillTag("maixie")) {
								num *= 0.57;
							}
							if (player.hasSkillTag("freeShan", false, null, true) || player.getEquip("rewrite_renwang")) {
								num *= 0.8;
							}
							return num;
						},
						value: [7, 5.1, 2],
					},
					result: {
						player: 1,
					},
				},
				"_priority": 0,
			},
			damage: {
				locked: true,
				trigger: {
					player: "damageBegin3",
				},
				audio: "ext:一中杀/audio/skill:1",
				filter(event, player) {
					if (!event.source) return false;
					if (event.source.hasSkill("hidden_yzs")) return false;
					if (!player.countCards("he")) return false;
					let lovemap = [0, 0, 0, 0, 0];
					let lovetarget = -1;
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						lovemap[players[i].countExpansions("love_circle_yzs")]++;
					}
					if (lovemap[event.source.countExpansions("love_circle_yzs")] > 1) return false;
					for (let i = 4; i > 0; i--) {
						if (lovemap[i] == 1) {
							lovetarget = i;
							break;
						}
					}
					return (event.source.countExpansions("love_circle_yzs") == lovetarget);
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseToDiscard("妄想特快", "你可弃置1张牌，然后将此伤害转移给" + get.translation(trigger.source), "hej", 1, true)
						.forResult()
				},
				async content(event, trigger, player) {
					trigger.player = trigger.source;
				},
				sub: true,
				sourceSkill: "fantasy_train_yzs",
				"_priority": 0,
			},
			direct: {
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					if (event.card.name != "sha") return false;
					if (!event.target.countExpansions("love_circle_yzs")) return false;
					let lovemap = [0, 0, 0, 0, 0];
					let jealoustarget = -1;
					let lovetarget = -1;
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						lovemap[players[i].countExpansions("love_circle_yzs")]++;
					}
					for (let i = 4; i > 0; i--) {
						if (lovemap[i] == 1) {
							lovetarget = i;
							break;
						}
					}
					for (let i = lovetarget - 1; i > 0; i--) {
						if (lovemap[i] == 1) {
							jealoustarget = i;
							break;
						}
					}
					if (jealoustarget < 1) return false
					return (event.target.countExpansions("love_circle_yzs") == jealoustarget)
				},
				forced: true,
				locked: true,
				popup: false,
				async content(event, trigger, player) {
					trigger.directHit.add(trigger.target);
				},
				sub: true,
				sourceSkill: "fantasy_train_yzs",
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	//莲华
	"tears_yzs": {
		group: ["tears_yzs_renew", "tears_yzs_move", "tears_yzs_used"],
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
				intro: {
					content: "本轮已发动过#/3次【涙】",
				},
				sub: true,
				sourceSkill: "tears_yzs",
				"_priority": 0,
			},
			renew: {
				charlotte: true,
				direct:true,
				firstDo: true,
				trigger: { player: ["phaseBegin"], },
				filter(event, player) { return player.countMark("tears_yzs_used") && !event.skill },
				async content(event, trigger, player) {
					player.removeMark("tears_yzs_used", player.countMark("tears_yzs_used"));
				}
			},
			move: {
				"prompt2": "你可将牌堆底的一张牌置顶。",
				trigger: {
					source: "damageBegin2",
					player: "damageBegin4",
				},
				filter(event, player) {
					var cards = ui.cardPile.childNodes || [];
					return cards.length > 1;
				},
				async content(event, trigger, player) {
					const cards = get.bottomCards(1, true);
					if (cards) {
						ui.cardPile.insertBefore(cards[0], ui.cardPile.firstChild);
						game.log(player, "将牌堆底的一张牌置于牌堆顶");
						game.updateRoundNumber();
					}
				}
			},
		},
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			if (get.type(name) == "basic" && lib.inpile.includes(name) && player.countMark("tears_yzs_used") < 3) return true;
		},
		filter(event, player) {
			if (event.responded || event.tears_yzs || player.countMark("tears_yzs_used") > 2) return false;
			for (var i of lib.inpile) {
				if (get.type(i) == "basic" && event.filterCard({ name: i, isCard: true }, player, event)) return true;
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = [];
				for (var i of lib.inpile) {
					if (get.type(i) == "basic" && event.filterCard({ name: i, isCard: true }, player, event)) {
						list.push(["基本", "", i]);
						if (i == "sha") {
							for (var j of lib.inpile_nature) list.push(["基本", "", "sha", j]);
						}
					}
				}
				return ui.create.dialog("涙", [list, "vcard"], "hidden");
			},
			check(button) {
				if (_status.event.getParent().type != "phase") return 1;
				if (button.link[2] == "shan") return 3;
				var player = _status.event.player;
				if (button.link[2] == "jiu") {
					if (player.getUseValue({ name: "jiu" }) <= 0) return 0;
					if (player.countCards("h", "sha")) return player.getUseValue({ name: "jiu" });
				}
				return player.getUseValue({ name: button.link[2], nature: button.link[3] }) / 4;
			},
			backup(links, event, player) {
				return {
					filterCard() {
						return false;
					},
					selectCard: -1,
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
						suit: "none",
						number: null,
						isCard: true,
					},
					async precontent(event, trigger, player) {
						delete event.result.skill;
						player.addMark("tears_yzs_used", 1);
						const sum = ui.cardPile.childNodes.length;
						const cards = [],
							num = 2;
						for (let i = 0; i < num; i++) {
							const card = ui.cardPile.childNodes[sum - 1 - i];
							if (card) cards.push(card);
							else break;
						}
						cards.reverse();
						const result = await player
							.chooseButton(["将其中一张基本牌当做刚才选择的牌使用或打出（右为底）", cards], 1, false)
							.set("filterButton", button => {
								return get.type(button) == "basic";
							})
							.forResult();
						if (!result.bool) {
							const evt = event.getParent();
							evt.set("tears_yzs", true);
							evt.goto(0);
							delete evt.openskilldialog;
							return;
						} else {
							event.result.cards = [result.links[0]];
							event.result.card = {
								name: links[0][2],
								nature: links[0][3],
								suit: get.suit(result.links[0]),
								number: get.number(result.links[0]),
								isCard: true,
							};
							event.result.card.tear_yzs = true;
						}
					},
				};
			},
			prompt(links, player) {
				return "涙：请选择目标";
			},
		},
		ai: {
			threaten:1.2
		}
	},
	"wanhua_mirror_yzs": {
		nobracket: true,
		direct: true,
		popup:true,
		mark: true,
		marktext: "☯",
		zhuanhuanji: true,
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				let str = `转换技：回合开始时：<span class="bluetext">`;
				str += player.storage.wanhua_mirror_yzs_change ? `阳：你摸1张牌，然后将2张手牌置底`
					: `阴：你摸2张牌，然后将1张手牌置底或暗置于人物牌上称为【愿】`
				dialog.addText(str);
				const cards = player.getExpansions("wanhua_mirror_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【愿】";
			},
		},
		init: function (player) {
			if (!player.storage.wanhua_mirror_yzs_change) {
				player.storage.wanhua_mirror_yzs_change = 0;
				player.markSkill("wanhua_mirror_yzs_change");
			}
		},
		trigger: { player: "phaseBegin" },
		async content(event, trigger, player) {
			if (!player.storage.wanhua_mirror_yzs_change) {
				player.storage.wanhua_mirror_yzs_change = 1;
				player.markSkill("wanhua_mirror_yzs_change");
				await player.draw(2);
				if (!player.countCards("h")) return;
				let button = await player.chooseButton([
					get.prompt("wanhua_mirror_yzs"),
					[
						[
							["bottom", "置于牌堆底"],
							["expansion", "扣置为【愿】"],
						],
						"textbutton",
					],
				])
					.set("forced", true)
					.set("selectButton", 1)
					.set("ai", () => {
						return get.event().choice;
					})
					.set(
						"choice",
						(() => {
							return "expansion"
						})()
					)
					.forResult();
				if (player.storage.gathering_hopes_yzs && button.links[0] == "expansion") return
				if (!button.bool) return
				let result = await player.chooseCard("h", true, 1, "万华镜", "选择1张手牌")
					.forResult()
				if (button.links[0] == "expansion") {
					let next = player.addToExpansion(result.cards, player, "giveAuto")
					next.gaintag.add("wanhua_mirror_yzs")
					await next;
					if (player.getExpansions("wanhua_mirror_yzs").length > 3) {
						await player.useSkill("gathering_hopes_awaken_yzs")
					}
				}
				else {
					await player.lose(result.cards[0], ui.cardPile);
					game.log(player, "将一张手牌置于了牌堆底");
				}
			} else {
				player.storage.wanhua_mirror_yzs_change = 0;
				player.markSkill("wanhua_mirror_yzs_change");
				await player.draw();
				let result = await player.chooseCard("h", true, Math.min(player.countCards("h"), 2), "万华镜", "选择2张手牌（不足则全选）")
					.forResult();
				if (result.cards.length) {
					let resultx;
					if (result.cards.length == 1) {
						resultx = { bool: true, moved: [result.cards] };
					} else {
						resultx = await player
							.chooseToMove("万华镜：将牌按顺序置于牌堆底（右为底）", true)
							.set("list", [["牌堆底", result.cards]])
							.set("processAI", list => {
								return [list[0][1].slice(0)];
							})
							.forResult();
					}
					if (resultx.bool) {
						const moved = resultx.moved[0];
						if (moved.length) {
							await player.lose(moved, ui.cardPile);
						}
					}
				}
			}
		},
		ai: {
			threaten: 1.2
		}
	},
	"gathering_hopes_yzs": {
		nobracket: true,
		mod: {
			cardUsable: function (card, player, num) {
				var suit = get.color(card);
				if (suit == "red" && player.storage.gathering_hopes_yzs) return Infinity;
			},
		},
		group: ["gathering_hopes_yzs_red"],
		subSkill: {
			red: {
				trigger: {
					player: "useCard1",
				},
				filter: function (event, player) {
					if (_status.currentPhase == player && get.color(event.card) == "red" && event.addCount !== false && player.storage.gathering_hopes_yzs) return true;
					return false;
				},
				forced: true,
				popup: false,
				firstDo: true,
				content: function () {
					trigger.addCount = false;
					const stat = player.getStat().card,
						name = trigger.card.name;
					if (typeof stat[name] == "number") stat[name]--;
				},
				sub: true,
				sourceSkill: "gathering_hopes_yzs",
				"_priority": 0,
			}
		},
		locked: true,
		forced: true,
		init: function (player) {
			if (!player.storage.gathering_hopes_yzs) {
				player.storage.gathering_hopes_yzs = false;
				player.markSkill("gathering_hopes_yzs");
			}
		},
		trigger: {
			player: "useCardToTargeted",
		},
		filter(event, player) {
			return event.card.name == "tao" && event.target != player;
		},
		async content(event, trigger, player) {
			const card = get.cards(1);
			if (player.storage.gathering_hopes_yzs) {
				player.gain(card, "gain2");
			} else {
				let next = player.addToExpansion(card, player, "giveAuto")
				next.gaintag.add("wanhua_mirror_yzs")
				await next
				if (player.countExpansions("wanhua_mirror_yzs") > 3) {
					await player.useSkill("gathering_hopes_awaken_yzs")
				}
			}
		},
		ai: {
			threaten: 2.2
		}
	},
	"gathering_hopes_awaken_yzs": {
		nobracket: true,
		locked: true,
		popup: false,
		unique: true,
		skillAnimation: true,
		animationColor: "key",
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.loseMaxHp();
			player.storage.gathering_hopes_yzs = true;
			player.markSkill("gathering_hopes_yzs");
			const players = game.filterPlayer();
			for (let i = 0; i < players.length; i++) {
				await players[i].changeHujia(1);
			}
			await player.gain(player.getExpansions("wanhua_mirror_yzs"));
		},
		sub: true,
		sourceSkill: "gathering_hopes_yzs",
		"_priority": 0,
	},
	//混子王
	"copywork_yzs": {
		nobracket: true,
		group: ["copywork_yzs_wuyongchang"],
		subSkill: {
			wuyongchang: {
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					if (!event.getParent().name.includes("phase")) return false;
					if (event.getParent(1).name == "copywork_yzs_wuyongchang" || event.getParent(1).name == "copywork_yzs") return false;
					if (event.responded || event.copywork_yzs_wuyongchang || event.getParent().copywork_yzs_wuyongchang) return false;
					return player.countCards("h", "tao") > 0;
				},
				async content(event, trigger, player) {
					const evt = event.getParent(2);
					evt.set("copywork_yzs_wuyongchang", true);
					let target = await player.chooseTarget("抄作业", "请选择【桃】的目标", false)
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return target.getDamagedHp();
						})
						.set("ai", target => {
							const player = get.player();
							return get.effect(target, { name: "tao" }, player, player)
						})
						.forResult()
					if (!target.bool) {
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
						return
					}
					const next = player.chooseToUse('对其使用【桃】', { name: 'tao' }, target.targets[0], true)
					next.set("copywork_yzs_wuyongchang");
					await next;
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				},
				ai: {
					order: 4,
					result: {
						player:2,
					}
				}
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("copywork_yzs");
		},
		clickableFilter: function (player) {
			return player.countCards("h", "tao") > 0;
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("抄作业", "请选择【桃】的目标", false)
				.set("filterTarget", (card, player, target) => {
					return target.getDamagedHp();
				})
				.forResult()
			if (!target.bool) return
			const next = player.chooseToUse('对其使用【桃】', { name: 'tao' }, target.targets[0], true)
			next.set("copywork_yzs_wuyongchang");
			await next;
		},
		forced: true,
		locked: true,
		direct: true,
		popup: false,
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
			if (Array.isArray(player.storage.copywork_yzs)) return;
			player.storage.copywork_yzs = [];
			player.markSkill("copywork_yzs");
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		marktext: "抄",
		intro: {
			nocount:true,
			content(storage, player) {
				if (!player.storage.copywork_yzs || !player.storage.copywork_yzs.length) return;
				var str = "";
				str += get.translation(player.storage.copywork_yzs[0]);
				str += get.translation(player.storage.copywork_yzs[1]);
				return str;
			},
		},
		mod: {
			cardEnabled(card, player) {
				if (player?.storage?.copywork_yzs?.length) return get.suit(card, false) == player.storage.copywork_yzs[0];
				return false;
			},
			cardRespondable(card, player) {
				if (player?.storage?.copywork_yzs?.length) return get.suit(card, false) == player.storage.copywork_yzs[0];
				return false;
			},
			cardname(card, player, name) {
				if (player?.storage?.copywork_yzs?.length) {
					if (get.suit(card, false) == player.storage.copywork_yzs[0]) {
						return player.storage.copywork_yzs[1];
					}
				}
			},
		},
		trigger: {
			global: ["loseAfter", "loseAsyncAfter", "cardsDiscardAfter", "equipAfter"],
		},
		filter(event, player) {
			let cards = event.getd();
			for (var card of cards) {
				if (get.suit(card)!="none" && card.name && get.type(card) != "equip" && get.type(card) != "delay") {
					return true;
				}
			}
			return false;
		},
		async content(event, trigger, player) {
			const cards = await trigger.getd().filter(card => {
				let suit = get.suit(card);
				if (suit && card.name && get.type(card) != "equip" && get.type(card) != "delay") {
					return true;
				} else return false;
			});
			if (!cards) return;
			let name = cards[0].name;
			if (cards.length == 1) {
				if (get.tag(cards[0], "damage")) name = "tao";
				game.log(player, "抄袭了" + get.translation(get.suit(cards[0])) + get.translation(name));
				player.storage.copywork_yzs = [get.suit(cards[0]), name];
				player.markSkill("copywork_yzs");
				return;
			}
			let result = await player.chooseButton(["抄作业", "请选择要抄袭的卡牌", cards], true)
				.set("selectButton", 1)
				.forResult()
			if (result.bool == false) return
			const card = result.links[0];
			name = card.name;
			if (get.tag(card, "damage")) name = "tao";
			game.log(player, "抄袭了" + get.translation(get.suit(card)) + get.translation(name));
			player.storage.copywork_yzs = [get.suit(card), name];
			player.markSkill("copywork_yzs");
		}
	},
	"drawfish_yzs": {
		group: ["drawfish_yzs_used", "drawfish_yzs_renew", "drawfish_yzs_wuyongchang"],
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
				intro: {
					content: "本轮已发动过#/1次【摸鱼】",
				},
				sub: true,
				sourceSkill: "drawfish_yzs",
				"_priority": 0,
			},
			renew: {
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				force: true,
				charlotte:true,
				filter(event, player) {
					if (player.countCards("h")) return false;
					const evt = event.getl(player);
					return evt && evt.player == player && evt.hs && evt.hs.length > 0;
				},
				async content(event, trigger, player) {
					player.removeMark("drawfish_yzs_used", 1, false);
				},
			},
			wuyongchang: {
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao"
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded || event.drawfish_yzs_wuyongchang || event.getParent().drawfish_yzs_wuyongchang) return false;
					return !player.countMark("drawfish_yzs_used");
				},
				async content(event, trigger, player) {
					const evt = event.getParent(2);
					evt.set("drawfish_yzs_wuyongchang", true);
					player.addMark("drawfish_yzs_used", 1, false);
					await player.draw(4);
					const num = player.countCards("h");
					if (num == 4) {
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
						return;
					}
					if (num < 4) player.draw(4 - num);
					else {
						 await player.chooseToDiscard("摸鱼", "请弃置" + (num - 4) + "张手牌", "h", num - 4, true)
					}
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				}
			}
		},
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("drawfish_yzs");
		},
		clickableFilter: function (player) {
			return !player.countMark("drawfish_yzs_used");
		},
		clickableContent: async function (event, trigger, player) {
			player.addMark("drawfish_yzs_used", 1, false);
			await player.draw(4);
			const num = player.countCards("h");
			if (num == 4) return;
			if (num < 4) player.draw(4 - num);
			else {
				await player.chooseToDiscard("摸鱼", "请弃置" + (num - 4) + "张手牌", "h", num - 4, true)
			}
		},
		trigger: { player: "phaseBegin" },
		forced: true,
		popup: false,
		charlotte:true,
		firstDo: true,
		filter(event, player) { return player.countMark("drawfish_yzs_used")&&!event.skill },
		async content(event, trigger, player) {
			player.removeMark("drawfish_yzs_used", 1, false);
		}
	},
	//翼飞羽
	"wuying_yzs": {
		locked: true,
		group: ["wuying_yzs_hidden1", "wuying_yzs_hidden2"],
		trigger: {
			player: "phaseDiscardBegin",
		},
		filter: function (event, player) {
			return player.countCards("h") > 1;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard("无影", "你可弃置2张牌，然后跳过弃牌阶段", "h", 2, false)
				.set("ai", function (card) {
					if (player.needsToDiscard() > 2) return 8 - get.useful(card, player);
					return -1;
				})
				.forResult()
		},
		async content(event, trigger, player) {
			await player.discard(event.cards)
			await trigger.cancel();
		},
		subSkill: {
			hidden1: {
				audio: "ext:一中杀/audio/skill:1",
				prompt: "你可进入【隐匿】",
				trigger: {
					source: "dying",
				},
				filter: function (event, player) {
					return !player.hasSkill("hidden_yzs")
				},
				content() {
					player.addSkill("hidden_yzs")
					game.log(player, "进入了【隐匿】")
				},
			},
			hidden2: {
				audio: "wuying_yzs_hidden1",
				prompt: "你可跳过本回合额定出牌阶段，然后进入【隐匿】",
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, player) {
					return !player.hasSkill("hidden_yzs")
				},
				content() {
					player.addSkill("hidden_yzs")
					player.skip("phaseUse")
					game.log(player, "跳过了本回合出牌阶段")
					game.log(player, "进入了【隐匿】")
				},
			}
		}
	},
	"shadowattack_yzs": {
		seatRelated: true,
		locked: true,
		logTarget: "player",
		prompt2: `你可退出【隐匿】并摸1张牌，然后你于其后置位执行出牌阶段
		此阶段你使用【杀】无次数限制且你的牌仅可指定其或自己为目标。`,
		group: ["shadowattack_yzs_forced"],
		audio: "ext:一中杀/audio/skill:1",
		subSkill: {
			forced: {
				audio: "shadowattack_yzs",
				forced: true,
				locked: true,
				priority: 3,
				trigger: {
					global: "phaseEnd",
				},
				filter(event, player) {
					return player.hasSkill("hidden_yzs") && event.player.getNext().getNext() == player;
				},
				async content(event, trigger, player) {
					if (trigger.player == player) {
						const target = trigger.player;
						if (!player.storage.toutianhuanri_yzs_pos[0]) player.storage.toutianhuanri_yzs_pos[0] = (target.getSeatNum());
						else if (!player.storage.toutianhuanri_yzs_pos[1]) player.storage.toutianhuanri_yzs_pos[1] = (target.getSeatNum());
						else {
							player.storage.toutianhuanri_yzs_pos[0] = player.storage.toutianhuanri_yzs_pos[1];
							player.storage.toutianhuanri_yzs_pos[1] = (target.getSeatNum());
						}
						game.log(player, "记录了" + get.translation(target) + "的座位号(" + target.getSeatNum() + ")");
						player.removeSkill("hidden_yzs");
						await player.draw();
						player.addSkill("shadowattack_yzs_effect");
						const evt = player.phaseUse();
						evt.skill = 'shadowattack_yzs'
						await evt;
					} else {
						const home = player.getPrevious();
						const target = trigger.player;
						if (!player.storage.toutianhuanri_yzs_pos[0]) player.storage.toutianhuanri_yzs_pos[0] = (target.getSeatNum());
						else if (!player.storage.toutianhuanri_yzs_pos[1]) player.storage.toutianhuanri_yzs_pos[1] = (target.getSeatNum());
						else {
							player.storage.toutianhuanri_yzs_pos[0] = player.storage.toutianhuanri_yzs_pos[1];
							player.storage.toutianhuanri_yzs_pos[1] = (target.getSeatNum());
						}
						game.log(player, "记录了" + get.translation(target) + "的座位号(" + target.getSeatNum() + ")");
						player.removeSkill("hidden_yzs");
						await player.draw();
						while (target.getNext() != player) {
							game.broadcastAll(
								function (target1, target2) {
									game.swapSeat(target1, target2);
								},
								player,
								player.getNext()
							);
						}
						player.addSkill("shadowattack_yzs_effect");
						const evt = player.phaseUse();
						evt.skill = 'shadowattack_yzs'
						await evt;
						while (home.getNext() != player) {
							game.broadcastAll(
								function (target1, target2) {
									game.swapSeat(target1, target2);
								},
								player,
								player.getPrevious()
							);
						}
					}
					player.markSkill("toutianhuanri_yzs_pos");
				}
			}
		},
		priority: 1,
		trigger: {
			global: "phaseEnd",
		},
		filter(event, player) {
			if (event.player.hasSkill("hidden_yzs")) return false;
			return player.hasSkill("hidden_yzs");
		},
		check(event, player) {
			if (!player.hasSha()) return false;
			return get.attitude(player, event.player) < -1;
		},
		async content(event, trigger, player) {
			const home = player.getPrevious();
			const target = trigger.player;
			if (!player.storage.toutianhuanri_yzs_pos[0]) player.storage.toutianhuanri_yzs_pos[0] = (target.getSeatNum());
			else if (!player.storage.toutianhuanri_yzs_pos[1]) player.storage.toutianhuanri_yzs_pos[1] = (target.getSeatNum());
			else {
				player.storage.toutianhuanri_yzs_pos[0] = player.storage.toutianhuanri_yzs_pos[1];
				player.storage.toutianhuanri_yzs_pos[1] = (target.getSeatNum());
			}
			game.log(player, "记录了" + get.translation(target) + "的座位号(" + target.getSeatNum() + ")");
			player.removeSkill("hidden_yzs");
			await player.draw();
			while (target.getNext() != player) {
				game.broadcastAll(
					function (target1, target2) {
						game.swapSeat(target1, target2);
					},
					player,
					player.getNext()
				);
			}
			player.addSkill("shadowattack_yzs_effect");
			const evt = player.phaseUse();
			evt.skill = 'shadowattack_yzs'
			await evt;
			while (home.getNext() != player) {
				game.broadcastAll(
					function (target1, target2) {
						game.swapSeat(target1, target2);
					},
					player,
					player.getPrevious()
				);
			}
			player.markSkill("toutianhuanri_yzs_pos");
		}
	},
	"shadowattack_yzs_effect": {
		charlotte: true,
		mark: true,
		trigger: { player: "phaseUseAfter" },
		popup: false,
		forced: true,
		async content(event, trigger, player) {
			await player.removeSkill("shadowattack_yzs_effect")
		},
		marktext: "<span style=\"text-decoration: line-through;\">袭</span>",
		intro: {
			content: "本阶段牌只可指定你自己或你上家为目标",
		},
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
			cardSavable(card, player, target) {
				if (target != player && target != player.getPrevious()) return false;
			},
			playerEnabled(card, player, target) {
				if (target != player && target != player.getPrevious()) return false;
			},
		},
		sub: true,
		sourceSkill: "shadowattack_yzs",
	},
	"kill_yzs": {
		audio: "ext:一中杀/audio/skill:1",
		limited: true,
		skillAnimation:false,
		Effect: function (current) {
			{
				function playPurpleSlashEffect(targetPlayer) {
					// 1. 震动效果
					const originalTransform = targetPlayer.style.transform || '';

					// 2. 创建刀光容器
					const slashContainer = document.createElement('div');
					Object.assign(slashContainer.style, {
						position: 'absolute',
						top: '0',
						left: '0',
						width: '100%',
						height: '100%',
						zIndex: '1001',
						pointerEvents: 'none',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					});

					// 3. 创建蓝紫色刀光核心
					const slashLine = document.createElement('div');
					Object.assign(slashLine.style, {
						position: 'absolute',
						width: '140%',
						height: '12px',
						// 蓝紫色渐变：深紫 -> 亮蓝 -> 白色核心 -> 亮蓝 -> 深紫
						background: 'linear-gradient(to bottom, #6a0dad 0%, #00d4ff 40%, #fff 50%, #00d4ff 60%, #6a0dad 100%)',
						boxShadow: '0 0 20px #6a0dad, 0 0 10px #00d4ff',
						transform: 'rotate(-20deg) scaleX(0)',
						borderRadius: '50% 50% 50% 50% / 100% 100% 0% 0%', // 使两头稍微变尖
						opacity: '1'
					});

					slashContainer.appendChild(slashLine);
					targetPlayer.appendChild(slashContainer);

					// 4. 执行动画
					const slashAnim = slashLine.animate([
						{ transform: 'rotate(-20deg) scaleX(0)', opacity: 1 },
						{ transform: 'rotate(-20deg) scaleX(1)', opacity: 1, offset: 0.1 },
						{ transform: 'rotate(-20deg) scaleX(1.1) translateY(8px)', opacity: 0 }
					], {
						duration: 350,
						easing: 'cubic-bezier(0.2, 0, 0.2, 1)'
					});

					slashAnim.onfinish = () => {
						if (slashContainer.parentNode) {
							slashContainer.parentNode.removeChild(slashContainer);
						}
					};
				}

				if (current) {
					playPurpleSlashEffect(current);
				}
			}
		},
		subSkill: {
			renew: {
				direct: true,
				forced: true,
				popup: false,
				firstDo: true,
				trigger: {
					source: "die",
				},
				filter(event, player) {
					return player.awakenedSkills.includes("kill_yzs") && !event.player.storage.isSub;
				},
				async content(event, trigger, player) {
					game.broadcastAll((player) => {
						player.restoreSkill("kill_yzs");
					}, player)
				}
			}
		},
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("kill_yzs");
		},
		clickableFilter: function (player) {
			if (!game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs")) && player != target;
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("斩杀", "选择 1 名其他角色，斩杀他！", false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs")) && player != target;
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return get.damageEffect(target2, player2, player2);
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("kill_yzs")
			next.targets = target.targets;
			await next;
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return true
		},
		filterTarget: function (card, player, target) {
			return !(target.hasSkill("hidden_yzs")) && player != target;
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.awakenSkill("kill_yzs");
			await player.addSkill("kill_yzs_renew");
			event.targets[0].playEffectOL(lib.skill.kill_yzs.Effect);
			await event.targets[0].damage()
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					return get.damageEffect(target, player, target);
				},
			},
			expose: 0.3,
			threaten:1.2
		},
	},
	"toutianhuanri_yzs": {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:1",
		changeSeat: true,
		seatRelated: true,
		limited: true,
		skillAnimation: false,
		subSkill: {
			renew: {
				direct: true,
				forced: true,
				popup: false,
				firstDo: true,
				trigger: {
					source: "dying",
				},
				filter(event, player) {
					return player.awakenedSkills.includes("toutianhuanri_yzs")
				},
				async content(event, trigger, player) {
					game.broadcastAll((player) => {
						player.restoreSkill("toutianhuanri_yzs");
					}, player)
				}
			}
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (!player.storage.toutianhuanri_yzs_pos.length) return false;
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return true
		},
		filterTarget: function (card, player, target) {
			let seats = player.storage.toutianhuanri_yzs_pos;
			const players = game.players
				.slice()
				.concat(game.dead)
				.sort((a, b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
			for (let i = 0; i < seats.length; i++) {
				while (!game.players.includes(players[seats[i] - 1])) {
					seats[i]--;
					if (seats[i] < 1) seats[i] = game.players.length;
				}
			}
			return (seats.includes(target.getSeatNum()));
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.awakenSkill("toutianhuanri_yzs");
			await player.addSkill("toutianhuanri_yzs_renew");
			const evt1 = event.getParent("phaseUse", true);
			if (evt1 && evt1.player == player) {
				game.log(player, "结束了出牌阶段");
				evt1.skipped = true;
			}
			const evt2 = event.getParent("phase", true);
			if (evt2 && evt2.player == player) {
				game.log(player, "结束了回合");
				evt2.finish();
				evt2.untrigger(true);
				player.addSkill("toutianhuanri_yzs_move");
				player.storage.toutianhuanri_yzs_move = event.targets[0];
				player.markSkill("toutianhuanri_yzs_move");
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") evt.goto(0);
				delete evt.openskilldialog;
				return;
			}
			if (event.targets[0] == player) {
				game.log(player, "原地跳跃")
				player.addSkill("hidden_yzs")
				game.log(player, "进入了【隐匿】")
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") evt.goto(0);
				delete evt.openskilldialog;
				return;
			}
			else while (event.targets[0].getNext() != player) {
				game.broadcastAll(
					function (target1, target2) {
						game.swapSeat(target1, target2);
					},
					player,
					player.getNext()
				);
			}
			game.log(player, "移动至" + event.targets[0].getSeatNum() + "号位后面")
			player.addSkill("hidden_yzs")
			game.log(player, "进入了【隐匿】")
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		init: function (player, skill) {
			if (!Array.isArray(player.storage.toutianhuanri_yzs_pos))player.storage.toutianhuanri_yzs_pos = [];
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("toutianhuanri_yzs");
		},
		clickableFilter: function (player) {
			if (!player.storage.toutianhuanri_yzs_pos.length) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("偷天换日", "选择 1 名角色，移动至其后置位，然后进入【隐匿】", false)
				.set("filterTarget", (card, player, target) => {
					let seats = player.storage.toutianhuanri_yzs_pos;
					const players = game.players
						.slice()
						.concat(game.dead)
						.sort((a, b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
					for (let i = 0; i < seats.length; i++) {
						while (!game.players.includes(players[seats[i] - 1])) {
							seats[i]--;
							if (seats[i] < 1) seats[i] = game.players.length;
						}
					}
					return (seats.includes(target.getSeatNum()));
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("toutianhuanri_yzs")
			next.targets = target.targets;
			await next;
		},
	},
	"toutianhuanri_yzs_move": {
		nobracket: true,
		sub: true,
		locked: true,
		forced: true,
		popup: false,
		sourceSkill: "toutianhuanri_yzs",
		trigger: { global: "phaseBeginStart" },
		filter(event, player) {
			return game.players.includes(player.storage.toutianhuanri_yzs_move);
		},
		async content(event, trigger, player) {
			if (player.storage.toutianhuanri_yzs_move == player) {
				game.log(player, "原地跳跃")
				player.addSkill("hidden_yzs")
				game.log(player, "进入了【隐匿】")
				return;
			}
			else while (player.storage.toutianhuanri_yzs_move.getNext() != player) {
				game.broadcastAll(
					function (target1, target2) {
						game.swapSeat(target1, target2);
					},
					player,
					player.getNext()
				);
			}
			game.log(player, "移动至" + player.storage.toutianhuanri_yzs_move.getSeatNum() + "号位后面")
			player.addSkill("hidden_yzs")
			game.log(player, "进入了【隐匿】")
			player.removeSkill("toutianhuanri_yzs_move")
		}
	},
	"hidden_yzs": {
		charlotte: true,
		mark: true,
		nopop: true,
		marktext: "<span style=\"text-decoration: line-through;\">隐</span>",
		intro: {
			content:`你不可被牌或技能指定`,
		},
		mod: {
			targetEnabled(card, player, target) {
				if (player == target) return
				if (target.hasSkill("jifengbaoxiang_yzs_summon") && player.hasSkill("chengfengpolang_yzs")) return;
				return false;
			},
		},
		ai: {
			hidden_yzs: true,
			skillTagFilter(player, tag, arg) {
				if (!player.isAlive()) return false;
				if (player == arg) {
					return false;
				}
			},
		},
		sub: true,
		sourceSkill: "wuying_yzs",
		priority: 5,
	},
	//女武神
	"blessing_yzs": {
		group: ["blessing_yzs_addMark", "blessing_yzs_renew", "blessing_yzs_fu", "blessing_yzs_used"],
		marktext: "福",
		intro: {
			name: "福",
			"name2": "福",
			content: "共有$枚【福】（回合开始时回复$点体力",
		},
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("blessing_yzs");
		},
		clickableFilter: function (player) {
			return player.yzs_hasCountDown() && !player.countMark("blessing_yzs_used");
		},
		clickableContent: async function (event, trigger, player) {
			let sings = player.yzs_getCountDown()
			const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
			if (list.length) {
				const result2 = list.length > 1 ? await player
					.chooseButton([`祈福：令你的至多2项吟唱-1`, [list, "textbutton"]], false)
					.set("ai", button => {
						const { owner, player } = get.event();
						return get.cdValue(button.link, owner) * get.attitude(player, owner);
					})
					.set("selectButton", [1, 2])
					.set("owner", player)
					.forResult() : {
					bool: true,
					links: list.map(i => i[0]),
				};
				if (result2?.bool && result2.links?.length) {
					var damageAudioInfo = "ext:一中杀/audio/skill/blessing_yzs_wuyongchang";
					const index = Math.floor(Math.random() * 2) + 1;
					damageAudioInfo += index + ".mp3";
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, damageAudioInfo);
					player.addMark("blessing_yzs_used", 1, false);
					player.playEffectOL(lib.skill.blessing_yzs.Effect);
					await player.yzs_updateCountDown(result2.links);
				}
			}
		},
		Effect: function (targetPlayer) {
			// 创建圣光容器
			const lightBeam = document.createElement('div');
			lightBeam.className = 'blessing-light-effect';

			// 设置圣光容器样式
			Object.assign(lightBeam.style, {
				position: 'absolute',
				top: '-50px', // 从上方开始
				left: '50%',
				transform: 'translateX(-50%)',
				width: '80px',
				height: '0', // 初始高度为0
				zIndex: '1000',
				pointerEvents: 'none',
				overflow: 'visible'
			});

			// 插入到玩家头像容器
			targetPlayer.appendChild(lightBeam);

			// 创建主光束
			const mainBeam = document.createElement('div');
			mainBeam.className = 'main-light-beam';

			Object.assign(mainBeam.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '0',
				background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.1))',
				borderRadius: '40px',
				filter: 'blur(2px)',
				boxShadow: '0 0 30px rgba(255, 255, 255, 0.8)',
				opacity: '0'
			});

			lightBeam.appendChild(mainBeam);

			// 创建光晕效果
			const glow = document.createElement('div');
			glow.className = 'light-glow';

			Object.assign(glow.style, {
				position: 'absolute',
				top: '0',
				left: '50%',
				transform: 'translateX(-50%)',
				width: '120px',
				height: '0',
				background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)',
				opacity: '0'
			});

			lightBeam.appendChild(glow);

			// 创建光粒子
			const particleCount = 15;
			const particles = [];

			for (let i = 0; i < particleCount; i++) {
				const particle = document.createElement('div');
				particle.className = 'light-particle';

				const size = Math.random() * 4 + 2;
				const startLeft = Math.random() * 80;
				const delay = Math.random() * 300;

				Object.assign(particle.style, {
					position: 'absolute',
					width: `${size}px`,
					height: `${size}px`,
					background: 'rgba(255, 255, 255, 0.9)',
					borderRadius: '50%',
					left: `${startLeft}%`,
					top: '0',
					boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
					opacity: '0',
					filter: 'blur(0.5px)'
				});

				lightBeam.appendChild(particle);
				particles.push({ element: particle, delay, startLeft, size });
			}

			// 主光束动画
			mainBeam.animate([
				{
					height: '0',
					opacity: '0'
				},
				{
					height: '120px',
					opacity: '0.9'
				},
				{
					height: '120px',
					opacity: '0.7'
				},
				{
					height: '120px',
					opacity: '0'
				}
			], {
				duration: 1200,
				easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
			});

			// 光晕动画
			glow.animate([
				{
					height: '0',
					opacity: '0'
				},
				{
					height: '150px',
					opacity: '0.6'
				},
				{
					height: '150px',
					opacity: '0.4'
				},
				{
					height: '150px',
					opacity: '0'
				}
			], {
				duration: 1400,
				easing: 'ease-out',
				delay: 100
			});

			// 光粒子动画
			particles.forEach(particle => {
				const { element, delay, startLeft, size } = particle;

				const swayAmount = (Math.random() - 0.5) * 30;

				element.animate([
					{
						top: '0px',
						opacity: '0',
						transform: 'translateX(0)'
					},
					{
						top: '0px',
						opacity: '0.9',
						transform: 'translateX(0)'
					},
					{
						top: '100px',
						opacity: '0.7',
						transform: `translateX(${swayAmount}px)`
					},
					{
						top: '120px',
						opacity: '0',
						transform: `translateX(${swayAmount * 1.5}px)`
					}
				], {
					duration: 1000 + Math.random() * 500,
					delay: delay,
					easing: 'cubic-bezier(0.3, 0.8, 0.6, 1)'
				});
			});

			// 动画结束后移除
			setTimeout(() => {
				if (lightBeam.parentNode) {
					lightBeam.parentNode.removeChild(lightBeam);
				}
			}, 1500);

			// 添加到全局CSS
			if (!document.querySelector('#blessing-light-style')) {
				const style = document.createElement('style');
				style.id = 'blessing-light-style';
				style.textContent = `
									@keyframes lightPulse {
										0% { 
											box-shadow: 0 0 5px rgba(255, 255, 255, 0.3),
													   0 0 20px rgba(255, 255, 255, 0.2);
										}
										50% { 
											box-shadow: 0 0 15px rgba(255, 255, 255, 0.6),
													   0 0 40px rgba(255, 255, 255, 0.4);
										}
										100% { 
											box-shadow: 0 0 5px rgba(255, 255, 255, 0.3),
													   0 0 20px rgba(255, 255, 255, 0.2);
										}
									}

									.blessing-light-effect::before {
										content: '';
										position: absolute;
										top: -20px;
										left: 50%;
										transform: translateX(-50%);
										width: 60px;
										height: 20px;
										background: radial-gradient(ellipse at center, 
											rgba(255, 255, 255, 0.8) 0%, 
											rgba(255, 255, 255, 0) 70%);
										border-radius: 50%;
										opacity: 0;
										animation: lightPulse 2s ease-in-out infinite;
									}
								`;
				document.head.appendChild(style);
			}
		},
		locked: true,
		audio: "ext:一中杀/audio/skill:2",
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return player.yzs_hasCountDown()&& !player.countMark("blessing_yzs_used");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		chooseButton: {
			dialog(event, player) {
				const list = player.yzs_getCountDown().map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
				return ui.create.dialog("祈福：令你的至多2项吟唱-1", [list, "textbutton"], "hidden");
			},
			select: [1,2],
			filter(button) {
				return true;
			},
			check(button) {
				return get.cdValue(button.link, get.player());
			},
			prompt(links, player) {
				const items = links;
				let str = ``;
				for (let item of items) {
					const name = `${item.name}[${item.num}/${item.repeatNum}]`,
						prompt = item.prompt;
					str += `###令${name}吟唱-1###${prompt}<br>`
				}
				return str;
			},
			backup(links, player) {
				return {
					links: links,
					filterCard: () => false,
					selectCard: -1,
					//manualConfirm: true,
					ai1: () => 1,
					async content(event, trigger, player) {
						const { links: items } = get.info(event.name);
						player.addMark("blessing_yzs_used", 1, false);
						player.playEffectOL(lib.skill.blessing_yzs.Effect);
						await player.yzs_updateCountDown(items);
						const evt = event.getParent(2);
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
					},
				}
			},
		},
		ai: {
			order: 8,
			result: {
				player: 1,
			},
		},
		subSkill: {
			backup: {
				"skill_id": "blessing_yzs_backup",
				sub: true,
				sourceSkill: "blessing_yzs",
				"_priority": 0,
			},
			addMark: {
				trigger: {
					source: "damageSource"
				},
				forced: true,
				locked: true,
				popup: false,
				filter: function (event, player) {
					return  event.card && event.card.name == 'sha';
				},
				logTarget: "player",
				content: function () {
					trigger.player.addMark("blessing_yzs");
				},
			},
			renew: {
				init: function (player, skill) {
					player.storage.blessing_yzs_renew = [];
					player.markSkill("blessing_yzs_renew");
				},
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, trigger, player) {
					if (trigger.skill) return false;
					return true;
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				content() {
					player.storage.blessing_yzs_renew = [];
					player.markSkill("blessing_yzs_renew");
					if (player.countMark("blessing_yzs_used")) player.removeMark("blessing_yzs_used", player.countMark("blessing_yzs_used"), false);
				}
			},
			fu: {
				locked: true,
				forced: true,
				audio: "ext:一中杀/audio/skill:1",
				direct: true,
				trigger: {
					global: "phaseBegin",
				},
				filter(event, player) { return event.player.countMark("blessing_yzs") },
				async content(event, trigger, player) {
					let num = trigger.player.countMark("blessing_yzs")
					await trigger.player.recover(num);
					trigger.player.removeMark("blessing_yzs", num);

					let sings = player.yzs_getCountDown(i => !player.storage.blessing_yzs_renew.includes(i))
					const list = sings.map(item => [item, `${get.translation(item.name)}[吟唱${item.num}/${item.repeatNum}]：${item.prompt}`]);
					if (list.length) {
						const result2 = await player
							.chooseButton([`祈福：令你的一个吟唱-1`, [list, "textbutton"]], false)
							.set("ai", button => {
								const { owner, player } = get.event();
								return get.cdValue(button.link, owner) * get.attitude(player, owner);
							})
							.set("selectButton", 1)
							.set("owner", player)
							.forResult();
						if (result2?.bool && result2.links?.length) {
							player.storage.blessing_yzs_renew.push(result2.links[0]);
							player.markSkill("blessing_yzs_renew");
							player.playEffectOL(lib.skill.blessing_yzs.Effect);
							await player.yzs_updateCountDown(result2.links);
						}
					}
				},
			},
			used: {
				used: {
					charlotte: true,
					intro: {
						content: "本自轮次已发动过【祈福】的无咏唱",
					},
					sub: true,
					sourceSkill: "blessing_yzs",
					"_priority": 0,
				},
			}
		},
		"_priority": 0,
	},
	"HolyBlessing_yzs": {
		derivation: ["HolyBlessing_yzs_draw", "HolyBlessing_yzs_hujia", "HolyBlessing_yzs_sha", "HolyBlessing_yzs_wushen"],
		group: ["HolyBlessing_yzs_nodraw"],
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:1",
		subSkill: {
			nodraw: {
				locked: true,
				forced: true,
				popup: false,
				firstDo:true,
				trigger: {
					player: "phaseDrawBefore",
				},
				content: function () {
					trigger.cancel();
				},
			},
		},
		init(player, skill) {
			const countDowns = [{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						const num = 4 - player.countCards("h");
						if (num == 0) return
						var damageAudioInfo = "ext:一中杀/audio/skill/HolyBlessing_yzs_draw";
						const index = 1;
						damageAudioInfo += index + ".mp3";
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, damageAudioInfo);
						if (num > 0) await player.draw(num);
						else await player.chooseToDiscard("h", true, -num);
					},
					list: [player],
				},
				value(item, player) {
					if (player.countCards("h") >= 4) return -1;
					return 2 * (4 - player.countCards("h"))
				},
				name: "HolyBlessing_yzs_draw",
				prompt: `你调整手牌数至4`,
				skill: "HolyBlessing_yzs_draw"
			},
			{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let num = 1 - player.hujia;
						if (num == 0) return;
						var damageAudioInfo = "ext:一中杀/audio/skill/HolyBlessing_yzs_hujia";
						const index = 1;
						damageAudioInfo += index + ".mp3";
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, damageAudioInfo);
						await player.changeHujia(num);
					},
					list: [player],
				},
				value(item, player) {
					if (!player.hujia) return 2;
					return 0;
				},
				name: "HolyBlessing_yzs_hujia",
				prompt: `调整护甲值至1`,
				skill: "HolyBlessing_yzs_hujia"
			},
			{
				nocount: true,
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						if (game.hasPlayer(function (target) {
							return player.canUse({ name: "sha" }, target)
						})) {
							var damageAudioInfo = "ext:一中杀/audio/skill/HolyBlessing_yzs_sha";
							const index = 1;
							damageAudioInfo += index + ".mp3";
							game.broadcastAll(function (damageAudioInfo) {
								if (lib.config.background_audio) {
									game.playAudio(damageAudioInfo);
								}
							}, damageAudioInfo);
							var next =  player.chooseUseTarget("sha", true);
							next.prompt = "圣佑：选择普通【杀】的目标";
							next.addCount = false;
							await next;
						}
					},
					list: [player],
				},
				value(item, player) {
					return 1.5;
				},
				name: "HolyBlessing_yzs_sha",
				prompt: `你视为使用普通【杀】(准备阶段不计算此吟唱)`,
				skill: "HolyBlessing_yzs_sha"
			},
			{
				num: 4,
				repeatNum: 4,
				command: {
					async todo(player) {
						var damageAudioInfo = "ext:一中杀/audio/skill/HolyBlessing_yzs_wushen";
						const index = 1;
						damageAudioInfo += index + ".mp3";
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, damageAudioInfo);
						await player.addSkill("wushen_yzs");
						game.log(player, "变身武神");
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Cana2_yzs.png");
						}, player)
						player.playEffectOL(lib.skill.GodgivenSwordsmanship_yzs.Effect);
						player.popup("武神")
						if (lib.config.background_audio) {
							game.playAudio("effect", "recover");
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "HolyBlessing_yzs_wushen",
				prompt: `进入【武神】状态至你下回合开始`,
				skill: "HolyBlessing_yzs_wushen"
			}];
			for (let item of countDowns) {
				if (!player.yzs_hasCountDown(i=>i.name==item.name))player.yzs_setCountDown(item);
			}
		},
		priority:-21,
		trigger: {
			player: "phaseBegin"
		},
		filter: function (event, player) { return player.countCards("h") > 0 },
		async content(event, trigger, player) {
			await player.discard(player.getCards("h"))
		},
		ai: {
			nokeep: true,
			noh: true,
			skillTagFilter(player) {
				return player.countCards("h") < 4;
			},
		}
	},
	"HolyBlessing_yzs_draw": {
		forced: true,
		locked: true,
		sing: 1,
		intro: {
			content: "吟唱#/1：调整手牌数至4",
		},
		sub: true,
		sourceSkill: "HolyBlessing_yzs",
		"_priority": 1,
		init: function (player, skill) {
			player.addMark("HolyBlessing_yzs_draw", get.info(skill).sing, false);
		},
		trigger: {
			player: "phaseZhunbei",
		},
		async content(event, trigger, player) {
			player.removeMark("HolyBlessing_yzs_draw", 1, false)
			if (player.countMark("HolyBlessing_yzs_draw") == 0) {
				player.addMark("HolyBlessing_yzs_draw", get.info("HolyBlessing_yzs_draw").sing, false);
				const num = 4 - player.countCards("h");
				if (num == 0) return
				if (num > 0) await player.draw(num);
				else await player.discardPlayerCard(player, "h", true, -num);
			}
		}
	},
	"HolyBlessing_yzs_hujia": {
		audio: "ext:一中杀/audio/skill:1",
		forced: true,
		locked: true,
		sing: 1,
		intro: {
			content: "吟唱#/1：调整护甲值至1",
		},
		sub: true,
		sourceSkill: "HolyBlessing_yzs",
		"_priority": 2,
		init: function (player, skill) {
			player.addMark("HolyBlessing_yzs_hujia", get.info(skill).sing, false);
		},
		trigger: {
			player: "phaseZhunbei",
		},
		async content(event, trigger, player) {
			player.removeMark("HolyBlessing_yzs_hujia", 1, false)
			if (player.countMark("HolyBlessing_yzs_hujia") == 0) {
				player.addMark("HolyBlessing_yzs_hujia", get.info("HolyBlessing_yzs_hujia").sing, false);
				let num = 1 - player.hujia;
				if (num == 0) return;
				await player.changeHujia(num);
			}
		}
	},
	"HolyBlessing_yzs_sha": {
		forced: true,
		locked: true,
		sing: 1,
		audio: "ext:一中杀/audio/skill:1",
		intro: {
			content: "吟唱#/1：视为使用普通【杀】",
		},
		sub: true,
		sourceSkill: "HolyBlessing_yzs",
		"_priority": 3,
		init: function (player, skill) {
			player.addMark("HolyBlessing_yzs_sha", get.info(skill).sing, false);
		},
		async content(event, trigger, player) {
			player.removeMark("HolyBlessing_yzs_sha", 1, false)
			if (player.countMark("HolyBlessing_yzs_sha") == 0) {
				player.addMark("HolyBlessing_yzs_sha", get.info("HolyBlessing_yzs_sha").sing, false);
				if (game.hasPlayer(function (target) {
					return player.canUse({ name: "sha" }, target)
				})) {
					var next = player.chooseUseTarget("sha", true);
					next.prompt = "圣佑：选择普通【杀】的目标";
					next.addCount = false;
				}
			}
		}
	},
	"HolyBlessing_yzs_wushen": {
		forced: true,
		locked: true,
		sing: 4,
		intro: {
			content: "吟唱#/4：进入【武神】状态至你下回合开始",
		},
		sub: true,
		sourceSkill: "HolyBlessing_yzs",
		"_priority": 4,
		init: function (player, skill) {
			player.addMark("HolyBlessing_yzs_wushen", get.info(skill).sing, false);
		},
		trigger: {
			player: "phaseZhunbei",
		},
		async content(event, trigger, player) {
			player.removeMark("HolyBlessing_yzs_wushen", 1, false)
			if (player.countMark("HolyBlessing_yzs_wushen") == 0) {
				var damageAudioInfo = "ext:一中杀/audio/skill/HolyBlessing_yzs_wushen";
				const index = 1;
				damageAudioInfo += index + ".mp3";
				game.broadcastAll(function (damageAudioInfo) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo);
					}
				}, damageAudioInfo);
				player.addMark("HolyBlessing_yzs_wushen", get.info("HolyBlessing_yzs_wushen").sing, false);
				player.addSkill("wushen_yzs");
				game.log(player, "变身武神");
				game.broadcastAll(function (current) {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Cana2_yzs.png");
				}, player)
			}
		}
	},
	"wushen_yzs": {
		sub: true,
		forced: true,
		charlotte: true,
		popup: false,
		group: ["wushen_yzs_lose"],
		subSkill: {
			lose: {
				forced: true,
				filter: function (event, player) { return true },
				trigger: {
					player: "phaseBegin"
				},
				firstDo: true,
				async content(event, trigger, player) {
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Cana_yzs.png");
					}, player)
					game.log(player, "武神效果结束");
					player.removeSkill("wushen_yzs");
				}
			}
		},
		mod: {
			globalFrom: function (from, to, distance) {
				return distance - 1;
			},
		},
		sourceSkill: "HolyBlessing_yzs",
		trigger: {
			source: "damageBegin1",
		},
		sourceSkill: "tudao_yzs",
		filter(event) {
			return event.card && (event.card.name == "sha") && event.notLink();
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			trigger.num++;
		},
		ai: {
			damageBonus: true,
			threaten:2.8
		},
	},
	//怠惰双子
	"HuanMeng_yzs": {
		group: ["HuanMeng_yzs_cancel"],
		forced: true,
		locked: true,
		subSkill: {
			cancel: {
				logTarget: "player",
				locked: true,
				trigger: {
					target: "useCardToTarget",
				},
				prompt: "弃1张牌然后投掷4：无效此牌",
				async cost(event, trigger, player) {
					let str = "弃置1张牌，投掷4，令此牌对你无效";
					event.result = await player
						.chooseToDiscard(str, "h")
						.set("ai", card => {
							return _status.event.goon / 1.4 - get.value(card);
						})
						.set(
							"goon",
							(function () {
								if (!trigger.targets.length) return -get.attitude(player, trigger.player);
								var num = 0;
								for (var i of trigger.targets) {
									num -= get.effect(i, trigger.card, trigger.player, player);
								}
								return num;
							})()
						)
						.set("chooseonly", true)
						.setHiddenSkill("HuanMeng_yzs_cancel")
						.set("logSkill", ["HuanMeng_yzs_cancel", trigger.player])
						.forResult();
				},
				filter(event, player) {
					return (player.countCards("h") > 0)
				},
				async content(event, trigger, player) {
					await player.modedDiscard(event.cards);
					let results = await player.yzs_throw(4).forResult();
					if (results.bool) trigger.getParent().excluded.add(player);
				}
			}
		},
		trigger: {
			player: "phaseBegin"
		},
		async content(event, trigger, player) {
			const results = await player.yzs_throw().forResult();
			if (results.number < 1 || results.number > 6) return;
			let str = "HuanMeng";
			str += results.number
			str += "_yzs";
			const countDowns = [{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let num = 3;
						if (player.storage.DreamTwins_yzs_awaken) num = 6;
						for (let i = 0; i < num; i++) {
							let results = await player.yzs_throw(5).forResult();
							if (results.bool) await player.draw();
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "HuanMeng1_yzs",
				prompt: `重复3次： ${get.poptip("throw_yzs")}5：你摸1张牌`,
				skill: "HuanMeng1_yzs"
			},
			{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let results = await player.yzs_throw(3).forResult();
						if (results.bool) await player.recover();
						if (player.storage.DreamTwins_yzs_awaken) {
							let results = await player.yzs_throw(3).forResult();
							if (results.bool) await player.recover();
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "HuanMeng2_yzs",
				prompt: `投掷3：你恢复1点体力`,
				skill: "HuanMeng2_yzs"
			},
			{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let results = await player.yzs_throw(2).forResult();
						if (results.bool) {
							if (game.hasPlayer(function (target) {
								return player.canUse({ name: "sha" }, target, false)
							})) {
								await player.chooseUseTarget({ name: "sha" }, true, false, "nodistance")
									.set("prompt", "幻梦")
									.set("prompt2", "视为使用一张普通【杀】")
							}
						}
						if (player.storage.DreamTwins_yzs_awaken) {
							let results = await player.yzs_throw(2).forResult();
							if (results.bool) {
								if (game.hasPlayer(function (target) {
									return player.canUse({ name: "sha" }, target, false)
								})) {
									await player.chooseUseTarget({ name: "sha" }, true, false, "nodistance")
										.set("prompt", "幻梦")
										.set("prompt2", "视为使用一张普通【杀】")
								}
							}
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "HuanMeng3_yzs",
				prompt: `投掷2：你视为使用无距离限制的普通【杀】`,
				skill: "HuanMeng3_yzs"
			},
			{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let num = 1;
						if (player.storage.DreamTwins_yzs_awaken) num = 2;
						for (let i = 0; i < num; i++) {
							let results = await player.yzs_throw(5).forResult();
							if (results.bool) {
								if (game.hasPlayer(function (target) {
									return player.canUse({ name: "guohe" }, target)
								})) {
									let result = await player.chooseTarget("幻梦", "请选择【过河拆桥】的目标", true)
										.set("filterTarget", (card, player, target) => {
											if (target.hasSkill("hidden_yzs")) return false;
											return player.canUse({ name: "guohe" }, target);
										})
										.forResult()
									if (result.bool) {
										await player.useCard({ name: "guohe", isCard: true, }, result.targets[0]);
									}
								}
								if (game.hasPlayer(function (target) {
									return player.canUse({ name: "shunshou" }, target)
								})) {
									let result = await player.chooseTarget("幻梦", "请选择【顺手牵羊】的目标", true)
										.set("filterTarget", (card, player, target) => {
											if (target.hasSkill("hidden_yzs")) return false;
											return player.canUse({ name: "shunshou" }, target);
										})
										.forResult()
									if (result.bool) {
										await player.useCard({ name: "shunshou", isCard: true, }, result.targets[0]);
									}
								}
							}
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "HuanMeng4_yzs",
				prompt: `投掷5：你依次视为使用【过河拆桥】和【顺手牵羊】`,
				skill: "HuanMeng4_yzs"
			},
			{
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let num = 1;
						if (player.storage.DreamTwins_yzs_awaken) num = 2;
						for (let i = 0; i < num; i++) {
							let results = await player.yzs_throw(4).forResult();
							if (results.bool) {
								var vcards = [];
								for (let name of ["wuzhong", "juedou"]) {
									let card = {
										name: name,
										isCard: true
									};
									let gamers = game.filterPlayer(current => {
										return player.canUse(card, current, false);
									});
									if (gamers.length) vcards.push(name);
								};
								let result = {}
								if (vcards.length > 1) {
									result = await player.chooseButton(true, ["视为使用一张牌", [vcards, "vcard"]])
										.set("ai", function (button) {
											let player = _status.event.player;
											let card = {
												name: button.link[2],
												nature: button.link[3],
												isCard: true
											};
											return player.getUseValue(card);
										})
										.set("forced", true)
										.set("selectButton", 1)
										.forResult();
								}
								else if (vcards.length) {
									result = {
										bool: true,
										links: vcards
									}
								}
								if (result) {
									var links = result.links || [];
									if (links.length) {
										var card = {
											name: links[0][2],
											nature: links[0][3],
											isCard: true
										};
										await player.chooseUseTarget(card, true, "nodistance")
											.set("prompt", "幻梦")
											.set("prompt2", "视为使用一张" + get.translation(card))
									}
								}
							}
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "HuanMeng5_yzs",
				prompt: `投掷4：你视为使用【无中生有】或【决斗】`,
				skill: "HuanMeng5_yzs"
				},
			];
			const skill = player.yzs_getCountDown(i => i.name == str);
			if (player.hasSkill(str)) {
				player.removeSkills(str)
				if (results.number != 6) player.yzs_clearCountDown(skill);
				game.log(player, "失去了" + get.translation(str));
				player.chat("呜，这可不妙")
			}
			else {
				player.addSkills(str)
				if (results.number!=6)await player.yzs_setCountDown(countDowns[results.number - 1]);
				game.log(player, "获得了" + get.translation(str));
				player.chat("呐~获得新技能~")
			}
		},
		ai: {
			threaten:1.8
		}
	},
	"HuanMeng1_yzs": {
		forced: true,
		locked: true,
		sing: 1,
		sub: true,
		sourceSkill: "HuanMeng_yzs",
		"_priority": 5,
	},
	"HuanMeng2_yzs": {
		forced: true,
		locked: true,
		sing: 1,
		sub: true,
		sourceSkill: "HuanMeng_yzs",
		"_priority": 4,
	},
	"HuanMeng3_yzs": {
		forced: true,
		locked: true,
		sing: 1,
		sub: true,
		sourceSkill: "HuanMeng_yzs",
		"_priority": 3,
	},
	"HuanMeng4_yzs": {
		forced: true,
		locked: true,
		sing: 1,
		sub: true,
		sourceSkill: "HuanMeng_yzs",
		"_priority": 2,
	},
	"HuanMeng5_yzs": {
		forced: true,
		locked: true,
		sing: 1,
		sub: true,
		sourceSkill: "HuanMeng_yzs",
		"_priority": 1,
	},
	"HuanMeng6_yzs": {
		forced: true,
		locked: true,
		LastDo: true,
		sub: true,
		sourceSkill: "HuanMeng_yzs",
		trigger: {
			player: "phaseAfter",
		},
		filter(event, player) {
			if (event.skill) return false;
			return true;
		},
		async content(event, trigger, player) {
			let num = 1;
			if (player.storage.DreamTwins_yzs_awaken) num = 2;
			while (num > 0) {
				num--;
				player.insertPhase().skill = 'HuanMeng6_yzs';
			}
		}
	},
	"DreamTwins_yzs": {
		nobracket: true,
		locked: true,
		unique: true,
		group: ["DreamTwins_yzs_record"],
		init: function (player, skill) {
			if (!player.storage.DreamTwins_yzs_awaken) {
				player.storage.DreamTwins_yzs_awaken = false;
				player.markSkill("DreamTwins_yzs_awaken");
			}
		},
		subSkill: {
			record: {
				locked: true,
				forced: true,
				popup: false,
				marktext: "梦",
				intro: {
					markcount:"storage",
					mark(dialog, content, player) {
						const storage = player.getStorage("DreamTwins_yzs_record").sort(function (a, b) {
							return a - b;
						});
						if (storage.length) {
							dialog.addText(`已记录的投掷结果：`);
							let str = ``;
							for (let num of storage) {
								str += num + ' ';
							}
							dialog.addText(str);
						} else {
							dialog.addText(`当前未有记录`);
						}
					},
				},
				init: function (player, skill) {
					player.storage.DreamTwins_yzs_record = [];
					player.markSkill("DreamTwins_yzs_record");
				},
				trigger: {
					player: "yzs_throwEnd"
				},
				filter: function (event, player) {
					if (player.storage.DreamTwins_yzs_awaken) return false;
					if (event.number < 1 || event.number > 6) return false;
					return !player.storage.DreamTwins_yzs_record.includes(event.number);
				},
				async content(event, trigger, player) {
					player.storage.DreamTwins_yzs_record.add(trigger.number);
					game.log(player, "记录了" + trigger.number + "(崎梦双星)");
					if (player.storage.DreamTwins_yzs_record.length >= 6) await player.useSkill("DreamTwins_yzs_awaken")
				}
			}
		},
		enable: "phaseUse",
		prompt: "弃置1张红色手牌，然后投掷5：分配1点伤害",
		filter(event, player) {
			if (!player.storage.DreamTwins_yzs_awaken) return false;
			if (!game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs"))
			})) return false;
			return player.countCards("h", { color: "red" }) > 0;
		},
		filterCard: {
			color: "red",
		},
		position: "h",
		check(card) {
			return 5 - get.value(card);
		},
		async content(event, trigger, player) {
			let results = await player.yzs_throw(5).forResult();
			if (!results.bool) {
				return;
			}
			let target = await player.chooseTarget("崎梦双星", "选择 1 名角色，对其造成1点伤害", true)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return get.damageEffect(target2, player2, player2);
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			await target.targets[0].damage()
		}
	},
	"DreamTwins_yzs_awaken": {
		nobracket: true,
		skillAnimation: true,
		animationColor: "orange",
		locked: true,
		forced: true,
		unique: true,
		async content(event, trigger, player) {
			await player.recover();
			player.storage.DreamTwins_yzs_awaken = true;
			player.markSkill("DreamTwins_yzs_awaken");
		}
	},
	//蕾米莉亚
	"liuwangnvshiqu_yzs": {
		nobracket: true,
		locked: true,
		charlotte: true,
		unique: true,
		group: ["liuwangnvshiqu_yzs_recover"],
		trigger: { player: "phaseUseBegin" },
		async cost(event, trigger, player) {
			const list = [1, 2, 3, 4, 5, "cancel2"]
			let result = await player.chooseControl(list)
				.set("ai", function () {
					const player = get.player();
					if (player.hp > 3) return 3;
					if (player.hp <= 1) return "cancel2";
					return 0;
				})
				.set("prompt", "六王女逝曲")
				.set("prompt2", "失去1~5点体力，摸等量张牌并获得等量张符卡")
				.forResult();
			if (result.control == false) return false;
			event.result = {
				bool: result.control != "cancel2",
				cost_data: result.control,
			};
		},
		async content(event, trigger, player) {
			const num = event.cost_data;
			await player.loseHp(num);
			await player.draw(num);
			const addnum = Math.min(num, get.character(player.name).Fuka - player.countMark("Fuka_yzs"));
			if (addnum) player.addMark("Fuka_yzs", addnum);
			if (num > 3) player.addTempSkill("jiashang_yzs", "phaseUseAfter")
		},
		subSkill: {
			recover: {
				name:"神术「吸血鬼幻想」",
				trigger: {
					source: "damageBegin1",
				},
				sourceSkill: "liuwangnvshiqu_yzs",
				filter(event) {
					return event.card && (event.card.name == "sha") && event.num != 0;
				},
				charlotte: true,
				forced: true,
				async content(event, trigger, player) {
					await player.recover();
				},
				"_priority": 0,
				sub: true,
			}
		}
	},
	"jiashang_yzs": {
		intro: {
			content: "你的【杀】造成伤害+1",
		},
		trigger: {
			source: "damageBegin1",
		},
		filter(event) {
			return event.card && (event.card.name == "sha") && event.notLink();
		},
		charlotte: true,
		forced: true,
		popup: false,
		async content(event, trigger, player) {
			trigger.num++;
		},
		ai: {
			damageBonus: true,
		},
		sub: true,
		sourceSkill: "liuwangnvshiqu_yzs",
		"_priority": 4,
	},
	"Gungnell_yzs": {
		nobracket: true,
		group: ["Gungnell_yzs_renew"],
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, trigger, player) {
					if (trigger.skill) return false;
					return true;
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				content() {
					player.storage.Gungnell_yzs = [-1, -1];
					player.markSkill("Gungnell_yzs");
				}
			},
		},
		locked: true,
		init: function (player, skill) {
			if (Array.isArray(player.storage.Gungnell_yzs)) return;
			player.storage.Gungnell_yzs = [-1, -1];
			player.markSkill("Gungnell_yzs");
		},
		line: false,
		enable: "phaseUse",
		filter: function (event, player) {
			if (player.countMark("Fuka_yzs") < 1) return false;
			return (game.hasPlayer(function (target) {
				return player.canUse({ name: "sha" }, target, false)
			}))
		},
		check(event, player) {
			const card = new lib.element.VCard({ name: "sha" });
			return get.effect(event.player, card, player, player) > 0;
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return player.canUse({ name: "sha" }, target, false)
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			let results = await player.yzs_throw(5).forResult();
			if (results.bool && player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs")
			const target = event.target;
			let next = player.useCard({ name: "sha", isCard: true, storage: { Gungnell_yzs: true } }, target);
			if (player.storage.Gungnell_yzs[1] < 1) {
				next.customArgs = {};
				next.customArgs.default = {};
				next.customArgs.default.skipShan = true;
			}
			if (typeof next.shanRequired !== "number" || !next.shanRequired || next.shanRequired < 0) {
				next.shanRequired = 1;
			}
			if (typeof next.baseDamage !== "number") {
				next.baseDamage = player.storage.Gungnell_yzs[0];
			}
			next.addCount = false;
			if (player.storage.Gungnell_yzs[1] > 0 && next.baseDamage > 0) {
				game.broadcastAll((player) => {
					player.$skill("神枪「冈戈尼尔」", "legend", "fire");
					game.delay(2);
					var imagePath = lib.assetURL + "/extension/一中杀/image/Gungnell_yzs.png";
					var duration = 1500;

					var img = document.createElement("img");
					img.src = imagePath;

					// 设置图片样式 - 竖向图片居中显示
					img.style.position = "fixed";
					img.style.left = "50%";
					img.style.top = "0";
					img.style.transform = "translateX(-50%)";
					img.style.width = "auto";
					img.style.height = "100%";
					img.style.maxWidth = "none";
					img.style.zIndex = "0";
					img.style.opacity = "0"; // 初始透明度设为0
					img.style.pointerEvents = "none";

					// 设置过渡效果 - 同时作用于opacity属性
					img.style.transition = "opacity 1s ease-out";

					// 添加到DOM
					document.body.appendChild(img);

					// 使用requestAnimationFrame确保过渡生效
					requestAnimationFrame(function () {
						// 触发透明度渐入效果
						img.style.opacity = "0.7";
					});

					// 延迟后开始渐出
					setTimeout(function () {
						img.style.opacity = "0";
						setTimeout(function () {
							if (img.parentNode) {
								img.parentNode.removeChild(img);
							}
						}, 1000); // 等待1秒过渡完成后再移除
					}, duration);

				}, player);
			}
			await next;
			let result = await player.chooseButton([
				"选择一项数值，令之+1",
				[
					[
						["damage", "伤害值(" + player.storage.Gungnell_yzs[0] + ")"],
						["shan", "响应数(" + player.storage.Gungnell_yzs[1] + ")"],
					],
					"textbutton",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.forResult();
			if (!result.bool) return
			if (result.links[0] == "damage") {
				player.storage.Gungnell_yzs[0]++;
			} else player.storage.Gungnell_yzs[1]++;
			player.markSkill("Gungnell_yzs");
		},
	},
	"VampireKiss_yzs": {
		nobracket: true,
		locked: true,
		enable: "phaseUse",
		filter: function (event, player) {
			if (player.countMark("Fuka_yzs") < 1) return false;
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false
				return player.countCards("h") > target.countCards("h");
			}))
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return player.countCards("h") > target.countCards("h");
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			let results = await player.yzs_throw(5).forResult();
			if (results.bool && player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs")
			const target = event.target;
			await player.swapHandcards(target);
			const bool = await player
				.chooseBool(`是否吸血？（其失去1点体力，然后你恢复1点体力）`)
				.set("ai", () => {
					return _status.event.bool;
				})
				.set(
					"bool",
					(function () {
						const player = get.event().player;
						const target = get.event().target
						return get.attitude(player, target) <= 0;
					})()
				)
				.set("target",target)
				.forResult();
			if (bool.bool) {
				player.line(target, "red");
				await target.loseHp();
				await player.recover();
			}
		},
		ai: {
			order: 10,
			result: {
				target(player2, target) {
					if (!player2.countCards("h", function (card) {
						return get.value(card) >= 8;
					}) && player2.countCards("h") - target.countCards("h") <= 1) {
						if (target.hp == 1 || player2.countCards("h", function (card) {
							return get.value(card) < 0;
						})) {
							return get.damageEffect(target, player2, target);
						}
					}
					return 0;
				},
			},
		},
	},
	//嗔嘘
	"angryXU_yzs": {
		locked: true,
		mod: {
			targetEnabled(card, player, target, now) {
				if (card.name == "guohe") {
					return false;
				}
			},
			cardname(card, player) {
				if (card.name == "sha") {
					return "spear_yzs";
				}
			},
		},
		enable: "chooseToUse",
		hiddenCard: function (player, name) {
			if (!player.countCards("h")) return
			return (name == 'guohe')
		},
		filterCard(card) {
			return get.color(card) == "black";
		},
		position: "h",
		viewAs: {
			name: "guohe",
		},
		viewAsFilter(player) {
			if (!player.countCards("h", { color: "black" })) {
				return false;
			}
		},
		prompt: "将一张黑色手牌当过河拆桥使用",
		check(card) {
			return 4 - get.value(card);
		},
		ai: {
			aiOrder(player, card, num) {
				if (get.color(card, player) == "black") {
					if (player.hasCard("h", { name: "spear_yzs" })) return num + 10;
				}
				if (get.name(card, player) == "spear_yzs") {
					if (player.hasCard("h", { color: "black" })) return num / 10;
				}
			},
			wuxie: (target, card, player, viewer, status) => {
				if (
					!target.countCards("hej") ||
					status * get.attitude(viewer, player._trueMe || player) > 0 ||
					(target.hp > 2 &&
						!target.hasCard(i => {
							let val = get.value(i, target),
								subtypes = get.subtypes(i);
							if (val < 8 && target.hp < 2 && !subtypes.includes("equip2") && !subtypes.includes("equip5")) {
								return false;
							}
							return val > 3 + Math.min(5, target.hp);
						}, "e") &&
						target.countCards("h") * _status.event.getRand("guohe_wuxie") > 1.57)
				) {
					return 0;
				}
			},
			basic: {
				order: 9,
				useful: (card, i) => 10 / (3 + i),
				value: (card, player) => {
					let max = 0;
					game.countPlayer(cur => {
						max = Math.max(max, lib.card.guohe.ai.result.target(player, cur) * get.attitude(player, cur));
					});
					if (max <= 0) {
						return 5;
					}
					return 0.42 * max;
				},
			},
			result: {
				target(player, target) {
					const att = get.attitude(player, target);
					const hs = target.getDiscardableCards(player, "h");
					const es = target.getDiscardableCards(player, "e");
					const js = target.getDiscardableCards(player, "j");
					if (!hs.length && !es.length && !js.length) {
						return 0;
					}
					if (att > 0) {
						if (
							js.some(card => {
								const cardj = card.viewAs ? { name: card.viewAs } : card;
								if (cardj.name === "xumou_jsrg") {
									return false;
								}
								return get.effect(target, cardj, target, player) < 0;
							})
						) {
							return 3;
						}
						if (target.isDamaged() && es.some(card => card.name === "baiyin") && get.recoverEffect(target, player, player) > 0) {
							if (target.hp === 1 && !target.hujia) {
								return 1.6;
							}
						}
						if (
							es.some(card => {
								return get.value(card, target) < 0;
							})
						) {
							return 1;
						}
						return -1.5;
					} else {
						const noh = hs.length === 0 || target.hasSkillTag("noh");
						const noe = es.length === 0 || target.hasSkillTag("noe");
						const noe2 =
							noe ||
							!es.some(card => {
								return get.value(card, target) > 0;
							});
						const noj =
							js.length === 0 ||
							!js.some(card => {
								const cardj = card.viewAs ? { name: card.viewAs } : card;
								if (cardj.name === "xumou_jsrg") {
									return true;
								}
								return get.effect(target, cardj, target, player) < 0;
							});
						if (noh && noe2 && noj) {
							return 1.5;
						}
						return -1.5;
					}
				},
			},
			tag: {
				loseCard: 1,
				discard: 1,
			},
		},
	},
	"sheshen_yzs": {
		logTarget: "player",
		trigger: {
			global: "damageBegin4",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (event.player.hasSkill("hidden_yzs")) return false;
			if (event.source == player) return false;
			return true;
		},
		prompt2(event, player) {
			const str = event.source ? get.translation(event.source) + `对你造成的` + (event.num + 1) + `点伤害` : (event.num + 1) + `点无来源伤害`
			return `无效 ` + get.translation(event.player) + ` 受到的` + event.num + `点伤害，然后受到 ` + str;
		},
		check(event, player) {
			if (player.storage.undyinghero_yzs_awaken) return get.attitude(player, event.player) > 0;
			if (player.hasSkill("sheshen_yzs_effect")) {
				return get.attitude(player, event.player) > 2 && player.hp > 2;
			}
			return get.attitude(player, event.player) > 1;
		},
		async content(event, trigger, player) {
			const num = trigger.num + 1;
			trigger.cancel();
			if (!trigger.source) await player.damage("nosource", num)
			else {
				await player.damage(trigger.source, num);
			}
			await player.addSkill("sheshen_yzs_effect")
		},
		subSkill: {
			effect: {
				charlotte: true,
				locked: true,
				forced: true,
				trigger: { global: "phaseEnd" },
				async content(event, trigger, player) {
					await player.recover();
					await player.removeSkill("sheshen_yzs_effect")
				}
			}
		}
	},
	"undyinghero_yzs": {
		nobracket: true,
		group: ["undyinghero_yzs_removeBGM", "undyinghero_yzs_draw", "undyinghero_yzs_dying", "undyinghero_yzs_adddamage", "undyinghero_yzs_spear"],
		locked: true,
		forced: true,
		popup: false,
		mark: true,
		marktext: "决心",
		markimage: 'extension/一中杀/image/undyinghero_yzs.png',
		intro: {
			name: "决心",
			content: function (storage, player) { return "当前决心数量：" + player.countMark("undyinghero_yzs") + "/9" },
		},
		init: function (player) {
			if (!player.storage.undyinghero_yzs_awaken) {
				player.storage.undyinghero_yzs_awaken = false;
				player.markSkill("undyinghero_yzs_awaken");
			}
		},
		trigger: {
			player: "damageEnd",
		},
		filter(event, player) {
			return event.num > 0 && player.countMark("undyinghero_yzs") < 9;
		},
		async content(event, trigger, player) {
			const num = Math.min(trigger.num, 9 - player.countMark("undyinghero_yzs"))
			if (player.countMark("undyinghero_yzs") < 9) player.addMark("undyinghero_yzs", num);
		},
		subSkill: {
			removeBGM: {
				charlotte: true,
				locked: true,
				forced: true,
				popup: false,
				forceDie: true,
				forceOut: true,
				popup: false,
				trigger: {
					player: "die"
				},
				filter(event, player) {
					return _status.tempMusic ==`ext:一中杀/audio/Battle Against A True Hero.mp3`
				},
				content() {
					game.broadcastAll(() => {
						if (_status.tempMusic == `ext:一中杀/audio/Battle Against A True Hero.mp3`) delete _status.tempMusic
					});
				}
			},
			draw: {
				trigger: {
					player: "phaseDrawBegin",
				},
				locked: true,
				forced: true,
				filter: function (event, player) {
					return player.countMark("undyinghero_yzs");
				},
				content: function () {
					trigger.num += Math.ceil(player.countMark("undyinghero_yzs") / 2);
				},
			},
			dying: {
				unique: true,
				locked: true,
				forced: true,
				trigger: {
					player: "dying",
				},
				filter: function (event, player) {
					return player.countMark("undyinghero_yzs") > 8 && !player.storage.undyinghero_yzs_awaken;
				},
				async content(event, trigger, player) {
					await player.useSkill("undyinghero_yzs_awaken");
				},
			},
			adddamage: {
				trigger: {
					player: "damageBegin3",
				},
				filter(event, player) {
					return event.num != 0 && player.storage.undyinghero_yzs_awaken;
				},
				charlotte: true,
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					trigger.num++;
				},
				ai: {
					damageBonus: true,
				},
			},
			spear: {
				forced: true,
				locked: true,
				mod: {
					cardname(card, player) {
						if (card.name == "shan" && player.storage.undyinghero_yzs_awaken) {
							return "spear_yzs";
						}
					},
				},
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.storage.undyinghero_yzs_awaken;
				},
				async content(event, trigger, player) {
					await player.loseMaxHp();
				},
				"_priority": 0,
			},
		}
	},
	"undyinghero_yzs_awaken": {
		nobracket: true,
		locked: true,
		popup: false,
		unique: true,
		juexingji: true,
		skillAnimation: "epic",
		animationColor: "thunder",
		async content(event, trigger, player) {
			game.broadcastAll(() => {
				ui.backgroundMusic.pause();
				// 创建白色遮罩层
				let whiteOverlay = document.createElement('div');
				whiteOverlay.id = 'screen-white-overlay';

				// 设置初始样式
				whiteOverlay.style.cssText = `
								position: fixed;
								top: 0;
								left: 0;
								width: 100%;
								height: 100%;
								background: rgba(255, 255, 255, 0);
								z-index: 999999;
								pointer-events: none;
								transition: background 2s ease-in-out;
							`;

				// 添加到页面
				document.body.appendChild(whiteOverlay);

				// 开始变白
				setTimeout(() => {
					whiteOverlay.style.background = 'rgba(255, 255, 255, 1)';

					// 一段时间后恢复
					setTimeout(() => {
						whiteOverlay.style.background = 'rgba(255, 255, 255, 0)';
						_status.tempMusic = `ext:一中杀/audio/Battle Against A True Hero.mp3`;
						game.playBackgroundMusic();
						// 完全透明后移除元素
						setTimeout(() => {
							if (whiteOverlay.parentNode) {
								whiteOverlay.parentNode.removeChild(whiteOverlay);
							}
						}, 2000);
					}, 3000); // 保持白色3秒
				}, 100);
			});
			await new Promise(r => setTimeout(r, 4800))
			player.awakenSkill(event.name);
			player.unmarkSkill("undyinghero_yzs")
			player.storage.undyinghero_yzs_awaken = true;
			player.markSkill("undyinghero_yzs_awaken");
			await player.recover(player.maxHp - player.hp);
			await player.changeHujia(9);
		},
		sub: true,
		sourceSkill: "undyinghero_yzs",
		"_priority": 0,
	},
	//暴怒刀皇
	"brokenheart_yzs": {
		audio: "ext:一中杀/audio/skill:2",
		"_priority": 2,
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name =="brokenheart_yzs"))player.yzs_setCountDown({
				num: 4,
				repeatNum: 1,
				command: {
					async todo(player) {
						const bool = await player
							.chooseBool(`是否失去1点体力？<br>（否则你失去【残心】）`)
							.set("ai", () => {
								return _status.event.bool;
							})
							.set(
								"bool",
								(function () {
									const player = get.event().player;
									if (player.hp > player.maxHp / 2) return true;
									return false;
								})()
							)
							.forResult();
						if (bool.bool) {
							await player.loseHp();
							return;
						}
						await player.yzs_clearCountDown(player.yzs_getCountDown(i => i.name =="brokenheart_yzs"));
						player.removeSkill("brokenheart_yzs");
					},
					list: [player],
				},
				value(item, player) {
					return 3;
				},
				name: "brokenheart_yzs",
				prompt: `失去【残心】或失去1点体力并令本吟唱变为1`,
				skill: "brokenheart_yzs"
			});
		},
		trigger: {
			player: "phaseDiscardBegin",
		},
		filter: function (event, player) {
			return player.countCards("h") > 1;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseToDiscard(
					"残心：弃置任意张基本牌，然后跳过弃牌阶段并摸等量张牌",
					(card, player) => {
						return get.type(card) == "basic";
					},
					[1, Infinity]
				)
				.set("chooseonly", true)
				.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			const num = event.cards.length;
			await player.draw(num);
			await trigger.cancel();
		},
	},
	"yotouFeng_yzs": {
		nobracket: true,
		marktext: "怨",
		intro: {
			name: "妖刀·封",
			content: function (storage, player) { if (player.countMark("yotouFeng_yzs")) return "回合开始时你需弃置" + player.countMark("yotouFeng_yzs") + "张手牌，不足的部分失去体力代替！" },
		},
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:1",
		group: ["yotouFeng_yzs_yuan"],
		trigger: {
			source: "damageBegin3"
		},
		filter: function (event, player) {
			return event.player.countCards('h') < 6 && event.num>0;
		},
		async content(event, trigger, player) {
			const num = Math.min(6 - trigger.player.countCards('h'), trigger.num);
			await trigger.player.draw(num);
			trigger.player.addMark("yotouFeng_yzs", num);
			trigger.num -= num;
		},
		subSkill: {
			yuan: {
				locked: true,
				forced: true,
				priority: -54,
				trigger: {
					global: "phaseBegin"
				},
				filter: function (event, player) {
					return event.player.countMark("yotouFeng_yzs");
				},
				async content(event, trigger, player) {
					let num = trigger.player.countMark("yotouFeng_yzs");
					trigger.player.clearMark("yotouFeng_yzs");
					const result = await trigger.player
						.chooseToDiscard(`妖刀·封：弃置${num}张手牌，不足的部分失去体力代替`, "h",[1,num])
						.set("ai", card => {
							const player = get.player();
							if (get.effect(player, { name: "losehp" }, player, player) > 0) {
								return 0;
							}
							return 5 - get.value(card);
						})
						.forResult();
					if (!result.bool) {
						await trigger.player.loseHp(num);
					} else {
						if (num - result.cards.length > 0) await trigger.player.loseHp(num - result.cards.length);
					}
				},
			}
		}
	},
	"yotouXi_yzs": {
		nobracket: true,
		group: ["yotouXi_yzs_renew", "yotouXi_yzs_discard", "yotouXi_yzs_adddamage", "yotouXi_yzs_blocker", "yotouXi_yzs_record"],
		mod: {
			canBeGained(card, source, player) {
				if (source == player) return;
				if (player.getEquips("youtou_yzs").includes(card)) {
					return false;
				}
			},
			canBeDiscarded(card, source, player) {
				if (source == player) return;
				if (player.getEquips("youtou_yzs").includes(card)) {
					return false;
				}
			},
			canBeReplaced(card, player) {
				if (player.getVEquips("youtou_yzs").includes(card)) {
					return false;
				}
			},
			cardDiscardable(card, player) {
				if (player.getEquips("youtou_yzs").includes(card)) {
					return false;
				}
			},
		},
		mark:true,
		marktext: "袭",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("yotouXi_yzs_discard");
				if (cards.length) dialog.addAuto(cards);
				if (typeof player.storage.yotouXi_yzs_record == "number") dialog.addText(`上一出牌阶段的开始时手牌数：${player.storage.yotouXi_yzs_record}`)
				else dialog.addText(`当前未执行过完整的出牌阶段`)
				if (player.countMark("yotouXi_yzs_adddamage")) {
					dialog.addText(`本自轮次内下张【杀】伤害+${player.countMark("yotouXi_yzs_adddamage")}`)
				}
			},
		},
		subSkill: {
			renew: {
				init: function (player, skill) {
					if (!player.storage.yotou_temp) {
						player.storage.yotou_temp = {
							range: 0,
							usable: 0,
							adddamage: 0,
							shanreq: 0,
							sing: 0,
						}
						player.markSkill("yotou_temp");
					}
					if (!player.storage.yotou_ever) {
						player.storage.yotou_ever = {
							range: 0,
							usable: 0,
							adddamage: 0,
							shanreq: 0,
							sing: 0,
						}
						player.markSkill("yotou_ever");
					}
					if (!player.storage.yotouXi_yzs_used) {
						player.storage.yotouXi_yzs_used = 0;
						player.markSkill("yotouXi_yzs_used");
					}
					if (!player.storage.yotouXi_yzs) {
						player.storage.yotouXi_yzs = 1;
						player.markSkill("yotouXi_yzs");
					}
					if (!player.storage.yotouXi_yzs_gain) {
						player.storage.yotouXi_yzs_gain = 0;
						player.markSkill("yotouXi_yzs_gain");
					}
				},
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, trigger, player) {
					if (trigger.skill) return false;
					return true;
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				content() {
					player.storage.yotou_temp = {
						range: 0,
						usable: 0,
						adddamage: 0,
						shanreq: 0,
						sing: 0,
					}
					player.markSkill("yotou_temp");
					player.storage.yotouXi_yzs_used = 0;
					player.markSkill("yotouXi_yzs_used");
					player.removeTip("yotouXi_yzs_used")
					player.storage.yotouXi_yzs = 1;
					player.markSkill("yotouXi_yzs");
					player.clearMark("yotouXi_yzs_adddamage",false)
				}
			},
			discard: {
				locked: true,
				forced: true,
				priority: -2,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.getExpansions("yotouXi_yzs_discard") && player.getExpansions("yotouXi_yzs_discard").length;
				},
				async content(event, trigger, player) {
					const cards = player.getExpansions("yotouXi_yzs_discard");
					if (cards.length <= player.storage.yotouXi_yzs_gain) {
						await player.gain(cards, "giveAuto", "log");
						return;
					}
					let next = await player.chooseButton(["妖刀·袭", "获得" + player.storage.yotouXi_yzs_gain + "张所弃牌", player.getExpansions("yotouXi_yzs_discard")], player.storage.yotouXi_yzs_gain, true)
						.set("ai", button => get.value(button.link))
						.forResult()
					if (next && next.bool) {
						await player.gain(next.links, "giveAuto", "log")
					}
					player.loseToDiscardpile(player.getExpansions("yotouXi_yzs_discard"))
					player.storage.yotouXi_yzs_gain = 0;
					player.markSkill("yotouXi_yzs_gain");
				}
			},
			adddamage: {
				trigger: {
					player: "useCard1",
				},
				firstDo: true,
				forced: true,
				charlotte: true,
				popup: false,
				filter(event, player) {
					return event.card.name == "sha" && player.countMark("yotouXi_yzs_adddamage") > 0;
				},
				async content(event, trigger, player) {
					trigger.baseDamage += player.countMark("yotouXi_yzs_adddamage")
					player.clearMark("yotouXi_yzs_adddamage", false)
				},
			},
			blocker: {
				trigger: {
					player: ["loseBefore", "disableEquipBefore"],
				},
				locked: true,
				popup: false,
				forced: true,
				filter(event, player) {
					if (event.name == "disableEquip") {
						return event.slots.includes("equip1");
					}
					var cards = player.getEquips("youtou_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("youtou_yzs"));
					} else {
						while (trigger.slots.includes("equip1")) {
							trigger.slots.remove("equip1");
						}
					}
				},
				sub: true,
				sourceSkill: "yotouXi_yzs",
				"_priority": 0,
			},
			record: {
				charlotte: true,
				forced: true,
				popup: false,
				trigger: {
					player: ["phaseUseBegin", "phaseUseAfter"],
				},
				async content(event, trigger, player) {
					if (!trigger.yotouXi_yzs_record || typeof trigger.yotouXi_yzs_record!="number") {
						trigger.yotouXi_yzs_record = player.countCards("h");
						return;
					}
					player.storage.yotouXi_yzs_record = trigger.yotouXi_yzs_record;
					player.markSkill("yotouXi_yzs_record");
				},
			}
		},
		audio: "ext:一中杀/audio/skill:3",
		trigger: {
			player: ["useCard"],
		},
		locked: true,
		nobracket: true,
		forced: true,
		filter(event, player) {
			player.storage.yotouXi_yzs_used++;
			player.markSkill("yotouXi_yzs_used");
			player.addTip("yotouXi_yzs_used", "妖刀·袭 " + player.storage.yotouXi_yzs_used % 3+"/3",false)
			return player.storage.yotouXi_yzs_used % 3 == 0;
		},
		async content(event, trigger, player) {
			if (player.storage.yotouXi_yzs == 1 || player.storage.yotouXi_yzs == 5) {
				player.storage.yotouXi_yzs++;
				player.markSkill("yotouXi_yzs");
				let result = await player.chooseCard("he", true, Math.min(2, player.countCards("he")), "妖刀·封", "弃置2张牌，你下回合开始时可获得其中一张")
					.set("ai", (card) => {
						const player = get.player();
						return get.value(card,player)
					})
					.forResult()
				if (result && result.bool) {
					player.storage.yotouXi_yzs_gain++;
					player.markSkill("yotouXi_yzs_gain");
					let next = player.addToExpansion(result.cards, player, "giveAuto")
					next.gaintag.add("yotouXi_yzs_discard")
					await next;
				}
				await player.draw(3);
				return;
			}
			if (player.storage.yotouXi_yzs == 2 || player.storage.yotouXi_yzs == 6) {
				player.storage.yotouXi_yzs++;
				player.markSkill("yotouXi_yzs");
				if (player.getEquip("yotou_yzs")) {
					const num = Math.min(12, player.storage.yotouXi_yzs_record)
					if (player.countCards("h") < num) await player.draw(num - player.countCards("h"));
					if (player.hasSkill("brokenheart_yzs")) player.addMark("brokenheart_yzs", player.storage.yotou_temp.sing + player.storage.yotou_ever.sing, false)
				}
				else {
					var card = game.createCard2("yotou_yzs", "spade", 13);
					await player.$gain2(card, false);
					await player.equip(card);
					game.delayx();
				}
				let choicenum1 = 0;
				if (2 + player.storage.yotou_temp.range + player.storage.yotou_ever.range < 5) choicenum1++;
				if (1 + player.storage.yotou_temp.usable + player.storage.yotou_ever.usable < 5) choicenum1++;
				if (player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage < 5) choicenum1++;
				if (1 + player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq < 5) choicenum1++;
				if (player.storage.yotou_temp.sing + player.storage.yotou_ever.sing < 5) choicenum1++;
				choicenum1 = Math.min(1, choicenum1);
				if (choicenum1) {
					let choice1 = await player.chooseButton([
						"令【妖刀·心渡】中1项数值永久+1",
						[
							[
								["range", "攻击范围"],
								["usable", "出【杀】数"],
								["adddamage", "加伤"],
								["shanreq", "响应数"],
								["sing", "加吟唱"],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							if (button.link == "range") return 2 + player.storage.yotou_temp.range + player.storage.yotou_ever.range < 5;
							if (button.link == "usable") return 1 + player.storage.yotou_temp.usable + player.storage.yotou_ever.usable < 5;
							if (button.link == "adddamage") return player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage < 5;
							if (button.link == "shanreq") return 1 + player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq < 5;
							if (button.link == "sing") return player.storage.yotou_temp.sing + player.storage.yotou_ever.sing < 5;
							return true;
						})
						.set("ai", (button) => {
							let value = 0;
							const player = get.player();
							if (button.link == "range") value += 0.5;
							if (button.link == "usable") value += 2;
							if (button.link == "adddamage") {
								value += 3;
								if (player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage > 2) value -= 2;
							}
							if (button.link == "shanreq") {
								value += 2.1;
								if (player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq > 2) value -= 2;
							}
							if (button.link == "sing") value += 1;
							return value;
						})
						.forResult();
					if (!choice1.bool) return
					if (choice1.links[0] == "range") player.storage.yotou_ever.range++;
					if (choice1.links[0] == "usable") player.storage.yotou_ever.usable++;
					if (choice1.links[0] == "adddamage") player.storage.yotou_ever.adddamage++;
					if (choice1.links[0] == "shanreq") player.storage.yotou_ever.shanreq++;
					if (choice1.links[0] == "sing") player.storage.yotou_ever.sing++;
					player.markSkill("yotou_ever");
				}
				return;
			}
			if (player.storage.yotouXi_yzs == 3 || player.storage.yotouXi_yzs == 7) {
				player.storage.yotouXi_yzs++;
				player.markSkill("yotouXi_yzs");
				if (player.countCards("hej") == 0) return;
				let result = await player.chooseCard("h", true, [1, 4], "妖刀·封", "弃置1~4张牌，本自轮次内你使用下张【杀】伤害+等量-1")
					.forResult()
				if (result && result.bool) {
					await player.discard(result.cards);
				}
				if (result.cards.length > 1) player.addMark("yotouXi_yzs_adddamage", result.cards.length - 1, false)
				return;
			}
			if (player.storage.yotouXi_yzs == 4 || player.storage.yotouXi_yzs == 8) {
				player.storage.yotouXi_yzs++;
				player.markSkill("yotouXi_yzs");
				await player.recover();
				let choicenum2 = 0;
				if (2 + player.storage.yotou_temp.range + player.storage.yotou_ever.range < 5) choicenum2++;
				if (1 + player.storage.yotou_temp.usable + player.storage.yotou_ever.usable < 5) choicenum2++;
				if (player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage < 5) choicenum2++;
				if (1 + player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq < 5) choicenum2++;
				if (player.storage.yotou_temp.sing + player.storage.yotou_ever.sing < 5) choicenum2++;
				choicenum2 = Math.min(2, choicenum2);
				if (choicenum2) {
					let choice2 = await player.chooseButton([
						"令【妖刀·心渡】中2项不同数值本自轮次内+1",
						[
							[
								["range", "攻击范围"],
								["usable", "出【杀】数"],
								["adddamage", "加伤"],
								["shanreq", "响应数"],
								["sing", "加吟唱"],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", choicenum2)
						.set("filterButton", function (button) {
							let player = _status.event.player
							if (button.link == "range") return 2 + player.storage.yotou_temp.range + player.storage.yotou_ever.range < 5;
							if (button.link == "usable") return 1 + player.storage.yotou_temp.usable + player.storage.yotou_ever.usable < 5;
							if (button.link == "adddamage") return player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage < 5;
							if (button.link == "shanreq") return 1 + player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq < 5;
							if (button.link == "sing") return player.storage.yotou_temp.sing + player.storage.yotou_ever.sing < 5;
							return true;
						})
						.set("ai", (button) => {
							let value = 0;
							const player = get.player();
							if (button.link == "range") value += 0.5;
							if (button.link == "usable") value += 2;
							if (button.link == "adddamage") {
								value += 3;
								if (player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage > 2) value -= 2;
							}
							if (button.link == "shanreq") {
								value += 2.1;
								if (player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq > 2) value -= 2;
							}
							if (button.link == "sing") value += 1;
							return value;
						})
						.forResult();
					if (!choice2.bool) return
					for (let i = 0; i < 2; i++) {
						if (choice2.links[i] == "range") player.storage.yotou_temp.range++;
						if (choice2.links[i] == "usable") player.storage.yotou_temp.usable++;
						if (choice2.links[i] == "adddamage") player.storage.yotou_temp.adddamage++;
						if (choice2.links[i] == "shanreq") player.storage.yotou_temp.shanreq++;
						if (choice2.links[i] == "sing") player.storage.yotou_temp.sing++;
					}
					player.markSkill("yotou_temp");
				}
				return;
			}
		}
	},
	"yotou_yzs_skill": {
		nobracket: true,
		group: ["yotou_yzs_skill_shanreq", "yotou_yzs_skill_wusheng", "yotou_yzs_skill_lose"],
		subSkill: {
			lose: {
				audio: "baiyin_skill",
				forced: true,
				charlotte: true,
				equipSkill: true,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter: (event, player, name, card) => {
					if (!card || card.name != "yotou_yzs") {
						return false;
					}
					return  true;
				},
				getIndex(event, player) {
					const evt = event.getl(player);
					const lostCards = [];
					evt.es.forEach(card => {
						const VEquip = evt.vcard_map.get(card);
						if (VEquip?.name === "yotou_yzs") {
							lostCards.add(VEquip);
						}
					});
					return lostCards;
				},
				async content(event, trigger, player) {
					if (typeof player.storage.yotouXi_yzs_record == "number") {
						const num = player.storage.yotouXi_yzs_record;
						if (num > 12) num = 12;
						if (player.countCards("h") < num) await player.draw(num - player.countCards("h"));
					}
					let sing = player.storage?.yotou_temp?.sing + player.storage?.yotou_ever?.sing
					await player.yzs_updateCountDown(player.yzs_getCountDown(), -sing);
				},
				sourceSkill: "yotou_yzs_skill",
				"_priority": -26,
			},
			shanreq: {
				trigger: {
					player: "useCardToPlayered",
				},
				forced: true,
				sourceSkill: "yotou_yzs_skill",
				filter(event, player) {
					return event.card.name == "sha" && !event.getParent().directHit.includes(event.target);
				},
				logTarget: "target",
				async content(event, trigger, player) {
					const id = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[id]) {
						map[id] = {};
					}
					if (typeof map[id].shanRequired == "number") {
						map[id].shanRequired += player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq;
					} else {
						map[id].shanRequired = 1 + player.storage.yotou_temp.shanreq + player.storage.yotou_ever.shanreq;
					}
				},
			},
			wusheng: {
				enable: ["chooseToRespond", "chooseToUse"],
				filterCard(card, player) {
					if (get.zhu(player, "shouyue")) {
						return true;
					}
					return get.subtype(card) === "equip1";
				},
				position: "h",
				viewAs: {
					name: "sha",
				},
				viewAsFilter(player) {
					if (get.zhu(player, "shouyue")) {
						if (!player.countCards("h")) {
							return false;
						}
					} else {
						if (!player.countCards("h", { subtype: "equip1" })) {
							return false;
						}
					}
				},
				prompt: "将一张武器牌当普通【杀】使用或打出",
				check(card) {
					const val = get.value(card);
					if (_status.event.name == "chooseToRespond") {
						return 1 / Math.max(0.1, val);
					}
					return 5 - val;
				},
			}
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + 1 + player.storage.yotou_temp.usable + player.storage.yotou_ever.usable;
			},
			attackRange(from, distance) {
				return distance + (from.storage.yotou_temp.range + from.storage.yotou_ever.range);
			},
		},
		equipSkill: true,
		locked: true,
		popup: false,
		forced: true,
		trigger: {
			source: "damageBegin1",
		},
		filter(event) {
			if (event.parent.name == "_lianhuan" || event.parent.name == "_lianhuan2") {
				return false;
			}
			if (event.card && event.card.name == "sha") {
				return true;
			}
			return false;
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.num += player.storage.yotou_temp.adddamage + player.storage.yotou_ever.adddamage;
		},
	},
	//全然不信
	"brokenweapon_yzs": {
		nobracket: true,
		priority: 4,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && player.hasEquipableSlot(1) && !player.getEquips("XZgun_yzs").length && player.hasEquipableSlot(2) && !player.getEquips("XZblade_yzs").length;
		},
		async content(event, trigger, player) {
			game.broadcastAll(() => {
				_status.tempMusic = `ext:一中杀/audio/MEGALOVANIA.mp3`;
				game.playBackgroundMusic();
			});
			var card = game.createCard2("XZgun_yzs");
			player.$gain2(card, false);
			await player.equip(card);
			var card = game.createCard2("XZblade_yzs");
			player.$gain2(card, false);
			await player.equip(card);
			game.delayx();
		},
		mod: {
			canBeGained(card, source, player) {
				if (player.getEquips("XZgun_yzs").includes(card) || player.getEquips("XZblade_yzs").includes(card)) {
					return false;
				}
			},
			canBeDiscarded(card, source, player) {
				if (player.getEquips("XZgun_yzs").includes(card) || player.getEquips("XZblade_yzs").includes(card)) {
					return false;
				}
			},
			canBeReplaced(card, player) {
				if (player.getVEquips("XZgun_yzs").includes(card) || player.getVEquips("XZblade_yzs").includes(card)) {
					return false;
				}
			},
			cardDiscardable(card, player) {
				if (player.getEquips("XZgun_yzs").includes(card) || player.getEquips("XZblade_yzs").includes(card)) {
					return false;
				}
			},
			cardEnabled2(card, player) {
				if (player.getEquips("XZgun_yzs").includes(card) || player.getEquips("XZblade_yzs").includes(card)) {
					return false;
				}
			},
		},
		group: ["brokenweapon_yzs_blocker1", "brokenweapon_yzs_blocker2"],
		subSkill: {
			blocker1: {
				trigger: {
					player: ["loseBefore", "disableEquipBefore"],
				},
				forced: true,
				priority: 3,
				filter(event, player) {
					if (event.name == "disableEquip") {
						return event.slots.includes("equip1");
					}
					var cards = player.getEquips("XZgun_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("XZgun_yzs"));
					} else {
						while (trigger.slots.includes("equip1")) {
							trigger.slots.remove("equip1");
						}
					}
				},
				sub: true,
				sourceSkill: "brokenweapon_yzs",
				"_priority": 0,
			},
			blocker2: {
				trigger: {
					player: ["loseBefore", "disableEquipBefore"],
				},
				forced: true,
				priority: 2,
				filter(event, player) {
					if (event.name == "disableEquip") {
						return event.slots.includes("equip2");
					}
					var cards = player.getEquips("XZblade_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("XZblade_yzs"));
					} else {
						while (trigger.slots.includes("equip2")) {
							trigger.slots.remove("equip2");
						}
					}
				},
				sub: true,
				sourceSkill: "brokenweapon_yzs",
				"_priority": 0,
			}
		},
		"_priority": 0,
	},
	"XZgun_yzs_skill": {
		equipSkill: true,
		firstDo: true,
		group: "XZgun_yzs_skill_damage",
		popup: false,
		subSkill: {
			damage: {
				equipSkill: true,
				trigger: {
					source: "damageBegin1",
				},
				filter(event) {
					if (event.parent.name == "_lianhuan" || event.parent.name == "_lianhuan2") {
						return false;
					}
					if (event.card && event.card.name == "sha") {
						return true;
					}
					return false;
				},
				forced: true,
				content() {
					trigger.num--;
				},
			}
		},
		trigger: {
			player: "useCard1",
		},
		priority:3,
		locked: true,
		forced: true,
		filter(event, player) {
			return event.card.name == "sha"
		},
		async content(event, trigger, player) {
			if (player.countCards("h")) await player.chooseToDiscard(`竭弹之枪`, `弃置一张手牌`, "h", true)
		},
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
		},
		"_priority": -25,
	},
	"XZblade_yzs_skill": {
		group: "XZblade_yzs_skill_discard",
		subSkill: {
			discard: {
				locked: true,
				equipSkill: true,
				priority: 3,
				forced: true,
				trigger: {
					player:"phaseBegin"
				},
				filter(event, player) {
					return player.countMark("XZblade_yzs_skill")
				},
				async content(event, trigger, player) {
					let num = player.countMark("XZblade_yzs_skill")
					player.clearMark("XZblade_yzs_skill", false)
					let result = await player.chooseToDiscard("h",`弃${num}张手牌，不足的部分失去体力代替`, false, [1, num]).forResult();
					if (!result.bool) {
						await player.loseHp(num);
						return;
					}
					let x = num - result.cards.length;
					if (x > 0) {
						await player.loseHp(x);
					}
				},
			},
		},
		"markimage2": 'extension/一中杀/image/card/XZblade_yzs.png',
		mark:true,
		intro: {
			content: "回合开始时需弃#张手牌，不足的部分失去体力代替",
		},
		equipSkill: true,
		locked: true,
		priority: 3,
		forced: true,
		trigger: {
			player: ["damageBegin4"]
		},
		filter(event, player) { return true  },
		async content(event, trigger, player) {
			await trigger.cancel();
			if (trigger.num <= 0) return;
			player.$damage()
			player.$damagepop(-2 * trigger.num,"water")
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/damage2.mp3");
			player.addMark("XZblade_yzs_skill",2*trigger.num,false)
		},
		"_priority": 0,
	},
	"Unbelieve_yzs": {
		group:"Unbelieve_yzs_draw",
		subSkill: {
			draw: {
				priority: -2,
				locked:true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					await player.draw(2)
				}
			}
		},
		locked: true,
		forced: true,
		priority: 3,
		trigger: {
			player: "phaseDrawBefore",
		},
		async content(event, trigger, player) {
			await trigger.cancel();
			player.discard(player.getCards("h"));
		},
		mod: {
			maxHandcardBase(player, num) {
				return 4;
			},
			canBeGained: function (card, source, player) {
				if (player.getCards('h').includes(card) && source != player) return false;
			},
			canBeDiscarded: function (card, source, player) {
				if (player.getCards('h').includes(card) && source != player) return false;
			},
		},
	},
	"judgeEyes_yzs": {
		nobracket: true,
		group: ["judgeEyes_yzs_sound", "judgeEyes_yzs_damage", "judgeEyes_yzs_draw", "judgeEyes_yzs_renew"],
		subSkill: {
			sound: {
				forced: true,
				persevereSkill: true,
				priority: 1212,
				trigger: {
					player: "useCard"
				},
				filter(event) {
					return event.card && (event.card.name == "sha") && event.targets.some(cur=>cur.hasSkill("judgeEyes_yzs_adddamage"));
				},
				async content(event, trigger, player) {
					var damageAudioInfo = "ext:一中杀/audio/skill/SSF_Nightmare_yzs_sound3.mp3";
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, damageAudioInfo);
				}
			},
			damage: {
				trigger: {
					source: "damageBegin1",
				},
				filter(event) {
					return event.card && (event.card.name == "sha") && event.player.hasSkill("judgeEyes_yzs_adddamage");
				},
				charlotte: true,
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					var damageAudioInfo = "ext:一中杀/audio/skill/SSF_Nightmare_yzs_sound3.mp3";
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, damageAudioInfo);
					trigger.num++;
				},
				ai: {
					damageBonus: true,
				},
				sub: true,
				sourceSkill: "judgeEyes_yzs",
				"_priority": 4,
			},
			draw: {
				locked: true,
				forced: true,
				priority: 3,
				filter(event, player) { return player.countMark("judgeEyes_yzs_used") },
				trigger: {
					player: "phaseDiscardAfter",
				},
				async content(event, trigger, player) {
					await player.draw(player.countMark("judgeEyes_yzs_used"));
				}
			},
			renew: {
				forced: true,
				firstDo: true,
				locked: true,
				popup: false,
				trigger: { player: "phaseBegin", },
				filter: function (event, trigger, player) {
					if (trigger.skill) return false;
					return true;
				},
				async content(event, trigger, player) {
					player.clearMark("judgeEyes_yzs_used", false)
				}
			}
		},
		marktext: "审判",
		intro: {
			name: "审判点数",
			"name2": "审判点数",
			content: "mark",
		},
		locked: true,
		forced: true,
		priority: 3,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		filter(event, player) {
			if (player.countMark("judgeEyes_yzs_used") > 3) return false;
			if (player.countCards("h")) return false;
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		async content(event, trigger, player) {
			player.addMark("judgeEyes_yzs_used", 1, false);
			await player.draw(6);
			if (game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs") && target != player)
			})) await player.useSkill("judge_yzs");
		},
		ai: {
			nokeep: true,
		}
	},
	"judge_yzs": {
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:1",
		async content(event, trigger, player) {
			let target = await player.chooseTarget("审判", "选择 1 名角色，展示其所有手牌。其获得其手牌黑色花色数+1点【审判点数】", true)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.set("ai", function (target) {
					var att = get.attitude(_status.event.player, target);
					return -(att+target.countCards("h")/2);
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			await target.targets[0].showHandcards(player, "发动了【审判】");
			let cardx = target.targets[0].getCards("h", card => get.color(card, player) == "black");
			let suits = [];
			for (let i = 0; i < cardx.length; i++) {
				if (!suits.includes(get.suit(cardx[i]))) suits.add(get.suit(cardx[i]))
			}
			target.targets[0].addMark("judgeEyes_yzs", suits.length + 1)
			if (target.targets[0].countMark("judgeEyes_yzs") > 7) {
				var damageAudioInfo = "ext:一中杀/audio/skill/judge_yzs.mp3";
				game.broadcastAll(function (damageAudioInfo) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo);
					}
				}, damageAudioInfo);
				target.targets[0].clearMark("judgeEyes_yzs");
				await target.targets[0].addTempSkill("judgeEyes_yzs_adddamage");
				target.targets[0].popup("危");
				game.log(target.targets[0], "被翔子审判了");
			}
		}
	},
	"judgeEyes_yzs_adddamage": {
		mark: true,
		marktext: "<span style=\"text-decoration: line-through;\">审判</span>",
		intro: {
			content: "你被翔子审判了！翔子的【杀】对你造成伤害+1",
		},
	},
	//夜神月
	"zhitui_yzs_global": {
		group: "zhitui_yzs_global_give",
		subSkill: {
			give: {
				prompt: "出牌阶段结束时，你分配1张手牌",
				trigger: {
					player: "phaseUseEnd",
				},
				filter(event, player) { return player.countCards("h"); },
				async cost(event, trigger, player) {
					let target = await player.chooseTarget("质推", "选择1名其他角色，给予其1张手牌（可不给）", false)
						.set("filterTarget", (card, player, target) => {
							if (target == player) return false;
							return !(target.hasSkill("hidden_yzs"));
						})
						.set("ai", (target2) => {
							const player2 = get.event().player;
							return get.attitude(player2, target2);
						})
						.forResult()
					if (!target.bool) {
						event.result = {
							bool: false,
							cost_data: false,
						};
						return;
					}
					event.result = {
						bool: true,
						cost_data: target.targets[0],
					};
				},
				async content(event, trigger, player) {
					const cards = (player.getCards("h"));
					const result = await player.chooseCard("h", [1, 1], function (card) {
						return true;
					})
						.set("prompt", "给予" + get.translation(event.cost_data) + "1张手牌")
						.set("ai", card => {
							let player = _status.event.player;
							let value = get.value(card);
							if (card.name == "du" || card.name == "DeathNote_yzs") return 20;
							return 8 - get.value(card);
						})
						.forResult();
					await player.give(result.cards, event.cost_data);
				}
			}
		},
		prompt: "你展示1名其他角色的手牌，然后弃置其中的【死亡笔记】或失去1点体力",
		enable: "phaseUse",
		usable: 1,
		filterTarget: function (card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false
			return player != target && target.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			if (player.hasSkill("kila_yzs")) {
				await event.target.showHandcards(event.target, "因【质推】而展示牌");
				const cards = (event.target.getCards("hej"));
				const result = await player
					.chooseButton(["弃置其中的1张牌或失去1点体力", cards], 1, false)
					.set("ai", button => {
						if (button.link.name == "DeathNote_yzs") return 10;
						return 0;
					})
					.forResult();
				if (!result.bool) {
					await player.loseHp();
					return
				}
				else {
					const card = result.links[0];
					await event.target.discard(card);
				}
			}
			else {
				await event.target.showHandcards(event.target, "因【质推】而展示牌");
				const cards = (event.target.getCards("h"));
				const result = await player
					.chooseButton(["弃置其中的【死亡笔记】或失去1点体力", cards], 1, false)
					.set("filterButton", button => {
						return button.link.name == "DeathNote_yzs";
					})
					.forResult();
				if (!result.bool) {
					await player.loseHp();
					return
				}
				else {
					const card = result.links[0];
					await event.target.discard(card, "notBySelf").set("discarder", player);
				}
			}
		},
		ai: {
			order: 10,
			result: {
				target(player2, target) {
					if (player2.hasSkill("kila_yzs")) return -2;
					if (target.hasCard({ name: "DeathNote_yzs" })) return -1;
					return 0;
				},
				player(player2, target) {
					if (player2.hasSkill("kila_yzs")) return 0;
					else if (!target.hasCard({ name: "DeathNote_yzs" })) return -2;
				},
			},
		},
	},
	"zhitui_yzs": {},
	"kila_yzs": {
		global: ["zhitui_yzs_global", "zhitui_yzs_global_give"],
		group: ["kila_yzs_gain", "kila_yzs_use"],
		subSkill: {
			gain: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				forced: true,
				trigger: {
					global: "roundStart",
				},
				filter: function (event, trigger, player) {
					if (trigger.skill) return false;
					return true;
				},
				async content(event, trigger, player) {
					const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
					const filter = card => ["DeathNote_yzs"].includes(card.name);
					const cardx = cards.filter(filter);
					if (cardx.length) {
						await game.cardsGotoSpecial(cardx);
					}
					for (const target of game.filterPlayer()) {
						const sishis = target.getCards("hej", filter);
						if (sishis.length) {
							target.$throw(sishis);
							await target.lose(sishis, ui.special);
						}
					}
					var card = game.createCard2("DeathNote_yzs", "spade", 13);
					await player.gain(card, "gain2");
					game.delayx();
					if (player.countCards("h") > 0) await player.chooseToDiscard("h", true);
				},
				priority: 1,
			},
			use: {
				audio: "ext:一中杀/audio/skill:3",
				locked: true,
				forced: true,
				trigger: {
					global: "roundStart",
				},
				priority: 114515,
				filter(event, player) {
					if (event.skill) return false;
					var targets = game.filterPlayer(current => current.countCards("h", { name: "DeathNote_yzs" }));
					if (!targets.length) return false;
					return true;
				},
				async content(event, trigger, player) {
					var targets = game.filterPlayer(current => current.countCards("h", { name: "DeathNote_yzs" })).sortBySeat();
					if (!targets.length) return;
					for (let target of targets) {
						if (target == player) {
							//await player.addSkill("kila_yzs_buff");
						}
						const { result } = await target
							.chooseToUse(
								"基拉：你可使用【死亡笔记】",
								function (card) {
									if (get.name(card) != "DeathNote_yzs") {
										return false;
									}
									return true;
								},
							)
							.set("ai2", function () {
								return get.effect_use.apply(this, arguments) - get.event("effect");
							})
							.set("effect", get.effect(target, { name: "losehp" }, target, target))
						//await player.removeSkill("kila_yzs_buff");
					}
				},
			},
		},
	},
	"kila_yzs_buff": {
		sub: true,
		sourceSkill: "kila_yzs",
		global: "kila_yzs_buff_global",
	},
	"kila_yzs_buff_global": {
		mod: {
			cardEnabled(card, player) {
				if (player.hasSkill("kila_yzs_buff")) {
					return;
				}
				return false;
			},
			cardUsable(card, player) {
				if (player.hasSkill("kila_yzs_buff")) {
					return;
				}
				return false;
			},
			cardRespondable(card, player) {
				if (player.hasSkill("kila_yzs_buff")) {
					return;
				}
				return false;
			},
			cardSavable(card, player) {
				if (player.hasSkill("kila_yzs_buff")) {
					return;
				}
				return false;
			},
		},
	},
	"juece_yzs": {
		audio: "ext:一中杀/audio/skill:3",
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
				intro: {
					markcount: "storage",
					content: "已发动过#次",
				},
				sub: true,
				sourceSkill: "juece_yzs",
				"_priority": 0,
			},
		},
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		filter(event, player) {
			if (player.hasSkill("juece_yzs_ban")) return false;
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		check(event, player) {
			const num = player.countMark("juece_yzs_used");
			if (num + 1 > player.maxHp) return true;
			if (player.isPhaseUsing()) {
				if (player.countCards("h") + num<=player.maxHp) {
					return true;
				}
			} else {
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			player.addSkill("juece_yzs_ban");
			player.addTempSkill(event.name + "_used");
			player.addMark(event.name + "_used", 1, false);
			const num = player.countMark(event.name + "_used");
			await player.draw(num);
			const result = await player.chooseCard("谲策", "分配或置底1张手牌", "h", 1, false)
				.set("ai", (card) => {
					const player = get.player();
					if (player.countCards("h") == 1) return 0;
					let value = get.value(card, player);
					return game.hasPlayer(p=>get.attitude(player,p)>0)?value:8-value
				})
				.forResult();
			if (!result.bool) {
				player.removeSkill("juece_yzs_ban");
				if (player.countCards("h") > player.maxHp || num > player.maxHp) await player.tempBanSkill("juece_yzs");
				return
			}
			else {
				const card = result.cards[0];
				card.fix();
				let target = await player.chooseTarget("谲策", "选择1名其他角色，给予其1张手牌（取消则置底）", false)
					.set("filterTarget", (card, player, target) => {
						return !(target.hasSkill("hidden_yzs")) && target != player;
					})
					.set("ai", (target2) => {
						const player2 = get.event().player;
						return get.attitude(player2, target2);
					})
					.forResult()
				if (!target.bool) {
					await player.lose(card, ui.cardPile);
					game.log(player, "将1张手牌置于牌堆底");
					game.updateRoundNumber();
					player.removeSkill("juece_yzs_ban");
					if (player.countCards("h") > player.maxHp || num > player.maxHp) await player.tempBanSkill("juece_yzs");
					return;
				}
				await player.give(card, target.targets[0]);
				player.removeSkill("juece_yzs_ban");
				if (player.countCards("h") > player.maxHp || num > player.maxHp) await player.tempBanSkill("juece_yzs");
			}
		}
	},
	"juece_yzs_ban": {
		charlotte: true,
	},
	"xinsega_yzs": {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:1",
		dutySkill: true,
		forced: true,
		locked: false,
		skillAnimation: true,
		animationColor: "fire",
		forceDie: true,
		trigger: {
			player: "dieBefore",
		},
		filter(event, player) {
			if (event.player.maxHp <= 0) return false;
		//	if (event.getParent().name == "giveup") return false;
			return true;
		},
		async content(event, trigger, player) {
			game.broadcastAll(function (current) {
				if (current.node.avatar) {
					current.node.avatar.setBackgroundImage("extension/一中杀/image/yagamiLight2_yzs.png");
				}
			}, player)
			trigger.cancel();
			game.log(player, "使命失败");
			player.addSkill("xinsega_yzs_dn")
			await player.loseMaxHp(Math.ceil(player.maxHp / 2));
			let num = player.maxHp - player.hp;
			if (num > 0) await player.recover(num);
			player.awakenSkill("xinsega_yzs");
		},
	},
	"xinsega_yzs_dn": {
		nobracket: true,
		locked: true,
		forced: true,
		trigger: {
			global: "roundEnd",
		},
		sub: true,
		sourceSkill: "xinsega_yzs",
		filter(event, player) {
			if (!player.storage.xinsega_yzs) return false;
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return true;
			}))
		},
		async content(event, trigger, player) {
			let result = await player.chooseTarget("新世界", "请选择【死亡笔记】的目标", true)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return true;
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return get.attitude(player2, target2);
				})
				.forResult()
			if (result.bool) {
				//	await player.addSkill("kila_yzs_buff");
				await player.useCard({ name: "DeathNote_yzs", isCard: true }, result.targets[0]);
				//	await player.removeSkill("kila_yzs_buff");
			}
		},
		priority: 0,
	},
	//精灵公主
	"princetwittering_yzs": {
		nobracket: true,
		unique: true,
		global: "princetwittering_yzs_maotouying",
		markimage: 'extension/一中杀/image/princetwittering_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("princetwittering_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张扣置牌";
			},
		},
		group: ["princetwittering_yzs_gain", "princetwittering_yzs_exp", "princetwittering_yzs_cards1", "princetwittering_yzs_cards2", "princetwittering_yzs_use", "princetwittering_yzs_pomochong", "princetwittering_yzs_shengbaihu", "princetwittering_yzs_renew"],
		subSkill: {
			gain: {
				audio: "princetwittering_yzs",
				name: "召回动物",
				enable: "phaseUse",
				usable: 1,
				prompt: "你弃2张手牌或失去1点体力，然后你获得1张动物牌(不选牌则失去1点体力发动)",
				filter(event, player) {
					if (player.countCards("h", { name: "maotouying_yzs" })
						&& player.countCards("h", { name: "pomochong_yzs" })
						&& player.countCards("h", { name: "shengbaihu_yzs" })) return false;
					return true;
				},
				selectTarget: -1,
				filterTarget: function (card, player, target) {
					return target == player
				},
				filterCard: true,
				selectCard() {
					let player = get.event().player;
					return [0, 2]
				},
				filterOk() {
					return ui.selected.cards.length != 1;
				},
				position: "h",
				check: function (card) {
					return 6 - get.value(card);
				},
				async content(event, trigger, player) {
					if (event.cards.length == 0) await player.loseHp();
					const animals = ["maotouying_yzs", "pomochong_yzs", "shengbaihu_yzs"]
					let list = [];
					for (let i = 0; i < animals.length; i++) {
						let name = animals[i];
						if (!player.countCards("h", { name: name })) list.push(["动物", "", name]);
					}
					let result = await player.chooseButton(["公主的呢喃", [list, "vcard"]])
						.set("forced", true)
						.forResult();
					if (!result.bool) return
					game.log(player, "召回了" + get.translation(result.links[0][2]));
					const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
					const filter = card => [result.links[0][2]].includes(card.name);
					const cardx = cards.filter(filter);
					if (cardx.length) {
						await game.cardsGotoSpecial(cardx);
					}
					for (const target of game.filterPlayer()) {
						const sishis = target.getCards("hej", filter);
						if (sishis.length) {
							target.$throw(sishis);
							await target.lose(sishis, ui.special);
						}
					}
					const cardsex = player.getExpansions("princetwittering_yzs").filter(filter);
					if (cardsex.length) {
						await player.lose(cardsex, ui.special);
					}
					var card = game.createCard2(result.links[0][2], "heart", 1);
					await player.gain(card, "gain2");
					game.delayx();
				}
			},
			cards1: {
				charlotte: true,
				onremove: true,
				markimage: 'extension/一中杀/image/princetwittering_yzs_cards1.png',
				intro: {
					content: "出牌阶段结束时将手牌数调整至#",
				},
				sub: true,
				sourceSkill: "princetwittering_yzs",
				"_priority": 0,
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseUseBegin",
				},
				async content(event, trigger, player) {
					var players = game.filterPlayer();
					for (let target of players) {
						target.addMark("princetwittering_yzs_cards1", target.countCards("h"), false);
					}
				}
			},
			cards2: {
				sub: true,
				sourceSkill: "princetwittering_yzs",
				"_priority": 0,
				locked: true,
				forced: true,
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: "phaseUseEnd",
				},
				async content(event, trigger, player) {
					var players = game.filterPlayer();
					for (let target of players) {
						const num = target.countMark("princetwittering_yzs_cards1");
						const num2 = target.countCards("h");
						target.clearMark("princetwittering_yzs_cards1", false);
						if (num2 > num) {
							await target.chooseToDiscard("h", num2 - num, true);
						} else if (num > num2) {
							await target.draw(num - num2);
						}
					}
				}
			},
			exp: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				trigger: {
					player: "gainAfter",
				},
				filter: function (trigger, player) {
					let cards = trigger.getg(trigger.player).filter(card => get.type(card) == "animal");
					return cards && cards.length;
				},
				async cost(event, trigger, player) {
					let cards = trigger.getg(trigger.player).filter(card => card.name == "shengbaihu_yzs");
					if (cards && cards.length) {
						if (player.countMark("princetwittering_yzs_shengbaihu") > 1) return;
						player.addMark("princetwittering_yzs_shengbaihu", 1, false);
						await player.showCards(get.translation(player) + "获得【圣白虎】而恢复1点体力", cards);
						await player.recover();
					}
					event.result = await player.chooseCard("公主的呢喃", "你可扣置1张手牌", "h", [0, 1])
						.set("ai", (card) => {
							return 8 - get.value(card)
						})
						.forResult()
				},
				async content(event, trigger, player) {
					let next = player.addToExpansion(event.cards, player, "giveAuto")
					next.gaintag.add("princetwittering_yzs")
					await next
				},
			},
			use: {
				locked:true,
				name: "公主盖牌",
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard(player, name) {
					if (player.getExpansions("princetwittering_yzs").some(card => card.name == name)) {
						return true;
					}
				},
				filter(event, player) {
					if (event.responded || event.princetwittering_yzs_use) {
						return false;
					}
					return player.getExpansions("princetwittering_yzs").some(card => event.filterCard(card, player, event));
				},
				chooseButton: {
					dialog(event, player) {
						return ui.create.dialog("公主的呢喃", player.getExpansions("princetwittering_yzs"), "hidden");
					},
					filter(button, player) {
						const evt = _status.event.getParent();
						return evt.filterCard(button.link, player, evt);
					},
					check(button) {
						const card = button.link,
							player = get.player();
						return player.getUseValue(card);
					},
					backup(links, player) {
						return {
							audio: "princetwittering_yzs_exp",
							filterCard(card) {
								return card === lib.skill.princetwittering_yzs_use_backup.card;
							},
							selectCard: -1,
							viewAs: links[0],
							card: links[0],
							position: "x",
						};
					},
					prompt(links, player) {
						return "公主的呢喃：请选择" + get.translation(links[0]) + "的目标";
					},
				},
				ai: {
					effect: {
						target(card, player, target, effect) {
							if (get.tag(card, "respondShan")) {
								return 0.7;
							}
							if (get.tag(card, "respondSha")) {
								return 0.7;
							}
						},
					},
					order: 9,
					respondShan: true,
					respondSha: true,
					result: {
						player(player) {
							if (_status.event.dying) {
								return get.attitude(player, _status.event.dying);
							}
							return 1;
						},
					},
				},
			},
			pomochong: {
				audio: "ext:一中杀/audio/skill:2",
				name: "破魔虫",
				locked: true,
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					if (_status.currentPhase != player) return false;
					if (player.countCards("h", { name: "pomochong_yzs" })) return false;
					if (event.card.name == "pomochong_yzs") return false;
					var num = player.getHistory('useCard').length;
					return num % 4 == 0;
				},
				async content(event, trigger, player) {
					const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
					const filter = card => ["pomochong_yzs"].includes(card.name);
					const cardx = cards.filter(filter);
					if (cardx.length) {
						await game.cardsGotoSpecial(cardx);
					}
					for (const target of game.filterPlayer()) {
						const sishis = target.getCards("hej", filter);
						if (sishis.length) {
							target.$throw(sishis);
							await target.lose(sishis, ui.special);
						}
					}
					const cardsex = player.getExpansions("princetwittering_yzs").filter(filter);
					if (cardsex.length) {
						await player.lose(cardsex, ui.special);
					}
					var card = game.createCard2("pomochong_yzs", "heart", 1);
					await player.gain(card, "gain2");
					game.delayx();
				}
			},
			shengbaihu: {
				name: "圣白虎",
				locked: true,
				forced: true,
				charlotte: true,
				onremove: true,
				audio: "ext:一中杀/audio/skill:1",
				markimage: 'extension/一中杀/image/shengbaihu_yzs_used.png',
				intro: {
					content: "已因【圣白虎】而恢复过#/2点体力",
				},
				sub: true,
				sourceSkill: "princetwittering_yzs",
				"_priority": 0,
				trigger: {
					player: "changeHp",
				},
				filter(event, player) { return player.countCards("h", { name: "shengbaihu_yzs" }) == 0 },
				async content(event, trigger, player) {
					const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
					const filter = card => ["shengbaihu_yzs"].includes(card.name);
					const cardx = cards.filter(filter);
					if (cardx.length) {
						await game.cardsGotoSpecial(cardx);
					}
					for (const target of game.filterPlayer()) {
						const sishis = target.getCards("hej", filter);
						if (sishis.length) {
							target.$throw(sishis);
							await target.lose(sishis, ui.special);
						}
					}
					const cardsex = player.getExpansions("princetwittering_yzs").filter(filter);
					if (cardsex.length) {
						await player.lose(cardsex, ui.special);
					}
					var card = game.createCard2("shengbaihu_yzs", "heart", 1);
					await player.gain(card, "gain2");
					game.delayx();
				}
			},
			renew: {
				forced: true,
				popup: false,
				firstDo: true,
				trigger: { player: ["phaseBegin"], },
				filter: function (event, trigger, player) {
					if (trigger.skill) return false;
					return true;
				},
				async content(event, trigger, player) {
					player.clearMark("princetwittering_yzs_shengbaihu", false);
				}
			},
		},
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:1",
		trigger: { player: "phaseBegin" },
		filter(event, player) {
			if (player.countCards("h", { name: "maotouying_yzs" })
				&& player.countCards("h", { name: "pomochong_yzs" })
				&& player.countCards("h", { name: "shengbaihu_yzs" })) return false;
			return true;
		},
		async content(event, trigger, player) {
			const animals = ["maotouying_yzs", "pomochong_yzs", "shengbaihu_yzs"]
			let list = [];
			for (let i = 0; i < animals.length; i++) {
				let name = animals[i];
				if (!player.countCards("h", { name: name })) list.push(["动物", "", name]);
			}
			let result = await player.chooseButton(["公主的呢喃", [list, "vcard"]])
				.set("forced", true)
				.forResult();;
			if (!result.bool) return
			game.log(player, "召回了" + get.translation(result.links[0][2]));
			const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
			const filter = card => [result.links[0][2]].includes(card.name);
			const cardx = cards.filter(filter);
			if (cardx.length) {
				await game.cardsGotoSpecial(cardx);
			}
			for (const target of game.filterPlayer()) {
				const sishis = target.getCards("hej", filter);
				if (sishis.length) {
					target.$throw(sishis);
					await target.lose(sishis, ui.special);
				}
			}
			const cardsex = player.getExpansions("princetwittering_yzs").filter(filter);
			if (cardsex.length) {
				await player.lose(cardsex, ui.special);
			}
			var card = game.createCard2(result.links[0][2], "heart", 1);
			await player.gain(card, "gain2");
			game.delayx();
		},
		ai: {
			threaten: 2.2,
			respondSha: true,
			respondShan: true,
		}
	},
	"princetwittering_yzs_maotouying": {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:2",
		name: "猫头鹰",
		locked: true,
		forced: true,
		mod: {
			cardEnabled(card, player) {
				if (get.type(card) == "animal" && !player.hasSkill("princetwittering_yzs")) {
					return false;
				}
			},
			cardUsable(card, player) {
				if (get.type(card) == "animal" && !player.hasSkill("princetwittering_yzs")) {
					return false;
				}
			},
			cardRespondable(card, player) {
				if (get.type(card) == "animal" && !player.hasSkill("princetwittering_yzs")) {
					return false;
				}
			},
			cardSavable(card, player) {
				if (get.type(card) == "animal" && !player.hasSkill("princetwittering_yzs")) {
					return false;
				}
			},
		},
		trigger: {
			player: ["loseAfter", "compare", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
			target: "compare",
		},
		filter(event, player, name) {
			if (event.name == "addToExpansion") return false;
			let prince = game.filterPlayer(current => current.hasSkill("princetwittering_yzs"));
			if (!prince.length) return false;
			prince = prince[0];
			if (prince.countCards("h", { name: "maotouying_yzs" })) return false;
			if (event.getParent() && event.getParent().card && event.getParent().card.name == "maotouying_yzs") return false;
			if (event.getParent() && event.getParent().name) {
				if (event.getParent().name == "swapHandcards") return false;
				if (event.getParent().name == "princetwittering_yzs_gain") return false;
				if (event.getParent().name == "princetwittering_yzs") return false;
				if (event.getParent().name == "give") return false;
				if (event.getParent().name == "gain") return false;
			}
			if (name == "compare") {
				if (player == event.player) {
					if (event.iwhile > 0) {
						return false;
					}
					return event.card1.name == "maotouying_yzs";
				}
				return event.card2.name == "maotouying_yzs";
			}
			var evt = event.getl(player);
			if (
				!evt ||
				!evt.hs ||
				!evt.hs.filter(function (i) {
					return get.name(i, player) == "maotouying_yzs";
				}).length
			) {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			let prince = game.filterPlayer(current => current.hasSkill("princetwittering_yzs"));
			if (!prince.length) return false;
			prince = prince[0];
			if (trigger.name == "compare") {
				if (player == event.player) {
					if (trigger.iwhile > 0) {
						return false;
					}
					if (trigger.card1.name == "maotouying_yzs") {
						await prince.gain(trigger.card1, "gain2");
					}
				}
				if (trigger.card2.name == "maotouying_yzs") {
					await prince.gain(trigger.card2, "gain2");
				}
			}
			let evt = trigger.getl(player);
			let ds = evt.cards2.filter(function (card) {
				return get.name(card) === "maotouying_yzs";
			});
			if (ds.length) await prince.gain(ds, "gain2");
		}
	},
	"pomochong_yzs_used": {
		charlotte: true,
		onremove: true,
		markimage: 'extension/一中杀/image/pomochong_yzs_used.png',
		intro: {
			content: "已使用过#/5次【破魔虫】",
		},
		sub: true,
		sourceSkill: "princetwittering_yzs",
		"_priority": 0,
	},
	//诺艾尔
	"buxudong_yzs": {
		nobracket: true,
		group: ["buxudong_yzs_sha", "buxudong_yzs_damage"],
		locked: true,
		forced: true,
		subSkill: {
			sha: {
				trigger: {
					player: "useCard1",
				},
				firstDo: true,
				locked: true,
				forced: true,
				filter(event, player) {
					return event.card.name == "sha" && event.getParent().type == "phase";
				},
				async content(event, trigger, player) {
					const suit = get.suit(trigger.card)
					if (trigger.addCount !== false) player.getStat().card.sha--;
					player.addTempSkill("buxudong_yzs_shaused", "phaseUseAfter");
					player.markAuto("buxudong_yzs_shaused", [suit]);
				}
			},
			damage: {
				trigger: {
					source: "damageBegin1",
				},
				filter(event, player) {
					return event.player.countCards("h") > 0 && event.notLink();
				},
				charlotte: true,
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					trigger.num--;
				},
				ai: {
					damageBonus: false,
				},
				sub: true,
				sourceSkill: "buxudong_yzs",
				"_priority": 2,
			},
		},
		trigger: {
			player: "useCardToPlayered",
		},
		filter(event, player) {
			return event.target.countCards("hej", card => get.suit(card) == get.suit(event.card)) > 0 && event.target != player;
		},
		async content(event, trigger, player) {
			const cards = trigger.target.getCards("hej", card => get.suit(card) == get.suit(trigger.card))
			player.logSkill("buxudong_yzs", trigger.target);
			trigger.target.addSkill("buxudong_yzs_effect");
			let next = trigger.target.addToExpansion(cards, trigger.target, "giveAuto")
			next.gaintag.add("buxudong_yzs_effect")
			await next
		}
	},
	"buxudong_yzs_shaused": {
		locked: true,
		forced: true,
		onremove: true,
		mod: {
			cardUsable(card, player, num) {
				if (player.getStorage("buxudong_yzs_shaused").includes(get.suit(card)) && card.name === "sha") return num-1;
			},

		},
	},
	"buxudong_yzs_effect": {
		trigger: {
			player: ["phaseBegin", "damageBegin4"]
		},
		forced: true,
		popup: false,
		charlotte: true,
		sourceSkill: "buxudong_yzs",
		filter(event, player) {
			if (event.name == "damage" && event.source.hasSkill("buxudong_yzs") && _status.currentPhase == event.source) return false;
			if (event.name == "damage" && event.num == 0) return false;
			return player.getExpansions("buxudong_yzs_effect").length > 0;
		},
		content() {
			"step 0";
			var cards = player.getExpansions("buxudong_yzs_effect");
			player.gain(cards, "draw");
			game.log(player, "收回了" + get.cnNumber(cards.length) + "张“不许动”牌");
			"step 1";
			player.removeSkill("buxudong_yzs_effect");
		},
		markimage: 'extension/一中杀/image/buxudong_yzs_effect.png',
		intro: {
			markcount: "expansion",
			mark(dialog, storage, player) {
				var cards = player.getExpansions("buxudong_yzs_effect");
				if (player.isUnderControl(true)) {
					dialog.addAuto(cards);
				} else {
					return "共有" + get.cnNumber(cards.length) + "张牌";
				}
			},
		},
		"_priority": 0,
	},
	"haixiangpao_yzs": {
		nobracket: true,
		global: "haixiangpao_yzs_gain",
		group: ["haixiangpao_yzs_draw", "haixiangpao_yzs_xianyiren"],
		unique: true,
		locked: true,
		mark: true,
		markimage: 'extension/一中杀/image/haixiangpao_yzs.png',
		intro: {
			name: "嫌疑人",
			content: function (storage, player) { return "目前有" + player.countMark("haixiangpao_yzs") + "枚【嫌疑人】标记" },
		},
		forced: true,
		trigger: {
			player: "useCard1",
		},
		filter(event, player) {
			if (_status.currentPhase != player) return false;
			return !player.getStorage("haixiangpao_yzs_used").includes(get.suit(event.card))
		},
		async content(event, trigger, player) {
			const suit = get.suit(trigger.card)
			player.popup(suit);
			player.addTempSkill("haixiangpao_yzs_used")
			player.markAuto("haixiangpao_yzs_used", [suit]);
			await player.draw(3);
			if (!player.countCards("h")) return
			const result = await player.chooseCard("还想跑？", "弃置或置底1张手牌", "h", 1, true)
				.set("ai", (card) => {
					let player = _status.event.player
					if (get.tag(trigger.card, "respondSha")) {
						if (player.countCards("h", {
							name: "sha"
						}) === 0) return 8 - get.value(card)
						if (ui.selected.cards.filter(c => c.name == "sha").length >= player.countCards("h", card => card.name == "sha")) return false
					} else if (get.tag(trigger.card, "respondShan")) {
						if (player.countCards("h", {
							name: "shan"
						}) === 0) return 8 - get.value(card)
						if (ui.selected.cards.filter(c => c.name == "shan").length >= player.countCards("h", card => card.name == "shan")) return false
					} else if (get.tag(trigger.card, "damage") && player.hp < 2) {
						if (card.name == "tao") return false
						if (card.name == "jiu") return false
					}
					return 8 - get.value(card)
				})
				.forResult()
			if (result.bool && result.cards?.length) {
				const choice = await player
					.chooseButton(["选择弃置或置底", [["1.弃置", "2.置底"], "tdnodes"]], true)
					.set("selectButton", 1)
					.forResult();
				if (choice?.links?.length) {
					const num = parseInt(choice.links[0].slice(0, 1));
					if (num == 1) await player.discard(result.cards)
					else {
						await player.lose(result.cards[0], ui.cardPile);
						game.log(player, "将1张牌置于牌堆底");
						game.updateRoundNumber();
					}
				}

			}
		},
		subSkill: {
			used: {
				onremove: true,
				charlotte: true,
				intro: {
					content: "已摸牌过的花色：$",
				},
				sub: true,
				sourceSkill: "haixiangpao_yzs",
				"_priority": 0,
			},
			draw: {
				prompt2: "是否从牌堆底摸牌？",
				locked: true,
				trigger: {
					player: "drawBegin",
				},
				check() {
					return Math.random()>0.7
				},
				async content(event, trigger, player) {
					trigger.bottom = true;
				},
				ai: {
					abnormalDraw: true,
					skillTagFilter(player, tag, arg) {
						if (tag === "abnormalDraw") {
							return !arg || arg === "bottom";
						}
					},
				},
			},
			xianyiren: {
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					return event.player !== player && player.countMark("haixiangpao_yzs") > 0;
				},
				"prompt2": event => "移除1枚【嫌疑人】标记，令" + get.translation(event.card) + "无效",
				logTarget: "player",
				async content(event, trigger, player) {
					player.removeMark("haixiangpao_yzs") > 0
					trigger.targets.length = 0;
					trigger.all_excluded = true;
					game.log(trigger.card, "被无效了");
				},
				sub: true,
				sourceSkill: "haixiangpao_yzs",
				"_priority": 0,
			},
		},
	},
	"haixiangpao_yzs_gain": {
		forced: true,
		locked: true,
		firstDo: true,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		filter(event, player) {
			const noir = game.filterPlayer(current => current.hasSkill("haixiangpao_yzs"))[0];
			if (player == noir) return false;
			if (player.countCards("h")) {
				return false;
			}
			const evt = event.getl(player);
			if (evt && evt.player == player && evt.hs && evt.hs.length > 0) {
				if (event.type == "discard") {
					if ((event.discarder || event.getParent(event.getParent(2).name == "chooseToDiscard" ? 3 : 2).player) == noir) return true;
				}
				if (event.name === "gain") {
					if (event.player === noir) {
						return true;
					}
				}
				if (event.getParent() && event.getParent().name && event.getParent().name == "useCard" && event.getParent().player == noir) return true;
				if (event.name == "addToExpansion" && event.getParent().name && event.getParent().name == "buxudong_yzs") return true;
			};
			return false;
		},
		async content(event, trigger, player) {
			const noir = game.filterPlayer(current => current.hasSkill("haixiangpao_yzs"))[0];
			noir.addMark("haixiangpao_yzs", 1);
		},
		sub: true,
		sourceSkill: "haixiangpao_yzs",
		"_priority": 0,
	},
	//馏蒸材
	"mysterydrug_yzs": {
		audio: "ext:一中杀/audio/skill:3",
		marktext: "也太",
		markimage: 'extension/一中杀/image/mysterydrug_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("mysterydrug_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【也太】";
			},
		},
		enable: "phaseUse",
		filterCard: {
			type: "basic",
		},
		check(card) {
			return 8 - get.value(card);
		},
		position: "h",
		filter(event, player) {
			if (player.countCards("h", card => get.type(card) == "basic") == 0) return false;
			if (!game.hasPlayer(function (target) {
				return !target.hasSkill("hidden_yzs") && player.countDiscardableCards("he");
			})) return false;
			return !player.countExpansions("mysterydrug_yzs")
		},
		async content(event, trigger, player) {
			const target = await player
				.chooseTarget("秘药", "令一名角色弃1张牌")
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.countDiscardableCards(target,"he") > 0;
				})
				.set("ai", function (target) {
					var att = get.attitude(_status.event.player, target);
					return -att;
				})
				.forResult();
			const card = await target.targets[0].chooseToDiscard()
				.set("position", "he")
				.set("forced", true)
				.set("ai", function (card) {
					return 7 - get.value(card);
				})
				.forResult();
			if (!card.bool || !card.cards || !card.cards.length || get.color(event.cards[0]) == get.color(card.cards[0])) {
				const cards = [];
				cards.push(event.cards[0]);
				if (card.cards.length) cards.push(card.cards[0])
				let next = player.addToExpansion(cards, player, "giveAuto")
				next.gaintag.add("mysterydrug_yzs")
				await next
				await player.tempBanSkill("mysterydrug_yzs");
			}
			else {
				if (!player.isIn() || !target.targets[0].isIn()) {
					return;
				}
				let result = await player.chooseTarget(`令目标角色视为使用【矿场爆炸】`,true)
					.set("forced", true)
					.set("filterTarget", (card, player, target) => {
						return get.event().targets.includes(target)
					})
					.set("ai", (target) => {
						const player=get.player()
						if (get.attitude(player, target) < 0 && target.countCards("h") <= 3) return 3;
						if (player.isDamaged() && player.countCards("h", card => get.type2(card) == "trick") == 0) return 6;
						if (player.countCards("h", card => get.type2(card) == "trick") > 1 && player.countCards("h", card => get.type2(card) == "trick") <= 3) return 7;
						return 0;
					})
					.set("targets",[player,target.targets[0]])
					.forResult();
				if (!result.bool) return
				game.log(player, "令" + get.translation(result.targets[0]) + "视为使用【矿场爆炸】");
				if (result.targets[0].canUse({ name: "kuangchangbaozha_yzs" }, result.targets[0])) {
					var next = result.targets[0].chooseUseTarget("kuangchangbaozha_yzs", true);
					await next;
				}
			}
		},
		ai: {
			order: 10,
			result: {
				player: 6,
			}
		}
	},
	"burnlife_yzs": {
		group: ["burnlife_yzs_g"],
		subSkill: {
			backup: {
				"skill_id": "burnlife_yzs_backup",
				sub: true,
				sourceSkill: "burnlife_yzs",
				"_priority": 0,
			},
			g: {
				audio: "burnlife_yzs",
				trigger: {
					global: "phaseBegin",
				},
				logTarget: "player",
				locked: true,
				filter(event, player) {
					if (!player.countExpansions("mysterydrug_yzs")) return false;
					if (event.player.hasSkill("hidden_yzs")) return false;
					return player != event.player;
				},
				async cost(event, trigger, player) {
					event.result = { bool:false }
					const cards = player.getExpansions("mysterydrug_yzs");
					const num = cards.reduce((sum, card) => sum + get.cardNameLength(card), 0)
					let result = await player.chooseButton([
						"选择一项，令" + get.translation(trigger.player) + "执行对应效果",
						[
							[
								["draw", "摸" + num + "张牌，本回合结束阶段弃全部手牌（至多5张）"],
								["discard", "弃全部手牌（至多5张），然后摸" + num + "张牌"],
							],
							"textbutton",
						],
					])
						.set("ai", (button) => {
							const target = get.event().target;
							const player = get.event().player;
							const num=get.event().num
							if (button.link == "discard") {
								if (num < 3&&get.attitude(player,target)<0&&target.countCards("h")>num) return 5;
							} else {
								if (num > 3 && get.attitude(player, target) > 0) return 5;
							}
							return 0;
						})
						.set("num", num)
						.set("target", trigger.player)
						.set("selectButton", 1)
						.forResult();
					if (!result.bool) return
					event.result = {
						bool: true,
						cost_data: result.links[0],
					}
				},
				async content(event, trigger, player) {
					const cards = player.getExpansions("mysterydrug_yzs");
					const num = cards.reduce((sum, card) => sum + get.cardNameLength(card), 0)
					await player.loseToDiscardpile(cards);
					if (event.cost_data == "draw") {
						await trigger.player.draw(num)
						trigger.player.addTempSkill("burnlife_yzs_buff")
					}
					else {
						if (trigger.player.getCards("h") > 5) await trigger.player.chooseToDiscard("h", true, 5);
						else {
							await trigger.player.discard(trigger.player.getCards("h"));
						}
						await trigger.player.draw(num)
					}
				}
			}
		},
		enable: "phaseUse",
		audio: "ext:一中杀/audio/skill:1",
		filter(event, player) {
			return player.countExpansions("mysterydrug_yzs");
		},
		chooseButton: {
			dialog(event,player) {
				const cards = player.getExpansions("mysterydrug_yzs");
				const num = cards.reduce((sum, card) => sum + get.cardNameLength(card), 0)
				let dialog = ui.create.dialog("燃熵：请选择一项", "hidden");
				dialog.add([
					[["draw", "摸" + num + "张牌，本回合结束阶段弃全部手牌（至多5张）"]],
					"textbutton",
				]);
				dialog.add([
					[["discard", "弃全部手牌（至多5张），然后摸" + num + "张牌"]],
					"textbutton",
				]);
				return dialog;
			},
			filter(button, player) {
				return true
			},
			check(button) {
				if (button.link == "draw") return 2 * num;
				return 0;
			},
			backup(links, player) {
				const effect = links[0];
				return {
					effect: effect,
					filterCard: () => false,
					selectCard: -1,
					async content(event, trigger, player) {
						const effect = lib.skill.burnlife_yzs_backup.effect;
						const cards = player.getExpansions("mysterydrug_yzs");
						const num = cards.reduce((sum, card) => sum + get.cardNameLength(card), 0)
						await player.loseToDiscardpile(cards);
						if (!player.hasSkill("shikuang_yzs_buff1")) {
							player.addTempSkill("shikuang_yzs_buff");
							player.addMark("shikuang_yzs_buff", 2, false);
							player.addTip("shikuang_yzs_buff", "嗜狂 X" + player.countMark("shikuang_yzs_buff"), true);
						}
						else player.addMark("shikuang_yzs_buff", player.countMark("shikuang_yzs_buff"), false);
						if (effect == "draw") {
							await player.draw(num)
							player.addTempSkill("burnlife_yzs_buff")
						}
						else {
							if (player.getCards("h") > 5) await player.chooseToDiscard("h", true, 5);
							else {
								await player.discard(player.getCards("h"));
							}
							await player.draw(num)
						}
					},
				};
			},
			prompt(links, player) {
				return ``
			},
		},
	},
	"burnlife_yzs_buff": {
		marktext: "燃熵",
		mark: true,
		intro: {
			content: "本回合结束阶段弃全部手牌（至多5张）",
		},
		forced: true,
		trigger: {
			player: "phaseJieshuBegin",
		},
		async content(event, trigger, player) {
			if (player.getCards("h") > 5) await player.chooseToDiscard("h", true, 5);
			else {
				await player.discard(player.getCards("h"));
			}
		},
		sub: true,
		sourceSkill: "burnlife_yzs",
		"_priority": 0,
	},
	"shikuang_yzs_buff": {
		sub: true,
		marktext: "狂",
		mark: true,
		intro: {
			content: "出【杀】数和手牌上限翻#倍。",
		},
		mod: {
			maxHandcard: function (player, num) {
				return num *= player.countMark("shikuang_yzs_buff");
			},
			cardUsable: function (card, player, num) {
				if (card.name == "sha") return num *= player.countMark("shikuang_yzs_buff");
			},
		},
		sourceSkill: "shikuang_yzs",
		"_priority": 1,
	},
	"shikuang_yzs": {
		locked: true,
		popup: false,
		forced: true,
		trigger: {
			player: "discardBegin"
		},
		filter(event, player) {
			return event.getParent().name == "burnlife_yzs" || event.getParent().name == "burnlife_yzs_buff"
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.draw(2);
		}
	},
	//武器大师
	"yinju_yzs": {
		trigger: {
			global: "useCardToPlayered",
		},
		direct: true,
		popup:true,
		filter(event, player) {
			if (event.getParent().triggeredTargets3.length > 1) return false;
			return event.targets.length > 1 && event.targets.includes(player)
		},
		async content(event, trigger, player) {
			trigger.getParent().excluded.add(player);
		},
		mod: {
			globalTo: function (from, to, distance) {
				return distance + 1;
			},
		},
		priority: 2,
	},
	"badaozhan_yzs": {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:5",
		limited: true,
		skillAnimation: false,
		locked: true,
		unique: true,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.getEquips(1).length) return false
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canUse({ name: "sha" }, target, false)
			}))
		},
		filterTarget: function (card, player, target) {
			return player.canUse("sha", target, false);
		},
		async content(event, trigger, player) {
			player.awakenSkill("badaozhan_yzs");
			var cards = player.getEquips(1);
			if (cards.length) {
				await player.gain(cards, player, "give", "bySelf");
				await player.draw();
				await player.useCard({ name: "sha" }, event.targets, false);
				player.getStat().card.sha = 0;
			}
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					return get.damageEffect(target, player, target);
				},
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	"wuqizhangkong_yzs": {
		nobracket: true,
		group: ["wuqizhangkong_yzs_renew", "wuqizhangkong_yzs_handcard", "wuqizhangkong_yzs_exchange", "wuqizhangkong_yzs_discard"],
		locked: true,
		forced: true,
		trigger: {
			player: "useCardAfter",
		},
		filter(event, player) {
			if (get.type(event.card) != "equip") {
				return false;
			}
			if (get.subtype(event.card) != "equip1") {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			let num = 1;
			var info = get.info(trigger.cards[0], false);
			if (info && info.distance && typeof info.distance.attackFrom == "number") num -= info.distance.attackFrom;
			player.addTempSkill("wuqizhangkong_yzs_used");
			player.markAuto("wuqizhangkong_yzs_used", [num]);
		},
		subSkill: {
			discard: {
				priority:2,
				prompt2: function () {
					var target = _status.currentPhase;
					return "弃置" + get.translation(target) + "1张牌"
				},
				trigger: {
					player: ["loseAfter", "compare"],
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
					target: "compare",
				},
				filter(event, player, name) {
					if (event.getParent().name == "wuqizhangkong_yzs_exchange") return false;
					var target = _status.currentPhase;
					if (!target) return false;
					if (target.countCards("hej") == 0) return false;
					if (event.name == "gain" && event.player == player) return false;
					let evt = event.getl(player);
					if (!evt || !evt.cards2 || !evt.cards2.length) return false;
					if (event.getParent() && event.getParent().card && get.subtype(event.getParent().card) == "equip1") return true;
					if (name == "compare") {
						if (player == event.player) {
							if (event.iwhile > 0) {
								return false;
							}
							return get.subtype(event.card1) == "equip1";
						}
						return get.subtype(event.card2) == "equip1";
					}
					let ds = evt.cards2.filter(function (card) {
						return get.subtype(card) === "equip1";
					});
					if (ds.length) return true;
					return false;
				},
				check(event, player) {
					if (event.player == player) return false;
					var target = _status.currentPhase;
					return get.attitude(player, target) <= 0;
				},
				async content(event, trigger, player) {
					let ds = [];
					let evt = trigger.getl(player);
					if (evt?.cards2?.length) {
						ds = evt.cards2.filter(function (card) {
							return get.subtype(card) === "equip1";
						});
					}else if (trigger.getParent() && trigger.getParent().card && get.subtype(trigger.getParent().card) == "equip1") {
						ds = [trigger.getParent().card];
					}else if (trigger.name == "compare") {
						if (player == trigger.player) {
							if (trigger.iwhile > 0) {
								return ;
							}
							if (get.subtype(trigger.card1) == "equip1") ds = [trigger.card1];
						}
						if (get.subtype(trigger.card2) == "equip1") ds = [trigger.card2];
					}
					if (ds.length) await player.showCards(ds, "【武器掌控】展示失去的武器牌")
					var target = _status.currentPhase;
					await player.discardPlayerCard(target, "hej", true);
				},
			},
			renew: {
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: ["useSkill", "logSkillBegin"],
				},
				filter(event, player) {
					if (!player.awakenedSkills.includes("badaozhan_yzs")) return false;
					if ((get.info(event.skill) || {}).charlotte) {
						return false;
					}
					const skill = get.sourceSkillFor(event);
					const info = get.info(skill);
					return info && info.equipSkill;
				},
				forced: true,
				async content(event, trigger, player) {
					player.restoreSkill("badaozhan_yzs");
					player.markSkill("badaozhan_yzs")
				}
			},
			handcard: {
				mod: {
					ignoredHandcard(card) {
						if (get.subtype(card) == "equip1") {
							return true;
						}
					},
				},
			},
			exchange: {
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					global: ["loseAfter", "loseAsyncAfter", "cardsDiscardAfter"],
				},
				locked: true,
				filter(event, player) {
					if (!player.countCards("h")) return false;
					if (event.getParent().name == "wuqizhangkong_yzs_exchange") return false;
					if (!event.cards) return false;
					var cards = event.cards.filter(i => get.subtype(i) == 'equip1' && get.position(i, true) == 'd');
					return cards.length;
				},
				async cost(event, trigger, player) {
					var cards = trigger.cards.filter(i => get.subtype(i) == 'equip1' && get.position(i, true) == 'd');
					if (!cards.length) return;
					let result = await player.chooseToMove("【武器掌控】：用手牌交换这张武器牌")
						.set("list", [
							[get.translation(player) + "进入弃牌堆的武器牌", cards],
							["手牌区", player.getCards("h")],
						])
						.set("filterMove", function (from, to) {
							return typeof to != "number";
						})
						.forResult();
					if (!result.bool) return false;
					event.result = {
						bool: true,
						cost_data: {
							pushs: result.moved[0],
							gains: result.moved[1],
						}
					}
				},
				async content(event, trigger, player) {
					var cards = trigger.cards.filter(i => get.subtype(i) == 'equip1' && get.position(i, true) == 'd');
					if (!cards.length) return;
					var pushs = event.cost_data.pushs,
						gains = event.cost_data.gains;
					pushs.removeArray(cards);
					gains.removeArray(player.getCards("h"));
					if (!pushs.length || pushs.length != gains.length) return;
					player.lose(pushs, ui.discardPile);
					player.$throw(pushs);
					game.log(player, "将", pushs, "置入了弃牌堆");
					player.gain(gains, "draw");
				},
				priority: 1,
			},
		},
	},
	"wuqizhangkong_yzs_used": {
		onremove: true,
		charlotte: true,
		intro: {
			content: "已装备过的武器范围：$",
		},
		sub: true,
		sourceSkill: "wuqizhangkong_yzs",
		"_priority": 0,
		locked: true,
		mod: {
			cardEnabled: function (card, player) {
				if (get.type(card) != "equip") {
					return;
				}
				if (get.subtype(card,false) != "equip1") {
					return;
				}
				let num = 1;
				var info = get.info(card, false);
				if (info && info.distance && typeof info.distance.attackFrom == "number") num -= info.distance.attackFrom;
				if (player.getStorage("wuqizhangkong_yzs_used").includes(num)) return false;
			},
		},
	},
	//少名针妙丸
	"yicunfashi_yzs": {
		nobracket: true,
		markimage: 'extension/一中杀/image/yicunfashi_yzs.png',
		mod: {
			maxHandcard(player, num) {
				return num += player.countMark("yicunfashi_yzs");
			},
		},
		intro: {
			markcount: "storage",
			content: "手牌上限+#。",
		},
		group: ["yicunfashi_yzs_gain", "yicunfashi_yzs_bianda"],
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		charlotte: true,
		unique: true,
		forced: true,
		locked: true,
		filter(event, player) {
			return game.hasPlayer(current => current !== player) && (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			player.addMark("Fuka_yzs", 1);
		},
		subSkill: {
			gain: {
				name:"进击的小人",
				forced: true,
				locked: true,
				trigger: {
					player: "phaseDiscardBegin",
				},
				filter(event, player) {
					if (player.countMark("Fuka_yzs") >= get.character(player.name).Fuka) return false;
					return player.countCards("h") < player.getHandcardLimit();
				},
				async content(event, trigger, player) {
					const num = Math.min(player.getHandcardLimit() - player.countCards("h"), get.character(player.name).Fuka - player.countMark("Fuka_yzs"))
					if (num > 0) player.addMark("Fuka_yzs", num);
				}
			},
			bianda: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.hasSkill("bianda_yzs_buff");
				},
				async content(event, trigger, player) {
					player.removeSkill("bianda_yzs_buff");
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
					}, player, 1)
					await player.recover();
					await player.draw(3);
					if (player.hujia > 0) await player.changeHujia(-player.hujia);
					player.addMark("yicunfashi_yzs", 3, false)
					if (player.getHandcardLimit() > 14 && !player.storage.jieyicunfashi_yzs) await player.useSkill("jieyicunfashi_yzs_awaken");
				}
			},
		},
	},
	"bianda_yzs": {
		nobracket: true,
		locked: true,
		enable: "phaseUse",
		filter(event, player) {
			if (player.countMark("Fuka_yzs") < 1) return false;
			return (game.hasPlayer(function (target) {
				return !target.hasSkill("bianda_yzs_buff")
			}))
		},
		filterTarget: function (card, player, target) {
			return !target.hasSkill("bianda_yzs_buff")
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			await player.loseHp();
			await event.target.changeHujia(2);
			await event.target.addSkill("bianda_yzs_buff");
			game.broadcastAll(() => {
				game.playAudio("ext:一中杀/audio/skill/bianda_yzs1.mp3");
			})
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
			}, event.target, 1.25)
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					if (player == target) return 6;
					if (target.hp >= target.maxHp / 2) return 2;
					return 3;
				},
				player(player) {
					if (player.hp > 3) return -1;
					return -2;
				},
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	"bianda_yzs_buff": {
		group: ["bianda_yzs_buff_draw"],
		mark: true,
		nopop: true,
		markimage: 'extension/一中杀/image/bianda_yzs_buff.png',
		intro: {
			content: "你变大了！(不可打出手牌中的【闪】；摸牌数和进攻距离-1；退出本状态时展示全部手牌并弃置其中的【闪】)",
		},
		subSkill: {
			draw: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num--;
				},
			},
		},
		mod: {
			globalFrom: function (from, to, distance) {
				return distance + 1;
			},
			"cardEnabled2": function (card) {
				if (['h', 's'].includes(get.position(card)) && card.name == 'shan') return false;
			},
		},
		trigger: {
			player: "dyingBegin",
		},
		filter(event, player) {
			return !_status.jieyicunfashi_yzs_awaken || player.hasSkill("yicunfashi_yzs")
		},
		forced: true,
		locked: true,
		async content(event, trigger, player) {
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
			}, player, 1)
			await player.showHandcards(player, "退出【巨型】");
			let cardx = player.getCards("h", card => card.name == "shan");
			await player.discard(cardx);
			player.removeSkill("bianda_yzs_buff");
		},
	},
	"dapanxiaopan_yzs": {
		nobracket: true,
		locked: true,
		logTarget: "player",
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				const str = storage ? "符卡：转换技：场上角色受到伤害时：你可摸2张牌，令伤害-1" : "符卡：转换技：场上角色受到伤害时：你可失去1点体力，令伤害 + 1";
				return str;
			},
		},
		trigger: {
			global: "damageBegin3",
		},
		filter(event, player) {
			if (event.player.hasSkill("hidden_yzs")) return false;
			if (player.countMark("Fuka_yzs") < 1) return false;
			if (!player.storage.dapanxiaopan_yzs) return player.hp > 1;
			return true
		},
		check(event, player) {
			if (player.countMark("Fuka_yzs") == 1 && !(player.hp < 2 && player.storage.dapanxiaopan_yzs)) return false;
			if (!player.storage.dapanxiaopan_yzs) {
				return player.hp > 2 && get.attitude(player, event.player) < 0;
			} else {
				return get.attitude(player, event.player) > 0;
			}
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			player.changeZhuanhuanji("dapanxiaopan_yzs");
			if (player.storage.dapanxiaopan_yzs) {
				await player.loseHp();
				trigger.num++;
			}
			else {
				await player.draw(2);
				trigger.num--;
			}
		},
		ai: {
			threaten: 1.7,
			expose: 0.4,
			damageBonus:true,
		}
	},
	"jieyicunfashi_yzs": {
		nobracket: true,
		group: ["jieyicunfashi_yzs_sha"],
		subSkill: {
			sha: {
				locked: true,
				forced: true,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					if (!player.storage.jieyicunfashi_yzs) return false;
					if (event.card.name !== "sha") return false;
					return event.targets && event.targets.some(current => {
						return current.hasSkill("bianda_yzs_buff");
					});
				},
				async content(event, trigger, player) {
					if (trigger.addCount === false) return;
					trigger.addCount = false;
					player.getStat().card.sha--;
				}
			}
		},
		locked: true,
		forced: true,
		init: function (player) {
			if (!player.storage.jieyicunfashi_yzs) {
				player.storage.jieyicunfashi_yzs = false;
				player.markSkill("jieyicunfashi_yzs");
			}
		},
		trigger: {
			player: "changeHp",
		},
		filter(event, player) {
			if (player.storage.jieyicunfashi_yzs) return false;
			return player.getHandcardLimit() > 14;
		},
		async content(event, trigger, player) {
			await player.useSkill("jieyicunfashi_yzs_awaken");
		},
		mod: {
			targetInRange: function (card, player, target) {
				if (!player.storage.jieyicunfashi_yzs) return;
				if (target.hasSkill("bianda_yzs_buff") && card.name == "sha") return true;
			},
			cardUsableTarget(card, player, target) {
				if (!player.storage.jieyicunfashi_yzs) return;
				if (target.hasSkill("bianda_yzs_buff") && card.name == "sha") return true;
			},
		},
	},
	"jieyicunfashi_yzs_awaken": {
		nobracket: true,
		popup: false,
		unique: true,
		juexingji: true,
		skillAnimation: "epic",
		animationColor: "thunder",
		async content(event, trigger, player) {
			player.storage.jieyicunfashi_yzs = true;
			player.markSkill("jieyicunfashi_yzs");
			game.broadcastAll(() => {
				if (!_status.jieyicunfashi_yzs_awaken) {
					_status.jieyicunfashi_yzs_awaken = false;
				}
				_status.jieyicunfashi_yzs_awaken = true;
				_status.tempMusic = `ext:一中杀/audio/輝く針の小人族　～ Little Princess.mp3`;
				game.playBackgroundMusic();
				ui.background.setBackgroundImage('extension/一中杀/image/background/jieyicunfashi_yzs_awaken.png');
			});
		}
	},
	//琪露诺
	"perfectArithmetic_yzs": {
		nobracket: true,
		"prompt2": "你可摸1张牌并与对方拼点：若你胜，你令此【杀】无效或不可响应；若否，你摸2张牌，然后给予对方其中一张。",
		locked: true,
		charlotte: true,
		unique: true,
		frequent: true,
		group: ["perfectArithmetic_yzs_gain", "perfectArithmetic_yzs_baka"],
		subSkill: {
			gain: {
				locked: true,
				forced: true,
				trigger: {
					player: ["chooseToCompareAfter", "compareMultipleAfter"],
					target: ["chooseToCompareAfter", "compareMultipleAfter"],
				},
				filter(event, player) {
					if (event.preserve) {
						return false;
					}
					if (player == event.player) {
						if (event.num1 > event.num2) {
							return true;
						}
					} else {
						if (event.num1 < event.num2) {
							return true;
						}
					}
					return false;
				},
				async content(event, trigger, player) {
					if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
				},
			},
			baka: {
				locked: true,
				trigger: {
					player: "compareCardShowBefore",
					target: "compareCardShowBefore",
				},
				filter(event, player) {
					return (player.countMark("Fuka_yzs") > 0);
				},
				prompt: "符卡：你的拼点牌亮出前，你可令之点数视为“9”。然后若胜负结果因此改变，你摸1张牌",
				check(event, player) {
					if (player.countCards("h")<4&&player.countMark("Fuka_yzs") > 1 && event[event.player == player ? "card1" : "card2"].number < 9) return true;
					return false;
				},
				async content(event, trigger, player) {
					player.removeMark("Fuka_yzs");
					trigger.cirno = "tie";
					if (get.number(trigger.card1) > get.number(trigger.card2)) trigger.cirno = "win";
					if (get.number(trigger.card1) < get.number(trigger.card2)) trigger.cirno = "lose";
					trigger[trigger.player == player ? "card1" : "card2"].number = 9;
					game.log(player, "的拼点牌点数修改为9");
					player
						.when("chooseToCompareAfter")
						.filter(evt => evt === trigger)
						.then((trigger) => {
							let bool = false;
							if (trigger.result.tie) bool = (trigger.cirno != "tie");
							else if (trigger.result.bool) bool = (trigger.cirno != "win");
							else if (!trigger.result.bool) bool = (trigger.cirno != "lose");
							if (bool) {
								player.draw();
							}
							else {
								player.chat("笨蛋!");
								game.log(player, "是大Baka!");
							}
						});
				},
			},
		},
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (event.card.name != "sha") return false;
			return true;
		},
		check(event, player) {
			const target = player == event.player ? event.target : event.player;
			if (get.attitude(player, target) < 0) return true;
			return false;
		},
		async content(event, trigger, player) {
			await player.draw();
			const target = player == trigger.player ? trigger.target : trigger.player;
			if (!player.canCompare(target)) return;
			const compare = await player.chooseToCompare(target).forResult();
			if (compare.bool) {
				let result = await player.chooseButton([
					"令此【杀】无效或不可响应",
					[
						[
							["neutralize", "无效"],
							["directHit", "不可响应"],
						],
						"textbutton",
					],
				])
					.set("forced", true)
					.set("selectButton", 1)
					.set("ai", (button) => {
						const target = get.event().target
						const player=get.event().player
						if (button.link == "neutralize" && get.attitude(player, target) >0) return 5;
						if (button.link == "directHit" &&get.attitude(player,target)<0) return 5;
					})
					.set("target",target)
					.forResult();
				if (!result.bool) return
				if (result.links[0] == "neutralize") {
					trigger.getParent().excluded.add(trigger.target);
					game.log(trigger.card, "对", trigger.target, "无效");
				}
				if (result.links[0] == "directHit") {
					trigger.directHit.add(trigger.target);
				}
			} else {
				await player.draw(2);
				if (!player.countCards("h")) return;
				const next = player.chooseCard("h", function (card) {
					return true;
				});
				var prompt = "完美算术：交给";
				prompt += get.translation(target);
				prompt += "1张手牌";
				next.set("forced", true);
				next.set("prompt", prompt);
				const result = await next.forResult();
				const cards = result.cards || [];
				if (cards.length) {
					await player.give(cards, target);
				}
			}
		},
	},
	"perfectFreeze_yzs": {
		nobracket: true,
		zhuanhuanji: true,
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		enable: "phaseUse",
		init: function (player) {
			if (!player.storage.perfectFreeze_yzs) {
				player.storage.perfectFreeze_yzs = false;
				player.markSkill("perfectFreeze_yzs");
			}
		},
		filter(event, player) {
			if (player.hasSkill("perfectFreeze_yzs_used") && !player.countMark("Fuka_yzs")) return false;
			if (!game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canCompare(target) && target != player
			})) return false;
			return player.countCards("h") > 0;
		},
		filterTarget(card, player, current) {
			if (player == current) return false;
			if (current.hasSkill("hidden_yzs")) return false;
			return player.canCompare(current);
		},
		async content(event, trigger, player) {
			if (player.hasSkill("perfectFreeze_yzs_used")) player.removeMark("Fuka_yzs");
			else player.addTempSkill("perfectFreeze_yzs_used", "phaseUseAfter");
			const result = await player.chooseToCompare(event.target).forResult();
			if (result.tie) { return }
			var players = [player, event.target];
			if (result.bool) players.reverse();
			players[1].addSkill("perfectFreeze_yzs_buff");
			const cards = get.cards(1);
			let next = players[1].addToExpansion(cards, "gain2", player)
			next.gaintag.add("perfectFreeze_yzs_buff");
			await next;
			if (players[1].countExpansions("perfectFreeze_yzs_buff") >= 2) {
				let damageAudioInfo = "effect/damage_ice.mp3";
				game.broadcastAll(function (damageAudioInfo) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo);
					}
				}, damageAudioInfo);
				game.broadcastAll(function (target) {
					if (target.node.avatar) {
						let overlay = document.createElement('div');
						overlay.style.position = 'absolute';
						overlay.style.top = '0px'; // 可根据实际调整
						overlay.style.left = '0px';
						overlay.style.width = '100%';
						overlay.style.height = '100%'; // 覆盖头部区域
						overlay.style.backgroundSize = "cover";
						overlay.style.opacity = 0.7;
						overlay.style.backgroundImage = "url('extension/一中杀/image/background/yzsIce_skill.png')"; // 替换为你自己的图片路径
						overlay.style.backgroundRepeat = 'no-repeat';
						overlay.style.backgroundPosition = 'center top';
						overlay.style.zIndex = '10';
						overlay.style.pointerEvents = 'none'; // 避免阻挡点击事件

						// 清除旧图层防止重复添加
						if (target.node.avatar.overlayElement_yzsIce_skill) {
							target.node.avatar.overlayElement_yzsIce_skill.remove();
						}

						target.node.avatar.appendChild(overlay);  //将新创建的遮罩图层
						target.node.avatar.overlayElement_yzsIce_skill = overlay;//将这个遮罩图层保存为 avatar 元素的一个自定义属性,便于后续操作（如修改或清除该图层），避免重复查找或创建；
					}
				}, players[1])
			}
			if (!player.storage.perfectFreeze_yzs) {
				await players[1].draw();
				player.storage.perfectFreeze_yzs = true;
				player.markSkill("perfectFreeze_yzs");
			}
			else {
				if (players[1].countDiscardableCards("he") > 0) await players[1].chooseToDiscard("he", true, 1);
				player.storage.perfectFreeze_yzs = false;
				player.markSkill("perfectFreeze_yzs");
			}
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					return -2;
				},
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	"perfectFreeze_yzs_buff": {
		nobracket: true,
		marktext: "冰晶",
		markimage: 'extension/一中杀/image/perfectFreeze_yzs_buff.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("perfectFreeze_yzs_buff");
				dialog.addAuto(cards);
			},
		},
		popup: false,
		locked: true,
		forced: true,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		async content(event, trigger, player) {
			game.broadcastAll(function (target) {
				if (target.node.avatar && target.node.avatar.overlayElement_yzsIce_skill) {
					target.node.avatar.overlayElement_yzsIce_skill.remove();
					delete target.node.avatar.overlayElement_yzsIce_skill;
				}
			}, player);
			const cards = player.getExpansions("perfectFreeze_yzs_buff");
			if (cards.length > 0) { await player.gain(cards, "gain2"); }
			if (cards.length > 1) {
				if (player.hasSkill("perfectFreeze_yzs")) await player.recover();
				else {
					const evt = event.getParent("phase", true);
					if (evt?.player == player) {
						game.log(player, "结束了回合");
						evt.num = evt.phaseList.length;
						evt.goto(11);
					}
					trigger.cancel();
				}
			}
			player.removeSkill("perfectFreeze_yzs_buff")
		}
	},
	"perfectFreeze_yzs_used": {
		charlotte: true,
		mark: true,
		onremove: true,
		intro: {
			content: "已免费发动过【完美冻结】",
		},
		sub: true,
		sourceSkill: "perfectFreeze_yzs",
		"_priority": 0,
	},
	//火风暴
	"FireStorm_skill": {
		group: ["FireStorm_skill_instant"],
		subSkill: {
			instant: {
				name: "火风暴",
				log: false,
				popup: false,
				locked: true,
				stormskill: true,
				async content(event, trigger, player) {
					player.addSkill("FireStorm_skill_instant_buff");
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		forced: true,
		LastDo: true,
		trigger: {
			player: ["useCard0", "useCardToTargeted"]
		},
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (event.card.storage.yzsNature?.includes("fire")) return false;
			return true;
		},
		async content(event, trigger, player) {
			if (trigger.card.nature) {
				if (!trigger.card.storage.yzsNature) trigger.card.storage.yzsNature = [trigger.card.nature];
				else trigger.card.storage.yzsNature.push(trigger.card.nature);
			}
			if (!trigger.card.storage.yzsNature) trigger.card.storage.yzsNature = ["fire"];
			else trigger.card.storage.yzsNature.unshift("fire");
			game.log(trigger.card, "被赋予了火属性")
		},
	},
	"FireStorm_skill_instant_buff": {
		name: "火风暴加伤",
		forced: true,
		popup: false,
		group: ["FireStorm_skill_instant_buff_add_damage"],
		subSkill: {
			"add_damage": {
				trigger: {
					player: "useCard1",
				},
				filter(event) {
					return event.card && event.card.name == "sha";
				},
				forced: true,
				charlotte: true,
				firstDo: true,
				content() {
					if (!trigger.baseDamage) {
						trigger.baseDamage = 1;
					}
					trigger.baseDamage++;
					player.removeSkill("FireStorm_skill_instant_buff")
				},
				temp: true,
				vanish: true,
				silent: true,
				popup: false,
				nopop: true,
				sub: true,
				sourceSkill: "FireStorm_skill_instant_buff",
				"_priority": 0,
			},
		},
		mark: true,
		onremove: true,
		markimage: 'extension/一中杀/image/FireStorm_skill_instant_buff.png',
		intro: {
			content: "本自轮次下张【杀】造成伤害+1",
		},
		trigger: {
			player: "phaseBegin",
		},
		filter: function (event, trigger, player) {
			if (trigger.skill) return false;
			return true;
		},
		content() { player.removeSkill("FireStorm_skill_instant_buff") },
		sub: true,
		sourceSkill: "FireStorm_skill",
		"_priority": 0,
	},
	"ThunderStorm_skill": {
		group: ["ThunderStorm_skill_instant"],
		subSkill: {
			instant: {
				name: "雷风暴",
				popup: false,
				log: false,
				locked: true,
				stormskill: true,
				async content(event, trigger, player) {
					if (!game.hasPlayer(cur => !cur.hasSkill("hidden_yzs"))) return;
					const result = await player
						.chooseTarget("横置或重置1~2名角色", [1, 2], true, (card, player, target) => {
							return !target.hasSkill("hidden_yzs")
						})
						.set("ai", (target) => {
							let player = get.event().player
							return get.effect(target, {name:"tiesuo"},player,player)
						})
						.forResult();
					if (result.bool) {
						var targets = result.targets.sortBySeat();
						targets.forEach(i => i.link());
					}
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		forced: true,
		LastDo: true,
		trigger: {
			player: ["useCard0", "useCardToTargeted"]
		},
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (event.card.storage.yzsNature?.includes("thunder")) return false;
			return true;
		},
		async content(event, trigger, player) {
			if (trigger.card.nature) {
				if (!trigger.card.storage.yzsNature) trigger.card.storage.yzsNature = [trigger.card.nature];
				else trigger.card.storage.yzsNature.push(trigger.card.nature);
			}
			if (!trigger.card.storage.yzsNature) trigger.card.storage.yzsNature = ["thunder"];
			else trigger.card.storage.yzsNature.unshift("thunder");
			game.log(trigger.card, "被赋予雷属性")
		},
	},
	"WaterStorm_skill": {
		group: "WaterStorm_skill_instant",
		subSkill: {
			instant: {
				name: "水风暴",
				popup: false,
				locked: true,
				log: false,
				stormskill: true,
				async content(event, trigger, player) {
					const result = await player
						.chooseTarget("令1名角色获得【洗礼】", 1, (card, player, target) => {
							return !target.hasSkill("hidden_yzs") && !target.hasSkill("WaterStorm_skill_instant_buff")
						})
						.set("ai", target => {
							let player = _status.event.player;
							let att = get.attitude(player, target);
							if (att > 2) return true;
							return att / 3;
						})
						.forResult();
					if (result.bool) {
						var target = result.targets[0];
						target.addSkill("WaterStorm_skill_instant_buff");
					}
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		forced: true,
		firstDo: true,
		trigger: {
			player: "phaseBegin",
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.recover("nosource");
		},
		priority: -25,
	},
	"WaterStorm_skill_instant_buff": {
		forced: true,
		nopop:true,
		mark: true,
		onremove: true,
		markimage: 'extension/一中杀/image/WaterStorm_skill_instant_buff.png',
		intro: {
			content: "你进入濒死/回合开始时恢复2/1点体力，然后失去本技能",
		},
		trigger: {
			player: ["dying", "phaseBegin"],
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			player.removeSkill("WaterStorm_skill_instant_buff");
			let num = 1;
			if (trigger.name == "dying") num = 2;
			await player.recover(num,"nosource");
		},
		sub: true,
		sourceSkill: "WaterStorm_skill",
		"_priority": 0,
	},
	"IceStorm_skill": {
		group: "IceStorm_skill_instant",
		subSkill: {
			instant: {
				name: "冰风暴",
				log: false,
				popup: false,
				locked: true,
				stormskill: true,
				async content(event, trigger, player) {
					var evt = _status.event.getParent("phase");
					const moveElementAfter = function (sourceArr, elementToMove, targetElement) {
						const arr = [...sourceArr];
						const sourceIndex = arr.indexOf(elementToMove);
						const targetIndex = arr.indexOf(targetElement);
						if (sourceIndex === -1 || targetIndex === -1) {
							return false
						}
						if (sourceIndex === targetIndex) {
							return false
						}
						let removedElement;
						[removedElement] = arr.splice(sourceIndex, 1);
						const insertIndex = sourceIndex < targetIndex
							? targetIndex  // 如果源元素在目标元素前面
							: targetIndex + 1; // 如果源元素在目标元素后面
						arr.splice(insertIndex, 0, removedElement);
						return arr;
					};
					if (moveElementAfter(evt.phaseList, "phaseDraw", "phaseDiscard")) evt.phaseList = moveElementAfter(evt.phaseList, "phaseDraw", "phaseDiscard");
					for (const phase of lib.phaseName) {
						const evt1 = event.getParent(phase);
						if (evt1?.name === phase) {
							const phaseIndex = evt.phaseList.indexOf(phase);
							evt.num = phaseIndex;
						}
					}
					if (!game.hasPlayer(cur => {
						return !cur.hasSkill("hidden_yzs");
					})) return;
					let result = await player.chooseCardTarget("h", false)
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return player != target
						})
						.set("filterCard", (card, player, target) => {
							const targets = ui.selected.targets;
							if (targets.length == 2) {
								if (Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) <= ui.selected.cards.length) {
									return false;
								}
							}
							return true;
						})
						.set("selectCard", [0, Infinity])
						.set("selectTarget", 2)
						.set("multitarget", true)
						.set("complexCard", true)
						.set("multiline", true)
						.set("filterOk", () => {
							const targets = ui.selected.targets;
							if (targets.length != 2) {
								return false;
							}
							return Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) == ui.selected.cards.length;
						})
						.set("prompt", "冰风暴")
						.set("prompt2", "你弃置X张手牌，然后令2名手牌数之差为X的其他角色交换手牌")
						.forResult();
					if (!result.bool) return;
					else {
						await player.discard(result.cards);
						await result.targets[0].swapHandcards(result.targets[1])
					}
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		log: false,
		forced: true,
		firstDo: true,
		trigger: {
			player: "phaseBegin",
			global:"yzs_changeStormEnd"
		},
		forced: true,
		filter(event, player) {
			if (event.name == "yzs_changeStorm") return event.stormskill =="IceStorm_skill"
			return true;
		},
		async content(event, trigger, player) {
			const moveElementAfter = function (sourceArr, elementToMove, targetElement) {
				const arr = [...sourceArr];
				const sourceIndex = arr.indexOf(elementToMove);
				const targetIndex = arr.indexOf(targetElement);
				if (sourceIndex === -1 || targetIndex === -1) {
					return false
				}
				if (sourceIndex === targetIndex) {
					return false
				}
				const [removedElement] = arr.splice(sourceIndex, 1);
				const insertIndex = sourceIndex < targetIndex
					? targetIndex  // 如果源元素在目标元素前面
					: targetIndex + 1; // 如果源元素在目标元素后面
				arr.splice(insertIndex, 0, removedElement);
				return arr;
			};
			let evt = trigger;
			if (evt.name != "phase") evt = evt.getParent("phase");
			if (evt?.name == "phase" && moveElementAfter(evt.phaseList, "phaseDraw", "phaseDiscard")) evt.phaseList = moveElementAfter(evt.phaseList, "phaseDraw", "phaseDiscard")
		},
		"_priority": -25,
	},
	"BulletStorm_skill": {
		group: "BulletStorm_skill_instant",
		subSkill: {
			instant: {
				name: "枪弹风暴",
				popup: false,
				log: false,
				locked: true,
				stormskill: true,
				async content(event, trigger, player) {
					player.addSkill("BulletStorm_skill_instant_buff");
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		forced: true,
		trigger: {
			player: "phaseEnd",
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.damage("nosource");
		},
		priority: 25,
	},
	"BulletStorm_skill_instant_buff": {
		mod: {
			targetInRange(card, player, target) {
				if (card.name == "sha") return true;
			},
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
		},
		forced: true,
		popup: false,
		group: ["BulletStorm_skill_instant_buff_sha"],
		subSkill: {
			sha: {
				popup: false,
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					if (event.card.name != "sha") {
						return false;
					}
					return true;
				},
				forced: true,
				async content(event, trigger, player) {
					player.removeSkill("BulletStorm_skill_instant_buff")
					if (trigger.addCount === false) return;
					trigger.addCount = false;
					trigger.player.getStat().card.sha--;
				},
				sub: true,
				sourceSkill: "BulletStorm_skill_instant_buff",
				"_priority": 0,
			},
		},
		mark: true,
		onremove: true,
		markimage: 'extension/一中杀/image/BulletStorm_skill_instant_buff.png',
		intro: {
			content: "本自轮次下张【杀】无次数距离限制",
		},
		priority:31,
		trigger: {
			player: "phaseBegin",
		},
		filter: function (event, trigger, player) {
			if (trigger.skill) return false;
			return true;
		},
		async content(event, trigger, player) {
			player.removeSkill("BulletStorm_skill_instant_buff")
		},
		sub: true,
		sourceSkill: "BulletStorm_skill",
		"_priority": 0,
	},
	"WindStorm_skill": {
		group: ["WindStorm_skill_instant", "WindStorm_skill_g"],
		subSkill: {
			instant: {
				popup: false,
				log: false,
				locked: true,
				stormskill: true,
				async content(event, trigger, player) {
					await player.draw(2);
				}
			},
			g: {
				name: "狂凪",
				locked: true,
				popup: false,
				stormskill: true,
				enable: "phaseUse",
				position: "h",
				discard: false,
				lose: false,
				delay: false,
				filterCard: function (card, player, event) {
					return true;
				},
				selectCard: -1,
				filter(event, player) {
					return player.countCards("h") > 0;
				},
				async content(event, trigger, player) {
					player.tempBanSkill("WindStorm_skill_g",false)
					const cards = player.getCards("h");
					const num = cards.length;
					let next = player.lose(cards, ui.discardPile, "visible");
					next.untrigger(true)
					await next
					await player.$throw(cards, 1000);
					game.log(player, "将", cards, "置入了弃牌堆");
					await player.directgain(get.cards(num))
				},
				ai: {
					order: 2,
					result: {
						player(player) {
							return 0.5*player.countCards("h");
						}
					}
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
	},
	//帕秋莉
	"steadyLibrary_yzs": {
		nobracket: true,
		locked: true,
		charlotte: true,
		unique: true,
		forced: true,
		group: ["steadyLibrary_yzs_gain", "steadyLibrary_yzs_damage"],
		trigger: { player: "phaseBegin" },
		filter(event, player) { return player.countMark("Fuka_yzs") < get.character(player.name).Fuka },
		async content(event, trigger, player) {
			const addnum = get.character(player.name).Fuka - player.countMark("Fuka_yzs");
			if (addnum) player.addMark("Fuka_yzs", addnum);
		},
		subSkill: {
			gain: {
				name:"水&木符「水精灵」",
				trigger: {
					player: "phaseEnd",
				},
				sourceSkill: "steadyLibrary_yzs",
				filter(event, player) {
					if (_status._yzsStorm != "WaterStorm") return false
					return player.countMark("Fuka_yzs") < get.character(player.name).Fuka
				},
				locked: true,
				forced: true,
				async content(event, trigger, player) {
					player.addMark("Fuka_yzs");
				},
				"_priority": 0,
				sub: true,
			},
			damage: {
				trigger: {
					source: "damageBegin1",
				},
				sourceSkill: "steadyLibrary_yzs",
				filter(event, player) {
					const evt = event;
					if (!evt || !evt.card || !evt.card.storage || !evt.card.storage.yzsNature || !evt.card.storage.yzsNature.length) return false;
					if (!event.nature) {
						return evt.card.storage.yzsNature.length > 1;
					}
					if (event.nature) {
						return evt.card.storage.yzsNature.filter(function (cur) { return cur != event.nature }).length
					}
					return false;
				},
				locked: true,
				forced: true,
				async content(event, trigger, player) {
					trigger.num++;
				},
				"_priority": 1,
				sub: true,
			}
		}
	},
	"wiseStone_yzs": {
		nobracket: true,
		group: ["wiseStone_yzs_wushuang", "wiseStone_yzs_sha", "wiseStone_yzs_lose", "wiseStone_yzs_lose2", "wiseStone_yzs_gain","wiseStone_yzs_use"],
		subSkill: {
			Dbuff2: {
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return Infinity;
						}
					},
				},
			},
			wushuang: {
				trigger: {
					player: "useCardToPlayered",
				},
				popup:false,
				forced: true,
				filter(event, player) {
					return event.card.name == "sha" && !event.getParent().directHit.includes(event.target) && event.getParent().wiseStone_yzs_Hbuff;
				},
				async content(event, trigger, player) {
					const id = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[id]) {
						map[id] = {};
					}
					if (typeof map[id].shanRequired == "number") {
						map[id].shanRequired++;
					} else {
						map[id].shanRequired = 2;
					}
				},
			},
			Hbuff: {
				name:"藏书",
				charlotte: true,
				forced: true,
				trigger: {
					global:"useCard",
				},
				filter(event, player) {
					return event.card.name=="sha"
				},
				async content(event,trigger,player) {
					trigger.storage.wiseStone_yzs_Hbuff = true;
					await player.removeSkill("wiseStone_yzs_Hbuff")
				}
			},
			Dbuff: {
				name:"藏书",
				charlotte: true,
				forced: true,
				trigger: {
					global: "useCard1",
				},
				filter(event, player) {
					return event.card.name == 'sha';
				},
				async content(event, trigger, player) {
					trigger.addCount = false;
					trigger.player.getStat().card.sha--;
					game.removeGlobalSkill("wiseStone_yzs_Dbuff2")
					await player.removeSkill("wiseStone_yzs_Dbuff")
				}
			},
			sha: {
				locked:true,
				trigger: {
					player: "useCardToPlayered",
				},
				logTarget: "target",
				filter(event, player) {
					if (event.card.name != "sha") {
						return false;
					}
					return player.countExpansions("wiseStone_yzs") > 0;
				},
				async cost(event, trigger, player) {
					let cards = player.getExpansions("wiseStone_yzs")
					let result = await player.chooseButton(["贤者之石", "你可展示并给予"+get.translation(trigger.target)+"1张【藏书】", cards], false)
						.set("filterCardx", (card, player) => {
							return get.suit(card)
						})
						.set("ai", (button) => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.suit(button) == "spade") {
							//	game.log(1)
								return -2 * get.attitude(player, target);
							}
							if (get.attitude(player, target) > 0) return get.value(button);
							return 3 - get.value(button);
						})
						.set("target",trigger.target)
						.forResult()
					if (result.bool == false) return
					event.result = {
						bool: result.bool,
						cost_data: result.links[0],
					};
				},
				async content(event, trigger, player) {
					let suit;
					if (get.suit(event.cost_data)) suit = get.suit(event.cost_data);
					await player.showCards("【贤者之石】展示牌", event.cost_data)
					await player.give(event.cost_data, trigger.target);
					if (suit == "heart") {
						trigger.getParent().wiseStone_yzs_Hbuff = true;
					}
					if (suit == "diamond" && trigger.addCount !== false) {
						trigger.getParent().addCount = false;
						trigger.getParent().player.getStat().card.sha--;
					}
					if (suit == "spade") {
						if (trigger.target.countDiscardableCards("he") > 0) {
							trigger.target.chooseToDiscard("he", true, Math.min(2, trigger.target.countDiscardableCards("he")));
						}
					}
					if (suit == "club") {
						const result=await player.chooseTarget("藏书：令1名角色回复1点体力", function (card, player, target) {
							return !target.hasSkill("hidden_yzs");
						})
							.set("ai", function (target) {
							return get.recoverEffect(target, player, player);
							})
							.forResult();
						if (result.bool) { await result.targets[0].recover(); }
					}
				},
			},
			lose: {
				priority:-3,
				popup:false,
				forced: true,
				trigger: {
					player: "loseBegin",
				},
				filter(event, player) {
					return event.cards.some(card => card.gaintag.includes("wiseStone_yzs"))
				},
				async content(event, trigger, player) {
					let stones = trigger.cards.filter(card => card.gaintag.includes("wiseStone_yzs"))
					let cards = player.getExpansions("wiseStone_yzs").filter(card=>!stones.includes(card))
					if (!cards.length) player.getStat().card.sha = 0;
					const suit = get.suit(trigger.cards.filter(card => card.gaintag.includes("wiseStone_yzs")&&get.suit(card))[0])
					if (suit == "heart") {
						player.popup("火神之光")
						if (_status._yzsStorm != "FireStorm") player.yzs_changeStorm("FireStorm")
					}
					if (suit == "diamond") {
						player.popup("绿色风暴")
						if (_status._yzsStorm != "WindStorm") await player.yzs_changeStorm("WindStorm")
					}
					if (suit == "spade") {
						player.popup("风灵号角")
						if (_status._yzsStorm != "ThunderStorm") await player.yzs_changeStorm("ThunderStorm")
					}
					if (suit == "club") {
						player.popup("水精公主")
						if (_status._yzsStorm != "WaterStorm") await player.yzs_changeStorm("WaterStorm")
					}
				},
				sub: true,
				sourceSkill: "wiseStone_yzs",
				"_priority": 0,
			},
			lose2: {
				priority: -4,
				popup: false,
				forced: true,
				trigger: {
					player: ["loseBegin", "loseAfter"],
				},
				filter(event, player) {
					if (event.wiseStone_yzs) {
						return !player.countExpansions("wiseStone_yzs");
					}
					let cards = event.cards.filter(card => card.gaintag.includes("wiseStone_yzs"));
					if (!cards.length) return false;
					let cardx = player.getExpansions("wiseStone_yzs");
					if (!cardx.length) return false;
					cardx = cardx.filter(c => !cards.includes(c));
					return !cardx.length;
				},
				async content(event, trigger, player) {
					if (trigger.wiseStone_yzs) {
						if (!player.countExpansions("wiseStone_yzs")) {
							const cards = get.cards(3);
							let next = player.addToExpansion(cards, "draw")
							next.gaintag.add("wiseStone_yzs");
							await next;
						}
					} else {
						trigger.wiseStone_yzs = true;
					}
				},
			},
			gain: {
				priority: 41,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0) && !player.countExpansions("wiseStone_yzs")
				},
				async content(event, trigger, player) {
					const cards = get.cards(3);
					let next = player.addToExpansion(cards, "draw")
					next.gaintag.add("wiseStone_yzs");
					await next;
				}
			},
			use: {
				name: "藏书",
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard(player, name) {
					if (player.getExpansions("wiseStone_yzs").some(card => card.name == name && (get.type(card) == "trick") || get.type(card) == "delay")) {
						return true;
					}
				},
				filter(event, player) {
					if (event.responded || event.wiseStone_yzs_use) {
						return false;
					}
					return player.getExpansions("wiseStone_yzs").some(card => event.filterCard(card, player, event) && (get.type(card) == "trick") || get.type(card) == "delay");
				},
				chooseButton: {
					dialog(event, player) {
						return ui.create.dialog("藏书", player.getExpansions("wiseStone_yzs"), "hidden");
					},
					filter(button, player) {
						if (get.type(button.link) != "trick" && get.type(button.link) != "delay")return false;
						const evt = _status.event.getParent();
						return evt.filterCard(button.link, player, evt);
					},
					check(button) {
						const card = button.link,
							player = get.player();
						return player.getUseValue(card);
					},
					backup(links, player) {
						return {
							filterCard(card) {
								return card === lib.skill.wiseStone_yzs_use_backup.card;
							},
							selectCard: -1,
							viewAs: links[0],
							card: links[0],
							position: "x",
						};
					},
					prompt(links, player) {
						return "藏书：请选择" + get.translation(links[0]) + "的目标";
					},
				},
				ai: {
					order: 8,
					effect: {
						target(card, player, target, effect) {
							if (get.tag(card, "respondShan")) {
								return 0.7;
							}
							if (get.tag(card, "respondSha")) {
								return 0.7;
							}
						},
					},
					respondShan: true,
					respondSha: true,
					result: {
						player(player) {
							return get.event().dying ? get.attitude(player, get.event().dying) : 1;
						},
					},
				},
			}
		},
		marktext: "书",
		markimage: 'extension/一中杀/image/wiseStone_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("wiseStone_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【藏书】";
			},
		},
		filter(event, player) { return player.countMark("Fuka_yzs") > 0 },
		enable: "phaseUse",
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			await player.draw(3);
		},
		ai: {
			order: 9,
			result: {
				player(player, target) {
					if (!player.countExpansions("wiseStone_yzs")) return 8;
					if (player.countCards("h") > 4) return 0;
					return 2
				},
			},
			threaten: 1.2
		},
	},
	"silentSelene_yzs": {
		nobracket: true,
		locked: true,
		audio: "ext:一中杀/audio/skill:1",
		"prompt2": "你可将1张【藏书】展示并给予对方，然后无效之。",
		trigger: {
			source: "damageBegin2",
			player: "damageBegin4",
		},
		async cost(event, trigger, player) {
			let cards = player.getExpansions("wiseStone_yzs")
			const receiver = player == trigger.source ? trigger.player : trigger.source;
			const str =  "你可给予" + get.translation(receiver) + "1张【藏书】，无效对" + get.translation(trigger.player) + "的伤害"
			let result = await player.chooseButton(["贤者之石",str, cards], false)
				.set("filterCardx", (card, player) => {
					return true;
				})
				.set("ai", (button) => {
					const player = get.event().player;
					const target = get.event().target;
					const targetx = get.event().targetx;
					if (get.attitude(player, targetx) < 0) return 0;
					if (get.suit(button.link) == "spade") {
					//	game.log(1)
						return -2 * get.attitude(player, target);
					}
					if (get.attitude(player, target) > 0) return get.value(button)+3;
					return 6 - get.value(button);
				})
				.set("targetx",trigger.player)
				.set("target", receiver)
				.forResult()
			if (result.bool == false) return
			event.result = {
				bool: result.bool,
				cost_data: result.links[0],
			};
		},
		filter(event, player) {
			if (!player.countMark("Fuka_yzs") || !player.countExpansions("wiseStone_yzs")) return false;
			if (player == event.source && !event.player) return false;
			if (player == event.player && !event.source) return false;
			return true;
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			const target = player == trigger.player ? trigger.source : trigger.player;
			await player.showCards("【沉静的月神】展示牌",event.cost_data)
			await player.give(event.cost_data, target);
			trigger.cancel();
			let suit;
			if (get.suit(event.cost_data)) suit = get.suit(event.cost_data);
			if (suit == "heart") {
				await player.addSkill("wiseStone_yzs_Hbuff");
			}
			if (suit == "diamond") {
				await player.addSkill("wiseStone_yzs_Dbuff");
				game.addGlobalSkill("wiseStone_yzs_Dbuff2");
			}
			if (suit == "spade") {
				if (target.countDiscardableCards("he") > 0) {
					target.chooseToDiscard("he", true, Math.min(2, target.countDiscardableCards("he")));
				}
			}
			if (suit == "club") {
				const result = await player.chooseTarget("藏书：令1名角色回复1点体力", function (card, player, target) {
					return !target.hasSkill("hidden_yzs");
				})
					.set("ai", function (target) {
						return get.recoverEffect(target, player, player);
					})
					.forResult();
				if (result.bool) { await result.targets[0].recover(); }
			}
		}
	},
}
export default skills;
