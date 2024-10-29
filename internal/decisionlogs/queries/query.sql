-- name: GetDecisionLog :one
SELECT * FROM decision_logs
WHERE decision_id = ? LIMIT 1;

-- name: ListDecisionLogs :many
SELECT * FROM decision_logs
ORDER BY "timestamp" DESC;

-- name: ListDecisionLogsSearch :many
SELECT * FROM decision_logs
WHERE decision_id LIKE ? OR path LIKE ? OR input LIKE ? OR result LIKE ?
ORDER BY "timestamp" DESC;

-- name: CreateDecisionLog :one
INSERT INTO decision_logs (
  decision_id, path, input, revision_id, result, timestamp
) VALUES (
  ?, ?, ?, ?, ?, ?
)
RETURNING *;