import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Code2,
  Download,
  KeyRound,
  Layers,
  Menu,
  Moon,
  Network,
  Radar,
  Sun,
  Terminal,
  X,
} from 'lucide-react';
import { CryptoLab } from './components/CryptoLab';
import { LinuxToolsExplorer } from './components/LinuxToolsExplorer';
import { NetworkAndUtilsLab } from './components/NetworkAndUtilsLab';
import { NmapBuilder } from './components/NmapBuilder';
import { PlatformsLab } from './components/PlatformsLab';
import { PackagerInitialPayload } from './components/CodePackager';
import { PythonScriptsStudio } from './components/PythonScriptsStudio';
import { SavedVault } from './components/SavedVault';
import { ActiveSection, VaultItem } from './types';

const STORAGE_KEY = 'linux_arsenal_vault_v1';

const DEFAULT_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'starter-nmap',
    title: 'فحص شامل للمنافذ والخدمات والسكربتات الافتراضية',
    category: 'nmap',
    content: 'sudo nmap -sS -sV -sC -O -T4 192.168.1.10',
    notes: 'فحص قياسي متوازن لاكتشاف الخدمات ونظام التشغيل',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'starter-linux',
    title: 'عرض المنافذ المفتوحة والعمليات المرتبطة بها',
    category: 'linux',
    content: 'sudo ss -tulnp',
    notes: 'مفيد لمراجعة الخدمات المستمعة على الخادم',
    createdAt: new Date().toISOString(),
  },
];

const NAV_ITEMS: {
  id: ActiveSection;
  label: string;
  subtitle: string;
  icon: typeof Radar;
}[] = [
  {
    id: 'nmap',
    label: 'منشئ أوامر Nmap',
    subtitle: 'الفحص، السكربتات، والمعاينة',
    icon: Radar,
  },
  {
    id: 'linux',
    label: 'أدوات لينكس وكالي',
    subtitle: 'الشبكات، الويب، والنظام',
    icon: Terminal,
  },
  {
    id: 'python',
    label: 'أكواد وأدوات بايثون',
    subtitle: 'سكربتات جاهزة للتشغيل والتحميل',
    icon: Code2,
  },
  {
    id: 'platforms',
    label: 'ويندوز (EXE) وأندرويد',
    subtitle: 'تحويل EXE، تغليف لينكس، Termux و ADB',
    icon: Layers,
  },
  {
    id: 'crypto',
    label: 'مختبر التشفير والهاش',
    subtitle: 'Base64, SHA, JWT, كلمات السر',
    icon: KeyRound,
  },
  {
    id: 'network',
    label: 'الشبكات و الصلاحيات',
    subtitle: 'CIDR, Shells, chmod, المنافذ',
    icon: Network,
  },
  {
    id: 'vault',
    label: 'الخزنة والمحفوظات',
    subtitle: 'أوامرك وأكوادك الخاصة',
    icon: Bookmark,
  },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('nmap');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [packagerPayload, setPackagerPayload] = useState<PackagerInitialPayload | null>(null);

  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage parse error
    }
    return DEFAULT_VAULT_ITEMS;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vaultItems));
    } catch {
      // Ignore storage quota error
    }
  }, [vaultItems]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 2400);
  };

  const savedContents = useMemo(
    () => new Set(vaultItems.map((i) => i.content)),
    [vaultItems]
  );

  const handleSaveItem = (item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    if (savedContents.has(item.content)) {
      showToast('هذا الأمر محفوظ مسبقاً في الخزنة');
      return;
    }
    const newItem: VaultItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setVaultItems((prev) => [newItem, ...prev]);
    showToast('تم الحفظ في الخزنة');
  };

  const handleDeleteItem = (id: string) => {
    setVaultItems((prev) => prev.filter((item) => item.id !== id));
    showToast('تم حذف العنصر من الخزنة');
  };

  const handleExportVault = () => {
    const mdLines = [
      '# ترسانة لينكس — الأوامر والأكواد المحفوظة',
      '',
      ...vaultItems.flatMap((item) => [
        `## ${item.title}`,
        item.notes ? `> ${item.notes}` : '',
        '```bash',
        item.content,
        '```',
        '',
      ]),
    ].filter((l) => l !== undefined);

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linux-arsenal-cheatsheet.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('تم تصدير ملف المرجع بصيغة Markdown');
  };

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

  const handleSelectSection = (id: ActiveSection) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar (260px) */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[264px] shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1420] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
              ترسانة لينكس
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 lg:hidden cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-lg text-right transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold whitespace-nowrap truncate">
                      {item.label}
                    </span>
                    {item.id === 'vault' && (
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          active ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        {vaultItems.length}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-0.5 truncate ${
                      active ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>المظهر</span>
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'نهاري' : 'داكن'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            للاستخدام التعليمي وفحص الأنظمة المصرح بها فقط.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0E1420]/80 backdrop-blur-sm flex items-center justify-between gap-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 lg:hidden cursor-pointer"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap">
                المختبر
              </span>
              <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportVault}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير المحفوظات</span>
            </button>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {activeSection === 'nmap' && (
            <NmapBuilder onSaveItem={handleSaveItem} savedContents={savedContents} />
          )}
          {activeSection === 'linux' && (
            <LinuxToolsExplorer onSaveItem={handleSaveItem} savedContents={savedContents} />
          )}
          {activeSection === 'python' && (
            <PythonScriptsStudio
              onSaveItem={handleSaveItem}
              savedContents={savedContents}
              onSendToPackager={(payload) => {
                setPackagerPayload(payload);
                setActiveSection('platforms');
              }}
            />
          )}
          {activeSection === 'platforms' && (
            <PlatformsLab
              onSaveItem={handleSaveItem}
              savedContents={savedContents}
              initialCode={packagerPayload}
            />
          )}
          {activeSection === 'crypto' && <CryptoLab />}
          {activeSection === 'network' && (
            <NetworkAndUtilsLab onSaveItem={handleSaveItem} savedContents={savedContents} />
          )}
          {activeSection === 'vault' && (
            <SavedVault
              items={vaultItems}
              onAddCustom={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              onExportVault={handleExportVault}
            />
          )}
        </main>
      </div>

      {/* Subtle Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-lg border border-emerald-500/40 bg-slate-900 text-emerald-300 text-xs font-semibold shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
