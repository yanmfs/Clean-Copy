# Contributing

Bug reports and pull requests are welcome.

1. Install Node.js (LTS), pnpm, Rust (stable) and, on macOS, the Xcode Command Line Tools.
2. `pnpm install`
3. `pnpm check` runs typecheck, lint and tests. In `src-tauri/`, run `cargo fmt --check`, `cargo clippy -- -D warnings` and `cargo test`.
4. `pnpm tauri dev` starts the app.

The cleaning rules live in `src/core/clean/` and are covered by pairs of files in `tests/fixtures/clean/` (`name.in.txt`, `name.out.txt`). If a text from a PDF comes out wrong, the best bug report is a new pair with the input and the output you expected, using made-up content.

Keep commits small, with a short message in English in the imperative (`Fix hyphen join for clitics`).
