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

    console.log('File:::: ', req.file);

    const newPath = key.replace('uploads/', '').trim();
    const file = await CreateFileService.run({
      name,
      path: newPath,
      key,
      destination,
      location,
      filePath,
    });

    console.log('Chegou');
    const userExist = await User.findByPk(userId);
    await userExist.update({ userExist, avatar_id: file._id });
    const user = await SearchUserService.run({ userId });

    return res.json(user);
    /*
    const newUser = await User.findByPk(req.userId, {
      attributes: [
        'id',
        'name',
        'email',
        'provider',
        'is_verified',
        'status',
        'admin_master',
        'privacy',
        'last_login_at',
        'avatar_id',
        'company_id',
        'created_at',
      ],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: GroupUser,
          as: 'group_users',
          attributes: ['id'],
          include: [
            {
              model: Group,
              as: 'group',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
      ],
    });

    const {
      id,
      name: userName,
      email,
      avatar,
      provider,
      is_verified,
      status,
      company_id,
      group_users,
      privacy,
      last_login_at,
      created_at,
    } = newUser;

    return res.json({
      user: {
        id,
        name: userName,
        email,
        avatar,
        provider,
        is_verified,
        status,
        company_id,
        group_users,
        privacy,
        last_login_at,
        created_at,
      },
    });*/
  }

  async update(req, res) {
    console.log();

    const { id } = req.params;
    const { userId } = req;

    const {
      originalname: name,
      filename: path,
      key,
      destination,
      location,
      path: filePath,
    } = req.file;

    console.log('==', id);
    console.log('== req.file: ', req.file);

    const file = await UpdateFileService.run({
      id_file: id,
      name,
      path,
      key,
      destination,
      location,
      filePath,
    });

    const userExist = await User.findByPk(userId);
    await userExist.update({ userExist, avatar_id: file._id });

    const user = await SearchUserService.run({ userId });

    return res.json(user);
  }
}

export default new FileMobileController();
