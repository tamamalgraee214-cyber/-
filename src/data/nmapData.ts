import { NmapFlag, NmapPreset, NseScript } from '../types';

export const NMAP_PRESETS: NmapPreset[] = [
  {
    id: 'quick',
    name: 'فحص سريع لأشهر المنافذ',
    subtitle: 'مناسب للاستطلاع الأولي السريع',
    scanType: '-sS',
    flags: ['-T4', '-F', '--open'],
    timing: '-T4',
    portMode: 'fast',
    scripts: [],
  },
  {
    id: 'comprehensive',
    name: 'فحص شامل للخدمات والنظام',
    subtitle: 'يكتشف الإصدارات ونظام التشغيل والسكربتات الافتراضية',
    scanType: '-sS',
    flags: ['-sV', '-O', '-sC', '-T4', '-v'],
    timing: '-T4',
    portMode: 'default',
    scripts: [],
  },
  {
    id: 'all-ports',
    name: 'فحص جميع المنافذ (1–65535)',
    subtitle: 'تغطية كاملة لكل منافذ TCP مع كشف الخدمات',
    scanType: '-sS',
    flags: ['-sV', '-T4', '--open'],
    timing: '-T4',
    portMode: 'all',
    scripts: [],
  },
  {
    id: 'vuln',
    name: 'فحص الثغرات (NSE Vuln)',
    subtitle: 'يشغل سكربتات فحص الثغرات المعروفة على الخدمات المكتشفة',
    scanType: '-sS',
    flags: ['-sV', '-T4'],
    timing: '-T4',
    portMode: 'top',
    topPortsCount: '1000',
    scripts: ['vuln'],
  },
  {
    id: 'stealth',
    name: 'فحص هادئ وتجاوز الجدار الناري',
    subtitle: 'تجزئة الحزم مع توقيت بطيء وتجاهل Ping',
    scanType: '-sS',
    flags: ['-Pn', '-f', '-n', '--randomize-hosts'],
    timing: '-T2',
    portMode: 'custom',
    customPorts: '21,22,25,53,80,443,445,3389,8080',
    scripts: [],
  },
  {
    id: 'ping-sweep',
    name: 'اكتشاف الأجهزة المتصلة بالشبكة',
    subtitle: 'فحص الشبكة المحلية لمعرفة الأجهزة الفعالة بدون فحص منافذ',
    scanType: '-sn',
    flags: ['-n'],
    timing: '-T4',
    portMode: 'default',
    scripts: [],
  },
];

export const NMAP_SCAN_TYPES: NmapFlag[] = [
  {
    flag: '-sS',
    label: 'TCP SYN Stealth',
    description: 'فحص نصف مفتوح سريع وخفي نسبياً (الافتراضي مع صلاحيات root)',
    group: 'scan',
    requiresRoot: true,
  },
  {
    flag: '-sT',
    label: 'TCP Connect',
    description: 'اتصال TCP كامل لا يتطلب صلاحيات root',
    group: 'scan',
  },
  {
    flag: '-sU',
    label: 'UDP Scan',
    description: 'فحص منافذ UDP مثل DNS و SNMP و DHCP',
    group: 'scan',
    requiresRoot: true,
  },
  {
    flag: '-sA',
    label: 'TCP ACK Scan',
    description: 'لتحليل قواعد الجدار الناري ومعرفة المنافذ المفلترة',
    group: 'scan',
    requiresRoot: true,
  },
  {
    flag: '-sn',
    label: 'Ping Sweep (Host Discovery)',
    description: 'اكتشاف الأجهزة النشطة في الشبكة فقط بدون فحص المنافذ',
    group: 'scan',
  },
];

export const NMAP_OPTION_FLAGS: NmapFlag[] = [
  {
    flag: '-sV',
    label: 'كشف إصدارات الخدمات (-sV)',
    description: 'يحدد اسم البرنامج وإصداره على كل منفذ مفتوح',
    group: 'detection',
  },
  {
    flag: '-O',
    label: 'كشف نظام التشغيل (-O)',
    description: 'تحليل بصمة TCP/IP لتحديد نظام التشغيل (Linux/Windows)',
    group: 'detection',
    requiresRoot: true,
  },
  {
    flag: '-sC',
    label: 'السكربتات الافتراضية (-sC)',
    description: 'تشغيل مجموعة سكربتات NSE الافتراضية الآمنة',
    group: 'detection',
  },
  {
    flag: '-A',
    label: 'فحص عدواني متكامل (-A)',
    description: 'يجمع بين -sV و -O و -sC و traceroute',
    group: 'detection',
  },
  {
    flag: '-Pn',
    label: 'تجاهل فحص الاتصال (-Pn)',
    description: 'يفترض أن الهدف متصل حتى لو حظر ICMP Ping',
    group: 'discovery',
  },
  {
    flag: '-n',
    label: 'تعطيل DNS (-n)',
    description: 'يسرّع الفحص بتجنب استعلامات Reverse DNS',
    group: 'discovery',
  },
  {
    flag: '--open',
    label: 'إظهار المفتوحة فقط (--open)',
    description: 'يعرض المنافذ المفتوحة فقط في النتيجة النهائية',
    group: 'output',
  },
  {
    flag: '-v',
    label: 'تفاصيل إضافية (-v)',
    description: 'يعرض النتائج وتقدم الفحص لحظياً',
    group: 'output',
  },
  {
    flag: '--reason',
    label: 'سبب الحالة (--reason)',
    description: 'يوضح سبب تصنيف المنفذ (syn-ack, reset, timeout)',
    group: 'output',
  },
  {
    flag: '-f',
    label: 'تجزئة الحزم (-f)',
    description: 'تقسيم ترويسة IP لحزم أصغر لتجاوز بعض فلاتر الحماية',
    group: 'evasion',
    requiresRoot: true,
  },
  {
    flag: '--randomize-hosts',
    label: 'ترتيب عشوائي للأهداف',
    description: 'يفحص عناوين IP بترتيب غير متسلسل لتقليل الاكتشاف',
    group: 'evasion',
  },
  {
    flag: '-oN scan_result.txt',
    label: 'حفظ النتيجة كنص (-oN)',
    description: 'حفظ مخرجات الفحص في ملف نصي عادي',
    group: 'output',
  },
  {
    flag: '-oX scan_result.xml',
    label: 'حفظ النتيجة كـ XML (-oX)',
    description: 'تصدير النتيجة بصيغة XML للاستيراد في أدوات التحليل',
    group: 'output',
  },
];

export const NMAP_TIMINGS = [
  { value: '-T0', label: 'T0 · بطيء جداً (Paranoid)' },
  { value: '-T1', label: 'T1 · متخفي (Sneaky)' },
  { value: '-T2', label: 'T2 · مهذب (Polite)' },
  { value: '-T3', label: 'T3 · افتراضي (Normal)' },
  { value: '-T4', label: 'T4 · سريع (Aggressive)' },
  { value: '-T5', label: 'T5 · أقصى سرعة (Insane)' },
];

export const NSE_SCRIPTS: NseScript[] = [
  { name: 'vuln', category: 'vuln', description: 'فحص الثغرات المعروفة عبر قاعدة بيانات CVE/NSE' },
  { name: 'vulners', category: 'vuln', description: 'ربط إصدارات الخدمات بثغرات Vulners (يتطلب -sV)' },
  { name: 'http-enum', category: 'http', description: 'تخمين واكتشاف المجلدات واللوحات على خوادم الويب' },
  { name: 'http-title', category: 'http', description: 'جلب عنوان الصفحة الرئيسية لمواقع HTTP/HTTPS' },
  { name: 'http-headers', category: 'http', description: 'عرض ترويسات الأمان والاستجابة لخادم الويب' },
  { name: 'http-robots.txt', category: 'http', description: 'فحص ملف robots.txt للمسارات المخفية' },
  { name: 'http-methods', category: 'http', description: 'التحقق من طرق HTTP الخطرة مثل PUT و DELETE' },
  { name: 'ssl-cert', category: 'ssl', description: 'استخراج تفاصيل شهادة SSL/TLS وتاريخ الصلاحية' },
  { name: 'ssl-enum-ciphers', category: 'ssl', description: 'فحص خوارزميات التشفير الضعيفة في TLS/SSL' },
  { name: 'smb-vuln-ms17-010', category: 'smb', description: 'فحص ثغرة EternalBlue الشهيرة على منفذ 445' },
  { name: 'smb-os-discovery', category: 'smb', description: 'جمع معلومات النظام واسم النطاق عبر بروتوكول SMB' },
  { name: 'smb-enum-shares', category: 'smb', description: 'سرد المجلدات المشتركة وصلاحيات الوصول عبر SMB' },
  { name: 'ftp-anon', category: 'auth', description: 'التحقق من إمكانية الدخول المجهول (Anonymous) على FTP' },
  { name: 'ssh-auth-methods', category: 'auth', description: 'معرفة طرق المصادقة المدعومة في خادم SSH' },
  { name: 'dns-brute', category: 'discovery', description: 'تخمين النطاقات الفرعية (Subdomains) عبر DNS' },
  { name: 'banner', category: 'discovery', description: 'قراءة الترحيب (Banner) للخدمات المفتوحة' },
  { name: 'mysql-info', category: 'discovery', description: 'عرض معلومات وإصدار وإمكانيات خادم MySQL' },
  { name: 'rdp-enum-encryption', category: 'ssl', description: 'فحص مستوى التشفير على خدمة سطح المكتب البعيد RDP' },
];

export function generateSampleNmapOutput(params: {
  target: string;
  scanType: string;
  flags: string[];
  scripts: string[];
  portMode: string;
  customPorts: string;
}): string {
  const target = params.target.trim() || '192.168.1.10';
  const hasServiceVersion = params.flags.includes('-sV') || params.flags.includes('-A');
  const hasOs = params.flags.includes('-O') || params.flags.includes('-A');

  if (params.scanType === '-sn') {
    return `Starting Nmap 7.95 ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.0014s latency).
MAC Address: 00:0C:29:4F:8E:12 (VMware)
Nmap done: 1 IP address (1 host up) scanned in 0.18 seconds`;
  }

  const lines: string[] = [
    `Starting Nmap 7.95 ( https://nmap.org )`,
    `Nmap scan report for ${target}`,
    `Host is up (0.0032s latency).`,
    `Not shown: 996 closed tcp ports (reset)`,
    hasServiceVersion
      ? `PORT     STATE SERVICE  VERSION`
      : `PORT     STATE SERVICE`,
    hasServiceVersion
      ? `22/tcp   open  ssh      OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux)`
      : `22/tcp   open  ssh`,
    hasServiceVersion
      ? `80/tcp   open  http     nginx 1.18.0 (Ubuntu)`
      : `80/tcp   open  http`,
  ];

  if (params.scripts.includes('http-title') || params.flags.includes('-sC') || params.flags.includes('-A')) {
    lines.push(`|_http-title: Welcome to nginx!`);
  }
  if (params.scripts.includes('http-headers')) {
    lines.push(`| http-headers:\n|   Server: nginx/1.18.0\n|_  X-Frame-Options: SAMEORIGIN`);
  }

  lines.push(
    hasServiceVersion
      ? `443/tcp  open  ssl/http nginx 1.18.0`
      : `443/tcp  open  https`
  );

  if (params.scripts.includes('ssl-cert')) {
    lines.push(`| ssl-cert: Subject: commonName=${target}\n|_Not valid after:  2027-05-14T23:59:59`);
  }

  lines.push(
    hasServiceVersion
      ? `3306/tcp open  mysql    MySQL 8.0.36`
      : `3306/tcp open  mysql`
  );

  if (params.scripts.includes('vuln') || params.scripts.includes('vulners')) {
    lines.push(`| vulners:\n|   cpe:/a:igor_sysoev:nginx:1.18.0:\n|_    CVE-2021-23017  7.7  https://vulners.com/cve/CVE-2021-23017`);
  }

  if (hasOs) {
    lines.push(`Device type: general purpose\nRunning: Linux 5.X\nOS CPE: cpe:/o:linux:linux_kernel:5.15\nOS details: Linux 5.4 - 5.15`);
  }

  lines.push(`\nNmap done: 1 IP address (1 host up) scanned in 4.82 seconds`);
  return lines.join('\n');
}
