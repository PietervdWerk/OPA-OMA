// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: query.sql

package playgroundlogs

import (
	"context"
	"time"
)

const createPlaygroundLog = `-- name: CreatePlaygroundLog :one
INSERT INTO playground_logs (
  id, input, policy, result, coverage, timestamp
) VALUES (
  ?, ?, ?, ?, ?, ?
)
RETURNING id, input, policy, result, coverage, timestamp
`

type CreatePlaygroundLogParams struct {
	ID        string    `json:"id"`
	Input     string    `json:"input"`
	Policy    string    `json:"policy"`
	Result    string    `json:"result"`
	Coverage  string    `json:"coverage"`
	Timestamp time.Time `json:"timestamp"`
}

func (q *Queries) CreatePlaygroundLog(ctx context.Context, arg CreatePlaygroundLogParams) (PlaygroundLog, error) {
	row := q.db.QueryRowContext(ctx, createPlaygroundLog,
		arg.ID,
		arg.Input,
		arg.Policy,
		arg.Result,
		arg.Coverage,
		arg.Timestamp,
	)
	var i PlaygroundLog
	err := row.Scan(
		&i.ID,
		&i.Input,
		&i.Policy,
		&i.Result,
		&i.Coverage,
		&i.Timestamp,
	)
	return i, err
}

const getPlaygroundLog = `-- name: GetPlaygroundLog :one
SELECT id, input, policy, result, coverage, timestamp FROM playground_logs
WHERE id = ? LIMIT 1
`

func (q *Queries) GetPlaygroundLog(ctx context.Context, id string) (PlaygroundLog, error) {
	row := q.db.QueryRowContext(ctx, getPlaygroundLog, id)
	var i PlaygroundLog
	err := row.Scan(
		&i.ID,
		&i.Input,
		&i.Policy,
		&i.Result,
		&i.Coverage,
		&i.Timestamp,
	)
	return i, err
}

const listPlaygroundlogs = `-- name: ListPlaygroundlogs :many
SELECT id, input, policy, result, coverage, timestamp FROM playground_logs
ORDER BY "timestamp" DESC
`

func (q *Queries) ListPlaygroundlogs(ctx context.Context) ([]PlaygroundLog, error) {
	rows, err := q.db.QueryContext(ctx, listPlaygroundlogs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PlaygroundLog
	for rows.Next() {
		var i PlaygroundLog
		if err := rows.Scan(
			&i.ID,
			&i.Input,
			&i.Policy,
			&i.Result,
			&i.Coverage,
			&i.Timestamp,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
