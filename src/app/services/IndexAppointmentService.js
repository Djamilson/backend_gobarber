import { parseISO, startOfDay, endOfDay, addHours, format } from 'date-fns';

import User from '../models/User';
import Appointment from '../models/Appointment';
import SortListAppointment from './SortListAppointment';

import File from '../models/File';

import { Op } from 'sequelize';

class IndexAppointmentService {
  async run({ page, provider_id }) {
    const date = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);

    const initDate = addHours(startOfDay(parsedDate), 3);
    const finallyDate = addHours(endOfDay(parsedDate), 3);

    const listAppointments = await Appointment.findAll({
      where: {
        provider_id,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.between]: [initDate, finallyDate],
        },
      },
      order: [
        ['date', 'ASC'],
        ['agendar', 'ASC'],
      ],
      attributes: [
        'id',
        'date',
        'past',
        'cancelable',
        'status',
        'user_id',
        'provider_id',
        'agendar',
      ],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'user',
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

    const appointments = SortListAppointment.run(listAppointments)
      .map((a, index) => {
        const {
          agendar,
          cancelable,
          date: data,
          id,
          provider,
          user,
          status,
        } = a;

        return {
          agendar,
          cancelable,
          data,
          id,
          provider,
          user,
          status,
          index,
        };
      })
      .filter(x => (x !== undefined ? x : ''));

    return appointments;
  }
}
export default new IndexAppointmentService();
