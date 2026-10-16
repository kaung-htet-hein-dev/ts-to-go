import type { LessonContent } from './types'

const differs: LessonContent = {
  id: 'differs',
  minutes: 12,
  lead: 'Go looks a bit like JavaScript with types and fewer symbols, so it is easy to assume it works the same way. It does not. Your code becomes one program file that runs without Node. There are no classes. Errors come back as ordinary return values instead of being thrown. This lesson gives you a map of what changes, what stays the same, and what you can stop worrying about.',
  fromTs: {
    title: 'The same small program, twice',
    intro: 'Here is a tiny program in both languages. It parses a number from a string and prints that number plus one. Read the Go side slowly, because almost every line shows one of the big differences.',
    ts: `function main() {
  const n = Number.parseInt("41", 10);
  if (Number.isNaN(n)) {
    throw new Error("bad number");
  }
  console.log(n + 1);
}

main();`,
    go: `package main

import (
    "fmt"
    "strconv"
)

func main() {
    n, err := strconv.Atoi("41")
    if err != nil {
        panic(err)
    }
    fmt.Println(n + 1)
}`,
    facts: [
      ['Compiled ahead of time', '`go build` turns your code into one native **binary**: a file of machine code that your CPU runs directly. The server needs no Node and no `node_modules`. You copy the file and run it.'],
      ['Errors are return values', '`strconv.Atoi` returns two values: the number and an `error`. You check `err != nil` on the next line. In JS you would reach for `try/catch` here.'],
      ['Every file starts with a package', '`package main` plus `func main()` marks the entry point, like the `"main"` field in package.json. Statements live inside functions. Outside them you can only declare things, so a Go file has no loose top-level code the way a JS module does.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The big picture',
      title: 'What changes when you leave TypeScript',
      blocks: [
        { note: 'TypeScript checks types and then throws them away. Go checks types and then keeps them, all the way into a compiled program.', title: 'In one sentence' },
        'TypeScript is JavaScript with types added on top. When you compile, the types are deleted, and plain JavaScript runs in Node or the browser.',
        'Go works another way. The Go **compiler** (a program that translates your source code before it runs) checks the types and turns your code straight into machine code. Values keep their types while the program runs.',
        {
          table: {
            head: ['Topic', 'TypeScript', 'Go'],
            rows: [
              ['Running code', '`tsc` then `node`, or `tsx`', '`go run .` or `go build` then run the binary'],
              ['Types', 'Erased after compile', 'Checked at compile time and kept at runtime'],
              ['Objects', 'Classes, `extends`, `this`', 'Structs with methods, no inheritance'],
              ['Interfaces', 'Structural (shape-based, type-only)', 'Also shape-based, and you never write `implements`'],
              ['Errors', '`throw` and `try/catch`', 'Return an `error` value and check it'],
              ['Concurrency', 'One thread with an event loop, `async/await`', 'Goroutines (functions running at the same time) spread over many threads, plus channels'],
              ['Missing value', '`undefined` and `null`', 'Every type has a default **zero value** (`0`, `""`, `false`); `nil` only for some types'],
              ['Formatting', 'Prettier, configured per project', '`gofmt`, one style for everybody'],
            ],
          },
        },
        'You might wonder why Go has so few options. It removes choices on purpose: one loop keyword, one formatting style, one way to handle errors.',
        'That feels limiting for about a week. After that it feels calm, because every Go codebase you open reads the same way.',
      ],
    },
    {
      eyebrow: 'Strict compiler',
      title: 'The compiler refuses unused things',
      blocks: [
        'In JavaScript an unused variable is an ESLint warning at most. In Go it is a **compile error**: the build stops and you get no program. An unused import is an error too.',
        {
          code: `package main

import (
    "fmt"
    "os" // error: "os" imported and not used
)

func main() {
    x := 10 // error: declared and not used: x
    fmt.Println("hello")
}`,
          file: 'main.go',
        },
        'Why be this strict? Leftover variables and imports are often a sign of a half-finished change. Refusing them keeps code clean. In practice you rarely notice, because your editor adds and removes imports for you on save.',
        'To ignore a value on purpose, assign it to the **blank identifier** `_`. It is a write-only name that throws the value away, like the empty slot in `const [, b] = arr`.',
        { code: `_, err := strconv.Atoi("12") // we only care about the error` },
        { note: 'Unused function parameters and unused package-level variables are allowed. The rule is only about local variables and imports.' },
      ],
    },
    {
      eyebrow: 'What you can drop',
      title: 'Things you will not miss',
      blocks: [
        'A lot of everyday JavaScript and TypeScript setup has no Go equivalent. The language decided these things up front, so you don\'t have to:',
        {
          list: [
            'No bundler, no Babel, no `tsconfig.json`. The `go` command builds, tests and formats.',
            'No semicolons to argue about. The compiler inserts them, and `gofmt` formats everything.',
            'No `this` binding surprises. Inside a method, the value it was called on (the **receiver**) is a normal named parameter, so passing a method as a callback never loses it.',
            'No `==` versus `===`. There is one `==`, and it never converts types.',
            'No automatic number conversions. Go has separate types for whole numbers (`int`) and decimals (`float64`). Adding one to the other does not compile until you convert one side.',
          ],
        },
        'Here is that last point in code. In TS, `3 + 0.5` just works. In Go you say out loud that the whole number should become a decimal:',
        {
          compare: {
            ts: `const a: number = 3;
const b: number = 0.5;
console.log(a + b); // 3.5`,
            go: `a := 3      // int
b := 0.5    // float64
fmt.Println(float64(a) + b) // 3.5`,
          },
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Looking for try/catch', body: 'There is no `try`. A function that can fail returns an `error` as its last result, and the caller checks it with `if err != nil`. `panic` exists, but it is for real bugs, like reading past the end of a slice. An expected problem such as "file not found" is an ordinary error. You will learn both in [Errors as values](/lesson/errors).' },
    { title: 'Expecting classes', body: 'Go has no `class` keyword. You define a `struct` (a fixed set of named fields, like an object whose keys are decided in advance) and attach methods to it. To share behaviour, you put one struct inside another or use interfaces. There is no `extends`. See [Structs and embedding](/lesson/structs).' },
    { title: 'Mixing number types', body: '`int`, `int64` and `float64` are different types, while JavaScript has one `number` type for everything. Go makes you convert explicitly, like `float64(n)`. If you forget, the compiler error says "mismatched types".' },
  ],
  note: 'You do not need to unlearn JavaScript. Interfaces still match by shape, as in TypeScript. Closures still capture variables, and functions are still values you can pass around. Most of your instincts carry over.',
  deepDive: {
    q: 'Why does a Go binary not need a runtime installed?',
    body: [
      'Go does have a **runtime**: support code every program needs. It includes the garbage collector (which frees memory you no longer use, as JS engines do), the goroutine scheduler, maps and channels.',
      'The difference is where it lives. Node is a runtime you install separately. Go compiles its runtime **into** your binary.',
      'That is why a Hello World binary is around 2 MB. It is also why you can build a Linux binary on a Mac with `GOOS=linux GOARCH=amd64 go build`, and the output runs on any amd64 Linux machine with no setup. (`GOARCH` picks the CPU type. Leave it out and you get your Mac\'s CPU type.)',
    ],
  },
  predict: {
    code: `package main

import "fmt"

func main() {
    x := 5
    fmt.Println("hi")
}`,
    options: ['hi', 'hi 5', 'It does not compile', 'It prints nothing'],
    answer: 2,
    why: 'The program never gets to run. `x` is declared on line 6 and never read. In Go that is a compile error ("declared and not used: x"), so the build stops before anything prints. To fix it, delete the line, use `x`, or assign it to `_`.',
    trace: [
      ['compile', 'go build checks main.go before running anything', 'idle'],
      ['line 6', 'x := 5 declares x', 'run'],
      ['line 7', 'x is never read anywhere', 'wait'],
      ['error', './main.go:6:5: declared and not used: x', 'err'],
    ],
  },
  challenge: {
    title: 'Fill the blank so the error check works',
    prompt: '`strconv.Atoi` returns a number and an error. If parsing failed, the program should print the error and stop. Which operator goes in the blank?',
    code: `n, err := strconv.Atoi("41")
if err ___ nil {
    fmt.Println("bad number:", err)
    return
}
fmt.Println(n + 1)`,
    answers: ['!='],
    success: '`err != nil` reads as "there is an error". When parsing works, `err` is `nil`, the block is skipped, and `42` prints. You will see this line thousands of times in Go code, and soon you will type it without thinking.',
    wrong: [
      { answers: ['=='], title: 'That flips the check', body: 'With `==`, the block runs when `err` is `nil`, which means parsing **worked**. So the program would print "bad number" on success. A non-nil error is the signal that something went wrong.' },
      { answers: ['!==', '==='], title: 'That is TypeScript', body: 'Go has only `==` and `!=`. There is no strict and loose version, because Go never converts types when comparing.' },
    ],
    hint: 'You want to enter the block when there **is** an error. In Go, "there is an error" means the error is not nil.',
  },
  recap: [
    'Go compiles to a single native binary, and the runtime is inside it.',
    'Unused local variables and unused imports are compile errors. Use `_` to discard a value on purpose.',
    'Errors are values returned from functions. Check them with `if err != nil`.',
    'No classes, no `this`, no `===`, no automatic number conversions.',
  ],
}

const toolchain: LessonContent = {
  id: 'toolchain',
  minutes: 14,
  lead: 'In a JavaScript project you assemble your tools yourself: npm, a bundler, Prettier, ESLint, Jest, and `tsc` if you use TypeScript. Getting them to agree takes time. Go ships one program, `go`, that does all of these jobs. Learn six subcommands and you can build, format, check and test any Go project.',
  fromTs: {
    title: 'Your package.json scripts, as one command',
    intro: 'On the left are the commands a typical Node project runs, the kind you put in `package.json` scripts. On the right is how you do the same jobs in Go. You install Go itself and nothing else.',
    tsFile: 'terminal',
    goFile: 'terminal',
    ts: `npm init -y
npm install zod
npx tsx src/index.ts
npx tsc && node dist/index.js
npx prettier --write .
npx eslint .
npx vitest`,
    go: `go mod init example.com/hello
go get github.com/google/uuid
go run .
go build -o hello . && ./hello
go fmt ./...
go vet ./...
go test ./...`,
    facts: [
      ['One tool, no config', 'Formatting, building, testing and dependency management are all `go` subcommands. There is no config file for your team to agree on.'],
      ['go.mod is package.json', '`go mod init` creates `go.mod`, which names your module and lists its dependencies, like `package.json`. `go.sum` plays the role of `package-lock.json`.'],
      ['`./...` means "everything"', 'The pattern `./...` matches the current folder and every folder below it. You will type it a lot.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Start a project',
      title: 'go mod init and go run',
      blocks: [
        { note: '`go mod init` is your `npm init`, and `go run .` is your `tsx index.ts`.', title: 'In one sentence' },
        'Every Go project is a **module**: a folder with a `go.mod` file at the top, the way a Node project has a `package.json`.',
        'The module name is usually where the code will live, like a GitHub path. You might wonder if that path has to exist. It does not. It is only a name for now.',
        {
          code: `$ mkdir hello && cd hello
$ go mod init example.com/hello
go: creating new go.mod: module example.com/hello`,
          file: 'terminal',
        },
        { code: `module example.com/hello

go 1.25.0`, file: 'go.mod' },
        'Now add a `main.go` and run it with `go run .`. Here is what that command does:',
        { list: [
          'It compiles the package in the current folder into a temporary **binary** (an executable file of machine code).',
          'It runs that binary.',
          'It deletes the binary when the program exits.',
        ], ordered: true },
        'It feels about as fast as `tsx`, because the Go compiler is very quick.',
        { code: `package main

import "fmt"

func main() {
    fmt.Println("hello, gopher")
}`, file: 'main.go' },
      ],
    },
    {
      eyebrow: 'Build and ship',
      title: 'go build gives you one file',
      blocks: [
        '`go build` writes a real executable that stays on disk. There is no `dist` folder full of JavaScript and no `node_modules` to copy. The binary includes your code, every dependency, and the Go runtime.',
        { note: 'A Node app is like shipping a recipe plus a kitchen (Node) plus all the ingredients (`node_modules`). A Go binary is the finished meal in one box.', title: 'Think of it like this' },
        {
          code: `$ go build -o hello .
$ ./hello
hello, gopher

# build for a Linux server from a Mac
$ GOOS=linux GOARCH=amd64 go build -o hello .`,
          file: 'terminal',
        },
        { note: 'Cross-compiling is built in. Set `GOOS` (the operating system) and `GOARCH` (the CPU type), and you get a binary for another system. This is why Go is popular for CLIs and containers: the Docker image can be almost empty.' },
      ],
    },
    {
      eyebrow: 'Keep it clean',
      title: 'gofmt, go vet and go test',
      blocks: [
        'Three commands keep code healthy. Most editors run the first two on save. The table maps each one to the JavaScript tool you already know.',
        {
          table: {
            head: ['Command', 'JavaScript cousin', 'What it does'],
            rows: [
              ['`go fmt ./...`', 'Prettier', 'Rewrites files into the one official style. Tabs, spacing, alignment. No options.'],
              ['`go vet ./...`', 'ESLint', 'Finds code that compiles but is almost surely wrong, like a bad `Printf` format.'],
              ['`go test ./...`', 'Vitest / Jest', 'Runs every `TestXxx` function in files ending with `_test.go`.'],
              ['`go get pkg@v1.2.3`', '`npm install`', 'Adds or upgrades a dependency in `go.mod`.'],
              ['`go mod tidy`', '`npm prune`', 'Adds missing and removes unused dependencies.'],
            ],
          },
        },
        'Why do you need `go vet` if the compiler is already strict? Some mistakes are valid Go but still wrong. Here the program compiles and runs, but prints the wrong output:',
        {
          code: `fmt.Printf("%d\\n", "hi")

// $ go vet .
// fmt.Printf format %d has arg "hi" of wrong type string`,
        },
        { pitfall: 'Go has no built-in watch mode like `nodemon` or `tsx watch`. For quick feedback, rerun `go run .`, or use a tool like `air` for servers. Compiling is fast enough that most people rerun by hand.', title: 'No watch mode' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Running a single file in a multi-file package', body: '`go run main.go` compiles only that one file. If `main.go` calls a function from `util.go` in the same folder, you get "undefined". Use `go run .` to compile the whole package.' },
    { title: 'Using go install to add a dependency', body: '`go install` builds a **program** and puts it in `~/go/bin`, like `npm install -g`. It does not touch your project. To add a library to your project, use `go get`.' },
    { title: 'Editing go.sum by hand', body: '`go.sum` holds checksums (fingerprints that prove a download was not changed) of every dependency, like `package-lock.json`. Commit it, but never edit it. If it gets out of sync, run `go mod tidy`.' },
  ],
  note: 'Install the official Go extension for your editor. It runs `gopls`, the Go language server, which formats on save, fixes imports and shows `go vet` warnings inline. You get the same autocomplete and inline errors you are used to for TypeScript in VS Code.',
  predict: {
    q: 'What does go run print?',
    code: `package main

import "fmt"

func main() {
    fmt.Printf("%d\\n", "hi")
}`,
    options: ['hi', '%!d(string=hi)', 'It does not compile', 'panic: bad format'],
    answer: 1,
    why: 'The compiler does not check `Printf` format strings, so the program builds and runs. At runtime, `%d` asks for a number but gets a string. Instead of crashing, `fmt` prints the marker `%!d(string=hi)` to show the verb did not match the value. `go vet` would have caught this before you ran it.',
    trace: [
      ['compile', 'types are fine: Printf accepts any values', 'idle'],
      ['line 6', '%d expects a number but gets a string', 'wait'],
      ['fmt', 'writes an error marker instead of crashing', 'runtime'],
      ['stdout', '%!d(string=hi)', 'out'],
    ],
  },
  challenge: {
    title: 'Add a dependency',
    prompt: 'You created a module and want to use the `uuid` library from GitHub. Which `go` subcommand adds it to `go.mod`?',
    code: `$ go mod init example.com/hello
$ go ___ github.com/google/uuid
$ go run .`,
    answers: ['get'],
    success: '`go get` does three things: it downloads the module, records the version in `go.mod`, and records its checksum in `go.sum`. To pin a specific version, add it at the end: `go get github.com/google/uuid@v1.6.0`.',
    wrong: [
      { answers: ['install'], title: 'Close, but that installs a program', body: '`go install` builds a command and puts the binary in `~/go/bin`, like `npm install -g`. It does not change your project. Libraries are added with a different subcommand.' },
      { answers: ['add', 'i'], title: 'That is npm or pnpm', body: 'The `go` tool has no `add` or `i` subcommand. Think "go and fetch it".' },
      { answers: ['mod tidy', 'mod'], title: 'Almost', body: '`go mod tidy` adds missing modules, but only once your code already imports them. To add one explicitly from the terminal, there is a shorter command.' },
    ],
    hint: 'The subcommand is a three-letter English verb meaning "fetch".',
  },
  recap: [
    '`go mod init` starts a module. `go.mod` and `go.sum` are your package.json and lockfile.',
    '`go run .` compiles and runs the package in this folder. `go build` writes one binary you can ship.',
    '`go fmt`, `go vet` and `go test` replace Prettier, a linter and a test runner.',
    '`go get` adds libraries to your project. `go install` installs programs.',
  ],
}

const packages: LessonContent = {
  id: 'packages',
  minutes: 14,
  lead: 'In JavaScript every file is a module, and you choose what to share with `export`. In Go the unit of code is the **package**, which is a whole folder. A name is exported when it starts with a capital letter. That one rule replaces every `export` keyword you have ever typed.',
  fromTs: {
    title: 'export becomes a capital letter',
    intro: 'Here is a tiny greeting helper and the code that uses it. Look for two things: what Go does instead of `export`, and how the import names a folder rather than a file.',
    tsFile: 'greet.ts + index.ts',
    goFile: 'greet/greet.go + main.go',
    ts: `// greet.ts
export function hello(name: string) {
  return prefix() + name;
}
function prefix() {
  return "Hello, ";
}

// index.ts
import { hello } from "./greet";
console.log(hello("Gopher"));`,
    go: `// greet/greet.go
package greet

func Hello(name string) string {
    return prefix() + name
}
func prefix() string {
    return "Hello, "
}

// main.go
import "example.com/hello/greet"
fmt.Println(greet.Hello("Gopher"))`,
    facts: [
      ['Capital means public', '`Hello` is visible outside the package. `prefix` starts lowercase, so only code in package `greet` can call it.'],
      ['A package is a folder', 'All `.go` files in one folder share one package. They see each other\'s names without importing anything.'],
      ['You always write the package name', 'You call `greet.Hello`, never a bare `Hello`. There are no named imports like `{ hello }`.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Folders and files',
      title: 'One folder, one package',
      blocks: [
        { note: 'In Go, the folder is the module boundary, not the file.', title: 'In one sentence' },
        'In JavaScript, two files in the same folder are strangers until one imports the other. In Go, every file in a folder belongs to the same package, and they all share one scope.',
        { note: 'A Go package is like one big JS file that you happen to split into several files for readability. Everything in it can see everything else.', title: 'Think of it like this' },
        {
          code: `hello/
├── go.mod          module example.com/hello
├── main.go         package main
└── greet/
    ├── greet.go    package greet
    └── format.go   package greet  (sees greet.go)`,
          file: 'project layout',
        },
        'Two names matter here, and they are easy to mix up:',
        { list: [
          'The **import path** is the module name plus the folder path: `example.com/hello/greet`. You write it in the `import` line.',
          'The **package name** is the `package` line at the top of the files: `greet`. You write it in code, as in `greet.Hello`. By convention it matches the folder name.',
        ] },
        { note: 'Folders cannot import each other in a circle. If `a` imports `b`, then `b` cannot import `a`, and the compiler rejects it. JavaScript allows circular imports, but one file can then see a value that is still `undefined`, because the other file has not finished running. Go\'s rule saves you that trouble.' },
      ],
    },
    {
      eyebrow: 'Visibility',
      title: 'Exported names work everywhere, not only functions',
      blocks: [
        'The capital-letter rule applies to everything at the top level of a package: functions, types, constants and variables. It applies to struct fields and methods too.',
        {
          code: `package user

type User struct {
    Name  string // exported: other packages can read it
    email string // unexported: only package user sees it
}

func New(name, email string) User { ... } // exported
func (u User) Email() string { ... }    // exported method
const maxLen = 64                       // unexported`,
        },
        'Here is how the TypeScript keywords you know map onto that one rule:',
        {
          table: {
            head: ['TypeScript', 'Go'],
            rows: [
              ['`export function parse()`', '`func Parse()`'],
              ['`function parse()` (not exported)', '`func parse()`'],
              ['`private email: string` in a class', '`email string` field in a struct'],
              ['`export default`', 'No such thing. Every export has a name.'],
            ],
          },
        },
        { pitfall: 'The `encoding/json` package (Go\'s version of `JSON.stringify` and `JSON.parse`) can only see exported fields. So a struct with only lowercase fields marshals (encodes) to `{}`. You will meet this again in [JSON and struct tags](/lesson/json).', title: 'Lowercase fields are invisible to JSON' },
      ],
    },
    {
      eyebrow: 'Imports',
      title: 'Importing and naming',
      blocks: [
        'Standard library packages have short paths like `"fmt"` or `"net/http"`. Third-party packages use their full module path. You group them in one `import ( ... )` block, and `gofmt` sorts them for you.',
        {
          compare: {
            ts: `import fs from "node:fs";
import * as path from "node:path";
import { v4 as uuid } from "uuid";

const id = uuid();`,
            go: `import (
    "os"
    "path/filepath"

    gid "github.com/google/uuid"
)

id := gid.NewString()`,
          },
        },
        'Writing a name before the path (`gid` above) renames the package in this file. Use it only to avoid a clash.',
        'Normally you write `uuid.NewString()`, and the package name becomes part of how the code reads: `http.Get`, `strings.Split`, `json.Marshal`.',
        'Three more rules you will run into:',
        { list: [
          '**internal/** folders are private. Code under `foo/internal/` can only be imported by code inside `foo/`. It works like `private`, but for a whole package.',
          '**init()** functions run automatically, once, before `main`. Keep them rare, because explicit setup is easier to follow.',
          'Package-level `var` declarations are set before any `init()` runs.',
        ] },
      ],
    },
  ],
  pitfalls: [
    { title: 'Naming things twice', body: 'Callers always write the package name, so do not repeat it in the name: `user.New`, not `user.NewUser`; `http.Client`, not `http.HTTPClient`. Go calls this **stutter**, and the style guides avoid it.' },
    { title: 'Making a utils package', body: 'A package named `utils`, `common` or `helpers` tells the reader nothing at the call site: what does `utils.Parse(x)` parse? Name packages after what they provide, like `slug` or `money`.' },
    { title: 'Different package names in one folder', body: 'Every `.go` file in a folder must declare the same package name. The only exception is test files, which may use `foo_test` to test the package from the outside.' },
  ],
  deepDive: {
    q: 'In what order does a Go program start up?',
    body: [
      'Startup happens in a fixed order:',
      '1. Every imported package is initialized, deepest dependencies first, each one exactly once.',
      '2. Inside each package, package-level variables are set in dependency order (a variable that uses another waits for it).',
      '3. Then each `init()` function in that package runs, in the order the files are given to the compiler.',
      '4. Only after all of that does `main.main` run.',
      'There is no lazy loading like a dynamic `import()`. Everything is linked into the binary up front.',
    ],
  },
  predict: {
    q: 'In what order are the lines printed?',
    code: `package main

import "fmt"

var x = initX()

func initX() int {
    fmt.Println("var")
    return 1
}

func init() {
    fmt.Println("init")
}

func main() {
    fmt.Println("main")
}`,
    options: ['var, init, main', 'init, var, main', 'main only', 'init, main, var'],
    answer: 0,
    why: 'Go follows a fixed startup order. First, package-level variables get their values, so `x = initX()` runs and prints "var". Second, `init()` runs automatically and prints "init". Last, `main` starts and prints "main". Each `Println` puts its text on its own line.',
    trace: [
      ['line 5', 'package var x needs a value: call initX()', 'run'],
      ['line 8', 'var', 'out'],
      ['line 12', 'init() runs automatically, before main', 'run'],
      ['line 13', 'init', 'out'],
      ['line 17', 'main', 'out'],
    ],
  },
  challenge: {
    title: 'Export the function',
    prompt: '`main.go` calls `greet.Hello("Gopher")`, but the build fails with "undefined: greet.Hello". Fill in the function name so the call works.',
    code: `// greet/greet.go
package greet

func ___(name string) string {
    return "Hello, " + name
}

// main.go
fmt.Println(greet.Hello("Gopher"))`,
    answers: ['Hello'],
    success: 'A capital first letter exports the name. `Hello` is now part of package `greet`\'s public API, so `main` can call it as `greet.Hello`.',
    wrong: [
      { answers: ['hello'], title: 'Lowercase stays private', body: '`hello` is only visible inside package `greet`. That is exactly why the build failed. Other packages can only use names that start with a capital letter.' },
      { answers: ['exportHello', 'export Hello', 'pub Hello', 'public Hello'], title: 'Go has no export keyword', body: 'Visibility comes from the first letter of the name, nothing else. The caller writes `greet.Hello`, so the name must be exactly that.' },
    ],
    hint: 'Look at how the caller writes it: `greet.Hello`. The name must match exactly, including the first letter.',
  },
  recap: [
    'A package is a folder. All files in it share one scope.',
    'Names starting with a capital letter are exported. Lowercase names are private to the package.',
    'Callers always write the package name: `greet.Hello`. Name things so that reads well.',
    'Startup order: package vars first, then `init()`, then `main()`.',
  ],
}

export const START: LessonContent[] = [differs, toolchain, packages]
