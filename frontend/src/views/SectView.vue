<template>
  <div class="sect-view">
    <!-- 宗门标题区域 -->
    <div class="sect-header">
      <div class="sect-title-container">
        <div class="sect-emblem">🏛️</div>
        <div class="sect-title-text">
          <div class="sect-title-row">
            <h1 class="sect-title-name">{{ sectName }}</h1>
            <span class="level-badge">{{ sectLevel }}级宗门</span>
          </div>
          <p class="sect-motto">{{ sectMotto }}</p>
        </div>
      </div>
    </div>

    <!-- 宗门概览 -->
    <div class="sect-overview">
      <div class="overview-card">
        <div class="overview-icon">🪙</div>
        <div class="overview-content">
          <div class="overview-value">{{ sectWealth }}</div>
          <div class="overview-label">宗门财富</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">👥</div>
        <div class="overview-content">
          <div class="overview-value">{{ totalDisciples }}</div>
          <div class="overview-label">门下弟子</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">⭐</div>
        <div class="overview-content">
          <div class="overview-value">{{ sectReputation }}</div>
          <div class="overview-label">宗门声望</div>
        </div>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="sect-content">
      <!-- 左列 -->
      <div class="sect-column sect-left-column">
        <!-- 宗门仓库 -->
        <div class="sect-section warehouse-section">
          <div class="section-header">
            <h2><span class="section-icon">📦</span>宗门仓库</h2>
          </div>
          <div class="warehouse-content">
            <p class="section-description">存放从洞天福地带回的珍贵材料</p>
            <div class="badges warehouse-badges">
              <span
                class="badge warehouse-badge"
                v-for="([name, cnt], i) in sectEntries"
                :key="'sect-' + name + '-' + i"
                :title="`${name}: ${cnt} 件`"
              >
                <span class="badge-icon">{{ getOreIcon(name) }}</span>
                <span class="badge-text">{{ name }}</span>
                <span class="badge-count">{{ cnt }}</span>
              </span>
            </div>
            <div v-if="sectEntries.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p>仓库空空如也，快去洞天寻宝吧！</p>
            </div>
          </div>
        </div>

        <!-- 弟子管理 -->
        <div class="sect-section disciples-section">
          <div class="section-header">
            <h2><span class="section-icon">👥</span>弟子管理</h2>
            <div class="section-actions">
              <span class="stat" style="margin-right:8px;">{{ totalDisciples }}/50</span>
              <button class="btn btn-small" @click="recruitDisciple" :disabled="totalDisciples >= 50">招收弟子</button>
            </div>
          </div>
          <div class="disciples-content">
            <p class="section-description">管理宗门弟子的修行与任务分配</p>
          <div class="disciples-grid">
            <div v-for="disciple in disciples" :key="disciple.id" class="disciple-card">
              <div class="disciple-avatar">{{ disciple.seven ? '🜍' : '🧙' }}</div>
              <div class="disciple-info one-line">
                <div class="disciple-line">
                  <span class="disciple-name-strong">{{ disciple.name }}</span>
                  <span class="disciple-meta">（{{ levelName(disciple.level) }} ｜ {{ getStatusText(disciple.status) }}）</span>
                </div>
              </div>
              <div class="disciple-actions">
                <button
                  v-if="disciple.status === '驻守'"
                  class="btn btn-tiny"
                  :disabled="heroes.count >= 5"
                    :title="heroes.count >= 5 ? '队伍已满（最多5人）' : ''"
                    @click="assignTask(disciple)"
                  >派遣</button>
                  <button
                    v-else-if="disciple.status === '寻秘'"
                    class="btn btn-tiny"
                    :disabled="!game.heroAtVillage"
                    title="只有当求道者队伍在宗门时才能驻守"
                    @click="assignTask(disciple)"
                  >驻守</button>
                  <button v-else class="btn btn-tiny" disabled>{{ getStatusText(disciple.status) }}</button>
                </div>
              </div>
            </div>
            <div v-if="disciples.length === 0" class="empty-state">
              <div class="empty-icon">👤</div>
              <p>尚无弟子入门，快去招收有缘人吧！</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="sect-column sect-right-column">
        <!-- 宗门建设 -->
        <div class="sect-section buildings-section">
          <div class="section-header">
            <h2><span class="section-icon">🏗️</span>宗门建设</h2>
          </div>
          <div class="buildings-content">
            <p class="section-description">建设各种设施提升宗门实力</p>
            <div class="buildings-grid">
              <div v-for="building in buildings" :key="building.id" class="building-card" :class="{ built: building.built, constructing: building.constructing }">
                <div class="building-icon">{{ building.icon }}</div>
                <div class="building-info">
                  <div class="building-name">
                    <span class="building-name-strong">{{ building.name }}</span>
                    <span class="building-meta">（{{ building.description }}）</span>
                  </div>
                  <div class="building-status">
                    <span v-if="building.built" class="status-built">{{ building.level }}级</span>
                    <span v-else-if="building.constructing" class="status-constructing">建设中 {{ building.progress }}%</span>
                    <span v-else class="status-planned">未建设</span>
                  </div>
                </div>
                <div class="building-actions">
                  <button v-if="!building.built && !building.constructing" class="btn btn-tiny" @click="startConstruction(building)">
                    建设 ({{ building.cost }}🪙)
                  </button>
                  <template v-else-if="building.built">
                    <button class="btn btn-tiny" @click="enterBuilding(building)">
                      进入
                    </button>
                    <button class="btn btn-tiny" @click="upgradeBuilding(building)">
                      升级
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 宗门事务 -->
        <div class="sect-section affairs-section">
          <div class="section-header">
            <h2><span class="section-icon">📜</span>宗门事务</h2>
          </div>
          <div class="affairs-content">
            <div class="affairs-grid">
              <div class="affair-item" @click="openDailyTasks">
                <div class="affair-icon">📋</div>
                <div class="affair-text">
                  <div class="affair-title">每日任务</div>
                  <div class="affair-desc">完成 {{ completedTasks }}/{{ totalTasks }} 项任务</div>
                </div>
                <div class="affair-arrow">→</div>
              </div>
              <div class="affair-item" @click="openSectEvents">
                <div class="affair-icon">⚡</div>
                <div class="affair-text">
                  <div class="affair-title">宗门事件</div>
                  <div class="affair-desc">{{ pendingEvents }} 个待处理事件</div>
                </div>
                <div class="affair-arrow">→</div>
              </div>
              <div class="affair-item" @click="openAllianceManagement">
                <div class="affair-icon">🤝</div>
                <div class="affair-text">
                  <div class="affair-title">联盟管理</div>
                  <div class="affair-desc">管理与其他宗门的关系</div>
                </div>
                <div class="affair-arrow">→</div>
              </div>
              <div class="affair-item" @click="openSectHistory">
                <div class="affair-icon">📚</div>
                <div class="affair-text">
                  <div class="affair-title">宗门史册</div>
                  <div class="affair-desc">查看宗门发展历程</div>
                </div>
                <div class="affair-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useInventoryStore } from '../store/inventory.js';
import { ALL_ORES } from '../models/ore.js';
import { levelName } from '../models/realms.js';

const inv = useInventoryStore();

// 宗门基本信息
const sectName = ref('凌霞宗');
const sectMotto = ref('道法自然，青云直上');
const sectLevel = ref(1);
const sectWealth = ref(1000);
const sectReputation = ref(100);
// 弟子数量改为从独立的弟子仓库派生
import { useDisciplesStore } from '../store/disciples.js';
const dStore = useDisciplesStore();
const totalDisciples = computed(() => dStore.count | 0);

// 任务和事件
const completedTasks = ref(3);
const totalTasks = ref(5);
const pendingEvents = ref(2);

// 宗门仓库逻辑
const ORE_ID_TO_NAME = Object.fromEntries(ALL_ORES.map(o => [o.id, o.name]));
const sectEntries = computed(() => {
  const res = [];
  for (const [key, cnt] of Object.entries(inv.sectInventory || {})) {
    const label = ORE_ID_TO_NAME[key] || key;
    if (cnt > 0) {
      res.push([label, cnt]);
    }
  }
  return res.sort((a, b) => b[1] - a[1]); // 按数量排序
});

const sectTotal = computed(() => Object.values(inv.sectInventory || {}).reduce((a,b) => a + (b||0), 0));

const warehouseValue = computed(() => {
  // 简单的价值计算，不同矿石有不同价值
  const oreValues = { 'A': 10, 'B': 15, 'C': 20, 'D': 25, 'E': 30 };
  let total = 0;
  for (const [key, cnt] of Object.entries(inv.sectInventory || {})) {
    const value = oreValues[key] || 10;
    total += (cnt || 0) * value;
  }
  return total;
});

// 弟子数据：使用独立弟子仓库
const disciples = computed(() => dStore.members);

// 建筑数据
const buildings = ref([
  { id: 1, name: '蕴丹堂', icon: '⚗️', description: '炼制丹药', built: true, constructing: false, level: 1, cost: 1000 },
  { id: 2, name: '凝器堂', icon: '⚒️', description: '凝炼法器', built: true, constructing: false, level: 1, cost: 1500 },
  { id: 3, name: '擎天殿', icon: '🌌', description: '悟道问天', built: true, constructing: false, level: 1, cost: 800 },
  { id: 4, name: '参青殿', icon: '🏛️', description: '闭关禅定', built: true, constructing: false, level: 1, cost: 3000 },
  { id: 5, name: '龙吟阁', icon: '📚', description: '参悟典籍', built: true, constructing: false, level: 1, cost: 2000 },
  { id: 6, name: '牧云谷', icon: '🏞️', description: '互通有无', built: true, constructing: false, level: 1, cost: 1200 },
]);

// 工具函数
const getOreIcon = (name) => {
  const icons = { 'A': '🔴', 'B': '🟠', 'C': '🟡', 'D': '🟢', 'E': '🔵' };
  return icons[name] || '💎';
};

const getStatusText = (status) => {
  const statusMap = {
    '寻秘': '寻秘',
    '驻守': '驻守',
    '闭关': '闭关',
    '走火入魔': '走火入魔',
  };
  return statusMap[status] || String(status || '未知');
};

// 事件处理函数
const recruitDisciple = () => { if (totalDisciples.value < 50) dStore.recruitOne(); };

import { useHeroesStore } from '../store/heroes.js';
import { useGameStore } from '../store/game.js';
const heroes = useHeroesStore();
const game = useGameStore();

const assignTask = (disciple) => {
  if (!disciple) return;
  if (disciple.status === '驻守') {
    if (heroes.count >= 5) { alert('队伍已满（最多5人）'); return; }
    disciple.status = '寻秘';
    heroes.addIfNotExists(disciple);
  } else if (disciple.status === '寻秘') {
    if (!game.heroAtVillage) return; // 非宗门位置不可切换
    disciple.status = '驻守';
    heroes.removeById(disciple.id);
  }
};

const startConstruction = (building) => {
  // TODO: 实现开始建设功能
  console.log('开始建设:', building.name);
};

import { useRouter } from 'vue-router';
const router = useRouter();
const enterBuilding = (building) => {
  const map = new Map([
    ['蕴丹堂', '/pill'],
    ['凝器堂', '/forge'],
    ['擎天殿', '/platform'],
    ['龙吟阁', '/pavilion'],
    ['参青殿', '/hall'],
  ]);
  const to = map.get(building.name);
  if(to) router.push(to);
};

const upgradeBuilding = (building) => {
  // TODO: 实现建筑升级功能
  console.log('升级建筑:', building.name);
};

const openDailyTasks = () => {
  // TODO: 打开每日任务界面
  console.log('打开每日任务');
};

const openSectEvents = () => {
  // TODO: 打开宗门事件界面
  console.log('打开宗门事件');
};

const openAllianceManagement = () => {
  // TODO: 打开联盟管理界面
  console.log('打开联盟管理');
};

const openSectHistory = () => {
  // TODO: 打开宗门史册界面
  console.log('打开宗门史册');
};
</script>

<style scoped>
.sect-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 宗门标题区域 */
.sect-header {
  margin-bottom: 30px;
}

.sect-title-container {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, var(--panel) 0%, #1f2347 100%);
  padding: 25px;
  border-radius: 15px;
  border: 1px solid #3a3f62;
  position: relative;
  overflow: hidden;
}

.sect-title-row{ display:flex; align-items: baseline; gap:18px; flex-wrap: wrap; }
.sect-title-name{ margin:0; }

.sect-title-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), #9b59b6, var(--accent));
}

.sect-emblem {
  font-size: 48px;
  filter: drop-shadow(0 0 10px rgba(124, 131, 255, 0.3));
}

.sect-title-text h1 { margin: 0 0 8px 0; font-size: 32px; color: var(--text); text-shadow: 0 2px 4px rgba(0,0,0,.3); }

.sect-motto {
  margin: 0;
  color: var(--muted);
  font-style: italic;
  font-size: 16px;
}

.level-badge {
  background: linear-gradient(135deg, var(--accent), #9b59b6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(124, 131, 255, 0.3);
  display: inline-flex;
  align-items: center;
  line-height: 1;
  position: relative;
  top: -6px; /* 微调，进一步避免视觉下坠 */
}

/* 宗门概览 */
.sect-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background: var(--panel);
  border: 1px solid #3a3f62;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
}

.overview-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(124, 131, 255, 0.2);
  transform: translateY(-2px);
}

.overview-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 131, 255, 0.1);
  border-radius: 10px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 4px;
}

.overview-label {
  font-size: 12px;
  color: var(--muted);
}

/* 主要内容区域 */
.sect-content {
  display: flex;
  gap: 25px;
  align-items: flex-start;
}

.sect-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.sect-left-column {
  /* 左列样式 */
}

.sect-right-column {
  /* 右列样式 */
}

.sect-section {
  background: var(--panel);
  border: 1px solid #3a3f62;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  height: auto; /* 确保高度自适应 */
}

.sect-section:hover {
  border-color: rgba(124, 131, 255, 0.5);
}

.section-header {
  background: linear-gradient(135deg, #23273d 0%, #2a2f4d 100%);
  padding: 20px;
  border-bottom: 1px solid #3a3f62;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 20px;
}

.section-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.section-description {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 15px 0;
}

/* 按钮样式 */
.btn {
  background: #2b3050;
  color: var(--text);
  border: 1px solid #3a3f62;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #3a3f62;
  border-color: var(--accent);
}

.btn-small {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-tiny {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-secondary {
  background: rgba(124, 131, 255, 0.1);
  border-color: var(--accent);
  color: var(--accent);
}

/* 仓库样式 */
.warehouse-content,
.disciples-content,
.buildings-content,
.affairs-content {
  padding: 20px;
}

.stat-icon {
  font-size: 16px;
}

.warehouse-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  justify-content: center;
}

.warehouse-badge {
  background: linear-gradient(135deg, #23273d 0%, #2a2f4d 100%);
  border: 1px solid #3a3f62;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.warehouse-badge:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.badge-icon {
  font-size: 16px;
}

.badge-text {
  color: var(--text);
  font-weight: 500;
}

.badge-count {
  background: var(--accent);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

/* 弟子网格 */
.disciples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.disciple-card {
  background: #23273d;
  border: 1px solid #3a3f62;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
}

.disciple-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.disciple-avatar {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 131, 255, 0.1);
  border-radius: 50%;
}

.disciple-info {
  flex: 1;
}

/* 一行显示：名字（境界 ｜ 状态） */
.disciple-line { display:flex; align-items: baseline; gap:6px; flex-wrap: wrap; }
.disciple-name-strong { font-weight: 800; color: var(--text); font-size: 15px; }
.disciple-meta { font-size: 12px; color: var(--muted); font-weight: 400; }

.disciple-name {
  font-weight: bold;
  color: var(--text);
  margin-bottom: 4px;
}

.disciple-level {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}

.disciple-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.disciple-status.training {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.disciple-status.available {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.disciple-status.mission {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
}

/* 建筑网格 */
.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.building-card {
  background: #23273d;
  border: 1px solid #3a3f62;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.building-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.building-card.built {
  border-color: rgba(46, 204, 113, 0.5);
}

.building-card.constructing {
  border-color: rgba(241, 196, 15, 0.5);
}

.building-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 131, 255, 0.1);
  border-radius: 8px;
}

.building-info {
  flex: 1;
}

.building-name { font-weight: 700; color: var(--text); margin-bottom: 4px; display:flex; align-items: baseline; gap:6px; flex-wrap: wrap; }
.building-name-strong { font-weight: 800; color: var(--text); }
.building-meta { font-size: 12px; color: var(--muted); font-weight: 400; }

.sect-level { align-self: center; display:flex; align-items:center; }

.status-built {
  color: #2ecc71;
  font-size: 11px;
  font-weight: bold;
}

.status-constructing {
  color: #f1c40f;
  font-size: 11px;
  font-weight: bold;
}

.status-planned {
  color: var(--muted);
  font-size: 11px;
}

.building-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 80px;
}

.building-actions .btn {
  background: linear-gradient(135deg, #2b3050 0%, #3a3f62 100%);
  border: 1px solid #4a4f72;
  color: var(--text);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: center;
  min-width: 60px;
}

.building-actions .btn:hover {
  background: linear-gradient(135deg, #3a3f62 0%, #4a4f72 100%);
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(124, 131, 255, 0.2);
}

.building-actions .btn:active {
  transform: translateY(0);
}

/* 事务网格 */
.affairs-grid {
  display: grid;
  gap: 12px;
  margin-top: 15px;
}

.affair-item {
  background: #23273d;
  border: 1px solid #3a3f62;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.affair-item:hover {
  border-color: var(--accent);
  background: #2a2f4d;
  transform: translateX(5px);
}

.affair-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 131, 255, 0.1);
  border-radius: 8px;
}

.affair-text {
  flex: 1;
}

.affair-title {
  font-weight: bold;
  color: var(--text);
  margin-bottom: 4px;
}

.affair-desc {
  font-size: 12px;
  color: var(--muted);
}

.affair-arrow {
  color: var(--accent);
  font-weight: bold;
  font-size: 18px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 弟子面板：限定最大高度，启用内滚动 */
.disciples-content {
  max-height: 460px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sect-content {
    flex-direction: column;
  }
  /* 扁平化左右两列，使子区块可在同一层级重排 */
  .sect-left-column,
  .sect-right-column {
    display: contents;
  }
  /* 一栏模式下的显示顺序：建设 → 弟子 → 仓库 → 事务 */
  .buildings-section { order: 1; }
  .disciples-section { order: 2; }
  .warehouse-section { order: 3; }
  .affairs-section { order: 4; }
  /* 确保区块占满宽度 */
  .sect-section { width: 100%; }
  
  .sect-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .disciples-grid,
  .buildings-grid {
    grid-template-columns: 1fr;
  }
  
  .sect-title-container {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
}
</style>
