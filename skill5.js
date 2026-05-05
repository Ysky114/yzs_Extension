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
	//愚人节希儿
	Foolshuangsheng_yzs: {
		mark: true,
		marktext: "<span style=\"text-decoration: line-through;\">双生</span>",
		markimage: 'extension/一中杀/image/shuangsheng_yzs.png',
		intro: {
			name: "双生",
			content: function (storage, player) {
				let str = ``;
				if (player.countMark("Foolshuangsheng_yzs_shengling") < 2) str += `当前有${2 - player.countMark("Foolshuangsheng_yzs_shengling")}个生灵处于“量子态”<br>`
				if (player.storage.twins.life.dead) str += `“生”形态处于“量子态”<br>`;
				if (player.storage.twins.death.dead) str += `“死”形态处于“量子态”<br>`;
				str += `当前sp值：` + player.countMark("Foolshuangsheng_yzs");
				return str
			},
		},
		derivation: ["Foolyanmie_yzs"],
		group: ["Foolshuangsheng_yzs_damage", "Foolshuangsheng_yzs_change", "Foolshuangsheng_yzs_cost"],
		subSkill: {
			damage: {
				forced: true,
				priority: -2,
				trigger: {
					player: "damageBegin2"
				},
				async content(event, trigger, player) {
					let ask = player.countMark("Foolshuangsheng_yzs_shengling") > 0 ? await player.chooseBool(`当你受到伤害时，你可改为令一个未进入[量子态]的生灵进入[量子态]并摸一张牌且回复一点sp<br>否则使当前人物进入[量子态]然后摸一张牌并切换至另一人物`)
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								return true;
							})()
						)
						.forResult() : { bool: false };
					if (ask.bool) {
						trigger.cancel()
						player.removeMark("Foolshuangsheng_yzs_shengling", 1, false);
						await player.draw();
						if (player.countMark("Foolshuangsheng_yzs") < 7) player.addMark("Foolshuangsheng_yzs", 1, false)
					} else {
						trigger.cancel()
						await player.draw();
						player.storage.status_avatar.dead = true;
						if (player.storage.twins.life.dead && player.storage.twins.death.dead) await player.die(trigger.reason);
						player.markSkill("twins")
						await player.turnOver();
					}
				},
			},
			change: {
				popup: false,
				firstDo: true,
				locked: true,
				forced: true,
				forceunique: true,
				audio: "Undying_yzs",
				charlotte: true,
				trigger: {
					player: "turnOverBefore",
				},
				filter: function (event, player) {
					return !player.isTurnedOver();
				},
				async content(event, trigger, player) {
					trigger.cancel();
					if (player.storage.status_avatar == player.storage.twins.life) {
						player.storage.status_avatar = player.storage.twins.death;
						player.markSkill("status_avatar");
						player.markSkill("Foolshuangsheng_yzs")
						player.removeTip("Foolchuangsheng_yzs");
						await player.removeSkill("Foolchuangsheng_yzs");
						await player.addSkill("Foolyanmie_yzs");
						if (player.storage.xierlast_used) {
							player.addTip("Foolyanmie_yzs", "湮灭 ≤" + player.storage.xierlast_used, false);
						}
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Seele_Vollerei2_yzs.png");
						}, player)
					} else {
						player.storage.status_avatar = player.storage.twins.life;
						player.markSkill("status_avatar");
						player.removeTip("Foolyanmie_yzs");
						await player.removeSkill("Foolyanmie_yzs");
						await player.addSkill("Foolchuangsheng_yzs");
						if (player.storage.xierlast_used) {
							player.addTip("Foolchuangsheng_yzs", "创生 ≥" + player.storage.xierlast_used, false);
						}
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Seele_Vollerei_yzs.png");
						}, player)
					}
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
				},
				sub: true,
				sourceSkill: "Foolshuangsheng_yzs",
			},
			cost: {
				charlotte: true,
				forced: true,
				trigger: { player: "phaseBegin" },
				priority: 114,
				filter(event, player) {
					return player.storage.status_avatar.dead;
				},
				async content(event, trigger, player) {
					player.setMark("Foolshuangsheng_yzs", 3, false)
					const evt = event.getParent("phase", true);
					if (evt?.player == player) {
						game.log(player, "结束了回合");
						evt.num = evt.phaseList.length;
						evt.goto(11);
					}
				}
			},
		},
		locked: true,
		charlotte: true,
		unique: true,
		init: function (player, skill) {
			if (!player.storage.twins) {
				player.storage.twins = {
					life: {
						dead: false,
					},
					death: {
						dead: false,
					}
				};
				player.markSkill("twins");
			}
			if (!player.storage.xierlast_used) {
				player.storage.xierlast_used = 0;
				player.markSkill("xierlast_used");
			}
			if (!player.storage.status_avatar) {
				player.storage.status_avatar = player.storage.twins.life;
				player.markSkill("status_avatar");
			}
			player.markSkill("Foolshuangsheng_yzs")
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			player.setMark("Foolshuangsheng_yzs", 3, false)
			player.setMark("Foolshuangsheng_yzs_shengling", 2, false)
		},
		mod: {
			aiValue(player, card, num) {
				if (card.name === "tao") {
					return num / 10;
				}
			},
		}
	},
	Foolchuangsheng_yzs: {
		group: ["Foolchuangsheng_yzs_change"],
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
				"skill_id": "Foolchuangsheng_yzs_used",
				sub: true,
				sourceSkill: "Foolchuangsheng_yzs",
				"_priority": 0,
			},
			change: {
				enable: "phaseUse",
				filter(event, player) {
					if (player.countMark("Foolchuangsheng_yzs_used") + player.countMark("Foolyanmie_yzs_used") >= 2) return false;
					return player.getCards("h", { name: "shan" }).length
				},
				filterCard: {
					name: "shan",
				},
				check(card) {
					return 9 - get.value(card);
				},
				async content(event, trigger, player) {
					player.addTempSkill("Foolchuangsheng_yzs_used", { player: "phaseUseAfter" })
					player.addMark("Foolchuangsheng_yzs_used", 1, false)
					await player.turnOver();
				},
			}
		},
		direct: true,
		popup: true,
		trigger: {
			player: "useCard",
		},
		getLastUsed(player, event) {
			var history = player.getAllHistory("useCard");
			var index;
			if (event) {
				index = history.indexOf(event) - 1;
			} else {
				index = history.length - 1;
			}
			if (index >= 0) {
				return history[index];
			}
			return false;
		},
		filter(event, player) {
			player.addTip("Foolchuangsheng_yzs", "创生 ≥" + get.number(event.card), false);
			player.storage.xierlast_used = get.number(event.card);
			player.markSkill("xierlast_used");
			var evt = lib.skill.chuangsheng_yzs.getLastUsed(player, event);
			if (!evt || !evt.card) {
				return false;
			}
			return event.card && event.card.number >= evt.card.number;
		},
		async content(event, trigger, player) {
			if (trigger.addCount !== false) {
				trigger.addCount = false;
				trigger.player.getStat("card")[trigger.card.name]--;
			}
			await player.draw();
			await player.chooseToDiscard("h", 1, true)
		},
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					var evt = lib.skill.chuangsheng_yzs.getLastUsed(player);
					if (!evt || !evt.card) {
						return num;
					}
					if (evt.card.number && evt.card.number >= get.number(card)) {
						return num + 10;
					}
				}
			},
			targetInRange: function (card) {
				const player = get.player();
				if (card && card.number >= player.storage.xierlast_used) return true;
			},
			cardUsable: function (card, num) {
				const player = get.player();
				if (card && card.number >= player.storage.xierlast_used) return Infinity;
			},
		},
	},
	Foolyanmie_yzs: {
		group: ["Foolyanmie_yzs_change"],
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
				"skill_id": "Foolyanmie_yzs_used",
				sub: true,
				sourceSkill: "Foolyanmie_yzs",
				"_priority": 0,
			},
			change: {
				enable: "phaseUse",
				filter(event, player) {
					if (player.countMark("Foolchuangsheng_yzs_used") + player.countMark("Foolyanmie_yzs_used") >= 2) return false;
					return player.getCards("h", { name: "shan" }).length
				},
				filterCard: {
					name: "shan",
				},
				check(card) {
					return 9 - get.value(card);
				},
				async content(event, trigger, player) {
					player.addTempSkill("Foolyanmie_yzs_used", { player: "phaseUseAfter" })
					player.addMark("Foolyanmie_yzs", 1, false)
					await player.turnOver();
				},
			}
		},
		direct: true,
		popup: true,
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			player.addTip("Foolyanmie_yzs", "湮灭 ≤" + get.number(event.card), false);
			player.storage.xierlast_used = get.number(event.card);
			player.markSkill("xierlast_used");
			var evt = lib.skill.chuangsheng_yzs.getLastUsed(player, event);
			if (!evt || !evt.card) {
				return false;
			}
			return event.card && event.card.number <= evt.card.number;
		},
		async content(event, trigger, player) {
			if (trigger.addCount !== false) {
				trigger.addCount = false;
				trigger.player.getStat("card")[trigger.card.name]--;
			}
			await player.draw();
			await player.chooseToDiscard("h", 1, true)
		},
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					var evt = lib.skill.chuangsheng_yzs.getLastUsed(player);
					if (!evt || !evt.card) {
						return num;
					}
					if (evt.card.number && evt.card.number <= get.number(card)) {
						return num + 10;
					}
				}
			},
			targetInRange: function (card) {
				const player = get.player();
				if (card && card.number <= player.storage.xierlast_used) return true;
			},
			cardUsable: function (card, num) {
				const player = get.player();
				if (card && card.number <= player.storage.xierlast_used) return Infinity;
			},
		},
	},
	Foolxieshengzhijing_yzs: {
		nobracket: true,
		locked: true,
		group: ["Foolxieshengzhijing_yzs_damage", "Foolxieshengzhijing_yzs_sp"],
		subSkill: {
			damage: {
				priority: -1,
				trigger: {
					player: "damageBegin2"
				},
				filter(event, player) {
					return player.countCards("h") >= 2;
				},
				async cost(event, trigger, player) {
					event.result = player.countCards("h") >= 2 ? await player.chooseToDiscard(2, false, "h")
						.set("prompt", `是否发动【撷生之境】`)
						.set("prompt2", `你可在受到伤害时弃置两张手牌抵挡之，若弃置手牌中有[闪]，则恢复一点sp`)
						.set("ai", card => {
							if (card.name == "shan" && player.countCards("h", { name: "shan" }) <= 2) return 0;
							if (["tao", "jiu"].includes(card.name)) return 5;
							return 5 - get.value(card);
						})
						.set("chooseonly", true)
						.forResult() : { bool: false };
				},
				async content(event, trigger, player) {
					let bool = event.cards.some(card => get.name(card, player) == "shan");
					await player.modedDiscard(event.cards);
					trigger.cancel();
					if (bool && player.countMark("Foolshuangsheng_yzs") < 7) {
						player.addMark("Foolshuangsheng_yzs", 1, false)
					}
				},
			},
			sp: {
				locked: true,
				forced: true,
				trigger: {
					source: ["damageSource", "dying"]
				},
				filter(event, player) { return player.countMark("Foolshuangsheng_yzs") < 7 },
				async content(event, trigger, player) {
					if (player.countMark("Foolshuangsheng_yzs") < 7) player.addMark("Foolshuangsheng_yzs", 1, false)
				}
			},
		},
	},
	Foolniworuyi_yzs: {
		nobracket: true,
		locked: true,
		group: ["Foolniworuyi_yzs_renew", "Foolniworuyi_yzs_hujia", "Foolniworuyi_yzs_use"],
		subSkill: {
			use: {
				name: `你我如一(印牌)`,
				enable: "chooseToUse",
				filter(event, player) {
					if (_status.currentPhase != player) return false;
					if (!player.countCards("h", card => card.hasGaintag("visible_Foolniworuyi_yzs_hujia"))) {
						return false;
					}
					return get
						.inpileVCardList(info => {
							return true
						})
						.some(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
				},
				chooseButton: {
					dialog(event, player) {
						const list = get
							.inpileVCardList(info => {
								return true
							})
							.filter(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
						return ui.create.dialog("你我如一", [list, "vcard"]);
					},
					check(button) {
						if (get.event().getParent().type != "phase") {
							return 1;
						}
						return get.event().player.getUseValue({
							name: button.link[2],
							nature: button.link[3],
						});
					},
					backup(links, player) {
						return {
							filterCard(card, player) {
								return card.hasGaintag("visible_Foolniworuyi_yzs_hujia")
							},
							selectCard: 1,
							popname: true,
							viewAs: {
								name: links[0][2],
								nature: links[0][3],
							},
							ai1(card) {
								return 1 / (get.value(card) || 0.5);
							},
							log: false,
							position: "h",
						};
					},
					prompt(links, player) {
						//花色各不相同的
						let prompt = `将1张手牌当作${get.translation(links[0][3] || "")}【${get.translation(links[0][2])}】使用`
						return `###${prompt}<br>`;
					},
				},
				hiddenCard(player, name) {
					if (_status.currentPhase != player) return false;
					if (!player.countCards("h", card => card.hasGaintag("visible_Foolniworuyi_yzs_hujia"))) {
						return false;
					}
					return lib.inpile.includes(name);
				},
				ai: {
					save: true,
					respondSha: true,
					respondShan: true,
					skillTagFilter(player, tag, arg) {
						if (!player.countCards("h", card => card.hasGaintag("visible_Foolniworuyi_yzs_hujia")) || player.isTempBanned("Foolniworuyi_yzs")) {
							return false;
						}
						return true;
					},
					order: 4,
					result: {
						player(player) {
							return 2
						},
					},
					threaten: 1.9,
				},
			},
			renew: {
				trigger: {
					global: "phaseAfter",
				},
				filter(event, player) {
					//	if (event.skill) return false;
					return player.countMark("Foolniworuyi_yzs_used");
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.clearMark("Foolniworuyi_yzs_used", false);
				}
			},
			hujia: {
				enable: "phaseUse",
				filter(event, player) {
					return player.countMark("Foolshuangsheng_yzs") >= 6;
				},
				async content(event, trigger, player) {
					player.removeMark("Foolshuangsheng_yzs", 6, false)
					if (lib.config.background_audio) {
						game.playAudio("effect", "recover");
					}
					game.broadcast(function () {
						if (lib.config.background_audio) {
							game.playAudio("effect", "recover");
						}
					});
					player.setMark("Foolshuangsheng_yzs_shengling", 2, false)
					player.storage.twins.life.dead = false;
					player.storage.twins.death.dead = false;
					player.markSkill("twins");
					await player.draw().gaintag.add("visible_Foolniworuyi_yzs_hujia");

				},
				mod: {
					cardname(card, player, name) {
						if (card.hasGaintag("visible_Foolniworuyi_yzs_hujia")) return "shan"
					},
				},
				ai: {
					order: 4,
					result: {
						player(player) {
							let v = 0;
							if (player.storage.twins.life.dead) v++;
							if (player.storage.twins.death.dead) v++;
							v += 2 - player.countMark("Foolshuangsheng_yzs_shengling");
							return v - 2;
						}
					}
				}
			}
		},
		prompt2: "消耗三点sp，切换当前人物，并将手牌补充至4。每回合限一次",
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("Foolniworuyi_yzs");
		},
		clickableFilter: function (player) {
			return player.countMark("Foolshuangsheng_yzs") > 2 && !player.countMark("Foolniworuyi_yzs_used");
		},
		clickableContent: async function (event, trigger, player) {
			let result = await player.chooseBool(`是否发动【你我如一】?<br>消耗三点sp，切换当前人物，并将手牌补充至4。每回合限一次`)
				.forResult();
			if (!result.bool) return;
			await player.useSkill("Foolniworuyi_yzs")
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return player.countMark("Foolshuangsheng_yzs") > 2 && !player.countMark("Foolniworuyi_yzs_used");
		},
		async content(event, trigger, player) {
			player.removeMark("Foolshuangsheng_yzs", 3, false)
			player.addMark("Foolniworuyi_yzs_used", 1, false)
			await player.turnOver();
			if (player.countCards("h") < 4) await player.draw(4 - player.countCards("h"))
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 2,
			result: {
				player(player) {
					return 4 - player.countCards("h");
				}
			}
		}
	},
	//贪欲
	InvisibleHand_yzs: {
		change(num) {
			if (typeof num != "number") return;
			if (typeof _status.LilyPrice != "number") _status.LilyPrice = 2;
			let price = _status.LilyPrice;
			if (price + num > 5) num = 5 - price;
			if (price + num < 0) num = -price;
			price += num;
			game.broadcastAll((price, change) => {
				_status.LilyPrice = price;
				_status.LilyPrice_change = change;
			}, price, num)
			for (let player of game.filterPlayer()) {
				player.markSkill("InvisibleHand_yzs")
			}
		},
		group: ["InvisibleHand_yzs_start", "InvisibleHand_yzs_discard", "InvisibleHand_yzs_use"],
		subSkill: {
			start: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				popup: false,
				forced: true,
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					lib.skill.InvisibleHand_yzs.change(0);
				}
			},
			discard: {
				trigger: {
					player: "loseAfter",
					global: "loseAsyncAfter",
				},
				filter(event, player) {
					return true;
				},
				async cost(event, trigger, player) {
					if (!trigger.cards || !trigger.cards.length) return false;
					if (trigger.type != "discard" || trigger.player.isDead()) return false;
					if ((trigger.discarder && trigger.discarder != player) || trigger.getParent(2).player != trigger.player) return false;
					if (!trigger.getl(trigger.player).hs.length) return false;
					let cards = trigger.cards.filter(card => trigger.getl(trigger.player).hs.includes(card));
					let change = 0;
					for (let card of cards) {
						if (get.color(card, player) == "red") change++;
						else if (get.color(card, player) == "black") change--;
					}
					event.result = {
						bool: change != 0,
						cost_data: change,
					}
				},
				async content(event, trigger, player) {
					lib.skill.InvisibleHand_yzs.change(event.cost_data);
				},
			},
			use: {
				forced: true,
				trigger: {
					player: "useCard2",
				},
				filter(event, player) {
					if (!event.card) return false;
					if (!["red", "black"].includes(get.color(event.card, player))) return false;
					if (!event.getParent()) return false;
					return event.getParent().name == "chooseToUse";
				},
				async content(event, trigger, player) {
					let change = 0;
					if (get.color(trigger.card, player) == "red") {
						change = 1;
					} else if (get.color(trigger.card, player) == "black") {
						change = -1;
					}
					lib.skill.InvisibleHand_yzs.change(change);
				},
			},
		},
		mark: true,
		marktext: "市",
		intro: {
			markcount(storage) {
				let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2
				return price
			},
			mark(dialog, content, player) {
				let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2
				let str = `当前市价为：${price} `
				if (_status.LilyPrice_change) {
					if (_status.LilyPrice_change > 0) {
						str += `<font color="#f93838">+${_status.LilyPrice_change}</font>`;
					} else if (_status.LilyPrice_change < 0) {
						str += `<font color="#bef750">-${-_status.LilyPrice_change}</font>`;
					}
				}
				dialog.addText(str);
			},
		},
		nobracket: true,
		locked: true,
		trigger: {
			player: "phaseDrawBegin"
		},
		prompt2: `摸牌阶段，你可改为摸5张牌并弃4张手牌`,
		check(event, player) {
			return player.countCards("h") > 2;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.draw(5);
			await player.chooseToDiscard(4, true)
				.set("ReminderNotice_yzs", true);
		}
	},
	FreeMarket_yzs: {
		BuyIn(player, isTemp) {
			if (lib.skill.FreeMarket_yzs.getGoods(player).length >= 3) return;
			let id = Math.random().toString(36).slice(-8);
			player.markAuto("FreeMarket_yzs", id)
			if (isTemp) {
				player.addTempSkill("FreeMarket_yzs_temp")
				player.markAuto("FreeMarket_yzs_temp", id)
			}
		},
		getGoods(player) {
			if (!player.storage.FreeMarket_yzs) player.storage.FreeMarket_yzs = [];
			return player.storage.FreeMarket_yzs;
		},
		getAvailableGoods(player) {
			if (!player.storage.FreeMarket_yzs) player.storage.FreeMarket_yzs = [];
			let goods = player.storage.FreeMarket_yzs.filter(i => !player.storage.FreeMarket_yzs.FreeMarket_yzs_temp || !player.storage.FreeMarket_yzs.FreeMarket_yzs_temp.includes(i));
			return goods;
		},
		async sell(player, event) {
			let goods = lib.skill.FreeMarket_yzs.getAvailableGoods(player);
			if (!goods) return false;
			let sell = goods.randomGet();
			player.storage.FreeMarket_yzs.remove(sell);
			if (player.storage.FreeMarket_yzs.length) player.markSkill("FreeMarket_yzs");
			else player.unmarkSkill("FreeMarket_yzs");
			return true;
		},
		marktext: `<font color="#f9be4d">货</font>`,
		intro: {
			markcount: "storage",
			mark(dialog, content, player) {
				let num = lib.skill.FreeMarket_yzs.getGoods(player).length
				dialog.addText(`当前有${num}/3枚【货】`);
			},
		},
		init(player, skill) {
			game.addGlobalSkill("FreeMarket_yzs_sell", player)
		},
		group: ["FreeMarket_yzs_buy"],
		subSkill: {
			temp: {
				charlotte: true,
				onremove: true,
				"skill_id": "FreeMarket_yzs_temp",
				sub: true,
				sourceSkill: "FreeMarket_yzs",
				"_priority": 0,
			},
			buy: {
				name: "买入",
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					if (player.countCards("h") < price) return false;
					if (player.storage.FreeMarket_yzs?.length && player.storage.FreeMarket_yzs.length >= 3) return false;
					return true;
				},
				prompt(event, player) {
					let num = player.storage.FreeMarket_yzs ? player.storage.FreeMarket_yzs.length : 0;
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					return `出牌阶段限1次：你弃<font color="#f9be4d">${price}</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，上限为3<br>当前有${num}枚`
				},
				filterCard(card) {
					return true
				},
				position: "h",
				selectCard() {
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					return price
				},
				discard: false,
				lose: false,
				delay: false,
				async content(event, trigger, player) {
					await player.modedDiscard(event.cards);
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, "effect/coin_cost.mp3");
					lib.skill.FreeMarket_yzs.BuyIn(player);
				},
				ai: {
					order(item, player) {
						let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
						if (price == 0) return 114;
						return get.order({ name: "sha" }) - 0.1;
					},
					result: {
						player(player) {
							let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
							return 2 - price;
						},
					},
				},
			},
			sell: {
				name: "售出",
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (_status.FinancialWaltz_yzs) return false;
					if (!lib.skill.FreeMarket_yzs.getAvailableGoods(player).length) return false;
					return true;
				},
				prompt(event, player) {
					let num = player.storage.FreeMarket_yzs ? player.storage.FreeMarket_yzs.length : 0;
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					let unable = num - lib.skill.FreeMarket_yzs.getAvailableGoods(player).length;
					if (!player.hasSkill("FreeMarket_yzs")) price -= 2;
					if (price < 0) price = 0;
					let str = `售出自己的1枚【货】并摸<font color="#f9be4d">${price}</font>张牌<br>当前有${num}枚【货】`;
					if (unable) {
						str += `<br>当前有${unable}枚【货】本回合不可售出`
					}
					return str
				},
				filterTarget(card, player, target) {
					return target == player;
				},
				async content(event, trigger, player) {
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					if (!player.hasSkill("FreeMarket_yzs")) price -= 2;
					let bool = await lib.skill.FreeMarket_yzs.sell(player, event)
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, "effect/coin.mp3");
					if (bool && price > 0) await player.draw(price)
					await event.trigger("yzsSell")
				},
				ai: {
					order(item, player) {
						let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
						if (price == 5) return 114;
						return get.order({ name: "sha" }) + 0.1;
					},
					result: {
						player(player) {
							let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
							if (!player.hasSkill("FreeMarket_yzs")) price -= 2;
							return price - 1;
						},
					},
				},
			}
		},
		nobracket: true,
		locked: true,
		priority: 4,
		trigger: {
			player: "damageBegin4"
		},
		filter(event, player) {
			if (!event.source) return false;
			if (lib.skill.FreeMarket_yzs.getGoods(event.source).length >= 3) return false;
			if (!lib.skill.FreeMarket_yzs.getGoods(player).length) return false;
			return true;
		},
		prompt2(event, player) {
			let price = Math.max((typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2) - 2, 0);
			return `无效 你 受到的` + event.num + `点伤害，然后给予 ${get.translation(event.source)} 1枚<font color="#f9be4d">【货】</font>，然后其弃<font color="#f9be4d">${price}</font>张手牌。（其依此法获得的<font color="#f9be4d">【货】</font>其本回合内不可主动售出）`;
		},
		async content(event, trigger, player) {
			let goods = lib.skill.FreeMarket_yzs.getGoods(player);
			if (!goods.length) return;
			let sell = goods.randomGet();
			player.storage.FreeMarket_yzs.remove(sell);
			if (player.storage.FreeMarket_yzs.length) player.markSkill("FreeMarket_yzs");
			else player.unmarkSkill("FreeMarket_yzs");
			trigger.cancel();
			if (trigger.source) lib.skill.FreeMarket_yzs.BuyIn(trigger.source, true);
			let price = (typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2) - 2;
			if (price > 0) {
				await trigger.source.chooseToDiscard(price, true)
					.set("ReminderNotice_yzs", true);
			}
		},
	},
	AnchoringEffect_yzs: {
		group: ["AnchoringEffect_yzs_skip"],
		subSkill: {
			skip: {
				priority: 4,
				trigger: {
					player: "phaseDiscardBefore",
				},
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					trigger.cancel();
				},
				"skill_id": "AnchoringEffect_yzs_skip",
				sub: true,
				sourceSkill: "AnchoringEffect_yzs",
				"_priority": 300,
			},
		},
		nobracket: true,
		locked: true,
		forced: true,
		trigger: {
			global: ["yzsSell"],
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.draw(3);
			await player.chooseToDiscard(3, true)
				.set("ReminderNotice_yzs", true);
		}
	},
	ReminderNotice_yzs: {
		nobracket: true,
		locked: true,
		marktext: `<font color="#f93838">赤</font>`,
		intro: {
			content: "当前有#/6点【赤字】",
		},
		subSkill: {
			draw: {
				name: "赤字",
				popup: false,
				forced: true,
				priority: 2,
				trigger: {
					player: "drawBegin"
				},
				filter(event, player) {
					let evt = event.getParent();
					if (evt?.skill && player.hasSkill(evt.skill)) return false;
					return event.num > 0 && player.countMark("ReminderNotice_yzs");
				},
				async content(event, trigger, player) {
					let num = Math.min(trigger.num, player.countMark("ReminderNotice_yzs"));
					player.removeMark("ReminderNotice_yzs", num, false);
					game.log(player, `减少了${num}点【赤字】`)
					trigger.num -= num;
				}
			},
		},
		trigger: {
			global: "chooseToDiscardAfter",
		},
		forced: true,
		filter(event, player) {
			if (event.player.countMark("ReminderNotice_yzs") >= 6) return false;
			if (!event.ReminderNotice_yzs) return false;
			let request = Array.isArray(event.selectCard) ? event.selectCard[0] : event.selectCard
			let num = 0;
			if (event.result?.cards?.length) num = event.result.cards.length;
			return num < request;
		},
		async content(event, trigger, player) {
			let request = Array.isArray(trigger.selectCard) ? trigger.selectCard[0] : trigger.selectCard
			let num = 0;
			if (trigger.result?.cards?.length) num = trigger.result.cards.length;
			num = request - num;
			if (num > 0) {
				trigger.player.addSkill("ReminderNotice_yzs_draw")
				let add = Math.min(num, 6 - trigger.player.countMark("ReminderNotice_yzs"))
				trigger.player.addMark("ReminderNotice_yzs", add, false);
				game.log(player, `增加了${add}点【赤字】`)
			}
		}
	},
	PonziScheme_yzs: {
		group: ["PonziScheme_yzs_cai"],
		subSkill: {
			cai: {
				priority: -2,
				forced: true,
				trigger: {
					global: "phaseBegin"
				},
				filter(event, player) {
					if (!event.player.countMark("PonziScheme_yzs")) return false;
					return player.storage.PonziScheme_yzs_mark?.includes(event.player);
				},
				async content(event, trigger, player) {
					player.storage.PonziScheme_yzs_mark.remove(trigger.player);
					player.markSkill("PonziScheme_yzs_mark");
					trigger.player.removeMark("PonziScheme_yzs");
					if (!lib.skill.FreeMarket_yzs.getGoods(player).length) {
						let result = game.hasPlayer(target => {
							if (target.hasSkill("hidden_yzs")) return false;
							if (target.storage.isSub) return false;
							return target != player;
						}) ? await player.chooseTarget(true)
							.set("filterTarget", (card, player, target) => {
								//	if (target.countMark("PonziScheme_yzs")) return false;
								if (target.hasSkill("hidden_yzs")) return false;
								if (target.storage.isSub) return false;
								return target != player;
							})
							.set("ai", target => {
								const player = get.player();
								let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
								return (2 - price) * get.attitude(player, target);
							})
							.forResult() : { bool: false }
						if (result.bool) {
							let next = player.useSkill("PonziScheme_yzs");
							next.targets = result.targets;
							await next;
						}
					}
					if (lib.skill.FreeMarket_yzs.getGoods(player).length) {
						let goods = lib.skill.FreeMarket_yzs.getGoods(player);
						if (!goods.length) return;
						let sell = goods.randomGet();
						player.storage.FreeMarket_yzs.remove(sell);
						if (player.storage.FreeMarket_yzs.length) player.markSkill("FreeMarket_yzs");
						else player.unmarkSkill("FreeMarket_yzs");
						if (trigger.player) lib.skill.FreeMarket_yzs.BuyIn(trigger.player);
					}
				}
			}
		},
		nobracket: true,
		locked: true,
		marktext: `<font color="#bef750">菜</font>`,
		intro: {
			content: "当前有#/1枚【菜】",
		},
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			if (player.storage.FreeMarket_yzs?.length && player.storage.FreeMarket_yzs.length >= 3) return false;
			let cais = 0;
			for (let cur of game.filterPlayer()) {
				cais += cur.countMark("PonziScheme_yzs")
			}
			if (cais >= 2) return false;
			return true;
		},
		selectTarget: 1,
		filterTarget(card, player, target) {
			//	if (target.countMark("PonziScheme_yzs")) return false;
			if (target.hasSkill("hidden_yzs")) return false;
			if (target.storage.isSub) return false;
			return target != player;
		},
		async content(event, trigger, player) {
			let price = (typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2) - 2;
			if (price > 0) {
				await event.target.chooseToDiscard(price, true)
					.set("ReminderNotice_yzs", true);
			}
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/coin_cost.mp3");
			lib.skill.FreeMarket_yzs.BuyIn(player);
			if (!event.target.countMark("PonziScheme_yzs")) event.target.addMark("PonziScheme_yzs");
			player.markAuto("PonziScheme_yzs_mark", event.target)
		},
		ai: {
			order: 5,
			result: {
				player: 1,
				target(player, target) {
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					return 2 - price;
				}
			}
		}
	},
	FinancialWaltz_yzs: {
		nobracket: true,
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
			player.yzs_UseShunfaji("FinancialWaltz_yzs");
		},
		clickableFilter: function (player) {
			if (_status.FinancialWaltz_yzs) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let ask = await player.chooseBool(`是否发动【金融华尔兹】?`)
				.forResult();
			if (!ask.bool) return;
			let next = player.useSkill("FinancialWaltz_yzs")
			await next;
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (_status.FinancialWaltz_yzs) return false;
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return true
		},
		async content(event, trigger, player) {
			player.awakenSkill("FinancialWaltz_yzs");
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
			game.broadcastAll(function (current) {
				_status.tempMusic = `ext:一中杀/audio/今宵は飄逸なエゴイスト.mp3`;
				game.playBackgroundMusic();

				var background = document.createElement("img");
				background.className = "background";
				window._currentDynamicBackground = background;
				Object.assign(background, {
					src: lib.assetURL + "/extension/一中杀/image/background/FinancialWaltz_yzs.png",
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
			game.log("金融风暴开始了")
			game.broadcastAll((player) => {
				_status.FinancialWaltz_yzs = player;
			}, player)
			game.addGlobalSkill("FinancialWaltz_yzs_effect", player)
			game.addGlobalSkill("FinancialWaltz_yzs_effect_buy", player)
			game.addGlobalSkill("FinancialWaltz_yzs_effect_sell", player)
			await player.loseHp();
			for (let target of game.filterPlayer(cur => !cur.storage.isSub)) {
				target.addSkill("InvisibleHand_yzs")
			}
			player.removeSkill("PonziScheme_yzs")
			for (let target of game.filterPlayer()) {
				target.removeMark("PonziScheme_yzs")
			}
		},
		mark: true,
		intro: {
			content: "limited",
		},
		ai: {
			order: 4,
			result: {
				player(player) {
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					return price - 3;
				}
			}
		}
	},
	FinancialWaltz_yzs_effect: {
		group: ["FinancialWaltz_yzs_effect_buy", "FinancialWaltz_yzs_effect_sell"],
		subSkill: {
			buy: {
				name: "买入",
				priority: 2,
				trigger: {
					player: "phaseBegin"
				},
				forced: true,
				filter(event, player) {
					if (!_status.FinancialWaltz_yzs) return false;
					return true;
				},
				async content(event, trigger, player) {
					let price = (typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2);
					if (price > 0) {
						await player.chooseToDiscard(price, true)
							.set("ReminderNotice_yzs", true);
					}
					lib.skill.FreeMarket_yzs.BuyIn(player);
					if (!player.countCards("h") && _status.FinancialWaltz_yzs?.isIn()) {
						let target = _status.FinancialWaltz_yzs
						let goods = lib.skill.FreeMarket_yzs.getGoods(player);
						if (!goods.length) return;
						let sell = goods.randomGet();
						player.storage.FreeMarket_yzs.remove(sell);
						game.broadcastAll(function (damageAudioInfo) {
							if (lib.config.background_audio) {
								game.playAudio(damageAudioInfo);
							}
						}, "effect/coin_cost.mp3");
						if (player.storage.FreeMarket_yzs.length) player.markSkill("FreeMarket_yzs");
						else player.unmarkSkill("FreeMarket_yzs");
						if (target.isIn()) lib.skill.FreeMarket_yzs.BuyIn(target);
					}
				}
			},
			sell: {
				name: "售出",
				priority: -2,
				forced: true,
				trigger: { player: "phaseBefore" },
				filter(event, player) {
					if (!_status.FinancialWaltz_yzs) return false;
					if (!lib.skill.FreeMarket_yzs.getAvailableGoods(player).length) return false;
					return true;
				},
				async content(event, trigger, player) {
					let price = typeof _status.LilyPrice == "number" ? _status.LilyPrice : 2;
					if (!player.hasSkill("FreeMarket_yzs")) price -= 2;
					let bool = await lib.skill.FreeMarket_yzs.sell(player, event)
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, "effect/coi.mp3");
					if (bool && price > 0) await player.draw(price)
					await event.trigger("yzsSell")
				}
			}
		},
		charlotte: true,
		forced: true,
		priority: 22,
		trigger: {
			player: "phaseZhunbeiBegin"
		},
		filter(event, player) {
			if (!_status.FinancialWaltz_yzs) return false;
			return player.countMark("ReminderNotice_yzs") >= 6;
		},
		async content(event, trigger, player) {
			game.log("金融风暴结束了")
			game.removeGlobalSkill("FinancialWaltz_yzs_effect", _status.FinancialWaltz_yzs)
			game.removeGlobalSkill("FinancialWaltz_yzs_effect_buy", _status.FinancialWaltz_yzs)
			game.removeGlobalSkill("FinancialWaltz_yzs_effect_sell", _status.FinancialWaltz_yzs)
			game.broadcastAll(() => {
				delete _status.FinancialWaltz_yzs;
			})
			let max = 0;
			let players = [];
			for (let target of game.filterPlayer()) {
				if (!target.countMark("ReminderNotice_yzs")) continue;
				if (target.countMark("ReminderNotice_yzs") > max) {
					players.length = 0;
					players = [target];
				} else if (target.countMark("ReminderNotice_yzs") == max) {
					players.push(target);
				}
			}
			let targets = game.filterPlayer(cur => cur.countMark("ReminderNotice_yzs")).sortBySeat()
			for (let target of targets) {
				let num = players.includes(target) ? 2 : 1;
				await target.loseHp(num);
			}
		},
	},
	//SCP-939
	qiehou_yzs: {
		group: ["qiehou_yzs_show"],
		subSkill: {
			paoxiao: {
				name: "咆哮",
				priority: 96,
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
			show: {
				locked: true,
				popup: false,
				forced: true,
				priority: -939,
				trigger: {
					player: "showCharacterAfter",
				},
				hiddenSkill: true,
				filter(event, player) {
					var target = _status.currentPhase;
					return event.toShow.includes('SCP939_yzs') && target && target !== player
				},
				async content(event, trigger, player) {
					let next = player.useSkill("qiehou_yzs");
					next.targets = [_status.currentPhase];
					await next;
				},
			},
		},
		preHidden: true,
		hiddenSkill: true,
		trigger: {
			source: "dieAfter",
		},
		logTarget: "player",
		forced: true,
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "锁定技", "转换技", "蓄力技", "蓄能技", "连招技"],
		async content(event, trigger, player) {
			if (!event.target) event.target = trigger.player;
			const skills = event.target.getSkills(null, false, false).filter(skill => {
				let info = get.info(skill);
				if (!info || info.charlotte || get.skillInfoTranslation(skill, player).length == 0) {
					return false;
				}
				const categories = get.skillCategoriesOf(skill, player);
				return !categories.some(type => lib.skill.qiehou_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
			});
			if (!skills.length && player.hasSkill("qiehou_yzs_paoxiao")) return;
			var result2 = skills.length ? await player
				.chooseButton(["窃喉：复制其中一个技能，否则获得【咆哮】", [skills, "skill"]])
				.set("displayIndex", false)
				.set("ai", button => Math.random())
				.set("listx", skills)
				.forResult() : { bool: false };
			if (result2?.bool && result2?.links?.length) {
				await player.addSkills(result2.links)
			} else {
				await player.addSkills("qiehou_yzs_paoxiao")
			}
		},
	},
	xunsheng_yzs: {
		priority: -2,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			if (!player.inRange(event.player)) return false;
			return event.player.hasHistory("sourceDamage")
		},
		frequent: true,
		async content(event, trigger, player) {
			let damage = 0;
			trigger.player.getHistory("sourceDamage", evt => {
				damage += evt.num;
			});
			let i = 0;
			while (i < damage) {
				const result = await player
					.chooseToUse(
						`循声：对 ${get.translation(trigger.player)} 使用1张牌(${i}/${damage})`,
						function (card) {
							return lib.filter.filterCard.apply(this, arguments);
						},
						function (card, player, target) {
							if (target != get.event().targetx) return false;
							return lib.filter.filterTarget.apply(this, arguments);
						}
					)
					.set("targetx", trigger.player)
					.set("addCount", false)
					.forResult();
				if (!result?.bool) {
					break;
				}
				i++;
			}
			await player.draw(i);
		},
	},
	qianfu_yzs: {
		priority: -9,
		trigger: {
			player: "phaseJieshuBegin"
		},
		check(event, player) {
			return player.hp <= 2 && player.countCards("h") <= 3;
		},
		async content(event, trigger, player) {
			await player.turnOver();
			await player.draw(3);
			await player.recover();
		},
		mod: {
			attackRange(player, num) {
				if (player.isTurnedOver()) return num + 1;
			},
		},
	},
	//天气预报
	WeatherReport_yzs: {
		group: ["WeatherReport_yzs_remove"],
		subSkill: {
			remove: {
				forceOut: true,
				priority: 66,
				forceDie: true,
				popup: false,
				forced: true,
				trigger: {
					global: ["yzs_cancelStormBegin", "yzs_SummonStormBegin", "yzs_changeStormBegin"],
				},
				async content(event, trigger, player) {
					delete _status.WeatherReport_yzs_effect
					game.removeGlobalSkill("WeatherReport_yzs_effect")
				}
			},
			effect: {
				priority: -2,
				forced: true,
				filter(event, player) {
					if (!_status.WeatherReport_yzs_effect) return false;
					return player.hasUseTarget(_status.WeatherReport_yzs_effect, true, false)
				},
				async content(event, trigger, player) {
					await player.chooseUseTarget(_status.WeatherReport_yzs_effect, true, false)
				}
			}
		},
		nobracket: true,
		locked: true,
		priority: -2,
		popup: false,
		log: false,
		trigger: {
			global: ["phaseZhunbeiBegin", "phaseJieshuBegin"],
			player: "phaseUseBegin"
		},
		filter(event, player) {
			const names = ["phaseZhunbei", "phaseUse", "phaseJieshu"];
			if (event.name != names[player.countMark("WeatherReport_yzs")]) return false;
			return true;
		},
		frequent: true,
		async content(event, trigger, player) {
			let str = player.countMark("StormRain_yzs") ? `天气预报：你可使用1张即时牌，然后召引任意 ${get.poptip("storm_yzs")}，此风暴持续效果增加“当前回合角色于此时机视为使用此牌`
				: `天气预报：你可使用1张单目标即时锦囊牌，然后召引任意 ${get.poptip("storm_yzs")}，此风暴持续效果增加“当前回合角色于此时机视为使用此牌”`
			let filterCard = player.countMark("StormRain_yzs") ? function (card) {
				const info = get.info({ name: card.name });
				return (
					info &&
					(info.type === "basic" || info.type === "trick")
				) && lib.filter.filterCard.apply(this, arguments);
			} : function (card) {
				const info = get.info({ name: card.name });
				return (
					info &&
					info.type === "trick" &&
					!info.notarget &&
					(info.toself || info.singleCard || !info.selectTarget || info.selectTarget === 1)
				) && lib.filter.filterCard.apply(this, arguments);
			}
			let result = await player
				.chooseToUse(
					str,
					filterCard,
				)
				.set("logSkill", event.name)
				.set("addCount", false)
				.forResult();
			if (!result.bool) return;
			let card = result.card;
			if (!card || !card.name) return;
			player.setMark("WeatherReport_yzs", (player.countMark("WeatherReport_yzs") + 1) % 3, false);
			let possible = player.getPossibleStorm();
			for (let i = 0; i < possible.length; i++) {
				possible[i] = [possible[i], get.translation(possible[i]) + "：" + get.translation(possible[i] + "_skill_info")]
			}
			possible.flat()
			if (!possible.length) return;
			result = await player.chooseButton([
				"选择要召引的风暴",
				[
					possible
					, "textbutton",
				],
			])
				.set("filterButton", (button, player) => {
					if (button.link == _status._yzsStorm) return false;
					return true
				})
				.set("selectButton", 1)
				.set("ai", button => {
					const player = get.player();
					let v = 0;
					if (button.link == "FireStorm") {
						v += 2 * (game.countPlayer(cur => cur.isLinked()) - 1)
						if (player.hasSha()) v += 1.5;
						let usable = player.getCardUsable("sha");
						if (usable > 0) v += 1.5;
					} else if (button.link == "ThunderStorm") {
						if (game.countPlayer(cur => cur.isLinked()) < 2) v += 1;
						let curs = game.filterPlayer(current => {
							if (get.attitude(player, current) >= 0) return false;
							if (current.hasSkillTag("noLink") || current.hasSkillTag("nodamage")) {
								return false;
							}
							return !current.hasSkillTag("nofire") || !current.hasSkillTag("nothunder");
						});
						if (curs.length < 2) {
							return 0;
						}
						v += curs.length * 1.2;
					} else if (button.link == "WaterStorm") {
						if (player.hp < player.maxHp / 2) v += 3;
						v += 2 * (game.countPlayer(cur => get.attitude(player, cur) > 0 && cur.hp < cur.maxHp / 2))
					} else if (button.link == "IceStorm") {
						v += 2;
						if (player.countCards("h") > 3) v += 2;
					} else if (button.link == "BulletStorm") {
						let usable = player.getCardUsable("sha");
						if (usable < 1) v += 1.5;
						if (player.hasSha()) v += 1.5;
						if (player.hp >= player.maxHp / 2) v += 2.2;
					} else if (button.link == "WindStorm") {
						if (player.countCards("h") < 3 && player.hp >= player.maxHp / 2) v += 2;
						v += 0.2 * player.countCards("h")
					} else return 114;
					return v > 4;
				})
				.set("forced", true)
				.forResult();
			if (result.bool && result.links?.length) {
				await player.yzs_SummonStorm(result.links[0]);
				lib.skill.WeatherReport_yzs_effect.trigger = {
					player: trigger.name + "Begin"
				};
				game.addGlobalSkill("WeatherReport_yzs_effect");
				_status.WeatherReport_yzs_effect = card;
			}
		}
	},
	StormRain_yzs: {
		group: ["StormRain_yzs_awake", "StormRain_yzs_record"],
		subSkill: {
			awake: {
				priority: 4,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseUseEnd"
				},
				filter(event, player) {
					return player.countMark("StormRain_yzs_awake") && !player.countMark("StormRain_yzs")
				},
				async content(event, trigger, player) {
					player.unmarkSkill("StormRain_yzs_record")
					await player.useSkill("StormRain_yzs_awaken");
				},
			},
			record: {
				marktext: "风",
				intro: {
					markcount: "storage",
					mark(dialog, content, player) {
						let storms = player.getAllStorm();
						const storage = player.getStorage("StormRain_yzs_record")
						dialog.addText(`需要召引的风暴：`);
						let str = ``;
						for (let i of storms) {
							if (storage.includes(i)) {
								str += `${get.translation(i)} `
							} else {
								str += `<span class="bluetext">${get.translation(i)}</span> `
							}
						}
						dialog.addText(str);
					},
				},
				priority: 3,
				popup: false,
				forced: true,
				trigger: {
					player: "dyingBegin",
					global: ["yzs_SummonStormBegin"],
				},
				filter(event, player) {
					if (player.countMark("StormRain_yzs_awake")) return false;
					if (event.name == "dying") {
						return true;
					} else {
						return event.player == player;
					}
				},
				async content(event, trigger, player) {
					if (trigger.name == "dying") {
						player.addMark("StormRain_yzs_awake", 1, false)
					} else {
						player.markAuto("StormRain_yzs_record", trigger.storm)
						if (player.storage.StormRain_yzs_record.length >= player.getAllStorm().length) {
							player.addMark("StormRain_yzs_awake", 1, false)
						}
					}
				},
			},
		},
		nobracket: true,
		priority: 3,
		locked: true,
		trigger: {
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (!player.countCards("h")) return false;
			if (event.player.isPhaseUsing()) return false;
			return true;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCardTarget()
				.set("prompt", `【狂风暴雨】：场上角色于其出牌阶段外对你使用牌时，你可弃置1张基本牌以取消其中一个目标`)
				.set("prompt2", `弃置1张基本牌，然后为${get.translation(trigger.card)}减少一个目标`)
				.set("filterCard", (card, player2) => lib.filter.canBeDiscarded(card, player2, player2) && get.type(card, player2) == "basic")
				.set("filterTarget", (_, player, target) => {
					const { card, targets } = get.event();
					if (targets.includes(target)) {
						return true;
					}
					return false;
				})
				.set("position", "h")
				.set("card", trigger.card)
				.set("targets", trigger.targets)
				.set("ai", target => {
					const { card, targets } = get.event();
					const player = get.player();
					return get.effect(target, card, player, player) * (targets.includes(target) ? -1 : 1);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			let target = event.targets[0];
			if (trigger.targets.includes(target)) {
				trigger.targets.remove(target);
				game.log(target, "从", trigger.card, "的目标中移除");
			}
		},
	},
	StormRain_yzs_awaken: {
		nobracket: true,
		locked: true,
		popup: false,
		unique: true,
		juexingji: true,
		skillAnimation: "epic",
		animationColor: "thunder",
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.addMark("StormRain_yzs", 1, false);
		},
		sub: true,
		sourceSkill: "StormRain_yzs",
		"_priority": 0,
		"skill_id": "StormRain_yzs_awaken",
	},
	//灵乌路空
	NuclearHeat_yzs: {
		locked: true,
		forced: true,
		priority: -2,
		trigger: {
			global: ["damageEnd", "damageZero"]
		},
		filter(event, player) {
			if (!event.nature || event.nature !== 'fire') return false;
			if (!event.player.countCards("h")) return true;
			if (event.source && event.source == player && event.player.countCards("h") < 3) return true;
			if (event.player == player && event.num > 0) return true;
			return false;
		},
		async content(event, trigger, player) {
			if (!trigger.player.countCards("h")) {
				var stat = player.getStat().skill;
				delete stat.Tokamak_yzs;
			}
			if (trigger.source && trigger.source == player && trigger.player.countCards("h") < 3) {
				await trigger.player.draw(3 - trigger.player.countCards("h"))
			}
			if (trigger.player == player && trigger.num > 0) {
				await player.recover(trigger.num)
			}
		},
		ai: {
			nofire: true,
		}
	},
	Tokamak_yzs: {
		group: ["Tokamak_yzs_add"],
		subSkill: {
			add: {
				name: `「地狱的托卡马克装置」`,
				forced: true,
				priority: 2,
				trigger: {
					global: ["showCardsAfter", "chooseToDiscardAfter"]
				},
				filter(event, player) {
					let evt = event.getParent();
					if (evt && evt?.name == "huogong" && evt?.player == player) {
						let cards = event.name == "chooseToDiscard" ? event.result.cards : event.cards;
						return cards?.length;
					}
					return false;
				},
				async content(event, trigger, player) {
					event.cards = trigger.name == "chooseToDiscard" ? trigger.result.cards : trigger.cards;
					if (!event.cards || !event.cards.length) return;
					let next = player.addToExpansion(event.cards, player, "giveAuto", false)
					next.gaintag.add("Tokamak_yzs")
					await next
				}
			}
		},
		markimage: 'extension/一中杀/image/Tokamak_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("Tokamak_yzs");
				if (cards.length) dialog.addAuto(cards);
			},
		},
		nobracket: true,
		locked: true,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canUse({ name: "huogong", isCard: false }, target)
			}))
		},
		filterTarget: function (card, player, target) {
			return player.canUse({ name: "huogong", isCard: false }, target)
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			let next = player.useCard({ name: "huogong", isCard: false }, event.target);
			next.baseDamage = 0;
			await next;
		},
		prompt: `出牌阶段限1次：你视为使用伤害为0的【火攻】`,
		ai: {
			order: 2,
			result: {
				target: -2,
			},
			threaten: 1.2,
			combo: "SubterraneanSun_yzs"
		}
	},
	SubterraneanSun_yzs: {
		//group:"SubterraneanSun_yzs_start",
		subSkill: {
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
					const cards = get.cards(10);
					let next = player.addToExpansion(cards, "gain2", player)
					next.gaintag.add("Tokamak_yzs");
					await next;
				}
			},

		},
		nobracket: true,
		limited: true,
		skillAnimation: true,
		animationColor: "fire",
		priority: -3,
		trigger: {
			player: "phaseJieshuBegin"
		},
		filter(event, player) {
			if (player.countExpansions("Tokamak_yzs") < 3) return false;
			return game.hasPlayer(cur => cur.countCards("he"))
		},
		async cost(event, trigger, player) {
			event.result = {
				bool: false,
			}
			let result = await player.chooseTarget("限定技：结束阶段，你可：依次将任意角色1张牌和3张【核】置入弃牌堆", "若这四张牌花色各不相同，你分配1点火焰伤害并重复此流程")
				.set("ai", target => {
					const player = get.player();
					if (player.hp > 2 || player.countExpansions("Tokamak_yzs") < 6) return 0;
					return -get.attitude(player, target) / 3 * get.damageEffect(target, player, player, "fire")
				})
				.set("filterTarget", (card, player, target) => {
					if (!target.countCards("he")) return false;
					if (target.hasSkill("hidden_yzs")) return false;
					return true;
				})
				.forResult()
			if (!result.bool) return;
			var next = await player.choosePlayerCard(result.targets[0], "he",
				1,
				"地底太阳：将" + get.translation(result.targets[0]) + "的1张牌置入弃牌堆",
			)
				.forResult();
			if (!next.bool) return;
			event.result = {
				bool: true,
				targets: result.targets,
				cost_data: next.cards,
			}
		},
		async content(event, trigger, player) {
			player.awakenSkill("SubterraneanSun_yzs")
			game.broadcastAll(function (current) {
				_status.tempMusic = `ext:一中杀/audio/灵知的太阳信仰 ～ Nuclear Fusion.mp3`;
				game.playBackgroundMusic();

				var background = document.createElement("img");
				background.className = "background";
				window._currentDynamicBackground = background;
				Object.assign(background, {
					src: lib.assetURL + "/extension/一中杀/image/background/SubterraneanSun_yzs.png",
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
			game.trySkillAudio("rw_bagua_skill");
			await event.targets[0].loseToDiscardpile(event.cost_data);
			let cardx = player.getExpansions("Tokamak_yzs")
			let result2 = await player.chooseButton(["你可：依次将任意角色1张牌和3张【核】置入弃牌堆", `${get.translation(get.suit(event.cost_data[0]))}若这四张牌花色各不相同，你分配1点火焰伤害并重复此流程`, cardx])
				.set("selectButton", 3)
				.set("ai", button => {
					const player = get.player();
					const card = get.event().card;
					if (get.suit(button) == card && player.countExpansions("Tokamak_yzs") > 3) return 0;
					if (player.countExpansions("Tokamak_yzs") < 4) return 4;
					if (!ui.selected.buttons.length) {
						return 4
					} else {
						let suits = [];
						for (let card of ui.selected.buttons) {
							if (!suits.includes(card.suit)) {
								suits.push(card.suit);
							}
						}
						if (suits.includes(button.link.suit)) return 0;
					}
				})
				.set("card", event.cost_data[0])
				.forResult()
			if (!result2.bool) return;
			await player.loseToDiscardpile(result2.links);
			let cards = event.cost_data.concat(result2.links);
			if (cards.length != 4) return;
			let suits = [];
			for (let card of cards) {
				if (!suits.includes(card.suit)) {
					suits.push(card.suit);
				} else return;
			}
			let target2 = await player.chooseTarget("地底太阳", "选择 1 名角色，对其造成1点火焰伤害", true)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return get.damageEffect(target2, player2, player2, "fire");
				})
				.forResult()
			if (!target2.bool) {
				return;
			}
			await target2.targets[0].damage("fire")
			while (true) {
				event.result = {
					bool: false,
				}
				let result = await player.chooseTarget("你可：依次将任意角色1张牌和3张【核】置入弃牌堆", "若这四张牌花色各不相同，你分配1点火焰伤害并重复此流程")
					.set("ai", target => {
						const player = get.player();
						return -get.attitude(player, target) / 3 * get.damageEffect(target, player, player, "fire")
					})
					.set("filterTarget", (card, player, target) => {
						if (!target.countCards("he")) return false;
						if (target.hasSkill("hidden_yzs")) return false;
						return true;
					})
					.forResult()
				if (!result.bool) return;
				var next = await player.choosePlayerCard(result.targets[0], "he",
					1,
					"地底太阳：将" + get.translation(result.targets[0]) + "的1张牌置入弃牌堆",
				)
					.forResult();
				if (!next.bool) return;
				event.result = {
					bool: true,
					targets: result.targets,
					cost_data: next.cards,
				}
				if (!event.result.bool) return;

				game.trySkillAudio("rw_bagua_skill");
				await event.result.targets[0].loseToDiscardpile(event.result.cost_data);
				let cardx = player.getExpansions("Tokamak_yzs")
				let result2 = await player.chooseButton(["将3张【核】置入弃牌堆", `${get.translation(get.suit(event.result.cost_data[0]))}若这四张牌花色各不相同，你分配1点火焰伤害并重复此流程`, cardx])
					.set("selectButton", 3)
					.set("ai", button => {
						const player = get.player();
						const card = get.event().card;
						if (get.suit(button) == card && player.countExpansions("Tokamak_yzs") > 3) return 0;
						if (!ui.selected.buttons.length) {
							return 4
						} else {
							let suits = [];
							for (let card of ui.selected.buttons) {
								if (!suits.includes(card.suit)) {
									suits.push(card.suit);
								}
							}
							if (suits.includes(button.link.suit)) return 0;
						}
					})
					.set("card", next.cards[0])
					.forResult()
				if (!result2.bool) return;
				await player.loseToDiscardpile(result2.links);
				let cards = event.result.cost_data.concat(result2.links);
				if (cards.length != 4) return;
				let suits = [];
				for (let card of cards) {
					if (!suits.includes(card.suit)) {
						suits.push(card.suit);
					} else return;
				}

				let target = await player.chooseTarget("地底太阳", "选择 1 名角色，对其造成1点火焰伤害", true)
					.set("filterTarget", (card, player, target) => {
						return !(target.hasSkill("hidden_yzs"));
					})
					.set("ai", (target2) => {
						const player2 = get.event().player;
						return get.damageEffect(target2, player2, player2, "fire");
					})
					.forResult()
				if (!target.bool) {
					return;
				}
				await target.targets[0].damage("fire")
			}
		},
		ai: {
			fireAttack: true,
			threaten: 3.2,
			combo: "Tokamak_yzs"
		}
	},
	//拉法尔
	guanxing_yzs: {
		group: ["guanxing_yzs_die"],
		subSkill: {
			die: {
				forceDie: true,
				audio: "ext:一中杀/audio/skill:2",
				priority: 2,
				trigger: {
					player: "dieBefore"
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseTarget(`你即将死亡时，可将本技能及你的记录给予1名其他角色`)
						.set("filterTarget", (card, player, target) => {
							return target != player;
						})
						.set("ai", target => {
							const player = get.player();
							return get.attitude(player, target);
						})
						.forResult()
				},
				async content(event, trigger, player) {
					game.broadcastAll((name) => {
						if (get.character(name).img) lib.card["guanxing_yzs"].image = get.character(name).img
						else {
							let type = "character";
							let src, noskin = false;
							let ext = ".jpg";
							let subfolder = "default";
							if (type) {
								let dbimage = null, extimage = null, modeimage = null, nameinfo, gzbool = false;
								const mode = get.mode();
								if (type === "character") {
									nameinfo = get.character(name);
									if (lib.characterPack[`mode_${mode}`] && lib.characterPack[`mode_${mode}`][name]) {
										if (mode === "guozhan") {
											if (name.startsWith("gz_shibing")) {
												name = name.slice(3, 11);
											} else {
												if (lib.config.mode_config.guozhan.guozhanSkin && nameinfo && nameinfo.hasSkinInGuozhan) {
													gzbool = true;
												}
												name = name.slice(3);
											}
										} else {
											modeimage = mode;
										}
									} else if (name.includes("::")) {
										name = name.split("::");
										modeimage = name[0];
										name = name[1];
									}
								}
								let imgPrefixUrl;
								if (!modeimage && nameinfo) {
									if (nameinfo.img) {
										imgPrefixUrl = nameinfo.img;
									} else if (nameinfo.trashBin) {
										for (const value of nameinfo.trashBin) {
											if (value.startsWith("img:")) {
												imgPrefixUrl = value.slice(4);
												break;
											} else if (value.startsWith("ext:")) {
												extimage = value;
												break;
											} else if (value.startsWith("db:")) {
												dbimage = value;
												break;
											} else if (value.startsWith("mode:")) {
												modeimage = value.slice(5);
												break;
											} else if (value.startsWith("character:")) {
												name = value.slice(10);
												break;
											}
										}
									}
								}
								if (type === "character" && lib.config.skin[name] && !noskin) {
									src = lib.config.skin[name][1];
								} else if (imgPrefixUrl) {
									src = imgPrefixUrl;
								} else if (extimage) {
									src = extimage.replace(/^ext:/, "extension/");
								} else if (dbimage) {
									this.setBackgroundDB(dbimage.slice(3)).then(lib.filter.none);
									return this;
								} else if (modeimage) {
									src = `image/mode/${modeimage}/character/${name}${ext}`;
								} else if (type === "character") {
									src = `image/character/${gzbool ? "gz_" : ""}${name}${ext}`;
								} else {
									src = `image/${type}/${subfolder}/${name}${ext}`;
								}
							} else {
								src = `image/${name}${ext}`;
							}
							lib.card["guanxing_yzs"].image = src
						}
						if (_status.tempMusic == `ext:一中杀/audio/怪獣2.mp3`) return false;
						_status.tempMusic = `ext:一中杀/audio/怪獣1.mp3`;
						game.playBackgroundMusic();
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					}, player.name);
					player.addMark("guanxing_yzs_awake", 1, false)
					let target = event.targets[0];
					let storage = player.getStorage("guanxing_yzs")
					player.storage.guanxing_yzs = [];
					player.markSkill("guanxing_yzs")
					player.removeSkill("guanxing_yzs")
					player.unmarkSkill("guanxing_yzs")
					let vcards = [game.createCard("guanxing_yzs", "", "")];
					player.$give(vcards, target);
					target.addSkill("guanxing_yzs")
					target.markAuto("guanxing_yzs", storage)
				}
			},
			awake: {
				name: `地球在运动`,
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				unique: true,
				skillAnimation: true,
				animationColor: "thunder",
				async content(event, trigger, player) {
					if (_status.guanxing_yzs_awake) return;
					_status.guanxing_yzs_awake = true;
					game.broadcastAll(() => {
						if (_status.tempMusic == `ext:一中杀/audio/怪獣2.mp3`) return false;
						_status.tempMusic = `ext:一中杀/audio/怪獣2.mp3`;
						game.playBackgroundMusic();
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					});
					player.addMark("guanxing_yzs_awake", 1, false)
				},
			},
		},
		marktext: "地",
		intro: {
			markcount: "storage",
			mark(dialog, content, player) {
				if (player.countMark("guanxing_yzs_awake")) {
					dialog.addText(`地动说已被证明`);
					return;
				} else {
					dialog.addText(`地动说尚未被证明`);
				}
				const storage = player.getStorage("guanxing_yzs").sort(function (a, b) {
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
		audio: "ext:一中杀/audio/skill:5",
		priority: -2,
		trigger: {
			global: "phaseBegin"
		},
		frequent: true,
		filter(event, player) {
			if ((!player.storage.guanxing_yzs || player.storage.guanxing_yzs.length < 13) && event.player != player) return false;
			return true;
		},
		async content(event, trigger, player) {
			const cards = get.cards(5);
			await game.cardsGotoOrdering(cards);
			let numbers = [];
			let map = {};
			while (cards.length > 0) {
				if (numbers.length >= 2 && !cards.some(card => numbers.includes(card.number))) break;
				let result = await player.chooseButtonTarget()
					.set("createDialog", ["记录并分配其中至多2种点数的牌，然后将剩余牌任意置顶或置底", cards])
					.set("selectButton", [1, Infinity])
					.set("filterButton", function (button) {
						if (!ui.selected.buttons.length) {
							return true
						} else {
							const numbers = get.event().numbers.slice(0);
							for (let card of ui.selected.buttons) {
								if (!numbers.includes(card.number)) {
									numbers.push(card.number);
								}
							}
							if (numbers.length >= 2) return numbers.includes(button.number)
							return true;
						}
					})
					.set("numbers", numbers)
					.set("complexSelect", true)
					.set("filterTarget", (card, player, target) => {
						if (target.hasSkill("hidden_yzs")) return false;
						return true;
					})
					.set("ai1", button => {
						const player = get.player();
						let v = get.value(button);
						if (!player.storage.guanxing_yzs || !player.storage.guanxing_yzs.includes(get.number(button))) v += 3;
						return v;
					})
					.set("ai2", target => {
						const player = get.player();
						return get.attitude(player, target)
					})
					.forResult();
				if (!result.bool) break;
				if (result.links?.length) {
					cards.removeArray(result.links);
					for (let card of result.links) {
						if (!numbers.includes(card.number)) {
							numbers.push(card.number);
						}
					}
					if (!map[result.targets[0].playerid]) map[result.targets[0].playerid] = [];
					map[result.targets[0].playerid].addArray(result.links);
				}
			}
			player.markAuto("guanxing_yzs", numbers);
			if (player.storage.guanxing_yzs.length >= 13 && player.hasSkill("guanxing_yzs") && !player.countMark("guanxing_yzs_awake")) {
				await player.useSkill("guanxing_yzs_awake")
			}
			if (Object.keys(map).length) {
				for (const target of game.filterPlayer()) {
					if (map[target.playerid]) {
						await target.gain(map[target.playerid], "draw");
					}
				}
			}
			if (cards.length) {
				const result = await player.chooseToMove("观星：点击或拖动将牌置于牌堆顶或牌堆底", true)
					.set("list", [["牌堆顶", cards], ["牌堆底"]])
					.set("processAI", function (list) {
						const cards = list[0][1].slice(0).sort(function (a, b) {
							return get.value(b) - get.value(a);
						});
						return [cards, []];
					})
					.forResult();
				if (result?.bool) {
					const top = result.moved[0],
						bottom = result.moved[1];
					top.reverse();
					for (var i = 0; i < top.length; i++) {
						ui.cardPile.insertBefore(top[i], ui.cardPile.firstChild);
					}
					for (i = 0; i < bottom.length; i++) {
						ui.cardPile.appendChild(bottom[i]);
					}
					game.updateRoundNumber();
					await game.delayx();
				}
			}
		},
		ai: {
			threaten: 1.2,
			guanxing: true,
		},
	},
	chushi_yzs: {
		group: ["chushi_yzs_dying"],
		subSkill: {
			dying: {
				audio: "chushi_yzs",
				priority: 1,
				trigger: {
					player: "dying"
				},
				filter(event, player) {
					return player.hasSkill("guanxing_yzs")
				},
				prompt2: `你濒死时可失去${get.poptip("guanxing_yzs")}，然后恢复全部体力并令${get.poptip("cesuan_yzs")}次数上限+1。`,
				check(event, player) {
					return !player.countCards("h", { name: "tao" }) && !player.countCards("h", { name: "jiu" })
				},
				async content(event, trigger, player) {
					player.removeSkill("guanxing_yzs");
					await player.recoverTo(player.maxHp);
					player.addMark("cesuan_yzs", 1, false)
				}
			}
		},
		locked: true,
		priority: -3,
		trigger: {
			target: "useCardToTarget",
		},
		forced: true,
		audio: "ext:一中杀/audio/skill:2",
		preHidden: true,
		filter(event, player) {
			if (event.player == player) return false;
			if (!get.tag(event.card, "damage")) return false;
			return event.player && !player.isMaxCard() && !player.isMinCard();
		},
		async content(event, trigger, player) {
			trigger.getParent().excluded.add(player);
			let result = await trigger.player
				.chooseButton([`令 ${get.translation(player)} 摸或弃1张牌`, [["摸牌", "弃牌"], "tdnodes"]], true)
				.set("filterButton", button => {
					const target = get.event().target;
					if (button.link == "弃牌") return target.countCards("he");
					return true;
				})
				.set("target", player)
				.set("ai", button => {
					const player = get.event().player;
					const target = get.event().target;
					if (button.link == "摸牌") return get.attitude(player, target) > 0;
					return get.attitude(player, target) <= 0
				})
				.forResult();
			if (!result.bool) return;
			if (result.links?.length) {
				if (result.links[0] == "摸牌") {
					await player.draw();
				} else {
					await player.chooseToDiscard("he", true)
				}
			}
		},
		ai: {
			threaten: 1.1
		}
	},
	cesuan_yzs: {
		enable: 'phaseUse',
		usable(skill, player) {
			return player.countMark("cesuan_yzs") + 1;
		},
		filter(event, player) {
			return player.countCards("he") >= 2;
		},
		selectCard: 2,
		filterCard: true,
		position: "he",
		async content(event, trigger, player) {
			await player.useSkill("guanxing_yzs");
			const cards = await game.cardsGotoOrdering(get.bottomCards()).cards,
				number = cards.length ? get.number(cards[0]) : 0;
			await player.showCards(cards, `${get.translation(player)}发动了【测算】`, true);
			if (event.cards.length != 2) return;
			let sum = event.cards[0].number + event.cards[1].number;
			let sub = [event.cards[0].number - event.cards[1].number, event.cards[1].number - event.cards[0].number]
			let ai = function (target) { };
			let prompt = ``;
			if (number == sum) {
				ai = function (target) {
					const player = get.player();
					return get.recoverEffect(target, player, player)
				}
				prompt = `你令任意角色恢复1点体力`
			} else if (sub.includes(number)) {
				ai = function (target) {
					const player = get.player();
					return get.damageEffect(target, player, player)
				}
				prompt = `你对任意角色造成1点伤害`
			}
			if (!prompt) return;
			let result = await player.chooseTarget(prompt)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return true;
				})
				.set("ai", ai)
				.forResult();
			if (result?.bool && result?.targets?.length) {
				let target = result.targets[0];
				if (prompt == `你令任意角色恢复1点体力`) {
					await target.recover();
				} else {
					await target.damage();
				}
			}
		},
		ai: {
			order: 6,
			result: {
				player: 2
			}
		}
	},
	//葛天
	shigu_yzs: {
		group: ["shigu_yzs_buff", "shigu_yzs_change"],
		subSkill: {
			buff: {
				mark: true,
				marktext: "骨",
				intro: {
					mark(dialog, _, player) {
						dialog.addText(`【骨相】角色不可成为【桃】的目标且对 葛天 使用【杀】无次数限制`);
					},
				},
				nopop: true,
				charlotte: true,
				mod: {
					targetEnabled(card, player, target, now) {
						if (card.name == "tao") {
							return false;
						}
					},
					cardUsableTarget(card, player, target) {
						if (card?.name == "sha" && target.hasSkill("shigu_yzs")) return true;
					},
				},
			},
			change: {
				audio: "shigu_yzs",
				trigger: {
					global: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				priority: 2,
				filter(event, player) {
					if (!event.player) return false;
					if (event.player == player) return false;
					if (event.player.hasSkill("shigu_yzs_buff")) return false;
					if (event.player.countCards("h") != player.countCards("h")) {
						return false;
					}
					let gain = 0,
						lose = 0;
					if (event.getg) {
						gain = event.getg(event.player).length;
					}
					if (event.getl) {
						lose = event.getl(event.player).hs.length;
					}
					return gain != lose;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget(`你可令其他角色退出${get.poptip("shigu_yzs_buff")}，然后其进入【骨相】`, `【骨相】角色不可成为【桃】的目标且对 你 使用【杀】无次数限制`, function (card, player, target) {
							return !target.hasSkill("shigu_yzs_buff") && target == get.event().target
						})
						.set("ai", function (target) {
							return -get.attitude(_status.event.player, target);
						})
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(target => {
								if (target.hasSkill("shigu_yzs_buff")) return `骨相`
							});
						})
						.set("target", trigger.player)
						.set("animate", false)
						.forResult();
				},
				async content(event, trigger, player) {
					const target = event.targets[0];
					for (let cur of game.filterPlayer()) {
						if (cur == player) continue;
						if (cur == target) continue;
						cur.removeTip("shigu_yzs_buff");
						cur.removeSkill("shigu_yzs_buff")
					}
					target.addTip("shigu_yzs_buff", "骨相", false);
					target.addSkill("shigu_yzs_buff")
				},
			}
		},
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		mod: {
			ignoredHandcard(card, player) {
				if (get.name(card) == "sha") {
					return true;
				}
			},
			cardDiscardable(card, player, name) {
				if (name === "phaseDiscard" && get.name(card) == "sha") {
					return false;
				}
			},
			cardEnabled(card, player) {
				if (get.name(card) != "sha") return;
				if (!card.isCard) return;
				if (!card.cards || !card.cards.length) return;
				if (card.cards.some(c => !player.getCards("h").includes(c))) return;
				return false;
			},
			cardRespondable(card, player) {
				if (get.name(card) != "sha") return;
				if (!card.isCard) return;
				if (!card.cards || !card.cards.length) return;
				if (card.cards.some(c => !player.getCards("h").includes(c))) return;
				return false;
			},
			cardUsable(card, player) {
				if (get.name(card) != "sha") return;
				if (!card.isCard) return;
				if (!card.cards || !card.cards.length) return;
				if (card.cards.some(c => !player.getCards("h").includes(c))) return;
				return false;
			},
		},
		enable: ["chooseToRespond", "chooseToUse"],
		filterCard: {
			name: "sha",
		},
		viewAs: {
			name: "shan",
		},
		prompt: "将一张杀当闪使用或打出",
		check() {
			return 1;
		},
		position: "hs",
		viewAsFilter(player) {
			if (!player.countCards("hs", "sha")) {
				return false;
			}
		},
		ai: {
			respondShan: true,
			skillTagFilter(player) {
				if (!player.countCards("hs", "sha")) {
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
			order: 4,
			useful: -1,
			value: -1,
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
	},
	lingleidegu_yzs: {
		subSkill: {
			1: {
				persevereSkill: true,
				audio: "ext:一中杀/audio/skill:2",
				async content(event, trigger, player) {
					await player.draw(3);
					if (player.countCards("h") > 0) await player.chooseToDiscard([1, Infinity], true)
						.set("prompt", `另类的骨`)
						.set("prompt2", `弃至少2张牌或1张【杀】`)
						.set("filterOk", () => {
							if (ui.selected.cards?.some(card => card.name == "sha")) return true;
							return ui.selected.cards?.length >= 2;
						})
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						},
					},
				},
			},
			2: {
				audio: "lingleidegu_yzs_1",
				persevereSkill: true,
				filterX(player) {
					return player.countCards("h") > 0;
				},
				async content(event, trigger, player) {
					if (player.countCards("h") <= 0) return;
					const cards = await game.cardsGotoOrdering(get.cards(player.countCards("h"))).cards;
					let cardx = cards.sort();
					await player.showCards(cards, `${get.translation(player)}发动了【另类的骨】`, true);
					let result = await player
						.chooseButton(["获得其中一种牌名的牌", cardx], 1, true)
						.set("selectButton", () => {
							if (ui.selected?.buttons?.length) return -1;
							return 1;
						})
						.set("filterButton", (button) => {
							if (ui.selected?.buttons?.length) {
								const btn = ui.selected.buttons[0];
								return get.name(button.link) == get.name(btn.link);
							}
							return true;
						})
						.set("ai", button => {
							let cards = get.event().cards.slice(0)
							cards = cards.filter(i => get.name(i) == get.name(button.link))
							return get.value(button) * cards.length;
						})
						.set("cards", cards)
						.forResult();
					await player.gain(result.links, "gain2")
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						},
					},
				},
			},
			3: {
				audio: "lingleidegu_yzs_1",
				persevereSkill: true,
				filterX(player) {
					return game.countPlayer(function (target) {
						return lib.skill.lingleidegu_yzs_3.filterTarget(null, player, target)
					}) > 0
				},
				filterTarget(card, player, target) {
					if (target == player) return false;
					if (target.hasSkill("hidden_yzs")) return false;
					return target.hasSkill("shigu_yzs_buff")
				},
				async content(event, trigger, player) {
					const target = event.target;
					await player.swapHandcards(target);
				},
				ai: {
					order: 1,
					result: {
						player(player, target) {
							if (target.countCards("h") > 0) {
								return -Math.max(get.value(target.getCards("h"), player) - get.value(player.getCards("h"), player), 0);
							}
							return 0;
						},
					},
				},
			},
		},
		locked: true,
		nobracket: true,
	},
	duyidexiang_yzs: {
		subSkill: {
			1: {
				persevereSkill: true,
				audio: "ext:一中杀/audio/skill:2",
				async content(event, trigger, player) {
					player.addSkill("duyidexiang_yzs_buff1")
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						},
					},
				},
			},
			buff1: {
				audio: "duyidexiang_yzs_1",
				mark: false,
				limited: true,
				skillAnimation: false,
				init: function (player, skill) {
					player.yzs_InitShunfaji(skill);
				},
				onremove(player, skill) {
					if (player.node.yzs_shunfajiButtons) {
						player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
					}
				},
				clickable: function (player) {
					player.yzs_UseShunfaji("duyidexiang_yzs_buff1");
				},
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
				},
				clickableFilter: function (player) {
					return true
				},
				clickableContent: async function (event, trigger, player) {
					let ask = await player.chooseBool(`是否发动【独一的相·Ⅰ】?<br>你摸或弃至多2张牌`)
						.forResult();
					if (!ask.bool) return;
					let next = player.useSkill("duyidexiang_yzs_buff1")
					await next;
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					return true
				},
				async content(event, trigger, player) {
					player.removeSkill("duyidexiang_yzs_buff1")
					let result = await player.chooseToDiscard([1, 2], `弃至多2张牌，否则摸至多2张牌`).forResult();
					if (!result || !result.bool) {
						result = await player.chooseButton([
							"摸1~2张牌",
							[
								[
									[1, "1"],
									[2, "2"],
								],
								"tdnodes",
							],
						])
							.set("forced", true)
							.set("selectButton", 1)
							.set("filterButton", function (button) {
								return true
							})
							.set("ai", (button) => {
								return button.link
							})
							.forResult();
						if (result?.bool) {
							await player.draw(result?.links[0])
						}
					}
					const evt = event.getParent(2);
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				},
				ai: {
					order: 10,
					result: {
						player: 1,
					},
				},
			},
			2: {
				persevereSkill: true,
				audio: "duyidexiang_yzs_1",
				async content(event, trigger, player) {
					player.addSkill("duyidexiang_yzs_buff2")
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						},
					},
				},
			},
			buff2: {
				audio: "duyidexiang_yzs_1",
				mark: false,
				limited: true,
				skillAnimation: false,
				init: function (player, skill) {
					player.yzs_InitShunfaji(skill);
				},
				onremove(player, skill) {
					if (player.node.yzs_shunfajiButtons) {
						player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
					}
				},
				clickable: function (player) {
					player.yzs_UseShunfaji("duyidexiang_yzs_buff2");
				},
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
				},
				clickableFilter: function (player) {
					if (!game.hasPlayer(function (target) {
						return (!target.hasSkill("hidden_yzs"))
					})) return false;
					return true
				},
				clickableContent: async function (event, trigger, player) {
					let target = await player.chooseTarget("独一的相·Ⅱ", "你令任意角色摸或弃至多2张牌", false)
						.set("filterTarget", (card, player, target) => {
							return !(target.hasSkill("hidden_yzs"));
						})
						.set("ai", target => {
							const player = get.player();
							return Math.abs(get.attitude(player, target))
						})
						.forResult()
					if (!target.bool) {
						return;
					}
					let next = player.useSkill("duyidexiang_yzs_buff2")
					next.targets = target.targets;
					await next;
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					return true
				},
				filterTarget: function (card, player, target) {
					return !(target.hasSkill("hidden_yzs"));
				},
				selectTarget: 1,
				async content(event, trigger, player) {
					player.removeSkill("duyidexiang_yzs_buff2")
					let target = event.targets[0];
					let result = await player.chooseButton([
						`令 ${get.translation(target)} 摸或弃至多2张牌`,
						[
							[
								["draw", "摸"],
								["discard", "弃"],
							],
							"tdnodes",
						],
						[
							[
								[1, "1"],
								[2, "2"],
							],
							"tdnodes",
						],
					])
						.set("forced", true)
						.set("selectButton", 2)
						.set("filterButton", function (button) {
							if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
							let btn = ui.selected.buttons[0];
							if (typeof btn.link == "string") {
								return typeof button.link !== "string"
							} else {
								return typeof button.link === "string"
							}
						})
						.set("target", target)
						.set("ai", (button) => {
							if (typeof button.link == "string") return get.attitude(get.event().player, get.event().target)
							return button.link
						})
						.forResult();
					if (result?.bool) {
						let methods = result.links?.filter(i => typeof i == "string");
						let num = (result.links?.filter(i => typeof i !== "string"))[0] || 2;
						if (methods && methods[0] == "draw") {
							await target.draw(num)
						} else {
							await target.chooseToDiscard(num, true)
						}
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
						target: 1,
					},
				},
			},
			3: {
				persevereSkill: true,
				audio: "duyidexiang_yzs_1",
				async content(event, trigger, player) {
					player.addSkill("duyidexiang_yzs_buff3")
				},
				ai: {
					order: 2,
					result: {
						player(player, target) {
							return 1
						},
					},
				},
			},
			buff3: {
				audio: "duyidexiang_yzs_1",
				mark: false,
				limited: true,
				skillAnimation: false,
				init: function (player, skill) {
					player.yzs_InitShunfaji(skill);
				},
				onremove(player, skill) {
					if (player.node.yzs_shunfajiButtons) {
						player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
					}
				},
				clickable: function (player) {
					player.yzs_UseShunfaji("duyidexiang_yzs_buff3");
				},
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
				},
				clickableFilter: function (player) {
					if (!game.hasPlayer(function (target) {
						return (!target.hasSkill("hidden_yzs"))
					})) return false;
					return true
				},
				clickableContent: async function (event, trigger, player) {
					let target = await player.chooseTarget("独一的相·Ⅲ", "你视为使用无距离限制且不可响应的普通【杀】", false)
						.set("filterTarget", (card, player, target) => {
							return !(target.hasSkill("hidden_yzs")) && player.canUse({ name: "sha", isCard: true }, target, false)
						})
						.set("ai", target => {
							const player = get.player();
							return get.effect(target, { name: "sha", isCard: true }, player, player)
						})
						.forResult()
					if (!target.bool) {
						return;
					}
					let next = player.useSkill("duyidexiang_yzs_buff3")
					next.targets = target.targets;
					await next;
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					return game.hasPlayer(function (target) {
						return player.canUse({ name: "sha", isCard: true }, target, false)
					})
				},
				filterTarget: function (card, player, target) {
					return !(target.hasSkill("hidden_yzs")) && player.canUse({ name: "sha", isCard: true }, target, false)
				},
				selectTarget: 1,
				multitarget: true,
				async content(event, trigger, player) {
					player.removeSkill("duyidexiang_yzs_buff3")
					let next = player.useCard({ name: "sha", isCard: true }, event.targets);
					next.directHit = event.targets;
					await next;
				},
				ai: {
					order: 8,
					result: {
						target(player, target) {
							return get.effect(target, { name: "sha", isCard: true }, player, target);
						}
					},
				},
			},
		},
		locked: true,
		nobracket: true,
	},
	wosiguwozai_yzs: {
		group: ["wosiguwozai_yzs_sha", "wosiguwozai_yzs_damage", "wosiguwozai_yzs_storm", "wosiguwozai_yzs_summon"],
		subSkill: {
			sha: {
				audio: "ext:一中杀/audio/skill:2",
				forced: true,
				priority: 6,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter(event2, player2) {
					const evt = event2.getl(player2);
					if (!evt?.hs?.length) {
						return false;
					}
					const hs = evt.hs;
					if (!hs.some((card) => get.name(card) == "sha")) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					await player.yzs_addPassion();
				},
			},
			damage: {
				forced: true,
				popup: false,
				priority: -13,
				trigger: {
					global: "damageBegin3"
				},
				filter(event, player) {
					return player.yzs_hasCountDown(i => i.name == "wosiguwozai_yzs")
				},
				async content(event, trigger, player) {
					await player.yzs_updateCountDown(player.yzs_getCountDown(i => i.name == "wosiguwozai_yzs"));
				},
			},
			storm: {
				priority: 6,
				popup: false,
				forced: true,
				trigger: {
					global: ["yzs_cancelStormEnd", "yzs_SummonStormEnd", "yzs_changeStormEnd"],
				},
				filter(event, player) {
					if (event.before != "chenyuStorm") return false;
					if (event.storm == "chenyuStorm") return false;
					return player.yzs_hasCountDown(i => i.name == "wosiguwozai_yzs")
				},
				async content(event, trigger, player) {
					let cds = player.yzs_getCountDown(i => i.name == "wosiguwozai_yzs")
					for (let cd of cds) {
						await player.yzs_clearCountDown(cd);
						if (cd.num > 0) await player.yzs_addPassion(cd.num)
					}
				},
			},
			summon: {
				priority: 5,
				popup: false,
				forced: true,
				trigger: {
					player: ["yzs_SummonStormEnd"],
				},
				filter(event, player) {
					return event.storm == "chenyuStorm"
				},
				async content(event, trigger, player) {
					game.broadcastAll((player) => {
						_status.chenyuStorm = player;
					})
				},
			},
		},
		locked: true,
		nobracket: true,
		forced: true,
		priority: 4,
		//	skillAnimation: "legend",
		//	animationColor: "fire",
		//	audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "yzs_addPassionAfter",
		},
		filter(event, player) {
			return player.countMark("Passion_yzs") >= 5;
		},
		async content(event, trigger, player) {
			player.clearMark("Passion_yzs", false);
			game.broadcastAll(() => {
				var video = document.createElement("VIDEO");
				video.className = "anime";

				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/wosiguwozai_yzs.MP4",
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
			if (_status._yzsStorm == "chenyuStorm") {
				await player.yzs_clearCountDown(player.yzs_getCountDown(i => i.name == "wosiguwozai_yzs"));
				if (!player.yzs_hasCountDown(i => i.name == "wosiguwozai_yzs")) player.yzs_setCountDown({
					num: 5,
					once: true,
					repeatNum: 5,
					command: {
						async todo(player) {
							if (_status._yzsStorm == "chenyuStorm") await player.yzs_cancelStorm();
						},
						list: [player],
					},
					value(item, player) {
						return 3;
					},
					name: "wosiguwozai_yzs",
					prompt: `失去本吟唱并终止【谶语风暴】。场上角色受到伤害时，本吟唱-1。【谶语风暴】结束时，失去本吟唱并获得剩余吟唱数点激情`,
					skill: "wosiguwozai_yzs"
				});
				const players = game.filterPlayer(cur => cur.hasSkill("shigu_yzs_buff") && !cur.hasSkill("hidden_yzs"));
				for (let p of players) {
					let result = await player.chooseButton([
						`选择令 ${get.translation(p)} 恢复或失去1点体力`,
						[
							[
								["recover", "恢复"],
								["losehp", "失去"],
							],
							"tdnodes",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai", (button) => {
							const player = get.player();
							const target = get.event().target;
							return get.effect(player, { name: button.link }, target, target)
						})
						.set("target", p)
						.forResult();
					if (result?.bool && result?.links[0] == "recover") {
						await p.recover();
					} else {
						await p.loseHp();
					}
				}
			} else {
				await player.yzs_SummonStorm("chenyuStorm");
				if (!player.yzs_hasCountDown(i => i.name == "wosiguwozai_yzs")) player.yzs_setCountDown({
					num: 5,
					once: true,
					repeatNum: 5,
					command: {
						async todo(player) {
							if (_status._yzsStorm == "chenyuStorm") await player.yzs_cancelStorm();
						},
						list: [player],
					},
					value(item, player) {
						return 3;
					},
					name: "wosiguwozai_yzs",
					prompt: `终止【谶语风暴】。场上角色受到伤害时，本吟唱-1。【谶语风暴】结束时，失去本吟唱并获得剩余吟唱数点激情`,
					skill: "wosiguwozai_yzs"
				});
			}
		},
	},
	chenyuStorm_skill: {
		group: "chenyuStorm_skill_instant",
		subSkill: {
			instant: {
				name: "谶语风暴",
				popup: false,
				locked: true,
				log: false,
				stormskill: true,
				async content(event, trigger, player) {
					let result = _status.currentPhase == player ? await player.chooseButton([
						`选择令你本回合或下回合${get.poptip("RE_AP")}+2`,
						[
							[
								["now", "本回合"],
								["after", "下回合"],
							],
							"tdnodes",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai", (button) => {
							return Math.random();
						})
						.forResult() : { bool: false };
					if (result?.bool && result?.links[0] == "now") {
						await player.addMark("RE_AP", 2, false);
					} else {
						player.addSkill("chenyuStorm_skill_buff")
					}
				}
			},
			buff: {
				priority: 199,
				trigger: {
					player: "phaseBegin",
				},
				charlotte: true,
				forced: true,
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					player.addMark("RE_AP", 2, false)
				},
			},
		},
		locked: true,
		popup: false,
		stormskill: true,
		trigger: {
			player: "phaseBegin",
		},
		filter(event, player) {
			return _status.chenyuStorm
		},
		forced: true,
		async content(event, trigger, player) {
			let result = await _status.chenyuStorm.chooseButton([
				`选择令 ${get.translation(player)} 恢复或失去1点体力`,
				[
					[
						["recover", "恢复"],
						["losehp", "失去"],
					],
					"tdnodes",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.set("filterButton", function (button) {
					return true
				})
				.set("ai", (button) => {
					const player = get.player();
					const target = get.event().target;
					return get.effect(player, { name: button.link }, target, target)
				})
				.set("target", p)
				.forResult();
			if (result?.bool && result?.links[0] == "recover") {
				await player.recover();
			} else {
				await player.loseHp();
			}
		},
		priority: -25,
	},
	//双面国王
	KingsTrove_yzs: {
		group: ["KingsTrove_yzs_use", "KingsTrove_yzs_use2"],
		subSkill: {
			use2: {
				priority: 5,
				direct: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return event.card?.storage?.KingsTrove_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
			},
			use: {
				locked: true,
				name: "国库",
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard(player, name) {
					if (player.getExpansions("KingsTrove_yzs").some(card => card.name == name)) {
						return true;
					}
				},
				filter(event, player) {
					if (player.hasSkill("KingsTrove_yzs_ban")) return false;
					if (event.responded) {
						return false;
					}
					return player.getExpansions("KingsTrove_yzs").some(card => event.filterCard(card, player, event));
				},
				chooseButton: {
					dialog(event, player) {
						return ui.create.dialog("国库", player.getExpansions("KingsTrove_yzs"), "hidden");
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
							audio: "KingsTrove_yzs",
							filterCard(card) {
								return card === lib.skill.KingsTrove_yzs_use_backup.card;
							},
							selectCard: -1,
							viewAs: links[0],
							card: links[0],
							async precontent(event, trigger, player) {
								if (!event.result.card.storage) event.result.card.storage = {};
								event.result.card.storage.KingsTrove_yzs = true;
								if (get.color(event.result.card) == "black") {
									player.addTempSkill("KingsTrove_yzs_ban")
								}
							},
							position: "x",
						};
					},
					prompt(links, player) {
						return "王之宝库：请选择" + get.translation(links[0]) + "的目标";
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
				mod: {
					targetInRange(card, player, target) {
						if (card.cards && card.cards.some(c => c.hasGaintag("KingsTrove_yzs"))) return true;
					},
					cardUsable(card, player, num) {
						if (card.cards && card.cards.some(c => c.hasGaintag("KingsTrove_yzs"))) return Infinity;
					},
				},
			}
		},
		marktext: "国",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("KingsTrove_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张“国库”";
			},
		},
		locked: true,
		nobracket: true,
		priority: -3,
		trigger: {
			global: "useCard",
		},
		forced: true,
		filter(event, player) {
			return event.card.name == "guowangmiling_yzs"
		},
		async content(event, trigger, player) {
			await player.draw();
			if (!player.countCards("h")) return
			const result = await player.chooseCard("王之宝库", "将1张手牌扣置为【国库】", "h", 1, true)
				.set("ai", (card) => {
					if (get.name(card) == "sha" && get.color(card) == "red") return 8;
					return 8 - get.value(card)
				})
				.forResult()
			if (result.bool && result.cards?.length) {
				let next = player.addToExpansion(result.cards, player, "giveAuto", false)
				next.gaintag.add("KingsTrove_yzs")
				await next
			}
		},
	},
	zhengling_yzs: {
		derivation: "zhengpan_yzs",
		group: ["zhengling_yzs_mark"],
		global: "zhengling_yzs_tag",
		subSkill: {
			tag: {
				forceDie: true,
				trigger: {
					global: "phaseAfter",
				},
				priority: -4224,
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					player.removeGaintag("visible_zhengling_yzs", player.getCards("h"))
				},
				mod: {
					cardname(card, player) {
						if (card.hasGaintag("visible_zhengling_yzs")) {
							if (get.color(card) == "black") {
								return "guowangmiling_yzs"
							} else if (get.color(card) == "red") {
								return "wuzhong"
							}
						}
					},
				},
			},
			mark: {
				audio: "ext:一中杀/audio/skill:3",
				priority: 11,
				mark: true,
				nopop: true,
				marktext: "<span style=\"text-decoration: line-through;\">叛</span>",
				intro: {
					nocount: true,
					content: "你被双面国王指定为了叛军",
				},
				trigger: {
					global: "roundStart",
				},
				filter(event, player) {
					return game.hasPlayer(current => current != player);
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget("每公轮开始时，你可重新标记1名其他角色为【叛军】", `有【征叛】的角色使用【杀】需优先指定【叛军】`, false, function (card, player, target) {
							return player != target
						})
						.set("ai", function (target) {
							let att = get.attitude(_status.event.player, target);
							return -att;
						})
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(target => {
								if (target.hasMark("zhengling_yzs_mark")) return `叛军`
							});
						})
						.set("animate", false)
						.forResult();
				},
				async content(event, trigger, player) {
					for (let cur of game.filterPlayer()) {
						cur.clearMark("zhengling_yzs_mark", false)
					}
					const target = event.targets[0];
					target.addMark("zhengling_yzs_mark", 1, false);
				},
			}
		},
		locked: true,
		usable: 1,
		priority: -3,
		trigger: {
			global: "drawBegin"
		},
		filter(event, player) {
			return event.num <= 3;
		},
		prompt2(event) {
			return `${get.translation(event.player)} 即将摸${event.num}张牌。你可改为令你摸2张牌扣置为【国库】，然后给予其2张【国库】`
		},
		check(event, player) {
			if (event.num <= 2) return get.attitude(player, event.player) >= 0;
			else return get.attitude(player, event.player) < 0;
		},
		async content(event, trigger, player) {
			const cards = get.cards(2);
			let next = player.addToExpansion(cards, "gain2", player)
			next.gaintag.add("KingsTrove_yzs");
			await next;
			let cardx = player.getExpansions("KingsTrove_yzs");
			if (!cardx.length) return;
			let result = cardx.length > 2 ? await player.chooseButton(["政令", `给予 ${get.translation(trigger.player)} 2张【国库】`, cardx], 2, true)
				.set("ai", (button) => {
					const player = get.event().player;
					const target = get.event().target;
					if (get.attitude(player, target) > 0) return get.value(button);
					return 6 - get.value(button);
				})
				.set("target", trigger.player)
				.forResult() : { bool: true, links: cardx }
			if (result?.bool && result?.links?.length) {
				await player.give(result.links, trigger.player, true);
				trigger.player.addGaintag(result.links, "visible_zhengling_yzs");
				player.addSkill("zhengpan_yzs")
			}
		},
	},
	zhengpan_yzs: {
		priority: 23,
		trigger: {
			player: "useCardAfter"
		},
		filter(event, player) {
			return event.card.name == "sha" || event.card.name == "guowangmiling_yzs";
		},
		direct: true,
		popup: false,
		async content(event, trigger, player) {
			player.removeSkill("zhengpan_yzs")
		},
		mod: {
			inRange(from, to) {
				if (from == to) return;
				if (to.hasMark("zhengling_yzs_mark")) {
					return true;
				}
			},
			playerEnabled(card, player, target) {
				if (card.name != "sha" || target.hasMark("zhengling_yzs_mark")) {
					return;
				}
				if (game.hasPlayer(current => current.hasMark("zhengling_yzs_mark") && player.canUse(card, current))) {
					return false;
				}
			},
		},
	},
	//伽菈波那
	yixingzhixue_yzs: {
		async gain(player, name, num = 1) {
			let cards = [];
			while (num > 0) {
				cards.push(game.createCard(name, "none", 1));
				num--;
			}
			let next = player.addToExpansion(cards, player, "gain2", false)
			next.gaintag.add("yixingzhixue_yzs_mark")
			await next
			game.log(player, `获得了${num}张${get.translation(name)}`)
			while (player.countExpansions("yixingzhixue_yzs_mark") > 3) {
				await lib.skill.yixingzhixue_yzs.remove(player, player.getExpansions("yixingzhixue_yzs_mark").pop());
			}
		},
		async remove(player, card, plus = 0) {
			let num = 0;
			if (card.name == "FullMoon_yzs" && card.storage?.yixingzhixue_yzs?.length) num += card.storage.yixingzhixue_yzs.length;
			await player.loseToDiscardpile(card);
			if (!player.hasSkill("yixingzhixue_yzs")) return;
			if (card.name == "FullMoon_yzs") {
				num = Math.floor(num / (plus + 2));
				let maps = {};
				while (num > 0) {
					const result = await player.chooseTarget(`###盈月###请选择分配${plus}点伤害的目标（剩余${num}次）`, 1).set('ai', target => {
						const player = get.player();
						return get.damageEffect(target, player, player);
					}).forResult();
					if (result.bool) {
						const next2 =
							num == 1
								? {
									bool: true,
									numbers: [1],
								}
								: await player
									.chooseNumbers('盈月', [{ prompt: `请选择你要对${get.translation(result.targets[0])}分配${plus}点伤害的次数`, min: 1, max: num }], true)
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
				};
				if (Object.keys(maps).length) {
					for (const target of game.filterPlayer()) {
						if (maps[target.playerid]) {
							for (let i = 0; i < maps[target.playerid]; i++) {
								await target.damage(plus + 0);
							}
						}
					}
				}
			}
			else if (card.name == "Mars_yzs") {
				if (player.countMark("RE_AP") < get.character(player.name).RE_AP) await player.addMark("RE_AP", Math.min(plus + 1, get.character(player.name).RE_AP - player.countMark("RE_AP")), false);
				await player.chooseToDiscard("he", [1, plus + 2]);
			} else if (card.name == "Saturn_yzs") {
				await player.draw(plus + 2)
			}
		},
		group: ["yixingzhixue_yzs_discard", "yixingzhixue_yzs_mark"],
		global: "yixingzhixue_yzs_moon",
		subSkill: {
			discard: {
				audio: "yixingzhixue_yzs",
				priority: -1,
				trigger: {
					global: ["loseAfter", "loseAsyncAfter", "cardsDiscardAfter"],
				},
				filter(event, player) {
					if (_status.currentPhase != player) return false;
					let cards = event.getd();
					cards = cards.filter(c => get.type(c) != "planet_yzs");
					if (!cards.length) return false;
					let ex = player.getExpansions("yixingzhixue_yzs_mark");
					ex = ex.filter(c => get.name(c) == "FullMoon_yzs");
					if (!ex.length) return false;
					for (let card of ex) {
						if (card.storage?.yixingzhixue_yzs?.length) {
							if (cards.some(c => get.suit(c) === get.suit(card.storage.yixingzhixue_yzs[0]))) return true;
						} else { return true; }
					}
					return false;
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = trigger.getd();
					cards = cards.filter(c => get.type(c) != "planet_yzs");
					// 第一行：进入弃牌堆的牌（索引 0）
					let list = [["进入弃牌堆的牌", cards]];
					let ex = player.getExpansions("yixingzhixue_yzs_mark").filter(c => get.name(c) == "FullMoon_yzs");

					if (!ex.length) return;

					// 构建后续的可移入行
					for (let card of ex) {
						let list2 = [];
						// 盈月下的牌（注意：盈月本身 [card] 应该作为标识符，不参与移动）
						if (card.storage?.yixingzhixue_yzs?.length) {
							list2 = card.storage.yixingzhixue_yzs.slice();
						}
						// 格式：[描述图标/牌, 初始容器牌]
						list.splice(1, 0, [card, list2]);
					}

					let result = await player.chooseToMove_new(`移星之学：你可将牌叠置于【盈月】下（每张【盈月】仅可叠置同花色的牌，靠上的【盈月】先被移除）`)
						.set("list", list)
						.set("filterMove", function (from, to, moved) {

							let targetIndex = typeof to == 'number' ? to : moved.findIndex(l => l.includes(to.link));
							let fromIndex = typeof from == 'number' ? from : moved.findIndex(l => l.includes(from.link));

							if (targetIndex === 0) return false;
							if (fromIndex !== 0) return false;

							let targetList = moved[targetIndex];

							let cardSuit = get.suit(from.link);

							if (targetList?.length > 0) {

								return targetList.every(c => get.suit(c) === cardSuit);

							}

							return true; // 目标为空，可以移入

						})
						.set("processAI", function (list) {
							// 1. 获取源牌（第一行：进入弃牌堆的牌）
							// list[0][1] 对应的是你的 cards 数组
							let sourceCards = (list[0] && list[0][1]) ? list[0][1].slice() : [];

							// 2. 初始化结果数组（深度拷贝 list 每一行的初始牌数组）
							// resultMoved[0] 是弃牌堆，resultMoved[1...n] 是各个盈月行
							let resultMoved = list.map(item => (Array.isArray(item[1]) ? item[1].slice() : []));

							// 如果没有待分配的牌，直接返回原始结构
							if (!sourceCards.length) return resultMoved;

							// 3. AI 分配策略
							for (let i = sourceCards.length - 1; i >= 0; i--) {
								let card = sourceCards[i];
								let cardSuit = get.suit(card);
								let hasMoved = false;

								// 优先分配：寻找已经有相同花色牌的“盈月”行（从索引 1 开始）
								for (let j = 1; j < resultMoved.length; j++) {
									let targetRow = resultMoved[j];
									// 只要目标行不为空，且第一张牌花色一致（filterMove 保证了行内花色统一）
									if (targetRow.length > 0 && get.suit(targetRow[0]) === cardSuit) {
										targetRow.push(card);
										sourceCards.splice(i, 1);
										hasMoved = true;
										break;
									}
								}

								if (hasMoved) continue;

								// 次选分配：寻找第一个空置的“盈月”行
								for (let j = 1; j < resultMoved.length; j++) {
									let targetRow = resultMoved[j];
									if (targetRow.length === 0) {
										targetRow.push(card);
										sourceCards.splice(i, 1);
										hasMoved = true;
										break;
									}
								}
							}

							// 4. 将分配后剩余的弃牌堆存回索引 0
							resultMoved[0] = sourceCards;

							// 返回最终的二维数组结构
							return resultMoved;
						})
						.forResult();

					// 结果处理
					if (result && result.bool) {
						let moved = result.moved;
						// moved[0] 是最终留在弃牌堆的牌
						// moved[1]...[n] 是移动到对应盈月下的牌
						let data = {
							moons: [],
							storages: [],
						};
						let reversedEx = ex.slice().reverse(); // 修正 ex 的顺序以对应 list[1...n]
						for (let i = 1; i < moved.length; i++) {
							let moonCard = reversedEx[i - 1];
							let newStorage = moved[i];
							data.moons.push(moonCard)
							data.storages.push(newStorage)
						}
						event.result = {
							bool: true,
							cost_data: data,
						}
					}
				},
				async content(event, trigger, player) {
					let data = event.cost_data;
					let cards = trigger.getd();
					for (let i = 0; i < data.moons.length; i++) {
						let moonCard = data.moons[i];
						let newStorage = data.storages[i];
						let gains = newStorage.filter(c => cards.includes(c));
						player.$gain2(gains);
						await game.cardsGotoSpecial(gains);
						moonCard.storage.yixingzhixue_yzs = newStorage;
						game.broadcast(
							(card, newStorage) => {
								card.storage.yixingzhixue_yzs = newStorage;
							},
							moonCard,
							moonCard.storage.yixingzhixue_yzs
						);
					}
				},
			},
			mark: {
				marktext: "星",
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						dialog.addText(`星环(上方的行星先被移除，新加入的行星位于下方)`);
						let cards = player.getExpansions("yixingzhixue_yzs_mark").slice();
						cards = cards.reverse();
						for (let card of cards) {
							let list = [card];
							if (card.storage?.yixingzhixue_yzs?.length) {
								list = list.concat(card.storage.yixingzhixue_yzs);
							}
							dialog.addAuto(list);
						}
					},
				},
				audio: "ext:一中杀/audio/skill:1",
				priority: 32,
				locked: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					//仅播放语音
				},
			},
			moon: {
				forceDie: true,
				charlotte: true,
				forced: true,
				priority: 20,
				popup: false,
				trigger: {
					player: ["loseBefore"]
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					let extra = [];
					for (var i = 0; i < trigger.cards.length; i++) {
						if (trigger.cards[i][trigger.cards[i].cardSymbol]?.cards?.length) {
							for (let card of trigger.cards[i][trigger.cards[i].cardSymbol].cards) {
								if (card.storage?.yixingzhixue_yzs?.length) {
									extra.addArray(card.storage.yixingzhixue_yzs);
									card.storage.yixingzhixue_yzs = [];
									game.broadcast(
										(card) => {
											card.storage.yixingzhixue_yzs = [];
										},
										card
									);
								}
							}
						}
						if (trigger.cards[i].storage?.yixingzhixue_yzs?.length) {
							extra.addArray(trigger.cards[i].storage?.yixingzhixue_yzs);
							trigger.cards[i].storage.yixingzhixue_yzs = [];
							game.broadcast(
								(card) => {
									card.storage.yixingzhixue_yzs = [];
								},
								trigger.cards[i]
							);
						}
					}
					if (!extra.length) return;
					trigger.cards = trigger.cards.concat(extra);
				}
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		nobracket: true,
		locked: true,
		priority: -3,
		trigger: {
			player: "phaseBegin"
		},
		async cost(event, trigger, player) {
			event.result = {
				bool: false,
			}
			if (!player.countExpansions("yixingzhixue_yzs_mark")) return;
			const cards = player.getExpansions("yixingzhixue_yzs_mark");
			let map = { Saturn_yzs: 0, Mars_yzs: 0, FullMoon_yzs: 0 }
			for (let card of cards) {
				if (typeof map[card.name] == "number") map[card.name]++;
			}
			let max = Math.max(map.Saturn_yzs, map.Mars_yzs, map.FullMoon_yzs);
			let maxs = [];
			if (map.Saturn_yzs == max) maxs.push("Saturn_yzs")
			if (map.Mars_yzs == max) maxs.push("Mars_yzs")
			if (map.FullMoon_yzs == max) maxs.push("FullMoon_yzs");
			if (maxs.length == 1) {
				event.result = {
					bool: true,
					cost_data: maxs[0]
				}
			}
		},
		async content(event, trigger, player) {
			const name = event.cost_data;
			if (name == "Saturn_yzs") {
				await player.draw(3);
			} else if (name == "Mars_yzs") {
				if (player.countMark("RE_AP") < get.character(player.name).RE_AP) await player.addMark("RE_AP", Math.min(2, get.character(player.name).RE_AP - player.countMark("RE_AP")), false);
				await player.chooseToDiscard("he", [1, 3]);
			} else if (name == "FullMoon_yzs") {
				if (!trigger.skill) player.insertPhase().skill = "yixingzhixue_yzs";
			}
		}
	},
	tishuyinyong_yzs: {
		nobracket: true,
		locked: true,
		persevereSkill: true,
		subSkill: {
			1: {
				persevereSkill: true,
				audio: "ext:一中杀/audio/skill:2",
				async content(event, trigger, player) {
					await lib.skill.yixingzhixue_yzs.gain(player, "Saturn_yzs");
				},
				ai: {
					order: 2,
					result: {
						player: 1
					},
				},
			},
			2: {
				persevereSkill: true,
				audio: "tishuyinyong_yzs_1",
				async content(event, trigger, player) {
					await lib.skill.yixingzhixue_yzs.gain(player, "Saturn_yzs", 2);
				},
				ai: {
					order: 2,
					result: {
						player: 1
					},
				},
			},
			3: {
				persevereSkill: true,
				audio: "tishuyinyong_yzs_1",
				async content(event, trigger, player) {
					await lib.skill.yixingzhixue_yzs.gain(player, "Saturn_yzs", 3);
				},
				ai: {
					order: 2,
					result: {
						player: 1
					},
				},
			}
		}
	},
	gufaguanxing_yzs: {
		nobracket: true,
		locked: true,
		persevereSkill: true,
		subSkill: {
			1: {
				persevereSkill: true,
				audio: "ext:一中杀/audio/skill:2",
				async content(event, trigger, player) {
					await lib.skill.yixingzhixue_yzs.gain(player, "Mars_yzs");
				},
				ai: {
					order: 2,
					result: {
						player: 1
					},
				},
			},
			2: {
				persevereSkill: true,
				audio: "gufaguanxing_yzs_1",
				async content(event, trigger, player) {
					await lib.skill.yixingzhixue_yzs.gain(player, "Mars_yzs", 2);
				},
				ai: {
					order: 2,
					result: {
						player: 1
					},
				},
			},
			3: {
				persevereSkill: true,
				audio: "gufaguanxing_yzs_1",
				async content(event, trigger, player) {
					await lib.skill.yixingzhixue_yzs.gain(player, "Mars_yzs", 3);
				},
				ai: {
					order: 2,
					result: {
						player: 1
					},
				},
			}
		}
	},
	duyideyuanman_yzs: {
		group: ["duyideyuanman_yzs_use1", "duyideyuanman_yzs_use2"],
		subSkill: {
			use1: {
				locked: true,
				priority: -3,
				forced: true,
				audio: "ext:一中杀/audio/skill:2",
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					await player.yzs_addPassion();
				},
			},
			use2: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "yzs_RE_Mystic_UseAfter",
				},
				filter(event, player) {
					return player.countMark("duyideyuanman_yzs") < 4;
				},
				async content(event, trigger, player) {
					player.addMark("duyideyuanman_yzs", 1, false);
				},
			}
		},
		nobracket: true,
		locked: true,
		forced: true,
		trigger: {
			player: "yzs_addPassionAfter",
		},
		filter(event, player) {
			return player.countMark("Passion_yzs") >= player.countMark("duyideyuanman_yzs") + 1;
		},
		async content(event, trigger, player) {
			player.clearMark("Passion_yzs", false);
			if (player.countMark("duyideyuanman_yzs") + 1 < 5) {
				await lib.skill.yixingzhixue_yzs.gain(player, "FullMoon_yzs");
				return;
			}
			game.broadcastAll(() => {
				var video = document.createElement("VIDEO");
				video.className = "anime";

				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/duyideyuanman_yzs.MP4",
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
			const cards = player.getExpansions("yixingzhixue_yzs_mark");
			for (let i = cards.length - 1; i >= 0; i--) {
				await lib.skill.yixingzhixue_yzs.remove(player, cards[i], 1);
			}
			await lib.skill.yixingzhixue_yzs.gain(player, "FullMoon_yzs", 2);
			player.clearMark("duyideyuanman_yzs", false);
		}
	},
	//仆人
	sishengzhijian_yzs: {
		group: ["sishengzhijian_yzs_recover", "sishengzhijian_yzs_damage"],
		subSkill: {
			recover: {
				locked: true,
				forced: true,
				priority: 6,
				trigger: {
					player: ["recoverEnd"],
				},
				filter(event, player) {
					return event.overflow > 0;
				},
				async content(event, trigger, player) {
					await player.draw(Math.min(trigger.overflow, 5));
				},
			},
			damage: {
				forced: true,
				priority: 2,
				trigger: {
					player: "damageAfter"
				},
				filter(event, player) {
					return event.num > 0;
				},
				async content(event, trigger, player) {
					let next = player.addToExpansion(get.cards(Math.min(trigger.num, 5)), "gain2", player)
					next.gaintag.add("_sishengzhijian_yzs_cards");
					await next;
				},
			}
		},
		mod: {
			targetEnabled(card, player, target, now) {
				if (player == target) return;
				if (card.name == "tao") return false;
			},
		},
		nobracket: true,
		forced: true,
		trigger: {
			source: "damageBegin2",
		},
		filter(event, player) {
			if (event.player == player) return false;
			return player.countGainableCards(event.player, "he") > 0 || player.countExpansions("_sishengzhijian_yzs_cards") > 0;
		},
		async content(event, trigger, player) {
			const target = trigger.player;
			if (target == player) return;
			if (player.countGainableCards(target, "h") < 1 && player.countExpansions("_sishengzhijian_yzs_cards") < 1) return;
			let args1 = [`观看并获得${get.translation(player)}1张手牌，或转移${get.translation(player)}1张【生命之契】给你<br>然后你给予${get.translation(player)}1张手牌，或转移你1张【生命之契】给${get.translation(player)}`];
			if (player.countGainableCards(target, "h") > 0) {
				args1.push(`${get.translation(player)}的手牌`)
				args1.push(player.getGainableCards(target, "h"))
			}
			if (player.countExpansions("_sishengzhijian_yzs_cards")) {
				args1.push(`${get.translation(player)}的【生命之契】`)
				args1.push(player.getExpansions("_sishengzhijian_yzs_cards"))
			}
			args1.push("hidden")
			let result1 = await target.chooseButton(args1, true)
				.set("selectButton", 1)
				.set("ai", (button) => {
					const player = get.event().player;
					const card = button.link;
					const target = get.event().target;
					if (_status.currentPhase == target && get.name(card) == "shan") return 12;
					if (card.hasGaintag("_sishengzhijian_yzs_cards")) {
						if (get.type2(card) == "trick") return get.value({ name: "sha" }) + get.recoverEffect(player, player, player);
						return get.value(card) + get.recoverEffect(player, player, player)
					} else {
						return get.value(card)
					}
				})
				.set("target", player)
				.forResult();
			if (!result1 || !result1.bool || !result1.links || !result1.links.length) return;
			if (result1.links[0].hasGaintag("_sishengzhijian_yzs_cards")) {
				let next = target.addToExpansion(result1.links, "gain2", player)
				next.gaintag.add("_sishengzhijian_yzs_cards");
				await next;
			} else {
				await target.gain(result1.links);
			}

			if (target.countCards("h") < 1 && target.countExpansions("_sishengzhijian_yzs_cards") < 1) return;
			let args2 = [`给予${get.translation(player)}1张手牌，或转移你1张【生命之契】给${get.translation(player)}`];
			if (target.countCards("h") > 0) {
				args2.push(`你的手牌`)
				args2.push(target.getGainableCards(target, "h"))
			}
			if (target.countExpansions("_sishengzhijian_yzs_cards")) {
				args2.push(`你的【生命之契】`)
				args2.push(target.getExpansions("_sishengzhijian_yzs_cards"))
			}
			args2.push("hidden")
			let result2 = await target.chooseButton(args2, true)
				.set("selectButton", 1)
				.set("ai", (button) => {
					const player = get.event().player;
					const card = button.link;
					const target = get.event().target;
					if (_status.currentPhase == target && get.name(card) == "shan") return 1;
					if (get.attitude(player, target) > 0) {
						if (card.hasGaintag("_sishengzhijian_yzs_cards")) return 8;
						return get.value(card, target)
					} else {
						if (card.hasGaintag("_sishengzhijian_yzs_cards")) return 1;
						return 8 - get.value(card, target)
					}
				})
				.set("target", player)
				.forResult();
			if (!result2 || !result2.bool || !result2.links || !result2.links.length) return;
			if (result2.links[0].hasGaintag("_sishengzhijian_yzs_cards")) {
				let next = player.addToExpansion(result2.links, "gain2", target)
				next.gaintag.add("_sishengzhijian_yzs_cards");
				await next;
			} else {
				await target.give(result2.links, player);
			}
		},
	},
	_sishengzhijian_yzs_cards: {
		marktext: `契`,
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("_sishengzhijian_yzs_cards");
				dialog.addAuto(cards);
			},
		},
		locked: true,
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			if (player.getExpansions("_sishengzhijian_yzs_cards").some(card => card.name == name)) {
				return true;
			}
		},
		filter(event, player) {
			if (event.responded) {
				return false;
			}
			return player.getExpansions("_sishengzhijian_yzs_cards").some(card => event.filterCard(card, player, event));
		},
		chooseButton: {
			dialog(event, player) {
				return ui.create.dialog("生命之契", player.getExpansions("_sishengzhijian_yzs_cards"), "hidden");
			},
			filter(button, player) {
				const evt = _status.event.getParent();
				let card = button.link;
				if (get.type2(card) == "trick") card = get.autoViewAs({ name: "sha" }, [card], player);
				return evt.filterCard(card, player, evt);
			},
			check(button) {
				const player = get.player();
				let card = button.link;
				if (get.type2(card) == "trick") card = get.autoViewAs({ name: "sha" }, [card], player);
				return player.getUseValue(card);
			},
			backup(links, player) {
				let card = links[0];
				if (get.type2(card) == "trick") card = get.autoViewAs({ name: "sha" }, [card], player);
				return {
					filterCard(card) {
						return card === lib.skill._sishengzhijian_yzs_cards_backup.card;
					},
					selectCard: -1,
					viewAs: card,
					card: links[0],
					position: "x",
					async precontent(event, trigger, player) {
						if (!event.result.card.storage) event.result.card.storage = {};
						event.result.card.storage._sishengzhijian_yzs_cards = true;
					},
				};
			},
			prompt(links, player) {
				let card = links[0];
				if (get.type2(card) == "trick") card = get.autoViewAs({ name: "sha" }, [card], player);
				return "生命之契：请选择" + get.translation(card) + "的目标";
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
	_sishengzhijian_yzs_use: {
		priority: 12,
		forced: true,
		trigger: {
			player: ["useCard", "respond"],
		},
		filter(event, player) {
			return event.card?.storage?._sishengzhijian_yzs_cards;
		},
		async content(event, trigger, player) {
			await player.recover();
		}
	},
	chijingzhiyi_yzs: {
		group: ["chijingzhiyi_yzs_start", "chijingzhiyi_yzs_renew"],
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
					player.removeMark("chijingzhiyi_yzs_used", player.countMark("chijingzhiyi_yzs_used"), false);
				},
			},
			start: {
				priority: 1,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return game.hasPlayer(current => current !== player) && (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					await player.draw();
					let max = Math.min(player.countMark("chijingzhiyi_yzs_used") + 1, 3)
					const result = player.countCards("h") > max ? await player.chooseCard("赤荆之翼", `尽可能将至多<font color="#fd5656">${Math.min(player.countMark("chijingzhiyi_yzs_used") + 1, 3)}</font>张手牌加入你的【生命之契】`, "h", max, true)
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
						}).forResult() : { bool: true, cards: player.getCards("h") }
					if (result?.bool && result?.cards?.length) {
						let next = player.addToExpansion(result.cards, player, "give")
						next.gaintag.add("_sishengzhijian_yzs_cards")
						await next
					}
					player.addMark("chijingzhiyi_yzs_used", 1, false);
				},
			},
		},
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name == "chijingzhiyi_yzs")) player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						await player.draw();
						let max = Math.min(player.countMark("chijingzhiyi_yzs_used") + 1, 3)
						const result = player.countCards("h") > max ? await player.chooseCard("赤荆之翼", `尽可能将至多<font color="#fd5656">${Math.min(player.countMark("chijingzhiyi_yzs_used") + 1, 3)}</font>张手牌加入你的【生命之契】`, "h", max, true)
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
							}).forResult() : { bool: true, cards: player.getCards("h") }
						if (result?.bool && result?.cards?.length) {
							let next = player.addToExpansion(result.cards, player, "give")
							next.gaintag.add("_sishengzhijian_yzs_cards")
							await next
						}
						player.addMark("chijingzhiyi_yzs_used", 1, false);
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "chijingzhiyi_yzs",
				prompt: `你摸1张牌，然后尽可能将至多<font color="#fd5656">1</font>张手牌加入你的【生命之契】。你失去最后的${get.poptip("_sishengzhijian_yzs_cards")}时本${get.poptip("sing_yzs_count")}-1。`,
				skill: "chijingzhiyi_yzs"
			});
		},
		nobracket: true,
		locked: true,
		forced: true,
		priority: -4,
		trigger: {
			player: ["loseBegin", "loseAfter"]
		},
		filter(event, player) {
			if (event.chijingzhiyi_yzs) {
				return !player.countExpansions("_sishengzhijian_yzs_cards");
			}
			let cards = event.cards.filter(card => card.gaintag.includes("_sishengzhijian_yzs_cards"));
			if (!cards.length) return false;
			let cardx = player.getExpansions("_sishengzhijian_yzs_cards");
			if (!cardx.length) return false;
			cardx = cardx.filter(c => !cards.includes(c));
			return !cardx.length;
		},
		async content(event, trigger, player) {
			if (trigger.chijingzhiyi_yzs) {
				await player.yzs_updateCountDown(player.yzs_getCountDown(i => i.name == "chijingzhiyi_yzs"));
			} else {
				trigger.chijingzhiyi_yzs = true;
			}
		},
	},
	yuhuozhige_yzs: {
		group: ["yuhuozhige_yzs_sha"],
		subSkill: {
			sha: {
				priority: 3,
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					return player.countExpansions("_sishengzhijian_yzs_cards") >= 3 && event.card.name == "sha";
				},
				forced: true,
				async content(event, trigger, player) {
					if (trigger.card.nature) {
						if (!trigger.card.storage.yzsNature) trigger.card.storage.yzsNature = [trigger.card.nature];
						else trigger.card.storage.yzsNature.push(trigger.card.nature);
					}
					if (!trigger.card.storage.yzsNature) trigger.card.storage.yzsNature = ["fire"];
					else trigger.card.storage.yzsNature.unshift("fire");
					game.log(trigger.card, "被赋予了火属性")

					trigger.directHit.addArray(game.filterPlayer())

					if (!trigger.baseDamage) trigger.baseDamage = 0;
					trigger.baseDamage++;
				},
			},
		},
		nobracket: true,
		popup: false,
		locked: true,
		forced: true,
		priority: 2,
		trigger: {
			source: "damageBegin2",
		},
		async content(event, trigger, player) {
			if (trigger.nature == "fire") {
				player.getStat().card.sha = 0;
			} else {
				trigger.num--;
			}
		}
	},
	//领域
	_yzsDomainCount: {
		subSkill: {
			die: {
				forced:true,
				forceDie: true,
				popup:false,
				trigger: {
					player:"die"
				},
				priority: 3124,
				filter(event, player) {
					return _status._yzsDomain && _status._yzsDomainPlayer == event.player;
				},
				async content(event, trigger, player) {
					game.broadcastAll(() => {
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
					});
				}
			},
		},
		ruleSkill: true,
		popup: false,
		locked: true,
		forced: true,
		charlotte: true,
		trigger: {
			player: "phaseAfter"
		},
		priority: -114,
		filter(event, player) {
			return _status._yzsDomain || _status._yzsDomainCount >0
		},
		async content(event, trigger, player) {
			game.broadcastAll(() => {
				_status._yzsDomainCount--;
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
			});
		}
	},
	//宿傩(伏黑惠)
	_SimpleDomain_yzs: {
		priority: -11,
		trigger: {
			global:"yzs_ExpandDomainEnd",
			player:"phaseBegin",
		},
		filter(event, player) {
			if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
			if (player.countCards("h") < 2) return false;
			return _status._yzsDomain && _status._yzsDomainPlayer && _status._yzsDomainPlayer != player;
		},
		async cost(event, trigger, player) {
			let str = `锁定技：你可弃置2张手牌，本回合抵消领域对你的效果，且本回合你不可对其他角色使用牌<br>(当前为 ${get.translation(_status.currentPhase)} 的回合)`
			let next = player.chooseToDiscard(player, "h");
			next.set("filterCard", (card) => true)
			next.set("selectCard", 2)
			next.set("prompt", str)
			next.set("wuliangkongchu_yzs_ban",true)
			next.set("ai", card => {
				if (!_status._yzsDomain || !_status._yzsDomainPlaye || _status._yzsDomainPlaye == player) return 0;
				return 6 - get.value(card);
			})
			next.set("chooseonly", true)
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards)
			player.addTempSkill("SimpleDomain_yzs_buff")
		},
	},
	SimpleDomain_yzs_buff: {
		charlotte:true,
		mark: true,
		marktext: "简",
		intro: {
			markcount: "storage",
			mark(dialog, content, player) {
				dialog.addText(`已开启简易领域，本回合你无视其他角色的领域效果，且你仅能对自己使用牌`);
			},
		},
		mod: {
			playerEnabled(card, player, target) {
				if (player !== target) {
					return false;
				}
			},
		},
	},
	zuzhouzhiwang_yzs: {
		group: ["BossRule_yzs","rg_treasure", "zuzhouzhiwang_yzs_summon"],
		subSkill: {
			summon: {
				forced: true,
				popup: false,
				priority:3214,
				trigger: {
					global: ["dieBefore"],
				},
				filter(event, player) {
					if (event.player.storage?.isSub) return false;
					if (event.player == player) return false;
					return !_status.zuzhouzhiwang_yzs_kill;
				},
				async content(event, trigger, player) {
					_status.zuzhouzhiwang_yzs_kill = true;
					trigger.noDieAfter = true;
					trigger.noDieAfter2 = true;
					const pos = trigger.player;
					game.addGlobalSkill("wtw_auto")
					if (!_status.GojoSatoru_yzs) {
						if (!game.checkResult_GojoSatoru_yzs) {
							game.checkResult_GojoSatoru_yzs = game.checkResult;
							game.checkResult = function () {
								const all = game.players.concat(game.dead);
								const origin_Onion = all.filter(i => i == pos)[0];//最初的洋葱怪人
								if (!origin_Onion) {
								//	const isDead = !game.players.includes(origin_Onion);//最初的洋葱怪人是否已经死亡
									const targets = game.players.filter(i => i.isNoPlayer_GojoSatoru_yzs);
							//		const hasRemain = game.players.some(i => i.isNoPlayer_GojoSatoru_yzs);//是否还有剩余的洋葱怪人
									game.players.removeArray(targets);
								//	if (isDead && hasRemain) game.players.add(origin_Onion);
									game.checkResult_GojoSatoru_yzs();
						//			if (isDead && hasRemain) game.players.remove(origin_Onion);
									game.players.addArray(targets);
									return;
								}
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
								const targets = game.players.filter(i => i.isNoPlayer_GojoSatoru_yzs);
								const hasRemain = game.players.some(i => i.isNoPlayer_GojoSatoru_yzs);//是否还有剩余的洋葱怪人
								game.players.removeArray(targets);
								if (isDead && hasRemain) game.players.add(origin_Onion);
								game.checkResult_GojoSatoru_yzs();
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
							if (_status.GojoSatoru_yzs) return;
							if (!game.checkResult_GojoSatoru_yzs) {
								game.checkResult_GojoSatoru_yzs = game.checkResult;
								game.checkResult = function () {
									const all = game.players.concat(game.dead);
									const origin_Onion = all.filter(i => i == pos)[0];//最初的洋葱怪人
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
									const targets = game.players.filter(i => i.isNoPlayer_GojoSatoru_yzs);
									const hasRemain = game.players.some(i => i.isNoPlayer_GojoSatoru_yzs);//是否还有剩余的洋葱怪人
									game.players.removeArray(targets);
									if (isDead && hasRemain) game.players.add(origin_Onion);
									game.checkResult_GojoSatoru_yzs();
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
							_status.GojoSatoru_yzs = true;
						});
						if (!_status.postReconnect.GojoSatoru_yzs) {
							_status.postReconnect.GojoSatoru_yzs = [
								function () {
									if (_status.GojoSatoru_yzs) return;
									if (!game.checkResult_GojoSatoru_yzs) {
										game.checkResult_GojoSatoru_yzs = game.checkResult;
										game.checkResult = function () {
											const all = game.players.concat(game.dead);
											const origin_Onion = all.filter(i => i == pos)[0];//最初的洋葱怪人
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
											const targets = game.players.filter(i => i.isNoPlayer_GojoSatoru_yzs);
											const hasRemain = game.players.some(i => i.isNoPlayer_GojoSatoru_yzs);//是否还有剩余的洋葱怪人
											game.players.removeArray(targets);
											if (isDead && hasRemain) game.players.add(origin_Onion);
											game.checkResult_GojoSatoru_yzs();
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
									_status.GojoSatoru_yzs = true;
								},
								[],
							];
						}
					}

					if (!get.attitude_GojoSatoru_yzs) {
						get.attitude_GojoSatoru_yzs = get.attitude;
						get.attitude = function (from, to) {
							if (from && from?.getStorage("GojoSatoru_yzs_source", false)) {
								from = from.getStorage("GojoSatoru_yzs_source", false);
							}
							if (to && to?.getStorage("GojoSatoru_yzs_source", false)) {
								to = to.getStorage("GojoSatoru_yzs_source", false);
							}
							let att = get.attitude_GojoSatoru_yzs(from, to);
							return att;
						};
					}
					const wtw = await game.addPlayerOL(pos, "GojoSatoru_yzs", null, true);
					game.broadcastAll((wtw) => {
						wtw.isNoPlayer_GojoSatoru_yzs = true;
						wtw.dieAfter2 = function () { };
					}, wtw)
					wtw.setStorage("GojoSatoru_yzs_source", pos);
					wtw.ai.modAttitudeFrom = function (from, to, att) {
						if (_status.GojoSatoru_yzs_source_att_ing) return att;
						if (from.getStorage("GojoSatoru_yzs_source", false)) {
							from = from.getStorage("GojoSatoru_yzs_source", false);
						}
						if (to.getStorage("GojoSatoru_yzs_source", false)) {
							to = to.getStorage("GojoSatoru_yzs_source", false);
						}
						_status.GojoSatoru_yzs_source_att_ing = true;
						att = get.attitude(from, to);
						delete _status.GojoSatoru_yzs_source_att_ing;
						return att;
					};
					game.broadcastAll((wtw, player) => {
						if (get.mode() == 'guozhan') {
							if (wtw.name2 == undefined) wtw.name2 = wtw.name1;
						}
						if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
							wtw.side = player.side;
							wtw.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
							wtw.node.identity.dataset.color = player.node.identity.dataset.color;
						}
						wtw.skillH = [];
						wtw.storage.zhibi = [];
						wtw.storage.stratagem_expose = [];
						wtw.storage.stratagem_fury = 0;
					}, wtw, pos);
					game.broadcastAll((wtw, player) => {
						const identity = (wtw.identity = (identity => {
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
						const goon = player !== game.me && wtw !== game.me && player.node.identity.classList.contains("guessing") && !player.identityShown;
						if (goon) {
							if (wtw.identityShown) delete wtw.identityShown;
							if (!wtw.node.identity.classList.contains("guessing")) wtw.node.identity.classList.add("guessing");
						}
						wtw.setIdentity(goon ? "cai" : undefined);
						if (wtw.node.dieidentity) wtw.node.dieidentity.innerHTML = get.translation(wtw.identity + 2);
						if (typeof player.ai?.shown === "number" && wtw.ai) wtw.ai.shown = player.ai.shown;
					}, wtw, pos);
					wtw.directgain(get.cards(4));
					game.broadcastAll(function (player2, wtw) {
						if (!_status.wtw_auto) {
							_status.wtw_auto = [player2.playerid, wtw.playerid];
						}
						else {
							_status.wtw_auto.push(wtw.playerid)
						}
						wtw._trueMe = player2;
						player2._trueMe = player2;
					}, pos, wtw)
					wtw.addSkill("challenger_yzs")
					wtw.addSkill("rg_treasure_ban")
					player.$fullscreenpop("史上最强 VS 现代最强")
					wtw.chat("会赢的")
					game.broadcastAll(() => {
						game.playAudio("ext:一中杀/audio/skill/wuxiaxianshushi_yzs2.MP3");
					});
				}
			}
		},
		locked: true,
		forced: true,
		nobracket: true,
		priority: 3,
		trigger: {
			global: "phaseBegin"
		},
		filter(event, player) {
			if (_status.currentPhase == player) return true;
			return player.countCards("h") < 4;
		},
		async content(event, trigger, player) {
			player.ai.modAttitudeTo = function (from, to, att) {
				//其他角色对你的态度
				return -999999;
			};
			player.ai.modAttitudeFrom = function (from, to, att) {
				//你对其他角色的态度
				return -999;
			};
			if (player.countCards("h") < 4) await player.drawTo(4);
			if (_status.currentPhase != player) return;
			let result = game.countPlayer(target => !target.hasSkill("hidden_yzs") && player != target) > 1 ? await player.chooseTarget(`诅咒之王：请选择1名其他角色`, `除其以外的其他角色依次可调离并摸1张牌`, true)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs")) && player != target;
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return -get.attitude(player2, target2)
				}).forResult() : { bool: true, targets: game.filterPlayer(target => !target.hasSkill("hidden_yzs") && player != target) }
			if (result?.bool && result?.targets?.length) {
				let targets = game.filterPlayer(target => player != target && !result.targets.includes(target));
				for (let target of targets) {
					let result2 = await target.chooseBool(`是否调离至本回合结束并摸1张牌？<br>(我打宿傩？真的假的)`)
						.set("ai", () => {
							return _status.event.bool;
						})
						.set(
							"bool",
							(function () {
								const player = get.event().player;
								return !player.isHealthy() || !player.countCards("h", { name: "tao" })
							})()
						)
						.forResult();
					if (result2?.bool) {
						await target.draw();
						await target.addTempSkill("diaohulishan");
					}
				}
			}
		}
	},
	shizhongyingfashu_yzs: {
		getYing(count) {
			var cards = [];
			if (typeof count != "number") {
				count = 1;
			}
			while (count--) {
				let card = game.createCard("ying", "spade", Math.ceil(13*Math.random()));
				cards.push(card);
			}
			return cards;
		},
		cards: ["yuquan_yzs", "ye_yzs", "dashe_yzs", "hama_yzs", "manxiang_yzs", "tuotu_yzs", "guanniu_yzs","yuanlu_yzs","huzang_yzs","moxuluo_yzs"],
		group: ["shizhongyingfashu_yzs_targeted", "shizhongyingfashu_yzs_use","shizhongyingfashu_yzs_break"],
		subSkill: {
			revive: {
				priority: 2131,
				popup: false,
				forced: true,
				trigger: {
					player:"dieBefore"
				},
				filter(event, player) {
					if (player.countMark("shizhongyingfashu_yzs_revive")) return false;
					return player.name == "MegumiSukuna_yzs";
				},
				async content(event, trigger, player) {
					player.addMark("shizhongyingfashu_yzs_revive",1,false)
					trigger.cancel();
					if (player.hasSkill("wuxiaxianshushi_yzs_ban")) {
						let result = await player.chooseButtonTarget()
							.set("createDialog", [
								`通过魔虚罗对无下限的适应，你已习得空间斩<br>你可立下束缚，立即发动一次【捌】。若全选，本次直接击杀目标`,
								[
									[
										[1, "此后【解】仅能指定距离1的角色-》本次造成伤害翻倍"],
										[2, "此后【捌】有距离限制-》本次【捌】不可响应"],
									],
									"textbutton",
								],
							])
							.set("selectButton", [1, Infinity])
							.set("filterButton", function (button) {
								return true;
							})
							.set("complexSelect", true)
							.set("filterTarget", (card, player, target) => {
								if (player == target) return false;
								if (target.hasSkill("hidden_yzs")) return false;
								return player.canUse({ name: "sha", isCard: true, storage: { ba_yzs: 1 } },target,false);
							})
							.set("ai1", button => {
								return Math.random() - 0.2;
							})
							.set("ai2", target => {
								const player = get.player();
								if (target.name == "GojoSatoru_yzs") return 114;
								return get.damageEffect(target, player,player)
							})
							.forResult();
						if (result?.bool && result.targets?.length && result.links?.length) {
							let target = result.targets[0];
							let jie = result.links.includes(1);
							let ba = result.links.includes(2);
							if (jie) {
								player.addMark("jie_yzs_weaken",1,false)
							}
							if (ba) {
								player.addMark("ba_yzs_weaken", 1, false)
							}
							if (jie && ba) {
								game.trySkillAudio("ba_yzs")
								target.playEffectOL(lib.skill.ba_yzs.Effect);
								await new Promise(r => setTimeout(r, 3000))
								await target.die({ source: player });
							} else {
								const card = new lib.element.VCard({
									name: "sha",
									isCard: true,
									storage: {
										ba_yzs: jie?2:1,
									}
								});
								let next = player.useCard(card, target, false);
								next.directHit = [target];
								await next;
							}
						}
					}

					for (let target of game.filterPlayer(cur => cur.name == "Makora_yzs")) {
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
					}
					await player.changeCharacter(["RyomenSukuna_yzs"])
					player.hp = 15;
					player.maxHp = 19;
					player.update();
				}
			},
			break: {
				priority:3,
				trigger: {
					player: "eventNeutralized",
				},
				filter(event, player) {
					if (event.type != "card" && event.name != "_wuxie") {
						return false;
					}
					return event.player == player && lib.skill.shizhongyingfashu_yzs.cards.includes(get.name(event.card));
				},
				forced: true,
				popup:false,
				async content(event, trigger, player) {
					player.markAuto("shizhongyingfashu_yzs_break", get.name(trigger.card))
					let names = lib.skill.shizhongyingfashu_yzs.cards.filter(card => card !="moxuluo_yzs"&&!player.storage.shizhongyingfashu_yzs_break.includes(card));

					var list = [];
					for (var i = 0; i < names.length; i++) {
						var name = names[i];
						list.push(["式神", "", name]);
					}

					let str = `你可将${get.translation(trigger.card)}与其余式神牌融合强化`;
					str += `<br>令目标牌获得效果：`;
					str += lib.card[get.name(trigger.card)].shizhongyingfashu_yzs;
					const result = await player.chooseButton([str, [list, "vcard"]])
						.forResult();
					if (result?.bool && result.links?.length) {
					//	game.log(result.links[0][2])
						lib.card[get.name(trigger.card)].shizhongyingfashu_yzs_effect(player, result.links[0][2]);
					}
				},
				mod: {
					cardEnabled(card, player) {
						if (player.storage.shizhongyingfashu_yzs_break?.includes(card.name)) return false;
					},
				},
			},
			use: {
				priority: 12,
				forced: true,
				popup:false,
				trigger: {
					player:"useCard1"
				},
				filter(event, player) {
					return !lib.skill.shizhongyingfashu_yzs.cards.includes(get.name(event.card));
				},
				async content(event, trigger, player) {
					await player.gain(lib.skill.shizhongyingfashu_yzs.getYing(), "gain2");
				}
			},
			targeted: {
				priority:-2,
				locked: true,
				usable:1,
				trigger: {
					target: "useCardToTarget",
				},
				filter(event, player) {
					const evt = event.getParent();
					if (evt?.targets?.length) {
						return event.player != player && game.hasPlayer(cur => cur.name == "Makora_yzs" && !evt.targets.includes(cur)&&cur!=evt.player);
					}
					return false;
				},
				async cost(event, trigger, player) {
					const evt = trigger.getParent();
					event.result = await player
						.chooseTarget()
						.set("filterTarget", (card, player, target) => {
							if (get.event().targets.includes(target)) return false;
							return target.name == "Makora_yzs" && !evt.targets.includes(target)
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
						.set("prompt2", `每回合限1次：其他角色使用牌指定你为目标时，若“${get.poptip("Makora_yzs")}”不为目标，你可将目标转移给“魔虚罗”`)
						.setHiddenSkill(event.name.slice(0, -5))
						.forResult();
				},
				async content(event, trigger, player) {
					const target = event.targets[0];
					const evt = trigger.getParent();
					evt.triggeredTargets2.remove(player);
					evt.targets.remove(player);
					evt.targets.push(target);
				},
			},
		},
		nobracket: true,
		locked: true,
		hiddenCard(player, name) {
			var list = lib.skill.shizhongyingfashu_yzs.cards.slice(0);
			return list.includes(name) && player.countCards("h");
		},
		init: function (player, skill) {
			player.addSkill("shizhongyingfashu_yzs_revive");
		},
		enable: ["chooseToUse"],
		filter(event, player) {
			if (event.responded || event.shizhongyingfashu_yzs) return false;
			var list = lib.skill.shizhongyingfashu_yzs.cards.slice(0);
			if (!list.length) {
				return false;
			}
			if (!player.countCards("h", {name:"ying"})) {
				return false;
			}
			for (var i of list) {
				let cost = lib.card[i].shizhongyingfashu_yzs_cost;
				if (player.countCards("h", { name: "ying" }) < cost)continue;
				if (event.filterCard(get.autoViewAs({ name: i, }, "unsure"), player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = lib.skill.shizhongyingfashu_yzs.cards.slice(0);
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					let cost = lib.card[i].shizhongyingfashu_yzs_cost;
					if (player.countCards("h", { name: "ying" }) < cost) continue;
					if (event.filterCard(get.autoViewAs({ name: i, isCard: false, }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("十种影法术", [list2, "vcard"]);
			},
			check(button) {
				return _status.event.player.getUseValue({ name: button.link[2], isCard: false, }, null, true);
			},
			backup(links, player) {
				let name = links[0][2];
				let cost = lib.card[name].shizhongyingfashu_yzs_cost;
				if (player.getStorage("manxiang_yzs").includes(name) && cost > 1) cost--;
				return {
					audio: "ext:一中杀/audio/skill:1",
					filterCard(card) {
						return get.name(card) == "ying";
					},
					selectCard: cost,
					position: "h",
					check(card) {
						return 7 - get.value(card);
					},
					popname: true,
					viewAs: {
						name: links[0][2],
						isCard: false,
					},
				};
			},
			prompt(links, player) {
				let name = links[0][2];
				let cost = lib.card[name].shizhongyingfashu_yzs_cost
				return "将"+cost+"张【影】当做【" + get.translation(name) + "】使用";
			},
		},
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (player == arg) {
					return false;
				}
				if (!_status.Makora_auto || !_status.Makora_auto.length) return false;
				if (_status.Makora_auto.includes(player.playerid) && _status.Makora_auto.includes(arg.playerid)) {
					return true;
				};
				return false;
			},
		},
	},
	fanzhuanshushi_yzs: {
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "蓄力技", "蓄能技", "连招技"],
		group: "fanzhuanshushi_yzs_use",
		subSkill: {
			use: {
				popup: false,
				priority: 33,
				trigger: {
					player: "useCardAfter"
				},
				filter(event, player) {
					const skills = player.getSkills(null, false, false).filter(skill => {
						let info = get.info(skill);
						if (!info || info.charlotte || get.skillInfoTranslation(skill, player).length == 0) {
							return false;
						}
						const categories = get.skillCategoriesOf(skill, player);
						return !categories.some(type => lib.skill.fanzhuanshushi_yzs.bannedType.includes(type)) && player.isTempBanned(skill);
					})
					if (!skills.length) return;
					return event.card.storage.fanzhuanshushi_yzs && event.cards?.length == 2 && get.number(event.cards[0]) == get.number(event.cards[1])
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					const skills = player.getSkills(null, false, false).filter(skill => {
						let info = get.info(skill);
						if (!info || info.charlotte || get.skillInfoTranslation(skill, player).length == 0) {
							return false;
						}
						const categories = get.skillCategoriesOf(skill, player);
						return !categories.some(type => lib.skill.fanzhuanshushi_yzs.bannedType.includes(type)) && player.isTempBanned(skill);
					})
					let result = await player
						.chooseButton(["反转术式：恢复一个已失效的技能", [skills, "skill"]])
						.set("displayIndex", false)
						.set("listx", skills)
						.forResult();
					if (result?.bool && result?.links?.length) {
						event.result = { bool: true, cost_data: result.links[0] }
					}
				},
				async content(event, trigger, player) {
					let skill = event.cost_data;
					game.log(player, `使用反转术式修复了熔断的术式：${get.translation(skill)}`)
					delete player.storage[`temp_ban_${skill}`]
				},
			}
		},
		locked: true,
		nobracket: true,
		enable: ["chooseToUse"],
		filterCard: true,
		selectCard: 2,
		position: "hs",
		viewAs: {
			name: "tao",
			storage: {
				fanzhuanshushi_yzs: true,
			}
		},
		mod: {
			playerEnabled(card, player, target) {
				if (card?.storage?.fanzhuanshushi_yzs && player !== target && card?.name == "tao") {
					return false;
				}
			},
			cardSavable(card, player) {
				if (card?.storage?.fanzhuanshushi_yzs && player !== _status.event.dying && card?.name === "tao") {
					return false;
				}
			},
		},
		prompt: "你可将2张手牌当做【桃】对自己使用，结算后若这两张牌点数相同，你再恢复一个已失效的技能",
		viewAsFilter(player) {
			return player.countCards("h") > 1;
		},
		check(card) {
			let v = 0;
			if (ui.selected?.cards?.length && get.number(card) == get.number(ui.selected.cards[0])) v = 5;
			if (_status.event.name == "chooseToRespond") {
				if (card.name == "tao") {
					return 0 + v;
				}
				return 6 - get.useful(card) + v;
			}
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
	jie_yzs: {
		Effect: function (targetPlayer) {
			const duration = 3000;
			const slashLife = 500;
			const container = document.body;
			const gameWindow = document.getElementById('window');

			// 【记录原始属性以便恢复】
			const oldZIndex = targetPlayer.style.zIndex;
			const oldRelative = targetPlayer.style.position;

			// 【修正：确保 targetPlayer 在 Canvas 之上或同层，避免被遮挡】
			// 很多时候头像没消失，只是被 Canvas 及其父级的层级关系挡住了
			targetPlayer.style.zIndex = "10000";
			if (!oldRelative || oldRelative === 'static') {
				targetPlayer.style.position = 'relative';
			}

			const canvas = document.createElement('canvas');
			const vw = window.innerWidth, vh = window.innerHeight;
			canvas.width = vw; canvas.height = vh;
			// Canvas 层级设为 9999
			canvas.style.cssText = 'position:fixed; left:0; top:0; width:100%; height:100%; z-index:9999; pointer-events:none; backface-visibility:hidden;';
			container.appendChild(canvas);

			const ctx = canvas.getContext('2d');
			const diagonal = Math.sqrt(vw * vw + vh * vh);
			let slashes = [];

			const createSlash = (x, y) => {
				const baseWidth = Math.random() < 0.2 ? (Math.random() * 45 + 8) : (Math.random() * 9 + 1);
				slashes.push({
					x, y,
					angle: Math.random() * Math.PI,
					isBlack: Math.random() > 0.2,
					width: baseWidth,
					startTime: Date.now()
				});
			};

			const applyImpact = (intensity) => {
				const sx = (Math.random() - 0.5) * intensity;
				const sy = (Math.random() - 0.5) * intensity;
				gameWindow.style.transform = `translate(${sx}px, ${sy}px)`;

				// 【修正：限制位移幅度并加入 translateZ(0) 强制渲染】
				const tx = (Math.random() - 0.5) * Math.min(intensity * 2, 20);
				const ty = (Math.random() - 0.5) * Math.min(intensity * 2, 20);
				targetPlayer.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.05)`;

				if (Math.random() > 0.8) {
					targetPlayer.style.filter = 'invert(1) brightness(1.5) contrast(150%)';
				} else {
					targetPlayer.style.filter = 'contrast(120%) brightness(1.1)';
				}
			};

			let effectStart = Date.now();
			const animate = () => {
				const now = Date.now();
				const totalElapsed = now - effectStart;

				if (totalElapsed > duration && slashes.length === 0) {
					canvas.remove();
					gameWindow.style.transform = '';
					// 【恢复原始属性】
					targetPlayer.style.transform = '';
					targetPlayer.style.filter = '';
					targetPlayer.style.zIndex = oldZIndex;
					targetPlayer.style.position = oldRelative;
					return;
				}

				ctx.clearRect(0, 0, vw, vh);

				if (totalElapsed < duration) {
					if (Math.random() > 0.4) {
						createSlash(Math.random() * vw, Math.random() * vh);
					}
					applyImpact(Math.max(1, 12 * (1 - totalElapsed / duration)));
				}

				slashes = slashes.filter(s => {
					const age = now - s.startTime;
					if (age > slashLife) return false;
					const lifeRatio = 1 - (age / slashLife);
					const currentWidth = s.width * lifeRatio;

					ctx.save();
					ctx.translate(s.x, s.y);
					ctx.rotate(s.angle);
					ctx.globalAlpha = lifeRatio;

					ctx.beginPath();
					ctx.lineWidth = currentWidth + (s.width * 0.4);
					ctx.strokeStyle = s.isBlack ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
					ctx.moveTo(-diagonal, 0);
					ctx.lineTo(diagonal, 0);
					ctx.stroke();

					ctx.beginPath();
					ctx.lineWidth = currentWidth;
					ctx.strokeStyle = s.isBlack ? 'black' : 'white';
					ctx.moveTo(-diagonal, 0);
					ctx.lineTo(diagonal, 0);
					ctx.stroke();

					ctx.restore();
					return true;
				});
				requestAnimationFrame(animate);
			};

			requestAnimationFrame(animate);
		},
		audio: "ext:一中杀/audio/skill:2",
		enable: "phaseUse",
		filter(event, player) {
			return game.countPlayer(function (target) {
				return lib.skill.jie_yzs.filterTarget(null, player, target)
			}) > 0
		},
		filterTarget: function (card, player, target) {
			if (player.countMark("jie_yzs_weaken") && get.distance(player, target) > 1) return false;
			return !target.hasSkill("hidden_yzs") && player != target;
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			await player.tempBanSkill(event.name);
			event.target.playEffectOL(lib.skill.jie_yzs.Effect);
			await player.discardPlayerCard(event.target, 'h', true);
			await player.discardPlayerCard(event.target, 'e', true);
			await event.target.damage();
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					return get.damageEffect(target, player, target);
				},
			},
			expose: 0.3,
			threaten: 1.2,
		},
	},
	ba_yzs: {
		Effect: function (target) {
			const duration = 3000;
			const slashLife = 600;
			const container = document.body;
			const gameWindow = document.getElementById('window');

			// 1. 关键修复：防止本体在伤害更新时闪现
			// 给本体打上标记，防止其他函数（如伤害闪烁）在特效期间修改它
			const originalStyle = target.getAttribute('style') || '';
			target.classList.add('in-slash-animation');

			// 使用强制样式遮蔽：无论游戏本体怎么改 visibility，我们通过 style 优先级压死它
			target.style.setProperty('visibility', 'hidden', 'important');
			target.style.setProperty('opacity', '0', 'important');
			target.style.setProperty('pointer-events', 'none', 'important');

			// 2. 画布与位置获取 (同前)
			const canvas = document.createElement('canvas');
			const vw = window.innerWidth, vh = window.innerHeight;
			canvas.width = vw; canvas.height = vh;
			canvas.style.cssText = 'position:fixed; left:0; top:0; width:100%; height:100%; z-index:20000; pointer-events:none;';
			container.appendChild(canvas);
			const ctx = canvas.getContext('2d');
			const rect = target.getBoundingClientRect();
			const centerY = rect.top + rect.height / 2;

			// 3. 创建切片 (同前)
			const createHalf = (isUpper) => {
				const half = target.cloneNode(true);
				// 移除克隆体身上的标记类，确保切片可见
				half.classList.remove('in-slash-animation');
				half.style.position = 'fixed';
				half.style.top = rect.top + 'px';
				half.style.left = rect.left + 'px';
				half.style.width = rect.width + 'px';
				half.style.height = rect.height + 'px';
				half.style.margin = '0';
				half.style.visibility = 'visible';
				half.style.opacity = '1';
				half.style.zIndex = '20001';
				half.style.transition = `transform ${duration / 1000}s cubic-bezier(0.15, 0.85, 0.3, 1)`;
				half.style.clipPath = isUpper ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)';
				container.appendChild(half);
				return half;
			};

			const upperPart = createHalf(true);
			const lowerPart = createHalf(false);

			// 4. 执行分离动画
			requestAnimationFrame(() => {
				upperPart.style.transform = `translate(${-rect.width * 0.2}px, -15px) rotate(-10deg)`;
				lowerPart.style.transform = `translate(${rect.width * 0.1}px, 10px) rotate(5deg)`;
			});

			// 5. 渲染循环
			let effectStart = Date.now();
			const animate = () => {
				const now = Date.now();
				const age = now - effectStart;

				if (age > duration) {
					// --- 特效结束逻辑 ---
					canvas.remove();
					upperPart.remove();
					lowerPart.remove();

					// 恢复本体状态
					target.classList.remove('in-slash-animation');
					target.setAttribute('style', originalStyle); // 彻底还原初始样式字符串
					gameWindow.style.transform = '';
					return;
				}

				ctx.clearRect(0, 0, vw, vh);
				// 绘制斩击 (略，保持之前的逻辑)
				if (age < slashLife) {
					const lifeRatio = 1 - (age / slashLife);
					const curW = 25 * lifeRatio;
					ctx.save();
					ctx.globalAlpha = lifeRatio;
					const sx = (Math.random() - 0.5) * 15 * lifeRatio;
					gameWindow.style.transform = `translate(${sx}px, 0)`;
					ctx.beginPath();
					ctx.lineWidth = curW + 10;
					ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
					ctx.moveTo(0, centerY);
					ctx.lineTo(vw, centerY);
					ctx.stroke();
					ctx.beginPath();
					ctx.lineWidth = curW;
					ctx.strokeStyle = 'black';
					ctx.moveTo(0, centerY);
					ctx.lineTo(vw, centerY);
					ctx.stroke();
					ctx.restore();
				}
				requestAnimationFrame(animate);
			};

			animate();
		},
		subSkill: {
			damage: {
				audio: "ba_yzs",
				priority: 321,
				trigger: {
					source: "damageBegin1",
				},
				filter(event, player) {
					if (event.player.maxHp < 1) return false;
					return event.card && event.card.storage.ba_yzs && (event.card.name == "sha") && event.notLink();
				},
				forced: true,
				async content(event, trigger, player) {
					trigger.player.playEffectOL(lib.skill.jie_yzs.Effect);
					trigger.num += Math.min(Math.ceil(trigger.player.maxHp / 2), 5) - 1;
					trigger.num *= trigger.card.storage.ba_yzs
				},
				ai: {
					damageBonus: true,
				},
			},
			use: {
				priority: 4,
				popup: false,
				direct: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.ba_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		init: function (player, skill) {
			player.addSkill(["ba_yzs_use", "ba_yzs_damage"]);
		},
		enable: "phaseUse",
		filter(event, player) {
			return (
				event.filterCard &&
				event.filterCard(
					{
						name: "sha",
						isCard: true,
						storage: {
							ba_yzs: 1,
						}
					},
					player,
					event
				)
			);
		},
		viewAs(cards, player) {
			return {
				name: "sha",
				isCard: true,
				storage: {
					ba_yzs: 1,
				}
			};
		},
		filterCard: () => false,
		selectCard: -1,
		prompt: "出牌阶段，你可视为使用无次数、距离限制的【杀】，此【杀】伤害值改为目标角色体力上限的一半（向上取整至多为5），然后本技能本回合失效",
		log: false,
		check: () => 1,
		precontent() {
			player.addSkill(["ba_yzs_use", "ba_yzs_damage"]);
			player.tempBanSkill("ba_yzs");
		},
		mod: {
			targetInRange(card, player) {
				if (player.countMark("ba_yzs_weaken")) return;
				if (card?.storage?.ba_yzs) {
					return true;
				}
			},
			cardUsable(card, player, num) {
				if (card?.storage?.ba_yzs) {
					return Infinity
				}
			},
		},
		ai: {
			order: 3.4,
			respondSha: true,
			skillTagFilter(player, tag) {
				return tag == "respondSha"
			},
		},
	},
	fumoyuchuzi_yzs: {
		locked: true,
		enable: "phaseUse",
		usable: 1,
		domain: true,
		nobracket:true,
		position: "h",
		filterCard: true,
		selectCard: [1, Infinity],
		allowChooseAll: true,
		prompt: `${get.poptip("lingyuzhankai_yzs")}：你使用的牌不可响应。其他角色的回合结束时，你对其发动${get.poptip("jie_yzs")}`,
		check(card) {
			let player = _status.event.player;
			return 8 - get.value(card);
		},
		filter(event, player) {
			return _status._yzsDomainPlayer != player && player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			if (!_status._yzsDomain ||typeof _status._yzsDomainCount!="number" || event.cards.length > _status._yzsDomainCount) {
				game.broadcastAll((time) => {
					var video = document.createElement("VIDEO");
					video.className = "anime";

					Object.assign(video, {
						src: lib.assetURL + "/extension/一中杀/image/background/fumoyuchuzi_yzs.MP4",
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
					// 1. 设置音频路径
					_status.tempMusic = `ext:一中杀/audio/Malevolent Shrine.mp3`;

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
				}, 48.5);
			}
			let result = await player.yzs_ExpandDomain(event.name, event.cards.length).forResult();
		},
		ai: {
			order(item, player2) {
				if (_status._yzsDomainPlayer != player2 && _status._yzsDomain =="wuliangkongchu_yzs")return 10
				return 1;
			},
			result: {
				player: 1,
			},
			threaten: 1.5,
		},
	},
	fumoyuchuzi_yzs_skill: {
		locked: true,
		popup: false,
		domainskill: true,
		forced: true,
		trigger: {
			player: ["phaseEnd", "useCard"],
		},
		filter(event, player) {
			if (event.name == "useCard") {
				return event.player == _status._yzsDomainPlayer && !event.fumoyuchuzi_yzs_skill_buff
			}
			if (player == _status._yzsDomainPlayer) return false;
			if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
			return get.itemtype(_status._yzsDomainPlayer) == "player" 
		},
		async content(event, trigger, player) {
			if (trigger.name == "useCard") {
				trigger.fumoyuchuzi_yzs_skill_buff = true;
				trigger.directHit.addArray(game.filterPlayer(cur => !cur.hasSkill("SimpleDomain_yzs_buff")&&cur!=player))
				return;
			}
			let next = _status._yzsDomainPlayer.useSkill("jie_yzs")
			next.targets = [player];
			await next;
		},
		priority: -25,
	},
	//魔虚罗
	Makora_auto: {
		trigger: {
			player: ["playercontrol", "chooseToUseBegin", "chooseToRespondBegin", "chooseToDiscardBegin", "chooseToCompareBegin", "chooseButtonBegin", "chooseCardBegin", "chooseTargetBegin", "chooseCardTargetBegin", "chooseControlBegin", "chooseBoolBegin", "choosePlayerCardBegin", "discardPlayerCardBegin", "gainPlayerCardBegin", "dieAfter"],
		},
		firstDo: true,
		forced: true,
		priority: 999,
		forceDie: true,
		charlotte: true,
		popup: false,
		silent: true,
		filter: function (event, player) {
			if (!_status.Makora_auto || !_status.Makora_auto.includes(player.playerid)) return false;
			if (event.autochoose && event.autochoose()) return false;
			//if (lib.filter.wuxieSwap(event)) return false;
			return true;
		},
		async content(event, trigger, player) {
			if (trigger.name == 'die') {
				const map = lib.playerOL ?? game.playerMap;
				for (const id of _status.Makora_auto) {
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
							if (player == game.me) game.swapPlayerAuto(current);
						};
						break;
					};
				};
				return;
			}
			if (!player.isAlive()) return;
			if (_status.Makora_auto.includes(player.playerid) && (_status.connectMode ? (!player.isOnline2() || player != game.me) : true)) {
				const map = lib.playerOL ?? game.playerMap;
				for (const id of _status.Makora_auto) {
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
	hundunyutiaohe_yzs: {
		Effect: function (player) {
			// 1. 创建图片元素并设置基础样式
			const img = document.createElement('img');
			img.src = lib.assetURL + "/extension/一中杀/image/hundunyutiaohe_yzs.png",
			img.style.position = 'absolute';
			img.style.left = '50%';
			img.style.top = '20%';
			img.style.transform = 'translate(-50%, -50%)'; // 居中
			img.style.width = '120px';  // 根据实际头像大小调整
			img.style.height = '120px';
			img.style.zIndex = '50';
			img.style.pointerEvents = 'none'; // 防止遮挡点击
			img.style.opacity = '0'; // 初始透明

			player.appendChild(img);

			// 2. 定义动画序列
			// 关键帧解释：
			// 0% - 20%: 0s-1s 谈入（平滑生成）
			// 20% - 40%: 1s-2s 停顿展示
			// 40% - 60%: 2s-3s 顺时针旋转90度
			// 60% - 80%: 3s-4s 再次停顿
			// 80% - 100%: 4s-5s 淡出（平滑消失）
			const keyframes = [
				{ opacity: 0, transform: 'translate(-50%, -50%) rotate(0deg)', offset: 0 },
				{ opacity: 1, transform: 'translate(-50%, -50%) rotate(0deg)', offset: 0.1 },
				{ opacity: 1, transform: 'translate(-50%, -50%) rotate(0deg)', offset: 0.2 },
				{ opacity: 1, transform: 'translate(-50%, -50%) rotate(90deg)', offset: 0.4 },
				{ opacity: 1, transform: 'translate(-50%, -50%) rotate(90deg)', offset: 0.8 },
				{ opacity: 0, transform: 'translate(-50%, -50%) rotate(90deg)', offset: 1 }
			];

			const animation = img.animate(keyframes, {
				duration: 2000, // 总时长5秒 (生成1s + 停顿1s + 旋转1s + 停顿1s + 消失1s)
				easing: 'ease-in-out',
				fill: 'forwards'
			});

			// 3. 动画结束后自动销毁 DOM 节点
			animation.onfinish = () => {
				img.remove();
			};
		},
		group: ["hundunyutiaohe_yzs_damage", "hundunyutiaohe_yzs_skill1", "hundunyutiaohe_yzs_skill2", "hundunyutiaohe_yzs_skill3"],
		subSkill: {
			damage: {
				priority: 22,
				trigger: {
					source:"damageBegin1"
				},
				popup: false,
				forced: true,
				filter(event, player) {
					return event.player != player;
				},
				async content(event, trigger, player) {
					const target = trigger.player;
					if (!player.storage.hundunyutiaohe_yzs_damage) player.storage.hundunyutiaohe_yzs_damage = {};
					if (!player.storage.hundunyutiaohe_yzs_damage[target.playerid]) player.storage.hundunyutiaohe_yzs_damage[target.playerid] = 0;
					trigger.num *= Math.floor(player.storage.hundunyutiaohe_yzs_damage[target.playerid] / 2) + 1;
					player.storage.hundunyutiaohe_yzs_damage[target.playerid]++;
					if (player.storage.hundunyutiaohe_yzs_damage[target.playerid] % 2==0) {
						game.trySkillAudio("hundunyutiaohe_yzs")
						player.playEffectOL(lib.skill.hundunyutiaohe_yzs.Effect);
					};
					player.popup("适应")
				},
			},
			skill1: {
				forced: true,
				popup: false,
				locked: true,
				priority: 211,
				trigger: {
					global: "useSkill",
				},
				filter(event, player) {
					if (player == event.player) return false;
					return event.targets.includes(player);
				},
				async content(event, trigger, player) {
					if (!player.storage.hundunyutiaohe_yzs_skill) player.storage.hundunyutiaohe_yzs_skill = {};
					if (!player.storage.hundunyutiaohe_yzs_skill[trigger.skill]) player.storage.hundunyutiaohe_yzs_skill[trigger.skill] = 0;
					if (player.storage.hundunyutiaohe_yzs_skill[trigger.skill] >= 2) {
						player.popup("适应");
						trigger.cancel();
					}
					player.storage.hundunyutiaohe_yzs_skill[trigger.skill]++;
					player.markSkill("hundunyutiaohe_yzs_skill")
					if (player.storage.hundunyutiaohe_yzs_skill[trigger.skill] == 2) {
						player.popup("适应");
						game.trySkillAudio("hundunyutiaohe_yzs");
						player.playEffectOL(lib.skill.hundunyutiaohe_yzs.Effect);
						game.log(player, `适应了`, trigger.skill)
					}
				},
			},
			skill2: {
				forced: true,
				popup: false,
				priority: 213,
				trigger: {
					global: ["logSkillBegin"],
				},
				filter(event, player) {
					if (["global", "equip"].includes(event.type)) {
						return false;
					}
					if (event.player == player) return false;
					let skill = get.sourceSkillFor(event);
					if (!skill || skill === "hundunyutiaohe_yzs" || lib.skill.hundunyutiaohe_yzs.group.includes(skill)) {
						return false;
					}
					let info = get.info(skill);
					if (!info || info.charlotte || info.equipSkill) {
						return false;
					}

					let evt = event.getParent(3);
					if (!evt || !evt.name) return false;
					if (evt.name == "damage") {
						return evt.source == player
					} else if (["useCard", "useCardToPlayer", "useCardToTarget", "useCardToPlayered", "useCardToTargeted"].includes(evt.name)) {
						return evt.player == player
					}

					return false;
				},
				async content(event, trigger, player) {
					let skill = get.sourceSkillFor(trigger);
					if (!player.storage.hundunyutiaohe_yzs_skill2) player.storage.hundunyutiaohe_yzs_skill2 = {};
					if (!player.storage.hundunyutiaohe_yzs_skill2[skill]) player.storage.hundunyutiaohe_yzs_skill2[skill] = 0;
					if (player.storage.hundunyutiaohe_yzs_skill2[skill] >= 2) {
						if (!lib.skill.hundunyutiaohe_yzs_skill4.trigger.global.includes(skill + "Begin")) {
							game.trySkillAudio("hundunyutiaohe_yzs");
							player.playEffectOL(lib.skill.hundunyutiaohe_yzs.Effect);
							game.log(player, `适应了`, skill)
							lib.skill.hundunyutiaohe_yzs_skill4.trigger.global.push(skill + "Begin");
							player.removeSkill("hundunyutiaohe_yzs_skill4")
							if (skill == "wuxiaxianshushi_yzs") {
								for (let target of game.filterPlayer(cur => cur.hasSkill("zuzhouzhiwang_yzs"))) {
									target.addSkill("wuxiaxianshushi_yzs_ban")
								}
							}
							//		game.log(lib.skill.hundunyutiaohe_yzs_skill4.trigger.global);
						}
						player.addSkill("hundunyutiaohe_yzs_skill4")
					}
					player.storage.hundunyutiaohe_yzs_skill2[trigger.skill]++;
					player.markSkill("hundunyutiaohe_yzs_skill")
				},
			},
			skill3: {
				forced: true,
				popup: false,
				locked: true,
				priority: 111,
				trigger: {
					player: ["damageBefore","loseHpBefore","loseMaxHpBefore"],
				},
				filter(event, player) {
					let evt = event.getParent();
					if (!evt || !evt.name) return false;
					return lib.skill[evt.name] && lib.skill[evt.name].content;
				},
				async content(event, trigger, player) {
					if (!player.storage.hundunyutiaohe_yzs_skill3) player.storage.hundunyutiaohe_yzs_skill3 = {};
					if (!player.storage.hundunyutiaohe_yzs_skill3[trigger.skill]) player.storage.hundunyutiaohe_yzs_skill3[trigger.skill] = 0;
					if (player.storage.hundunyutiaohe_yzs_skill3[trigger.skill] >= 2) {
						if (player.storage.hundunyutiaohe_yzs_skill3[trigger.skill] == 2) {
							player.playEffectOL(lib.skill.hundunyutiaohe_yzs.Effect);
							game.trySkillAudio("hundunyutiaohe_yzs");
						}
						player.popup("适应");
						trigger.cancel();
					}
					player.storage.hundunyutiaohe_yzs_skill3[trigger.skill]++;
					player.markSkill("hundunyutiaohe_yzs_skill3")
				}
			},
			skill4: {
				forced: true,
				popup: false,
				locked: true,
				priority: 211,
				trigger: {
					global: [],
				},
				filter(event, player) {
					if (event.player == player) return false;
					let evt = event.getParent(3);
					if (!evt || !evt.name) return false;
					return true;
					if (evt.name == "damage") {
						return evt.source == player
					} else if (["useCard", "useCardToPlayer", "useCardToTarget", "useCardToPlayered", "useCardToTargeted"].includes(evt.name)) {
						return evt.player == player
					}
					return false;
				},
				async content(event, trigger, player) {
					player.popup("适应");
					trigger.cancel();
				}
			},
		},
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		forced: true,
		popup:false,
		persevereSkill: true,
		priority: 21,
		trigger: {
			target: "useCardToBefore",
		},
		filter(event, player) {
			if (get.name(event.card) == "moxuluo_yzs") return false;
			return event.player != player
		},
		async content(event, trigger, player) {
			if (!player.storage.hundunyutiaohe_yzs_card) player.storage.hundunyutiaohe_yzs_card = {};
			if (!player.storage.hundunyutiaohe_yzs_card[get.name(trigger.card)]) player.storage.hundunyutiaohe_yzs_card[get.name(trigger.card)] = 0;
			if (player.storage.hundunyutiaohe_yzs_card[get.name(trigger.card)] >= 2) {
				player.popup("适应");
				trigger.cancel();
			}
			player.storage.hundunyutiaohe_yzs_card[get.name(trigger.card)]++;
			player.markSkill("hundunyutiaohe_yzs_card")
			if (player.storage.hundunyutiaohe_yzs_card[get.name(trigger.card)] == 2) {
				player.playEffectOL(lib.skill.hundunyutiaohe_yzs.Effect);
				player.popup("适应");
				game.trySkillAudio("hundunyutiaohe_yzs");
				game.log(player, `适应了`, trigger.card)
			}
		},
	},
	tuimozhijian_yzs: {
		locked: true,
		nobracket: true,
		group: ["qinggang_skill"],
		mod: {
			attackRange(player, num) {
				return num + 2;
			},
		},
		priority: 11,
		trigger: {
			player: "useCard",
		},
		filter: function (event, player) {
			return event.card.name == "sha"
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.directHit.addArray(game.filterPlayer())
		},
	},
	//两面宿傩
	liangmianguishen_yzs: {
		group: "liangmianguishen_yzs_turnOver",
		subSkill: {
			turnOver: {
				popup: false,
				forced: true,
				priority: 312,
				trigger: {
					player: "turnOverBefore",
				},
				filter: function (event, player) {
					return !player.isTurnedOver();
				},
				async content(event, trigger, player) {
					trigger.cancel();
				}
			},
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + 1;
			},
		},
		locked: true,
		nobracket: true,
		forced: true,
		priority: 21,
		trigger: {
			player: "phaseEnd"
		},
		filter(event, player) {
			return !event.skill
		},
		async content(event, trigger, player) {
			player.insertPhase().skill = "liangmianguishen_yzs";
		}
	},
	//五条悟
	challenger_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		skillAnimation: true,
		animationColor: "thunder",
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.removeSkill(event.name)
			game.broadcastAll(function (current) {
				ui.background.setBackgroundImage('extension/一中杀/image/background/challenger_yzs.png');
			}, player)
			player.insertPhase();
		},
	},
	wtw_auto: {
		trigger: {
			player: ["playercontrol", "chooseToUseBegin", "chooseToRespondBegin", "chooseToDiscardBegin", "chooseToCompareBegin", "chooseButtonBegin", "chooseCardBegin", "chooseTargetBegin", "chooseCardTargetBegin", "chooseControlBegin", "chooseBoolBegin", "choosePlayerCardBegin", "discardPlayerCardBegin", "gainPlayerCardBegin", "dieAfter"],
		},
		firstDo: true,
		forced: true,
		priority: 999,
		forceDie: true,
		charlotte: true,
		popup: false,
		silent: true,
		filter: function (event, player) {
			if (!_status.wtw_auto || !_status.wtw_auto.includes(player.playerid)) return false;
			if (event.autochoose && event.autochoose()) return false;
			//if (lib.filter.wuxieSwap(event)) return false;
			return true;
		},
		async content(event, trigger, player) {
			if (trigger.name == 'die') {
				const map = lib.playerOL ?? game.playerMap;
				for (const id of _status.wtw_auto) {
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
			if (_status.wtw_auto.includes(player.playerid) && (_status.connectMode ? (!player.isOnline2() || player != game.me) : true)) {
				const map = lib.playerOL ?? game.playerMap;
				for (const id of _status.wtw_auto) {
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
	SixEyes_yzs: {
		group: ["SixEyes_yzs_revive"],
		subSkill: {
			revive: {
				audio: "ext:一中杀/audio/skill:2",
				forced: true,
				forceDie:true,
				priority: 13,
				trigger: {
					player:"reviveEnd"
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/GojoSatoru_yzs.png");
					}, player)
					for (let target of game.filterPlayer(cur => cur.hasSkill("zuzhouzhiwang_yzs"))) {
						target.chat("真的假的？")
					}
				}
			},
		},
		locked: true,
		onremove: true,
		mark: true,
		intro: {
			mark(dialog, content, player) {
				if (player != game.me) {
					return get.translation(player) + "观看牌堆中...";
				}
				if (get.itemtype(_status.pileTop) != "card") {
					return "牌堆顶无牌";
				}
				dialog.add([_status.pileTop]);
			},
		},
		audio: "wuxiaxianshushi_yzs",
		forced: true,
		priority: -23,
		trigger: {
			player: ["phaseEnd"]
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			player.ai.modAttitudeFrom = function (from, to, att) {
				//你对其他角色的态度
				if (to.hasSkill("zuzhouzhiwang_yzs"))return -999
			};
			await player.drawTo(6);
	//		if (player.countCards("h") > 6) await player.chooseToDiscard(player.countCards("h") - 6, true)
		}
	},
	wuxiaxianshushi_yzs: {
		group: ["wuxiaxianshushi_yzs_use"],
		subSkill: {
			ban: {
				charlotte: true,
			},
			die: {
				forceDie:true,
				forced: true,
				popup: false,
				priority: 314,
				trigger: {
					player: "dieAfter",
				},
				filter(event, player) {
					return player.name == "GojoSatoru_yzs" && event.source && event.source.isAlive();
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/GojoSatoru_yzs_die.png");
					}, player)
					let name = get.translation(trigger.source);
					if(name.includes("宿傩"))name="宿傩"
					player.chat(`没能让${name}大人尽兴，真是抱歉啊`)
					trigger.source.chat("令人愉悦！")
					setTimeout(() => {
						trigger.source.chat(`${get.translation(player)}，我大概这辈子都不会忘了你吧`)
					}, 1500)
				},
			},
			use: {
				mark: true,
				marktext: "无",
				intro: {
					markcount: "storage",
					mark(dialog, content, player) {
						const storage = player.getStorage("wuxiaxianshushi_yzs_use")
						if (storage.length) {
							dialog.addText(`已连续使用的点数：`);
							let str = ``;
							for (let num of storage) {
								str += num + ' ';
							}
							dialog.addText(str);
						} 
					},
				},
				priority:31,
				trigger: {
					player: "useCard1",
				},
				forced: true,
				popup: false,
				filter(event, player) {
					return typeof get.number(event.card) == "number" && !["wtwCang_yzs","wtwHe_yzs"].includes(get.name(event.card))
				},
				async content(event, trigger, player) {
					if (!player.storage.wuxiaxianshushi_yzs_use || !player.storage.wuxiaxianshushi_yzs_use.length) {
						player.markAuto("wuxiaxianshushi_yzs_use", get.number(trigger.card))
					} else if (player.storage.wuxiaxianshushi_yzs_use.length == 1) {
						const last = Number(player.storage.wuxiaxianshushi_yzs_use.slice(-1));
						if (last == get.number(trigger.card)) {
							player.storage.wuxiaxianshushi_yzs_use = [last];
							player.markSkill("wuxiaxianshushi_yzs_use")
						} else {
							player.markAuto("wuxiaxianshushi_yzs_use", get.number(trigger.card))
						}
					} else {
						const last = Number(player.storage.wuxiaxianshushi_yzs_use.slice(-1));
						const first = Number(player.storage.wuxiaxianshushi_yzs_use[0]);
						const second = Number(player.storage.wuxiaxianshushi_yzs_use[1]);
						if (second > first) {
							if (get.number(trigger.card) > last) {
								player.markAuto("wuxiaxianshushi_yzs_use", get.number(trigger.card))
							} else {
								game.trySkillAudio("wuxiaxianshushi_yzs");
								const num = player.storage.wuxiaxianshushi_yzs_use.length;
								player.popup("赫")
								await player.gain(game.createCard("wtwHe_yzs", "red", num))
								player.storage.wuxiaxianshushi_yzs_use = [get.number(trigger.card)];
								player.markSkill("wuxiaxianshushi_yzs_use")
							}
						} else {
							if (get.number(trigger.card) < last) {
								player.markAuto("wuxiaxianshushi_yzs_use", get.number(trigger.card))
							} else {
								game.trySkillAudio("wuxiaxianshushi_yzs");
								const num = player.storage.wuxiaxianshushi_yzs_use.length;
								player.popup("苍")
								await player.gain(game.createCard("wtwCang_yzs", "black", num))
								player.storage.wuxiaxianshushi_yzs_use = [get.number(trigger.card)];
								player.markSkill("wuxiaxianshushi_yzs_use")
							}
						}
					}
					player.addTip("wuxiaxianshushi_yzs_use", `无下限  ${get.number(trigger.card)}`, false);
				},
			},
		},
		audio: "ext:一中杀/audio/skill:5",
		nobracket: true,
		priority: 12,
		init: function (player, skill) {
			player.addSkill("wuxiaxianshushi_yzs_die");
		},
		trigger: {
			player:"damageBegin3"
		},
		filter(event, player) {
			if (event.source?.hasSkill("wuxiaxianshushi_yzs_ban")) return false;
			if (get.itemtype(_status._yzsDomainPlayer) == "player" && _status._yzsDomainPlayer != player) return false;
			return (player.countCards("h") > 0) && event.num > 0
		},
		async cost(event, trigger, player) {
			let str = `你 即将受到${trigger.source ? ` ${get.translation(trigger.source)} 造成的` : ``} ${trigger.num} 点${trigger.source ? `` : `无来源`} 伤害`;
			str +=`你可弃置任意张手牌令伤害值减少等量点`
			str +=`<br>然后你摸1张牌。若所弃的牌与摸的牌花色有不同，本技能本回合失效`
			let next = player.chooseToDiscard(player, "h");
			next.set("filterCard", (card) => true)
			next.set("selectCard", [1,trigger.num])
			next.set("prompt", str)
			next.set("ai", card => {
				return 6 - get.value(card);
			})
			next.set("chooseonly", true)
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards)
			trigger.num -= event.cards.length;
			let result = await player.draw().forResult();
			let cards = event.cards.concat(result.cards)
			let suits = get.suit(cards[0]);
			if (cards.some(card => !suits.includes(get.suit(card))))await player.tempBanSkill(event.name);
		},
	},
	xushici_yzs: {
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
				onremove:true,
			},
			sing1: {
				name:"九纲",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					if (player.getStorage("xushici_yzs_sing")?.length) return false;
					return player.countCards("h")
				},
				prompt:`咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)`,
				filterCard(card, player) {
					return true;
				},
				selectCard: 1,
				check(card) {
					const player = _status.event.player;
					return 6 - get.value(card,player);
				},
				async content(event, trigger, player) {
					player.addTempSkill("xushici_yzs_sing");
					player.addTempSkill("xushici_yzs_sing2");
					player.setStorage("xushici_yzs_sing",[get.suit(event.cards[0])])
					player.$fullscreenpop("九纲", "thunder");
				}
			},
			sing2: {
				name: "偏光",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits||!suits.length) return false;
					return player.countCards("h", { suit: suits[0]})
				},
				prompt: `咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)`,
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
			},
			sing3: {
				name: "乌与声明",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return player.countCards("h", { suit: suits[0] })
				},
				prompt: `咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)`,
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
			},
			sing4: {
				name: "表里之间",
				enable: "phaseUse",
				position: "h",
				filter(event, player) {
					let suits = player.getStorage("xushici_yzs_sing");
					if (!suits || !suits.length) return false;
					return player.countCards("h", { suit: suits[0] })
				},
				prompt: `咒词咏唱：你可完整念出咒词，增加【虚式·茈】的伤害。(连续弃置4张相同花色的手牌)`,
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
			},
			sing5: {
				charlotte: true,
				onremove:true,
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		nobracket: true,
		enable: "phaseUse",
		position: "h",
		equal(card1, card2,player) {
			if (get.name(card1,player) == get.name(card2,player)) return false;
			return get.number(card1,player)==get.number(card2,player)
		},
		filter(event, player) {
			let cards = player.getCards("h");
			cards = cards.filter(card => ["wtwCang_yzs", "wtwHe_yzs"].includes(get.name(card, player)));
			if (!cards.length) return false;
			for (let card1 of cards) {
				for (let card2 of cards) {
					if (lib.skill.xushici_yzs.equal(card1, card2, player)) return game.countPlayer(function (target) {
						return lib.skill.xushici_yzs.filterTarget(null, player, target)
					}) > 0
				}
			}
			return false;
		},
		filterCard(card, player) {
			if (!["wtwCang_yzs", "wtwHe_yzs"].includes(get.name(card, player))) return false;
			if (ui.selected.cards.length) {
				return lib.skill.xushici_yzs.equal(ui.selected.cards[0],card,player)
			}
			const cards2 = player.getCards("h");
			for (let i2 = 0; i2 < cards2.length; i2++) {
				if (card != cards2[i2]) {
					if (lib.skill.xushici_yzs.equal(cards2[i2], card,player)) {
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
		selectTarget: 1,
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
			if (event.baseDamage >= 3) {
				player.$fullscreenpop("虚式","thunder")
				setTimeout(() => {
					player.$fullscreenpop("茈", "thunder")
				}, 1500)
			}
			if (event.baseDamage >= 5) {
			//	player.playEffectOL(lib.skill.xushici_yzs.Effect, target);
			}
			await new Promise(r => setTimeout(r, 2000))

			await target.damage();
		},
		ai: {
			basic: {
				order: 8.5,
				useful: 1,
				value: 5,
			},
			result: {
				target:-4,
			}
		}
	},
	wuliangkongchu_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		nobracket: true,
		enable: "phaseUse",
		usable: 1,
		domain:true,
		position: "h",
		filterCard: true,
		selectCard: [1, Infinity],
		allowChooseAll: true,
		prompt: `${get.poptip("lingyuzhankai_yzs")}：所有其他角色不可使用或打出牌。其他角色的回合结束时，其领域技失效`,
		check(card) {
			let player = _status.event.player;
			return 8 - get.value(card);
		},
		filter(event, player) {
			return _status._yzsDomainPlayer != player && player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			let result = await player.yzs_ExpandDomain(event.name, "thunder",event.cards.length).forResult();
			if (result?.bool) {
				game.broadcastAll(() => {
					if (_status.tempMusic == `ext:一中杀/audio/AIZO.mp3`) return;
					_status.tempMusic = `ext:一中杀/audio/AIZO.mp3`;
					game.playBackgroundMusic();
				});
			}
		},
		ai: {
			order(item, player2) {
				if (_status._yzsDomainPlayer != player2 && _status._yzsDomain == "fumoyuchuzi_yzs") return 10
				return 1;
			},
			result: {
				player: 1,
			},
			threaten: 1.5,
		},
	},
	wuliangkongchu_yzs_skill: {
		locked: true,
		popup: false,
		domainskill: true,
		priority: 312415,
		forced: true,
		trigger: {
			player: "phaseEnd",
		},
		filter(event, player) {
			if (get.itemtype(_status._yzsDomainPlayer) !== "player") return false;
			if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
			if (player == _status._yzsDomainPlayer) return false;
			if (player.hasSkill("hundunyutiaohe_yzs")) return true;
			const skills = player.getSkills(null, false, false).filter(skill => {
				let info = get.info(skill);
				if (!info || info.charlotte || get.skillInfoTranslation(skill, player).length == 0) {
					return false;
				}
				return lib.skill[skill].domain;
			})
			if (!skills.length) return false;
			return true;
		},
		async content(event, trigger, player) {
			if (player.hasSkill("hundunyutiaohe_yzs")) {
				player.addMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill", 1, false);
				if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") == 2) {
					game.log(player, "适应了","wuliangkongchu_yzs")
					game.trySkillAudio("hundunyutiaohe_yzs")
					player.playEffectOL(lib.skill.hundunyutiaohe_yzs.Effect);
				}
			}
			const skills = player.getSkills(null, false, false).filter(skill => {
				let info = get.info(skill);
				if (!info || info.charlotte || get.skillInfoTranslation(skill, player).length == 0) {
					return false;
				}
				return lib.skill[skill].domain;
			})
			if (!skills.length) return;
			player.tempBanSkill(skills, "forever")
		},
		charlotte: true,
		mod: {
			cardEnabled(card, player) {
				if (!_status.auto) return;
				if (get.itemtype(_status._yzsDomainPlayer) !== "player") return ;
				if (player == _status._yzsDomainPlayer) return;
				if (player.hasSkill("SimpleDomain_yzs_buff")) return;
				if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
				return false;
			},
			cardRespondable(card, player) {
				if (!_status.auto) return;
				if (get.itemtype(_status._yzsDomainPlayer) !== "player") return;
				if (player == _status._yzsDomainPlayer) return;
				if (player.hasSkill("SimpleDomain_yzs_buff")) return;
				if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
				return false;
			},
			cardUsable(card, player) {
				if (!_status.auto) return;
				if (get.itemtype(_status._yzsDomainPlayer) !== "player") return;
				if (player == _status._yzsDomainPlayer) return;
				if (player.hasSkill("SimpleDomain_yzs_buff")) return;
				if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
				return false;
			},
		},
		priority: -25,
	},
	_wuliangkongchu_yzs_skill: {
		subSkill: {
			discard: {
				forced: true,
				priority: 312415,
				trigger: {
					player:"discardBegin"
				},
				filter(event, player) {
					if (_status._yzsDomain != "wuliangkongchu_yzs") return false;
					let evt = event.getParent();
					if (evt?.name == "chooseToDiscard") {
						if (get.itemtype(_status._yzsDomainPlayer) !== "player") return false;
						if (player == _status._yzsDomainPlayer) return false;
						if (evt.forced) return false
						if (evt.wuliangkongchu_yzs_ban) return false;
						if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
						if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
						return true;
					}
					return false;
				},
				async content(event, trigger, player) {
					let evt = trigger.getParent();
					trigger.cancel()
					if (evt?.name == "chooseToDiscard") {
						evt.result = {bool:false}
					}
				}
			},
			respond: {
				forced: true,
				priority: 312415,
				trigger: {
					player: "respondBegin"
				},
				filter(event, player) {
					if (_status._yzsDomain != "wuliangkongchu_yzs") return false;
					let evt = event.getParent();
					if (evt?.name == "chooseToRespond") {
						if (get.itemtype(_status._yzsDomainPlayer) !== "player") return false;
						if (player == _status._yzsDomainPlayer) return false;
						if (evt.forced) return false
						if (evt.wuliangkongchu_yzs_ban) return false;
						if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
						if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
						return true;
					}
					return false;
				},
				async content(event, trigger, player) {
					let evt = trigger.getParent();
					trigger.cancel()
					if (evt?.name == "chooseToRespond") {
						evt.result = { bool: false }
					}
				}
			},
			use: {
				forced: true,
				priority: 312415,
				trigger: {
					player: ["useCardBegin"]
				},
				filter(event, player) {
					if (_status._yzsDomain != "wuliangkongchu_yzs") return false;
					let evt = event.getParent();
					if (evt?.name == "chooseToUse") {
						if (get.itemtype(_status._yzsDomainPlayer) !== "player") return false;
						if (player == _status._yzsDomainPlayer) return false;
						if (evt.forced) return false
						if (evt.wuliangkongchu_yzs_ban) return false;
						if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
						if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
						return true;
					}
					return false;
				},
				async content(event, trigger, player) {
					let evt = trigger.getParent();
					trigger.cancel()
					if (evt?.name == "chooseToUse") {
						evt.result = { bool: false }
					}
					evt = evt.getParent();
					if (evt?.name == "phaseUse") {
						evt.skipped = true;
					}
				}
			},
			skill: {
				forced: true,
				priority: 312415,
				trigger: {
					player: ["useSkillBegin"]
				},
				filter(event, player) {
					if (_status._yzsDomain != "wuliangkongchu_yzs") return false;
					if (event.name == "useSkill") {
						if (lib.skill[event.skill]?.domain) return false;
					}
					let evt = event.getParent();
					if (["chooseToUse","chooseToRespond"].includes(evt?.name)) {
						if (get.itemtype(_status._yzsDomainPlayer) !== "player") return false;
						if (player == _status._yzsDomainPlayer) return false;
						if (evt.forced) return false
						if (evt.wuliangkongchu_yzs_ban) return false;
						if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
						if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
						return true;
					}
					return false;
				},
				async content(event, trigger, player) {
					let evt = trigger.getParent();
					trigger.cancel()
					if (evt?.name == "chooseToUse") {
						evt.result = { bool: false }
					}
					evt = evt.getParent();
					if (evt?.name == "phaseUse") {
						evt.skipped = true;
					}
				}
			},
		},
		forced:true,
		priority: 312415,
		trigger: {
			player: ["chooseTargetEnd", "chooseCardEnd", "chooseCardOLEnd", "chooseButtonEnd", "chooseButtonOLEnd",
				"chooseControlEnd", "chooseBoolEnd", "chooseCardTargetEnd", "chooseButtonTargetEnd", "chooseControlEnd",
				"chooseNumbersEnd", "choosePlayerCardEnd", "chooseSkillEnd", "rewriteDiscardResult","rewriteGainResult"]
		},
		filter(event, player) {
			if (_status._yzsDomain != "wuliangkongchu_yzs") return false;
			if (get.itemtype(_status._yzsDomainPlayer) !== "player") return false;
			if (player == _status._yzsDomainPlayer) return false;
			if (event.forced) return false
			if (event.wuliangkongchu_yzs_ban) return false;
			if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
			if (player.countMark("hundunyutiaohe_yzs_wuliangkongchu_yzs_skill") >= 2) return false;
			return true;
		},
		async content(event, trigger, player) {
			if (trigger.forced) return;
			trigger.result = { bool: false };
		}
	}
}
export default skills;
