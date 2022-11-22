import execa = require('execa');
import fs from 'fs-extra';
import pathLib from 'path';
import { SysClipboard } from '../..';

export default class DarwinClipboard implements SysClipboard {
  async readFiles(): Promise<Array<string>> {
    const files = await this.readText();

    if (files) {
      const isPathExist = files.split(' ').every((f) => {
        return fs.existsSync(f);
      });
      return isPathExist ? files.split(' ') : [];
    }
    return [];
  }

  async pasteFiles(action: 'Copy', destinationFolder: string, ...files: Array<string>): Promise<void> {
    await this.writeFiles(...files);

    if (action === 'Copy') {
      const { stderr } = await execa('pbpaste', {
        stripFinalNewline: false,
        cwd: destinationFolder,
      });
      if (stderr) {
        throw new Error(`cannot read text error: ${stderr}`);
      }
    }
  }

  async writeFiles(...files: string[]): Promise<boolean> {
    const { stderr } = await execa('osascript', ['-ss', pathLib.join(__dirname, 'darwinScript', 'pbadd.applescript'), ...files]);

    if (stderr) {
      throw new Error(`cannot read text error: ${JSON.stringify(stderr)}`);
    }
    return true;
  }

  async readText(): Promise<string> {
    const { stdout, stderr } = await execa('pbpaste', {
      stripFinalNewline: false,
    });
    if (!stdout) {
      throw new Error(`cannot read text error: ${stderr}`);
    }
    return stdout;
  }

  async writeText(text: string): Promise<void> {
    const { stderr } = await execa('pbcopy', {
      input: text,
      env: {
        LC_CTYPE: 'UTF-8',
      },
    });
    if (stderr) {
      throw new Error(`cannot write text due to clipboard error: ${stderr}`);
    }
  }

  async readImage(file?: string): Promise<Buffer> {
    const path = file ? file : `${pathLib.join(process.cwd(), 'temp.png')}`;
    await fs.writeFile(path, Buffer.from([]));

    const { stderr } = await execa(`osascript -e set d to the clipboard as «class PNGf» set fid to open for access "${path}" with write permission write d to fid close access fid`);

    if (stderr) {
      throw new Error(`cannot read image from clipboard error: ${stderr}`);
    }
    try {
      const bufferFile = await fs.readFile(path);

      return bufferFile;
    } catch {
      return Buffer.from([]);
    } finally {
      if (!file) {
        try {
          if (fs.existsSync(path)) {
            await fs.unlink(path);
          }
        } catch {}
      }
    }
  }

  async writeImage(file: string | Buffer): Promise<void> {
    let path = '';

    if (typeof file !== 'string') {
      path = pathLib.join(process.cwd(), 'temp.png');
      await fs.writeFile(pathLib.join(process.cwd(), 'temp.png'), file);
    } else {
      path = file;
    }
    const { stderr } = execa(`osascript -e 'set the clipboard to (read (POSIX file "${path}") as PNGf picture)'`);

    if (stderr) {
      throw new Error(`cannot write image to clipboard error: ${JSON.stringify(stderr)}`);
    }

    if (typeof file !== 'string') {
      try {
        if (fs.existsSync(path)) {
          await fs.unlink(path);
        }
      } catch {}
    }
  }
}
