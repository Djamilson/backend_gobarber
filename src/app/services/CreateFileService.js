import File from '../models/File';
import sharp from 'sharp';
import pathlocal from 'path';
import fs from 'fs';

class CreateFileService {
  async run({ name, path, key, destination, location, filePath }) {

    if (process.env.LOCAL_DOS_ARQUIVOS === 'local') {
      await sharp(filePath)
        .resize(500)
        .jpeg({ quality: 50 })
        .toFile(pathlocal.resolve(destination, 'resized', path));
      // remove os arquivo da pasta, arquivos velhos
      fs.unlinkSync(filePath);
    }

    const { id: _id, name: _name, path: _path, url } = await File.create({
      name,
      path: key,
    });

    return { _id, _name, _path, url };
  }
}
export default new CreateFileService();
