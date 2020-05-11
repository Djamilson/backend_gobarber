import 'dotenv/config';
import * as Sentry from '@sentry/node';
import cors from 'cors';
// import helmet from 'helmet';
// limitar as requisições
/*
import redis from 'redis';
import RateLimit from 'express-rate-limit';
import RateLimitRedis from 'rate-limit-redis';
*/
import express from 'express';
import path from 'path';
import Youch from 'youch';
import 'express-async-errors';

import socket_io from 'socket.io';
import http from 'http';
import routes from './routes';
import sentryConfig from './config/sentry';
import WebSocket from './websocket';

import './database';

class App {
  constructor() {
    this.appExpress = express();
    this.server = http.Server(this.appExpress);

    WebSocket.setupWebsocket(this.server);

    this.corS();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  corS() {
    this.appExpress.use(Sentry.Handlers.requestHandler());
    // this.appExpress.use(cors({ origin: false }));
    if (process.env.NODE_ENV === 'development') {
      this.appExpress.use(cors());
    } else {
      //   this.appExpress.use(helmet());
      this.appExpress.use(
        cors({
          origin: process.env.FRONT_URL,
        })
      );
    }
  }

  listUser() {
    this.appExpress.use(async (req, res, next) => {
      req.connectedUsers = await WebSocket.buscaConectado();
      return next();
    });
  }

  middlewares() {
    this.listUser();
    this.appExpress.use(express.json());
    this.appExpress.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads', 'resized'))
    );
    // limita as requisições
    /*
    this.server.use(
      new RateLimit({
        store: new RateLimitRedis({
          client: redis.createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
          }),
        }),
        windowMs: 1000 * 60 * 15,
        max: 100,
      })
    ); */
  }

  routes() {
    this.appExpress.use(routes);
    this.appExpress.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.appExpress.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json(err);
      }
      return res.status(500).json({ error: 'Internal server error' });
    });
  }
}

export default new App().server;
