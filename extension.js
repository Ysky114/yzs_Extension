
import { lib, game, ui, get, ai, _status } from "../../noname.js";
import characters from "./character.js";
import { characterSubstitutes, characterTitles, characterIntros, characterReplaces, characterSort } from "./character.js";
import skills from "./skill.js";
import skills1 from "./skill1.js";
import skills2 from "./skill2.js";
import skills3 from "./skill3.js";
import skills4 from "./skill4.js";
import skills5 from "./skill5.js";
import translates from "./translate.js";
import dynamicTranslates from "./dynamicTranslate.js";
import update from "./update.js";
/** @type { importExtensionConfig } */
game.import("extension", function (lib, game, ui, get, ai, _status) {
	return {
		name: "一中杀",
		arenaReady() { },
		precontent: function () {
			let version = "1.11.3"
			const cur = lib.version.split('.').map(Number);
			const req = version.split('.').map(Number);
			for (let i = 0; i < Math.max(cur.length, req.length); i++) {
				const c = cur[i] || 0;
				const r = req[i] || 0;
				if (c < r) alert(`当前无名杀版本为：${lib.version}\n\n可能导致本扩展出现BUG！\n\n建议更新无名杀资源包至新版！`)
			}
			// 新增势力

			// 背景音乐
			let list = ["My Sunset", "泡沫、哀のまほろば", "Time Bomb", "inhuman", "Lupinus", "Pigstep (Stereo Mix)",
				"Puppet in the Dark(PartⅡBuried Away)", "RYUKYUVANIA V2", "Vagrant", "メグルユメ", "東方緋想天 (Arrange Version) _ あきやまうに",
				"果てなき風の軌跡さえ", "輝く針の小人族　～ Little Princess", "神々が恋した幻想郷", "月に叢雲華に風"]
			for (let name of list) {
				if (!lib.config.customBackgroundMusic) lib.config.customBackgroundMusic = {};
				if (lib.config.extension_一中杀_yzs_bgm) lib.config.customBackgroundMusic[`ext:一中杀/audio/${name}.mp3`] = name
				else delete lib.config.customBackgroundMusic[`ext:一中杀/audio/${name}.mp3`]
			}
			game.saveConfig("customBackgroundMusic", lib.config.customBackgroundMusic)
			//冰【杀】
			if (game.addNature) {
				game.addNature("yzsIce", "冰", {
					audio: "ext:一中杀/audio/card/sha_ice",
					linked: true,
					order: 63,
					background: "extension/一中杀/image/card/icesha_yzs.png",
					lineColor: "#a6ecf7",
					color: "blue",
				});
			}
			//顶部字幕播报(抄自扩展《错乱时空》)
			if (lib.config.extension_一中杀_yzs_title) {
				let delay = 10000;
				if (lib.config.extension_错乱时空_cl_tuobao) {
					delay+=20000
				}
				var gtbbUI = {};
				function yzsTitles(randomNames) {
					var playerLabel = "玩家";
					var nickname = lib.config.connect_nickname;
					//字幕内容
					var randomNames = [
						`点按武将头像框下的按钮可以发动瞬发技，快去试试吧！`,
						`鹤元海可以反弹杀，打他时请确保你手里有闪！`,
						`翔子有两个版本-审判翔和纯真翔，后者可以觉醒进化！`,
						`千面李暮拥有高贵的开局无敌和随机技能，强而有力。`,
						`六魂花和宿傩是挑战boss，联机时最好事先约定好再掏。`,
						"《一中杀》会时不时举办扩展联机，想玩的可以加群1015772605联系作者",
						`《一中杀》中的部分武将存在羁绊彩蛋，比如辛美尔和芙莉莲。`,
						`武器大师-车杳只需要发动武器技能就可以刷新大招，理论上限一回合十刀！`,
						`希儿削废了。没有了。`,
						`《一中杀》是支持联机游玩的扩展，你甚至可以操作召唤物和自己武将的复制体！`,
						`《一中杀》中有很多恶搞向武将，此类武将的卡图仅作参考。`,
						"三国杀是个很残酷的游戏，通常需要很多个玩家才能开始，但是只有一个玩家能玩。",
						"如果你在生活中遇到了什么糟糕的事，想都不用想，肯定是三国杀干的",
						"当你觉得一个武将是大作文时，你可以先不看他的技能，多挨打几次就知道了。",
						"小提示：小提示可以在扩展设置里被关闭。",
						`大佐·鲁日立的“必定生效”效果不只是强中那么简单。`,
						`莉可如果牌序不当，将会非常容易暴毙。`,
						`选择雷古就能开局直接睡觉，把压力留给队友。`,
						`被洋葱怪人寄生的武将死后将会原地爆出一个全新的洋葱怪人。`,
						`鬼香玩家只需要一直放闪电就好了，其他的交给天意。`,
						`纵使身死，辛美尔也可以庇护队友。`,
						`稗田阿求只要队友存活就可以无限复活。`,
						`次元魔女许如荧可以瞬发开大，拉取两人单挑，机制T0，数值你别问。`,
						`爱诺琪丝拥有全扩最多的无咏唱技能。那么代价是什么呢？`,
						`幽幽子的血条非常特殊：她的血量越高，处境越危险。`,
						`你知道吗？菜月昴可以投降自杀触发死亡回归。`,
						`变大！针妙丸的宝槌真的可以让人变大！`,
						`“听，是动物朋友的声音”——璐璐杨·哈洛`,
						`如果你喜欢爽开【无中生有】，那你可以试试马哈特。`,
						`蕾赛一血进回合了，又有人要遭殃了。`,
						`网友手操五条悟 VS 网友手操宿傩？胜负由你决定！`,
					];
					var suiji = randomNames.randomGet();
					var name = [suiji, nickname].randomGet();
					/*定义部分属性--手杀同款*/
					var fontset = "FZLBJW"; /*字体*/
					var colorA = "#efe8dc"; /*颜色a*/
					var colorB = "#22c622"; /*颜色b*/
					gtbbUI.div.show();
					setTimeout(function () {
						gtbbUI.div.hide();
					}, 20000);
					gtbbUI.div2.innerHTML = '<marquee direction="left" behavior="scroll" scrollamount="9.8" loop="1" width="100%" height="50" align="absmiddle">' + '<font face="' + fontset + '"color="' + colorA + '"><b>' + suiji + '</b></font></marquee>';
				}
				gtbbUI.div = ui.create.div("");
				gtbbUI.div2 = ui.create.div("", gtbbUI.div);
				/*----------手杀托报样式-------*/
				gtbbUI.div.style.cssText = "pointer-events:none;width:100%;height:25px;font-size:23px;z-index:6;";
				gtbbUI.div2.style.cssText = "pointer-events:none;background:rgba(0,0,0,0.5);width:100%;height:27px;";
				/*------------------------*/
				var id = setInterval(function () {
					if (!gtbbUI.div.parentNode && ui.window) {
						ui.window.appendChild(gtbbUI.div);
						clearInterval(id);
						yzsTitles();
						setInterval(yzsTitles, parseFloat(40000));
					}
				}, delay);
			};
			//装备技能修改
			if (lib.config.extension_一中杀_yzs_Exequip) {
				if (!_status.postReconnect.yzs_Exequip) {
					_status.postReconnect.yzs_Exequip = [
						function () {
							lib.skill.hanbing_skill = {
								equipSkill: true,
								trigger: {
									source: "damageBegin2",
								},
								audio: true,
								filter(event) {
									return event.card && event.card.name === "sha" && event.notLink() && event.player.getCards("he").length > 0;
								},
								prompt2(event, player) {
									return `你可以防止此伤害(${Math.max(event.num, 0)}点)，然后依次弃置目标角色的${Math.max(event.num + 1, 1)}张牌。`
								},
								check(event, player) {
									var target = event.player;
									var eff = get.damageEffect(target, player, player, event.nature);
									if (get.attitude(player, target) > 0) {
										if (
											eff >= 0 ||
											(event.nature &&
												target.isLinked() &&
												game.hasPlayer(cur => {
													return cur !== target && cur.isLinked() && get.damageEffect(cur, player, player, event.nature) > 0;
												}))
										) {
											return false;
										}
										return true;
									}
									if (eff <= 0) {
										return true;
									}
									if (target.hp === 1 || player.hasSkill("tianxianjiu")) {
										return false;
									}
									if (
										!target.hasSkillTag("filterDamage", null, {
											player: player,
											card: event.card,
											jiu: player.hasSkill("jiu"),
										})
									) {
										if (
											event.num > 1 ||
											player.hasSkillTag("damageBonus", true, {
												player: player,
												card: event.card,
											})
										) {
											return false;
										}
									}
									if (target.countCards("he") < 2) {
										return false;
									}
									var num = 0;
									var cards = target.getCards("he");
									for (var i = 0; i < cards.length; i++) {
										if (get.value(cards[i]) > 6) {
											num++;
										}
									}
									if (num >= 2) {
										return true;
									}
									return false;
								},
								logTarget: "player",
								async content(event, trigger, player) {
									trigger.cancel();
									let num = Math.max(trigger.num + 1, 1)
									while (num > 0 && trigger.player.countDiscardableCards(player, "he")) {
										player.line(trigger.player);
										await player.discardPlayerCard("he", trigger.player, true);
										num--
									}
								},
								"skill_id": "hanbing_skill",
								"_priority": -25,
							};
							lib.translate.hanbing_info = "当你因执行【杀】的效果而造成伤害时，若目标角色有能被弃置的牌，则你可以防止此伤害，然后依次弃置目标角色的X+1张牌。(X为伤害值且至少为0)";
							lib.translate.hanbing_skill_info = "当你因执行【杀】的效果而造成伤害时，若目标角色有能被弃置的牌，则你可以防止此伤害，然后依次弃置目标角色的X+1张牌。(X为伤害值且至少为0)";
							lib.skill.cixiong_skill = {
								equipSkill: true,
								trigger: {
									player: "useCardToPlayered",
								},
								audio: true,
								logTarget: "target",
								check(event, player) {
									if (get.attitude(player, event.target) > 0) {
										return true;
									}
									var target = event.target;
									return target.countCards("h") === 0 || !target.hasSkillTag("noh");
								},
								filter(event, player) {
									if (event.card.name !== "sha") {
										return false;
									}
									if (!player.countDiscardableCards("h", player)) return false;
									return true
								},
								async cost(event, trigger, player) {
									event.result = await player.chooseToDiscard(player, "h", false)
										.set("filterCard", (card, player) => {
											return true
										})
										.set("selectCard", 1)
										.set("prompt", `是否对 ${get.translation(trigger.target)} 发动【雌雄双股剑】？`)
										.set("prompt2", `当你使用【杀】指定目标角色后，你可以弃置一张手牌，令其选择一项：1.弃置一张手牌；2.令你摸一张牌`)
										.set("chooseonly", true)
										.forResult();
								},
								async content(event, trigger, player) {
									await player.modedDiscard(event.cards);
									if (!trigger.target.countCards("h")) {
										event.result = { bool: false };
									} else {
										event.result = await trigger.target
											.chooseToDiscard("弃置一张手牌，或令" + get.translation(player) + "摸一张牌")
											.set("ai", function (card) {
												const bool = get.event().bool;
												if (!bool) {
													return 0;
												}
												if (get.name(card) === "shan") {
													return bool - get.event().shan * get.value(card);
												}
												return bool - get.value(card);
											})
											.set(
												"bool",
												(function () {
													const hs = trigger.target.countCards("h"),
														att = get.attitude(trigger.target, trigger.player);
													if (!hs || att > 0) {
														return false;
													}
													if (trigger.target.hasSkillTag("noh")) {
														return 8;
													}
													if (get.effect(trigger.target, trigger.card, player, trigger.target) >= 0) {
														return 6;
													}
													return -att - Math.max(0, 4 - trigger.target.hp) * 2;
												})()
											)
											.set(
												"shan",
												(function () {
													if (
														player.hasSkillTag("directHit_ai", true, {
															target: trigger.target,
															card: trigger.card,
														})
													) {
														return 0;
													}
													const shans = trigger.target.mayHaveShan(trigger.target, "use", true, "count");
													if (shans === 0 || shans > 2) {
														return 1;
													}
													if (shans === 1) {
														return 3.6 / Math.min(3.6, trigger.target.getHp());
													}
													return 1.8 / Math.min(1.8, trigger.target.getHp());
												})()
											)
											.forResult();
									}
									if (event.result.bool === false) {
										await player.draw();
									}
								},
								"skill_id": "cixiong_skill",
								"_priority": -25,
							};
							lib.translate.cixiong_skill_info = "当你使用【杀】指定目标角色后，你可以弃置一张手牌，令其选择一项：1.弃置一张手牌；2.令你摸一张牌。";
							lib.translate.cixiong_info = "当你使用【杀】指定目标角色后，你可以弃置一张手牌，令其选择一项：1.弃置一张手牌；2.令你摸一张牌。";
						},
						[],
					];
				}
				lib.skill.hanbing_skill = {
					equipSkill: true,
					trigger: {
						source: "damageBegin2",
					},
					audio: true,
					filter(event) {
						return event.card && event.card.name === "sha" && event.notLink() && event.player.getCards("he").length > 0;
					},
					prompt2(event, player) {
						return `你可以防止此伤害(${Math.max(event.num, 0)}点)，然后依次弃置目标角色的${Math.max(event.num+1, 1)}张牌。`
					},
					check(event, player) {
						var target = event.player;
						var eff = get.damageEffect(target, player, player, event.nature);
						if (get.attitude(player, target) > 0) {
							if (
								eff >= 0 ||
								(event.nature &&
									target.isLinked() &&
									game.hasPlayer(cur => {
										return cur !== target && cur.isLinked() && get.damageEffect(cur, player, player, event.nature) > 0;
									}))
							) {
								return false;
							}
							return true;
						}
						if (eff <= 0) {
							return true;
						}
						if (target.hp === 1 || player.hasSkill("tianxianjiu")) {
							return false;
						}
						if (
							!target.hasSkillTag("filterDamage", null, {
								player: player,
								card: event.card,
								jiu: player.hasSkill("jiu"),
							})
						) {
							if (
								event.num > 1 ||
								player.hasSkillTag("damageBonus", true, {
									player: player,
									card: event.card,
								})
							) {
								return false;
							}
						}
						if (target.countCards("he") < 2) {
							return false;
						}
						var num = 0;
						var cards = target.getCards("he");
						for (var i = 0; i < cards.length; i++) {
							if (get.value(cards[i]) > 6) {
								num++;
							}
						}
						if (num >= 2) {
							return true;
						}
						return false;
					},
					logTarget: "player",
					async content(event,trigger,player) {
						trigger.cancel();
						let num = Math.max(trigger.num + 1, 1)
						while (num > 0 && trigger.player.countDiscardableCards(player, "he")) {
							player.line(trigger.player);
							await player.discardPlayerCard("he", trigger.player, true);
							num--
						}
					},
					"skill_id": "hanbing_skill",
					"_priority": -25,
				};
				lib.translate.hanbing_info="当你因执行【杀】的效果而造成伤害时，若目标角色有能被弃置的牌，则你可以防止此伤害，然后依次弃置目标角色的X+1张牌。(X为伤害值且至少为0)";
				lib.translate.hanbing_skill_info = "当你因执行【杀】的效果而造成伤害时，若目标角色有能被弃置的牌，则你可以防止此伤害，然后依次弃置目标角色的X+1张牌。(X为伤害值且至少为0)";
				lib.skill.cixiong_skill = {
					equipSkill: true,
					trigger: {
						player: "useCardToPlayered",
					},
					audio: true,
					logTarget: "target",
					check(event, player) {
						if (get.attitude(player, event.target) > 0) {
							return true;
						}
						var target = event.target;
						return target.countCards("h") === 0 || !target.hasSkillTag("noh");
					},
					filter(event, player) {
						if (event.card.name !== "sha") {
							return false;
						}
						if (!player.countDiscardableCards("h", player)) return false;
						return true
					},
					async cost(event, trigger, player) {
						event.result = await player.chooseToDiscard(player, "h", false)
							.set("filterCard", (card, player) => {
								return true
							})
							.set("selectCard", 1)
							.set("prompt", `是否对 ${get.translation(trigger.target)} 发动【雌雄双股剑】？`)
							.set("prompt2", `当你使用【杀】指定目标角色后，你可以弃置一张手牌，令其选择一项：1.弃置一张手牌；2.令你摸一张牌`)
							.set("chooseonly", true)
							.forResult();
					},
					async content(event, trigger, player) {
						await player.modedDiscard(event.cards);
						if (!trigger.target.countCards("h")) {
							event.result = { bool: false };
						} else {
							event.result = await trigger.target
								.chooseToDiscard("弃置一张手牌，或令" + get.translation(player) + "摸一张牌")
								.set("ai", function (card) {
									const bool = get.event().bool;
									if (!bool) {
										return 0;
									}
									if (get.name(card) === "shan") {
										return bool - get.event().shan * get.value(card);
									}
									return bool - get.value(card);
								})
								.set(
									"bool",
									(function () {
										const hs = trigger.target.countCards("h"),
											att = get.attitude(trigger.target, trigger.player);
										if (!hs || att > 0) {
											return false;
										}
										if (trigger.target.hasSkillTag("noh")) {
											return 8;
										}
										if (get.effect(trigger.target, trigger.card, player, trigger.target) >= 0) {
											return 6;
										}
										return -att - Math.max(0, 4 - trigger.target.hp) * 2;
									})()
								)
								.set(
									"shan",
									(function () {
										if (
											player.hasSkillTag("directHit_ai", true, {
												target: trigger.target,
												card: trigger.card,
											})
										) {
											return 0;
										}
										const shans = trigger.target.mayHaveShan(trigger.target, "use", true, "count");
										if (shans === 0 || shans > 2) {
											return 1;
										}
										if (shans === 1) {
											return 3.6 / Math.min(3.6, trigger.target.getHp());
										}
										return 1.8 / Math.min(1.8, trigger.target.getHp());
									})()
								)
								.forResult();
						}
						if (event.result.bool === false) {
							await player.draw();
						}
					},
					"skill_id": "cixiong_skill",
					"_priority": -25,
				};
				lib.translate.cixiong_skill_info="当你使用【杀】指定目标角色后，你可以弃置一张手牌，令其选择一项：1.弃置一张手牌；2.令你摸一张牌。";
				lib.translate.cixiong_info = "当你使用【杀】指定目标角色后，你可以弃置一张手牌，令其选择一项：1.弃置一张手牌；2.令你摸一张牌。";
			}
			//动态音乐图片兼容			
			(function () {
				// 1. 找到 HTML 音频元素的原型
				var proto = HTMLAudioElement.prototype;
				// 2. 获取原始的 src 描述符（从原型链获取）
				var descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
				var oldSet = descriptor.set;

				Object.defineProperty(proto, 'src', {
					set: function (val) {
						// 关键点：我们只拦截 ui.backgroundMusic 的 src 变化
						// 避免误伤游戏中其他的音效（如技能声效、按钮点击声）
						if (window.ui && this === ui.backgroundMusic) {
							if (window._currentDynamicBackground) {
								var bg = window._currentDynamicBackground;
								bg.style.opacity = "0";
								setTimeout(function () {
									// 同样在这里加入判断
									if (bg && bg.parentNode === document.body) {
										document.body.removeChild(bg);
									}
								}, 500);
								window._currentDynamicBackground = null;
							}
						}
						// 3. 执行原始的赋值
						return oldSet.apply(this, arguments);
					},
					get: descriptor.get,
					configurable: true
				});
			})();
			// 导入角色
			game.import('character', function () {
				var YZS = {
					name: 'SCHyzs',
					connect: true,
					character: { ...characters },
					characterIntro: { ...characterIntros },
					characterSubstitute: { ...characterSubstitutes },
					characterTitle: { ...characterTitles },
					characterSort: {
						SCHyzs: { ...characterSort }
					},
					characterReplace: { ...characterReplaces },
					dynamicTranslate: { ...dynamicTranslates },
					skill: {
						...skills,
						...skills1,
						...skills2,
						...skills3,
						...skills4,
						...skills5,
					},
					translate: { ...translates, },
				};
				return YZS;
			});
			let abc = function () {
				window.yzs(lib, game, ui, get, ai, _status);
			};
			let path = lib.assetURL + "extension/" + "一中杀" + "/";
			let yzs = {};
			//武将
			if (!yzs.character) yzs.character = [];
			//卡牌
			if (!yzs.card) yzs.card = [];
			//自定义函数
			if (!yzs.func) yzs.func = [];
			yzs.func.add("trigger");
			yzs.func.add("settle");
			lib.init.css(path, 'extension');
			//循环导入
			for (let id in yzs) {
				let list = yzs[id];
				if (list && Array.isArray(list)) {
					for (let idx of list) {
						if (typeof idx === "string") lib.init.js(path + id, idx, abc);
					};
				};
			};
			//卡牌
			lib.init.js(path, "card");
		},
		content: function (config, pack) {
			//【更新说明】
			let gengxin_yzs = [
				{
					type: "text",
					data: `○新增武将：`,
				},
				{
					type: "players", data: [
						"GunTwins_yzs",
						"YoungGojo_yzs",
					]
				},
				{
					type: "text",
					data: `○武将调整：`,
				},
				{
					type: "players", data: [
					]
				},
			];
			game.showExtensionChangeLog(gengxin_yzs, "一中杀");
			if (lib.config.extension_一中杀_auto_update && navigator.onLine) update(false);
		},
		help: {},
		config: {
			update_source: {
				name: `<font color="#9c27b0">更新镜像源`,
				init: "0",
				item: {
					0: "扩展官方源",
					1: "GitHub官方源",
					2: "gh-proxy全球镜像",
					3: "gh-proxy国内镜像",
					4: "tvv.tw镜像源",
				}
			},
			auto_update: {
				name: `<font color="#e91e63">自动检测更新`,
				init: true,
				intro: "启动游戏时自动检查更新",
			},
			check_update: {
				name: `<span style="color:#4caf50;text-decoration: underline">检查更新`,
				clear: true,
				onclick: async function () {
					this.innerHTML = `<span style="color:#f61515ff;text-decoration: underline">正在检测更新...`;
					try {
						await update(true);
						this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">更新完成`;
					} catch {
						this.innerHTML = `<span style="color:#f44336;text-decoration: underline">更新失败`;
					}
					setTimeout(() => {
						this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">检查更新`;
					}, 2000);
				}
			},
			"yzs_bgm": {
				name: `<font color="#e91e63">专属BGM<small>(下局生效)`,
				init: true,
				intro: "场上存在本扩展角色时是否播放BGM<br><small>(下局生效)</small><br>开启后，部分的角色的角色曲将会加入背景BGM<small>(重启2次生效)",
			},
			"yzsTotem": {
				name: `<font color="#E661A0">开启${get.poptip("storm_yzs")}<small>(下局生效)`,
				init: false,
				intro: `是否开启开局${get.poptip("Totem_yzs")}？（关闭后，非风暴相关机制武将将无法召引风暴）<br>下局游戏生效`,
			},
			"yzsProtect": {
				name: `<font color="#f1e48e">开局护甲保护<small>(下局生效)`,
				intro: `是否开启开局护甲保护？（开启后，持续时间内，所有角色轮次开始时获得1点${get.poptip("tempHujia")}，持续至下一轮）<br>下局游戏生效`,
				init: '0',
				item: {
					0: '无保护',
					1: '持续1轮',
					2: '持续2轮',
					3: '持续3轮',
				},
			},
			"yzsUndying": {
				name: '<font color="#f1e48e">开局丝血保护<small>(下局生效)',
				intro: `是否开启开局丝血保护？（开启后，每名角色在自己的回合开始前，体力值至多下降至1<br><small>
				特殊地，以下情况不适用丝血保护：
				<br>嗔嘘发动【舍身】而受到伤害
				<br>“爱国者”发动【坚盾】而受到伤害<br> </small>下局游戏生效`,
				init: false,
			},
			yzs_title: {
				name: '<font color="#f1e48e">小提示<small>(重启生效)',
				intro: `开启小提示，开启后游戏期间屏幕顶部随机播放小提示`,
				init: true,
			},
			yzs_Exequip: {
				name: '<font color="#f1e48e">装备修改<small>(重启生效)',
				intro: `开启后修改装备部分装备的技能效果（雌雄双股剑和寒冰剑）`,
				init: true,
			},
			yzs_rg: {
				name: '<font color="#f1e48e">开启肉鸽<small>(重启生效)',
				intro: `开启后开启boss武将的肉鸽模式（对boss造成伤害可以抽取随机技能或复活币）`,
				init: true,
			},
		},
		package: {
			intro: `
            <div style="color:#ffa348">• 有问题可加群：</div><br>
            <div style="color:#ffa348">&nbsp;&nbsp;Q:1015772605</div><br>
            <div style="color:#ffa348">• 角色设计：御.sky/先天虚体阿阳/加农/海马吉人/Etermpty</div><br>
            <div style="color:#ffa348">• 版本号：v0.92</div><br>
            `,
			author: "御.sky",
			diskURL: "",
			forumURL: "",
			version: "0.92",
		},
		files: {}, connect: true
	}
})
