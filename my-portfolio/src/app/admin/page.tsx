'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { sidebarGroups, categories } from '@/lib/categories';
import { TableName, FieldConfig, CategoryConfig } from '@/lib/types';
import { formatFullDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<TableName>('profiles');
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const currentCategory = categories.find((c) => c.key === activeCategory)!;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(activeCategory)
      .select('*')
      .order(activeCategory === 'profiles' ? 'created_at' : 'sort_order', { ascending: true });

    if (error) {
      console.error('Fetch error:', error.message);
      addToast('Failed to fetch data', 'error');
      setItems([]);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [activeCategory, supabase, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const openCreateModal = () => {
    const defaults: Record<string, unknown> = {};
    currentCategory.fields.forEach((f) => {
      if (f.type === 'toggle') defaults[f.name] = true;
      else if (f.type === 'number') defaults[f.name] = 0;
      else if (f.type === 'json-array') defaults[f.name] = ''; // must stay string for .split()
      else if (f.type === 'gallery') defaults[f.name] = [];    // stays as string[]
      else defaults[f.name] = '';
    });
    setFormData(defaults);
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: Record<string, unknown>) => {
    const data: Record<string, unknown> = {};
    currentCategory.fields.forEach((f) => {
      if (f.type === 'json-array') {
        const arr = Array.isArray(item[f.name]) ? (item[f.name] as string[]) : [];
        data[f.name] = arr.join('\n');
      } else if (f.type === 'gallery') {
        // gallery stays as string[]
        data[f.name] = Array.isArray(item[f.name]) ? item[f.name] : [];
      } else {
        data[f.name] = item[f.name] ?? '';
      }
    });
    setFormData(data);
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);

    const payload: Record<string, unknown> = {};
    currentCategory.fields.forEach((f) => {
      if (f.type === 'json-array') {
        const str = (formData[f.name] as string) || '';
        payload[f.name] = str
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (f.type === 'gallery') {
        // gallery is already string[]
        payload[f.name] = Array.isArray(formData[f.name]) ? formData[f.name] : [];
      } else if (f.type === 'number') {
        payload[f.name] = Number(formData[f.name]) || 0;
      } else if (f.type === 'toggle') {
        payload[f.name] = formData[f.name];
      } else if (f.type === 'date') {
        payload[f.name] = formData[f.name] || null;
      } else {
        payload[f.name] = formData[f.name] || null;
      }
    });

    let error;
    if (editingItem) {
      const result = await supabase
        .from(activeCategory)
        .update(payload)
        .eq('id', editingItem.id as string);
      error = result.error;
    } else {
      const result = await supabase.from(activeCategory).insert(payload);
      error = result.error;
    }

    if (error) {
      addToast(`Error: ${error.message}`, 'error');
    } else {
      addToast(`Successfully ${editingItem ? 'updated' : 'created'} item.`, 'success');
      setModalOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const { error } = await supabase.from(activeCategory).delete().eq('id', id);
    if (error) {
      addToast(`Error deleting: ${error.message}`, 'error');
    } else {
      addToast('Item deleted.', 'success');
      fetchItems();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from(activeCategory)
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (error) {
      addToast(`Error: ${error.message}`, 'error');
    } else {
      addToast(`Status updated to ${!currentActive ? 'Active' : 'Inactive'}`, 'success');
      fetchItems();
    }
  };

  // Only show first few fields in table
  const displayFields = currentCategory.fields.filter(
    (f) => f.type !== 'toggle' && f.type !== 'json-array' && f.type !== 'textarea' && f.type !== 'gallery' && f.type !== 'image' && f.type !== 'file'
  ).slice(0, 3);

  // Allow only 1 profile
  const canAddNew = !(activeCategory === 'profiles' && items.length > 0);

  return (
    <div className={styles.adminLayout}>
      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>Portfolio Admin</div>
          <div className={styles.sidebarSubtitle}>Manage content</div>
        </div>
        <nav className={styles.sidebarNav}>
          {sidebarGroups.map((group) => (
            <div key={group.label} className={styles.sidebarGroup}>
              <div className={styles.groupLabel}>{group.label}</div>
              {group.items.map((cat) => (
                <button
                  key={cat.key}
                  className={`${styles.navItem} ${activeCategory === cat.key ? styles.navItemActive : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setSidebarOpen(false);
                  }}
                >
                  <span className={styles.navIcon}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.navItem} style={{ marginBottom: 8 }}>
            <span className={styles.navIcon}>🌐</span>
            View Site
          </a>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.navIcon}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              {currentCategory.icon} {currentCategory.label}
            </h1>
            <p className={styles.pageSubtitle}>{items.length} items</p>
          </div>
          {canAddNew && (
            <Button onClick={openCreateModal} variant="primary" size="sm">
              + Add New
            </Button>
          )}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Skeleton count={4} />
              </div>
            ) : items.length === 0 ? (
              <div className={styles.emptyAdmin}>
                <div className={styles.emptyIcon}>{currentCategory.icon}</div>
                <p>No {currentCategory.label.toLowerCase()} entries yet.</p>
                {canAddNew && <p style={{ marginTop: 8 }}>Click &quot;Add New&quot; to create one.</p>}
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {displayFields.map((f) => (
                        <th key={f.name}>{f.label}</th>
                      ))}
                      {activeCategory !== 'profiles' && <th>Order</th>}
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id as string}>
                        {displayFields.map((f) => (
                          <td key={f.name}>
                            {String(item[f.name] ?? '—')}
                          </td>
                        ))}
                        {activeCategory !== 'profiles' && <td>{String(item.sort_order ?? 0)}</td>}
                        <td>
                          <button
                            className={`${styles.statusBadge} ${
                              item.is_active ? styles.statusActive : styles.statusInactive
                            }`}
                            onClick={() =>
                              toggleActive(item.id as string, item.is_active as boolean)
                            }
                          >
                            {item.is_active ? '● Active' : '○ Inactive'}
                          </button>
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {formatFullDate(item.updated_at as string)}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => openEditModal(item)}
                            >
                              Edit
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => handleDelete(item.id as string)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} {currentCategory.label.replace(/s$/, '')}
              </h2>

              {currentCategory.fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, [field.name]: val }))
                  }
                />
              ))}

              <div className={styles.formActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Form field renderer
function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, acceptType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate for PDF
    if (acceptType === 'application/pdf' && file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10 MB.');
      return;
    }

    setUploading(true);
    const { uploadFile } = await import('@/lib/supabase/storage');
    const url = await uploadFile(file);
    if (url) {
      onChange(url);
    } else {
      alert('Failed to upload file.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    if (files.some(f => f.size > 10 * 1024 * 1024)) {
      alert('One or more files exceed the 10 MB limit.');
      return;
    }

    setUploadingGallery(true);
    const { uploadFile } = await import('@/lib/supabase/storage');
    const current = Array.isArray(value) ? (value as string[]) : [];
    const uploaded: string[] = [];

    for (const file of files) {
      const url = await uploadFile(file);
      if (url) uploaded.push(url);
    }
    onChange([...current, ...uploaded]);
    setUploadingGallery(false);
    e.target.value = '';
  };

  if (field.type === 'toggle') {
    return (
      <div className={styles.formField}>
        <div className={styles.formToggle}>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${value ? styles.toggleSwitchActive : ''}`}
            onClick={() => onChange(!value)}
          >
            <span className={styles.toggleKnob} />
          </button>
          <span className={styles.formLabel} style={{ margin: 0 }}>
            {field.label}
          </span>
        </div>
      </div>
    );
  }

  if (field.type === 'textarea' || field.type === 'json-array') {
    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>{field.label}</label>
        <textarea
          className={`${styles.formInput} ${styles.formTextarea}`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'json-array' ? 4 : 3}
        />
        {field.type === 'json-array' && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
            Enter one item per line
          </span>
        )}
      </div>
    );
  }

  if (field.type === 'image') {
    const imageUrl = typeof value === 'string' ? value : '';
    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>{field.label}</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className={styles.formInput}
            value={imageUrl}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or enter URL directly..."
          />
          <div style={{ position: 'relative' }}>
            <Button type="button" variant="secondary" size="sm" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleFileUpload(e, 'image/*')}
              disabled={uploading}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
          </div>
          {imageUrl && (
            <button type="button" onClick={() => onChange('')} style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', flexShrink: 0 }}>
              ✕ Remove
            </button>
          )}
        </div>
        {imageUrl && (
          <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', width: '80px', height: '80px', border: '1px solid var(--color-border)' }}>
            <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'file') {
    const fileUrl = typeof value === 'string' ? value : '';
    const isPdf = field.accept === 'application/pdf';
    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>{field.label}</label>
        {fileUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', flex: 1 }}>
              {isPdf ? '📄 Resume uploaded' : '📎 File uploaded'}
            </span>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>
              View ↗
            </a>
            <button type="button" onClick={() => onChange('')} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginLeft: 4 }}>
              ✕ Remove
            </button>
          </div>
        )}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Button type="button" variant="secondary" size="sm" disabled={uploading}>
            {uploading ? 'Uploading...' : fileUrl ? 'Replace File' : 'Upload PDF'}
          </Button>
          <input
            type="file"
            accept={field.accept || '*/*'}
            onChange={(e) => handleFileUpload(e, field.accept || '*/*')}
            disabled={uploading}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </div>
        {isPdf && (
          <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            PDF only · Max 10 MB
          </span>
        )}
      </div>
    );
  }

  if (field.type === 'gallery') {
    const images = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>{field.label}</label>
        {images.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <img src={url} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  style={{
                    position: 'absolute', top: 2, right: 2, width: 20, height: 20,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff',
                    fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Button type="button" variant="secondary" size="sm" disabled={uploadingGallery}>
            {uploadingGallery ? 'Uploading...' : '+ Add Images'}
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleGalleryUpload}
            disabled={uploadingGallery}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </div>
        <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          JPG, PNG, WebP · Max 10 MB each · Multiple allowed
        </span>
      </div>
    );
  }

  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>
        {field.label}
        {field.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
        className={styles.formInput}
        value={String(value ?? '')}
        onChange={(e) =>
          onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
        }
        placeholder={field.placeholder}
        required={field.required}
      />
    </div>
  );
}

