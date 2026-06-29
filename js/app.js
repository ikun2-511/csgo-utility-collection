const typeLabels = { smoke: '烟雾弹', flash: '闪光弹', molotov: '燃烧弹', he: 'HE手雷' };
const sideLabels = { ct: 'CT', t: 'T' };
const STORAGE_PREFIX = 'csgo_';
let appInstance = null;

class App {
  constructor() {
    appInstance = this;
    this.spots = [];
    this.filters = { side: 'all', type: 'all' };
    this.currentPage = this.getPageName();
    this.editingMapId = null;
    this.init();
  }

  getPageName() {
    const path = window.location.pathname.split('/').pop();
    return path === 'index.html' || path === '' ? 'index' : path.replace('.html', '');
  }

  async init() {
    if (this.currentPage === 'index') {
      this.initIndex();
    } else {
      await this.initGallery();
    }
  }

  // ========== 数据存取 ==========
  loadData(key) {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key)); }
    catch { return null; }
  }

  saveData(key, data) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  }

  async loadSpots(mapId) {
    const local = this.loadData(`spots_${mapId}`);
    if (local) return local;
    try {
      const res = await fetch(`data/${mapId}.json`);
      const data = await res.json();
      this.saveData(`spots_${mapId}`, data.spots);
      return data.spots;
    } catch { return []; }
  }

  saveSpots(mapId, spots) {
    this.saveData(`spots_${mapId}`, spots);
  }

  loadMaps() {
    const local = this.loadData('maps');
    if (local) return local;
    const defaults = [
      { id: 'dust2', name: '炙热沙城2', en: 'Dust2', ready: true },
      { id: 'mirage', name: '荒漠迷城', en: 'Mirage', ready: false },
      { id: 'inferno', name: '炼狱小镇', en: 'Inferno', ready: false },
      { id: 'nuke', name: '核子危机', en: 'Nuke', ready: false },
    ];
    this.saveData('maps', defaults);
    return defaults;
  }

  saveMaps(maps) { this.saveData('maps', maps); }

  // ========== 首页 ==========
  initIndex() {
    const grid = document.getElementById('mapGrid');
    if (!grid) return;
    const maps = this.loadMaps();
    this.renderMaps(grid, maps);
    this.bindAddMap(grid);
  }

  renderMaps(grid, maps) {
    grid.innerHTML = maps.map(m => {
      const imageHtml = m.overview
        ? `<img src="${m.overview}" alt="${m.name}">`
        : `<div class="placeholder">🗺</div>`;
      const body = `
        <div class="map-card-image">${imageHtml}</div>
        <div class="map-card-body">
          <h2>${m.name}</h2>
          <div class="sub">${m.en}</div>
        </div>
        <button class="map-edit-btn" data-id="${m.id}" title="编辑">✏️</button>
        <button class="map-delete-btn" data-id="${m.id}" title="删除">🗑</button>
      `;
      return m.ready
        ? `<div class="map-card-wrap"><a href="${m.id}.html" class="map-card">${body}</a></div>`
        : `<div class="map-card-wrap"><div class="map-card coming-soon">${body}</div></div>`;
    }).join('') + `
      <div class="map-card add-card" id="addMapCard">
        <div class="add-icon">+</div>
        <div class="add-text">添加新地图</div>
      </div>
    `;
    setTimeout(() => {
      const addCard = document.getElementById('addMapCard');
      if (addCard) addCard.addEventListener('click', () => this.showAddMapModal());

      // 编辑按钮
      grid.querySelectorAll('.map-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showEditMapModal(btn.dataset.id);
        });
      });

      // 删除按钮
      grid.querySelectorAll('.map-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm('确定删除这个地图吗？')) {
            this.deleteMap(btn.dataset.id);
          }
        });
      });
    }, 50);
  }

  showAddMapModal() {
    document.getElementById('addMapModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  handleAddMap() {
    const name = document.getElementById('newMapName').value.trim();
    const en = document.getElementById('newMapEn').value.trim();
    if (!name || !en) { alert('请填写地图名称'); return; }

    const id = en.toLowerCase().replace(/\s+/g, '');
    const maps = this.loadMaps();
    if (maps.some(m => m.id === id)) { alert('该地图已存在'); return; }

    const file = document.getElementById('newMapOverview').files[0];
    const addMap = (overview) => {
      maps.push({ id, name, en, overview, ready: true });
      this.saveMaps(maps);
      document.getElementById('addMapModal').classList.remove('active');
      document.body.style.overflow = '';
      this.renderMaps(document.getElementById('mapGrid'), maps);
      this.bindAddMap(document.getElementById('mapGrid'));
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => addMap(e.target.result);
      reader.readAsDataURL(file);
    } else {
      addMap('');
    }
    document.getElementById('addMapForm').reset();
  }

  showEditMapModal(mapId) {
    const maps = this.loadMaps();
    const map = maps.find(m => m.id === mapId);
    if (!map) return;

    // 存到 DOM 上，避免丢失
    document.getElementById('editMapModal').dataset.mapId = mapId;
    document.getElementById('editMapName').value = map.name;
    document.getElementById('editMapEn').value = map.en;
    document.getElementById('editMapModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  handleEditMap() {
    const name = document.getElementById('editMapName').value.trim();
    const en = document.getElementById('editMapEn').value.trim();
    if (!name || !en) { alert('请填写地图名称'); return; }

    const mapId = document.getElementById('editMapModal').dataset.mapId;
    const maps = this.loadMaps();
    const index = maps.findIndex(m => m.id === mapId);
    if (index === -1) return;

    const fileInput = document.getElementById('editMapOverview');
    const file = fileInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        maps[index].name = name;
        maps[index].en = en;
        maps[index].overview = e.target.result;
        appInstance.saveMaps(maps);
        document.getElementById('editMapModal').classList.remove('active');
        document.body.style.overflow = '';
        appInstance.renderMaps(document.getElementById('mapGrid'), maps);
      };
      reader.readAsDataURL(file);
    } else {
      maps[index].name = name;
      maps[index].en = en;
      this.saveMaps(maps);
      document.getElementById('editMapModal').classList.remove('active');
      document.body.style.overflow = '';
      this.renderMaps(document.getElementById('mapGrid'), maps);
    }
  }

  deleteMap(mapId) {
    let maps = this.loadMaps();
    maps = maps.filter(m => m.id !== mapId);
    this.saveMaps(maps);
    this.renderMaps(document.getElementById('mapGrid'), maps);
  }

  // ========== 导入导出 ==========
  exportData(mapId) {
    const spots = this.loadData(`spots_${mapId}`) || [];
    const exportObj = {
      version: 1,
      map: mapId,
      exportedAt: new Date().toISOString(),
      spots: spots
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csgo-${mapId}-spots.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(mapId) {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];
    if (!file) { alert('请选择 JSON 文件'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.spots || !Array.isArray(data.spots)) {
          alert('文件格式不正确');
          return;
        }
        // 合并数据：跳过已存在的 id
        const existing = this.loadData(`spots_${mapId}`) || [];
        const existingIds = new Set(existing.map(s => s.id));
        const newSpots = data.spots.filter(s => !existingIds.has(s.id));
        const merged = [...existing, ...newSpots];
        this.saveSpots(mapId, merged);
        this.spots = merged;
        this.render();
        document.getElementById('importModal').classList.remove('active');
        document.body.style.overflow = '';
        alert(`导入成功！新增 ${newSpots.length} 个道具，跳过 ${data.spots.length - newSpots.length} 个重复项`);
      } catch (err) {
        alert('文件解析失败：' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ========== 道具画廊页 ==========
  async initGallery() {
    this.spots = await this.loadSpots(this.currentPage);

    const maps = this.loadMaps();
    const mapInfo = maps.find(m => m.id === this.currentPage);
    if (mapInfo) {
      const titleEl = document.querySelector('.header h1');
      if (titleEl) titleEl.textContent = `${mapInfo.en} ${mapInfo.name}`;
    }

    this.bindFilters();
    this.render();
    this.bindModal();
    this.bindAddSpot();
    this.bindImportExport();
  }

  bindImportExport() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const confirmImport = document.getElementById('confirmImportBtn');

    if (exportBtn) exportBtn.addEventListener('click', () => this.exportData(this.currentPage));
    if (importBtn) importBtn.addEventListener('click', () => {
      document.getElementById('importModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    if (confirmImport) confirmImport.addEventListener('click', () => this.importData(this.currentPage));
  }

  bindFilters() {
    document.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        const value = btn.dataset.value;
        btn.parentElement.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filters[filter] = value;
        this.render();
      });
    });
  }

  getFiltered() {
    return this.spots.filter(s => {
      if (this.filters.side !== 'all' && s.side !== this.filters.side) return false;
      if (this.filters.type !== 'all' && s.type !== this.filters.type) return false;
      return true;
    });
  }

  render() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const filtered = this.getFiltered();
    if (filtered.length === 0) {
      gallery.innerHTML = '<div class="empty">暂无匹配的道具点位<br><small>点击右上角"+ 添加道具"或"📥 导入"添加内容</small></div>';
      return;
    }

    gallery.innerHTML = filtered.map(spot => `
      <div class="spot-card" data-id="${spot.id}">
        <div class="spot-card-images">
          <div class="spot-card-img">
            ${spot.images.lineup
              ? `<img src="${spot.images.lineup}" alt="${spot.name} 站位" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="placeholder-text" style="display:none">站位截图</span>`
              : `<span class="placeholder-text">站位截图</span>`
            }
          </div>
          <div class="spot-card-img">
            ${spot.images.result
              ? `<img src="${spot.images.result}" alt="${spot.name} 效果" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="placeholder-text" style="display:none">效果图</span>`
              : `<span class="placeholder-text">效果图</span>`
            }
          </div>
        </div>
        <div class="spot-card-info">
          <div class="spot-card-name">${spot.name}</div>
          <div class="spot-card-tags">
            <span class="spot-tag ${spot.type}">${typeLabels[spot.type]}</span>
            <span class="spot-tag ${spot.side}">${sideLabels[spot.side]}</span>
          </div>
          <button class="delete-btn" data-id="${spot.id}" title="删除">🗑</button>
        </div>
      </div>
    `).join('');

    gallery.querySelectorAll('.spot-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) return;
        const spot = this.spots.find(s => s.id === card.dataset.id);
        if (spot) this.openModal(spot);
      });
    });

    gallery.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确定删除这个道具吗？')) {
          this.spots = this.spots.filter(s => s.id !== btn.dataset.id);
          this.saveSpots(this.currentPage, this.spots);
          this.render();
        }
      });
    });
  }

  // ========== 添加道具 ==========
  bindAddSpot() {
    const addBtn = document.getElementById('addSpotBtn');
    if (addBtn) addBtn.addEventListener('click', () => {
      document.getElementById('addSpotModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeBtn = document.getElementById('closeAddSpot');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      document.getElementById('addSpotModal').classList.remove('active');
      document.body.style.overflow = '';
    });

    const form = document.getElementById('addSpotForm');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddSpot();
    });
  }

  handleAddSpot() {
    const name = document.getElementById('spotNameInput').value.trim();
    const type = document.getElementById('spotTypeInput').value;
    const side = document.getElementById('spotSideInput').value;
    const difficulty = parseInt(document.getElementById('spotDifficultyInput').value);
    const desc = document.getElementById('spotDescInput').value.trim();
    const stand = document.getElementById('spotStandInput').value.trim();
    const aim = document.getElementById('spotAimInput').value.trim();
    const throwType = document.getElementById('spotThrowInput').value.trim();
    const lineupFile = document.getElementById('spotLineupInput').files[0];
    const resultFile = document.getElementById('spotResultInput').files[0];

    if (!name) { alert('请填写道具名称'); return; }

    const buildSpot = (lineupData, resultData) => ({
      id: `${type}-${Date.now()}`,
      name, type, side, difficulty,
      description: desc || `${name} - ${typeLabels[type]}`,
      lineup: { stand: stand || '无', aim: aim || '无', throw: throwType || '普通投掷' },
      images: { lineup: lineupData || '', result: resultData || '' }
    });

    const reads = [];
    if (lineupFile) reads.push(new Promise(r => { const rd = new FileReader(); rd.onload = e => r(e.target.result); rd.readAsDataURL(lineupFile); }));
    if (resultFile) reads.push(new Promise(r => { const rd = new FileReader(); rd.onload = e => r(e.target.result); rd.readAsDataURL(resultFile); }));

    Promise.all(reads).then(results => {
      const lineupData = results[0] || '';
      const resultData = results[1] || '';
      this.spots.push(buildSpot(lineupData, resultData));
      this.saveSpots(this.currentPage, this.spots);
      this.render();
      document.getElementById('addSpotModal').classList.remove('active');
      document.body.style.overflow = '';
      document.getElementById('addSpotForm').reset();
    });
  }

  // ========== 弹窗 ==========
  bindModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
      }
    });
  }

  openModal(spot) {
    const modal = document.getElementById('modal');
    if (!modal) return;

    document.getElementById('modalName').textContent = spot.name;
    document.getElementById('modalDesc').textContent = spot.description;
    document.getElementById('modalTags').innerHTML = `
      <span class="spot-tag ${spot.type}">${typeLabels[spot.type]}</span>
      <span class="spot-tag ${spot.side}">${sideLabels[spot.side]}</span>
    `;

    const lineupImg = document.getElementById('modalLineup');
    const resultImg = document.getElementById('modalResult');
    lineupImg.src = spot.images.lineup || '';
    resultImg.src = spot.images.result || '';
    lineupImg.style.display = spot.images.lineup ? '' : 'none';
    resultImg.style.display = spot.images.result ? '' : 'none';

    document.getElementById('modalStand').textContent = spot.lineup.stand;
    document.getElementById('modalAim').textContent = spot.lineup.aim;
    document.getElementById('modalThrow').textContent = spot.lineup.throw;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('modal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
  }
}

document.addEventListener('DOMContentLoaded', () => new App());
