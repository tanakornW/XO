# XO Arena Web Application

Tic-tac-toe (OX) web game with Google & Facebook login, bot opponent, and score tracking — built with Node.js and Express. Players must authenticate before playing, and results are stored in SQLite with streak bonuses and a comprehensive ranking system.

## Features

- **Multiple OAuth 2.0 Providers**: Sign in with Google or Facebook via Passport.js
- **Player vs. Bot**: Tic-tac-toe with adjustable AI difficulty for a balanced challenge
- **Score System**: 
  - +1 point for wins, -1 for losses, no change on draws
  - Win-streak bonus: three consecutive wins grant +1 extra point and reset the streak
- **Persistent Storage**: All player stats saved in SQLite (`data/xo.sqlite`)
- **Ranking System**: Players ranked by win rate, score, and total wins (Rookie → Legend)
- **Customizable Nicknames**: Change your display name in the Settings panel (defaults to `playerxxxxx`)
- **Responsive Design**: Dark neon theme optimized for desktop and mobile
- **Live Scoreboard**: View top 5 players plus your rank on the main page, or browse full rankings on a dedicated page

## Getting Started

### 1. Install dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### 2. Set environment variables

Create a `.env` file in the project root with the following values:

```ini
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# Session Secret (use a long random string)
SESSION_SECRET=replace-with-a-secure-random-string

# Port
PORT=3000
```

#### OAuth Setup:

**Google OAuth:**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a project and enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

**Facebook OAuth:**
- Go to [Facebook Developers](https://developers.facebook.com/)
- Create a new app and add "Facebook Login" product
- Add valid OAuth redirect URI: `http://localhost:3000/auth/facebook/callback`
- Add app domain: `localhost`

### 3. Run the application

Using npm:
```bash
npm start
```

Or using yarn:
```bash
yarn start
```

For development with auto-restart:
```bash
npm run dev
# or
yarn dev
```

### 4. Play the game

- Visit `http://localhost:3000`
- Sign in with your Google or Facebook account
- Challenge the bot and earn points
- View the scoreboard to compare with other players (top 5 + your rank shown on main page)
- Customize your nickname in the Settings panel
- Click "View all players" to see the full scoreboard with detailed stats



## Project Structure

```
XO/
├── data/
│   └── xo.sqlite          # SQLite database (player stats & nicknames)
├── public/
│   ├── index.html         # Main game page
│   ├── scoreboard.html    # Full scoreboard page
│   ├── app.js             # Frontend game logic
│   └── styles.css         # Dark neon theme styles
├── server.js              # Express server with OAuth & API endpoints
├── package.json           # Dependencies
├── .env                   # Environment variables (not committed)
└── README.md              # This file
```

## API Endpoints

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/facebook` - Initiate Facebook OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/facebook/callback` - Facebook OAuth callback
- `POST /auth/logout` - Sign out
- `GET /api/user` - Get current user stats (authenticated)
- `PUT /api/user/nickname` - Update nickname (authenticated)
- `POST /api/game/result` - Submit game result (authenticated)
- `GET /api/scores` - Get all player scores
- `GET /api/scores/summary` - Get top 5 + current player stats
- `GET /scoreboard` - Serve full scoreboard page

## Notes

- Player stats are saved in `data/xo.sqlite`. Delete this file to reset all scores.
- The bot difficulty is configured in `public/app.js` via `BOT_BEHAVIOUR` object.
- User IDs are prefixed with provider name (`google_xxx`, `facebook_xxx`) to avoid conflicts.
- The development server uses Express 5 with native `node --watch` available under `npm run dev`.
- Nickname validation: 3-24 characters, alphanumeric + spaces, hyphens, underscores only.
- **Win Rate Calculation**: `Wins / (Wins + Losses + Draws)` - includes all games played.




