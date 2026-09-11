"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type PostData = {
  post: {
    id: string;
    mediaUrls: string[];
    caption: string | null;
    author: { id: string; username: string; avatarUrl: string | null };
    _count: { likes: number; comments: number };
  };
  isLiked: boolean;
};

type Comment = {
  id: string;
  text: string;
  user: { username: string; avatarUrl: string | null };
};

export default function PostDetailPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [data, setData] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`).then(async (res) => {
      if (!res.ok) return setNotFound(true);
      setData(await res.json());
    });
    fetch(`/api/comments?postId=${id}`)
      .then((res) => res.json())
      .then((json) => setComments(json.comments || []));
  }, [id]);

  async function handleLike() {
    if (!data || status !== "authenticated") return;
    setLikeLoading(true);
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: data.post.id }),
    });
    const json = await res.json();
    setLikeLoading(false);
    if (res.ok) {
      setData({
        ...data,
        isLiked: json.liked,
        post: {
          ...data.post,
          _count: { ...data.post._count, likes: data.post._count.likes + (json.liked ? 1 : -1) },
        },
      });
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !data) return;
    setPosting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment, postId: data.post.id }),
    });
    const json = await res.json();
    setPosting(false);
    if (res.ok) {
      setComments((prev) => [...prev, json.comment]);
      setNewComment("");
      setData({
        ...data,
        post: { ...data.post, _count: { ...data.post._count, comments: data.post._count.comments + 1 } },
      });
    }
  }

  if (notFound) {
    return <div className="min-h-screen flex items-center justify-center text-ash">Post not found.</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

  const { post, isLiked } = data;

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="rounded-lg overflow-hidden bg-mist mb-4">
          <img src={post.mediaUrls[0]} alt={post.caption || "Post"} className="w-full object-cover" />
        </div>

        <div className="flex items-center gap-3 mb-3">
          <Link href={`/${post.author.username}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-mist overflow-hidden flex items-center justify-center">
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-ash text-xs">{post.author.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-ink font-medium text-sm">{post.author.username}</span>
          </Link>
        </div>

        {post.caption && <p className="text-ink text-sm mb-4">{post.caption}</p>}

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleLike}
            disabled={likeLoading || status !== "authenticated"}
            className={`text-sm font-medium transition-colors ${isLiked ? "text-signal" : "text-ink hover:text-signal"}`}
          >
            {isLiked ? "♥ Liked" : "♡ Like"} · {post._count.likes}
          </button>
          <span className="text-ash text-sm">{post._count.comments} comments</span>
        </div>

        <div className="border-t border-mist pt-4 space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-ash text-sm">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-sm">
                <Link href={`/${c.user.username}`} className="font-medium text-ink hover:underline">
                  {c.user.username}
                </Link>{" "}
                <span className="text-ink">{c.text}</span>
              </div>
            ))
          )}
        </div>

        {status === "authenticated" && (
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              className="flex-1 border border-mist rounded px-3.5 py-2 text-sm text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="text-flash font-medium text-sm disabled:opacity-50"
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
}