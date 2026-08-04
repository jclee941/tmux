---
date: 2026-08-04
type: session
tags: [session, tmux, statusbar, resources, gpu, ssh]
related: [[2026-08-04-tmux-bottom-resource-monitor], [2026-07-24-tmux-resource-status]]
---

# Session: 호스트 인식 리소스 모니터 (jclee-dev / jclee-prd + GPU)

## Goal
- 새 tmux 세션/윈도우에서 뜨는 상태바 에러를 디버그·수정한다.
- 로컬(jclee-dev)과 원격 192.168.50.220(jclee-prd)을 식별 가능하게 표시한다.
- 원격 리소스(CPU/MEM/DISK)와 220의 GPU 사용률을 표시한다.

## Actions
- 에러 재현: upstream 없는 git repo에서 `tmux-git-status`가 `set -e` + 실패한 명령 치환(`git rev-list HEAD...@{u}`, 비-git 디렉터리의 `git symbolic-ref || git rev-parse`)으로 exit 128 → tmux가 상태바에 `returned 128` 표시. 실패 허용 치환에 `|| true` 추가로 수정.
- `bin/tmux-remote-sys-probe` 신규: `cpu mem disk gpu`(nvidia-smi optional)를 출력. 로컬 실행 또는 `ssh <host> bash -s < probe`로 원격 실행.
- `bin/tmux-host-stats` 신규: pane tty의 `ssh`/`mosh-client` 프로세스를 감지해 목적지를 파싱(플래그 값 스킵, user@ 제거). 라벨 매핑: 220/youtube/vm-220 → `jclee-prd`, 로컬/200 → `jclee-dev`. 원격 값은 `${XDG_RUNTIME_DIR:-/tmp}`에 TTL 5s 캐시, ssh 실패 시 stale 캐시 → 없으면 `jclee-prd OFFLINE`.
- `conf.d/30-statusbar.conf` 최하단 배지: `pane_current_command`가 ssh/mosh-client면 주황(`#e0af68`), 아니면 청록(`#7dcfff`) 조걸부 색상 + `tmux-host-stats`.
- `bin/tmux-responsive`의 상단 status-right 4곳도 `tmux-sys-stats` → `tmux-host-stats`로 교체(두 줄 라벨 일치).

## Results
- shellcheck/bash -n 통과. 로컬 출력 `jclee-dev CPU 47% MEM 60% DISK 53%` 확인.
- 220 ssh probe: `31 49 82 27`(GPU는 RTX 5070 Ti) 확인. 감지 검증: 테스트 세션의 `ssh youtube` 프로세스를 tty에서 정확히 파싱.
- 실제 tmux 재로드 후 활성 `status-format[1]`/`status-right`에 조걸부 배지 + host-stats 반영 확인.
- 참고: `~/.tmux/bin`과 `~/.tmux/conf.d`는 저장소로의 심링크(파일 복사 불필요).

## Decisions Made
- 원격 감지는 pane tty 프로세스 기반, 원격 수집은 ssh BatchMode + 5s 캐시(mosh pane에서도 ssh로 수집).
- `#()` 출력은 tmux 스타일이 재해석되지 않으므로 배지 색상은 포맷 조걸문으로 처리.

## Next Steps
- 220 외 다른 상시 원격 호스트가 생기면 `tmux-host-stats`의 `host_label()` 매핑에 추가.

## Follow-up (same day)
- 폭 조걸을 포맷의 중첩 `#{?}`+`#()`로 구현했다가 하단 줄 전체가 사라지는 회귀 발생 → tmux 3.4 상태바 렌더러가 중첩 `#()`를 처리하지 못함. `#(... #{client_width})` 단일 최상위 `#()` + 스크립트 인자(120열 미만 compact) 방식으로 교체해 복구.
- 사용자 요구에 따라 하단을 **상시 이중 배지**로 변경: 청록 `jclee-dev`(`--local`) + 주황 `jclee-prd`(`--remote 192.168.50.220`). ssh 컨텍스트 감지는 auto 모드(기본, 상단 줄용)로 유지.
- 검증: `--local/--remote/auto` 모드별 출력, compact 전환, 재로드 후 활성 포맷·렌더(723B)·포맷 에러 0 확인.
- 가독성: 이중 배지를 파워라인 glyph()로 연결 — dev 청록 pill → prd 주황 pill 전환, 양 끝  cap. U+E0B0 바이트·렌더(771B)·포맷 에러 0 확인.
- 가독성 2차: `[DEV]`/`[PRD]` 칩(포맷 고정 텍스트, 호스트 컬러) + 데이터 pill(`#24283b` 위 밝은 `#c0caf5`)로 분리. 스크립트 `--bare` 모드 추가(라벨 제거), 키·값 경계는 `CPU:34%` 콜론 형식. 중복 arg 파싱 블록 제거. 렌더(906B)·칩·탭·포맷 에러 0 확인.
- 임계 하이라이트: 메트릭별 `--field cpu|mem|disk|gpu` 모드 추가 + 포맷에서 `#{?#{e|>=:#(...),70},#[fg=#f7768e,bold],#[fg=#c0caf5]}` 조건으로 70% 이상 빨강. 동일 `#()` 명령은 tmux job 캐시 공유. 로컬도 2s 캐시 추가(필드 호출 일관성·probe 부하 절감). refresh-client -S 후 포맷 에러 0, 리터럴 조건(82→RED/36→NORMAL) 검증.
- 주의: edit 도구는 "삭제 라인 수 > 삽입 라인 수"일 때 삽입 텍스트를 강제 분할(merge auto-expand)하므로, 범위 치환 시 삽입 라인 수를 소비 라인 수 이상으로 유지할 것.
- 임계 하이라이트 재구현: 중첩 `#()`+`e|>=` 는 tmux 3.4 상태바 렌더러에서 깨짐(사용자 화면에 `cpu:bold` 잔해). `--push <prefix>` 모드로 스크립트가 `@dev_cpu` 등 글로벌 옵션을 1초 주기로 갱신하고, 포맷은 `#{?#{e|>=:#{@dev_cpu},70},빨강,기본}#{@dev_cpu}` 옵션 참조로 색상 처리. 옵션 기반이라 `display-message`로 실값 판정 검증 가능(@prd_disk=82→RED 확인). 포맷 에러 0, 렌더 1410B.
- raw 텍스트 회귀 수정: `#{?}` 분기 안 `#[fg=#f7768e,bold]`의 콤마가 브랜치 구분자로 파싱돼 `bold],#[...]` 잔해 노출. tmux 3.4는 조건 분기 안 스타일을 공백 구분(`#[fg=#f7768e bold]`)으로 써야 함(세션 탭 패턴과 동일). 확장 덤프로 `DISK:#[fg=#f7768e bold]82`·나머지 기본색 확인, 포맷 에러 0.
- 키 라벨 bold: `CPU:`/`MEM:`/`DISK:`/`GPU:` 세그먼트를 `#[fg=#565f89 bg=#24283b bold]` 처리(7곳). 확장 덤프에서 dev CPU 73%·prd DISK 82%의 실시간 임계 빨강 확인.
- 숫자 지터 수정: 값을 고정폭 3자리(`  6`, ` 82`, `100`, `  ?`)로 패딩. 조건식은 raw 옵션(`@dev_cpu`), 표시는 패딩 옵션(`@dev_cpu_p`)으로 분리(strtonum이 선행 공백을 처리 못 하므로). push_field/pad3 헬퍼 추가, whole-line 출력도 동일 패딩. 확장 덤프에서 폭 고정·임계 판정(82→RED) 유지 확인.
