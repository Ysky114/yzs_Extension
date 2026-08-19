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
					} else if (current == game.me && !_status.auto && current != player) {
						game.swapPlayerAuto(player);
					};
				};
			}
		},
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (player == arg) {
					return false;
				}
				if (!_status.yzs_autoswap[player.playerid]) return false
				if (_status.yzs_autoswap[player.playerid].includes(arg.playerid)) {
					return true;
				};
				return false;
			},
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
						await player.draw(2)
					} else if (index == 1) {
						await player.recover()
					} else if (index == 2) {
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
				game.broadcastAll(function (current) {
					if (current.name == "KunYee_yzs" && current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/KunYee_yzs2.png");
				}, player)
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
					//await player.draw();
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
					if (player.hasHistory("sourceDamage", (evt) => {
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
			if (!player.countCards("h")) return false;
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
			if (!player.countCards("h", { name: "sha" })) {
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
			player: "phaseZhunbei"
		},
		audio: "ext:一中杀/audio/skill:5",
		filter(event, player) {
			return !game.players.some(cur => cur.name == "QianmianDoll_yzs" && cur._source == player)
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return true
				})
				.set("ai", function (target) {
					return Math.random();
				})
				.set("prompt", "悬丝")
				.set("prompt2", `在目标角色下家召唤“${get.poptip("QianmianDoll_yzs")}”`)
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const pos = event.targets[0];
			await player.turnOver();
			game.broadcastAll(() => {
				var video = document.createElement("VIDEO");
				video.className = "anime";
				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/xuansi_yzs.MP4",
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
			await player.yzs_addPlayerOL(pos, "QianmianDoll_yzs", null, true, { isControl: true, noCheckResult: true })
		},
	},
	tianmou_yzs: {
		priority: -1,
		trigger: {
			global: "useCard",
		},
		audio: "ext:一中杀/audio/skill:7",
		filter(event, player) {
			if (event.player == player) return false;
			if (get.type(event.card) != "basic" && get.type(event.card) != "trick") return false;
			if (!player.hasCard((card) => player.canRecast(card), "h")) return false;
			if (!event.targets?.length) return false;
			return true;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard({
				prompt: `你可重铸1张牌名为【${get.translation(get.name(trigger.card))}】的手牌`,
				selectCard: 1,
				filterCard: (card, player2) => player2.canRecast(card) && get.name(card, player) == get.event().cardname,
				position: "h"
			})
				.set("ai", (card) => {
					let value = 6 - get.value(card);
					const name = get.event().cardname
					if (get.name(card) == name) value += 3;
					return value;
				})
				.set("cardname", get.name(trigger.card))
				.forResult();
		},
		async content(event, trigger, player) {
			const { cards } = event;
			let num = 1;
			let next = false;
			await player.recast(cards);
			let result2 = player.hasCard((card) => player.canRecast(card), "h") ? await player.chooseCard({
				prompt: `你可重铸1张点数为 ${get.number(trigger.card)} 的手牌`,
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
				.forResult() : { bool: false };
			if (result2?.bool && result2.cards?.length) {
				next = true;
				num++;
				await player.recast(result2.cards)
			}
			if (next) {
				let result3 = player.hasCard((card) => player.canRecast(card), "h") ? await player.chooseCard({
					prompt: `你可重铸1张花色为 ${get.translation(get.suit(trigger.card))} 的手牌`,
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
							const audioName = ["tiance_yzs_basic", "tiance_yzs_damage", "tiance_yzs_judge", "tiance_yzs_trick", "tiance_yzs"].randomGet();
							game.trySkillAudio(audioName)
						} else {
							game.trySkillAudio("tianmou_yzs")
						}
						await player.discardPlayerCard(result.targets[0], "h", true);
					}
				}
			}
			if (num > 0) {
				num--;
				const targets = game.filterPlayer(current => {
					if (trigger.targets?.includes(current)) {
						return true
					}
					return lib.filter.targetEnabled2(trigger.card, trigger.player, current);
				});
				if (targets.length) {
					let result = await player
						.chooseTarget(
							`为${get.translation(trigger.card)}增加或取消一个目标`,
							(card, player, target) => {
								return get.event().targets.includes(target);
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
						.set("forced", true)
						.set("ai", target => {
							const player = get.player(),
								trigger = get.event().getTrigger(),
								eff = get.effect(target, trigger.card, trigger.player, player);
							if (trigger.targets?.includes(target)) {
								return -eff;
							}
							return eff;
						})
						.set("targetx", trigger.targets)
						.set("targets", targets)
						.forResult()
					if (result?.bool && result.targets?.length) {
						if (player.name == "QianmianDoll_yzs") {
							const audioName = ["tiance_yzs_basic", "tiance_yzs_damage", "tiance_yzs_judge", "tiance_yzs_trick", "tiance_yzs"].randomGet();
							game.trySkillAudio(audioName)
						} else {
							game.trySkillAudio("tianmou_yzs")
						}
						for (let target of result.targets) {
							player.line(target);
							if (trigger.targets.includes(target)) {
								trigger.targets.remove(target);
								game.log(target, "从", trigger.card, "的目标中移除");
							} else {
								trigger.targets.add(target);
								game.log(target, "成为", trigger.card, "的额外目标");
							}
						}
					}
				}
			}
			if (num > 0) {
				num--;
				if (player.name == "QianmianDoll_yzs") {
					const audioName = ["tiance_yzs_basic", "tiance_yzs_damage", "tiance_yzs_judge", "tiance_yzs_trick", "tiance_yzs"].randomGet();
					game.trySkillAudio(audioName)
				} else {
					game.trySkillAudio("tianmou_yzs")
				}
				await player.gain(trigger.cards, 'gain2');
			}
		},
	},
	chaoyuezhishou_yzs: {
		group: ["chaoyuezhishou_yzs_die", "chaoyuezhishou_yzs_audio"],
		subSkill: {
			die: {
				trigger: {
					player: "dieBefore",
				},
				filter(event, player) {
					return true;
				},
				priority: -2,
				forceDie: true,
				async cost(event, trigger, player) {
					event.result = await player.chooseTarget("超越之手", "你即将死亡时，可令1名其他角色翻面", false)
						.set("filterTarget", (card, player, target) => {
							return !target.hasSkill("hidden_yzs") && player != target;
						})
						.set("ai", (target) => {
							const player = get.event().player;
							if (target.isTurnedOver()) return get.attitude(player, target);
							else return -get.attitude(player, target);
						})
						.forResult()
				},
				async content(event, trigger, player) {
					if (player.name == "QianmianDoll_yzs") {
						const audioName = ["shenzhiyishou_yzs_red", "shenzhiyishou_yzs_black"].randomGet();
						game.trySkillAudio(audioName)
					} else {
						game.trySkillAudio("chaoyuezhishou_yzs_audio")
					}
					const target = event.targets[0];
					await target.turnOver();
				}
			},
			audio: {
				audio: "xuansi_yzs",
			}
		},
		nobracket: true,
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return (game.hasPlayer(function (target) {
				return lib.skill.chaoyuezhishou_yzs.filterTarget(null, player, target)
			}))
		},
		filterTarget(card, player, target) {
			if (target == player) return false;
			if (target.hasSkill("hidden_yzs")) return false;
			return Math.abs(player.countCards("h") - target.countCards("h")) <= 2;
		},
		async content(event, trigger, player) {
			const target = event.target;
			const equal = target.countCards("h") == player.countCards("h");
			let big = false;
			let small = false;
			if (!equal) {
				big = target.countCards("h") > player.countCards("h") ? target : player;
				small = target.countCards("h") > player.countCards("h") ? player : target;
			}
			if (player.name == "QianmianDoll_yzs") {
				const audioName = ["shenzhiyishou_yzs_red", "shenzhiyishou_yzs_black"].randomGet();
				game.trySkillAudio(audioName)
			} else {
				game.trySkillAudio("chaoyuezhishou_yzs_audio")
			}
			await player.swapHandcards(target);
			if (!equal && big && small) {
				let result = await big.chooseTarget(`你可<font color="#ffb1b7">恢复1点体力</font>或<font color="#adbeff">视为对 ${get.translation(small)} 使用普通【杀】</font>`)
					.set("filterTarget", (card, player, target) => {
						if (!get.event().targetx.includes(target)) return false;
						if (target == player) return true;
						return player.canUse({ name: "sha", isCard: true }, target, false, false)
					})
					.set("ai", target => {
						const player = get.event().player;
						if (target == player) return get.recoverEffect(player, player, player);
						else return get.effect(target, { name: "sha", isCard: true }, player, player);
					})
					.set("onChooseTarget", function () {
						const player = get.event().player;
						const event = get.event();
						event.targetprompt2.add(target => {
							if (!target.classList.contains("selectable")) {
								return;
							}
							if (target == player) return ["回血"];
							return ["出杀"];
						});
					})
					.set("targetx", [big, small])
					.forResult();
				if (result?.bool && result.targets?.length) {
					if (result.targets[0] == big) {
						await result.targets[0].recover()
					} else {
						await big.useCard(result.targets[0], { name: "sha", isCard: true })
					}
				}
			}
		},
		ai: {
			order: 10,
			result: {
				target(player, target) {
					let value = 2 * player.countCards("h") - target.countCards("h");
					if (value > 0) {
						value -= Math.max(get.recoverEffect(player, player, player), get.effect(target, { name: "sha", isCard: true }, player, player))
					} else if (value < 0) {
						value += Math.max(get.recoverEffect(target, target, target), get.effect(player, { name: "sha", isCard: true }, target, target))
					}
					return value;
				},
			},
		},
	},
	Qianmiankui_yzs: {
		nobracket: true,
		global: "Qianmiankui_yzs_global",
		subSkill: {
			buff: {
				charlotte: true,
				mod: {
					maxHandcardFinal: function (player, num) {
						return 4;
					},
				},
			},
			global: {
				audio: "xuansi_yzs",
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (!["WangQian_yzs", "QianmianDoll_yzs"].includes(player.name)) return false;
					return (game.hasPlayer(function (target) {
						return lib.skill.Qianmiankui_yzs_global.filterTarget(null, player, target)
					}))
				},
				prompt: `<font color="#ffb1b7">“王千”</font>或<font color="#adbeff">“千面傀儡”</font>的出牌阶段限1次：其可令二者之一失去1点体力，然后令二者之一：摸2张牌、本回合手牌上限视为4。`,
				filterTarget: function (card, player, target) {
					if (!["WangQian_yzs", "QianmianDoll_yzs"].includes(target.name)) return false;
					return true;
				},
				selectTarget: 1,
				async content(event, trigger, player) {
					const target = event.target;
					await target.loseHp();
					let targets = game.filterPlayer(target => lib.skill.Qianmiankui_yzs_global.filterTarget(null, player, target))
					let result = await player.chooseTarget(`你令 ${get.translation(targets)} 其中之一摸2张牌、本回合手牌上限视为4`)
						.set("filterTarget", (card, player, target) => {
							return get.event().targets.includes(target)
						})
						.set("ai", target => {
							const player = get.event().player;
							if (target == player) return get.recoverEffect(player, player, player);
							else return get.effect(target, { name: "sha", isCard: true }, player, player);
						})
						.set('targets', targets)
						.forResult();
					if (result?.bool && result?.targets?.length) {
						await result.targets[0].draw(2);
						await result.targets[0].addTempSkill("Qianmiankui_yzs_buff");
					}
				},
			},
		},
		banned: ["lisu", "sp_xiahoudun", "xushao", "jsrg_xushao", "zhoutai", "old_zhoutai", "shixie", "xin_zhoutai", "dc_shixie", "old_shixie"],
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "锁定技", "转换技", "蓄力技", "蓄能技", "连招技"],
		priority: 6,
		audio: "tiance_yzs",
		trigger: {
			player: "phaseBegin",
			global: "addPlayerAfter",
		},
		filter(event, player) {
			if (event.name == "addPlayer") {
				if (!event.result?.target || event.result.target != player) return false;
			}
			return game.hasPlayer(current => {
				if (current == player) return false;
				if (current.hasSkill("hidden_yzs")) return false;
				return (
					current.getSkills(null, false, false).filter(skill => {
						let info = get.info(skill);
						if (!info || info.charlotte || get.skillInfoTranslation(skill, current).length == 0) {
							return false;
						}
						const categories = get.skillCategoriesOf(skill, player);
						return !categories.some(type => lib.skill.Qianmiankui_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
					}).length > 0
				);
			});
		},
		async cost(event, trigger, player) {
			event.result = { bool: false };
			const targets = game.filterPlayer(current => {
				if (current.hasSkill("hidden_yzs")) return false;
				return (
					current.getSkills(null, false, false).filter(skill => {
						let info = get.info(skill);
						if (!info || info.charlotte || get.skillInfoTranslation(skill, current).length == 0) {
							return false;
						}
						const categories = get.skillCategoriesOf(skill, player);
						return !categories.some(type => lib.skill.Qianmiankui_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
					}).length > 0
				);
			});
			if (!targets?.length) {
				return;
			}
			const result = await player
				.chooseTarget("千面傀：选择其他角色的1个通常技，你复制之至你下一回合开始或死亡", (card, player, target) => {
					return get.event().targets.includes(target);
				})
				.set("targets", targets)
				.set("ai", target => {
					return Math.random();
				})
				.forResult();
			if (!result?.bool) {
				return;
			}
			const target = result.targets[0];
			player.line(target);
			const skills = target.getSkills(null, false, false).filter(skill => {
				let info = get.info(skill);
				if (!info || info.charlotte || get.skillInfoTranslation(skill, target).length == 0) {
					return false;
				}
				const categories = get.skillCategoriesOf(skill, player);
				return !categories.some(type => lib.skill.Qianmiankui_yzs.bannedType.includes(type)) && !player.hasSkill(skill);
			});
			if (!skills?.length) {
				return;
			}
			const result2 =
				skills.length > 1
					? await player.chooseButton([`你复制 ${get.translation(target)} 的一个通常技至你下一回合开始或死亡`, [skills, "skill"]], true).forResult()
					: {
						bool: true,
						links: skills,
					};
			if (result2?.bool) {
				event.result = { bool: true, cost_data: result2.links[0] }
			}
		},
		async content(event, trigger, player) {
			const skill = event.cost_data;
			player.addTempSkill(skill, { player: ["phaseBegin", "dieAfter"] });
		},
	},
	//伏黑甚尔
	ziqi_yzs: {
		group: ["ziqi_yzs_lebu"],
		subSkill: {
			lebu: {
				trigger: {
					global: "phaseBefore",
					player: ["enterGame", "phaseUseEnd"]
				},
				audio: "ext:一中杀/audio/skill:2",
				priority: -2,
				forced: true,
				filter(event, player) {
					if (player.countCards("h", card => player.canAddJudge({ name: "lebu", cards: [card] })) <= 0) return false;
					if (event.name == "phaseUse") return true;
					return event.name != "phase" || game.phaseNumber == 0
				},
				async content(event, trigger, player) {
					if (player.countCards("h", card => player.canAddJudge({ name: "lebu", cards: [card] })) <= 0) return;
					var next = player.chooseToUse(true);
					next.set("openskilldialog", "自弃：你将1张手牌当做【乐不思蜀】对自己使用");
					next.set("norestore", true);
					next.set("_backupevent", "ziqi_yzs_backup");
					next.set("custom", {
						add: {},
						replace: { window: function () { } },
					});
					next.backup("ziqi_yzs_backup");
					next.set("addCount", false);
					await next;
				}
			},
			backup: {
				locked: false,
				viewAs: {
					name: "lebu",
				},
				log: false,
				position: "h",
				filterCard(card, player, event) {
					return get.itemtype(card) == "card" && player.canAddJudge({
						name: lib.skill.ziqi_yzs_backup.viewAs.name,
						cards: [card]
					});
				},
				selectTarget: -1,
				filterTarget(card, player, target) {
					return player == target;
				},
				check(card) {
					return 9 - get.value(card);
				},
				ai: {
					result: {
						target(player, target) {
							let res = lib.card.lebu.ai.result.target(player, target);
							if (player.countCards("h", "sha") >= player.hp) {
								res++;
							}
							if (target.isDamaged()) {
								return res + 2 * Math.abs(get.recoverEffect(target, player, target));
							}
							return res;
						},
						ignoreStatus: true,
					},
					order(item, player) {
						if (player.hp > 1 && player.countCards("j")) {
							return 0;
						}
						return 12;
					},
					effect: {
						target(card, player, target) {
							if (target.isPhaseUsing() && typeof card === "object" && get.type(card, null, target) === "delay" && !target.countCards("j")) {
								let shas =
									target.getCards("s", i => {
										if (card === i || (card.cards && card.cards.includes(i))) {
											return false;
										}
										return get.name(i, target) === "sha" && target.getUseValue(i) > 0;
									}) - target.getCardUsable("sha");
								if (shas > 0) {
									return [1, 1.5 * shas];
								}
							}
						},
					},
					basic: {
						order: 1,
						useful(card, i) {
							let player = _status.event.player;
							if (_status.event.isPhaseUsing()) {
								return game.hasPlayer(cur => {
									return cur !== player && lib.filter.judge(card, player, cur) && get.effect(cur, card, player, player) > 0;
								})
									? 4.2
									: 1;
							}
							return 1.3;
						},
						value: 8,
					},
					tag: {
						skip: "phaseUse",
					},
				},
			},
		},
		locked: true,
		priority: 11,
		mod: {
			cardname(card, player, name) {
				if (player.isTempBanned("ziqi_yzs")) return;
				if (get.color(card) == "black" && card.name == "sha") return "jiedao";
			},
		},
		audio: "ext:一中杀/audio/skill:3",
		trigger: {
			player: "damageBefore",
			source: "damageBefore",
		},
		forced: true,
		popup: false,
		async content(event, trigger, player) {
			if (_status.currentPhase == player) {
				game.trySkillAudio("ziqi_yzs")
			}
			player.tempBanSkill("ziqi_yzs")
		}
	},
	//管郡
	newLife_yzs: {
		group: ["newLife_yzs_renew"],
		subSkill: {
			renew: {
				trigger: {
					global: "roundStart",
				},
				async content(event, trigger, player) {
					player.setMark("newLife_yzs_renew", 1, false);
				},
				nopop: true,
				charlotte: true,
				priority: 0.929,
				silent: true,
				popup: false,
				forced: true,
			},
			item1: {
				charlotte: true,
				locked: true,
				mod: {
					maxHandcard(player, num) {
						return num + 4;
					},
				},
			},
			item2: {
				charlotte: true,
				locked: true,
				popup: false,
				priority: 2,
				forced: true,
				trigger: {
					global: "phaseDrawBegin2",
				},
				filter(event, player) {
					if (event.numFixed) return false;
					if (event.player == player) return true;
					if (["GuanjunServant_yzs1", "GuanjunServant_yzs2", "GuanjunServant_yzs3"].includes(event.player.name) && event.player._source == player) return true;
					return false;;
				},
				async content(event, trigger, player) {
					if (player.name == "Guanjun_yzs") {
						game.trySkillAudio("newLife_yzs")
					} else {
						game.trySkillAudio("Guanjun_Chimera_yzs")
					}
					trigger.num++;
				},
				ai: {
					threaten: 1.3,
				},
			},
			item3: {
				charlotte: true,
				locked: true,
				enable: "phaseUse",
				filter(event, player) {
					if (!player.countMark("newLife_yzs_renew") && (!player._source || !player._source.countMark("newLife_yzs_renew"))) return false;
					const owner = get.itemtype(player._source) == "player" ? player._source : player;
					const players = game.filterPlayer(cur => cur._source == owner && ["GuanjunServant_yzs1", "GuanjunServant_yzs2", "GuanjunServant_yzs3", "newLifeChimera_yzs", "newLifeChimera_yzs1"].includes(cur.name));
					if (players.length < 2) return false;
					let num = 0;
					players.every(p => num += p.countCards("h"))
					if (num < 5) return false;
					return true;
				},
				prompt: `出牌阶段，你可将X名手牌总数为N的“${get.poptip("GuanjunServant_yzs")}”或“奇美拉”融合为新的“奇美拉”，融合所用的手牌作为新的“奇美拉”的初始手牌（X≥2，N≥5）。然后你移动此“奇美拉”至任意座次。`,
				filterTarget(card, player, target) {
					const owner = get.itemtype(player._source) == "player" ? player._source : player;
					if (target._source != owner) return false;
					if (game.players.some(cur => ["newLifeChimera_yzs", "newLifeChimera_yzs1"].includes(cur.name)) && (!ui.selected.targets || !ui.selected.targets.some(cur => ["newLifeChimera_yzs", "newLifeChimera_yzs1"].includes(cur.name)))) return ["newLifeChimera_yzs", "newLifeChimera_yzs1"].includes(target.name)
					return ["GuanjunServant_yzs1", "GuanjunServant_yzs2", "GuanjunServant_yzs3"].includes(target.name)
				},
				selectTarget: [2, Infinity],
				filterOk() {
					if (!ui.selected.targets || ui.selected.targets.length < 2) return false;
					let num = 0;
					ui.selected.targets.every(cur => num += cur.countCards("h"));
					return num >= 5;
				},
				multitarget: true,
				multiline: true,
				line: "thunder",
				async content(event, trigger, player) {
					if (player.name == "Guanjun_yzs") {
						game.trySkillAudio("PinkAnesthesia_yzs")
					} else {
						game.trySkillAudio("Guanjun_Chimera_yzs")
					}
					if (player.countMark("newLife_yzs_renew")) {
						player.clearMark("newLife_yzs_renew", false)
					} else if (player?._source?.countMark?.("newLife_yzs_renew")) {
						player._source.clearMark("newLife_yzs_renew", false)
					}
					let sum = 0;
					let num = 0;
					let cards = [];
					for (let target of event.targets) {
						sum += 1;
						num += target.countCards("h")
						cards.addArray(target.getCards("h"))
					}
					let name = num + sum >= 12 ? "newLifeChimera_yzs1" : "newLifeChimera_yzs"
					let result = await player.yzs_addPlayerOL(player, name, null, true, { startCards: 0, isControl: true, noCheckResult: true }).forResult()
					if (!result?.target) return;
					const Chimera = result.target;
					Chimera.setMark("Guanjun_Chimera_yzs", sum, false);
					if (player.hasSkill("newLife_yzs_item4") || player._source?.hasSkill?.("newLife_yzs_item4")) {
						Chimera.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
						Chimera.addSkill(["newLife_yzs", "PinkAnesthesia_yzs", "mixiang_yzs", "CharmingCommand_yzs", "newLife_yzs_item1", "newLife_yzs_item2", "newLife_yzs_item3", "newLife_yzs_item4"])
					}
					Chimera.maxHp = Math.min(sum + 1, 5);
					Chimera.hp = Chimera.maxHp
					Chimera.update();
					Chimera.directgain(cards);
					for (let target of event.targets) {
						await target.yzs_removePlayerOL();
					}
					let result2 = await player.chooseTarget()
						.set("filterTarget", function (card, player, target) {
							return true
						})
						.set("ai", function (target) {
							return Math.random();
						})
						.set("prompt", "新生！")
						.set("prompt2", `移动此“奇美拉”至任意角色的下家`)
						.setHiddenSkill(event.name.slice(0, -5))
						.forResult();
					if (result2?.targets?.length) {
						const pos = result2.targets[0];
						if (pos == Chimera || pos.getNext() == Chimera) return;
						game.broadcastAll(
							function (Chimera, pos) {
								while (pos.getNext() != Chimera) {
									game.swapSeat(Chimera, Chimera.getNext());
								}
							},
							Chimera,
							pos
						);
					}
				}
			},
			item4: {
				charlotte: true,
				locked: true,
			}
		},
		locked: true,
		nobracket: true,
		audio: "ext:一中杀/audio/skill:6",
		trigger: {
			source: "die",
		},
		priority: 2,
		preHidden: true,
		forced: true,
		filter(event) {
			return true
		},
		async content(event, trigger, player) {
			event.togain = trigger.player.getCards("h");
			await player.gain(event.togain, trigger.player, "giveAuto", "bySelf");
			await player.recover();
			player.addMark("newLife_yzs", 1, false);
			const num = player.countMark("newLife_yzs");
			if (num == 1) {
				player.addSkill("newLife_yzs_item1")
			} else if (num == 2) {
				player.addSkill("newLife_yzs_item2")
			} else if (num == 3) {
				player.addSkill("newLife_yzs_item3")
			} else if (num == 4) {
				player.addSkill("newLife_yzs_item4");
				const players = game.filterPlayer(cur => cur._source == player && ["newLifeChimera_yzs", "newLifeChimera_yzs1"].includes(cur.name));
				for (let target of players) {
					target.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
					target.addSkill(["newLife_yzs", "PinkAnesthesia_yzs", "mixiang_yzs", "CharmingCommand_yzs", "newLife_yzs_item1", "newLife_yzs_item2", "newLife_yzs_item3", "newLife_yzs_item4"])
				}
			}
		},
	},
	PinkAnesthesia_yzs: {
		locked: true,
		audio: "ext:一中杀/audio/skill:6",
		nobracket: true,
		enable: "phaseUse",
		filterCard: true,
		selectCard: [0, Infinity],
		allowChooseAll: true,
		discard: false,
		lose: false,
		delay: 0,
		prompt: `选择 1 名角色，在其下家召唤 1 名“${get.poptip("GuanjunServant_yzs")}”并给予“仆从”任意张手牌，然后结束本阶段并可对“仆从”发动${get.poptip("CharmingCommand_yzs")}。<br>
若给出牌数≥3，“仆从”获得${get.poptip("mixiang_yzs")}且无视非指向性伤害。`,
		filterTarget(card, player, target) {
			return true
		},
		check(card) {
			if (ui.selected.cards.length > 1) {
				return 0;
			}
			if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
				return 0;
			}
			if (!ui.selected.cards.length && card.name == "du") {
				return 20;
			}
			const player = get.owner(card);
			return 10 - get.value(card);
		},
		async content(event, trigger, player) {
			let name = "GuanjunServant_yzs" + (Math.floor(3 * Math.random()) + 1)
			let result = await player.yzs_addPlayerOL(event.target, name, null, true, { startCards: 0, isControl: true, noCheckResult: true }).forResult()
			if (!result?.target) return;
			const evt = event.getParent("phaseUse", true);
			if (evt?.player == player) {
				evt.skipped = true;
			}
			if (event.cards.length >= 3) {
				result.target.addSkill(["mixiang_yzs", "ciyuanzhimen_yzs_summon_damage"])
			}
			await player.give(event.cards, result.target);
			if (!result.target?.isIn() || !player.countCards("h")) return;
			let result2 = await player.chooseCardTarget()
				.set("prompt", `你可对“仆从”发动${get.poptip("CharmingCommand_yzs")}<br><small>你正面向上给予其1张黑色手牌，然后其选择：<br>
	①：${get.poptip("sing_yzs")}1：摸1张牌，然后失去本吟唱。②：吟唱1：被你杀死。`)
				.set("position", "h")
				.set("filterTarget", (card, player, target) => {
					return get.event().target == target
				})
				.set("filterCard", (card, player, target) => {
					return get.color(card, player) == "black"
				})
				.set("ai2", target => {
					return 1
				})
				.set('target', result.target)
				.forResult();
			if (result2?.bool && result2.targets?.length && result2?.cards?.length) {
				let next = player.useSkill("CharmingCommand_yzs");
				next.cards = result2.cards;
				next.targets = result2.targets;
				await next;
			}
		},
		ai: {
			order(skill, player) {
				if (player.countCards("h") > 2) {
					return 10;
				}
				return 1;
			},
			result: {
				target(player, target) {
					return Math.random() - 0.5;
				},
				player: 2,
			},
			effect: {
				target_use(card, player, target) {
					if (player == target && get.type(card) == "equip") {
						if (player.countCards("e", { subtype: get.subtype(card) })) {
							const players = game.filterPlayer();
							for (let i = 0; i < players.length; i++) {
								if (players[i] != player && get.attitude(player, players[i]) > 0) {
									return 0;
								}
							}
						}
					}
				},
			},
			threaten: 0.8,
		},
	},
	CharmingCommand_yzs: {
		nobracket: true,
		audio: "ext:一中杀/audio/skill:7",
		enable: "phaseUse",
		usable: 1,
		filter: (event, player) => {
			return game.hasPlayer((current) => current != player && !current.hasSkill("hidden_yzs")) && player.hasCard((card) => get.color(card, player), "h");
		},
		filterCard: {
			color: "black"
		},
		filterTarget: function (card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return player != target;
		},
		discard: false,
		lose: false,
		delay: false,
		position: "h",
		check: (card) => {
			return 6 - get.value(card);
		},
		async content(event, trigger, player) {
			const { cards: cards2, target } = event;
			await player.give(cards2, target, true);
			let result = await target.chooseButton([
				"魅惑指令：请选择一项",
				[
					[
						["draw", `吟唱1：摸1张牌，然后失去本吟唱`],
						["die", `吟唱1：被 ${get.translation(player)} 杀死`],
					],
					"textbutton",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.set("filterButton", function (button) {
					return true;
				})
				.set("target", player)
				.set("ai", (button) => {
					const player = get.event().player;
					const target = get.event().target;
					if (button.link == "draw") {
						return 4;
					} else {
						if (player._source == target) return 10;
						return 0.1;
					}
				})
				.forResult();
			if (result?.bool && result?.links?.length) {
				if (result.links[0] == "draw") {
					await target.yzs_setCountDown({
						num: 1,
						repeatNum: 1,
						once: true,
						command: {
							async todo(player) {
								await player.draw()
							},
							list: [target],
						},
						value(item, player) {
							return 1;
						},
						name: "CharmingCommand_yzs",
						prompt: `摸1张牌，然后失去本吟唱`,
						skill: "CharmingCommand_yzs"
					});
				} else {
					await target.yzs_setCountDown({
						num: 1,
						repeatNum: 1,
						command: {
							async todo(player, source) {
								await player.die({ source: source })
							},
							list: [target, player],
						},
						value(item, player) {
							return 0.1;
						},
						name: "CharmingCommand_yzs",
						prompt: `被 ${get.translation(player)} 杀死`,
						skill: "CharmingCommand_yzs"
					});
				}
			}
		},
		ai: {
			combo: "PinkAnesthesia_yzs",
			order: 5,
			result: {
				player(player, target) {
					if (!ui.selected.cards.length) {
						return 0;
					}
					let num = target.getHp() - player.getHp();
					const card = ui.selected.cards[0], color = get.color(card);
					if (color == "red" && target.getHp() <= player.getHp() && target.isDamaged()) {
						num++;
					} else if (color == "black" && target.getHp() >= player.getHp()) {
						num--;
					}
					return Math.min(Math.abs(num), 5) * 1.1;
				},
				target(player, target) {
					if (!ui.selected.cards.length) {
						return 0;
					}
					const card = ui.selected.cards[0], color = get.color(card), val = get.value(card, target);
					if (color == "red" && target.getHp() <= player.getHp() && target.isDamaged()) {
						return get.recoverEffect(target, player, target) + val / 1.4;
					} else if (color == "black" && target.getHp() >= player.getHp()) {
						return get.effect(target, { name: "losehp" }, player, target) + val / 1.4;
					}
					return val / 1.4;
				},
			},
		},
	},
	Guanjun_servant_yzs: {
		locked: true,
		forced: true,
		popup: false,
		priority: 333,
		trigger: {
			player: ["phaseUseBefore", "phaseDiscardBefore"]
		},
		async content(event, trigger, player) {
			trigger.cancel();
		}
	},
	Guanjun_Chimera_yzs: {
		group: ["Guanjun_Chimera_yzs_draw"],
		subSkill: {
			draw: {
				forced: true,
				audio: "Guanjun_Chimera_yzs",
				trigger: {
					player: "phaseDrawBegin2",
				},
				priority: 331,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num = player.countMark("Guanjun_Chimera_yzs");
					trigger.numFixed = true;
				},
			},
		},
		locked: true,
		audio: "ext:一中杀/audio/skill:4",
		nobracket: true,
		priority: 3,
		trigger: {
			global: "damageBegin4",
		},
		marktext: "融合",
		intro: {
			content: "当前融合数为：#",
		},
		prompt2: `锁定技：你可替“淫欲囚医-管郡”承受伤害。`,
		frequent: true,
		check(event, player) {
			return player.hp >= event.player.hp;
		},
		filter(event, player) {
			return event.player.name == "Guanjun_yzs"
		},
		async content(event, trigger, player) {
			trigger.player = player;
		}
	},
	//白蛇
	choudie_yzs: {
		subSkill: {
			disc: {
				nopop: true,
				charlotte: true,
				enable: "phaseUse",
				filter(event, player) {
					if (!player.storage.choudie_yzs) return false;
					const cards = player.storage.choudie_yzs;
					return cards.length;
				},
				chooseButton: {
					dialog(event, player) {
						const list = player.storage.choudie_yzs;
						let cards = [];
						for (var i = 0; i < list.length; i++) {
							var cardname = "huashen_card_" + list[i];
							cards.push(game.createCard(cardname, "", ""));
						}
						return ui.create.dialog(`你可移去任意张【碟】以检索等量张锦囊牌`, cards);
					},
					select: [1, Infinity],
					filter(button, player) {
						return true;
					},
					check(button) {
						return Math.random() - 0.5;
					},
					backup(links, player) {
						return {
							filterCard: () => false,
							selectCard: -1,
							cards: links,
							async content(event, trigger, player) {
								const cards = lib.skill.choudie_yzs_disc_backup.cards;
								player.$throw(cards);
								let num = cards.length;
								let list = [];
								for (var i = 0; i < cards.length; i++) {
									list.push(cards[i].name.slice(13))
								}
								lib.skill.choudie_yzs.removeVisitors(list, player);
								var func = function (card) {
									return get.type2(card, false) == "trick"
								};
								let gains = [];
								while (num--) {
									let card = get.cardPile2(func)
									if (card) {
										await player.gain(card, "gain2");
									} else {
										break;
									}
								}
							},
						}
					}
				},
			},
			targeted: {
				charlotte: true,
				onremove: true,
			}
		},
		locked: true,
		banned: ["lisu", "sp_xiahoudun", "xushao", "jsrg_xushao", "zhoutai", "old_zhoutai", "shixie", "xin_zhoutai", "dc_shixie", "old_shixie"],
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技", "锁定技", "转换技", "蓄力技", "蓄能技", "连招技"],
		getSkills(characters2, player) {
			let skills2 = [];
			for (let name of characters2) {
				if (Array.isArray(get.character(name).skills)) {
					for (let skill of get.character(name).skills) {
						const categories = get.skillCategoriesOf(skill, player);
						if (categories.some(type => lib.skill.choudie_yzs.bannedType.includes(type)) || player.hasSkill(skill)) continue;
						let info = get.info(skill);
						if (info && (!info.unique || info.gainable)) {
							skills2.add(skill);
						}
					}
				}
			}
			return skills2;
		},
		addVisitors(characters2, player) {
			player.addSkillBlocker("choudie_yzs");
			game.log(player, "将", "#y" + get.translation(characters2), "加入了", "#g“碟”");
			game.broadcastAll(
				function (player2, characters3) {
					player2.tempname.addArray(characters3);
					player2.$draw(
						characters3.map(function (name) {
							let cardname = "huashen_card_" + name;
							lib.card[cardname] = {
								fullimage: true,
								image: "character:" + name
							};
							lib.translate[cardname] = get.rawName2(name);
							return game.createCard(cardname, " ", " ");
						}),
						"nobroadcast"
					);
				},
				player,
				characters2
			);
			player.markAuto("choudie_yzs", characters2);
			let storage = player.getStorage("choudie_yzs");
			let skills2 = lib.skill.choudie_yzs.getSkills(storage, player);
			player.addInvisibleSkill(skills2);
		},
		removeVisitors(characters2, player) {
			let skills2 = lib.skill.choudie_yzs.getSkills(characters2, player);
			let characters22 = player.getStorage("choudie_yzs").slice(0);
			characters22.removeArray(characters2);
			skills2.removeArray(lib.skill.choudie_yzs.getSkills(characters22, player));
			if (Array.isArray(player.tempname)) {
				game.broadcastAll((player2, characters3) => player2.tempname.removeArray(characters3), player, characters2);
			}
			player.unmarkAuto("choudie_yzs", characters2);
			_status.characterlist.addArray(characters2);
			player.removeInvisibleSkill(skills2);
		},
		onremove(player, skill) {
			lib.skill.choudie_yzs.removeVisitors(player.getStorage("choudie_yzs"), player);
			player.removeSkillBlocker("choudie_yzs");
		},
		skillBlocker(skill, player) {
			if (!player.invisibleSkills.includes(skill) || skill == "choudie_yzs") {
				return false;
			}
			player.removeSkillBlocker("choudie_yzs");
			const bool = !player.hasSkill("choudie_yzs");
			player.addSkillBlocker("choudie_yzs");
			return bool;
		},
		marktext: "碟",
		intro: {
			name: "DISC",
			mark(dialog, storage, player) {
				if (!storage || !storage.length) {
					return "当前没有“碟”";
				}
				if (player.isUnderControl(true)) {
					dialog.addSmall([storage, "character"]);
					let skills2 = lib.skill.choudie_yzs.getSkills(storage, player);
					if (skills2.length) {
						dialog.addText("<li>当前可用技能：" + get.translation(skills2), false);
					}
				} else {
					return `当前有 ${storage.length} 张“碟”`
				}
			},
		},
		forced: true,
		priority: 19,
		trigger: {
			player: "useCardToPlayered",
		},
		filter(event, player) {
			return !event.target.hasSkill("choudie_yzs_targeted")
		},
		async content(event, trigger, player) {
			trigger.target.addTempSkill("choudie_yzs_targeted");
			player.addSkill("choudie_yzs_skill");
			player.addSkill("choudie_yzs_disc");
			if (!_status.characterlist) {
				game.initCharacterList();
			}
			let characters2 = _status.characterlist.randomRemove(1);
			lib.skill.choudie_yzs.addVisitors(characters2, player);
		}
	},
	choudie_yzs_skill: {
		nopop: true,
		charlotte: true,
		priority: 32,
		trigger: {
			player: ["useSkill", "logSkillBegin"],
		},
		forced: true,
		filter(event, player) {
			let skill = get.sourceSkillFor(event);
			return player.invisibleSkills.includes(skill) && lib.skill.choudie_yzs.getSkills(player.getStorage("choudie_yzs"), player).includes(skill);
		},
		async content(event, trigger, player) {
			const visitors = player.getStorage("choudie_yzs").slice(0);
			const drawers = visitors.filter(function (name) {
				return get.character(name).skills?.includes(get.sourceSkillFor(trigger));
			});
			event.drawers = drawers;
			player.$throw(game.createCard("huashen_card_" + event.drawers[0], " ", " "))
			lib.skill.choudie_yzs.removeVisitors(event.drawers, player);
			game.log(player, "移去了", "#y" + get.translation(event.drawers[0]));
		},
		group: "choudie_yzs_skill_trigger",
		subSkill: {
			trigger: {
				trigger: {
					player: "triggerInvisible",
				},
				forced: true,
				forceDie: true,
				popup: false,
				charlotte: true,
				priority: 10,
				filter(event, player) {
					if (event.revealed) {
						return false;
					}
					let info = get.info(event.skill);
					if (info.charlotte) {
						return false;
					}
					let skills2 = lib.skill.choudie_yzs.getSkills(player.getStorage("choudie_yzs"), player);
					game.expandSkills(skills2);
					return skills2.includes(event.skill);
				},
				async content(event, trigger, player) {
					let result;
					if (get.info(trigger.skill).silent) {
						return;
					} else {
						const info = get.info(trigger.skill);
						const evt = trigger, evtTrigger = evt._trigger;
						let str;
						info.check;
						if (info.prompt) {
							str = info.prompt;
						} else {
							if (typeof info.logTarget == "string") {
								str = get.prompt(evt.skill, evtTrigger[info.logTarget], player);
							} else if (typeof info.logTarget == "function") {
								const logTarget = info.logTarget(evtTrigger, player, evt.triggername, evt.indexedData);
								if (get.itemtype(logTarget)?.indexOf("player") == 0) {
									str = get.prompt(evt.skill, logTarget, player);
								}
							} else {
								str = get.prompt(evt.skill, null, player);
							}
						}
						if (typeof str == "function") {
							str = str(evtTrigger, player, evt.triggername, evt.indexedData);
						}
						let next = player.chooseBool("光碟：" + str);
						next.set("yes", !info.check || info.check(evtTrigger, player, evt.triggername, evt.indexedData));
						next.set("hsskill", evt.skill);
						next.set("forceDie", true);
						next.set("ai", function () {
							return _status.event.yes;
						});
						if (typeof info.prompt2 == "function") {
							next.set("prompt2", info.prompt2(evtTrigger, player, evt.triggername, evt.indexedData));
						} else if (typeof info.prompt2 == "string") {
							next.set("prompt2", info.prompt2);
						} else if (info.prompt2 != false) {
							if (lib.dynamicTranslate[evt.skill]) {
								next.set("prompt2", lib.dynamicTranslate[evt.skill](player, evt.skill));
							} else if (lib.translate[evt.skill + "_info"]) {
								next.set("prompt2", lib.translate[evt.skill + "_info"]);
							}
						}
						if (trigger.skillwarn) {
							if (next.prompt2) {
								next.set("prompt2", '<span class="thundertext">' + trigger.skillwarn + "。</span>" + next.prompt2);
							} else {
								next.set("prompt2", trigger.skillwarn);
							}
						}
						result = await next.forResult();
					}
					if (result?.bool) {
						if (!get.info(trigger.skill).cost) {
							trigger.revealed = true;
						}
					} else {
						trigger.untrigger();
						trigger.cancelled = true;
					}
				},
			},
		},
	},
	miyu_yzs: {
		group: ["miyu_yzs_use", "miyu_yzs_mark"],
		subSkill: {
			draw: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num += 1;
				},
				priority: 1.99,
				nopop: true,
				charlotte: true,
				silent: true,
				forced: true,
				popup: false,
			},
			use: {
				forced: true,
				priority: 2,
				trigger: {
					player: ["useCard", "respond"]
				},
				audio: "ext:一中杀/audio/skill:2",
				filter(event, player) {
					let count = player.getHistory("useCard").length + player.getHistory("respond").length;
					const isPrime = function (num) {
						if (num <= 1) return false;
						for (let i = 2; i < num; i++) {
							if (num % i === 0) {
								return false;
							}
						}
						return true;
					}
					return isPrime(count)
				},
				async content(event, trigger, player) {
					await player.draw();
				}
			},
			mark: {
				forced: true,
				popup: false,
				priority: 14,
				trigger: {
					player: "useCard"
				},
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					player.addMark("miyu_yzs", 1, false);
					const num = player.countMark("miyu_yzs");
					const list = ["螺旋阶梯", "独角仙", "废墟街道", "无花果塔", "独角仙", "苦伤道", "独角仙", "特异点", "乔托",
						"天使", "紫阳花", "独角仙", "特异点", "秘密皇帝"];
					const path = `ext:一中杀/audio/skill/miyu_yzs_${list[num - 1]}.MP3`;
					player.popup(list[num])
					game.broadcastAll((path) => {
						game.playAudio(path);
					}, path);
				}
			}
		},
		mark: true,
		marktext: "语",
		intro: {
			name: "密语",
			content(storage, player, skill) {
				const list = ["『螺旋阶梯』", "『独角仙』", "『废墟街道』", "『无花果塔』", "『独角仙』", "『苦伤道』", "『独角仙』", "『特异点』", "『乔托』",
					"『天使』", "『紫阳花』", "『独角仙』", "『特异点』", "『秘密皇帝』"];
				let str = ``;
				const num = player.countMark("miyu_yzs");
				for (let i = 0; i < list.length; i++) {
					if (i < num) str += `<font color="#dbffa9">`;
					str += list[i];
					if (i < num) str += `</font>`;
					if (i % 2) str += `<br>`
				}
				return str;
			},
		},
		locked: true,
		skillAnimation: true,
		animationColor: "thunder",
		juexingji: true,
		forced: true,
		priority: 2,
		trigger: {
			player: "phaseAfter"
		},
		filter(event, player) {
			return player.countMark("miyu_yzs") > 13;
		},
		async content(event, trigger, player) {
			player.awakenSkill("miyu_yzs");
			game.broadcastAll(() => {
				_status.tempMusic = `ext:一中杀/audio/Crucified.mp3`;
				game.playBackgroundMusic();
				ui.backgroundMusic.addEventListener('ended', () => {
					delete _status.tempMusic;
					game.playBackgroundMusic();
				}, { once: true });
			});
			await player.recoverTo(player.maxHp);
			player.addSkill("miyu_yzs_draw");
			await player.reinitCharacter(player.name1, 'CMoon_EnricoPucci_yzs');
			let target = game.players.filter(cur => cur.getSeatNum() == 1);
			target = target[0];
			target.setMark("Singularity_yzs_position", 1, false);
		}
	},
	//新月
	Gravity_yzs: {
		global: "Gravity_yzs_global",
		group: ["Gravity_yzs_damage"],
		subSkill: {
			global: {
				charlotte: true,
				ai: {
					right_hand: true,
				}
			},
			damage: {
				locked: true,
				trigger: {
					source: "damageBegin1"
				},
				priority: 1,
				filter(event, player) {
					return true;
				},
				prompt2: `你对其他角色造成伤害后可令其翻面`,
				logTarget: "player",
				check(event, player) {
					if (event.player.isTurnedOver()) {
						return get.attitude(player, event.player) > 0;
					} else {
						return get.attitude(player, event.player) <= 0;
					}
				},
				async content(event, trigger, player) {
					await trigger.player.turnOver();
				}
			},
			limited: {
				nopop: true,
				limited: true,
				skillAnimation: false,
				priority: 64,
				trigger: {
					global: "phaseBefore"
				},
				audio: "ext:一中杀/audio/skill:2",
				prompt2: `每回合开始时，你可摸2张牌，然后反转回合执行顺序`,
				async content(event, trigger, player) {
					await player.draw(2);
					// 1. 获取所有玩家（存活 + 死亡），按座位号从小到大排序
					let players = game.players.concat(game.dead);
					players.sortBySeat();

					// 2. 首尾交换座位
					const len = players.length;
					const toSwapList = [];
					for (let i = 0; i < Math.floor(len / 2); i++) {
						const p1 = players[i];
						const p2 = players[len - 1 - i];
						toSwapList.push([p1, p2]);
					}

					// 3. 广播交换（也可以直接在当前客户端循环调用 swapSeat，视你扩展的结构而定）
					game.broadcastAll(list => {
						for (const [p1, p2] of list) {
							game.swapSeat(p1, p2, false);
						}
					}, toSwapList);
					if (trigger.name === "phase" && !trigger.player.isZhu2() && trigger.player !== players[0] && !trigger._finished) {
						trigger.finish();
						trigger._triggered = 5;
						const evt = players[0].insertPhase();
						delete evt.skill;
						const evt2 = trigger.getParent();
						if (evt2.name == "phaseLoop" && evt2._isStandardLoop) {
							evt2.player = players[0];
						}
						//跳过新回合的phaseBefore
						evt.pushHandler("onPhase", (event, option) => {
							if (event.step === 0 && option.state === "begin") {
								event.step = 1;
							}
						});
					}
				}
			},
		},
		locked: true,
	},
	Singularity_yzs: {
		group: ["Singularity_yzs_start"],
		subSkill: {
			draw: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num += 1;
				},
				priority: 2.99,
				nopop: true,
				charlotte: true,
				silent: true,
				forced: true,
				popup: false,
			},
			position: {
				charlotte: true,
				forced: true,
				popup: false,
				marktext: "位",
				intro: {
					content: "持有者造成或受到伤害或死亡时，将本标记移至其上家",
				},
				priority: 3,
				trigger: {
					player: ["damageBegin3", "dieBefore"],
					source: "damageBegin1"
				},
				filter(event, player) {
					return player.countMark("Singularity_yzs_position") > 0;
				},
				async content(event, trigger, player) {
					const target = player.getPrevious();
					if (target) {
						player.clearMark("Singularity_yzs_position", false);
						target.setMark("Singularity_yzs_position", 1, false);
						if (target.hasSkill("Gravity_yzs_limited") && target.awakenedSkills.includes("Gravity_yzs_limited")) {
							target.restoreSkill("Gravity_yzs_limited");
						}
					}
				}
			},
			start: {
				forced: true,
				priority: 333,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					let target = game.players.filter(cur => cur.getSeatNum() == 1);
					target = target[0];
					target.setMark("Singularity_yzs_position", 1, false);
				}
			},
		},
		locked: true,
		juexingji: true,
		forced: true,
		priority: 2,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			return player.countMark("Singularity_yzs_position") > 0;
		},
		async content(event, trigger, player) {
			player.awakenSkill("Singularity_yzs");
			player.clearMark("Singularity_yzs_position", false);
			game.broadcastAll(() => {
				ui.backgroundMusic.pause();
				game.playAudio(`ext:一中杀/audio/skill/Singularity_yzs.MP3`);
				var video = document.createElement("VIDEO");
				video.className = "anime";

				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/Singularity_yzs.MP4",
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
					zIndex: "99",
					transition: "opacity 1s ease-out",
				})
				video.addEventListener("ended", () => {
					video.style.opacity = "0";
					setTimeout(() => {
						document.body.removeChild(video);
						_status.tempMusic = `ext:一中杀/audio/Crucified.mp3`;
						game.playBackgroundMusic();
					}, 1000)//1s后移除视频
				})
				document.body.appendChild(video);
				setTimeout(() => {
					video.style.opacity = "1";
				}, 50)

			});
			await new Promise(r => setTimeout(r, 6000))
			await player.recoverTo(player.maxHp);
			player.addSkill("Singularity_yzs_draw");
			await player.reinitCharacter(player.name1, 'MadeInHeaven_EnricoPucci_yzs');
			player.insertPhase();
		}
	},
	//古明地觉
	mingji_yzs: {
		global: "mingji_yzs_global",
		subSkill: {
			global: {
				priority: -10,
				trigger: {
					target: "useCardToTargeted",
				},
				filter(event, player) {
					if (!["basic", "trick"].includes(get.type(event.card))) return false;
					if (player.hasSkill("mingji_yzs_used") && !(get.itemtype(player.storage.MindControl_yzs) == "player" && player.storage?.MindControl_yzs?.isIn?.())) return false;
					const cards = player.getExpansions("mingji_yzs");
					let map = {};
					for (let card of cards) {
						if (card.name in map) map[card.name]++;
						else map[card.name] = 1;
						if (map[card.name] >= 2) return false;
					}
					let cards2 = event.cards.filterInD();
					return cards2.length > 0;
				},
				async cost(event, trigger, player) {
					let owner = player.storage.MindControl_yzs;
					if (!owner || get.itemtype(owner) !== "player" || !owner.isIn?.()) owner = player;
					event.result = await owner.chooseTarget(`你可将 ${get.translation(trigger.cards)} 正面向上扣置为 ${get.translation(player)} 的【忆】，然后无效对 ${get.translation(player)} 使用的 ${get.translation(trigger.card)}`)
						.set("filterTarget", (card, player, target) => {
							return target == _status.event.target;
						})
						.set("ai", target => {
							const player = get.event().player;
							const { goon2, val } = get.event();
							if (goon2) {
								return get.attitude(player, target)
							}
							return -get.attitude(player, target)
						})
						.set("val", get.value(trigger.cards.filterInD()))
						.set("goon2", get.effect(player, trigger.card, trigger.player, player) < 0)
						.set('target', player)
						.forResult();
				},
				async content(event, trigger, player) {
					if (trigger.targets.includes(player)) {
						trigger.targets.remove(player);
						game.log(player, "从", trigger.card, "的目标中移除");
					}
					let cards2 = trigger.cards.filterInD();
					player.addTempSkill("mingji_yzs_used")
					let next = player.addToExpansion(cards2, "gain2", player);
					next.gaintag.add("mingji_yzs")
					await next;
				},
			}
		},
		marktext: "忆",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("mingji_yzs");
				if (cards.length) dialog.addAuto(cards);
			},
		},
	},
	MindControl_yzs: {
		marktext: "操",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const owner = player.storage.MindControl_yzs
				if (owner && get.itemtype(owner) == "player" && owner.isIn?.()) return `当前被 ${get.translation(owner)} 精神操控中`;
				return `没被任何人精神操控`
			},
		},
		nobracket: true,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.hasPlayer((target) => lib.skill.MindControl_yzs.filterTarget(null, player, target));
		},
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs") && (target.countCards("h") > 0 || target.countExpansions("mingji_yzs") > 0);
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			const target = event.target;
			const last = player.storage.MindControl_yzs_mark;
			if (last && get.itemtype(last) == "player") {
				delete last.storage.MindControl_yzs;
				last.markSkill("MindControl_yzs");
				last.unmarkSkill("MindControl_yzs")
			}
			player.setStorage("MindControl_yzs_mark", target);
			player.markSkill("MindControl_yzs_mark")
			target.setStorage("MindControl_yzs", player);
			target.markSkill("MindControl_yzs")

			if (target.countCards("h") < 1 && target.countExpansions("mingji_yzs") < 1) return;
			let args1 = [`观看 ${get.translation(target)} 的手牌并选择其1张手牌或【忆】，其将之加入【忆】/获得之`];
			if (target.countCards("h") > 0) {
				args1.push(`${get.translation(target)}的手牌`)
				args1.push(target.getCards("h"))
			}
			if (target.countExpansions("mingji_yzs")) {
				args1.push(`${get.translation(target)}的【忆】`)
				args1.push(target.getExpansions("mingji_yzs"))
			}
			args1.push("hidden")
			let result = await player.chooseButton(args1, true)
				.set("selectButton", 1)
				.set("ai", (button) => {
					const player = get.event().player;
					const card = button.link;
					const target = get.event().target;
					if (card.hasGaintag("mingji_yzs")) {
						return get.value(card, target) * get.attitude(player, target)
					} else {
						return 100 - get.value(card, target) * get.attitude(player, target);
					}
				})
				.set("target", player)
				.forResult();
			if (result?.bool && result?.links?.length) {
				const card = result.links[0];
				if (target.getCards("h").includes(card)) {
					let next = target.addToExpansion(card, "give", target);
					next.gaintag.add("mingji_yzs")
					await next;
				} else if (target.getExpansions("mingji_yzs").includes(card)) {
					await target.gain(card, "give");
				}
			}
		},
		ai: {
			order: 7,
			expose: 0.4,
			result: {
				target() {
					return Math.random() - 0.5;
				}
			}
		}
	},
	xiangqi_yzs: {
		enable: "phaseUse",
		filter: (event, player) => {
			return game.hasPlayer((target) => lib.skill.xiangqi_yzs.filterTarget(null, player, target));
		},
		filterTarget: function (card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			const cards = target.getExpansions("mingji_yzs");
			if (!cards.length) return false;
			let map = {};
			for (let card of cards) {
				if (card.name in map) map[card.name]++;
				else map[card.name] = 1;
				if (map[card.name] >= 2) return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			const target = event.target;
			const cards = target.getExpansions("mingji_yzs");
			if (!cards.length) return;
			let bool = true;
			let map = {};
			let gainable = [];
			for (let card of cards) {
				if (card.name in map) map[card.name].push(card);
				else map[card.name] = [card];
				if (map[card.name].length >= 2) bool = false;
			}
			if (bool) return;
			for (let i in map) {
				if (map[i].length < 2) continue;
				gainable.push(map[i]);
			}
			let result = gainable.length > 1
				? await player.chooseButton([`获得 ${get.translation(target)} 2张同名的【忆】`, cards], true)
					.set("ai", button => {
						const player = get.player();
						return get.value(button, player)
					})
					.set("selectButton", 2)
					.set("filterButton", function (button) {
						if (!ui.selected.buttons.length) {
							return true
						} else {
							const name = get.name(button, false);
							return ui.selected.buttons.every(btn => get.name(btn.link, false) == name);
						}
					})
					.forResult()
				: { bool: true, links: gainable[0] }
			if (result?.bool && result.links?.length) {
				await player.gain(result.links, "giveAuto")
				let cards2 = target.getExpansions("mingji_yzs");
				cards2 = cards2.filter(card => (get.type(card, false) == "basic" || get.type(card, false) == "trick") && player.canUse({
					name: get.name(card, false),
					nature: get.nature(card, false),
					isCard: true
				}, target, false, false))
				if (!cards2.length) return;
				while (cards2.some(card => {
					const cardx = {
						name: get.name(card, false),
						nature: get.nature(card, false),
						isCard: true
					};
					return player.canUse(cardx, target, false, false)
				})) {
					let result = await player
						.chooseButton(["想起：使用其中的一张牌", cards2])
						.set("filterButton", button => {
							const card = button.link;
							const player = get.event().player;
							const target = get.event().target;
							const cardx = {
								name: get.name(card, false),
								nature: get.nature(card, false),
								isCard: true
							};
							return player.canUse(cardx, target, false, false)
						})
						.set("forced", true)
						.set("target", target)
						.forResult();
					if (!result.bool) break;
					let card = result.links[0];
					cards2.remove(card);
					const cardx = {
						name: get.name(card, false),
						nature: get.nature(card, false),
						isCard: true
					};
					if (!player.canUse(cardx, target, false, false)) continue;
					await player.useCard(cardx, target, false)
				}
			}
		},
		ai: {
			order: 6,
			expose: 0.4,
			result: {
				player: 2,
				target(player, target) {
					let cards = target.getExpansions("mingji_yzs");
					if (!cards.length) return 0;
					let map = {};
					for (let card of cards) {
						if (card.name in map) map[card.name].push(card);
						else map[card.name] = [card];
					}
					let max = 0;
					for (let i in map) {
						if (map[i].length < 2) continue;
						let cards2 = cards.slice();
						cards2 = cards2.removeArray(map[i]);
						cards2 = cards2.filter(card => (get.type(card, false) == "basic" || get.type(card, false) == "trick") && player.canUse({
							name: get.name(card, false),
							nature: get.nature(card, false),
							isCard: true
						}, target, false, false))
						let sum = 0;
						cards2.map(card => sum += get.effect(target, {
							name: get.name(card, false),
							nature: get.nature(card, false),
							isCard: true
						}, player, target));
						if (sum > max) max = sum;
					}
					return max;
				}
			}
		}
	},
	//Jovanlin
	jingjuan_yzs: {
		group: ["jingjuan_yzs_use1", "jingjuan_yzs_use2", "jingjuan_yzs_use3"],
		subSkill: {
			use1: {
				priority: 4,
				popup: false,
				direct: true,
				trigger: {
					player: "useCard1"
				},
				filter(event, player) {
					return event.card?.name == "nanman" && event.card?.storage?.jingjuan_yzs && event.targets?.length;
				},
				async content(event, trigger, player) {
					let targets = trigger.targets;
					const map = await game.chooseAnyOL(targets, (player) => {
						return player
							.chooseButton(["选择你将于接下来的【南蛮入侵】中打出的【杀】张数", [["1", "2", "3", "4"], "tdnodes"]], true)
							.set("filterButton", button => {
								return true;
							})
							.set("ai", button => {
								const player = get.player();
								if (player.countCards("h", { name: "sha" }) > parseInt(button.link)) return parseInt(button.link)
								return Math.random();
							})
							.set("_global_waiting", true)
					}, []).forResult();
					const map2 = trigger.customArgs;
					for (const target of targets.sortBySeat()) {
						if (!map.get(target)) continue;
						const { links } = map.get(target);
						const num = parseInt(links[0])
						target.popup(num);
						game.log(target, "选择响应", num, "张");

						const idt = target.playerid;
						if (idt != null) {
							if (!map2[idt]) {
								map2[idt] = {};
							}
							map2[idt].shaRequired = num;
						}
					}
				}
			},
			use2: {
				priority: 4,
				popup: false,
				direct: true,
				trigger: {
					global: "respond"
				},
				filter(event, player) {
					const evt = event.getParent(2);
					if (evt.name != "nanman" || !evt.card) return false;
					const evt2 = evt.getParent();
					//	game.log(evt.name, evt2.name);
					if (evt2.name != "useCard") return false;
					return evt2.card?.name == "nanman" && evt2.card?.storage?.jingjuan_yzs
				},
				async content(event, trigger, player) {
					const evt = trigger.getParent(3);
					//		game.log(evt.name)
					const target = trigger.player;
					if (!evt.jingjuan_yzs) evt.jingjuan_yzs = {};
					if (!evt.jingjuan_yzs[target.playerid]) evt.jingjuan_yzs[target.playerid] = 0;
					evt.jingjuan_yzs[target.playerid]++;
					//	game.log(target, evt.jingjuan_yzs[target.playerid])
				}
			},
			use3: {
				priority: 4,
				popup: false,
				direct: true,
				trigger: {
					player: "useCardAfter"
				},
				filter(event, player) {
					return event.card?.name == "nanman" && event.card?.storage?.jingjuan_yzs && event.jingjuan_yzs;
				},
				async content(event, trigger, player) {
					let max = 0;
					let target = [];
					for (let id in trigger.jingjuan_yzs) {
						//	game.log(id, "|",trigger.jingjuan_yzs[id])
						if (trigger.jingjuan_yzs[id] > max) {
							max = trigger.jingjuan_yzs[id];
							target = [id];
						} else if (trigger.jingjuan_yzs[id] == max) {
							target.push(id);
						}
					}
					if (target.length == 1) {
						for (const cur of game.filterPlayer()) {
							if (cur.playerid == target) {
								game.log("响应牌数最多者为：", cur)
								game.broadcastAll(function () {
									if (lib.config.background_audio) {
										game.playAudio("effect/flappybird_score.wav");
									}
								});
								await cur.draw(3);
								break;
							}
						}
					} else {
						game.log("无人摸牌")
					}
				},
			}
		},
		enable: "phaseUse",
		usable: 1,
		selectTarget: [0, 1],
		multitarget: true,
		filterTarget: function (card, player, target) {
			return target == player;
		},
		async content(event, trigger, player) {
			let targets = game.filterPlayer(cur => player.canUse({ name: "nanman", isCard: true, storage: { jingjuan_yzs: true } }, cur, false, false));
			if (event.targets?.length) targets.addArray(event.targets);
			if (!targets.length) return;
			await player.useCard({ name: "nanman", isCard: true, storage: { jingjuan_yzs: true } }, targets);
		},
		ai: {
			order: 6,
			result: {
				player(player, target) {
					const players = game.filterPlayer();
					let value = 0;
					let friends = [];
					let f = 0;
					let enemies = [];
					let e = 0;
					for (let cur of players) {
						value += get.effect(cur, { name: "nanman" }, player, player);
						if (get.attitude(player, cur) > 0) {
							friends.push(cur);
							f += cur.countCards("h")
						} else {
							enemies.push(cur)
							e += cur.countCards("h")
						}
					}
					value += f > e ? 2 : -2;
					return value;
				},
				target(player, target) {
					return target.countCards("h") > 2 ? 1 : -1;
				},
			}
		}
	},
	shixue_yzs: {
		group: ["shixue_yzs_damage", "shixue_yzs_mark"],
		subSkill: {
			damage: {
				forced: true,
				trigger: {
					player: "useCardAfter",
				},
				filter(event, player) {
					return player.hasHistory("sourceDamage", function (evt) {
						return evt.card == event.card;
					})
				},
				async content(event, trigger, player) {
					await player.draw()
				}
			},
			mark: {
				popup: false,
				forced: true,
				trigger: {
					global: "phaseBegin",
				},
				async content(event, trigger, player) {
					const targets = game.players.sortBySeat().slice();
					for (let target of targets) {
						target.removeGaintag("shixue_yzs", target.getCards("h"))
					}
				},
			}
		},
		locked: true,
		trigger: {
			player: "gainAfter",
		},
		forced: true,
		popup: false,
		async content(event, trigger, player) {
			await trigger.player.addGaintag(trigger.cards, "shixue_yzs")
		},
		mod: {
			targetInRange: function (card) {
				if (card.cards?.some(c => c.hasGaintag("shixue_yzs"))) return true;
			},
			cardUsable: function (card, num) {
				if (card.cards?.some(c => c.hasGaintag("shixue_yzs"))) return Infinity;
			},
			cardname(card, player) {
				if (card.hasGaintag("shixue_yzs")) return;
				if (player.hp == 0) return "jiu";
				else if (player.hp == 1) return "tao";
				else if (player.hp == 2) return "sha";
				else if (player.hp == 3) return "shan";
			},
		},
	},
	//伊尔缪伊
	yunyu_yzs: {
		group: ["yunyu_yzs_summon"],
		subSkill: {
			summon: {
				audio: "yunyu_yzs",
				skillAnimation: true,
				animationColor: "fire",
				locked: true,
				trigger: {
					player: "phaseJieshu"
				},
				prompt2: `限定技：结束阶段，若你体力上限>8，你可于下家召唤“${get.poptip({
					id: "character_Faputa_yzs",
					name: "法仆塔",
					type: "character",
					dialog: "characterDialog",
				})}”，然后你扣除一半体力上限（向上取整），或令“法仆塔”翻面。`,
				priority: 5,
				filter(event, player) {
					return player.maxHp > 4 && !player.countMark("yunyu_yzs_summon")
				},
				async content(event, trigger, player) {
					let result = await player.yzs_addPlayerOL(player, "Faputa_yzs", null, true, { isControl: true, dieRemove: false }).forResult();
					if (!result?.target) return;
					game.broadcastAll(() => {
						_status.tempMusic = `ext:一中杀/audio/SAN-KEN「The Three SAGES」.mp3`;
						game.playBackgroundMusic();
						var background = document.createElement("img");
						background.className = "background";
						window._currentDynamicBackground = background;
						Object.assign(background, {
							src: lib.assetURL + "/extension/一中杀/image/background/yunyu_yzs.jpg",
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
					});
					player.addMark("yunyu_yzs_summon", 1, false)
					const target = result.target;
					let result2 = await player.chooseTarget(`你扣除一半体力上限（向上取整），或令“法仆塔”翻面`)
						.set("filterTarget", (card, player, target) => {
							return get.event().targets.includes(target)
						})
						.set("ai", target => {
							const player = get.event().player;
							if (2 * player.hp < player.maxHp) {
								if (target == player) return 114;
							} else {
								if (target.name == "Faputa_yzs") return 114;
							}
							return Math.random();
						})
						.set("onChooseTarget", function () {
							const event = get.event();
							const player = get.player();
							event.targetprompt2.add(target => {
								if (!target.classList.contains("selectable")) {
									return;
								}
								if (target == player) return "扣除上限";
								return "翻面"
							});
						})
						.set('targets', [player, target])
						.forResult();
					if (result2?.bool && result2?.targets?.length) {
						if (result2.targets[0] == player) {
							game.broadcastAll((current) => {
								game.playAudio("ext:一中杀/audio/skill/yunyu_yzs_summon1.MP3");
							}, player);
							await player.loseMaxHp(Math.ceil(player.maxHp / 2));
						} else {
							game.broadcastAll((current) => {
								game.playAudio("ext:一中杀/audio/skill/yunyu_yzs_summon2.MP3");
							}, player);
							await target.turnOver();
						}
					}
				}
			}
		},
		locked: true,
		forced: true,
		audio: "ext:一中杀/audio/skill:4",
		usable: 1,
		trigger: {
			player: "damageBegin4"
		},
		async content(event, trigger, player) {
			const target = get.itemtype(trigger.source) == "player" ? trigger.source : player;
			trigger.cancel();
			await player.gainMaxHp();
			const controls = ["draw_card", "recover_hp"];
			const prompt = `令 ` + get.translation(target) + ` 摸3张牌或恢复2点体力`
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
			next.set("target", target)
			next.set("prompt", prompt);
			next.set("forced", true);
			let result = await next.forResult();
			if (result.control == "draw_card") {
				await target.draw(3);
			} else {
				await target.recover(2);
			}
		},
		ai: {
			maixie: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
				},
			},
		},
	},
	duozi_yzs: {
		global: "duozi_yzs_global",
		subSkill: {
			global: {
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (!player.countCards("h", card => get.type(card, false) == "basic")) return false;
					return game.hasPlayer((target) => lib.skill.duozi_yzs_global.filterTarget(null, player, target));
				},
				filterTarget: function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && target.hasSkill("duozi_yzs")
				},
				filterCard(card, player) {
					return get.type(card) == "basic"
				},
				check(card) {
					return 7 - get.value(card);
				},
				discard: false,
				lose: false,
				delay: 0,
				prompt: `正面向上给予目标角色1张基本牌，然后视为对其使用【决斗】`,
				async content(event, trigger, player) {
					const target = event.target;
					if (target != player) await player.give(event.cards, target, true);
					await player.useCard(target, { name: "juedou", isCard: true })
				},
				ai: {
					order: 9,
					result: {
						player: 4,
						target: 0,
					},
				},
			}
		}
	},
	//法仆塔
	bianxing_yzs: {
		group: "bianxing_yzs_ex",
		subSkill: {
			ex: {
				priority: 5,
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.bianxing_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
				sub: true,
				sourceSkill: "bianxing_yzs",
			},
			used: {
				charlotte: true,
				onremove: "storage",
				sub: true,
				sourceSkill: "bianxing_yzs",
			},
		},
		hiddenCard(player, name) {
			var list = get
				.inpileVCardList(info => {
					const name = info[2];
					if (get.type(name) != "trick" && get.type(name) != "basic") {
						return false;
					}
					return !player.getStorage("bianxing_yzs_used").includes(name);
				})
			list = list.map(i => i = i[2]);
			return list.includes(name)
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (event.responded) return false;
			return get
				.inpileVCardList(info => {
					const name = info[2];
					if (get.type(name) != "trick" && get.type(name) != "basic") {
						return false;
					}
					return !player.getStorage("bianxing_yzs_used").includes(name);
				})
				.some(card => event.filterCard({ name: card[2], nature: card[3], isCard: true }, player, event));
		},
		chooseButton: {
			dialog(event, player) {
				var list = get
					.inpileVCardList(info => {
						const name = info[2];
						if (get.type(name) != "trick" && get.type(name) != "basic") {
							return false;
						}
						return !player.getStorage("bianxing_yzs_used").includes(name) && event.filterCard({ name: info[2], nature: info[3], isCard: true }, player, event);
					})
				return ui.create.dialog("变形", [list, "vcard"]);
			},
			check(button) {
				if (_status.event.getParent().type != "phase") {
					return 1;
				}
				return _status.event.player.getUseValue({ name: button.link[2], isCard: false, }, null, true);
			},
			backup(links, player) {
				return {
					audio: "ext:一中杀/audio/skill:3",
					filterCard() {
						return false;
					},
					selectCard: -1,
					position: "h",
					popname: true,
					viewAs: {
						name: links[0][2],
						isCard: false,
					},
					async precontent(event, trigger, player) {
						player.logSkill("bianxing_yzs");
						player.addTempSkill("bianxing_yzs_used");
						player.markAuto("bianxing_yzs_used", [event.result.card.name]);
						let result = await player
							.chooseButton([`令【变形】本回合失效，或减少1点体力上限`, [["技能失效", "扣除上限"], "tdnodes"]], true)
							.set("filterButton", button => {
								return true;
							})
							.set("ai", button => {
								const player = get.event().player;
								if (button.link == "技能失效") {
									if (player.maxHp <= 4 || player.hp == player.maxHp) return 124;
								}
								return 5;
							})
							.forResult();
						if (!result.bool) return;
						if (result.links?.length) {
							if (result.links[0] == "技能失效") {
								player.tempBanSkill("bianxing_yzs");
							} else {
								await player.loseMaxHp();
							}
						}
					},
				};
			},
			prompt(links, player) {
				return "视为使用或打出【" + get.translation(links[0][2]) + "】";
			},
		},
		mod: {
			cardUsable(card, player, num) {
				if (card?.storage?.bianxing_yzs) {
					return Infinity
				}
			},
		},
		ai: {
			save: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player, tag, arg) {
				if (player.isTempBanned("bianxing_yzs")) {
					return false;
				}
				if (tag == "respondSha" || tag == "respondShan") {
					if (arg == "respond") {
						return false;
					}
					return player.getStorage("bianxing_yzs").includes(tag == "respondSha" ? "sha" : "shan");
				}
				return true
			},
			order: 4,
			result: {
				player: 1,
			},
			threaten: 2.4,
		},
	},
	jiazhi_yzs: {
		group: ["jiazhi_yzs_kill"],
		audio: "ext:一中杀/audio/skill:1",
		subSkill: {
			kill: {
				audio: "jiazhi_yzs",
				locked: true,
				trigger: {
					source: "die",
				},
				forced: true,
				async content(event, trigger, player) {
					event.togain = trigger.player.getCards("h");
					await player.gain(event.togain, trigger.player, "giveAuto", "bySelf");
					if (typeof trigger.player.maxHp == "number") await player.gainMaxHp(trigger.player.maxHp);
				},
			}
		},
		locked: true,
		forced: true,
		trigger: {
			player: "phaseZhunbei"
		},
		priority: 3,
		async content(event, trigger, player) {
			await player.gainMaxHp();
		}
	},
	//奥丽
	yupao_yzs: {
		group: ["yupao_yzs_damage"],
		subSkill: {
			damage: {
				forced: true,
				priority: -2,
				trigger: {
					player: "damageEnd"
				},
				filter(event, player) {
					return player.hujia > 0;
				},
				async content(event, trigger, player) {
					await player.changeHujia(-Math.ceil(player.hujia / 2), "lose")
				}
			}
		},
		locked: true,
		marktext: "炮",
		intro: {
			content: "累计因【驭炮】获得过#/10点护甲",
		},
		direct: true,
		popup: true,
		priority: -1,
		trigger: {
			player: "phaseDiscardEnd",
		},
		filter(event, player) {
			return event.cards?.length
		},
		async content(event, trigger, player) {
			if (!player.countMark("yupao_yzs_awaken")) player.addMark("yupao_yzs", trigger.cards.length, false);
			await player.changeHujia(trigger.cards.length, "gain", 6)
			if (player.countMark("yupao_yzs") >= 10 && !player.countMark("yupao_yzs_awaken")) {
				player.addMark("yupao_yzs_awaken", 1, false)
				player.unmarkSkill("yupao_yzs")
				player.playEffectOL(lib.skill.GodgivenSwordsmanship_yzs.Effect);
				player.addSkill(["bahu_yzs", "biyue"])
			}
		},
	},
	daolve_yzs: {
		priority: -4,
		trigger: {
			player: "phaseJudgeBegin"
		},
		filter(event, player) {
			return game.hasPlayer(cur => cur.hasGainableCards(player, "hej"))
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget("盗掠", "你可获得任意角色区域内1张牌", false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs") && target.hasGainableCards(player, "hej")
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return get.effect(target2, { name: "shunshou" }, player2, player2);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets?.[0];
			if (!target) return;
			let pos = "hej";
			if (target.countGainableCards(player, pos)) {
				await player.gainPlayerCard(pos, target, true).set("target", target).set("complexSelect", false).set("ai", lib.card.shunshou.ai.button);
			}
		}
	},
	fuyoupao_yzs: {
		nobracket: true,
		locked: true,
		priority: -2,
		trigger: {
			global: "phaseAfter"
		},
		filter(event, player) {
			return player.hujia > 0 && !event.skill;
		},
		async cost(event, trigger, player) {
			const num = player.hujia;
			const phaseList = ["phaseDraw", "phaseJudge", "phaseUse", "phaseDiscard", "phaseZhunbei", "phaseJieshu"]
			game.broadcastAll((phaseList) => {
				for (let phase of phaseList) {
					lib.card["fuyoupao_yzs_" + phase] = {
						image: "extension/一中杀/image/GoldenOrly_yzs.png",
						type: "skill",
						fullimage: true,
					}
					lib.translate["fuyoupao_yzs_" + phase] = get.translation(phase)
				}
			}, phaseList)
			let cards = phaseList.map(function (i) {
				return game.createCard("fuyoupao_yzs_" + i, "", "");
			});
			const next = player.chooseToMove();
			next.set("list", [["阶段顺序", cards]]);
			next.set("prompt", `执行前${num}个阶段`);
			next.set("num", num);
			next.set("filterMove", function (from, to, moved) {
				return true;
				const num = get.event().num;
				let targetIndex = typeof to == 'number' ? to : moved.findIndex(l => l.includes(to.link));
				let fromIndex = typeof from == 'number' ? from : moved.findIndex(l => l.includes(from.link));
				if (fromIndex == 0 && targetIndex == 0) return false;
				if (moved?.[1]?.length && moved[1].length >= num && fromIndex == 0) return false;
				return true;
			})
			next.set("processAI", (list) => {
				const player = get.event().player;
				const list1 = list[0][1].slice();
				const list2 = list[1][1].slice();
				const num = get.event().num;
				for (let i = 0; i < num; i++) {
					let card = list1.randomGet();
					if (i == 0) {
						for (let c of list1) {
							if (c.name == "fuyoupao_yzs_phaseDraw") {
								card = c;
							}
						}
					}
					if (card.name == "fuyoupao_yzs_phaseZhunbei" && !player.hasSkill("bahu_yzs") && list1.length > 1) {
						i--;
						continue;
					} else if (card.name == "fuyoupao_yzs_phaseJieshu" && !player.hasSkill("biyue") && list1.length > 1) {
						i--;
						continue;
					}

					list1.remove(card);
					list2.push(card);
				}
				return list2.concat(list1);
			});
			const result = await next.forResult();
			const list = result?.moved?.[0] || [];
			if (list.length) {
				event.result = { bool: true, cost_data: list };
			} else {
				event.result = { bool: false };
			}
		},
		async content(event, trigger, player) {
			let list = event.cost_data;
			list = list.map(i => i = i.name.slice(13) + "|fuyoupao_yzs")
			const next = player.insertPhase("fuyoupao_yzs");
			next.set("phaseList", list);
		}
	},
	bahu_yzs: {
		charlotte: true,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		filter(event, player) {
			return true
		},
		forced: true,
		content() {
			player.draw();
		},
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + 1;
				}
			},
		},
	},
	//宇佐见堇子
	Metamorphosis_yzs: {
		Effect: function (targetPlayer) {
			// 1. 创建特效总容器
			const effectContainer = document.createElement('div');
			effectContainer.className = 'magic-curtain-effect-container';

			Object.assign(effectContainer.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '1000',
				pointerEvents: 'none',
				overflow: 'hidden',
				borderRadius: 'inherit' // 跟随头像圆角
			});

			targetPlayer.appendChild(effectContainer);

			// 2. 幕布的公共样式（利用 CSS 渐变模拟丝绒褶皱质感）
			const curtainCommonStyle = {
				position: 'absolute',
				top: '0',
				width: '51%', // 稍微多出1%防止中间出现缝隙
				height: '100%',
				// 红色丝绒褶皱纹理
				background: 'linear-gradient(90deg, #8b0000 0%, #b22222 25%, #8b0000 50%, #d2143a 75%, #660000 100%)',
				backgroundSize: '40px 100%', // 褶皱的宽度
				boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.6)',
				transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)', // 丝滑的展开收起过渡
				zIndex: '2'
			};

			// 创建左侧幕布
			const leftCurtain = document.createElement('div');
			Object.assign(leftCurtain.style, curtainCommonStyle, {
				left: '0',
				transform: 'translateX(-100%)' // 初始状态：隐藏在左侧外
			});

			// 创建右侧幕布
			const rightCurtain = document.createElement('div');
			Object.assign(rightCurtain.style, curtainCommonStyle, {
				right: '0',
				transform: 'translateX(100%)' // 初始状态：隐藏在右侧外
			});

			effectContainer.appendChild(leftCurtain);
			effectContainer.appendChild(rightCurtain);

			// 3. 动态注入头像缩放动画（幕布合拢时，头像微微向后退，增加空间感）
			if (!document.querySelector('#magic-curtain-style')) {
				const style = document.createElement('style');
				style.id = 'magic-curtain-style';
				style.textContent = `
            @keyframes curtainTargetScale {
                0% { transform: scale(1); filter: brightness(1); }
                15% { transform: scale(0.95); filter: brightness(0.8); }
                85% { transform: scale(0.95); filter: brightness(0.8); }
                100% { transform: scale(1); filter: brightness(1); }
            }
            .magic-curtain-target {
                animation: curtainTargetScale 2.2s ease-in-out forwards;
            }
        `;
				document.head.appendChild(style);
			}
			targetPlayer.classList.add('magic-curtain-target');

			// ================= 开始动画流程 =================

			// A. 幕布合拢（使用 requestAnimationFrame 确保过渡动画触发）
			requestAnimationFrame(() => {
				leftCurtain.style.transform = 'translateX(0)';
				rightCurtain.style.transform = 'translateX(0)';
			});

			// B. 保持合拢 2 秒后，拉开幕布
			// 总闭合时间 = 幕布合拢动画(0.6s) + 彻底掩盖(2s) = 2600ms 后开始拉开
			setTimeout(() => {
				leftCurtain.style.transform = 'translateX(-100%)';
				rightCurtain.style.transform = 'translateX(100%)';
				if (lib.config.background_audio) {
					game.playAudio("effect/throw_flower1.mp3");
				}
			}, 1600);

			// C. 清理战场
			// 幕布拉开动画需要 0.6s，所以 2600ms + 600ms = 3200ms 后移除 DOM
			setTimeout(() => {
				if (effectContainer.parentNode) {
					effectContainer.parentNode.removeChild(effectContainer);
				}
				targetPlayer.classList.remove('magic-curtain-target');
			}, 2200);
		},
		group: ["Metamorphosis_yzs_start", "Metamorphosis_yzs_phaseBegin"],
		subSkill: {
			mark: {
				markimage: "extension/一中杀/image/Metamorphosis_yzs.png",
				intro: {
					name: "大变活人",
					mark(dialog, storage, player) {
						const characters = [];
						if (storage.name1) characters.push(storage.name1);
						if (storage.name2) characters.push(storage.name2)
						if (!characters.length) {
							return "没有变化";
						}
						dialog.addText("本轮结束时变为：");
						dialog.addSmall([characters, "character"]);
					},
				},
				priority: 14125,
				charlotte: true,
				fored: true,
				popup: false,
				trigger: {
					global: "roundEnd"
				},
				async content(event, trigger, player) {
					player.removeSkill("Metamorphosis_yzs_mark");
					await player.reinitCharacter(player.name1, player.storage.Metamorphosis_yzs_mark.name1);
					if (player.storage.Metamorphosis_yzs_mark.name2) {
						await player.reinitCharacter(player.name2, player.storage.Metamorphosis_yzs_mark.name2);
					}
					player.maxHp = player.storage.Metamorphosis_yzs_mark.maxHp;
					if (player.storage.Metamorphosis_yzs_mark.exHp) {
						player.hp += player.storage.Metamorphosis_yzs_mark.exHp;
					}
					player.update();
					delete player.storage.Metamorphosis_yzs_mark;
					player.unmarkSkill("Metamorphosis_yzs_mark")
				}
			},
			start: {
				trigger: {
					global: "phaseBefore",
					player: ["enterGame"]
				},
				forced: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0
				},
				async content(event, trigger, player) {
					lib.skill.Metamorphosis_yzs.addHuashens(player, 3);
				}
			},
			phaseBegin: {
				trigger: {
					player: ["phaseBegin"]
				},
				priority: 98,
				filter(event, player) {
					return true
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let list = player.storage.Metamorphosis_yzs.character
					const result = await player.chooseButton()
						.set("ai", function (button) {
							return get.rank(button.link, true) - lib.character[button.link][2];
						})
						.set("createDialog", ["你可重铸1张【秘身】", [list, "character"]])
						.forResult();
					if (result?.links?.length) {
						event.result = {
							bool: true,
							cost_data: result.links
						}
					}
				},
				async content(event, trigger, player) {
					const cards = event.cost_data;
					if (!cards) return;
					lib.skill.Metamorphosis_yzs.removeHuashen(player, cards);
					lib.skill.Metamorphosis_yzs.addHuashens(player, 1);
				}
			},
		},
		locked: true,
		nobracket: true,
		mark: true,
		init(player, skill) {
			if (!player.storage[skill]) {
				player.storage[skill] = {
					character: [],
					choosed: [],
					map: {},
				};
			}
		},
		bannedName: ["SixSoulsFlowey_yzs", "MegumiSukuna_yzs", "FoolSeele_Vollerei_yzs", "YoungGojo_yzs", "Makora_yzs", "Seele_Vollerei_yzs", "RyomenSukuna_yzs"],
		markimage: "extension/一中杀/image/Metamorphosis_yzs.png",
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
					dialog.addSmall([[storage.current], (item, type, position, noclick, node) => lib.skill.Metamorphosis_yzs.$createButton(item, type, position, noclick, node)]);
				}
				if (storage && storage.current2) {
					dialog.add('<div><div class="skill">【' + get.translation(lib.translate[storage.current2 + "_ab"] || get.translation(storage.current2).slice(0, 2)) + "】</div><div>" + get.skillInfoTranslation(storage.current2, player, false) + "</div></div>");
				}
				if (storage && storage.character.length) {
					if (player.isUnderControl(true)) {
						dialog.addSmall([storage.character, "character"]);
					} else {
						dialog.addText("共有" + get.cnNumber(storage.character.length) + "张“秘身”");
					}
				} else {
					return "没有 “秘身”";
				}
			},
			content(storage, player) {
				return "共有" + get.cnNumber(storage.character.length) + "张“秘身”";
			},
			markcount(storage, player) {
				if (storage && storage.character) {
					return storage.character.length;
				}
				return 0;
			},
		},
		addHuashen(player) {
			if (!player.storage.Metamorphosis_yzs) {
				return;
			}
			if (!_status.characterlist) {
				game.initCharacterList();
			}
			_status.characterlist.randomSort();
			for (let i = 0; i < _status.characterlist.length; i++) {
				let name = _status.characterlist[i];
				if (name.indexOf("zuoci") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || get.is.double(name) || player.storage.Metamorphosis_yzs.character.includes(name)) {
					continue;
				}
				if (lib.skill.Metamorphosis_yzs.bannedName.includes(name)) continue;
				let skills = lib.character[name][3]
				if (skills.length) {
					player.storage.Metamorphosis_yzs.character.push(name);
					player.storage.Metamorphosis_yzs.map[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens(player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.Metamorphosis_yzs.addHuashen(player);
				if (name) {
					list.push(name);
				}
			}
			if (list.length) {
				player.syncStorage("Metamorphosis_yzs");
				player.updateMarks("Metamorphosis_yzs");
				game.log(player, "获得了", get.cnNumber(list.length) + "张", "“秘身”");
				lib.skill.Metamorphosis_yzs.drawCharacter(player, list);
			}
		},
		removeHuashen(player, links) {
			player.storage.Metamorphosis_yzs.character.removeArray(links);
			_status.characterlist.addArray(links);
			lib.skill.Metamorphosis_yzs.throwCharacter(player, links)
			game.log(player, "失去了", get.cnNumber(links.length) + "张", "“秘身”");
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
		throwCharacter(player, list) {
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
			player.$throw(cards);
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
		trigger: {
			global: "roundStart",
		},
		async cost(event, trigger, player) {
			event.result = { bool: false };
			let list = player.storage.Metamorphosis_yzs.character
			const result = await player.chooseButtonTarget()
				.set("ai1", function (button) {
					return get.rank(button.link, true) - lib.character[button.link][2];
				})
				.set("ai2", function (target) {
					return Math.random();
				})
				.set("filterTarget", function (card, player, target) {
					if (target.storage.isSub) return false;
					return !target.hasSkill("hidden_yzs") && !lib.skill.Metamorphosis_yzs.bannedName.includes(target.name)
				})
				.set("createDialog", ["你可移去1张【秘身】，将1名人物的角色牌替换为此【秘身】至本轮结束", [list, "character"]])
				.forResult();
			if (result?.bool && result.targets?.length && result.links?.length) {
				event.result = {
					bool: true,
					targets: result.targets,
					cost_data: result.links
				}
			}
		},
		async content(event, trigger, player) {
			let target = event.targets[0];
			let name = event.cost_data[0];
			if (!target || !name) return;
			lib.skill.Metamorphosis_yzs.removeHuashen(player, event.cost_data);
			target.storage.Metamorphosis_yzs_mark = {
				maxHp: target.maxHp,
				name1: target.name1,
			};
			target.markSkill("Metamorphosis_yzs_mark")
			target.playEffectOL(lib.skill.Metamorphosis_yzs.Effect);
			await target.reinitCharacter(target.name1, name);
			if (target.name2) {
				await target.reinitCharacter(target.name2, name);
				target.storage.Metamorphosis_yzs_mark.name2 = target.name2;
			}
			let maxHp = lib.character[name].maxHp;
			if (maxHp) {
				if (maxHp < target.hp) {
					target.storage.Metamorphosis_yzs_mark.exHp = target.hp - maxHp;
				}
				target.maxHp = maxHp;
				target.update();
			}
			target.addSkill("Metamorphosis_yzs_mark")
			target.addTempSkill("Undying_yzs", { global: "roundEnd" });
		},

	},
	MiracleRetail_yzs: {
		group: ["MiracleRetail_yzs_wyc", "MiracleRetail_yzs_draw", "MiracleRetail_yzs_sha", "MiracleRetail_yzs_phaseDraw", "MiracleRetail_yzs_moshu", "MiracleRetail_yzs_moshu1", "MiracleRetail_yzs_moshu3"],
		subSkill: {
			nodraw: {
				forced: true,
				priority: 124,
				trigger: {
					player: "drawBefore"
				},
				filter(event, player) {
					return _status.MiracleRetail_yzs_moshu3 === game.roundNumber;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				}
			},
			moshu1: {
				name: "魔术",
				enable: ["chooseToUse", "chooseToRespond"],
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
				},
				filter(event, player) {
					let cards = player.getExpansions("MiracleRetail_yzs_moshu");
					if (!["phase", "dying"].includes(event.type)) return false;
					if (event.responded) return false;
					cards = cards.filter(card => get.suit(card, false) != "diamond")
					if (event.type !== "phase") cards = cards.filter(card => get.suit(card, false) == "spade")
					return cards.length;
				},
				chooseButton: {
					dialog(event, player) {
						let cards = player.getExpansions("MiracleRetail_yzs_moshu");
						cards = cards.filter(card => get.suit(card, false) != "diamond")
						if (event.type !== "phase") cards = cards.filter(card => get.suit(card, false) == "spade")
						return ui.create.dialog("魔术", cards);
					},
					check(button) {
						return Math.random();
					},
					backup(links, player) {
						const card = links[0];
						if (get.suit(card, false) == "heart") return {
							name: "魔术",
							cards: links,
							filterCard(card) {
								return lib.skill.MiracleRetail_yzs_moshu1_backup.cards.includes(card);
							},
							selectCard: -1,
							position: "x",
							lose: false,
							discard: false,
							async content(event, trigger, player) {
								await player.loseToDiscardpile(event.cards);
								await player.changeHujia(1, "gain")
								lib.skill.Metamorphosis_yzs.addHuashens(player, 1);
								await player.draw(2);
								player.skip("phaseDiscard")
							}
						}
						if (get.suit(card, false) == "spade") return {
							name: "魔术",
							cards: links,
							filterCard(card) {
								return lib.skill.MiracleRetail_yzs_moshu1_backup.cards.includes(card);
							},
							selectCard: -1,
							filterTarget: function (card, player, target) {
								return !target.hasSkill("hidden_yzs")
							},
							selectTarget: [1, Infinity],
							position: "x",
							multitarget: true,
							lose: false,
							discard: false,
							async content(event, trigger, player) {
								await player.loseToDiscardpile(event.cards);
								await player.changeHujia(1, "gain");
								for (let target of event.targets) {
									target.setMark("ciyuanchaoyue_yzs_effect", 1, false);
									target.playEffectOL(lib.skill.ciyuanchaoyue_yzs.Effect);
									await target.addSkill("ciyuanchaoyue_yzs_effect");
								}
							}
						}
						if (get.suit(card, false) == "club") return {
							name: "魔术",
							cards: links,
							filterCard(card) {
								return lib.skill.MiracleRetail_yzs_moshu1_backup.cards.includes(card);
							},
							selectCard: -1,
							filterTarget: function (card, player, target) {
								return !target.hasSkill("hidden_yzs")
							},
							selectTarget: 2,
							multitarget: true,
							lose: false,
							discard: false,
							position: "x",
							async content(event, trigger, player) {
								await player.loseToDiscardpile(event.cards);
								await player.changeHujia(1, "gain")
								await event.targets[0].swapHandcards(event.targets[1]);
								player.addSkill("MiracleRetail_yzs_moshu2");
								player.markAuto("MiracleRetail_yzs_moshu2", event.targets)
							}
						}
					},
					prompt(links, player) {
						const card = links[0];
						if (get.suit(card, false) == "heart") return "摸1张人物牌加入【秘身】，摸2张牌并跳过本回合弃牌阶段"
						if (get.suit(card, false) == "spade") return "将任意名人物送至其一自轮后的次元"
						if (get.suit(card, false) == "club") return "交换2名角色手牌至你下一回合开始"
					},
				},
			},
			moshu2: {
				name: "魔术",
				forced: true,
				charlotte: true,
				priority: -3,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					let targets = player.getStorage("MiracleRetail_yzs_moshu2")
					return targets.every(i => i.isIn())
				},
				async content(event, trigger, player) {
					let targets = player.getStorage("MiracleRetail_yzs_moshu2");
					delete player.storage.MiracleRetail_yzs_moshu2;
					player.removeSkill("MiracleRetail_yzs_moshu2")
					await targets[0].swapHandcards(targets[1]);
				}
			},
			moshu3: {
				name: "魔术",
				priority: 5,
				trigger: {
					global: "roundStart"
				},
				filter(event, player) {
					let cards = player.getExpansions("MiracleRetail_yzs_moshu");
					return cards.some(card => get.suit(card, player) == "diamond")
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = player.getExpansions("MiracleRetail_yzs_moshu");
					cards = cards.filter(card => get.suit(card, player) == "diamond");
					if (!cards.length) return;
					let result = await player.chooseButton([`获得1点护甲，然后令牌堆消失至本轮结束`, cards]).forResult();
					if (result?.bool && result.links?.length) {
						event.result = { bool: true, cost_data: result.links }
					}
				},
				async content(event, trigger, player) {
					await player.loseToDiscardpile(event.cost_data);
					await player.changeHujia(1, "gain")
					game.addGlobalSkill("MiracleRetail_yzs_nodraw")
					game.broadcastAll(() => {
						_status.MiracleRetail_yzs_moshu3 = game.roundNumber;
					})
					game.broadcastAll(() => {
						const Origin_get_cards = get.cards;
						get.cards = function (num, putBack) {
							if (_status.MiracleRetail_yzs_moshu3 === game.roundNumber) {
								return Origin_get_cards.call(this, 1, putBack)
							}
							// 否则调用原始函数
							return Origin_get_cards.call(this, num, putBack);
						};
						const Origin_get_cardPile = get.cardPile;
						get.cardPile = function (pattern, position, start = "top") {
							if (_status.MiracleRetail_yzs_moshu3 === game.roundNumber) {
								if (position === true) {
									return game.createCard(pattern);
								}
								return null
							}
							return Origin_get_cardPile.call(this, pattern, position, start);
						}
					});
					if (!_status.postReconnect.MiracleRetail_yzs_moshu3) {
						_status.postReconnect.MiracleRetail_yzs_moshu3 = [
							function () {
								const Origin_get_cards = get.cards;
								get.cards = function (num, putBack) {
									if (_status.MiracleRetail_yzs_moshu3 === game.roundNumber) {
										return Origin_get_cards.call(this, 1, putBack)
									}
									// 否则调用原始函数
									return Origin_get_cards.call(this, num, putBack);
								};
								const Origin_get_cardPile = get.cardPile;
								get.cardPile = function (pattern, position, start = "top") {
									if (_status.MiracleRetail_yzs_moshu3 === game.roundNumber) {
										if (position === true) {
											return game.createCard(pattern);
										}
										return null
									}
									return Origin_get_cardPile.call(this, pattern, position, start);
								}
							},
							[],
						];
					}
				}
			},
			moshu: {
				marktext: "魔",
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						const cards = player.getExpansions("MiracleRetail_yzs_moshu");
						dialog.addAuto(cards);
					},
				},
				priority: -9,
				forced: true,
				trigger: {
					player: "phaseUseAfter"
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					let cards = player.getExpansions("MiracleRetail_yzs_phaseDraw");
					const history = player.getHistory("useCard", evt => evt.getParent(trigger.name) == trigger);
					const num = history.length;
					cards = cards.filter(card => typeof get.number(card, false) == "number" && get.number(card, false) <= num);
					game.broadcastAll((cards) => {
						for (var i = 0; i < cards.length; i++) {
							cards[i].removeGaintag("MiracleRetail_yzs_phaseDraw");
							cards[i].addGaintag("MiracleRetail_yzs_moshu")
						}
					}, cards)
					player.unmarkSkill("MiracleRetail_yzs_phaseDraw")
					if (player.getExpansions("MiracleRetail_yzs_moshu").length) player.markSkill("MiracleRetail_yzs_moshu")
					await player.loseToDiscardpile(player.getExpansions("MiracleRetail_yzs_phaseDraw"));

				}
			},
			phaseDraw: {
				marktext: "术",
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						const cards = player.getExpansions("MiracleRetail_yzs_phaseDraw");
						dialog.addAuto(cards);
					},
				},
				forced: true,
				priority: 3,
				trigger: {
					player: "phaseDrawBefore",
				},
				async content(event, trigger, player) {
					trigger.cancel();
					let result = await player.draw(4).forResult();
					if (result?.cards?.length && player.countCards("h", card => result.cards.includes(card) && get.suit(card, false) != "none")) {
						let result2 = await player.chooseCard(`扣置其中一张，出牌阶段结束时，若你本阶段使用牌数≥扣置牌点数，你将扣置牌置为【魔术】，否则移去此扣置牌`, true)
							.set("filterCard", (card) => {
								const cards = get.event().cards;
								return cards.includes(card) && get.suit(card, false) != "none";
							})
							.set("cards", result.cards)
							.set("ai", (card) => {
								const number = get.number(card, false);
								if (typeof number != "number") return 0;
								return 13 - number
							})
							.forResult();
						if (result2?.bool && result2.cards?.length) {
							let next = player.addToExpansion(result2.cards, player, "giveAuto");
							next.gaintag.add("MiracleRetail_yzs_phaseDraw");
							await next;
						}
					}
				},
			},
			draw: {
				trigger: {
					player: "drawAfter",
				},
				priority: -2,
				forced: true,
				filter(event, player) {
					return event.result?.cards?.length
				},
				async content(event, trigger, player) {
					let result = await player.chooseToUse("你摸牌后可使用其中一张牌，然后摸1张牌", function (card, player, event) {
						const cards = get.event().cards;
						if (!cards.includes(card)) {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					})
						.set("logSkill", event.name)
						.set("cards", trigger.result.cards || [])
						.forResult()
					if (result?.bool) await player.draw();
				},
			},
			sha: {
				forced: true,
				popup: false,
				priority: -1255123,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					return event.card.name == "sha" && event.addCount !== false;
				},
				async content(event, trigger, player) {
					player.addSkill("MiracleRetail_yzs_shaused")
				},
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha' && player.hasSkill('MiracleRetail_yzs_shaused')) return false;
					},
					cardEnabled(card, player) {
						if (card.name == 'sha' && player.hasSkill('MiracleRetail_yzs_shaused')) return false;
					},
				}
			},
			shaused: {
				forced: true,
				popup: false,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return !event.skill;
				},
				priority: 214,
				async content(event, trigger, player) {
					player.removeSkill("MiracleRetail_yzs_shaused")
				}
			},
		},
		locked: true,
		nobracket: true,
		init: function (player, skill) {
			player.yzs_InitShunfaji("MiracleRetail_yzs");
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation("MiracleRetail_yzs")) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("MiracleRetail_yzs");
		},
		clickableFilter: function (player) {
			let cards = player.getExpansions("MiracleRetail_yzs_moshu");
			cards = cards.filter(card => get.suit(card, false) == "spade")
			if (!cards.length) {
				return false;
			}
			if (!game.hasPlayer(function (target) {
				return !target.hasSkill("hidden_yzs")
			})) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let cards = player.getExpansions("MiracleRetail_yzs_moshu");
			cards = cards.filter(card => get.suit(card, false) == "spade")
			if (!cards.length) return;
			let result = await player.chooseButtonTarget()
				.set("ai1", function (button) {
					return Math.random();
				})
				.set("ai2", function (target) {
					return Math.random();
				})
				.set("filterTarget", function (card, player, target) {
					return !target.hasSkill("hidden_yzs")
				})
				.set("createDialog", ["将任意名人物送至其一自轮后的次元", cards])
				.forResult()
			if (result?.bool && result.links?.length && result.targets?.length) {
				let next = player.useSkill("MiracleRetail_yzs_wyc")
				next.targets = target.targets;
				next.cards = result.links;
				await next;
			}
		},
		multitarget: true,
	},
	MiracleRetail_yzs_wyc: {
		locked: true,
		async content(event, trigger, player) {
			await player.loseToDiscardpile(event.cards);
			await player.changeHujia(1, "gain");
			for (let target of event.targets) {
				targete.setMark("ciyuanchaoyue_yzs_effect", 1, false);
				target.playEffectOL(lib.skill.ciyuanchaoyue_yzs.Effect);
				await target.addSkill("ciyuanchaoyue_yzs_effect");
			}
		}
	},
	//陈序
	jinling_yzs: {
		group: ["jinling_yzs_gain", "jinling_yzs_use", "jinling_yzs_damage", "jinling_yzs_phaseEnd"],
		subSkill: {
			mark: {
				charlotte: true,
				onremove: true,
			},
			skip: {
				name: "禁令",
				charlotte: true,
				onremove: true,
				priority: 14,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.getStorage("jinling_yzs_skip").length;
				},
				forced: true,
				async content(event, trigger, player) {
					const list = player.getStorage("jinling_yzs_skip");
					for (let phase of list) {
						player.skip(phase);
						game.log(player, "跳过了", phase)
					}
					player.removeSkill(event.name);
				},
			},
			phaseEnd: {
				audio: "jinling_yzs_use",
				name: "禁令",
				priority: -4,
				trigger: {
					global: "phaseUseEnd"
				},
				filter(event, player) {
					if (event.player != _status.currentPhase) return false;
					if (!event.player.isIn()) return false;
					if (player.hasHistory("useCard", function (evt) {
						return evt.getParent("phaseUse") == event;
					})) return false;
					if (event.player.hasSkill("hidden_yzs")) return false;
					return player.countExpansions("jinling_yzs") > 0;
				},
				logTarget: `player`,
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = player.getExpansions("jinling_yzs");
					let result = await player.chooseButton(["禁令", cards], false)
						.set("filterButton", function (button) {
							if (get.type(button.link, false) == "equip" || get.number(button.link, false) == 9) {
								return false;
							}
							return false;
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult();
					if (result?.bool && result.links?.length) {
						event.result = { bool: true, cost_data: result.links }
					}
				},
				async content(event, trigger, player) {
					const target = trigger.player;
					let cards = event.cost_data;
					await player.loseToDiscardpile(cards);
					await player.draw(2);
					const phasename = lib.phaseName,
						isPhase = name => phasename.includes(name.split("|")[0]);
					const list = trigger.phaseList.map((name, index) => [index, "", name.split("|")[0]]);
					if (list?.some(info => isPhase(info[2]) && !target.getStorage("jinling_yzs_skip").includes(info[2]))) {
						const result = await player
							.chooseButton(
								[
									`禁令：跳过${get.translation(target)}下回合任意一个阶段`,
									[
										list.filter(info => {
											return isPhase(info[2]) && !target.getStorage("jinling_yzs_skip").includes(info[2]);
										}),
										(item, type, position, noclick, node) => {
											let showCard = [item[0], item[1], `lusu_${item[2]}`];
											node = ui.create.buttonPresets.vcard(showCard, type, position, noclick);
											node.node.info.innerHTML = `<span style = "color:#ffffff">${item[0]}</span>`;
											node.node.info.style["font-size"] = "20px";
											node._link = node.link = item;
											node._customintro = uiintro => {
												uiintro.add(get.translation(node._link[2]));
												uiintro.addText(`此阶段为下回合第${get.cnNumber(node._link[0], true)}个阶段`);
												return uiintro;
											};
											return node;
										},
									],
								],
								true
							)
							.set("forced", true)
							.forResult();
						let choice = result?.links[0];
						if (choice) {
							target.addSkill("jinling_yzs_skip")
							target.markAuto("jinling_yzs_skip")
						}
					}
					let result = await player.chooseCard("你可将1张手牌扣置为【禁令】，本阶段结束后你获得【禁令】").forResult();
					if (result?.bool && result.cards?.length) {
						let next = player.addToExpansion(result.cards, player, "giveAuto");
						next.gaintag.add("jinling_yzs");
						await next;
						if (_status.currentPhase?.isIn()) {
							_status.currentPhase.addTempSkill("jinling_yzs_mark", { player: "phaseUseAfter" })
							_status.currentPhase.setMark("jinling_yzs_mark", 1, false);
						}
					}
				},
			},
			damage: {
				audio: "jinling_yzs_use",
				name: "禁令",
				priority: -3,
				trigger: {
					player: "damageBegin1"
				},
				filter(event, player) {
					if (event.source != _status.currentPhase) return false;
					if (!event.source.isIn()) return false;
					if (event.source.hasSkill("hidden_yzs")) return false;
					return player.countExpansions("jinling_yzs") > 0;
				},
				logTarget: `source`,
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = player.getExpansions("jinling_yzs");
					let result = await player.chooseButton(["禁令", cards], false)
						.set("filterButton", function (button) {
							if (get.type(button.link, false) == "equip" || get.number(button.link, false) == 9) {
								return false;
							}
							return false;
						})
						.set("ai", (button) => {
							return 2;
						})
						.forResult();
					if (result?.bool && result.links?.length) {
						event.result = { bool: true, cost_data: result.links }
					}
				},
				async content(event, trigger, player) {
					const target = trigger.source;
					let cards = event.cost_data;
					await player.loseToDiscardpile(cards);
					await player.draw(2);
					const phasename = lib.phaseName,
						isPhase = name => phasename.includes(name.split("|")[0]);
					const list = trigger.phaseList.map((name, index) => [index, "", name.split("|")[0]]);
					if (list?.some(info => isPhase(info[2]) && !target.getStorage("jinling_yzs_skip").includes(info[2]))) {
						const result = await player
							.chooseButton(
								[
									`禁令：跳过${get.translation(target)}下回合任意一个阶段`,
									[
										list.filter(info => {
											return isPhase(info[2]) && !target.getStorage("jinling_yzs_skip").includes(info[2]);
										}),
										(item, type, position, noclick, node) => {
											let showCard = [item[0], item[1], `lusu_${item[2]}`];
											node = ui.create.buttonPresets.vcard(showCard, type, position, noclick);
											node.node.info.innerHTML = `<span style = "color:#ffffff">${item[0]}</span>`;
											node.node.info.style["font-size"] = "20px";
											node._link = node.link = item;
											node._customintro = uiintro => {
												uiintro.add(get.translation(node._link[2]));
												uiintro.addText(`此阶段为下回合第${get.cnNumber(node._link[0], true)}个阶段`);
												return uiintro;
											};
											return node;
										},
									],
								],
								true
							)
							.set("forced", true)
							.forResult();
						let choice = result?.links[0];
						if (choice) {
							target.addSkill("jinling_yzs_skip")
							target.markAuto("jinling_yzs_skip")
						}
					}
					let result = await player.chooseCard("你可将1张手牌扣置为【禁令】，本阶段结束后你获得【禁令】").forResult();
					if (result?.bool && result.cards?.length) {
						let next = player.addToExpansion(result.cards, player, "giveAuto");
						next.gaintag.add("jinling_yzs");
						await next;
						if (_status.currentPhase?.isIn()) {
							_status.currentPhase.addTempSkill("jinling_yzs_mark", { player: "phaseUseAfter" })
							_status.currentPhase.setMark("jinling_yzs_mark", 1, false);
						}
					}
				},
			},
			use: {
				name: "禁令",
				priority: -6,
				audio: "ext:一中杀/audio/skill:2",
				trigger: {
					global: "useCard"
				},
				filter(event, player) {
					if (event.player != _status.currentPhase) return false;
					if (!event.player.countMark("jinling_yzs_mark")) return false;
					event.player.clearMark("jinling_yzs_mark", false);
					if (!event.player.isIn()) return false;
					if (event.player.hasSkill("hidden_yzs")) return false;
					return player.countExpansions("jinling_yzs") > 0;
				},
				logTarget: `player`,
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = player.getExpansions("jinling_yzs");
					let result = await player.chooseButton(["禁令", cards], false)
						.set("filterButton", function (button) {
							const card = get.event().card;
							if (get.color(button.link) == "black") {
								return get.is.damageCard(card, true)
							} else if (get.color(button.link) == "red") {
								return !get.is.damageCard(card, true)
							}
							return false;
						})
						.set("target", trigger.player)
						.set("card", trigger.card)
						.set("ai", (button) => {
							const player = get.event().player;
							const target = get.event().target;
							return -get.attitude(player, target);
						})
						.forResult();
					if (result?.bool && result.links?.length) {
						event.result = { bool: true, cost_data: result.links }
					}
				},
				async content(event, trigger, player) {
					let cards = event.cost_data;
					await player.loseToDiscardpile(cards);
					await player.draw(2);
					trigger.targets.length = 0;
					trigger.all_excluded = true;
					game.log(trigger.card, "被无效了");
					let result = await player.chooseCard("你可将1张手牌扣置为【禁令】，本阶段结束后你获得【禁令】").forResult();
					if (result?.bool && result.cards?.length) {
						let next = player.addToExpansion(result.cards, player, "giveAuto");
						next.gaintag.add("jinling_yzs");
						await next;
						if (_status.currentPhase?.isIn()) {
							_status.currentPhase.addTempSkill("jinling_yzs_mark", { player: "phaseUseAfter" })
							_status.currentPhase.setMark("jinling_yzs_mark", 1, false);
						}
					}
				},
			},
			gain: {
				audio: "jinling_yzs",
				forced: true,
				priority: -4,
				trigger: {
					global: "phaseUseAfter"
				},
				filter(event, player) {
					return player.countExpansions("jinling_yzs") > 0;
				},
				async content(event, trigger, player) {
					await player.gain(player.getExpansions("jinling_yzs"), "giveAuto");
				}
			},
		},
		marktext: "禁",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("jinling_yzs");
				if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【禁令】";
			},
		},
		locked: true,
		priority: -9,
		audio: "ext:一中杀/audio/skill:2",
		trigger: {
			global: "phaseUseBegin"
		},
		filter(event, player) {
			return event.player != player && player.countCards("h") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard("你可将1张手牌扣置为【禁令】，本阶段结束后你获得【禁令】").forResult();
		},
		async content(event, trigger, player) {
			let next = player.addToExpansion(event.cards, player, "giveAuto");
			next.gaintag.add("jinling_yzs");
			await next;
			if (_status.currentPhase?.isIn()) {
				_status.currentPhase.addTempSkill("jinling_yzs_mark", { player: "phaseUseAfter" })
				_status.currentPhase.setMark("jinling_yzs_mark", 1, false);
			}
		},
	},
	shouxu_yzs: {
		group: ["shouxu_yzs_use", "shouxu_yzs_respond"],
		subSkill: {
			use: {
				audio: "jinling_yzs_use",
				priority: 1,
				trigger: {
					global: "useCard"
				},
				filter(event, player) {
					let cards = event.player.getExpansions("shouxu_yzs");
					cards = cards.filter(card => card.name == event.card.name);
					return cards.length
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = trigger.player.getExpansions("shouxu_yzs");
					let result = await player.chooseButton([`你可移去1张牌名为 ${get.translation(trigger.card)} 的【序】以无效之`, cards])
						.set("filterButton", (button) => {
							return get.name(button.link, false) == get.event().cardname;
						})
						.set("ai", button => {
							const player = get.event().player;
							const target = get.event().target;
							return -get.attitude(player, target);
						})
						.set("target", trigger.player)
						.set("cardname", trigger.card.name)
						.forResult()
					if (result?.bool && result.links?.length) {
						event.result = { bool: true, cost_data: result.links }
					}
				},
				async content(event, trigger, player) {
					await trigger.player.loseToDiscardpile(event.cost_data);
					trigger.targets.length = 0;
					trigger.all_excluded = true;
					game.log(trigger.card, "被无效了");
				},
			},
			respond: {
				audio: "jinling_yzs_use",
				priority: 1,
				trigger: {
					global: "respond"
				},
				filter(event, player) {
					let cards = event.player.getExpansions("shouxu_yzs");
					cards = cards.filter(card => card.name == event.card.name);
					return cards.length
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					let cards = trigger.player.getExpansions("shouxu_yzs");
					let result = await player.chooseButton([`你可移去1张牌名为 ${get.translation(trigger.card)} 的【序】以无效之`, cards])
						.set("filterButton", (button) => {
							return get.name(button.link, false) == get.event().cardname;
						})
						.set("ai", button => {
							const player = get.player;
							const target = get.event().target;
							return -get.attitude(player, target);
						})
						.set("target", trigger.player)
						.set("cardname", trigger.card.name)
						.forResult()
					if (result?.bool && result.links?.length) {
						event.result = { bool: true, cost_data: result.links }
					}
				},
				async content(event, trigger, player) {
					await trigger.player.loseToDiscardpile(event.cost_data);
					trigger.cancel();
					let evt = trigger.getParent();
					if (evt.name == "chooseToRespond") {
						evt.result.bool = false;
					}
				},
			},
		},
		locked: true,
		priority: 2,
		marktext: "序",
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("shouxu_yzs");
				if (game.me.hasSkill("shouxu_yzs") && cards.length) dialog.addAuto(cards);
				else return "共有" + get.cnNumber(cards.length) + "张【序】";
			},
		},
		audio: "jinling_yzs",
		trigger: {
			player: "phaseUseBegin"
		},
		filter(event, player) {
			return player.countCards("h") > 0 && game.hasPlayer(cur => !cur.hasSkill("hidden_yzs") && cur.countExpansions("shouxu_yzs") < 3);
		},
		async cost(event, trigger, player) {
			event.result = { bool: false };
			let selectedCards = [];
			let given_map = {};
			while (player.countCards("h", card => !selectedCards.includes(card)) && selectedCards.length < 2) {
				let result = await player.chooseCardTarget()
					.set("prompt", `你可将至多${2 - selectedCards.length}张手牌扣置为任意角色的【序】（每名角色至多3张）并结束本阶段`)
					.set("filterTarget", (card, player, target) => {
						return !target.hasSkill("hidden_yzs") && target.countExpansions("shouxu_yzs") < 3
					})
					.set("filterCard", (card) => {
						return !get.event().selectedCards.includes(card);
					})
					.set("selectCard", [1, 2 - selectedCards.length])
					.set("selectedCards", selectedCards)
					.forResult();
				if (result?.bool && result.cards?.length && result.targets?.length) {
					selectedCards.addArray(result.cards);
					const target = result.targets[0];
					const id = target.playerid
					if (!given_map[id]) {
						given_map[id] = [];
					}
					given_map[id].addArray(result.cards)
				} else {
					break;
				}
			}
			if (selectedCards.length) event.result = { bool: true, cost_data: given_map }
		},
		async content(event, trigger, player) {
			const given_map = event.cost_data;
			for (const i in given_map) {
				const target = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
				player.line(target, "green");
				let next = target.addToExpansion(given_map[i], player, "giveAuto");
				next.gaintag.add("shouxu_yzs");
				await next;
			}
			trigger.cancel();
		},
	},
	xuanpan_yzs: {
		group: ["xuanpan_yzs_limited", "xuanpan_yzs_lose", "xuanpan_yzs_mark"],
		subSkill: {
			mark: {
				charlotte: true,
				onremove: true,
			},
			lose: {
				priority: 2,
				forced: true,
				popup: false,
				trigger: {
					global: ["loseToDiscardpileBegin"]
				},
				filter(event, player) {
					const evt = event.getParent();
					if (player != evt.player) return false;
					return event.cards.some(card => card.hasGaintag("shouxu_yzs") || card.hasGaintag("jinling_yzs"))
				},
				async content(event, trigger, player) {
					player.addTempSkill("xuanpan_yzs_mark");
					player.addMark("xuanpan_yzs_mark", 1, false);
					if (player.countMark("xuanpan_yzs_mark") % 3 == 0) trigger.xuanpan_yzs = true;
				}
			},
		},
		locked: true,
		limited: true,
		skillAnimation: false,
		init: function (player, skill) {
			player.yzs_InitShunfaji("xuanpan_yzs");
		},
		onremove(player, skill) {
			if (player.node.yzs_shunfajiButtons) {
				player.node.yzs_shunfajiButtons.forEach(btn => { if (btn.innerHTML == get.translation("xuanpan_yzs")) btn.delete() });
			}
		},
		clickable: function (player) {
			player.yzs_UseShunfaji("xuanpan_yzs");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickableFilter: function (player) {
			if (player.awakenedSkills.includes("xuanpan_yzs_limited")) return false;
			return player.countCards("h") && game.hasPlayer(cur => cur.countExpansions("shouxu_yzs"))
		},
		clickableContent: async function (event, trigger, player) {
			if (!(player.countCards("h") && game.hasPlayer(cur => cur.countExpansions("shouxu_yzs")))) return;
			let result = await player.chooseTarget(`是否发动【宣判】?<br>你用1张手牌交换【序】`)
				.set("filterTarget", function (card, player, target) {
					return !target.hasSkill("hidden_yzs") && target.countExpansions("shouxu_yzs")
				})
				.forResult();
			if (result?.bool && result.targets?.length) {
				let next = player.useSkill("xuanpan_yzs_limited");
				next.targets = result.targets;
				await next;
			}
		},
		audio: "jinling_yzs",
		priority: 2,
		forced: true,
		trigger: {
			global: ["loseToDiscardpile"]
		},
		filter(event, player) {
			return event.xuanpan_yzs
		},
		async content(event, trigger, player) {
			player.restoreSkill("xuanpan_yzs_limited");
			if (_status.currentPhase?.isIn()) await _status.currentPhase.damage();
			await player.recover();
		}
	},
	xuanpan_yzs_limited: {
		audio: "jinling_yzs",
		enable: ["chooseToUse", "chooseToRespond"],
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs") && target.countExpansions("shouxu_yzs")
		},
		filter(event, player) {
			if (player.awakenedSkills.includes("xuanpan_yzs_limited")) return false;
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return true
		},
		async content(event, trigger, player) {
			player.awakenSkill("xuanpan_yzs_limited");
			let target = event.target;
			let dialog = [];
			function filterButton(button, player) {
				if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
				if (ui.selected.buttons[0].link.hasGaintag("shouxu_yzs")) {
					return !button.link.hasGaintag("shouxu_yzs")
				} else {
					return button.link.hasGaintag("shouxu_yzs")
				}
				return false;
			}

			function processAI(button) {
				if (button.link.hasGaintag("shouxu_yzs")) {
					return get.value(button.link)
				} else {
					return 6 - get.value(button.link)
				}
			}

			if (target.getExpansions("shouxu_yzs").length > 0) {
				dialog.push(`${get.translation(target)}的【序】`);
				dialog.push(target.getExpansions("shouxu_yzs"))
			}
			if (player.getCards("h").length > 0) {
				dialog.push(`你的手牌`);
				dialog.push(player.getCards("h"))
			}
			if (dialog.length < 4) {
				return;
			}
			let next = player.chooseButton(2, dialog);
			next.set("target", target);
			next.set("forced", false);
			next.set("filterButton", filterButton);
			next.set("complexSelect", true);
			next.set("ai", processAI);
			let result = await next.forResult();
			if (result?.bool && result.links?.length) {
				const pushs = result.links.filter(card => !card.hasGaintag("shouxu_yzs"));
				const gains = result.links.filter(card => card.hasGaintag("shouxu_yzs"))
				let next = target.addToExpansion(pushs, player, "giveAuto")
				next.gaintag.add("shouxu_yzs");
				await next;
				await player.gain(gains, "giveAuto");
			}
			const evt = event.getParent(2);
			if (evt.name == "chooseToUse") {
				evt.goto(0);
				delete evt.openskilldialog;
			}
		},
	},
	//芙兰朵露
	sichong_yzs: {
		locked: true,
		forced: true,
		priority: -4,
		intro: {
			content: "记录过的花色：$",
		},
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (event.card.name != "sha") return false;
			return ["club", "spade", "diamond", "heart"].includes(get.suit(event.card));
		},
		async content(event, trigger, player) {
			//game.log(trigger.target)
			//	player.$moveImageTo(trigger.target, 1000, lib.assetURL + `/extension/阴阳师杀/Yuhun/xinfan_yuxinyan.png`,)
			if (!player.getStorage("sichong_yzs").includes(get.suit(trigger.card))) {
				player.markAuto("sichong_yzs", get.suit(trigger.card))
			} else {
				const x = player.getStorage("sichong_yzs").length
				player.storage.sichong_yzs = [];
				player.markSkill("sichong_yzs");
				player.unmarkSkill("sichong_yzs");
				if (x <= 0) return;
				player.addMark("Fuka_yzs");
				await player.recoverTo(x);
				await player.draw(x);
			}
		}
	},
	Laevatein_yzs: {
		group: ["Laevatein_yzs_use"],
		subSkill: {
			use: {
				priority: 5,
				direct: true,
				popup: false,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					if (event.addCount === false) return false;
					return player.hasHistory("lose", evt => {
						return (evt.relatedEvent || evt.getParent()) == event && evt.hs.length && Object.values(evt.gaintag_map).flat().includes("visible_Laevatein_yzs");
					})
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
			},
		},
		nobracket: true,
		direct: true,
		trigger: {
			global: "discard"
		},
		filter(event, player) {
			let evt = event.getParent(2);
			let cards = event.cards
			//	game.log(evt.player, event.cards, cards);
			if (evt?.player == player && (evt?.name == "phaseDiscard" || evt?.name == "pohuai_yzs")) {
				return (cards.some(card => get.name(card, false) == "sha"));
			}
			return false;
		},
		async content(event, trigger, player) {
			let cards = trigger.cards
			cards = cards.filter(card => get.name(card, false) == "sha");
			await player.gain(cards, "gain2");
			const next = game.createEvent("faceUpCard");
			next.player = player;
			next.cards = cards;
			next.skill = "Laevatein_yzs";
			next.setContent(async (event, trigger, player) => {
				const { cards } = event;
				game.log(player, "明置了", cards);
				game.addCardKnower(
					cards,
					game.filterPlayer(() => true)
				);
				game.broadcastAll(cards => {
					cards.forEach(card => card.addGaintag("visible_Laevatein_yzs"));
				}, cards);
			});
		},
		mod: {
			cardname(card, player) {
				if (card.hasGaintag("visible_Laevatein_yzs")) {
					return "sha"
				}
			},
			cardnature(card, player) {
				if (card.hasGaintag("visible_Laevatein_yzs")) {
					return "fire"
				}
			},
			aiOrder(card, player, num) {
				if (card.cards?.some?.(c => c.hasGaintag("visible_Laevatein_yzs"))) {
					return num + 4;
				}
			},
			aiValue(player, card, num) {
				if (card.cards?.some?.(c => c.hasGaintag("visible_Laevatein_yzs"))) {
					return num + 4;
				}
			},
			aiUseful(player, card, num) {
				if (card.cards?.some?.(c => c.hasGaintag("visible_Laevatein_yzs"))) {
					return num + 4;
				}
			},
			targetInRange: function (card) {
				if (card.cards?.some?.(c => c.hasGaintag("visible_Laevatein_yzs"))) {
					return true;
				}
			},
			cardUsable: function (card, num) {
				if (card.cards?.some?.(c => c.hasGaintag("visible_Laevatein_yzs"))) {
					return Infinity;
				}
			},
		},
	},
	pohuai_yzs: {
		enable: "phaseUse",
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			return game.hasPlayer(function (target) {
				return lib.skill.pohuai_yzs.filterTarget(null, player, target)
			})
		},
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs")
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			if (event.target.countDiscardableCards(player, "hej") < 2) {
				await event.target.damage();
				await event.target.draw(2);
			} else {
				await player.discardPlayerCard(event.target, 2, "hej", (button) => {
					if (get.name(button, false) == "sha") return 10;
					return get.value(button);
				})
			}
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					if (player == target) {
						if (player.countDiscardableCards(player, "hej") < 2) {
							return player.getStorage("sichong_yzs").length - player.hp;
						}
						return 1.7 * player.countCards("h", card => get.name(card) == "sha" && !card.hasGaintag("visible_Laevatein_yzs")) - 3;
					} else {
						if (target.countDiscardableCards(player, "hej") < 2) {
							return get.damageEffect(target, player, target) + get.effect(target, { name: "wuzhong" }, player, target);
						}
						return 2 * get.effect(target, { name: "guohe" }, player, target);
					}
				},
			},
			expose: 0.3,
			threaten: 1.2,
		},
	},
	//伏黑惠
	shizhongying_yzs: {
		group: ["shizhongying_yzs_ying", "shizhongying_yzs_use"],
		subSkill: {
			ying: {
				priority: -3,
				trigger: {
					player: "useCard"
				},
				forced: true,
				filter(event, player) {
					return event.cards.some(card => get.name(card, false) == "ying")
				},
				async content(event, trigger, player) {
					await player.draw();
				}
			},
			use: {
				audio: "ext:一中杀/audio/skill:5",
				locked: true,
				hiddenCard(player, name) {
					var list = player.getStorage("shizhongying_yzs").slice(0);
					return list.some(i => i[1] == name) && player.countCards("h");
				},
				enable: ["chooseToUse"],
				filter(event, player) {
					var list = player.getStorage("shizhongying_yzs").slice(0);
					if (!list.length) {
						return false;
					}
					if (!player.countCards("h")) {
						return false;
					}
					for (var i of list) {
						if (event.filterCard(get.autoViewAs({ name: i[1], number: i[0], isCard: false }, "unsure"), player, event)) {
							if (player.hasCards("h", card => get.number(card, player) == i[0])) return true;
						}
					}
					return false;
				},
				chooseButton: {
					dialog(event, player) {
						var list = player.getStorage("shizhongying_yzs").slice(0);
						var list2 = [];
						for (var i of list) {
							var type = get.type2(i[1], false);
							if (event.filterCard(get.autoViewAs({ name: i[1], number: i[0], isCard: false, }, "unsure"), player, event)) {
								if (player.hasCards("h", card => get.number(card, player) == i[0]) && !list2.some(c => c[2] == i[1])) list2.push([type, "", i[1]]);
							}
						}
						return ui.create.dialog("十种影", [list2, "vcard"]);
					},
					check(button) {
						if (_status.event.getParent().type != "phase") {
							return 1;
						}
						return _status.event.player.getUseValue({ name: button.link[2], isCard: false, }, null, true);
					},
					backup(links, player) {
						return {
							audio: links[0][2] == "moxuluo_yzs" ? "ext:一中杀/audio/skill:1" : "shizhongying_yzs_use",
							filterCard(card) {
								const player = get.player();
								var storage = player.getStorage("shizhongying_yzs").slice(0);
								let list = [];
								storage.forEach(function (item, index) {
									if (item[1] == links[0][2]) list.push(item[0])
								})
								return list.includes(get.number(card, player));
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
						};
					},
					prompt(links, player) {
						return "将1张手牌当做【" + get.translation(links[0][2]) + "】使用";
					},
				},
				ai: {
					save: true,
					respondShan: true,
					skillTagFilter(player, tag, arg) {
						if (!player.countCards("h") || player.isTempBanned("shizhongying_yzs")) {
							return false;
						}
						if (tag == "respondShan") {
							if (arg == "respond") {
								return false;
							}
							return player.getStorage("shizhongying_yzs").some(i => i[1] == "shan");
						}
						return player.getStorage("shizhongying_yzs").some(i => i[1] == "tao") || (player.getStorage("shizhongying_yzs").some(i => i[1] == "jiu") && arg == player);
					},
					order: 4,
					result: {
						player: 1,
					},
					threaten: 1.9,
				},
			},
		},
		marktext: "影",
		intro: {
			markcount(storage) {
				return storage.length;
			},
			mark(dialog, content, player) {
				const storage = player.getStorage("shizhongying_yzs").sort(function (a, b) {
					return a[0] - b[0];
				});
				if (storage.length) {
					dialog.addText("当前记录的点数和牌名：");
					storage.forEach(function (item, index) {
						dialog.addText(item[0] + "=>" + get.translation(item[1]));
					})
				}
			},
		},
		nobracket: true,
		locked: true,
		priority: -4,
		trigger: {
			player: "useCardAfter"
		},
		filter(event, player) {
			if (!player.countCards("h")) return false;
			return !get.is.convertedCard(event.card) && (get.type(event.card) == "basic" || get.type(event.card) == "trick")
		},
		async cost(event, trigger, player) {
			const storage = player.getStorage("shizhongying_yzs").sort(function (a, b) {
				return a[0] - b[0];
			});
			let str = ``;
			if (storage.length) {
				str += `当前已经记录过：`;
				storage.forEach(function (item, index) {
					str += item[0] + " ";
				})
			}
			event.result = await player.chooseCard("h", `你可重铸1张手牌，若之点数为数字且你未记录过，你记录之，此后你可将此点数的牌当做此即时牌使用。<br>${str}`)
				.set("ai", (card) => {
					const player = get.player();
					const storage = player.getStorage("shizhongying_yzs");
					const v = get.value(card, player);
					const number = get.number(card, player)
					if (!storage.some(i => i[0] == number) && number > 1 && number < 11) {
						return v + 2;
					}
					return v - 5;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			await player.recast(event.cards);
			const number = get.number(event.cards[0], player);
			const storage = player.getStorage("shizhongying_yzs");
			if (!storage.some(i => i[0] == number) && number > 1 && number < 11) {
				player.markAuto("shizhongying_yzs", [[number, get.name(trigger.card, false)]])
				game.log(player, "记录了", number, get.name(trigger.card, false))
				//	await player.draw();
			}
		}
	},
	zongying_yzs: {
		locked: true,
		getYing(count) {
			var cards = [];
			if (typeof count != "number") {
				count = 1;
			}
			while (count--) {
				let card = game.createCard("ying", "spade", Math.ceil(13 * Math.random()));
				cards.push(card);
			}
			return cards;
		},
		priority: 1,
		trigger: {
			player: "phaseJieshuBegin"
		},
		direct: true,
		async content(event, trigger, player) {
			await player.gain(lib.skill.zongying_yzs.getYing(2), "gain2");
			await player.chooseToUse("你可以使用一张牌",).set("logSkill", event.name);
		}
	},
	qianheanyiting_yzs: {
		group: ["qianheanyiting_yzs_fight"],
		subSkill: {
			fight: {
				trigger: {
					global: "yzs_ExpandDomainBegin",
				},
				priority: 98,
				filter(event, player) {
					if (event.player == player) return false;
					if (event.ExpandPlayerList?.includes(player)) return false;
					return _status._yzsDomainPlayer != player && player.countCards("h") > 0;
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseToDiscard(`${get.translation(trigger.player)}展开了${trigger.num}个回合的领域${get.translation(trigger.domain)}，是否进行“领域对拼”？`, "h", [1, Infinity])
						.set("chooseonly", true)
						.set("target", trigger.player)
						.set("ai", card => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.attitude(player, target) > 0) return 0;
							else return 8 - get.value(card);
						})
						.set("allowChooseAll", true)
						.forResult()
				},
				async content(event, trigger, player) {
					await player.discard(event.cards);
					player.tempBanSkill("qianheanyiting_yzs", { global: "roundStart" })
					const animation = () => {

					};
					trigger.addExpandPlayer(player, "qianheanyiting_yzs", "thunder", event.cards.length, animation)
				},
				sub: true,
				sourceSkill: "qianheanyiting_yzs",
			},
		},
		nobracket: true,
		limited: true,
		skillAnimation: false,
		locked: true,
		nobracket: true,
		enable: "phaseUse",
		domain: true,
		position: "h",
		filterCard: true,
		selectCard: [1, Infinity],
		allowChooseAll: true,
		prompt: `${get.poptip("lingyuzhankai_yzs")}：每回合结束时，你发动${get.poptip("zongying_yzs")}`,
		check(card) {
			let player = _status.event.player;
			return player.getStorage("shizhongying_yzs").length - player.hp - get.value(card, player) / 2;
		},
		filter(event, player) {
			return _status._yzsDomainPlayer != player && player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.tempBanSkill(event.name, { global: "roundStart" })
			const animation = () => {
				var video = document.createElement("VIDEO");
				video.className = "anime";

				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/qianheanyiting_yzs.MP4",
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
				//if (_status.tempMusic == `ext:一中杀/audio/Malevolent Shrine.mp3`) return;
				// 1. 设置音频路径
				_status.tempMusic = `ext:一中杀/audio/qianheanyiting_yzs.mp3`;

				// 2. 调用播放逻辑
				game.playBackgroundMusic();
				ui.backgroundMusic.addEventListener('ended', () => {
					delete _status.tempMusic;
					game.playBackgroundMusic();
				}, { once: true });

			}
			let result = await player.yzs_ExpandDomain(event.name, "thunder", event.cards.length, animation).forResult();
		},
		ai: {
			order(item, player) {
				if (player.countCards("h", card => player.getStorage("shizhongying_yzs").length - player.hp - get.value(card, player) / 2) > 3) return 10;
				return 0;
			},
			result: {
				player: 1,
			},
			threaten: 1.5,
		},
	},
	qianheanyiting_yzs_skill: {
		locked: true,
		popup: false,
		domainskill: true,
		forced: true,
		trigger: {
			player: ["phaseEnd"],
		},
		filter(event, player) {
			//		if (player.hasSkill("SimpleDomain_yzs_buff")) return false;
			return get.itemtype(_status._yzsDomainPlayer) == "player"
		},
		async content(event, trigger, player) {
			await _status._yzsDomainPlayer.useSkill("zongying_yzs")
		},
		priority: -25,
	},
	tiaofuyishi_yzs: {
		subSkill: {
			kill: {
				charlotte: true,
				trigger: {
					global: "die"
				},
				filter(event, player) {
					return event.player == player.getStorage("tiaofuyishi_yzs_kill") && event.source == player;
				},
				priority: 23,
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					player.markAuto("shizhongying_yzs", [[1, "moxuluo_yzs"]])
				}
			}
		},
		//	audio: "ext:一中杀/audio/skill:1",
		nobracket: true,
		limited: true,
		skillAnimation: false,
		enable: "phaseUse",
		filter(event, player) {
			return game.hasPlayer(function (target) {
				return lib.skill.tiaofuyishi_yzs.filterTarget(null, player, target)
			})
		},
		filterTarget: function (card, player, target) {
			return player == target;
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.addSkill("tiaofuyishi_yzs_kill")

			game.log(player, '开启了“魔虚罗”的调伏仪式');
			game.broadcastAll(() => {
				game.playAudio("ext:一中杀/audio/skill/tiaofuyishi_yzs1.MP3");
			});
			player.$fullscreenpop("布瑠部", "thunder")
			await new Promise(r => setTimeout(r, 1300))
			player.$fullscreenpop("由良由良", "thunder")
			await new Promise(r => setTimeout(r, 1800))
			game.broadcastAll(() => {
				ui.background.style.transition = 'none';
				ui.background.style.filter = 'brightness(0.3)';
				ui.backgroundMusic.pause();
				game.playAudio("ext:一中杀/audio/skill/tiaofuyishi_yzs2.MP3");
			});
			await new Promise(r => setTimeout(r, 6000))

			const result = {};
			event.result = result;
			const animate = false;
			const newPlayer = await game.addPlayerOL(player, ...["Makora_yzs", null], true, { source: player, animate });
			result.target = newPlayer;
			player.setStorage("tiaofuyishi_yzs_kill", newPlayer)
			newPlayer.addSkill("yzs_dieRemove");
			newPlayer.dieAfter = function () { }
			newPlayer.dieAfter2 = function () { }
			newPlayer.storage.isSub = true;
			newPlayer._start_cards = [];
			game.broadcastAll((player, target, source, sourceSkill, identity, noCheckResult) => {
				target._sourceSkill = sourceSkill;
				target.identity = "neutral";
				if (!lib.translate[identity]) {
					lib.translate[identity] = "野";
				}
				target.setIdentity();
				if (get.mode() == 'guozhan') {
					if (target.name2 == undefined) target.name2 = target.name1;
				}
				if (source?.side || (game.me && game.me.side) || get.mode() == 'versus') {
					target.side = "neutral";
					target.node.identity.firstChild.innerHTML = "中";
					target.node.identity.dataset.color = "white";
				}
				target.skillH = [];
				target.storage.zhibi = [];
				target.storage.stratagem_expose = [];
				target.storage.stratagem_fury = 0;
				if (typeof source.ai?.shown === "number" && target.ai) {
					target.ai.shown = source.ai.shown;
				}
				target._noCheckResult = true;
				if (_status.yzs_addPlayerOL) {
					return;
				}
				_status.yzs_addPlayerOL = true;
				//检测游戏胜负
				if (typeof game.checkResult === "function") {
					const origin_checkResult = game.checkResult;
					game.checkResult = function () {
						const player = game.me._trueMe || game.me;
						if (get.mode() == "single") {
							if (game.players.every(i => (i["_source"] == player && !i._noCheckResult) || i == player)) {
								game.over(true);
							} else if (!game.players.some(i => (i["_source"] == player && !i._noCheckResult) || i == player)) {
								game.over(false);
							}
							return;
						}
						const targets = game.players.filter(i => i._noCheckResult);
						game.players.removeArray(targets);
						origin_checkResult();
						game.players.addArray(targets);
					};
				}
				if (typeof game.checkOnlineResult === "function") {
					const origin_checkOnlineResult = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						if (player._noCheckResult) {
							return false;
						}
						if (get.mode() == "single") {
							if (game.players.every(i => (i["_source"] == player && !i._noCheckResult) || i == player)) {
								game.over(true);
							} else if (!game.players.some(i => (i["_source"] == player && !i._noCheckResult) || i == player)) {
								game.over(false);
							}
							return;
						}
						const targets = game.players.filter(i => i._noCheckResult);
						game.players.removeArray(targets);
						origin_checkOnlineResult();
						game.players.addArray(targets);
					};
				}
				//敌友判定
				target.getFriends = function (func, includeDie) {
					const player = this;
					return []
				};
				target.isFriendOf = function (player) {
					return false;
				};
				target.getEnemies = function (func, includeDie) {
					return [this.source, ...game[includeDie ? "filterPlayer2" : "filterPlayer"](i => {
						return player.storage.yzs_NeutralAttitude.has(trigger.source) > 0;
					})]
				};

			}, player, newPlayer, player, event.name, "neutral", true);

			const Makora = newPlayer;
			Makora.addSkill("rg_treasure_ban");
			Makora.addSkill("yzs_NeutralAttitude")

			game.broadcastAll(() => {
				var video = document.createElement("VIDEO");
				//	video.className = "anime";

				Object.assign(video, {
					src: lib.assetURL + "/extension/一中杀/image/background/tiaofuyishi_yzs.MP4",
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
						var music = lib.config.background_music;
						if (music && music != "music_off") ui.backgroundMusic.play();
						document.body.removeChild(video);
					}, 1000)//1s后移除视频
				})
				document.body.appendChild(video);
				setTimeout(() => {
					video.style.opacity = "1";
				}, 50)
				setTimeout(() => {
					ui.background.style.transition = 'none';
					ui.background.style.filter = 'brightness(1)';
				}, 2250)
			});
			await new Promise(r => setTimeout(r, 1000))
			player.$fullscreenpop("八握剑", "thunder")
			await new Promise(r => setTimeout(r, 2000))
			player.$fullscreenpop("异戒神将", "thunder")
			await new Promise(r => setTimeout(r, 2500))
			player.$fullscreenpop("魔虚罗", "thunder")
		},
		ai: {
			order(item, player2) {
				return 3 - player.hp
			},
			result: {
				player: 1,
			},
			threaten: 2,
		},
	},
	//中立态度
	yzs_NeutralAttitude: {
		group: ["yzs_NeutralAttitude_damage"],
		subSkill: {
			damage: {
				popup: false,
				forced: true,
				priority: 3124,
				trigger: {
					player: "damageAfter"
				},
				filter(event, player) {
					return event.source;
				},
				async content(event, trigger, player) {
					if (!player.storage.yzs_NeutralAttitude) player.storage.yzs_NeutralAttitude = new Map();
					if (!player.storage.yzs_NeutralAttitude.has(trigger.source)) player.storage.yzs_NeutralAttitude.set(trigger.source, 0)
					player.storage.yzs_NeutralAttitude.set(trigger.source, player.storage.yzs_NeutralAttitude.get(trigger.source) + trigger.num)
				}
			}
		},
		priority: 214,
		popup: false,
		trigger: {
			player: "phaseAfter",
		},
		forced: true,
		async content(event, trigger, player) {
			player.ai.modAttitudeTo = function (from, to, att) {
				let at = att;
				//你对其他角色的态度
				if (to == from?.source) at = -1;
				if (from.storage.yzs_NeutralAttitude.has(to)) at -= from.storage.yzs_NeutralAttitude.get(to)
				return at;
			};
			if (from.storage.yzs_NeutralAttitude === undefined) return;
			for (let key of from.storage.yzs_NeutralAttitude) {
				if (from.storage.yzs_NeutralAttitude.get(key) > 0) from.storage.yzs_NeutralAttitude.set(key, --from.storage.yzs_NeutralAttitude.get(key))
			}
		},
	},
	//爱莉希雅
	yzs_wanciwang: {
		nobracket: true,
		locked: true,
		priority: -5,
		trigger: {
			player: "drawAfter"
		},
		filter(event, player) {
			return event.result?.cards?.length > 0;
		},
		async cost(event, trigger, player) {
			event.result = {
				bool: false, cards: [], targets: [], cost_data: new Map()
			};
			let cards = trigger.result.cards.slice();
			while (cards.some(card => get.name(card, player) == "sha")) {
				let result1 = await player.chooseCardTarget(false)
					.set("filterTarget", (card, player, target) => {
						if (target.hasSkill("hidden_yzs")) return false;
						for (let i = 0; i <= 4; i++) {
							if (target.hasEquipableSlot(i)) {
								return true;
							}
						}
						return false;
					})
					.set("prompt", "万雌王")
					.set("prompt2", `你摸牌后可将其中的【杀】当做${get.poptip("yzs_Girlyheart")}置入场上任意装备栏，然后摸置入数张牌<br>当前为第${event.result.cards.length + 1}张`)
					.set("filterCard", (card, player, target) => {
						if (get.name(card, player) != "sha") return false;
						if (!get.event().cardsx.includes(card)) return false;
						return true
					})
					.set("ai1", function (button) {
						return 6 - get.value({ name: button.link[2] })
					})
					.set("cardsx", cards)
					.set("position", "h")
					.forResult()
				if (!result1?.bool || !result1?.cards?.length || !result1?.targets?.length) {
					return false;
				}
				const target = result1.targets[0];
				const choices = [];
				for (let i = 1; i <= 4; i++) {
					if (target.hasEquipableSlot(i)) {
						choices.push(`equip${i}`);
					}
				}
				if (!choices.length) {
					return;
				}
				const result2 = await player
					.chooseControl(choices)
					.set("prompt", `请选择为${get.translation(target)}置入【少女心】的装备栏`)
					.set("ai", () => _status.event.controls.randomGet())
					.forResult();
				const card = get.autoViewAs({
					name: "yzs_Girlyheart_" + result2.control
				}, result1.cards)
				//	card.subtypes = [result2.control];

				event.result.bool = true;
				cards.removeArray(result1.cards);
				event.result.targets.push(target)
				event.result.cards.addArray(result1.cards);
				if (event.result.cost_data.has(target)) {
					event.result.cost_data.set(target, event.result.cost_data.get(target).concat([card]))
				} else {
					event.result.cost_data.set(target, [card])
				}
			}
		},
		async content(event, trigger, player) {
			const cost_data = event.cost_data;
			for (let target of event.targets) {
				if (!cost_data.has(target)) continue;
				const cards = cost_data.get(target);
				target.addSkill("yzs_Girlyheart_skill")
				for (let card of cards) {
					await player.$give(card, target, false);
					await target.equip(card);
				}
			}
			await player.draw(event.cards.length);
		},
		mod: {
			maxHandcard(player, num) {
				return num + player.countCards("e", card => get.name(card, player).startsWith("yzs_Girlyheart"));
			},
		},
	},
	yzs_Girlyheart_skill: {
		group: ["yzs_Girlyheart_skill_phaseAfter", "yzs_Girlyheart_skill_damage"],
		subSkill: {
			phaseAfter: {
				trigger: {
					player: "phaseAfter"
				},
				priority: 4,
				forced: true,
				filter(event, player) {
					let suits = [];
					game.getGlobalHistory("useCard", evt => {
						if (!suits.includes(evt.card.suit)) {
							suits.push(evt.card.suit)
						}
					});
					return player.countCards("e", card => get.name(card, player).startsWith("yzs_Girlyheart") && suits.includes(get.suit(card, player)))
				},
				async content(event, trigger, player) {
					let suits = [];
					game.getGlobalHistory("useCard", evt => {
						if (!suits.includes(evt.card.suit)) {
							suits.push(evt.card.suit)
						}
					});
					const cards = player.getCards("e", card => get.name(card, player).startsWith("yzs_Girlyheart") && suits.includes(get.suit(card, player)))
					if (cards.length > 1) {
						const result = await player.chooseToMove("少女心：将这些牌置于牌堆顶", true)
							.set("list", [["牌堆顶(左为顶)", cards]])
							.set("processAI", function (list) {
								const cards = list[0][1].slice(0).sort(function (a, b) {
									return get.value(b) - get.value(a);
								});
								return [cards];
							})
							.forResult();
						if (result?.bool) {
							const {
								moved: [top],
							} = result;
							top.reverse();
							player.$throw(cards, 1000);
							game.log(player, `将${get.cnNumber(top.length)}张牌置于牌堆顶`);
							await player
								.lose(top, ui.cardPile)
								.set("top_cards", top)
								.set("insert_index", (event, card) => {
									if (event.top_cards.includes(card)) {
										return ui.cardPile.firstChild;
									}
									return null;
								});
							await game.delayx();
						}
					} else {
						player.$throw(cards, 1e3);
						game.log(player, "将", cards, "置于牌堆顶");
						await player.lose(cards, ui.cardPile, "insert");
						await game.delayx();
					}
				},
			},
			damage: {
				priority: 3,
				forced: true,
				trigger: {
					source: "damageBegin1",
					player: "damageBegin3",
				},
				filter(event, player, name) {
					return player.getStorage("yzs_Girlyheart_skill") == 1 || player.getStorage("yzs_Girlyheart_skill") == -1;
				},
				async content(event, trigger, player) {
					trigger.yzs_Girlyheart_skill_damage = true;
					trigger.num += player.getStorage("yzs_Girlyheart_skill");
					player.setStorage("yzs_Girlyheart_skill", 0);
					player.removeTip("yzs_Girlyheart_skill");
					player.unmarkSkill("yzs_Girlyheart_skill")
				}
			},
		},
		markimage: "extension/一中杀/image/yzs_Girlyheart_skill.png",
		intro: {
			mark(dialog, content, player) {
				const storage = player.getStorage("yzs_Girlyheart_skill");
				if (storage == 1) {
					dialog.addText(`下次伤害结算伤害值+1`);
				} else if (storage == -1) {
					dialog.addText(`下次伤害结算伤害值-1`);
				} else {
					return
				}
			},
		},
		charlotte: true,
		forced: true,
		popup: false,
		priority: 3,
		trigger: {
			player: ["loseAfter", "loseBegin"],
			global: ["gainAfter", "gainBegin", "equipAfter", "equipBegin", "loseAsyncAfter", "loseAsyncBegin", "addToExpansionAfter", "addToExpansionBegin", "addJudgeAfter", "addJudgeBegin"],
		},
		filter(event, player, name, type) {
			if (event.name == "lose" && event.getParent() && event.getParent().name == "equip") return false;
			if (name.includes("Begin")) {
				event.yzs_Girlyheart_skill = player.countCards("e", card => get.name(card, player).startsWith("yzs_Girlyheart"));
				return false;
			} else {
				//	if (player.countCards("e", card => get.name(card, player) == "yzs_Girlyheart") == 0) return false;
				return typeof event.yzs_Girlyheart_skill == "number" && player.countCards("e", card => get.name(card, player).startsWith("yzs_Girlyheart")) != event.yzs_Girlyheart_skill
			}
		},
		async content(event, trigger, player) {
			const num = player.countCards("e", card => get.name(card, player).startsWith("yzs_Girlyheart"));
			if (num % 2) {
				player.setStorage("yzs_Girlyheart_skill", -1);
				player.addTip("yzs_Girlyheart_skill", "少女心 减伤", false);
				player.markSkill("yzs_Girlyheart_skill")
			} else {
				player.setStorage("yzs_Girlyheart_skill", 1);
				player.addTip("yzs_Girlyheart_skill", "少女心 加伤", false);
				player.markSkill("yzs_Girlyheart_skill")
			}
		}
	},
	yzs_wusuobuneng: {
		group: ["yzs_wusuobuneng_damage", "yzs_wusuobuneng_count", "yzs_wusuobuneng_use", "yzs_wusuobuneng_sha", "yzs_wusuobuneng_zhiheng"],
		subSkill: {
			damage: {
				priority: 31,
				forced: true,
				popup: false,
				trigger: {
					source: ["damageZero"]
				},
				filter(event, player) {
					return player.hasSkill('MiracleRetail_yzs_shaused')
				},
				async content(event, trigger, player) {
					player.removeSkill("MiracleRetail_yzs_shaused")
				}
			},
			count: {
				forced: true,
				popup: false,
				priority: -1255123,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					return event.card.name == "sha" && event.addCount !== false;
				},
				async content(event, trigger, player) {
					player.addSkill("MiracleRetail_yzs_shaused")
				},
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha' && player.hasSkill('MiracleRetail_yzs_shaused')) return false;
					},
					cardEnabled(card, player) {
						if (card.name == 'sha' && player.hasSkill('MiracleRetail_yzs_shaused')) return false;
					},
				},
			},
			use: {
				name: "无所不能(用杀)",
				hiddenCard: function (player, name) {
					return name == 'jiu' || name == "tao" || name == "sha" || name == "shan";
				},
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					let evt = event.getParent();
					if (event.yzs_wusuobuneng_use) return false;
					if (evt.name != "phaseUse" && evt.name != "_save") return false;
					if (event.responded) return false;
					return player.hasUseTarget({ name: "sha" }, true);
				},
				async content(event, trigger, player) {
					const evt = event.getParent(2);
					if (evt) {
						evt.yzs_wusuobuneng_use = true;
					}
					await player.chooseToUse("使用一张【杀】", function (card, player3) {
						if (get.name(card) != "sha") {
							return false;
						}
						return lib.filter.cardEnabled.apply(this, arguments);
					}).forResult();
				},
				ai: {
					order: 8,
					result: {
						player: 1
					},
					expose: 0.3,
					threaten: 1.2,
				},

			},
			sha: {
				enable: ["chooseToUse", "chooseToRespond"],
				name: "无所不能(印杀)",
				hiddenCard: function (player, name) {
					if (!player.countCards("hs")) return
					return name == 'sha'
				},
				filterCard: true,
				viewAsFilter: function (player) {
					return player.countCards('hs') > 0;
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
					let number = 0;
					for (let card of cards) {
						number += get.number(card, player) || 0
					}
					if (number > 13) {
						number %= 13;
						if (number == 0) number = 13;
					}
					event.result.card.number = number;
				},
				prompt: "将任意张手牌当做【杀】使用或打出（点数取总和对13取余）",
				check(card) {
					let player = _status.event.player;
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
						respond: 1,
						respondShan: 1,
					},
				},
			},
			zhiheng: {
				name: "无所不能(制衡)",
				usable: 1,
				enable: "phaseUse",
				filter(event, player) {
					return player.countCards("h") > 0;
				},
				async content(event, trigger, player) {
					let cards = player.getCards("h")
					const result = await player.chooseToMove("将全部手牌任意置顶或底，然后摸等量张牌", true)
						.set("list", [["牌堆顶(左为顶)", []], ["牌堆底(右为底)", cards]])
						.set("processAI", function (list) {
							const player = get.player();
							let cards = list[0][1].slice(0).sort(function (a, b) {
								return get.value(b) - get.value(a);
							});
							let cards1 = cards.filter(card => get.value(card, player) > 6);
							let cards2 = cards.filter(card => get.value(card, player) <= 6);
							return [cards1, cards2];
						})
						.forResult();
					if (result?.bool) {
						const {
							moved: [top, bottom],
						} = result;
						top.reverse();
						player.$throw(cards.length, 1000);
						player.popup(get.cnNumber(top.length) + "上" + get.cnNumber(bottom.length) + "下");
						game.log(player, `将${get.cnNumber(top.length)}张牌置于牌堆顶`);
						game.log(player, `将${get.cnNumber(bottom.length)}张牌置于牌堆底`);
						await player
							.lose(top.concat(bottom), ui.cardPile)
							.set("top_cards", top)
							.set("insert_index", (event, card) => {
								if (event.top_cards.includes(card)) {
									return ui.cardPile.firstChild;
								}
								return null;
							});
						await game.delayx();
						await player.draw(cards.length);
					}
				}
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
			player.yzs_UseShunfaji("yzs_wusuobuneng");
		},
		clickableFilter: function (player) {
			return player.hasUseTarget({ name: "sha" }, true)
		},
		clickableContent: async function (event, trigger, player) {
			await player.useSkill("yzs_wusuobuneng_use")
		},
		intro: {
			markcount: "storage",
			mark(dialog, content, player) {
				const storage = player.countMark("yzs_wusuobuneng")
				dialog.addText(`再使用或打出总计${13 - storage}点的牌，摸牌至手牌上限。`);
			},
		},
		nobracket: true,
		locked: true,
		priority: -5,
		forced: true,
		popup: false,
		trigger: {
			player: ["useCard", "respond"]
		},
		filter(event, player) {
			const number = get.number(event.card, player);
			return typeof number == "number" && number > 0;
		},
		async content(event, trigger, player) {
			const number = get.number(trigger.card, player);
			player.addMark("yzs_wusuobuneng", number, false)
			if (player.countMark("yzs_wusuobuneng") == 13) {
				player.clearMark("yzs_wusuobuneng", false);
				player.logSkill("yzs_wusuobuneng")
				await player.drawTo(player.getHandcardLimit())
			} else {
				player.setMark("yzs_wusuobuneng", player.countMark("yzs_wusuobuneng") % 13, false)
			}
		},
		mod: {
			aiValue(player, card, num) {
				if (card.name === "sha") {
					return num + 5;
				}
			},
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					if (card.number && card.number + player.countMark("yzs_wusuobuneng") == 13) {
						return num + 10;
					}
					return num;
				}
			},
		},
	},
	yzs_zhenwowuxia: {
		group: ["yzs_zhenwowuxia_zero"],
		subSkill: {
			zero: {
				priority: 2,
				direct: true,
				trigger: {
					player: ["damageZero"]
				},
				filter(event, player) {
					return event.num <= 0 && event.yzs_Girlyheart_skill_damage;
				},
				async content(event, trigger, player) {
					if (player.hp < player.maxHp) {
						await player.recover();
					} else {
						await player.draw();
						await player.changeHujia(1, "gain", 2)
					}
				}
			}
		},
		prompt: `你受到非零伤害后可移动场上1张牌`,
		nobracket: true,
		priority: 2,
		trigger: {
			player: ["damageEnd"]
		},
		filter(event, player) {
			return event.num > 0 && game.hasPlayer(target => target.countCards("hej"));
		},
		frequent: true,
		async content(event, trigger, player) {
			let result1 = await player.chooseTarget("真我无暇", "选择 1 名角色，将其区域内1张牌移走", false)
				.set("filterTarget", (card, player, target) => {
					return !(target.hasSkill("hidden_yzs")) && player != target;
				})
				.set("ai", (target2) => {
					const player2 = get.event().player;
					return get.effect(target2, { name: "guohe" }, player2, player2);
				})
				.forResult()
			if (!result1?.bool || !result1?.targets?.length) return;
			const target = result1.targets[0];
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
						return get.attitude(player, target)
					})
					.set("prompt", "真我无暇")
					.set("prompt2", "令任意角色获得此牌(不选则你获得)")
					.forResult()
				if (!next.bool) gainer = player;
				else gainer = next.targets[0];
				await gainer.gain(result.cards, "draw");
			} else {
				await player.moveCard(true);
			}

		},
	},
	//丹恒
	yzs_hualongmiaofa: {
		nobracket: true,
		locked: true,
		priority: 8,
		trigger: {
			global: "phaseUseBefore"
		},
		filter(event, player) {
			return event.player.isDamaged();
		},
		async cost(event, trigger, player) {
			event.result = { bool: false };
			const num = player.hp;
			let result = await player
				.chooseNumbers('終焉', [{
					prompt: `你可失去任意点体力，然后你记录当前体力状态并替换武将牌为“${get.poptip({
						id: "character_yzs_DanHengImbibitorLunae",
						name: "饮月",
						type: "character",
						dialog: "characterDialog",
					})}”，体力上限为你已损体力值，死亡后切换回当前武将牌并调整体力状态至记录值`, min: 1, max: num
				}], false)
				.set('processAI', () => {
					return [get.event().numz - 1];
				})
				.set('numz', num)
				.forResult();
			if (result?.bool) {
				const num2 = result.numbers?.[0];
				event.result = { bool: true, cost_data: num2 }
			}
		},
		async content(event, trigger, player) {
			const num = event.cost_data;
			await player.loseHp(num);
			const maxHp = player.getDamagedHp()
			player.storage.yzs_hualongmiaofa = {
				maxHp: player.maxHp,
				hp: player.hp,
				name1: player.name1,
			};
			player.markSkill("yzs_hualongmiaofa")
			await player.reinitCharacter(player.name1, 'yzs_DanHengImbibitorLunae');
			if (player.name2) {
				await player.reinitCharacter(player.name2, 'yzs_DanHengImbibitorLunae');
				player.storage.yzs_hualongmiaofa.name2 = player.name2;
			}
			player.maxHp = maxHp;
			player.hp = maxHp;
			player.update();
			await event.trigger("yzs_canglongzhuoshi");
		},
	},
	yzs_qianlong: {
		priority: 4,
		trigger: {
			global: "useCard",
		},
		filter(event, player) {
			if (get.type(event.card) != "basic" && get.type(event.card) != "trick") return false;
			if (!event.targets?.length) return false;
			return true;
		},
		frequent: true,
		check(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			let card = false;
			let result = await player.chooseToDiscard(`你可摸或弃1张牌并展示之（不弃则摸），<br>若之花色为${get.translation(get.suit(trigger.card, false))}，令${get.translation(trigger.player)}摸或弃1张牌；否则本技能本回合失效`)
				.set("ai", (card) => {
					const player = get.event().player;
					const target = get.event().target;
					const suit = get.event().suit;
					if (get.attitude(player, target) > 0) {
						if (get.suit(card, false) == suit) {
							return 6 - get.value(card);
						}
						return 0;
					} else {
						return 0
					}
				})
				.set("suit", get.suit(trigger.card, false))
				.set("target", trigger.player)
				.forResult();
			if (result?.bool && result.cards?.length) {
				card = result.cards[0];
			} else {
				let result2 = await player.draw().forResult();
				if (result2.cards?.length) {
					card = result2.cards[0];
				}
			}
			if (card) {
				await player.showCards([card], "【潜龙】展示牌")
			}
			if (card && get.suit(card, false) == get.suit(trigger.card, false)) {
				let result3 = await player
					.chooseButton([`令${get.translation(trigger.player)}摸或弃1张牌`, [["摸", "弃"], "tdnodes"]], true)
					.set("filterButton", button => {
						const target = get.event().target
						if (button.link == "弃") return target.countDiscardableCards(target, "he") > 0;
						return true;
					})
					.set("target", trigger.player)
					.set("ai", button => {
						const player = get.event().player;
						const target = get.event().target;
						if (get.attitude(player, target) > 0) {
							if (button.link == "摸") return 2;
							return 1;
						} else {
							if (button.link == "弃") return 2;
							return 1;
						}
					})
					.forResult();
				if (result3?.bool && result3?.links?.length) {
					if (result3.links[0] == "摸") {
						await trigger.player.draw()
					} else {
						await trigger.player.chooseToDiscard("he", true)
					}
				}
			} else {
				player.tempBanSkill("yzs_qianlong")
			}
		}
	},
	yzs_shuofeng: {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
			targetInRange(card) {
				if (get.name(card) == "sha") {
					return true;
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
	yzs_jiyu: {
		subSkill: {
			mark: {
				name: "蚀",
				marktext: "蚀",
				intro: {
					markcount: "storage",
					content: "当前有#/3点“蚀”。",
				},
				charlotte: true,
			}
		},
		direct: true,
		trigger: {
			player: "useCard0"
		},
		priority: 2,
		filter(event, player) {
			return event.card.name == "sha"
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.addMark("yzs_jiyu_mark");
			if (player.countMark("yzs_jiyu_mark") >= 3) {
				player.clearMark("yzs_jiyu_mark");
				_status.currentPhase?.damage?.()
			}
		}
	},
	//饮月
	yzs_canglongzhuoshi: {
		nobracket: true,
		forced: true,
		locked: true,
		priority: 41,
		trigger: {
			player: ["yzs_canglongzhuoshi", "dieBefore"]
		},
		async content(event, trigger, player) {
			if (trigger.name == "yzs_hualongmiaofa") {
				await player.drawTo(player.getHandcardLimit());
			} else {
				trigger.cancel();
				await player.reinitCharacter(player.name1, player.storage.yzs_hualongmiaofa.name1);
				if (player.storage.yzs_hualongmiaofa.name2) {
					await player.reinitCharacter(player.name2, player.storage.yzs_hualongmiaofa.name2);
				}
				player.maxHp = player.storage.yzs_hualongmiaofa.maxHp;
				player.hp = player.storage.yzs_hualongmiaofa.hp;;
				player.update();
				delete player.storage.yzs_hualongmiaofa;
				player.markSkill("yzs_hualongmiaofa")

				const method = [
					["mark", "得蚀"],
					["recover", "回血"],
				];
				let result = await player
					.chooseButton([`苍龙濯世：请选择要执行的效果`, [method, "tdnodes"], "hidden"], true)
					.set("filterButton", button => {
						const card = button.link;
						const player = get.player();
						if (card == "draw") {
							return player.countCards("h") < player.getHandcardLimit()
						}
						return true;
					})
					.set("ai", button => {
						const player = get.event().player;
						const target = _status.currentPhase || player;
						if (button.link == "draw") {
							return 1.5 * (player.getHandcardLimit() - player.countCards())
						}
						if (button.link == "mark") {
							if (player.countMark("yzs_jiyu") == 2) return get.damageEffect(target, player, player);
							return 2;
						}
						if (button.link == "recover") {
							return get.recoverEffect(player, player, player);
						}
						return 0
					})
					.forResult();
				if (result?.bool && result?.links?.length) {
					const method = result.links[0];
					if (method == "mark") {
						player.addMark("yzs_jiyu_mark");
						if (player.countMark("yzs_jiyu_mark") >= 3) {
							player.clearMark("yzs_jiyu_mark");
							_status.currentPhase?.damage?.()
						}
					}
					if (method == "draw") {
						await player.recover()
					}
				}
			}
		}
	},
	yzs_disi: {
		locked: true,
		zhuanhuanji: true,
		forced: true,
		priority: 6,
		mark: true,
		marktext: "抵",
		intro: {
			content: function (storage, player) {
				let str = `${get.poptip("zhuanlunji_yzs")}：场上角色出牌阶段开始前，你获得：<br>`
				if (storage == 0) {
					str += `①${get.poptip("yzs_qianlong")}`
				} else if (storage == 1) {
					str += `②${get.poptip("yzs_shuofeng")}`
				} else if (storage == 2) {
					str += `③${get.poptip("yzs_jiyu")}`
				}
				str += `，然后扣除1点体力上限，若已获得则改为失去本技能并获得${get.poptip("yzs_longlizizai")}。`
				return str;
			},
		},
		trigger: {
			global: "phaseUseBefore"
		},
		async content(event, trigger, player) {
			const list = ["yzs_qianlong", "yzs_shuofeng", "yzs_jiyu"]
			const storage = player.countMark("yzs_disi");
			player.setMark("yzs_disi", (storage + 1) % 3, false);
			if (player.hasSkill(list[storage])) {
				player.removeSkill("yzs_disi")
				player.addSkill("yzs_longlizizai")
			} else {
				player.addSkill(list[storage]);
				await player.loseMaxHp();
			}
		}
	},
	yzs_longlizizai: {
		derivation: ["yzs_qianlong", "yzs_shuofeng", "yzs_jiyu", "yzs_longlizizai"],
		nobracket: true,
		mod: {
			maxHandcardFinal(player, num) {
				return 4;
			},
		},
		usable: 1,
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
			player.yzs_UseShunfaji("yzs_longlizizai");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickableFilter: function (player) {
			return true
		},
		clickableContent: async function (event, trigger, player) {
			const method = [
				["draw", "摸牌"],
				["mark", "得蚀"],
				["recover", "回血"],
			];
			let result = await player
				.chooseButton([`龙力自在：请选择要执行的效果`, [method, "tdnodes"], "hidden"], true)
				.set("filterButton", button => {
					const card = button.link;
					const player = get.player();
					if (card == "draw") {
						return player.countCards("h") < player.getHandcardLimit()
					}
					return true;
				})
				.set("ai", button => {
					const player = get.event().player;
					const target = _status.currentPhase || player;
					if (button.link == "draw") {
						return 1.5 * (player.getHandcardLimit() - player.countCards())
					}
					if (button.link == "mark") {
						if (player.countMark("yzs_jiyu") == 2) return get.damageEffect(target, player, player);
						return 2;
					}
					if (button.link == "recover") {
						return get.recoverEffect(player, player, player);
					}
					return 0
				})
				.forResult();
			if (result?.bool && result?.links?.length) {
				const method = result.links[0];
				player.logSkill("yzs_longlizizai")
				if (method == "draw") {
					await player.drawTo(player.getHandcardLimit())
				}
				if (method == "mark") {
					player.addMark("yzs_jiyu_mark");
					if (player.countMark("yzs_jiyu_mark") >= 3) {
						player.clearMark("yzs_jiyu_mark");
						_status.currentPhase?.damage?.()
					}
				}
				if (method == "draw") {
					await player.recover()
				}
			}
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			return true
		},
		chooseButton: {
			dialog(event, player) {
				const method = [
					["draw", "摸牌"],
					["mark", "得蚀"],
					["recover", "回血"],
				];
				return ui.create.dialog(`龙力自在：请选择要执行的效果`, [method, "tdnodes"], "hidden");
			},
			select: 1,
			check(button) {
				const player = get.player()
				const target = _status.currentPhase || player;
				if (button.link == "draw") {
					return 1.5 * (player.getHandcardLimit() - player.countCards())
				}
				if (button.link == "mark") {
					if (player.countMark("yzs_jiyu") == 2) return get.damageEffect(target, player, player);
					return 2;
				}
				if (button.link == "recover") {
					return get.recoverEffect(player, player, player);
				}
				return 0
			},
			filter(button, player) {
				const card = button.link;
				if (card == "draw") {
					return player.countCards("h") < player.getHandcardLimit()
				}
				return true;
			},
			backup(links, player) {
				const method = links[0];
				if (method == "draw") {
					return {
						name: "龙力自在",
						discard: false,
						lose: false,
						log: false,
						delay: false,
						prepare: () => true,
						async content(event, trigger, player) {
							await player.drawTo(player.getHandcardLimit())
							const evt = event.getParent(2);
							if (evt.name == "chooseToUse") {
								evt.goto(0);
								delete evt.openskilldialog;
							}
						},
					}
				}
				if (method == "recover") {
					return {
						name: "龙力自在",
						discard: false,
						lose: false,
						log: false,
						delay: false,
						prepare: () => true,
						async content(event, trigger, player) {
							await player.recover();
							const evt = event.getParent(2);
							if (evt.name == "chooseToUse") {
								evt.goto(0);
								delete evt.openskilldialog;
							}
						},
					}
				}
				return {
					name: "龙力自在",
					discard: false,
					lose: false,
					log: false,
					delay: false,
					prepare: () => true,
					async content(event, trigger, player) {
						player.addMark("yzs_jiyu_mark");
						if (player.countMark("yzs_jiyu_mark") >= 3) {
							player.clearMark("yzs_jiyu_mark");
							_status.currentPhase?.damage?.()
						}
						const evt = event.getParent(2);
						if (evt.name == "chooseToUse") {
							evt.goto(0);
							delete evt.openskilldialog;
						}
					},
				}
			},
			prompt(links, player) {
				return ``
			},
		},
		ai: {
			order: 8,
			result: {
				player: 4,
			},
		},
	},
	//马知康
	yzs_idol: {
		group: ["yzs_idol_summon"],
		subSkill: {
			summon: {
				priority: 1,
				trigger: {
					player: "judgeEnd",
				},
				forced:true,
				filter(event, player) {
					return _status._yzsStorm !== "LoveStorm" && get.suit(event.result.card,player)=="heart"
				},
				async content(event, trigger, player) {
					await player.yzs_SummonStorm("LoveStorm");
				},
			},
			gaobai: {
				locked: true,
				async content(event, trigger, player) {
					const judgeResult = await player.judge(function (card) {
						const suit2 = get.suit(card);
						if (suit2 == "heart") {
							return 4;
						}
						if (suit2 == "spade") {
							return -4;
						}
						return 2;
					}).forResult();
					if (get.suit(judgeResult.card,player) == "heart") {
						game.log(player, "告白成功")
						await player.recover()
					} else if (get.suit(judgeResult.card,player) == "spade") {
						game.log(player, "告白失败");
						await player.loseHp()
					} else {
						await player.gain(judgeResult.card)
						game.log(player, "没得到明确答复", "获得了", judgeResult.card)
					}
				}
			},
		},
		init: function (player, skill) {
			if (!player.storage.extraStorm) {
				player.storage.extraStorm = "LoveStorm";
				player.markSkill("extraStorm");
			}
		},
		nobracket: true,
		locked: true,
		priority: 520,
		trigger: {
			player:"useCardAfter"
		},
		filter(event, player) {
			return get.type(event.card) == "basic";
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget("爱“豆”", `你可令任意角色进行${get.poptip("yzs_idol_gaobai")}`, false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs")
				})
				.set("ai", (target2) => {
					return Math.random();
				}).forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			await target.useSkill("yzs_idol_gaobai")
		}
	},
	LoveStorm_skill: {
		group: "LoveStorm_skill_instant",
		subSkill: {
			instant: {
				name: "告白风暴",
				popup: false,
				locked: true,
				log: false,
				stormskill: true,
				async content(event, trigger, player) {
					event.result = await player.chooseTarget("爱“豆”", `你可令任意角色进行${get.poptip("yzs_idol_gaobai")}`, true)
						.set("filterTarget", (card, player, target) => {
							return !target.hasSkill("hidden_yzs")
						})
						.set("ai", (target2) => {
							return Math.random();
						}).forResult();
					if (event.result?.bool && event.result?.targets?.length) {
						const target = event.result.targets[0];
						await target.useSkill("yzs_idol_gaobai")
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
			return true
		},
		async content(event, trigger, player) {
			let result = player.countCards("h") ? await player.chooseCardTarget(false)
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					return true;
				})
				.set("prompt", "告白风暴")
				.set("prompt2", `给予其他角色1张手牌以令其进行${get.poptip("yzs_idol_gaobai")}，否则你进行${get.poptip("yzs_idol_gaobai")}`)
				.set("filterCard", (card, player, target) => {
					return true
				})
				.set("ai1", get.unuseful3)
				.set("ai2", target => {
					const player=get.player()
					return get.attitude(player, target)-2;
				})
				.set("position", "h")
				.forResult() : { bool: false }
			if (result?.bool && result?.cards?.length && result?.targets?.length) {
				const target = result.targets[0];
				await player.give(result.cards, target);
				await target.useSkill("yzs_idol_gaobai")
			} else {
				await player.useSkill("yzs_idol_gaobai")
			}
		},
		priority: -25,
	},
	yzs_zongqing: {
		priority: -520,
		trigger: {
			global: "judge",
		},
		preHidden: true,
		filter(event, player) {
			return player.hasCards("h");
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard({
				prompt: `${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，你可打出1张手牌代替之。然后若原判定牌为♥，你获得之`,
				filterCard(card) {
					const player2 = get.player();
					const mod2 = game.checkMod(card, player2, "unchanged", "cardEnabled2", player2);
					if (mod2 !== "unchanged") {
						return !!mod2;
					}
					const mod = game.checkMod(card, player2, "unchanged", "cardRespondable", player2);
					if (mod !== "unchanged") {
						return !!mod;
					}
					return true;
				},
				position: "h",
				ai(card) {
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
				}
			}).set("judging", trigger.player.judging[0]).setHiddenSkill(event.skill).forResult();

		},
		popup: false,
		async content(event, trigger, player) {
			const next = player.respond({
				cards: event.cards,
				skill: event.name,
				highlight: true,
				noOrdering: true
			});
			await next;
			const { cards: cards2 } = next;
			if (cards2?.length) {
				const card = trigger.player.judging[0];
				if (trigger.player.judging[0].clone) {
					trigger.player.judging[0].clone.classList.remove("thrownhighlight");
					game.broadcast((card) => {
						if (card.clone) {
							card.clone.classList.remove("thrownhighlight");
						}
					}, trigger.player.judging[0]);
					game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
				}
				await game.cardsDiscard(trigger.player.judging[0]);
				trigger.player.judging[0] = cards2[0];
				trigger.orderingCards.addArray(cards2);
				game.log(trigger.player, "的判定牌改为", cards2);
				await game.delay(2);
				if (get.suit(card, player) == "heart") {
					player.$gain2(card);
					await player.gain(card);
				}
			}
		},
		ai: {
			rejudge: true,
			tag: {
				rejudge: 1,
			},
		},
	},
}
export default skills;
