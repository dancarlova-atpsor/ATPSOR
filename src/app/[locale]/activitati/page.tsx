"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  Newspaper, Calendar, ArrowRight, Loader2, Filter,
  Handshake, PartyPopper, Megaphone, MoreHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "Toate", icon: Filter },
  { key: "intalniri", label: "Intalniri", icon: Handshake },
  { key: "evenimente", label: "Evenimente", icon: PartyPopper },
  { key: "comunicate", label: "Comunicate", icon: Megaphone },
  { key: "alte", label: "Altele", icon: MoreHorizontal },
];

const CATEGORY_COLORS: Record<string, string> = {
  intalniri: "bg-blue-100 text-blue-700",
  evenimente: "bg-green-100 text-green-700",
  comunicate: "bg-orange-100 text-orange-700",
  alte: "bg-gray-100 text-gray-700",
};

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  published_at: string;
  author: { full_name: string } | null;
}

export default function ActivitatiPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchArticles();
  }, [category]);

  async function fetchArticles() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("articles")
      .select("id, title, slug, excerpt, category, cover_image, published_at, author:profiles(full_name)")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (category !== "all") {
      query = query.eq("category", category);
    }

    const { data } = await query;
    setArticles((data as unknown as Article[]) || []);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Newspaper className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Activitati ATPSOR</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">
          Stiri, intalniri cu autoritatile, evenimente si tot ce face asociatia pentru transportatori
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Empty */}
      {!loading && articles.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-md">
          <Newspaper className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nu sunt articole inca</h3>
          <p className="mt-2 text-sm text-gray-500">Revino curand pentru stiri si activitati ATPSOR.</p>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/activitati/${article.slug}` as any}
              className="group overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl"
            >
              {/* Cover Image */}
              {article.cover_image ? (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                  <Newspaper className="h-12 w-12 text-primary-400" />
                </div>
              )}

              <div className="p-5">
                {/* Category + Date */}
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[article.category] || CATEGORY_COLORS.alte}`}>
                    {CATEGORIES.find((c) => c.key === article.category)?.label || article.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(article.published_at)}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary-600">
                  {article.title}
                </h2>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{article.excerpt}</p>
                )}

                {/* Read more */}
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-500">
                  Citeste mai mult
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
