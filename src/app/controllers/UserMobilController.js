import { Op } from 'sequelize';

import crypto from 'crypto';
import { isAfter, addDays, startOfSecond } from 'date-fns';
import * as Yup from 'yup';

import Queue from '../../lib/Queue';
import ActivationContaMailAWS from '../jobs/ActivationContaMailAWS';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';
import Token from '../models/Token';
import User from '../models/User';

async function mudaStatusToken(user, idToken) {
  const { id } = user;

  const tokenAll = await Token.findAll({
    where: {
      id: {
        [Op.ne]: [idToken], // this will update all the records
      },
      user_id: id,
      status: false,
    },
  });

  const listRetorn = tokenAll.map(p => p.id);

  await Token.update(
    {
      status: true,
    },
    {
      where: {
        id: listRetorn, // with an id from the list
      },
    }
  );
}

async function criarToken(user) {
  const { id } = user;
  const token = await Token.create({
    user_id: id,
    expires: addDays(new Date(), 1),
  });
  const { code_active } = token;
  await Queue.add(ActivationContaMailAWS.key, {
    user,
    code_active,
  });

  return token;
}

class UserMobilController {
  async index(req, res) {
    const { email } = req.body.data;

    const userExists = await User.findOne({ where: { email } });
    if (!userExists) {
      return res.status(401).json({ error: 'User not exists.' });
    }

    const { is_verified } = userExists;

    return res.status(200).json({ is_verified });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      privacy: Yup.bool().required(),
      password: Yup.string()
        .required()
        .min(1),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(401).json({ error: 'User already exists.' });
    }

    const role_user = 'role_usuario';
    const groupExists = await Group.findOne({
      where: { name: role_user },
    });

    if (!groupExists) {
      return res
        .status(402)
        .json({ error: 'Não foi possível encontrar o grupo para associar.' });
    }

    const { name: nam, email: ema, password, privacy: mobalprivacy } = req.body;

    const user = await User.create({
      name: nam,
      email: ema,
      privacy: mobalprivacy,
      password,
    });

    await GroupUser.create({
      user_id: user.id,
      group_id: groupExists.id,
    });

    const { id, name, email, is_verified, status, privacy } = user;

    // Create a verification token for this user

    const { code_active } = await Token.create({
      user_id: id,
      expires: addDays(new Date(), 1),
    });

    await Queue.add(ActivationContaMailAWS.key, {
      user,
      code_active,
    });

    return res.json({
      id,
      name,
      email,
      is_verified,
      status,
      privacy,
      code_active,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      code_active: Yup.string().min(4),
    });

    if (!(await schema.isValid(req.body.data))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { email, code_active } = req.body.data;

    const userExist = await User.findOne({ where: { email } });

    if (!userExist) {
      return res.status(401).json({ error: 'User not exist' });
    }

    const tokenExist = await Token.findOne({
      where: { user_id: userExist.id, code_active, status: false },
    });

    // Make sure the user has been verified

    if (!tokenExist) {
      return res.status(402).json({ error: 'Token not exist' });
    }

    const hourStart = startOfSecond(new Date(tokenExist.expires));

    if (!isAfter(hourStart, new Date())) {
      return res.status(403).json({
        error: 'Token expirado, gere novo token, em recuperar senha!',
      });
    }

    await userExist.update({ is_verified: true });
    await tokenExist.update({ status: true });

    return res.status(200).json({
      msg: `Conta ativada com sucesso!`,
    });
  }

  async newPassword(req, res) {
    const schema = Yup.object().shape({
      password: Yup.string().min(1),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body.data))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { token, password } = req.body.data;
    const tokenExist = await Token.findByPk(token.id);
    const { user_id, expires, status } = tokenExist;

    // Make sure the user has been verified

    if (!tokenExist) {
      return res.status(403).json({
        error: 'Esse token não existe, crei um novo token!',
      });
    }

    if (tokenExist && status === true) {
      return res.status(402).json({
        error: 'Token inválido, já foi usado, crie novo Token!',
      });
    }

    const hourStart = startOfSecond(new Date(expires));

    if (!isAfter(hourStart, new Date())) {
      return res.status(404).json({
        error: 'Token expirado, gere novo token, em recuperar senha!',
      });
    }

    const userExist = await User.findByPk(user_id);

    if (!tokenExist && !userExist) {
      return res.status(401).json({
        error: 'Não foi possível encontra um usuário para esse token!',
      });
    }

    await userExist.update({ password });
    await tokenExist.update({ status: true });

    return res.status(200).json({
      msg:
        'Nova senha cadastrada com sucesso, já pode acessar a área restrita!',
    });
  }

  async newToken(req, res) {
    const { email } = req.body.data;
    const userExists = await User.findOne({ where: { email } });

    if (!userExists) {
      return res.status(401).json({ error: 'User not exists.' });
    }
    //muda todos os token para o status true

    mudaStatusToken(userExists, '');
    const token = criarToken(userExists);
    return res.status(200).json(token);
  }

  async newCodeActive(req, res) {
    const { email } = req.body.data;
    const userExists = await User.findOne({ where: { email } });

    if (!userExists) {
      return res.status(401).json({ error: 'User not exists.' });
    }

    const tokenExists = await Token.findOne({
      where: { user_id: userExists.id, status: false },
    });

    // Make sure the user has been verified

    if (!tokenExists) {
      //muda todos os token para o status true
      mudaStatusToken(userExists, tokenExists.id);
      const newtoken = criarToken(userExists);
      return res.status(200).json(newtoken);
      // se token não existir cria um novo token
    }

    const hourStart = startOfSecond(new Date(tokenExists.expires));

    if (tokenExists && !isAfter(hourStart, new Date())) {
      //muda todos os token para o status true
      mudaStatusToken(userExists, tokenExists.id);
      const newtoken = criarToken(userExists);
      return res.status(200).json(newtoken);
      // se já experiou criar um novo token
    }

    if (tokenExists.status) {
      mudaStatusToken(userExists, tokenExists.id);
      const newtoken = criarToken(userExists);
      return res.status(200).json(newtoken);
      // se já foi usado criar um novo token
    }

    const new_code_active = await crypto.randomBytes(2).toString('hex');

    const newToken = await tokenExists.update({
      code_active: new_code_active,
    });
    const { code_active } = newToken;

    await Queue.add(ActivationContaMailAWS.key, {
      user: userExists,
      code_active,
    });

    return res.status(200).json(newToken);
  }
}

export default new UserMobilController();
