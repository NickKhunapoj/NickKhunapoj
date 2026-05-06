'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { sidebarGroups, categories } from '@/lib/categories';
import { TableName, FieldConfig } from '@/lib/types';
import { formatFullDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import styles from './admin.module.css';

// DND Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    queueMicrotask(() => {
      void fetchItems();
    });
  }, [fetchItems]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({});
    setModalOpen(true);
  };

  const openEditModal = (item: Record<string, unknown>) => {
    setEditingItem(item);
    setFormData(item);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from(activeCategory)
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        addToast('Item updated successfully', 'success');
      } else {
        // Find max order
        const { data: maxOrderData } = await supabase
          .from(activeCategory)
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);
        
        let newOrder = 0;
        if (maxOrderData && maxOrderData.length > 0 && maxOrderData[0].sort_order !== undefined) {
          newOrder = maxOrderData[0].sort_order + 1;
        }

        const dataToInsert = { ...formData };
        if (activeCategory !== 'profiles') {
          dataToInsert.sort_order = newOrder;
        }

        const { error } = await supabase.from(activeCategory).insert([dataToInsert]);
        if (error) throw error;
        addToast('Item created successfully', 'success');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Error: ${message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase.from(activeCategory).delete().eq('id', id);
    if (error) {
      addToast(`Error: ${error.message}`, 'error');
    } else {
      addToast('Item deleted', 'success');
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

  // DND setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      let newItems = [...items];
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      newItems = arrayMove(newItems, oldIndex, newIndex);
      setItems(newItems);

      // Save to Supabase
      if (activeCategory !== 'profiles') {
        let hasError = false;
        for (let i = 0; i < newItems.length; i++) {
          const item = newItems[i];
          if (item.sort_order !== i) {
            const { error } = await supabase
              .from(activeCategory)
              .update({ sort_order: i })
              .eq('id', item.id);
            if (error) hasError = true;
          }
        }
        if (hasError) {
          addToast('Failed to save some sort orders', 'error');
        } else {
          addToast('Order saved successfully', 'success');
        }
        fetchItems(); // refresh to get consistent state
      }
    }
  };

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
          <Link href="/" className={styles.navItem} style={{ marginBottom: 8 }}>
            <span className={styles.navIcon}>🌐</span>
            View Site
          </Link>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {activeCategory !== 'profiles' && <th>☰</th>}
                        {displayFields.map((f) => (
                          <th key={f.name}>{f.label}</th>
                        ))}
                        <th>Status</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <SortableContext
                      items={items.map((i) => i.id as string)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody>
                        {items.map((item) => (
                          <SortableRow
                            key={item.id as string}
                            item={item}
                            activeCategory={activeCategory}
                            displayFields={displayFields}
                            toggleActive={toggleActive}
                            openEditModal={openEditModal}
                            handleDelete={handleDelete}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
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

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sortable Row Component ── */
function SortableRow({
  item,
  activeCategory,
  displayFields,
  toggleActive,
  openEditModal,
  handleDelete,
}: {
  item: Record<string, unknown>;
  activeCategory: string;
  displayFields: FieldConfig[];
  toggleActive: (id: string, active: boolean) => void;
  openEditModal: (item: Record<string, unknown>) => void;
  handleDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id as string });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'var(--color-bg)' : undefined,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 99 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {activeCategory !== 'profiles' && (
        <td
          style={{ width: 40, cursor: 'grab' }}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <span style={{ opacity: 0.5, padding: '4px 8px' }}>☰</span>
        </td>
      )}
      {displayFields.map((f) => (
        <td key={f.name}>{String(item[f.name] ?? '—')}</td>
      ))}
      <td>
        <button
          className={`${styles.statusBadge} ${
            item.is_active ? styles.statusActive : styles.statusInactive
          }`}
          onClick={() => toggleActive(item.id as string, item.is_active as boolean)}
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
  );
}

/* ── Reusable FormField ── */
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
    try {
      let url: string | null = null;

      if (field.name === 'resume_url' && acceptType === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/resume', {
          method: 'PUT',
          body: formData,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to upload resume.');
        }

        url = payload.url;
      } else {
        const { uploadFile } = await import('@/lib/supabase/storage');
        url = await uploadFile(file);
      }

      if (url) {
        onChange(url);
      } else {
        alert('Failed to upload file.');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleResumeRemove = async () => {
    setUploading(true);
    try {
      const response = await fetch('/api/resume', { method: 'DELETE' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete resume.');
      }

      onChange('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete resume.');
    } finally {
      setUploading(false);
    }
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
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Button type="button" variant="secondary" size="sm" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Choose Image'}
            </Button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e, '*/*')}
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
    const isResume = field.name === 'resume_url';
    const viewUrl = isResume && fileUrl ? '/resume.pdf' : fileUrl;
    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>{field.label}</label>
        <div className={isResume ? styles.resumeUploadPanel : styles.fileUploadPanel}>
          <div className={styles.fileUploadHeader}>
            <span className={styles.fileUploadIcon}>{isPdf ? '📄' : '📎'}</span>
            <div className={styles.fileUploadText}>
              <span className={styles.fileUploadTitle}>
                {fileUrl ? 'Resume is ready' : isResume ? 'Upload your resume' : 'Upload file'}
              </span>
              <span className={styles.fileUploadHint}>
                {isResume ? 'PDF only, up to 10 MB. Published from your website at /resume.pdf.' : isPdf ? 'PDF only, up to 10 MB.' : 'Max 10 MB.'}
              </span>
            </div>
          </div>

          {fileUrl && (
            <div className={styles.fileCurrent}>
              <span className={styles.fileCurrentName}>
                {isResume ? '/resume.pdf' : isPdf ? 'Current PDF' : 'Current file'}
            </span>
              <div className={styles.fileActions}>
                <a href={viewUrl} target="_blank" rel="noopener noreferrer" className={styles.fileActionLink}>
                  View ↗
                </a>
                <button
                  type="button"
                  onClick={isResume ? handleResumeRemove : () => onChange('')}
                  className={styles.fileRemoveBtn}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className={styles.fileUploadActions}>
            <div className={styles.fileInputWrap}>
              <Button type="button" variant="secondary" size="sm" disabled={uploading}>
                {uploading ? 'Uploading...' : fileUrl ? 'Replace PDF' : 'Choose PDF'}
              </Button>
              <input
                type="file"
                accept={field.accept || '*/*'}
                onChange={(e) => handleFileUpload(e, field.accept || '*/*')}
                disabled={uploading}
                className={styles.hiddenFileInput}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (field.type === 'color') {
    const stringValue = typeof value === 'string' ? value : '';
    const pickerValue = /^#[\da-f]{6}$/i.test(stringValue) ? stringValue : '#2997ff';

    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>{field.label}</label>
        <div className={styles.colorField}>
          <input
            type="color"
            className={styles.colorPicker}
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${field.label} picker`}
          />
          <input
            type="text"
            className={styles.formInput}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '#2997ff'}
          />
        </div>
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
      <label className={styles.formLabel}>{field.label}</label>
      <input
        type="text"
        className={styles.formInput}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}
