import { expect } from 'chai';
import { clipboard } from '../index';
import path from 'path';
import sizeOf from 'buffer-image-size';
import sizeOfImage from 'image-size';
import fs from 'fs-extra';

describe('Read text from clipboard', () => {
  it('Write read to file image clipboard', async () => {
    const pathToTestPic = path.join(process.cwd(), 'tests', 'data', 'tempPic.png');
    const sizeTestPic = sizeOfImage(pathToTestPic);

    await clipboard.write(pathToTestPic);
    const bufferReadPic = await clipboard.read();

    const sizeReadPic = sizeOfImage(bufferReadPic);

    expect(JSON.stringify(sizeTestPic)).to.be.equal(JSON.stringify(sizeReadPic));
  });

  it('Write read to buffer image clipboard', async () => {
    const pathToTestPic = path.join(process.cwd(), 'tests', 'data', 'tempPic.png');

    const bufferTempPic = await fs.readFile(pathToTestPic);
    const sizeTestPic = sizeOf(bufferTempPic);

    await clipboard.write(bufferTempPic);
    const bufferReadPic = await clipboard.read();

    const sizeReadPic = sizeOf(bufferReadPic);

    expect(JSON.stringify(sizeTestPic)).to.be.equal(JSON.stringify(sizeReadPic));
  });
});
