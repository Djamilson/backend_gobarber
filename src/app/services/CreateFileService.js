import File from '../models/File';
import sharp from 'sharp';
import pathlocal from 'path';
import fs from 'fs';
import { basename, extname } from 'path';

class CreateFileService {
  async run({ name, path, key, destination, location, filePath }) {
    console.log('2 req.file:::::::', name, path, key, destination, location, filePath);

    let newPath = '';

    if (process.env.LOCAL_DOS_ARQUIVOS === 'local') {
      await sharp(filePath)
        .resize(500)
        .jpeg({ quality: 50 })
        .toFile(pathlocal.resolve(destination, 'resized', path));
      // remove os arquivo da pasta, arquivos velhos
      fs.unlinkSync(filePath);
      newPath = key;
    } else {
      console.log('Finalll 4 location:::::::', location);
      const newPath = (key.replace('uploads/', '')).replace('-original', '');
    }

    console.log('name:::::::', name);
    console.log('Finalll 4 req.file:::::::', newPath);

    const { id: _id, name: _name, path: _path, url } = await File.create({
      name,
      path: key,
    });

    return { _id, _name, _path, url };
  }
}
export default new CreateFileService();
