import { useEffect, useMemo, useState } from 'react';
import { Package, Monitor, Smartphone, Terminal } from 'lucide-react';
import { PLATFORM_TOOLS, PlatformTarget, PlatformTool } from '../data/platformsData';
import { VaultItem } from '../types';
import { CodeBlock } from './CodeBlock';
import { CodePackager, PackagerInitialPayload } from './CodePackager';

interface PlatformsLabProps {
  onSaveItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  savedContents: Set<string>;
  initialCode?: PackagerInitialPayload | null;
}

type LabTab = 'packager' | PlatformTarget;

const PLATFORM_TABS: { id: LabTab; label: string; icon: typeof Monitor }[] = [
  { id: 'packager', label: 'تغليف كودك (EXE / Linux / Android)', icon: Package },
  { id: 'windows', label: 'أدوات ويندوز و EXE', icon: Monitor },
  { id: 'linux', label: 'أدوات تغليف لينكس', icon: Terminal },
  { id: 'android', label: 'أدوات أندرويد (Termux / ADB)', icon: Smartphone },
];

export function PlatformsLab({ onSaveItem, savedContents, initialCode }: PlatformsLabProps) {
  const [activeTab, setActiveTab] = useState<LabTab>('packager');
  const [paramState, setParamState] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (initialCode) {
      setActiveTab('packager');
    }
  }, [initialCode]);

  const platform: PlatformTarget = activeTab === 'packager' ? 'windows' : activeTab;

  const toolsForPlatform = useMemo(
    () => PLATFORM_TOOLS.filter((t) => t.platform === platform),
    [platform]
  );

  const [selectedToolId, setSelectedToolId] = useState<string>(PLATFORM_TOOLS[0].id);

  const activeTool: PlatformTool = useMemo(() => {
    return (
      toolsForPlatform.find((t) => t.id === selectedToolId) ||
      toolsForPlatform[0]
    );
  }, [toolsForPlatform, selectedToolId]);

  const handleTabChange = (next: LabTab) => {
    setActiveTab(next);
    if (next !== 'packager') {
      const first = PLATFORM_TOOLS.find((t) => t.platform === next);
      if (first) setSelectedToolId(first.id);
    }
  };

  const getParamVal = (tool: PlatformTool, key: string, fallback: string) =>
    paramState[tool.id]?.[key] ?? fallback;

  const setParamVal = (toolId: string, key: string, val: string) => {
    setParamState((prev) => ({
      ...prev,
      [toolId]: {
        ...(prev[toolId] || {}),
        [key]: val,
      },
    }));
  };

  const interpolate = (tool: PlatformTool, template: string) => {
    let out = template;
    tool.params.forEach((p) => {
      const val = getParamVal(tool, p.key, p.defaultValue) || p.defaultValue;
      out = out.replaceAll(`{${p.key}}`, val);
    });
    return out;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          أدوات الأنظمة المتعددة: ويندوز (EXE) · لينكس · أندرويد
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          تحويل سكربتات بايثون إلى ملفات <code className="font-mono text-emerald-500">.exe</code> لويندوز، بناء حزم <code className="font-mono text-emerald-500">.deb</code> وملفات تنفيذية للينكس، وتشغيل الأدوات على أندرويد عبر Termux و ADB.
        </p>
      </div>

      {/* Platform Switcher */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {PLATFORM_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'packager' ? (
        <CodePackager initialPayload={initialCode} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tool Selector */}
          <div className="lg:col-span-4 space-y-2.5">
            {toolsForPlatform.map((tool) => {
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
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {tool.name}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {tool.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Tool Panel */}
          <div className="lg:col-span-8 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeTool.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {activeTool.summary}
              </p>
            </div>

            {activeTool.params.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeTool.params.map((p) => (
                  <div key={p.key}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {p.label}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={getParamVal(activeTool, p.key, p.defaultValue)}
                      onChange={(e) => setParamVal(activeTool.id, p.key, e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-5">
              {activeTool.commands.map((cmd, idx) => {
                const rendered = interpolate(activeTool, cmd.template);
                const dlName = cmd.downloadExt
                  ? `${cmd.downloadPrefix || activeTool.id}${cmd.downloadExt}`
                  : undefined;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {cmd.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {cmd.description}
                      </span>
                    </div>
                    <CodeBlock
                      code={rendered}
                      label={platform === 'windows' ? 'windows / cmd' : platform === 'android' ? 'android / termux' : 'linux / bash'}
                      filename={dlName}
                      compact
                      onSave={() =>
                        onSaveItem({
                          title: `${activeTool.name}: ${cmd.title}`,
                          category: platform === 'linux' ? 'linux' : 'custom',
                          content: rendered,
                          notes: cmd.description,
                        })
                      }
                      isSaved={savedContents.has(rendered)}
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
