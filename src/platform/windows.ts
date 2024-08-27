import execa from 'execa';
import fs from 'fs-extra';
import pathLib from 'path';
import { SysClipboard } from '../..';

export default class WindowsClipboard implements SysClipboard {
  async read(): Promise<Buffer> {
    let result;

    try {
      result = await execa(`${pathLib.join(__dirname, '..', '..', 'bin', 'win_clipboard.exe')}`, ['--readImage']);
    } catch {
      console.log('A try with fallback with powershell');

      result = await execa(
        `powershell -Command Add-Type -AssemblyName System.Windows.Forms; "$clip=[Windows.Forms.Clipboard]::GetImage();if ($clip -ne $null) { $converter = New-Object -TypeName System.Drawing.ImageConverter;$byte_vec = $converter.ConvertTo($clip, [byte[]]); $EncodedText =[Convert]::ToBase64String($byte_vec); return $EncodedText }"`,
      );
    }
    if (result && 'stderr' in result && result.stderr) {
      throw new Error(`cannot read image from clipboard error: ${result.stderr}`);
    }
    return Buffer.from(result.stdout, 'base64');
  }

  async write(file: string | Buffer): Promise<void> {
    let path = '';

    try {
      if (typeof file !== 'string') {
        const pathToTemp = pathLib.join(process.cwd(), 'temp.png');
        await fs.writeFile(pathToTemp, file);

        if (fs.existsSync(pathToTemp)) {
          path = pathToTemp;
        }
      } else {
        path = file;
      }

      const { stderr } = await execa(`${pathLib.join(__dirname, '..', '..', 'bin', 'win_clipboard.exe')}`, ['--writeImage', path]);

      if (stderr) {
        console.log('A try with fallback with powershell');

        const { stderr } = await execa(`powershell -Command Add-Type -AssemblyName System.Windows.Forms; "[Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${path}'));"`);

        if (stderr) {
          throw new Error(`cannot write image to clipboard error: ${stderr}`);
        }
      }
    } catch (err: any) {
      throw new Error(err.message);
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
