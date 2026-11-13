import { PythonScript } from '../types';

export const PYTHON_CATEGORIES = [
  { id: 'all', label: 'جميع الأكواد' },
  { id: 'network', label: 'الشبكات والفحص' },
  { id: 'web', label: 'الويب والـ HTTP' },
  { id: 'crypto', label: 'التشفير والأمان' },
  { id: 'automation', label: 'أتمتة لينكس' },
] as const;

export const PYTHON_SCRIPTS: PythonScript[] = [
  {
    id: 'py-port-scanner',
    title: 'ماسح منافذ TCP متعدد الخيوط (Multi-Threaded Port Scanner)',
    filename: 'port_scanner.py',
    category: 'network',
    summary: 'فحص سريع للمنافذ باستخدام مكتبة socket و ThreadPoolExecutor مع جلب الـ Banner عند توفره.',
    runCommand: 'python3 port_scanner.py',
    params: [
      { key: 'target', label: 'عنوان الهدف (IP/Domain)', defaultValue: '127.0.0.1' },
      { key: 'startPort', label: 'بداية النطاق', defaultValue: '1' },
      { key: 'endPort', label: 'نهاية النطاق', defaultValue: '1024' },
      { key: 'threads', label: 'عدد الخيوط', defaultValue: '100' },
    ],
    buildCode: (v) => `import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

TARGET = "${v.target || '127.0.0.1'}"
START_PORT = ${Number(v.startPort) || 1}
END_PORT = ${Number(v.endPort) || 1024}
MAX_THREADS = ${Number(v.threads) || 100}
TIMEOUT = 1.0

def scan_port(host: str, port: int):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(TIMEOUT)
            if s.connect_ex((host, port)) == 0:
                banner = ""
                try:
                    s.sendall(b"HEAD / HTTP/1.0\\r\\n\\r\\n")
                    banner = s.recv(128).decode(errors="ignore").splitlines()[0]
                except Exception:
                    pass
                return port, banner
    except Exception:
        pass
    return None

def main():
    ip = socket.gethostbyname(TARGET)
    print(f"[*] Scanning {TARGET} ({ip}) ports {START_PORT}-{END_PORT}...")
    open_ports = []

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = [executor.submit(scan_port, ip, p) for p in range(START_PORT, END_PORT + 1)]
        for future in as_completed(futures):
            result = future.result()
            if result:
                port, banner = result
                open_ports.append(port)
                info = f" | Banner: {banner}" if banner else ""
                print(f"[+] Port {port}/tcp OPEN{info}")

    print(f"\\n[✓] Done. Total open ports: {len(open_ports)}")

if __name__ == "__main__":
    main()`,
  },
  {
    id: 'py-dir-fuzzer',
    title: 'مكتشف المسارات والمجلدات (Web Directory Fuzzer)',
    filename: 'dir_fuzzer.py',
    category: 'web',
    summary: 'فحص المسارات المخفية في مواقع الويب عبر قائمة كلمات مع دعم الخيوط وتصفية أكواد الحالة.',
    pipInstall: 'pip install requests',
    runCommand: 'python3 dir_fuzzer.py',
    params: [
      { key: 'baseUrl', label: 'الرابط الأساسي', defaultValue: 'http://192.168.1.10' },
      { key: 'wordlist', label: 'مسار ملف الكلمات', defaultValue: 'wordlist.txt' },
      { key: 'threads', label: 'عدد الخيوط', defaultValue: '25' },
    ],
    buildCode: (v) => `import requests
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE_URL = "${v.baseUrl || 'http://192.168.1.10'}".rstrip("/")
WORDLIST_PATH = "${v.wordlist || 'wordlist.txt'}"
THREADS = ${Number(v.threads) || 25}
VALID_CODES = {200, 204, 301, 302, 307, 401, 403}

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 (Security-Audit)"})

def check_path(word: str):
    path = word.strip().lstrip("/")
    if not path or path.startswith("#"):
        return
    url = f"{BASE_URL}/{path}"
    try:
        resp = session.get(url, timeout=4, allow_redirects=False)
        if resp.status_code in VALID_CODES:
            print(f"[{resp.status_code}] {url} ({len(resp.content)} bytes)")
    except requests.RequestException:
        pass

def main():
    words = Path(WORDLIST_PATH).read_text(encoding="utf-8", errors="ignore").splitlines()
    print(f"[*] Fuzzing {BASE_URL} with {len(words)} entries...")
    with ThreadPoolExecutor(max_workers=THREADS) as pool:
        pool.map(check_path, words)

if __name__ == "__main__":
    main()`,
  },
  {
    id: 'py-http-audit',
    title: 'فاحص الترويسات الأمنية للمواقع (HTTP Security Headers Auditor)',
    filename: 'header_audit.py',
    category: 'web',
    summary: 'تحليل أي موقع للتحقق من وجود ترويسات الحماية مثل HSTS و CSP و X-Frame-Options.',
    pipInstall: 'pip install requests',
    runCommand: 'python3 header_audit.py',
    params: [
      { key: 'url', label: 'رابط الموقع', defaultValue: 'https://example.com' },
    ],
    buildCode: (v) => `import requests

TARGET_URL = "${v.url || 'https://example.com'}"

SECURITY_HEADERS = {
    "Strict-Transport-Security": "يفرض الاتصال المشفر HTTPS (HSTS)",
    "Content-Security-Policy": "يحد من هجمات XSS وحقن الأكواد",
    "X-Frame-Options": "يمنع هجمات Clickjacking",
    "X-Content-Type-Options": "يمنع تخمين نوع الملفات MIME Sniffing",
    "Referrer-Policy": "يتحكم ببيانات المرجع المرسلة",
    "Permissions-Policy": "يقيد صلاحيات المتصفح الحساسة",
}

def audit_headers(url: str):
    resp = requests.get(url, timeout=8)
    print(f"URL: {resp.url} | Status: {resp.status_code}")
    print(f"Server: {resp.headers.get('Server', 'Hidden')}\\n")

    for header, desc in SECURITY_HEADERS.items():
        value = resp.headers.get(header)
        status = f"PRESENT -> {value}" if value else "MISSING"
        print(f"{header:28s} : {status} ({desc})")

if __name__ == "__main__":
    audit_headers(TARGET_URL)`,
  },
  {
    id: 'py-arp-scanner',
    title: 'ماسح الشبكة المحلية عبر ARP (Scapy Network Discovery)',
    filename: 'arp_discover.py',
    category: 'network',
    summary: 'اكتشاف كافة الأجهزة في الشبكة المحلية مع عناوين IP و MAC باستخدام Scapy.',
    pipInstall: 'pip install scapy',
    runCommand: 'sudo python3 arp_discover.py',
    params: [
      { key: 'subnet', label: 'نطاق الشبكة (CIDR)', defaultValue: '192.168.1.0/24' },
      { key: 'iface', label: 'واجهة الشبكة', defaultValue: 'eth0' },
    ],
    buildCode: (v) => `from scapy.all import ARP, Ether, srp

SUBNET = "${v.subnet || '192.168.1.0/24'}"
INTERFACE = "${v.iface || 'eth0'}"

def scan_lan(subnet: str, iface: str):
    packet = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=subnet)
    answered, _ = srp(packet, timeout=2, iface=iface, verbose=False)

    print(f"{'IP Address':18s} | {'MAC Address'}")
    print("-" * 40)
    for _, received in answered:
        print(f"{received.psrc:18s} | {received.hwsrc}")

if __name__ == "__main__":
    scan_lan(SUBNET, INTERFACE)`,
  },
  {
    id: 'py-subdomain-enum',
    title: 'مستكشف النطاقات الفرعية (DNS Subdomain Enumerator)',
    filename: 'subdomain_enum.py',
    category: 'network',
    summary: 'التحقق السريع من وجود النطاقات الفرعية النشطة وحل عناوين IP الخاصة بها.',
    runCommand: 'python3 subdomain_enum.py',
    params: [
      { key: 'domain', label: 'النطاق الرئيسي', defaultValue: 'example.com' },
      { key: 'threads', label: 'عدد الخيوط', defaultValue: '30' },
    ],
    buildCode: (v) => `import socket
from concurrent.futures import ThreadPoolExecutor

DOMAIN = "${v.domain || 'example.com'}"
THREADS = ${Number(v.threads) || 30}
COMMON_SUBS = [
    "www", "mail", "ftp", "api", "dev", "staging", "test", "admin",
    "portal", "vpn", "remote", "cdn", "blog", "shop", "app", "db", "ns1", "ns2"
]

def resolve_sub(sub: str):
    fqdn = f"{sub}.{DOMAIN}"
    try:
        ip = socket.gethostbyname(fqdn)
        print(f"[+] {fqdn:30s} -> {ip}")
    except socket.gaierror:
        pass

if __name__ == "__main__":
    print(f"[*] Enumerating subdomains for {DOMAIN}...")
    with ThreadPoolExecutor(max_workers=THREADS) as ex:
        ex.map(resolve_sub, COMMON_SUBS)`,
  },
  {
    id: 'py-hash-cracker',
    title: 'أداة فحص ومطابقة الهاشات بالقاموس (Dictionary Hash Checker)',
    filename: 'hash_matcher.py',
    category: 'crypto',
    summary: 'مطابقة هاش MD5 / SHA1 / SHA256 / SHA512 مقابل قائمة كلمات مرور محلية.',
    runCommand: 'python3 hash_matcher.py',
    params: [
      { key: 'targetHash', label: 'الهاش المستهدف', defaultValue: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
      { key: 'algo', label: 'الخوارزمية (md5/sha1/sha256)', defaultValue: 'sha256' },
      { key: 'wordlist', label: 'مسار القاموس', defaultValue: '/usr/share/wordlists/rockyou.txt' },
    ],
    buildCode: (v) => `import hashlib
from pathlib import Path

TARGET_HASH = "${v.targetHash || '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'}".lower().strip()
ALGORITHM = "${v.algo || 'sha256'}".lower()
WORDLIST = "${v.wordlist || '/usr/share/wordlists/rockyou.txt'}"

def match_hash():
    if ALGORITHM not in hashlib.algorithms_available:
        raise ValueError(f"Unsupported algorithm: {ALGORITHM}")

    with Path(WORDLIST).open("rb") as f:
        for line_num, raw in enumerate(f, start=1):
            word = raw.rstrip(b"\\r\\n")
            digest = hashlib.new(ALGORITHM, word).hexdigest()
            if digest == TARGET_HASH:
                print(f"[✓] Match found at line {line_num}: {word.decode(errors='replace')}")
                return
    print("[-] No match found in wordlist.")

if __name__ == "__main__":
    match_hash()`,
  },
  {
    id: 'py-file-integrity',
    title: 'مراقب سلامة الملفات (File Integrity Monitor - SHA256)',
    filename: 'fim_monitor.py',
    category: 'crypto',
    summary: 'حساب بصمات SHA-256 لجميع ملفات مجلد حساس واكتشاف أي تعديل أو حذف أو إضافة.',
    runCommand: 'python3 fim_monitor.py',
    params: [
      { key: 'watchDir', label: 'المجلد المراقب', defaultValue: '/etc/nginx' },
      { key: 'interval', label: 'فترة الفحص (ثانية)', defaultValue: '10' },
    ],
    buildCode: (v) => `import hashlib
import time
from pathlib import Path

WATCH_DIR = Path("${v.watchDir || '/etc/nginx'}")
INTERVAL = ${Number(v.interval) || 10}

def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def snapshot(directory: Path) -> dict[str, str]:
    state = {}
    for p in directory.rglob("*"):
        if p.is_file():
            try:
                state[str(p)] = hash_file(p)
            except PermissionError:
                pass
    return state

def monitor():
    baseline = snapshot(WATCH_DIR)
    print(f"[*] Monitoring {len(baseline)} files in {WATCH_DIR}...")
    while True:
        time.sleep(INTERVAL)
        current = snapshot(WATCH_DIR)
        for path, digest in current.items():
            if path not in baseline:
                print(f"[NEW] {path}")
            elif baseline[path] != digest:
                print(f"[MODIFIED] {path}")
        for path in set(baseline) - set(current):
            print(f"[DELETED] {path}")
        baseline = current

if __name__ == "__main__":
    monitor()`,
  },
  {
    id: 'py-ssh-automator',
    title: 'أتمتة تنفيذ أوامر لينكس عبر SSH (Paramiko)',
    filename: 'ssh_exec.py',
    category: 'automation',
    summary: 'الاتصال بعدة خوادم لينكس عبر SSH وتنفيذ أوامر الفحص أو الصيانة تلقائياً.',
    pipInstall: 'pip install paramiko',
    runCommand: 'python3 ssh_exec.py',
    params: [
      { key: 'host', label: 'عنوان الخادم', defaultValue: '192.168.1.20' },
      { key: 'user', label: 'المستخدم', defaultValue: 'ubuntu' },
      { key: 'cmd', label: 'الأمر المطلوب تنفيذه', defaultValue: 'uname -a && df -h /' },
    ],
    buildCode: (v) => `import getpass
import paramiko

HOST = "${v.host || '192.168.1.20'}"
USERNAME = "${v.user || 'ubuntu'}"
COMMAND = "${v.cmd || 'uname -a && df -h /'}"

def run_remote():
    password = getpass.getpass(f"SSH password for {USERNAME}@{HOST}: ")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USERNAME, password=password, timeout=10)
        _, stdout, stderr = client.exec_command(COMMAND)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out:
            print(out)
        if err:
            print("[STDERR]", err)
    finally:
        client.close()

if __name__ == "__main__":
    run_remote()`,
  },
  {
    id: 'py-log-analyzer',
    title: 'محلل سجلات SSH وكاشف هجمات التخمين (Auth Log Analyzer)',
    filename: 'auth_log_analyzer.py',
    category: 'automation',
    summary: 'قراءة ملف /var/log/auth.log واستخراج أكثر عناوين IP التي قامت بمحاولات دخول فاشلة.',
    runCommand: 'sudo python3 auth_log_analyzer.py',
    params: [
      { key: 'logPath', label: 'مسار ملف السجل', defaultValue: '/var/log/auth.log' },
      { key: 'threshold', label: 'الحد الأدنى للتنبيه', defaultValue: '5' },
    ],
    buildCode: (v) => `import re
from collections import Counter
from pathlib import Path

LOG_PATH = Path("${v.logPath || '/var/log/auth.log'}")
THRESHOLD = ${Number(v.threshold) || 5}
FAILED_RE = re.compile(r"Failed password.*from (\\d+\\.\\d+\\.\\d+\\.\\d+)")

def analyze():
    if not LOG_PATH.exists():
        print(f"File not found: {LOG_PATH}")
        return

    counts = Counter()
    for line in LOG_PATH.read_text(errors="ignore").splitlines():
        match = FAILED_RE.search(line)
        if match:
            counts[match.group(1)] += 1

    print(f"{'Source IP':18s} | Failed Attempts")
    print("-" * 36)
    for ip, total in counts.most_common():
        if total >= THRESHOLD:
            print(f"{ip:18s} | {total}")

if __name__ == "__main__":
    analyze()`,
  },
  {
    id: 'py-http-server',
    title: 'خادم نقل ملفات سريع مع رفع ملفات (Upload/Download HTTP Server)',
    filename: 'quick_server.py',
    category: 'automation',
    summary: 'خادم ويب بايثون جاهز لمشاركة الملفات داخل الشبكة مع دعم رفع الملفات عبر POST.',
    runCommand: 'python3 quick_server.py',
    params: [
      { key: 'port', label: 'المنفذ', defaultValue: '8000' },
      { key: 'bind', label: 'واجهة الاستماع', defaultValue: '0.0.0.0' },
    ],
    buildCode: (v) => `import http.server
import socketserver
from pathlib import Path

BIND_ADDR = "${v.bind || '0.0.0.0'}"
PORT = ${Number(v.port) || 8000}

class FileHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        filename = Path(self.path.strip("/") or "uploaded.bin").name
        data = self.rfile.read(length)
        Path(filename).write_bytes(data)
        self.send_response(201)
        self.end_headers()
        self.wfile.write(f"Saved {filename} ({len(data)} bytes)\\n".encode())

if __name__ == "__main__":
    with socketserver.TCPServer((BIND_ADDR, PORT), FileHandler) as httpd:
        print(f"[*] Serving & accepting uploads on http://{BIND_ADDR}:{PORT}")
        httpd.serve_forever()`,
  },
  {
    id: 'py-socket-listener',
    title: 'مستمع Socket تفاعلي في بايثون (TCP Server)',
    filename: 'tcp_listener.py',
    category: 'network',
    summary: 'خادم TCP بسيط لإدارة جلسة طرفية أو اختبار الاتصال الشبكي بدقة.',
    runCommand: 'python3 tcp_listener.py',
    params: [
      { key: 'host', label: 'عنوان الاستماع', defaultValue: '0.0.0.0' },
      { key: 'port', label: 'المنفذ', defaultValue: '4444' },
    ],
    buildCode: (v) => `import socket

HOST = "${v.host || '0.0.0.0'}"
PORT = ${Number(v.port) || 4444}

def start_listener():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen(1)
        print(f"[*] Listening on {HOST}:{PORT}...")
        conn, addr = server.accept()
        with conn:
            print(f"[+] Connection received from {addr[0]}:{addr[1]}")
            while True:
                cmd = input("shell> ")
                if cmd.strip().lower() in {"exit", "quit"}:
                    break
                conn.sendall((cmd + "\\n").encode())
                data = conn.recv(4096).decode(errors="replace")
                print(data, end="")

if __name__ == "__main__":
    start_listener()`,
  },
  {
    id: 'py-secure-gen',
    title: 'مولد مفاتيح API وكلمات مرور مشفرة (CSPRNG Secrets)',
    filename: 'secret_keygen.py',
    category: 'crypto',
    summary: 'توليد كلمات مرور ومفاتيح JWT و Tokens آمنة باستخدام مكتبة secrets القياسية.',
    runCommand: 'python3 secret_keygen.py',
    params: [
      { key: 'length', label: 'طول كلمة المرور', defaultValue: '24' },
      { key: 'count', label: 'عدد المفاتيح', defaultValue: '5' },
    ],
    buildCode: (v) => `import secrets
import string

LENGTH = ${Number(v.length) || 24}
COUNT = ${Number(v.count) || 5}
ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"

def generate_password(length: int) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))

if __name__ == "__main__":
    print("--- Secure Passwords ---")
    for _ in range(COUNT):
        print(generate_password(LENGTH))

    print("\\n--- URL-Safe API Token (256-bit) ---")
    print(secrets.token_urlsafe(32))
    print("\\n--- Hex Secret Key ---")
    print(secrets.token_hex(32))`,
  },
];
