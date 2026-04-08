const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Auth Node.js — port 5000
  app.use(
    "/auth-api",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
      pathRewrite: { "^/auth-api": "" },
    })
  );

  // CheckMail Flask — port 5002
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5002",
      changeOrigin: true,
    })
  );
};
