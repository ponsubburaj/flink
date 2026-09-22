"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CropModal from "@/components/CropModal";
import { prepareFileForUpload } from "@/lib/uploadFile";

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      setName(u.name || "");
      setUsername(u.username || "");
      setAvatarUrl(u.image || "");
    }
  }, [session]);

      async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const file = await prepareFileForUpload(raw);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropDone(blob: Blob) {
    setCropSrc(null);
    setUploading(true);
    setError("");

    try {
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "image/jpeg", folder: "avatars" }),
      });
      const presignData = await presignRes.json();

      if (!presignRes.ok) {
        setError(presignData.error || "Upload failed");
        setUploading(false);
        return;
      }

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!uploadRes.ok) {
        setError("Upload failed, please try again");
        setUploading(false);
        return;
      }

      setAvatarUrl(presignData.publicUrl);
    } catch {
      setError("Upload failed, please try again");
    }

    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, bio, avatarUrl: avatarUrl || undefined }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    await update();
    setSuccess(true);
    setTimeout(() => router.push(`/${username}`), 800);
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-ink mb-8">
          Edit profile
        </h1>

        <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-flash to-signal p-[3px]">
            <div className="w-full h-full rounded-full bg-paper overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-flash text-2xl font-display">
                  {name.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
          </div>
          <label className="text-flash font-medium text-sm cursor-pointer hover:underline">
            {uploading ? "Uploading…" : "Change photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ink mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="w-full border border-mist rounded px-3.5 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
            />
          </div>
          <div>
            <label className="block text-sm text-ink mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              className="w-full border border-mist rounded px-3.5 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
            />
          </div>
          <div>
            <label className="block text-sm text-ink mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              className="w-full border border-mist rounded px-3.5 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash resize-none"
              placeholder="Tell people about yourself"
            />
            <p className="text-ash text-xs mt-1">{bio.length}/150</p>
          </div>

          {error && <p className="text-signal text-sm">{error}</p>}
          {success && <p className="text-flash text-sm">Saved! Redirecting…</p>}

          <button
            type="submit"
            disabled={saving || uploading}
                        className="w-full bg-gradient-to-r from-flash to-signal text-white rounded-lg px-4 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
                </form>
      </div>

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
}