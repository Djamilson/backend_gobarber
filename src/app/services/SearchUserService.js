import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';
import User from '../models/User';

class SearchUserService {
  async run({ userId }) {
    const newUser = await User.findByPk(userId, {
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
      id: user_id,
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

    const user = {
      user: {
        id: user_id,
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
    };

    return user;
  }
}
export default new SearchUserService();
