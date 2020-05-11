import { parseISO, startOfDay, format, addHours } from 'date-fns';

import Appointment from '../models/Appointment';

const { Op } = require('sequelize');

/*
function sortList(listAppointments) {
  const newDate = new Date();

  const listAgenda = listAppointments
    .filter(p => {
      if (p.agendar === true && p.date <= newDate) return p;
    })
    .sort(appoint => {
      if (appoint.date <= newDate) return 1;
      return -1;
    });

  const listRest = listAppointments.filter(p => {
    if (p.agendar !== true) return p;
    if (p.agendar === true && p.date > newDate) return p;
  });

  return listAgenda.concat(listRest);
}
*/
class IndexAppointmentPorProviderService {
  async run({ provider_id }) {

    const date = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);
    const startOfDayy = addHours(startOfDay(parsedDate), 3);

    const appointments = await Appointment.findAll({
      where: {
        provider_id,
        canceled_at: null,
        [Op.or]: [{ status: 'ATENDENDO' }, { status: 'AGUARDANDO' }],
        date: {
          [Op.gte]: startOfDayy,
        },
      },
      order: ['date'],
      attributes: [
        'id',
        'date',
        'past',
        'cancelable',
        'status',
        'agendar',
        'user_id',
        'provider_id',
      ],
    });

    return appointments;
  }
}
export default new IndexAppointmentPorProviderService();
