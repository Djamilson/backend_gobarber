import { Op } from 'sequelize';
import User from '../models/User';
import File from '../models/File';

import Cache from '../../lib/Cache';

class ProviderController {
  async index(req, res) {
    //usuario master do sistema, não pode lista
    const master_admin = process.env.MASTER_USUARIO;
    const cached = await Cache.get('providers');

    if (cached) {
      return res.json(cached);
    }

    const providers = await User.findAll({
      where: {
        provider: true,
        email: {
          [Op.ne]: master_admin,
        },
      },

      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ],
    });

    
    await Cache.set('providers', providers);
    return res.json(providers);
  }
}
export default new ProviderController();
