
//超链接
"use strict";
window.yzs = function (lib, game, ui, get, ai, _status) {
	lib.poptip.add({
		id: "adapt_yzs",
		name: "适应",
		info: `被适应的牌或技能对你无效（包括无视抵挡和减免伤害等）。你对你适应的角色造成伤害乘X（X为你对其适应的次数+1）`,
	});
	lib.poptip.add({
		id: "lingyuzhankai_yzs",
		name: "领域展开",
		info: `拥有此词条的技能为领域技。<br>领域技默认为出牌阶段限1次，弃置任意张手牌发动，展开持续X个回合的领域（X为弃牌数）。<br>
		若展开前处于其他领域，则弃置的牌数优先抵消其他领域的剩余回合数，只有其他领域剩余回合数抵消完后，剩余的部分才能展开自己的领域。<br>
		处于自己的领域内时，不可展开领域。<br>成功展开领域后，自己的所有通常技本回合失效。<br>领域主人死亡时，领域立即解除。`,
	});
	lib.poptip.add({
		id: "shishenCard_yzs",
		name: "式神牌",
		info: `式神牌被【无懈可击】响应后破坏，被破坏后可与其余式神牌融合强化。<br>一共有十种，分别是：
		【玉犬】、【鵺】、【大蛇】、【蛤蟆】、【满象】、【脱兔】、【贯牛】、【円鹿】、【虎葬】、【魔虚罗】`,
	});
	lib.poptip.add({
		id: "planetCard_yzs",
		name: "行星牌",
		info: `伽菈波那的专属牌，分别是<font color="#f8aa5d">【土星】</font>、<font color="#f56161">【火星】</font>、<font color="#f9e99e">【盈月】</font><br>
		移去行星牌时，若移去的为：<br><font color="#f8aa5d">【土星】</font>：你摸2张牌；<br><font color="#f56161">【火星】</font>：你获得1点行动力并弃至多2张牌；<br><font color="#f9e99e">【盈月】</font>：每移去其下2张牌，你分配0点伤害。<br>`,
	});
	lib.poptip.add({
		id: "chaodaoti_yzs_effect",
		name: "超导",
		info: `处于本状态的角色受到雷电伤害后，其他处于本状态的角色依次受到等量点雷电伤害。<br>本状态不可与“连环状态”共存，进入本状态时退出连环状态，进入连环状态时退出本状态`,
	});
	lib.poptip.add({
		id: "GodgivenSwordsmanship_yzs_tongshen",
		name: "通神",
		info: `你使用【技能】时退出“通神”，令之附带【剑技】效果。`,
	});
	lib.poptip.add({
		id: "xuanhujishi_yzs_zhulu",
		name: "珠露",
		info: `“珠露”：持有者回合外改为启用“珠露”作为手牌。“珠露”中的【杀】视为【桃】`,
	});
	lib.poptip.add({
		id: "InBarrier_yzs",
		name: "结界内",
		info: `结界内角色摸牌数+1，回合结束时其恢复1点体力。<br>
    结界内角色受到致命伤害时，无效之并移除“子结界”。<br>
    博丽灵梦为结界内角色时，技能描述[]中“1”与“0”交换、摸牌数+2且不可被其他角色指定。`,
	});
	lib.poptip.add({
		id: "Barrier_yzs",
		name: "结界",
		info: `博丽大结界的一部分。不会死亡、无回合、区域。路径穿过结界的距离计算均改为无限。`,
	});
	lib.poptip.add({
		id: "subBarrier_yzs",
		name: "子结界",
		info: `博丽大结界较脆弱的一部分。无回合、区域。路径穿过子结界的距离计算均改为无限。<br>需使用或打出牌时，“博丽灵梦”可替你出之（视为由你使用或打出）。`,
	});
	lib.poptip.add({
		id: "fanyueciye_yzs_chara",
		name: "标注角色",
		info: `“标注角色”受到非零伤害时，你摸1张牌。“标注角色”造成非零伤害时，你获得1点激情并可重铸1张${get.poptip("RE_Mystic")}。`,
	});
	lib.poptip.add({
		id: "Passion_yzs",
		name: "激情",
		info: `《重返未来1999》包角色的专属机制，一种专属标记，该类型角色获得该标记后，若达到“至终仪式”要求的数量，则立刻发动“至终仪式”`,
	});
	lib.poptip.add({
		id: "RE_FC",
		name: "至终仪式",
		info: `《重返未来1999》包角色的专属机制，一种技能，一般后接要求的${get.poptip("Passion_yzs")}数量以及发动的效果，若达到要求的数量，则立刻发动“至终仪式”`,
	});
	lib.poptip.add({
		id: "RE_Mystic",
		name: "神秘术",
		info: `《重返未来1999》包角色的专属机制，一种专属卡牌，该类型角色使用“神秘术”机制的基石，一般数量恒定，放置在角色的特殊区域。<br>
		每张神秘术初始为1阶最高为3阶，与神秘术槽中相邻的同名神秘术进行融合可使得神秘术阶数升为二者之和，越高阶的神秘术效果一般越强。<br>
		重铸神秘术，即重新抽取一张神秘术替换掉目标神秘术，新抽取的神秘术初始阶数与目标神秘术相等<br>
		移动神秘术，即移动一张神秘术在神秘术槽中的位置，一般与融合神秘术搭配使用`,
	});
	lib.poptip.add({
		id: "RE_AP",
		name: "行动力",
		info: `《重返未来1999》包角色的专属机制，一种专属标记，该类型角色使用“神秘术”机制时用以消耗的代币，回合开始时自动补充至上限，每名角色上限不同`,
	});
	lib.poptip.add({
		id: "ErWangCiYuan_yzs",
		name: "次元状态",
		info: `分为“里”和“外”两种状态。<br>场上角色对所处次元状态与其不同的角色造成伤害时，无效之，然后本次受伤角色翻转其次元状态。`,
	});
	lib.poptip.add({
		id: "cundang_yzs",
		name: "存档",
		info: `记录所有角色的手牌数和体力值(最多存储6个记录)`,
	});
	lib.poptip.add({
		id: "dudang_yzs",
		name: "读档",
		info: `将目标角色的手牌数和体力值调整至记录值，然后删除该存档`,
	});
	lib.poptip.add({
		id: "icesha_yzs",
		name: "冰【杀】",
		info: `造成伤害时可跳过受伤角色下一出牌阶段并转换至【冰风暴】`,
	});
	lib.poptip.add({
		id: "paimianxiaoguo_yzs",
		name: "牌面效果",
		info: `即不经过转化、视为等的影响的，卡牌的实体牌的原生效果`,
	});
	lib.poptip.add({
		id: "wuyongchang_yzs",
		name: "无咏唱",
		info: "拥有此标签的技能，可在任意时机点击按钮，并于当前卡牌或技能结算完毕后发动技能。<br>可以于濒死求桃阶段发动。",
	});
	lib.poptip.add({
		id: "tempHujia",
		name: "临时护甲",
		info: `仅持续一段时间（一回合或一轮），时间结束后若未被消耗，则自动失去的护甲`,
	});
	lib.poptip.add({
		id: "throw_yzs",
		name: "投掷",
		info: `投掷X：投出一枚六面骰子，若点数结果≥X，则发动后续技能效果，X称为"投掷要求"`,
	});
	lib.poptip.add({
		id: "Fuka_yzs",
		name: "符卡",
		info: "符卡，发动拥有“符卡”标签的技能时，用于消耗的标记。<br>不同的角色存储符卡的上限不同",
	});
	lib.poptip.add({
		id: "eternalSkill_yzs",
		name: "永久技",
		info: "特殊的技能标签，此类型的技能可以在技能持有者不在场的情况下发动(死亡或调离)",
	});
	lib.poptip.add({
		id: "FukaSkill_yzs",
		name: "符卡",
		info: "符卡（X），技能标签，即需要消耗X张符卡才能发动的技能，默认X为1，且若无说明时机则为出牌阶段发动。此技能标签默认锁定。",
	});
	lib.poptip.add({
		id: "zhuanlunji_yzs",
		name: "转轮技",
		info: "拥有此标签的技能，只能按顺序发动序号①②③...的效果。<br>最后一个序号发动后，回到序号①",
	});
	lib.poptip.add({
		id: "sing_yzs",
		name: "吟唱",
		info: `一般格式为吟唱X。拥有此标签的技能，于准备阶段进行一次计数，当计数次数达到X时，强制发动技能效果。例如：<br>
	吟唱1 为自己每个回合准备阶段都强制发动一次效果，吟唱2 为每经过2个自己的准备阶段强制发动一次效果`,
	});
	lib.poptip.add({
		id: "sing_yzs_count",
		name: "吟唱",
		info: `吟唱-X，即进行X次计数，若计数后达到吟唱所需次数，则立即强制发动技能效果`
	});
	lib.poptip.add({
		id: "Totem_yzs",
		name: "图腾",
		info: `出牌阶段，用于召引${get.poptip("storm_yzs")}，每次消耗1枚图腾`,
	});
	lib.poptip.add({
		id: "storm_yzs",
		name: "风暴",
		info: "一中杀独有的场地机制。风暴分为召引效果和持续效果，召引效果仅对召引该风暴的角色生效，持续效果对所有角色生效。<br>更换风暴有召引和转换两种方式，后者不触发召引效果",
	});
	lib.poptip.add({
		id: "FireStorm",
		name: "【火风暴】",
		info: "召引者本自轮次下张【杀】伤害+1。<br>场上角色使用的【杀】附带火属性",
	});
	lib.poptip.add({
		id: "ThunderStorm",
		name: "【雷风暴】",
		info: "召引者横置或重置1~2名角色。<br>场上角色使用的【杀】附带雷属性",
	});
	lib.poptip.add({
		id: "WaterStorm",
		name: "【水风暴】",
		info: `召引者令1名角色获得${get.poptip("WaterStorm_skill_instant_buff")}。<br>场上角色回合开始时恢复1点体力`,
	});
	lib.poptip.add({
		id: "IceStorm",
		name: "【冰风暴】",
		info: "召引者可弃置X张手牌，然后令2名手牌数之差为X的其他角色交换手牌。<br>额定摸牌阶段移至额定弃牌阶段后",
	});
	lib.poptip.add({
		id: "BulletStorm",
		name: "【枪弹风暴】",
		info: "召引者本自轮次下张【杀】无次数距离限制。<br>场上角色回合结束时受到1点无来源伤害",
	});
	lib.poptip.add({
		id: "WindStorm",
		name: "【凪风暴】",
		info: `召引者摸2张牌。<br>场上角色视为拥有${get.poptip("WindStorm_skill_g")}`,
	});
	lib.poptip.add({
		id: "FinancialStorm",
		name: "【金融风暴】",
		info: "召引者获得1张符卡，然后视为使用任意非伤害非延时锦囊牌。<br>场上角色回合开始时弃1张手牌。",
	});
	lib.poptip.add({
		id: "SmokeStorm",
		name: "【烟风暴】",
		info: `召引者可令任意角色下次投掷结果为6。<br>场上角色回合开始时${get.poptip("throw_yzs")}4：恢复1点体力。`,
	});
	lib.poptip.add({
		id: "jifengbaoxiang_yzs",
		name: "疾风宝箱",
		info: `"反叛的海贼—远舟村贺"的专属召唤物，没有回合、区域，初始体力值为8，不可成为除"反叛的海贼-远舟春贺"以外的角色使用牌的目标`,
	});
	lib.poptip.add({
		id: "ciyuanzhimen_yzs",
		name: "次元之门",
		info: `"次元魔女-许如荧"的专属召唤物，没有区域，回合仅有准备阶段，初始体力值为4，无视非指向性牌造成的伤害和技能伤害。
		受到伤害结算后，若伤害来源不为召唤物，将伤害来源送至其1自轮次后的次元。<br>
		"次元之门"在场时，"次元魔女-许如荧"可用${get.poptip("gongyin_yzs")}。`,
	});
	lib.poptip.add({
		id: "MrDragon_yzs",
		name: "龙先生",
		info: `"年幼的龙骑士-加羽"的专属召唤物，初始体力值和手牌数为4。可以如同其他玩家一般出牌，拥有技能${get.poptip("longzhiban_yzs_MrDragon_yzs")}`,
	});
	lib.poptip.add({
		id: "OnionMan_yzs2",
		name: "任瑞",
		info: `"洋葱怪人-任瑞"的完美复制体，只要复制体还存活，最初的洋葱怪人便视为未死亡!`,
	});
	lib.poptip.add({
		id: "tentacle_yzs",
		name: "深渊之触",
		info: `"冯·吉苏克"从深渊召唤来的产物。<br>其体力上限和摸牌数等于当前轮次数，出【杀】数等于体力值。<br>其受到伤害后替换回原人物牌。`,
	});
	lib.poptip.add({
		id: "BDCheTianke_yzs",
		name: "车天可",
		info: `魔剑的铸造者。拥有技能${get.poptip("BladeDemon_yzs")}、${get.poptip("BloodFeast_yzs")}、${get.poptip("BloodCovenant_yzs")}`,
	});
	lib.poptip.add({
		id: "BDXiangSiniao_yzs",
		name: "向思尼奥",
		info: `反噬造物主的魔剑。拥有技能${get.poptip("DemonBlade_yzs")}、${get.poptip("BloodFeast_yzs")}`,
	});
	lib.poptip.add({
		id: "Makora_yzs",
		name: "魔虚罗",
		info: `十种影法术中的最强式神，拥有适应万物的能力。`,
	});
}
