import { join } from 'node:path';
import { downloadFile } from './util.js';

const downloadDir = join(import.meta.dirname, './images');

await downloadFile(
  'https://github.com/copy/v86/raw/refs/heads/master/bios/seabios.bin',
  join(downloadDir, 'seabios.bin')
);

await downloadFile(
  'https://i.copy.sh/linux4.iso',
  join(downloadDir, 'linux4.iso')
);
