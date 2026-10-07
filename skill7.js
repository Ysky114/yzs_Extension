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
	//蓄能
	yzs_PP: {
		charlotte: true,
		locked: true,
		mark: true,
		marktext: "蓄",
		intro: {
			name: "蓄能",
			content: function (storage, player) {
				const max = player.yzs_getPPLimit()
				return "当前蓄能点：" + player.countMark("yzs_PP") + "/" + max;
			},
		},
	},
	//博丽灵梦
	yzs_bolijiejie: {
		settle(player) {
			const targets = game.filterPlayer();
			const outside = [];
			const inside = [];
			for (let target of targets) {
				if (target.hasSkill("yzs_bolijiejie_buff")) {
					inside.push(target);
				} else {
					outside.push(target)
				}
			}
			var imagePath = lib.assetURL + "/extension/一中杀/image/background/InBarrier_yzs_skill.jpg"
			// 创建一个唯一的ID来标识这个背景
			var id = "yzs_bolijiejie";

			// 2. 广播创建图片
			game.broadcastAll((imagePath, zIndex, id, inside) => {
				if (inside.includes(game.me)) {
					let img = document.getElementById(id);
					if (img) return;
					img = document.createElement("img");
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
				} else {
					let img = document.getElementById(id);
					if (img) {
						img.style.opacity = "0";
						setTimeout(() => {
							img.remove(); // 渐隐后移除
						}, 600);
					}
				}
			}, imagePath, 0, id, inside);
		},

		group: ["yzs_bolijiejie_hujia"],
		subSkill: {
			buff: {
				mark: true,
				charlotte: true,
				marktext: "界",
				intro: {
					content: "当前处于结界内",
					name: "结界内",
				},
			},
			hujia: {
				trigger: {
					player: ["changeHujiaAfter", "dieAfter"]
				},
				priority: 1245,
				forced: true,
				popup: false,
				filter(event, player) {
					if (event.name == "die") return true;
					return event.num < 0 && !player.hujia;
				},
				async content(event, trigger, player) {
					for (let target of game.filterPlayer()) {
						target.removeSkill("yzs_bolijiejie_buff")
						target.removeTip("yzs_bolijiejie_buff");
					}
					lib.skill.yzs_bolijiejie.settle(player);
				},
			},
		},
		nobracket: true,
		enable: "phaseUse",
		filter(event, player) {
			return !game.hasPlayer(target => target.hasSkill("yzs_bolijiejie_buff")) && player.countMark("Fuka_yzs") > 0;
		},
		filterTarget(card, player, target) {
			return !target.hasSkill("hidden_yzs");
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			event.target.addTip("yzs_bolijiejie_buff", "结界内", false);
			event.target.addSkill("yzs_bolijiejie_buff");
			lib.skill.yzs_bolijiejie.settle(player);
			let num = 1 - player.hujia;
			if (num == 0) return;
			await player.changeHujia(num);
		},
		ai: {
			order(item, player) {
				return 9
			},
			result: {
				target: 2,
			},
		},
	},
	yzs_leyuan: {
		global: ["yzs_leyuan_global"],
		group: ["yzs_leyuan_damage"],
		subSkill: {
			damage: {
				locked: true,
				forced: true,
				priority: 23,
				trigger: {
					global: "damageBegin4",
				},
				filter(event, player) {
					if (player.hujia <= 0) return false;
					if (!event.player.hasSkill("yzs_bolijiejie_buff")) return false;
					return event.num >= event.player.hp && event.num > 0;
				},
				async content(event, trigger, player) {
					trigger.cancel();
					await player.changeHujia(-trigger.num);
				}
			},
			global: {
				charlotte: true,
				forced: true,
				priority: 77,
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.hasSkill("yzs_bolijiejie_buff")// && game.hasPlayer(target => target.hasSkill("yzs_bolijiejie")&&target.hujia>0);
				},
				async content(event, trigger, player) {
					trigger.num += player.hasSkill("yzs_leyuan") ? 2 : 1;
				},
				ai: {
					threaten: 2.3,
				},
				mod: {
					maxHandcard(player, num) {
						if (!player.hasSkill("yzs_bolijiejie_buff")) return num;
						//	if (!game.hasPlayer(target => target.hasSkill("yzs_bolijiejie") && target.hujia > 0)) return num;
						if (player.hasSkill("yzs_leyuan")) return num + 2;
						return num + 1;
					},
					globalTo(from, to, num) {
						//	if (!game.hasPlayer(target => target.hasSkill("yzs_bolijiejie") && target.hujia > 0)) return;
						if (from.hasSkill("yzs_leyuan") || to.hasSkill("yzs_leyuan")) return num;
						if (from.hasSkill("yzs_bolijiejie_buff") != to.hasSkill("yzs_bolijiejie_buff")) return Infinity;
					},
				},
			},
		},
		locked: true,
		forced: true,
		priority: 11,
		trigger: {
			player: ["phaseBegin", "useCard", "respond"]
		},
		filter(event, player) {
			if (player.countMark("Fuka_yzs") >= player.getFukaLimit()) return false;
			if (event.name == "phase") return true;
			else if (event.name == "useCard" || event.name == "respond") {
				return get.color(event.card, player) == "red"
			}
			return false;
		},
		async content(event, trigger, player) {
			player.addMark("Fuka_yzs");
		}
	},
	yzs_yinyangyu: {
		subSkill: {
			buff: {
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") return num + player.countMark("yzs_yinyangyu_buff");
					},
				},
				onremove: "storage",
				sub: true,
				sourceSkill: "yzs_yinyangyu",
			},
		},
		nobracket: true,
		enable: "phaseUse",
		filter(event, player) {
			return player.countMark("Fuka_yzs") > 0;
		},
		manualConfirm: true,
		prompt(event, player) {
			if (player.hasSkill("yzs_bolijiejie_buff")) return `${get.poptip("FukaSkill_yzs")}：若你为“结界”内角色，你本回合出【杀】数+1并获得1枚【梦】标记，然后你可令1名角色加入或离开“结界”内`;
			return `${get.poptip("FukaSkill_yzs")}：若你为“结界”外角色，你摸1张牌并指定1名其他角色，你观看其手牌并可与其交换1张手牌`;
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			game.trySkillAudio("bagua_skill");
			player.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
			if (player.hasSkill("yzs_bolijiejie_buff")) {
				player.addTempSkill("yzs_yinyangyu_buff")
				player.addMark("yzs_yinyangyu_buff", 1, false)
				player.addMark("yzs_mengxiangfengyin");
				let result = await player.chooseTarget("你可令1名角色加入或离开“结界”内")
					.set("onChooseTarget", function () {
						const event = get.event();
						event.targetprompt2.add(target => {
							if (!target.classList.contains("selectable")) {
								return;
							}
							if (target.hasSkill("yzs_bolijiejie_buff")) return "逐出结界内";
							return "纳入结界内"
						});
					})
					.set("filterTarget", (card, player, target) => {
						return !target.hasSkill("hidden_yzs")
					})
					.set("ai", target => {
						const player = get.player();
						const att = get.attitude(player, target);
						if (target.hasSkill("yzs_bolijiejie_buff")) return -att;
						return att;
					})
					.forResult();
				if (result?.bool && result.targets?.length) {
					let target = result.targets[0];
					if (target.hasSkill("yzs_bolijiejie_buff")) {
						target.removeSkill("yzs_bolijiejie_buff")
						target.removeTip("yzs_bolijiejie_buff");
					} else {
						target.addTip("yzs_bolijiejie_buff", "结界内", false);
						target.addSkill("yzs_bolijiejie_buff")
					}
					lib.skill.yzs_bolijiejie.settle(player);
				}
			} else {
				await player.draw();
				if (!game.hasPlayer(target => player != target && target.countCards("h") && !target.hasSkill("hidden_yzs"))) return;
				let result = await player.chooseTarget()
					.set("filterTarget", function (card, player, target) {
						return player != target && target.countCards("h") && !target.hasSkill("hidden_yzs")
					})
					.set("forced", true)
					.set("ai", target => {
						const player = get.player();
						return -get.attitude(player, target) + target.countCards("h")
					})
					.set("prompt", "阴阳玉")
					.set("prompt2", "观看并与1名其他角色交换1张手牌")
					.setHiddenSkill(event.name.slice(0, -5))
					.forResult();
				if (!result.bool) return;
				const target = result.targets[0];
				const num = 1;
				let dialog = [];
				function filterButton(button, player) {
					if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
					const select = get.event().selectButton;
					const max = Array.isArray(select) ? select[1] : select;
					let players = ui.selected.buttons.filter(i => get.owner(i.link) == player);
					let targets = ui.selected.buttons.filter(i => get.owner(i.link) != player);
					if (players.length >= max / 2) {
						if (get.owner(button.link) == player) return false;
					}
					if (targets.length >= max / 2) {
						if (get.owner(button.link) != player) return false;
					}
					return true
				}
				function filterOk(button) {
					const player = get.event().player
					if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
					let players = ui.selected.buttons.filter(i => get.owner(i.link) == player);
					let targets = ui.selected.buttons.filter(i => get.owner(i.link) != player);
					if (players.length != targets.length) return false;
					return true;
				}
				function processAI(button) {
					const { player: player3, target: target2 } = get.event();
					const targetCards2 = target2.getCards("h");
					const chosenCards = ui.selected.buttons.map((buttonx) => buttonx.link);
					const targetChosen = chosenCards.filter((card2) => targetCards2.includes(card2));
					const card = button.link;
					const owner = get.owner(card);
					const val = get.value(card) || 1;
					if (owner == target2) {
						if (targetChosen.length > 1) {
							return 0;
						}
						if (targetChosen.length == 0 || player3.hp > 3) {
							return val;
						}
						return 2 * val;
					}
					return 7 - val;
				}

				if (target.getCards("h").length > 0) {
					dialog.push(`${get.translation(target)}的手牌`);
					dialog.push(target.getCards("h"))
				}
				if (player.getCards("h").length > 0) {
					dialog.push(`你的手牌`);
					dialog.push(player.getCards("h"))
				}
				if (!dialog.length) {
					return;
				}
				let next = player.chooseButton([2, 2 * num], dialog);
				next.set("target", target);
				next.set("forced", false);
				next.set("filterButton", filterButton);
				next.set("filterOk", filterOk);
				next.set("complexSelect", true);
				next.set("ai", processAI);
				result = await next.forResult();
				if (result.bool && result.links.length) {
					let cards1 = result.links.filter(i => get.owner(i) == player)
					let cards2 = result.links.filter(i => get.owner(i) != player)
					await player.swapHandcards(target, cards1, cards2);
				}
				await game.delayex();
			}
		},
		ai: {
			order(item, player) {
				if (player.hasSha() && player.getCardUsable("sha") < 1) return 10;
				return 2;
			},
			result: {
				player: 1,
			},
		},
	},
	yzs_mengxiangfengyin: {
		nobracket: true,
		audio: "mengxiangfengyin_yzs",
		nobracket: true,
		marktext: "梦",
		intro: {
			content: "当前有#枚【梦】标记",
			name: "梦",
		},
		enable: "phaseUse",
		filter(event, player) {
			return game.hasPlayer(target => target.hasSkill("yzs_bolijiejie_buff")) && player.countMark("Fuka_yzs") > 0 && player.countMark("yzs_mengxiangfengyin") >= 3;
		},
		filterTarget(card, player, target) {
			return !target.hasSkill("hidden_yzs");
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			const result = await player
				.chooseNumbers('梦想封印', [{ prompt: '请选择你要造成伤害的次数', min: 1, max: Math.floor(player.countMark("yzs_mengxiangfengyin") / 3) }], true)
				.set('processAI', () => {
					return [get.event().numz];
				})
				.set('numz', num)
				.forResult()
			if (result?.bool && result.numbers?.length) {
				let num = result.numbers[0];
				player.removeMark("yzs_mengxiangfengyin", 3 * num);
				while (num--) {
					await event.target.damage();
				}
			}
		},
		ai: {
			order: 2,
			result: {
				target: -2,
			},
		}
	},
	//终末鸟
	yzs_chengjie: {
		group: ["yzs_chengjie_damage"],
		subSkill: {
			damage: {
				forced: true,
				popup: false,
				priority: 89,
				trigger: {
					player: "useCard"
				},
				filter(event, player) {
					//	game.log(event.getParent().name)
					return event.getParent()?.logSkill == "yzs_chengjie"
				},
				async content(event, trigger, player) {
					if (!trigger.baseDamage) trigger.baseDamage = 0;
					trigger.baseDamage++;
				}
			}
		},
		locked: true,
		forced: true,
		popup: false,
		priority: 4,
		mod: {
			cardUsable: function (card, player, num) {
				if (player.countMark("yzs_chengjie")) return;
				if (_status.currentPhase == player) {
					if (card.name == 'sha') return false;
				}
			},
			cardEnabled(card, player) {
				if (player.countMark("yzs_chengjie")) return;
				if (_status.currentPhase == player) {
					if (card.name == 'sha') return false;
				}
			},
		},
		trigger: {
			player: "damageAfter",
			source: 'damageAfter',
		},
		filter(event, player) {
			if (event.player == player) {
				return event.source && player.canUse({ name: "sha" }, event.source, false);
			}
			if (event.source == player) {
				return event.player && player.canUse({ name: "sha" }, event.player, false);
			}
			return false;
		},
		async content(event, trigger, player) {
			let target = player == trigger.source ? trigger.player : trigger.source;
			await player
				.chooseToUse(
					function (card, player, event) {
						var name = get.name(card);
						if (name != "sha") {
							return false;
						}
						return lib.filter.cardEnabled.apply(this, arguments);
					},
					"惩戒：是否对【" + get.translation(target) + "】使用一张【杀】？(此牌伤害+1)"
				)
				.set("logSkill", "yzs_chengjie")
				.set("complexSelect", true)
				.set("filterTarget", function (card, player, target) {
					return target == get.event().sourcex;
				})
				.set("sourcex", target)
				.set("addCount", false);
		},
	},
	yzs_shenpan: {
		locked: true,
		priority: 4,
		mod: {
			cardUsable: function (card, player, num) {
				if (player.countMark("yzs_shenpan")) return;
				if (_status.currentPhase == player) {
					if (get.type2(card, player) == "trick") return false;
				}
			},
			cardEnabled(card, player) {
				if (player.countMark("yzs_shenpan")) return;
				if (_status.currentPhase == player) {
					if (get.type2(card, player) == "trick") return false;
				}
			},
		},
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (get.type2(event.card) != "trick") return false;
			let target = event.player == player ? event.target : event.player;
			return target?.isIn() && player.canCompare(target);
		},
		check(event, player) {
			return get.attitude(player, event.player) < 0 && player.countCards("h") >= event.player.countCards("h");
		},
		prompt(event, player) {
			let target = event.player == player ? event.target : event.player;
			return `是否与 ` + get.translation(target) + ` 拼点？`;
		},
		prompt2: "胜者摸1张牌",
		async content(event, trigger, player) {
			let target = trigger.player == player ? trigger.target : trigger.player;
			let result = await player.chooseToCompare(target).forResult();
			if (result.tie) { return }
			var players = [player, target];
			if (result.bool) players.reverse();
			const winner = players[1];
			const loser = players[0]
			await winner.draw();
		},
	},
	yzs_jianshi: {
		locked: true,
		priority: 4,
		mod: {
			cardUsable: function (card, player, num) {
				if (player.countMark("yzs_jianshi")) return;
				if (_status.currentPhase == player) {
					if (get.type(card, player) == "equip") return false;
				}
			},
			cardEnabled(card, player) {
				if (player.countMark("yzs_jianshi")) return;
				if (_status.currentPhase == player) {
					if (get.type(card, player) == "equip") return false;
				}
			},
		},
		trigger: {
			global: "useCardAfter"
		},
		filter(event, player) {
			return get.type(event.card) == "equip" && player.countCards("he");
		},
		async cost(event, trigger, player) {
			let str = `你可弃置1张装备牌以与${get.translation(trigger.player)}各摸1张牌`
			let next = player.chooseToDiscard("he", false);
			next.set("filterCard", (card) => get.type(card) == "equip")
			next.set("prompt", str)
			next.set("ai", card => {
				const player = get.event().player;
				const target = get.event().target;
				if (get.attitude(player, target) <= 0) return 0;
				return 6 - get.value(card);
			})
			next.set("target", trigger.player)
			next.set("chooseonly", true)
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			await player.draw();
			await trigger.player.draw();
		},
	},
	yzs_ezhao: {
		locked: true,
		forced: true,
		priority: 312,
		trigger: {
			player: "phaseZhunbeiBegin"
		},
		async content(event, trigger, player) {
			let result = await player.chooseButton([
				`每项限1次：准备阶段，你删除【惩戒/审判/监视】的首句描述。均删除后，恢复全部体力，然后失去本技能并获得${get.poptip("yzs_zhongmo")}`,
				[
					[
						["yzs_chengjie", lib.translate["yzs_chengjie_info"]],
						["yzs_shenpan", lib.translate["yzs_shenpan_info"]],
						["yzs_jianshi", lib.translate["yzs_jianshi_info"]],
					],
					"textbutton",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.set("filterButton", function (button) {
					let player = _status.event.player
					return !player.countMark(button.link)
				})
				.set("ai", (button) => {
					return Math.random();
				})
				.forResult();
			if (result?.bool && result.links?.length) {
				let skill = result.links[0];
				player.addMark(skill, 1, false);
				if (player.countMark("yzs_chengjie") && player.countMark("yzs_shenpan") && player.countMark("yzs_jianshi")) {
					await player.recoverTo(player.maxHp)
					player.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
					game.broadcastAll(function (current) {
						_status.tempMusic = `ext:一中杀/audio/Second.mp3`;
						game.playBackgroundMusic();
						ui.background.setBackgroundImage('extension/一中杀/image/background/yzs_ezhao.jpg');
					}, player)
					//player.removeSkill("yzs_ezhao");
					await player.reinitCharacter(player.name1, 'yzs_ThreeBirds2');
					if (player.name2) {
						await player.reinitCharacter(player.name2, 'yzs_ThreeBirds2');
					}
				}
			}
		}
	},
	yzs_zhongmo: {
		group: ["yzs_zhongmo_lose"],
		subSkill: {
			lose: {
				locked: true,
				forced: true,
				priority: 21,
				trigger: {
					player: "loseMaxHpAfter"
				},
				filter(event, player) {
					let num = 0;
					if (player.countMark("yzs_chengjie")) num++;
					if (player.countMark("yzs_shenpan")) num++;
					if (player.countMark("yzs_jianshi")) num++;
					return player.maxHp <= 2 * num - 2;
				},
				async content(event, trigger, player) {
					let result = await player.chooseButton(["你体力上限下降至4/2时，失去【惩戒/审判/监视】其中一个",
						[
							[
								["yzs_chengjie", lib.translate["yzs_chengjie_info"]],
								["yzs_shenpan", lib.translate["yzs_shenpan_info"]],
								["yzs_jianshi", lib.translate["yzs_jianshi_info"]],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							return player.countMark(button.link)
						})
						.set("ai", (button) => {
							return Math.random();
						})
						.forResult();
					if (result?.bool && result.links?.length) {
						let skill = result.links[0];
						player.removeSkill(skill);
						let num = 0;
						if (player.countMark("yzs_chengjie")) num++;
						if (player.countMark("yzs_shenpan")) num++;
						if (player.countMark("yzs_jianshi")) num++;
						if (player.maxHp <= 2 * num - 2) {
							let result = await player.chooseButton(["你体力上限下降至4/2时，失去【惩戒/审判/监视】其中一个",
								[
									[
										["yzs_chengjie", lib.translate["yzs_chengjie_info"]],
										["yzs_shenpan", lib.translate["yzs_shenpan_info"]],
										["yzs_jianshi", lib.translate["yzs_jianshi_info"]],
									],
									"textbutton",
								],
							])
								.set("forced", true)
								.set("selectButton", 1)
								.set("filterButton", function (button) {
									let player = _status.event.player
									return player.countMark(button.link)
								})
								.set("ai", (button) => {
									return Math.random();
								})
								.forResult();
							if (result?.bool && result.links?.length) {
								let skill = result.links[0];
								player.removeSkill(skill);
							}
						};
					}
				}
			},
		},
		locked: true,
		forced: true,
		priority: -2,
		trigger: {
			player: "damageBegin4"
		},
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			if (player.isDamaged()) {
				trigger.cancel();
				await player.loseMaxHp();
				await player.draw(2);
			} else {
				trigger.num++;
			}
		}
	},
	//五条悟
	yzs_SixEyes: {
		locked: true,
		priority: -32,
		trigger: {
			global: "roundStart"
		},
		check(event, player) {
			return player.maxHp - player.countCards("h") > 2;
		},
		async content(event, trigger, player) {
			player.yzs_addPP();
			await player.drawTo(player.maxHp);
			await player.loseHp();
		}
	},
	yzs_wuxiaxian: {
		group: "yzs_wuxiaxian_equip",
		init: function (player, skill) {
			player.addSkill("wuxiaxianshushi_yzs_die", "wuxiaxianshushi_yzs_revive");
		},
		subSkill: {
			equip: {
				yzs_PPSkill: true,
				equipSkill: true,
				noHidden: true,
				inherit: "yzs_wuxiaxian_wuxian_skill",
				audio: "wuxiaxianshushi_yzs",
				priority: 2,
				trigger: {
					player: "damageBegin3",
				},
				filter(event, player) {
					if (!lib.skill.yzs_wuxiaxian_wuxian_skill.filter(event, player)) {
						return false;
					}
					if (!player.hasEmptySlot(2)) {
						return false;
					}
					return true;
				},
				check(event, player) {
					const num = Math.pow(2, player.countMark("yzs_wuxiaxian_wuxian_skill_mark"))
					return event.num >= num
				},
				prompt2(event, player) {
					const num = Math.pow(2, player.countMark("yzs_wuxiaxian_wuxian_skill_mark"))
					return `${get.poptip("yzs_PPSkill")}：你受到伤害时，可消耗${num}点${get.poptip("yzs_PP")}，无效之，然后本技能本回合消耗翻倍。`
				},
				async content(event, trigger, player) {
					const num = Math.pow(2, player.countMark("yzs_wuxiaxian_wuxian_skill_mark"))
					player.yzs_removePP(num)
					trigger.cancel();
					player.addTempSkill("yzs_wuxiaxian_wuxian_skill_mark");
					player.addMark("yzs_wuxiaxian_wuxian_skill_mark", 1, false)
				},
			},
		},
		nobracket: true,
		init(player, skill) {
			player.addExtraEquip(skill, "yzs_wuxiaxian_wuxian", true, (player2) => player2.hasEmptySlot(2) && lib.card.yzs_wuxiaxian_wuxian);
		},
		onremove(player, skill) {
			player.removeExtraEquip(skill);
		},
		forced: true,
		locked: false,
		priority:21,
		trigger: {
			player:"useCard"
		},
		filter(event, player) {
			return player.countMark("yzs_PP") < player.yzs_getPPLimit();
		},
		async content(event, trigger, player) {
			player.yzs_addPP();
		}
	},
	yzs_canghe: {
		group: ["yzs_canghe_reset"],
		subSkill: {
			reset: {
				forced: true,
				priority:231,
				popup: false,
				trigger: {
					global:"phaseBegin"
				},
				async content(event, trigger, player) {
					if (player.storage.yzs_canghe) player.changeZhuanhuanji("yzs_canghe");
				}
			}
		},
		audio: "wuxiaxianshushi_yzs",
		nobracket: true,
		yzs_PPSkill: true,
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player) {
				if (storage) {
					return `转换技：反转：你可消耗所有${get.poptip("yzs_PP")}并刷新出【杀】数，然后获得1张点数为消耗蓄能数(${player.countMark("yzs_PP")})的【赫】`;
				}
				return `转换技：顺转：你可消耗所有${get.poptip("yzs_PP")}并刷新出【杀】数，然后获得1张点数为消耗蓄能数(${player.countMark("yzs_PP")})的【苍】并令本技能本回合失效`;
			},
		},
		enable: "phaseUse",
		filter(event, player) {
			return player.countMark("yzs_PP") > 0;
		},
		async content(event, trigger, player) {
			player.changeZhuanhuanji("yzs_canghe");
			const num = player.countMark("yzs_PP");
			player.yzs_removePP(num);
			player.getStat().card.sha = 0;
			if (player.storage.yzs_canghe) {
				player.tempBanSkill("yzs_canghe")
				await player.gain(game.createCard("yzs_cang", "black", num), "gain2", "bySelf")
			} else {
				await player.gain(game.createCard("yzs_he", "red", num), "gain2", "bySelf")
			}
		}
	},
	yzs_xushici: {
		Effect: async function (player, target) {
			const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

			// 1. 基础准备
			let others = game.players.concat(game.dead).filter(cur => cur != player && cur != target);
			let pRect = player.getBoundingClientRect();
			let tRect = target.getBoundingClientRect();
			let pX = pRect.left + pRect.width / 2;
			let pY = pRect.top + pRect.height / 2;

			let scene = document.createElement('div');
			scene.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;z-index:1000;pointer-events:none;overflow:hidden;`;
			document.body.appendChild(scene);

			// 辅助函数：创建更亮的光球（中心纯白）
			const createEnergyBall = (mainColor, offsetX) => {
				let ball = document.createElement('div');
				ball.style.cssText = `
        position:absolute; width:100px; height:100px; border-radius:50%;
        left:${pX - 50 + offsetX}px; top:${pY - 50}px;
        /* 去除黑色：背景由白转色再转透明 */
        background: radial-gradient(circle, #fff 20%, ${mainColor} 50%, rgba(255,255,255,0) 70%);
        box-shadow: 0 0 40px #fff, 0 0 70px ${mainColor};
        transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2);
        opacity:0; transform: scale(0.4);
    `;
				scene.appendChild(ball);
				return ball;
			};

			// 2. 苍与赫：生成
			let red = createEnergyBall('#ff2200', -130);
			let blue = createEnergyBall('#0066ff', 130);

			await game.resume();
			red.style.opacity = blue.style.opacity = '1';
			red.style.transform = blue.style.transform = 'scale(1.3)';

			await sleep(600);

			// 靠拢融合
			red.style.transform = `translateX(130px) scale(1.6) rotate(180deg)`;
			blue.style.transform = `translateX(-130px) scale(1.6) rotate(-180deg)`;

			await sleep(600);

			// 3. 虚式·融合：紫色球体
			red.remove(); blue.remove();
			let purple = document.createElement('div');
			purple.style.cssText = `
    position:absolute; width:140px; height:140px; border-radius:50%;
    left:${pX - 70}px; top:${pY - 70}px;
    background: radial-gradient(circle, #fff 15%, #bf40ff 45%, rgba(191,64,255,0) 75%);
    box-shadow: 0 0 50px #fff, 0 0 100px #bf40ff, 0 0 150px rgba(191,64,255,0.5);
    z-index: 1002; transition: all 0.3s ease-out;
`;
			scene.appendChild(purple);

			// 极暗背景增强对比
			others.forEach(p => {
				p.style.transition = 'filter 0.4s';
				p.style.filter = 'brightness(0.1) saturate(0.5)';
			});
			ui.background.style.transition = 'filter 0.4s';
			ui.background.style.filter = 'brightness(0.05) contrast(1.2)';

			await sleep(400);

			// 4. 爆发与震动
			let angle = Math.atan2(tRect.top - pRect.top, tRect.left - pRect.left) * 180 / Math.PI;
			let screenMax = Math.max(window.innerWidth, window.innerHeight) * 2;

			// 【关键改进】：去除黑色部分，使用渐变和透明度控制
			let beam = document.createElement('div');
			beam.style.cssText = `
    position:absolute; height:160px; width:0;
    left:${pX}px; top:${pY - 80}px;
    /* 核心渐变：两侧全透明，中心纯白，过渡区紫色 */
    background: linear-gradient(to bottom, 
        rgba(191,64,255,0) 0%, 
        #bf40ff 30%, 
        #ffffff 45%, 
        #ffffff 55%, 
        #bf40ff 70%, 
        rgba(191,64,255,0) 100%
    );
    /* 发光效果：使用紫色和白色的外发光 */
    box-shadow: 0 0 60px #bf40ff, 0 0 100px rgba(191,64,255,0.6);
    transform-origin: 0 50%;
    transform: rotate(${angle}deg);
    transition: width 0.3s cubic-bezier(0.2, 1, 0.2, 1);
    z-index: 1001;
    mix-blend-mode: screen; /* 混合模式设为滤色，自动过滤黑色 */
`;
			scene.appendChild(beam);

			// 震动动画
			let style = document.createElement('style');
			style.innerHTML = `
    @keyframes strongShake {
        0% { transform: translate(0,0); }
        20% { transform: translate(-15px, 12px); }
        40% { transform: translate(15px, -12px); }
        60% { transform: translate(-15px, -8px); }
        80% { transform: translate(15px, 8px); }
        100% { transform: translate(0,0); }
    }
    .shaking { animation: strongShake 0.1s infinite; }
`;
			document.head.appendChild(style);
			document.body.classList.add('shaking');

			setTimeout(() => {
				beam.style.width = `${screenMax}px`;
				purple.style.transform = 'scale(6)';
				purple.style.opacity = '0';
			}, 50);

			await sleep(800);

			// 5. 恢复
			document.body.classList.remove('shaking');
			beam.style.opacity = '0';
			beam.style.transition = 'opacity 0.8s, width 0.5s';

			others.forEach(p => p.style.filter = '');
			ui.background.style.filter = '';

			setTimeout(() => {
				scene.remove();
				style.remove();
			}, 800);
		},
		group: ["xushici_yzs_sing1"],
		subSkill: {
			sing: {
				charlotte: true,
				onremove: true,
				"skill_id": "xushici_yzs_sing",
				sub: true,
				sourceSkill: "xushici_yzs",
				"_priority": 0,
			},
			"sing1": {
				audio: "ext:一中杀/audio/skill:1",
				name: "九纲",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					if (player.name != "GojoSatoru_yzs") return false;
					if (player.getStorage("xushici_yzs_sing")?.length) return false;
					return player.countCards("h")
				},
				prompt: "咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)",
				filterCard(card, player) {
					return true;
				},
				selectCard: 1,
				check(card) {
					const player = _status.event.player;
					return 6 - get.value(card, player);
				},
				async content(event, trigger, player) {
					player.addTempSkill("xushici_yzs_sing");
					player.addTempSkill("xushici_yzs_sing2");
					player.setStorage("xushici_yzs_sing", [get.suit(event.cards[0])])
					player.$fullscreenpop("九纲", "thunder");
				},
				"skill_id": "xushici_yzs_sing1",
				sub: true,
				sourceSkill: "xushici_yzs",
				"_priority": 0,
			},
			"sing2": {
				audio: "ext:一中杀/audio/skill:1",
				name: "偏光",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					if (player.name != "GojoSatoru_yzs") return false;
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return player.countCards("h", { suit: suits[0] })
				},
				prompt: "咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)",
				filterCard(card, player) {
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return get.suit(card, player) == suits[0];
				},
				selectCard: 1,
				check(card) {
					const player = _status.event.player;
					return 6 - get.value(card, player);
				},
				async content(event, trigger, player) {
					player.removeSkill("xushici_yzs_sing2")
					player.addTempSkill("xushici_yzs_sing3");
					player.$fullscreenpop("偏光", "thunder");
				},
				"skill_id": "xushici_yzs_sing2",
				sub: true,
				sourceSkill: "xushici_yzs",
				"_priority": 0,
			},
			"sing3": {
				audio: "ext:一中杀/audio/skill:1",
				name: "乌与声明",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					if (player.name != "GojoSatoru_yzs") return false;
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return player.countCards("h", { suit: suits[0] })
				},
				prompt: "咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)",
				filterCard(card, player) {
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return get.suit(card, player) == suits[0];
				},
				selectCard: 1,
				check(card) {
					const player = _status.event.player;
					return 6 - get.value(card, player);
				},
				async content(event, trigger, player) {
					player.removeSkill("xushici_yzs_sing3")
					player.addTempSkill("xushici_yzs_sing4");
					player.$fullscreenpop("乌与声明", "thunder");
				},
				"skill_id": "xushici_yzs_sing3",
				sub: true,
				sourceSkill: "xushici_yzs",
				"_priority": 0,
			},
			"sing4": {
				audio: "ext:一中杀/audio/skill:1",
				name: "表里之间",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					if (player.name != "GojoSatoru_yzs") return false;
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return player.countCards("h", { suit: suits[0] })
				},
				prompt: "咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)",
				filterCard(card, player) {
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return get.suit(card, player) == suits[0];
				},
				selectCard: 1,
				check(card) {
					const player = _status.event.player;
					return 6 - get.value(card, player);
				},
				async content(event, trigger, player) {
					player.removeSkill("xushici_yzs_sing4")
					player.addTempSkill("xushici_yzs_sing5");
					player.$fullscreenpop("表里之间", "thunder");
				},
				"skill_id": "xushici_yzs_sing4",
				sub: true,
				sourceSkill: "xushici_yzs",
				"_priority": 0,
			},
			"sing5": {
				charlotte: true,
				onremove: true,
				"skill_id": "xushici_yzs_sing5",
				sub: true,
				sourceSkill: "xushici_yzs",
				"_priority": 0,
			},
		},
		audio: "xushici_yzs",
		nobracket: true,
		enable: "phaseUse",
		position: "h",
		equal(card1, card2, player) {
			if (get.name(card1, player) == get.name(card2, player)) return false;
			return get.number(card1, player) == get.number(card2, player)
		},
		filter(event, player) {
			let cards = player.getCards("h");
			cards = cards.filter(card => ["yzs_cang", "yzs_he"].includes(get.name(card, player)));
			if (!cards.length) return false;
			for (let card1 of cards) {
				for (let card2 of cards) {
					if (lib.skill.xushici_yzs.equal(card1, card2, player)) return true
				}
			}
			return false;
		},
		filterCard(card, player) {
			if (!["yzs_cang", "yzs_he"].includes(get.name(card, player))) return false;
			if (ui.selected.cards.length) {
				return lib.skill.yzs_xushici.equal(ui.selected.cards[0], card, player)
			}
			const cards2 = player.getCards("h");
			for (let i2 = 0; i2 < cards2.length; i2++) {
				if (card != cards2[i2]) {
					if (lib.skill.yzs_xushici.equal(cards2[i2], card, player)) {
						return true;
					}
				}
			}
			return false;
		},
		selectCard: 2,
		complexCard: true,
		check(card) {
			const player = _status.event.player;
			const targets = game.filterPlayer(function (current) {
				return get.damageEffect(current, player, player) > 0;
			});
			let num = 0;
			for (let i2 = 0; i2 < targets.length; i2++) {
				let eff = get.sgn(get.damageEffect(targets[i2], player, player));
				if (targets[i2].hp == 1) {
					eff *= 1.5;
				}
				num += eff;
			}
			if (!player.needsToDiscard(-1)) {
				if (targets.length >= 7) {
					if (num < 2) {
						return 0;
					}
				} else if (targets.length >= 5) {
					if (num < 1.5) {
						return 0;
					}
				}
			}
			return 6 - get.value(card);
		},
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs") && player != target;
		},
		selectTarget: [0,1],
		async content(event, trigger, player) {
			await player.tempBanSkill(event.name);
			const target = event.target;
			if (typeof event.baseDamage !== "number") {
				event.baseDamage = 0;
			}
			if (event.cards?.length && typeof get.number(event.cards[0]) == "number") event.baseDamage += get.number(event.cards[0]);
			if (player.hasSkill("xushici_yzs_sing5")) {
				player.removeSkill("xushici_yzs_sing5");
				event.baseDamage *= 2;
			}
			if (!event.targets?.length) {
				game.broadcastAll(() => {
					var video = document.createElement("VIDEO");
					video.className = "anime";

					Object.assign(video, {
						src: lib.assetURL + "/extension/一中杀/image/background/xushici_yzs2.MP4",
						autoplay: true,//准备就绪后自动播放
						loop: false,//是否循环播放
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
						zIndex: "2",
						transition: "opacity 1s ease-out",
					})
					video.addEventListener("ended", () => {
						video.style.opacity = "0";
						setTimeout(() => {
							document.body.removeChild(video);
						}, 1000)//1s后移除视频
					})
					document.body.appendChild(video);
					setTimeout(() => {
						video.style.opacity = "1";
					}, 50)

				});
			} else if (player.name != "GojoSatoru_yzs") {
				game.broadcastAll(() => {
					var video = document.createElement("VIDEO");
					video.className = "anime";

					Object.assign(video, {
						src: lib.assetURL + "/extension/一中杀/image/background/xushici_yzs.MP4",
						autoplay: true,//准备就绪后自动播放
						loop: false,//是否循环播放
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
						zIndex: "0",
						transition: "opacity 1s ease-out",
					})
					video.addEventListener("ended", () => {
						video.style.opacity = "0";
						setTimeout(() => {
							document.body.removeChild(video);
						}, 1000)//1s后移除视频
					})
					document.body.appendChild(video);
					setTimeout(() => {
						video.style.opacity = "1";
					}, 50)

				});
			} else {
				player.playEffectOL(lib.skill.yzs_xushici.Effect, target);
			}
			if (event.baseDamage >= 3) {
				player.$fullscreenpop("虚式", "thunder")
				setTimeout(() => {
					player.$fullscreenpop("茈", "thunder")
				}, 1500)
			}
			await new Promise(r => setTimeout(r, 2000))

			if (!event.targets?.length) event.targets = game.filterPlayer(cur => !cur.hasSkill("hidden_yzs"));
			for (let target in event.targets) {
				await target.damage();
			}
		},
		ai: {
			basic: {
				order: 8.5,
				useful: 1,
				value: 5,
			},
			result: {
				target: -4,
			},
		},
	},
	yzs_yuzhe: {
		group: ["yzs_yuzhe_awake", "yzs_yuzhe_dying"],
		derivation: ["fanzhuanshushi_yzs", "yzs_xushici"],
		subSkill: {
			dying: {
				forced: true,
				popup: false,
				priority: 33,
			//	audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: "dyingAfter"
				},
				filter(event, player) {
					if (player.countMark("yzs_yuzhe_dying")) return false;
					return player.name == "YoungGojo_yzs" && event.source?.name == "FushiguroToji_yzs"
				},
				async content(event, trigger, player) {
					player.addMark("yzs_yuzhe_dying", 1, false)
					game.trySkillAudio("yuzhe_yzs_dying")
				}
			},
			awake: {
				forced: true,
				skillAnimation: true,
				animationColor: "thunder",
				priority: 321,
				trigger: {
					player: "useCardAfter"
				},
				filter(event, player) {
					return event.card?.storage?.yzs_yuzhe_dying && !player.isDying() && !_status.dying.includes(player)
				},
				async content(event, trigger, player) {
					player.awakenSkill(event.name);
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/YoungGojo_yzs2.png");
					}, player)
					player.awakenSkill('yzs_yuzhe_dying');
					player.addMark("yzs_yuzhe_dying", 1, false)
					if (game.hasPlayer(cur => cur.name == "FushiguroToji_yzs") && player.name == "YoungGojo_yzs") {
						let toji = game.filterPlayer(cur => cur.name == "FushiguroToji_yzs")
						toji[0].chat("真的假的？")
						game.broadcastAll((current) => {
							game.playAudio("ext:一中杀/audio/skill/yuzhe_yzs_awake.MP3");
							setTimeout(() => {
								game.playAudio("ext:一中杀/audio/skill/yuzhe_yzs_awake1.MP3");
							}, 8000)
						}, player);
					} else {
						game.broadcastAll((current) => {
							game.playAudio("ext:一中杀/audio/skill/yuzhe_yzs_awake1.MP3");
						})
					}
					await player.addSkill(['fanzhuanshushi_yzs', "yzs_xushici"]);
				}
			}
		},
		hiddenCard(player, name) {
			return name == "tao"
		},
		onChooseToUse(event) {
			if (!game.online) {
				const player = event.player;
				if (!player) return;
				event.set("yzs_yuzhe", true)
			}
		},
		juexingji: true,
		enable: "chooseToUse",
		position: "h",
		viewAs: {
			name: "tao",
			storage: { yzs_yuzhe: true, }
		},
		filter(event, player) {
			return player.countCards("h") > 1;
		},
		filterCard(card, player) {
			if (ui.selected.cards.length) {
				return get.number(card) == get.number(ui.selected.cards[0]);
			}
			const cards2 = player.getCards("h");
			for (let i2 = 0; i2 < cards2.length; i2++) {
				if (card != cards2[i2]) {
					if (get.number(card) == get.number(cards2[i2])) {
						return true;
					}
				}
			}
			return false;
		},
		selectCard: 2,
		complexCard: true,
		mod: {
			playerEnabled(card, player, target) {
				if (card?.storage?.yzs_yuzhe && card?.name == "tao") {
					if (target != player || (!target.isDying() && !_status.dying.includes(target))) return false;
				}
			},
			cardSavable(card, player) {
				if (card?.storage?.yzs_yuzhe && player !== _status.event.dying && card?.name === "tao") {
					return false;
				}
			},
		},
		prompt: "你可将2张同点数的手牌当做【桃】对濒死的自己使用，结算后若你脱离濒死，你觉醒",
		viewAsFilter(player) {
			return player.countCards("h") > 1;
		},
		check(card) {
			let v = 0;
			if (ui.selected?.cards?.length && get.number(card) == get.number(ui.selected.cards[0])) v = 5;
			if (_status.event.player.countCards("hs") < 4) {
				return 6 - get.useful(card) + v;
			}
			return 7 - get.useful(card) + v;
		},
		ai: {
			threaten: 1.5,
			basic: {
				order: (card, player) => {
					if (player.hasSkillTag("pretao")) {
						return 9;
					}
					return 2;
				},
				useful: (card, i) => {
					let player = _status.event.player;
					if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player)) {
						return 2 / (1 + i);
					}
					let fs = game.filterPlayer(current => {
						return get.attitude(player, current) > 0 && current.hp <= 2;
					}),
						damaged = 0,
						needs = 0;
					fs.forEach(f => {
						if (f.hp > 3 || !lib.filter.cardSavable(card, player, f)) {
							return;
						}
						if (f.hp > 1) {
							damaged++;
						} else {
							needs++;
						}
					});
					if (needs && damaged) {
						return 5 * needs + 3 * damaged;
					}
					if (needs + damaged > 1 || player.hasSkillTag("maixie")) {
						return 8;
					}
					if (player.hp / player.maxHp < 0.7) {
						return 7 + Math.abs(player.hp / player.maxHp - 0.5);
					}
					if (needs) {
						return 7;
					}
					if (damaged) {
						return Math.max(3, 7.8 - i);
					}
					return Math.max(1, 7.2 - i);
				},
				value: (card, player) => {
					let fs = game.filterPlayer(current => {
						return get.attitude(_status.event.player, current) > 0;
					}),
						damaged = 0,
						needs = 0;
					fs.forEach(f => {
						if (!player.canUse("tao", f)) {
							return;
						}
						if (f.hp <= 1) {
							needs++;
						} else if (f.hp === 2) {
							damaged++;
						}
					});
					if ((needs && damaged) || player.hasSkillTag("maixie")) {
						return Math.max(9, 5 * needs + 3 * damaged);
					}
					if (needs || damaged > 1) {
						return 8;
					}
					if (damaged) {
						return 7.5;
					}
					return Math.max(5, 9.2 - player.hp);
				},
			},
			result: {
				target: (player, target) => {
					if (target.hasSkillTag("maixie")) {
						return 3;
					}
					return 2;
				},
				"target_use": (player, target, card) => {
					let mode = get.mode(),
						taos = player.getCards("hs", i => get.name(i) === "tao" && lib.filter.cardEnabled(i, target, "forceEnable"));
					if (target !== _status.event.dying) {
						if (
							!player.isPhaseUsing() ||
							player.needsToDiscard(0, (i, player) => {
								return !player.canIgnoreHandcard(i) && taos.includes(i);
							}) ||
							player.hasSkillTag(
								"nokeep",
								true,
								{
									card: card,
									target: target,
								},
								true
							)
						) {
							return 2;
						}
						let min = 8.1 - (4.5 * player.hp) / player.maxHp,
							nd = player.needsToDiscard(0, (i, player) => {
								return !player.canIgnoreHandcard(i) && (taos.includes(i) || get.value(i) >= min);
							}),
							keep = nd ? 0 : 2;
						if (nd > 2 || (taos.length > 1 && (nd > 1 || (nd && player.hp < 1 + taos.length))) || (target.identity === "zhu" && (nd || target.hp < 3) && (mode === "identity" || mode === "versus" || mode === "chess")) || !player.hasFriend()) {
							return 2;
						}
						if (
							game.hasPlayer(current => {
								return player !== current && current.identity === "zhu" && current.hp < 3 && (mode === "identity" || mode === "versus" || mode === "chess") && get.attitude(player, current) > 0;
							})
						) {
							keep = 3;
						} else if (nd === 2 || player.hp < 2) {
							return 2;
						}
						if (nd === 2 && player.hp <= 1) {
							return 2;
						}
						if (keep === 3) {
							return 0;
						}
						if (taos.length <= player.hp / 2) {
							keep = 1;
						}
						if (
							keep &&
							game.countPlayer(current => {
								if (player !== current && current.hp < 3 && player.hp > current.hp && get.attitude(player, current) > 2) {
									keep += player.hp - current.hp;
									return true;
								}
								return false;
							})
						) {
							if (keep > 2) {
								return 0;
							}
						}
						return 2;
					}
					if (target.isZhu2() || target === game.boss) {
						return 2;
					}
					if (player !== target) {
						if (target.hp < 0 && taos.length + target.hp <= 0) {
							return 0;
						}
						if (Math.abs(get.attitude(player, target)) < 1) {
							return 0;
						}
					}
					if (!player.getFriends().length) {
						return 2;
					}
					let tri = _status.event.getTrigger(),
						num = game.countPlayer(current => {
							if (get.attitude(current, target) > 0) {
								return current.countCards("hs", i => get.name(i) === "tao" && lib.filter.cardEnabled(i, target, "forceEnable"));
							}
						}),
						dis = 1,
						t = _status.currentPhase || game.me;
					while (t !== target) {
						let att = get.attitude(player, t);
						if (att < -2) {
							dis++;
						} else if (att < 1) {
							dis += 0.45;
						}
						t = t.next;
					}
					if (mode === "identity") {
						if (tri && tri.name === "dying") {
							if (target.identity === "fan") {
								if ((!tri.source && player !== target) || (tri.source && tri.source !== target && player.getFriends().includes(tri.source.identity))) {
									if (num > dis || (player === target && player.countCards("hs", { type: "basic" }) > 1.6 * dis)) {
										return 2;
									}
									return 0;
								}
							} else if (tri.source && tri.source.isZhu && (target.identity === "zhong" || target.identity === "mingzhong") && (tri.source.countCards("he") > 2 || (player === tri.source && player.hasCard(i => i.name !== "tao", "he")))) {
								return 2;
							}
							//if(player!==target&&!target.isZhu&&target.countCards('hs')<dis) return 0;
						}
						if (player.identity === "zhu") {
							if (
								player.hp <= 1 &&
								player !== target &&
								taos + player.countCards("hs", "jiu") <=
								Math.min(
									dis,
									game.countPlayer(current => {
										return current.identity === "fan";
									})
								)
							) {
								return 0;
							}
						}
					} else if (mode === "stone" && target.isMin() && player !== target && tri && tri.name === "dying" && player.side === target.side && tri.source !== target.getEnemy()) {
						return 0;
					}
					return 2;
				},
			},
			tag: {
				recover: 1,
				save: 1,
			},
		},
	},
}
export default skills;
