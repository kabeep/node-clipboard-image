import execa = require('execa');
import fs from 'fs-extra';
import pathLib from 'path';
import { SysClipboard } from '../..';

export default class DarwinClipboard implements SysClipboard {
  async read(): Promise<Buffer> {
    let path = '';

    try {
      path = pathLib.join(process.cwd(), 'temp.png');
      await fs.writeFile(path, Buffer.from([]));
      const { stderr } = await execa(`osascript`, ['-ss', pathLib.join(__dirname, 'darwinScript', 'read.applescript'), path]);

      if (stderr) {
        throw new Error(`cannot read image from clipboard error: ${stderr}`);
      }

      return await fs.readFile(path);
    } catch (error: any) {
      throw new Error(error);
    } finally {
      try {
        if (fs.existsSync(path)) {
          await fs.unlink(path);
        }
      } catch {}
    }
  }

  async write(file: string | Buffer): Promise<void> {
    let path = '';

    try {
      if (typeof file !== 'string') {
        path = pathLib.join(process.cwd(), 'temp.png');
        await fs.writeFile(path, file);
      } else {
        path = file;
      }
      const { stderr } = await execa(`osascript`, ['-ss', pathLib.join(__dirname, 'darwinScript', 'write.applescript'), path]);

      if (stderr) {
        throw new Error(`cannot write image to clipboard error: ${JSON.stringify(stderr)}`);
      }
    } catch (error: any) {
      throw new Error(error);
    } finally {
      if (typeof file !== 'string') {
        try {
          if (fs.existsSync(path)) {
            await fs.unlink(path);
          }
        } catch {}
      }
    }
  }
}
