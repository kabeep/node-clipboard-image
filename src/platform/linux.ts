import execa = require('execa');
import fs from 'fs-extra';
import pathLib from 'path';
import { SysClipboard } from '../..';

export default class LinuxClipboard implements SysClipboard {
  async read(): Promise<Buffer> {
    const { stdout, stderr } = await execa('xclip -selection clipboard -t image/png -o | base64', { shell: true });

    if (stderr) {
      throw new Error(`cannot read image from clipboard error: ${stderr}`);
    }

    return Buffer.from(stdout, 'base64');
  }

  async write(file: string | Buffer): Promise<void> {
    let path = '';

    if (typeof file !== 'string') {
      const pathToTemp = pathLib.join(process.cwd(), 'temp.png');
      await fs.writeFile(pathToTemp, file);

      if (fs.existsSync(pathToTemp)) {
        path = pathToTemp;
      } else {
        throw new Error("Temp file wasn't created");
      }
    } else {
      path = file;
    }

    const { stdout, stderr } = await execa(`file -b --mime-type '${path}'`, {
      shell: true,
    });

    if (stderr) {
      throw new Error(`cannot read file by path ${file}`);
    }

    try {
      await execa(`xclip -selection clipboard -t ${stdout} -i ${path}`, {
        stdio: 'inherit',
        shell: true,
      });
    } catch (error: any) {
      throw new Error(`cannot write image to clipboard error: ${error.message}`);
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
