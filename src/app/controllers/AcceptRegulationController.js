import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';
import User from '../models/User';

import SearchUserService from '../services/SearchUserService';

class AcceptRegulationController {
  async store(req, res) {
    const { newPrivacy } = req.body;
    const { userId } = req;

    const userExists = await User.findByPk(userId);

    if (!userExists) {
      return res.status(401).json({ error: 'User not exists.' });
    }

    await userExists.update({ privacy: newPrivacy });

    const user = await SearchUserService.run({ userId });

    return res.json(user);
  }
}

export default new AcceptRegulationController();
