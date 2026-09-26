---
date: 2026-08-04
type: session
tags: [session, tmux, statusbar, resources]
related: [[2026-07-24-tmux-resource-status]]
---

# Session: tmux 최하단 리소스 모니터 복구

## Goal
- 현재 화면에서 보이지 않는 CPU, 메모리, 디스크 사용량을 tmux 최하단 줄에 표시한다.

## Actions
- `tmux-sys-stats`의 직접 실행과 실행 권한을 확인했다.
- 최하단 커스텀 줄인 `status-format[1]`에 리소스 출력을 우측 정렬로 연결했다.
- 가독성을 위해 축약형을 `CPU nn% MEM nn% DISK nn%` 라벨로 바꾸고 Tokyo Night 청록 배지를 적용했다.
- 저장소 설정과 실제 `~/.tmux/conf.d` 런타임 복사본을 동일하게 반영했다.

## Results
- 런타임 스크립트가 `CPU 85% MEM 77% DISK 94%` 형식으로 값을 출력했다.
- 저장소와 런타임 `30-statusbar.conf`가 동일하고, 최하단 포맷에 리소스 명령이 포함된 것을 확인했다.
- 실행 중인 tmux에 설정을 재로드하고 활성 최하단 포맷에 리소스 명령이 포함된 것을 확인했다.

## Decisions Made
- 기존 2줄 상태바를 유지하고 세션 탭이 있는 최하단 줄 우측에 고대비 리소스 배지를 표시한다.

## Next Steps
- 현재 적용 완료. 별도 후속 작업은 없다.
