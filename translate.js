import { lib, game, ui, get, ai, _status } from "../../noname.js";
const translates = {
    SCHyzs: "一中杀",
    normalPack_yzs: "标准包",
    stormPack_yzs: "纳罕风暴",
	otherworldPack_yzs: "异界七罪",
	touhouPack_yzs: "东方策异闻",
	reverse1999Pack_yzs: "重返未来",
	SCPPack_yzs:`SCP`,
	BOSSPack_yzs: "BOSS包",
	SpecialPack_yzs:`彩蛋`,
	Enrico_Pucci_yzs: "恩里克 普奇",
	YouBeier_yzs: "尤贝尔",
	LU_Captain_xiangsiniao_yzs: "向思鸟",
	HuangJOJO_yzs: "建军",
	JiLiangJiTao_yzs: "吉良 吉涛",
	shenChangzhang_yzs: "厂长",
	shenfu_Limu_yzs: "李木",
	WZZS_lilixin_yzs: "李励薪",
	changzhang_yzs: "熊伯",
	jealous_witch_yzs: "W",
	lianhua_yzs: "莲华",
	hunziKing_yzs: "余东阳",
	wuyingYFY_yzs: "翼飞羽",
	Cana_yzs: "迦南",
	Lazy_twins_yzs: "冬&祺",
	Remilia_Scarlet_yzs: "蕾米莉亚",
	chenxu_yzs: "嗔嘘",
	AngryFeng_yzs: "冯 克洛文凭",
	Unbelieve_xiangzi_yzs: "翔子",
	yagamiLight_yzs: "夜神月",
	Halo_yzs: "璐璐杨 哈洛",
	Noir_yzs: "诺艾尔",
	lianjinzhencai_yzs: "馏蒸材",
	weaponmaster_yzs: "车杳",
	SukunaShinmyoumaru_yzs: "少名 针妙丸",
	Cirno_yzs: "琪露诺",
	FireStorm: "火风暴",
	ThunderStorm: "雷风暴",
	WaterStorm: "水风暴",
	IceStorm: "冰风暴",
	BulletStorm: "枪弹风暴",
	WindStorm: "凪风暴",
	_yzsSummonStorm: "召引风暴",
	Patchouli_Knowledge_yzs: "帕秋莉",
	Yorigami_twins_yzs: "女苑&紫苑",
	FinancialStorm: "金融风暴",
	Ibuki_Suika_yzs: "伊吹 萃香",
	Zbro_yzs: "Z哥",
	toothFairy_yzs: "牙仙",
	RatTiger_yzs: "娜兹玲&寅丸星",
	Floris_yzs: "芙洛玛西斯",
	ChainsawCock_yzs: "鲁日立",
	Chino_yzs: "琪诺",
	Seele_Vollerei_yzs: "希儿",
	Qianmian_Limu_yzs: "李暮",
	Fern_yzs: "菲伦",
	Marisa_yzs: "雾雨 魔理沙",
	Tenshi_yzs: "比那名居 天子",
	Onozuka_Komachi_yzs: "小野塚 小町",
	NatsukiSubaru_yzs: "菜月昴",
	EastYang_yzs: "伊斯特 阳",
	Denglanxitaro_yzs: "邓懒 夕太郎",
	Zhonghuang_yzs: "钟皇",
	Xiangbolin_yzs: "香波霖",
	PhantomEnsemble_yzs:"骚灵三姐妹",
	cunhe_yzs: "远舟村贺",
	Yuyuko_yzs: "西行寺 幽幽子",
	tangjiheChao_yzs: "涂 唐吉诃超",
	LilyWhite_yzs: "莉莉霍瓦特",
	AdmiredWitch_yzs: "爱诺琪丝",
	IceGirl_yzs: "钟仪宣",
	Innocent_xiangzi_yzs: "翔子",
	TimeThief_yzs: "盘面塑造者",
	Patriot_yzs: "博卓卡斯替",
	DreamWitch_yzs: "肖",
	DimensionWitch_yzs: "许如荧",
	SixSoulsFlowey_yzs: `<span class="yzs_xuancai">六魂花</span>`,
	FailedFlowey_yzs: "小花",
	QiGongMaster_yzs: "鹤元海",
	yinBochen_yzs: "殷Bo琛",
	Akyuu_yzs: "稗田阿求",
	APPLe_yzs: "APPLe",
	LegolaShuang_yzs: "莱戈拉爽",
	Aura_yzs: "阿乌拉",
	Marcus_yzs: "马库斯",
	Reze_yzs: "蕾赛",
	Cayuu_yzs:"加羽",
	Ren_yzs: "刃",
	Linie_yzs: "莉涅",
	Alastor_yzs: "阿拉斯托",
	jianSheng_yzs: "李砺心",
	RenEmperor_yzs: "瑞辰",
	TimeGuard_yzs: "咲延",
	LoverW_yzs: "W²",
	Frieren_yzs: "芙莉莲",
	Himmel_yzs: "辛美尔",
	Youmu_yzs: `魂魄妖梦`,
	Frisk_yzs: `福里斯克`,
	ChengGuixiang_yzs: `成鬼香`,
	OnionMan_yzs:`任瑞`,
	OnionMan_yzs2: `任瑞`,
	Byakuren_yzs: `圣白莲`,
	Okina_yzs: `摩多罗 隐歧奈`,
	Yan_yzs: `阳 比斯莫克`,
	Riko_yzs: `莉可`,
	Reg_yzs: `雷古`,
	Mamizou_yzs: `二岩猯藏`,
	SmokeStorm: `烟风暴`,
	AomanSzy_yzs: `颂终弈`,
	SCP096_yzs: `羞涩的人`,
	SCP173_yzs: `雕像`,
	SCP079_yzs: `旧AI`,
	SCP049_yzs: `疫医`,
	SCP106_yzs: `老人`,
	LightCB_yzs: `轻度收容失效`,
	LiTong_yzs: `黎瞳`,
	BoFengShuiKun_yzs: `波风水坤`,
	DarkKnight_yzs: `车肢解`,
	Nanachi_yzs: `娜娜奇`,
	FengCthulhu_yzs: `冯 吉苏克`,
	tentacle_yzs: `深渊之触`,
	Keiki_yzs: `埴安神袿姬`,
	Yugi_yzs: `星熊勇仪`,
	Reimu_yzs: `博丽灵梦`,
	Reimu_yzs_Barrier_yzs: `结界`,
	Reimu_yzs_subBarrier_yzs: `子结界`,
	WaiJiaoDaChen_yzs: `车杳`,
	Mokou_yzs: `藤原妹红`,
	DoremySweet_yzs: `哆来咪 苏伊特`,
	Reisen_yzs: `铃仙`,
	BaiLu_yzs: `白露`,
	DaZuo_yzs: `鲁日立`,
	ChenJiahao_yzs: `陈家豪`,
	ChenDao_yzs: `陈刀`,
	Stark_yzs: `休塔尔克`,
	BDCheTianke_yzs: `车天可`,
	BDXiangSiniao_yzs: `向思尼奥`,
	VanXiongFeng_yzs: `范熊封次郎`,
	HaiWeier_yzs: `海威尔`,
	VanXiongYong_yzs: `范熊勇太郎`,
	YanLaFeng_yzs: `言辣奉`,
	Serie_yzs: `赛丽艾`,
	Macht_yzs: `马哈特`,
	LeiChenjing_yzs: `雷辰静`,
	FoolSeele_Vollerei_yzs: `希儿`,
	LilyCommie_yzs: `莉莉 康米`,
	SCP939_yzs: `千喉之兽`,
	DomenicoPucci_yzs: `多明尼克 普奇`,
	ReiujiUtsuho_yzs: `灵乌路 空`,
	Rafau_yzs: `拉法尔`,
	Getian_yzs: `葛天`,
	chenyuStorm: `谶语风暴`,
	KinMiho_yzs: `坷垃金 米霍`,
	KaalaBaauna_yzs: `伽菈波那`,
	Arlecchino_yzs: `阿蕾奇诺`,
	MegumiSukuna_yzs: `宿傩(伏黑惠)`,
	Makora_yzs:`魔虚罗`,
	RyomenSukuna_yzs: `两面宿傩`,
	GojoSatoru_yzs: `五条悟`,

    // 技能台词

	// 技能

	speedup_yzs: "加速",
	speedup_yzs_info: "你的额定回合结束后，你连续执行X个额外回合。你的额定回合开始时，令X+1。（X初始为0）",
	create_newworld_yzs: "创新世",
	create_newworld_yzs_info: "你的手牌上限和攻击范围+Y(游戏轮次数)。",

	wangzhan_yzs: "妄斩",
	wangzhan_yzs_info: "出牌阶段限1次：你调整手牌数至5-X，然后可对1名距离1的角色造成X点伤害。（X为本局你不因此造成或受到的最大伤害值-1，至少为0）",
	suixin_yzs: "随心",
	suixin_yzs_info: "锁定技：每回合每项各限1次：你摸牌、弃置牌、或使用牌指定目标时，可将对应数值改为本局你此数值的最大值。（单次摸牌数、单次弃牌数、目标数上限）",

	jiangli_yzs: "奖励",
	jiangli_yzs_info: "锁定技：回合开始时，你可跳过本回合任意个你的上回合未依此法跳过的阶段，然后你亮出并无距离限制地使用牌堆顶X张牌（X为本次跳过阶段数）。然后若X≥3，你可弃置场上1张牌；若X≤3，你恢复1点体力。",
	jiangli_Discard_yzs: "奖励弃牌",
	jiangli_Discard_yzs_info: "出牌阶段限1次：你弃置场上1张牌。",

	nengliyoudaxiao_yzs: "能力有大小",
	nengliyoudaxiao_yzs_info: "出牌阶段限1次：你与1名其他角色拼点，败者本阶段红色手牌视为普通【杀】，胜者摸1张牌。",
	nengliyoudaxiao_yzs_effect: "能力有大小效果",
	nengliyoudaxiao_yzs_effect_info: "本阶段红色手牌视为普通【杀】",
	huangjinzhixing_yzs: "黄金之星",
	huangjinzhixing_yzs_info: "锁定技：出牌阶段结束时，你可弃1张手牌，然后若之点数＞你上次依此法所弃牌点数，你于本阶段结束后摸2张牌并执行出牌阶段。你的黑色【杀】视为【闪】。",

	first_bomb_yzs: "第一炸弹",
	first_bomb_yzs_info: `每回合每名角色使用首张手牌时你可判定，若判定牌与其使用牌花色相同，你对其造成1点伤害。<br>
    出牌阶段你可扣置任意张手牌称为“弹”，上限为3。<br>你的判定牌生效前，你可用1张“弹”代替之。`,
	BitetheDust_yzs: "败者食尘",
	BitetheDust_yzs_info: `觉醒技：若你不处于“命运”：你进入濒死时可回复<span class="bluetext">2</span>点体力并摸<span class="bluetext">4</span>张牌；其他角色进入濒死时，
	你可调整你与其体力值至<span class="bluetext">2</span>，然后你与其摸<span class="bluetext">4</span>张牌并进入“命运”：<span class="bluetext">2</span>公轮内若你死亡，改为你恢复全部体力、你与其退出“命运”并摸<span class="bluetext">4</span>张牌；若否，其死亡，你与其退出“命运”。<br>
	发动本技能后上述数字减半，发动2次后你失去本技能并觉醒：你下一回合开始时获得${get.poptip("normal_life_yzs")}。`,
	BitetheDust_awaken_yzs: "败者食尘觉醒",
	BitetheDust_awaken_yzs_info: `觉醒：你下一回合开始时获得${get.poptip("normal_life_yzs")}。`,
	normal_life_yzs: "平凡生活",
	normal_life_yzs_info: "锁定技：你造成伤害+1。<br>受到伤害时，你可移去1张【弹】以令之-1。<br>出牌阶段限1次：你可用手牌替换【弹】。",

	tudao_yzs: "屠刀",
	tudao_yzs_info: "锁定技：你的【杀】伤害+1。你造成伤害时，你可防止之，并摸等量张牌，然后可将至多等量张手牌扣置为【刀】。（【刀】上限＝你体力上限）",
	tuzai_yzs: "屠宰",
	tuzai_yzs_backup:"屠宰",
	tuzai_yzs_info: "锁定技：出牌阶段各限1次：①：将1张【刀】当做无次数、距离限制的普通【杀】使用；<br>②：获得至少2张【刀】，然后本阶段你造成伤害后增加1点体力上限并回复1点体力。",

	yifuzhiming_yzs: "以父之名",
	yifuzhiming_yzs_info: `锁定技：准备阶段，你可摸1张牌并展示之，然后可重复本操作直至展示黑桃牌或依此法获得3张牌：若为前者，你跳过本回合额定出牌阶段；若为后者，你选择并获得下列一个技能：${get.poptip("dangxian_yzs")}${get.poptip("wushuang_yzs")}${get.poptip("qiancaogangmu_yzs")}。回合结束时，若你技能数达4，你选择并失去一个技能。`,
	dangxian_yzs: "当先",
	dangxian_yzs_info: "额定摸牌阶段开始前，你可将之改为出牌阶段。",
	wushuang_yzs: "无双",
	wushuang_yzs_info: "出牌阶段限1次：你视为使用【决斗】，胜者摸1张牌。",
	qiancaogangmu_yzs: "芊草纲目",
	qiancaogangmu_yzs_info: "出牌阶段开始时，你选择并获得其中一项：<br>①：本阶段你造成伤害+1直至你致角色濒死；<br>②：本阶段其他角色不可使用【桃】直至你致角色死亡。",

	zhengli_yzs: "争利",
	zhengli_yzs_info: "你使用【顺手牵羊】无距离限制。【顺手牵羊】对你无效。出牌阶段限1次：你弃任意张牌，然后视为使用等量-1张【顺手牵羊】。",
	zhujiu_yzs: "祝酒",
	zhujiu_yzs_info: "你的手牌上限固定为4。游戏 / 回合开始时你获得3/1枚【祝酒】标记，上限为3。场上角色出牌阶段开始时或濒死时，你可移除1枚【祝酒】标记以令其视为使用【酒】。",

	yangzhu_yzs: "养猪",
	yangzhu_yzs_info: "锁定技：回合结束时若你未受伤，你可失去1点体力并摸3张牌。<br>场上角色受到伤害时，你可扣除1点体力上限然后无效之。<br>你的已损体力值变动后，你可弃置场上1张牌。",
	lastclass_yzs: "最后一课",
	lastclass_yzs_info: "限定技：其他角色即将死亡时，你可令其调整体力值至1且体力值不可下降至其下回合开始。你即将死亡时，你恢复全部体力。",
	lastclass_effect_yzs: "厂长的庇护",
	lastclass_effect_yzs_info: "体力值不可下降至下回合开始",

	love_circle_yzs: "恋爱循环",
	bingai_yzs: "【病爱】",
	bingai_yzs_info:`【病爱】：持有者回合开始时摸1张牌。<br>与任意角色持有【病爱】数最相近且小于其的【病爱】持者称为其【爱慕对象】,其【爱慕对象】的【爱慕对象】称为其【嫉妒对象】。（持有【病爱】数与另一角色相同的角色视为未持有【病爱】）其他角色对其【爱慕对象】造成伤害无效。场上角色对其【嫉妒对象】造成伤害+1。`,
	love_circle_yzs_info: `锁定技：出牌阶段结束时，你展示全部手牌，然后将其中任意张红色牌明置于任意名其他角色的角色牌旁，称为${get.poptip("bingai_yzs")}。你视为拥有最多的【病爱】。每名角色至多持有4张【病爱】。`,
	fantasy_train_yzs: "妄想特快",
	aimuduixiang_yzs: "【爱慕对象】",
	aimuduixiang_yzs_info: `与你持有【病爱】数最相近且小于你的【病爱】持者称为你的【爱慕对象】`,
	jiduduixiang_yzs: "【嫉妒对象】",
	jiduduixiang_yzs_info:`你【爱慕对象】的【爱慕对象】称为你的【嫉妒对象】`,
	fantasy_train_yzs_info: `锁定技：回合开始时，你可获得场上至多X张【病爱】。（X为【病爱】持有者数） 你可将黑色牌当做【闪】打出。你受到你${get.poptip("aimuduixiang_yzs")}造成的伤害时，可弃1张牌然后转移给其。你对你${get.poptip("jiduduixiang_yzs")}使用【杀】无距离限制且不可响应。`,

	tears_yzs: "淚",
	tears_yzs_info: "每自轮次限3次：你需使用或打出基本牌时，你可观看牌堆底2张牌，然后可将其中一张基本牌当做之使用或打出。你受到或造成伤害时可将牌堆底牌置顶。",
	wanhua_mirror_yzs:"万华镜",
	wanhua_mirror_yzs_info: `转换技：回合开始时：<span class="bluetext">阴：你摸2张牌，然后将1张手牌置底或暗置于人物牌上称为【愿】；</span><br>阳：你摸1张牌，然后将2张手牌置底。`,
	gathering_hopes_yzs:"集聚之愿",
	gathering_hopes_yzs_info: "觉醒技：你对其他角色使用【桃】后将牌堆顶牌加入【愿】，达4张时你扣除1点体力上限并令场上角色依次获得1点护甲然后觉醒：有【愿】时你获得之；你使用红色牌无次数限制。",
	gathering_hopes_awaken_yzs: "集聚之愿觉醒",
	gathering_hopes_awaken_yzs_info: `你扣除1点体力上限并令场上角色依次获得1点护甲`,

	copywork_yzs: "抄作业",
	copywork_yzs_info:`锁定技：你仅可使用或打出与上张进入弃牌堆的牌同花色的手牌，且此牌牌名视为与之相同，因此转化的伤害牌视为【桃】。你使用【桃】无咏唱且目标改为任意角色。`,
	drawfish_yzs: "摸鱼",
	drawfish_yzs_info: `每自轮次限1次：${get.poptip("wuyongchang_yzs")}：你摸4张牌，然后调整手牌数至4。你失去最后的手牌后刷新本技能。`,

	wuying_yzs: "无影",
	wuying_yzs_info: `锁定技：弃牌阶段，你可改为弃2张牌。你满足任意项时可倒置人物牌，然后进入${get.poptip("hidden_yzs")}：①致其他角色濒死后；②回合开始时跳过本回合出牌阶段。`,
	shadowattack_yzs: "暗袭",
	shadowattack_yzs_info: `锁定技：其他角色的回合结束时若你处于【隐匿】，你可退出之并摸1张牌，然后你于其后置位执行出牌阶段，此阶段你使用【杀】无次数限制且你的牌仅可指定其或自己为目标。
	（若为你上家的上家的额定回合，你必须发动本技能）`,
	shadowattack_yzs_effect: "暗袭",
	shadowattack_yzs_effect_info:"此阶段你使用【杀】无次数限制且你的牌仅可指定你上家或自己为目标。",
	kill_yzs: "斩杀",
	kill_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你对1名其他角色造成1点伤害。你致其他人物死亡后重获本技能。`,
	toutianhuanri_yzs: "偷天换日",
	toutianhuanri_yzs_info: `限定技：无咏唱：（若当前为你回合，结束本回合然后）你移动至前两次执行出牌阶段所处座次之一并进入【隐匿】。你致其他角色濒死后重获本技能。`,

	hidden_yzs: "隐匿",
	hidden_yzs_info:"你不可被牌或技能指定。",

	blessing_yzs: "祈福",
	blessing_yzs_info: `锁定技：你的【杀】造成伤害后目标获得1枚${get.poptip("blessing_yzs_fu_yzs")}标记。
    每自轮次限1次：${get.poptip("wuyongchang_yzs")}：你令你至多2项吟唱-1。`,
	blessing_yzs_fu_yzs: "【福】",
	blessing_yzs_fu_yzs_info: `【福】持有者回合开始时全部移除之并恢复等量点体力，然后你可令你1项${get.poptip("sing_yzs_count")}-1（每自轮次每项吟唱限1次）。`,
	HolyBlessing_yzs: "圣佑",
	HolyBlessing_yzs_info:`锁定技：你无摸牌阶段。回合开始时你弃全部手牌。<br>
    ${get.poptip("sing_yzs")}1：你调整手牌数至4。<br>
    吟唱1：你调整护甲值至1。<br>
    吟唱1（准备阶段不计算此吟唱） ：你视为使用普通【杀】。<br>
    吟唱4：你进入${get.poptip("wushen_yzs")}状态至你下回合开始。`,
	HolyBlessing_yzs_draw: "圣佑(摸牌)",
	HolyBlessing_yzs_hujia: "圣佑(护甲)",
	HolyBlessing_yzs_sha: "圣佑(出杀)",
	HolyBlessing_yzs_wushen: "圣佑(武神)",
	HolyBlessing_yzs_wushen_info: `你计算与其他角色距离-1；你的【杀】伤害+1。`,
	wushen_yzs: "武神",
	wushen_yzs_info: `你计算与其他角色距离-1；你的【杀】伤害+1。`,

	HuanMeng_yzs: "幻梦",
	HuanMeng1_yzs: "幻梦(摸牌)",
	HuanMeng2_yzs: "幻梦(回血)",
	HuanMeng3_yzs: "幻梦(出杀)",
	HuanMeng4_yzs: "幻梦(拆牌)",
	HuanMeng5_yzs: "幻梦(伤害)",
	HuanMeng6_yzs: "幻梦(回合)",
	HuanMeng_yzs_info:`锁定技：回合开始时你投掷1枚骰子，然后获得序数与投掷结果相等的项效果，若已获得则改为失去：<br>
①： ${get.poptip("sing_yzs")}1：重复3次： ${get.poptip("throw_yzs")}5：你摸1张牌；<br>
②：吟唱1：投掷3：你恢复1点体力；<br>
③：吟唱1：投掷2：你视为使用无距离限制的普通【杀】；<br>
④：吟唱1：投掷5：你依次视为使用【过河拆桥】和【顺手牵羊】；<br>
⑤：吟唱1：投掷4：你视为使用【无中生有】或【决斗】；<br>
⑥：你额定回合结束后执行额外回合。<br>
投掷X：投掷1枚骰子,若结果≥X，则投掷成功,发动后续效果。
    你成为牌的目标时，可弃1张手牌然后投掷4：无效之。`,
	DreamTwins_yzs: "崎梦双星",
	DreamTwins_yzs_info: `觉醒技：你投出所有投掷结果后，恢复1点体力并觉醒：此后【幻梦】项效果将额外发动1次。<br>
	出牌阶段，你可弃1张红色手牌，然后投掷5：分配1点伤害。`,
	DreamTwins_yzs_awaken: "崎梦双星觉醒",

	liuwangnvshiqu_yzs: "六王女逝曲",
	liuwangnvshiqu_yzs_info: `锁定技：出牌阶段开始时，你可失去1~5点体力，然后摸等量张牌并获得等量张 ${get.poptip("Fuka_yzs")}。若失去体力≥4点，本阶段你使用【杀】造成伤害+1。<br>
    你的【杀】造成非零伤害时你恢复1点体力。<br>你使用符卡时， ${get.poptip("throw_yzs")}5：你获得1张符卡。`,
	jiashang_yzs:"加伤",
	Gungnell_yzs: "冈戈尼尔",
	Gungnell_yzs_info: `${get.poptip("FukaSkill_yzs")}：你视为使用无距离限制的伤害为<span class="bluetext">-1</span>，需<span class="bluetext">-1</span>张【闪】响应的普通【杀】，然后令本自轮次上述1个数字+1。`,
	VampireKiss_yzs: "吸血鬼之吻",
	VampireKiss_yzs_info: `符卡：与1名手牌数小于你的角色交换手牌，然后你可令其失去1点体力并令你恢复1点体力。`,

	angryXU_yzs: "怒鲛",
	angryXU_yzs_info: `锁定技：你的【杀】视为${get.poptip("spear_yzs")}。你不可成为【过河拆桥】的目标。你可将黑色手牌当做【过河拆桥】使用。`,
	sheshen_yzs: "舍身",
	sheshen_yzs_info: `其他角色受到伤害时，若伤害来源不为你，你可无效之并受到伤害来源造成的等量+1点伤害。若如此做，本回合结束时你恢复1点体力`,
	undyinghero_yzs: "不灭英雄",
	undyinghero_yzs_info: `觉醒技：你受到伤害后获得等量点【决心】，上限为9。你摸牌数+X/2（X为【决心】数，向上取整）。<br>
    你濒死时，若【决心】已达上限，恢复全部体力并获得9点护甲，然后觉醒：你受到非零伤害+1、你的【闪】视为【矛】、你回合开始时扣减1点体力上限。`,
	undyinghero_yzs_awaken: "不灭英雄",

	brokenheart_yzs: "残心",
	brokenheart_yzs_info: `弃牌阶段你可改为弃任意张基本牌并摸等量张牌。<br>${get.poptip("sing_yzs")}4：失去【残心】或失去1点体力并令本吟唱变为1。`,
	yotouFeng_yzs: "妖刀·封",
	yotouFeng_yzs_info: `锁定技：其他角色受到你造成的伤害时摸牌至手牌数为6，然后其获得X枚${get.poptip("yuan_yzs")}标记并令此伤害-X（X为因此摸牌数）。`,
	yuan_yzs: "【怨】",
	yuan_yzs_info:`拥有者回合开始时依次移除自己所有【怨】标记，然后弃置X张牌，不足的部分失去体力代替(X为移除的标记数)。`,
	yotouXi_yzs: "妖刀·袭",
	yotouXi_yzs_info: `${get.poptip("zhuanlunji_yzs")}：你于自轮次内每使用3张牌后：（转轮限1次。回合开始时重置本技能）<br>
<font color="#b9b5ff">①：弃2张牌并摸3张牌。你的下回合开始时你可获得所弃牌其中一张。<br></font>
②：将牌堆顶牌当作${get.poptip("yotou_yzs")}置入你武器栏，然后你令【妖刀·心渡】中1项数值本局游戏内+1。<br>
③：弃1~4张牌，本自轮内你使用下张【杀】伤害+等量-1。<br>
④：恢复1点体力，然后你令【妖刀·心渡】中2项不同数值本自轮次内+1。<br>
     锁定技：【妖刀·心渡】不可被其他角色影响或装备。`,
	yotou_yzs_skill_wusheng: "妖刀·心渡",

	brokenweapon_yzs: "破碎枪刃",
	brokenweapon_yzs_info: `锁定技：你视为装备${get.poptip("XZgun_yzs")}和${get.poptip("XZblade_yzs")}。`,
	XZblade_yzs_skill:"折断之刃",
	Unbelieve_yzs: "不信",
	Unbelieve_yzs_info:`锁定技：你手牌上限固定为4。游戏开始时你摸2张牌。你的手牌不可被弃置或获得。摸牌阶段你改为弃全部手牌。`,
	judgeEyes_yzs: "审判之眼",
	judgeEyes_yzs_info: `锁定技：每自轮次限4次：你失去最后的手牌时摸6张牌，然后执行${get.poptip("judge_yzs")}。<br>弃牌阶段结束时你摸X张牌。（X为你本回合执行【审判】次数）<br>
    其他角色的【审判点数】≥8时，移除其所有【审判点数】，然后本回合你的【杀】对其造成伤害+1。`,
	judge_yzs: "审判",
	judge_yzs_info:`你指定1名其他角色，然后展示其所有手牌。其获得其手牌黑色花色数+1点【审判点数】。`,
	judgeEyes_yzs_adddamage: "被审判",

	zhitui_yzs: "质推",
	zhitui_yzs_info: `出牌阶段限1次：你展示1名其他角色的手牌，然后弃置其中的${get.poptip("DeathNote_yzs")}或失去1点体力。出牌阶段结束时，你分配1张手牌。`,
	kila_yzs: "基拉",
	kila_yzs_info: `锁定技：其他角色拥有${get.poptip("zhitui_yzs")}。你【质推】中的“${get.poptip("DeathNote_yzs")}”改为“一张牌”。每公轮开始时你获得【死亡笔记】，然后你弃置1张手牌。你使用【死亡笔记】目标角色多失去2点体力。 `,
	juece_yzs: "谲策",
	juece_yzs_info:`你不因此失去手牌后可摸X张牌，并分配或置底1张手牌，然后若你手牌数或X>体力上限，本回合本技能失效。（X为本技能本回合发动次数且包括本次）`,
	xinsega_yzs: "新世界",
	xinsega_yzs_dn:"新世界",
	xinsega_yzs_info: `使命技：失败：你即将死亡时：你扣除一半体力上限并恢复全部体力，此后每公轮结束时你视为使用【死亡笔记】。`,
	zhitui_yzs_global: "质推",

	animal_yzs: "动物牌",
	animal_yzs_info: `精灵公主的专属牌，只有精灵公主可以使用，游戏中共三张，分别是${get.poptip("maotouying_yzs")}、${get.poptip("pomochong_yzs")}、${get.poptip("shengbaihu_yzs")}`,
	princetwittering_yzs: "公主的呢喃",
	princetwittering_yzs_info: `锁定技：回合开始时你获得1张${get.poptip("animal_yzs")}。<br>出牌阶段限1次：你弃2张手牌或失去1点体力，然后你获得1张动物牌。<br>
    动物牌进入手牌时你可扣置1张手牌，你可如手牌般使用或打出所扣置的牌。<br>你的出牌阶段结束时，场上角色调整手牌数至其本阶段开始时值。`,
	pomochong_yzs_used: "破魔虫",

	buxudong_yzs: "统统不许动",
	buxudong_yzs_info:`锁定技：你使用牌指定其他角色时，扣置目标角色与此牌花色相同的牌至其受到伤害或回合开始时(你回合内对其造成伤害不触发拿回)。<br>你每种花色的【杀】分别独立计算出【杀】数。你对有手牌的角色造成伤害-1。`,
	haixiangpao_yzs: "还想跑？",
	haixiangpao_yzs_info: `锁定技：你回合内每使用一种花色的牌时摸3张牌，然后弃置或置底1张手牌。你可从牌堆底摸牌。其他角色因你而失去最后1张手牌后，你获得1枚${get.poptip("xianyiren_yzs")}标记。`,
	buxudong_yzs_effect: "不许动！",
	xianyiren_yzs: "【嫌疑人】",
	xianyiren_yzs_info:`牌即将生效前，你可移除1枚此标记，然后无效之。`,

	mysterydrug_yzs: "秘药",
	mysterydrug_yzs_info: `出牌阶段若你无【也太】，你可弃1张基本牌并令任意角色弃1张牌，然后若二者同颜色，将二者明置于你人物牌上称为【也太】且本技能本阶段失效；若否，令你或其视为使用${get.poptip("kuangchangbaozha_yzs")}。`,
	burnlife_yzs: "燃熵",
	burnlife_yzs_info:`出牌阶段或其他角色回合开始时，你可移去全部【也太】，然后选择令当前回合角色：<br>
①摸X张牌，其本回合结束阶段弃全部手牌（至多5张）；②弃全部手牌（至多5张），然后摸X张牌。（X为【也太】牌名字数之和）`,
	burnlife_yzs_buff:"燃熵",
	shikuang_yzs: "嗜狂",
	shikuang_yzs_info: `锁定技：你对自己发动【燃熵】后，你本回合出【杀】数和手牌上限翻倍，且你因之弃牌改为摸2张牌。`,
	shikuang_yzs_buff: "嗜狂",

	yinju_yzs: "隐居",
	yinju_yzs_info:`其他角色计算与你距离+1。目标不唯一的牌对你无效。`,
	badaozhan_yzs: "拔刀斩",
	badaozhan_yzs_info:`限定技：出牌阶段，你获得你的武器，然后摸1张牌并视为使用无距离限制的普通【杀】并刷新出【杀】数。`,
	wuqizhangkong_yzs:"武器掌控",
	wuqizhangkong_yzs_info: `锁定技：你不可使用与你本回合内装备过的武器攻击距离相等的武器。你发动武器技能效果后刷新${get.poptip("badaozhan_yzs")}。<br> 
	你失去武器牌时可展示之，然后弃置当前回合角色1张牌。<br>你的武器牌不计入手牌上限。武器牌不因此进入弃牌堆时，你可用任意手牌替换之。`,
	wuqizhangkong_yzs_used: "武器掌控",

	shizhongjian_yzs_skill: "石中剑",
	shengguozuzhou_yzs_skill: "圣国诅咒",

	yicunfashi_yzs: "一寸法师",
	yicunfashi_yzs_info: `锁定技：游戏开始时你获得1张符卡。弃牌阶段开始时，若你手牌数＜手牌上限，你获得等于二者差值张${get.poptip("Fuka_yzs")}。<br>
    回合开始时若你处于【巨型】状态，退出之，然后：你恢复1点体力、摸3张牌、失去全部护甲、手牌上限+3。`,
	bianda_yzs: "给我变大吧！",
	bianda_yzs_info: `${get.poptip("FukaSkill_yzs")}：失去1点体力，然后令任意角色获得2点护甲并进入${get.poptip("bianda_yzs_buff")}状态直至其进入濒死状态。`,
	bianda_yzs_buff: "巨型",
	bianda_yzs_buff_info:`不可使用手牌中的【闪】；摸牌数和进攻距离-1；退出本状态时展示全部手牌并弃置其中的【闪】。`,
	dapanxiaopan_yzs: "大判小判",
	dapanxiaopan_yzs_info:`符卡：转换技：场上角色受到伤害时：<span class="bluetext">①：失去1点体力，令伤害+1；</span>②摸2张牌，令伤害-1。`,
	jieyicunfashi_yzs: "界一寸法师",
	jieyicunfashi_yzs_info: `觉醒技：你手牌上限增加至≥15后觉醒：你对【巨型】角色使用【杀】无次数和距离限制、其他角色不可退出【巨型】。`,
	jieyicunfashi_yzs_awaken: "界一寸法师",

	perfectArithmetic_yzs: "完美算术",
	perfectArithmetic_yzs_info: `锁定技：拼点获胜后你获得1张${get.poptip("Fuka_yzs")}。你指定或成为【杀】的目标后，可摸1张牌并与对方拼点：若你胜，你令之无效或不可响应；若否，你摸2张牌，然后给予对方其中一张。<br>
    ${get.poptip("FukaSkill_yzs")}：你的拼点牌亮出前，你可令之点数视为“9”。然后若胜负结果因此改变，你摸1张牌。`,
	perfectFreeze_yzs: "完美冻结",
	perfectFreeze_yzs_info: `锁定技：出牌阶段限1次或符卡：你与1名其他角色拼点，胜者将牌堆顶牌明置于人物牌旁称为${get.poptip("perfectFreeze_yzs_buff")}，然后发动转换技：<span class="bluetext">①摸1张牌；</span>②弃1张牌。（所有角色共享此转换技状态）`,
	perfectFreeze_yzs_used: "完美冻结",
	perfectFreeze_yzs_buff: "冰晶",
	perfectFreeze_yzs_buff_info:`场上角色准备阶段开始时其获得其全部【冰晶】。然后若≥2张则其结束回合（若其为你则改为恢复1点体力）。`,

	FireStorm_skill: "火风暴",
	FireStorm_skill_info: "场上角色使用的【杀】附带火属性",
	FireStorm_instant_info: "火风暴：本自轮次你的下张【杀】伤害+1",
	ThunderStorm_skill: "雷风暴",
	ThunderStorm_skill_info: "场上角色使用的【杀】附带雷属性",
	ThunderStorm_instant_info: "雷风暴：你横置或重置1~2名角色",
	WaterStorm_skill: "水风暴",
	WaterStorm_skill_info: "场上角色回合开始时恢复1点体力",
	WaterStorm_instant_info: `水风暴：你令1名角色获得${get.poptip("WaterStorm_skill_instant_buff")}`,
	IceStorm_skill: "冰风暴",
	IceStorm_skill_info: "额定摸牌阶段移至额定弃牌阶段后",
	IceStorm_instant_info: "冰风暴：你可弃置X张手牌，然后令2名手牌数之差为X的其他角色交换手牌",
	BulletStorm_skill: "枪弹风暴",
	BulletStorm_skill_info: "场上角色回合结束时受到1点无来源伤害",
	BulletStorm_instant_info: "枪弹风暴：本自轮次你的下张【杀】无次数距离限制",
	WindStorm_skill: "凪风暴",
	WindStorm_skill_info: `场上角色视为拥有${get.poptip("WindStorm_skill_g")}`,
	WindStorm_instant_info: "凪风暴：你摸2张牌",
	FireStorm_skill_instant_buff: "火风暴加伤",
	WaterStorm_skill_instant_buff: "洗礼",
	WaterStorm_skill_instant_buff_info: `你进入濒死/回合开始时恢复2/1点体力，然后失去【洗礼】`,
	BulletStorm_skill_instant_buff: "枪弹",
	WindStorm_skill_g: "狂凪",
	WindStorm_skill_g_info:`每回合限1次：出牌阶段，你可将全部手牌置入弃牌堆，然后摸等量张牌，期间不触发时机`,

	steadyLibrary_yzs: "不动图书馆",
	steadyLibrary_yzs_info: `锁定技：回合开始时你补充全部${get.poptip("Fuka_yzs")}。回合结束时若为${get.poptip("WaterStorm_skill")}，你获得1张符卡。你造成的双属性伤害+1。`,
	wiseStone_yzs: "贤者之石",
	wiseStone_yzs_info: `锁定技：若你无【藏书】，你摸3张牌扣置为【藏书】。<br>${get.poptip("Fuka_yzs")}：你摸3张牌。<br>你使用【杀】指定目标后可展示并给予目标1张【藏书】。`,
	wiseStone_yzs_effect: "对应效果",
	wiseStone_yzs_effect_info: `♥：${get.poptip("FireStorm")}：场上下张【杀】需2张【闪】响应<br>♦：${get.poptip("WindStorm")}<br>场上下张【杀】无次数限制<br>♠：${get.poptip("ThunderStorm")}：获得【藏书】的角色依次弃2张牌<br>♣：${get.poptip("WaterStorm")}：令任意角色恢复1点体力。`,
	book_yzs: "【藏书】",
	book_yzs_info: `你可使用锦囊【藏书】<br>失去【藏书】时转换至对应风暴<br>失去最后的【藏书】时刷新出【杀】数<br>给出【藏书】后发动${get.poptip("wiseStone_yzs_effect")}`,
	silentSelene_yzs: "沉静的月神",
	silentSelene_yzs_info: `${get.poptip("Fuka_yzs")}：你造成或受到伤害时，将1张【藏书】展示并给予对方，然后无效之。`,

	bubbleQueen_yzs: "泡沫女王",
	bubbleQueen_yzs_info: `锁定技：你可召引${get.poptip("FinancialStorm")}。<br>回合结束时若当前为【金融风暴】，你获得1张${get.poptip("Fuka_yzs")}。<br>
    出牌阶段限1次：你令1名其他角色获得${get.poptip("finances_yzs")}至其出牌阶段结束，然后你可将其中的“-”改为“+”。`,
	FinancialStorm_skill: "金融风暴",
	FinancialStorm_skill_info: `场上角色回合开始时弃1张手牌。`,
	FinancialStorm_instant_info: `金融风暴：召引者获得1张${get.poptip("Fuka_yzs")}，然后视为使用任意非伤害非延时锦囊牌`,
	finances_yzs: "财运",
	finances_yzs_info: `本技能和${get.poptip("Mischance_Scatter_yzs")}投掷要求-2。<br>
	准备阶段，若你手牌数＜体力值，${get.poptip("throw_yzs")}4：摸2张牌；否则失去1点体力。<br>
	结束阶段，你投掷4：视为使用任意非伤害非延时锦囊牌，或制作1枚${get.poptip("Totem_yzs")}。`,
	Mischance_Scatter_yzs: "厄运播撒",
	Mischance_Scatter_yzs_info: `锁定技：符卡：你弃置任意角色1张牌，然后其投掷4：下回合摸牌数+2；否则弃1张手牌。`,
	Mischance_Scatter_yzs_throw_buff: "厄运播撒",

	mengmengjiugui_yzs: "濛濛酒鬼",
	mengmengjiugui_yzs_info:`锁定技：你使用【酒】无次数限制。你已损体力值与对应项序数相等时，你的【酒】效果改为对应项描述：<br>
①：恢复1点体力；<br>②：本阶段使用下张【杀】无次数限制；<br>③：恢复1点体力；<br>④：将场上任意手牌当做【酒】使用。<br>
    出牌阶段若你未醉酒，你不可使用【杀】。`,
	mengmengjiugui_yzs_buff:"濛濛酒鬼",
	yichuirang_yzs: "伊吹瓤",
	yichuirang_yzs_info: `锁定技：你使用或打出牌时摸1张牌并扣置自己1张手牌，扣置牌达4张时获得其中1张并移去剩余，然后获得1张${get.poptip("Fuka_yzs")}。回合开始时或结束时，你可获得依此法扣置的牌。<br>
    ${get.poptip("FukaSkill_yzs")}：你需要时，视为使用【酒】。`,
	yunjiwusan_yzs: "云集雾散",
	yunjiwusan_yzs_wuyongchang_backup:`云集雾散`,
	yunjiwusan_yzs_info:`锁定技：你体力上限至多为5。你使用红色牌时增加或减少1点体力上限。<br>
    符卡：${get.poptip("wuyongchang_yzs")}：你调整体力上限至任意值，然后你每因此溢出1点体力便获得1张符卡。 `,

	pinfanshijie_yzs: "频凡世界",
	pinfanshijie_yzs_info:`你恢复体力时摸1张牌。出牌阶段若你体力值＞体力下限，你可失去1点体力并摸2张牌。`,
	Versailles_yzs: "凡尔赛",
	Versailles_yzs_info: `锁定技：你可将【杀】当做${get.poptip("fanersai_yzs")}使用。你的【凡尔赛】效果改为：
<small>“出牌阶段，对1名有手牌的其他角色使用。该角色需对其攻击范围内，由你指定的另一角色使用1张【杀】，否则你将其1张手牌暗置于你人物牌旁，称为【Z牌】。”</small>`,
	Zkill_yzs: "Zの斩首",
	Zkill_yzs_backup:"Zの斩首",
	Zkill_yzs_info: `锁定技：出牌阶段，你可移去任意张点数之和≥30的【Z牌】，然后你恢复2点体力并令任意角色失去1点体力。`,

	FairyInNight_yzs: "仙子悄入夜",
	FairyInNight_yzs_info: `锁定技：游戏开始时你获得全部${get.poptip("FairyInNight_yzs_g")}。回合开始或结束时（选其一），你失去下列全部项，然后获得其中一项：<br>
①${get.poptip("toothCollector_yzs")}②${get.poptip("candyJar_yzs")}③${get.poptip("fairyDance_yzs")}`,
	FairyInNight_yzs_g: "牙仙精灵",
	FairyInNight_yzs_g_info: `牙仙的专属牌，游戏中共有三张，所有角色都可以使用。${get.poptip("TF_yzs")}`,
	visible_FairyInNight_yzs_g:"明置",
	toothCollector_yzs: "乳牙收藏家",
	toothCollector_yzs_info: `获得本项时你摸2张牌明置为【乳牙】；你使用或打出牌后，将牌堆顶牌加入【乳牙】。达5张时你全部移去之，然后获得${get.poptip("candyJar_yzs")}或${get.poptip("fairyDance_yzs")}并分配1张【牙仙精灵】。失去本项时你交换任意张手牌与【乳牙】。`,
	candyJar_yzs: "太妃糖罐中",
	candyJar_yzs_info: `获得本项时你弃任意张手牌并摸等量张牌。你造成伤害时，可获得${get.poptip("toothCollector_yzs")}或${get.poptip("fairyDance_yzs")}或弃置受伤角色1张手牌。失去本项时你摸2张牌或令任意名角色依次摸1张牌。`,
	fairyDance_yzs: "精灵圆舞曲",
	fairyDance_yzs_info: `获得本项时你恢复1点体力或分配1次零伤害。你将“5”改为“3”。你移去【乳牙】时可获得其中1种花色的牌，并可将1张【牙仙精灵】移出游戏并刷新出【杀】数。失去本项时你可获得任意张【牙仙精灵】。`,

	juBao_yzs: "聚宝",
	juBao_yzs_info: `锁定技：你使用装备牌效果改为将之置入弃牌堆，然后获得装备技能和1张${get.poptip("Fuka_yzs")}。`,
	tanBao_yzs: "探宝",
	tanBao_yzs_BusyRod:"棒符「忙碌探宝棒」",
	tanBao_yzs_info:`出牌阶段限1次：你依次展示牌堆顶牌至展示装备牌，然后你获得之或继续展示并获得下一张装备牌。`,
	baoTa_yzs: "宝塔",
	baoTa_yzs_RadiantTreasure:"宝塔「闪亮财宝」",
	baoTa_yzs_info:`你使用或打出牌时摸1张牌并展示之，若二者颜色相同，本技能本回合失效。`,
	weiGuang_yzs: "威光",
	weiGuang_yzs_name:"光符「正义之威光」",
	weiGuang_yzs_info:`锁定技：你造成负数伤害时改为令目标恢复等量体力。你的多目标【杀】指定目标后可减少任意个目标，每减少1个便对另一目标伤害±1（不可叠加）。
	（X为任意值）${get.poptip("FukaSkill_yzs")}（X）：你视为使用目标数为X的伤害-1的普通【杀】。`,

	tuiyidele_yzs: "退役得了",
	tuiyidele_yzs_info: `锁定技：你的摸、弃牌阶段改为发动${get.poptip("breaktime_yzs")}。其他角色回合开始时/弃牌阶段结束时，若其手牌数＝你，你可令其判定/结束阶段改为发动【休息时间】。`,
	breaktime_yzs: "休息时间",
	breaktime_yzs_info:`转换技（所有角色共享此转换技状态）：①：摸2张牌；②弃2张牌。`,
	daqijingshen_yzs: "打起精神！",
	daqijingshen_yzs_info: `其他角色额定出牌阶段结束时，若其手牌数＝你，你可令其下一额定弃牌阶段改为你的出牌阶段。<br>出牌阶段限1次：摸或弃3张牌。`,

	jixiong_yzs: "鸡雄",
	jixiong_yzs_info: `锁定技：你对其他角色造成伤害时，你将牌堆顶牌明置于其人物牌旁，称为${get.poptip("jixiong_yzs_buff")}。你出【杀】数-1。受到伤害时，你获得对你造成伤害的牌。`,
	jixiong_yzs_buff: "伤痕",
	jixiong_yzs_buff_info:`拥有者拥有达3张时移去全部并失去1点体力，然后你获得其中1张或将其中1张置为任意角色的【伤痕】。`,
	geju_yzs: "割锯",
	geju_yzs_info:`出牌阶段限1次：你展示并给予1名其他角色任意张手牌，然后你获得其等量张手牌。你每依此法展示1张【杀】便对其造成0点伤害。`,
	fengnong_yzs: "讽弄",
	fengnong_yzs_info:`出牌阶段限1次：你恢复1点体力，然后其他角色依次选择：①：对你使用1张牌；②：令你摸1张牌。`,

	fanlizhimeng_yzs_equip_skill: "藩篱之梦",
	shuangzishuidai_yzs_delay: "双子睡袋",

	xueke_yzs: "血刻",
	xueke_yzs_info: `锁定技：受到非零伤害时你摸1张牌然后给予伤害来源1张手牌，此牌标记为${get.poptip("xueyin_yzs")}，不可被弃置或获取。
    你体力值为1时处于${get.poptip("shikong_yzs")}状态，然后若为你的回合内，你无视受到的伤害直至你的下一回合结束。`,
	xueyin_yzs: "血印",
	xueyin_yzs_info: `被明置时你恢复1点体力，然后取消标记。“琪诺”的【血印】不计入手牌上限`,
	shikong_yzs: "失控",
	shikong_yzs_info:`锁定技：手牌上限固定为4，造成伤害时恢复等量点体力。拥有【血印】的其他角色回合开始时展示其全部【血印】，然后你对其造成等量点伤害。`,
	xueke_yzs_tag:"血印",
	kexue_yzs: "渴血",
	kexue_yzs_info: `锁定技：回合开始时，若你处于【失控】状态，摸2张牌；若否，你弃1张红色牌或对自己造成1点伤害。`,
	yuyan_yzs: "预言",
	yuyan_yzs_info: `出牌阶段限1次：你观看1名其他角色的手牌并与其交换至多1张手牌，然后你对自己造成1点伤害。若你处于【失控】状态则可交换至多3张手牌。`,
	aiqi_yzs: "哀泣",
	aiqi_yzs_info: `锁定技：除濒死外，你不可因其他角色恢复体力。回合结束时，若你从你的上一回合结束开始体力未减少过，你弃全部手牌。`,

	shuangsheng_yzs: "双生",
	shuangsheng_yzs_info:`锁定技：你翻面时改为切换人物。游戏开始时你弃3张手牌，然后获得2点护甲（上限为2）和3点sp（上限为7）。<br>
    濒死时你恢复全部体力，若当前不为【量子态】，你摸2张牌并获得2点sp，然后进入【量子态】。无论如何你翻面。你的正反面人物均为【量子态】时你死亡。<br>
    回合开始时若当前人物为【量子态】，你结束本回合并调整sp值至3。你的【闪】不计入手牌上限。`,
	chuangsheng_yzs: "创生",
	chuangsheng_yzs_info: `你使用点数≥你使用的上张牌的牌无次数和距离限制，然后你摸1张牌并弃1张手牌。`,
	yanmie_yzs: "湮灭",
	yanmie_yzs_info:`你使用点数≤你使用的上张牌的牌无次数和距离限制，然后你摸1张牌并弃1张手牌。`,
	xieshengzhijing_yzs: "撷生之境",
	xieshengzhijing_yzs_info:`锁定技：你造成伤害后获得1点sp、失去护甲后摸1张牌。出牌阶段你可弃1张【闪】，然后翻面。`,
	niworuyi_yzs: "你我如一",
	niworuyi_yzs_hujia:"你我如一(大招)",
	niworuyi_yzs_info: `锁定技：每自轮次限1次：${get.poptip("wuyongchang_yzs")}：你消耗3点sp，然后翻面并摸2-X张牌（X为你护甲值）。<br>
    出牌阶段你可消耗5点sp，然后获得2点护甲、令正反面人物退出【量子态】并获得弃牌堆中的1张【闪】。`,

	aoman_yzs: "傲慢",
	aoman_yzs_info:`你不可使用延时类锦囊牌。你不可成为延时类锦囊牌的目标。`,
	qianmian_yzs: "千面",
	qianmian_yzs_info: `锁定技：<span class="bluetext">你不可被牌或技能指定。</span>回合开始时你从人物牌堆中检索1张拥有通常技的人物牌，然后你选择1项该人物的通常技描述替换本技能蓝字描述。`,
	qianmian_yzs_effect1:"千面",
	qianmian_yzs_effect1_info: `你不可被牌或技能指定。`,
	qianmian_yzs_effect2:"千面",
	qianmian_yzs_effect2_info:`你手牌数固定为6，你出【杀】数+2。`,
	tiance_yzs: "天策",
	tiance_yzs_info:`锁定技：游戏和出牌阶段开始时，你移去所有【策】，并摸场上人物数+3张牌称为【策】，然后依任意顺序正面向下叠置于人物牌上。<br>
    出牌阶段开始时若你无【策】可移去，【千面】蓝字描述改为：${get.poptip("qianmian_yzs_effect2")}
    你的红色【策】称为【神算】，黑色【策】称为【鬼谋】。<br>转换技：满足条件时你可移去顶端【策】并发动对应效果，然后你可按序继续移去顶端【策】并发动对应效果。<br>
①：${get.poptip("tiance_yzs_1")}<br>②：${get.poptip("tiance_yzs_2")}<br>③：${get.poptip("tiance_yzs_3")}<br>④：${get.poptip("tiance_yzs_4")}`,
	tiance_yzs_1: "其他角色使用锦囊牌时",
	tiance_yzs_1_info: `【鬼谋】：无效之—》<br>【神算】或【鬼谋】：获得之`,
	tiance_yzs_2: "其他角色使用基本牌时",
	tiance_yzs_2_info: `【神算】：摸1张牌—》<br>【神算】：获得之`,
	tiance_yzs_3: "每自轮次限1次：判定牌生效前",
	tiance_yzs_3_info: `【鬼谋】：以此【鬼谋】代替之 —》<br>【神算】：你视为使用【顺手牵羊】—》<br>【神算】/【鬼谋】：令判定角色跳过其下一弃牌阶段/摸牌阶段`,
	tiance_yzs_4: "每自轮次限1次：你受到伤害后",
	tiance_yzs_4_info: `【鬼谋】：伤害来源弃1张黑色牌或失去1点体力—》<br>【鬼谋】：你恢复1点体力`,
	shenzhiyishou_yzs: "神之一手",
	shenzhiyishou_yzs_info: `锁定技：每自轮次限1次：你选择其中一项：①：${get.poptip("wuyongchang_yzs")}：移去顶端【神算】，然后将任意张手牌与【策】交换。
②：出牌阶段：移去顶端【鬼谋】，然后弃X张牌并令2名其他角色交换手牌（X=双方手牌数之差）。`,
	shenzhiyishou_yzs_red: "【神算】",
	shenzhiyishou_yzs_black: "【鬼谋】",

	Zoltraak_yzs: "弑魔魔法",
	Zoltraak_yzs_info:`你可将锦囊牌当做无次数距离限制的任意基本牌使用或打出，并摸1张牌。然后若底牌牌名为你首次因此转化，或转化牌不为【杀】，本技能本回合失效`,
	Defend_yzs: "防御魔法",
	Defend_yzs_info:`你可将基本牌当做【无懈可击】打出并摸1张牌，然后若底牌为【杀】，本技能本回合失效。`,
	suyin_yzs: "速吟",
	suyin_yzs_info: `限定技：场上角色回合结束后，你可执行额外回合。`,

	MasterSpark_yzs: "极限火花",
	MasterSpark_yzs_info: `你可将包含【杀】在内的任意张手牌当做任意【杀】使用，此【杀】根据转化底牌中包含花色获得对应效果：<br>
	♠无次数限制；♣无距离限制； ♦不可响应；♥伤害+1。`,
	StardustReverie_yzs: "星尘幻想",
	StardustReverie_yzs_info: `锁定技：有四种花色的牌进入弃牌堆的回合结束时，你可摸1张牌，然后弃牌至手牌上限并获得弃牌数张${get.poptip("Fuka_yzs")}。
    ${get.poptip("FukaSkill_yzs")}：你将任意手牌当做【无中生有】使用。`,
	IllusionStar_yzs: "幻象之星",
	IllusionStar_yzs_info: `你成为其他角色的实体牌的目标时可展示全部手牌，若其中无此牌花色，你获得并无效此牌。 `,

	Wonderful_Heaven_yzs: "有顶天变",
	Wonderful_Heaven_yzs_info:`锁定技：游戏开始时你从牌堆顶检索4张花色不同的牌明置于人物牌旁，称为【要石】，花色需均不同。<br>
    你受到非零伤害时可移去1张【要石】以无效之，然后你展示并将手牌中与此【要石】同花色的牌全部弃置或置顶。<br>
    你手牌上限为4，你手牌数大于4时弃至4。你摸牌数+2。你手牌不可被其他角色弃置或获取。回合内你无视其他角色的伤害。<br>
    你主动弃置手牌时改为将之依次正面向上叠置于人物牌旁，称为【天界】。你于摸牌阶段外摸牌时可改为从【天界】底摸。<br>
    你可将任意手牌当做火【杀】使用。回合开始或结束时，若你手牌花色与【要石】均相同，你展示之并获得1张${get.poptip("Fuka_yzs")}。无论如何你摸牌至手牌上限。`,
	Wonderful_Heaven_yzs_yaoshi_name:"要石「天空之灵石」",
	tiandikaipi_yzs: "天地开辟",
	tiandikaipi_yzs_name:"天符「天道是非之剑」",
	tiandikaipi_yzs_info: `锁定技：判定阶段，若你有${get.poptip("Fuka_yzs")}且手牌花色与【要石】均相同，你可弃X张与【要石】同花色的异花色手牌，然后视为使用X-1张火【杀】（X为【要石】数）。<br>
    出牌阶段限2次：置顶1张【天界】牌，然后摸至多4张牌`,
	guruojintangtao_yzs: "固若金汤桃",
	guruojintangtao_yzs_info: `${get.poptip("FukaSkill_yzs")}：每自轮次限3次：场上角色成为伤害牌的目标时，将之目标改为你；若该角色为你，改为无效之。
	无论如何，将【天界】顶牌置顶或与1张【要石】替换。`,
	feixiangtian_yzs: "众生绯想天",
	feixiangtian_yzs_info: `符卡：若你无【要石】，将全部手牌明置为【要石】，然后摸牌至手牌上限。`,

	bachongwuzhongdu_yzs: "八重雾中渡",
	bachongwuzhongdu_yzs_info: `锁定技：游戏开始时你获得2张${get.poptip("Fuka_yzs")}。
	回合开始前你获得1张符卡，然后若当前为${get.poptip("WaterStorm")}，转换至${get.poptip("BulletStorm")}；若否，转换至【水风暴】。
    受到伤害或恢复体力时你获得1枚【死】标记（上限为3），然后令伤害来源弃1张牌并恢复1点体力。若其弃置黑色牌，你获得1枚【死】标记。
    出牌阶段限1次：你移除3枚【死】标记并召引【水风暴】`,
	hunliliandao_yzs: "魂离镰刀",
	hunliliandao_yzs_info: `${get.poptip("FukaSkill_yzs")}：场上角色体力值变动至1时，你令其进入濒死状态，然后你无视上限获得1枚【死】标记。若其因此死亡，你制作1枚${get.poptip("Totem_yzs")}。`,
	Higan_Retour_yzs: "彼岸归航",
	Higan_Retour_yzs_info: `符卡：场上角色回合结束时，移去全部【死】标记并令任意角色恢复等量-1点体力。然后若其本次恢复体力溢出，你对其造成等于溢出量点伤害。`,

	nuoruo_yzs: "懦弱",
	nuoruo_yzs_info:`你受到伤害时，你与伤害来源各摸伤害量张牌。`,
	monvdeyuxiang_yzs: "魔女的余香",
	monvdeyuxiang_yzs_info: `锁定技：出牌阶段开始时，你可将超出手牌上限的任意张手牌明置为任意名角色的${get.poptip("zhang_yzs")}。
    场上角色因你死亡后将其手牌加入你的【瘴】。你死亡后，游戏中的【瘴】仍保留。`,
	zhang_yzs: "瘴",
	zhang_yzs_buff:`瘴`,
	zhang_yzs_info: `持有者${get.poptip("sing_yzs")}1：选择：①将至少1张手牌加入自己的【瘴】；<br>②获得自己全部【瘴】（获得张数记为X）下一出牌阶段开始前失去1点体力，结算期间令自己体力上下限均+X，结算后获得溢出体力值点护甲。`,
	siwanghuigui_yzs: "死亡回归",
	siwanghuigui_yzs_info:`限定技：场上角色准备阶段结束后，你可记录你手牌数，本回合你首次死亡后重新加入游戏并将手牌数调整至记录值。
    锁定技：你死亡过的回合结束时，你执行出牌阶段，此阶段你对其他角色使用牌后令其【瘴】${get.poptip("sing_yzs_count")}-1，然后你可获得任意角色1张【瘴】。你进入濒死时重置本技能。`,
	siwanghuigui_yzs_record: "死亡回归",
	siwanghuigui_yzs_record_ban: "死亡回归",

	zhanqi_yzs: "战旗",
	zhanqi_yzs_info: `锁定技：出牌阶段开始时，你获得全部【旗】，然后可将任意张花色各不相同的手牌明置于人物牌旁，称为【旗】。`,
	zhanqi_yzs_effect: "旗",
	zhanqi_yzs_effect_info:`♠：你可将♠手牌当做普通【杀】使用或打出。<br>♣：你可将♣手牌当做【过河拆桥】使用。<br>
♦：你可将♦手牌当做${get.poptip("guowangmiling_yzs")}使用。<br>♥：你可将♥手牌当做【无懈可击】使用。`,
	KingsHand_yzs: "王之手",
	KingsHand_yzs_info: `锁定技：依据${get.poptip("zhanqi_yzs_effect")}的花色你获得对应效果：
    你使用造成了伤害的【杀】后发动${get.poptip("KingsHand_yzs_zhanyi")}（每回合限3次）。
    锁定技：你视为装备${get.poptip("SymmetricalSpear_yzs")}、武器牌视为${get.poptip("guowangmiling_yzs")}。`,
	KingsHand_yzs_zhanyi: "战意",
	KingsHand_yzs_zhanyi_info:`你亮出牌堆顶3张牌，获得并使用之，然后弃置剩余并摸1张牌。你依此法使用【杀】无次数限制且伤害-1。`,

	langhua_yzs: "狼化",
	langhua_yzs_info: `转换技：回合开始时你可：<span class="bluetext">①摸3张牌并弃1张牌，进入${get.poptip("yaren_yzs")}形态至下回合开始。</span><br>
	②摸1张牌并弃3张牌，进入${get.poptip("kuanglang_yzs")}形态至下回合开始，<br>期间你使用与你依此法所弃牌花色相同的牌无次数限制。`,
	langren_yzs: "狼人",
	langren_yzs_info:`锁定技：你拥有【亚人】和【狂狼】两种形态。弃牌阶段开始时，你失去所有护甲。你不可对你自己使用具恢复体力效果的牌。`,
	yaren_yzs: "亚人",
	yaren_yzs_info: `弃牌阶段你每弃1张牌获得1点护甲。你护甲值减少时摸1张牌。`,
	kuanglang_yzs: "狂狼",
	kuanglang_yzs_info: `你造成伤害时恢复1点体力。你有护甲时失去所有护甲，然后摸等量张牌。`,

	bushi_yzs: "不弑",
	bushi_yzs_info: `出牌阶段限1次：你给予1名其他角色任意张手牌，然后其获得等量+1-X枚${get.poptip("bushi_yzs_effect")}标记（X为其体力值）。
    其他角色本阶段因此获得≥X张牌时，其获得1枚【不弑】标记，且本阶段你不可再对其发动此技能。`,
	bushi_yzs_effect: "不弑",
	bushi_yzs_effect_info:`拥有者造成非零伤害时，移除1枚并令伤害-1。拥有者回合结束时移除自己全部此标记，若移除数不小于3则恢复1点体力。`,
	shengxin_yzs: "圣心",
	shengxin_yzs_info: `锁定技：你造成伤害-1。<br>每回合限2次：你使用锦囊牌时，可展示无非锦囊牌的手牌，然后摸2张牌并刷新【不弑】。
	<br>你可对其他角色使用【桃】或【酒】。`,
	tairan_yzs: "泰然",
	tairan_yzs_info: `出牌阶段限3次：你可将【闪】当做【火攻】使用。你回合结束时，若手牌无非锦囊牌，可弃置之并摸4张牌。`,

	shiyi_yzs: "失忆",
	shiyi_yzs_info:`锁定技：你使用与你本回合使用的上张牌牌名不同的牌无次数限制。你摸牌数等于你体力值。`,
	tiaoxiang_yzs: "调香",
	tiaoxiang_yzs_info: `锁定技：游戏开始时你获得2瓶【忘忧香】。${get.poptip("sing_yzs")}2：你获得1瓶【忘忧香】。<br>
    每名角色的准备阶段结束时，你可消耗1瓶【忘忧香】，然后令任意角色获得${get.poptip("wangyou_yzs")}。`,
	wangyou_yzs: "忘忧",
	wangyou_yzs_info: `获得本技能时记录你手牌数和体力值。进入濒死或回合开始时，你调整手牌数和体力值至记录值，然后失去本技能。`,

	xiezou_yzs: "协奏",
	xiezou_yzs_info: `你的回合内每名角色限1次，场上角色使用牌后，若此牌类型与本回合上张被使用的牌不同，其摸2张牌并可令1名本回合未发动【协奏】的角色使用1张手牌。`,
	yuetuan_yzs: "乐团",
	yuetuan_yzs_info: `锁定技：你发动${get.poptip("xiezou_yzs")}无次数限制且少摸1张牌。回合结束时，若本回合使用牌的牌数/类型数/角色数达3，你摸1张牌/恢复1点体力/分配1点伤害。`,

	baozang_yzs: "宝藏",
	baozang_yzs_info:`效果根据颜色不同：<br>
	黑色：出牌阶段限5次，对1名其他角色使用。弃置其2张牌,或视为对其使用无视防具的普通【杀】。<br>红色：出牌阶段或濒死时，对你使用。你摸2张牌或恢复1点体力。`,
	chengfengpolang_yzs:"乘风破浪",
	chengfengpolang_yzs_info: `锁定技：你的【杀】造成伤害时，摸1张牌扣置为${get.poptip("baozang_yzs")}。每自轮次限1次：你可将任意手牌当做【宝藏】使用。你使用手牌【杀】仅可指定"${get.poptip("jifengbaoxiang_yzs")}"。`,
	yangfanqihang_yzs:"扬帆起航",
	yangfanqihang_yzs_info: `觉醒技：回合结束时，若你本局游戏已使用4次【宝藏】，你摸2张牌扣置为【宝藏】，然后你扣除1点体力上限并获得：${get.poptip("sing_yzs")}1：若"疾风宝箱"不在场，你召唤之至任意座次。
    "疾风宝箱"于你的回合死亡后，你扣置全部手牌为【宝藏】，回合结束时你移去依此法获得的【宝藏】。`,
	yangfanqihang_yzs_awaken: "扬帆起航",
	yangfanqihang_yzs_awaken_info: `锁定技："疾风宝箱"于你的回合死亡后，你扣置全部手牌为【宝藏】，回合结束时你移去依此法获得的【宝藏】。`,
	jifengbaoxiang_yzs_summon: "疾风宝箱",
	jifengbaoxiang_yzs_summon_info:`锁定技：你无回合、无区域、且不可成为除"反叛的海贼-远舟春贺"以外的角色使用牌的目标。你进入濒死时直接死亡。
    "反叛的海贼-远舟春贺"回合开始及其使用${get.poptip("baozang_yzs")}时，你失去1点体力。`,

	wangling_yzs:"亡灵",
	wangling_yzs_info: `锁定技：你仅可因自己技能或【水风暴】恢复体力。你每累计受到4点伤害后，若未处于濒死，进入濒死状态。<br>
    你脱离濒死时恢复全部体力、摸3张牌，并获得1张${get.poptip("Fuka_yzs")}。与你体力值相等的角色的出牌阶段结束时，你可转换至：${get.poptip("WaterStorm")}或${get.poptip("BulletStorm")}。`,
	fanhundie_yzs: "反魂蝶",
	fanhundie_yzs_info: `转换技：场上角色进入濒死时，若其体力值为唯一最低，你可：<span class="bluetext">①令其恢复1点体力</span> ②对其造成1点伤害。<br>
    ${get.poptip("FukaSkill_yzs")}： ${get.poptip("wuyongchang_yzs")}：你与1名与你体力值之差等于1的角色交换体力值。`,
	yousi_yzs: "诱死",
	yousi_yzs_info: `出牌阶段限1次：你视为使用伤害值为2的【决斗】，生效前，目标角色与你依次可令对方摸1张牌并令之伤害-1。`,

	wuwei_yzs: "无畏",
	wuwei_yzs_info: `回合开始时你失去全部护甲，然后获得1点护甲。你受到伤害至多为1，你可将红色牌当做普通【杀】使用或打出。`,
	yingyongjuedou_yzs: "英勇决斗",
	yingyongjuedou_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你指定1名其他角色，由其开始，你与其轮流打出1张【杀】，首先不出【杀】的一方受到另一方造成的1点伤害，
	然后伤害来源可再打出1张【杀】以对另一方造成1点伤害。然后你/其依次摸X张牌（X=你/其依此法打出【杀】的张数）。你护甲减少时重置本技能。`,
	qishidao_yzs: "骑士道",
	qishidao_yzs_info: `锁定技：你不可使用【桃】且不可成为【桃】的目标。你手牌上限固定为5。你手牌数＞5时弃至5。`,

	callSpring_yzs: "报春",
	callSpring_yzs_global:"报春",
	callSpring_yzs_info:`每回合限1次：场上角色的出牌阶段，其可重铸任意张不同类型的手牌，然后你依次执行前X项：①弃置1张手牌 ②获得其中1张 ③使用其中1张。（X为其重铸牌数）`,
	SurpriseSpring_yzs: "惊喜之春",
	SurpriseSpring_yzs_info: `觉醒技：你失去过牌的回合结束时，你可将1张手牌当做【桃】或【无中生有】对任意角色使用，然后若你无手牌，你觉醒：反转${get.poptip("callSpring_yzs")}选项顺序并摸2张牌。`,
	callSpring_yzs_awaken: "报春",
	callSpring_yzs_awaken_global:"报春",
	callSpring_yzs_awaken_info: `每回合限1次：场上角色的出牌阶段，其可重铸任意张不同类型的手牌，然后你依次执行前X项：①使用其中1张 ②获得其中1张 ③弃置1张手牌。（X为其重铸牌数）`,

	quanbing_yzs: "权柄",
	quanbing_yzs_down:"权柄(暗)",
	quanbing_yzs_info: `锁定技：游戏开始时或${get.poptip("sing_yzs")}1：你摸1张牌并将1张手牌明置于人物牌旁称为【${get.poptip("quanbing_yzs_card")}】；若已达4张，改为摸1张牌或将【权柄】全部翻至正面。受到非零伤害时本${get.poptip("sing_yzs_count")}-1。 `,
	quanbing_yzs_card: "权柄",
	quanbing_yzs_card_info: `与明置【权柄】点数相同的牌被使用或打出或弃置时，你可将此【权柄】翻面并获得之，然后选择至多2项：①：无效其${get.poptip("paimianxiaoguo_yzs")}；②：给予1名其他角色1张手牌。`,
	shenshu_yzs: "神术",
	shenshu_yzs_info: `锁定技：游戏开始时你获得四项神术：♠${get.poptip("lvjie_yzs")} ♣${get.poptip("yinyao_yzs")} ♥${get.poptip("shenglian_yzs")} ♦${get.poptip("xinghui_yzs")}，每张【权柄】翻面后你判定，根据结果刷新相应神术。`,
	lvjie_yzs: "律诫",
	lvjie_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你观看并扣置任意角色1张手牌，本回合结束时其获得之。`,
	yinyao_yzs: "引曜",
	yinyao_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你移动场上1张牌。`,
	shenglian_yzs: "圣怜",
	shenglian_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你令任意角色选择恢复1点体力或摸2张牌。`,
	xinghui_yzs: "星辉",
	xinghui_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你观看牌堆顶4张牌，任意调换顺序后置顶或底。`,
	jinzhou_yzs: "禁咒",
	jinzhou_yzs_info: `锁定技：你无额定摸牌阶段、出牌阶段和弃牌阶段。回合开始时，若【权柄】均暗置，你令任意角色获得全部【权柄】并执行出牌阶段。因此获得4张牌的角色摸2张牌。`,

	bingjie_yzs: "冰结",
	bingjie_yzs_info: `你的黑色【杀】视为${get.poptip("icesha_yzs")}。`,
	yzsIce_skill: "冰结",
	_icesha_yzs: "冰结",
	bingpo_yzs: "冰魄",
	bingpo_yzs_info: `弃牌阶段若你弃牌，你可视为使用冰【杀】或【过河拆桥】。<br>
    受到伤害时，若你手牌数≥体力值，你可弃1张手牌然后无效之。`,
	IceAge_yzs: "冰痕世纪",
	IceAge_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你调整体力值至1，然后召引${get.poptip("IceStorm")}并跳过任意名角色下一出牌阶段。`,

	chunzhen_yzs: "纯真",
	chunzhen_yzs_info: `游戏开始时，你依次检索1张武器牌和防具牌并使用之。你摸牌数和出【杀】数+1。`,
	zhenwu_yzs: "真武",
	zhenwu_yzs_info: `每回合结束时，若你体力值为1，你亮出并任意使用牌堆顶X张牌，然后恢复1点体力（X为你已废除区域数+1）。`,
	zhenyi_yzs: "真义",
	zhenyi_yzs_info: `锁定技：你废除区域时获得1点护甲，均废除后调整体力上限至1并获得2点护甲。你有护甲且未濒死时恢复体力无效。<br>
    你进入濒死时可废除自己1个区域，然后恢复体力值至1。<br>准备阶段，你可废除自己1个无牌的区域。<br>结束阶段，你可失去体力值至1并获得失去体力点护甲。`,

	thief_yzs: "怪盗",
	thief_yzs_equip_hp:"怪盗",
	thief_yzs_info: `锁定技：你主动获得其他角色手牌后可将之扣置为【盗】。
    根据【盗】的类型，你可移去【盗】并发动对应效果：${get.poptip("thief_yzs_basic")}、${get.poptip("thief_yzs_trick")}、${get.poptip("thief_yzs_equip")}`,
	thief_yzs_basic: "基本盗",
	thief_yzs_basic_info: `其他角色使用锦囊牌时：无效并获得之`,
	thief_yzs_trick: "锦囊盗",
	thief_yzs_trick_backup:"怪盗",
	thief_yzs_trick_info: `${get.poptip("wuyongchang_yzs")}：转换技：①获得场上1张牌 ；②摸2张牌`,
	thief_yzs_equip: "装备盗",
	thief_yzs_equip_info: `场上角色的阶段结束时，你可令任意角色调整体力值和手牌数至本阶段开始时值`,
	qianying_yzs: "潜影",
	qianying_yzs_info: `锁定技：其他角色摸牌阶段结束时，若你无【盗】，你可将其1张手牌加入【盗】。摸牌阶段，你可改为获得其他角色至多2张手牌。`,

	buxijinjun_yzs: "不息进军",
	buxijinjun_yzs_info: `锁定技：游戏开始时，你将牌堆顶4张牌明置于人物牌旁，称为【源晶】。<br>
	你进入濒死时，可恢复体力至下限，并将牌堆顶恢复量张牌加入【源晶】，然后令【坚盾】本回合失效。<br>
    出牌阶段结束时，若你有同点数的【源晶】，你死亡。`,
	huimiezitai_yzs: "毁灭姿态",
	huimiezitai_yzs_info: `锁定技：你造成或受到非零伤害时亮出牌堆顶2张牌，获得其中与【源晶】点数不同的牌，然后令伤害+X(剩余牌数)<br>
    出牌阶段限1次：你用任意张手牌替换等量张【源晶】。`,
	jiandun_yzs: "坚盾",
	jiandun_yzs_info: `其他角色受到伤害时，若伤害来源不为你，你可弃置1张【杀】，然后无效之并受到伤害来源造成的等量点伤害。`,

	mengliao_yzs: "梦疗",
	mengliao_yzs_info: `一张牌被无效时，你可给予使用者1张手牌，令其恢复1点体力。<br>
    转换技：①：出牌阶段限1次：你视为使用${get.poptip("mengliaoshibian_yzs")}；②：受到伤害后，你可视为使用【梦疗事变】。`,
	qimeng_yzs: "崎梦",
	qimeng_yzs_info: `锁定技：你对其他角色造成伤害改为令其失去等量体力。<br>出牌阶段限1次：你视为使用${get.poptip("fanlizhimeng_yzs")}。<br>
    你的多张牌进入弃牌堆时，若之同颜色，你可对当前回合角色造成X点伤害（X为牌数的一半向下取整）。`,
	mengmie_yzs: "梦灭",
	mengmie_yzs_info: `出牌阶段开始时你摸已损体力值张牌，然后弃至多体力值张手牌，本阶段你出【杀】数为因此弃牌数。<br>觉醒技：你进入濒死时或【梦疗事变】被无效后，你觉醒：你获得${get.poptip("huange_yzs")}并选择：①：失去【梦疗】并恢复全部体力；②：失去1点体力和体力上限。`,
	huange_yzs: "幻隔",
	huange_yzs_info: `锁定技：准备阶段，你增加1点体力上限。`,

	tiangongkaiwu_yzs: "天工开物",
	tiangongkaiwu_yzs_info: `${get.poptip("eternalSkill_yzs")}：游戏开始时，你召唤"${get.poptip("ciyuanzhimen_yzs")}"至场上任意座次。"次元之门"死亡后，你获得：${get.poptip("sing_yzs")}1：召唤"次元之门"至场上任意座次，然后失去此吟唱。`,
	ciyuanzhimen_yzs_summon: "次元之门",
	ciyuanzhimen_yzs_summon_info: `"次元魔女-许如荧"的专属召唤物，没有区域，回合仅有准备阶段，初始体力值为4，无视非指向性牌造成的伤害和技能伤害。
		受到伤害结算后，若伤害来源不为召唤物，将伤害来源送至其1自轮次后的次元。<br>
		"次元之门"在场时，"次元魔女-许如荧"可用${get.poptip("gongyin_yzs")}。`,
	xunyou_yzs: "寻友",
	xunyou_yzs_info: `锁定技：你对其他角色造成伤害后，你选择令其：①：摸1张牌；②：恢复1点体力。`,
	gongyin_yzs: "共吟",
	gongyin_yzs_info: `${get.poptip("eternalSkill_yzs")}：当“次元之门”需打出【闪】时，你可替其出之，（视为由“次元之门”打出）然后你摸1张牌。<br>
	出牌阶段限1次：你将任意张红色牌与场上等量张牌传送至1自轮次后的次元。`,
	ciyuanchaoyue_yzs: "次元超越",
	ciyuanchaoyue_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你指定至多2名人物，将其余人物传送至其2自轮次后的次元！！！！！！！！<br>
	然后你获得：${get.poptip("sing_yzs")}4：失去此吟唱，然后重获【次元超越】。${get.poptip("ciyuanchaoyue_yzs_tip")}。`,
	ciyuanchaoyue_yzs_tip: "注释",
	ciyuanchaoyue_yzs_tip_info: `将某人/牌送至X自轮次后的次元，即将对应的人/牌移出游戏直至其原本正常进行X轮后。<br>另外，此技能生效期间的2轮不计入游戏轮次`,

	SSF_determination_yzs: "决心",
	SSF_determination_yzs_info: `<span class="yzs_xuancai">持恒技</span>：${get.poptip("wuyongchang_yzs")}：你${get.poptip("cundang_yzs")}/${get.poptip("dudang_yzs")}。`,
	SixSouls_yzs: `六魂`,
	SixSouls_yzs_info: `<span class="yzs_xuancai">持恒技</span>：你视为拥有：<br><font color="#32d9c7">${get.poptip("SixSouls_yzs_patience")}</font>
	<font color="#ffac4c">${get.poptip("SixSouls_yzs_courage")}</font>
	<font color="#2145ff">${get.poptip("SixSouls_yzs_honesty")}</font>
	<font color="#b621ff">${get.poptip("SixSouls_yzs_perseverance")}</font>
	<font color="#63e838">${get.poptip("SixSouls_yzs_kindness")}</font>
	<font color="#fff821">${get.poptip("SixSouls_yzs_justice")}</font>`,
	SixSouls_yzs_patience: "耐心",
	SixSouls_yzs_patience_test:"耐心",
	SixSouls_yzs_patience_info: `你的回合结束时，你摸2张牌。`,
	SixSouls_yzs_courage: "勇气",
	SixSouls_yzs_courage_test: "勇气",
	SixSouls_yzs_courage_info: `你每回合使用的首张【杀】无次数限制且不可响应。`,
	SixSouls_yzs_honesty: "诚实",
	SixSouls_yzs_honesty_test: "诚实",
	SixSouls_yzs_honesty_info: `你手牌上限+4。`,
	SixSouls_yzs_perseverance: "毅力",
	SixSouls_yzs_perseverance_test: "毅力",
	SixSouls_yzs_perseverance_info: `你每公轮首次受到的伤害-3。`,
	SixSouls_yzs_kindness: "仁慈",
	SixSouls_yzs_kindness_test: "仁慈",
	SixSouls_yzs_kindness_info: `出牌阶段限1次：你失去1点体力，然后令1名其他角色恢复1点体力。`,
	SixSouls_yzs_justice: "正义",
	SixSouls_yzs_justice_test: "正义",
	SixSouls_yzs_justice_info: `你的回合开始时，你可弃X张手牌(X为你体力值且至多为4)，然后对1名其他角色造成1点伤害或弃置其区域内的至多2张牌。`,
	SSF_Nightmare_yzs: "梦魇",
	SSF_Nightmare_yzs_call:"行动",
	SSF_Nightmare_yzs_info: `<span class="yzs_xuancai">持恒技</span>：每名角色的回合结束时，你获得1枚【梦魇】标记，你可移除3枚标记以获得额外回合。你无惧死亡。你使用牌无距离限制。你击杀角色不触发奖惩，你需杀死其他所有角色。`,

	Run_yzs: "逃跑",
	Run_yzs_info: `失去了力量的小花。`,

	qigong_yzs: "气功",
	qigong_yzs_info:`你使用或打出红色牌时获得1枚【气】标记，上限为3。<br>
	出牌阶段，你可移除任意枚【气】并摸等量张牌，若一次性移除3枚，你可将1张手牌当做【酒】使用。`,
	taiji_yzs: "太极",
	taiji_yzs_info: `锁定技：场上角色需要使用或打出【闪】时，你可移除1枚【气】并令其发动【八卦阵】。若判定失败，你可再次发动本技能。`,
	chongxu_yzs: "冲虚",
	chongxu_yzs_info:`你的【杀】结算后，若结算期间无实体牌被使用或打出，此【杀】无次数限制。<br>
	你指定或成为【杀】的唯一目标时，可交换使用者和目标，然后若此【杀】被响应，原使用者摸1张牌且此【杀】仍对原目标造成伤害。`,

	ErWangSaid_yzs: "二王如是说",
	ErWangSaid_yzs_info: `锁定技：游戏开始时你令你和至多2名其他角色进入“里”${get.poptip("ErWangCiYuan_yzs")}，其余角色进入“外”次元状态。<br>
	场上角色对所处次元状态与其不同的角色造成伤害时，无效之<span class="bluetext">，然后本次受伤角色翻转其次元状态</span>。<br>
    <span class="bluetext">你对同次元状态其他角色造成伤害时翻转其次元状态。你受到伤害时翻转次元状态；<br></span>
    出牌阶段，你可弃2张红色牌以视为使用任意仅指定你为目标的非延时锦囊牌。<br>
	回合内你翻转次元状态时可弃全部手牌。回合内你失去最后的手牌时摸3张牌。`,
	ErWangPlay_yzs: "二王乾坤戏",
	ErWangPlay_yzs_info: `锁定技：你处于“外”次元时：你造成伤害-1、你可将2张黑色牌当做【决斗】使用。<br>
    你处于“里”次元时：<span class="bluetext">你回合结束时对所有其他角色造成1点伤害。其他角色回合结束时你可弃1张黑色牌然后对其造成1点伤害。</span>`,
	ErWangLock_yzs: "次元封锁令",
	ErWangLock_yzs_info:`限定技：回合开始时，你可删去<span class="bluetext">蓝字部分</span>并令你的出【杀】数+3-X至你的下回合开始。(X为处于【里】的其他角色数)<br>你杀死其他角色后刷新本技能。`,

	qiuwen_yzs:"求闻",
	qiuwen_yzs_info:`每回合每种牌名限1次：你可将手牌当做<span class="bluetext">【闪】</span>或<span class="bluetext">【无中生有】</span>使用或打出，并可令本技能本回合失效以摸3张牌并弃半数取下张手牌。`,
	zhuanshi_yzs:"转世",
	zhuanshi_yzs_info: `${get.poptip("eternalSkill_yzs")}：你因【求闻】弃置牌时，记录其点数，并将其中即时牌的牌名加入【求闻】。<br>
    每回合结束时，若你此世记录总点数达30，你死亡。<br>
    你即将死亡时可分配全部手牌至其他角色。<br>
    你下家回合开始时，若你已死亡，你重新加入游戏。`,

	putaojiu_yzs: "葡萄酒",
	putaojiu_yzs_info: `锁定技：你发动技能后分配N点体力恢复（N为本次技能造成伤害总量）。<br>${get.poptip("sing_yzs")}1：场上角色依次向3调整1点体力。`,
	caisedebai_yzs: "彩色的白",
	caisedebai_yzs_info: `${get.poptip("RE_Mystic")}：Ⅰ：令【葡萄酒】${get.poptip("sing_yzs_count")}-1；<br>Ⅱ：你获得2点${get.poptip("RE_AP")}，然后体力值＜3的角色摸1张牌；<br>
	Ⅲ：你获得3点行动力，然后体力值＞2的角色依次选择：弃1张牌或受到1点伤害。`,
	dengliangdeguang_yzs: "等量的光",
	dengliangdeguang_yzs_info: `${get.poptip("RE_Mystic")}：对1名体力值为X的角色造成1点伤害。（出牌阶段每阶限1次，X为此神秘术阶数）`,
	weixiaochengjiu_yzs: "微小成就",
	weixiaochengjiu_yzs_info: `锁定技：你神秘术恒为3张。<br>未处于濒死的人物于其回合外恢复体力后，你获得1点${get.poptip("Passion_yzs")}。<br>
    ${get.poptip("RE_FC")}：${get.poptip("Passion_yzs")}6：你与所有人物同时拼点：若你赢，对其造成1点伤害。无论如何所有人物依次摸1张牌。`,

	RE_Mystic: " ",
	RE_Mystic_1:`<span class="yzs_Mystic">♦</span>`,
	RE_Mystic_2: `<span class="yzs_Mystic">♦</span>`,
	RE_Mystic_3:`<span class="yzs_Mystic">♦</span>`,
	_RE_Mystic: "神秘术",

	youzou_yzs: "游走",
	youzou_yzs_info:`你使用或打出牌时，若之与你使用或打出的上张牌：颜色不同，你摸1张牌然后置顶1张手牌；花色相同，你获得1点行动力（上限为2）。`,
	lvlin_yzs: "绿林",
	lvlin_yzs_info: `转换技：满足对应条件时，你可消耗1点“行动力”，发动以下技能：<br>①${get.poptip("lvlin_yzs_yingjian")}<br>②${get.poptip("lvlin_yzs_qiequ")}<br>③${get.poptip("lvlin_yzs_fangun")}`,
	lvlin_yzs_yingjian: "影箭",
	lvlin_yzs_yingjian_info: `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做普通【杀】使用。`,
	lvlin_yzs_qiequ: "窃取",
	lvlin_yzs_qiequ_info: `${get.poptip("wuyongchang_yzs")}：你将牌堆顶牌当做【顺手牵羊】使用。`,
	lvlin_yzs_fangun: "翻滚",
	lvlin_yzs_fangun_info: `你成为牌的目标时，观看牌堆顶的3张牌并可与手牌任意交换，然后摸1张牌。`,

	tianping_yzs: "天平",
	tianping_yzs_info: `锁定技：其他角色的出牌阶段开始时，你可与其拼点，然后胜者失去因此获得的${get.poptip("Auserlese_yzs")}，败者获得【服从魔法】并选择：<br>
	①摸2张牌，本阶段其对其他角色使用牌时，胜者可将目标改为任意1名角色；<br>②给予胜者2张手牌。<br>最后，本阶段所有【服从魔法】中的名字改为<font color="#e553ff">胜者</font>。`,
	Auserlese_yzs: "服从魔法",
	Auserlese_yzs_info:`每回合每名角色限1次：“<font color="#e553ff">阿乌拉</font>”回合外需要使用或打出基本牌时可令任意名其他拥有本技能的角色选择：
	<br>①给予“<font color="#e553ff">阿乌拉</font>”1张所需牌，然后“<font color="#e553ff">阿乌拉</font>”摸1张牌并可给予其1张牌；<br>②“<font color="#e553ff">阿乌拉</font>”获得其1张牌。`,

	fanyueciye_yzs: "翻阅此页",
	fanyueciye_yzs_info: `锁定技：你神秘术恒为4张。<br>游戏开始时和“标注角色”死亡时，你转移【标注】标记至任意角色，称为“${get.poptip("fanyueciye_yzs_chara")}”。<br>
    你融合升阶时可弃1张同颜色牌以令之不消耗行动力。`,
	jingduke_yzs: "精读课",
	jingduke_yzs_info: `${get.poptip("RE_Mystic")}：你依此法获得牌后可将之给予“${get.poptip("fanyueciye_yzs_chara")}”：<br>
Ⅰ：摸1张牌；<br>Ⅱ：摸3张牌并弃2张牌，然后获得1点${get.poptip("RE_AP")}；<br>Ⅲ：获得2点行动力和2点${get.poptip("Passion_yzs")}。`,
	yudenghuozhong_yzs: "于灯火中",
	yudenghuozhong_yzs_info: `${get.poptip("RE_Mystic")}：你依此法造成伤害时获得1点激情：<br>
Ⅰ：将1张手牌当做普通【杀】使用，然后可转移【标注】；<br>
Ⅱ：摸1张牌并刷新你的出【杀】数；<br>  Ⅲ：获得1点激情，视为使用无距离限制且不可响应的普通【杀】。`,
	huiwanggengyuanchu_yzs: "回望更远处",
	huiwanggengyuanchu_yzs_info:`锁定技：每回合你首次使用每种每阶神秘术后获得1点激情。<br>
    ${get.poptip("RE_FC")}：${get.poptip("Passion_yzs")}8：将你所有神秘术升1阶，每有1张不可升阶则你分配1点伤害。`,

	fuse_yzs: "引信",
	fuse_yzs_info: `锁定技：出牌阶段限1次：你摸2张牌并可视为使用【火攻】。然后若你体力值为1，你恢复2点体力，并获得${get.poptip("boom_yzs")}；`,
	boom_yzs: "爆炸",
	boom_yzs_info:`锁定技：你对本回合受到过火焰伤害的角色使用牌无次数距离限制。<br>你使用或打出基本牌时，对当前回合角色造成1点火焰伤害。<br>
你受到火焰伤害后，恢复等量点体力并摸等量张牌。<br>回合开始时，你失去本技能并恢复1点体力。`,

	longzhiban_yzs: "龙之绊", 
	longzhiban_yzs_info: `锁定技：游戏开始时你召唤“${get.poptip("MrDragon_yzs")}”至场上任意座次。<br>
    若“龙先生”在场：你无视受到的伤害或失去体力效果、不可因牌恢复体力、对其他人物造成伤害-1；<br>
    每自轮次限3次：你可将红色牌当做普通【杀】使用或打出，并摸1张牌；<br>
    回合开始时你可跳过本回合任意个阶段，则“龙先生”下一对应阶段连续执行2次；<br>
    你因自身技能效果摸牌后，“龙先生”摸等量张牌。<br>
    你每自轮次首次恢复体力后，“龙先生”恢复1点体力。<br>
    <font color="#9b9b9b">若“龙先生”不在场：你受到非零伤害+2。你体力值变动时获得等同于变化值的【绊】标记。<br>
	【绊】数达到13时你清除所有【绊】并重新召唤“龙先生”至场上任意座次。</font>`,
	longzhiban_yzs_MrDragon_yzs: "龙之绊",
	longzhiban_yzs_MrDragon_yzs_info: `锁定技：你摸牌数-2，手牌上限为你与“加羽”体力值之和。<br>
    “加羽”体力值≥5时你无出牌阶段，且除其外的其他角色不可令你恢复体力。<br>回合结束时，你可弃任意张牌然后摸等量张牌。`,
	shitianlongjian_yzs: "示天龙剑", 
	shitianlongjian_yzs_info: `锁定技：你视为装备${get.poptip("longzhijian_yzs")}。<br>你体力值≥5时，你的【杀】伤害+1。`,
	longzhiwu_yzs: "龙之舞",
	longzhiwu_yzs_info:`锁定技：回合开始时，若你体力值：<font color="#cac7ff">≤2：你恢复1点体力并摸3张牌，然后你弃3张牌；<br></font>
≥5：你选择并获得效果：①：你体力上限+2（至多为9）；<br>②：你出【杀】数+1（至多+2）直至下次受到伤害后。`,

	shuhuenci_yzs: "倏忽恩赐",
	shuhuenci_yzs_info: `锁定技：你体力值不因${get.poptip("dapiwansi_yzs")}而：上升（或溢出）/下降后，摸/弃等量牌。<br>
    体力值等于你的其他角色受到非零伤害时，你可失去1点体力令伤害值±1。<br>回合内你使用红色牌时恢复1点体力。`,
	bianzangsong_yzs: "彼岸葬送",
	bianzangsong_yzs_info: `锁定技：回合外你失去最后的手牌时摸1张牌，若因${get.poptip("shuhuenci_yzs")}，则改为摸已损体力值+1张牌并分配1点伤害。<br>
    场上角色回合结束时，若你体力值大于其，你失去1点体力，否则你可恢复1点体力。`,
	dapiwansi_yzs: "大辟万死",
	dapiwansi_yzs_info: `锁定技：游戏开始时记录你体力值。<br>你造成伤害后，记录你体力值并调整体力值至上一记录值。`,

	AirFazen_yzs: "模仿",
	AirFazen_yzs_info: `锁定技：每回合限1次：场上角色使用<font color="#f43e96">单目标转化牌</font>时，你可摸2张牌，然后<font color="#f43e96">记录此牌牌名</font>。<br>
    每回合每种牌名限1次：你可将手牌当做<font color="#f43e96">记录过的牌</font>使用。`,
	xuanzhan_yzs: "旋斩",
	xuanzhan_yzs_info: `需要时，你可将1张<font color="#f43e96">非延时锦囊牌</font>当做普通【杀】使用，然后可将1张【杀】当做<font color="#f43e96">前者的底牌</font>使用。`,
	huanwu_yzs: "幻武",
	huanwu_yzs_info:`锁定技：你视为拥有<font color="#f43e96">【仁王盾】</font>的装备效果。<br>
    每名角色的回合开始时，你可将1张<font color="#f43e96">装备牌</font>当做任意基本牌使用，并用<font color="#f43e96">此牌</font>替换<font color="#f43e96">上述牌名</font>。`,

	guangbo_yzs: "广播",
	guangbo_yzs_info: `出牌阶段限1次：你摸1张牌，然后视为使用${get.poptip("wugu")}，因此获得红色牌的其他角色于本回合不可使用或打出牌。`,
	CrimsonShadow_yzs: "红影",
	CrimsonShadow_yzs_info: `锁定技：你杀死角色后令${get.poptip("guangbo_yzs")}发动次数上限+1。<br>
    你受到非零伤害时，将伤害值改为X（你体力值向上取半数），或扣除全部空余体力上限以无效之`,
	GuiltyDemon_yzs: "罪魔",
	GuiltyDemon_yzs_info: `锁定技：你使用点数为字母的牌无次数距离限制。<br>你使用或打出牌时增加1点体力上限。<br>
    你的牌点数+X，然后对13取余（X为你已损体力值）。`,

	jiansheng_yzs: "剑圣",
	jiansheng_yzs_info: `锁定技：你发动${get.poptip("businiao_yzs")}后，恢复全部体力并增加1点体力上限，然后刷新【不死鸟】。（X为你体力上限）<br>
    出牌阶段限X次：你与1名其他角色拼点，胜者对败者造成1点伤害，然后败者可扣置自己全部手牌至本回合结束。`,
	jiahu_yzs: "加护",
	jiahu_yzs_info: `锁定技：你拥有以下“加护”：<br>
	${get.poptip("jianshu_yzs")}、${get.poptip("jilei_yzs")}、${get.poptip("wenzhong_yzs")}、${get.poptip("businiao_yzs")}。<br>
    回合开始时你摸2张牌，然后将上述X个“加护”移除或交给任意名其他角色，至你下一回合开始。（X为你体力上限）`,
	jianshu_yzs: "剑术",
	jianshu_yzs_info: `你每自轮次使用的首张【杀】不可响应。`,
	jilei_yzs: "疾雷",
	jilei_yzs_info: `你的进攻距离和防御距离+1。`,
	wenzhong_yzs: "稳重",
	wenzhong_yzs_info: `你的摸牌数+1，手牌上限+2。`,
	businiao_yzs: "不死鸟",
	businiao_yzs_info: `你每自轮次首次进入濒死时恢复1点体力。`,

	shengyu_yzs: "圣谕",
	shengyu_yzs_down:"圣谕(暗)",
	shengyu_yzs_info: `锁定技：游戏开始时或你进入过【人上人】的回合结束时，你移去全部【谕】并摸6张牌暗置于人物牌旁称为【谕】。<br>
    你成为牌的唯一目标时可移去1张【谕】，然后若之明置，你选择：①：视为使用之；②视为响应之并翻转1张【谕】。`,
	yuanzheng_yzs: "远征",
	yuanzheng_yzs_info: `锁定技：出牌阶段限1次：你扣置1张手牌并给予1名其他角色1张暗置【谕】，然后其弃1张手牌。
然后你展示扣置牌，若之与所弃牌花色相同，其获得之；否则将之明置为【谕】，并令其选择弃2张牌或失去1点体力。<br>
    受到伤害时，你下一出牌阶段本技能次数+1。`,
	caijue_yzs: "裁决",
	caijue_yzs_info: `锁定技：移去【谕】时你摸1张牌。出牌阶段若【谕】均明置，你可进入${get.poptip("caijue_yzs_buff")}状态至结束阶段。`,
	caijue_yzs_buff: "人上人",
	caijue_yzs_buff_info:`其他角色体力下限+1。你手牌数固定为【谕】数。你使用【杀】无次数和距离限制且需先移去1张【谕】`,
	tongshe_yzs: "统摄",
	tongshe_yzs_info: `锁定技：吟唱1：你将牌堆顶牌暗置为【谕】。然后若你有护甲，受到1点无来源伤害。无论如何你获得1点护甲。`,

	Calibration_yzs: "校时",
	Calibration_yzs_info: `锁定技：结束阶段，你令任意个你技能产生的${get.poptip("sing_yzs_count")}-1。<br>
    受到非零伤害后，你可令1个你技能产生的吟唱-1，然后若为你回合内，你恢复1点体力。`,
	TimeBomb_yzs: "时间爆弹",
	TimeBomb_yzs_info: `锁定技：${get.poptip("sing_yzs")}3：你令当前回合角色受到1点伤害或恢复1点体力。<br>
	你造成伤害时可防止之，然后令受伤角色获得：吟唱1：受到1点伤害，然后失去本吟唱。`,
	TimeMachine_yzs: `时间机器`,
	TimeMachine_yzs_info: ` 锁定技：吟唱3：你调离任意角色至本回合结束。若其为当前回合角色，其先摸2张牌；若否，你摸2张牌或制作1枚${get.poptip("Totem_yzs")}。<br>
    造成伤害后，你可令1个你非本技能产生的吟唱-1。`,

	AiMu_yzs: "爱慕",
	AiMu_yzs_info: `有本技能的其他角色的伤害牌不可指定你为目标。<br>
    每回合限1次：你成为伤害牌的目标时，可令1名有本技能的其他角色摸1张牌并将目标转移给其。`,
	AiSi_yzs: `爱思`,
	AiSi_yzs_info:`锁定技：你每回合首次指定或成为实体牌的唯一目标后若【爱意】数≤4，使用者可将此牌明置为你的【爱意】。<br>
    出牌阶段限1次：你获得任意张花色各异的【爱意】，然后复制1名无【爱慕】的角色角色牌上的通常技至你下一回合结束。若获得4张，再对其造成其体力值点伤害。<br>
    你【爱慕】发动次数上限+1。`,

	tonglv_yzs: `同旅`,
	tonglv_yzs_info: `锁定技：每公轮次开始时，你可选择1名其他角色，则本轮其每回合首次成为非延时锦囊牌的目标时，若你不为目标或使用者，你摸1张牌并成为额外目标。<br>
    游戏开始时，你依次视为使用【五谷丰登】和【桃园结义】。`,
	cangfa_yzs: `藏法`,
	cangfa_yzs_info: `你可将手牌当做【无懈可击】使用。若响应了你未记录过的牌，你记录之并增加1点手牌上限，本技能本回合失效。`,
	huatian_yzs: `花田`,
	huatian_yzs_info: `出牌阶段限1次：你令1名其他角色展示牌堆顶4张牌，其与你依次获得其中1种花色的牌，然后你令其或你恢复X点体力（X为剩余花色数）。`,
	tanbao_yzs: `贪宝`,
	tanbao_yzs_info: `你摸牌时可多摸至多2张，然后你展示所摸的牌，若其中有♠，你受到1点无来源伤害，或弃置等量张手牌。`,

	zhenglv_yzs: `征旅`,
	zhenglv_yzs_info: `锁定技：场上角色的出牌阶段限1次：其视为对你使用【借刀杀人】，若你因此造成伤害，你与其依次摸1张牌并可弃1张牌，你记录其所弃牌的点数。`,
	zhuxiang_yzs: `铸像`,
	zhuxiang_yzs_info: `${get.poptip("eternalSkill_yzs")}：场上角色指定或成为【杀】的目标后，若之点数你记录过，你可令其摸1张牌，然后其可弃1张手牌以令之不可响应。`,
	yongyi_yzs: `勇毅`,
	yongyi_yzs_info: `转换技：需要时，你可视为使用或打出：①普通【杀】 ②【闪】。 `,

	guangyousheguainiao_yzs: `广有射怪鸟`,
	guangyousheguainiao_yzs_info: `锁定技：出牌阶段开始时你获得2张符卡。<br>回合开始时，你摸你上一自轮次出牌阶段数张牌。<br>
    你有额外手牌区，称为<font color="#ffac27">“半灵”</font>(初始4张牌)，原本的手牌区称为<font color="#1fffc0">“妖梦”</font>。你的回合内和出牌阶段内你启用<font color="#1fffc0">妖梦</font>，否则启用<font color="#ffac27">半灵</font>。<br>
    每名角色的出牌阶段结束时，你移动<font color="#1fffc0">妖梦</font>X张牌至<font color="#ffac27">半灵</font>，若X≥4则你获得1张符卡，（X为你本阶段使用或重铸锦囊牌数）
	然后若<font color="#ffac27">半灵</font>比<font color="#1fffc0">妖梦</font>恰多Y张牌，交换<font color="#1fffc0">妖梦</font>与<font color="#ffac27">半灵</font>的牌并获得1枚${get.poptip("guangyousheguainiao_yzs_ling")}标记。（Y为本自轮次获得【灵】标记数）<br>
    <font color="#1fffc0">妖梦</font>牌数＜/≥<font color="#ffac27">半灵</font>时，你可将<font color="#1fffc0">妖梦</font>与<font color="#ffac27">半灵</font>各一张同花色牌当做【无中生有】/【铁索连环】使用或重铸。`,
	guangyousheguainiao_yzs_youmu: `<font color="#1fffc0">妖梦</font>`,
	guangyousheguainiao_yzs_backup:"广有射怪鸟",
	guangyousheguainiao_yzs_banling:`<font color="#ffac27">半灵</font>`,
	guangyousheguainiao_yzs_ling: "灵",
	guangyousheguainiao_yzs_ling_info:`拥有2枚时，你全部移除之并进行出牌阶段`,
	liugenqingjingzhan_yzs: `六根清净斩`,
	liugenqingjingzhan_yzs_backup:`六根清净斩`,
	liugenqingjingzhan_yzs_info:`锁定技：你使用或重铸即时非伤害锦囊牌时，记录之。<br>符卡：无咏唱：你选择：①视为使用上一记录牌或摸1张牌；<br>
②将${get.poptip("guangyousheguainiao_yzs")}中一个牌名改为另一个，若二者因此相同，将1张牌当做被改变的牌使用或重铸；若否，摸或弃2张牌。`,

	shane_yzs: `善恶`,
	shane_yzs_info: `每回合限1次：你可将基本牌当做无次数距离限制、效果值为X的【桃】或【杀】使用，若与上次发动时牌名相同，令X+1，否则重置X、摸2张牌并令之不可响应。（X初始为1）`,
	yuduo_yzs: `予夺`,
	yuduo_yzs_info: `${get.poptip("eternalSkill_yzs")}：你杀死其他角色的奖惩改为摸3张牌、增加2点体力上限并恢复1点体力。 <br>
    你令其他角色恢复体力溢出后，摸3张牌，判断胜负时其视为已死亡。`,

	yanjiao_yzs: `严教`,
	yanjiao_yzs_info: `锁定技：你不因本技能摸牌后摸1张牌。<br>你受到伤害时摸1张牌并将1张牌当做【闪电】对伤害来源使用。<br>你每次进行判定后摸1张牌。<br>场上角色判定区的【闪电】无容量限制！`,
	choubei_yzs: `抽背`,
	choubei_yzs_info: `你可将♠手牌当做【闪电】使用。你无视雷电伤害。`,

	OnionCells_yzs: `洋葱细胞`,
	OnionCells_yzs_info: `锁定技：游戏开始时，你选择X/2名其他人物（X为其他人物数，向下取整），其即将死亡时你于其下家召唤${get.poptip("OnionMan_yzs2")}（初始手牌数为4）。`,
	Quirk_yzs: `怪癖`,
	Quirk_yzs_info: `你不可成为其他角色的锦囊牌或【桃】的目标。`,
	Absurd_yzs: `荒诞`,
	Absurd_yzs_info: `你不因此使用非延时锦囊牌后，你视为使用你不因此使用的上张非延时锦囊牌。`,

	chaoren_yzs: `超人`,
	chaoren_yzs_info: `锁定技：回合开始时，你投掷3枚骰子，然后将投掷结果从高至低依次填入你以下数值：（无对应结果的项数值不变，至少为1）<br>
	<small>手牌上限、摸牌数、进攻距离</small>`,
	chaoren_yzs_name1: "超人「圣白莲」",
	chaoren_yzs_name2:"大魔法「魔神复诵」",
	youxingsheng_yzs: `游行圣`,
	youxingsheng_yzs_name:"吉兆「紫色云路」",
	youxingsheng_yzs_info: `锁定技：${get.poptip("chaoren_yzs")}结算后，你选择：<br>
①此后【超人】多投掷1枚骰子；<br>②将以下一项数值移动至【超人】描述末尾： <br>
  <small>出【杀】数、防御距离、【杀】需响应数</small><br>
    以上均移动后，②选项改为“令【超人】中一项数值+2”，此后你投掷结果+1。`,

	ReverseInvoker_yzs: `逆向呼神`,
	ReverseInvoker_yzs_info: `每公轮开始时，你可弃2张牌并令任意角色执行回合，此回合结束后其翻面。<br>
    每名角色回合结束时，其可将1~2张手牌展示并置底，然后若均为黑色则其摸等量张牌。<br>
    准备阶段，你展示并获得牌堆底牌直至展示红色牌。`,
	houhukuangyan_yzs: `后户狂言`,
	houhukuangyan_yzs_info: `锁定技：${get.poptip("xianzheyuyan_yzs")}未生效而进入弃牌堆后，原持有者失去1点体力。<br>
    转换技：需要时，你翻面并视为使用①【桃】②【无懈可击】。<br>
    出牌阶段，你可将牌堆底牌当做【贤者预言】对无此牌的角色使用，然后若之为黑色，你失去1点体力且本回合不可再如此做。`,

	CityWill_yzs: `都市之意`,
	CityWill_yzs_info: `锁定技：当前无${get.poptip("CityWill_yzs_command")}时，你将牌堆顶牌明置于任意角色旁称为【指令】。`,
	CityWill_yzs_command_info:`“阳·比斯莫克”或 【指令】持有者 使用与【指令】颜色相同的牌时移去【指令】，令使用者依条件达成与否发动对应效果：
黑色：此牌具伤害效果：达成则摸1张牌，否则失去1点体力。<br>红色：此牌具恢复效果：达成则恢复1点体力，否则弃1张牌。<br>
效果结算后若“阳·比斯莫克”为使用者，其摸1张牌。“阳·比斯莫克”达成【指令】后可令手牌上限+1。`,
	FreeWill_yzs: `自由意志`,
	FreeWill_yzs_info: `锁定技：每回合限1次：【指令】效果结算前，若你手牌上限＞0，你可令本次结算效果改为你摸1张牌，然后你手牌上限-1。`,
	LiberationTide_yzs: `解放之潮`,
	LiberationTide_yzs_info: `使命技：成功：准备阶段若你手牌上限为0：你分配2点体力恢复，此后${get.poptip("FreeWill_yzs")}无次数限制。<br>
失败：牌堆洗切后：你失去【自由意志】，此后【指令】被达成后你分配1点伤害。`,
	
	MadeInAbyss_yzs: `来自深渊`,
	MadeInAbyss_yzs_info: `${get.poptip("zhuanlunji_yzs")}：你使用或打出牌时，若之点数≤本回合你使用或打出的上张牌，摸1张牌，否则你：<br>
<font color="#ffeac2">①重铸1张牌</font> ②弃置1张牌 ③弃置全部手牌 ④失去2点体力 ⑤翻至背面 ⑥失去全部通常技和体力 ⑦死亡。<br>
然后若之点数为A，转轮至下一项。你摸牌数为当前项序号。<br>
    转轮至②/⑤时，你获得${get.poptip("BlazeLeap_yzs")}/${get.poptip("YourWorth_yzs")}。<br>
    出牌阶段若当前项为⑦，你可失去本技能，然后令任意名角色重新加入游戏（无初始手牌）。`,
	BlazeLeap_yzs: `无尽锤`,
	BlazeLeap_yzs_info: `你可将1张牌当做${get.poptip("kuangchangbaozha_yzs")}使用，若转化底牌不为武器牌，本技能本回合失效。`,
	YourWorth_yzs: `白笛`,
	YourWorth_yzs_info: `每自轮次限1次：出牌阶段，你可令任意角色于本回合结束后翻至正面并执行额外回合，若其不为你，你失去1点体力。`,

	huozangpao_yzs: `火葬炮`,
	huozangpao_yzs_info: `游戏开始时你翻面，然后横置并摸2张牌。<br>出牌阶段限1次：你视为使用伤害为2的${get.poptip("huogong")}，结算后你翻至背面，若未造成伤害则你摸2张牌。`,
	lianhuan_yzs: `链环`,
	lianhuan_yzs_info:`锁定技：你对横置的其他角色造成属性伤害时，将其重置并令伤害+1。<br>横置的角色受到伤害时，若你横置，你可重置并无效之。<br>
    你使用或打出牌时，若横置角色数：&lt/&gt2，你可横/重置1名角色；=2，你可横或重置1名角色。然后若横置角色数≠2，因此横/重置者摸/弃1张牌。`,

	danmubianhua_yzs: `弹幕变化`,
	danmubianhua_yzs_info: `锁定技：其他角色投掷结果为6时你获得1张${get.poptip("Fuka_yzs")}。<br>弃牌阶段，你可改为展示并弃置手牌中任意一种花色的牌。<br>
    你可召引${get.poptip("SmokeStorm")}。回合开始时，若当前为【烟风暴】，你可终止之并摸4张牌。<br>
    你的上家回合结束后，若你已死亡：${get.poptip("throw_yzs")}6：你于原座次重新加入游戏。`,
	SmokeStorm_skill: "烟风暴",
	SmokeStorm_skill_info: `场上角色回合开始时${get.poptip("throw_yzs")}4：恢复1点体力。`,
	SmokeStorm_skill_instant_buff:`烟风暴`,
	SmokeStorm_instant_info: `烟风暴：召引者可令任意角色下次投掷结果为6`,
	niaoshouxihua_yzs: `鸟兽戏画`,
	niaoshouxihua_yzs_info: `${get.poptip("FukaSkill_yzs")}：${get.poptip("wuyongchang_yzs")}：你观看1名其他角色的手牌，
	然后展示并扣置你与其共计至多3张同花色牌至本阶段结束，然后你获得等量枚${get.poptip("niaoshouxihua_yzs_zhashu")}标记，上限为5。<br>`,
	niaoshouxihua_yzs_zhashu: `诈术`,
	niaoshouxihua_yzs_zhashu_info:`场上角色投掷后，你可移除任意枚本标记（无论你是否在场），然后令投掷结果±等量`,
	manyuefuwu_yzs: `满月腹舞`,
	manyuefuwu_yzs_info: `锁定技：出牌阶段限1次：${get.poptip("throw_yzs")}6：制作1枚${get.poptip("Totem_yzs")}。<br>
    出牌阶段限1次：投掷6：令1名其他角色执行出牌阶段。<br>
    ${get.poptip("FukaSkill_yzs")}：${get.poptip("wuyongchang_yzs")}：令任意角色下次投掷要求-2。`,

	jisu_yzs: `寄宿`,
	jisu_yzs_info: `锁定技：无${get.poptip("aoman_yzs")}的角色出牌阶段开始时，你可观看其手牌，若其手牌不满四种花色，你可给予其不同花色的手牌。
	若其手牌花色因此补齐，你与其复制对方角色牌上的通常技至各自下一回合结束，然后你与其交换手牌，你执行出牌阶段。`,

	kuangbao_yzs: `狂暴`,
	kuangbao_yzs_info: `锁定技：你受到伤害后摸等量张牌并标记伤害来源。<br>你发动过上述效果的回合结束时，你摸2张牌并执行额外回合，
	此回合内你视为拥有${get.poptip("wusheng")}${get.poptip("paoxiao")}且使用牌仅可指定你或你本回合标记过的角色为目标。`,

	haiyi_yzs: `骇移`,
	haiyi_yzs_info: `隐匿技：你于自己回合内登场后，获得场上任意张装备。<br>一张目标不包含你的牌结算后，你摸1张牌，然后若你手牌数＞手牌上限，你弃1张牌，若为装备牌则你对使用者造成1点伤害。`,

	jianshi_yzs: `监视`,
	jianshi_yzs_info: `隐匿技：你于自己回合内登场后，获得弃牌堆中至多2张任意牌。<br>其他角色的手牌对你可见。其他角色摸牌前，你观看牌堆顶等量张牌并可与你的手牌任意交换，然后你可获得其区域内1张牌，则本回合你不可再发动本效果。`,

	chuyi_yzs: `除疫`,
	chuyi_yzs_info: `隐匿技：你于自己回合内登场后，你可视为使用不可响应的普通【杀】。<br>你令场上角色恢复体力时，可令恢复值+2，然后若其不为你且你已对其发动过本技能，你可令其死亡。你的【杀】造成伤害时可改为令受伤角色濒死。`,

	fuqu_yzs: `腐躯`,
	fuqu_yzs_info: `你未装备防具时，视为装备【藤甲】。<br>
	每公轮限1次：其他角色回合开始时，你可获得其至多2张牌并令其选择：①失去1点体力；②自己手牌上限-2并令你本回合调离。`,

	LightContainmentBreak_yzs: `收容失效`,
	LightContainmentBreak_yzs_info: `锁定技：游戏开始时你抽取X个随机的SCP（X为场上角色数，仅你可见）。每公轮开始时，你将武将牌替换为任意一个SCP，然后隐匿。`,
	LCB_yzs: `收容失效`,
	LCB_yzs_info: `锁定技：游戏开始时你抽取X个随机的SCP（X为场上角色数，仅你可见）。每公轮开始时，你将武将牌替换为任意一个SCP，然后隐匿。`,

	zhuofu_yzs: `着符`,
	zhuofu_yzs_info: `锁定技：游戏开始时场上角色依次附着随机一种花色。<br>你的有花色牌指定或响应其他角色后，令其附着相同花色。<br>
	每名角色再次被附着花色时失去其先前花色。`,
	fuli_yzs: `符力`,
	fuli_yzs_info: `锁定技：当其他角色附着的花色变动时，你根据变动前其附着的花色发动对应效果（优先结算♠的效果）：<br><small>
♠：每自轮次限3次：你可令1名角色附着♠。<br>♣：你可将1张牌重铸或当做${get.poptip("tiesuo")}对其使用。<br>♥：你可将1张牌当做火【杀】对其使用。<br>
♦：你获得其1张牌，然后其摸1张牌。<br>（第二名角色附着♠时，原先♠角色失去附着的花色。）</small>`,
	yifu_yzs: `移符`,
	yifu_yzs_info: `锁定技：每自轮次限1次：${get.poptip("wuyongchang_yzs")}：你失去1点体力，然后摸1张牌并令2名角色交换其附着的花色。`,
	huanfu_yzs: `幻符`,
	huanfu_yzs_info:`锁定技：你附着的花色变动时，你根据变动前附着的花色发动对应效果，然后可重铸1张手牌：<br><small>
♠：你刷新${get.poptip("yifu_yzs")}。<br>♣：你将护甲值调整至1。<br>♥：你可将1张牌当做【桃】对自己使用。<br>♦：你摸1张牌。</small>`,

	luoxuanwan_yzs: `螺旋丸`,
	luoxuanwan_yzs_info: `你可将任意张【杀】当做伤害值为底牌数的普通【杀】使用，然后摸等量张牌。`,
	feileishen_yzs: `飞雷神`,
	feileishen_yzs_info:`锁定技：出牌阶段，你可将1张手牌暗置于其他角色角色牌旁称为【苦无】（每名角色至多1张）。<br>
    你指定或成为【苦无】拥有者使用牌的目标后，你可使用其【苦无】，或观看其手牌并用其1张手牌交换其【苦无】。<br>
    限定技：出牌阶段，你可获得场上所有【苦无】，然后刷新出【杀】数。 `,

	yeya_yzs: `夜鸦`,
	yeya_yzs_down:`鸦印`,
	yeya_yzs_info: `锁定技：游戏开始时你将牌堆顶牌扣置为【鸦印】。你失去黑色牌后，将牌堆顶等量张牌加入【鸦印】。<br>
    【鸦印】数＞你体力值时，依次移去【鸦印】至二者相等。<br>
    你移去黑/红色【鸦印】时召引${get.poptip("BulletStorm")}/${get.poptip("WaterStorm")}。若已为对应风暴，改为摸1张牌。`,
	anmo_yzs: `暗魔`,
	anmo_yzs_info: `锁定技：你对其他角色造成伤害时视为对自己使用普通【杀】。你成为【杀】的目标时可将1张【鸦印】翻面。<br>
    你每移去1张明置的【鸦印】后，可指定1名其他角色，然后其需弃1张点数＞此【鸦印】点数的牌，否则失去1点体力。`,
	pipan_yzs: `踏履`,
	pipan_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你可令${get.poptip("yeya_yzs")}无效至本回合结束，
	然后你展示任意角色的全部手牌并令其将其中的黑色牌依次当做普通【杀】对你使用，然后你依次移去全部【鸦印】。`,

	mixiang_yzs: `迷香`,
	mixiang_yzs_info: `转换技：需要时，你可视为使用或打出：①【闪】②【无懈可击】。`,
	jingjue_yzs: `警觉`,
	jingjue_yzs_info:`每回合限1次：你使用非伤害牌后，可弃置1名角色1张牌，然后若其攻击范围包含你，刷新本技能。`,
	shuyu_yzs: `赎愈`,
	shuyu_yzs_info:`锁定技：每回合限1次：你可将♥牌当做【桃】使用，结算后目标角色可给予你1张手牌以刷新本技能，或摸2张牌。<br>
    你令一名角色脱离濒死后可失去${get.poptip("yinju_yzs")}，此后你的【桃】可指定任意角色为目标，且使用时目标角色摸1张牌。`,

	Sacrifice_yzs: `献祭`,
	Sacrifice_yzs_info: `${get.poptip("eternalSkill_yzs")}：每公轮限1次：每回合结束后，你可令1名体力值≤轮次数的人物替换人物牌至“${get.poptip("tentacle_yzs")}”并回复1点体力，
	或令1名“深渊之触”受到1点无来源伤害。`,
	ReligiousOrder_yzs: `教团`,
	ReligiousOrder_yzs_info: `锁定技：回合开始时和结束时，你刷新${get.poptip("Sacrifice_yzs")}或摸1张牌。<br>
    其他角色的结束阶段，你可给予其1张手牌，然后其选择：失去1点体力，或令你回复1点体力。`,

	AbyssServant_yzs: `深渊之仆`,
	AbyssServant_yzs_info:`锁定技：你的体力上限和摸牌数等于当前轮次数，出【杀】数等于体力值。<br>
    你受到伤害后替换回原人物牌。摸牌阶段，你可改为受到1点无来源伤害。`,

	zaoxingshu_yzs: `造形术`,
	zaoxingshu_yzs_info:`锁定技：你使用的虚拟牌不可被响应。<br>
    每回合每种牌名限1次：需要时，你可视为使用【无中生有】。你因此获得牌时，展示之并将其中任意个即时牌名加入上述描述。每加入1个基本牌名，你扣除1点体力上限。`,

	rg_zheng: `狰`,
	rg_zheng_info: `每回合限2次：你受到其他角色造成的伤害结算后，可对伤害来源使用1张【杀】（无次数距离限制）。`,
	rg_zhenzhu: `珍珠`,
	rg_zhenzhu_info: `每回合首次恢复体力后获得1点护甲。`,
	rg_zhaocai: `招财`,
	rg_zhaocai_info: `准备和结束阶段开始时，你摸1张牌。`,
	rg_niehuo: `涅火`,
	rg_niehuo_info: `每回合结束时，若你体力值为1，你恢复1点体力。`,
	rg_fuyi: `蝠翼`,
	rg_fuyi_info: `你每回合首次造成伤害后恢复1点体力并摸1张牌。`,
	rg_xinyang: `信仰`,
	rg_xinyang_info: `每回合限10次：你失去最后的手牌时摸1张牌。`,
	rg_gongzhen: `共振`,
	rg_gongzhen_info: `每回合每种牌名限1次：你使用牌造成伤害后，可弃1张手牌以对此牌的目标之一造成1点伤害。`,
	rg_nuzhou: `怒咒`,
	rg_nuzhou_info: `出牌阶段开始时，你可失去1点体力，然后你摸2张牌且本阶段出【杀】数+1。`,
	rg_shanghunniao: `伤魂鸟`,
	rg_shanghunniao_info: `其他人物死亡后，你恢复2点体力，此后你摸牌数和出【杀】数+1。`,
	rg_yuanhu: `援护`,
	rg_yuanhu_info: `每回合限1次：其他角色受到伤害时，若来源不为你，你可弃1张牌替其承受。`,
	rg_mumei: `木魅`,
	rg_mumei_info: `每回合限1次：其他角色造成伤害后，你可弃置其至多X张牌（X为其本回合造成伤害次数）。`,
	rg_tonghui: `同辉`,
	rg_tonghui_info: `每回合限1次：你摸牌后，可令至多等量名角色摸1张牌。`,
	rg_dizang: `地藏`,
	rg_dizang_info: `每回合限1次：你体力值减少后，可令至多X名角色获得1点护甲（X为减少值）。`,
	rg_chunniang: `醇酿`,
	rg_chunniang_info: `出牌阶段限1次：你可将1张手牌当做【酒】或【桃】使用。`,
	rg_huajing: `化境`,
	rg_huajing_info: `每回合开始时你可将1张手牌当做【酒】使用。你未受到过伤害的回合结束时，若你处于醉酒状态，则可使用1张【杀】。`,
	rg_shiminggan: `使命感`,
	rg_shiminggan_info: `每回合首次有其他角色受到伤害后，你摸2张牌并可对其使用任意张非伤害手牌(无次数距离限制)，然后你弃2张牌。`,
	rg_xuedizi: `血滴子`,
	rg_xuedizi_info: `每回合限1次：你摸牌后，若其中有【杀】，你可展示之并使用其中的任意张【杀】。`,

	dajiangshanlan_yzs: `大江山岚`,
	dajiangshanlan_yzs_info: `锁定技：你醉酒状态无持续时长限制。<br>你处于醉酒状态时，你的【杀】无次数距离限制。`,
	sanbubisha_yzs: `三步必杀`,
	sanbubisha_yzs_info: `锁定技：每局游戏限3次：需要时，你可视为使用【酒】（有次数限制）。<br>
	若本技能已耗尽次数，你使用【杀】时重置本技能、摸3张牌并令之不可响应。`,
	guiqikuanglan_yzs: `鬼气狂澜`,
	guiqikuanglan_yzs_info: `觉醒技：你使用【杀】单次造成≥4点伤害后，你觉醒：你使用【酒】的次数上限+1。`,

	dajiejie_yzs: `大结界`,
	dajiejie_yzs_info: `锁定技：回合开始时你获得[1]张${get.poptip("Fuka_yzs")}。你使用或打出红色牌时获得[0]张符卡。游戏开始时你召唤“${get.poptip("Barrier_yzs")}”至任意座次。`,
	erchongjiejie_yzs: `二重结界`,
	erchongjiejie_yzs_info: `${get.poptip("FukaSkill_yzs")}：若场上无“${get.poptip("subBarrier_yzs")}”，召唤“子结界”至任意座次，然后你选择其朝向（顺或逆时针），该朝向上直至“结界”路径内称为“${get.poptip("InBarrier_yzs")}”。<br>
	“子结界”死亡时你获得[1]张${get.poptip("Fuka_yzs")}。`,
	yinyangyu_yzs: `阴阳玉`,
	yinyangyu_yzs_info: `符卡：你摸[1]张牌，然后观看并与[1]名其他角色交换[1]张手牌，无论如何你本回合出【杀】数+[0]并获得[0]枚【梦】标记，
	然后可令“结界”或“子结界”顺或逆时针移动[0]个座次。`,
	mengxiangfengyin_yzs: `梦想封印`,
	mengxiangfengyin_yzs_info: `符卡：移除X枚【梦】标记，然后从任意结界内角色开始，结界内角色依次受到1点伤害，共计X/3点。（向下取整）`,

	Reimu_yzs_Barrier_yzs_skill: `大结界`,
	Reimu_yzs_Barrier_yzs_skill_info: `锁定技：你无回合、区域。<br>路径经过你的距离计算均改为无限。`,
	Reimu_yzs_subBarrier_yzs_skill: `二重结界`,
	Reimu_yzs_subBarrier_yzs_skill_info:`锁定技：你无回合、区域。<br>路径经过你的距离计算均改为无限。<br>
    你需使用或打出牌时，“博丽灵梦”可替你出之（视为由你使用或打出）。`,

	InBarrier_yzs_skill: `博丽结界`,

	pingpongWaiJiao_yzs: `乒乓外交`,
	pingpongWaiJiao_yzs_info: `出牌阶段限1次：你给予1名其他角色任意张牌，然后其需给予你等量-1张手牌或1张【桃】。若你给出≥4张，你令其跳过下一出牌或弃牌阶段。`,
	huhua_yzs: `护花`,
	huhua_yzs_info: `其他角色需要使用或打出【闪】时你可替其出之（视为由其使用或打出）。你使用【桃】后获得1点护甲。`,

	PhoenixLegend_yzs: `不死鸟传说`,
	PhoenixLegend_yzs_info: `锁定技：游戏开始时你获得3点护甲。你无弃牌阶段。<br>其他角色受到伤害时，你可无效之然后受到伤害来源造成的等量伤害。
	<br>你可将黑色牌当做【无懈可击】或【闪】使用或打出。<br>回合结束时你失去体力至1点，然后获得等量护甲。<br>
	回合开始时，你获得1张${get.poptip("Fuka_yzs")}，然后若你护甲值≥6，你失去全部护甲、摸牌至手牌数为4，然后获得下列效果至你下回合开始：<br>
	“你体力值不可下降。你主动弃置红色牌时获得1张符卡。”`,
	PhoenixLegend_yzs_buff:`不死鸟传说`,
	HumanBuring_yzs: `人体自燃`,
	HumanBuring_yzs_info: `${get.poptip("FukaSkill_yzs")}：你选择：①弃1张红色牌以视为使用【决斗】，然后摸1张牌；②弃任意张黑色牌，然后恢复弃牌数向下取半数点体力。`,

	DreamCatcher_yzs: `捕梦网`,
	DreamCatcher_yzs_info: `锁定技：场上角色弃牌阶段弃牌后，其可交换手牌与弃置的牌，则本回合结束后你与其依次执行额外出牌阶段。`,
	DreamInMe_yzs: `梦我梦中`,
	DreamInMe_yzs_info: `锁定技：你使用牌被无效后，你可视为使用任意单体即时牌，因此使用伤害牌或${get.poptip("mengliaoshibian_yzs")}后本阶段本技能失效。<br>出牌阶段开始时你视为使用${get.poptip("mengliaoshibian_yzs")}。`,

	DisorderEye_yzs: `狂气之瞳`,
	DisorderEye_yzs_info: `锁定技：回合开始时你获得3张${get.poptip("Fuka_yzs")}。<br>
    你的非基本牌视为【杀】，你的【杀】效果改为：
	<small>“你可将目标角色1张牌扣置为“虚弹”（超过5张时移去至5张），无论如何你可给予目标角色1张“虚弹”并摸1张牌。”</small><br>
    你的出牌阶段结束时，场上角色依次调整手牌数至其本阶段开始时值。`,
	DisorderEye_yzs_damagex:`幻弹「幻想视差」`,
	DisorderEye_yzs_bullet:`虚弹`,
	VisionaryTuning_yzs: `幻视调律`,
	VisionaryTuning_yzs_backup:`幻视调律`,
	VisionaryTuning_yzs_info: `转换技（回合开始时重置）：出牌阶段：<br>
虚：移去4张非♠“虚弹”，然后令1名不处于“狂”状态的角色下回合摸牌数-2并进入“狂”状态；<br>
实：移去4张♠“虚弹”，然后对任意角色造成1点伤害并令其退出“狂”状态。<br>
无论如何你获得1张${get.poptip("Fuka_yzs")}。`,
	LunaticRedEyes_yzs: `幻胧月睨`,
	LunaticRedEyes_yzs_info: `${get.poptip("FukaSkill_yzs")}：选择1项：<br>虚：令任意2名角色交换手牌；<br>
实：令任意角色摸4张牌，然后你本回合对其使用【杀】无次数和距离限制。`,
	InvisibleFullMoon_yzs: `隐形满月`,
	InvisibleFullMoon_yzs_info: `${get.poptip("wuyongchang_yzs")}：你将全部手牌弃置或置顶，然后选择：<br>
①获得1个“满月”；<br>②符卡：摸等量张牌，然后可将所弃置牌中任意张叠置为1个“满月”，至多2个。`,

	xuanhujishi_yzs: `悬壶济世`,
	_xuanhujishi_yzs_zhulu:`珠露`,
	xuanhujishi_yzs_info: `锁定技：出牌阶段限1次，你将全部手牌明置于1名无“${get.poptip("xuanhujishi_yzs_zhulu")}”的角色旁称为“珠露”，或与1名“珠露”持有者交换手牌。然后你摸牌至手牌上限。`,
	wangwenwenqie_yzs: `望闻问切`,
	wangwenwenqie_yzs_info: `锁定技：出牌阶段，你可与1名其他“${get.poptip("xuanhujishi_yzs_zhulu")}”持有者拼点，胜者获得拼点牌。若平局，本技能本阶段失效，然后刷新${get.poptip("xuanhujishi_yzs")}。`,
	shijiebuju_yzs: `时节不居`,
	shijiebuju_yzs_info: `锁定技：你造成或受到伤害时，若伤害来源为“${get.poptip("xuanhujishi_yzs_zhulu")}”持有者，其交换“珠露”与原手牌。`,

	kending_yzs: `肯定`,
	kending_yzs_info: `锁定技：回合结束时，若你手牌数≥3，你可令任意角色获得1枚${get.poptip("kending_yzs_mark")}标记。`,
	kending_yzs_mark: `肯定`,
	kending_yzs_mark_info:`拥有超过2枚时移除至2枚。被移除时拥有者选择令大佐：①：恢复1点体力； ②：摸2张牌然后给予其1张牌。`,
	bianzhuang_yzs: `变装`,
	bianzhuang_yzs_info: `锁定技：出牌阶段开始前，你可跳过出牌阶段和弃牌阶段并倒置人物牌进入“ikun”状态直至你下一回合开始，期间你可用技能${get.poptip("shiyoubing_yzs")}。`,
	shiyoubing_yzs: `食油饼`,
	shiyoubing_yzs_info: `锁定技：一张牌生效前，你可弃1张黑/红色牌令之无效/必定生效，然后使用者获得1枚${get.poptip("kending_yzs_mark")}。<br>
	回合外你累计发动本技能2次后退出“ikun”状态并移除场上全部【肯定】标记。`,
	juanKill_yzs: `卷の斩首`,
	juanKill_yzs_info: `你可将黑/红色牌当做${get.poptip("tiesuo")}/${get.poptip("huogong")}使用。<br>你可将装备牌当做${get.poptip("wuzhong")}使用。`,

	gaoluan_yzs: `搞乱`,
	gaoluan_yzs_info: `出、弃牌阶段各限1次：你指定X名角色（X为你体力值），将你与这些角色的手牌洗混，然后由你指定顺序，你与这些角色依次获得其中1张直至无剩余。`,
	xintaibaozha_yzs: `心态爆炸`,
	xintaibaozha_yzs_info: `你手牌数为全场最小时，你不可成为【杀】或【决斗】的目标。<br>受到伤害后你弃1~3张牌，若弃2/3张则你摸1张牌/恢复1点体力。`,
	nongdiu_yzs: `弄丢`,
	nongdiu_yzs_info: `出牌阶段，你可受到1点无来源伤害，然后令任意角色恢复1点体力。`,

	ShakingSpirit_yzs:`摇动之意志`,
	ShakingSpirit_yzs_info: `锁定技：出牌阶段开始时你弃2张手牌。<br>你的手牌【杀】伤害为0。<br>你受到伤害后跳过下一摸牌阶段。`,
	GodgivenSwordsmanship_yzs: `神赋之剑技`,
	GodgivenSwordsmanship_yzs_info: `锁定技：你发动【技能】时获得1点【技】。<br>你拥有3点【技】时消耗所有【技】并进入“${get.poptip("GodgivenSwordsmanship_yzs_tongshen")}”，
	然后你摸牌至手牌数为6并升1级。<br>你初始Lv为1。达到对应Lv时可用对应技能或效果。`,
	GodgivenSwordsmanship_yzs_tongshen:`通神`,
	MandateAura_yzs: `天命光环`,
	MandateAura_yzs_info: `锁定技：回合结束时若你无手牌，则：你获得1点【技】、摸2张牌并升1级。`,
	xiangjian_yzs: `相剑`,
	xiangjian_yzs_info: `【技能】：每自轮限1次：其他角色使用或打出【杀】时，你可弃1张手牌以无效之。
	<br><font color="#fa5c4c">【剑技】：你可额外弃1张手牌。若如此做，你弃置此【杀】来源1张牌，然后对其造成0点伤害。</font>`,
	jianzhi_yzs: `剑指`,
	jianzhi_yzs_qinggang: `剑指`,
	jianzhi_yzs_sha:`剑指`,
	jianzhi_yzs_info: `【技能】：转换技：①：出牌阶段：你弃2张手牌然后令1名其他角色防具无效且其下张【杀】伤害-1，直至你下回合开始。<br>
<font color="#fa5c4c">【剑技】：其下次造成非零伤害为0（可叠加）。</font><br>
②：你对其他角色造成伤害时，你可弃2张手牌，然后弃置其1张牌。<br><font color="#fa5c4c">【剑技】：其跳过下一摸牌阶段。</font>`,
	WindSword_yzs: `疾风剑`,
	WindSword_yzs_info: `&ltLv.5&gt【技能】：出牌阶段限1次：你弃1张手牌然后视为使用无距离限制的普通【杀】，若你无手牌，则之伤害+1且无视其他角色防具。<br>
	<font color="#fa5c4c">【剑技】：你可额外弃2张手牌，则此【杀】需用2张【闪】响应。<Lv.8>此次【技能】使用不计入次数。</font>`,
	CloudSword_yzs: `积云剑`,
	CloudSword_yzs_info: `&ltLv.15&gt【技能】：每自轮限1次：${get.poptip("wuyongchang_yzs")}：你弃4张手牌并获得1点【技】，然后你弃置任意角色1张牌。<br>
	<font color="#fa5c4c">【剑技】：你额外弃置其1张牌并对其造成0点伤害。</font>`,
	ThunderWithMe_yzs: `迅雷随我`,
	ThunderWithMe_yzs_info: `&ltLv.20&gt：此后你升级时可横置1名角色。你使用【杀】时可令之附带雷属性。`,

	jianren_yzs: `坚韧`,
	jianren_yzs_info: `锁定技：你体力值减少后，获得等量点护甲。<br>结束阶段，你失去所有护甲，然后恢复等量点体力。`,
	shantianji_yzs: `闪天击`,
	shantianji_yzs_info: `你可将基本牌当做伤害+X的普通【杀】使用，若底牌不为【杀】则不可响应。（X为你护甲值）`,
	qieyong_yzs: `怯勇`,
	qieyong_yzs_info:`锁定技：若你无护甲，你受到非零伤害+1。<br>
    其他角色受到非零伤害时，若伤害来源不为你，你可弃置全部手牌（至少1张），然后无效之并受到伤害来源造成的等量点伤害。`,

	BladeDemon_yzs: `剑魔`,
	BladeDemon_yzs_info: `锁定技：你体力值变动至≤1时，转换人物牌至“${get.poptip("BDXiangSiniao_yzs")}”，然后恢复体力值至1并重置${get.poptip("BloodFeast_yzs")}。`,
	BloodFeast_yzs: `血宴`,
	BloodFeast_yzs_info: `锁定技：你摸牌数-2、出【杀】数-1。<br>每自轮限1次：${get.poptip("wuyongchang_yzs")}：发动序数等于你体力值的项的效果：<br>
①：恢复1点体力并制作1枚${get.poptip("Totem_yzs")}；<br>②：恢复或失去1点体力，然后摸2张牌；<br>③：调整手牌数至上限，然后失去1点体力。`,
	BloodCovenant_yzs: `血契`,
	BloodCovenant_yzs_info: `出牌阶段限1次：你令任意角色发动其中一项，然后你发动另一项：<br>①：摸X张牌，然后你失去1点体力；<br>②：弃X张手牌。<br>（X为你体力值）`,
	DemonBlade_yzs: `魔剑`,
	DemonBlade_yzs_info: `锁定技：你体力值变动至≥3时，转换人物牌至“${get.poptip("BDCheTianke_yzs")}”并重置${get.poptip("BloodFeast_yzs")}。<br>
    你使用【杀】无次数限制。你造成伤害后恢复等量点体力。`,

	ExFighting_yzs: `极限格斗`,
	ExFighting_yzs_info: `锁定技：每回合内你使用或打出第X张牌时摸X张牌。（X为你攻击范围且至少为1）<br>
    你使用【杀】指定目标时，若你计算与目标角色距离为X，你召引${get.poptip("BulletStorm")}或对其造成1点伤害。`,
	BruteForceArmament_yzs: `蛮力武装`,
	BruteForceArmament_yzs_info: `锁定技：你视为装备${get.poptip("IronFist_yzs")}和${get.poptip("SteelArmor_yzs")}。`,

	canhuozhong_yzs: `喰火种`,
	canhuozhong_yzs_info: `锁定技：出牌阶段，若当前为${get.poptip("FireStorm")}，你可终止之并进入${get.poptip("canhuozhong_yzs_effect")}状态。`,
	canhuozhong_yzs_effect: `激昂`,
	canhuozhong_yzs_effect_info:`你使用牌时受到1点无来源火焰伤害。你跳过弃牌阶段。`,
	xingnujingyan_yzs: `惺怒净炎`,
	xingnujingyan_yzs_info: `锁定技：${get.poptip("wuyongchang_yzs")}：你退出${get.poptip("canhuozhong_yzs_effect")}状态并令当前回合角色视为使用${get.poptip("kuangchangbaozha_yzs")}，
	且其可将其中的“锦囊牌”改为“任意一种类型的牌”。若你未因此恢复体力，${get.poptip("LavaShell_yzs")}${get.poptip("sing_yzs_count")}-1。`,
	LavaShell_yzs: `熔岩外壳`,
	LavaShell_yzs_info: `锁定技：${get.poptip("sing_yzs")}1：你获得1枚${get.poptip("LavaShell_yzs_mark")}标记。你体力值变动时本${get.poptip("sing_yzs_count")}-1。`,
	LavaShell_yzs_mark: `熔浆`,
	LavaShell_yzs_mark_info: `达到3枚时移除全部并摸3张牌，然后转换至${get.poptip("FireStorm")}或进入${get.poptip("canhuozhong_yzs_effect")}状态。`,

	bili_yzs: `弼骊`,
	bili_yzs_down:`弼骊(暗)`,
	bili_yzs_info: `锁定技：游戏开始时你摸4张牌明置于你人物牌旁，称为【优骏】。每有1张明/暗置【优骏】，你防御/进攻距离+1。<br>
    你使用【杀】时可翻转1张【优骏】，若翻转暗置【优骏】则此【杀】伤害+1。你的【杀】伤害-1。<br>
    出牌阶段，你可将红/黑色基本牌当做防御/进攻坐骑置入坐骑栏。<br>弃牌阶段若你坐骑栏已满，你可改为弃置全部坐骑。`,
	congling_yzs: `从令`,
	congling_yzs_info:`锁定技：你使用锦囊牌时翻转1张【优骏】，然后若你进攻距离为偶/奇数，你摸2张牌/弃2张手牌。<br>
    结束阶段，若你防御距离为0，你展示全部手牌然后弃置并视为使用其中的基本牌。`,

	wenyanxuci_yzs: `文言虚词`,
	wenyanxuci_yzs_buff0: `文言虚词`,
	wenyanxuci_yzs_buff0_info:`〇：回合开始时你将牌堆顶牌加入【虚词】至6张`,
	wenyanxuci_yzs_buff1: `文言虚词`,
	wenyanxuci_yzs_buff1_info: `Ⅰ：回合开始时你可交换手牌与【虚词】，则本回合你失去最后的手牌时摸1张牌、你使用【杀】无次数限制且弃牌阶段你改为弃全部手牌`,
	wenyanxuci_yzs_buff2: `文言虚词`,
	wenyanxuci_yzs_buff2_info: `Ⅱ：本回合你可发动${get.poptip("chongshi_yzs")}4次`,
	wenyanxuci_yzs_buff3: `文言虚词`,
	wenyanxuci_yzs_buff3_info: `Ⅲ：你选择令你本回合造成伤害时令之+1或恢复1点体力。你的【杀】被响应后，你可弃1张【杀】以令之仍生效`,
	wenyanxuci_yzs_buff4: `文言虚词`,
	wenyanxuci_yzs_buff4_info: `Ⅳ：回合开始时你可弃任意张牌以视为对至多等量-1名角色使用火【杀】。你因此造成伤害后，摸1张牌并可${get.poptip("chongshi_yzs")}之`,
	wenyanxuci_yzs_buff5: `文言虚词`,
	wenyanxuci_yzs_buff5_info: `Ⅴ：你不可成为【杀】和【决斗】的目标`,
	wenyanxuci_yzs_buff6: `文言虚词`,
	wenyanxuci_yzs_buff6_info: `Ⅵ：弃牌阶段结束时你恢复1点体力`,
	wenyanxuci_yzs_info: `锁定技：你手牌上限固定为6。你手牌数超过6时弃至6。<br>游戏开始时你摸2张牌，并将牌堆顶6张牌扣置为【虚词】。<br>
    你无摸牌阶段，你主动弃手牌时可移去【虚词】代替。<br>回合结束时你交换手牌与【虚词】，然后若二者张数相等，你弃1张手牌。<br>
	回合开始前，根据【虚词】数，你获得对应项效果至你下一回合开始前：<br>
Ⅵ：弃牌阶段结束时你恢复1点体力。<br>
Ⅴ：你不可成为【杀】和【决斗】的目标。<br>
Ⅳ：回合开始时你可弃任意张牌以视为对至多等量-1名角色使用火【杀】。你因此造成伤害后，摸1张牌并可${get.poptip("chongshi_yzs")}之。<br>
Ⅲ：你选择令你本回合造成伤害时令之+1或恢复1点体力。你的【杀】被响应后，你可弃1张【杀】以令之仍生效。<br>
Ⅱ：本回合你可发动${get.poptip("chongshi_yzs")}4次。<br>
Ⅰ：回合开始时你可交换手牌与【虚词】，则本回合你失去最后的手牌时摸1张牌、你使用【杀】无次数限制且弃牌阶段你改为弃全部手牌。<br>
〇：回合开始时你将牌堆顶牌加入【虚词】至6张。`,
	chongshi_yzs: `重拾`,
	chongshi_yzs_backup:`重拾`,
	chongshi_yzs_info: `出牌阶段限1次：你将1张手牌或【虚词】：加入【虚词】或置入你手牌区或置入弃牌堆。`,

	wanfa_yzs: `万法`,
	wanfa_yzs_info: `回合内每种牌名限1次：你可将手牌当做任意非延时锦囊牌使用，结算后目标角色获得${get.poptip("jiejie_yzs")}直至其下次受到【杀】造成的伤害后。`,
	kanpo_yzs: `瞰破`,
	kanpo_yzs_info: `锁定技：你使用非转化牌无视目标角色的${get.poptip("jiejie_yzs")}，结算后其失去【结界】。`,
	jiejie_yzs: `结界`,
	jiejie_yzs_info: `其他角色的锦囊牌对你无效。<br>结束阶段，你可失去本技能，然后摸2张牌。`,

	dianjin_yzs: `点金`,
	dianjin_yzs_info: `出牌阶段限1次：你令任意角色<font color="#f9be4d">“黄金化”</font>，直至其使用2张牌时或脱离濒死后。<br><small><font color="#f9be4d">“黄金化”：所有手牌视为【无中生有】。</font>`,
	dianjin_yzs_buff: `黄金化`,
	Deeagorze_yzs: `纵金`,
	Deeagorze_yzs_info: `锁定技：场上角色脱离<font color="#f9be4d">“黄金化”</font>后，你可对其以外的1名角色发动<font color="#f9be4d">${get.poptip("dianjin_yzs")}</font>。<br>
    每回合每种牌名限1次：需要对<font color="#f9be4d">“黄金化”</font>角色使用牌时，你可将<font color="#f9be4d">【无中生有】</font>当做任意即时牌对其使用。`,

	chaodaoti_yzs: `超导体`,
	chaodaoti_yzs_info: `锁定技：你因受到雷电伤害而体力减少时，改为恢复等量点体力并摸场上“超导”角色数张牌。<br>
    出牌阶段，你可弃1张♠牌并横置1名其他角色，视为处于“${get.poptip("chaodaoti_yzs_effect")}”。<br>
    你的普通【杀】视为雷【杀】。你视为处于“超导状态”。`,
	chaodaoti_yzs_effect:`超导`,
	jingdianmabi_yzs: `静电麻痹`,
	jingdianmabi_yzs_info: `你使用雷【杀】指定目标时，你可展示任意张黑色手牌然后扣置目标角色至多等量张手牌，其受到非雷电伤害时其获得之。`,

	Foolshuangsheng_yzs: "双生",
	Foolshuangsheng_yzs_info: `你拥有两个生灵与两个人物，当你受到伤害时，你可改为令一个未进入[量子态]的生灵进入[量子态]并摸一张牌且回复一点sp。<br>
	当你受到伤害时使当前人物进入[量子态]然后摸一张牌并切换至另一人物，若你回合开始时你的人物为[量子态]，你跳过回合并将sp值调整为3。<br>
	当你所有人物为[量子态]时你死亡。`,
	Foolchuangsheng_yzs: "创生",
	Foolchuangsheng_yzs_info: `使用点数≥上一次打出手牌时无限制且摸一弃一。你的出牌阶段限两次，你可以弃置一张[闪]切换“希儿”或[希儿]。`,
	Foolyanmie_yzs: "湮灭",
	Foolyanmie_yzs_info: `使用点数≤上一次打出手牌时无限制且摸一弃一。你的出牌阶段限两次，你可以弃置一张[闪]切换“希儿”或[希儿]。`,
	Foolxieshengzhijing_yzs: "撷生之境",
	Foolxieshengzhijing_yzs_info: `你造成伤害后恢复一点sp，致人濒死恢复一点sp。你可在受到伤害时弃置两张手牌抵挡之，若弃置手牌中有[闪]，则恢复一点sp。`,
	Foolniworuyi_yzs: "你我如一",
	Foolniworuyi_yzs_hujia: "你我如一(大招)",
	visible_Foolniworuyi_yzs_hujia:`你我如一`,
	Foolniworuyi_yzs_info: `①：消耗三点sp，切换当前人物，并将手牌补充至4。每回合限一次。<br>
②：“希儿”（[希儿]）时，消耗6点sp，使所有个体脱离量子态，摸一张牌明置于你的区域内当作[闪]，你的回合内可将其作任意牌使用。`,
	
	InvisibleHand_yzs: `无形之手`,
	InvisibleHand_yzs_info: `锁定技：摸牌阶段，你可改为摸5张牌并弃4张手牌。<br>你每主动弃置或使用1张你自己的红/黑色手牌时【市价】+/-1。<br>
<small>【市价】：记为<font color="#f9be4d">X</font>，初始为2，范围为[0，5]。`,
	FreeMarket_yzs: `自由市场`,
	FreeMarket_yzs_info: `锁定技：出牌阶段限1次：你弃<font color="#f9be4d">X</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，上限为3。<br>
    你受到伤害时，你可给予伤害来源1枚<font color="#f9be4d">【货】</font>以无效之，然后其弃<font color="#f9be4d">X-2</font>张手牌。（其依此法获得的<font color="#f9be4d">【货】</font>其本回合内不可主动售出）<br>
<small><font color="#f9be4d">【货】：场上角色其出牌阶段限1次：售出自己的1枚【货】并摸<font color="#f9be4d">X-2</font>张牌，若其为你，额外摸2张牌。</font>`,
	AnchoringEffect_yzs: `锚定效应`,
	AnchoringEffect_yzs_info: `锁定技：<font color="#f9be4d">【货】</font>标记被售出时你摸3张牌然后弃3张牌。你无弃牌阶段。`,
	ReminderNotice_yzs: `督!促!状!`,
	ReminderNotice_yzs_info: `锁定技：场上有人物因你的技能效果需弃牌时，若其因手牌不足而少弃牌，其每少弃1张牌便获得1点<font color="#f93838">【赤字】</font>。<br>
<small><font color="#f93838">【赤字】：每名角色至多拥有6点【赤字】。拥有者不因自己技能摸牌时改为减少等量【赤字】。</font>`,
	PonziScheme_yzs: `庞氏骗局`,
	PonziScheme_yzs_info: `锁定技：出牌阶段限1次：你令1名其他人物弃<font color="#f9be4d">X-2</font>张手牌，然后你获得1枚<font color="#f9be4d">【货】</font>且其获得1枚<font color="#bef750">【菜】</font>标记。<br>
	其回合开始时移除1枚<font color="#bef750">【菜】</font>，然后你给予其1枚<font color="#f9be4d">【货】</font>，若你无<font color="#f9be4d">【货】</font>则你立即发动此技能。<br>（每名人物至多拥有1枚<font color="#bef750">【菜】</font>，场上有2枚<font color="#bef750">【菜】</font>时你不可主动发动本技能）`,
	FinancialWaltz_yzs: `金融华尔兹`,
	FinancialWaltz_yzs_info: `限定技：${get.poptip("wuyongchang_yzs")}：你失去1点体力并令所有人物获得${get.poptip("InvisibleHand_yzs")}
（可触发${get.poptip("ReminderNotice_yzs")}），你失去${get.poptip("PonziScheme_yzs")}并清除场上的<font color="#bef750">【菜】</font>。<br>
场上人物的回合开始时其需弃<font color="#f9be4d">X</font>张手牌并获得1枚<font color="#f9be4d">【货】</font>，然后若其无手牌则需给予你1枚<font color="#f9be4d">【货】</font>。
<br><font color="#f9be4d">【货】</font>不可主动售出，改为“于回合开始前强制抛售1枚”。<br>
    若有人物准备阶段<font color="#f93838">【赤字】</font>达到6，本技能效果结算结束，然后<font color="#f93838">【赤字】</font>拥有者依次清除其全部<font color="#f93838">【赤字】</font>并失去1点体力；拥有<font color="#f93838">【赤字】</font>最多者额外失去1点体力。（你死亡后本技能依然结算）`,

	qiehou_yzs: `窃喉`,
	qiehou_yzs_info: `隐匿技：你于回合外登场时，可对当前回合角色发动本技能。你杀死其他角色后，可复制其1个通常技，或获得${get.poptip("paoxiao")}。`,
	xunsheng_yzs: `循声`,
	xunsheng_yzs_info: `你攻击范围内的角色的回合结束时，你可对其使用至多X张牌，然后摸使用牌数张牌。（X为其本回合造成伤害总值）`,
	qianfu_yzs: `潜伏`,
	qianfu_yzs_info: `结束阶段，你可翻面，然后摸3张牌并恢复1点体力。你背面朝上时，攻击范围+1。`,

	WeatherReport_yzs: `天气预报`,
	WeatherReport_yzs_info: `${get.poptip("zhuanlunji_yzs")}：<span class="bluetext">①每名角色准备阶段</span>②你的出牌阶段③每名角色结束阶段：开始时，你可使用1张单目标即时锦囊牌，然后召引任意 ${get.poptip("storm_yzs")}，此风暴持续效果增加“当前回合角色于此时机可视为使用此牌”。`,
	StormRain_yzs: `狂风暴雨`,
	StormRain_yzs_awaken:`狂风暴雨`,
	StormRain_yzs_info:`觉醒技：场上角色于其出牌阶段外对你使用牌时，你可弃置1张基本牌以取消其中一个目标。<br>
    出牌阶段结束时，若你召引过全部风暴或进入过濒死，你觉醒：此后你发动${get.poptip("WeatherReport_yzs")}无视“单目标”和“锦囊”条件。`,

	NuclearHeat_yzs: `核热`,
	NuclearHeat_yzs_info: `锁定技：一名角色受到火焰伤害后，依次执行：若其无手牌，你刷新${get.poptip("Tokamak_yzs")}；若伤害来源为你，其摸牌至3张；若其为你，你恢复等量点体力。`,
	Tokamak_yzs: `环流器`,
	Tokamak_yzs_info: `锁定技：一名角色因你的【火攻】而展示或弃置牌后，你将展示或弃置的牌明置于人物牌旁，称为【核】。<br>
    出牌阶段限1次：你视为使用伤害为0的【火攻】。`,
	SubterraneanSun_yzs: `地底太阳`,
	SubterraneanSun_yzs_info: `限定技：结束阶段，你可：依次将任意角色1张牌和3张【核】置入弃牌堆，若这四张牌花色各不相同，你分配1点火焰伤害并重复此流程。`,

	guanxing_yzs: `观星`,
	guanxing_yzs_info: `你的回合开始时，你可展示牌堆顶5张牌，记录并分配其中至多2种点数的牌，然后将剩余牌任意置顶或置底。<br>
    若你已记录所有点数，其他角色回合你亦可发动本技能。<br>你即将死亡时，可将本技能及你的记录给予1名其他角色。`,
	chushi_yzs: `处世`,
	chushi_yzs_info: `锁定技：你成为其他角色伤害牌的目标时，若你手牌数不为全场最值，其需改为令你摸或弃1张牌。<br>
    你濒死时可失去${get.poptip("guanxing_yzs")}，然后恢复全部体力并令${get.poptip("cesuan_yzs")}次数上限+1。`,
	cesuan_yzs: `测算`,
	cesuan_yzs_info: `出牌阶段限1次：你弃2张手牌并发动${get.poptip("guanxing_yzs")}，然后亮出并获得牌堆底牌，若之点数为弃置牌点数之和/差，你可令任意角色恢复1点体力/受到1点伤害。`,

	shigu_yzs: `识骨`,
	shigu_yzs_info: `锁定技：你神秘术恒为3张。<br>你的【杀】不计入手牌上限，且仅可当做【闪】使用或打出。<br>
    其他角色手牌数变动至与你相等时，你可令其他角色退出${get.poptip("shigu_yzs_buff")}，然后其进入【骨相】。你始终处于【骨相】。`,
	shigu_yzs_buff: `骨相`,
	shigu_yzs_buff_info: `【骨相】角色不可成为【桃】的目标且对 葛天 使用【杀】无次数限制。`,
	chenyuStorm_skill: "谶语风暴",
	chenyuStorm_skill_info: `${get.poptip("shigu_yzs_buff")}角色回合开始时，召引者令其恢复或失去1点体力。`,
	chenyuStorm_instant_info: `【谶语风暴】：召引者本回合或下回合${get.poptip("RE_AP")}+2`,
	lingleidegu_yzs: `另类的骨`,
	lingleidegu_yzs_info: `${get.poptip("RE_Mystic")}：Ⅰ：摸3张牌，然后弃至少2张牌或1张【杀】；<br>
Ⅱ：亮出牌堆顶等于你手牌数张牌，获得其中一种牌名的牌；<br>Ⅲ：与其他${get.poptip("shigu_yzs_buff")}角色交换手牌。`,
	duyidexiang_yzs: `独一的相`,
	duyidexiang_yzs_info: `${get.poptip("RE_Mystic")}：发动后获得对应${get.poptip("wuyongchang_yzs")}限定技：<br>
Ⅰ：摸或弃至多2张牌；<br>Ⅱ：令任意角色摸或弃至多2张牌；<br>Ⅲ：你视为使用无距离限制且不可响应的普通【杀】。`,
	duyidexiang_yzs_buff1: `独一的相·Ⅰ`,
	duyidexiang_yzs_buff1_info: `限定技：${get.poptip("wuyongchang_yzs")}：你摸或弃至多2张牌。`,
	duyidexiang_yzs_buff2: `独一的相·Ⅱ`,
	duyidexiang_yzs_buff2_info: `限定技：${get.poptip("wuyongchang_yzs")}：你令任意角色摸或弃至多2张牌。`,
	duyidexiang_yzs_buff3: `独一的相·Ⅲ`,
	duyidexiang_yzs_buff3_info: `限定技：${get.poptip("wuyongchang_yzs")}：你视为使用无距离限制且不可响应的普通【杀】。`,
	wosiguwozai_yzs: `我思故我在`,
	wosiguwozai_yzs_info: `锁定技：你失去手牌【杀】时获得1点${get.poptip("Passion_yzs")}。
    ${get.poptip("RE_FC")}：激情5：若当前不为${get.poptip("chenyuStorm")}，你召引之并获得：<br>${get.poptip("sing_yzs")}5：失去本吟唱并终止之。场上角色受到伤害时，本吟唱-1。
【谶语风暴】结束时，失去本吟唱并获得剩余吟唱数点激情；否则将上述吟唱变为5，并令${get.poptip("shigu_yzs_buff")}角色恢复或失去1点体力。`,

	KingsTrove_yzs: `王之宝库`,
	KingsTrove_yzs_info: `锁定技：场上角色使用${get.poptip("guowangmiling_yzs")}时，你摸1张牌，然后将1张手牌扣置为【国库】。<br>
    你可无次数距离限制地使用或打出【国库】，然后若之为黑色，则本回合你不可再如此做。`,
	zhengling_yzs: `政令`,
	zhengling_yzs_info:`锁定技：每回合限1次：场上角色一次性摸≤3张牌时，你可改为令你摸2张牌扣置为【国库】，然后给予其2张【国库】。<br>
给予的黑/红色牌本回合明置，视为${get.poptip("guowangmiling_yzs")}/【无中生有】，然后其获得${get.poptip("zhengpan_yzs")}。<br>每公轮开始时，你可重新标记1名其他角色为【叛军】。`,
	visible_zhengling_yzs:`政令`,
	zhengpan_yzs: `征叛`,
	zhengpan_yzs_info: `【叛军】若不为你，其视为在你攻击范围内，且你使用【杀】需优先指定其。<br>你使用${get.poptip("guowangmiling_yzs")}或【杀】后，失去本技能。`,

	yixingzhixue_yzs: `移星之学`,
	yixingzhixue_yzs_info: `锁定技：你神秘术恒为5张。<br>你获得${get.poptip("planetCard_yzs")}时改为将之从左至右依次明置于人物牌旁，此区域称为“星环”，然后若行星牌数>3，依次移去最左端多余的行星牌及其下的牌。<br>
    回合开始时，若“星环”中最多为：<br><font color="#f8aa5d">【土星】</font>：你摸3张牌；<br><font color="#f56161">【火星】</font>：你获得2点${get.poptip("RE_AP")}并弃至多3张牌；<br><font color="#f9e99e">【盈月】</font>：若当前为额定回合，回合结束后你执行额外回合。<br>
    移去行星牌时，若移去的为：<br><font color="#f8aa5d">【土星】</font>：你摸2张牌；<br><font color="#f56161">【火星】</font>：你获得1点行动力并弃至多2张牌；<br><font color="#f9e99e">【盈月】</font>：每移去其下2张牌，你分配0点伤害。<br>
    你回合内牌进入弃牌堆时，你可将之叠置于“星环”中的<font color="#f9e99e">【盈月】</font>下（每张<font color="#f9e99e">【盈月】</font>仅可叠置1种花色）。`,
	yixingzhixue_yzs_mark: `行星`,
	tishuyinyong_yzs: `体术吟咏`,
	tishuyinyong_yzs_info: `${get.poptip("RE_Mystic")}：获得本神秘术阶数张<font color="#f8aa5d">【土星】</font>。`,
	gufaguanxing_yzs: `古法观星`,
	gufaguanxing_yzs_info: `${get.poptip("RE_Mystic")}：获得本神秘术阶数张<font color="#f56161">【火星】</font>。`,
	duyideyuanman_yzs: `独一的圆满`,
	duyideyuanman_yzs_info: `锁定技：你使用牌时获得1点${get.poptip("Passion_yzs")}。<br>激情X（初始为1，使用${get.poptip("RE_Mystic")}时+1，至多为5）：
	若X为5，依次移去“星环”内全部牌，本次结算中移去${get.poptip("planetCard_yzs")}效果数字+1，结算后获得2张<font color="#f9e99e">【盈月】</font>并重置X为1；否则获得1张<font color="#f9e99e">【盈月】</font>。`,

	sishengzhijian_yzs: `死生之间`, 
	sishengzhijian_yzs_info: `锁定技：你不可成为其他角色【桃】的目标。<br>你体力恢复溢出后，摸溢出量张牌。<br>
	受到伤害后你将牌堆顶牌等量张牌正面向上扣置为${get.poptip("_sishengzhijian_yzs_cards")}。<br>
    你对其他角色造成伤害时，其观看并获得你1张手牌，或转移你1张【生命之契】给其，然后其给予你1张手牌，或转移其1张【生命之契】给你。`,
	_sishengzhijian_yzs_cards: `生命之契`,
	_sishengzhijian_yzs_use:`生命之契`,
	_sishengzhijian_yzs_cards_info:`持有者可使用或打出，然后恢复1点体力。其中的锦囊牌视为【杀】。`,
	chijingzhiyi_yzs: `赤荆之翼`,
	chijingzhiyi_yzs_info: `锁定技：游戏开始时和${get.poptip("sing_yzs")}1：你摸1张牌，然后尽可能将至多<font color="#fd5656">1</font>张手牌加入你的【生命之契】。<br>
    你失去最后的${get.poptip("_sishengzhijian_yzs_cards")}时本${get.poptip("sing_yzs_count")}-1。<br>你发动本技能后，本自轮内本技能红色数字+1（至多为3）。`,
	yuhuozhige_yzs: `浴火之歌`,
	yuhuozhige_yzs_info: `锁定技：你的${get.poptip("_sishengzhijian_yzs_cards")}数≥3时，你的【杀】附带火属性、不可响应且伤害+1。<br>
    你造成非火焰伤害-1，造成火焰伤害时刷新出【杀】数。`,

	_SimpleDomain_yzs: `简易领域`,
	_SimpleDomain_yzs_info: `锁定技：你的出牌阶段开始时，或场上角色展开领域后，若你处于其他角色的领域内，你可弃置2张手牌，令之本回合对你无效，且本回合你不可对其他角色使用牌。`,
	SimpleDomain_yzs_buff:`简易领域`,

	zuzhouzhiwang_yzs: `诅咒之王`,
	zuzhouzhiwang_yzs_info: `锁定技：每回合开始时你摸牌至4张，然后若为你的回合，你选择1名其他角色，除其以外的其他角色依次可调离并摸1张牌`,
	shizhongyingfashu_yzs: `十种影法术`,
	shizhongyingfashu_yzs_info: `锁定技：你使用非式神牌时获得1张【影】。<br>你可将对应消耗数量的【影】当做未被破坏的${get.poptip("shishenCard_yzs")}使用。<br>
	每回合限1次：其他角色使用牌指定你为目标时，若“${get.poptip("Makora_yzs")}”不为目标，你可将目标转移给“魔虚罗”。`,
	fanzhuanshushi_yzs: `反转术式`,
	fanzhuanshushi_yzs_info: `锁定技：你可将2张手牌当做【桃】对自己使用，若这两张牌点数相同，结算后你可恢复一个已失效的技能。`,
	jie_yzs: `解`,
	jie_yzs_info: `出牌阶段，你可弃置1名其他角色手牌区和装备区各1张牌，并对其造成1点伤害，然后本技能本回合失效。`,
	ba_yzs: `捌`,
	ba_yzs_info: `出牌阶段，你可视为使用无次数、距离限制的【杀】，此【杀】伤害值改为目标角色体力上限的一半（向上取整至多为5），然后本技能本回合失效。`,
	fumoyuchuzi_yzs: `伏魔御厨子`,
	fumoyuchuzi_yzs_info: `${get.poptip("lingyuzhankai_yzs")}：你使用的牌不可响应。其他角色的回合结束时，你对其发动${get.poptip("jie_yzs")}。`,
	fumoyuchuzi_yzs_skill: `伏魔御厨子`,
	fumoyuchuzi_yzs_skill_info: `领域主人使用的牌不可响应。领域主人以外的角色的回合结束时，领域主人对其发动${get.poptip("jie_yzs")}`,

	hundunyutiaohe_yzs: `混沌与调和`,
	hundunyutiaohe_yzs_info: `持恒技：你每对1名其他角色累计造成2次伤害，你“${get.poptip("adapt_yzs")}”其1次。<br>
	其他角色的牌或技能对你生效2次后，你“适应”之。`,
	tuimozhijian_yzs: `退魔之剑`,
	tuimozhijian_yzs_info:`你攻击范围+2。你使用【杀】不可响应且无视防具。`,

	liangmianguishen_yzs: `两面鬼神`,
	liangmianguishen_yzs_info: `锁定技：你的额定回合结束后，你执行额外回合。你出【杀】数+1。你无视翻面效果。`,

	challenger_yzs:`你才是挑战者`,
	SixEyes_yzs: `六眼`,
	SixEyes_yzs_info: `锁定技：牌堆顶的牌对你可见。每回合开始时你摸2张牌，然后弃牌至手牌数为6。`,
	wuxiaxianshushi_yzs: `无下限术式`,
	wuxiaxianshushi_yzs_info: `若你未处于其他角色的领域内，你受到伤害时，可弃置任意张手牌令伤害值减少等量点，然后你摸1张牌。若所弃的牌与摸的牌花色有不同，本技能本回合失效。<br>
你连续使用点数严格递减/增的牌中断时(【苍】和【赫】不计入)，你获得1张点数为X的${get.poptip("wtwCang_yzs")}/${get.poptip("wtwHe_yzs")}（X为中断前连续使用的牌数）。`,
	xushici_yzs: `虚式·茈`,
	xushici_yzs_info: `出牌阶段，你可弃置点数相同的${get.poptip("wtwCang_yzs")}和${get.poptip("wtwHe_yzs")}各1张，然后对1名其他角色造成X(这两张牌的点数之和)点伤害。无论如何本技能本回合失效。`,
	wuliangkongchu_yzs: `无量空处`,
	_wuliangkongchu_yzs_skill:`无量空处`,
	wuliangkongchu_yzs_info: `${get.poptip("lingyuzhankai_yzs")}：所有其他角色进行非强制的选取会无效并结束出牌阶段。其他角色的回合结束时，其领域技失效。`,
	wuliangkongchu_yzs_skill: `无量空处`,
	wuliangkongchu_yzs_skill_info: `领域主人以外的角色进行非强制的选取会无效并结束出牌阶段。领域主人以外的角色的回合结束时，其领域技失效`,
};

export default translates;
