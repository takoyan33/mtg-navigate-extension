// ===============================
// DOM 要素取得
// ===============================
const urlInput = document.getElementById("url"); // MTG URL 入力欄
const datetimeInput = document.getElementById("datetime"); // 開始日時入力欄
const titleInput = document.getElementById("title"); // MTG名入力欄
const editIdInput = document.getElementById("editId"); // 編集中の予定ID
const listEl = document.getElementById("scheduleList"); // 予定一覧表示エリア

// ===============================
// 保存（新規 / 編集）
// ===============================
document.getElementById("save").addEventListener("click", async () => {
  const url = urlInput.value;
  const datetime = datetimeInput.value;
  const editId = editIdInput.value;
  const title = titleInput.value || "ミーティング"; // 未入力時のデフォルト名

  // 必須項目チェック
  if (!url || !datetime) return;

  // 指定日時を timestamp に変換
  const time = new Date(datetime).getTime();

  // 新規 or 編集でIDを切り替える
  const id = editId || `meeting-${time}`;

  // ===============================
  // 編集時：既存データ・アラームを削除
  // ===============================
  if (editId) {
    chrome.alarms.clear(editId); // 既存アラーム削除
    chrome.storage.local.remove(editId); // 既存データ削除
  }

  // ===============================
  // 予定を保存
  // ===============================
  await chrome.storage.local.set({
    [id]: { title, url, time },
  });

  // ===============================
  // 指定時刻に発火するアラームを登録
  // ===============================
  chrome.alarms.create(id, { when: time });

  // フォーム初期化 & 再描画
  resetForm();
  loadSchedules();
});

// ===============================
// フォーム初期化
// ===============================
function resetForm() {
  titleInput.value = "";
  urlInput.value = "";
  datetimeInput.value = "";
  editIdInput.value = "";
}

// ===============================
// 予定一覧を読み込み・表示
// ===============================
async function loadSchedules() {
  listEl.innerHTML = "";

  // storage に保存されている全予定を取得
  const data = await chrome.storage.local.get(null);

  // 時刻順にソート
  const entries = Object.entries(data).sort((a, b) => a[1].time - b[1].time);

  // 予定がない場合
  if (entries.length === 0) {
    listEl.textContent = "予定はありません";
    return;
  }

  // ===============================
  // 予定を1件ずつ描画
  // ===============================
  entries.forEach(([id, item]) => {
    const div = document.createElement("div");
    div.className = "item";

    const date = new Date(item.time).toLocaleString();

    div.innerHTML = `
      <div><strong>${item.title}</strong></div>
      <div>${date}</div>
      <div style="word-break: break-all;">${item.url}</div>
      <div class="item-actions">
        <button data-edit="${id}">編集</button>
        <button class="danger" data-delete="${id}">削除</button>
      </div>
    `;

    listEl.appendChild(div);
  });

  // 編集・削除ボタンにイベントを付与
  bindActions(data);
}

// ===============================
// 編集 / 削除ボタンのイベント登録
// ===============================
function bindActions(data) {
  // ---------- 編集 ----------
  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.edit;
      const item = data[id];

      // フォームに既存値を反映
      titleInput.value = item.title;
      urlInput.value = item.url;
      datetimeInput.value = new Date(item.time).toISOString().slice(0, 16);
      editIdInput.value = id;
    });
  });

  // ---------- 削除 ----------
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;

      // storage & アラームを削除
      await chrome.storage.local.remove(id);
      chrome.alarms.clear(id);

      // 一覧を再描画
      loadSchedules();
    });
  });
}

// 初期表示時に予定一覧を読み込む
loadSchedules();
