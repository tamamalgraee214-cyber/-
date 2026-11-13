import { useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2 } from 'lucide-react';
import { VaultItem } from '../types';
import { CodeBlock } from './CodeBlock';

interface SavedVaultProps {
  items: VaultItem[];
  onAddCustom: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  onDeleteItem: (id: string) => void;
  onExportVault: () => void;
}

export function SavedVault({
  items,
  onAddCustom,
  onDeleteItem,
  onExportVault,
}: SavedVaultProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<VaultItem['category']>('custom');
  const [newContent, setNewContent] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const catOk = categoryFilter === 'all' || item.category === categoryFilter;
      const textOk =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      return catOk && textOk;
    });
  }, [items, search, categoryFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddCustom({
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      notes: newNotes.trim() || undefined,
    });
    setNewTitle('');
    setNewContent('');
    setNewNotes('');
    setShowAddForm(false);
  };

  const catLabels: Record<VaultItem['category'], string> = {
    nmap: 'Nmap',
    linux: 'أوامر لينكس',
    python: 'بايثون',
    shell: 'Shells',
    custom: 'مخصص',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            خزنة الأوامر والأكواد المحفوظة
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            يتم حفظ جميع أوامرك وأكوادك محلياً في المتصفح مع إمكانية إضافة ملاحظاتك أو تصديرها.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أمر جديد</span>
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onExportVault}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Markdown</span>
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                العنوان
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: فحص سيرفر الويب الداخلي"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                التصنيف
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as VaultItem['category'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="custom">مخصص</option>
                <option value="nmap">Nmap</option>
                <option value="linux">أوامر لينكس</option>
                <option value="python">بايثون</option>
                <option value="shell">Shells</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              الأمر أو الكود
            </label>
            <textarea
              dir="ltr"
              required
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="nmap -sV -sC 10.10.10.10"
              className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              ملاحظات (اختياري)
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="متى أو كيف تستخدم هذا الأمر..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              حفظ في الخزنة
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'nmap', label: 'Nmap' },
            { id: 'linux', label: 'لينكس' },
            { id: 'python', label: 'بايثون' },
            { id: 'shell', label: 'Shells' },
            { id: 'custom', label: 'مخصص' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                categoryFilter === c.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المحفوظات..."
            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            خزنتك فارغة حالياً أو لا توجد نتائج مطابقة.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            اضغط على زر "حفظ" بجانب أي أمر Nmap أو أداة لينكس أو سكربت بايثون لإضافته هنا، أو أضف أمراً مخصصاً.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{catLabels[item.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                  {item.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  title="حذف"
                  className="p-2 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <CodeBlock
                code={item.content}
                label={catLabels[item.category]}
                filename={item.category === 'python' ? 'script.py' : undefined}
                compact
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
