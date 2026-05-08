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
	Totem_yzs: {
		charlotte: true,
		mark: true,
		locked: true,
		markimage: 'extension/一中杀/image/Totem_yzs.png',
		intro: {
			name: "图腾",
			mark(dialog, storage, player) {
				if (_status._yzsStorm && _status._yzsStorm !== "blank") {
					dialog.add(get.translation(_status._yzsStorm));
					dialog.addText(lib.translate[`${_status._yzsStorm}_skill_info`] + "</div></div>")
				}
				if (player.countMark("Totem_yzs")) dialog.addText("当前图腾数量：" + player.countMark("Totem_yzs"));
				else dialog.addText("当前没有图腾");
			},
			content: function (storage, player) {
			},
		},
		sub: true,
	},
	//符卡显示
	"Fuka_yzs": {
		charlotte: true,
		locked: true,
		mark: true,
		markimage: 'extension/一中杀/image/Fuka_yzs.png',
		intro: {
			name: "符卡",
			content: function (storage, player) {
				const max = get.character(player.name).Fuka || 1;
				return "当前符卡数量：" + player.countMark("Fuka_yzs") + "/" + max;
			},
		},
		sub: true,
	},
	//依神姐妹
	bubbleQueen_yzs: {
		nobracket: true,
		init: function (player, skill) {
			if (!player.storage.extraStorm) {
				player.storage.extraStorm = "FinancialStorm";
				player.markSkill("extraStorm");
			}
		},
		prompt: "令1名其他角色获得【财运】至其出牌阶段结束。",
		locked: true,
		charlotte: true,
		unique: true,
		group: ["bubbleQueen_yzs_gain"],
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false
				if (target.hasSkill("finances_yzs")) return false
				return target != player
			}))
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false
			if (target.hasSkill("finances_yzs")) return false
			return target != player
		},
		async content(event, trigger, player) {
			await event.targets[0].addSkill("finances_yzs");
			let result = await player.chooseBool("是否令 " + get.translation(event.targets[0]) + " 倒霉运？<br>其【财运】中的“-”改为“+”")
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
				.forResult();
			if (!result.bool) return ;
			event.targets[0].storage.finances_yzs = true;
			event.targets[0].markSkill("finances_yzs");

		},
		subSkill: {
			gain: {
				name:"财祸「雁过拔毛」",
				trigger: {
					player: "phaseEnd",
				},
				sourceSkill: "bubbleQueen_yzs",
				filter(event, player) {
					if (_status._yzsStorm != "FinancialStorm") return false
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
		},
		ai: {
			order(name, player) {
				return 9;
			},
			result: {
				target(player, target) {
					let value = 2;
					if (target.countCards("h") < target.hp) value += 2;
					if (get.attitude(player, target) > 0) return value;
					return -value;
				},
			},
			threaten: 1.6,
		},
	},
	FinancialStorm_skill: {
		group: "FinancialStorm_skill_instant",
		subSkill: {
			instant: {
				name: "金融风暴",
				popup: false,
				locked: true,
				log: false,
				stormskill: true,
				async content(event, trigger, player) {
					if (get.character(player.name).Fuka > player.countMark("Fuka_yzs")) player.addMark("Fuka_yzs")
					var list = { trick: [] };
					for (var i = 0; i < lib.inpile.length; i++) {
						var name = lib.inpile[i];
						var info = lib.card[name];
						if (!info || info.type != "trick" || info.notarget || get.tag({ name: name }, "damage")) {
							continue;
						}
						if (!player.hasUseTarget({
							name: name,
						})) continue
						list[info.type].push(["锦囊", "", name]);
					}
					list.trick.sort(lib.sort.name);
					const result = await player.chooseButton(["视为使用一张锦囊", [list.trick, "vcard"]])
						.forResult();
					if (result.bool) {
						player.chooseUseTarget(result.links[0][2], true, false);
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
			return player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			await player.chooseToDiscard(true)
				.set("position", "h")
				.set("ai", function (card) {
					return 7 - get.value(card);
				})
		},
		priority: -25,
	},
	finances_yzs: {
		group: ["finances_yzs_storm", "finances_yzs_lose"],
		init: function (player, skill) {
			if (!player.storage.finances_yzs) {
				player.storage.finances_yzs = false;
				player.markSkill("finances_yzs");
			}
		},
		onremove: "storage",
		subSkill: {
			storm: {
				priority: 6,
				direct:true,
				popup:true,
				trigger: {
					player: "phaseJieshu",
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					let num = 4;
					if (player.storage.finances_yzs) num = 6;
					else num = 2;
					let results = await player.yzs_throw(num).forResult();
					if (results.bool) {
						let result = await player.chooseButton([
							"选择1项",
							[
								[
									["1", "制作1枚图腾"],
									["2", "视为使用任意非伤害非延时锦囊牌"],
								],
								"textbutton",
							],
						])
							.set("forced", true)
							.set("selectButton", 1)
							.set("filterButton", function (button) {
								return true
							})
							.set("ai", (button) => {
								let value = 0;
								if (button.link == "1") value += 6;
								if (button.link == "2") value += 7;
								return value;
							})
							.forResult();
						if (!result.bool) return;
						if (result.links[0] == "1") player.addMark("Totem_yzs");
						if (result.links[0] == "2") {
							var list = { trick: [] };
							for (var i = 0; i < lib.inpile.length; i++) {
								var name = lib.inpile[i];
								var info = lib.card[name];
								if (!info || info.type != "trick" || info.notarget || get.tag({ name: name }, "damage")) {
									continue;
								}
								if (!player.hasUseTarget({
									name: name,
								})) continue
								list[info.type].push(["锦囊", "", name]);
							}
							list.trick.sort(lib.sort.name);
							const result = await player.chooseButton(["视为使用一张锦囊", [list.trick, "vcard"]])
								.set("ai", (button) => {
									return get.value(button)
								})
								.forResult();
							if (result.bool) {
								player.chooseUseTarget(result.links[0][2], true, false);
							}
						}
					}
				},
			},
			lose: {
				trigger: { player: "phaseUseEnd" },
				forced: true,
				charlotte:true,
				popup: false,
				locked: true,
				filter(event, player) {
					return !player.hasSkill("bubbleQueen_yzs")
				},
				async content(event, trigger, player) {
					player.removeSkill("finances_yzs")
				}
			},
		},
		priority: 6,
		direct: true,
		popup: true,
		trigger: {
			player: "phaseZhunbei",
		},
		filter(event, player) {
			return player.countCards("h") < player.hp;
		},
		async content(event, trigger, player) {
			let num = 4;
			if (player.storage.finances_yzs) num = 6;
			else num = 2;
			let results = await player.yzs_throw(num).forResult();
			if (results.bool) await player.draw(2);
			else await player.loseHp()
		},
	},
	Mischance_Scatter_yzs: {
		nobracket: true,
		locked: true,
		prompt: "弃置任意角色1张手牌，然后其投掷4（受其【财运】影响）：下回合摸牌数+2；否则弃1张手牌。",
		locked: true,
		enable: "phaseUse",
		filter: function (event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false
				if (!target.countDiscardableCards(player, "he")) return false
				return true
			}))
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false
			if (!target.countDiscardableCards(player, "he")) return false
			return true
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			await player.discardPlayerCard(event.target, "he", true);
			let num = 4;
			if (event.target.storage.finances_yzs) num = 6;
			else num = 2;
			let results = await event.target.yzs_throw(num).forResult();
			if (results.bool) {
				event.target.addSkill("Mischance_Scatter_yzs_throw_buff")
				event.target.addMark("Mischance_Scatter_yzs_throw_buff", 2, false)
			}
			else await event.target.chooseToDiscard(true)
				.set("position", "h")
				.set("ai", function (card) {
					return 7 - get.value(card);
				})
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					let v = 2;
					if (target.countCards("h") > target.hp) v -= 0.4;
					else v += 1;
					if (target.storage.finances_yzs) return -v;
					return v;
				},
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	Mischance_Scatter_yzs_throw_buff: {
		name: "厄运播撒",
		trigger: {
			player: "phaseDrawBegin",
		},
		locked: true,
		forced: true,
		onremove(player, skill) {
			player.clearMark("Mischance_Scatter_yzs_throw_buff", false)
		},
		mark: true,
		intro: {
			content: "下回合摸牌数+#",
		},
		filter: function (event, player) {
			return player.countMark("Mischance_Scatter_yzs_throw_buff");
		},
		content: function () {
			trigger.num += player.countMark("Mischance_Scatter_yzs_throw_buff");
			player.removeSkill("Mischance_Scatter_yzs_throw_buff")
		},
		sub: true,
		sourceSkill: "Mischance_Scatter_yzs_throw",
		"_priority": 0,
	},
	//伊吹萃香
	mengmengjiugui_yzs: {
		nobracket: true,
		locked: true,
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == "jiu") {
					return Infinity;
				}
				if (_status.currentPhase == player) {
					if (card.name == 'sha' && !player.hasSkill('jiu')) return false;
				}
			},
			cardEnabled(card, player) {
				if (card.name == "jiu") {
					return Infinity;
				}
				if (_status.currentPhase == player) {
					if (card.name == 'sha' && !player.hasSkill('jiu')) return false;
				}
			},
		},
		forced: true,
		popup: false,
		trigger: {
			player: "jiuBegin",
		},
		filter(event, player) {
			const evt = event.getParent();
			if ((get.info(evt.skill) || {}).charlotte) {
				return false;
			}
			const lostHp = player.maxHp - player.hp;
			return lostHp > 0 && lostHp < 5;
		},
		content() {
			trigger.setContent(lib.skill.mengmengjiugui_yzs.jiuContent);
		},
		async jiuContent(event, trigger, player) {
			const { target } = event;
			const lostHp = player.maxHp - player.hp;
			if (lostHp == 1 || lostHp == 3) {
				await target.recover();
			}
			if (lostHp == 2) {
				target.addTempSkill("mengmengjiugui_yzs_buff", "phaseUseAfter");
			}
			if (lostHp == 4) {
				if (!game.hasPlayer(current => current.countCards("h") > 0 && !current.hasSkill("hidden_yzs"))) return false;
				let result = await target.chooseTarget("濛濛酒鬼", "请选择1名有手牌的角色", false)
					.set("filterTarget", (card, player, target) => {
						if (target.hasSkill("hidden_yzs")) return false;
						return target.countCards("h") > 0
					})
					.set('ai', target => {
						const player = _status.event.player;
						return get.effect(target, { name: "guohe" }, player, player);
					})
					.forResult()
				if (result.bool) {
					const { result: { bool, cards } } = await target
						.choosePlayerCard(
							"选择该角色的至少一张牌",
							result.targets[0],
							"h",
							true,
							function (button) { return true; },
							1,
						);
					if (bool) {
						result.targets[0].$throw(cards);
						await target.chooseUseTarget(cards, { name: "jiu" }, true);
					}
				}
			}
		},
	},
	mengmengjiugui_yzs_buff: {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
		},
		forced: true,
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
		async content(event, trigger, player) {
			if (trigger.addCount === false) return;
			trigger.addCount = false;
			trigger.player.getStat().card.sha--;
			player.removeSkill("mengmengjiugui_yzs_buff")
		},
		sub: true,
		sourceSkill: "mengmengjiugui_yzs",
		mark: true,
		onremove: true,
		intro: {
			content: "本阶段下张【杀】无次数限制",
		},
	},
	yichuirang_yzs: {
		nobracket: true,
		priority: 2,
		locked: true,
		forced: true,
		group: ["yichuirang_yzs_fuka", "yichuirang_yzs_gain"],
		subSkill: {
			fuka: {
				enable: "chooseToUse",
				viewAs: {
					name: "jiu",
					isCard: true,
				},
				viewAsFilter(player) {
					return player.countMark("Fuka_yzs") > 0;
				},
				filter(event, player) {
					return player.countMark("Fuka_yzs") > 0;
				},
				filterCard: () => false,
				selectCard: -1,
				log: false,
				precontent() {
					player.removeMark("Fuka_yzs");
					player.logSkill("yichuirang_yzs");
				},
				ai: {
					jiuOther: true,
					basic: {
						useful: (card, i) => {
							if (_status.event.player.hp > 1) {
								if (i === 0) {
									return 4;
								}
								return 1;
							}
							if (i === 0) {
								return 7.3;
							}
							return 3;
						},
						value: (card, player, i) => {
							if (player.hp > 1) {
								if (i === 0) {
									return 5;
								}
								return 1;
							}
							if (i === 0) {
								return 7.3;
							}
							return 3;
						},
					},
					order(item, player) {
						if (_status.event.dying) {
							return 9;
						}
						let sha = get.order({ name: "sha" });
						if (sha <= 0) {
							return 0;
						}
						let usable = player.getCardUsable("sha");
						if (
							usable < 2 &&
							player.hasCard(i => {
								return get.name(i, player) == "zhuge";
							}, "hs")
						) {
							usable = Infinity;
						}
						let shas = Math.min(usable, player.mayHaveSha(player, "use", item, "count"));
						if (shas != 1 || (lib.config.mode === "stone" && !player.isMin() && player.getActCount() + 1 >= player.actcount)) {
							return 0;
						}
						return sha + 0.2;
					},
					result: {
						target: (player, target, card) => {
							if (target && target.isDying()) {
								return 2;
							}
							if (!target || target._jiu_temp || !target.isPhaseUsing()) {
								return 0;
							}
							let effs = { order: 0 },
								temp;
							target.getCards("hs", i => {
								if (get.name(i) !== "sha" || ui.selected.cards.includes(i)) {
									return false;
								}
								temp = get.order(i, target);
								if (temp < effs.order) {
									return false;
								}
								if (temp > effs.order) {
									effs = { order: temp };
								}
								effs[i.cardid] = {
									card: i,
									target: null,
									eff: 0,
								};
							});
							delete effs.order;
							for (let i in effs) {
								if (!lib.filter.filterCard(effs[i].card, target)) {
									continue;
								}
								game.filterPlayer(current => {
									if (
										get.attitude(target, current) >= 0 ||
										!target.canUse(effs[i].card, current, null, true) ||
										current.hasSkillTag("filterDamage", null, {
											player: target,
											card: effs[i].card,
											jiu: true,
										})
									) {
										return false;
									}
									temp = get.effect(current, effs[i].card, target, player);
									if (temp <= effs[i].eff) {
										return false;
									}
									effs[i].target = current;
									effs[i].eff = temp;
									return false;
								});
								if (!effs[i].target) {
									continue;
								}
								if (
									target.hasSkillTag(
										"directHit_ai",
										true,
										{
											target: effs[i].target,
											card: i,
										},
										true
									) ||
									//(Math.min(target.getCardUsable("sha"), target.mayHaveSha(player, "use", item, "count")) === 1 && (
									target.needsToDiscard() > Math.max(0, 3 - target.hp) ||
									!effs[i].target.mayHaveShan(player, "use")
									//))
								) {
									delete target._jiu_temp;
									return 1;
								}
							}
							delete target._jiu_temp;
							return 0;
						},
					},
					tag: {
						save: 1,
						recover: 0.1,
					},
				},
			},
			gain: {
				name:"鬼符「遗失的力量」",
				locked: true,
				prompt: "你可获得因【伊吹瓤】扣置的全部牌",
				trigger: {
					player: ["phaseBegin", "phaseEnd"],
				},
				filter(event, player) {
					return player.countExpansions("yichuirang_yzs") > 0;
				},
				check(event, player) {
					let cards = player.getExpansions("yichuirang_yzs")
					if ( cards.filter(i=>i.name=="shan")>= 1) return false;
					return true;
				},
				async content(event, trigger, player) {
					await player.gain(player.getExpansions("yichuirang_yzs"));
				}
			},
		},
		markimage: 'extension/一中杀/image/yichuirang_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("yichuirang_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张扣置牌";
			},
		},
		trigger: {
			player: ["useCard", "respond"],
		},
		filter: function (trigger, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.draw();
			if (!player.countCards("h")) return
			const result = await player.chooseCard("伊吹瓤", "你扣置1张手牌", "h", 1, true)
				.set("ai", (card) => {
					return 8 - get.value(card)
				})
				.forResult()
			if (result.bool && result.cards?.length) {
				let next = player.addToExpansion(result.cards, player, "giveAuto",false)
				next.gaintag.add("yichuirang_yzs")
				await next
			}
			if (player.countExpansions("yichuirang_yzs") > 3) {
				const cards = player.getExpansions("yichuirang_yzs");
				let next = await player.chooseButton(["伊吹瓤", "获得其中1张牌", player.getExpansions("yichuirang_yzs")], 1, true)
					.set("ai", button => get.value(button.link))
					.forResult()
				if (next && next.bool) {
					await player.gain(next.links, "giveAuto", "log")
				}
				player.loseToDiscardpile(player.getExpansions("yichuirang_yzs"))
				if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
			}
		},
	},
	yunjiwusan_yzs: {
		nobracket: true,
		priority: 1,
		locked: true,
		group: ["yunjiwusan_yzs_maxHp", "yunjiwusan_yzs_wuyongchang", "yunjiwusan_yzs_red"],
		subSkill: {
			maxHp: {
				locked: true,
				forced: true,
				popup: false,
				trigger: { player: "gainMaxHpBegin" },
				filter(event, player) {
					return event.num + player.maxHp > 5;
				},
				async content(event, trigger, player) {
					trigger.num = Math.max(5 - player.maxHp, 0);
				}
			},
			wuyongchang: {
				hiddenCard: function (player, name) {
					if (!player.countMark("Fuka_yzs")) return
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					if (event.yunjiwusan_yzs_wuyongchang || event.getParent().yunjiwusan_yzs_wuyongchang) return false;
					return player.countMark("Fuka_yzs") > 0;
				},
				chooseButton: {
					dialog(event, player) {
						let dialog = ui.create.dialog("云集雾散：调整体力上限至任意值","你每因此溢出1点体力便获得1张符卡" ,"hidden");
						let choiceList = ["1", "2", "3", "4", "5"];
						choiceList = choiceList.filter(cur => parseInt(cur) != player.maxHp);
						for (let i = 0; i < choiceList.length; i++) {
							if (player.maxHp == parseInt(choiceList[i])) {
								choiceList[i] = `<span style="text-decoration: line-through;">${choiceList[i]}</span>`;
							}
						}
						dialog.add([[choiceList, "tdnodes"]]);
						return dialog;
					},
					filter(button, player) {
						if (player.maxHp == parseInt(button.link)) return false;
						return true;
					},
					check(button) {
						const player = get.player();
						if (player.hp == 1 && parseInt(button.link) == 5) return 4;
						return 0
					},
					backup(links, player) {
						const num = links[0];
						return {
							num: num,
							filterCard: () => false,
							selectCard: -1,
							async content(event, trigger, player) {
								const num = lib.skill.yunjiwusan_yzs_wuyongchang_backup.num;
								const evt = event.getParent(2);
								player.removeMark("Fuka_yzs");
								if (num > player.maxHp) {
									await player.gainMaxHp(num - player.maxHp);
								}
								else if (num < player.maxHp) {
									const fuka = player.hp - num;
									await player.loseMaxHp(player.maxHp - num);
									player.addMark("Fuka_yzs", Math.min(fuka, get.character(player.name).Fuka - player.countMark("Fuka_yzs")));
								}
								if (evt.name == "chooseToUse") {
									evt.goto(0);
									delete evt.openskilldialog;
								}
							}
						};
					},
					prompt(links, player) {
						const effect = links[0],
							str = "###云集雾散###";
						return str + '<div class="text center">' +"你调整体力上限至任意值，然后你每因此溢出1点体力便获得1张符卡" + "</div>";
					},
				},
				ai: {
					order:10,
					result: {
						player(player) {
							if (player.hp == 1) return 1;
							return 0;
						}
					}
				}
			},
			red: {
				forced: true,
				popup: false,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					return get.color(event.card) == "red";
				},
				async content(event, trigger, player) {
					if (player.maxHp < 2) {
						await player.gainMaxHp()
						return;
					}
					if (player.maxHp > 4) {
						await player.loseMaxHp()
						return;
					}
					let result = await player.chooseButton([
						"选择增加或减少1点体力上限",
						[
							[
								["up", "增加1点体力上限"],
								["down", "减少1点体力上限"],
							],
							"textbutton",
						],
					])
						.set("forced", true)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							if (button.link == "up") return player.maxHp < 5;
							if (button.link == "down") return player.maxHp > 1;
							return true
						})
						.set("ai", (button) => {
							if (button.link == "up") {
								if (player.hp == 1 || player.hp == player.maxHp) return 10;
							} else {
							}
							return 0;
						})
						.forResult();
					if (!result.bool) return
					if (result.links[0] == "up") {
						await player.gainMaxHp()
					}
					if (result.links[0] == "down") {
						await player.loseMaxHp();
					}
				},
			},
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
			player.yzs_UseShunfaji("yunjiwusan_yzs");
		},
		clickableFilter: function (player) {
			return player.countMark("Fuka_yzs") > 0;
		},
		clickableContent: async function (event, trigger, player) {
			let choiceList = ["1", "2", "3", "4", "5"];
			choiceList = choiceList.filter(cur => parseInt(cur) != player.maxHp);
			if (!choiceList.length) return;
			for (let i = 0; i < choiceList.length; i++) {
				if (player.maxHp == parseInt(choiceList[i])) {
					choiceList[i] = `<span style="text-decoration: line-through;">${choiceList[i]}</span>`;
				}
			}
			const result = await player
				.chooseButton(["调整体力上限至任意值", [choiceList, "tdnodes"]], false)
				.set("filterButton", button => {
					const player = get.player();
					if (player.maxHp == parseInt(button.link)) return false;
					return true;
				})
				.set("ai", button => parseInt(button.link))
				.forResult();
			if (result?.links?.length) {
				player.removeMark("Fuka_yzs");
				const num = parseInt(result.links[0]);
				if (num > player.maxHp) {
					await player.gainMaxHp(num - player.maxHp);
				}
				else if (num < player.maxHp) {
					const fuka = player.hp - num;
					await player.loseMaxHp(player.maxHp - num);
					player.addMark("Fuka_yzs", Math.min(fuka, player.storage.Fuka - player.countMark("Fuka_yzs")));
				}
			}
		},
		mod: {
			aiOrder(player, card, num) {
				if (card.name != "jiu") return num;
				if (player.maxHp - player.hp == 4) return num + 10;
			},
		},
	},
	//Z哥
	pinfanshijie_yzs: {
		nobracket: true,
		group: ["pinfanshijie_yzs_draw"],
		subSkill: {
			draw: {
				direct: true,
				popup: true,
				trigger: { player: "recoverAfter" },
				async content(event, trigger, player) {
					await player.draw();
				}
			}
		},
		enable: "phaseUse",
		prompt: "失去1点体力并摸两张牌",
		filter(event, player) {
			if (player.hasSkill("lastclass_effect_yzs")) return false;
			return player.hp > 1;
		},
		async content(event, trigger, player) {
			await player.loseHp(1);
			await player.draw(2);
		},
		ai: {
			basic: {
				order: 1,
			},
			result: {
				player(player) {
					if (player.countCards("h", { name: "tao" })) return 2;
					if (player.countCards("h") >= player.hp - 1) {
						return -1;
					}
					if (player.hp < 3) {
						return -1;
					}
					return 1;
				},
			},
		},
		"_priority": 0,
	},
	Versailles_yzs: {
		nobracket: true,
		group: ["Versailles_yzs_card"],
		locked: true,
		enable: "chooseToUse",
		viewAs: {
			name: "fanersai_yzs",
		},
		filterCard: {
			name: "sha",
		},
		position: "h",
		viewAsFilter(player) {
			return player.countCards("h", { name: "sha" }) > 0;
		},
		check(card) {
			return 8 - get.value(card);
		},
		subSkill: {
			card: {
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: ["fanersai_yzsBegin","jiedaoBegin"]
				},
				filter(event, player) {
					return true
				},
				content() {
					trigger.setContent(lib.skill.Versailles_yzs_card.jiedaoContent);
				},
				async jiedaoContent(event, trigger, player) {
					const { target } = event;
					var result;
					if (event.directHit || !event.addedTarget || (!_status.connectMode && lib.config.skip_shan && !target.hasSha())) {
						event.directfalse = true;
					} else {
						result = await target
							.chooseToUse("对" + get.translation(event.addedTarget) + "使用一张杀，或令" + get.translation(player) + "将你的1张手牌扣置为【Z牌】", function (card, player) {
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
					if (event.directfalse || result.bool == false) {
						if (!target.countCards("h")) return;
						var next = await player.choosePlayerCard(target, "h",
							1,
							"凡尔赛：将" + get.translation(target) + "的1张手牌扣置为【Z牌】",
							true
						)
							.set("goon", get.attitude(player, target) <= 0)
							.set("forceAuto", true)
							.forResult();
						var cards = [];
						if (next.bool) cards = next.cards || [];
						if (cards.length) {
							var add = player.addToExpansion("giveAuto", cards, player);
							add.gaintag.add("Zkill_yzs");
							await add
						};
					}
				},
			}
		}
	},
	Zkill_yzs: {
		nobracket: true,
		locked:true,
		markimage: 'extension/一中杀/image/Zkill_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("Zkill_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【Z牌】";
			},
		},
		enable: "phaseUse",
		filter: function (event, player) {
			if (player.getExpansions("Zkill_yzs").length < 1) return false
			let sum = 0;
			for (let card of player.getExpansions("Zkill_yzs")) {
				sum += get.number(card);
			}
			return sum>=10;
		},
		chooseButton: {
			dialog(event, player) {
				let dialog = ui.create.dialog("Z牌", player.getExpansions("Zkill_yzs"), "hidden");
				return dialog;
			},
			select: function () {
				const cards = ui.selected.buttons || [];
				let number = 0;
				for (const cardx of cards) {
					number += get.number(cardx.link);
				};
				if (number >=10) return cards.length;
				return cards.length + 2;
			},
			filter: function (button, player) {
				const cards = ui.selected.buttons || [];
				let number = 0;
				for (const cardx of cards) {
					number += get.number(cardx.link);
				};
				return true;
			},
			check(button) {
				let btn = ui.selected.buttons || [];
				let sum = 0;
				btn.map(i => sum += i.number);
				if (sum <= 30) return button.number;
				return 0;
			},
			backup(links, player) {
				return {
					name: "Zの斩首",
					cards: links,
					filterCard(card) {
						return lib.skill.Zkill_yzs_backup.cards.includes(card);
					},
					filterTarget(card,player,target) {
						return !target.hasSkill("hidden_yzs")
					},
					selectCard: -1,
					discard: false,
					lose: false,
					position: "x",
					async content(event, trigger, player) {
						var cards = lib.skill.Zkill_yzs_backup.cards;
						await player.loseToDiscardpile(cards);
						await player.recover(2)
						await event.target.loseHp();
					},
					ai: {
						order: 8,
						result: {
							target(player, target) {
								return -1 / target.hp;
							},
							player(player, target) {
								return 2 * get.recoverEffect(player, player, player)
							},
						},
						expose: 0.3,
						threaten: 1.2
					},
				}
			},
			prompt() {
				return "你恢复2点体力并令任意角色失去1点体力";
			},
		},
		ai: {
			order: 8,
			result: {
				player(player, target) {
					if (player.maxHp>2&&player.maxHp - player.hp < 2) return 0;
					return 2*get.recoverEffect(player,player,player)
				},
			},
			expose: 0.3,
			threaten: 1.2
		},
	},
	//牙仙
	FairyInNight_yzs: {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:1",
		global: ["FairyInNight_yzs_g", "FairyInNight_yzs_g_use"],
		markimage: 'extension/一中杀/image/FairyInNight_yzs.png',
		intro: {
			name: "乳牙",
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("FairyInNight_yzs");
				dialog.addAuto(cards);
			},
		},
		derivation: ["toothCollector_yzs", "candyJar_yzs", "fairyDance_yzs"],
		group: ["FairyInNight_yzs_begin", "FairyInNight_yzs_end"],
		subSkill: {
			begin: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				trigger: { player: "phaseBegin" },
				async cost(event, trigger, player) {
					let result = await player.chooseButton([
						"仙子悄入夜","你失去下列全部项，然后获得其中一项：①乳牙收藏家②太妃糖罐中③精灵圆舞曲<br>(如果不发动，则本回合结束时强制发动)",
						[
							[
								["toothCollector_yzs", "获得【乳牙收藏家】"],
								["candyJar_yzs", "获得【太妃糖罐中】"],
								["fairyDance_yzs", "获得【精灵圆舞曲】"],
							],
							"textbutton",
						],
					])
						.set("forced", false)
						.set("selectButton", 1)
						.set("filterButton", function (button) {
							let player = _status.event.player
							return !player.hasSkill(button.link)
						})
						.set("ai", (button) => {
							let value = 0;
							if (button.link == "toothCollector_yzs") value += 9;
							if (button.link == "candyJar_yzs") value += 7;
							if (button.link == "fairyDance_yzs") value += 5;
							return value;
						})
						.forResult();
					if (!result.bool) return false;
					event.result = {
						bool: true,
						cost_data: result.links[0]
					}
				},
				async content(event, trigger, player) {
					const list = ["toothCollector_yzs", "candyJar_yzs", "fairyDance_yzs"];
					for (let skill of list) {
						if (player.hasSkill(skill)) {
							let onlose = skill + "_onlose";
							await player.useSkill(onlose);
							await player.removeSkill(skill);
						}
					}
					player.addSkill(event.cost_data);
					player.popup(event.cost_data);
					game.log(player, "获得了", "【" + get.translation(event.cost_data) + "】");
					let ongain = event.cost_data + "_ongain";
					await player.useSkill(ongain);
				},
			},
			end: {
				audio: "FairyInNight_yzs_begin",
				locked: true,
				trigger: { player: "phaseEnd" },
				forced: true,
				filter(event, player) {
					return !player.getHistory("useSkill", evt => evt.skill == "FairyInNight_yzs_begin").length;
				},
				async content(event, trigger, player) {
					const list = ["toothCollector_yzs", "candyJar_yzs", "fairyDance_yzs"];
					for (let skill of list) {
						if (player.hasSkill(skill)) {
							let onlose = skill + "_onlose";
							await player.useSkill(onlose);
							await player.removeSkill(skill);
						}
					}
					let result = await player.chooseButton([
						"选择并获得其中1项",
						[
							[
								["toothCollector_yzs", "获得【乳牙收藏家】"],
								["candyJar_yzs", "获得【太妃糖罐中】"],
								["fairyDance_yzs", "获得【精灵圆舞曲】"],
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
							if (button.link == "toothCollector_yzs") value += 9;
							if (button.link == "candyJar_yzs") value += 7;
							if (button.link == "fairyDance_yzs") value += 5;
							return value;
						})
						.forResult();
					if (!result.bool) return
					player.addSkill(result.links[0]);
					player.popup(result.links[0]);
					game.log(player, "获得了", "【" + get.translation(result.links[0]) + "】");
					let ongain = result.links[0] + "_ongain";
					await player.useSkill(ongain);
				},
			}
		},
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:2",
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			var cards = [];
			cards.push(game.createCard2({ name: "TF_yzs", number: 11 }));
			cards.push(game.createCard2({ name: "TF_yzs", number: 12 }));
			cards.push(game.createCard2({ name: "TF_yzs", number: 13 }));
			await player.gain(cards, "gain2");
			game.delayx();
		},
	},
	FairyInNight_yzs_g: {
		nobracket: true,
		locked: true,
		forced: true,
		popup: false,
		group: ["FairyInNight_yzs_g_use"],
		subSkill: {
			use: {
				name: "牙仙精灵",
				priority: 1,
				locked: true,
				"prompt2": "可交换任意张【牙仙精灵】与【乳牙】，或将1张【牙仙精灵】置入弃牌堆以交换任意张手牌与【乳牙】。",
				trigger: {
					source: "damageBegin2",
					player: "damageBegin4",
				},
				filter(event, player) {
					if (!player.getCards("h", { name: "TF_yzs" }).length) return false;
					let fairy = game.filterPlayer(current => current.hasSkill("FairyInNight_yzs"));
					if (!fairy.length) return false;
					fairy = fairy[0];
					if (!fairy.countExpansions("FairyInNight_yzs")) return false;
					return true;
				},
				async content(event, trigger, player) {
					let fairy = game.filterPlayer(current => current.hasSkill("FairyInNight_yzs"));
					if (!fairy.length) return false;
					fairy = fairy[0];
					const tooth = fairy.getExpansions("FairyInNight_yzs");
					let result = await player.chooseCard("h", false, 1)
						.set("filterCard", function (card) {
							return card.name == "TF_yzs";
						})
						.set("ai", (card) => {
							const player = get.player();
							return 3 - get.value(card, player);
						})
						.forResult()
					if (result.bool) {
						await player.loseToDiscardpile(result.cards);
						let result2 = await player.chooseToMove("乳牙：交换任意张手牌与【乳牙】")
							.set("list", [
								[get.translation(player) + "【乳牙】", tooth],
								["手牌区", player.getCards("h")],
							])
							.set("filterMove", function (from, to) {
								return typeof to != "number";
							})
							.set("processAI", list => {
								const num = Math.min(list[0][1].length, list[1][1].length);
								const cards1 = list[0][1].slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
								const cards2 = list[1][1].slice().sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
								return [cards1.slice().addArray(cards2.slice(0, num)), cards2.slice().addArray(cards1.slice(0, num))];
							})
							.forResult();
						if (result2.bool) {
							var pushs = result2.moved[0],
								gains = result2.moved[1];
							pushs.removeArray(fairy.getExpansions("FairyInNight_yzs"));
							gains.removeArray(player.getCards("h"));
							if (!pushs.length || pushs.length != gains.length) return;
							let next = fairy.addToExpansion(pushs, player, "giveAuto")
							next.gaintag.add("FairyInNight_yzs");
							await next;
							await player.gain(gains, "gain2");
						}
					}
					else {
						let result3 = await player.chooseToMove("乳牙：交换任意张【牙仙精灵】与【乳牙】")
							.set("list", [
								[get.translation(player) + "【乳牙】", tooth],
								["【牙仙精灵】", player.getCards("h", { name: "TF_yzs" })],
							])
							.set("filterMove", function (from, to) {
								return typeof to != "number";
							})
							.set("processAI", list => {
								const num = Math.min(list[0][1].length, list[1][1].length);
								const cards1 = list[0][1].slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
								const cards2 = list[1][1].slice().sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
								return [cards1.slice().addArray(cards2.slice(0, num)), cards2.slice().addArray(cards1.slice(0, num))];
							})
							.forResult();
						if (result3.bool) {
							var pushs = result3.moved[0],
								gains = result3.moved[1];
							pushs.removeArray(fairy.getExpansions("FairyInNight_yzs"));
							gains.removeArray(player.getCards("h", { name: "TF_yzs" }));
							if (!pushs.length || pushs.length != gains.length) return;
							let next = fairy.addToExpansion(pushs, player, "giveAuto")
							next.gaintag.add("FairyInNight_yzs");
							await next;
							await player.gain(gains, "gain2");
						}
					}
				}
			},
		},
		trigger: {
			player: "gainAfter",
			global: "loseAsyncAfter",
		},
		filter(event, player) {
			const cards = event.getg(player).filter(card => card.name == "TF_yzs");
			if (cards.length) return true;
			return false;
		},
		async content(event, trigger, player) {
			const cards = trigger.getg(player).filter(i => get.owner(i) == player && i.name == "TF_yzs");
			player.addShownCards(cards, "visible_FairyInNight_yzs_g");
		},
		sub: true,
		sourceSkill: "FairyInNight_yzs",
	},
	toothCollector_yzs: {
		nobracket: true,
		group: ["toothCollector_yzs_ongain", "toothCollector_yzs_onlose"],
		subSkill: {
			ongain: {
				locked: true,
				async content(event, trigger, player) {
					const cards = get.cards(2);
					let next = player.addToExpansion(cards, "gain2", player)
					next.gaintag.add("FairyInNight_yzs");
					await next;
					if (player.countExpansions("FairyInNight_yzs") > (player.hasSkill("fairyDance_yzs") ? 2 : 4)) {
						if (player.hasSkill("fairyDance_yzs")) {
							let cards = player.getExpansions("FairyInNight_yzs")
							let list2 = [],
								map = {};
							for (var i of cards) {
								var suit = get.suit(i);
								if (!map[suit]) {
									map[suit] = [];
								}
								map[suit].push(i);
							}
							var dialog = ["选择获得一种花色的所有牌"];
							for (var suit of lib.suit) {
								if (map[suit]) {
									dialog.push(map[suit]);
									list2.push(suit);
								}
							}
							if (list2.length) {
								var result2 = await player.chooseControl(list2, "cancel2")
									.set("dialog", dialog)
									.set("list", list2)
									.set("map", map)
									.set("ai", function () {
										let max = 0, res = "cancel2";
										for (let s of _status.event.list) {
											let temp = 0;
											for (let i of _status.event.map[s]) {
												temp += get.value(i, _status.event.player) + get.sgn(get.attitude(_status.event.player, get.owner(i))) * (6 - get.value(i, get.owner(i)));
											}
											for (let i in _status.event.map) {
												if (i === s) {
													continue;
												}
												for (let j of _status.event.map[i]) {
													temp -= get.sgn(get.attitude(_status.event.player, get.owner(j))) * get.value(j, get.owner(j));
												}
											}
											if (temp > max) {
												res = s;
												max = temp;
											}
										}
										return res;
									})
									.forResult();
							}
							if (result2.control != "cancel2") {
								const cards2 = cards.filter(function (i) {
									return get.suit(i) == result2.control;
								});
								player.gain(cards2, "log");
							}
							let list = [];
							for (let i = 11; i < 14; i++) {
								list.push(["none", i, "TF_yzs"]);
							}
							let result = await player.chooseButton(["将1张【牙仙精灵】移出游戏", [list, "vcard"]])
								.set("forced", false)
								.set("selectButton", 1)
								.forResult();
							player.getStat().card.sha = 0;
							if (result.bool) {
								const Allcards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
								const filter = card => [result.links[0][1]].includes(card.number) && [result.links[0][2]].includes(card.name);
								const cardx = Allcards.filter(filter);
								if (cardx.length) {
									await game.cardsGotoSpecial(cardx);
									game.log(cardx, "被移出了游戏");
								}
								for (const target of game.filterPlayer()) {
									const sishis = target.getCards("hej", filter);
									if (sishis.length) {
										target.$throw(sishis);
										game.log(sishis, "被移出了游戏");
										await target.lose(sishis, ui.special);
									}
								}
								const cardsex = player.getExpansions("FairyInNight_yzs").filter(filter);
								if (cardsex.length) {
									await game.cardsGotoSpecial(cardsex);
									game.log(cardsex, "被移出了游戏");
								}
							}
						}
						player.loseToDiscardpile(player.getExpansions("FairyInNight_yzs"))
						if (!player.hasSkill("candyJar_yzs") || !player.hasSkill("fairyDance_yzs")) {
							let result = await player.chooseButton([
								"选择并获得其中1项",
								[
									[
										["candyJar_yzs", "获得【太妃糖罐中】"],
										["fairyDance_yzs", "获得【精灵圆舞曲】"],
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
								.forResult();
							if (!result.bool) return
							player.addSkill(result.links[0]);
							player.popup(result.links[0]);
							game.log(player, "获得了", "【" + get.translation(result.links[0]) + "】");
							let ongain = result.links[0] + "_ongain";
							await player.useSkill(ongain);
						}
						if (!player.countCards("h", "TF_yzs")) return;
						let result = await player.chooseCardTarget(false)
							.set("filterTarget", (card, player, target) => {
								if (target == player) return false;
								return !(target.hasSkill("hidden_yzs"));
							})
							.set("prompt", "乳牙收藏家")
							.set("prompt2", "选择1名其他角色，给予其1张【牙仙精灵】（可不选）")
							.set("position", "h")
							.set("filterCard", function (card, player) {
								return get.name(card, player) == "TF_yzs";
							})
							.forResult()
						if (!result.bool) return;
						player.give(result.cards, result.targets[0], "give");
					}
				}
			},
			onlose: {
				async content(event, trigger, player) {
					let cards = player.getExpansions("FairyInNight_yzs");
					let result = await player.chooseToMove("乳牙收藏家：是否交换【乳牙】和手牌？")
						.set("list", [
							[get.translation(player) + "【乳牙】", cards],
							["手牌区", player.getCards("h")],
						])
						.set("filterMove", function (from, to) {
							return typeof to != "number";
						})
						.set("processAI", list => {
							const num = Math.min(list[0][1].length, list[1][1].length);
							const cards1 = list[0][1].slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
							const cards2 = list[1][1].slice().sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
							return [cards1.slice().addArray(cards2.slice(0, num)), cards2.slice().addArray(cards1.slice(0, num))];
						})
						.forResult();
					if (result.bool) {
						var pushs = result.moved[0],
							gains = result.moved[1];
						pushs.removeArray(player.getExpansions("FairyInNight_yzs"));
						gains.removeArray(player.getCards("h"));
						if (!pushs.length || pushs.length != gains.length) return;
						let next = player.addToExpansion(pushs, player, "giveAuto")
						next.gaintag.add("FairyInNight_yzs");
						await next;
						await player.gain(gains, "gain2");
					}
				}
			},
		},
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:3",
		trigger: {
			player: ["useCard", "respond"],
		},
		async content(event, trigger, player) {
			const card = get.cards(1);
			let next = player.addToExpansion(card, "gain2", player)
			next.gaintag.add("FairyInNight_yzs");
			await next;
			if (player.countExpansions("FairyInNight_yzs") > (player.hasSkill("fairyDance_yzs") ? 2 : 4)) {
				if (player.hasSkill("fairyDance_yzs")) {
					let cards = player.getExpansions("FairyInNight_yzs")
					let list2 = [],
						map = {};
					for (var i of cards) {
						var suit = get.suit(i);
						if (!map[suit]) {
							map[suit] = [];
						}
						map[suit].push(i);
					}
					var dialog = ["选择获得一种花色的所有牌"];
					for (var suit of lib.suit) {
						if (map[suit]) {
							dialog.push(map[suit]);
							list2.push(suit);
						}
					}
					if (list2.length) {
						var result2 = await player.chooseControl(list2, "cancel2")
							.set("dialog", dialog)
							.set("list", list2)
							.set("map", map)
							.set("ai", function () {
								let max = 0, res = "cancel2";
								for (let s of _status.event.list) {
									let temp = 0;
									for (let i of _status.event.map[s]) {
										temp += get.value(i, _status.event.player) + get.sgn(get.attitude(_status.event.player, get.owner(i))) * (6 - get.value(i, get.owner(i)));
									}
									for (let i in _status.event.map) {
										if (i === s) {
											continue;
										}
										for (let j of _status.event.map[i]) {
											temp -= get.sgn(get.attitude(_status.event.player, get.owner(j))) * get.value(j, get.owner(j));
										}
									}
									if (temp > max) {
										res = s;
										max = temp;
									}
								}
								return res;
							})
							.forResult();
					}
					if (result2.control != "cancel2") {
						const cards2 = cards.filter(function (i) {
							return get.suit(i) == result2.control;
						});
						player.gain(cards2, "log");
					}
					let list = [];
					for (let i = 11; i < 14; i++) {
						list.push(["none", i, "TF_yzs"]);
					}
					let result = await player.chooseButton(["将1张【牙仙精灵】移出游戏", [list, "vcard"]])
						.set("forced", false)
						.set("selectButton", 1)
						.forResult();
					player.getStat().card.sha = 0;
					if (result.bool) {
						const Allcards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
						const filter = card => [result.links[0][1]].includes(card.number) && [result.links[0][2]].includes(card.name);
						const cardx = Allcards.filter(filter);
						if (cardx.length) {
							await game.cardsGotoSpecial(cardx);
							game.log(cardx, "被移出了游戏");
						}
						for (const target of game.filterPlayer()) {
							const sishis = target.getCards("hej", filter);
							if (sishis.length) {
								target.$throw(sishis);
								game.log(sishis, "被移出了游戏");
								await target.lose(sishis, ui.special);
							}
						}
						const cardsex = player.getExpansions("FairyInNight_yzs").filter(filter);
						if (cardsex.length) {
							await game.cardsGotoSpecial(cardsex);
							game.log(cardsex, "被移出了游戏");
						}
					}
				}
				player.loseToDiscardpile(player.getExpansions("FairyInNight_yzs"))
				if (!player.hasSkill("candyJar_yzs") || !player.hasSkill("fairyDance_yzs")) {
					let result = await player.chooseButton([
						"选择并获得其中1项",
						[
							[
								["candyJar_yzs", "获得【太妃糖罐中】"],
								["fairyDance_yzs", "获得【精灵圆舞曲】"],
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
							if (button.link == "toothCollector_yzs") value += 9;
							if (button.link == "candyJar_yzs") value += 7;
							if (button.link == "fairyDance_yzs") value += 5;
							return value;
						})
						.forResult();
					if (!result.bool) return
					player.addSkill(result.links[0]);
					player.popup(result.links[0]);
					game.log(player, "获得了", "【" + get.translation(result.links[0]) + "】");
					let ongain = result.links[0] + "_ongain";
					await player.useSkill(ongain);
				}
				if (!player.countCards("h", "TF_yzs")) return;
				let result = await player.chooseCardTarget( false)
					.set("filterTarget", (card, player, target) => {
						if (target == player) return false;
						return !(target.hasSkill("hidden_yzs"));
					})
					.set("prompt", "乳牙收藏家")
					.set("prompt2","选择1名其他角色，给予其1张【牙仙精灵】（可不选）")
					.set("position", "h")
					.set("filterCard", function (card, player) {
						return get.name(card, player) == "TF_yzs";
					})
					.forResult()
				if (!result.bool) return;
				player.give(result.cards, result.targets[0], "give");
			}
		},
	},
	candyJar_yzs: {
		nobracket: true,
		group: ["candyJar_yzs_ongain", "candyJar_yzs_onlose"],
		subSkill: {
			ongain: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				async content(event, trigger, player) {
					var result = await player.chooseToDiscard("你弃任意张手牌并摸等量张牌", "h", [1, player.countCards("h")])
						.set("ai", function (card) {
							if (ui.selected.cards.length >= 2) {
								return 0;
							}
							if (ui.selected.cards.length == 1) {
								if (player.countCards("h") > player.hp) {
									return 3 - get.value(card);
								}
								return 0;
							}
							return 6 - get.value(card);
						})
						.forResult();
					if (result.bool) {
						await player.draw(result.cards.length);
					}
				}
			},
			onlose: {
				locked: true,
				audio: "ext:一中杀/audio/skill:1",
				async content(event, trigger, player) {
					let targets = await player.chooseTarget("太妃糖罐中", "令任意名角色摸1张牌（不选则你摸2张牌）", [1, Infinity], false)
						.set("ai", target => {
							if (game.countPlayer(target => get.attitude(player, target) > 1) >= 2) return get.attitude(player, target);
							return 0;
						})
						.forResult()
					if (!targets.bool) {
						await player.draw(2)
						return;
					}
					for (let target of targets.targets.sortBySeat()) {
						await target.draw();
					}
				}
			},
		},
		locked: true,
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			source: "damageBegin2",
		},
		filter(event, player) {
			return event.player.countCards("h") > 0 || !player.hasSkill("fairyDance_yzs") || !player.hasSkill("toothCollector_yzs")
		},
		async cost(event, trigger, player) {
			let result = await player.chooseButton([
				"选择并获得其中1项(不选则可弃置" + get.translation(trigger.player) + "1张手牌)",
				[
					[
						["toothCollector_yzs", "获得【乳牙收藏家】"],
						["fairyDance_yzs", "获得【精灵圆舞曲】"],
					],
					"textbutton",
				],
			])
				.set("forced", false)
				.set("selectButton", 1)
				.set("filterButton", function (button) {
					let player = _status.event.player
					return !player.hasSkill(button.link)
				})
				.set("ai", (button) => {
					let value = 0;
					if (button.link == "toothCollector_yzs") value += 9;
					if (button.link == "candyJar_yzs") value += 7;
					if (button.link == "fairyDance_yzs") value += 5;
					return value;
				})
				.forResult();
			if (result.bool) {
				event.result = {
					bool: true,
					cost_data: result.links[0],
				};
				return;
			}
			if (!trigger.player.countCards("h")) {
				event.result = {
					bool: false,
				};
				return;
			}
			let result2 = await player.chooseTarget(`你可弃置 ${get.translation(trigger.player)} 的1张手牌`)
				.set("filterTarget", (card, player, target) => {
					return target == _status.event.target;
				})
				.set('ai', target => {
					const player = _status.event.player;
					return get.effect(target, { name: "guohe" }, player, player);
				})
				.set('target', trigger.player)
				.forResult();
			if (result2.targets?.length) {
				event.result = {
					bool: true,
					targets: result2.targets,
				};
				return;
			}
			event.result = {
				bool: false,
			};
		},
		async content(event, trigger, player) {
			if (event.targets?.length) {
				await player.discardPlayerCard(event.targets[0], "h", 1, true);
				return;
			}
			player.addSkill(event.cost_data);
			player.popup(event.cost_data);
			game.log(player, "获得了", "【" + get.translation(event.cost_data) + "】");
			let ongain = event.cost_data + "_ongain";
			await player.useSkill(ongain);
		},
		priority: 5,
	},
	fairyDance_yzs: {
		nobracket: true,
		group: ["fairyDance_yzs_ongain", "fairyDance_yzs_onlose"],
		subSkill: {
			ongain: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				async content(event, trigger, player) {
					let targets = await player.chooseTarget("精灵圆舞曲", "对任意角色造成0点伤害（不选则你回复1点体力）", 1, false)
						.set('ai', target => {
							const player = _status.event.player;
							return get.effect(target, { name: "guohe" }, player, player)-get.recoverEffect(player,player,player);
						})
						.forResult()
					if (!targets.bool) {
						await player.recover()
						return;
					}
					for (let target of targets.targets.sortBySeat()) {
						await target.damage(0, player);
					}
					if (player.countExpansions("FairyInNight_yzs") > (player.hasSkill("fairyDance_yzs") ? 2 : 4)) {
						if (player.hasSkill("fairyDance_yzs")) {
							let cards = player.getExpansions("FairyInNight_yzs")
							let list2 = [],
								map = {};
							for (var i of cards) {
								var suit = get.suit(i);
								if (!map[suit]) {
									map[suit] = [];
								}
								map[suit].push(i);
							}
							var dialog = ["选择获得一种花色的所有牌"];
							for (var suit of lib.suit) {
								if (map[suit]) {
									dialog.push(map[suit]);
									list2.push(suit);
								}
							}
							if (list2.length) {
								var result2 = await player.chooseControl(list2, "cancel2")
									.set("dialog", dialog)
									.set("list", list2)
									.set("map", map)
									.set("ai", function () {
										let max = 0, res = "cancel2";
										for (let s of _status.event.list) {
											let temp = 0;
											for (let i of _status.event.map[s]) {
												temp += get.value(i, _status.event.player) + get.sgn(get.attitude(_status.event.player, get.owner(i))) * (6 - get.value(i, get.owner(i)));
											}
											for (let i in _status.event.map) {
												if (i === s) {
													continue;
												}
												for (let j of _status.event.map[i]) {
													temp -= get.sgn(get.attitude(_status.event.player, get.owner(j))) * get.value(j, get.owner(j));
												}
											}
											if (temp > max) {
												res = s;
												max = temp;
											}
										}
										return res;
									})
									.forResult();
							}
							if (result2.control != "cancel2") {
								const cards2 = cards.filter(function (i) {
									return get.suit(i) == result2.control;
								});
								player.gain(cards2, "log");
							}
							let list = [];
							for (let i = 11; i < 14; i++) {
								list.push(["none", i, "TF_yzs"]);
							}
							let result = await player.chooseButton(["将1张【牙仙精灵】移出游戏", [list, "vcard"]])
								.set("forced", false)
								.set("selectButton", 1)
								.forResult();
							player.getStat().card.sha = 0;
							if (result.bool) {
								const Allcards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
								const filter = card => [result.links[0][1]].includes(card.number) && [result.links[0][2]].includes(card.name);
								const cardx = Allcards.filter(filter);
								if (cardx.length) {
									await game.cardsGotoSpecial(cardx);
									game.log(cardx, "被移出了游戏");
								}
								for (const target of game.filterPlayer()) {
									const sishis = target.getCards("hej", filter);
									if (sishis.length) {
										target.$throw(sishis);
										game.log(sishis, "被移出了游戏");
										await target.lose(sishis, ui.special);
									}
								}
								const cardsex = player.getExpansions("FairyInNight_yzs").filter(filter);
								if (cardsex.length) {
									await game.cardsGotoSpecial(cardsex);
									game.log(cardsex, "被移出了游戏");
								}
							}
						}
						player.loseToDiscardpile(player.getExpansions("FairyInNight_yzs"))
						if (!player.hasSkill("candyJar_yzs") || !player.hasSkill("fairyDance_yzs")) {
							let result = await player.chooseButton([
								"选择并获得其中1项",
								[
									[
										["candyJar_yzs", "获得【太妃糖罐中】"],
										["fairyDance_yzs", "获得【精灵圆舞曲】"],
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
									if (button.link == "toothCollector_yzs") value += 9;
									if (button.link == "candyJar_yzs") value += 7;
									if (button.link == "fairyDance_yzs") value += 5;
									return value;
								})
								.forResult();
							if (!result.bool) return
							player.addSkill(result.links[0]);
							player.popup(result.links[0]);
							game.log(player, "获得了", "【" + get.translation(result.links[0]) + "】");
							let ongain = result.links[0] + "_ongain";
							await player.useSkill(ongain);
						}
						if (!player.countCards("h", "TF_yzs")) return;
						let result = await player.chooseCardTarget(false)
							.set("filterTarget", (card, player, target) => {
								if (target == player) return false;
								return !(target.hasSkill("hidden_yzs"));
							})
							.set("prompt", "乳牙收藏家")
							.set("prompt2", "选择1名其他角色，给予其1张【牙仙精灵】（可不选）")
							.set("position", "h")
							.set("filterCard", function (card, player) {
								return get.name(card, player) == "TF_yzs";
							})
							.forResult()
						if (!result.bool) return;
						player.give(result.cards, result.targets[0], "give");
					}
				}
			},
			onlose: {
				locked: true,
				async content(event, trigger, player) {
					let list = [];
					for (let i = 11; i < 14; i++) {
						if (!player.countCards("h", { name: "TF_yzs", number: i })) list.push(["none", i, "TF_yzs"]);
					}
					if (!list.length) return;
					let result = await player.chooseButton(["获得任意张【牙仙精灵】", [list, "vcard"]])
						.set("forced", false)
						.set("selectButton", [1, 3])
						.set("ai",button=>get.value(button))
						.forResult();
					if (!result.bool) return
					for (let i = 0; i < result.links.length; i++) {
						game.log(player, "获得了" + get.translation(result.links[i][2]));
						const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
						const filter = card => [result.links[i][1]].includes(card.number) && [result.links[i][2]].includes(card.name);
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
						const cardsex = player.getExpansions("FairyInNight_yzs").filter(filter);
						if (cardsex.length) {
							await game.cardsGotoSpecial(cardsex);
						}
						var card = await game.createCard2({ name: result.links[i][2], number: result.links[i][1] });
						await player.gain(card, "gain2");
					}
					game.delayx();
				}
			},
		},
		locked: true,
		promp2: "你移去【乳牙】时可获得其中1种花色的牌",
	},
	//娜兹玲&寅丸星
	juBao_yzs: {
		lastDo: true,
		locked: true,
		charlotte: true,
		unique: true,
		forced: true,
		init: function (player, skill) {
			if (Array.isArray(player.storage.juBao_yzs_distance)) return;
			player.storage.juBao_yzs_distance = [0, 0, 0];
			player.markSkill("juBao_yzs_distance");
		},
		markimage: 'extension/一中杀/image/juBao_yzs.png',
		intro: {
			markcount(storage) {
				return storage.length;
			},
			mark(dialog, content, player) {
				const storage = player.getStorage("juBao_yzs");
				const names = storage;
				dialog.addText("当前已获得的装备技能：");
				dialog.addSmall([names, "vcard"]);
			},
		},
		mod: {
			globalTo: function (from, to, distance) {
				if (to.storage.juBao_yzs_distance) {
					const num = to.storage.juBao_yzs_distance[0];
					if (typeof num == "number") {
						return distance + num;
					}
				}
			},
			globalFrom: function (from, to, distance) {
				if (from.storage.juBao_yzs_distance) {
					const num = from.storage.juBao_yzs_distance[1];
					if (typeof num == "number") {
						return distance - num;
					}
				}
			},
			attackRange: (player, num) => num + player.storage.juBao_yzs_distance[2],
		},
		trigger: {
			player: "useCard",
		},
		filter: function (event) {
			return get.type(event.card) == 'equip';
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.targets.length = 0;
			trigger.all_excluded = true;
			player.loseToDiscardpile(trigger.card);
			player.markAuto("juBao_yzs", [trigger.card.name]);
			if (get.subtype(trigger.card) == "equip3") {
				game.log(player, "获得" + get.translation(trigger.card) + "的装备技能");
				player.storage.juBao_yzs_distance[0]++;
				player.markSkill("juBao_yzs_distance");
				if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
				return;
			}
			if (get.subtype(trigger.card) == "equip4") {
				game.log(player, "获得" + get.translation(trigger.card) + "的装备技能");
				player.storage.juBao_yzs_distance[1]++;
				player.markSkill("juBao_yzs_distance");
				if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
				return;
			}
			if (get.subtype(trigger.card) == "equip1") {
				var info = get.info(trigger.card, false);
				if (info && info.distance && typeof info.distance.attackFrom == "number" && -info.distance.attackFrom > player.storage.juBao_yzs_distance[2])
					player.storage.juBao_yzs_distance[2] = -info.distance.attackFrom;
			}
			const skill = trigger.card.name + "_skill"
			game.log(player, "获得" + get.translation(trigger.card) + "的装备技能");
			await player.addSkill(skill)
			if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
		},
	},
	tanBao_yzs: {
		enable: "phaseUse",
		usable: 1,
		async content(event, trigger, player) {
			player.logSkill("tanBao_yzs_BusyRod")
			var cards = [];
			var equip = [];
			while (true) {
				if ((ui.cardPile.childNodes || []).length == 0) {
					game.log("倒霉~牌堆翻光了也没找到！")
					break;
				}
				let card = get.cards(1);
				if (!card.length) break;
				cards.push(card[0]);
				if (get.type(card[0]) == "equip") {
					equip.push(card[0])
					break;
				}
			}
			if (!cards.length) return;
			await player.showCards(get.translation(player) + "【探宝】展示牌", cards);
			if (!equip.length) {
				while (cards.length) {
					ui.cardPile.insertBefore(cards.pop(), ui.cardPile.firstChild);
				}
				return;
			}
			let next = await player.chooseButton(["探宝", "是否获得找到的装备牌？(不选则再次寻找)", equip], 1, false)
				.set("ai", button => get.value(button.link))
				.set("filterButton", function (button) {
					return get.type(button.link) == "equip";
				})
				.forResult()
			if (next && next.bool) {
				player.logSkill("tanBao_yzs_BusyRod")
				cards = cards.filter(card => card != next.links[0])
				await player.gain(next.links, "giveAuto", "log")
				while (cards.length) {
					ui.cardPile.insertBefore(cards.pop(), ui.cardPile.firstChild);
				}
				return;
			}
			equip = [];
			while (true) {
				if ((ui.cardPile.childNodes || []).length == 0) {
					game.log("倒霉~牌堆翻光了也没找到！")
					break;
				}
				let card = get.cards(1);
				if (!card.length) break;
				cards.push(card[0]);
				if (get.type(card[0]) == "equip") {
					equip.push(card[0])
					break;
				}
			}
			if (!cards.length) return;
			await player.showCards(get.translation(player) + "【探宝】展示牌(第二次)", cards);
			if (!equip.length) {
				while (cards.length) {
					ui.cardPile.insertBefore(cards.pop(), ui.cardPile.firstChild);
				}
				return;
			}
			let next2 = await player.chooseButton(["探宝", "获得找到的装备牌", equip], 1, true)
				.set("ai", button => get.value(button.link))
				.set("filterButton", function (button) {
					return get.type(button.link) == "equip";
				})
				.forResult()
			if (next2 && next2.bool) {
				cards = cards.filter(card => card != next2.links[0])
				await player.gain(next2.links, "giveAuto", "log")
				while (cards.length) {
					ui.cardPile.insertBefore(cards.pop(), ui.cardPile.firstChild);
				}
			}
		},
		ai: {
			order:7,
			result: {
				player:2
			}
		}
	},
	baoTa_yzs: {
		priority: 5,
		direct: true,
		popup: true,
		trigger: {
			player: ["useCard", "respond"],
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			player.logSkill("baoTa_yzs_RadiantTreasure")
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/coin.mp3");
			const card = await player.draw().forResult()
			await player.showCards(get.translation(player) + "【宝塔】展示牌", card);
			if (get.color(card, player) == get.color(trigger.card)) {
				player.tempBanSkill(event.name);
				game.broadcastAll(function (damageAudioInfo) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo);
					}
				}, "effect/coin_cost.mp3");
			}
		},
	},
	weiGuang_yzs: {
		locked: true,
		group: ["weiGuang_yzs_recover", "weiGuang_yzs_sha", "weiGuang_yzs_damage"],
		subSkill: {
			recover: {
				locked: true,
				forced: true,
				lastDo: true,
				name: "完全净化",
				trigger: {
					source: "damageBegin4"
				},
				filter(event, player) {
					return event.num < 0;
				},
				async content(event, trigger, player) {
					trigger.cancel();
					await trigger.player.recover(-trigger.num);
				},
			},
			sha: {
				targetprompt2_1: target => {
					const list = [];
					list.add("减少目标");
					return list;
				},
				targetprompt2_2: target => {
					const list = [];
					list.add("加伤");
					return list;
				},
				targetprompt2_3: target => {
					const list = [];
					list.add("减伤");
					return list;
				},
				name:"光符[净化之魔]",
				locked: true,
				trigger: {
					player: "useCard2",
				},
				filter(event, player) {
					return event.card.name == "sha" && event.targets.length > 1;
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseTarget([1, Infinity], event.unchosen ? get.prompt('weiGuang_yzs') : null, '为' + get.translation(trigger.card) + '减少任意个目标', function (card, player, target) {
						return _status.event.targets.includes(target);
					}).set('ai', function (target) {
						var trigger = _status.event.getTrigger();
						const player = get.player();
						return -get.effect(target, trigger.card, trigger.player, _status.event.player)*get.attitude(player,target);
					}).set('targets', trigger.targets)
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(lib.skill.weiGuang_yzs_sha.targetprompt2_1);
						})
						.forResult();

				},
				async content(event, trigger, player) {
					trigger.targets = trigger.targets.filter(cur => !event.targets.includes(cur));
					if (!trigger.targets.length) return;

					let result2 = await player.chooseTarget([1, event.targets.length], event.unchosen ? get.prompt('weiGuang_yzs') : null, '令' + get.translation(trigger.card) + '对指定的目标伤害+1', function (card, player, target) {
						return _status.event.targets.includes(target);
					}).set('ai', function (target) {
						var trigger = _status.event.getTrigger();
						const player = get.player();
						return get.effect(target, trigger.card, trigger.player, _status.event.player) * get.attitude(player, target);
					}).set('targets', trigger.targets)
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(lib.skill.weiGuang_yzs_sha.targetprompt2_2);
						})
						.forResult();
					if (!trigger.card.storage.weiGuang_yzs_sha_add) trigger.card.storage.weiGuang_yzs_sha_add=[];
					if (result2.bool) {
						trigger.card.storage.weiGuang_yzs_sha_add = result2.targets;
						if (!trigger.targets.some(cur=>!trigger.card.storage.weiGuang_yzs_sha_add.includes(cur)).length) return;
					}

					let result3 = await player.chooseTarget([1, event.targets.length - trigger.card.storage.weiGuang_yzs_sha_add.length], event.unchosen ? get.prompt('weiGuang_yzs') : null, '令' + get.translation(trigger.card) + '对指定的目标伤害-1', function (card, player, target) {
						return _status.event.targets.includes(target);
					}).set('ai', function (target) {
						var trigger = _status.event.getTrigger();
						const player = get.player();
						return -get.effect(target, trigger.card, trigger.player, _status.event.player) * get.attitude(player, target);
					}).set('targets', trigger.targets.filter(cur => !trigger.card.storage.weiGuang_yzs_sha_add.includes(cur)))
						.set("onChooseTarget", function () {
							const event = get.event();
							event.targetprompt2.add(lib.skill.weiGuang_yzs_sha.targetprompt2_3);
						})
						.forResult();
					if (!trigger.card.storage.weiGuang_yzs_sha_sub) trigger.card.storage.weiGuang_yzs_sha_sub = [];
					if (result3.bool) trigger.card.storage.weiGuang_yzs_sha_sub = result3.targets;
				}
			},
			damage: {
				popup: false,
				trigger: {
					source: "damageBegin1",
				},
				sourceSkill: "weiGuang_yzs",
				filter(event) {
					if (!event.card || event.card.name != "sha") return false;
					if (!event.notLink()) return false;
					if (event.card.storage.weiGuang_yzs) return true;
					if (event.card.storage.weiGuang_yzs_sha_add && event.card.storage.weiGuang_yzs_sha_add.includes(event.player)) return true;
					if (event.card.storage.weiGuang_yzs_sha_sub && event.card.storage.weiGuang_yzs_sha_sub.includes(event.player)) return true;
					return false;
				},
				charlotte: true,
				forced: true,
				async content(event, trigger, player) {
					if (trigger.card.storage.weiGuang_yzs) trigger.num--;
					if (trigger.card.storage.weiGuang_yzs_sha_add && trigger.card.storage.weiGuang_yzs_sha_add.includes(trigger.player)) {
						trigger.num++;
					}
					if (trigger.card.storage.weiGuang_yzs_sha_sub && trigger.card.storage.weiGuang_yzs_sha_sub.includes(trigger.player)) {
						trigger.num--;
					}
				},
				ai: {
					damageBonus: true,
				},
				"_priority": 1,
				sub: true,
			},
		},
		enable: "phaseUse",
		filter(event, player) {
			return player.countMark("Fuka_yzs") > 0;
		},
		selectTarget: function () {
			const player = get.player()
			return [1, player.countMark("Fuka_yzs")]
		},
		multitarget: true,
		filterTarget(card, player, target) {
			return player.canUse({ name: "sha" }, target);
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs", event.targets.length)
			player.logSkill("weiGuang_yzs_name")
			await player.useCard({ name: "sha", isCard: true, storage: { weiGuang_yzs: true } }, event.targets);
		},
		ai: {
			order: 4,
			result: {
				target(player, target) {
					if (player.countMark("Fuka_yzs")==1) return 0;
					if (get.attitude(player, target) > 0) return 2;
					return -2;
				},
			},
		},
	},
	//芙洛玛西斯
	tuiyidele_yzs: {
		nobracket: true,
		locked: true,
		forced: true,
		group: ["tuiyidele_yzs_phaseBegin", "tuiyidele_yzs_phaseDiscardAfter"],
		subSkill: {
			phaseBegin: {
				locked: true,
				logTarget: "player",
				"prompt2": "你可令其判定阶段改为发动【休息时间】",
				trigger: {
					global: "phaseBegin"
				},
				filter(event, player) {
					return event.player != player && event.player.countCards("h") == player.countCards("h") && !event.player.hasSkill("hidden_yzs")
				},
				check(event, player) {
					if (player.storage.tuiyidele_yzs) {
						return get.attitude(player, event.player) < 0;
					} else {
						return get.attitude(player, event.player) > 0;
					}
				},
				async content(event, trigger, player) {
					await trigger.player.addTempSkill("tuiyidele_yzs_phaseBegin_buff");
				},
				ai: {
					expose:0.2,
					threaten: 1.1
				},
			},
			phaseDiscardAfter: {
				locked: true,
				logTarget: "player",
				"prompt2": "你可令其结束阶段改为发动【休息时间】",
				trigger: {
					global: "phaseDiscardAfter"
				},
				filter(event, player) {
					return event.player != player && event.player.countCards("h") == player.countCards("h") && !event.player.hasSkill("hidden_yzs")
				},
				check(event, player) {
					if (player.storage.tuiyidele_yzs) {
						return get.attitude(player, event.player) < 0;
					} else {
						return get.attitude(player, event.player) > 0;
					}
				},
				async content(event, trigger, player) {
					await trigger.player.addTempSkill("tuiyidele_yzs_phaseDiscardAfter_buff");
				},
				ai: {
					expose: 0.2,
					threaten: 1.1
				},
			}
		},
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str = `其他角色回合开始时/弃牌阶段结束时，若其手牌数＝你，你可令其判定/结束阶段改为发动【休息时间】：`
				str += storage ? `②弃2张牌` : `①：摸2张牌`;
				return str;
			},
		},
		trigger: {
			player: ["phaseDrawBefore", "phaseDiscardBefore"],
		},
		async content(event, trigger, player) {
			player.changeZhuanhuanji("tuiyidele_yzs");
			trigger.cancel();
			if (player.storage.tuiyidele_yzs) {
				await player.draw(2);
			} else {
				await player.chooseToDiscard("hej", 2, true);
			}
		},
	},
	tuiyidele_yzs_phaseBegin_buff: {
		locked: true,
		forced: true,
		popup: false,
		sub: true,
		sourceSkill: "tuiyidele_yzs_phaseBegin",
		trigger: { player: "phaseJudgeBefore" },
		filter(event, player) {
			let floris = game.filterPlayer(current => current.hasSkill("tuiyidele_yzs"));
			if (!floris.length) return false;
			floris = floris[0];
			return true;
		},
		async content(event, trigger, player) {
			let floris = game.filterPlayer(current => current.hasSkill("tuiyidele_yzs"));
			if (!floris.length) return false;
			floris = floris[0];
			floris.changeZhuanhuanji("tuiyidele_yzs");
			trigger.cancel();
			if (floris.storage.tuiyidele_yzs) {
				await player.draw(2);
			} else {
				await player.chooseToDiscard("hej", 2, true);
			}
		}
	},
	tuiyidele_yzs_phaseDiscardAfter_buff: {
		locked: true,
		forced: true,
		popup: false,
		sub: true,
		sourceSkill: "tuiyidele_yzs_phaseDiscardAfter",
		trigger: { player: "phaseJieshuBefore" },
		filter(event, player) {
			let floris = game.filterPlayer(current => current.hasSkill("tuiyidele_yzs"));
			if (!floris.length) return false;
			floris = floris[0];
			return true;
		},
		async content(event, trigger, player) {
			let floris = game.filterPlayer(current => current.hasSkill("tuiyidele_yzs"));
			if (!floris.length) return false;
			floris = floris[0];
			floris.changeZhuanhuanji("tuiyidele_yzs");
			trigger.cancel();
			if (floris.storage.tuiyidele_yzs) {
				await player.draw(2);
			} else {
				await player.chooseToDiscard("hej", 2, true);
			}
		}
	},
	daqijingshen_yzs: {
		nobracket: true,
		group: "daqijingshen_yzs_phaseUse",
		subSkill: {
			phaseUse: {
				logTarget: "player",
				"prompt2": "你可令其下一额定弃牌阶段改为你的出牌阶段",
				trigger: {
					global: "phaseUseAfter"
				},
				filter(event, player) {
					if (event.skill) return false;
					return event.player != player && event.player.countCards("h") == player.countCards("h") && !event.player.hasSkill("hidden_yzs")
				},
				async content(event, trigger, player) {
					await trigger.player.addTempSkill("daqijingshen_yzs_phaseUse_buff");
				}
			}
		},
		prompt: "你摸或弃3张牌(不选牌则摸3张牌)",
		enable: "phaseUse",
		usable: 1,
		selectTarget: -1,
		filterTarget: function (card, player, target) {
			return target == player
		},
		filterCard: true,
		selectCard() {
			let player = get.event().player;
			return [0, 3]
		},
		filterOk() {
			const player = get.player();
			return ui.selected.cards.length == 0 || ui.selected.cards.length == Math.min(player.countCards("hej"), 3);
		},
		position: "hej",
		check: function (card) {
			return 0
		},
		async content(event, trigger, player) {
			if (event.cards.length == 0) await player.draw(3);
		},
		ai: {
			order:7,
			result: {
				player:3,
			},
			threaten:1.1
		}
	},
	daqijingshen_yzs_phaseUse_buff: {
		locked: true,
		forced: true,
		popup: false,
		sub: true,
		sourceSkill: "daqijingshen_yzs_phaseUse",
		trigger: { player: "phaseDiscardBefore" },
		filter(event, player) {
			if (event.skill) return false;
			let floris = game.filterPlayer(current => current.hasSkill("tuiyidele_yzs"));
			if (!floris.length) return false;
			floris = floris[0];
			return true;
		},
		async content(event, trigger, player) {
			let floris = game.filterPlayer(current => current.hasSkill("tuiyidele_yzs"));
			if (!floris.length) return false;
			floris = floris[0];
			var next = floris.phaseUse();
			event.next.remove(next);
			trigger.next.push(next);
			trigger.cancel();
		}
	},
	//鲁日立
	jixiong_yzs: {
		group: ["jixiong_yzs_gain"],
		subSkill: {
			gain: {
				forced: true,
				preHidden: true,
				trigger: {
					player: "damageEnd",
				},
				filter(event, player) {
					return get.itemtype(event.cards) == "cards" && get.position(event.cards[0], true) == "o";
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, "effect/chickun.wav");
					player.gain(trigger.cards, "gain2");
				},
			}
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num - 1;
			},
		},
		locked: true,
		forced: true,
		trigger: {
			source: "damageSource",
		},
		filter: function (trigger, player) {
			return trigger.player !== player;
		},
		async content(event, trigger, player) {
			if (!trigger.player.hasSkill("jixiong_yzs_buff")) trigger.player.addSkill("jixiong_yzs_buff")
			const card = get.cards(1);
			let next = trigger.player.addToExpansion(card, "gain2", player)
			next.gaintag.add("jixiong_yzs_buff");
			await next;
			await trigger.player.useSkill("jixiong_yzs_buff")
		},
		ai: {
			maixie: true,
			"maixie_hp": true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
					if (get.tag(card, "damage")) {
						return [1, 0.55];
					}
				},
			},
		},
	},
	jixiong_yzs_buff: {
		nopop:true,
		markimage: 'extension/一中杀/image/jixiong_yzs_buff.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("jixiong_yzs_buff");
				dialog.addAuto(cards);
			},
		},
		popup: false,
		direct: true,
		sub: true,
		sourceSkill: "jixiong_yzs",
		locked: true,
		async content(event, trigger, player) {
			if (player.countExpansions("jixiong_yzs_buff") < 3) return;
			const cock = game.filterPlayer(current => current.hasSkill("jixiong_yzs"))[0];
			if (!cock) return;
			const cards = player.getExpansions("jixiong_yzs_buff");
			await player.loseToDiscardpile(player.getExpansions("jixiong_yzs_buff"))
			await player.loseHp();
			let next = await cock.chooseButton(["伤痕", "选择其中1张牌", cards], 1, true)
				.set("ai", button => get.value(button.link))
				.forResult()
			if (next && next.bool) {
				let targets = await cock.chooseTarget("伤痕", "将此牌置为任意角色的【伤痕】（不选则你获得此牌）", 1, false)
					.set('ai', target => {
						const player = _status.event.player;
						let card = get.event().card;
						if (get.tag(card, "recover")) return 0;
						return get.damageEffect(target, player, player);
					})
					.set("card", next.links[0])
					.forResult()
				if (!targets.bool) {
					await cock.gain(next.links, "giveAuto", "log");
				}
				else {
					if (!targets.targets[0].hasSkill("jixiong_yzs_buff")) targets.targets[0].addSkill("jixiong_yzs_buff")
					const card = next.links;
					let next3 = targets.targets[0].addToExpansion(card, "giveAuto", targets.targets[0])
					next3.gaintag.add("jixiong_yzs_buff");
					targets.targets[0].$gain2(card, false);
					await next3;
					await targets.targets[0].useSkill("jixiong_yzs_buff")
				}
			}

		}
	},
	geju_yzs: {
		enable: "phaseUse",
		usable: 1,
		filterCard: true,
		selectCard: [1, Infinity],
		position: "h",
		check: function (card) {
			if (card.name == "sha") return 4;
			return 4 - get.value(card);
		},
		discard: false,
		lose: false,
		delay: false,
		filterTarget: function (card, player, target) {
			return player !== target && !target.hasSkill("hidden_yzs");
		},
		async content(event, trigger, player) {
			let num = event.cards.filter(card => card.name == "sha").length;
			await player.showCards(event.cards)
			await player.give(event.cards, event.target, "giveAuto");
			await player.gainPlayerCard(event.target, "h", true, event.cards.length);
			while (num) {
				await event.target.damage(0);
				num--;
			}
		},
		ai: {
			order: 4,
			threaten: 1.1,
			expose:0.2,
			result: {
				target: -1,
				player:1,
			}
		}
	},
	fengnong_yzs: {
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.hasPlayer(current => player != current);
		},
		filterTarget: function (card, player, target) {
			return player != target && !target.hasSkill("hidden_yzs");
		},
		selectTarget: -1,
		multiline: true,
		multitarget: true,
		async content(event, trigger, player) {
			await player.recover();
			if (!event.targets || !event.targets.length) return;			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/chicken_you_are_so_beautiful.mp3");

			for (let target of event.targets) {
				const result = await target
					.chooseToUse(
						"讽弄：对 鲁日立 使用1张手牌或令 鲁日立 摸1张牌",
						function (card) {
							return lib.filter.filterCard.apply(this, arguments);
						},
						function (card, player, target) {
							if (target != get.event().targetx) return false;
							return lib.filter.filterTarget.apply(this, arguments);
						}
					)
					.set("ai2", function () {
						return get.effect_use.apply(this, arguments) - get.event("effect");
					})
					.set("targetx", player)
					.set("effect", get.effect(target, { name: "losehp" }, target, target))
					.set("addCount", false)
					.forResult();
				if (!result?.bool) {
					await player.draw();
				}
			}
		},
		ai: {
			order: 5,
			result: {
				player:2,
			},
			threaten:1.1
		}
	},
	//琪诺
	xueke_yzs: {
		group: ["xueke_yzs_tag", "xueke_yzs_recover", "xueke_yzs_change", "xueke_yzs_damage", "xueke_yzs_show"],
		derivation: "shikong_yzs",
		global: ["xueyin_yzs", "xueke_yzs_tag", "xueke_yzs_recover"],
		locked: true,
		forced: true,
		trigger: { player: "damageBegin3" },
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			await player.draw();
			if (!trigger.source?.isIn()) return;
			const result = await player.chooseCard("h", 1, true, function (card) {
				return true;
			})
				.set("ai", (card) => {
					return 6-get.value(card)
				})
				.forResult()
			player.addGaintag(result.cards, "eternal_xueke_yzs_tag");
			if (trigger.source == player) return;
			await player.give(result.cards, trigger.source);
		},
		subSkill: {
			show: {
				forced: true,
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					global: "phaseBegin"
				},
				filter(event, player) {
					if (event.player == player) return false;
					if (player.hp != 1) return false;
					if (event.player.countCards("h", card => card.hasGaintag("eternal_xueke_yzs_tag")) == 0) return false;
					return true;
				},
				async content(event, trigger, player) {
					const cards = trigger.player.getCards("h", card => card.hasGaintag("eternal_xueke_yzs_tag"))
					await trigger.player.showCards(cards);
					await trigger.player.damage(cards.length);

				}
			},
			damage: {
				audio: "ext:一中杀/audio/skill:1",
				forced: true,
				trigger: {
					source: "damageSource",
				},
				filter(event, player) { return event.num > 0 && player.hp == 1 && !event.xueke_yzs_change; },
				async content(event, trigger, player) {
					await player.recover(trigger.num);
				}
			},
			change: {
				audio: "ext:一中杀/audio/skill:1",
				forced: true,
				trigger: {
					player: ["changeHp"]
				},
				filter(event, player) {
					return player.hp == 1;
				},
				async content(event, trigger, player) {
					const evt = trigger.getParent();
					if (evt.name == "damage") {
						evt.xueke_yzs_change = true;
					}
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Chino2_yzs.png");
					}, player)
					player.addSkill("shikong_yzs");
					if (player != _status.currentPhase) return;
					if (player.countMark("shikong_yzs") < 2) player.addMark("shikong_yzs", 2 - player.countMark("shikong_yzs"), false);
				},
			},
			recover: {
				popup: false,
				forced: true,
				trigger: {
					player: ["loseAfter", "compare", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "showCardsBegin"],
					target: "compare",
				},
				filter(event, player, name) {
					let par = event.getParent();
					if (par && par.name == "swapHandcards") return false;
					if (par && par.name == "gain") return false;
					if (par && par.name == "give") return false;
					if (name == "showCardsBegin") {
						for (let card of event.cards) {
							if (card.hasGaintag("eternal_xueke_yzs_tag")) return true;
						}
						return false;
					}
					if (name == "compare") {
						if (player == event.player) {
							if (event.iwhile > 0) {
								return false;
							}
							return event.card1.hasGaintag("eternal_xueke_yzs_tag")
						}
						return event.card2.hasGaintag("eternal_xueke_yzs_tag")
					}
					var evt = event.getl(player);
					if (
						!evt ||
						!evt.hs ||
						!evt.hs.filter(function (i) {
							return i.hasGaintag("eternal_xueke_yzs_tag")
						}).length
					) {
						return false;
					}
					return true;
				},
				async content(event, trigger, player) {
					let prince = game.filterPlayer(current => current.hasSkill("xueke_yzs"));
					if (prince.length) prince = prince[0];
					if (trigger.name == "compare") {
						if (player == event.player) {
							if (trigger.iwhile > 0) {
								return false;
							}
							if (trigger.card1.hasGaintag("eternal_xueke_yzs_tag")) {
								player.removeGaintag("eternal_xueke_yzs_tag", trigger.card1);
								game.log(player, "明置了【血印】")
								await prince.recover(trigger.card1.length);
								return;
							}
						}
						if (trigger.card2.hasGaintag("eternal_xueke_yzs_tag")) {
							player.removeGaintag("eternal_xueke_yzs_tag", trigger.card2);
							game.log(player, "明置了【血印】")
							await prince.recover(trigger.card2.length);
							return;
						}
					}
					if (trigger.name == "showCards") {
						let ds = trigger.cards.filter(function (card) {
							return card.hasGaintag("eternal_xueke_yzs_tag")
						});
						if (ds.length) player.removeGaintag("eternal_xueke_yzs_tag", ds);
						game.log(player, "明置了【血印】")
						await prince.recover(ds.length);
						return;

					}
					let evt = trigger.getl(player);
					let ds = evt.cards2.filter(function (card) {
						return card.hasGaintag("eternal_xueke_yzs_tag")
					});
					if (ds.length) player.removeGaintag("eternal_xueke_yzs_tag", ds);
					game.log(player, "明置了【血印】")
					if (!prince||!prince.length) return;
					prince = prince[0];
					await prince.recover(ds.length);
				}
			},
			tag: {
				sub: true,
				sourceSkill: "xueke_yzs",
				"_priority": 0,
			},
		},
		ai: {
			maixie: true,
			"maixie_hp": true,
		},
	},
	shikong_yzs: {
		nopop: true,
		markimage: 'extension/一中杀/image/shikong_yzs.png',
		intro: {
			name: "失控",
			content: function (storage, player) {
				if (!player.countMark("shikong_yzs")) return "当前不能免伤"
				return "无视受到的伤害，持续至你下回合结束"
			},
		},
		mod: {
			maxHandcard: function (player, num) {
				if (player.hp == 1) return 4;
			},
		},
		sub: true,
		charlotte: true,
		forced: true,
		trigger: { player: "damageBegin2" },
		group: ["shikong_yzs_time", "shikong_yzs_change"],
		subSkill: {
			change: {
				forced: true,
				popup: false,
				trigger: {
					player: "changeHp",
				},
				filter(event, player) {
					return player.hp != 1;
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (current) {
						if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Chino_yzs.png");
					}, player)
					//		player.removeSkill("shikong_yzs");
				},
			},
			time: {
				charlotte: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseEnd"
				},
				filter(event, player) {
					return player.countMark("shikong_yzs")
				},
				async content(event, trigger, player) {
					player.removeMark("shikong_yzs", false);
					if (!player.countMark("shikong_yzs")) player.removeTip("xueke_yzs_change");
				}
			}
		},
		filter(event, player) {
			return player.countMark("shikong_yzs");
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
		ai: {
			nodamage: true,
		},
	},
	xueyin_yzs: {
		charlotte: true,
		forced: true,
		popup: false,
		mod: {
			ignoredHandcard: function (card, player) {
				if (card.hasGaintag('eternal_xueke_yzs_tag') && player.hasSkill("aiqi_yzs")) return true;
			},
			canBeGained: function (card, source, player) {
				if (player.getCards('h').includes(card) && card.hasGaintag("eternal_xueke_yzs_tag") && source != player) return false;
			},
			canBeDiscarded: function (card, source, player) {
				if (player.getCards('h').includes(card) && card.hasGaintag("eternal_xueke_yzs_tag")) return false;
			},
		},
	},
	kexue_yzs: {
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:1",
		trigger: { player: "phaseBegin" },
		async content(event, trigger, player) {
			if (player.hp == 1) {
				await player.draw(2);
			}
			else {
				var next = player.chooseToDiscard("弃置1张红色牌，否则对自己造成1点伤害", "hej", { color: "red" });
				next.logSkill = "lichang";
				next.ai = function (card) {
					return 2 - get.value(card);
				};
				await next;
				if (!next.result.bool) await player.damage();
			}
		}
	},
	yuyan_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		prompt: "观看1名其他角色的手牌，并与他交换至多1张手牌（若失控则可交换至多3张）",
		usable: 1,
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return target != player  && !target.hasSkill("hidden_yzs")&&target.countCards("h");
		},
		async content(event, trigger, player) {
			const { target } = event;
			const num = (player.hp == 1) ? 3 : 1;
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
				const player=get.event().player
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
			let next = player.chooseButton([2,2*num], dialog);
			next.set("target", target);
			next.set("forced", false);
			next.set("filterButton", filterButton);
			next.set("filterOk", filterOk);
			next.set("complexSelect", true);
			next.set("ai", processAI);
			let result = await next.forResult();
			if (result.bool && result.links.length) {
				let cards1 = result.links.filter(i => get.owner(i) == player)
				let cards2 = result.links.filter(i => get.owner(i) != player)
				await player.swapHandcards(target, cards1, cards2);
			}
			await game.delayex();
			await player.damage();
		}
	},
	aiqi_yzs: {
		group: ["aiqi_yzs_discard", "aiqi_yzs_decrease"],
		subSkill: {
			discard: {
				markimage: 'extension/一中杀/image/aiqi_yzs_discard.png',
				markcount: false,
				intro: {
					name: "哀泣",
					content: function (storage, player) {
						return "下一回合结束时将弃置全部手牌"
					},
				},
				forced: true,
				priority: 100,
				trigger: { player: "phaseEnd" },
				async content(event, trigger, player) {
					if (player.countMark("aiqi_yzs_discard")) {
						await player.discard(player.getCards("h"));
						player.clearMark("aiqi_yzs_discard", false)
					}
					player.setMark("aiqi_yzs_discard", 1, false);
				},
				ai: {
					nogain: true,
				}
			},
			decrease: {
				forced: true,
				popup: false,
				priority: 3,
				trigger: {
					player: ["changeHp"],
				},
				filter(event, player) {
					return event.num < 0 && player.countMark("aiqi_yzs_discard");
				},
				async content(event, trigger, player) {
					player.clearMark("aiqi_yzs_discard", false);
				}
			}
		},
		locked: true,
		forced: true,
		trigger: {
			player: "recoverBefore",
		},
		filter(event, player) {
			if (player.isDying()) return false;
			let evt = event.getParent();
			if (evt.skill && (evt.skill === "xueke_yzs_damage" || evt.skill === "xueke_yzs_recover")) return false;
			let card = event.card;
			if (evt.player == player && card) {
				return false;
			}
		},
		async content(event, trigger, player) {
			trigger.cancel();
		}
	},
	//希儿
	shuangsheng_yzs: {
		derivation: "yanmie_yzs",
		mark: true,
		marktext: "<span style=\"text-decoration: line-through;\">双生</span>",
		markimage: 'extension/一中杀/image/shuangsheng_yzs.png',
		intro: {
			name: "双生",
			content: function (storage, player) {
				let str = ``;
				if (player.storage.twins.life.dead) str += `“生”形态处于“量子态”<br>`;
				if (player.storage.twins.death.dead) str += `“死”形态处于“量子态”<br>`;
				str += `当前sp值：` + player.countMark("shuangsheng_yzs");
				return str
			},
		},
		derivation: ["yanmie_yzs"],
		group: ["shuangsheng_yzs_maxhujia", "shuangsheng_yzs_change", "shuangsheng_yzs_dying", "shuangsheng_yzs_cost", "shuangsheng_yzs_shan"],
		subSkill: {
			maxhujia: {
				locked: true,
				forced: true,
				popup:false,
				direct: true,
			    lastDo:true,
				trigger: {
					player:"changeHujiaBegin"
				},
				filter(event, player) {
					const num = 2 - player.hujia;
					return event.num > num;
				},
				async content(event, trigger, player) {
					const num = 2 - player.hujia;
					trigger.num = num;
					if (num == 0) trigger.cancel();
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
						player.markSkill("shuangsheng_yzs")
						player.removeTip("chuangsheng_yzs");
						await player.removeSkill("chuangsheng_yzs");
						await player.addSkill("yanmie_yzs");
						if (player.storage.xierlast_used) {
							player.addTip("yanmie_yzs", "湮灭 ≤" + player.storage.xierlast_used, false);
						}
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Seele_Vollerei2_yzs.png");
						}, player)
					} else {
						player.storage.status_avatar = player.storage.twins.life;
						player.markSkill("status_avatar");
						player.removeTip("yanmie_yzs");
						await player.removeSkill("yanmie_yzs");
						await player.addSkill("chuangsheng_yzs");
						if (player.storage.xierlast_used) {
							player.addTip("chuangsheng_yzs", "创生 ≥" + player.storage.xierlast_used, false);
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
				sourceSkill: "shuangsheng_yzs",
			},
			dying: {
				firstDo: true,
				locked: true,
				forced: true,
				forceunique: true,
				superCharlotte: true,
				charlotte: true,
				trigger: {
					player: "dyingBegin",
				},
				async content(event, trigger, player) {
					await player.recover(Math.max(1,player.maxHp - player.hp));
					if (!player.storage.status_avatar.dead) {
						await player.draw(2);
						if (player.countMark("shuangsheng_yzs")<7)player.addMark("shuangsheng_yzs", Math.min(2, 7 - player.countMark("shuangsheng_yzs")), false)
						player.storage.status_avatar.dead = true;
						if (player.storage.twins.life.dead && player.storage.twins.death.dead) await player.die(trigger.reason);
					}
					await player.turnOver();
				}
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
					player.setMark("shuangsheng_yzs", 3, false)
					const evt = event.getParent("phase", true);
					if (evt?.player == player) {
						game.log(player, "结束了回合");
						evt.num = evt.phaseList.length;
						evt.goto(11);
					}
				}
			},
			shan: {
				locked: true,
				mod: {
					ignoredHandcard: function (card, player) {
						if (get.name(card) == "shan") {
							return true;
						}
					},
				},
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
			player.markSkill("shuangsheng_yzs")
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
			await player.chooseToDiscard(3,true)
			player.addMark("shuangsheng_yzs", 3, false)
			await player.changeHujia(2);
		},
		mod: {
			aiValue(player, card, num) {
				if (card.name === "tao") {
					return num / 10;
				}
			},
		}
	},
	chuangsheng_yzs: {
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
			player.addTip("chuangsheng_yzs", "创生 ≥" + get.number(event.card), false);
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
					if (!evt || !evt.card ) {
						return num;
					}
					if (evt.card.number && evt.card.number >= get.number(card)) {
						return num + 10;
					}
				}
			},
			targetInRange: function (card,player) {
				if (card && card.number >= player.storage.xierlast_used) return true;
			},
			cardUsable: function (card,player, num) {
				if (card && card.number >= player.storage.xierlast_used) return Infinity;
			},
		},
		ai: {
			threaten:2.0
		}
	},
	yanmie_yzs: {
		direct: true,
		popup: true,
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			player.addTip("yanmie_yzs", "湮灭 ≤" + get.number(event.card), false);
			player.storage.xierlast_used = get.number(event.card);
			player.markSkill("xierlast_used");
			var evt = lib.skill.chuangsheng_yzs.getLastUsed(player,event);
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
			targetInRange: function (card,player) {
				if (card && card.number <= player.storage.xierlast_used) return true;
			},
			cardUsable: function (card, player, num) {
				if (card && card.number <= player.storage.xierlast_used) return Infinity;
			},
		},
		ai: {
			threaten: 2.0
		}
	},
	xieshengzhijing_yzs: {
		nobracket: true,
		locked: true,
		group: ["xieshengzhijing_yzs_damage", "xieshengzhijing_yzs_hujia"],
		subSkill: {
			damage: {
				locked: true,
				forced: true,
				trigger: {
					source: "damageSource",
				},
				filter(event, player) { return player.countMark("shuangsheng_yzs") < 7 },
				async content(event, trigger, player) {
					if (player.countMark("shuangsheng_yzs") < 7) player.addMark("shuangsheng_yzs", 1,false)
				}
			},
			hujia: {
				locked: true,
				forced: true,
				trigger: {
					player: "changeHujiaEnd",
				},
				filter(event, player) { return event.num < 0 },
				async content(event, trigger, player) {
					await player.draw();
				}
			},
		},
		enable: "phaseUse",
		filter(event, player) {
			return player.getCards("h", { name: "shan" }).length
		},
		filterCard: {
			name: "shan",
		},
		check(card) {
			return 9 - get.value(card);
		},
		async content(event, trigger, player) {
			await player.turnOver();
		},
	},
	niworuyi_yzs: {
		nobracket: true,
		locked: true,
		group: ["niworuyi_yzs_renew", "niworuyi_yzs_hujia"],
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					if (event.skill) return false;
					return player.countMark("niworuyi_yzs_used");
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				async content(event,trigger,player) {
					player.clearMark("niworuyi_yzs_used", false);
				}
			},
			hujia: {
				enable: "phaseUse",
				filter(event, player) {
					return player.countMark("shuangsheng_yzs") >= 5;
				},
				async content(event, trigger, player) {
					player.removeMark("shuangsheng_yzs", 5, false)
					if (lib.config.background_audio) {
						game.playAudio("effect", "recover");
					}
					game.broadcast(function () {
						if (lib.config.background_audio) {
							game.playAudio("effect", "recover");
						}
					});
					if (player.hujia < 2) await player.changeHujia(2 - player.hujia);
					player.storage.twins.life.dead = false;
					player.storage.twins.death.dead = false;
					player.markSkill("twins");
					var card = get.discardPile(card => card.name == "shan");
					if (card) await player.gain(card, "gain2");
				},
				ai: {
					order: 1,
					result: {
						player(player) {
							if (player.hujia >= 2) return 0;
							let v = 0;
							if (player.storage.twins.life.dead) v += 2;
							if (player.storage.twins.death.dead) v += 2;
							if (player.hujia < 2) v += 2 - player.hujia;
							return v > 2;
						}
					}
				}
			}
		},
		prompt2: "无咏唱：你消耗3点sp，然后翻面并摸2-X张牌（X为你护甲值）",
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("niworuyi_yzs");
		},
		clickableFilter: function (player) {
			return player.countMark("shuangsheng_yzs") > 2 && !player.countMark("niworuyi_yzs_used");
		},
		clickableContent: async function (event, trigger, player) {
			let result = await player.chooseBool(`是否发动【你我如一】?<br>你消耗3点sp，然后翻面并摸${2-player.hujia}张牌`)
				.forResult();
			if (!result.bool) return;
			await player.useSkill("niworuyi_yzs")
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return player.countMark("shuangsheng_yzs") > 2 && !player.countMark("niworuyi_yzs_used");
		},
		async content(event, trigger, player) {
			player.removeMark("shuangsheng_yzs", 3, false)
			player.addMark("niworuyi_yzs_used", 1, false)
			await player.turnOver();
			if (2 - player.hujia>0) {
				await player.draw(2 - player.hujia);
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			threaten:2.2,
			order:8,
			result: {
				player(player) {
					if (player.hujia >= 2) return 0;
					let v = 0;
					if (player.hujia < 2) v += (2 - player.hujia);
					return v > 1;
				}
			}
		}
	},
	//千面李暮
	aoman_yzs: {
		mod: {
			cardEnabled(card, player) {
				if (get.type(card) == 'delay') return false;
			},
			targetEnabled(card, player, target, now) {
				if (get.type(card) == 'delay') return false;
			},
		}
	},
	qianmian_yzs: {
		locked: true,
		forced: true,
		charlotte: true,
		init: function (player, skill) {
			if (!player.storage[skill]) {
				player.storage[skill] = {
					character: ["Qianmian_Limu_yzs"],
					choosed: [],
					map: {
						Qianmian_Limu_yzs: ["qianmian_yzs_effect1", "qianmian_yzs_effect2"],
					},
				};
			}
			if (!player.storage.qianmian_yzs.choosed.length) {
				player.storage.qianmian_yzs.choosed.add("Qianmian_Limu_yzs");
				player.storage.qianmian_yzs.current2 = "qianmian_yzs_effect1";
				player.addAdditionalSkills("qianmian_yzs", "qianmian_yzs_effect1");
			}
		},
		banned: ["lisu", "sp_xiahoudun", "xushao", "jsrg_xushao", "zhoutai", "old_zhoutai", "shixie", "xin_zhoutai", "dc_shixie", "old_shixie"],
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "锁定技", "转换技", "蓄力技", "蓄能技", "连招技"],
		addHuashen(player) {
			if (!player.storage.qianmian_yzs) {
				return;
			}
			if (!_status.characterlist) {
				game.initCharactertList();
			}
			_status.characterlist.randomSort();
			for (let i = 0; i < _status.characterlist.length; i++) {
				let name = _status.characterlist[i];
				if (name.indexOf("zuoci") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || get.is.double(name) || lib.skill.qianmian_yzs.banned.includes(name) || player.storage.qianmian_yzs.character.includes(name)) {
					continue;
				}
				let skills = lib.character[name][3].filter(skill => {
					const categories = get.skillCategoriesOf(skill, player);
					return !categories.some(type => lib.skill.qianmian_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
				});
				if (skills.length) {
					player.storage.qianmian_yzs.character.push(name);
					player.storage.qianmian_yzs.map[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens(player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.qianmian_yzs.addHuashen(player);
				if (name) {
					list.push(name);
				}
			}
			if (list.length) {
				player.markSkill("qianmian_yzs");
				player.updateMarks("qianmian_yzs");
				game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g假面");
				lib.skill.qianmian_yzs.drawCharacter(player, list);
			}
		},
		removeHuashen(player, links) {
			player.storage.qianmian_yzs.character.removeArray(links);
			_status.characterlist.addArray(links);
			game.log(player, "移去了", get.cnNumber(links.length) + "张", "#g假面");
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
			const skills = info[3].filter(function (skill) {
				const categories = get.skillCategoriesOf(skill, get.player());
				return !categories.some(type => lib.skill.qianmian_yzs.bannedType.includes(type))
			});
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
							uiintro.add('<div><div class="skilln">' + get.translation(skills[i]) + "</div><div>" + get.skillInfoTranslation(skills[i]) + "</div></div>");
						} else {
							uiintro.add('<div><div class="skill">【' + translation + "】</div><div>" + get.skillInfoTranslation(skills[i]) + "</div></div>");
						}
						if (lib.translate[skills[i] + "_append"]) {
							uiintro._place_text = uiintro.add('<div class="text">' + lib.translate[skills[i] + "_append"] + "</div>");
						}
					}
				}
			};
			return node;
		},
		mark: true,
		markimage: 'extension/一中杀/image/qianmian_yzs.png',
		intro: {
			onunmark(storage, player) {
				_status.characterlist.addArray(storage.character);
				storage.character = [];
			},
			mark(dialog, storage, player) {
				if (storage && storage.current) {
					dialog.addSmall([[storage.current], (item, type, position, noclick, node) => lib.skill.qianmian_yzs.$createButton(item, type, position, noclick, node)]);
				}
				if (storage && storage.current2) {
					dialog.add('<div><div class="skill">【' + get.translation(lib.translate[storage.current2 + "_ab"] || get.translation(storage.current2).slice(0, 2)) + "】</div><div>" + get.skillInfoTranslation(storage.current2, player) + "</div></div>");
				}
				if (storage && storage.character.length) {
					if (player.isUnderControl(true)) {
						dialog.addSmall([storage.character, (item, type, position, noclick, node) => lib.skill.qianmian_yzs.$createButton(item, type, position, noclick, node)]);
					} else {
						dialog.addText("共有" + get.cnNumber(storage.character.length) + "张“假面”");
					}
				} else {
					return "没有假面";
				}
			},
			content(storage, player) {
				return "共有" + get.cnNumber(storage.character.length) + "张“假面”";
			},
			markcount(storage, player) {
				if (storage && storage.character) {
					return storage.character.length;
				}
				return 0;
			},
		},
		priority:4,
		audio: "ext:一中杀/audio/skill:1",
		trigger: { player: "phaseBegin" },
		async content(event, trigger, player) {
			lib.skill.qianmian_yzs.removeHuashen(player, [player.storage.qianmian_yzs.character[0]]);
			lib.skill.qianmian_yzs.addHuashens(player, 1);
			_status.noclearcountdown = true;
			const id = lib.status.videoId++,
				prompt = "你选择1项该人物的通常技描述替换本技能红字描述。";
			const cards = player.storage.qianmian_yzs.character;
			if (player.isOnline2()) {
				player.send(
					(cards, prompt, id) => {
						const dialog = ui.create.dialog(prompt, [cards, lib.skill.qianmian_yzs.$createButton]);
						dialog.videoId = id;
					},
					cards,
					prompt,
					id
				);
			}
			const dialog = ui.create.dialog(prompt, [cards, lib.skill.qianmian_yzs.$createButton]);
			dialog.videoId = id;
			if (!event.isMine()) {
				dialog.style.display = "none";
			}
			const finish = () => {
				if (player.isOnline2()) {
					player.send("closeDialog", id);
				}
				dialog.close();
				delete _status.noclearcountdown;
				if (!_status.noclearcountdown) {
					game.stopCountChoose();
				}
			};
			while (true) {
				const next = player.chooseButton(true).set("dialog", id);
				next.set("ai", button => {
					const { player, cond } = get.event();
					let skills = player.storage.qianmian_yzs.character.map(i => get.character(i).skills).flat();
					skills.randomSort();
					skills.sort((a, b) => get.skillRank(b, cond) - get.skillRank(a, cond));
					return player.storage.qianmian_yzs.map[button.link].includes(skills[0]) ? 2.5 : 1 + Math.random();
				});
				next.set("cond", event.triggername);
				const result = await next.forResult();
				const card = result.links[0];
				const func = function (card, id) {
					const dialog = get.idDialog(id);
					if (dialog) {
						//禁止翻页
						const paginationInstance = dialog.paginationMap?.get(dialog.content.querySelector(".buttons"));
						if (paginationInstance?.state) {
							paginationInstance.state.pageRefuseChanged = true;
						}
						for (let i = 0; i < dialog.buttons.length; i++) {
							if (dialog.buttons[i].link == card) {
								dialog.buttons[i].classList.add("selectedx");
							} else {
								dialog.buttons[i].classList.add("unselectable");
							}
						}
					}
				};
				if (player.isOnline2()) {
					player.send(func, card, id);
				} else if (event.isMine()) {
					func(card, id);
				}
				const result2 = await player
					.chooseControl(player.storage.qianmian_yzs.map[card])
					.set("ai", () => {
						const { player, cond, controls } = get.event();
						let skills = controls.slice();
						skills.randomSort();
						skills.sort((a, b) => get.skillRank(b, cond) - get.skillRank(a, cond));
						return skills[0];
					})
					.set("cond", event.triggername)
					.forResult();
				const control = result2.control;
				finish();
				player.storage.qianmian_yzs.choosed.add(card);
				player.storage.qianmian_yzs.current2 = control;
				if (!player.additionalSkills.qianmian_yzs?.includes(control)) {
					player.flashAvatar("qianmian_yzs", card);
					player.markSkill("qianmian_yzs");
					player.updateMarks("qianmian_yzs");
					await player.addAdditionalSkills("qianmian_yzs", control);
				}
				return;
			}
		},
	},
	qianmian_yzs_effect1: {
		locked: true,
		group: "hidden_yzs",
	},
	qianmian_yzs_effect2: {
		locked:true,
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + 2
				}
			},
		},
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		filter(event, player) {
			if (player.countCards("h") == 6) return false;
			for (var i = 0; i < 4; i++) {
				evt = evt.getParent("qianmian_yzs_effect2");
				if (evt.name != "qianmian_yzs_effect2") {
					return true;
				}
			}
			return false;
		},
		async content(event,trigger,player) {
			var num = 6 - player.countCards("h");
			if (num > 0) {
				await player.draw(num);
			} else {
				await player.chooseToDiscard("h", true, -num);
			}
		},
		ai: {
			nogain: true,
			nolose: true,
			nodiscard: true,
			nokeep: true,
			noh:true,
		},
	},
	tiance_yzs: {
		init: function (player, skill) {
			if (!player.storage.tiance_yzs_last) {
				player.storage.tiance_yzs_last = "";
				player.markSkill("tiance_yzs_last");
			}
			if (!player.storage.tiance_yzs_damage) {
				player.storage.tiance_yzs_damage = false;
				player.markSkill("tiance_yzs_damage")
			}
			if (!player.storage.tiance_yzs_judge) {
				player.storage.tiance_yzs_judge = false;
				player.markSkill("tiance_yzs_judge")
			}
		},
		markimage: 'extension/一中杀/image/tiance_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("tiance_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【策】";
			},
		},
		locked: true,
		forced: true,
		group: ["tiance_yzs_start", "tiance_yzs_trick", "tiance_yzs_basic", "tiance_yzs_judge", "tiance_yzs_damage", "tiance_yzs_renew"],
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				filter(event, player) {
					if (event.skill) return false;
					return true;
				},
				content() {
					player.storage.tiance_yzs_damage = false;
					player.markSkill("tiance_yzs_damage")
					player.storage.tiance_yzs_judge = false;
					player.markSkill("tiance_yzs_judge")
				}
			},
			start: {
				audio: "tiance_yzs",
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				async content(event, trigger, player) {
					let cards = get.cards(game.countPlayer() + 3);
					var next = await player.chooseToMove("调整【策】的顺序", true)
						.set("list", [["靠左为顶", cards]])
						.set("filterOk", function (moved) {
							return true;
						})
						.set("processAI", function (list) {
							var cards = list[0][1].slice(0);
							cards.sort(function (a, b) {
								return get.value(b) - get.value(a);
							});
							return [cards];
						})
						.forResult();
					if (next.bool) {
						var cards2 = next.moved[0].reverse();
						let next2 = player.addToExpansion(cards2, player, "draw")
						next2.gaintag.add("tiance_yzs")
						await next2
					}
				}
			},
			trick: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					if (!player.getExpansions("tiance_yzs").length) return false;
					return get.type(event.card) === "trick" && event.player !== player && player.storage.tiance_yzs_last != "trick";
				},
				async cost(event, trigger, player) {
					let cards = [player.getExpansions("tiance_yzs")[0]]
					let result = await player.chooseButton(["天策", "【鬼谋】：无效之", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "black"
						})
						.set("target",trigger.player)
						.set("ai", (button) => {
							const player = get.event().player;
							const target = get.event().target;
							return get.attitude(player, target);
						})
						.forResult()
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				logTarget: "player",
				async content(event, trigger, player) {
					player.storage.tiance_yzs_last = "trick";
					player.markSkill("tiance_yzs_last");
					const chooseCardResultCards = event.cost_data;
					await player.loseToDiscardpile(chooseCardResultCards)
					trigger.targets.length = 0;
					trigger.all_excluded = true;
					game.log(trigger.card, "被无效了");
					if (!player.getExpansions("tiance_yzs").length) return
					let cards = [player.getExpansions("tiance_yzs")[0]]
					let result = await player.chooseButton(["天策", "【神算】或【鬼谋】：获得之", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link)
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					if (result.bool == false) return
					await player.loseToDiscardpile(result.links);
					await player.gain(trigger.cards, 'gain2');
					return;
					if (!player.getExpansions("tiance_yzs").length) return
					cards = [player.getExpansions("tiance_yzs")[0]]
					let result2 = await player.chooseButton(["天策", "【神算】：摸1张牌", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "red"
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					if (result2.bool == false) return
					await player.loseToDiscardpile(result2.links);
					await player.draw();
				},
				sub: true,
				sourceSkill: "tiance_yzs",
				"_priority": 0,
			},
			basic: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					if (!player.getExpansions("tiance_yzs").length) return false;
					return get.type(event.card) === "basic" && event.player !== player && player.storage.tiance_yzs_last != "basic";
				},
				async cost(event, trigger, player) {
					let cards = [player.getExpansions("tiance_yzs")[0]]
					let result = await player.chooseButton(["天策", "【神算】：摸1张牌", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "red"
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				logTarget: "player",
				async content(event, trigger, player) {
					player.storage.tiance_yzs_last = "basic";
					player.markSkill("tiance_yzs_last");
					const chooseCardResultCards = event.cost_data;
					await player.loseToDiscardpile(chooseCardResultCards)
					await player.draw();
					if (!player.getExpansions("tiance_yzs").length) return
					let cards = [player.getExpansions("tiance_yzs")[0]]
					let result = await player.chooseButton(["天策", "【神算】：获得之", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "red";
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					if (result.bool == false) return
					await player.loseToDiscardpile(result.links);
					await player.gain(trigger.cards, 'gain2');
				},
				sub: true,
				sourceSkill: "tiance_yzs",
				"_priority": 0,
			},
			judge: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				logTarget: "player",
				trigger: {
					global: "judge",
				},
				filter(event, player) {
					if (player.storage.tiance_yzs_judge) return false;
					if (player.storage.tiance_yzs_last == "judge") return false;
					if (event.player.hasSkill("hidden_yzs")) return false;
					return player.countExpansions("tiance_yzs") > 0
				},
				async cost(event, trigger, player) {
					let cards = [player.getExpansions("tiance_yzs")[0]];
					let result = await player.chooseButton(["天策", "【鬼谋】：以此【鬼谋】代替之", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "black"
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					if (result.bool == false) return
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				async content(event, trigger, player) {
					player.storage.tiance_yzs_judge = true;
					player.markSkill("tiance_yzs_judge")
					player.storage.tiance_yzs_last = "judge";
					player.markSkill("tiance_yzs_last");
					const chooseCardResultCards = event.cost_data;
					await player.loseToDiscardpile(chooseCardResultCards)
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
					if (!player.getExpansions("tiance_yzs").length) return
					let cards = [player.getExpansions("tiance_yzs")[0]]
					let result = await player.chooseButton(["天策", "【神算】：你视为使用【顺手牵羊】", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "red"
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					if (result.bool == false) return
					await player.loseToDiscardpile(result.links);
					if (game.hasPlayer(function (target) {
						return player.canUse({ name: "shunshou" }, target)
					})) {
						await player.chooseUseTarget("天策", "请选择【顺手牵羊】的目标", { name: "shunshou", isCard: false, }, true)
					}
					if (!player.getExpansions("tiance_yzs").length) return
					cards = [player.getExpansions("tiance_yzs")[0]]
					let result3 = await player.chooseButton(["天策", `【神算】/【鬼谋】：令${get.translation(trigger.player)}跳过其下一弃牌阶段/摸牌阶段`, cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link)
						})
						.set("target", trigger.player)
						.set("ai", (button) => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.color(button) == "red") return get.attitude(player, target);
							return -get.attitude(player, target);
						})
						.forResult()
					if (result3.bool == false) return
					await player.loseToDiscardpile(result3.links);
					if (get.color(result3.links) == "red") {
						await trigger.player.addSkill("tiance_yzs_judge_buff_red");
					} else {
						await trigger.player.addSkill("tiance_yzs_judge_buff_black");
					}
				},
				sub: true,
				sourceSkill: "tiance_yzs",
				"_priority": 0,
			},
			damage: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				logTarget: "source",
				trigger: {
					player: "damageEnd",
				},
				filter(event, player) {
					if (player.storage.tiance_yzs_damage) return false;
					if (player.storage.tiance_yzs_last == "damage") return false;
					if (!event.source || event.source.hasSkill("hidden_yzs")) return false;
					return player.countExpansions("tiance_yzs") > 0
				},
				async cost(event, trigger, player) {
					let cards = [player.getExpansions("tiance_yzs")[0]]
					let result = await player.chooseButton(["天策", "【鬼谋】：伤害来源弃1张黑色牌或失去1点体力", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "black"
						})
						.set("target", trigger.player)
						.set("ai", (button) => {
							const player = get.event().player;
							const target = get.event().target;
							return -get.attitude(player, target);
						})
						.forResult()
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				async content(event, trigger, player) {
					player.storage.tiance_yzs_damage = true;
					player.markSkill("tiance_yzs_damage")
					player.storage.tiance_yzs_last = "damage";
					player.markSkill("tiance_yzs_last");
					const chooseCardResultCards = event.cost_data;
					await player.loseToDiscardpile(chooseCardResultCards)
					const { source } = trigger;
					let result =
						source.countCards("he") < 1
							? { bool: false }
							: await source
								.chooseToDiscard(1, `弃置1张黑色牌，否则失去1点体力`, "he", { color: "black" })
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
						await source.loseHp();
					}
					if (!player.getExpansions("tiance_yzs").length) return
					let cards = [player.getExpansions("tiance_yzs")[0]]
					result = await player.chooseButton(["天策", "【鬼谋】：你恢复1点体力", cards], false)
						.set("filterButton", function (button) {
							return get.color(button.link) == "black";
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult()
					if (result.bool == false) return
					await player.loseToDiscardpile(result.links);
					await player.recover()
				},
				sub: true,
				sourceSkill: "tiance_yzs",
				"_priority": 0,
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		trigger: {
			player: "phaseUseBegin",
		},
		async content(event, trigger, player) {
			if (!player.getExpansions("tiance_yzs").length) {
				lib.skill.qianmian_yzs.removeHuashen(player, [player.storage.qianmian_yzs.character[0]]);
				player.storage.qianmian_yzs.character.push("Qianmian_Limu_yzs");
				player.storage.qianmian_yzs.choosed.add("Qianmian_Limu_yzs");
				player.storage.qianmian_yzs.current2 = "qianmian_yzs_effect2";
				if (!player.additionalSkills.qianmian_yzs?.includes(control)) {
					player.flashAvatar("qianmian_yzs", "Qianmian_Limu_yzs");
					player.markSkill("qianmian_yzs");
					player.updateMarks("qianmian_yzs");
					await player.addAdditionalSkills("qianmian_yzs", "qianmian_yzs_effect2");
				}
			} else await player.loseToDiscardpile(player.getExpansions("tiance_yzs"));
			let cards = get.cards(game.countPlayer() + 3);

			var next = await player.chooseToMove("调整【策】的顺序", true)
				.set("list", [["靠左为顶", cards]])
				.set("filterOk", function (moved) {
					return true;
				})
				.set("processAI", function (list) {
					var cards = list[0][1].slice(0);
					cards.sort(function (a, b) {
						return get.value(b) - get.value(a);
					});
					return [cards];
				})
				.forResult();
			if (next.bool) {
				var cards2 = next.moved[0].reverse();
				let next2 = player.addToExpansion(cards2, player, "draw")
				next2.gaintag.add("tiance_yzs")
				await next2
			}
		}
	},
	tiance_yzs_judge_buff_red: {
		charlotte: true,
		forced: true,
		popup: false,
		sub: true,
		sourceSkill: "tiance_yzs_judge",
		trigger: {
			player: "phaseDiscardBefore",
		},
		content: function () {
			trigger.cancel();
			game.log(player, "跳过了弃牌阶段(千面)")
			player.removeSkill("tiance_yzs_judge_buff_red")
		},

	},
	tiance_yzs_judge_buff_black: {
		charlotte: true,
		forced: true,
		popup: false,
		sub: true,
		sourceSkill: "tiance_yzs_judge",
		trigger: {
			player: "phaseDrawBefore",
		},
		content: function () {
			trigger.cancel();
			game.log(player, "跳过了摸牌阶段(千面)")
			player.removeSkill("tiance_yzs_judge_buff_black")
		},
	},
	shenzhiyishou_yzs: {
		nobracket: true,
		locked: true,
		group: ["shenzhiyishou_yzs_renew", "shenzhiyishou_yzs_red", "shenzhiyishou_yzs_black"],
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					if (event.skill) return false;
					return player.countMark("shenzhiyishou_yzs_used");
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				content() {
					player.clearMark("shenzhiyishou_yzs_used", false);
				}
			},
			red: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (!player.getExpansions("tiance_yzs").length || get.color(player.getExpansions("tiance_yzs")[0]) != "red") return false;
					return !player.countMark("shenzhiyishou_yzs_used");
				},
				async content(event, trigger, player) {
					player.addMark("shenzhiyishou_yzs_used", 1, false);
					await player.loseToDiscardpile(player.getExpansions("tiance_yzs")[0])
					let cards = player.getExpansions("tiance_yzs");
					let result = await player.chooseToMove("将任意张手牌与【策】交换")
						.set("list", [
							[get.translation(player) + "（你）的【策】", cards],
							["手牌区", player.getCards("h")],
						])
						.set("filterMove", function (from, to) {
							return typeof to != "number";
						})
						.set("processAI", list => {
							const num = Math.min(list[0][1].length, list[1][1].length);
							const cards1 = list[0][1].slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
							const cards2 = list[1][1].slice().sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
							return [cards1.slice().addArray(cards2.slice(0, num)), cards2.slice().addArray(cards1.slice(0, num))];
						})
						.forResult();
					var pushs = result.moved[0],
						gains = result.moved[1];
					gains.removeArray(player.getCards("h"));
					pushs.reverse();
					await player.loseToSpecial(pushs);
					let next = player.addToExpansion(pushs, player, "draw")
					next.gaintag.add("tiance_yzs");
					next.untrigger(true);
					await next;
					player.gain(gains, "draw");
					const evt = event.getParent(2);
					if (evt.name == "chooseToUse") {
						evt.goto(0);
						delete evt.openskilldialog;
					}
				}
			},
			black: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				enable: "phaseUse",
				position: "hej",
				filterCard() {
					const targets = ui.selected.targets;
					if (targets.length == 2) {
						if (Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) <= ui.selected.cards.length) {
							return false;
						}
					}
					return true;
				},
				selectCard: [0, Infinity],
				selectTarget: 2,
				complexCard: true,
				filterTarget(card, player, target) {
					if (player == target) {
						return false;
					}
					return true;
				},
				filterOk() {
					const targets = ui.selected.targets;
					if (targets.length != 2) {
						return false;
					}
					return Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) == ui.selected.cards.length;
				},
				multitarget: true,
				multiline: true,
				filter(event, player) {
					if (game.filterPlayer(cur => cur != player).length < 2) return false;
					if (!player.getExpansions("tiance_yzs").length || get.color(player.getExpansions("tiance_yzs")[0]) != "black") return false;
					return !player.countMark("shenzhiyishou_yzs_used");
				},
				check(card) {
					const list = [], player = _status.event.player;
					const num = player.countCards("he");
					const players = game.filterPlayer();
					let count;
					for (let i2 = 0; i2 < players.length; i2++) {
						if (players[i2] != player && get.attitude(player, players[i2]) > 3) {
							list.push(players[i2]);
						}
					}
					list.sort(function (a, b) {
						return a.countCards("h") - b.countCards("h");
					});
					if (list.length == 0) {
						return -1;
					}
					const from = list[0];
					list.length = 0;
					for (let i2 = 0; i2 < players.length; i2++) {
						if (players[i2] != player && get.attitude(player, players[i2]) < 1) {
							list.push(players[i2]);
						}
					}
					if (list.length == 0) {
						return -1;
					}
					list.sort(function (a, b) {
						return b.countCards("h") - a.countCards("h");
					});
					if (from.countCards("h") >= list[0].countCards("h")) {
						return -1;
					}
					for (let i2 = 0; i2 < list.length && from.countCards("h") < list[i2].countCards("h"); i2++) {
						if (list[i2].countCards("h") - from.countCards("h") <= num) {
							count = list[i2].countCards("h") - from.countCards("h");
							break;
						}
					}
					if (count < 2 && from.countCards("h") >= 2) {
						return -1;
					}
					if (ui.selected.cards.length < count) {
						return 11 - get.value(card);
					}
					return -1;
				},
				async content(event, trigger, player) {
					await player.loseToDiscardpile(player.getExpansions("tiance_yzs")[0])
					player.addMark("shenzhiyishou_yzs_used", 1, false);
					await event.targets[0].swapHandcards(event.targets[1]);
				},
				ai: {
					order: 6,
					threaten: 3,
					expose: 0.9,
					result: {
						target(player, target) {
							const list = [];
							const num = player.countCards("he");
							const players = game.filterPlayer();
							if (ui.selected.targets.length == 0) {
								for (let i2 = 0; i2 < players.length; i2++) {
									if (players[i2] != player && get.attitude(player, players[i2]) > 3) {
										list.push(players[i2]);
									}
								}
								list.sort(function (a, b) {
									return a.countCards("h") - b.countCards("h");
								});
								if (target == list[0]) {
									return get.attitude(player, target);
								}
								return -get.attitude(player, target);
							} else {
								const from = ui.selected.targets[0];
								for (let i2 = 0; i2 < players.length; i2++) {
									if (players[i2] != player && get.attitude(player, players[i2]) < 1) {
										list.push(players[i2]);
									}
								}
								list.sort(function (a, b) {
									return b.countCards("h") - a.countCards("h");
								});
								if (from.countCards("h") >= list[0].countCards("h")) {
									return -get.attitude(player, target);
								}
								for (let i2 = 0; i2 < list.length && from.countCards("h") < list[i2].countCards("h"); i2++) {
									if (list[i2].countCards("h") - from.countCards("h") <= num) {
										const count = list[i2].countCards("h") - from.countCards("h");
										if (count < 2 && from.countCards("h") >= 2) {
											return -get.attitude(player, target);
										}
										if (target == list[i2]) {
											return get.attitude(player, target);
										}
										return -get.attitude(player, target);
									}
								}
							}
						},
					},
				},
			},
		},
		prompt2: "无咏唱：移去顶端【神算】，然后将任意张手牌与【策】交换",
		init: function (player, skill) {
			player.yzs_InitShunfaji(skill);
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation(skill)) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("shenzhiyishou_yzs");
		},
		clickableFilter: function (player) {
			if (!player.getExpansions("tiance_yzs").length || get.color(player.getExpansions("tiance_yzs")[0]) != "red") return false;
			return !player.countMark("shenzhiyishou_yzs_used");
		},
		clickableContent: async function (event, trigger, player) {
			let ask = await player.chooseBool(`是否发动【神之一手】?<br>移去顶端【神算】，然后将任意张手牌与【策】交换`)
				.forResult();
			if (!ask.bool) return;
			player.addMark("shenzhiyishou_yzs_used", 1, false);
			await player.loseToDiscardpile(player.getExpansions("tiance_yzs")[0])
			let cards = player.getExpansions("tiance_yzs");
			let result = await player.chooseToMove("将任意张手牌与【策】交换")
				.set("list", [
					[get.translation(player) + "（你）的【策】", cards],
					["手牌区", player.getCards("h")],
				])
				.set("filterMove", function (from, to) {
					return typeof to != "number";
				})
				.set("processAI", list => {
					const num = Math.min(list[0][1].length, list[1][1].length);
					const cards1 = list[0][1].slice().sort((a, b) => get.value(a, "raw") - get.value(b, "raw"));
					const cards2 = list[1][1].slice().sort((a, b) => get.value(b, "raw") - get.value(a, "raw"));
					return [cards1.slice().addArray(cards2.slice(0, num)), cards2.slice().addArray(cards1.slice(0, num))];
				})
				.forResult();
			var pushs = result.moved[0],
				gains = result.moved[1];
			gains.removeArray(player.getCards("h"));
			pushs.reverse();
			await player.loseToSpecial(pushs);
			let next = player.addToExpansion(pushs, player, "draw")
			next.gaintag.add("tiance_yzs");
			await next;
			await player.gain(gains, "draw");
		},
	},
	//菲伦
	Zoltraak_yzs: {
		group: ["Zoltraak_yzs_use"],
		marktext: "弑",
		intro: {
			markcount(storage) {
				return storage.length;
			},
			mark(dialog, content, player) {
				const storage = player.getStorage("Zoltraak_yzs");
				const names = storage;
				dialog.addText("当前记录牌名：");
				dialog.addSmall([names, "vcard"]);
			},
		},
		nobracket:true,
		subSkill: {
			use: {
				priority: 51,
				direct: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return event.card?.storage?.Zoltraak_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
					await player.draw();
					for (var i of trigger.cards) {
						if (!player.storage.Zoltraak_yzs.includes(i.name)) {
							player.storage.Zoltraak_yzs.add(i.name);
							player.markSkill("Zoltraak_yzs");
							player.tempBanSkill("Zoltraak_yzs");

							let index = Math.ceil(Math.random() * 3)
							let path = `ext:一中杀/audio/skill/Zoltraak_yzs_use${index}.mp3`
							game.broadcastAll((path) => {
								game.playAudio(path);
							}, path);
							return;
						}
					}
					if (trigger.card.name != "sha") player.tempBanSkill("Zoltraak_yzs");
				},
				mod: {
					targetInRange: function (card) {
						if (card?.storage?.Zoltraak_yzs) {
							return true;
						}
					},
					cardUsable(card, player, num) {
						if (card?.storage?.Zoltraak_yzs) {
							return Infinity
						}
					},
				}
			}
		},
		init: function (player, skill) {
			if (Array.isArray(player.storage.Zoltraak_yzs)) return;
			player.storage.Zoltraak_yzs = [];
			player.syncStorage("Zoltraak_yzs");
			player.markSkill("Zoltraak_yzs");
		},
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard: function (player, name) {
			var type = get.type2(name);
			return (type == 'basic') && player.countCards('h') > 0;
		},
		filter: function (event, player) {
			if (!player.hasCard(function (card) {
				return get.type2(card) == "trick";
			}, "h")) return false;
			for (var i of lib.inpile) {
				var type = get.type2(i);
				if ((type == 'basic') && event.filterCard({ name: i, storage: { Zoltraak_yzs: true } }, player, event)) return true;
			}
			return false
		},
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					if (name == 'sha') {
						if (event.filterCard({ name: name, storage: { Zoltraak_yzs: true } }, player, event)) list.push(['基本', '', 'sha']);
						for (var j of lib.inpile_nature) {
							if (event.filterCard({ name: name, nature: j, storage: { Zoltraak_yzs: true } }, player, event)) list.push(['基本', '', 'sha', j]);
						}
					}
					else if (get.type(name) == 'basic' && event.filterCard({ name: name, storage: { Zoltraak_yzs: true } }, player, event)) list.push(['基本', '', name]);
				}
				return ui.create.dialog('弑魔魔法', [list, 'vcard']);
			},
			filter: function (button, player) {
				return _status.event.getParent().filterCard({ name: button.link[2], storage: { Zoltraak_yzs: true } }, player, _status.event.getParent());
			},
			check: function (button) {
				if (_status.event.getParent().type != 'phase') return 1;
				var player = _status.event.player;
				return player.getUseValue({
					name: button.link[2],
					nature: button.link[3],
				});
			},
			backup: function (links, player) {
				return {
					audio: "ext:一中杀/audio/skill:1",
					filterCard(card, player) {
						return get.type(card) == "trick" || get.type(card) == "delay";
					},
					popname: true,
					check: function (card) {
						const storage = player.getStorage("Zoltraak_yzs");
						if (storage.includes(card.name)) return 10;
						return 10 - get.value(card);
					},
					position: 'h',
					viewAs: { name: links[0][2], nature: links[0][3], storage: { Zoltraak_yzs: true } },
				}
			},
			prompt: function (links, player) {
				return '将1张锦囊牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用或打出，并摸1张牌';
			},
			"prompt2": "若底牌牌名为你首次因此转化，或转化牌不为【杀】，本技能本回合失效"
		},
		ai: {
			save: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player, tag, arg) {
				if (!player.countCards("hes") || player.isTempBanned("Zoltraak_yzs")) {
					return false;
				}
				return true
			},
			order: 4,
			result: {
				player(player) {
					var allshown = true,
						players = game.filterPlayer();
					for (var i = 0; i < players.length; i++) {
						if (players[i].ai.shown == 0) {
							allshown = false;
						}
						if (players[i] != player && players[i].countCards("h") && get.attitude(player, players[i]) > 0) {
							return 1;
						}
					}
					if (allshown) {
						return 1;
					}
					return 0;
				},
			},
			threaten: 1.9,
		},
	},
	Defend_yzs: {
		group: "Defend_yzs_draw",
		mod: {
			aiValue: function (player, card, num) {
				if (get.name(card) != 'wuxie' && get.color(card) != 'black') return;
				var cards = player.getCards('hs', function (card) {
					return get.name(card) == 'wuxie' || get.color(card) == 'black';
				});
				cards.sort(function (a, b) {
					return (get.name(b) == 'wuxie' ? 1 : 2) - (get.name(a) == 'wuxie' ? 1 : 2);
				});
				var geti = function () {
					if (cards.includes(card)) {
						return cards.indexOf(card);
					}
					return cards.length;
				};
				if (get.name(card) == 'wuxie') return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
				return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
			},
			aiUseful: function () {
				return lib.skill.Defend_yzs.mod.aiValue.apply(this, arguments);
			},
		},
		nobracket: true,
		locked: false,
		position: "h",
		enable: "chooseToUse",
		hiddenCard: function (player, name) {
			if (!player.countCards("h")) return
			return (name == 'wuxie')
		},
		filterCard: function (card) {
			return get.type(card) == 'basic';
		},
		viewAsFilter: function (player) {
			return player.countCards('h', { type: 'basic' }) > 0;
		},
		viewAs: {
			name: "wuxie",
			storage: { Defend_yzs: true }
		},
		check: function (card) {
			const player=get.player()
			if (_status.currentPhase == player) return 8 - get.value(card);
			else {
				if (card.name != "sha") return 12 - get.value(card);
			}
			return 8 - get.value(card);
		},
		prompt: "将1张基本牌当【无懈可击】使用,并摸1张牌",
		prompt2: "若底牌为【杀】，本技能本回合失效",
		check: function (card) { return 8 - get.value(card) },
		subSkill: {
			draw: {
				popup:false,
				forced: true,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return event.card.storage.Defend_yzs
				},
				async content(event, trigger, player) {
					await player.draw();
					if (trigger.cards.length > 1) return;
					if (trigger.cards[0].name == "sha") {
						player.tempBanSkill("Defend_yzs");
					}
				},
				sub: true,
				sourceSkill: "Defend_yzs",
				"_priority": 0,
			},
		},
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "wuxie" && get.type(card) != "basic") {
					return;
				}
				const cards2 = player.getCards("h", function (card2) {
					return get.name(card2) == "wuxie" || get.type(card) != "basic";
				});
				cards2.sort(function (a, b) {
					return (get.name(b) == "wuxie" ? 1 : 2) - (get.name(a) == "wuxie" ? 1 : 2);
				});
				const geti = function () {
					if (cards2.includes(card)) {
						return cards2.indexOf(card);
					}
					return cards2.length;
				};
				if (get.name(card) == "wuxie") {
					return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
				}
				return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.Defend_yzs.mod.aiValue.apply(this, arguments);
			},
		},
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
		"_priority": 0,
	},
	suyin_yzs: {
		prompt2: "限定技：场上角色回合结束后，你可执行额外回合",
		locked: true,
		limited: true,
		logTarget: "player",
		skillAnimation: true,
		animationColor: "thunder",
		trigger: {
			global: "phaseEnd",
		},
		check(event, player) {
			return game.hasPlayer(current => {
				if (get.attitude(player, current) >= 0) {
					return false;
				}
				const num =
					player.countCards("hs", card => {
						return get.tag(card, "damage") && player.canUse(card, current);
					}) + 1;
				return current.getHp() <= num;
			});
		},
		async content(event, trigger, player) {
			if (game.hasPlayer(cur => get.translation(cur).includes("芙莉莲"))) {
				game.broadcastAll(function (current) {
					_status.tempMusic = `ext:一中杀/audio/Zoltraak.mp3`;
					game.playBackgroundMusic();

					var background = document.createElement("img");
					background.className = "background";
					window._currentDynamicBackground = background;
					Object.assign(background, {
						src: lib.assetURL + "/extension/一中杀/image/background/Zoltraak.jpg",
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
			} else {
				game.broadcastAll(() => {
					_status.tempMusic = `ext:一中杀/audio/Zoltraak.mp3`;
					game.playBackgroundMusic();
					ui.backgroundMusic.addEventListener('ended', () => {
						delete _status.tempMusic;
						game.playBackgroundMusic();
					}, { once: true });
				});
			}
			player.awakenSkill("suyin_yzs");
		//	await player.draw(3);
			player.insertPhase().skill ="suyin_yzs";
		},
		ai: {
			threaten:2.1,
		}
	},
	//魔理沙
	MasterSpark_yzs: {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:3",
		mod: {
			targetInRange: function (card) {
				if (card.storage?.MasterSpark_yzs) {
					return true;
				}
			},
			cardUsable(card, player, num) {
				if (card.storage?.MasterSpark_yzs) {
					return Infinity
				}
			},
		},
		enable: ["chooseToUse", "chooseToRespond"],
		prompt: "♠无次数限制；♣无距离限制； ♦不可响应；♥伤害+1。",
		filter(event, player) {
			if (!player.countCards("h", {name:"sha"})) return false;
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				if (name == 'sha') {
					if (event.filterCard({ name: name, storage: { MasterSpark_yzs: true } }, player, event)) return true;
					for (var j of lib.inpile_nature) {
						if (event.filterCard({ name: name, nature: j, storage: { MasterSpark_yzs: true } }, player, event)) return false;
					}
				}
			}
			return false;
		},
		check(card) {
			return 7 - get.value(card);
		},
		position: "h",
		filterCard(card, player) {
			if (!ui.selected.cards.length) {
				return get.name(card) == "sha"
			}
			return true;
		},
		selectCard: [1, Infinity],
		selectTarget: 1,
		filterTarget: function (card, player, target) {
			if (typeof player.getStat("card")["sha"] === "number" && player.getStat("card")["sha"] > 0) {
				let has_spade = false;
				for (let card1 of ui.selected.cards) {
					if (card1.suit == "spade") has_spade = true;
				}
				if (!has_spade) return false;
			}
			if (ui.selected.cards.length) {
				for (let card1 of ui.selected.cards) {
					if (card1.suit == "club") return player.canUse({ name: "sha", isCard: true, storage: { MasterSpark_yzs: true } }, target, false)
				}
			}
			return player.canUse({ name: "sha", isCard: true }, target, true)
		},
		complexCard: true,
		complexSelect: true,
		complexTarget: true,
		discard: false,
		lose: false,
		delay: false,
		async content(event, trigger, player) {
			var list = [];
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				if (name == 'sha') {
					if (player.hasUseTarget({
						name: name,
						storage: { MasterSpark_yzs: true }
					})) list.push(['基本', '', 'sha']);
					for (var j of lib.inpile_nature) {
						if (player.hasUseTarget({
							name: name,
							storage: { MasterSpark_yzs: true }
						})) list.push(['基本', '', 'sha', j]);
					}
				}
			}
			let result = await player.chooseButton(["极限火花", [list, "vcard"]])
				.set("forced", true)
				.forResult();
			if (!result.bool) return
			let has_spade = false;
			game.trySkillAudio("bagua_skill");
			game.trySkillAudio("MasterSpark_yzs");
			let next = player.useCard({ name: "sha", isCard: true, nature: result.links[0][3], storage: { MasterSpark_yzs: true } }, event.cards, "MasterSpark_yzs", event.target);
			for (let card of event.cards) {
				if (get.suit(card) == "spade") has_spade = true;
				if (get.suit(card) == "heart") next.baseDamage = 2;
				if (get.suit(card) == "diamond") {
					next.directHit = [event.target];
				}
			}
			if (has_spade) next.addCount = false;
			await next;
		}
	},
	StardustReverie_yzs: {
		nobracket: true,
		charlotte: true,
		unique: true,
		group: ["StardustReverie_yzs_fuka"],
		subSkill: {
			fuka: {
				name:`魔符「星尘幻想」`,
				prompt: "将1张手牌当做【无中生有】使用",
				locked: true,
				enable: "phaseUse",
				precontent: function () {
					player.removeMark("Fuka_yzs", 1);
				},
				viewAs: {
					name: "wuzhong",
				},
				check(card) {
					return 5.1 - get.value(card);
				},
				filter(event, player) {
					return player.countMark("Fuka_yzs") > 0;
				},
				filterCard: true,
				position: "h",
				viewAsFilter(player) {
					return player.countCards("h", lib.skill.StardustReverie_yzs_fuka.filterCard) > 0;
				},
				ai: {
					threaten: 1.2,
					result: {
						player:2
					}
				}
			}
		},
		locked: true,
		prompt2: "你可摸1张牌，然后弃牌至手牌上限并获得弃牌数张符卡",
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			var cards = [];
			//因为是线下武将 所以同一张牌重复进入只算一张
			game.getGlobalHistory("cardMove", function (evt) {
				if (evt.name == "cardsDiscard" || (evt.name == "lose" && evt.position == ui.discardPile)) cards.addArray(evt.cards);
			});
			let suits = [];
			for (let card of cards) {
				if (!suits.includes(card.suit)) {
					suits.add(card.suit);
				}
			}
			return suits.length > 3;
		},
		check(event, player) {
			let num = player.needsToDiscard() + 1;
			if (player.countMark("Fuka_yzs") >= 3) return num <= 2;
			if (num + player.countMark("Fuka_yzs") - 3 > player.countCards("h") / 2) return false;
			return true;
		},
		async content(event, trigger, player) {
			await player.draw();
			let num = player.countCards("h") - player.getHandcardLimit();
			if (num > 0) {
				await player.chooseToDiscard("h", num);
				if (get.character(player.name).Fuka > player.countMark("Fuka_yzs")) player.addMark("Fuka_yzs", Math.min(num, get.character(player.name).Fuka - player.countMark("Fuka_yzs")));
			}
		}
	},
	IllusionStar_yzs: {
		nobracket: true,
		trigger: {
			target: "useCardToTargeted",
		},
		filter(event, player) {
			return event.player != player && event.cards && event.cards.length;
		},
		async content(event, trigger, player) {
			const cards = player.getCards("h");
			await player.showHandcards(player, "发动了【幻象之星】");
			for (let card of cards) {
				if (get.suit(card) == get.suit(trigger.card)) return;
			}
			var evt = trigger.getParent();
			evt.targets.length = 0;
			evt.all_excluded = true;
			game.log(evt.card, "被无效了");
			await player.gain(trigger.cards, "gain2")
		}
	},
	//比那名居天子
	Wonderful_Heaven_yzs: {
		nobracket: true,
		charlotte: true,
		unique: true,
		group: ["Wonderful_Heaven_yzs_yaoshi", "Wonderful_Heaven_yzs_damage", "Wonderful_Heaven_yzs_damageCancel", "Wonderful_Heaven_yzs_wusheng",
			"Wonderful_Heaven_yzs_handcard", "Wonderful_Heaven_yzs_draw", "Wonderful_Heaven_yzs_tianjie", "Wonderful_Heaven_yzs_drawtianjie"],
		subSkill: {
			yaoshi: {
				name: "要石",
				markimage: 'extension/一中杀/image/Wonderful_Heaven_yzs_yaoshi.png',
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						const cards = player.getExpansions("Wonderful_Heaven_yzs_yaoshi");
						dialog.addAuto(cards);
					},
				},
				locked: true,
				forced: true,
				popup:false,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				direct: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				async content(event, trigger, player) {
					player.logSkill("Wonderful_Heaven_yzs_yaoshi_name")
					var suits = [];
					var cards = [];
					while (suits.length < 4) {
						if ((ui.cardPile.childNodes || []).length == 0) {
							game.log("剩余牌中不足四种花色")
							break;
						}
						let card = get.cards(1);
						if (!card.length) break;
						if (!suits.includes(get.suit(card[0]))) {
							cards.push(card[0]);
							suits.add(get.suit(card[0]))
						}
					}
					if (!cards.length) return;
					let next = player.addToExpansion(cards, player, "gain2")
					next.gaintag.add("Wonderful_Heaven_yzs_yaoshi")
					await next;
				}
			},
			damage: {
				locked: true,
				priorit: 3,
				name:"灵想「镇守大地之石」",
				trigger: {
					player: "damageBegin4",
				},
				filter(event, player) {
					return player.countExpansions("Wonderful_Heaven_yzs_yaoshi") && event.num > 0;
				},
				async cost(event, trigger, player) {
					let cards = player.getExpansions("Wonderful_Heaven_yzs_yaoshi")
					let result = await player.chooseButton(["有顶天变", "移去1张【要石】，无效此伤害", cards], false)
						.set("filterButton", function (button) {
							return get.suit(button.link);
						})
						.set("ai", button => {
							const player = get.player();
							return 3 - player.countCards("h", {suit:get.suit(button)})
						})
						.forResult()
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				async content(event, trigger, player) {
					await player.loseToDiscardpile(event.cost_data);
					trigger.cancel();
					await player.showHandcards(player, "发动了【有顶天变】，无效本次伤害");
					let cardx = player.getCards("h", card => get.suit(card, player) == event.cost_data[0].suit);
					if (!cardx.length) return;
					const choice = await player
						.chooseButton(["选择弃置或置顶", [["1.弃置", "2.置顶"], "tdnodes"]], true)
						.set("ai", button => {
							let cards = get.event().cards;
							cards = cards.filter(i => get.value(i) > 5)
							if (cards.length >= 1 && button.link == "1.弃置") return 2;
							return 0;
						})
						.set("cards",cardx)
						.set("selectButton", 1)
						.forResult();
					if (choice?.links?.length) {
						const num = parseInt(choice.links[0].slice(0, 1));
						if (num == 1) await player.discard(cardx);
						else {
							await player.lose(cardx, ui.cardPile).set("insert_card", true)
							game.log(player, "将", get.cnNumber(cardx.length), "张牌置于了", "#y牌堆顶")
							game.updateRoundNumber();
						}
					}
				}
			},
			damageCancel: {
				name:"天人的飞翔",
				forced: true,
				locked: true,
				priorit: 5,
				trigger: {
					player: "damageBegin4",
				},
				filter(event, player) {
					return event.source && event.source != player && _status.currentPhase == player
				},
				async content(event, trigger, player) {
					trigger.cancel();
				}
			},
			handcard: {
				locked: true,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				forced: true,
				name:"地震[先忧后乐之剑]",
				filter(event, player) {
					if (player.countCards("h") <= 4) return false;
					if (event.name == "gain" && event.player == player) {
						return player.countCards("h") > 4;
					}
					var evt = event.getl(player);
					if (!evt || !evt.hs || evt.hs.length == 0) {
						return false;
					}
					var evt = event;
					for (var i = 0; i < 4; i++) {
						evt = evt.getParent("Wonderful_Heaven_yzs_handcard");
						if (evt.name != "Wonderful_Heaven_yzs_handcard") {
							return true;
						}
					}
					return false;
				},
				content() {
					var num = 4 - player.countCards("h");
					if (num < 0) {
						player.chooseToDiscard("h", true, -num);
					}
				},
				ai: {
					freeSha: true,
					freeShan: true,
					skillTagFilter() {
						return true;
					},
				},
			},
			draw: {
				forced: true,
				preHidden: true,
				name: "地震「先忧后乐之剑」",
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num += 2;
				},
				ai: {
					threaten: 2.5,
				},
				sub: true,
				"_priority": 0,
			},
			tianjie: {
				name:"天气「绯想天促」",
				locked: true,
				name: "天界",
				markimage: 'extension/一中杀/image/Wonderful_Heaven_yzs_tianjie.png',
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						const cards = player.getExpansions("Wonderful_Heaven_yzs_tianjie");
						if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
						else return "共有" + get.cnNumber(cards.length) + "张【天界】";
					},
				},
				trigger: {
					player: "loseAfter",
					global: "loseAsyncAfter",
				},
				direct: true,
				filter(event, player) {
					if (!event.cards || !event.cards.some(card => get.position(card, true) == "d")) return false;
					if (event.type != "discard" || event.player.isDead()) return false;
					if ((event.discarder && event.discarder != player) || event.getParent(2).player != event.player) return false;
					if (!event.getl(event.player).hs.length) return false;
					return true;
				},
				forced: true,
				async content(event, trigger, player) {
					let cards = trigger.cards.filter(card => get.position(card, true) == "d" && trigger.getl(trigger.player).hs.includes(card));
					if (!cards.length) return;
					if (cards.length == 1) {
						let next2 = player.addToExpansion(cards, player, "giveAuto")
						next2.gaintag.add("Wonderful_Heaven_yzs_tianjie")
						player.$gain2(cards, false);
						await next2
						return;
					}
					var next = await player.chooseToMove("调整置于【天界】顶的顺序", true)
						.set("list", [["靠左为顶，靠右为原【天界】顶", cards]])
						.set("filterOk", function (moved) {
							return true;
						})
						.set("processAI", function (list) {
							var cards = list[0][1].slice(0);
							cards.sort(function (a, b) {
								return get.value(b) - get.value(a);
							});
							return [cards];
						})
						.forResult();
					if (next.bool) {
						var cards2 = next.moved[0].reverse();
						let next2 = player.addToExpansion(cards2, player, "gain2")
						next2.gaintag.add("Wonderful_Heaven_yzs_tianjie")
						await next2
					}
				}
			},
			drawtianjie: {
				locked: true,
				LastDo: true,
				name:"全人类的绯想天",
				prompt: "你可改为从【天界】底摸牌",
				trigger: {
					player: "drawBegin",
				},
				filter(event, player) {
					return event.parent.name != "phaseDraw" && player.countExpansions("Wonderful_Heaven_yzs_tianjie")>0
				},
				check(event,player) {
					if (event.num > player.countExpansions("Wonderful_Heaven_yzs_tianjie")) return false;
					return Math.random() > 0.6;
				},
				async content(event, trigger, player) {
					let num = Math.min(trigger.num, player.countExpansions("Wonderful_Heaven_yzs_tianjie"));
					trigger.cancel();
					let cards = [];
					for (let i = 0; i < num; i++) {
						cards.push(player.getExpansions("Wonderful_Heaven_yzs_tianjie")[player.getExpansions("Wonderful_Heaven_yzs_tianjie").length - 1 - i])
					}
					await player.gain(cards)
					game.log(player, "从【天界】底摸了" + num + "张牌");
				},
			},
			wusheng: {
				locked: true,
				enable: ["chooseToUse"],
				name:"剑技「气焰万丈之剑」",
				prompt: "你可将任意手牌当做火【杀】使用",
				viewAs: {
					name: "sha",
					nature: "fire",
				},
				hiddenCard: function (player, name) {
					if (!player.countCards("h")) return
					return (name == 'sha')
				},
				position: "h",
				viewAsFilter(player) {
					if (!player.countCards("h")) {
						return false;
					}
				},
				filterCard: true,
				check(card) {
					return 5 - get.value(card);
				},
				ai: {
					skillTagFilter(player) {
						if (!player.countCards("h")) {
							return false;
						}
					},
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
				}
			},
		},
		locked: true,
		forced: true,
		mod: {
			maxHandcardBase: function (player, num) {
				return 4;
			},
			canBeGained: function (card, source, player) {
				if (player.getCards('h').includes(card) && source != player) return false;
			},
			canBeDiscarded: function (card, source, player) {
				if (player.getCards('h').includes(card) && source != player) return false;
			},
		},
		trigger: {
			player: ["phaseBegin", "phaseEnd"],
		},
		async content(event, trigger, player) {
			let gain = true;

			let yaoshi = player.getExpansions("Wonderful_Heaven_yzs_yaoshi");
			let yaoshisuits = [];
			let suits = [];
			for (let card of yaoshi) {
				if (!yaoshisuits.includes(card.suit)) yaoshisuits.add(card.suit);
			}
			for (let card of player.getCards("h")) {
				if (!yaoshisuits.includes(card.suit)) {
					gain = false;
					break;
				}
				if (!suits.includes(card.suit)) suits.add(card.suit);
			}
			if (gain) gain = (suits.length == yaoshisuits.length && suits.length > 0);

			if (gain) {
				await player.showHandcards(player, "发动了【有顶天变】,获得1张符卡");
				if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
			}
			if (player.countCards("h") < player.getHandcardLimit()) {
				await player.draw(player.getHandcardLimit() - player.countCards("h"));
			}
		}
	},
	tiandikaipi_yzs: {
		nobracket: true,
		popup:false,
		locked: true,
		group: ["tiandikaipi_yzs_draw"],
		subSkill: {
			draw: {
				name: "要石「天地开辟之挤压」",
				locked: true,
				enable: "phaseUse",
				usable: 2,
				filter(event, player) {
					return player.countExpansions("Wonderful_Heaven_yzs_tianjie") > 0
				},
				async content(event, trigger, player) {
					let cards = player.getExpansions("Wonderful_Heaven_yzs_tianjie")
					let result = await player.chooseButton(["天地开辟", "置顶1张【天界】牌，然后摸至多4张牌", cards], true)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai",button=>get.value(button))
						.forResult()
					if (!result.bool) return;
					await player.lose(result.links, ui.cardPile).set("insert_card", true)
					game.log(player, "将1张【天界】置于了", "#y牌堆顶")
					game.updateRoundNumber();
					const result2 = await player
						.chooseButton(["摸至多4张牌", [["1", "2", "3", "4"], "tdnodes"]], true)
						.set("filterButton", button => {
							return true;
						})
						.set("ai", button => parseInt(button.link))
						.forResult();
					if (result2?.links?.length) {
						const num = parseInt(result2.links[0]);
						await player.draw(num);
					}
				}
			},
		},
		trigger: {
			player: "phaseJudgeBegin",
		},
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			let yaoshi = player.getExpansions("Wonderful_Heaven_yzs_yaoshi");
			let yaoshisuits = [];
			let suits = [];
			for (let card of yaoshi) {
				if (!yaoshisuits.includes(card.suit)) yaoshisuits.add(card.suit);
			}
			for (let card of player.getCards("h")) {
				if (!yaoshisuits.includes(card.suit)) {
					return false;
					break;
				}
				if (!suits.includes(card.suit)) suits.add(card.suit);
			}
			return suits.length == yaoshisuits.length;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseToDiscard("h", "你可弃X张与【要石】同花色的异花色手牌", "然后视为使用至多X-1张火【杀】（X为【要石】数）", player.countExpansions("Wonderful_Heaven_yzs_yaoshi"), function (card, player) {
					if (ui.selected.cards.length) {
						let yaoshi = player.getExpansions("Wonderful_Heaven_yzs_yaoshi");
						let yaoshisuits = [];
						for (let card of yaoshi) {
							if (!yaoshisuits.includes(card.suit)) yaoshisuits.add(card.suit);
						}
						var suit = get.suit(card, player);
						for (var i of ui.selected.cards) {
							if (get.suit(i, player) == suit || !yaoshisuits.includes(get.suit(i, player))) {
								return false;
							}
						}
					}
					return true;
				})
				.set("ai", lib.skill.zhiheng.check)
				.set("complexCard", true)
				.forResult();
		},
		async content(event, trigger, player) {
			player.logSkill("tiandikaipi_yzs_name")
			let num = player.countExpansions("Wonderful_Heaven_yzs_yaoshi") - 1;
			let i = 1;
			while (i<=num) {
				let result = await player.chooseUseTarget(
					{
						name: "sha",
						nature: "fire",
						isCard: true,
					},
					"请选择火【杀】的目标（" + i + "/"+num+"）",
					false
				).forResult();
				if (!result.bool) return;
				i++;
			}
		}
	},
	guruojintangtao_yzs: {
		nobracket: true,
		locked: true,
		logTarget: "player",
		group: "guruojintangtao_yzs_renew",
		subSkill: {
			renew: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					if (event.skill) return false;
					return player.countMark("guruojintangtao_yzs_used");
				},
				locked: true,
				forced: true,
				popup: false,
				firstDo: true,
				content() {
					player.clearMark("guruojintangtao_yzs_used", false);
				}
			},
		},
		trigger: {
			global: "useCardToTarget",
		},
		filter(event, player) {
			if (event.guruojintangtao_yzs) return false;
			if (!get.tag(event.card, "damage")) return false;
			if (!player.countMark("Fuka_yzs")) return false;
			if (player.countMark("guruojintangtao_yzs_used") >= 3) return false;
			if (event.player == player) return false;
			if (event.targets.includes(player)) return false;
			return true;
		},
		check(event, player) {
			if (event.target == player) return true;
			return get.attitude(player, event.target) >= 1;
		},
		async content(event, trigger, player) {
			trigger.guruojintangtao_yzs = true;
			player.removeMark("Fuka_yzs");
			player.addMark("guruojintangtao_yzs_used", false)
			if (trigger.target == player) {
				trigger.getParent().excluded.add(player);
			} else {
				trigger.getParent().targets.remove(trigger.target);
				trigger.getParent().triggeredTargets2.remove(trigger.target);
				trigger.getParent().targets.push(player);
				trigger.untrigger();
				trigger.player.line(player);
				game.delayx();
			}
			if (!player.countExpansions("Wonderful_Heaven_yzs_tianjie")) return;
			if (!player.countExpansions("Wonderful_Heaven_yzs_yaoshi")) {
				await player.lose([player.getExpansions("Wonderful_Heaven_yzs_tianjie")[0]], ui.cardPile, "visible", "insert");
				return;
			}
			let cards = player.getExpansions("Wonderful_Heaven_yzs_yaoshi")
			let result = await player.chooseButton(["固若金汤桃", "将【天界】顶牌置顶或与1张【要石】替换】", cards], false)
				.set("filterButton", function (button) {
					let yaoshi = player.getExpansions("Wonderful_Heaven_yzs_yaoshi");
					let yaoshisuits = [];
					for (let card of yaoshi) {
						if (!yaoshisuits.includes(card.suit)) yaoshisuits.add(card.suit);
					}
					if (!yaoshisuits.includes(get.suit(player.getExpansions("Wonderful_Heaven_yzs_tianjie")[0]))) return true;
					return get.suit(button.link) == get.suit(player.getExpansions("Wonderful_Heaven_yzs_tianjie")[0]);
				})
				.forResult()
			if (!result.bool) {
				await player.loseToDiscardpile([player.getExpansions("Wonderful_Heaven_yzs_tianjie")[0]]);
			} else {
				let card1 = result.links;
				let card2 = [player.getExpansions("Wonderful_Heaven_yzs_tianjie")[0]];
				await player.loseToSpecial(card1);
				await player.loseToSpecial(card2);
				let tianjie = player.getExpansions("Wonderful_Heaven_yzs_tianjie").reverse();
				await player.loseToSpecial(tianjie);

				let next = player.addToExpansion(card2, player, "gain2")
				next.gaintag.add("Wonderful_Heaven_yzs_yaoshi")
				await next;
				let next3 = player.addToExpansion(tianjie, player, "gain2")
				next3.gaintag.add("Wonderful_Heaven_yzs_tianjie")
				await next3;
				let next2 = player.addToExpansion(card1, player, "gain2")
				next2.gaintag.add("Wonderful_Heaven_yzs_tianjie")
				await next2;
			}
		},
		ai: {
			expose:0.2,
		}
	},
	feixiangtian_yzs: {
		nobracket: true,
		locked: true,
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			if (player.getExpansions("Wonderful_Heaven_yzs_yaoshi").length) return false;
			let suits = [];
			for (let card of player.getCards("h")) {
				if (suits.includes(card.suit)) return false;
				suits.add(card.suit);
			}
			return true
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			let cards = player.getCards("h");
			let next = player.addToExpansion(cards, player, "give")
			next.gaintag.add("Wonderful_Heaven_yzs_yaoshi")
			await next;
			if (player.countCards("h") < player.getHandcardLimit()) {
				await player.draw(player.getHandcardLimit() - player.countCards("h"));
			}
		},
		ai: {
			order:6,
			result: {
				player:6
			},
			threaten:1,
		}
	},
	//小野塚小町
	bachongwuzhongdu_yzs: {
		nobracket: true,
		marktext: "死",
		intro: {
			name: "死",
			"name2": "死",
			content: "共有$/3枚“死”",
		},
		group: ["bachongwuzhongdu_yzs_gain", "bachongwuzhongdu_yzs_death", "bachongwuzhongdu_yzs_use"],
		subSkill: {
			gain: {
				locked: true,
				forced: true,
				name:"舟符「宛若河流般」",
				priority:2,
				trigger: {
					player: "phaseBefore"
				},
				async content(event, trigger, player) {
					if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs", 1);
					if (_status._yzsStorm == "WaterStorm") {
						await player.yzs_changeStorm("BulletStorm");
					} else {
						await player.yzs_changeStorm("WaterStorm");
					}
				},
			},
			death: {
				locked: true,
				forced: true,
				name: "死价「生命的价值」",
				trigger: {
					player: ["damageBegin3", "recoverEnd"]
				},
				async content(event, trigger, player) {
					if (player.countMark("bachongwuzhongdu_yzs") < 3) player.addMark("bachongwuzhongdu_yzs");
					if (trigger.name != "damage") return;
					if (!trigger.source) return;
					if (trigger.source.countCards("hej")) {
						const card = await trigger.source.chooseToDiscard(true)
							.set("position", "hej")
							.set("ai", function (card) {
								return 7 - get.value(card);
							})
							.forResult();
						if (get.color(card, trigger.source) == "black" && player.countMark("bachongwuzhongdu_yzs") < 3) {
							player.addMark("bachongwuzhongdu_yzs");
						}
					}
					await trigger.source.recover();
				}
			},
			use: {
				name: "古雨「黄泉中有旅途之雨」",
				locked: true,
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (_status._yzsStorm == "WaterStorm") return false;
					return player.countMark("bachongwuzhongdu_yzs") > 2;
				},
				async content(event, trigger, player) {
					player.removeMark("bachongwuzhongdu_yzs", 3);
					await player.yzs_SummonStorm("WaterStorm");
				},
				ai: {
					player:5,
				}
			}
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		charlotte: true,
		unique: true,
		forced: true,
		locked: true,
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			player.addMark("Fuka_yzs", 2);
		}
	},
	hunliliandao_yzs: {
		nobracket: true,
		group: "hunliliandao_yzs_death",
		subSkill: {
			death: {
				trigger: {
					global: "dieAfter",
				},
				charlotte: true,
				forced: true,
				popup: false,
				filter(event, player) {
					return event.getParent(2).name == "hunliliandao_yzs";
				},
				content() {
					player.addMark("Totem_yzs", 1)
				},
				sub: true,
				sourceSkill: "hunliliandao_yzs",
				"_priority": 0,
			}
		},
		locked: true,
		logTarget: "player",
		trigger: {
			global: "changeHp",
		},
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			if (event.player.isDying()) return false;
			return event.player.hp == 1;
		},
		check(event,player) {
			if (get.attitude(player, event.player) >= 0) return false;
			if (player.countMark("Fuka_yzs") >= get.character(player.name).Fuka) return true;
			let p = game.filterPlayer(cur => get.attitude(cur, event.player) > 0 && cur.countCards("h") >= 2);
			return p.length <= 2;
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			const evt = { source: player };
			await trigger.player.dying(evt ,true);
			player.addMark("bachongwuzhongdu_yzs", 1)
		}
	},
	Higan_Retour_yzs: {
		nobracket: true,
		locked: true,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			return player.countMark("Fuka_yzs") > 0 && player.countMark("bachongwuzhongdu_yzs") > 1;
		},
		async cost(event, trigger, player) {
			let num = player.countMark("bachongwuzhongdu_yzs");
			let str = "选择1名角色，令其恢复" + (num - 1) + "点体力，若其本次恢复体力溢出，你对其造成等于溢出量点伤害";
			const result = await player.chooseTarget()
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return true
				})
				.set("ai", (target) => {
					let player = get.player();
					let num = get.event().num;
					if (num <=1) return 0;
					let d = target.maxHp - target.hp
					if (get.attitude(player, target) > 0) {
						if (num > d) return 0;
						return num*get.recoverEffect(target, player, player);
					} else {
						if (d > 1) return 0;
						if (d == 0) return num * get.damageEffect(target, player, player)
						if (d == 1) return (num - 1) * get.damageEffect(target, player, player) - get.recoverEffect(target, player, player);
					}
				})
				.set("num",num-1)
				.set("prompt", "彼岸归航")
				.set("prompt2", str)
				.forResult();
			if (!result.bool) {
				event.result = {
					bool: false
				}
			} else {
				event.result = {
					bool: true,
					cost_data: result.targets[0],
				}
			}
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			let num = player.countMark("bachongwuzhongdu_yzs") - 1;
			let damagenum = num - (event.cost_data.maxHp - event.cost_data.hp);
			player.clearMark("bachongwuzhongdu_yzs");
			await event.cost_data.recover(num);
			if (damagenum > 0) await event.cost_data.damage(damagenum)
		},
	},
	//菜月昴
	nuoruo_yzs: {
		direct: true,
		popup: true,
		trigger: {
			player: "damageBegin4",
		},
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			await player.draw(trigger.num);
			if (trigger.source) {
				trigger.source.draw(trigger.num);
			}
		},
		ai: {
			maxie:true,
		}
	},
	monvdeyuxiang_yzs: {
		nobracket: true,
		derivation: "zhang_yzs",
		locked: true,
		group: ["monvdeyuxiang_yzs_die"],
		subSkill: {
			die: {
				forceDie: true,
				locked: true,
				forced: true,
				trigger: {
					global: "die",
				},
				filter(event, player) {
					if (!event.player.countCards("h")) return false;
					if (event.getParent(3).name == "zhang_yzs_buff") return true;
					if (event.source == player) return true;
					return false;
				},
				async content(event, trigger, player) {
					player.addSkill("zhang_yzs");
					const cards = trigger.player.getCards("h");
					let next = player.addToExpansion(cards, "give", player);
					next.set("forceDie", true)
					next.gaintag.add("zhang_yzs");
					await next;
				}
			},
		},
		trigger: {
			player: "phaseUseBegin",
		},
		filter(event, player) {
			return player.countCards("h") > player.getHandcardLimit();
		},
		async cost(event, trigger, player) {
			const num = player.countCards("h") - player.getHandcardLimit();
			const result = await player.chooseCardTarget("h", false)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return true
				})
				.set("ai1", card => {
					return 6-get.value(card)
				})
				.set("ai2", target => {
					const player = get.player();
					if (player.countExpansions("zhang_yzs") <= 4 && target == player) return 10;
					if (get.attitude(player, target) > 0) return 0;
					return 6 + num - get.attitude(player, target) - target.countExpansions("zhang_yzs")
				})
				.set("num",num)
				.set("selectCard", [1, num])
				.set("prompt", "魔女的余香")
				.set("prompt2", "你可将超出手牌上限的任意张手牌扣置为任意名角色的【瘴】")
				.forResult();
			if (result.bool) event.result = {
				bool: true,
				cost_data: {
					cards: result.cards,
					target: result.targets[0],
				},
			}
			else {
				event.result = {
					bool: false,
				}
			}
		},
		async content(event, trigger, player) {
			let cards = event.cost_data.cards;
			let target = event.cost_data.target;
			target.addSkill("zhang_yzs");
			let next = target.addToExpansion(cards, "give", target);
			next.gaintag.add("zhang_yzs");
			await next;
			while (player.countCards("h") > player.getHandcardLimit()) {
				let num = player.countCards("h") - player.getHandcardLimit();
				let result = await player.chooseCardTarget("h", false, [1, num])
					.set("filterTarget", (card, player, target) => {
						if (target.hasSkill("hidden_yzs")) return false;
						return true
					})
					.set("selectCard", [1, num])
					.set("prompt", "魔女的余香")
					.set("prompt2", "你可将超出手牌上限的任意张手牌扣置为任意名角色的【瘴】")
					.forResult();
				if (!result.bool) return;
				else {
					result.targets[0].addSkill("zhang_yzs");
					next = result.targets[0].addToExpansion(result.cards, "giveAuto", result.targets[0]);
					next.gaintag.add("zhang_yzs");
					await next;
				}
			}
		},
	},
	zhang_yzs: {
		group: ["zhang_yzs_die"],
		nopop:true,
		subSkill: {
			die: {
				locked: true,
				forceDie: true,
				popup: false,
				forced: true,
				trigger: {
					player: "discardBegin"
				},
				filter(event, player) {
					return player.countExpansions("zhang_yzs") && event.forceDie && event.getParent().name == "die";
				},
				async content(event, trigger, player) {
					trigger.cards = trigger.cards.filter(card => { return !player.getExpansions("zhang_yzs").includes(card) });
				}
			}
		},
		charlotte: true,
		locked: true,
		forced: true,
		sing: 1,
		sub: true,
		"_priority": 1,
		sourceSkill: "monvdeyuxiang_yzs",
		intro: {
			name: "瘴",
			markcount: "expansion",
			mark(dialog, _, player) {
				dialog.addText("吟唱1：选择：①将至少1张手牌加入自己的【瘴】；②获得自己全部【瘴】（获得张数记为X）下一出牌阶段开始前失去1点体力，结算期间令自己体力上下限均+X，结算后获得溢出体力值点护甲");
				if (player.countExpansions("zhang_yzs") > 0) {
					const cards = player.getExpansions("zhang_yzs");
					dialog.addAuto(cards);
				}
			},
		},
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name =="zhang_yzs"))player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						let result = await player.chooseCard("瘴", "选择：①将至少1张手牌加入自己的【瘴】；②获得自己全部【瘴】（获得张数记为X）下一出牌阶段开始前失去1点体力，结算期间令自己体力上下限均+X，结算后获得溢出体力值点护甲", "h", [1, Infinity], false)
							.set("ai", (card) => {
								const player = get.player();
								if (player.countExpansions("zhang_yzs") <= 2) return 0;
								if (ui.selected?.cards?.length && !player.hasSkill("siwanghuigui_yzs")) return 0;
								if (player.hasSkill("siwanghuigui_yzs") && player.countExpansions("zhang_yzs") >= 4) return 0;
								return 6 - get.value(card)
							})
							.forResult();
						if (!result.bool) {
							const num = player.countExpansions("zhang_yzs");
							player.yzs_clearCountDown(i => i.name == "zhang_yzs");
							player.removeSkill("zhang_yzs");
							await player.gain(player.getExpansions("zhang_yzs"), "gain2");
							player.addSkill("zhang_yzs_buff");
							player.addMark("zhang_yzs_buff", num, false)
						} else {
							let next = player.addToExpansion(result.cards, "give", player);
							next.gaintag.add("zhang_yzs");
							await next;
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "zhang_yzs",
				prompt: `选择：①将至少1张手牌加入自己的【瘴】；②获得自己全部【瘴】（获得张数记为X）下一出牌阶段开始前失去1点体力，结算期间令自己体力上下限均+X，结算后获得溢出体力值点护甲`,
				skill: "zhang_yzs"
			});
		},
	},
	zhang_yzs_buff: {
		group: "zhang_yzs_buff_overflow",
		subSkill: {
			overflow: {
				forced: true,
				popup: false,
				trigger: {
					player: "loseMaxHpAfter",
				},
				filter(event, player) {
					if (event.getParent().name != "zhang_yzs_buff") return false;
					return event.loseHp > 0;
				},
				async content(event, trigger, player) {
					await player.changeHujia(trigger.loseHp, "gain")
				}
			}
		},
		marktext: "<span style=\"text-decoration: line-through;\">瘴</span>",
		intro: {
			content: "下一出牌阶段开始前失去1点体力，结算期间令自己体力上下限均+#，结算后获得溢出体力值点护甲",
		},
		charlotte: true,
		locked: true,
		forced: true,
		sing: 1,
		sub: true,
		"_priority": 1,
		sourceSkill: "zhang_yzs",
		trigger: {
			player: "phaseUseBefore",
		},
		filter(event, player) {
			return player.countMark("zhang_yzs_buff") > 0;
		},
		async content(event, trigger, player) {
			const num = player.countMark("zhang_yzs_buff");
			player.clearMark("zhang_yzs_buff", false);
			player.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
			let maxhp_1 = player.maxHp;
			await player.gainMaxHp(num);
			let maxhp_2 = player.maxHp;
			if (!player.storage.minHp_yzs) player.storage.minHp_yzs = 0;
			let minhp_1 = player.storage.minHp_yzs;
			player.storage.minHp_yzs += num;
			game.log(player, "增加了" + get.cnNumber(num) + "点体力下限");
			if (player.storage.minHp_yzs >= player.maxHp) {
				player.storage.minHp_yzs = player.maxHp - 1;
			}
			let minhp_2 = player.storage.minHp_yzs;
			await player.loseHp();
			if(player.maxHp>1)await player.loseMaxHp(Math.min(Math.abs(maxhp_2 - maxhp_1), player.maxHp - 1));
			player.yzs_loseMinHp(minhp_2 - minhp_1);
			await player.removeSkill("zhang_yzs_buff")
		}
	},
	siwanghuigui_yzs: {
		nobracket: true,
		mark: true,
		limited:true,
		intro: {
			name: "死亡回归",
			markcount: "expansion",
			mark(dialog, _, player) {
				if (player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_record").length
					&& !player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_revive").length) dialog.addText("记录的手牌数：" + player.countMark("siwanghuigui_yzs_revive"));
				if (player.hasSkill("siwanghuigui_yzs_record_ban")) dialog.addText("当前无法发动【死亡回归】");
				if (player.hasSkill("siwanghuigui_yzs_use")) dialog.addText("你对其他角色使用牌后令其【瘴】吟唱-1，然后你可获得任意角色1张【瘴】");
			},
		},
		group: ["siwanghuigui_yzs_dieBefore", "siwanghuigui_yzs_revive", "siwanghuigui_yzs_phase", "siwanghuigui_yzs_renew", "siwanghuigui_yzs_record", "siwanghuigui_yzs_bgm"],
		subSkill: {
			dieBefore: {
				forceDie: true,
				locked: true,
				forced: true,
				popup: false,
				priority:3,
				trigger: {
					player: ["dieBefore"]
				},
				filter(event, player) {
				//	if (event.getParent().name == "giveup") return false;
					return true;
				},
				async content(event, trigger, player) {
					if (!trigger.excludeMark) {
						trigger.excludeMark = ["siwanghuigui_yzs", "zhang_yzs"]
					} else {
						trigger.excludeMark.push("siwanghuigui_yzs", "zhang_yzs")
					}
					if (player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_record").length
						&& !player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_revive").length) {
						trigger.noDieAfter = true;
					}
				},
			},
			revive: {
				audio: "ext:一中杀/audio/skill:3",
				forceDie: true,
				usable: 1,
				trigger: {
					player: ["dieAfter"]
				},
				filter(event, player) {
					return player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_record").length;
				},
				async content(event, trigger, player) {
					game.log(player, "死亡回归回溯成功");
					game.broadcastAll(function (player) {
						player.revive(4);
					}, player)
					await player.draw(player.countMark("siwanghuigui_yzs_revive"));
					player.markSkill("siwanghuigui_yzs")
					player.markSkill("zhang_yzs")
					if (player.countExpansions("zhang_yzs")) player.markSkill("zhang_yzs")
				},
				locked: true,
				forced: true,
			},
			phase: {
				locked: true,
				forced: true,
				trigger: {
					global: "phaseAfter",
				},
				filter(event, player) {
					return game.getGlobalHistory("everything", evt => evt.name == "die" && evt.player == player).length
				},
				async content(event, trigger, player) {
					game.broadcastAll(() => {
						if (_status.tempMusic == `ext:一中杀/audio/Memento.mp3`) return;
						_status.tempMusic = `ext:一中杀/audio/Memento.mp3`;
						game.playBackgroundMusic();
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					});
					var next = player.phaseUse();
					next.skill = "siwanghuigui_yzs_phase";
					event.next.remove(next);
					trigger.next.push(next);
					player.addSkill("siwanghuigui_yzs_use")
				}
			},
			renew: {
				locked: true,
				popup: false,
				forced: true,
				trigger: {
					player: "dying",
				},
				content() {
					player.removeSkill("siwanghuigui_yzs_record_ban")
				}
			},
			record: {
				locked: true,
				prompt2(event, player) {
					return `当前为${get.translation(event.player)}的回合，你可记录你手牌数，本回合你死亡后重新加入游戏并将手牌数调整至记录值`;
				},
				limited: true,
				logTarget: "player",
				unique: true,
				skillAnimation: true,
				animationColor: "thunder",
				trigger: {
					global: "phaseZhunbeiAfter",
				},
				filter(event, player) {
					return !player.hasSkill("siwanghuigui_yzs_record_ban");
				},
				check(event, player) {
					if (player.countExpansions("zhang_yzs") >= 4 && _status.currentPhase == player) return true;
					if (get.attitude(event.player, player) < 1 && player.hp <= 1) return true;
					return false;
				},
				async content(event, trigger, player) {
					player.addSkill("siwanghuigui_yzs_record_ban");
					const num = player.countCards("h");
					player.setMark("siwanghuigui_yzs_revive", num, false);
				}
			},
			bgm: {
				locked: true,
				charlotte: true,
				forced: true,
				popup: false,
				LastDo: true,
				trigger: {
					global: "phaseAfter",
				},
				filter(event, player) {
					return player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_record").length && !player.getHistory("useSkill", evt => evt.skill == "siwanghuigui_yzs_revive").length;
				},
				content() {
					game.broadcastAll(() => {
						if (_status.tempMusic == `ext:一中杀/audio/STYX HELIX.mp3`) return;
						_status.tempMusic = `ext:一中杀/audio/STYX HELIX.mp3`;
						game.playBackgroundMusic();
						ui.backgroundMusic.addEventListener('ended', () => {
							delete _status.tempMusic;
							game.playBackgroundMusic();
						}, { once: true });
					});
				}
			}
		},
	},
	siwanghuigui_yzs_record_ban: {
		mark: true,
		sub: true,
		charlotte: true,
		sourceSkill: "siwanghuigui_yzs_record",
	},
	siwanghuigui_yzs_use: {
		group: "siwanghuigui_yzs_use_end",
		subSkill: {
			end: {
				locked: true,
				charlotte: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseUseEnd"
				},
				content() {
					player.removeSkill("siwanghuigui_yzs_use")
				}
			},
		},
		sub: true,
		sourceSkill: "siwanghuigui_yzs_phase",
		popup: false,
		locked: true,
		forced: true,
		trigger: {
			player: "useCardToPlayer",
		},
		filter(event, player) {
			return event.target != player
		},
		async content(event, trigger, player) {
			if (trigger.target.hasSkill("zhang_yzs") && trigger.target.countExpansions("zhang_yzs")) {
				await trigger.target.yzs_updateCountDown(trigger.target.yzs_getCountDown(i => i.name =="zhang_yzs"));
			}
			if (!game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return target.hasSkill("zhang_yzs") && target.countExpansions("zhang_yzs") > 0;
			})) return;
			let target = await player.chooseTarget(false)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.hasSkill("zhang_yzs") && target.countExpansions("zhang_yzs") > 0;
				})
				.set("ai", (target) => {
					return 1/target.countExpansions("zhang_yzs")
				})
				.set("prompt", "你可获得任意角色1张【瘴】")
				.forResult();
			if (!target.bool) return;
			let cards = target.targets[0].getExpansions("zhang_yzs")
			let next = await player.chooseButton(["选择其中1张牌", cards], 1, false)
				.set("ai", button => get.value(button.link))
				.forResult();
			if (!next.bool) return;
			await player.gain(next.links, "gain2")
		}
	},
	//伊斯特|阳
	zhanqi_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		forced: true,
		marktext: "旗",
		intro: {
			name: "战旗",
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("zhanqi_yzs");
				if (cards.length) {
					for (let card of cards) {
						if (get.suit(card, player) == "spade") dialog.addText("你可将♠手牌当做普通【卷】使用或打出");
						if (get.suit(card, player) == "club") dialog.addText("你可将♣手牌当做【举报】使用");
						if (get.suit(card, player) == "diamond") dialog.addText("你可将♦手牌当做【国王密令】使用");
						if (get.suit(card, player) == "heart") dialog.addText("你可将♥手牌当做【无懈可击】使用");
					}
					dialog.addAuto(cards);
				}
			},
		},
		trigger: {
			player: "phaseUseBegin"
		},
		async content(event, trigger, player) {
			if (player.countExpansions("zhanqi_yzs")) await player.gain(player.getExpansions("zhanqi_yzs"), "draw");
			let result = await player.chooseCard("你可将任意张花色各不相同的手牌明置于人物牌旁，称为【旗】", false, "h")
				.set("complexCard", true)
				.set("selectCard", [1, 4])
				.set("filterCard", function (card, player) {
					if (!ui.selected.cards.length) {
						return true
					}
					for (let cardx of ui.selected.cards) {
						if (get.suit(cardx, player) == get.suit(card, player)) return false;
					}
					return true;
				})
				.set("ai",card=>5-get.value(card))
				.forResult();
			if (!result.bool) return;
			let next = player.addToExpansion(result.cards, "give", player);
			next.gaintag.add("zhanqi_yzs");
			await next;
		}
	},
	KingsHand_yzs: {
		nobracket: true,
		locked: true,
		group: ["KingsHand_yzs_blocker1", "KingsHand_yzs_spade", "KingsHand_yzs_club", "KingsHand_yzs_diamond", "KingsHand_yzs_heart", "KingsHand_yzs_zhanyi", "KingsHand_yzs_zhanyi2"],
		subSkill: {
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
					var cards = player.getEquips("SymmetricalSpear_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("SymmetricalSpear_yzs"));
					} else {
						while (trigger.slots.includes("equip1")) {
							trigger.slots.remove("equip1");
						}
					}
				},
				sub: true,
				sourceSkill: "KingsHand_yzs",
				"_priority": 23,
			},
			spade: {
				name: "【杀】",
				locked: true,
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					if (!player.countCards("h")) return
					if (!player.getExpansions("zhanqi_yzs").some(i => get.suit(i, player) == "spade")) {
						return false
					}
					return (name == 'sha')
				},
				filterCard: function (card, player) {
					if (player.getCards("h").some(i => i.hasGaintag("KingsHand_yzs_zhanyi"))) {
						return get.suit(card) == "spade" && card.hasGaintag("KingsHand_yzs_zhanyi")
					}
					return get.suit(card) == "spade"
				},
				viewAs: {
					name: "sha",
				},
				viewAsFilter(player) {
					const cards = player.getExpansions("zhanqi_yzs");
					for (let card of cards) {
						if (get.suit(card, player) == "spade") return true;
					}
					if (!player.countCards("hs", { suit: "spade" })) {
						return false;
					}
					return false;
				},
				position: "hs",
				prompt: "将1张♠手牌当做普通【杀】使用或打出",
				check(card) {
					const val = get.value(card);
					if (_status.event.name == "chooseToRespond") {
						return 1 / Math.max(0.1, val);
					}
					return 5 - val;
				},
				ai: {
					skillTagFilter(player) {
						if (!player.countCards("hes", { suit: "spade" })) {
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
			},
			club: {
				name: "【过河拆桥】",
				locked: true,
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					if (!player.countCards("h")) return
					if (!player.getExpansions("zhanqi_yzs").some(i => get.suit(i, player) == "club")) {
						return false
					}
					return (name == 'guohe')
				},
				filterCard: function (card, player) {
					if (player.getCards("h").some(i => i.hasGaintag("KingsHand_yzs_zhanyi"))) {
						return get.suit(card) == "club" && card.hasGaintag("KingsHand_yzs_zhanyi")
					}
					return get.suit(card) == "club"
				},
				viewAs: {
					name: "guohe",
				},
				viewAsFilter(player) {
					const cards = player.getExpansions("zhanqi_yzs");
					for (let card of cards) {
						if (get.suit(card, player) == "club") return true;
					}
					if (!player.countCards("hs", { suit: "club" })) {
						return false;
					}
					return false;
				},
				position: "hs",
				prompt: "将1张♣手牌当做【过河拆桥】使用",
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
					yingbian(card, player, targets, viewer) {
						if (get.attitude(viewer, player) <= 0) {
							return 0;
						}
						if (
							game.hasPlayer(function (current) {
								return !targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
							})
						) {
							return 6;
						}
						return 0;
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
			diamond: {
				name: "【国王密令】",
				locked: true,
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					if (!player.countCards("h")) return
					if (!player.getExpansions("zhanqi_yzs").some(i => get.suit(i, player) == "diamond")) {
						return false
					}
					return (name == 'guowangmiling_yzs')
				},
				filterCard: function (card, player) {
					if (player.getCards("h").some(i => i.hasGaintag("KingsHand_yzs_zhanyi"))) {
						return get.suit(card) == "diamond" && card.hasGaintag("KingsHand_yzs_zhanyi")
					}
					return get.suit(card) == "diamond"
				},
				viewAs: {
					name: "guowangmiling_yzs",
				},
				viewAsFilter(player) {
					const cards = player.getExpansions("zhanqi_yzs");
					for (let card of cards) {
						if (get.suit(card, player) == "diamond") return true;
					}
					if (!player.countCards("hs", { suit: "diamond" })) {
						return false;
					}
					return false;
				},
				position: "hs",
				prompt: "将1张♦手牌当做【国王密令】使用",
				check(card) {
					return 4 - get.value(card);
				},
				result: {
					target(player, target) {
						return 2;
					},
				},
			},
			heart: {
				audio: "ext:一中杀/audio/skill:1",
				name: "【无懈可击】",
				locked: true,
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					if (!player.countCards("h")) return
					if (!player.getExpansions("zhanqi_yzs").some(i => get.suit(i, player) == "heart")) {
						return false
					}
					return (name == 'wuxie')
				},
				filterCard: function (card, player) {
					if (player.getCards("h").some(i => i.hasGaintag("KingsHand_yzs_zhanyi"))) {
						return get.suit(card) == "heart" && card.hasGaintag("KingsHand_yzs_zhanyi")
					}
					return get.suit(card) == "heart"
				},
				viewAs: {
					name: "wuxie",
				},
				viewAsFilter(player) {
					const cards = player.getExpansions("zhanqi_yzs");
					for (let card of cards) {
						if (get.suit(card, player) == "heart") return true;
					}
					if (!player.countCards("hs", { suit: "heart" })) {
						return false;
					}
					return false;
				},
				position: "hs",
				prompt: "将1张♥手牌当做【无懈可击】使用",
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
				mod: {
					aiValue(player, card, num) {
						if (get.name(card) != "wuxie" && get.suit(card) != "heart") {
							return;
						}
						const cards2 = player.getCards("hs", function (card2) {
							return get.name(card2) == "wuxie" || get.suit(card) != "heart";
						});
						cards2.sort(function (a, b) {
							return (get.name(b) == "wuxie" ? 1 : 2) - (get.name(a) == "wuxie" ? 1 : 2);
						});
						const geti = function () {
							if (cards2.includes(card)) {
								return cards2.indexOf(card);
							}
							return cards2.length;
						};
						if (get.name(card) == "wuxie") {
							return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
						}
						return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
					},
					aiUseful() {
						return lib.skill.KingsHand_yzs_heart.mod.aiValue.apply(this, arguments);
					},
				},
			},
			zhanyi: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				forced: true,
				name: "战意",
				usable: 3,
				mod: {
					cardUsable(card, player, target) {
						if (card.hasGaintag("KingsHand_yzs_zhanyi")) return true;
					},
				},
				trigger: {
					player: "useCardAfter",
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					if (event.card.name != "sha") return false;
					return (player.getHistory("sourceDamage", card => card.card == event.card).length > 0)
				},
				async content(event, trigger, player) {
					let cards = get.cards(3, false);
					await player.showCards(cards, `${get.translation(player)}发动了【战意】`, true);
					let next = player.gain(cards, "gain2")
					next.gaintag.add('KingsHand_yzs_zhanyi')
					await next;
					/*if (trigger.getParent(2).skill == "KingsHand_yzs_zhanyi") {
						await player.draw();
						return;
					};*/
					while (player.getCards("h", card => card.hasGaintag("KingsHand_yzs_zhanyi")).some(i => player.hasUseTarget(i))) {
						let result = await player
							.chooseToUse("战意：使用“战意”牌", function (card, event, player) {
								return lib.filter.filterCard.apply(this, arguments) && get.event().cards.includes(card)
							})
							.set("filterTarget", function (card, player, target) {
								return lib.filter.filterTarget.apply(this, arguments);
							})
							.set("cards", cards||[])
							.set("addCount", false)
							.set("logSkill", event.name)
							.forResult();
						if (!result.bool) break;
					}
					await player.discard(player.getCards("h", card =>cards.includes(card)))
					await player.draw();
				},
			},
			zhanyi2: {
				locked: true,
				trigger: {
					player: "useCard2",
				},
				filter(event, player) {
					return event.card.name == "sha" && event.getParent() && event.getParent(2) && event.getParent(2).name == "KingsHand_yzs_zhanyi"
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					if (typeof trigger.baseDamege!="number") trigger.baseDamage = 1;
					trigger.baseDamage--;
					game.log(trigger.baseDamage)
				},
			},
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		audio: "ext:一中杀/audio/skill:1",
		forced: true,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && player.hasEquipableSlot(1) && !player.getEquips("SymmetricalSpear_yzs").length;
		},
		async content(event, trigger, player) {
			var card = game.createCard2("SymmetricalSpear_yzs");
			player.$gain2(card, false);
			await player.equip(card);
			game.delayx();
		},
		mod: {
			canBeGained(card, source, player) {
				if (player.getEquips("SymmetricalSpear_yzs").includes(card)) {
					return false;
				}
			},
			canBeDiscarded(card, source, player) {
				if (player.getEquips("SymmetricalSpear_yzs").includes(card)) {
					return false;
				}
			},
			canBeReplaced(card, player) {
				if (player.getVEquips("SymmetricalSpear_yzs").includes(card)) {
					return false;
				}
			},
			cardDiscardable(card, player) {
				if (player.getEquips("SymmetricalSpear_yzs").includes(card)) {
					return false;
				}
			},
			cardEnabled2(card, player) {
				if (player.getEquips("SymmetricalSpear_yzs").includes(card)) {
					return false;
				}
			},
			cardname(card) {
				if (get.subtype(card, false) == "equip1") return "guowangmiling_yzs";
			},
			cardUsable(card, player, num) {
				if (card.name == "sha" && card?.cards?.some(i => i.hasGaintag("KingsHand_yzs_zhanyi"))) {
					return Infinity;
				}
			},
		},
	},
	//邓懒夕太郎
	langhua_yzs: {
		audio: "ext:一中杀/audio/skill:2",
		derivation: ["yaren_yzs", "kuanglang_yzs"],
		group: ["langhua_yzs_count"],
		locked: true,
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				const num = storage ? 1 : 3;
				const str = storage ? "【狂狼】" : "【亚人】";
				return `回合开始时，你可以摸${get.cnNumber(num)}张牌，并弃置${get.cnNumber(4 - num)}张牌。若如此做，你进入` + str + `形态直到你的下回合开始，期间你使用与弃置牌花色相同的牌无次数限制`;
			},
		},
		trigger: { player: "phaseBegin" },
		async content(event, trigger, player) {
			player.changeZhuanhuanji("langhua_yzs");
			const skill = player.storage.langhua_yzs ? "yaren_yzs" : "kuanglang_yzs";
			const num = player.storage.langhua_yzs ? 3 : 1;
			if (num == 1) game.trySkillAudio("baiyin_skill");
			await player.draw(num);
			if (!player.hasCard(card => lib.filter.cardDiscardable(card, player, "langhua_yzs"), "hej")) {
				return;
			}
			await game.delayx();
			const result = await player.chooseToDiscard(true, "hej", 4 - num)
				.set("ai", card => {
				const player = get.player(),
					effect = player.getStorage("langhua_yzs_effect");
				const cards = player.getCards("h").filter(i => get.tag(i, "damage") > 0.5 && player.hasValueTarget(i, true, false)),
					map = {};
				for (const cardx of cards) {
					const suit = get.suit(cardx, player);
					if (typeof map[suit] != "number") {
						map[suit] = 0;
					}
					map[suit]++;
				}
				const list = [];
				for (let i in map) {
					if (map[i] > 0) {
						list.push([i, map[i]]);
					}
				}
				list.sort((a, b) => b[1] - a[1]);
				if (effect.includes(get.suit(card, player))) {
					return 0;
				}
				if (list.some(i => i[0] == get.suit(card, player)) && !player.hasUseTarget(card, false)) {
					return 10;
				}
				if (player.storage.nzry_chenglve && ui.selected.cards.length && !ui.selected.cards.some(i => get.suit(i) == get.suit(card, player))) {
					return 2;
				}
				return 6 - get.value(card);
			})
				.forResult();
			if (result.bool) {
				const effect = "langhua_yzs_effect";
				await player.addSkill(effect);
				await player.addSkill(skill);
				if (skill == "kuanglang_yzs" && player.hujia > 0) {
					const num = player.hujia;
					await player.changeHujia(-num);
					await player.draw(num);
				}
				player.markAuto(effect, result.cards.map(card => get.suit(card, player)).unique());
				player.storage[effect].sort((a, b) => lib.suits.indexOf(b) - lib.suits.indexOf(a));
				player.addTip(effect, get.translation(effect) + player.getStorage(effect).reduce((str, suit) => str + get.translation(suit), ""));
			}
		},
		subSkill: {
			effect: {
				charlotte: true,
				onremove(player, skill) {
					delete player.storage[skill];
					player.removeTip(skill);
				},
				trigger: { player: "phaseBegin" },
				popup: false,
				firstDo: true,
				forced: true,
				async content(event, trigger, player) {
					await player.removeSkill("langhua_yzs_effect");
					if (player.hasSkill("yaren_yzs")) {
						await player.removeSkill("yaren_yzs");
						game.log(player, "解除了【亚人】状态")
					}
					if (player.hasSkill("kuanglang_yzs")) {
						await player.removeSkill("kuanglang_yzs");
						game.log(player, "解除了【狂狼】状态")
					}
				},
				mod: {
					cardUsable(card, player) {
						const suit = get.suit(card);
						if (suit == "unsure" || player.getStorage("langhua_yzs_effect").includes(suit)) {
							return Infinity;
						}
					},
				},
				marktext: "化",
				intro: {
					content: "本回合使用$花色的牌无距离和次数限制",
				},
				sub: true,
				sourceSkill: "langhua_yzs",
				"_priority": 0,
			},
			count: {
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					if (!get.suit(event.card) || !player.getStorage("langhua_yzs_effect")) return false;
					return player.getStorage("langhua_yzs_effect").includes(get.suit(event.card)) && event.addCount !== false
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					trigger.addCount = false;
					if (player.getStat("card")[trigger.card.name] > 0) {
						player.getStat("card")[trigger.card.name]--;
					}
				},
			}
		},
	},
	langren_yzs: {
		locked: true,
		forced: true,
		trigger: { player: "phaseDiscardBegin" },
		filter(event, player) { return player.hujia > 0; },
		async content(event, trigger, player) {
			await player.changeHujia(-player.hujia);
		},
		mod: {
			cardSavable(card, player, target) {
				if (target == player && get.tag(card, "recover")) return false;
			},
			playerEnabled(card, player, target) {
				if (target == player && get.tag(card, "recover")) return false;
			},
		},
	},
	yaren_yzs: {
		group: "yaren_yzs_discard",
		subSkill: {
			discard: {
				name: "亚人",
				forced: true,
				trigger: {
					player: "phaseDiscardEnd",
				},
				filter(event, player) {
					if (!event.cards || !event.cards.length) return false;
					return event.cards.length
				},
				async content(event, trigger, player) {
					await player.changeHujia(trigger.cards.length)
				},
			}
		},
		mark: true,
		marktext: "人",
		audio: "ext:一中杀/audio/skill:1",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				dialog.addText("弃牌阶段你每弃1张牌获得1点护甲。你护甲值减少时摸1张牌。");
			},
		},
		charlotte: true,
		sub: true,
		sourceSkill: "langhua_yzs",
		forced: true,
		trigger: {
			player: ["changeHujiaEnd"],
		},
		filter(event, player) {
			return event.num < 0;
		},
		async content(event, trigger, player) {
			await player.draw();
		}
	},
	kuanglang_yzs: {
		group: "kuanglang_yzs_damage",
		subSkill: {
			damage: {
				audio: "kuanglang_yzs",
				name: "狂狼",
				trigger: {
					source: "damageSource",
				},
				forced: true,
				async content(event, trigger, player) {
					await player.recover();
				},
			}
		},
		mark: true,
		marktext: "狼",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				dialog.addText("你造成伤害时恢复1点体力。你有护甲时失去所有护甲，然后摸等量张牌。");
			},
		},
		audio: "ext:一中杀/audio/skill:1",
		charlotte: true,
		sub: true,
		sourceSkill: "langhua_yzs",
		forced: true,
		trigger: {
			player: ["changeHujiaEnd"],
		},
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			const num = player.hujia;
			await player.changeHujia(-num);
			await player.draw(num);
		}
	},
	//钟皇
	bushi_yzs: {
		group:"bushi_yzs_phaseUse",
		derivation: "bushi_yzs_effect",
		audio: "ext:一中杀/audio/skill:1",
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.countCards("h") && game.hasPlayer(current => get.info("bushi_yzs").filterTarget(null, player, current));
		},
		filterTarget(card, player, target) {
			if (player == target || target.hasSkill("hidden_yzs")) {
				return false;
			}
			return !player.getStorage("bushi_yzs_targeted").includes(target);
		},
		filterCard: true,
		selectCard: [1, Infinity],
		allowChooseAll: true,
		discard: false,
		lose: false,
		delay: false,
		check(card) {
			if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
				return 0;
			}
			if (!ui.selected.cards.length && card.name == "du") {
				return 20;
			}
			var player = get.owner(card);
			if (ui.selected.cards.length >= Math.max(2, player.countCards("h") - player.hp)) {
				return 0;
			}
			if (player.hp == player.maxHp || player.countCards("h") <= 1) {
				var players = game.filterPlayer();
				for (var i = 0; i < players.length; i++) {
					if (players[i].hasSkill("haoshi") && !players[i].isTurnedOver() && !players[i].hasJudge("lebu") && get.attitude(player, players[i]) >= 3 && get.attitude(players[i], player) >= 3) {
						return 11 - get.value(card);
					}
				}
				if (player.countCards("h") > player.hp) {
					return 10 - get.value(card);
				}
				if (player.countCards("h") > 2) {
					return 6 - get.value(card);
				}
				return -1;
			}
			return 10 - get.value(card);
		},
		async content(event, trigger, player) {
			const { target, cards, name } = event;
			player.addTempSkill("bushi_yzs_targeted", "phaseUseAfter");
			target.addSkill("bushi_yzs_effect");
			target.addMark("bushi_yzs_targeted", cards.length, false);
			if (target.countMark("bushi_yzs_targeted") >= target.hp) {
				player.markAuto(name + "_targeted", [target]);
				target.addMark("bushi_yzs_effect")
			}
			if (cards.length + 1 - target.hp > 0) {
				target.addMark("bushi_yzs_effect", cards.length + 1 - target.hp)
			}
			await player.give(cards, target);
		},
		subSkill: {
			phaseUse: {
				popup: false,
				forced: true,
				charlotte:true,
				trigger: {
					global: "phaseUseAfter",
				},
				async content(event, trigger, player) {
					for (let target of game.filterPlayer()) {
						target.clearMark("bushi_yzs_targeted", false)
						if (!target.countMark("bushi_yzs_effect") && !target.countMark("bushi_yzs_targeted")) {
							target.removeSkill("bushi_yzs_effect")
						}
					}
				},
			},
			targeted: {
				onremove: true,
				charlotte: true,
				sub: true,
				sourceSkill: "bushi_yzs",
				"_priority": 0,
			},
			effect: {
				name: "不弑",
				nopop: true,
				charlotte:true,
				mark: true,
				markimage: 'extension/一中杀/image/bushi_yzs_effect.png',
				intro: {
					mark(dialog, _, player) {
						if (player.countMark("bushi_yzs_targeted") > 0) {
							dialog.addText("当前阶段已经获得" + player.countMark("bushi_yzs_targeted") + "张【不弑】牌");
						}
						if (player.countMark("bushi_yzs_effect") > 0) {
							dialog.addText("你造成非零伤害时，移除1枚并令伤害-1。回合结束时移除自己全部此标记，若移除数不小于3则恢复1点体力。");
						}
					},
				},
				priority:9,
				trigger: {
					source: "damageBegin1",
					player: [ "phaseEnd"]
				},
				filter(event, player) {
					if (event.name == "damage") {
						return event.num > 0 && player.countMark("bushi_yzs_effect") > 0;
					}
					if (event.name == "phase") {
						return player.countMark("bushi_yzs_effect") > 0
					}
					return false;
				},
				async content(event, trigger, player) {
					if (trigger.name == "damage"&&player.countMark("bushi_yzs_effect") > 0) {
						player.removeMark("bushi_yzs_effect")
						trigger.num--;
					}
					if (trigger.name == "phase") {
						const num = player.countMark("bushi_yzs_effect");
						player.clearMark("bushi_yzs_effect")
						if (num > 2) {
							await player.recover();
						}
					}
					if (!player.countMark("bushi_yzs_effect") && !player.countMark("bushi_yzs_targeted")) {
						player.removeSkill("bushi_yzs_effect")
					}
				},
				forced:true,
				onremove: true,
				charlotte: true,
				popup: false,
				sub: true,
				sourceSkill: "bushi_yzs",
				"_priority": 0,
			},
		},
	},
	shengxin_yzs: {
		mod: {
			aiOrder(player, card, num) {
				if (get.type(card) === "basic"&&player.countCards("h",card=>get.type2(card)=="trick")) {
					return num + 10;
				}
			},
			aiValue(player, card, num) {
				if (["tao", "jiu"].includes(card.name)) {
					return num / 2;
				}
			},
			aiUseful(player, card, num) {
				if (get.name(card, player) === "shan") {
					if (
						player.countCards("hs", i => {
							if (card === i || (card.cards && card.cards.includes(i))) {
								return false;
							}
							return get.name(i, player) === "shan";
						})
					) {
						return -1;
					}
					return num / Math.pow(Math.max(1, player.hp), 2);
				}
			},
		},
		group: ["shengxin_yzs_damage"],
		subSkill: {
			damage: {
				locked: true,
				forced: true,
				trigger: { source: "damageBegin1" },
				async content(event, trigger, player) {
					trigger.num--;
				}
			},
			target: {
				locked: true,
				trigger: {
					target: "useCardToTargeted",
				},
				filter(event, player) {
					if (event.player != player) return false;
					return event.card.name == "tao" || event.card.name == "jiu"
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget({
							ai2: target => {
								const player = get.player();
								if (player.countCards("h", "shan")) {
									return -get.attitude(player, target);
								}
								if (get.attitude(player, target) < 5) {
									return 6 - get.attitude(player, target);
								}
								if (player.hp == 1 && player.countCards("h", "shan") == 0) {
									return 10 - get.attitude(player, target);
								}
								if (player.hp == 2 && player.countCards("h", "shan") == 0) {
									return 8 - get.attitude(player, target);
								}
								return -1;
							},
							source: trigger.player,
						})
						.set("filterTarget", function (card, player, target) {
							return !target.hasSkill("hidden_yzs");
						})
						.set("prompt", "圣心")
						.set("prompt2", "你使用【桃】或【酒】时可将目标改为1名其他角色。")
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
		init: function (player, skill) {
			game.broadcastAll(() => {
				if (_status.shengxin_yzs_tao) return;
				_status.shengxin_yzs_tao = true;
				if (lib.card["tao"]) {
					if (typeof lib.card["tao"].enable === "function") {
						let enable = lib.card["tao"].enable;
						lib.card["tao"].enable = function (card, player) {
							if (player.hasSkill("shengxin_yzs")) {
								return game.hasPlayer(cur => cur.isDamaged())
							}
							return enable.call(this,card,player)
						};
					}
					if (typeof lib.card["tao"].selectTarget === "function") {
						let selectTarget = lib.card["tao"].selectTarget;
						lib.card["tao"].selectTarget = function (card, player) {
							if (player.hasSkill("shengxin_yzs")) {
								return 1
							}
							return selectTarget.call(this, card, player)
						};
					} else {
						lib.card["tao"].selectTarget = function (card, player) {
							if (player.hasSkill("shengxin_yzs")) return 1;
							return -1
						};
					}
					if (typeof lib.card["tao"].filterTarget === "function") {
						let filterTarget = lib.card["tao"].filterTarget;
						lib.card["tao"].filterTarget = function (card, player, target) {
							if (player.hasSkill("shengxin_yzs")) {
								return target.isDamaged()
							}
							return filterTarget.call(this, card, player,target)
						};
					}
				}
			})
			game.broadcastAll(() => {
				if (_status.shengxin_yzs_jiu) return;
				_status.shengxin_yzs_jiu = true;
				if (lib.card["jiu"]) {
					if (typeof lib.card["jiu"].savable === "function") {
						let savable = lib.card["jiu"].savable;
						lib.card["jiu"].savable = function (card, player, dying) {
							if (player.hasSkill("shengxin_yzs")) {
								return true
							}
							return savable.call(this, card, player, dying)
						};
					}
					if (typeof lib.card["jiu"].selectTarget === "function") {
						let selectTarget = lib.card["jiu"].selectTarget;
						lib.card["jiu"].selectTarget = function (card, player) {
							if (player.hasSkill("shengxin_yzs")) {
								return 1
							}
							return selectTarget.call(this, card, player)
						};
					} else {
						lib.card["jiu"].selectTarget = function (card, player) {
							if (player.hasSkill("shengxin_yzs")) return 1;
							return -1
						};
					}
					if (typeof lib.card["jiu"].filterTarget === "function") {
						let filterTarget = lib.card["jiu"].filterTarget;
						lib.card["jiu"].filterTarget = function (card, player, target) {
							if (player.hasSkill("shengxin_yzs")) {
								if(target!=player)return true
							}
							return filterTarget.call(this, card, player, target)
						};
					}
				}
			})
			if (!_status.postReconnect.shengxin_yzs) {
				_status.postReconnect.shengxin_yzs = [
					function () {
						if (lib.card["tao"]) {
							if (typeof lib.card["tao"].enable === "function") {
								let enable = lib.card["tao"].enable;
								lib.card["tao"].enable = function (card, player) {
									if (player.hasSkill("shengxin_yzs")) {
										return game.hasPlayer(cur => cur.isDamaged())
									}
									return enable.call(this, card, player)
								};
							}
							if (typeof lib.card["tao"].selectTarget === "function") {
								let selectTarget = lib.card["tao"].selectTarget;
								lib.card["tao"].selectTarget = function (card, player) {
									if (player.hasSkill("shengxin_yzs")) {
										return 1
									}
									return selectTarget.call(this, card, player)
								};
							} else {
								lib.card["tao"].selectTarget = function (card, player) {
									if (player.hasSkill("shengxin_yzs")) return 1;
									return -1
								};
							}
							if (typeof lib.card["tao"].filterTarget === "function") {
								let filterTarget = lib.card["tao"].filterTarget;
								lib.card["tao"].filterTarget = function (card, player, target) {
									if (player.hasSkill("shengxin_yzs")) {
										return target.isDamaged()
									}
									return filterTarget.call(this, card, player, target)
								};
							}
						}
						if (lib.card["jiu"]) {
							if (typeof lib.card["jiu"].savable === "function") {
								let savable = lib.card["jiu"].savable;
								lib.card["jiu"].savable = function (card, player, dying) {
									if (player.hasSkill("shengxin_yzs")) {
										return true
									}
									return savable.call(this, card, player, dying)
								};
							}
							if (typeof lib.card["jiu"].selectTarget === "function") {
								let selectTarget = lib.card["jiu"].selectTarget;
								lib.card["jiu"].selectTarget = function (card, player) {
									if (player.hasSkill("shengxin_yzs")) {
										return 1
									}
									return selectTarget.call(this, card, player)
								};
							} else {
								lib.card["jiu"].selectTarget = function (card, player) {
									if (player.hasSkill("shengxin_yzs")) return 1;
									return -1
								};
							}
							if (typeof lib.card["jiu"].filterTarget === "function") {
								let filterTarget = lib.card["jiu"].filterTarget;
								lib.card["jiu"].filterTarget = function (card, player, target) {
									if (player.hasSkill("shengxin_yzs")) {
										if (target != player) return true
									}
									return filterTarget.call(this, card, player, target)
								};
							}
						}
					},
					[],
				];
			}
		},
		locked: true,
		usable: 2,
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "useCard",
		},
		prompt2: "每回合限2次：你使用锦囊牌时，可展示无非锦囊牌的手牌，然后摸2张牌并刷新【不弑】。",
		frequent: true,
		preHidden: true,
		filter(event, player) {
			if (get.type2(event.card) != "trick") return false;
			return !player.countCards("h", card => get.type(card) != "trick")
		},
		async content(event, trigger, player) {
			await player.showHandcards()
			await player.draw(2);
			var stat = player.getStat().skill;
			delete stat.bushi_yzs;
		},
	},
	tairan_yzs: {
		group: "tairan_yzs_draw",
		subSkill: {
			draw: {
				audio: "shengxin_yzs",
				prompt2: "你回合结束时，若手牌无非锦囊牌，可弃置之并摸4张牌。",
				trigger: { player: "phaseEnd" },
				frequent: true,
				filter(event, player) {
					return !player.countCards("h", card => get.type(card) != "trick")
				},
				async content(event, trigger, player) {
					await player.discard(player.getCards("h"));
					await player.draw(4);
				}
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		usable: 3,
		enable: "phaseUse",
		filterCard(card) {
			return get.name(card) == "shan";
		},
		viewAs: {
			name: "huogong",
		},
		viewAsFilter(player) {
			if (!player.countCards("hs", { name: "shan" })) {
				return false;
			}
		},
		position: "hs",
		prompt: "出牌阶段限3次：将一张【闪】当【火攻】使用",
		check(card) {
			const player = get.player();
			if (player.countCards("h") > player.hp) {
				return 6 - get.value(card);
			}
			return 3 - get.value(card);
		},
		ai: {
			fireAttack: true,
			basic: {
				order: 9.2,
				value: [3, 1],
				useful: 0.6,
			},
			wuxie(target, card, player, viewer, status) {
				if (get.attitude(viewer, player._trueMe || player) > 0) {
					return 0;
				}
				if (status * get.attitude(viewer, target) * get.effect(target, card, player, target) >= 0) {
					return 0;
				}
				if (_status.event.getRand("huogong_wuxie") * 4 > player.countCards("h")) {
					return 0;
				}
			},
			result: {
				player(player) {
					var nh = player.countCards("h");
					if (nh <= player.hp && nh <= 4 && _status.event.name == "chooseToUse") {
						if (typeof _status.event.filterCard == "function" && _status.event.filterCard(new lib.element.VCard({ name: "huogong" }), player, _status.event)) {
							return -10;
						}
						if (_status.event.skill) {
							var viewAs = get.info(_status.event.skill).viewAs;
							if (viewAs == "huogong") {
								return -10;
							}
							if (viewAs && viewAs.name == "huogong") {
								return -10;
							}
						}
					}
					return 0;
				},
				target(player, target) {
					if (target.hasSkill("huogong2") || target.countCards("h") == 0) {
						return 0;
					}
					if (player.countCards("h") <= 1) {
						return 0;
					}
					if (_status.event.player == player) {
						if (target.isAllCardsKnown(player)) {
							if (
								!target.countCards("h", card => {
									return player.countCards("h", card2 => {
										return get.suit(card2) == get.suit(card);
									});
								})
							) {
								return 0;
							}
						}
					}
					if (target == player) {
						if (typeof _status.event.filterCard == "function" && _status.event.filterCard(new lib.element.VCard({ name: "huogong" }), player, _status.event)) {
							return -1.15;
						}
						if (_status.event.skill) {
							var viewAs = get.info(_status.event.skill).viewAs;
							if (viewAs == "huogong") {
								return -1.15;
							}
							if (viewAs && viewAs.name == "huogong") {
								return -1.15;
							}
						}
						return 0;
					}
					return -1.15;
				},
			},
			tag: {
				damage: 1,
				fireDamage: 1,
				natureDamage: 1,
				norepeat: 1,
			},
		},
		"_priority": 0,
	},
	//香波霖
	shiyi_yzs: {
		locked: true,
		group: ["shiyi_yzs_draw"],
		subSkill: {
			draw: {
				audio: "shiyi_yzs",
				forced: true,
				locked: true,
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num = player.hp;
				},
				ai: {
					threaten: 1.3,
				},
			},
		},
		init: function (player, skill) {
			if (!player.storage.txlast_used) {
				player.storage.txlast_used = "";
				player.markSkill("txlast_used");
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "useCard",
		},
		forced: true,
		filter(event, player) {
			player.addTip("shiyi_yzs", "失忆 " + get.translation(get.name(event.card)), true);
			player.storage.txlast_used = get.name(event.card);
			player.markSkill("txlast_used");
			var evt = player.getLastUsed(1);
			if (!evt || !evt.card) {
				return true;
			}
			return get.name(evt.card) != get.name(event.card);
		},
		async content(event, trigger, player) {
			if (trigger.addCount == false) return;
			trigger.addCount = false;
			if (player.getStat("card")[trigger.card.name] > 0) {
				player.getStat("card")[trigger.card.name]--;
			}
		},
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					if (player.storage.txlast_used != get.name(card)) return num + 10;
				}
			},
			cardUsable(player,card, num) {
				if (card && player.storage.txlast_used != get.name(card)) return Infinity;
			},
		},
	},
	tiaoxiang_yzs: {
		derivation: "wangyou_yzs",
		group: ["tiaoxiang_yzs_gain"],
		subSkill: {
			gain: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				async content(event, trigger, player) {
					player.addMark("tiaoxiang_yzs", 2);
				}
			},
		},
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name =="tiaoxiang_yzs"))player.yzs_setCountDown({
				num: 2,
				repeatNum: 2,
				command: {
					async todo(player) {
						player.addMark("tiaoxiang_yzs");
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "tiaoxiang_yzs",
				prompt: `你获得1瓶【忘忧香】`,
				skill: "tiaoxiang_yzs"
			});
		},
		audio: "ext:一中杀/audio/skill:1",
		priority: 4,
		locked: true,
		marktext: "香",
		intro: {
			name: "忘忧香",
			markcount: "expansion",
			mark(dialog, _, player) {
				dialog.addText("当前有"+player.countMark("tiaoxiang_yzs")+"瓶【忘忧香】");
			},
		},
		trigger: {
			global: "phaseZhunbeiEnd"
		},
		filter(event, player) {
			return !event.player.hasSkill("hidden_yzs") && !event.player.hasSkill("wangyou_yzs") && player.countMark("tiaoxiang_yzs")
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && !target.hasSkill("wangyou_yzs")
				})
				.set("ai", target => {
					const player = get.event().player;
					const targetx = get.event().targetx;
					if (get.attitude(player, target) <= 0) return 0;
					if (get.attitude(targetx, target) < 0) {
						return (2 / target.hp + 0.4*target.countCards("h")+get.attitude(player,target)/3) > 3;
					}
				})
				.set("targetx",trigger.player)
				.set("prompt", `调香(${get.translation(trigger.player)}的回合)`)
				.set("prompt2", "令任意角色获得【忘忧】(获得【忘忧】时记录手牌数和体力值。进入濒死或回合开始时，调整手牌数和体力值至记录值，然后失去【忘忧】。)")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			player.removeMark("tiaoxiang_yzs")
			const target = event.targets[0];
			await target.addSkill("wangyou_yzs")
			target.addTip("wangyou_yzs", "忘忧 "+target.countCards("h") + "牌 " + target.hp + "血", false);
			target.markAuto("wangyou_yzs_cards", [target.countCards("h")]);
			target.markAuto("wangyou_yzs_hp", [target.hp]);
		},
	},
	wangyou_yzs: {
		charlotte: true,
		locked: true,
		forced: true,
		mark: true,
		marktext: "忘",
		intro: {
			mark(dialog, _, player) {
				dialog.addText("记录的手牌数为" + player.getStorage("wangyou_yzs_cards"));
				dialog.addText("记录的体力值为" + player.getStorage("wangyou_yzs_hp"));
			},
		},
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: ["phaseBegin", "dying"]
		},
		async content(event, trigger, player) {
			let num = player.countCards("h") - player.getStorage("wangyou_yzs_cards");
			if (num > 0) {
				await player.chooseToDiscard(true, "h", num);
			} else if (num < 0) {
				await player.draw(-num);
			}
			num = player.hp - player.getStorage("wangyou_yzs_hp");
			if (num > 0) {
				await player.loseHp(num);
			} else if (num < 0) {
				await player.recover(-num);
			}
			await player.removeSkill("wangyou_yzs")
			player.removeTip("wangyou_yzs");
			player.storage.wangyou_yzs_cards = [];
			player.markSkill("wangyou_yzs_cards");
			player.storage.wangyou_yzs_hp = [];
			player.markSkill("wangyou_yzs_hp");
		},
		priority: 1,
	},
	//幽灵乐团
	xiezou_yzs: {
		direct: true,
		popup: true,
		subSkill: {
			used: {
				mark: true,
				intro: {
					content: "本回合已经发动过【协奏】",
				},
			}
		},
		trigger: {
			global: "useCardAfter",
		},
		filter(event, player) {
			if (_status.currentPhase != player) return false;
			if (event.player.hasSkill("xiezou_yzs_used") && !event.player.hasSkill("yuetuan_yzs")) return false;
			const history = game.getGlobalHistory("useCard");
			const index = history.indexOf(event);
			if (index <= 0) {
				return true;
			}
			if (!history[index - 1].card) {
				return true
			}
			const previous = history[index - 1].card;
			if (get.type(event.card) != get.type(previous)) {
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			await trigger.player.addTempSkill("xiezou_yzs_used");
			if (trigger.player.hasSkill("yuetuan_yzs")) await trigger.player.draw();
			else await trigger.player.draw(2);
			if (!game.hasPlayer(function (target) {
				return !target.hasSkill("hidden_yzs") && !target.hasSkill("xiezou_yzs_used");
			})) return;
			let result = await trigger.player
				.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && !target.hasSkill("xiezou_yzs_used");
				})
				.set("prompt", "协奏")
				.set("ai", target => {
					const player = get.player();
					if (get.attitude(player, target) < 0) return 0;
					return target.countCards("h")
				})
				.set("prompt2", "可令1名本回合未发动【协奏】的角色使用1张手牌")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
			if (result.bool) {
				await result.targets[0].chooseToUse({
					filterCard(card) {
						if (get.itemtype(card) != "card" || (get.position(card) != "h" && get.position(card) != "s")) {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					},
					prompt: `是否使用1张手牌(若与【` + get.translation(get.name(trigger.card)) + `】类型不同，则你摸2张牌且本回合不可再依此法出牌`,
					addCount: false,
				});
			}
		}
	},
	yuetuan_yzs: {
		group: ["yuetuan_yzs_phaseBegin"],
		subSkill: {
			phaseBegin: {
				forced: true,
				popup: false,
				priority:13,
				trigger: { player: "phaseBegin" },
				async content(event, trigger, player) {
					player.addTempBackGroundOL("/extension/一中杀/image/background/yuetuan_yzs.jpg")
				}
			}
		},
		locked: true,
		forced: true,
		trigger: { player: "phaseEnd" },
		filter(event, player) {
			let cards = 0;
			let types = [];
			let player_used = [];
			game.getGlobalHistory("useCard", evt => {
				if (evt.cards?.length) {
					cards += evt.cards.length;
					for (let card of evt.cards) {
						if (!types.includes(get.type(card))) types.push(get.type(card));
					}
				}
				if (evt.player) {
					if (!player_used.includes(evt.player)) player_used.push(evt.player);
				}
			});
			return cards > 2 || types.length > 2 || player_used.length > 2;
		},
		async content(event, trigger, player) {
			let cards = 0;
			let types = [];
			let player_used = [];
			game.getGlobalHistory("useCard", evt => {
				if (evt.cards?.length) {
					cards += evt.cards.length;
					for (let card of evt.cards) {
						if (!types.includes(get.type(card))) types.push(get.type(card));
					}
				}
				if(evt.player) {
					if (!player_used.includes(evt.player)) player_used.push(evt.player);
				}
			});
			if (cards > 2) {
				await player.draw();
			}
			if (types.length > 2) {
				await player.recover();
			}
			if (player_used.length > 2) {
				if (!game.hasPlayer(function (target) {
					if (target.hasSkill("hidden_yzs")) return false;
					return true;
				})) return;
				let result = await player
					.chooseTarget()
					.set("filterTarget", function (card, player, target) {
						return !target.hasSkill("hidden_yzs")
					})
					.set("prompt", "乐团")
					.set("prompt2", "你对1名角色造成1点伤害")
					.setHiddenSkill(event.name.slice(0, -5))
					.forResult();
				if (result.bool) {
					await result.targets[0].damage();
				}
			}
		}
	},
	//远舟村贺
	chengfengpolang_yzs: {
		nobracket: true,
		priority: 1,
		mod: {
			playerEnabled(card, player, target) {
				if (get.name(card) != "sha") return;
				if (!card.isCard) return;
				if (!card.cards || !card.cards.length) return;
				if (card.cards.some(c => !player.getCards("h").includes(c))) return;
				return target.hasSkill("jifengbaoxiang_yzs_summon");
			},
		},
		group: ["chengfengpolang_yzs_draw", "chengfengpolang_yzs_use", "chengfengpolang_yzs_add", "chengfengpolang_yzs_renew"],
		locked: true,
		subSkill: {
			add: {
				audio: "ext:一中杀/audio/skill:1",
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return game.hasPlayer(current => current !== player) && (event.name != "phase" || game.phaseNumber == 0);
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					game.broadcastAll(function () {
						if (!lib.inpile.includes("treasure_yzs_red")) { lib.inpile.add("treasure_yzs_red"); }
						if (!lib.inpile.includes("treasure_yzs_black")) { lib.inpile.add("treasure_yzs_black"); }
					});
				}
			},
			draw: {
				audio: "ext:一中杀/audio/skill:1",
				locked: true,
				forced: true,
				trigger: {
					source: "damageBegin1",
				},
				filter: function (event, player) {
					return event.card && event.card.name == "sha";
				},
				async content(event, trigger, player) {
					const card = get.cards(1);
					let next = player.addToExpansion(card, "giveAuto", player)
					next.gaintag.add("chengfengpolang_yzs");
					player.$draw(card, false);
					await next;
				},
			},
			use: {
				name: "宝藏",
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard(player, name) {
					if (name == "treasure_yzs_red") {
						if (player.getExpansions("chengfengpolang_yzs").some(card => get.color(card) == "red")) return true;
					}
					if (name == "treasure_yzs_black") {
						if (player.getExpansions("chengfengpolang_yzs").some(card => get.color(card) == "black")) return true;
					}
				},
				filter(event, player) {
					if (event.filterCard({ name: "treasure_yzs_red" }, player, event)) {
						if (player.getExpansions("chengfengpolang_yzs").some(card => get.color(card) == "red")) return true;
					}
					if (event.filterCard({ name: "treasure_yzs_black" }, player, event)) {
						if (player.getExpansions("chengfengpolang_yzs").some(card => get.color(card) == "black")) return true;
					}
					return false;
				},
				chooseButton: {
					dialog(event, player) {
						return ui.create.dialog("乘风破浪", player.getExpansions("chengfengpolang_yzs"), "hidden");
					},
					filter(button, player) {
						const evt = _status.event.getParent();
						if (get.color(button.link) == "red") return evt.filterCard({ name: "treasure_yzs_red" }, player, evt)
						if (get.color(button.link) == "black") return evt.filterCard({ name: "treasure_yzs_black" }, player, evt);
						return false;
					},
					check(button) {
						const card = button.link,
							player = get.player();
						return player.getUseValue(card);
					},
					backup(links, player) {
						var index = get.color(links[0]) == "red" ? 0 : 1;
						var card = links[0];
						var next = {
							audio: "chengfengpolang_yzs",
							filterCard: card => card == lib.skill.chengfengpolang_yzs_use_backup.card,
							selectCard: -1,
							position: "x",
							check(card) {
								if (card) {
									return 6.5 - get.value(card);
								}
								return 1;
							},
							viewAs: [
								{
									name: "treasure_yzs_red",
								},
								{
									name: "treasure_yzs_black",
								},
							][index],
							card: card,
						};
						return next;
					},
					prompt(links, player) {
						return "乘风破浪：请选择【宝藏】的目标";
					},
				},
				ai: {
					order: 6,
					threaten: 2,
					player: 4,
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
				content() {
					player.clearMark("chengfengpolang_yzs_used", false);
				}
			},
		},
		"markimage2": 'extension/一中杀/image/card/treasure_yzs.png',
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("chengfengpolang_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【宝藏】";
			},
		},
		audio: "ext:一中杀/audio/skill:1",
		enable: ["chooseToUse"],
		hiddenCard: function (player, name) {
			if (!player.countCards("h")) return
			return (name == 'treasure_yzs_red') || name == 'treasure_yzs_black'
		},
		filter(event, player) {
			if (player.countMark("chengfengpolang_yzs_used")) return false;
			if (event.filterCard({ name: "treasure_yzs_red" }, player, event)) {
				if (player.hasCard(function (card) {
					return get.color(card) == "red";
				}, "h")) return true;
			}
			if (event.filterCard({ name: "treasure_yzs_black" }, player, event)) {
				if (player.hasCard(function (card) {
					return get.color(card) == "black";
				}, "h")) return true;
			}
			return false;
		},
		chooseButton: {
			dialog() {
				return ui.create.dialog("乘风破浪", [
					[
						["红", "", "treasure_yzs_red"],
						["黑", "", "treasure_yzs_black"],
					],
					"vcard",
				]);
			},
			filter(button, player) {
				var event = _status.event.getParent();
				if (button.link[2] == "treasure_yzs_red") {
					if (!event.filterCard({ name: "treasure_yzs_red" }, player, event)) {
						return false;
					}
					return (
						player.hasCard(function (card) {
							return get.color(card) == "red";
						}, "h")
					);
				}
				if (button.link[2] == "treasure_yzs_black") {
					if (!event.filterCard({ name: "treasure_yzs_black" }, player, event)) {
						return false;
					}
					return (
						player.hasCard(function (card) {
							return get.color(card) == "black";
						}, "h")
					);
				}
			},
			check(button) {
				var card = { name: button.link[2] },
					player = _status.event.player;
				return get.value(card, player) * get.sgn(player.getUseValue(card));
			},
			backup(links, player) {
				var index = links[0][2] == "treasure_yzs_red" ? 0 : 1;
				var next = {
					audio: "chengfengpolang_yzs",
					filterCard: [
						function (card) {
							return get.color(card) == "red";
						},
						function (card) {
							return get.color(card) == "black";
						},
						() => false,
					][index],
					position: "h",
					check(card) {
						if (card) {
							return 6.5 - get.value(card);
						}
						return 1;
					},
					viewAs: [
						{
							name: "treasure_yzs_red",
						},
						{
							name: "treasure_yzs_black",
						},
					][index],
					async precontent(event, trigger, player) {
						player.addMark("chengfengpolang_yzs_used", false)
					},
				};
				return next;
			},
			prompt(links, player) {
				var index = links[0][2] == "treasure_yzs_red" ? 0 : 1;
				return [
					"将1张红色手牌当做【宝藏】使用",
					"将1张黑色手牌当做【宝藏】使用"
				][index];
			},
		},
		ai: {
			order: 6,
			threaten:2,
			player:4,
		}
	},
	yangfanqihang_yzs: {
		nobracket: true,
		group: ["yangfanqihang_yzs_mark"],
		subSkill: {
			mark: {
				locked: true,
				trigger: {
					player: "useCard",
				},
				forced: true,
				filter(event, player) {
					return get.name(event.card) == "treasure_yzs_red" || get.name(event.card) == "treasure_yzs_black";
				},
				async content(event, trigger, player) {
					player.addMark("yangfanqihang_yzs", 1, false)
				},
			}
		},
		locked: true,
		popup: false,
		markimage: 'extension/一中杀/image/yangfanqihang_yzs.png',
		intro: {
			mark(dialog, _, player) {
				if (player.countMark("yangfanqihang_yzs") > 0) {
					dialog.addText("本局已经使用过" + player.countMark("yangfanqihang_yzs") + "/4张【宝藏】");
				}
			},
		},
		skillAnimation: true,
		animationColor: "wood",
		juexingji: true,
		audio: "ext:一中杀/audio/skill:1",
		trigger: {
			player: "phaseEnd",
		},
		forced: true,
		filter(event, player) {
			return player.countMark("yangfanqihang_yzs") >= 4;
		},
		async content(event, trigger, player) {
			player.awakenSkill("yangfanqihang_yzs");
			game.broadcastAll((player,event) => {
				var video = document.createElement("VIDEO");
				video.className = "anime";

				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/yangfanqihang_yzs.MP4", 
					autoplay: true,//准备就绪后自动播放
					loop: false,//是否循环播放
					muted: false,//是否静音
					preload:true,//是否提前加载
				})
				Object.assign(video.style, {
					position: "fixed",
					left : "0",
					top: "0",
					width: "100%",
					height: "100%",
					objectFit: "cover",
					minWidth: "100vw",
					minHeight: "100vh",
					opacity:"0",//透明度
					pointerEvents: "none",//不阻挡点击事件
					zIndex : "0",
					transition : "opacity 1s ease-out",
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
				if (player.node.avatar) player.node.avatar.setBackgroundImage("extension/一中杀/image/cunhe2_yzs.png");
			}, player,event);
			await new Promise(r => setTimeout(r, 5875))
			const card = get.cards(2);
			let next = player.addToExpansion(card, "giveAuto", player)
			next.gaintag.add("chengfengpolang_yzs");
			player.$gain2(card, false);
			await next;
			await player.loseMaxHp();
			await player.addSkill("yangfanqihang_yzs_awaken");
		},
	},
	yangfanqihang_yzs_awaken: {
		nobracket: true,
		group: ["yangfanqihang_yzs_awaken_die", "yangfanqihang_yzs_awaken_use"],
		subSkill: {
			die: {
				audio: "ext:一中杀/audio/skill:1",
				trigger: { global: "die" },
				forced: true,
				filter(event, player) {
					return _status.currentPhase == player && event.player.hasSkill("jifengbaoxiang_yzs_summon")
				},
				async content(event, trigger, player) {
					const cards = player.getCards("h")
					let next = player.addToExpansion(cards, "giveAuto", player)
					next.gaintag.add("chengfengpolang_yzs");
					await next;
					player.addSkill("yangfanqihang_yzs_awaken_lose")
					player.markAuto("yangfanqihang_yzs_awaken_lose", cards)
				}
			},
			lose: {
				charlotte: true,
				locked: true,
				popup: false,
				forced: true,
				trigger: {
					player: "phaseEnd",
				},
				async content(event, trigger, player) {
					await player.loseToDiscardpile(player.getExpansions("chengfengpolang_yzs").filter(card => player.getStorage("yangfanqihang_yzs_awaken_lose").includes(card)));
					await player.removeSkill("yangfanqihang_yzs_awaken_lose")
				}
			},
			use: {
				locked: true,
				trigger: {
					player: ["useCard", "phaseBegin"],
				},
				forced: true,
				filter(event, player) {
					if (event.name == "useCard") {
						if (!event.card) return false;
						if (event.card.name != "treasure_yzs_red" && event.card.name != "treasure_yzs_black") return false;
					}
					let chests = game.filterPlayer(current => current.hasSkill("jifengbaoxiang_yzs_summon"));
					return chests.length
				},
				async content(event, trigger, player) {
					let chests = game.filterPlayer(current => current.hasSkill("jifengbaoxiang_yzs_summon"));
					for (let chest of chests) {
						await chest.loseHp();
					}
				},
			}
		},
		locked: true,
		forced: true,
		sing: 1,
		audio: "ext:一中杀/audio/skill:1",
		"_priority": 4,
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name == "yangfanqihang_yzs_awaken")) player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						if (game.countPlayer(function (current) {
							return current.name == 'jifengbaoxiang_yzs';
						})) return;
						await player.useSkill("yangfanqihang_yzs_awaken")
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "yangfanqihang_yzs_awaken",
				prompt: `若【疾风宝箱】不在场，你召唤之至任意座次`,
				skill: "yangfanqihang_yzs_awaken"
			});
		},
		async content(event, trigger, player) {
			player.removeMark("yangfanqihang_yzs_awaken", get.info("yangfanqihang_yzs_awaken").sing, false);
			if (player.countMark("yangfanqihang_yzs_awaken") == 0) {
				player.addMark("yangfanqihang_yzs_awaken", get.info("yangfanqihang_yzs_awaken").sing, false);
				if (game.countPlayer(function (current) {
					return current.name == 'jifengbaoxiang_yzs';
				})) return;
				let result = await player.chooseTarget()
					.set("filterTarget", function (card, player, target) {
						return true
					})
					.set("forced", true)
					.set("prompt", "扬帆起航")
					.set("prompt2", "在目标角色下家召唤“疾风宝箱”")
					.setHiddenSkill(event.name.slice(0, -5))
					.forResult();
				if (!result.bool) return;
				const target = result.targets[0];
				game.broadcastAll((player) => {
					var group1 = player.group;
					game.addCharacter('jifengbaoxiang_yzs', {
						sex: 'none',
						group: group1,
						hp: 8,
						skills: ["jifengbaoxiang_yzs_summon"],
						groupInGuozhan: group1,
						isUnseen: true,
						extension: '衍生武将',
						translate: '疾风宝箱',
					});
					lib.character['jifengbaoxiang_yzs'][4] = ['ext:一中杀/image/jifengbaoxiang_yzs.png', 'unseen', group1];
				}, player);
				if (_status.connectMode === true) {
					var id = Math.floor(Math.random() * 8000000000);
					game.broadcastAll((player, id) => {
						var chest = ui.create.player(ui.arena).addTempClass("start");
						const position = +player.dataset.position + 1;
						const players = game.players.concat(game.dead);
						ui.arena.setNumber(players.length + 1);
						players.forEach(value => {
							if (parseInt(value.dataset.position) >= position) {
								value.dataset.position = parseInt(value.dataset.position) + 1;
							}
						});
						chest.playerid = id;
						lib.playerOL[id] = chest;
						chest.init('jifengbaoxiang_yzs');
						game.players.push(chest);
						chest.dataset.position = position;
						game.arrangePlayers();
					}, target, id);
					var chest = game.findPlayer2(current => (current.name1 == 'jifengbaoxiang_yzs' || current.name2 == 'jifengbaoxiang_yzs'));
					if (!chest) chest = target.next;
				} else {
					
					var chest = await game.addPlayerOL(target, "jifengbaoxiang_yzs", null, true);
				}
				if (!chest.playerid) chest.getId();
				event.chest = chest;
				if (!_status.chest_die) _status.chest_die = [];
				_status.chest_die.add(chest.playerid);
				if (!_status.chest_auto) _status.chest_auto = [];
				_status.chest_auto.add(player.playerid, chest.playerid);
				game.log(player, '召唤了', lib.translate['jifengbaoxiang_yzs']);
				game.broadcastAll((chest, player) => {
					if (get.mode() == 'guozhan') {
						if (chest.name2 == undefined) chest.name2 = chest.name1;
					}
					if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
						chest.side = player.side;
						chest.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
						chest.node.identity.dataset.color = player.node.identity.dataset.color;
					}
					chest.skillH = [];
					chest.storage.zhibi = [];
					chest.storage.stratagem_expose = [];
					chest.storage.stratagem_fury = 0;
				}, chest, player);
				game.broadcastAll((chest, player) => {
					const identity = (chest.identity = (identity => {
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
					const goon = player !== game.me && chest !== game.me && player.node.identity.classList.contains("guessing") && !player.identityShown;
					if (goon) {
						if (chest.identityShown) delete chest.identityShown;
						if (!chest.node.identity.classList.contains("guessing")) chest.node.identity.classList.add("guessing");
					}
					chest.setIdentity(goon ? "cai" : undefined);
					if (chest.node.dieidentity) chest.node.dieidentity.innerHTML = get.translation(chest.identity + 2);
					if (typeof player.ai?.shown === "number" && chest.ai) chest.ai.shown = player.ai.shown;
				}, chest, player);
				game.broadcastAll((chest, player) => {
					chest.setSeatNum(player.getSeatNum() + 1);
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
				}, chest, player);
				game.broadcastAll((chest, player) => {
					chest["jifengbaoxiang_yzs"] = player;
					if (!game.checkResult_chest) {
						game.checkResult_chest = game.checkResult;
						game.checkResult = function () {
							const targets = game.players.filter(i => i.hasSkill("jifengbaoxiang_yzs_summon"));
							game.players.removeArray(targets);
							game.checkResult_chest();
							game.players.addArray(targets);
						};
					}
					if (!game.checkResult_chest) {
						game.checkResult_chest = game.checkOnlineResult;
						game.checkOnlineResult = function (player) {
							const targets = game.players.filter(i => i.hasSkill("jifengbaoxiang_yzs_summon"));
							game.players.removeArray(targets);
							game.checkResult_chest(player);
							game.players.addArray(targets);
						};
					}
					if (typeof lib.element.player.getFriends === "function") {
						const origin_getFriends = lib.element.player.getFriends;
						const getFriends = function (func, includeDie) {
							const player = this;
							return [...origin_getFriends.apply(this, arguments),
							...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => (target["jifengbaoxiang_yzs"] || target) === (player["jifengbaoxiang_yzs"] || player))
							].filter(i => i !== player || func === true).unique().sortBySeat(player);
						};
						lib.element.player.getFriends = getFriends;
						[...game.players, ...game.dead].forEach(i => (i.getFriends = getFriends));
					}
					if (typeof lib.element.player.isFriendOf === "function") {
						const origin_isFriendOf = lib.element.player.isFriendOf;
						const isFriendOf = function (player) {
							if ((this["jifengbaoxiang_yzs"] || this) === (player["jifengbaoxiang_yzs"] || player)) return true;
							return origin_isFriendOf.apply(this, arguments);
						};
						lib.element.player.isFriendOf = isFriendOf;
						[...game.players, ...game.dead].forEach(i => (i.isFriendOf = isFriendOf));
					}
					if (typeof lib.element.player.getEnemies === "function") {
						const origin_getEnemies = lib.element.player.getEnemies;
						const getEnemies = function (func, includeDie) {
							if (this["jifengbaoxiang_yzs"]) return this["jifengbaoxiang_yzs"].getEnemies(func, includeDie);
							else {
								const player = this;
								return [...origin_getEnemies.apply(this, arguments),
								...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => {
									return origin_getEnemies.apply(this, arguments).includes(target["jifengbaoxiang_yzs"] || target);
								}),
								].filter(i => player != (i["jifengbaoxiang_yzs"] || i)).unique().sortBySeat(player);
							}
						};
						lib.element.player.getEnemies = getEnemies;
						[...game.players, ...game.dead].forEach(i => (i.getEnemies = getEnemies));
					}
				}, chest, player);
				player.ai.modAttitudeFrom = (from, to, att) => {
					if (player.isFriendsOf(to)) return get.attitude(from, to);
					return get.attitude(from, to) - 0.1;
				};
				chest.ai.modAttitudeFrom = (from, to, att) => {
					if (to == player || player.isFriendsOf(to)) return 114514;
					return get.attitude(player, to) - 0.1;
				};
				chest.ai.modAttitudeTo = (from, to, att) => {
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
					await chest.disableEquip(disables);
				}
				await chest.disableJudge();
				game.addGlobalSkill('chest_auto_yzs');
				game.addGlobalSkill('chest_die_yzs');
				game.addGlobalSkill('chest_over_yzs');
				let chests = game.filterPlayer(current => current.hasSkill("jifengbaoxiang_yzs_summon"));
				for (let chest of chests) {
					chest.storage.isSub = true;
					chest.markSkill("isSub");
				}
			}
		}
	},
	chest_auto_yzs: {
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
			return false;
			if (!_status.chest_auto) return false;
			if (event.name == 'die') return event.player != player && _status.chest_auto.includes(game.me.playerid) && _status.chest_auto.includes(event.player.playerid) && _status.chest_auto.includes(player.playerid);
			if (event.autochoose && event.autochoose()) return false;
			if (lib.filter.wuxieSwap(event)) return false;
			if (_status.auto) return false;
			return _status.chest_auto.includes(game.me.playerid) && _status.chest_auto.includes(player.playerid);
		},
		content: function () {
			if (player.isAlive()) game.swapPlayerAuto(player);
		},
	},
	chest_die_yzs: {
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
			if (_status.chest_die) return _status.chest_die.includes(event.player.playerid);
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
	chest_over_yzs: {
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
			if (game.players.filter(i => i !== player).every(i => (i["jifengbaoxiang_yzs"] && i["jifengbaoxiang_yzs"] === player))) return true;
			return false;
		},
		content: function () {
			if (game.players.filter(i => i !== player).every(i => (i["jifengbaoxiang_yzs"] && i["jifengbaoxiang_yzs"] === player))) {
				var win = game.findPlayer2(current => current["jifengbaoxiang_yzs"])["jifengbaoxiang_yzs"];
				var bool = false;
				if (win == game.me || win.getFriends().includes(game.me)) bool = true;
				game.log(win, '●GameOver');
				game.over(bool);
			}
		},
	},
	jifengbaoxiang_yzs_summon: {
		locked: true,
		charlotte: true,
		unique: true,
		group: ["jifengbaoxiang_yzs_summon_die", "jifengbaoxiang_yzs_summon_phase", "jifengbaoxiang_yzs_summon_nodieAfter", "jifengbaoxiang_yzs_summon_dying", "hidden_yzs"],
		subSkill: {
			die: {
				locked: true,
				forced: true,
				popup: false,
				forceOut: true,
				trigger: {
					global:"dieAfter"
				},
				filter(event, player) {
					return event.player.hasSkill("yangfanqihang_yzs")
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
				trigger: {
					player: "phaseBefore"
				},
				content() {
					trigger.cancel();
				}
			},
			nodieAfter: {
				popup: false,
				forced:true,
				trigger: {
					player: ["dieBefore"]
				},
				async content(event, trigger, player) {
					trigger.nodieAfter = true;
				},
			},
			dying: {
				forced:true,
				popup:false,
				trigger: {
					player: ["dyingBegin"]
				},
				firstDo:true,
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
			nodamage:true,
		}
	},
	//西行寺幽幽子
	wangling_yzs: {
		group: ["wangling_yzs_unrecover", "wangling_yzs_dyingAfter", "wangling_yzs_storm"],
		locked: true,
		charlotte: true,
		unique: true,
		forced: true,
		marktext: "亡",
		intro: {
			name: "亡",
			"name2": "亡",
			content: "已累计受到$/4点伤害，满4点后将进入濒死",
		},
		subSkill: {
			unrecover: {
				locked: true,
				forced: true,
				name:"亡乡「亡我乡-自尽」",
				trigger: {
					player: "recoverBegin",
				},
				filter(event, player) {
					const evt = event.getParent();
					if (evt.name == "wangling_yzs_dyingAfter") return false;
					if (evt.name == "fanhundie_yzs") return false;
					if (evt.name == "fanhundie_yzs_fuka") return false;
					if (evt.name == "WaterStorm_skill_instant_buff") return false;
					if (evt.name == "WaterStorm_skill") return false;
					return true;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				}
			},
			dyingAfter: {
				locked: true,
				forced: true,
				name: "华灵「蝶妄想」",
				trigger: {
					player: ["dyingAfter"],
				},
				async content(event, trigger, player) {
					if (player.hp < player.maxHp) {
						await player.recover(player.maxHp - player.hp);
					}
					await player.draw(3);
					if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) {
						player.addMark("Fuka_yzs", 1);
					}
				}
			},
			storm: {
				name: "樱符「完全墨染的樱花-开花」",
				locked: true,
				trigger: {
					global: "phaseUseEnd"
				},
				filter(event, player) {
					return !event.player.hasSkill("hidden_yzs") && event.player.hp == player.hp
				},
				async cost(event, trigger, player) {
					let possible = ["WaterStorm", "BulletStorm"];
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
						.forResult();
					event.result = {
						bool: result.bool,
						cost_data: result.links || [],
					};
				},
				async content(event, trigger, player) {
					await player.yzs_changeStorm(event.cost_data[0]);
				}
			}
		},
		trigger: {
			player: "damageEnd"
		},
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			player.addMark("wangling_yzs", trigger.num, false)
			if (player.countMark("wangling_yzs") >= 4) {
				let num = player.countMark("wangling_yzs") % 4;
				player.setMark("wangling_yzs", num, false);
				if (!player.isDying()) await player.dying(event,true);
			}
		},
	},
	fanhundie_yzs: {
		nobracket: true,
		group: ["fanhundie_yzs_fuka"],
		locked: true,
		logTarget: "player",
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				const str = storage ? "场上角色进入濒死时，若其体力值为唯一最低，你可对其造成1点伤害" : "场上角色进入濒死时，若其体力值为唯一最低，你可令其恢复1点体力";
				return str;
			},
		},
		trigger: { global: "dying" },
		filter(event, player) {
			return event.player.isMinHp(true);
		},
		check(event, player) {
			if (player.storage.fanhundie_yzs) {
				return get.attitude(player, event.player) <= 0;
			} else {
				return get.attitude(player, event.player) > 0;
			}
		},
		async content(event, trigger, player) {
			player.changeZhuanhuanji("fanhundie_yzs");
			if (player.storage.fanhundie_yzs) {
				await trigger.player.recover();
			} else {
				await trigger.player.damage();
			}
		},
		subSkill: {
			fuka: {
				locked: true,
				hiddenCard: function (player, name) {
					if (!player.countMark("Fuka_yzs")) return
					return name == 'jiu' || name == "tao"
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (!game.hasPlayer(function (target) {
						return !target.hasSkill("hidden_yzs") && Math.abs(player.hp - target.hp) == 1;
					})) return false;
					return player.countMark("Fuka_yzs") > 0;
				},
				filterTarget: function (card, player, target) {
					return Math.abs(player.hp - target.hp) == 1 && !target.hasSkill("hidden_yzs");
				},
				selectTarget: 1,
				async content(event, trigger, player) {
					player.removeMark("Fuka_yzs");
					let target = event.targets[0];
					if (player.hp < target.hp) {
						await player.recover();
						await target.loseHp();
					} else {
						await target.recover();
						await player.loseHp();
					}
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
							if(_status.dying.includes(player))return 114;
							if (target.hp > player.hp) return get.recoverEffect(player, player, player)
							return -get.recoverEffect(player, player, player)
						},
						target(player, target) {
							if (_status.dying.includes(player)) {
								if (target.hp > player.hp) {
									return 4-get.attitude(player,target)
								}
								return 0;
							}
							if (target.hp < player.hp) return get.recoverEffect(player, player, player)
							return -get.recoverEffect(player, player, player)
						},
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
			player.yzs_UseShunfaji("fanhundie_yzs");
		},
		clickableFilter: function (player) {
			if (!game.hasPlayer(function (target) {
				return !target.hasSkill("hidden_yzs") && Math.abs(player.hp - target.hp) == 1;
			})) return false;
			return player.countMark("Fuka_yzs") > 0;
		},
		clickableContent: async function (event, trigger, player) {
			let result = await player.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return Math.abs(player.hp - target.hp) == 1 && !target.hasSkill("hidden_yzs");
				})
				.set("prompt", "反魂蝶")
				.set("prompt2", "无咏唱：你与1名与你体力值之差等于1的角色交换体力值。")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
			if (!result.bool) {
				return;
			} else {
				let next = player.useSkill("fanhundie_yzs_fuka")
				next.targets = result.targets;
				await next;
			}
		},
	},
	yousi_yzs: {
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return (game.hasPlayer(function (target) {
				if (target.hasSkill("hidden_yzs")) return false;
				return player.canUse({ name: "juedou", isCard: false }, target)
			}))
		},
		filterTarget: function (card, player, target) {
			return player.canUse({ name: "juedou", isCard: false }, target)
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			let target = event.targets[0];
			let num = 2;
			let result1 = await target.chooseBool("【决斗】即将对 你 生效，是否令 幽幽子 摸1张牌以令此牌伤害-1？")
				.set("ai", () => {
					return _status.event.bool;
				})
				.set(
					"bool",
					(function () {
						const player = get.event().player;
						const target = get.event().target
						if (get.attitude(player, target) > 0) return true;
						if (player.countCards("h", { name: "sha" }) > target.countCards("h") / 2) return false;
						return true;
					})()
			)
				.set("target",player)
				.forResult();
			if (result1.bool) {
				num--;
				await player.draw();
			}
			let result2 = await player.chooseBool(`【决斗】即将对 ${get.translation(target)} 生效，是否令 ${get.translation(target)} 摸1张牌以令此牌伤害-1？`)
				.set("ai", () => {
					return _status.event.bool;
				})
				.set(
					"bool",
					(function () {
						const player = get.event().player;
						const target = get.event().target
						if (get.attitude(player, target) > 0) return true;
						if (player.countCards("h", { name: "sha" }) > target.countCards("h") / 2) return false;
						return true;
					})()
				)
				.set("target", target)
				.forResult();
			if (result2.bool) {
				num--;
				await target.draw();
			}
			let next = player.useCard({ name: "juedou", isCard: false }, target);
			if (typeof next.baseDamage !== "number") {
				next.baseDamage = num;
			}
			await next;
		},
		ai: {
			result: {
				target(player, target) {
					if (get.attitude(player, target) > 0) return 1;
					return -1;
				},
				player(player, target) {
					return 1;
				},
			}
		}
	},
	//涂 唐吉诃超
	wuwei_yzs: {
		group: ["wusheng", "wuwei_yzs_baiyin"],
		subSkill: {
			baiyin: {
				trigger: {
					player: "damageBegin4",
				},
				direct: true,
				popup: true,
				audio: "baiyin_skill",
				filter(event, player) {
					if (event.num <= 1) {
						return false;
					}
					return true;
				},
				content() {
					trigger.num = 1;
				},
			}
		},
		direct: true,
		popup: true,
		audio: "baiyin_skill",
		trigger: { player: "phaseBegin" },
		async content(event, trigger, player) {
			await player.changeHujia(-player.hujia);
			await player.changeHujia(1);
		},
	},
	yingyongjuedou_yzs: {
		nobracket: true,
		limited: true,
		skillAnimation: false,
		subSkill: {
			renew: {
				direct: true,
				forced: true,
				popup: false,
				firstDo: true,
				trigger: {
					player: "changeHujiaEnd"
				},
				filter(event, player) {
					return event.num < 0;
				},
                async content(event, trigger, player) {
                    game.broadcastAll((player) => {
                        player.restoreSkill("yingyongjuedou_yzs");
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
			player.yzs_UseShunfaji("yingyongjuedou_yzs");
		},
		clickableFilter: function (player) {
			if (!player.countCards("hej")) return false
			if (!game.hasPlayer(function (target) {
				return !target.hasSkill("hidden_yzs") && player != target;
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let result = await player.chooseTarget(false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs") && player != target;
				})
				.set("prompt", "英勇决斗")
				.set("prompt2", "你指定1名其他角色，与其进行【决斗】流程，胜者可再打出一张杀以对败者再造成1点伤害，然后双方摸自己打出牌数张牌")
				.forResult()
			if (!result.bool) {
				return;
			}
			let next = player.useSkill("yingyongjuedou_yzs")
			next.targets = result.targets;
			next.cards = result.cards;
			await next;
		},
		prompt2: "你指定1名其他角色，与其进行【决斗】流程，胜者可再打出一张杀以对败者再造成1点伤害，然后双方摸自己打出牌数张牌",
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name =="shan"
		},
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (!player.countCards("hej")) return false
			if (!game.hasPlayer(function (target) {
				return !target.hasSkill("hidden_yzs") && player != target;
			})) return false;
			return true
		},
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs") && player != target;
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.awakenSkill("yingyongjuedou_yzs");
			await player.addSkill("yingyongjuedou_yzs_renew");
			const target = event.targets[0];
			if (event.turn === undefined) {
				event.turn = target;
			}
			event.source = player;
			if (typeof event.baseDamage !== "number") {
				event.baseDamage = 1;
			}
			if (typeof event.extraDamage !== "number") {
				event.extraDamage = 0;
			}
			if (!event.shaReq) {
				event.shaReq = {};
			}
			if (typeof event.shaReq[player.playerid] !== "number") {
				event.shaReq[player.playerid] = 1;
			}
			if (typeof event.shaReq[target.playerid] !== "number") {
				event.shaReq[target.playerid] = 1;
			}
			event.playerCards = [];
			event.targetCards = [];
			while (true) {
				event.shaRequired = event.shaReq[event.turn.playerid];
				let damaged = false;
				while (event.shaRequired > 0) {
					let result = { bool: false };
					const next = event.turn.chooseToRespond();
					next.set("filterCard", function (card, player) {
						if (get.name(card) !== "sha") {
							return false;
						}
						return lib.filter.cardRespondable(card, player);
					});
					next.set("prompt", "共需打出" + event.shaRequired + "张杀");
					next.set("ai", function (card) {
						if (get.event().toRespond) {
							return get.order(card);
						}
						return -1;
					});
					next.set("shaRequired", event.shaRequired);
					next.set(
						"toRespond",
						(() => {
							const responder = event.turn;
							const opposite = event.source;
							if (responder.hasSkillTag("noSha", null, "respond")) {
								return false;
							}
							if (responder.hasSkillTag("useSha", null, "respond")) {
								return true;
							}
							if (event.baseDamage + event.extraDamage <= 0 || player.hasSkillTag("notricksource", null, event) || responder.hasSkillTag("notrick", null, event)) {
								return false;
							}
							if (event.baseDamage + event.extraDamage >= responder.hp + (opposite.hasSkillTag("jueqing", false, target) || target.hasSkill("gangzhi") ? 0 : target.hujia)) {
								return true;
							}
							const damage = get.damageEffect(responder, opposite, responder);
							if (damage >= 0) {
								return false;
							}
							if (
								event.shaRequired > 1 &&
								!target.hasSkillTag("freeSha", null, {
									player: player,
									card: event.card,
									type: "respond",
								}) &&
								event.shaRequired > responder.mayHaveSha(responder, "respond", null, "count")
							) {
								return false;
							}
							if (get.attitude(responder, opposite._trueMe || opposite) > 0 && damage >= get.damageEffect(opposite, responder, responder)) {
								return false;
							}
							return true;
						})()
					);
					next.set("respondTo", [player, event.card]);
					next.autochoose = lib.filter.autoRespondSha;
					if (event.turn === target) {
						next.source = player;
					} else {
						next.source = target;
					}
					result = await next.forResult();
					if (result?.bool) {
						event.shaRequired--;
						if (result.cards?.length) {
							if (event.turn === target) {
								event.targetCards.addArray(result.cards);
							} else {
								event.playerCards.addArray(result.cards);
							}
						}
					} else {
						await event.turn.damage(event.source);
						damaged = true;
						break;
					}
				}
				if (damaged) {
					[event.source, event.turn] = [event.turn, event.source];
					let result = { bool: false };
					const next = event.turn.chooseToRespond();
					next.set("filterCard", function (card, player) {
						if (get.name(card) !== "sha") {
							return false;
						}
						return lib.filter.cardRespondable(card, player);
					});
					next.set("prompt", "你可打出" + event.shaRequired + "张杀，然后对" + get.translation(event.source) + "造成1点伤害");
					next.set("ai", function (card) {
						if (get.event().toRespond) {
							return get.order(card);
						}
						return -1;
					});
					next.set("shaRequired", event.shaRequired);
					next.set(
						"toRespond",
						(() => {
							const responder = event.turn;
							const opposite = event.source;
							if (responder.hasSkillTag("noSha", null, "respond")) {
								return false;
							}
							if (responder.hasSkillTag("useSha", null, "respond")) {
								return true;
							}
							if (event.baseDamage + event.extraDamage <= 0 || player.hasSkillTag("notricksource", null, event) || responder.hasSkillTag("notrick", null, event)) {
								return false;
							}
							if (event.baseDamage + event.extraDamage >= responder.hp + (opposite.hasSkillTag("jueqing", false, target) || target.hasSkill("gangzhi") ? 0 : target.hujia)) {
								return true;
							}
							const damage = get.damageEffect(responder, opposite, responder);
							if (damage >= 0) {
								return false;
							}
							if (
								event.shaRequired > 1 &&
								!target.hasSkillTag("freeSha", null, {
									player: player,
									card: event.card,
									type: "respond",
								}) &&
								event.shaRequired > responder.mayHaveSha(responder, "respond", null, "count")
							) {
								return false;
							}
							if (get.attitude(responder, opposite._trueMe || opposite) > 0 && damage >= get.damageEffect(opposite, responder, responder)) {
								return false;
							}
							return true;
						})()
					);
					next.set("respondTo", [player, event.card]);
					next.autochoose = lib.filter.autoRespondSha;
					if (event.turn === target) {
						next.source = player;
					} else {
						next.source = target;
					}
					result = await next.forResult();
					if (result?.bool) {
						if (result.cards?.length) {
							if (event.turn === target) {
								event.targetCards.addArray(result.cards);
							} else {
								event.playerCards.addArray(result.cards);
							}
						}
						await event.source.damage(event.turn);
					}
					break;
				}
				[event.source, event.turn] = [event.turn, event.source];
			}
			if (event.playerCards.length) await player.draw(event.playerCards.length);
			if (event.targetCards.length) await target.draw(event.targetCards.length);
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order:5,
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
		},
	},
	qishidao_yzs: {
		nobracket: true,
		forced: true,
		mod: {
			aiValue(player, card, num) {
				if (card.name === "tao") {
					return num / 10;
				}
			},
			cardEnabled(card, player) {
				if (card.name == "tao") return false;
			},
			targetEnabled(card, player, target, now) {
				if (card.name == "tao") return false;
			},
			maxHandcardBase: function (player, num) {
				return 5;
			},
		},
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		filter(event, player) {
			return player.countCards("h") > 5;
		},
		content() {
			var num = 5 - player.countCards("h");
			if (num < 0) {
				player.chooseToDiscard("h", true, -num);
			}
		},
		ai: {
			nogain:true,
			skillTagFilter(player) {
				if (player.countCards("h") < 5) return false;
			},
		}
	},
	//莉莉霍瓦特
	callSpring_yzs: {
		global: "callSpring_yzs_global",
		ai: {
			threaten:1.8,
		}
	},
	callSpring_yzs_global: {
		prompt: "你可重铸任意张不同类型的手牌，然后 莉莉霍瓦特 依次执行前X项：①弃置1张手牌 ②获得其中1张 ③使用其中1张。（X为你重铸牌数）",
		enable: "phaseUse",
		position: "h",
		usable: 1,
		selectCard: [1, Infinity],
		filter(event, player) {
			const fairy = game.filterPlayer(current => current.hasSkill("callSpring_yzs"))[0];
			if (!fairy) return false;
			return player.countCards("h");
		},
		filterCard(card, player) {
			if (!player.canRecast(card)) return false;
			return !ui.selected.cards.some(cardx => get.type(cardx, player) == get.type(card, player));
		},
		selectCard: [0, Infinity],
		complexCard: true,
		check(card) {
			return 6-get.value(card)
		},
		async content(event, trigger, player) {
			const length = event.cards.length;
			await player.recast(event.cards)
			const fairy = game.filterPlayer(current => current.hasSkill("callSpring_yzs"))[0];
			if (!fairy) return false;
			if (length > 0) {
				await fairy.chooseToDiscard("h", true, 1);
			}
			let cards = event.cards.filter((card) => get.position(card, true) == "d");
			if (length > 1 && cards.length) {
				let result1 = await fairy.chooseButton(["报春", "获得其中1张牌", cards], 1, true)
					.set("ai", button => get.value(button.link))
					.forResult()
				if (result1 && result1.bool) {
					await fairy.gain(result1.links, "giveAuto", "log")
				}
			}
			cards = event.cards.filter((card) => get.position(card, true) == "d");
			if (length > 2 && cards.length) {
				let result2 = await fairy.chooseButton(["报春", "使用其中1张牌", cards], 1, true)
					.set("ai", button => get.value(button.link))
					.set("filterButton", button => {
						return _status.event.player.hasUseTarget(button.link);
					})
					.forResult()
				if (result2 && result2.bool) {
					await fairy.chooseUseTarget(true, result2.links, false);
				}
			}
		},
		ai: {
			result: {
				player:2
			}
		}
	},
	SurpriseSpring_yzs: {
		nobracket: true,
		subSkill: {
			awaken: {
				juexingji: true,
				skillAnimation: true,
				async content(event, trigger, player) {
					await player.removeSkill("callSpring_yzs");
					await player.addSkill("callSpring_yzs_awaken")
				}
			}
		},
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			if (!player.countCards("h")) return false;
			const choices = ["tao", "wuzhong"]
			let list = [];
			for (let i = 0; i < choices.length; i++) {
				let name = choices[i];
				list.push([get.type(name), "", name]);
			}
			if (!list.length) return false;
			if (!player.hasHistory("lose", evt => evt.cards2 && evt.cards2.length) || player.hasHistory("useSkill", evt => evt.skill == "SurpriseSpring_yzs")) {
				return false;
			}
			return true;
		},
		async cost(event, trigger, player) {
			const choices = ["tao", "wuzhong"]
			let list = [];
			for (let i = 0; i < choices.length; i++) {
				let name = choices[i];
				list.push([get.type(name), "", name]);
			}
			if (!list.length) return false;
			let result1 = await player.chooseButton(["惊喜之春", [list, "vcard"]])
				.set("forced", false)
				.forResult();;
			if (!result1.bool) return false;
			let result2 = await player.chooseCardTarget(false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs") 
				})
				.set("prompt", "惊喜之春")
				.set("prompt2", "将1张手牌当做你刚才选择的牌，对任意角色使用(无视合法性！)")
				.set("filterCard", (card, player, target) => {
					return true
				})
				.set("ai", function (button) {
					return get.value({ name: button.link[2] })
				})
				.set("position", "h")
				.forResult()
			if (!result2.bool) return false;
			event.result = {
				bool: true,
				cards: result2.cards,
				targets:result2.targets,
				cost_data: result1.links[0][2],
			}
		},
		async content(event, trigger, player) {
			const { cards,targets, cost_data } = event;
			await player.useCard(cards, { name: cost_data, isCard: false }, targets[0]);
			if (!player.countCards("h")) {
				player.useSkill("SurpriseSpring_yzs_awaken");
				await player.draw(2);
			}
		}
	},
	callSpring_yzs_awaken: {
		global: "callSpring_yzs_awaken_global",
		ai: {
			threaten:3,
		}
	},
	callSpring_yzs_awaken_global: {
		prompt: "你可重铸任意张不同类型的手牌，然后 莉莉霍瓦特 依次执行前X项：①使用其中1张 ②获得其中1张 ③弃置1张手牌。（X为你重铸牌数）",
		enable: "phaseUse",
		position: "h",
		usable: 1,
		selectCard: [1, Infinity],
		filter(event, player) {
			const fairy = game.filterPlayer(current => current.hasSkill("callSpring_yzs_awaken"))[0];
			if (!fairy) return false;
			return player.countCards("h");
		},
		filterCard(card, player) {
			if (!player.canRecast(card)) return false;
			return !ui.selected.cards.some(cardx => get.type(cardx, player) == get.type(card, player));
		},
		selectCard: [0, Infinity],
		complexCard: true,
		check(card) {
			return 6 - get.value(card)
		},
		async content(event, trigger, player) {
			const length = event.cards.length;
			await player.recast(event.cards)
			const fairy = game.filterPlayer(current => current.hasSkill("callSpring_yzs_awaken"))[0];
			if (!fairy) return false;
			let cards = event.cards.filter((card) => get.position(card, true) == "d");
			if (length > 0 && cards.length) {
				let result2 = await fairy.chooseButton(["报春", "使用其中1张牌", cards], 1, true)
					.set("ai", button => get.value(button.link))
					.set("filterButton", button => {
						return _status.event.player.hasUseTarget(button.link);
					})
					.forResult()
				if (result2 && result2.bool) {
					await fairy.chooseUseTarget(true, result2.links, false);
				}
			}
			cards = event.cards.filter((card) => get.position(card, true) == "d");
			if (length > 1 && cards.length) {
				let result1 = await fairy.chooseButton(["报春", "获得其中1张牌", cards], 1, true)
					.set("ai", button => get.value(button.link))
					.forResult()
				if (result1 && result1.bool) {
					await fairy.gain(result1.links, "giveAuto", "log")
				}
			}
			if (length > 2) {
				await fairy.chooseToDiscard("h", true, 1);
			}
		},
		ai: {
			result: {
				player: 2
			}
		}
	},
	//神倾魔女
	quanbing_yzs: {
		group: ["quanbing_yzs_start", "quanbing_yzs_use", "quanbing_yzs_discard", "quanbing_yzs_damage"],
		locked: true,
		mark:true,
		forced: true,
		markimage: "extension/一中杀/image/quanbing_yzs.png",
		intro: {
			mark(dialog, content, player) {
				const ups = player.getExpansions("quanbing_yzs");
				const downs = player.getExpansions("quanbing_yzs_down");
				if (!ups.length && !downs.length) return "无【权柄】";
				if (downs.length) {
					if (player.isUnderControl(true)) {
						dialog.addText("暗置的【权柄】：");
						dialog.addAuto(downs);
					} else {
						dialog.addText("共有" + get.cnNumber(downs.length) + "张暗置的【权柄】");
					}
				} else {
					dialog.addText("无暗置的【权柄】");
				}
				if (ups.length) {
					dialog.addText("明置的【权柄】：");
					dialog.addAuto(ups);
				}
			},
		},
		subSkill: {
			start: {
				audio: "quanbing_yzs",
				priority: 1,
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
					await player.draw();
					if (!player.countCards("h")) return
					const result = await player.chooseCard("权柄", "将1张手牌明置于人物牌旁称为【权柄】", "h", 1, true)
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
						let next = player.addToExpansion(result.cards, player, "give")
						next.gaintag.add("quanbing_yzs")
						await next
					}
				},
			},
			use: {
				audio: "xinghui_yzs",
				locked:true,
				trigger: {
					global: ["respond", "useCard"],
				},
				filter(event, player) {
					if (event.player.hasSkill("hidden_yzs")) return false;
					let cards = [];
					let numbers = [];
					const qbs = player.getExpansions("quanbing_yzs")
					if (!qbs.length) return false;
					for (let card of qbs) {
						if (!numbers.includes(card.number)) {
							numbers.push(card.number);
						}
					}
					let cards2 = event.cards
					cards2 = cards2.filter(card => numbers.includes(card.number))
					cards.addArray(cards2)
					if (!cards.length) return false;
					return true;
				},
				async cost(event, trigger, player) {
					let cards = [];
					let numbers = [];
					const qbs = player.getExpansions("quanbing_yzs")
					if (!qbs.length) return false;
					for (let card of qbs) {
						if (!numbers.includes(card.number)) {
							numbers.push(card.number);
						}
					}
					let cards2 = trigger.cards
					cards2 = cards2.filter(card => numbers.includes(card.number))
					cards.addArray(cards2)
					if (!cards.length) return false;
					let card;
					if (cards.length == 1) card = cards[0];
					else {
						const result = await player
							.chooseButton(["选择其中你希望获得的一张牌", cards], 1, false)
							.set("ai",button=>get.value(button))
							.forResult();
						if (!result.bool) return false
						card = result.links[0];
					}
					const result = await player
						.chooseButton(["选择你要翻面的【权柄】", qbs], 1, false)
						.set("filterButton", function (button) {
							return button.link.number == get.event().card.number
						})
						.set("ai", button => 1)
						.set("card",card)
						.forResult();
					if (!result.bool) return false
					event.result = {
						bool: true,
						cards: [card],
						cost_data: result.links,
					}
				},
				async content(event, trigger, player) {
					await player.loseToSpecial(event.cost_data);
					let next = player.addToExpansion(event.cost_data, player, "draw")
					next.gaintag.add("quanbing_yzs_down");
					next.untrigger(true);
					await next;
					if (player.hasSkill("shenshu_yzs")) {
						const map = {
							spade: "lvjie_yzs",
							club: "yinyao_yzs",
							heart: "shenglian_yzs",
							diamond: "xinghui_yzs",
						}
						let result = await player.judge().forResult();
						player.restoreSkill(map[result.suit])
						player.unmarkSkill(map[result.suit])
					}
					await player.gain(event.cards, "gain2");
					let result = await player.chooseButton([
						"选择至多2项",
						[
							[
								[1, "无效此牌的牌面效果"],
								[2, "给予1名其他角色1张手牌"],
							],
							"textbutton",
						],
					])
						.set("forced", false)
						.set("selectButton", [1, 2])
						.set("card", trigger.card)
						.set("eventname", trigger.name)
						.set("player", player)
						.set("filterButton", function (button) {
							if (button.link == "1") {
								return get.event().card.isCard && get.event().eventname =="useCard";
							} else {
								return get.event().player.countCards("h")
							}
						})
						.set("target",trigger.player)
						.set("ai", button => {
							const player = get.player()
							const target=get.event().target
							if (button.link == 1) {
								return -get.attitude(player,target)
							} else {
								return game.countPlayer(cur=>get.attitude(player,cur)>0)
							}
						})
						.forResult();
					if (!result.bool) return;
					if (result.links.includes(1)) {
						trigger.targets.length = 0;
						trigger.all_excluded = true;
						game.log(trigger.card, "被无效了");
					}
					if (!result.links.includes(2)) return;
					result = await player.chooseCardTarget(false)
						.set("filterTarget", (card, player, target) => {
							return !(target.hasSkill("hidden_yzs"))&&target!=player;
						})
						.set("ai1", card => get.value(card))
						.set("ai2", target => {
							const player = get.player();
							if (get.attitude(player, target) < 0) return 0;
							return get.attitude(player, target)
						})
						.set("prompt", "权柄")
						.set("prompt2", "你可给予1名其他角色1张手牌")
						.set("selectCard", 1)
						.set("position", "h")
						.forResult()
					if (!result.bool) return
					await player.give(result.cards, result.targets[0]);
				}
			},
			discard: {
				audio: "xinghui_yzs",
				trigger: {
					global: ["loseAsyncAfter", "loseAfter"]
				},
				locked: false,
				filter(event, player) {
					let cards = [];
					let numbers = [];
					const qbs = player.getExpansions("quanbing_yzs")
					if (!qbs.length) return false;
					for (let card of qbs) {
						if (!numbers.includes(card.number)) {
							numbers.push(card.number);
						}
					}
					if (event.name.indexOf("lose") == 0) {
						game.filterPlayer(current => {
							let cards2 = event.getl(current).cards2
							cards2 = cards2.filter(card => numbers.includes(card.number))
							cards.addArray(cards2)
						});
					}
					if (!cards.length) return false;
					return event.type == "discard" && cards.length > 0;
				},
				async cost(event, trigger, player) {
					let cards = [];
					let numbers = [];
					const qbs = player.getExpansions("quanbing_yzs")
					if (!qbs.length) return false;
					for (let card of qbs) {
						if (!numbers.includes(card.number)) {
							numbers.push(card.number);
						}
					}
					if (trigger.name.indexOf("lose") == 0) {
						game.filterPlayer(current => {
							let cards2 = trigger.getl(current).cards2
							cards2 = cards2.filter(card => numbers.includes(card.number))
							cards.addArray(cards2)
						});
					} 
					if (!cards.length) return false;
					let card;
					if (cards.length == 1) card = cards[0];
					else {
						const result = await player
							.chooseButton(["选择其中你希望获得的一张牌", cards], 1, false)
							.set("ai", button => get.value(button))
							.forResult();
						if (!result.bool) return false
						card = result.links[0];
					}
					const result = await player
						.chooseButton(["选择你要翻面的【权柄】", qbs], 1, false)
						.set("filterButton", function (button) {
							return button.link.number == get.event().card.number
						})
						.set("ai", button => 1)
						.set("card", card)
						.forResult();
					if (!result.bool) return false
					event.result = {
						bool: true,
						cards: [card],
						cost_data: result.links,
					}
				},
				async content(event, trigger, player) {
					await player.loseToSpecial(event.cost_data);
					let next = player.addToExpansion(event.cost_data, player, "draw")
					next.gaintag.add("quanbing_yzs_down");
					next.untrigger(true);
					await next;
					if (player.hasSkill("shenshu_yzs")) {
						const map = {
							spade: "lvjie_yzs",
							club: "yinyao_yzs",
							heart: "shenglian_yzs",
							diamond: "xinghui_yzs",
						}
						let result = await player.judge().forResult();
						await player.restoreSkill(map[result.suit])
						player.unmarkSkill(map[result.suit])
					}
					await player.gain(event.cards, "gain2");
					let result = await player.chooseCardTarget( false)
						.set("filterTarget", (card, player, target) => {
							return !(target.hasSkill("hidden_yzs"));
						})
						.set("ai1", card => get.value(card))
						.set("ai2", target => {
							const player = get.player();
							if (get.attitude(player, target) < 0) return 0;
							return get.attitude(player,target)
						})
						.set("prompt", "权柄")
						.set("prompt2", "你可给予1名其他角色1张手牌")
						.set("selectCard", 1)
						.set("position","h")
						.forResult()
					if (!result.bool) return
					await player.give(result.cards, result.targets[0]);
				}
			},
			damage: {
				locked: true,
				forced:true,
				trigger: {
					player: "damageBegin3",
				},
				filter(event, player) {
					return event.num > 0;
				},
				async content(event, trigger, player) {
					await player.yzs_updateCountDown(player.yzs_getCountDown(i => i.name =="quanbing_yzs"));
				},
			}
		},
		sing: 1,
		audio: "ext:一中杀/audio/skill:1",
		"_priority": 2,
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name =="quanbing_yzs"))player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						if (player.countExpansions("quanbing_yzs") + player.countExpansions("quanbing_yzs_down") < 4) {
							await player.draw();
							if (!player.countCards("h")) return
							const result = await player.chooseCard("权柄", "将1张手牌明置于人物牌旁称为【权柄】", "h", 1, true)
								.set("ai", card => 5 - get.value(card))
								.forResult()
							if (result.bool && result.cards?.length) {
								let next = player.addToExpansion(result.cards, player, "give")
								next.gaintag.add("quanbing_yzs")
								await next
							}
						} else {
							const result = await player
								.chooseControl("摸牌", "翻【权柄】")
								.set("prompt", "【权柄】：请选择一项")
								.set("choiceList", ["摸1张牌", "将【权柄】全部翻至正面"])
								.forResult();
							if (result?.control) {
								player.popup(result.control);
								game.log(player, "选择了", "#g" + result.control);
							}
							let length = 0;
							if (result?.control == "摸牌") {
								await player.draw();
							} else {
								const downs = player.getExpansions("quanbing_yzs_down");
								if (!downs.length) return;
								length += downs.length;
								await player.loseToSpecial(downs);
								let next = player.addToExpansion(downs, player, "gain2")
								next.gaintag.add("quanbing_yzs");
								next.untrigger(true);
								await next;
							}
							if (!length || !player.hasSkill("shenshu_yzs")) return;
							while (length--) {
								const map = {
									spade: "lvjie_yzs",
									club: "yinyao_yzs",
									heart: "shenglian_yzs",
									diamond: "xinghui_yzs",
								}
								let result = await player.judge("quanbing_yzs").forResult();
								await player.restoreSkill(map[result.suit])
								player.unmarkSkill(map[result.suit])
							}
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "quanbing_yzs",
				prompt: `你摸1张牌并将1张手牌明置于人物牌旁称为【${get.poptip("quanbing_yzs_card")}】；若已达4张，改为摸1张牌或将【权柄】全部翻至正面。受到非零伤害时本${get.poptip("sing_yzs_count")}-1`,
				skill: "quanbing_yzs"
			});
		},
	},
	shenshu_yzs: {
		priority: 10,
		derivation: ["lvjie_yzs", "yinyao_yzs", "shenglian_yzs", "xinghui_yzs"],
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
			const skills = ["lvjie_yzs", "yinyao_yzs", "shenglian_yzs", "xinghui_yzs"];
			await player.addSkill(skills)
		},
	},
	lvjie_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		mark: false,
		limited: true,
		skillAnimation: false,
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
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
			player.yzs_UseShunfaji("lvjie_yzs");
		},
		clickableFilter: function (player) {
			if (!game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs")) && player != target;
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("律诫", "你观看并扣置任意角色1张手牌，本回合结束时其获得之", false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("lvjie_yzs")
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
			return !(target.hasSkill("hidden_yzs")) ;
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			let target = event.targets[0];
			player.awakenSkill("lvjie_yzs");
			const result = await player.choosePlayerCard(target, 1, "h", true, "visible")
				.set("ai", card => {
					if (["tao", "shan", "jiu"].includes(card.name)) return 10;
					return 8 - get.value(card);
				})
				.forResult();
			if (result?.bool) {
				let next = target.addToExpansion(result.cards, target, "giveAuto")
				next.gaintag.add("xinpojun2")
				await next
				target.addSkill("xinpojun2");
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 9,
			result: {
				target:-1,
			}
		}
	},
	yinyao_yzs: {
		audio: "ext:一中杀/audio/skill:1",
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
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("yinyao_yzs");
		},
		clickableFilter: function (player) {
			if (!game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs")) && player != target;
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("引曜", "你移动场上1张牌(包括手牌区)", false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("yinyao_yzs")
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
			let target = event.targets[0];
			player.awakenSkill("yinyao_yzs");
			let next = player.choosePlayerCard(target, 1, "hej", false);
			next.set("prompt", "你可移动 " + get.translation(target) + " 区域内的1张牌(不选则移动场上1张牌)");
			const result = await next.forResult();
			if (result.bool) {
				let gainer;
				let next = await player.chooseTarget()
					.set("filterTarget", (card, player, target) => {
						return !(target.hasSkill("hidden_yzs"));
					})
					.set("forced", true)
					.set("ai", target => {
						const player = get.player();
						return get.attitude(player,target)
					})
					.set("prompt", "引曜")
					.set("prompt2", "令任意角色获得此牌(不选则你获得)")
					.forResult()
				if (!next.bool) gainer = player;
				else gainer = next.targets[0];
				await gainer.gain(result.cards, "draw");
			} else {
				await player.moveCard(true);
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			result: {
				target:-2,
			}
		}
	},
	shenglian_yzs: {
		audio: "yinyao_yzs",
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
			player.yzs_UseShunfaji("shenglian_yzs");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickableFilter: function (player) {
			if (!game.hasPlayer(function (target) {
				return (!target.hasSkill("hidden_yzs")) && player != target;
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let target = await player.chooseTarget("圣怜", "你令任意角色恢复1点体力或摸2张牌", false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.set("ai", target => {
					const player = get.player();
					return get.attitude(player,target)
				})
				.forResult()
			if (!target.bool) {
				return;
			}
			let next = player.useSkill("shenglian_yzs")
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
			let target = event.targets[0];
			player.awakenSkill("shenglian_yzs");
			await target.chooseDrawRecover(2, true);
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order:8,
			result: {
				target: 4,
			}
		}
	},
	xinghui_yzs: {
		audio: "ext:一中杀/audio/skill:1",
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
			player.yzs_UseShunfaji("xinghui_yzs");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickableFilter: function (player) {
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let ask = await player.chooseBool(`是否发动【星辉】?<br>你观看牌堆顶4张牌，任意调换顺序后置顶或底`)
				.forResult();
			if (!ask.bool) return;
			let next = player.useSkill("xinghui_yzs")
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
			player.awakenSkill("xinghui_yzs");
			await player.chooseToGuanxing(4).set("prompt", "星辉：点击或拖动将牌移动到牌堆顶或牌堆底");
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
		ai: {
			order: 10,
			result: {
				player:1
			}
		}
	},
	jinzhou_yzs: {
		audio: "ext:一中杀/audio/skill:1",
		group: "jinzhou_yzs_skip",
		subSkill: {
			skip: {
				locked: true,
				forced: true,
				sub: true,
				popup: false,
				trigger: {
					player: ["phaseDrawBefore", "phaseUseBefore", "phaseDiscardBefore"]
				},
				filter(event, player) {
					if (event.skill) return false;
					return true;
				},
				content() {
					trigger.cancel();
				}
			}
		},
		forced: true,
		locked: true,
		trigger: {
			player: "phaseBegin",
		},
		filter(event, player) {
			const ups = player.getExpansions("quanbing_yzs");
			const downs = player.getExpansions("quanbing_yzs_down");
			return downs.length && !ups.length;
		},
		async content(event, trigger, player) {
			const downs = player.getExpansions("quanbing_yzs_down");
			let result = await player.chooseTarget(false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs"));
				})
				.set("ai", target => {
					const player = get.player();
					if (get.attitude(player, target) <= 0) return 0;
					if (player.getExpansions("quanbing_yzs_down")>=4)return target.countCards("h")+get.attitude(player,target)
					if (target.countCards("h") <= 3) return 0;
					return target.countCards("h") + get.attitude(player, target)
				})
				.set("prompt", "禁咒")
				.set("prompt2", "你令任意角色获得全部【权柄】并执行出牌阶段<br>因此获得4张牌的角色摸2张牌")
				.forResult()
			if (!result.bool) return
			await result.targets[0].gain(downs, "gain2");
			if (downs.length >= 4) {
				await result.targets[0].draw(2);
			}
			var next = result.targets[0].phaseUse();
			next.skill ="jinzhou_yzs"
			await next;
		},
	},
	//冰女
	bingjie_yzs: {
		mod: {
			cardnature(card, player) {
				if (get.color(card) == "black"&&get.name(card)=="sha") {
					return "yzsIce";
				}
			},
		},
	},
	yzsIce_skill: {
		charlotte: true,
		mark: true,
		forced:true,
		nopop: true,
		marktext: "<span style=\"text-decoration: line-through;\">冰</span>",
		intro: {
			content: "你跳过下一出牌阶段",
		},
		popup: false,
		trigger: { player: "phaseUseBefore" },
		async content(event, trigger, player) {
			await player.removeSkill("yzsIce_skill")
			game.broadcastAll(function (target) {
				if (target.node.avatar && target.node.avatar.overlayElement_yzsIce_skill) {
					target.node.avatar.overlayElement_yzsIce_skill.remove();
					delete target.node.avatar.overlayElement_yzsIce_skill;
				}
			}, player);
			trigger.cancel();
		}
	},
	bingpo_yzs: {
		group: "bingpo_yzs_damage",
		subSkill: {
			damage: {
				priority:-1,
				trigger: { player: "damageBegin3" },
				filter(event, player) {
					return player.countCards("h") >= player.hp;
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseToDiscard(`弃置1张手牌，然后无效你即将受到的${trigger.num}点伤害`)
						.set("position", "h")
						.set("ai", function (card) {
							return 10 - get.value(card);
						})
						.set("chooseonly", true)
						.forResult();
				},
				async content(event, trigger, player) {
					await player.modedDiscard(event.cards);
					trigger.cancel();
				}
			}
		},
		trigger: {
			player: "phaseDiscardEnd",
		},
		filter(event, player) {
			return event.cards?.length;
		},
		popup: false,
		async cost(event, trigger, player) {
			let list = [['基本', '', 'sha', "ice_yzs"], ['锦囊', '', 'guohe',""]];
			let result = await player.chooseButtonTarget()
				.set("createDialog", ["冰魄", "你可视为使用冰【杀】或【过河拆桥】", [list, "vcard"]])
				.set("selectButton", 1)
				.set("filterTarget", (card,player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					const button = ui.selected.buttons[0];
					return player.canUse({ name: button.link[2],nature:button.link[3] }, target)
				})
				.set("ai1",button=>get.value(button))
				.set("ai2", target => {
					const player = get.player();
					return -get.attitude(player,target)
				})
				.forResult()
			if (result.bool == false) return false;
			event.result = {
				bool: true,
				targets: result.targets,
				cost_data: result.links,
			}
		},
		async content(event, trigger, player) {
			var card = {
				name: event.cost_data[0][2],
				nature: event.cost_data[0][3],
				isCard: true
			};
			await player.useCard(card, event.targets[0]);
		},
	},
	IceAge_yzs: {
		nobracket: true,
		limited: true,
		animationColor: "thunder", 
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao"
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
			player.yzs_UseShunfaji("IceAge_yzs");
		},
		clickableFilter: function (player) {
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let result = await player.chooseTarget(false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs") ;
				})
				.set("selectTarget",[1,Infinity])
				.set("prompt", "冰痕世纪")
				.set("prompt2", "限定技：你调整体力值至1，然后召引【冰风暴】并跳过任意名角色下一出牌阶段")
				.forResult()
			if (!result.bool) {
				return;
			}
			let next = player.useSkill("IceAge_yzs")
			next.targets = result.targets;
			await next;
		},
		prompt2: "限定技：你调整体力值至1，然后召引【冰风暴】并跳过任意名角色下一出牌阶段",
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			return true
		},
		multitarget: true,
		multiline: true,
		selectTarget:[1,Infinity],
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs");
		},
		async content(event, trigger, player) {
			player.awakenSkill("IceAge_yzs");
			const num = player.hp - 1;
			if (num > 0) { await player.loseHp(num) };
			if (num < 0) { await player.recover(-num) };
			await player.yzs_SummonStorm("IceStorm");
			for (let target of event.targets) {
				await target.addSkill("yzsIce_skill")
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
				}, target)
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
				player(player) {
					return -2 * (player.hp - 1);
				},
				target: (player, target) => {
					if (target === _status.currentPhase && target.skipList.includes("phaseUse")) {
						let evt = _status.event.getParent("phase");
						if (evt && evt.phaseList.indexOf("phaseJudge") <= evt.num) {
							return 0;
						}
					}
					let num = target.needsToDiscard(3),
						cf = Math.pow(get.threaten(target, player) + 0.6, 2);
					if (!num) {
						return -0.01 * cf;
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
					return (Math.min(-0.1, -num) * cf) / dist;
				},
			},
			threaten:2.3
		}
	},
	_icesha_yzs : {
		name: "冰结",
		trigger: {
			source: "damageBegin1",
		},
		audio: "hanbing_skill",
		logTarget: "player",
		prompt2: "是否跳过该角色的下一出牌阶段并转换至【冰风暴】？",
		priority: -12415,
		popup: false,
		superCharlotte: true,
		ruleSkill: true,
		filter(event, player) {
			return event.hasNature("yzsIce") && event.notLink();
		},
		async content(event, trigger, player) {
			let damageAudioInfo = "effect/damage_ice.mp3";
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, damageAudioInfo);
			await trigger.player.addSkill("yzsIce_skill")
			await player.yzs_changeStorm("IceStorm");
		},
	},
}
export default skills;
