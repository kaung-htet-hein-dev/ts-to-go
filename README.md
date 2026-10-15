# TS to Go

An interactive course that teaches Go to developers who already write JavaScript or TypeScript.
Every lesson starts from the TypeScript you'd write, shows the Go version next to it,
then explains what is different and why, in plain words.

```sh
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # type-check and production build
```

## Course outline

7 tracks, 40 lessons. Work through them in order; later lessons link back to earlier ones.

### Track 1. Start here
Compiled, one binary, no classes, no exceptions. The toolchain and how packages export names.

| Lesson | You will learn |
| --- | --- |
| How Go differs from TS | The mental map: compiled binary, real types, no classes, errors as values, unused-is-an-error |
| Toolchain | `go mod init`, `run`, `build`, `fmt`, `vet`, `test`, `get` as your new `package.json` scripts |
| Packages and exported names | Folder = package, capital letter = exported, imports, `internal/`, `init()` order |

### Track 2. Basics
Zero values instead of undefined, one loop keyword, multiple returns, defer and pointers.

| Lesson | You will learn |
| --- | --- |
| Variables, := and zero values | `var` vs `:=`, why there is no `undefined`, shadowing |
| Types, constants, iota | Basic types, explicit conversion, untyped constants, `iota` enums |
| for, if, switch | One loop keyword for every loop, `if` with init statement, `switch` without `break` |
| Functions, multiple returns, closures | `(value, error)` returns, named results, variadics, closures |
| defer | Cleanup that runs on return, LIFO order, argument evaluation time |
| Pointers | `&` and `*`, when to share vs copy, `nil`, no pointer arithmetic |

### Track 3. Data
Slices that share backing arrays, maps, runes, and composition in place of inheritance.

| Lesson | You will learn |
| --- | --- |
| Arrays versus slices | Length vs capacity, `append`, shared backing arrays |
| Maps | Comma-ok lookups, zero-value reads, random iteration, nil maps |
| Strings, bytes, runes | UTF-8 bytes vs runes, `range` over strings, `strings.Builder` |
| Structs and embedding | Struct literals, comparison, embedding instead of `extends` |
| Methods: value versus pointer receivers | When a method can change its receiver, method sets |

### Track 4. Types and errors
Structural interfaces, the nil interface trap, generics, and errors as ordinary values.

| Lesson | You will learn |
| --- | --- |
| Interfaces without "implements" | Implicit satisfaction, small interfaces, `any` |
| Interface values and the nil trap | Why a nil pointer in an interface is not `nil` |
| Type assertions and type switches | `v.(T)`, comma-ok, `switch v := x.(type)` |
| Generics and constraints | Type parameters, constraints, `comparable`, when not to use them |
| Errors as values | `fmt.Errorf("%w")`, `errors.Is`, `errors.As`, custom error types |
| panic and recover | What panics are for, `recover` in deferred functions |

### Track 5. Concurrency
Goroutines instead of async/await, channels, select, sync, context and the patterns built on them.

| Lesson | You will learn |
| --- | --- |
| Goroutines versus async/await | `go f()`, no colored functions, `WaitGroup` |
| Channels: unbuffered and buffered | Typed pipes, blocking, `close` and `range` (interactive simulator) |
| select | Waiting on many channels, timeouts, `default` for non-blocking ops |
| sync: Mutex, WaitGroup, Once, atomic | Shared memory done safely |
| Race conditions | What a data race is, `go run -race` |
| context | Cancellation and deadlines, Go's `AbortController` |
| Patterns | Worker pool, pipeline, fan-in |
| Deadlocks and goroutine leaks | Why programs hang, and how to make goroutines always exit |

### Track 6. Under the hood
The scheduler, escape analysis, the garbage collector, and what slices, maps and channels look like inside.

| Lesson | You will learn |
| --- | --- |
| The scheduler | G, M and P; how thousands of goroutines share a few threads |
| Stack versus heap | Escape analysis and `-gcflags=-m` |
| Garbage collector | Concurrent mark and sweep, `GOGC`, `GOMEMLIMIT` |
| Growing stacks | Why goroutines start small and how stacks grow |
| Inside a slice, a map, a channel | Slice headers, map buckets, `hchan` |
| Struct layout and padding | Alignment, `unsafe.Sizeof`, field ordering |

### Track 7. Building things
Table-driven tests, io.Reader, JSON tags, an HTTP server, modules, and what changed in newer Go.

| Lesson | You will learn |
| --- | --- |
| Testing, benchmarks, fuzzing | Table-driven tests, `t.Run`, `b.Loop`, fuzz tests |
| io.Reader and io.Writer | The two interfaces every stream implements |
| JSON and struct tags | `json:"name,omitempty"`, decoding, unknown fields |
| net/http server | Handlers, `ServeMux` patterns, middleware |
| Project layout and modules | `cmd/`, `internal/`, versions, workspaces |
| Newer Go | Range over ints and functions, loop variable fix, recent additions |

## Lesson format

Every lesson has the same shape, so learners know what to expect:

1. **Coming from JS and TS**: the TypeScript code you'd write next to the Go version, plus three key facts.
2. **Teaching sections**: two to four short sections with code, comparisons and tables.
3. **Pitfalls**: where TS developers usually get stuck.
4. **Predict the output**: a multiple-choice question with a step trace.
5. **Challenge**: fill one blank in a program. A right answer marks the lesson complete.
6. **Remember this**: the takeaways.

Every Go program used in a Predict or Challenge was run with Go 1.25 to confirm the answer.

## Code map

| Path | What it is |
| --- | --- |
| `src/data/course.ts` | The outline: tracks and lesson ids/titles |
| `src/data/lessons/types.ts` | `LessonContent`, the schema every lesson follows |
| `src/data/lessons/t1-start.ts` … `t7-building.ts` | Lesson content, one file per track |
| `src/pages/LessonPage.tsx` | Renders any `LessonContent` |
| `src/pages/ChannelsLesson.tsx` | The hand-built Channels lesson with its simulator |

Inline text in lessons supports a small markup: `` `code` ``, `**bold**`, and `[label](#/lesson/id)` links.

### Adding or editing a lesson

1. Add or rename the lesson in `src/data/course.ts`.
2. Write a `LessonContent` object in the matching `src/data/lessons/tN-*.ts` file and add it to that file's exported array.
3. Run the Predict program and the Challenge (with each accepted answer) through `go run` to confirm the answers.
4. `pnpm build`.
