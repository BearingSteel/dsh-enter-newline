# dsh-enter-newline

English | [中文](README.zh.md)

An installable DSH Web UI plugin that swaps the conversation composer's Enter behavior: **Enter inserts a newline**, and **Shift+Enter sends the message**. The Send tooltip shows the shortcut.

## Behavior

- **Enter** inserts a line break instead of sending.
- **Shift+Enter** sends the message (or queues/steers through the same mode the primary Send action uses).
- Hovering or focusing the Send button changes its existing tooltip bubble to two lines:

  ```text
  Shift Enter
  Send message
  ```

  The shortcut line is always the same. The action line is the host's localized Send label and follows the active UI locale; Queue message and Steer message labels localize the same way.
- Touch/coarse-pointer devices keep the host tooltip unchanged and do not receive the extra shortcut line.
- The plugin keeps **Ctrl+Enter** / **Cmd+Enter** on the host's complementary send gesture, and leaves Enter alone while a slash/reference menu or an IME composition owns the key.

## Install

### DSH Web

1. Open **Plugins → Add plugin**.
2. Paste `https://github.com/BearingSteel/dsh-enter-newline`.
3. Install the bundle, then choose **Enable now** when it is offered.

### CLI

```sh
dsh plugin --profile web add github:BearingSteel/dsh-enter-newline
```

The command installs the bundle as a profile dependency. If it is not enabled automatically, turn on **dsh-enter-newline** on the Plugins page.

The bundle's `cordis.patch.yml` inserts the `enter-newline` row. The host half is inert; all behavior comes from the browser module declared by `dsh.client`. Reload the Web page after enabling the bundle.

## Verification

- `node --check index.js client.js`
- JSON/YAML manifest parsing
- A happy-dom behavior test covers Enter/Shift+Enter rewriting, menu and IME passthrough, tooltip marking, locale updates, touch suppression, and cleanup.
- The live client graph serves `dsh-enter-newline` with its `client.js`; the installed Host row is active.
- Visual browser verification was not available in this environment. Refresh the page after installation so the browser loads the new client module.

## AI generation

This project is 100% AI-generated.
