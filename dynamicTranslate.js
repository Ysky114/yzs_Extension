import { lib, game, ui, get, ai, _status } from "../../noname.js";
const dynamicTranslates = {
	ba_yzs(player) {
		if (player.countMark("ba_yzs_weaken")) return `出牌阶段，你可视为使用无次数限制的【杀】，此【杀】伤害值改为目标角色体力上限的一半（向上取整至多为5），然后本技能本回合失效。`
		return `出牌阶段，你可视为使用无次数、距离限制的【杀】，此【杀】伤害值改为目标角色体力上限的一半（向上取整至多为5），然后本技能本回合失效。`
	},
	jie_yzs(player) {
		if (player.countMark("jie_yzs_weaken")) return `出牌阶段，你可弃置距离1以内的1名其他角色手牌区和装备区各1张牌，并对其造成1点伤害，然后本技能本回合失效。`
		return `出牌阶段，你可弃置1名其他角色手牌区和装备区各1张牌，并对其造成1点伤害，然后本技能本回合失效。`
	},
	chijingzhiyi_yzs(player) {
		return `锁定技：游戏开始时和${get.poptip("sing_yzs")}1：你摸1张牌，然后尽可能将至多<font color="#fd5656">${Math.min(player.countMark("chijingzhiyi_yzs_used")+1,3)}</font>张手牌加入你的【生命之契】。<br>
    你失去最后的${get.poptip("_sishengzhijian_yzs_cards")}时本技能${get.poptip("sing_yzs_count")}-1。<br>你发动本技能后，本自轮内本技能红色数字+1（至多为3）。`
	},
	duyideyuanman_yzs(player) {
		let x = player.countMark("duyideyuanman_yzs") + 1;
		if (x == 5) return `锁定技：你使用牌时获得1点${get.poptip("Passion_yzs")}。<br>激情5：移去“星环”内全部牌，本次结算中移去行星牌效果数字+1，结算后获得2张<font color="#f9e99e">【盈月】</font>并重置X为1。`
		return `锁定技：你使用牌时获得1点${get.poptip("Passion_yzs")}。<br>激情${x}：获得1张<font color="#f9e99e">【盈月】</font>。`
	},
	WeatherReport_yzs(player) {
		let str = `${get.poptip("zhuanlunji_yzs")}：`;
		if (player.countMark("WeatherReport_yzs") == 0) str += `<span class="bluetext">①每名角色准备阶段</span> `
		else str += `①每名角色准备阶段`
		if (player.countMark("WeatherReport_yzs") == 1) str += `<span class="bluetext">②你的出牌阶段</span> `
		else str += `②你的出牌阶段`
		if (player.countMark("WeatherReport_yzs") == 2) str += `<span class="bluetext">③每名角色结束阶段</span> `
		else str += `③每名角色结束阶段`
		str += player.countMark("StormRain_yzs") ? `：开始时，你可使用1张即时牌` : `：开始时，你可使用1张单目标即时锦囊牌`;
		str += `，然后召引任意 ${get.poptip("storm_yzs")}，此风暴持续效果增加“当前回合角色于此时机视为使用此牌”。`;
		return str;
	},
	StormRain_yzs(player) {
		if (player.countMark("StormRain_yzs")) return `觉醒技：场上角色于其出牌阶段外对你使用牌时，你可弃置1张基本牌以取消其中一个目标。<br>
    <span style="opacity:0.5">出牌阶段结束时，若你召引过全部风暴或进入过濒死，你觉醒：此后你发动${get.poptip("WeatherReport_yzs")}无视“单目标”和“锦囊”条件。</span>`
		return `觉醒技：场上角色于其出牌阶段外对你使用牌时，你可弃置1张基本牌以取消其中一个目标。<br>
    出牌阶段结束时，若你召引过全部风暴或进入过濒死，你觉醒：此后你发动${get.poptip("WeatherReport_yzs")}无视“单目标”和“锦囊”条件。`
	},
	mengmie_yzs(player) {
		if (player.countMark("mengmie_yzs_awake")) return `出牌阶段开始时你摸已损体力值张牌，然后弃至多体力值张手牌，本阶段你出【杀】数为因此弃牌数。<br><span style="opacity:0.5">觉醒技：你进入濒死时或【梦疗事变】被无效后，你觉醒：你获得${get.poptip("huange_yzs")}并选择：①：失去【梦疗】并恢复全部体力；②：失去1点体力和体力上限。</span>`;
		return `出牌阶段开始时你摸已损体力值张牌，然后弃至多体力值张手牌，本阶段你出【杀】数为因此弃牌数。<br>觉醒技：你进入濒死时或【梦疗事变】被无效后，你觉醒：你获得${get.poptip("huange_yzs")}并选择：①：失去【梦疗】并恢复全部体力；②：失去1点体力和体力上限。`
	},
	jieyicunfashi_yzs(player) {
		if (player.storage.jieyicunfashi_yzs) return `<span style="opacity:0.5">觉醒技：你手牌上限增加至≥15后觉醒：你对【巨型】角色使用【杀】无次数和距离限制、其他角色不可退出【巨型】。</span>`
		return `觉醒技：你手牌上限增加至≥15后觉醒：你对【巨型】角色使用【杀】无次数和距离限制、其他角色不可退出【巨型】。`
	},
	gathering_hopes_yzs(player) {
		if (player.storage.gathering_hopes_yzs) return `觉醒技：你对其他角色使用【桃】后将牌堆顶牌加入【愿】，<span style="opacity:0.5">达4张时你扣除1点体力上限并令场上角色依次获得1点护甲然后觉醒：有【愿】时你获得之；你使用红色牌无次数限制。</span>`
		return `觉醒技：你对其他角色使用【桃】后将牌堆顶牌加入【愿】，达4张时你扣除1点体力上限并令场上角色依次获得1点护甲然后觉醒：有【愿】时你获得之；你使用红色牌无次数限制。`
	},
	undyinghero_yzs(player) {
		if (player.storage.undyinghero_yzs_awaken) return `觉醒技：你受到伤害后获得等量点【决心】，上限为9。你摸牌数+${Math.ceil(player.countMark("undyinghero_yzs")/2)}。<br>
    <span style="opacity:0.5">你濒死时，若【决心】已达上限，恢复全部体力并获得9点护甲，然后觉醒：你受到非零伤害+1、你的【闪】视为【矛】、你回合开始时扣减1点体力上限。</span>`
		return `觉醒技：你受到伤害后获得等量点【决心】，上限为9。你摸牌数+${Math.ceil(player.countMark("undyinghero_yzs") / 2)}。<br>
    你濒死时，若【决心】已达上限，恢复全部体力并获得9点护甲，然后觉醒：你受到非零伤害+1、你的【闪】视为【矛】、你回合开始时扣减1点体力上限。`
	},
	InvisibleHand_yzs(player) {
		if (typeof _status.LilyPrice!="number") return lib.translate["InvisibleHand_yzs_info"];
		return `锁定技：摸牌阶段，你可改为摸5张牌并弃4张手牌。<br>你每主动弃置或使用1张你自己的红/黑色手牌时【市价】+/-1。<br>
<small>【市价】：记为<font color="#f9be4d">${_status.LilyPrice} </font>，初始为2，范围为[0，5]。`
	},
	FreeMarket_yzs(player) {
		if (_status.FinancialWaltz_yzs) {
			if (typeof _status.LilyPrice != "number") return `锁定技：出牌阶段限1次：你弃<font color="#f9be4d">X</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，上限为3。<br>
    你受到伤害时，你可给予伤害来源1枚<font color="#f9be4d">【货】</font>以无效之，然后其弃<font color="#f9be4d">X-2</font>张手牌。（其依此法获得的<font color="#f9be4d">【货】</font>其本回合内不可主动售出）<br>
<small><font color="#f9be4d">【货】：场上角色回合开始前售出自己的1枚【货】并摸<font color="#f9be4d">X-2</font>张牌，若其为你，额外摸2张牌。</font>`
			return `锁定技：出牌阶段限1次：你弃<font color="#f9be4d">${_status.LilyPrice}</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，上限为3。<br>
    你受到伤害时，你可给予伤害来源1枚<font color="#f9be4d">【货】</font>以无效之，然后其弃<font color="#f9be4d">${Math.max(_status.LilyPrice - 2,0)}</font>张手牌。（其依此法获得的<font color="#f9be4d">【货】</font>其本回合内不可主动售出）<br>
<small><font color="#f9be4d">【货】：场上角色回合开始前售出自己的1枚【货】并摸<font color="#f9be4d">${Math.max(_status.LilyPrice - 2,0)}</font>张牌，若其为你，额外摸2张牌。</font>`
		}
		if (typeof _status.LilyPrice != "number") return lib.translate["FreeMarket_yzs_info"];
		return `锁定技：出牌阶段限1次：你弃<font color="#f9be4d">${_status.LilyPrice}</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，上限为3。<br>
    你受到伤害时，你可给予伤害来源1枚<font color="#f9be4d">【货】</font>以无效之，然后其弃<font color="#f9be4d">${Math.max(_status.LilyPrice - 2, 0)}</font>张手牌。（其依此法获得的<font color="#f9be4d">【货】</font>其本回合内不可主动售出）<br>
<small><font color="#f9be4d">【货】：场上角色其出牌阶段限1次：售出自己的1枚【货】并摸<font color="#f9be4d">${Math.max(_status.LilyPrice - 2, 0)}</font>张牌，若其为你，额外摸2张牌。</font>`
	},
	PonziScheme_yzs(player) {
		if (typeof _status.LilyPrice != "number") return lib.translate["PonziScheme_yzs_info"];
		return `锁定技：出牌阶段限1次：你令1名其他人物弃<font color="#f9be4d">${Math.max(_status.LilyPrice - 2, 0)}</font>张手牌，然后你获得1枚<font color="#f9be4d">【货】</font>且其获得1枚<font color="#bef750">【菜】</font>标记。<br>
	其回合开始时移除1枚<font color="#bef750">【菜】</font>，然后你给予其1枚<font color="#f9be4d">【货】</font>，若你无<font color="#f9be4d">【货】</font>则你立即发动此技能。<br>（每名人物至多拥有1枚<font color="#bef750">【菜】</font>，场上有2枚<font color="#bef750">【菜】</font>时你不可主动发动本技能）`
	},
	FinancialWaltz_yzs(player) {
		if (typeof _status.LilyPrice != "number") return lib.translate["FinancialWaltz_yzs_info"];
		return `限定技：${get.poptip("wuyongchang_yzs")}：你失去1点体力并令所有人物获得${get.poptip("InvisibleHand_yzs")}
（可触发${get.poptip("ReminderNotice_yzs")}），你失去${get.poptip("PonziScheme_yzs")}并清除场上的<font color="#bef750">【菜】</font>。<br>
场上人物的回合开始时其需弃<font color="#f9be4d">${_status.LilyPrice}</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，然后若其无手牌则需给予你1枚<font color="#f9be4d">【货】</font>。
<br><font color="#f9be4d">【货】</font>不可主动售出，改为“于回合开始前强制抛售1枚”。<br>
    若有人物准备阶段<font color="#f93838">【赤字】</font>达到6，本技能效果结算结束，然后<font color="#f93838">【赤字】</font>拥有者依次清除其全部<font color="#f93838">【赤字】</font>并失去1点体力；拥有<font color="#f93838">【赤字】</font>最多者额外失去1点体力。（你死亡后本技能依然结算）`
	},
	houhukuangyan_yzs(player) {
		if (player.storage.houhukuangyan_yzs_zhuanhuan) return `锁定技：${get.poptip("xianzheyuyan_yzs")}未生效而进入弃牌堆后，原持有者失去1点体力。<br>
    转换技：需要时，你翻面并视为使用①【桃】<span class="bluetext">②【无懈可击】</span>。<br>
    出牌阶段，你可将牌堆底牌当做【贤者预言】对无此牌的角色使用，然后若之为黑色，你失去1点体力且本回合不可再如此做。`
			return `锁定技：${get.poptip("xianzheyuyan_yzs")}未生效而进入弃牌堆后，原持有者失去1点体力。<br>
    转换技：需要时，你翻面并视为使用<span class="bluetext">①【桃】</span>②【无懈可击】。<br>
    出牌阶段，你可将牌堆底牌当做【贤者预言】对无此牌的角色使用，然后若之为黑色，你失去1点体力且本回合不可再如此做。`
	},
	ExFighting_yzs(player) {
		let range = player.getAttackRange();
		if (range < 1) range = 1;
		return `锁定技：每回合内你使用或打出第${range}张牌后摸${range}张牌。（X为你攻击范围且至少为1）<br>
    你使用【杀】指定目标时，若你计算与目标角色距离为${range}，你召引${get.poptip("BulletStorm")}或对其造成1点伤害。`
	},
	VisionaryTuning_yzs(player) {
		if (player.storage.VisionaryTuning_yzs) return `转换技（回合开始时重置）：出牌阶段：<br>
虚：移去4张非♠“虚弹”，然后令1名不处于“狂”状态的角色下回合摸牌数-2并进入“狂”状态；<br>
<font color="#cac7ff">实：移去4张♠“虚弹”，然后对任意角色造成1点伤害并令其退出“狂”状态。<br></font>
<font color="#cac7ff">无论如何你获得1张${get.poptip("Fuka_yzs")}。</font>`
		return `转换技（回合开始时重置）：出牌阶段：<br>
<font color="#cac7ff">虚：移去4张非♠“虚弹”，然后令1名不处于“狂”状态的角色下回合摸牌数-2并进入“狂”状态；<br></font>
实：移去4张♠“虚弹”，然后对任意角色造成1点伤害并令其退出“狂”状态。<br>
<font color="#cac7ff">无论如何你获得1张${get.poptip("Fuka_yzs")}。</font>`
	},
	yinyangyu_yzs(player) {
		if (player.hasSkill("InBarrier_yzs_skill")) return `符卡：<font color="#9b9b9b">你摸[0]张牌，然后观看并与[0]名其他角色交换[0]张手牌，无论如何</font>你本回合出【杀】数+[1]并获得[1]枚【梦】标记，然后可令“结界”或“子结界”顺或逆时针移动[1]个座次。`;
		return `符卡：你摸[1]张牌，然后观看并与[1]名其他角色交换[1]张手牌<font color="#9b9b9b">，无论如何你本回合出【杀】数+[0]并获得[0]枚【梦】标记，
	然后可令“结界”或“子结界”顺或逆时针移动[0]个座次</font>。`;
	},
	erchongjiejie_yzs(player) {
		if (player.hasSkill("InBarrier_yzs_skill")) return `${get.poptip("FukaSkill_yzs")}：若场上无“${get.poptip("subBarrier_yzs")}”，召唤“子结界”至任意座次，然后你选择其朝向（顺或逆时针），该朝向上直至“结界”路径内称为“${get.poptip("InBarrier_yzs")}”。
		<br><font color="#9b9b9b">“子结界”死亡时你获得[0]张符卡。</font><br><small>结界内：你摸牌数+2，你不可被其他角色指定</small>`;
		return `${get.poptip("FukaSkill_yzs")}：若场上无“${get.poptip("subBarrier_yzs")}”，召唤“子结界”至任意座次，然后你选择其朝向（顺或逆时针），该朝向上直至“结界”路径内称为“${get.poptip("InBarrier_yzs")}”。
	<br>“子结界”死亡时你获得[1]张${get.poptip("Fuka_yzs")}。`
	},
	dajiejie_yzs(player) {
		if (player.hasSkill("InBarrier_yzs_skill")) return `锁定技：<font color="#9b9b9b">回合开始时你获得[0]张符卡。</font>你使用或打出红色牌时获得[1]张${get.poptip("Fuka_yzs")}。游戏开始时你召唤“${get.poptip("Barrier_yzs")}”至任意座次。`;
		return `锁定技：回合开始时你获得[1]张${get.poptip("Fuka_yzs")}。<font color="#9b9b9b">你使用或打出红色牌时获得[0]张符卡。</font>游戏开始时你召唤“${get.poptip("Barrier_yzs")}”至任意座次。`;
	},
	sanbubisha_yzs(player) {
		return `锁定技：每局游戏限${player.countMark("sanbubisha_yzs")}次：需要时，你可视为使用【酒】（有次数限制）。<br>
	若本技能已耗尽次数，你使用【杀】时重置本技能、摸3张牌并令之不可响应。`
	},
	zaoxingshu_yzs(player) {
		const storage = player.storage.zaoxingshu_yzs;
		if (!storage || !storage.length) return `锁定技：你使用的虚拟牌不可被响应。<br>每回合每种牌名限1次：
		需要时，你可视为使用<span class="bluetext">【无中生有】</span>。你因此获得牌时，展示之并将其中任意个即时牌名加入上述描述。每加入1个基本牌名，你扣除1点体力上限。`;
		let str = `锁定技：你使用的虚拟牌不可被响应。<br>每回合每种牌名限1次：
		需要时，你可视为使用`;
		for (let i = 0; i < storage.length; i++) {
			str += `<span class="bluetext">`;
			if (storage[i] == "sha") str += `普通`;
			str += `【` + get.translation(storage[i]) + `】` + `</span>`;
			if (i < storage.length - 1) str += `或`;
		}
		str += `。你因此获得牌时，展示之并将其中任意个即时牌名加入上述描述。每加入1个基本牌名，你扣除1点体力上限。`
		return str;
	},
	shuyu_yzs(player) {
		if (!player.storage.shuyu_yzs) return lib.translate["shuyu_yzs_info"]
		return `锁定技：每回合限1次：你可将♥牌当做【桃】使用，结算后目标角色可给予你1张手牌以刷新本技能，或摸2张牌。<br>
    你的【桃】可指定任意角色为目标，且目标角色使用下张牌无次数距离限制。`
	},
	mixiang_yzs(player) {
		if (!player.storage.mixiang_yzs) return `转换技：需要时，你可视为使用或打出：<span class="bluetext">①【闪】</span> ②【无懈可击】。`
		return `转换技：需要时，你可视为使用或打出：①【闪】<span class="bluetext">②【无懈可击】。</span> `
	},
	zhitui_yzs(player) {
		if (!player.hasSkill("kila_yzs")) return lib.translate["zhitui_yzs_info"];
		return `出牌阶段限1次：你展示1名其他角色的手牌，然后弃置其中的1张牌或失去1点体力。出牌阶段结束时，你分配1张手牌。`
	},
	guangbo_yzs(player) {
		return `出牌阶段限${player.countMark("CrimsonShadow_yzs") + 1}次：你摸1张牌，然后视为使用${get.poptip("wugu")}，因此获得红色牌的其他角色于本回合不可使用或打出牌。`
	},
	MadeInAbyss_yzs(player){
		let str = `${get.poptip("zhuanlunji_yzs")}：你使用或打出牌时，若之点数≤本自轮次你使用或打出的上张牌，摸1张牌，否则你：<br>`;
		if (player.countMark("MadeInAbyss_yzs") == 0) str += `<font color="#ffeac2">①重铸1张牌</font> `
		else str += `①重铸1张牌 `
		if (player.countMark("MadeInAbyss_yzs") == 1) str += `<font color="#ffeac2">②弃置1张牌</font> `
		else str += `②弃置1张牌 `
		if (player.countMark("MadeInAbyss_yzs") == 2) str += `<font color="#ffeac2">③弃置全部手牌</font> `
		else str += `③弃置全部手牌 `
		if (player.countMark("MadeInAbyss_yzs") == 3) str += `<font color="#ffeac2">④失去2点体力</font> `
		else str += `④失去2点体力 `
		if (player.countMark("MadeInAbyss_yzs") == 4) str += `<font color="#ffeac2">⑤翻至背面</font> `
		else str += `⑤翻至背面 `
		if (player.countMark("MadeInAbyss_yzs") == 5) str += `<font color="#ffeac2">⑥失去全部通常技和体力</font> `
		else str += `⑥失去全部通常技和体力 `
		if (player.countMark("MadeInAbyss_yzs") == 6) str += `<font color="#ffeac2">⑦死亡</font> `
		else str += `⑦死亡 `
		str += `<br>然后若之点数为A，转轮至下一项。你摸牌数为当前项序号`
		str += `<small>(${player.countMark("MadeInAbyss_yzs") + 1})</small>`
		str+=`。<br>转轮至②/⑤时，你获得${get.poptip("BlazeLeap_yzs")}/${get.poptip("YourWorth_yzs")}。<br>
    出牌阶段若当前项为⑦，你可失去本技能，然后令任意名角色重新加入游戏（无初始手牌）。`
		return str;
	},
	chaoren_yzs(player) {
		const map = {
			chaoren_yzs_SPSX: `手牌上限`,
			chaoren_yzs_MPS: `摸牌数`,
			chaoren_yzs_JGJL: `进攻距离`,
			chaoren_yzs_CSS: `出【杀】数`,
			chaoren_yzs_FYJL: `防御距离`,
			chaoren_yzs_XYS: `【杀】需响应数`,
		}
		const storage = player.storage.chaoren_yzs
		let str = `锁定技：回合开始时，你投掷${player.countMark("chaoren_yzs_num") + 3}枚骰子，然后将投掷结果从高至低依次填入你以下数值：（无对应结果的项数值不变，至少为1）<br><small>`;
		for (let i = 0; i < storage.length; i++) {
			str += map[storage[i]];
			str+=player.countMark(storage[i]) > 0 ? `(${player.countMark(storage[i])})` : ``;
			if(i<storage.length-1)str+=`、`
		}
		str += `</small>`
		return str;
	},
	youxingsheng_yzs(player) {
		const map = {
			chaoren_yzs_SPSX: `手牌上限`,
			chaoren_yzs_MPS: `摸牌数`,
			chaoren_yzs_JGJL: `进攻距离`,
			chaoren_yzs_CSS: `出【杀】数`,
			chaoren_yzs_FYJL: `防御距离`,
			chaoren_yzs_XYS: `【杀】需响应数`,
		}
		const storage = player.storage.youxingsheng_yzs
		let str = `锁定技：${get.poptip("chaoren_yzs")}结算后，你选择：<br>①此后【超人】多投掷1枚骰子；<br>`;
		str += storage.length ? `②将以下一项数值移动至【超人】描述末尾： <br><small>` : `令【超人】中一项数值+2<br><small>`;
		for (let i = 0; i < storage.length; i++) {
			str += map[storage[i]];
			str+=player.countMark(storage[i]) > 0 ? `(${player.countMark(storage[i])})` : ``;
			if (i < storage.length - 1) str += `、`
		}
		str += `</small><br>`
		str += storage.length ? `以上均移动后，②选项改为“令【超人】中一项数值+2”，此后你投掷结果+1。` : `你投掷结果+1。`;
		return str;
	},
	guangyousheguainiao_yzs(player) {
		if (!player.storage.guangyousheguainiao_yzs_name || !player.storage.guangyousheguainiao_yzs_name.length) return lib.translate["guangyousheguainiao_yzs"];
		return `锁定技：出牌阶段开始时你获得2张符卡。<br>回合开始时，你摸${player.countMark("guangyousheguainiao_yzs_fuka")}张牌。<br>
    你有额外手牌区，称为<font color="#ffac27">“半灵”</font>(初始4张牌)，原本的手牌区称为<font color="#1fffc0">“妖梦”</font>。你的回合内和出牌阶段内你启用<font color="#1fffc0">妖梦</font>，否则启用<font color="#ffac27">半灵</font>。<br>
    每名角色的出牌阶段结束时，你移动<font color="#1fffc0">妖梦</font>${player.countMark("guangyousheguainiao_yzs_record")}张牌至<font color="#ffac27">半灵</font>，若X≥4则你获得1张符卡，（X为你本阶段使用或重铸锦囊牌数）
	然后若<font color="#ffac27">半灵</font>比<font color="#1fffc0">妖梦</font>恰多${player.countMark("guangyousheguainiao_yzs_ling")}张牌，交换<font color="#1fffc0">妖梦</font>与<font color="#ffac27">半灵</font>的牌并获得1枚${get.poptip("guangyousheguainiao_yzs_ling")}标记。（Y为本自轮次获得【灵】标记数）<br>
    <font color="#1fffc0">妖梦</font>牌数＜/≥<font color="#ffac27">半灵</font>时，你可将<font color="#1fffc0">妖梦</font>与<font color="#ffac27">半灵</font>各一张同花色牌当做【${get.translation(player.storage.guangyousheguainiao_yzs_name[0])}】/【${get.translation(player.storage.guangyousheguainiao_yzs_name[1])}】使用或重铸。`
	},
	liugenqingjingzhan_yzs(player) {
		const name = player.storage.liugenqingjingzhan_yzs_record ? `【${get.translation(player.storage.liugenqingjingzhan_yzs_record.name)}】` : `上一记录牌`;
		return `锁定技：你使用或重铸即时非伤害锦囊牌时，记录之。<br>符卡：无咏唱：你选择：①视为${name}或摸1张牌；<br>
②将${get.poptip("guangyousheguainiao_yzs")}中一个牌名改为另一个，若二者因此相同，将1张牌当做被改变的牌使用或重铸；若否，摸或弃2张牌。`
	},
	yongyi_yzs(player) {
		if (!player.storage.yongyi_yzs) return `转换技：需要时，你可视为使用或打出：<span class="bluetext">①普通【杀】</span> ②【闪】。`
		return `转换技：需要时，你可视为使用或打出：①普通【杀】<span class="bluetext">②【闪】。</span> `
	},
	huanwu_yzs(player) {
		if (!player.storage["huanwu_yzs"]) return `锁定技：你视为拥有<font color="#f43e96">【仁王盾】</font>的装备效果。<br>
    每名角色的回合开始时，你可将1张<font color="#f43e96">装备牌</font>当做任意基本牌使用，并用<font color="#f43e96">此牌</font>替换<font color="#f43e96">上述牌名</font>。`
		return `锁定技：你视为拥有<font color="#f43e96">【` + get.translation(player.storage["huanwu_yzs"]) +`】</font>的装备效果。<br>
    每名角色的回合开始时，你可将1张<font color="#f43e96">装备牌</font>当做任意基本牌使用，并用<font color="#f43e96">此牌</font>替换<font color="#f43e96">上述牌名</font>。`
	},
	longzhiwu_yzs(player) {
		let str = `锁定技：回合开始时，若你体力值：`;
		if (player.hp <= 2) str += `<font color="#cac7ff">`;
		str +=`≤2：你恢复1点体力并摸3张牌，然后你弃3张牌；<br>`
		if (player.hp <= 2) str += `</font>`;
		if (player.hp >= 5) str += `<font color="#cac7ff">`;
		str += `≥5：你选择并获得效果：①：你体力上限+2（至多为9）；<br>②：你出【杀】数+1（至多+2）直至下次受到伤害后。`
		if (player.hp >= 5) str += `</font>`;
		return str;
	},
	longzhiban_yzs(player) {
		if (!_status.MrDragon_auto) return `锁定技：游戏开始时你召唤“${get.poptip("MrDragon_yzs")}”至场上任意座次。<br>
    <font color="#9b9b9b">若“龙先生”在场：你无视受到的伤害或失去体力效果、不可因牌恢复体力、对其他人物造成伤害-1；<br>
    每自轮次限3次：你可将红色牌当做普通【杀】使用或打出，并摸1张牌；<br>
    回合开始时你可跳过本回合任意个阶段，则“龙先生”下一对应阶段连续执行2次；<br>
    你因自身技能效果摸牌后，“龙先生”摸等量张牌。<br>
    你每自轮次首次恢复体力后，“龙先生”恢复1点体力。</font><br>
    若“龙先生”不在场：你受到非零伤害+2。你体力值变动时获得等同于变化值的【绊】标记。<br>
	【绊】数达到13时你清除所有【绊】并重新召唤“龙先生”至场上任意座次。`

		let str = `锁定技：游戏开始时你召唤“${get.poptip("MrDragon_yzs")}”至场上任意座次。<br>`;
		if (!game.hasPlayer(cur => cur.name == 'MrDragon_yzs')) str += `<font color="#9b9b9b">`;
		str +=`若“龙先生”在场：你无视受到的伤害或失去体力效果、不可因牌恢复体力、对其他人物造成伤害-1；<br>
    每自轮次限3次：你可将红色牌当做普通【杀】使用或打出，并摸1张牌；<br>
    回合开始时你可跳过本回合任意个阶段，则“龙先生”下一对应阶段连续执行2次；<br>
    你因自身技能效果摸牌后，“龙先生”摸等量张牌。<br>
    你每自轮次首次恢复体力后，“龙先生”恢复1点体力。<br>`
		if (!game.hasPlayer(cur => cur.name == 'MrDragon_yzs')) str += `</font>`;
		if (game.hasPlayer(cur => cur.name == 'MrDragon_yzs')) str += `<font color="#9b9b9b">`;
		str +=`若“龙先生”不在场：你受到非零伤害+2。你体力值变动时获得等同于变化值的【绊】标记。<br>
	【绊】数达到13时你清除所有【绊】并重新召唤“龙先生”至场上任意座次。`
		if (game.hasPlayer(cur => cur.name == 'MrDragon_yzs')) str += `</font>`;
		return str;
	},
	Auserlese_yzs(player) {
		if (!_status.Auserlese_yzs) return `每回合每名角色限1次：“<font color="#e553ff">阿乌拉</font>”回合外需要使用或打出基本牌时可令任意名其他拥有本技能的角色选择：
	<br>①给予“<font color="#e553ff">阿乌拉</font>”1张所需牌，然后“<font color="#e553ff">阿乌拉</font>”摸1张牌并可给予其1张牌；<br>②“<font color="#e553ff">阿乌拉</font>”获得其1张牌。`
		let str = `每回合每名角色限1次：“<font color="#e553ff">`
		str += get.translation(_status.Auserlese_yzs) + `</font>”回合外需要使用或打出基本牌时可令任意名其他拥有本技能的角色选择：`
		str += `<br>①给予“<font color="#e553ff">` + get.translation(_status.Auserlese_yzs) + `</font>”1张所需牌，然后“<font color="#e553ff">`
		str += get.translation(_status.Auserlese_yzs) + `</font>”摸1张牌并可给予其1张牌；<br>②“<font color="#e553ff">`
		str += get.translation(_status.Auserlese_yzs) + `</font>”获得其1张牌。`
		return str;
	},
	lvlin_yzs_fangun(player) {
		let last = player.storage.lvlin_yzs;
		let str = ``;
		if (last == "fangun") str += `<font color="#9b9b9b">`
		str += `需要时，你将牌堆顶牌当做【闪】使用或打出，则你使用下张牌无距离限制。`;
		if (last == "fangun") str += `</font>`
		return str;
	},
	lvlin_yzs_yingjian(player) {
		let last = player.storage.lvlin_yzs;
		let str = ``;
		if (last == "yingjian") str += `<font color="#9b9b9b">`
		str += `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做普通【杀】使用。`;
		if (last == "yingjian") str += `</font>`
		return str;
	},
	lvlin_yzs_qiequ(player) {
		let last = player.storage.lvlin_yzs;
		let str = ``;
		if (last == "qiequ") str += `<font color="#9b9b9b">`
		str += `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做【顺手牵羊】使用。`;
		if (last == "qiequ") str += `</font>`
		return str;
	},
	qiuwen_yzs(player) {
		const storage = player.storage.qiuwen_yzs;
		if (!storage || !storage.length) return `每回合每种牌名限1次：你可将手牌当做<span class="bluetext">【闪】</span>或<span class="bluetext">【无中生有】</span>使用或打出，并可令本技能本回合失效以摸3张牌并弃半数取下张手牌。`;
		let str = `每回合每种牌名限1次：你可将手牌当做`;
		for (let i = 0; i < storage.length;i++) {
			str += `<span class="bluetext">`;
			if (storage[i] == "sha") str += `普通`;
			str+=`【`+get.translation(storage[i]) + `】` + `</span>`;
			if (i < storage.length - 1) str += `或`;
		}
		str += `使用或打出，并可令本技能本回合失效以摸3张牌并弃半数取下张手牌。`
		return str;
	},
	ErWangSaid_yzs(player) {
		if (!player.hasSkill("ErWangLock_yzs_effect")) return `锁定技：游戏开始时你令你和至多2名其他角色进入“里”${get.poptip("ErWangCiYuan_yzs")}，其余角色进入“外”次元状态。<br>
	场上角色对所处次元状态与其不同的角色造成伤害时，无效之<span class="bluetext">，然后本次受伤角色翻转其次元状态</span>。<br>
    <span class="bluetext">你对同次元状态其他角色造成伤害时翻转其次元状态。你受到伤害时翻转次元状态；<br></span>
    出牌阶段，你可弃2张红色牌以视为使用任意仅指定你为目标的非延时锦囊牌。<br>
	回合内你翻转次元状态时可弃全部手牌。回合内你失去最后的手牌时摸3张牌。`
		return `锁定技：游戏开始时你令你和至多2名其他角色进入“里”${get.poptip("ErWangCiYuan_yzs")}，其余角色进入“外”次元状态。<br>
	场上角色对所处次元状态与其不同的角色造成伤害时，无效之。<br>
    出牌阶段，你可弃2张红色牌以视为使用任意仅指定你为目标的非延时锦囊牌。<br>
	回合内你翻转次元状态时可弃全部手牌。回合内你失去最后的手牌时摸3张牌。`
	},
	ErWangPlay_yzs(player) {
		if (!player.hasSkill("ErWangLock_yzs_effect")) return `锁定技：你处于“外”次元时：你造成伤害-1、你可将2张黑色牌当做【决斗】使用。<br>
    你处于“里”次元时：<span class="bluetext">你回合结束时对所有其他角色造成1点伤害。其他角色回合结束时你可弃1张黑色牌然后对其造成1点伤害。</span>`
		return `锁定技：你处于“外”次元时：你造成伤害-1、你可将2张黑色牌当做【决斗】使用。<br>
    你处于“里”次元时：`
	},
	SixSouls_yzs(player) {
		let str = `<span class="yzs_xuancai">持恒技</span>：你视为拥有：<br>`;
		if (!player.countMark("SixSouls_yzs_patience")) str += `<font color="#32d9c7">`
		str += `${get.poptip("SixSouls_yzs_patience")}`
		if (!player.countMark("SixSouls_yzs_patience")) str += `</font>`

		if (!player.countMark("SixSouls_yzs_courage")) str += `<font color="#ffac4c">`
		str += `${get.poptip("SixSouls_yzs_courage")}`
		if (!player.countMark("SixSouls_yzs_courage")) str += `</font>`

		if (!player.countMark("SixSouls_yzs_honesty")) str += `<font color="#2145ff">`
		str += `${get.poptip("SixSouls_yzs_honesty")}`
		if (!player.countMark("SixSouls_yzs_honesty")) str += `</font>`

		if (!player.countMark("SixSouls_yzs_perseverance")) str += `<font color="#b621ff">`
		str += `${get.poptip("SixSouls_yzs_perseverance")}`
		if (!player.countMark("SixSouls_yzs_perseverance")) str += `</font>`

		if (!player.countMark("SixSouls_yzs_kindness")) str += `<font color="#63e838">`
		str += `${get.poptip("SixSouls_yzs_kindness")}`
		if (!player.countMark("SixSouls_yzs_kindness")) str += `</font>`

		if (!player.countMark("SixSouls_yzs_justice")) str += `<font color="#fff821">`
		str += `${get.poptip("SixSouls_yzs_justice")}`
		if (!player.countMark("SixSouls_yzs_justice")) str += `</font>`
		return str;
	},
	BitetheDust_yzs(player) {
		let storage = player.storage.BitetheDust || 1;
		let str = `觉醒技：若你不处于“命运”：你进入濒死时可回复` + '<span class="bluetext">' + 2 / storage + "</span>" + `点体力并摸` + '<span class="bluetext">' + 4 / storage + "</span>" +`张牌；
		其他角色进入濒死时，你可调整你与其体力值至` + '<span class="bluetext">' + 2 / storage + "</span>" + `，然后你与其摸` + '<span class="bluetext">' + 4 / storage + "</span>" + `张牌并进入“命运”：`
			+ '<span class="bluetext">' + 2 / storage + "</span>" + `公轮内若你死亡，改为你恢复全部体力、你与其退出“命运”并摸` + '<span class="bluetext">' + 4 / storage + "</span>" + `张牌；
若否，其死亡，你与其退出“命运”。<br>发动本技能后上述数字减半，发动2次后你失去本技能并觉醒：你下一回合开始时获得${get.poptip("normal_life_yzs")}。`
		return str
	},
	tiance_yzs(player) {
		const last = player.storage.tiance_yzs_last
		let str = `锁定技：游戏和出牌阶段开始时，你移去所有【策】，并摸场上人物数+3张牌称为【策】，然后依任意顺序正面向下叠置于人物牌上。<br>
    出牌阶段开始时若你无【策】可移去，【千面】蓝字描述改为：${get.poptip("qianmian_yzs_effect2")}
    你的红色【策】称为【神算】，黑色【策】称为【鬼谋】。<br>转换技：满足条件时你可移去顶端【策】并发动对应效果，然后你可按序继续移去顶端【策】并发动对应效果。<br>`;
		if (last == "trick") str +=`<font color="#9b9b9b">`
		str += `①：${get.poptip("tiance_yzs_1")}<br>`;
		if (last == "trick") str += `</font>`
		if (last == "basic") str += `<font color="#9b9b9b">`
		str += `②：${get.poptip("tiance_yzs_2")}<br>`;
		if (last == "basic") str += `</font>`
		if (last == "judge" || player.storage.tiance_yzs_judge) str += `<font color="#9b9b9b">`
		str += `③：${get.poptip("tiance_yzs_3")}<br>`;
		if (last == "judge" || player.storage.tiance_yzs_judge) str += `</font>`
		if (last == "damage" || player.storage.tiance_yzs_damage) str += `<font color="#9b9b9b">`
		str += `④：${get.poptip("tiance_yzs_4")}`;
		if (last == "damage" || player.storage.tiance_yzs_damage) str += `</font>`
		return str;
	},
	mengmengjiugui_yzs(player) {
		let str = `锁定技：你使用【酒】无次数限制。你已损体力值与对应项序数相等时，你的【酒】效果改为对应项描述：<br>`;
		const num = player.maxHp - player.hp;
		if (num==1) str += `<span class="bluetext">`
		str += `①：恢复1点体力；<br>`
		if (num == 1) str += `</span>`
		if (num == 2) str += `<span class="bluetext">`
		str += `②：本阶段使用下张【杀】无次数限制；<br>`
		if (num == 2) str += `</span>`
		if (num == 3) str += `<span class="bluetext">`
		str += `③：恢复1点体力；<br>`
		if (num == 3) str += `</span>`
		if (num == 4) str += `<span class="bluetext">`
		str += `④：将场上任意手牌当做【酒】使用。<br>`
		if (num == 4) str += `</span>`
		str += `出牌阶段若你未醉酒，你不可使用【杀】。`
		return str;
	},
	qiancaogangmu_yzs(player) {
		let str = `出牌阶段开始时，你选择并获得其中一项：<br>`;
		if (player.hasSkill("qiancaogangmu_yzs_effect1")) str += `<span class="bluetext">`
		str += `①：本阶段你造成伤害+1直至你致角色濒死；<br>`
		if (player.hasSkill("qiancaogangmu_yzs_effect1")) str += `</span>`
		if (player.hasSkill("qiancaogangmu_yzs_effect2")) str += `<span class="bluetext">`
		str += `②：本阶段其他角色不可使用【桃】直至你致角色死亡。`
		if (player.hasSkill("qiancaogangmu_yzs_effect2")) str += `</span>`
		return str;
	},
	HuanMeng_yzs(player) {
		let str = `锁定技：回合开始时你投掷1枚骰子，然后获得序数与投掷结果相等的项效果，若已获得则改为失去：<br>`;
		if (player.hasSkill("HuanMeng1_yzs")) str +=`<span class="bluetext">`
		str += `①： ${get.poptip("sing_yzs")}1：重复3次： ${get.poptip("throw_yzs")}5：你摸1张牌；<br>`
		if (player.hasSkill("HuanMeng1_yzs")) str += `</span>`
		if (player.hasSkill("HuanMeng2_yzs")) str += `<span class="bluetext">`
		str += `②：吟唱1：投掷3：你恢复1点体力；<br>`
		if (player.hasSkill("HuanMeng2_yzs")) str += `</span>`
		if (player.hasSkill("HuanMeng3_yzs")) str += `<span class="bluetext">`
		str += `③：吟唱1：投掷2：你视为使用无距离限制的普通【杀】；<br>`
		if (player.hasSkill("HuanMeng3_yzs")) str += `</span>`
		if (player.hasSkill("HuanMeng4_yzs")) str += `<span class="bluetext">`
		str += `④：吟唱1：投掷5：你依次视为使用【过河拆桥】和【顺手牵羊】；<br>`
		if (player.hasSkill("HuanMeng4_yzs")) str += `</span>`
		if (player.hasSkill("HuanMeng5_yzs")) str += `<span class="bluetext">`
		str += `⑤：吟唱1：投掷4：你视为使用【无中生有】或【决斗】；<br>`
		if (player.hasSkill("HuanMeng5_yzs")) str += `</span>`
		if (player.hasSkill("HuanMeng6_yzs")) str += `<span class="bluetext">`
		str += `⑥：你额定回合结束后执行额外回合。<br>`
		if (player.hasSkill("HuanMeng6_yzs")) str += `</span>`
		str += `投掷X：投掷1枚骰子,若结果≥X，则投掷成功,发动后续效果。你成为牌的目标时，可弃1张手牌然后投掷4：无效之。`
		return str;
	},
	wanhua_mirror_yzs(player) {
		if (!player.storage.wanhua_mirror_yzs_change) return `转换技：回合开始时：<span class="bluetext">阴：你摸2张牌，然后将1张手牌置底或暗置于人物牌上称为【愿】；</span><br>阳：你摸1张牌，然后将2张手牌置底。`
		return `转换技：回合开始时：阴：你摸2张牌，然后将1张手牌置底或暗置于人物牌上称为【愿】；<span class="bluetext"><br>阳：你摸1张牌，然后将2张手牌置底。</span>`
	},
	dapanxiaopan_yzs(player) {
		let str = `${get.poptip("FukaSkill_yzs")}：转换技：场上角色受到伤害时：`;
		if (!player.storage.dapanxiaopan_yzs) str += `<span class="bluetext">①：失去1点体力，令伤害+1；</span>②摸2张牌，令伤害-1。`
		else str += `①：失去1点体力，令伤害+1；<span class="bluetext">②摸2张牌，令伤害-1。</span>`
		return str;
	},
	perfectFreeze_yzs(player) {
		let str = `锁定技：出牌阶段限1次或符卡：你与1名其他角色拼点，胜者将牌堆顶牌明置于人物牌旁称为${get.poptip("perfectFreeze_yzs_buff")}，然后发动转换技：`;
		if (!player.storage.perfectFreeze_yzs) str += `<span class="bluetext">①摸1张牌；</span>②弃1张牌。`
		else str += `①摸1张牌；<span class="bluetext">②弃1张牌。</span>`
		str += `（所有角色共享此转换技状态）`;
		return str;
	},
	tuiyidele_yzs(player) {
		let str = `锁定技：你的摸、弃牌阶段改为发动${get.poptip("breaktime_yzs")}。其他角色回合开始时/弃牌阶段结束时，若其手牌数＝你，你可令其判定/结束阶段改为发动【休息时间】：`;
		if (!player.storage.tuiyidele_yzs) str += `<span class="bluetext">①摸2张牌；</span>②弃2张牌。`
		else str += `①摸2张牌；<span class="bluetext">②弃2张牌。</span>`
		return str;
	},
	yotouXi_yzs(player) {
		let str = `${get.poptip("zhuanlunji_yzs")}：你于自轮次内每使用3张牌后：（转轮限1次。回合开始时重置本技能）`;
		str += `<br>`;
		if (player.storage.yotouXi_yzs == 1 || player.storage.yotouXi_yzs == 5) str +=`<font color="#b9b5ff">①：弃2张牌并摸3张牌。你的下回合开始时你可获得所弃牌其中一张。</font>`
		else str += `①：弃2张牌并摸3张牌。你的下回合开始时你可获得所弃牌其中一张。`
		str += `<br>`;
		if (player.storage.yotouXi_yzs == 2 || player.storage.yotouXi_yzs == 6) str += `<font color="#b9b5ff">②：将牌堆顶牌当作${get.poptip("yotou_yzs")}置入你武器栏，然后你令【妖刀·心渡】中1项数值本局游戏内+1。</font>`
		else str += `②：将牌堆顶牌当作${get.poptip("yotou_yzs")}置入你武器栏，然后你令【妖刀·心渡】中1项数值本局游戏内+1。`
		str += `<br>`;
		if (player.storage.yotouXi_yzs == 3 || player.storage.yotouXi_yzs == 7) str += `<font color="#b9b5ff">③：弃1~4张牌，本自轮次内你使用下张【卷】伤害+等量-1。</font>`
		else str += `③：弃1~4张牌，本自轮次内你使用下张【杀】伤害+等量-1。`
		str += `<br>`;
		if (player.storage.yotouXi_yzs == 4 || player.storage.yotouXi_yzs >= 8) str += `<font color="#b9b5ff">④：恢复1点体力，然后你令【妖刀·心渡】中2项不同数值本自轮次内+1。。</font>`
		else str += `④：恢复1点体力，然后你令【妖刀·心渡】中2项不同数值本自轮次内+1。`
		str += `<br>`;
		str += `锁定技：【妖刀·心渡】不可被其他角色影响或装备。`;
		return str;
    },
	Gungnell_yzs(player) {
		let skill = player.storage.Gungnell_yzs || [];
		if (!skill.length) return `${get.poptip("Fuka_yzs")}：你视为使用无距离限制的伤害为-1，需-1张【闪】响应的普通【杀】，然后令本自轮次上述1个数字+1。`
        let num = skill ? skill - 1 : 0
		let str = `${get.poptip("Fuka_yzs")}：你视为使用无距离限制的伤害为`
		str += '<span class="bluetext">' + skill[0] + "</span>"
		str += "，需";
		str += '<span class="bluetext">' + skill[1] + "</span>";
		str +="张【闪】响应的普通【杀】，然后令本自轮次上述1个数字+1。"
        return str
	},
	qianmian_yzs(player) {
		let prompt = "";
		if (player.storage.qianmian_yzs?.current2)prompt = get.skillInfoTranslation(player.storage.qianmian_yzs.current2, player)
		let str=`锁定技：`
		if (prompt) str += '<span class="bluetext">' + prompt+"</span>";
		str +=`回合开始时你从人物牌堆中检索1张拥有通常技的人物牌，然后你选择1项该人物的通常技描述替换本技能蓝字描述。`
		return str
	},
	finances_yzs(player) {
		let str = `本技能和${get.poptip("Mischance_Scatter_yzs")}投掷要求`
		if (!player.storage.finances_yzs) str += "-2。"
		else str += "+2。"
		str += `准备阶段，若你手牌数＜体力值，${get.poptip("throw_yzs")}4：摸2张牌；否则失去1点体力。<br>
		结束阶段，你投掷4：视为使用任意非伤害非延时锦囊牌，或制作1枚${get.poptip("Totem_yzs")}。`
        return str
	},
	langhua_yzs(player) {
		let str = `转换技：回合开始时你可：`;
		if (!player.storage.langhua_yzs) str += `<span class="bluetext">①摸3张牌并弃1张牌，进入${get.poptip("yaren_yzs")}形态至下回合开始。</span>②摸1张牌并弃3张牌，进入${get.poptip("kuanglang_yzs")}形态至下回合开始，`
		else str += `①摸3张牌并弃1张牌，进入${get.poptip("yaren_yzs")}形态至下回合开始。<span class="bluetext">②摸1张牌并弃3张牌，进入${get.poptip("kuanglang_yzs")}形态至下回合开始，</span>`
		str += `期间你使用与你依此法所弃牌花色相同的牌无次数限制。`;
		return str;
	},
	fanhundie_yzs(player) {
		let str = `转换技：场上角色进入濒死时，若其体力值为唯一最低，你可：`;
		if (!player.storage.fanhundie_yzs) str += `<span class="bluetext">①令其恢复1点体力</span>②对其造成1点伤害。`
		else str += `①令其恢复1点体力<span class="bluetext">②对其造成1点伤害。</span>`;
		str += `${get.poptip("FukaSkill_yzs")}： ${get.poptip("wuyongchang_yzs")}：你与1名与你体力值之差等于1的角色交换体力值。`;
		return str;
	}
};

export default dynamicTranslates;
