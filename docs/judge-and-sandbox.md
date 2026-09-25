# Judge and sandbox

## The judge

A problem's tests are a JSON list of `{"input", "expected", "hidden"}`. A submission is a Python program: it reads a test's `input` on stdin and prints its answer. A test passes when the program exits cleanly and its stdout, trimmed at both ends, equals the trimmed `expected`.

Tests run in order and judging stops at the first failure. The verdict is one of `accepted`, `wrong_answer`, `runtime_error` or `time_limit_exceeded`, with the time taken and a result for each test that ran. For a hidden test the result says only whether it passed: its input, expected output and the program's output are never returned, since a failing program's output can echo the test.

Hidden tests keep the examples short and stop people writing code for the visible cases only. They are not secret: the migrations that add them are in this repository.

Each problem sets its own time and memory limit per test. Migration V12 bounds what a problem may ask for.

The judge itself is `app/runner/judge.py`. It knows nothing about the database, so it can be tested and reused on its own.

## The sandbox

People submit code they wrote a minute ago, and anyone can sign up, so every submission is treated as hostile. With `SANDBOX_IMAGE` set, the runner (`app/runner/sandbox.py`) judges each submission in a new container from that image, removed afterwards. The container:

- has no network
- has a read-only root filesystem, with a small writable `/tmp`
- runs as an unprivileged user with every capability dropped and no way to gain privileges
- has a memory cap, with no swap beyond it, and a limit on processes
- is killed if the whole run outlives its time budget

Containers share the host's kernel, so a single kernel bug could let a program out. In production each container therefore runs under [gVisor](https://gvisor.dev) (`SANDBOX_RUNTIME=runsc`), which answers the program's system calls in its own kernel written in Go. Getting out then takes a gVisor bug and a kernel bug. `infra/install-gvisor.sh` installs it.

The runner starts containers through the host's Docker socket, which makes the runner as trusted as the host. Run it on a machine that runs nothing but TandemCode.

Without `SANDBOX_IMAGE`, the runner refuses to start unless `ALLOW_UNSANDBOXED=1` is set. Then it judges in its own process with resource limits only, which the test suite uses and nothing else should.

## Complexity analysis

On request, an accepted run can be rerun on inputs of growing size to estimate how its running time grows. The problem's generator (`complexity_generator`, see [CONTRIBUTING.md](../CONTRIBUTING.md)) makes the inputs, and `app/runner/complexity.py` runs the program on each size in one sandbox container.

- It measures CPU time from outside the program. Counting executed lines would miss work done inside built-ins, such as `x in some_list`, and would call a quadratic brute force linear. The program also can't report a time of its own.
- The fixed cost of every run (interpreter start, imports, reading input) is measured on a tiny input and subtracted. Under gVisor it is some 150 ms, ten times a laptop's, and gVisor reports CPU time in 10 ms steps, so a size only counts once the solution's own time is at least that fixed cost. Short runs are timed twice and the faster kept, since scheduling only ever adds time.
- It fits the largest measurable sizes (`FITTED_POINTS`) to a power of n and names the class. n log n measures too close to n to tell apart, so the two share a class.
- Each analysis has a time budget, and each size a limit (`BUDGET_SECONDS` and `PER_RUN_SECONDS` in `complexity.py`). A solution that outgrows them is stopped, and the note says where.
- The runner analyzes only when no submission is waiting, so an analysis never holds up a verdict by more than the one in progress.

The result is an estimate, and the app says so. Nothing about it affects the verdict.

## Reporting a problem with it

A way out of the sandbox, or a way to see or change other people's runs, is a security issue. Report it privately as described in [SECURITY.md](../SECURITY.md).
