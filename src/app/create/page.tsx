"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(0, 10);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
    setError("");
  }

  async function handlePost() {
    if (files.length === 0) {
      setError("Add at least one photo");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const mediaUrls: string[] = [];

      for (const file of files) {
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

        mediaUrls.push(presignData.publicUrl);
      }

      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, mediaUrls }),
      });
      const postData = await postRes.json();

      if (!postRes.ok) {
        setError(postData.error || "Something went wrong");
        setUploading(false);
        return;
      }

      const username = (session?.user as any)?.username;
      router.push(`/${username}`);
    } catch {
      setError("Something went wrong, please try again");
      setUploading(false);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash">
        <p>You need to be logged in to post.</p>
        <Link href="/login" className="text-flash font-medium hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-ink mb-8">
          New post
        </h1>

        {previews.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-mist rounded-lg h-72 cursor-pointer hover:border-flash transition-colors">
            <span className="text-ash text-sm">Click to select photos</span>
            <span className="text-ash text-xs">Up to 10 photos</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {previews.map((src, i) => (
              <div key={i} className="aspect-square rounded overflow-hidden bg-mist">
                <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <label className="text-flash text-sm font-medium cursor-pointer hover:underline">
            Choose different photos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
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
          disabled={uploading || files.length === 0}
          className="w-full bg-ink text-paper rounded px-4 py-2.5 font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 mt-6"
        >
          {uploading ? "Posting…" : "Share"}
        </button>
      </div>
    </div>
  );
}