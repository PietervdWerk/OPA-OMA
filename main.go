package main

import (
	"context"
	"oma/app"
	"oma/contract"
	"oma/internal/config"
	internalDb "oma/internal/db"
	"oma/internal/decisionlogs"
	"oma/internal/opa"
	"oma/internal/playgroundlogs"
	"oma/internal/revision"
	"oma/transport/http"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/vrischmann/envconfig"

	_ "modernc.org/sqlite"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	ctx := context.Background()
	conf := &config.Config{}
	if err := envconfig.Init(&conf); err != nil {
		log.Fatal().Err(err).Msg("initializing environment variables")
	}

	if err := conf.Validate(); err != nil {
		log.Fatal().Err(err).Msg("invalid configuration")
	}

	log.Info().Msg("Loaded configuration")

	zerolog.SetGlobalLevel(conf.LogLevel)
	db, err := internalDb.InitInMemoryDatabase(ctx)
	if err != nil {
		log.Fatal().Err(err).Msg("initializing database")
	}

	decisionLogRepository := decisionlogs.New(db)
	playgroundLogRepository := playgroundlogs.New(db)

	var revisionRepository contract.RevisionRepository
	switch conf.RevisionConfig.Type {
	case contract.RevisionTypeGitlabPackages:
		revisionRepository = revision.NewGitlabPackagesRevisionRepository(&conf.RevisionConfig.GitlabPackages)
	case contract.RevisionTypeOCI:
		revisionRepository, err = revision.NewOCIRevisionRepository(&conf.RevisionConfig.OCI)
		if err != nil {
			log.Fatal().Err(err).Msg("initializing revision repository")
		}
	}

	opaExecutable, err := opa.Download(conf.OpaDownloadUrl)
	if err != nil {
		log.Fatal().Err(err).Msg("downloading opa")
	}
	opaService := opa.New(opaExecutable)

	err = internalDb.Migrate(ctx, db, decisionLogRepository, playgroundLogRepository)
	if err != nil {
		log.Fatal().Err(err).Msg("migrating database")
	}

	log.Info().Msgf("Started listening on port %d", conf.Transport.HTTP.Port)

	app := app.New(conf, decisionLogRepository, playgroundLogRepository, opaService, revisionRepository)
	server := http.New(&conf.Transport.HTTP, app)
	if err := server.Run(); err != nil {
		log.Fatal().Err(err).Msg("running server")
	}
}
