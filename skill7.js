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
				mark:true,
				charlotte: true,
				marktext: "界",
				intro: {
					content: "当前处于结界内",
					name: "结界内",
				},
			},
			hujia: {
				trigger: {
					player: ["changeHujiaAfter","dieAfter"]
				},
				priority:1245,
				forced: true,
				popup:false,
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
					if (player.hujia <=0) return false;
					if (!event.player.hasSkill("yzs_bolijiejie_buff")) return false;
					return event.num >= event.player.hp&&event.num>0;
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
					trigger.num += player.hasSkill("yzs_leyuan")?2:1;
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
		forced:true,
		priority: 11,
		trigger: {
			player:["phaseBegin","useCard","respond"]
		},
		filter(event, player) {
			if (player.countMark("Fuka_yzs") >= player.getFukaLimit()) return false;
			if (event.name == "phase") return true;
			else if (event.name == "useCard"||event.name=="respond") {
				return get.color(event.card,player)=="red"
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
		manualConfirm:true,
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
			return game.hasPlayer(target => target.hasSkill("yzs_bolijiejie_buff")) && player.countMark("Fuka_yzs") > 0 && player.countMark("yzs_mengxiangfengyin")>=3;
		},
		filterTarget(card, player, target) {
			return !target.hasSkill("hidden_yzs");
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			const result = await player
				.chooseNumbers('梦想封印', [{ prompt: '请选择你要造成伤害的次数', min: 1, max: Math.floor(player.countMark("yzs_mengxiangfengyin")/3) }], true)
				.set('processAI', () => {
					return [get.event().numz];
				})
				.set('numz', num)
				.forResult()
			if (result?.bool&&result.numbers?.length) {
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
				target:-2,
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
				priority:89,
				trigger: {
					player:"useCard"
				},
				filter(event, player) {
				//	game.log(event.getParent().name)
					return event.getParent()?.logSkill =="yzs_chengjie"
				},
				async content(event, trigger, player) {
					if (!trigger.baseDamage) trigger.baseDamage = 0;
					trigger.baseDamage++;
				}
			}
		},
		locked: true,
		forced: true,
		popup:false,
		priority:4,
		mod: {
			cardUsable: function (card, player, num) {
				if (player.countMark("yzs_chengjie")) return;
				if (_status.currentPhase == player) {
					if (card.name == 'sha' ) return false;
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
			source:'damageAfter',
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
					if (get.type2(card,player)=="trick") return false;
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
			return target?.isIn()&&player.canCompare(target);
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
			global:"useCardAfter"
		},
		filter(event, player) {
			return get.type(event.card) == "equip"&&player.countCards("he");
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
		forced:true,
		priority:312,
		trigger: {
			player:"phaseZhunbeiBegin"
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
					return player.maxHp <= 2 * num-2;
				},
				async content(event, trigger, player) {
					let result = await player.chooseButton(["你体力上限下降至4/2时，复原【惩戒/审判/监视】中1处被删除的描述。",
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
						player.removeMark(skill, 1, false);
						let num = 0;
						if (player.countMark("yzs_chengjie")) num++;
						if (player.countMark("yzs_shenpan")) num++;
						if (player.countMark("yzs_jianshi")) num++;
						if (player.maxHp <= 2 * num - 2) {
							let result = await player.chooseButton(["你体力上限下降至4/2时，复原【惩戒/审判/监视】中1处被删除的描述。",
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
								player.removeMark(skill, 1, false);
							}
						};
					}
				}
			},
		},
		locked: true,
		forced: true,
		priority:-2,
		trigger: {
			player:"damageBegin4"
		},
		filter(event, player) {
			return player.isDamaged() && event.num > 0;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.loseMaxHp();
			await player.draw(2);
		}
	},
}
export default skills;
