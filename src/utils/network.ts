export interface SubnetResult {
  ip: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
  ipClass: string;
  scope: string;
  ipBinary: string;
  maskBinary: string;
}

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const val = Number(part);
    if (val < 0 || val > 255) return null;
    num = (num << 8) | val;
  }
  return num >>> 0;
}

function intToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

function intToBinaryDots(num: number): string {
  return [
    ((num >>> 24) & 255).toString(2).padStart(8, '0'),
    ((num >>> 16) & 255).toString(2).padStart(8, '0'),
    ((num >>> 8) & 255).toString(2).padStart(8, '0'),
    (num & 255).toString(2).padStart(8, '0'),
  ].join('.');
}

export function calculateSubnet(ipInput: string, cidrInput: number): SubnetResult | null {
  const ipInt = ipToInt(ipInput);
  if (ipInt === null || cidrInput < 0 || cidrInput > 32) return null;

  const maskInt = cidrInput === 0 ? 0 : (0xffffffff << (32 - cidrInput)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalAddresses = Math.pow(2, 32 - cidrInput);
  let usableHosts = totalAddresses - 2;
  let firstHostInt = networkInt + 1;
  let lastHostInt = broadcastInt - 1;

  if (cidrInput === 32) {
    usableHosts = 1;
    firstHostInt = networkInt;
    lastHostInt = networkInt;
  } else if (cidrInput === 31) {
    usableHosts = 2;
    firstHostInt = networkInt;
    lastHostInt = broadcastInt;
  }

  const firstOctet = (ipInt >>> 24) & 255;
  const secondOctet = (ipInt >>> 16) & 255;

  let ipClass = 'A';
  if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D (Multicast)';
  else if (firstOctet >= 240) ipClass = 'E (Reserved)';

  let scope = 'عام (Public IP)';
  if (
    firstOctet === 10 ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168)
  ) {
    scope = 'شبكة خاصة (Private RFC 1918)';
  } else if (firstOctet === 127) {
    scope = 'حلقة محلية (Loopback)';
  } else if (firstOctet === 169 && secondOctet === 254) {
    scope = 'ربط محلي (APIPA / Link-Local)';
  } else if (firstOctet === 100 && secondOctet >= 64 && secondOctet <= 127) {
    scope = 'نطاق CGNAT (RFC 6598)';
  }

  return {
    ip: intToIp(ipInt),
    cidr: cidrInput,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstHost: intToIp(firstHostInt >>> 0),
    lastHost: intToIp(lastHostInt >>> 0),
    totalAddresses,
    usableHosts: Math.max(0, usableHosts),
    ipClass,
    scope,
    ipBinary: intToBinaryDots(ipInt),
    maskBinary: intToBinaryDots(maskInt),
  };
}
