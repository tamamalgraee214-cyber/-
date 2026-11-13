import { useMemo, useState } from 'react';
import { RotateCcw, Search, Terminal } from 'lucide-react';
import {
  NMAP_OPTION_FLAGS,
  NMAP_PRESETS,
  NMAP_SCAN_TYPES,
  NMAP_TIMINGS,
  NSE_SCRIPTS,
  generateSampleNmapOutput,
} from '../data/nmapData';
import { NmapPreset, VaultItem } from '../types';
import { CodeBlock } from './CodeBlock';

interface NmapBuilderProps {
  onSaveItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  savedContents: Set<string>;
}

export function NmapBuilder({ onSaveItem, savedContents }: NmapBuilderProps) {
  const [target, setTarget] = useState('192.168.1.10');
  const [useSudo, setUseSudo] = useState(true);
  const [scanType, setScanType] = useState('-sS');
  const [timing, setTiming] = useState('-T4');
  const [portMode, setPortMode] = useState<'default' | 'top' | 'fast' | 'all' | 'custom'>('default');
  const [customPorts, setCustomPorts] = useState('21,22,80,443,445,3306,8080');
  const [topPortsCount, setTopPortsCount] = useState('1000');
  const [selectedFlags, setSelectedFlags] = useState<string[]>(['-sV', '-sC']);
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [scriptSearch, setScriptSearch] = useState('');
  const [scriptCategory, setScriptCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(true);

  const toggleFlag = (flag: string) => {
    setSelectedFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const toggleScript = (name: string) => {
    setSelectedScripts((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const applyPreset = (preset: NmapPreset) => {
    setScanType(preset.scanType);
    setTiming(preset.timing);
    setPortMode(preset.portMode);
    if (preset.customPorts) setCustomPorts(preset.customPorts);
    if (preset.topPortsCount) setTopPortsCount(preset.topPortsCount);
    setSelectedFlags(preset.flags.filter((f) => f !== preset.timing && f !== '-F'));
    setSelectedScripts(preset.scripts);
  };

  const resetBuilder = () => {
    setTarget('192.168.1.10');
    setUseSudo(true);
    setScanType('-sS');
    setTiming('-T4');
    setPortMode('default');
    setSelectedFlags(['-sV', '-sC']);
    setSelectedScripts([]);
    setScriptSearch('');
    setScriptCategory('all');
  };

  const assembledCommand = useMemo(() => {
    const parts: string[] = [];
    if (useSudo) parts.push('sudo');
    parts.push('nmap');
    if (scanType) parts.push(scanType);

    if (scanType !== '-sn') {
      if (portMode === 'fast') parts.push('-F');
      else if (portMode === 'all') parts.push('-p-');
      else if (portMode === 'top' && topPortsCount.trim()) {
        parts.push(`--top-ports ${topPortsCount.trim()}`);
      } else if (portMode === 'custom' && customPorts.trim()) {
        parts.push(`-p ${customPorts.trim()}`);
      }
    }

    selectedFlags.forEach((f) => {
      if (!parts.includes(f)) parts.push(f);
    });

    if (selectedScripts.length > 0) {
      parts.push(`--script=${selectedScripts.join(',')}`);
    }

    if (timing && timing !== '-T3') {
      parts.push(timing);
    }

    parts.push(target.trim() || '<TARGET>');
    return parts.join(' ');
  }, [useSudo, scanType, portMode, topPortsCount, customPorts, selectedFlags, selectedScripts, timing, target]);

  const filteredScripts = useMemo(() => {
    const q = scriptSearch.trim().toLowerCase();
    return NSE_SCRIPTS.filter((script) => {
      const matchCat = scriptCategory === 'all' || script.category === scriptCategory;
      const matchSearch =
        !q ||
        script.name.toLowerCase().includes(q) ||
        script.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [scriptSearch, scriptCategory]);

  const sampleOutput = useMemo(
    () =>
      generateSampleNmapOutput({
        target,
        scanType,
        flags: selectedFlags,
        scripts: selectedScripts,
        portMode,
        customPorts,
      }),
    [target, scanType, selectedFlags, selectedScripts, portMode, customPorts]
  );

  return (
    <div className="space-y-8">
      {/* Live Command Output */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              منشئ أوامر Nmap التفاعلي
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              خصص الهدف، نوع الفحص، المنافذ، وسكربتات NSE لبناء أمر جاهز للتنفيذ في الطرفية.
            </p>
          </div>
          <button
            type="button"
            onClick={resetBuilder}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>
        </div>

        <CodeBlock
          code={assembledCommand}
          label="nmap-command"
          onSave={() =>
            onSaveItem({
              title: `Nmap: ${target || 'Target'} (${scanType})`,
              category: 'nmap',
              content: assembledCommand,
              notes: selectedScripts.length ? `Scripts: ${selectedScripts.join(', ')}` : 'أمر فحص Nmap مخصص',
            })
          }
          isSaved={savedContents.has(assembledCommand)}
        />
      </section>

      {/* Quick Presets */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          قوالب فحص جاهزة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {NMAP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-right p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {preset.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Start Column: Target, Ports, Timing, Scan Type */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                الهدف (IP / Domain / CIDR)
              </label>
              <input
                type="text"
                dir="ltr"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="192.168.1.0/24 or scanme.nmap.org"
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                تضمين صلاحيات الجذر (sudo)
              </label>
              <button
                type="button"
                onClick={() => setUseSudo(!useSudo)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  useSudo
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {useSudo ? 'مفعّل' : 'معطّل'}
              </button>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
                تقنية الفحص (Scan Type)
              </label>
              <div className="space-y-2">
                {NMAP_SCAN_TYPES.map((st) => {
                  const active = scanType === st.flag;
                  return (
                    <button
                      key={st.flag}
                      type="button"
                      onClick={() => setScanType(st.flag)}
                      className={`w-full text-right p-3 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {st.label}
                        </span>
                        <span dir="ltr" className="text-xs font-mono text-emerald-500 font-semibold">
                          {st.flag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {st.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {scanType !== '-sn' && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  نطاق المنافذ (Ports)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'default', label: 'الافتراضي (1000)' },
                    { id: 'fast', label: 'سريع (-F)' },
                    { id: 'all', label: 'الكل (-p-)' },
                    { id: 'top', label: 'أشهر N منفذ' },
                    { id: 'custom', label: 'منافذ مخصصة' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPortMode(mode.id as typeof portMode)}
                      className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        portMode === mode.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {portMode === 'custom' && (
                  <input
                    type="text"
                    dir="ltr"
                    value={customPorts}
                    onChange={(e) => setCustomPorts(e.target.value)}
                    placeholder="22,80,443,8000-8100"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                )}
                {portMode === 'top' && (
                  <input
                    type="number"
                    dir="ltr"
                    min={1}
                    max={65535}
                    value={topPortsCount}
                    onChange={(e) => setTopPortsCount(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                سرعة وتوقيت الفحص (Timing Template)
              </label>
              <select
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {NMAP_TIMINGS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right/End Column: Flags + NSE Scripts + Output Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Option Flags */}
          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              خيارات الكشف والمخرجات والتمويه
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {NMAP_OPTION_FLAGS.map((opt) => {
                const checked = selectedFlags.includes(opt.flag);
                return (
                  <button
                    key={opt.flag}
                    type="button"
                    onClick={() => toggleFlag(opt.flag)}
                    className={`text-right p-3 rounded-lg border transition-colors cursor-pointer ${
                      checked
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </span>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border shrink-0 ${
                          checked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        {checked ? '✓' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NSE Scripts Picker */}
          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  محرك سكربتات Nmap (NSE Scripts)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  المحدد حالياً: {selectedScripts.length} سكربت
                </p>
              </div>
              {selectedScripts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedScripts([])}
                  className="text-xs text-rose-500 hover:text-rose-400 font-medium cursor-pointer"
                >
                  إلغاء تحديد الكل
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={scriptSearch}
                  onChange={(e) => setScriptSearch(e.target.value)}
                  placeholder="ابحث عن سكربت (مثل http, smb, ssl, vuln)..."
                  className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select
                value={scriptCategory}
                onChange={(e) => setScriptCategory(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">كل التصنيفات</option>
                <option value="vuln">الثغرات (vuln)</option>
                <option value="http">الويب (http)</option>
                <option value="smb">مشاركة الملفات (smb)</option>
                <option value="ssl">التشفير (ssl)</option>
                <option value="auth">المصادقة (auth)</option>
                <option value="discovery">الاستكشاف (discovery)</option>
              </select>
            </div>

            <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
              {filteredScripts.map((script) => {
                const active = selectedScripts.includes(script.name);
                return (
                  <button
                    key={script.name}
                    type="button"
                    onClick={() => toggleScript(script.name)}
                    className={`text-right p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span dir="ltr" className="text-xs font-mono font-semibold text-emerald-500">
                        {script.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {script.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {script.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Output Preview */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>معاينة توضيحية لشكل المخرجات في الطرفية</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-medium text-emerald-500 hover:text-emerald-400 cursor-pointer"
              >
                {showPreview ? 'إخفاء' : 'عرض'}
              </button>
            </div>
            {showPreview && (
              <pre
                dir="ltr"
                className="p-4 text-xs font-mono text-left text-slate-300 bg-slate-950 overflow-x-auto leading-relaxed"
              >
                {sampleOutput}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
