import app from './app';

app.listen(process.env.PORT || 3000, () => {
  // const ip = require('ip');
  // console.log(ip.address());
   console.log('Started at http://localhost:%d');
});
