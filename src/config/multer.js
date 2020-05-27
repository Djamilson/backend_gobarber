const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

import aws from 'aws-sdk';
import multerS3 from 'multer-sharp-s3';
import slug from '../app/util/slug';

import { basename, extname } from 'path';

const storageTypes = {
  local: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) return cb(err);

        const { originalname } = file;
        const baseName = slug(basename(originalname, extname(originalname)));
        const extensao = originalname.split('.').pop();

        const fileName = `${baseName}.${extensao}`;

        file.key = `${hash.toString('hex')}_${fileName}`;

        cb(null, file.key);
      });
    },
  }),
  s3: multerS3({
    s3: new aws.S3(),
    Bucket: process.env.BUCKET_NAME,
    Key: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);
        const { originalname } = file;
        const baseName = slug(basename(originalname, extname(originalname)));
        const extensao = originalname.split('.').pop();

        const fileName = `uploads/${hash.toString('hex')}_${baseName}`;

        cb(null, fileName);
      });
    },
    resize: [
      { suffix: 'xlg', width: 1200 },
      { suffix: 'lg', width: 800 },
      { suffix: 'md', width: 500 },
      { suffix: 'sm', width: 300 },
      { suffix: 'xs', width: 100 },
      { suffix: 'original' },
    ],
    fit: 'inside',
    multiple: true,
    rotate: null,
    normalize: true,
    toFormat: {
      type: 'jpeg',
      options: {
        progressive: true,
        quality: 90,
      },
    },
  }),
};

const getStorage = () => {
  if (process.env.LOCAL_DOS_ARQUIVOS == 'local') {
    return process.env.STORAGE_TYPE_LOCAL;
  }
  return process.env.STORAGE_TYPE_S3;
};

module.exports = {
  dest: path.resolve(__dirname, '..', '..', 'tmp', 'uploads', 'resized'),

  //storage: storageTypes['s3'],
  //storage: storageTypes['local'],
  //storage: storageTypes[process.env.STORAGE_TYPE_LOCAL],

  storage: storageTypes[getStorage()],

  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/gif',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'));
    }
  },
};
