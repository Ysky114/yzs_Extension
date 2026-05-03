"use strict"
game.import("card", function (lib, game, ui, get, ai, _status) {
	var list = {
		name: "yzs",
		connect: true,
		card: {
			"spear_yzs": {
				fullskin: true,
				selectTarget: 1,
				type: "basic",
				enable: true,
				filterTarget: function (card, player, target) {
					if (player == target) return false;
					return true;
				},
				updateUsable: "phaseUse",
				reverseOrder: true,
				cardPrompt(card) {
					return `出牌阶段对1名其他角色使用。你与其展示各自手牌，若展示牌花色无此牌花色，你对目标角色造成1点伤害`;
				},
				async content(event, trigger, player) {
					if (player.isDead() || event.target.isDead()) {
						event.finish();
						return;
					}
					player.line(event.target);
					let showcards = [];
					showcards.addArray(player.getCards("h"));
					showcards.addArray(event.target.getCards("h"));
					await player.showHandcards(player, "因【矛】而展示牌");
					await event.target.showHandcards(event.target, "因【矛】而展示牌");
					let bool = true;
					for (let i = 0; i < showcards.length; i++) {
						if ((get.suit(showcards[i])) == (get.suit(event.card))) {
							bool = false;
							break;
						}
					}
					if (bool) await event.target.damage();
				},
				ai: {
					basic: {
						useful: [5, 3, 1],
						value: (card, player) => {
							if (player.hasCard("h", c => get.suit(c, player) == get.suit(card, player))) return 0.2;
							return 3;
						},
					},
					order: (card, player) => {
						return 2;
					},
					result: {
						target(player, target, card) {
							if (target.countCards("h") > 2 && player.countCards("h", { suit: get.suit(card, player) })) {
								if (!player.hasCard(c => get.suit(c, player) == get.suit(card, player) && c != card)) return get.damageEffect(target, player, target);
								return -0.2;
							}
							return -0.2
						}
					},
					tag: {
						damage(card) {
							return 1;
						},
					},
				},
				image: "ext:一中杀/image/card/spear_yzs.png",
			},
			"yotou_yzs": {
				onLose() {
					player.addTempSkill("yotou_yzs_skill_lose");
				},
				distance: {
					attackFrom: -1,
				},
				cardPrompt(card, player) {
					player = player || get.owner(card) || get.player()
					if (!player?.storage?.yotou_temp || !player?.storage?.yotou_ever) return `你出【杀】数+<font color="#e553ff">1</font>，<br>
			你使用【杀】造成伤害+<font color="#e553ff">0</font>，<br>
			你的【杀】需用<font color="#e553ff">1</font>张【闪】响应。<br>你可将武器牌当做普通【杀】使用或打出。<br>
			此牌离开武器栏后，你摸牌至手牌数等于你上一出牌阶段的开始时手牌数（至多为12），然后令你的吟唱+<font color="#e553ff">0</font>。（每个紫色数字不可大于5）`
					return `你出【杀】数+<font color="#e553ff">${1 + player.storage.yotou_ever.usable + player.storage.yotou_temp.usable}</font>，<br>
			你使用【杀】造成伤害+<font color="#e553ff">${player.storage.yotou_ever.adddamage + player.storage.yotou_temp.adddamage}</font>，<br>
			你的【杀】需用<font color="#e553ff">${1 + player.storage.yotou_ever.shanreq + player.storage.yotou_temp.shanreq}</font>张【闪】响应。<br>你可将武器牌当做普通【杀】使用或打出。<br>
			此牌离开武器栏后，你摸牌至手牌数等于你上一出牌阶段的开始时手牌数（至多为12），然后令你的吟唱+<font color="#e553ff">${player.storage.yotou_ever.sing + player.storage.yotou_temp.sing}</font>。（每个紫色数字不可大于5）`
				},
				enable: (card, player) => {
					return player.hasSkill("yotouXi_yzs");
				},
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				loseDelay: false,
				skills: ["yotou_yzs_skill"],
				image: "ext:一中杀/image/card/yotou_yzs.png",
			},
			"XZgun_yzs": {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				distance: {
					attackFrom: -3,
				},
				loseDelay: false,
				skills: ["XZgun_yzs_skill"],
				image: "ext:一中杀/image/card/XZgun_yzs.png",
			},
			"XZblade_yzs": {
				fullskin: true,
				type: "equip",
				subtype: "equip2",
				loseDelay: false,
				skills: ["XZblade_yzs_skill"],
				image: "ext:一中杀/image/card/XZblade_yzs.png",
			},
			"DeathNote_yzs": {
				fullskin: true,
				selectTarget: 1,
				type: "special",
				enable: false,
				filterTarget: function (card, player, target) {
					if (player == target) return false;
					return true;

				},
				reverseOrder: true,
				cardPrompt(card) {
					return `每公轮结束时，对1名其他角色使用。目标角色失去全部体力(至多5点)`;
				},
				async content(event, trigger, player) {
					if (player.isDead() || event.target.isDead()) {
						event.finish();
						return;
					}
					player.line(event.target);
					let num = Math.min(5, event.target.hp);
					if (player.hasSkill("kila_yzs")) num += 2;
					await event.target.loseHp(num);
				},
				ai: {
					basic: {
						useful: 4.5,
						value(card, player) {
							if (player.hasSkill("kila_yzs")) return 12
							return 8;
						},
					},
					order: 6,
					tag: {
						damage: 2,
						loseCard: 1,
					},
					result: {
						target(player, target, card) {
							return -2 * target.hp - (player.hasSkill("kila_yzs") ? 4 : 0);
						}
					},
				},
				image: "ext:一中杀/image/card/DeathNote_yzs.png",
			},
			"maotouying_yzs": {
				audio: "ext:一中杀/audio/card",
				fullskin: true,
				selectTarget: 1,
				type: "animal",
				enable(card, player) {
					return player.hasSkill("princetwittering_yzs")
				},
				allowMultiple: false,
				filterTarget: function (card, player, target) {
					if (player == target) return false;
					const num1 = player.countCards("h");
					const num2 = target.countCards("h");
					return num1 - num2 > -2 && num1 - num2 < 2;

				},
				updateUsable: "phaseUse",
				reverseOrder: true,
				async content(event, trigger, player) {
					if (player.isDead() || event.target.isDead()) {
						event.finish();
						return;
					}
					player.line(event.target);
					await player.swapHandcards(event.target);
					await event.target.gain(event.cards, "gain2");
				},
				ai: {
					basic: {
						useful: 4.5,
						value(card, player) {
							if (!player.hasSkill("princetwittering_yzs")) return 0
							return 8;
						},
					},
					order: 10,
					result: {
						target(player2, target) {
							let v = 0;
							v += player2.countCards("h", function (card) {
								return get.value(card) >= 8;
							})
							v += 2 * (player2.countCards("h") - target.countCards("h"))
							return v;
						},
					},
				},
				image: "ext:一中杀/image/card/maotouying_yzs.png",
			},
			"pomochong_yzs": {
				audio: "ext:一中杀/audio/card",
				fullskin: true,
				selectTarget: 1,
				type: "animal",
				enable(card, player) {
					return player.hasSkill("princetwittering_yzs")
				},
				filterTarget: function (card, player, target) {
					if (player == target) return false;
					const num = player.countMark("pomochong_yzs_used");
					if (num < 5) return target.countCards("hej") > 0;
					else return true;
				},
				updateUsable: "phaseUse",
				reverseOrder: true,
				allowMultiple: false,
				async content(event, trigger, player) {
					player.addTempSkill("pomochong_yzs_used");
					player.addMark("pomochong_yzs_used", 1, false);
					const num = player.countMark("pomochong_yzs_used");
					if (player.isDead() || event.target.isDead()) {
						event.finish();
						return;
					}
					player.line(event.target);
					if (num < 5) {
						if (event.target.countCards("hej") > 0) await player.discardPlayerCard(event.target, "hej", true);
						else return;
					}
					else if (num < 8) await event.target.damage();
					await event.target.gain(event.cards.filterInD(), "gain2");
				},
				ai: {
					basic: {
						useful: 4.5,
						value(card, player) {
							if (!player.hasSkill("princetwittering_yzs")) return 0
							return 8;
						},
					},
					order: 10,
					result: {
						target(player2, target) {
							const num = player.countMark("pomochong_yzs_used");
							if (num < 5) return -1;
							return get.damageEffect(target, player2, target);
						},
					},
				},
				image: "ext:一中杀/image/card/pomochong_yzs.png",
			},
			"shengbaihu_yzs": {
				audio: "ext:一中杀/audio/card",
				fullskin: true,
				selectTarget: 1,
				type: "animal",
				enable(card, player) {
					return player.hasSkill("princetwittering_yzs")
				},
				filterTarget: function (card, player, target) {
					if (player == target) return false;
					return true;
				},
				updateUsable: "phaseUse",
				reverseOrder: true,
				allowMultiple: false,
				async content(event, trigger, player) {
					const { target } = event;
					if (target.countGainableCards(player, "hej") > 0) {
						await player.gainPlayerCard(target, "hej", true, Math.min(target.countGainableCards(player, "hej"), 2));
					}
					const num = 2,
						hej = player.getCards("hej");
					if (!hej.length) {
						await target.gain(event.cards, "gain2");
						return;
					}
					await player.chooseToGive(target, Math.min(hej.length, num), `交给${get.translation(target)}${get.cnNumber(num)}张牌`, "hej", true);
					await target.gain(event.cards, "gain2");
				},
				ai: {
					basic: {
						useful: 4.5,
						value(card, player) {
							if (!player.hasSkill("princetwittering_yzs")) return 0
							return 8;
						},
					},
					order: 10,
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
									return 0;
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
									? 1.5
									: 0;
							}
							return 1;
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
					},
				},
				image: "ext:一中杀/image/card/shengbaihu_yzs.png",
			},
			"kuangchangbaozha_yzs": {
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: -1,
				cardcolor: "red",
				toself: true,
				filterTarget(card, player, target) {
					return target === player;
				},
				modTarget: true,
				async content(event, trigger, player) {
					if (event.target.isDead()) {
						event.finish();
						return;
					}
					if (!event.filter) event.filter = card => get.type2(card) == "trick";
					let cards = event.target.getCards("h", event.filter)
					await event.target.showHandcards(event.target, "因【矿场爆炸】而展示牌");
					if (!cards.length) {
						await event.target.recover();
						return;
					}
					await event.target.discard(cards);
					event.num = cards.length;
					if (event.num > 3) event.num = 3;
					let num = event.num;
					if (num == 1) return;
					else {
						if (!game.hasPlayer(function (target) {
							return (!target.hasSkill("hidden_yzs"));
						})) return;
						let damagetargets = [];
						let damage = [];
						while (num > 1) {
							if (!game.hasPlayer(function (target) {
								return (!target.hasSkill("hidden_yzs"));
							})) break;
							let target = await event.target.chooseTarget([1, num - 1], true)
								.set("prompt", "矿场爆炸")
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
									return get.damageEffect(target, player, player, "fire");
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
									await current.damage(cur[1], "fire");
									break;
								}
							}
						}
						if (event.num - 1 - damagetargets.length == 0) return;
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/first_bomb_yzs_damage.MP3");
						});
						event.target.playEffectOL(lib.skill.boom_yzs.Effect);
						await event.target.damage(event.num - 1 - damagetargets.length, "fire", "nosource")
					}
				},
				ai: {
					order(item, player) {
						let num = 0;
						if (typeof item === "object") {
							num = player.countCards("h", c => item != c && (get.type(c) == "trick" || get.type(c) == "delay"))
						}
						num = player.countCards("h", c => (get.type(c) == "trick" || get.type(c) == "delay"))
						if (num == 1) return -1;
						if (num > 1) {
							return 1.5 * Math.min(3, num) + 2 - num;
						}
						return 2;
					},
					wuxie(target, card, player, viewer) {
						if (target.countCards("h") * Math.max(target.hp, 5) > 6) {
							return 0;
						}
					},
					basic: {
						order: 7.4,
						useful: 0.6,
						value(card, player) {
							let num = player.countCards("h", c => card != c && (get.type(c) == "trick" || get.type(c) == "delay"))
							if (num == 1) return -2;
							if (num > 1) {
								return 1.5 * Math.min(3, num) + 2 - num;
							}
							return 2;
						},
					},
					result: {
						target(player, target, card) {
							let num = player.countCards("h", c => card != c && (get.type(c) == "trick" || get.type(c) == "delay"))
							if (num == 1) return -1;
							if (num > 1) {
								return 1.5 * Math.min(3, num) + 2 - num;
							}
							return 2;
						}
					},
					tag: {
						recover: 1,
						fireDamage: 1,
					},
				},
				image: "ext:一中杀/image/card/kuangchangbaozha_yzs.png",
			},
			"shizhongjian_yzs": {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				cardcolor: "red",
				enable: true,
				modTarget: true,
				toself: true,
				skills: ["shizhongjian_yzs_skill"],
				forceDie: true,
				onEquip: function () {
					player.markSkill("shizhongjian_yzs_skill");
				},
				onLose: function () {
					player.unmarkSkill("shizhongjian_yzs_skill");
				},
				ai: {
					basic: {
						equipValue: 3,
						order: (card, player) => {
							const equipValue = get.equipValue(card, player) / 20;
							return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
						},
						useful: 2,
						value: (card, player, index, method) => {
							if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
							const info = get.info(card),
								current = player.getEquip(info.subtype),
								value = (current && card != current && get.value(current, player));
							let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
							if (typeof equipValue == "function") {
								if (method == "raw") return equipValue(card, player);
								if (method == "raw2") return equipValue(card, player) - value;
								return Math.max(0.1, equipValue(card, player) - value);
							}
							if (typeof equipValue != "number") equipValue = 0;
							if (method == "raw") return equipValue;
							if (method == "raw2") return equipValue - value;
							return Math.max(0.1, equipValue - value);
						},
					},
					result: {
						target: (player, target, card) => get.equipResult(player, target, card),
					},
				},
				image: "ext:一中杀/image/card/shizhongjian_yzs.png",
				selectTarget: -1,
				filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
				allowMultiple: false,
				content: function () {
					if (
						!card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) {
						target.equip(card);
					}
				},
			},
			"shengguozuzhou_yzs": {
				skills: ["shengguozuzhou_yzs_skill"],
				type: "equip",
				subtype: "equip2",
				filterTarget(card, player, target) {
					if (player == target) {
						return false;
					}
					return target.canEquip(card, true);
				},
				selectTarget: 1,
				modTarget: true,
				allowMultiple: false,
				toself: false,
				ai: {
					order: 9,
					equipValue(card, player) {
						if (get.position(card) == "e") {
							return -8;
						}
						return 1;
					},
					value(card, player) {
						if (player.getEquips(2).includes(card)) {
							return -10;
						}
						return 2.5;
					},
					basic: {
						equipValue: 5,
						order: (card, player) => {
							const equipValue = get.equipValue(card, player) / 20;
							return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
						},
						useful: 2,
						value: (card, player, index, method) => {
							if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) {
								return 0.01;
							}
							const info = get.info(card),
								current = player.getEquip(info.subtype),
								value = current && card != current && get.value(current, player);
							let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
							if (typeof equipValue == "function") {
								if (method == "raw") {
									return equipValue(card, player);
								}
								if (method == "raw2") {
									return equipValue(card, player) - value;
								}
								return Math.max(0.1, equipValue(card, player) - value);
							}
							if (typeof equipValue != "number") {
								equipValue = 0;
							}
							if (method == "raw") {
								return equipValue;
							}
							if (method == "raw2") {
								return equipValue - value;
							}
							return Math.max(0.1, equipValue - value);
						},
					},
					result: {
						keepAI: true,
						target(player, target) {
							var val = 2;
							var val2 = 0;
							var card = target.getEquip(2);
							if (card) {
								val2 = get.value(card, target);
								if (val2 < 0) {
									return 0;
								}
							}
							return -val - val2;
						},
					},
				},
				enable: true,
				content: function () {
					if (
						!card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) {
						target.equip(card);
					}
				},
				image: "ext:一中杀/image/card/shengguozuzhou_yzs.png",
				fullskin: true,
			},
			"fanersai_yzs": {
				image: "ext:一中杀/image/card/fanersai_yzs.png",
				fullskin: true,
				type: "trick",
				enable: true,
				singleCard: true,
				targetprompt: ["被借刀", "出杀目标"],
				complexSelect: true,
				complexTarget: true,
				multicheck() {
					var card = { name: "sha", isCard: true };
					var type = 1;
					const player = get.player()
					if (player.hasSkill("Versailles_yzs")) type = 3;
					return game.hasPlayer(function (current) {
						if (type == 3) {
							if (current.countCards("h") > 0) {
								return game.hasPlayer(function (current2) {
									return current.inRange(current2) && lib.filter.targetEnabled(card, current, current2);
								});
							}
						}
						if (current.getEquips(1).length > 0) {
							return game.hasPlayer(function (current2) {
								return current.inRange(current2) && lib.filter.targetEnabled(card, current, current2);
							});
						}
					});
				},
				filterTarget(card, player, target) {
					var card = { name: "sha", isCard: true };
					if (player.hasSkill("Versailles_yzs")) {
						return (
							player !== target &&
							target.countCards("h") > 0 &&
							game.hasPlayer(function (current) {
								return target !== current && target.inRange(current) && lib.filter.targetEnabled(card, target, current);
							})
						);
					}
					return (
						player !== target &&
						target.getEquips(1).length > 0 &&
						game.hasPlayer(function (current) {
							return target !== current && target.inRange(current) && lib.filter.targetEnabled(card, target, current);
						})
					);
				},
				filterAddedTarget(card, player, target, preTarget) {
					var card = { name: "sha", isCard: true };
					return target !== preTarget && preTarget.inRange(target) && lib.filter.targetEnabled(card, preTarget, target);
				},
				async content(event, trigger, player) {
					let result;
					if (event.directHit || !event.addedTarget || (!_status.connectMode && lib.config.skip_shan && !target.hasSha())) {
						event.directfalse = true;
					} else {
						result = await event.target
							.chooseToUse("对" + get.translation(event.addedTarget) + "使用一张杀，或令" + get.translation(player) + "获得你的武器牌", function (card, player) {
								if (get.name(card) !== "sha") {
									return false;
								}
								return lib.filter.filterCard.apply(this, arguments);
							})
							.set("targetRequired", true)
							.set("complexSelect", true)
							.set("complexTarget", true)
							.set("filterTarget", function (card, player, target) {
								if (target !== _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
									return false;
								}
								return lib.filter.filterTarget.apply(this, arguments);
							})
							.set("sourcex", event.addedTarget)
							.set("addCount", false)
							.forResult();
					}
					if (event.directfalse || result.bool === false) {
						var cards = event.target.getEquips(1);
						if (cards.length) {
							player.gain(cards, event.target, "give", "bySelf");
						}
					}
				},
				ai: {
					wuxie(target, card, player, viewer) {
						if (player === game.me && get.attitude(viewer, player._trueMe || player) > 0) {
							return 0;
						}
					},
					basic: {
						order: 8,
						value: 2,
						useful: 1,
					},
					result: {
						player: (player, target) => {
							if (player.hasSkill("Versailles_yzs")) return 2;
							if (!target.hasSkillTag("noe") && get.attitude(player, target) > 0) {
								return 0;
							}
							return (
								(player.hasSkillTag("noe") ? 0.32 : 0.15) *
								target.getEquips(1).reduce((num, i) => {
									return num + get.value(i, player);
								}, 0)
							);
						},
						target: (player, target, card) => {
							if (player.hasSkill("Versailles_yzs")) return -2;
							let targets = ui.selected.targets.slice();
							if (_status.event.preTarget) {
								targets.add(_status.event.preTarget);
							}
							if (targets.length) {
								let preTarget = targets.at(-1),
									pre = _status.event.getTempCache("jiedao_result", preTarget.playerid);
								if (pre && pre.target && pre.target.isIn() && pre.card === ai.getCacheKey(card, true)) {
									return target === pre.target ? pre.res : 0;
								}
								return (get.effect(target, { name: "sha" }, preTarget, target) / get.attitude(target, target)) * preTarget.mayHaveSha(player, "use", null, "odds");
							}
							let odds = target.mayHaveSha(player, "use", null, "odds"),
								addTar = null,
								sha = game
									.filterPlayer(cur => {
										return get.info({ name: "jiedao" }).filterAddedTarget(null, player, cur, target);
									})
									.reduce((num, current) => {
										let eff = get.effect(current, { name: "sha" }, target, player);
										if (eff < num) {
											return num;
										}
										addTar = current;
										return eff;
									}, -Infinity);
							if (addTar) {
								sha = get.effect(addTar, { name: "sha" }, target, target) / 10;
							}
							let res =
								target.getEquips(1).reduce((num, i) => {
									return num + get.value(i, target);
								}, 0) / (target.hasSkillTag("noe") ? -2 : -4);
							if (odds > 0.06 && sha > res) {
								res += (sha - res) * odds;
							}
							_status.event.putTempCache("jiedao_result", target.playerid, {
								target: addTar,
								card: ai.getCacheKey(card, true),
								res: res,
							});
							return res;
						},
					},
					tag: {
						gain: 1,
						use: 1,
						useSha: 1,
						loseCard: 1,
					},
				},
				selectTarget: 1,
			},
			"TF_yzs": {
				fullskin: true,
				type: "special",
				enable: false,
				image: "ext:一中杀/image/card/TF_yzs.png",
				ai: {
					basic: {
						order: 7,
						useful: 1,
						value: 1,
					},
				},
			},
			"mengliaoshibian_yzs": {
				fullskin: true,
				type: "trick",
				cardcolor: "red",
				enable: true,
				modTarget: true,
				toself: true,
				forceDie: true,
				recastable: true,
				ai: {
					wuxie(target, card, player, viewer) {
						if (get.mode() === "guozhan") {
							if (!_status._aozhan) {
								if (!player.isMajor()) {
									if (!viewer.isMajor()) {
										return 0;
									}
								}
							}
						}
						if (target.countCards("h") * Math.max(target.hp, 5) > 6) {
							return 0;
						}
					},
					basic: {
						order: 0.1,
						useful: 2,
						value(card, player) {
							if (player.hp > 2) {
								return 1.7;
							}
							return 9.2 - 0.7 * Math.min(3, player.countCards("hs"));
						},
					},
					result: {
						target: 2,
					},
					tag: {
						draw: 2,
					},
				},
				image: "ext:一中杀/image/card/mengliaoshibian_yzs.png",
				selectTarget: -1,
				filterTarget: (card, player, target) => player == target,
				allowMultiple: false,
				async content(event, trigger, player) {
					if (_status.mengliaoshibian_yzs) {
						player.$fullscreenpop("<font color=green>梦疗事变</font>");
						game.broadcastAll(() => {
							_status.mengliaoshibian_yzs = 3;
						});
						return;
					}
					player.$fullscreenpop("<font color=green>梦疗事变</font>");
					await game.broadcastAll(
						(player) => {
							_status.mengliaoshibian_yzs = 3;
							const node = ui.create.div(".background.upper.mengliaoshibian_yzs");
							node.destroy = () => {
								node.classList.add("hidden");
								setTimeout(() => node.remove(), 3000);
								if (ui.mengliaoshibian_yzs == node) {
									ui.mengliaoshibian_yzs = null;
								}
							};
							if (ui.mengliaoshibian_yzs) {
								document.body.insertBefore(node, ui.mengliaoshibian_yzs);
								ui.mengliaoshibian_yzs.destroy();
							} else {
								node.classList.add("hidden");
								document.body.insertBefore(node, ui.window);
								ui.refresh(node);
								node.classList.remove("hidden");
							}
							ui.mengliaoshibian_yzs = node;
							if (player) {
								node.player = player;
							}
							lib.setPopped(
								(node.system = ui.create.system("梦疗事变", null, true, true)),
								() => {
									const uiIntro = ui.create.dialog("hidden");
									uiIntro.addText("梦疗事变").style.margin = "0";
									uiIntro._place_text = uiIntro.add(ui.create.div(".text", `接下来被使用的` + _status.mengliaoshibian_yzs + `张非转化且非虚拟的有目标的即时牌将被无效`));
									uiIntro.add(ui.create.div(".placeholder.slim"));
									return uiIntro;
								},
								200
							);
						},
						player
					);
				},
			},
			"fanlizhimeng_yzs": {
				fullskin: true,
				type: "delay",
				cardcolor: "red",
				enable: true,
				modTarget: true,
				toself: true,
				forceDie: true,
				ai: {
					wuxie(target, card, player, viewer) {
						if (get.mode() === "guozhan") {
							if (!_status._aozhan) {
								if (!player.isMajor()) {
									if (!viewer.isMajor()) {
										return 0;
									}
								}
							}
						}
						if (target.countCards("h") * Math.max(target.hp, 5) > 6) {
							return 0;
						}
					},
					basic: {
						order: 7,
						useful: 4.5,
						value(card, player) {
							if (player.hp > 2) {
								return 9.2;
							}
							return 9.2 - 0.7 * Math.min(3, player.countCards("hs"));
						},
					},
					result: {
						target(player, target) {
							if (!target.getEquip(2) || !target.getEquip(2).length) return 3;
							let es = target.getEquip(2);
							if (es.some(c => c.name == "fanlizhimeng_yzs_equip")) return -2;
						}
					},
					tag: {
						draw: 2,
					},
				},
				image: "ext:一中杀/image/card/fanlizhimeng_yzs.png",
				selectTarget: -1,
				filterTarget: (card, player, target) => player == target && target.canEquip("fanlizhimeng_yzs_equip", true),
				allowMultiple: false,
				async content(event, trigger, player) {
					let name = "fanlizhimeng_yzs_equip";
					let card = get.autoViewAs({
						name
					}, event.cards)
					if (
						!event.card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) await event.target.equip(card);
					let cards = event.target.getCards("h");
					let num = cards.length;
					let next = event.target.addToExpansion(cards, event.target, "giveAuto")
					next.gaintag.add("fanlizhimeng_yzs_equip_skill")
					next.untrigger = true;
					await next
					await event.target.draw(num);
					if (player != _status.currentPhase) {
						await player.useSkill("fanlizhimeng_yzs_equip_skill_Afterchange")
					}
					if (event.target.hp > 1) await event.target.loseHp();
				},
			},
			"fanlizhimeng_yzs_equip": {
				fullskin: true,
				type: "equip",
				subtype: "equip2",
				cardcolor: "red",
				enable: false,
				modTarget: true,
				toself: true,
				skills: ["fanlizhimeng_yzs_equip_skill"],
				forceDie: true,
				onEquip: function () {
					player.markSkill("fanlizhimeng_yzs_equip_skill");
				},
				onLose: async function (event) {
					let player = get.player();
					if (!player.getVCards("e", i => i.name == "fanlizhimeng_yzs_equip").length) {
						player.unmarkSkill("fanlizhimeng_yzs_equip_skill");
					} else {
						player.markSkill("fanlizhimeng_yzs_equip_skill");
					}
					if (_status.currentPhase?.isIn() && _status.currentPhase == player) {
						await player.discard(player.getExpansions("fanlizhimeng_yzs_equip_skill"))
					} else {
						let cards = player.getExpansions("fanlizhimeng_yzs_equip_skill");
						let handcards = player.getCards("h");
						await player.discard(handcards)
						if (cards && cards.length) {
							player.directgain(cards, "draw");
							player.removeGaintag("fanlizhimeng_yzs_equip_skill", cards);
						}
					}
					player.popup("藩篱之梦");
				},
				image: "ext:一中杀/image/card/fanlizhimeng_yzs.png",
			},
			"qianmianpianshu_yzs": {
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: 1,
				allowMultiple: false,
				usable: 1,
				recastable: true,
				image: "ext:一中杀/image/card/qianmianpianshu_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					const bannedCards = ["fanlizhimeng_yzs", "fanlizhimeng_yzs_equip", "jiufuxinxing_yzs_equip1", "jiufuxinxing_yzs_equip2", "jiufuxinxing_yzs"]
					await event.target.gain(event.cards, "gain2");
					game.log(player, "和", event.target, "交换了武器和防具");
					let cards = [[], []];
					if (player.getEquip(1) && !bannedCards.includes(get.name(player.getEquip(1)))) cards[0].push(player.getEquip(1));
					if (player.getEquip(2) && !bannedCards.includes(get.name(player.getEquip(2)))) cards[0].push(player.getEquip(2));
					if (event.target.getEquip(1) && !bannedCards.includes(get.name(event.target.getEquip(1)))) cards[1].push(event.target.getEquip(1));
					if (event.target.getEquip(2) && !bannedCards.includes(get.name(event.target.getEquip(2)))) cards[1].push(event.target.getEquip(2));
					await game.loseAsync({
						player: player,
						target: event.target,
						cards1: cards[0],
						cards2: cards[1],
					}).setContent("swapHandcardsx");
					for (const card of cards[1]) {
						const vcard = card[card.cardSymbol];
						if (vcard.cards?.length && vcard.cards.some((i) => get.position(i, true) !== "o")) {
							continue;
						}
						await player.equip(vcard);
					}
					for (const card of cards[0]) {
						const vcard = card[card.cardSymbol];
						if (vcard.cards?.length && vcard.cards.some((i) => get.position(i, true) !== "o")) {
							continue;
						}
						await event.target.equip(vcard);
					}
				},
				ai: {
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
							let te = target.getEquip(1) ? 1 : 0 + target.getEquip(2) ? 1 : 0;
							let pe = player.getEquip(1) ? 1 : 0 + player.getEquip(2) ? 1 : 0
							return pe - te;
						},
						player(player, target) {
							let te = target.getEquip(1) ? 1 : 0 + target.getEquip(2) ? 1 : 0
							let pe = player.getEquip(1) ? 1 : 0 + player.getEquip(2) ? 1 : 0
							return te - pe;
						}
					},
					tag: {
						loseCard: 1,
						discard: 1,
					},
				},
			},
			"shuangzishuidai_yzs": {
				fullskin: true,
				type: "trick",
				cardcolor: "red",
				modTarget: true,
				toself: true,
				enable(event, player) {
					return true;
				},
				savable(card, player, dying) {
					return dying == player;
				},
				ai: {
					basic: {
						order: 7,
						useful: 4.5,
						value(card, player) {
							if (player.hp > 2) {
								return 9.2;
							}
							return 9.2 - 0.7 * Math.min(3, player.countCards("hs"));
						},
					},
					result: {
						target(player, target) {
							if (target === _status.currentPhase && target.skipList.includes("phaseUse")) {
								let evt = _status.event.getParent("phase");
								if (evt && evt.phaseList.indexOf("phaseJudge") <= evt.num) {
									return 8;
								}
							}
							let num = target.needsToDiscard(3),
								cf = Math.pow(get.threaten(target, player) + 0.6, 2);
							if (!num) {
								return -0.01 * cf + 8;
							}
							if (target.hp > 2) {
								num--;
							}
							let dist = Math.sqrt(1 + get.distance(player, target, "absolute"));
							if (dist < 1) {
								dist = 1;
							}
							if (target.isTurnedOver()) {
								dist++;
							}
							return (Math.min(-0.1, -num) * cf) / dist + 8;
						}
					},
					tag: {
						save: 2,
						recover: 0.5,
						draw: 3,
						skip: ["phaseUse", "phaseDraw", "phaseDiscard"],
					},
				},
				image: "ext:一中杀/image/card/shuangzishuidai_yzs.png",
				selectTarget: -1,
				filterTarget: (card, player, target) => player == target,
				allowMultiple: false,
				async content(event, trigger, player) {
					if (!event.card.cards || !event.cards.length || event.cards.some(c => get.name(c) != "shuangzishuidai_yzs")) {
						await event.target.recover();
						return;
					}
					let evt = event.getParent("phaseUse");
					if (event.target.isDying() || event.getParent(2).type == "dying" || !evt || evt.player != player) {
						if ((!evt || evt.player != player) && typeof player.getStat().card.shuangzishuidai_yzs == "number") {
							player.getStat().card.shuangzishuidai_yzs--;
						}
						let result = await event.target.chooseButton([
							"请选择一项",
							[
								[
									["one", "恢复1点体力并摸3张牌"],
									["two", "恢复2点体力并摸1张牌"],
									["three", "恢复体力值至2，摸牌至手牌数为4"],
								],
								"textbutton",
							],
						])
							.set("forced", true)
							.set("selectButton", 1)
							.set("filterButton", function (button) {
								return true
							})
							.set("ai", () => {
								return get.event().choice;
							})
							.set(
								"choice",
								(() => {
									const player = get.event().player
									if (player.hp <= 1 && player.countCards("h") < 3) return "three";
									if (player.getDamagedHp(true) <= 1) return "one";
									return "two"
								})()
							)
							.forResult();
						if (!result.bool) return
						if (result.links[0] == "one") {
							await event.target.recover(1);
							await event.target.draw(3);
						}
						if (result.links[0] == "two") {
							await event.target.recover(2);
							await event.target.draw(1);
						}
						if (result.links[0] == "three") {
							if (event.target.hp < 2) await event.target.recover(2 - event.target.hp);
							if (event.target.countCards("h") < 4) await event.target.draw(4 - event.target.countCards("h"))
						}
						event.target.addSkill("shuangzishuidai_yzs_skill");
						return;
					}
					else {
						event.target.addMark("shuangzishuidai_yzs_delay", false);
					}
				},
			},
			"jiufuxinxing_yzs": {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				distance: {
					attackFrom: -1,
				},
				cardcolor: "red",
				enable: true,
				modTarget: true,
				toself: true,
				forceDie: true,
				image: "ext:一中杀/image/card/jiufuxinxing_yzs.png",
				selectTarget: -1,
				filterTarget: (card, player, target) => player == target && (target.canEquip("jiufuxinxing_yzs_equip1", true) || target.canEquip("jiufuxinxing_yzs_equip2", true)),
				allowMultiple: false,
				async content(event, trigger, player) {
					let xinxings = ["jiufuxinxing_yzs_equip1", "jiufuxinxing_yzs_equip2"]
					let list = [];
					for (let name of xinxings) {
						const type = name == "jiufuxinxing_yzs_equip1" ? "武器" : "防具"
						list.push([type, "", name])
					}
					let result = await player.chooseButton(["武器 或 防具", [list, "vcard"]])
						.set("forced", true)
						.set("filterButton", (button, player) => {
							return player.canEquip(button, true)
						})
						.forResult();
					if (!result.bool) return
					let name = result.links[0][2];
					let card = get.autoViewAs({
						name: name
					}, event.cards)
					if (
						!event.card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) await event.target.equip(card);
					if (name == "jiufuxinxing_yzs_equip1") await event.target.loseHp();
					if (name == "jiufuxinxing_yzs_equip2") await event.target.recover();
				},
			},
			"jiufuxinxing_yzs_equip1": {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				distance: {
					attackFrom: -1,
				},
				loseDelay: false,
				skills: ["jiufuxinxing_yzs_equip1_skill"],
				onLose: async function (event) {
					let player = get.player();
					player.popup("救祓新星");
					await player.recover();
				},
				image: "ext:一中杀/image/card/jiufuxinxing_yzs.png",
			},
			"jiufuxinxing_yzs_equip2": {
				fullskin: true,
				type: "equip",
				subtype: "equip2",
				loseDelay: false,
				skills: ["jiufuxinxing_yzs_equip2_skill"],
				onLose: async function (event) {
					let player = get.player();
					player.popup("救祓新星");
					await player.loseHp();
				},
				image: "ext:一中杀/image/card/jiufuxinxing_yzs.png",
			},
			"weikeduofadian_yzs": {
				fullskin: true,
				distance: {
					attackFrom: -3,
				},
				type: "equip",
				subtype: "equip1",
				cardcolor: "red",
				enable: true,
				modTarget: true,
				toself: true,
				skills: ["weikeduofadian_yzs_skill"],
				forceDie: true,
				onEquip: function () {
					player.markSkill("weikeduofadian_yzs_skill");
				},
				onLose: function () {
					player.unmarkSkill("weikeduofadian_yzs_skill");
				},
				ai: {
					basic: {
						equipValue: 3,
						order: (card, player) => {
							const equipValue = get.equipValue(card, player) / 20;
							return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
						},
						useful: 2,
						value: (card, player, index, method) => {
							if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
							const info = get.info(card),
								current = player.getEquip(info.subtype),
								value = (current && card != current && get.value(current, player));
							let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
							if (typeof equipValue == "function") {
								if (method == "raw") return equipValue(card, player);
								if (method == "raw2") return equipValue(card, player) - value;
								return Math.max(0.1, equipValue(card, player) - value);
							}
							if (typeof equipValue != "number") equipValue = 0;
							if (method == "raw") return equipValue;
							if (method == "raw2") return equipValue - value;
							return Math.max(0.1, equipValue - value);
						},
					},
					result: {
						target: (player, target, card) => get.equipResult(player, target, card),
					},
				},
				image: "ext:一中杀/image/card/weikeduofadian_yzs.png",
				selectTarget: -1,
				filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
				allowMultiple: false,
				content: function () {
					if (
						!card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) {
						target.equip(card);
					}
				},
			},
			"guowangmiling_yzs": {
				fullskin: true,
				type: "delay",
				image: "ext:一中杀/image/card/guowangmiling_yzs.png",
				filterTarget(card, player, target) {
					if (!card.cards || !card.cards.length) return player == target;
					return lib.filter.judge(card, player, target);
				},
				allowMultiple: false,
				async effect(event, trigger, player) {
					await player.gain(event.cards, "draw");
				},
				async cancel(event, trigger, player) {
					let cards = event.cards;
					let extra = [];
					for (let card of event.cards) {
						if (card.storage?.guowangmiling_yzs?.length) {
							extra.addArray(card.storage.guowangmiling_yzs)
							game.broadcast(
								(card) => {
									card.storage.guowangmiling_yzs = [];
								},
								card
							);
						}
					}
					if (extra.length) {
						cards.addArray(extra);
						game.log("【国王密令】掉落了", extra)
					}
					await game.cardsDiscard(cards);
				},
				async content(event, trigger, player) {
					let card = event.card;
					let target = event.target;
					if (target == player) {
						player.addTempSkill("guowangmiling_yzs_buff");
						return;
					}
					if (
						!card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) {
						if (player.countCards("h")) {
							let result = await player.chooseCard("h", 1, false)
								.set("prompt", "国王密令")
								.set("prompt2", "你可将1张手牌叠置于此牌下")
								.set("ai", (card) => {
									const player = get.player();
									const target = get.event().target
									return get.value(card, target) - get.value(card, player);
								})
								.set("target", target)
								.forResult();
							if (result.bool) {
								await player.lose(result.cards, ui.special);
								event.cards[0].storage.guowangmiling_yzs = result.cards;
								game.broadcast(
									(card, cards) => {
										card.storage.guowangmiling_yzs = cards;
									},
									event.cards[0],
									event.cards[0].storage.guowangmiling_yzs
								);
								await game.delayx();
							}
						}
						await target.addJudge(card, event.cards);
					}
				},
				ai: {
					basic: {
						order: 1,
						useful(card, i) {
							return 1.3;
						},
						value: 5,
					},
					result: {
						ignoreStatus: true,
						target: (player, target) => {
							if (target == player) {
								if (player.hasSha() && player.getCardUsable("sha") < 1) return 3;
								return -1;
							} else {
								return 2;
							}
						}
					},
				},
			},
			"youyanbujin_yzs": {
				fullskin: true,
				type: "delay",
				image: "ext:一中杀/image/card/youyanbujin_yzs.png",
				modTarget(card, player, target) {
					return lib.filter.judge(card, player, target);
				},
				enable(card, player) {
					return player.canAddJudge(card);
				},
				filterTarget(card, player, target) {
					return lib.filter.judge(card, player, target) && player === target;
				},
				noEffect_yzs: true,
				effect() { },
				selectTarget: [-1, -1],
				toself: true,
				allowMultiple: false,
				async content(event, trigger, player) {
					let card = event.card;
					let target = event.target;
					if (
						!card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) {
						target.addJudge(card, event.cards);
					}
				},
				ai: {
					wuxie(target, card, player, viewer) {
						if (get.mode() === "guozhan") {
							if (!_status._aozhan) {
								if (!player.isMajor()) {
									if (!viewer.isMajor()) {
										return 0;
									}
								}
							}
						}
						if (target.countCards("h") * Math.max(target.hp, 5) > 6) {
							return 0;
						}
					},
					basic: {
						order: 7,
						useful: 4.5,
						value(card, player) {
							return 3.2 + 0.7 * Math.min(3, player.countCards("hs"));
						},
					},
					result: {
						target: 2,
					},
					tag: {
						draw: 0.7,
					},
				},
			},
			"xianzheyuyan_yzs": {
				fullskin: true,
				type: "delay",
				image: "ext:一中杀/image/card/xianzheyuyan_yzs.png",
				filterTarget(card, player, target) {
					return lib.filter.judge(card, player, target);
				},
				noEffect_yzs: true,
				effect() { },
				allowMultiple: false,
				async content(event, trigger, player) {
					let card = event.card;
					let target = event.target;
					if (
						!card?.cards.some(card => {
							return get.position(card, true) !== "o";
						})
					) {
						target.addJudge(card, event.cards);
					}
				},
				ai: {
					wuxie(target, card, player, viewer) {
						if (get.mode() === "guozhan") {
							if (!_status._aozhan) {
								if (!player.isMajor()) {
									if (!viewer.isMajor()) {
										return 0;
									}
								}
							}
						}
						if (target.countCards("h") * Math.max(target.hp, 5) > 6) {
							return 0;
						}
					},
					basic: {
						order: 7,
						useful: 4.5,
						value(card, player) {
							if (player.hp > 2) {
								return 9.2;
							}
							return 9.2 - 0.7 * Math.min(3, player.countCards("hs"));
						},
					},
					result: {
						target: 2,
					},
					tag: {
						recover: 0.7,
						draw: 1.4,
					},
				},
			},
			"SymmetricalSpear_yzs": {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				distance: {
					attackFrom: -2,
				},
				loseDelay: false,
				skills: ["SymmetricalSpear_yzs_skill"],
				image: "ext:一中杀/image/card/SymmetricalSpear_yzs.png",
			},
			"treasure_yzs_red": {
				fullskin: true,
				image: "ext:一中杀/image/card/treasure_yzs_red.png",
				type: "special",
				cardcolor: "red",
				toself: true,
				enable(card, player) {
					return true;
				},
				savable(card, player, dying) {
					return dying == player;
				},
				selectTarget: -1,
				filterTarget(card, player, target) {
					return target === player
				},
				modTarget(card, player, target) {
					return true
				},
				async content(event, trigger, player) {
					await event.target.chooseDrawRecover(2, true);
				},
				tag: {
					recover: 1,
					save: 1,
					draw: 2,
				},
			},
			"treasure_yzs_black": {
				fullskin: true,
				image: "ext:一中杀/image/card/treasure_yzs_black.png",
				type: "special",
				cardcolor: "red",
				usable: 5,
				updateUsable: "phaseUse",
				enable(card, player) {
					return true;
				},
				selectTarget: 1,
				cardPrompt(card) {
					return "出牌阶段限5次，对1名其他角色使用。弃置其2张牌,或视为对其使用无视防具的普通【杀】";
				},
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true;
				},
				modTarget(card, player, target) {
					return player !== target;
				},
				async content(event, trigger, player) {
					let num = Math.min(event.target.countDiscardableCards(player, "hej"), 2);
					if (num == 0) {
						if (player.canUse({ name: "sha", isCard: false }, event.target, false)) {
							await player.useCard({ name: "sha", isCard: false }, event.target, false);
						}
						return;
					}
					let forced = !player.canUse({ name: "sha", isCard: false }, event.target, false);
					const result = await player.discardPlayerCard("弃置其2张牌,或视为对其使用无视防具的普通【杀】", event.target, 1, "hej", forced).forResult();
					if (!result.bool) {
						if (player.canUse({ name: "sha", isCard: false }, event.target, false)) {
							let next = player.useCard({ name: "sha", isCard: false }, event.target, false);
							event.target.addTempSkill("qinggang2");
							event.target.storage.qinggang2.add(event.card);
							event.target.markSkill("qinggang2");
							await next;
						}
					} else {
						num--;
						if (num > 0) {
							await player.discardPlayerCard(event.target, 1, "hej", true).forResult();
						}
					}
				},
				tag: {
					respond: 1,
					respondShan: 1,
					damage(card) {
						return 1;
					},
					loseCard: 2,
					discard: 2,
				},
			},
			"caisedebai_yzs": {
				type: "Mystic",
				suit: "spade",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/caisedebai_yzs.png",
			},
			"dengliangdeguang_yzs": {
				type: "Mystic",
				suit: "heart",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/dengliangdeguang_yzs.png",
			},
			jingduke_yzs: {
				type: "Mystic",
				suit: "spade",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/jingduke_yzs.png",
			},
			yudenghuozhong_yzs: {
				type: "Mystic",
				suit: "heart",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/yudenghuozhong_yzs.png",
			},
			longzhijian_yzs: {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				distance: {
					attackFrom: -3,
				},
				loseDelay: false,
				skills: ["longzhijian_yzs_skill"],
				image: "ext:一中杀/image/card/longzhijian_yzs.png",
			},
			jianshu_yzs: {
				image: "extension/一中杀/image/jianSheng_yzs.png",
				type: "jiahu_yzs",
				fullimage: true,
			},
			jilei_yzs: {
				image: "extension/一中杀/image/jianSheng_yzs.png",
				type: "jiahu_yzs",
				fullimage: true,
			},
			wenzhong_yzs: {
				image: "extension/一中杀/image/jianSheng_yzs.png",
				type: "jiahu_yzs",
				fullimage: true,
			},
			businiao_yzs: {
				image: "extension/一中杀/image/jianSheng_yzs.png",
				type: "jiahu_yzs",
				fullimage: true,
			},
			zhuofu_yzs_heart: {
				image: "image/card/lukai_heart.png",
				type: "zhuofu_yzs_fuka",
				fullskin: true,
			},
			zhuofu_yzs_spade: {
				image: "image/card/lukai_spade.png",
				type: "zhuofu_yzs_fuka",
				fullskin: true,
			},
			zhuofu_yzs_club: {
				image: "image/card/lukai_club.png",
				type: "zhuofu_yzs_fuka",
				fullskin: true,
			},
			zhuofu_yzs_diamond: {
				image: "image/card/lukai_diamond.png",
				type: "zhuofu_yzs_fuka",
				fullskin: true,
			},
			rg_baonveCard: {
				fullskin: true,
				image: "extension/一中杀/image/card/rg_baonveCard.png",
				type: "rg_baonve",
			},
			rg_zhanshuCard: {
				fullskin: true,
				image: "extension/一中杀/image/card/rg_zhanshuCard.png",
				type: "rg_zhanshu",
			},
			rg_shengcunCard: {
				fullskin: true,
				image: "extension/一中杀/image/card/rg_shengcunCard.png",
				type: "rg_shengcun",
			},
			IronFist_yzs: {
				fullskin: true,
				type: "equip",
				subtype: "equip1",
				loseDelay: false,
				skills: ["IronFist_yzs_skill"],
				image: "ext:一中杀/image/card/IronFist_yzs.png",
			},
			SteelArmor_yzs: {
				fullskin: true,
				type: "equip",
				subtype: "equip2",
				loseDelay: false,
				skills: ["SteelArmor_yzs_skill"],
				image: "ext:一中杀/image/card/SteelArmor_yzs.png",
			},
			guanxing_yzs: {
				image: "extension/一中杀/image/Rafau_yzs.png",
				type: "skill",
				fullimage: true,
			},
			lingleidegu_yzs: {
				type: "Mystic",
				suit: "spade",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/lingleidegu_yzs.png",
			},
			duyidexiang_yzs: {
				type: "Mystic",
				suit: "heart",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/duyidexiang_yzs.png",
			},
			tishuyinyong_yzs: {
				type: "Mystic",
				suit: "spade",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/tishuyinyong_yzs.png",
			},
			gufaguanxing_yzs: {
				type: "Mystic",
				suit: "heart",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/gufaguanxing_yzs.png",
			},
			Saturn_yzs: {
				type: "planet_yzs",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/Saturn_yzs.png",
			},
			Mars_yzs: {
				type: "planet_yzs",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/Mars_yzs.png",
			},
			FullMoon_yzs: {
				type: "planet_yzs",
				destroy: true,
				fullimage: true,
				image: "ext:一中杀/image/card/FullMoon_yzs.png",
			},
			wtwCang_yzs: {
				audio: "ext:一中杀/audio/card",
				fullskin: true,
				image: "ext:一中杀/image/card/wtwCang_yzs.png",
				type: "trick",
				cardcolor: "black",
				enable(card, player) {
					return player.hasSkill("wuxiaxianshushi_yzs");
				},
				selectTarget: 1,
				postAi(targets) {
					return targets.length === 1;
				},
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (typeof get.number(event.card) == "number") event.baseDamage += get.number(event.card) - 1;
					await player.draw(event.baseDamage);
					await event.target.damage(1);
				},
				ai: {
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
				}
			},
			wtwHe_yzs: {
				audio: "ext:一中杀/audio/card",
				fullskin: true,
				image: "ext:一中杀/image/card/wtwHe_yzs.png",
				type: "trick",
				cardcolor: "red",
				enable(card, player) {
					return player.hasSkill("wuxiaxianshushi_yzs");
				},
				selectTarget: 1,
				postAi(targets) {
					return targets.length === 1 && targets[0].countCards("j");
				},
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (typeof get.number(event.card) == "number") event.baseDamage += get.number(event.card) - 1;
					let pos = "he";
					let vis = undefined;
					if (event.target.countDiscardableCards(player, pos)) {
						await player.discardPlayerCard(pos, event.target, event.baseDamage, true, vis).set("target", event.target).set("complexSelect", false).set("ai", lib.card.guohe.ai.button);
					}
					await event.target.damage(1);
				},
				ai: {
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
				}
			},
			yuquan_yzs: {
				shizhongyingfashu_yzs: `目标牌选取牌时目标明牌`,
				shizhongyingfashu_yzs_cost: 1,
				shizhongyingfashu_yzs_effect(player, name) {
					player.markAuto("yuquan_yzs", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 2;
					return 1;
				},
				allowMultiple: true,
				usable: 2,
				image: "ext:一中杀/image/card/yuquan_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return target.countCards("h");
				},
				async content(event, trigger, player) {
					let args = [event.target, 1, `观看目标角色1张手牌`]
					if (player.storage.yuquan_yzs?.includes(get.name(event.card))) args.push("visible");
					let result = await player.choosePlayerCard(...args).forResult();
					if (!player.storage.yuquan_yzs || !player.storage.yuquan_yzs.includes(get.name(event.card))) {
						if (result?.cards?.length) await player.chooseButton([result.cards], [0, 1]);
					}
				},
			},
			ye_yzs: {
				shizhongyingfashu_yzs: `目标牌造成伤害变为雷电伤害`,
				shizhongyingfashu_yzs_cost: 2,
				shizhongyingfashu_yzs_effect(player, name) {
					player.markAuto("ye_yzs", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 2;
					return 1;
				},
				allowMultiple: true,
				usable: 1,
				image: "ext:一中杀/image/card/ye_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return target.countCards("h");
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (player.storage?.guanniu_yzs?.includes(get.name(event.card))) event.baseDamage++;

					let args = [event.target, 1, `展示目标角色1张手牌`]
					if (player.storage.yuquan_yzs?.includes(get.name(event.card))) args.push("visible");
					let result = await player.choosePlayerCard(...args).forResult();
					if (!result || !result.cards || !result.cards.length) return;
					let cards = result.cards;
					event.cards2 = cards;
					let target = event.target;
					const showEvent = target.showCards(cards, `${get.translation(target)}因【火攻】展示的牌`).set("closeDialog", false);
					await showEvent;
					const videoId = showEvent.videoId;
					event.videoId = videoId;
					//返回玩家弃牌/其他操作的结果，给出默认逻辑
					event.chooseToDiscard ??= async (event, player, target) => {
						const { discardPostion = "h", cards2, filterDiscard = { suit: get.suit(cards2[0]) } } = event;
						const result = await player
							.chooseToDiscard(discardPostion, filterDiscard)
							.set("ai", card => {
								const evt = _status.event.getParent();
								if (get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0) {
									return 6.2 + Math.min(4, evt.player.hp) - get.value(card, evt.player);
								}
								return -1;
							})
							.set("prompt", false)
							.forResult();
						return result;
					}
					const result2 = await event.chooseToDiscard(event, player, target);
					event.discardResult = result2;
					if (result2?.bool) {
						await target.damage("thunder");
					}
					game.addVideo("cardDialog", null, videoId);
					game.broadcastAll("closeDialog", videoId);
				},
			},
			dashe_yzs: {
				shizhongyingfashu_yzs: `目标牌目标数+1`,
				shizhongyingfashu_yzs_cost: 3,
				shizhongyingfashu_yzs_effect(player, name) {
					player.markAuto("dashe_yzs", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 3;
					return 2;
				},
				allowMultiple: true,
				usable: 1,
				image: "ext:一中杀/image/card/dashe_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return target.countCards("h");
				},
				async content(event, trigger, player) {
					let pos = "he";
					let vis = player.storage.yuquan_yzs?.includes(get.name(event.card)) ? "visible" : undefined;
					if (event.target.countDiscardableCards(player, pos)) {
						await player.discardPlayerCard(pos, event.target, 1, true, vis).set("target", event.target).set("complexSelect", false).set("ai", lib.card.guohe.ai.button);
					}
				},
			},
			hama_yzs: {
				shizhongyingfashu_yzs: `对手牌数＞你的角色使用目标牌无次数限制`,
				shizhongyingfashu_yzs_cost: 2,
				shizhongyingfashu_yzs_effect(player, name) {
					player.addSkill("hama_yzs_buff")
					player.markAuto("hama_yzs_buff", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 2;
					return 1;
				},
				allowMultiple: true,
				usable: 1,
				image: "ext:一中杀/image/card/hama_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (player.storage?.guanniu_yzs?.includes(get.name(event.card))) event.baseDamage++;
					let target = event.target;
					await target.gain(event.cards, "gain2");
					let vis = player.storage.yuquan_yzs?.includes(get.name(event.card)) ? "visible" : undefined;
					if (target.countGainableCards(player, "he")) {
						await player.gainPlayerCard("he", target, true, vis).set("target", target).set("complexSelect", false).set("ai", lib.card.shunshou.ai.button);
					}
					let nature = player.storage.ye_yzs?.includes(get.name(event.card)) ? "thunder" : undefined;
					if (target.countCards("h") > player.countCards("h")) await target.damage(nature)
				},
			},
			manxiang_yzs: {
				shizhongyingfashu_yzs: `目标牌的消耗-1`,
				shizhongyingfashu_yzs_cost: 3,
				shizhongyingfashu_yzs_effect(player, name) {
					player.markAuto("manxiang_yzs", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 2;
					return 1;
				},
				allowMultiple: true,
				usable: 1,
				image: "ext:一中杀/image/card/manxiang_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (player.storage?.guanniu_yzs?.includes(get.name(event.card))) event.baseDamage++;
					if (typeof event.shanRequired !== "number" || !event.shanRequired || event.shanRequired < 0) {
						event.shanRequired = 2;
					}
					const target = event.target;
					while (event.shanRequired > 0) {
						let result = { bool: false };
						if (!event.directHit) {
							const next = target.chooseToRespond();
							next.set("filterCard", function (card, player) {
								if (get.name(card) !== "sha") {
									return false;
								}
								return lib.filter.cardRespondable(card, player);
							});
							if (event.shanRequired > 1) {
								next.set("prompt2", "共需打出" + event.shanRequired + "张【杀】");
							}
							next.set("ai", function (card) {
								if (get.event().toRespond) {
									return get.order(card);
								}
								return -1;
							});
							next.set(
								"toRespond",
								(() => {
									if (target.hasSkillTag("noSha", null, "respond")) {
										return false;
									}
									if (target.hasSkillTag("useSha", null, "respond")) {
										return true;
									}
									if (event.baseDamage <= 0 || player.hasSkillTag("notricksource", null, event) || target.hasSkillTag("notrick", null, event)) {
										return false;
									}
									if (event.baseDamage >= target.hp + (player.hasSkillTag("jueqing", false, target) || target.hasSkill("gangzhi") ? 0 : target.hujia)) {
										return true;
									}
									const damage = get.damageEffect(target, player, target);
									if (damage >= 0) {
										return false;
									}
									if (
										event.shanRequired > 1 &&
										!target.hasSkillTag("freeSha", null, {
											player: player,
											card: event.card,
											type: "respond",
										}) &&
										event.shanRequired > target.mayHaveShan(target, "respond", null, "count")
									) {
										return false;
									}
									return true;
								})()
							);
							next.set("respondTo", [player, event.card]);
							next.autochoose = lib.filter.autoRespondShan;
							result = await next.forResult();
						}
						if (!result?.bool) {
							let nature = player.storage.ye_yzs?.includes(get.name(event.card)) ? "thunder" : undefined;
							await target.damage(nature);
							break;
						} else {
							event.shanRequired--;
						}
					}
				},
			},
			tuotu_yzs: {
				shizhongyingfashu_yzs: `使用目标牌后目标角色需弃置1张手牌`,
				shizhongyingfashu_yzs_cost: 2,
				shizhongyingfashu_yzs_effect(player, name) {
					player.addSkill("tuotu_yzs_buff")
					player.markAuto("tuotu_yzs_buff", name)
				},
				usable: 1,
				fullskin: true,
				type: "trick",
				wuxieable: true,
		//		global:"tuotu_yzs_skill",
				notarget: true,
				image: "ext:一中杀/image/card/tuotu_yzs.png",
				async content(event, trigger, player) {
					let evt = event.getParent(3)._trigger;
					evt = evt.getParent();
					if (evt.name != "useCard") return;
					const target = evt.player;
					const card = evt.card;
					await target.gain(event.cards, "gain2");
					let pos = "he";
					let vis = player.storage.yuquan_yzs?.includes(get.name(event.card)) ? "visible" : undefined;
					let result = target.countDiscardableCards(player, pos) ? await player.discardPlayerCard(pos, target, 1, true, vis)
						.set("target", target).set("complexSelect", false)
						.set("ai", lib.card.guohe.ai.button)
						.forResult() : { bool: false };
					if (result?.bool && result.cards?.length) {
						if (get.suit(result.cards[0]) == get.suit(card)) evt.excluded.add(player)
					}
				},
				ai: {
					basic: {
						useful: [6, 4],
						value: [6, 4],
					},
					result: {
						player: 1,
					},
				},
			},
			guanniu_yzs: {
				shizhongyingfashu_yzs: `目标牌造成的伤害+1`,
				shizhongyingfashu_yzs_cost: 3,
				shizhongyingfashu_yzs_effect(player, name) {
					player.markAuto("manxiang_yzs", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 2;
					return 1;
				},
				allowMultiple: true,
				usable: 1,
				image: "ext:一中杀/image/card/guanniu_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (player.storage?.guanniu_yzs?.includes(get.name(event.card))) event.baseDamage++;

					let cards = [];
					let pos = "h"

					let result1 = player.countDiscardableCards(player, pos) ? await player.chooseToDiscard(pos, 1, true).forResult() : { bool: false }
					if (result1?.bool && result1.cards?.length) {
						cards = cards.concat(result1.cards)
					}

					let target = event.target;
					let vis = player.storage.yuquan_yzs?.includes(get.name(event.card)) ? "visible" : undefined;
					let result2 = target.countDiscardableCards(player, pos) ? await player.discardPlayerCard(pos, event.target, 1, true, vis)
						.set("target", event.target).set("complexSelect", false)
						.set("ai", lib.card.guohe.ai.button)
						.forResult() : { bool: false };
					if (result2?.bool && result2.cards?.length) {
						cards = cards.concat(result2.cards)
					}

					cards = cards.filter(card => get.name(card) == "sha");
					event.baseDamage += cards.length;
					let nature = player.storage.ye_yzs?.includes(get.name(event.card)) ? "thunder" : undefined;
					await target.damage(nature)
				},
			},
			yuanlu_yzs: {
				shizhongyingfashu_yzs: `目标牌造成伤害后，自己恢复1点体力`,
				shizhongyingfashu_yzs_cost: 2,
				shizhongyingfashu_yzs_effect(player, name) {
					player.addSkill("yuanlu_yzs_buff")
					player.markAuto("yuanlu_yzs_buff", name)
				},
				fullskin: true,
				image: "ext:一中杀/image/card/yuanlu_yzs.png",
				type: "trick",
				toself: true,
				enable(card, player) {
					return player.isDamaged();
				},
				savable: true,
				selectTarget: -1,
				filterTarget(card, player, target) {
					return target === player && target.isDamaged();
				},
				modTarget(card, player, target) {
					return target.isDamaged();
				},
				content() {
					target.recover();
				},
				ai: {
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
			huzang_yzs: {
				shizhongyingfashu_yzs: `目标牌结算后目标角色失去1点护甲`,
				shizhongyingfashu_yzs_cost: 4,
				shizhongyingfashu_yzs_effect(player, name) {
					player.addSkill("huzang_yzs_buff")
					player.markAuto("huzang_yzs_buff", name)
				},
				fullskin: true,
				type: "trick",
				enable: true,
				selectTarget: function () {
					const player = get.player();
					if (player?.storage?.dashe_yzs?.includes(get.name("yuquan_yzs"))) return 2;
					return 1;
				},
				allowMultiple: true,
				usable: 1,
				image: "ext:一中杀/image/card/huzang_yzs.png",
				filterTarget(card, player, target) {
					if (player === target) {
						return false;
					}
					return true
				},
				async content(event, trigger, player) {
					if (typeof event.baseDamage !== "number") {
						event.baseDamage = 1;
					}
					if (player.storage?.guanniu_yzs?.includes(get.name(event.card))) event.baseDamage++;
					const target = event.target;
					if (target.hujia > 0) {
						await target.changeHujia(-2, "lose")
					} else {
						let nature = player.storage.ye_yzs?.includes(get.name(event.card)) ? "thunder" : undefined;
						await target.damage(nature)
					}
				},
			},
			moxuluo_yzs: {
				shizhongyingfashu_yzs_cost: 5,
				fullskin: true,
				type: "basic",
				enable: true,
				selectTarget: 1,
				allowMultiple: true,
				image: "ext:一中杀/image/card/moxuluo_yzs.png",
				filterTarget(card, player, target) {
					if (game.hasPlayer(cur => cur.name == "Makora_yzs",true)) {
						return target.name == "Makora_yzs"
					} else {
						return true;
					}
				},
				async content(event, trigger, player) {
					const target = event.target;
					if (target.name == "Makora_yzs") {
						await target.recover(3);
						player.setStorage("Makora_yzs", target.hp);
						const hundunyutiaohe_yzs = {}
						const list = ["hundunyutiaohe_yzs_card", "hundunyutiaohe_yzs_damage", "hundunyutiaohe_yzs_skill", "hundunyutiaohe_yzs_skill2", "hundunyutiaohe_yzs_skill3","hundunyutiaohe_yzs_skill4"];
						for (let item of list) {
							hundunyutiaohe_yzs[item] = target.getStorage(item);
						}
						player.setStorage("Makora_yzs_hundunyutiaohe_yzs", hundunyutiaohe_yzs);

						if (target.hp <= 0 && target.storage?.moxuluo_yzs_source) {
							target.storage.moxuluo_yzs_source.markAuto("shizhongyingfashu_yzs_break", "moxuluo_yzs")
						}
						if (_status.roundStart == target) _status.roundStart = target.next;
						if (lib.playerOL) delete lib.playerOL[target.playerid];
						game.broadcastAll(player => {
							game.players.remove(player);
							game.dead.remove(player);
							if (player.seatNum == 1) player.nextSeat.setSeatNum(1);
							player.nextSeat.previousSeat = player.previousSeat;
							player.previousSeat.nextSeat = player.nextSeat;
							player.delete();
							player.removed = true;
							setTimeout(() => player.removeAttribute("style"), 500);
						}, target);
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
					} else {
						if (game.hasPlayer(cur => cur.name == "Makora_yzs", true)) {
							return;
						}
						game.addGlobalSkill("Makora_auto")
						if (!_status.moxuluo_yzs) {
							if (!game.checkResult_moxuluo_yzs) {
								game.checkResult_moxuluo_yzs = game.checkResult;
								game.checkResult = function () {
									const targets = game.players.filter(i => i.isNoPlayer_moxuluo_yzs);
									game.players.removeArray(targets);
									game.checkResult_moxuluo_yzs();
									game.players.addArray(targets);
								};
							}
							if (!game.checkOnlineResult_moxuluo_yzs) {
								game.checkOnlineResult_moxuluo_yzs = game.checkOnlineResult;
								game.checkOnlineResult = function (player) {
									const targets = game.players.filter(i => i.isNoPlayer_moxuluo_yzs);
									game.players.removeArray(targets);
									game.checkOnlineResult_moxuluo_yzs(player);
									game.players.addArray(targets);
								};
							}
							game.broadcastAll(() => {
								_status.moxuluo_yzss = true;
							})
						}
						if (!get.attitude_moxuluo_yzs) {
							get.attitude_moxuluo_yzs = get.attitude;
							get.attitude = function (from, to) {
								if (from && from?.getStorage("moxuluo_yzs_source", false)) {
									from = from.getStorage("moxuluo_yzs_source", false);
								}
								if (to && to?.getStorage("moxuluo_yzs_source", false)) {
									to = to.getStorage("moxuluo_yzs_source", false);
								}
								let att = get.attitude_moxuluo_yzs(from, to);
								return att;
							};
						}
						const Makora = await game.addPlayerOL(target, "Makora_yzs", null, true);
						game.broadcastAll((Makora) => {
							Makora.isNoPlayer_longzhiban_yzs = true;
							Makora.dieAfter = function () { };
							Makora.dieAfter2 = function () { };
						}, Makora)
						Makora.setStorage("moxuluo_yzs_source", player);
						Makora.ai.modAttitudeFrom = function (from, to, att) {
							if (_status.moxuluo_yzs_source_att_ing) return att;
							if (from.getStorage("moxuluo_yzs_source", false)) {
								from = from.getStorage("moxuluo_yzs_source", false);
							}
							if (to.getStorage("moxuluo_yzs_source", false)) {
								to = to.getStorage("moxuluo_yzs_source", false);
							}
							_status.moxuluo_yzs_source_att_ing = true;
							att = get.attitude(from, to);
							delete _status.moxuluo_yzs_source_att_ing;
							return att;
						};
						game.broadcastAll((Makora, player) => {
							if (get.mode() == 'guozhan') {
								if (Makora.name2 == undefined) Makora.name2 = Makora.name1;
							}
							if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
								Makora.side = player.side;
								Makora.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
								Makora.node.identity.dataset.color = player.node.identity.dataset.color;
							}
							Makora.skillH = [];
							Makora.storage.zhibi = [];
							Makora.storage.stratagem_expose = [];
							Makora.storage.stratagem_fury = 0;
						}, Makora, player);
						Makora.storage.isSub = true;
						Makora.markSkill("isSub");
						if (player.storage.Makora_yzs && player.storage.Makora_yzs) {
							Makora.hp = player.storage.Makora_yzs;
							Makora.update();
						}
						if (player.storage.Makora_yzs_hundunyutiaohe_yzs) {
							const list = ["hundunyutiaohe_yzs_card", "hundunyutiaohe_yzs_damage", "hundunyutiaohe_yzs_skill", "hundunyutiaohe_yzs_skill2", "hundunyutiaohe_yzs_skill3","hundunyutiaohe_yzs_skill4"];
							for (let item of list) {
								Makora.setStorage(item, player.storage.Makora_yzs_hundunyutiaohe_yzs[item])
							}
						}
						Makora.addSkill("rg_treasure_ban")
						Makora.directgain(get.cards(4));
						Makora
							.when({ global: "die" })
							.filter((evt, player2) => {
								if (evt.reserveOut) return false;
								return evt.player == player || evt.player == player2;
							})
							.assign({
								forceDie: true,
							})
							.step(lib.card["moxuluo_yzs"].dieRemove);
						game.broadcastAll(function (player, Makora) {
							_status.Makora_auto = [player.playerid, Makora.playerid]
							Makora._trueMe = player;
							player._trueMe = player;
						}, player, Makora)
						game.log(player, '召唤了', lib.translate['Makora_yzs']);
					}
				},
				async dieRemove(event, trigger, player) {
					if (player.storage?.moxuluo_yzs_source) {
						player.storage.moxuluo_yzs_source.markAuto("shizhongyingfashu_yzs_break", "moxuluo_yzs")
					}
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
			},
		},
		skill: {
			//石中剑
			shizhongjian_yzs_skill: {
				equipSkill: true,
				mark: true,
				priority: -2,
				zhuanhuanji: true,
				marktext: "☯",
				intro: {
					content: function (storage, player, skill) {
						let prompt = (storage ? "阴(弃2张牌，令【杀】伤害+1)" : "阳(摸2张牌，令【杀】伤害-1)");
						return prompt;
					},
				},
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					if (event.card.name !== "sha") return false;
					let storage = player.storage["shizhongjian_yzs_skill"] || false;
					if (!storage) return true;
					var min = 2;
					if (!player.hasSkill("shizhongjian_yzs_skill", null, false)) {
						min += get.sgn(player.getEquips("shizhongjian_yzs").length);
					}
					return player.countCards("hej") >= min;
				},
				async cost(event, trigger, player) {
					let storage = player.storage["shizhongjian_yzs_skill"] || false;
					let prompt = "是否";
					if (storage) {
						prompt += "弃2张牌，令此【杀】伤害+1？";
					}
					else {
						prompt += "摸2张牌，令此【杀】伤害-1？";
					};
					if (player.storage["shizhongjian_yzs_skill"]) {
						event.result = await player.chooseToDiscard(get.prompt("shizhongjian_yzs"), 2, false, "hej", function (card, player) {
							if (_status.event.ignoreCard) {
								return true;
							}
							var cards = player.getEquips("shizhongjian_yzs");
							if (!cards.includes(card)) {
								return true;
							}
							return cards.some(cardx => cardx !== card && !ui.selected.cards.includes(cardx));
						})
							.set("prompt2", prompt)
							.set("ignoreCard", player.hasSkill("shizhongjian_yzs_skill", null, false))
							.set("complexCard", true)
							.set("ai", function (card) {
								var evt = _status.event.getTrigger();
								if (get.attitude(evt.player, evt.targets[0]) < 0) {
									if (evt.player.needsToDiscard()) {
										return 15 - get.value(card);
									}
									if (evt.baseDamage + evt.extraDamage >= Math.min(2, evt.targets[0].hp)) {
										return 8 - get.value(card);
									}
									return 5 - get.value(card);
								}
								return -1;
							})
							.set("chooseonly", true)
							.forResult()
					} else {
						event.result = await player.chooseBool(prompt).forResult();
					}
				},
				async content(event, trigger, player) {
					player.changeZhuanhuanji("shizhongjian_yzs_skill");
					if (player.storage["shizhongjian_yzs_skill"]) {
						await player.draw(2);
						if (typeof trigger.baseDamage != "number") {
							trigger.baseDamage = 1;
						}
						trigger.baseDamage--;
					}
					else {
						if (event.cards?.length) await player.modedDiscard(event.cards);
						if (typeof trigger.baseDamage != "number") {
							trigger.baseDamage = 1;
						}
						trigger.baseDamage++;
					}
				},
			},
			//圣国诅咒
			shengguozuzhou_yzs_skill: {
				locked: true,
				equipSkill: true,
				mod: {
					playerEnabled(card, player, target) {
						if (player == target && card.name == "tao") {
							return false;
						}
					},
					cardSavable(card, player) {
						if (player == _status.event.dying && card.name === "tao") {
							return false;
						}
					},
				},
				trigger: { player: "phaseEnd" },
				filter(event, player) {
					if (!get.sgn(player.getEquips("shengguozuzhou_yzs").length)) return false;
					return player.countCards("h");
				},
				async cost(event, trigger, player) {
					const card = await player.chooseToDiscard("弃置1张红桃手牌，然后将【圣国诅咒】置入弃牌堆", { suit: "heart" })
						.set("position", "h")
						.set("ai", function (card) {
							return 7 - get.value(card);
						})
						.forResult();
					event.result = {
						bool: card.bool,
						cost_data: card.cards,
					};
				},
				audio: "baiyin_skill",
				async content(event, trigger, player) {
					var e2 = player.getEquips("shengguozuzhou_yzs");
					if (e2.length) {
						await player.discard(e2);
					}
					player.removeSkill("shengguozuzhou_yzs_skill");
				},
			},
			//藩篱之梦
			fanlizhimeng_yzs_equip_skill: {
				equipSkill: true,
				mod: {
					canBeGained(card, source, player) {
						if (get.position(card) == "e" && card.name == "fanlizhimeng_yzs_equip") {
							return false;
						}
					},
					canBeDiscarded(card, source, player) {
						if (get.position(card) == "e" && card.name == "fanlizhimeng_yzs_equip") {
							return false;
						}
					},
					cardDiscardable(card, player) {
						if (get.position(card) == "e" && card.name == "fanlizhimeng_yzs_equip") {
							return false;
						}
					},
					cardEnabled2(card, player) {
						if (get.position(card) == "e" && card.name == "fanlizhimeng_yzs_equip") {
							return false;
						}
					},
				},
				"markimage2": 'extension/一中杀/image/card/fanlizhimeng_yzs.png',
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						const cards = player.getExpansions("fanlizhimeng_yzs_equip_skill");
						if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
						else return "【藩篱之梦】下共有" + get.cnNumber(cards.length) + "张牌";
					},
				},
				group: ["fanlizhimeng_yzs_equip_skill_Beginchange", "fanlizhimeng_yzs_equip_skill_Afterchange", "fanlizhimeng_yzs_equip_skill_gain"],
				subSkill: {
					gain: {
						priority: 3,
						popup: false,
						trigger: {
							player: "gainEnd",
						},
						filter(event, player) {
							return player != _status.currentPhase && player.storage.currentHandcards_yzs == "fanlizhimeng_yzs_equip_skill"
						},
						forced: true,
						async content(event, trigger, player) {
							player.addGaintag(trigger.cards, player.storage.currentHandcards_yzs)
						}
					},
					Beginchange: {
						locked: true,
						equipSkill: true,
						sub: true,
						sourceSkill: "fanlizhimeng_yzs_equip_skill",
						forced: true,
						popup: false,
						priority: 11231424,
						trigger: { player: ["phaseBegin"] },
						async content(event, trigger, player) {
							player.setStorage("currentHandcards_yzs", null, true)
							let cards = player.getExpansions("fanlizhimeng_yzs_equip_skill");
							let handcards = player.getCards("h");
							let next = player.addToExpansion(handcards, player, "giveAuto")
							next.gaintag.add("fanlizhimeng_yzs_equip_skill")
							next.untrigger(true);
							await next
							if (cards && cards.length) {
								player.directgain(cards, "gain2");
								player.removeGaintag("fanlizhimeng_yzs_equip_skill", cards);
							}
							await game.delayx();
						},
					},
					Afterchange: {
						locked: true,
						equipSkill: true,
						sub: true,
						sourceSkill: "fanlizhimeng_yzs_equip_skill",
						forced: true,
						popup: false,
						priority: -11231424,
						trigger: { player: ["phaseAfter"] },
						async content(event, trigger, player) {
							player.setStorage("currentHandcards_yzs", "fanlizhimeng_yzs_equip_skill", true)
							let cards = player.getExpansions("fanlizhimeng_yzs_equip_skill");
							let handcards = player.getCards("h");
							let next = player.addToExpansion(handcards, player, "giveAuto")
							next.gaintag.add("fanlizhimeng_yzs_equip_skill")
							next.untrigger(true);
							await next
							if (cards && cards.length) {
								player.directgain(cards, "gain2");
							}
							await game.delayx();
						},
					}
				},
				priority: 3,
				forced: true,
				trigger: { player: "damageBegin4" },
				filter(event, player) {
					const munius = player.getVCards("e").filter(i => i.name == "fanlizhimeng_yzs_equip");
					return munius && munius.length;
				},
				async content(event, trigger, player) {
					const card = player.getCards("e", i => i.name == "fanlizhimeng_yzs_equip");
					if (card) {
						await player.loseToDiscardpile(card);
						await game.delay();
						trigger.cancel();
					}
				},
			},
			//双子睡袋
			shuangzishuidai_yzs_skill: {
				charlotte: true,
				forced: true,
				popup: false,
				trigger: { player: "phaseBegin" },
				priority: 114,
				async content(event, trigger, player) {
					player.popup("ZZZ~")
					player.skip("phaseDraw");
					player.skip("phaseUse");
					player.skip("phaseDiscard");
					player.removeSkill("shuangzishuidai_yzs_skill");
				}
			},
			_shuangzishuidai_yzs_delay: {
				charlotte: true,
				forced: true,
				popup: false,
				trigger: { global: "phaseEnd" },
				priority: 514,
				filter(event, player) {
					return player.countMark("shuangzishuidai_yzs_delay") > 0
				},
				getIndex(event, player) {
					return player.countMark("shuangzishuidai_yzs_delay")
				},
				async content(event, trigger, player) {
					player.removeMark("shuangzishuidai_yzs_delay", false);
					let result = await player.chooseButton([
						"请选择一项",
						[
							[
								["one", "恢复1点体力并摸3张牌"],
								["two", "恢复2点体力并摸1张牌"],
								["three", "恢复体力值至2，摸牌至手牌数为4"],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai", () => {
							return get.event().choice;
						})
						.set(
							"choice",
							(() => {
								const player = get.event().player
								if (player.hp <= 1 && player.countCards("h") < 3) return "three";
								if (player.getDamagedHp(true) <= 1) return "one";
								return "two"
							})()
						)
						.forResult();
					if (!result.bool) return
					if (result.links[0] == "one") {
						await player.recover(1);
						await player.draw(3);
					}
					if (result.links[0] == "two") {
						await player.recover(2);
						await player.draw(1);
					}
					if (result.links[0] == "three") {
						if (player.hp < 2) await player.recover(2 - player.hp);
						if (player.countCards("h") < 4) await player.draw(4 - player.countCards("h"))
					}
					player.addSkill("shuangzishuidai_yzs_skill");
				}
			},
			//救祓新星
			jiufuxinxing_yzs_equip1_skill: {
				equipSkill: true,
				trigger: {
					player: "useCardToPlayered",
				},
				forced: true,
				filter(event, player) {
					return event.card.name == "sha" && !event.getParent().directHit.includes(event.target) && event.target.hp >= player.hp;
				},
				priority: 3,
				logTarget: "target",
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
				ai: {
					"directHit_ai": true,
					skillTagFilter(player, tag, arg) {
						if (arg.card.name != "sha" || arg.target.countCards("h", "shan") > 1) {
							return false;
						}
					},
				},
			},
			jiufuxinxing_yzs_equip2_skill: {
				equipSkill: true,
				priority: 3,
				trigger: {
					player: "damageBegin4",
				},
				forced: true,
				filter(event, player) {
					return get.type(event.card, "trick") == "trick";
				},
				content() {
					trigger.cancel();
				},
				ai: {
					effect: {
						target(card, player, target, current) {
							if (get.type(card) == "trick" && get.tag(card, "damage")) {
								return "zeroplayertarget";
							}
						},
					},
				},
			},
			//维克多法典
			weikeduofadian_yzs_skill: {
				equipSkill: true,
				trigger: {
					player: "useCard",
				},
				priority: 3,
				locked: true,
				usable: 1,
				filter(event, player) {
					let possible = player.getPossibleStorm();
					return player.isPhaseUsing() && event.card.name == "sha" && possible.length;
				},
				async cost(event, trigger, player) {
					let possible = player.getPossibleStorm();
					for (let i = 0; i < possible.length; i++) {
						possible[i] = [possible[i], get.translation(possible[i]) + "：" + get.translation(possible[i] + "_skill_info")]
					}
					possible.flat()
					let result = await player.chooseButton([
						"选择要转换的风暴",
						[
							possible
							, "textbutton",
						],
					])
						.set("forced", false)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							if (button.link == _status._yzsStorm) return false;
							return true
						})
						.set("ai", button => {
							let v = 0;
							if (button.link == "FireStorm") {
								v += 0.1
							} else if (button.link == "ThunderStorm") {
								v += 0.08
							} else if (button.link == "WaterStorm") {
								v += 0.2
							} else if (button.link == "IceStorm") {
								v += 0.4
							} else if (button.link == "BulletStorm") {
								v += 0.2
							} else if (button.link == "WindStorm") {
								v += 0.33
							} else v += 0.8;
							return Math.random() + v;
						})
						.forResult();
					if (!result.bool) {
						event.result = {
							bool: false
						}
					} else {
						event.result = {
							bool: true,
							cost_data: result.links[0],
						}
					}
				},
				async content(event, trigger, player) {
					await player.yzs_changeStorm(event.cost_data);
				}
			},
			//国王密令
			_guowangmiling_yzs_lose: {
				forceDie: true,
				charlotte: true,
				forced: true,
				priority: 30,
				popup: false,
				trigger: {
					player: ["loseBefore"]
				},
				filter(event, player) {
					if (event.getParent()?.name == "phaseJudge") {
						return false;
					}
					if (event.type == "gain") return false;
					return true;
				},
				async content(event, trigger, player) {
					let extra = [];
					for (var i = 0; i < trigger.cards.length; i++) {
						if (trigger.cards[i][trigger.cards[i].cardSymbol]?.cards?.length) {
							for (let card of trigger.cards[i][trigger.cards[i].cardSymbol].cards) {
								if (card.storage?.guowangmiling_yzs?.length) {
									extra.addArray(card.storage.guowangmiling_yzs);
									card.storage.guowangmiling_yzs = [];
									game.broadcast(
										(card) => {
											card.storage.guowangmiling_yzs = [];
										},
										card
									);
								}
							}
						}
						if (trigger.cards[i].storage?.guowangmiling_yzs?.length) {
							extra.addArray(trigger.cards[i].storage?.guowangmiling_yzs);
							trigger.cards[i].storage.guowangmiling_yzs = [];
							game.broadcast(
								(card) => {
									card.storage.guowangmiling_yzs = [];
								},
								trigger.cards[i]
							);
						}
					}
					if (!extra.length) return;
					game.log("【国王密令】掉落了", extra)
					trigger.cards.addArray(extra);
				}
			},
			_guowangmiling_yzs_gain: {
				forceDie: true,
				charlotte: true,
				forced: true,
				priority: 30,
				popup: false,
				trigger: {
					player: ["gainBefore"]
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					let extra = [];
					for (var i = 0; i < trigger.cards.length; i++) {
						if (trigger.cards[i][trigger.cards[i].cardSymbol]?.cards?.length) {
							for (let card of trigger.cards[i][trigger.cards[i].cardSymbol].cards) {
								if (card.storage?.guowangmiling_yzs?.length) {
									extra.addArray(card.storage.guowangmiling_yzs);
									card.storage.guowangmiling_yzs = [];
									game.broadcast(
										(card) => {
											card.storage.guowangmiling_yzs = [];
										},
										card
									);
								}
							}
						}
						if (trigger.cards[i].storage?.guowangmiling_yzs?.length) {
							extra.addArray(trigger.cards[i].storage?.guowangmiling_yzs);
							trigger.cards[i].storage.guowangmiling_yzs = [];
							game.broadcast(
								(card) => {
									card.storage.guowangmiling_yzs = [];
								},
								trigger.cards[i]
							);
						}
					}
					if (!extra.length) return
					game.log(trigger.player, "获得了【国王密令】中的" + extra.length + "张牌")
					trigger.cards.addArray(extra);
				}
			},
			guowangmiling_yzs_buff: {
				"markimage2": 'extension/一中杀/image/card/guowangmiling_yzs.png',
				mark: true,
				intro: {
					name: "国王密令",
					markcount: "expansion",
					mark(dialog, _, player) {
						dialog.addText("你本回合使用的下张【杀】若造成伤害，则之无次数限制");
					},
				},
				charlotte: true,
				forced: true,
				trigger: {
					player: "useCardAfter",
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return event.card.name == "sha";
				},
				async content(event, trigger, player) {
					await player.removeSkill("guowangmiling_yzs_buff")
					if (player.getHistory("sourceDamage", card => card.card == trigger.card).length == 0) return;
					if (trigger.addCount === false) return;
					trigger.addCount = false;
					if (player.stat[player.stat.length - 1].card.sha > 0) {
						player.stat[player.stat.length - 1].card.sha--;
					}
				},
			},
			//梦疗事变
			_mengliaoshibian_yzs: {
				popup: false,
				priority: 6,
				charlotte: false,
				forced: true,
				trigger: {
					player: ["useCard", "phaseJudge"]
				},
				filter(event, player) {
					if (!_status.mengliaoshibian_yzs || _status.mengliaoshibian_yzs < 0) return false;
					if (event.name == "phaseJudge") {
						if (!event.delayEffect && lib.card[event.card.name]?.noEffect_yzs) return false;
						return true;
					}
					const info = lib.card[event.card.name];
					if (info.notarget) return false;
					if (!event.card.isCard) return false;
					if (!event.cards || !event.cards.length) return false;
					if (get.type(event.card) == "equip" || get.type(event.card) == "delay") return false;
					return true;
				},
				async content(event, trigger, player) {
					if (trigger.name == "phaseJudge") {
						trigger.untrigger("currentOnly");
						trigger.cancelled = true;
						game.log(trigger.card, "被【梦疗事变】无效了");
						return;
					} else {
						trigger.targets.length = 0;
						trigger.all_excluded = true;
					}
					game.log(trigger.card, "被【梦疗事变】无效了");
					game.broadcastAll(() => {
						_status.mengliaoshibian_yzs--;
					});
					if (_status.mengliaoshibian_yzs > 0) return;
					game.pause();
					await game.broadcastAll(
						() => {
							if (ui.mengliaoshibian_yzs) {
								ui.mengliaoshibian_yzs.system.remove()
								ui.mengliaoshibian_yzs.destroy();
							}
						}
					);
					game.resume();
				}
			},
			//油盐不进
			_youyanbujin_yzs: {
				charlotte: true,
				popup: false,
				priority: 3,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				forced: true,
				getIndex(event, player, triggername) {
					if (event.getParent().name == "phaseJudge") return 0;
					let num = 0;
					if (!event.getl) {
						return num;
					}
					let evt = event.getl(player);
					if (evt.js && evt.js.length) {
						for (var i of evt.js) {
							if (i.name == "youyanbujin_yzs") {
								num++;
							}
						}
					}
					return num;
				},
				async content(event, trigger, player) {
					let evt = trigger.getl(player);
					var next = game.createEvent("phaseJudge", false);
					next.player = player;
					next.delayEffect = true;
					next.card = evt.js.filter(card => card.name == "youyanbujin_yzs")[0];
					next.setContent(async function (event, trigger, player) {
						player.$phaseJudge(event.card);
						await event.trigger("phaseJudge");
						if (event.cancelled) return;
						player.addMark("youyanbujin_yzs_buff", 1, false);
					});
					await next;
				},
				mod: {
					canBeGained: function (card, source, player) {
						if (!player.hasJudge("youyanbujin_yzs")) return;
						if (player.getCards('he').includes(card) && source != player) return false;
					},
					canBeDiscarded: function (card, source, player) {
						if (!player.hasJudge("youyanbujin_yzs")) return;
						if (player.getCards('he').includes(card) && source != player) return false;
					},
				},
			},
			_youyanbujin_yzs_buff: {
				charlotte: true,
				popup: false,
				priority: 3,
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num += player.countMark("youyanbujin_yzs_buff");
					player.clearMark("youyanbujin_yzs_buff", false);
				},
				ai: {
					threaten: 1.3,
				},
				"_priority": 0,
			},
			//贤者预言
			_xianzheyuyan_yzs: {
				charlotte: true,
				popup: false,
				priority: 3,
				forced: true,
				trigger: {
					player: ["damageEnd", "damageZero"]
				},
				getIndex(event, player, triggername) {
					return player.countCards("j", { name: "xianzheyuyan_yzs" });
				},
				async content(event, trigger, player) {
					let card = player.getCards("j", { name: "xianzheyuyan_yzs" })[0];
					var next = game.createEvent("phaseJudge", false);
					next.player = player;
					next.card = card;
					next.delayEffect = true;
					next.effect = {
						draw: 2,
						recover: 1,
					}
					next.setContent(async function (event, trigger, player) {
						await player.lose(event.card, "visible", ui.ordering);
						player.$phaseJudge(event.card);
						await event.trigger("phaseJudge");
						if (event.cancelled) return;
						if (event.effect.draw > 0) await player.draw(event.effect.draw);
						if (event.effect.recover > 0) await player.recover(event.effect.recover);
					});
					await next;
				},
			},
			//对称长枪
			SymmetricalSpear_yzs_skill: {
				equipSkill: true,
				priority: 3,
				audio: "fangtian_skill",
				locked: true,
				trigger: {
					player: "useCard1",
				},
				forced: true,
				filter(event, player) {
					if (event.card.name !== "sha" || get.mode() === "guozhan") {
						return false;
					}
					var card = event.card;
					var range;
					var select = get.copy(get.info(card).selectTarget);
					if (select === undefined) {
						if (get.info(card).filterTarget === undefined) {
							return false;
						}
						range = [1, 1];
					} else if (typeof select === "number") {
						range = [select, select];
					} else if (get.itemtype(select) === "select") {
						range = select;
					} else if (typeof select === "function") {
						range = select(card, player);
						if (typeof range == "number") {
							range = [range, range];
						}
					}
					game.checkMod(card, player, range, "selectTarget", player);
					return range[1] !== -1 && event.targets.length > range[1];
				},
				content() { },
				mod: {
					selectTarget(card, player, range) {
						if (card.name !== "sha") {
							return;
						}
						if (range[1] === -1) {
							return;
						}
						if (!card.isCard) return;
						if (!card.cards || !card.cards.length) return;
						if (card.cards.some(c => c.hasGaintag("KingsHand_yzs_zhanyi") || !player.getCards("h").includes(c))) return;
						range[1] += 1;
					},
				},
			},
			//龙之剑
			longzhijian_yzs_skill: {
				group: ["longzhijian_yzs_skill_recover"],
				subSkill: {
					recover: {
						audio: "qinggang_skill",
						audio: "ext:一中杀/audio/skill:1",
						equipSkill: true,
						priority: 2,
						trigger: {
							source: "damageBegin2",
						},
						prompt2: "你可防止此伤害，然后恢复1点体力",
						logTarget: "player",
						filter(event) {
							return event.card && event.card.name === "sha" && event.notLink();
						},
						check(event, player) {
							return get.attitude(player, event.player) > 0;
						},
						async content(event, trigger, player) {
							trigger.cancel();
							await player.recover();
						}
					}
				},
				priority: 2,
				audio: "ext:一中杀/audio/skill:1",
				equipSkill: true,
				locked: true,
				trigger: {
					player: "useCard1",
				},
				prompt2: "你可扣除1点体力上限，令此【杀】无次数限制",
				filter(event, player) {
					return event.card.name === "sha" && player.maxHp > 1;
				},
				check(event, player) {
					return player.maxHp > 5;;
				},
				async content(event, trigger, player) {
					await player.loseMaxHp();
					if (trigger.addCount === false) return;
					trigger.addCount = false;
					if (player.getStat("card")["sha"] > 0) {
						player.getStat("card")["sha"]--;
					}
				},
			},
			//特殊延时锦囊判定阶段不触发无懈可击询问
			_yzs_nowuxie: {
				popup: false,
				charlotte: false,
				forced: true,
				priority: 13,
				trigger: {
					player: ["phaseJudge"]
				},
				filter(event, player) {
					if (!event.card) return false;
					if (!lib.card[event.card.name]?.noEffect_yzs) return false;
					return !event.delayEffect;
				},
				async content(event, trigger, player) {
					trigger.card.storage.nowuxie = true;
				}
			},
			//铁拳
			IronFist_yzs_skill: {
				priority: 2,
				audio: "ExFighting_yzs",
				equipSkill: true,
				locked: true,
				trigger: {
					player: "useCardAfter",
				},
				forced: true,
				filter(event, player) {
					return event.card.name === "sha"
				},
				async content(event, trigger, player) {
					let result = await player
						.chooseButton(["令你的攻击范围±1", [[["add", "+1"], ["sub", "-1"]], "tdnodes"]])
						.set("filterButton", button => {
							return true;
						})
						.set("ai", button => Math.random())
						.set("forced", true)
						.set("selectButton", 1)
						.forResult();
					if (!result.bool) return false;
					if (result.links[0] == "sub") {
						if (!player.storage.IronFist_yzs_skill) player.storage.IronFist_yzs_skill = 0;
						player.storage.IronFist_yzs_skill--;
					} else {
						if (!player.storage.IronFist_yzs_skill) player.storage.IronFist_yzs_skill = 0;
						player.storage.IronFist_yzs_skill++;
					}
					player.markSkill("IronFist_yzs_skill")
				},
				mod: {
					attackRange(from, distance) {
						if (from.storage?.IronFist_yzs_skill) return distance + (from.storage.IronFist_yzs_skill);
					},
				},
			},
			//钢甲
			SteelArmor_yzs_skill: {
				priority: 2,
				audio: "ExFighting_yzs",
				equipSkill: true,
				locked: true,
				trigger: {
					player: "damageBegin3",
				},
				prompt2: `受到伤害时，若伤害来源不为其他角色，或你计算与伤害来源距离为X，你可令此伤害-1，然后你攻击范围±1。（X为你攻击范围且至少为1）`,
				filter(event, player) {
					if (!event.source || event.source == player) return true;
					let range = player.getAttackRange();
					if (range < 1) range = 1;
					if (get.distance(player, event.source) == range) return true;
					return false;
				},
				async content(event, trigger, player) {
					trigger.num--;
					let result = await player
						.chooseButton(["令你的攻击范围±1", [[["add", "+1"], ["sub", "-1"]], "tdnodes"]])
						.set("filterButton", button => {
							return true;
						})
						.set("ai", button => Math.random())
						.set("forced", true)
						.set("selectButton", 1)
						.forResult();
					if (!result.bool) return false;
					if (result.links[0] == "sub") {
						if (!player.storage.SteelArmor_yzs_skill) player.storage.SteelArmor_yzs_skill = 0;
						player.storage.SteelArmor_yzs_skill--;
					} else {
						if (!player.storage.SteelArmor_yzs_skill) player.storage.SteelArmor_yzs_skill = 0;
						player.storage.SteelArmor_yzs_skill++;
					}
					player.markSkill("SteelArmor_yzs_skill")
				},
				mod: {
					attackRange(from, distance) {
						if (from.storage?.SteelArmor_yzs_skill) return distance + (from.storage.SteelArmor_yzs_skill);
					},
				},
			},
			//蛤蟆
			hama_yzs_buff: {
				forced: true,
				locked: true,
				popup: false,
				priority: 133,
				direct: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					if (!player.storage.hama_yzs_buff?.includes(get.name(event.card))) return false;
					if (!event.targets.length) return false;
					const target = event.targets[0];
					return target.countCards("h") > player.countCards("h")
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
				mod: {
					cardUsableTarget(card, player, target) {
						if (!player.storage.hama_yzs_buff?.includes(card.name)) return;
						if (target.countCards("h") > player.countCards("h")) return true;
					},
				},
			},
			//脱兔
			_tuotu_yzs_skill: {
				trigger: {
					target: "useCardToTargeted",
				},
				forced: true,
				popup: false,
				priority: 4,
				filter(event, player) {
					if (event.directHit?.includes(player) || !event.player||event.player==player) {
						return false;
					}
					return player.hasUsableCard("tuotu_yzs") && player.countUsed("tuotu_yzs",true)<1;
				},
				async content(event, trigger, player) {
					await player
						.chooseToUse("是否使用【脱兔】响应" + get.translation(trigger.player) + "使用的" + get.translation(trigger.card) + "？")
						.set("filterCard", function (card, player) {
							if (get.name(card) != "tuotu_yzs") {
								return false;
							}
							return lib.filter.cardEnabled(card, player, "forceEnable") && lib.filter.cardUsable(card,player,get.event());
						})
						.set("respondTo", [trigger.player, trigger.card])
						.set("goon", (() => {
							const eff = trigger.targets.reduce((sum, target) => sum + get.effect(target, trigger.card, trigger.player, player));
							if (trigger.cards?.length) {
								return true;
							}
							return -eff;
						})())
						.set("ai1", function (card) {
							return _status.event.goon;
						});
				}
			},
			tuotu_yzs_buff: {
				forced: true,
				locked: true,
				popup: false,
				priority:-31,
				trigger: {
					player: "useCardAfter",
				},
				filter(event, player) {
					return player.getStorage("tuotu_yzs_buff").includes(get.name(event.card))
				},
				async content(event, trigger, player) {
					const targets = trigger.targets;
					for (let target of targets) {
						if (target.countDiscardableCards(target, "h")) await target.chooseToDiscard(true);
					}
				}
			},
			//円鹿
			yuanlu_yzs_buff: {
				trigger: {
					source: "damageSource",
				},
				forced: true,
				locked: true,
				popup: false,
				filter: function (event, player) {
					return player != event.player && event.card && player.getStorage("yuanlu_yzs_buff").includes(get.name(event.card));
				},
				async content(event, trigger, player) {
					await player.recover();
				},
				priority: 0.99,
			},
			//虎葬
			huzang_yzs_buff: {
				forced: true,
				locked: true,
				popup: false,
				priority: -21,
				trigger: {
					player: "useCardAfter",
				},
				filter(event, player) {
					return player.getStorage("huzang_yzs_buff").includes(get.name(event.card))
				},
				async content(event, trigger, player) {
					const targets = trigger.targets;
					for (let target of targets) {
						if (target.hujia>0) await target.changeHujia(-1,"lose");
					}
				}
			},
		},
		translate: {
			"spear_yzs": "矛",
			"spear_yzs_info": `出牌阶段对1名其他角色使用。你与其展示各自手牌，若展示牌花色无此牌花色，你对目标角色造成1点伤害`,
			"yotou_yzs": "妖刀·心渡",
			"yotou_yzs_info": `你出【杀】数+<font color="#e553ff">1</font>，<br>
			你使用【杀】造成伤害+<font color="#e553ff">0</font>，<br>
			你的【杀】需用<font color="#e553ff">1</font>张【闪】响应。<br>你可将武器牌当做普通【杀】使用或打出。<br>
			此牌离开武器栏后，你摸牌至手牌数等于你上一出牌阶段的开始时手牌数（至多为12），然后令你的吟唱+<font color="#e553ff">0</font>。（每个紫色数字不可大于5）`,
			"XZgun_yzs": "竭弹之枪",
			"XZgun_yzs_info": `你使用【杀】无次数限制且造成伤害-1，然后你弃1张手牌。`,
			"XZblade_yzs": "折断之刃",
			"XZblade_yzs_info": `你受到伤害无效。回合开始时，你弃2X张手牌，不足部分失去体力代替。(X为上一自轮无效伤害总值)`,
			"skill": "特殊",
			"Mystic": `<span class="yzs_Mystic">神秘术</span>`,
			"animal": "动物",
			"DeathNote_yzs": "死亡笔记",
			"DeathNote_yzs_info": `每公轮结束时，对1名其他角色使用。目标角色失去全部体力(至多5点)。`,
			"maotouying_yzs": "猫头鹰",
			"maotouying_yzs_info": `此牌离开场上角色的手牌区时，“璐璐杨·哈洛”获得此牌。<br>出牌阶段对1名与你手牌数之差≤1的其他角色使用：你展示此牌然后与其交换手牌。`,
			"pomochong_yzs": "破魔虫",
			"pomochong_yzs_info": `“精灵公主-璐璐杨·哈洛”在其回合内使用第4的整数倍张牌时获得此牌。<br>
    出牌阶段，对1名其他角色使用：你弃置其1张牌然后将此牌给予其。<br>若本回合此牌已被使用5次，则效果改为：你对其造成1点伤害并将此牌给予其。（每回合此牌至多造成3点伤害）`,
			"shengbaihu_yzs": "圣白虎",
			"shengbaihu_yzs_info": `“精灵公主-璐璐杨·哈洛”体力值变动时获得此牌。<br>“精灵公主-璐璐杨·哈洛”获得此牌后展示此牌并恢复1点体力（每自轮次限2次）<br>
    出牌阶段对1名其他角色使用：你获得其2张牌并给予其2张非【圣白虎】牌然后你将此牌给予其。`,
			"kuangchangbaozha_yzs": "矿场爆炸",
			"kuangchangbaozha_yzs_info": `出牌阶段对你自己使用。目标角色展示全部手牌，然后弃置其中的锦囊牌，若无则恢复1点体力，否则分配X-1点火焰伤害给Y名其他角色（X为弃置牌数且至多为3），最后目标角色受到X-1-Y点无来源火焰伤害`,
			"shizhongjian_yzs": "石中剑",
			shizhongjian_yzs_skill:`石中剑`,
			"shizhongjian_yzs_info": `转换技：你使用【杀】指定目标后：①：摸2张牌，令之伤害-1；②弃2张牌，令之伤害+1`,
			"shengguozuzhou_yzs": "圣国诅咒",
			shengguozuzhou_yzs_skill:`圣国诅咒`,
			"shengguozuzhou_yzs_info": `出牌阶段对1名其他角色使用。将此牌置入目标角色防具栏。
			你不可对自己使用【桃】。回合结束时你可弃1张红桃手牌以将此牌置入弃牌堆`,
			"fanersai_yzs": "凡尔赛",
			"fanersai_yzs_info": `出牌阶段，对1名有武器的其他角色使用。目标角色需对由你指定的另一名除其以外的角色使用1张【杀】，否则你获得其武器。`,
			"TF_yzs": "牙仙精灵",
			"TF_yzs_info": `你造成或受到伤害时，可将此牌与1张【乳牙】交换，或将此牌置入弃牌堆以交换任意张手牌与【乳牙】`,
			"mengliaoshibian_yzs": "梦疗事变",
			"mengliaoshibian_yzs_info": `出牌阶段对你自己使用。接下来被使用的3张非转化且非虚拟的有目标的即时牌将被无效。`,
			"fanlizhimeng_yzs": "藩篱之梦",
			"fanlizhimeng_yzs_info": `出牌阶段对你自己使用。你将此牌置入防具栏，然后将全部手牌叠置于此牌下并摸等量张牌，然后若你体力值>1，你失去1点体力`,
			"fanlizhimeng_yzs_equip": "藩篱之梦",
			fanlizhimeng_yzs_equip_skill:`藩篱之梦`,
			"fanlizhimeng_yzs_equip_info": `回合外你扣置原本的手牌，启用此牌下的牌作为手牌。你受到伤害时将此牌及其下的牌置入弃牌堆，然后无效之并启用原手牌。此牌不可被弃置或获取。`,
			"qianmianpianshu_yzs": "千面骗术",
			"qianmianpianshu_yzs_info": `出牌阶段限1次，对1名其他角色使用。你将此牌给予目标角色，然后你与目标角色交换武器和防具
			<br><small>特殊地，${get.poptip("fanlizhimeng_yzs_equip")}和${get.poptip("jiufuxinxing_yzs")}不会因此被交换</small>`,
			"shuangzishuidai_yzs": "双子睡袋",
			"shuangzishuidai_yzs_info": `出牌阶段限1次或当你处于濒死状态时，对你自己使用。你选择一项：①恢复1点体力并摸3张牌；②恢复2点体力并摸1张牌；③恢复体力值至2，摸牌至手牌数为4。然后跳过下回合摸牌、出牌和弃牌阶段。
			若为使用者的出牌阶段内，此牌延迟至当前回合结束时生效。若此牌为虚拟或转化牌，效果改为恢复1点体力。`,
			"jiufuxinxing_yzs": "救祓新星",
			"jiufuxinxing_yzs_info": `出牌阶段对你自己使用。将此牌当做武器/防具置入对应装备栏，然后失去/恢复1点体力。`,
			"jiufuxinxing_yzs_equip1": "救祓新星",
			jiufuxinxing_yzs_equip1_skill:`救祓新星`,
			"jiufuxinxing_yzs_equip1_info": `你对体力值≥你的角色使用的【杀】需2张【闪】响应。此牌离开武器栏后你恢复1点体力`,
			"jiufuxinxing_yzs_equip2": "救祓新星",
			jiufuxinxing_yzs_equip2_skill: `救祓新星`,
			"jiufuxinxing_yzs_equip2_info": `你无视锦囊牌造成的伤害。此牌离开防具栏后你失去1点体力`,
			"weikeduofadian_yzs": "维克多法典",
			weikeduofadian_yzs_skill: "维克多法典",
			"weikeduofadian_yzs_info": `出牌阶段限1次：你使用【杀】时，可转换至任意风暴。`,
			"guowangmiling_yzs": "国王密令",
			"guowangmiling_yzs_info": `出牌阶段，对1名其他角色使用。你将此牌与至多一张手牌叠置于目标角色延时区内。此牌判定时其改为获得此牌与叠置于此牌下的牌
			出牌阶段对你自己使用，你本回合使用的下张【杀】若造成伤害，则之无次数限制`,
			"youyanbujin_yzs": "油盐不进",
			"youyanbujin_yzs_info": `出牌阶段对你自己使用。此牌处于延时区内时，你的手牌和装备不可被其他角色弃置或获取。此牌于不因判定而离开延时区后，你下一摸牌阶段多摸1张牌`,
			"xianzheyuyan_yzs": "贤者预言",
			"xianzheyuyan_yzs_info": `出牌阶段对1名角色使用。此牌处于延时区内时，你受到伤害后将此牌置入弃牌堆，然后摸2张牌并恢复1点体力。`,
			"SymmetricalSpear_yzs": "对称长枪",
			SymmetricalSpear_yzs_skill:"对称长枪",
			"SymmetricalSpear_yzs_info": `你使用手牌区中非“战意”的【杀】目标数+1。`,
			"treasure_yzs_black": "宝藏",
			"treasure_yzs_black_info": `出牌阶段限5次，对1名其他角色使用。弃置其2张牌,或视为对其使用无视防具的普通【杀】。`,
			"treasure_yzs_red": "宝藏",
			"treasure_yzs_red_info": `出牌阶段或濒死时，对你使用。你摸2张牌或恢复1点体力。`,
			"caisedebai_yzs": `彩色的白`,
			"caisedebai_yzs_info": `神秘术：Ⅰ：令【葡萄酒】${get.poptip("sing_yzs_count")}-1；<br>Ⅱ：你获得2点行动力然后体力值＜3的角色摸1张牌；<br>
	Ⅲ：你获得3点行动力，然后体力值＞2的角色依次选择：弃1张牌或受到1点伤害。`,
			caisedebai_yzs_1_info: `神秘术：Ⅰ：令【葡萄酒】${get.poptip("sing_yzs_count")}-1`,
			caisedebai_yzs_2_info: `神秘术：Ⅱ：你获得2点行动力然后体力值＜3的角色摸1张牌`,
			caisedebai_yzs_3_info: `神秘术：Ⅲ：你获得3点行动力，然后体力值＞2的角色依次选择：弃1张牌或受到1点伤害`,
			"dengliangdeguang_yzs": `等量的光`,
			"dengliangdeguang_yzs_info": `神秘术：对1名体力值为X的角色造成1点伤害。（出牌阶段每阶限1次，X为此神秘术阶数）`,
			dengliangdeguang_yzs_1_info: `神秘术：出牌阶段限1次：对1名体力值为1的角色造成1点伤害`,
			dengliangdeguang_yzs_2_info: `神秘术：出牌阶段限1次：对1名体力值为2的角色造成1点伤害`,
			dengliangdeguang_yzs_3_info: `神秘术：出牌阶段限1次：对1名体力值为3的角色造成1点伤害`,
			jingduke_yzs: "精读课",
			jingduke_yzs_info: `神秘术：你依此法获得牌后可将之给予“${get.poptip("标注角色")}”：<br>
Ⅰ：摸1张牌；<br>Ⅱ：摸3张牌并弃2张牌，然后获得1点${get.poptip("RE_AP")}；<br>Ⅲ：获得2点行动力和2点${get.poptip("Passion_yzs")}。`,
			jingduke_yzs_1_info: `神秘术：你依此法获得牌后可将之给予“${get.poptip("标注角色")}”：Ⅰ：摸1张牌`,
			jingduke_yzs_2_info: `神秘术：你依此法获得牌后可将之给予“${get.poptip("标注角色")}”：Ⅱ：摸3张牌并弃2张牌，然后获得1点${get.poptip("RE_AP")}`,
			jingduke_yzs_3_info: `神秘术：你依此法获得牌后可将之给予“${get.poptip("标注角色")}”：Ⅲ：获得2点行动力和2点${get.poptip("Passion_yzs")}`,
			yudenghuozhong_yzs: "于灯火中",
			yudenghuozhong_yzs_info: `神秘术：你依此法造成伤害时获得1点激情：<br>
Ⅰ：将1张手牌当做普通【杀】使用，然后转移【标注】；<br>
Ⅱ：摸1张牌并刷新你的出【杀】数；<br>  Ⅲ：获得1点激情，视为使用无距离限制且不可响应的普通【杀】。`,
			yudenghuozhong_yzs_1_info: `神秘术：你依此法造成伤害时获得1点激情：<br>Ⅰ：将1张手牌当做普通【杀】使用，然后转移【标注】`,
			yudenghuozhong_yzs_2_info: `神秘术：你依此法造成伤害时获得1点激情：<br>Ⅱ：摸1张牌并刷新你的出【杀】数`,
			yudenghuozhong_yzs_3_info: `神秘术：你依此法造成伤害时获得1点激情：<br>Ⅲ：获得1点激情，视为使用无距离限制且不可响应的普通【杀】`,
			longzhijian_yzs: "龙之剑",
			longzhijian_yzs_skill:"龙之剑",
			longzhijian_yzs_info: `你使用【杀】时可扣除1点体力上限，令之无次数限制。你的【杀】造成伤害时你可防止之，然后恢复1点体力。`,
			jiahu_yzs: "加护",
			zhuofu_yzs_fuka: `符卡`,
			zhuofu_yzs_heart: `火符卡`,
			zhuofu_yzs_spade: `雷符卡`,
			zhuofu_yzs_diamond: `水符卡`,
			zhuofu_yzs_club: `冰符卡`,
			rg_baonve: `<span class="rg_baonve">暴虐</span>`,
			rg_zhanshu: `<span class="rg_zhanshu">战术</span>`,
			rg_shengcun: `<span class="rg_shengcun">生存</span>`,
			IronFist_yzs: `铁拳`,
			IronFist_yzs_skill:`铁拳`,
			IronFist_yzs_info: `你使用【杀】结算后令你攻击范围±1。`,
			SteelArmor_yzs: `钢甲`,
			SteelArmor_yzs_skill:`钢甲`,
			SteelArmor_yzs_info: `受到伤害时，若伤害来源不为其他角色，或你计算与伤害来源距离为X，你可令此伤害-1，然后你攻击范围±1。（X为你攻击范围且至少为1）`,
			lingleidegu_yzs: "另类的骨",
			lingleidegu_yzs_info: `神秘术：Ⅰ：摸3张牌，然后弃至少2张牌或1张【杀】；<br>
Ⅱ：亮出牌堆顶等于你手牌数张牌，获得其中一种牌名的牌；<br>Ⅲ：与其他${get.poptip("shigu_yzs_buff")}角色交换手牌。`,
			lingleidegu_yzs_1_info: `神秘术：Ⅰ：摸3张牌，然后弃至少2张牌或1张【杀】`,
			lingleidegu_yzs_2_info: `神秘术：Ⅱ：亮出牌堆顶等于你手牌数张牌，获得其中一种牌名的牌`,
			lingleidegu_yzs_3_info: `神秘术：Ⅲ：与其他${get.poptip("shigu_yzs_buff")}角色交换手牌`,
			duyidexiang_yzs: "独一的相",
			duyidexiang_yzs_info: `神秘术：发动后获得对应${get.poptip("wuyongchang_yzs")}限定技：<br>
Ⅰ：摸或弃至多2张牌；<br>Ⅱ：令任意角色摸或弃至多2张牌；<br>Ⅲ：你视为使用无距离限制且不可响应的普通【杀】。`,
			duyidexiang_yzs_1_info: `神秘术：发动后获得对应${get.poptip("wuyongchang_yzs")}限定技：<br>Ⅰ：摸或弃至多2张牌`,
			duyidexiang_yzs_2_info: `神秘术：发动后获得对应${get.poptip("wuyongchang_yzs")}限定技：<br>Ⅱ：令任意角色摸或弃至多2张牌`,
			duyidexiang_yzs_3_info: `神秘术：发动后获得对应${get.poptip("wuyongchang_yzs")}限定技：<br>Ⅲ：你视为使用无距离限制且不可响应的普通【杀】`,
			tishuyinyong_yzs: `体术吟咏`,
			tishuyinyong_yzs_info: `神秘术：获得本神秘术阶数张<font color="#f8aa5d">【土星】</font>。`,
			tishuyinyong_yzs_1_info: `神秘术：获得1张<font color="#f8aa5d">【土星】</font>。`,
			tishuyinyong_yzs_2_info: `神秘术：获得2张<font color="#f8aa5d">【土星】</font>。`,
			tishuyinyong_yzs_3_info: `神秘术：获得3张<font color="#f8aa5d">【土星】</font>。`,
			gufaguanxing_yzs: `古法观星`,
			gufaguanxing_yzs_info: `神秘术：获得本神秘术阶数张<font color="#f56161">【火星】</font>。`,
			gufaguanxing_yzs_1_info: `神秘术：获得1张<font color="#f56161">【火星】</font>。`,
			gufaguanxing_yzs_2_info: `神秘术：获得2张<font color="#f56161">【火星】</font>。`,
			gufaguanxing_yzs_3_info: `神秘术：获得3张<font color="#f56161">【火星】</font>。`,
			planet_yzs: `行星`,
			Saturn_yzs: `土星`,
			Saturn_yzs_info:`回合开始时，若“星环”中最多为：<br><font color="#f8aa5d">【土星】</font>：你摸3张牌。<br>移去行星牌时，若移去的为：<br><font color="#f8aa5d">【土星】</font>：你摸2张牌。`,
			Mars_yzs: `火星`,
			Mars_yzs_info: `回合开始时，若“星环”中最多为：<br><font color="#f56161">【火星】</font>：你获得2点${get.poptip("RE_AP")}并弃至多3张牌。<br>移去行星牌时，若移去的为：<br><font color="#f56161">【火星】</font>：你获得1点行动力并弃至多2张牌。`,
			FullMoon_yzs: `盈月`,
			FullMoon_yzs_info: `回合开始时，若“星环”中最多为：<br><font color="#f9e99e">【盈月】</font>：若当前为额定回合，回合结束后你执行额外回合。<br><font color="#f9e99e">【盈月】</font>：每移去其下2张牌，你分配0点伤害。`,
			wtwCang_yzs: `苍`,
			wtwCang_yzs_info: `出牌阶段对对1名其他角色使用。你摸此牌点数张牌，然后对目标角色造成1点伤害。`,
			wtwHe_yzs: `赫`,
			wtwHe_yzs_info: `出牌阶段对1名其他角色使用。你弃置目标角色此牌点数张牌，然后对其造成1点伤害。`,
			yuquan_yzs: `玉犬`,
			yuquan_yzs_info: `消耗1：出牌阶段限2次：对1名其他角色使用。观看目标角色1张手牌。<br>融合：目标牌选取牌时目标明牌。`,
			ye_yzs: `鵺`,
			ye_yzs_info: `消耗2：出牌阶段限1次：对1名其他角色使用。展示目标角色1张手牌，然后你可弃置1张同花色的手牌以对其造成1点雷电伤害。<br>融合：目标牌造成伤害变为雷电伤害。`,
			dashe_yzs: `大蛇`,
			dashe_yzs_info: `消耗3：出牌阶段限1次：对2名其他角色使用。弃置目标角色1张牌。<br>融合：目标牌目标数+1。`,
			hama_yzs: `蛤蟆`,
			hama_yzs_info: `消耗2：出牌阶段限1次：对1名其他角色使用。将此牌给予其，然后获得其1张牌，然后若其手牌数＞你，对其造成1点伤害。<br>融合：对手牌数＞你的角色使用目标牌无次数限制。`,
			manxiang_yzs: `满象`,
			manxiang_yzs_info: `消耗3：出牌阶段限1次：对1名其他角色使用。目标角色需打出2张【杀】，否则你对其造成1点伤害。<br>融合：目标牌的消耗-1(至少为1)。`,
			tuotu_yzs: `脱兔`,
			tuotu_yzs_info: `消耗2：每回合限1次：你成为其他角色牌的目标时，将此牌给予使用者，然后弃置其1张牌，若与使用的牌花色相同，取消你这个目标。<br>融合：使用目标牌后目标角色需弃置1张手牌。`,
			guanniu_yzs: `贯牛`,
			guanniu_yzs_info: `消耗3：出牌阶段限1次：对1名其他角色使用。弃置你与目标角色各1张手牌，然后对其造成X点伤害（X为其中【杀】的数量）。<br>融合：目标牌造成的伤害+1。`,
			yuanlu_yzs: `円鹿`,
			yuanlu_yzs_info: `消耗2：出牌阶段对自己使用，或对濒死角色使用。目标角色恢复1点体力。<br>融合：目标牌造成伤害后，自己恢复1点体力。`,
			huzang_yzs: `虎葬`,
			huzang_yzs_info: `消耗4：出牌阶段限1次：对1名其他角色使用。若目标角色有护甲，其失去2点护甲，否则你对其造成1点伤害。<br>融合：目标牌结算后目标角色失去1点护甲。`,
			moxuluo_yzs: `魔虚罗`,
			moxuluo_yzs_info:`消耗5：出牌阶段：若“魔虚罗”①不在场：对1名角色使用，于其下家召唤“魔虚罗”（继承上次退场时的体力值）；②在场：对“魔虚罗”使用，令其恢复3点体力并退场。<br>此牌无融合效果，且仅会因“魔虚罗”死亡而被破坏。`,
		},
		list: [
			["spade", 1, "juedou"], ["spade", 1, "shandian"], ["spade", 1, "guding"], ["spade", 1, "wugu"],
			["spade", 2, "cixiong"], ["spade", 2, "bagua"], ["spade", 2, "tengjia"], ["spade", 2, "hanbing"],
			["spade", 3, "shunshou"], ["spade", 3, "tiesuo"], ["spade", 3, "jiu"], ["spade", 3, "guowangmiling_yzs"],
			["spade", 4, "shunshou"], ["spade", 4, "guohe"], ["spade", 4, "sha", "thunder"], ["spade", 4, "sha"],
			["spade", 5, "qinglong"], ["spade", 5, "jueying"], ["spade", 5, "sha", "thunder"], ["spade", 5, "sha"],
			["spade", 6, "youyanbujin_yzs"], ["spade", 6, "qinggang"], ["spade", 6, "sha", "thunder"], ["spade", 6, "jiu"],
			["spade", 7, "nanman"], ["spade", 7, "sha"], ["spade", 7, "sha", "thunder"], ["spade", 7, "sha"],
			["spade", 8, "sha"], ["spade", 8, "sha"], ["spade", 8, "sha", "thunder"], ["spade", 8, "sha"],
			["spade", 9, "sha"], ["spade", 9, "sha"], ["spade", 9, "jiu"], ["spade", 9, "fanlizhimeng_yzs"],
			["spade", 10, "sha"], ["spade", 10, "sha"], ["spade", 10, "wugu"], ["spade", 10, "guowangmiling_yzs"],
			["spade", 11, "shunshou"], ["spade", 11, "wuxie"], ["spade", 11, "tiesuo"], ["spade", 11, "qianmianpianshu_yzs"],
			["spade", 12, "shandian"], ["spade", 12, "guohe"], ["spade", 12, "tiesuo"], ["spade", 12, "qianmianpianshu_yzs"],
			["spade", 13, "wugu"], ["spade", 13, "dawan"], ["spade", 13, "tiesuo"],["spade", 13, "qianmianpianshu_yzs"],

			["heart", 1, "wanjian"], ["heart", 1, "taoyuan"], ["heart", 1, "wuxie"], ["heart", 1, "shuangzishuidai_yzs"],
			["heart", 2, "shan"], ["heart", 2, "tao"], ["heart", 2, "huogong"], ["heart", 2, "shan"],
			["heart", 3, "wugu"], ["heart", 3, "tao"], ["heart", 3, "huogong"], ["heart", 3, "shan"],
			["heart", 4, "wugu"], ["heart", 4, "tao"], ["heart", 4, "sha", "fire"], ["heart", 4, "kuangchangbaozha_yzs"],
			["heart", 5, "qilin"], ["heart", 5, "chitu"], ["heart", 5, "tao"], ["heart", 5, "tao"],
			["heart", 6, "youyanbujin_yzs"], ["heart", 6, "tao"], ["heart", 6, "tao"], ["heart", 6, "fanlizhimeng_yzs"],
			["heart", 7, "wuzhong"], ["heart", 7, "tao"], ["heart", 7, "sha", "fire"], ["heart", 7, "shan"],
			["heart", 8, "wuzhong"], ["heart", 8, "tao"], ["heart", 8, "shan"], ["heart", 8, "shan"],
			["heart", 9, "wuzhong"], ["heart", 9, "tao"], ["heart", 9, "shan"], ["heart", 9, "sha"],
			["heart", 10, "tao"], ["heart", 10, "sha"], ["heart", 10, "sha", "fire"], ["heart", 10, "kuangchangbaozha_yzs"],
			["heart", 11, "wuzhong"], ["heart", 11, "sha"], ["heart", 11, "tao"], ["heart", 11, "sha"],
			["heart", 12, "guohe"], ["heart", 12, "tao"], ["heart", 12, "shan"], ["heart", 12, "shuangzishuidai_yzs"],
			["heart", 13, "shan"], ["heart", 13, "zhuahuang"], ["heart", 13, "wuxie"], ["heart", 13, "xianzheyuyan_yzs"],

			["club", 1, "weikeduofadian_yzs"], ["club", 1, "shizhongjian_yzs"], ["club", 1, "baiyin"], ["club", 1, "shengguozuzhou_yzs"],
			["club", 2, "sha"], ["club", 2, "bagua"], ["club", 2, "tengjia"], ["club", 2, "renwang"],
			["club", 3, "sha"], ["club", 3, "guohe"], ["club", 3, "jiu"], ["club", 3, "mengliaoshibian_yzs"],
			["club", 4, "guohe"], ["club", 4, "sha"], ["club", 4, "youyanbujin_yzs"], ["club", 4, "sha"],
			["club", 5, "sha"], ["club", 5, "dilu"], ["club", 5, "sha", "thunder"], ["club", 5, "guowangmiling_yzs"],
			["club", 6, "youyanbujin_yzs"], ["club", 6, "sha"], ["club", 6, "sha", "thunder"], ["club", 6, "juedou"],
			["club", 7, "nanman"], ["club", 7, "sha"], ["club", 7, "sha", "thunder"], ["club", 7, "sha"],
			["club", 8, "sha"], ["club", 8, "sha"], ["club", 8, "leisha"], ["club", 8, "jiufuxinxing_yzs"],
			["club", 9, "sha"], ["club", 9, "sha"], ["club", 9, "jiu"], ["club", 9, "sha"],
			["club", 10, "sha"], ["club", 10, "sha"], ["club", 10, "taoyuan"], ["club", 10, "wuxie"],
			["club", 11, "sha"], ["club", 11, "sha"], ["club", 11, "tiesuo"], ["club", 11, "wuxie"],
			["club", 12, "wuxie"], ["club", 12, "jiedao"], ["club", 12, "tiesuo"], ["club", 12, "sha"],
			["club", 13, "wuxie"], ["club", 13, "jiedao"], ["club", 13, "tiesuo"], ["club", 13, "xianzheyuyan_yzs"],

			["diamond", 1, "juedou"], ["diamond", 1, "weikeduofadian_yzs"], ["diamond", 1, "zhuque"], ["diamond", 1, "shuangzishuidai_yzs"],
			["diamond", 2, "shan"], ["diamond", 2, "shan"], ["diamond", 2, "tao"], ["diamond", 2, "shan"],
			["diamond", 3, "shunshou"], ["diamond", 3, "shan"], ["diamond", 3, "tao"], ["diamond", 3, "shan"],
			["diamond", 4, "shunshou"], ["diamond", 4, "shan"], ["diamond", 4, "sha", "fire"], ["diamond", 4, "shan"],
			["diamond", 5, "guanshi"], ["diamond", 5, "shan"], ["diamond", 5, "sha", "fire"], ["diamond", 5, "tao"],
			["diamond", 6, "shan"], ["diamond", 6, "sha"], ["diamond", 6, "shan"], ["diamond", 6, "sha"],
			["diamond", 7, "shan"], ["diamond", 7, "sha"], ["diamond", 7, "shan"], ["diamond", 7, "tao"],
			["diamond", 8, "sha"], ["diamond", 8, "shan"], ["diamond", 8, "shan"], ["diamond", 8, "jiufuxinxing_yzs"],
			["diamond", 9, "sha"], ["diamond", 9, "shan"], ["diamond", 9, "jiu"], ["diamond", 9, "sha"],
			["diamond", 10, "sha"], ["diamond", 10, "shan"], ["diamond", 10, "shan"], ["diamond", 10, "wuxie"],
			["diamond", 11, "shan"], ["diamond", 11, "shan"], ["diamond", 11, "huogong"], ["diamond", 11, "shengguozuzhou_yzs"],
			["diamond", 12, "fangtian"], ["diamond", 12, "shan"], ["diamond", 12, "shan"], ["diamond", 12, "wuxie"],
			["diamond", 13, "sha"], ["diamond", 13, "zixin"], ["diamond", 13, "hualiu"], ["diamond", 13, "xianzheyuyan_yzs"],
		],
	}
	lib.translate["yzs_card_config"] = "一中杀";
	lib.config.all.cards.push("yzs");
	return list
});
