import DarwinClipboard from './src/platform/darwin';
import LinuxClipboard from './src/platform/linux';
import WindowsClipboard from './src/platform/windows';

export interface SysClipboard {
  read(): Promise<Buffer>;
  write(file: string | Buffer): Promise<void>;
}

export const clipboard: SysClipboard = (() => {
  switch (process.platform) {
    case 'darwin':
      return new DarwinClipboard();
    case 'win32':
      return new WindowsClipboard();
    case 'linux':
      return new LinuxClipboard();
    default:
      throw new Error('unsupported os');
  }
})();
