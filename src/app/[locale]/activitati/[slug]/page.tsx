"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft, Calendar, User, Newspaper, Loader2,
  Handshake, PartyPopper, Megaphone, ChevronLeft, ChevronRight,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  intalniri: "Intalniri",
  evenimente: "Evenimente",
  comunicate: "Comunicate",
  alte: "Altele",
};

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
  content: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  published_at: string;
  author: { full_name: string } | null;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    async function fetchArticle() {
      const supabase = createClient();
      const { data } = await supabase
        .from("articles")
        .select("*, author:profiles(full_name)")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      setArticle(data as Article | null);
      setLoading(false);
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Newspaper className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Articol negasit</h1>
        <p className="mt-2 text-gray-600">Acest articol nu exista sau nu a fost publicat.</p>
        <Link href="/activitati" className="mt-4 inline-block text-primary-500 hover:text-primary-600">
          ← Inapoi la Activitati
        </Link>
      </div>
    );
  }

  const allImages = article.images?.length > 0 ? article.images : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/activitati" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la Activitati
      </Link>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full object-cover"
            style={{ maxHeight: 400 }}
          />
        </div>
      )}

      {/* Category + Date + Author */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${CATEGORY_COLORS[article.category] || CATEGORY_COLORS.alte}`}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {formatDate(article.published_at)}
        </span>
        {article.author?.full_name && (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <User className="h-4 w-4" />
            {article.author.full_name}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">{article.title}</h1>

      {/* Content */}
      <div
        className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-primary-500"
        dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
      />

      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Galerie Foto</h3>

          {/* Main image */}
          <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-100">
            <img
              src={allImages[galleryIndex]}
              alt={`Poza ${galleryIndex + 1}`}
              className="mx-auto max-h-96 object-contain"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex((i) => (i === 0 ? allImages.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setGalleryIndex((i) => (i === allImages.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === galleryIndex ? "border-primary-500" : "border-transparent"
                  }`}
                >
                  <img src={img} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
