# discord-bot-js

Discord bot on discord.js v14. CommonJS, no build step, no TypeScript. Tests use
the built-in `node:test` runner.

## Commands

- `npm run lint`: ESLint (flat config). Must pass before committing.
- `npm test`: `node --test`, covering helpers and command guards.
- `npm run dev`: start the bot using `--env-file=.env`.
- `npm start`: start using ambient env vars (production).
- `npm run deploy`: register guild slash commands (needs `CLIENT_ID` + `GUILD_ID`).

## Verification

Run `npm run lint` and `npm test`, then `npm run deploy` if slash-command
definitions changed, then a manual run via `npm run dev`. CI
(`.github/workflows/ci.yml`) runs lint and tests on every push and pull request.

## Architecture

- `index.js`: client setup, intents, loads commands into `client.commands` and
  cooldowns into `client.cooldowns`, wires `events/*.js`, logs in, and serves an
  HTTP health check on `PORT` (default 3000, `503` until the client is ready).
  Also handles gateway errors, unhandled rejections, and `SIGTERM`/`SIGINT`
  shutdown.
- `config.js`: the only module that reads env vars. Throws when `DISCORD_TOKEN`
  is missing; warns when `CLIENT_ID`, `GUILD_ID`, or `DEEPSEEK_API_KEY` are missing.
- `commands/<category>/<name>.js`: one slash command per file.
- `events/<event>.js`: one gateway listener per file.
- `utils/`: shared helpers (`load-commands.js`, `is-privileged.js`, `dice.js`,
  `cooldown.js`, `reminders.js`, `deepseek.js`, `chat-history.js`).
- `test/`: `node:test` suites, named `<module>.test.js`.
- `deploy-commands.js`: pushes command definitions to Discord via REST.
- `data/`: gitignored runtime state; `reminders.json` is rewritten on every
  reminder change.

## Command module contract

Export `data` (a `SlashCommandBuilder`), `execute(interaction)`, and optionally
`cooldown` in seconds (default 3, enforced in `events/interactionCreate.js`).
A module missing `data` or `execute` is skipped with a warning. A command that
"doesn't show up" usually means a missing export.

Adding a command is three steps: create the file, run `npm run deploy`, restart.

## Commands inventory

All live in `commands/utility/`.

- `/8ball <question>`: random magic 8-ball answer.
- `/avatar [user]`: full-size avatar embed (defaults to the caller).
- `/chat ask <prompt> [private]`: replies with the `deepseek-flash` model;
  history is per channel and user, capped at 10 turns with a 30 minute idle
  expiry.
- `/chat reset`: clears the caller's history for the current channel.
- `/coinflip`: heads or tails.
- `/delete <command>`: privileged; deregisters a guild command via REST.
- `/ping`: replies `Pong!`; `cooldown: 5`.
- `/reload <command>`: privileged; clears the require cache and swaps the
  module in `client.commands`.
- `/remind <duration> <message>`: DMs a reminder after 1-10080 minutes, falling
  back to the channel; persisted to `data/reminders.json`, max 5 pending per user.
- `/roll <dice>`: `NdN` notation, 1-100 dice of 2-1000 sides.
- `/server`: guild name and member count; guild-only.
- `/trivia`: OpenTDB question embed with a spoiler answer; needs outbound HTTPS
  and `deferReply`.
- `/user`: username and join date.
- `/whois [user]`: account created / joined / roles embed; guild-only.

## Event module contract

Export `name` (an `Events.*` constant), `execute(...)`, and `once: true` for
one-shot events.

## Privileged commands

Gate owner / `ManageGuild`-only commands with `isPrivileged(interaction)` from
`utils/is-privileged.js` and reply ephemerally when denied. See `/delete`, `/reload`.

## Reply style

- User-facing errors: ephemeral `MessageFlags.Ephemeral`; log the real error with
  `console.error`.
- Use `<t:${unixSeconds}:R>` for relative timestamps.
- Discord markdown only; no custom emoji in output.

## Style (enforced by ESLint)

- Tabs, single quotes, semicolons, trailing commas on multiline.
- `stroustrup` braces: `else`/`catch` on their own line after the closing brace.
- `node:` prefix for core modules; `require`, never ESM `import`.
- Max 2 statements per line, max 4 nested callbacks.
- No inline end-of-line comments (own-line comments only), no shadowing,
  prefer `const`.
- Match the surrounding file's style; don't reformat untouched code.
- No em dashes in prose, comments, user-facing strings, commit messages, or PR
  descriptions. Rewrite the sentence with a colon, comma, semicolon, or
  parentheses instead.

## Commit attribution

Every commit gets one attribution trailer, separated from the body by a blank
line:

    Co-Authored-By: OpenCode <noreply@opencode.ai>

`noreply@opencode.ai` is not a real mailbox, so the trailer does not link to a
GitHub profile. Add the trailer once per commit, never twice.

## Deployment

- `render.yaml` runs `node index.js`; `railpack.json` runs
  `node deploy-commands.js && node index.js`.
- Never commit `.env`. Secrets live in `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`,
  `DEEPSEEK_API_KEY`.
