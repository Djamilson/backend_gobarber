import { parseISO, startOfDay, addHours, format } from 'date-fns';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Cache from '../../lib/Cache';

import File from '../models/File';

const { Op } = require('sequelize');

class IndexAppointmentPorUserService {
  async run({ page, user_id }) {

    const newDate = new Date();
    const data_ = new Date(
      newDate.valueOf() + newDate.getTimezoneOffset() * 60000
    );
    const date = format(data_, "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);

    // const offsett = newDate.getTimezoneOffset();
    // const timeZoneLocal = offsett / 60;
    const startOfDayy = addHours(startOfDay(parsedDate), 3);

    const appointments = await Appointment.findAll({
      where: {
        user_id,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.gte]: startOfDayy,
        },
      },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable', 'status', 'agendar'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return appointments;
  }

  async appointmentComUser({ page, user_id }) {
    /*
    Check if provider_id is a provider
    */

    const cachekey = `user:${user_id}:appointments:${page}`;
    const cached = await Cache.get(cachekey);

    if (cached) {
      return res.json(cached);
    }

    const date = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);
    const startOfDayy = addHours(startOfDay(parsedDate), 3);

    const appointments = await Appointment.findAll({
      where: {
        user_id,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.gte]: startOfDayy,
        },
      },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable', 'status', 'agendar'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
        },
      ],
    });

    await Cache.set(cachekey, appointments);

    return appointments;
  }
}
export default new IndexAppointmentPorUserService();
