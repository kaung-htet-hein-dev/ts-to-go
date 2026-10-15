import type { LessonContent } from './types'

const testing: LessonContent = {
  id: 'testing',
  minutes: 16,
  lead: 'In JavaScript you install Jest or Vitest with npm, add a config file and import `expect`. Go ships testing with the language: a `testing` package in the standard library and a `go test` command. There are no matchers like `toBe` and no `describe` blocks. A test is a plain function, and a failed check is an `if` statement.',
  fromTs: {
    title: 'A test without a test framework',
    intro: 'Here is the same small test in both languages. The Go version lives in a file ending in `_test.go`, right next to the code it tests, and runs with `go test`. The `t *testing.T` parameter is a pointer to the test runner\'s state. You call methods on it to report failures.',
    ts: `import { expect, test } from "vitest";
import { add } from "./math";

test("adds two numbers", () => {
  expect(add(1, 2)).toBe(3);
});`,
    go: `package math

import "testing"

func TestAdd(t *testing.T) {
    got := Add(1, 2)
    if got != 3 {
        t.Errorf("Add(1, 2) = %d, want 3", got)
    }
}`,
    tsFile: 'math.test.ts',
    goFile: 'math_test.go',
    facts: [
      ['Names are the config', 'A file ending in `_test.go` holds tests. A function named `TestXxx(t *testing.T)` is a test. No config file needed.'],
      ['No assertion library', 'You compare with `if` and report with `t.Errorf`. You write the failure message yourself, so it says exactly what went wrong.'],
      ['Built into the toolchain', '`go test ./...` runs every test in the module (your whole project, like everything under one package.json). Add `-v` for names, `-run Add` to filter, and `-race` to catch data races.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Table-driven tests',
      title: 'One loop, many cases',
      blocks: [
        'In Vitest you might use `test.each` to run the same check with different inputs. In Go this is the default style, called a **table-driven test**. You write a slice of cases, loop over it, and give each case its own subtest with `t.Run`. Each case is a small anonymous struct, like a plain object `{ name, a, b, want }`.',
        {
          code: `func TestAdd(t *testing.T) {
    tests := []struct {
        name string
        a, b int
        want int
    }{
        {"small", 1, 2, 3},
        {"negative", -1, -1, -2},
        {"zero", 0, 0, 0},
    }
    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            got := Add(tc.a, tc.b)
            if got != tc.want {
                t.Errorf("got %d, want %d", got, tc.want)
            }
        })
    }
}`,
          file: 'math_test.go',
        },
        'Each `t.Run` shows up as its own result, like `TestAdd/negative`. You can run only that case with `go test -run TestAdd/negative`. Adding a new case is one new line in the table.',
        {
          table: {
            head: ['Call', 'What it does', 'Jest / Vitest feel'],
            rows: [
              ['`t.Errorf(...)`', 'Marks the test failed and **keeps going**', 'A soft assertion'],
              ['`t.Fatalf(...)`', 'Marks it failed and **stops this test now**', 'A normal `expect` that throws'],
              ['`t.Run(name, fn)`', 'Runs a named subtest', '`describe` / `test.each`'],
              ['`t.Helper()`', 'Reports failures at the caller\'s line', 'No direct match'],
              ['`t.Cleanup(fn)`', 'Runs `fn` when the test ends', '`afterEach`'],
            ],
          },
        },
      ],
    },
    {
      eyebrow: 'Benchmarks and fuzzing',
      title: 'Speed and random inputs, same tool',
      blocks: [
        'In Node you would reach for a separate benchmark library. Go puts benchmarks in the same `_test.go` file. A function named `BenchmarkXxx(b *testing.B)` runs your code many times and reports the time per call.',
        {
          code: `func BenchmarkAdd(b *testing.B) {
    for b.Loop() {
        Add(1, 2)
    }
}`,
          file: 'math_test.go',
        },
        'Run it with `go test -bench .`. The output looks like `BenchmarkAdd-12  811819243  1.55 ns/op`. That reads: the loop ran 811,819,243 times, at 1.55 nanoseconds per call. The `-12` is how many CPU cores Go was allowed to use. `b.Loop()` (new in Go 1.24) decides how many rounds to run. It also stops the compiler from deleting your call as unused work. Older code uses `for i := 0; i < b.N; i++`, which you will still see a lot.',
        '**Fuzzing** feeds generated, random inputs to your function to find crashes and broken rules. A `FuzzXxx(f *testing.F)` function gives a few seed inputs, and `go test -fuzz FuzzReverse` keeps mutating them until something breaks.',
        {
          code: `func FuzzReverse(f *testing.F) {
    f.Add("hello")
    f.Fuzz(func(t *testing.T, s string) {
        if Reverse(Reverse(s)) != s {
            t.Errorf("round trip failed for %q", s)
        }
    })
}`,
        },
        { note: 'When fuzzing finds a failing input, Go saves it under `testdata/fuzz/`. From then on, a plain `go test` re-runs it like a normal case, so the bug cannot come back silently.' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Using t.Fatal inside a goroutine', body: '`t.Fatal` stops the test by ending the goroutine that called it. If you call it from a goroutine you started, only that goroutine ends and the test keeps running. Use `t.Error` there, or send the result back to the test goroutine over a channel.' },
    { title: 'Forgetting the file name rule', body: 'A test in `math_tests.go` or `mathTest.go` is never run. The file must end exactly in `_test.go`, and the function must start with `Test` followed by a capital letter or nothing.' },
    { title: 'Expecting a mocking framework', body: 'There is no built-in `jest.mock`. Go code is usually tested by accepting an **interface** and passing a small fake struct in the test. That is one more reason Go functions take interfaces as parameters. See [Interfaces without "implements"](/lesson/interfaces).' },
  ],
  note: 'Tests in the same package (`package math`) can see unexported names, the lowercase ones that other packages cannot use. It is like a JS test that can reach functions you never exported from the module. If you want to test only the public API, name the test package `math_test`. Both can live in the same folder.',
  predict: {
    q: 'How many failure messages does go test print?',
    code: `func TestPredict(t *testing.T) {
    t.Errorf("first")
    t.Errorf("second")
    t.Fatalf("third")
    t.Errorf("fourth")
}`,
    options: ['1', '2', '3', '4'],
    answer: 2,
    why: '`t.Errorf` records a failure and keeps going, so "first" and "second" both print. `t.Fatalf` records "third" and then stops the test right away, so the line with "fourth" never runs. That is 3 messages.',
    trace: [
      ['line 2', 't.Errorf: "first", test marked failed, continue', 'wait'],
      ['line 3', 't.Errorf: "second", continue', 'wait'],
      ['line 4', 't.Fatalf: "third", stop this test now', 'err'],
      ['line 5', 'never runs', 'idle'],
      ['result', '--- FAIL: TestPredict with 3 messages', 'err'],
    ],
  },
  challenge: {
    title: 'Fill the blank to run each case as a subtest',
    prompt: 'This table-driven test should show each case as its own result, like `TestAdd/small`. Which method on `t` starts a named subtest?',
    code: `for _, tc := range tests {
    t.___(tc.name, func(t *testing.T) {
        if got := Add(tc.a, tc.b); got != tc.want {
            t.Errorf("got %d, want %d", got, tc.want)
        }
    })
}`,
    answers: ['Run'],
    success: '`t.Run` gives each case a name, its own pass or fail line, and its own `t`. A `t.Fatalf` inside one subtest stops only that case, and the loop moves on to the next.',
    wrong: [
      { answers: ['run'], title: 'Almost: capital R', body: 'Methods you can call from another package start with a capital letter in Go. It is `t.Run`.' },
      { answers: ['describe', 'test', 'it', 'each'], title: 'That is Jest', body: 'Go has no `describe` or `it`. The `*testing.T` value has a method for subtests. It starts with R.' },
    ],
    hint: 'The method name is a three-letter verb that starts with a capital R.',
  },
  recap: [
    'Tests live in `_test.go` files and are functions named `TestXxx(t *testing.T)`.',
    'Check with `if` and report with `t.Errorf` (keep going) or `t.Fatalf` (stop now).',
    'Table-driven tests plus `t.Run` are the normal Go style.',
    'Benchmarks (`BenchmarkXxx`, `b.Loop()`) and fuzz tests (`FuzzXxx`) use the same `go test` command.',
  ],
}

const io: LessonContent = {
  id: 'io',
  minutes: 15,
  lead: 'Node has readable and writable streams with events, pipes and backpressure. Go has two tiny interfaces, `io.Reader` and `io.Writer`, with one method each. Files, network connections, HTTP bodies, gzip and hashes all implement them, so they plug together like Lego.',
  fromTs: {
    title: 'Copy a file to the terminal',
    intro: 'Both programs stream a file to standard output (the terminal, `process.stdout` in Node) without loading the whole thing into memory. Node uses `pipe`. Go uses `io.Copy` between a reader and a writer.',
    ts: `import { createReadStream } from "node:fs";

const file = createReadStream("notes.txt");
file.pipe(process.stdout);
file.on("error", (err) => {
  console.error(err);
});`,
    go: `f, err := os.Open("notes.txt")
if err != nil {
    log.Fatal(err)
}
defer f.Close()

_, err = io.Copy(os.Stdout, f)
if err != nil {
    log.Fatal(err)
}`,
    tsFile: 'cat.ts',
    goFile: 'cat.go',
    facts: [
      ['One method each', 'A Reader has `Read(p []byte) (n int, err error)`. A Writer has `Write(p []byte) (n int, err error)`. A `[]byte` is a slice of bytes, close to a Node `Buffer` or a `Uint8Array`. There is nothing else to implement.'],
      ['No events', 'Instead of `on("data")` you call `Read` in a loop, a bit like `await reader.read()` on a web stream. `Read` blocks (waits, pausing only the current goroutine) until data is ready. That is fine because goroutines are cheap.'],
      ['Everything fits', '`*os.File`, `net.Conn`, `http.Request.Body`, `bytes.Buffer` and `strings.Reader` are all readers or writers. `io.Copy` works with any pair.'],
    ],
  },
  sections: [
    {
      eyebrow: 'How Read works',
      title: 'You bring the buffer',
      blocks: [
        'In Node a stream hands you a new `Buffer` for each chunk. In Go you pass your own byte slice to `Read`, and it fills **up to** `len(p)` bytes. It returns how many bytes it wrote in `n`. Always use `p[:n]` (the first `n` bytes, like `buf.subarray(0, n)`), never the whole buffer.',
        {
          code: `r := strings.NewReader("hello world")
buf := make([]byte, 4)

for {
    n, err := r.Read(buf)
    fmt.Printf("%q\\n", buf[:n])
    if err == io.EOF {
        break // no more data
    }
    if err != nil {
        log.Fatal(err)
    }
}`,
        },
        'When the data runs out, `Read` returns the error `io.EOF`. It is the normal end-of-stream signal, like the `"end"` event in Node. Readers return `io.EOF` itself, never wrapped in another error, so comparing with `==` is safe here.',
        { note: 'You rarely write this loop by hand. Helpers like `io.Copy`, `io.ReadAll` and `bufio.Scanner` do it for you. But knowing the loop makes every other API make sense.' },
      ],
    },
    {
      eyebrow: 'Composition',
      title: 'Wrap readers like middleware',
      blocks: [
        'Because the interfaces are tiny, you can wrap one reader in another. Each layer reads from the one below and transforms the bytes. This is Go\'s version of `stream.pipeline`. Below, `gzip.NewWriter(out)` wraps the file: bytes you write to `zw` get compressed, then passed on to `out`.',
        {
          compare: {
            ts: `import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

await pipeline(
  createReadStream("log.txt"),
  createGzip(),
  createWriteStream("log.gz"),
);`,
            go: `in, _ := os.Open("log.txt")
defer in.Close()
out, _ := os.Create("log.gz")
defer out.Close()

zw := gzip.NewWriter(out)
io.Copy(zw, in)
zw.Close() // flush the gzip footer`,
          },
        },
        {
          table: {
            head: ['You want to', 'Use'],
            rows: [
              ['Read everything into memory', '`io.ReadAll(r)`'],
              ['Read line by line', '`bufio.NewScanner(r)` then `sc.Scan()`'],
              ['Build a string in memory', '`var b strings.Builder` (a Writer)'],
              ['Write to two places at once', '`io.MultiWriter(w1, w2)`'],
              ['Stop after N bytes', '`io.LimitReader(r, n)`'],
              ['Print formatted text anywhere', '`fmt.Fprintf(w, ...)`'],
            ],
          },
        },
        'Look at the last row again. `fmt.Println` is the same as `fmt.Fprintln(os.Stdout, ...)`. Any function that takes an `io.Writer` can write to a file, a network socket, an HTTP response or a test buffer, without changing a line.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Using the whole buffer instead of buf[:n]', body: 'A `Read` can return fewer bytes than you asked for, even when more data is coming. If you use `buf` instead of `buf[:n]`, you print leftover bytes from the previous read.' },
    { title: 'Treating io.EOF as a failure', body: '`io.EOF` means "done". A `Read` may return data **and** `io.EOF` in the same call, so handle `n > 0` first, then check the error.' },
    { title: 'Forgetting to Close or Flush a writer', body: 'Buffered writers like `bufio.Writer` and `gzip.Writer` keep data in memory. If you skip `Flush` or `Close`, the end of your output is silently missing. Files also need `Close` to release the file handle (the open file the operating system keeps for you). Write `defer f.Close()` right after opening, as a habit.' },
  ],
  deepDive: {
    q: 'Why is io.Reader so small?',
    body: [
      'A Go proverb says "the bigger the interface, the weaker the abstraction". A one-method interface is easy to implement, so thousands of types implement it, and every helper that takes a Reader works with all of them.',
      'Compare with Node streams: a Readable has modes, events, `highWaterMark` and many methods. Implementing one correctly is hard. In Go, any type with a `Read` method that fills a byte slice is a Reader. You never write `implements`.',
    ],
  },
  predict: {
    code: `r := strings.NewReader("hello world")
buf := make([]byte, 4)

n, _ := r.Read(buf)
fmt.Println(n, string(buf[:n]))

n, _ = r.Read(buf)
fmt.Println(n, string(buf[:n]))`,
    options: ['4 hell / 4 o wo', '11 hello world / 0', '4 hell / 4 hell', '4 hell / 7 o world'],
    answer: 0,
    why: 'The buffer has room for 4 bytes, so each `Read` fills at most 4. The first call gets "hell". The reader remembers where it stopped, so the second call gets the next 4 bytes: "o wo".',
    trace: [
      ['line 2', 'buf has room for 4 bytes', 'idle'],
      ['line 4', 'Read fills buf with "hell", n = 4', 'run'],
      ['line 5', 'prints 4 hell', 'out'],
      ['line 7', 'Read continues from offset 4: "o wo", n = 4', 'run'],
      ['line 8', 'prints 4 o wo', 'out'],
    ],
  },
  challenge: {
    title: 'Fill the blank to print the file',
    prompt: '`io.Copy(dst, src)` copies from a reader to a writer. Send the file\'s contents to the terminal.',
    code: `f, err := os.Open("notes.txt")
if err != nil {
    log.Fatal(err)
}
defer f.Close()
io.Copy(___, f)`,
    answers: ['os.Stdout'],
    success: '`os.Stdout` is an `*os.File`, which is a Writer. `io.Copy` reads from `f` in chunks and writes each one to the terminal until it gets `io.EOF`.',
    wrong: [
      { answers: ['os.Stdin'], title: 'That is the input side', body: '`os.Stdin` is where the program reads keyboard input. You want the output stream.' },
      { answers: ['console.log', 'process.stdout', 'fmt'], title: 'Close, but that is not a Writer', body: 'You need a value that implements `io.Writer`. The terminal output in Go lives in the `os` package.' },
      { answers: ['os.Stderr'], title: 'That prints, but to the error stream', body: 'It would show up in the terminal, but `os.Stderr` is meant for errors and logs. Normal output goes to standard out.' },
    ],
    hint: 'The destination comes first. It is the standard output file from the `os` package.',
  },
  recap: [
    '`io.Reader` and `io.Writer` have one method each, and almost everything implements them.',
    'You pass the buffer to `Read`; always use `buf[:n]`.',
    '`io.EOF` means the stream ended normally.',
    'Compose with `io.Copy`, `bufio`, `gzip` and friends, and remember to `Close` or `Flush` writers.',
  ],
}

const json: LessonContent = {
  id: 'json',
  minutes: 15,
  lead: 'In JavaScript, `JSON.parse` gives you whatever object the text describes. You hope it has the shape you expect, or you add zod to check it. In Go you decode straight into a struct. The struct is the schema, and small **struct tags** say how each field maps to a JSON key.',
  fromTs: {
    title: 'Parse and print a user',
    intro: 'Same job in both languages: turn JSON text into a typed value and back. In Go the field names and the JSON keys are linked by tags written in backticks.',
    ts: `type User = {
  name: string;
  age?: number;
};

const u = JSON.parse(text) as User;
console.log(u.name);

const out = JSON.stringify({ name: "Ann" });`,
    go: `type User struct {
    Name string \`json:"name"\`
    Age  int    \`json:"age,omitempty"\`
}

var u User
err := json.Unmarshal(data, &u)
fmt.Println(u.Name)

out, err := json.Marshal(User{Name: "Ann"})`,
    facts: [
      ['The struct is the schema', 'JSON keys with no matching field are ignored. A wrong type, like a string where an `int` should be, returns an error.'],
      ['Tags rename fields', '`json:"name"` maps the Go field `Name` to the key `"name"`. Go fields are capitalized; JSON keys usually are not.'],
      ['Only exported fields', '`encoding/json` can only see fields that start with a capital letter. A capital letter is Go\'s `export`. Lowercase fields are skipped, silently.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Struct tags',
      title: 'The little string after a field',
      blocks: [
        'A struct tag is a string in backticks after the field type. The compiler ignores it. Packages read it while the program runs. The `json` package looks at the `json:"..."` part. The first word is the key. Options come after commas.',
        {
          table: {
            head: ['Tag', 'Effect when encoding'],
            rows: [
              ['`json:"name"`', 'Use the key `"name"`'],
              ['`json:"age,omitempty"`', 'Leave the key out if the value is `0`, `""`, `false`, `nil` or an empty slice or map'],
              ['`json:"at,omitzero"`', 'Leave it out if it is the zero value, including structs like `time.Time` (Go 1.24)'],
              ['`json:"-"`', 'Never encode or decode this field'],
              ['`json:"id,string"`', 'Encode a number as a JSON string, like `"42"`'],
            ],
          },
        },
        'Without a tag, the key is the exact field name, like `"Name"`. Decoding is forgiving and matches keys without caring about case, but encoding uses the exact name. Tags make both directions predictable.',
        { note: '`omitempty` does nothing for a struct field such as `time.Time`, because a struct is never "empty" by its rules. That is why Go 1.24 added `omitzero`, which checks for the zero value or calls an `IsZero()` method.' },
      ],
    },
    {
      eyebrow: 'Decoding safely',
      title: 'Validation you get for free',
      blocks: [
        'With zod you describe the shape once and check data against it at runtime. In Go the struct does part of that job. `Unmarshal` fails when a value has the wrong JSON type, so you never get a string sneaking into an `int` field.',
        {
          compare: {
            ts: `const Body = z.object({
  n: z.number(),
});

const r = Body.safeParse(
  JSON.parse('{"n":"5"}'),
);
console.log(r.success); // false`,
            go: `var body struct {
    N int \`json:"n"\`
}

err := json.Unmarshal(
    []byte(\`{"n":"5"}\`), &body)
fmt.Println(err)
// json: cannot unmarshal string
// into Go struct field .n of type int`,
          },
        },
        'What Go does **not** check: missing keys (the field keeps its zero value) and extra keys (ignored). For rules like "required" or "between 1 and 100", you write a normal `Validate()` method or `if` checks after decoding.',
        'For HTTP bodies and other streams, use `json.NewDecoder(r.Body).Decode(&v)` instead of reading everything first. `r.Body` is an `io.Reader`, covered in [io.Reader and io.Writer](/lesson/io). Call `dec.DisallowUnknownFields()` if extra keys should be an error.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Lowercase fields vanish', body: 'A field named `email` (lowercase) is unexported, so `json.Marshal` skips it and `Unmarshal` never fills it. No error, no warning. Capitalize the field and use a tag for the lowercase key.' },
    { title: 'Passing the struct instead of a pointer', body: '`json.Unmarshal(data, u)` cannot change `u`, because Go passes a copy of the struct. In JS an object argument is a shared reference; in Go it is not. It returns the error `json: Unmarshal(non-pointer main.User)`. Always pass `&u`.' },
    { title: 'Missing key or zero value?', body: 'After decoding, `Age == 0` could mean the JSON said `0` or had no `age` key at all. If the difference matters, use a pointer field `*int`. A pointer can be `nil` (Go\'s `null`), and it stays `nil` when the key is missing.' },
  ],
  predict: {
    code: `type User struct {
    Name  string \`json:"name"\`
    Age   int    \`json:"age,omitempty"\`
    email string
}

u := User{Name: "Ann", email: "a@x.io"}
b, _ := json.Marshal(u)
fmt.Println(string(b))`,
    options: [
      '{"name":"Ann","age":0,"email":"a@x.io"}',
      '{"name":"Ann","email":"a@x.io"}',
      '{"name":"Ann"}',
      '{"Name":"Ann"}',
    ],
    answer: 2,
    why: '`Name` uses its tag, so the key is "name". `Age` is 0 and has `omitempty`, so it is left out. `email` starts with a lowercase letter, so the json package cannot see it at all. Only `{"name":"Ann"}` is left.',
    trace: [
      ['Name', 'exported, tag says "name": "Ann"', 'run'],
      ['Age', 'value 0 and omitempty: skipped', 'wait'],
      ['email', 'unexported: invisible to encoding/json', 'idle'],
      ['output', '{"name":"Ann"}', 'out'],
    ],
  },
  challenge: {
    title: 'Fill the blank so decoding works',
    prompt: '`json.Unmarshal` needs to write into `u`. What do you pass as the second argument?',
    code: `data := []byte(\`{"name":"Bo","age":30}\`)

var u User
err := json.Unmarshal(data, ___)
if err != nil {
    log.Fatal(err)
}
fmt.Println(u.Name, u.Age) // Bo 30`,
    answers: ['&u'],
    success: '`&u` is a pointer to `u`, so `Unmarshal` can fill its fields in place. Any function that needs to change your variable takes a pointer. More in [Pointers](/lesson/pointers).',
    wrong: [
      { answers: ['u'], title: 'That passes a copy', body: 'Go passes arguments by value. `Unmarshal` would get a copy it cannot write back from, so it returns `json: Unmarshal(non-pointer main.User)`.' },
      { answers: ['*u'], title: 'That is the other direction', body: '`*` follows a pointer to get the value. `u` is not a pointer. You want the operator that **takes** an address.' },
    ],
    hint: 'Unmarshal needs the address of `u`, not its value.',
  },
  recap: [
    'Decode into a struct with `json.Unmarshal(data, &v)` or `json.NewDecoder(r).Decode(&v)`.',
    'Struct tags like `json:"name,omitempty"` control keys and when to skip fields.',
    'Only capitalized (exported) fields are encoded or decoded.',
    'Wrong types are errors; missing and extra keys are not. Validate the rest yourself.',
  ],
}

const http: LessonContent = {
  id: 'http',
  minutes: 18,
  lead: 'In Node you usually install Express or Fastify to get routing. In Go the standard `net/http` package is production ready. It has a router with methods and path parameters, and it needs no dependencies. It runs every request in its own goroutine, so requests can run at the same moment.',
  fromTs: {
    title: 'A JSON endpoint with a path parameter',
    intro: 'Both servers answer `GET /users/:id`. Since Go 1.22, the standard router understands the method and `{wildcards}` in the pattern, so it looks a lot like Express.',
    ts: `import express from "express";

const app = express();

app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(8080);`,
    go: `mux := http.NewServeMux()

mux.HandleFunc("GET /users/{id}",
    func(w http.ResponseWriter, r *http.Request) {
        id := r.PathValue("id")
        w.Header().Set("Content-Type",
            "application/json")
        json.NewEncoder(w).Encode(
            map[string]string{"id": id})
    })

log.Fatal(http.ListenAndServe(":8080", mux))`,
    tsFile: 'server.ts',
    goFile: 'server.go',
    facts: [
      ['No framework needed', '`http.ServeMux` handles methods and path wildcards. Many Go services use only the standard library.'],
      ['A handler is two arguments', '`w http.ResponseWriter` plays the role of `res`: you write the response to it. `r *http.Request` is the incoming request, like `req`. There is no `next`.'],
      ['One goroutine per request', 'The server starts a goroutine for each request. Unlike Node\'s single event loop, handlers can run at the same moment on different CPU cores. Slow code in one handler does not block others, but shared data needs a lock.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Routing',
      title: 'Patterns: method, path, wildcards',
      blocks: [
        'A pattern has an optional method, then a path. In Express the first matching route wins, so order matters. Go\'s router picks the **most specific** pattern, so the order you register them does not matter.',
        {
          table: {
            head: ['Pattern', 'Matches'],
            rows: [
              ['`GET /users/{id}`', '`GET /users/7`, and `HEAD` too. `r.PathValue("id")` is `"7"`'],
              ['`POST /users`', 'Only POST to exactly `/users`'],
              ['`/static/`', 'Any method, any path starting with `/static/`'],
              ['`GET /files/{path...}`', 'The rest of the path, slashes included'],
              ['`GET /{$}`', 'Only the root `/`, nothing below it'],
            ],
          },
        },
        'If the path matches but the method does not, the router replies `405 Method Not Allowed` with an `Allow` header. If nothing matches, you get `404`. You do not write that code yourself.',
        { pitfall: 'A pattern ending in `/`, like `/static/`, matches everything under it. That includes `/` itself: `"/"` is a catch-all. Use `/{$}` when you mean only the home page.' },
      ],
    },
    {
      eyebrow: 'Middleware',
      title: 'A function that wraps a handler',
      blocks: [
        'Express middleware calls `next()`. In Go, middleware is a function that takes a handler and returns a new handler. It is plain function wrapping, the same closure idea you know from JavaScript. `http.HandlerFunc(...)` is a type conversion: it turns a plain function into a value that has a `ServeHTTP` method.',
        {
          compare: {
            ts: `app.use((req, res, next) => {
  const start = Date.now();
  next();
  console.log(req.path,
    Date.now() - start);
});`,
            go: `func logged(h http.Handler) http.Handler {
    return http.HandlerFunc(
        func(w http.ResponseWriter,
            r *http.Request) {
            start := time.Now()
            h.ServeHTTP(w, r)
            log.Println(r.URL.Path,
                time.Since(start))
        })
}`,
          },
        },
        'Wrap the whole router: `http.ListenAndServe(":8080", logged(mux))`. Because `ServeHTTP` returns only after the handler finishes, the timing is correct without callbacks. Code after `h.ServeHTTP` runs the way code after `await next()` runs in Koa.',
        {
          list: [
            '`r.Context()` is cancelled when the client disconnects, like an `AbortSignal` that fires on its own. Pass it to database calls. See [context](/lesson/context).',
            'Set headers **before** `w.WriteHeader(code)` or the first `w.Write`. After that they are already sent.',
            'For real servers, build an `http.Server` with `ReadTimeout` and `WriteTimeout` instead of the bare `ListenAndServe`.',
          ],
        },
      ],
    },
    {
      eyebrow: 'Testing handlers',
      title: 'No port, no network',
      blocks: [
        'Like supertest in Node, `net/http/httptest` lets you call a handler directly. `httptest.NewRecorder()` is a fake `ResponseWriter` that records the status, headers and body.',
        {
          code: `req := httptest.NewRequest("GET", "/users/7", nil)
rec := httptest.NewRecorder()

mux.ServeHTTP(rec, req)

fmt.Println(rec.Code)          // 200
fmt.Println(rec.Body.String()) // {"id":"7"}`,
          file: 'server_test.go',
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Forgetting to return after an error', body: '`http.Error(w, "bad", 400)` writes a response but does not stop your function. Without a `return`, the handler keeps going and writes more. Express works the same way after `res.status(400).send()`. Always `return` right after it.' },
    { title: 'Shared state without a lock', body: 'Each request runs in its own goroutine, possibly on different CPU cores at the same time. A package-level map that handlers write to needs a `sync.Mutex`. In Node this could not happen, because all your JavaScript runs on one thread. See [Race conditions](/lesson/races).' },
    { title: 'Setting headers too late', body: 'Calling `w.Header().Set` after `w.Write` has no effect: the headers already went out with the first byte. The server logs "superfluous response.WriteHeader call" in a related case.' },
  ],
  predict: {
    q: 'What status code does the recorder get?',
    code: `mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}",
    func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, "user ", r.PathValue("id"))
    })

req := httptest.NewRequest("POST", "/users/7", nil)
rec := httptest.NewRecorder()
mux.ServeHTTP(rec, req)
fmt.Println(rec.Code)`,
    options: ['200', '404', '405', '500'],
    answer: 2,
    why: 'The path `/users/7` matches the pattern, but the method is POST and the pattern only allows GET (and HEAD). The router answers `405 Method Not Allowed` and sets `Allow: GET, HEAD`. The handler never runs.',
    trace: [
      ['line 2', 'register GET /users/{id}', 'idle'],
      ['line 7', 'request: POST /users/7', 'run'],
      ['router', 'path matches, method does not', 'wait'],
      ['router', 'reply 405, Allow: GET, HEAD', 'runtime'],
      ['line 10', 'prints 405', 'out'],
    ],
  },
  challenge: {
    title: 'Fill the blank to read the path parameter',
    prompt: 'The pattern is `GET /users/{id}`. Read the value of `{id}` from the request.',
    code: `mux.HandleFunc("GET /users/{id}",
    func(w http.ResponseWriter, r *http.Request) {
        id := r.___("id")
        fmt.Fprintf(w, "user %s", id)
    })`,
    answers: ['PathValue'],
    success: '`r.PathValue("id")` returns the text that matched `{id}`, as a string. Convert it yourself with `strconv.Atoi` if you need a number, and handle the error.',
    wrong: [
      { answers: ['params', 'Params', 'Param', 'params.id'], title: 'That is Express', body: 'Go has no `req.params` object. The request has a method that looks up one wildcard by name.' },
      { answers: ['URL.Query().Get', 'FormValue'], title: 'That reads the query string', body: 'That would read `?id=7`. The id here is part of the path, matched by the `{id}` wildcard.' },
    ],
    hint: 'The method name combines "path" and "value", both capitalized.',
  },
  recap: [
    '`http.NewServeMux` supports patterns like `GET /users/{id}`; read wildcards with `r.PathValue`.',
    'A handler gets `(w http.ResponseWriter, r *http.Request)`. Middleware wraps one handler in another.',
    'Each request runs in its own goroutine, so protect shared state.',
    'Test handlers with `httptest.NewRequest` and `httptest.NewRecorder`, no network needed.',
  ],
}

const modules: LessonContent = {
  id: 'modules',
  minutes: 14,
  lead: 'A Go **module** is like an npm package: a folder with a `go.mod` file that names it and lists its dependencies. Inside it, every folder is a **package**. Imports always use the full module path, never `./relative` paths, and there is no `node_modules`.',
  fromTs: {
    title: 'package.json versus go.mod',
    intro: 'Here is the project file for a small service in each world. The Go one is shorter because the toolchain already knows how to build, test and format.',
    ts: `{
  "name": "@acme/shop",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "zod": "^3.23.8"
  }
}`,
    go: `module example.com/shop

go 1.25

require github.com/google/uuid v1.6.0

tool golang.org/x/tools/cmd/stringer`,
    tsFile: 'package.json',
    goFile: 'go.mod',
    facts: [
      ['The module path is the name', '`module example.com/shop` is both the name and the prefix of every import, like `example.com/shop/cart`.'],
      ['Exact versions, no ranges', 'There is no `^` or `~`. Go picks the **minimum** version that satisfies everyone, never a newer release, so builds repeat without a lockfile like `package-lock.json`. `go.sum` stores checksums (fingerprints) of each download.'],
      ['No scripts section', '`go build`, `go test`, `go vet` and `gofmt` are the same in every project. Dev tools go in `tool` lines (Go 1.24) and run with `go tool`, like `npx`.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Layout',
      title: 'Folders are packages',
      blocks: [
        'Every folder is one package, and all `.go` files in it share the same `package` name. There is no `index.js` barrel file and no `export` keyword. A package exports every name that starts with a capital letter.',
        {
          code: `shop/
├── go.mod            module example.com/shop
├── main.go           package main
├── cart/
│   └── cart.go       package cart
└── internal/
    └── price/
        └── price.go  package price`,
          file: 'project tree',
        },
        {
          code: `package main

import (
    "fmt"

    "example.com/shop/cart"
)

func main() {
    fmt.Println(cart.Total())
}`,
          file: 'main.go',
        },
        'The `internal/` folder is special. Packages under it can only be imported by code inside the parent of `internal`. It is how you keep helpers private to your module. The compiler enforces it, so it is more than a naming convention.',
        {
          table: {
            head: ['Common folder', 'What goes there'],
            rows: [
              ['`/` (root)', 'Small projects: `main.go` and a few packages next to it'],
              ['`cmd/<app>/`', 'One `package main` per binary (a runnable program file), when you build several'],
              ['`internal/`', 'Code only this module may import'],
              ['`testdata/`', 'Fixtures for tests; ignored by the build'],
            ],
          },
        },
        { note: 'Start flat. A single folder with a few files is a perfectly normal Go project. Add packages only when the code asks for them. A `pkg/` folder in some template is no reason to add one.' },
      ],
    },
    {
      eyebrow: 'Commands',
      title: 'npm commands, translated',
      blocks: [
        {
          table: {
            head: ['npm / pnpm', 'Go'],
            rows: [
              ['`npm init`', '`go mod init example.com/shop`'],
              ['`npm install zod`', '`go get github.com/google/uuid@latest`'],
              ['`npm uninstall`, prune', '`go mod tidy` (adds missing, removes unused)'],
              ['`npx some-tool`', '`go tool some-tool` after `go get -tool`'],
              ['`npm update`', '`go get -u ./...`'],
              ['npm workspaces', '`go work init ./a ./b` (a `go.work` file)'],
            ],
          },
        },
        'Dependencies are downloaded once into a shared cache (`go env GOMODCACHE`), not copied into every project. You will run `go mod tidy` often: it is the one command that keeps `go.mod` and `go.sum` in sync with your imports.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Relative imports', body: '`import "./cart"` fails in a module with "relative import paths are not supported in module mode". Always use the full path: `module path + folder`, like `example.com/shop/cart`.' },
    { title: 'Folder name versus package name', body: 'The import path uses the folder; your code uses the package name declared in the files. Keep them the same to avoid confusion. A folder `cart` with `package shopping` inside works, but it confuses every reader.' },
    { title: 'Import cycles', body: 'If package `a` imports `b`, then `b` cannot import `a`. JavaScript allows circular imports. Go refuses to compile them. Move the shared piece into a third package, or define an interface where it is used.' },
  ],
  predict: {
    q: 'Which import line makes main.go compile?',
    code: `// go.mod
module example.com/shop

// cart/cart.go
package cart
func Total() int { return 6 }

// main.go
package main
import (
    "fmt"
    ??? // which one?
)
func main() { fmt.Println(cart.Total()) }`,
    options: ['"./cart"', '"cart"', '"example.com/shop/cart"', '"shop/cart"'],
    answer: 2,
    why: 'Imports are always the module path from `go.mod` plus the folder: `example.com/shop/cart`. `"./cart"` is rejected because relative imports are not allowed in modules. `"cart"` and `"shop/cart"` would be looked up as standard library packages and not found.',
    trace: [
      ['go.mod', 'module path is example.com/shop', 'idle'],
      ['cart/', 'folder becomes example.com/shop/cart', 'run'],
      ['main.go', 'import "example.com/shop/cart"', 'run'],
      ['build', 'compiles, prints 6', 'out'],
    ],
  },
  challenge: {
    title: 'Fill the blank in go.mod',
    prompt: 'The first line of `go.mod` declares the module path that every import starts with. Which keyword starts it?',
    code: `___ example.com/shop

go 1.25

require github.com/google/uuid v1.6.0`,
    answers: ['module'],
    success: '`module example.com/shop` names the module. `go mod init example.com/shop` writes this line for you. The path does not have to be a real website until you publish the module.',
    wrong: [
      { answers: ['package'], title: 'That goes in .go files', body: '`package` names one folder\'s package at the top of each Go file. `go.mod` names the whole module.' },
      { answers: ['name', '"name":'], title: 'That is package.json', body: 'go.mod is not JSON. It has a handful of keywords: one names the module, `go` sets the version, `require` lists dependencies.' },
    ],
    hint: 'The keyword is the same word as the file\'s purpose: it names the Go ___.',
  },
  recap: [
    '`go.mod` names the module and lists exact dependency versions; `go.sum` holds checksums.',
    'Every folder is a package; import it as `module/path/folder`, never with `./`.',
    '`internal/` hides packages from other modules, enforced by the compiler.',
    '`go mod tidy`, `go get`, `go tool` and `go work` replace most npm commands.',
  ],
}

const newer: LessonContent = {
  id: 'newer',
  minutes: 16,
  lead: 'Go changes slowly and on purpose, but the last few releases fixed old gotchas and added real features. If you read blog posts or code from before 2022, some advice is out of date. This lesson covers what changed from Go 1.22 to 1.25, and how your project picks which version\'s rules it gets.',
  fromTs: {
    title: 'Iterators: generators, the Go way',
    intro: 'JavaScript has generator functions with `function*` and `yield`. Since Go 1.23 you can `range` over a function. The function gets a `yield` callback and calls it for each value.',
    ts: `function* count(n: number) {
  for (let i = 0; i < n; i++) {
    yield i;
  }
}

for (const v of count(3)) {
  console.log(v);
}`,
    go: `func Count(n int) iter.Seq[int] {
    return func(yield func(int) bool) {
        for i := range n {
            if !yield(i) {
                return
            }
        }
    }
}

for v := range Count(3) {
    fmt.Println(v)
}`,
    facts: [
      ['yield is a plain function', 'Each `yield(v)` runs the loop body once. It returns `false` when the loop did `break`, and you must stop.'],
      ['iter.Seq is a function type', '`iter.Seq[int]` is a name for `func(yield func(int) bool)`. The `[int]` works like `<number>` in TypeScript generics. `maps.Keys` and `slices.Values` return these now.'],
      ['go.mod picks the rules', 'The `go 1.25` line in `go.mod` decides which language features your module can use. The Go version installed on your machine does not decide this.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Go 1.22',
      title: 'Loops got fixed',
      blocks: [
        'Two loop changes landed in Go 1.22. First, you can `range` over an integer: `for i := range 10` counts from 0 to 9. Second, and more important, each loop iteration now gets its **own** copy of the loop variable.',
        {
          code: `var fs []func()
for i := range 3 {
    fs = append(fs, func() { fmt.Print(i, " ") })
}
for _, f := range fs {
    f()
}
// Go 1.22+: 0 1 2
// before:  3 3 3 (with the old 3-clause loop)`,
        },
        'This is the same fix JavaScript made when it introduced `let` in `for` loops. Before 1.22, closures and goroutines started inside a loop all shared one variable, and people wrote `i := i` to work around it. You can delete those lines in modules on `go 1.22` or later.',
        'The same release upgraded `net/http` routing with methods and `{wildcards}`, covered in [net/http server](/lesson/http).',
      ],
    },
    {
      eyebrow: 'Go 1.23 to 1.25',
      title: 'Smaller things worth knowing',
      blocks: [
        {
          table: {
            head: ['Version', 'Change', 'Why you care'],
            rows: [
              ['1.23', 'Range over functions, `iter` package', 'Custom collections work with `for range`'],
              ['1.23', '`slices.Collect`, `maps.Keys` iterators', 'Fewer hand-written loops'],
              ['1.24', 'Generic type aliases', '`type Set[T comparable] = map[T]struct{}`'],
              ['1.24', '`b.Loop()` in benchmarks', 'Simpler, more accurate benchmarks'],
              ['1.24', '`omitzero` json tag', 'Skip zero `time.Time` and structs'],
              ['1.24', '`tool` lines in go.mod', 'Pin dev tools like `npx` without a tools.go'],
              ['1.25', '`sync.WaitGroup.Go`', 'Start a goroutine and track it in one call'],
              ['1.25', '`testing/synctest`', 'Test timers and timeouts with a fake clock'],
              ['1.25', 'Container-aware `GOMAXPROCS`', 'Uses the CPU limit of your container'],
            ],
          },
        },
        {
          compare: {
            ts: `await Promise.all(
  urls.map((u) => fetchOne(u)),
);`,
            go: `var wg sync.WaitGroup
for _, u := range urls {
    wg.Go(func() { fetchOne(u) })
}
wg.Wait()`,
          },
        },
        '`wg.Go` starts a goroutine and counts it. `wg.Wait()` blocks until every counted goroutine has finished, like `await Promise.all`. It replaces the old three steps of `wg.Add(1)`, `go func()` and `defer wg.Done()`, and it is harder to get wrong.',
        {
          code: `func TestTimeout(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        start := time.Now()
        time.Sleep(time.Hour) // returns instantly
        if time.Since(start) != time.Hour {
            t.Fatal("clock did not jump")
        }
    })
}`,
          file: 'wait_test.go',
        },
        'Inside `synctest.Test`, time is fake. Go calls the goroutines started inside it a bubble. When every goroutine in the bubble is blocked, the clock jumps forward. It is like `vi.useFakeTimers()`, but it also works with goroutines and channels.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Old go line in go.mod', body: 'The installed Go version is not what matters. If `go.mod` says `go 1.21`, then `for i := range 3` fails with "requires go1.22 or later (-lang was set to go1.21; check go.mod)". Bump the `go` line to use new features.' },
    { title: 'Ignoring yield\'s return value', body: 'If your iterator keeps calling `yield` after it returned `false`, the program panics because the loop already ended. Always write `if !yield(v) { return }`.' },
    { title: 'Copying outdated advice', body: 'Lines like `i := i` before a goroutine, or `for i := 0; i < b.N; i++` in benchmarks, are still valid but no longer needed. Recognize them when reading older code; write the newer form in new code.' },
  ],
  note: 'Go keeps a strong compatibility promise: code that compiled with Go 1.0 still compiles today. Upgrading the toolchain is usually safe. Behaviour changes, like the loop variable fix, only apply once you raise the `go` line in `go.mod`.',
  predict: {
    q: 'With go 1.25 in go.mod, what does this print?',
    code: `var fs []func()
for i := range 3 {
    fs = append(fs, func() {
        fmt.Print(i, " ")
    })
}
for _, f := range fs {
    f()
}`,
    options: ['0 1 2', '3 3 3', '2 2 2', 'It does not compile'],
    answer: 0,
    why: 'Since Go 1.22, each iteration has its own `i`. Every closure captures a different variable, holding 0, 1 and 2. Ranging over the integer 3 is also valid since 1.22.',
    trace: [
      ['iter 0', 'new i = 0, closure captures it', 'run'],
      ['iter 1', 'new i = 1, closure captures it', 'run'],
      ['iter 2', 'new i = 2, closure captures it', 'run'],
      ['line 7', 'call each closure in order', 'run'],
      ['output', '0 1 2', 'out'],
    ],
  },
  challenge: {
    title: 'Fill the blank to make the iterator work',
    prompt: 'This iterator should hand each number to the loop body and stop early if the loop breaks. What function does it call?',
    code: `func Count(n int) iter.Seq[int] {
    return func(yield func(int) bool) {
        for i := range n {
            if !___(i) {
                return
            }
        }
    }
}`,
    answers: ['yield'],
    success: '`yield(i)` runs the body of the `for v := range Count(n)` loop with `v = i`. If the body hits `break`, `yield` returns `false` and the iterator returns, so the loop stops early.',
    wrong: [
      { answers: ['return'], title: 'That would end the function', body: '`return` is a keyword, not a function you can call with a value here. The iterator hands values out through its callback parameter.' },
      { answers: ['fmt.Println', 'Println'], title: 'That prints instead of handing over', body: 'The iterator should not decide what to do with each value. It passes the value to the loop body through the callback.' },
    ],
    hint: 'Look at the name of the parameter on line 2. It is the same word as in a JavaScript generator.',
  },
  recap: [
    'Since Go 1.22, loop variables are per iteration, and `for i := range n` counts to n.',
    'Since Go 1.23, `for range` works over functions; write iterators with a `yield` callback.',
    'Go 1.24 and 1.25 added `b.Loop`, `omitzero`, `tool` lines, `wg.Go` and `testing/synctest`.',
    'The `go` line in `go.mod` decides which language rules your code gets.',
  ],
}

export const BUILDING: LessonContent[] = [testing, io, json, http, modules, newer]
