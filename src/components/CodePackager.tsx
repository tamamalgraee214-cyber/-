import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Monitor, Smartphone, Terminal } from 'lucide-react';
import { PYTHON_SCRIPTS } from '../data/pythonScriptsData';

export interface PackagerInitialPayload {
  filename: string;
  code: string;
}

interface CodePackagerProps {
  initialPayload?: PackagerInitialPayload | null;
}

type SourceLang = 'python' | 'bash' | 'c';
type TargetFormat = 'windows_exe' | 'linux_bin' | 'android_termux';

export function CodePackager({ initialPayload }: CodePackagerProps) {
  const [appName, setAppName] = useState('my_tool');
  const [lang, setLang] = useState<SourceLang>('python');
  const [code, setCode] = useState<string>(() => {
    const first = PYTHON_SCRIPTS[0];
    const defaults: Record<string, string> = {};
    first.params.forEach((p) => {
      defaults[p.key] = p.defaultValue;
    });
    return first.buildCode(defaults);
  });

  const [target, setTarget] = useState<TargetFormat>('windows_exe');
  const [linuxMode, setLinuxMode] = useState<'executable' | 'elf' | 'deb'>('executable');
  const [androidMode, setAndroidMode] = useState<'termux' | 'apk'>('termux');
  const [winConsole, setWinConsole] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPayload) {
      setCode(initialPayload.code);
      setAppName(initialPayload.filename.replace(/\.[^.]+$/, '') || 'my_tool');
      setLang('python');
    }
  }, [initialPayload]);

  const safeName = useMemo(() => {
    const cleaned = appName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return cleaned || 'my_tool';
  }, [appName]);

  const handleLoadPreset = (scriptId: string) => {
    const found = PYTHON_SCRIPTS.find((s) => s.id === scriptId);
    if (!found) return;
    const defaults: Record<string, string> = {};
    found.params.forEach((p) => {
      defaults[p.key] = p.defaultValue;
    });
    setLang('python');
    setAppName(found.filename.replace(/\.py$/, ''));
    setCode(found.buildCode(defaults));
  };

  // Generate real self-contained output file content containing the user's exact code
  const outputArtifact = useMemo(() => {
    const userCode = code.trimEnd();

    if (target === 'windows_exe') {
      if (lang === 'python') {
        // Encode user code safely in Base64 UTF-8 so special characters/quotes never break batch file
        const bytes = new TextEncoder().encode(userCode);
        let bin = '';
        bytes.forEach((b) => {
          bin += String.fromCharCode(b);
        });
        const b64 = btoa(bin);
        const consoleFlag = winConsole ? '--console' : '--noconsole';

        return {
          filename: `build_${safeName}_exe.bat`,
          mime: 'text/plain;charset=utf-8',
          hint: `يحتوي هذا الملف على كودك مدمجاً بداخله. عند تشغيله على ويندوز يقوم باستخراج ${safeName}.py وبناء ملف ${safeName}.exe تلقائياً.`,
          content: `@echo off
setlocal
title Building ${safeName}.exe
echo [*] Extracting source code to ${safeName}.py ...
powershell -NoProfile -Command "$bytes = [Convert]::FromBase64String('${b64}'); [IO.File]::WriteAllBytes('${safeName}.py', $bytes)"

echo [*] Checking PyInstaller...
python -m pip show pyinstaller >nul 2>&1 || python -m pip install pyinstaller

echo [*] Compiling ${safeName}.exe ...
python -m PyInstaller --onefile ${consoleFlag} --name "${safeName}" "${safeName}.py"

echo.
echo [+] Success! Your executable is ready at: dist\\${safeName}.exe
pause
`,
        };
      }

      if (lang === 'c') {
        const bytes = new TextEncoder().encode(userCode);
        let bin = '';
        bytes.forEach((b) => {
          bin += String.fromCharCode(b);
        });
        const b64 = btoa(bin);
        return {
          filename: `build_${safeName}_c_exe.bat`,
          mime: 'text/plain;charset=utf-8',
          hint: `يستخرج كود C المدمج ويترجمه إلى ${safeName}.exe عبر gcc / MinGW.`,
          content: `@echo off
powershell -NoProfile -Command "$bytes = [Convert]::FromBase64String('${b64}'); [IO.File]::WriteAllBytes('${safeName}.c', $bytes)"
gcc "${safeName}.c" -o "${safeName}.exe" -lws2_32
echo [+] Built ${safeName}.exe
pause
`,
        };
      }

      // bash -> PowerShell wrapper
      return {
        filename: `${safeName}.ps1`,
        mime: 'text/plain;charset=utf-8',
        hint: 'سكربت PowerShell لتشغيل الأوامر مباشرة على ويندوز أو عبر WSL.',
        content: `# Windows PowerShell Runner for ${safeName}\n${userCode}\n`,
      };
    }

    if (target === 'linux_bin') {
      if (linuxMode === 'executable') {
        const shebang =
          lang === 'python'
            ? '#!/usr/bin/env python3'
            : lang === 'bash'
            ? '#!/usr/bin/env bash'
            : '// Compile with: gcc ' + safeName + '.c -o ' + safeName;
        const ext = lang === 'c' ? '.c' : '';
        return {
          filename: `${safeName}${ext}`,
          mime: 'text/plain;charset=utf-8',
          hint:
            lang === 'c'
              ? `ملف C جاهز للترجمة في لينكس: gcc ${safeName}.c -o ${safeName} && ./${safeName}`
              : `ملف تنفيذي مباشر للينكس. نفّذ: chmod +x ${safeName} && ./${safeName}`,
          content: userCode.startsWith('#!') ? userCode : `${shebang}\n\n${userCode}\n`,
        };
      }

      if (linuxMode === 'elf') {
        const ext = lang === 'python' ? 'py' : lang === 'c' ? 'c' : 'sh';
        const buildLine =
          lang === 'python'
            ? `pyinstaller --onefile --name "${safeName}" "${safeName}.py"\nchmod +x "dist/${safeName}"\necho "[+] Linux binary ready: ./dist/${safeName}"`
            : lang === 'c'
            ? `gcc "${safeName}.c" -O2 -o "${safeName}"\nchmod +x "${safeName}"\necho "[+] Linux ELF binary ready: ./${safeName}"`
            : `chmod +x "${safeName}.sh"\necho "[+] Executable ready: ./${safeName}.sh"`;

        return {
          filename: `build_${safeName}_linux.sh`,
          mime: 'text/x-shellscript;charset=utf-8',
          hint: `سكربت بناء لينكس يدمج كودك ويحوله إلى ملف تنفيذي مستقل (ELF Binary).`,
          content: `#!/usr/bin/env bash
set -e

cat << '__END_USER_CODE__' > "${safeName}.${ext}"
${userCode}
__END_USER_CODE__

${lang === 'python' ? 'python3 -m pip show pyinstaller >/dev/null 2>&1 || pip install pyinstaller\n' : ''}${buildLine}
`,
        };
      }

      // .deb builder
      const shebang = lang === 'python' ? '#!/usr/bin/env python3\n' : '#!/usr/bin/env bash\n';
      return {
        filename: `package_${safeName}_deb.sh`,
        mime: 'text/x-shellscript;charset=utf-8',
        hint: `ينشئ حزمة ${safeName}_1.0.0.deb قابلة للتثبيت على Debian / Ubuntu / Kali عبر dpkg -i.`,
        content: `#!/usr/bin/env bash
set -e
PKG="${safeName}_1.0.0"
mkdir -p "$PKG/DEBIAN" "$PKG/usr/local/bin"

cat << '__END_USER_CODE__' > "$PKG/usr/local/bin/${safeName}"
${userCode.startsWith('#!') ? userCode : shebang + userCode}
__END_USER_CODE__
chmod 755 "$PKG/usr/local/bin/${safeName}"

cat << 'EOF' > "$PKG/DEBIAN/control"
Package: ${safeName.replace(/_/g, '-')}
Version: 1.0.0
Section: utils
Priority: optional
Architecture: all
Maintainer: Security Lab
Description: Custom packaged tool (${safeName})
EOF

dpkg-deb --build "$PKG"
echo "[+] Built $PKG.deb — Install with: sudo dpkg -i $PKG.deb"
`,
      };
    }

    // Android
    if (androidMode === 'termux') {
      const ext = lang === 'python' ? 'py' : lang === 'c' ? 'c' : 'sh';
      const runCmd =
        lang === 'python'
          ? `pkg install -y python\npython3 "${safeName}.py"`
          : lang === 'c'
          ? `pkg install -y clang\nclang "${safeName}.c" -o "${safeName}"\n./"${safeName}"`
          : `chmod +x "${safeName}.sh"\n./"${safeName}.sh"`;

      return {
        filename: `${safeName}_android_termux.sh`,
        mime: 'text/x-shellscript;charset=utf-8',
        hint: `ملف أندرويد جاهز للتشغيل داخل Termux: يستخرج كودك ويشغله مباشرة على الهاتف.`,
        content: `#!/data/data/com.termux/files/usr/bin/bash
set -e

cat << '__END_USER_CODE__' > "${safeName}.${ext}"
${userCode}
__END_USER_CODE__

${runCmd}
`,
      };
    }

    // Android APK (Buildozer)
    return {
      filename: `build_${safeName}_apk.sh`,
      mime: 'text/x-shellscript;charset=utf-8',
      hint: `يجهّز مجلد المشروع وملف buildozer.spec لبناء ملف تطبيق أندرويد (${safeName}.apk).`,
      content: `#!/usr/bin/env bash
set -e
mkdir -p "${safeName}_apk"
cd "${safeName}_apk"

cat << '__END_USER_CODE__' > main.py
${userCode}
__END_USER_CODE__

cat << 'EOF' > buildozer.spec
[app]
title = ${safeName}
package.name = ${safeName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'mytool'}
package.domain = org.securitylab
source.dir = .
source.include_exts = py,png,jpg,kv,atlas
version = 1.0
requirements = python3,kivy
orientation = portrait
android.permissions = INTERNET
EOF

echo "[*] Run inside Linux with Buildozer installed:"
echo "    pip install buildozer && buildozer -v android debug"
`,
    };
  }, [code, target, lang, safeName, winConsole, linuxMode, androidMode]);

  const handleDownload = () => {
    const blob = new Blob([outputArtifact.content], { type: outputArtifact.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputArtifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            تغليف وتحويل أي كود إلى ملفات (Windows .EXE · Linux · Android)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            اكتب أو الصق كودك هنا، واختر الصيغة المطلوبة ليتم تضمين كودك داخل ملف جاهز للتنفيذ أو البناء على ويندوز ولينكس وأندرويد.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleLoadPreset(e.target.value);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="" disabled>
              استيراد كود جاهز من مكتبة بايثون...
            </option>
            {PYTHON_SCRIPTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.filename} — {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 1: Name, Language, Code Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                اسم الملف / البرنامج
              </label>
              <input
                type="text"
                dir="ltr"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="my_scanner"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                لغة الكود المدخل
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SourceLang)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="python">Python 3 (.py)</option>
                <option value="bash">Bash / Shell (.sh)</option>
                <option value="c">C / C++ (.c)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                الكود الخاص بك (الصق الكود هنا)
              </label>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {code.split('\n').length} سطر
              </span>
            </div>
            <textarea
              dir="ltr"
              rows={14}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Paste your Python, Bash, or C code here..."
              className="w-full p-3.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Step 2: Target Platform & Generated Output File */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              اختر صيغة ونظام التصدير
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'windows_exe' as const, label: 'ويندوز (.exe)', icon: Monitor },
                { id: 'linux_bin' as const, label: 'لينكس (Linux)', icon: Terminal },
                { id: 'android_termux' as const, label: 'أندرويد (Android)', icon: Smartphone },
              ].map((t) => {
                const Icon = t.icon;
                const active = target === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTarget(t.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-options per target */}
          {target === 'windows_exe' && lang === 'python' && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                نوع نافذة الـ EXE في ويندوز
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWinConsole(true)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                    winConsole ? 'bg-emerald-600 text-white' : 'text-slate-500'
                  }`}
                >
                  طرفية (--console)
                </button>
                <button
                  type="button"
                  onClick={() => setWinConsole(false)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                    !winConsole ? 'bg-emerald-600 text-white' : 'text-slate-500'
                  }`}
                >
                  واجهة (--noconsole)
                </button>
              </div>
            </div>
          )}

          {target === 'linux_bin' && (
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {[
                { id: 'executable', label: 'ملف تنفيذي مباشر' },
                { id: 'elf', label: 'تجميع ثنائي (ELF)' },
                { id: 'deb', label: 'حزمة (.deb)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLinuxMode(m.id as typeof linuxMode)}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    linuxMode === m.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {target === 'android_termux' && (
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {[
                { id: 'termux', label: 'ملف تشغيل أندرويد (Termux)' },
                { id: 'apk', label: 'إعداد بناء تطبيق (.apk)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAndroidMode(m.id as typeof androidMode)}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    androidMode === m.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Output Preview + Download */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <span dir="ltr" className="text-xs font-mono text-emerald-400 truncate">
                {outputArtifact.filename}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل الملف</span>
                </button>
              </div>
            </div>
            <pre
              dir="ltr"
              className="p-4 text-xs font-mono text-slate-300 text-left overflow-x-auto max-h-64 leading-relaxed"
            >
              {outputArtifact.content}
            </pre>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {outputArtifact.hint}
          </p>
        </div>
      </div>
    </div>
  );
}
