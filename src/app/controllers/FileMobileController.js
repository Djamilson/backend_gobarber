import sharp from 'sharp';
import pathlocal from 'path';
import fs from 'fs';
import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';
import User from '../models/User';

import CreateFileService from '../services/CreateFileService';
import UpdateFileService from '../services/UpdateFileService';
import SearchUserService from '../services/SearchUserService';

function removeDir(nameFile) {
  return nameFile
    .replace('uploads/', '')
    .replace('-original', '')
    .trim();
}

class FileMobileController {
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

    const userExist = await User.findByPk(userId);
    await userExist.update({ userExist, avatar_id: file._id });
    const user = await SearchUserService.run({ userId });

    return res.json(user);
  }

  async update(req, res) {
    console.log();

    const { id } = req.params;
    const { userId } = req;

    const { originalname: name } = req.file;
    const {
      filename: path,
      key,
      destination,
      Location: location,
      path: filePath,
    } = req.file.original;

    const newPath = removeDir(key);

    const file = await UpdateFileService.run({
      id_file: id,
      name,
      path,
      key: newPath,
      destination,
      location,
      filePath,
      file: req.file,
    });

    const userExist = await User.findByPk(userId);
    await userExist.update({ userExist, avatar_id: file._id });

    const user = await SearchUserService.run({ userId });

    return res.json(user);
  }
}

export default new FileMobileController();
