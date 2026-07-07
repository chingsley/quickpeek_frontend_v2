const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const BACKEND_PORT = 3000;

const shouldProxyToBackend = (url) =>
  url.startsWith('/api/v1') || url.startsWith('/socket.io');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const path = req.url?.split('?')[0] ?? '';

      if (!shouldProxyToBackend(path)) {
        return middleware(req, res, next);
      }

      const proxyReq = http.request(
        {
          hostname: '127.0.0.1',
          port: BACKEND_PORT,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: `127.0.0.1:${BACKEND_PORT}`,
          },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on('error', (error) => {
        if (!res.headersSent) {
          res.statusCode = 502;
          res.end(`Backend unavailable: ${error.message}`);
        }
      });

      req.pipe(proxyReq);
    };
  },
};

module.exports = config;
