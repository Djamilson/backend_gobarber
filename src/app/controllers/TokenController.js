import * as Yup from 'yup';
import { isAfter, addDays, startOfSecond } from 'date-fns';

import Queue from '../../lib/Queue';
import ActivationContaMail from '../jobs/ActivationContaMailAWS';

import Token from '../models/Token';
import User from '../models/User';

class TokenController {
  async show(req, res) {
    const { email } = req.query;
    const userExists = await User.findOne({ where: { email } });
    const { id: user_id } = userExists;

    // Make sure the user has been verified

    if (!userExists) {
      return res.status(404).json({
        error: 'Esse usuário não existe, crie uma conta!',
      });
    }

    if (userExists.is_verified) {
      return res.status(401).json({
        error: 'Este email já foi verificado!',
      });
    }

    const tokenExists = await Token.findOne({ where: { user_id } });

    if (!tokenExists) {
      return res.status(402).json({
        error: 'Não foi possível encontra um token!',
      });
    }

    const { token } = tokenExists;

    return res.status(200).json({
      token,
    });
  }

  async validaCode(req, res) {
    const { email } = req.params;
    const userExists = await User.findOne({ where: { email } });
    const { id: user_id } = userExists;
    // Make sure the user has been verified

    if (!userExists) {
      return res.status(404).json({
        error: 'Esse usuário não existe, crie uma conta!',
      });
    }

    const tokenExists = await Token.findOne({
      where: { user_id, status: false },
    });

    // Make sure the user has been verified

    if (!tokenExists) {
      return res.status(404).json({
        error: 'Esse token não existe, crie um novo token!',
      });
    }
    const hourStart = startOfSecond(new Date(tokenExists.expires));

    if (!isAfter(hourStart, new Date())) {
      return res.status(403).json({
        error: 'Token expirado, gere novo token, em recuperar senha!',
      });
    }

    return res.status(200).json(tokenExists);
  }

  async index(req, res) {
    const { email } = req.query;

    const userExists = await User.findOne({
      attributes: ['id'],
      where: { email },
    });

    if (!userExists) {
      return res.status(400).json({
        error: 'Esse usuário não existe, crie uma conta!',
      });
    }

    const { id: user_id } = userExists;
    // Make sure the user has been verified

    const tokenExists = await Token.findOne({
      where: { user_id, status: false },
    });

    // Make sure the user has been verified

    if (!tokenExists) {
      return res.status(401).json({
        error: 'Esse token não existe, crie um novo token!',
      });
    }
    const hourStart = startOfSecond(new Date(tokenExists.expires));

    if (!isAfter(hourStart, new Date())) {
      return res.status(402).json({
        error: 'Token expirado, gere um novo token!',
      });
    }

    return res.status(200).json(tokenExists);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      password: Yup.string().min(1),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body.data))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { token } = req.body;

    const tokenExists = await Token.findOne({ where: { token } });

    if (!tokenExists) {
      return res.status(400).json({
        error: 'Faça uma nova solicitação, esse token não está válido!',
      });
    }
    const user = await User.findByPk(tokenExists.user_id);

    await user.update(req.body.data);

    await Token.update(
      { status: true, tokenExists },
      { where: { id: tokenExists.id } }
    );

    return res.json({
      msg: `Nova senha cadastrada com sucesso, já pode acessar a área restrita!`,
    });
  }

  async store(req, res) {
    const { email } = req.params;
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
    });

    if (await schema.isValid(email)) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email } });

    if (!userExists) {
      return res
        .status(401)
        .json({ error: 'Email não foi encontrado, crie sua conta!' });
    }

    // Create a verification token for this user
    const { id, token } = await Token.create({
      user_id: userExists.id,
      expires: addDays(new Date(), 1),
    });

    await User.update(
      { token_id: id, userExists },
      { where: { id: userExists.id } }
    );

    // const { host } = req.headers;
    const host = process.env.FRONT_URL;

    const link = `${host}/confirmation/${token}`;

    await Queue.add(ActivationContaMail.key, { userExists, link });

    return res.json({
      msg: `Token criado com sucesso, acessa o ${userExists.email} e ative sua conta!`,
    });
  }
}

export default new TokenController();
