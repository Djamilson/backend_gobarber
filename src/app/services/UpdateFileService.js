import File from '../models/File';
import sharp from 'sharp';
import pathlocal from 'path';
import fs from 'fs';
import deletefiles3 from '../util/deletefiles3';

class UpdateFileService {
  async run({
    id_file,
    name,
    path,
    key,
    destination,
    location,
    filePath,
    file,
  }) {
    const fileExist = await File.findByPk(id_file, {
      attributes: ['id', 'name', 'path'],
    });

    if (!fileExist) {
      throw new Error('Image not exists.');
    }

    if (process.env.LOCAL_DOS_ARQUIVOS === 'local') {
      await sharp(filePath)
        .resize(500)
        .jpeg({ quality: 50 })
        .toFile(pathlocal.resolve(destination, 'resized', path));
      // remove os arquivo da pasta, arquivos velhos
      fs.unlinkSync(filePath);
    }

    const { path: pathDelete } = fileExist;
    const newKeyDelete = pathDelete.replace('-original', '').trim();

    const { id: _id, name: _name, path: _path, url } = await fileExist.update({
      name,
      path: key,
    });

    await deletefiles3(process.env.BUCKET_NAME, newKeyDelete);

    return { _id, _name, _path, url };
  }
}
export default new UpdateFileService();
