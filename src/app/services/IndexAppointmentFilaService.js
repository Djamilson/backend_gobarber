import { parseISO, startOfDay, endOfDay, addHours, format } from 'date-fns';
import User from '../models/User';
import Appointment from '../models/Appointment';
// import Cache from '../../lib/Cache';
import SortListAppointment from './SortListAppointment';
import File from '../models/File';

const { Op } = require('sequelize');

class IndexAppointmentFilaService {
  async run({ page, provider_id, userId }) {

    const date = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);

    const initDate = addHours(startOfDay(parsedDate), 3);
    const finallyDate = addHours(endOfDay(parsedDate),3);

    const listAppointments = await Appointment.findAll({
      where: {
        provider_id,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.between]: [initDate, finallyDate],
        },
      },
      order: [['date', 'ASC'], ['agendar', 'ASC']],
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

    const appointmentss = SortListAppointment.run(listAppointments);

    const cc = appointmentss.map((a, ind) => {
      const {
        agendar,
        cancelable,
        date: data,
        id,
        provider,
        user_id,
        status,
      } = a;

      const index = ind + 1;
      return {
        agendar,
        cancelable,
        data,
        id,
        provider,
        status,
        index,
        user_id,
      };
    });

    const appointments = cc
      .filter(a => {
        const { user_id } = a;

        if (user_id === Number(userId)) {
          return a;
        }
      })
      .filter(x => {
        if (x !== undefined) return x;
        return '';
      });

    return appointments;
  }
}
export default new IndexAppointmentFilaService();
