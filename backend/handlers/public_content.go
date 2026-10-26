package handlers

import "casadelrey/backend/models"

// PublicAuthor is an editorial identity, never an account/contact record.
type PublicAuthor struct {
	ID   uint   `json:"ID"`
	Name string `json:"name"`
}
type PublicPost struct {
	models.Post
	Author PublicAuthor `json:"author"`
}
type PublicAnnouncement struct {
	models.Announcement
	Author PublicAuthor `json:"author"`
}

func publicPost(post models.Post) PublicPost {
	return PublicPost{Post: post, Author: PublicAuthor{ID: post.Author.ID, Name: post.Author.Name}}
}
