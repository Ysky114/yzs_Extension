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
	yzs_dieRemove: {
		charlotte: true,
		silent: true,
		fixed: true,
		forceDie: true,
		forceOut: true,
		trigger: {
			global: ["dieAfter"],
		},
		filter(event, player) {
			return !event.reverseOut && (event.player == player || event.player == player._source);
		},
		async content(event, trigger, player) {
			const next = game.createEvent("yzs_dieRemove_after", false, trigger);
			next.player = player;
			next.forceDie = true;
			next.forceOut = true;
			next.setContent(async (event, trigger, player) => {
				await player.yzs_removePlayerOL();
			})
			trigger.next.remove(next);
			trigger.after.push(next);
		},
		mark: true,
		marktext: "👻",
		intro: {
			name: "死亡移除",
			content(storage, player, skill) {
				if (!player._source) {
					return `${get.translation(player)} 没有主人`;
				}
				const me = game.me._trueMe || game.me;
				if (player._source == me) {
					return `你是 ${get.translation(player)} 的召唤者`;
				} else {
					return `你不是 ${get.translation(player)} 的召唤者`;
				}
			},
		},
		forced: true,
		popup: false,
		"_priority": 1,
	},
	yzs_autoswap: {
		trigger: {
			player: ["playercontrol", "chooseToUseBegin", "chooseToRespondBegin", "chooseToDiscardBegin", "chooseToCompareBegin", "chooseButtonBegin", "chooseCardBegin", "chooseTargetBegin", "chooseCardTargetBegin", "chooseControlBegin", "chooseBoolBegin", "choosePlayerCardBegin", "discardPlayerCardBegin", "gainPlayerCardBegin", "dieAfter"],
		},
		firstDo: true,
		forced: true,
		priority: 9999,
		forceDie: true,
		charlotte: true,
		popup: false,
		silent: true,
		filter: function (event, player) {
			if (!_status.yzs_autoswap[player.playerid]) return false;
			if (event.autochoose && event.autochoose()) return false;
			//if (lib.filter.wuxieSwap(event)) return false;
			return true;
		},
		async content(event, trigger, player) {
			const links = _status.yzs_autoswap[player.playerid];
			if (trigger.name == 'die') {
				const map = lib.playerOL ?? game.playerMap;
				for (const id of links) {
					const current = map[id];
					if (current.isAlive() && current != player) {
						game.broadcastAll((die) => {
							if (game.me.playerid != die.playerid) return;
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
			if (links.includes(player.playerid) && (_status.connectMode ? (!player.isOnline2() || player != game.me) : true)) {
				const map = lib.playerOL ?? game.playerMap;
				for (const id of links) {
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
	//谭雅
	eling_yzs: {
		group: ["eling_yzs_use"],
		subSkill: {
			use: {
				priority: 31,
				direct: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.eling_yzs && get.suit(event.card, player) != "spade";
				},
				async content(event, trigger, player) {
					player.addSkill("eling_yzs_damage");
					player.markAuto("eling_yzs_damage", get.suit(trigger.card, player))
					await player.draw();
				},
			},
			damage: {
				onremove: true,
				charlotte: true,
				intro: {
					content: "视为♠的花色：$",
				},
				priority: 22,
				direct: true,
				trigger: {
					player: ["damageAfter", "damageZero"]
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					player.storage.eling_yzs_damage = [];
					player.markSkill("eling_yzs_damage");
					player.unmarkSkill("eling_yzs_damage");
					player.removeSkill("eling_yzs_damage")
				},
				mod: {
					cardsuit(card, player) {
						if (player?.storage?.eling_yzs_damage?.includes?.(card.suit)) {
							return "spade"
						}
					},
				},
			},
		},
		audio: "ext:一中杀/audio/skill:3",
		hiddenCard(player, name) {
			var list = ["wuxie", "shan"];
			return list.includes(name) && player.countCards("h");
		},
		enable: ["chooseToUse"],
		filter(event, player) {
			if (event.responded) return false;
			var list = ["wuxie", "shan"];
			if (!list.length) {
				return false;
			}
			if (!player.countCards("h")) {
				return false;
			}
			for (var i of list) {
				if (event.filterCard(get.autoViewAs({ name: i, storage: { eling_yzs: true, } }, "unsure"), player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = ["wuxie", "shan"];
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					if (event.filterCard(get.autoViewAs({ name: i, storage: { eling_yzs: true, } }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("恶伶", [list2, "vcard"]);
			},
			check(button) {
				return _status.event.player.getUseValue({ name: button.link[2], storage: { eling_yzs: true, } }, null, true);
			},
			backup(links, player) {
				return {
					filterCard(card) {
						return true
					},
					audio: "eling_yzs",
					selectCard: 1,
					position: "h",
					popname: true,
					viewAs: {
						name: links[0][2],
						storage: {
							eling_yzs: true,
						}
					},
				};
			},
			prompt(links, player) {
				return "将1张手牌当做【" + get.translation(links[0][2]) + "】使用或打出";
			},
		},
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "shan" && get.name(card) != "wuxie" && get.color(card) != "black") {
					return;
				}
				const cards2 = player.getCards("hs", function (card2) {
					return get.name(card2) == "shan" || get.name(card2) == "wuxie" || get.color(card2) == "black";
				});
				cards2.sort(function (a, b) {
					return (["wuxie", "shan"].includes(get.name(b)) ? 1 : 2) - (["wuxie", "shan"].includes(get.name(a)) ? 1 : 2);
				});
				const geti = function () {
					if (cards2.includes(card)) {
						return cards2.indexOf(card);
					}
					return cards2.length;
				};
				if (["wuxie", "shan"].includes(get.name(card))) {
					return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
				}
				return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.eling_yzs.mod.aiValue.apply(this, arguments);
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
	},
	shenyu_yzs: {
		group: ["shenyu_yzs_use"],
		subSkill: {
			use: {
				priority: 51,
				forced: true,
				popup: false,
				audio: "shenyu_yzs",
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return get.suit(event.card, player) == "spade" && event.addCount !== false
				},
				async content(event, trigger, player) {
					if (trigger.card.name == "sha") game.trySkillAudio("shenyu_yzs")
					trigger.addCount = false;
					trigger.player.getStat("card")[trigger.card.name]--;
				},
				mod: {
					targetInRange: function (card) {
						if (get.suit(card) == "spade") {
							return true;
						}
					},
					cardUsable(card, player, num) {
						if (get.suit(card, player) == "spade") {
							return Infinity
						}
					},
				},
				"skill_id": "shenyu_yzs_use",
				sub: true,
				sourceSkill: "shenyu_yzs",
				"_priority": 5100,
			},
		},
		locked: true,
		forced: true,
		priority: -3,
		audio: "ext:一中杀/audio/skill:6",
		trigger: {
			player: "phaseJieshuBegin",
		},
		async content(event, trigger, player) {
			await player.draw(2);
			await player.executeDelayCardEffect("shandian");
		},

	},
	tiandu_yzs: {
		group: ["tiandu_yzs_guicai"],
		subSkill: {
			guicai: {
				priority: 6,
				trigger: {
					player: "judge",
				},
				audio: "eling_yzs",
				preHidden: true,
				filter(event, player) {
					return player.countCards("h") > 0 && player.storage.tiandu_yzs;
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseCard(`${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`, "h", (card) => {
						const player2 = get.player();
						const mod2 = game.checkMod(card, player2, "unchanged", "cardEnabled2", player2);
						if (mod2 != "unchanged") {
							return mod2;
						}
						const mod = game.checkMod(card, player2, "unchanged", "cardRespondable", player2);
						if (mod != "unchanged") {
							return mod;
						}
						return true;
					}).set("ai", (card) => {
						const trigger2 = get.event().getTrigger();
						const { player: player2, judging } = get.event();
						const result = trigger2.judge(card) - trigger2.judge(judging);
						const attitude = get.attitude(player2, trigger2.player);
						let val = get.value(card);
						if (get.subtype(card) == "equip2") {
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
					}).set("judging", trigger.player.judging[0]).setHiddenSkill(event.skill).forResult();
				},
				popup: false,
				async content(event, trigger, player) {
					player.changeZhuanhuanji("tiandu_yzs");
					const next = player.respond(event.cards, event.name, "highlight", "noOrdering");
					await next;
					const { cards: cards2 } = next;
					if (cards2?.length) {
						if (trigger.player.judging[0].clone) {
							trigger.player.judging[0].clone.classList.remove("thrownhighlight");
							game.broadcast(function (card) {
								if (card.clone) {
									card.clone.classList.remove("thrownhighlight");
								}
							}, trigger.player.judging[0]);
							game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
						}
						trigger.tiandu_yzs = true;
						await game.cardsDiscard(trigger.player.judging[0]);
						trigger.player.judging[0] = cards2[0];
						trigger.orderingCards.addArray(cards2);
						game.log(trigger.player, "的判定牌改为", cards2);
						await game.delay(2);
					}
				},
				ai: {
					rejudge: true,
					tag: {
						rejudge: 1,
					},
				},
				sub: true,
				sourceSkill: "tiandu_yzs",
				"skill_id": "tiandu_yzs_guicai",
				"_priority": 600,
			},
		},
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				const str = storage ? "你的判定牌亮出后，你可打出手牌代替之" : "你的判定牌亮出后，你可获得之"
				return str;
			},
		},
		audio: "shenyu_yzs",
		priority: 1,
		trigger: {
			player: "judgeEnd",
		},
		preHidden: true,
		frequent(event) {
			return event.result.card.name !== "du";
		},
		check(event) {
			return event.result.card.name !== "du";
		},
		filter(event, player) {
			if (event.tiandu_yzs) return false;
			return !player.storage?.tiandu_yzs && get.position(event.result.card, true) == "o";
		},
		async content(event, trigger, player) {
			player.changeZhuanhuanji("tiandu_yzs");
			await player.gain(trigger.result.card, "gain2");
		},
		"skill_id": "tiandu_yzs",
		"_priority": 0,
	},
	//昆伊
	cangyao_yzs: {
		group: ["cangyao_yzs_zhuanlun"],
		subSkill: {
			zhuanlun: {
				priority: -2,
				audio: "cangyao_yzs",
				forced: true,
				trigger: {
					player: ["zhenjian_yzs_useEnd", "cangxingzhan_yzs_useEnd"],
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					const index = player.countMark("cangyao_yzs_zhuanlun") % 3;
					player.addMark("cangyao_yzs_zhuanlun", 1, false);
					if (index == 0) {
						await player.draw()
					} else if (index == 1) {
						await player.recover()
					} else if (index == 2) {
						game.broadcastAll(function (current) {
							if (current.name == "KunYee_yzs" && current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/KunYee_yzs2.png");
						}, player)
						player.playEffectOL(lib.skill.GodgivenSwordsmanship_yzs.Effect);
						player.addMark("cangyao_yzs", 1, false)
					}
				}
			},
			buff: {
				onremove(player) {
					game.broadcastAll(function (current) {
						if (current.name == "KunYee_yzs" && current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/Cana_yzs.png");
					}, player)
					if (player.node.avatar && player.node.avatar.overlayElement_cangyao_yzs) {
						player.node.avatar.overlayElement_cangyao_yzs.remove();
						delete player.node.avatar.overlayElement_cangyao_yzs;
					}
				},
				charlotte: true,
				mod: {
					targetInRange: function (card) {
						return true;
					},
					cardUsable(card, player, num) {
						return Infinity
					},
				},
			},
		},
		locked: true,
		intro: {
			markcount: "storage",
			content: "手牌点数+#。",
		},
		mod: {
			cardnumber(card, player, number) {
				let num = number + player.countMark("cangyao_yzs");
				if (num <= 0) num = 1;
				return Math.min(num, 13);
			},
			cardname(card, player) {
				if (get.number(card, player) >= 13 && get.position(card) == "h") {
					return "sha";
				}
			},
			cardnature(card, player) {
				if (get.number(card, player) >= 13 && get.position(card) == "h") {
					return "thunder";
				}
			},
			ignoredHandcard(card, player) {
				if (get.number(card, player) >= 13) {
					return true;
				}
			},
			cardDiscardable(card, player, name) {
				if (name === "phaseDiscard" && get.number(card, player) >= 13) {
					return false;
				}
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		enable: "phaseUse",
		usable: 1,
		prompt: `出牌阶段限1次：你摸2张牌，若你人物牌上的其他技能均失效，本阶段你使用牌无次数距离限制`,
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.draw(2);
			if (player.hasSkill("zhenjian_yzs_ban") && player.hasSkill("cangxingzhan_yzs_ban")) {
				player.addTempSkill("cangyao_yzs_buff", "phaseUseAfter")
				game.broadcastAll(function (target) {
					if (target.node.avatar && !target.node.avatar.overlayElement_cangyao_yzs) {
						// --- 特效应用核心函数 ---
						const applyUltimateHalo = function (node, suffix) {
							// 1. 清除旧图层
							const propName = 'overlayElement_cangyao_yzs';
							if (node[propName]) {
								node[propName].remove();
							}

							// 2. 创建主特效容器（用于整体缩放和定位）
							let overlay = document.createElement('div');
							overlay.className = 'overlayElement_cangyao_yzs';

							// --- 核心样式设定 ---
							Object.assign(overlay.style, {
								position: 'absolute',
								// 让光环层远大于头像边界，形成笼罩感
								top: '-25%',
								left: '-25%',
								width: '150%',
								height: '150%',
								pointerEvents: 'none',
								zIndex: '20', // 确保在所有旧特效之上
								borderRadius: '50%', // 强制为圆形，更像光环
								opacity: '1'
							});

							// --- 3. 注入 CSS 动画（核心视觉源） ---
							if (!document.getElementById('halo-ultimate-style')) {
								let style = document.createElement('style');
								style.id = 'halo-ultimate-style';
								style.innerHTML = `
                /* 主容器呼吸缩放动画 */
                @keyframes halo-master-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }

                /* 内层光环旋转动画 */
                @keyframes halo-inner-rotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }

                /* 外层光环逆向旋转动画 */
                @keyframes halo-outer-rotate {
                    from { transform: translate(-50%, -50%) rotate(360deg); }
                    to { transform: translate(-50%, -50%) rotate(0deg); }
                }
            `;
								document.head.appendChild(style);
							}
							overlay.style.animation = 'halo-master-pulse 2.5s ease-in-out infinite';

							// --- 4. 创建子元素：中心高光晕 ---
							let glow = document.createElement('div');
							Object.assign(glow.style, {
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
								width: '90%', // 略小于容器
								height: '90%',
								borderRadius: '50%',
								// 核心：强烈的中心到边缘渐变（白->黄->橙->透明）
								background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,215,0,0.5) 40%, rgba(255,165,0,0.3) 70%, rgba(255,165,0,0) 100%)',
								filter: 'blur(10px)', // 柔化边缘
								mixBlendMode: 'screen', // 增强亮度
								opacity: '0.9'
							});
							overlay.appendChild(glow);

							// --- 5. 创建子元素：内层光环 ---
							let innerRing = document.createElement('div');
							Object.assign(innerRing.style, {
								position: 'absolute',
								top: '50%',
								left: '50%',
								width: '110%', // 环形尺寸
								height: '110%',
								borderRadius: '50%',
								border: '4px solid rgba(255, 215, 0, 0.9)', // 金黄实线环
								boxShadow: '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.6)',
								mixBlendMode: 'screen',
								animation: 'halo-inner-rotate 5s linear infinite' // 慢速顺时针旋转
							});
							overlay.appendChild(innerRing);

							// --- 6. 创建子元素：外层光环 ---
							let outerRing = document.createElement('div');
							Object.assign(outerRing.style, {
								position: 'absolute',
								top: '50%',
								left: '50%',
								width: '130%', // 更大的尺寸
								height: '130%',
								borderRadius: '50%',
								border: '2px dotted rgba(255, 165, 0, 0.7)', // 橙色点线环，增加质感差异
								boxShadow: '0 0 20px rgba(255, 165, 0, 0.6)',
								mixBlendMode: 'screen',
								animation: 'halo-outer-rotate 7s linear infinite' // 慢速逆时针旋转
							});
							overlay.appendChild(outerRing);

							// 7. 挂载
							node.appendChild(overlay);
							node[propName] = overlay;
						};

						// --- 执行挂载 ---
						applyUltimateHalo(target.node.avatar);
						if (target.node.avatar2) {
							applyUltimateHalo(target.node.avatar2);
						}
					}
				}, player);
			}
		},
		ai: {
			order: 8,
			result: {
				player: 2
			}
		}
	},
	zhenjian_yzs: {
		group: ["zhenjian_yzs_use"],
		subSkill: {
			ban: {
				charlotte: true,
				mark: true,
				marktext: "振",
				intro: {
					content: "振剑失效了",
				},
			},
			use: {
				priority: 33,
				direct: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.zhenjian_yzs
				},
				async content(event, trigger, player) {
					await player.draw();
				},
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		hiddenCard(player, name) {
			if (player.hasSkill("zhenjian_yzs_ban")) return false;
			var list = ["wuxie", "shan"];
			return list.includes(name) && player.countCards("h");
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (player.hasSkill("zhenjian_yzs_ban")) return false;
			if (event.responded) return false;
			var list = ["wuxie", "shan"];
			if (!list.length) {
				return false;
			}
			if (!player.countCards("h")) {
				return false;
			}
			for (var i of list) {
				if (event.filterCard(get.autoViewAs({ name: i, storage: { zhenjian_yzs: true, } }, "unsure"), player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = ["wuxie", "shan"];
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					if (event.filterCard(get.autoViewAs({ name: i, storage: { zhenjian_yzs: true, } }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("振剑", [list2, "vcard"]);
			},
			check(button) {
				return _status.event.player.getUseValue({ name: button.link[2], storage: { zhenjian_yzs: true, } }, null, true);
			},
			backup(links, player) {
				return {
					audio: "zhenjian_yzs",
					filterCard(card) {
						return get.name(card) == "sha";
					},
					selectCard: 1,
					position: "h",
					popname: true,
					viewAs: {
						name: links[0][2],
						storage: { zhenjian_yzs: true, }
					},
					async precontent(event, trigger, player) {
						if (event.result.card.name != "wuxie") return;
						let evt = event.getParent(4);
						//game.log(evt.name);
						let card = null;
						if (!card && evt && evt.name == "phaseJudge" && evt.card) {
							card = evt.card;
						} else {
							evt = evt.getParent()
							if (!card && evt && evt.name == "useCard" && evt.card) {
								card = evt.card;
							}
						}
						if (!card || !card.name) return;
						let targets = [];
						if (evt?.name == "phaseJudge") {
							targets = [evt.player]
						} else if (evt?.name == "useCard") {
							targets = evt.targets;
						}
						if (!targets.includes(player)) player.addTempSkill("zhenjian_yzs_ban")
					},
				};
			},
			prompt(links, player) {
				return "将1张【杀】当做【" + get.translation(links[0][2]) + "】使用或打出";
			},
		},
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "shan" && get.name(card) != "wuxie" && get.color(card) != "black") {
					return;
				}
				const cards2 = player.getCards("hs", function (card2) {
					return get.name(card2) == "shan" || get.name(card2) == "wuxie" || get.color(card2) == "black";
				});
				cards2.sort(function (a, b) {
					return (["wuxie", "shan"].includes(get.name(b)) ? 1 : 2) - (["wuxie", "shan"].includes(get.name(a)) ? 1 : 2);
				});
				const geti = function () {
					if (cards2.includes(card)) {
						return cards2.indexOf(card);
					}
					return cards2.length;
				};
				if (["wuxie", "shan"].includes(get.name(card))) {
					return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
				}
				return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.zhenjian_yzs.mod.aiValue.apply(this, arguments);
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
	},
	cangxingzhan_yzs: {
		group: ["cangxingzhan_yzs_use"],
		subSkill: {
			ban: {
				charlotte: true,
				mark: true,
				marktext: "星",
				intro: {
					content: "苍星斩失效了",
				},
			},
			use: {
				priority: 32,
				direct: true,
				trigger: {
					player: ["useCardAfter"],
				},
				filter(event, player) {
					return event.card?.storage?.cangxingzhan_yzs && event.targets?.length;
				},
				async content(event, trigger, player) {
					const target = trigger.targets[0];
					if (target.canUse({ name: "juedou", isCard: true, storage: { cangxingzhan_yzs_use: true } }, player, false)) {
						await target.useCard({ name: "juedou", isCard: true, storage: { cangxingzhan_yzs_use: true } }, player, false);
					}
					if (player.hasHistory("damage", (evt) => {
						return evt.card && evt.card.storage?.cangxingzhan_yzs_use;
					})) {
						player.addTempSkill("cangxingzhan_yzs_ban");
					}
				},
			},
		},
		nobracket: true,
		audio: "cangyao_yzs",
		enable: "phaseUse",
		filter(event, player) {
			if (player.hasSkill("cangxingzhan_yzs_ban")) return false;
			return true;
		},
		filterCard(card) {
			return get.name(card) == "sha";
		},
		position: "h",
		viewAs: {
			name: "guohe",
			storage: { cangxingzhan_yzs: true }
		},
		viewAsFilter(player) {
			if (player.hasSkill("cangxingzhan_yzs_ban")) return false;
			if (!player.countCards("h", { name: "sha", storage: { cangxingzhan_yzs: true } })) {
				return false;
			}
		},
		prompt: "将【杀】当做【过河拆桥】使用",
		check(card) {
			return 4 - get.value(card);
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
	//王千
	xuansi_yzs: {
		locked: true,
		priority: 3,
		trigger: {
			player:"phaseZhunbei"
		},
		filter(event, player) {
			return !game.players.some(cur => cur.name == "QianmianDoll_yzs" && cur._source==player)
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return true
				})
				.set("ai", function (target) {
					return Math.random();
				})
				.set("forced", true)
				.set("prompt", "悬丝")
				.set("prompt2", `在目标角色下家召唤“${get.poptip("QianmianDoll_yzs")}”`)
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const pos = event.targets[0];
			await player.turnOver();
			await player.yzs_addPlayerOL(pos, "QianmianDoll_yzs", null, true, { isControl:true,noCheckResult:true})
		},
	},
	tianmou_yzs: {
		priority: -1,
		trigger: {
			global: "useCardToPlayer",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (get.type(event.card) != "basic" && get.type(event.card) != "trick") return false;
			if (!player.hasCard((card) => player.canRecast(card), "h")) return false;
			return true;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard({
				prompt: `你可重铸1张牌名为${get.translation(get.name(event.card))}的手牌`,
				selectCard: 1,
				filterCard: (card, player2) => player2.canRecast(card)&&get.name(card,player)==get.event().cardname,
				position: "h"
			})
				.set("ai", (card) => {
					let value = 6 - get.value(card);
					const name=get.event().cardname
					if (get.name(card) == name) value += 3;
					return value;
				})
				.set("cardname",get.name(event.card))
				.forResult();
		},
		async content(event, trigger, player) {
			const { cards } = event;
			let num = 1;
			let next = false;
			await player.recast(cards);
			let result2 = player.hasCard((card) => player.canRecast(card), "h") ? await player.chooseCard({
				prompt: `你可重铸1张点数为${get.number(trigger.card)}的手牌`,
				selectCard: 1,
				filterCard: (card, player2) => player2.canRecast(card) && get.number(card, player) == get.event().number,
				position: "h"
			})
				.set("ai", (card) => {
					let value = 6 - get.value(card);
					const number = get.event().number
					if (get.number(card) == number) value += 3;
					return value;
				})
				.set("number", get.number(trigger.card))
				.forResult() : {bool:false};
			if (result2?.bool && result2.cards?.length) {
				next = true;
				num++;
				await player.recast(result2.cards)
			}
			if (next) {
				let result3 = player.hasCard((card) => player.canRecast(card), "h") ? await player.chooseCard({
					prompt: `你可重铸1张花色为${get.translation(get.suit(trigger.card))}的手牌`,
					selectCard: 1,
					filterCard: (card, player2) => player2.canRecast(card) && get.suit(card, player) == get.event().suit,
					position: "h"
				})
					.set("ai", (card) => {
						let value = 6 - get.value(card);
						const suit = get.event().suit
						if (get.suit(card) == suit) value += 3;
						return value;
					})
					.set("suit", get.suit(trigger.card))
					.forResult() : { bool: false };
				if (result3?.bool && result3.cards?.length) {
					next = true;
					num++;
					await player.recast(result3.cards)
				}
			}
			if (num > 0) {
				num--;
				if (game.hasPlayer(target => {
					if (target.hasSkill("hidden_yzs")) return false;
					return target.countDiscardableCards(player, "h")
				})) {
					let result = await player.chooseTarget("弃置任意角色1张手牌", true)
						.set("filterTarget", (card, player, target) => {
							if (target.hasSkill("hidden_yzs")) return false;
							return target.countDiscardableCards(player, "h")
						})
						.forResult();
					if (result?.bool) {
						if (player.name == "QianmianDoll_yzs") {
							const audioName = ["tiance_yzs_basic", "tiance_yzs_damage", "tiance_yzs_judge", "tiance_yzs_trick","tiance_yzs"]
							game.trySkillAudio(audioName)
						} else {
							game.trySkillAudio("tianmou_yzs")
						}
						await player.discardPlayerCard(result.targets[0], "hej", true);
					}
				}
			}
			if (num > 0) {
				num--;
				const targets = game.filterPlayer(current => {
					if (trigger.targets?.includes(current)) {
						return true
					}
					return lib.filter.targetEnabled2(trigger.card, player, current);
				});
				if (targets.length) {
					let result = await player
						.chooseTarget(
							`为${get.translation(trigger.card)}增加或取消一个目标`,
							(card, player, target) => {
								return get.event().targetx.includes(target);
							},
							true
					)
						.set("onChooseTarget", function () {
							const event = get.event();
							let targetx = event.targetx;
							event.targetprompt2.add(target => {
								if (!target.classList.contains("selectable")) {
									return;
								}
								if (targetx.includes(target)) return "取消";
								return "增加";
							});
						})
						.set("forced",true)
						.set("ai", target => {
							const player = get.player(),
								trigger = get.event().getTrigger(),
								eff = get.effect(target, trigger.card, trigger.player, player);
							if (trigger.targets?.includes(target)) {
								return -eff;
							}
							return eff;
						})
						.set("targetx", targets)
						.forResult()
					if (result?.bool && result.targets?.length) {
						if (player.name == "QianmianDoll_yzs") {
							const audioName = ["tiance_yzs_basic", "tiance_yzs_damage", "tiance_yzs_judge", "tiance_yzs_trick", "tiance_yzs"]
							game.trySkillAudio(audioName)
						} else {
							game.trySkillAudio("tianmou_yzs")
						}
						for (let target of result.targets) {
							player.line(target);
							if (targets.includes(target)) {
								trigger.targets.remove(target);
								game.log(target, "从", card, "的目标中移除");
							} else {
								trigger.targets.add(target);
								game.log(target, "成为", card, "的额外目标");
							}
						}
					}
				}
			}
			if (num > 0) {
				num--;
				if (player.name == "QianmianDoll_yzs") {
					const audioName = ["tiance_yzs_basic", "tiance_yzs_damage", "tiance_yzs_judge", "tiance_yzs_trick", "tiance_yzs"]
					game.trySkillAudio(audioName)
				} else {
					game.trySkillAudio("tianmou_yzs")
				}
				await player.gain(trigger.cards, 'gain2');
			}
		},
	},
	chaoyuezhishou_yzs: {
		nobracket:true,
	},
	Qianmiankui_yzs: {
		nobracket:true,
	},
}
export default skills;
