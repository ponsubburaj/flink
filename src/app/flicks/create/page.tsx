"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateFlickPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 100 * 1024 * 1024) {
      setError("Video must be under 100MB");
      return;
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
  }

  function handleVideoLoaded() {
    const video = videoRef.current;
    if (!video) return;
    if (video.duration > 180) {
      setError("Flicks must be 3 minutes or shorter");
      setFile(null);
      setPreviewUrl("");
      return;
    }
    setDuration(Math.round(video.duration));
    video.currentTime = Math.min(0.5, video.duration / 2);
  }

  function captureThumbnail(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return resolve(null);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }

  async function uploadToR2(fileOrBlob: File | Blob, contentType: string, folder: string) {
    const presignRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, folder }),
    });
    const presignData = await presignRes.json();
    if (!presignRes.ok) throw new Error(presignData.error || "Upload failed");

    const uploadRes = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: fileOrBlob,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");

    return presignData.publicUrl as string;
  }

  async function handlePost() {
    if (!file) {
      setError("Select a video first");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const thumbBlob = await captureThumbnail();

      const videoUrl = await uploadToR2(file, file.type, "flicks");
      let thumbnailUrl: string | undefined;

      if (thumbBlob) {
        thumbnailUrl = await uploadToR2(thumbBlob, "image/jpeg", "flicks");
      }

      const res = await fetch("/api/flicks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, videoUrl, thumbnailUrl, duration: duration || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setUploading(false);
        return;
      }

      router.push("/flicks");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setUploading(false);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash">
        <p>You need to be logged in to post a Flick.</p>
        <Link href="/login" className="text-flash font-medium hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink mb-8">New Flick</h1>

        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-mist rounded-lg h-96 cursor-pointer hover:border-flash transition-colors">
            <span className="text-ash text-sm">Click to select a video</span>
            <span className="text-ash text-xs">Up to 3 minutes, 100MB</span>
            <input type="file" accept="video/mp4,video/webm" onChange={handleFileSelect} className="hidden" />
          </label>
        ) : (
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={previewUrl}
              onLoadedMetadata={handleVideoLoaded}
              controls
              className="w-full max-h-[500px]"
            />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {previewUrl && (
          <label className="text-flash text-sm font-medium cursor-pointer hover:underline inline-block mt-3">
            Choose a different video
            <input type="file" accept="video/mp4,video/webm" onChange={handleFileSelect} className="hidden" />
          </label>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={3}
          placeholder="Write a caption…"
          className="w-full border border-mist rounded px-3.5 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash resize-none mt-6"
        />

        {error && <p className="text-signal text-sm mt-2">{error}</p>}

        <button
          onClick={handlePost}
          disabled={uploading || !file}
          className="w-full bg-ink text-paper rounded px-4 py-2.5 font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 mt-6"
        >
          {uploading ? "Posting…" : "Share Flick"}
        </button>
      </div>
    </div>
  );
}