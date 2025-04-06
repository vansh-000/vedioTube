# 🎥 VedioTube Backend

This is the backend server for **VedioTube**, a video-sharing and social media platform that merges the experience of YouTube and Twitter. It provides RESTful APIs to handle users, videos, comments, tweets, likes, subscriptions, playlists, and dashboard analytics.

## ✨ Features

- JWT-based authentication and user management
- Video upload, update, delete, and publish/unpublish
- Tweet-style short posts with likes and user feeds
- Commenting system on videos
- Like functionality for videos, tweets, and comments
- User subscription system
- Dashboard analytics for creators
- Playlist creation and management
- Watch history tracking

---

## 📁 Project Structure

<pre>
routes/
├── user.routes.js
├── video.routes.js
├── tweet.routes.js
├── comment.routes.js
├── like.routes.js
├── subscription.routes.js
├── dashboard.routes.js
├── healthcheck.routes.js
</pre>

---

## 📌 API Endpoints

### 🧑‍💼 Users `/api/v1/users`
- `POST /register` – Register new user (supports avatar & cover image)
- `POST /login` – Login user
- `POST /logout` – Logout
- `POST /refresh-token` – Get new access token
- `GET /current-user` – Get logged-in user data
- `PATCH /update-account` – Update user details
- `POST /change-password` – Change password
- `PATCH /avatar` – Update profile picture
- `PATCH /cover-image` – Update cover image
- `GET /c/:username` – Get user’s channel profile
- `PATCH /history` – Add to watch history

---

### 📹 Videos `/api/v1/videos`
- `GET /` – Get all videos
- `POST /` – Upload a new video (video file + thumbnail)
- `GET /:videoId` – Get a single video
- `PATCH /:videoId` – Update video (thumbnail supported)
- `DELETE /:videoId` – Delete a video
- `PATCH /toggle/publish/:videoId` – Toggle video publish status

---

### 💬 Comments `/api/v1/comments`
- `GET /:videoId` – Get all comments for a video
- `POST /:videoId` – Add comment to a video
- `PATCH /c/:commentId` – Update a comment
- `DELETE /c/:commentId` – Delete a comment

---

### 🐦 Tweets `/api/v1/tweets`
- `POST /` – Create a new tweet
- `GET /user/:userId` – Get all tweets of a user
- `PATCH /:tweetId` – Edit tweet
- `DELETE /:tweetId` – Delete tweet

---

### ❤️ Likes `/api/v1/likes`
- `POST /toggle/v/:videoId` – Like/unlike a video
- `POST /toggle/c/:commentId` – Like/unlike a comment
- `POST /toggle/t/:tweetId` – Like/unlike a tweet
- `GET /videos` – Get liked videos

---

### 🔔 Subscriptions `/api/v1/subscriptions`
- `GET /c/:channelId` – Get channels a user is subscribed to
- `POST /c/:channelId` – Subscribe/unsubscribe
- `GET /u/:subscriberId` – Get subscribers of a user

---

### 📊 Dashboard `/api/v1/dashboard`
- `GET /stats` – Get channel stats
- `GET /videos` – Get all videos of current user

---

### 📋 Playlists (to be added) `/api/v1/playlists`
- `POST /` – Create new playlist
- `GET /:playlistId` – Get a playlist
- `PATCH /:playlistId` – Edit playlist
- `DELETE /:playlistId` – Delete playlist
- `PATCH /add/:videoId/:playlistId` – Add video to playlist
- `PATCH /remove/:videoId/:playlistId` – Remove video
- `GET /user/:userId` – Get user's playlists

---

### ❤️ Healthcheck `/api/v1/healthcheck`
- `GET /` – Simple healthcheck endpoint

---

## 🔐 Authentication

Most routes are protected using `verifyJWT` or `validateJWT` middleware. Tokens must be included in headers for authenticated routes.

---

## 🧑 Author

**Vansh Verma**  
📧 Email: [23165@iiitu.ac.in](mailto:23165@iiitu.ac.in)  
💼 LinkedIn: [vansh-verma-07932a27b](https://www.linkedin.com/in/vansh-verma-07932a27b)  
💻 GitHub: [vansh-000](https://github.com/vansh-000)

---

## 📌 Note

Make sure to set up your `.env` file with proper variables as in the `.env.sample`
