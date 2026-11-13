package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"mangahub-backend-go/config"

	"github.com/gofiber/fiber/v2"
)

const aniListEndpoint = "https://graphql.anilist.co"

type aniListResponse struct {
	Data struct {
		Page struct {
			PageInfo struct {
				HasNextPage bool `json:"hasNextPage"`
			} `json:"pageInfo"`
			Media []struct {
				ID    int `json:"id"`
				Title struct {
					English string `json:"english"`
					Romaji  string `json:"romaji"`
					Native  string `json:"native"`
				} `json:"title"`
				Description string `json:"description"`
				CoverImage  struct {
					Large string `json:"large"`
				} `json:"coverImage"`
				AverageScore *int     `json:"averageScore"`
				Chapters     *int     `json:"chapters"`
				Status       string   `json:"status"`
				Genres       []string `json:"genres"`
			} `json:"media"`
		} `json:"Page"`
	} `json:"data"`
}

const aniListSyncQuery = `query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(type: MANGA, isAdult: false, sort: POPULARITY_DESC) {
      id title { english romaji native } description(asHtml: false)
      coverImage { large } averageScore chapters status genres
    }
  }
}`

// SyncAniList imports popular manga pages into Supabase. Protect this endpoint as admin.
func SyncAniList(c *fiber.Ctx) error {
	var body struct {
		Pages int `json:"pages"`
	}
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).JSON(fiber.Map{"message": "Invalid request body"})
		}
	}
	if body.Pages == 0 {
		body.Pages = 1
	}
	if body.Pages < 1 || body.Pages > 20 {
		return c.Status(400).JSON(fiber.Map{"message": "pages must be between 1 and 20"})
	}

	client := &http.Client{Timeout: 20 * time.Second}
	inserted := 0
	for page := 1; page <= body.Pages; page++ {
		payload, _ := json.Marshal(map[string]any{"query": aniListSyncQuery, "variables": map[string]int{"page": page, "perPage": 50}})
		req, err := http.NewRequestWithContext(c.Context(), http.MethodPost, aniListEndpoint, bytes.NewReader(payload))
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"message": "Could not create AniList request"})
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			return c.Status(502).JSON(fiber.Map{"message": "AniList request failed", "error": err.Error()})
		}
		var result aniListResponse
		decodeErr := json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK || decodeErr != nil {
			return c.Status(502).JSON(fiber.Map{"message": "AniList returned an invalid response", "status": resp.StatusCode})
		}

		for _, m := range result.Data.Page.Media {
			title := m.Title.English
			if title == "" {
				title = m.Title.Romaji
			}
			if title == "" {
				title = m.Title.Native
			}
			if title == "" {
				title = "Untitled"
			}
			genres := strings.Join(m.Genres, ", ")
			status := strings.ReplaceAll(strings.ToLower(m.Status), "_", " ")
			if status == "" {
				status = "unknown"
			}
			var score *float64
			if m.AverageScore != nil {
				v := float64(*m.AverageScore) / 10
				score = &v
			}
			_, err := config.DB.Exec(context.Background(), `INSERT INTO mangas (anilist_id,title,genre,status,synopsis,cover_url,score,chapters)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
				ON CONFLICT (anilist_id) DO UPDATE SET title=EXCLUDED.title,genre=EXCLUDED.genre,status=EXCLUDED.status,
				synopsis=EXCLUDED.synopsis,cover_url=EXCLUDED.cover_url,score=EXCLUDED.score,chapters=EXCLUDED.chapters`,
				m.ID, title, genres, status, m.Description, m.CoverImage.Large, score, m.Chapters)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"message": "Could not save AniList manga", "error": err.Error()})
			}
			inserted++
		}
		if !result.Data.Page.PageInfo.HasNextPage {
			break
		}
	}
	return c.JSON(fiber.Map{"message": "AniList sync complete", "processed": inserted, "pages": body.Pages})
}
