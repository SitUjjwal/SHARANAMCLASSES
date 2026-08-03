/**
 * Categories — Home grid tiles (3-col), add / edit / delete.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Category } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { CategoryForm } from '@/features/categories/CategoryForm';
import {
  deleteAdminCategory,
  fetchAdminCategories,
} from '@/features/categories/api';
import { ApiClientError } from '@/services/api';

function isImageIcon(icon: string | null): boolean {
  return Boolean(icon && /^https?:\/\//i.test(icon));
}

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminCategories());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load categories');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setEditorOpen(true);
  }

  async function onDelete(category: Category) {
    const ok = window.confirm(
      `Delete category “${category.name}”?\n\nCourses in this category will stay, but become uncategorized.`,
    );
    if (!ok) return;

    setDeletingId(category.id);
    setError(null);
    try {
      await deleteAdminCategory(category.id);
      // Optimistic remove so UI updates even if a stale GET were cached.
      setItems((prev) => prev.filter((c) => c.id !== category.id));
      await load();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Delete failed';
      setError(message);
      window.alert(message);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  const nextSortOrder =
    items.reduce((max, c) => Math.max(max, Number(c.sort_order) || 0), 0) + 10;

  return (
    <div className="page">
      <PageHeader
        title="Categories"
        description="Home screen tiles — icon + name grid (like Free Courses, Test Series, PDF Notes)."
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Add Category
          </button>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading ? (
        <div className="category-admin-grid">
          {items.map((category) => (
            <article
              key={category.id}
              className={
                category.is_active
                  ? 'category-tile'
                  : 'category-tile category-tile-inactive'
              }
            >
              <button
                type="button"
                className="category-tile-main"
                onClick={() => openEdit(category)}
              >
                <div className="category-tile-icon">
                  {isImageIcon(category.icon) ? (
                    <img src={category.icon ?? ''} alt="" />
                  ) : (
                    <span>{category.icon || '📘'}</span>
                  )}
                </div>
                <strong>{category.name}</strong>
                {category.link_url ? (
                  <span className="category-tile-badge category-tile-link" title={category.link_url}>
                    Link
                  </span>
                ) : null}
                {!category.is_active ? (
                  <span className="category-tile-badge">Inactive</span>
                ) : null}
              </button>
              <div className="category-tile-actions">
                <button type="button" className="btn ghost" onClick={() => openEdit(category)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn danger"
                  disabled={deletingId === category.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void onDelete(category);
                  }}
                >
                  {deletingId === category.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </article>
          ))}

          <button type="button" className="category-tile category-tile-add" onClick={openCreate}>
            <div className="category-tile-icon category-tile-icon-add">+</div>
            <strong>Add Category</strong>
          </button>
        </div>
      ) : null}

      {!loading && !items.length ? (
        <p className="hint">
          No categories yet. Add tiles like Free Courses, Free Test Series, PDF Notes…
        </p>
      ) : null}

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <CategoryForm
              category={editing}
              nextSortOrder={nextSortOrder}
              onCancel={() => setEditorOpen(false)}
              onSaved={() => {
                setEditorOpen(false);
                void load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
