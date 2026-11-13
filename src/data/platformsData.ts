export type PlatformTarget = 'windows' | 'linux' | 'android';

export interface PlatformTool {
  id: string;
  platform: PlatformTarget;
  name: string;
  summary: string;
  params: {
    key: string;
    label: string;
    defaultValue: string;
  }[];
  commands: {
    title: string;
    description: string;
    template: string;
    downloadExt?: string;
    downloadPrefix?: string;
  }[];
}

export const PLATFORM_TOOLS: PlatformTool[] = [
  // WINDOWS & .EXE
  {
    id: 'win-pyinstaller',
    platform: 'windows',
    name: 'تحويل بايثون إلى ملف EXE (PyInstaller / Nuitka)',
    summary: 'بناء ملف تنفيذي مستقل لنظام ويندوز (.exe) يعمل على أي جهاز بدون الحاجة لتثبيت بايثون.',
    params: [
      { key: 'script', label: 'اسم ملف البايثون', defaultValue: 'port_scanner.py' },
      { key: 'appname', label: 'اسم ملف الـ EXE الناتج', defaultValue: 'NetScanner' },
      { key: 'icon', label: 'أيقونة (اختياري .ico)', defaultValue: 'app.ico' },
    ],
    commands: [
      {
        title: 'بناء ملف EXE واحد مستقل (Onefile Console)',
        description: 'يدمج بايثون والمكتبات داخل ملف exe واحد يعمل في سطر الأوامر',
        template: 'pip install pyinstaller && pyinstaller --onefile --console --name "{appname}" "{script}"',
        downloadExt: '.bat',
        downloadPrefix: 'build_exe',
      },
      {
        title: 'بناء EXE بدون نافذة طرفية مع أيقونة مخصصة',
        description: 'مناسب للأدوات ذات الواجهة الرسومية GUI',
        template: 'pyinstaller --onefile --noconsole --icon="{icon}" --name "{appname}" "{script}"',
        downloadExt: '.bat',
        downloadPrefix: 'build_gui_exe',
      },
      {
        title: 'تحويل عبر Nuitka (أسرع أداءً ومترجم إلى C)',
        description: 'يحول كود بايثون إلى لغة C ثم يجمعه إلى ملف .exe عالي الأداء',
        template: 'pip install nuitka && python -m nuitka --onefile --output-filename="{appname}.exe" "{script}"',
      },
    ],
  },
  {
    id: 'win-cross-compile',
    platform: 'windows',
    name: 'بناء ملفات EXE من داخل لينكس (Cross-Compile)',
    summary: 'إنشاء ملفات ويندوز .exe مباشرة من طرفية لينكس أو كالي باستخدام MinGW أو Go أو Wine.',
    params: [
      { key: 'src', label: 'ملف المصدر (C / Go)', defaultValue: 'tool.c' },
      { key: 'out', label: 'اسم الملف التنفيذي', defaultValue: 'tool.exe' },
    ],
    commands: [
      {
        title: 'ترجمة كود C إلى Windows 64-bit EXE (MinGW)',
        description: 'يجمع كود C إلى ملف .exe جاهز لويندوز 64 بت من داخل لينكس',
        template: 'x86_64-w64-mingw32-gcc {src} -o {out} -lws2_32',
      },
      {
        title: 'ترجمة مشروع Go إلى Windows EXE',
        description: 'أسرع طريقة لبناء أدوات شبكية تعمل كملف .exe مستقل',
        template: 'GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o {out} main.go',
      },
      {
        title: 'تثبيت أداة الترجمة MinGW على كالي/أوبونتو',
        description: 'تثبيت المترجم اللازم لبناء ملفات ويندوز من لينكس',
        template: 'sudo apt update && sudo apt install -y mingw-w64',
      },
    ],
  },
  {
    id: 'win-net-sys',
    platform: 'windows',
    name: 'أدوات ويندوز للشبكات والفحص (CMD & PowerShell)',
    summary: 'أوامر مدمجة في ويندوز لفحص المنافذ، تحليل الاتصالات، تنزيل الملفات، وفحص الشهادات والهاش.',
    params: [
      { key: 'host', label: 'عنوان الهدف (IP/Domain)', defaultValue: '192.168.1.10' },
      { key: 'port', label: 'المنفذ', defaultValue: '443' },
      { key: 'file', label: 'مسار الملف', defaultValue: 'tool.exe' },
    ],
    commands: [
      {
        title: 'فحص منفذ معين عبر PowerShell',
        description: 'بديل سريع لأمر nc/telnet للتحقق من فتح المنفذ والمسار',
        template: 'powershell -Command "Test-NetConnection -ComputerName {host} -Port {port}"',
      },
      {
        title: 'عرض جميع المنافذ المفتوحة والعمليات المرتبطة',
        description: 'مكافئ ss -tulnp في ويندوز مع رقم العملية PID',
        template: 'netstat -ano | findstr LISTENING',
      },
      {
        title: 'حساب هاش SHA-256 لملف EXE عبر CertUtil',
        description: 'التحقق من سلامة الملفات قبل تشغيلها',
        template: 'certutil -hashfile {file} SHA256',
      },
      {
        title: 'تنزيل ملف عبر PowerShell Invoke-WebRequest',
        description: 'سحب أداة أو سكربت من خادم داخلي',
        template: 'powershell -Command "Invoke-WebRequest -Uri http://{host}:8000/{file} -OutFile {file}"',
      },
    ],
  },

  // LINUX PACKAGES & BINARIES
  {
    id: 'lin-binary-build',
    platform: 'linux',
    name: 'تحويل الأدوات إلى ملف تنفيذي في لينكس (ELF / Executable)',
    summary: 'تحويل سكربتات بايثون إلى ملفات تنفيذية مستقلة في لينكس أو أوامر نظام عامة في /usr/local/bin.',
    params: [
      { key: 'script', label: 'ملف البايثون', defaultValue: 'port_scanner.py' },
      { key: 'cmdname', label: 'اسم الأمر في الطرفية', defaultValue: 'netscan' },
    ],
    commands: [
      {
        title: 'تثبيت السكربت كأمر مباشر في النظام',
        description: 'إضافة صلاحية التنفيذ ونقل الأداة لتعمل من أي مسار في الطرفية',
        template: 'chmod +x {script} && sudo cp {script} /usr/local/bin/{cmdname}',
        downloadExt: '.sh',
        downloadPrefix: 'install_linux_tool',
      },
      {
        title: 'تحويل بايثون إلى ملف تنفيذي Linux ELF عبر PyInstaller',
        description: 'إنتاج ملف ثنائي يعمل على توزيعات لينكس المشابهة دون الحاجة لمكتبات خارجية',
        template: 'pyinstaller --onefile --name {cmdname} {script} && chmod +x dist/{cmdname}',
        downloadExt: '.sh',
        downloadPrefix: 'build_linux_bin',
      },
      {
        title: 'تجهيز سكربت تثبيت تلقائي لبيئة افتراضية (venv)',
        description: 'أفضل ممارسة لتشغيل أدوات بايثون في كالي وأوبونتو الحديثة',
        template: 'python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt',
      },
    ],
  },
  {
    id: 'lin-deb-systemd',
    platform: 'linux',
    name: 'بناء حزمة .deb وتشغيلها كخدمة Systemd',
    summary: 'تغليف أداتك في حزمة Debian/Ubuntu/Kali (.deb) أو تشغيلها تلقائياً في الخلفية عند الإقلاع.',
    params: [
      { key: 'pkgname', label: 'اسم الحزمة', defaultValue: 'my-sec-tool' },
      { key: 'version', label: 'الإصدار', defaultValue: '1.0.0' },
      { key: 'execpath', label: 'مسار الأداة التنفيذي', defaultValue: '/usr/local/bin/my-sec-tool' },
    ],
    commands: [
      {
        title: 'إنشاء هيكل وبناء حزمة .deb كاملة',
        description: 'يبني ملف .deb قابل للتثبيت عبر dpkg -i على Debian و Kali و Ubuntu',
        template: `mkdir -p {pkgname}_{version}/DEBIAN {pkgname}_{version}/usr/local/bin
cat << 'EOF' > {pkgname}_{version}/DEBIAN/control
Package: {pkgname}
Version: {version}
Section: utils
Priority: optional
Architecture: amd64
Maintainer: Security Lab
Description: Custom Linux security & automation tool
EOF
dpkg-deb --build {pkgname}_{version}`,
        downloadExt: '.sh',
        downloadPrefix: 'build_deb',
      },
      {
        title: 'إنشاء ملف خدمة Systemd للتشغيل بالخلفية',
        description: 'تشغيل الأداة كخدمة نظام تعيد تشغيل نفسها تلقائياً',
        template: `sudo tee /etc/systemd/system/{pkgname}.service > /dev/null << 'EOF'
[Unit]
Description={pkgname} Service
After=network.target

[Service]
Type=simple
ExecStart={execpath}
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now {pkgname}`,
      },
    ],
  },

  // ANDROID (ADB, TERMUX, APK)
  {
    id: 'and-termux',
    platform: 'android',
    name: 'تجهيز Termux على أندرويد (Nmap + Python + Linux)',
    summary: 'تشغيل أدوات Nmap وبايثون و SSH و Git مباشرة من هاتف أندرويد عبر تطبيق Termux.',
    params: [
      { key: 'script', label: 'اسم سكربت بايثون', defaultValue: 'port_scanner.py' },
      { key: 'target', label: 'عنوان الهدف', defaultValue: '192.168.1.1' },
    ],
    commands: [
      {
        title: 'تجهيز بيئة Termux كاملة بأهم الأدوات',
        description: 'تحديث المستودعات وتثبيت بايثون و Nmap و Git و OpenSSH و Netcat',
        template: 'pkg update -y && pkg upgrade -y && pkg install -y python nmap git openssh netcat-openbsd curl wget',
        downloadExt: '.sh',
        downloadPrefix: 'termux_setup',
      },
      {
        title: 'منح صلاحية الوصول لذاكرة الهاتف وتشغيل السكربت',
        description: 'ربط مجلد التحميلات وتشغيل أدوات بايثون من داخل Termux',
        template: 'termux-setup-storage && python3 ~/storage/downloads/{script}',
      },
      {
        title: 'فحص الشبكة عبر Nmap في Termux (بدون روت)',
        description: 'استخدام فحص TCP Connect (-sT) الذي يعمل على أندرويد بدون صلاحيات Root',
        template: 'nmap -sT -sV -T4 --top-ports 100 {target}',
      },
    ],
  },
  {
    id: 'and-adb',
    platform: 'android',
    name: 'أداة ADB (Android Debug Bridge) للتحكم والفحص',
    summary: 'الاتصال بأجهزة أندرويد عبر USB أو Wi-Fi، إدارة التطبيقات، سحب السجلات، ونقل الملفات.',
    params: [
      { key: 'deviceIp', label: 'IP هاتف أندرويد', defaultValue: '192.168.1.75' },
      { key: 'apk', label: 'اسم ملف APK', defaultValue: 'app-debug.apk' },
      { key: 'pkg', label: 'معرف الحزمة (Package)', defaultValue: 'com.example.app' },
    ],
    commands: [
      {
        title: 'تثبيت ADB على لينكس وعرض الأجهزة المتصلة',
        description: 'التأكد من تعرف الجهاز بعد تفعيل USB Debugging',
        template: 'sudo apt install -y adb && adb devices -l',
      },
      {
        title: 'الربط اللاسلكي عبر Wi-Fi (TCP/IP)',
        description: 'تشغيل ADB لاسلكياً عبر الشبكة المحلية على المنفذ 5555',
        template: 'adb tcpip 5555 && adb connect {deviceIp}:5555',
      },
      {
        title: 'تثبيت APK وسحب حزمة تطبيق من الهاتف',
        description: 'تثبيت ملف APK أو استخراج مسار تطبيق مثبت لفحصه',
        template: 'adb install -r {apk} && adb shell pm path {pkg}',
      },
      {
        title: 'مراقبة سجلات النظام والتطبيقات (Logcat)',
        description: 'البحث عن الأخطاء أو البيانات المسربة في سجلات أندرويد لحظياً',
        template: 'adb logcat | grep -iE "error|token|http|{pkg}"',
      },
    ],
  },
  {
    id: 'and-apk-analysis',
    platform: 'android',
    name: 'فحص وتفكيك ملفات APK (APKTool & JADX)',
    summary: 'تفكيك تطبيقات أندرويد لفحص AndroidManifest.xml، الأذونات، والشهادات الأمنية.',
    params: [
      { key: 'apk', label: 'ملف APK المستهدف', defaultValue: 'target.apk' },
      { key: 'outDir', label: 'مجلد الاستخراج', defaultValue: 'decoded_app' },
    ],
    commands: [
      {
        title: 'تفكيك ملف APK واستخراج الموارد والـ Manifest',
        description: 'تحليل الصلاحيات والـ Activities والروابط المضمنة داخل التطبيق',
        template: 'apktool d {apk} -o {outDir}',
      },
      {
        title: 'تحويل APK إلى كود Java مقروء عبر JADX',
        description: 'استخراج الكود المصدري لتحليل المنطق ونقاط النهاية (API Endpoints)',
        template: 'jadx -d {outDir}_java {apk}',
      },
      {
        title: 'البحث عن روابط API أو مفاتيح داخل الملفات المفككة',
        description: 'فحص سريع للروابط والنصوص الحساسة داخل المجلد المستخرج',
        template: 'grep -rnE "https?://|api_key|secret|token" {outDir}/',
      },
    ],
  },
];
