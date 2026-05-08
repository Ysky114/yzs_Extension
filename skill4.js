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
	//娜娜奇
	mixiang_yzs: {
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content: function (storage, player) {
				var str = "转换技：需要时，你可视为使用或打出";
				if (storage) {
					return str + "【无懈可击】";
				} else {
					return str + "【闪】";
				}
			},
		},
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			if (!player.storage.mixiang_yzs) {
				return name === "shan"
			} else {
				return name === "wuxie"
			}
		},
		filter(event, player) {
			if (!player.storage.mixiang_yzs) {
				return event.filterCard({ name: "shan", isCard: true }, player, event)
			}
			return event.filterCard({ name: "wuxie", isCard: true }, player, event)
		},
		async precontent(event, trigger, player) {
			player.logSkill("mixiang_yzs");
			player.changeZhuanhuanji(event.name.slice(4));
		},
		viewAsFilter(player) {
			return true
		},
		viewAs(cards, player) {
			if (!player.storage.mixiang_yzs) {
				return { name: "shan", isCard: true };
			} else {
				return { name: "wuxie", isCard: true };
			}
		},
		filterCard: () => false,
		selectCard: -1,
		prompt() {
			if (!_status.event.player.storage.mixiang_yzs) {
				return "视为使用或打出【闪】";
			}
			return "视为使用【无懈可击】";
		},
		log: false,
		ai: {
			order: 3.4,
			respondShan: true,
			skillTagFilter(player, tag) {
				return tag == "respondShan" && !player.storage.mixiang_yzs
			},
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "respondShan") && current < 0 && !player.storage.mixiang_yzs) {
						return 0.4;
					}
				},
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
	jingjue_yzs: {
		usable: 1,
		priority: -1,
		trigger: {
			player: "useCardAfter",
		},
		filter(event, player) {
			if (get.is.damageCard(event.card, true)) return false;
			return game.hasPlayer((target) => {
				if (target.hasSkill("hidden_yzs")) return false;
				if (!target.countDiscardableCards(player, "he")) return false;
				return true;
			});
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget(1, false)
				.set("prompt", "警觉")
				.set("prompt2", "每回合限1次：你使用非伤害牌后，可弃置1名角色1张牌，然后若其攻击范围包含你，刷新本技能")
				.set("filterTarget", (card, player, target) => {
					if (target.hasSkill("hidden_yzs")) return false;
					if (!target.countDiscardableCards(player, "he")) return false;
					return true;
				})
				.set("onChooseTarget", function () {
					const event = get.event();
					const player = get.event().player;
					event.targetprompt2.add(target => {
						let list = [];
						if (target.inRange(player)) list.add("!")
						return list;
					});
				})
				.set("ai", target => {
					const player = get.player();
					let v = get.effect(target, { name: "guohe" }, player, player);
					if (target.inRange(player)) v += 2;
					return v;
				})
				.forResult()
		},
		async content(event, trigger, player) {
			const target = event.targets[0]
			await player.discardPlayerCard(target, "he", true);
			if (target.inRange(player)) {
				player.refreshSkill(event.name)
			}

		},
	},
	shuyu_yzs: {
		group: ["shuyu_yzs_save1", "shuyu_yzs_save2", "shuyu_yzs_use"],
		subSkill: {
			use: {
				forced: true,
				popup: false,
				priority: -3,
				trigger: {
					player: "useCardAfter"
				},
				filter(event, player) {
					return event.card?.storage?.shuyu_yzs && event.targets.length
				},
				async content(event, trigger, player) {
					for (let target of trigger.targets) {
						const result = target.countCards("h") < 1
							? { bool: false }
							: await target.chooseCard()
								.set("forced", false)
								.set("prompt", `给予 ${get.translation(player)} 1张手牌以刷新其${get.poptip("shuyu_yzs")}，否则你摸2张牌`)
								.set("selectCard", 1)
								.set("ai", (card) => {
									if (get.suit(card) == "heart") return 114;
									return get.value(card);
								})
								.set("position", "h")
								.forResult()
						if (result.bool) {
							if (player != target) await target.give(result.cards, player);
							var stat = player.getStat().skill;
							delete stat.shuyu_yzs;
						} else {
							await target.draw(2);
						}
					}
				}
			},
			save1: {
				forced: true,
				popup: false,
				priority: 21,
				trigger: {
					source: "recoverBegin",
				},
				filter(event, player) {
					if (!event.player) return false;
					if (!event.player.isDying()) return false;
					return true;
				},
				async content(event, trigger, player) {
					trigger.shuyu_yzs = true;
				},

			},
			save2: {
				prompt2: `可失去${get.poptip("yinju_yzs")}，此后你的【桃】可指定任意角色为目标，且使用时目标角色摸1张牌`,
				locked: true,
				audio: "ext:一中杀/audio/skill:1",
				skillAnimation: true,
				animationColor: "thunder",
				priority: -23,
				trigger: {
					source: "recoverAfter",
				},
				filter(event, player) {
					if (player.storage.shuyu_yzs) {
						return false;
					}
					if (!event.player) return false;
					if (event.player.isDying()) return false;
					return event.shuyu_yzs == true;
				},
				async content(event, trigger, player) {
					player.storage.shuyu_yzs = true;
					player.markSkill("shuyu_yzs");
					player.removeSkill("yinju_yzs");
					game.broadcastAll(() => {
						if (_status.shuyu_yzs) return;
						_status.shuyu_yzs = true;
						if (lib.card["tao"]) {
							if (typeof lib.card["tao"].enable === "function") {
								let enable = lib.card["tao"].enable;
								lib.card["tao"].enable = function (card, player) {
									if (player.storage.shuyu_yzs) {
										return game.hasPlayer(cur => !cur.hasSkill("hidden_yzs"))
									}
									return enable.call(this, card, player)
								};
							}
							if (typeof lib.card["tao"].selectTarget === "function") {
								let selectTarget = lib.card["tao"].selectTarget;
								lib.card["tao"].selectTarget = function (card, player) {
									if (player.storage.shuyu_yzs) {
										return 1
									}
									return selectTarget.call(this, card, player)
								};
							} else {
								lib.card["tao"].selectTarget = function (card, player) {
									if (player.storage.shuyu_yzs) return 1;
									return -1
								};
							}
							if (typeof lib.card["tao"].filterTarget === "function") {
								let filterTarget = lib.card["tao"].filterTarget;
								lib.card["tao"].filterTarget = function (card, player, target) {
									if (player.storage.shuyu_yzs) {
										return !target.hasSkill("hidden_yzs")
									}
									return filterTarget.call(this, card, player, target)
								};
							}
						}
					});
					if (!_status.postReconnect.shuyu_yzs) {
						_status.postReconnect.shuyu_yzs = [
							function () {
								if (lib.card["tao"]) {
									if (typeof lib.card["tao"].enable === "function") {
										let enable = lib.card["tao"].enable;
										lib.card["tao"].enable = function (card, player) {
											if (player.storage.shuyu_yzs) {
												return game.hasPlayer(cur => !cur.hasSkill("hidden_yzs"))
											}
											return enable.call(this, card, player)
										};
									}
									if (typeof lib.card["tao"].selectTarget === "function") {
										let selectTarget = lib.card["tao"].selectTarget;
										lib.card["tao"].selectTarget = function (card, player) {
											if (player.storage.shuyu_yzs) {
												return 1
											}
											return selectTarget.call(this, card, player)
										};
									} else {
										lib.card["tao"].selectTarget = function (card, player) {
											if (player.storage.shuyu_yzs) return 1;
											return -1
										};
									}
									if (typeof lib.card["tao"].filterTarget === "function") {
										let filterTarget = lib.card["tao"].filterTarget;
										lib.card["tao"].filterTarget = function (card, player, target) {
											if (player.storage.shuyu_yzs) {
												return !target.hasSkill("hidden_yzs")
											}
											return filterTarget.call(this, card, player, target)
										};
									}
								}
							},
							[],
						];
					}
					player.addSkill("shuyu_yzs_tao")
					if (game.hasPlayer(cur => get.translation(cur).includes("雷古"))) {
						game.broadcastAll(function (current) {
							if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/shuyu_yzs_Reg.png");
						}, player)
						game.broadcastAll(() => {
							game.playAudio("ext:一中杀/audio/skill/shuyu_yzs_Reg.mp3");
						});
					}
				}
			},
			tao: {
				locked: true,
				forced: true,
				popup: false,
				priority: 21,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					return event.card.name == "tao"
				},
				async content(event, trigger, player) {
					for (let target of trigger.targets) {
						await target.draw();
					}
				},
			},
			buff: {
				mark: true,
				onremove: true,
				marktext: "愈",
				intro: {
					content: "使用下张牌无次数距离限制",
				},
				charlotte: true,
				popup: false,
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					return true;
				},
				forced: true,
				async content(event, trigger, player) {
					player.removeSkill(event.name)
					if (trigger.addCount === false) return;
					trigger.addCount = false;
					trigger.player.getStat().card[trigger.card.name]--;
				},
				mod: {
					targetInRange(card, player, target) {
						return true;
					},
					cardUsable(card, player, num) {
						return Infinity;
					},
				},
				sub: true,
				sourceSkill: "shuyu_yzs",
			}
		},
		locked: true,
		audio: "ext:一中杀/audio/skill:4",
		usable: 1,
		enable: "chooseToUse",
		hiddenCard(player, name) {
			return name == "tao"
		},
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "heart" }) > 0;
		},
		filterCard(card) {
			return get.suit(card) == "heart";
		},
		position: "hes",
		viewAs: {
			name: "tao",
			storage: {
				shuyu_yzs: true,
			}
		},
		prompt: "将一张♥牌当【桃】使用",
		check(card) {
			return 15 - get.value(card);
		},
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "tao" && get.suit(card) != "heart") {
					return;
				}
				const cards2 = player.getCards("hes", (card2) => get.name(card2) == "tao" || get.suit(card2) == "heart");
				cards2.sort((a, b) => (get.name(a) == "tao" ? 1 : 2) - (get.name(b) == "tao" ? 1 : 2));
				var geti = () => {
					if (cards2.includes(card)) {
						cards2.indexOf(card);
					}
					return cards2.length;
				};
				return Math.max(num, [6.5, 4, 3, 2][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.shuyu_yzs.mod.aiValue.apply(this, arguments);
			},
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
						taos = player.getCards("hes", i => get.name(i) === "tao" && lib.filter.cardEnabled(i, target, "forceEnable"));
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
	//冯·吉苏克
	Sacrifice_yzs: {
		Effect: function (targetPlayer) {
			// 1. 创建特效总容器
			const effectContainer = document.createElement('div');
			effectContainer.className = 'evil-aura-effect-container';

			Object.assign(effectContainer.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '1000',
				pointerEvents: 'none',
				overflow: 'hidden', // 气息包裹头像，通常在范围内
				borderRadius: 'inherit' // 跟随头像圆角
			});

			targetPlayer.appendChild(effectContainer);

			// 2. 创建底层阴影遮罩（随着气息上升，头像逐渐变暗）
			const shadowOverlay = document.createElement('div');
			Object.assign(shadowOverlay.style, {
				position: 'absolute',
				bottom: '0',
				left: '0',
				width: '100%',
				height: '100%',
				background: 'rgba(0, 0, 0, 0)',
				transition: 'background 0.8s ease-in-out',
				zIndex: '1'
			});
			effectContainer.appendChild(shadowOverlay);

			// 3. 创建邪恶烟雾粒子
			const smokeCount = 15;
			const smokes = [];
			const colors = [
				'rgba(20, 0, 0, 0.9)',  // 极深红/黑
				'rgba(139, 0, 0, 0.8)', // 深红
				'rgba(0, 0, 0, 0.95)',  // 纯黑
				'rgba(60, 0, 0, 0.7)'   // 暗红
			];

			for (let i = 0; i < smokeCount; i++) {
				const smoke = document.createElement('div');
				const size = Math.random() * 60 + 40; // 烟雾团块较大
				const color = colors[Math.floor(Math.random() * colors.length)];

				Object.assign(smoke.style, {
					position: 'absolute',
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: color,
					borderRadius: '40% 60% 50% 50%', // 不规则形状
					left: `${Math.random() * 100}%`,
					bottom: '-20%', // 从底部下方冒出
					filter: 'blur(15px)', // 核心：高模糊产生烟雾感
					opacity: '0',
					transform: 'translateX(-50%) scale(0.8)',
					zIndex: '2'
				});

				effectContainer.appendChild(smoke);
				smokes.push({ element: smoke, delay: Math.random() * 400 });
			}

			// ================= 开始动画 =================

			// A. 背景遮罩变暗
			requestAnimationFrame(() => {
				shadowOverlay.style.background = 'rgba(0, 0, 0, 0.6)';
			});

			// B. 烟雾上升包裹动画
			smokes.forEach((smoke) => {
				const { element, delay } = smoke;
				const drift = (Math.random() - 0.5) * 40; // 左右晃动位移

				element.animate([
					{
						bottom: '-20%',
						opacity: '0',
						transform: 'translateX(-50%) scale(0.8) rotate(0deg)'
					},
					{
						opacity: '0.9',
						offset: 0.3
					},
					{
						bottom: '100%', // 飞过头顶
						opacity: '0',
						transform: `translateX(calc(-50% + ${drift}px)) scale(1.5) rotate(180deg)`,
						offset: 1
					}
				], {
					duration: 1500 + Math.random() * 500,
					delay: delay,
					easing: 'ease-in'
				});
			});

			// C. 目标头像的负面高亮（暗红边缘）
			if (!document.querySelector('#evil-aura-style')) {
				const style = document.createElement('style');
				style.id = 'evil-aura-style';
				style.textContent = `
            @keyframes evilPulse {
                0% { filter: grayscale(0) brightness(1); }
                50% { filter: grayscale(0.8) brightness(0.4) drop-shadow(0 0 15px #ff0000); }
                100% { filter: grayscale(0) brightness(1); }
            }
            .evil-aura-target {
                animation: evilPulse 1.8s ease-in-out forwards;
            }
        `;
				document.head.appendChild(style);
			}

			targetPlayer.classList.add('evil-aura-target');

			// 4. 清理
			setTimeout(() => {
				shadowOverlay.style.background = 'rgba(0, 0, 0, 0)';
				setTimeout(() => {
					if (effectContainer.parentNode) {
						effectContainer.parentNode.removeChild(effectContainer);
					}
					targetPlayer.classList.remove('evil-aura-target');
				}, 500);
			}, 1800);
		},
		group: "Sacrifice_yzs_renew",
		subSkill: {
			renew: {
				forceDie: true,
				forceOut: true,
				priority: 22,
				popup: false,
				forced: true,
				trigger: {
					global: "roundStart",
				},
				filter(event, player) {
					return game.roundNumber > 0 && player.countMark("Sacrifice_yzs_used");
				},
				async content(event, trigger, player) {
					player.clearMark("Sacrifice_yzs_used", false)
				}
			},
		},
		forceDie: true,
		forceOut: true,
		locked: true,
		eternalSkill_yzs: true,
		priority: 15,
		trigger: {
			global: "phaseAfter"
		},
		filter(event, player) {
			if (player.countMark("Sacrifice_yzs_used")) return false;
			if (game.hasPlayer(target => target.hp <= game.roundNumber && !target.storage.isSub)) return true;
			if (game.hasPlayer(target => target.name == "tentacle_yzs")) return true;
			return false;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget(false)
				.set("filterTarget", function (card, player, target) {
					if (target.hasSkill("hidden_yzs")) return false;
					if (target.name == "tentacle_yzs") return true;
					if (target.hp <= game.roundNumber && !target.storage.isSub) return true;
					return false;
				})
				.set("ai", target => {
					const player = get.player();
					let num = game.roundNumber;
					if (get.attitude(player, target) > 0) {
						if (target.isHealthy()) return 0;
						if (target.name == "tentacle_yzs") return 0;
						return num;
					} else {
						if (target.isHealthy()) return 3 - num;
						if (target.name == "tentacle_yzs") return get.damageEffect(target, player, player);
						return 4 - num;;
					}
				})
				.set("prompt", `选择1名“深渊之触”或1名体力值≤轮次数的人物`)
				.set("prompt2", `令此“深渊之触”受到1点无来源伤害，或令此人物替换人物牌至“${get.poptip("tentacle_yzs")}”并回复1点体力`)
				.forResult();
		},
		async content(event, trigger, player) {
			player.addMark("Sacrifice_yzs_used", 1, false)
			let target = event.targets[0];
			if (target.name == "tentacle_yzs") {
				await target.damage("nosource");
			} else {
				target.storage.AbyssServant_yzs = {
					maxHp: target.maxHp,
					name1: target.name1,
				};
				target.markSkill("AbyssServant_yzs")
				target.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
				await target.reinitCharacter(target.name1, 'tentacle_yzs');
				if (target.name2) {
					await target.reinitCharacter(target.name2, 'tentacle_yzs');
					target.storage.AbyssServant_yzs.name2 = target.name2;
				}
				await target.recover()
			}
		},
	},
	ReligiousOrder_yzs: {
		group: ["ReligiousOrder_yzs_other"],
		subSkill: {
			other: {
				priority: -2,
				locked: true,
				trigger: {
					global: "phaseJieshuBegin"
				},
				filter(event, player) {
					if (event.player == player) return false;
					return !event.player.hasSkill("hidden_yzs") && player.countCards("h")
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseCard()
						.set("prompt2", `你可给予 ${get.translation(trigger.player)} 1张手牌，然后其选择：失去1点体力，或令你回复1点体力`)
						.set("ai", card => {
							const player = get.event().player;
							const target = get.event().target;
							if (get.attitude(player, target) > 0) {
								if (player.isHealthy()) return 0;
								return 7 - get.value(card);
							} else {
								if (player.isHealthy() || player.countCards("h") <= 3) return 0;
								return get.effect(target, { name: "losehp" }, player, player)
							}
						})
						.set("target", trigger.player)
						.set("position", "h")
						.forResult();
				},
				async content(event, trigger, player) {
					await player.give(event.cards, trigger.player, false);
					let result = await trigger.player.chooseTarget(`你令 ${get.translation(player)} 回复1点体力，否则你失去1点体力`)
						.set("filterTarget", (card, player, target) => {
							return target == _status.event.target || target == player;
						})
						.set("ai", target => {
							const player = get.event().player;
							if (get.attitude(player, target) > 0) return 10;
							if (target.isHealthy()) return 10;
							return get.recoverEffect(target, player, player) - get.effect(player, { name: "losehp" }, player, player)
						})
						.set('target', player)
						.forResult();
					if (!result.bool) {
						await trigger.player.loseHp();
						return;
					}
					if (result.targets[0] == trigger.player) {
						await trigger.player.loseHp();
					} else {
						await player.recover();
					}
				}
			},
		},
		locked: true,
		forced: true,
		trigger: {
			player: ["phaseBegin", "phaseEnd"]
		},
		async content(event, trigger, player) {
			if (!player.countMark("Sacrifice_yzs_used")) {
				await player.draw();
				return;
			}
			let result = await player.chooseButton([
				`请选择一项`,
				[
					[
						["draw", "摸1张牌"],
						["renew", `刷新${get.poptip("Sacrifice_yzs")}`],
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
					if (button.link == "renew" && !player.countMark("Sacrifice_yzs_used")) return 0;
					return Math.random();
				})
				.forResult();
			if (!result.bool) return
			if (result.links == "draw") {
				await player.draw();
			} else {
				player.clearMark("Sacrifice_yzs_used", false)
			}
		}
	},
	//深渊之触
	AbyssServant_yzs: {
		group: ["AbyssServant_yzs_change", "AbyssServant_yzs_maxHp", "AbyssServant_yzs_draw"],
		subSkill: {
			change: {
				charlotte: true,
				locked: true,
				forced: true,
				popup: false,
				priority: -114,
				LastDo: true,
				trigger: {
					player: ["damageAfter", "damageZero"]
				},
				filter(event, player) {
					return player.storage.AbyssServant_yzs
				},
				async content(event, trigger, player) {
					await player.reinitCharacter(player.name1, player.storage.AbyssServant_yzs.name1);
					if (player.storage.AbyssServant_yzs.name2) {
						await player.reinitCharacter(player.name2, player.storage.AbyssServant_yzs.name2);
					}
					player.maxHp = player.storage.AbyssServant_yzs.maxHp;
					player.update();
					delete player.storage.AbyssServant_yzs;
					player.markSkill("AbyssServant_yzs")
				}
			},
			maxHp: {
				popup: false,
				forced: true,
				trigger: {
					global: "roundStart",
				},
				filter(event, player) {
					return game.roundNumber > 0;
				},
				async content(event, trigger, player) {
					player.maxHp = game.roundNumber;
					player.update();
				}
			},
			draw: {
				priority: 2,
				trigger: {
					player: "phaseDrawBegin2",
				},
				direct: true,
				popup: false,
				filter(event, player) {
					return !event.numFixed && game.roundNumber > 0;
				},
				async content(event, trigger, player) {
					trigger.num += game.roundNumber - 2;
				},
				ai: {
					threaten: 1.3,
				},
			}
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + player.hp - 1;
			},
		},
		init: function (player, skill) {
			if (game.roundNumber > 0) {
				player.maxHp = game.roundNumber;
				player.update();
			}
		},
		nobracket: true,
		locked: true,
		priority: -3,
		prompt2: `摸牌阶段，你可改为受到1点无来源伤害(你受到伤害后替换回原人物牌)`,
		trigger: {
			player: "phaseDrawBegin1",
		},
		filter(event, player) {
			return true
		},
		check(event, player) {
			if (player.hp <= 2 || game.roundNumber >= 4) return false;
			return true;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.damage("nosource")
		}
	},
	//埴安神袿姬
	zaoxingshu_yzs: {
		group: ["zaoxingshu_yzs_ex", "zaoxingshu_yzs_directHit", "zaoxingshu_yzs_gain"],
		subSkill: {
			ex: {
				priority: 5,
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.zaoxingshu_yzs
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
				"skill_id": "zaoxingshu_yzs_ex",
				sub: true,
				sourceSkill: "zaoxingshu_yzs",
			},
			used: {
				charlotte: true,
				onremove: "storage",
				sub: true,
				sourceSkill: "zaoxingshu_yzs",
				"_priority": 0,
				"skill_id": "zaoxingshu_yzs_used",
			},
			gain: {
				priority: 6,
				forced: true,
				charlotte: true,
				popup: false,
				trigger: {
					player: "gainAfter",
				},
				filter(event, player) {
					if (!event.cards.length) return false;
					let evt = event.getParent();
					if (evt.name == "gainPlayerCard" || evt.name == "draw") evt = evt.getParent();
					return evt.card?.storage?.zaoxingshu_yzs
				},
				async content(event, trigger, player) {
					await player.showCards(trigger.cards, "【造形术】展示获得的牌")
					let cards = trigger.cards.filter(i => (get.type(i) == "basic" || get.type(i) == "trick") && !player.getStorage("zaoxingshu_yzs").includes(i.name));
					if (!cards.length) return;
					let result = await player.chooseButton(["造形术", "将其中任意个即时牌名加入技能描述。每加入1个基本牌名，你扣除1点体力上限", cards], false)
						.set("selectButton", [1, Infinity])
						.set("filterButton", (button, player) => {
							if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
							return ui.selected.buttons.every(other => get.name(button.link) !== get.name(other.link));
						})
						.set("ai", button => 2)
						.forResult()
					if (!result.bool) return;
					for (let i of result.links) {
						player.markAuto("zaoxingshu_yzs", [i.name])
						if (get.type(i) == "basic") await player.loseMaxHp();
					}
				},
			},
			directHit: {
				priority: 4,
				trigger: {
					player: "useCard",
				},
				forced: true,
				filter(event, player) {
					return !event.cards || !event.cards.length;
				},
				async content(event, trigger, player) {
					trigger.directHit.addArray(game.players);
				},
				ai: {
					effect: {
						target(card, player, target, current) {
							if (get.tag(card, "respondSha") && current < 0) {
								return 0.6;
							}
						},
					},
					"directHit_ai": true,
					skillTagFilter(player, tag, arg) {
						return arg.card.name == "sha";
					},
				},
			},
		},
		locked: true,
		init: function (player, skill) {
			player.markAuto("zaoxingshu_yzs", ["wuzhong"])
		},
		hiddenCard(player, name) {
			var list = player.getStorage("zaoxingshu_yzs").slice(0);
			list.removeArray(player.getStorage("zaoxingshu_yzs_used"));
			return list.includes(name)
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (event.responded || event.zaoxingshu_yzs) return false;
			var list = player.getStorage("zaoxingshu_yzs").slice(0);
			list.removeArray(player.getStorage("zaoxingshu_yzs_used"));
			if (!list.length) {
				return false;
			}
			for (var i of list) {
				if (event.filterCard({ name: i, isCard: true, storage: { zaoxingshu_yzs: true } }, player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = player.getStorage("zaoxingshu_yzs").slice(0);
				list.removeArray(player.getStorage("zaoxingshu_yzs_used"));
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					if (event.filterCard({ name: i, isCard: true, storage: { zaoxingshu_yzs: true } }, player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("造形术", [list2, "vcard"]);
			},
			check(button) {
				return _status.event.player.getUseValue({ name: button.link[2] }, null, true);
			},
			backup(links, player) {
				return {
					filterCard: () => false,
					selectCard: -1,
					popname: true,
					viewAs: {
						name: links[0][2],
						storage: {
							zaoxingshu_yzs: true,
						}
					},
					async precontent(event, trigger, player) {
						player.logSkill("zaoxingshu_yzs");
						player.addTempSkill("zaoxingshu_yzs_used");
						player.markAuto("zaoxingshu_yzs_used", [event.result.card.name]);
					},
				};
			},
			prompt(links, player) {
				return "你视为使用或打出【" + get.translation(links[0][2]) + "】";
			},
		},
		mod: {
			cardUsable(card, player, num) {
				if (card?.storage?.zaoxingshu_yzs) {
					return Infinity
				}
			},
		},
		ai: {
			save: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player, tag, arg) {
				if (player.isTempBanned("zaoxingshu_yzs")) {
					return false;
				}
				var list = player.getStorage("zaoxingshu_yzs").slice(0);
				list.removeArray(player.getStorage("zaoxingshu_yzs_used"));
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
					return 2
				},
			},
			threaten: 1.9,
		},
	},
	//肉鸽技能
	rg_treasure: {
		subSkill: {
			ban: {
				charlotte: true,
				sub: true,
				sourceSkill: "rg_treasure",
			},
			targeted: {
				charlotte: true,
				sub: true,
				sourceSkill: "rg_treasure",
				onremove: true,
				priority: 312415,
				forced: true,
				popup:false,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return !event.skill
				},
				async content(event, trigger, player) {
					player.clearMark("rg_treasure_targeted",1,false)
				}
			},
		},
		nopop: true,
		popup: false,
		locked: true,
		charlotte: true,
		priority: -114,
		trigger: {
			player: ["damageAfter", "damageZero"]
		},
		forced: true,
		init(player, skill) {
			let skills = {
				baonve: [],
				zhanshu: [],
				shengcun: [],
			};
			for (let i in lib.skill) {
				if (typeof lib.skill[i].yzsRG == "string") skills[lib.skill[i].yzsRG].push(i)
			}
			player.storage.rg_treasure = skills;
			player.markSkill("rg_treasure")
		},
		filter(event, player) {
			if (lib.config.extension_一中杀_yzs_rg === false) return false;
			if (!event.source) return false;
			let target = event.source;
			if (target.hasSkill("rg_treasure_ban")) return false;
			return target != player
		},
		async content(event, trigger, player) {
			let num = trigger.source.countMark("rg_treasure_targeted");
			trigger.source.addSkill("rg_treasure_targeted");
			trigger.source.addMark("rg_treasure_targeted", trigger.num > 0 ? 2 : 1, false);
			let nums = [2, 5,8];
			let goon = false;
			if (trigger.source.countMark("rg_treasure_targeted") >= nums[0] && num < nums[0]) goon = true;
			if (trigger.source.countMark("rg_treasure_targeted") >= nums[1] && num < nums[1]) goon = true;
			if (trigger.source.countMark("rg_treasure_targeted") >= nums[2] && num < nums[2]) goon = true;
			if (!goon) return;
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/flappybird_score.wav");
			let revive = Math.random() * (game.dead.length + 1 - player.countMark("rg_treasure_revive")) > 0.9;
			if (revive) {
				player.addMark("rg_treasure_revive", 1, false)
				await trigger.source.gain(game.createCard("guilai", "heart", 1))
				return;
			}
			let skills = player.storage.rg_treasure
			let vcards = [];
			let list = [];
			list[0] = skills.baonve.randomGet();
			list[1] = skills.zhanshu.randomGet();
			list[2] = skills.shengcun.randomGet();
			game.broadcastAll(list => {
				lib.translate["rg_baonveCard"] = lib.translate[list[0]]
				lib.translate["rg_baonveCard_info"] = lib.translate[list[0] + "_info"]
				lib.translate["rg_zhanshuCard"] = lib.translate[list[1]]
				lib.translate["rg_zhanshuCard_info"] = lib.translate[list[1] + "_info"]
				lib.translate["rg_shengcunCard"] = lib.translate[list[2]]
				lib.translate["rg_shengcunCard_info"] = lib.translate[list[2] + "_info"]
			}, list);
			vcards[0] = game.createCard("rg_baonveCard", "", "")
			vcards[1] = game.createCard("rg_zhanshuCard", "", "")
			vcards[2] = game.createCard("rg_shengcunCard", "", "")
			player.$throw(vcards);
			await new Promise(r => setTimeout(r, 1000))
			let nameList = [];
			nameList[0] = [`<span class="rg_baonve">暴虐</span>`, "", "rg_baonveCard"]
			nameList[1] = [`<span class="rg_zhanshu">战术</span>`, "", "rg_zhanshuCard"]
			nameList[2] = [`<span class="rg_shengcun">生存</span>`, "", "rg_shengcunCard"]
			if (!nameList.length) return;
			let result = await trigger.source.chooseButton(["请选择一项技能(重复则改为恢复1点体力并摸1张牌)", [nameList, "vcard"]])
				.set("forced", true)
				.set("selectButton", 1)
				.forResult();
			if (result.bool) {
				let names = ["rg_baonveCard", "rg_zhanshuCard", "rg_shengcunCard"]
				const index = names.indexOf(result.links[0][2]);
				trigger.source.$gain2(vcards[index]);
				if (trigger.source.hasSkill(list[index])) {
					await trigger.source.recover();
					await trigger.source.draw()
				} else {
					trigger.source.addSkill(list[index])
				}
			}
		},
	},
	rg_zheng: {
		yzsRG: `baonve`,
		usable: 2,
		logTarget: `source`,
		priority: -3,
		trigger: {
			player: "damageAfter"
		},
		filter(event, player) {
			if (!event.source) return false;
			if (event.source == player) return false;
			if (event.source.hasSkill("hidden_yzs")) return false;
			return true;
		},
		async content(event, trigger, player) {
			await player.chooseToUse(
				`【狰】：你可对 ${get.translation(trigger.source)} 使用1张【杀】`,
				function (card) {
					if (get.name(card) !== "sha") {
						return false;
					}
					return lib.filter.filterCard.apply(this, arguments);
				},
				function (card, player, target) {
					if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
						return false;
					}
					return lib.filter.targetEnabled.apply(this, arguments);
				}
			)
				.set("targetRequired", true)
				.set("complexSelect", true)
				.set("complexTarget", true)
				.set("sourcex", trigger.source)
				.set("addCount", false)
		},
	},
	rg_zhenzhu: {
		yzsRG: `shengcun`,
		usable: 1,
		forced: true,
		locked: false,
		priority: -4,
		trigger: {
			player: "recoverEnd"
		},
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			await player.changeHujia(1, "gain");
		}
	},
	rg_zhaocai: {
		yzsRG: `zhanshu`,
		priority: -5,
		forced: true,
		locked: false,
		trigger: {
			player: ["phaseZhunbeiBegin", "phaseJieshuBegin"]
		},
		async content(event, trigger, player) {
			await player.draw();
		}
	},
	rg_niehuo: {
		yzsRG: `shengcun`,
		priority: -5,
		forced: true,
		locked: false,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			return player.hp == 1;
		},
		async content(event, trigger, player) {
			await player.recover();
		}
	},
	rg_fuyi: {
		yzsRG: "shengcun",
		priority: -2,
		usable: 1,
		forced: true,
		locked: false,
		trigger: {
			source: "damageAfter"
		},
		filter(event, player) {
			return true
		},
		async content(event, trigger, player) {
			await player.recover();
			await player.draw();
		}
	},
	rg_xinyang: {
		yzsRG: "zhanshu",
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		priority: -6,
		forced: true,
		locked: false,
		usable: 10,
		filter(event, player) {
			if (player.countCards("h")) {
				return false;
			}
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		async content(event, trigger, player) {
			await player.draw();
		},
		ai: {
			threaten: 0.8,
			effect: {
				player_use(card, player, target) {
					if (player.countCards("h") === 1) {
						return [1, 0.8];
					}
				},
				target(card, player, target) {
					if (get.tag(card, "loseCard") && target.countCards("h") === 1) {
						return 0.5;
					}
				},
			},
			noh: true,
			freeSha: true,
			freeShan: true,
			skillTagFilter(player, tag) {
				if (player.countCards("h") !== 1) {
					return false;
				}
			},
		},
	},
	rg_gongzhen: {
		subSkill: {
			used: {
				charlotte: true,
				onremove: "storage",
				sub: true,
				sourceSkill: "rg_gongzhen",
			},
		},
		yzsRG: "baonve",
		priority: -3,
		trigger: {
			source: "damageAfter"
		},
		filter(event, player) {
			if (!event.card) return false;
			if (player.storage.rg_gongzhen_used?.includes(event.card.name)) return false;
			let evt = event.getParent(2);
			return evt?.targets?.length
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCardTarget()
				.set("filterTarget", (card, player, target) => {
					return _status.event.targets.includes(target) && !target.hasSkill("hidden_yzs");
				})
				.set("prompt", `【共振】：你可弃1张牌，然后对${get.translation(trigger.card)}的目标之一造成1点伤害`)
				.set("filterCard", lib.filter.cardDiscardable)
				.set("position", "h")
				.set('targets', trigger.getParent(2).targets)
				.set("ai2", target => {
					const player = get.player();
					return get.damageEffect(target, player, player)
				})
				.forResult();
		},
		async content(event, trigger, player) {
			player.addTempSkill("rg_gongzhen_used");
			player.markAuto("rg_gongzhen_used", [trigger.card.name]);
			await player.discard(event.cards)
			await event.targets[0].damage();
		}
	},
	rg_nuzhou: {
		subSkill: {
			buff: {
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return num + 1
						}
					},
				},
			},
		},
		yzsRG: "baonve",
		priority: -3,
		prompt2: `你可失去1点体力，然后你摸2张牌且本阶段出【杀】数+1`,
		trigger: {
			player: "phaseUseBegin"
		},
		check(event, player) {
			if (player.needsToDiscard(2) && !player.hasValueTarget({ name: "sha" }, false)) {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			await player.loseHp();
			await player.draw(2);
			player.addTempSkill("rg_nuzhou_buff", "phaseUseAfter")
		}
	},
	rg_shanghunniao: {
		group: "rg_shanghunniao_draw",
		subSkill: {
			draw: {
				direct: true,
				popup: true,
				charlotte: true,
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					return !event.numFixed && player.countMark("rg_shanghunniao") > 0;
				},
				async content(event, trigger, player) {
					trigger.num += player.countMark("rg_shanghunniao");
				},
			},
		},
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + player.countMark("rg_shanghunniao")
				}
			},
		},
		nobracket: true,
		yzsRG: "zhanshu",
		priority: -3,
		direct: true,
		popup: true,
		trigger: {
			global: "die"
		},
		filter(event, player) {
			return event.player != player && !event.player.storage.isSub
		},
		async content(event, trigger, player) {
			await player.recover(2);
			player.addMark("rg_shanghunniao", 1, false)
		}
	},
	rg_yuanhu: {
		yzsRG: "zhanshu",
		usable: 1,
		priority: -1,
		trigger: {
			global: "damageBegin4",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (event.player.hasSkill("hidden_yzs")) return false;
			if (event.source == player) return false;
			if (player.countCards("he") < 1) return false;
			return true;
		},
		async cost(event, trigger, player) {
			let str = `【援护】：你可弃置1张牌，然后无效 ` + get.translation(trigger.player) + ` 受到的伤害，并受到`;
			if (trigger.source) {
				str += ` ` + get.translation(trigger.source) + ` 造成的` + trigger.num + `点伤害`
			} else {
				str += trigger.num + `点无来源伤害`
			}
			let next = player.chooseToDiscard(player, "he", false);
			next.set("ai", card => {
				const player = get.event().player;
				const target = get.event().target;
				if (get.attitude(player, target) <= 0) return 0;
				return 6 - get.value(card);
			})
			next.set("target", trigger.player)
			next.set("prompt", str)
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			trigger.player = player;
		},
	},
	rg_mumei: {
		yzsRG: "zhanshu",
		priority: -1,
		logTarget: "source",
		usable: 1,
		prompt2(event, player) {
			if (!event.source) return `错误：没有伤害来源`
			let num = event.source.getHistory("sourceDamage").length
			return `你可弃置 ${get.translation(event.source)} 至多${num}张牌`
		},
		trigger: {
			global: "damageAfter"
		},
		filter(event, player) {
			return event.source && event.source != player && event.source.countCards("he") && !event.source.hasSkill("hidden_yzs");
		},
		check(event, player) {
			return get.effect(event.source, { name: "guohe" }, player, player) > 0;
		},
		async content(event, trigger, player) {
			let num = trigger.source.getHistory("sourceDamage").length
			await player.discardPlayerCard(trigger.source, 'he', [1, num])
		}
	},
	rg_tonghui: {
		yzsRG: "zhanshu",
		priority: -1,
		usable: 1,
		trigger: {
			player: "drawAfter"
		},
		filter(event, player) {
			return event.num > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget(`【同辉】：你可令至多${trigger.num}名角色摸1张牌`, [1, trigger.num])
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs")
				})
				.set("ai", target => {
					const player = get.player();
					return get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let targets = event.targets.sortBySeat();
			for (let target of targets) {
				await target.draw();
			}
		}
	},
	rg_dizang: {
		yzsRG: "shengcun",
		priority: -2,
		usable: 1,
		trigger: {
			player: "changeHpAfter"
		},
		filter(event, player) {
			return event.num < 0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget(`【地藏】：你可令至多${-trigger.num}名角色获得1点护甲`, [1, -trigger.num])
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs")
				})
				.set("ai", target => {
					const player = get.player();
					return get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			for (let target of event.targets) {
				await target.changeHujia(1, "gain")
			}
		},
	},
	rg_chunniang: {
		yzsRG: `shengcun`,
		usable: 1,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.countCards("h")) {
				return false;
			}
			const list = ["jiu", "tao"]
			for (var i of list) {
				if (event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				const list = ["jiu", "tao"]
				var list2 = [];
				for (var i of list) {
					var type = get.type2(i, false);
					if (event.filterCard(get.autoViewAs({ name: i, storage: { qiuwen_yzs: true } }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("醇酿", [list2, "vcard"]);
			},
			check(button) {
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
					},
					async precontent(event, trigger, player) {
						player.logSkill("rg_chunniang");
					},
				};
			},
			prompt(links, player) {
				return "将1张手牌当做【" + get.translation(links[0][2]) + "】使用";
			},
		},
		ai: {
			order: 5,
			result: {
				player: 2
			}
		}
	},
	rg_huajing: {
		group: "rg_huajing_begin",
		subSkill: {
			begin: {
				priority: -3,
				trigger: {
					global: "phaseBegin",
				},
				filter(event, player) {
					return player.countCards("h") > 0 && player.hasUseTarget({ name: "jiu", isCard: false });
				},
				async cost(event, trigger, player) {
					let prompt2 = "你可将1张手牌当做" + get.translation("jiu") + "使用";
					event.result = await player.chooseCard(false)
						.set("prompt", "化境")
						.set("prompt2", prompt2)
						.set("position", "h")
						.set("ai", card => 4 - get.value(card))
						.forResult()
				},
				async content(event, trigger, player) {
					await player.chooseUseTarget(event.cards, { name: "jiu", isCard: false }, true);
				},
			}
		},
		yzsRG: `baonve`,
		priority: -5,
		direct: true,
		popup: true,
		trigger: {
			global: "phaseEnd"
		},
		filter(event, player) {
			return !player.hasHistory("damage") && player.hasSkill("jiu");
		},
		async content(event, trigger, player) {
			let result = await player.chooseToUse(
				"【化境】：你可使用1张【杀】",
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
				.set("addCount", false)
				.forResult();
		}
	},
	rg_shiminggan: {
		nobracket: true,
		yzsRG: "zhanshu",
		usable: 1,
		forced: true,
		locked: false,
		priority: -2,
		trigger: {
			global: "damageEnd"
		},
		filter(event, player) {
			return !event.player.hasSkill("hidden_yzs") && event.player != player;
		},
		async content(event, trigger, player) {
			await player.draw(2);
			while (true) {
				let result = await player.chooseCard(
					`【使命感】：你可对 ${get.translation(trigger.player)} 使用任意张非伤害手牌(无次数距离限制)`,
					function (card) {
						if (get.is.damageCard(card)) {
							return false;
						}
						let target = get.event().target
						if (!game.checkMod(card, player, target, "unchanged", "playerEnabled", player)) return false;
						if (!game.checkMod(card, player, target, "unchanged", "targetEnabled", target)) return false;;
						return lib.filter.filterCard.apply(this, arguments);
					},
				)
					.set("target", trigger.player)
					.set("addCount", false)
					.forResult();
				if (!result.bool) break;
				await player.useCard(result.cards, trigger.player)
			}
			if (player.isIn() && player.countCards("h") > 0) {
				await player.chooseToDiscard(2, "h", true);
			}
		}
	},
	rg_xuedizi: {
		nobracket: true,
		yzsRG: `baonve`,
		priority: -5,
		trigger: {
			player: "drawAfter"
		},
		usable: 1,
		frequent: true,
		prompt2: `你可展示摸到的牌并使用其中的任意张【杀】`,
		filter(event, player) {
			return event.result.cards.some(card => get.name(card, player) == "sha")
		},
		async content(event, trigger, player) {
			let cards = trigger.result.cards;
			await player.showCards(cards, `【血滴子】展示牌`);
			while (cards.some(i => get.name(i, player) == "sha" && player.hasUseTarget(i))) {
				let result = await player
					.chooseButton(["血滴子：你可使用其中的一张【杀】？", cards])
					.set("filterButton", (button, player) => {
						if (get.name(button.link, player) != 'sha') return false;
						return _status.event.player.hasUseTarget(button.link);
					})
					.forResult();
				if (!result.bool) break;
				let card = result.links[0];
				cards.remove(card);
				await player.chooseUseTarget(true, card, false);
			}
		}
	},
	//肉鸽技能
	//星熊勇仪
	dajiangshanlan_yzs: {
		nobracket: true,
		locked: true,
		forced: true,
		popup: false,
		priority: 1,
		trigger: {
			player: "useCard1",
		},
		filter(event, player) {
			return event.card && event.card.name == "sha" && player.hasSkill("jiu");
		},
		async content(event, trigger, player) {
			if (trigger.addCount !== false) {
				trigger.addCount = false;
				trigger.player.getStat("card")[trigger.card.name]--;
			}
		},
		mod: {
			targetInRange: function (card, player) {
				if (player.hasSkill("jiu") && card.name == "sha") return true;
			},
			cardUsable(card, player, num) {
				if (player.hasSkill("jiu") && card.name == "sha") return true;
			},
		},
		ai: {
			jiuSustain: true,
			skillTagFilter(player, tag, arg) {
				if (arg != "phase") return false;
			},
		},
	},
	sanbubisha_yzs: {
		group: ["sanbubisha_yzs_sha", "sanbubisha_yzs_start"],
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
					player.setMark("sanbubisha_yzs", 3, false)
				},
				sub: true,
				sourceSkill: "sanbubisha_yzs",
				"_priority": 0,
				"skill_id": "sanbubisha_yzs_start",
			},
			sha: {
				forced: true,
				priority: 2,
				trigger: {
					player: "useCard"
				},
				filter(event, player) {
					return event.card.name == "sha" && !player.countMark("sanbubisha_yzs")
				},
				async content(event, trigger, player) {
					player.setMark("sanbubisha_yzs", 3, false)
					await player.draw(3);
					trigger.directHit.addArray(game.filterPlayer())
				}
			}
		},
		nobracket: true,
		locked: true,
		marktext: "酒",
		intro: {
			name: "三步必杀",
			"name2": "三步必杀",
			content: "还可视为使用$张【酒】",
		},
		enable: "chooseToUse",
		viewAs: {
			name: "jiu",
			isCard: true,
		},
		viewAsFilter(player) {
			return player.countMark("sanbubisha_yzs") > 0;
		},
		filter(event, player) {
			return player.countMark("sanbubisha_yzs") > 0;
		},
		filterCard: () => false,
		selectCard: -1,
		log: false,
		precontent() {
			player.removeMark("sanbubisha_yzs", 1, false);
			player.logSkill("sanbubisha_yzs");
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
	guiqikuanglan_yzs: {
		subSkill: {
			buff: {
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "jiu") {
							return num + 1
						}
					},
				},
			},
		},
		nobracket: true,
		locked: true,
		forced: true,
		juexingji: true,
		skillAnimation: true,
		animationColor: "fire",
		priority: 3,
		trigger: {
			source: "damageEnd",
		},
		filter(event, player) {
			return event.num >= 4;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.addSkill("guiqikuanglan_yzs_buff")
		}
	},
	//博丽灵梦
	dajiejie_yzs: {
		group: ["dajiejie_yzs_phase", "dajiejie_yzs_use"],
		subSkill: {
			phase: {
				sub: true,
				sourceSkill: "dajiejie_yzs",
				locked: true,
				forced: true,
				name: "珠符「明珠暗投」",
				priority: 2,
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.countMark("Fuka_yzs") < get.character(player.name).Fuka
				},
				async content(event, trigger, player) {
					player.addMark("Fuka_yzs", 1);
				},
			},
			use: {
				name: "灵符「梦想妙珠」",
				sub: true,
				sourceSkill: "dajiejie_yzs",
				direct: true,
				popup: true,
				priority: 2,
				trigger: {
					player: ["useCard", "respond"],
				},
				filter(event, player) {
					return get.color(event.card) == "red" && player.countMark("Fuka_yzs") < get.character(player.name).Fuka && player.hasSkill("InBarrier_yzs_skill")
				},
				async content(event, trigger, player) {
					player.addMark("Fuka_yzs", 1);
				},
			}
		},
		locked: true,
		nobracket: true,
		unique: true,
		forced: true,
		priority: 1241,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			game.broadcastAll(() => {
				if (_status.dajiejie_yzs_distance) return;
				if (typeof get.distance === 'function') {
					_status.dajiejie_yzs_distance = true;
					get.distance = function (from, to, method) {
						if (from == to) {
							return 0;
						}
						if (!game.players.includes(from) && !game.dead.includes(from)) {
							return Infinity;
						}
						if (!game.players.includes(to) && !game.dead.includes(to)) {
							return Infinity;
						}
						let n = 1;
						let l_hasBarrier = false, r_hasBarrier = false;
						let p = from;
						p = from.nextSeat;
						while (p != to) {
							if (p.hasSkill("InfinityDistance_yzs")) {
								r_hasBarrier = true;
								break;
							}
							p = p.nextSeat;
						}
						p = from.previousSeat;
						while (p != to) {
							if (p.hasSkill("InfinityDistance_yzs")) {
								l_hasBarrier = true;
								break;
							}
							p = p.previousSeat;
						}
						if (game.chess) {
							let fxy = from.getXY(), txy = to.getXY();
							n = Math.abs(fxy[0] - txy[0]) + Math.abs(fxy[1] - txy[1]);
							if (method == "raw" || method == "pure" || method == "absolute") {
								return n;
							}
						} else if (to.isMin(true) || from.isMin(true)) {
							if (method == "raw" || method == "pure" || method == "absolute") {
								return n;
							}
						} else {
							let player = from, length = game.players.length;
							const totalPopulation = game.players.length + game.dead.length + 1;
							for (let iwhile = 0; iwhile < totalPopulation; iwhile++) {
								if (player.nextSeat != to) {
									player = player.nextSeat;
									if (player.isAlive() && !player.isOut() && !player.hasSkill("undist") && !player.isMin(true)) {
										n++;
									}
								} else {
									break;
								}
							}
							for (let i = 0; i < game.players.length; i++) {
								if (game.players[i].isOut() || game.players[i].hasSkill("undist") || game.players[i].isMin(true)) {
									length--;
								}
							}
							if (method == "absolute") {
								return n;
							}
							if (from.isDead()) {
								length++;
							}
							if (to.isDead()) {
								length++;
							}
							const left = from.hasSkillTag("left_hand"), right = from.hasSkillTag("right_hand");
							let l = length - n, r = n;
							if (l_hasBarrier) l = Infinity;
							if (r_hasBarrier) r = Infinity;
							if (left === right) {
								n = Math.min(r, l);
							} else if (left == true) {
								n = l;
							}
							if (method == "raw" || method == "pure") {
								return n;
							}
						}
						n = game.checkMod(from, to, n, "globalFrom", from);
						n = game.checkMod(from, to, n, "globalTo", to);
						const equips1 = from.getVCards("e", function (card) {
							return !card.cards?.some((card2) => {
								return ui.selected.cards?.includes(card2);
							});
						}), equips2 = to.getVCards("e", function (card) {
							return !card.cards?.some((card2) => {
								return ui.selected.cards?.includes(card2);
							});
						});
						for (let i = 0; i < equips1.length; i++) {
							let info = get.info(equips1[i]).distance;
							if (!info) {
								continue;
							}
							if (info.globalFrom) {
								n += info.globalFrom;
							}
						}
						for (let i = 0; i < equips2.length; i++) {
							let info = get.info(equips2[i]).distance;
							if (!info) {
								continue;
							}
							if (info.globalTo) {
								n += info.globalTo;
							}
							if (info.attackTo) {
								m += info.attackTo;
							}
						}
						if (method == "attack") {
							let m2 = n;
							m2 = game.checkMod(from, to, m2, "attackFrom", from);
							m2 = game.checkMod(from, to, m2, "attackTo", to);
							return m2;
						} else if (method == "unchecked") {
							return n;
						}
						return Math.max(1, n);
					}
				}
				if (typeof game.swapSeat === 'function') {
					// 1. 备份原始的 swapSeat 函数
					const origin_swapSeat = game.swapSeat;

					// 2. 重写该函数
					game.swapSeat = async function (player1, player2, prompt, behind, noanimate) {
						// 3. 执行原始逻辑（使用 apply 确保 this 指向正确，并传递所有参数）
						const result = origin_swapSeat.apply(this, arguments);
						if (game.online) return;
						// 4. 执行你要求的结算函数
						if (lib.skill.Reimu_yzs_Barrier_yzs_skill &&
							typeof lib.skill.Reimu_yzs_Barrier_yzs_skill.settle === 'function') {
							await lib.skill.Reimu_yzs_Barrier_yzs_skill.settle();
						}

						// 5. 返回原函数的执行结果（虽然 swapSeat 通常不返回值，但这是好的编程习惯）
						return result;
					};
				}
				for (let target of game.filterPlayer2()) {
					if (typeof target.inRange === 'function') target.inRange = function (to) {
						const from = this;
						if (from == to || from.hasSkill("undist") || to.hasSkill("undist")) {
							return false;
						}
						if (!game.players.includes(from) && !game.dead.includes(from)) {
							return false;
						}
						if (!game.players.includes(to) && !game.dead.includes(to)) {
							return false;
						}
						const mod1 = game.checkMod(from, to, "unchanged", "inRange", from);
						if (mod1 != "unchanged") {
							return mod1;
						}
						const mod2 = game.checkMod(from, to, "unchanged", "inRangeOf", to);
						if (mod2 != "unchanged") {
							return mod2;
						}
						const range = from.getAttackRange();
						if (range < 1) {
							return false;
						}
						let player = from, m, n = 1;
						let l_hasBarrier = false, r_hasBarrier = false;
						let p = from;
						p = from.nextSeat;
						while (p != to) {
							if (p.hasSkill("InfinityDistance_yzs")) {
								r_hasBarrier = true;
								break;
							}
							p = p.nextSeat;
						}
						p = from.previousSeat;
						while (p != to) {
							if (p.hasSkill("InfinityDistance_yzs")) {
								l_hasBarrier = true;
								break;
							}
							p = p.previousSeat;
						}
						let fxy, txy;
						if (game.chess) {
							fxy = from.getXY();
							txy = to.getXY();
							n = Math.abs(fxy[0] - txy[0]) + Math.abs(fxy[1] - txy[1]);
						} else if (to.isMin(true) || from.isMin(true)) {
						} else {
							let length = game.players.length;
							let totalPopulation = game.players.length + game.dead.length + 1;
							for (let iwhile = 0; iwhile < totalPopulation; iwhile++) {
								if (player.nextSeat != to) {
									player = player.nextSeat;
									if (player.isAlive() && !player.isOut() && !player.hasSkill("undist") && !player.isMin(true)) {
										n++;
									}
								} else {
									break;
								}
							}
							for (let i = 0; i < game.players.length; i++) {
								if (game.players[i].isOut() || game.players[i].hasSkill("undist") || game.players[i].isMin(true)) {
									length--;
								}
							}
							if (from.isDead()) {
								length++;
							}
							if (to.isDead()) {
								length++;
							}
							let left = from.hasSkillTag("left_hand");
							let right = from.hasSkillTag("right_hand");
							let l = length - n, r = n;
							if (l_hasBarrier) l = Infinity;
							if (r_hasBarrier) r = Infinity;
							if (left === right) {
								n = Math.min(r, l);
							} else if (left == true) {
								n = l;
							}
						}
						n = game.checkMod(from, to, n, "globalFrom", from);
						n = game.checkMod(from, to, n, "globalTo", to);
						m = n;
						m = game.checkMod(from, to, m, "attackFrom", from);
						m = game.checkMod(from, to, m, "attackTo", to);
						const equips1 = from.getVCards("e", function (card) {
							return !card.cards?.some((card2) => {
								return ui.selected.cards?.includes(card2);
							});
						}), equips2 = to.getVCards("e", function (card) {
							return !card.cards?.some((card2) => {
								return ui.selected.cards?.includes(card2);
							});
						});
						for (let i = 0; i < equips1.length; i++) {
							const info = get.info(equips1[i]).distance;
							if (!info) {
								continue;
							}
							if (info.globalFrom) {
								m += info.globalFrom;
								n += info.globalFrom;
							}
						}
						for (let i = 0; i < equips2.length; i++) {
							const info = get.info(equips2[i]).distance;
							if (!info) {
								continue;
							}
							if (info.globalTo) {
								m += info.globalTo;
								n += info.globalTo;
							}
							if (info.attackTo) {
								m += info.attackTo;
							}
						}
						return m <= range;
					}
				}
			});
			if (!_status.postReconnect.dajiejie_yzs) {
				_status.postReconnect.dajiejie_yzs = [
					function () {
						if (_status.dajiejie_yzs_distance) return;
						if (typeof get.distance === 'function') {
							_status.dajiejie_yzs_distance = true;
							get.distance = function (from, to, method) {
								if (from == to) {
									return 0;
								}
								if (!game.players.includes(from) && !game.dead.includes(from)) {
									return Infinity;
								}
								if (!game.players.includes(to) && !game.dead.includes(to)) {
									return Infinity;
								}
								let n = 1;
								let l_hasBarrier = false, r_hasBarrier = false;
								let p = from;
								p = from.nextSeat;
								while (p != to) {
									if (p.hasSkill("InfinityDistance_yzs")) {
										r_hasBarrier = true;
										break;
									}
									p = p.nextSeat;
								}
								p = from.previousSeat;
								while (p != to) {
									if (p.hasSkill("InfinityDistance_yzs")) {
										l_hasBarrier = true;
										break;
									}
									p = p.previousSeat;
								}
								if (game.chess) {
									let fxy = from.getXY(), txy = to.getXY();
									n = Math.abs(fxy[0] - txy[0]) + Math.abs(fxy[1] - txy[1]);
									if (method == "raw" || method == "pure" || method == "absolute") {
										return n;
									}
								} else if (to.isMin(true) || from.isMin(true)) {
									if (method == "raw" || method == "pure" || method == "absolute") {
										return n;
									}
								} else {
									let player = from, length = game.players.length;
									const totalPopulation = game.players.length + game.dead.length + 1;
									for (let iwhile = 0; iwhile < totalPopulation; iwhile++) {
										if (player.nextSeat != to) {
											player = player.nextSeat;
											if (player.isAlive() && !player.isOut() && !player.hasSkill("undist") && !player.isMin(true)) {
												n++;
											}
										} else {
											break;
										}
									}
									for (let i = 0; i < game.players.length; i++) {
										if (game.players[i].isOut() || game.players[i].hasSkill("undist") || game.players[i].isMin(true)) {
											length--;
										}
									}
									if (method == "absolute") {
										return n;
									}
									if (from.isDead()) {
										length++;
									}
									if (to.isDead()) {
										length++;
									}
									const left = from.hasSkillTag("left_hand"), right = from.hasSkillTag("right_hand");
									let l = length - n, r = n;
									if (l_hasBarrier) l = Infinity;
									if (r_hasBarrier) r = Infinity;
									if (left === right) {
										n = Math.min(r, l);
									} else if (left == true) {
										n = l;
									}
									if (method == "raw" || method == "pure") {
										return n;
									}
								}
								n = game.checkMod(from, to, n, "globalFrom", from);
								n = game.checkMod(from, to, n, "globalTo", to);
								const equips1 = from.getVCards("e", function (card) {
									return !card.cards?.some((card2) => {
										return ui.selected.cards?.includes(card2);
									});
								}), equips2 = to.getVCards("e", function (card) {
									return !card.cards?.some((card2) => {
										return ui.selected.cards?.includes(card2);
									});
								});
								for (let i = 0; i < equips1.length; i++) {
									let info = get.info(equips1[i]).distance;
									if (!info) {
										continue;
									}
									if (info.globalFrom) {
										n += info.globalFrom;
									}
								}
								for (let i = 0; i < equips2.length; i++) {
									let info = get.info(equips2[i]).distance;
									if (!info) {
										continue;
									}
									if (info.globalTo) {
										n += info.globalTo;
									}
									if (info.attackTo) {
										m += info.attackTo;
									}
								}
								if (method == "attack") {
									let m2 = n;
									m2 = game.checkMod(from, to, m2, "attackFrom", from);
									m2 = game.checkMod(from, to, m2, "attackTo", to);
									return m2;
								} else if (method == "unchecked") {
									return n;
								}
								return Math.max(1, n);
							}
						}
						if (typeof game.swapSeat === 'function') {
							// 1. 备份原始的 swapSeat 函数
							const origin_swapSeat = game.swapSeat;

							// 2. 重写该函数
							game.swapSeat = async function (player1, player2, prompt, behind, noanimate) {
								// 3. 执行原始逻辑（使用 apply 确保 this 指向正确，并传递所有参数）
								const result = origin_swapSeat.apply(this, arguments);
								if (game.online) return;
								// 4. 执行你要求的结算函数
								if (lib.skill.Reimu_yzs_Barrier_yzs_skill &&
									typeof lib.skill.Reimu_yzs_Barrier_yzs_skill.settle === 'function') {
									await lib.skill.Reimu_yzs_Barrier_yzs_skill.settle();
								}

								// 5. 返回原函数的执行结果（虽然 swapSeat 通常不返回值，但这是好的编程习惯）
								return result;
							};
						}
						for (let target of game.filterPlayer2()) {
							if (typeof target.inRange === 'function') target.inRange = function (to) {
								const from = this;
								if (from == to || from.hasSkill("undist") || to.hasSkill("undist")) {
									return false;
								}
								if (!game.players.includes(from) && !game.dead.includes(from)) {
									return false;
								}
								if (!game.players.includes(to) && !game.dead.includes(to)) {
									return false;
								}
								const mod1 = game.checkMod(from, to, "unchanged", "inRange", from);
								if (mod1 != "unchanged") {
									return mod1;
								}
								const mod2 = game.checkMod(from, to, "unchanged", "inRangeOf", to);
								if (mod2 != "unchanged") {
									return mod2;
								}
								const range = from.getAttackRange();
								if (range < 1) {
									return false;
								}
								let player = from, m, n = 1;
								let l_hasBarrier = false, r_hasBarrier = false;
								let p = from;
								p = from.nextSeat;
								while (p != to) {
									if (p.hasSkill("InfinityDistance_yzs")) {
										r_hasBarrier = true;
										break;
									}
									p = p.nextSeat;
								}
								p = from.previousSeat;
								while (p != to) {
									if (p.hasSkill("InfinityDistance_yzs")) {
										l_hasBarrier = true;
										break;
									}
									p = p.previousSeat;
								}
								let fxy, txy;
								if (game.chess) {
									fxy = from.getXY();
									txy = to.getXY();
									n = Math.abs(fxy[0] - txy[0]) + Math.abs(fxy[1] - txy[1]);
								} else if (to.isMin(true) || from.isMin(true)) {
								} else {
									let length = game.players.length;
									let totalPopulation = game.players.length + game.dead.length + 1;
									for (let iwhile = 0; iwhile < totalPopulation; iwhile++) {
										if (player.nextSeat != to) {
											player = player.nextSeat;
											if (player.isAlive() && !player.isOut() && !player.hasSkill("undist") && !player.isMin(true)) {
												n++;
											}
										} else {
											break;
										}
									}
									for (let i = 0; i < game.players.length; i++) {
										if (game.players[i].isOut() || game.players[i].hasSkill("undist") || game.players[i].isMin(true)) {
											length--;
										}
									}
									if (from.isDead()) {
										length++;
									}
									if (to.isDead()) {
										length++;
									}
									let left = from.hasSkillTag("left_hand");
									let right = from.hasSkillTag("right_hand");
									let l = length - n, r = n;
									if (l_hasBarrier) l = Infinity;
									if (r_hasBarrier) r = Infinity;
									if (left === right) {
										n = Math.min(r, l);
									} else if (left == true) {
										n = l;
									}
								}
								n = game.checkMod(from, to, n, "globalFrom", from);
								n = game.checkMod(from, to, n, "globalTo", to);
								m = n;
								m = game.checkMod(from, to, m, "attackFrom", from);
								m = game.checkMod(from, to, m, "attackTo", to);
								const equips1 = from.getVCards("e", function (card) {
									return !card.cards?.some((card2) => {
										return ui.selected.cards?.includes(card2);
									});
								}), equips2 = to.getVCards("e", function (card) {
									return !card.cards?.some((card2) => {
										return ui.selected.cards?.includes(card2);
									});
								});
								for (let i = 0; i < equips1.length; i++) {
									const info = get.info(equips1[i]).distance;
									if (!info) {
										continue;
									}
									if (info.globalFrom) {
										m += info.globalFrom;
										n += info.globalFrom;
									}
								}
								for (let i = 0; i < equips2.length; i++) {
									const info = get.info(equips2[i]).distance;
									if (!info) {
										continue;
									}
									if (info.globalTo) {
										m += info.globalTo;
										n += info.globalTo;
									}
									if (info.attackTo) {
										m += info.attackTo;
									}
								}
								return m <= range;
							}
						}
					},
					[],
				];
			}
			if (game.countPlayer(function (current) {
				return current.name == 'Reimu_yzs_Barrier_yzs';
			})) return;
			let result = await player.chooseTarget()
				.set("filterTarget", function (card, player, target) {
					return true
				})
				.set("forced", true)
				.set("prompt", "大结界")
				.set("prompt2", "在目标角色下家召唤“结界”")
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
			if (!result.bool) return;
			const pos = result.targets[0];
			if (!_status.dajiejie_yzs) {
				if (!game.checkResult_dajiejie_yzs) {
					game.checkResult_dajiejie_yzs = game.checkResult;
					game.checkResult = function () {
						const targets = game.players.filter(i => i.isNoPlayer_dajiejie_yzs);
						game.players.removeArray(targets);
						game.checkResult_dajiejie_yzs();
						game.players.addArray(targets);
					};
				}
				if (!game.checkOnlineResult_dajiejie_yzs) {
					game.checkOnlineResult_dajiejie_yzs = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						const targets = game.players.filter(i => i.isNoPlayer_dajiejie_yzs);
						game.players.removeArray(targets);
						game.checkOnlineResult_dajiejie_yzs(player);
						game.players.addArray(targets);
					};
				}
				game.broadcastAll(() => {
					_status.dajiejie_yzs = true;
				})
			}
			if (!get.attitude_dajiejie_yzs) {
				get.attitude_dajiejie_yzs = get.attitude;
				get.attitude = function (from, to) {
					if (from && from?.getStorage("dajiejie_yzs_source", false)) {
						from = from.getStorage("dajiejie_yzs_source", false);
					}
					if (to && to?.getStorage("dajiejie_yzs_source", false)) {
						to = to.getStorage("dajiejie_yzs_source", false);
					}
					let att = get.attitude_dajiejie_yzs(from, to);
					return att;
				};
			}
			const Barrier_yzs = await game.addPlayerOL(pos, "Reimu_yzs_Barrier_yzs", null, true);
			game.broadcastAll((Barrier_yzs) => {
				Barrier_yzs.isNoPlayer_dajiejie_yzs = true;
				Barrier_yzs.dieAfter = function () { };
				Barrier_yzs.dieAfter2 = function () { };
			}, Barrier_yzs)
			Barrier_yzs.setStorage("dajiejie_yzs_source", player);
			Barrier_yzs.ai.modAttitudeFrom = function (from, to, att) {
				if (_status.dajiejie_yzs_source_att_ing) return att;
				if (from.getStorage("dajiejie_yzs_source", false)) {
					from = from.getStorage("dajiejie_yzs_source", false);
				}
				if (to.getStorage("dajiejie_yzs_source", false)) {
					to = to.getStorage("dajiejie_yzs_source", false);
				}
				_status.dajiejie_yzs_source_att_ing = true;
				att = get.attitude(from, to);
				delete _status.dajiejie_yzs_source_att_ing;
				return att;
			};
			game.broadcastAll((Barrier_yzs, player) => {
				if (get.mode() == 'guozhan') {
					if (Barrier_yzs.name2 == undefined) Barrier_yzs.name2 = Barrier_yzs.name1;
				}
				if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
					Barrier_yzs.side = player.side;
					Barrier_yzs.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
					Barrier_yzs.node.identity.dataset.color = player.node.identity.dataset.color;
				}
				Barrier_yzs.skillH = [];
				Barrier_yzs.storage.zhibi = [];
				Barrier_yzs.storage.stratagem_expose = [];
				Barrier_yzs.storage.stratagem_fury = 0;
			}, Barrier_yzs, player);
			Barrier_yzs.storage.isSub = true;
			Barrier_yzs.markSkill("isSub");
			Barrier_yzs
				.when({ global: "die" })
				.filter((evt, player2) => {
					if (evt.reserveOut) return false;
					return evt.player == player || evt.player == player2;
				})
				.assign({
					forceDie: true,
				})
				.step(lib.skill[event.name].dieRemove);
			const disables = [];
			for (let i = 1; i <= 5; i++) {
				for (let j = 0; j < player.countEnabledSlot(i); j++) {
					disables.push(i);
				}
			}
			if (disables.length > 0) {
				await Barrier_yzs.disableEquip(disables);
			}
			await Barrier_yzs.disableJudge();
			game.log(player, '召唤了', lib.translate['Reimu_yzs_Barrier_yzs']);
			game.broadcastAll(() => {
				_status.tempMusic = `ext:一中杀/audio/神々が恋した幻想郷.mp3`;
				game.playBackgroundMusic();
				ui.backgroundMusic.addEventListener('ended', () => {
					delete _status.tempMusic;
					game.playBackgroundMusic();
				}, { once: true });
			});
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
	},
	erchongjiejie_yzs: {
		group: ["erchongjiejie_yzs_die", "erchongjiejie_yzs_draw", "erchongjiejie_yzs_hujia"],
		subSkill: {
			hujia: {
				name: "梦境「二重大结界」",
				locked: true,
				charlotte: true,
				unique: true,
				trigger: {
					global: ["chooseToRespondBefore", "chooseToUseBefore"],
				},
				filter(event, player) {
					if (event.player.name != "Reimu_yzs_subBarrier_yzs") return false;
					if (event.responded) {
						return false;
					}
					if (event.player.storage.hujiaing) {
						return false;
					}
					let evt = event;
					for (const name of lib.inpile) {
						const card = { name: name, isCard: true };
						if (evt.filterCard(card, evt.player, evt)) return true;
						if (name == "sha") {
							for (const nature of lib.inpile_nature) {
								card.nature = nature;
								if (evt.filterCard(card, evt.player, evt)) return true;
							}
						}
					}
					return false;
				},
				async cost(event, trigger, player) {
					event.result = { bool: false };
					if ((player == game.me && !_status.auto) || get.attitude(player, trigger.player) > 2 || player.isOnline()) {
						let evt = trigger;
						const vcards = get.inpileVCardList(info => {
							const card = { name: info[2], nature: info[3], isCard: true };
							return evt.filterCard(card, evt.player, evt);
						});
						if (!vcards.length) {
							return;
						};
						let result = await player.chooseButton(["请选择你想替 子结界 使用或打出的牌", [vcards, "vcard"]])
							.set("forced", false)
							.forResult();
						if (!result.bool) return;
						event.result = { bool: true, cost_data: result.links[0] };
					}
				},
				async content(event, trigger, player) {
					const request = event.cost_data;
					trigger.player.storage.hujiaing = true;
					const result = await player.chooseToRespond(`替 子结界 打出一张${(get.translation(request[3]) || '')}${get.translation(request[2])}`, {
						name: request[2],
						nature: request[3]
					})
						.set("ai", () => {
							const event = _status.event;
							return get.attitude(player, trigger.player) - 2;
						})
						.set("skillwarn", `替 子结界 打出一张${(get.translation(request[3]) || '')}${get.translation(request[2])}`)
						.set("autochoose", lib.filter.autoRespondShan)
						.set("source", trigger.player)
						.forResult();
					let bool = result.bool;
					trigger.player.storage.hujiaing = false;
					if (!bool) return;
					trigger.result = { bool: true, card: { name: request[2], nature: request[3], isCard: true } };
					trigger.responded = true;
					trigger.animate = false;
				},
			},
			draw: {
				name: "梦境「二重大结界」",
				locked: true,
				priority: 4,
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.hasSkill("InBarrier_yzs_skill")
				},
				async content(event, trigger, player) {
					trigger.num += 2;
				},
				ai: {
					threaten: 1.3,
				},
			},
			die: {
				name: `梦符「幻想一重」`,
				locked: true,
				forced: true,
				priority: 3,
				trigger: { global: "die" },
				forceOut: true,
				filter(event, player) {
					return event.player.name == "Reimu_yzs_subBarrier_yzs"
				},
				async content(event, trigge, player) {
					if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs", 1);
				}
			},
		},
		locked: true,
		nobracket: true,
		unique: true,
		prompt: `在目标角色下家召唤“子结界”`,
		enable: "phaseUse",
		filter: function (event, player) {
			if (player.countMark("Fuka_yzs") < 1) return false;
			return !game.hasPlayer(function (current) {
				return current.name == 'Reimu_yzs_subBarrier_yzs';
			});
		},
		filterTarget(card, player, target) {
			return true;
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			if (game.countPlayer(function (current) {
				return current.name == 'Reimu_yzs_subBarrier_yzs';
			})) return;
			let result = await player.chooseButton([
				`选择子结界的朝向`,
				[
					[
						["clockwise", "顺时针"],
						["counterclockwise", "逆时针"],
					],
					"tdnodes",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.forResult();
			if (!result.bool) return
			const direction = result.links[0];
			const pos = event.targets[0];
			if (!_status.dajiejie_yzs) {
				if (!game.checkResult_dajiejie_yzs) {
					game.checkResult_dajiejie_yzs = game.checkResult;
					game.checkResult = function () {
						const targets = game.players.filter(i => i.isNoPlayer_dajiejie_yzs);
						game.players.removeArray(targets);
						game.checkResult_dajiejie_yzs();
						game.players.addArray(targets);
					};
				}
				if (!game.checkOnlineResult_dajiejie_yzs) {
					game.checkOnlineResult_dajiejie_yzs = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						const targets = game.players.filter(i => i.isNoPlayer_dajiejie_yzs);
						game.players.removeArray(targets);
						game.checkOnlineResult_dajiejie_yzs(player);
						game.players.addArray(targets);
					};
				}
				game.broadcastAll(() => {
					_status.dajiejie_yzs = true;
				})
			}
			if (!get.attitude_dajiejie_yzs) {
				get.attitude_dajiejie_yzs = get.attitude;
				get.attitude = function (from, to) {
					if (from && from?.getStorage("dajiejie_yzs_source", false)) {
						from = from.getStorage("dajiejie_yzs_source", false);
					}
					if (to && to?.getStorage("dajiejie_yzs_source", false)) {
						to = to.getStorage("dajiejie_yzs_source", false);
					}
					let att = get.attitude_dajiejie_yzs(from, to);
					return att;
				};
			}
			const Barrier_yzs = await game.addPlayerOL(pos, "Reimu_yzs_subBarrier_yzs", null, true);
			game.broadcastAll((Barrier_yzs) => {
				Barrier_yzs.isNoPlayer_dajiejie_yzs = true;
				Barrier_yzs.dieAfter = function () { };
				Barrier_yzs.dieAfter2 = function () { };
			}, Barrier_yzs)
			Barrier_yzs.setStorage("dajiejie_yzs_source", player);
			Barrier_yzs.ai.modAttitudeFrom = function (from, to, att) {
				if (_status.dajiejie_yzs_source_att_ing) return att;
				if (from.getStorage("dajiejie_yzs_source", false)) {
					from = from.getStorage("dajiejie_yzs_source", false);
				}
				if (to.getStorage("dajiejie_yzs_source", false)) {
					to = to.getStorage("dajiejie_yzs_source", false);
				}
				_status.dajiejie_yzs_source_att_ing = true;
				att = get.attitude(from, to);
				delete _status.dajiejie_yzs_source_att_ing;
				return att;
			};
			game.broadcastAll((Barrier_yzs, player) => {
				if (get.mode() == 'guozhan') {
					if (Barrier_yzs.name2 == undefined) Barrier_yzs.name2 = Barrier_yzs.name1;
				}
				if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
					Barrier_yzs.side = player.side;
					Barrier_yzs.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
					Barrier_yzs.node.identity.dataset.color = player.node.identity.dataset.color;
				}
				Barrier_yzs.skillH = [];
				Barrier_yzs.storage.zhibi = [];
				Barrier_yzs.storage.stratagem_expose = [];
				Barrier_yzs.storage.stratagem_fury = 0;
			}, Barrier_yzs, player);
			Barrier_yzs.storage.isSub = true;
			Barrier_yzs.markSkill("isSub");
			Barrier_yzs
				.when({ global: "die" })
				.filter((evt, player2) => {
					if (evt.reserveOut) return false;
					return evt.player == player || evt.player == player2;
				})
				.assign({
					forceDie: true,
				})
				.step(lib.skill[event.name].dieRemove);
			const disables = [];
			for (let i = 1; i <= 5; i++) {
				for (let j = 0; j < player.countEnabledSlot(i); j++) {
					disables.push(i);
				}
			}
			if (disables.length > 0) {
				await Barrier_yzs.disableEquip(disables);
			}
			Barrier_yzs.markAuto("Reimu_yzs_subBarrier_yzs_skill", direction)
			game.broadcastAll(
				function (player, direction) {
					if (player.marks.Reimu_yzs_subBarrier_yzs_skill) {
						player.marks.Reimu_yzs_subBarrier_yzs_skill.firstChild.innerHTML = direction == 'clockwise' ? `顺` : `逆`;
					}
				},
				Barrier_yzs,
				direction
			);
			await Barrier_yzs.disableJudge();
			await lib.skill.Reimu_yzs_Barrier_yzs_skill.settle();
			game.log(player, '召唤了', lib.translate['Reimu_yzs_subBarrier_yzs']);
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
			await lib.skill.Reimu_yzs_Barrier_yzs_skill.settle();
		},
	},
	InBarrier_yzs_skill: {
		group: ["InBarrier_yzs_skill_draw", "InBarrier_yzs_skill_recover"],
		locked: true,
		charlotte: true,
		nopop: true,
		nobracket: true,
		subSkill: {
			draw: {
				locked: true,
				priority: 3,
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
				ai: {
					threaten: 1.3,
				},
			},
			recover: {
				forced: true,
				priority: -1,
				trigger: {
					player: "phaseEnd"
				},
				async content(event, trigger, player) {
					await player.recover();
				},
			}
		},
		forced: true,
		priority: -3,
		trigger: {
			player: "damageBegin2",
		},
		filter(event, player) {
			if (event.player.name == "Reimu_yzs_subBarrier_yzs") return false;
			if (event.player.name == "Reimu_yzs_Barrier_yzs") return false;
			if (event.player.hp + event.player.hujia > event.num) {
				return false;
			}
			return game.hasPlayer(current => {
				return current.name == 'Reimu_yzs_subBarrier_yzs'
			});
		},
		async content(event, trigger, player) {
			let subBarrier = game.filterPlayer((cur) => cur.name == "Reimu_yzs_subBarrier_yzs", true)
			if (!subBarrier.length) return;
			trigger.cancel();
			subBarrier = subBarrier[0];
			await lib.skill["erchongjiejie_yzs"].dieRemove(event, trigger, subBarrier)
		}
	},
	yinyangyu_yzs: {
		Effect: function (targetPlayer) {
			// 1. 创建特效总容器
			const effectContainer = document.createElement('div');
			effectContainer.className = 'taichi-effect-container';

			Object.assign(effectContainer.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '1000',
				pointerEvents: 'none',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				overflow: 'visible'
			});

			targetPlayer.appendChild(effectContainer);

			// 2. 创建太极图案 (纯 CSS 绘制)
			const taichi = document.createElement('div');
			taichi.className = 'taichi-symbol';

			const size = Math.min(targetPlayer.offsetWidth, targetPlayer.offsetHeight) * 0.8;

			Object.assign(taichi.style, {
				width: `${size}px`,
				height: `${size}px`,
				borderRadius: '50%',
				position: 'relative',
				// 使用渐变绘制半黑半白
				background: 'linear-gradient(to bottom, #fff 50%, #000 50%)',
				boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
				opacity: '0',
				transform: 'scale(0.5) rotate(0deg)',
				transition: 'opacity 0.5s ease-out'
			});

			// 使用伪元素绘制太极的两个圆眼 (阴阳鱼头部)
			const styleId = 'taichi-pseudo-style';
			if (!document.getElementById(styleId)) {
				const style = document.createElement('style');
				style.id = styleId;
				style.textContent = `
			.taichi-symbol::before, .taichi-symbol::after {
				content: "";
				position: absolute;
				width: 50%; height: 50%;
				border-radius: 50%;
				left: 0;
			}
			.taichi-symbol::before {
				top: 25%;
				background: radial-gradient(circle, #000 15%, #fff 16%);
			}
			.taichi-symbol::after {
				top: 25%;
				left: 50%;
				background: radial-gradient(circle, #fff 15%, #000 16%);
			}
			@keyframes playerZen {
				0% { filter: contrast(1); }
				50% { filter: contrast(1.2) brightness(1.1); }
				100% { filter: contrast(1); }
			}
			.taichi-target-animate { animation: playerZen 1.5s ease-in-out; }
		`;
				document.head.appendChild(style);
			}

			effectContainer.appendChild(taichi);

			// 3. 创建雾气粒子组
			const particles = [];
			const particleCount = 20;
			for (let i = 0; i < particleCount; i++) {
				const p = document.createElement('div');
				const isWhite = i % 2 === 0;
				Object.assign(p.style, {
					position: 'absolute',
					width: '15px',
					height: '15px',
					backgroundColor: isWhite ? '#fff' : '#333',
					filter: 'blur(8px)',
					borderRadius: '50%',
					opacity: '0',
					left: '50%',
					top: '50%'
				});
				effectContainer.appendChild(p);
				particles.push(p);
			}

			// ================= 动画流程 =================

			// A. 凝聚并旋转
			const taichiAnim = taichi.animate([
				{ opacity: 0, transform: 'scale(0.2) rotate(-180deg)' },
				{ opacity: 1, transform: 'scale(1.1) rotate(0deg)', offset: 0.3 },
				{ opacity: 1, transform: 'scale(1) rotate(360deg)', offset: 0.8 },
				{ opacity: 0, transform: 'scale(1.5) rotate(450deg)', filter: 'blur(10px)', offset: 1 }
			], {
				duration: 2000,
				easing: 'ease-in-out'
			});

			targetPlayer.classList.add('taichi-target-animate');

			// B. 在旋转接近结束时，触发雾气消散
			taichiAnim.onfinish = () => {
				taichi.style.opacity = '0';

				particles.forEach((p, i) => {
					const angle = (i / particleCount) * Math.PI * 2;
					const dist = 50 + Math.random() * 50;
					p.animate([
						{ opacity: 0, transform: 'translate(-50%, -50%) scale(1)' },
						{ opacity: 0.7, offset: 0.2 },
						{
							opacity: 0,
							transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(3)`,
							offset: 1
						}
					], {
						duration: 800 + Math.random() * 400,
						easing: 'ease-out'
					});
				});

				// 移除容器
				setTimeout(() => {
					if (effectContainer.parentNode) {
						effectContainer.parentNode.removeChild(effectContainer);
					}
					targetPlayer.classList.remove('taichi-target-animate');
				}, 1200);
			};
		},
		subSkill: {
			buff: {
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") return num + player.countMark("yinyangyu_yzs_buff");
					},
				},
				onremove: "storage",
				sub: true,
				sourceSkill: "yinyangyu_yzs",
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		nobracket: true,
		prompt(event, player) {
			if (player.hasSkill("InBarrier_yzs_skill")) return `符卡：你本回合出【杀】数+1并获得1枚【梦】标记，然后可令“结界”或“子结界”顺或逆时针移动1个座次`;
			return `符卡：你摸1张牌，然后观看并与1名其他角色交换1张手牌`
		},
		enable: "phaseUse",
		filter: function (event, player) {
			if (player.countMark("Fuka_yzs") < 1) return false;
			return true
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			game.trySkillAudio("bagua_skill");
			player.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
			if (player.hasSkill("InBarrier_yzs_skill")) {
				player.addTempSkill("yinyangyu_yzs_buff")
				player.addMark("yinyangyu_yzs_buff", 1, false)
				player.addMark("mengxiangfengyin_yzs")
				if (!game.hasPlayer(target => target.name == "Reimu_yzs_Barrier_yzs" || target.name == "Reimu_yzs_subBarrier_yzs")) return;
				let result = await player.chooseTarget()
					.set("filterTarget", function (card, player, target) {
						if (ui.selected.targets?.length) {
							return ui.selected.targets[0] == target.getNext() || ui.selected.targets[0] == target.getPrevious()
						}
						return target.name == "Reimu_yzs_Barrier_yzs" || target.name == "Reimu_yzs_subBarrier_yzs"
					})
					.set("selectTarget", 2)
					.set("multitarget", true)
					.set("filterOk", () => {
						const targets = ui.selected.targets;
						if (targets.length != 2) {
							return false;
						}
						return targets[0] == targets[1].getNext() || targets[0] == targets[1].getPrevious()
					})
					.set("ai", target => Math.random())
					.set("prompt", "阴阳玉")
					.set("prompt2", "你可令“结界”或“子结界”顺或逆时针移动1个座次。")
					.setHiddenSkill(event.name.slice(0, -5))
					.forResult();
				if (!result.bool) return;
				game.broadcastAll(
					function (target1, target2) {
						game.swapSeat(target1, target2);
					},
					result.targets[0],
					result.targets[1]
				);
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
			}
		}
	},
	mengxiangfengyin_yzs: {
		locked: true,
		audio: "ext:一中杀/audio/skill:1",
		nobracket: true,
		marktext: "梦",
		intro: {
			content: "当前有#枚【梦】标记",
			name: "梦",
		},
		enable: "phaseUse",
		prompt: `符卡：移除X枚【梦】标记，然后从任意结界内角色开始，结界内角色依次受到1点伤害，共计X/3点。（向下取整）`,
		filter(event, player) {
			if (player.countMark("Fuka_yzs") < 1) return false;
			if (player.countMark("mengxiangfengyin_yzs") < 3) return false;
			let Barrier = game.filterPlayer((cur) => cur.name == "Reimu_yzs_Barrier_yzs", true)
			let subBarrier = game.filterPlayer((cur) => cur.name == "Reimu_yzs_subBarrier_yzs", true)
			if (!Barrier.length || !subBarrier.length) {
				return false;
			}
			return true;
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false
			return target.hasSkill("InBarrier_yzs_skill")
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs")
			let target = event.targets[0];
			player.removeMark("mengxiangfengyin_yzs", 3);
			game.broadcastAll((player) => {
				var imagePath = lib.assetURL + "/extension/一中杀/image/background/mengxiangfengyin_yzs.gif";
				//弄一个变量在后面用于决定多长时间后消除屏幕特效
				var duration = 1800;
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
				}, duration);
			}, player);
			await new Promise(r => setTimeout(r, 1800))
			target.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
			await target.damage();
			while (player.countMark("mengxiangfengyin_yzs") >= 3) {
				target = target.getNext();
				if (!target.hasSkill("InBarrier_yzs_skill")) {
					target = target.getNext();
					continue;
				}
				let ask = await player.chooseBool(`梦想封印`, `是否移除3/${player.countMark("mengxiangfengyin_yzs")}枚【梦】标记，然后对 ${get.translation(target)} 造成1点伤害？`)
					.forResult();
				if (!ask.bool) return;
				player.removeMark("mengxiangfengyin_yzs", 3);
				target.playEffectOL(lib.skill.yinyangyu_yzs.Effect);
				await target.damage();
			}
		},
		ai: {
			order: 5,
			result: {
				target(player, target) {
					return -2;
				},
			},
			expose: 0.3,
		}
	},
	Reimu_yzs_Barrier_yzs_skill: {
		async settle() {
			let players = game.players
			let Barrier = game.filterPlayer((cur) => cur.name == "Reimu_yzs_Barrier_yzs", true)
			let subBarrier = game.filterPlayer((cur) => cur.name == "Reimu_yzs_subBarrier_yzs", true)
			let inside = [];
			if (Barrier.length && subBarrier.length && subBarrier[0]?.storage?.Reimu_yzs_subBarrier_yzs_skill) {
				Barrier = Barrier[0];
				subBarrier = subBarrier[0];
				let direction = subBarrier.storage.Reimu_yzs_subBarrier_yzs_skill;
				let func = direction == "counterclockwise" ? function () {
					let inside = [];
					let target = subBarrier.next;
					while (target != Barrier) {
						inside.push(target);
						target = target.next;
					}
					return inside;
				} : function () {
					let inside = [];
					let target = subBarrier.previous;
					while (target != Barrier) {
						inside.push(target);
						target = target.previous;
					}
					return inside;
				}
				inside = func();
				inside = inside.filter(cur => cur.name != "Reimu_yzs_subBarrier_yzs" && cur.name != "Reimu_yzs_Barrier_yzs")
			}
			let outside = players.filter(cur => !inside.includes(cur))
			for (let target of outside) {
				target.removeSkill("InBarrier_yzs_skill")
				if (target.name == "Reimu_yzs") target.removeSkill("hidden_yzs")
			}
			for (let target of inside) {
				target.addSkill("InBarrier_yzs_skill")
				if (target.name == "Reimu_yzs") target.addSkill("hidden_yzs")
			}
			var imagePath = lib.assetURL + "/extension/一中杀/image/background/InBarrier_yzs_skill.jpg"
			// 创建一个唯一的ID来标识这个背景
			var id = "InBarrier_yzs_skill";

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
		charlotte: true,
		nobracket: true,
		group: ["DisabledHandcardSlot_yzs", "NoPhase_yzs", "hidden_yzs", "wudi_yzs", "InfinityDistance_yzs"],
		charlotte: true,
		ai: {
			nolose: true,
			nogain: true,
		}
	},
	Reimu_yzs_subBarrier_yzs_skill: {
		group: ["DisabledHandcardSlot_yzs", "NoPhase_yzs", "InfinityDistance_yzs"],
		charlotte: true,
		nobracket: true,
		mark: true,
		forced: true,
		marktext: "顺",
		intro: {
			nocount: true,
			mark(dialog, content, player) {
				const storage = player.storage.Reimu_yzs_subBarrier_yzs_skill
				if (storage) {
					let direction = storage == 'clockwise' ? `顺时针` : `逆时针`
					dialog.addText(`当前朝向为：${direction}`);
				} else {
					dialog.addText("未选择朝向");
				}
			},
		},
		ai: {
			save: true,
			skillTagFilter(player, tag, arg) {
				return true;
			},
			nolose: true,
			nogain: true,
		},
	},
	NoPhase_yzs: {
		priority: 11,
		locked: true,
		forced: true,
		popup: false,
		trigger: {
			player: "phaseBefore",
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	wudi_yzs: {
		charlotte: true,
		forced: true,
		popup: false,
		priority: 2,
		trigger: {
			player: ["damageBefore", "loseHpBefore", "loseMaxHpBefore", "changeHpBefore", "recoverBefore", "gainMaxHpBefore", "changeHujiaBefore", "dyingBefore", "dieBefore"]
		},
		filter(event, player) {
			if (event.name == "die" && event.getParent().name == "giveup") return false;
			return true;
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
		ai: {
			nodamage: true,
		}
	},
	InfinityDistance_yzs: {
		charlotte: true,
		nopop: true,
	},
	//外交大臣
	pingpongWaiJiao_yzs: {
		subSkill: {
			phaseUse: {
				mark: true,
				intro: {
					nocount: true,
					content: "跳过下一个出牌阶段",
				},
				"skill_id": "pingpongWaiJiao_yzs_phaseUse",
				sub: true,
				sourceSkill: "pingpongWaiJiao_yzs",
				"_priority": 0,
			},
			phaseDiscard: {
				mark: true,
				intro: {
					nocount: true,
					content: "跳过下一个弃牌阶段",
				},
				"skill_id": "pingpongWaiJiao_yzs_phaseDiscard",
				sub: true,
				sourceSkill: "pingpongWaiJiao_yzs",
				"_priority": 0,
			},
		},
		nobracket: true,
		usable: 1,
		enable: "phaseUse",
		filter(event, player) {
			return player.countCards("h") && game.hasPlayer(current => get.info("pingpongWaiJiao_yzs").filterTarget(null, player, current));
		},
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			return true
		},
		position: "he",
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
			if (ui.selected.cards.length >= Math.max(4, player.countCards("h") - player.hp)) {
				return 0;
			}
			if (player.hp == player.maxHp || player.countMark("rerende") < 0 || player.countCards("h") <= 1) {
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
			await player.give(event.cards, event.target);
			let num = event.cards.length - 1;
			let select = [1, num];
			if (num < 1) select = [0, 1]
			let result = event.target.countCards("h") < num ?
				{ bool: false } :
				await event.target.chooseCard(select, true)
					.set("prompt", `乒乓外交`)
					.set("prompt2", `交给 ${get.translation(player)} ${num}张牌或1张【桃】`)
					.set("filterOk", () => {
						if (get.event().num === 0) {
							if (ui.selected.cards.length) return ui.selected.cards?.some(card => card.name == "tao")
							else return true;
						}
						if (ui.selected.cards?.some(card => card.name == "tao")) return true;
						return ui.selected.cards?.length >= get.event().selectCard[1];
					})
					.set("num", num)
					.forResult()
			if (result.bool) await event.target.give(result.cards, player);
			if (num >= 3) {
				let map = ["phaseUse", "phaseDiscard"];
				let list = map.slice().map(function (i) {
					return ["阶段", "", i];
				});
				let result = await player.chooseButton([`外交大臣：你令 ${get.translation(event.target)} 跳过下一出牌或弃牌阶段`, [list, "vcard"]])
					.set("forced", true)
					.set("selectButton", 1)
					.forResult();
				if (result.bool) {
					let phase = result.links[0][2];
					event.target.skip(phase);
					event.target.addTempSkill(`pingpongWaiJiao_yzs_${phase}`, { player: `${phase}Skipped` });
				}
			}
		},
		mod: {
			aiValue(player, card, num) {
				if (card.name === "tao") {
					return 2 * num;
				}
			},
		},
		ai: {
			order(skill, player) {
				if (player.hp < player.maxHp && player.countMark("rerende") < 2 && player.countCards("h") > 1) {
					return 10;
				}
				return 4;
			},
			result: {
				target(player, target) {
					if (target.hasSkillTag("nogain")) {
						return 0;
					}
					if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
						if (target.hasSkillTag("nodu")) {
							return 0;
						}
						return -10;
					}
					if (target.hasJudge("lebu")) {
						return 0;
					}
					var nh = target.countCards("h");
					var np = player.countCards("h");
					if (player.hp == player.maxHp || player.countMark("rerende") < 0 || player.countCards("h") <= 1) {
						if (nh >= np - 1 && np <= player.hp && !target.hasSkill("haoshi")) {
							return 0;
						}
					}
					return Math.max(1, 5 - nh);
				},
			},
			effect: {
				target_use(card, player, target) {
					if (player == target && get.type(card) == "equip") {
						if (player.countCards("e", { subtype: get.subtype(card) })) {
							if (game.hasPlayer(current => current != player && get.attitude(player, current) > 0)) {
								return 0;
							}
						}
					}
				},
			},
			threaten: 0.8,
		},
	},
	huhua_yzs: {
		group: ["huhua_yzs_tao"],
		subSkill: {
			tao: {
				forced: true,
				trigger: {
					player: "useCardAfter",
				},
				filter(event, player) {
					return event.card.name == "tao"
				},
				async content(event, trigger, player) {
					await player.changeHujia(1, "gain");
				}
			}
		},
		logTarget: "player",
		prompt2: `其他角色需要使用或打出【闪】时你可替其出之（视为由其使用或打出）`,
		trigger: {
			global: ["chooseToRespondBefore", "chooseToUseBefore"],
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (event.responded) {
				return false;
			}
			if (event.player.storage.hujiaing) {
				return false;
			}
			if (!event.filterCard({ name: "shan", isCard: true }, event.player, event)) {
				return false;
			}
			return true;
		},
		check(event, player) {
			return get.attitude(player, event.player) > 1;
		},
		async content(event, trigger, player) {
			if ((player == game.me && !_status.auto) || get.attitude(player, trigger.player) > 2 || player.isOnline()) {
				trigger.player.storage.hujiaing = true;
				const next = await player.chooseToRespond("是否替" + get.translation(trigger.player) + "打出一张闪？", { name: "shan" })
					.set("skillwarn", "替" + get.translation(trigger.player) + "打出一张闪")
					.set("source", trigger.player)
					.forResult();
				let bool = next.bool
				trigger.player.storage.hujiaing = false;
				if (!bool) return;
				trigger.result = { bool: true, card: { name: "shan", isCard: true } };
				trigger.responded = true;
				trigger.animate = false;
			}
		},
	},
	//藤原妹红
	PhoenixLegend_yzs: {
		group: ["PhoenixLegend_yzs_start", "PhoenixLegend_yzs_skip", "PhoenixLegend_yzs_sheshen", "PhoenixLegend_yzs_phaseEnd", "PhoenixLegend_yzs_phaseBegin"],
		locked: true,
		subSkill: {
			skip: {
				priority: 3,
				trigger: {
					player: "phaseDiscardBefore",
				},
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					trigger.cancel();
				}
			},
			start: {
				name: `不死「火鸟　-凤翼天翔-」`,
				locked: true,
				forced: true,
				priority: 5,
				popup: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					await player.changeHujia(3, "gain");
				}
			},
			sheshen: {
				name: `灭罪「正直者之死」`,
				locked: true,
				priority: 1,
				logTarget: "player",
				trigger: {
					global: "damageBegin4",
				},
				filter(event, player) {
					if (event.player == player) return false;
					if (event.player.hasSkill("hidden_yzs")) return false;
					return true;
				},
				prompt2(event, player) {
					const str = event.source ? get.translation(event.source) + `对你造成的` + (event.num) + `点伤害` : (event.num) + `点无来源伤害`
					return `无效 ` + get.translation(event.player) + ` 受到的` + event.num + `点伤害，然后受到 ` + str;
				},
				check(event, player) {
					return get.attitude(player, event.player) > 1;
				},
				async content(event, trigger, player) {
					const num = trigger.num;
					trigger.cancel();
					if (!trigger.source) await player.damage("nosource", num)
					else {
						await player.damage(trigger.source, num);
					}
				},
			},
			phaseEnd: {
				name: `炎符「不死鸟之羽」`,
				forced: true,
				locked: true,
				popup: true,
				priority: -2,
				trigger: {
					player: "phaseEnd"
				},
				filter(event, player) {
					return player.hp > 1;
				},
				async content(event, trigger, player) {
					let num = player.hp - 1;
					await player.loseHp(num);
					await player.changeHujia(num, "gain");
				}
			},
			phaseBegin: {
				name: `「火鸟 ‐不死传说‐」`,
				forced: true,
				locked: true,
				popup: true,
				priority: 4,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs");
					if (player.hujia >= 6) {
						await player.changeHujia(-player.hujia, "lose");
						if (player.countCards("h") < 4) {
							await player.draw(4 - player.countCards("h"));
						}
						player.addSkill("PhoenixLegend_yzs_buff")
					}
				}
			}
		},
		nobracket: true,
		hiddenCard(player, name) {
			var list = ["wuxie", "shan"];
			return list.includes(name) && player.countCards("h");
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			if (event.responded || event.qiuwen_yzs) return false;
			var list = ["wuxie", "shan"];
			if (!list.length) {
				return false;
			}
			if (!player.countCards("h")) {
				return false;
			}
			for (var i of list) {
				if (event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
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
					if (event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
						list2.push([type, "", i]);
					}
				}
				return ui.create.dialog("不死鸟传说", [list2, "vcard"]);
			},
			check(button) {
				return _status.event.player.getUseValue({ name: button.link[2] }, null, true);
			},
			backup(links, player) {
				return {
					filterCard(card) {
						return get.color(card) == "black";
					},
					selectCard: 1,
					position: "h",
					popname: true,
					viewAs: {
						name: links[0][2],
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
				return lib.skill.PhoenixLegend_yzs.mod.aiValue.apply(this, arguments);
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
	PhoenixLegend_yzs_buff: {
		mark: true,
		nopop: true,
		marktext: "<span style=\"text-decoration: line-through;\">死</span>",
		intro: {
			nocount: true,
			content: "直至你下回合开始：你体力值不可下降。你主动弃置红色牌时获得1张符卡",
		},
		group: ["PhoenixLegend_yzs_buff_lose", "PhoenixLegend_yzs_buff_discard"],
		subSkill: {
			lose: {
				forced: true,
				popup: false,
				priority: -5,
				trigger: {
					player: "phaseBefore",
				},
				async content(event, trigger, player) {
					player.removeSkill("PhoenixLegend_yzs_buff");
				},
				sub: true,
				sourceSkill: "PhoenixLegend_yzs_buff",
				"_priority": 0,
				"skill_id": "PhoenixLegend_yzs_buff_lose",
			},
			discard: {
				name: `不死「凯风快晴飞翔蹴」`,
				trigger: {
					player: "loseAfter",
					global: "loseAsyncAfter",
				},
				locked: true,
				popup: true,
				filter(event, player) {
					if (player.countMark("Fuka_yzs") >= get.character(player.name).Fuka) return false;
					if (!event.cards || !event.cards.some(card => get.color(card, player) == "red")) return false;
					game.log(1)
					if (event.type != "discard" || event.player.isDead()) return false;
					game.log(2)
					if ((event.discarder && event.discarder != player) || event.getParent(2).player != event.player) return false;
					game.log(3)
					let cards = event.getl(event.player).hs.concat(event.getl(event.player).es)
					if (!cards.length || !cards.some(card => get.color(card, player) == "red")) return false;
					game.log(4)
					return true;
				},
				forced: true,
				async content(event, trigger, player) {
					player.addMark("Fuka_yzs");
				}
			},
		},
		priority: 4,
		forced: true,
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
		}
	},
	HumanBuring_yzs: {
		subSkill: {
			juedou: {
				name: `惜命「不死之身的舍身击」`,
				sub: true,
				sourceSkill: "HumanBuring_yzs",
				"_priority": 0,
				"skill_id": "HumanBuring_yzs_juedou",
			},
			recover: {
				name: `不灭「不死鸟之尾」`,
				sub: true,
				sourceSkill: "HumanBuring_yzs",
				"_priority": 0,
				"skill_id": "HumanBuring_yzs_recover",
			},
		},
		nobracket: true,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			if (!player.countCards("he")) return false;
			return true;
		},
		prompt: `${get.poptip("FukaSkill_yzs")}你选择：①弃1张红色牌以视为使用【决斗】，然后摸1张牌；②弃任意张黑色牌，然后恢复弃牌数向下取半数点体力`,
		filterCard(card) {
			return true
		},
		selectCard() {
			return [1, Infinity]
		},
		selectTarget: function (card, player, target) {
			if (ui.selected.cards?.some(card => get.color(card, player) == "red")) {
				return 1
			}
			return -1;
		},
		check(card) {
			const player = get.player();
			if (get.color(card) == "red") return player.hp + 4;
			if (ui.selected.cards && ui.selected.cards.length % 2) return 114 - get.value(card);
			return 6 - get.value(card);
		},
		complexCard: true,
		complexSelect: true,
		filterTarget: function (card, player, target) {
			if (ui.selected.cards?.some(card => get.color(card, player) == "red")) {
				return player.canUse(get.autoViewAs({ name: "juedou" }), target, true, false)
			}
			return target == player
		},
		filterOk() {
			const player = get.event().player
			if (ui.selected.cards?.some(card => get.color(card, player) == "red")) {
				return !ui.selected.cards?.some(card => get.color(card, player) !== "red")
			}
			return ui.selected.cards.length > 0;
		},
		discard: false,
		lose: false,
		delay: false,
		position: "he",
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			await player.discard(event.cards, player);
			if (event.cards.some(card => get.color(card, player) == "red")) {
				await player.logSkill("HumanBuring_yzs_juedou")
				await player.useCard({ name: "juedou", isCard: false }, event.targets[0]);
				await player.draw();
			} else {
				await player.logSkill("HumanBuring_yzs_recover")
				let num = Math.floor(event.cards.length / 2);
				if (num > 0) await player.recover(num);
			}
		},
		ai: {
			order: 5,
			expose: 0.4,
			result: {
				player(player, target) {
					if (ui.selected.cards?.some(card => get.color(card, player) == "red")) {
						return 0
					}
					return get.recoverEffect(player,player,player)
				},
				target(player, target) {
					if (ui.selected.cards?.some(card => get.color(card, player) == "red")) {
						return get.effect(target, {name:"juedou",isCard:true,},player,target)
					}
					return 0
				},
			}
		}
	},
	//哆来咪 苏伊特
	DreamCatcher_yzs: {
		group: ["DreamCatcher_yzs_phaseUse"],
		subSkill: {
			phaseUse: {
				forced: true,
				popup: false,
				locked: true,
				trigger: {
					global: "phaseEnd"
				},
				filter(event, player) {
					return player.storage.DreamCatcher_yzs?.length
				},
				async content(event, trigger, player) {
					let targets = player.storage.DreamCatcher_yzs;
					player.storage.DreamCatcher_yzs = [];
					player.markSkill("DreamCatcher_yzs")
					for (let target of targets) {
						var next = target.phaseUse();
						next.skill = "DreamCatcher_yzs_phaseUse"
						await next;
					}
				}
			},
		},
		nobracket: true,
		locked: true,
		priority: -2,
		trigger: {
			global: "loseAfter",
		},
		filter(event, player) {
			var evt = event.getParent(3);
			return event.type == "discard" && evt.name == "phaseDiscard" && evt.player == event.player && event.cards2 && event.cards2.filterInD("d").length > 0;
		},
		async cost(event, trigger, player) {
			let cards = trigger.cards2.filterInD("d");
			event.result = { bool: false };
			let result = await trigger.player
				.chooseButton([`若选择其中任意张，则将你的手牌与你弃牌阶段弃置的牌交换，且本回合结束后 ${get.translation(player)} 与你依次执行额外出牌阶段`, cards], [1, Infinity], false)
				.set("ai", button => {
					const player = get.event().player;
					const cards = get.event().cards;
					return cards.length + 2 - player.countCards("h")
				})
				.set("cards", cards)
				.forResult();
			if (result.bool) event.result = { bool: true };
		},
		async content(event, trigger, player) {
			let cards = trigger.cards2.filterInD("d");
			let target = trigger.player;
			await target.loseToDiscardpile(target.getCards('h'));
			await target.gain(cards, 'gain2')
			player.markAuto(event.name, [player, target])
		},
	},
	DreamInMe_yzs: {
		group: ["DreamInMe_yzs_phaseUseBegin"],
		subSkill: {
			ban: {
				sub: true,
				sourceSkill: `DreamInMe_yzs`
			},
			phaseUseBegin: {
				name: `梦符「梦我梦中」`,
				locked: true,
				popup: true,
				forced: true,
				priority: -2,
				trigger: {
					player: "phaseUseBegin"
				},
				async content(event, trigger, player) {
					var card = {
						name: "mengliaoshibian_yzs",
						isCard: true
					};
					await player.chooseUseTarget(card, true)
						.set("prompt", "梦我梦中")
						.set("prompt2", "视为使用一张" + get.translation(card))
				}
			},
		},
		nobracket: true,
		locked: true,
		priority: 6,
		trigger: {
			player: ["eventNeutralized", "useCardEnd"],
		},
		filter(event, player, name) {
			if (player.hasSkill("DreamInMe_yzs_ban")) return false;
			if (!player.countCards("h")) return false
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
			event.result = { bool: false };
			var list = [];
			for (var name of lib.inpile) {
				var type = get.type(name);
				if (type != 'basic' && type != 'trick') continue;
				var info = lib.card[name];
				if (!(
					info &&
					!info.notarget &&
					(info.toself || info.singleCard || !info.selectTarget || info.selectTarget === 1)
				)) continue;
				var card = {
					name: name,
					isCard: true
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
			if (list.length) {
				let result = await player.chooseButton([`你可视为使用任意单体即时牌，因此使用伤害牌或${get.poptip("mengliaoshibian_yzs")}后本阶段本技能失效`, [list, 'vcard']]).set('ai', function (button) {
					return _status.event.player.getUseValue({
						name: button.link[2]
					});
				})
					.forResult();
				if (result.bool) event.result = { bool: true, cost_data: result.links[0] }
			}
		},
		async content(event, trigger, player) {
			let card = {
				name: event.cost_data[2],
				isCard: true
			}
			if (event.cost_data.length >= 4) card.nature = event.cost_data[3]
			await player.chooseUseTarget(card, true)
				.set("prompt", "梦我梦中")
				.set("prompt2", `视为使用1张${(get.translation(card.nature) || '')}${get.translation(card.name)}`)
			if (card.name == "mengliaoshibian_yzs" || get.tag({ name: card.name }, "damage")) {
				player.addTempSkill("DreamInMe_yzs_ban")
			}
		},
	},
	//铃仙
	DisorderEye_yzs: {
		async damagex(player, target) {
			await player.logSkill("DisorderEye_yzs_damagex")
			if (target.countCards("hej")) {
				var next = await player.choosePlayerCard(target, "hej",
					1,
					"狂气之瞳：将" + get.translation(target) + "的1张牌扣置为“虚弹”",
					true
				)
					.set("forceAuto", true)
					.forResult();
				var cards = [];
				if (next.bool) cards = next.cards || [];
				if (cards.length) {
					var add = player.addToExpansion("giveAuto", cards, target);
					add.gaintag.add("DisorderEye_yzs_bullet");
					await add
				};
			}
			if (player.countExpansions("DisorderEye_yzs_bullet") > 5) {
				let result = await player.chooseButton(["虚弹", `你需移去1张“虚弹”`, player.getExpansions("DisorderEye_yzs_bullet")], true)
					.set("selectButton", 1)
					.forResult()
				if (result.bool && result.links?.length) await player.loseToDiscardpile(result.links);
			}
			if (player.countExpansions("DisorderEye_yzs_bullet")) {
				let result = await player.chooseButton(["虚弹", `你可给予 ${get.translation(target)} 1张“虚弹”，然后你摸1张牌`, player.getExpansions("DisorderEye_yzs_bullet")], false)
					.set("ai", button => {
						const player = get.event().player;
						const target = get.event().target;
						return get.attitude(player, target);
					})
					.set("target", target)
					.set("selectButton", 1)
					.forResult()
				if (result.bool && result.links?.length) {
					await player.give(result.links, target);
					await player.draw();
				}
			}
		},
		group: ["DisorderEye_yzs_phaseBegin", "DisorderEye_yzs_cards1", "DisorderEye_yzs_cards2"],
		subSkill: {
			phaseBegin: {
				name: `波符「赤眼催眠」`,
				forced: true,
				locked: true,
				popup: true,
				priority: 4,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return player.countMark("Fuka_yzs") < get.character(player.name).Fuka
				},
				async content(event, trigger, player) {
					player.addMark("Fuka_yzs", Math.min(3, get.character(player.name).Fuka - player.countMark("Fuka_yzs")));
				}
			},
			cards1: {
				charlotte: true,
				onremove: true,
				marktext: "👁",
				intro: {
					content: "出牌阶段结束时将手牌数调整至#",
				},
				sub: true,
				sourceSkill: "DisorderEye_yzs",
				priority: 4,
				locked: true,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseUseBegin",
				},
				async content(event, trigger, player) {
					var players = game.filterPlayer();
					for (let target of players) {
						target.addMark("DisorderEye_yzs_cards1", target.countCards("h"), false);
					}
				},
			},
			cards2: {
				sub: true,
				sourceSkill: "DisorderEye_yzs",
				priority: -2,
				locked: true,
				name: `狂视「狂视调律」`,
				forced: true,
				trigger: {
					player: "phaseUseEnd",
				},
				async content(event, trigger, player) {
					var players = game.filterPlayer();
					for (let target of players) {
						const num = target.countMark("DisorderEye_yzs_cards1");
						const num2 = target.countCards("h");
						target.clearMark("DisorderEye_yzs_cards1", false);
						if (num2 > num) {
							await target.chooseToDiscard("h", num2 - num, true);
						} else if (num > num2) {
							await target.draw(num - num2);
						}
					}
				},
			},
			bullet: {
				locked: true,
				charlotte: true,
				markimage: "extension/一中杀/image/DisorderEye_yzs_bullet.png",
				intro: {
					markcount: "expansion",
					mark(dialog, _, player) {
						const cards = player.getExpansions("DisorderEye_yzs_bullet");
						if (player.isUnderControl(true) && cards.length) dialog.addAuto(cards);
						else return "共有" + get.cnNumber(cards.length) + "张“虚弹”";
					},
				},
			}
		},
		nobracket: true,
		locked: true,
		mod: {
			cardname(card, player) {
				if (lib.card[card.name].type != "basic") {
					return "sha";
				}
			},
		},
		forced: true,
		popup: false,
		trigger: {
			player: "shaBegin",
		},
		filter(event, player) {
			return true
		},
		content() {
			trigger.setContent(lib.skill.DisorderEye_yzs.shaContent);
		},
		shaContent: [async (event, trigger, player) => {
			if (typeof event.shanRequired !== "number" || !event.shanRequired || event.shanRequired < 0) {
				event.shanRequired = 1;
			}
			if (typeof event.baseDamage !== "number") {
				event.baseDamage = 1;
			}
			if (typeof event.extraDamage !== "number") {
				event.extraDamage = 0;
			}
		},
		async (event, trigger, player) => {
			let { target, card } = event;
			if (event.directHit || event.directHit2 || (!_status.connectMode && lib.config.skip_shan && !target.hasShan())) {
				event.result = { bool: false };
			} else if (event.skipShan) {
				event.result = { bool: true, result: "shaned" };
			} else {
				let prompt2 = ``;
				if (event.shanRequired > 1) {
					prompt2 = "（共需使用" + event.shanRequired + "张闪）"
				} else if (game.hasNature(event.card, "stab")) {
					prompt2 = "prompt2", "（在此之后仍需弃置一张手牌）"
				}
				event.result = await target.chooseToUse(`请使用一张闪响应杀，否则${get.translation(player)}可将你1张手牌扣置为“虚弹”`)
					.set("type", "respondShan")
					.set("filterCard", function (card, player) {
						if (get.name(card) !== "shan") {
							return false;
						}
						return lib.filter.cardEnabled(card, player, "forceEnable");
					})
					.set("prompt2", prompt2)
					.set("ai1", function (card) {
						if (get.event().toUse) {
							return get.order(card);
						}
						return 0;
					})
					.set("shanRequired", event.shanRequired)
					.set("respondTo", [player, card])
					.set(
						"toUse",
						(() => {
							if (target.hasSkillTag("noShan", null, "use")) {
								return false;
							}
							if (target.hasSkillTag("useShan", null, "use")) {
								return true;
							}
							if (
								target.isLinked() &&
								game.hasNature(event.card) &&
								game.hasPlayer(cur => {
									if (cur === target || !cur.isLinked()) {
										return false;
									}
									return true; //return get.attitude(target, cur) <= 0;
								})
							) {
								if (get.attitude(target, player._trueMe || player) > 0) {
									return false;
								}
							}
							if (event.baseDamage + event.extraDamage <= 0 && !game.hasNature(event.card, "ice")) {
								return false;
							}
							if (!game.hasNature(event.card, "ice") && !player.hasSkillTag("jueqing", false, target) && !target.hasSkill("gangzhi") && get.damageEffect(target, player, target, get.nature(event.card)) >= 0) {
								return false;
							}
							if (event.baseDamage + event.extraDamage >= target.hp + (player.hasSkillTag("jueqing", false, target) || target.hasSkill("gangzhi") ? 0 : target.hujia)) {
								return true;
							}
							if (
								event.shanRequired > 1 &&
								!target.hasSkillTag("freeShan", null, {
									player: player,
									card: event.card,
									type: "use",
								}) &&
								target.mayHaveShan(target, "use", true, "count") < event.shanRequired - (event.shanIgnored || 0)
							) {
								return false;
							}
							return true;
						})()
					)
					.forResult()
			}
		},
		async (event, trigger, player) => {
			let { result, target } = event;
			if (!result || !result.bool || !result.result || result.result !== "shaned") {
				event.trigger("shaHit");
			} else {
				event.shanRequired--;
				if (event.shanRequired > 0) {
					event.goto(1);
				} else if (game.hasNature(event.card, "stab") && target.countCards("h") > 0) {
					event.responded = result;
					event.goto(4);
				} else {
					event.trigger("shaMiss");
					event.responded = result;
				}
			}
		},
		async (event, trigger, player) => {
			let { result, target } = event;
			if ((!result || !result.bool || !result.result || result.result !== "shaned") && !event.unhurt) {
				if (!event.directHit && !event.directHit2 && lib.filter.cardEnabled(new lib.element.VCard({ name: "shan" }), target, "forceEnable") && target.countCards("hs") > 0 && get.damageEffect(target, player, target) < 0) {
					target.addGaintag(target.getCards("hs"), "sha_notshan");
				}
				await lib.skill.DisorderEye_yzs.damagex(player, event.target)
				event.result = { bool: true };
				event.trigger("shaDamage");
			} else {
				event.result = { bool: false };
				event.trigger("shaUnhirt");
			}
			event.finish();
		},
		async (event, trigger, player) => {
			let { result, target } = event;
			event.result = target.chooseToDiscard("刺杀：请弃置一张牌，否则此【杀】依然造成伤害").set("ai", function (card) {
				var target = _status.event.player;
				var evt = _status.event.getParent();
				var bool = true;
				if (get.damageEffect(target, evt.player, target, evt.card.nature) >= 0) {
					bool = false;
				}
				if (bool) {
					return 8 - get.useful(card);
				}
				return 0;
			});
		},
		async (event, trigger, player) => {
			let { result, target } = event;
			if ((!result || !result.bool) && !event.unhurt) {
				await lib.skill.DisorderEye_yzs.damagex(player, event.target)
				event.result = { bool: true };
				event.trigger("shaDamage");
				event.finish();
			} else {
				event.trigger("shaMiss");
			}
		},
		async (event, trigger, player) => {
			let { result, target } = event;
			if ((!result || !result.bool) && !event.unhurt) {
				await lib.skill.DisorderEye_yzs.damagex(player, event.target)
				event.result = { bool: true };
				event.trigger("shaDamage");
				event.finish();
			} else {
				event.result = { bool: false };
				event.trigger("shaUnhirt");
			}
		}]
	},
	VisionaryTuning_yzs: {
		group: ["VisionaryTuning_yzs_phaseBegin"],
		subSkill: {
			phaseBegin: {
				name: `狂符「幻视调律」`,
				locked: true,
				forced: true,
				popup: false,
				priority: 7,
				trigger: {
					player: "phaseBegin"
				},
				filter(event, player) {
					return player.storage.VisionaryTuning_yzs
				},
				async content(event, trigger, player) {
					player.changeZhuanhuanji("VisionaryTuning_yzs");
				}
			},
			mad: {
				charlotte: true,
				mark: true,
				nopop: true,
				marktext: "狂",
				intro: {
					nocount: true,
					content: "你发狂了！",
				},
			},
			buff: {
				popup: false,
				mark: true,
				nopop: true,
				marktext: "<span style=\"text-decoration: line-through;\">视</span>",
				intro: {
					content: "下回合摸牌数-#",
				},
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				priority: -2,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					let num = player.countMark("VisionaryTuning_yzs_buff")
					player.clearMark("VisionaryTuning_yzs_buff", false)
					player.removeSkill("VisionaryTuning_yzs_buff")
					trigger.num -= num;
				},
				ai: {
					threaten: -2.3,
				},
			}
		},
		mark: true,
		nobracket: true,
		locked: true,
		marktext: "☯",
		zhuanhuanji: true,
		intro: {
			content(storage, player, skill) {
				let str = storage ? "实：移去4张♠“虚弹”，然后对任意角色造成1点伤害并令其退出“狂”状态"
					: "虚：移去4张非♠“虚弹”，然后令1名不处于“狂”状态的角色下回合摸牌数-2并进入“狂”状态";
				str += "，然后你获得1张符卡";
				return str;
			},
		},
		enable: "phaseUse",
		filter(event, player) {
			let cards = player.getExpansions("DisorderEye_yzs_bullet")
			if (!cards || cards.length < 4) return false;
			if (player.storage.VisionaryTuning_yzs) {
				cards = cards.filter(card => get.suit(card, player) == "spade")
			} else {
				cards = cards.filter(card => get.suit(card, player) !== "spade")
			}
			return cards.length >= 4;
		},
		chooseButton: {
			dialog(event, player) {
				let dialog = ui.create.dialog("幻视调律", player.getExpansions("DisorderEye_yzs_bullet"), "hidden");
				return dialog;
			},
			select: 4,
			filter(button, player) {
				if (player.storage.VisionaryTuning_yzs) {
					return get.suit(button.link, player) == "spade"
				} else {
					return get.suit(button.link, player) !== "spade"
				}
				return false;
			},
			check(button) {
				return 2;
			},
			backup(links, player) {
				return {
					filterTarget: function (card, player, target) {
						if (player.storage.VisionaryTuning_yzs) {
							return !target.hasSkill("hidden_yzs")
						} else {
							return !target.hasSkill("hidden_yzs") && !target.hasSkill("VisionaryTuning_yzs_mad")
						}
						return false;
					},
					filterCard() {
						return false;
					},
					selectCard: -1,
					card: links,
					delay: false,
					content: lib.skill.VisionaryTuning_yzs.contentx,
					ai: {
						order: 10,
						result: {
							player: 1,
							target: -2,
						},
						expose: 0.3
					}
				};
			},
			prompt() {
				const player = get.event().player;
				if (player.storage.VisionaryTuning_yzs) {
					return `实：移去4张♠“虚弹”，然后对任意角色造成1点伤害并令其退出“狂”状态`
				} else {
					return `虚：移去4张非♠“虚弹”，然后令1名不处于“狂”状态的角色下回合摸牌数-2并进入“狂”状态`
				}
			},
		},
		async contentx(event, trigger, player) {
			var card = lib.skill.VisionaryTuning_yzs_backup.card;
			await player.loseToDiscardpile(card);
			player.changeZhuanhuanji("VisionaryTuning_yzs");
			if (player.countMark("Fuka_yzs") < get.character(player.name).Fuka) player.addMark("Fuka_yzs")
			if (player.storage.VisionaryTuning_yzs) {
				event.target.addMark("VisionaryTuning_yzs_buff", 2, false);
				event.target.addSkill("VisionaryTuning_yzs_buff");
				event.target.addSkill("VisionaryTuning_yzs_mad");
			} else {
				await event.target.damage();
				event.target.removeSkill("VisionaryTuning_yzs_mad");
			}
		},
		ai: {
			order: 10,
			result: {
				player: 1,
				target: -2,
			},
			expose: 0.3
		}
	},
	LunaticRedEyes_yzs: {
		group: ["LunaticRedEyes_yzs_use"],
		subSkill: {
			use: {
				locked: true,
				forced: true,
				priority: 21,
				direct: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.name == "sha" && event.targets.some(target => target.hasSkill("LunaticRedEyes_yzs_buff"))
				},
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
				},
			},
			buff: {
				charlotte: true,
				mark: true,
				nopop: true,
				marktext: "<span style=\"text-decoration: line-through;\">👁</span>",
				intro: {
					nocount: true,
					content: "铃仙对你使用【杀】无次数距离限制",
				},
			},
		},
		mod: {
			targetInRange: function (card, player, target) {
				if (card.name == "sha" && target.hasSkill("LunaticRedEyes_yzs_buff")) return true;
			},
			cardUsableTarget(card, player, target) {
				if (card.name == "sha" && target.hasSkill("LunaticRedEyes_yzs_buff")) return true;
			},
		},
		audio: "ext:一中杀/audio/skill:1",
		nobracket: true,
		locked: true,
		enable: "phaseUse",
		filter(event, player) {
			if (!player.countMark("Fuka_yzs")) return false;
			return true;
		},
		selectTarget: [1, 2],
		multitarget: true,
		filterTarget: function (card, player, target) {
			return !target.hasSkill("hidden_yzs")
		},
		async content(event, trigger, player) {
			player.removeMark("Fuka_yzs");
			if (event.targets.length == 2) {
				await event.targets[0].swapHandcards(event.targets[1]);
			} else {
				for (let target of event.targets) {
					await target.draw(4);
					await target.addTempSkill("LunaticRedEyes_yzs_buff")
				}
			}
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
				}
			}
		}
	},
	InvisibleFullMoon_yzs: {
		getMoons(player) {
			let max = player.storage.InvisibleFullMoon_yzs_max || 0;
			let moons = [];
			for (let i = 1; i <= max; i++) {
				let moon = player.getExpansions("InvisibleFullMoon_yzs_" + i);
				if (moon?.length) moons.push(moon)
			};
			player.setMark("InvisibleFullMoon_yzs", moons.length, false)
			return moons;
		},
		marktext: "月",
		intro: {
			mark(dialog, content, player) {
				let moons = lib.skill.InvisibleFullMoon_yzs.getMoons(player)
				if (moons.length) {
					if (player.isUnderControl(true)) {
						for (let i = 0; i < moons.length; i++) {
							dialog.addText(`第${i + 1}轮“满月”`);
							dialog.addAuto(moons[i]);
						}
					} else {
						dialog.addText("共有" + get.cnNumber(moons.length) + "个“满月”");
					}
				} else {
					dialog.addText("无“满月”");
				}
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
			player.yzs_UseShunfaji("InvisibleFullMoon_yzs");
		},
		hiddenCard: function (player, name) {
			return name == 'jiu' || name == "tao" || name == "sha" || name == "shan"
		},
		clickableFilter: function (player) {
			if (!player.countCards("h")) return false;
			if (!player.countMark("Fuka_yzs") && !lib.skill.InvisibleFullMoon_yzs.getMoons(player).length) return false;
			return true;
		},
		clickableContent: async function (event, trigger, player) {
			let ask = await player.chooseBool(`是否发动【隐形满月】?<br>你将全部手牌弃置或置顶，然后选择：<br>
①获得1个“满月”；<br>②符卡：摸等量张牌，然后可将所弃置牌中任意张叠置为1个“满月”，至多2个`)
				.forResult();
			if (!ask.bool) return;
			let next = player.useSkill("InvisibleFullMoon_yzs")
			await next;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (!player.countCards("h")) return false;
			if (!player.countMark("Fuka_yzs") && !lib.skill.InvisibleFullMoon_yzs.getMoons(player).length) return false;
			return true
		},
		async content(event, trigger, player) {
			let num = player.countCards("h")
			let result = await player.chooseToMove("将全部手牌弃置或置顶")
				.set("list", [
					["牌堆顶(左为顶)",[]],
					["弃置", player.getCards("h")],
				])
				.set("filterMove", function (from, to) {
					return true;
				})
				.set("processAI", function (list) {
					const cards = list[1][1].slice(0);
					let cards1 = [];
					let cards2 = [];
					for (let card of cards) {
						if (get.value(card) > 5) cards1.push(card);
						cards2.push(card);
					}
					return [cards1, cards2];
				})
				.set("forced", false)
				.forResult();
			if (!result.bool) return;
			var pushs = result.moved[0],
				discards = result.moved[1];
			await player.lose(pushs, ui.cardPile, "insert");
			game.updateRoundNumber();
			await player.discard(discards);
			let moons = lib.skill.InvisibleFullMoon_yzs.getMoons(player)
			let args = [`获得1个“满月”，否则：符卡：摸等量张牌，然后可将所弃置牌中任意张叠置为1个“满月”，至多2个`];
			if (moons?.length) {
				for (let i = 0; i < moons.length; i++) {
					args.push(`第${get.cnNumber(i + 1)}轮“满月”`)
					args.push(moons[i])
				}
			}
			if (moons?.length) {
				let forced = !player.countMark("Fuka_yzs");
				result = await player
					.chooseButton(args, 1, forced)
					.set("selectButton", () => {
						if (ui.selected?.buttons?.length) return -1;
						return 1;
					})
					.set("filterButton", (button) => {
						if (ui.selected?.buttons?.length) {
							const btn = ui.selected.buttons[0];
							let moons = get.event().moons;
							for (let moon of moons) {
								if (moon.includes(btn.link)) return moon.includes(button.link)
							}
							return false;
						}
						return true;
					})
					.set("ai", button => {
						if (player.countMark("Fuka_yzs") && player.countCards("h") >= 4) return 0;
						return 1;
					})
					.set("moons", moons)
					.forResult();
			} else if (player.countMark("Fuka_yzs")) {
				result = { bool: false };
			} else {
				return;
			}
			if (result.bool) {
				await player.gain(result.links);
				lib.skill.InvisibleFullMoon_yzs.getMoons(player)
			} else {
				player.removeMark("Fuka_yzs");
				await player.draw(num);
				if (lib.skill.InvisibleFullMoon_yzs.getMoons(player).length < 2) {
					discards = discards.filterInD("d")
					result = await player
						.chooseButton([`可将所弃置牌中任意张叠置为1个“满月”，至多2个`, discards], [1, Infinity], false)
						.set("ai", button => {
							const player = get.player();
							return get.value(button) - 2;
						})
						.forResult();
					if (result.bool && result.links.length) {
						if (!player.storage.InvisibleFullMoon_yzs_max) player.storage.InvisibleFullMoon_yzs_max = 0;
						player.storage.InvisibleFullMoon_yzs_max++;
						player.markSkill("InvisibleFullMoon_yzs_max");
						let gaintag = "InvisibleFullMoon_yzs_" + player.storage.InvisibleFullMoon_yzs_max;
						game.broadcastAll((gaintag) => {
							lib.translate[gaintag] = "满月"
						}, gaintag)
						let next = player.addToExpansion(result.links, player, "giveAuto");
						next.gaintag.add(gaintag);
						await next;
						lib.skill.InvisibleFullMoon_yzs.getMoons(player)
					}
				}
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
				player: 2,
			}
		}
	},
	//白露
	xuanhujishi_yzs: {
		nobracket: true,
		locked: true,
		enable: "phaseUse",
		usable: 1,
		selectTarget: 1,
		filter(event, player) {
			if (!player.countCards("h")) return false;
			return game.hasPlayer(function (target) {
				return lib.skill.xuanhujishi_yzs.filterTarget(null, player, target)
			})
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return true;
		},
		async content(event, trigger, player) {
			let cards = player.getCards("h")
			let target = event.target;
			if (target.countExpansions("_xuanhujishi_yzs_zhulu")) {
				if (player != target) await player.swapHandcards(target);
			} else {
				let next = target.addToExpansion(cards, player, "giveAuto")
				next.gaintag.add("_xuanhujishi_yzs_zhulu")
				await next;
				if (target != _status.currentPhase) {
					await target.useSkill("_xuanhujishi_yzs_zhulu_Afterchange")
				}
			}
			if (player.countCards("h") < player.getHandcardLimit()) {
				await player.draw(player.getHandcardLimit() - player.countCards("h"));
			}
		},
		ai: {
			order: 4,
			expose: 0.2,
			result: {
				player(player, target) {
					return 3;
				},
				target(player, target) {
					return player.countCards("h")
				}
			}
		}
	},
	_xuanhujishi_yzs_zhulu: {
		subSkill: {
			gain: {
				priority: 4,
				popup: false,
				trigger: {
					player: "gainEnd",
				},
				filter(event, player) {
					if (player.storage.currentHandcards_yzs !== "_xuanhujishi_yzs_zhulu" && !player.countExpansions("_xuanhujishi_yzs_zhulu")) return false;
					return player != _status.currentPhase && player.storage.currentHandcards_yzs == "_xuanhujishi_yzs_zhulu"
				},
				forced: true,
				async content(event, trigger, player) {
					player.addGaintag(trigger.cards, player.storage.currentHandcards_yzs)
				}
			},
			Beginchange: {
				locked: true,
				sub: true,
				sourceSkill: "_xuanhujishi_yzs_zhulu",
				forced: true,
				popup: false,
				priority: 11231434,
				trigger: { player: ["phaseBegin"] },
				filter(event, player) {
					if (player.storage.currentHandcards_yzs !== "_xuanhujishi_yzs_zhulu" && !player.countExpansions("_xuanhujishi_yzs_zhulu")) return false;
					return true
				},
				async content(event, trigger, player) {
					player.setStorage("currentHandcards_yzs", null, true)
					let cards = player.getExpansions("_xuanhujishi_yzs_zhulu");
					let handcards = player.getCards("h");
					let next = player.addToExpansion(handcards, player, "giveAuto")
					next.gaintag.add("_xuanhujishi_yzs_zhulu")
					next.untrigger(true);
					await next
					if (cards && cards.length) {
						player.directgain(cards, "gain2");
						player.removeGaintag("_xuanhujishi_yzs_zhulu", cards);
					}
					await game.delayx();
				},
			},
			Afterchange: {
				locked: true,
				sub: true,
				sourceSkill: "_xuanhujishi_yzs_zhulu",
				forced: true,
				popup: false,
				priority: -11231434,
				trigger: { player: ["phaseAfter"] },
				filter(event, player) {
					if (player.storage.currentHandcards_yzs !== "_xuanhujishi_yzs_zhulu" && !player.countExpansions("_xuanhujishi_yzs_zhulu")) return false;
					return true
				},
				async content(event, trigger, player) {
					player.setStorage("currentHandcards_yzs", "_xuanhujishi_yzs_zhulu", true)
					let cards = player.getExpansions("_xuanhujishi_yzs_zhulu");
					let handcards = player.getCards("h");
					let next = player.addToExpansion(handcards, player, "giveAuto")
					next.gaintag.add("_xuanhujishi_yzs_zhulu")
					next.untrigger(true);
					await next
					if (cards && cards.length) {
						player.directgain(cards, "gain2");
					}
					await game.delayx();
				},
			}
		},
		charlotte: true,
		locked: true,
		nopop: true,
		mod: {
			cardname(card, player) {
				if (player.storage.currentHandcards_yzs == "_xuanhujishi_yzs_zhulu" && card.hasGaintag("_xuanhujishi_yzs_zhulu") && card.name == "sha") {
					return "tao"
				}
			},
		},
		marktext: `珠`,
		intro: {
			markcount: "expansion",
			mark(dialog, _, player) {
				const cards = player.getExpansions("_xuanhujishi_yzs_zhulu");
				if (cards.length) dialog.addAuto(cards);
			},
		},
	},
	wangwenwenqie_yzs: {
		subSkill: {
			ban: {
				sub: true,
				sourceSkill: `wangwenwenqie_yzs`
			},
		},
		nobracket: true,
		locked: true,
		filter(event, player) {
			if (player.hasSkill("wangwenwenqie_yzs_ban")) return false;
			if (!game.hasPlayer(function (target) {
				return lib.skill.wangwenwenqie_yzs.filterTarget(null, player, target)
			})) return false;
			return true;
		},
		filterTarget: function (card, player, target) {
			if (!target.countExpansions("_xuanhujishi_yzs_zhulu")) return false;
			if (target.hasSkill("hidden_yzs")) return false;
			return player.canCompare(target) && target != player
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			const result = await player.chooseToCompare(event.targets[0]).forResult();
			if (result.tie) {
				player.addTempSkill("wangwenwenqie_yzs_ban", "phaseUseAfter");
				var stat = player.getStat().skill;
				delete stat.xuanhujishi_yzs;
			} else {
				if (result.winner) {
					const cards = [result.player, result.target].filterInD("d");
					await result.winner.gain(cards, "gain2");
				}
			}
		},
		ai: {
			order(item, player) {
				if (
					player.countCards("h", function (card) {
						return player.hasValueTarget(card);
					})
				) {
					return 10;
				}
				return 1;
			},
			result: {
				target(player, target) {
					if (
						player.countCards("h", function (card) {
							return player.hasValueTarget(card);
						})
					) {
						var nd = !player.needsToDiscard();
						if (
							player.hasCard(function (card) {
								if (get.position(card) != "h") {
									return false;
								}
								var val = get.value(card);
								if (nd && val < 0) {
									return true;
								}
								if (val <= 5) {
									return card.number >= 12;
								}
								if (val <= 6) {
									return card.number >= 13;
								}
								return false;
							})
						) {
							return -1;
						}
						return 0;
					}
					return -1;
				},
			},
		},
	},
	shijiebuju_yzs: {
		nobracket: true,
		locked: true,
		forced: true,
		popup: true,
		trigger: {
			source: "damageBegin2",
			player: "damageBegin4",
		},
		filter(event, player) {
			if (!event.source) return false;
			if (!event.source.countExpansions("_xuanhujishi_yzs_zhulu")) return false;
			return true;
		},
		async content(event, trigger, player) {
			const tag = "_xuanhujishi_yzs_zhulu"
			let cards = trigger.source.getExpansions("_xuanhujishi_yzs_zhulu");
			let handcards = trigger.source.getCards("h");
			let next = trigger.source.addToExpansion(handcards, player, "giveAuto")
			next.gaintag.add(tag)
			next.untrigger(true);
			await next
			if (cards && cards.length) {
				trigger.source.directgain(cards, "gain2");
				if (trigger.source.storage.currentHandcards_yzs != "_xuanhujishi_yzs_zhulu") trigger.source.removeGaintag(tag, cards);
				if (trigger.source.storage.currentHandcards_yzs)trigger.source.addGaintag(cards, trigger.source.storage.currentHandcards_yzs);
			}
			await game.delayx();
		}
	},
	//大佐
	kending_yzs: {
		async remove(target, num) {
			while (num-- > 0) {
				if (!target.countMark("kending_yzs_mark")) return;
				target.removeMark("kending_yzs_mark");
				let players = game.filterPlayer(cur => cur.name == "DaZuo_yzs")
				if (!players.length) continue;
				const controls = ["draw_card", "recover_hp"];
				const prompt = `令 大佐 恢复1点体力，或摸2张牌并给予你1张牌`
				const next = target.chooseControl(controls);
				next.set("prompt", prompt);
				next.set("forced", true);
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
				next.set("target", players[0])
				let result = await next.forResult();
				if (result.control == "draw_card") {
					for (let player of players) {
						await player.draw(2);
						if (target != player) await player.chooseToGive(1, true, target);
					}
				} else {
					for (let player of players) {
						await player.recover();
					}
				}
			}
		},
		subSkill: {
			mark: {
				charlotte: true,
				forced: true,
				marktext: "肯",
				intro: {
					content: "当前有#枚【肯定】标记",
				},
			}
		},
		locked: true,
		priority: 4,
		trigger: {
			player: "phaseEnd"
		},
		filter(event, player) {
			return player.countCards("h") >= 3;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseTarget(`【肯定】：请选择1名角色`, `回合结束时，若你手牌数≥3，你可令任意角色获得1枚${get.poptip("kending_yzs_mark")}标记`)
				.set("filterTarget", function (card, player, target) {
					if (target.hasSkill("hidden_yzs")) return false;
					return true;
				})
				.set("ai", target => {
					const player = get.player();
					return get.attitude(player, target)
				})
				.forResult()
		},
		async content(event, trigger, player) {
			let target = event.targets[0]
			target.addMark("kending_yzs_mark");
			if (target.countMark("kending_yzs_mark") > 2) {
				await lib.skill.kending_yzs.remove(target, target.countMark("kending_yzs_mark") - 2);
			}
		}
	},
	bianzhuang_yzs: {
		locked: true,
		prompt2: `出牌阶段开始前，你可跳过出牌阶段和弃牌阶段并倒置人物牌进入“ikun”状态直至你下一回合开始，期间你可用技能${get.poptip("shiyoubing_yzs")}`,
		priority: 2,
		trigger: {
			player: "phaseUseBegin"
		},
		check(event, player) {
			if (player.isHealthy()) return true;
			if (!player.countCards("h", { name: "tao" })) return true;
			return false;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.skip("phaseDiscard");
			game.broadcastAll(function (current) {
				if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/bianzhuang_yzs.png");
			}, player)
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/chicken_you_are_so_beautiful.mp3");
			player.addTempSkill("shiyoubing_yzs", { player: "phaseBegin" })
		},
	},
	shiyoubing_yzs: {
		onremove: "storage",
		locked: true,
		nobracket: true,
		marktext: "食",
		intro: {
			content: "回合外已发动#次【食油饼】",
		},
		priority: 1,
		trigger: {
			global: ["useCard", "phaseJudge"]
		},
		filter(event, player) {
			if (event.name == "phaseJudge") {
				if (lib.card[event.card.name]?.noEffect_yzs) return false;
				return true;
			}
			const info = lib.card[event.card.name];
			if (info.notarget) return false;
			if (get.type(event.card) == "delay") return false;
			return player.countDiscardableCards(player, "he")
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseToDiscard(player, "he", false)
				.set("filterCard", (card, player) => {
					return get.color(card, player) == "red" || get.color(card, player) == "black"
				})
				.set("prompt", `${get.translation(trigger.card)}即将生效`)
				.set("prompt2", `你可弃1张黑/红色牌令之无效/必定生效，然后${get.translation(trigger.player)}获得1枚${get.poptip("kending_yzs_mark")}`)
				.set("chooseonly", true)
				.set("ai", card => {
					const player = get.event().player;
					const target = get.event().target;
					if (get.attitude(player, target) > 0) {
						return get.color(card) == "red" ? 7 - get.value(card) : 0;
					} else {
						return get.color(card) == "black" ? 7 - get.value(card) : 0;
					}
				})
				.set("target", trigger.player)
				.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			game.broadcastAll(function (damageAudioInfo) {
				if (lib.config.background_audio) {
					game.playAudio(damageAudioInfo);
				}
			}, "effect/chickun.wav");
			if (player != _status.currentPhase) {
				player.addMark("shiyoubing_yzs", 1, false)
			}
			let card = event.cards[0];
			if (get.color(card, player) == "red") {
				if (trigger.name == "useCard") {
					trigger.directHit.addArray(game.filterPlayer());
				}
				trigger.card.storage.shiyoubing_yzs = true;
			} else if (get.color(card, player) == "black") {
				if (trigger.name == "phaseJudge") {
					trigger.untrigger("currentOnly");
					trigger.cancelled = true;
					game.log(trigger.card, "被【食油饼】无效了");
					return;
				} else {
					trigger.targets.length = 0;
					trigger.all_excluded = true;
				}
			}
			let target = trigger.player;
			target.addMark("kending_yzs_mark");
			if (target.countMark("kending_yzs_mark") > 2) {
				await lib.skill.kending_yzs.remove(target, target.countMark("kending_yzs_mark") - 2);
			}
			if (player.countMark("shiyoubing_yzs") >= 2) {
				game.broadcastAll(function (current) {
					if (current.node.avatar) current.node.avatar.setBackgroundImage("extension/一中杀/image/DaZuo_yzs.png");
				}, player)
				player.removeSkill("shiyoubing_yzs")
				for (let target of game.filterPlayer(cur => cur.countMark("kending_yzs_mark"))) {
					await lib.skill.kending_yzs.remove(target, target.countMark("kending_yzs_mark"));
				}
			}
		},
	},
	_sureHit_yzs: {
		subSkill: {
			huogong: {
				popup: false,
				ruleSkill: true,
				charlotte: true,
				forced: true,
				priority: -2,
				trigger: {
					player: "chooseToDiscardEnd",
				},
				filter(event, player) {
					let evt = event.getParent();
					return evt?.card?.storage?.shiyoubing_yzs && evt?.card?.name == "huogong"
				},
				async content(event, trigger, player) {
					trigger.result.bool = true;
				},
			},
		},
		popup: false,
		ruleSkill: true,
		charlotte: true,
		forced: true,
		priority: -2,
		trigger: {
			player: "judgeEnd",
		},
		filter(event, player) {
			let evt = event.getParent();
			return evt?.name == "phaseJudge" && evt.card?.storage?.shiyoubing_yzs;
		},
		async content(event, trigger, player) {
			let evt = trigger.getParent();
			let names = ["shandian", "lebu", "bingliang"]
			if (evt.card?.name && names.includes(evt.card.name)) {
				game.log(3);
				trigger.result.bool = false;
			} else {
				trigger.result.bool = false;
			}
		},
	},
	juanKill_yzs: {
		locked: true,
		nobracket: true,
		enable: ["chooseToUse"],
		hiddenCard: function (player, name) {
			if (!player.countCards("h")) return
			return name == 'tiesuo' || name == 'huogong' || name == 'wuzhong'
		},
		filter(event, player) {
			if (player.countMark("chengfengpolang_yzs_used")) return false;
			if (event.filterCard({ name: "tiesuo" }, player, event)) {
				if (player.hasCard(function (card, player) {
					return get.color(card, player) == "black";
				}, "he")) return true;
			}
			if (event.filterCard({ name: "huogong" }, player, event)) {
				if (player.hasCard(function (card, player) {
					return get.color(card, player) == "red";
				}, "he")) return true;
			}
			if (event.filterCard({ name: "wuzhong" }, player, event)) {
				if (player.hasCard(function (card, player) {
					return get.type(card, player) == "equip";
				}, "he")) return true;
			}
			return false;
		},
		chooseButton: {
			dialog() {
				return ui.create.dialog("卷の斩首", [
					[
						["锦囊", "", "tiesuo"],
						["锦囊", "", "huogong"],
						["锦囊", "", "wuzhong"],
					],
					"vcard",
				]);
			},
			filter(button, player) {
				var event = _status.event.getParent();
				if (button.link[2] == "tiesuo") {
					if (!event.filterCard({ name: "tiesuo" }, player, event)) {
						return false;
					}
					return (
						player.hasCard(function (card, player) {
							return get.color(card, player) == "black";
						}, "he")
					);
				}
				if (button.link[2] == "huogong") {
					if (!event.filterCard({ name: "huogong" }, player, event)) {
						return false;
					}
					return (
						player.hasCard(function (card, player) {
							return get.color(card, player) == "red";
						}, "he")
					);
				}
				if (button.link[2] == "wuzhong") {
					if (!event.filterCard({ name: "wuzhong" }, player, event)) {
						return false;
					}
					return (
						player.hasCard(function (card, player) {
							return get.type(card, player) == "equip";
						}, "he")
					);
				}
			},
			check(button) {
				var card = { name: button.link[2] },
					player = _status.event.player;
				return get.value(card, player) * get.sgn(player.getUseValue(card));
			},
			backup(links, player) {
				var index = 0;
				if (links[0][2] == "huogong") index = 1;
				if (links[0][2] == "wuzhong") index = 2;
				var next = {
					filterCard: [
						function (card, player) {
							return get.color(card, player) == "black";
						},
						function (card, player) {
							return get.color(card, player) == "red";
						},
						function (card, player) {
							return get.type(card, player) == "equip";
						},
						() => false,
					][index],
					position: "he",
					check(card) {
						if (card) {
							return 6.5 - get.value(card);
						}
						return 1;
					},
					viewAs: [
						{
							name: "tiesuo",
						},
						{
							name: "huogong",
						},
						{
							name: "wuzhong",
						},
					][index],
				};
				return next;
			},
			prompt(links, player) {
				var index = 0;
				if (links[0][2] == "huogong") index = 1;
				if (links[0][2] == "wuzhong") index = 2;
				return [
					"将1张黑色手牌当做【铁索连环】使用",
					"将1张红色手牌当做【火攻】使用",
					"将1张装备牌当做【无中生有】使用"
				][index];
			},
		},
		ai: {
			order: 4,
			threaten: 2,
			result: {player:2}
		}
	},
	//陈家豪
	gaoluan_yzs: {
		subSkill: {
			ban: {
				sub: true,
				sourceSkill: `gaoluan_yzs`
			},
		},
		priority: -2,
		trigger: {
			player: ["phaseDiscardBegin", "phaseDiscardEnd"]
		},
		enable: "phaseUse",
		usable: 1,
		selectTarget() {
			const player = get.event().player
			return player.hp > 0 ? player.hp : 1;
		},
		filter(event, player) {
			let num = player.hp > 0 ? player.hp : 1;
			return game.countPlayer(function (target) {
				return lib.skill.gaoluan_yzs.filterTarget(null, player, target)
			}) > num
		},
		async cost(event, trigger, player) {
			let num = player.hp > 0 ? player.hp : 1;
			event.result = await player.chooseTarget(`【搞乱】：你可指定${num}名角色`, `将你与这些角色的手牌洗混，然后由你指定顺序，你与这些角色依次获得其中1张直至无剩余`, num)
				.set("filterTarget", lib.skill.gaoluan_yzs.filterTarget)
				.set("ai", target => {
					const player = get.player();
					if (player.countCards("h") >= 4) return 0;
					if (get.attitude(player, target) > 0) return 4 - target.countCards("h")
					return target.countCards("h")
				})
				.forResult();
		},
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return true;
		},
		multiline: true,
		multitarget: true,
		async content(event, trigger, player) {
			let len = event.targets.length;
			if (len < 2) return;
			let players = [];
			for (let i = 0; i < len; i++) {
				let result = await player.chooseTarget(`请选择获得牌的顺序(${i + 1}/${len})`, true)
					.set("filterTarget", function (card, player, target) {
						let targets = get.event().targets;
						let choosed = get.event().choosed
						return targets.includes(target) && !choosed.includes(target)
					})
					.set("ai", target => {
						const player = get.player();
						return get.attitude(player,target)
					})
					.set("targets", event.targets)
					.set("choosed", players)
					.set("onChooseTarget", function () {
						const event = get.event();
						let choosed = get.event().choosed
						event.targetprompt2.add(target => {
							let list = [];
							if (choosed.includes(target)) list.add(`第${choosed.indexOf(target) + 1}位`)
							return list;
						});
					})
					.forResult();
				players.push(result.targets[0]);
			}
			const lose_list = [];
			let cards = [];
			event.targets.forEach(current => {
				const hs = current.getCards("h");
				if (hs.length) {
					cards.addArray(hs);
					//	current.$throw(hs.length, 500);
					game.log(current, "将", get.cnNumber(hs.length), "张牌置入了处理区");
					lose_list.push([current, hs]);
				}
			});
			if (lose_list.length) {
				await game
					.loseAsync({
						lose_list,
					})
					.setContent("chooseToCompareLose");
			}
			await game.delay();
			cards = cards.filterInD();
			for (let i = 0; ; i = (i + 1) % len) {
				cards = cards.filterInD();
				if (!cards.length) break;
				if (players[i]?.isIn()) {
					let card = cards.randomGet();
					await players[i].gain(card)
				}
			}
		},
		ai: {
			order: 2,
			expose: 0.3,
			result: {
				player(player, target) {
					let targets =[player].concat(ui.selected.targets??[]);
					if (!targets.length) return 0;
					let num = 0;
					targets.map(t => num += t.countCards("h"));
					num /= targets.length;
					return num-player.countCards("h")
				},
				target(player, target) {
					let targets = [player].concat(ui.selected.targets ?? []);
					if (!targets.length) return 0;
					let num = 0;
					targets.map(t => num += t.countCards("h"));
					num /= targets.length;
					return num - target.countCards("h")
				},
			}
		}
	},
	xintaibaozha_yzs: {
		nobracket: true,
		mod: {
			targetEnabled(card, player, target, now) {
				if (target.isMinHandcard()) {
					if (card.name == "sha" || card.name == "juedou") {
						return false;
					}
				}
			},
		},
		trigger: {
			player: "damageEnd"
		},
		forced: true,
		locked: false,
		priority: -2,
		filter(event, player) {
			return player.countDiscardableCards(player, "he");
		},
		async content(event, trigger, player) {
			let result = await player.chooseToDiscard(`【心态爆炸】：请弃置1~3张牌`, `若弃2/3张则你摸1张牌/恢复1点体力`, "he", [1, 3], true)
				.set("ai", card => {
					if (ui.selected.cards && ui.selected.cards.length >= 2) {
						return get.recoverEffect(player, player, player) - get.value(card);
					}
					return 7 - get.value(card);
				})
				.forResult();
			if (result.bool) {
				if (result.cards?.length == 2) {
					await player.draw()
				} else if (result.cards?.length == 3) {
					await player.recover();
				}
			}
		},
	},
	nongdiu_yzs: {
		enable: "phaseUse",
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return true;
		},
		async content(event, trigger, player) {
			await player.damage("nosource");
			await event.target.recover();
		},
		ai: {
			order: 2,
			result: {
				player(player, target) {
					return get.damageEffect(player,player,player)
				},
				target(player, target) {
					return get.recoverEffect(target, target, target)
				}
			}
		}
	},
	//陈刀
	ShakingSpirit_yzs: {
		group: ["ShakingSpirit_yzs_sha", "ShakingSpirit_yzs_skip"],
		subSkill: {
			sha: {
				priority: 4,
				forced: true,
				popup: false,
				trigger: { player: "useCard1" },
				filter(event, player) {
					if (!event.card || event.card.name != "sha") return false;
					if (!event.cards || !event.cards.length) return false;
					let evt = event.getParent();
					if (evt.name != "chooseToUse") return false;
					return true
				},
				async content(event, trigger, player) {
					trigger.baseDamage -= 1;
				}
			},
			skip: {
				priority: 4,
				forced: true,
				popup: false,
				trigger: { player: ["damageEnd", "damageZero"] },
				filter(event, player) {
					return !player.hasSkill("ShakingSpirit_yzs_buff")
				},
				async content(event, trigger, player) {
					player.addSkill("ShakingSpirit_yzs_buff")
				}
			},
			buff: {
				priority: 4,
				forced: true,
				trigger: { player: "phaseDrawBefore" },
				async content(event, trigger, player) {
					player.removeSkill("ShakingSpirit_yzs_buff")
					trigger.cancel()
				}
			}
		},
		nobracket: true,
		forced: true,
		locked: true,
		priority: -2,
		audio: "ext:一中杀/audio/skill:2",
		trigger: {
			player: "phaseUseBegin"
		},
		filter(event, player) {
			return player.countDiscardableCards(player, "h") > 0;
		},
		async content(event, trigger, player) {
			await player.chooseToDiscard("h", 2, true);
		}
	},
	GodgivenSwordsmanship_yzs: {
		Effect: function (targetPlayer) {
			// 1. 创建特效总容器
			const effectContainer = document.createElement('div');
			effectContainer.className = 'level-up-effect-container';

			// 设置容器样式，使其覆盖在玩家图片上方
			Object.assign(effectContainer.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '1000',
				pointerEvents: 'none', // 不阻挡鼠标事件
				overflow: 'visible' // 允许粒子飞出容器
			});

			targetPlayer.appendChild(effectContainer);

			// 2. 创建中心扩散光柱
			const centralBeam = document.createElement('div');
			centralBeam.className = 'level-up-central-beam';

			// 初始样式：垂直窄光柱，位于中心
			Object.assign(centralBeam.style, {
				position: 'absolute',
				top: '0',
				left: '50%',
				transform: 'translateX(-50%)',
				width: '10px', // 初始很窄
				height: '100%',
				// 金黄色到透明的渐变
				background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 215, 0, 0.9) 50%, rgba(255, 255, 255, 0) 100%)',
				filter: 'blur(4px)',
				boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
				opacity: '0',
				borderRadius: '20px'
			});

			effectContainer.appendChild(centralBeam);

			// 3. 创建喷发粒子
			const particleCount = 24; // 粒子总数
			const particles = [];
			// 升级通常使用金色/黄色调
			const colors = ['#ffffff', '#ffeb3b', '#ffc107', '#ffe082'];

			for (let i = 0; i < particleCount; i++) {
				const particle = document.createElement('div');
				particle.className = 'level-up-particle';

				const size = Math.random() * 5 + 3; // 3-8px
				const color = colors[Math.floor(Math.random() * colors.length)];

				// 决定向左还是向右喷射 (0 为左，1 为右)
				const direction = i % 2 === 0 ? -1 : 1;

				Object.assign(particle.style, {
					position: 'absolute',
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: color,
					borderRadius: '50%',
					left: '50%',
					top: '50%', // 从中心点开始
					transform: 'translate(-50%, -50%)',
					boxShadow: `0 0 10px ${color}`,
					opacity: '0',
					filter: 'blur(0.5px)',
					// 添加拖尾效果 CSS (如果需要更强的拖尾，可以使用 canvas，CSS可以用 drop-shadow 模拟)
					willChange: 'transform, opacity'
				});

				effectContainer.appendChild(particle);
				particles.push({ element: particle, direction, size });
			}

			// ================= 开始动画 =================

			const durationParams = {
				beam: 1200,
				particle: 1000
			};

			// A. 中心光柱动画：出现 -> 变宽(向左右扩散) -> 变淡消失
			centralBeam.animate([
				{
					width: '10px',
					opacity: '0',
					boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
				},
				{
					width: '30px',
					opacity: '1',
					offset: 0.2, // 快速出现
					boxShadow: '0 0 30px rgba(255, 215, 0, 1)'
				},
				{
					width: '150%', // 向左右扩散变得比原图还宽
					opacity: '0.1',
					offset: 0.8,
					boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
				},
				{
					width: '180%',
					opacity: '0',
					boxShadow: '0 0 0px rgba(255, 215, 0, 0)'
				}
			], {
				duration: durationParams.beam,
				easing: 'ease-out' // 先快后慢
			});

			// B. 粒子喷发动画
			particles.forEach((particle, index) => {
				const { element, direction, size } = particle;

				// 随机化速度和角度，使其看起来更自然
				const delay = Math.random() * 200; // 0-200ms 随机延迟，分批喷出
				const angleValue = Math.random() * 25 + 15; // 15-40度夹角

				// 计算终点坐标 (基于容器百分比或像素)
				// 向斜上方喷射
				const destinationX = direction * (Math.random() * 100 + 100); // 横向移动 100-200px
				const destinationY = -(Math.random() * 150 + 50); // 纵向向上移动 50-200px

				element.animate([
					{
						transform: 'translate(-50%, -50%) scale(1)',
						opacity: '0',
						offset: 0
					},
					{
						opacity: '1',
						offset: 0.1 // 快速亮起
					},
					{
						// 终点：向斜上方飞出，同时略微缩小
						transform: `translate(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px)) scale(0.5)`,
						opacity: '0',
						offset: 1
					}
				], {
					duration: durationParams.particle + Math.random() * 400, // 随机时长
					delay: delay,
					easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)' // 初始爆发快，后期减速
				});
			});

			// 4. 动画结束后移除 DOM 元素
			// 以最长的动画时间为准 (粒子可能因为 delay 和随机时长变得很长)
			const maxLifeTime = durationParams.particle + 600;
			setTimeout(() => {
				if (effectContainer.parentNode) {
					effectContainer.parentNode.removeChild(effectContainer);
				}
			}, maxLifeTime);

			// 5. 添加必要的全局 CSS (主要是为了给粒子添加可选的拖尾滤镜，或者光柱的呼吸感)
			if (!document.querySelector('#level-up-effect-style')) {
				const style = document.createElement('style');
				style.id = 'level-up-effect-style';
				style.textContent = `
            /* 可以在这里添加针对粒子拖尾的特殊效果，CSS实现拖尾较难，这里用高斯模糊简单模拟 */
            .level-up-particle {
                /* 启用硬件加速 */
                backface-visibility: hidden;
            }
            
            /* 可选：给玩家图片本身添加一个短暂的金色高光闪烁 */
            @keyframes playerHighlight {
                0% { filter: brightness(1); }
                20% { filter: brightness(1.5) drop-shadow(0 0 10px gold); }
                100% { filter: brightness(1); }
            }

            .level-up-target-animate {
                animation: playerHighlight 0.5s ease-out;
            }
        `;
				document.head.appendChild(style);
			}

			// 可选：给目标本体添加一个闪烁类名，并在稍后移除
			targetPlayer.classList.add('level-up-target-animate');
			setTimeout(() => {
				targetPlayer.classList.remove('level-up-target-animate');
			}, 500);
		},
		async gain(player) {
			if (!player.hasSkill("GodgivenSwordsmanship_yzs") || player.isTempBanned("GodgivenSwordsmanship_yzs")) return;
			player.addMark("GodgivenSwordsmanship_yzs", 1, false);
			game.log(player, `获得了1点【技】，当前有${player.countMark("GodgivenSwordsmanship_yzs") }/3点【技】`)
			if (player.countMark("GodgivenSwordsmanship_yzs") >= 3) {
				player.clearMark("GodgivenSwordsmanship_yzs",false);
				player.popup("通神")
				player.addSkill("GodgivenSwordsmanship_yzs_tongshen")
				game.broadcastAll(function (target) {
					if (target.node.avatar && !target.node.avatar.overlayElement_tongshen) {
						// --- 特效应用核心函数 ---
						const applyUltimateHalo = function (node, suffix) {
							// 1. 清除旧图层
							const propName = 'overlayElement_tongshen';
							if (node[propName]) {
								node[propName].remove();
							}

							// 2. 创建主特效容器（用于整体缩放和定位）
							let overlay = document.createElement('div');
							overlay.className = 'overlayElement_tongshen';

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
				if (player.countCards("h") < 6) await player.draw(6 - player.countCards("h"));
				await lib.skill.GodgivenSwordsmanship_yzs.LevelUp(player);
			}
		},
		async LevelUp(player) {
			player.addMark("GodgivenSwordsmanship_yzs_lv", 1, false);
			player.playEffectOL(lib.skill.GodgivenSwordsmanship_yzs.Effect);
			player.popup("升级")
			if (lib.config.background_audio) {
				game.playAudio("effect", "recover");
			}
			game.broadcast(function () {
				if (lib.config.background_audio) {
					game.playAudio("effect", "recover");
				}
			});
			if (player.countMark("GodgivenSwordsmanship_yzs_lv") >= 20 && player.hasSkill("ThunderWithMe_yzs") && !player.isTempBanned("ThunderWithMe_yzs")) {
				if (!game.hasPlayer((target) => {
					return !target.hasSkill("hidden_yzs") && !target.isLinked()
				})) return;
				let result = await player
					.chooseTarget("你升级时可横置1名角色", false, function (card, player, target) {
						return !target.hasSkill("hidden_yzs") && !target.isLinked()
					})
					.set("ai", target => {
						const player = get.player();
						return get.effect(target, { name: "tiesuo" }, player, player);
					})
					.set("animate", false)
					.forResult();
				if (result.bool) {
					await result.targets[0].link()
				}
			}
		},
		group: ["GodgivenSwordsmanship_yzs_start"],
		subSkill: {
			start: {
				priority: 1,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				popup: false,
				forced: true,
				locked: true,
				filter(event, player) {
					return game.hasPlayer(current => current !== player) && (event.name != "phase" || game.phaseNumber == 0);
				},
				async content(event, trigger, player) {
					player.addMark("GodgivenSwordsmanship_yzs_lv", 1, false);
				}
			},
			tongshen: {
				onremove(player) {
					if (player.node.avatar && player.node.avatar.overlayElement_tongshen) {
						player.node.avatar.overlayElement_tongshen.remove();
						delete player.node.avatar.overlayElement_tongshen;
					}
				},
				nopop:true,
				priority: -4,
				name: "通神",
				forced: true,
				/*
				audio: "MandateAura_yzs",
				trigger: {
					player: "phaseBegin"
				},
				async content(event, trigger, player) {
					player.removeSkill("GodgivenSwordsmanship_yzs_tongshen");
					await player.recover();
					await lib.skill.GodgivenSwordsmanship_yzs.LevelUp(player);
				}
				*/
			}
		},
		mark: true,
		markimage: "extension/一中杀/image/GodgivenSwordsmanship_yzs.png",
		intro: {
			mark(dialog, content, player) {
				let lv = player.countMark("GodgivenSwordsmanship_yzs_lv")
				let ji = player.countMark("GodgivenSwordsmanship_yzs")
				dialog.addText(`当前LV为：${lv}`);
				dialog.addText(`当前有${ji}/3点【技】`);
				dialog.addText(`当前${player.hasSkill("GodgivenSwordsmanship_yzs_tongshen") ? '' : '未'}处于通神`);
			},
		},
		nobracket: true,
		locked: true,
	},
	MandateAura_yzs: {
		nobracket: true,
		locked: true,
		forced: true,
		priority: -2,
		audio: "ext:一中杀/audio/skill:4",
		trigger: {
			player: "phaseEnd"
		},
		filter(event, player) {
			return !player.countCards("h")
		},
		async content(event, trigger, player) {
			await lib.skill.GodgivenSwordsmanship_yzs.gain(player);
			await player.draw(2);
			await lib.skill.GodgivenSwordsmanship_yzs.LevelUp(player);
		},
		ai: {
			nokeep:true,
		}
	},
	xiangjian_yzs: {
		Effect: function (player, target) {
			if (!player || !target) return;

			// 1. 特效画布层
			const container = document.createElement('div');
			Object.assign(container.style, {
				position: 'fixed',
				top: '0', left: '0', width: '100vw', height: '100vh',
				zIndex: '99999', pointerEvents: 'none', overflow: 'visible'
			});
			document.body.appendChild(container);

			// 2. 坐标计算
			const pRect = player.getBoundingClientRect();
			const tRect = target.getBoundingClientRect();
			const startX = pRect.left + pRect.width / 2;
			const startY = pRect.top + pRect.height / 2;
			const endX = tRect.left + tRect.width / 2;
			const endY = tRect.top + tRect.height / 2;

			// 计算飞行角度
			const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

			// 3. 构造精制月牙 (尺寸缩小)
			const crescent = document.createElement('div');
			const size = 120; // 基础跨度缩小至 120px

			Object.assign(crescent.style, {
				position: 'absolute',
				width: `${size}px`,
				height: `${size}px`,
				left: `${startX}px`,
				top: `${startY}px`,
				borderRadius: '50%',
				// 核心几何：阴影在左，弧形向左凸出
				boxShadow: `-${size / 5}px 0 0 0 #ffeb3b`,
				// 强烈的光晕效果 (金色到橙色)
				filter: `
            drop-shadow(0 0 8px #ffeb3b) 
            drop-shadow(0 0 20px #ff9800)
            brightness(1.2)
        `,
				opacity: '0',
				transformOrigin: 'center center',
				// 初始旋转：弧面朝向目标 (+180deg修正)
				transform: `translate(-50%, -50%) rotate(${angle + 180}deg) scale(0.3)`,
				willChange: 'transform, opacity, filter'
			});

			container.appendChild(crescent);

			// 4. 斩击动画逻辑：爆发 -> 疾驰 -> 击中消散
			const duration = 400;

			crescent.animate([
				{
					// 挥出：从极小变大，爆发力
					transform: `translate(-50%, -50%) rotate(${angle + 180}deg) scale(0.3)`,
					opacity: '0'
				},
				{
					// 飞行中：月牙展开，维持稳定尺寸
					transform: `translate(-50%, -50%) rotate(${angle + 180}deg) scale(1.0)`,
					opacity: '1',
					offset: 0.15 // 极短时间达到最大
				},
				{
					// 击中：到达终点，维持尺寸
					transform: `translate(calc(-50% + ${endX - startX}px), calc(-50% + ${endY - startY}px)) rotate(${angle + 180}deg) scale(1.0)`,
					opacity: '1',
					filter: `
                drop-shadow(0 0 8px #ffeb3b) 
                drop-shadow(0 0 20px #ff9800)
                brightness(1.2)
                blur(0px)
            `,
					offset: 0.85 // 飞行的绝大部分时间
				},
				{
					// 消散效果：击中后轻微扩散，模糊，迅速透明
					transform: `translate(calc(-50% + ${endX - startX}px), calc(-50% + ${endY - startY}px)) rotate(${angle + 180}deg) scale(1.3)`,
					opacity: '0',
					// 通过增加模糊来模拟“气劲碎裂”
					filter: `
                drop-shadow(0 0 8px #ffeb3b) 
                drop-shadow(0 0 20px #ff9800)
                brightness(1.5)
                blur(15px)
            `,
					offset: 1
				}
			], {
				duration: duration,
				easing: 'cubic-bezier(0.2, 0, 0.2, 1)' // 先快后慢的爆发感
			}).onfinish = () => {
				// 5. 目标受击震动
				target.animate([
					{ transform: 'translate(2px, 2px)' },
					{ transform: 'translate(-2px, -2px)' },
					{ transform: 'translate(0, 0)' }
				], { duration: 50, iterations: 2 });

				// 清理内存
				setTimeout(() => {
					if (container.parentNode) container.parentNode.removeChild(container);
				}, 50);
			};
		},
		group: ["xiangjian_yzs_renew"],
		subSkill: {
			renew: {
				priority: 44,
				popup: false,
				forced: true,
				trigger: { player: "phaseBegin" },
				filter(event, player) {
					return !event.skill && player.countMark("xiangjian_yzs_used")
				},
				async content(event, trigger, player) {
					player.clearMark("xiangjian_yzs_used", false);
				}
			}
		},
		audio: "ext:一中杀/audio/skill:2",
		priority: -2,
		trigger: {
			global: ["useCard", "respond"]
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (!player.countDiscardableCards(player, "h")) return false;
			if (player.countMark("xiangjian_yzs_used")) return false;
			return event.card?.name == "sha"
		},
		async cost(event, trigger, player) {
			let tongshen = player.hasSkill("GodgivenSwordsmanship_yzs_tongshen");
			let card = trigger.card
			let prompt2 = `你可弃1张手牌令 ${get.translation(trigger.player)} 的${get.translation(card)}无效<br>`;
			if (tongshen) prompt2 += `<font color="#fa5c4c">【剑技】：你可额外弃1张手牌，然后弃置${get.translation(trigger.player)}1张牌并对其造成0点伤害。</font>`
			event.result = await player.chooseToDiscard(player, "h", false)
				.set("filterCard", (card, player) => {
					return true
				})
				.set("ai", card => {
					const player = get.event().player;
					const target = get.event().target;
					if (get.attitude(player, target) > 0) return 0;
					return 7 - get.value(card);
				})
				.set("target",trigger.player)
				.set("selectCard", tongshen ? [1, 2] : 1)
				.set("prompt", `${get.translation(card)}即将生效`)
				.set("prompt2", prompt2)
				.set("chooseonly", true)
				.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			player.addMark("xiangjian_yzs_used")
			player.playEffectOL(lib.skill.xiangjian_yzs.Effect, trigger.player);
			let tongshen = event.cards.length > 1;
			if (tongshen) {
				player.removeSkill("GodgivenSwordsmanship_yzs_tongshen")
			}
			await lib.skill.GodgivenSwordsmanship_yzs.gain(player);
			if (trigger.name == "useCard") {
				trigger.targets.length = 0;
				trigger.all_excluded = true;
			} else {
				trigger.cancel();
				let evt = trigger.getParent();
				if (evt.name == "chooseToRespond") {
					evt.result.bool = false;
				}
			}
			if (tongshen) {
				if (trigger.player.countDiscardableCards(player, "he")) await player.discardPlayerCard(trigger.player, 1, true, "he");
				await trigger.player.damage(0)
			}
		},
		ai: {
			expose:0.4,
		}
	},
	jianzhi_yzs: {
		subSkill: {
			damage: {
				marktext: "指",
				intro: {
					content: "下次造成非零伤害为0(剩余#次)",
				},
				charlotte: true,
				"skill_id": "jianzhi_yzs_damage",
				sub: true,
				sourceSkill: "jianzhi_yzs",
				locked: true,
				forced: true,
				trigger: {
					source: "damageBegin1",
				},
				filter(event, player) {
					return player.countMark("jianzhi_yzs_damage") > 0 && event.num > 0;
				},
				async content(event, trigger, player) {
					player.removeMark("jianzhi_yzs_damage", 1, false)
					trigger.num = 0;
				},
			},
		},
		zhuanhuanji: true,
		mark: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str = storage ? `你对其他角色造成伤害时，你可弃2张手牌，然后弃置其1张牌。`
					: `出牌阶段：你弃2张手牌然后令1名其他角色防具无效且其下张【杀】伤害-1，持续1自轮。`
				if (player.hasSkill("GodgivenSwordsmanship_yzs_tongshen")) {
					if (storage) str += `<br><font color="#fa5c4c">【剑技】：其跳过下一摸牌阶段。</font>`
					else str += `<br><font color="#fa5c4c">【剑技】：其下次造成非零伤害为0（可叠加）。</font>`
				}
				return str;
			},
		},
		trigger: {
			source: ["damageBegin1"]
		},
		priority: -1,
		audio: "MandateAura_yzs",
		logTarget: "player",
		enable: "phaseUse",
		prompt(event, player) {
			let str = `【技能】：转换技：①：出牌阶段：你弃2张牌然后令1名其他角色防具无效且其下张【杀】伤害-1，持续1自轮。`;
			if (player.hasSkill("GodgivenSwordsmanship_yzs_tongshen")) str += `<br><font color="#fa5c4c">【剑技】：其下次造成非零伤害为0（可叠加）。</font>`;
			return str;
		},
		filter(event, player) {
			if (player.countCards("h") < 2) return false;
			if (event.name == "damage") {
				return player.storage?.jianzhi_yzs;
			}
			return !player.storage.jianzhi_yzs;
		},
		filterCard(card) {
			return true
		},
		check(card) {
			return 7 - get.value(card);
		},
		position: "h",
		selectCard() {
			return 2
		},
		selectTarget: 1,
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return target != player;
		},
		discard: false,
		lose: false,
		delay: false,
		async cost(event, trigger, player) {
			event.result = player.countCards("h") >= 2 ? await player.chooseToDiscard(2, false, "h")
				.set("prompt", `是否对 ${get.translation(trigger.player)} 发动【剑指】`)
				.set("prompt2", `【技能】：转换技：②：你对其他角色造成伤害时，你可弃2张手牌，然后弃置其1张牌。<br><font color="#fa5c4c">【剑技】：其跳过下一摸牌阶段。</font>`)
				.set("ai", card => {
					const player = get.event().player;
					const target = get.event().target;
					if (get.attitude(player, target) > 0) return 0;
					return 7 - get.value(card);
				})
				.set("target", trigger.player)
				.set("chooseonly", true)
				.forResult() : { bool: false };
			event.result.targets = [trigger.player];
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			player.changeZhuanhuanji(event.name);
			let target = event.targets[0];
			let tongshen = player.hasSkill("GodgivenSwordsmanship_yzs_tongshen");
			if (tongshen) player.removeSkill("GodgivenSwordsmanship_yzs_tongshen");
			await lib.skill.GodgivenSwordsmanship_yzs.gain(player);
			player.playEffectOL(lib.skill.xiangjian_yzs.Effect, target);
			if (trigger?.name == "damage") {
				if (target.countDiscardableCards(player, "he")) await player.discardPlayerCard(target, 1, true, "he");
				if (tongshen) {
					target.addSkill("ShakingSpirit_yzs_buff")
				}
			} else {
				target.addSkill("jianzhi_yzs_qinggang")
				target.markAuto("jianzhi_yzs_qinggang", player)
				target.addSkill("jianzhi_yzs_sha")
				target.markAuto("jianzhi_yzs_sha", player)
				if (tongshen) {
					target.addSkill("jianzhi_yzs_damage")
					target.addMark("jianzhi_yzs_damage", 1, false)
				}
			}
		},
		ai: {
			order: 8,
			result: {
				target:-2,
			}
		}
	},
	jianzhi_yzs_qinggang: {
		mark: true,
		nopop: true,
		marktext: "指",
		intro: {
			nocount: true,
			content: "你的防具失效了",
		},
		ai: {
			"unequip2": true,
		},
		charlotte: true,
		forced: true,
		popup: false,
		forceDie: true,
		trigger: {
			global: ["phaseBegin", "die"]
		},
		filter(event, player) {
			if (event.name == "phase" && event.skill) return false;
			return player.storage.jianzhi_yzs_qinggang.includes(event.player);
		},
		async content(event, trigger, player) {
			player.removeSkill("jianzhi_yzs_qinggang")
		},
		sub: true,
		sourceSkill: "jianzhi_yzs",
	},
	jianzhi_yzs_sha: {
		mark: true,
		nopop: true,
		marktext: "指",
		intro: {
			nocount: true,
			content: "你的下张【杀】伤害-1",
		},
		charlotte: true,
		forced: true,
		popup: false,
		forceDie: true,
		trigger: {
			global: ["phaseBegin", "die"],
			player: ["useCard"]
		},
		filter(event, player) {
			if (event.name == "useCard") {
				return event.card?.name == "sha"
			}
			if (event.name == "phase" && event.skill) return false;
			return player.storage.jianzhi_yzs_sha.includes(event.player);
		},
		async content(event, trigger, player) {
			player.removeSkill("jianzhi_yzs_sha")
			if (trigger?.name == "useCard") {
				trigger.baseDamage -= 1;
			}
		},
		sub: true,
		sourceSkill: "jianzhi_yzs",
	},
	WindSword_yzs: {
		group: ["WindSword_yzs_qinggang", "WindSword_yzs_use"],
		subSkill: {
			used: {
				onremove: "storage",
				charlotte: true,
				sub: true,
				sourceSkill: "WindSword_yzs",
			},
			qinggang: {
				popup: false,
				audio: "qinggang_skill",
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					return event.card.name === "sha" && event.card?.storage?.WindSword_yzs;
				},
				forced: true,
				logTarget: "target",
				async content(event, trigger, player) {
					if (trigger.getParent().WindSword_yzs) {
						trigger.target.addTempSkill("qinggang2");
						trigger.target.storage.qinggang2.add(trigger.card);
						trigger.target.markSkill("qinggang2");
					}
					if (trigger.card?.storage?.WindSword_yzs && trigger.card.storage.WindSword_yzs > 1) {
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
					}
				},
				ai: {
					"unequip_ai": true,
					skillTagFilter(player, tag, arg) {
						if (arg && arg.name === "sha") {
							return true;
						}
						return false;
					},
				},
			},
			use: {
				popup: false,
				priority: 13,
				trigger: {
					player: "useCard",
				},
				filter(event, player) {
					return event.card.name === "sha" && event.card?.storage?.WindSword_yzs
				},
				forced: true,
				async content(event, trigger, player) {
					if (trigger.addCount !== false) {
						trigger.addCount = false;
						trigger.player.getStat("card")[trigger.card.name]--;
					}
					if (trigger.card?.storage?.WindSword_yzs_baseDamage) {
						trigger.baseDamage += 1;
						trigger.WindSword_yzs = true;
					}
				}
			},
		},
		nobracket: true,
		audio: "MandateAura_yzs",
		position: "h",
		enable: "phaseUse",
		filter(event, player) {
			if (player.countMark("GodgivenSwordsmanship_yzs_lv") < 5) return false;
			if (!player.countCards("h")) return false;
			return player.countMark("WindSword_yzs_used") < 1;
		},
		filterCard(card, player) {
			return true;
		},
		selectCard() {
			const player = get.event().player;
			if (player.hasSkill("GodgivenSwordsmanship_yzs_tongshen")) return [1, 3];
			return 1;
		},
		filterOk() {
			return ui.selected.cards.length != 2;
		},
		position: "hes",
		viewAs: {
			name: "sha",
			storage: {
				WindSword_yzs: 1,
			}
		},
		viewAsFilter(player) {
			if (get.zhu(player, "shouyue")) {
				if (!player.countCards("h")) {
					return false;
				}
			} else {
				if (!player.countCards("h")) {
					return false;
				}
			}
		},
		prompt(event, player) {
			let str = `【技能】：出牌阶段限1次：你弃1张手牌然后视为使用无距离限制的普通【杀】，若你无手牌，则之伤害+1且无视其他角色防具。`;
			if (player.hasSkill("GodgivenSwordsmanship_yzs_tongshen")) str += `<br><font color="#fa5c4c">【剑技】：你可额外弃2张手牌，则此【杀】需用2张【闪】响应。<Lv.8>此次【技能】使用不计入次数。</font>`;
			return str;
		},
		check(card) {
			const val = get.value(card);
			if (_status.event.name == "chooseToRespond") {
				return 1 / Math.max(0.1, val);
			}
			return 5 - val;
		},
		async precontent(event, trigger, player) {
			player.addMark("WindSword_yzs_used", 1, false)
			player.addTempSkill("WindSword_yzs_used")
			if (event.result.cards.length >= 2) {
				player.removeSkill("GodgivenSwordsmanship_yzs_tongshen")
				event.result.card.storage.WindSword_yzs = 2;
				if (player.countMark("GodgivenSwordsmanship_yzs_lv") >= 8) {
					player.removeMark("WindSword_yzs_used", 1, false)
				}
			}
			if (!player.countCards("h")) {
				event.result.card.storage.WindSword_yzs_baseDamage = true;
			}
			let cards = event.result.cards
			event.result.cards = [];
			await player.discard(cards, player)
			await lib.skill.GodgivenSwordsmanship_yzs.gain(player);
		},
		mod: {
			cardUsable(card, player, num) {
				if (card?.storage?.WindSword_yzs) {
					return Infinity
				}
			},
			targetInRange: function (card) {
				if (card?.storage?.WindSword_yzs) {
					return true;
				}
			},
		},
		ai: {
			order(item, player) {
				if (player.countCards("h") == 1) return 14;
				return 0.1;
			},
			expose: 0.4,
		}
	},
	CloudSword_yzs: {
		group: ["CloudSword_yzs_renew"],
		subSkill: {
			renew: {
				priority: 44,
				popup: false,
				forced: true,
				trigger: { player: "phaseBegin" },
				filter(event, player) {
					return !event.skill && player.countMark("CloudSword_yzs_used")
				},
				async content(event, trigger, player) {
					player.clearMark("CloudSword_yzs", false);
				}
			}
		},
		audio: "MandateAura_yzs",
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
			player.yzs_UseShunfaji("CloudSword_yzs");
		},
		clickableFilter: function (player) {
			if (player.countMark("GodgivenSwordsmanship_yzs_lv") < 15) return false;
			if (player.countMark("CloudSword_yzs_used")) return false;
			if (player.countCards("h") < 4) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let prompt2 = `<Lv.15>【技能】：每自轮限1次${get.poptip("wuyongchang_yzs")}：你弃4张手牌并获得1点【技】，然后你弃置任意角色1张牌。`;
			if (player.hasSkill("GodgivenSwordsmanship_yzs_tongshen")) prompt2 += `<br><font color="#fa5c4c">【剑技】：你额外弃置其1张牌并对其造成0点伤害。</font>`;
			let result = await player.chooseCardTarget(false)
				.set("filterTarget", (card, player, target) => {
					return !target.hasSkill("hidden_yzs");
				})
				.set("filterCard", (card, player, target) => {
					return true
				})
				.set("position", "h")
				.set("selectCard", 4)
				.set("prompt", "积云剑")
				.set("prompt2", prompt2)
				.forResult()
			if (!result.bool) {
				return;
			}
			let next = player.useSkill("CloudSword_yzs")
			next.targets = result.targets;
			next.cards = result.cards;
			await next;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (!player.countCards("h")) return false;
			if (player.countMark("GodgivenSwordsmanship_yzs_lv") < 15) return false;
			if (player.countMark("CloudSword_yzs_used")) return false;
			if (player.countCards("h") < 4) return false;
			return true
		},
		prompt(event, player) {
			let str = `<Lv.15>【技能】：每自轮限1次：${get.poptip("wuyongchang_yzs")}：你弃4张牌并获得1点【技】，然后你弃置任意角色1张牌。`;
			if (player.hasSkill("GodgivenSwordsmanship_yzs_tongshen")) str += `<br><font color="#fa5c4c">【剑技】：你额外弃置其1张牌并对其造成0点伤害。</font>`;
			return str;
		},
		selectCard: 4,
		discard: false,
		lose: false,
		delay: false,
		position: "h",
		filterCard: true,
		filterTarget(card, player, target) {
			return !target.hasSkill("hidden_yzs");
		},
		check(card) {
			return 5-get.value(card)
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			player.addMark("CloudSword_yzs_used", 1, false)
			let target = event.targets[0];
			let tongshen = player.hasSkill("GodgivenSwordsmanship_yzs_tongshen");
			if (tongshen) player.removeSkill("GodgivenSwordsmanship_yzs_tongshen");
			await lib.skill.GodgivenSwordsmanship_yzs.gain(player);
			await lib.skill.GodgivenSwordsmanship_yzs.gain(player);
			player.playEffectOL(lib.skill.xiangjian_yzs.Effect, target);
			if (target.countDiscardableCards("he", player)) await player.discardPlayerCard("he", target, tongshen ? 2 : 1, true);
			if (tongshen) await target.damage(0);
		}, 
		ai: {
			order: 5,
			result: {
				target:-1,
			}
		}
	},
	ThunderWithMe_yzs: {
		nobracket: true,
		audio: "MandateAura_yzs",
		priority: -25,
		trigger: {
			player: "useCard1",
		},
		frequent: true,
		filter(event, player) {
			if (player.countMark("GodgivenSwordsmanship_yzs_lv") < 20) return false;
			if (event.card.name == "sha" && !game.hasNature(event.card)) {
				return true;
			}
			return false;
		},
		audio: true,
		check(event, player) {
			let eff = 0,
				nature = event.card.nature;
			for (let i = 0; i < event.targets.length; i++) {
				eff -= get.effect(event.targets[i], event.card, player, player);
				event.card.nature = "thunder";
				eff += get.effect(event.targets[i], event.card, player, player);
				event.card.nature = nature;
			}
			return eff > 0;
		},
		prompt2(event, player) {
			return "将" + get.translation(event.card) + "改为雷属性";
		},
		async content(event, trigger, player) {
			game.setNature(trigger.card, "thunder");
			if (get.itemtype(trigger.card) == "card") {
				var next = game.createEvent("zhuque_clear");
				next.card = trigger.card;
				event.next.remove(next);
				trigger.after.push(next);
				next.setContent(function () {
					game.setNature(trigger.card, []);
				});
			}
		},
	},
	//休塔尔克
	jianren_yzs: {
		group: ["jianren_yzs_phaseJieshu"],
		subSkill: {
			phaseJieshu: {
				audio: "jianren_yzs",
				locked: true,
				forced: true,
				popup: true,
				priority: 3,
				trigger: { player: "phaseJieshu" },
				filter(event, player) {
					return player.hujia > 0;
				},
				async content(event, trigger, player) {
					let num = player.hujia;
					if (num > 0) await player.changeHujia(-num, "lose");
					await player.recover(num)
				}
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		locked: true,
		forced: true,
		popup: false,
		priority: 3,
		trigger: {
			player: "changeHpEnd"
		},
		filter(event, player) {
			return event.num < 0;
		},
		async content(event, trigger, player) {
			await player.changeHujia(-trigger.num, "gain")
		},
		ai: {
			maixie:true,
		}
	},
	shantianji_yzs: {
		group: ["shantianji_yzs_use"],
		subSkill: {
			use: {
				popup: false,
				forced: true,
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					return event.card?.storage?.shantianji_yzs || event.card?.storage?.shantianji_yzs_directHit
				},
				async content(event, trigger, player) {
					if (trigger.card?.storage?.shantianji_yzs && trigger.card.storage.shantianji_yzs > 0) {
						trigger.baseDamage += trigger.card.storage.shantianji_yzs;
					}
					if (trigger.card?.storage?.shantianji_yzs_directHit) {
						trigger.directHit = game.filterPlayer();
					}
					if (trigger.baseDamage >= 2 && trigger.card?.storage?.shantianji_yzs_directHit) {
						game.broadcastAll((player) => {
							player.$skill("闪天击", "legend", "fire");
							game.delay(2);
							var imagePath = lib.assetURL + "/extension/一中杀/image/background/shantianji_yzs.png";
							var duration = 2000;

							var img = document.createElement("img");
							img.src = imagePath;

							img.style.position = "fixed";
							img.style.left = "0";
							img.style.top = "0";
							img.style.width = "100%";
							img.style.height = "100%";
							img.style.objectFit = "cover";  // 保证图片覆盖且不变形（会裁剪）
							img.style.zIndex = "0";
							img.style.opacity = "0";
							img.style.transition = "opacity 0.5s ease-out";
							img.style.pointerEvents = "none";

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
				},
				sub: true,
				sourceSkill: "shantianji_yzs",
				"_priority": 0,
				"skill_id": "shantianji_yzs_use",
			}
		},
		audio: "ext:一中杀/audio/skill:1",
		nobracket: true,
		position: "h",
		enable: "chooseToUse",
		hiddenCard: function (player, name) {
			if (!player.countCards("h")) return
			return (name == 'sha')
		},
		filterCard: function (card) {
			return get.type(card) == 'basic';
		},
		viewAsFilter: function (player) {
			return player.countCards('h', { type: 'basic' }) > 0;
		},
		viewAs: {
			name: "sha",
		},
		prompt(event, player) {
			return `将基本牌当做伤害+${player.hujia}的普通【杀】使用`
		},
		"prompt2": "若底牌不为【杀】则不可响应",
		check: function (card) {
			let v = 8 - get.value(card);
			const player = get.player();
			if (get.type(card) == "basic" && get.name(card) != "sha") v += 2 * player.hujia + 1;
			return v
		},
		async precontent(event, trigger, player) {
			if (event.result.cards?.length != 1) return;
			let card = event.result.cards[0];
			event.result.card.storage.shantianji_yzs = player.hujia;
			if (get.name(card, player) != "sha") {
				event.result.card.storage.shantianji_yzs_directHit = true;
			}
		},
		ai: {
			damageBonus: true,
			skillTagFilter(player) {
				if (!player.countCards("h", card => get.type(card) == "basic")) {
					return false;
				}
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
	qieyong_yzs: {
		group: ["qieyong_yzs_damage"],
		subSkill: {
			damage: {
				priority: 1,
				trigger: {
					player: "damageBegin3",
				},
				filter(event, player) {
					return event.num > 0 && !player.hujia || player.hujia < 0;;
				},
				forced: true,
				async content(event, trigger, player) {
					trigger.num++;
					if (trigger.source) {
						if (get.translation(trigger.source).includes("莉涅")) {
							game.broadcastAll(() => {
								game.playAudio("ext:一中杀/audio/skill/qieyong_yzs_Linie.mp3");
							});
						}
					}
				},
				ai: {
					damageBonus: true,
				},
			},
		},
		audio: "ext:一中杀/audio/skill:2",
		locked: true,
		priority: 2,
		logTarget: "player",
		trigger: {
			global: "damageBegin4",
		},
		filter(event, player) {
			if (!player.countDiscardableCards(player, "h")) return false
			if (event.num <= 0) return false;
			if (player.hujia > 0) return false;
			if (event.player == player) return false;
			if (event.player.hasSkill("hidden_yzs")) return false;
			if (event.source == player) return false;
			return true;
		},
		prompt2(event, player) {
			const str = event.source ? get.translation(event.source) + `对你造成的` + (event.num) + `点伤害` : (event.num) + `点无来源伤害`
			return `弃置全部手牌，然后无效 ` + get.translation(event.player) + ` 受到的` + event.num + `点伤害，并受到 ` + str;
		},
		check(event, player) {
			return (get.attitude(player, event.player) > 1 && player.countCards("h") <= 2) || (get.attitude(player, event.player) > 3);
		},
		async content(event, trigger, player) {
			await player.modedDiscard(player.getCards("h"), player);
			const num = trigger.num;
			trigger.cancel();
			if (!trigger.source) await player.damage("nosource", num)
			else {
				await player.damage(trigger.source, num);
			}
		},
	},
	//车天可
	BladeDemon_yzs: {
		locked: true,
		forced: true,
		priority: 2,
		trigger: {
			player: "changeHpEnd"
		},
		filter(event, player) {
			return player.hp <= 1;
		},
		async content(event, trigger, player) {
			player.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
			await player.reinitCharacter(player.name1, 'BDXiangSiniao_yzs');
			if (player.name2) {
				await player.reinitCharacter(player.name2, 'BDXiangSiniao_yzs');
			}
			if (player.hp < 1) {
				await player.recover(1 - player.hp);
			}
			player.clearMark("BloodFeast_yzs_used", false);
		}
	},
	BloodFeast_yzs: {
		group: ["BloodFeast_yzs_renew", "BloodFeast_yzs_draw"],
		subSkill: {
			draw: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				popup: false,
				priority: 2,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num -= 2;
				},
				ai: {
					threaten: -1.3,
				},
			},
			renew: {
				priority: 44,
				popup: false,
				forced: true,
				trigger: { player: "phaseBegin" },
				filter(event, player) {
					return !event.skill && player.countMark("BloodFeast_yzs_used")
				},
				async content(event, trigger, player) {
					player.clearMark("BloodFeast_yzs_used", false);
				}
			}
		},
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num - 2
				}
			},
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
			player.yzs_UseShunfaji("BloodFeast_yzs");
		},
		clickableFilter: function (player) {
			if (player.countMark("BloodFeast_yzs_used")) return false;
			return true
		},
		clickableContent: async function (event, trigger, player) {
			let prompts = [`①：恢复1点体力并制作1枚${get.poptip("Totem_yzs")}`, `②：恢复或失去1点体力，然后摸2张牌`, `③：调整手牌数至上限，然后失去1点体力`];
			let index = player.hp
			if (index < 1) index = 1;
			if (index > 3) index = 3;
			index--;
			let ask = await player.chooseBool(`是否发动【血宴】?<br>${prompts[index]}`)
				.forResult();
			if (!ask.bool) return;
			let next = player.useSkill("BloodFeast_yzs")
			await next;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (player.countMark("BloodFeast_yzs_used")) return false;
			return true
		},
		prompt(event, player) {
			let prompts = [`①：恢复1点体力并制作1枚${get.poptip("Totem_yzs")}`, `②：恢复或失去1点体力，然后摸2张牌`, `③：调整手牌数至上限，然后失去1点体力`];
			let index = player.hp
			if (index < 1) index = 1;
			if (index > 3) index = 3;
			index--;
			return prompts[index]
		},
		async content(event, trigger, player) {
			let index = player.hp
			if (index < 1) index = 1;
			if (index > 3) index = 3;
			player.addMark("BloodFeast_yzs_used", 1, false)
			if (index == 1) {
				await player.recover();
				player.addMark("Totem_yzs")
			} else if (index == 2) {
				let result = await player.chooseButton([
					`选择恢复或失去1点体力`,
					[
						[
							["recover", "回血"],
							["loseHp", "掉血"],
						],
						"tdnodes",
					],
				])
					.set("ai", button => Math.random())
					.set("forced", true)
					.set("selectButton", 1)
					.forResult();
				if (!result.bool) return
				if (result.links[0] == "recover") {
					await player.recover();
				} else {
					await player.loseHp();
				}
				await player.draw(2);
			} else if (index == 3) {
				await player.drawTo(player.getHandcardLimit())
				await player.loseHp();
			}
		},
		ai: {
			order: 4,
			result: {
				player:1
			}
		}
	},
	BloodCovenant_yzs: {
		audio: "ext:一中杀/audio/skill:2",
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.hasPlayer(target => !target.hasSkill("hidden_yzs"))
		},
		selectTarget: 1,
		filterTarget(card, player, target) {
			if (target.hasSkill("hidden_yzs")) return false;
			return true
		},
		prompt(event, player) {
			let num = Math.max(1, player.hp);
			return `出牌阶段限1次：你令任意角色发动其中一项，然后你发动另一项：<br>①：摸${num}张牌，然后你失去1点体力；<br>②：弃${num}张手牌。`
		},
		async content(event, trigger, player) {
			let num = Math.max(1, player.hp);
			let result = await event.target.chooseButton([
				`你发动其中一项，然后 ${get.translation(player)} 发动另一项`,
				[
					[
						["draw", `①：摸${num}张牌，然后 ${get.translation(player)} 失去1点体力`],
						["discard", `②：弃${num}张手牌`],
					],
					"textbutton",
				],
			])
				.set("forced", true)
				.set("selectButton", 1)
				.set("num", num)
				.set("filterButton", function (button) {
					let player = get.event().player;
					if (button.link == "discard") return player.countDiscardableCards(player, "h") >= get.event().num;
					return true
				})
				.set("ai", button => {
					const num=get.event().num
					if (button.link == "draw") {
						return num - 1;
					} else {
						return 1 - num;
					}
				})
				.forResult();
			if (!result.bool) return
			if (result.links[0] == "draw") {
				await event.target.draw(num);
				await player.loseHp();

				num = Math.max(1, player.hp);
				await player.chooseToDiscard(num, true);
			} else {
				await event.target.chooseToDiscard(num, true);

				num = Math.max(1, player.hp);
				await player.draw(num);
				await player.loseHp();
			}
		}
	},
	DemonBlade_yzs: {
		group: ["DemonBlade_yzs_recover"],
		subSkill: {
			recover: {
				locked: true,
				forced: true,
				priority: 2,
				trigger: {
					source: "damageEnd"
				},
				filter(event, player) {
					return event.num > 0;
				},
				async content(event, trigger, player) {
					await player.recover(trigger.num)
				}
			}
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
				if (arg && arg.name == "sha") {
					return true;
				}
				return false;
			},
		},
		locked: true,
		forced: true,
		priority: 2,
		audio: "ext:一中杀/audio/skill:2",
		trigger: {
			player: "changeHpEnd"
		},
		filter(event, player) {
			return player.hp >= 3;
		},
		async content(event, trigger, player) {
			player.playEffectOL(lib.skill.Sacrifice_yzs.Effect);
			await player.reinitCharacter(player.name1, 'BDCheTianke_yzs');
			if (player.name2) {
				await player.reinitCharacter(player.name2, 'BDCheTianke_yzs');
			}
			player.clearMark("BloodFeast_yzs_used", false);
		}
	},
	//范熊封次郎
	ExFighting_yzs: {
		group: ["ExFighting_yzs_sha"],
		subSkill: {
			sha: {
				locked: true,
				forced: true,
				priority: -2,
				audio: "ExFighting_yzs",
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					let range = player.getAttackRange();
					if (range < 1) range = 1;
					return event.card.name == "sha" && get.distance(player, event.target) == range;
				},
				async content(event, trigger, player) {
					let result = _status._yzsStorm == "BulletStorm"
						? { bool: false }
						: await player.chooseTarget()
							.set("prompt", `对 ${get.translation(trigger.target)} 造成1点伤害，否则召引${get.poptip("BulletStorm")}`)
							.set("targetx", trigger.target)
							.set("filterTarget", (card, player, target) => {
								return target == get.event().targetx
							})
							.set("ai", target => {
								const player = get.player();
								return get.damageEffect(target,player,player)
							})
							.forResult();
					if (result.bool && result.targets[0]) {
						await result.targets[0].damage()
					} else {
						if (_status._yzsStorm !== "BulletStorm") await player.yzs_SummonStorm("BulletStorm");
					}
				}
			},
		},
		targetprompt2: target => {
			const player = get.player(),
				card = get.card(),
				list = [];
			if (card?.name != "sha" || !target.classList.contains("selectable")) {
				return list;
			}
			let range = player.getAttackRange();
			if (range < 1) range = 1;
			if (get.distance(player, target) == range) list.add("👊");
			return list;
		},
		onChooseToUse(event) {
			event.targetprompt2.add(lib.skill.ExFighting_yzs.targetprompt2);
		},
		onChooseTarget(event) {
			event.targetprompt2.add(lib.skill.ExFighting_yzs.targetprompt2);
		},
		locked: true,
		nobracket: true,
		mod: {
			aiOrder(player, card, num) {
				if (player.isPhaseUsing() && get.subtype(card) == "equip1" && !get.cardtag(card, "gifts")) {
					var range0 = player.getAttackRange();
					var range = 0;
					var info = get.info(card);
					if (info && info.distance && info.distance.attackFrom) {
						range -= info.distance.attackFrom;
					}
					if (player.getEquip(1)) {
						var num = 0;
						var info = get.info(player.getEquip(1));
						if (info && info.distance && info.distance.attackFrom) {
							num -= info.distance.attackFrom;
						}
						range0 -= num;
					}
					range0 += range;
					if (
						range0 == player.getHistory("useCard").length + player.getHistory("respond").length + 2 &&
						player.countCards("h", function (cardx) {
							return get.subtype(cardx) != "equip1" && player.getUseValue(cardx) > 0;
						})
					) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: ["useCard", "respond"],
		},
		forced: true,
		onremove(player) {
			player.removeTip("ExFighting_yzs");
		},
		filter(event, player) {
			let range = player.getAttackRange();
			if (range < 1) range = 1;
			let count = player.getHistory("useCard").length + player.getHistory("respond").length;
			player.addTip("ExFighting_yzs", "极限格斗 " + count, true);
			return count == range;
		},
		audio: "ext:一中杀/audio/skill:4",
		content() {
			player.draw(player.getHistory("useCard").length + player.getHistory("respond").length);
		},
		ai: {
			threaten: 1.8,
			effect: {
				target_use(card, player, target, current) {
					let used = target.getHistory("useCard").length + target.getHistory("respond").length;
					if (get.subtype(card) == "equip1" && !get.cardtag(card, "gifts")) {
						if (player != target || !player.isPhaseUsing()) {
							return;
						}
						let range0 = player.getAttackRange();
						let range = 0;
						let info = get.info(card);
						if (info && info.distance && info.distance.attackFrom) {
							range -= info.distance.attackFrom;
						}
						if (player.getEquip(1)) {
							let num = 0;
							let info = get.info(player.getEquip(1));
							if (info && info.distance && info.distance.attackFrom) {
								num -= info.distance.attackFrom;
							}
							range0 -= num;
						}
						range0 += range;
						let delta = range0 - used;
						if (delta < 0) {
							return;
						}
						let num = player.countCards("h", function (card) {
							return (get.cardtag(card, "gifts") || get.subtype(card) != "equip1") && player.getUseValue(card) > 0;
						});
						if (delta == 2 && num > 0) {
							return [1, 3];
						}
						if (num >= delta) {
							return "zeroplayertarget";
						}
					} else if (get.tag(card, "respondShan") > 0) {
						if (current < 0 && used == target.getAttackRange() - 1) {
							if (card.name === "sha") {
								if (!target.mayHaveShan(player, "use")) {
									return;
								}
							} else if (!target.mayHaveShan(player)) {
								return 0.9;
							}
							return [1, (used + 1) / 2];
						}
					} else if (get.tag(card, "respondSha") > 0) {
						if (current < 0 && used == target.getAttackRange() - 1 && target.mayHaveSha(player)) {
							return [1, (used + 1) / 2];
						}
					}
				},
			},
		},
	},
	BruteForceArmament_yzs: {
		locked: true,
		audio: "ExFighting_yzs",
		nobracket: true,
		priority: 3,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && player.hasEquipableSlot(1) && !player.getEquips("IronFist_yzs").length && player.hasEquipableSlot(2) && !player.getEquips("SteelArmor_yzs").length;
		},
		async content(event, trigger, player) {
			var card = game.createCard2("IronFist_yzs");
			player.$gain2(card, false);
			await player.equip(card);
			var card = game.createCard2("SteelArmor_yzs");
			player.$gain2(card, false);
			await player.equip(card);
			game.delayx();
		},
		mod: {
			canBeGained(card, source, player) {
				if (player.getEquips("IronFist_yzs").includes(card) || player.getEquips("SteelArmor_yzs").includes(card)) {
					return false;
				}
			},
			canBeDiscarded(card, source, player) {
				if (player.getEquips("IronFist_yzs").includes(card) || player.getEquips("SteelArmor_yzs").includes(card)) {
					return false;
				}
			},
			canBeReplaced(card, player) {
				if (player.getVEquips("IronFist_yzs").includes(card) || player.getVEquips("SteelArmor_yzs").includes(card)) {
					return false;
				}
			},
			cardDiscardable(card, player) {
				if (player.getEquips("IronFist_yzs").includes(card) || player.getEquips("SteelArmor_yzs").includes(card)) {
					return false;
				}
			},
			cardEnabled2(card, player) {
				if (player.getEquips("IronFist_yzs").includes(card) || player.getEquips("SteelArmor_yzs").includes(card)) {
					return false;
				}
			},
		},
		group: ["BruteForceArmament_yzs_blocker1", "BruteForceArmament_yzs_blocker2"],
		subSkill: {
			"blocker1": {
				trigger: {
					player: ["loseBefore", "disableEquipBefore"],
				},
				forced: true,
				priority: 3,
				filter(event, player) {
					if (event.name == "disableEquip") {
						return event.slots.includes("equip1");
					}
					var cards = player.getEquips("IronFist_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("IronFist_yzs"));
					} else {
						while (trigger.slots.includes("equip1")) {
							trigger.slots.remove("equip1");
						}
					}
				},
				sub: true,
				sourceSkill: "BruteForceArmament_yzs",
				"_priority": 0,
				"skill_id": "BruteForceArmament_yzs_blocker1",
			},
			"blocker2": {
				trigger: {
					player: ["loseBefore", "disableEquipBefore"],
				},
				forced: true,
				priority: 2,
				filter(event, player) {
					if (event.name == "disableEquip") {
						return event.slots.includes("equip2");
					}
					var cards = player.getEquips("SteelArmor_yzs");
					return event.cards.some(card => cards.includes(card));
				},
				content() {
					if (trigger.name == "lose") {
						trigger.cards.removeArray(player.getEquips("SteelArmor_yzs"));
					} else {
						while (trigger.slots.includes("equip2")) {
							trigger.slots.remove("equip2");
						}
					}
				},
				sub: true,
				sourceSkill: "BruteForceArmament_yzs",
				"_priority": 0,
				"skill_id": "BruteForceArmament_yzs_blocker2",
			},
		},
	},
	//红魔龙
	canhuozhong_yzs: {
		derivation: "canhuozhong_yzs_effect",
		audio: "ext:一中杀/audio/skill:6",
		locked: true,
		nobracket: true,
		enable: "phaseUse",
		prompt: `锁定技：出牌阶段，若当前为【火风暴】，你可终止之并进入${get.poptip("canhuozhong_yzs_effect")}状态`,
		filter(event, player) {
			return _status._yzsStorm == "FireStorm"
		},
		async content(event, trigger, player) {
			await player.yzs_cancelStorm();
			player.addSkill("canhuozhong_yzs_effect")
			game.log(player, "进入了【激昂】状态")
		},
		ai: {
			order: 2,
			result: {
				player(player, target) {
					if (player.hasSkill("canhuozhong_yzs_effect")) return -1;
					return 1;
				}
			}
		}
	},
	canhuozhong_yzs_effect: {
		nopop: true,
		sub: true,
		sourceSkill: `canhuozhong_yzs`,
		group: ["canhuozhong_yzs_effect_discard"],
		subSkill: {
			discard: {
				priority: 2,
				trigger: {
					player: "phaseDiscardBefore",
				},
				forced: true,
				content() {
					trigger.cancel();
				},
			},
		},
		mark: true,
		marktext: "激",
		intro: {
			content: `你使用牌时受到1点无来源火焰伤害。你跳过弃牌阶段`,
		},
		direct: true,
		popup: true,
		priority: -2,
		trigger: {
			player: ["useCard"],
		},
		filter(event, player) {
			return true
		},
		async content(event, trigger, player) {
			await player.damage("fire", "nosource");
		},
		ai: {
			fireAttack:true,
		}
	},
	xingnujingyan_yzs: {
		global: "xingnujingyan_yzs_use",
		group: "xingnujingyan_yzs_recover",
		subSkill: {
			use: {
				forced: true,
				popup: false,
				trigger: {
					player: "kuangchangbaozha_yzsBegin",
				},
				priority: -5,
				filter(event, player) {
					if (event.card.name != 'kuangchangbaozha_yzs' || !event.card.storage.xingnujingyan_yzs) return false;
					return true;
				},
				async content(event, trigger, player) {
					let result = await player
						.chooseButton(["选择【矿场爆炸】要弃置的牌的类型，不选则为锦囊", [[["basic", "基本"], ["equip", "装备"]], "tdnodes"]])
						.set("filterButton", button => {
							return true;
						})
						.set("ai",button=> {
							const player = get.player();
							const trick = player.countCards("h", card => get.type2(card) == "trick");
							const basic = player.countCards("h", card => get.type2(card) == "basic");
							const equip = player.countCards("h", card => get.type2(card) == "equip");
							if (basic == 1 && button.link == "basic") return 0;
							if (equip == 1 && button.link == "equip") return 0;
							let v = 0;
							if (trick == 1)v= 1;
							else if (trick == 0) v= get.recoverEffect(player, player, player);
							else v= 7 - trick;
							if (button.link == "basic") {
								if (basic == 0) return get.recoverEffect(player, player, player)-v;
								return 7 - basic-v;
							} else if (button.link == "equip") {
								if (equip == 0) return get.recoverEffect(player, player, player)-v;
								return 7 - equip-v;
							} 
						})
						.set("forced", false)
						.set("selectButton", 1)
						.forResult();
					if (!result.bool) {
						player.popup("锦囊")
						return;
					};
					if (result.links[0]) {
						player.popup(get.translation(result.links[0]))
						trigger.filter = card => get.type2(card) == result.links[0];
					}
				},
			},
			recover: {
				forced: true,
				popup: false,
				trigger: {
					global: "useCardAfter",
				},
				priority: -5,
				filter(event, player) {
					if (event.card.name != 'kuangchangbaozha_yzs' || !event.card.storage.xingnujingyan_yzs) return false;
					if (game.getGlobalHistory("changeHp", function (evt) {
						return evt.getParent().name == "recover" && evt.player == player && evt.getParent(2) == event;
					}).length) return false;
					//if (player.hasHistory('changeHp', evt => evt.getParent().name=="recover"&&evt.getParent(2) == event)) return false;
					return true;
				},
				async content(event, trigger, player) {
					await player.yzs_updateCountDown(player.yzs_getCountDown(i => i.name == "LavaShell_yzs"));
				},
			}
		},
		locked: true,
		audio: "canhuozhong_yzs",
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
			player.yzs_UseShunfaji("xingnujingyan_yzs");
		},
		clickableFilter: function (player) {
			if (get.itemtype(_status.currentPhase) != "player") return false;
			return player.hasSkill("canhuozhong_yzs_effect")
		},
		clickableContent: async function (event, trigger, player) {
			let ask = await player.chooseBool(`是否发动【惺怒净炎】?<br>锁定技：${get.poptip("wuyongchang_yzs")}：你退出${get.poptip("canhuozhong_yzs_effect")}状态并令 ${get.translation(_status.currentPhase)} 视为使用${get.poptip("kuangchangbaozha_yzs")}，
	且其可将其中的“锦囊牌”改为“任意一种类型的牌”。若你未因此恢复体力，${get.poptip("LavaShell_yzs")}${get.poptip("sing_yzs_count")}-1`)
				.forResult();
			if (!ask.bool) return;
			let next = player.useSkill("xingnujingyan_yzs")
			await next;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			let evt = event.getParent();
			if (evt.name != "phaseUse" && evt.name != "_save") return false;
			if (event.responded) return false;
			if (get.itemtype(_status.currentPhase) != "player") return false;
			return player.hasSkill("canhuozhong_yzs_effect")
		},
		prompt(event, player) {
			return `锁定技：${get.poptip("wuyongchang_yzs")}：你退出${get.poptip("canhuozhong_yzs_effect")}状态并令 ${get.translation(_status.currentPhase)} 视为使用${get.poptip("kuangchangbaozha_yzs")}，
	且其可将其中的“锦囊牌”改为“任意一种类型的牌”。若你未因此恢复体力，${get.poptip("LavaShell_yzs")}${get.poptip("sing_yzs_count")}-1`
		},
		async content(event, trigger, player) {
			game.log(player, "退出了【激昂】状态")
			player.removeSkill("canhuozhong_yzs_effect");
			if (get.itemtype(_status.currentPhase) == "player") {
				await _status.currentPhase.chooseUseTarget({ name: "kuangchangbaozha_yzs", isCard: false, storage: { xingnujingyan_yzs: true } }, true);
			}
		},
		ai: {
			order: 5,
			result: {
				player:2,
			}
		}
	},
	LavaShell_yzs: {
		group: ["LavaShell_yzs_change"],
		subSkill: {
			change: {
				locked: true,
				priority: -3,
				forced: true,
				trigger: {
					player: "changeHpEnd",
				},
				filter(event, player) {
					return event.num != 0;
				},
				async content(event, trigger, player) {
					await player.yzs_updateCountDown(player.yzs_getCountDown(i => i.name == "LavaShell_yzs"));
				},
			}
		},
		locked: true,
		nobracket: true,
		init(player, skill) {
			if (!player.yzs_hasCountDown(i => i.name == "LavaShell_yzs")) player.yzs_setCountDown({
				num: 1,
				repeatNum: 1,
				command: {
					async todo(player) {
						player.addMark("LavaShell_yzs_mark");
						if (player.countMark("LavaShell_yzs_mark") < 3) return;
						player.clearMark("LavaShell_yzs_mark");
						game.trySkillAudio("canhuozhong_yzs");
						await player.draw(3);
						if (_status._yzsStorm == "FireStorm" && player.hasSkill("canhuozhong_yzs_effect")) return;
						let result = { bool: false }
						if (_status._yzsStorm == "FireStorm") {
							result = { bool: true }
						} else if (player.hasSkill("canhuozhong_yzs_effect")) {
							result = { bool: false }
						} else {
							result = await player.chooseTarget()
								.set("prompt", `进入${get.poptip("canhuozhong_yzs_effect")}状态，否则转换至${get.poptip("FireStorm")}`)
								.set("targetx", player)
								.set("filterTarget", (card, player, target) => {
									return target == get.event().targetx
								})
								.set("ai",target=>1)
								.forResult();
						}
						if (result.bool) {
							game.log(player, "进入了【激昂】状态")
							player.addSkill("canhuozhong_yzs_effect")
						} else {
							if (_status._yzsStorm !== "FireStorm") await player.yzs_changeStorm("FireStorm");
						}
					},
					list: [player],
				},
				value(item, player) {
					return 2;
				},
				name: "LavaShell_yzs",
				prompt: `你获得1枚${get.poptip("LavaShell_yzs_mark")}标记。你体力值变动时本${get.poptip("sing_yzs_count")}-1`,
				skill: "LavaShell_yzs"
			});
		},
	},
	LavaShell_yzs_mark: {
		sub: true,
		sourceSkill: `LavaShell_yzs`,
		marktext: "熔",
		intro: {
			content: `当前有#/3枚${get.poptip("LavaShell_yzs_mark")}标记`,
		},
	},
	//范熊勇太郎
	bili_yzs: {
		countDistance(player) {
			let def = player.countExpansions("bili_yzs")
			let atk = -player.countExpansions("bili_yzs_down")
			const equips1 = player.getVCards("e", function (card) {
				return !card.cards?.some((card2) => {
					return ui.selected.cards?.includes(card2);
				});
			}), equips2 = player.getVCards("e", function (card) {
				return !card.cards?.some((card2) => {
					return ui.selected.cards?.includes(card2);
				});
			});
			for (let i = 0; i < equips1.length; i++) {
				let info = get.info(equips1[i]).distance;
				if (!info) {
					continue;
				}
				if (info.globalFrom) {
					atk += info.globalFrom;
				}
			}
			for (let i = 0; i < equips2.length; i++) {
				let info = get.info(equips2[i]).distance;
				if (!info) {
					continue;
				}
				if (info.globalTo) {
					def += info.globalTo;
				}
			}
			return [-atk, def]
		},
		group: ["bili_yzs_start", "bili_yzs_discard", "bili_yzs_sha"],
		subSkill: {
			discard: {
				audio: "bili_yzs",
				priority: 2,
				locked: true,
				prompt2: `弃牌阶段若你坐骑栏已满，你可改为弃置全部坐骑`,
				trigger: {
					player: "phaseDiscardBegin",
				},
				filter: function (event, player) {
					return player.getEquips(3).length > 0 && player.getEquips(4).length > 0
				},
				check(event, player) {
					return player.needsToDiscard() > 2;
				},
				async content(event, trigger, player) {
					event.cards = player.getEquips(3).concat(player.getEquips(4));
					game.broadcastAll(function () {
						if (lib.config.background_audio) {
							game.playAudio(`effect/equip3.mp3`);
						}
					});
					await player.discard(event.cards)
					await trigger.cancel();
				},
			},
			start: {
				audio: "bili_yzs",
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
					game.broadcastAll(function () {
						if (lib.config.background_audio) {
							game.playAudio(`effect/equip3.mp3`);
						}
					});
					let next = player.addToExpansion(get.cards(4), player, "gain2")
					next.gaintag.add("bili_yzs")
					await next
				},
			},
			sha: {
				audio: "bili_yzs",
				priority: -2,
				forced: true,
				locked: true,
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					if (event.card.name == "sha") {
						return true;
					}
					return false;
				},
				async content(event, trigger, player) {
					trigger.baseDamage--;
					const ups = player.getExpansions("bili_yzs");
					const downs = player.getExpansions("bili_yzs_down");
					if (ups.length + downs.length < 1) return;
					const result = await player
						.chooseButton(["你可翻转1张【优骏】，若翻转暗置【优骏】则此【杀】伤害+1<br>明置的【优骏】", ups, "暗置的【优骏】", downs], 1, false)
						.set("filterButton", function (button) {
							return true
						})
						.set("ai", button => {
							if (button.link.hasGaintag("bili_yzs")) return 4;
							return 3 + Math.random();
						})
						.forResult();
					if (result.bool && result.links) {
						game.broadcastAll(function () {
							if (lib.config.background_audio) {
								game.playAudio(`effect/equip3.mp3`);
							}
						});
						let tag = result.links[0].hasGaintag("bili_yzs") ? "bili_yzs_down" : "bili_yzs"
						await player.loseToSpecial(result.links);
						let next = player.addToExpansion(result.links, player, "draw")
						next.gaintag.add(tag);
						next.untrigger(true);
						await next;
						if (tag == "bili_yzs") trigger.baseDamage++;
					}
				},
			},
		},
		locked: true,
		mark: true,
		markimage: "extension/一中杀/image/bili_yzs.png",
		intro: {
			mark(dialog, content, player) {
				const ups = player.getExpansions("bili_yzs");
				const downs = player.getExpansions("bili_yzs_down");
				if (!ups.length && !downs.length) return "无【优骏】";
				if (downs.length) {
					if (player.isUnderControl(true)) {
						dialog.addText("暗置的【优骏】：");
						dialog.addAuto(downs);
					} else {
						dialog.addText("共有" + get.cnNumber(downs.length) + "张暗置的【优骏】");
					}
				} else {
					dialog.addText("无暗置的【优骏】");
				}
				if (ups.length) {
					dialog.addText("明置的【优骏】：");
					dialog.addAuto(ups);
				}

				let dis = lib.skill.bili_yzs.countDistance(player)
				dialog.addText(`当前进攻距离为：${dis[0]}`);
				dialog.addText(`当前防御距离为：${dis[1]}`);
				dialog.addText(`(以上仅考虑自身技能)`);
			},
		},
		mod: {
			globalTo: function (from, to, distance) {
				return distance + to.countExpansions("bili_yzs");
			},
			globalFrom: function (from, to, distance) {
				return distance - from.countExpansions("bili_yzs_down");
			},
		},
		audio: "ext:一中杀/audio/skill:4",
		enable: "phaseUse",
		filter(event, player) {
			if (!player.countCards("he", card => get.type(card, player) == "basic")) return false;
			return true;
		},
		prompt: `出牌阶段，你可将红/黑色基本牌当做防御/进攻坐骑置入坐骑栏`,
		filterCard(card, player) {
			return get.type(card, player) == "basic" && ["black", "red"].includes(get.color(card, player))
		},
		selectCard: 1,
		discard: false,
		lose: false,
		delay: false,
		check(card) {
			const player=get.player()
			if (player.getEquip(3) && get.color(card) == "black") return 0;
			if (player.getEquip(4) && get.color(card) == "red") return 0;
			return 8-get.value(card)
		},
		async content(event, trigger, player) {
			let card = {};
			let target = player;
			if (get.color(event.cards[0], player) == "black") {
				card = get.autoViewAs({ name: "chitu" }, event.cards, player)
			} else {
				card = get.autoViewAs({ name: "hualiu" }, event.cards, player)
			}
			game.broadcastAll(function () {
				if (lib.config.background_audio) {
					game.playAudio(`effect/equip3.mp3`);
				}
			});
			await target.equip(card);
		},
		ai: {
			order(item, player) {
				let dis = lib.skill.bili_yzs.countDistance(player)
				let atk = dis[0];
				if (atk % 2) return 1;
				return 10;
			},
			result: {
				player:1,
			}
		}
	},
	congling_yzs: {
		group: ['congling_yzs_phaseJieshu'],
		subSkill: {
			phaseJieshu: {
				audio: "bili_yzs",
				forced: true,
				locked: true,
				priority: -2,
				trigger: { player: "phaseJieshuBegin" },
				filter(event, player) {
					let dis = lib.skill.bili_yzs.countDistance(player)
					let def = dis[1]
					return def == 0;
				},
				async content(event, trigger, player) {
					await player.showHandcards();
					let cards = player.getCards("h", card => get.type(card, player) == "basic");
					await player.modedDiscard(cards);
					while (cards.some(i => player.hasUseTarget(i))) {
						let result = await player
							.chooseButton(["从令：是否使用其中的一张牌？", cards])
							.set("filterButton", button => {
								return _status.event.player.hasUseTarget(button.link);
							})
							.forResult();
						if (!result.bool) break;
						let card = result.links[0];
						cards.remove(card);
						await player.chooseUseTarget(true, card, false);
					}
				},
			}
		},
		forced: true,
		locked: true,
		priority: -1,
		audio: "bili_yzs",
		trigger: {
			player: "useCard1",
		},
		filter(event, player) {
			const ups = player.getExpansions("bili_yzs");
			const downs = player.getExpansions("bili_yzs_down");
			if (ups.length + downs.length < 1) return false;
			if (get.type2(event.card, player) == "trick") {
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			const ups = player.getExpansions("bili_yzs");
			const downs = player.getExpansions("bili_yzs_down");
			if (ups.length + downs.length < 1) return;
			const result = await player
				.chooseButton(["你使用锦囊牌时翻转1张【优骏】，然后若你进攻距离为偶/奇数，你摸2张牌/弃2张手牌<br>明置的【优骏】", ups, "暗置的【优骏】", downs], 1, true)
				.set("filterButton", function (button) {
					return true
				})
				.set("ai", button => Math.random())
				.forResult();
			if (result.bool && result.links) {
				game.broadcastAll(function () {
					if (lib.config.background_audio) {
						game.playAudio(`effect/equip3.mp3`);
					}
				});
				let tag = result.links[0].hasGaintag("bili_yzs") ? "bili_yzs_down" : "bili_yzs"
				await player.loseToSpecial(result.links);
				let next = player.addToExpansion(result.links, player, "draw")
				next.gaintag.add(tag);
				next.untrigger(true);
				await next;

				let dis = lib.skill.bili_yzs.countDistance(player)
				let atk = dis[0]
				if (atk % 2) {
					await player.chooseToDiscard(2, true, "h")
				} else {
					await player.draw(2);
				}
			}
		},
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					if (get.type2(card) == "trick") {
						let dis = lib.skill.bili_yzs.countDistance(player)
						let atk = dis[0]
						if (atk % 2) return num + 10;
						return num / 10;
					}
					if (get.name(card) == "sha") {
						let dis = lib.skill.bili_yzs.countDistance(player)
						let atk = dis[0]
						if (atk % 2) return num/10;
						return num + 10;
					}
				}
				return num;
			},
		},
	},
	//言辣奉
	wenyanxuci_yzs: {
		group: ["wenyanxuci_yzs_start", "wenyanxuci_yzs_phaseDraw", "wenyanxuci_yzs_discard", "wenyanxuci_yzs_phaseEnd", "wenyanxuci_yzs_phaseBefore"],
		subSkill: {
			mark: {
				charlotte: true,
				onremove(player, skill) {
					player.clearMark("chongshi_yzs", false)
				},
			},
			phaseDraw: {
				priority: 3,
				forced: true,
				popup: false,
				trigger: {
					player: "phaseDrawBegin",
				},
				async content(event, trigger, player) {
					await trigger.cancel();
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
					await player.draw(2);
					let next = player.addToExpansion(get.cards(6), player, "draw")
					next.gaintag.add("wenyanxuci_yzs")
					await next
				},
			},
			discard: {
				priority: -2,
				locked: true,
				popup: false,
				forced: true,
				trigger: {
					player: "loseAfter",
					global: "loseAsyncAfter",
				},
				filter(event, player) {
					let evt = event.getParent(3);
					if (evt?.name == "wenyanxuci_yzs") return false;
					if (!player.countExpansions("wenyanxuci_yzs")) return false;
					if (!event.cards || !event.cards.some(card => get.position(card, true) == "d")) return false;
					if (event.type != "discard" || event.player.isDead()) return false;
					if ((event.discarder && event.discarder != player) || event.getParent(2).player != event.player) return false;
					if (!event.getl(event.player).hs.length) return false;
					return true;
				},
				async content(event, trigger, player) {
					let cards = trigger.cards.filter(card => get.position(card, true) == "d" && trigger.getl(trigger.player).hs.includes(card));
					if (!cards.length) return;

					let xucis = player.getExpansions("wenyanxuci_yzs");
					let result = await player.chooseToMove("你主动弃手牌时可移去【虚词】代替")
						.set("list", [
							["弃置的牌", cards],
							["【虚词】", xucis],
						])
						.set("filterMove", function (from, to) {
							return typeof to != "number";
						})
						.forResult();
					if (result.bool) {
						var pushs = result.moved[0],
							gains = result.moved[1];
						pushs.removeArray(cards);
						gains.removeArray(xucis);
						if (!pushs.length || pushs.length != gains.length) return;
						await player.loseToDiscardpile(gains)
						await player.gain(pushs, "gain2");
					}
				},
			},
			phaseEnd: {
				priority: -11,
				trigger: {
					player: "phaseEnd"
				},
				forced: true,
				locked: true,
				async content(event, trigger, player) {
					let cards = player.getExpansions("wenyanxuci_yzs");
					let handcards = player.getCards("h");
					let next = player.addToExpansion(handcards, player, "giveAuto")
					next.gaintag.add("wenyanxuci_yzs")
					next.untrigger(true);
					await next
					if (cards && cards.length) {
						await player.gain(cards, "draw");
						player.removeGaintag("wenyanxuci_yzs", cards);
					}
					await game.delayx();
					if (player.countCards("h") == player.countExpansions("wenyanxuci_yzs")) {
						await player.chooseToDiscard("h", true);
					}
				},
			},
			phaseBefore: {
				priority: -11,
				trigger: {
					player: "phaseBefore"
				},
				forced: true,
				locked: true,
				filter(event, player) {
					let num = player.countExpansions("wenyanxuci_yzs");
					return num >= 0 && num <= 6;
				},
				async content(event, trigger, player) {
					let num = player.countExpansions("wenyanxuci_yzs");
					player.removeSkill("wenyanxuci_yzs_buff0")
					player.removeSkill("wenyanxuci_yzs_buff1")
					player.removeSkill("wenyanxuci_yzs_buff2")
					player.removeSkill("wenyanxuci_yzs_buff3")
					player.removeSkill("wenyanxuci_yzs_buff3_damage")
					player.removeSkill("wenyanxuci_yzs_buff3_recover")
					player.removeSkill("wenyanxuci_yzs_buff4")
					player.removeSkill("wenyanxuci_yzs_buff5")
					player.removeSkill("wenyanxuci_yzs_buff6")
					switch (num) {
						case 0:
							player.addSkill("wenyanxuci_yzs_buff0")
							break;
						case 1:
							player.addSkill("wenyanxuci_yzs_buff1")
							break;
						case 2:
							player.addSkill("wenyanxuci_yzs_buff2")
							player.addTempSkill("wenyanxuci_yzs_mark", { global: ["phaseAfter"] });
							player.setMark("chongshi_yzs", 3, false);
							break;
						case 3:
							player.addSkill("wenyanxuci_yzs_buff3")
							let result = await player.chooseButton([
								`选择一项效果获得`,
								[
									[
										["wenyanxuci_yzs_buff3_recover", "本回合造成伤害时恢复1点体力"],
										["wenyanxuci_yzs_buff3_damage", "本回合造成伤害+1"],
									],
									"textbutton",
								],
							])
								.set("forced", true)
								.set("selectButton", 1)
								.forResult();
							if (!result.bool) return
							player.addTempSkill(result.links[0], { global: ["phaseAfter"] });
							break;
						case 4:
							player.addSkill("wenyanxuci_yzs_buff4")
							break;
						case 5:
							player.addSkill("wenyanxuci_yzs_buff5")
							break;
						case 6:
							player.addSkill("wenyanxuci_yzs_buff6")
							break;
					}
				},
			},
		},
		nobracket: true,
		locked: true,
		forced: true,
		mark: true,
		marktext: "词",
		intro: {
			markcount: "expansion",
			mark(dialog, content, player) {
				const cards = player.getExpansions("wenyanxuci_yzs");
				if (!cards.length) return "无【虚词】";
				if (cards.length) {
					if (player.isUnderControl(true)) {
						dialog.addAuto(cards);
					} else {
						dialog.addText("共有" + get.cnNumber(cards.length) + "张虚词】");
					}
				}
				for (let i = 0; i <= 6; i++) {
					let name = "wenyanxuci_yzs_buff" + i;
					if (player.hasSkill(name)) {
						dialog.addText(lib.translate[name + "_info"]);
					}
				}
				if (player.hasSkill("wenyanxuci_yzs_buff3_damage")) dialog.addText(`你本回合造成伤害+1`);
				if (player.hasSkill("wenyanxuci_yzs_buff3_recover")) dialog.addText(`你本回合造成伤害时恢复1点体力`);
				if (player.hasSkill("wenyanxuci_yzs_buff1_effect")) dialog.addText(`本回合你失去最后的手牌时摸1张牌、你使用【杀】无次数限制且弃牌阶段你改为弃全部手牌`);
			},
		},
		mod: {
			maxHandcardBase: function (player, num) {
				return 6;
			},
		},
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		filter(event, player) {
			return player.countCards("h") > 6;
			return false;
		},
		content() {
			var num = 6 - player.countCards("h");
			if (num < 0) {
				player.chooseToDiscard("h", true, -num);
			}
		},
		ai: {
			nogain: true,
			skillTagFilter(player) {
				if (player.countCards("h") < 6) return false;
			},
		}
	},
	wenyanxuci_yzs_buff0: {
		charlotte: true,
		nopop: true,
		forced: true,
		trigger: {
			player: "phaseBegin"
		},
		filter(event, player) {
			return player.countExpansions("wenyanxuci_yzs") < 6;
		},
		async content(event, trigger, player) {
			let num = 6 - player.countExpansions("wenyanxuci_yzs");
			if (num > 0) {
				let next = player.addToExpansion(get.cards(num), player, "draw")
				next.gaintag.add("wenyanxuci_yzs")
				await next
			}
		}
	},
	wenyanxuci_yzs_buff1: {
		charlotte: true,
		nopop: true,
		trigger: {
			player: "phaseBegin"
		},
		prompt2: `回合开始时你可交换手牌与【虚词】，则本回合你失去最后的手牌时摸1张牌、你使用【杀】无次数限制且弃牌阶段你改为弃全部手牌`,
		async content(event, trigger, player) {
			let cards = player.getExpansions("wenyanxuci_yzs");
			let handcards = player.getCards("h");
			let next = player.addToExpansion(handcards, player, "giveAuto")
			next.gaintag.add("wenyanxuci_yzs")
			next.untrigger(true);
			await next
			if (cards && cards.length) {
				await player.gain(cards, "draw");
				player.removeGaintag("wenyanxuci_yzs", cards);
			}
			await game.delayx();
			player.addTempSkill("wenyanxuci_yzs_buff1_effect")
		}
	},
	wenyanxuci_yzs_buff1_effect: {
		group: ["wenyanxuci_yzs_buff1_effect_lianying"],
		subSkill: {
			lianying: {
				priority: -2,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				popup: false,
				forced: true,
				filter(event, player) {
					if (player.countCards("h")) {
						return false;
					}
					const evt = event.getl(player);
					return evt && evt.player == player && evt.hs && evt.hs.length > 0;
				},
				async content(event, trigger, player) {
					await player.draw();
				},
				ai: {
					threaten: 0.8,
					effect: {
						player_use(card, player, target) {
							if (player.countCards("h") === 1) {
								return [1, 0.8];
							}
						},
						target(card, player, target) {
							if (get.tag(card, "loseCard") && target.countCards("h") === 1) {
								return 0.5;
							}
						},
					},
					noh: true,
					freeSha: true,
					freeShan: true,
					skillTagFilter(player, tag) {
						if (player.countCards("h") !== 1) {
							return false;
						}
					},
				},
			}
		},
		charlotte: true,
		nopop: true,
		popup: false,
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
		},
		forced: true,
		trigger: {
			player: ["phaseDiscardBefore"],
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.modedDiscard(player.getCards("h"))
		},
	},
	wenyanxuci_yzs_buff2: {
		charlotte: true,
		nopop: true,
	},
	wenyanxuci_yzs_buff3: {
		subSkill: {
			damage: {
				trigger: {
					source: "damageBegin1",
				},
				priority: 2,
				forced: true,
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
			},
			recover: {
				trigger: {
					source: "damageBegin1",
				},
				priority: 2,
				forced: true,
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					await player.recover();
				},
			},
		},
		nopop: true,
		audio: `guanshi_skill`,
		charlotte: true,
		trigger: {
			player: ["shaMiss", "eventNeutralized"],
		},
		filter(event, player) {
			if (event.type !== "card" || event.card.name !== "sha" || !event.target.isIn()) {
				return false;
			}
			return player.countCards("h") >= 1;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseToDiscard(`你的【杀】被响应后，你可弃1张【杀】以令之仍生效`, 1, "h", (card, player) => get.name(card, player) == "sha")
				.set("complexCard", true)
				.set("ai", function (card) {
					var evt = _status.event.getTrigger();
					if (get.attitude(evt.player, evt.target) < 0) {
						if (evt.player.needsToDiscard()) {
							return 15 - get.value(card);
						}
						if (evt.baseDamage + evt.extraDamage >= Math.min(2, evt.target.hp)) {
							return 8 - get.value(card);
						}
						return 5 - get.value(card);
					}
					return -1;
				})
				.set("chooseonly", true)
				.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards)
			if (event.triggername === "shaMiss") {
				trigger.untrigger();
				trigger.trigger("shaHit");
				trigger._result.bool = false;
				trigger._result.result = null;
			} else {
				trigger.unneutralize();
			}
		},
		ai: {
			"directHit_ai": true,
			skillTagFilter(player, tag, arg) {
				if (player._guanshi_temp) {
					return;
				}
				player._guanshi_temp = true;
				var bool =
					get.attitude(player, arg.target) < 0 &&
					arg.card &&
					arg.card.name === "sha" &&
					player.countCards("he", function (card) {
						return card !== player.getEquip("guanshi") && card !== arg.card && (!arg.card.cards || !arg.card.cards.includes(card)) && get.value(card) < 5;
					}) > 1;
				delete player._guanshi_temp;
				return bool;
			},
		},
	},
	wenyanxuci_yzs_buff4: {
		group: ["wenyanxuci_yzs_buff4_damage"],
		subSkill: {
			damage: {
				priority: -1,
				trigger: {
					source: ["damageAfter", "damageZero"]
				},
				filter(event, player) {
					let evt = event.getParent(3);
					game.log(evt.name);
					return evt?.name == "wenyanxuci_yzs_buff4" && evt.card?.storage?.wenyanxuci_yzs_buff4
				},
				async content(event, trigger, player) {
					let result = await player.draw().forResult()
					let cards = result.cards;
					result = await player
						.chooseButton(["你可将此牌加入【虚词】或置入弃牌堆", [[["wenyanxuci_yzs", "虚词"], ["discard", "弃置"]], "tdnodes"]])
						.set("filterButton", button => {
							return true;
						})
						.set("ai",button=>Math.random()-0.6)
						.set("forced", false)
						.set("selectButton", 1)
						.forResult();
					if (result.bool && result.links[0]) {
						player.popup("重拾")
						if (result.links[0] == "wenyanxuci_yzs") {
							let next = player.addToExpansion(cards, player, "giveAuto")
							next.gaintag.add("wenyanxuci_yzs")
							await next
						} else {
							await player.loseToDiscardpile(cards)
						}
					}
				}
			}
		},
		nopop: true,
		charlotte: true,
		priority: -2,
		trigger: {
			player: "phaseBegin"
		},
		filter(event, player) {
			return player.countCards("he")
		},
		async cost(event, trigger, player) {
			let cardx = get.autoViewAs({
				name: "sha",
				nature: "fire",
				isCard: true,
				storage: { wenyanxuci_yzs_buff4: true },
			});
			event.result = await player.chooseToDiscard("he", false, [1, Infinity])
				.set("prompt", `回合开始时你可弃任意张牌以视为对至多等量-1名角色使用火【杀】。你因此造成伤害后，摸1张牌并可重拾之`)
				.set("ai", card => {
					const player=get.player()
					let targets = game.filterPlayer(cur => get.attitude(player, cur) < 0 && player.canUse(cardx, cur));
					if (!targets.length) return 0;
					if (ui.selected.cards.length - 1 >= targets.length) return 0;
					return 7 - get.value(card);
				})
				.set("chooseonly", true)
				.forResult();
		},
		async content(event, trigger, player) {
			await player.modedDiscard(event.cards);
			let num = event.cards.length - 1;
			if (num <= 0) return;
			let cardx = get.autoViewAs({
				name: "sha",
				nature: "fire",
				isCard: true,
				storage: { wenyanxuci_yzs_buff4: true },
			});
			await player.chooseUseTarget(cardx, [1, num], true, false)
				.set("filterTarget", (card, player, target) => {
					if (player === target || !player.inRange(target)) {
						return false;
					}
					return lib.filter.targetEnabledx(card, player, target);
				});
		}
	},
	wenyanxuci_yzs_buff5: {
		charlotte: true,
		nopop: true,
		mod: {
			targetEnabled(card, player, target, now) {
				if (card.name == "sha" || card.name == "juedou") {
					return false;
				}
			},
		},
	},
	wenyanxuci_yzs_buff6: {
		nopop: true,
		charlotte: true,
		locked: true,
		forced: true,
		priority: 3,
		trigger: {
			player: "phaseDiscardAfter",
		},
		async content(event, trigger, player) {
			await player.recover();
		},
	},
	chongshi_yzs: {
		locked: true,
		enable: "phaseUse",
		filter(event, player) {
			if (player.countCards("h") + player.countExpansions("wenyanxuci_yzs") < 1) return false;
			return (player.getStat('skill').chongshi_yzs || 0) < player.countMark("chongshi_yzs") + 1;
		},
		chooseButton: {
			dialog(event, player) {
				let dialog = [];
				const method = [
					["handcard", "手牌"],
					["discard", "弃牌"],
					["wenyanxuci_yzs", "虚词"],
				];
				let prompt = `出牌阶段限1次：你将1张手牌或【虚词】：加入【虚词】或置入你手牌区或置入弃牌堆`;
				dialog.push(prompt);
				dialog.push([method, "tdnodes"]);
				if (player.countCards("h")) dialog.push(player.getCards("h"));
				if (player.countExpansions("wenyanxuci_yzs")) dialog.push(player.getExpansions("wenyanxuci_yzs"));
				dialog.push("hidden")
				return ui.create.dialog(...dialog);
			},
			select: 2,
			filter(button, player) {
				if (!ui.selected.buttons || !ui.selected.buttons.length) return true;
				const card = button.link;
				if (ui.selected.buttons.some(i => typeof i.link == "string")) {
					if (typeof card == "string") return false;
				}
				if (ui.selected.buttons.some(i => typeof i.link !== "string")) {
					if (typeof card !== "string") return false;
					let btn = (ui.selected.buttons.filter(i => typeof i.link !== "string"))[0];
					if (btn.link.hasGaintag("wenyanxuci_yzs")) {
						if (card == "wenyanxuci_yzs") return false;
					} else {
						if (card == "handcard") return false;
					}
				}
				return true;
			},
			backup(links, player) {
				let cards = links.filter(i => typeof i !== "string")
				let method = (links.filter(i => typeof i == "string"))[0]
				if (method == "handcard") return {
					name: "重拾",
					selectCard: -1,
					position: "hx",
					cards: cards,
					filterCard: card => lib.skill.chongshi_yzs_backup.cards.includes(card),
					discard: false,
					lose: false,
					delay: false,
					prepare: () => true,
					async content(event, trigger, player) {
						await player.gain(event.cards, "draw");
					}
				}
				if (method == "discard") return {
					name: "重拾",
					selectCard: -1,
					position: "hx",
					cards: cards,
					filterCard: card => lib.skill.chongshi_yzs_backup.cards.includes(card),
					discard: false,
					lose: false,
					delay: false,
					prepare: () => true,
					async content(event, trigger, player) {
						await player.loseToDiscardpile(event.cards)
					}
				}
				if (method == "wenyanxuci_yzs") return {
					name: "重拾",
					selectCard: -1,
					position: "hx",
					cards: cards,
					filterCard: card => lib.skill.chongshi_yzs_backup.cards.includes(card),
					discard: false,
					lose: false,
					delay: false,
					prepare: () => true,
					async content(event, trigger, player) {
						let next = player.addToExpansion(event.cards, player, "giveAuto")
						next.gaintag.add("wenyanxuci_yzs")
						await next
					}
				}
			},
			prompt(links, player) {
				return "出牌阶段限1次：你将1张手牌或【虚词】：加入【虚词】或置入你手牌区或置入弃牌堆"
			},
		},
	},
	//赛丽艾
	wanfa_yzs: {
		group: ["wanfa_yzs_use"],
		audio: "ext:一中杀/audio/skill:4",
		subSkill: {
			use: {
				charlotte: true,
				forced: true,
				popup: false,
				priority: 22,
				trigger: {
					player: "useCardAfter"
				},
				filter(event, player) {
					return event.card?.storage?.wanfa_yzs && event.targets?.length;
				},
				async content(event, trigger, player) {
					for (let target of trigger.targets) {
						if (target.hasSkill("jiejie_yzs")) continue;
						target.addSkill("jiejie_yzs")
						target
							.when({
								player: "damageEnd",
							})
							.filter(evt => evt.card && evt.card.name == "sha")
							.step(async (event, trigger, player) => {
								player.removeSkill("jiejie_yzs")
							});
					}
				}
			},
			backup: {
				audio: "wanfa_yzs",
				"skill_id": "wanfa_yzs_backup",
				sub: true,
				sourceSkill: "wanfa_yzs",
				"_priority": 0,
			},
			used: {
				charlotte: true,
				onremove: true,
				"skill_id": "wanfa_yzs_used",
				sub: true,
				sourceSkill: "wanfa_yzs",
				"_priority": 0,
			},
		},
		enable: "chooseToUse",
		filter(event, player) {
			if (_status.currentPhase != player) return false;
			if (!player.countCards("h")) {
				return false;
			}
			return get
				.inpileVCardList(info => {
					const name = info[2];
					if (get.type(name) != "trick") {
						return false;
					}
					return !player.getStorage("wanfa_yzs_used").includes(name);
				})
				.some(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
		},
		chooseButton: {
			dialog(event, player) {
				const list = get
					.inpileVCardList(info => {
						const name = info[2];
						if (get.type(name) != "trick") {
							return false;
						}
						return !player.getStorage("wanfa_yzs_used").includes(name);
					})
					.filter(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
				return ui.create.dialog("万法", [list, "vcard"]);
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
					audio: "wanfa_yzs",
					/*filterCard(card, player) {
						return !ui.selected.cards.some(i => get.suit(i) === get.suit(card));
					},*/
					filterCard: true,
					//complexCard: true,
					selectCard: 1,
					popname: true,
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
						storage: {
							wanfa_yzs: true,
						},
					},
					ai1(card) {
						return 1 / (get.value(card) || 0.5);
					},
					log: false,
					position: "h",
					async precontent(event, trigger, player) {
						player.logSkill("wanfa_yzs");
						player.addTempSkill("wanfa_yzs_used");
						player.markAuto("wanfa_yzs_used", [event.result.card.name]);
					},
				};
			},
			prompt(links, player) {
				//花色各不相同的
				let prompt = `将1张手牌当作${get.translation(links[0][3] || "")}【${get.translation(links[0][2])}】使用`,
					prompt2 = `结算后目标角色获得${get.poptip("jiejie_yzs")}直至其下次受到【杀】造成的伤害后`;
				return `###${prompt}<br>###${prompt2}`;
			},
		},
		onChooseToUse(event) {
			event.targetprompt2.add(target => {
				if (event.skill !== "wanfa_yzs_backup" || !target.classList.contains("selectable")) {
					return;
				}
				if (target.hasSkill("jiejie_yzs")) return "结界";
			});
		},
		hiddenCard(player, name) {
			if (_status.currentPhase != player) return false;
			if (!player.countCards("h")) {
				return false;
			}
			if (get.type(name) != "trick") {
				return false;
			}
			if (player.getStorage("wanfa_yzs_used").includes(name)) {
				return false;
			}
			return lib.inpile.includes(name);
		},
		ai: {
			order: 4,
			result: {
				player(player) {
					return 1
				},
			},
			threaten: 1.9,
		},
	},
	kanpo_yzs: {
		locked: true,
		priority: -3,
		//	audio: "wanfa_yzs",
		trigger: {
			player: ["useCardAfter"],
		},
		logTarget(event, player) {
			return event.targets.filter(target => target.hasSkill("jiejie_yzs"))
		},
		filter(event, player, name) {
			return event.card.isCard && event.targets?.some(target => target.hasSkill("jiejie_yzs"))
		},
		forced: true,
		popup: true,
		async content(event, trigger, player) {
			const targets = trigger.targets.filter(target => target.hasSkill("jiejie_yzs"));
			player.line(targets);
			for (const target of targets) {
				target.removeSkill("jiejie_yzs")
				//await player.discardPlayerCard(target, 'he')
			}
		},
	},
	jiejie_yzs: {
		group: ["jiejie_yzs_lose"],
		subSkill: {
			lose: {
				priority: 2,
				prompt2: `【结界】：其他角色的锦囊牌对你无效。<br>结束阶段，你可失去本技能，然后摸2张牌`,
				trigger: {
					player: "phaseJieshuBegin"
				},
				check(event, player) {
					return player.isHealthy() || player.countCards("h") < 3;
				},
				async content(event, trigger, player) {
					player.removeSkill("jiejie_yzs")
					await player.draw(2)
				}
			}
		},
		direct: true,
		priority: -2,
		popup: true,
		trigger: {
			target: "useCardToBefore",
		},
		filter(event, player) {
			if (event.player == player) return false;
			if (event.player?.hasSkill("kanpo_yzs") && event.card.isCard) return false;
			return get.type(event.card?.name) == "trick"
		},
		content: function () {
			trigger.cancel();
		},
		ai: {
			notrick: true,
		}
	},
	//马哈特
	dianjin_yzs: {
		Effect: function (targetPlayer) {
			// 1. 创建特效总容器
			const effectContainer = document.createElement('div');
			effectContainer.className = 'gold-avatar-effect-container';

			// 设置容器样式，使其覆盖在玩家图片上方
			Object.assign(effectContainer.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '1000',
				pointerEvents: 'none', // 不阻挡鼠标事件
			});

			targetPlayer.appendChild(effectContainer);

			// 2. 创建黄金遮罩层
			const goldOverlay = document.createElement('div');
			goldOverlay.className = 'gold-avatar-overlay';

			// 初始样式：全透明
			Object.assign(goldOverlay.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				backgroundColor: 'rgba(255, 215, 0, 0)', // 初始为透明
				borderRadius: 'inherit', // 继承头像的圆角
			});

			effectContainer.appendChild(goldOverlay);

			// 3. 开始动画

			const durationParams = {
				total: 2000 // 动画总时长
			};

			// A. 黄金遮罩层动画：透明度逐渐增加（不透明度从0到0.5）
			goldOverlay.animate([
				{ backgroundColor: 'rgba(255, 215, 0, 0)' },
				{ backgroundColor: 'rgba(255, 215, 0, 0.5)' }
			], {
				duration: durationParams.total,
				easing: 'ease-in-out', // 平滑过渡
				fill: 'forwards' // 动画结束后保持最终状态
			});

			// B. 玩家头像色彩对比度动画
			targetPlayer.animate([
				{ filter: 'contrast(1)' },
				{ filter: 'contrast(1.5)' } // 增加对比度以体现金属质感
			], {
				duration: durationParams.total,
				easing: 'ease-in-out', // 平滑过渡
				fill: 'forwards' // 动画结束后保持最终状态
			});

			// 4. 动画结束后移除 DOM 元素（不再移除，因为要保持黄金效果）
			// setTimeout(() => {
			//   if (effectContainer.parentNode) {
			//     effectContainer.parentNode.removeChild(effectContainer);
			//   }
			// }, durationParams.total);
		},
		Remove: function (targetPlayer) {
			// 1. 查找之前创建的特效容器
			const effectContainer = targetPlayer.querySelector('.gold-avatar-effect-container');
			const goldOverlay = effectContainer ? effectContainer.querySelector('.gold-avatar-overlay') : null;

			if (!effectContainer) return; // 如果找不到特效容器，直接跳过

			const durationParams = {
				total: 1500 // 移除动画可以稍微快一点，提升交互手感
			};

			// 2. 执行反向动画

			// A. 黄金遮罩层动画：透明度回退到 0
			if (goldOverlay) {
				goldOverlay.animate([
					{ backgroundColor: 'rgba(255, 215, 0, 0.5)' },
					{ backgroundColor: 'rgba(255, 215, 0, 0)' }
				], {
					duration: durationParams.total,
					easing: 'ease-in-out',
					fill: 'forwards'
				});
			}

			// B. 玩家头像对比度回退到 1
			const playerAnimation = targetPlayer.animate([
				{ filter: 'contrast(1.5)' },
				{ filter: 'contrast(1)' }
			], {
				duration: durationParams.total,
				easing: 'ease-in-out',
				fill: 'forwards'
			});

			// 3. 核心步骤：动画完成后彻底清理 DOM
			// 使用 onfinish 事件监听动画结束
			playerAnimation.onfinish = () => {
				if (effectContainer.parentNode) {
					effectContainer.parentNode.removeChild(effectContainer);
				}
				// 清除头像上的动画产生的 inline style，恢复最原始状态
				targetPlayer.style.filter = '';
			};
		},
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.hasPlayer(function (target) {
				return lib.skill.dianjin_yzs.filterTarget(null, player, target)
			})
		},
		filterTarget(card, player, target) {
			return !target.hasSkillTag("hidden_yzs", null, player) && !target.hasSkill("dianjin_yzs_buff")
		},
		async content(event, trigger, player) {
			game.log(event.target, "被黄金化了")
			event.target.playEffectOL(lib.skill.dianjin_yzs.Effect);
			event.target.addSkill("dianjin_yzs_buff")
			event.target.setMark("dianjin_yzs_buff", 2, false);
		},
		ai: {
			order: 10,
			result: {
				target(player, target) {
					if (_status.currentPhase == target) return 8;
					return -2
				}
			}
		}
	},
	dianjin_yzs_buff: {
		group: ["dianjin_yzs_buff_lose"],
		subSkill: {
			lose: {
				forced: true,
				popup: false,
				priority: 12,
				trigger: {
					player: ["useCard", "dyingAfter"]
				},
				filter(event, player) {
					return true;
				},
				async content(event, trigger, player) {
					if (trigger.name == "dying") {
						player.clearMark("dianjin_yzs_buff", false)
					} else {
						player.removeMark("dianjin_yzs_buff", 1, false)
					}
					if (!player.countMark("dianjin_yzs_buff")) {
						game.log(player, "解除了黄金化")
						player.playEffectOL(lib.skill.dianjin_yzs.Remove);
						player.removeSkill("dianjin_yzs_buff")
						await event.trigger("Deeagorze_yzs")
					}
				},
			},
		},
		marktext: `金`,
		intro: {
			content: `“黄金化”：所有手牌视为【无中生有】。<br>脱离濒死后或再使用#张牌时退出“黄金化”`,
		},
		mod: {
			cardname(card, player, name) {
				if (player.countMark("dianjin_yzs_buff"))return "wuzhong"
			},
		},
		nopop: true,
		charlotte: true,
	},
	Deeagorze_yzs: {
		group: ["Deeagorze_yzs_dianjin"],
		subSkill: {
			backup: {
				audio: "Deeagorze_yzs",
				"skill_id": "Deeagorze_yzs_backup",
				sub: true,
				sourceSkill: "Deeagorze_yzs",
				"_priority": 0,
			},
			used: {
				charlotte: true,
				onremove: true,
				"skill_id": "Deeagorze_yzs_used",
				sub: true,
				sourceSkill: "Deeagorze_yzs",
				"_priority": 0,
			},
			dianjin: {
				popup: false,
				trigger: {
					global: "Deeagorze_yzs",
				},
				filter(event, player) {
					return game.hasPlayer(function (target) {
						return !player.hasSkillTag("hidden_yzs", null, target)
					})
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseTarget(`【纵金】：你可对 ${get.translation(trigger.player)} 外的1名角色发动<font color="#f9be4d">${get.poptip("dianjin_yzs")}</font>`, `锁定技：场上角色脱离<font color="#f9be4d">“黄金化”</font>后，你可对其以外的1名角色发动<font color="#f9be4d">${get.poptip("dianjin_yzs")}</font>`)
						.set("targetx", trigger.player)
						.set("filterTarget", (card, player, target) => {
							return !player.hasSkillTag("hidden_yzs", null, target) && !target.hasSkill("dianjin_yzs_buff") && target != get.event().targetx;
						})
						.set("ai", target => {
							const player = get.player();
							if (target == _status.currentPhase) return get.attitude(player, target)
							return -get.attitude(player, target)
						})
						.forResult()
				},
				async content(event, trigger, player) {
					let next = player.useSkill("dianjin_yzs")
					next.targets = event.targets;
					next.addCount = false;
					await next;
				},
			},
		},
		mod: {
			playerEnabled(card, player, target) {
				if (card?.storage?.Deeagorze_yzs) {
					return target.hasSkill("dianjin_yzs_buff")
				}
			},
		},
		locked: true,
		enable: "chooseToUse",
		filter(event, player) {
			if (!player.countCards("h", { name: "wuzhong" })) {
				return false;
			}
			return get
				.inpileVCardList(info => {
					const name = info[2];
					if (get.type(name) != "trick" && get.type(name) != "basic") {
						return false;
					}
					if (lib.card[name]?.notarget) return false;
					return !player.getStorage("Deeagorze_yzs_used").includes(name);
				})
				.some(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
		},
		chooseButton: {
			dialog(event, player) {
				const list = get
					.inpileVCardList(info => {
						const name = info[2];
						if (get.type(name) != "trick" && get.type(name) != "basic") {
							return false;
						}
						if (lib.card[name]?.notarget) return false;
						return !player.getStorage("Deeagorze_yzs_used").includes(name);
					})
					.filter(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
				return ui.create.dialog("纵金", [list, "vcard"]);
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
					audio: "Deeagorze_yzs",
					/*filterCard(card, player) {
						return !ui.selected.cards.some(i => get.suit(i) === get.suit(card));
					},*/
					filterCard: true,
					//complexCard: true,
					selectCard: 1,
					popname: true,
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
						storage: {
							Deeagorze_yzs: true,
						},
					},
					ai1(card) {
						return 1 / (get.value(card) || 0.5);
					},
					log: false,
					position: "h",
					async precontent(event, trigger, player) {
						player.logSkill("Deeagorze_yzs");
						player.addTempSkill("Deeagorze_yzs_used");
						player.markAuto("Deeagorze_yzs_used", [event.result.card.name]);
					},
				};
			},
			prompt(links, player) {
				let prompt = `将1张手牌当作${get.translation(links[0][3] || "")}【${get.translation(links[0][2])}】对“黄金化”的角色使用`
				return `###${prompt}###`;
			},
		},
		hiddenCard(player, name) {
			if (!player.countCards("h", { name: "wuzhong" })) {
				return false;
			}
			if (get.type(name) != "trick" && get.type(name) != "basic") {
				return false;
			}
			if (lib.card[name]?.notarget) return false;
			if (player.getStorage("Deeagorze_yzs_used").includes(name)) {
				return false;
			}
			return lib.inpile.includes(name);
		},
	},
	//雷辰静
	chaodaoti_yzs: {
		Effect: function (targetPlayer) {
			const svgNS = "http://www.w3.org/2000/svg";
			const svg = document.createElementNS(svgNS, "svg");
			svg.setAttribute("class", "lightning-container-v2");

			// 容器样式：增加 drop-shadow 营造整体环境光影
			Object.assign(svg.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '1000',
				pointerEvents: 'none',
				overflow: 'visible',
				// 静态滤镜：多重投影叠加，形成厚实的光晕
				filter: 'drop-shadow(0 0 12px rgba(0, 162, 255, 0.8)) drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))'
			});

			const createBoldBolt = (d, isLeft) => {
				const group = document.createElementNS(svgNS, "g");

				// 外层粗干：半透明蓝色，增加厚度
				const outer = document.createElementNS(svgNS, "path");
				outer.setAttribute("d", d);
				outer.setAttribute("stroke", "#0095FF");
				outer.setAttribute("stroke-width", "6"); // 增加粗细
				outer.setAttribute("fill", "none");
				outer.setAttribute("stroke-linecap", "round");
				outer.setAttribute("stroke-linejoin", "round");
				outer.style.opacity = "0.6";

				// 内层核心：纯白，模拟电流中心
				const inner = document.createElementNS(svgNS, "path");
				inner.setAttribute("d", d);
				inner.setAttribute("stroke", "#FFFFFF");
				inner.setAttribute("stroke-width", "2");
				inner.setAttribute("fill", "none");
				inner.setAttribute("stroke-linecap", "round");
				inner.setAttribute("stroke-linejoin", "round");

				group.appendChild(outer);
				group.appendChild(inner);

				// 初始动画状态
				group.style.strokeDasharray = "300";
				group.style.strokeDashoffset = "300";
				return group;
			};

			// 路径：增加了更剧烈的折线感，并在 50,50 处进行交叉缠绕
			const leftPath = "M -5 50 L 20 40 L 35 60 L 48 48 Q 55 40 50 50";
			const rightPath = "M 105 50 L 80 60 L 65 40 L 52 52 Q 45 60 50 50";

			const leftBolt = createBoldBolt(leftPath, true);
			const rightBolt = createBoldBolt(rightPath, false);

			svg.setAttribute("viewBox", "0 0 100 100");
			svg.setAttribute("preserveAspectRatio", "none");
			svg.appendChild(leftBolt);
			svg.appendChild(rightBolt);
			targetPlayer.appendChild(svg);

			// 动画：两道粗壮闪电向中间汇合
			const animConfig = {
				duration: 1000,
				easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
				fill: 'forwards'
			};

			leftBolt.animate([{ strokeDashoffset: '300' }, { strokeDashoffset: '0' }], animConfig);
			rightBolt.animate([{ strokeDashoffset: '300' }, { strokeDashoffset: '0' }], animConfig);
		},
		Remove: function (targetPlayer) {
			const svg = targetPlayer.querySelector('.lightning-container-v2');
			if (!svg) return;

			const duration = 800;

			// 1. 让闪电路径向相反方向抽离
			const bolts = svg.querySelectorAll('g');
			bolts.forEach(bolt => {
				bolt.animate([
					{ strokeDashoffset: '0', opacity: 1 },
					{ strokeDashoffset: '300', opacity: 0 }
				], {
					duration: duration,
					easing: 'ease-in'
				});
			});

			// 2. 静态光晕整体淡出并伴随轻微扩大（模拟能量扩散）
			const fadeOut = svg.animate([
				{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
				{ opacity: 0, transform: 'scale(1.2)', filter: 'blur(10px)' }
			], {
				duration: duration,
				easing: 'ease-out',
				fill: 'forwards'
			});

			fadeOut.onfinish = () => {
				if (svg.parentNode) {
					svg.parentNode.removeChild(svg);
				}
			};
		},
		group: ["chaodaoti_yzs_effect", "chaodaoti_yzs_changeHp", "chaodaoti_yzs_link"],
		subSkill: {
			link: {
				charlotte: true,
				priority: 12,
				forced: true,
				popup: false,
				forceDie: true,
				silent: true,
				trigger: {
					player: "linkBegin"
				},
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					trigger.cancel()
				}
			},
			changeHp: {
				audio: "chaodaoti_yzs",
				priority: -44,
				forced:true,
				trigger: {
					player:"changeHpBegin"
				},
				filter(event, player) {
					if (event.num >= 0) return false;
					var evt = event.getParent();
					return evt && evt.name == "damage" && evt.hasNature("thunder");
				},
				async content(event, trigger, player) {
					let num = -trigger.num;
					trigger.cancel();
					if(num>0)await player.recover(num);
					let x = game.countPlayer(target => target.hasSkill("chaodaoti_yzs_effect"));
					if (x > 0) await player.draw(x);
				},
			},
		},
		mod: {
			cardnature(card, player) {
				if (get.name(card,player) == "sha") return "thunder";
			},
		},
		prompt: `出牌阶段，你可弃1张♠牌并横置1名其他角色，视为处于“${get.poptip("chaodaoti_yzs_effect")}”`,
		locked: true,
		nobracket: true,
		audio: "ext:一中杀/audio/skill:4",
		position:"h",
		enable: "phaseUse",
		filterCard: {suit:"spade"},
		selectCard: 1,
		filter(event, player) {
			if (!player.countCards("h", { suit: "spade" })) return false;
			return game.hasPlayer(function (target) {
				return lib.skill.chaodaoti_yzs.filterTarget(null, player, target)
			})
		},
		filterTarget(card, player, target) {
			return !target.hasSkillTag("hidden_yzs", null, player) && !target.hasSkill("chaodaoti_yzs_effect") && player != target;
		},
		async content(event, trigger, player) {
			if (event.target.isLinked()) await event.target.link(false)
			if (!event.target.isLinked()) {
				game.broadcastAll(function (damageAudioInfo) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo);
					}
				}, "effect/damage_thunder.MP3");
				event.target.playEffectOL(lib.skill.chaodaoti_yzs.Effect);
				game.log(event.target, `进入“超导”`);
				event.target.addSkill("chaodaoti_yzs_effect")
			}
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (card.name == "tiesuo") {
						return 0.1;
					}
					if (get.tag(card, "thunderDamage")) {
						return "zeroplayertarget";
					}
				},
			},
			threaten: 0.5,
			nothunder: true,
			result: {
				target(player, target) {
					return get.effect(target, { name: "tiesuo" }, player, target);
				}
			}
		},

	},
	chaodaoti_yzs_effect: {
		group: ["chaodaoti_yzs_effect_lose"],
		subSkill: {
			lose: {
				charlotte:true,
				priority: 11,
				forced: true,
				popup: false,
				forceDie: true,
				silent: true,
				trigger: {
					player:"linkBegin"
				},
				filter(event, player) {
					return true
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (damageAudioInfo) {
						if (lib.config.background_audio) {
							game.playAudio(damageAudioInfo);
						}
					}, "effect/damage_thunder.MP3");
					player.playEffectOL(lib.skill.chaodaoti_yzs.Remove);
					game.log(player, `退出“超导”`);
					player.removeSkill("chaodaoti_yzs_effect")
				}
			}
		},
		notLink(event) {
			return event.getParent().name != "_chaodaoti_yzs_effect" && event.getParent().name != "_chaodaoti_yzs_effect2";
		},
		trigger: { player: "changeHp" },
		priority: -11,
		charlotte:true,
		forced: true,
		popup: false,
		forceDie: true,
		silent: true,
		filter: function (event, player) {
			var evt = event.getParent();
			return evt && evt.name == "damage" && evt.hasNature("thunder");
		},
		async content(event, trigger, player) {
			if (lib.skill.chaodaoti_yzs_effect.notLink(trigger.getParent())) {
				trigger.getParent().chaodao_yzs_able = true;
			}
		}
	},
	_chaodaoti_yzs_effect: {
		trigger: { player: "damageAfter" },
		filter: function (event, player) {
			return event.chaodao_yzs_able == true;
		},
		forced: true,
		popup: false,
		logv: false,
		forceDie: true,
		silent: true,
		forceOut: true,
		priority:-5,
		content: [
			async (event, trigger, player) => {
				event.logvid = trigger.getLogv();
			},
			async (event, trigger, player) => {
				event.targets = game.filterPlayer(function (current) {
					return current != event.player && current.hasSkill("chaodaoti_yzs_effect")
				});
				lib.tempSortSeat = _status.currentPhase || player;
				event.targets.sort(lib.sort.seat);
				delete lib.tempSortSeat;
				event._args = [trigger.num, trigger.nature, trigger.cards, trigger.card];
				if (trigger.source) {
					event._args.push(trigger.source);
				} else {
					event._args.push("nosource");
				}
			},
			async (event, trigger, player) => {
				if (event.targets.length) {
					var target = event.targets.shift();
					if (target.hasSkill("chaodaoti_yzs_effect")) {
						target.damage.apply(target, event._args.slice(0));
					}
					event.redo();
				}
			}
		]
	},
	jingdianmabi_yzs: {
		subSkill: {
			effect: {
				marktext:"电",
				trigger: {
					player: "damageEnd",
				},
				priority:-1,
				forced: true,
				popup: false,
				charlotte: true,
				sourceSkill: "jingdianmabi_yzs",
				filter(event, player) {
					return player.getExpansions("jingdianmabi_yzs_effect").length > 0 && !event.hasNature("thunder");
				},
				async content(event,trigger,player) {
					var cards = player.getExpansions("jingdianmabi_yzs_effect");
					await player.gain(cards, "draw");
					game.log(player, "收回了" + get.cnNumber(cards.length) + "张“静电麻痹”牌");
					player.removeSkill("jingdianmabi_yzs_effect");
				},
				intro: {
					markcount: "expansion",
					mark(dialog, storage, player) {
						var cards = player.getExpansions("jingdianmabi_yzs_effect");
						if (player.isUnderControl(true)) {
							dialog.addAuto(cards);
						} else {
							return "共有" + get.cnNumber(cards.length) + "张牌";
						}
					},
				},
			},
		},
		nobracket: true,
		audio: "chaodaoti_yzs",
		trigger: {
			player: "useCardToPlayered",
		},
		priority:-2,
		filter(event, player) {
			return event.card.name == "sha" && get.natureList(event.card).some(i => {
				return i === "thunder" 
			}) && event.target.countCards("h") > 0&&player.countCards("h")>0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard("h", [1, Infinity], { color: "black" }, `你可展示任意张黑色手牌然后扣置 ${get.translation(trigger.target)} 等量张手牌`)
				.set("ai", card => 1)
				.forResult()
		},
		async content(event, trigger, player) {
			let num = event.cards.length;
			await player.showCards(event.cards, `【静电麻痹】展示牌`)
			let result = await player.choosePlayerCard(trigger.target, "h", [1, Math.min(num, trigger.target.countCards("h"))], get.prompt("jingdianmabi_yzs", trigger.target), "allowChooseAll")
				.set("ai", function (button) {
					if (!_status.event.goon) {
						return 0;
					}
					var val = get.value(button.link);
					if (button.link == _status.event.target.getEquip(2)) {
						return 2 * (val + 3);
					}
					return val;
				})
				.set("goon", get.attitude(player, trigger.target) <= 0)
				.set("forceAuto", true)
				.forResult();
			if (result.bool) {
				game.broadcastAll(function (damageAudioInfo) {
					if (lib.config.background_audio) {
						game.playAudio(damageAudioInfo);
					}
				}, "effect/damage_thunder.MP3");
				trigger.target.addSkill("jingdianmabi_yzs_effect");
				let next = trigger.target.addToExpansion(result.cards, "giveAuto", player);
				next.gaintag.add("jingdianmabi_yzs_effect")
				await next;
			} 
		},
	},
}
export default skills;
