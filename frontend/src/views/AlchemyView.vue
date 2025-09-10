<template>
  <div class="row">
    <div class="col">
      <div class="panel">
        <h2>祭炼（2048 规则 + 矿石经验）</h2>
        <div style="display:flex; gap:8px; align-items:center; margin:8px 0;">
          <label>配方：</label>
          <select class="select" v-model="recipeId">
            <option v-for="r in recipes" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button class="btn" @click="resetBoard">重开</button>
          <div class="badges">
            <span class="badge" v-for="r in recipe.reqs" :key="r.type">{{ r.type }} ≥ {{ r.exp }}</span>
          </div>
        </div>
        <div class="board">
          <div v-for="(tile, i) in flat" :key="i" class="tile" :class="tile ? `c-${tile.color}` : ''">
            <template v-if="tile">
              {{ COLOR_NAMES[tile.color] }}
              <small>{{ tile.ore }}·XP{{ tile.exp }}</small>
            </template>
          </div>
        </div>
        <div class="controls" style="margin-top:8px;">
          <button class="btn" @click="move('up')">↑</button>
          <button class="btn" @click="move('left')">←</button>
          <button class="btn" @click="move('down')">↓</button>
          <button class="btn" @click="move('right')">→</button>
          <span class="stat" v-if="won">已满足配方要求，祭炼成功！</span>
          <span class="stat" v-else>用方向键或按钮移动。</span>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="panel">
        <h3>规则要点</h3>
        <ul>
          <li>同色合并升级为彩虹下一色；紫色合并回到红色。</li>
          <li>矿石经验：同矿合并经验相加；不同矿保留经验更高的那块。</li>
          <li>新出现的格子从配方矿池随机选择矿石，初始经验为 1。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, computed } from 'vue';
import { useInventoryStore } from '../store/inventory.js';

const COLOR_NAMES = ['赤','橙','黄','绿','青','蓝','紫'];
const SIZE = 4;

const inv = useInventoryStore();
const recipes = computed(()=> inv.recipes);
const recipeId = computed({
  get:()=> inv.selectedRecipeId,
  set:(v)=> inv.setRecipe(v)
});
const recipe = computed(()=> inv.selectedRecipe);

function newTile(ore){
  return { color: 0, ore, exp: 1, id: Math.random().toString(36).slice(2) };
}

const state = reactive({ board: Array.from({length: SIZE}, ()=> Array(SIZE).fill(null)), won:false });

function emptyCells(){
  const res=[];
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) if(!state.board[y][x]) res.push([x,y]);
  return res;
}
function spawn(count=1){
  for(let i=0;i<count;i++){
    const empties = emptyCells();
    if(empties.length===0) return;
    const [x,y] = empties[Math.floor(Math.random()*empties.length)];
    const pool = recipe.value.pool;
    const ore = pool[Math.floor(Math.random()*pool.length)];
    state.board[y][x] = newTile(ore);
  }
}

function cycleColor(c){ return (c+1) % 7; }

function lineAt(dir, index){
  const row = [];
  for(let i=0;i<SIZE;i++){
    if(dir==='left' || dir==='right') row.push(state.board[index][i]);
    else row.push(state.board[i][index]);
  }
  return (dir==='right' || dir==='down') ? row.reverse() : row;
}
function setLine(dir, index, items){
  const row = (dir==='right' || dir==='down') ? items.slice().reverse() : items;
  for(let i=0;i<SIZE;i++){
    if(dir==='left' || dir==='right') state.board[index][i] = row[i] || null;
    else state.board[i][index] = row[i] || null;
  }
}

function compressAndMerge(items){
  const filtered = items.filter(Boolean);
  const res=[];
  for(let i=0;i<filtered.length;i++){
    const a = filtered[i];
    const b = filtered[i+1];
    if(b && a.color === b.color){
      // merge into next color
      const sameOre = a.ore === b.ore;
      const ore = sameOre ? a.ore : (a.exp >= b.exp ? a.ore : b.ore);
      const exp = sameOre ? (a.exp + b.exp) : Math.max(a.exp, b.exp);
      res.push({ color: cycleColor(a.color), ore, exp, id: Math.random().toString(36).slice(2) });
      i++; // skip next
    } else {
      res.push(a);
    }
  }
  while(res.length < SIZE) res.push(null);
  return res;
}

function move(dir){
  let moved = false;
  for(let i=0;i<SIZE;i++){
    const line = lineAt(dir, i);
    const merged = compressAndMerge(line);
    if(JSON.stringify(line) !== JSON.stringify(merged)) moved = true;
    setLine(dir, i, merged);
  }
  if(moved){
    spawn(1);
    checkWin();
  }
}

function resetBoard(){
  state.board = Array.from({length: SIZE}, ()=> Array(SIZE).fill(null));
  state.won = false;
  spawn(2);
}

function checkWin(){
  const reqs = recipe.value.reqs;
  state.won = reqs.every(r => {
    let ok=false;
    for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
      const t = state.board[y][x];
      if(t && t.ore === r.type && t.exp >= r.exp){ ok = true; break; }
    }
    return ok;
  });
}

function onKey(e){
  const map={ ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const d = map[e.key];
  if(d){ e.preventDefault(); move(d); }
}

onMounted(()=>{
  window.addEventListener('keydown', onKey);
  resetBoard();
});
onBeforeUnmount(()=> window.removeEventListener('keydown', onKey));

const flat = computed(()=> state.board.flat());

</script>
