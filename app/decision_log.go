package app

import (
	"context"
	"encoding/json"
	"errors"
	"oma/internal/decisionlogs"
	"oma/models"
	"time"

	"github.com/rs/zerolog/log"
)

func (a *App) PushDecisionLogs(ctx context.Context, req *models.DecisionLogRequest) error {
	if req == nil {
		return errors.New("request is nil")
	}

	for _, log := range *req {
		input, err := json.Marshal(log.Input)
		if err != nil {
			return err
		}

		result, err := json.Marshal(log.Result)
		if err != nil {
			return err
		}

		var revisionID string
		for _, bundle := range log.Bundles {
			revisionID = bundle.Revision
			break
		}

		_, err = a.decisionLogRepository.CreateDecisionLog(ctx, decisionlogs.CreateDecisionLogParams{
			DecisionID: log.DecisionID,
			Path:       log.Path,
			Input:      string(input),
			Result:     string(result),
			RevisionID: &revisionID,
			Timestamp:  time.Now(),
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *App) ListDecisionLogs(ctx context.Context, search string) ([]decisionlogs.DecisionLog, error) {
	var logs []decisionlogs.DecisionLog
	var err error
	if search != "" {
		logs, err = a.decisionLogRepository.ListDecisionLogsSearch(ctx, decisionlogs.ListDecisionLogsSearchParams{
			DecisionID: "%" + search + "%",
			Path:       "%" + search + "%",
			Input:      "%" + search + "%",
			Result:     "%" + search + "%",
		})
		if err != nil {
			log.Debug().Err(err).Msg("failed to list decision logs")
			return nil, err
		}

	} else {
		logs, err = a.decisionLogRepository.ListDecisionLogs(ctx)
		if err != nil {
			log.Debug().Err(err).Msg("failed to list decision logs")
			return nil, err
		}
	}

	if len(logs) == 0 {
		return make([]decisionlogs.DecisionLog, 0), nil
	}

	return logs, nil
}
