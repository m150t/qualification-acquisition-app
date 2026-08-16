"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { getAuthHeaders } from "@/lib/authClient";

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = `${value.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat((4 - value.length % 4) % 4)}`;
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new Uint8Array(bytes.buffer);
}

export default function NotificationSettings() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 未対応ブラウザでは設定導線自体を表示せず、既存の学習導線を妨げない。
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .catch(() => setSupported(false));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const headers = await getAuthHeaders();
      const configResponse = await fetch("/api/push-subscriptions", { headers });
      if (!configResponse.ok) throw new Error("通知設定を取得できませんでした");
      const config = await configResponse.json() as { publicKey: string };
      const registration = await navigator.serviceWorker.ready;
      // 権限確認後に購読を作成し、成功した購読だけをサーバーへ保存する。
      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(config.publicKey),
      });
      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(nextSubscription),
      });
      if (!response.ok) {
        await nextSubscription.unsubscribe();
        throw new Error("通知設定を保存できませんでした");
      }
      setSubscription(nextSubscription);
    } catch (error) {
      console.error("failed to enable push notifications", error);
      alert("通知を設定できませんでした。ブラウザの通知設定をご確認ください。");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!subscription) return;
    setBusy(true);
    try {
      const headers = await getAuthHeaders();
      // サーバー側を先に解除し、翌日の配信対象に残らないようにする。
      const response = await fetch("/api/push-subscriptions", {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!response.ok) throw new Error("通知設定を削除できませんでした");
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (error) {
      console.error("failed to disable push notifications", error);
      alert("通知を解除できませんでした。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={subscription ? disable : enable}
      disabled={busy}
      aria-label={subscription ? "学習リマインド通知を解除" : "学習リマインド通知を有効化"}
      title="毎日20時に未実施タスクをお知らせします"
      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
    >
      {subscription ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {busy ? "設定中…" : subscription ? "通知ON" : "通知を受け取る"}
    </button>
  );
}
