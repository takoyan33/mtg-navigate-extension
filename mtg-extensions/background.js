chrome.alarms.onAlarm.addListener(async (alarm) => {
  const data = await chrome.storage.local.get(alarm.name);
  const meeting = data[alarm.name];

  if (!meeting) return;

  // ① タブを開く
  const tab = await chrome.tabs.create({
    url: meeting.url,
    active: true,
  });

  // ② タブ読み込み完了後に alert
  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);

      chrome.scripting.executeScript({
        target: { tabId },
        func: (title) => {
          alert(`${title} の時間です`);
        },
        args: [meeting.title],
      });
    }
  });

  // 単発予定なら削除
  chrome.storage.local.remove(alarm.name);
});
