// Vercel invokes this handler per request; Nest and its database pool are reused by warm instances.
const { createApplication } = require('./dist/main.js');

let application;
let applicationPromise;

module.exports = async function handler(request, response) {
  if (!applicationPromise) {
    applicationPromise = createApplication().then((app) => {
      application = app;
      return app;
    });
  }

  try {
    const app = application || await applicationPromise;
    return app.getHttpAdapter().getInstance()(request, response);
  } catch {
    applicationPromise = undefined;
    console.error('API could not initialize. Check database and environment configuration.');
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json');
    return response.end(JSON.stringify({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível.' } }));
  }
};
