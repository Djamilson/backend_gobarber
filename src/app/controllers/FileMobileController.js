import User from '../models/User';

import CreateFileService from '../services/CreateFileService';
import UpdateFileService from '../services/UpdateFileService';
import SearchUserService from '../services/SearchUserService';

import removerNameDiretorio from '../util/removerNameDiretorio';

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

    const newKey = removerNameDiretorio(key);

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

    const newPath = removerNameDiretorio(key);;

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
