import { useMemo, useState } from 'react';
import { Code2, Search, Terminal } from 'lucide-react';
import { PYTHON_CATEGORIES, PYTHON_SCRIPTS } from '../data/pythonScriptsData';
import { PythonCategory, PythonScript, VaultItem } from '../types';
import { CodeBlock } from './CodeBlock';

interface PythonScriptsStudioProps {
  onSaveItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  savedContents: Set<string>;
}

export function PythonScriptsStudio({ onSaveItem, savedContents }: PythonScriptsStudioProps) {
  const [category, setCategory] = useState<PythonCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(PYTHON_SCRIPTS[0].id);
  const [paramState, setParamState] = useState<Record<string, Record<string, string>>>({});

  const filteredScripts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PYTHON_SCRIPTS.filter((script) => {
      const catMatch = category === 'all' || script.category === category;
      const textMatch =
        !q ||
        script.title.toLowerCase().includes(q) ||
        script.summary.toLowerCase().includes(q) ||
        script.filename.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [category, search]);

  const activeScript: PythonScript = useMemo(() => {
    return (
      filteredScripts.find((s) => s.id === selectedId) ||
      filteredScripts[0] ||
      PYTHON_SCRIPTS[0]
    );
  }, [filteredScripts, selectedId]);

  const currentValues = useMemo(() => {
    const vals: Record<string, string> = {};
    activeScript.params.forEach((p) => {
      vals[p.key] = paramState[activeScript.id]?.[p.key] ?? p.defaultValue;
    });
    return vals;
  }, [activeScript, paramState]);

  const generatedCode = useMemo(
    () => activeScript.buildCode(currentValues),
    [activeScript, currentValues]
  );

  const updateParam = (scriptId: string, key: string, value: string) => {
    setParamState((prev) => ({
      ...prev,
      [scriptId]: {
        ...(prev[scriptId] || {}),
        [key]: value,
      },
    }));
  };

  const categoryLabels: Record<string, string> = {
    network: 'الشبكات والفحص',
    web: 'الويب والـ HTTP',
    crypto: 'التشفير والأمان',
    automation: 'أتمتة لينكس',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          استوديو أدوات وأكواد بايثون (Python 3)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          أكواد بايثون كاملة وجاهزة للتشغيل أو التحميل بصيغة <code className="font-mono text-emerald-500">.py</code> مع تخصيص المتغيرات مباشرة.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {PYTHON_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن كود بايثون..."
            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {filteredScripts.length === 0 ? (
        <div className="p-10 text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            لا توجد أكواد بايثون مطابقة لبحثك.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
            className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            إعادة تعيين الفلتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Scripts Sidebar */}
          <div className="lg:col-span-4 space-y-2 max-h-[720px] overflow-y-auto pl-1">
            {filteredScripts.map((script) => {
              const active = activeScript.id === script.id;
              return (
                <button
                  key={script.id}
                  type="button"
                  onClick={() => setSelectedId(script.id)}
                  className={`w-full text-right p-4 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span dir="ltr" className="font-mono text-emerald-500 font-semibold">
                      {script.filename}
                    </span>
                    <span>{categoryLabels[script.category]}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {script.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                    {script.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Code Studio Panel */}
          <div className="lg:col-span-8 space-y-5 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>{categoryLabels[activeScript.category]}</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono">{activeScript.filename}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeScript.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {activeScript.summary}
              </p>
            </div>

            {/* Dependencies & Run Command */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>المتطلبات (Dependencies)</span>
                </div>
                <div dir="ltr" className="text-xs font-mono text-slate-800 dark:text-emerald-400">
                  {activeScript.pipInstall || 'Python Standard Library (لا يحتاج pip)'}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>أمر التشغيل</span>
                </div>
                <div dir="ltr" className="text-xs font-mono text-slate-800 dark:text-emerald-400">
                  {activeScript.runCommand}
                </div>
              </div>
            </div>

            {/* Live Variable Customizer */}
            {activeScript.params.length > 0 && (
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  تخصيص متغيرات السكربت (تتحدث مباشرة داخل الكود)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeScript.params.map((param) => (
                    <div key={param.key}>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {param.label}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={currentValues[param.key] ?? ''}
                        onChange={(e) => updateParam(activeScript.id, param.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Python Code Block */}
            <CodeBlock
              code={generatedCode}
              filename={activeScript.filename}
              label={`python3 · ${activeScript.filename}`}
              onSave={() =>
                onSaveItem({
                  title: activeScript.title,
                  category: 'python',
                  content: generatedCode,
                  notes: activeScript.runCommand,
                })
              }
              isSaved={savedContents.has(generatedCode)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
