import type { LessonContent } from './types'

const goroutines: LessonContent = {
  id: 'goroutines',
  minutes: 15,
  lead: 'You want to fetch ten URLs at once without waiting for each one in turn. In JavaScript you reach for promises and `async/await`. In Go you put the word `go` in front of a function call, and that call now runs on its own. This lesson shows how that works, why there is no `await`, and how to wait for the work to finish.',
  fromTs: {
    title: 'Promise.all, without the promises',
    intro: 'Here is a job you have probably written before: fetch several URLs at once and wait until all of them are done. In JavaScript you build an array of promises and `await Promise.all(...)`. In Go you start one **goroutine** (a very cheap thread run by the Go runtime) per URL. Then you wait on a `sync.WaitGroup`, which is a counter of jobs that have not finished yet.',
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
      ['No async/await', '`get(u)` is a normal function that blocks: it returns only when the response is in. Only that one goroutine waits. The rest of the program keeps going.'],
      ['Real parallelism', 'Goroutines run on all your CPU cores (the separate processors inside your machine). In Node, two CPU-heavy `parse` calls still take turns on one thread. In Go they can run at the same moment.'],
      ['Very cheap', 'A goroutine starts with a 2 KB stack (the memory that holds its local variables and function calls). Starting 100,000 of them is normal.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The go keyword',
      title: 'One word starts a goroutine',
      blocks: [
        { note: 'Write `go` before a function call, and that call runs in the background while your code moves on to the next line.', title: 'In one sentence' },
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
        'Run this and you see both lines printed. The first `say` runs in a new goroutine. The second runs in `main` as usual.',
        'It feels like calling an `async` function without `await`: the work starts, and your code carries on. One difference: `go` gives you nothing back. There is no promise and no return value.',
        'The `time.Sleep` is there only to keep `main` alive long enough for the goroutine to print. Real code never waits with sleep. It waits with a `WaitGroup` or a channel, as you will see below.',
        { pitfall: 'When `main` returns, the whole program exits. Goroutines that are still running are stopped without warning. Node keeps the process alive while timers, open sockets or other I/O are still pending. Go does not. It behaves as if `main` ended with `process.exit()`.', title: 'main does not wait for anyone' },
      ],
    },
    {
      eyebrow: 'Colored functions',
      title: 'No more async spreading through your code',
      blocks: [
        'In JavaScript, once one function is `async`, every caller has to `await` it, and their callers too. People call this **function coloring**: async functions are one color, normal functions another, and the color spreads up the call chain.',
        'Go has no colors. Every function is a normal function. The caller decides whether to run it in the background by writing `go`.',
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
        'You might wonder: isn\'t blocking bad? In Node it is, because a blocking call freezes the event loop and everything stops. Go handles it differently:',
        {
          list: [
            'A goroutine calls something slow, like a network read or a channel receive.',
            'The Go runtime **parks** it: sets it aside without using any CPU.',
            'The same OS thread picks up a different goroutine that is ready to run.',
            'When the data arrives, the parked goroutine is woken up and carries on from the same line.',
          ],
          ordered: true,
        },
        'So you write plain top-to-bottom code, and the runtime does the juggling that the event loop does for you in Node.',
        { note: 'The closest Node feature to goroutines is `worker_threads`, which also gives you real parallel threads. Workers are heavy, though: each one is a separate JavaScript engine with its own variables, and you talk to it with `postMessage`. Goroutines are cheap and share the same memory, so they can all read and write the same variables. That shared access is why later lessons cover locks and data races.', title: 'Think of it like this' },
      ],
    },
    {
      eyebrow: 'Waiting',
      title: 'WaitGroup: a counter you can wait on',
      blocks: [
        { note: 'A `sync.WaitGroup` is a hand-made `Promise.all`: count up when a job starts, count down when it ends, and wait for zero.', title: 'In one sentence' },
        'You use three methods:',
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
        'Since Go 1.25 there is a shortcut, `wg.Go(f)`. It does the Add, the `go` and the Done for you:',
        {
          code: `var wg sync.WaitGroup
for _, u := range urls {
    wg.Go(func() { // Add(1), go, and defer Done() in one call
        parse(get(u))
    })
}
wg.Wait() // blocks until every job is done`,
        },
        { note: 'Since Go 1.22 each loop iteration gets its own copy of `u`, like `let` in a JS `for` loop, so capturing it in the closure is safe. Older blog posts write `u := u` or pass `u` as an argument. You no longer need that.' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Calling wg.Add inside the goroutine', body: 'If you write `wg.Add(1)` inside the new goroutine, `wg.Wait()` may run first, see a count of zero and return too early. Always call `Add` in the parent before `go`, or use `wg.Go`.' },
    { title: 'Expecting a return value from go', body: '`x := go f()` does not compile. A goroutine cannot return a value to its caller. Send the result on a [channel](/lesson/channels), or write it into a slot the parent owns.' },
    { title: 'Assuming an order', body: 'Goroutines run in no particular order. Starting g1 before g2 does not mean g1 prints first. If order matters, coordinate them with channels or locks.' },
  ],
  deepDive: {
    q: 'Why are goroutines so much cheaper than OS threads?',
    body: [
      'An OS thread is a thread created by the operating system. It usually reserves 1 MB or more of stack. Switching between threads goes through the kernel (the core of the operating system), which is slow.',
      'A goroutine starts with a 2 KB stack that grows when needed. Switching between goroutines happens inside the Go runtime, inside your own process, so it is fast.',
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
    why: 'The rule: the arguments of a `go` call are evaluated right away, on the line that starts the goroutine. Step by step: `x` is 1, so `n` gets a copy of 1, the same way a number argument is copied in a JS function call. Then `main` changes `x` to 2, but that does not touch the copy in `n`. Finally the channel makes `main` wait until the goroutine has printed 1.',
    trace: [
      ['line 2', 'x = 1', 'run'],
      ['line 7', 'go starts the goroutine with n = 1 (copied now)', 'run'],
      ['line 8', 'main sets x = 2; n is still 1', 'run'],
      ['line 9', 'main blocks on <-done, waiting for the goroutine', 'wait'],
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
    success: '`wg.Wait()` blocks until the counter is back to zero. That happens only after every goroutine has called `Done`. It plays the role of `await Promise.all(...)`.',
    wrong: [
      { answers: ['Done'], title: 'Done is for the workers', body: '`Done` lowers the counter by one, and the goroutines already call it. The parent needs the method that **blocks** until the counter reaches zero.' },
      { answers: ['wait'], title: 'Watch the capital letter', body: 'Exported Go names (ones other packages can use) start with an uppercase letter. The method is `Wait`. There is no lowercase `wait`.' },
    ],
    hint: 'The parent has to pause until the counter is zero. Which WaitGroup method does that?',
  },
  recap: [
    '`go f()` starts `f` in a new goroutine and moves on at once.',
    'The arguments of a `go` call are evaluated immediately, on that line.',
    'When `main` returns, the program ends, even if goroutines are still running.',
    'A `sync.WaitGroup` is a hand-made `Promise.all`: Add before `go`, Done in the goroutine, Wait in the parent. Or use `wg.Go` in Go 1.25 and later.',
    'No function coloring: every function is plain, and the caller chooses to run it in the background.',
    'Unlike async code in Node, goroutines can run in parallel on many CPU cores.',
  ],
}

const select: LessonContent = {
  id: 'select',
  minutes: 14,
  lead: 'A goroutine often waits for one of several things: a result, a timeout, or a stop signal. Whatever happens first should win. In JavaScript you would reach for `Promise.race`. In Go you use `select`. This lesson shows how it works, how to add a timeout, and how to try a channel without waiting.',
  fromTs: {
    title: 'Promise.race, built into the language',
    intro: 'A classic job: wait for a result, but give up after one second. JavaScript races two promises, one of them a `setTimeout` that rejects. Go waits on two channels in one `select`. (`Promise<never>` in the TypeScript is only a type label for a promise that never resolves. At runtime it is a plain promise.)',
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
      ['Random when tied', 'If several cases are ready at once, Go picks one at random. Unlike `Promise.race`, position in the list gives no priority.'],
      ['default never blocks', 'Add a `default` case, and `select` runs it right away when nothing else is ready.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The shape',
      title: 'A switch where every case is a channel',
      blocks: [
        { note: '`select` waits on several channel operations at once and runs whichever one is ready first.', title: 'In one sentence' },
        'Each case is either a receive (`v := <-ch` or `<-ch`) or a send (`ch <- v`). Here is what `select` does:',
        {
          list: [
            'It looks at every case.',
            'If one or more can run right now, it picks one (at random if there are several) and runs it.',
            'If none can run, it blocks until one can.',
          ],
          ordered: true,
        },
        {
          code: `for {
    select {
    case msg := <-inbox: // a message arrived
        handle(msg)
    case out <- nextItem: // someone is ready to take an item
        advance()
    case <-quit: // quit was closed: stop
        return
    }
}`,
        },
        'This loop handles messages, pushes items out when someone is ready to take them, and stops when `quit` is closed. A `select` inside a `for` is the heart of most long-running goroutines.',
        { note: 'A `for` + `select` loop plays the role an event listener plays in Node: wait for something, react, wait again. Each `case` is one event you are listening for.', title: 'Think of it like this' },
      ],
    },
    {
      eyebrow: 'Non-blocking',
      title: 'default: try without waiting',
      blocks: [
        'Sometimes you do not want to wait at all. Add a `default` case, and `select` never blocks. Use it to "try" a send or receive: do it if possible, otherwise move on.',
        {
          code: `select {
case jobs <- job:
    fmt.Println("queued")
default: // jobs has no room and no receiver right now
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
        'Timers in Go are channels too, so they fit straight into a `select`:',
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
        'The last row is a handy trick. Set a channel variable to `nil` to turn its case off.',
        'Why would you want that? Say you read from two channels, `a` and `b`. When `a` is closed, every receive on it succeeds at once with a zero value, so `select` would keep picking it. Setting `a = nil` takes it out of the running:',
        {
          code: `for a != nil || b != nil {
    select {
    case v, ok := <-a:
        if !ok { a = nil; continue } // a is closed: turn this case off
        fmt.Println("a", v)
    case v, ok := <-b:
        if !ok { b = nil; continue } // b is closed: turn this case off
        fmt.Println("b", v)
    }
}`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Expecting the first case to win', body: 'When two cases are ready together, Go picks randomly on purpose, so no channel can starve the others (get ignored forever). Never rely on case order for priority.' },
    { title: 'time.After inside a hot loop', body: 'Each `time.After` call makes a new timer. Since Go 1.23 unused timers are garbage collected, so this no longer leaks. But in a loop that runs millions of times, it still allocates memory on every pass. Create one `time.NewTimer` outside the loop and `Reset` it.' },
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
    why: 'The rule: `select` runs a ready case if there is one, and `default` only when nothing is ready. On the first pass the buffer is empty, so the receive cannot run. `default` prints "empty" and puts 7 into the buffer, which has room for one. On the second pass the receive is ready, so the program prints "got 7".',
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
    success: '`time.After` returns a channel that receives one value once the duration has passed. `select` runs whichever case is ready first. After one second the timer is ready and the result is not, so the timer case wins.',
    wrong: [
      { answers: ['Sleep'], title: 'Sleep blocks the goroutine', body: '`time.Sleep` pauses the current goroutine and returns nothing, so it cannot be a channel case. A `select` case needs a function that returns a channel.' },
      { answers: ['Tick', 'NewTicker'], title: 'That repeats', body: 'A ticker fires again and again, like `setInterval`. For a single timeout you want the `setTimeout` version: the one that fires once.' },
    ],
    hint: 'You need a function in package `time` that returns a channel which receives once, **after** a delay.',
  },
  recap: [
    '`select` waits on several channel operations and runs the first one that is ready.',
    'If several are ready, one is chosen at random. Case order gives no priority.',
    '`default` makes `select` non-blocking: try, and move on if nothing is ready.',
    '`time.After` gives you a timeout, and a `nil` channel turns a case off.',
  ],
}

const syncLesson: LessonContent = {
  id: 'sync',
  minutes: 16,
  lead: 'Channels work well for handing data from one goroutine to another. But sometimes many goroutines need to share one value, like a cache or a counter. JavaScript never needed locks for this, because only one piece of your code runs at a time. Go runs code in parallel, so it gives you the `sync` package. This lesson covers its main tools: Mutex, WaitGroup, Once, and atomic numbers.',
  fromTs: {
    title: 'Why JavaScript never needed a lock',
    intro: 'In Node, this counter is safe. The event loop runs one callback at a time, so nothing can cut into the middle of `count++`. In Go, two goroutines can run `count++` at the very same moment on two cores. A **mutex** (a lock) makes them take turns.',
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
        { note: 'A mutex is like a single bathroom key: whoever holds it goes in, and everyone else waits at the door until it comes back.', title: 'Think of it like this' },
        'The usual style is to keep the mutex inside the struct that it protects. Code outside only touches the fields through methods that lock. It is much like keeping state private in a JS class.',
        {
          code: `type Cache struct {
    mu   sync.Mutex
    data map[string]string
}

func (c *Cache) Get(k string) (string, bool) {
    c.mu.Lock()         // wait for the key
    defer c.mu.Unlock() // give it back when we return
    v, ok := c.data[k]
    return v, ok
}`,
        },
        'Note the pointer receiver `*Cache`. It means the method works on the original struct, the way a JS method gets a reference to its object through `this`.',
        'Why does that matter here? A mutex must never be copied once used, because the copy is a separate lock. Two goroutines holding two different copies would not wait for each other at all. `go vet` warns you if you copy one.',
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
        'You might wonder: should I use channels or a mutex? A popular Go saying is "share memory by communicating", and channels are often the cleanest design. But a mutex around a small piece of state is also fine, and it is fast. Pick whichever makes the code easier to read.',
      ],
    },
    {
      eyebrow: 'Once and atomic',
      title: 'Lazy setup and lock-free counters',
      blocks: [
        '`sync.Once` runs a function the first time `Do` is called, and never again, even when many goroutines call it at once.',
        'Why not just check a variable? In JS you would write `if (!cache) cache = load()`. That is safe on one thread. In Go, two goroutines could both see the empty cache at the same moment and both call `load`. `Once` makes sure only one does.',
        'Go 1.21 added helpers like `sync.OnceValue` that also cache the result:',
        {
          code: `var getConfig = sync.OnceValue(func() *Config {
    return loadConfig() // runs only once
})

func handler() {
    cfg := getConfig() // cheap after the first call
    _ = cfg
}`,
        },
        'For a single number, `sync/atomic` is faster than a mutex. An **atomic** operation is one the CPU finishes in a single step that no other core can cut into. (JS has `Atomics` for `SharedArrayBuffer`, the same idea.) The typed versions are the easiest to use:',
        {
          code: `var hits atomic.Int64

func hit() { hits.Add(1) } // read, add, write as one step

func report() { fmt.Println(hits.Load()) }`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Forgetting to unlock', body: 'If a function returns early between `Lock` and `Unlock`, the lock is never released and every other goroutine waits forever. Write `defer mu.Unlock()` on the very next line.' },
    { title: 'Locking twice in the same goroutine', body: 'Go mutexes are not re-entrant: the goroutine holding the lock cannot take it again. If a locked method calls another method that also locks the same mutex, the goroutine waits for itself forever. Split it into a public method that locks and a private helper that does not.' },
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
    why: 'The rule: `once.Do` runs its function only on the first call. On the first loop pass `i` is 0, so it prints "init 0". The next two calls to `Do` do nothing, even though each one passes a new function. Then "ready" prints.',
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
    success: '`defer c.mu.Unlock()` runs when `Inc` returns, however it returns. Lock, then defer the unlock on the next line. You will see this pair all over Go code.',
    wrong: [
      { answers: ['Lock'], title: 'That locks again', body: 'Calling `Lock` a second time from the same goroutine waits for itself, so the program hangs. You want the opposite operation.' },
      { answers: ['RUnlock'], title: 'Wrong kind of unlock', body: '`RUnlock` releases a **read** lock taken with `RLock`. This code took a normal lock with `Lock`.' },
    ],
    hint: 'Every `Lock` needs a matching method that gives the lock back.',
  },
  recap: [
    'Goroutines run in parallel, so shared data needs protection that JavaScript never needed.',
    'A mutex is one key: Lock a `sync.Mutex`, then `defer` the Unlock on the next line.',
    'Keep the mutex next to the data, and use pointer receivers so it is never copied.',
    '`sync.Once` runs setup once. `sync/atomic` types are fast counters and flags.',
  ],
}

const races: LessonContent = {
  id: 'races',
  minutes: 14,
  lead: 'Some bugs show up once in a thousand runs, then vanish when you add a log line. In concurrent Go code, the usual cause is a **data race**: two goroutines touch the same variable at the same time, and at least one of them writes. The good news: Go ships a race detector that finds these for you, and you turn it on with one flag.',
  fromTs: {
    title: 'The bug JavaScript protects you from',
    intro: 'In Node, a thousand async increments always end at 1000, because only one callback runs at a time. The same code with goroutines can print a different number on each run.',
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
      eyebrow: 'The problem',
      title: 'How an increment gets lost',
      blocks: [
        { note: 'A data race is two goroutines touching the same memory at the same time, with at least one of them writing.', title: 'In one sentence' },
        '`count++` looks like one step, but the CPU does three. Here is how two goroutines lose an update:',
        {
          list: [
            'Goroutine A reads `count`: 41.',
            'Goroutine B reads `count` at the same moment: also 41.',
            'A adds one and writes 42.',
            'B adds one and writes 42, on top of A\'s write.',
            'Two increments ran, but `count` only went up by one.',
          ],
          ordered: true,
        },
        { note: 'Two people edit the same shared spreadsheet cell from different laptops. Both see 41, both type 42, and one edit silently overwrites the other.', title: 'Think of it like this' },
      ],
    },
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
        'Read the report from the top: which goroutine read the memory and on which line, then which goroutine wrote it before. Here both are line 13, the `count++`.',
        'One limit: the detector only sees races on code paths that ran, so it does not prove your program is race-free. Think of it like test coverage: untested code is unchecked. That is why Go teams run `go test -race ./...` in CI as a standard habit.',
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
        'Here is the counter fixed with an atomic. `Add` does the read, the add and the write as one step that no other core can split:',
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
        'Go maps have no lock inside. If one goroutine writes a map while another reads or writes it, the runtime may crash on purpose with `fatal error: concurrent map writes` (or `concurrent map read and map write`).',
        'You might hope `recover` can catch it. It cannot. This is a fatal error, not a panic, so the program always stops.',
        { pitfall: 'Guard a shared map with a `sync.Mutex` (or `RWMutex`). Reading from many goroutines with no writers at all is fine.', title: 'Shared map, no lock' },
      ],
    },
  ],
  pitfalls: [
    { title: '"It passed, so it is fine"', body: 'A race may need just the right timing to show up. A test that passes ten times can still have one. Only `-race` (or careful reasoning) tells you for sure.' },
    { title: 'Reading without a lock', body: 'Locking only the writes is not enough. A read at the same time as a write is also a race. Every access to shared data needs the lock, reads included.' },
    { title: 'Using time.Sleep to "fix" a race', body: 'Adding a sleep changes the timing and may hide the bug, but nothing guarantees the order. Use a WaitGroup, a channel or a mutex to create real ordering.' },
  ],
  deepDive: {
    q: 'How does the race detector know?',
    body: [
      'With `-race`, the compiler adds a small check to every memory read and write. A runtime library called ThreadSanitizer keeps a **vector clock** for each goroutine: a set of counters that records what each goroutine has seen from the others. It also records which goroutine touched each memory location last.',
      'Some events put two accesses in a fixed order. This is called **happens-before**. Examples: a mutex unlock followed by a lock, or a channel send followed by the receive. If two accesses have no such event between them, the detector reports a race.',
      'This bookkeeping on every access is why a `-race` build typically runs 2 to 20 times slower and uses 5 to 10 times more memory.',
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
    why: '`count++` is three steps: read, add, write. Goroutines on different cores can read the same old value and overwrite each other, so some increments get lost. How many depends on timing. Some runs print 1000, many print less. That is a data race, and `go run -race` reports it.',
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
    success: '`count.Add(1)` does the read, the add and the write as one step that the CPU will not split. No increment can be lost, so the program prints 1000 every time and `-race` stays quiet.',
    wrong: [
      { answers: ['Store'], title: 'Store overwrites', body: '`Store(1)` sets the value to 1. Every goroutine would set it to 1, so you would print 1. You want to **increase** it.' },
      { answers: ['Inc', 'Increment'], title: 'No such method', body: 'The atomic types do not have an increment method. The method that adds a number takes the amount as its argument.' },
    ],
    hint: 'Look for the atomic method that adds a value and returns the new total.',
  },
  recap: [
    'A data race is two goroutines touching the same memory at once, with at least one write.',
    '`count++` is three steps, not one. Races lose updates at random.',
    'Run `go test -race ./...` in CI. The detector reports races that actually happen during the run.',
    'Fix with a mutex, an atomic, or by not sharing the data at all.',
  ],
}

const context: LessonContent = {
  id: 'context',
  minutes: 16,
  lead: 'A user closes the browser tab halfway through a slow request. The server should stop the database query it started for them, instead of finishing work nobody will see. In JavaScript you pass an `AbortSignal` from an `AbortController`. In Go you pass a `context.Context` as the first argument to every function that might take a while. It carries a cancel signal, a deadline, and a few values tied to the current request.',
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
        { note: 'A context is the Go version of an `AbortSignal`: you pass it down every slow call so the work can be stopped from above.', title: 'In one sentence' },
        'Every context tree starts at a root:',
        {
          list: [
            'In a web server, `r.Context()` from the request is your root. Go cancels it when the client disconnects, like listening for `req.on("close")` in Express.',
            'In `main` or in tests, use `context.Background()`.',
          ],
        },
        'From a root you make children, each adding one limit:',
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
        { note: 'Picture a family tree. A stop signal flows down from parent to children, never up. Cancel the request\'s context and every query, call and timer made from it stops too.', title: 'Think of it like this' },
      ],
    },
    {
      eyebrow: 'Listening',
      title: 'How your code notices cancellation',
      blocks: [
        'A context gives you two methods for this:',
        {
          table: {
            head: ['Method', 'What it does', 'Closest JS idea'],
            rows: [
              ['`ctx.Done()`', 'Returns a channel that is closed on cancel. Use it in a [select](/lesson/select).', '`signal.addEventListener("abort", ...)`'],
              ['`ctx.Err()`', '`nil` while alive, then `context.Canceled` or `context.DeadlineExceeded`', '`signal.aborted` and `signal.reason`'],
            ],
          },
        },
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
        'Do you have to do this everywhere? No. Library functions that do I/O, like `http.Client.Do` or `db.QueryContext`, already watch the context for you. You only need `select` on `ctx.Done()` in your own long-running loops.',
        { note: 'Cancelling is a request, not a kill. This works like `AbortSignal`: `fetch` stops when you abort, but your own loop keeps going unless it checks `signal.aborted`. Go cannot stop a goroutine from the outside. The goroutine must check `ctx` and return on its own.' },
      ],
    },
    {
      eyebrow: 'Values',
      title: 'Request values, used sparingly',
      blocks: [
        '`context.WithValue` attaches data such as a request ID or the logged-in user. It is a bit like setting `res.locals.user` in Express.',
        'Use a private key type so no other package can collide with your key. It works like using a private `Symbol` as an object key in JS.',
        {
          code: `type ctxKey struct{} // private: other packages cannot make one

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
    why: 'Step by step: before `cancel()` the context is alive, so `Err()` is `nil`. After `cancel()`, `Err()` returns `context.Canceled`, which prints as "context canceled". `Done()` is a channel that is **closed** on cancel. Receiving from a closed channel never blocks, so "done" prints too.',
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
    'A context is Go\'s `AbortSignal`. Pass `ctx context.Context` as the first parameter of anything slow.',
    '`WithCancel` and `WithTimeout` make child contexts. Always `defer cancel()`.',
    'Watch `ctx.Done()` in a `select`, and return `ctx.Err()` to say why you stopped.',
    'Cancellation is a request, not a kill: the goroutine must check and return on its own.',
  ],
}

const patterns: LessonContent = {
  id: 'patterns',
  minutes: 18,
  lead: 'Most real concurrent Go code is built from a few small patterns. Learn them once and you will recognise them everywhere: a **worker pool** to limit how much runs at once, a **pipeline** of stages, and **fan-in** to merge results. You have probably built small versions of these in JavaScript with `p-limit` or async iterators (`for await`).',
  fromTs: {
    title: 'Limit concurrency, like p-limit',
    intro: 'Say you have 1,000 images to resize, but only want 4 resizing at a time. In JavaScript you would use an npm package like `p-limit`. In Go you start 4 worker goroutines that all read from one jobs channel. The channel hands each job to whichever worker is free. Unlike `p-limit` in Node, the 4 resizes can run on 4 CPU cores at once.',
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
        { note: 'Picture a bakery counter with 4 staff. Customers join one line (the jobs channel). Whoever is free serves the next customer. Hiring a fifth person raises the limit to 5.', title: 'Think of it like this' },
        'A complete pool has three parts:',
        {
          list: [
            '**Feed jobs**: one goroutine sends every job, then closes `jobs`.',
            '**Run workers**: N goroutines range over `jobs` and send to `results`.',
            '**Close results**: once every worker is finished, close `results` so the reader knows to stop.',
          ],
          ordered: true,
        },
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
        'Notice that each channel has exactly one owner who closes it. The feeder closes `jobs`. The helper goroutine closes `results` after `wg.Wait()`.',
        'Results arrive in any order. If you need the original order, add an index to each job and put each result back in its slot.',
        { note: 'If you only need "run at most N at a time and wait", the `golang.org/x/sync/errgroup` package does it with `g.SetLimit(n)` and also collects the first error. It is the closest thing to `Promise.all` plus `p-limit`.' },
      ],
    },
    {
      eyebrow: 'Pipeline',
      title: 'Stages connected by channels',
      blocks: [
        { note: 'A pipeline is a chain of stages where each one reads from a channel, does one thing, and writes to the next channel.', title: 'In one sentence' },
        'It feels like chaining async generators in JavaScript, or piping Node streams. One difference: each Go stage runs in its own goroutine, so all stages can work at the same time, like stations on an assembly line.',
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
        'The arrow types say who may do what. `<-chan int` can only be received from. `chan<- int` can only be sent to. So the compiler stops a stage from closing a channel it only reads.',
      ],
    },
    {
      eyebrow: 'Fan-in',
      title: 'Merge many channels into one',
      blocks: [
        'Two words you will hear: **fan-out** means several goroutines read from one channel (that is the worker pool). **Fan-in** is the opposite: several channels flow into one.',
        {
          code: `func merge(ins ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    for _, in := range ins {
        wg.Go(func() { // one forwarder per input
            for v := range in {
                out <- v
            }
        })
    }
    go func() {
        wg.Wait()  // every input is drained
        close(out) // so tell the reader
    }()
    return out
}`,
        },
        'Here is when to reach for each pattern:',
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
    { title: 'Reading results in the same goroutine that feeds jobs', body: 'With unbuffered channels, if `main` sends all jobs before reading any result, the workers block on `results <-`. Now nobody is free to take the next job, and everything stops. Feed jobs from a separate goroutine.' },
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
    why: 'The three workers square the numbers 1 to 4, in some random order. But addition does not care about order: 1 + 4 + 9 + 16 is always 30. And `main` reads exactly four results, so it never waits for a fifth that will not come.',
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
    success: 'After `wg.Wait()`, no goroutine will ever send on `out` again, so it is safe to close it. Any `for v := range merge(...)` loop then ends on its own.',
    wrong: [
      { answers: ['wg.Done', 'Done'], title: 'Done is for each worker', body: 'The forwarding goroutines already call Done through `wg.Go`. Here you need to tell the reader that no more values are coming.' },
    ],
    hint: 'Which built-in function tells a `range` loop over a channel that no more values will arrive?',
  },
  recap: [
    'A worker pool is N goroutines ranging over one jobs channel, like staff serving one line.',
    'Every channel has one owner who closes it. Close `results` after `wg.Wait()`.',
    'Pipelines are stages linked by channels. Use `<-chan` and `chan<-` to make roles clear.',
    'Fan-in merges many channels into one.',
    'For "run limited tasks, stop on first error", reach for `errgroup`.',
  ],
}

const deadlocks: LessonContent = {
  id: 'deadlocks',
  minutes: 15,
  lead: 'Concurrent code can get stuck in two ways. A **deadlock** is when every goroutine is stuck waiting. Go notices and crashes with a clear message, which is the friendly case. A **goroutine leak** is when only some goroutines are stuck forever. The program keeps running, but memory grows slowly until something breaks, and nothing warns you. This lesson shows how both happen and how to prevent them.',
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
        { note: 'Four cars reach a four-way stop at once, and each driver waits for the car on their right. Nobody can ever go. That is a deadlock.', title: 'Think of it like this' },
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
        'You might expect a server to crash the same way. It usually does not. The runtime only reports a deadlock when **every** goroutine is blocked. In a server, the HTTP listener goroutine is always waiting for new connections, so it can still be woken up. A stuck request just hangs, like an Express handler that never calls `res.send`.',
      ],
    },
    {
      eyebrow: 'Leaks',
      title: 'Give every goroutine a way out',
      blocks: [
        { note: 'Before you write `go`, know exactly how that goroutine will end.', title: 'In one sentence' },
        'Ask the question every time: **how does this goroutine end?** If the answer is "when someone receives its value", then ask: what if nobody does?',
        'In the `first` helper, only one value is received. The other senders wait forever. Here are two common fixes:',
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
        '**Fix 1** is the simplest. Every sender can drop its value in the buffer and exit, even if nobody reads it.',
        '**Fix 2** also stops the slow requests themselves, which saves real work. It is the Go version of aborting the losing `fetch` calls after a `Promise.race`.',
      ],
    },
    {
      eyebrow: 'Finding them',
      title: 'Tools that show stuck goroutines',
      blocks: [
        'Leaks are silent, so you have to go looking for them. These tools help:',
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
    { title: 'Fixing a deadlock with a bigger buffer', body: 'A buffer can hide a design bug until traffic gets higher than the buffer size. First make sure every send has a receiver, or a way to give up.' },
    { title: 'Waiting on a WaitGroup with the wrong count', body: 'Calling `wg.Add(3)` inside a loop that runs three times adds 9. `Wait` then blocks forever. Add 1 per goroutine, or use `wg.Go`.' },
  ],
  deepDive: {
    q: 'How does the runtime detect a deadlock?',
    body: [
      'The scheduler tracks how many goroutines are runnable or running. Here is the check, step by step:',
      'First, that number drops to zero. Second, no timers or network waits are pending that could wake anyone up. Then nothing can ever change again, so the runtime prints the stack of every goroutine and exits with code 2.',
      'A goroutine leaked in a running server never triggers this, because other goroutines (like the HTTP listener) can still wake up.',
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
    why: 'Three goroutines try to send on an unbuffered channel. `first` receives only one value and returns. The other two goroutines wait forever on `ch <- i`. That is a leak. The runtime does not call it a deadlock, because `main` can still run. So the count is `main` plus 2 leaked goroutines: 3.',
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
    success: 'One `Add(1)` per goroutine and one `Done()` per goroutine. The counter goes up to 3 and back down to 0, and `Wait` returns.',
    wrong: [
      { answers: ['3'], title: 'That adds 9', body: 'The `Add` runs inside the loop, three times. The counter reaches 9, but only three `Done` calls happen. `Wait` blocks forever and the runtime reports a deadlock.' },
      { answers: ['0'], title: 'Wait would not wait', body: 'With nothing added, `Wait` returns immediately without waiting. Any goroutine that reaches `Done` before the program exits drops the counter below zero and panics with "sync: negative WaitGroup counter".' },
    ],
    hint: 'Each goroutine calls `Done` exactly once. How much should each loop pass add?',
  },
  recap: [
    'Deadlock: every goroutine is blocked, and Go crashes with a clear message.',
    'Leak: some goroutines block forever, and nothing tells you.',
    'Before each `go`, know exactly how that goroutine will end.',
    'Use buffers sized for every sender, `ctx.Done()` cases, and `NumGoroutine` or pprof to find leaks.',
  ],
}

export const CONCURRENCY: LessonContent[] = [goroutines, select, syncLesson, races, context, patterns, deadlocks]
