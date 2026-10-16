import type { LessonContent } from './types'

const scheduler: LessonContent = {
  id: 'scheduler',
  minutes: 16,
  lead: 'Why does Go let you write plain blocking code when Node makes you write `await` everywhere? The answer is the scheduler. Node runs your JavaScript on one **thread** (one line of work the operating system can put on a CPU core), and the event loop picks what runs next. Go runs thousands of goroutines on a handful of OS threads. A **scheduler** built into your compiled program decides which goroutine runs on which thread. You never call it yourself, but once you can picture it, blocking code stops feeling dangerous.',
  fromTs: {
    title: 'One thread versus many',
    intro: 'Both programs below do heavy CPU work for three items. In Node, the three calls take turns on the single JavaScript thread, even inside `Promise.all`. In Go, each goroutine can run on its own CPU core at the same time.',
    ts: `// All three run on ONE thread,
// one after another.
await Promise.all(
  items.map(async (it) => {
    heavyParse(it); // blocks the loop
  }),
);
console.log("done");`,
    go: `var wg sync.WaitGroup
for _, it := range items {
    wg.Add(1)
    go func() {
        defer wg.Done()
        heavyParse(it) // own core
    }()
}
wg.Wait()
fmt.Println("done")`,
    facts: [
      ['The scheduler lives in your binary', 'It is part of the Go runtime (the support code the compiler adds to every program). There is no separate event loop library, like the libuv that ships inside Node.'],
      ['Uses every core by default', '`GOMAXPROCS` sets how many threads can run Go code at once. It defaults to the number of CPUs. Since Go 1.25, on Linux, it also respects container CPU limits.'],
      ['Blocking is cheap', 'When a goroutine waits on the network, a channel or a lock, the scheduler **parks** it (sets it aside) and runs another goroutine on the same thread. The thread stays busy.'],
    ],
  },
  sections: [
    {
      eyebrow: 'G, M and P',
      title: 'Three letters run every goroutine',
      blocks: [
        'The Go scheduler is described with three letters. Almost every article and talk about it uses them, so they are worth learning once.',
        {
          table: {
            head: ['Letter', 'What it is', 'Closest Node idea'],
            rows: [
              ['**G**', 'A goroutine: a function to run plus its own small stack', 'A pending callback or async function'],
              ['**M**', 'A machine: a real OS thread', 'The main thread, or a libuv worker thread'],
              ['**P**', 'A processor: a permission slot to run Go code, with a local queue of Gs', 'The event loop itself, but you get several'],
            ],
          },
        },
        { note: 'Gs are the work, Ms are the threads that do it, and an M needs a P before it may run any Go code.', title: 'In one sentence' },
        'There are exactly `GOMAXPROCS` Ps. Each P keeps its own queue of goroutines that are ready to run.',
        'You might wonder why each P gets its own queue. With one shared list, every thread would have to lock it to take work, and they would wait on each other. Separate queues mean threads rarely fight.',
        { note: 'Picture a kitchen. Ps are the stoves, and there are only `GOMAXPROCS` of them. Ms are cooks. Gs are orders, and each stove has its own stack of orders. A cook needs a stove to cook. If a cook has to step out and wait for a delivery, another cook takes over the stove so it never sits cold. Where the picture breaks: the runtime can hire extra cooks when it needs them, but it never adds stoves.', title: 'Think of it like this' },
        'You can ask the runtime about itself:',
        {
          code: `// Ask the runtime about itself.
fmt.Println(runtime.NumCPU())       // e.g. 8
fmt.Println(runtime.GOMAXPROCS(0))  // e.g. 8
fmt.Println(runtime.NumGoroutine()) // 1 (main)`,
        },
        { note: 'Passing `0` to `runtime.GOMAXPROCS` reads the current value without changing it. You almost never need to set it yourself.' },
      ],
    },
    {
      eyebrow: 'Blocking',
      title: 'What happens when a goroutine waits',
      blocks: [
        'In Node, blocking the main thread freezes everything, so all I/O goes through callbacks and promises. In Go you write plain blocking code. The scheduler handles the waiting for you.',
        { note: 'When Go code blocks, the goroutine pauses, and the thread under it moves on to other work.', title: 'In one sentence' },
        'What the runtime does depends on what the goroutine is waiting for:',
        {
          list: [
            '**Channel or mutex wait**: the goroutine is parked on a wait queue. Its P picks the next goroutine that is ready. No thread is blocked.',
            '**Network I/O**: the goroutine is parked on the **netpoller** (the part of the runtime that asks the OS "tell me when data arrives": epoll on Linux, kqueue on macOS). When data arrives, the goroutine is ready again. libuv uses the same OS feature.',
            '**Blocking system call**, like reading a file: here the OS thread itself is stuck, so the runtime hands its P to another thread. Other goroutines keep running. Node does something similar by sending file reads to the libuv thread pool.',
          ],
        },
        {
          compare: {
            ts: `// Node: callbacks or await
const res = await fetch(url);
const body = await res.text();`,
            go: `// Go: looks blocking, is not
res, err := http.Get(url)
body, err := io.ReadAll(res.Body)`,
          },
        },
        'The Go version reads top to bottom with no `await`. While the goroutine waits, the thread under it runs other goroutines.',
        'So Go still has an event loop. It lives inside the runtime, out of your code.',
      ],
    },
    {
      eyebrow: 'Fairness',
      title: 'Work stealing and preemption',
      blocks: [
        'Two questions follow naturally. What if one core runs out of work while another has a long queue? And what if one goroutine never stops running? Go has an answer for each:',
        {
          list: [
            '**Work stealing**: when a P runs out of goroutines, it takes half of another P\'s queue. Idle cores pick up work from busy ones without you doing anything.',
            '**Preemption** (pausing a running goroutine from the outside): since Go 1.14 the runtime can pause a goroutine that has run for more than about 10 ms, even in a tight loop with no function calls. It sends the thread a signal and switches to another goroutine.',
          ],
        },
        'Node has nothing like preemption. A long synchronous function keeps the event loop until it returns.',
        { pitfall: 'A `while (true) {}` loop freezes a whole Node process. In Go, a busy loop only burns one core, and other goroutines still get time. You are still wasting a CPU core, so do not spin.', title: 'Preemption is only a safety net' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Assuming goroutines run in the order you start them', body: 'The scheduler makes no promise about order. `go a()` then `go b()` can run `b` first. If order matters, coordinate with channels or a `sync.WaitGroup`, as in [sync](/lesson/sync).' },
    { title: 'Setting GOMAXPROCS to fix a bug', body: 'If code only works with `GOMAXPROCS(1)`, it has a race condition that one thread happens to hide. Find it with `go run -race`, covered in [Race conditions](/lesson/races).' },
    { title: 'Thinking more goroutines means more speed', body: 'CPU-heavy work can only use as many cores as you have Ps. Starting 10,000 goroutines for CPU work only makes longer queues. Goroutines pay off when most of them are waiting on I/O.' },
  ],
  note: 'You do not need to tune the scheduler. The defaults are good for servers, CLIs and workers. This lesson is here to give you the right picture, so that concurrency bugs make sense when you meet them.',
  deepDive: {
    q: 'Why not use one OS thread per goroutine?',
    body: [
      'OS threads are expensive. Each one reserves a large stack, often 1 MB or more, and switching between threads goes through the kernel (the core of the operating system). A server with 100,000 connections cannot have 100,000 threads.',
      'Goroutines start with a tiny stack, and the scheduler switches between them inside your program without asking the kernel. That is much cheaper. It is how Go scales like an event loop while you write plain top-to-bottom code.',
    ],
  },
  predict: {
    code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    block := make(chan struct{})
    for i := 0; i < 3; i++ {
        go func() { <-block }()
    }
    fmt.Println(runtime.NumGoroutine())
}`,
    options: ['1', '3', '4', 'It depends on GOMAXPROCS'],
    answer: 2,
    why: 'The loop starts three goroutines, and each one parks waiting on `block`. A parked goroutine still exists: it is set aside, not gone. So the count is those three plus `main`, which makes 4. `GOMAXPROCS` plays no part here. It limits how many goroutines run at the same instant, not how many exist.',
    trace: [
      ['line 9', 'block channel created, 1 goroutine (main)', 'idle'],
      ['line 11', 'go func x3: three new Gs on the run queue', 'run'],
      ['runtime', 'each G runs <-block and parks on recvq', 'wait'],
      ['line 13', 'NumGoroutine counts main + 3 parked', 'runtime'],
      ['output', '4', 'out'],
    ],
  },
  challenge: {
    title: 'Read GOMAXPROCS without changing it',
    prompt: '`runtime.GOMAXPROCS(n)` sets the value and returns the old one. Fill in the argument so this line only **reads** the current setting.',
    code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    n := runtime.GOMAXPROCS(___)
    fmt.Println("Ps running Go code:", n)
}`,
    answers: ['0', '-1'],
    success: 'Any value below 1 leaves the setting alone, and `0` is the one everybody writes. The call returns the current number of Ps, which by default matches your CPU count.',
    wrong: [
      { answers: ['1'], title: 'That changes it', body: '`GOMAXPROCS(1)` sets the limit to one P, so only one goroutine can run Go code at a time. The call still returns the old value, but you have slowed the program down.' },
      { answers: ['runtime.NumCPU()', 'NumCPU()'], title: 'That sets it', body: 'Any positive number changes the setting. This one probably matches the default, but the task asks for a pure read. Use the value that means "do not change".' },
    ],
    hint: 'The docs say: "If n < 1, it does not change the current setting." Which small number is that?',
  },
  recap: [
    '**G** is a goroutine, **M** is an OS thread, **P** is a slot that lets a thread run Go code. There are `GOMAXPROCS` Ps.',
    'When Go code blocks on channels, locks or the network, the goroutine pauses and the thread moves on.',
    'Idle Ps steal work from busy ones, and long-running goroutines get preempted (since Go 1.14).',
    'Goroutines have no start order. Coordinate with channels and `sync`, never with the scheduler.',
  ],
}

const escape: LessonContent = {
  id: 'escape',
  minutes: 15,
  lead: 'Every heap allocation is work the garbage collector has to clean up later, so where your data lives affects speed. In JavaScript, V8 keeps your objects on the heap and you never think about it. Go has two places for data. The **stack** is scratch memory for one function call, thrown away the moment the function returns. The **heap** is a shared pool for values that live longer. The compiler picks the place for you, with a step called **escape analysis**.',
  fromTs: {
    title: 'Returning a pointer to a local is fine',
    intro: 'In C, returning a pointer to a local variable is a classic bug, because that memory gets reused after the function returns. In Go it is normal and safe. The compiler sees that the value outlives the function and puts it on the heap.',
    ts: `class User {
  constructor(public name: string) {}
}

function newUser(name: string) {
  // always a heap object in V8
  return new User(name);
}`,
    go: `type User struct {
    Name string
}

func newUser(name string) *User {
    u := User{Name: name}
    return &u // moved to heap
}`,
    facts: [
      ['Stack is cheap', 'Stack memory is freed automatically when the function returns. The garbage collector never sees it.'],
      ['Heap costs GC work', 'Anything on the heap must be found and freed by the garbage collector later. Fewer heap allocations means less GC work.'],
      ['The compiler decides', 'You never write "put this on the heap". `new`, `&T{}` and `make` can all end up on the stack if the value does not escape.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Stack and heap',
      title: 'Two places for memory',
      blocks: [
        'Every goroutine has its own **stack**: a block of memory for the local variables of the functions it is running.',
        'Each call pushes a **frame** (that call\'s slice of the stack) on top, and each return pops it off. It is the same call stack you see in Chrome DevTools when you pause on a breakpoint. When a function returns, its frame is reused by the next call. No cleanup is needed.',
        'The **heap** is shared memory for values that must live longer than the function that made them. The garbage collector scans it and frees what nobody uses any more. This is where V8 keeps the objects and arrays you create in JavaScript.',
        { note: 'The stack is a whiteboard in a meeting room: you scribble on it during the meeting, and it is wiped the moment the meeting ends. The heap is a shared storage room: things stay there until a cleaner (the garbage collector) checks that nobody needs them.', title: 'Think of it like this' },
        {
          table: {
            head: ['', 'Stack', 'Heap'],
            rows: [
              ['Lifetime', 'Until the function returns', 'Until nothing points to it'],
              ['Cleanup', 'Free, automatic', 'Garbage collector'],
              ['Speed', 'Very fast', 'Slower to allocate, adds GC work'],
              ['Who decides', 'The compiler', 'The compiler'],
            ],
          },
        },
      ],
    },
    {
      eyebrow: 'Escape analysis',
      title: 'When a value escapes',
      blocks: [
        { note: 'If a value might still be used after its function returns, it goes on the heap. Otherwise it stays on the stack.', title: 'In one sentence' },
        'A value **escapes** when the compiler cannot prove it is unused after the function returns. Common reasons:',
        {
          list: [
            'You return a pointer to it.',
            'You store a pointer to it in a global, a heap object, or a channel.',
            'You put it in an interface value, like passing it to `fmt.Println` (often, not always).',
            'It is too big for the stack, or its size is only known at runtime, like `make([]byte, n)`.',
            'A closure captures it and the closure outlives the function.',
          ],
        },
        'You do not have to guess. The `-gcflags=-m` flag asks the compiler to print each decision it made. Here is a small program:',
        {
          code: `package main

import "fmt"

func sum() int {
    a := 1
    return a // copy of a: stays on stack
}

func ptr() *int {
    b := 2
    return &b // pointer leaves: escapes
}

func main() { fmt.Println(sum(), *ptr()) }`,
          file: 'main.go',
        },
        'And here is what the compiler says about it:',
        {
          code: `$ go build -gcflags=-m main.go
./main.go:5:6: can inline sum
./main.go:10:6: can inline ptr
./main.go:15:30: inlining call to sum
./main.go:15:38: inlining call to ptr
./main.go:15:26: inlining call to fmt.Println
./main.go:11:2: moved to heap: b
./main.go:15:26: ... argument does not escape
./main.go:15:30: 1 escapes to heap
./main.go:15:34: *(~r0) escapes to heap`,
          title: 'Terminal',
        },
        'How to read it:',
        {
          list: [
            'Look for `moved to heap`. Only `b` gets one, because its address leaves `ptr`.',
            'There is no line about `a`. Values that stay on the stack produce no message at all.',
            'The two `escapes to heap` lines on line 15 are the two results being boxed into `any` for `fmt.Println`. That is the interface case from the list above.',
          ],
        },
      ],
    },
    {
      eyebrow: 'In practice',
      title: 'Should you care?',
      blocks: [
        'Most of the time, no. Write clear code first.',
        'Escape analysis matters in hot paths: a function called millions of times per second, where every heap allocation adds up to real GC work.',
        {
          compare: {
            ts: `// TS: no choice, always a heap object
function center(): Point {
  return { x: 0, y: 0 };
}`,
            go: `// Go: return a value, not a pointer
func center() Point {
    return Point{X: 0, Y: 0}
}`,
          },
        },
        'You might expect a pointer to be faster than copying a struct. For small structs it is often the other way round: the copy stays on the stack, while the pointer may force a heap allocation.',
        'So return a value by default. Use a pointer when the struct is large, or when callers need to change the same instance.',
        { pitfall: 'Do not turn every value into a pointer "for speed". Pointers to small values often cause heap allocations, which can make code slower. Measure with benchmarks, as in [Testing](/lesson/testing).', title: 'Pointers are not automatically faster' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Thinking new() means heap', body: 'In C++ and Java, `new` means heap. In Go, `new(T)` and `&T{}` go wherever escape analysis decides. If the pointer never leaves the function, the value lives on the stack.' },
    { title: 'Being afraid of returning &local', body: 'Returning a pointer to a local variable is completely safe in Go. The compiler moves the value to the heap for you. There are no dangling pointers (pointers to memory that was already freed).' },
    { title: 'Reading -m output for the wrong build', body: 'Escape decisions change with **inlining** (the compiler pasting a small function\'s body into its caller). A value that escapes in a function on its own may not escape once that function is inlined. Check the real build of the real code.' },
  ],
  deepDive: {
    q: 'How do I see how many allocations a function does?',
    body: [
      'Write a benchmark and run it with `go test -bench . -benchmem`. The `allocs/op` column shows heap allocations per call. Zero means everything stayed on the stack.',
      'You can also call `testing.AllocsPerRun` inside a test to check that a hot function never allocates.',
    ],
  },
  predict: {
    q: 'Which variable does the compiler move to the heap?',
    code: `func sum() int {
    a := 1
    return a
}

func ptr() *int {
    b := 2
    return &b
}`,
    options: ['a', 'b', 'Both a and b', 'Neither: Go has no heap for ints'],
    answer: 1,
    why: 'Ask one question of each variable: is it still needed after its function returns? `sum` returns a **copy** of `a`, so `a` itself is not needed and stays on the stack. `ptr` returns the **address** of `b`, so the caller still points at `b` after `ptr` is gone. `b` must outlive the call, and the compiler reports "moved to heap: b".',
    trace: [
      ['sum', 'a := 1, returned by value (a copy)', 'run'],
      ['sum', 'a is not referenced after return: stack', 'out'],
      ['ptr', 'b := 2, &b is returned', 'run'],
      ['compiler', 'pointer outlives the frame', 'runtime'],
      ['-m', 'moved to heap: b', 'wait'],
    ],
  },
  challenge: {
    title: 'Return a pointer to a local',
    prompt: '`newCounter` builds a `Counter` and hands back a pointer so the caller can change it. Fill in the return type.',
    code: `type Counter struct{ n int }

func newCounter() ___ {
    c := Counter{}
    return &c
}

func main() {
    c := newCounter()
    c.n++
    fmt.Println(c.n) // 1
}`,
    answers: ['*Counter'],
    success: '`&c` has type `*Counter`, so that is the return type. Returning it is safe: escape analysis sees the pointer leaving the function and puts `c` on the heap ("moved to heap: c").',
    wrong: [
      { answers: ['Counter'], title: 'That is a value, not a pointer', body: '`return &c` produces a `*Counter`. With a `Counter` return type you would write `return c`, which hands back a copy the caller cannot use to change the original.' },
      { answers: ['&Counter'], title: 'Close, wrong symbol', body: '`&` takes the address of a value in an expression. In a type, a pointer is written with `*`.' },
    ],
    hint: 'A pointer type is written with a star in front of the type name.',
  },
  recap: [
    'Stack memory is freed for free when a function returns. Heap memory costs garbage collector work.',
    'If a value might be used after its function returns, it goes on the heap. The compiler decides with escape analysis, and `new` or `&T{}` do not force the heap.',
    'Returning a pointer to a local variable is safe. See the decisions with `go build -gcflags=-m`.',
    'Only optimise allocations in hot paths, and measure with `-benchmem` first.',
  ],
}

const gc: LessonContent = {
  id: 'gc',
  minutes: 15,
  lead: 'Like JavaScript, Go has a **garbage collector** (GC): a part of the runtime that finds memory nobody uses any more and frees it, so you never free memory by hand. Why learn how it works? Because GC pauses and GC CPU time are the main memory costs you will see in a Go service. Go\'s collector runs alongside your program, aims for very short pauses, and gives you two settings instead of dozens of V8 flags.',
  fromTs: {
    title: 'You allocate, the runtime cleans up',
    intro: 'Both programs create a lot of short-lived data and never free it by hand. In both, a garbage collector later finds the data nobody can reach and takes the memory back.',
    ts: `function handle(req: Request) {
  const parts = req.url.split("/");
  const body = { parts, at: Date.now() };
  return JSON.stringify(body);
} // V8 GC frees body later`,
    go: `func handle(r *http.Request) []byte {
    parts := strings.Split(r.URL.Path, "/")
    body := map[string]any{"parts": parts}
    out, _ := json.Marshal(body)
    return out
} // Go GC frees body later`,
    facts: [
      ['Concurrent', 'Most of the work happens while your goroutines keep running. **Stop-the-world** pauses (moments when every goroutine is frozen so the collector can work) are usually well under a millisecond.'],
      ['Not generational', 'V8 keeps young and old objects in separate areas and collects the young area often. Go treats the heap as one space. Escape analysis already keeps many short-lived values off the heap.'],
      ['Two knobs', '`GOGC` controls how often it runs. `GOMEMLIMIT` sets a soft memory cap. That is almost all the tuning there is.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Mark and sweep',
      title: 'How the collector finds garbage',
      blocks: [
        'Go uses a **concurrent tri-color mark and sweep** collector. The name is long, but the idea is simple. V8 uses the same basic idea for its old objects.',
        { note: 'Anything your program can still reach by following pointers is kept, and everything else is freed.', title: 'In one sentence' },
        'A collection cycle goes like this:',
        {
          list: [
            '**Start at the roots**: global variables and the local variables on every goroutine\'s stack.',
            '**Mark**: follow every pointer from the roots, and from whatever they point to. Everything reached is alive.',
            '**Sweep**: everything not marked is garbage, and its memory is reused.',
          ],
          ordered: true,
        },
        '"Tri-color" is how marking can run in small pieces while your code keeps going. Every object has one of three colors: **white** (not seen yet), **grey** (seen, but the things it points to are not checked yet) or **black** (done). Marking keeps taking grey objects and checking what they point to, until no grey ones are left. Whatever is still white is garbage.',
        { note: 'It is like a to-do list. White items are ones you have not heard of. Grey items are on your list. Black items are crossed off. When the list is empty, anything you never heard of can be thrown away.', title: 'Think of it like this' },
        'You might wonder: your code keeps changing pointers while marking runs, so how does nothing get lost? The compiler adds a **write barrier** (a small check around pointer writes) that tells the collector about each change. Your code cannot hide a live object from it.',
        'One more piece: goroutines that allocate a lot during a cycle are asked to help with marking. This is called **mark assist**, and it is the main way the GC slows your own code down.',
        { note: 'V8 moves objects around to pack memory tightly. Go\'s collector never moves heap objects. A pointer you hold always points to the same address, which keeps the runtime simpler.' },
      ],
    },
    {
      eyebrow: 'GOGC',
      title: 'When the next collection starts',
      blocks: [
        { note: '`GOGC` is how much the heap may grow, as a percentage of the live heap, before the next collection starts.', title: 'In one sentence' },
        'After each cycle, Go measures the **live heap** (memory still in use) and sets a target for the next cycle:',
        {
          list: [
            'Take the live heap, say 40 MB.',
            'Add `GOGC` percent of it. With the default `GOGC=100`, that is 40 MB more.',
            'The next collection starts when the heap reaches 80 MB, that is, when it has doubled.',
          ],
          ordered: true,
        },
        {
          table: {
            head: ['GOGC', 'Live heap after GC', 'Next GC starts at'],
            rows: [
              ['50', '40 MB', '60 MB'],
              ['100 (default)', '40 MB', '80 MB'],
              ['200', '40 MB', '120 MB'],
              ['off', '40 MB', 'never (unless GOMEMLIMIT)'],
            ],
          },
        },
        'The trade-off: higher `GOGC` means fewer collections and more memory. Lower means more collections and less memory.',
        'You can set it as an environment variable (read by the runtime, the way Node reads `process.env`) or from code:',
        {
          code: `// Same as GOGC=200; returns the old value.
old := debug.SetGCPercent(200)
fmt.Println(old) // 100`,
        },
      ],
    },
    {
      eyebrow: 'GOMEMLIMIT',
      title: 'A soft cap for containers',
      blocks: [
        'Why a second knob? `GOGC` only knows about growth, not about how much memory your machine has. In a container (like Docker) with a fixed memory size, you want the GC to work harder as you get close to that size.',
        'That is `GOMEMLIMIT`, added in Go 1.19: a soft limit on total memory. As the program gets close to it, the GC runs more often to stay under.',
        {
          compare: {
            ts: `# Node: cap the old generation
node --max-old-space-size=512 app.js`,
            go: `# Go: soft limit on all Go memory
GOMEMLIMIT=450MiB ./app`,
            tsFile: 'terminal',
            goFile: 'terminal',
          },
        },
        { pitfall: 'Set `GOMEMLIMIT` a bit below the container limit, not equal to it. Memory outside the Go heap (thread stacks, C code called through cgo) also counts, and going over the container limit gets the process killed by the OS.', title: 'Leave headroom' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Calling runtime.GC() to "help"', body: '`runtime.GC()` forces a full collection and waits for it to finish. It is for tests and benchmarks. In real code it almost always makes things slower.' },
    { title: 'Thinking a GC language cannot leak', body: 'Anything still reachable is kept. A goroutine blocked forever keeps its stack and everything it points to. A global map that only grows never shrinks. See [Deadlocks and goroutine leaks](/lesson/deadlocks).' },
    { title: 'Small slices keeping big arrays alive', body: '`small := big[:10]` still points into the whole backing array of `big`, so the whole array stays alive. If the big array should be freed, copy the part you need with `slices.Clone`.' },
  ],
  deepDive: {
    q: 'How can I watch the GC work?',
    body: [
      'Run any program with `GODEBUG=gctrace=1`. Each cycle prints a line with the heap size before and after, the time spent, and the CPU used.',
      'Go 1.25 also ships an experimental new collector called Green Tea, turned on with `GOEXPERIMENT=greenteagc` at build time. It scans memory in an order that makes better use of the CPU cache (the small, fast memory next to each core). Your code does not change; only the runtime does.',
    ],
  },
  predict: {
    code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    before := m.NumGC
    runtime.GC()
    runtime.ReadMemStats(&m)
    fmt.Println(m.NumGC - before)
}`,
    options: ['0', '1', '2', 'It panics: nothing to collect'],
    answer: 1,
    why: '`NumGC` counts finished GC cycles. The program reads it, then calls `runtime.GC()`, which runs one full cycle and waits for it to finish, then reads it again. So the counter has gone up by exactly 1. A nearly empty heap is not a problem; the cycle finishes quickly.',
    trace: [
      ['line 10', 'read stats: NumGC = N', 'idle'],
      ['line 12', 'runtime.GC(): mark from roots', 'run'],
      ['runtime', 'sweep, cycle complete', 'runtime'],
      ['line 13', 'read stats: NumGC = N+1', 'run'],
      ['output', '1', 'out'],
    ],
  },
  challenge: {
    title: 'Collect less often',
    prompt: 'This service has spare memory and spends too much CPU on GC. Make the next collection start when the heap reaches **3 times** the live heap (live plus 200% growth).',
    code: `package main

import "runtime/debug"

func main() {
    debug.SetGCPercent(___)
    runServer()
}`,
    answers: ['200'],
    success: '`GOGC` is the growth on top of the live heap. With 200, a 40 MB live heap may grow by 80 MB, to 120 MB, before the next cycle. That is 3 times the live heap, and roughly half as many collections as the default.',
    wrong: [
      { answers: ['300'], title: 'One step too far', body: 'The percent is the **growth** on top of the live heap. 300 means live plus 300%, so the heap reaches 4 times the live size.' },
      { answers: ['100'], title: 'That is the default', body: '100 means the heap may double before the next cycle. You want it to triple.' },
      { answers: ['-1'], title: 'That turns GC off', body: 'A negative value disables the collector completely. Without `GOMEMLIMIT`, memory grows until the process dies.' },
    ],
    hint: 'Target = live heap x (1 + GOGC/100). Solve for 3 x live heap.',
  },
  recap: [
    'Anything your program can still reach is kept, and everything else is freed. Go does this with a concurrent, non-moving, tri-color mark and sweep collector with very short pauses.',
    '`GOGC` (default 100) is how much the heap may grow, as a percentage of the live heap, before the next cycle.',
    '`GOMEMLIMIT` is a soft memory cap. Set it a little below your container limit.',
    'Reachable data is never freed. Leaks come from goroutines and maps that live forever.',
  ],
}

const stacks: LessonContent = {
  id: 'stacks',
  minutes: 12,
  lead: 'Why can you start a million goroutines, when a million threads would crash your machine? Small stacks. Each function call gets a **stack frame**: a block of memory for its arguments and local variables. DevTools lists these frames as the call stack. In JavaScript, deep recursion ends with "Maximum call stack size exceeded" after roughly ten thousand frames. A goroutine starts with a tiny stack of a few kilobytes and grows it whenever needed. That is also why deep recursion rarely breaks in Go.',
  fromTs: {
    title: 'A million levels of recursion',
    intro: 'Here is the same recursive function, called with a depth of one million. V8 gives up long before that. Go grows the stack and finishes.',
    ts: `function depth(n: number): number {
  if (n === 0) return 0;
  return 1 + depth(n - 1);
}

console.log(depth(1_000_000));
// RangeError: Maximum call stack
// size exceeded`,
    go: `func depth(n int) int {
    if n == 0 {
        return 0
    }
    return 1 + depth(n-1)
}

fmt.Println(depth(1_000_000))
// 1000000`,
    facts: [
      ['Small start', 'A new goroutine gets a stack of about 2 KB (2,048 bytes). An OS thread, like the one Node runs on, reserves 1 MB or more up front.'],
      ['Grows on demand', 'When a function needs more room, the runtime copies the stack into one twice as big and keeps going.'],
      ['Has a ceiling', 'On 64-bit systems a goroutine stack may grow up to 1 GB. Past that you get "fatal error: stack overflow".'],
    ],
  },
  sections: [
    {
      eyebrow: 'How growth works',
      title: 'Check, copy, continue',
      blocks: [
        { note: 'When a goroutine runs out of stack, the runtime moves it to a stack twice as big and carries on.', title: 'In one sentence' },
        'The compiler adds a tiny check at the start of most functions: "is there enough stack left for this call?" Almost always the answer is yes, and the check costs one comparison.',
        'When the answer is no, the runtime:',
        {
          list: [
            'Allocates a new stack twice the size of the old one.',
            'Copies all the frames over.',
            'Updates every pointer that pointed into the old stack.',
            'Frees the old stack and resumes the function.',
          ],
          ordered: true,
        },
        { note: 'Picture a notebook. When you fill the last page, you buy a notebook twice as thick, copy every page across, and fix any "see page 12" notes so they point at the new pages. Then you keep writing. Unlike a real notebook, this happens in a fraction of a millisecond.', title: 'Think of it like this' },
        'Stacks can shrink too. During garbage collection, a goroutine using less than a quarter of its stack gets a smaller one, and the spare memory goes back to the runtime.',
        { note: 'You might wonder what happens to your pointers when the stack moves. Escape analysis makes sure nothing outside a goroutine\'s own stack points into it. Pointers inside the stack are fine: the copier rewrites every one of them to the new address, so your pointers always stay correct.' },
      ],
    },
    {
      eyebrow: 'Why it matters',
      title: 'Cheap goroutines come from small stacks',
      blocks: [
        'Compare the numbers:',
        {
          table: {
            head: ['', 'OS thread', 'Goroutine'],
            rows: [
              ['Starting stack', '1 MB or more (reserved)', 'About 2 KB'],
              ['Can grow', 'No, fixed size', 'Yes, up to 1 GB'],
              ['100,000 of them', '100 GB or more reserved', 'About 200 MB'],
              ['Switching', 'Through the kernel', 'Inside the Go runtime'],
            ],
          },
        },
        'This is why a Go web server can give every connection its own goroutine. Node reaches the same scale differently: one thread, with everything written as async callbacks and promises.',
        {
          code: `// Fine in Go: 100k goroutines, each tiny.
var wg sync.WaitGroup
for i := 0; i < 100_000; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        time.Sleep(time.Second)
    }()
}
wg.Wait()`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Infinite recursion still crashes', body: 'Growing stacks make deep recursion work, but endless recursion still fails. A missing base case eats memory until the 1 GB limit. Then the program dies with "goroutine stack exceeds 1000000000-byte limit" and "fatal error: stack overflow". In JS you can catch the RangeError with `try/catch`. In Go this is a fatal error, and `recover` cannot catch it.' },
    { title: 'Assuming the old fixed size limits apply', body: 'Coming from Node, you may rewrite recursion as loops out of habit. In Go, a recursive tree walk a few thousand levels deep is fine. Prefer whichever version is clearer.' },
    { title: 'Ignoring the cost of growth in hot paths', body: 'Each growth copies the whole stack. A goroutine that keeps growing and shrinking can waste time. This is rare, but when it happens it shows up in profiles as `runtime.morestack`.' },
  ],
  deepDive: {
    q: 'Why does Go copy stacks instead of chaining extra pieces?',
    body: [
      'Before Go 1.3, stacks were **segmented**: when one filled up, a new piece was linked on. If a hot loop called a function right at the edge of a piece, the runtime added and removed a piece on every call. This was called the "hot split" problem.',
      'Contiguous stacks (one unbroken block) fix it: the stack doubles once and stays big. Since Go 1.19 the runtime also picks a starting size based on how much stack goroutines used on average, so fewer goroutines need to grow at all.',
    ],
  },
  predict: {
    code: `package main

import "fmt"

func depth(n int) int {
    if n == 0 {
        return 0
    }
    return 1 + depth(n-1)
}

func main() {
    fmt.Println(depth(1_000_000))
}`,
    options: ['1000000', 'fatal error: stack overflow', 'It does not compile', '0'],
    answer: 0,
    why: 'Each call adds a small frame, so the stack fills up and the runtime doubles it, again and again. A million frames of this small function need tens of megabytes in total. That is far below the 1 GB limit, so the recursion reaches 0 and unwinds, adding 1 at each level. The same code in Node throws a RangeError.',
    trace: [
      ['start', 'main goroutine stack: a few KB', 'idle'],
      ['depth', 'frames pile up, stack check fails', 'wait'],
      ['runtime', 'morestack: copy to a stack 2x bigger', 'runtime'],
      ['runtime', 'repeat while recursion goes deeper', 'runtime'],
      ['return', 'one million frames unwind', 'run'],
      ['output', '1000000', 'out'],
    ],
  },
  challenge: {
    title: 'Give the recursion a base case',
    prompt: 'Without a working base case this function recurses forever and dies at the 1 GB stack limit. Fill in the comparison so `fact(5)` prints 120.',
    code: `func fact(n int) int {
    if n ___ 0 {
        return 1
    }
    return n * fact(n-1)
}

func main() {
    fmt.Println(fact(5)) // 120
}`,
    answers: ['==', '<='],
    success: 'Now every chain of calls ends at `n == 0`: 5 x 4 x 3 x 2 x 1 x 1 = 120. Growing stacks make deep recursion safe, but only a base case makes it finite. `<=` is a little safer, because a negative input also stops.',
    wrong: [
      { answers: ['!='], title: 'Stops right away', body: 'With `!=`, `fact(5)` returns 1 immediately because 5 is not 0. The recursion never runs.' },
      { answers: ['===', '!=='], title: 'That is JavaScript', body: 'Go has only `==` and `!=`. Go never converts types when comparing, so it does not need a separate strict version.' },
      { answers: ['<', '>'], title: 'Wrong stopping point', body: 'With `<`, `fact(0)` does not stop and multiplies by 0, so the answer is 0. With `>`, `fact(5)` returns 1 on the very first call.' },
    ],
    hint: 'The recursion counts down to 0. Stop when `n` reaches 0.',
  },
  recap: [
    'Goroutines start with a stack of about 2 KB. When it runs out, the runtime moves it to a stack twice as big and carries on.',
    'Stacks can grow up to 1 GB on 64-bit systems. Endless recursion still ends in "fatal error: stack overflow".',
    'Small, growable stacks are why goroutines are cheap enough to create by the thousand.',
    'Deep recursion that breaks in Node is usually fine in Go.',
  ],
}

const internals: LessonContent = {
  id: 'internals',
  minutes: 20,
  lead: 'Why does `append` need you to keep its result? Why is map order random? Why does a channel send sometimes wait? Each answer comes from the same place. Slices, maps and channels look like built-in magic, but each one is a small struct that the runtime manages for you. Once you can picture those structs, their odd behaviour makes sense.',
  fromTs: {
    title: 'Values that point to shared data',
    intro: 'In JavaScript, arrays and objects are passed by reference: pass one to a function and the function can change the same array you hold. Go slices and maps behave **almost** the same. The small value you pass around contains a pointer to the real data.',
    ts: `function grow(xs: number[]) {
  xs.push(4); // mutates caller's array
}

const xs = [1, 2, 3];
grow(xs);
console.log(xs); // [1, 2, 3, 4]`,
    go: `func grow(s []int) []int {
    return append(s, 4)
}

s := []int{1, 2, 3}
s = grow(s) // must keep the result
fmt.Println(s) // [1 2 3 4]`,
    facts: [
      ['A slice is 3 words', 'A **word** is one machine-sized number, 8 bytes on a 64-bit machine. A slice holds three: a pointer to a backing array, a length and a capacity. That is 24 bytes, no matter how many elements.'],
      ['A map is a pointer', 'A map variable is one pointer (8 bytes) to a runtime hash table. Passing it to a function shares the same table.'],
      ['A channel is a pointer', 'A channel points to a runtime struct called `hchan`, with a buffer, a lock and two queues of waiting goroutines.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Slices',
      title: 'Pointer, length, capacity',
      blocks: [
        { note: 'A slice is a small window onto an array: where the window starts, how much of it is in use, and how far it could stretch.', title: 'In one sentence' },
        'The runtime calls that small struct the **slice header**:',
        {
          code: `// What a []int really is (simplified).
type sliceHeader struct {
    data unsafe.Pointer // backing array
    len  int            // elements in use
    cap  int            // room in the array
}`,
        },
        'Passing a slice copies these three words, not the elements. The copy points to the same backing array, so a write like `s[0] = 9` is visible to the caller.',
        { note: 'If you have used typed arrays, a slice is close to a `Uint8Array` view over an `ArrayBuffer`. `buf.subarray(1, 3)` makes a new view over the same bytes, and a write through one view shows up in the other. A Go slice works the same way, plus a capacity.', title: 'Think of it like this' },
        'So why must you keep the result of `append`? Here is what it does:',
        {
          list: [
            'If there is spare capacity, it writes the new element into the shared array and returns a header with a bigger `len`.',
            'If there is no room, it allocates a bigger array (roughly double, for small slices), copies the elements over, and returns a header pointing to the **new** array.',
            'Either way, the caller\'s old header does not change. Only the returned header knows the new length.',
          ],
          ordered: true,
        },
        'That is why you always write `s = append(s, x)`.',
        {
          table: {
            head: ['Value', 'Size on 64-bit', 'What it holds'],
            rows: [
              ['`[]T`', '24 bytes', 'pointer, len, cap'],
              ['`string`', '16 bytes', 'pointer, len (bytes are read-only)'],
              ['`map[K]V`', '8 bytes', 'pointer to the hash table'],
              ['`chan T`', '8 bytes', 'pointer to an `hchan`'],
            ],
          },
        },
        'More on how sharing a backing array can surprise you is in [Arrays versus slices](/lesson/slices).',
      ],
    },
    {
      eyebrow: 'Maps',
      title: 'A hash table built from small groups',
      blocks: [
        'A **hash table** turns each key into a number (its **hash**) and uses that number to pick a slot, so lookups do not have to search every entry.',
        'V8 often stores object properties using hidden classes (internal descriptions of an object\'s shape), and falls back to a hash table for dictionary-like objects. A Go map is always a hash table. Since Go 1.24 it uses a **Swiss table** design:',
        {
          list: [
            'Keys are hashed with a random **seed** (a starting value mixed into every hash) chosen per map.',
            'Slots are arranged in **groups of 8**. Each group has a small control word holding a few bits of each slot\'s hash, so one comparison checks all 8 slots at once.',
            'Large maps are split into several independent tables, so growing only rehashes one part at a time.',
          ],
        },
        'Two rules follow from this design:',
        {
          list: [
            'Iteration order is **deliberately random**, so never rely on it.',
            'You cannot take the address of a map element: `&m["k"]` does not compile. Growth can move elements, so the address would not stay valid.',
          ],
        },
        {
          compare: {
            ts: `const m = new Map<string, number>();
m.set("a", 1);
// Map keeps insertion order
for (const [k, v] of m) {}`,
            go: `m := map[string]int{}
m["a"] = 1
// order is random on purpose
for k, v := range m {}`,
          },
        },
        { pitfall: 'A map has no lock inside. If two goroutines (possibly on two threads) write to it at once, the runtime stops the program with "fatal error: concurrent map writes". Use a `sync.Mutex` or `sync.Map`.', title: 'Maps are not safe for concurrent writes' },
      ],
    },
    {
      eyebrow: 'Channels',
      title: 'Inside hchan',
      blocks: [
        'A channel value points to a runtime struct called `hchan`. Its important fields:',
        {
          code: `type hchan struct {
    qcount   uint           // values in buffer
    dataqsiz uint           // buffer capacity
    buf      unsafe.Pointer // ring buffer
    closed   uint32
    recvq    waitq // goroutines waiting to receive
    sendq    waitq // goroutines waiting to send
    lock     mutex
}`,
          file: 'runtime/chan.go (simplified)',
        },
        { note: 'Picture a post office counter with a few shelves behind it (the buffer) and two lines of people: one line waiting to drop off parcels (`sendq`) and one waiting to pick up (`recvq`). If someone is already waiting to pick up, you hand your parcel straight to them.', title: 'Think of it like this' },
        'A send takes the lock and then follows three rules in order:',
        {
          list: [
            'If a receiver is waiting in `recvq`, copy the value **directly** to that goroutine and wake it. The buffer is skipped.',
            'Otherwise, if the **ring buffer** (a fixed-size buffer that wraps around to the start when it reaches the end) has room, copy the value into it and return.',
            'Otherwise, add this goroutine to `sendq` and park it. The scheduler runs something else.',
          ],
          ordered: true,
        },
        'Receives mirror these rules. This is what the simulator in [Channels](/lesson/channels) shows: the yellow "blocked" state is a goroutine sitting in `sendq` or `recvq`.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Forgetting to use append\'s result', body: 'The new length lives only in the header that `append` returns. The compiler rejects a bare `append(s, x)` statement, but it cannot stop you from appending inside a helper and dropping the result. Helpers that append must return the slice.' },
    { title: 'Assuming a nil map works like an empty one', body: 'Reading from a nil map returns the zero value, like an empty map. Writing to a nil map panics with "assignment to entry in nil map". Create it with `make` or a literal first.' },
    { title: 'Depending on map order in tests', body: 'Printing a map with `fmt` sorts the keys, but `range` does not. Tests that collect keys with `range` and compare them to a fixed list will fail at random. Sort the keys first with `slices.Sorted(maps.Keys(m))`.' },
  ],
  deepDive: {
    q: 'Why does Go randomise map iteration on purpose?',
    body: [
      'Early Go versions had an order that was stable most of the time. Programs started to depend on it, and then broke when the implementation changed.',
      'So the runtime picks a random starting point for every `range` loop. Code that depends on order fails right away in testing, instead of breaking years later. It also made the switch to Swiss tables in Go 1.24 possible without breaking anyone.',
    ],
  },
  predict: {
    code: `package main

import (
    "fmt"
    "unsafe"
)

func main() {
    s := make([]int, 1000)
    var m map[string]int
    fmt.Println(unsafe.Sizeof(s), unsafe.Sizeof(m))
}`,
    options: ['8000 8', '24 8', '24 0', '8 8'],
    answer: 1,
    why: '`unsafe.Sizeof` measures the variable itself, not the data it points to. `s` is a slice header: pointer, len and cap, 3 x 8 = 24 bytes. The 1000 elements live in the backing array, which is not counted. `m` is a single pointer, 8 bytes, even while it is nil.',
    trace: [
      ['line 9', 's: header {ptr, len 1000, cap 1000}', 'run'],
      ['line 10', 'm: nil pointer to a map table', 'idle'],
      ['Sizeof', 'slice header = 3 x 8 bytes = 24', 'runtime'],
      ['Sizeof', 'map value = 1 pointer = 8', 'runtime'],
      ['output', '24 8', 'out'],
    ],
  },
  challenge: {
    title: 'Keep the grown slice',
    prompt: '`grow` appends to the slice and returns the new header. Right now `main` throws that result away and prints `[1 2 3]`. Fill the blank so it prints `[1 2 3 4]`.',
    code: `func grow(s []int) []int {
    return append(s, 4)
}

func main() {
    s := []int{1, 2, 3}
    ___ grow(s)
    fmt.Println(s) // [1 2 3 4]
}`,
    answers: ['s ='],
    success: '`s = grow(s)` replaces the old header (length 3) with the new one (length 4). Here it also points to a new backing array, because the old one was full. Same rule as `s = append(s, x)`.',
    wrong: [
      { answers: ['s :='], title: 'No new variables', body: '`s` already exists in this scope, so `:=` fails with "no new variables on left side of :=". Use plain assignment.' },
      { answers: ['', 'return'], title: 'The result is still lost', body: 'The caller\'s `s` only changes if you assign to it. The function cannot change the caller\'s header for you.' },
      { answers: ['&s ='], title: 'Not a pointer', body: 'You want to store the returned slice in the variable `s`, not in its address. Plain assignment is enough.' },
    ],
    hint: 'Assign the returned slice back to the same variable, the way you write `s = append(s, x)`.',
  },
  recap: [
    'A slice is a 24-byte header: pointer, length, capacity. Always keep the result of `append`.',
    'A map is a pointer to a Swiss table (Go 1.24+). Order is random and concurrent writes crash.',
    'A channel points to an `hchan` with a ring buffer, a lock, and `sendq`/`recvq` wait queues.',
    'Passing these values copies a small header, so the underlying data is shared.',
  ],
}

const layout: LessonContent = {
  id: 'layout',
  minutes: 12,
  lead: 'Here is a surprise: two structs with the same fields can be different sizes. **Memory layout** means where each piece of a value sits in memory, counted in bytes (a **byte** is the smallest unit of memory: 8 bits, enough for a number from 0 to 255). V8 hides the layout of a JavaScript object from you. A Go struct is laid out in the exact order you write its fields, with gaps added so each field sits at a properly aligned address. Changing the order of fields can make a struct smaller.',
  fromTs: {
    title: 'Same fields, different sizes',
    intro: 'In JavaScript, you cannot see or control how much memory an object uses. In Go you can. These two structs hold the same three fields: a `bool` takes 1 byte and an `int64` takes 8.',
    ts: `interface A {
  a: boolean;
  b: number;
  c: boolean;
}
// Size? Up to V8. You cannot
// ask, and order is not a lever.`,
    go: `type A struct {
    a bool  // 1 byte + 7 padding
    b int64 // 8 bytes
    c bool  // 1 byte + 7 padding
}
type B struct {
    b int64 // 8 bytes
    a bool  // 1 byte
    c bool  // 1 byte + 6 padding
}
// unsafe.Sizeof: A = 24, B = 16`,
    facts: [
      ['Fields stay in order', 'The compiler never reorders struct fields. What you write is what you get in memory.'],
      ['Alignment adds padding', 'An `int64` must start at an address that is a multiple of 8. The compiler inserts unused bytes, called **padding**, to make that true.'],
      ['You can measure it', '`unsafe.Sizeof`, `unsafe.Alignof` and `unsafe.Offsetof` tell you the size, alignment and position of any field.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Alignment',
      title: 'Why the gaps exist',
      blocks: [
        'Why would a compiler waste bytes on purpose? Because the CPU reads memory in fixed-size chunks. A value that sits across the edge of two chunks is slower to read, and some CPUs refuse to read it at all.',
        'So each type has an **alignment**: its address must be a multiple of that number.',
        { note: 'Think of memory as a long shelf with a mark every 8 cm. Small 1 cm boxes can go anywhere, but an 8 cm box must start on a mark. If a small box leaves you a little past a mark, the gap up to the next mark stays empty. That gap is padding.', title: 'Think of it like this' },
        'On a 64-bit machine:',
        {
          table: {
            head: ['Type', 'Size', 'Alignment'],
            rows: [
              ['`bool`, `int8`, `byte`', '1', '1'],
              ['`int16`', '2', '2'],
              ['`int32`, `float32`, `rune`', '4', '4'],
              ['`int`, `int64`, `float64`, pointers', '8', '8'],
              ['`string`', '16', '8'],
              ['`[]T`', '24', '8'],
              ['`struct{}`', '0', '1'],
            ],
          },
        },
        'Two rules decide a struct\'s layout:',
        {
          list: [
            'Each field starts at the next **offset** (distance in bytes from the start of the struct) that is a multiple of its alignment.',
            'The total size is rounded up to a multiple of the largest field alignment, so arrays of the struct stay aligned too.',
          ],
        },
        'You can check both rules from code:',
        {
          code: `fmt.Println(unsafe.Offsetof(A{}.b)) // 8
fmt.Println(unsafe.Alignof(int64(0))) // 8
fmt.Println(unsafe.Sizeof(A{}))       // 24`,
        },
        { note: 'The closest thing in JavaScript is reading an `ArrayBuffer` with a `DataView`, where you choose every byte offset yourself: `view.getFloat64(8)` reads 8 bytes starting at offset 8. A Go struct is a fixed list of offsets like that, worked out by the compiler.' },
      ],
    },
    {
      eyebrow: 'Ordering',
      title: 'Big fields first',
      blocks: [
        { note: 'Put the fields with the largest alignment first, and most padding disappears.', title: 'In one sentence' },
        'The habit: pointers, `int64` and strings first, then `int32`, then `bool` and `byte` at the end.',
        {
          compare: {
            ts: `// TS: order is about readability only
type Event = {
  active: boolean;
  id: number;
  flag: boolean;
};`,
            go: `// 24 bytes -> 16 bytes by reordering
type Event struct {
    ID     int64
    Active bool
    Flag   bool
}`,
          },
        },
        'Does this matter? For one struct, no. For a slice of ten million structs, cutting 24 bytes to 16 saves 80 MB, and more of your data fits in the CPU cache.',
        { note: 'Readability still wins for ordinary code. Group fields so they make sense to a reader, and only reorder for size in types you keep millions of. The `fieldalignment` analyzer in `golang.org/x/tools` can point out structs worth fixing.' },
      ],
    },
    {
      eyebrow: 'Zero-size',
      title: 'The empty struct',
      blocks: [
        '`struct{}` has no fields and takes **zero bytes**. Use it when you only care that something is there and have nothing to store.',
        {
          code: `// A set of strings: values take no space.
seen := map[string]struct{}{}
seen["go"] = struct{}{}

// A signal-only channel.
done := make(chan struct{})
close(done)`,
        },
        'In JavaScript you would use a `Set` of strings, or a `Map` with `true` values. In Go, `map[string]struct{}` is the usual set, and `chan struct{}` is the usual "something happened" signal.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Adding up field sizes by hand', body: 'A struct with `bool`, `int64`, `bool` is not 10 bytes. Padding makes it 24. Check with `unsafe.Sizeof` instead of guessing.' },
    { title: 'Reordering fields in serialised or shared types', body: 'Field order does not change JSON output (keys come from names and tags). It does matter for `encoding/binary`, cgo, and anything else that reads raw memory. Do not reorder those types blindly.' },
    { title: 'Using unsafe in normal code', body: '`unsafe.Sizeof` and friends are safe to call. They only read numbers the compiler already knows. The rest of the `unsafe` package (pointer tricks) skips Go\'s safety rules. Keep it out of everyday code.' },
  ],
  deepDive: {
    q: 'Why is a 64-bit atomic sometimes a problem on 32-bit systems?',
    body: [
      'An **atomic** operation is a read or write that other threads can never see half-finished. On 32-bit platforms, an `int64` field only needs 4-byte alignment, but 64-bit atomic operations need 8-byte alignment. A badly placed field can crash `atomic.AddInt64`.',
      'That is why the `sync/atomic` package added types like `atomic.Int64`, which are always aligned correctly. Use them and you never need to think about it.',
    ],
  },
  predict: {
    code: `type A struct {
    a bool
    b int64
    c bool
}

type B struct {
    b int64
    a bool
    c bool
}

func main() {
    fmt.Println(
        unsafe.Sizeof(A{}),
        unsafe.Sizeof(B{}),
    )
}`,
    options: ['10 10', '24 16', '16 16', '24 24'],
    answer: 1,
    why: 'Walk through `A` field by field. `a` takes offset 0. `b` is an `int64`, so it must start at a multiple of 8: offset 8, leaving 7 bytes of padding. `c` sits at 16. The total, 17, rounds up to a multiple of 8: 24. Now `B`: `b` takes 0 to 7, and both bools fit right after it at 8 and 9. The total, 10, rounds up to 16.',
    trace: [
      ['A.a', 'offset 0, 1 byte, then 7 padding', 'wait'],
      ['A.b', 'offset 8, 8 bytes', 'run'],
      ['A.c', 'offset 16, 1 byte, round up to 24', 'wait'],
      ['B', 'b at 0, a at 8, c at 9, round up to 16', 'run'],
      ['output', '24 16', 'out'],
    ],
  },
  challenge: {
    title: 'Predict the size, padding included',
    prompt: 'Work out how many bytes `Point` takes on a 64-bit machine, and fill the blank so the program prints `true`.',
    code: `type Point struct {
    x  int32
    ok bool
    y  int32
}

func main() {
    fmt.Println(unsafe.Sizeof(Point{}) == ___)
}`,
    answers: ['12'],
    success: 'Step by step: `x` takes offsets 0 to 3. `ok` sits at 4. `y` is an `int32`, so it must start at a multiple of 4: offset 8, after 3 bytes of padding. `y` ends at 12, which is already a multiple of 4, so the size is 12. Moving `ok` to the end would not shrink it here; the padding would move to the end.',
    wrong: [
      { answers: ['9'], title: 'Padding is missing', body: '4 + 1 + 4 adds up to 9, but `y` is an `int32` and must start at an offset that is a multiple of 4. Count the gap after `ok`.' },
      { answers: ['16', '24'], title: 'Too much padding', body: 'The largest alignment here is 4, not 8, because there is no 8-byte field. The total rounds up to a multiple of 4.' },
    ],
    hint: 'Place each field at the next offset that is a multiple of its own size (4 for `int32`, 1 for `bool`), then round the total up to a multiple of 4.',
  },
  recap: [
    'Go keeps struct fields in the order you write them and adds padding for alignment.',
    'Put the fields with the largest alignment first, and most padding disappears.',
    'Measure with `unsafe.Sizeof`, `unsafe.Alignof` and `unsafe.Offsetof` instead of guessing.',
    '`struct{}` is zero bytes: use it for sets (`map[K]struct{}`) and signal channels.',
  ],
}

export const UNDER: LessonContent[] = [scheduler, escape, gc, stacks, internals, layout]
