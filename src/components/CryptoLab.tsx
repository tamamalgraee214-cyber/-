import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import {
  DecodedJwt,
  base64ToUtf8,
  binaryToText,
  caesarShift,
  decodeJwt,
  digestSha,
  generateSecurePassword,
  hexToText,
  md5,
  textToBinary,
  textToHex,
  utf8ToBase64,
} from '../utils/crypto';

type CryptoTab = 'encode' | 'hash' | 'jwt' | 'password';

export function CryptoLab() {
  const [tab, setTab] = useState<CryptoTab>('encode');

  // Encode/Decode state
  const [plainInput, setPlainInput] = useState('kali-linux-pentest:1337');
  const [encodeMode, setEncodeMode] = useState<'base64' | 'url' | 'hex' | 'binary' | 'rot13'>('base64');
  const [caesarKey, setCaesarKey] = useState(13);
  const [encodeOutput, setEncodeOutput] = useState('');
  const [encodeError, setEncodeError] = useState('');

  // Hash state
  const [hashInput, setHashInput] = useState('admin123');
  const [upperCaseHash, setUpperCaseHash] = useState(false);
  const [hashes, setHashes] = useState<{ label: string; value: string }[]>([]);

  // JWT state
  const [jwtInput, setJwtInput] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAxIiwibmFtZSI6IkFkbWluIiwicm9sZSI6InN1cGVydXNlciIsImlhdCI6MTczMDk0MDAwMH0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  );
  const [jwtDecoded, setJwtDecoded] = useState<DecodedJwt | null>(null);
  const [jwtError, setJwtError] = useState('');

  // Password state
  const [pwLength, setPwLength] = useState(20);
  const [pwUpper, setPwUpper] = useState(true);
  const [pwLower, setPwLower] = useState(true);
  const [pwDigits, setPwDigits] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [generatedPw, setGeneratedPw] = useState<{ password: string; entropyBits: number }>(() =>
    generateSecurePassword({ length: 20, upper: true, lower: true, digits: true, symbols: true })
  );

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Compute Encoding dynamically
  const runEncode = () => {
    setEncodeError('');
    try {
      switch (encodeMode) {
        case 'base64':
          setEncodeOutput(utf8ToBase64(plainInput));
          break;
        case 'url':
          setEncodeOutput(encodeURIComponent(plainInput));
          break;
        case 'hex':
          setEncodeOutput(textToHex(plainInput));
          break;
        case 'binary':
          setEncodeOutput(textToBinary(plainInput));
          break;
        case 'rot13':
          setEncodeOutput(caesarShift(plainInput, caesarKey));
          break;
      }
    } catch (err) {
      setEncodeError(err instanceof Error ? err.message : 'تعذر الترميز');
    }
  };

  const runDecode = () => {
    setEncodeError('');
    try {
      switch (encodeMode) {
        case 'base64':
          setEncodeOutput(base64ToUtf8(plainInput));
          break;
        case 'url':
          setEncodeOutput(decodeURIComponent(plainInput));
          break;
        case 'hex':
          setEncodeOutput(hexToText(plainInput));
          break;
        case 'binary':
          setEncodeOutput(binaryToText(plainInput));
          break;
        case 'rot13':
          setEncodeOutput(caesarShift(plainInput, 26 - (caesarKey % 26)));
          break;
      }
    } catch (err) {
      setEncodeError(err instanceof Error ? err.message : 'النص المدخل غير صالح لفك الترميز');
    }
  };

  useEffect(() => {
    let active = true;
    const computeHashes = async () => {
      const md5Val = md5(hashInput);
      const [sha1, sha256, sha384, sha512] = await Promise.all([
        digestSha('SHA-1', hashInput),
        digestSha('SHA-256', hashInput),
        digestSha('SHA-384', hashInput),
        digestSha('SHA-512', hashInput),
      ]);
      if (!active) return;
      const fmt = (s: string) => (upperCaseHash ? s.toUpperCase() : s);
      setHashes([
        { label: 'MD5 (128-bit)', value: fmt(md5Val) },
        { label: 'SHA-1 (160-bit)', value: fmt(sha1) },
        { label: 'SHA-256 (256-bit)', value: fmt(sha256) },
        { label: 'SHA-384 (384-bit)', value: fmt(sha384) },
        { label: 'SHA-512 (512-bit)', value: fmt(sha512) },
      ]);
    };
    computeHashes();
    return () => {
      active = false;
    };
  }, [hashInput, upperCaseHash]);

  useEffect(() => {
    try {
      setJwtError('');
      setJwtDecoded(decodeJwt(jwtInput));
    } catch (err) {
      setJwtDecoded(null);
      setJwtError(err instanceof Error ? err.message : 'توكن JWT غير صالح');
    }
  }, [jwtInput]);

  const regeneratePassword = () => {
    setGeneratedPw(
      generateSecurePassword({
        length: pwLength,
        upper: pwUpper,
        lower: pwLower,
        digits: pwDigits,
        symbols: pwSymbols,
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          مختبر التشفير والترميز والهاش
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          أدوات معالجة فورية تعمل محلياً داخل المتصفح عبر WebCrypto دون إرسال بياناتك لأي خادم خارجي.
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'encode', label: 'الترميز وفك الترميز' },
          { id: 'hash', label: 'مولد الهاش (MD5 / SHA)' },
          { id: 'jwt', label: 'محلل JWT' },
          { id: 'password', label: 'مولد كلمات المرور' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as CryptoTab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Encode / Decode */}
      {tab === 'encode' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'base64', label: 'Base64' },
                { id: 'url', label: 'URL Encode' },
                { id: 'hex', label: 'Hexadecimal' },
                { id: 'binary', label: 'Binary (8-bit)' },
                { id: 'rot13', label: 'Caesar / ROT' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEncodeMode(m.id as typeof encodeMode)}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                    encodeMode === m.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {encodeMode === 'rot13' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">الإزاحة (Shift):</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={caesarKey}
                  onChange={(e) => setCaesarKey(Number(e.target.value) || 13)}
                  className="w-16 px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                النص المدخل (Input)
              </label>
              <textarea
                dir="ltr"
                rows={6}
                value={plainInput}
                onChange={(e) => setPlainInput(e.target.value)}
                className="w-full p-3 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  النتيجة (Output)
                </label>
                {encodeOutput && (
                  <button
                    type="button"
                    onClick={() => copyText('encode', encodeOutput)}
                    className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 cursor-pointer"
                  >
                    {copiedKey === 'encode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'encode' ? 'تم النسخ' : 'نسخ النتيجة'}</span>
                  </button>
                )}
              </div>
              <textarea
                dir="ltr"
                rows={6}
                readOnly
                value={encodeOutput}
                placeholder="اضغط ترميز أو فك ترميز لعرض النتيجة..."
                className="w-full p-3 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-300 focus:outline-none"
              />
            </div>
          </div>

          {encodeError && (
            <p className="text-xs text-rose-500 font-medium">{encodeError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runEncode}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              تشفير / ترميز (Encode)
            </button>
            <button
              type="button"
              onClick={runDecode}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              فك الترميز (Decode)
            </button>
            <button
              type="button"
              onClick={() => {
                if (encodeOutput) {
                  setPlainInput(encodeOutput);
                  setEncodeOutput('');
                }
              }}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              نقل النتيجة إلى المدخل
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Hash Generator */}
      {tab === 'hash' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              النص المطلوب حساب بصمته (Hash Input)
            </label>
            <button
              type="button"
              onClick={() => setUpperCaseHash(!upperCaseHash)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {upperCaseHash ? 'أحرف كبيرة (UPPER)' : 'أحرف صغيرة (lower)'}
            </button>
          </div>

          <textarea
            dir="ltr"
            rows={3}
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="أدخل أي نص أو كلمة مرور..."
            className="w-full p-3 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />

          <div className="space-y-3">
            {hashes.map((h) => (
              <div
                key={h.label}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {h.label}
                  </div>
                  <div dir="ltr" className="text-xs sm:text-sm font-mono text-emerald-500 break-all text-left">
                    {h.value}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(h.label, h.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
                >
                  {copiedKey === h.label ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === h.label ? 'تم' : 'نسخ'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: JWT Inspector */}
      {tab === 'jwt' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              الصق رمز JWT لفحص محتواه (Header & Payload)
            </label>
            <textarea
              dir="ltr"
              rows={3}
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {jwtError ? (
            <div className="p-4 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-400">
              {jwtError}
            </div>
          ) : (
            jwtDecoded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Header (الخوارزمية والنوع)
                  </div>
                  <pre
                    dir="ltr"
                    className="p-4 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-amber-300 overflow-x-auto text-left"
                  >
                    {JSON.stringify(jwtDecoded.header, null, 2)}
                  </pre>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Payload (البيانات والصلاحيات)
                  </div>
                  <pre
                    dir="ltr"
                    className="p-4 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto text-left"
                  >
                    {JSON.stringify(jwtDecoded.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Tab 4: Secure Password Generator */}
      {tab === 'password' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-slate-800 bg-slate-950">
            <div dir="ltr" className="font-mono text-base sm:text-lg text-emerald-400 break-all text-left">
              {generatedPw.password}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={regeneratePassword}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>توليد جديد</span>
              </button>
              <button
                type="button"
                onClick={() => copyText('pw', generatedPw.password)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                {copiedKey === 'pw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'pw' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>قوة الإنتروبيا المقدرة:</span>
            <span className="font-mono font-bold text-emerald-500 tabular-nums">
              {generatedPw.entropyBits} bits
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {generatedPw.entropyBits >= 100
                ? 'قوية جداً (مناسبة للمفاتيح الحساسة)'
                : generatedPw.entropyBits >= 70
                ? 'قوية'
                : 'متوسطة'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span>الطول (Length)</span>
                <span className="font-mono text-emerald-500 tabular-nums">{pwLength}</span>
              </label>
              <input
                type="range"
                min={8}
                max={64}
                value={pwLength}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPwLength(val);
                  setGeneratedPw(
                    generateSecurePassword({
                      length: val,
                      upper: pwUpper,
                      lower: pwLower,
                      digits: pwDigits,
                      symbols: pwSymbols,
                    })
                  );
                }}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'أحرف كبيرة (A-Z)', state: pwUpper, set: setPwUpper },
                { label: 'أحرف صغيرة (a-z)', state: pwLower, set: setPwLower },
                { label: 'أرقام (0-9)', state: pwDigits, set: setPwDigits },
                { label: 'رموز (!@#$)', state: pwSymbols, set: setPwSymbols },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => opt.set(!opt.state)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-right transition-colors cursor-pointer ${
                    opt.state
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
