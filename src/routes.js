import { Router } from 'express';
import multer from 'multer';
import Brute from 'express-brute';
import BruteRedis from 'express-brute-redis';
import multerConfig from './config/multer';

import UserMobilController from './app/controllers/UserMobilController';
import UserController from './app/controllers/UserController';
import UserAvatarController from './app/controllers/UserAvatarController';

import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import authMiddleware from './app/middlewares/auth';
import AppointmentController from './app/controllers/AppointmentController';
import AppointmentFilaController from './app/controllers/AppointmentFilaController';
import AppointmentProviderController from './app/controllers/AppointmentProviderController';

import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';
import HorarioController from './app/controllers/HorarioController';

import TokenController from './app/controllers/TokenController';
import RecoverPasswordController from './app/controllers/RecoverPasswordController';

import CompanyController from './app/controllers/CompanyController';

import GroupController from './app/controllers/GroupController';
import GroupUserController from './app/controllers/GroupUserController';
import CadCompanyUserController from './app/controllers/CadCompanyUserController';
import CadCompanyController from './app/controllers/CadCompanyController';
import FileMobileController from './app/controllers/FileMobileController';

import CompanyFileController from './app/controllers/CompanyFileController';
import CompanyUserController from './app/controllers/CompanyUserController';
import FinanceController from './app/controllers/FinanceController';
import PrivacyController from './app/controllers/PrivacyController';
import AppointmentFinallyController from './app/controllers/AppointmentFinallyController';
import validateUserStore from './app/validators/UserStore';
import validateUserUpdate from './app/validators/UserUpdate';
import validateSessionStore from './app/validators/SessionStore';
import validateAppointmentsStore from './app/validators/AppointmentStore';

import AcceptRegulationController from './app/controllers/AcceptRegulationController';

const handle = require('express-async-handler');

const routes = new Router();
const upload = multer(multerConfig);
/*
const bruteStore = new BruteRedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});
const bruteForce = new Brute(bruteStore);
*/
/**
 * criar user
 */

routes.post('/users', validateUserStore, UserController.store);
routes.post('/usersmobil', UserMobilController.store);

/**
 * validar email do user
 *
 */

routes.get('/confirmation/:token', TokenController.index);
routes.get('/mobile/active_account/:email', TokenController.show);
routes.put('/proccess_active_account', UserMobilController.update);

routes.get(
  '/mobile/valida_code_forget_password/:email',
  TokenController.validaCode
);
routes.put(
  '/proccess_active_account/new_code_active',
  UserMobilController.newCodeActive
);

routes.get('/mobile/user/:email', UserMobilController.index);
routes.put('/forget/new_password', UserMobilController.newPassword);

routes.get('/mobile/forget_password', TokenController.index);
routes.post('/forgetpassword/mobile', RecoverPasswordController.store);


routes.post(
  '/sessions',
  /* bruteForce.prevent, */
  validateSessionStore,
  SessionController.store
);

routes.get('/', (req, res) => res.send('Essa rota e para fazer teste! ok'));

routes.use(authMiddleware);

routes.put('/users', validateUserUpdate, UserController.update);
routes.put('/usersavatar', UserAvatarController.update);
routes.put('/privacy', PrivacyController.update);

routes.put('/accept_regulation', AcceptRegulationController.store);

routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/available', AvailableController.index);

routes.post('/horarios', HorarioController.store);
routes.get('/horarios', HorarioController.index);

routes.put('/horarios/:id', HorarioController.update);

routes.get('/appointments/:providerId/fila', AppointmentFilaController.index);
routes.get('/appointments/provider', AppointmentProviderController.index);

routes.get('/appointments', AppointmentController.index);
routes.post(
  '/appointments',
  validateAppointmentsStore,
  AppointmentController.store
);
//quando iniciar o atendimento do cliente
routes.get(
  '/appointment/:appointmentId/provider',
  AppointmentProviderController.update
);
routes.get(
  '/appointment/:appointmentId/finally',
  AppointmentFinallyController.update
);

//sera usando quando o cancelamento for feito pelo user
routes.delete('/appointments/:id', AppointmentController.delete);
routes.get('/schedule', ScheduleController.index);
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.get('/companies', CompanyController.index);
routes.get('/companyperfil/:cod_company', CadCompanyUserController.index);
routes.put('/companies', CadCompanyUserController.update);
routes.get('/empresas', CadCompanyController.index);
routes.put('/companyfiles', CompanyFileController.update);

routes.post(
  '/companies',
  handle(CadCompanyController.store),
  handle(CadCompanyUserController.store),
  handle(CompanyController.store)
);

routes.get('/companies/user', CompanyUserController.index);
routes.get('/companies/user/:id', CompanyUserController.index);

routes.get('/users/:id', UserController.index);
routes.put('/companies/user/:id', CompanyUserController.update);

routes.get('/groups', GroupController.index);
routes.post('/groups', GroupController.store);

routes.post('/groups/users', GroupUserController.store);
routes.put('/groups/users/edit', GroupUserController.update);

routes.get('/finances/:id', FinanceController.index);
routes.post('/finances', upload.single('file'), FinanceController.store);
routes.put('/finances', FinanceController.store);
routes.delete('/finances/:id', FinanceController.delete);

routes.post('/files', upload.single('file'), FileMobileController.store);
routes.put('/files', upload.single('file'), FileMobileController.update);

//atualiza foto do perfil no mobil
routes.post('/files/mobile', upload.single('file'), FileMobileController.store);
routes.put('/files/:id', upload.single('file'), FileMobileController.update);

export default routes;
