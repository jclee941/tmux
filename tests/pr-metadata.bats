#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  export CI_SIZE_APPROVED_PR=""
  METADATA_FILTER="$BATS_TEST_DIRNAME/../.github/scripts/pr-metadata.jq"
  printf '%s\n' \
    '{"number":17,"title":"fix: valid change","head":{"ref":"fix/example"},"additions":10,"deletions":0}' \
    > "$TEST_TMPDIR/pr.json"
  printf '%s\n' '["src/example.txt"]' > "$TEST_TMPDIR/files.json"
}

teardown() {
  teardown_test_env
}

metadata() {
  jq --exit-status --arg approved_backlog_pr "$CI_SIZE_APPROVED_PR" \
    --slurpfile files "$TEST_TMPDIR/files.json" \
    --from-file "$METADATA_FILTER" "$TEST_TMPDIR/pr.json"
}

update_pr() {
  jq "$1" "$TEST_TMPDIR/pr.json" > "$TEST_TMPDIR/updated.json"
  mv "$TEST_TMPDIR/updated.json" "$TEST_TMPDIR/pr.json"
}

@test "metadata accepts exactly 500 lines and 50 files" {
  # Given
  update_pr '.additions = 300 | .deletions = 200'
  jq -n '[range(50) | "src/file-\(.).txt"]' > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
}

@test "metadata rejects a nonconventional title" {
  # Given
  update_pr '.title = "Update files"'
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"conventional_title"'* ]]
}

@test "metadata rejects 501 changed lines" {
  # Given
  update_pr '.additions = 501'
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"pr_size"'* ]]
}

@test "metadata rejects 51 changed files" {
  # Given
  jq -n '[range(51) | "src/file-\(.).txt"]' > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"pr_size"'* ]]
}

@test "metadata size approval applies only to its exact PR" {
  # Given
  export CI_SIZE_APPROVED_PR=17
  update_pr '.additions = 20000'
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
  printf '%s\n' "$output" | jq --exit-status '.approved_backlog == true'
}

@test "metadata rejects size approval for a different PR" {
  # Given
  export CI_SIZE_APPROVED_PR=18
  update_pr '.additions = 501'
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"pr_size"'* ]]
}

@test "metadata size approval never exempts a bad title" {
  # Given
  export CI_SIZE_APPROVED_PR=17
  update_pr '.title = "Update files" | .additions = 20000'
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"conventional_title"'* ]]
}

@test "metadata size approval never exempts sensitive files" {
  # Given
  export CI_SIZE_APPROVED_PR=17
  printf '%s\n' '["nested/.env.production","keys/id_rsa","client.pem",".npmrc",".secrets.toml"]' \
    > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"sensitive_files"'* ]]
}

@test "metadata permits environment example files" {
  # Given
  printf '%s\n' '[".env.example",".env.sample",".env.template"]' \
    > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
}

@test "metadata rejects an environment example with a secret suffix" {
  # Given
  printf '%s\n' '["nested/.env.example.local"]' \
    > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'nested/.env.example.local'* ]]
}

@test "metadata retains the README automation size exemption" {
  # Given
  update_pr '.head.ref = "bot/auto-readme-update" | .additions = 10000'
  printf '%s\n' '["README.md"]' > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
}

@test "metadata retains the Dependabot lockfile size exemption" {
  # Given
  update_pr '.head.ref = "dependabot/npm/example" | .additions = 10000'
  printf '%s\n' '["package.json","nested/package-lock.json"]' > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
}

@test "metadata rejects unrelated files in a README size exemption" {
  # Given
  update_pr '.head.ref = "bot/auto-readme-update" | .additions = 10000'
  printf '%s\n' '["README.md","src/example.txt"]' > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"pr_size"'* ]]
}

@test "metadata rejects non-lockfiles in a Dependabot size exemption" {
  # Given
  update_pr '.head.ref = "dependabot/npm/example" | .additions = 10000'
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
  [[ "$output" == *'"pr_size"'* ]]
}

@test "metadata accepts an empty changed-file list" {
  # Given
  printf '%s\n' '[]' > "$TEST_TMPDIR/files.json"
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
}

@test "metadata fails closed for malformed input" {
  # Given
  update_pr '.title = null'
  # When
  run metadata
  # Then
  [ "$status" -ne 0 ]
}

@test "metadata treats shell syntax in a valid title as inert data" {
  # Given
  jq --arg title 'fix: $(touch '"$TEST_TMPDIR"'/injected)' '.title = $title' \
    "$TEST_TMPDIR/pr.json" > "$TEST_TMPDIR/updated.json"
  mv "$TEST_TMPDIR/updated.json" "$TEST_TMPDIR/pr.json"
  # When
  run metadata
  # Then
  [ "$status" -eq 0 ]
  [ ! -e "$TEST_TMPDIR/injected" ]
}
