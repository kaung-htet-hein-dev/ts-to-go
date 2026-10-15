import type { LessonContent } from './types'

const goroutines: LessonContent = {
  id: 'goroutines',
  minutes: 15,
  lead: 'In JavaScript you run things "at the same time" with promises and `async/await`. All of that code still runs on one thread (one line of execution), and the event loop switches between tasks while they wait. In Go you put the word `go` in front of a function call. That starts a goroutine: a very cheap thread managed by the Go runtime. There is no `await`. Goroutines can also run at the same moment on different CPU cores (the separate processors inside your machine), which JavaScript code on the event loop never does.',
  fromTs: {
    title: 'Promise.all, without the promises',
    intro: 'A common job: fetch several URLs at once and wait for all of them. In JavaScript you build an array of promises and `await Promise.all(...)`. In Go you start one goroutine per URL. Then you wait on a `sync.WaitGroup`, which is a counter of unfinished jobs.',
    ts: `async function fetchAll(urls: string[]) {
  await Promise.all(
    urls.map(async (u) => {
      const body = await get(u);
      parse(body);
    }),
  );
  console.log("all done");
}`,
    go: `func fetchAll(urls []string) {
    var wg sync.WaitGroup
    for _, u := range urls {
        wg.Add(1)
        go func() {
            defer wg.Done()
            parse(get(u))
        }()
    }
    wg.Wait()
    fmt.Println("all done")
}`,
    tsFile: 'fetch.ts',
    goFile: 'fetch.go',
    facts: [
      ['No async/await', '`get(u)` is a normal function that blocks: it returns only when the response is in. Only that goroutine waits. The rest of the program keeps going.'],
      ['Real parallelism', 'Goroutines run on all your CPU cores. In Node, two CPU-heavy `parse` calls still take turns on one thread. In Go they can run at the same moment.'],
      ['Very cheap', 'A goroutine starts with a 2 KB stack (the memory that holds its local variables and function calls). Starting 100,000 of them is normal.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The go keyword',
      title: 'One word starts a goroutine',
      blocks: [
        'Put `go` before any function call. Go starts that call in a new goroutine and moves to the next line right away. It feels like calling an `async` function without `await`: the work starts, and your code carries on. The difference is that `go` gives you nothing back. There is no promise and no return value.',
        {
          code: `func say(msg string) {
    fmt.Println(msg)
}

func main() {
    go say("from a goroutine") // starts, does not wait
    say("from main")
    time.Sleep(100 * time.Millisecond)
}`,
        },
        'The `time.Sleep` is there only to keep `main` alive long enough. Real code never waits with sleep. It waits with a `WaitGroup` or a channel, as you will see below.',
        { pitfall: 'When `main` returns, the whole program exits. Goroutines that are still running are stopped without warning. Node keeps the process alive while timers, open sockets or other I/O are still pending. Go does not. It behaves as if `main` ended with `process.exit()`.', title: 'main does not wait for anyone' },
      ],
    },
    {
      eyebrow: 'Colored functions',
      title: 'No more async spreading through your code',
      blocks: [
        'In JavaScript, once one function is `async`, every caller has to `await` it, and their callers too. People call this "function coloring": async functions are one color, normal functions another. Go has no colors. Every function is a normal function. The caller decides whether to run it in the background by writing `go`.',
        {
          compare: {
            ts: `// async spreads up the call chain
async function load() {
  return await db.query("...");
}
async function handler() {
  const rows = await load();
}`,
            go: `// plain functions all the way up
func load() []Row {
    return db.Query("...") // blocks
}
func handler() {
    rows := load()
    _ = rows
}`,
          },
        },
        'How can blocking be fine? In Node, a blocking call freezes the event loop, so everything stops. In Go, when a goroutine waits for the network or a channel, the runtime parks it and runs a different goroutine on that thread. You write plain top-to-bottom code, and the runtime does the juggling that the event loop does for you in Node.',
        { note: 'The closest Node feature to goroutines is `worker_threads`, which also gives you real parallel threads. Workers are heavy, though: each one is a separate JavaScript engine instance with its own variables, and you talk to it with `postMessage`. Goroutines are cheap and share the same memory, so they can all read and write the same variables. That shared access is why later lessons cover locks and data races.' },
      ],
    },
    {
      eyebrow: 'Waiting',
      title: 'WaitGroup: a counter you can wait on',
      blocks: [
        '`sync.WaitGroup` counts work that is not finished yet. Think of it as a hand-made `Promise.all`: you count jobs up as they start, down as they end, and wait for zero. You use three methods:',
        {
          table: {
            head: ['Call', 'Meaning', 'Who calls it'],
            rows: [
              ['`wg.Add(1)`', 'One more job is starting', 'The parent, **before** `go`'],
              ['`wg.Done()`', 'One job finished', 'The goroutine, usually with `defer`'],
              ['`wg.Wait()`', 'Block until the count is zero', 'The parent'],
            ],
          },
        },
        'Since Go 1.25 there is a shortcut, `wg.Go(f)`, that does the Add, the `go` and the Done for you:',
        {
          code: `var wg sync.WaitGroup
for _, u := range urls {
    wg.Go(func() {
        parse(get(u))
    })
}
wg.Wait()`,
        },
        { note: 'Since Go 1.22 each loop iteration gets its own copy of `u`, like `let` in a JS `for` loop, so capturing it in the closure is safe. Older blog posts write `u := u` or pass `u` as an argument. You no longer need that.' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Calling wg.Add inside the goroutine', body: 'If you write `wg.Add(1)` inside the new goroutine, `wg.Wait()` may run first, see a count of zero and return too early. Always call `Add` in the parent before `go`, or use `wg.Go`.' },
    { title: 'Expecting a return value from go', body: '`x := go f()` does not compile. A goroutine cannot return a value to its caller. Send the result on a [channel](/lesson/channels) or write it into a slot the parent owns.' },
    { title: 'Assuming an order', body: 'Goroutines run in no particular order. Starting g1 before g2 does not mean g1 prints first. If order matters, you must coordinate them with channels or locks.' },
  ],
  deepDive: {
    q: 'Why are goroutines so much cheaper than OS threads?',
    body: [
      'An OS thread is a thread created by the operating system. It usually reserves 1 MB or more of stack, and switching between threads goes through the kernel (the core of the operating system). A goroutine starts with a 2 KB stack that grows when needed. Switching between goroutines happens inside the Go runtime, inside your own process.',
      'The runtime spreads many goroutines over a few OS threads, about one per CPU core. You will see how in [The scheduler](/lesson/scheduler).',
    ],
  },
  predict: {
    code: `func main() {
    x := 1
    done := make(chan bool)
    go func(n int) {
        fmt.Println(n)
        done <- true
    }(x)
    x = 2
    <-done
}`,
    options: ['1', '2', 'It prints nothing', 'fatal error: deadlock'],
    answer: 0,
    why: 'The arguments of a `go` call are evaluated right away, on the line that starts the goroutine. `n` gets a copy of `x` while `x` is still 1, the same way a number argument is copied in a JS function call. Changing `x` later does not touch that copy. The channel makes `main` wait until the goroutine has printed.',
    trace: [
      ['line 2', 'x = 1', 'run'],
      ['line 7', 'go starts the goroutine with n = 1 (copied now)', 'run'],
      ['line 8', 'main sets x = 2; n is still 1', 'run'],
      ['line 9', 'main blocks on <-done', 'wait'],
      ['g1', 'prints 1, then sends on done', 'out'],
      ['exit', 'main receives, returns, program ends', 'idle'],
    ],
  },
  challenge: {
    title: 'Make main wait for every fetch',
    prompt: 'Right now `main` might print "all done" before any fetch finishes, or exit while they are still running. Fill the blank so it waits for all of them.',
    code: `var wg sync.WaitGroup
for _, url := range urls {
    wg.Add(1)
    go func() {
        defer wg.Done()
        fetch(url)
    }()
}
wg.___()
fmt.Println("all done")`,
    answers: ['Wait'],
    success: '`wg.Wait()` blocks until the counter is back to zero, which happens after every goroutine has called `Done`. It plays the role of `await Promise.all(...)`.',
    wrong: [
      { answers: ['Done'], title: 'Done is for the workers', body: '`Done` lowers the counter by one. The goroutines already call it. The parent needs the method that **blocks** until the counter reaches zero.' },
      { answers: ['wait'], title: 'Watch the capital letter', body: 'Exported Go names start with an uppercase letter. The method is `Wait`, and `wait` does not exist outside the `sync` package.' },
    ],
    hint: 'You need the WaitGroup method that blocks until every `Done` has been called.',
  },
  recap: [
    '`go f()` starts `f` in a new goroutine and returns at once.',
    'Function arguments of a `go` call are evaluated immediately.',
    'When `main` returns, the program ends, even if goroutines are still running.',
    'Use `sync.WaitGroup` (Add before `go`, Done in the goroutine, Wait in the parent), or `wg.Go` in Go 1.25 and later.',
    'Unlike async code in Node, goroutines can run in parallel on many CPU cores.',
  ],
}

const select: LessonContent = {
  id: 'select',
  minutes: 14,
  lead: 'A goroutine often waits for one of several things: a result, a timeout, or a stop signal. In JavaScript you would reach for `Promise.race`. In Go you use `select`. It looks like a `switch`, but each case is a channel operation. Whichever one is ready first wins.',
  fromTs: {
    title: 'Promise.race, built into the language',
    intro: 'A classic: wait for a result, but give up after one second. JavaScript races two promises, one of them a `setTimeout` that rejects. Go waits on two channels in one `select`. (`Promise<never>` in the TypeScript is only a type label for a promise that never resolves; at runtime it is a plain promise.)',
    ts: `const timeout = new Promise<never>((_, rej) =>
  setTimeout(() => rej(new Error("timeout")), 1000),
);

try {
  const r = await Promise.race([fetchData(), timeout]);
  console.log(r);
} catch {
  console.log("timed out");
}`,
    go: `result := make(chan string)
go func() { result <- fetchData() }()

select {
case r := <-result:
    fmt.Println(r)
case <-time.After(time.Second):
    fmt.Println("timed out")
}`,
    facts: [
      ['Waits on many channels', 'Each `case` is a send or a receive. `select` blocks (pauses this goroutine) until one of them can go ahead.'],
      ['Random when tied', 'If several cases are ready at once, Go picks one at random. Unlike `Promise.race`, array position gives no priority.'],
      ['default never blocks', 'Add a `default` case and `select` runs it right away when nothing else is ready.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The shape',
      title: 'A switch where every case is a channel',
      blocks: [
        'Each case is either a receive (`v := <-ch` or `<-ch`) or a send (`ch <- v`). `select` looks at all of them and picks one that can run now. If none can, it blocks until one can.',
        {
          code: `for {
    select {
    case msg := <-inbox:
        handle(msg)
    case out <- nextItem:
        advance()
    case <-quit:
        return
    }
}`,
        },
        'This loop handles messages, pushes items out when someone is ready to take them, and stops when `quit` is closed. A `select` inside a `for` is the core of most long-running goroutines. It plays the role an event listener plays in Node: wait for something, react, wait again.',
      ],
    },
    {
      eyebrow: 'Non-blocking',
      title: 'default: try without waiting',
      blocks: [
        'With a `default` case, `select` never blocks. Use it to "try" a send or receive: do it if possible, otherwise move on.',
        {
          code: `select {
case jobs <- job:
    fmt.Println("queued")
default:
    fmt.Println("queue full, dropping job")
}`,
        },
        { pitfall: 'A `for` loop with a `select` that has a `default` and nothing else to do will spin and burn 100% of a CPU core, like a `while (true)` loop in JS. Only use `default` when you have useful work to do instead of waiting.', title: 'Busy loops' },
      ],
    },
    {
      eyebrow: 'Timeouts and nil',
      title: 'Timers and turning cases off',
      blocks: [
        {
          table: {
            head: ['Tool', 'What it gives you'],
            rows: [
              ['`time.After(d)`', 'A channel that receives once after `d`, like `setTimeout`. Good for a one-off timeout.'],
              ['`time.NewTicker(d)`', 'A channel that receives every `d`, like `setInterval`. Call `Stop()` when done.'],
              ['`ctx.Done()`', 'A channel that is closed when the work is cancelled. See [context](/lesson/context).'],
              ['a `nil` channel', 'Blocks forever, so a case on it is never chosen.'],
            ],
          },
        },
        'The last row is a handy trick: set a channel variable to `nil` to turn its case off. For example, after an input channel is closed, set it to `nil` so `select` stops picking it.',
        {
          code: `for a != nil || b != nil {
    select {
    case v, ok := <-a:
        if !ok { a = nil; continue }
        fmt.Println("a", v)
    case v, ok := <-b:
        if !ok { b = nil; continue }
        fmt.Println("b", v)
    }
}`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Expecting the first case to win', body: 'When two cases are ready together, Go picks randomly on purpose, so no channel can starve the others. Never rely on case order for priority.' },
    { title: 'time.After inside a hot loop', body: 'Each `time.After` call makes a new timer. Since Go 1.23 unused timers are garbage collected, so this no longer leaks, but in a loop that runs millions of times it still allocates on every pass. Create one `time.NewTimer` outside the loop and `Reset` it.' },
    { title: 'An empty select', body: '`select {}` has no cases, so it blocks forever. People sometimes use it on purpose to keep `main` from returning. Written by accident, it looks like a hang.' },
  ],
  predict: {
    code: `ch := make(chan int, 1)
for i := 0; i < 2; i++ {
    select {
    case v := <-ch:
        fmt.Println("got", v)
    default:
        fmt.Println("empty")
        ch <- 7
    }
}`,
    options: ['empty, then got 7', 'got 7, then empty', 'empty, then empty', 'fatal error: deadlock'],
    answer: 0,
    why: 'On the first pass the buffer is empty, so the receive cannot run and `default` prints "empty". It also puts 7 into the buffer, which has room for one. On the second pass the receive is ready, so the program prints "got 7".',
    trace: [
      ['i = 0', 'ch is empty: receive not ready', 'wait'],
      ['default', 'prints "empty", then ch <- 7 fills the buffer', 'out'],
      ['i = 1', 'ch holds 7: receive is ready', 'run'],
      ['case', 'prints "got 7"', 'out'],
    ],
  },
  challenge: {
    title: 'Give up after one second',
    prompt: 'The result takes two seconds to arrive. Fill the blank so this `select` prints "timed out" after one second.',
    code: `select {
case r := <-result:
    fmt.Println(r)
case <-time.___(time.Second):
    fmt.Println("timed out")
}`,
    answers: ['After'],
    success: '`time.After` returns a channel that receives one value once the duration has passed. Whichever case is ready first wins, and here that is the timer.',
    wrong: [
      { answers: ['Sleep'], title: 'Sleep blocks the goroutine', body: '`time.Sleep` pauses the current goroutine and returns nothing, so it cannot be a channel case. You need a function that returns a channel.' },
      { answers: ['Tick', 'NewTicker'], title: 'That repeats', body: 'A ticker fires again and again. For a single timeout, use the function that fires once.' },
    ],
    hint: 'You need a function in package `time` that returns a channel which receives once, **after** a delay.',
  },
  recap: [
    '`select` waits on several channel operations and runs the first one that is ready.',
    'If several are ready, one is chosen at random.',
    '`default` makes `select` non-blocking.',
    '`time.After` gives you a timeout, and a `nil` channel turns a case off.',
  ],
}

const syncLesson: LessonContent = {
  id: 'sync',
  minutes: 16,
  lead: 'Channels work well for passing data from one goroutine to another. Sometimes, though, many goroutines need to share one value, like a cache or a counter. JavaScript never needed locks, because only one piece of your code runs at a time. Go runs code in parallel, so it gives you the `sync` package: Mutex, WaitGroup, Once, and atomic numbers.',
  fromTs: {
    title: 'Why JavaScript never needed a lock',
    intro: 'In Node, this counter is safe. The event loop runs one callback at a time, so nothing can cut into the middle of `count++`. In Go, two goroutines can run `count++` at the very same moment on two cores. A `Mutex` (a lock) makes them take turns.',
    ts: `let count = 0;

function hit() {
  count++; // safe: one thread
}

await Promise.all(
  Array.from({ length: 1000 }, async () => hit()),
);
console.log(count); // 1000`,
    go: `var (
    mu    sync.Mutex
    count int
)

func hit() {
    mu.Lock()
    defer mu.Unlock()
    count++
}`,
    tsFile: 'counter.ts',
    goFile: 'counter.go',
    facts: [
      ['Mutex means "mutual exclusion"', 'Only one goroutine can hold the lock at a time. Others block in `Lock()` until it is free.'],
      ['Zero value is ready', '`var mu sync.Mutex` is an unlocked mutex. There is no `new Mutex()` to call.'],
      ['defer the unlock', '`defer mu.Unlock()` right after `Lock()` works like a `finally` block. You unlock even on an early return or a panic.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Mutex',
      title: 'Put the lock next to the data',
      blocks: [
        'The usual style is to keep the mutex inside the struct that it protects. Code outside only touches the fields through methods that lock, much like keeping state private in a JS class.',
        {
          code: `type Cache struct {
    mu   sync.Mutex
    data map[string]string
}

func (c *Cache) Get(k string) (string, bool) {
    c.mu.Lock()
    defer c.mu.Unlock()
    v, ok := c.data[k]
    return v, ok
}`,
        },
        'Note the pointer receiver `*Cache`. It means the method works on the original struct, the way a JS method gets a reference to its object through `this`. A mutex must never be copied once used, because the copy is a separate lock. `go vet` warns you if you copy one.',
        { note: '`sync.RWMutex` allows many readers at once (`RLock`) but only one writer (`Lock`). Use it when reads are much more common than writes. When in doubt, start with a plain `Mutex`.' },
      ],
    },
    {
      eyebrow: 'The toolbox',
      title: 'Which sync tool for which job',
      blocks: [
        {
          table: {
            head: ['Tool', 'Use it to', 'Closest JS idea'],
            rows: [
              ['`sync.Mutex`', 'Protect shared data', 'Not needed in JS'],
              ['`sync.RWMutex`', 'Many readers, few writers', 'Not needed in JS'],
              ['`sync.WaitGroup`', 'Wait for N goroutines', '`await Promise.all`'],
              ['`sync.Once`', 'Run setup exactly once', 'A lazily created module singleton'],
              ['`sync/atomic`', 'Fast counters and flags', 'Not needed in JS'],
              ['`sync.Map`', 'Special caches with rare writes', 'A `Map`, but usually a mutex is better'],
            ],
          },
        },
        'A popular Go saying is "share memory by communicating". Channels are often the cleanest design. A mutex around a small piece of state is also fine, and it is fast. Pick whichever makes the code easier to read.',
      ],
    },
    {
      eyebrow: 'Once and atomic',
      title: 'Lazy setup and lock-free counters',
      blocks: [
        '`sync.Once` runs a function the first time `Do` is called, and never again, even when many goroutines call it at once. In JS you would write `if (!cache) cache = load()`. That is safe on one thread, but in Go two goroutines could both see the empty cache. Go 1.21 added helpers like `sync.OnceValue` that also cache the result.',
        {
          code: `var getConfig = sync.OnceValue(func() *Config {
    return loadConfig() // runs only once
})

func handler() {
    cfg := getConfig() // cheap after the first call
    _ = cfg
}`,
        },
        'For a single number, `sync/atomic` is faster than a mutex. An atomic operation is one the CPU finishes in a single step that no other core can cut into. (JS has `Atomics` for `SharedArrayBuffer`, the same idea.) The typed versions are the easiest to use:',
        {
          code: `var hits atomic.Int64

func hit() { hits.Add(1) }

func report() { fmt.Println(hits.Load()) }`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Forgetting to unlock', body: 'If a function returns early between `Lock` and `Unlock`, the lock is never released and every other goroutine waits forever. Write `defer mu.Unlock()` on the very next line.' },
    { title: 'Locking twice in the same goroutine', body: 'Go mutexes are not re-entrant: the goroutine holding the lock cannot take it again. If a locked method calls another method that also locks the same mutex, the goroutine waits for itself forever. Split into a locked public method and an unlocked private helper.' },
    { title: 'Copying a struct that holds a mutex', body: 'A value receiver like `func (c Cache) Get()` copies the struct and its mutex, so the lock protects nothing. Use pointer receivers for types with a mutex inside.' },
  ],
  predict: {
    code: `var once sync.Once
for i := 0; i < 3; i++ {
    once.Do(func() {
        fmt.Println("init", i)
    })
}
fmt.Println("ready")`,
    options: ['init 0, init 1, init 2, ready', 'init 0, ready', 'init 2, ready', 'ready'],
    answer: 1,
    why: '`once.Do` runs its function only on the first call. On the first loop pass `i` is 0, so it prints "init 0". The next two calls to `Do` do nothing, even though they pass a new function. Then "ready" prints.',
    trace: [
      ['i = 0', 'first Do: runs the function, prints "init 0"', 'out'],
      ['i = 1', 'Do already ran: skipped', 'idle'],
      ['i = 2', 'Do already ran: skipped', 'idle'],
      ['line 7', 'prints "ready"', 'out'],
    ],
  },
  challenge: {
    title: 'Release the lock safely',
    prompt: 'This method locks the counter. Fill the blank so the lock is always released when the method returns.',
    code: `func (c *Counter) Inc() {
    c.mu.Lock()
    defer c.mu.___()
    c.n++
}`,
    answers: ['Unlock'],
    success: '`defer c.mu.Unlock()` runs when `Inc` returns, however it returns. Lock, then defer the unlock on the next line: this pair shows up all over Go code.',
    wrong: [
      { answers: ['Lock'], title: 'That locks again', body: 'Calling `Lock` a second time from the same goroutine waits for itself, so the program hangs. You want the opposite operation.' },
      { answers: ['RUnlock'], title: 'Wrong kind of unlock', body: '`RUnlock` releases a **read** lock taken with `RLock`. This code took a normal lock with `Lock`.' },
    ],
    hint: 'Every `Lock` needs a matching method that releases it.',
  },
  recap: [
    'Goroutines run in parallel, so shared data needs protection that JavaScript never needed.',
    'Lock a `sync.Mutex`, then `defer` the Unlock on the next line.',
    'Keep the mutex next to the data, and use pointer receivers so it is never copied.',
    '`sync.Once` runs setup once; `sync/atomic` types are fast counters and flags.',
  ],
}

const races: LessonContent = {
  id: 'races',
  minutes: 14,
  lead: 'A data race happens when two goroutines touch the same variable at the same time and at least one of them writes. The result is random, and the bug may show up once in a thousand runs. Go ships a race detector that finds these for you. You turn it on with one flag.',
  fromTs: {
    title: 'The bug JavaScript protects you from',
    intro: 'In Node, a thousand async increments always end at 1000, because only one callback runs at a time. The same code with goroutines can give a different number on each run.',
    ts: `let count = 0;
const jobs = [];
for (let i = 0; i < 1000; i++) {
  jobs.push((async () => { count++; })());
}
await Promise.all(jobs);
console.log(count); // always 1000`,
    go: `count := 0
var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Go(func() {
        count++ // data race!
    })
}
wg.Wait()
fmt.Println(count) // 945? 992?`,
    facts: [
      ['count++ is three steps', 'Read the value, add one, write it back. Two goroutines can both read 41 and both write 42. One increment is lost.'],
      ['Random by nature', 'It depends on timing and on how many CPU cores are busy. Tests can pass for weeks and then fail in production.'],
      ['go run -race', 'The race detector watches memory while your program runs. It reports each race with both stack traces, like a JS error\'s `stack`.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The detector',
      title: 'Let the tool find races for you',
      blocks: [
        'Add `-race` to `go run`, `go test` or `go build`. The program runs slower and uses more memory, but every race that **actually happens** during the run is reported.',
        {
          code: `$ go run -race main.go
==================
WARNING: DATA RACE
Read at 0x00c0000a0038 by goroutine 8:
  main.main.func1()
      main.go:13 +0x2e
Previous write at 0x00c0000a0038 by goroutine 7:
  main.main.func1()
      main.go:13 +0x44
==================`,
          file: 'terminal',
        },
        'It only sees races on code paths that ran, so it does not prove your program is race-free. Think of it like test coverage: untested code is unchecked. Run your tests with `go test -race ./...` in CI, which is the standard habit in Go teams.',
      ],
    },
    {
      eyebrow: 'Three fixes',
      title: 'How to make shared data safe',
      blocks: [
        'There are three common fixes. Pick the one that reads best:',
        {
          table: {
            head: ['Fix', 'How', 'Good for'],
            rows: [
              ['Lock it', '`sync.Mutex` around every read and write', 'Structs, maps, several fields'],
              ['Atomic', '`atomic.Int64` with `Add` and `Load`', 'One counter or flag'],
              ['Do not share', 'Each goroutine owns its data and sends results on a channel', 'Pipelines, workers'],
            ],
          },
        },
        {
          code: `var count atomic.Int64
var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Go(func() {
        count.Add(1)
    })
}
wg.Wait()
fmt.Println(count.Load()) // always 1000`,
        },
      ],
    },
    {
      eyebrow: 'Maps',
      title: 'Maps are not safe for concurrent writes',
      blocks: [
        'Go maps have no lock inside. If one goroutine writes a map while another reads or writes it, the runtime may crash on purpose with `fatal error: concurrent map writes` (or `concurrent map read and map write`). This is a fatal error, not a panic, so `recover` cannot stop it.',
        { pitfall: 'Guard a shared map with a `sync.Mutex` (or `RWMutex`). Reading from many goroutines with no writers at all is fine.', title: 'Shared map, no lock' },
      ],
    },
  ],
  pitfalls: [
    { title: '"It passed, so it is fine"', body: 'A race may need just the right timing. A test that passes ten times can still have one. Only `-race` (or careful reasoning) tells you for sure.' },
    { title: 'Reading without a lock', body: 'Locking only the writes is not enough. A read at the same time as a write is also a race. Every access to shared data needs the lock, reads included.' },
    { title: 'Using time.Sleep to "fix" a race', body: 'Adding a sleep changes the timing and may hide the bug, but nothing guarantees the order. Use a WaitGroup, a channel or a mutex to create real ordering.' },
  ],
  deepDive: {
    q: 'How does the race detector know?',
    body: [
      'With `-race`, the compiler adds a small check to every memory read and write. A runtime library called ThreadSanitizer keeps a vector clock for each goroutine. That is a set of counters that records what each goroutine has seen from the others. It also records which goroutine touched each memory location last.',
      'Some events put two accesses in a fixed order, called "happens-before": a mutex unlock then lock, or a channel send then receive. If two accesses have no such event between them, the detector reports a race. This bookkeeping on every access is why a `-race` build can be 5 to 10 times slower.',
    ],
  },
  predict: {
    q: 'What can this program print?',
    code: `count := 0
var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Go(func() {
        count++
    })
}
wg.Wait()
fmt.Println(count)`,
    options: ['Always 1000', 'Sometimes less than 1000', 'Always less than 1000', 'It does not compile'],
    answer: 1,
    why: '`count++` is a read, an add and a write. Goroutines on different cores can read the same old value and overwrite each other, so some increments get lost. How many depends on timing: some runs print 1000, many print less. That is a data race, and `go run -race` reports it.',
    trace: [
      ['g7', 'reads count = 41', 'run'],
      ['g8', 'reads count = 41 at the same time', 'run'],
      ['g7', 'writes 42', 'run'],
      ['g8', 'writes 42: one increment lost', 'wait'],
      ['run 1', '945', 'out'],
      ['run 2', '992', 'out'],
      ['-race', 'WARNING: DATA RACE', 'err'],
    ],
  },
  challenge: {
    title: 'Fix the counter with an atomic',
    prompt: '`count` is now an `atomic.Int64`. Fill the blank so each goroutine adds one safely.',
    code: `var count atomic.Int64
var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Go(func() {
        count.___(1)
    })
}
wg.Wait()
fmt.Println(count.Load())`,
    answers: ['Add'],
    success: '`count.Add(1)` does the read, the add and the write as one step that the CPU will not split. The program prints 1000 every time, and `-race` stays quiet.',
    wrong: [
      { answers: ['Store'], title: 'Store overwrites', body: '`Store(1)` sets the value to 1. Every goroutine would set it to 1, so you would print 1. You want to **increase** it.' },
      { answers: ['Inc', 'Increment'], title: 'No such method', body: 'The atomic types do not have an increment method. The method that adds a number takes the amount as its argument.' },
    ],
    hint: 'Look for the atomic method that adds a value and returns the new total.',
  },
  recap: [
    'A data race is two goroutines touching the same memory at once, with at least one write.',
    '`count++` is not one step. Races lose updates at random.',
    'Run `go test -race ./...` in CI. The detector reports races that actually happen.',
    'Fix with a mutex, an atomic, or by not sharing the data at all.',
  ],
}

const context: LessonContent = {
  id: 'context',
  minutes: 16,
  lead: 'When a user closes the browser tab, the server should stop the database query it started for them. In JavaScript you pass an `AbortSignal` from an `AbortController`. In Go you pass a `context.Context` as the first argument to every function that might take a while. It carries a cancel signal, a deadline, and a few values tied to the current request.',
  fromTs: {
    title: 'AbortController, the Go way',
    intro: 'Both versions start a slow operation and cancel it after one second. The ideas map almost one to one: `AbortController` is `context.WithCancel` or `WithTimeout`, and `signal` is `ctx`.',
    ts: `const ac = new AbortController();
setTimeout(() => ac.abort(), 1000);

try {
  const res = await fetch(url, {
    signal: ac.signal,
  });
  console.log(res.status);
} catch (e) {
  console.log("aborted");
}`,
    go: `ctx, cancel := context.WithTimeout(
    context.Background(), time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(
    ctx, "GET", url, nil)
res, err := http.DefaultClient.Do(req)
if err != nil {
    fmt.Println("aborted:", err)
    return
}
fmt.Println(res.Status)`,
    facts: [
      ['First argument, always', 'By convention the context is the first parameter, named `ctx`: `func Load(ctx context.Context, id int)`.'],
      ['Contexts form a tree', 'Each `WithCancel` or `WithTimeout` makes a child. Cancelling a parent cancels all its children. A child can also be cancelled on its own without touching the parent.'],
      ['Always call cancel', '`With...` functions return a `cancel` function, the same job as `ac.abort()`. `defer cancel()` frees the timer and other resources.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Making contexts',
      title: 'Start from a root, then add limits',
      blocks: [
        'Every context tree starts at a root. In a web server, `r.Context()` from the request is your root. Go cancels it when the client disconnects, like listening for `req.on("close")` in Express. In `main` or tests you use `context.Background()`.',
        {
          table: {
            head: ['Function', 'Cancelled when'],
            rows: [
              ['`context.Background()`', 'Never. The empty root.'],
              ['`context.WithCancel(parent)`', 'You call `cancel()`, or the parent is cancelled'],
              ['`context.WithTimeout(parent, d)`', 'After `d`, or `cancel()`, or the parent'],
              ['`context.WithDeadline(parent, t)`', 'At time `t`, or `cancel()`, or the parent'],
              ['`context.WithValue(parent, k, v)`', 'Same as parent; it only adds a value'],
            ],
          },
        },
      ],
    },
    {
      eyebrow: 'Listening',
      title: 'How your code notices cancellation',
      blocks: [
        'A context has two methods for this. `ctx.Done()` returns a channel that is closed on cancel, so you can use it in a [select](/lesson/select). It is the Go version of `signal.addEventListener("abort", ...)`. `ctx.Err()` returns `nil` while the context is alive, and `context.Canceled` or `context.DeadlineExceeded` after. It is close to checking `signal.aborted` and `signal.reason`.',
        {
          code: `func worker(ctx context.Context, jobs <-chan Job) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // stop and say why
        case j := <-jobs:
            process(j)
        }
    }
}`,
        },
        'Library functions that do I/O, like `http.Client.Do` or `db.QueryContext`, already watch the context for you. You only need `select` on `ctx.Done()` in your own long-running loops.',
        { note: 'Cancelling is a request, not a kill. This works like `AbortSignal`: `fetch` stops when you abort, but your own loop keeps going unless it checks `signal.aborted`. Go cannot stop a goroutine from the outside. The goroutine must check `ctx` and return on its own.' },
      ],
    },
    {
      eyebrow: 'Values',
      title: 'Request values, used sparingly',
      blocks: [
        '`context.WithValue` attaches data such as a request ID or the logged-in user, a bit like setting `res.locals.user` in Express. Use a private key type so no other package can collide with your key. It works like using a private `Symbol` as an object key in JS.',
        {
          code: `type ctxKey struct{}

func WithUser(ctx context.Context, u *User) context.Context {
    return context.WithValue(ctx, ctxKey{}, u)
}

func UserFrom(ctx context.Context) (*User, bool) {
    u, ok := ctx.Value(ctxKey{}).(*User)
    return u, ok
}`,
        },
        { pitfall: 'Do not pass normal function inputs through context values. If a function needs a database handle or a config, make it a real parameter. Values are for data that crosses API boundaries, like trace IDs.', title: 'Context is not a bag of arguments' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Forgetting defer cancel()', body: 'A `WithTimeout` context keeps a timer alive until it fires or you cancel. Skipping `cancel` leaks it, and `go vet` warns about it. Write `defer cancel()` on the next line.' },
    { title: 'Storing a context in a struct', body: 'Pass `ctx` as a parameter to each call instead of keeping it in a field. A context belongs to one request or one operation, not to a long-lived object.' },
    { title: 'Using context.Background() deep in a handler', body: 'That throws away the request cancellation, like calling `fetch` without the `signal` you were handed. When the client leaves, your query keeps running. Pass the `ctx` you were given all the way down.' },
  ],
  predict: {
    code: `ctx, cancel := context.WithCancel(
    context.Background())
fmt.Println(ctx.Err())
cancel()
fmt.Println(ctx.Err())
<-ctx.Done()
fmt.Println("done")`,
    options: [
      '<nil>, context canceled, done',
      'context canceled, context canceled, done',
      '<nil>, <nil>, done',
      '<nil>, context canceled, then deadlock',
    ],
    answer: 0,
    why: 'Before `cancel()` the context is alive, so `Err()` is `nil`. After `cancel()`, `Err()` returns `context.Canceled`, which prints as "context canceled". `Done()` is a channel that is **closed** on cancel, and receiving from a closed channel never blocks, so "done" prints too.',
    trace: [
      ['line 3', 'ctx alive: Err() = <nil>', 'out'],
      ['line 4', 'cancel() closes ctx.Done()', 'run'],
      ['line 5', 'Err() = context canceled', 'out'],
      ['line 6', '<-ctx.Done(): channel closed, returns at once', 'run'],
      ['line 7', 'prints "done"', 'out'],
    ],
  },
  challenge: {
    title: 'Clean up the timeout',
    prompt: 'This function gives itself two seconds. Fill the blank so the context resources are always released when it returns.',
    code: `func load(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer ___()
    return query(ctx)
}`,
    answers: ['cancel'],
    success: '`defer cancel()` stops the timer and releases the child context as soon as `load` returns, even if the query finished early. It is safe to call `cancel` more than once.',
    wrong: [
      { answers: ['ctx.Done'], title: 'Done is for listening', body: '`ctx.Done()` only returns a channel to wait on. Calling it does not release anything. Use the function that `WithTimeout` gave you.' },
      { answers: ['close'], title: 'Not a channel to close', body: 'You never close a context yourself. `WithTimeout` returned a function for that job.' },
    ],
    hint: '`WithTimeout` returns two values. The second one is the function you should defer.',
  },
  recap: [
    'Pass `ctx context.Context` as the first parameter of anything slow.',
    '`WithCancel` and `WithTimeout` make child contexts; always `defer cancel()`.',
    'Watch `ctx.Done()` in a `select`, and return `ctx.Err()` to say why you stopped.',
    'Cancellation is cooperative: the goroutine must check and return on its own.',
  ],
}

const patterns: LessonContent = {
  id: 'patterns',
  minutes: 18,
  lead: 'With goroutines, channels and WaitGroups you can build a few patterns that cover most real concurrent code: a worker pool to limit parallel work, a pipeline of stages, and fan-in to merge results. You have probably built small versions of these in JavaScript with `p-limit` or async iterators (`for await`).',
  fromTs: {
    title: 'Limit concurrency, like p-limit',
    intro: 'Say you have 1,000 images to resize but only want 4 at a time. In JavaScript you would use an npm package like `p-limit`. In Go you start 4 worker goroutines that all read from one jobs channel. The channel hands out work to whoever is free. Unlike `p-limit` in Node, the 4 resizes can run on 4 CPU cores at once.',
    ts: `import pLimit from "p-limit";

const limit = pLimit(4);
const results = await Promise.all(
  files.map((f) => limit(() => resize(f))),
);`,
    go: `jobs := make(chan string)
results := make(chan Image)

for w := 0; w < 4; w++ {
    go func() {
        for f := range jobs {
            results <- resize(f)
        }
    }()
}`,
    facts: [
      ['Workers pull, nobody pushes', 'Each worker takes the next job when it is ready. Fast workers take more jobs.'],
      ['Closing ends the workers', 'When the jobs channel is closed, each `for range` loop ends and the worker returns.'],
      ['No library needed', 'The pattern is a few lines of standard Go.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Worker pool',
      title: 'The full worker pool',
      blocks: [
        'A complete pool needs three parts: feed jobs, run workers, and close the results channel once every worker is finished, so the reader knows when to stop.',
        {
          code: `func resizeAll(files []string) []Image {
    jobs := make(chan string)
    results := make(chan Image)

    var wg sync.WaitGroup
    for w := 0; w < 4; w++ {
        wg.Go(func() {
            for f := range jobs {
                results <- resize(f)
            }
        })
    }

    go func() { // feed jobs
        for _, f := range files {
            jobs <- f
        }
        close(jobs)
    }()

    go func() { // close results when all workers end
        wg.Wait()
        close(results)
    }()

    var out []Image
    for img := range results {
        out = append(out, img)
    }
    return out
}`,
        },
        'Each channel has exactly one owner who closes it: the feeder closes `jobs`, and the helper goroutine closes `results` after `wg.Wait()`. Results arrive in any order; add an index to each job if you need the original order.',
        { note: 'If you only need "run at most N at a time and wait", the `golang.org/x/sync/errgroup` package does it with `g.SetLimit(n)` and also collects the first error. It is the closest thing to `Promise.all` plus `p-limit`.' },
      ],
    },
    {
      eyebrow: 'Pipeline',
      title: 'Stages connected by channels',
      blocks: [
        'A pipeline is a chain of stages. Each stage reads from an input channel, does one thing, and writes to an output channel. It feels like chaining async generators in JavaScript, or piping Node streams. One difference: each Go stage runs in its own goroutine, so all stages can work at the same time.',
        {
          compare: {
            ts: `async function* square(src) {
  for await (const n of src) {
    yield n * n;
  }
}

for await (const v of square(gen())) {
  console.log(v);
}`,
            go: `func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}`,
          },
        },
        'The arrow types say who may do what: `<-chan int` can only be received from, `chan<- int` can only be sent to. The compiler stops a stage from closing a channel it only reads.',
      ],
    },
    {
      eyebrow: 'Fan-in',
      title: 'Merge many channels into one',
      blocks: [
        'Fan-out means several goroutines read from one channel (the worker pool). Fan-in is the opposite: several channels flow into one.',
        {
          code: `func merge(ins ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    for _, in := range ins {
        wg.Go(func() {
            for v := range in {
                out <- v
            }
        })
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}`,
        },
        {
          list: [
            '**Worker pool**: limit how much runs at once.',
            '**Pipeline**: split work into stages that run at the same time.',
            '**Fan-in**: combine results from many producers.',
            '**errgroup**: run tasks, stop on the first error, wait for all.',
          ],
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Closing results from a worker', body: 'If each worker closes `results` when it ends, the second one panics with "close of closed channel". Close it once, from a goroutine that waits for all workers.' },
    { title: 'Reading results in the same goroutine that feeds jobs', body: 'With unbuffered channels, if `main` sends all jobs before reading any result, workers block on `results <-` and nobody is left to take jobs. Feed in a separate goroutine.' },
    { title: 'No way to stop early', body: 'If the reader quits early, stages block forever on send. Pass a `ctx` and use `select` with `case <-ctx.Done()` on each send. See [Deadlocks and goroutine leaks](/lesson/deadlocks).' },
  ],
  predict: {
    code: `jobs := make(chan int)
results := make(chan int)
for w := 0; w < 3; w++ {
    go func() {
        for n := range jobs {
            results <- n * n
        }
    }()
}
go func() {
    for i := 1; i <= 4; i++ {
        jobs <- i
    }
    close(jobs)
}()
sum := 0
for i := 0; i < 4; i++ {
    sum += <-results
}
fmt.Println(sum)`,
    options: ['30', '10', 'A different number each run', 'fatal error: deadlock'],
    answer: 0,
    why: 'The three workers square the numbers 1 to 4 in some random order. Addition does not care about order: 1 + 4 + 9 + 16 is always 30. `main` reads exactly four results, so it never waits for a fifth.',
    trace: [
      ['feeder', 'sends 1, 2, 3, 4 then closes jobs', 'run'],
      ['workers', 'square each job, in any order', 'run'],
      ['main', 'receives 4 results: 1, 4, 9, 16 (any order)', 'wait'],
      ['line 20', 'prints 30', 'out'],
    ],
  },
  challenge: {
    title: 'Close the merged channel',
    prompt: 'This fan-in helper must close `out` once every input is drained, so callers can `range` over it. Fill the blank.',
    code: `go func() {
    wg.Wait()
    ___(out)
}()
return out`,
    answers: ['close'],
    success: 'After `wg.Wait()` no goroutine will send on `out` again, so it is safe to close it. Any `for v := range merge(...)` loop then ends on its own.',
    wrong: [
      { answers: ['wg.Done', 'Done'], title: 'Done is for each worker', body: 'The forwarding goroutines already call Done through `wg.Go`. Here you need to tell the reader that no more values are coming.' },
    ],
    hint: 'Which built-in function tells a `range` loop over a channel that no more values will arrive?',
  },
  recap: [
    'A worker pool is N goroutines ranging over one jobs channel.',
    'Every channel has one owner who closes it; close `results` after `wg.Wait()`.',
    'Pipelines are stages linked by channels; use `<-chan` and `chan<-` to make roles clear.',
    'For "run limited tasks, stop on first error", reach for `errgroup`.',
  ],
}

const deadlocks: LessonContent = {
  id: 'deadlocks',
  minutes: 15,
  lead: 'Concurrent code can get stuck in two ways. A deadlock is when every goroutine is stuck waiting. Go notices and crashes with a clear message. A goroutine leak is when only some goroutines are stuck forever. The program keeps running, but memory grows slowly until something breaks. Nothing warns you about a leak.',
  fromTs: {
    title: 'A promise that never resolves',
    intro: 'In JavaScript, a promise that never settles sits in memory with its closure. Nothing crashes. A Go goroutine blocked forever is the same idea, except it also holds its stack. Here is a "first answer wins" helper that leaks in both languages.',
    ts: `function first(urls: string[]) {
  return new Promise((resolve) => {
    for (const u of urls) {
      get(u).then(resolve);
    }
  });
}
// the slower requests still run,
// their results are thrown away`,
    go: `func first(urls []string) string {
    ch := make(chan string)
    for _, u := range urls {
        go func() { ch <- get(u) }()
    }
    return <-ch
}
// the slower goroutines block on
// ch <- forever: a leak`,
    facts: [
      ['Deadlock: everyone waits', 'If no goroutine can move, the runtime stops with "all goroutines are asleep - deadlock!".'],
      ['Leak: some wait forever', 'The runtime cannot detect this. Those goroutines and their memory stay until the process exits.'],
      ['Fixes are small', 'A buffer, a closed channel or a `ctx.Done()` case usually gives stuck goroutines a way out.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Deadlocks',
      title: 'The usual ways to freeze',
      blocks: [
        'You met the first one in [Channels](/lesson/channels). Here are the common shapes:',
        {
          table: {
            head: ['Cause', 'Example'],
            rows: [
              ['Send with no receiver', '`ch <- 1` on an unbuffered channel in `main`'],
              ['range with no close', '`for v := range ch` where the sender never calls `close(ch)`'],
              ['WaitGroup never reaches zero', '`wg.Add(2)` but only one `wg.Done()`'],
              ['Locks in opposite order', 'g1 locks A then B, g2 locks B then A'],
              ['Locking twice', 'A method holding `mu` calls another that locks `mu`'],
            ],
          },
        },
        'The runtime only reports a deadlock when **every** goroutine is blocked. In a server, the HTTP listener goroutine is always waiting for connections, so a stuck request never triggers the crash. It hangs, like an Express handler that never calls `res.send`.',
      ],
    },
    {
      eyebrow: 'Leaks',
      title: 'Give every goroutine a way out',
      blocks: [
        'Before you write `go`, ask: **how does this goroutine end?** If the answer is "when someone receives its value", ask what happens if nobody does. Two common fixes for the `first` helper:',
        {
          code: `// Fix 1: buffer room for every sender
ch := make(chan string, len(urls))

// Fix 2: let senders give up when we are done
ctx, cancel := context.WithCancel(ctx)
defer cancel()
go func() {
    select {
    case ch <- get(ctx, u):
    case <-ctx.Done():
    }
}()`,
        },
        'Fix 1 is the simplest. Every sender can drop its value in the buffer and exit, even if nobody reads it. Fix 2 also stops the slow requests themselves, which saves real work. It is the Go version of aborting the losing `fetch` calls after a `Promise.race`.',
      ],
    },
    {
      eyebrow: 'Finding them',
      title: 'Tools that show stuck goroutines',
      blocks: [
        {
          list: [
            '`runtime.NumGoroutine()` returns how many goroutines exist. Log it, or graph it in production. A number that only goes up is a leak, the same way a Node heap that only grows points to a memory leak.',
            'Import `net/http/pprof` and open `/debug/pprof/goroutine?debug=1` to see every goroutine and the line it is stuck on.',
            'Send `SIGQUIT` (Ctrl+\\) to a running program to print all goroutine stacks.',
            'In tests, the `go.uber.org/goleak` package fails a test that leaves goroutines behind.',
          ],
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Thinking no crash means no bug', body: 'Leaks never crash right away. A handler that leaks one goroutine per request looks fine in testing and runs out of memory after a week in production.' },
    { title: 'Fixing a deadlock with a bigger buffer', body: 'A buffer can hide a design bug until the traffic gets higher than the buffer size. First make sure every send has a receiver, or a way to give up.' },
    { title: 'Waiting on a WaitGroup with the wrong count', body: 'Calling `wg.Add(3)` inside a loop that runs three times adds 9. `Wait` then blocks forever. Add 1 per goroutine, or use `wg.Go`.' },
  ],
  deepDive: {
    q: 'How does the runtime detect a deadlock?',
    body: [
      'The scheduler tracks how many goroutines are runnable or running. When that number drops to zero and no timers or network waits are pending that could wake anyone up, nothing can ever change again. The runtime prints the stack of every goroutine and exits with code 2.',
      'A goroutine leaked in a running server never triggers this, because other goroutines (like the HTTP listener) are still able to wake up.',
    ],
  },
  predict: {
    q: 'What number does this print?',
    code: `func first() int {
    ch := make(chan int)
    for i := 1; i <= 3; i++ {
        go func() { ch <- i }()
    }
    return <-ch
}

func main() {
    first()
    time.Sleep(50 * time.Millisecond)
    fmt.Println(runtime.NumGoroutine())
}`,
    options: ['1', '3', '4', 'fatal error: deadlock'],
    answer: 1,
    why: 'Three goroutines try to send on an unbuffered channel. `first` receives only one value and returns. The other two goroutines wait forever on `ch <- i`. That is a leak, and the runtime does not call it a deadlock, because `main` can still run. So the count is `main` plus 2 leaked goroutines: 3.',
    trace: [
      ['first', 'starts g1, g2, g3', 'run'],
      ['first', 'receives one value, returns', 'run'],
      ['g2, g3', 'blocked on ch <- forever, nobody will receive', 'wait'],
      ['main', 'still runnable, so no deadlock error', 'runtime'],
      ['line 12', 'NumGoroutine() = 1 main + 2 leaked = 3', 'out'],
    ],
  },
  challenge: {
    title: 'Fix the stuck WaitGroup',
    prompt: 'This program hangs and then crashes with a deadlock. Fill the blank so `Wait` returns once all three goroutines are finished.',
    code: `var wg sync.WaitGroup
for i := 0; i < 3; i++ {
    wg.Add(___)
    go func() {
        defer wg.Done()
        work(i)
    }()
}
wg.Wait()`,
    answers: ['1'],
    success: 'One `Add(1)` per goroutine and one `Done()` per goroutine. The counter goes 1, 2, 3 and back down to 0, and `Wait` returns.',
    wrong: [
      { answers: ['3'], title: 'That adds 9', body: 'The `Add` runs inside the loop, three times. The counter reaches 9 but only three `Done` calls happen, so `Wait` blocks forever and the runtime reports a deadlock.' },
      { answers: ['0'], title: 'Wait would not wait', body: 'With nothing added, `Wait` returns immediately without waiting. Any goroutine that reaches `Done` before the program exits drops the counter below zero and panics with "sync: negative WaitGroup counter".' },
    ],
    hint: 'Each goroutine calls `Done` exactly once. How much should each loop pass add?',
  },
  recap: [
    'Deadlock: every goroutine is blocked, and Go crashes with a clear message.',
    'Leak: some goroutines block forever, and nothing tells you.',
    'Before each `go`, know how that goroutine will end.',
    'Use buffers sized for every sender, `ctx.Done()` cases, and `NumGoroutine` or pprof to find leaks.',
  ],
}

export const CONCURRENCY: LessonContent[] = [goroutines, select, syncLesson, races, context, patterns, deadlocks]
