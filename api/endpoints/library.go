package endpoints

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"junie/helpers"
	"junie/models"
)

func fillGames(system *models.System) {
	var regex = regexp.MustCompile(` \(.*\)`)
	var settings = helpers.GetSettings()

	path := path.Join(settings.Resources.Games, system.Name)
	games, err := ioutil.ReadDir(path)
	if err != nil {
		return
	}

	for i := range games {

		name := games[i].Name()
		if strings.HasSuffix(name, ".png") {
			continue
		}

		name = strings.TrimSuffix(name, filepath.Ext(name))

		system.Games = append(system.Games, models.Game{
			Name:  regex.ReplaceAllString(name, ""),
			Rom:   name + "." + system.Extension,
			Cover: "covers/" + system.Name + "/" + name + ".png",
		})

	}

}

func SendLibrary(w http.ResponseWriter, r *http.Request) {

	systems, err := helpers.GetSystems()
	if err != nil {
		log.Panic(err)
	}

	for i := range systems {
		fillGames(&systems[i])
	}

	library, err := json.Marshal(systems)
	if err != nil {
		log.Panic(err)
	}

	w.Header().Add("Content-Type", "application/json")
	w.Write(library)
}
