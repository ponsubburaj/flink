"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { prepareFileForUpload } from "@/lib/uploadFile";

export default function CreateBlipPage() {
  const { status } = useSession();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const f = await prepareFileForUpload(raw);

    const type = f.type.startsWith("video") ? "video" : "image";
    if (type === "video" && f.size > 50 * 1024 * 1024) {
      setError("Video must be under 50MB");
      return;
    }

    setFile(f);
    setMediaType(type);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
  }

  async function handlePost() {
    if (!file || !mediaType) return;
    setUploading(true);
    setError("");

    try {
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, folder: "posts" }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        setError(presignData.error || "Upload failed");
        setUploading(false);
        return;
      }

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        setError("Upload failed, please try again");
        setUploading(false);
        return;
      }

      const res = await fetch("/api/blips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl: presignData.publicUrl, mediaType }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setUploading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong, please try again");
      setUploading(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash">
        <p>You need to be logged in to post a Blip.</p>
        <Link href="/login" className="text-flash font-medium hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">New Blip</h1>
        <p className="text-ash text-sm mb-8">Visible for 24 hours, then it disappears.</p>

        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-mist rounded-lg h-96 cursor-pointer hover:border-flash transition-colors">
            <span className="text-ash text-sm">Click to select a photo or video</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={handleFileSelect} className="hidden" />
          </label>
        ) : (
          <div className="rounded-lg overflow-hidden bg-black">
            {mediaType === "video" ? (
              <video ref={videoRef} src={previewUrl} controls className="w-full max-h-[500px]" />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full max-h-[500px] object-contain" />
            )}
          </div>
        )}

        {previewUrl && (
          <label className="text-flash text-sm font-medium cursor-pointer hover:underline inline-block mt-3">
            Choose something different
            <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={handleFileSelect} className="hidden" />
          </label>
        )}

        {error && <p className="text-signal text-sm mt-3">{error}</p>}

        <button
          onClick={handlePost}
          disabled={uploading || !file}
          className="w-full bg-gradient-to-r from-flash to-signal text-white rounded-lg px-4 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-60 mt-6"
        >
          {uploading ? "Posting…" : "Share Blip"}
        </button>
      </div>
    </div>
  );
}