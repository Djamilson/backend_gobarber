import { parseISO, startOfDay, addHours, format } from 'date-fns';

import User from '../models/User';
import Appointment from '../models/Appointment';
import SortListAppointment from './SortListAppointment';

const { Op } = require('sequelize');
import Cache from '../../lib/Cache';

import File from '../models/File';

class IndexAppointmentPorUserService {
  async run({ page, pageSize, querywhere }) {
    const newDate = new Date();
    const data_ = new Date(
      newDate.valueOf() + newDate.getTimezoneOffset() * 60000
    );
    const date = format(data_, "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);

    // const offsett = newDate.getTimezoneOffset();
    // const timeZoneLocal = offsett / 60;
    const startOfDayy = addHours(startOfDay(parsedDate), 3);

    const ret = await Appointment.findAndCountAll({
      where: {
        ...querywhere,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.gte]: startOfDayy,
        },
      },
    });

    console.log('Total:', ret.count);
    const pages = Math.ceil(ret.count / pageSize);

    const appointmentInfo = { page, pages, total: ret.count, limit: pageSize };

    const appointments = await Appointment.findAll({

     where: {
        ...querywhere,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.gte]: startOfDayy,
        },
      },

      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable', 'status', 'agendar'],

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

    return { appointments, appointmentInfo };
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
