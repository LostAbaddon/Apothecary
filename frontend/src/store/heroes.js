import { defineStore } from 'pinia';

// 七曜颜色：0..6 对应 7 色（与 AlchemyView 的 c-0..c-6 相呼应）
const NAME_SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐丘骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘姜'.split('');
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
        const name = randomFrom(NAME_SURNAMES) + randomFrom(NAME_GIVEN);
        if(!existing.has(name) && !this.members.some(m => m.name === name)) return name;
      }
      return '无名' + (this.nextId++);
    },
    recruitOne(){
      const existing = new Set(this.members.map(m => m.name));
      const name = this.generateUniqueName(existing);
      const seven = Math.floor(Math.random()*7); // 0..6 七曜
      const level = 1; // 初始境界
      const member = {
        id: this.nextId++,
        name,
        level,
        hp: 100,
        mp: 100,
        atk: 10,
        def: 10,
        sevenColor: seven,
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
