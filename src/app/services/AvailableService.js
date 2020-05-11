import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
  addHours,
  subHours,
} from 'date-fns';

import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import Horario from '../models/Horario';

class AvailableService {
  async run({ provider_id, date, user_id }) {
    //data para fazer os teste no banco
    const newDate = new Date(date);

    const startOfDayy = addHours(startOfDay(date), 3);
    const endOfDayy = addHours(endOfDay(date), 3);

    const appointmentList = await Appointment.findAll({
      where: {
        provider_id,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDayy, endOfDayy],
        },
      },
    });

    const newAppointmentList = appointmentList.map(appoint => {
      const newDataAppointment = appoint.dataValues.date;

      return {
        ...appoint.dataValues,
        date: new Date(
          new Date(
            newDataAppointment.valueOf() -
              newDataAppointment.getTimezoneOffset() * 60000
          )
        ),
      };
    });

    const schedule = await Horario.findAll({
      where: {
        user_id,
        canceled_at: null,
      },
      order: ['horario'],
      attributes: ['id', 'horario'],
    });

    const available = schedule.map(time => {
      const [hour, minute] = time.horario.split(':');
      const value = setSeconds(setMinutes(setHours(date, hour), minute), 0);

      const soDate = format(newDate, 'yyyy-MM-dd');

      const stringDate = `${soDate}T${time.horario}:00`;
      const datFinla = new Date(stringDate);

      const addTime = addHours(datFinla, 3);
      const montaData = format(addTime, "yyyy-MM-dd'T'HH:mm");

      const menos = subHours(new Date(), 3);

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available:
          isAfter(value, menos) &&
          !newAppointmentList.find(a => {
            return format(a.date, "yyyy-MM-dd'T'HH:mm") === montaData;
          }),
      };
    });

    return available;
  }
}

export default new AvailableService();
