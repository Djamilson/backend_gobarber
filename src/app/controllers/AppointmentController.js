import { parseISO, endOfDay, format, addHours } from 'date-fns';

import CancelAppointmentService from '../services/CancelAppointmentService';
import CreateAppointmentFilaService from '../services/CreateAppointmentFilaService';
import CreateAppointmentService from '../services/CreateAppointmentService';
import IndexAppointmentFilaService from '../services/IndexAppointmentFilaService';
import IndexAppointmentPorProviderService from '../services/IndexAppointmentPorProviderService';
import IndexAppointmentPorUserService from '../services/IndexAppointmentPorUserService';
import IndexAppointmentService from '../services/IndexAppointmentService';

import WebSocket from '../../websocket';

class AppointmentController {
  async index(req, res) {
    const { page } = req.query;

    const appointments = await IndexAppointmentPorUserService.run({
      page,
      user_id: req.userId,
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const { provider_id, date, status, agendar } = req.body;
    const connectedUsers = req.connectedUsers;

    const newDate = new Date(date);
    const data_ = new Date(
      newDate.valueOf() + newDate.getTimezoneOffset() * 60000
    );
    const date__ = format(data_, "yyyy-MM-dd'T'HH:mm:ssxxx");

    if (agendar) {

      await CreateAppointmentService.run({
        provider_id,
        user_id: req.userId,
        date: date__,
        status,
        agendar,
      });
    } else {
      /** se for entra na fila, ou seja  não for agendamento */

      await CreateAppointmentFilaService.run({
        provider_id,
        user_id: req.userId,
        date: date__,
        status,
        agendar,
      });
    }

    const page = 1;

    const listAppointments = await IndexAppointmentService.run({
      page,
      provider_id,
    });

    // filtrar as conexoes 'dashboard' e 'dashboard_admin'
    // filtra o prestador de serviço para atualizar os agendamentos

    //so vai enviar a mensagem se o agendameneto for para o dia ataual,
    //pois os dados que são mostrado no dashboard é somento o dia atual,
    //tenho que fazer essa validação da data

    const arrayView = [{ value: 'dashboard_admin' }];

    WebSocket.socketMessage(
      provider_id,
      arrayView,
      connectedUsers,
      listAppointments,
      'get-appointment'
    );

    return res.json(listAppointments);
  }

  async delete(req, res) {
    const { userId } = req;
    //id do appointment
    const { id } = req.params;
    const page = 1;

    const connectedUsers = req.connectedUsers;

    const appointment = await CancelAppointmentService.run({
      appointment_id: id,
      user_id: userId,
    });
console.log('Appointment::::')
    const date = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
    const parsedDate = parseISO(date);
    const endOfDayy = addHours(endOfDay(parsedDate), 3);
    const { provider_id } = appointment;

    if (appointment.date < new Date(endOfDayy)) {

      const appointments = await IndexAppointmentPorProviderService.run({
        provider_id,
      });

      if (appointments.length > 0) {
        //vou enviar o emit
        const arrayView = [{ value: 'fila' }];
        const listAppointments = await IndexAppointmentFilaService.run({
          page,
          provider_id,
          userId,
        });

        WebSocket.socketMessage(
          provider_id,
          arrayView,
          connectedUsers,
          [...listAppointments],
          'cancel'
        );
      }

      ///envia para o admin que é o provider
      const arrayViewAdmin = [{ value: 'dashboard_admin' }];
      WebSocket.socketMessage(
        provider_id,
        arrayViewAdmin,
        connectedUsers,
        {
          id,
        },
        'cancel'
      );
    }

    return res.json(appointment);
  }
}

export default new AppointmentController();
