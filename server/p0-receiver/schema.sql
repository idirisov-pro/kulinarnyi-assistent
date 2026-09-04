CREATE TABLE IF NOT EXISTS p0_events (
  event_id Utf8 NOT NULL,
  event_name Utf8 NOT NULL,
  occurred_at Utf8 NOT NULL,
  server_received_at Utf8 NOT NULL,
  install_id Utf8 NOT NULL,
  session_id Utf8 NOT NULL,
  app_version Utf8 NOT NULL,
  payload_json Utf8 NOT NULL,
  PRIMARY KEY (event_id)
);
