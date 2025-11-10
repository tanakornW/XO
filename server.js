require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
  SESSION_SECRET,
  PORT = 3000,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Warning: Missing Google OAuth credentials. Google login will not work.');
}

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  console.warn('Warning: Missing Facebook OAuth credentials. Facebook login will not work.');
}

if (!SESSION_SECRET) {
  throw new Error('Missing session secret. Set SESSION_SECRET in the environment.');
}

const app = express();

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'xo.sqlite');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        return reject(err);
      }
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

async function initDatabase() {
  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      photo TEXT,
      nickname TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS stats (
      user_id TEXT PRIMARY KEY,
      score INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  );

  await run('ALTER TABLE users ADD COLUMN nickname TEXT', []).catch((error) => {
    if (!/duplicate column name/i.test(error.message)) {
      throw error;
    }
  });
}

function computeRank({ winRate, score, wins }) {
  if (winRate >= 0.8 && score >= 15) {
    return 'Legend';
  }
  if (winRate >= 0.7 && score >= 10) {
    return 'Diamond';
  }
  if (winRate >= 0.6 && score >= 6) {
    return 'Platinum';
  }
  if (winRate >= 0.5 && score >= 3) {
    return 'Gold';
  }
  if (winRate >= 0.4 && score >= 0) {
    return 'Silver';
  }
  if (wins >= 1) {
    return 'Bronze';
  }
  return 'Rookie';
}

function generateDefaultNickname(id) {
  const cleanId = (id || '').replace(/[^a-zA-Z0-9]/g, '');
  const suffix = cleanId.slice(-5) || Math.random().toString(36).slice(-5);
  return `player${suffix.padStart(5, '0')}`.toLowerCase();
}

async function ensureUserRecord(profile) {
  if (!profile || !profile.id) {
    return;
  }

  const timestamp = new Date().toISOString();
  const defaultNickname = generateDefaultNickname(profile.id);

  await run(
    `INSERT INTO users (id, name, email, photo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       email = excluded.email,
       photo = excluded.photo,
       updated_at = excluded.updated_at`,
    [profile.id, profile.displayName, profile.email, profile.photo ?? '', timestamp, timestamp],
  );

  await run(
    `UPDATE users
     SET nickname = COALESCE(NULLIF(nickname, ''), ?)
     WHERE id = ?`,
    [defaultNickname, profile.id],
  );

  await run(
    `INSERT OR IGNORE INTO stats (user_id, score, streak, wins, losses, draws, last_updated)
     VALUES (?, 0, 0, 0, 0, 0, ?)`,
    [profile.id, timestamp],
  );
}

async function getPlayerStats(userId) {
  const row = await get(
    `SELECT
      s.user_id AS id,
      u.name,
      u.email,
      u.photo,
      COALESCE(u.nickname, '') AS nickname,
      s.score,
      s.streak,
      s.wins,
      s.losses,
      s.draws,
      s.last_updated AS lastUpdated
    FROM stats s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.user_id = ?`,
    [userId],
  );

  if (!row) {
    return {
      id: userId,
      name: '',
      email: '',
      photo: '',
      nickname: generateDefaultNickname(userId),
      score: 0,
      streak: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  return row;
}

async function getSortedScores() {
  const rows = await all(
    `SELECT
      s.user_id AS id,
      u.name,
      u.email,
      u.photo,
      COALESCE(u.nickname, '') AS nickname,
      s.score,
      s.streak,
      s.wins,
      s.losses,
      s.draws,
      s.last_updated AS lastUpdated
    FROM stats s
    INNER JOIN users u ON u.id = s.user_id`,
  );

  const sorted = rows
    .map((entry) => {
      const wins = Number(entry.wins) || 0;
      const losses = Number(entry.losses) || 0;
      const draws = Number(entry.draws) || 0;
      const score = Number(entry.score) || 0;
      const totalGames = wins + losses + draws;
      const winRate = totalGames > 0 ? wins / totalGames : 0;
      const rank = computeRank({ winRate, score, wins });
      return {
        ...entry,
        score,
        wins,
        losses,
        draws,
        streak: Number(entry.streak) || 0,
        winRate,
        rank,
      };
    })
    .sort((a, b) => {
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.wins - a.wins;
    });

  return sorted.map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {
        const userProfile = {
          id: `google_${profile.id}`,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value ?? '',
          photo: profile.photos?.[0]?.value ?? '',
        };

        ensureUserRecord({
          id: userProfile.id,
          displayName: userProfile.displayName,
          email: userProfile.email,
          photo: userProfile.photo,
        })
          .then(() => done(null, userProfile))
          .catch((error) => done(error));
      },
    ),
  );
}

if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      (accessToken, refreshToken, profile, done) => {
        const userProfile = {
          id: `facebook_${profile.id}`,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value ?? '',
          photo: profile.photos?.[0]?.value ?? '',
        };

        ensureUserRecord({
          id: userProfile.id,
          displayName: userProfile.displayName,
          email: userProfile.email,
          photo: userProfile.photo,
        })
          .then(() => done(null, userProfile))
          .catch((error) => done(error));
      },
    ),
  );
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
  (req, res) => {
    res.redirect('/');
  },
);

app.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] }),
);

app.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/?auth=failed' }),
  (req, res) => {
    res.redirect('/');
  },
);

app.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({ success: true });
    });
  });
});

app.get('/api/user', ensureAuthenticated, async (req, res, next) => {
  try {
    await ensureUserRecord({
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.email,
      photo: req.user.photo,
    });

    const record = await getPlayerStats(req.user.id);
    const wins = record?.wins ?? 0;
    const losses = record?.losses ?? 0;
    const draws = record?.draws ?? 0;
    const score = record?.score ?? 0;
    const streak = record?.streak ?? 0;

    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? wins / totalGames : 0;
    const rank = computeRank({ winRate, score, wins });

    res.json({
      user: {
        id: req.user.id,
        name: req.user.displayName,
        email: req.user.email,
        photo: req.user.photo,
        nickname: record.nickname,
      },
      score,
      streak,
      wins,
      losses,
      draws,
      winRate,
      rank,
      nickname: record.nickname,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/game/result', ensureAuthenticated, async (req, res, next) => {
  const { result } = req.body;
  if (!['win', 'loss', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'Invalid result payload' });
  }

  try {
    await ensureUserRecord({
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.email,
      photo: req.user.photo,
    });

    const record = await getPlayerStats(req.user.id);
    const updated = { ...record };
    let bonusAwarded = false;

    if (result === 'win') {
      updated.wins += 1;
      updated.score += 1;
      updated.streak += 1;
      if (updated.streak >= 3) {
        updated.score += 1;
        bonusAwarded = true;
        updated.streak = 0;
      }
    } else if (result === 'loss') {
      updated.losses += 1;
      updated.score -= 1;
      updated.streak = 0;
    } else {
      updated.draws += 1;
      updated.streak = 0;
    }

    updated.lastUpdated = new Date().toISOString();

    await run(
      `UPDATE stats
       SET score = ?, streak = ?, wins = ?, losses = ?, draws = ?, last_updated = ?
       WHERE user_id = ?`,
      [
        updated.score,
        updated.streak,
        updated.wins,
        updated.losses,
        updated.draws,
        updated.lastUpdated,
        req.user.id,
      ],
    );

    const totalGames = updated.wins + updated.losses + updated.draws;
    const winRate = totalGames > 0 ? updated.wins / totalGames : 0;
    const rank = computeRank({ winRate, score: updated.score, wins: updated.wins });

    res.json({
      score: updated.score,
      streak: updated.streak,
      wins: updated.wins,
      losses: updated.losses,
      draws: updated.draws,
      winRate,
      rank,
      bonusAwarded,
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/user/nickname', ensureAuthenticated, async (req, res, next) => {
  const { nickname } = req.body;
  const trimmed = typeof nickname === 'string' ? nickname.trim() : '';

  if (trimmed.length < 3 || trimmed.length > 24) {
    return res.status(400).json({ error: 'Nickname must be between 3 and 24 characters.' });
  }

  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    return res.status(400).json({ error: 'Nickname can only contain letters, numbers, spaces, hyphen, or underscore.' });
  }

  try {
    const timestamp = new Date().toISOString();
    await run(
      `UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?`,
      [trimmed, timestamp, req.user.id],
    );
    res.json({ nickname: trimmed });
  } catch (error) {
    next(error);
  }
});

app.get('/api/scores', async (req, res, next) => {
  try {
    const sorted = await getSortedScores();
    const limitParam = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? null : Math.max(limitParam, 1);

    if (limit) {
      return res.json(sorted.slice(0, limit));
    }

    if (req.isAuthenticated && req.query.view === 'all') {
      return res.json(sorted);
    }

    return res.json(sorted.slice(0, 10));
  } catch (error) {
    next(error);
  }
});

app.get('/api/scores/top', async (req, res, next) => {
  try {
    const sorted = await getSortedScores();
    res.json(sorted.slice(0, 10));
  } catch (error) {
    next(error);
  }
});

app.get('/api/scores/summary', async (req, res, next) => {
  try {
    const sorted = await getSortedScores();
    const top = sorted.slice(0, 5);
    let player = null;

    if (req.isAuthenticated && req.isAuthenticated()) {
      player = sorted.find((entry) => entry.id === req.user.id) ?? null;
    }

    res.json({
      top,
      player,
    });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/auth')
  ) {
    if (req.path === '/scoreboard') {
      return res.sendFile(path.join(__dirname, 'public', 'scoreboard.html'));
    }
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  return next();
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`XO web app listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });


