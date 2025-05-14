import mqtt from "mqtt";

function getProtocol(settings) {
  if (settings.connectionType === "Websocket") {
    return settings.tls ? "wss" : "ws";
  }
  return settings.tls ? "mqtts" : "mqtt";
}

export async function setupMqtt(settings) {
  const client = mqtt.connect({
    protocol: getProtocol(settings),
    host: settings.url,
    port: settings.port,
    path: settings.path || "/mqtt",
    clientId: settings.clientId || `sensor-logger-client-${Math.random().toString(16).substr(2, 8)}`,
    username: settings.username == "" ? undefined : settings.username,
    password: settings.password == "" ? undefined : settings.password,
    rejectUnauthorized: settings.tls,
    connectTimeout: 4000,
  });
  let connectResolved = false;
  let timeoutId;

  const connect = new Promise((resolve, reject) => {
    client.on("connect", () => {
      clearTimeout(timeoutId);
      connectResolved = true;
      if (settings.onConnect) {
        settings.onConnect(client);
      }
      if (settings.onClose) {
        client.on("close", settings.onClose);
      }
      resolve(client);
    });
    client.on("error", (err) => {
      if (settings.onConnectionError) {
        settings.onConnectionError(client, err);
      }
      if (!connectResolved) {
        reject(err);
        disconnect(client);
      }
    });
  });

  const timeout = new Promise((_r, rej) =>
  (timeoutId = setTimeout(() => {
    rej("Connection timed out");
    if (!connectResolved) {
      disconnect(client);
    }
  }, 6000))
  );
  return Promise.race([timeout, connect]);
}

export function onMessage(client, callback) {
  client.on("message", (topic, message) => {
    // Normalise to UTF-8 string
    const payload = typeof message === "string" ? message : message.toString();
    callback(topic, payload);
  });
}

export function subscribe(client, topic, options = {}) {
  return client.subscribe(topic, options);
}

export function isConnected(client) {
  return client.connected;
}

export function disconnect(client) {
  if (client != null) {
    client.end(false);
  }
}

export function publish(client, topic, message, qos, retain) {
  client.publish(topic, message, { qos, retain });
}
