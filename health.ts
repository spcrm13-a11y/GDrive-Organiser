// /health and the MQTT state reporter, per SMARTPLANET_APP_STANDARD.md.
//
// Two surfaces, one payload: GET /health answers it on demand, and the same
// object is published to smartplanet/telemetry/knowfind every 60s. That is the
// topic family the live listener on theguardian already consumes into
// sp_operations.Telemetry -- do not add a second topic, listener or table.
// `sp_operations.server_telemetry` died unnoticed for 134 days precisely
// because two collection paths existed and only one was watched.
//
// This app has no database, so schemaVersion is reported as null rather than a
// number: "not applicable" must not look like "schema 0".
import type { Express, Request, Response } from 'express';
import mqtt, { type MqttClient } from 'mqtt';

import { APP_VERSION } from './src/version.js';

const APP_NAME = 'knowfind';
const TELEMETRY_TOPIC = `smartplanet/telemetry/${APP_NAME}`;
const TELEMETRY_INTERVAL_MS = 60_000;

type DependencyState = 'ok' | 'degraded' | 'unconfigured' | 'down';

export interface HealthPayload {
  app: string;
  version: string;
  schemaVersion: number | null;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  reportedAt: string;
  dependencies: Record<string, { state: DependencyState; detail?: string }>;
}

let mqttClient: MqttClient | null = null;
let mqttState: DependencyState = 'unconfigured';
let mqttDetail: string | undefined = 'MQTT_HOST not set';

function buildHealth(hasApiKey: boolean): HealthPayload {
  const dependencies: HealthPayload['dependencies'] = {
    gemini: hasApiKey
      ? { state: 'ok', detail: 'GEMINI_API_KEY present' }
      : {
          state: 'unconfigured',
          detail: 'GEMINI_API_KEY missing -- classification falls back to the deterministic rules engine',
        },
    mqtt: { state: mqttState, detail: mqttDetail },
  };

  // The deterministic rules engine answers every classify request without
  // Gemini, so a missing key is degraded, not unhealthy: the app still serves.
  const states = Object.values(dependencies).map((d) => d.state);
  const status: HealthPayload['status'] = states.includes('down')
    ? 'unhealthy'
    : states.every((s) => s === 'ok')
      ? 'healthy'
      : 'degraded';

  return {
    app: APP_NAME,
    version: APP_VERSION,
    schemaVersion: null,
    status,
    uptimeSeconds: Math.round(process.uptime()),
    reportedAt: new Date().toISOString(),
    dependencies,
  };
}

export function registerHealth(app: Express, hasApiKey: boolean): void {
  app.get('/health', (_req: Request, res: Response) => {
    const payload = buildHealth(hasApiKey);
    // 200 while the app can still serve requests; only a hard dependency
    // failure answers 503, so a probe distinguishes "degraded" from "down".
    res.status(payload.status === 'unhealthy' ? 503 : 200).json(payload);
  });
}

export function startTelemetry(hasApiKey: boolean): void {
  const host = process.env.MQTT_HOST;
  if (!host) {
    // Left unconfigured on purpose in local dev. /health reports it as such,
    // so "never reported" is visible rather than looking like "healthy".
    console.warn('[telemetry] MQTT_HOST not set -- state reporting disabled');
    return;
  }

  const port = process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT, 10) : 1883;
  mqttState = 'down';
  mqttDetail = `connecting to ${host}:${port}`;

  mqttClient = mqtt.connect(`mqtt://${host}:${port}`, {
    username: process.env.MQTT_USER || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    clientId: `${APP_NAME}-${process.pid}`,
    reconnectPeriod: 10_000,
    connectTimeout: 10_000,
  });

  mqttClient.on('connect', () => {
    mqttState = 'ok';
    mqttDetail = `connected to ${host}:${port}`;
    console.log(`[telemetry] connected to ${host}:${port}, publishing ${TELEMETRY_TOPIC}`);
    publish(hasApiKey);
  });

  mqttClient.on('error', (err) => {
    mqttState = 'down';
    mqttDetail = err.message;
    console.error('[telemetry] mqtt error:', err.message);
  });

  mqttClient.on('close', () => {
    if (mqttState === 'ok') {
      mqttState = 'down';
      mqttDetail = 'connection closed';
    }
  });

  const timer = setInterval(() => publish(hasApiKey), TELEMETRY_INTERVAL_MS);
  // Do not hold the process open on this interval alone.
  timer.unref();
}

// The listener's actual payload contract, read from listener.py on theguardian
// rather than assumed: it takes the node from the topic's last segment, reads
// `ts`, and inserts one Telemetry row per entry in `metrics` -- numbers into
// `value`, everything else into `value_text`. A payload with no `metrics` key
// is dropped silently, with nothing logged anywhere, which is exactly what
// happened to the first version of this reporter.
function telemetryEnvelope(health: HealthPayload): string {
  const metrics: Record<string, string | number> = {
    status: health.status,
    version: health.version,
    uptime_seconds: health.uptimeSeconds,
    // "none" rather than 0: this app has no database, and a schema version of
    // zero would read as a real one.
    schema_version: health.schemaVersion ?? 'none',
  };
  for (const [name, dep] of Object.entries(health.dependencies)) {
    metrics[`dep_${name}`] = dep.state;
  }
  return JSON.stringify({ ts: health.reportedAt, metrics });
}

function publish(hasApiKey: boolean): void {
  if (!mqttClient?.connected) return;
  mqttClient.publish(TELEMETRY_TOPIC, telemetryEnvelope(buildHealth(hasApiKey)), { qos: 0 }, (err) => {
    if (err) console.error('[telemetry] publish failed:', err.message);
  });
}
