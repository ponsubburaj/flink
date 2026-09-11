"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type ProfileData = {
  user: {
    id: string;
    username: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    _count: { posts: number; flicks: number; followers: number; following: number };
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
};

type Post = {
  id: string;
  mediaUrls: string[];
  caption: string | null;
  _count: { likes: number; comments: number };
};

export default function ProfilePage() {
  const { username } = useParams();
  const { status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setData(json);
      });

    fetch(`/api/users/${username}/posts`)
      .then((res) => res.json())
      .then((json) => setPosts(json.posts || []));
  }, [username]);

    const router = useRouter();
    async function handleMessage() {
    if (!data) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: data.user.id }),
    });
    const json = await res.json();
    if (res.ok) {
      router.push(`/messages/${json.conversationId}`);
    }
  }
  async function handleFollow() {
    if (!data) return;
    setFollowLoading(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: data.user.id }),
    });
    const json = await res.json();
    setFollowLoading(false);

    if (res.ok) {
      setData({
        ...data,
        isFollowing: json.following,
        user: {
          ...data.user,
          _count: {
            ...data.user._count,
            followers: data.user._count.followers + (json.following ? 1 : -1),
          },
        },
      });
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ash">
        User not found.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ash">
        Loading…
      </div>
    );
  }

  const { user, isOwnProfile, isFollowing } = data;

  return (
    <div className="min-h-screen bg-paper px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-8 mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-flash to-signal p-[3px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-paper overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-flash text-3xl font-display">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="font-display text-xl font-semibold text-ink">
                {user.username}
              </h1>

              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="text-sm border border-mist rounded px-4 py-1.5 text-ink hover:bg-mist/40 transition-colors"
                >
                  Edit profile
                </Link>
                                          ) : status === "authenticated" ? (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`text-sm rounded-lg px-4 py-1.5 font-medium transition-opacity disabled:opacity-60 ${
                      isFollowing
                        ? "border border-mist text-ink hover:bg-mist/40"
                        : "bg-gradient-to-r from-flash to-signal text-white hover:opacity-90"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="text-sm border border-mist rounded px-4 py-1.5 text-ink hover:bg-mist/40 transition-colors"
                  >
                    Message
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex gap-6 text-sm text-ink mb-3">
              <span><strong>{user._count.posts + user._count.flicks}</strong> posts</span>
              <span><strong>{user._count.followers}</strong> followers</span>
              <span><strong>{user._count.following}</strong> following</span>
            </div>

            <p className="text-ink font-medium text-sm">{user.name}</p>
            {user.bio && <p className="text-ash text-sm mt-1">{user.bio}</p>}
          </div>
        </div>

        <div className="border-t border-mist pt-8">
          {posts.length === 0 ? (
            <p className="text-center text-ash text-sm">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                             <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-mist overflow-hidden rounded-xl">
              <img
                src={post.mediaUrls[0]}
                alt={post.caption || "Post"}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}