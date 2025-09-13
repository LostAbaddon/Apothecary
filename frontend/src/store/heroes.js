import { defineStore } from 'pinia';

// 七曜属性：金木水火土日月 七项独立值
const NAME_SURNAMES = [
  ...'赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐丘骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘姜'.split(''),
  '欧阳','司马','上官','东方','长孙','诸葛','尉迟','皇甫','夏侯','宇文','慕容','司徒','司空','公孙','公良','令狐','钟离','闾丘','子车','端木','申屠','公冶','太叔','闻人','赫连','澹台','宗政','轩辕','独孤'
];
const NAME_GIVEN = '一二三四五六七明月清风紫霞青云寒山子夜流云无为长青子衿安歌扶摇青衫孤舟问道怀玄抱朴致虚玄成若水芷若灵犀灵儿雪衣风眠星野云岫天衡望舒子期夭夭涟漪清漪澜歌秋水烟雨澄空沧浪暮雪疏影凝霜牧之伯川见山凌霄扶苏锦年未央采薇'.split('');

function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export const useHeroesStore = defineStore('heroes', {
  state: () => ({
    members: [],
    nextId: 1,
    max: 5,
  }),
  getters: {
    count: (s) => s.members.length,
  },
  actions: {
    generateUniqueName(existing = new Set()){
      let attempt = 0;
      while(attempt++ < 200){
        const surname = randomFrom(NAME_SURNAMES);
        const useDouble = Math.random() < 0.5;
        let given = randomFrom(NAME_GIVEN);
        if (useDouble) {
          if (given.length === 1) given = given + randomFrom(NAME_GIVEN);
        } else {
          if (given.length > 1) given = given.slice(0,1);
        }
        const name = surname + given;
        if(!existing.has(name) && !this.members.some(m => m.name === name)) return name;
      }
      return '无名' + (this.nextId++);
    },
    recruitOne(){
      const existing = new Set(this.members.map(m => m.name));
      const name = this.generateUniqueName(existing);
      // 初始七曜：金木水火土日月，取 0..10 的基础值
      const seven = {
        metal: Math.floor(Math.random()*11),
        wood: Math.floor(Math.random()*11),
        water: Math.floor(Math.random()*11),
        fire: Math.floor(Math.random()*11),
        earth: Math.floor(Math.random()*11),
        sun: Math.floor(Math.random()*11),
        moon: Math.floor(Math.random()*11),
      };
      const level = 1; // 初始境界
      const member = {
        id: this.nextId++,
        name,
        level,
        hp: 100,
        mp: 100,
        atk: 10,
        def: 10,
        seven,
        // 新版：列表形式，容量上限=境界 level
        artifacts: [],
        externals: [], // 外功心法列表
        internals: [], // 内丹心法列表
        status: '驻守', // 寻秘/驻守/闭关/走火入魔
      };
      this.members.push(member);
      return member;
    },
    clear(){ this.members = []; this.nextId = 1; },
    addIfNotExists(member){
      if(!member || member.id == null) return;
      if(this.members.length >= (this.max|0)) return; // 达到上限
      if(!this.members.some(m => m.id === member.id)){
        this.members.push(member);
      }
    },
    removeById(id){ this.members = this.members.filter(m => m.id !== id); },
  }
});
