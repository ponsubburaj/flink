"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, []);

    async function enable() {
    setLoading(true);
    setMessage("");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setLoading(false);
      if (permission === "denied") {
        setMessage("Notifications are blocked for this site. Check your browser's site settings to allow them, then try again.");
      }
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });

        setEnabled(true);
    setMessage("Notifications enabled! Tap 'Send test' below to try it.");
    setLoading(false);
  }

  async function disable() {
    setLoading(true);
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    setEnabled(false);
    setLoading(false);
  }

    if (!supported) {
    return <p className="text-ash text-sm py-2.5">Push notifications aren't supported in this browser.</p>;
  }

    async function sendTest() {
    await fetch("/api/push/test", { method: "POST" });
  }

  if (!supported) {
    return <p className="text-ash text-sm py-2.5">Push notifications aren't supported in this browser.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between py-2.5 text-sm text-ink">
        Push notifications
        <button
          onClick={enabled ? disable : enable}
          disabled={loading}
          className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-60 ${
            enabled ? "bg-gradient-to-r from-flash to-signal" : "bg-mist"
          }`}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
            style={{ left: enabled ? "22px" : "2px" }}
          />
        </button>
      </div>
      {message && <p className="text-flash text-xs pb-2">{message}</p>}
      {enabled && (
        <button onClick={sendTest} className="text-ash text-xs underline">
          Send test notification
        </button>
      )}
    </div>
  );
}