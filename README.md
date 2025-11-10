# XO Arena Web Application

Tic-tac-toe (OX) web game with Google sign-in, bot opponent, and score tracking — built with Node.js and Express. Players must authenticate with Google before playing, and results are stored in memory with streak bonuses.

## Features

- Google OAuth 2.0 login (Gmail accounts) via Passport.js
- Player vs. bot tic-tac-toe with simple AI for blocking and winning moves
- Score system with +1/-1 for wins/losses, no change on draws
- Win-streak bonus: three consecutive wins grant +1 extra point and reset the streak
- Persistent scoreboard backed by SQLite, accessible to all players
- Customisable player nicknames stored in SQLite (defaults to `playerxxxxx`)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set environment variables**

   Create a `.env` file in the project root with the following values:

   ```ini
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   SESSION_SECRET=replace-with-a-secure-random-string
   PORT=3000
   ```

   - Register your OAuth credentials in the Google Cloud Console.
   - Add `http://localhost:3000/auth/google/callback` to the authorized redirect URIs.

3. **Run the application**

   ```bash
   npm start
   ```

4. **Play the game**

   - Visit `http://localhost:3000`
   - Sign in with your Google account
   - Challenge the bot and earn points
   - View the scoreboard to compare scores with other players
   - Update your nickname from the Settings panel (defaults to `playerxxxxx`)

## Notes

- Player stats are saved in `data/xo.sqlite`. Delete this file if you need a fresh scoreboard.
- The development server uses Express 5 with native `node --watch` available under `npm run dev`.


