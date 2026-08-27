# CLAUDE.md

Guidance for Claude Code sessions working on this repo.

## agent-browser (Vercel Labs browser automation CLI)

Installed and tested in the remote Claude Code container on 2026-08-27.
Sessions run in fresh, ephemeral containers, so **this setup does not persist
automatically** — re-run these steps at the start of a new session if
`agent-browser` isn't already on PATH.

### Install

```bash
npm install -g agent-browser
```

### Chrome / Chromium

`agent-browser install` tries to download its own Chrome binary from
`googlechromelabs.github.io`, which is **blocked by this environment's
network egress policy** (403 on CONNECT). Do not retry that download —
instead point agent-browser at the Chromium already preinstalled for
Playwright:

```bash
export AGENT_BROWSER_EXECUTABLE_PATH=/opt/pw-browsers/chromium
```

To make this persist across shell invocations in the same session (the
Bash tool runs non-interactive shells, which skip most of `~/.bashrc`),
add the export **above** the `[ -z "$PS1" ] && return` early-return guard
near the top of `~/.bashrc`, not at the bottom.

Verify:

```bash
agent-browser --version
agent-browser open "data:text/html,<h1>ok</h1>"
agent-browser screenshot /tmp/test.png
agent-browser close
```

### Network restriction: external sites are blocked

This container's outbound HTTPS goes through a policy-enforcing proxy
(`$HTTPS_PROXY`). General external domains — confirmed with
`google.com` and `example.com` — return `net::ERR_TUNNEL_CONNECTION_FAILED`
because the proxy answers `403` to the CONNECT (organization policy
denial, not a bug). Passing `--proxy "$HTTPS_PROXY" --ignore-https-errors`
to agent-browser does not help — the destination host itself is denied.

Check `curl -sS "$HTTPS_PROXY/__agentproxy/status"` (see
`recentRelayFailures`) to see which hosts were just denied. Per
`/root/.ccr/README.md`: do not retry or route around 403/407 denials —
report the blocked host instead of trying to work around it.

Known-allowed hosts (from the proxy's `noProxy`/allowlist as of this
writing): `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`,
`index.crates.io`, `proxy.golang.org`, `jsr.io`, plus Anthropic's own API
hosts. Practical implication: agent-browser works fine for **local**
content (`data:` URLs, `file://`, anything served from `localhost`) but
cannot be used to browse the open internet from this container unless the
target host is explicitly allowed.

### AI chat mode

`agent-browser chat "<instruction>"` (natural-language browser control)
requires a Vercel AI Gateway key, which is not configured here:

```bash
export AI_GATEWAY_API_KEY=gw_...   # not set in this environment
```

Without it, don't attempt `agent-browser chat` — translate the user's
natural-language request into direct `agent-browser` commands
(`open`, `click`, `fill`, `snapshot`, `screenshot`, etc.) instead.
