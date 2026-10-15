import type { LessonContent } from './types'

const interfaces: LessonContent = {
  id: 'interfaces',
  minutes: 15,
  lead: 'In JavaScript you call `shape.area()` and trust that the object has an `area` method. That habit is called duck typing: if it has the method, it works. A Go interface writes that expectation down so the compiler can confirm it before the program runs. It lists methods only. Any type that has those methods fits, without saying so.',
  fromTs: {
    title: 'Same idea, fewer words',
    intro: 'A TypeScript `interface` is a type-only description of an object\'s shape. It disappears when the code runs. A class can say `implements Shape`, but that is optional. Go has no `implements` keyword at all. If a type has the methods, it satisfies the interface.',
    ts: `interface Shape {
  area(): number;
}

class Square implements Shape {
  constructor(public side: number) {}
  area() {
    return this.side * this.side;
  }
}

const s: Shape = new Square(3);
console.log(s.area()); // 9`,
    go: `type Shape interface {
    Area() float64
}

type Square struct {
    Side float64
}

func (s Square) Area() float64 {
    return s.Side * s.Side
}

var s Shape = Square{Side: 3}
// fmt.Println(s.Area()) prints 9`,
    facts: [
      ['Methods only', 'A Go interface lists methods, never fields. "Has an `Area()` method" is a valid interface. "Has a `side` field" is not.'],
      ['Satisfied implicitly', '`Square` never mentions `Shape`. When you assign a `Square` to a `Shape`, the compiler checks that `Square` has every method `Shape` lists.'],
      ['Small is normal', 'Most Go interfaces have one or two methods, like `io.Reader`, `fmt.Stringer` and `error`. Big interfaces are rare.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Using interfaces',
      title: 'Write functions that accept behaviour',
      blocks: [
        'An interface lets you write a function once and pass it many types. `Total` below accepts any `Shape`. Any type with an `Area()` method works, even a type from another package that was written before your interface existed.',
        {
          code: `type Circle struct{ R float64 }

func (c Circle) Area() float64 {
    return 3.14 * c.R * c.R
}

func Total(shapes []Shape) float64 {
    sum := 0.0
    for _, s := range shapes {
        sum += s.Area()
    }
    return sum
}

// Total([]Shape{Square{2}, Circle{1}}) is 7.14`,
        },
        'Go developers say "accept interfaces, return structs". Your function asks for the smallest behaviour it needs. Callers can pass anything that has it.',
        { note: 'Interfaces are usually declared by the code that **uses** them. In TypeScript you often export an interface next to the class that implements it. In Go, the function that needs the behaviour writes a tiny interface for exactly the methods it calls.' },
      ],
    },
    {
      eyebrow: 'Interfaces you will meet',
      title: 'A few famous one-method interfaces',
      blocks: [
        'The standard library is built on tiny interfaces. Once you know these five, a lot of Go code becomes easier to read.',
        {
          table: {
            head: ['Interface', 'Method', 'What it means'],
            rows: [
              ['`error`', '`Error() string`', 'Anything that can describe a failure'],
              ['`fmt.Stringer`', '`String() string`', 'Controls how `fmt.Println` prints your type'],
              ['`io.Reader`', '`Read(p []byte) (int, error)`', 'Anything you can read bytes from, like a Node readable stream'],
              ['`io.Writer`', '`Write(p []byte) (int, error)`', 'Anything you can write bytes to, like a Node writable stream'],
              ['`any`', 'none', 'Every type. Like `unknown` in TypeScript'],
            ],
          },
        },
        '`any` is another name for `interface{}`, an interface with zero methods. Every type has at least zero methods, so every value fits. To get the real value back out, you use a [type assertion](/lesson/assertions).',
      ],
    },
    {
      eyebrow: 'Pointer receivers',
      title: 'Value or pointer: who has the method?',
      blocks: [
        'One rule surprises almost everyone. If a method has a pointer receiver, like `func (d *Dog) Speak()`, then only `*Dog` has that method. A plain `Dog` value does not satisfy the interface.',
        {
          code: `type Speaker interface{ Speak() string }

type Dog struct{}

func (d *Dog) Speak() string { return "woof" }

var a Speaker = &Dog{} // ok: *Dog has Speak
var b Speaker = Dog{}  // compile error`,
        },
        'To fix it, store a pointer (`&Dog{}`), or use a value receiver if the method does not change the struct. [Methods: value versus pointer receivers](/lesson/methods) explains why the rule exists.',
        {
          pitfall: 'To make the compiler check that a type satisfies an interface, add `var _ Shape = Square{}` at package level. The `_` throws the value away. It costs nothing at runtime and fails the build if a method goes missing.',
          title: 'Want an "implements" check anyway?',
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Putting fields in an interface', body: 'TypeScript interfaces often describe data shapes, like `{ name: string }`. Go interfaces cannot have fields. If you need data, use a struct. If you need behaviour, use an interface with methods like `Name() string`.' },
    { title: 'Making interfaces too big', body: 'A 10-method interface is hard to implement and hard to fake in tests. Split it. A function that only reads should ask for something with a `Read` method, not a whole `Database`.' },
    { title: 'Using any everywhere', body: 'Unlike `any` in TypeScript, Go\'s `any` behaves like TypeScript `unknown`: you cannot call methods or use operators on it until you get the concrete type back with an assertion. Code full of `any` swaps checks the compiler does for checks at runtime that can fail. Reach for a small interface or [generics](/lesson/generics) first.' },
  ],
  deepDive: {
    q: 'How does Go call a method through an interface?',
    body: [
      'An interface value is two machine words (two pointer-sized slots in memory). One points to a small table called the "itab". The other points to the data. The itab holds the concrete type and the memory addresses of its methods.',
      'Calling `s.Area()` looks up `Area` in the itab and jumps there. Go builds the itab once per (type, interface) pair and caches it, so the call is cheap. Those two words also explain the [nil interface trap](/lesson/niltrap).',
    ],
  },
  predict: {
    code: `type Speaker interface {
    Speak() string
}

type Dog struct{}

func (d *Dog) Speak() string { return "woof" }

func main() {
    var s Speaker = Dog{}
    fmt.Println(s.Speak())
}`,
    options: ['woof', 'An empty line', 'It does not compile', 'panic: nil pointer dereference'],
    answer: 2,
    why: '`Speak` has a pointer receiver, so only `*Dog` has it. A plain `Dog{}` does not satisfy `Speaker`, and the compiler says "method Speak has pointer receiver". Use `&Dog{}` instead.',
    trace: [
      ['compile', 'checking line 10: var s Speaker = Dog{}', 'idle'],
      ['types', 'method set of Dog: (empty)', 'wait'],
      ['types', 'method set of *Dog: Speak', 'runtime'],
      ['error', 'Dog does not implement Speaker (method Speak has pointer receiver)', 'err'],
    ],
  },
  challenge: {
    title: 'Make Celsius print nicely',
    prompt: '`fmt.Println` checks whether a value satisfies `fmt.Stringer`, a bit like JS calling your `toString()` during string conversion. Name the method so this prints `21.5°C`.',
    code: `type Celsius float64

func (c Celsius) ___() string {
    return fmt.Sprintf("%.1f°C", float64(c))
}

func main() {
    fmt.Println(Celsius(21.5))
}`,
    answers: ['String'],
    success: 'Any type with a `String() string` method satisfies `fmt.Stringer`, and `fmt` uses it automatically. You never wrote "implements". Go saw the method, and that was enough.',
    wrong: [
      { answers: ['string', 'toString'], title: 'Close, but names are case sensitive', body: 'The interface method is `String` with a capital S. In Go a lowercase name is also unexported (private to its package, like a value you never `export` from a JS module), so `fmt` could not even see it.' },
      { answers: ['ToString'], title: 'That is the C# and Java name', body: 'Go uses `String() string`, defined by the `fmt.Stringer` interface.' },
    ],
    hint: 'Look up `fmt.Stringer`. It has exactly one method that returns a `string`.',
  },
  recap: [
    'Go interfaces list methods only, and types satisfy them without saying so.',
    'Keep interfaces small and declare them where they are used.',
    'A pointer receiver method belongs to `*T`, not `T`.',
    '`any` means `interface{}`: every type fits, and you need an assertion to get the value back out.',
  ],
}

const niltrap: LessonContent = {
  id: 'niltrap',
  minutes: 14,
  lead: 'This is the most famous Go gotcha. A function returns an error that is clearly "nil", and yet `err != nil` is true. `nil` is Go\'s version of `null`. The puzzle goes away once you see that an interface value has two parts inside. After that, the trap is easy to avoid.',
  fromTs: {
    title: 'In JavaScript, null is always null',
    intro: 'In JavaScript, if a variable holds `null`, then `x === null` is true, always. In Go, an interface can hold a nil pointer (a pointer that points at nothing) and still not be nil itself. Compare these two programs.',
    ts: `class MyErr extends Error {}

function check(): Error | null {
  let p: MyErr | null = null;
  return p;
}

console.log(check() === null);
// true`,
    go: `type MyErr struct{}

func (e *MyErr) Error() string {
    return "boom"
}

func check() error {
    var p *MyErr = nil
    return p
}

// fmt.Println(check() == nil)
// false`,
    facts: [
      ['Two halves', 'An interface value stores a **type** and a **value**. It is only nil when both are empty.'],
      ['A typed nil is not nil', 'Returning a nil `*MyErr` as an `error` fills in the type half: (*MyErr, nil). The box is not empty, so it is not nil.'],
      ['Easy fix', 'Write the literal `nil` when there is no error. Never return a typed pointer variable that might be nil.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The two halves',
      title: 'An interface is a little box with two slots',
      blocks: [
        'Picture an interface value as a box with two slots. One slot says which type is inside. The other holds the value itself. It is like a JS object `{ type, value }`. Comparing with `nil` asks "is the whole box empty?"',
        {
          table: {
            head: ['Code', 'Type slot', 'Value slot', '== nil'],
            rows: [
              ['`var err error`', 'empty', 'empty', '`true`'],
              ['`err = &MyErr{}`', '`*MyErr`', 'pointer to a MyErr', '`false`'],
              ['`var p *MyErr; err = p`', '`*MyErr`', 'nil pointer', '`false`'],
            ],
          },
        },
        'The third row is the trap. The value slot holds a nil pointer. The type slot still says `*MyErr`, so the box is not empty. In JS terms, `{ type: "MyErr", value: null }` is an object, and an object is never `null`.',
        { code: `var p *MyErr       // nil pointer
var err error = p  // box: (*MyErr, nil)

fmt.Println(p == nil)   // true
fmt.Println(err == nil) // false` },
      ],
    },
    {
      eyebrow: 'How it bites',
      title: 'The bug in real code',
      blocks: [
        'It usually shows up in a function that stores its error in a variable of a specific pointer type, like `*ValidationError`, and returns that variable at the end.',
        {
          code: `func validate(age int) error {
    var e *ValidationError
    if age < 0 {
        e = &ValidationError{"age"}
    }
    return e // always non-nil error!
}`,
        },
        'Every caller now thinks validation failed, even for good input. Worse, calling `err.Error()` may panic, because the method gets a nil pointer.',
        'The fix is to return `nil` directly on the success path:',
        {
          code: `func validate(age int) error {
    if age < 0 {
        return &ValidationError{"age"}
    }
    return nil
}`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Declaring the result as a concrete error type', body: 'Write `func f() error`, not `func f() *MyErr`. If the signature returns `*MyErr`, every caller that stores the result in an `error` variable walks into the trap.' },
    { title: 'Thinking it only affects errors', body: 'Any interface works this way: `any`, `io.Reader`, your own `Shape`. People hit it most with errors because they compare errors with nil all day.' },
    { title: 'Checking the inner pointer with reflection', body: 'You may see code that uses the `reflect` package to check if the value inside is nil. That hides the bug instead of fixing it. Return a plain `nil` instead.' },
  ],
  note: "`go vet` does not catch this. Linters like staticcheck (check SA4023) can flag some cases. One habit prevents all of them: on success, write `return nil`.",
  predict: {
    q: 'Is err nil?',
    code: `type MyErr struct{}

func (e *MyErr) Error() string { return "boom" }

func check(fail bool) error {
    var p *MyErr
    if fail {
        p = &MyErr{}
    }
    return p
}

func main() {
    err := check(false)
    fmt.Println(err == nil)
}`,
    options: ['true', 'false', 'boom', 'panic: nil pointer dereference'],
    answer: 1,
    why: '`p` is a nil `*MyErr`. Returning it as `error` makes the box (type `*MyErr`, value nil). The type slot is filled, so the interface is not nil and the program prints false.',
    trace: [
      ['line 6', 'p is a nil *MyErr', 'idle'],
      ['line 10', 'return p as error: box = (*MyErr, nil)', 'run'],
      ['line 14', 'err holds (*MyErr, nil)', 'wait'],
      ['line 15', 'err == nil asks: are both slots empty? no', 'runtime'],
      ['output', 'false', 'out'],
    ],
  },
  challenge: {
    title: 'Fix the function so success means nil',
    prompt: 'This version no longer uses a pointer variable. What should the last line return so `check(false) == nil` is true?',
    code: `func check(fail bool) error {
    if fail {
        return &MyErr{}
    }
    return ___
}`,
    answers: ['nil'],
    success: 'Returning the literal `nil` leaves both slots of the interface empty. That is the only kind of nil that `err == nil` recognises.',
    wrong: [
      { answers: ['(*MyErr)(nil)', '&MyErr{}'], title: 'That is the trap again', body: 'Anything with the type `*MyErr` fills the type slot, even if the pointer is nil. The interface would not be nil.' },
      { answers: ['null', 'undefined'], title: 'That is JavaScript', body: 'Go has no `null` or `undefined`. It has one empty value for pointers, interfaces, maps, slices, channels and functions: `nil`.' },
    ],
    hint: 'Return the empty value for an interface, written directly, with no type attached.',
  },
  recap: [
    'An interface value has a type slot and a value slot.',
    'It equals `nil` only when both slots are empty.',
    'A nil pointer stored in an interface is **not** a nil interface.',
    'Return `error`, not `*MyErr`, and write `return nil` on success.',
  ],
}

const assertions: LessonContent = {
  id: 'assertions',
  minutes: 12,
  lead: 'Sometimes you hold an interface value and need the concrete type back. In JavaScript you would check with `typeof` or `instanceof`. Go has type assertions for one type and type switches for many. Both check while the program runs. TypeScript\'s `as` (a note to the compiler that disappears at runtime) checks nothing.',
  fromTs: {
    title: 'Narrowing, Go style',
    intro: 'In JavaScript you test a value with `typeof` and then use it. TypeScript calls this narrowing. In Go you narrow an `any` with a type switch. The shape of the code is very close.',
    ts: `function describe(v: unknown): string {
  if (typeof v === "number") {
    return "number " + v * 2;
  }
  if (typeof v === "string") {
    return "string " + v;
  }
  return "unknown";
}`,
    go: `func describe(v any) string {
    switch x := v.(type) {
    case int:
        return fmt.Sprint("int ", x*2)
    case string:
        return "string " + x
    default:
        return "unknown"
    }
}`,
    facts: [
      ['Checked at runtime', '`v.(string)` checks the type stored in the interface while the program runs. TypeScript `as string` only tells the compiler to trust you.'],
      ['Two forms', '`s := v.(string)` panics if wrong. `s, ok := v.(string)` never panics; `ok` tells you if it worked.'],
      ['x gets the right type', 'Inside each `case` of a type switch, `x` already has that case\'s type. You do not need another assertion.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Type assertions',
      title: 'Ask for one specific type',
      blocks: [
        'A type assertion looks like `v.(T)`. It means "I think the value inside `v` is a `T`. Give it to me as a `T`."',
        {
          compare: {
            ts: `const v: unknown = "hello";

// trust me, no check:
const s = v as string;

// real check:
if (typeof v === "string") {
  console.log(v.length);
}`,
            go: `var v any = "hello"

// panics if v is not a string:
s := v.(string)

// safe "comma ok" form:
if s, ok := v.(string); ok {
    fmt.Println(len(s))
}`,
          },
        },
        'Use the comma-ok form whenever you are not 100% sure. When the assertion fails, `ok` is false and `s` gets the **zero value** of the type, like `""` for a string. Go never hands you `undefined`.',
        { pitfall: 'The single-result form `v.(string)` crashes with "interface conversion: interface {} is int, not string" when it is wrong. Only use it when a wrong type would be a real bug.' },
      ],
    },
    {
      eyebrow: 'Type switches',
      title: 'Handle many types at once',
      blocks: [
        'When there are several possible types, a type switch reads better than a chain of assertions, the same way a JS `switch (typeof v)` reads better than many `if` checks. The special syntax `v.(type)` only works inside a `switch`.',
        {
          list: [
            'Each `case` names one or more types: `case int, int64:`.',
            'With one type in the case, `x` has that type. With several, `x` stays as the interface.',
            '`case nil:` matches when the interface itself is nil (it holds nothing).',
            '`default:` catches everything else.',
          ],
        },
        'You can also assert to an **interface** as well as a concrete type. This asks "does the value inside also have these methods?" It is like checking `typeof obj.toString === "function"` in JS, with the compiler keeping track of the result.',
        {
          code: `func show(v any) {
    if s, ok := v.(fmt.Stringer); ok {
        fmt.Println(s.String())
        return
    }
    fmt.Println(v)
}`,
        },
        { note: 'This is how `fmt.Println` itself works. It checks whether your value is an `error` or a `fmt.Stringer` before falling back to default printing.' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Asserting on a non-interface', body: '`x.(int)` only works when `x` has an interface type. If `x` is already a `string`, you need a type conversion like `int(x)` instead, and maybe the `strconv` package.' },
    { title: 'Using assertions for errors', body: 'Checking `err.(*NotFound)` misses wrapped errors. Use `errors.As` instead. It looks through the whole wrap chain. See [Errors as values](/lesson/errors).' },
    { title: 'Big type switches as a design', body: 'A switch over 10 types usually means a missing interface. If every type should "draw itself", give each one a `Draw()` method and call it.' },
  ],
  predict: {
    code: `var v any = 42
s, ok := v.(string)
fmt.Printf("%q %v\\n", s, ok)`,
    options: ['"42" true', '"" false', 'panic: interface conversion', '"42" false'],
    answer: 1,
    why: 'The value inside is an `int`. The comma-ok form does not panic: `ok` is false and `s` gets the zero value of string, which is `""`. Unlike JS, Go never converts 42 into "42" for you.',
    trace: [
      ['line 1', 'v holds (int, 42)', 'idle'],
      ['line 2', 'is the type slot string? no, it is int', 'wait'],
      ['line 2', 's = "" (zero value), ok = false', 'run'],
      ['output', '"" false', 'out'],
    ],
  },
  challenge: {
    title: 'Complete the type switch',
    prompt: 'Fill the blank so `describe(21)` returns `int 42` and `describe("hi")` returns `string hi`.',
    code: `func describe(v any) string {
    switch x := v.(___) {
    case int:
        return fmt.Sprint("int ", x*2)
    case string:
        return "string " + x
    default:
        return "unknown"
    }
}`,
    answers: ['type'],
    success: '`v.(type)` is a special form that only exists inside a `switch`. Go checks each case in order and gives `x` the matching type.',
    wrong: [
      { answers: ['int', 'string'], title: 'That asserts one type only', body: 'With `v.(int)` you get a plain assertion, and `x` would always be an `int`. The `case string:` line could never match. Use the keyword that means "whatever type it is".' },
      { answers: ['typeof', 'any'], title: 'Not quite the keyword', body: 'JavaScript uses `typeof`. Go uses a keyword you already know from declarations.' },
    ],
    hint: 'It is the same keyword you use to declare a new type.',
  },
  recap: [
    '`v.(T)` gets a `T` out of an interface, checked at runtime.',
    'Use `t, ok := v.(T)` to avoid a panic when the type is wrong.',
    'A type switch `switch x := v.(type)` handles many types cleanly.',
    'For errors, prefer `errors.As` over assertions.',
  ],
}

const generics: LessonContent = {
  id: 'generics',
  minutes: 16,
  lead: 'Go got generics in version 1.18. In plain JS, a function like `first(xs)` already works on arrays of anything. Generics let a typed language keep that flexibility: you write the function once, and a type parameter `T` stands in for "whatever element type the caller passes". TypeScript writes it `<T>`. Go uses square brackets, and Go also needs to know which operators (`<`, `+`) a type supports.',
  fromTs: {
    title: 'Angle brackets become square brackets',
    intro: 'Here is a generic `map` function in both languages, like `Array.prototype.map`. The type parameters go in brackets after the name. The compiler usually works them out from the arguments, so callers rarely write them.',
    ts: `function map<T, U>(
  xs: T[],
  f: (x: T) => U,
): U[] {
  const out: U[] = [];
  for (const x of xs) out.push(f(x));
  return out;
}

map([1, 2, 3], n => n * 10);`,
    go: `func Map[T, U any](
    xs []T,
    f func(T) U,
) []U {
    out := make([]U, 0, len(xs))
    for _, x := range xs {
        out = append(out, f(x))
    }
    return out
}

// Map([]int{1, 2, 3},
//     func(n int) int { return n * 10 })`,
    facts: [
      ['[T any] not <T>', 'Type parameters go in square brackets. Each one needs a constraint; `any` means no requirement.'],
      ['Constraints are interfaces', 'A constraint like `cmp.Ordered` is an interface listing the types allowed. It decides which operators you can use, like `<` or `+`.'],
      ['Types survive compilation', 'TypeScript erases types: the JS that runs has no idea what `T` was. Go keeps the type information in the compiled program, so code that inspects types at runtime still sees the real type.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Constraints',
      title: 'Saying which types are allowed',
      blocks: [
        'A constraint says which types `T` may be. In TypeScript, `<T extends { length: number }>` limits `T` to things with a `length`, like arrays and strings. In Go, a constraint is an interface, and it can list **types** as well as methods.',
        {
          code: `// any type that supports < and >
func Max[T cmp.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

// your own list of types
type Number interface {
    ~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T {
    var total T // zero value of T
    for _, x := range xs {
        total += x
    }
    return total
}`,
        },
        {
          table: {
            head: ['Constraint', 'Allows', 'Lets you use'],
            rows: [
              ['`any`', 'every type', 'assign, pass around'],
              ['`comparable`', 'types that support `==`', '`==`, `!=`, map keys'],
              ['`cmp.Ordered`', 'numbers and strings', '`<`, `>`, `+`'],
              ['`int | float64`', 'exactly those two', 'operators both share'],
            ],
          },
        },
        'The `~` in `~int` means "int, or any type whose underlying type is int". So `type Age int` fits `~int`. It does not fit plain `int`.',
      ],
    },
    {
      eyebrow: 'Generic types',
      title: 'Structs can be generic too',
      blocks: [
        'You can put type parameters on a type too, like a generic class in TypeScript. A `Stack[T]` is a JS array used with only `push` and `pop`, where every item has the same type.',
        {
          compare: {
            ts: `class Stack<T> {
  private items: T[] = [];
  push(x: T) { this.items.push(x); }
  pop(): T | undefined {
    return this.items.pop();
  }
}`,
            go: `type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(x T) {
    s.items = append(s.items, x)
}

func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.items) == 0 {
        return zero, false
    }
    x := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return x, true
}`,
          },
        },
        'Look at `var zero T`. JS `pop()` on an empty array returns `undefined`. Go has no `undefined`, so `Pop` returns the zero value of `T` plus a `bool` that says whether it worked.',
        { note: 'Methods cannot add their own new type parameters. Only the type and plain functions can. If you need one, write a function instead of a method.' },
      ],
    },
    {
      eyebrow: 'When to use them',
      title: 'Reach for generics less than you think',
      blocks: [
        'Go code uses generics sparingly. A good rule of thumb:',
        {
          list: [
            'Use generics for **containers and helpers** that work on any element type: `slices.Contains`, `maps.Keys`, a `Stack[T]`.',
            'Use an **interface** when the types share behaviour you call, like `Area()` or `Read()`.',
            'Use a **concrete type** when only one type is used today. You can make it generic later.',
          ],
        },
        'The standard `slices` and `maps` packages already cover most helpers you would write in a `utils.js` file or pull from lodash: `slices.Sort`, `slices.Index`, `slices.Max`, `maps.Clone` and more.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Using < with an any constraint', body: '`func Max[T any](a, b T)` will not compile if you write `a > b`. The compiler does not know every `T` supports `>`. Use `cmp.Ordered`.' },
    { title: 'Expecting strings to compare like numbers', body: '`"10" < "9"` is true, because strings compare byte by byte. JS does the same with `"10" < "9"`. Generic code with `cmp.Ordered` gives very different answers for numbers and strings.' },
    { title: 'Forgetting the ~', body: 'With `int | float64`, a named type like `type Celsius float64` does not fit. Write `~float64` if named types should be allowed.' },
  ],
  predict: {
    code: `func Max[T cmp.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

func main() {
    fmt.Println(Max(10, 9), Max("10", "9"))
}`,
    options: ['10 10', '10 9', 'It does not compile', '10 "10"'],
    answer: 1,
    why: 'The first call uses `int`, so 10 > 9 and it returns 10. The second call uses `string`. Strings compare byte by byte: "1" is less than "9", so "10" < "9" and it returns "9".',
    trace: [
      ['call 1', 'T = int, 10 > 9, return 10', 'run'],
      ['call 2', 'T = string, compare "10" and "9"', 'run'],
      ['compare', "first byte: '1' (49) < '9' (57)", 'wait'],
      ['call 2', 'return "9"', 'run'],
      ['output', '10 9', 'out'],
    ],
  },
  challenge: {
    title: 'Write the constraint',
    prompt: 'This `Sum` should work for `[]int` and `[]float64`. With `any`, the `+=` will not compile. Fill in a constraint that allows exactly `int` and `float64`.',
    code: `func Sum[T ___](xs []T) T {
    var total T
    for _, x := range xs {
        total += x
    }
    return total
}`,
    answers: ['int | float64', 'float64 | int', '~int | ~float64', '~float64 | ~int'],
    success: 'A union of types lets the compiler check that `+=` works for every allowed `T`. `Sum([]int{1, 2, 3})` gives 6 and `Sum([]float64{1.5, 2.5})` gives 4.',
    wrong: [
      { answers: ['any'], title: 'any is too loose', body: 'With `any`, `T` could be a struct or a bool. Those do not support `+`, so the compiler rejects `total += x`.' },
      { answers: ['comparable'], title: 'comparable only means ==', body: '`comparable` lets you use `==` and `!=`, not arithmetic.' },
      { answers: ['number', 'int || float64', 'int, float64'], title: 'Close, wrong syntax', body: 'Go has no `number` type. A union of types uses a single `|`, like a TypeScript union (`string | number`, "one of these types").' },
    ],
    hint: 'Write a union of the two Go number types, with `|` between them, like a TypeScript union.',
  },
  recap: [
    'Type parameters go in square brackets: `func F[T any]()`.',
    'Constraints are interfaces that can list types; they decide which operators work.',
    'Use `cmp.Ordered` for `<`, `comparable` for `==`, `~int` to allow named types.',
    'Prefer interfaces for shared behaviour and generics for containers and helpers.',
  ],
}

const errorsLesson: LessonContent = {
  id: 'errors',
  minutes: 18,
  lead: 'In JavaScript, a `throw` jumps up through the calling functions until some `catch` grabs it. In Go, an error is an ordinary value that a function returns, like the `err` argument in an old Node callback `(err, data) => {}`. You check it, add context, and pass it up yourself. It is more typing, and you can see every failure path in the code.',
  fromTs: {
    title: 'try/catch becomes if err != nil',
    intro: 'Here is reading a config file in both languages. In the TypeScript version you cannot tell which line might throw. In Go, every call that can fail returns an error you must look at.',
    ts: `async function loadConfig() {
  try {
    const raw = await readFile("app.json", "utf8");
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      "load config: " + (e as Error).message,
      { cause: e },
    );
  }
}`,
    go: `func loadConfig() (Config, error) {
    var cfg Config
    raw, err := os.ReadFile("app.json")
    if err != nil {
        return cfg, fmt.Errorf("load config: %w", err)
    }
    err = json.Unmarshal(raw, &cfg)
    if err != nil {
        return cfg, fmt.Errorf("parse config: %w", err)
    }
    return cfg, nil
}`,
    facts: [
      ['error is an interface', 'Any type with an `Error() string` method is an error. `errors.New("x")` makes a simple one.'],
      ['Last return value', 'Go functions can return several values. By convention, a function that can fail returns `(result, error)`. On success the error is `nil`.'],
      ['%w wraps', '`fmt.Errorf("...: %w", err)` adds context and keeps the original error inside, like `{ cause: e }` in JavaScript.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Creating errors',
      title: 'Three ways to make an error',
      blocks: [
        {
          code: `// 1. A simple message
err := errors.New("disk full")

// 2. A message with values and a wrapped cause
err = fmt.Errorf("save %s: %w", name, err)

// 3. A sentinel: a named error callers can check
var ErrNotFound = errors.New("not found")`,
        },
        'For errors that carry data, define your own type, like `class ValidationError extends Error` in JS. It only needs an `Error()` method.',
        {
          code: `type ValidationError struct {
    Field string
}

func (e *ValidationError) Error() string {
    return "invalid " + e.Field
}`,
        },
        { note: 'Error messages in Go are lowercase and have no final period, because they get chained: "load config: open app.json: no such file or directory". Read it left to right, from outer context to the root cause.' },
      ],
    },
    {
      eyebrow: 'Checking errors',
      title: 'errors.Is and errors.As look through the chain',
      blocks: [
        'Once an error is wrapped, `==` stops matching, because the outer error is a new value. It is like comparing `new Error("x", { cause: e }) === e` in JS. Use the `errors` package instead. It unwraps layer by layer.',
        {
          table: {
            head: ['You want to know', 'Use', 'JavaScript feeling'],
            rows: [
              ['Is it this specific error?', '`errors.Is(err, ErrNotFound)`', '`e === NOT_FOUND`, but through causes'],
              ['Is it this error type? Give it to me.', '`errors.As(err, &target)`', '`e instanceof ValidationError`'],
              ['Did anything fail?', '`err != nil`', '`catch` ran'],
            ],
          },
        },
        {
          code: `err := save(user)

if errors.Is(err, ErrNotFound) {
    // handle missing user
}

var ve *ValidationError
if errors.As(err, &ve) {
    fmt.Println("bad field:", ve.Field)
}`,
        },
        'You can also combine several errors into one with `errors.Join(err1, err2)`, a bit like JS `AggregateError`. `errors.Is` finds any of them.',
      ],
    },
    {
      eyebrow: 'Handling style',
      title: 'Handle it once',
      blocks: [
        'Handle each error exactly once. Either you deal with it (retry, use a default, show a message), or you add context and return it. If you log it **and** return it, the same failure shows up in your logs many times, like a `catch` that logs and rethrows at every level.',
        {
          list: [
            'Low-level code: wrap with context and return.',
            'Top-level code (main, HTTP handler, like an Express error middleware): log it or turn it into a response.',
            'Ignore an error only on purpose, and write `_ =` so readers can see it was a choice.',
          ],
        },
        { pitfall: 'Writing `x, _ := strconv.Atoi(s)` throws away the error and leaves `x` at 0. It is the Go version of an empty `catch {}`, and it causes silent bugs. Only do it when 0 really is a fine answer.', title: 'Discarding errors with _' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Using %v instead of %w', body: '`fmt.Errorf("x: %v", err)` keeps the text but drops the original error. `errors.Is` and `errors.As` cannot find it anymore. Use `%w` when callers might want to check the cause.' },
    { title: 'Comparing wrapped errors with ==', body: '`err == ErrNotFound` is false as soon as anyone wraps it. Always use `errors.Is` for sentinel errors.' },
    { title: 'Using the result when err is not nil', body: 'When a function returns an error, its other results are usually zero values. Return or handle first, then use the result.' },
  ],
  deepDive: {
    q: 'Why did Go choose this over exceptions?',
    body: [
      'With exceptions, you cannot see where a function might fail. Any line inside a `try` might jump to the `catch`, so reading the code does not show you every path it can take.',
      'Go writes the failure path out. It costs a few extra lines. In return, when you read a function you can see every place it can fail and what it does about it. Nothing jumps up through hidden callers, so errors are also cheap: an error is a returned value like any other.',
    ],
  },
  predict: {
    code: `var ErrNotFound = errors.New("not found")

func find(id int) error {
    return fmt.Errorf("user %d: %w", id, ErrNotFound)
}

func main() {
    err := find(7)
    fmt.Println(err == ErrNotFound,
        errors.Is(err, ErrNotFound))
}`,
    options: ['true true', 'false true', 'false false', 'true false'],
    answer: 1,
    why: '`fmt.Errorf` creates a new error value that wraps `ErrNotFound`. So `==` sees two different values and gives false. `errors.Is` unwraps the chain, finds `ErrNotFound` inside, and gives true.',
    trace: [
      ['line 4', 'new error "user 7: not found" wraps ErrNotFound', 'run'],
      ['line 9', 'err == ErrNotFound: different values', 'wait'],
      ['line 10', 'errors.Is: check err, then err.Unwrap()', 'runtime'],
      ['line 10', 'found ErrNotFound one layer down', 'run'],
      ['output', 'false true', 'out'],
    ],
  },
  challenge: {
    title: 'Keep the cause when you add context',
    prompt: 'The caller checks `errors.Is(err, fs.ErrNotExist)`. Fill the format verb so the original error stays inside and the check prints true.',
    code: `func load() error {
    _, err := os.Open("missing.json")
    if err != nil {
        return fmt.Errorf("load config: ___", err)
    }
    return nil
}`,
    answers: ['%w'],
    success: '`%w` prints the inner message and also stores the error, so `errors.Is` can find `fs.ErrNotExist`. The message reads "load config: open missing.json: no such file or directory".',
    wrong: [
      { answers: ['%v', '%s'], title: 'The text is right, the chain is lost', body: 'The message looks the same, but `%v` and `%s` only copy the text. The original error is gone, so `errors.Is` returns false.' },
      { answers: ['%e', '${err}'], title: 'Not a Go verb', body: 'Go has no template literals. It uses `fmt` verbs, placeholders like `%s` in `console.log("%s", x)`. The one for wrapping errors is the letter w.' },
    ],
    hint: 'One verb exists only for wrapping errors. Think "w" for wrap.',
  },
  recap: [
    'Functions that can fail return `(result, error)`; check `if err != nil` right away.',
    'Add context with `fmt.Errorf("doing x: %w", err)`.',
    'Use `errors.Is` for sentinel errors and `errors.As` for error types.',
    'Handle each error once: deal with it, or wrap and return it.',
  ],
}

const panicLesson: LessonContent = {
  id: 'panic',
  minutes: 12,
  lead: 'Go does have something like `throw`. It is called `panic`, and it is meant for bugs and impossible situations. Normal failures like a missing file return an `error` instead. `recover` can stop a panic, but only from inside a deferred function. This lesson shows when each one belongs.',
  fromTs: {
    title: 'throw and catch, the rare version',
    intro: 'A panic travels up through the calling functions like a thrown exception, running their deferred calls on the way. `recover` inside a `defer` catches it, like a `catch` block. Compare the shapes.',
    ts: `function safeRun(job: () => void) {
  try {
    job();
    return null;
  } catch (e) {
    return new Error("job crashed: " + e);
  }
}`,
    go: `func safeRun(job func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("job crashed: %v", r)
        }
    }()
    job()
    return nil
}`,
    facts: [
      ['panic is for bugs', 'Reading past the end of a slice, writing to a nil map, using a nil pointer: these panic because the program is in a state that should never happen.'],
      ['recover only in defer', '`recover()` returns the panic value only when called directly inside a deferred function. Anywhere else it returns `nil`.'],
      ['Uncaught means crash', 'If nobody recovers, the program prints the panic value and the stack trace of the panicking goroutine, then exits with code 2. Set `GOTRACEBACK=all` to see every goroutine.'],
    ],
  },
  sections: [
    {
      eyebrow: 'What panics',
      title: 'Most panics come from the runtime',
      blocks: [
        'You rarely call `panic` yourself. Usually the runtime does it when your code does something impossible. JS returns `undefined` for `arr[5]` on a short array. Go panics instead.',
        {
          table: {
            head: ['Code', 'Panic message'],
            rows: [
              ['`xs[5]` on a 3-item slice', '`index out of range [5] with length 3`'],
              ['`var m map[string]int; m["a"] = 1`', '`assignment to entry in nil map`'],
              ['`var p *User; p.Name`', '`invalid memory address or nil pointer dereference`'],
              ['`v.(string)` when v holds an int', '`interface conversion: interface {} is int, not string`'],
              ['`close(ch)` twice', '`close of closed channel`'],
            ],
          },
        },
        'Calling `panic` yourself is fine for "this cannot happen" checks. It is also fine in setup code that must succeed, like `regexp.MustCompile`. In Go, a `Must` prefix tells you that a function panics instead of returning an error.',
      ],
    },
    {
      eyebrow: 'recover',
      title: 'Catching a panic with defer and recover',
      blocks: [
        'When a function panics, Go stops running it and runs its deferred calls. Then it runs its caller\'s deferred calls, and so on up the call stack. If one of those deferred functions calls `recover()`, the panic stops there.',
        {
          code: `func safe() (msg string) {
    defer func() {
        if r := recover(); r != nil {
            msg = fmt.Sprint("recovered: ", r)
        }
    }()
    var m map[string]int
    m["a"] = 1 // panics
    return "ok" // never runs
}`,
        },
        'Look at the **named result** `msg`: the return value has a name, like a variable declared in the signature. A deferred function can change named results, as you saw in [defer](/lesson/defer). That is how a recovered function still returns something useful.',
        { note: 'The `net/http` server recovers panics in each handler, so one bad request does not take down your whole server. Express does something similar: it catches an error thrown in a route handler (and, since Express 5, a rejected promise) and sends a 500 response. That is the usual place for `recover`: at the edge of one unit of work, like one request or one job.' },
      ],
    },
  ],
  pitfalls: [
    { title: 'Using panic as throw', body: 'Do not panic for "user not found" or "invalid input". Callers expect those as `error` values. A library that panics on bad input is unpleasant to use.' },
    { title: 'A panic in another goroutine', body: '`recover` only catches panics in its own goroutine. A panic in a goroutine you started with `go` crashes the whole program, even if `main` has a recover. It is like an unhandled promise rejection that kills the Node process. Each goroutine needs its own recover.' },
    { title: 'Calling recover outside defer', body: '`recover()` in normal code always returns `nil`. It must be called directly inside the deferred function, not in a helper that the deferred function calls.' },
  ],
  predict: {
    code: `func safe() (msg string) {
    defer func() {
        if r := recover(); r != nil {
            msg = fmt.Sprint("recovered: ", r)
        }
    }()
    var m map[string]int
    m["a"] = 1
    return "ok"
}

func main() {
    fmt.Println(safe())
}`,
    options: ['ok', 'recovered: assignment to entry in nil map', 'The program crashes with a panic', 'recovered: <nil>'],
    answer: 1,
    why: '`m` is a nil map, and writing to a nil map panics. `return "ok"` never runs. The deferred function runs during the panic, `recover()` returns the panic value, and it sets the named result `msg`.',
    trace: [
      ['line 2', 'defer registered', 'idle'],
      ['line 8', 'write to nil map: panic', 'err'],
      ['unwind', 'run deferred func', 'runtime'],
      ['line 3', 'recover() returns the panic value; panic stops', 'run'],
      ['line 4', 'msg = "recovered: assignment to entry in nil map"', 'run'],
      ['output', 'recovered: assignment to entry in nil map', 'out'],
    ],
  },
  challenge: {
    title: 'Turn a crash into an error',
    prompt: 'This runner should return an error instead of crashing when a job panics. Fill in the built-in function that stops the panic.',
    code: `func run(job func()) (err error) {
    defer func() {
        if r := ___(); r != nil {
            err = fmt.Errorf("job crashed: %v", r)
        }
    }()
    job()
    return nil
}`,
    answers: ['recover'],
    success: '`recover()` returns the value passed to `panic`, and the panic stops. Running a job that indexes an empty slice now returns "job crashed: runtime error: index out of range [3] with length 0".',
    wrong: [
      { answers: ['catch', 'try'], title: 'That is JavaScript', body: 'Go has no `try` or `catch`. The built-in that catches a panic has a different name.' },
      { answers: ['panic'], title: 'That starts a panic', body: '`panic` starts one. You want the built-in that stops it.' },
    ],
    hint: 'It is a built-in function with no arguments that only works inside a deferred call.',
  },
  recap: [
    '`panic` is for bugs and impossible states; normal failures return `error`.',
    '`recover()` works only directly inside a deferred function.',
    'Use a named result so the deferred function can set the return value.',
    'Each goroutine needs its own recover; one unrecovered panic crashes the program.',
  ],
}

export const TYPES: LessonContent[] = [interfaces, niltrap, assertions, generics, errorsLesson, panicLesson]
