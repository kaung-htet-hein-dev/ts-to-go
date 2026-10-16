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
Each lesson has one **big idea**: the sentence you should be able to repeat to a friend afterwards.

### Track 1. Start here
Why does Go feel so different from TS? It builds one program file you can copy and run, and it has no
classes and no throw/catch. Start here for the mental map, the go command, and how packages share code.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| How Go differs from TS | Go trades JS flexibility for a compiler that catches mistakes before you run anything | Compiled binary, real types, no classes, errors as values, unused-is-an-error |
| Toolchain | One `go` command replaces npm, tsc, prettier, eslint and jest | `go mod init`, `run`, `build`, `fmt`, `vet`, `test`, `get` as your new `package.json` scripts |
| Packages and exported names | A folder is a package, and a capital first letter is how you `export` | Imports, `internal/`, `init()` order |

### Track 2. Basics
In JS, a variable you forget to set is `undefined`. In Go, it starts at a safe zero value. Learn that, the
one loop keyword Go has, functions that return two values, `defer` for cleanup, and pointers.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| Variables, := and zero values | Every variable always holds a real value, so there is no `undefined` | `var` vs `:=`, zero values, shadowing |
| Types, constants, iota | Go never converts between types for you; you say what you mean | Basic types, explicit conversion, untyped constants, `iota` enums |
| for, if, switch | One `for` keyword covers every loop you know from JS | `if` with init statement, `switch` without `break` |
| Functions, multiple returns, closures | Functions return a value and an error side by side instead of throwing | `(value, error)` returns, named results, variadics, closures |
| defer | `defer` schedules cleanup to run when the function returns, like a built-in `finally` | LIFO order, argument evaluation time |
| Pointers | A pointer lets a function change your value instead of a copy of it | `&` and `*`, when to share vs copy, `nil`, no pointer arithmetic |

### Track 3. Data
Slices are Go's growable arrays, and two of them can quietly share memory. Learn slices, maps, text as
bytes and runes, and how structs reuse code without `extends`.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| Arrays versus slices | A slice is a window onto an array, and two windows can show the same array | Length vs capacity, `append`, shared backing arrays |
| Maps | Reading a missing key gives the zero value, so ask "was it there?" with comma-ok | Zero-value reads, random iteration, nil maps |
| Strings, bytes, runes | A string is a list of bytes, and one character can take several of them | UTF-8 bytes vs runes, `range` over strings, `strings.Builder` |
| Structs and embedding | Go reuses code by putting one struct inside another, not by inheriting | Struct literals, comparison, embedding instead of `extends` |
| Methods: value versus pointer receivers | A method can only change its receiver if it gets a pointer to it | Value vs pointer receivers, method sets |

### Track 4. Types and errors
Go checks interfaces by shape, like TS does, but you never write `implements`. Learn interfaces, the nil
interface trap, generics, and why errors are returned like any other value.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| Interfaces without "implements" | If a type has the right methods, it satisfies the interface automatically | Implicit satisfaction, small interfaces, `any` |
| Interface values and the nil trap | An interface holding a nil pointer is itself not `nil` | Type + value pairs, why `err != nil` can surprise you |
| Type assertions and type switches | Asking "what is really inside this interface?" is Go's `typeof` / `instanceof` | `v.(T)`, comma-ok, `switch v := x.(type)` |
| Generics and constraints | Write one function for many types, but only when an interface won't do | Type parameters, constraints, `comparable`, when not to use them |
| Errors as values | An error is an ordinary value you return, wrap and inspect | `fmt.Errorf("%w")`, `errors.Is`, `errors.As`, custom error types |
| panic and recover | `panic` is for bugs, not for normal failures | What panics are for, `recover` in deferred functions |

### Track 5. Concurrency
In JS you `await` things on one thread. In Go you start goroutines and pass values between them through
channels. Learn goroutines, channels, `select`, locks, `context` (Go's `AbortController`) and common patterns.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| Goroutines versus async/await | Any function can run concurrently with `go f()`, and no function needs to be `async` | No colored functions, `WaitGroup` |
| Channels: unbuffered and buffered | A channel is a typed pipe, and its size decides who waits for whom | Blocking, `close` and `range` (interactive simulator) |
| select | `select` waits on several channels at once, like `Promise.race` that you can loop | Timeouts, `default` for non-blocking ops |
| sync: Mutex, WaitGroup, Once, atomic | When goroutines share memory, a lock makes them take turns | Shared memory done safely |
| Race conditions | Two goroutines touching the same value without a lock is a bug even if it seems to work | What a data race is, `go run -race` |
| context | `context` is how you tell a whole chain of work to stop, like `AbortController` | Cancellation and deadlines |
| Patterns | A few shapes (worker pool, pipeline, fan-in) cover most concurrent code | Worker pool, pipeline, fan-in |
| Deadlocks and goroutine leaks | Every goroutine you start needs a guaranteed way to finish | Why programs hang, and how to make goroutines always exit |

### Track 6. Under the hood
What actually happens when your Go code runs? Look inside the scheduler, stack and heap memory, the
garbage collector, and the structures behind slices, maps and channels.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| The scheduler | Go runs thousands of goroutines on a handful of OS threads | G, M and P, and how work moves between them |
| Stack versus heap | The compiler decides where each value lives, and you can ask it why | Escape analysis and `-gcflags=-m` |
| Garbage collector | Go cleans up memory while your program keeps running | Concurrent mark and sweep, `GOGC`, `GOMEMLIMIT` |
| Growing stacks | Goroutines are cheap because their stacks start tiny and grow when needed | Why goroutines start small and how stacks grow |
| Inside a slice, a map, a channel | Each of these is a small header pointing at bigger data | Slice headers, map buckets, `hchan` |
| Struct layout and padding | Field order can change how much memory a struct uses | Alignment, `unsafe.Sizeof`, field ordering |

### Track 7. Building things
Put it all together and build real things: tests, streams with `io.Reader`, JSON, an HTTP server like
Express, modules, and what changed in newer Go.

| Lesson | Big idea | You will learn |
| --- | --- | --- |
| Testing, benchmarks, fuzzing | Tests are plain Go functions, and a table of cases replaces most test boilerplate | Table-driven tests, `t.Run`, `b.Loop`, fuzz tests |
| io.Reader and io.Writer | Two tiny interfaces let files, network connections and buffers all plug together | The two interfaces every stream implements |
| JSON and struct tags | Struct tags tell the JSON package what each field is called | `json:"name,omitempty"`, decoding, unknown fields |
| net/http server | The standard library already has a production-ready web server | Handlers, `ServeMux` patterns, middleware |
| Project layout and modules | A module is your `package.json`, and folder names carry meaning | `cmd/`, `internal/`, versions, workspaces |
| Newer Go | Recent versions fixed old gotchas and added range over ints and functions | Range over ints and functions, loop variable fix, recent additions |

## Lesson format

Every lesson has the same shape, so learners know what to expect:

1. **Coming from JS and TS**: the TypeScript code you'd write next to the Go version, plus three key facts.
2. **Teaching sections**: two to four short sections with code, comparisons and tables.
3. **Pitfalls**: where TS developers usually get stuck.
4. **Predict the output**: a multiple-choice question with a step trace.
5. **Challenge**: fill one blank in a program. A right answer marks the lesson complete.
6. **Remember this**: the takeaways.

All explanations follow the teaching rules in [TEACHING.md](TEACHING.md): why before how, the big idea in
one sentence, an analogy from JS or everyday life, example before rule, step-by-step breakdowns, and every
new term defined the first time it appears.

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
3. Write it to the rules in [TEACHING.md](TEACHING.md).
4. Run the Predict program and the Challenge (with each accepted answer) through `go run` to confirm the answers.
5. `pnpm build`.
