/**
 * 古诗文数据文件
 * 包含经典古诗词、诗人信息、分类数据
 * 数据来源：公共领域古诗文
 */

// 诗人数据
const poets = [
	{
		id: 'libai',
		name: '李白',
		courtesy: '太白',
		alias: '青莲居士',
		dynasty: '唐',
		years: '701-762',
		avatar: '/static/icons/poet_libai.png',
		title: '诗仙',
		bio: '李白，字太白，号青莲居士，唐代伟大的浪漫主义诗人，被后人誉为"诗仙"。其诗风豪放飘逸，想象丰富，语言流转自然，音律和谐多变。'
	},
	{
		id: 'dufu',
		name: '杜甫',
		courtesy: '子美',
		alias: '少陵野老',
		dynasty: '唐',
		years: '712-770',
		avatar: '/static/icons/poet_dufu.png',
		title: '诗圣',
		bio: '杜甫，字子美，自号少陵野老，唐代伟大的现实主义诗人，与李白并称"李杜"。其诗被称为"诗史"，深刻反映了唐代由盛转衰的历史变迁。'
	},
	{
		id: 'baijuyi',
		name: '白居易',
		courtesy: '乐天',
		alias: '香山居士',
		dynasty: '唐',
		years: '772-846',
		avatar: '/static/icons/poet_baijuyi.png',
		title: '诗魔',
		bio: '白居易，字乐天，号香山居士，唐代伟大的现实主义诗人。其诗歌题材广泛，形式多样，语言平易近人，主张"文章合为时而著，歌诗合为事而作"。'
	},
	{
		id: 'wangwei',
		name: '王维',
		courtesy: '摩诘',
		alias: '摩诘居士',
		dynasty: '唐',
		years: '701-761',
		avatar: '/static/icons/poet_wangwei.png',
		title: '诗佛',
		bio: '王维，字摩诘，号摩诘居士，唐代著名诗人、画家。苏轼评价其"诗中有画，画中有诗"。其山水田园诗成就最高，与孟浩然合称"王孟"。'
	},
	{
		id: 'sushi',
		name: '苏轼',
		courtesy: '子瞻',
		alias: '东坡居士',
		dynasty: '宋',
		years: '1037-1101',
		avatar: '/static/icons/poet_sushi.png',
		title: '词圣',
		bio: '苏轼，字子瞻，号东坡居士，北宋著名文学家、书法家、画家。其诗题材广阔，清新豪健，善用夸张比喻，独具风格。与父苏洵、弟苏辙合称"三苏"。'
	},
	{
		id: 'liqingzhao',
		name: '李清照',
		courtesy: '易安',
		alias: '易安居士',
		dynasty: '宋',
		years: '1084-1155',
		avatar: '/static/icons/poet_liqingzhao.png',
		title: '词后',
		bio: '李清照，号易安居士，宋代女词人，婉约词派代表，有"千古第一才女"之称。其词作以南渡为界，前期多写悠闲生活，后期多悲叹身世，情调感伤。'
	},
	{
		id: 'menghaoran',
		name: '孟浩然',
		courtesy: '浩然',
		alias: '孟襄阳',
		dynasty: '唐',
		years: '689-740',
		avatar: '/static/icons/default_avatar.png',
		title: '山水诗人',
		bio: '孟浩然，唐代著名诗人，襄州襄阳人。世称孟襄阳，与王维并称"王孟"。其诗清淡自然，以五言诗见长，多写山水田园和隐居生活，是盛唐山水田园诗派的主要代表之一。'
	},
	{
		id: 'liuzongyuan',
		name: '柳宗元',
		courtesy: '子厚',
		alias: '柳河东',
		dynasty: '唐',
		years: '773-819',
		avatar: '/static/icons/default_avatar.png',
		title: '唐宋八大家',
		bio: '柳宗元，字子厚，河东人，唐代著名文学家、思想家。与韩愈共同倡导古文运动，并称"韩柳"，为"唐宋八大家"之一。其诗文风格清峭峻拔，寓言散文成就尤高。'
	},
	{
		id: 'wangzhihuan',
		name: '王之涣',
		courtesy: '季凌',
		alias: '王季凌',
		dynasty: '唐',
		years: '688-742',
		avatar: '/static/icons/default_avatar.png',
		title: '边塞诗人',
		bio: '王之涣，字季凌，唐代著名边塞诗人。其诗以描写边塞风光著称，气势磅礴，意境开阔。常与高适、王昌龄等唱和，作品多散佚，《全唐诗》仅存其诗六首，却首首皆为传世名篇。'
	}
];

// 诗词数据
const poems = [
	{
		id: 1,
		title: '静夜思',
		dynasty: '唐',
		author: '李白',
		authorId: 'libai',
		type: '五言绝句',
		theme: '思乡',
		content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
		translation: '明亮的月光洒在床前的窗户纸上，好像地上泛起了一层白霜。\n我禁不住抬起头，看那窗外天空中的一轮明月，不由得低下头来沉思，想起远方的家乡。',
		annotation: [
			{ word: '疑', meaning: '好像' },
			{ word: '举头', meaning: '抬头' },
			{ word: '明月光', meaning: '明亮的月光' }
		],
		appreciation: '这首诗写的是在寂静的月夜思念家乡的感受。前两句写诗人在客栈中抬头看到明月，误以为是秋霜；后两句写诗人由望月而思乡。全诗运用比喻、衬托等手法，表达客居思乡之情，语言清新朴素，韵味丰富。',
		tags: ['思乡', '月亮', '经典'],
		recite: true,
		views: 12890
	},
	{
		id: 2,
		title: '春晓',
		dynasty: '唐',
		author: '孟浩然',
		authorId: 'menghaoran',
		type: '五言绝句',
		theme: '春天',
		content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
		translation: '春日里贪睡不知不觉天就亮了，到处可以听到小鸟的鸣叫声。\n回想昨夜的阵阵风雨声，不知吹落了多少美丽的春花。',
		annotation: [
			{ word: '晓', meaning: '天刚亮的时候' },
			{ word: '闻', meaning: '听到' },
			{ word: '啼鸟', meaning: '鸟的啼叫声' }
		],
		appreciation: '这首诗描绘了一幅春天早晨绚丽的图景，抒发了诗人对春天的热爱之情。全诗看似平淡无奇，却韵味无穷，诗人通过听觉感受来写春景，不写繁花似锦，而写花落知多少，含蓄蕴藉，耐人寻味。',
		tags: ['春天', '写景', '经典'],
		recite: true,
		views: 9876
	},
	{
		id: 3,
		title: '江雪',
		dynasty: '唐',
		author: '柳宗元',
		authorId: 'liuzongyuan',
		type: '五言绝句',
		theme: '冬天',
		content: '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。',
		translation: '所有的山，飞鸟全都断绝；所有的路，不见人影踪迹。\n江上孤舟，渔翁披蓑戴笠；独自垂钓，不怕冰雪侵袭。',
		annotation: [
			{ word: '绝', meaning: '消失，断绝' },
			{ word: '万径', meaning: '虚指所有的路' },
			{ word: '蓑笠', meaning: '蓑衣和斗笠' }
		],
		appreciation: '此诗描绘了一幅幽静寒冷的画面：在下着大雪的江面上，一叶孤舟，一个老渔翁，独自在寒冷的江心垂钓。诗人向读者展示的天地是如此纯洁而寂静，一尘不染，万籁无声，表现了诗人清高孤傲的情怀。',
		tags: ['冬天', '写景', '孤独'],
		recite: true,
		views: 8543
	},
	{
		id: 4,
		title: '望岳',
		dynasty: '唐',
		author: '杜甫',
		authorId: 'dufu',
		type: '五言古诗',
		theme: '壮志',
		content: '岱宗夫如何？齐鲁青未了。\n造化钟神秀，阴阳割昏晓。\n荡胸生曾云，决眦入归鸟。\n会当凌绝顶，一览众山小。',
		translation: '巍峨的泰山，到底如何雄伟？走出齐鲁，也望不尽那一片青。\n大自然把神奇秀丽都集中在了泰山，山的南面和北面将天色分割成清晨和黄昏。\n层云生起使心胸震荡，极目远望那归鸟回旋。\n一定要登上泰山顶峰，俯瞰群山，豪情满怀。',
		annotation: [
			{ word: '岱宗', meaning: '泰山，五岳之首' },
			{ word: '夫如何', meaning: '到底怎么样' },
			{ word: '造化', meaning: '大自然' },
			{ word: '钟', meaning: '聚集' },
			{ word: '决眦', meaning: '眼角几乎要裂开' }
		],
		appreciation: '这首诗通过描绘泰山雄伟磅礴的景象，热情赞美了泰山高大巍峨的气势和神奇秀丽的景色，流露出了对祖国山河的热爱之情，表达了诗人不怕困难、敢攀顶峰、俯视一切的雄心和气概。',
		tags: ['泰山', '壮志', '写景'],
		recite: true,
		views: 7654
	},
	{
		id: 5,
		title: '水调歌头·明月几时有',
		dynasty: '宋',
		author: '苏轼',
		authorId: 'sushi',
		type: '词',
		theme: '思亲',
		content: '明月几时有？把酒问青天。\n不知天上宫阙，今夕是何年。\n我欲乘风归去，又恐琼楼玉宇，高处不胜寒。\n起舞弄清影，何似在人间。\n转朱阁，低绮户，照无眠。\n不应有恨，何事长向别时圆？\n人有悲欢离合，月有阴晴圆缺，此事古难全。\n但愿人长久，千里共婵娟。',
		translation: '明月从什么时候才开始有的？我拿着酒杯遥问苍天。\n不知道天上的宫殿，今晚是哪一年。\n我想要乘御清风回到天上，又恐怕月宫里的琼楼玉宇，太高了经受不住寒冷。\n起身舞蹈玩赏着月光下自己清朗的影子，月宫哪里比得上人间。\n月儿转过朱红色的楼阁，低低地挂在雕花的窗户上，照着不眠的我。\n明月不该对人们有什么怨恨，为什么偏偏在人离别时才圆呢？\n人有悲欢离合的变迁，月有阴晴圆缺的转换，这种事自古来难以周全。\n但愿亲人能平安健康，虽然相隔千里，也能共享这美好的月光。',
		annotation: [
			{ word: '把酒', meaning: '端起酒杯' },
			{ word: '宫阙', meaning: '宫殿' },
			{ word: '琼楼玉宇', meaning: '美玉砌成的楼宇' },
			{ word: '不胜寒', meaning: '经受不住寒冷' },
			{ word: '婵娟', meaning: '指月亮' }
		],
		appreciation: '此词作于宋神宗熙宁九年中秋，时苏轼在密州。词以月起兴，以与其弟苏辙七年未见之情为基础，围绕中秋明月展开想象和思考，把人世间的悲欢离合之情纳入对宇宙人生的哲理性追寻之中，反映了作者复杂而又矛盾的思想感情。',
		tags: ['月亮', '思亲', '中秋', '经典'],
		recite: true,
		views: 15678
	},
	{
		id: 6,
		title: '如梦令·昨夜雨疏风骤',
		dynasty: '宋',
		author: '李清照',
		authorId: 'liqingzhao',
		type: '词',
		theme: '惜春',
		content: '昨夜雨疏风骤，浓睡不消残酒。\n试问卷帘人，却道海棠依旧。\n知否，知否？应是绿肥红瘦。',
		translation: '昨天夜里雨点虽然稀疏，但是风却劲吹不停。我酣睡了一夜，然而醒来之后依然觉得还有一点酒意没有消尽。\n于是就问正在卷帘的侍女，外面的情况怎么样，她却说海棠花依然和昨天一样。\n你可知道，你可知道，这个时节应该是绿叶繁茂，红花凋零了。',
		annotation: [
			{ word: '雨疏风骤', meaning: '雨点稀疏，风声急促' },
			{ word: '浓睡', meaning: '酣睡' },
			{ word: '残酒', meaning: '尚未消尽的酒意' },
			{ word: '卷帘人', meaning: '侍女' },
			{ word: '绿肥红瘦', meaning: '绿叶繁茂，红花凋零' }
		],
		appreciation: '此词一问世，便轰动了整个京师，"当时文士莫不击节赏"（见《铁围山丛谈》）。词中"绿肥红瘦"一语，更是流传千古的名句。全词寥寥数语，委婉地表达了作者怜花惜花的心情，也流露了内心的苦闷。',
		tags: ['惜春', '婉约', '经典'],
		recite: true,
		views: 11234
	},
	{
		id: 7,
		title: '登鹳雀楼',
		dynasty: '唐',
		author: '王之涣',
		authorId: 'wangzhihuan',
		type: '五言绝句',
		theme: '哲理',
		content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
		translation: '夕阳依傍着西山慢慢地沉没，滔滔的黄河朝着东海汹涌奔流。\n若想把千里的风光景物看够，那就要登上更高的一层城楼。',
		annotation: [
			{ word: '依', meaning: '依傍' },
			{ word: '尽', meaning: '消失' },
			{ word: '穷', meaning: '尽，达到极点' }
		],
		appreciation: '这首诗写诗人在登高望远中表现出来的不凡的胸襟抱负，反映了盛唐时期人们积极向上的进取精神。前两句写所见，后两句写所想，把道理与景物、情事溶化得天衣无缝，使读者并不觉得它在说理，而理自在其中。',
		tags: ['哲理', '登高', '经典'],
		recite: true,
		views: 13456
	},
	{
		id: 8,
		title: '相思',
		dynasty: '唐',
		author: '王维',
		authorId: 'wangwei',
		type: '五言绝句',
		theme: '相思',
		content: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。',
		translation: '鲜红浑圆的红豆，生长在阳光明媚的南方，春暖花开的季节，不知又生出多少枝蔓。\n希望思念的人儿多多采集，小小红豆引人相思。',
		annotation: [
			{ word: '红豆', meaning: '又名相思子，一种生在岭南地区的植物' },
			{ word: '采撷', meaning: '采摘' },
			{ word: '相思', meaning: '想念' }
		],
		appreciation: '这是借咏物而寄相思的诗。全诗情调健康明朗，语言朴素无华，韵律和谐柔美，可谓"诗中有画，画中有诗"。诗人借咏物而寄相思，语浅情深，相传当时即谱为歌曲广为流传。',
		tags: ['相思', '咏物', '友情'],
		recite: true,
		views: 9087
	},
	{
		id: 9,
		title: '赋得古原草送别',
		dynasty: '唐',
		author: '白居易',
		authorId: 'baijuyi',
		type: '五言律诗',
		theme: '送别',
		content: '离离原上草，一岁一枯荣。\n野火烧不尽，春风吹又生。\n远芳侵古道，晴翠接荒城。\n又送王孙去，萋萋满别情。',
		translation: '长长的原上草是多么茂盛，每年秋冬枯黄春来草色浓。\n无情的野火只能烧掉干叶，春风吹来大地又是绿茸茸。\n野草野花蔓延着掩没古道，艳阳下草地尽头是你征程。\n我又一次送走知心的好友，茂密的青草代表我的深情。',
		annotation: [
			{ word: '离离', meaning: '青草茂盛的样子' },
			{ word: '一岁', meaning: '一年' },
			{ word: '枯荣', meaning: '枯萎和茂盛' },
			{ word: '王孙', meaning: '贵族子弟，此指被送别的人' }
		],
		appreciation: '此诗通过对古原上野草的描绘，抒发送别友人时的依依惜别之情。它可以看成是一曲野草颂，进而是生命的颂歌。前四句侧重表现野草生命的历时之美，后四句侧重表现其共时之美，全诗章法严密，语言自然流畅，对仗工整。',
		tags: ['送别', '咏物', '生命'],
		recite: true,
		views: 8765
	},
	{
		id: 10,
		title: '将进酒',
		dynasty: '唐',
		author: '李白',
		authorId: 'libai',
		type: '乐府诗',
		theme: '豪放',
		content: '君不见黄河之水天上来，奔流到海不复回。\n君不见高堂明镜悲白发，朝如青丝暮成雪。\n人生得意须尽欢，莫使金樽空对月。\n天生我材必有用，千金散尽还复来。\n烹羊宰牛且为乐，会须一饮三百杯。\n岑夫子，丹丘生，将进酒，杯莫停。\n与君歌一曲，请君为我倾耳听。\n钟鼓馔玉不足贵，但愿长醉不复醒。\n古来圣贤皆寂寞，惟有饮者留其名。\n陈王昔时宴平乐，斗酒十千恣欢谑。\n主人何为言少钱，径须沽取对君酌。\n五花马，千金裘，呼儿将出换美酒，与尔同销万古愁。',
		translation: '你难道没有看见，黄河之水从天上来，波涛滚滚奔向东海，不再回来。\n你难道没有看见，高堂之上的人对着明镜悲叹自己的白发，早晨还是满头青丝，傍晚却成了白雪。\n人生在得意的时候应当尽情欢乐，不要让这金杯空对着明月。\n每个人都有自己的用处，千金花尽了还会再回来。\n烹羊宰牛姑且尽情欢乐，应该一口气喝上三百杯。\n岑夫子，丹丘生，请喝酒，杯不要停。\n我为你们唱一首歌，请你们侧耳倾听。\n钟鼓馔玉这些富贵之物不值得珍贵，我只愿长醉不醒。\n自古以来圣贤无不冷落寂寞，只有那喝酒的人才留下了美名。\n陈王曹植从前在平乐观摆设宴席，斗酒十千尽情欢谑。\n主人为什么说钱少了，只管去买酒来对酌。\n五花马，千金裘，叫儿子拿去换美酒，与你一同消除万古的忧愁。',
		annotation: [
			{ word: '将进酒', meaning: '劝酒歌' },
			{ word: '得意', meaning: '适意，心情舒畅' },
			{ word: '会须', meaning: '应当' },
			{ word: '岑夫子', meaning: '岑勋，李白之友' },
			{ word: '丹丘生', meaning: '元丹丘，李白之友' },
			{ word: '钟鼓馔玉', meaning: '泛指豪门贵族的奢华生活' }
		],
		appreciation: '《将进酒》原是汉乐府短箫铙歌的曲调，题目意为"劝酒歌"。这首诗十分形象地表现了李白桀骜不驯的性格：一方面对自己充满自信，孤高自傲；一方面在政治前途出现波折后，又流露出纵情享乐之情。全诗气势豪迈，感情豪放，言语流畅，具有极强的感染力。',
		tags: ['豪放', '饮酒', '经典'],
		recite: false,
		views: 18900
	},
	{
		id: 11,
		title: '春望',
		dynasty: '唐',
		author: '杜甫',
		authorId: 'dufu',
		type: '五言律诗',
		theme: '忧国',
		content: '国破山河在，城春草木深。\n感时花溅泪，恨别鸟惊心。\n烽火连三月，家书抵万金。\n白头搔更短，浑欲不胜簪。',
		translation: '国都已被攻破，只有山河依旧存在，春天的长安城满目凄凉，到处草木丛生。\n感伤国事，看到花开不禁潸然泪下，亲人离散，鸟鸣也觉心惊。\n战火连绵不休，已持续了三个月，一封家书可以抵得上万两黄金。\n愁绪缠绕搔头，白发越搔越短，简直连簪子也插不上。',
		annotation: [
			{ word: '国破', meaning: '国都长安被攻破' },
			{ word: '深', meaning: '茂盛' },
			{ word: '烽火', meaning: '古时边防报警的烟火，这里指安史之乱的战争' },
			{ word: '抵', meaning: '值，相当' }
		],
		appreciation: '这首诗全篇情景交融，感情深沉而又含蓄，凝练而又言简意丰。诗人通过眺望沦陷后的长安城，表达了忧国伤时、念家悲己的感情，充分体现了沉郁顿挫的艺术风格。',
		tags: ['忧国', '思乡', '战争'],
		recite: true,
		views: 10234
	},
	{
		id: 12,
		title: '山居秋暝',
		dynasty: '唐',
		author: '王维',
		authorId: 'wangwei',
		type: '五言律诗',
		theme: '田园',
		content: '空山新雨后，天气晚来秋。\n明月松间照，清泉石上流。\n竹喧归浣女，莲动下渔舟。\n随意春芳歇，王孙自可留。',
		translation: '空旷的群山沐浴了一场新雨，夜晚降临使人感到已是初秋。\n皎皎明月从松隙间洒下清光，清清泉水在石头上淙淙流淌。\n竹林喧响知是洗衣姑娘归来，莲叶摇动知是渔舟顺流而下。\n春日的芳菲不妨任随它消歇，秋天的山中王孙自可以久留。',
		annotation: [
			{ word: '暝', meaning: '日落，天色将晚' },
			{ word: '竹喧', meaning: '竹林中笑语喧哗' },
			{ word: '浣女', meaning: '洗衣的女子' },
			{ word: '春芳', meaning: '春草' }
		],
		appreciation: '此诗描绘了秋雨初晴后傍晚时分山村的旖旎风光和山居村民的淳朴风尚，表现了诗人寄情山水田园并对隐居生活怡然自得的满足心情，以自然美来表现人格美和社会美。',
		tags: ['田园', '写景', '隐居'],
		recite: true,
		views: 7654
	}
];

// 朝代分类
const dynasties = [
	{ id: 'all', name: '全部', count: poems.length },
	{ id: '唐', name: '唐诗', count: poems.filter(p => p.dynasty === '唐').length },
	{ id: '宋', name: '宋词', count: poems.filter(p => p.dynasty === '宋').length }
];

// 体裁分类
const types = [
	{ id: 'all', name: '全部体裁' },
	{ id: '五言绝句', name: '五言绝句' },
	{ id: '七言绝句', name: '七言绝句' },
	{ id: '五言律诗', name: '五言律诗' },
	{ id: '五言古诗', name: '五言古诗' },
	{ id: '词', name: '词' },
	{ id: '乐府诗', name: '乐府诗' }
];

// 主题分类
const themes = [
	{ id: '思乡', name: '思乡怀人', icon: 'home' },
	{ id: '春天', name: '春日景致', icon: 'flower' },
	{ id: '冬天', name: '冬日雪景', icon: 'snow' },
	{ id: '壮志', name: '壮志豪情', icon: 'mountain' },
	{ id: '思亲', name: '思念亲人', icon: 'moon' },
	{ id: '惜春', name: '惜春伤春', icon: 'leaf' },
	{ id: '哲理', name: '哲理感悟', icon: 'book' },
	{ id: '相思', name: '相思之情', icon: 'heart' },
	{ id: '送别', name: '送别离情', icon: 'wind' },
	{ id: '豪放', name: '豪放不羁', icon: 'wine' },
	{ id: '忧国', name: '忧国忧民', icon: 'flag' },
	{ id: '田园', name: '田园山水', icon: 'tree' }
];

// 名句精选
const famousLines = [
	{ line: '床前明月光，疑是地上霜', from: '静夜思', author: '李白' },
	{ line: '春眠不觉晓，处处闻啼鸟', from: '春晓', author: '孟浩然' },
	{ line: '千山鸟飞绝，万径人踪灭', from: '江雪', author: '柳宗元' },
	{ line: '会当凌绝顶，一览众山小', from: '望岳', author: '杜甫' },
	{ line: '但愿人长久，千里共婵娟', from: '水调歌头', author: '苏轼' },
	{ line: '知否，知否？应是绿肥红瘦', from: '如梦令', author: '李清照' },
	{ line: '欲穷千里目，更上一层楼', from: '登鹳雀楼', author: '王之涣' },
	{ line: '红豆生南国，春来发几枝', from: '相思', author: '王维' },
	{ line: '野火烧不尽，春风吹又生', from: '赋得古原草送别', author: '白居易' },
	{ line: '天生我材必有用，千金散尽还复来', from: '将进酒', author: '李白' },
	{ line: '国破山河在，城春草木深', from: '春望', author: '杜甫' },
	{ line: '明月松间照，清泉石上流', from: '山居秋暝', author: '王维' }
];

// 预处理诗词数据，添加首行、内容预览、标题首字、前3个标签、格式化浏览量
poems.forEach(p => {
	p.firstLine = p.content.split('\n')[0];
	p.contentPreview = p.content.replace(/\n/g, ' / ');
	p.titleChar = p.title.charAt(0);
	p.topTags = p.tags.slice(0, 3);
	p.formattedViews = p.views >= 10000 ? (p.views / 10000).toFixed(1) + '万' : p.views.toString();
});

// 预处理主题数据，添加名称首字、图标类名、诗词数量
themes.forEach(t => {
	t.nameChar = t.name.charAt(0);
	t.iconClass = 'icon-' + t.icon;
	t.count = poems.filter(poem => poem.theme === t.id).length;
});

module.exports = {
	poets,
	poems,
	dynasties,
	types,
	themes,
	famousLines
};
