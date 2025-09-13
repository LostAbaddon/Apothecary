import { defineStore } from 'pinia';

// 单姓 + 复姓混合池
const NAME_SURNAMES = [
  // 常见单姓
  ...'赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐丘骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘姜'.split(''),
  // 常见复姓
  '欧阳','司马','上官','东方','长孙','诸葛','尉迟','皇甫','夏侯','宇文','慕容','司徒','司空','公孙','公良','令狐','钟离','闾丘','子车','端木','申屠','公冶','太叔','闻人','赫连','澹台','宗政','轩辕','独孤'
];
// 名字词库（含单字与双字）
const NAME_GIVEN = '一二三四五六七明月清风紫霞青云寒山子夜流云无为长青子衿安歌扶摇青衫孤舟问道怀玄抱朴致虚玄成若水芷若灵犀灵儿雪衣风眠星野云岫天衡望舒子期夭夭涟漪清漪澜歌秋水烟雨澄空沧浪暮雪疏影凝霜牧之伯川见山凌霄扶苏锦年未央采薇'.split('');

function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function genName(used){
  let attempt = 0;
  while(attempt++ < 200){
    const surname = randomFrom(NAME_SURNAMES);
    // 50% 概率双字名：若词条长度>1则直接用，否则随机两次拼接
    const useDouble = Math.random() < 0.5;
    let given = randomFrom(NAME_GIVEN);
    if (useDouble) {
      if (given.length === 1) given = given + randomFrom(NAME_GIVEN);
    } else {
      if (given.length > 1) given = given.slice(0,1);
    }
    const name = surname + given;
    if(!used.has(name)) return name;
  }
  return '无名' + Math.random().toString(36).slice(2,6);
}

function initialMembers(){
  const used = new Set();
  const list = [];
  for(let i=0;i<10;i++){
    const name = genName(used); used.add(name);
    // 七曜：金木水火土日月
    const seven = {
      metal: Math.floor(Math.random()*11),
      wood: Math.floor(Math.random()*11),
      water: Math.floor(Math.random()*11),
      fire: Math.floor(Math.random()*11),
      earth: Math.floor(Math.random()*11),
      sun: Math.floor(Math.random()*11),
      moon: Math.floor(Math.random()*11),
    };
    list.push({
      id: i+1,
      name,
      level: 1,
      hp: 100,
      mp: 100,
      atk: 10,
      def: 10,
      seven,
      artifacts: [],
      externals: [],
      internals: [],
      status: '驻守',
    });
  }
  return list;
}

export const useDisciplesStore = defineStore('disciples', {
  state: () => ({
    members: initialMembers(),
    nextId: 11,
    max: 50,
  }),
  getters: {
    count: (s) => s.members.length,
  },
  actions: {
    recruitOne(){
      if (this.members.length >= (this.max|0)) return null;
      const used = new Set(this.members.map(m => m.name));
      const name = genName(used);
      const seven = {
        metal: Math.floor(Math.random()*11),
        wood: Math.floor(Math.random()*11),
        water: Math.floor(Math.random()*11),
        fire: Math.floor(Math.random()*11),
        earth: Math.floor(Math.random()*11),
        sun: Math.floor(Math.random()*11),
        moon: Math.floor(Math.random()*11),
      };
      this.members.push({
        id: this.nextId++,
        name,
        level: 1,
        hp: 100,
        mp: 100,
        atk: 10,
        def: 10,
        seven,
        artifacts: [],
        externals: [],
        internals: [],
        status: '驻守',
      });
      return this.members[this.members.length - 1];
    },
    removeById(id){ this.members = this.members.filter(m => m.id !== id); },
  }
});
