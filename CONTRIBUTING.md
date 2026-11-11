# Contributing

Track substantive work with a relevant GitHub issue. Reference the real issue number in each commit, including documentation commits.

Use issue-linked branches such as `feat/12-native-search`, `fix/13-slot-input`, or `docs/14-installation`. The repository's default branch remains `earth`. Feature-branch publication is separate from default-branch integration and does not authorize deployment.

Keep the editions independently buildable: `native/` is the native source root, and `standalone/` is the standalone source root. Their inner paths and build contexts are intentional. Follow each edition's README and licensing/security guidance; do not exchange native and standalone transport/authentication adapters. Preserve the original root application's files and history unless a separately reviewed migration explicitly changes them.

Do not commit saved records, piers, `.urb`, `var/`, credentials, `.env`, target-bound metadata, dependencies, generated ZIPs/images/artifacts, workstation checkpoints or raw operational/browser evidence. Keep authentic glyph provenance and upstream license notices with the source.

The historical native-port design handoff remains in `docs/urbit-native-port-prompt.md`, tracked by issue #1. Current native implementation and source-only verification are described in `native/README.md` and `native/docs/STATUS.md`; standalone instructions are in `standalone/README.md`. Source publication does not by itself establish native compilation, installation, served-byte parity or issue completion.
