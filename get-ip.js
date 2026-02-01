const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interface = interfaces[interfaceName];
    for (const config of interface) {
      if (!config.internal && config.family === 'IPv4') {
        return config.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();
console.log(localIP);