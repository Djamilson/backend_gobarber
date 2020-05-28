import sharp from 'sharp';
import pathlocal from 'path';
import fs from 'fs';
import File from '../models/File';
import { basename, extname } from 'path';
import slug from '../util/slug';
import CreateFileService from '../services/CreateFileService';

function removeDir(nameFile) {
  return nameFile
    .replace('uploads/', '')
    .replace('-original', '')
    .trim();
}

class FileController {
  async store(req, res) {
    const { userId } = req;
    const { originalname: name } = req.file;
    const {
      filename: path,
      key,
      destination,
      Location: location,
      path: filePath,
    } = req.file.original;

    const newKey = removeDir(key);

    const file = await CreateFileService.run({
      name,
      path,
      key: newKey,
      destination,
      location,
      filePath,
    });

    return res.json(file);
  }

  async update(req, res) {
    const { originalname, location } = req.file;

    let newPath = '';
    let path;
    let name = slug(basename(originalname, extname(originalname))).concat(
      '.jpg'
    );

    if (process.env.STORAGE_TYPE === 's3') {
      newPath = `${basename(location, extname(location))}.jpg`;
    }

    if (process.env.STORAGE_TYPE !== 's3') {
      const oldFile = `${req.file.destination}/resized/${path_logo}`;
      // remove os arquivo da pasta, arquivos velhos
      fs.unlinkSync(oldFile);

      await sharp(req.file.path)
        .resize(500)
        .jpeg({ quality: 70 })
        .toFile(pathlocal.resolve(req.file.destination, 'resized', path));

      // remove os arquivo da pasta, arquivos velhos
      fs.unlinkSync(req.file.path);
    }

    const file = await File.findByPk(id);

    const fileRetorn = await file.update({ name, path: newPath });

    const { id: _id, name: _name, path: _path, url } = fileRetorn;

    return res.json({ _id, _name, _path, url });
  }
}

export default new FileController();
