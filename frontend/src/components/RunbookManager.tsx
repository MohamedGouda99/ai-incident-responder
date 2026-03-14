import { useState, useEffect } from "react";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import type { RunbookMetadata } from "../types";
import { api } from "../lib/api";

export function RunbookManager() {
  const [runbooks, setRunbooks] = useState<RunbookMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    tags: "",
  });

  const fetchRunbooks = async () => {
    try {
      const data = await api.getRunbooks();
      setRunbooks(data);
    } catch (err) {
      console.error("Failed to fetch runbooks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunbooks();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      await api.uploadRunbook({
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setForm({ title: "", content: "", category: "general", tags: "" });
      setShowForm(false);
      fetchRunbooks();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRunbook(id);
      fetchRunbooks();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Runbooks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Runbook
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleUpload}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3"
        >
          <input
            type="text"
            placeholder="Runbook title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Paste runbook content (Markdown supported)..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            rows={8}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category (e.g., kubernetes)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : runbooks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No runbooks uploaded yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload runbooks to enable AI-powered incident analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {runbooks.map((rb) => (
            <div
              key={rb.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{rb.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span>{rb.category}</span>
                    <span>&middot;</span>
                    <span>{rb.chunk_count} chunks</span>
                    {rb.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-800 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(rb.id)}
                className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
