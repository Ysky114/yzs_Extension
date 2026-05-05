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
	//吟唱
	yzs_countDowns: {
		mark: true,
		marktext: "吟",
		intro: {
			name: "吟唱",
			content: function (storage, player) {
				if (!player.storage.yzs_countDowns?.length) {
					return "未进行吟唱";
				}
				player.storage.yzs_countDowns.sort((a, b) => {
					if (a.num === b.num) {
						return a.prompt.localeCompare(b.prompt, "zh-CN");
					} else {
						return a.num - b.num;
					}
				});
				const list = [];
				player.storage.yzs_countDowns.forEach(item => {
					let name = `${get.translation(item.name || "吟唱")} [${get.translation(item.num)}/${get.translation(item.repeatNum)}]`;
					let str = `<li><span style='color: #f1e48e;font-weight:bold'>${name}</span><br>${item.prompt}`;
					list.push(str);
				});
				return list.join("<br>");
			},
		},
		"skill_id": "yzs_countDowns",
		"_priority": 0,
	},
	_yzs_updateCountDown: {
		ruleSkill: true,
		popup: false,
		locked: true,
		forced: true,
		charlotte: true,
		trigger: {
			player: "phaseZhunbei"
		},
		priority: -114,
		filter(event, player) {
			return true;
			return player.yzs_hasCountDown(i => !i.nocount);
		},
		async content(event, trigger, player) {
			const list = player.yzs_getCountDown(i => !i.nocount);
			await player.yzs_updateCountDown(list);
		}
	},
	//清廉剑圣
	jiansheng_yzs: {
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		group: ["jiansheng_yzs_businiao"],
		subSkill: {
			businiao: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				forced: true,
				trigger: {
					player: "businiao_yzsAfter"
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					const num = player.maxHp - player.hp;
					if (num > 0) await player.recover(num);
					await player.gainMaxHp();
					player.clearMark("businiao_yzs_used", false)
				},
			}
		},
		audio: "ext:一中杀/audio/skill:3",
		prompt: "出牌阶段限X次：你与1名其他角色拼点，胜者对败者造成1点伤害，然后败者可扣置自己全部手牌至本回合结束（X为你体力上限）",
		enable: "phaseUse",
		usable(skill, player) {
			return Math.max(player.maxHp, 1)
		},
		filter: function (event, player) {
			return game.hasPlayer(cur => cur != player && player.canCompare(cur));
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
			await players[0].damage(players[1])
			let result2 = await players[0].chooseBool(`是否扣置自己全部手牌至本回合结束？`)
				.set("ai", () => {
					return _status.event.bool;
				})
				.set(
					"bool",
					(function () {
						const player = get.event().player;
						if (!player.countCards("h", card => card.number >= 10)) return true;
						if (!player.countCards("h", { name: "shan" })) return true;
						return false;
					})()
				)
				.forResult();
			if (!result2.bool) return;
			let cards = players[0].getCards("h");
			let next = players[0].addToExpansion(cards, players[0], "giveAuto")
			next.gaintag.add("xinpojun2")
			await next;
			await players[0].addSkill("xinpojun2");
		},
		ai: {
			order: 6,
			threaten: 1.2,
			result: {
				player(player, target) {
					let v = 0;
					let cards = player.getCards("h");
					cards.map(card => {
						if (typeof card.number == "number");
						v += Math.sqrt(Math.max(card.number - 9, 0));
					})
					return v;
				},
				target(player, target) {
					if (target.countCards("h") <= 3) return get.damageEffect(target, player, target);
					return get.effect(target, { name: "guohe" }, player, target);
				}
			}
		}
	},
	jiahu_yzs: {
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		forced: true,
		init(player, skill) {
			if (player.storage.jiahu_yzs) return;
			player.storage.jiahu_yzs = {};
			const animals = ["jianshu_yzs", "jilei_yzs", "wenzhong_yzs", "businiao_yzs"]
			for (let i = 0; i < animals.length; i++) {
				let name = animals[i];
				player.storage.jiahu_yzs[name] = game.createCard(name, "", "")
			}
			player.markSkill("jiahu_yzs")
			let vcards = [];
			for (let i of animals) {
				vcards.push(player.storage.jiahu_yzs[i])
			}
			player.$gain2(vcards)
			player.addSkill(["jianshu_yzs", "jilei_yzs", "wenzhong_yzs", "businiao_yzs"]);
		},
		trigger: {
			player: "phaseBegin",
		},
		priority: -2,
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			const animals = ["jianshu_yzs", "jilei_yzs", "wenzhong_yzs", "businiao_yzs"]
			let delay = false;
			const players = game.filterPlayer(cur => !cur.hasSkill("jiahu_yzs"));
			let gain = [];
			let gain2 = [];
			for (let target of players) {
				let skills = animals.filter(i => target.hasSkill(i));
				let vcards = [];
				for (let i of skills) {
					vcards.push(player.storage.jiahu_yzs[i])
					gain2.push(player.storage.jiahu_yzs[i])
				}
				target.$throw(vcards);
				delay = true;
				await target.removeSkill(skills);
			}
			if (delay) await new Promise(r => setTimeout(r, 500))
			if (animals.some(i => !player.hasSkill(i))) {
				let skills = animals.filter(i => !player.hasSkill(i));
				for (let i of skills) {
					if (!gain2.includes(player.storage.jiahu_yzs[i])) gain.push(player.storage.jiahu_yzs[i])
				}
				if (gain.length) player.$gain(gain)
				if (gain2.length) player.$gain2(gain2)
				await player.addSkill(skills);
			}
			await player.draw(2);
			let num = player.maxHp;
			while (num > 0) {
				let nameList = [];
				for (let i of animals) {
					if (player.hasSkill(i)) nameList.push(["加护", "", i])
				}
				if (!nameList.length) return;

				let result = await player.chooseButton(["加护", [nameList, "vcard"]])
					.set("forced", true)
					.set("selectButton", [1, num])
					.set("ai", button => {
						const player = get.player();
						if (button.link[2] == "jianshu_yzs") {
							return 5
						} else if (button.link[2] == "jilei_yzs") {
							return 4
						} else if (button.link[2] == "wenzhong_yzs") {
							return 6;
						} else if (button.link[2] == "businiao_yzs") {
							if (player.maxHp < 4) return 0;
							return 4.4
						} else return 114;
					})
					.set("prompt", "选择你要给出或移除的“加护”")
					.forResult();
				if (!result.bool) return;
				let skills = [];
				let vcards = [];
				for (let link of result.links) {
					skills.push(link[2]);
					vcards.push(player.storage.jiahu_yzs[link[2]])
					num--;
				}
				let target = await player.chooseTarget("加护", `选择1名其他角色，将${get.translation(vcards)}交给其(不选则移除所选加护)`, false)
					.set("filterTarget", (card, player, target) => {
						return !(target.hasSkill("hidden_yzs")) && target != player;
					})
					.set("ai", target => {
						const player = get.player();
						return get.attitude(player, target)
					})
					.forResult()
				if (!target.bool) {
					await player.removeSkill(skills);
					player.$throw(vcards);
					continue;
				}
				target = target.targets[0];
				await player.removeSkill(skills);
				await target.addSkill(skills);
				player.$give(vcards, target);
			}
		},
		chooseButtonx(player, list) {
			const nameList = list;
			return player
				.chooseButton([
					"加护",
					[nameList, (item, type, position, noclick, node) => {
						const map = {
							"剑术": "jianshu_yzs",
							"疾雷": "jilei_yzs",
							"稳重": "wenzhong_yzs",
							"不死鸟": "businiao_yzs",
						}
						node = ui.create.buttonPresets.vcard(map[item[0]], type, position, noclick);
						node._link = node.link = item[0];
						return node;
					}]
				], true)
				.set("ai", () => 1 + Math.random());
		},
	},
	jianshu_yzs: {
		nobracket: true,
		group: "jianshu_yzs_renew",
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					if (event.skill) return false;
					return true;
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.clearMark("jianshu_yzs_used", false)
				},
				"skill_id": "jianshu_yzs_renew",
				sub: true,
				sourceSkill: "jianshu_yzs",
				"_priority": 2,
			},
		},
		direct: true,
		popup: true,
		priority: 21,
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			return event.card.name === 'sha' && !player.countMark("jianshu_yzs_used");
		},
		async content(event, trigger, player) {
			player.addMark("jianshu_yzs_used", 1, false);
			trigger.directHit.addArray(game.players)
		},
	},
	jilei_yzs: {
		nobracket: true,
		mod: {
			globalTo: function (from, to, distance) {
				return distance + 1;
			},
			globalFrom: function (from, to, distance) {
				return distance - 1;
			},
		}
	},
	wenzhong_yzs: {
		nobracket: true,
		priority: 213,
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
		mod: {
			maxHandcardBase: function (player, num) {
				return num + 2;
			},
		},
	},
	businiao_yzs: {
		nobracket: true,
		group: "businiao_yzs_renew",
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					if (event.skill) return false;
					return true;
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.clearMark("businiao_yzs_used", false)
				},
				"skill_id": "businiao_yzs_renew",
				sub: true,
				sourceSkill: "businiao_yzs",
				"_priority": 3,
			},
		},
		direct: true,
		popup: true,
		priority: 21,
		trigger: {
			player: "dying"
		},
		filter(event, player) {
			return !player.countMark("businiao_yzs_used");
		},
		async content(event, trigger, player) {
			player.addMark("businiao_yzs_used", 1, false)
			await player.recover();
		},
	},
	//人皇
	shengyu_yzs: {
		group: ["shengyu_yzs_start", "shengyu_yzs_targeted", "shengyu_yzs_use", "shengyu_yzs_respond"],
		subSkill: {
			use: {
				locked: true,
				name: "圣谕",
				enable: ["chooseToUse"],
				hiddenCard(player, name) {
					if (name != "shan" && name != "wuxie") return false;
					let cards = player.getExpansions("shengyu_yzs");
					if (cards.some(card => card.name == name)) {
						return true;
					}
				},
				filter(event, player) {
					let cards = player.getExpansions("shengyu_yzs");
					let evt = event.getParent(1);
					if (evt.shengyu_yzs) return false;
					if (evt && evt.name == "_wuxie" && cards.some(card => event.filterCard(card, player, event))) return true;
					evt = event.getParent(2);
					if (!evt || evt.name != "useCard") return false;
					if (evt.shengyu_yzs) return false;
					if (!event.respondTo) return false;
					if (event.responded || event.shengyu_yzs_use) {
						return false;
					}
					return cards.some(card => event.filterCard(card, player, event))
				},
				chooseButton: {
					dialog(event, player) {
						const ups = player.getExpansions("shengyu_yzs");
						const downs = player.getExpansions("shengyu_yzs_down");
						return ui.create.dialog("请选择要移去的明置【谕】，若可用之响应则视为响应之并翻转1张【谕】<br>明置的【谕】", ups, "暗置的【谕】", downs, "hidden");
					},
					filter(button, player) {
						if (!button.link.hasGaintag("shengyu_yzs")) return false;
						const evt = _status.event.getParent();
						return evt.filterCard(button.link, player, evt);
					},
					check(button) {
						const card = button.link,
							player = get.player();
						if (card.hasGaintag("shengyu_yzs")) return player.getUseValue(card);
						return 7-get.value(card,player)
					},
					backup(links, player) {
						return {
							filterCard: () => false,
							selectCard: -1,
							popname: true,
							viewAs: links[0],
							card: links[0],
							async precontent(event, trigger, player) {
								let card = lib.skill.shengyu_yzs_use_backup.card
								if (!card.hasGaintag("shengyu_yzs")) {
									await player.loseToDiscardpile(card);
									if (player.hasSkill("caijue_yzs")) {
										await player.draw();
									}
									const evt = event.getParent();
									evt.goto(0);
									delete evt.openskilldialog;
									return;
								}
								await player.loseToDiscardpile(card);
								if (player.hasSkill("caijue_yzs")) {
									await player.draw();
								}
								delete event.result.skill;
								event.result.cards = [];
								const ups = player.getExpansions("shengyu_yzs");
								const downs = player.getExpansions("shengyu_yzs_down");
								if (!ups.length && !downs.length) return;
								const result = await player
									.chooseButton(["请选择要翻转的【谕】<br>明置的【谕】", ups, "暗置的【谕】", downs], 1, true)
									.set("filterButton", function (button) {
										return true
									})
									.set("ai",button=>get.value(button))
									.forResult();
								if (!result.bool) return;
								let tag = result.links[0].hasGaintag("shengyu_yzs") ? "shengyu_yzs_down" : "shengyu_yzs"
								await player.loseToSpecial(result.links);
								let next = player.addToExpansion(result.links, player, "gain2")
								next.gaintag.add(tag);
								next.untrigger(true);
								await next;
							}
						};
					},
					prompt(links, player) {
						return "圣谕：请选择" + get.translation(links[0]) + "的目标";
					},
				}
			},
			respond: {
				locked: true,
				name: "圣谕",
				enable: ["chooseToRespond"],
				hiddenCard(player, name) {
					let cards = player.getExpansions("shengyu_yzs");
					if (cards.some(card => card.name == name)) {
						return true;
					}
				},
				filter(event, player) {
					const evt = event.getParent(2);
					if (!evt || evt.name != "useCard") return false;
					if (evt.shengyu_yzs) return false;
					if (event.responded || event.shengyu_yzs_respond) {
						return false;
					}
					let cards = player.getExpansions("shengyu_yzs");
					return cards.some(card => event.filterCard(card, player, event));
				},
				chooseButton: {
					dialog(event, player) {
						const ups = player.getExpansions("shengyu_yzs");
						const downs = player.getExpansions("shengyu_yzs_down");
						return ui.create.dialog("请选择要移去的明置【谕】，若可用之响应则视为响应之并翻转1张【谕】<br>明置的【谕】", ups, "暗置的【谕】", downs, "hidden");
					},
					filter(button, player) {
						if (!button.link.hasGaintag("shengyu_yzs")) return false;
						const evt = _status.event.getParent();
						return evt.filterCard(button.link, player, evt);
					},
					check(button) {
						const card = button.link,
							player = get.player();
						if (card.hasGaintag("shengyu_yzs")) return player.getUseValue(card);
						return 7 - get.value(card, player)
					},
					backup(links, player) {
						return {
							filterCard: () => false,
							selectCard: -1,
							popname: true,
							viewAs: links[0],
							card: links[0],
							async precontent(event, trigger, player) {
								let card = lib.skill.shengyu_yzs_respond_backup.card;
								if (!card.hasGaintag("shengyu_yzs")) {
									await player.loseToDiscardpile(card);
									if (player.hasSkill("caijue_yzs")) {
										await player.draw();
									}
									const evt = event.getParent();
									evt.goto(0);
									delete evt.openskilldialog;
									return;
								}
								await player.loseToDiscardpile(card);
								if (player.hasSkill("caijue_yzs")) {
									await player.draw();
								}
								delete event.result.skill;
								event.result.cards = [];
								const ups = player.getExpansions("shengyu_yzs");
								const downs = player.getExpansions("shengyu_yzs_down");
								if (!ups.length && !downs.length) return;
								const result = await player
									.chooseButton(["请选择要翻转的【谕】<br>明置的【谕】", ups, "暗置的【谕】", downs], 1, true)
									.set("filterButton", function (button) {
										return true
									})
									.set("ai", button => get.value(button))
									.forResult();
								if (!result.bool) return;
								let tag = result.links[0].hasGaintag("shengyu_yzs") ? "shengyu_yzs_down" : "shengyu_yzs"
								await player.loseToSpecial(result.links);
								let next = player.addToExpansion(result.links, player, "gain2")
								next.gaintag.add(tag);
								next.untrigger(true);
								await next;
							}
						};
					},
					prompt(links, player) {
						return "圣谕：请选择" + get.translation(links[0]) + "的目标";
					},
				}
			},
			targeted: {
				priority: 129,
				locked: true,
				trigger: {
					target: "useCardToTargeted",
				},
				filter(event, player) {
					if (event.targets?.length != 1) return false;
					return true;
				},
				async cost(event, trigger, player) {
					const ups = player.getExpansions("shengyu_yzs");
					const downs = player.getExpansions("shengyu_yzs_down");
					const result = await player
						.chooseButton(["请选择要移去的【谕】，若之明置则视为使用之<br>明置的【谕】", ups, "暗置的【谕】", downs], 1, false)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai", button => {
							const card = button.link,
								player = get.player();
							if (card.hasGaintag("shengyu_yzs")) return player.getUseValue(card);
							return 7 - get.value(card, player)
						})
						.forResult();
					if (!result.bool) return false
					event.result = {
						bool: true,
						cost_data: result.links,
					}
				},
				async content(event, trigger, player) {
					let card = event.cost_data[0];
					if (!card.hasGaintag("shengyu_yzs") || !player.hasUseTarget({ name: card.name })) {
						await player.loseToDiscardpile(card);
						if (player.hasSkill("caijue_yzs")) {
							await player.draw();
						}
						const evt = trigger.getParent();
						evt.shengyu_yzs = true;
						return;
					}
					await player.loseToDiscardpile(card);
					if (player.hasSkill("caijue_yzs")) {
						await player.draw();
					}
					const evt = trigger.getParent();
					evt.shengyu_yzs = true;
					game.log(evt.name)
					await player.chooseUseTarget({ name: card.name }, true, false, "nodistance")
						.set("prompt", "圣谕")
						.set("prompt2", "视为使用" + get.translation(card.name))
				},
				"skill_id": "shengyu_yzs_targeted",
			},
			start: {
				priority: -129,
				locked: true,
				forced: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0)
				},
				async content(event, trigger, player) {
					let cards = player.getExpansions("shengyu_yzs");
					cards.addArray(player.getExpansions("shengyu_yzs_down"));
					if (cards.length) {
						await player.loseToDiscardpile(cards);
						await player.draw();
					}
					cards = get.cards(6);
					let next = player.addToExpansion(cards, "draw", player)
					next.gaintag.add("shengyu_yzs_down");
					await next;
				},
			},
		},
		locked: true,
		forced: true,
		mark: true,
		marktext: "谕",
		intro: {
			mark(dialog, content, player) {
				const ups = player.getExpansions("shengyu_yzs");
				const downs = player.getExpansions("shengyu_yzs_down");
				if (!ups.length && !downs.length) return "无【谕】";
				if (downs.length) {
					if (player.isUnderControl(true)) {
						dialog.addText("暗置的【谕】：");
						dialog.addAuto(downs);
					} else {
						dialog.addText("共有" + get.cnNumber(downs.length) + "张暗置的【谕】");
					}
				} else {
					dialog.addText("无暗置的【谕】");
				}
				if (ups.length) {
					dialog.addText("明置的【谕】：");
					dialog.addAuto(ups);
				}
			},
		},
		priority: -129,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			return player.getHistory("useSkill", evt => evt.skill == "caijue_yzs").length;
		},
		async content(event, trigger, player) {
			let cards = player.getExpansions("shengyu_yzs");
			cards.addArray(player.getExpansions("shengyu_yzs_down"));
			if (cards.length) {
				await player.loseToDiscardpile(cards);
				await player.draw();
			}
			cards = get.cards(6);
			let next = player.addToExpansion(cards, "draw", player)
			next.gaintag.add("shengyu_yzs_down");
			await next;
		},
	},
	yuanzheng_yzs: {
		group: ["yuanzheng_yzs_damage", "yuanzheng_yzs_mark", "yuanzheng_yzs_mark2"],
		subSkill: {
			damage: {
				priority: 129,
				locked: true,
				forced: true,
				trigger: {
					player: ["damageBegin4"],
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					player.addMark("yuanzheng_yzs_mark", 1, false)
				}
			},
			mark: {
				priority: 129,
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseUseBegin"
				},
				async content(event, trigger, player) {
					player.setMark("yuanzheng_yzs", player.countMark("yuanzheng_yzs_mark"), false)
					player.clearMark("yuanzheng_yzs_mark", false)
				},
				charlotte: true,
				sub: true,
				sourceSkill: "yuanzheng_yzs",
			},
			mark2: {
				priority: 129,
				charlotte: true,
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseUseEnd"
				},
				async content(event, trigger, player) {
					player.clearMark("yuanzheng_yzs", false)
				},
				sub: true,
				sourceSkill: "yuanzheng_yzs",
			},
		},
		locked: true,
		prompt: `你扣置1张手牌并给予1名其他角色1张暗置【谕】，然后其弃1张手牌<br>然后你展示扣置牌，若之与所弃牌花色相同，其获得之；否则将之明置为【谕】，并令其选择弃2张牌或失去1点体力`,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.countCards("h") || !player.countExpansions("shengyu_yzs_down")) return false;
			return (player.getStat('skill').yuanzheng_yzs || 0) < player.countMark("yuanzheng_yzs") + 1;
		},
		filterCard: true,
		position: "h",
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs") && player != target;
		},
		selectTarget: 1,
		discard: false,
		lose: false,
		delay: 0,
		check(card) {
			const player = get.player();
			return 6-get.value(card,player)
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			const card = event.cards[0];
			let next = await player.lose(card, ui.ordering);
			const downs = player.getExpansions("shengyu_yzs_down");
			let result = await player
				.chooseButton(["给予1名" + get.translation(target) + "1张暗置【谕】", downs], 1, true)
				.set("filterButton", function (button) {
					return true
				})
				.set("ai", button => {
					return 7-get.value(button)
				})
				.forResult();
			if (!result.bool) return
			await player.give(result.links[0], target);
			if (!target.countDiscardableCards(target, "h")) {
				next = player.addToExpansion(card, "gain2", player)
				next.gaintag.add("shengyu_yzs");
				await next;
				result =
					target.countCards("he") < 2
						? { bool: false }
						: await target
							.chooseToDiscard(2, `弃置2张牌，否则失去1点体力`, "he")
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
					await target.loseHp();
				};
				return;
			}
			result = await target.chooseToDiscard(1, `弃1张手牌，若与 ` + get.translation(player) + ` 扣置的牌花色相同，你获得其扣置的牌，否则你弃2张牌或失去1点体力`, "h", true).forResult();
			await player.showCards(result.cards ? [card].concat(result.cards) : [card], `扣置的牌${result.cards?.length ? "和弃置的牌" : ""}`);
			if (!result.bool || result.cards[0].suit != card.suit) {
				next = player.addToExpansion(card, "gain2", player)
				next.gaintag.add("shengyu_yzs");
				await next;
				result =
					target.countCards("he") < 2
						? { bool: false }
						: await target
							.chooseToDiscard(2, `弃置2张牌，否则失去1点体力`, "he")
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
					await target.loseHp();
				};
				return;
			}
			await target.gain(card);
		},
		ai: {
			order: 7,
			result: {
				target:-2,
			},
			expose: 0.4,
			threaten:1.5
		}
	},
	caijue_yzs: {
		group: "caijue_yzs_remove",
		subSkill: {
			remove: {
				priority: 129,
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseJieshuBegin"
				},
				filter(event, player) {
					return player.hasSkill("caijue_yzs_buff");
				},
				async content(event, trigger, player) {
					await player.removeSkill("caijue_yzs_buff");
					for (let target of game.filterPlayer(i => i.countMark("caijue_yzs_buff"))) {
						const num = target.countMark("caijue_yzs_buff");
						target.clearMark("caijue_yzs_buff", false)
						await target.yzs_loseMinHp(num);
					}
				}
			},
		},
		locked: true,
		enable: "phaseUse",
		skillAnimation: "epic",
		animationColor: "fire",
		filter(event, player) {
			if (player.hasSkill("caijue_yzs_buff")) return false;
			const ups = player.getExpansions("shengyu_yzs");
			const downs = player.getExpansions("shengyu_yzs_down");
			return ups.length && !downs.length;
		},
		async content(event, trigger, player) {
			await player.addSkill("caijue_yzs_buff")
			const ups = player.getExpansions("shengyu_yzs");
			const downs = player.getExpansions("shengyu_yzs_down");
			let x = ups.length + downs.length;
			var num = x - player.countCards("h");
			if (num > 0) {
				await player.draw(num);
			} else if (num < 0) {
				await player.chooseToDiscard("h", true, -num, "allowChooseAll");
			}
			if (x >= 4) {
				game.broadcastAll(function (current) {
					_status.tempMusic = `ext:一中杀/audio/KING.mp3`;
					game.playBackgroundMusic();

					var background = document.createElement("img");
					background.className = "background";
					window._currentDynamicBackground = background;
					Object.assign(background, {
						src: lib.assetURL + "/extension/一中杀/image/background/caijue_yzs.png",
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

						background.style.opacity = "0";
						setTimeout(() => {
							document.body.removeChild(background);
						}, 1000)//1s后移除视频

					}, { once: true });
				}, player)
			}
			for (let target of game.filterPlayer(i => i != player)) {
				target.addMark("caijue_yzs_buff", 1, false)
				await target.yzs_gainMinHp();
			}
		},
		ai: {
			order: 10,
			result: {
				player:2,
			}
		}
	},
	caijue_yzs_buff: {
		nopop: true,
		group: "caijue_yzs_buff_sha",
		subSkill: {
			sha: {
				priority: 129,
				locked: true,
				popup: false,
				trigger: {
					player: "useCard0"
				},
				filter(event, player) {
					return event.card.name == "sha"
				},
				async cost(event, trigger, player) {
					const ups = player.getExpansions("shengyu_yzs");
					const downs = player.getExpansions("shengyu_yzs_down");
					if (!ups.length && !downs.length) return false;
					const result = await player
						.chooseButton(["请选择要移去的【谕】<br>明置的【谕】", ups, "暗置的【谕】", downs], 1, true)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai",button=>7-get.value(button))
						.forResult();
					if (!result.bool) return false
					event.result = {
						bool: true,
						cost_data: result.links,
					}
				},
				async content(event, trigger, player) {
					let card = event.cost_data[0];
					await player.loseToDiscardpile(card);
					await player.draw();
				},
			},
		},
		priority: 129,
		locked: true,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		filter(event, player) {
			const ups = player.getExpansions("shengyu_yzs");
			const downs = player.getExpansions("shengyu_yzs_down");
			let num = ups.length + downs.length;
			if (player.countCards("h") == num) return false;
			var evt = event;
			for (var i = 0; i < 4; i++) {
				evt = evt.getParent("caijue_yzs_buff");
				if (evt.name != "caijue_yzs_buff") {
					return true;
				}
			}
			return false;
		},
		async content(event, trigger, player) {
			const ups = player.getExpansions("shengyu_yzs");
			const downs = player.getExpansions("shengyu_yzs_down");
			let x = ups.length + downs.length;
			var num = x - player.countCards("h");
			if (num > 0) {
				await player.draw(num);
			} else {
				await player.chooseToDiscard("h", true, -num, "allowChooseAll");
			}
		},
		mod: {
			cardEnabled(card, player) {
				const ups = player.getExpansions("shengyu_yzs");
				const downs = player.getExpansions("shengyu_yzs_down");
				if (card.name == "sha" && !ups.length && !downs.length) return false;
			},
			targetInRange: function (card) {
				return true;
			},
			cardUsable: function (card, num) {
				return Infinity;
			},
		},
		ai: {
			freeSha: true,
			freeShan: true,
			skillTagFilter() {
				return true;
			},
		},
		"skill_id": "caijue_yzs_buff",
		"_priority": 0,
	},
	tongshe_yzs: {
		locked: true,
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name == "tongshe_yzs")) player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let cards = get.cards(1);
						let next = player.addToExpansion(cards, "draw", player)
						next.gaintag.add("shengyu_yzs_down");
						await next;
						if (player.hujia > 0) {
							await player.damage("nosource", "nocard");
						}
						await player.changeHujia(1);
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "tongshe_yzs",
				prompt: `你将牌堆顶牌暗置为【谕】。然后若你有护甲，受到1点无来源伤害。无论如何你获得1点护甲`,
				skill: "tongshe_yzs"
			});
		}
	},
	//咲延
	Calibration_yzs: {
		group: "Calibration_yzs_damage",
		subSkill: {
			damage: {
				locked: true,
				priority: 12,
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: "damageAfter"
				},
				filter(event, player) {
					let sings = player.yzs_getCountDown(i => player.hasSkill(i.skill))
					const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
					if (!list.length) return false;
					return event.num > 0;
				},
				async cost(event, trigger, player) {
					let sings = player.yzs_getCountDown(i => player.hasSkill(i.skill))
					const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
					let result = await player
						.chooseButton([`校时：你可令1个你技能产生的吟唱-1` + _status.currentPhase == player ? `，然后你恢复1点体力` : ``, [list, "textbutton"]], false)
						.set("ai", button => {
							const { owner, player } = get.event();
							return get.cdValue(button.link, owner) * get.attitude(player, owner);
						})
						.set("selectButton", 1)
						.set("owner", player)
						.forResult()
					if (!result.bool) return false;
					event.result = {
						bool: true,
						cost_data: result.links[0]
					};
				},
				async content(event, trigger, player) {
					await player.yzs_updateCountDown(event.cost_data);
					if (_status.currentPhase == player) await player.recover();
				},
			},
		},
		locked: true,
		forced: true,
		priority: 12,
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "phaseJieshuBegin"
		},
		filter(event, player) {
			let sings = player.yzs_getCountDown(i => player.hasSkill(i.skill))
			const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
			return list.length;
		},
		async content(event, trigger, player) {
			let sings = player.yzs_getCountDown(i => player.hasSkill(i.skill))
			const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
			let result = await player
				.chooseButton([`校时：你可令任意个你技能产生的吟唱-1`, [list, "textbutton"]], false)
				.set("ai", button => {
					const { owner, player } = get.event();
					return get.cdValue(button.link, owner) * get.attitude(player, owner);
				})
				.set("selectButton", [1, Infinity])
				.set("owner", player)
				.forResult()
			if (!result.bool) return;
			await player.yzs_updateCountDown(result.links);
		},
	},
	TimeBomb_yzs: {
		nobracket: true,
		locked: true,
		init: function (player, skill) {
			if (!player.yzs_hasCountDown(i => i.name == "TimeBomb_yzs")) player.yzs_setCountDown({
				num: 3,
				repeatNum: 3,
				command: {
					async todo(player) {
						var damageAudioInfo = "ext:一中杀/audio/skill/TimeBomb_yzs";
						const index = 2;
						damageAudioInfo += index + ".mp3";
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, damageAudioInfo);
						if (!_status.currentPhase) return;
						let result = await player
							.chooseButton([`对${get.translation(_status.currentPhase)}造成1点伤害，或令其恢复1点体力`, [["伤害", "回血"], "tdnodes"]])
							.set("filterButton", button => {
								return true;
							})
							.set("forced", true)
							.forResult()
						if (!result.bool) return false;
						if (result.links[0] == "伤害") {
							await _status.currentPhase.damage(player)
						} else {
							await _status.currentPhase.recover(player)
						}
					},
					list: [player],
				},
				value(item, player) {
					return 3;
				},
				name: "TimeBomb_yzs",
				prompt: `你令当前回合角色受到1点伤害或恢复1点体力`,
				skill: "TimeBomb_yzs"
			});
		},
		priority: 12,
		trigger: {
			source: "damageBegin2",
		},
		prompt2(event, player) {
			return `你可防止对${get.translation(event.player)}造成的伤害，然后令其获得：<br>吟唱1：受到1点伤害，然后失去本吟唱`
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await trigger.player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				once: true,
				command: {
					async todo(player, source) {
						await player.damage(source)
					},
					list: [trigger.player, player],
				},
				value(item, player) {
					return 3;
				},
				name: "TimeBomb_yzs",
				prompt: `受到1点伤害，然后失去本吟唱`,
				skill: "TimeBomb_yzs"
			});
		}
	},
	TimeMachine_yzs: {
		nobracket: true,
		locked: true,
		init: function (player, skill) {
			if (!player.yzs_hasCountDown(i => i.name == "TimeMachine_yzs")) player.yzs_setCountDown({
				num: 3,
				repeatNum: 3,
				command: {
					async todo(player) {
						var damageAudioInfo = "ext:一中杀/audio/skill/TimeMachine_yzs";
						const index = 2;
						damageAudioInfo += index + ".mp3";
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, damageAudioInfo);
						let result = await player.chooseTarget("时间机器", `你调离任意角色至本回合结束。若其为当前回合角色，其先摸2张牌；若否，你摸2张牌或制作1枚${get.poptip("Totem_yzs")}`, true)
							.set("filterTarget", (card, player, target) => {
								return !(target.hasSkill("hidden_yzs"));
							})
							.forResult()
						if (!result.bool) return false;
						if (result.targets[0] == _status.currentPhase) {
							await result.targets[0].draw(2);
						} else {
							let result2 = await player
								.chooseButton([`你摸2张牌或制作1枚${get.poptip("Totem_yzs")}`, [["摸牌", "图腾"], "tdnodes"]])
								.set("filterButton", button => {
									return true;
								})
								.set("forced", true)
								.forResult()
							if (!result2.bool) return false;
							if (result2.links[0] == "摸牌") {
								await player.draw(2);
							} else {
								player.addMark("Totem_yzs");
							}
						}
						result.targets[0].addTempSkill("diaohulishan");
					},
					list: [player],
				},
				value(item, player) {
					return 3;
				},
				name: "TimeMachine_yzs",
				prompt: `你调离任意角色至本回合结束。若其为当前回合角色，其先摸2张牌；若否，你摸2张牌或制作1枚${get.poptip("Totem_yzs")}`,
				skill: "TimeMachine_yzs"
			});
		},
		audio: "ext:一中杀/audio/skill:1",
		priority: 12,
		trigger: {
			source: "damageAfter"
		},
		filter(event, player) {
			let sings = player.yzs_getCountDown(i => i.skill != "TimeMachine_yzs")
			const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
			return list.length;
		},
		async cost(event, trigger, player) {
			let sings = player.yzs_getCountDown(i => i.skill != "TimeMachine_yzs")
			const list = sings.map(item => [item, `${get.translation(item.name)}[${item.num}/${item.repeatNum}]：${item.prompt}`]);
			let result = await player
				.chooseButton([`你可令1个你非本技能产生的吟唱-1`, [list, "textbutton"]], false)
				.set("ai", button => {
					const { owner, player } = get.event();
					return get.cdValue(button.link, owner) * get.attitude(player, owner);
				})
				.set("selectButton", 1)
				.set("owner", player)
				.forResult()
			if (!result.bool) return false;
			event.result = {
				bool: true,
				cost_data: result.links[0]
			};
		},
		async content(event, trigger, player) {
			await player.yzs_updateCountDown(event.cost_data);
		},
	},
	//恋人W
	AiMu_yzs: {
		mod: {
			targetEnabled(card, player, target, now) {
				if (get.tag(card, "damage") && player.hasSkill("AiMu_yzs") && player != target) {
					return false;
				}
			},
		},
		priority: 9,
		trigger: {
			target: "useCardToTarget",
		},
		audio: "ext:一中杀/audio/skill:2",
		preHidden: true,
		filter(event, player) {
			if (player.getStat('triggerSkill').AiMu_yzs > 0 && !player.hasSkill("AiSi_yzs")) {
				return false;
			};
			if (!get.tag(event.card, "damage")) {
				return false;
			}
			return game.hasPlayer(current => {
				return current != player && current.hasSkill("AiMu_yzs") && !event.getParent()?.targets?.includes(current)
			});
		},
		async cost(event, trigger, player) {
			const evt = trigger.getParent();
			event.result = await player
				.chooseTarget()
				.set("filterTarget", (card, player, target) => {
					if (get.event().targets.includes(target)) return false;
					return target != player && target.hasSkill("AiMu_yzs");
				})
				.set("ai", target => {
					const player = get.player();
					let att = get.attitude(player, target)
					if (att > 0) {
						return target.countCards("h") + 2 - player.countCards("h") + target.hp - player.hp;
					} else {
						return -att
					}
				})
				.set("targets", evt.targets)
				.set("prompt2", "令1名有本技能的其他角色摸1张牌并将" + get.translation(trigger.card) + "的目标转移给其")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			await target.draw();
			const evt = trigger.getParent();
			evt.triggeredTargets2.remove(player);
			evt.targets.remove(player);
			evt.targets.push(target);
		},
	},
	AiSi_yzs: {
		locked: true,
		group: "AiSi_yzs_give",
		mark: true,
		markimage: 'extension/一中杀/image/AiSi_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, storage, player) {
				var cards = player.getExpansions("AiSi_yzs");
				dialog.addAuto(cards);
			},
		},
		subSkill: {
			temp: {
				charlotte: true,
				popup: false,
				forced: true,
				priority: 169,
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: "phaseEnd"
				},
				filter(event, player) {
					return player.storage.AiSi_yzs_list.length
				},
				async content(event, trigger, player) {
					for (let obj of player.storage.AiSi_yzs_list) {
						if (obj[1] <= 0) continue;
						obj[1]--;
						if (obj[1] > 0) continue;
						game.countPlayer(current => current.removeAdditionalSkills("AiSi_yzs" + obj[0]));
					}
					player.storage.AiSi_yzs_list = player.storage.AiSi_yzs_list.filter(obj => obj[1] > 0)
					player.markSkill("AiSi_yzs_list")
				},
			},
			give: {
				priority: 6,
				locked: true,
				audio: "ext:一中杀/audio/skill:2",
				trigger: {
					player: "useCardToPlayered",
					target: "useCardToTargeted",
				},
				filter(event, player) {
					if (event.targets?.length != 1) return false;
					if (!event.cards || !event.cards.length) return false;
					if (player.hasSkill("AiSi_yzs_give2")) return false
					player.addTempSkill("AiSi_yzs_give2");
					if (player.countExpansions("AiSi_yzs") >= 4) return false;
					return true;
				},
				async cost(event, trigger, player) {
					event.result = await trigger.player.chooseBool("是否将 " + get.translation(trigger.cards) + " 置为 " + get.translation(player) + " 的【爱意】？")
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								const player = get.event().player;
								const target = get.event().target;
								if (get.attitude(player, target) > 0) return true;
								return false;
							})()
						)
						.set("target", player)
						.forResult();
				},
				async content(event, trigger, player) {
					let next = player.addToExpansion(trigger.cards, "gain2", player)
					next.gaintag.add("AiSi_yzs");
					await next;
				},
			},
			give2: {
				charlotte: true,
			},
		},
		priority: 9,
		audio: "ext:一中杀/audio/skill:1",
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			if (!player.countExpansions("AiSi_yzs")) return false;
			return game.hasPlayer(current => {
				return !current.hasSkill("AiMu_yzs") && !current.hasSkill("hidden_yzs")
			});
		},
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "锁定技", "转换技", "蓄力技", "蓄能技", "连招技"],
		chooseButton: {
			dialog(event, player) {
				let cardx = player.getExpansions("AiSi_yzs")
				let dialog = ui.create.dialog("你获得任意张花色各异的【爱意】，然后复制1名无【爱慕】的角色角色牌上的通常技至你下一回合结束", "若获得4张，再对其造成其体力值点伤害", cardx);
				return dialog;
			},
			select: [1, Infinity],
			filter: function (button, player) {
				if (!ui.selected.buttons.length) {
					return true
				} else {
					let suits = [];
					for (let card of ui.selected.buttons) {
						if (!suits.includes(card.suit)) {
							suits.push(card.suit);
						}
					}
					return !suits.includes(button.link.suit)
				}
			},
			check(button) {
				return get.value(button)
			},
			backup(links, player) {
				return {
					name: "爱思",
					cards: links,
					filterCard(card) {
						return lib.skill.AiSi_yzs_backup.cards.includes(card);
					},
					filterTarget(card, player, target) {
						if (target.hasSkill("AiMu_yzs")) return false;
						if (target.hasSkill("hidden_yzs")) return false;
						return true;
					},
					selectCard: -1,
					discard: false,
					lose: false,
					position: "x",
					async content(event, trigger, player) {
						var cards = lib.skill.AiSi_yzs_backup.cards;
						await player.gain(cards);
						var damageAudioInfo = "ext:一中杀/audio/skill/AiSi_yzs";
						const index = cards.length >= 4 ? 1 : 2;
						damageAudioInfo += index + ".mp3";
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, damageAudioInfo);
						let skills = lib.character[event.target.name][3].filter(skill => {
							const categories = get.skillCategoriesOf(skill, player);
							return !categories.some(type => lib.skill.AiSi_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
						});
						let id = Math.random().toString(36).slice(-8);
						if (!player.storage.AiSi_yzs_list) player.storage.AiSi_yzs_list = [];
						player.storage.AiSi_yzs_list.push([id, 2])
						player.markSkill("AiSi_yzs_list")
						if (skills.length) {
							await player.addAdditionalSkills("AiSi_yzs" + id, skills, true);
						}
						await event.target.addAdditionalSkills("AiSi_yzs" + id, "AiMu_yzs", true);
						await player.addSkill("AiSi_yzs_temp")
						player.addMark("AiSi_yzs_temp", 2, false)
						if (cards.length >= 4) {
							await event.target.damage(event.target.hp);
						}
					},
					ai: {
						order: 8,
						result: {
							player(player, target) {
								return 2;
							},
							target(player, target) {
								return get.attitude(player, target) * Math.max(target.hp, 1);
							}
						},
						expose: 0.3,
						threaten: 1.2
					},
				}
			},
			prompt: "你获得任意张花色各异的【爱意】，然后复制1名其他角色角色牌上的通常技至你下一回合结束<br>若获得4张，再对其造成其体力值点伤害",
		},
		ai: {
			order: 8,
			result: {
				player(player, target) {
					return 2;
				},
				target(player, target) {
					return get.attitude(player, target) * Math.max(target.hp, 1);
				}
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	//芙莉莲
	tonglv_yzs: {
		locked: true,
		priority: 32,
		group: ["tonglv_yzs_start", "tonglv_yzs_kiss", "tonglv_yzs_mark"],
		subSkill: {
			kiss: {
				audio: "ext:一中杀/audio/skill:1",
				name: "飞吻",
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					return game.hasPlayer(cur => !cur.hasSkill("hidden_yzs") && player != cur)
				},
				prompt: "抛一个飞吻(对勇者特攻！)",
				filterTarget: function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && player != target
				},
				selectTarget: 1,
				async content(event, trigger, player) {
					game.broadcastAll((func, player, target) => {
						func(player, target);
						game.playAudio("effect", "throw_" + "flower" + get.rand(1, 2));
					}, lib.skill.tonglv_yzs.Effect, player, event.target);
					await new Promise(r => setTimeout(r, 1000))
					if (get.translation(event.target).includes("赛丽艾")) {
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/tonglv_yzs_Serie.mp3");
						});
					} else if (get.translation(event.target).includes("辛美尔")) {
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/tonglv_yzs_kiss_himmel.mp3");
						});
						await event.target.loseHp();
						await event.target.draw(2);
					}
				},
				ai: {
					order: 114,
					result: {
						target:1,
					},
				}
			},
			start: {
				popup: false,
				priority: -32,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				locked: true,
				forced: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (current) {
						_status.tempMusic = `ext:一中杀/audio/勇者.mp3`;
						game.playBackgroundMusic();

						var background = document.createElement("img");
						background.className = "background";
						window._currentDynamicBackground = background;
						Object.assign(background, {
							src: lib.assetURL + "/extension/一中杀/image/background/tonglv_yzs_start.png",
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
					}, player);
					await new Promise(r => setTimeout(r, 1000))
					if (game.hasPlayer(cur => get.translation(cur).includes("辛美尔"))) {
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Himmel_yzs_tonglv_yzs.png");
						}, game.filterPlayer(cur => cur.name == "Himmel_yzs")[0])
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Frieren_yzs_tonglv_yzs.png");
							ui.background.setBackgroundImage('extension/一中杀/image/background/tonglv_yzs2.jpg');
						}, player)
					} else if (game.hasPlayer(cur => get.translation(cur).includes("菲伦")) || game.hasPlayer(cur => ["休塔尔克", "修塔尔克"].includes(get.translation(cur)))) {
						game.broadcastAll(function (current) {
							ui.background.setBackgroundImage('extension/一中杀/image/background/tonglv_yzs3.jpg');
						}, player)
					}
					await player.chooseUseTarget(true, { name: "wugu", isCard: true });
					//player.markAuto("cangfa_yzs", "taoyuan")
					await player.chooseUseTarget(true, { name: "taoyuan", isCard: true });
				}
			},
			mark: {
				forced: true,
				popup: false,
				locked: true,
				priority: 32,
				usable: 1,
				trigger: {
					global: "useCardToTargeted",
				},
				filter(event, player) {
					if (event.target != player.storage.tonglv_yzs) return false;
					if (get.type(event.card) != "trick") return false;
					if (player == event.player || event.getParent().targets.includes(player)) return false;
					return true;
				},
				async content(event, trigger, player) {
					await player.draw()
					trigger.getParent().targets.add(player);
				}
			}
		},
		Effect: function (player, target) {
			// 1. 获取位置信息
			const rectSource = player.getBoundingClientRect();
			const rectTarget = target.getBoundingClientRect();

			// 计算中心点
			const startX = rectSource.left + rectSource.width / 2;
			const startY = rectSource.top + rectSource.height / 2;
			const endX = rectTarget.left + rectTarget.width / 2;
			const endY = rectTarget.top + rectTarget.height / 2;

			// 2. 创建爱心容器（挂载到 body 以免受父级 overflow 限制）
			const heartContainer = document.createElement('div');
			heartContainer.className = 'heart-toss-effect';

			Object.assign(heartContainer.style, {
				position: 'fixed',
				left: `${startX}px`,
				top: `${startY}px`,
				width: '60px',
				height: '60px',
				zIndex: '2000',
				pointerEvents: 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			});

			// 3. 创建爱心形状 (使用 SVG 保证清晰度)
			const heartSVG = `
        <svg viewBox="0 0 32 32" width="100%" height="100%">
            <path d="M16 28.5L14.1 26.7C7.3 20.6 2.8 16.5 2.8 11.5 2.8 7.4 6 4.2 10.1 4.2c2.3 0 4.5 1.1 5.9 2.8 1.4-1.7 3.6-2.8 5.9-2.8 4.1 0 7.3 3.2 7.3 7.3 0 5-4.5 9.1-11.3 15.2L16 28.5z" 
            fill="#ff69b4" stroke="#fff" stroke-width="1"/>
        </svg>
    `;
			heartContainer.innerHTML = heartSVG;
			document.body.appendChild(heartContainer);

			// 4. 计算位移
			const deltaX = endX - startX;
			const deltaY = endY - startY;

			// 5. 抛物线动画 (使用 Web Animations API)
			// 分为水平位移、垂直位移（弧度）和缩放旋转
			const tossAnimation = heartContainer.animate([
				{
					transform: `translate(0, 0) scale(0.5) rotate(0deg)`,
					opacity: 0
				},
				{
					transform: `translate(${deltaX * 0.2}px, ${deltaY * 0.2 - 50}px) scale(1.2) rotate(15deg)`,
					opacity: 1,
					offset: 0.2
				},
				{
					transform: `translate(${deltaX}px, ${deltaY}px) scale(1) rotate(0deg)`,
					opacity: 1,
					offset: 0.9
				},
				{
					transform: `translate(${deltaX}px, ${deltaY}px) scale(1.5) rotate(0deg)`,
					opacity: 0
				}
			], {
				duration: 500,
				easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // 模拟抛物平滑感
				fill: 'forwards'
			});

			// 6. 尾迹粒子效果
			const createParticle = () => {
				const particle = document.createElement('div');
				const size = Math.random() * 8 + 4;
				Object.assign(particle.style, {
					position: 'fixed',
					left: '0', top: '0',
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: '#ffb6c1',
					borderRadius: '50%',
					pointerEvents: 'none',
					zIndex: '1999',
					opacity: '0.6'
				});
				document.body.appendChild(particle);

				// 让粒子出现在爱心当前位置
				const currentRect = heartContainer.getBoundingClientRect();
				particle.style.transform = `translate(${currentRect.left + 15}px, ${currentRect.top + 15}px)`;

				particle.animate([
					{ opacity: 0.6, transform: `${particle.style.transform} scale(1)` },
					{ opacity: 0, transform: `${particle.style.transform} translate(${(Math.random() - 0.5) * 20}px, 20px) scale(0)` }
				], { duration: 600, easing: 'ease-out' });

				setTimeout(() => particle.remove(), 600);
			};

			const particleInterval = setInterval(createParticle, 50);

			// 7. 落地后的心跳回弹特效 (在 target 上)
			tossAnimation.onfinish = () => {
				clearInterval(particleInterval);
				heartContainer.remove();

				// target 产生轻微震动
				target.animate([
					{ transform: 'scale(1)' },
					{ transform: 'scale(1.05)', offset: 0.5 },
					{ transform: 'scale(1)' }
				], { duration: 300 });
			};

			// 8. 注入基础样式（如果不存在）
			if (!document.querySelector('#heart-toss-style')) {
				const style = document.createElement('style');
				style.id = 'heart-toss-style';
				style.textContent = `
            .heart-toss-effect svg {
                filter: drop-shadow(0 0 5px rgba(255, 105, 180, 0.6));
                animation: heartBeat 0.6s infinite alternate;
            }
            @keyframes heartBeat {
                from { transform: scale(1); }
                to { transform: scale(1.1); }
            }
        `;
				document.head.appendChild(style);
			}
		},
		mark: true,
		marktext: "旅",
		intro: {
			mark(dialog, content, player) {
				if (!player.storage.tonglv_yzs) {
					dialog.addText("当前无旅伴");
					return;
				}
				dialog.addText("当前旅伴为 " + get.translation(player.storage.tonglv_yzs));
				dialog.addText("其每回合首次成为锦囊牌的目标时，若你不为目标或使用者，你摸1张牌并成为额外目标");
			},
		},
		audio: "ext:一中杀/audio/skill:3",
		trigger: {
			global: "roundStart",
		},
		filter(event, player) {
			return game.hasPlayer(current => current != player);
		},
		async cost(event, trigger, player) {
			if (player.storage.tonglv_yzs) {
				player.storage.tonglv_yzs.clearMark("tonglv_yzs_mark", false)
				player.markSkill("tonglv_yzs");
			}
			event.result = await player
				.chooseTarget("请选择旅途的伙伴", `本轮其每回合首次成为锦囊牌的目标时，若你不为目标或使用者，你摸1张牌并成为额外目标`, false, function (card, player, target) {
					return player != target
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
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			if (get.translation(target).includes("辛美尔")) {
				game.broadcastAll(() => {
					game.playAudio("ext:一中杀/audio/skill/tonglv_yzs_himmel.mp3");
				});
			} else if (["休塔尔克","修塔尔克"].includes(get.translation(target))) {
				game.broadcastAll(() => {
					game.playAudio("ext:一中杀/audio/skill/tonglv_yzs_stark.mp3");
				});
			} else if (get.translation(target).includes("赛丽艾")) {
				game.broadcastAll(() => {
					game.playAudio("ext:一中杀/audio/skill/tonglv_yzs_Serie.mp3");
				});
			}
			player.storage.tonglv_yzs = target;
			target.addMark("tonglv_yzs_mark", 1, false);
			player.markSkill("tonglv_yzs");
		}
	},
	cangfa_yzs: {
		init: function (player, skill) {
			if (Array.isArray(player.storage.cangfa_yzs)) return;
			player.storage.cangfa_yzs = [];
			player.markSkill("cangfa_yzs");
		},
		marktext: "法",
		intro: {
			markcount(storage) {
				return storage.length;
			},
			mark(dialog, content, player) {
				const storage = player.getStorage("cangfa_yzs");
				const names = storage;
				if (player.hasSkill("cangfa_yzs_ban")) {
					dialog.addText("本回合不可再发动");
				}
				if ( names.length) {
					dialog.addText("当前记录牌名：");
					dialog.addSmall([names, "vcard"]);
				}
			},
		},
		locked: true,
		//group: "cangfa_yzs_record",
		subSkill: {
			ban: {
				sub: true,
				sourceSkill: `cangfa_yzs`
			},
			record: {
				locked: true,
				forced: true,
				trigger: {
					target: "useCardToAfter",
				},
				filter(event, player) {
					if (!player.storage.cangfa_yzs) return true;
					if (player.storage.cangfa_yzs.includes(event.card.name)) return false;
					return get.type(event.card) == "trick" || get.type(event.card) == "delay"
				},
				async content(event, trigger, player) {
					player.markAuto("cangfa_yzs", trigger.card.name)
				},
			}
		},
		mod: {
			maxHandcard(player, num) {
				return num + player.storage.cangfa_yzs?.length || 0;
			},
		},
		enable: "chooseToUse",
		hiddenCard(player, name) {
			if (!player.hasSkill("cangfa_yzs_ban"))return name == "wuxie"
		},
		onChooseToUse(event) {
			if (!game.online) {
				let evt = event.getParent(4);
				if (evt && evt.name == "phaseJudge" && evt.card) {
					event.set("cangfa_yzs", evt.card.name)
					return;
				}
				evt = evt.getParent()
				if (evt && evt.name == "useCard" && evt.card) {
					event.set("cangfa_yzs", evt.card.name)
					return;
				}
				return;
			}
		},
		filter(event, player) {
			if (player.hasSkill("cangfa_yzs_ban")) return false;
			return true;
			if (!player.storage.cangfa_yzs || !player.storage.cangfa_yzs.length) return false;
			if (!event.cangfa_yzs) return false;
			return player.storage.cangfa_yzs.includes(event.cangfa_yzs)
		},
		filterCard(card) {
			return true;
		},
		viewAsFilter(player) {
			if (player.hasSkill("cangfa_yzs_ban")) return false;
			return player.countCards("h") > 0;
		},
		viewAs: {
			name: "wuxie",
		},
		position: "hs",
		prompt: "将一张手牌当【无懈可击】使用",
		async precontent(event, trigger, player) {
			let evt = event.getParent(4);
			//game.log(evt.name);
			let card = null;
			if (!card&&evt && evt.name == "phaseJudge" && evt.card) {
				card = evt.card;
			}
			evt = evt.getParent()
			if (!card&&evt && evt.name == "useCard" && evt.card) {
				card = evt.card;
			}
			if (!card || !card.name) return;
			player.markAuto("cangfa_yzs", card.name)
			player.addTempSkill("cangfa_yzs_ban")
		},
		check(card) {
			const tri = _status.event.getTrigger();
			if (tri && tri.card && tri.card.name == "chiling") {
				return -1;
			}
			return 8 - get.value(card);
		},
		threaten: 1.2,
		ai: {
			basic: {
				useful: [6, 4, 3],
				value: [6, 4, 3],
			},
			result: {
				player: 1,
			},
			expose: 0.2,
		},
		"_priority": 10,
	},
	huatian_yzs: {
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.hasPlayer(cur => !cur.hasSkill("hidden_yzs"))
		},
		prompt: "你令1名其他角色展示牌堆顶4张牌，其与你依次获得其中1种花色的牌，然后你令其或你恢复X点体力（X为剩余花色数）",
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs") && player != target
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			const target = event.targets[0];
			event.cards = get.cards(4, true);
			await target.showCards(event.cards, "【花田】展示牌")
			const list = Object.keys(lib.suit);
			let suit = event.cards
				.map(card => get.suit(card))
				.unique()
				.sort((a, b) => list.indexOf(a) - list.indexOf(b));
			if (!suit.length) {
				return;
			}
			let dialog = ["花田：选择获得一种花色的牌"];
			for (let i = 0; i < suit.length; i++) {
				const suitx = suit[i];
				const cards = event.cards.filter(card => get.suit(card) == suitx);
				if (cards.length) {
					dialog.addArray([`<span class="text center">${get.translation(suitx)}</span>`, cards]);
				}
			}
			let result =
				suit.length > 1
					? await target
						.chooseControl(suit)
						.set("ai", () => {
							let { player, controls } = get.event();
							const { cards } = get.event().getParent();
							return controls.sort((a, b) => {
								return get.value(cards.filter(card => get.suit(card) === b)) - get.value(cards.filter(card => get.suit(card) === a));
							})[0];
						})
						.set("forced", true)
						.set("dialog", dialog)
						.forResult()
					: { control: suit[0] };
			let control = result?.control;
			if (control) {
				target.popup(control);
				game.log(target, "选择了", "#g" + get.translation(control));
				const cards = event.cards.filter(card => get.suit(card) === control);
				event.cards = event.cards.filter(card => !cards.includes(card))
				if (cards.length) {
					await target.gain(cards, "gain2")
				}
			}

			suit = event.cards
				.map(card => get.suit(card))
				.unique()
				.sort((a, b) => list.indexOf(a) - list.indexOf(b));
			if (!suit.length) {
				return;
			}
			dialog = ["花田：选择获得一种花色的牌"];
			for (let i = 0; i < suit.length; i++) {
				const suitx = suit[i];
				const cards = event.cards.filter(card => get.suit(card) == suitx);
				if (cards.length) {
					dialog.addArray([`<span class="text center">${get.translation(suitx)}</span>`, cards]);
				}
			}
			result =
				suit.length > 1
					? await player
						.chooseControl(suit)
						.set("ai", () => {
							let { player, controls } = get.event();
							const { cards } = get.event().getParent();
							return controls.sort((a, b) => {
								return get.value(cards.filter(card => get.suit(card) === b)) - get.value(cards.filter(card => get.suit(card) === a));
							})[0];
						})
						.set("forced", true)
						.set("dialog", dialog)
						.forResult()
					: { control: suit[0] };
			control = result?.control;
			if (control) {
				player.popup(control);
				game.log(player, "选择了", "#g" + get.translation(control));
				const cards = event.cards.filter(card => get.suit(card) === control);
				event.cards = event.cards.filter(card => !cards.includes(card))
				if (cards.length) {
					await player.gain(cards, "gain2")
				}
			}
			const num = event.cards.length;
			if (num == 0) return;
			result = await player.chooseTarget("花田", `令你或${get.translation(target)}恢复${num}点体力`, true)
				.set("filterTarget", (card, player, target) => {
					return target == get.event().player2 || target == player;
				})
				.set("player2", target)
				.forResult()
			if (!result.bool) return false;
			await result.targets[0].recover(num);
		},
	},
	tanbao_yzs: {
		group: "tanbao_yzs_show",
		subSkill: {
			show: {
				priority: 41,
				direct: true,
				trigger: {
					player: "drawAfter"
				},
				filter(event, player) {
					return event.tanbao_yzs && event.result.cards.length > 0;
				},
				async content(event, trigger, player) {
					let cards = trigger.result.cards;
					await player.showCards(cards, "【贪宝】展示牌")
					if (!cards.some(card => card.suit == "spade")) return;
					game.broadcastAll(() => {
						game.playAudio("ext:一中杀/audio/skill/tanbao_yzs.mp3");
					});
					let result = await player.chooseToDiscard(`弃置${trigger.result.cards.length}张手牌，否则受到1点无来源伤害`, trigger.result.cards.length,"h")
						.forResult();
					if (!result.bool) {
						await player.damage("nosource")
						return
					}
				}
			},
		},
		priority: 41,
		trigger: {
			player: "drawBegin"
		},
		prompt2: function (event) {
			const player = event.player
			return `你即将摸${event.num}张牌。是否多摸2张?<br>若如此做，你需展示因此摸到的牌，若有♠牌，你需弃置${event.num+2}张手牌，否则受到1点无来源伤害`
		},
		check(event, player) {
			if (event.num > 3) return false;
			if (player.hp <= 2 && !player.countCards(card => !["tao", "jiu", "shuangzishuidai_yzs"].includes(get.name(card)))) return false;
			return true;
		},
		async content(event, trigger, player) {
			trigger.tanbao_yzs = true;
			trigger.num += 2;
		},
	},
	//辛美尔
	zhenglv_yzs: {
		group: ["zhenglv_yzs_die"],
		locked: true,
		global: "zhenglv_yzs_g",
		subSkill: {
			die: {
				forceDie: true,
				forced: true,
				popup: false,
				trigger: {
					player: "die"
				},
				filter(event, player) {
					return game.hasPlayer(cur => get.translation(cur).includes("芙莉莲"))
				},
				async content(event, trigger, player) {
					game.broadcastAll(() => {
						game.playAudio("ext:一中杀/audio/skill/zhenglv_yzs_die.mp3");
					});
				}
			},
			g1: {
				locked: true,
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					var card = { name: "sha", isCard: true };
					return game.hasPlayer(current => current.hasSkill("zhenglv_yzs") && game.hasPlayer(function (current2) {
						return current.inRange(current2) && lib.filter.targetEnabled(card, current, current2);
					}))
				},
				prompt: "求助路过的勇者帮你讨伐魔物",
				filterTarget: function (card, player, target) {
					var card = { name: "sha", isCard: true };
					if (target.hasSkill("hidden_yzs") || !target.hasSkill("zhenglv_yzs")) return false;
					return game.hasPlayer(function (current2) {
						return target.inRange(current2) && lib.filter.targetEnabled(card, target, current2);
					});
				},
				selectTarget: 1,
				async content(event, trigger, player) {
					await player.useCard({ name: "jiedao", isCard: true, storage: { zhenglv_yzs: player } }, event.targets[0]);
				},
				"skill_id": "zhenglv_yzs_g",
				sub: true,
				sourceSkill: "zhenglv_yzs",
				"_priority": 0,
			},
			g: {
				locked: true,
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					var card = { name: "sha", isCard: true };
					return game.hasPlayer(current => current.hasSkill("zhenglv_yzs") && game.hasPlayer(function (current2) {
						return current.inRange(current2) && lib.filter.targetEnabled(card, current, current2);
					}))
				},
				prompt: "求助路过的勇者帮你讨伐魔物<br><br>出牌阶段限1次：你视为对辛美尔使用【借刀杀人】，若其因此造成伤害，其与你依次摸2张牌并弃1张牌，辛美尔记录你所弃牌的点数",
				filterCard(card, player) {
					return false;
				},
				selectCard: -1,
				viewAs: {
					name: "jiedao",
					storage: {
						zhenglv_yzs:true,
					},
				},
				viewAsFilter(player) {
					return true;
				},
				mod: {
					playerEnabled(card, player, target) {
						if (card?.storage?.zhenglv_yzs) {
							return target.hasSkill("zhenglv_yzs")
						}
					},
				},
				ai: {
					order: 9,
					expose: 0.3,
					result: {
						player: 2,
						target(player, target) {
							return get.attitude(player, target)
						},
					}
				}
			}
		},
		mark: true,
		marktext: "征",
		intro: {
			markcount: "storage",
			mark(dialog, content, player) {
				const storage = player.getStorage("zhenglv_yzs").sort(function (a, b) {
					return a - b;
				});
				if (storage.length) {
					dialog.addText(`已记录的点数：`);
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
		priority: 8,
		forced: true,
		trigger: {
			source: "damageBegin2",
		},
		filter(event, player) {
			const evt = event.getParent(5);
			if (!evt || evt.name != "useCard") return false;
			return evt.card?.storage?.zhenglv_yzs
		},
		async content(event, trigger, player) {
			const evt = trigger.getParent(5);
			const target = evt?.player
			await player.draw();
			if (player.countDiscardableCards(player, "he")) {
				await player.chooseToDiscard('he', "征旅", '你可弃1张牌')
					.set("forced", false)
					.set('ai', card => {
						return 0;
					});
			}
			if (!target) return;
			await target.draw();
			let result =
				target.countDiscardableCards("he", target) < 1
					? { bool: false }
					: await target
						.chooseToDiscard('he', "征旅", `你可弃1张牌，然后${get.translation(player)}记录此牌点数<br>(为勇者大人铸造雕像！)`)
						.set("forced", false)
						.set("ai", card => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.attitude(player, target) <= 0) return 0;
							let v = 7 - get.value(card, player);
							if (!target.storage.zhenglv_yzs || !target.storage.zhenglv_yzs.includes(get.number(card))) v += 4;
							return v;
						})
						.set("target",player)
						.forResult();
			if (!result.bool) return;
			let index = Math.ceil(Math.random() * 4)
			let path = `ext:一中杀/audio/skill/zhenglv_yzs${index}.mp3`
			game.broadcastAll((path) => {
				game.playAudio(path);
			},path);
			player.markAuto("zhenglv_yzs", result.cards[0].number)
		}
	},
	zhuxiang_yzs: {
		group: "zhuxiang_yzs_targeted",
		subSkill: {
			targeted: {
				locked: true,
				eternalSkill_yzs: true,
				forceDie: true,
				forceOut: true,
				priority: -12,
				trigger: {
					global: "useCardToTargeted",
				},
				filter(event, player) {
					if (event.card.name != "sha") return false;
					if (!player.storage.zhenglv_yzs || !player.storage.zhenglv_yzs.length) return false;
					return player.storage.zhenglv_yzs.includes(event.card.number);
				},
				prompt2(event, player) {
					return `你可令${get.translation(event.target)}摸1张牌，然后其可弃1张手牌以令此【杀】不可响应`
				},
				check(event, player) {
					return get.attitude(player, event.targer) > 0;
				},
				async content(event, trigger, player) {
					await trigger.target.draw();
					let result = await trigger.target.chooseToDiscard('h', "铸像", '你可弃1张手牌以令此【杀】不可响应')
						.set('ai', card => {
							return 0;
						})
						.set("target",trigger.player)
						.forResult();
					if (!result.bool) return;
					trigger.directHit.add(trigger.target);
				}
			},
		},
		locked: true,
		eternalSkill_yzs: true,
		forceDie: true,
		forceOut: true,
		priority: -11,
		trigger: {
			global: "useCardToPlayered",
		},
		filter(event, player) {
			if (event.card.name != "sha") return false;
			if (!player.storage.zhenglv_yzs || !player.storage.zhenglv_yzs.length) return false;
			return player.storage.zhenglv_yzs.includes(event.card.number);
		},
		prompt2(event, player) {
			return `你可令${get.translation(event.player)}摸1张牌，然后其可弃1张手牌以令此【杀】不可响应`
		},
		check(event, player) {
			return get.attitude(player, event.player) > 0;
		},
		async content(event, trigger, player) {
			await trigger.player.draw();
			let result = await trigger.player.chooseToDiscard('h', "铸像", '你可弃1张手牌以令此【杀】不可响应')
				.set('ai', card => {
					const player = get.event().player;
					const target = get.event().target;
					if (get.attitude(player, target) > 0) return 0;
					if (!target.countCards("h")) return 0;
					return 4-get.value(card);
				})
				.set("target", trigger.target)
				.forResult();
			if (!result.bool) return;
			trigger.directHit.add(trigger.target);
		}
	},
	yongyi_yzs: {
		group: "yongyi_yzs_ex",
		subSkill: {
			ex: {
				priority: 5,
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return event.card?.storage?.yongyi_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
			}
		},
		audio: "ext:一中杀/audio/skill:3",
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content: function (storage, player) {
				var str = "转换技：需要时，你可视为使用或打出";
				if (storage) {
					return str + "【闪】";
				} else {
					return str + "普通【杀】";
				}
			},
		},
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			if (!player.storage.yongyi_yzs) {
				return name === "sha"
			} else {
				return name === "shan"
			}
		},
		filter(event, player) {
			if (!player.storage.yongyi_yzs) {
				return event.filterCard({ name: "sha", isCard: true, storage: { yongyi_yzs: true } }, player, event)
			}
			return event.filterCard({ name: "shan", isCard: true }, player, event)
		},
		async precontent(event, trigger, player) {
			player.logSkill("yongyi_yzs");
			player.changeZhuanhuanji(event.name.slice(4));
		},
		viewAsFilter(player) {
			return true
		},
		viewAs(cards, player) {
			if (!player.storage.yongyi_yzs) {
				return { name: "sha", isCard: true, storage: { yongyi_yzs: true } }
			} else {
				return { name: "shan", isCard: true };
			}
		},
		filterCard: () => false,
		selectCard: -1,
		prompt() {
			if (!_status.event.player.storage.yongyi_yzs) {
				return "视为使用普通【杀】";
			}
			return "视为使用【闪】";
		},
		log: false,
		mod: {
			cardUsable(card, player, num) {
				if (card?.storage?.yongyi_yzs) {
					return Infinity
				}
			},
		},
		ai: {
			order: 3.4,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player, tag) {
				return tag == "respondSha" + (player.storage.yongyi_yzs ? "n" : "");
			},
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "respondShan") && current < 0 && !player.storage.yongyi_yzs) {
						return 0.4;
					}
				},
			},
		},
	},
	//魂魄妖梦
	guangyousheguainiao_yzs: {
		mark: true,
		markimage: 'extension/一中杀/image/guangyousheguainiao_yzs.png',
		intro: {
			mark(dialog, content, player) {
				if (player.countMark("guangyousheguainiao_yzs")) {
					dialog.addText(`当前有${player.countMark("guangyousheguainiao_yzs")}/2枚【灵】标记`);
				}
				const youmu = player.getExpansions("guangyousheguainiao_yzs_youmu");
				const banling = player.getExpansions("guangyousheguainiao_yzs_banling");
				if (player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_banling") {
					if (player.isUnderControl(true)) {
						dialog.addText(`<font color="#1fffc0">“妖梦”</font>`);
						dialog.addAuto(youmu);
					} else {
						dialog.addText(`<font color="#1fffc0">“妖梦”</font>共有${get.cnNumber(youmu.length)}张牌`);
					}
				} else if (player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu") {
					if (player.isUnderControl(true)) {
						dialog.addText(`<font color="#ffac27">“半灵”</font>`);
						dialog.addAuto(banling);
					} else {
						dialog.addText(`<font color="#ffac27">“半灵”</font>共有${get.cnNumber(banling.length)}张牌`);
					}
				} else {
					dialog.addText(`你是魂魄妖梦吗你就看？`);
				}
			},
		},
		init: function (player, skill) {
			if (!player.storage.guangyousheguainiao_yzs_name) {
				player.storage.guangyousheguainiao_yzs_name = ["wuzhong", "tiesuo"];
				player.markSkill("guangyousheguainiao_yzs");
			}
			if (!player.storage.guangyousheguainiao_yzs_name2) {
				player.storage.guangyousheguainiao_yzs_name2 = {
					"wuzhong": "tiesuo",
					"tiesuo": "wuzhong",
				};
				player.markSkill("guangyousheguainiao_yzs_name2");
			}
			player.storage.guangyousheguainiao_yzs_zone = _status.currentPhase == player ? "guangyousheguainiao_yzs_youmu" : "guangyousheguainiao_yzs_banling";
			player.markSkill("guangyousheguainiao_yzs_zone");
			player.addGaintag(player.storage.guangyousheguainiao_yzs_zone, player.getCards("h"));
		},
		async changeZone(player) {
			if (!["guangyousheguainiao_yzs_youmu", "guangyousheguainiao_yzs_banling"].includes(player.storage.guangyousheguainiao_yzs_zone)) return;
			const tag = player.storage.guangyousheguainiao_yzs_zone
			if (player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu") {
				player.storage.guangyousheguainiao_yzs_zone = "guangyousheguainiao_yzs_banling";
			} else {
				player.storage.guangyousheguainiao_yzs_zone = "guangyousheguainiao_yzs_youmu";
			}
			player.markSkill("guangyousheguainiao_yzs_zone");
			player.setStorage("currentHandcards_yzs", player.storage.guangyousheguainiao_yzs_zone, true)
			let cards = player.getExpansions(player.storage.guangyousheguainiao_yzs_zone);
			let handcards = player.getCards("h");
			let next = player.addToExpansion(handcards, player, "giveAuto")
			next.gaintag.add(tag)
			next.untrigger(true);
			await next
			if (cards && cards.length) {
				player.directgain(cards, "gain2");
			}
			await game.delayx();
		},
		group: ["guangyousheguainiao_yzs_zone", "guangyousheguainiao_yzs_Beginchange", "guangyousheguainiao_yzs_Afterchange", "guangyousheguainiao_yzs_fuka",
			"guangyousheguainiao_yzs_renew", "guangyousheguainiao_yzs_Urecord", "guangyousheguainiao_yzs_Rrecord", "guangyousheguainiao_yzs_ling",
			"guangyousheguainiao_yzs_start"],
		subSkill: {
			start: {
				priority: 129,
				locked: true,
				forced: true,
				name: "魂符「幽明的苦轮」",
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0)
				},
				async content(event, trigger, player) {
					const tag = _status.currentPhase == player ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu"
					let cards = get.cards(4);
					let next = player.addToExpansion(cards, "giveAuto", player)
					next.gaintag.add(tag);
					player.$draw(4);
					await next;
					player.addGaintag(player.getCards("h"), player.storage.guangyousheguainiao_yzs_zone)
				},
			},
			zone: {
				priority:5,
				popup: false,
				trigger: {
					player: "gainEnd",
				},
				forced: true,
				async content(event, trigger, player) {
					player.addGaintag(trigger.cards, player.storage.guangyousheguainiao_yzs_zone)
				}
			},
			Beginchange: {
				locked: true,
				sub: true,
				sourceSkill: "guangyousheguainiao_yzs",
				forced: true,
				popup: false,
				priority: 21231424,
				trigger: { player: ["phaseBegin", "phaseUseBegin"] },
				filter(event, player) {
					if (event.name == "phaseUse" && _status.currentPhase == player && player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu") return false;
					return player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_banling"
				},
				async content(event, trigger, player) {
					await lib.skill.guangyousheguainiao_yzs.changeZone(player);
				},
			},
			Afterchange: {
				locked: true,
				sub: true,
				sourceSkill: "guangyousheguainiao_yzs",
				forced: true,
				popup: false,
				priority: -21231424,
				trigger: { player: ["phaseAfter", "phaseUseAfter"] },
				filter(event, player) {
					if (event.name == "phaseUse" && _status.currentPhase == player && player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu") return false;
					return player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu"
				},
				async content(event, trigger, player) {
					await lib.skill.guangyousheguainiao_yzs.changeZone(player);
				},
			},
			fuka: {
				locked: true,
				forced: true,
				name: "人界剑「悟入幻想」",
				priority: 7,
				trigger: {
					player: "phaseUseBegin"
				},
				async content(event, trigger, player) {
					player.addMark("guangyousheguainiao_yzs_fuka", 1, false)
					let num = get.character(player.name).Fuka - player.countMark("Fuka_yzs");
					if (num <= 0) return;
					num = Math.min(num, 2);
					player.addMark("Fuka_yzs", num)
				}
			},
			renew: {
				locked: true,
				forced: true,
				priority: 7,
				trigger: {
					player: "phaseBegin"
				},
				async content(event, trigger, player) {
					if (!trigger.skill) {
						player.clearMark("guangyousheguainiao_yzs_fuka", false)
						player.clearMark("guangyousheguainiao_yzs_ling", false)
					}
					const num = player.countMark("guangyousheguainiao_yzs_fuka")
					player.clearMark("guangyousheguainiao_yzs_fuka", false)
					if (num > 0) await player.draw(num);
				}
			},
			Urecord: {
				locked: true,
				forced: true,
				priority: 7,
				popup: false,
				trigger: {
					player: "useCard",
				},
				filter(event) {
					return get.type2(event.card) == "trick";
				},
				async content(event, trigger, player) {
					player.addMark("guangyousheguainiao_yzs_record", 1, false)
				},
			},
			Rrecord: {
				locked: true,
				forced: true,
				priority: 7,
				popup: false,
				trigger: {
					player: "recastBegin"
				},
				filter(event, player) {
					if (event.liugenqingjingzhan_yzs) return false;
					return event.cards.some(card => get.type2(card) == "trick");
				},
				async content(event, trigger, player) {
					const num = trigger.cards.filter(card => get.type2(card) == "trick").length;
					player.addMark("guangyousheguainiao_yzs_record", num, false)
				}
			},
			ling: {
				locked: true,
				forced: true,
				name: "灵",
				popup: false,
				priority: 7,
				trigger: {
					global: "phaseUseAfter"
				},
				async content(event, trigger, player) {
					const x = player.countMark("guangyousheguainiao_yzs_record");
					player.clearMark("guangyousheguainiao_yzs_record", false);
					let youmu = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? player.getCards("h") : player.getExpansions("guangyousheguainiao_yzs_youmu");
					let banling = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_banling" ? player.getCards("h") : player.getExpansions("guangyousheguainiao_yzs_banling");
					let cards = [];
					if (x > 0) {
						if (youmu.length <= x) {
							cards = youmu;
						} else {
							let result = await player.chooseButton(["广有射怪鸟", `你移动<font color="#1fffc0">妖梦</font>${x}张牌至<font color="#ffac27">半灵</font>`, youmu], true)
								.set("selectButton", x)
								.forResult()
							if (result.bool == false) return;
							cards = result.links;
						}
					}
					if (cards.length) {
						if (player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu") {
							let next = player.addToExpansion(cards, player, "giveAuto")
							next.gaintag.add("guangyousheguainiao_yzs_banling")
							next.untrigger(true);
							await next
						} else {
							player.directgain(cards, "gain2");
							player.removeGaintag("guangyousheguainiao_yzs_youmu", cards);
							player.addGaintag(cards, "guangyousheguainiao_yzs_banling");
						}
					}
					if (x >= 4 && player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs")
					youmu = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? player.getCards("h") : player.getExpansions("guangyousheguainiao_yzs_youmu");
					banling = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_banling" ? player.getCards("h") : player.getExpansions("guangyousheguainiao_yzs_banling");
					const y = player.countMark("guangyousheguainiao_yzs_ling");
					if (banling.length - youmu.length != y) return;
					player.logSkill("guangyousheguainiao_yzs_ling")
					const tag = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu"
					cards = player.getExpansions(tag);
					let handcards = player.getCards("h");
					next = player.addToExpansion(handcards, player, "giveAuto")
					next.gaintag.add(tag)
					next.untrigger(true);
					await next
					if (cards && cards.length) {
						player.directgain(cards, "gain2");
						player.removeGaintag(tag, cards);
						player.addGaintag(cards, player.storage.guangyousheguainiao_yzs_zone);
					}
					await game.delayx();
					player.addMark("guangyousheguainiao_yzs", 1, false);
					player.addMark("guangyousheguainiao_yzs_ling", 1, false);
					if (player.countMark("guangyousheguainiao_yzs") >= 2) {
						player.clearMark("guangyousheguainiao_yzs")
						var next = player.phaseUse();
						next.skill = "guangyousheguainiao_yzs"
						await next;
					}
				}
			}
		},
		nobracket: true,
		locked: true,
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (!player.storage.guangyousheguainiao_yzs_name || !player.storage.guangyousheguainiao_yzs_name.length) return false;
			const zone = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu";
			if (!player.countCards("h") || !player.countExpansions(zone)) return false;
			if (!["guangyousheguainiao_yzs_youmu", "guangyousheguainiao_yzs_banling"].includes(zone)) return false;
			const youmu = zone == "guangyousheguainiao_yzs_youmu" ? player.countCards("h") : player.countExpansions(zone);
			const banling = zone == "guangyousheguainiao_yzs_banling" ? player.countCards("h") : player.countExpansions(zone);
			if (youmu < banling) {
				return event.filterCard({ name: player.storage.guangyousheguainiao_yzs_name[0] }, player, event);
			} else {
				return event.filterCard({ name: player.storage.guangyousheguainiao_yzs_name[1] }, player, event);
			}
		},
		chooseButton: {
			dialog(event, player) {
				const method = [
					["use", "使用"],
					["recast", "重铸"],
				];
				const zone = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu";
				const youmu = zone == "guangyousheguainiao_yzs_youmu" ? player.getExpansions(zone) : player.getCards("h");
				const banling = zone == "guangyousheguainiao_yzs_banling" ? player.getExpansions(zone) : player.getCards("h");
				let name = youmu.length < banling.length ? player.storage.guangyousheguainiao_yzs_name[0] : player.storage.guangyousheguainiao_yzs_name[1]
				let prompt = `将<font color="#1fffc0">妖梦</font>与<font color="#ffac27">半灵</font>各一张同花色牌当做【${get.translation(name)}】使用${name == "tiesuo" ? `或重铸` : ``}`;
				return ui.create.dialog(prompt, [method, "tdnodes"], youmu, banling, "hidden");
			},
			select: 3,
			check(button) {
				const player = get.player();
				if (typeof button.link == "string") return Math.random();
				return 6 - get.value(button.link, player);
			},
			filter(button, player) {
				const zone = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu";
				const youmu = zone == "guangyousheguainiao_yzs_youmu" ? player.countExpansions(zone) : player.countCards("h");
				const banling = zone == "guangyousheguainiao_yzs_banling" ? player.countExpansions(zone) : player.countCards("h");
				let name = youmu < banling ? player.storage.guangyousheguainiao_yzs_name[0] : player.storage.guangyousheguainiao_yzs_name[1]
				if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
				const card = button.link;
				if (typeof card == "string") {
					if (name != "tiesuo" && card == "recast") return false;
					return !ui.selected.buttons.some(i => typeof i.link == "string")
				}
				if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player)) {
					return false;
				}
				let cards = ui.selected.buttons.filter(i => typeof i.link !== "string")
				if (!cards.length) return true;
				const evt = _status.event.getParent();
				for (let cardx of cards) {
					const bt = cardx.link;
					if (bt.hasGaintag("guangyousheguainiao_yzs_youmu") && card.hasGaintag("guangyousheguainiao_yzs_youmu")) return false;
					if (bt.hasGaintag("guangyousheguainiao_yzs_banling") && card.hasGaintag("guangyousheguainiao_yzs_banling")) return false;
					if (bt.suit != card.suit) return false;
				}
				return evt.filterCard(get.autoViewAs({ name: name }, cards), player, evt);
			},
			backup(links, player) {
				const skill = _status.event.buttoned;
				const zone = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu";
				const youmu = zone == "guangyousheguainiao_yzs_youmu" ? player.countExpansions(zone) : player.countCards("h");
				const banling = zone == "guangyousheguainiao_yzs_banling" ? player.countExpansions(zone) : player.countCards("h");
				let name = youmu < banling ? player.storage.guangyousheguainiao_yzs_name[0] : player.storage.guangyousheguainiao_yzs_name[1]
				let cards = links.filter(i => typeof i !== "string")
				let method = (links.filter(i => typeof i == "string"))[0]
				if (method == "recast") return {
					name: "二重的苦轮",
					selectCard: -1,
					position: "hx",
					card: cards,
					filterCard: card => lib.skill.guangyousheguainiao_yzs_backup.card.includes(card),
					discard: false,
					lose: false,
					delay: false,
					prepare: () => true,
					async content(event, trigger, player) {
						let next = player.recast(event.cards, (player2, cards2) => player2.loseToDiscardpile(cards2).log = false, (player2, cards2) => player2.draw(1).log = false);
						next.liugenqingjingzhan_yzs = true;
						await next;
						player.storage.liugenqingjingzhan_yzs_record = lib.skill.guangyousheguainiao_yzs_backup.viewAs;
						player.markSkill('liugenqingjingzhan_yzs_record')
						player.addMark("guangyousheguainiao_yzs_record", 1, false)
					}
				}
				return {
					name: "西行春风斩",
					selectCard: -1,
					position: "hx",
					filterCard: card => lib.skill.guangyousheguainiao_yzs_backup.card.includes(card),
					viewAs: { name: name },
					card: cards,
				};
			},
			prompt(links, player) {
				const zone = player.storage.guangyousheguainiao_yzs_zone == "guangyousheguainiao_yzs_youmu" ? "guangyousheguainiao_yzs_banling" : "guangyousheguainiao_yzs_youmu";
				const youmu = zone == "guangyousheguainiao_yzs_youmu" ? player.countExpansions(zone) : player.countCards("h");
				const banling = zone == "guangyousheguainiao_yzs_banling" ? player.countExpansions(zone) : player.countCards("h");
				let name = youmu < banling ? player.storage.guangyousheguainiao_yzs_name[0] : player.storage.guangyousheguainiao_yzs_name[1]
				let cards = links.filter(i => typeof i !== "string")
				let method = (links.filter(i => typeof i == "string"))[0]
				return "选择 " + get.translation(name) + "（" + get.translation(cards) + "）的目标";
			},
		},
		ai: {
			order: 5,
			result: {
				player:2,
			}
		}
	},
	liugenqingjingzhan_yzs: {
		group: ["liugenqingjingzhan_yzs_Urecord", "liugenqingjingzhan_yzs_Rrecord"],
		subSkill: {
			record: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "liugenqingjingzhan_yzs",
				"_priority": 0,
			},
			Urecord: {
				locked: true,
				forced: true,
				priority: 6,
				popup: false,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					var info = lib.card[event.card.name];
					if (!info || info.type != "trick" || get.tag({ name: event.card.name }, "damage")) {
						return false;
					}
					return true
				},
				async content(event, trigger, player) {
					const { name, suit, number } = trigger.card;
					player.storage.liugenqingjingzhan_yzs_record = game.createCard(name, suit, number);
					player.storage.liugenqingjingzhan_yzs_record.storage.liugenqingjingzhan_yzs = true;
					player.markSkill('liugenqingjingzhan_yzs_record')
				},
			},
			Rrecord: {
				locked: true,
				forced: true,
				priority: 6,
				popup: false,
				trigger: {
					player: "recastBegin"
				},
				filter(event, player) {
					if (event.liugenqingjingzhan_yzs) return false;
					return event.cards.some(card => get.type(card) == "trick" && !get.tag({ name: card.name }, "damage"));
				},
				async cost(event, trigger, player) {
					let cards = trigger.cards.filter(card => get.type(card) == "trick" && !get.tag({ name: card.name }, "damage"))
					const num = cards.length;
					if (num == 1) {
						event.result = {
							bool: true,
							cost_data: { name:get.name(cards[0]),suit:get.suit(cards[0]),number:get.number(cards[0])}
						}
						return;
					}
					let result = await player.chooseButton(["六根清净斩", "请选择要记录的牌", cards], true)
						.set("selectButton", 1)
						.set("ai",button=>get.value(button))
						.forResult()
					if (!result||result.bool == false) return false;
					event.result = {
						bool: true,
						cost_data: { name: get.name(result.links[0]), suit: get.suit(result.links[0]), number: get.number(result.links[0]) }
					}
				},
				async content(event, trigger, player) {
					if (!event.cost_data) return;
					const { name, suit, number } = event.cost_data;
					player.storage.liugenqingjingzhan_yzs_record = game.createCard(name, suit, number);
					player.storage.liugenqingjingzhan_yzs_record.storage.liugenqingjingzhan_yzs = true;
					player.markSkill('liugenqingjingzhan_yzs_record')
				},
			},
		},
		nobracket: true,
		locked: true,
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("liugenqingjingzhan_yzs");
		},
		clickableFilter: function (player) {
			if (!player.countMark("Fuka_yzs")) return false;
			if (!player.storage.liugenqingjingzhan_yzs_record || get.itemtype(player.storage.liugenqingjingzhan_yzs_record) !== "card") return true;
			return player.hasUseTarget(player.storage.liugenqingjingzhan_yzs_record, true);
		},
		clickableContent: async function (event, trigger, player) {
			const choices = player.storage.guangyousheguainiao_yzs_name
			let list = [];
			for (let i = 0; i < choices.length; i++) {
				let name = choices[i];
				let card = game.createCard(name, "none");
				card.storage.guangyousheguainiao_yzs_name = i;
				list.push(card);
			}
			let record = player.storage.liugenqingjingzhan_yzs_record
			let args = [];
			args = record ? [`均不选则摸1张牌<br>视为使用上一记录牌`, [record], `将【无中生有/铁索连环】的牌名改为另一方`, list, "hidden"]
				: [`不选则摸1张牌<br>将【无中生有/铁索连环】的牌名改为另一方`, list, "hidden"];
			let result2 = await player.chooseButton(args)
				.set("selectButton", [0, 1])
				.set("filterButton", (button, player) => {
					const card = button.link;
					if (!card.storage.liugenqingjingzhan_yzs) return true;
					if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player)) {
						return false;
					}
					return player.hasUseTarget(card, true);
				})
				.forResult();
			if (!result2.bool) return;
			player.removeMark("Fuka_yzs");
			if (!result2.links.length) {
				await player.draw();
			} else if (result2.links[0].storage.liugenqingjingzhan_yzs) {
				const { name, suit, number } = result2.links[0];
				await player.chooseUseTarget({
					name: name,
					suit: suit,
					number: number,
				}, true, false)
			} else {
				const index = result2.links[0].storage.guangyousheguainiao_yzs_name;
				const name1 = player.storage.guangyousheguainiao_yzs_name[index]
				const name2 = player.storage.guangyousheguainiao_yzs_name2[name1]
				player.storage.guangyousheguainiao_yzs_name[index] = name2;
				await player.markSkill("guangyousheguainiao_yzs_name")
				if (player.storage.guangyousheguainiao_yzs_name[0] == player.storage.guangyousheguainiao_yzs_name[1]) {
					const select = name1 == "wuzhong" ? -1 : [0, 2]
					const prompt = name1 == "wuzhong" ? `将1张牌当做${get.translation(name1)}使用` : `将1张牌当做${get.translation(name1)}使用或重铸(不选目标则重铸)`
					let cards = player.getCards("he").filter(card => game.checkMod(card, player, "unchanged", "cardEnabled2", player))
					if (!cards.length) return;
					let result = await player.chooseCardTarget()
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return player.canUse(get.autoViewAs({ name: get.event().name1 }, card), target, true)
						})
						.set("filterCard", (card, player, target) => {
							return game.checkMod(card, player, "unchanged", "cardEnabled2", player);
						})
						.set("name1", name1)
						.set("position", "he")
						.set("forced", true)
						.set("selectCard", 1)
						.set("selectTarget", select)
						.set("multitarget", true)
						.set("complexCard", true)
						.set("multiline", true)
						.set("filterOk", () => {
							return ui.selected?.cards?.length;
						})
						.set("prompt", "六根清净斩")
						.set("prompt2", prompt)
						.forResult();
					if (result.bool && result.targets && result.targets.length) {
						await player.useCard(result.cards, { name: name1, isCard: false }, result.targets);
					} else {
						if (name1 == "wuzhong") {
							await player.useCard(result.cards, { name: name1, isCard: false }, player);
							return;
						}
						let next = player.recast(result.cards, (player2, cards2) => player2.loseToDiscardpile(cards2).log = false, (player2, cards2) => player2.draw(1).log = false);
						next.liugenqingjingzhan_yzs = true;
						await next;
						player.storage.liugenqingjingzhan_yzs_record = game.createCard(name1, "", "");
						player.markSkill('liugenqingjingzhan_yzs_record')
						player.addMark("guangyousheguainiao_yzs_record", 1, false)
					}
				} else {
					let result =
						player.countCards("he") < 2
							? { bool: false }
							: await player
								.chooseToDiscard(2, `弃2张牌，否则摸2张牌`, "he")
								.set("position", "he")
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
					if (!result.bool) {
						await player.draw(2)
					};
				}
			}
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (!player.countMark("Fuka_yzs")) return false;
			if (!player.storage.liugenqingjingzhan_yzs_record || get.itemtype(player.storage.liugenqingjingzhan_yzs_record) !== "card") return true;
			return event.filterCard(player.storage.liugenqingjingzhan_yzs_record, player, event) || player.hasUseTarget(player.storage.liugenqingjingzhan_yzs_record, true);
		},
		chooseButton: {
			dialog(event, player) {
				const choices = player.storage.guangyousheguainiao_yzs_name
				let list = [];
				for (let i = 0; i < choices.length; i++) {
					let name = choices[i];
					let card = game.createCard(name, "none");
					card.storage.guangyousheguainiao_yzs_name = i;
					list.push(card);
				}
				let record = player.storage.liugenqingjingzhan_yzs_record
				if (!record) return ui.create.dialog(`不选则摸1张牌<br>将【无中生有/铁索连环】的牌名改为另一方`, list, "hidden");
				return ui.create.dialog(`均不选则摸1张牌<br>视为使用上一记录牌`, [record], `将【无中生有/铁索连环】的牌名改为另一方`, list, "hidden");
			},
			select: [0, 1],
			filter(button, player) {
				const card = button.link;
				if (!card.storage.liugenqingjingzhan_yzs) return true;
				if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player)) {
					return false;
				}
				const evt = _status.event.getParent();
				return evt.filterCard(card, player, evt) || player.hasUseTarget(card, true);;
			},
			check(button) {
				return 0;
			},
			backup(links, player) {
				if (!links.length) return {
					name: "冥想斩",
					filterCard: () => false,
					selectCard: -1,
					async content(event, trigger, player) {
						player.removeMark("Fuka_yzs");
						await player.draw();
						const evt = event.getParent(2);
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
					}
				}
				const { name, suit, number } = links[0];
				if (links[0].storage.liugenqingjingzhan_yzs) return {
					name: "未来永劫斩",
					filterCard: () => false,
					selectCard: -1,
					viewAs: {
						name: name,
						suit: suit,
						number: number,
					},
					async precontent(event, trigger, player) {
						player.removeMark("Fuka_yzs");
						const evt = event.getParent();
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
					}
				};
				return {
					name: "六根清净斩",
					filterCard: () => false,
					selectCard: -1,
					choice: links[0],
					async content(event, trigger, player) {
						player.removeMark("Fuka_yzs");
						const index = lib.skill.liugenqingjingzhan_yzs_backup.choice.storage.guangyousheguainiao_yzs_name;
						const name1 = player.storage.guangyousheguainiao_yzs_name[index]
						const name2 = player.storage.guangyousheguainiao_yzs_name2[name1]
						player.storage.guangyousheguainiao_yzs_name[index] = name2;
						await player.markSkill("guangyousheguainiao_yzs_name")
						if (player.storage.guangyousheguainiao_yzs_name[0] == player.storage.guangyousheguainiao_yzs_name[1]) {
							const select = name1 == "wuzhong" ? -1 : [0, 2]
							const prompt = name1 == "wuzhong" ? `将1张牌当做${get.translation(name1)}使用` : `将1张牌当做${get.translation(name1)}使用或重铸(不选目标则重铸)`
							let cards = player.getCards("he").filter(card => game.checkMod(card, player, "unchanged", "cardEnabled2", player))
							if (!cards.length) {
								const evt = event.getParent(2);
								if (evt.name == "chooseToUse") {
									evt.goto(0);
									delete evt.openskilldialog;
								}
								return;
							};
							let result = await player.chooseCardTarget()
								.set("filterTarget", (card, player, target) => {
									if (target.hasSkill("hidden_yzs")) return false;
									return player.canUse(get.autoViewAs({ name: get.event().name1 }, card), target, true)
								})
								.set("filterCard", (card, player, target) => {
									return game.checkMod(card, player, "unchanged", "cardEnabled2", player);
								})
								.set("name1", name1)
								.set("position", "he")
								.set("forced", true)
								.set("selectCard", 1)
								.set("selectTarget", select)
								.set("multitarget", true)
								.set("complexCard", true)
								.set("multiline", true)
								.set("filterOk", () => {
									return ui.selected?.cards?.length;
								})
								.set("prompt", "六根清净斩")
								.set("prompt2", prompt)
								.forResult();
							if (result.bool && result.targets && result.targets.length) {
								await player.useCard(result.cards, { name: name1, isCard: false }, result.targets);
							} else {
								if (name1 == "wuzhong") {
									await player.useCard(result.cards, { name: name1, isCard: false }, player);
									const evt = event.getParent(2);
									if (evt.name == "chooseToUse") {
										evt.goto(0);
										delete evt.openskilldialog;
									}
									return;
								}
								let next = player.recast(result.cards, (player2, cards2) => player2.loseToDiscardpile(cards2).log = false, (player2, cards2) => player2.draw(1).log = false);
								next.liugenqingjingzhan_yzs = true;
								await next;
								player.storage.liugenqingjingzhan_yzs_record = game.createCard(name1, "", "");
								player.markSkill('liugenqingjingzhan_yzs_record')
								player.addMark("guangyousheguainiao_yzs_record", 1, false)
							}
						} else {
							let result =
								player.countCards("he") < 2
									? { bool: false }
									: await player
										.chooseToDiscard(2, `弃2张牌，否则摸2张牌`, "he")
										.set("position", "he")
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
							if (!result.bool) {
								await player.draw(2)
							};
						}
						const evt = event.getParent(2);
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
					}
				}
			},
			prompt(links, player) {
				if (!links.length) return `你摸1张牌`
				if (links[0].storage.liugenqingjingzhan_yzs) return `视为使用${links[0]}`;
				return `将【无中生有/铁索连环】的牌名改为另一方`
			},
		},
		ai: {
			order: 5,
			result: {
				player:2,
			}
		}
	},
	//Frisk
	shane_yzs: {
		usable: 1,
		group: ["shane_yzs_use"],
		subSkill: {
			count: {
				sub: true,
				markimage: 'extension/一中杀/image/shane_yzs.png',
				intro: {
					mark(dialog, content, player) {
						const storage = player.getStorage("shane_yzs");
						if (storage == "") {
							dialog.addText("当前未发动过本技能");
							return;
						}
						dialog.addText(`已连续使用${player.countMark("shane_yzs_count")}次【${get.translation(storage)}】`);
						if (storage == "sha") {
							dialog.addText("=)");
						} else {
							dialog.addText("-_-");
						}
					},
				},
			},
			use: {
				mod: {
					targetInRange: function (card) {
						if (card?.storage?.shane_yzs_use) {
							return true;
						}
					},
					cardUsable(card, player, num) {
						if (card?.storage?.shane_yzs_use) {
							return Infinity
						}
					},
				},
				priority: 5,
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return typeof event.card?.storage?.shane_yzs == 'number' || event.card?.storage?.shane_yzs_directHit || event.card?.storage?.shane_yzs_use
				},
				async content(event, trigger, player) {
					const num = trigger.card?.storage?.shane_yzs
					if (typeof num == 'number') {
						trigger.baseDamage += num - 1;
					}
					if (trigger.card?.storage?.shane_yzs_use) {
						if (trigger.addCount !== false) {
							trigger.addCount = false;
							trigger.player.getStat("card")[trigger.card.name]--;
						}
					}
					if (trigger.card?.storage?.shane_yzs_directHit) {
						trigger.directHit = game.filterPlayer();
					}
					if (trigger.card.name == "sha") {
						const sound = "shane_yzs_sound";
						game.broadcastAll((player, bgm) => {
							game.playAudio("ext:一中杀/audio/skill/" + bgm + ".MP3");
						}, player, sound);
					}
				},
				"skill_id": "shane_yzs_use",
				sub: true,
				sourceSkill: "shane_yzs",
			}
		},
		init: function (player, skill) {
			if (!player.storage.shane_yzs) {
				player.storage.shane_yzs = "";
				player.syncStorage("shane_yzs");
				player.markSkill("shane_yzs");
				player.setMark("shane_yzs_count", 1, true);
			}
		},
		enable: ["chooseToUse"],
		hiddenCard: function (player, name) {
			return (name == "tao" || name == "sha") && player.countCards('h') > 0;
		},
		filter: function (event, player) {
			if (!player.hasCard(function (card) {
				return get.type2(card) == "basic";
			}, "h")) return false;
			const list = ["sha", "tao"]
			for (var i of list) {
				if (event.filterCard({ name: i, storage: { shane_yzs_use: true } }, player, event)) return true;
			}
			return false
		},
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				for (let name of ["tao", "sha"]) {
					if (name == 'sha') {
						if (event.filterCard({ name: name, storage: { shane_yzs_use: true } }, player, event)) list.push(['基本', '', 'sha']);
						for (var j of lib.inpile_nature) {
							if (event.filterCard({ name: name, nature: j, storage: { shane_yzs_use: true } }, player, event)) list.push(['基本', '', 'sha', j]);
						}
					}
					else if (get.type(name) == 'basic' && event.filterCard({ name: name, storage: { shane_yzs_use: true } }, player, event)) list.push(['基本', '', name]);
				}
				return ui.create.dialog('善恶', [list, 'vcard']);
			},
			filter: function (button, player) {
				return _status.event.getParent().filterCard({ name: button.link[2], storage: { shane_yzs_use: true } }, player, _status.event.getParent());
			},
			check: function (button) {
				if (_status.event.getParent().type != 'phase') return 1;
				var player = _status.event.player;
				if (['wugu', 'zhulu_card', 'yiyi', 'lulitongxin', 'lianjunshengyan', 'diaohulishan'].includes(button.link[2])) return 0;
				return player.getUseValue({
					name: button.link[2],
					nature: button.link[3],
					storage: { shane_yzs_use: true }
				});
			},
			backup: function (links, player) {
				return {
					filterCard(card, player) {
						return get.type(card) == "basic"
					},
					popname: true,
					check: function (card) {
						return 8 - get.value(card);
					},
					position: 'h',
					viewAs: { name: links[0][2], nature: links[0][3], storage: { shane_yzs_use: true }, },
					choice: links[0][2],
					async precontent(event, trigger, player) {
						const choice = lib.skill.shane_yzs_backup.choice;
						event.result.card.storage.shane_yzs = player.countMark("shane_yzs_count");
						if (choice != player.storage.shane_yzs) {
							player.setMark("shane_yzs_count", 1, false);
							player.storage.shane_yzs = choice;
							player.syncStorage("shane_yzs");
							player.markSkill("shane_yzs");
							await player.draw(2);
							event.result.card.storage.shane_yzs_directHit = true;
						} else {
							player.addMark("shane_yzs_count", 1, false);
						}
					},
				}
			},
			prompt: function (links, player) {
				let str = `将1张基本牌当做${links[0][2] == "sha" ? '伤害' : '恢复'}值为${player.countMark("shane_yzs_count")}的${get.translation(links[0][3]) || ''}${get.translation(links[0][2])}使用`;
				if (links[0][2] != player.storage.shane_yzs) str += `并摸2张牌`
				return str;
			},
			"prompt2": `将基本牌当做无次数距离限制、效果值为X的【桃】或【杀】使用，若与上次发动时牌名相同，令X+1，否则重置X、摸2张牌并令之不可响应。（X初始为1）`,
		},
		ai: {
			save: true,
			skillTagFilter(player, tag, arg) {
				if (!player.countCards("h") || player.isTempBanned("shane_yzs")) {
					return false;
				}
				return true
			},
			order: 4,
			result: {
				player(player) {
					return 1;
				},
			},
			threaten: 1.9,
		},
		"skill_id": "shane_yzs",
		"_priority": 0,
	},
	yuduo_yzs: {
		group: ["yuduo_yzs_save"],
		subSkill: {
			saved: {
				name: "被饶恕",
				charlotte: true,
				mark: true,
				nopop: true,
				marktext: "<span style=\"text-decoration: line-through;\">恕</span>",
				intro: {
					content: "游戏结算时视为已死亡",
				},
				sub: true,
				sourceSkill: "yuduo_yzs",
				priority: 5,
			},
			save: {
				logTarget: "player",
				audio: "yuduo_yzs",
				name: "饶恕",
				locked: true,
				eternalSkill_yzs: true,
				forceDie: true,
				forced: true,
				forceOut: true,
				priority: -11,
				trigger: {
					global: "recoverEnd"
				},
				filter(event, player) {
					if (event.player == player) return false;
					if (event.source != player) return false;
					return event.overflow > 0;
				},
				async content(event, trigger, player) {
					trigger.player.addSkill("yuduo_yzs_saved")
					if (!_status.yuduo_yzs) {
						if (typeof game.checkResult === 'function') {
							const origin_checkResult = game.checkResult;
							const origin_gamePlayers = game.players.slice();
							const origin_gameDead = game.dead.slice();
							game.checkResult = function () {
								game.players = origin_gamePlayers.filter(i => !i.hasSkill('yuduo_yzs_saved'));
								game.dead = origin_gameDead.concat(origin_gamePlayers.filter(i => i.hasSkill('yuduo_yzs_saved')));
								origin_checkResult.apply(this, arguments);
								game.players = origin_gamePlayers;
								game.dead = origin_gameDead;
							};
						}
						if (typeof game.checkOnlineResult === 'function') {
							const origin_checkResult = game.checkResult;
							const origin_gamePlayers = game.players.slice();
							const origin_gameDead = game.dead.slice();
							game.checkOnlineResult = function () {
								game.players = origin_gamePlayers.filter(i => !i.hasSkill('yuduo_yzs_saved'));
								game.dead = origin_gameDead.concat(origin_gamePlayers.filter(i => i.hasSkill('yuduo_yzs_saved')));
								origin_checkResult.apply(this, arguments);
								game.players = origin_gamePlayers;
								game.dead = origin_gameDead;
							};
						}
						game.broadcastAll(() => {
							_status.yuduo_yzs = true;
						})
					}
					game.checkResult();
					await player.draw(3);
				}
			}
		},
		locked: true,
		eternalSkill_yzs: true,
		forceDie: true,
		forceOut: true,
		priority: -11,
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: ["discardBegin", "drawBegin"],
		},
		forced: true,
		forceDie: true,
		filter(event, player) {
			return event.getParent().name == "die" && event.getParent().source == player && event.player == player && event.getParent().player != player;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			game.log(player, `的LV上升了！`)
			await player.draw(3);
			await player.gainMaxHp(2);
			await player.recover(1);
		},
	},
	//鬼香
	yanjiao_yzs: {
		group: ["yanjiao_yzs_judge", "yanjiao_yzs_damage"],
		subSkill: {
			judge: {
				locked: true,
				priority: 4,
				trigger: {
					player: "judgeEnd",
				},
				forced: true,
				preHidden: true,
				async content(event, trigger, player) {
					await player.draw();
				}
			},
			damage: {
				locked: true,
				forced: true,
				priority: 4,
				trigger: {
					player: "damageBegin3"
				},
				async content(event, trigger, player) {
					await player.draw();
					if (!trigger.source || !player.countCards("he") || !trigger.source.isAlive()) return;
					let result = player.countCards("he") == 1 ? {
						cards: player.getCards("he"),
					} : await player.chooseCard(`严教`, `将1张牌当做【闪电】置入${get.translation(trigger.source)}的判定区`, "he", true)
							.set("ai", card => 7 - get.value(card))
						.forResult()
					if (!result?.cards) return;
					await player.useCard(trigger.source, { name: "shandian" }, result.cards)
				}
			},
		},
		init: function (player, skill) {
			game.broadcastAll(() => {
				if (!lib.card["shandian"]) return;
				lib.card["shandian"].allowDuplicate = true;
			})
			if (!_status.postReconnect.yanjiao_yzs) {
				_status.postReconnect.yanjiao_yzs = [
					function () {
						if (!lib.card["shandian"]) return;
						lib.card["shandian"].allowDuplicate = true;
					},
					[],
				];
			}
		},
		locked: true,
		forced: true,
		priority: 4,
		trigger: {
			player: "drawAfter"
		},
		filter(event, player) {
			const evt = event.getParent();
			if (!evt) return false;
			const name = evt.name;
			const skills = ["yanjiao_yzs", "yanjiao_yzs_judge", "yanjiao_yzs_damage"]
			if (skills.includes(name)) return false;
			return true;
		},
		async content(event, trigger, player) {
			await player.draw();
		}
	},
	choubei_yzs: {
		group: "choubei_yzs_damage",
		subSkill: {
			damage: {
				priority: 4,
				trigger: {
					player: "damageBefore",
				},
				direct: true,
				popup: true,
				filter: function (event, player) {
					return event.nature && event.nature == 'thunder'
				},
				content: function () {
					trigger.cancel()
				},
			}
		},
		enable: "chooseToUse",
		filterCard: function (card) {
			return get.suit(card) == "spade";
		},
		position: "h",
		viewAs: {
			name: "shandian",
		},
		viewAsFilter: function (player) {
			return player.hasCard(card => get.suit(card) == "spade", "h");
		},
		prompt: "将一张黑桃手牌【闪电】使用",
		check: function (card) {
			return 8 - get.value(card);
		},
		ai: {
			order: 10,
			result: {player:2}
		}
	},
	//洋葱怪人
	OnionCells_yzs: {
		group: ["OnionCells_yzs_summon", "OnionCells_yzs_view"],
		global: ["OnionCells_yzs_Onion_auto"],
		subSkill: {
			Onion_auto: {
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
					if (!_status.Onion_auto || !_status.Onion_auto.includes(player.playerid)) return false;
					if (event.autochoose && event.autochoose()) return false;
					//if (lib.filter.wuxieSwap(event)) return false;
					return true;
				},
				async content(event, trigger, player) {
					if (trigger.name == 'die') {
						const map = lib.playerOL ?? game.playerMap;
						for (const id of _status.Onion_auto) {
							const current = map[id];
							if (current.isAlive() && current != player) {
								game.broadcastAll((onion) => {
									if (game.me.playerid != onion.playerid) return;
									let evt = _status.event.getParent("chooseToUse")
									if (!evt) return;
									evt.endButton?.close();
									delete evt.endButton;
									ui.exit?.close();
									delete ui.exit;
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
					if (_status.Onion_auto.includes(player.playerid) && (_status.connectMode ? (!player.isOnline2() || player != game.me) : true)) {
						const map = lib.playerOL ?? game.playerMap;
						for (const id of _status.Onion_auto) {
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
			view: {
				nopop: true,
				charlotte: true,
				ai: {
					viewHandcard: true,
					skillTagFilter(player, tag, arg) {
						if (player == arg) {
							return false;
						}
						if (!_status.Onion_auto || !_status.Onion_auto.length) return false;
						if (_status.Onion_auto.includes(player.playerid) && _status.Onion_auto.includes(arg.playerid)) {
							return true;
						};
						return false;
					},
				},
			},
			summon: {
				locked: true,
				forced: true,
				forceDie: true,
				priority: 11,
				trigger: {
					global: ["dieBefore"]
				},
				filter(event, player) {
					return event.player.countMark("OnionCells_yzs");
				},
				async content(event, trigger, player) {
					const pos = trigger.player;
					pos.clearMark("OnionCells_yzs")
					if (!get.attitude_OnionCells_yzs) {
						get.attitude_OnionCells_yzs = get.attitude;
						get.attitude = function (from, to) {
							if (from && from?.getStorage("OnionCells_yzs_source", false)) {
								from = from.getStorage("OnionCells_yzs_source", false);
							}
							if (to && to?.getStorage("OnionCells_yzs_source", false)) {
								to = to.getStorage("OnionCells_yzs_source", false);
							}
							let att = get.attitude_OnionCells_yzs(from, to);
							return att;
						};
					}
					const Onion = await game.addPlayerOL(pos, "OnionMan_yzs2", null, true);
					game.broadcastAll((Onion) => {
						Onion.isNoPlayer_OnionCells_yzs = true;
						Onion.dieAfter2 = function () { };
					}, Onion)
					Onion.setStorage("OnionCells_yzs_source", player);
					Onion.ai.modAttitudeFrom = function (from, to, att) {
						if (_status.OnionCells_yzs_source_att_ing) return att;
						if (from.getStorage("OnionCells_yzs_source", false)) {
							from = from.getStorage("OnionCells_yzs_source", false);
						}
						if (to.getStorage("OnionCells_yzs_source", false)) {
							to = to.getStorage("OnionCells_yzs_source", false);
						}
						_status.OnionCells_yzs_source_att_ing = true;
						att = get.attitude(from, to);
						delete _status.OnionCells_yzs_source_att_ing;
						return att;
					};
					game.broadcastAll((Onion, player) => {
						if (get.mode() == 'guozhan') {
							if (Onion.name2 == undefined) Onion.name2 = Onion.name1;
						}
						if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
							Onion.side = player.side;
							Onion.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
							Onion.node.identity.dataset.color = player.node.identity.dataset.color;
						}
						Onion.skillH = [];
						Onion.storage.zhibi = [];
						Onion.storage.stratagem_expose = [];
						Onion.storage.stratagem_fury = 0;
					}, Onion, player);
					game.broadcastAll((Onion, player) => {
						const identity = (Onion.identity = (identity => {
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
						const goon = player !== game.me && Onion !== game.me && player.node.identity.classList.contains("guessing") && !player.identityShown;
						if (goon) {
							if (Onion.identityShown) delete Onion.identityShown;
							if (!Onion.node.identity.classList.contains("guessing")) Onion.node.identity.classList.add("guessing");
						}
						Onion.setIdentity(goon ? "cai" : undefined);
						if (Onion.node.dieidentity) Onion.node.dieidentity.innerHTML = get.translation(Onion.identity + 2);
						if (typeof player.ai?.shown === "number" && Onion.ai) Onion.ai.shown = player.ai.shown;
					}, Onion, player);
					Onion.directgain(get.cards(4));
					Onion.addSkill("OnionCells_yzs_view")
					Onion
						.when({ global: "dieAfter" })
						.filter((evt, player2) => {
							if (evt.reserveOut) return false;
							return evt.player == player2;
						})
						.assign({
							forceDie: true,
						})
						.step(lib.skill[event.name].dieRemove);
					game.broadcastAll(function (player, Onion) {
						if (!_status.Onion_auto) {
							_status.Onion_auto = [player.playerid, Onion.playerid];
						}
						else {
							_status.Onion_auto.push(Onion.playerid)
						}
						Onion._trueMe = player;
						player._trueMe = player;
					}, player, Onion)
					game.log(player, '召唤了', lib.translate['OnionMan_yzs2']);
				},
				async dieRemove(event, trigger, player) {
					game.broadcastAll(function (Onion) {
						if (_status.Onion_auto) _status.Onion_auto.remove(Onion.playerid)
					}, player)
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
		markimage: 'extension/一中杀/image/OnionCells_yzs.png',
		intro: {
			nocount: true,
			content: `你即将死亡时下家生成一只${get.poptip("OnionMan_yzs2")}（初始手牌数为4）`,
		},
		nobracket: true,
		locked: true,
		charlotte: true,
		unique: true,
		forced: true,
		priority: 12452,
		unique: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			let x = Math.floor(game.countPlayer(i => !i.storage.isSub && player != i) / 2);
			if (x < 1) return;
			let result = await player.chooseTarget("洋葱细胞：请选择寄生的目标", `其即将死亡时你于其下家召唤${get.poptip("OnionMan_yzs2")}（初始手牌数为4）`, x, true, function (card, player, target) {
				return !target.storage.isSub && player != target
			}).forResult()
			if (!result.bool) return;
			for (let target of result.targets) {
				target.addMark("OnionCells_yzs")
			}
			if (!_status.OnionCells_yzs) {
				if (!game.checkResult_OnionCells_yzs) {
					game.checkResult_OnionCells_yzs = game.checkResult;
					game.checkResult = function () {
						const all = game.players.concat(game.dead);
						const origin_Onion = all.filter(i => i.hasSkill("OnionCells_yzs"))[0];//最初的洋葱怪人
						if (!origin_Onion.origin_isAlive) {
							origin_Onion.origin_isAlive = origin_Onion.isAlive
						}
						origin_Onion.isAlive = function () {
							if (game.players.includes(this)) {
								return true;
							}
							return this.origin_isAlive()
						}
						const isDead = !game.players.includes(origin_Onion);//最初的洋葱怪人是否已经死亡
						const targets = game.players.filter(i => i.isNoPlayer_OnionCells_yzs);
						const hasRemain = game.players.some(i => i.isNoPlayer_OnionCells_yzs);//是否还有剩余的洋葱怪人
						game.players.removeArray(targets);
						if (isDead && hasRemain) game.players.add(origin_Onion);
						game.checkResult_OnionCells_yzs();
						if (isDead && hasRemain) game.players.remove(origin_Onion);
						game.players.addArray(targets);
						origin_Onion.isAlive = origin_Onion.origin_isAlive;
					};
				}
				if (!game.checkOnlineResult_OnionCells_yzs) {
					game.checkOnlineResult_OnionCells_yzs = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						const all = game.players.concat(game.dead);
						const origin_Onion = all.filter(i => i.hasSkill("OnionCells_yzs"))[0];//最初的洋葱怪人
						if (!origin_Onion.origin_isAlive) {
							origin_Onion.origin_isAlive = origin_Onion.isAlive
							origin_Onion.isAlive = function () {
								if (game.hasPlayer(i => i.isNoPlayer_OnionCells_yzs)) return true;
								return this.origin_isAlive()
							}
						}
						const isDead = !game.players.includes(origin_Onion);//最初的洋葱怪人是否已经死亡
						const targets = game.players.filter(i => i.isNoPlayer_OnionCells_yzs);
						const hasRemain = game.players.filter(i => i.isNoPlayer_OnionCells_yzs);//是否还有剩余的洋葱怪人
						game.players.removeArray(targets);
						if (isDead && hasRemain) game.players.add(origin_Onion);
						game.checkOnlineResult_OnionCells_yzs();
						if (isDead && hasRemain) game.players.remove(origin_Onion);
						game.players.addArray(targets);
						origin_Onion.isAlive = origin_Onion.origin_isAlive;
					};
				}
				game.broadcastAll(() => {
					_status.OnionCells_yzs = true;
				})
			}
		},
	},
	Quirk_yzs: {
		mod: {
			targetEnabled(card, player, target, now) {
				if (player == target) return;
				if (get.type2(card) == "trick" || card.name == "tao") return false;
			},
		},
	},
	Absurd_yzs: {
		priority: -1,
		direct: true,
		popup: true,
		trigger: {
			player: "useCardAfter"
		},
		filter(event, player) {
			if (get.type(event.card) != "trick") return false;
			if (event.getParent(2).name == "Absurd_yzs") return false;
			return true;
		},
		async content(event, trigger, player) {
			const card = player.storage.Absurd_yzs;
			player.storage.Absurd_yzs = trigger.card;
			player.markSkill("Absurd_yzs")
			player.addTip("Absurd_yzs", "荒诞 " + get.translation(trigger.card.name), false);
			if (card?.name) {
				const info = lib.card[card.name]
				if (info.notarget) return;
				if (!player.hasUseTarget(card.name)) return;
				await player.chooseUseTarget(card.name, true);
			}
		}
	},
	//圣白莲
	chaoren_yzs: {
		group: ["chaoren_yzs_draw", "chaoren_yzs_shanreq"],
		subSkill: {
			draw: {
				locked: true,
				name: "魔法「紫云之兆」",
				priority: 6,
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.countMark("chaoren_yzs_MPS") > 0;
				},
				async content(event, trigger, player) {
					trigger.num += player.countMark("chaoren_yzs_MPS") - 2;
				},
				ai: {
					threaten: 1.3,
				},
			},
			shanreq: {
				name: "因陀罗之雷",
				trigger: {
					player: "useCardToPlayered",
				},
				forced: true,
				sourceSkill: "chaoren_yzs",
				filter(event, player) {
					return event.card.name == "sha" && !event.getParent().directHit.includes(event.target) && player.countMark("chaoren_yzs_XYS") > 0;
				},
				logTarget: "target",
				async content(event, trigger, player) {
					const id = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[id]) {
						map[id] = {};
					}
					if (typeof map[id].shanRequired == "number") {
						map[id].shanRequired += player.countMark("chaoren_yzs_XYS") - 1;
					} else {
						map[id].shanRequired = player.countMark("chaoren_yzs_XYS");
					}
				},
			},
		},
		priority: 6,
		locked: true,
		forced: true,
		init: function (player, skill) {
			if (Array.isArray(player.storage.chaoren_yzs)) return;
			player.storage.chaoren_yzs = ["chaoren_yzs_SPSX", "chaoren_yzs_MPS"]
			player.markSkill("chaoren_yzs")
		},
		trigger: {
			player: "phaseBegin"
		},
		async content(event, trigger, player) {
			player.logSkill("chaoren_yzs_name1")
			let results = [];
			let num = player.countMark("chaoren_yzs_num") + 2;
			let numOf6 = 1;
			while (num--) {
				let r = await player.yzs_throw().forResult()
				results.push(r)
			//	if (r.number == 6) numOf6++;
			}
			results.sort(function (a, b) {
				return b.number - a.number;
			});
			let cur = 0;
			for (let result of results) {
				if (cur >= player.storage.chaoren_yzs.length) break;
				player.setMark(player.storage.chaoren_yzs[cur], Math.max(result.number, 1), false);
				cur++;
			}
			if (!player.hasSkill("youxingsheng_yzs")) return;
			const map = {
				chaoren_yzs_SPSX: `手牌上限`,
				chaoren_yzs_MPS: `摸牌数`,
				chaoren_yzs_JGJL: `进攻距离`,
				chaoren_yzs_CSS: `出【杀】数`,
				chaoren_yzs_FYJL: `防御距离`,
				chaoren_yzs_XYS: `【杀】需响应数`,
			}
			if (numOf6 > 0) player.logSkill("chaoren_yzs_name2")
			for (let i = 1; i <= numOf6; i++) {
				let storage = player.storage.youxingsheng_yzs;
				let list = storage.length ? storage.map(i => i = [i, map[i]]) : player.storage.chaoren_yzs.map(i => i = [i, map[i]]);
				let prompt = storage.length ? `将以下一项数值移动至【超人】描述末尾，` : `令【超人】中一项数值+2，`;
				prompt += `不选则此后【超人】多投掷1枚骰子`
				let result = await player.chooseButton([
					`${prompt}`,
					[
						list,
						"textbutton",
					],
				])
					.set("selectButton", 1)
					.set("filterButton", function (button) {
						return true;
					})
					.set("ai", button => {
						const player = get.player();
						let rand = Math.random();
						if (rand < 0.8) return 0;
						let v = button.link == "chaoren_yzs_XYS" ? 2: 3;
						return Math.random() + v;
					})
					.forResult();
				if (!result.bool) {
					player.addMark("chaoren_yzs_num", 1, false)
				} else {
					if (storage.length) {
						player.storage.youxingsheng_yzs = player.storage.youxingsheng_yzs.filter(i => i != result.links[0])
						player.markSkill("youxingsheng_yzs")
						player.storage.chaoren_yzs.push(result.links[0])
						player.markSkill("chaoren_yzs")
					} else {
						player.addMark(result.links[0], 2, false);
					}
				}
			}
			player.playEffectOL(lib.skill.GodgivenSwordsmanship_yzs.Effect);
			if (lib.config.background_audio) {
				game.playAudio("effect", "recover");
			}
		},
		mod: {
			maxHandcardBase: function (player, num) {
				return player.countMark("chaoren_yzs_SPSX");
			},
			globalFrom: function (from, to, distance) {
				return distance - from.countMark("chaoren_yzs_JGJL");
			},
			cardUsable(card, player, num) {
				if (card.name != "sha") return;
				if (!player.countMark("chaoren_yzs_CSS")) return num;
				return num + player.countMark("chaoren_yzs_CSS") - 1;
			},
			/*globalTo: function (from, to, distance) {
				return distance + to.countMark("chaoren_yzs_FYJL");
			},*/
		},
	},
	youxingsheng_yzs: {
		nobracket: true,
		locked: true,
		init: function (player, skill) {
			if (Array.isArray(player.storage.youxingsheng_yzs)) return;
			player.storage.youxingsheng_yzs = ["chaoren_yzs_CSS", "chaoren_yzs_JGJL", "chaoren_yzs_XYS"]
			player.markSkill("youxingsheng_yzs")
		},
		forced: true,
		trigger: {
			player: "yzs_throwBegin"
		},
		filter(event, player) {
			return !player.storage.youxingsheng_yzs.length
		},
		async content(event, trigger, player) {
			player.logSkill("youxingsheng_yzs_name");
			trigger.extra++;
		}
	},
	//摩多罗隐歧奈
	ReverseInvoker_yzs: {
		locked:true,
		nobracket: true,
		group: ["ReverseInvoker_yzs_round", "ReverseInvoker_yzs_renew", "ReverseInvoker_yzs_gain"],
		global: "ReverseInvoker_yzs_phase",
		subSkill: {
			targeted: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "ReverseInvoker_yzs",
				"_priority": 0,
			},
			renew: {
				onremove: true,
				charlotte: true,
				popup: false,
				forced: true,
				priority: 11,
				trigger: {
					global: "roundStart",
				},
				async content(event, trigger, player) {
					player.setMark("ReverseInvoker_yzs", 1, false)
					for (let target of game.filterPlayer()) {
						target.removeSkill("ReverseInvoker_yzs_targeted")
					}
				},
				sub: true,
				sourceSkill: "ReverseInvoker_yzs",
				"_priority": 0,
			},
			round: {
				name: "秘仪「摩多罗苦谛」",
				priority: -11,
				trigger: {
					global: "roundStart",
				},
				filter(event, player) {
					return player.countDiscardableCards(player, "he") >= 2 && game.hasPlayer(target => !target.hasSkill("hidden_yzs") && !target.hasSkill("ReverseInvoker_yzs_targeted"));
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseCardTarget(false)
						.set("filterTarget", (card, player, target) => {
							return !target.hasSkill("hidden_yzs") && !target.hasSkill("ReverseInvoker_yzs_targeted")
						})
						.set("prompt", `你可弃2张牌并令1名本轮未因此指定过的角色执行回合`)
						.set("prompt2", `此回合结束后其翻面，然后你可重复本操作。`)
						.set("filterCard", lib.filter.cardDiscardable)
						.set("selectCard", 2)
						.set("position", "he")
						.forResult()
				},
				async content(event, trigger, player) {
					if (event.cards.length) await player.discard(event.cards);
					if (event.targets.length) {
						await event.targets[0].addSkill("ReverseInvoker_yzs_targeted")
						await event.targets[0].phase("ReverseInvoker_yzs");
						await event.targets[0].turnOver();
					}
					/*while (player.countDiscardableCards(player, "he") >= 2 && game.hasPlayer(target => !target.hasSkill("hidden_yzs") && !target.hasSkill("ReverseInvoker_yzs_targeted"))) {
						let result = await player.chooseCardTarget(false)
							.set("filterTarget", (card, player, target) => {
								return !target.hasSkill("hidden_yzs") && !target.hasSkill("ReverseInvoker_yzs_targeted")
							})
							.set("prompt", `你可弃2张牌并令1名本轮未因此指定过的角色执行回合`)
							.set("prompt2", `此回合结束后其翻面，然后你令X本轮内+1并可重复本操作。（X初始为1）`)
							.set("filterCard", lib.filter.cardDiscardable)
							.set("selectCard", 2)
							.set("position", "he")
							.forResult()
						if (!result.bool) return;
						if (result.cards.length) await player.discard(result.cards);
						if (result.targets.length) {
							await event.targets[0].addSkill("ReverseInvoker_yzs_targeted")
							await result.targets[0].phase("ReverseInvoker_yzs");
							await result.targets[0].turnOver();
						}
					}
					*/
				},
			},
			gain: {
				name: "秘仪「逆向呼神者」",
				prompt2: " 准备阶段，你展示并获得牌堆底牌直至展示红色牌",
				priority: -2,
				frequent: true,
				trigger: {
					player: "phaseZhunbeiBegin"
				},
				async content(event, trigger, player) {
					while (true) {
						const card = get.bottomCards(1, true)[0]
						await player.showCards(card, `秘仪【逆向呼神者】`, true, false);
						if (get.color(card, player) == "red") {
							card.fix();
							ui.cardPile.appendChild(card);
							return;
						};
						await player.gain(card, "gain2")
					}
				}
			}
		},
		priority: -12,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			return event.player.countCards("h") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await trigger.player.chooseCard("h", false, [1, 2], "逆向呼神", "将1~2张手牌展示并置底，然后若均为黑色则你摸等量张牌")
				.set("ai", card => {
					if (get.color(card) == "black") return 10 - get.value(card);
					return 7 - get.value(card);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			if (!event.cards || !event.cards.length) return;
			await trigger.player.showCards(event.cards);
			let resultx = event.cards.length == 1 ? { bool: true, moved: [event.cards] } : await trigger.player
				.chooseToMove("逆向呼神：将牌按顺序置于牌堆底（右为底）")
				.set("list", [["牌堆底", event.cards]])
				.set("processAI", list => {
					return [list[0][1].slice(0)];
				})
				.forResult();
			const moved = resultx.moved[0];
			if (moved.length) {
				await trigger.player.lose(moved, ui.cardPile);
			}
			if (!event.cards.some(card => get.color(card) != "black")) {
				await trigger.player.draw(event.cards.length);
			}
		}
	},
	houhukuangyan_yzs: {
		locked: true,
		nobracket: true,
		group: ["houhukuangyan_yzs_yuyan2","houhukuangyan_yzs_zhuanhuan"],
		subSkill: {
			ban: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "houhukuangyan_yzs",
				"_priority": 0,
			},
			yuyan1: {
				name: "后符「秘神的后光」",
				locked: true,
				forced: true,
				priority: -2,
				trigger: {
					global: ["phaseJudge"]
				},
				filter(event, player) {
					if (!event.card) return false;
					return event.delayEffect && event.card.name == "xianzheyuyan_yzs";
				},
				async content(event, trigger, player) {
					const controls = ["draw_card", "recover_hp"];
					const prompt = `令 ${get.translation(trigger.player)} 的${get.translation(trigger.card)} 仅摸牌或仅恢复体力`
					let next = player.chooseControl(controls);
					next.set("prompt", prompt);
					next.set("forced", true);
					let result = await next.forResult();
					if (result.control == "recover_hp") {
						if (trigger.effect?.draw) trigger.effect.draw = 0;
					} else {
						if (trigger.effect?.recover) trigger.effect.recover = 0;
					}
				}
			},
			yuyan2: {
				name: "后符「秘神的后光」",
				locked: true,
				forced: true,
				priority: -3,
				trigger: {
					global: ["phaseJudge"]
				},
				filter(event, player) {
					if (!event.card) return false;
					if (!lib.card[event.card.name]?.noEffect_yzs) return false;
					return !event.delayEffect && event.card.name == "xianzheyuyan_yzs";
				},
				async content(event, trigger, player) {
					await trigger.player.loseHp();
				},
			},
			zhuanhuan: {
				nopop: true,
				locked: true,
				name: "背面的暗黑猿乐",
				zhuanhuanji: true,
				mark: true,
				marktext: "☯",
				intro: {
					content(storage, player, skill) {
						const str = storage ? "需要时，你翻面并视为使用【无懈可击】" : "需要时，你翻面并视为使用【桃】"
						return str;
					},
				},
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					const str = player.storage.houhukuangyan_yzs_zhuanhuan ? "wuxie" : "tao"
					return name == str;
				},
				filter(event, player) {
					const str = player.storage.houhukuangyan_yzs_zhuanhuan ? "wuxie" : "tao"
					return event.filterCard({ name: str, isCard: true }, player, event)
				},
				async precontent(event, trigger, player) {
					player.markSkill("houhukuangyan_yzs_zhuanhuan")
					player.logSkill("houhukuangyan_yzs_zhuanhuan");
					player.changeZhuanhuanji(event.name.slice(4));
					await player.turnOver();
				},
				viewAsFilter(player) {
					return true
				},
				viewAs(cards, player) {
					const str = player.storage.houhukuangyan_yzs_zhuanhuan ? "wuxie" : "tao"
					return { name: str, isCard: true };
				},
				filterCard: () => false,
				selectCard: -1,
				prompt() {
					if (_status.event.player.storage.houhukuangyan_yzs_zhuanhuan) {
						return "你翻面并视为使用【无懈可击】";
					}
					return "你翻面并视为使用【桃】";
				},
				log: false,
				ai: {
					save: true,
					skillTagFilter(player, tag, arg) {
						if (player.storage.houhukuangyan_yzs_zhuanhuan || player.isTempBanned("houhukuangyan_yzs")) {
							return false;
						}
						return true
					},
					basic: {
						useful: [6, 4, 3],
						value: [6, 4, 3],
					},
					result: {
						player: 1,
					},
					expose: 0.2,
				},
			},
		},
		prompt: "你可将牌堆底牌当做【贤者预言】对无此牌的角色使用，然后若之为黑色，你失去1点体力且本回合不可再如此做",
		enable: "phaseUse",
		filter(event, player) {
			if (player.hasSkill("houhukuangyan_yzs_ban")) return false;
			return game.hasPlayer(target => player.canUse("xianzheyuyan_yzs", target) && !target.hasJudge("xianzheyuyan_yzs"))
		},
		filterTarget: function (card, player, target) {
			return player.canUse("xianzheyuyan_yzs", target) && !target.hasJudge("xianzheyuyan_yzs")
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			event.cards = get.bottomCards();
			await player.useCard(event.cards, { name: "xianzheyuyan_yzs", isCard: false }, event.targets[0]);
			if (get.color(event.cards[0]) == "black") {
				await player.loseHp();
				player.addTempSkill("houhukuangyan_yzs_ban");
			}
		},
		ai: {
			order: 5,
			result: {
				target:2,
			}
		}
	},
	//阳·比斯莫克
	CityWill_yzs: {
		group: ["CityWill_yzs_gain", "CityWill_yzs_command", "CityWill_yzs_use"],
		subSkill: {
			gain: {
				locked: true,
				priority: -2,
				forced: true,
				trigger: {
					global: "loseAfter",
				},
				filter(event, player) {
					if (game.hasPlayer(cur => cur.countExpansions("CityWill_yzs"))) return false;
					return true
				},
				async content(event, trigger, player) {
					await player.useSkill("CityWill_yzs")
				}
			},
			use: {
				locked: true,
				forced: true,
				priority: 5,
				trigger: {
					player: "Yan_yzs_commandEnd"
				},
				async content(event, trigger, player) {
					await player.draw();
					let bool = false;
					if (trigger.request == "black") {
						if (get.tag(trigger.card, "damage")) bool = true;
					} else {
						if (get.tag(trigger.card, "recover")) bool = true;
					}
					if (!bool) return;
					let result = await player.chooseBool("你达成了指令。是否令你手牌上限永久+1?")
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								return true
							})()
						)
						.forResult();
					if (result.bool) {
						await player.addMark("CityWill_yzs_command", 1, false);
					}
				}
			},
			command: {
				mod: {
					maxHandcardBase: function (player, num) {
						return num + player.countMark("CityWill_yzs_command");
					},
				},
				name: "指令",
				locked: true,
				forced: true,
				priority: -6,
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					if (!event.player.hasSkill("CityWill_yzs") && !event.player.countExpansions("CityWill_yzs")) return false;
					let cards = [];
					for (let target of game.filterPlayer()) {
						if (target.countExpansions("CityWill_yzs")) cards = cards.concat(target.getExpansions("CityWill_yzs"))
					}
					let request = get.color(event.card) == "black" ? "black" : "red";
					cards = cards.filter(card => get.color(card) == request);
					return cards.length;
				},
				async content(event, trigger, player) {
					let map = {};
					for (let target of game.filterPlayer()) {
						map[target.playerid] = target.getExpansions("CityWill_yzs")
					}
					for (let target of game.filterPlayer()) {
						let request = get.color(trigger.card) == "black" ? "black" : "red";
						let cards = map[target.playerid]
						cards = cards.filter(card => get.color(card) == request);
						if (!cards.length) continue;
						await target.loseToDiscardpile(cards)
						for (let i = 0; i < cards.length; i++) {
							var next = game.createEvent("Yan_yzs_command");
							next.card = trigger.card
							next.player = trigger.player;
							next.request = request;
							next.setContent(async function (event, trigger, player) {
								if (event.request == "black") {
									if (get.tag(event.card, "damage")) {
										await player.draw();
									} else {
										await player.loseHp();
									}
								} else {
									if (get.tag(event.card, "recover")) {
										await player.recover();
									} else {
										if (player.countDiscardableCards(player, "he")) await player.chooseToDiscard("he", true);
									}
								}
							});
							await next;
						}
					}
				},
			},
		},
		locked: true,
		nobracket: true,
		marktext: "令",
		intro: {
			mark(dialog, content, player) {
				const cards = player.getExpansions("CityWill_yzs");
				if (!cards.length) return `当前无${get.poptip("CityWill_yzs_command")}`;
				dialog.addText(`当前${get.poptip("CityWill_yzs_command")}为：`);
				dialog.addAuto(cards);
				let players = game.filterPlayer(cur => cur.hasSkill("CityWill_yzs"));
				if (!players.includes(player)) players.push(player);
				let str = ``;
				for (let i = 0; i < players.length; i++) {
					str += get.translation(players[i]);
					if (i != players.length - 1) str += ` 或 `;
				}
				if (get.color(cards[0]) == "black") {
					dialog.addText(`${str} 使用黑色伤害牌时摸1张牌，使用黑色非伤害牌后失去1点体力`);
				} else {
					dialog.addText(`${str} 使用红色恢复牌时恢复1点体力，使用红色非恢复牌后弃1张牌`);
				}
			},
		},
		priority: -2,
		trigger: {
			global: ["phaseBefore"],
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			if (game.hasPlayer(cur => cur.countExpansions("CityWill_yzs"))) return false;
			if (event.name == "Yan_yzs_command") return true;
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			const cards = get.cards()
			await player.showCards(cards, `都市的指令`, true, false);
			let str = get.color(cards[0]) == "black" ? `使用黑色伤害牌后摸1张牌，使用黑色非伤害牌后失去1点体力` : `使用红色恢复牌后恢复1点体力，使用红色非恢复牌后弃1张牌`
			let result = await player
				.chooseTarget("将指令传达给1名角色，其可替你完成【指令】", str, false, function (card, player, target) {
					return true
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
			const target = result.bool ? result.targets[0] : player;
			let next = target.addToExpansion(cards, "gain2", target)
			next.gaintag.add("CityWill_yzs");
			await next;
		},
		mod: {
			aiOrder(player, card, num) {
				let cards = [];
				for (let target of game.filterPlayer()) {
					if (target.countExpansions("CityWill_yzs")) cards = cards.concat(target.getExpansions("CityWill_yzs"))
				}
				let request = get.color(cards[0]) == "black" ? "black" : "red";
				if (request == "black") {
					if (get.tag(card, "damage")) return num + 10;
					return num / 10
				} else {
					if (get.tag(card, "recover")) return num + 10;
					return num / 10
				}
			},
		},
	},
	FreeWill_yzs: {
		mod: {
			maxHandcardBase: function (player, num) {
				return num - player.countMark("FreeWill_yzs");
			},
		},
		prompt2(event, player) {
			let str = `${get.translation(event.player)} `
			if (event.request == "black") {
				if (get.tag(event.card, "damage")) str += ` 达成了指令，即将摸1张牌`;
				else str += ` 未达成指令，即将失去1点体力`
			} else {
				if (get.tag(event.card, "recover")) str += ` 达成了指令，即将恢复1点体力`;
				else str += ` 未达成指令，即将弃1张牌`
			}
			return `${str}<br>你可将本次【指令】效果改为 你 摸1张牌，然后你手牌上限-1`
		},
		logTarget: true,
		locked: true,
		nobracket: true,
		priority: 4,
		trigger: {
			global: "Yan_yzs_commandBefore"
		},
		filter(event, player) {
			if (!player.countMark("LiberationTide_yzs")&& player.countMark("FreeWill_yzs_used"))return false;
			return player.getHandcardLimit() > 0
		},
		check(event, player) {
			if (event.request == "black") {
				if (get.tag(event.card, "damage")) return get.attitude(player, event.player) < 0;
				return get.attitude(player, event.player) > 0;
			} else {
				if (get.tag(event.card, "recover")) return get.attitude(player, event.player) < 0;
				return get.attitude(player, event.player) > 0;
			}
		},
		async content(event, trigger, player) {
			player.addMark("FreeWill_yzs_used",1,false)
			trigger.setContent(lib.skill.FreeWill_yzs.commandContent);
			trigger.FreeWill_yzs = player
			player.addMark("FreeWill_yzs", 1, false)
		},
		async commandContent(event, trigger, player) {
			if (event.FreeWill_yzs) await event.FreeWill_yzs.draw();
		},
	},
	LiberationTide_yzs: {
		group: "LiberationTide_yzs_wash",
		subSkill: {
			wash: {
				name: "都市之意",
				trigger: {
					global: "washCard",
				},
				locked: true,
				nobracket: true,
				dutySkill: true,
				forced: true,
				skillAnimation: true,
				animationColor: "thunder",
				filter(event, player) {
					return !player.hasSkill("LiberationTide_yzs_failed")
				},
				async content(event, trigger, player) {
					await player.awakenSkill('LiberationTide_yzs');
					game.broadcastAll(() => {
						_status.tempMusic = `ext:一中杀/audio/Children of the City.mp3`;
						game.playBackgroundMusic();
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					});
					game.log(player, '使命失败');
					game.log(player, "扭曲化了");
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Yan_yzs2.png");
					}, player)
					game.broadcastAll(
						(player, name) => {
							if (player.name == "dc_noname" || player.name1 == "dc_noname") {
								player.node.name.innerHTML = name;
							}
							if (player.name2 == "dc_noname") {
								player.node.name2.innerHTML = name;
							}
						},
						player,
						"扭曲阳"
					);
					await player.removeSkills("FreeWill_yzs")
					player.addSkill("LiberationTide_yzs_failed")
				}
			},
			failed: {
				locked: true,
				forced: true,
				priority: 4,
				trigger: {
					player: "Yan_yzs_commandEnd"
				},
				filter(event, player) {
					return game.hasPlayer(cur => !cur.hasSkill("hidden_yzs"))
				},
				async content(event, trigger, player) {
					let result = await player
						.chooseTarget("选择1名目标", `你对其造成1点伤害`, true, function (card, player, target) {
							return !target.hasSkill("hidden_yzs")
						})
						.set("ai", function (target) {
							const player = get.player();
							return get.damageEffect(target,player,player)
						})
						.set("animate", false)
						.forResult();
					if (!result.bool) return;
					await result.targets[0].damage();
				}
			},
		},
		locked: true,
		nobracket: true,
		trigger: {
			player: ["phaseZhunbeiBegin"],
		},
		dutySkill: true,
		forced: true,
		skillAnimation: true,
		animationColor: "thunder",
		filter(event, player) {
			return player.getHandcardLimit() == 0;
		},
		async content(event, trigger, player) {
			await player.awakenSkill('LiberationTide_yzs');
			let num = 2;
			const maps = {};
			while (num > 0) {
				const result = await player.chooseTarget(`###解放之潮###请选择分配体力恢复的目标（剩余${num}点）`, 1)
					.set("onChooseTarget", function () {
						const event = get.event();
						event.targetprompt2.add(target => {
							const maps = get.event().maps;
							const list = [];
							if (!maps[target.playerid]) list.add("0点");
							else list.add("" + maps[target.playerid] + "点");
							return list;
						});
					})
					.set("maps", maps)
					.set('ai', target => {
						const player = get.player();
						return get.recoverEffect(target, player, player);
					})
					.forResult();
				if (result.bool) {
					const next2 =
						num == 1
							? {
								bool: true,
								numbers: [1],
							}
							: await player
								.chooseNumbers('解放之潮', [{ prompt: '请选择你要分配数值', min: 1, max: num }], true)
								.set('processAI', () => {
									return [get.event().numz];
								})
								.set('numz', num)
								.forResult();
					if (next2.bool) {
						const num2 = next2.numbers?.[0];
						maps[result.targets[0].playerid] = (maps[result.targets[0].playerid] || 0) + num2;
						num -= num2;
					}
				} else {
					break;
				}
			}
			if (Object.keys(maps).length) {
				for (const target of game.filterPlayer()) {
					if (maps[target.playerid]) {
						await target.recover(maps[target.playerid]);
					}
				}
			}
			game.broadcastAll(() => {
				_status.tempMusic = `ext:一中杀/audio/Children of the City.mp3`;
				game.playBackgroundMusic();
				ui.backgroundMusic.addEventListener('ended', () => {
					delete _status.tempMusic;
					game.playBackgroundMusic();
				}, { once: true });
			});
			game.broadcastAll(function () {
				ui.background.setBackgroundImage('extension/一中杀/image/background/LiberationTide_yzs.jpg');
			})
			game.log(player, '成功完成使命');
			player.addMark("LiberationTide_yzs", 1, false)
		}
	},
	//莉可
	MadeInAbyss_yzs: {
		derivation: ["BlazeLeap_yzs", "YourWorth_yzs"],
		group: ["MadeInAbyss_yzs_draw", "MadeInAbyss_yzs_renew", "MadeInAbyss_yzs_end"],
		subSkill: {
			record: {
				onremove(player, skill) {
					player.clearMark(skill, false);
					player.removeTip(skill);
				},
				charlotte:true,
				sub: true,
				marktext: "渊",
				intro: {
					nocount: true,
					mark(dialog, content, player) {
						const storage = player.countMark("MadeInAbyss_yzs_record");
						if (!storage || storage == 100) {
							dialog.addText("本回合你未使用或打出过牌");
							return;
						}
						if (typeof storage == "number") dialog.addText(`本回合你使用或打出的上张牌点数为${get.translation(storage)}`);
						dialog.addText("特殊地，无点数牌不进入记录");
					},
				},
			},
			draw: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				name: "探窟",
				priority: 7,
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.countMark("MadeInAbyss_yzs") >= 0;
				},
				async content(event, trigger, player) {
					trigger.num += player.countMark("MadeInAbyss_yzs") - 1;
				},
				ai: {
					threaten: 1.3,
				},
			},
			end: {
				locked: true,
				enable: "phaseUse",
				prompt: "从奈落之底召回死去角色的灵魂，令其重新加入游戏(无初始手牌)，然后你失去【来自深渊】",
				skillAnimation: true,
				filterTarget(card, player, target) {
					return game.dead.includes(target);
				},
				filter(event, player) {
					if (player.countMark("MadeInAbyss_yzs") != 6) return false;
					return game.dead.length > 0;
				},
				selectTarget: [0, Infinity],
				multitarget: true,
				multiline: true,
				deadTarget: true,
				async content(event, trigger, player) {
					player.removeSkill("MadeInAbyss_yzs")
					player.removeTip("MadeInAbyss_yzs_record");
					player.awakenSkill(event.name);
					game.broadcastAll(() => {
						_status.tempMusic = `ext:一中杀/audio/Hanezeve Caradhina.mp3`;
						game.playBackgroundMusic();
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					});
					for (let target of event.targets) {
						let hp = lib.character[target.name].hp
						if (!hp) hp = target.maxHp
						await target.reviveEvent(hp);
						let maxHp = lib.character[target.name].maxHp
						if (maxHp) {
							target.maxHp = maxHp;
							target.update()
						}
					}
				},
			},
		},
		nobracket: true,
		locked: true,
		priority: -7,
		trigger: {
			player: ["useCard", "respond"],
		},
		popup: false,
		forced: true,
		async content(event, trigger, player) {
			const number = get.number(trigger.card, player)
			if (typeof number !== "number" || number > 13 || number < 1) return;
			player.addTempSkill("MadeInAbyss_yzs_record")
			if (!player.countMark("MadeInAbyss_yzs_record")) {
				player.setMark("MadeInAbyss_yzs_record", Math.max(number, 1), false)
				player.addTip("MadeInAbyss_yzs_record", "来自深渊 ≤" + player.countMark("MadeInAbyss_yzs_record"), false);
				if (number == 1) {
					player.setMark("MadeInAbyss_yzs", (player.countMark("MadeInAbyss_yzs") + 1) % 7, false);
					player.popup(`深界${get.cnNumber(player.countMark("MadeInAbyss_yzs") + 1)}层`)
					if (player.countMark("MadeInAbyss_yzs") == 1) {
						await player.addSkills("BlazeLeap_yzs")
					} else if (player.countMark("MadeInAbyss_yzs") == 4) {
						await player.addSkills("YourWorth_yzs")
					}
				}
				return;
			}
			if (number <= player.countMark("MadeInAbyss_yzs_record")) {
				player.setMark("MadeInAbyss_yzs_record", Math.max(number, 1), false)
				player.addTip("MadeInAbyss_yzs_record", "来自深渊 ≤" + player.countMark("MadeInAbyss_yzs_record"), false);
				await player.draw();
				if (number == 1) {
					player.setMark("MadeInAbyss_yzs", (player.countMark("MadeInAbyss_yzs") + 1) % 7, false);
					player.popup(`深界${get.cnNumber(player.countMark("MadeInAbyss_yzs") + 1)}层`)
					if (player.countMark("MadeInAbyss_yzs") == 1) {
						await player.addSkills("BlazeLeap_yzs")
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/MadeInAbyss_yzs_layer2.mp3");
						});
					} else if (player.countMark("MadeInAbyss_yzs") == 4) {
						await player.addSkills("YourWorth_yzs")
					} else if (player.countMark("MadeInAbyss_yzs") == 5) {
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/MadeInAbyss_yzs_LastDive.mp3");
						});
					}
				}
				return;
			}
			player.popup("诅咒")
			player.setMark("MadeInAbyss_yzs_record", number, false)
			player.addTip("MadeInAbyss_yzs_record", "来自深渊 ≤" + player.countMark("MadeInAbyss_yzs_record"), false);
			const layer = player.countMark("MadeInAbyss_yzs");
			player.setMark("MadeInAbyss_yzs", (player.countMark("MadeInAbyss_yzs") + 1) % 7, false);
			player.popup(`深界${get.cnNumber(player.countMark("MadeInAbyss_yzs") + 1)}层`)
			if (player.countMark("MadeInAbyss_yzs") == 1) {
				await player.addSkills("BlazeLeap_yzs")
			} else if (player.countMark("MadeInAbyss_yzs") == 4) {
				await player.addSkills("YourWorth_yzs")
			} 
			switch (layer) {
				case 0:
					if (!player.hasCard((card) => player.canRecast(card), "he")) break;
					let result = await player.chooseCard("重铸1张牌", 1, (card, player2) => player2.canRecast(card), "he", true)
						.set("ai", (card) => 6 - get.value(card))
						.forResult();
					if (!result.bool) break;
					if (result.cards.length) await player.recast(result.cards)
					break;
				case 1:
					player.$damage()
					if (player.countDiscardableCards(player, "he")) await player.chooseToDiscard("he", true)
					break;
				case 2:
					player.$damage()
					game.broadcastAll((player) => {
						if (game.me != player) return;
						// 创建效果元素
						const effect = document.createElement('div');
						document.documentElement.style.transform = "scale(1.2)";
						document.documentElement.style.transition = "none"; // 禁用过渡

						// 强制浏览器重绘，确保瞬间放大生效
						document.documentElement.offsetHeight; // 触发重绘

						// 延迟0.5秒后缩小回原始比例
						setTimeout(() => {
							document.documentElement.style.transform = "scale(1)";
							document.documentElement.style.transition = "transform 1.5s ease-out";
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

					}, player);
					await player.discard(player.getCards("h"));
					break;
				case 3:
					player.$damage()
					game.broadcastAll((player) => {
						if (game.me != player) return;

						// 1. 创建动画样式表（如果不存在则添加）
						if (!document.getElementById('blood-effect-style')) {
							const style = document.createElement('style');
							style.id = 'blood-effect-style';
							style.innerHTML = `
								@keyframes bloodFadeOut {
									0% { opacity: 1; transform: scale(1.05); }
									10% { opacity: 0.8; transform: scale(1); }
									100% { opacity: 0; transform: scale(1); }
								}
							`;
							document.head.appendChild(style);
						}

						// 2. 创建滤镜元素
						const effect = document.createElement('div');

						// 屏幕瞬间轻微放大（增加受击震荡感）
						document.documentElement.style.transition = "none";
						document.documentElement.style.transform = "scale(1.2)";
						document.documentElement.offsetHeight; // 强制重绘

						setTimeout(() => {
							document.documentElement.style.transition = "transform 1s ease-out";
							document.documentElement.style.transform = "scale(1)";
						}, 50);

						// 3. 设置血红滤镜样式
						Object.assign(effect.style, {
							position: 'fixed',
							top: '0',
							left: '0',
							width: '100vw',
							height: '100vh',
							zIndex: '9999', // 确保在最顶层
							pointerEvents: 'none',
							// 使用径向渐变，模拟四周血迹浓郁、中间稍淡的效果
							background: 'radial-gradient(circle, rgba(255, 0, 0, 0.2) 0%, rgba(150, 0, 0, 0.6) 100%)',
							backdropFilter: 'sepia(50%) saturate(200%) brightness(80%)',
							WebkitBackdropFilter: 'sepia(50%) saturate(200%) brightness(80%)',
							opacity: '1',
							animation: 'bloodFadeOut 2s ease-out forwards'
						});

						// 4. 执行挂载与销毁
						document.body.appendChild(effect);

						setTimeout(() => {
							if (effect.parentNode) {
								effect.parentNode.removeChild(effect);
							}
						}, 2000);

					}, player);
					await player.loseHp(2);
					break;
				case 4:
					player.$damage()
					game.broadcastAll((player) => {
						if (game.me != player) return;

						const root = document.documentElement;

						// 1. 创建黑色遮罩
						const mask = document.createElement('div');
						Object.assign(mask.style, {
							position: 'fixed',
							top: '0',
							left: '0',
							width: '100vw',
							height: '100vh',
							zIndex: '10000',
							backgroundColor: 'black',
							pointerEvents: 'none',
							opacity: '1'
						});
						document.body.appendChild(mask);

						// 2. 初始瞬间状态：放大 + 黑白
						// 关键点：合并设置 transition 为 none，确保瞬间生效
						root.style.transition = "none";
						root.style.transform = "scale(1.3)";
						root.style.filter = "grayscale(100%)";

						// 强制触发重绘
						root.offsetHeight;

						// 3. 核心修复：将缩放回归和滤镜回归放在同一个时间点启动
						setTimeout(() => {
							// 关键修复：必须在同一个 transition 属性里定义多个对象的过渡
							// 否则后写的 style.transition 会覆盖先写的
							root.style.transition = "transform 3s ease-out, filter 4s ease-in-out";

							root.style.transform = "scale(1)";
							root.style.filter = "grayscale(0%)";

							// 遮罩淡出
							mask.style.transition = "opacity 0.5s ease-out";
							mask.style.opacity = "0";
						}, 500);

						// 4. 彻底清理
						setTimeout(() => {
							if (mask.parentNode) mask.parentNode.removeChild(mask);
							// 清理样式，还原初始状态
							root.style.transition = "";
							root.style.transform = "";
							root.style.filter = "";
						}, 5000);

					}, player);
					if (player.isTurnedOver()) break;
					await player.turnOver()
					break;
				case 5:
					player.$damage()
					game.broadcastAll((player) => {
						if (game.me != player) return;

						// 1. 注入更复杂的变异动画样式
						if (!document.getElementById('curse-6-style')) {
							const style = document.createElement('style');
							style.id = 'curse-6-style';
							style.innerHTML = `
						@keyframes fleshMutation {
							0% { filter: hue-rotate(0deg) blur(0px); transform: scale(1); }
							20% { filter: hue-rotate(90deg) blur(5px); transform: scale(1.1) rotate(2deg); }
							40% { filter: hue-rotate(-45deg) blur(2px); transform: scale(0.95) rotate(-2deg); }
							60% { filter: hue-rotate(180deg) blur(8px); transform: scale(1.2) translate(5px, 5px); }
							100% { filter: hue-rotate(0deg) blur(0px); transform: scale(1); }
						}
						@keyframes screenShake {
							0%, 100% { transform: translate(0, 0); }
							10% { transform: translate(-10px, -10px); }
							30% { transform: translate(10px, 5px); }
							50% { transform: translate(-5px, 15px); }
							70% { transform: translate(15px, -5px); }
						}
					`;
							document.head.appendChild(style);
						}

						// 2. 创建主诅咒容器（模拟视觉崩溃）
						const curseOverlay = document.createElement('div');

						// 3. 增强版视觉样式
						Object.assign(curseOverlay.style, {
							position: 'fixed',
							top: '-10%',
							left: '-10%',
							width: '120vw',
							height: '120vh',
							zIndex: '10000',
							pointerEvents: 'none',
							// 混合渐变：中心是浑浊的紫色/绿色（变异感），边缘是深紫色和黑色（深渊感）
							background: 'radial-gradient(circle, rgba(120, 0, 255, 0.3) 0%, rgba(50, 20, 0, 0.8) 70%, rgba(0, 0, 0, 1) 100%)',
							// 关键：混合模式叠加，产生“脏”色感
							mixBlendMode: 'multiply',
							backdropFilter: 'contrast(150%) brightness(50%) saturate(300%) blur(4px)',
							WebkitBackdropFilter: 'contrast(150%) brightness(50%) saturate(300%) blur(4px)',
							animation: 'fleshMutation 2.5s ease-in-out infinite' // 循环动画，模拟持续的变异
						});

						// 4. 屏幕剧烈抖动逻辑
						const originalTransition = document.documentElement.style.transition;
						document.documentElement.style.animation = "screenShake 0.2s infinite";

						// 5. 挂载
						document.body.appendChild(curseOverlay);

						// 6. 阶段性清理（诅咒是漫长的，这里设定为3秒后效果消退或导致角色死亡）
						setTimeout(() => {
							// 停止抖动
							document.documentElement.style.animation = "";
							document.documentElement.style.transition = "filter 1.7s ease-out";

							// 渐渐淡出变异效果
							curseOverlay.style.transition = "opacity 2s ease-in";
							curseOverlay.style.opacity = "0";

							setTimeout(() => {
								if (curseOverlay.parentNode) {
									curseOverlay.parentNode.removeChild(curseOverlay);
								}
							}, 2000);
						}, 3000);

					}, player);
					await player.removeSkills(["BlazeLeap_yzs", "YourWorth_yzs"])
					if (player.hp > 0) await player.loseHp(player.hp)
					break;
				case 6:
					game.broadcastAll((player) => {
						if (game.me != player) return;
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
							transition: background 1s ease-in-out;
						`;

						// 添加到页面
						document.body.appendChild(whiteOverlay);

						// 开始变白
						setTimeout(() => {
							whiteOverlay.style.background = 'rgba(255, 255, 255, 1)';

							// 一段时间后恢复
							setTimeout(() => {
								whiteOverlay.style.transition = 'background 3s ease-in-out'
								whiteOverlay.style.background = 'rgba(255, 255, 255, 0)';

								// 完全透明后移除元素
								setTimeout(() => {
									if (whiteOverlay.parentNode) {
										whiteOverlay.parentNode.removeChild(whiteOverlay);
									}
								}, 3200);
							}, 2000); // 保持白色3秒
						}, 100);
					}, player)
					await new Promise(r => setTimeout(r, 1000))
					await player.die();
					break;
			}
		},
		mod: {
			aiOrder(player, card, num) {
				if (!player.countMark("MadeInAbyss_yzs_record") || get.number(card) >= player.countMark("MadeInAbyss_yzs_record")) return num + 10;
				return player.countMark("MadeInAbyss_yzs")>2?0: num / 10;
			},
		},
	},
	BlazeLeap_yzs: {
		nobracket: true,
		enable: ["chooseToUse"],
		filterCard(card, player) {
			return true;
		},
		position: "hes",
		viewAs: {
			name: "kuangchangbaozha_yzs",
		},
		viewAsFilter(player) {
			if (!player.countCards("hes")) {
				return false;
			}
		},
		prompt: `将1张牌当做${get.poptip("kuangchangbaozha_yzs")}使用，然后若转化底牌不为武器牌，本技能本回合失效`,
		check(card) {
			const val = get.value(card);
			return 5 - val;
		},
		audio: "ext:一中杀/audio/skill:1",
		async precontent(event, trigger, player) {
			if (event.result.cards.some(card => get.subtype(card) == "equip1")) return;
			player.tempBanSkill("BlazeLeap_yzs");
		},
		ai: {
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
				player(player, target, card) {
					let num = player.countCards("h", c => card != c && (get.type(c) == "trick" || get.type(c) == "delay"))
					if (num == 1) return -1;
					if (num > 1) {
						return 1.5 * Math.min(3, num) + 2 - num;
					}
					return 2;
				},
			},
			tag: {
				recover: 1,
				fireDamage: 1,
			},
		},
	},
	YourWorth_yzs: {
		group: ["YourWorth_yzs_renew"],
		subSkill: {
			phase: {
				priority: -14,
				charlotte: true,
				forced: true,
				name: "生命回响",
				trigger: {
					global: "phaseAfter"
				},
				async content(event, trigger, player) {
					player.removeSkill(event.name)
					if (player.isTurnedOver()) await player.turnOver();
					player.insertPhase().skill = event.name;
				}
			},
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					if (event.skill) return false;
					return true;
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.clearMark("YourWorth_yzs_used")
				},
				"skill_id": "YourWorth_yzs_renew",
				sub: true,
				sourceSkill: "YourWorth_yzs",
				"_priority": 0,
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		enable: "phaseUse",
		filter(event, player) {
			return !player.countMark("YourWorth_yzs_used")
		},
		prompt: "你可令任意角色于本回合结束后翻至正面并执行额外回合，然后若其不为你，你失去1点体力",
		filterTarget: function (card, player, target) {
			if (target == player) return true;
			return !target.hasSkill("hidden_yzs")
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.addMark("YourWorth_yzs_used", 1, false)
			event.targets[0].addSkill("YourWorth_yzs_phase")
			if (event.targets[0] != player) await player.loseHp();
			if (get.translation(event.targets[0]) == "雷古" || get.translation(event.targets[0]) == "雷格") {
				game.broadcastAll((current) => {
					_status.tempMusic = `ext:一中杀/audio/かたち.mp3`;
					game.playBackgroundMusic();
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Riko2_yzs.png");
					ui.backgroundMusic.addEventListener('ended', () => {
						delete _status.tempMusic;
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Riko_yzs.png");
						game.playBackgroundMusic();
					}, { once: true });
				}, player);
			}
		},
		ai: {
			order: 2,
			result: {
				target(player, target) {
					return 4 + target.isTurnedOver() ? 4 : 0;
				},
				player: -2
			},
			expose: 0.9,
			threaten:1.8
		}
	},
	//雷古
	huozangpao_yzs: {
		group: ["huozangpao_yzs_use", "huozangpao_yzs_start"],
		subSkill: {
			start: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				direct: true,
				popup: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				async content(event, trigger, player) {
					await player.turnOver();
					await player.link()
					await player.draw(2);
					let Rikos = game.filterPlayer(cur => get.translation(cur) == "莉可");
					if (!Rikos.length) return;
					game.broadcastAll(function (current) {
						_status.tempMusic = `ext:一中杀/audio/Deep in Abyss.mp3`;
						game.playBackgroundMusic();

						var background = document.createElement("img");
						background.className = "background";
						window._currentDynamicBackground = background;
						Object.assign(background, {
							src: lib.assetURL + "/extension/一中杀/image/background/huozangpao_yzs_start.jpg",
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
					for (let Riko of Rikos) {
						game.broadcastAll((current) => {
							game.playAudio("ext:一中杀/audio/skill/huozangpao_yzs_Riko.MP3");
						}, player);
						await Riko.link();
					}
				},
			},
			use: {
				forced: true,
				popup: false,
				trigger: {
					player: "useCardAfter",
				},
				priority: -5,
				filter(event, player) {
					if (event.card.name != 'huogong' || !event.card.storage.huozangpao_yzs) return false;
					return true;
				},
				async content(event, trigger, player) {
					if (!player.isTurnedOver()) await player.turnOver();
					if (player.hasHistory('sourceDamage', evt => evt.getParent(2) == trigger)) return;
					await player.draw(2);
				},
			}
		},
		nobracket: true,
		audio: "ext:一中杀/audio/skill:1",
		prompt: `你视为使用伤害为2的${get.poptip("huogong")}，结算后你翻至背面，若未造成伤害则你摸2张牌`,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canUse({ name: "huogong", isCard: true, storage: { huozangpao_yzs: true } }, target)
			}))
		},
		filterTarget: function (card, player, target) {
			return player.canUse({ name: "huogong", isCard: true, storage: { huozangpao_yzs: true } }, target)
		},
		multitarget: true,
		selectTarget: 1,
		async content(event, trigger, player) {
			let next = player.useCard({ name: "huogong", isCard: true, storage: { huozangpao_yzs: true } }, event.targets);
			next.baseDamage = 2;
			await next;
		},
		ai: {
			order: 10,
			result: {
				player: -2,
				target(player, target) {
					let cards = player.getCards("h");
					let suits = [];
					cards.map(card => { if (!suits.includes(get.suit(card))) suits.push(get.suit(card)) });
					return suits.length/2*get.damageEffect(target,player,target,"fire")
				}
			}
		}
	},
	lianhuan_yzs: {
		group: ["lianhuan_yzs_damage", "lianhuan_yzs_cancel"],
		subSkill: {
			damage: {
				locked: true,
				forced: true,
				trigger: {
					source: "damageBegin1",
				},
				logTarget: "player",
				filter(event, player) {
					return player != event.player && event.hasNature("linked") && event.player.isLinked()
				},
				async content(event, trigger, player) {
					await trigger.player.link(false)
					trigger.num++;
				}
			},
			cancel: {
				locked: true,
				trigger: {
					global: "damageBegin4",
				},
				logTarget: "player",
				prompt2(event, player) {
					return `你可重置并无效 ` + get.translation(event.player) + ` 受到的` + event.num + `点伤害`;
				},
				filter(event, player) {
					return event.player.isLinked() && player.isLinked()
				},
				check(event, player) {
					return get.attitude(player, event.player) > 1;
				},
				async content(event, trigger, player) {
					await player.link(false)
					trigger.cancel();
				}
			}
		},
		locked: true,
		priority: -1,
		audio: "ext:一中杀/audio/skill:3",
		trigger: {
			player: ["useCard", "respond"],
		},
		async cost(event, trigger, player) {
			const num = game.countPlayer(cur => cur.isLinked())
			let prompt = ``;
			if (num == 0) prompt += `令其横置并摸1张牌`;
			else if (num == 1) prompt += `令其横置`;
			else if (num == 2) prompt += `令其横置并摸1张牌，或重置并弃1张牌`;
			else if (num == 3) prompt += `令其重置`;
			else prompt += `令其重置并弃1张牌`;
			let filter = function (target) {
				return !target.hasSkill("hidden_yzs")
			}
			if (num < 2) {
				filter = function (target) {
					return !target.hasSkill("hidden_yzs") && !target.isLinked()
				}
			} else if (num > 2) {
				filter = function (target) {
					return !target.hasSkill("hidden_yzs") && target.isLinked()
				}
			}
			if (!game.hasPlayer(filter)) {
				event.result = { bool: false };
				return;
			}
			let filterTarget = function (card, player, target) {
				return !target.hasSkill("hidden_yzs")
			}
			if (num < 2) {
				filterTarget = function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && !target.isLinked()
				}
			} else if (num > 2) {
				filterTarget = function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && target.isLinked()
				}
			}
			event.result = await player
				.chooseTarget("你可选择1名目标", prompt, false, filterTarget)
				.set("ai", function (target) {
					const num = get.event().num;
					const player = get.event().player;
					if (num == 0) {
						if (!target.isLinked()) return get.attitude(player, target)
						return -get.attitude(player, target)
					} else if (num == 2) {
						if (!target.isLinked()) return get.attitude(player, target)
						return get.effect(target, {name:"guohe"},player,player)
					} else if (num > 3) {
						if (!target.isLinked()) return get.attitude(player, target)
						return get.effect(target, { name: "guohe" }, player, player)
					}
					return 0;
				})
				.set("num",num)
				.set("onChooseTarget", function () {
					const event = get.event();
					let num = event.num;
					if (num == 0) {
						event.targetprompt2.add(target => {
							if (!target.classList.contains("selectable")) {
								return;
							}
							if (!target.isLinked()) return "摸牌";
						});
					} else if (num == 2) {
						event.targetprompt2.add(target => {
							if (!target.classList.contains("selectable")) {
								return;
							}
							if (!target.isLinked()) return "摸牌";
							if (target.isLinked()) return "弃牌";
						});
					} else if (num > 3) {
						event.targetprompt2.add(target => {
							if (!target.classList.contains("selectable")) {
								return;
							}
							if (target.isLinked()) return "弃牌";
						});
					}
				})
				.set("animate", false)
				.forResult();
		},
		async content(event, trigger, player) {
			for (let target of event.targets) {
				let link = !target.isLinked()
				await target.link(link);
				if (game.countPlayer(cur => cur.isLinked()) == 2) continue;
				if (link) await target.draw()
				else if (target.countDiscardableCards(player, "he")) {
					await target.chooseToDiscard("he", true)
				}
			}
		}
	},
	//二岩猯藏
	danmubianhua_yzs: {
		group: ["danmubianhua_yzs_discard", "danmubianhua_yzs_revive", "danmubianhua_yzs_cancel"],
		subSkill: {
			discard: {
				locked: true,
				name: `一回胜负[灵长类弹幕变化]`,
				priority: -2,
				trigger: {
					player: "phaseDiscardBegin",
				},
				filter(event, player) {
					return player.countCards("h")
				},
				async cost(event, trigger, player) {
					const list = get.addNewRowList(player.getCards("h"), "suit", player);
					const result = await player
						.chooseButton([
							[
								[[`${get.translation(event.skill)}：你可展示并弃置手牌中任意一种花色的牌，然后跳过弃牌阶段`], "addNewRow"],
								[
									dialog => {
										dialog.classList.add("fullheight");
										dialog.forcebutton = false;
										dialog._scrollset = false;
									},
									"handle",
								],
								list.map(item => [Array.isArray(item) ? item : [item], "addNewRow"]),
							],
						])
						.set("filterButton", button => {
							const player = get.player();
							if (!button.links.length || button.links.some(card => !lib.filter.cardDiscardable(card, player, get.event().getParent().name))) {
								return false;
							}
							return true;
						})
						.set("ai", button => {
							const player = get.player();
							const hs = player.countCards("h");
							return player.needsToDiscard()-button.links.length
						})
						.forResult();
					if (result?.bool && result?.links?.length) {
						event.result = {
							bool: result?.bool,
							cost_data: result?.links,
							cards: player.getCards("h").filter(card => result?.links?.includes(get.suit(card, player))),
						};
					}
				},
				async content(event, trigger, player) {
					await player.showHandcards()
					await player.modedDiscard(event.cards);
					trigger.cancel();
				}
			},
			revive: {
				name: `三回胜负[羽鸟类弹幕变化]`,
				locked: true,
				forceDie: true,
				forced: true,
				priority: -10,
				"eternalSkill_yzs": true,
				charlotte: true,
				unique: true,
				sub: true,
				sourceSkill: "danmubianhua_yzs",
				trigger: {
					global: "phaseAfter",
				},
				filter(event, player) {
					if (!game.dead.includes(player)) return false;
					return event.player == player.getPrevious();
				},
				async content(event, trigger, player) {
					let result = await player.yzs_throw(6).forResult();
					if (!result.bool) return;
					let hp = lib.character[player.name].hp
					if (!hp) hp = player.maxHp
					await player.reviveEvent(hp);
					let maxHp = lib.character[player.name].maxHp
					if (maxHp) {
						player.maxHp = maxHp;
						player.update()
					}
					player.directgain(get.cards(4));
					player.chat("孩子们，我回来了")
				}
			},
			cancel: {
				name: `二回胜负[肉食类弹幕变化]`,
				priority: -24,
				locked: true,
				prompt: `你可终止${get.poptip("SmokeStorm")}并摸4张牌`,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return _status._yzsStorm == "SmokeStorm"
				},
				async content(event, trigger, player) {
					await player.yzs_cancelStorm();
					await player.draw(4);
				}
			}
		},
		locked: true,
		priority: 10,
		nobracket: true,
		init: function (player, skill) {
			player.storage.extraStorm = "SmokeStorm";
			player.markSkill("extraStorm");
		},
		forced: true,
		trigger: {
			global: "yzs_throwEnd"
		},
		filter(event, player) {
			return event.number == 6 && event.player != player && player.countMark("Fuka_yzs") < get.character(player.name).Fuka;
		},
		async content(event, trigger, player) {
			player.addMark("Fuka_yzs");
		}
	},
	SmokeStorm_skill: {
		subSkill: {
			instant: {
				name: "烟风暴",
				popup: false,
				locked: true,
				log: false,
				stormskill: true,
				async content(event, trigger, player) {
					const result = await player
						.chooseTarget("令任意角色下次投掷结果为6", 1, (card, player, target) => {
							return !target.hasSkill("hidden_yzs")
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
						target.addSkill("SmokeStorm_skill_instant_buff");
					}
				}
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		forced: true,
		trigger: {
			player: "phaseBegin",
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			let result = await player.yzs_throw(4).forResult();
			if (result.bool) await player.recover();
		},
		priority: -25,
	},
	SmokeStorm_skill_instant_buff: {
		name: "烟风暴",
		forced: true,
		nopop: true,
		mark: true,
		onremove: true,
		markimage: 'extension/一中杀/image/SmokeStorm_skill_instant_buff.png',
		intro: {
			content: "你下次投掷结果为6",
		},
		trigger: {
			player: ["yzs_throw"],
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			player.removeSkill("SmokeStorm_skill_instant_buff")
			trigger.number = 6;
		},
		sub: true,
		sourceSkill: "SmokeStorm_skill",
		priority: -1,
	},
	niaoshouxihua_yzs: {
		group: ["niaoshouxihua_yzs_zhashu"],
		subSkill: {
			zhashu: {
				name: "诈术",
				charlotte: true,
				marktext: "诈",
				intro: {
					name: "诈术",
					"name2": "诈术",
					content: "共有$枚【诈术】",
				},
				priority: 1,
				forceDie: true,
				forceOut: true,
				trigger: {
					global: ["yzs_throw"],
				},
				filter(event, player) {
					return player.countMark("niaoshouxihua_yzs_zhashu");
				},
				async cost(event, trigger, player) {
					let num = player.countMark("niaoshouxihua_yzs_zhashu");
					const method = [
						["add", "+"],
						["sub", "-"],
					];
					let numbers = [];
					for (let i = 1; i <= num; i++) {
						numbers.push(i)
					}
					let next = player.chooseButton(2, [`本次投掷结果为${event.number}`, "令投掷结果加或减", [method, "tdnodes"], `选择移除【诈术】的数量`, [numbers, "tdnodes"]]);
					next.set("filterButton", (button, player) => {
						if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
						const btn = ui.selected.buttons[0];
						if (typeof btn.link === "number") {
							return typeof btn.link !== "number"
						} else {
							return typeof btn.link === "number"
						}
						return false;
					});
					await next;
					if (!next.bool) {
						event.result = { bool: false }
					} else {
						event.result = { bool: true, cost_data: next.links }
					}
				},
				async content(event, trigger, player) {
					let op = event.cost_data.filter(i => typeof i == "string")[0];
					let num = event.cost_data.filter(i => typeof i == "number")[0];
					if (num <= 0) return;
					player.removeMark("niaoshouxihua_yzs_zhashu", num);
					if (op == "add") trigger.number += num;
					else trigger.number -= num;
				},
			},
			effect: {
				name: `五回胜负[鸟兽细画]`,
				direct: true,
				charlotte: true,
				trigger: {
					global: ["phaseChange"],
				},
				sourceSkill: "niaoshouxihua_yzs",
				filter(event, player) {
					return player.getExpansions("xinpojun2").length > 0;
				},
				async content(event, trigger, player) {
					var cards = player.getExpansions("niaoshouxihua_yzs_effect");
					await player.gain(cards, "draw");
					game.log(player, "收回了" + get.cnNumber(cards.length) + "张牌");
					player.removeSkill("niaoshouxihua_yzs_effect");
				},
				intro: {
					markcount: "expansion",
					mark(dialog, storage, player) {
						var cards = player.getExpansions("niaoshouxihua_yzs_effect");
						if (player.isUnderControl(true)) {
							dialog.addAuto(cards);
						} else {
							return "共有" + get.cnNumber(cards.length) + "张牌";
						}
					},
				},
			},
		},
		locked: true,
		nobracket: true,
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("niaoshouxihua_yzs");
		},
		clickableFilter: function (player) {
			if (!player.countMark("Fuka_yzs")) return false;
			if (player.countCards("h")) return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && player != target)
			else {
				return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && target.countCards("h") && player != target)
			}
		},
		clickableContent: async function (event, trigger, player) {
			let prompt = `观看1名其他角色的手牌，然后展示并扣置你与其共计至多3张同花色牌至本阶段结束，然后你获得等量枚${get.poptip("niaoshouxihua_yzs_zhashu")}标记，上限为5`
			let target = await player.chooseTarget("鸟兽戏画", prompt, false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs")) && player != target;
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("niaoshouxihua_yzs")
			next.targets = target.targets;
			await next;
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (player.countCards("h")) return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && player != target)
			else {
				return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && target.countCards("h") && player != target)
			}
		},
		filterTarget: function (card, player, target) {
			if (player.countCards("h")) return !target.hasSkill("hidden_yzs") && player != target
			else {
				return !target.hasSkill("hidden_yzs") && target.countCards("h") && player != target
			}
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			const target = event.target
			let next;
			let dialog = [];
			function filterButton(button) {
				const player = get.player();

				if (get.owner(button.link) && !lib.filter.canBeDiscarded(button.link, get.owner(button.link), player)) {
					return false;
				}
				if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
				return ui.selected.buttons.every(other => get.suit(button.link) === get.suit(other.link));
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

			if (player.getCards("h").length > 0) {
				dialog.push("你的手牌");
				dialog.push(player.getCards("h"))
			}
			if (target.getCards("h").length > 0) {
				dialog.push(`${get.translation(target.name)}的手牌`);
				dialog.push(target.getCards("h"))
			}
			if (!dialog.length) {
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") {
					evt.goto(0);
					delete evt.openskilldialog;
				}
				return;
			}
			next = player.chooseButton([1, 3], dialog);
			next.set("target", target);
			next.set("filterButton", filterButton);
			next.set("ai", processAI);

			const result = await next.forResult();
			if (!result.bool) {
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") {
					evt.goto(0);
					delete evt.openskilldialog;
				}
				return;
			}
			await player.logSkill("niaoshouxihua_yzs_effect")
			let playerDiscarding = [];
			let targetDiscarding = [];
			for (const card of result.links) {
				if (get.owner(card) === player) {
					playerDiscarding.push(card);
				} else {
					targetDiscarding.push(card);
				}
			}

			let playerDiscard = player.addToExpansion(playerDiscarding, player, "giveAuto")
			playerDiscard.gaintag.add("niaoshouxihua_yzs_effect")
			await playerDiscard
			player.addSkill("niaoshouxihua_yzs_effect");

			let targetDiscard = target.addToExpansion(targetDiscarding, target, "giveAuto")
			targetDiscard.gaintag.add("niaoshouxihua_yzs_effect")
			await targetDiscard
			target.addSkill("niaoshouxihua_yzs_effect");

			let num = Math.max(result.links.length, 0);
			num = Math.min(num, 5 - player.countMark("niaoshouxihua_yzs_zhashu"))
			if (num > 0) player.addMark("niaoshouxihua_yzs_zhashu", num)
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 6,
			result: {
				target(target, player2) {
					return -1;
				},
			},
		},
	},
	manyuefuwu_yzs: {
		group: ["manyuefuwu_yzs_totem", "manyuefuwu_yzs_phaseUse"],
		subSkill: {
			totem: {
				name: `野生绒毯`,
				locked: true,
				enable: "phaseUse",
				usable: 1,
				async content(event, trigger, player) {
					let result = await player.yzs_throw(6).forResult();
					if (result.bool) {
						player.addMark("Totem_yzs");
					}
				}
			},
			phaseUse: {
				name: `貉符「满月下的腹鼓舞」`,
				prompt: `出牌阶段限1次：${get.poptip("throw_yzs")}6：令1名其他角色执行出牌阶段`,
				locked: true,
				enable: "phaseUse",
				usable: 1,
				selectTarget: 1,
				filterTarget(card, player, target) {
					if (target.hasSkill("hidden_yzs")) return false;
					return player != target
				},
				async content(event, trigger, player) {
					let result = await player.yzs_throw(6).forResult();
					if (result.bool) {
						var next = event.target.phaseUse();
						next.skill = "manyuefuwu_yzs_phaseUse"
						await next;
					}
				},
				ai: {
					order: 10,
					result: {
						target(player, target) {
							return target.countCards("h")
						},
					}
				}
			},
			effect: {
				mark: true,
				marktext: "舞",
				intro: {
					name: "满月腹舞",
					"name2": "满月腹舞",
					content: "你下次投掷要求-2",
				},
				forced: true,
				charlotte: true,
				trigger: {
					player: "yzs_throwBegin"
				},
				filter(event, player) {
					return event.request && typeof event.result == "number";
				},
				async content(event, trigger, player) {
					player.removeSkill("manyuefuwu_yzs_effect")
					trigger.request -= 2;
				}
			},
		},
		locked: true,
		nobracket: true,
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("niaoshouxihua_yzs");
		},
		clickableFilter: function (player) {
			if (!player.countMark("Fuka_yzs")) return false;
			if (player.countCards("h")) return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect"))
			else {
				return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect") && target.countCards("h"))
			}
		},
		clickableContent: async function (event, trigger, player) {
			let prompt = `令目标角色下次投掷要求-2`
			let target = await player.chooseTarget("满月腹舞", prompt, false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect") && player != target;
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("manyuefuwu_yzs")
			next.targets = target.targets;
			await next;
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (player.countCards("h")) return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect"))
			else {
				return game.hasPlayer(target => !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect") && target.countCards("h"))
			}
		},
		filterTarget: function (card, player, target) {
			if (player.countCards("h")) return !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect")
			else {
				return !target.hasSkill("hidden_yzs") && !target.hasSkill("manyuefuwu_yzs_effect") && target.countCards("h")
			}
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			event.target.addSkill("manyuefuwu_yzs_effect")
			const evt = event.getParent(2);
			evt.goto(0);
			delete evt.openskilldialog;
		}
	},
	//傲慢魔神
	jisu_yzs: {
		subSkill: {
			temp: {
				charlotte: true,
				forced: true,
				popup: false,
				priority: 16,
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					player: "phaseEnd",
				},
				filter(event, player) {
					return player.storage.jisu_yzs_list.length
				},
				async content(event, trigger, player) {
					for (let obj of player.storage.jisu_yzs_list) {
						if (obj[1] <= 0) continue;
						obj[1]--;
						if (obj[1] > 0) continue;
						game.trySkillAudio("jisu_yzs_temp");
						player.removeAdditionalSkills("jisu_yzs" + obj[0])
					}
					player.storage.jisu_yzs_list = player.storage.jisu_yzs_list.filter(obj => obj[1] > 0)
					player.markSkill("jisu_yzs_list")
				},
				"skill_id": "jisu_yzs_temp",
				sub: true,
				sourceSkill: "jisu_yzs",
			},
		},
		locked: true,
		audio: "ext:一中杀/audio/skill:2",
		frequent: true,
		trigger: {
			global: "phaseUseBegin"
		},
		filter(event, player) {
			return !event.player.hasSkill("aoman_yzs") && event.player != player
		},
		logTarget: "player",
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "锁定技", "转换技", "蓄力技", "蓄能技", "连招技"],
		async content(event, trigger, player) {
			const target = trigger.player
			let next;
			let dialog = [];
			function filterButton(button, player) {
				if (!get.event().giveable) return false;
				if (!get.owner(button.link) || get.owner(button.link) != player) {
					return false;
				}
				if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
				return ui.selected.buttons.every(other => get.suit(button.link) !== get.suit(other.link));
			}

			let suits = [];
			for (let card of target.getCards()) {
				if (!suits.includes(get.suit(card))) suits.push(get.suit(card));
			}
			let giveable = suits.length < 4

			if (player.getCards("h").length > 0) {
				dialog.push("你的手牌");
				dialog.push(player.getCards("h"))
			}
			if (target.getCards("h").length > 0) {
				dialog.push(`${get.translation(target.name)}的手牌${giveable ? `` : `(已满四种花色)`}`);
				dialog.push(target.getCards("h"))
			}
			if (!dialog.length) return;


			next = player.chooseButton([1, Infinity], dialog);
			next.set("target", target);
			next.set("giveable", giveable);
			next.set("filterButton", filterButton);
			next.set("target", target);
			next.set("ai", button => {
				const player = get.player();
				const target = get.event().target;
				let cards = player.getCards("h").concat(target.getCards("h"))
				let suits = [];
				for (let card of cards) {
					if (!suits.includes(get.suit(card))) suits.push(get.suit(card));
				}
				if (suits.length >= 4) return 8 - get.value(button);
				if (get.attitude(player, target) > 1.5) return get.value(button) - 5;
				return 0;
			})

			const result = await next.forResult();
			if (!result.bool) {
				return;
			}
			await player.give(result.links, target, false);
			suits = [];
			for (let card of target.getCards()) {
				if (!suits.includes(get.suit(card))) suits.push(get.suit(card));
			}
			if (suits.length < 4) return;

			game.trySkillAudio("jisu_yzs_temp");
			let skills = lib.character[target.name][3].filter(skill => {
				const categories = get.skillCategoriesOf(skill, player);
				return !categories.some(type => lib.skill.jisu_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
			});
			let id = Math.random().toString(36).slice(-8);
			await player.addSkill("jisu_yzs_temp")
			if (!player.storage.jisu_yzs_list) player.storage.jisu_yzs_list = [];
			player.storage.jisu_yzs_list.push([id, _status.currentPhase == player ? 2 : 1])
			player.markSkill("jisu_yzs_list")
			if (skills.length) {
				await player.addAdditionalSkills("jisu_yzs" + id, skills, true);
			}
			await target.addSkill("jisu_yzs_temp")
			if (!target.storage.jisu_yzs_list) target.storage.jisu_yzs_list = [];
			target.storage.jisu_yzs_list.push([id, _status.currentPhase == target ? 2 : 1])
			target.markSkill("jisu_yzs_list")
			await target.addAdditionalSkills("jisu_yzs" + id, "aoman_yzs", true);

			await player.swapHandcards(target);

			var phaseUse = player.phaseUse();
			phaseUse.skill = "jisu_yzs"
			await phaseUse;
		}
	},
	//SCP-096
	kuangbao_yzs: {
		group: ["kuangbao_yzs_phaseBegin", "kuangbao_yzs_phaseAfter"],
		subSkill: {
			phaseAfter: {
				forced: true,
				popup: false,
				priority: -96,
				trigger: {
					player: "phaseAfter"
				},
				filter(event, player) {
					return event.skill == "kuangbao_yzs_phase"
				},
				async content(event, trigger, player) {
					player.removeSkill(["kuangbao_yzs_wusheng", "kuangbao_yzs_paoxiao"])
				}
			},
			phaseBegin: {
				audio: "ext:一中杀/audio/skill:1",
				forced: true,
				priority: 96,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return event.skill == "kuangbao_yzs_phase"
				},
				async content(event, trigger, player) {
					await player.draw(2)
					player.addSkill(["kuangbao_yzs_wusheng", "kuangbao_yzs_paoxiao"])
				}
			},
			phase: {
				onremove(player, skill) {
					player.storage[skill] = [];
					player.markSkill(skill)
				},
				popup: false,
				forced: true,
				priority: -97,
				trigger: {
					global: "phaseAfter",
				},
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					if (player.storage.kuangbao_yzs_phase) player.markAuto("kuangbao_yzs_wusheng", player.storage.kuangbao_yzs_phase)
					player.removeSkill("kuangbao_yzs_phase")
					if (!player.hasSkill("kuangbao_yzs")) return;
					player.insertPhase().skill = "kuangbao_yzs_phase";
				},
			},
			wusheng: {
				audio: "ext:一中杀/audio/skill:2",
				name: "武圣",
				mod: {
					cardSavable(card, player, target) {
						if (target != player) {
							if (!player.storage.kuangbao_yzs_wusheng) return false;
							if (!player.storage.kuangbao_yzs_wusheng.includes(target)) return false;
						}
					},
					playerEnabled(card, player, target) {
						if (target != player) {
							if (!player.storage.kuangbao_yzs_wusheng) return false;
							if (!player.storage.kuangbao_yzs_wusheng.includes(target)) return false;
						}
					},
				},
				onremove(player, skill) {
					player.storage[skill] = [];
					player.markSkill(skill)
				},
				enable: ["chooseToRespond", "chooseToUse"],
				filterCard(card, player) {
					return get.color(card) == "red";
				},
				position: "hes",
				viewAs: {
					name: "sha",
				},
				viewAsFilter(player) {
					if (!player.countCards("hes", { color: "red" })) {
						return false;
					}
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
						if (get.zhu(player, "shouyue")) {
							if (!player.countCards("hes")) {
								return false;
							}
						} else {
							if (!player.countCards("hes", { color: "red" })) {
								return false;
							}
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
			},
			paoxiao: {
				audio: "ext:一中杀/audio/skill:2",
				name: "咆哮",
				priority: 96,
				trigger: {
					player: "useCard1",
				},
				forced: true,
				filter(event, player) {
					return !event.audioed && event.card.name == "sha" && player.countUsed("sha", true) > 1 && event.getParent().type == "phase";
				},
				async content(event, trigger, player) {
					trigger.audioed = true;
				},
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return Infinity;
						}
					},
				},
				ai: {
					unequip: true,
					skillTagFilter(player, tag, arg) {
						if (!get.zhu(player, "shouyue")) {
							return false;
						}
						if (arg && arg.name == "sha") {
							return true;
						}
						return false;
					},
				},
			},
		},
		locked: true,
		forced: true,
		priority: -96,
		popup: false,
		trigger: {
			player: ["damageAfter"],
		},
		filter(event, player) {
			return true
		},
		async content(event, trigger, player) {
			if (trigger.num > 0) await player.draw(trigger.num);
			player.addSkill("kuangbao_yzs_phase")
			if (trigger.source) {
				player.markAuto("kuangbao_yzs_phase", trigger.source)
			}
		},
		ai: {
			maixie:true,
		}
	},
	//SCP-173
	haiyi_yzs: {
		group: ["haiyi_yzs_show"],
		subSkill: {
			show: {
				locked: true,
				forced: true,
				priority: -173,
				trigger: {
					player: "showCharacterAfter",
				},
				hiddenSkill: true,
				filter(event, player) {
					var target = _status.currentPhase;
					return event.toShow.includes('SCP173_yzs') && target && target == player && game.hasPlayer(target => target.countCards("e") > 0);
				},
				async content(event, trigger, player) {
					let result1 = await player.chooseTarget(false, [1, Infinity])
						.set("filterTarget", (card, player, target) => {
							return !(target.hasSkill("hidden_yzs")) && target.countCards("e") > 0;
						})
						.set("ai", target => {
							const player = get.player();
							return get.effect(target, {name:"guohe"},player,player)
						})
						.set("prompt2", `依次获得这些角色的任意张装备`)
						.forResult();
					if (!result1.bool || !result1.targets) return;
					for (let target of result1.targets) {
						await player.gainPlayerCard(target, 'e', false, [1, Infinity])
					}
				},
			},
		},
		locked: true,
		forced: true,
		priority: -173,
		hiddenSkill: true,
		trigger: {
			global: "useCardAfter"
		},
		filter(event, player) {
		//	if (event.player == player) return false
			return event.targets?.length&&!event.targets.includes(player)
		},
		async content(event, trigger, player) {
			await player.draw();
			if (player.countCards("h") < player.getHandcardLimit()) return;
			if (player.countDiscardableCards(player, "he") > 0) {
				let result = await player.chooseToDiscard('he', 1,true)
					.set('ai', function (card) {
						var att = get.attitude(player, trigger.player)
						if (att > 0) return 9 - get.value(card);
						return -1;
					})
					.set('prompt', `你弃1张牌，若为装备牌则对 ${get.translation(trigger.player)} 造成1点伤害`)
					.forResult();
				if (result.bool && result.cards.some(card => get.type(card, player) == "equip")) {
					if(!trigger.player.hasSkill("hidden_yzs"))await trigger.player.damage();
				}
			}
		}
	},
	//SCP-079
	jianshi_yzs: {
		group: ["jianshi_yzs_show", "jianshi_yzs_gain"],
		subSkill: {
			gain: {
				audio: "ext:一中杀/audio/skill:2",
				locked: true,
				priority: -79,
				forced: true,
				preHidden: true,
				trigger: {
					global: "drawBegin"
				},
				filter(event, player) {
					if (event.player == player) return false;
					return !event.player.hasSkill("hidden_yzs") && event.num > 0
				},
				async content(event, trigger, player) {
					let cards = get.cards(trigger.num)
					var id = Math.random().toString(36).slice(-8);

					// 2. 广播创建图片
					game.broadcastAll((imagePath, zIndex, id, current) => {
						if (game.me != current) return;
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
						//	img.style.pointerEvents = "none";
						img.style.transition = "opacity 0.5s ease-out";
						document.body.appendChild(img);
						setTimeout(() => {
							img.style.opacity = "1";
						}, 50);
						setTimeout(() => {
							img.style.opacity = "0";
							img.remove(); // 渐隐后移除
						}, 6000);
					}, lib.assetURL + "/extension/一中杀/image/background/jianshi_yzs.png", 79, id, trigger.player);

					let result = await player.chooseToMove("监视：将牌堆顶等量张牌与你的手牌任意交换")
						.set("list", [
							[`牌堆顶`, cards],
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
					game.broadcastAll((id) => {
						var img = document.getElementById(id);
						if (img) {
							img.style.opacity = "0";
							setTimeout(() => {
								img.remove(); // 渐隐后移除
							}, 600);
						}
					}, id);
					if (result?.bool) {
						var pushs = result.moved[0],
							gains = result.moved[1];
						pushs.removeArray(cards);
						gains.removeArray(player.getCards("h"));
						if (pushs.length && pushs.length == gains.length) {
							await player.lose(pushs, ui.cardPile, "visible", "insert");
							await player.gain(gains, "draw");
						}
					}
					let result2 = await player.gainPlayerCard(trigger.player, "hej", false)
						.set("prompt2", `你可获得 ${get.translation(trigger.player)} 区域内1张牌，则本回合你不可再发动本效果`)
						.forResult();
					if (result2?.bool) {
						player.tempBanSkill("jianshi_yzs_gain");
					}
				}
			},
			show: {
				audio: "jianshi_yzs_gain",
				locked: true,
				forced: true,
				priority: -79,
				trigger: {
					player: "showCharacterAfter",
				},
				hiddenSkill: true,
				filter(event, player) {
					let cards = Array.from(ui.discardPile.childNodes);
					if (!cards.length) return false;
					var target = _status.currentPhase;
					return event.toShow.includes('SCP079_yzs') && target && target == player
				},
				async content(event, trigger, player) {
					let cards = Array.from(ui.discardPile.childNodes);
					if (!cards.length) return;
					let result = await player.chooseButton(["监视：获得其中至多2张牌", cards], false, [1, 2]).set("ai", get.buttonValue).forResult();
					await player.gain(result.links, "gain2");
				},
			},
		},
		locked: true,
		hiddenSkill: true,
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (!player.isAlive()) return false;
				if (player == arg) {
					return false;
				}
			},
		},
	},
	//SCP-049
	chuyi_yzs: {
		group: ["chuyi_yzs_show", "chuyi_yzs_sha"],
		subSkill: {
			show: {
				audio: "chuyi_yzs",
				locked: true,
				forced: true,
				priority: -49,
				trigger: {
					player: "showCharacterAfter",
				},
				hiddenSkill: true,
				filter(event, player) {
					var target = _status.currentPhase;
					return event.toShow.includes('SCP049_yzs') && target && target == player && game.hasPlayer(function (target) {
						return player.canUse({ name: "sha" }, target)
					})
				},
				async content(event, trigger, player) {
					const result = await player.chooseTarget()
						.set("prompt", `请选择【杀】的目标`)
						.set("filterTarget", (card, player, target) => {
							return player.canUse({ name: "sha" }, target)
						})
						.set("ai", target => {
							const player = get.player();
							return get.effect(target, {name:"sha"},player,player)
						})
						.forResult()
					if (!result.bool) return;
					let next = player.useCard({ name: "sha", isCard: true }, result.targets);
					next.directHit = result.targets;
					await next;
				},
			},
			sha: {
				audio: "chuyi_yzs",
				priority: 49,
				logTarget: "player",
				prompt2(event, player) {
					return `你可防止你的【杀】对 ${get.translation(event.player)} 造成的伤害，改为令其进行濒死结算`
				},
				trigger: {
					source: "damageBegin1",
				},
				filter(event, player) {
					return event.card && event.card.name == 'sha'
				},
				check(event, player) {
					if (get.attitude(player, event.player) > 0) return player.countCards("h", { name: "tao" })
					let p = game.filterPlayer(cur => get.attitude(cur, event.player) > 0 && cur.countCards("h") >= 2);
					return p.length <= 2;
				},
				async content(event, trigger, player) {
					trigger.cancel();
					await trigger.player.dying(trigger, true);
				}
			},
		},
		priority: 49,
		locked: true,
		preHidden: true,
		hiddenSkill: true,
		audio: "ext:一中杀/audio/skill:4",
		trigger: {
			source: "recoverBegin"
		},
		frequent(event, player) {
			return event.player === player;
		},
		logTarget: "player",
		prompt2(event, player) {
			return `${get.translation(event.player)} 即将恢复${event.num}点体力，你可令本次恢复值+2`
		},
		check(event, player) {
			return get.recoverEffect(event.player, player, player) > 0;
		},
		async content(event, trigger, player) {
			trigger.num += 2;
			if (!player.storage.chuyi_yzs || !player.storage.chuyi_yzs.includes(trigger.player)) {
				player.markAuto("chuyi_yzs", trigger.player)
				return;
			}
			if (trigger.player == player) return;
			let result = await player.chooseTarget(`你可令 ${get.translation(trigger.player)} 死亡`)
				.set("filterTarget", (card, player, target) => {
					return target == _status.event.target;
				})
				.set("ai", target => {
					return -get.attitude(player,target)
				})
				.set('target', trigger.player)
				.forResult();
			if (result.bool) {
				game.broadcastAll(() => {
					game.playAudio("ext:一中杀/audio/skill/chuyi_yzs3.MP3");
				});
				await trigger.player.die(trigger);
			}
		}
	},
	//SCP-106
	fuqu_yzs: {
		group: ["fuqu_yzs_tengjia1", "fuqu_yzs_tengjia2", "fuqu_yzs_tengjia3",],
		subSkill: {
			tengjia1: {
				equipSkill: true,
				noHidden: true,
				inherit: "tengjia1",
				sourceSkill: "fuqu_yzs",
				forced: true,
				priority: 6,
				audio: "tengjia1",
				trigger: {
					target: ["useCardToBefore"],
				},
				filter(event, player) {
					if (!lib.skill.tengjia1.filter(event, player)) {
						return false;
					}
					if (!player.hasEmptySlot(2)) {
						return false;
					}
					return true;
				},
				content() {
					trigger.cancel();
				},
			},
			tengjia2: {
				equipSkill: true,
				noHidden: true,
				inherit: "tengjia2",
				sourceSkill: "fuqu_yzs",
				audio: "tengjia2",
				forced: true,
				trigger: {
					player: "damageBegin3",
				},
				filter(event, player) {
					if (!lib.skill.tengjia2.filter(event, player)) {
						return false;
					}
					if (!player.hasEmptySlot(2)) {
						return false;
					}
					return true;
				},
				content() {
					trigger.num++;
				},
				ai: {
					effect: {
						target(card, player, target, current) {
							if (card.name == "sha") {
								if (game.hasNature(card, "fire")) {
									return 2;
								}
								if (player.hasSkill("zhuque_skill")) {
									return 1.9;
								}
							}
							if (get.tag(card, "fireDamage") && current < 0) {
								return 2;
							}
						},
					},
				},
			},
			tengjia3: {
				equipSkill: true,
				noHidden: true,
				inherit: "tengjia3",
				sourceSkill: "fuqu_yzs",
				forced: true,
				audio: "tengjia1",
				trigger: {
					target: "shaBefore",
				},
				filter(event, player) {
					if (!lib.skill.tengjia3.filter(event, player)) {
						return false;
					}
					if (!player.hasEmptySlot(2)) {
						return false;
					}
					return true;
				},
				content() {
					trigger.cancel();
				},
			},
		},
		locked: true,
		mod: {
			maxHandcard(player, num) {
				return num - player.countMark("fuqu_yzs");
			},
		},
		marktext: "腐",
		intro: {
			name: "腐躯",
			"name2": "腐躯",
			content: "手牌上限-#。",
		},
		preHidden: true,
		round: 1,
		priority: -106,
		logTarget: "player",
		prompt2(event, player) {
			return `你可获得 ${get.translation(event.player)} 2张牌，然后其选择：①跳过本回合；②自己手牌上限-2并令你本回合调离`
		},
		trigger: {
			global: "phaseBegin"
		},
		filter(event, player) {
			if (event.player.hasSkill("hidden_yzs")) return false;
			return event.player != player;
		},
		check(event, player) {
			return get.attitude(player, event.player) < -1;
		},
		async content(event, trigger, player) {
			await player.gainPlayerCard(trigger.player, "he", false, [1, 2])
			let result = await trigger.player.chooseButton([
				`请选择一项`,
				[
					[
						["loseHp", "失去1点体力"],
						["diaoli", `自己手牌上限-2并令 ${get.translation(player)} 本回合调离`],
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
					let v = -Math.max(0, player.needsToDiscard() + 2);
					if (game.countPlayer() == 2) v -= 100;
					if (button.link == "loseHp") return get.effect(player, { name: "losehp" }, player, player);
					return v
				})
				.forResult();
			if (!result.bool) return
			if (result.links == "loseHp") {
				await trigger.player.loseHp();
			} else {
				trigger.player.addMark("fuqu_yzs", 2, false)
				player.addTempSkill("diaohulishan");
			}
		}
	},
	//轻度收容失效
	LightContainmentBreak_yzs: {
		nobracket: true,
		locked: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		skillAnimation: true,
		animationColor: "thunder",
		charlotte: true,
		unique: true,
		forced: true,
		locked: true,
		filter(event, player) {
			return game.hasPlayer(current => current !== player) && (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			player.addSkill("LCB_yzs")
			let x = game.countPlayer();
			lib.skill.LCB_yzs.addHuashens(player, x);
			game.broadcastAll(() => {
				_status.tempMusic = `ext:一中杀/audio/生存的终焉之光.mp3`;
				game.playBackgroundMusic();
				ui.backgroundMusic.addEventListener('ended', () => {
					delete _status.tempMusic;
					game.playBackgroundMusic();
				}, { once: true });
			});
		},
	},
	LCB_yzs: {
		reinit(player, character) {
			let hidden = false;
			if (typeof character == "string" && !lib.character[character]) {
				lib.character[character] = get.character(character);
			}
			if (!lib.character[character]) {
				return;
			}
			var info = lib.character[character];
			if (!info) {
				info = get.convertedCharacter(["", "", 1, [], []]);
			}
			var skills = info.skills.slice(0);
			player.removeSkill(lib.character[player.name].skills);
			var hp1 = info.hp;
			var maxHp1 = info.maxHp;
			var hujia1 = info.hujia;
			player.name = character;
			player.name1 = character;
			player.tempname = [];
			player.skin = {
				name: character,
			};
			player.sex = info.sex;
			player.group = info.group;
			//player.hp = hp1;
			player.maxHp = maxHp1;
			player.hujia = hujia1;
			player.node.intro.innerHTML = lib.config.intro;
			player.node.name.dataset.nature = get.groupnature(player.group);
			lib.setIntro(player);
			player.node.name.innerHTML = get.slimName(character);
			if (player.classList.contains("minskin") && player.node.name.querySelectorAll("br").length >= 4) {
				player.node.name.classList.add("long");
			}
			if (info.hasHiddenSkill && !player.noclick) {
				if (!player.hiddenSkills) {
					player.hiddenSkills = [];
				}
				player.hiddenSkills.addArray(skills);
				skills = [];
				player.name = "unknown";
				player.sex = "male";
				hidden = true;
				skills.add("g_hidden_ai");
			}
			if (player.storage.nohp || hidden) {
				player.storage.rawHp = player.hp;
				player.storage.rawMaxHp = player.maxHp;
				player.hp = 1;
				player.maxHp = 1;
				if (player.storage.nohp) {
					player.node.hp.hide();
				}
			}
			lib.group.add(player.group);
			player.$init(character);
			player.$update();
		},
		nobracket: true,
		locked: true,
		init(player, skill) {
			if (!player.storage[skill]) {
				player.storage[skill] = {
					character: [],
					choosed: [],
					map: {},
				};
			}
		},
		mark: true,
		intro: {
			onunmark(storage, player) {
				_status.characterlist.addArray(storage.character);
				storage.character = [];
				const name = player.name ? player.name : player.name1;
				if (name) {
					const sex = get.character(name).sex;
					const group = get.character(name).group;
					if (player.sex !== sex) {
						game.broadcastAll(
							(player, sex) => {
								player.sex = sex;
							},
							player,
							sex
						);
						game.log(player, "将性别变为了", "#y" + get.translation(sex) + "性");
					}
					if (player.group !== group) {
						game.broadcastAll(
							(player, group) => {
								player.group = group;
								player.node.name.dataset.nature = get.groupnature(group);
							},
							player,
							group
						);
						game.log(player, "将势力变为了", "#y" + get.translation(group + 2));
					}
				}
			},
			mark(dialog, storage, player) {
				if (storage && storage.current) {
					dialog.addSmall([[storage.current], (item, type, position, noclick, node) => lib.skill.LCB_yzs.$createButton(item, type, position, noclick, node)]);
				}
				if (storage && storage.current2) {
					dialog.add('<div><div class="skill">【' + get.translation(lib.translate[storage.current2 + "_ab"] || get.translation(storage.current2).slice(0, 2)) + "】</div><div>" + get.skillInfoTranslation(storage.current2, player, false) + "</div></div>");
				}
				if (storage && storage.character.length) {
					if (player.isUnderControl(true)) {
						dialog.addSmall([storage.character, (item, type, position, noclick, node) => lib.skill.LCB_yzs.$createButton(item, type, position, noclick, node)]);
					} else {
						dialog.addText("共有" + get.cnNumber(storage.character.length) + "名 SCP");
					}
				} else {
					return "没有 SCP";
				}
			},
			content(storage, player) {
				return "共有" + get.cnNumber(storage.character.length) + "名 SCP";
			},
			markcount(storage, player) {
				if (storage && storage.character) {
					return storage.character.length;
				}
				return 0;
			},
		},
		addHuashen(player) {
			if (!player.storage.LCB_yzs) {
				return;
			}
			if (!_status.characterlist) {
				game.initCharacterList();
			}
			_status.characterlist.randomSort();
			for (let i = 0; i < _status.characterlist.length; i++) {
				let name = _status.characterlist[i];
				if (name.indexOf("zuoci") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || get.is.double(name) || player.storage.LCB_yzs.character.includes(name)) {
					continue;
				}
				if (!get.character(name).isSCP) continue;
				let skills = lib.character[name][3]
				if (skills.length) {
					player.storage.LCB_yzs.character.push(name);
					player.storage.LCB_yzs.map[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens(player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.LCB_yzs.addHuashen(player);
				if (name) {
					list.push(name);
				}
			}
			if (list.length) {
				player.syncStorage("LCB_yzs");
				player.updateMarks("LCB_yzs");
				game.log(player, "获得了", get.cnNumber(list.length) + "名", "SCP");
				lib.skill.LCB_yzs.drawCharacter(player, list);
			}
		},
		removeHuashen(player, links) {
			player.storage.LCB_yzs.character.removeArray(links);
			_status.characterlist.addArray(links);
			game.log(player, "失去了", get.cnNumber(links.length) + "名", "SCP");
		},
		drawCharacter(player, list) {
			game.broadcastAll(
				function (player, list) {
					if (player.isUnderControl(true)) {
						var cards = [];
						for (var i = 0; i < list.length; i++) {
							var cardname = "huashen_card_" + list[i];
							lib.card[cardname] = {
								fullimage: true,
								image: "character:" + list[i],
							};
							lib.translate[cardname] = get.rawName2(list[i]);
							cards.push(game.createCard(cardname, "", ""));
						}
						player.$draw(cards, "nobroadcast");
					}
				},
				player,
				list
			);
		},
		$createButton(item, type, position, noclick, node) {
			node = ui.create.buttonPresets.character(item, "character", position, noclick);
			const info = lib.character[item];
			const skills = info[3]
			if (skills.length) {
				const skillstr = skills.map(i => `[${get.translation(i)}]`).join("<br>");
				const skillnode = ui.create.caption(`<div class="text" data-nature=${get.groupnature(info[1], "raw")}m style="font-family: ${lib.config.name_font || "xinwei"},xinwei">${skillstr}</div>`, node);
				skillnode.style.left = "2px";
				skillnode.style.bottom = "2px";
			}
			node._customintro = function (uiintro, evt) {
				const character = node.link,
					characterInfo = get.character(node.link);
				let capt = get.translation(character);
				if (characterInfo) {
					capt += `&nbsp;&nbsp;${get.translation(characterInfo.sex)}`;
					let charactergroup;
					const charactergroups = get.is.double(character, true);
					if (charactergroups) {
						charactergroup = charactergroups.map(i => get.translation(i)).join("/");
					} else {
						charactergroup = get.translation(characterInfo.group);
					}
					capt += `&nbsp;&nbsp;${charactergroup}`;
				}
				uiintro.add(capt);

				if (lib.characterTitle[node.link]) {
					uiintro.addText(get.colorspan(lib.characterTitle[node.link]));
				}
				for (let i = 0; i < skills.length; i++) {
					if (lib.translate[skills[i] + "_info"]) {
						let translation = lib.translate[skills[i] + "_ab"] || get.translation(skills[i]).slice(0, 2);
						if (lib.skill[skills[i]] && lib.skill[skills[i]].nobracket) {
							uiintro.add('<div><div class="skilln">' + get.translation(skills[i]) + "</div><div>" + get.skillInfoTranslation(skills[i], null, false) + "</div></div>");
						} else {
							uiintro.add('<div><div class="skill">【' + translation + "】</div><div>" + get.skillInfoTranslation(skills[i], null, false) + "</div></div>");
						}
						if (lib.translate[skills[i] + "_append"]) {
							uiintro._place_text = uiintro.add('<div class="text">' + lib.translate[skills[i] + "_append"] + "</div>");
						}
					}
				}
			};
			return node;
		},
		priority: 13,
		forced: true,
		trigger: {
			global: "roundStart",
		},
		filter(event, player) {
			return player.storage.LCB_yzs.character.length
		},
		async content(event, trigger, player) {
			let list = player.storage.LCB_yzs.character
			const result = await player
				.chooseButton(true)
				.set("ai", function (button) {
					return get.rank(button.link, true) - lib.character[button.link][2];
				})
				.set("createDialog", ["将武将牌替换为一名SCP并隐匿", [list.randomGets(5), "character"]])
				.forResult();
			if (result?.links?.length) {
				game.broadcastAll((player, character) => {
					lib.skill.LCB_yzs.reinit(player, character);
				}, player, result.links[0])
			}
		}
	},
	//黎瞳
	zhuofu_yzs: {
		async attach(player, suit) {
			let before = typeof player.storage.zhuofu_yzs == "string" ? player.storage.zhuofu_yzs : "none";
			var next = game.createEvent("ltAttach", false);
			next.player = player;
			next.suit = suit;
			next.before = before;
			next.setContent(async function (event, trigger, player) {
				const suits = ["heart", "spade", "diamond", "club"];
				if (suits.includes(event.before)) {
					player.$throw(game.createCard(`zhuofu_yzs_${event.before}`, event.before));
					await new Promise(r => setTimeout(r, 500))
				}
				player.storage.zhuofu_yzs = event.suit;
				player.markSkill("zhuofu_yzs")
				if (suits.includes(event.suit)) {
					game.broadcastAll(
						function (player, suit) {
							let color = "#151515";
							if (["diamond", "heart"].includes(suit)) color = "#f84242";
							if (player.marks.zhuofu_yzs) {
								player.marks.zhuofu_yzs.firstChild.innerHTML = `<font color=${color}>${get.translation(suit)}</font>`;
							}
						},
						player,
						event.suit
					);
					player.$gain(game.createCard(`zhuofu_yzs_${event.suit}`, event.suit));
					await new Promise(r => setTimeout(r, 500))
				} else {
					player.unmarkSkill("zhuofu_yzs")
				}
				event.trigger("ltAttachEnd");
			});
			await next;
		},
		group: ["zhuofu_yzs_use", "zhuofu_yzs_respond"],
		subSkill: {
			use: {
				priority: -21,
				locked: true,
				forced: true,
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					if (event.target == player) return false;
					if (!event.card) return false;
					const suits = ["heart", "spade", "diamond", "club"];
					return suits.includes(get.suit(event.card))
				},
				async content(event, trigger, player) {
					await lib.skill.zhuofu_yzs.attach(trigger.target, get.suit(trigger.card));
				}
			},
			respond: {
				priority: -21,
				locked: true,
				forced: true,
				trigger: {
					player: ["useCardAfter", "respondAfter"]
				},
				filter(event, player) {
					//respondTo[0]为被响应牌的使用者
					//respondTo[1]为被响应的牌
					if (!Array.isArray(event.respondTo) || event.respondTo[0] == player) return false;
					const suits = ["heart", "spade", "diamond", "club"];
					return suits.includes(get.suit(event.card))
				},
				async content(event, trigger, player) {
					await lib.skill.zhuofu_yzs.attach(trigger.respondTo[0], get.suit(trigger.card));
				}
			},
		},
		marktext: "符",
		intro: {
			content: "当前附着的花色：$",
		},
		locked: true,
		priority: -22,
		charlotte: true,
		unique: true,
		forced: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return game.hasPlayer(current => current !== player) && (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			const suits = ["heart", "spade", "diamond", "club"];
			for (let target of game.filterPlayer()) {
				const index = Math.floor(Math.random() * 4);//投掷点数为0~3之间的随机整数
				await lib.skill.zhuofu_yzs.attach(target, suits[index]);
			}
		},
	},
	fuli_yzs: {
		group: ["fuli_yzs_renew", "fuli_yzs_spade", "fuli_yzs_attach"],
		subSkill: {
			renew: {
				charlotte: true,
				direct: true,
				firstDo: true,
				trigger: {
					player: ["phaseBegin"],
				},
				filter(event, player) { return player.countMark("fuli_yzs_spade") && !event.skill },
				async content(event, trigger, player) {
					player.clearMark("fuli_yzs_spade", false);
				},
			},
			spade: {
				popup: false,
				locked: true,
				forced: true,
				priority: 11,
				trigger: {
					global: "ltAttachEnd"
				},
				filter(event, player) {
					if (player.countMark("fuli_yzs_spade") >= 3) return false;
					if (event.player == player) return false;
					return event.before == "spade"
				},
				async content(event, trigger, player) {
					const result = await player.chooseTarget()
						.set("prompt", `你可令1名角色附着♠`)
						.set("filterTarget", (card, player, target) => {
							return !target.hasSkill("hidden_yzs")
						})
						.set("onChooseTarget", function () {
							event.targetprompt2.add(target => {
								const list = [];
								const suits = ["heart", "spade", "diamond", "club"];
								if (suits.includes(target.storage?.zhuofu_yzs)) list.add(get.translation(target.storage?.zhuofu_yzs))
								return list;
							});
						})
						.forResult()
					if (result.bool && result.targets.length) {
						player.addMark("fuli_yzs_spade", 1, false)
						await lib.skill.zhuofu_yzs.attach(result.targets[0], "spade");
					}
				}
			},
			attach: {
				name: "雷符卡",
				popup: false,
				locked: true,
				forced: true,
				priority: 12,
				trigger: {
					global: "ltAttachEnd"
				},
				filter(event, player) {
					if (event.suit !== "spade") return false;
					return game.countPlayer(cur => cur.storage.zhuofu_yzs == "spade") > 1;
				},
				async content(event, trigger, player) {
					let players = game.filterPlayer(cur => cur.storage.zhuofu_yzs == "spade" && cur != trigger.player);
					for (let target of players) {
						await lib.skill.zhuofu_yzs.attach(target, "none");
					}
				}
			},
		},
		locked: true,
		forced: true,
		priority: 1,
		trigger: {
			global: "ltAttachEnd"
		},
		filter(event, player) {
			if (event.player == player) return false;
			return event.before != "spade"
		},
		async content(event, trigger, player) {
			const suit = trigger.before;
			if (suit == "club") {
				if (!player.countCards("he")) return;
				let result = await player.chooseCardTarget("he", false)
					.set("filterTarget", (card, player, target) => {
						if (target != get.event().target) return false;
						return player.canUse({ name: "tiesuo", isCard: false }, target, false);
					})
					.set("filterCard", (card, player, target) => {
						return true;
					})
					.set("ai1", card => {
						return 6 - get.value(card);
					})
					.set("ai2", target => {
						if (get.effect(target, { name: "tiesuo" }, player, player) < 4) return -1;
						return get.effect(target, { name: "tiesuo" }, player, player);
					})
					.set("selectCard", 1)
					.set("selectTarget", [0, 1])
					.set("target", trigger.player)
					.set("prompt", "冰符卡")
					.set("prompt2", `你可将1张牌重铸或当做${get.poptip("tiesuo")}对 ${get.translation(trigger.player)} 使用<br>(不选目标则重铸)`)
					.forResult();
				if (!result.bool || !result.cards.length) return;
				if (result.targets.length) {
					await player.useCard(result.cards, { name: "tiesuo", isCard: false }, result.targets);
				}
				else { await player.recast(result.cards); }
			} else if (suit == "heart") {
				if (!player.countCards("he")) return;
				let result = await player.chooseCardTarget("he", false)
					.set("filterTarget", (card, player, target) => {
						if (target != get.event().target) return false;
						return player.canUse({ name: "sha", nature: "fire", isCard: false }, target, false);
					})
					.set("filterCard", (card, player, target) => {
						return true;
					})
					.set("ai1", card => {
						return 6 - get.value(card);
					})
					.set("ai2", target => {
						return get.effect(target, { name: "sha",nature:"fire" }, player, player);
					})
					.set("selectCard", 1)
					.set("selectTarget", 1)
					.set("target", trigger.player)
					.set("prompt", "火符卡")
					.set("prompt2", `你可将1张牌当做火【杀】对 ${get.translation(trigger.player)} 使用`)
					.forResult();
				if (!result.bool || !result.cards.length) return;
				if (result.targets.length) {
					await player.useCard(result.cards, { name: "sha", nature: "fire", isCard: false }, result.targets);
				}
			} else if (suit == "diamond") {
				if (!trigger.player.countCards("he")) return;
				await player.gainPlayerCard(trigger.player, "he", true, 1);
				await trigger.player.draw();
			}
		}
	},
	yifu_yzs: {
		group: ["yifu_yzs_renew"],
		subSkill: {
			renew: {
				charlotte: true,
				direct: true,
				firstDo: true,
				trigger: {
					player: ["phaseBegin"],
				},
				filter(event, player) { return player.countMark("yifu_yzs_used") && !event.skill },
				async content(event, trigger, player) {
					player.clearMark("yifu_yzs_used", false);
				},
			},
		},
		async change(player1, player2) {
			const players = [player1, player2].sortBySeat()
			let cards = {};
			const suits = ["heart", "spade", "diamond", "club"];
			for (let player of players) {
				if (suits.includes(player.storage.zhuofu_yzs)) {
					let card = game.createCard(`zhuofu_yzs_${player.storage.zhuofu_yzs}`, player.storage.zhuofu_yzs)
					cards[player.playerid] = card
					player.$throw(card);
					player.unmarkSkill();
					await new Promise(r => setTimeout(r, 500))
				}
			}
			for (let player of players) {
				let before = typeof player.storage.zhuofu_yzs == "string" ? player.storage.zhuofu_yzs : "none";
				var next = game.createEvent("ltAttach", false);
				next.player = player;
				next.suit = cards[player.playerid] ? get.suit(cards[player.playerid]) : "none"
				next.before = before;
				if (cards[player.playerid]) next.card = cards[player.playerid]
				next.setContent(async function (event, trigger, player) {
					const suits = ["heart", "spade", "diamond", "club"];
					player.storage.zhuofu_yzs = event.suit;
					player.markSkill("zhuofu_yzs")
					if (suits.includes(event.suit)) {
						game.broadcastAll(
							function (player, suit) {
								let color = "#151515";
								if (["diamond", "heart"].includes(suit)) color = "#f84242";
								if (player.marks.zhuofu_yzs) {
									player.marks.zhuofu_yzs.firstChild.innerHTML = `<font color=${color}>${get.translation(suit)}</font>`;
								}
							},
							player,
							event.suit
						);
						if (event.card) {
							player.$gain2(event.card);
							await new Promise(r => setTimeout(r, 500))
						}
					} else {
						player.unmarkSkill("zhuofu_yzs")
					}
					event.trigger("ltAttachEnd");
				});
				await next;
			}
		},
		locked: true,
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("yifu_yzs");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickableFilter: function (player) {
			if (player.countMark("yifu_yzs_used")) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let ask = await player.chooseBool(`是否发动【移符】?`, `每自轮次限1次：${get.poptip("wuyongchang_yzs")}：你失去1点体力，然后摸1张牌并令2名角色交换其附着的花色`)
				.forResult();
			if (!ask.bool) return;
			let next = player.useSkill("yifu_yzs")
			await next;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (player.countMark("yifu_yzs_used")) return false;
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return true;
		},
		async content(event, trigger, player) {
			player.addMark("yifu_yzs_used", 1, false)
			await player.loseHp();
			await player.draw();
			if (game.countPlayer(target => !target.hasSkill("hidden_yzs")) < 2) {
				const evt = event.getParent(2);
				if (evt.name == "chooseToUse") {
					evt.goto(0);
					delete evt.openskilldialog;
				}
				return;
			}
			const result = await player.chooseTarget(2)
				.set("prompt", `令2名角色交换其附着的花色`)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs")
				})
				.set("onChooseTarget", function () {
					event.targetprompt2.add(target => {
						const list = [];
						const suits = ["heart", "spade", "diamond", "club"];
						if (suits.includes(target.storage.zhuofu_yzs)) list.add(get.translation(target.storage.zhuofu_yzs))
						return list;
					});
				})
				.forResult()
			if (result.bool && result.targets.length == 2) {
				await lib.skill.yifu_yzs.change(result.targets[0], result.targets[1]);
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 6,
			result: {
				player(player) {
					if (player.isHealthy() || player.countCards("h", { name: "tao" })) return 1;
					return -1;
				}
			}
		}
	},
	huanfu_yzs: {
		locked: true,
		forced: true,
		priority: 1,
		trigger: {
			player: "ltAttachEnd"
		},
		filter(event, player) {
			return true
		},
		async content(event, trigger, player) {
			const suit = trigger.before;
			if (suit == "spade") {
				player.clearMark("yifu_yzs_used", false);
			} else if (suit == "club") {
				let num = 1 - player.hujia;
				if (num !== 0) await player.changeHujia(num);
			} else if (suit == "heart") {
				if (player.countCards("he")) {
					let result = await player.chooseCardTarget("he", false)
						.set("filterTarget", (card, player, target) => {
							if (target != get.event().target) return false;
							return player.canUse({ name: "tao", isCard: false }, target);
						})
						.set("filterCard", (card, player, target) => {
							return true;
						})
						.set("ai1", card => {
							return 6 - get.value(card);
						})
						.set("ai2", target => {
							return get.effect(target, { name: "tao" }, player, player);
						})
						.set("selectCard", 1)
						.set("selectTarget", 1)
						.set("target", player)
						.set("prompt", "火符卡")
						.set("prompt2", `你可将1张牌当做【桃】对自己使用`)
						.forResult();
					if (!result.bool || !result.cards.length) return;
					if (result.targets.length) {
						await player.useCard(result.cards, { name: "tao", isCard: false }, result.targets, false);
					}
				}
			} else if (suit == "diamond") {
				await player.draw()
			}
			if (!player.countCards("h")) return;
			let result = await player
				.chooseCard("h")
				.set("prompt", "幻符")
				.set("prompt2", "你可重铸1张手牌")
				.set("ai", card => {
					return 6 - get.value(card);
				})
				.forResult();
			if (result.bool && result.cards?.length) {
				await player.recast(result.cards)
			}
		}
	},
	//波风水坤
	luoxuanwan_yzs: {
		Effect: function (player, target, sizeMultiplier = 1) {
			if (!player || !target) return;

			// 1. 特效画布层
			const container = document.createElement('div');
			Object.assign(container.style, {
				position: 'fixed',
				top: '0', left: '0', width: '100vw', height: '100vh',
				zIndex: '99999', pointerEvents: 'none', overflow: 'visible'
			});
			document.body.appendChild(container);

			// 2. 坐标与尺寸计算
			const pRect = player.getBoundingClientRect();
			const tRect = target.getBoundingClientRect();
			const startX = pRect.left + pRect.width / 2;
			const startY = pRect.top + pRect.height / 2;
			const endX = tRect.left + tRect.width / 2;
			const endY = tRect.top + tRect.height / 2;

			// 根据参数动态计算尺寸（基础 60px）
			const baseSize = 60 * sizeMultiplier;
			const shadowBlur = 15 * sizeMultiplier; // 阴影随体积扩散

			// 3. 构造雷电螺旋丸 (Rasengan)
			const rasengan = document.createElement('div');
			Object.assign(rasengan.style, {
				position: 'absolute',
				width: `${baseSize}px`,
				height: `${baseSize}px`,
				left: `${startX}px`,
				top: `${startY}px`,
				borderRadius: '50%',
				background: `
			radial-gradient(circle at center, #fff 10%, #40c4ff 40%, transparent 75%),
			repeating-conic-gradient(from 0deg, transparent 0deg, #00b0ff 15deg, transparent 30deg)
		`,
				filter: `
			drop-shadow(0 0 ${shadowBlur}px #00e5ff)
			drop-shadow(0 0 ${shadowBlur * 2}px #2979ff)
			brightness(1.6)
		`,
				boxShadow: `inset 0 0 ${20 * sizeMultiplier}px #fff`,
				opacity: '0',
				transformOrigin: 'center center',
				transform: `translate(-50%, -50%) scale(0.1)`,
				willChange: 'transform, opacity, filter'
			});

			// 内部旋转流光层
			const innerCore = document.createElement('div');
			Object.assign(innerCore.style, {
				width: '100%', height: '100%', borderRadius: '50%',
				border: `${2 * sizeMultiplier}px dashed rgba(255,255,255,0.7)`,
				animation: 'rasengan-spin 0.15s linear infinite'
			});
			rasengan.appendChild(innerCore);

			if (!document.getElementById('rasengan-style')) {
				const style = document.createElement('style');
				style.id = 'rasengan-style';
				style.innerHTML = `@keyframes rasengan-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
				document.head.appendChild(style);
			}

			container.appendChild(rasengan);

			// 4. 动画时间参数
			const chargeTime = 800; // 显著延长蓄力时间（从300ms增至800ms）
			const travelTime = 350; // 飞行速度略微加快，增加冲击感

			// 第一阶段：蓄力 (搓丸子阶段)
			rasengan.animate([
				{ transform: 'translate(-50%, -50%) scale(0.1) rotate(0deg)', opacity: '0' },
				{ transform: 'translate(-50%, -50%) scale(1.3) rotate(360deg)', opacity: '1', offset: 0.7 }, // 蓄力瞬间膨胀
				{ transform: 'translate(-50%, -50%) scale(1) rotate(720deg)', opacity: '1' } // 回稳准备发射
			], {
				duration: chargeTime,
				easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // 带有回弹感的蓄力
			}).onfinish = () => {

				// 第二阶段：疾驰与爆炸
				rasengan.animate([
					{
						left: `${startX}px`, top: `${startY}px`,
						transform: 'translate(-50%, -50%) scale(1)',
						filter: 'blur(0px) brightness(1.6)'
					},
					{
						left: `${endX}px`, top: `${endY}px`,
						transform: 'translate(-50%, -50%) scale(1)',
						filter: 'blur(0px) brightness(2)',
						opacity: '1',
						offset: 0.9
					},
					{
						// 最终爆炸：根据 sizeMultiplier 同步增大爆炸半径
						left: `${endX}px`, top: `${endY}px`,
						transform: `translate(-50%, -50%) scale(${5 * sizeMultiplier})`,
						filter: `blur(${15 * sizeMultiplier}px) brightness(3)`,
						opacity: '0',
						offset: 1
					}
				], {
					duration: travelTime,
					easing: 'ease-in'
				}).onfinish = () => {
					// 清理容器
					setTimeout(() => {
						if (container.parentNode) container.parentNode.removeChild(container);
					}, 150);
				};
			};
		},
		group: ["luoxuanwan_yzs_use"],
		subSkill: {
			use: {
				priority: 91,
				direct: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.luoxuanwan_yzs
				},
				async content(event, trigger, player) {
					let num = trigger.card.storage.luoxuanwan_yzs
					trigger.baseDamage += num - 1;
					if (num > 0) {
						game.broadcastAll((player, target, num) => {
							lib.skill.luoxuanwan_yzs.Effect(player,target,num)
						},player,trigger.targets[0],num)
						await player.draw(num);
					}
				},
			},
		},
		nobracket: true,
		enable: ["chooseToUse"],
		audio: "zhangba_skill",
		hiddenCard: function (player, name) {
			if (!player.countCards("hs")) return
			return name == 'sha'
		},
		filterCard: {
			name: "sha",
		},
		viewAsFilter: function (player) {
			return player.countCards('hs', { name: 'sha' }) > 0;
		},
		selectCard: [1, Infinity],
		allowChooseAll: true,
		position: "hs",
		viewAs: {
			name: "sha",
		},
		complexCard: true,
		filter(event, player) {
			return player.countCards("hs") > 0;
		},
		async precontent(event, trigger, player) {
			let cards = event.result.cards;
			if (!cards.length) return;
			let num = Math.max(0, cards.length)
			event.result.card.storage.luoxuanwan_yzs = num;
		},
		prompt: "将任意张【杀】当做伤害值为底牌数的普通【杀】使用，然后摸等量张牌",
		check(card) {
			let player = _status.event.player;
			if (
				player.hasCard(function (card) {
					return get.name(card) === "sha";
				})
			) {
				return 0;
			}
			if (
				_status.event &&
				_status.event.name === "chooseToRespond" &&
				player.hp < 3 &&
				!player.countCards("hs", function (card) {
					return get.name(card) !== "tao" && get.name(card) !== "jiu";
				})
			) {
				return (player.hp > 1 ? 10 : 8) - get.value(card);
			}
			return Math.max(5, 8 - 0.7 * player.hp) - get.value(card);
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
		mod: {
			aiValue(player, card, num) {
				if (card.name === "sha") {
					return num+10;
				}
			},
		}
	},
	feileishen_yzs: {
		group: ["feileishen_yzs_limit", "feileishen_yzs_targeted", "feileishen_yzs_kuwu"],
		subSkill: {
			kuwu: {
				name: "苦无",
				prompt: `出牌阶段，你可将1张手牌暗置于其他角色角色牌旁称为【苦无】（每名角色至多1张）`,
				filter(event, player) {
					if (!player.countCards("h")) return false;
					if (!game.hasPlayer(target => !target.countExpansions("feileishen_yzs") && !target.hasSkill("hidden_yzs") && player != target)) return false;
					return true;
				},
				enable: "phaseUse",
				filterCard: true,
				position: "h",
				filterTarget: function (card, player, target) {
					return !target.countExpansions("feileishen_yzs") && !target.hasSkill("hidden_yzs") && player != target;
				},
				lose: false,
				discard: false,
				selectTarget: 1,
				check(card) {
					return 6 - get.value(card);
				},
				async content(event, trigger, player) {
					let next = event.target.addToExpansion(event.cards, player, "giveAuto")
					next.gaintag.add("feileishen_yzs");
					await next;
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, "effect/equip1.mp3");
				},
				ai: {
					order: 10,
					result: {
						target: -1,
					}
				}
			},
			limit: {
				name: "飞雷神",
				locked: true,
				limited: true,
				skillAnimation: true,
				animationColor: "thunder",
				audio: "rw_bagua_skill",
				enable: "phaseUse",
				filter(event, player) {
					return !player.awakenedSkills.includes("feileishen_yzs_limit");
				},
				async content(event, trigger, player) {
					game.broadcastAll((player) => {
						player.awakenSkill("feileishen_yzs_limit")
					}, player)
					player.markSkill("feileishen_yzs_limit")
					player.getStat().card.sha = 0;
					let cards = [];
					for (let target of game.filterPlayer(target => target.countExpansions("feileishen_yzs"))) {
						cards.addArray(target.getExpansions("feileishen_yzs"))
					}
					if (cards.length) await player.gain(cards);
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							let usable = player.getCardUsable("sha");
							if (usable > 0) return -1;
							return player.countCards("h", { name: "sha" })-2;
						}
					}
				}
			},
			targeted: {
				locked: true,
				trigger: {
					player: "useCardToPlayered",
					target: "useCardToTargeted",
				},
				filter(event, player) {
					const target = player == event.player ? event.target : event.player;
					if (!target.countExpansions("feileishen_yzs")) return false;
					return true;
				},
				audio: "fangtian_skill",
				async cost(event, trigger, player) {
					const target = player == trigger.player ? trigger.target : trigger.player;
					let result1 = await player.chooseButton(["飞雷神", `你可使用 ${get.translation(target)} 的【苦无】${target.countCards("h") ? `，取消则可观看其手牌并用其1张手牌交换其【苦无】` : ``}`, target.getExpansions("feileishen_yzs")], false)
						.set("selectButton", 1)
						.set("filterButton", button => {
							return _status.event.player.hasUseTarget(button.link);
						})
						.set("ai", button => {
							if (get.value(button) >= 6) return 1;
							return -1;
						})
						.forResult()
					if (result1.bool) {
						event.result = {
							bool: true,
							cards: result1.links
						}
						return;
					}
					if (target.countCards("h")) {
						let result2 = await player.chooseTarget(`你可观看 ${get.translation(target)} 的手牌并用其1张手牌交换其【苦无】`)
							.set("filterTarget", (card, player, target) => {
								return target == _status.event.target;
							})
							.set("ai",target=>1)
							.set('target', target)
							.forResult();
						if (result2.bool) {
							event.result = {
								bool: true,
								cost_data: "view"
							}
							return;
						}
					}
					event.result = {
						bool: false,
					}
				},
				async content(event, trigger, player) {
					const target = player == trigger.player ? trigger.target : trigger.player;
					if (event.cards?.length) {
						await player.chooseUseTarget(true, event.cards, false);
						return;
					} else {
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

						let dialog = [];
						if (target.getExpansions("feileishen_yzs").length > 0) {
							dialog.push(`${get.translation(target.name)}的【苦无】`);
							dialog.push(target.getExpansions("feileishen_yzs"))
						}
						if (target.getCards("h").length > 0) {
							dialog.push(`${get.translation(target.name)}的手牌`);
							dialog.push(target.getCards("h"))
						}
						if (!dialog.length) {
							return;
						}
						let next = player.chooseButton(2, dialog);
						next.set("target", target);
						next.set("forced", true);
						next.set("filterButton", () => true);
						next.set("ai", processAI);

						const result = await next.forResult();
						var pushs = result.links.filter(i => !target.getExpansions("feileishen_yzs").includes(i))
						var gains = result.links.filter(i => !target.getCards("h").includes(i))
						if (!pushs.length || pushs.length != gains.length) return;
						await target.gain(gains, "draw");
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, "effect/equipl.mp3");
						next = target.addToExpansion(pushs, player, "giveAuto")
						next.gaintag.add("feileishen_yzs");
						await next;
					}
				}
			},
		},
		nobracket: true,
		locked: true,
		marktext: "苦",
		intro: {
			markcount: "expansion",
			mark(dialog, storage, player) {
				var cards = player.getExpansions("feileishen_yzs");
				if (game.me.hasSkill("feileishen_yzs")) {
					dialog.addAuto(cards);
				} else {
					return "共有" + get.cnNumber(cards.length) + "张牌";
				}
			},
		},
	},
	//黑暗骑士
	yeya_yzs: {
		async remove(player, card) {
			if (Array.isArray(card)) card = card[0];
			let bool = card.hasGaintag("yeya_yzs");
			await player.loseToDiscardpile(card);
			player.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
			if (get.color(card, player) == "black") {
				if (_status._yzsStorm == "BulletStorm") {
					await player.draw()
				} else {
					await player.yzs_SummonStorm("BulletStorm");
				}
			} else if (get.color(card, player) == "red") {
				if (_status._yzsStorm == "WaterStorm") {
					await player.draw()
				} else {
					await player.yzs_SummonStorm("WaterStorm");
				}
			}
			if (!bool || !player.hasSkill("anmo_yzs")) return;
			let result = await player.chooseTarget(`选择1名其他角色`,`其需弃置1张点数＞${get.number(card)}的牌，否则失去1点体力`)
				.set("filterTarget", (card, player, target) => {
					return target!=player
				})
				.set("ai", target => {
					const player = get.player();
					return get.effect(target, { name: "guohe" }, player, player) + get.effect(target, { name: "losehp" }, player, player)
				})
				.forResult();
			if (!result.bool) return;
			let target = result.targets[0];
			result = target.countCards("he") < 1
				? { bool: false }
				: await target
					.chooseToDiscard(1, `弃置1张点数＞${get.number(card)}的牌，否则失去1点体力`, "he")
					.set("filterCard", (card, player) => {
						return get.number(card,player)>get.event().number
					})
					.set("number", get.number(card))
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
				await target.loseHp();
			}
		},
		group: ["yeya_yzs_start", "yeya_yzs_gain", "yeya_yzs_remove"],
		subSkill: {
			start: {
				audio: "ext:一中杀/audio/skill:1",
				priority: 4,
				forced: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					const cards = get.cards(1);
					let next = player.addToExpansion(cards, "draw", player)
					next.gaintag.add("yeya_yzs_down");
					await next;
				},
			},
			gain: {
				audio: "yeya_yzs_start",
				forced: true,
				priority:-3,
				trigger: {
					player: "loseAfter",
					global: ["gainAfter", "loseAsyncAfter", "addJudgeAfter", "addToExpansionAfter", "equipAfter"],
				},
				filter(event, player) {
					if (event.getl?.(player)?.cards2?.length) {
						return event.getl(player).cards2.filter(card=>get.color(card,player)=="black").length
					};
					return false;
				},
				async content(event, trigger, player) {
					const cards = get.cards(trigger.getl(player).cards2.filter(card => get.color(card, player) == "black").length);
					let next = player.addToExpansion(cards, "draw", player)
					next.gaintag.add("yeya_yzs_down");
					await next;
				},
			},
			remove: {
				audio: "ext:一中杀/audio/skill:1",
				priority: -2,
				forced:true,
				trigger: {
					player:["addToExpansionAfter","changeHpEnd"],
				},
				filter(event, player) {
					return player.countExpansions("yeya_yzs") + player.countExpansions("yeya_yzs_down")>Math.max(0,player.hp)
				},
				async content(event, trigger, player) {
					while (player.countExpansions("yeya_yzs") + player.countExpansions("yeya_yzs_down") > Math.max(player.hp,0)) {
						let result = await player.chooseButton(["夜鸦", `你需移去1张【鸦印】`, player.getExpansions("yeya_yzs").concat(player.getExpansions("yeya_yzs_down"))], true)
							.set("ai", button => {
								if (_status._yzsStorm == "BulletStorm") {
									if (get.color(button) == "black") return 3;
									return 5;
								} else if (_status._yzsStorm == "WaterStorm") {
									if (get.color(button) == "red") return 3;
									if (player.hasSha() && player.getCardUsable("sha") < 1) return 4;
									return 0;
								} else {
									if (get.color(button) == "black") {
										if (player.hasSha() && player.getCardUsable("sha") < 1) return 4;
										return 2;
									} else if (get.color(button) == "red") {
										return 5;
									}
									return 1;
								}
							})
							.set("selectButton", 1)
							.forResult()
						if (!result.bool) return;
						if (result.links.length)await lib.skill.yeya_yzs.remove(player, result.links);
					}
				}
			},
		},
		mark:true,
		marktext: "鸦",
		intro: {
			mark(dialog, content, player) {
				const ups = player.getExpansions("yeya_yzs");
				const downs = player.getExpansions("yeya_yzs_down");
				if (!ups.length && !downs.length) return "无【鸦印】";
				if (downs.length) {
					if (player.isUnderControl(true)) {
						dialog.addText("暗置的【鸦印】：");
						dialog.addAuto(downs);
					} else {
						dialog.addText("共有" + get.cnNumber(downs.length) + "张暗置的【鸦印】");
					}
				} else {
					dialog.addText("无暗置的【鸦印】");
				}
				if (ups.length) {
					dialog.addText("明置的【鸦印】：");
					dialog.addAuto(ups);
				}
			},
		},
		locked:true,
	},
	anmo_yzs: {
		group: ["anmo_yzs_sha"],
		subSkill: {
			sha: {
				forced: true,
				priority:-2,
				trigger: {
					source:"damageBegin2"
				},
				filter(event, player) {
					return player!=event.player
				},
				async content(event, trigger, player) {
					await player.useCard({ name: 'sha' }, player, false);
				}
			},
		},
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		trigger: {
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (event.card.name != "sha") return false;
			if (!player.countExpansions("yeya_yzs_down")) return false;
			return true;
		},
		async cost(event, trigger, player) {
			event.result = { bool: false };
			let result = await player.chooseButton(["夜鸦", `你可将1张【鸦印】翻面`, player.getExpansions("yeya_yzs_down")], false)
				.set("selectButton", 1)
				.set("ai",button=>get.number(button))
				.forResult()
			if (result.bool) {
				event.result = {
					bool: true,
					cost_data:result.links
				}
			};
		},
		async content(event, trigger, player) {
			await player.loseToSpecial(event.cost_data);
			let next = player.addToExpansion(event.cost_data, player, "giveAuto")
			next.gaintag.add("yeya_yzs");
			next.untrigger(true);
			await next;
		}
	},
	pipan_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		limited: true,
		skillAnimation: true,
		animationColor: "fire",
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("pipan_yzs");
		},
		clickableFilter: function (player) {
			if (!game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs")) && player != target;
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("踏履", "选择 1 名角色", false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs");
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("pipan_yzs")
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
			return !target.hasSkill("hidden_yzs");
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.awakenSkill("pipan_yzs")
			player.tempBanSkill("yeya_yzs");
			game.broadcastAll((player) => {
				game.playAudio("ext:一中杀/audio/skill/TheWorldEnter.mp3");
				player.$skill("压路机来啦！", "legend", "fire");
			}, player);
			await new Promise(r => setTimeout(r, 3000))
			while (event.target.countCards("h")) {
				await event.target.showHandcards("踏履")
				if (event.target.countCards("h", { color: "black" })) {
					let result = await event.target.chooseCard(`踏履`, `将其中1张黑色牌当做普通【杀】对 ${get.translation(player)} 使用`, 1, true, { color: "black" }).forResult();
					if (!result.bool) break;
					await event.target.useCard(result.cards, { name: 'sha' }, player, false);
				} else break;
			}
			game.trySkillAudio("yeya_yzs_remove");
			while (player.countExpansions("yeya_yzs") + player.countExpansions("yeya_yzs_down")>0) {
				let result = await player.chooseButton(["夜鸦", `你需移去1张【鸦印】`, player.getExpansions("yeya_yzs").concat(player.getExpansions("yeya_yzs_down"))], true)
					.set("selectButton", 1)
					.set("ai", button => {
						if (_status._yzsStorm == "BulletStorm") {
							if (get.color(button) == "black") return 3;
							return 5;
						} else if (_status._yzsStorm == "WaterStorm") {
							if (get.color(button) == "red") return 3;
							if (player.hasSha() && player.getCardUsable("sha") < 1) return 4;
							return 0;
						} else {
							if (get.color(button) == "black") {
								if (player.hasSha() && player.getCardUsable("sha") < 1) return 4;
								return 2;
							} else if (get.color(button) == "red") {
								return 5;
							}
							return 1;
						}
					})
					.forResult()
				if (!result.bool) break;
				await lib.skill.yeya_yzs.remove(player, result.links);
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 8,
			result: {
				player(player, target) {
					return -2/player.hp
				},
				target(player, target) {
					return -target.countCards("h") / 2;
				}
			}
		}
	},
}
export default skills;
