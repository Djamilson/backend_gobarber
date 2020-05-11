import * as Yup from 'yup';

import sharp from 'sharp';
import pathlocal from 'path';
import fs from 'fs';
import File from '../models/File';
import User from '../models/User';

import Finance from '../models/Finance';

class FinanceController {
  async index(req, res) {
    const { id } = req.params;
    const financeExists = await Finance.findAll({
      where: { company_id: id },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
      order: [['date']],
    });

    return res.json(financeExists);
  }

  async store(req, res) {
    // const { originalname: name, filename: path } = req.file;
    const { priceFloat: price, company_id, date } = req.body;

    const { originalname: name, filename: path } = req.file;

    await sharp(req.file.path)
      .resize(500)
      .jpeg({ quality: 70 })
      .toFile(pathlocal.resolve(req.file.destination, 'resized', path));
    // remove os arquivo da pasta, arquivos velhos
    fs.unlinkSync(req.file.path);

    const file = await File.create({ name, path });

    await Finance.create({
      price,
      avatar_id: file.id,
      company_id,
      date,
    });

    return res
      .status(200)
      .json({ success: 'Comprovante cadastrado com sucesso!' });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(1),
      password: Yup.string()
        .min(1)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await user.update(req.body);

    const { id, name, avatar, status, is_verified } = await User.findByPk(
      req.userId,
      {
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      }
    );
    return res.json({
      id,
      name,
      email,
      avatar,
      status,
      is_verified,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const financeExist = await Finance.findByPk(id);

    if (!financeExist) {
      return res
        .status(400)
        .json({ error: 'Não foi possível remover esse comprovante.' });
    }

    await financeExist.destroy({ force: true });

    return res.status(200).json();
  }
}

export default new FinanceController();
