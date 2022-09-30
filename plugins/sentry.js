const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const fp = require('fastify-plugin')

module.exports = fp(async (app, options) => {
    Sentry.init({
        dsn: "https://b27987cf6afc415a98f87f059f8e1e9d@o1431023.ingest.sentry.io/6781987",
  integrations:[
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV,
        defaultIntegrations: false,
    });

    Sentry.configureScope((scope) => {
        scope.addEventProcessor((event) => {
            const traceData = event.contexts?.trace?.data;
            if (!traceData) {
                return event;
            }
            const { user } = traceData;
            if (user) {
                event.user = {
                    id: user.uid,
                    username: user.upn,
                    email: user.upn,
                    ip_address: user.ip,
                    ...event.user,
                };
            }
            const { request } = traceData;
            if (request) {
                event.request = {
                    method: request.method,
                    ...event.request,
                };
            }

            return event;
        });
    });

    app.decorateRequest("sentryTx", null);

    app.addHook("onRequest", (request, _reply, done) => {
        request.sentryTx = Sentry.startTransaction({
            name: `${request.method} ${request.url}`,
            op: "http.server",
            description: "HTTP request",
        });
        request.sentryTx.setData("request", { method: request.method });
        done();
    });

    app.addHook("onResponse", (request, reply, done) => {
        request.sentryTx.setHttpStatus(reply.statusCode);
        request.sentryTx.finish();
        done();
    });
});