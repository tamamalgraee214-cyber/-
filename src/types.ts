export type ActiveSection =
  | 'nmap'
  | 'linux'
  | 'python'
  | 'platforms'
  | 'crypto'
  | 'network'
  | 'vault';

export interface VaultItem {
  id: string;
  title: string;
  category: 'nmap' | 'linux' | 'python' | 'shell' | 'custom';
  content: string;
  notes?: string;
  createdAt: string;
}

export interface NmapPreset {
  id: string;
  name: string;
  subtitle: string;
  scanType: string;
  flags: string[];
  timing: string;
  portMode: 'default' | 'top' | 'fast' | 'all' | 'custom';
  customPorts?: string;
  topPortsCount?: string;
  scripts: string[];
}

export interface NmapFlag {
  flag: string;
  label: string;
  description: string;
  group: 'scan' | 'discovery' | 'detection' | 'evasion' | 'output';
  requiresRoot?: boolean;
}

export interface NseScript {
  name: string;
  category: 'vuln' | 'discovery' | 'auth' | 'http' | 'smb' | 'ssl' | 'brute';
  description: string;
}

export type LinuxToolCategory =
  | 'all'
  | 'network'
  | 'web'
  | 'sysadmin'
  | 'files'
  | 'security'
  | 'forensics';

export interface ToolParam {
  key: string;
  label: string;
  defaultValue: string;
  placeholder: string;
}

export interface ToolCommandExample {
  title: string;
  description: string;
  template: string;
  sudo?: boolean;
}

export interface LinuxTool {
  id: string;
  name: string;
  category: Exclude<LinuxToolCategory, 'all'>;
  summary: string;
  installCmd: string;
  params: ToolParam[];
  examples: ToolCommandExample[];
}

export type PythonCategory =
  | 'all'
  | 'network'
  | 'web'
  | 'crypto'
  | 'automation';

export interface PythonScriptParam {
  key: string;
  label: string;
  defaultValue: string;
}

export interface PythonScript {
  id: string;
  title: string;
  filename: string;
  category: Exclude<PythonCategory, 'all'>;
  summary: string;
  pipInstall?: string;
  runCommand: string;
  params: PythonScriptParam[];
  buildCode: (values: Record<string, string>) => string;
}

export interface PortInfo {
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  service: string;
  description: string;
  securityNote: string;
  nmapScript?: string;
}
