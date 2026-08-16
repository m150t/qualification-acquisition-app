self.addEventListener("push", (event) => {
  // バックグラウンド受信時も必ずユーザーに見える通知として表示する。
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "QUALog", {
    body: data.body || "今日の学習状況を確認しましょう。",
    icon: "/qualog-logo.svg",
    badge: "/qualog-logo.svg",
    data: { url: data.url || "/home" },
    tag: "study-reminder",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/home", self.location.origin).href;
  // 同じ画面が開いていれば再利用し、なければ通知内容に応じた画面を開く。
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url === target);
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});
