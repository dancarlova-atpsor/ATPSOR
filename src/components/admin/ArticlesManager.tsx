"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { generateSlug } from "@/lib/utils";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Upload,
  Loader2, Newspaper, Calendar, Image,
} from "lucide-react";

const CATEGORIES = [
  { value: "intalniri", label: "Intalniri" },
  { value: "evenimente", label: "Evenimente" },
  { value: "comunicate", label: "Comunicate" },
  { value: "alte", label: "Altele" },
];

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "intalniri",
    is_published: false,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => { fetchArticles(); }, []);

  async function fetchArticles() {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    setArticles((data as Article[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ title: "", slug: "", content: "", excerpt: "", category: "intalniri", is_published: false });
    setCoverFile(null);
    setCoverPreview(null);
    setImageFiles([]);
    setExistingImages([]);
    setEditing(null);
    setCreating(false);
  }

  function startCreate() {
    resetForm();
    setCreating(true);
  }

  function startEdit(article: Article) {
    setForm({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || "",
      category: article.category,
      is_published: article.is_published,
    });
    setCoverPreview(article.cover_image);
    setExistingImages(article.images || []);
    setEditing(article);
    setCreating(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: editing ? f.slug : generateSlug(title),
    }));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!form.title || !form.content || !form.slug) {
      setMessage({ type: "error", text: "Titlul, slug-ul si continutul sunt obligatorii" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Upload cover image
      let coverUrl = coverPreview;
      if (coverFile) {
        const result = await uploadFile(coverFile, "articles/covers");
        if (result) coverUrl = result.url;
      }

      // Upload gallery images
      const uploadedImages = [...existingImages];
      for (const file of imageFiles) {
        const result = await uploadFile(file, "articles/gallery");
        if (result) uploadedImages.push(result.url);
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const articleData = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt || null,
        category: form.category,
        cover_image: coverUrl || null,
        images: uploadedImages,
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", editing.id);
        if (error) throw error;
        setMessage({ type: "success", text: "Articol actualizat!" });
      } else {
        const { error } = await supabase
          .from("articles")
          .insert({ ...articleData, author_id: user!.id });
        if (error) throw error;
        setMessage({ type: "success", text: "Articol creat!" });
      }

      resetForm();
      fetchArticles();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Eroare la salvare" });
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Sigur vrei sa stergi acest articol?")) return;
    const supabase = createClient();
    await supabase.from("articles").delete().eq("id", id);
    fetchArticles();
    setMessage({ type: "success", text: "Articol sters!" });
  }

  async function togglePublish(article: Article) {
    const supabase = createClient();
    await supabase.from("articles").update({
      is_published: !article.is_published,
      published_at: !article.is_published ? new Date().toISOString() : null,
    }).eq("id", article.id);
    fetchArticles();
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>;
  }

  // Create/Edit form
  if (creating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {editing ? "Editeaza Articol" : "Articol Nou"}
          </h3>
          <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {message && (
          <div className={`rounded-lg p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-md space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Titlu *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Intalnire cu Ministerul Transporturilor"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Categorie *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rezumat (optional)</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Scurt rezumat afisat in lista de articole..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Continut *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={10}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Continutul articolului..."
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Poza de coperta</label>
            {coverPreview ? (
              <div className="relative mb-2">
                <img src={coverPreview} alt="Cover" className="h-48 w-full rounded-lg object-cover" />
                <button
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:border-primary-400">
                <Upload className="h-5 w-5" /> Incarca poza de coperta
                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Gallery Images */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Galerie Foto</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {existingImages.map((img, i) => (
                <div key={`existing-${i}`} className="relative h-20 w-20">
                  <img src={img} alt={`Poza ${i + 1}`} className="h-full w-full rounded-lg object-cover" />
                  <button onClick={() => removeExistingImage(i)} className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {imageFiles.map((file, i) => (
                <div key={`new-${i}`} className="relative h-20 w-20">
                  <img src={URL.createObjectURL(file)} alt={`Noua ${i + 1}`} className="h-full w-full rounded-lg object-cover" />
                  <button onClick={() => removeNewImage(i)} className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Image className="h-4 w-4" /> Adauga poze
              <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
            </label>
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Publica imediat</span>
          </label>

          {/* Save */}
          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Anuleaza
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Salveaza Modificarile" : "Creeaza Articol"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{articles.length} articole</p>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" /> Adauga Articol
        </button>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {articles.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-md">
          <Newspaper className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nu ai articole inca</h3>
          <p className="mt-2 text-sm text-gray-500">Publica prima activitate a asociatiei.</p>
        </div>
      ) : (
        articles.map((article) => (
          <div key={article.id} className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md">
            <div className="flex items-center gap-4">
              {article.cover_image ? (
                <img src={article.cover_image} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                  <Newspaper className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{article.title}</h4>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${
                    article.category === "intalniri" ? "bg-blue-100 text-blue-700" :
                    article.category === "evenimente" ? "bg-green-100 text-green-700" :
                    article.category === "comunicate" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {CATEGORIES.find((c) => c.value === article.category)?.label}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.created_at).toLocaleDateString("ro-RO")}
                  </span>
                  {article.is_published ? (
                    <span className="flex items-center gap-1 text-green-600"><Eye className="h-3 w-3" /> Publicat</span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600"><EyeOff className="h-3 w-3" /> Ciorna</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => togglePublish(article)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600" title={article.is_published ? "Dezpublica" : "Publica"}>
                {article.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => startEdit(article)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600" title="Editeaza">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(article.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600" title="Sterge">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
