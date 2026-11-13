import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { LINUX_TOOLS, LINUX_TOOL_CATEGORIES } from '../data/linuxToolsData';
import { LinuxTool, LinuxToolCategory, VaultItem } from '../types';
import { CodeBlock } from './CodeBlock';

interface LinuxToolsExplorerProps {
  onSaveItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  savedContents: Set<string>;
}

export function LinuxToolsExplorer({ onSaveItem, savedContents }: LinuxToolsExplorerProps) {
  const [category, setCategory] = useState<LinuxToolCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedToolId, setSelectedToolId] = useState<string>(LINUX_TOOLS[0].id);
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});
  const [includeSudo, setIncludeSudo] = useState(true);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LINUX_TOOLS.filter((tool) => {
      const catMatch = category === 'all' || tool.category === category;
      const textMatch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.summary.toLowerCase().includes(q) ||
        tool.examples.some(
          (ex) =>
            ex.title.toLowerCase().includes(q) ||
            ex.template.toLowerCase().includes(q)
        );
      return catMatch && textMatch;
    });
  }, [category, search]);

  const activeTool: LinuxTool = useMemo(() => {
    return (
      filteredTools.find((t) => t.id === selectedToolId) ||
      filteredTools[0] ||
      LINUX_TOOLS[0]
    );
  }, [filteredTools, selectedToolId]);

  const getParamValue = (tool: LinuxTool, key: string, defaultVal: string) => {
    return paramValues[tool.id]?.[key] ?? defaultVal;
  };

  const updateParam = (toolId: string, key: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [toolId]: {
        ...(prev[toolId] || {}),
        [key]: value,
      },
    }));
  };

  const renderTemplate = (tool: LinuxTool, template: string, needsSudo?: boolean) => {
    let result = template;
    tool.params.forEach((p) => {
      const val = getParamValue(tool, p.key, p.defaultValue) || p.defaultValue;
      result = result.replaceAll(`{${p.key}}`, val);
    });
    if (needsSudo && includeSudo) {
      result = `sudo ${result}`;
    }
    return result;
  };

  const categoryLabelMap: Record<string, string> = {
    network: 'الشبكات والفحص',
    web: 'اختبار الويب',
    sysadmin: 'إدارة النظام',
    files: 'الملفات والنصوص',
    security: 'الحماية والصلاحيات',
    forensics: 'التحليل الجنائي',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          موسوعة أدوات لينكس وكالي التفاعلية
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          اختر أي أداة، عدّل المتغيرات (الهدف، المنفذ، المسار)، واحصل فوراً على الأوامر الجاهزة للتنفيذ.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {LINUX_TOOL_CATEGORIES.map((cat) => (
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
            placeholder="ابحث عن أداة أو أمر..."
            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className="p-10 text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            لا توجد أدوات تطابق بحثك الحالي.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
            className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            عرض جميع الأدوات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tools List */}
          <div className="lg:col-span-4 space-y-2 max-h-[680px] overflow-y-auto pl-1">
            {filteredTools.map((tool) => {
              const isSelected = activeTool.id === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`w-full text-right p-4 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span dir="ltr" className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {tool.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {categoryLabelMap[tool.category]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {tool.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Tool Inspector */}
          <div className="lg:col-span-8 space-y-6 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>{categoryLabelMap[activeTool.category]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTool.examples.length} أوامر عملية</span>
                </div>
                <h3 dir="ltr" className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 text-right">
                  {activeTool.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {activeTool.summary}
                </p>
              </div>
            </div>

            {/* Install command */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                أمر التثبيت على Debian / Ubuntu / Kali
              </div>
              <CodeBlock code={activeTool.installCmd} label="install" compact />
            </div>

            {/* Dynamic Parameters */}
            {activeTool.params.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                    <span>تخصيص المعاملات (يحدّث الأوامر بالأسفل فوراً)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeSudo(!includeSudo)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      includeSudo
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                        : 'border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {includeSudo ? 'sudo مفعّل' : 'بدون sudo'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeTool.params.map((param) => (
                    <div key={param.key}>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {param.label}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={getParamValue(activeTool, param.key, param.defaultValue)}
                        onChange={(e) => updateParam(activeTool.id, param.key, e.target.value)}
                        placeholder={param.placeholder}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                أمثلة الاستخدام العملية
              </h4>
              {activeTool.examples.map((ex, idx) => {
                const cmd = renderTemplate(activeTool, ex.template, ex.sudo);
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {ex.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {ex.description}
                      </span>
                    </div>
                    <CodeBlock
                      code={cmd}
                      label={activeTool.id}
                      compact
                      onSave={() =>
                        onSaveItem({
                          title: `${activeTool.name}: ${ex.title}`,
                          category: 'linux',
                          content: cmd,
                          notes: ex.description,
                        })
                      }
                      isSaved={savedContents.has(cmd)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
