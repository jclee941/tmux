if type != "object"
  or (.number | type) != "number" or .number <= 0
  or .number != (.number | floor)
  or (.title | type) != "string"
  or (.head.ref | type) != "string"
  or (.additions | type) != "number" or .additions < 0
  or (.deletions | type) != "number" or .deletions < 0
  or .additions != (.additions | floor)
  or .deletions != (.deletions | floor)
  or ($files | length) != 1 or ($files[0] | type) != "array"
  or any($files[0][]; type != "string")
then error("invalid_metadata")
else . end
| . as $pr
| $files[0] as $paths
| (.additions + .deletions) as $lines
| (.head.ref == "bot/auto-readme-update" and ($paths | unique) == ["README.md"]) as $readme
| ((.head.ref | startswith("dependabot/"))
   and all($paths[]; endswith("package.json") or endswith("package-lock.json"))) as $lockfiles
| ((.number | tostring) == $approved_backlog_pr) as $backlog
| [$paths[] | select(test(
    "(^|/)\\.env(\\.(?!example$|sample$|template$)|$)|(^|/)\\.secrets\\.toml$|(^|/)id_rsa$|\\.pem$|(^|/)\\.npmrc$"
  ))] as $sensitive
| [
    if (.title | gsub("^\\s+|\\s+$"; "") | test(
      "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\([\\w./-]+\\))?!?: .+"
    )) then empty else "conventional_title" end,
    if ($readme or $lockfiles or $backlog)
       or ($lines <= 500 and ($paths | length) <= 50)
    then empty else "pr_size" end,
    if ($sensitive | length) == 0 then empty else "sensitive_files" end
  ] as $errors
| {
    valid: ($errors | length == 0),
    rules: $errors,
    changed_lines: $lines,
    changed_files: ($paths | length),
    sensitive_files: $sensitive,
    approved_backlog: $backlog
  }
| if .valid then . else error(tojson) end
