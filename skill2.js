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
	//神秘术
	_RE_Mystic: {
		persevereSkill: true,
		charlotte: true,
		unique: true,
		nopop: true,
		forced: true,
		unique: true,
		mark: true,
		marktext: "术",
		init: function (player, skill) {
			if (Array.isArray(player.storage.RE_Mystic)) return;
			player.storage.RE_Mystic = [];
			player.markSkill("RE_Mystic")
		},
		intro: {
			mark(dialog, content, player) {
				if (!get.character(player.name).RE_FC || !get.character(player.name).RE_FC[0] || !get.character(player.name).RE_FC[1]) {
					dialog.addText("无“至终仪式”");
				}
				let max = get.character(player.name).RE_FC[0];
				if (typeof max == "function") max = max(player);
				let FC_info = get.character(player.name).RE_FC[1]
				dialog.addText("至终仪式：" + player.countMark("Passion_yzs") + "/" + max + "：" + FC_info);
				dialog.addText("当前行动力：" + player.countMark("RE_AP") + "/" + get.character(player.name).RE_AP);
				const cards = player.storage.RE_Mystic;
				if (!cards.length) return "无【神秘术】";
				dialog.addAuto(cards);
			},
		},
		subSkill: {
			use: {
				popup: false,
				forced:true,
				priority: 11,
				trigger: {
					player:"chooseToUseAfter"
				},
				filter(event, player) {
					return event.RE_Mystic_use
				},
				async content(event, trigger, player) {
					event.cards = trigger.RE_Mystic_use.cards
					event.card = trigger.RE_Mystic_use.card
					event.lv = trigger.RE_Mystic_use.lv
					event.trigger("yzs_RE_Mystic_UseAfter")
				}
			},
			AP: {
				priority: 1999,
				trigger: {
					player: "phaseBegin",
				},
				charlotte: true,
				forced: true,
				popup: false,
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					player.setMark("RE_AP", get.character(player.name).RE_AP, false)
				},
			},
			start: {
				sub: true,
				priority: 1999,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				charlotte: true,
				forced: true,
				popup: false,
				filter(event, player) {
					if (!get.character(player.name).RE_Mystic || !get.character(player.name).RE_Mystic.length) return false;
					return (event.name != "phase" || game.phaseNumber == 0)
				},
				async content(event, trigger, player) {
					player.storage.RE_Mystic = [];
					player.markSkill("RE_Mystic")
					player.markSkill("_RE_Mystic")
					const max = get.character(player.name).RE_Mystic[0];
					const list = get.character(player.name).RE_Mystic[1]
					let num = max - player.storage.RE_Mystic.length;
					let gains = [];
					while (num--) {
						let name = list.randomGet()
						var card = game.createCard(name, lib.card[name].suit);
						game.broadcastAll((gain) => {
							gain.addGaintag("RE_Mystic_1")
						}, card)
						gains.push(card);
					}
					player.storage.RE_Mystic.addArray(gains);
					player.markSkill("RE_Mystic")
					player.$gain2(gains, false);
				},
			},
			backup: {
				"skill_id": "_RE_Mystic_backup",
				sub: true,
				sourceSkill: "_RE_Mystic",
				"_priority": 0,
			},
		},
		ruleSkill: true,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.hasMark("RE_AP")) return false;
			return true;
		},
		logv: false,
		chooseButton: {
			complexSelect:true,
			dialog(event, player) {
				const method = [
					["use", "使用"],
					["move", "移动"],
					["integrate", "融合"],
					["recast", "重铸"],
				];
				let cards = player.storage.RE_Mystic;
				return ui.create.dialog(`神秘术：请选择要进行的操作`, [method, "tdnodes"], cards, "hidden");
			},
			select: [1, 3],
			check(button) {
				let v = Math.random();
				if (button.link == "use") v+=0.4;
				if (button.link == "move") v += 0.1
				if (button.link == "integrate") v += 0.3
				if (button.link == "recast") v+=0.2
				return v
			},
			filterOk() {
				if (!ui.selected.buttons || !ui.selected.buttons.length) {
					return false;
				}
				let method = ui.selected.buttons[0].link;
				if (["move", "recast"].includes(method)) return true;
				if (method == "use") return ui.selected.buttons.length == 2;
				else if (method == "integrate") return ui.selected.buttons.length == 3;
				return false;
			},
			filter(button, player) {
				const card = button.link;
				let cards = player.storage.RE_Mystic;
				if (!ui.selected.buttons || !ui.selected.buttons.length) {
					return typeof card == "string"
				}
				if (typeof card == "string") {
					return false;
				}
				let method = ui.selected.buttons[0].link;
				if (["move", "recast"].includes(method)) return false;
				if (method == "use") {
					if (ui.selected.buttons.length >= 2) return false;
					let lv = card.hasGaintag("RE_Mystic_3") ? 3 : (card.hasGaintag("RE_Mystic_2") ? 2 : 1);
					if (lib.skill[card.name + "_" + lv]?.filterX) return lib.skill[card.name + "_" + lv].filterX(player);
					return true;
				}
				else if (method == "integrate") {
					if (ui.selected.buttons.length >= 3) return false;
					if (card.hasGaintag("RE_Mystic_3")) return false;
					let csx = ui.selected.buttons.filter(i => typeof i.link !== "string")
					if (csx && csx.length) {
						let index = cards.indexOf(csx[0].link);
						if (cards.indexOf(card) != index + 1 && cards.indexOf(card) != index - 1) return false;
						if (card.name != csx[0].link.name) return false;
					}
					return true;
				}
				return false;
			},
			backup(links, player) {
				const method = links[0];
				if (method == "use") {
					let cards = links.filter(i => typeof i !== "string")
					let card = cards[0];
					let lv = card.hasGaintag("RE_Mystic_3") ? 3 : (card.hasGaintag("RE_Mystic_2") ? 2 : 1);
					let backup = lib.skill[card.name + "_" + lv];
					backup.name = get.translation(card.name)
					backup.cards = cards;
					backup.card = card;
					backup.lv = lv;
					backup.log= false,
					backup.skill = card.name + "_" + lv
					backup.precontent = async function (event, trigger, player) {
						event.cards = lib.skill._RE_Mystic_backup.cards
						event.card = lib.skill._RE_Mystic_backup.card;
						event.lv = lib.skill._RE_Mystic_backup.lv;
						event.consume = true;
						if (event.consume) player.removeMark("RE_AP", 1, false);
						player.storage.RE_Mystic.remove(event.card);
						player.markSkill("RE_Mystic");
						player.$throw(event.card);

						const list = get.character(player.name).RE_Mystic[1]
						let name = list.randomGet()
						let gain = game.createCard(name, lib.card[name].suit);
						game.broadcastAll((gain) => {
							gain.addGaintag("RE_Mystic_1")
						}, gain)
						player.storage.RE_Mystic.push(gain);
						player.markSkill("RE_Mystic")
						player.$gain2(gain, false);
						let evt = event.getParent();
						if (evt) evt.RE_Mystic_use = {
							cards: event.cards,
							card: event.card,
							lv: event.lv
						};
						player.logSkill(event.card.name + "_" + lv)
						event.trigger("yzs_RE_Mystic_UseBegin")
					}
					return backup;
				}
				if (method == "move") return {
					name: "移动神秘术",
					discard: false,
					lose: false,
					delay: false,
					prepare: () => true,
					log: false,
					async content(event, trigger, player) {
						let cards = player.storage.RE_Mystic;
						event.consume = true;
						let result = await player
							.chooseButton(["选择你要移动的“神秘术”", cards], 1, true)
							.set("filterButton", function (button) {
								return true;
							})
							.forResult();
						if (!result.bool) {
							return;
						}
						let card = result.links[0];
						let args = [];
						const directions = [
							["left", "左"],
							["right", "右"],
						];
						args = [`选择插入的位置`, cards, [directions, "tdnodes"], "hidden"]
						result = await player.chooseButton(args,true)
							.set("selectButton", 2)
							.set("cardx", card)
							.set("cards", cards)
							.set("filterButton", (button, player) => {
								const card = button.link;
								if (card == get.event().cardx) return false;
								if (!ui.selected.buttons || !ui.selected.buttons.length) {
									return typeof card !== "string"
								}
								if (typeof card !== "string") return false;
								let csx = ui.selected.buttons
								let cards = get.event().cards;
								let cardx = get.event().cardx;
								if (csx && csx.length) {
									let index = cards.indexOf(csx[0].link);
									if (cards.indexOf(cardx) == index + 1) return card == "left";
									if (cards.indexOf(cardx) == index - 1) return card == "right"
								}
								return true
							})
							.forResult();
						if (!result.bool) {
							return;
						}
						if (event.consume) player.removeMark("RE_AP", 1, false)
						player.$throw(card);
						await new Promise(r => setTimeout(r, 500))
						player.$gain2(card)
						let pos = result.links.filter(i => typeof i != "string")[0];
						let direction = result.links.filter(i => typeof i == "string")[0];
						let index = cards.indexOf(pos);
						if (direction == "right") index++;
						cards.splice(index, 0, cards.splice(cards.indexOf(card), 1)[0]);
						player.storage.RE_Mystic = cards;
						player.markSkill("RE_Mystic")
					}
				}
				if (method == "integrate") {
					let cards = links.filter(i => typeof i !== "string")
					return {
						name: "融合升阶",
						cards: cards,
						discard: false,
						lose: false,
						log:false,
						delay: false,
						prepare: () => true,
						async content(event, trigger, player) {
							let cards = player.storage.RE_Mystic;
							event.cards = lib.skill._RE_Mystic_backup.cards
							event.consume = true;
							await event.trigger("yzs_RE_Mystic_Mix")
							if (event.consume) player.removeMark("RE_AP", 1, false);
							const index = Math.min(cards.indexOf(event.cards[0]), cards.indexOf(event.cards[1]));

							cards.removeArray(event.cards);
							let name = event.cards[0].name;
							let card = game.createCard(name, lib.card[name].suit);
							let lv = 2;
							if (event.cards.some(card => card.hasGaintag("RE_Mystic_2"))) lv = 3;
							game.broadcastAll((gain, lv) => {
								while (lv > 0) {
									gain.addGaintag("RE_Mystic_" + lv)
									lv--;
								}
							}, card, lv)
							cards.splice(index, 0, card);
							player.storage.RE_Mystic = cards;
							player.markSkill("RE_Mystic")
							//		game.trySkillAudio(card.name + "_1")
							player.$throw(event.cards)
							game.trySkillAudio(card.name + "_1")
							await new Promise(r => setTimeout(r, 500))
							player.$gain2(event.cards);
							await new Promise(r => setTimeout(r, 500))
							const list = get.character(player.name).RE_Mystic[1]
							name = list.randomGet()
							card = game.createCard(name, lib.card[name].suit);
							game.broadcastAll((gain) => {
								gain.addGaintag("RE_Mystic_1")
							}, card)

							player.storage.RE_Mystic.push(card);
							player.markSkill("RE_Mystic")
							player.$gain2(card, false);
						}
					}
				}
				return {
					name: "律的调校",
					discard: false,
					lose: false,
					log: false,
					delay: false,
					prepare: () => true,
					async content(event, trigger, player) {
						let cards = player.storage.RE_Mystic;
						event.consume = true;
						if (event.consume) player.removeMark("RE_AP", 1, false);
						const list = get.character(player.name).RE_Mystic[1]
						let gains = [];
						for (let card of player.storage.RE_Mystic) {
							let lv = card.hasGaintag("RE_Mystic_3") ? 3 : (card.hasGaintag("RE_Mystic_2") ? 2 : 1);
							let name = list.randomGet()
							card = game.createCard(name, lib.card[name].suit);
							game.broadcastAll((gain, lv) => {
								while (lv > 0) {
									gain.addGaintag("RE_Mystic_" + lv)
									lv--;
								}
							}, card, lv)
							gains.push(card);
						}
						player.$throw(player.storage.RE_Mystic)
						player.storage.RE_Mystic = gains;
						player.markSkill("RE_Mystic")
						player.$gain2(gains, false);
					}
				}
			},
			backup1(links, player) {
				const method = links[0];
				return {
					ops: method,
					filterCard: () => false,
					selectCard: -1,
					async precontent(event, trigger, player) {
						delete event.result.skill;
						const op = lib.skill._RE_Mystic_backup.ops;
						let cards = player.storage.RE_Mystic;
						event.consume = true;
						if (op == 1) {
							const result = await player
								.chooseButton(["选择你要使用的“神秘术”", cards], 1, false)
								.set("filterButton", function (button, player) {
									let lv = button.link.hasGaintag("RE_Mystic_3") ? 3 : (button.link.hasGaintag("RE_Mystic_2") ? 2 : 1);
									if (lib.skill[button.link.name + "_" + lv]?.filterX) return lib.skill[button.link.name + "_" + lv].filterX(player);
									return true;
								})
								.forResult();
							if (!result.bool) {
								const evt = event.getParent();
								evt.goto(0);
								delete evt.openskilldialog;
								return;
							}
							event.Mcard = result.links[0];
							event.lv = event.Mcard.hasGaintag("RE_Mystic_3") ? 3 : (event.Mcard.hasGaintag("RE_Mystic_2") ? 2 : 1);
							let cost = {};
							if (lib.skill[event.Mcard.name + "_" + event.lv]?.costX) {
								cost = await lib.skill[event.Mcard.name + "_" + event.lv].costX(player);
							}
							if (cost?.bool === false) {
								const evt = event.getParent();
								evt.goto(0);
								delete evt.openskilldialog;
								return;
							}
							if (event.consume) player.removeMark("RE_AP", 1, false);
							player.storage.RE_Mystic.remove(event.Mcard);
							player.markSkill("RE_Mystic");
							player.$throw(event.Mcard);

							const list = get.character(player.name).RE_Mystic[1]
							let name = list.randomGet()
							let gain = game.createCard(name, lib.card[name].suit);
							game.broadcastAll((gain) => {
								gain.addGaintag("RE_Mystic_1")
							}, gain)
							player.storage.RE_Mystic.push(gain);
							player.markSkill("RE_Mystic")
							player.$gain2(gain, false);

							let next = player.useSkill(event.Mcard.name + "_" + event.lv);
							if (cost.targets) next.targets = cost.targets;
							if (cost.cost_data) next.cost_data = cost.cost_data;
							await next;
							event.trigger("yzs_RE_Mystic_UseAfter")
						}
						if (op == 2) {
							let result = await player
								.chooseButton(["选择你要移动的“神秘术”", cards], 1, false)
								.set("filterButton", function (button) {
									return true;
								})
								.forResult();
							if (!result.bool) {
								const evt = event.getParent();
								evt.goto(0);
								delete evt.openskilldialog;
								return;
							}
							let card = result.links[0];
							let args = [];
							const directions = [
								["left", "左"],
								["right", "右"],
							];
							args = [`选择插入的位置`, cards, [directions, "tdnodes"], "hidden"]
							result = await player.chooseButton(args)
								.set("selectButton", 2)
								.set("cardx", card)
								.set("cards", cards)
								.set("filterButton", (button, player) => {
									const card = button.link;
									if (card == get.event().cardx) return false;
									if (!ui.selected.buttons || !ui.selected.buttons.length) {
										return typeof card !== "string"
									}
									if (typeof card !== "string") return false;
									let csx = ui.selected.buttons
									let cards = get.event().cards;
									let cardx = get.event().cardx;
									if (csx && csx.length) {
										let index = cards.indexOf(csx[0].link);
										if (cards.indexOf(cardx) == index + 1) return card == "left";
										if (cards.indexOf(cardx) == index - 1) return card == "right"
									}
									return true
								})
								.forResult();
							if (!result.bool) {
								const evt = event.getParent();
								evt.goto(0);
								delete evt.openskilldialog;
								return;
							}
							if (event.consume) player.removeMark("RE_AP", 1, false)
							game.trySkillAudio(card.name + "_1")
							player.$throw(card);
							await new Promise(r => setTimeout(r, 500))
							player.$gain2(card)
							let pos = result.links.filter(i => typeof i != "string")[0];
							let direction = result.links.filter(i => typeof i == "string")[0];
							let index = cards.indexOf(pos);
							if (direction == "right") index++;
							cards.splice(index, 0, cards.splice(cards.indexOf(card), 1)[0]);
							player.storage.RE_Mystic = cards;
							player.markSkill("RE_Mystic")
						}
						if (op == 3) {
							await event.trigger("yzs_RE_Mystic_MixBegin")
							let result = await player.chooseButton(['融合升阶(将两张相邻的同名神秘术融合成一张，二者阶数相加)', cards], 2, false)
								.set("cards", cards)
								.set('filterButton', function (button) {
									let c = button.link
									if (button.link.hasGaintag("RE_Mystic_3")) return false;
									let csx = ui.selected.buttons
									let cards = get.event().cards;
									if (csx && csx.length) {
										let index = cards.indexOf(csx[0].link);
										if (cards.indexOf(c) != index + 1 && cards.indexOf(c) != index - 1) return false;
										if (c.name != csx[0].link.name) return false;
									}
									return true;
								}).forResult();
							if (!result.bool) {
								const evt = event.getParent();
								evt.goto(0);
								delete evt.openskilldialog;
								return;
							}
							event.Mcards = result.links;
							await event.trigger("yzs_RE_Mystic_Mix")
							if (event.consume) player.removeMark("RE_AP", 1, false);
							const index = cards.indexOf(result.links[0]);
							cards.removeArray(result.links);
							let name = result.links[0].name;
							let card = game.createCard(name, lib.card[name].suit);
							let lv = 2;
							if (result.links.some(card => card.hasGaintag("RE_Mystic_2"))) lv = 3;
							game.broadcastAll((gain, lv) => {
								while (lv > 0) {
									gain.addGaintag("RE_Mystic_" + lv)
									lv--;
								}
							}, card, lv)
							cards.splice(index, 0, card);
							player.storage.RE_Mystic = cards;
							player.markSkill("RE_Mystic")
							//		game.trySkillAudio(card.name + "_1")
							player.$throw(result.links)
							await new Promise(r => setTimeout(r, 500))
							player.$gain2(result.links);
							await new Promise(r => setTimeout(r, 500))
							const list = get.character(player.name).RE_Mystic[1]
							name = list.randomGet()
							card = game.createCard(name, lib.card[name].suit);
							game.broadcastAll((gain) => {
								gain.addGaintag("RE_Mystic_1")
							}, card)

							player.storage.RE_Mystic.push(card);
							player.markSkill("RE_Mystic")
							player.$gain2(card, false);
						}
						if (op == 4) {
							if (event.consume) player.removeMark("RE_AP", 1, false);
							const list = get.character(player.name).RE_Mystic[1]
							let gains = [];
							for (let card of player.storage.RE_Mystic) {
								let lv = card.hasGaintag("RE_Mystic_3") ? 3 : (card.hasGaintag("RE_Mystic_2") ? 2 : 1);
								let name = list.randomGet()
								card = game.createCard(name, lib.card[name].suit);
								game.broadcastAll((gain, lv) => {
									while (lv > 0) {
										gain.addGaintag("RE_Mystic_" + lv)
										lv--;
									}
								}, card, lv)
								gains.push(card);
							}
							player.$throw(player.storage.RE_Mystic)
							player.storage.RE_Mystic = gains;
							player.markSkill("RE_Mystic")
							player.$gain2(gains, false);
						}
						const evt = event.getParent();
						evt.goto(0);
						delete evt.openskilldialog;
					},
				};
			},
			prompt(links, player) {
				let method = links[0],
					str = `###神秘术###`;
				if (method == "use") {
					let cards = links.filter(i => typeof i !== "string")
					let card = cards[0];
					let lv = card.hasGaintag("RE_Mystic_3") ? 3 : (card.hasGaintag("RE_Mystic_2") ? 2 : 1);
					str += `<div class="text center">发动神秘术(发动1张神秘术的效果)</div>`
					str += get.translation(card.name + "_" + lv + "_info");
				} else if (method == "move") {
					str += `<div class="text center">移动神秘术(移动1张神秘术的位置)</div>`
				} else if (method == "integrate") {
					str += `<div class="text center">融合升阶(将两张相邻的同名神秘术融合成一张，二者阶数相加)</div>`
				} else {
					str +=`<div class="text center">律的调校(重铸所有神秘术)</div>`
				}
				return str 
			},
		},
		ai: {
			order: 6,
			result: {
				player:1,
			}
		}
	},
	//纯真翔子
	chunzhen_yzs: {
		audio: "ext:一中杀/audio/skill:3",
		group: ["chunzhen_yzs_draw"],
		subSkill: {
			draw: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				direct: true,
				popup: true,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
				ai: {
					threaten: 1.3,
				},
				"_priority": 0,
			},
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + 1;
			},
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		direct: true,
		popup: true,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0)
		},
		async content(event, trigger, player) {
			player.flashAvatar("chunzhen_yzs", "Cana_yzs");
			var func = function (card) {
				return get.subtype(card, false) == "equip1" && !get.cardtag(card, "gifts");
			};
			let card = get.cardPile2(func) || get.discardPile(func);
			if (card) {
				player.$gain2(card, false);
				await player.chooseUseTarget(card, true);
			}
			func = function (card) {
				return get.subtype(card, false) == "equip2" && !get.cardtag(card, "gifts");
			};
			card = get.cardPile2(func) || get.discardPile(func);
			if (card) {
				player.$gain2(card, false);
				await player.chooseUseTarget(card, true);
			}
		},
		ai: {
			threaten: 1.3
		},
	},
	DisabledHandcardSlot_yzs: {
		locked: true,
		charlotte: true,
		unique: true,
		priority: 10,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		popup: false,
		async content(event, trigger, player) {
			const cards = player.getCards("h");
			await player.discard(cards);
		},
		ai: {
			nogain: true,
			nolose: true,
			nodiscard: true,
		}
	},
	zhenwu_yzs: {
		direct: true,
		popup: true,
		trigger: { global: "phaseEnd" },
		filter(event, player) {
			return player.hp == 1;
		},
		audio: "ext:一中杀/audio/skill:1",
		async content(event, trigger, player) {
			let drawnum = 1;
			if (player.storage.disabledhandcard) drawnum++;
			if (player.storage.disabledequip) drawnum++;
			if (player.storage.disabledjudge) drawnum++;
			var cards = game.cardsGotoOrdering(get.cards(drawnum)).cards;
			player.addGaintag(cards, "zhenwu_yzs");
			player.$gain2(cards, false);
			while (cards.some(i => player.hasUseTarget(i))) {
				let result = await player
					.chooseButton(["真武：是否使用其中的一张牌？", cards])
					.set("filterButton", button => {
						return _status.event.player.hasUseTarget(button.link);
					})
					.set("ai", button => {
						return get.player().getUseValue(button.link, true, false);
					})
					.forResult();
				if (result.bool) {
					var card = result.links[0];
					cards.remove(card);
					game.delayx();
					player.chooseUseTarget(true, card, false);
				} else break
			}
			for (let i = 0; i < cards.length; i++) { cards[i].discard(); }
			await player.recover();
		},
		ai: {
			threaten: 1.7
		}
	},
	zhenyi_yzs: {
		locked: true,
		group: ["zhenyi_yzs_dying", "zhenyi_yzs_zhunbei", "zhenyi_yzs_jieshu"],
		subSkill: {
			dying: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				priority: 3,
				trigger: {
					player: "dying",
				},
				filter(event, player) {
					if (!player.storage.disabledhandcard) return true;
					if (!player.storage.disabledequip) return true;
					if (!player.storage.disabledjudge) return true;
					return false;
				},
				async cost(event, trigger, player) {
					const result = await player.chooseButton([
						"你可废除自己1个区域，然后恢复体力值至1",
						[
							[
								["disabledhandcard", "废除手牌区"],
								["disabledequip", "废除装备区"],
								["disabledjudge", "废除判定区"],
							],
							"textbutton",
						],
					])
						.set("forced", false)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							return !player.storage[button.link]
						})
						.set("ai", button => {
							const player = get.player();
							if (button.link == "disabledhandcard") return 2;
							if (button.link == "disabledequip") return 4;
							if (button.link == "disabledjudge") return 6;
							return 0;
						})
						.forResult();
					if (!result.bool) return false;
					event.result = {
						bool: true,
						cost_data: result.links[0]
					}
				},
				async content(event, trigger, player) {
					player.storage[event.cost_data] = true;
					player.markSkill(event.cost_data);
					if (event.cost_data == "disabledhandcard") {
						await player.addSkill("DisabledHandcardSlot_yzs");
						await player.discard(player.getCards("h"));
					}
					if (event.cost_data == "disabledequip") {
						const disables = [];
						for (let i = 1; i <= 5; i++) {
							for (let j = 0; j < player.countEnabledSlot(i); j++) {
								disables.push(i);
							}
						}
						if (disables.length > 0) {
							await player.disableEquip(disables);
						}
					}
					if (event.cost_data == "disabledjudge") {
						await player.disableJudge();
					}
					await player.changeHujia(1, "gain");
					if (player.storage.disabledhandcard && player.storage.disabledequip && player.storage.disabledjudge) {
						const num = Math.min(player.maxHp - 1, 3);
						await player.loseMaxHp(num);
						await player.changeHujia(2, "gain");
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Unbelieve_xiangzi_yzs.png");
							_status.tempMusic = `ext:一中杀/audio/RYUKYUVANIA V2.mp3`;
							game.playBackgroundMusic();
							ui.background.setBackgroundImage('extension/一中杀/image/background/zhenyi_yzs.png');
						}, player)
					}
					if (!player.storage.disabledhandcard || !player.storage.disabledequip || !player.storage.disabledjudge) player.flashAvatar("chunzhen_yzs", "Unbelieve_xiangzi_yzs");
					if (player.hp >= 1) return;
					const num = 1 - player.hp;
					await player.recover(num);
				},
			},
			zhunbei: {
				priority: 3,
				audio: "zhenyi_yzs_dying",
				locked: true,
				trigger: {
					player: "phaseZhunbeiBegin",
				},
				filter(event, player) {
					if (!player.storage.disabledhandcard && !player.countCards("h")) return true;
					if (!player.storage.disabledequip && !player.countCards("e")) return true;
					if (!player.storage.disabledjudge && !player.countCards("j")) return true;
					return false;
				},
				async cost(event, trigger, player) {
					const result = await player.chooseButton([
						"你可废除自己1个无牌的区域",
						[
							[
								["disabledhandcard", "废除手牌区"],
								["disabledequip", "废除装备区"],
								["disabledjudge", "废除判定区"],
							],
							"textbutton",
						],
					])
						.set("forced", false)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							return !player.storage[button.link] && !player.countCards(button.link[8])
						})
						.set("ai", button => {
							const player = get.player();
							if (button.link == "disabledhandcard") return 2;
							if (button.link == "disabledequip") return 4;
							if (button.link == "disabledjudge") return 6;
							return 0;
						})
						.forResult();
					if (!result.bool) return false;
					event.result = {
						bool: true,
						cost_data: result.links[0]
					}
				},
				async content(event, trigger, player) {
					player.storage[event.cost_data] = true;
					player.markSkill(event.cost_data);
					if (event.cost_data == "disabledhandcard") {
						await player.addSkill("DisabledHandcardSlot_yzs");
						await player.discard(player.getCards("h"));
					}
					if (event.cost_data == "disabledequip") {
						const disables = [];
						for (let i = 1; i <= 5; i++) {
							for (let j = 0; j < player.countEnabledSlot(i); j++) {
								disables.push(i);
							}
						}
						if (disables.length > 0) {
							await player.disableEquip(disables);
						}
					}
					if (event.cost_data == "disabledjudge") {
						await player.disableJudge();
					}
					await player.changeHujia(1, "gain");
					if (player.storage.disabledhandcard && player.storage.disabledequip && player.storage.disabledjudge) {
						const num = Math.min(player.maxHp - 1, 3);
						await player.loseMaxHp(num);
						await player.changeHujia(2, "gain");
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Unbelieve_xiangzi_yzs.png");
							_status.tempMusic = `ext:一中杀/audio/RYUKYUVANIA V2.mp3`;
							game.playBackgroundMusic();
							ui.background.setBackgroundImage('extension/一中杀/image/background/zhenyi_yzs.png');
						}, player)
					}
					if (!player.storage.disabledhandcard || !player.storage.disabledequip || !player.storage.disabledjudge) player.flashAvatar("chunzhen_yzs", "Unbelieve_xiangzi_yzs");
				},
			},
			jieshu: {
				audio: "ext:一中杀/audio/skill:1",
				priority: 3,
				locked: true,
				prompt2: "你可失去体力值至1并获得失去体力点护甲",
				trigger: {
					player: "phaseJieshuBegin",
				},
				filter(event, player) {
					return player.hp > 1;
				},
				check(event, player) {
					if (!game.hasPlayer(cur => get.attitude(player, cur) > 0) && player.countCards("h", { name: "tao" }) >= 1) return false;
					return true;
				},
				async content(event, trigger, player) {
					const num = player.hp - 1;
					await player.loseHp(num);
					await player.changeHujia(num, "gain")
				},
			},
		},
		locked: true,
		forced: true,
		priority: 3,
		trigger: {
			player: "recoverBegin",
		},
		filter(event, player) {
			if (player.isDying() || !player.hujia) return false;
			return true;
		},
		async content(event, trigger, player) {
			trigger.cancel();
		}
	},
	//时潜怪盗
	thief_yzs: {
		group: ["thief_yzs_basic", "thief_yzs_equip"],
		subSkill: {
			basic: {
				locked: true,
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					if (get.type(event.card) !== "trick") return false;
					if (event.player == player) return false
					let cards = player.getExpansions("thief_yzs").filter(i => get.type(i) == "basic");
					if (!cards.length) return false;
					return true;
				},
				async cost(event, trigger, player) {
					let cards = player.getExpansions("thief_yzs");
					let goon = trigger.targets?.length ? get.effect(trigger.targets[0], trigger.card, trigger.player, player) < 0 : false;

					if (goon) {
						if (["tiesuo", "diaohulishan", "lianjunshengyan", "zhibi", "chiling", "lulitongxin"].includes(trigger.card.name)) {
							goon = false;
						} else if (trigger.card.name == "sha") {
							if (trigger.targets[0].mayHaveShan(player, "use") || trigger.targets[0].hp >= 3) {
								goon = false;
							}
						} else if (trigger.card.name == "guohe") {
							if (trigger.targets[0].countCards("he") >= 3 || !trigger.targets[0].countCards("h")) {
								goon = false;
							}
						} else if (trigger.card.name == "shuiyanqijunx") {
							if (trigger.targets[0].countCards("e") <= 1 || trigger.targets[0].hp >= 3) {
								goon = false;
							}
						} else if (get.tag(trigger.card, "damage") && trigger.targets[0].hp >= 3) {
							goon = false;
						}
					}

					let result = await player.chooseButton(["怪盗", "你可移去1张基本【盗】，然后无效并获得" + get.translation(trigger.card), cards], false)
						.set("filterButton", function (button) {
							return get.type(button.link) == "basic"
						})
						.set("goon", goon)
						.set("ai", function (button) {
							if (_status.event.goon) {
								return 1;
							}
							return 0;
						})
						.forResult()
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				async content(event, trigger, player) {
					await player.loseToDiscardpile(event.cost_data)
					trigger.targets.length = 0;
					trigger.all_excluded = true;
					game.log(trigger.card, "被无效了");
					await player.gain(trigger.cards, 'gain2');
				},
			},
			trick: {
				nopop: true,
				locked: true,
				zhuanhuanji: true,
				mark: true,
				marktext: "☯",
				intro: {
					content(storage, player, skill) {
						const str = storage ? "无咏唱：摸2张牌" : "无咏唱：获得场上1张牌"
						return str;
					},
				},
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
				},
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					let cards = player.getExpansions("thief_yzs").filter(i => get.type(i) == "trick" || get.type(i) == "delay");
					if (!cards.length) return false;
					return true
				},
				chooseButton: {
					dialog(event, player) {
						let dialog = ui.create.dialog("怪盗", player.getExpansions("thief_yzs"), "hidden");
						return dialog;
					},
					select: 1,
					filter: function (button, player) {
						return get.type(button.link) == "trick" || get.type(button.link) == "delay";
					},
					backup(links, player) {
						var next = {
							filterTarget(card, player, target) {
								if (player.storage.thief_yzs_trick) {
									return false;
								} else {
									return target.countCards("hej") > 0
								}
							},
							selectTarget() {
								const player = get.player();
								return player.storage.thief_yzs_trick ? -1 : 1;
							},
							filterCard() {
								return false;
							},
							selectCard: -1,
							card: links,
							delay: false,
							content: lib.skill.thief_yzs_trick.content,
						};
						return next;
					},
					prompt(links, player) {
						const storage = player.storage.thief_yzs_trick
						return storage ? "你可移去1张锦囊【盗】，然后摸2张牌" : "你可移去1张锦囊【盗】，然后获得场上1张牌"
					},
					ai: {
						result: {
							player: 2,
							target: -2,
						}
					}
				},
				async content(event, trigger, player) {
					var card = event.cards.length ? event.cards : lib.skill.thief_yzs_trick_backup?.card;
					await player.loseToDiscardpile(card);
					player.changeZhuanhuanji("thief_yzs_trick");
					if (player.storage.thief_yzs_trick) {
						await player.gainPlayerCard(event.targets[0], "hej", true, 1)
					} else {
						await player.draw(2);
					}
					const evt = event.getParent(2);
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				},
				ai: {
					result: {
						player: 2,
						target: -2,
					}
				}
			},
			equip: {
				locked: true,
				firstDo: true,
				trigger: {
					global: ["phaseZhunbeiEnd", "phaseJudgeEnd", "phaseDrawEnd", "phaseUseEnd", "phaseDiscardEnd", "phaseJieshuEnd"],
				},
				filter(event, player) {
					return true;
				},
				async cost(event, trigger, player) {
					let cardx = player.getExpansions("thief_yzs").filter(i => get.type(i) == "equip");
					if (!cardx.length || !game.hasPlayer(function (target) {
						if (target.hasSkill("hidden_yzs")) return false;
						if (target.countMark("thief_yzs_equip_hp") <= 0) return false;
						if (target.countMark("thief_yzs_equip_hp") == target.hp && target.countMark("thief_yzs_equipwangyou_yzs_cards") == target.countCards("h")) return false;
						return true;
					})) {
						var players = game.filterPlayer();
						for (let target of players) {
							target.setMark("thief_yzs_equipwangyou_yzs_cards", target.countCards("h"), false);
							target.setMark("thief_yzs_equip_hp", target.hp, false);
						}
						event.result = {
							bool: false,
						}
						return;
					}
					cardx = player.getExpansions("thief_yzs")
					let result = await player.chooseButtonTarget()
						.set("createDialog", ["怪盗", "你可令任意角色调整体力值和手牌数至本阶段开始时值", cardx])
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							return get.type(button.link) == "equip"
						})
						.set("ai1", button => 1)
						.set("ai2", target => {
							const player = get.player();
							return ((1.7 * (target.countMark("thief_yzs_equip_hp") - target.hp) + (target.countMark("thief_yzs_equipwangyou_yzs_cards") - target.countCards("h"))) * get.attitude(player, target)) - 2;
						})
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							if (target.countMark("thief_yzs_equip_hp") <= 0) return false;
							if (target.countMark("thief_yzs_equip_hp") == target.hp && target.countMark("thief_yzs_equipwangyou_yzs_cards") == target.countCards("h")) return false;
							return true;
						})
						.forResult()
					event.result = {
						bool: result.bool,
						targets: result.targets,
						cost_data: result.links || [],
					}
					if (!event.result.targets) event.result.targets = [];
					var players = game.filterPlayer(current => !event.result.targets.includes(current));
					for (let target of players) {
						target.setMark("thief_yzs_equipwangyou_yzs_cards", target.countCards("h"), false);
						target.setMark("thief_yzs_equip_hp", target.hp, false);
					}
				},
				async content(event, trigger, player) {
					await player.loseToDiscardpile(event.cost_data)
					const target = event.targets[0];
					let cardnum = target.countMark("thief_yzs_equipwangyou_yzs_cards");
					let hp = target.countMark("thief_yzs_equip_hp")
					if (cardnum < target.countCards("h")) {
						await target.chooseToDiscard("h", target.countCards("h") - cardnum, true);
					} else if (cardnum > target.countCards("h")) {
						await target.draw(cardnum - target.countCards("h"));
					}
					if (hp < target.hp) {
						await target.loseHp(target.hp - hp);
					} else if (hp > target.hp) {
						await target.recover(hp - target.hp);
					}
					target.setMark("thief_yzs_equipwangyou_yzs_cards", target.countCards("h"), false);
					target.setMark("thief_yzs_equip_hp", target.hp, false);
				},
			},
		},
		locked: true,
		marktext: "盗",
		intro: {
			name: "怪盗",
			markcount: "expansion",
			mark(dialog, _, player) {
				dialog.addText(`根据【盗】的类型，你可移去【盗】并发动对应效果：${get.poptip("thief_yzs_basic")}、${get.poptip("thief_yzs_trick")}、${get.poptip("thief_yzs_equip")}`);
				if (player.countExpansions("thief_yzs") > 0) {
					const cards = player.getExpansions("thief_yzs");
					if (player.isUnderControl(true)) {
						dialog.addAuto(cards);
					} else {
						dialog.addText("共有" + get.cnNumber(cards.length) + "张【盗】");
					}
				}
			},
		},
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
			player.addSkill("thief_yzs_trick")
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("thief_yzs");
		},
		clickableFilter: function (player) {
			let cards = player.getExpansions("thief_yzs").filter(i => get.type(i) == "trick" || get.type(i) == "delay");
			if (!cards.length) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			const storage = player.storage.thief_yzs_trick
			const str = storage ? "你可移去1张锦囊【盗】，然后摸2张牌" : "你可移去1张锦囊【盗】，然后获得场上1张牌"
			let cards = player.getExpansions("thief_yzs")
			let result = await player.chooseButton(["怪盗", str, cards], false)
				.set("filterButton", function (button) {
					return get.type(button.link) == "trick" || get.type(button.link) == "delay";
				})
				.forResult()
			if (!result.bool) return;
			if (storage) {
				let next = player.useSkill("thief_yzs_trick")
				next.cards = result.links;
				await next;
				return;
			};
			let result2 = await player
				.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && target.countCards("hej")
				})
				.set("prompt", "怪盗")
				.set("prompt2", "选择1名角色，获得其场上1张牌")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
			let next = player.useSkill("thief_yzs_trick")
			next.cards = result.links;
			next.targets = result2.targets;
			await next;
		},
		trigger: {
			player: "gainAfter",
			global: "loseAsyncAfter",
		},
		filter(event, player) {
			if (!event.cards || !event.cards.length) return false;
			var evt = event;
			if (event.name == "lose") {
				evt = event.getParent();
			}
			if (event.name == "gain" && event.source == player) {
				return false;
			}
			if (evt[event.name == "gain" ? "bySelf" : "notBySelf"] != true) {
				return false;
			}
			return true;
		},
		async cost(event, trigger, player) {
			let cards = trigger.cards;
			let result = await player.chooseButton(["怪盗", "你可将获得的牌扣置为【盗】", cards], false)
				.set("filterButton", function (button) {
					return true;
				})
				.set("ai", button => {
					if (button.link.name == "shunshou") return 0;
					return 2;
				})
				.set("selectButton", [1, Infinity])
				.forResult()
			event.result = {
				bool: result.bool,
				cost_data: result.links || [],
			};
		},
		async content(event, trigger, player) {
			let next = player.addToExpansion(event.cost_data, player, "giveAuto")
			next.gaintag.add("thief_yzs")
			await next;
			player.$draw(event.cost_data);
		},
	},
	thief_yzs_equip_hp: {
		mark: true,
		marktext: "时",
		sub: true,
		sourceSkill: "thief_yzs_equip",
		intro: {
			nocount: true,
			mark(dialog, _, player) {
				dialog.addText("本阶段开始时的手牌数为" + player.countMark("thief_yzs_equipwangyou_yzs_cards"));
				dialog.addText("本阶段开始时的体力值为" + player.countMark("thief_yzs_equip_hp"));
			},
		},
	},
	qianying_yzs: {
		group: ["qianying_yzs_draw"],
		subSkill: {
			draw: {
				sub: true,
				sourceSkill: "qianying_yzs",
				prmopt2: "摸牌阶段，你可改为获得其他角色至多2张手牌",
				trigger: {
					player: "phaseDrawBegin1",
				},
				filter(event, player) {
					if (!game.hasPlayer(function (target) {
						if (target.hasSkill("hidden_yzs")) return false;
						return target.countCards("h") > 0;
					})) return false;
					return !event.numFixed;
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseTarget("潜影", "获得其他角色至多2张手牌(选择两名则各获得一张，选择一名则获得其1~2张)", false)
						.set("filterTarget", (card, player, target) => {
							if (target == player) return false;
							if (target.hasSkill("hidden_yzs")) return false;
							return target.countCards("h") > 0
						})
						.set("ai", (target) => {
							const att = get.attitude(_status.event.player, target);
							if (target.hasSkill("tuntian")) {
								return att / 10;
							}
							return 1 - att;
						})
						.set("selectTarget", [1, 2])
						.forResult()
				},
				async content(event, trigger, player) {
					if (event.targets.length > 1) {
						await player.gainMultiple(event.targets);
					} else {
						await player.gainPlayerCard(event.targets[0], "h", false, [1, 2]);
					}
					trigger.changeToZero();
					await game.delay();
				},
			}
		},
		locked: true,
		logTarget: "player",
		trigger: {
			global: "phaseDrawEnd",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (!event.player.countCards("h")) return false;
			if (player.countExpansions("thief_yzs")) return false;
			if (event.player.hasSkill("hidden_yzs")) return false;
			return true;
		},
		async cost(event, trigger, player) {
			let next = player.choosePlayerCard(trigger.player, 1, "h", false);
			next.set("prompt", "你可将 " + get.translation(trigger.player) + " 的1张手牌置为你的【盗】");
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			let card = event.cards;
			let next = player.addToExpansion(card, player, "giveAuto")
			next.gaintag.add("thief_yzs")
			await next
		},
	},
	//爱国者
	buxijinjun_yzs: {
		nobracket: true,
		group: ["buxijinjun_yzs_start", "buxijinjun_yzs_phaseEnd", "buxijinjun_yzs_bgm"],
		subSkill: {
			last: {
				popup: false,
				charlotte: true,
				locked: true,
				forced: true,
				trigger: {
					player: "useCard"
				},
				filter(event, player) {
					return event.card?.name == "sha";
				},
				async content(event, trigger, player) {
					game.playVideoOL("/extension/一中杀/image/background/buxijinjun_yzs.MP4", 0)
					await new Promise(r => setTimeout(r, 2800))
					game.broadcastAll(() => {
						// 创建振动关键帧
						const style = document.createElement('style');
						style.textContent = `
							@keyframes screenShake {
							  0%, 100% { transform: translate(0, 0); }
							  10%, 30%, 50%, 70%, 90% { transform: translate(-4px, -6px); }
							  20%, 40%, 60%, 80% { transform: translate(4px, 6px); }
							}
    
							.screen-shake {
							  animation: screenShake 0.1s ease-in-out infinite;
							}
    
							.screen-shake-1s {
							  animation: screenShake 0.1s ease-in-out;
							  animation-iteration-count: 10; /* 0.1s × 10 = 1s */
							}
						  `;
						document.head.appendChild(style);

						// 应用振动效果到根元素
						document.documentElement.classList.add('screen-shake-1s');

						// 1秒后移除效果
						setTimeout(() => {
							document.documentElement.classList.remove('screen-shake-1s');
							style.remove();
						}, 700);
					});
					await player.removeSkill("buxijinjun_yzs_last");
				}
			},
			removeBGM: {
				charlotte: true,
				locked: true,
				forced: true,
				popup: false,
				forceDie: true,
				priority:321415,
				forceOut: true,
				popup: false,
				trigger: {
					player: "dieBefore"
				},
				filter(event, player) {
					return document.documentElement.style.filter == "grayscale(70%)"
				},
				content() {
					game.broadcastAll(() => {
						document.documentElement.style.filter = "none";
					});
				}
			},
			start: {
				locked: true,
				forced: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					const cards = get.cards(4);
					let next = player.addToExpansion(cards, "gain2", player)
					next.gaintag.add("buxijinjun_yzs");
					await next;
				}
			},
			bgm: {
				locked: true,
				forced: true,
				priority: 115,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.countExpansions("buxijinjun_yzs") > 13;
				},
				async content(event, trigger, player) {
					game.broadcastAll(() => {
						_status.tempMusic = `ext:一中杀/audio/End Like This.mp3`;
						game.playBackgroundMusic();
						//把屏幕变黑白
						document.documentElement.style.filter = "grayscale(70%)";
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					});
					player.addSkill("buxijinjun_yzs_removeBGM");
					player.addSkill("buxijinjun_yzs_last");
				},
				sub: true,
				sourceSkill: "buxijinjun_yzs",
			},
			phaseEnd: {
				locked: true,
				forced: true,
				popup: false,
				priority: 2,
				LastDo: true,
				trigger: {
					player: "phaseUseEnd",
				},
				async content(event, trigger, player) {
					player.clearMark("buxijinjun_yzs_phaseEnd", false);
					const cards = player.getExpansions("buxijinjun_yzs");
					if (!cards.length) return;
					let nums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
					let die = false;
					for (let card of cards) {
						nums[get.number(card)]++;
						if (nums[get.number(card)] > 1) die = true;
					}
					if (die) {
						await player.die(event);
					}
				},
				sub: true,
				sourceSkill: "buxijinjun_yzs",
			}
		},
		mod: {
			maxHandcard(player, num) {
				return num += player.countMark("buxijinjun_yzs_phaseEnd");
			},
		},
		locked: true,
		mark: true,
		markimage: "extension/一中杀/image/buxijinjun_yzs.png",
		intro: {
			mark(dialog, content, player) {
				let cards = player.getExpansions("buxijinjun_yzs");
				if (!cards.length) return "无【源晶】";
				cards.sort(function (a, b) {
					return a.number - b.number;
				})
				dialog.addAuto(cards);
			},
		},
		prompt2(event, player) {
			let num = event.minHp + 1 - player.hp;
			return "你进入濒死状态时，可恢复体力至体力下限，并将牌堆顶" + num + "张牌加入【源晶】，然后令【坚盾】本回合失效";
		},
		trigger: {
			player: "dying",
		},
		filter(event, player) {
			let num = event.minHp + 1 - player.hp;
			return num > 0;
		},
		async content(event, trigger, player) {
			const num = trigger.minHp + 1 - player.hp;
			const cards = get.cards(Math.min(num, 14));
			let next = player.addToExpansion(cards, "gain2", player)
			next.gaintag.add("buxijinjun_yzs");
			await next;
			await player.recover(num);
			player.tempBanSkill("jiandun_yzs");
		},
	},
	huimiezitai_yzs: {
		nobracket: true,
		group: "huimiezitai_yzs_change",
		subSkill: {
			change: {
				locked: true,
				usable: 1,
				enable: "phaseUse",
				filter(event, player) { return player.countExpansions("buxijinjun_yzs") > 0 },
				async content(event, trigger, player) {
					let cards = player.getExpansions("buxijinjun_yzs");
					cards.sort(function (a, b) {
						return a.number - b.number;
					})
					let result = await player.chooseToMove("毁灭姿态：是否交换【源晶】和手牌？")
						.set("list", [
							[get.translation(player) + "（你）的【源晶】", cards],
							["手牌区", player.getCards("h")],
						])
						.set("filterMove", function (from, to) {
							return typeof to != "number";
						})
						.set("processAI", list => {
							const srcCards = list[0][1];   // 源晶区牌数组
							const handCards = list[1][1];  // 手牌区牌数组

							const num = Math.min(srcCards.length, handCards.length);
							if (num === 0) return [srcCards.slice(), handCards.slice()]; // 无可交换牌

							// 1. 计算源晶牌的点数分布，找出重复点数的牌（保留一张价值最高的）
							const pointMap = new Map();
							srcCards.forEach(card => {
								const point = card.number; // 假设点数存在 number 属性，无名杀卡牌常用
								if (!pointMap.has(point)) pointMap.set(point, []);
								pointMap.get(point).push(card);
							});

							// 收集所有重复点数的牌（每组中除价值最高的一张外，其余都放入待换出列表）
							const duplicateSrcCards = [];
							const keepSrcCards = [];
							for (let cards of pointMap.values()) {
								if (cards.length > 1) {
									// 按价值降序排序
									cards.sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
									// 保留第一张（价值最高），其余加入待换出
									keepSrcCards.push(cards[0]);
									duplicateSrcCards.push(...cards.slice(1));
								} else {
									keepSrcCards.push(cards[0]);
								}
							}

							// 2. 将待换出列表按价值降序排序（价值高的重复牌优先换到手中）
							duplicateSrcCards.sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));

							// 3. 若重复牌数量不足 num，从剩余源晶（keepSrcCards）中补充高价值牌
							let swapOutSrc = duplicateSrcCards.slice(0, num);
							if (swapOutSrc.length < num) {
								// 将保留的源晶按价值降序排序
								keepSrcCards.sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
								const need = num - swapOutSrc.length;
								// 从保留列表头部取高价值牌
								swapOutSrc = swapOutSrc.concat(keepSrcCards.slice(0, need));
							}

							// 4. 选择换出的手牌：价值最低的 num 张（升序）
							const handSorted = handCards.slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
							const swapOutHand = handSorted.slice(0, num);

							// 5. 构造最终结果（保证牌不重复）
							const newSrc = srcCards.filter(c => !swapOutSrc.includes(c)).concat(swapOutHand);
							const newHand = handCards.filter(c => !swapOutHand.includes(c)).concat(swapOutSrc);

							return [newSrc, newHand];
						})
						.forResult();
					if (result?.bool) {
						var pushs = result.moved[0],
							gains = result.moved[1];
						pushs.removeArray(player.getExpansions("buxijinjun_yzs"));
						gains.removeArray(player.getCards("h"));
						if (!pushs.length || pushs.length != gains.length) return;
						let next = player.addToExpansion(pushs, player, "giveAuto")
						next.gaintag.add("buxijinjun_yzs");
						await next;
						player.gain(gains, "gain2");
					}
				},
				ai: {
					order(item, player) {
						return 10
						let cards = player.getExpansions("buxijinjun_yzs");
						for (let card of cards) {
							if (cards.some(c => card != c && get.number(c) == get.number(card))) return 10;
						}
					},
					result: {
						player:1
					}
				},
				sub: true,
				sourceSkill: "huimiezitai_yzs",
				"_priority": 0,
			}
		},
		forced: true,
		locked: true,
		trigger: {
			player: "damageBegin3",
			source: "damageBegin1"
		},
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			const cards = await game.cardsGotoOrdering(get.cards(2)).cards,
				cardx = player.getExpansions("buxijinjun_yzs"),
				numbers = cardx.map(card => get.number(card)).toUniqued();
			await player.showCards(cards, `${get.translation(player)}发动了【毁灭姿态】`, true);
			let gains = [];
			for (const card of cards) {
				if (numbers.includes(get.number(card))) {
					trigger.num++;
				} else {
					gains.push(card);
				}
			}
			await player.gain(gains, "gain2");
		},
		ai: {
			maixie: true,
			damageBonus: true,
		}
	},
	jiandun_yzs: {
		audio: "renwang_skill",
		trigger: {
			global: "damageBegin4",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (event.player.hasSkill("hidden_yzs")) return false;
			if (event.source == player) return false;
			if (player.countCards("h") < 1) return false;
			return true;
		},
		async cost(event, trigger, player) {
			let str = `你可弃置1张【杀】，然后无效 ` + get.translation(trigger.player) + ` 受到的伤害，并受到`;
			if (trigger.source) {
				str += ` ` + get.translation(trigger.source) + ` 造成的` + trigger.num + `点伤害`
			} else {
				str += trigger.num + `点无来源伤害`
			}
			let next = player.chooseToDiscard(player, "h", false);
			next.set("filterCard", (card) => get.name(card) == "sha")
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
			const num = trigger.num;
			trigger.cancel();
			if (!trigger.source) await player.damage("nosource", num)
			else {
				await player.damage(trigger.source, num);
			}
		},
	},
	//崎梦魔女
	mengliao_yzs: {
		group: ["mengliao_yzs_damage", "mengliao_yzs_recover"],
		subSkill: {
			damage: {
				locked: true,
				prompt2: "是否视为使用【梦疗事变】？",
				priority: 6,
				trigger: {
					player: "damageEnd"
				},
				filter(event, player) {
					if (!player.storage) return false;
					return player.storage.mengliao_yzs;
				},
				async content(event, trigger, player) {
					player.changeZhuanhuanji("mengliao_yzs");
					var card = {
						name: "mengliaoshibian_yzs",
						isCard: true
					};
					await player.chooseUseTarget(card, true)
						.set("prompt", "梦疗")
						.set("prompt2", "视为使用一张" + get.translation(card))
				},
				sub: true,
				sourceSkill: "mengliao_yzs",
			},
			recover: {
				direct: true,
				popup: true,
				priority: 7,
				trigger: {
					global: ["eventNeutralized", "useCardEnd"]
				},
				filter(event, player, name) {
					if (!player.countCards("h")) return false
					if (!event.player) return false;
					let targets = event.targets;
					if (name == "eventNeutralized") {
						if (event.type != "card" && event.name != "_wuxie") return false;
						targets.remove(event.target);
						if (!event.targets) return false;
						if (!event.targets.length) return false;
					}
					const info = lib.card[event.card.name];
					if (info?.notarget) return false;
					return targets.length == 0 || event.all_excluded;
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseCard("梦疗", "你可给予 " + get.translation(trigger.player) + " 1张手牌，令其恢复1点体力", "h", 1, false)
						.set("target", trigger.player)
						.set("ai", card => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.attitude(player, target) <= 0) return 0;
							return get.value(card);
						})
						.forResult()
				},
				async content(event, trigger, player) {
					await player.give(event.cards, trigger.player);
					await trigger.player.recover();
				},
				sub: true,
				sourceSkill: "mengliao_yzs",
			}
		},
		locked: true,
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				const str = storage ? "受到伤害后，你可视为使用【梦疗事变】" : "出牌阶段限1次：你视为使用【梦疗事变】"
				return str;
			},
		},
		usable: 1,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.storage) return false;
			return !player.storage.mengliao_yzs;
		},
		async content(event, trigger, player) {
			player.changeZhuanhuanji("mengliao_yzs");
			var card = {
				name: "mengliaoshibian_yzs",
				isCard: true
			};
			await player.chooseUseTarget(card, true)
				.set("prompt", "梦疗")
				.set("prompt2", "视为使用一张" + get.translation(card))
		},
		ai: {
			order: 3,
			result: {
				player: 2
			}
		}
	},
	qimeng_yzs: {
		locked: true,
		group: ["qimeng_yzs_jueqing", "qimeng_yzs_use"],
		subSkill: {
			jueqing: {
				locked: true,
				audio: "jueqing",
				trigger: {
					source: "damageBefore",
				},
				filter(event, player) {
					return event.player != player;
				},
				forced: true,
				content() {
					trigger.cancel();
					trigger.player.loseHp(trigger.num);
				},
				ai: {
					jueqing: true,
				},
				"_priority": 0,
				sub: true,
				sourceSkill: "qimeng_yzs",
			},
			use: {
				locked: true,
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (!player.canUse("fanlizhimeng_yzs", player)) return false;
					return true;
				},
				async content(event, trigger, player) {
					var card = {
						name: "fanlizhimeng_yzs",
						isCard: true
					};
					await player.chooseUseTarget(card, true)
						.set("prompt", "崎梦")
						.set("prompt2", "视为使用一张" + get.translation(card))
				},
				ai: {
					order:6,
					result: {
						player(player, target) {
							if (!player.getEquip(2)||!player.getEquip(2).length) return 3;
							let es = player.getEquip(2);
							if (es.some(c => c.name == "fanlizhimeng_yzs_equip")) return -2;
						}
					},
				}
			}
		},
		trigger: {
			player: "loseAfter",
			global: "loseAsyncAfter",
		},
		filter(event, player) {
			if (!_status.currentPhase) return false;
			var evt = event.getl(player);
			let map = {
				red: 0,
				black: 0,
			};
			for (var i = 0; i < evt.cards.length; i++) {
				if (get.position(evt.cards[i], evt.hs.includes(evt.cards[i]) ? evt.player : false) != "d") return false;
				if (get.color(evt.cards[i], evt.hs.includes(evt.cards[i]) ? evt.player : false) == "red") {
					map["red"]++;
				}
				if (get.color(evt.cards[i], evt.hs.includes(evt.cards[i]) ? evt.player : false) == "black") {
					map["black"]++;
				}
			}
			return (map["red"] > 1 && map["black"] == 0) || (map["black"] > 1 && map["red"] == 0)
		},
		async cost(event, trigger, player) {
			let map = {
				red: 0,
				black: 0,
			};
			var evt = trigger.getl(player);
			for (var i = 0; i < evt.cards.length; i++) {
				if (get.position(evt.cards[i], evt.hs.includes(evt.cards[i]) ? evt.player : false) != "d") return false;
				if (get.color(evt.cards[i], evt.hs.includes(evt.cards[i]) ? evt.player : false) == "red") {
					map["red"]++;
				}
				if (get.color(evt.cards[i], evt.hs.includes(evt.cards[i]) ? evt.player : false) == "black") {
					map["black"]++;
				}
			}
			let num = map["red"] || map["black"];
			num = Math.floor(num / 2);
			event.result = await player.chooseBool("是否对 " + get.translation(_status.currentPhase) + " 造成" + num + "点伤害？")
				.set("ai", function () {
					return get.attitude(player, _status.currentPhase);
				})
				.forResult();
			event.result.cost_data = num;
		},
		async content(event, trigger, player) {
			await _status.currentPhase.damage(event.cost_data);
		},
	},
	mengmie_yzs: {
		group: ["mengmie_yzs_sha", "mengmie_yzs_awake"],
		subSkill: {
			awake: {
				sub: true,
				sourceSkill: "mengmie_yzs",
				juexingji: true,
				skillAnimation: true,
				priority: 4,
				trigger: {
					player: "dying",
					global: ["eventNeutralized", "useCardEnd"]
				},
				prompt2: `你进入濒死时或【梦疗事变】被无效后，你觉醒：你获得${get.poptip("huange_yzs")}并选择：<br>①：失去【梦疗】并恢复全部体力<br>②：失去1点体力和体力上限`,
				filter(event, player, name) {
					if (player.countMark("mengmie_yzs_awake")) return false;
					if (name == "dying") {
						return true;
					}
					if (!event.player) return false;
					if (event.card.name != "mengliaoshibian_yzs") return false;
					let targets = event.targets;
					if (name == "eventNeutralized") {
						if (event.type != "card" && event.name != "_wuxie") return false;
						targets.remove(event.target);
						if (!event.targets) return false;
						if (!event.targets.length) return false;
					}
					const info = lib.card[event.card.name];
					if (info?.notarget) return false;
					return targets.length == 0 || event.all_excluded;
				},
				async content(event, trigger, player) {
					player.addMark("mengmie_yzs_awake",1,false)
					player.awakenSkill('mengmie_yzs_awake');
					await player.addSkill("huange_yzs");
					let result = await player.chooseButton([
						"请选择一项",
						[
							[
								["recover", "失去【梦疗】并恢复全部体力"],
								["loseHp", "失去1点体力和体力上限"],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai", button => {
							const player = get.player();
							if (button.link == "recover") {
								return 3 - player.hp;
							} else {
								return player.hp - 2;
							}
						})
						.forResult();
					if (!result.bool) return
					if (result.links[0] == "recover") {
						await player.removeSkill("mengliao_yzs");
						const num = player.maxHp - player.hp;
						await player.recover(num);
					} else {
						await player.loseHp();
						await player.loseMaxHp();
					}
				}
			},
			sha: {
				remove: true,
				intro: {
					name: "梦灭",
					content: function (storage, player) {
						return "出杀数为" + player.countMark("mengmie_yzs_sha");
					},
				},
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return num + player.countMark("mengmie_yzs_sha") - 1;
						}
					},
				},
				sub: true,
				sourceSkill: "mengmie_yzs",
			}
		},
		derivation: "huange_yzs",
		direct: true,
		popup: true,
		trigger: {
			player: "phaseUseBegin"
		},
		async content(event, trigger, player) {
			const num = player.maxHp - player.hp;
			await player.draw(num);
			const result = await player.chooseToDiscard("h", "弃置至多" + player.hp + "张手牌，本阶段你出【杀】数为所弃牌数", false, [1, player.hp])
				.set("ai", card => {
					const player = get.player();
					if (card.name == "sha") return 0;
					if (ui.selected?.cards?.length >= player.countCards("h", { name: "sha" })) return 0;
					return 5 - get.value(card);
				})
				.forResult();
			await player.addTempSkill("mengmie_yzs_sha", "phaseUseAfter");
			if (!result.bool) {
				player.clearMark("mengmie_yzs_sha", false);
				return;
			};
			player.setMark("mengmie_yzs_sha", result.cards.length, false);
		},
	},
	huange_yzs: {
		group: ["huange_yzs_zhunbei"],
		locked: true,
		forced: true,
		trigger: {
			player: "phaseZhunbeiBegin"
		},
		async content(event, trigger, player) {
			await player.gainMaxHp();
		},
	},
	//次元魔女
	tiangongkaiwu_yzs: {
		nobracket: true,
		group: ["tiangongkaiwu_yzs_die", "ciyuanchaoyue_yzs_round"],
		audio: "ext:一中杀/audio/skill:1",
		subSkill: {
			die: {
				audio: "ext:一中杀/audio/skill:1",
				trigger: { global: "die" },
				locked: true,
				forceOut: true,
				forced: true,
				filter(event, player) {
					return event.player.hasSkill("ciyuanzhimen_yzs_summon")
				},
				async content(event, trigger, player) {
					await player.yzs_setCountDown({
						once:true,
						num: 1,
						repeatNum: 1,
						command: {
							async todo(player) {
								await player.useSkill("tiangongkaiwu_yzs")
							},
							list: [player],
						},
						value(item, player) {
							return 2;
						},
						name: "tiangongkaiwu_yzs",
						prompt: `召唤"次元之门"至场上任意座次，然后失去此吟唱`,
						skill: "tiangongkaiwu_yzs"
					});
				},
				sub: true,
				sourceSkill: "tiangongkaiwu_yzs",
			},
			resummon: {
				locked: true,
				forced: true,
				sing: 1,
				audio: "ext:一中杀/audio/skill:1",
				intro: {
					content: "吟唱#/1：若“次元之门”不在场，你召唤之至任意座次。",
				},
				"_priority": 4,
				init: function (player, skill) {
					player.addMark("tiangongkaiwu_yzs_resummon", get.info(skill).sing, false);
				},
				trigger: {
					player: "phaseZhunbei",
				},
				async content(event, trigger, player) {
					player.removeMark("tiangongkaiwu_yzs_resummon", get.info("tiangongkaiwu_yzs_resummon").sing, false);
					if (player.countMark("tiangongkaiwu_yzs_resummon") == 0) {
						player.addMark("tiangongkaiwu_yzs_resummon", get.info("tiangongkaiwu_yzs_resummon").sing, false);
						await player.removeSkill("tiangongkaiwu_yzs_resummon")
						await player.useSkill("tiangongkaiwu_yzs")
					}
				}
			},
		},
		locked: true,
		eternalSkill_yzs: true,
		charlotte: true,
		unique: true,
		forced: true,
		priority: 112451,
		unique: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			if (game.countPlayer(function (current) {
				return current.name == 'jifengbaoxiang_yzs';
			})) return;
			let result = await player.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return true
				})
				.set("forced", true)
				.set("prompt", "天工开物")
				.set("prompt2", "在目标角色下家召唤“次元之门”")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
			if (!result.bool) return;
			const target = result.targets[0];
			game.broadcastAll((player) => {
				var group1 = player.group;
				game.addCharacter('ciyuanzhimen_yzs', {
					sex: 'none',
					group: group1,
					hp: 4,
					skills: ["ciyuanzhimen_yzs_summon"],
					groupInGuozhan: group1,
					isUnseen: true,
					extension: '衍生武将',
					translate: '次元之门',
				});
				lib.character['ciyuanzhimen_yzs'][4] = ['ext:一中杀/image/ciyuanzhimen_yzs.png', 'unseen', group1];
			}, player);
			if (_status.connectMode === true) {
				var id = Math.floor(Math.random() * 8000000000);
				game.broadcastAll((player, id) => {
					var door = ui.create.player(ui.arena).addTempClass("start");
					const position = +player.dataset.position + 1;
					const players = game.players.concat(game.dead);
					ui.arena.setNumber(players.length + 1);
					players.forEach(value => {
						if (parseInt(value.dataset.position) >= position) {
							value.dataset.position = parseInt(value.dataset.position) + 1;
						}
					});
					door.playerid = id;
					lib.playerOL[id] = door;
					door.init('ciyuanzhimen_yzs');
					game.players.push(door);
					door.dataset.position = position;
					game.arrangePlayers();
				}, target, id);
				var door = game.findPlayer2(current => (current.name1 == 'ciyuanzhimen_yzs' || current.name2 == 'ciyuanzhimen_yzs'));
				if (!door) door = target.next;
			} else {
				
				var door = await game.addPlayerOL(target, "ciyuanzhimen_yzs", null, true);
			}
			if (!door.playerid) door.getId();
			event.door = door;
			if (!_status.door_die) _status.door_die = [];
			_status.door_die.add(door.playerid);
			if (!_status.door_auto) _status.door_auto = [];
			_status.door_auto.add(player.playerid, door.playerid);
			game.log(player, '召唤了', lib.translate['ciyuanzhimen_yzs']);
			game.broadcastAll((door, player) => {
				if (get.mode() == 'guozhan') {
					if (door.name2 == undefined) door.name2 = door.name1;
				}
				if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
					door.side = player.side;
					door.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
					door.node.identity.dataset.color = player.node.identity.dataset.color;
				}
				door.skillH = [];
				door.storage.zhibi = [];
				door.storage.stratagem_expose = [];
				door.storage.stratagem_fury = 0;
			}, door, player);
			game.broadcastAll((door, player) => {
				const identity = (door.identity = (identity => {
					switch (identity) {
						case "zhu":
						case "mingzhong":
							return "zhong";
						case "zhu_false":
							return "zhong_false";
						case "bZhu":
							return "bZhong";
						case "rZhu":
							return "rZhong";
						case "nei":
							return "commoner";
						default:
							return identity;
					}
				})(player.identity));
				if (get.mode() == 'doudizhu') lib.translate['zhong'] = "忠";
				if (!lib.translate[identity]) lib.translate[identity] = "民";
				const goon = player !== game.me && door !== game.me && player.node.identity.classList.contains("guessing") && !player.identityShown;
				if (goon) {
					if (door.identityShown) delete door.identityShown;
					if (!door.node.identity.classList.contains("guessing")) door.node.identity.classList.add("guessing");
				}
				door.setIdentity(goon ? "cai" : undefined);
				if (door.node.dieidentity) door.node.dieidentity.innerHTML = get.translation(door.identity + 2);
				if (typeof player.ai?.shown === "number" && door.ai) door.ai.shown = player.ai.shown;
			}, door, player);
			game.broadcastAll((door, player) => {
				door.setSeatNum(player.getSeatNum() + 1);
				const playerx = game.players.concat(game.dead);
				var minx = playerx.length;
				ui.arena.setNumber(minx);
				for (var i of playerx) {
					if (i.getSeatNum() < minx) minx = i.getSeatNum();
				}
				playerx.sortBySeat(game.findPlayer2(current => current.getSeatNum() == minx), true);
				for (var i = 0; i < playerx.length; i++) {
					playerx[i].setSeatNum(i + 1);
				}
				ui.update();
			}, door, player);
			game.broadcastAll((door, player) => {
				door["ciyuanzhimen_yzs"] = player;
				if (!game.checkResult_door) {
					game.checkResult_door = game.checkResult;
					game.checkResult = function () {
						const targets = game.players.filter(i => i.hasSkill("ciyuanzhimen_yzs_summon"));
						game.players.removeArray(targets);
						game.checkResult_door();
						game.players.addArray(targets);
					};
				}
				if (!game.checkResult_door) {
					game.checkResult_door = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						const targets = game.players.filter(i => i.hasSkill("ciyuanzhimen_yzs_summon"));
						game.players.removeArray(targets);
						game.checkResult_door(player);
						game.players.addArray(targets);
					};
				}
				if (typeof lib.element.player.getFriends === "function") {
					const origin_getFriends = lib.element.player.getFriends;
					const getFriends = function (func, includeDie) {
						const player = this;
						return [...origin_getFriends.apply(this, arguments),
						...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => (target["ciyuanzhimen_yzs"] || target) === (player["ciyuanzhimen_yzs"] || player))
						].filter(i => i !== player || func === true).unique().sortBySeat(player);
					};
					lib.element.player.getFriends = getFriends;
					[...game.players, ...game.dead].forEach(i => (i.getFriends = getFriends));
				}
				if (typeof lib.element.player.isFriendOf === "function") {
					const origin_isFriendOf = lib.element.player.isFriendOf;
					const isFriendOf = function (player) {
						if ((this["ciyuanzhimen_yzs"] || this) === (player["ciyuanzhimen_yzs"] || player)) return true;
						return origin_isFriendOf.apply(this, arguments);
					};
					lib.element.player.isFriendOf = isFriendOf;
					[...game.players, ...game.dead].forEach(i => (i.isFriendOf = isFriendOf));
				}
				if (typeof lib.element.player.getEnemies === "function") {
					const origin_getEnemies = lib.element.player.getEnemies;
					const getEnemies = function (func, includeDie) {
						if (this["ciyuanzhimen_yzs"]) return this["ciyuanzhimen_yzs"].getEnemies(func, includeDie);
						else {
							const player = this;
							return [...origin_getEnemies.apply(this, arguments),
							...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => {
								return origin_getEnemies.apply(this, arguments).includes(target["ciyuanzhimen_yzs"] || target);
							}),
							].filter(i => player != (i["ciyuanzhimen_yzs"] || i)).unique().sortBySeat(player);
						}
					};
					lib.element.player.getEnemies = getEnemies;
					[...game.players, ...game.dead].forEach(i => (i.getEnemies = getEnemies));
				}
			}, door, player);
			player.ai.modAttitudeFrom = (from, to, att) => {
				if (player.isFriendsOf(to)) return get.attitude(from, to);
				return get.attitude(from, to) - 0.1;
			};
			door.ai.modAttitudeFrom = (from, to, att) => {
				if (to == player || player.isFriendsOf(to)) return 114514;
				return get.attitude(player, to) - 0.1;
			};
			door.ai.modAttitudeTo = (from, to, att) => {
				if (from == player || player.isFriendsOf(from)) return 7;
				return get.attitude(from, to);
			};
			const disables = [];
			for (let i = 1; i <= 5; i++) {
				for (let j = 0; j < player.countEnabledSlot(i); j++) {
					disables.push(i);
				}
			}
			if (disables.length > 0) {
				await door.disableEquip(disables);
			}
			await door.disableJudge();
			game.addGlobalSkill('door_auto_yzs');
			game.addGlobalSkill('door_die_yzs');
			game.addGlobalSkill('door_over_yzs');
			let doors = game.filterPlayer(current => current.hasSkill("ciyuanzhimen_yzs_summon"));
			for (let door of doors) {
				door.storage.isSub = true;
				door.markSkill("isSub");
			}
		}
	},
	door_auto_yzs: {
		trigger: {
			player: ['playercontrol', 'chooseToUseBegin', 'chooseToRespondBegin', 'chooseToDiscardBegin', 'chooseToCompareBegin',
				'chooseButtonBegin', 'chooseCardBegin', 'chooseTargetBegin', 'chooseCardTargetBegin', 'chooseControlBegin',
				'chooseBoolBegin', 'choosePlayerCardBegin', 'discardPlayerCardBegin', 'gainPlayerCardBegin'],
			global: 'dieAfter',
		},
		firstDo: true,
		forced: true,
		priority: 999,
		forceDie: true,
		charlotte: true,
		popup: false,
		silent: true, //mode:['identity', 'guozhan', 'doudizhu', 'connect'],
		filter: function (event, player) {
			if (!_status.door_auto) return false;
			if (event.name == 'die') return event.player != player && _status.door_auto.includes(game.me.playerid) && _status.door_auto.includes(event.player.playerid) && _status.door_auto.includes(player.playerid);
			if (event.autochoose && event.autochoose()) return false;
			if (lib.filter.wuxieSwap(event)) return false;
			if (_status.auto) return false;
			return _status.door_auto.includes(game.me.playerid) && _status.door_auto.includes(player.playerid);
		},
		content: function () {
			if (player.isAlive()) game.swapPlayerAuto(player);
		},
	},
	door_die_yzs: {
		trigger: { player: 'die' },
		fixed: true,
		priority: -2,
		direct: true,
		forced: true,
		charlotte: true,
		superCharlotte: true,
		lastDo: true,
		forceDie: true,
		silent: true,
		popup: false,
		filter: function (event, player) {
			if (_status.door_die) return _status.door_die.includes(event.player.playerid);
			return false;
		},
		content: function () {
			var targetd = trigger.player;
			game.broadcastAll(function (player, targetd) {
				game.dead.remove(targetd);
				game.removePlayerOL(targetd);
				const playerx = game.players.concat(game.dead);
				var minx = playerx.length;
				ui.arena.setNumber(minx);
				for (var i of playerx) {
					if (i.getSeatNum() < minx) minx = i.getSeatNum();
				}
				playerx.sortBySeat(game.findPlayer2(current => current.getSeatNum() == minx), true);
				for (var i = 0; i < playerx.length; i++) {
					playerx[i].setSeatNum(i + 1);
				}
			}, player, targetd);
			game.arrangePlayers();
			if (_status.currentPhase && _status.currentPhase == player) get.event().getParent("phaseLoop").player = player.getPrevious();
		},
	},
	door_over_yzs: {
		trigger: { global: 'dieAfter' },
		fixed: true,
		priority: -1,
		direct: true,
		forced: true,
		charlotte: true,
		superCharlotte: true,
		lastDo: true,
		forceDie: true,
		silent: true,
		popup: false,
		filter: function (event, player) {
			if (game.players.filter(i => i !== player).every(i => (i["ciyuanzhimen_yzs"] && i["ciyuanzhimen_yzs"] === player))) return true;
			return false;
		},
		content: function () {
			if (game.players.filter(i => i !== player).every(i => (i["ciyuanzhimen_yzs"] && i["ciyuanzhimen_yzs"] === player))) {
				var win = game.findPlayer2(current => current["ciyuanzhimen_yzs"])["ciyuanzhimen_yzs"];
				var bool = false;
				if (win == game.me || win.getFriends().includes(game.me)) bool = true;
				game.log(win, '●GameOver');
				game.over(bool);
			}
		},
	},
	xunyou_yzs: {
		locked: true,
		forced: true,
		trigger: {
			source: "damageSource"
		},
		async content(event, trigger, player) {
			const controls = ["draw_card", "recover_hp"];
			const prompt = `令 ` + get.translation(trigger.player) + ` 摸1张牌或恢复1点体力`
			const next = player.chooseControl(controls);
			next.set("ai", function () {
				const player = get.event().player;
				const target = get.event().target;
				if (get.attitude(player, target) > 0) {
					if (target.isHealthy()) return "draw_card"
					return "recover_hp"
				} else {
					if (target.isHealthy()) return "recover_hp"
					return "draw_card"
				}
				return "recover_hp"
			})
			next.set("target",trigger.player)
			next.set("prompt", prompt);
			next.set("forced", true);
			let result = await next.forResult();
			if (result.control == "draw_card") {
				await trigger.player.draw();
			} else {
				await trigger.player.recover();
			}
		},
	},
	gongyin_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		group: "gongyin_yzs_hujia",
		subSkill: {
			hujia: {
				locked: true,
				eternalSkill_yzs: true,
				charlotte: true,
				unique: true,
				forced: true,
				popup: false,
				forceOut: true,
				trigger: {
					global: ["chooseToRespondBefore", "chooseToUseBefore"],
				},
				filter(event, player) {
					if (event.responded) {
						return false;
					}
					if (event.player.storage.hujiaing) {
						return false;
					}
					if (!event.player.hasSkill("ciyuanzhimen_yzs_summon")) return false;
					if (!event.filterCard({ name: "shan", isCard: true }, event.player, event)) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					if (player.isOut()) {
						game.broadcastAll(function (player) {
							player.classList.remove("out");
						}, player);
						var out = true;
					}
					if ((player == game.me && !_status.auto) || get.attitude(player, trigger.player) > 2 || player.isOnline()) {
						trigger.player.storage.hujiaing = true;
						const next = await player.chooseToRespond("是否替" + get.translation(trigger.player) + "打出一张闪？(打出后你摸1张牌)", { name: "shan" })
							.set("ai", () => {
								const event = _status.event;
								return get.attitude(player, trigger.player) - 2;
							})
							.set("skillwarn", "替" + get.translation(trigger.player) + "打出一张闪")
							.set("autochoose", lib.filter.autoRespondShan)
							.set("source", trigger.player)
							.forResult();
						var bool = next.bool
						trigger.player.storage.hujiaing = false;
						if (!bool) return;
						trigger.result = { bool: true, card: { name: "shan", isCard: true } };
						trigger.responded = true;
						trigger.animate = false;
						await player.draw()
					}
					if (out) {
						if (player.isIn()) {
							game.broadcastAll(function (player) {
								player.classList.add("out");
							}, player);
						}
					}
				},
			},
			cards: {
				trigger: {
					player: "phaseBefore",
				},
				priority: 3,
				forced: true,
				popup: false,
				forceOut: true,
				charlotte: true,
				sourceSkill: "gongyin_yzs",
				filter(event, player) {
					return player.getExpansions("gongyin_yzs_cards").length > 0 && !event.skill;
				},
				async content(evebt, trigger, player) {
					var cards = player.getExpansions("gongyin_yzs_cards");
					if (player.isOut()) {
						for (let i = 0; i < cards.length; i++) { cards[i].discard(); }
						player.$throw(cards)
						player.unmarkSkill("gongyin_yzs_cards")
						game.log(cards, "迷失在次元漩涡中了");
						return;
					}
					await player.gain(cards, "draw");
					game.log(player, "收回了" + get.cnNumber(cards.length) + "张来自1自轮次前的次元的牌");
					await player.removeSkill("gongyin_yzs_cards");
				},
				markimage: "extension/一中杀/image/gongyin_yzs_cards.png",
				intro: {
					markcount: "expansion",
					mark(dialog, storage, player) {
						var cards = player.getExpansions("gongyin_yzs_cards");
						if (player.isUnderControl(true)) {
							dialog.addAuto(cards);
						} else {
							return "共有" + get.cnNumber(cards.length) + "张牌";
						}
					},
				},
			}
		},
		locked: true,
		eternalSkill_yzs: true,
		charlotte: true,
		superCharlotte: true,
		unique: true,
		enable: "phaseUse",
		usable: 1,
		prompt: `出牌阶段限1次：你将任意张红色牌与场上等量张牌传送至1自轮次后的次元`,
		filter: function (trigger, player) {
			const door = game.filterPlayer(current => current.hasSkill("ciyuanzhimen_yzs_summon") && current.isIn());
			if (!door.length) return false;
			return player.countCards("he", { color: "red" });
		},
		filterCard: {
			color: "red",
		},
		check(card) {
			return 6-get.value(card)
		},
		discard: false,
		lose: false,
		delay: false,
		selectCard: [1, Infinity],
		async content(event, trigger, player) {
			let num = event.cards.length;
			let next = player.addToExpansion(event.cards, player, "giveAuto")
			next.gaintag.add("gongyin_yzs_cards")
			await next;
			player.addSkill("gongyin_yzs_cards");
			while (num > 0) {
				let result = await player
					.chooseTarget()
					.set("filterTarget", function (card, player, target) {
						return !target.hasSkill("hidden_yzs")
					})
					.set("ai", target => {
						const player = get.player();
						return -get.attitude(player,target)/3*target.countCards("he")
					})
					.set("prompt", "共吟")
					.set("prompt2", "选择1名角色，将其区域内至多" + num + "张牌送至其1自轮次后的次元")
					.setHiddenSkill(event.name.slice(0, -5))
					.forResult();
				if (result.bool == false) break
				const target = result.targets[0];
				const result2 = await player.choosePlayerCard(target, [1, num], "hej", false).forResult();
				if (!result2.bool) break;
				next = target.addToExpansion(result2.cards, player, "giveAuto")
				next.gaintag.add("gongyin_yzs_cards")
				await next
				target.addSkill("gongyin_yzs_cards");
				num -= result2.cards.length;
			}
		},
		ai: {
			threaten: 1.1,
			order: 9,
			result: {
				player: 2,
			}
		}
	},
	ciyuanchaoyue_yzs: {
		Effect: function (player) { },
		nobracket: true,
		audio: "ext:一中杀/audio/skill:1",
		subSkill: {
			effect: {
				Effect: function (player) { },
				forceOut: true,
				popup: false,
				charlotte: true,
				group: "undist",
				priority: 2,
				forced: true,
				trigger: {
					player: "phaseBefore"
				},
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					if (player.countMark("ciyuanchaoyue_yzs_effect") > 0) {
						trigger.cancel();
					}
					player.removeMark("ciyuanchaoyue_yzs_effect", 1, false)
					if (player.countMark("ciyuanchaoyue_yzs_effect") <= 0) await player.removeSkill("ciyuanchaoyue_yzs_effect")
				},
				init(player) {
					if (_status.currentPhase == player) player.removeMark("ciyuanchaoyue_yzs_effect", 1, false)
					if (player.isIn()) {
						game.broadcastAll(function (player) {
							player.classList.add("out");
						}, player);
						game.log(player, "被送至" + player.countMark("ciyuanchaoyue_yzs_effect") + "自轮次后的次元");
					}
				},
				onremove(player) {
			//		player.playEffectOL(lib.skill.ciyuanchaoyue_yzs_effect.Effect);
					if (player.isOut()) {
						game.broadcastAll(function (player) {
							player.classList.remove("out");
						}, player);
						game.log(player, "从次元漩涡中回来了！");
					}
				},
				"_priority": 0,
			},
			round: {
				forceDie: true,
				forceOut: true,
				forced: true,
				persevereSkill: true,
				trigger: {
					global: "roundStart",
				},
				filter(event, player) {
					return _status.ciyuanchaoyue_yzs && _status.ciyuanchaoyue_yzs > 0
				},
				content() {
					_status.ciyuanchaoyue_yzs--;
					game.roundNumber--;
					game.updateRoundNumber();
				},
			},
		},
		limited: true,
		animationColor: "fire",
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
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
			player.yzs_UseShunfaji("ciyuanchaoyue_yzs");
		},
		clickableFilter: function (player) {
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let result = await player.chooseTarget(false)
				.set("filterTarget", (card, player, target) => {
					return !target.storage.isSub || target.hasSkill("ciyuanzhimen_yzs_summon");
				})
				.set("selectTarget", [1, 2])
				.set("prompt", "次元超越")
				.set("prompt2", `限定技：${get.poptip("wuyongchang_yzs")}：你指定至多2名人物，然后你将其余人物传送至其2自轮次后的次元！！！！！！！！<br>
	${get.poptip("ciyuanchaoyue_yzs_tip")}`)
				.forResult()
			if (!result.bool) {
				return;
			}
			let next = player.useSkill("ciyuanchaoyue_yzs")
			next.targets = result.targets;
			await next;
		},
		prompt2: `限定技：${get.poptip("wuyongchang_yzs")}：你指定至多2名人物，然后你将其余人物传送至其2自轮次后的次元！！！！！！！！<br>
	${get.poptip("ciyuanchaoyue_yzs_tip")}`,
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (!event.getParent("phase") && !event.getParent("dying")) return false;
			if (event.responded) return false;
			return true
		},
		multitarget: true,
		multiline: true,
		selectTarget: [1, 2],
		filterTarget: function (card, player, target) {
			return !target.storage.isSub || target.hasSkill("ciyuanzhimen_yzs_summon");
		},
		async content(event, trigger, player) {
			await player.yzs_setCountDown({
				once: true,
				num: 4,
				repeatNum: 4,
				command: {
					async todo(player) {
						player.restoreSkill("ciyuanchaoyue_yzs");
					},
					list: [player],
				},
				value(item, player) {
					return 8;
				},
				name: "ciyuanchaoyue_yzs",
				prompt: `失去此吟唱，然后你重获【次元超越】`,
				skill: "ciyuanchaoyue_yzs"
			});
			player.awakenSkill("ciyuanchaoyue_yzs");
			for (let target of game.filterPlayer(true)) {
				if (event.targets.includes(target)) continue;
				if (target.storage.isSub ) continue;
				target.setMark("ciyuanchaoyue_yzs_effect", 2, false);
		//		target.playEffectOL(lib.skill.ciyuanchaoyue_yzs.Effect);
				await target.addSkill("ciyuanchaoyue_yzs_effect");
			}
			game.broadcastAll(() => {
				if (!_status.ciyuanchaoyue_yzs) {
					_status.ciyuanchaoyue_yzs = 0;
				}
				_status.ciyuanchaoyue_yzs = 2;
			});
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 2,
			result: {
				player(player, target) {
					let v = -3;
					if (player.hp > 0) v += 2 / player.hp;
					v += 2 / player.countCards("h")
					return v;
				},
				target(player, target) {
					let v = 0;
					if (target.hp > 0) v += 2 / target.hp;
					v += 2 / target.countCards("h")
					return v;
				},
			}
		}
	},
	ciyuanzhimen_yzs_summon: {
		locked: true,
		charlotte: true,
		unique: true,
		group: ["ciyuanzhimen_yzs_summon_die", "ciyuanzhimen_yzs_summon_phase", "ciyuanzhimen_yzs_summon_send", "ciyuanzhimen_yzs_summon_damage", "ciyuanzhimen_yzs_summon_nodieAfter", "ciyuanzhimen_yzs_summon_dying"],
		subSkill: {
			die: {
				locked: true,
				forced: true,
				popup: false,
				forceOut: true,
				trigger: {
					global: "dieAfter"
				},
				filter(event, player) {
					return event.player.hasSkill("tiangongkaiwu_yzs")
				},
				async content(event, trigger, player) {
					await player.removeSkill("ciyuanchaoyue_yzs_effect")
					await player.die();
				},
			},
			phase: {
				locked: true,
				forced: true,
				popup: false,
				priority: 1,
				trigger: {
					player: "phaseBefore"
				},
				async content(event, trigger, player) {
					trigger.cancel();
				}
			},
			send: {
				priority:-33,
				locked: true,
				forced: true,
				trigger: {
					player: "damageSource"
				},
				filter(event, player) {
					if (!event.source) return false;
					if (event.source.storage.isSub) return false;
					return true;
				},
				async content(event, trigger, player) {
					trigger.source.setMark("ciyuanchaoyue_yzs_effect", 1, false);
					trigger.source.playEffectOL(lib.skill.ciyuanchaoyue_yzs.Effect);
					await trigger.source.addSkill("ciyuanchaoyue_yzs_effect");
				}
			},
			damage: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "damageBefore"
				},
				filter(event, player) {
					const evt = event.getParent();
					const skill = lib.skill[evt.name];
					if (skill) {
						return true;
					}
					if (!event.card) {
						return false;
					}
					const info = lib.card[event.card.name];
					if (info.selectTarget == -1) return true;
					return false;
				},
				content() {
					trigger.cancel();
				}
			},
			nodieAfter: {
				popup: false,
				forced: true,
				trigger: {
					player: ["dieBefore"]
				},
				async content(event, trigger, player) {
					trigger.nodieAfter = true;
				},
			},
			dying: {
				forced: true,
				popup: false,
				trigger: {
					player: ["dyingBegin"]
				},
				firstDo: true,
				async content(event, trigger, player) {
					await player.die(trigger.reason);
				},
			}
		},
		priority: 10,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		popup: false,
		async content(event, trigger, player) {
			const cards = player.getCards("hej");
			await player.discard(cards);
		},
		ai: {
			nogain: true,
			nodiscard: true,
			nolose: true,
			nodamage: true,
		}
	},
	//六魂花
	SSF_determination_yzs: {
		subSkill: {
			cundangused: {
				sub: true,
				sourceSkill: "SSF_determination_yzs",
				persevereSkill: true,
				charlotte: true,
			},
			dudangused: {
				sub: true,
				sourceSkill: "SSF_determination_yzs",
				persevereSkill: true,
				charlotte: true,
			},
			record: {
				sub: true,
				sourceSkill: "SSF_determination_yzs",
				persevereSkill: true,
				mark: true,
				marktext: "档",
				intro: {
					nocount: true,
					mark(dialog, _, player) {
						let records = player.storage.SSF_determination_yzs;
						for (let i = 0; i < records.length; i++) {
							let str = "";
							if (records[i].isEmpty) str += "空存档";
							else str += "手牌数：" + records[i].cards + " 体力值：" + records[i].hp
							dialog.addText("档案" + (i + 1) + "：" + str);
						}
					},
				},
			}
		},
		persevereSkill: true,
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
			let cundang = {
				hp: 0,
				cards: 0,
				isEmpty: true,
			};
			if (!player.storage.SSF_determination_yzs) {
				player.storage.SSF_determination_yzs = [cundang, cundang, cundang, cundang, cundang, cundang];
				player.markSkill("SSF_determination_yzs");
			}
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("SSF_determination_yzs");
		},
		clickableFilter: function (player) {
			if (player.hasSkill("SSF_determination_yzs_cundangused")) return false;
			if (!player.hasSkill("SSF_determination_yzs_dudangused")) return true;
			return game.hasPlayer(function (target) {
				if (!target.storage.SSF_determination_yzs || !target.storage.SSF_determination_yzs.length) return false;
				const records = target.storage.SSF_determination_yzs.filter(record => !record.isEmpty);
				return records.length;
			});
		},
		clickableContent: async function (event, trigger, player) {
			const num = player.hasSkill("SSF_determination_yzs_dudangused") ? 1 : [0, 1];
			let result = await player.chooseTarget("决心", "读取目标角色的存档(若不选则全场存档<br>同一回合仅能选择其中一种<br>每回合仅能存档一次)", num, false)
				.set("filterTarget", function (card, player, target) {
					if (!target.storage.SSF_determination_yzs || !target.storage.SSF_determination_yzs.length) return false;
					const records = target.storage.SSF_determination_yzs.filter(record => !record.isEmpty);
					return records.length;
				},)
				.forResult();
			if (!result.bool) return;
			let next = player.useSkill("SSF_determination_yzs")
			next.targets = result.targets;
			await next;
		},
		prompt2: "读取目标角色的存档(若不选则全场存档<br>同一回合仅能选择其中一种<br>每回合仅能存档一次)",
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		filter(event, player) {
			if (!event.getParent("phase") && !event.getParent("dying")) return false;
			if (event.responded) return false;
			if (player.hasSkill("SSF_determination_yzs_cundangused")) return false;
			if (!player.hasSkill("SSF_determination_yzs_dudangused")) return true;
			return game.hasPlayer(function (target) {
				if (!target.storage.SSF_determination_yzs || !target.storage.SSF_determination_yzs.length) return false;
				const records = target.storage.SSF_determination_yzs.filter(record => !record.isEmpty);
				return records.length;
			});
		},
		selectTarget: function () {
			const player = get.player();
			if (player.hasSkill("SSF_determination_yzs_dudangused")) return 1;
			return [0, 1];
		},
		filterTarget: function (card, player, target) {
			if (!target.storage.SSF_determination_yzs || !target.storage.SSF_determination_yzs.length) return false;
			const records = target.storage.SSF_determination_yzs.filter(record => !record.isEmpty);
			return records.length;
		},
		async content(event, trigger, player) {
			if (!event.targets || !event.targets.length) {
				await player.addTempSkill("SSF_determination_yzs_cundangused");
				let records = player.storage.SSF_determination_yzs.slice(0);
				for (let i = 0; i < records.length; i++) {
					let str = ""
					if (records[i].isEmpty) str += "(空存档)";
					else str += "你的手牌数：" + records[i].cards + " 你的体力值：" + records[i].hp
					records[i] = [i, "档案" + (i + 1) + str];
				}
				records.flat()
				let result2 = await player.chooseButton([
					"选择存档覆盖的位置",
					[
						records
						, "textbutton",
					],
				])
					.set("forced", false)
					.set("selectButton", 1)
					.set("filterButton", function (button) {
						return true
					})
					.set("ai", button => {
						const player = get.player();
						if (player.storage.SSF_determination_yzs[button.link].isEmpty) return 10;
						return Math.max(1,player.countCards("h") - player.storage.SSF_determination_yzs[button.link].cards);
					})
					.forResult();
				if (!result2.bool) {
					const evt = event.getParent(2);
					evt.goto(0);
					delete evt.openskilldialog;
					return;
				}
				player.chat(`<span class="yellowtext">档案` + (result2.links[0] + 1) + `已保存</span>`)
				game.log(`<span class="yellowtext">档案` + (result2.links[0] + 1) + `已保存</span>`)
				var players = game.filterPlayer();
				for (let target of players) {
					let cundang = {
						hp: 0,
						cards: 0,
						isEmpty: true,
					};
					if (!target.storage.SSF_determination_yzs) target.storage.SSF_determination_yzs = [cundang, cundang, cundang, cundang, cundang, cundang, cundang, cundang];
					target.storage.SSF_determination_yzs[result2.links[0]] = {
						hp: target.hp,
						cards: target.countCards("h"),
						isEmpty: false,
					}
					target.syncStorage("SSF_determination_yzs");
					target.markSkill("SSF_determination_yzs")
					target.markSkill("SSF_determination_yzs_record")
				}
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") {
					evt.goto(0);
					delete evt.openskilldialog;
				}
				return;
			}
			await player.addTempSkill("SSF_determination_yzs_dudangused");
			let target = event.targets[0];
			let records = target.storage.SSF_determination_yzs.slice(0);
			for (let i = 0; i < records.length; i++) {
				let str = ""
				if (records[i].isEmpty) str += "(空存档)";
				else str += "手牌数：" + records[i].cards + " 体力值：" + records[i].hp
				records[i] = [i, "档案" + (i + 1) + str];
			}
			records.flat()
			let result2 = await player.chooseButton([
				"选择要读取的存档",
				[
					records
					, "textbutton",
				],
			])
				.set("forced", false)
				.set("selectButton", 1)
				.set("target", target)
				.set("filterButton", function (button) {
					if (get.event().target.storage.SSF_determination_yzs[button.link].isEmpty) return false;
					return true
				})
				.set("ai", button => {
					const player = get.event().player;
					const target = get.event().target;
					return Math.max(1,get.attitude(player, target) * ((target.hp - target.storage.SSF_determination_yzs[button.link].hp) * get.effect(target, { name: "losehp" }, player, player) + (target.countCards("h") - target.storage.SSF_determination_yzs[button.link].cards) * get.effect(target, {name:"guohe"},player,player)))
				})
				.forResult();
			if (!result2.bool) {
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") {
					evt.goto(0);
					delete evt.openskilldialog;
				}
				return;
			}
			game.log(`档案` + (result2.links[0] + 1) + `已读取`)
			player.chat(`档案` + (result2.links[0] + 1) + `已读取`)
			if (target.storage.SSF_determination_yzs[result2.links[0]].isEmpty) {
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") {
					evt.goto(0);
					delete evt.openskilldialog;
				}
				return;
			}
			let cardnum = target.storage.SSF_determination_yzs[result2.links[0]].cards
			let hp = target.storage.SSF_determination_yzs[result2.links[0]].hp
			target.storage.SSF_determination_yzs[result2.links[0]] = {
				hp: 0,
				cards: 0,
				isEmpty: true,
			}
			target.syncStorage("SSF_determination_yzs");
			target.markSkill("SSF_determination_yzs")
			if (cardnum < target.countCards("h")) {
				await target.chooseToDiscard("h", target.countCards("h") - cardnum, true);
			} else if (cardnum > target.countCards("h")) {
				await target.draw(cardnum - target.countCards("h"));
			}
			if (target == player) {
				const evt = event.getParent(2);
				evt.goto(0);
				delete evt.openskilldialog;
				return;
			}
			if (hp < target.hp) {
				await target.loseHp(target.hp - hp);
			} else if (hp > target.hp) {
				await target.recover(hp - target.hp);
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		mod: {
			aiOrder(player, card, num) {
				if (player.storage.SSF_determination_yzs?.length && player.storage.SSF_determination_yzs.some(i => i.cards > player.getHandcardLimit() - 5)) return num;
				if(card.name!="wuzhong")return 0;
			}
		},
		ai: {
			order(item,player){
				if (player.countCards("h") <= player.getHandcardLimit()-2) return 10;
				return 0.1;
			},
			result: {
				target(player, target) {
					if (target == player) {
						if (player.storage.SSF_determination_yzs?.length && player.storage.SSF_determination_yzs.some(i => i.cards > player.getHandcardLimit() - 5)) return get.attitude(player, target) * (1 / target.hp) * (2 / target.countCards("h"))
						return 0;
					} else {
						let max = 0;
						if (target.storage.SSF_determination_yzs?.length) {
							for (let i of target.storage.SSF_determination_yzs) {
								max = Math.max(max, get.attitude(player, target) * ((target.hp - i.hp) * get.effect(target, { name: "losehp" }, player, player) + (target.countCards("h") - i.cards) * get.effect(target, { name: "guohe" }, player, player)))
							}
						}
						return 0;
						return max
					}
				},
			},
			threaten:4
		}
	},
	SixSouls_yzs: {
		persevereSkill: true,
		derivation: ["SixSouls_yzs_patience", "SixSouls_yzs_courage", "SixSouls_yzs_honesty", "SixSouls_yzs_perseverance", "SixSouls_yzs_kindness", "SixSouls_yzs_justice"],
		group: ["SixSouls_yzs_patience", "SixSouls_yzs_courage", "SixSouls_yzs_honesty", "SixSouls_yzs_perseverance", "SixSouls_yzs_kindness", "SixSouls_yzs_justice"],
		subSkill: {
			patience: {
				sub: true,
				sourceSkill: "SixSouls_yzs",
				forced: true,
				priority: 1312,
				trigger: {
					player: "phaseEnd"
				},
				async content(event, trigger, player) {
					await player.draw(2);
				}
			},
			courage: {
				sub: true,
				usable: 1,
				sourceSkill: "SixSouls_yzs",
				priority: 12,
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					return event.card.name == "sha"
				},
				forced: true,
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						player.getStat().card[trigger.card.name]--;
					}
					trigger.directHit.addArray(game.filterPlayer())
				},
			},
			honesty: {
				sub: true,
				sourceSkill: "SixSouls_yzs",
				mod: {
					maxHandcard: function (player, num) {
						return num + 4;
					},
				},
			},
			perseverance: {
				sub: true,
				sourceSkill: "SixSouls_yzs",
				round: 1,
				forced: true,
				priority: 13,
				trigger: {
					player: "damageBegin3"
				},
				async content(event, trigger, player) {
					trigger.num -= 3;
				}
			},
			kindness: {
				sub: true,
				sourceSkill: "SixSouls_yzs",
				usable: 1,
				enable: "phaseUse",
				prompt: "失去1点体力，然后令目标角色恢复1点体力",
				filter(event, player) {
					return player.hp > 2;
				},
				selectTarget: 1,
				filterTarget: function (card, player, target) {
					return player != target;
				},
				async content(event, trigger, player) {
					if (event.targets[0].hasSkill("Run_yzs")) {
						var stat = player.getStat().skill;
						delete stat.SixSouls_yzs_kindness;
					}
					if (!event.targets[0].hasSkill("Run_yzs")) await player.loseHp();
					await event.targets[0].recover();
				},
				ai: {
					order: 8,
					result: {
						player: -2,
						target(player, target) {
							return get.recoverEffect(target, target, target);
						}
					}
				}
			},
			justice: {
				sub: true,
				sourceSkill: "SixSouls_yzs",
				priority: 131,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					if (player.hp < 1) return false;
					return player.countCards("h") >= Math.min(player.hp, 4);
				},
				async cost(event, trigger, player) {
					const num = Math.min(player.hp, 4);
					const str = "你可弃" + num + "张手牌，然后对1名其他角色造成1点伤害，或弃置其区域内的至多2张牌"
					event.result = await player.chooseCardTarget()
						.set("forced", false)
						.set("prompt", str)
						.set("selectTarget", 1)
						.set("filterTarget", function (card, player, target) {
							return player != target;
						})
						.set("selectCard", num)
						.set("filterCard", lib.filter.cardDiscardable)
						.set("ai1", card => {
							const player = get.player();
							if (player.hasSkill("SSF_determination_yzs")) {
								if (player.storage.SSF_determination_yzs?.length && player.storage.SSF_determination_yzs.some(i => i.cards > player.getHandcardLimit() - 5)) return 6 - get.value(card, player)
								return 0;
							}
							if (ui.selected?.cards?.length >= 2) return 0;
							return 6-get.value(card,player)
						})
						.set("ai2", target => {
							const player = get.player();
							return get.damageEffect(target, player, player);
						})
						.set("position", "h")
						.forResult();
				},
				async content(event, trigger, player) {
					await player.discard(event.cards);
					const result = await player.discardPlayerCard(event.targets[0], 'hej', [1, 2])
						.set("ai", button => {
							const player = get.event().player;
							const target = get.event().target;
							return 1.5*get.effect(target, { name: "guohe" }, player)-get.damageEffect(target,player,player)
						})
						.set("target", event.targets[0])
						.forResult();
					if (!result.bool) {
						await event.targets[0].damage();
					}
				}
			},
		}
	},
	SSF_Nightmare_yzs: {
		global: "SSF_Nightmare_yzs_call",
		group: ["rg_treasure","SSF_Nightmare_yzs_dieAfter", "SSF_Nightmare_yzs_check", "SSF_Nightmare_yzs_damage", "SSF_Nightmare_yzs_sound", "SSF_Nightmare_yzs_start", "SSF_Nightmare_yzs_nodie", "SSF_Nightmare_yzs_maxdamage", "SSF_Nightmare_yzs_adddamage", "SSF_Nightmare_yzs_phase"],
		subSkill: {
			dieAfter: {
				priority: 1312,
				popup: false,
				persevereSkill: true,
				trigger: {
					player: ["discardBegin", "drawBegin"],
				},
				forced: true,
				forceDie: true,
				filter(event, player) {
					return event.getParent().name == "die" && event.getParent().source == player && event.player == player && event.getParent().player != player;
				},
				content() {
					trigger.cancel();
				},
			},
			check: {
				priority: -1312,
				forceDie: true,
				locked: true,
				persevereSkill: true,
				forced: true,
				popup: false,
				trigger: {
					global: ["die"]
				},
				filter(event, player) {
					if (event.player == player) return false;
					const players = game.players;
					if (players.length < 2) return false;
					return true;
				},
				async content(event, trigger, player) {
					player.$fullscreenpop("这是一场噩梦...", true)
					setTimeout(() => {
						player.$fullscreenpop("而你永远不会醒来！", true)
					}, 1500)
					await new Promise(r => setTimeout(r, 2500))
					game.broadcastAll(
						() => {
							game.createDanMu("哈哈哈哈", 300, 5)
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_start_laugh.mp3");
						},
					);
					game.broadcastAll(() => {
						// 创建振动关键帧
						const style = document.createElement('style');
						style.textContent = `
							@keyframes screenShake {
							  0%, 100% { transform: translate(0, 0); }
							  10%, 30%, 50%, 70%, 90% { transform: translate(-4px, -6px); }
							  20%, 40%, 60%, 80% { transform: translate(4px, 6px); }
							}
    
							.screen-shake {
							  animation: screenShake 0.1s ease-in-out infinite;
							}
    
							.screen-shake-5s {
							  animation: screenShake 0.1s ease-in-out;
							  animation-iteration-count: 50; 
							}
						  `;
						document.head.appendChild(style);

						// 应用振动效果到根元素
						document.documentElement.classList.add('screen-shake-5s');
						setTimeout(() => {
							document.documentElement.classList.remove('screen-shake-5s');
							style.remove();
						}, 6000);
					});
					trigger.noDieAfter = true;
				},
			},
			damage: {
				nopop: true,
				forced: true,
				persevereSkill: true,
				LastDo: true,
				trigger: {
					player: "damageBegin4"
				},
				filter(event, player) {
					return event.num > 0;
				},
				async content(event, trigger, player) {
					if (player.countMark("Finale_yzs") > 0) {
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage3.MP3");
						});
					}
					if (player.hp > player.maxHp/2) {
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage1.MP3");
						});
					} else {
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage2.MP3");
						});
					}
				}
			},
			sound: {
				forced: true,
				persevereSkill: true,
				priority: 12312,
				popup:false,
				trigger: {
					player: "useCard"
				},
				filter(event, player) {
					if (event.card.storage?.SixSouls_yzs_perseverance_test) return false;
					if (player.countMark("SSF_Nightmare_yzs_final") > 0) return false;
					return event.card.name != "taoyuan"
				},
				async content(event, trigger, player) {
					const index = Math.floor(Math.random() * 4) + 1;
					const bgm = "SSF_Nightmare_yzs_sound" + index;
					game.broadcastAll((player, bgm) => {
						game.playAudio("ext:一中杀/audio/skill/" + bgm + ".MP3");
					}, player, bgm);
				}
			},
			start: {
				forced: true,
				popup: false,
				persevereSkill: true,
				priority: 12312,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					const bgm = "SSF_Nightmare_yzs1"
					game.broadcastAll((player, bgm) => {
						if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
						ui.backgroundMusic.pause();
						var video = document.createElement("VIDEO");
						video.className = "anime";

						Object.assign(video, {
							src: lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_start.MP4",
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
							transition: "opacity 0.5s ease-out",
						})
						video.addEventListener("ended", () => {
							video.style.opacity = "0";
							if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
							ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
							_status.tempMusic = "ext:一中杀/audio/" + bgm + ".MP3";
							game.playBackgroundMusic();
							setTimeout(() => {
								document.body.removeChild(video);
							}, 1000)//1s后移除视频
						})
						document.body.appendChild(video);
						setTimeout(() => {
							video.style.opacity = "1";
						}, 50)
					}, player, bgm);
					await new Promise(r => setTimeout(r, 28444))
				},
			},
			final: {
				sub: true,
				sourceSkill: "SSF_Nightmare_yzs",
				priority: 623,
				forced: true,
				persevereSkill: true,
				popup: false,
				trigger: {
					global: ["dying"],
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					await trigger.player.recover(Math.max(trigger.player.maxHp - trigger.player.hp, 1));
					let flowey = game.filterPlayer(current => current.hasSkill("SSF_Nightmare_yzs"));
					if (!flowey.length) return;
					flowey = flowey[0];
					if (!player.countMark("SSF_Nightmare_yzs_final")) {
						flowey.chat("档案3已读取")
						game.log(`档案3已读取`)
					}
				}
			},
			anime: {
				forced: true,
				persevereSkill: true,
				popup: false,
				direct: true,
				async content(event, trigger, player) {
					setTimeout(function () {
						player.$fullscreenpop("不！...不！！！")
					}, 8000);
					setTimeout(function () {
						player.$fullscreenpop("这怎么可能！！！")
					}, 11000);
					setTimeout(function () {
						player.$fullscreenpop("你...你...")
					}, 14000);
					game.broadcastAll((player) => {
						ui.backgroundMusic.pause();
						player.$damage();
						game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage2.MP3");
						game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage3.MP3");
						setTimeout(function () {
							player.$damage();
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage3.mp3");
						}, 2000);
						setTimeout(function () {
							player.$damage();
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage3.mp3");
						}, 4000);
						setTimeout(function () {
							player.$damage();
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage2.MP3");
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_damage3.MP3");
						}, 6000);
						setTimeout(function () {
							if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_final.png");
						}, 17000);
					}, player);
					await new Promise(r => setTimeout(r, 17000))
					player.chat("档案3已读取")
					game.log(`档案3已读取`)
					await player.recover(player.maxHp - player.hp);
					game.broadcastAll((player) => {
						setTimeout(function () {
							if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_final2.png");
						}, 3000);
					}, player);
					await new Promise(r => setTimeout(r, 3000))
					const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
					for (let target of players) {
						await target.damage(target.hp)
					}
					for (let target of players) {
						await target.damage(target.hp)
					}
					for (let target of players) {
						await target.damage(target.hp)
					}
					for (let target of players) {
						await target.loseToDiscardpile(target.getCards("hej"));
					}
					for (let target of players) {
						target.hp = 1;
						target.update();
					}
					for (let target of players) {
						await target.link();
					}
					player.addMark("SSF_Nightmare_yzs_final", 1, false)
					await player.useCard({ name: "jiu", isCard: false }, player);
					await player.useCard({ name: "jiu", isCard: false }, player);
					await player.useCard({ name: "jiu", isCard: false }, player);
					await player.useCard({ name: "jiu", isCard: false }, player);
					await player.useCard({ name: "jiu", isCard: false }, player);
					await player.chooseUseTarget("guding", true);
					event.card = {
						name: "sha",
						nature: "fire"
					};
					game.broadcastAll(
						() => {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_start_laugh.mp3");
						},
					);
					game.broadcastAll(() => {
						// 创建振动关键帧
						const style = document.createElement('style');
						style.textContent = `
							@keyframes screenShake {
							  0%, 100% { transform: translate(0, 0); }
							  10%, 30%, 50%, 70%, 90% { transform: translate(-4px, -6px); }
							  20%, 40%, 60%, 80% { transform: translate(4px, 6px); }
							}
    
							.screen-shake {
							  animation: screenShake 0.1s ease-in-out infinite;
							}
    
							.screen-shake-5s {
							  animation: screenShake 0.1s ease-in-out;
							  animation-iteration-count: 50; 
							}
						  `;
						document.head.appendChild(style);

						// 应用振动效果到根元素
						document.documentElement.classList.add('screen-shake-5s');
						setTimeout(() => {
							document.documentElement.classList.remove('screen-shake-5s');
							style.remove();
						}, 6000);
					});
					await new Promise(r => setTimeout(r, 7000))
					await player.useCard({ name: "sha", isCard: true, nature: "fire" }, players);
					setTimeout(function () {
						player.$fullscreenpop("什么?")
					}, 2000);
					setTimeout(function () {
						player.$fullscreenpop("你是怎么...?")
					}, 4000);
					setTimeout(function () {
						player.$fullscreenpop("哼，那么我就")
					}, 7000);
					setTimeout(function () {
						player.chat("读取失败")
						game.log(`读取失败`)
					}, 8000);
					setTimeout(function () {
						player.$fullscreenpop("什...")
					}, 9000);
					setTimeout(function () {
						player.$fullscreenpop("我的力量呢！?")
					}, 11000);
					setTimeout(function () {
						player.$fullscreenpop("那些灵魂...?")
					}, 17000);
					setTimeout(function () {
						player.$fullscreenpop("他们在干嘛?")
					}, 20000);
					setTimeout(function () {
						player.$fullscreenpop("不!!不!!!!!")
					}, 24000);
					setTimeout(function () {
						player.$fullscreenpop("你们不能那么做！！！")
					}, 26000);
					setTimeout(function () {
						player.$fullscreenpop("你们应该服从我！！！")
					}, 28000);
					setTimeout(function () {
						player.$fullscreenpop("停！！！停下来！！！！！")
					}, 30500);
					setTimeout(function () {
						player.$fullscreenpop("停！！！！！！！")
					}, 32500);
					game.broadcastAll((player) => {
						setTimeout(function () {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_final_flash.MP3");
							let flash = document.createElement('div');
							flash.style.cssText = `
							position: fixed;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%);
							z-index: 999999;
							pointer-events: none;
							opacity: 0;
							animation: fullFlash 0.5s ease-out;
						`;
							let style = document.createElement('style');
							style.textContent = `
							@keyframes fullFlash {
								0% { 
									opacity: 0;
									filter: blur(0px);
								}
								15% { 
									opacity: 1;
									filter: blur(5px);
								}
								30% { 
									opacity: 0.8;
									filter: blur(3px);
								}
								100% { 
									opacity: 0;
									filter: blur(10px);
								}
							}
						`;
							document.head.appendChild(style);
							document.body.appendChild(flash);
							setTimeout(() => {
								if (flash.parentNode) flash.parentNode.removeChild(flash);
								if (style.parentNode) style.parentNode.removeChild(style);
							}, 500);
						}, 14000);
						setTimeout(function () {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_final_flash2.MP3");
							if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
							// 振动效果
							const styleId = 'player-shake-style';
							let style = document.createElement('style');
							style.id = styleId;
							style.textContent = `
								@keyframes playerShake {
									0%, 100% { transform: translateX(0); }
									25% { transform: translateX(-8px); }
									50% { transform: translateX(8px); }
									75% { transform: translateX(-8px); }
								}
								.player-shaking {
									animation: playerShake 0.4s ease-in-out 100;
								}
							`;
							document.head.appendChild(style);

							player.classList.add('player-shaking');

							setTimeout(() => {
								ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png');
								player.classList.remove('player-shaking');
								if (style.parentNode) {
									style.parentNode.removeChild(style);
								}
							}, 14500);
							let flash = document.createElement('div');
							flash.style.cssText = `
							position: fixed;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%);
							z-index: 999999;
							pointer-events: none;
							opacity: 0;
							animation: fullFlash 0.5s ease-out;
						`;
							style = document.createElement('style');
							style.textContent = `
							@keyframes fullFlash {
								0% { 
									opacity: 0;
									filter: blur(0px);
								}
								15% { 
									opacity: 1;
									filter: blur(5px);
								}
								30% { 
									opacity: 0.8;
									filter: blur(3px);
								}
								100% { 
									opacity: 0;
									filter: blur(10px);
								}
							}
						`;
							document.head.appendChild(style);
							document.body.appendChild(flash);
							setTimeout(() => {
								if (flash.parentNode) flash.parentNode.removeChild(flash);
								if (style.parentNode) style.parentNode.removeChild(style);
							}, 500);
						}, 23500);
						setTimeout(function () {
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
							transition: background 4s ease-in-out;
						`;

							// 添加到页面
							document.body.appendChild(whiteOverlay);

							// 开始变白
							setTimeout(() => {
								whiteOverlay.style.background = 'rgba(255, 255, 255, 1)';

								// 一段时间后恢复
								setTimeout(() => {
									whiteOverlay.style.background = 'rgba(255, 255, 255, 0)';

									// 完全透明后移除元素
									setTimeout(() => {
										if (whiteOverlay.parentNode) {
											whiteOverlay.parentNode.removeChild(whiteOverlay);
										}
									}, 2000);
								}, 5000); // 保持白色3秒
							}, 100);
						}, 33500);
					}, player);
					await new Promise(r => setTimeout(r, 38000))
					await player.loseToDiscardpile(player.getCards("hej"));
					player.hp = 1;
					player.maxHp = 4;
					player.update();
					await player.changeCharacter(["FailedFlowey_yzs"], false)

				},
			},
			call: {
				sub: true,
				sourceSkill: "SSF_Nightmare_yzs",
				priority: 62,
				persevereSkill: true,
				popup: false,
				trigger: {
					player: ["dying"],
				},
				prompt: "是否大声求救？",
				prompt2: "已死亡的角色可以令你恢复1点体力并摸1张牌，所有角色彼此之间只能拯救一次！",
				filter(event, player) {
					if (player.hasSkill("SSF_Nightmare_yzs")) return false;
					let players = game.dead;
					if (player.storage.SSF_determination_yzs_call && player.storage.SSF_determination_yzs_call.length) players = players.filter(p => !player.storage.SSF_determination_yzs_call.includes(p));
					if (!players.length) return false;
					return true;
				},
				async content(event, trigger, player) {
					player.$fullscreenpop("你大声呼救……")
					game.log(player, "大声呼救……")
					let players = game.dead;
					if (player.storage.SSF_determination_yzs_call && player.storage.SSF_determination_yzs_call.length) players = players.filter(p => !player.storage.SSF_determination_yzs_call.includes(p));
					let called = false;
					for (let target of players) {
						let result = await target.chooseBool(function () {
							return get.attitude(target, player) > 0;
						}, "是否令" + get.translation(player) + "恢复1点体力并摸1张牌？(每名角色你只能拯救一次！)")
							.forResult();
						if (!result.bool) continue;
						called = true;
						let num = 1;
						const names = ["Frisk", "frisk", "福", "福里斯克", "弗里斯克", "弗利斯克","决心福"]
						for (let name of names) {
							if (get.translation(player)==name || get.translation(target)==name) {
								num = 3;
								break;
							}
						}
						await player.recover(num);
						await player.draw(num);
						player.markAuto("SSF_determination_yzs_call", [target]);
					}
					if (!called) {
						game.log("然而谁也没有来。")
					}
				}
			},
			nodie: {
				sub: true,
				sourceSkill: "SSF_Nightmare_yzs",
				priority: 623,
				persevereSkill: true,
				forceDie: true,
				forced: true,
				popup: false,
				trigger: {
					player: ["dying", "dieBegin"],
				},
				filter(event, player) {
					if (event.name != "die") return true;
					return event.getParent().name != "giveup" && event.getParent().name != "SSF_Nightmare_yzs_final" && player.maxHp > 0;
				},
				async content(event, trigger, player) {
					trigger.cancel();
					if (player.countMark("Finale_yzs") && player.hp <= 0) {
						await player.addSkill("SSF_Nightmare_yzs_final")
						await player.useSkill("SSF_Nightmare_yzs_anime");
					}
				}
			},
			maxdamage: {
				sub: true,
				sourceSkill: "SSF_Nightmare_yzs",
				priority: 623,
				forced: true,
				persevereSkill: true,
				popup: false,
				trigger: {
					player: ["changeHpBegin"],
				},
				filter(event, player) {
					let evt = event.getParent();
					if (evt.SSF_Nightmare_yzs_adddamage) return false;
					return event.num < -400
				},
				async content(event, trigger, player) {
					const max =  -400
					trigger.num = max;
				}
			},
			adddamage: {
				sub: true,
				sourceSkill: "SSF_Nightmare_yzs",
				priority: 623,
				forced: true,
				popup: false,
				persevereSkill: true,
				trigger: {
					player: ["damageBegin3"],
				},
				filter(event, player) {
					if (!event.source) return false;
					if (event.source == player) return false;
					if (_status.SixSouls_yzs?.length > 0) return true;
					return false;
				},
				async content(event, trigger, player) {
					if (trigger.num > 6) trigger.num = 6;
					if (trigger.num == 0) {
						trigger.num += Math.pow(3, _status.SixSouls_yzs.length - 1);
						trigger.num /= 3;
					} else {
						trigger.num *= Math.pow(3, _status.SixSouls_yzs.length - 1);
					}
					if (player.hp < player.maxHp / 2 && player.countMark("Finale_yzs")) trigger.num *= 2;
					trigger.num *= 1 + 0.2 * Math.random();
					trigger.num = Math.floor(trigger.num)
					trigger.SSF_Nightmare_yzs_adddamage = true;
				}
			},
			phase: {
				marktext: "魇",
				intro: {
					content: "当前有#枚标记",
					name: "魇",
				},
				sub: true,
				sourceSkill: "SSF_Nightmare_yzs",
				priority: 623,
				direct: true,
				persevereSkill: true,
				forced: true,
				popup: false,
				trigger: {
					global: "roundStart",
				},
				filter(event, player) {
					if (game.roundNumber < 2) return false;
					return !_status.SixSouls_yzs || _status.SixSouls_yzs.length < 6
				},
				async content(event, trigger, player) {
					if (player.countMark("Finale_yzs") > 0) return;

					let list = ["SixSouls_yzs_patience", "SixSouls_yzs_courage", "SixSouls_yzs_honesty", "SixSouls_yzs_perseverance", "SixSouls_yzs_kindness", "SixSouls_yzs_justice"];
					if (_status.SixSouls_yzs?.length > 0) list = list.filter(skill => !_status.SixSouls_yzs.includes(skill));
					const index = Math.floor(Math.random() * list.length);
					const skill = list[index] + "_test";
					game.broadcastAll((player, skill) => {
						ui.backgroundMusic.pause();
						if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
						game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
						//把屏幕变黑 - CSS动画版本
						let overlay = document.createElement('div');
						overlay.id = 'skill-dark-overlay';

						// 添加CSS样式
						let style = document.createElement('style');
						style.textContent = `
							@keyframes fadeToBlack {
								0% { background: rgba(0, 0, 0, 0); }
								100% { background: rgba(0, 0, 0, 0.9); }
							}
							@keyframes fadeFromBlack {
								0% { background: rgba(0, 0, 0, 0.9); }
								100% { background: rgba(0, 0, 0, 0); }
							}
							.dark-overlay {
								position: fixed;
								top: 0;
								left: 0;
								width: 100%;
								height: 100%;
								z-index: 0;
								pointer-events: none;
							}
						`;
						document.head.appendChild(style);

						overlay.className = 'dark-overlay';
						overlay.style.animation = 'fadeToBlack 1.2s ease-in-out forwards';

						document.body.appendChild(overlay);

						setTimeout(() => {
							ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png');
							overlay.style.animation = 'fadeFromBlack 1.5s ease-in-out forwards';
							// 动画结束后移除
							setTimeout(() => {
								if (overlay.parentNode) {
									overlay.parentNode.removeChild(overlay);
								}
								if (style.parentNode) {
									style.parentNode.removeChild(style);
								}
							}, 1600);
						}, 1200);
					}, player, skill);
					await new Promise(r => setTimeout(r, 1200))
					await player.useSkill(skill);

					if (_status.SixSouls_yzs?.length > 5) {
						//进入二阶段Finale
						player.addMark("Finale_yzs", false);
						game.broadcastAll(() => {
							_status.tempMusic = `ext:一中杀/audio/Finale.mp3`;
							game.playBackgroundMusic();
						});
						var targets = game.filterPlayer(current => current != player);
						//耐心
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_patience_test.png");
						}, player);
						player.$fullscreenpop("*你感到耐心浸润着心智")
						for (let target of targets) {
							if (target.hp < target.maxHp) await target.recover();
							else await target.draw();
						}
						await game.delayx();
						//勇气
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_courage_test.png");
						}, player);
						player.$fullscreenpop("*你感到勇气贯穿了脊梁")
						for (let target of targets) {
							if (target.hp < target.maxHp) await target.recover();
							else await target.draw();
						}
						await game.delayx();
						//诚实
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_honesty_test.png");
						}, player);
						player.$fullscreenpop("*你感到正直依附在双肩")
						for (let target of targets) {
							if (target.hp < target.maxHp) await target.recover();
							else await target.draw();
						}
						await game.delayx();
						//毅力
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_perseverance_test.png");
						}, player);
						player.$fullscreenpop("*你感到毅力振奋了躯干")
						for (let target of targets) {
							if (target.hp < target.maxHp) await target.recover();
							else await target.draw();
						}
						await game.delayx();
						//仁慈
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_kindness_test.png");
						}, player);
						player.$fullscreenpop("*你感到仁慈涌进了心灵")
						for (let target of targets) {
							if (target.hp < target.maxHp) await target.recover();
							else await target.draw();
						}
						await game.delayx();
						//正义
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_justice_test.png");
						}, player);
						player.$fullscreenpop("*你感到正义充斥着双拳")
						for (let target of targets) {
							if (target.hp < target.maxHp) await target.recover();
							else await target.draw();
						}
						await game.delayx();
						game.broadcastAll((current) => {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_justice_test.png");
						}, player);
						player.$fullscreenpop("*你充满了决心！")
						for (let target of targets) {
							await target.changeHujia(1);
						}
						await game.delayx();
						game.broadcastAll((current) => {
							game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
							var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
							var duration = 1200;

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

							img.style.zIndex = "0";
							img.style.opacity = 1;
							img.style.pointerEvents = "none"; // 防止点击事件被阻挡

							document.body.appendChild(img);

							// 确保图片在视口最前方
							img.style.transition = "opacity 1s ease-out";

							setTimeout(function () {
								ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
								if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
								img.style.opacity = 0;
								setTimeout(function () {
									if (img.parentNode) {
										img.parentNode.removeChild(img);
									}
								}, 1000);
							}, duration);
						}, player);
						await new Promise(r => setTimeout(r, 1200))
						game.log("*小花的防御力降到了0！")
						player.$fullscreenpop("*小花的防御力降到了0！")
					}
				}
			},
		},
		mod: {
			targetInRange: function (card) {
				return true;
			},
			maxHandcard: function (player, num) {
				return 20;
			},
		},
		priority:22,
		forced: true,
		persevereSkill: true,
		trigger: {
			global: "phaseAfter"
		},
		filter(event, player) {
			return !event.skill || event.skill =="SSF_Nightmare_yzs";
		},
		async content(event, trigger, player) {
			player.addMark("SSF_Nightmare_yzs_phase");
			if (player.countMark("SSF_Nightmare_yzs_phase") >= 3) {
				let result = await player.chooseTarget(`当前还有${player.countMark("SSF_Nightmare_yzs_phase")}枚【梦魇】标记`, `你可消耗3枚，获得一个额外回合`)
					.set("filterTarget", (card, player, target) => {
						return target == _status.event.target;
					})
					.set('target', player)
					.forResult();
				if (result.bool) {
					player.removeMark("SSF_Nightmare_yzs_phase", 3)
					player.insertPhase(event.name)
				}
			} 
			if (!player.countMark("Finale_yzs") && trigger.player == player && !trigger.skill) {
				await player.useSkill("SSF_Nightmare_yzs_phase")
			}
		},
	},
	BossRule_yzs: {
		priority: -1314,
		forceDie: true,
		locked: true,
		persevereSkill: true,
		forced: true,
		popup: false,
		trigger: {
			global: ["dieBefore"]
		},
		filter(event, player) {
			if (event.player == player) return false;
			const players = game.players;
			if (players.length <= 2) return false;
			return true;
		},
		async content(event, trigger, player) {
			trigger.noDieAfter = true;
			trigger.noDieAfter2 = true;
		},
	},
	SixSouls_yzs_patience_test: {
		persevereSkill: true,
		subSkill: {
			draw: {
				forced: true,
				popup: false,
				sub: true,
				sourceSkill: "SixSouls_yzs_patience_test",
				persevereSkill: true,
				priority: 342,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return player.countMark("SixSouls_yzs_patience_test_draw") > 0;
				},
				async content(event, trigger, player) {
					const num = player.countMark("SixSouls_yzs_patience_test_draw");
					player.clearMark("SixSouls_yzs_patience_test_draw", false);
					await player.draw(num)
				}
			},
			record: {
				priority: 62,
				sub: true,
				sourceSkill: "SixSouls_yzs_patience_test",
				persevereSkill: true,
				mark: true,
				markimage: "extension/一中杀/image/SixSouls_yzs_patience_test.png",
				intro: {
					content: "若选择弃牌，则可拯救“耐心”",
				},
			}
		},
		direct: true,
		async content(event, trigger, player) {
			game.broadcastAll((current) => {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_patience_test.png");
				_status.tempMusic = `ext:一中杀/audio/skill/SixSouls_yzs_patience_test.mp3`;
				game.playBackgroundMusic();
			}, player);
			await player.addSkill("SixSouls_yzs_patience_test_record");
			player.markSkill("SixSouls_yzs_patience_test_record")
			const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
			let drawed = false;
			for (let target of players) {
				const result = await target.chooseButton([
					"耐心：是否摸2张牌？(请“耐心”！)",
					[
						[
							["draw", "摸2张牌"],
							["discard", "弃置全部手牌，你的下回合开始时摸等量+3张牌"],
						],
						"textbutton",
					],
				])
					.set("forced", true)
					.set("selectButton", 1)
					.set("filterButton", function (button) {
						return true;
					})
					.set("ai", button => {
						const player=get.player()
						if (button.link === "draw") {
							return 4;
						} else {
							if (player.maxHp-player.hp<=1) return 6;
							return 6-2/player.hp-player.countCards("h")
						}
					})
					.forResult();
				if (!result.bool) continue;
				if (result.links[0] == "draw") {
					drawed = true;
					await target.draw(2);
				} else {
					let cards = target.getCards("h");
					await target.addSkill("SixSouls_yzs_patience_test_draw")
					target.addMark("SixSouls_yzs_patience_test_draw", cards.length + 3, false)
					await target.discard(cards);
					target.addSkill("SixSouls_yzs_patience")
					await target.recover();
					await target.draw()
				}
			}
			player.addMark("SixSouls_yzs_patience",1, false);
			game.broadcastAll(() => {
				if (!_status.SixSouls_yzs) {
					_status.SixSouls_yzs = [];
				}
				_status.SixSouls_yzs.push("SixSouls_yzs_patience");
			});
			await player.removeSkill("SixSouls_yzs_patience_test_record")
			const index = Math.floor(Math.random() * 4) + 1;
			const bgm = "SSF_Nightmare_yzs" + index;
			const finale = _status.SixSouls_yzs?.length > 5 ? true : false;
			game.broadcastAll((bgm, current, finale) => {
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
				if (finale) return;
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
				var duration = 1200;
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
				img.style.zIndex = "0";
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡
				document.body.appendChild(img);
				// 确保图片在视口最前方
				img.style.transition = "opacity 1s ease-out";
				setTimeout(function () {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
					img.style.opacity = 0;
					setTimeout(function () {
						if (img.parentNode) {
							img.parentNode.removeChild(img);
						}
					}, 1000);
					ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
					_status.tempMusic = `ext:一中杀/audio/` + bgm + `.mp3`;
					game.playBackgroundMusic();
				}, duration);
			}, bgm, player, finale);
			await new Promise(r => setTimeout(r, 1200))
		}
	},
	SixSouls_yzs_courage_test: {
		persevereSkill: true,
		subSkill: {
			record: {
				priority: 62,
				persevereSkill: true,
				sub: true,
				sourceSkill: "SixSouls_yzs_courage_test",
				mark: true,
				markimage: "extension/一中杀/image/SixSouls_yzs_courage_test.png",
				intro: {
					content: "若拒绝给出牌，则可拯救“勇气”",
				},
			}
		},
		direct: true,
		async content(event, trigger, player) {
			game.broadcastAll((current) => {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_courage_test.png");
				_status.tempMusic = `ext:一中杀/audio/skill/SixSouls_yzs_courage_test.mp3`;
				game.playBackgroundMusic();
			}, player);
			await player.addSkill("SixSouls_yzs_courage_test_record");
			player.markSkill("SixSouls_yzs_courage_test_record")
			const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
			let gived = false;
			for (let target of players) {
				const result = await target.chooseCard()
					.set("forced", false)
					.set("prompt", "勇气：给予“六魂花”2张手牌，不给则失去2点体力(请“勇敢”！)")
					.set("selectCard", 2)
					.set("ai", card => {
						const player = get.player();
						if (player.hp <= 2) return 8 - get.value(card, player);
						return 4 - get.value(card, player);
					})
					.set("position", "h")
					.forResult()
				if (!result.bool) {
					await target.loseHp(2);
					target.addSkill("SixSouls_yzs_courage")
					await target.recover();
					await target.draw();
					continue;
				};
				gived = true;
				await target.give(result.cards, player);
			}

			player.addMark("SixSouls_yzs_courage", 1,false);
			game.broadcastAll(() => {
				if (!_status.SixSouls_yzs) {
					_status.SixSouls_yzs = [];
				}
				_status.SixSouls_yzs.push("SixSouls_yzs_courage");
			});

			await player.removeSkill("SixSouls_yzs_courage_test_record")
			const index = Math.floor(Math.random() * 4) + 1;
			const bgm = "SSF_Nightmare_yzs" + index;
			const finale = _status.SixSouls_yzs?.length > 5 ? true : false;
			game.broadcastAll((bgm, current, finale) => {
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
				if (finale) return;
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
				var duration = 1200;

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

				img.style.zIndex = "0";
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡

				document.body.appendChild(img);

				// 确保图片在视口最前方
				img.style.transition = "opacity 1s ease-out";

				setTimeout(function () {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
					img.style.opacity = 0;
					setTimeout(function () {
						if (img.parentNode) {
							img.parentNode.removeChild(img);
						}
					}, 1000);
					ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
					_status.tempMusic = `ext:一中杀/audio/` + bgm + `.mp3`;
					game.playBackgroundMusic();
				}, duration);
			}, bgm, player, finale);
			await new Promise(r => setTimeout(r, 1200))
		}
	},
	SixSouls_yzs_honesty_test: {
		persevereSkill: true,
		subSkill: {
			record: {
				sub: true,
				sourceSkill: "SixSouls_yzs_honesty_test",
				persevereSkill: true,
				mark: true,
				markimage: "extension/一中杀/image/SixSouls_yzs_honesty_test.png",
				intro: {
					content: "若未弃置非【桃】的牌，则可拯救“诚实”",
				},
			}
		},
		direct: true,
		async content(event, trigger, player) {
			game.broadcastAll((current) => {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_honesty_test.png");
				_status.tempMusic = `ext:一中杀/audio/skill/SixSouls_yzs_honesty_test.mp3`;
				game.playBackgroundMusic();
			}, player);
			await player.addSkill("SixSouls_yzs_honesty_test_record");
			player.markSkill("SixSouls_yzs_honesty_test_record")
			const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
			for (let target of players) {
				let cheated = false;
				const result = await target.chooseToDiscard()
					.set("forced", false)
					.set("prompt", "诚实：你可弃置1张【桃】，然后摸2张牌(请“诚实”！)")
					.set("ai", card => {
						if (card.name == "tao" && player.isHealthy()) return 4;
						return 0
					})
					.set("selectCard", 1)
					.set("position", "h")
					.forResult()
				if (result.bool&&result.cards[0].name != "tao") cheated = true;
				if (result.bool)await target.draw(2);
				if (!cheated) {
					target.addSkill("SixSouls_yzs_honesty");
					await target.recover();
					await target.draw()
				}
			}

			player.addMark("SixSouls_yzs_honesty",1, false);
			game.broadcastAll(() => {
				if (!_status.SixSouls_yzs) {
					_status.SixSouls_yzs = [];
				}
				_status.SixSouls_yzs.push("SixSouls_yzs_honesty");
			});

			await player.removeSkill("SixSouls_yzs_honesty_test_record")
			const index = Math.floor(Math.random() * 4) + 1;
			const bgm = "SSF_Nightmare_yzs" + index;
			const finale = _status.SixSouls_yzs?.length > 5 ? true : false;
			game.broadcastAll((bgm, current, finale) => {
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
				if (finale) return;
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
				var duration = 1200;

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

				img.style.zIndex = "0";
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡

				document.body.appendChild(img);

				// 确保图片在视口最前方
				img.style.transition = "opacity 1s ease-out";

				setTimeout(function () {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
					img.style.opacity = 0;
					setTimeout(function () {
						if (img.parentNode) {
							img.parentNode.removeChild(img);
						}
					}, 1000);
					ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
					_status.tempMusic = `ext:一中杀/audio/` + bgm + `.mp3`;
					game.playBackgroundMusic();
				}, duration);
			}, bgm, player, finale);
			await new Promise(r => setTimeout(r, 1200))
		}
	},
	SixSouls_yzs_perseverance_test: {
		persevereSkill: true,
		subSkill: {
			record: {
				popup: false,
				forced: true,
				persevereSkill: true,
				sub: true,
				sourceSkill: "SixSouls_yzs_perseverance_test",
				mark: true,
				markimage: "extension/一中杀/image/SixSouls_yzs_perseverance_test.png",
				intro: {
					content: "若未被打进濒死，则可拯救“毅力”",
				},
				trigger: {
					global: "dyingBegin"
				},
				filter(event, player) {
					return event.player != player;
				},
				async content(event, trigger, player) {
					trigger.player.clearMark("SixSouls_yzs_perseverance_test",false)
				}
			}
		},
		direct: true,
		async content(event, trigger, player) {
			game.broadcastAll((current) => {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_perseverance_test.png");
				_status.tempMusic = `ext:一中杀/audio/skill/SixSouls_yzs_perseverance_test.mp3`;
				game.playBackgroundMusic();
			}, player);
			await player.addSkill("SixSouls_yzs_perseverance_test_record");
			player.markSkill("SixSouls_yzs_perseverance_test_record")
			const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
			for (let target of players) {
				target.addMark("SixSouls_yzs_perseverance_test", 1, false);
			}
			await player.chooseUseTarget({ name: "wanjian", storage: { SixSouls_yzs_perseverance_test :true} }, true, false, "nodistance")
				.set("prompt", "毅力")
				.set("prompt2", "视为使用一张【万箭齐发】")
			await player.chooseUseTarget({ name: "nanman", storage: { SixSouls_yzs_perseverance_test: true } }, true, false, "nodistance")
				.set("prompt", "毅力")
				.set("prompt2", "视为使用一张【南蛮入侵】")
			for (let target of players) {
				if (target.countMark("SixSouls_yzs_perseverance_test")) {
					target.addSkill("SixSouls_yzs_perseverance");
					await target.recover();
					await target.draw()
				}
			}

			player.addMark("SixSouls_yzs_perseverance",1, false);
			game.broadcastAll(() => {
				if (!_status.SixSouls_yzs) {
					_status.SixSouls_yzs = [];
				}
				_status.SixSouls_yzs.push("SixSouls_yzs_perseverance");
			});

			await player.removeSkill("SixSouls_yzs_perseverance_test_record")
			const index = Math.floor(Math.random() * 4) + 1;
			const bgm = "SSF_Nightmare_yzs" + index;
			const finale = _status.SixSouls_yzs?.length > 5 ? true : false;
			game.broadcastAll((bgm, current, finale) => {
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
				if (finale) return;
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
				var duration = 1200;

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

				img.style.zIndex = "0";
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡

				document.body.appendChild(img);

				// 确保图片在视口最前方
				img.style.transition = "opacity 1s ease-out";

				setTimeout(function () {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
					img.style.opacity = 0;
					setTimeout(function () {
						if (img.parentNode) {
							img.parentNode.removeChild(img);
						}
					}, 1000);
					ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
					_status.tempMusic = `ext:一中杀/audio/` + bgm + `.mp3`;
					game.playBackgroundMusic();
				}, duration);
			}, bgm, player, finale);
			await new Promise(r => setTimeout(r, 1200))
		}
	},
	SixSouls_yzs_kindness_test: {
		persevereSkill: true,
		subSkill: {
			record: {
				popup: false,
				forced: true,
				persevereSkill: true,
				sub: true,
				sourceSkill: "SixSouls_yzs_kindness_test",
				mark: true,
				markimage: "extension/一中杀/image/SixSouls_yzs_kindness_test.png",
				intro: {
					content: "若放弃使用【杀】，则可拯救“仁慈”",
				},
			}
		},
		direct: true,
		async content(event, trigger, player) {
			game.broadcastAll((current) => {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_kindness_test.png");
				_status.tempMusic = `ext:一中杀/audio/skill/SixSouls_yzs_kindness_test.mp3`;
				game.playBackgroundMusic();
			}, player);
			await player.addSkill("SixSouls_yzs_kindness_test_record");
			player.markSkill("SixSouls_yzs_kindness_test_record")
			const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
			for (let target of players) {
				const result = await target
					.chooseToUse(
						"仁慈：使用一张【杀】或失去2点体力(请“仁慈”！)",
						function (card) {
							if (get.name(card) != "sha") {
								return false;
							}
							return lib.filter.filterCard.apply(this, arguments);
						},
						function (card, player, target) {
							if (player == target) {
								return false;
							}
							return lib.filter.filterTarget.apply(this, arguments);
						}
					)
					.set("ai1", () => {
						const player = get.player();
						if (player.hp >= 2) return 0;
					})
					.set("ai2", function () {
						return get.effect_use.apply(this, arguments) - get.event("effect");
					})
					.set("effect", get.effect(target, { name: "losehp" }, target, target))
					.set("addCount", false)
					.forResult();
				if (!result?.bool) {
					await target.loseHp(2);
					target.addSkill("SixSouls_yzs_kindness")
					await target.recover();
					await target.draw()
				}
			}

			player.addMark("SixSouls_yzs_kindness",1, false);
			game.broadcastAll(() => {
				if (!_status.SixSouls_yzs) {
					_status.SixSouls_yzs = [];
				}
				_status.SixSouls_yzs.push("SixSouls_yzs_kindness");
			});

			await player.removeSkill("SixSouls_yzs_kindness_test_record")
			const index = Math.floor(Math.random() * 4) + 1;
			const bgm = "SSF_Nightmare_yzs" + index;
			const finale = _status.SixSouls_yzs?.length > 5 ? true : false;
			game.broadcastAll((bgm, current, finale) => {
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
				if (finale) return;
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
				var duration = 1200;

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

				img.style.zIndex = "0";
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡

				document.body.appendChild(img);

				// 确保图片在视口最前方
				img.style.transition = "opacity 1s ease-out";

				setTimeout(function () {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
					img.style.opacity = 0;
					setTimeout(function () {
						if (img.parentNode) {
							img.parentNode.removeChild(img);
						}
					}, 1000);
					ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
					_status.tempMusic = `ext:一中杀/audio/` + bgm + `.mp3`;
					game.playBackgroundMusic();
				}, duration);
			}, bgm, player, finale);
			await new Promise(r => setTimeout(r, 1200))
		}
	},
	SixSouls_yzs_justice_test: {
		persevereSkill: true,
		subSkill: {
			record: {
				popup: false,
				forced: true,
				persevereSkill: true,
				sub: true,
				sourceSkill: "SixSouls_yzs_justice_test",
				mark: true,
				markimage: "extension/一中杀/image/SixSouls_yzs_justice_test.png",
				intro: {
					content: "若对“六魂花”造成了伤害，则可拯救“正义”",
				},
				trigger: {
					player: "damageEnd"
				},
				filter(event, player) {
					return event.source && event.source != player;
				},
				async content(event, trigger, player) {
					trigger.source.addMark("SixSouls_yzs_justice_test",1,false)
				}
			}
		},
		direct: true,
		async content(event, trigger, player) {
			game.broadcastAll((current) => {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SixSouls_yzs_justice_test.png");
				_status.tempMusic = `ext:一中杀/audio/skill/SixSouls_yzs_justice_test.mp3`;
				game.playBackgroundMusic();
			}, player);
			await player.addSkill("SixSouls_yzs_justice_test_record");
			player.markSkill("SixSouls_yzs_justice_test_record")
			const players = game.filterPlayer(current => !current.hasSkill("SSF_Nightmare_yzs"));
			for (let target of players) {
				await target
					.chooseToUse(
						"正义：对“六魂花”使用一张牌(请“正义”！)",
						function (card) {
							return lib.filter.filterCard.apply(this, arguments);
						},
						function (card, player, target) {
							if (!target.hasSkill("SSF_Nightmare_yzs")) return false;
							return lib.filter.filterTarget.apply(this, arguments);
						}
					)
					.set("ai2", function () {
						return get.effect_use.apply(this, arguments) - get.event("effect");
					})
					.set("effect", get.effect(target, { name: "losehp" }, target, target))
					.set("addCount", false)
				if (target.countMark("SixSouls_yzs_justice_test")) {
					target.clearMark("SixSouls_yzs_justice_test",false)
					target.addSkill("SixSouls_yzs_justice");
					await target.recover();
					await target.draw();
				}
			}

			player.addMark("SixSouls_yzs_justice",1, false);
			game.broadcastAll(() => {
				if (!_status.SixSouls_yzs) {
					_status.SixSouls_yzs = [];
				}
				_status.SixSouls_yzs.push("SixSouls_yzs_justice");
			});

			await player.removeSkill("SixSouls_yzs_justice_test_record")
			const index = Math.floor(Math.random() * 4) + 1;
			const bgm = "SSF_Nightmare_yzs" + index;
			const finale = _status.SixSouls_yzs?.length > 5 ? true : false;
			game.broadcastAll((bgm, current, finale) => {
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/SSF_Nightmare_yzs_phase.MP3");
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs_phase.gif");
				if (finale) return;
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/SSF_Nightmare_yzs_phase.png";
				var duration = 1200;

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

				img.style.zIndex = "0";
				img.style.opacity = 1;
				img.style.pointerEvents = "none"; // 防止点击事件被阻挡

				document.body.appendChild(img);

				// 确保图片在视口最前方
				img.style.transition = "opacity 1s ease-out";

				setTimeout(function () {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/SSF_Nightmare_yzs.gif");
					img.style.opacity = 0;
					setTimeout(function () {
						if (img.parentNode) {
							img.parentNode.removeChild(img);
						}
					}, 1000);
					ui.background.setBackgroundImage('extension/一中杀/image/background/SSF_Nightmare_yzs.jpg');
					_status.tempMusic = `ext:一中杀/audio/` + bgm + `.mp3`;
					game.playBackgroundMusic();
				}, duration);
			}, bgm, player, finale);
			await new Promise(r => setTimeout(r, 1200))
		}
	},
	Run_yzs: {
		group: ["Run_yzs_mark"],
		subSkill: {
			mark: {
				locked: true,
				popup: false,
				forced: true,
				trigger: {
					player: "recoverBegin"
				},
				async content(event, trigger, player) {
					player.addMark("Run_yzs", 1, false);
					const num = player.countMark("Run_yzs");
					if (num == 1) {
						player.chat("...");
						await new Promise(r => setTimeout(r, 500))
						player.chat("你在干什么？");
						await new Promise(r => setTimeout(r, 500))
						player.chat("你真以为我会从中感悟到哪怕一丝一毫？");
						await new Promise(r => setTimeout(r, 100))
						player.chat("不。");
					} else if (num == 2) {
						player.chat("饶恕我可不会发生任何改变");
						await new Promise(r => setTimeout(r, 1000))
						player.chat("杀了我才是了结这一切的唯一手段");
					} else if (num == 3) {
						player.chat("如果你让我活下去...");
						await new Promise(r => setTimeout(r, 1000))
						player.chat("我会回来的");
					} else if (num == 4) {
						player.chat("我会把你杀掉");
					} else if (num == 5) {
						player.chat("我会把所有人都杀掉");
					} else if (num == 6) {
						player.chat("我会把所有你爱着的人都杀掉");
					} else if (num == 7) {
						player.chat("...");
					} else if (num == 8) {
						player.chat("..?");
					} else if (num == 9) {
						player.chat("..为什么?");
					} else if (num == 10) {
						player.chat("..你为什么...");
					} else if (num == 11) {
						player.chat("..要对我这么好?");
					} else if (num == 12) {
						player.chat("我不明白");
					} else if (num == 13) {
						player.chat("我不明白！");
					} else if (num == 14) {
						player.chat("我就是不明白...");
						await player.useSkill("Run_yzs");
					}
				},
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		enable: "phaseUse",
		async content(event, trigger, player) {
			player.$fullscreenpop("*小花逃跑了")
			await player.die();
		},
		ai: {
			order: 114,
			result: {
				player:2
			}
		}
	},
	//鹤元海
	qigong_yzs: {
		group: ["qigong_yzs_gain"],
		marktext: "气",
		intro: {
			content: "mark",
			name: "气",
		},
		subSkill: {
			backup: {
				"skill_id": "qigong_yzs_backup",
				sub: true,
				sourceSkill: "qigong_yzs",
				"_priority": 0,
			},
			gain: {
				sub: true,
				sourceSkill: "qigong_yzs",
				direct: true,
				popup: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return get.color(event.card) == "red" && player.countMark("qigong_yzs") < 3;
				},
				async content(event, trigger, player) {
					player.addMark("qigong_yzs");
				}
			}
		},
		enable: "phaseUse",
		filter(event, player) {
			return player.countMark("qigong_yzs") > 0;
		},
		chooseButton: {
			dialog(event,player) {
				let dialog = ui.create.dialog("气功：请选择一项", "hidden");
				for (let i = 1; i <= 2; i++) {
					dialog.add([
						[[i, "移去" + i + "个“气”标记，摸" + i + "张牌"]],
						"textbutton",
					]);
				}
				dialog.add([
					[[3, "移去3个“气”标记，摸3张牌，然后可以将1张手牌当做【酒】使用"]],
					"textbutton",
				]);
				return dialog;
			},
			filter(button, player) {
				return player.countMark("qigong_yzs") >= button.link;
			},
			check(button) {
				if (button.link == "3") return 2;
				return 0
			},
			backup(links, player) {
				const effect = links[0];
				return {
					effect: effect,
					filterCard: () => false,
					selectCard: -1,
					async content(event, trigger, player) {
						const effect = lib.skill.qigong_yzs_backup.effect;
						player.removeMark("qigong_yzs", effect);
						await player.draw(effect);
						if (effect > 2 && player.canUse({ name: "jiu" }, player)) {
							let result = await player.chooseCard('h', "气功", '你可以将1张手牌当做【酒】使用', function (card, player) {
								return player.canUse(get.autoViewAs({
									name: 'jiu'
								}, [card]), _status.event.targetx, false);
							})
								.set("ai", card => {
									if (get.color(card) == "red") return 8 - get.value(card);
									return 6-get.value(card)
								})
								.set("targetx", player)
								.forResult();
							if (result.bool) {
								await player.useCard(get.autoViewAs({
									name: 'jiu'
								}, result.cards), result.cards, false, player);
							}
						}
					},
				};
			},
			prompt(links, player) {
				const effect = links[0],
					str = "###气功###";
				return str + '<div class="text center">' + "移去" + effect + "个“气”标记，摸" + effect + "张牌" + effect > 2 ? "，然后可以将1张手牌当做【酒】使用" : "" + "</div>";
			},
		},
		ai: {
			order(item, player) {
				if (player.countMark("qigong_yzs")<3) return 0;
				if (!player.countCards("h", { color: "red" })) return 0;
				return 6;
			},
			result: {
				player:2,
			},
			damageBonus:true,
		}
	},
	taiji_yzs: {
		locked: true,
		audio: "bagua_skill",
		priority: -30,
		logTarget: "player",
		trigger: {
			global: ["chooseToRespondBegin", "chooseToUseBegin"],
		},
		filter(event, player) {
			if (!player.countMark("qigong_yzs")) return false;
			if (event.responded) {
				return false;
			}
			if (!event.filterCard || !event.filterCard({ name: "shan" }, player, event)) {
				return false;
			}
			if (event.name === "chooseToRespond" && !lib.filter.cardRespondable({ name: "shan" }, player, event)) {
				return false;
			}
			return true;
		},
		check(event, player) {
			return get.attitude(player, event.player) > 1;
		},
		async content(event, trigger, player) {
			player.removeMark("qigong_yzs");
			player.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
			let result = await trigger.player.judge().forResult();
			if (result.color == "red") {
				trigger.untrigger();
				trigger.set("responded", true);
				trigger.result = { bool: true, card: { name: "shan", isCard: true } };
				return;
			}
			while (player.countMark("qigong_yzs") > 0) {
				let result2 = await player.chooseBool("是否再次对" + get.translation(trigger.player) + "发动【八卦】？")
					.set("ai", () => {
						return _status.event.bool;
					})
					.set(
						"bool",
						(function () {
							const player = get.event().player;
							const target = get.event().target
							return get.attitude(player, target) >1;
						})()
					)
					.set("target", trigger.player)
					.forResult();
				if (!result2.bool) return;
				player.removeMark("qigong_yzs");
				player.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
				game.trySkillAudio("bagua_skill");
				result = await trigger.player.judge().forResult();
				if (result.color == "red") {
					trigger.untrigger();
					trigger.set("responded", true);
					trigger.result = { bool: true, card: { name: "shan", isCard: true } };
					return;
				}
			}
		},
	},
	chongxu_yzs: {
		group: ["chongxu_yzs_count1", "chongxu_yzs_count2"],
		subSkill: {
			count1: {
				sub: true,
				sourceSkill: "chongxu_yzs",
				direct: true,
				popup: true,
				priority: 8,
				popup: false,
				trigger: {
					player: "useCard0",
				},
				filter: function (event, player) {
					return event.card.name == "sha"
				},
				async content(event, trigger, player) {
					await player.addSkill("chongxu_yzs_record")
					player.markAuto("chongxu_yzs_record", [trigger])
				}
			},
			count2: {
				sub: true,
				sourceSkill: "chongxu_yzs",
				direct: true,
				popup: true,
				priority: 8,
				trigger: {
					player: "useCardAfter",
				},
				filter: function (event, player) {
					return event.card.name == "sha" && player.hasSkill("chongxu_yzs_record");
				},
				async content(event, trigger, player) {
					await player.removeSkill("chongxu_yzs_record");
					if (trigger.addCount === false) return;
					trigger.addCount = false;
					const stat = player.getStat().card,
						name = trigger.card.name;
					if (typeof stat["sha"] == "number") stat["sha"]--;
				}
			},
			record: {
				sub: true,
				sourceSkill: "chongxu_yzs",
				onremove: true,
				charlotte: true,
				forced: true,
				priority: 3123,
				popup: false,
				trigger: {
					global: ["useCard", "respond"]
				},
				filter(event, player) {
					return event.cards?.length > 0 && !player.getStorage("chongxu_yzs_record").includes(event);
				},
				async content(event, trigger, player) {
					await player.removeSkill("chongxu_yzs_record");
				}
			},
			miss: {
				sub: true,
				sourceSkill: "chongxu_yzs",
				onremove: true,
				charlotte: true,
				direct: true,
				popup: true,
				priority: 3123,
				popup: false,
				trigger: {
					global: ["shaMiss"]
				},
				filter(event, player) {
					return player.getStorage("chongxu_yzs_miss").includes(event.getParent());
				},
				async content(event, trigger, player) {
					await player.removeSkill("chongxu_yzs_miss");
					if (trigger.getParent().chongxu_yzs_player) await trigger.getParent().chongxu_yzs_player.draw();
					if (trigger.getParent().chongxu_yzs_target) await trigger.getParent().chongxu_yzs_target.damage(trigger.baseDamage + trigger.extraDamage, trigger.getParent().chongxu_yzs_player, get.nature(trigger.card))
				}
			}
		},
		prompt2: "你指定或成为【杀】的唯一目标时，可交换使用者和目标，然后若此【杀】被响应，原使用者摸1张牌且此【杀】仍对原目标造成伤害",
		logTarget: "player",
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (event.getParent().chongxu_yzs) return false;
			if (event.card.name != "sha") return false;
			if (event.targets?.length != 1) return false;
			return true;
		},
		check(event, player) {
			if (event.player == player) {
				if (player.countCards("h", { name: "shan" }) && event.target.countCards("h") > 1) return true;
				return false;
			} else {
				if (event.player.countCards("h") > 5 && player.countCards("h", {name:"shan"})) return false;
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			trigger.getParent().chongxu_yzs = true;
			trigger.getParent().chongxu_yzs_player = trigger.player;
			trigger.getParent().chongxu_yzs_target = trigger.targets[0];
			player.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
			await player.addSkill("chongxu_yzs_miss");
			player.markAuto("chongxu_yzs_miss", [trigger.getParent()])
			const target = trigger.targets[0];
			trigger.targets[0] = trigger.player;
			trigger.player = target;
		}
	},
	//二次元之王
	ErWangSaid_yzs: {
		nobracket: true,
		group: ["ErWangSaid_yzs_start", "ErWangSaid_yzs_global", "ErWangSaid_yzs_damage1", "ErWangSaid_yzs_damage2", "ErWangSaid_yzs_lose"],
		async changeCiYuan(player, event) {
			if (player.countMark("ErWangSaid_yzs")) {
				player.clearMark("ErWangSaid_yzs", false);
				player.removeTip("ErWangSaid_yzs");
			}
			else {
				player.addMark("ErWangSaid_yzs", 1, false);
				player.addTip("ErWangSaid_yzs", "“里”次元 ", false);
			}
			if (!player.hasSkill("ErWangSaid_yzs")) return;
			if (_status.currentPhase != player) return;
			if (!player.countCards("h")) return;
			let str = "是否弃置所有手牌？"
			str += "<br>(此时为你的回合内，失去最后的手牌时摸3张牌)"
			let result = await player.chooseBool(str)
				.forResult();
			if (!result.bool) return;
			let cards = player.getCards("h");
			await player.discard(cards);
		},
		subSkill: {
			backup: {
				"skill_id": "ErWangSaid_yzs_backup",
				sub: true,
				sourceSkill: "ErWangSaid_yzs",
				"_priority": 0,
			},
			start: {
				sub: true,
				sourceSkill: "ErWangSaid_yzs",
				locked: true,
				unique: true,
				forced: true,
				priority: 1121,
				unique: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					let players = [player];
					let result = await player.chooseTarget(false)
						.set("filterTarget", (card, player, target) => {
							return player != target;
						})
						.set("selectTarget", [1, 2])
						.set("prompt", "二王如是说")
						.set("prompt2", `游戏开始时你令你和至多2名其他角色进入“里”${get.poptip("ErWangCiYuan_yzs")}，其余角色进入“外”次元状态。`)
						.forResult()
					if (result.bool) {
						players.addArray(result.targets);
					}
					for (let target of players) {
						target.addMark("ErWangSaid_yzs", 1, false);
						target.addTip("ErWangSaid_yzs", "“里”次元 ", false);
					}
				},
			},
			global: {
				sub: true,
				sourceSkill: "ErWangSaid_yzs",
				locked: true,
				forced: true,
				popup: false,
				priority: 3,
				trigger: {
					global: "damageBegin2"
				},
				filter(event, player) {
					if (event.ErWangSaid_yzs) return false;
					if (!event.source) return false;
					if (!event.player.countMark("ErWangSaid_yzs") && !event.source.countMark("ErWangSaid_yzs")) return false;
					if (event.player.countMark("ErWangSaid_yzs") && event.source.countMark("ErWangSaid_yzs")) return false;
					return true;
				},
				async content(event, trigger, player) {
					trigger.ErWangSaid_yzs = true;
					trigger.cancel();
					if (player.hasSkill("ErWangLock_yzs_effect")) return;
					await lib.skill.ErWangSaid_yzs.changeCiYuan(trigger.player, event);
				}
			},
			damage1: {
				sub: true,
				sourceSkill: "ErWangSaid_yzs",
				priority: 2,
				locked: true,
				popup: false,
				forced: true,
				trigger: {
					source: "damageBegin1"
				},
				filter(event, player) {
					if (player.hasSkill("ErWangLock_yzs_effect")) return false;
					if (event.ErWangSaid_yzs) return false;
					if (event.player == player) return false;
					if (player.countMark("ErWangSaid_yzs")) return event.player.countMark("ErWangSaid_yzs");
					if (!player.countMark("ErWangSaid_yzs")) return !event.player.countMark("ErWangSaid_yzs");
					return false;
				},
				async content(event, trigger, player) {
					trigger.ErWangSaid_yzs = true;
					await lib.skill.ErWangSaid_yzs.changeCiYuan(trigger.player, event);
				}
			},
			damage2: {
				sub: true,
				sourceSkill: "ErWangSaid_yzs",
				priority: 2,
				popup: false,
				locked: true,
				forced: true,
				trigger: {
					player: "damageBegin3"
				},
				filter(event, player) {
					if (player.hasSkill("ErWangLock_yzs_effect")) return false;
					if (event.ErWangSaid_yzs) return false;
					return true;
				},
				async content(event, trigger, player) {
					trigger.ErWangSaid_yzs = true;
					await lib.skill.ErWangSaid_yzs.changeCiYuan(player, event);
				}
			},
			lose: {
				sub: true,
				sourceSkill: "ErWangSaid_yzs",
				forced: true,
				priority: 1,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				frequent: true,
				filter(event, player) {
					if (_status.currentPhase != player) return false;
					if (player.countCards("h")) {
						return false;
					}
					const evt = event.getl(player);
					return evt && evt.player == player && evt.hs && evt.hs.length > 0;
				},
				async content(event, trigger, player) {
					await player.draw(3);
				},
			},
		},
		locked: true,
		mod: {
			playerEnabled(card, player, target) {
				if (card.storage?.ErWangSaid_yzs) return target == player;
				return;
			},
		},
		enable: "phaseUse",
		filter(event, player) {
			if (player.countCards('he', { color: "red" }) < 2) return false;
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				var info = lib.card[name];
				if (get.type(name) != "trick") continue;
				if (name == "mengliaoshibian_yzs") continue;
				if (!player.canUse({ name: name }, player)) continue;
				if (info.toself) {
					return true;
					continue;
				}
				if (info.selectTarget == -1) continue;
				return true;
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					var info = lib.card[name];
					if (get.type(name) != "trick") continue;
					if (name == "mengliaoshibian_yzs") continue;
					if (!player.canUse({ name: name }, player)) continue;
					if (info.toself) {
						list.push(["锦囊", "", name]);
						continue;
					}
					if (info.selectTarget == -1) continue;
					list.push(["锦囊", "", name]);
				}
				return ui.create.dialog("二王如是说", [list, "vcard"]);
			},
			filter(button, player) {
				return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
			},
			check(button) {
				var player = _status.event.player;
				var card = { name: button.link[2], nature: button.link[3] };
				if (player.countCards("h", cardx => cardx.name == card.name)) {
					return 0;
				}
				return player.getUseValue(card)
			},
			backup(links, player) {
				return {
					filterCard: {
						color: "red",
					},
					selectCard: 2,
					popname: true,
					check(card) {
						return 6 - get.value(card);
					},
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
						isCard: true,
						check(card) {
							return 6 - get.value(card);
						},
						storage: {
							ErWangSaid_yzs: true,
						}
					},
					position: "he",
					async precontent(event, trigger, player) {
						player.logSkill("ErWangSaid_yzs");
						var cards = event.result.cards;
						await player.discard(cards);
						event.result.card = {
							name: event.result.card.name,
							nature: event.result.card.nature,
							isCard: true,
						};
						event.result.cards = [];
					},
				};
			},
			prompt(links, player) {
				return "请弃置2张牌，然后视为对自己使用" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]);
			},
		},
		ai: {
			order: 4,
			result: {
				player:2
			},
			threaten: 1.9,
		},
	},
	ErWangPlay_yzs: {
		nobracket: true,
		locked: true,
		mark: "auto",
		markimage: "extension/一中杀/image/ErWangPlay_yzs.png",
		intro: {
			markcount: "expansion",
			name: "二王乾坤戏",
			mark(dialog, content, player) {
				if (!player.countMark("ErWangSaid_yzs")) {
					dialog.addText("你造成伤害-1<br>你可将2张黑色牌当做【决斗】使用");
				} else {
					dialog.addText("你回合结束时对所有其他角色造成1点伤害<br>每名角色回合结束时你可弃1张黑色牌然后对其造成1点伤害");
				}
			},
		},
		group: ["ErWangPlay_yzs_outside", "ErWangPlay_yzs_inside"],
		subSkill: {
			outside: {
				sub: true,
				sourceSkill: "ErWangPlay_yzs",
				locked: true,
				forced: true,
				trigger: { source: "damageBegin1" },
				filter(event, player) {
					return !player.countMark("ErWangSaid_yzs")
				},
				async content(event, trigger, player) {
					trigger.num--;
				}
			},
			inside: {
				sub: true,
				sourceSkill: "ErWangPlay_yzs",
				locked: true,
				trigger: { global: "phaseEnd" },
				filter(event, player) {
					if (player.hasSkill("ErWangLock_yzs_effect")) return false;
					if (!player.countMark("ErWangSaid_yzs")) return false;
					if (event.player == player) return true;
					return player.countCards('he', { color: "black" });
				},
				async cost(event, trigger, player) {
					if (trigger.player == player) {
						event.result = {
							bool: true,
						};
						return;
					}
					const card = await player.chooseCard("你可弃置1张黑色牌，然后对" + get.translation(trigger.player) + "造成1点伤害")
						.set("position", "he")
						.set("target", trigger.player)
						.set("ai", card => {
							const player = get.event().player;
							const target = get.event().target;
							return get.damageEffect(target, player, player) - get.value(card,player);
						})
						.set("filterCard", (card) => get.color(card) == "black")
						.forResult();
					event.result = {
						bool: card.bool,
						cost_data: card.cards,
					};
				},
				async content(event, trigger, player) {
					if (player == trigger.player) {
						const players = game.filterPlayer(current => current != player);
						for (let target of players) {
							await target.damage(player);
						}
					} else {
						if (event.cost_data?.length) {
							await player.discard(event.cost_data);
							await trigger.player.damage(player);
						}
					}
				}
			},
		},
		prompt:`你可将2张黑色牌当做【决斗】使用`,
		enable: "phaseUse",
		filter(event, player) {
			if (player.countCards('he', { color: "black" }) < 2) return false;
			return !player.countMark("ErWangSaid_yzs")
		},
		position: "he",
		viewAs: {
			name: "juedou",
		},
		filterCard: {
			color: "black",
		},
		selectCard: 2,
		check(card) {
			return 6 - get.value(card);
		},
		mod: {
			aiValue(player, card, num) {
				if (get.tag(card, "damage")) return num - 6;
			},
		},
		ai: {
			wuxie(target, card, player, viewer, status) {
				if (player === game.me && get.attitude(viewer, player._trueMe || player) > 0) {
					return 0;
				}
				if (status * get.attitude(viewer, target) * get.effect(target, card, player, target) >= 0) {
					return 0;
				}
			},
			basic: {
				order: 5,
				useful: 1,
				value: 5.5,
			},
			result: {
				player(player, target, card) {
					if (
						player.hasSkillTag(
							"directHit_ai",
							true,
							{
								target: target,
								card: card,
							},
							true
						)
					) {
						return 0;
					}
					if (get.damageEffect(target, player, target) >= 0) {
						return 0;
					}
					let pd = get.damageEffect(player, target, player),
						att = get.attitude(player, target);
					if (att > 0 && get.damageEffect(target, player, player) > pd) {
						return 0;
					}
					let ts = target.mayHaveSha(player, "respond", null, "count"),
						ps = player.mayHaveSha(
							player,
							"respond",
							player.getCards("h", i => {
								return card === i || (card.cards && card.cards.includes(i)) || ui.selected.cards.includes(i);
							}),
							"count"
						);
					if (ts < 1 && ts * 8 < Math.pow(player.hp, 2)) {
						return 0;
					}
					if (att > 0) {
						if (ts < 1) {
							return 0;
						}
						return -2;
					}
					if (pd >= 0) {
						return pd / get.attitude(player, player);
					}
					if (ts - ps + Math.exp(0.8 - player.hp) < 1) {
						return -ts;
					}
					return -2 - ts;
				},
				target(player, target, card) {
					if (
						player.hasSkillTag(
							"directHit_ai",
							true,
							{
								target: target,
								card: card,
							},
							true
						)
					) {
						return -2;
					}
					let td = get.damageEffect(target, player, target);
					if (td >= 0) {
						return td / get.attitude(target, target);
					}
					let pd = get.damageEffect(player, target, player),
						att = get.attitude(player, target);
					if (att > 0 && get.damageEffect(target, player, player) > pd) {
						return -2;
					}
					let ts = target.mayHaveSha(player, "respond", null, "count"),
						ps = player.mayHaveSha(
							player,
							"respond",
							player.getCards("h", i => {
								return card === i || (card.cards && card.cards.includes(i)) || ui.selected.cards.includes(i);
							}),
							"count"
						);
					if (ts < 1) {
						return -1.5;
					}
					if (att > 0) {
						return -2;
					}
					if (pd >= 0) {
						return -1;
					}
					if (ts - ps < 1) {
						return -2 - ts;
					}
					return -ts;
				},
			},
			tag: {
				respond: 2,
				respondSha: 2,
				damage: 1,
			},
		},
	},
	ErWangLock_yzs: {
		nobracket: true,
		animationColor: "thunder",
		limited: true,
		priority: 11,
		subSkill: {
			effect: {
				onremove: "storage",
				sub: true,
				sourceSkill: "ErWangLock_yzs",
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == "sha") return num + player.countMark("ErWangLock_yzs_effect");
					},
				},
			},
			renew: {
				sub: true,
				sourceSkill: "ErWangLock_yzs",
				direct: true,
				forced: true,
				popup: false,
				firstDo: true,
				trigger: {
					source: "die",
				},
				filter(event, player) {
					if (event.player.storage.isSub) return false;
					if (event.player == player) return false;
					return player.awakenedSkills.includes("ErWangLock_yzs")
				},
				async content(event, trigger, player) {
					player.restoreSkill("ErWangLock_yzs");
				}
			}
		},
		trigger: {
			player: "phaseBegin",
		},
		check(event, player) {
			if (!game.hasPlayer(cur => get.attitude(cur,player)<0 && cur.countMark("ErWangSaid_yzs") != player.countMark("ErWangSaid_yzs"))  && player.hp <= 2) return true;
			const num = 3 - game.filterPlayer(current => current != player && current.countMark("ErWangSaid_yzs")).length;
			if (num <= 1) return false;
			if (game.hasPlayer(cur => get.attitude(player, cur) < -1) && player.countCards("h", { name: "sha" }) >= 2) return true;
			return false;
		},
		async content(event, trigger, player) {
			player.awakenSkill("ErWangLock_yzs");
			await player.addTempSkill("ErWangLock_yzs_effect", { player: "phaseBefore" })
			const num = 3 - game.filterPlayer(current => current != player && current.countMark("ErWangSaid_yzs")).length;
			if (num > 0) {
				player.setMark("ErWangLock_yzs_effect", num, false)
			}
		},
	},
	//稗田阿求
	qiuwen_yzs: {
		group: ["qiuwen_yzs_onuse"],
		locked: true,
		subSkill: {
			backup: {
				"skill_id": "qiuwen_yzs_backup",
				sub: true,
				sourceSkill: "qiuwen_yzs",
				"_priority": 0,
			},
			used: {
				charlotte: true,
				onremove: "storage",
				sub: true,
				sourceSkill: "qiuwen_yzs",
				"_priority": 0,
			},
			onuse: {
				trigger: {
					player: ["useCard", "respond"],
				},
				charlotte: true,
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					if (event.card?.storage.qiuwen_yzs) return true;
					return false
				},
				async content(event, trigger, player) {
					let result2 = await player.chooseBool("是否令【求闻】失效，然后摸3张牌并弃半数取下张手牌？")
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								const player = get.event().player;
								if (_status.currentPhase == player) {
									var list = player.getStorage("qiuwen_yzs").filter(i => player.hasUseTarget({name:i}));
									list.removeArray(player.getStorage("qiuwen_yzs_used"));
									return list.length
								} else return true;
							})()
						)
						.forResult();
					if (result2.bool) {
						player.tempBanSkill("qiuwen_yzs");
						await player.draw(3);
						const num = Math.floor(player.countCards("h") / 2);
						if (num > 0) {
							let result = await player.chooseToDiscard("h", true, num)
								.set("ai", card => {
									const player = get.player();
									if (player.getStorage("qiuwen_yzs").some(i => i.name == card.name)) return 6 - get.value(card);
									return 12-get.value(card)
								})
								.forResult();
							if (player.hasSkill("zhuanshi_yzs")) {
								for (let i of result.cards) {
									player.addMark("zhuanshi_yzs", i.number, false);
									if (get.type(i) == "equip" || get.type(i) == "delay") continue;
									player.markAuto("qiuwen_yzs", [i.name])
								}
							}
						}
					};
				},
				sub: true,
				"_priority": 0,
				"skill_id": "qiuwen_yzs_onuse",
				sourceSkill: "qiuwen_yzs",
			}
		},
		init: function (player, skill) {
			player.markAuto("qiuwen_yzs", ["shan", "wuzhong"])
		},
		hiddenCard(player, name) {
			var list = player.getStorage("qiuwen_yzs").slice(0);
			list.removeArray(player.getStorage("qiuwen_yzs_used"));
			return list.includes(name) && player.countCards("h");
		},
		enable: ["chooseToUse", "chooseToRespond"],
		locked: false,
		filter(event, player) {
			if (event.responded || event.qiuwen_yzs) return false;
			var list = player.getStorage("qiuwen_yzs").slice(0);
			list.removeArray(player.getStorage("qiuwen_yzs_used"));
			if (!list.length) {
				return false;
			}
			if (!player.countCards("h")) {
				return false;
			}
			for (var i of list) {
				if (event.filterCard(get.autoViewAs({ name: i, storage: { qiuwen_yzs: true } }, "unsure"), player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = player.getStorage("qiuwen_yzs").slice(0);
				list.removeArray(player.getStorage("qiuwen_yzs_used"));
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					if (event.filterCard(get.autoViewAs({ name: i, storage: { qiuwen_yzs: true } }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("求闻", [list2, "vcard"]);
			},
			check(button) {
				if (_status.event.getParent().type != "phase") {
					return 1;
				}
				return _status.event.player.getUseValue({ name: button.link[2] }, null, true);
			},
			backup(links, player) {
				return {
					filterCard() {
						return true;
					},
					selectCard: 1,
					position: "h",
					popname: true,
					viewAs: {
						name: links[0][2],
						storage: {
							qiuwen_yzs: true,
						}
					},
					async precontent(event, trigger, player) {
						player.logSkill("qiuwen_yzs");
						player.addTempSkill("qiuwen_yzs_used");
						player.markAuto("qiuwen_yzs_used", [event.result.card.name]);
					},
				};
			},
			prompt(links, player) {
				return "将1张手牌当做【" + get.translation(links[0][2]) + "】使用或打出";
			},
		},
		ai: {
			save: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player, tag, arg) {
				if (!player.countCards("h") || player.isTempBanned("qiuwen_yzs")) {
					return false;
				}
				var list = player.getStorage("qiuwen_yzs").slice(0);
				list.removeArray(player.getStorage("qiuwen_yzs_used"));
				if (tag == "respondSha" || tag == "respondShan") {
					if (arg == "respond") {
						return false;
					}
					return list.includes(tag == "respondSha" ? "sha" : "shan");
				}
				return list.includes("tao") || (list.includes("jiu") && arg == player);
			},
			order: 4,
			result: {
				player(player) {
					return 1;
				},
			},
			threaten: 1.9,
		},
	},
	zhuanshi_yzs: {
		group: ["zhuanshi_yzs_revive", "zhuanshi_yzs_die"],
		subSkill: {
			die: {
				locked: true,
				forced: true,
				priority: 2,
				priority: -2341,
				trigger: {
					global: "phaseEnd",
				},
				filter(event, player) {
					return player.countMark("zhuanshi_yzs") >= 30;
				},
				async content(event, trigger, player) {
					await player.die(event);
					player.chat("卒，享年30岁");
				},
				sub: true,
				sourceSkill: "zhuanshi_yzs",
			},
			revive: {
				forceDie: true,
				locked: true,
				eternalSkill_yzs: true,
				charlotte: true,
				unique: true,
				forced: true,
				unique: true,
				priority: 132,
				sub: true,
				sourceSkill: "zhuanshi_yzs",
				skillAnimation: "legend",
				animationColor: "fire",
				LastDo: true,
				trigger: {
					global: "phaseBefore"
				},
				filter(event, player) {
					if (!game.dead.includes(player)) return false;
					return player.getNext() == event.player;
				},
				async content(event, trigger, player) {
					let hp = lib.character[player.name].hp
					if (!hp) hp = player.maxHp
					await player.reviveEvent(hp);
					let maxHp = lib.character[player.name].maxHp
					if (maxHp) {
						player.maxHp = maxHp;
						player.update()
					}
					player.clearMark("zhuanshi_yzs", false);
					player.directgain(get.cards(4));
					player.markSkill("zhuanshi_yzs")
					player.chat("孩子们，我回来了")
				}
			},
		},
		mark: true,
		marktext: "世",
		intro: {
			mark(dialog, content, player) {
				dialog.addText("请注意你的阳寿：");
				dialog.addText("这一世记录点数之和为" + player.countMark("zhuanshi_yzs") + "/30");
			},
		},
		forceDie: true,
		locked: true,
		eternalSkill_yzs: true,
		charlotte: true,
		superCharlotte: true,
		unique: true,
		forced: true,
		unique: true,
		trigger: {
			player: "dieBefore",
		},
		filter(event, player) {
			return player.countCards("h")
		},
		async content(event, trigger, player) {
			while (player.countCards("h")) {
				let result = await player.chooseCardTarget(false)
					.set("filterTarget", (card, player, target) => {
						return !target.hasSkill("hidden_yzs") && target != player
					})
					.set("prompt", "转世")
					.set("prompt2", "将你的手牌分配给其他角色")
					.set("filterCard", (card, player, target) => {
						return true
					})
					.set("ai2", target => {
						const player = get.player();
						return get.attitude(player, target);
					})
					.set("selectCard", [1, Infinity])
					.set("position", "h")
					.forResult()
				if (!result.bool) return
				player.chat("收下吧 " + get.translation(result.targets[0]) + "，这是我最后的波纹了！")
				await player.give(result.cards, result.targets[0]);
			}
		},
		ai: {
			threaten:1.2,
			expose:0.6,
		}
	},
	//APPLe
	putaojiu_yzs: {
		nobracket: true,
		group: ["putaojiu_yzs_recover"],
		subSkill: {
			recover: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				trigger: {
					player: ["useSkillAfter"],
				},
				filter(event, player) {
					if ((get.info(event.skill) || {}).charlotte) {
						return false;
					}
					const skill = get.sourceSkillFor(event);
					const info = get.info(skill);
					let num = 0;
					player.getHistory("sourceDamage", function (evt) {
						if (evt.getParent(2) == event) {
							num += evt.num;
						}
					});
					if (num < 1) return false;
					return player.hasSkill(skill) || player.hasSkill(info.sourceSkill);
				},
				async cost(event, trigger, player) {
					if (!game.hasPlayer(function (target) {
						return (!target.hasSkill("hidden_yzs"));
					})) return false;
					let num = 0;
					player.getHistory("sourceDamage", function (evt) {
						if (evt.getParent(2) == trigger) {
							num += evt.num;
						}
					});
					let result = await player.chooseTarget([1, num], true)
						.set("prompt", "葡萄酒")
						.set("prompt2", "选择分配1点体力恢复的角色(下一轮选择可以重复选择相同的角色)")
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return true;
						})
						.set("ai", target => {
							const player = get.player()
							return get.recoverEffect(target,player,player)
						})
						.forResult()
					if (!result.bool) return false;
					event.result = {
						bool: true,
						targets: result.targets,
						cost_data: num - result.targets.length,
					}
				},
				async content(event, trigger, player) {
					let num = event.cost_data;
					let recovertargets = event.targets;
					let recover = [];
					for (let target of recovertargets) {
						recover.push([target, 1]);
					}
					while (num > 0) {
						if (!game.hasPlayer(function (target) {
							return (!target.hasSkill("hidden_yzs"));
						})) break;
						let result = await player.chooseTarget([1, num], true)
							.set("prompt", "葡萄酒")
							.set("prompt2", "选择分配1点体力恢复的角色(下一轮选择可以重复选择相同的角色)")
							.set("filterTarget", (card, player, target) => {
								if (target.hasSkill("hidden_yzs")) return false;
								return true;
							})
							.set("ai", target => {
								const player = get.player()
								return get.recoverEffect(target, player, player)
							})
							.forResult()
						if (!result.bool) break
						num -= result.targets.length;
						for (let current of result.targets) {
							let include = false;
							for (let cur of recover) {
								if (cur[0] == current) {
									cur[1]++;
									include = true;
									break;
								}
							}
							if (!include) {
								recover.push([current, 1]);
								recovertargets.push(current);
							}
						}
					}
					recovertargets.sortBySeat();
					for (let current of recovertargets) {
						for (let cur of recover) {
							if (cur[0] == current) {
								await current.recover(cur[1]);
								break;
							}
						}
					}
				}
			}
		},
		forced: true,
		locked: true,
		sing: 1,
		"_priority": 2,
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name =="putaojiu_yzs"))player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						game.trySkillAudio("putaojiu_yzs");
						let players = game.filterPlayer();
						for (let cur of players) {
							if (cur.hp == 3) continue;
							if (cur.hp > 3) await cur.loseHp();
							if (cur.hp < 3) await cur.recover();
						}
					},
					list: [player],
				},
				value(item, player) {
					return 1;
				},
				name: "putaojiu_yzs",
				prompt: `场上角色依次向3调整1点体力`,
				skill: "putaojiu_yzs"
			});
		},
		audio: "ext:一中杀/audio/skill:2",
	},
	caisedebai_yzs: {
		nobracket: true,
		persevereSkill: true,
		subSkill: {
			1: {
				persevereSkill: true,
				audio: "ext:一中杀/audio/skill:2",
				async content(event, trigger, player) {
					await player.yzs_updateCountDown(player.yzs_getCountDown(i => i.name == "putaojiu_yzs"));
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 3-player.hp
						}
					}
				},
			},
			2: {
				audio: "caisedebai_yzs_1",
				persevereSkill: true,
				async content(event, trigger, player) {
					if (player.countMark("RE_AP") < get.character(player.name).RE_AP) player.addMark("RE_AP", Math.min(2, get.character(player.name).RE_AP - player.countMark("RE_AP")), false);
					let players = game.filterPlayer(cur => cur.hp < 3);
					for (let cur of players) {
						await cur.draw();
					}
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
			3: {
				audio: "caisedebai_yzs_1",
				persevereSkill: true,
				async content(event, trigger, player) {
					if (player.countMark("RE_AP") < get.character(player.name).RE_AP) player.addMark("RE_AP", Math.min(3, get.character(player.name).RE_AP - player.countMark("RE_AP")), false);
					let players = game.filterPlayer(cur => cur.hp > 2);
					for (let cur of players) {
						let result =
							cur.countCards("he") < 1
								? { bool: false }
								: await cur
									.chooseToDiscard(1, `弃1张牌或受到1点伤害`, "he")
									.set("ai", card => {
										if (card.name == "tao") {
											return -10;
										}
										if (card.name == "jiu" && get.player().hp == 1) {
											return -10;
										}
										return get.unuseful(card) + 2.5 * (5 - get.owner(card).hp);
									})
									.forResult();
						if (!result?.bool) {
							await cur.damage(player);
						}
					}
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
		}
	},
	dengliangdeguang_yzs: {
		nobracket: true,
		persevereSkill: true,
		subSkill: {
			1: {
				audio: "ext:一中杀/audio/skill:2",
				persevereSkill: true,
				filterX(player) {
					if (!game.hasPlayer(function (target) {
						return (!target.hasSkill("hidden_yzs")) && target.hp == 1;
					})) return false;
					return !player.hasSkill("dengliangdeguang_yzs_1_used");
				},
				async costX(player) {
					let result = await player.chooseTarget(1, false)
						.set("prompt", "等量的光")
						.set("prompt2", "选择1名体力值为1的角色，对其造成1点伤害")
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return target.hp == 1;
						})
						.set("ai", target => {
							const player = get.player();
							return get.damageEffect(target,player,player)
						})
						.forResult();
					return result;
				},
				filterTarget(card, player, target) {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.hp == 1;
				},
				async content(event, trigger, player) {
					await player.addTempSkill("dengliangdeguang_yzs_1_used", { player: "phaseUseAfter" });
					await event.targets[0].damage(player);
				},
				ai: {
					order:3,
					result: {
						target(player, target) {
							return get.damageEffect(target, player, target)
						}
					}
				}
			},
			2: {
				audio: "dengliangdeguang_yzs_1",
				persevereSkill: true,
				filterX(player) {
					if (!game.hasPlayer(function (target) {
						return (!target.hasSkill("hidden_yzs")) && target.hp == 2;
					})) return false;
					return !player.hasSkill("dengliangdeguang_yzs_2_used");
				},
				async costX(player) {
					let result = await player.chooseTarget(1, false)
						.set("prompt", "等量的光")
						.set("prompt2", "选择1名体力值为2的角色，对其造成1点伤害")
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return target.hp == 2;
						})
						.set("ai", target => {
							const player = get.player();
							return get.damageEffect(target, player, player)
						})
						.forResult();
					return result;
				},
				filterTarget(card, player, target) {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.hp == 2;
				},
				async content(event, trigger, player) {
					await player.addTempSkill("dengliangdeguang_yzs_2_used", { player: "phaseUseAfter" });
					await event.targets[0].damage(player);
				},
				ai: {
					order: 3,
					result: {
						target(player, target) {
							return get.damageEffect(target, player, target)
						}
					}
				}
			},
			3: {
				audio: "dengliangdeguang_yzs_1",
				persevereSkill: true,
				filterX(player) {
					if (!game.hasPlayer(function (target) {
						return (!target.hasSkill("hidden_yzs")) && target.hp == 3;
					})) return false;
					return !player.hasSkill("dengliangdeguang_yzs_3_used");
				},
				async costX(player) {
					let result = await player.chooseTarget(1, false)
						.set("prompt", "等量的光")
						.set("prompt2", "选择1名体力值为3的角色，对其造成1点伤害")
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return target.hp == 3;
						})
						.set("ai", target => {
							const player = get.player();
							return get.damageEffect(target, player, player)
						})
						.forResult();
					return result;
				},
				filterTarget(card, player, target) {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.hp == 3;
				},
				async content(event, trigger, player) {
					await player.addTempSkill("dengliangdeguang_yzs_3_used", { player: "phaseUseAfter" });
					await event.targets[0].damage(player);
				},
				ai: {
					order: 3,
					result: {
						target(player, target) {
							return get.damageEffect(target, player, target)
						}
					}
				}
			}
		}
	},
	weixiaochengjiu_yzs: {
		nobracket: true,
		locked: true,
		group: ["weixiaochengjiu_yzs_passion1","weixiaochengjiu_yzs_passion2"],
		subSkill: {
			passion1: {
				forced: true,
				locked: true,
				popup:false,
				priority:13,
				trigger: {
					global: "recoverBegin"
				},
				filter(event, player) {
					if (_status.currentPhase == event.player) return false;
					if (event.player.storage.isSub) return false;
					if (_status.dying.includes(event.player)) return false;
					return true;
				},
				async content(event, trigger, player) {
					trigger.weixiaochengjiu_yzs = true;
				}
			},
			passion2: {
				forced: true,
				priority:2,
				locked: true,
				trigger: {
					global: "recoverAfter"
				},
				filter(event, player) {
					return event.weixiaochengjiu_yzs;
				},
				async content(event, trigger, player) {
					await player.yzs_addPassion(1);
				}
			},
		},
		forced: true,
		skillAnimation: "legend",
		animationColor: "fire",
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "yzs_addPassionAfter"
		},
		filter(event, player) {
			return player.countMark("Passion_yzs") >= 6;
		},
		async content(event, trigger, player) {
			player.clearMark("Passion_yzs", false);
			let players = game.filterPlayer(cur => player.canCompare(cur) && cur != player && !cur.isSub);
			var result = await player.chooseToCompare(players).setContent("chooseToCompareMeanwhile").forResult();
			for (let cur of game.filterPlayer()) {
				await cur.draw();
			}
			if (result.winner && result.winner == player) {
				for (let cur of players.filter(i => i != player)) {
					await cur.damage(player);
				}
			}
		}
	},
	//精灵游侠
	youzou_yzs: {
		priority: 23,
		direct: true,
		popup: true,
		marktext: "力",
		intro: {
			content: "mark",
			name: "行动力",
		},
		trigger: {
			player: ["useCard", "respond"],
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			if (player.storage.youzou_yzs_suit && get.suit(trigger.card,player) == player.storage.youzou_yzs_suit) {
				if (player.countMark("youzou_yzs") < 2) player.addMark("youzou_yzs", 1, false);
				player.markSkill("youzou_yzs");
				game.log(player, "获得了1点“行动力”")
			}
			if (!player.storage.youzou_yzs_color || get.color(trigger.card,player) != player.storage.youzou_yzs_color) {
				await player.draw();
				if (player.countCards("h") > 0) {
					const result = await player.chooseCard("游走", "你将1张手牌置于牌堆顶", "h", 1, true)
						.set("ai",card=>6-get.value(card))
						.forResult();
					if (result.bool) {
						let card = result.cards
						await player.lose(card, ui.cardPile, "insert");
						game.log(player, "将1张手牌置于牌堆顶");
						game.updateRoundNumber();
					}
				}
			}
			player.storage.youzou_yzs_color = get.color(trigger.card,player);
			player.storage.youzou_yzs_suit = get.suit(trigger.card,player);
			player.markSkill("youzou_yzs_color")
			player.markSkill("youzou_yzs_suit")
			player.addTip("youzou_yzs", `游走 ${get.translation(get.suit(trigger.card,player))}`)
		},
		mod: {
			aiOrder(player, card, num) {
				if (!player.storage.youzou_yzs_suit) return num;
				if (!player.storage.youzou_yzs_color) return num;
				if (player.countMark("youzou_yzs") >= 2 && get.suit(card, player) == player.storage.youzou_yzs_suit) return num/10;
				if (get.color(card, player) == player.storage.youzou_yzs_color && get.suit(card, player) !== player.storage.youzou_yzs_suit) return num/10;
			}
		},
	},
	lvlin_yzs: {
		group: "lvlin_yzs_use",
		locked: true,
		zhuanhuanji: true,
		subSkill: {
			use: {
				charlotte: true,
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return event.card.storage?.lvlin_yzs_fangun;
				},
				async content(event, trigger, player) {
					await player.addTempSkill("lvlin_yzs_dis", { player: "useCard0" });
				},
			},
			dis: {
				mark: true,
				onremove: true,
				intro: {
					content: "使用的下张牌无距离限制",
				},
				mod: {
					targetInRange(card, player, target) {
						return true;
					},
				},
				sub: true,
				sourceSkill: "lvlin_yzs",
				"_priority": 0,
				"skill_id": "lvlin_yzs_dis",
			},
			yingjian: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
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
					player.yzs_UseShunfaji("lvlin_yzs_yingjian");
				},
				clickableFilter: function (player) {
					if (!player.countMark("youzou_yzs")) return false;
					return player.storage.lvlin_yzs != "yingjian" && game.hasPlayer(function (target) {
						return player.canUse({ name: "sha" }, target)
					});
				},
				clickableContent: async function (event, trigger, player) {
					let result = await player.chooseTarget(false)
						.set("filterTarget", (card, player, target) => {
							return player.canUse({ name: "sha" }, target)
						})
						.set("selectTarget", 1)
						.set("ai", target => {
							const player = get.player();
							return get.effect(target, {name:"sha"},player,player)
						})
						.set("prompt", "影箭")
						.set("prompt2", `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做普通【杀】使用`)
						.forResult()
					if (!result.bool) {
						return;
					}
					let next = player.useSkill("lvlin_yzs_yingjian")
					next.targets = result.targets;
					await next;
				},
				prompt2: `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做普通【杀】使用`,
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					if (!player.countMark("youzou_yzs")) return false;
					return player.storage.lvlin_yzs != "yingjian" && game.hasPlayer(function (target) {
						return player.canUse({ name: "sha" }, target)
					});
				},
				selectTarget: 1,
				filterTarget: function (card, player, target) {
					return player.canUse({ name: "sha" }, target)
				},
				async content(event, trigger, player) {
					player.removeMark("youzou_yzs", 1, false);
					player.storage.lvlin_yzs = "yingjian";
					player.markSkill("lvlin_yzs")
					let card = get.cards(1);
					let next = player.useCard({ name: "sha", isCard: false }, card, event.targets[0]);
					await next;
					const evt = event.getParent(2);
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				},
				ai: {
					order: 4,
					result: {
						player: -1,
						target(player, target, card, isLink) {
							card = {name:"sha",isCard:false}
							let eff = -1.5,
								odds = 1.35,
								num = 1;
							if (isLink) {
								eff = isLink.eff || -2;
								odds = isLink.odds || 0.65;
								num = isLink.num || 1;
								if (
									num > 1 &&
									target.hasSkillTag("filterDamage", null, {
										player: player,
										card: card,
										jiu: player.hasSkill("jiu"),
									})
								) {
									num = 1;
								}
								return odds * eff * num;
							}
							if (
								player.hasSkill("jiu") ||
								player.hasSkillTag("damageBonus", true, {
									target: target,
									card: card,
								})
							) {
								if (
									target.hasSkillTag("filterDamage", null, {
										player: player,
										card: card,
										jiu: player.hasSkill("jiu"),
									})
								) {
									eff = -0.5;
								} else {
									num = 2;
									if (get.attitude(player, target) > 0) {
										eff = -7;
									} else {
										eff = -4;
									}
								}
							}
							if (
								!player.hasSkillTag(
									"directHit_ai",
									true,
									{
										target: target,
										card: card,
									},
									true
								)
							) {
								odds -= 0.7 * target.mayHaveShan(player, "use", true, "odds");
							}
							_status.event.putTempCache("sha_result", "eff", {
								bool: target.hp > num && get.attitude(player, target) > 0,
								card: ai.getCacheKey(card, true),
								eff: eff,
								odds: odds,
							});
							return odds * eff;
						}
					}
				}
			},
			qiequ: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
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
					player.yzs_UseShunfaji("lvlin_yzs_qiequ");
				},
				clickableFilter: function (player) {
					if (!player.countMark("youzou_yzs")) return false;
					return player.storage.lvlin_yzs != "qiequ" && game.hasPlayer(function (target) {
						return player.canUse({ name: "shunshou" }, target)
					});
				},
				clickableContent: async function (event, trigger, player) {
					let result = await player.chooseTarget(false)
						.set("filterTarget", (card, player, target) => {
							return player.canUse({ name: "shunshou" }, target)
						})
						.set("selectTarget", 1)
						.set("ai", target => {
							const player = get.player();
							return get.effect(target, {name:"shunshou"},player,player)
						})
						.set("prompt", "窃取")
						.set("prompt2", `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做【顺手牵羊】使用`)
						.forResult()
					if (!result.bool) {
						return;
					}
					let next = player.useSkill("lvlin_yzs_qiequ")
					next.targets = result.targets;
					await next;
				},
				prompt2: `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做普通【顺手牵羊】使用`,
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					if (!player.countMark("youzou_yzs")) return false;
					return player.storage.lvlin_yzs != "qiequ" && game.hasPlayer(function (target) {
						return player.canUse({ name: "shunshou" }, target)
					});
				},
				selectTarget: 1,
				filterTarget: function (card, player, target) {
					return player.canUse({ name: "shunshou" }, target)
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (player, target) {

						// 保存原始状态
						var originalTransition = player.style.transition;
						var originalPosition = player.style.position;
						var originalZIndex = player.style.zIndex;
						// 获取位置信息
						var playerRect = player.getBoundingClientRect();
						var targetRect = target.getBoundingClientRect();

						// 计算移动距离
						var deltaX = targetRect.left - playerRect.left;
						var deltaY = targetRect.top - playerRect.top;

						// 计算移动距离的缩放（避免超出屏幕）
						var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
						var maxDistance = Math.min(window.innerWidth, window.innerHeight);
						var scaleFactor = 1;

						deltaX *= scaleFactor;
						deltaY *= scaleFactor;

						// 设置动画状态
						player.style.position = 'relative';
						player.style.zIndex = '9999';

						// 第一阶段：冲锋到目标位置
						player.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s';
						player.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(180deg) scale(1)`;


						// 冲锋后短暂停留，然后返回
						setTimeout(function () {
							// 第二阶段：返回原位
							player.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), filter 0.5s';
							player.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';

							// 返回时带点弹跳效果
							setTimeout(function () {
								player.style.transition = 'transform 0.2s ease-out';
								player.style.transform = 'translate(0px, -10px) scale(0.95)';

								setTimeout(function () {
									player.style.transform = 'translate(0px, 0px) scale(1)';

									// 恢复原始状态
									setTimeout(function () {
										player.style.transition = 'transform 1s ease';
										player.style.transform = '';
										player.style.position = originalPosition;
										player.style.zIndex = originalZIndex;
									}, 200);
								}, 200);
							}, 500);
						}, 400);

					}, player, event.targets[0]);
					player.chat("借过一下")
					player.removeMark("youzou_yzs", 1, false);
					player.storage.lvlin_yzs = "qiequ";
					player.markSkill("lvlin_yzs")
					let card = get.cards(1);
					let next = player.useCard({ name: "shunshou", isCard: false }, card, event.targets[0]);
					await next;
					const evt = event.getParent(2);
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				},
				ai: {
					order: 4,
					result: {
						player(player, target) {
							const hs = target.getGainableCards(player, "h");
							const es = target.getGainableCards(player, "e");
							const js = target.getGainableCards(player, "j");
							const att = get.attitude(player, target);
							if (att < 0) {
								if (
									!hs.length &&
									!es.some(card => {
										return get.value(card, target) > 0 && card !== target.getEquip("jinhe");
									}) &&
									!js.some(card => {
										var cardj = card.viewAs ? { name: card.viewAs } : card;
										if (cardj.name === "xumou_jsrg") {
											return true;
										}
										return get.effect(target, cardj, target, player) < 0;
									})
								) {
									return -1;
								}
							} else if (att > 1) {
								return es.some(card => {
									return get.value(card, target) <= 0;
								}) ||
									js.some(card => {
										var cardj = card.viewAs ? { name: card.viewAs } : card;
										if (cardj.name === "xumou_jsrg") {
											return false;
										}
										return get.effect(target, cardj, target, player) < 0;
									})
									? 0.5
									: -1;
							}
							return 0;
						},
						target(player, target) {
							const hs = target.getGainableCards(player, "h");
							const es = target.getGainableCards(player, "e");
							const js = target.getGainableCards(player, "j");

							if (get.attitude(player, target) <= 0) {
								if (hs.length > 0) {
									return -1.5;
								}
								return es.some(card => {
									return get.value(card, target) > 0 && card !== target.getEquip("jinhe");
								}) ||
									js.some(card => {
										var cardj = card.viewAs ? { name: card.viewAs } : card;
										if (cardj.name === "xumou_jsrg") {
											return true;
										}
										return get.effect(target, cardj, target, player) < 0;
									})
									? -1.5
									: 1.5;
							}
							return es.some(card => {
								return get.value(card, target) <= 0;
							}) ||
								js.some(card => {
									var cardj = card.viewAs ? { name: card.viewAs } : card;
									if (cardj.name === "xumou_jsrg") {
										return false;
									}
									return get.effect(target, cardj, target, player) < 0;
								})
								? 1.5
								: -1.5;
						},
					}
				}
			},
			fangun: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				trigger: {
					target: "useCardToTarget",
				},
				prompt2: "观看牌堆顶的3张牌并可与手牌任意交换，然后摸1张牌",
				filter(event, player) {
					if (!player.countMark("youzou_yzs")) return false;
					return player.storage.lvlin_yzs != "fangun"
				},
				check(event, player) {
					return player.countCards("h") < 5;
				},
				async content(event, trigger, player) {
					player.removeMark("youzou_yzs", 1, false);
					player.storage.lvlin_yzs = "fangun";
					player.markSkill("lvlin_yzs")
					let cards = get.cards(3);
					let result = await player.chooseToMove("将任意张手牌与牌堆顶的3张牌交换")
						.set("list", [
							["牌堆顶", cards],
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
					var pushs = result.moved[0],
						gains = result.moved[1];
					gains.removeArray(player.getCards("h"));
					pushs.removeArray(cards);
					await player.lose(pushs, ui.cardPile, "insert");
					game.updateRoundNumber();
					await player.gain(gains, "draw");
					await player.draw();

					game.broadcastAll(function (current) {
						//旋转函数
						var playerNode = current.style;
						if (playerNode) {

							playerNode.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
							playerNode.transform = 'rotateY(720deg) rotateX(15deg) scale(1.15)';
							playerNode.transformStyle = 'preserve-3d';

							setTimeout(function () {
								playerNode.transition = 'transform 1s ease';
								playerNode.transform = '';
							}, 800);
						}
					}, player)
				}
			},
		},
		init(player, skill) {
			player.addSkill(["lvlin_yzs_yingjian", "lvlin_yzs_qiequ", "lvlin_yzs_fangun"]);
		},
		onremove(player, skill) {
			player.removeSkill(["lvlin_yzs_yingjian", "lvlin_yzs_qiequ", "lvlin_yzs_fangun"]);
		},
	},
	//阿乌拉
	tianping_yzs: {
		subSkill: {
			effect: {
				name: "服从",
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "tianping_yzs",
				"_priority": 11,
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					if (!player.getStorage("tianping_yzs_effect")) return false;
					if (!event.card) return false;
					if (!event.targets.length) return false;
					return event.targets.some(target => target != player);
				},
				async cost(event, trigger, player) {
					let winner = player.getStorage("tianping_yzs_effect")
					event.result = await winner
						.chooseTarget()
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return true;
						})
						.set("selectTarget", 1)
						.set("ai", target => {
							const player = get.player();
							return get.effect(target,get.event().card,player,player)
						})
						.set("card",trigger.card)
						.set("prompt", "你可以将 " + get.translation(trigger.card) + " 的目标改为任意角色")
						.setHiddenSkill(event.name.slice(0, -5))
						.forResult();
				},
				async content(event, trigger, player) {
					trigger.targets.length = 0;
					trigger.targets = event.targets;
				},
				onremove: "storage"
			},
			change: {
				onremove() {
					let Aura = game.filterPlayer(current => current.hasSkill("tianping_yzs"));
					if (!Aura || !Aura.length) return;
					Aura = Aura[0];
					game.broadcastAll((Aura) => {
						_status.Auserlese_yzs = Aura;
					}, Aura);
				},
			}
		},
		init: function (player, skill) {
			game.broadcastAll((player) => {
				if (!_status.Auserlese_yzs)_status.Auserlese_yzs = player;
			}, player);
		},
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		priority: 22,
		trigger: {
			global: "phaseUseBegin",
		},
		check: function (event, player) {
			return get.attitude(player, event.player) < 0;
		},
		filter: function (event, player) {
			return player != event.player && player.canCompare(event.player)
		},
		prompt(event, player) {
			return `是否与 ` + get.translation(event.player) + ` 拼点？`;
		},
		prompt2: `胜者失去因此获得的${get.poptip("Auserlese_yzs")}，败者获得【服从魔法】并选择：<br>
	①摸2张牌，本阶段其对其他角色使用牌时，胜者可任意更改目标；<br>②给予胜者2张手牌。<br>最后，本阶段所有【服从魔法】中的名字改为<font color="#e553ff">胜者</font>`,
		async content(event, trigger, player) {
			let result = await player.chooseToCompare(trigger.player).forResult();
			if (result.tie) { return }
			var players = [player, trigger.player];
			if (result.bool) players.reverse();
			const winner = players[1];
			const loser = players[0]
			if (loser == player) {
				if (get.translation(winner).includes("芙莉莲")) {
					game.broadcastAll(() => {
						game.playAudio("ext:一中杀/audio/skill/tianping_yzs_lose2.mp3");
					});
				} else {
					game.broadcastAll(() => {
						game.playAudio("ext:一中杀/audio/skill/tianping_yzs_lose1.mp3");
					});
				}
			}
			if (!winner.hasSkill("tianping_yzs")) await winner.removeSkill("Auserlese_yzs");
			await loser.addSkill("Auserlese_yzs")
			result = await loser.chooseCard(2, `给予胜者2张手牌，否则你摸2张牌且本阶段对其他角色使用牌时 ` + get.translation(winner) + ` 可任意更改目标`, "h")
				.set("ai", card =>{
					const player = get.event().player;
					const target = get.event().target;
					if (_status.currentPhase !== player) return 0;
					if (get.attitude(player, target) >= 0) return 0;
					if (player.needsToDiscard() >= 3) return 6 - get.value(card);
					return 0;
				})
				.set("target",winner)
				.forResult();
			if (!result.bool) {
				await loser.draw(2);
				await loser.addTempSkill("tianping_yzs_effect", "phaseUseAfter")
				loser.storage.tianping_yzs_effect = winner;
				loser.markSkill("tianping_yzs_effect")
			}
			await loser.give(result.cards, winner);
			game.broadcastAll((winner) => {
				_status.Auserlese_yzs = winner;
			}, winner);
			await player.addTempSkill("tianping_yzs_change", "phaseUseAfter")
			//彩蛋
			if (get.translation(winner).includes("芙莉莲") && loser == player) {
				if (!player.getEquips(1).length) return;
				var card = { name: "sha", isCard: true };
				if (!game.hasPlayer(function (current2) {
					return loser.inRange(current2) && lib.filter.targetEnabled(card, loser, current2);
				})) return;
				game.broadcastAll(() => {
					game.playAudio("ext:一中杀/audio/skill/tianping_yzs_lose3.mp3");
				});
				await winner.useCard({ name: "jiedao", isCard: true}, loser)
			} 
		},
	},
	Auserlese_yzs: {
		nobracket: true,
		subSkill: {
			targeted: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "Auserlese_yzs",
				"_priority": 0,
			},
		},
		mark: true,
		marktext: "服",
		intro: {
			nocount: true,
			mark(dialog, _, player) {
				dialog.addText("你现在服从于 " + get.translation(_status.Auserlese_yzs));
			},
		},
		hiddenCard: function (player, name) {
			const slaves = game.filterPlayer(target => target.hasSkill("Auserlese_yzs")
				&& !player.getStorage("Auserlese_yzs_targeted").includes(target)
				&& !target.hasSkill("hidden_yzs")
				&& target.countCards("he") > 0);
			if (get.type(name) == "basic" && lib.inpile.includes(name) && slaves?.length) return true;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (!_status.Auserlese_yzs) return false;
			if (_status.Auserlese_yzs != player) return false;
			if (player == _status.currentPhase) return false;
			const slaves = game.filterPlayer(target => target.hasSkill("Auserlese_yzs")
				&& !player.getStorage("Auserlese_yzs_targeted").includes(target)
				&& !target.hasSkill("hidden_yzs")
				&& target.countCards("he") > 0
				&& player != target
			);
			if (!slaves || !slaves.length) return false;
			if (event.responded || event.type == "wuxie") return false;
			for (var i of lib.inpile) {
				if (get.type(i) == "basic" && event.filterCard({
					name: i,
					isCard: true
				}, player, event)) return true;
			}
			return false;
		},
		multitarget: true,
		selectTarget: [1, Infinity],
		filterTarget: function (card, player, target) {
			return target.hasSkill("Auserlese_yzs")
				&& !player.getStorage("Auserlese_yzs_targeted").includes(target)
				&& !target.hasSkill("hidden_yzs")
				&& target.countCards("he") > 0
				&& player != target
		},
		async content(event, trigger, player) {
			let evt = event.getParent(2);
			let backupx = _status.event;

			for (let target of event.targets) {
				_status.event = evt;
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					if (get.type(name) == "basic" && evt.filterCard({ name: name, isCard: true }, player, event)) {
						list.push(["基本", "", name]);
						if (name == "sha") {
							for (var j of lib.inpile_nature) list.push(["基本", "", "sha", j]);
						}
					}
				}
				_status.event = backupx;
				if (!list.length) continue;
				let result = await player.chooseButton(["服从魔法", [list, "vcard"]])
					.set("forced", false)
					.set("ai",button=>get.value(button))
					.set("prompt2", `请选择你想向 ` + get.translation(target) + ` 索取的牌，不选则跳过该角色`)
					.forResult();
				if (!result.bool) continue;
				const request = result.links[0][2];
				player.addTempSkill("Auserlese_yzs_targeted");
				player.markAuto("Auserlese_yzs_targeted", [target]);
				result = await target.chooseCard()
					.set("forced", false)
					.set("prompt", `给予“<font color="#e553ff">` + get.translation(player) + `</font>”1张` + get.translation(request) + `，然后“<font color="#e553ff">` + get.translation(player) + `</font>”摸1张牌并可给予你1张牌`)
					.set("prompt2", `若不给，则“<font color="#e553ff">` + get.translation(player) + `</font>”获得你的1张牌`)
					.set("selectCard", 1)
					.set("filterCard", function (card) {
						return get.name(card) == get.event().request;
					})
					.set("ai", card =>{
						const player = get.event().player;
						const target = get.event().target;
						if (get.attitude(player, target) > 0) return 0;
						return 6 - get.value(card);
					})
					.set("target",player)
					.set("request", request)
					.set("position", "he")
					.forResult()
				if (result.bool) {
					if (target != player) await target.give(result.cards, player);
					await player.draw();
					const position = target == player ? "e" : "he";
					if (!player.countCards(position)) continue;
					let result2 = await player.chooseCard()
						.set("forced", false)
						.set("prompt", `你可给予` + get.translation(target) + `1张牌`)
						.set("selectCard", 1)
						.set("ai", card => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.attitude(player, target) > 0) return 8 - get.value(card);
							return 0;
						})
						.set("target", target)
						.set("position", position)
						.forResult()
					if (!result2.bool) continue;
					await player.give(result2.cards, target);
				} else {
					const position = target == player ? "e" : "he";
					if (!target.countGainableCards(player, position)) continue;
					await player.gainPlayerCard(position, target, true).set("target", target).set("complexSelect", false).set("ai", lib.card.shunshou.ai.button);
				}
			}
			evt.goto(0);
			delete evt.openskilldialog;
		},
		ai: {
			order: 7,
			result: {
				player: 1,
				target:-1,
			}
		}
	},
	//马库斯
	fanyueciye_yzs: {
		nobracket: true,
		group: ["fanyueciye_yzs_die", "fanyueciye_yzs_mix", "fanyueciye_yzs_damage", "fanyueciye_yzs_damage2"],
		subSkill: {
			damage2: {
				priority: 7,
				forced: true,
				locked: true,
				trigger: {
					global: "damageBegin1"
				},
				filter(event, player) {
					if (!event.source) return false;
					return event.source.hasMark("fanyueciye_yzs_mark") && event.num > 0;
				},
				async content(event, trigger, player) {
					await player.yzs_addPassion();
					let cards = player.storage.RE_Mystic;
					let result = await player
						.chooseButton(["你可重铸1张“神秘术”", cards], 1, false)
						.set("filterButton", function (button) {
							return true;
						})
						.set("ai",button=>Math.random())
						.forResult();
					if (!result.bool) return;
					const list = get.character(player.name).RE_Mystic[1]
					let index = cards.indexOf(result.links[0]);
					let lv = result.links[0].hasGaintag("RE_Mystic_3") ? 3 : (result.links[0].hasGaintag("RE_Mystic_2") ? 2 : 1);
					let name = list.randomGet()
					let card = game.createCard(name, lib.card[name].suit);
					game.broadcastAll((gain, lv) => {
						while (lv > 0) {
							gain.addGaintag("RE_Mystic_" + lv)
							lv--;
						}
					}, card, lv)
					player.$throw(result.links[0])
					player.storage.RE_Mystic[index] = card;
					player.markSkill("RE_Mystic")
					player.$gain2(card, false);
				}
			},
			damage: {
				priority: 7,
				forced: true,
				locked: true,
				trigger: {
					global: "damageBegin3"
				},
				filter(event, player) {
					return event.player.hasMark("fanyueciye_yzs_mark") && event.num > 0;
				},
				async content(event, trigger, player) {
					await player.draw();
				}
			},
			mix: {
				audio: "ext:一中杀/audio/skill:3",
				priority: 92,
				trigger: {
					player: "yzs_RE_Mystic_Mix",
				},
				locked: true,
				filter(event, player) {
					if (!event.cards || !event.cards.length) return false;
					let color = get.color(event.cards[0]);
					return player.countCards("he", { color: color }) > 0;
				},
				async cost(event, trigger, player) {
					if (!trigger.cards || !trigger.cards.length) return false;
					let color = get.color(trigger.cards[0]);
					const str = color == "black" ? `弃置1张黑色牌` : `弃置1张红色牌`;
					event.result = await player.chooseToDiscard(player, "he", false)
						.set("filterCard", (card) => get.color(card) == get.event().color)
						.set("color", color)
						.set("prompt", str)
						.set("ai",card=>5-get.value(card))
						.set("prompt2", `你融合升阶时可弃1张同颜色牌以令之不消耗行动力`)
						.forResult();
				},
				async content(event, trigger, player) {
					trigger.consume = false;
				}
			},
			die: {
				priority: 92,
				trigger: {
					global: "die",
				},
				forceDie: true,
				locked: true,
				filter(event, player) {
					if (!event.player.hasMark("fanyueciye_yzs_mark")) return false;
					return game.hasPlayer(current => !current.hasMark("fanyueciye_yzs_mark"))
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget("请选择将要【标注】的目标", `“标注角色”受到非零伤害时，你摸1张牌。“标注角色”造成非零伤害时，你获得1点激情并可重铸1张${get.poptip("RE_Mystic")}`, true, function (card, player, target) {
							return !target.hasMark("fanyueciye_yzs_mark")
						})
						.set("ai", function (target) {
							let att = get.attitude(_status.event.player, target);
							if (att > 0) {
								return att + 1;
							}
							if (att == 0) {
								return Math.random();
							}
							return att;
						})
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(target => {
								if (target.hasMark("fanyueciye_yzs_mark")) return `标注`
							});
						})
						.set("animate", false)
						.forResult();
				},
				async content(event, trigger, player) {
					if (player.storage.fanyueciye_yzs) {
						player.storage.fanyueciye_yzs.clearMark("fanyueciye_yzs_mark", false)
						player.markSkill("fanyueciye_yzs");
					}
					const target = event.targets[0];
					player.storage.fanyueciye_yzs = target;
					target.addMark("fanyueciye_yzs_mark", 1, false);
					player.markSkill("fanyueciye_yzs");
				}
			}
		},
		audio: "ext:一中杀/audio/skill:2",
		mark: true,
		markimage: "extension/一中杀/image/fanyueciye_yzs.png",
		intro: {
			mark(dialog, content, player) {
				if (!player.storage.fanyueciye_yzs) {
					dialog.addText("当前无“标注角色”");
					return;
				}
				dialog.addText("当前“标注角色”为 " + get.translation(player.storage.fanyueciye_yzs));
				dialog.addText("其受到非零伤害时，你摸1张牌");
				dialog.addText(`其造成伤害时，你获得1点${get.poptip("Passion_yzs")}并可重铸1张${get.poptip("RE_Mystic")}`);
			},
		},
		priority: 92,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		locked: true,
		filter(event, player) {
			return game.hasPlayer(current => !current.hasMark("fanyueciye_yzs_mark")) && (event.name != "phase" || game.phaseNumber == 0);
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget("请选择将要【标注】的目标", `“标注角色”受到非零伤害时，你摸1张牌。“标注角色”造成非零伤害时，你获得1点激情并可重铸1张${get.poptip("RE_Mystic")}`, true, function (card, player, target) {
					return !target.hasMark("fanyueciye_yzs_mark")
				})
				.set("ai", function (target) {
					let att = get.attitude(_status.event.player, target);
					if (att > 0) {
						return att + 1;
					}
					if (att == 0) {
						return Math.random();
					}
					return att;
				})
				.set("onChooseTarget", function () {
					const event = get.event();
					event.targetprompt2.add(target => {
						if (target.hasMark("fanyueciye_yzs_mark"))return `标注`
					});
				})
				.set("animate", false)
				.forResult();
		},
		async content(event, trigger, player) {
			if (player.storage.fanyueciye_yzs) {
				player.storage.fanyueciye_yzs.clearMark("fanyueciye_yzs_mark", false)
				player.markSkill("fanyueciye_yzs");
			}
			const target = event.targets[0];
			player.storage.fanyueciye_yzs = target;
			target.addMark("fanyueciye_yzs_mark", 1, false);
			player.markSkill("fanyueciye_yzs");
		}
	},
	jingduke_yzs: {
		nobracket: true,
		persevereSkill: true,
		subSkill: {
			1: {
				persevereSkill: true,
				audio: "ext:一中杀/audio/skill:2",
				async content(event, trigger, player) {
					let cards = await player.draw().forResult();
					cards = cards.cards;
					if (!player.storage.fanyueciye_yzs || player.storage.fanyueciye_yzs == player) return
					let result = await player.chooseBool("是否将 " + get.translation(cards) + " 给予 " + get.translation(player.storage.fanyueciye_yzs) + " ?")
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								const player = get.event().player;
								const target = get.event().target
								return get.attitude(player, target) > 1;
							})()
						)
						.set("target", player.storage.fanyueciye_yzs)
						.forResult();
					if (!result.bool) return;
					await player.give(cards, player.storage.fanyueciye_yzs);
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
			2: {
				persevereSkill: true,
				audio: "jingduke_yzs_1",
				async content(event, trigger, player) {
					let cards = await player.draw(3).forResult();
					cards = cards.cards;
					if (!player.storage.fanyueciye_yzs || player.storage.fanyueciye_yzs == player) return
					let result = await player.chooseBool("是否将 " + get.translation(cards) + " 给予 " + get.translation(player.storage.fanyueciye_yzs) + " ?")
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								const player = get.event().player;
								const target = get.event().target
								return get.attitude(player, target) > 1;
							})()
						)
						.set("target", player.storage.fanyueciye_yzs)
						.forResult();
					if (result?.bool) await player.give(cards, player.storage.fanyueciye_yzs);
					await player.chooseToDiscard("he", true, 2);
					if (player.countMark("RE_AP") < get.character(player.name).RE_AP) await player.addMark("RE_AP", 1, false);
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
			3: {
				persevereSkill: true,
				audio: "jingduke_yzs_1",
				async content(event, trigger, player) {
					if (player.countMark("RE_AP") < get.character(player.name).RE_AP) await player.addMark("RE_AP", Math.min(2, get.character(player.name).RE_AP - player.countMark("RE_AP")), false);
					await player.yzs_addPassion(2);
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
		}
	},
	yudenghuozhong_yzs: {
		group: ["yudenghuozhong_yzs_sha"],
		nobracket: true,
		persevereSkill: true,
		subSkill: {
			sha: {
				popup: false,
				priority: 21,
				trigger: {
					player:"useCardAfter"
				},
				filter(event, player) {
					return event.card?.storage?.yudenghuozhong_yzs_1
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget("请选择将要【标注】的目标", `“标注角色”受到非零伤害时，你摸1张牌。“标注角色”造成非零伤害时，你获得1点激情并可重铸1张${get.poptip("RE_Mystic")}`, false, function (card, player, target) {
							return !target.hasMark("fanyueciye_yzs_mark")
						})
						.set("ai", function (target) {
							let att = get.attitude(_status.event.player, target);
							if (att > 0) {
								return att + 1;
							}
							if (att == 0) {
								return Math.random();
							}
							return att;
						})
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(target => {
								if (target.hasMark("fanyueciye_yzs_mark")) return `标注`
							});
						})
						.set("animate", false)
						.forResult();
				},
				async content(event, trigger, player) {
					if (player.storage.fanyueciye_yzs) {
						player.storage.fanyueciye_yzs.clearMark("fanyueciye_yzs_mark", false)
						player.markSkill("fanyueciye_yzs");
					}
					const target = event.targets[0];
					player.storage.fanyueciye_yzs = target;
					target.addMark("fanyueciye_yzs_mark", 1, false);
					player.markSkill("fanyueciye_yzs");
				},
			},
			1: {
				audio: "ext:一中杀/audio/skill:2",
				persevereSkill: true,
				filterX(player) {
					if (player.getCardUsable("sha")<1) return false;
					if (!game.hasPlayer(function (target) {
						return player.canUse("sha", target, true)
					})) return false;
					return !player.hasSkill("dengliangdeguang_yzs_1_used");
				},
				async costX(player) {
					let result = await player.chooseCardTarget()
						.set("selectCard", 1)
						.set("filterCard", (card, player, target) => {
							return true;
						})
						.set("position", "h")
						.set("prompt", "于灯火中")
						.set("prompt2", "将1张手牌当做普通【杀】使用，然后可转移【标注】")
						.set("filterTarget", (card, player, target) => {
							return player.canUse({ name: "sha", isCard: false }, target, true)
						})
						.forResult();
					return result;
				},
				filterCard(card, player) {
					return true;
				},
				position: "h",
				viewAs: {
					name: "sha",
					storage: {
						yudenghuozhong_yzs_1:true,
					}
				},
				viewAsFilter(player) {
					return player.countCards("h")
				},
				check(card) {
					const val = get.value(card);
					return 5 - val;
				},
				ai: {
					yingbian(card, player, targets, viewer) {
						if (get.attitude(viewer, player) <= 0) {
							return 0;
						}
						var base = 0,
							hit = false;
						if (get.cardtag(card, "yingbian_hit")) {
							hit = true;
							if (
								targets.some(target => {
									return target.mayHaveShan(viewer, "use") && get.attitude(viewer, target) < 0 && get.damageEffect(target, player, viewer, get.natureList(card)) > 0;
								})
							) {
								base += 5;
							}
						}
						if (get.cardtag(card, "yingbian_add")) {
							if (
								game.hasPlayer(function (current) {
									return !targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
								})
							) {
								base += 5;
							}
						}
						if (get.cardtag(card, "yingbian_damage")) {
							if (
								targets.some(target => {
									return (
										get.attitude(player, target) < 0 &&
										(hit ||
											!target.mayHaveShan(viewer, "use") ||
											player.hasSkillTag(
												"directHit_ai",
												true,
												{
													target: target,
													card: card,
												},
												true
											)) &&
										!target.hasSkillTag("filterDamage", null, {
											player: player,
											card: card,
											jiu: true,
										})
									);
								})
							) {
								base += 5;
							}
						}
						return base;
					},
					canLink(player, target, card) {
						if (!target.isLinked() && !player.hasSkill("wutiesuolian_skill")) {
							return false;
						}
						if (player.hasSkill("jueqing") || player.hasSkill("gangzhi") || target.hasSkill("gangzhi")) {
							return false;
						}
						let obj = {};
						if (get.attitude(player, target) > 0 && get.attitude(target, player) > 0) {
							if (
								(player.hasSkill("jiu") ||
									player.hasSkillTag("damageBonus", true, {
										target: target,
										card: card,
									})) &&
								!target.hasSkillTag("filterDamage", null, {
									player: player,
									card: card,
									jiu: player.hasSkill("jiu"),
								})
							) {
								obj.num = 2;
							}
							if (target.hp > obj.num) {
								obj.odds = 1;
							}
						}
						if (!obj.odds) {
							obj.odds = 1 - target.mayHaveShan(player, "use", true, "odds");
						}
						return obj;
					},
					basic: {
						useful: [5, 3, 1],
						value: [5, 3, 1],
					},
					order(item, player) {
						let res = 3.2;
						if (player.hasSkillTag("presha", true, null, true)) {
							res = 10;
						}
						if (typeof item !== "object" || !game.hasNature(item, "linked") || game.countPlayer(cur => cur.isLinked()) < 2) {
							return res;
						}
						//let used = player.getCardUsable('sha') - 1.5, natures = ['thunder', 'fire', 'ice', 'kami'];
						let uv = player.getUseValue(item, true);
						if (uv <= 0) {
							return res;
						}
						let temp = player.getUseValue("sha", true) - uv;
						if (temp < 0) {
							return res + 0.15;
						}
						if (temp > 0) {
							return res - 0.15;
						}
						return res;
					},
					result: {
						target(player, target, card, isLink) {
							let eff = -1.5,
								odds = 1.35,
								num = 1;
							if (isLink) {
								eff = isLink.eff || -2;
								odds = isLink.odds || 0.65;
								num = isLink.num || 1;
								if (
									num > 1 &&
									target.hasSkillTag("filterDamage", null, {
										player: player,
										card: card,
										jiu: player.hasSkill("jiu"),
									})
								) {
									num = 1;
								}
								return odds * eff * num;
							}
							if (
								player.hasSkill("jiu") ||
								player.hasSkillTag("damageBonus", true, {
									target: target,
									card: card,
								})
							) {
								if (
									target.hasSkillTag("filterDamage", null, {
										player: player,
										card: card,
										jiu: player.hasSkill("jiu"),
									})
								) {
									eff = -0.5;
								} else {
									num = 2;
									if (get.attitude(player, target) > 0) {
										eff = -7;
									} else {
										eff = -4;
									}
								}
							}
							if (
								!player.hasSkillTag(
									"directHit_ai",
									true,
									{
										target: target,
										card: card,
									},
									true
								)
							) {
								odds -= 0.7 * target.mayHaveShan(player, "use", true, "odds");
							}
							_status.event.putTempCache("sha_result", "eff", {
								bool: target.hp > num && get.attitude(player, target) > 0,
								card: ai.getCacheKey(card, true),
								eff: eff,
								odds: odds,
							});
							return odds * eff;
						},
					},
					tag: {
						respond: 1,
						respondShan: 1,
						damage(card) {
							if (game.hasNature(card, "poison")) {
								return;
							}
							return 1;
						},
						natureDamage(card) {
							if (game.hasNature(card, "linked")) {
								return 1;
							}
						},
						fireDamage(card, nature) {
							if (game.hasNature(card, "fire")) {
								return 1;
							}
						},
						thunderDamage(card, nature) {
							if (game.hasNature(card, "thunder")) {
								return 1;
							}
						},
						poisonDamage(card, nature) {
							if (game.hasNature(card, "poison")) {
								return 1;
							}
						},
					},
				},
				async contentX(event, trigger, player) {
					let next = player.useCard({ name: "sha", isCard: false, storage: { yudenghuozhong_yzs: true } }, event.cards, event.targets[0]);
					await next;
					let result = await player
						.chooseTarget("请选择将要【标注】的目标", `“标注角色”受到非零伤害时，你摸1张牌。“标注角色”造成非零伤害时，你获得1点激情并可重铸1张${get.poptip("RE_Mystic")}`, false, function (card, player, target) {
							return !target.hasMark("fanyueciye_yzs_mark")
						})
						.set("ai", function (target) {
							let att = get.attitude(_status.event.player, target);
							if (att > 0) {
								return att + 1;
							}
							if (att == 0) {
								return Math.random();
							}
							return att;
						})
						.set("animate", false)
						.forResult();
					if (!result.bool) return;
					if (player.storage.fanyueciye_yzs) {
						player.storage.fanyueciye_yzs.clearMark("fanyueciye_yzs_mark", false)
						player.markSkill("fanyueciye_yzs");
					}
					const target = result.targets[0];
					player.storage.fanyueciye_yzs = target;
					target.addMark("fanyueciye_yzs_mark", 1, false);
					player.markSkill("fanyueciye_yzs");
				}
			},
			2: {
				persevereSkill: true,
				audio: "yudenghuozhong_yzs_1",
				async content(event, trigger, player) {
					await player.draw();
					player.getStat().card.sha = 0;
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
			3: {
				persevereSkill: true,
				audio: "yudenghuozhong_yzs_1",
				async content(event, trigger, player) {
					await player.yzs_addPassion(1);
					if (!game.hasPlayer(function (target) {
						return player.canUse({ name: "sha" }, target, false)
					})) return;
					const result = await player.chooseTarget()
						.set("prompt", `请选择【杀】的目标`)
						.set("filterTarget", (card, player, target) => {
							return player.canUse({ name: "sha" }, target, false)
						})
						.set("forced", true)
						.forResult()
					let next = player.useCard({ name: "sha", isCard: true, storage: { yudenghuozhong_yzs: true } }, result.targets);
					next.directHit = result.targets;
					await next;

				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						}
					}
				},
			},
		},
		priority: 6,
		forced: true,
		trigger: {
			source: "damageBegin1"
		},
		filter(event, player) {
			return event.card && event.card.storage.yudenghuozhong_yzs;
		},
		async content(event, trigger, player) {
			await player.yzs_addPassion();
		}
	},
	huiwanggengyuanchu_yzs: {
		nobracket: true,
		group: ["huiwanggengyuanchu_yzs_gain"],
		locked: true,
		subSkill: {
			gain: {
				locked: true,
				forced: true,
				trigger: {
					player: "yzs_RE_Mystic_UseAfter"
				},
				filter(event, player) {
					return !player.storage.huiwanggengyuanchu_yzs_used || !player.storage.huiwanggengyuanchu_yzs_used.includes(event.card.name + "_" + event.lv)
				},
				async content(event, trigger, player) {
					await player.addTempSkill("huiwanggengyuanchu_yzs_used");
					const str = trigger.card.name + "_" + trigger.lv
					player.markAuto("huiwanggengyuanchu_yzs_used", [str]);
					await player.yzs_addPassion();
				},
			},
			used: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "huiwanggengyuanchu_yzs",
				"_priority": 0,
			},
		},
		forced: true,
		skillAnimation: "legend",
		animationColor: "thunder",
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "yzs_addPassionAfter"
		},
		filter(event, player) {
			return player.countMark("Passion_yzs") >= 8;
		},
		async content(event, trigger, player) {
			player.clearMark("Passion_yzs", false);
			let cards = player.storage.RE_Mystic;
			let num = 0;
			for (let card of cards) {
				if (card.hasGaintag("RE_Mystic_3")) {
					num++;
					continue;
				}
				if (card.hasGaintag("RE_Mystic_2")) {
					game.broadcastAll((gain) => {
						gain.addGaintag("RE_Mystic_3")
					}, card)
				} else {
					game.broadcastAll((gain) => {
						gain.addGaintag("RE_Mystic_2")
					}, card)
				}
			}
			player.markSkill("RE_Mystic");
			let damagetargets = [];
			let damage = [];
			while (num > 0) {
				if (!game.hasPlayer(function (target) {
					return (!target.hasSkill("hidden_yzs"));
				})) break;
				let target = await player.chooseTarget([1, num], true)
					.set("prompt", "回望更远处")
					.set("prompt2", "选择分配1点伤害的角色(下一轮选择可以重复选择相同的角色)")
					.set("filterTarget", (card, player, target) => {
						if (target.hasSkill("hidden_yzs")) return false;
						return true;
					})
					.set("damagetargets", damagetargets)
					.set("damage", damage)
					.set("onChooseTarget", function () {
						const event = get.event();
						event.targetprompt2.add(target => {
							const damagetargets = get.event().damagetargets;
							const damage = get.event().damage;
							const list = [];
							if (!damagetargets.includes(target)) list.add("0点");
							else {
								for (let cur of damage) {
									if (cur[0] == target) {
										list.add("" + cur[1] + "点");
									}
								}
							}
							return list;
						});
					})
					.set("ai", (target) => {
						const player = get.player();
						return get.damageEffect(target, player, player);
					})
					.forResult()
				if (!target.bool) break
				num -= target.targets.length;
				for (let current of target.targets) {
					let include = false;
					for (let cur of damage) {
						if (cur[0] == current) {
							cur[1]++;
							include = true;
							break;
						}
					}
					if (!include) {
						damage.push([current, 1]);
						damagetargets.push(current);
					}
				}
			}
			damagetargets.sortBySeat();
			for (let current of damagetargets) {
				for (let cur of damage) {
					if (cur[0] == current) {
						await current.damage(cur[1]);
						break;
					}
				}
			}
		}
	},
	//蕾赛
	fuse_yzs: {
		enable: "phaseUse",
		group: ["fuse_yzs_mark"],
		audio: "ext:一中杀/audio/skill:4",
		subSkill: {
			mark: {
				forced: true,
				popup: false,
				charlotte: true,
				priority: 3214,
				trigger: {
					global: "damageBegin4",
				},
				filter: function (event, player) {
					return event.nature && event.nature == 'fire'
				},
				async content(event, trigger, player) {
					await trigger.player.addTempSkill("boom_yzs_damaged");
				},
			},
		},
		derivation: "boom_yzs",
		usable: 1,
		locked: true,
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.draw(2);
			let next = player.chooseUseTarget({ name: "huogong" }, { isCard: false }, true, false);
			next.forced = false;
			await next;
			if (player.hp != 1) return;
			player.popup("BOOM！")
			game.broadcastAll(() => {
				game.playAudio("ext:一中杀/audio/skill/fuse_yzs.MP3");
			});
			await new Promise(r => setTimeout(r, 1000))
			game.broadcastAll(function (current) {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Reze_yzs2.png");
			}, player)
			game.broadcastAll((current) => {
				game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.MP3");
			}, player);
			player.playEffectOL(lib.skill.boom_yzs.Effect);
			if (game.hasPlayer(cur => cur.hasSkill("boom_yzs_damaged") && cur != player)) {
				game.broadcastAll(function (current) {
					_status.tempMusic = `ext:一中杀/audio/MONTAGEM CORAL.mp3`;
					game.playBackgroundMusic();

					var background = document.createElement("img");
					background.className = "background";
					window._currentDynamicBackground = background;
					Object.assign(background, {
						src: lib.assetURL + "/extension/一中杀/image/background/fuse_yzs.jpg",
					})
					Object.assign(background.style, {
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
						transition: "opacity 0.5s ease-out",
					})
					document.body.appendChild(background);
					setTimeout(() => {
						background.style.opacity = "1";
					}, 50)

					ui.backgroundMusic.addEventListener('ended', () => {
						delete _status.tempMusic;
						game.playBackgroundMusic();
					}, { once: true });
				}, player)
			}
			await player.recover(2);
			await player.addSkill("boom_yzs");
		},
		ai: {
			order(item, player) {
				if (player.hp == 1) return 10;
				return 0.1;
			}
		}
	},
	boom_yzs: {
		locked: true,
		forced: true,
		group: ["boom_yzs_use", "boom_yzs_recover", "boom_yzs_damage"],
		subSkill: {
			damage: {
				forced: true,
				popup: false,
				persevereSkill: true,
				priority: -123412,
				trigger: {
					source: "damageBegin4"
				},
				filter(event, player) {
					return event.num > 0;
				},
				async content(event, trigger, player) {
					game.broadcastAll((current) => {
						game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.MP3");
					}, trigger.player);
					trigger.player.playEffectOL(lib.skill.boom_yzs.Effect);
				}
			},
			damaged: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "boom_yzs",
				"_priority": 11,
			},
			use: {
				locked: true,
				forced: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return _status.currentPhase && get.type(event.card) == 'basic';
				},
				async content(event, trigger, player) {
					if (_status.currentPhase != player) {
						player.line(_status.currentPhase)
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/boom_yzs_use.MP3");

							// 创建效果元素
							const effect = document.createElement('div');
							document.documentElement.style.transform = "scale(1.1)";
							document.documentElement.style.transition = "none"; // 禁用过渡

							// 强制浏览器重绘，确保瞬间放大生效
							document.documentElement.offsetHeight; // 触发重绘

							// 延迟0.5秒后缩小回原始比例
							setTimeout(() => {
								document.documentElement.style.transform = "scale(1)";
								document.documentElement.style.transition = "transform 1s ease-out";
							}, 200);
							// 直接设置所有样式（避免CSS类问题）
							Object.assign(effect.style, {
								position: 'fixed',
								top: '0',
								left: '0',
								width: '100vw',
								height: '100vh',
								zIndex: '91', // 最大z-index
								pointerEvents: 'none',
								background: 'rgba(255, 0, 255, 0.1)',
								backdropFilter: 'blur(20px)',
								WebkitBackdropFilter: 'blur(20px)',
								filter: 'hue-rotate(90deg)',
								opacity: '0',
								animation: 'colorDispersion 2s ease-out forwards'
							});
							// 添加到游戏容器
							document.body.appendChild(effect);
							// 2秒后移除
							setTimeout(() => {
								if (effect.parentNode) {
									effect.parentNode.removeChild(effect);
								}
							}, 2000);

						});
						await new Promise(r => setTimeout(r, 2000))
					}
					else {
						let index=Math.floor((3*Math.random()))+1
						game.broadcastAll((index) => {
							game.playAudio(`ext:一中杀/audio/skill/boom_yzs_use${index}.MP3`);
						},index);
					}
					await _status.currentPhase.damage("fire");
				},
			},
			recover: {
				locked: true,
				forced: true,
				priority: 214,
				trigger: {
					player: "damageEnd",
				},
				filter: function (event, player) {
					return event.nature && event.nature == 'fire' && event.num > 0
				},
				async content(event, trigger, player) {
					await player.recover(trigger.num);
					await player.draw(trigger.num);
				},
			},
		},
		mod: {
			targetInRange: function (card, player, target) {
				if (target.hasSkill("boom_yzs_damaged")) return true;
			},
			cardUsableTarget(card, player, target) {
				if (target.hasSkill("boom_yzs_damaged")) return true;
			},
		},
		Effect: function (current) {
			{
				function playExplosionEffect(targetPlayer) {

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
					createParticles(explosion);

					// 动画结束后移除
					setTimeout(() => {
						if (explosion.parentNode) {
							explosion.parentNode.removeChild(explosion);
						}
					}, 800);
				}
				// 创建爆炸粒子
				function createParticles(container) {
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

						container.appendChild(particle);

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
				if (current) {
					playExplosionEffect(current);
				}
			}
		},
		priority: 214,
		trigger: {
			player: ["phaseBegin"],
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			game.broadcastAll(function (current) {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Reze_yzs.png");
			}, player)
			player.removeSkill("boom_yzs");
			await player.recover();
		},
		ai: {
			fireAttack: true,
			nofire: true,
		}
	},
	//加羽
	longzhiban_yzs: {
		nobracket: true,
		group: ["longzhiban_yzs_mark", "longzhiban_yzs_addDamage", "longzhiban_yzs_firstrecover", "longzhiban_yzs_draw", "longzhiban_yzs_skip", "longzhiban_yzs_wusheng", "longzhiban_yzs_protect", "longzhiban_yzs_recover", "longzhiban_yzs_damage", "longzhiban_yzs_renew"],
		global: ["longzhiban_yzs_MrDragon_auto"],
		subSkill: {
			mark: {
				marktext: "绊",
				markcount: true,
				mark: true,
				intro: {
					content: "mark",
				},
				locked: true,
				forced: true,
				trigger: {
					player: ["changeHpAfter"]
				},
				filter(event, player) {
					return !game.hasPlayer(cur => cur.name == 'MrDragon_yzs') && event.num != 0;
				},
				async content(event, trigger, player) {
					player.addMark("longzhiban_yzs_mark", Math.abs(trigger.num))
					if (player.countMark("longzhiban_yzs_mark") >= 13) {
						player.clearMark("longzhiban_yzs_mark");
						await player.useSkill("longzhiban_yzs")
					}
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			addDamage: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: ["damageBegin3"]
				},
				filter(event, player) {
					return !game.hasPlayer(cur => cur.name == 'MrDragon_yzs') && event.num > 0;
				},
				async content(event, trigger, player) {
					trigger.num += 2;
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			firstrecover: {
				audio: "ext:一中杀/audio/skill:1",
				forced: true,
				trigger: {
					player: "recoverAfter",
				},
				filter(event, player) {
					if (player.countMark("longzhiban_yzs_firstrecover")) return false;
					return game.hasPlayer(cur => cur.name == 'MrDragon_yzs')
				},
				async content(event, trigger, player) {
					player.addMark("longzhiban_yzs_firstrecover", 1, false);
					for (let cur of game.filterPlayer(cur => cur.name == 'MrDragon_yzs')) {
						await cur.recover();
					}
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			draw: {
				audio: "ext:一中杀/audio/skill:1",
				forced: true,
				trigger: {
					player: "drawAfter",
				},
				filter(event, player) {
					const evt = event.getParent();
					const list = ["longzhiban_yzs", "longzhiwu_yzs", "pre_longzhiban_yzs_wusheng"]
					if (!list.includes(evt.name)) return false;
					return game.hasPlayer(cur => cur.name == 'MrDragon_yzs')
				},
				async content(event, trigger, player) {
					for (let cur of game.filterPlayer(cur => cur.name == 'MrDragon_yzs')) {
						await cur.draw(trigger.num)
					}
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			skip: {
				locked: true,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return game.hasPlayer(cur => cur.name == 'MrDragon_yzs')
				},
				async cost(event, trigger, player) {
					const choiceList = ["1.跳过准备阶段", "2.跳过判定阶段", "3.跳过摸牌阶段", "4.跳过出牌阶段", "5.跳过弃牌阶段", "6.跳过结束阶段"];
					const result = (event.result = await player
						.chooseButton([`你可跳过本回合任意个阶段，则“龙先生”下一对应阶段连续执行2次`, [choiceList.slice(0, 2), "tdnodes"], [choiceList.slice(2, 4), "tdnodes"], [choiceList.slice(4, 6), "tdnodes"]])
						.set("filterButton", button => {
							return true;
						})
						.set("selectButton", [1, 6])
						.forResult());

					if (result?.links?.length) event.result.cost_data = event.result.links;
				},
				async content(event, trigger, player) {
					const choice = event.cost_data;
					let drawnum = choice.length;
					const list = ["phaseZhunbei", "phaseJudge", "phaseDraw", "phaseUse", "phaseDiscard", "phaseJieshu"]
					let MrDragon = game.filterPlayer(cur => cur.name == 'MrDragon_yzs');
					for (let i = 0; i < drawnum; i++) {
						let phase = list[parseInt(choice[i].slice(0, 1)) - 1]
						player.skip(phase);
						for (let cur of MrDragon) {
							cur.markAuto("longzhiban_yzs_MrDragon_yzs_exphase", [phase])
						}
					}
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": -2,
			},
			wusheng: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					if (!player.countCards("hes")) return
					if (player.countMark("longzhiban_yzs_wusheng") >= 3) return false;
					return (name == 'sha')
				},
				filterCard(card, player) {
					return get.color(card) == "red";
				},
				position: "hes",
				viewAs: {
					name: "sha",
				},
				viewAsFilter(player) {
					if (!game.hasPlayer(cur => cur.name == 'MrDragon_yzs')) return false;
					if (player.countMark("longzhiban_yzs_wusheng") >= 3) return false;
					if (!player.countCards("hes", { color: "red" })) {
						return false;
					}
					return true;
				},
				async precontent(event, trigger, player) {
					player.addMark("longzhiban_yzs_wusheng", 1, false);
					await player.draw();
				},
				prompt: "将一张红色牌当杀使用或打出",
				check(card) {
					const val = get.value(card);
					if (_status.event.name == "chooseToRespond") {
						return 1 / Math.max(0.1, val);
					}
					return 5 - val;
				},
				ai: {
					skillTagFilter(player) {
						if (!player.countCards("hes", { color: "red" })) {
							return false;
						}
					},
					respondSha: true,
					yingbian(card, player, targets, viewer) {
						if (get.attitude(viewer, player) <= 0) {
							return 0;
						}
						var base = 0,
							hit = false;
						if (get.cardtag(card, "yingbian_hit")) {
							hit = true;
							if (
								targets.some(target => {
									return target.mayHaveShan(viewer, "use") && get.attitude(viewer, target) < 0 && get.damageEffect(target, player, viewer, get.natureList(card)) > 0;
								})
							) {
								base += 5;
							}
						}
						if (get.cardtag(card, "yingbian_add")) {
							if (
								game.hasPlayer(function (current) {
									return !targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
								})
							) {
								base += 5;
							}
						}
						if (get.cardtag(card, "yingbian_damage")) {
							if (
								targets.some(target => {
									return (
										get.attitude(player, target) < 0 &&
										(hit ||
											!target.mayHaveShan(viewer, "use") ||
											player.hasSkillTag(
												"directHit_ai",
												true,
												{
													target: target,
													card: card,
												},
												true
											)) &&
										!target.hasSkillTag("filterDamage", null, {
											player: player,
											card: card,
											jiu: true,
										})
									);
								})
							) {
								base += 5;
							}
						}
						return base;
					},
					canLink(player, target, card) {
						if (!target.isLinked() && !player.hasSkill("wutiesuolian_skill")) {
							return false;
						}
						if (player.hasSkill("jueqing") || player.hasSkill("gangzhi") || target.hasSkill("gangzhi")) {
							return false;
						}
						let obj = {};
						if (get.attitude(player, target) > 0 && get.attitude(target, player) > 0) {
							if (
								(player.hasSkill("jiu") ||
									player.hasSkillTag("damageBonus", true, {
										target: target,
										card: card,
									})) &&
								!target.hasSkillTag("filterDamage", null, {
									player: player,
									card: card,
									jiu: player.hasSkill("jiu"),
								})
							) {
								obj.num = 2;
							}
							if (target.hp > obj.num) {
								obj.odds = 1;
							}
						}
						if (!obj.odds) {
							obj.odds = 1 - target.mayHaveShan(player, "use", true, "odds");
						}
						return obj;
					},
					basic: {
						useful: [5, 3, 1],
						value: [5, 3, 1],
					},
					order(item, player) {
						let res = 3.2;
						if (player.hasSkillTag("presha", true, null, true)) {
							res = 10;
						}
						if (typeof item !== "object" || !game.hasNature(item, "linked") || game.countPlayer(cur => cur.isLinked()) < 2) {
							return res;
						}
						//let used = player.getCardUsable('sha') - 1.5, natures = ['thunder', 'fire', 'ice', 'kami'];
						let uv = player.getUseValue(item, true);
						if (uv <= 0) {
							return res;
						}
						let temp = player.getUseValue("sha", true) - uv;
						if (temp < 0) {
							return res + 0.15;
						}
						if (temp > 0) {
							return res - 0.15;
						}
						return res;
					},
					result: {
						target(player, target, card, isLink) {
							let eff = -1.5,
								odds = 1.35,
								num = 1;
							if (isLink) {
								eff = isLink.eff || -2;
								odds = isLink.odds || 0.65;
								num = isLink.num || 1;
								if (
									num > 1 &&
									target.hasSkillTag("filterDamage", null, {
										player: player,
										card: card,
										jiu: player.hasSkill("jiu"),
									})
								) {
									num = 1;
								}
								return odds * eff * num;
							}
							if (
								player.hasSkill("jiu") ||
								player.hasSkillTag("damageBonus", true, {
									target: target,
									card: card,
								})
							) {
								if (
									target.hasSkillTag("filterDamage", null, {
										player: player,
										card: card,
										jiu: player.hasSkill("jiu"),
									})
								) {
									eff = -0.5;
								} else {
									num = 2;
									if (get.attitude(player, target) > 0) {
										eff = -7;
									} else {
										eff = -4;
									}
								}
							}
							if (
								!player.hasSkillTag(
									"directHit_ai",
									true,
									{
										target: target,
										card: card,
									},
									true
								)
							) {
								odds -= 0.7 * target.mayHaveShan(player, "use", true, "odds");
							}
							_status.event.putTempCache("sha_result", "eff", {
								bool: target.hp > num && get.attitude(player, target) > 0,
								card: ai.getCacheKey(card, true),
								eff: eff,
								odds: odds,
							});
							return odds * eff;
						},
					},
					tag: {
						respond: 1,
						respondShan: 1,
						damage(card) {
							if (game.hasNature(card, "poison")) {
								return;
							}
							return 1;
						},
						natureDamage(card) {
							if (game.hasNature(card, "linked")) {
								return 1;
							}
						},
						fireDamage(card, nature) {
							if (game.hasNature(card, "fire")) {
								return 1;
							}
						},
						thunderDamage(card, nature) {
							if (game.hasNature(card, "thunder")) {
								return 1;
							}
						},
						poisonDamage(card, nature) {
							if (game.hasNature(card, "poison")) {
								return 1;
							}
						},
					},
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			renew: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: ["phaseBegin"]
				},
				filter(event, player) {
					return !event.skill
				},
				async content(event, trigger, player) {
					player.clearMark("longzhiban_yzs_wusheng", false);
					player.clearMark("longzhiban_yzs_firstrecover", false);
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 300,
			},
			damage: {
				popup: false,
				locked: true,
				forced: true,
				trigger: {
					source: ["damageBegin1"]
				},
				filter(event, player) {
					if (!player.storage.isSub) return false;
					return game.hasPlayer(cur => cur.name == 'MrDragon_yzs')
				},
				async content(event, trigger, player) {
					trigger.num--;
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			recover: {
				locked: true,
				popup: false,
				forced: true,
				trigger: {
					player: ["recoverBegin"]
				},
				filter(event, player) {
					return event.card && game.hasPlayer(cur => cur.name == 'MrDragon_yzs')
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "longzhiban_yzs",
				"_priority": 30,
			},
			protect: {
				locked: true,
				forced: true,
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: ["damageBefore", "loseHpBefore"]
				},
				filter(event, player) {
					return game.hasPlayer(cur => cur.name == 'MrDragon_yzs')
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				ai: {
					nodamage: true,
					skillTagFilter(player, tag, arg) {
						if (!game.hasPlayer(function (current) {
							return current.name == 'MrDragon_yzs';
						})) return false
					},
				},
			},
			MrDragon_auto: {
				trigger: {
					player: ['playercontrol', 'chooseToUseBegin', 'chooseToRespondBegin', 'chooseToDiscardBegin', 'chooseToCompareBegin',
						'chooseButtonBegin', 'chooseCardBegin', 'chooseTargetBegin', 'chooseCardTargetBegin', 'chooseControlBegin',
						'chooseBoolBegin', 'choosePlayerCardBegin', 'discardPlayerCardBegin', 'gainPlayerCardBegin',
						'dieAfter']
				},
				firstDo: true,
				forced: true,
				priority: 999,
				forceDie: true,
				charlotte: true,
				popup: false,
				silent: true, //mode:['identity', 'guozhan', 'doudizhu', 'connect'],
				filter: function (event, player) {
					if (!_status.MrDragon_auto || !_status.MrDragon_auto.includes(player.playerid)) return false;
					if (event.autochoose && event.autochoose()) return false;
					//if (lib.filter.wuxieSwap(event)) return false;
					return true;
				},
				async content(event, trigger, player) {
					if (trigger.name == 'die') {
						const map = lib.playerOL ?? game.playerMap;
						for (const id of _status.MrDragon_auto) {
							const current = map[id];
							if (current.isAlive() && current != player) {
								game.broadcastAll((MrDragon) => {
									if (game.me.playerid != MrDragon.playerid) return;
									let evt = _status.event.getParent("chooseToUse")
									if (!evt) return;
									evt.endButton?.close();
									delete evt.endButton;
									evt.fakeforce = false;
								}, player)
								if (_status.connectMode) {
									game.yzs_swapPlayerOL(player, current);
								} else {
									if(player==game.me)game.swapPlayerAuto(current);
								};
								break;
							};
						};
						return;
					}
					if (!player.isAlive()) return;
					if (_status.MrDragon_auto.includes(player.playerid) && (_status.connectMode ? (!player.isOnline2() || player != game.me) : true)) {
						const map = lib.playerOL ?? game.playerMap;
						for (const id of _status.MrDragon_auto) {
							const current = map[id];
							if (_status.connectMode) {
								if ((current.isOnline2() || current == game.me) && current != player) {
									game.yzs_swapPlayerOL(current, player);
									break;
								};
							} else if (current == game.me && !_status.auto) {
								game.swapPlayerAuto(player);
							};
						};
					}
				},
			},
		},
		locked: true,
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		charlotte: true,
		unique: true,
		forced: true,
		priority: 12451,
		unique: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			if (game.countPlayer(function (current) {
				return current.name == 'MrDragon_yzs';
			})) return;
			let result = await player.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return true
				})
				.set("forced", true)
				.set("prompt", "龙之绊")
				.set("prompt2", "在目标角色下家召唤“龙先生”")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
			if (!result.bool) return;
			const pos = result.targets[0];
			if (!_status.longzhiban_yzs) {
				if (!game.checkResult_longzhiban_yzs) {
					game.checkResult_longzhiban_yzs = game.checkResult;
					game.checkResult = function () {
						const targets = game.players.filter(i => i.isNoPlayer_longzhiban_yzs);
						game.players.removeArray(targets);
						game.checkResult_longzhiban_yzs();
						game.players.addArray(targets);
					};
				}
				if (!game.checkOnlineResult_longzhiban_yzs) {
					game.checkOnlineResult_longzhiban_yzs = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						const targets = game.players.filter(i => i.isNoPlayer_longzhiban_yzs);
						game.players.removeArray(targets);
						game.checkOnlineResult_longzhiban_yzs(player);
						game.players.addArray(targets);
					};
				}
				game.broadcastAll(() => {
					_status.longzhiban_yzs = true;
				})
			}
			if (!get.attitude_longzhiban_yzs) {
				get.attitude_longzhiban_yzs = get.attitude;
				get.attitude = function (from, to) {
					if (from && from?.getStorage("longzhiban_yzs_source", false)) {
						from = from.getStorage("longzhiban_yzs_source", false);
					}
					if (to && to?.getStorage("longzhiban_yzs_source", false)) {
						to = to.getStorage("longzhiban_yzs_source", false);
					}
					let att = get.attitude_longzhiban_yzs(from, to);
					return att;
				};
			}
			const MrDragon = await game.addPlayerOL(pos, "MrDragon_yzs", null, true);
			game.broadcastAll((MrDragon) => {
				MrDragon.isNoPlayer_longzhiban_yzs = true;
				MrDragon.dieAfter = function () { };
				MrDragon.dieAfter2 = function () { };
			}, MrDragon)
			MrDragon.setStorage("longzhiban_yzs_source", player);
			MrDragon.ai.modAttitudeFrom = function (from, to, att) {
				if (_status.longzhiban_yzs_source_att_ing) return att;
				if (from.getStorage("longzhiban_yzs_source", false)) {
					from = from.getStorage("longzhiban_yzs_source", false);
				}
				if (to.getStorage("longzhiban_yzs_source", false)) {
					to = to.getStorage("longzhiban_yzs_source", false);
				}
				_status.longzhiban_yzs_source_att_ing = true;
				att = get.attitude(from, to);
				delete _status.longzhiban_yzs_source_att_ing;
				return att;
			};
			game.broadcastAll((MrDragon, player) => {
				if (get.mode() == 'guozhan') {
					if (MrDragon.name2 == undefined) MrDragon.name2 = MrDragon.name1;
				}
				if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
					MrDragon.side = player.side;
					MrDragon.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
					MrDragon.node.identity.dataset.color = player.node.identity.dataset.color;
				}
				MrDragon.skillH = [];
				MrDragon.storage.zhibi = [];
				MrDragon.storage.stratagem_expose = [];
				MrDragon.storage.stratagem_fury = 0;
			}, MrDragon, player);
			MrDragon.storage.isSub = true;
			MrDragon.markSkill("isSub");
			MrDragon.directgain(get.cards(4));
			MrDragon
				.when({ global: "die" })
				.filter((evt, player2) => {
					if (evt.reserveOut) return false;
					return evt.player == player || evt.player == player2;
				})
				.assign({
					forceDie: true,
				})
				.step(lib.skill[event.name].dieRemove);
			game.broadcastAll(function (player, MrDragon) {
				_status.MrDragon_auto = [player.playerid, MrDragon.playerid]
				MrDragon._trueMe = player;
				player._trueMe = player;
			}, player, MrDragon)
			game.log(player, '召唤了', lib.translate['MrDragon_yzs']);
		},
		async dieRemove(event, trigger, player) {
			if (_status.roundStart == player) _status.roundStart = player.next;
			if (lib.playerOL) delete lib.playerOL[player.playerid];
			game.broadcastAll(player => {
				game.players.remove(player);
				game.dead.remove(player);
				if (player.seatNum == 1) player.nextSeat.setSeatNum(1);
				player.nextSeat.previousSeat = player.previousSeat;
				player.previousSeat.nextSeat = player.nextSeat;
				player.delete();
				player.removed = true;
				setTimeout(() => player.removeAttribute("style"), 500);
			}, player);
			game.broadcastAll(() => {
				ui.arena.setNumber(game.players.concat(game.dead).length);
				let SeatNumStart = game.players.concat(game.dead).find(current => current.seatNum == 1);
				let pos = 0,
					target = game.me.nextSeat;
				for (let x = 0; x < game.countPlayer2(null, true); x++) {
					if (target == game.me) break;
					pos++;
					target.dataset.position = pos;
					target = target.nextSeat;
				}
				if (SeatNumStart) {
					let SeatNum = 1,
						Seat = SeatNumStart;
					for (let i = 0; i < game.countPlayer2(null, true); i++) {
						SeatNum++;
						Seat = Seat.nextSeat;
						if (Seat == SeatNumStart) break;
						Seat.setSeatNum(SeatNum);
					}
				}
			});
		},
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (player == arg) {
					return false;
				}
				if (!_status.MrDragon_auto || !_status.MrDragon_auto.length) return false;
				if (_status.MrDragon_auto.includes(player.playerid) && _status.MrDragon_auto.includes(arg.playerid)) {
					return true;
				};
				return false;
			},
		},
	},
	longzhiban_yzs_MrDragon_yzs: {
		nobracket: true,
		group: ["longzhiban_yzs_MrDragon_yzs_exphase", "longzhiban_yzs_MrDragon_yzs_nophaseUse", "longzhiban_yzs_MrDragon_yzs_recover", "longzhiban_yzs_MrDragon_yzs_phaseEnd"],
		subSkill: {
			exphase: {
				locked: true,
				forced: true,
				trigger: {
					player: ["phaseZhunbeiEnd", "phaseJudgeEnd", "phaseDrawEnd", "phaseUseEnd", "phaseDiscardEnd", "phaseJieshuEnd"]
				},
				filter(event, player) {
					if (!event.getParent() || !event.getParent().phaseList) return false;
					if (!player.storage.longzhiban_yzs_MrDragon_yzs_exphase) return false;
					return player.storage.longzhiban_yzs_MrDragon_yzs_exphase.includes(event.name);
				},
				async content(event, trigger, player) {
					player.storage.longzhiban_yzs_MrDragon_yzs_exphase.remove(trigger.name);
					player.markSkill("longzhiban_yzs_MrDragon_yzs_exphase");
					trigger.getParent("phase", true).phaseList.splice(trigger.getParent("phase", true).num, 0, trigger.name + "|longzhiban_yzs_MrDragon_yzs_exphase");
				},
				"skill_id": "longzhiban_yzs_MrDragon_yzs_exphase",
				sub: true,
				sourceSkill: "longzhiban_yzs_MrDragon_yzs",
				"_priority": 10,
			},
			phaseEnd: {
				audio: "ext:一中杀/audio/skill:3",
				locked: true,
				trigger: {
					player: "phaseEnd",
				},
				filter(event, player) {
					return player.countCards("he") > 0;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseToDiscard(
							"龙之绊：你可弃任意张牌然后摸等量张牌",
							(card, player) => {
								return true;
							},
							[1, Infinity]
						)
						.set("position", "he")
						.set("chooseonly", true)
						.setHiddenSkill("longzhiban_yzs_MrDragon_yzs")
						.forResult();
				},
				async content(event, trigger, player) {
					if (!event.cards || !event.cards.length) return;
					await player.modedDiscard(event.cards);
					const num = event.cards.length;
					await player.draw(num);
				},
				"skill_id": "longzhiban_yzs_MrDragon_yzs_phaseEnd",
				sub: true,
				sourceSkill: "longzhiban_yzs_MrDragon_yzs",
				"_priority": 10,
			},
			recover: {
				popup: false,
				locked: true,
				forced: true,
				trigger: {
					player: "recoverBegin",
				},
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name && evt.name === "longzhiban_yzs") return false;
					let card = event.card;
					if (card && [player, player.storage.longzhiban_yzs_source].includes(evt.player)) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				"skill_id": "longzhiban_yzs_MrDragon_yzs_recover",
				sub: true,
				sourceSkill: "longzhiban_yzs_MrDragon_yzs",
				"_priority": 10,
			},
			nophaseUse: {
				popup: false,
				locked: true,
				forced: true,
				trigger: {
					player: "phaseUseBefore",
				},
				filter(event, player) {
					if (!player.storage.longzhiban_yzs_source) return false;
					return player.storage.longzhiban_yzs_source.hp >= 5;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "longzhiban_yzs_MrDragon_yzs",
				"_priority": 3,
			},
		},
		mod: {
			maxHandcardBase: function (player, num) {
				if (!player.storage.longzhiban_yzs_source) return;
				return num + player.storage.longzhiban_yzs_source.hp;
			},
		},
		popup: false,
		locked: true,
		charlotte: true,
		superCharlotte: true,
		unique: true,
		forced: true,
		priority: 11,
		unique: true,
		trigger: {
			player: "phaseDrawBegin2",
		},
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.num -= 2;
		},
		ai: {
			threaten: 1.3,
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (player == arg) {
					return false;
				}
				if (!_status.MrDragon_auto || !_status.MrDragon_auto.length) return false;
				if (_status.MrDragon_auto.includes(player.playerid) && _status.MrDragon_auto.includes(arg.playerid)) {
					return true;
				};
				return false;
			},
		},
	},
	shitianlongjian_yzs: {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && player.hasEquipableSlot(1) && !player.getEquips("longzhijian_yzs").length
		},
		async content(event, trigger, player) {
			var card = game.createCard2("longzhijian_yzs");
			player.$gain2(card, false);
			await player.equip(card);
		},
		mod: {
			canBeGained(card, source, player) {
				if (player.getEquips("longzhijian_yzs").includes(card)) {
					return false;
				}
			},
			canBeDiscarded(card, source, player) {
				if (player.getEquips("longzhijian_yzs").includes(card)) {
					return false;
				}
			},
			canBeReplaced(card, player) {
				if (player.getVEquips("longzhijian_yzs").includes(card)) {
					return false;
				}
			},
			cardDiscardable(card, player) {
				if (player.getEquips("longzhijian_yzs").includes(card)) {
					return false;
				}
			},
			cardEnabled2(card, player) {
				if (player.getEquips("longzhijian_yzs").includes(card)) {
					return false;
				}
			},
		},
		group: ["shitianlongjian_yzs_blocker1", "shitianlongjian_yzs_damage"],
		subSkill: {
			damage: {
				trigger: {
					source: "damageBegin1",
				},
				filter(event, player) {
					if (event.parent.name == "_lianhuan" || event.parent.name == "_lianhuan2") {
						return false;
					}
					if (event.card && event.card.name == "sha") {
						if (player.hp >= 5) {
							return true;
						}
					}
					return false;
				},
				forced: true,
				content() {
					trigger.num++;
				},
			},
			blocker1: {
				trigger: {
					player: ["loseBefore", "disableEquipBefore"],
				},
				popup: false,
				forced: true,
				filter(event, player) {
					if (event.name == "disableEquip") {
						return event.slots.includes("equip1");
					}
					var cards = player.getEquips("longzhijian_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("longzhijian_yzs"));
					} else {
						while (trigger.slots.includes("equip1")) {
							trigger.slots.remove("equip1");
						}
					}
				},
				sub: true,
				sourceSkill: "shitianlongjian_yzs",
				"_priority": 23,
			},
		},
		"_priority": 32,
	},
	longzhiwu_yzs: {
		nobracket: true,
		subSkill: {
			sha: {
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return num + player.countMark("longzhiwu_yzs_sha")
						}
					},
				},
				onremove(player) {
					player.clearMark("longzhiwu_yzs_sha", false)
				},
				sub: true,
				sourceSkill: "longzhiwu_yzs",
				"_priority": 2,
			}
		},
		locked: true,
		forced: true,
		priority: -231,
		audio: "ext:一中杀/audio/skill:3",
		trigger: {
			player: "phaseBegin"
		},
		filter(event, player) {
			return player.hp <= 2 || player.hp >= 5;
		},
		async content(event, trigger, player) {
			if (player.hp <= 2) {
				await player.recover();
				await player.draw(3);
				await player.chooseToDiscard("he", true, 3);
			} else if (player.hp >= 5) {
				if (player.maxHp >= 9 && player.countMark("longzhiwu_yzs_sha") >= 2) return;
				let result = await player.chooseButton([
					get.prompt("yifuzhiming_yzs"),
					[
						[
							["1", "你体力上限+2(至多为9)"],
							["2", "你出【杀】数+1直至下次受到伤害后(当前+ " + player.countMark("longzhiwu_yzs_sha") + "/2)"],
						],
						"textbutton",
					],
				])
					.set("forced", true)
					.set("selectButton", 1)
					.set("filterButton", function (button) {
						const player=get.event().player
						if (button.link == "1") {
							return player.maxHp < 9;
						} else if (button.link == "2") {
							return player.countMark("longzhiwu_yzs_sha") < 2;
						}
						return true;
					})
					.set("ai", button => {
						const player = get.player();
						if (button.link == "1") {
							return 4;
						} else {
							return 2;
						}
					})
					.forResult();
				if (!result.bool) return
				if (result.links[0] == "1") {
					await player.gainMaxHp(Math.min(2, 9 - player.maxHp));
				} else if (result.links[0] == "2") {
					player.addMark("longzhiwu_yzs_sha", 1, false);
					await player.addTempSkill("longzhiwu_yzs_sha", { player: "damageBeginEnd" })
				}
			}
		},
		mark: true,
		marktext: "舞",
		markcount: true,
		intro: {
			mark(dialog, _, player) {
				dialog.addText("当前出【杀】数+ " + player.countMark("longzhiwu_yzs_sha") + "/2");
			},
		},
	},
	//刃
	shuhuenci_yzs: {
		group: ["shuhuenci_yzs_up1", "shuhuenci_yzs_up2", "shuhuenci_yzs_down", "shuhuenci_yzs_recover"],
		subSkill: {
			up1: {
				sub: true,
				sourceSkill: "shuhuenci_yzs",
				locked: true,
				forced: true,
				priority: 7,
				trigger: {
					player: ["changeHpEnd"]
				},
				filter(event, player) {
					if (event.getParent(2)?.name == "dapiwansi_yzs_damage") return false;
					return event.num > 0;
				},
				async content(event, trigger, player) {
					await player.draw(Math.min(trigger.num, 10));
				}
			},
			up2: {
				sub: true,
				sourceSkill: "shuhuenci_yzs",
				locked: true,
				forced: true,
				priority: 7,
				trigger: {
					player: ["recoverEnd"]
				},
				filter(event, player) {
					if (event.getParent()?.name == "dapiwansi_yzs_damage") return false;
					return event.overflow > 0;
				},
				async content(event, trigger, player) {
					await player.draw(Math.min(trigger.overflow, 10));
				}
			},
			down: {
				sub: true,
				sourceSkill: "shuhuenci_yzs",
				locked: true,
				forced: true,
				priority: 4,
				trigger: {
					player: ["changeHpEnd"]
				},
				filter(event, player) {
					if (event.getParent(2)?.name == "dapiwansi_yzs_damage") return false;
					return event.num < 0;
				},
				async content(event, trigger, player) {
					await player.chooseToDiscard("he", true, -trigger.num);
				}
			},
			recover: {
				sub: true,
				sourceSkill: "shuhuenci_yzs",
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return get.color(event.card) == "red" && player == _status.currentPhase;
				},
				async content(event, trigger, player) {
					await player.recover();
				}
			}
		},
		nobracket: true,
		locked: true,
		trigger: {
			global: "damageBegin3",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (event.num <= 0) return false;
			return event.player.hp == player.hp;
		},
		async cost(event, trigger, player) {
			let result = await player
				.chooseButton(["你可失去1点体力令 " + get.translation(trigger.player) + " 受到的伤害±1", [[["add", "+1"], ["sub", "-1"]], "tdnodes"]])
				.set("filterButton", button => {
					return true;
				})
				.set("ai", button => {
					const player = get.event().player;
					const target = get.event().target;
					if (button.link == "add") return get.attitude(player, target) < 0;
					return get.attitude(player, target) > 0;
				})
				.set("target", trigger.player)
				.set("selectButton", 1)
				.forResult();
			if (!result.bool) return false;
			event.result = {
				bool: true,
				cost_data: result.links[0],
			}
		},
		async content(event, trigger, player) {
			await player.loseHp();
			if (event.cost_data == "add") trigger.num++;
			else trigger.num--;
		},
		ai: {
			damageBonus:true,
		}
	},
	bianzangsong_yzs: {
		group: ["bianzangsong_yzs_loseHp", "bianzangsong_yzs_recover"],
		subSkill: {
			loseHp: {
				locked: true,
				forced: true,
				priority: 23,
				trigger: {
					global: "phaseEnd"
				},
				filter(event, player) {
					if (event.bianzangsong_yzs) return false;
					return player.hp > event.player.hp
				},
				async content(event, trigger, player) {
					trigger.bianzangsong_yzs = true;
					await player.loseHp();
				}
			},
			recover: {
				locked: true,
				prompt2: "你可恢复1点体力",
				priority: 23,
				trigger: {
					global: "phaseEnd"
				},
				filter(event, player) {
					if (event.bianzangsong_yzs) return false;
					return player.hp <= event.player.hp
				},
				async content(event, trigger, player) {
					trigger.bianzangsong_yzs = true;
					await player.recover();
				}
			}
		},
		nobracket: true,
		locked: true,
		forced: true,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		filter(event, player) {
			if (_status.currentPhase == player) return false;
			if (player.countCards("h")) {
				return false;
			}
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		async content(event, trigger, player) {
			if (trigger.getParent(3)?.name == "shuhuenci_yzs_down") {
				await player.draw(player.maxHp - player.hp + 1);
				if (!game.hasPlayer(function (target) {
					return (!target.hasSkill("hidden_yzs"))
				})) return;
				let result = await player.chooseTarget("彼岸葬送", "选择 1 名角色，对其造成1点伤害", true)
					.set("filterTarget", (card, player, target) => {
						return !(target.hasSkill("hidden_yzs"));
					})
					.set("ai", target => {
						const player = get.player();
						return get.damageEffect(target,player,player)
					})
					.forResult()
				if (!result.bool) {
					return;
				}
				await result.targets[0].damage()
				return;
			}
			await player.draw();
		},
	},
	dapiwansi_yzs: {
		group: "dapiwansi_yzs_damage",
		subSkill: {
			damage: {
				locked: true,
				forced: true,
				trigger: {
					source: "damageEnd"
				},
				async content(event, trigger, player) {
					let count = player.countMark("dapiwansi_yzs");
					player.setMark("dapiwansi_yzs", player.hp, false);
					player.addTip("dapiwansi_yzs", `大辟万死 ${player.hp}`)
					if (player.hp == count) return;
					if (player.hp > count) {
						await player.loseHp(player.hp - count);
					} else if (player.hp < count) {
						await player.recover(count - player.hp);
					}
				}
			},
		},
		nobracket: true,
		locked: true,
		forced: true,
		priority: 151213,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			player.setMark("dapiwansi_yzs", player.hp, false);
			player.addTip("dapiwansi_yzs", `大辟万死 ` + player.hp)
		}
	},
	//莉涅
	AirFazen_yzs: {
		group: ["AirFazen_yzs_record"],
		marktext: "仿",
		intro: {
			markcount(storage) {
				return storage.length;
			},
			mark(dialog, content, player) {
				const storage = player.getStorage("AirFazen_yzs");
				const names = storage;
				if (player.isUnderControl(true) && names.length) {
					dialog.addText("当前记录牌名：");
					dialog.addSmall([names, "vcard"]);
				}
			},
		},
		subSkill: {
			used: {
				charlotte: true,
				onremove: "storage",
				sub: true,
				sourceSkill: "AirFazen_yzs",
				"_priority": 0,
				"skill_id": "AirFazen_yzs_used",
			},
			record: {
				priority: 3,
				locked: true,
				audio: "ext:一中杀/audio/skill:2",
				usable: 1,
				prompt2(event, player) {
					return "每回合限1次：你可摸2张牌，然后记录此牌牌名(" + get.translation(event.card.name) + ")";
				},
				trigger: {
					global: ["useCard", "respond"],
				},
				filter: function (event, player) {
					//!event.card.isCard表示是转化牌，!event.cards || !event.cards.length表示是虚拟牌
					if (!get.is.convertedCard(event.card)) return false;
					var info = lib.card[event.card.name];
					if (info.toself) {
						return true;
					}
					if (info.selectTarget == 1) return true;
					return false;
				},
				check(event, player) {
					if (_status.currentPhase == player) {
						if (player.storage.AirFazen_yzs.includes(event.card.name)) return get.value(event.card) > 4;
						return get.value(event.card) > 0;
					} else {
						return true;
					}
				},
				async content(event, trigger, player) {
					await player.draw(2);
					if (!player.storage.AirFazen_yzs_record) player.storage.AirFazen_yzs_record = {};
					player.storage.AirFazen_yzs_record[trigger.card.name] = trigger.player.name;
					player.markSkill("AirFazen_yzs_record")
					player.flashAvatar("AirFazen_yzs_record", trigger.player.name);
					player.markAuto("AirFazen_yzs", [trigger.card.name])
				}
			},
		},
		locked: true,
		hiddenCard(player, name) {
			var list = player.getStorage("AirFazen_yzs").slice(0);
			list.removeArray(player.getStorage("AirFazen_yzs_used"));
			return list.includes(name) && player.countCards("h");
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (event.responded || event.AirFazen_yzs) return false;
			var list = player.getStorage("AirFazen_yzs").slice(0);
			list.removeArray(player.getStorage("AirFazen_yzs_used"));
			if (!list.length) {
				return false;
			}
			if (!player.countCards("h")) {
				return false;
			}
			for (var i of list) {
				if (event.filterCard(get.autoViewAs({ name: i, }, "unsure"), player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = player.getStorage("AirFazen_yzs").slice(0);
				list.removeArray(player.getStorage("AirFazen_yzs_used"));
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					if (event.filterCard(get.autoViewAs({ name: i, isCard: false, }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("模仿", [list2, "vcard"]);
			},
			check(button) {
				if (_status.event.getParent().type != "phase") {
					return 1;
				}
				return _status.event.player.getUseValue({ name: button.link[2], isCard: false, }, null, true);
			},
			backup(links, player) {
				return {
					audio: "ext:一中杀/audio/skill:1",
					filterCard() {
						return true;
					},
					selectCard: 1,
					position: "h",
					check(card) {
						return 7 - get.value(card);
					},
					popname: true,
					viewAs: {
						name: links[0][2],
						isCard: false,
					},
					async precontent(event, trigger, player) {
						player.logSkill("AirFazen_yzs");
						player.addTempSkill("AirFazen_yzs_used");
						player.markAuto("AirFazen_yzs_used", [event.result.card.name]);
						if (player.storage.AirFazen_yzs_record[event.result.card.name]) {
							player.flashAvatar("AirFazen_yzs", player.storage.AirFazen_yzs_record[event.result.card.name]);
						}
					},
				};
			},
			prompt(links, player) {
				return "将1张手牌当做【" + get.translation(links[0][2]) + "】使用或打出";
			},
		},
		ai: {
			save: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player, tag, arg) {
				if (!player.countCards("h") || player.isTempBanned("AirFazen_yzs")) {
					return false;
				}
				if (tag == "respondSha" || tag == "respondShan") {
					if (arg == "respond") {
						return false;
					}
					return player.getStorage("AirFazen_yzs").includes(tag == "respondSha" ? "sha" : "shan");
				}
				return player.getStorage("AirFazen_yzs").includes("tao") || (player.getStorage("AirFazen_yzs").includes("jiu") && arg == player);
			},
			order: 4,
			result: {
				player:1
			},
			threaten: 1.9,
		},
		"skill_id": "AirFazen_yzs",
		"_priority": 0,
	},
	xuanzhan_yzs: {
		group: "xuanzhan_yzs_use",
		subSkill: {
			use: {
				popup: false,
				forced: true,
				priority: 3,
				trigger: {
					player: ["useCardAfter"],
				},
				filter(event, player) {
					return event.card?.storage?.xuanzhan_yzs
				},
				async content(event, trigger, player) {
					const { cards } = trigger;
					let name = cards[0].name;
					if (lib.card[name].notarget) return;
					let prompt2 = "你可将1张【杀】当做" + get.translation(name) + "使用"
					let result = await player.chooseCard(false)
						.set("prompt", "旋斩")
						.set("prompt2", prompt2)
						.set("filterCard", (card, player, target) => {
							return get.name(card, player) == 'sha'
						})
						.set("ai",card=>get.value(card))
						.set("position", "h")
						.forResult()
					if (!result.bool) return;
					game.trySkillAudio("fangtian_skill");
					await player.chooseUseTarget(true, { name: name, isCard: false }, result.cards);
				}
			}
		},
		enable: ["chooseToUse"],
		hiddenCard: function (player, name) {
			if (!player.countCards("hs")) return
			return (name == 'sha')
		},
		filterCard: function (card, player) {
			return get.type(card) == "trick"
		},
		viewAs: {
			name: "sha",
			storage: {
				xuanzhan_yzs: true,
			}
		},
		check(card) {
			return get.value(card)
		},
		filter(event, player) {
			return player.countCards("hs", card => get.type(card) == "trick")
		},
		viewAsFilter(player) {
			return player.countCards("hs", card => get.type(card) == "trick")
		},
		position: "hs",
		prompt: `将1张<font color="#f43e96">非延时锦囊牌</font>当做普通【杀】使用`,
		ai: {
			
			result: { player: 2 }
		}
	},
	huanwu_yzs: {
		mod: {
			globalTo: function (from, to, distance) {
				if (to.storage.huanwu_yzs) {
					const info = lib.card[to.storage.huanwu_yzs];
					let num = 0;
					if (info?.distance?.globalTo) num = info.distance.globalTo
					if (typeof num == "number") {
						return distance + num;
					}
				}
			},
			globalFrom: function (from, to, distance) {
				if (from.storage.huanwu_yzs) {
					const info = lib.card[from.storage.huanwu_yzs];
					let num = 0;
					if (info?.distance?.globalFrom) num = info.distance.globalFrom
					if (typeof num == "number") {
						return distance + num;
					}
				}
			},
			attackRange: function (player, num) {
				if (player.storage.huanwu_yzs) {
					const info = lib.card[player.storage.huanwu_yzs];
					let count = 0;
					if (info?.distance?.attackFrom) count = info.distance.attackFrom
					if (typeof num == "number") {
						return num - count;
					}
				}
			},
		},
		locked: true,
		async init(player, skill) {
			if (!player.storage.huanwu_yzs) {
				player.setStorage("huanwu_yzs", "renwang")
				await player.addAdditionalSkills("huanwu_yzs", player.storage.huanwu_yzs + "_skill");
			}
		},
		priority: -231,
		trigger: {
			global: "phaseBegin"
		},
		filter(event, player) {
			let list = [];
			for (var name of lib.inpile) {
				var type = get.type(name);
				if (type != 'basic') continue;
				var card = {
					name: name,
					isCard: false
				};
				if (player.hasUseTarget(card)) {
					list.push([type, '', name]);
				}
				if (name == 'sha') {
					for (var i of lib.inpile_nature) {
						card.nature = i;
						if (player.hasUseTarget(card)) list.push([type, '', name, i]);
					}
				}
			}
			if (!list.length) return false;
			return player.countCards("he") > 0;
		},
		async cost(event, trigger, player) {
			let list = [];
			for (var name of lib.inpile) {
				var type = get.type(name);
				if (type != 'basic') continue;
				var card = {
					name: name,
					isCard: false
				};
				if (player.hasUseTarget(card)) {
					list.push([type, '', name]);
				}
				if (name == 'sha') {
					for (var i of lib.inpile_nature) {
						card.nature = i;
						if (player.hasUseTarget(card)) list.push([type, '', name, i]);
					}
				}
			}
			if (!list.length) return false;
			let result1 = await player.chooseButton(["幻武", [list, "vcard"]])
				.set("forced", false)
				.set("filterButton", function (button, player) {
					return player.countCards("he", (card) => get.type(card, player) == "equip") > 0;
				})
				.set("ai",button=>get.value(button))
				.forResult();
			if (!result1.bool) return false;
			let prompt2 = "将1张装备牌当做" + get.translation(result1.links[0][2]) + "使用";
			let result2 = await player.chooseCardTarget(false)
				.set("filterTarget", (card, player, target) => {
					return player.canUse({ name: get.event().cardname, isCard: false }, target, true)
				})
				.set("cardname", result1.links[0][2])
				.set("prompt", "幻武")
				.set("prompt2", prompt2)
				.set("filterCard", (card, player, target) => {
					return get.type(card, player) == "equip"
				})
				.set("ai2", target => {
					const player = get.player();
					return get.effect(target, { name: get.event().cardname, isCard: false },player,player)
				})
				.set("position", "he")
				.forResult()
			if (!result2.bool) return false;
			event.result = {
				bool: true,
				cards: result2.cards,
				targets: result2.targets,
				cost_data: result1.links[0][2],
			}
		},
		async content(event, trigger, player) {
			const { cards, targets, cost_data } = event;
			let name = cards[0].name;
			if (player.storage?.huanwu_yzs) await player.removeAdditionalSkills("huanwu_yzs", player.storage.huanwu_yzs + "_skill");
			player.setStorage("huanwu_yzs", name)
			if (lib.skill[name + "_skill"]) await player.addAdditionalSkills("huanwu_yzs", name + "_skill");
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, `effect/${lib.card[name].subtype}.mp3`);
			await player.useCard(cards, { name: cost_data, isCard: false }, targets[0]);
		}
	},
	//阿拉斯托
	guangbo_yzs: {
		group: ["guangbo_yzs_gain"],
		subSkill: {
			buff: {
				charlotte:true,
				mod: {
					cardEnabled(card, player) {
						return false;
					},
					cardRespondable(card, player) {
						return false;
					},
					cardUsable(card, player) {
						return false;
					},
				}
			},
			gain: {
				forced:true,
				priority: 666,
				charlotte: true,
				popup: false,
				trigger: {
					global: "gainAfter",
				},
				filter(event, player) {
					if (event.player == player) return false;
					const evt = event.getParent();
					if (!evt || !evt.card || evt.card.name != "wugu") return false;
					if (!event.cards.some(card => get.color(card, event.player) == "red")) return false;
					return evt.card.storage.guangbo_yzs
				},
				async content(event, trigger, player) {
					await trigger.player.addTempSkill("guangbo_yzs_buff");
				},

			},
		},
		audio: "ext:一中杀/audio/skill:1",
		enable: "phaseUse",
		usable(skill, player) {
			return player.countMark("CrimsonShadow_yzs") + 1;
		},
		filter(event, player) {
			return true
		},
		async content(event, trigger, player) {
			game.broadcastAll(() => {
				if (_status.tempMusic == `ext:一中杀/audio/INSANE.mp3`) return;
				_status.tempMusic = `ext:一中杀/audio/INSANE.mp3`;
				game.playBackgroundMusic();
				ui.backgroundMusic.addEventListener('ended', () => {
					delete _status.tempMusic;
					game.playBackgroundMusic();
				}, { once: true });
			});
			await player.draw();
			await player.chooseUseTarget(true, { name: "wugu", isCard: true, storage: { guangbo_yzs: true } });
		},
		ai: {
			order: 9,
			result: {
				player:3,
			}
		}
	},
	CrimsonShadow_yzs: {
		group: ["CrimsonShadow_yzs_damage"],
		subSkill: {
			damage: {
				priority: 666,
				trigger: {
					player: "damageBegin4",
				},
				forced: true,
				filter: function (event, player) {
					return event.num>0;
				},
				async content(event, trigger, player) {
					let x = Math.ceil(player.hp / 2);
					let num = player.maxHp - player.hp;
					if (num < 1 || player.hp < 1) {
						trigger.num = x;
						return;
					}
					let result = await trigger.player.chooseBool("你即将受到" + x + "点伤害<br>是否扣除" + num + "点体力上限以无效之？")
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								const player = get.event().player;
								return !player.isHealthy();
							})()
						)
						.forResult();
					if (result.bool) {
						await player.loseMaxHp(num);
						player.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
						trigger.cancel();
					} else {
						trigger.num = x;
					}
				},
			},
		},
		priority: 666,
		trigger: {
			source: "dieAfter",
		},
		audio: "ext:一中杀/audio/skill:1",
		forced: true,
		filter: function (event, player) {
			return true;
		},
		async content(event, trigger, player) {
			player.addMark("CrimsonShadow_yzs",1,false)
		},
		sub: true,
	},
	GuiltyDemon_yzs: {
		group: ["GuiltyDemon_yzs_use"],
		subSkill: {
			use: {
				priority: 666,
				locked: true,
				forced: true,
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				filter(event, player) {
					return typeof event.card.number == "number" 
				},
				async content(event, trigger, player) {
					await player.gainMaxHp();
				},
			},
		},
		priority: 666,
		locked: true,
		forced: true,
		trigger: {
			player: ["useCard"],
		},
		filter(event, player) {
			if (typeof event.card.number != "number") return false;
			return [1, 11, 12, 13].includes(event.card.number);
		},
		async content(event, trigger, player) {
			trigger.addCount = false;
			var stat = player.getStat().card,
				name = trigger.card.name;
			if (typeof stat[name] == "number") stat[name]--;
		},
		mod: {
			aiOrder(card, player, num) {
				if (card.name != "sha" || typeof card.number != "number") return num;
				if ([1, 11, 12, 13].includes(card.number)&&card.name=="sha") return num+10;
			},
			targetInRange: function (card) {
				if (typeof card.number != "number") return;
				if ([1, 11, 12, 13].includes(card.number)) return true;
			},
			cardUsable: function (card, num) {
				if (typeof card.number != "number") return;
				if ([1, 11, 12, 13].includes(card.number)) return Infinity;
			},
			cardnumber(card, player, number) {
				let num = number + player.maxHp - player.hp;
				if (num>0&&num % 13 == 0) return 13;
				return (num % 13);
			},
		},
	},
}
export default skills;
