import Cache from './lib/SocketRedis';
import socket_io from 'socket.io';

class WebSocket {
  constructor() {
    this.io;
  }

  async buscaConectado() {
    return await Cache.allKey(`conect`);
  }

  setupWebsocket(server) {
    this.io = socket_io(server);

    this.io.on('connection', async socket => {
      const { idUser, view, idDevice } = socket.handshake.query;
      const socketID = socket.id;

      const mont = { idUser, socketID, value: view, idDevice };
      const cachekeyIO = `conect:${idUser}:${idDevice}`;

      //se existir chave invaida
      await Cache.invalidate(cachekeyIO);
      // salva o dados no redis
      await Cache.set(cachekeyIO, mont);
    });

    this.io.on('disconnect', data => {});
  }

  findConnections(idUser, arrayView, connectedUsers) {
    return connectedUsers.filter(connection => {
      return (
        Number(idUser) === Number(connection.idUser) &&
        arrayView.some(v => v.value === connection.value)
      );
    });
  }

  //esta sendo usada AppointProviderController
  //para enviar mensagem para os admin caso estaja logado em
  //em mais de uma máquina ao mesmo tempo
  findConnectionsAdmin(idUser, idDevice, connectedUsers) {
    return connectedUsers.filter(connection => {
      return (
        Number(idUser) === Number(connection.idUser) &&
        idDevice !== connection.idDevice
      );
    });
  }

  //para atualizar os dados caso o usuário esteja com mais de uma sessão
  //chama essa função quando o usuario estive com mais de uma sessão aberta
  // para enviar a mensagem para a sessão diferente da que enviou a mensage
  async socketMessageAdmin(
    user_id,
    idDevice,
    connectedUsers,
    appointment,
    acaoMessage
  ) {
    //id => id do appointment
    //user_id => do usuário
    const sendSocketMessageTo = await this.findConnectionsAdmin(
      user_id,
      idDevice,
      connectedUsers
    );

    if (sendSocketMessageTo) {
      this.sendMessage(sendSocketMessageTo, acaoMessage, appointment);
    }
  }

  //function é chamanda no AppointmentController no store, craição
  //function é chamanda no AppointmentFinallyController
  //chamada quand vai fazer a finalização do atendimento

  async socketMessage(user_id, arrayView, connectedUsers, data, messageSend) {
    //user_id => do usuário

    const sendSocketMessageTo = await this.findConnections(
      user_id,
      arrayView,
      connectedUsers
    );

    this.sendMessage(sendSocketMessageTo, messageSend, data);
  }

  //sera chamdado somente se o usuário estiver na view de fila
  async socketMessageFila(
    user_id,
    arrayView,
    connectedUsers,
    data,
    messageSend
  ) {
    const sendSocketMessageTo = await this.findConnections(
      user_id,
      arrayView,
      connectedUsers
    );
   
    this.sendMessage(sendSocketMessageTo, messageSend, data);
  }

  sendMessage(to, message, data) {
    to.forEach(connection => {
      this.io.to(connection.socketID).emit(message, data);
    });
  }
}

export default new WebSocket();
