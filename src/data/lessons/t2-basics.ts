import type { LessonContent } from './types'

const variables: LessonContent = {
  id: 'variables',
  minutes: 12,
  lead: 'In JavaScript a variable you forgot to set is `undefined`, and that is where many bugs start. Go has no `undefined`. Every variable starts with a real, usable value called its zero value. This lesson covers the two ways to declare variables and what that zero value is for each type.',
  fromTs: {
    title: 'let, const and their Go cousins',
    intro: 'Here are the usual declarations side by side. Go has a long form with `var` and a short form with `:=`. The short form is what you will write most of the time.',
    ts: `let count = 0;
const name = "Ada";
let total: number;

total = count + 10;
console.log(name, total);

let user; // undefined`,
    go: `count := 0
const name = "Ada"
var total int

total = count + 10
fmt.Println(name, total)

var user string // ""`,
    facts: [
      ['`:=` declares and assigns', '`count := 0` is like `let count = 0`. Go reads the type from the value, so `count` is an `int`.'],
      ['`var` when there is no value yet', '`var total int` is like `let total: number` in TypeScript (a `let` with a type label). The difference: Go fills it with `0` right away.'],
      ['No undefined', 'An unset `string` is `""`, an `int` is `0`, a `bool` is `false`. You can always read a variable safely.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Declaring',
      title: 'Three ways to say the same thing',
      blocks: [
        'All three lines below create an `int` variable with the value `5`. They differ only in how much you spell out.',
        {
          code: `var a int = 5 // type and value
var b = 5     // value only, type is inferred
c := 5        // short form, only inside functions`,
        },
        {
          table: {
            head: ['Form', 'Where it works', 'Use it when'],
            rows: [
              ['`x := value`', 'Inside functions only', 'Almost always. It is the normal Go style.'],
              ['`var x Type`', 'Anywhere', 'You want the zero value and will set it later.'],
              ['`var x = value`', 'Anywhere', 'Variables at the top of a file, outside any function (package level). `:=` is not allowed there.'],
            ],
          },
        },
        'You can declare several at once, and a function can return several values into new variables in one line. You will see this all the time with errors.',
        {
          code: `x, y := 1, 2
x, y = y, x // swap, no temp variable needed

n, err := strconv.Atoi("42")`,
        },
        { note: '`:=` needs at least one **new** variable on the left. `n, err := f()` is fine even if `err` already exists **in the same scope**, as long as `n` is new. Then `err` is reassigned. In an inner block, the same line declares a brand new `err` instead (see shadowing below).' },
      ],
    },
    {
      eyebrow: 'Zero values',
      title: 'Every type has a safe starting value',
      blocks: [
        'When you declare a variable without a value, Go fills in the **zero value** for its type. Think of it as the "empty" version of that type.',
        {
          table: {
            head: ['Type', 'Zero value', 'JavaScript value if unset'],
            rows: [
              ['`int`, `float64`', '`0`', '`undefined`'],
              ['`string`', '`""`', '`undefined`'],
              ['`bool`', '`false`', '`undefined`'],
              ['struct', 'every field at its zero value', '`undefined`'],
              ['pointer, slice, map, channel, func, interface', '`nil`', '`null` or `undefined`'],
            ],
          },
        },
        'Good Go code leans on this. A counter starts at `0` without you writing `= 0`. A `strings.Builder` or `sync.Mutex` works with no constructor (no `new` call, no setup function), because its zero value is ready to use.',
        {
          compare: {
            ts: `let hits: number | undefined;
hits = (hits ?? 0) + 1;

let names: string[] = [];
names.push("Ada");`,
            go: `var hits int
hits++ // 1, no check needed

var names []string // nil slice
names = append(names, "Ada")`,
          },
        },
      ],
    },
    {
      eyebrow: 'Scope',
      title: 'Shadowing: the same name, a new variable',
      blocks: [
        'Curly braces make a new scope, like in JavaScript. If you use `:=` inside an inner scope with a name that already exists, you create a **new** variable that hides the outer one. The outer one does not change.',
        {
          code: `x := 1
if true {
    x := 2 // a new x, only inside the if
    fmt.Println(x) // 2
}
fmt.Println(x) // 1`,
        },
        'JavaScript does the same with `let` inside a block, so the rule is not new. What is new is how easy it is to do by accident, because `:=` and `=` differ by one character.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Using := when you meant =', body: 'Inside an `if` or `for` block, `err := doThing()` creates a new `err` that disappears at the closing brace. The outer `err` stays `nil`. If you want to update an existing variable, use `=`.' },
    { title: ':= at package level', body: 'Outside a function you must use `var`. Writing `count := 0` at the top of a file gives "syntax error: non-declaration statement outside function body".' },
    { title: 'Declared and not used', body: 'Every local variable must be read somewhere, or the code does not compile. While experimenting, assign it to `_` or delete it.' },
  ],
  note: 'You never need to write `var x int = 0` or `s := ""`. Saying the zero value out loud is noise. Write `var x int` and let Go fill it in.',
  predict: {
    code: `var n int
var s string
var ok bool
fmt.Println(n, s == "", ok)`,
    options: ['0 true false', 'undefined true undefined', '0 false false', 'It does not compile'],
    answer: 0,
    why: 'Each variable gets its zero value: `0` for `int`, `""` for `string`, `false` for `bool`. So `s == ""` is `true`. Nothing is ever `undefined` in Go.',
    trace: [
      ['line 1', 'n is an int, set to 0', 'run'],
      ['line 2', 's is a string, set to ""', 'run'],
      ['line 3', 'ok is a bool, set to false', 'run'],
      ['line 4', 'n = 0, s == "" is true, ok = false', 'run'],
      ['output', '0 true false', 'out'],
    ],
  },
  challenge: {
    title: 'Declare total so this prints 7',
    prompt: 'Line 2 is missing its declaration. Fill the blank with the start of the line so `total` is a new variable holding `3`.',
    code: `func main() {
    ___ 3
    total += 4
    fmt.Println(total)
}`,
    answers: ['total :=', 'var total =', 'var total int ='],
    success: '`total := 3` declares a new `int` and sets it to `3`. Then `+= 4` makes it `7`. The long form `var total = 3` works too, but inside functions Go code almost always uses `:=`.',
    wrong: [
      { answers: ['total ='], title: 'total does not exist yet', body: '`=` only assigns to a variable that already exists. The compiler says "undefined: total". Use `:=` to declare and assign in one step.' },
      { answers: ['let total =', 'const total =', 'let total:number ='], title: 'That is TypeScript', body: 'Go has no `let`. And a Go `const` cannot change, so `+= 4` would fail. Use the short form `:=`.' },
    ],
    hint: 'Use the short declaration form: the name, then the operator that both declares and assigns.',
  },
  recap: [
    '`x := value` declares and assigns inside functions. `var x Type` declares with the zero value.',
    'Zero values: `0`, `""`, `false`, and `nil` for pointers, slices, maps, channels and interfaces.',
    'There is no `undefined`. A declared variable is always safe to read.',
    '`:=` in an inner block creates a new variable. Use `=` to update an existing one.',
  ],
}

const types: LessonContent = {
  id: 'types',
  minutes: 14,
  lead: 'JavaScript has one `number` type. Go has a whole family: `int`, `int64`, `float64`, `byte` and more. It also never converts between them for you. This lesson shows the basic types, how to convert, how constants work, and how `iota` gives you something close to an enum (a fixed set of named values).',
  fromTs: {
    title: 'One number type becomes many',
    intro: 'In TypeScript, `3` and `1.5` are both `number`, and you can add them. In Go they are different types, and you have to say how to combine them.',
    ts: `const count: number = 3;
const price: number = 1.5;

console.log(count * price); // 4.5

type Role = "admin" | "user";
const r: Role = "admin";`,
    go: `count := 3     // int
price := 1.5   // float64

fmt.Println(float64(count) * price)

type Role string
const r Role = "admin"`,
    facts: [
      ['Many number types', '`int` for whole numbers, `float64` for decimals. Sized versions like `int32` and `uint8` exist for when size matters.'],
      ['No automatic conversion', '`int` times `float64` does not compile. You write `float64(count)` to convert. It looks like a function call named after the type.'],
      ['Named types', '`type Role string` makes a new type built on `string`. You cannot mix a `Role` with a plain `string` by accident.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Basic types',
      title: 'The types you will use most',
      blocks: [
        'Go has many numeric types, but day-to-day code uses only a few of them.',
        {
          table: {
            head: ['Go type', 'Holds', 'Use it for'],
            rows: [
              ['`int`', 'Whole numbers, 64-bit on modern machines', 'Counters, indexes, lengths. The default.'],
              ['`float64`', 'Decimal numbers', 'Math with fractions. Same as a JS `number`.'],
              ['`string`', 'Text, stored as UTF-8 bytes', 'Text. Strings cannot be changed in place.'],
              ['`bool`', '`true` or `false`', 'Conditions.'],
              ['`byte`', 'One byte (8 bits, a number from 0 to 255), same as `uint8`', 'Raw data, files, network.'],
              ['`rune`', 'One Unicode character, same as `int32`', 'Working with characters. See [Strings, bytes, runes](/lesson/strings).'],
              ['`int64`, `uint32`, ...', 'Fixed-size numbers', 'File formats, protocols, IDs from databases.'],
            ],
          },
        },
        { note: 'An `int` can overflow. If `n` is an `int` holding `math.MaxInt64`, then `n + 1` wraps around to a big negative number. JS numbers lose precision quietly when they get too big. Go integers wrap quietly. (Written as a constant, `math.MaxInt64 + 1` does not wrap: the compiler rejects it with "overflows int".)' },
      ],
    },
    {
      eyebrow: 'Conversion',
      title: 'Converting is always explicit',
      blocks: [
        'To change a value from one type to another, write the target type like a function: `T(value)`. TypeScript\'s `as` only changes what the type checker believes, and nothing happens at runtime. A Go conversion changes the value itself, a bit like `Math.trunc(f)` in JS. For text, use the `strconv` package, the Go version of `parseInt` and `String(n)`.',
        {
          code: `n := 7
f := float64(n) / 2   // 3.5
i := int(f)           // 3, the decimals are dropped
b := byte(300 % 256)  // 44

s := strconv.Itoa(n)          // "7"
m, err := strconv.Atoi("42")  // 42, nil`,
        },
        { pitfall: '`string(65)` does not give you `"65"`. It gives you `"A"`, the character with code 65. To turn a number into its text, use `strconv.Itoa(n)` or `fmt.Sprint(n)`. `go vet` warns about this one.', title: 'string(n) is not toString()' },
      ],
    },
    {
      eyebrow: 'Constants and iota',
      title: 'Constants, and enums without an enum keyword',
      blocks: [
        '`const` in Go means a value known at **compile time** (when the compiler builds your program, before it ever runs): a number, a string, or a bool. It is stricter than JavaScript `const`, which only means "cannot be reassigned". You cannot make a Go `const` from a function call.',
        'Go has no `enum` keyword. (TypeScript has one. In plain JS you would use an object like `{ Pending: 0, Active: 1 }`.) Instead, you make a named type and a group of constants. Inside a `const ( ... )` block, `iota` starts at `0` and goes up by one on each line. Lines with no value repeat the line above.',
        {
          compare: {
            ts: `enum Status {
  Pending,   // 0
  Active,    // 1
  Closed,    // 2
}

let s = Status.Active;`,
            go: `type Status int

const (
    Pending Status = iota // 0
    Active                // 1
    Closed                // 2
)

s := Active`,
          },
        },
        'Because `Status` is its own type, a function that takes a `Status` will not accept a random `int` variable. Add a `String() string` method to the type and `fmt.Println` will print the name instead of the number. You will see how in [Methods](/lesson/methods).',
      ],
    },
  ],
  pitfalls: [
    { title: 'Mismatched types', body: 'The error "invalid operation: mismatched types int and float64" means you combined two different number types. Convert one side, usually to `float64`.' },
    { title: 'Integer division', body: '`7 / 2` is `3` when both sides are `int`. Go does not switch to decimals for you. Write `7.0 / 2` or `float64(a) / float64(b)` if you want `3.5`.' },
    { title: 'Converting a number with string()', body: '`string(n)` turns a number into the character with that code. Use `strconv.Itoa(n)` for "7" from 7.' },
  ],
  deepDive: {
    q: 'How can `const x = 1 << 100` compile when no int is that big?',
    body: [
      'Constants without a type, like `const x = 1 << 100`, are **untyped constants**. The compiler keeps them at very high precision until you use them.',
      'That is why `const half = 0.5` can be used with a `float32` or a `float64` without a conversion. The constant takes on the type it needs at the moment you use it, and it only fails if the value does not fit.',
    ],
  },
  predict: {
    code: `type Weekday int

const (
    Sunday Weekday = iota
    Monday
    Tuesday
)

func main() {
    fmt.Println(Monday, Tuesday)
}`,
    options: ['1 2', '0 0', 'Monday Tuesday', 'It does not compile'],
    answer: 0,
    why: '`iota` is `0` on the `Sunday` line and goes up by one per line. `Monday` repeats the expression with `iota` = 1, `Tuesday` with 2. `Weekday` has no `String` method, so `Println` prints the numbers.',
    trace: [
      ['line 4', 'Sunday = iota = 0', 'run'],
      ['line 5', 'Monday repeats "Weekday = iota", iota = 1', 'run'],
      ['line 6', 'Tuesday repeats it, iota = 2', 'run'],
      ['line 10', 'no String() method, print the numbers', 'idle'],
      ['output', '1 2', 'out'],
    ],
  },
  challenge: {
    title: 'Make the types match',
    prompt: '`a` is an `int` and `b` is a `float64`, so `a + b` does not compile. Convert `a` so the program prints `4.5`.',
    code: `var a int = 3
var b float64 = 1.5
fmt.Println(___(a) + b)`,
    answers: ['float64'],
    success: '`float64(a)` turns `3` into `3.0`, and now both sides are `float64`. Go wants you to choose the conversion, so you always know where precision might change.',
    wrong: [
      { answers: ['int'], title: 'a is already an int', body: '`int(a)` changes nothing, and `b` is still a `float64`. The compiler says "mismatched types int and float64". Convert `a` to the type of `b`.' },
      { answers: ['Number', 'number', 'float', 'double'], title: 'Not a Go type', body: 'Go has no `number`, `float` or `double`. The decimal type is `float64`.' },
    ],
    hint: 'Convert `a` to the same type as `b`. Its name has a number in it.',
  },
  recap: [
    'Use `int` for whole numbers and `float64` for decimals. Go never mixes them for you.',
    'Convert with `T(value)`, like `float64(n)`. For number-to-text, use `strconv.Itoa`.',
    '`const` is for compile-time values only.',
    'Enums are a named type plus a `const` block with `iota`.',
  ],
}

const control: LessonContent = {
  id: 'control',
  minutes: 12,
  lead: 'Go has fewer control keywords than JavaScript. There is one loop keyword, `for`, and it covers `for`, `while`, `for...of` and infinite loops. `if` and `switch` look familiar but drop the parentheses, and `switch` does not fall through into the next case. This lesson walks through all three.',
  fromTs: {
    title: 'Same ideas, fewer brackets',
    intro: 'Here is a loop, an `if` and a `switch` in both languages. Look for the missing parentheses in Go, and the missing `break` in the switch.',
    ts: `for (let i = 0; i < 3; i++) {
  if (i % 2 === 0) {
    console.log(i, "even");
  }
}

switch (day) {
  case "sat":
  case "sun":
    console.log("weekend");
    break;
  default:
    console.log("weekday");
}`,
    go: `for i := 0; i < 3; i++ {
    if i%2 == 0 {
        fmt.Println(i, "even")
    }
}

switch day {
case "sat", "sun":
    fmt.Println("weekend")
default:
    fmt.Println("weekday")
}


`,
    facts: [
      ['No parentheses, braces required', '`if x > 0 {` has no `( )` around the condition, and the `{ }` are never optional, even for one line.'],
      ['One loop keyword', '`for` does every kind of loop. There is no `while` and no `do...while`.'],
      ['switch breaks by itself', 'Each `case` stops at the end. List several values with commas instead of stacking cases.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Loops',
      title: 'Every loop is a for loop',
      blocks: [
        'Go uses `for` with different shapes. Here are the JavaScript loops you know and the Go shape for each.',
        {
          compare: {
            ts: `for (let i = 0; i < 5; i++) {}

while (n < 100) { n *= 2; }

while (true) { /* ... */ }

for (const [i, v] of arr.entries()) {}

for (const v of arr) {}`,
            go: `for i := 0; i < 5; i++ {}

for n < 100 { n *= 2 }

for { /* ... */ }

for i, v := range arr {}

for _, v := range arr {}`,
          },
        },
        '`range` works on slices, arrays, strings, maps and channels. For a slice it gives you the index and the value. If you only want the value, put `_` where the index goes. If you only want the index, leave the second name off: `for i := range arr`.',
        'Since Go 1.22 you can also range over a number: `for i := range 3` runs with `i` = 0, 1, 2.',
        { note: '`break` and `continue` work like in JavaScript. To break out of an outer loop, put a label on it (`outer:`) and write `break outer`.' },
      ],
    },
    {
      eyebrow: 'if',
      title: 'if with a short statement',
      blocks: [
        'Go lets you run one short statement before the condition, separated by a semicolon. Variables declared there live only inside the `if` and its `else`. This keeps helper variables out of the rest of the function.',
        {
          code: `if n, err := strconv.Atoi(s); err != nil {
    fmt.Println("not a number:", s)
} else {
    fmt.Println("got", n)
}
// n and err do not exist here`,
        },
        'Conditions must be a real `bool`. There is no truthy or falsy: `if count {` does not compile when `count` is an `int`. Write `if count > 0 {`. Empty strings, `0` and `nil` are not automatically false.',
      ],
    },
    {
      eyebrow: 'switch',
      title: 'A switch that does not fall through',
      blocks: [
        'Go runs the first matching `case` and then stops. You never write `break` in a switch. If you want the next case to run too, write `fallthrough`, but you will almost never need it.',
        'A switch with no value after it is a clean way to write a long `if / else if` chain. Each case is a condition.',
        {
          code: `switch {
case score >= 90:
    grade = "A"
case score >= 80:
    grade = "B"
default:
    grade = "C"
}`,
        },
        'Cases do not have to be constants either. They can be any expression, and they are checked from top to bottom.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Looking for while', body: 'There is no `while` keyword. `for cond { }` is the while loop, and `for { }` is `while (true)`.' },
    { title: 'Truthy values', body: '`if user {` or `if len(list) {` do not compile. A condition has to be a `bool`. Compare explicitly: `user != nil`, `len(list) > 0`.' },
    { title: 'break inside switch inside a loop', body: 'A `break` inside a `switch` ends the switch, not the loop around it. Use a labeled break, like `break loop`, to leave the loop.' },
    { title: 'The opening brace must be on the same line', body: 'Go adds a semicolon at the end of lines, a bit like JavaScript\'s automatic semicolon insertion. Putting `{` on its own line after `if x > 0` is a syntax error. `gofmt` keeps the brace where it belongs.' },
  ],
  predict: {
    code: `x := 2
switch x {
case 1:
    fmt.Println("one")
case 2:
    fmt.Println("two")
case 3:
    fmt.Println("three")
}`,
    options: ['two', 'two three', 'one two three', 'Nothing'],
    answer: 0,
    why: 'Go runs the matching `case 2` and stops at its end. There is no fall through, so `"three"` is never printed. In JavaScript, forgetting `break` would print both. In Go there is no `break` to forget.',
    trace: [
      ['line 2', 'switch on x = 2', 'idle'],
      ['line 3', 'case 1 does not match', 'idle'],
      ['line 5', 'case 2 matches', 'run'],
      ['line 6', 'print "two", then leave the switch', 'run'],
      ['output', 'two', 'out'],
    ],
  },
  challenge: {
    title: 'Write a while loop the Go way',
    prompt: 'This loop should keep doubling `n` while it is below 100, then print `128`. Which keyword goes in the blank?',
    code: `n := 1
___ n < 100 {
    n *= 2
}
fmt.Println(n)`,
    answers: ['for'],
    success: '`for n < 100 { }` is a while loop. A `for` with only a condition repeats until the condition is false.',
    wrong: [
      { answers: ['while'], title: 'Go has no while', body: 'There is no `while` keyword in Go. The compiler gives a syntax error. The loop keyword is the same one used for counting loops.' },
      { answers: ['if'], title: 'That runs only once', body: '`if` checks the condition one time, so `n` would become `2` and the program would print `2`. You need a loop.' },
    ],
    hint: 'Go has exactly one loop keyword. Use it with only a condition.',
  },
  recap: [
    '`for` is the only loop: classic, condition-only (while), infinite, and `range`.',
    'No parentheses around conditions, braces always required.',
    'Conditions must be `bool`. No truthy or falsy values.',
    '`switch` stops after the matching case. A bare `switch {` replaces `if / else if` chains.',
  ],
}

const functions: LessonContent = {
  id: 'functions',
  minutes: 15,
  lead: 'Functions in Go feel close to JavaScript: they take typed parameters, they are values, and they can be closures. The big new thing is that a function can return more than one value. That one feature shapes how Go handles errors everywhere.',
  fromTs: {
    title: 'Returning two things without an object',
    intro: 'In JavaScript, returning two values means returning an object or an array and destructuring it. In Go, multiple results are built into the language.',
    ts: `function divide(a: number, b: number):
    [number, Error | null] {
  if (b === 0) {
    return [0, new Error("divide by 0")];
  }
  return [a / b, null];
}

const [q, err] = divide(7, 2);`,
    go: `func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("divide by 0")
    }
    return a / b, nil
}


q, err := divide(7, 2)`,
    facts: [
      ['Types after names', '`a, b int` means both are `int`. The return types come after the parentheses: `(int, error)`.'],
      ['Multiple results', 'A function can return two or more values. No array or object is created. They are separate values.'],
      ['Error goes last', 'By convention, a function that can fail returns its `error` as the last result. Callers check it right away.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Signatures',
      title: 'Reading a Go function signature',
      blocks: [
        'Go puts the type after the name, everywhere. TypeScript writes `name: type` (a type label that is removed before the code runs). Go writes `name type`, with no colon, and the types are checked by the compiler. Once you get used to that order, signatures are easy to read.',
        {
          code: `func greet(name string) string
func add(a, b int) int
func split(s string) (string, string)
func save(path string, data []byte) error
func sum(nums ...int) int  // variadic, like ...nums`,
        },
        'A variadic parameter `...int` receives a slice. To pass an existing slice into it, spread it with `nums...`, the mirror of `...nums` in JavaScript.',
        {
          compare: {
            ts: `function sum(...nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3);
sum(...list);`,
            go: `func sum(nums ...int) int {
    t := 0
    for _, n := range nums { t += n }
    return t
}
sum(1, 2, 3)
sum(list...)`,
          },
        },
        { note: 'Go has no default parameter values and no optional parameters. Callers pass every argument. For many options, pass a struct (a fixed group of named fields, similar to a plain object), like `Options{Timeout: 5}`, and let missing fields take their zero values.' },
      ],
    },
    {
      eyebrow: 'Multiple results',
      title: 'Multiple results and named results',
      blocks: [
        'When you call a function with two results, you take both. If you do not need one, use `_`.',
        {
          code: `q, err := divide(7, 2)
if err != nil {
    return err
}
_, err = divide(1, 0) // only care about the error`,
        },
        'You can also give results names. They start at their zero values, and a bare `return` returns them as they are. This is handy for short functions and for documentation, but in long functions a bare `return` makes the code harder to read.',
        {
          code: `func minMax(nums []int) (lo, hi int) {
    lo, hi = nums[0], nums[0]
    for _, n := range nums {
        if n < lo { lo = n }
        if n > hi { hi = n }
    }
    return // returns lo, hi
}`,
        },
      ],
    },
    {
      eyebrow: 'Function values',
      title: 'Functions are values, and closures work the same',
      blocks: [
        'Like in JavaScript, a function can be stored in a variable, passed as an argument, and returned. An anonymous function is written `func(x int) int { ... }`. There is no arrow syntax.',
        {
          compare: {
            ts: `const double = (x: number) => x * 2;

function apply(f: (n: number) => number,
               v: number) {
  return f(v);
}
apply(double, 4); // 8`,
            go: `double := func(x int) int { return x * 2 }

func apply(f func(int) int,
           v int) int {
    return f(v)
}
apply(double, 4) // 8`,
          },
        },
        'Closures capture variables, not copies. A function that keeps using a variable from its outer scope keeps that variable alive, exactly like in JavaScript.',
        {
          code: `func counter() func() int {
    n := 0
    return func() int {
        n++
        return n
    }
}`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Ignoring the second result', body: '`n := strconv.Atoi("x")` does not compile: the function returns two values and you only took one. Either take both or write `n, _ :=` to say on purpose that you ignore the error.' },
    { title: 'Missing parentheses around multiple result types', body: '`func f() int, error` is a syntax error. Two or more result types need parentheses: `func f() (int, error)`.' },
    { title: 'Expecting optional parameters', body: 'Every parameter must be passed. If you want options, pass a struct or use a variadic parameter.' },
  ],
  deepDive: {
    q: 'Do multiple results create an array like `return [a, b]` does in JavaScript?',
    body: [
      'No. In JavaScript, `return [a, b]` creates a new array on the **heap** (the memory area for values that the garbage collector cleans up later). The caller then destructures it.',
      'In Go, the results are passed back in CPU registers (tiny storage slots inside the processor) or on the **stack** (fast memory for each function call, freed as soon as the call returns), the same way a single result is. Returning `(int, error)` costs about the same as returning one `int`. That is part of why the `value, err` pattern is cheap enough to use everywhere.',
    ],
  },
  predict: {
    code: `func counter() func() int {
    n := 0
    return func() int {
        n++
        return n
    }
}

func main() {
    a := counter()
    b := counter()
    a()
    a()
    fmt.Println(a(), b())
}`,
    options: ['3 1', '3 3', '1 1', '2 1'],
    answer: 0,
    why: 'Each call to `counter` makes a new `n`. `a` has its own `n` and `b` has its own. `a` is called twice, so the third call returns `3`. `b` is called once and returns `1`. Same as closures in JavaScript.',
    trace: [
      ['line 10', 'a gets a closure with its own n = 0', 'run'],
      ['line 11', 'b gets a closure with a separate n = 0', 'run'],
      ['line 12-13', 'a() twice, a.n = 2', 'run'],
      ['line 14', 'a() returns 3, b() returns 1', 'run'],
      ['output', '3 1', 'out'],
    ],
  },
  challenge: {
    title: 'Write the result types',
    prompt: '`divide` returns a number and an error. Fill in the result types so the function compiles.',
    code: `func divide(a, b int) ___ {
    if b == 0 {
        return 0, errors.New("divide by zero")
    }
    return a / b, nil
}`,
    answers: ['(int, error)', '(q int, err error)', '(result int, err error)', '(n int, err error)'],
    success: '`(int, error)` says: an `int` first, then an `error`. The error goes last by convention, and callers write `q, err := divide(7, 2)`.',
    wrong: [
      { answers: ['int, error'], title: 'Needs parentheses', body: 'Two or more result types must be in parentheses. Without them it is a syntax error.' },
      { answers: ['int', 'error'], title: 'One result is not enough', body: 'Every `return` here returns two values, so the signature needs two result types.' },
      { answers: ['(error, int)'], title: 'Wrong order', body: 'The returns give a number first and an error second. The types must be in the same order. And by convention the error always goes last.' },
    ],
    hint: 'List two types, the number type first and the error type second, inside parentheses.',
  },
  recap: [
    'Parameter and result types come after names: `func add(a, b int) int`.',
    'Functions can return several values. Put the `error` last and check it right away.',
    'No default or optional parameters. Use a struct for options.',
    'Functions are values, and closures capture variables the same way as in JavaScript.',
  ],
}

const deferLesson: LessonContent = {
  id: 'defer',
  minutes: 12,
  lead: 'JavaScript cleans up with `try/finally`. Go cleans up with `defer`. You write the cleanup right next to the thing that needs cleaning, and Go runs it when the function returns, no matter how it returns.',
  fromTs: {
    title: 'finally, moved to the top',
    intro: 'Opening a file and making sure it gets closed is the classic example. In JavaScript the cleanup sits at the bottom in `finally`. In Go it sits right under the open.',
    ts: `async function firstLine(path: string) {
  const f = await open(path);
  try {
    const text = await f.readFile("utf8");
    return text.split("\\n")[0];
  } finally {
    await f.close();
  }
}`,
    go: `func firstLine(path string) (string, error) {
    f, err := os.Open(path)
    if err != nil {
        return "", err
    }
    defer f.Close()

    sc := bufio.NewScanner(f)
    sc.Scan()
    return sc.Text(), sc.Err()
}`,
    facts: [
      ['Runs on return', 'A deferred call runs when the surrounding function returns: normal return, early return, or panic (Go\'s version of an uncaught thrown error).'],
      ['Next to the setup', 'You open and schedule the close on two lines in a row. You cannot forget the close when you add a new `return` later.'],
      ['Last in, first out', 'Several defers run in reverse order, like a stack. The last one you deferred runs first.'],
    ],
  },
  sections: [
    {
      eyebrow: 'How it works',
      title: 'What defer does',
      blocks: [
        '`defer` takes a function call and puts it on a list for the current function. When the function is about to return, Go runs that list from the end to the start.',
        {
          code: `func main() {
    defer fmt.Println("third")
    defer fmt.Println("second")
    fmt.Println("first")
}
// first
// second
// third`,
        },
        'The usual pattern is: get a resource, check the error, then defer the release. Always check the error first. If `os.Open` failed, `f` is `nil` and there is nothing to close.',
        {
          list: [
            'Files: `defer f.Close()`',
            'Locks: `mu.Lock()` then `defer mu.Unlock()`',
            'HTTP bodies: `defer resp.Body.Close()`',
            'Timers and contexts (Go\'s version of `AbortController`): `defer cancel()`',
          ],
        },
      ],
    },
    {
      eyebrow: 'Arguments',
      title: 'Arguments are read right away',
      blocks: [
        'This is the part that surprises people. The **arguments** of a deferred call are evaluated when the `defer` line runs, not when the call finally happens. Only the call itself waits.',
        {
          code: `x := 1
defer fmt.Println("deferred:", x)
x = 2
fmt.Println("now:", x)
// now: 2
// deferred: 1`,
        },
        'If you want the deferred code to see the latest value, defer a closure instead. A closure reads the variable when it runs.',
        {
          code: `x := 1
defer func() { fmt.Println("deferred:", x) }()
x = 2
// deferred: 2`,
        },
        { note: 'A deferred closure can also change named results of the function. That is how you add context to an error on the way out, or turn a `panic` into an error with `recover`. See [panic and recover](/lesson/panic).' },
      ],
    },
  ],
  pitfalls: [
    { title: 'defer inside a long loop', body: 'Defers run when the **function** returns, not when a loop iteration ends. Opening 10,000 files in a loop with `defer f.Close()` keeps all of them open until the function finishes. Move the loop body into its own function, or close explicitly.' },
    { title: 'Deferring before checking the error', body: 'If you write `defer f.Close()` before `if err != nil`, you may defer a call on a `nil` file. Check the error first, then defer.' },
    { title: 'Expecting the latest value', body: '`defer fmt.Println(x)` captures `x` as it is on that line. Use `defer func() { ... }()` if you need the value at return time.' },
  ],
  predict: {
    code: `for i := 1; i <= 3; i++ {
    defer fmt.Println(i)
}
fmt.Println("done")`,
    options: ['done 1 2 3', 'done 3 2 1', '1 2 3 done', '3 2 1 done'],
    answer: 1,
    why: 'Nothing deferred runs until the function returns, so `"done"` prints first. The arguments were read at each `defer` line (1, 2, 3), and defers run last-in-first-out, so they print 3, 2, 1. Each value is on its own line.',
    trace: [
      ['i = 1', 'defer Println(1), list: [1]', 'wait'],
      ['i = 2', 'defer Println(2), list: [1 2]', 'wait'],
      ['i = 3', 'defer Println(3), list: [1 2 3]', 'wait'],
      ['line 4', 'print "done"', 'run'],
      ['return', 'run the list backwards: 3, 2, 1', 'runtime'],
      ['output', 'done 3 2 1', 'out'],
    ],
  },
  challenge: {
    title: 'Make sure the file gets closed',
    prompt: 'The file is opened and the error is checked. Add the keyword that makes `f.Close()` run when the function returns.',
    code: `f, err := os.Open("notes.txt")
if err != nil {
    return err
}
___ f.Close()`,
    answers: ['defer'],
    success: '`defer f.Close()` schedules the close for when the function returns. Every `return` you add later is covered automatically.',
    wrong: [
      { answers: ['finally'], title: 'That is TypeScript', body: 'Go has no `try/finally`. The Go keyword schedules a call to run at the end of the function.' },
      { answers: ['go'], title: 'That starts a goroutine', body: '`go f.Close()` would close the file right now in a goroutine (a lightweight background task), while you still need it. You want the close to happen later.' },
      { answers: ['await'], title: 'Go has no await', body: 'Go code blocks normally, so there is no `await`. You need the keyword that delays a call until return.' },
    ],
    hint: 'The keyword is five letters and means "do this later, when the function ends".',
  },
  recap: [
    '`defer` runs a call when the surrounding function returns, even on panic.',
    'Put the defer right after acquiring the resource and checking the error.',
    'Multiple defers run in reverse order.',
    'Arguments are evaluated at the `defer` line. Use a closure to see later values.',
  ],
}

const pointers: LessonContent = {
  id: 'pointers',
  minutes: 16,
  lead: 'In JavaScript you never choose: numbers and strings are copied, objects are shared. In Go everything is copied by default, including structs (Go\'s fixed-shape objects) and arrays. When you want two places to share one value, you use a pointer: a value that holds the **memory address** of another value, meaning the spot in memory where it lives. They are simpler than they sound, and there is no pointer math.',
  fromTs: {
    title: 'Copied or shared? In Go, you decide',
    intro: 'In JavaScript, passing an object to a function lets the function change it. In Go, passing a struct gives the function a copy. To let it change the original, pass a pointer.',
    ts: `type User = { name: string };

function rename(u: User) {
  u.name = "Grace"; // changes caller's object
}

const u = { name: "Ada" };
rename(u);
console.log(u.name); // Grace`,
    go: `type User struct{ Name string }

func rename(u *User) {
    u.Name = "Grace" // changes caller's User
}

func main() {
    u := User{Name: "Ada"}
    rename(&u)
    fmt.Println(u.Name) // Grace
}`,
    facts: [
      ['Everything is a copy', 'Assigning or passing a struct copies all its fields, like `{ ...obj }` in JS. Change the copy, and the original stays the same.'],
      ['`&` and `*`', '`&u` means "the address of u". `*User` is the type "pointer to a User". `*p` reads the value it points to.'],
      ['No pointer math', 'You cannot add numbers to a pointer like in C. Pointers are safe references, and the garbage collector (automatic memory cleanup, like in JavaScript) frees memory for you.'],
    ],
  },
  sections: [
    {
      eyebrow: 'The two symbols',
      title: 'Taking an address and following it',
      blocks: [
        'A pointer is a value that holds the location of another value. There are only two operators to learn.',
        {
          table: {
            head: ['You write', 'It means', 'Example'],
            rows: [
              ['`&x`', 'Give me a pointer to `x`', '`p := &x`'],
              ['`*T`', 'The type "pointer to T"', '`var p *int`'],
              ['`*p`', 'The value `p` points to', '`*p = 10` changes `x`'],
            ],
          },
        },
        {
          code: `x := 5
p := &x       // p is an *int pointing at x
fmt.Println(*p) // 5
*p = 10        // write through the pointer
fmt.Println(x)  // 10`,
        },
        'The zero value of a pointer is `nil`, like `null` in JavaScript. Reading through a `nil` pointer crashes the program with "invalid memory address or nil pointer dereference".',
      ],
    },
    {
      eyebrow: 'Structs',
      title: 'Pointers to structs feel like JS objects',
      blocks: [
        'With a pointer to a struct you do not need to write `(*p).Name`. Go follows the pointer for you when you use a dot. So `p.Name` works whether `p` is a struct or a pointer to one.',
        {
          code: `u := &User{Name: "Ada"} // pointer to a new User
u.Name = "Grace"          // same as (*u).Name
other := u                // copies the pointer, not the User
other.Name = "Linus"
fmt.Println(u.Name)       // Linus`,
        },
        'This is the closest thing to JavaScript object behavior: when you pass pointers around, every holder sees the same data. When you pass plain structs, everyone gets their own copy.',
        { note: '`new(T)` also gives you a pointer to a zero `T`. In practice `&T{...}` is more common because you can set fields at the same time.' },
      ],
    },
    {
      eyebrow: 'When to use one',
      title: 'Pointer or value?',
      blocks: [
        'Beginners tend to use pointers everywhere "for speed". You usually do not need to. Copying a small struct is very cheap. Use a pointer for one of these reasons:',
        {
          list: [
            'The function must **change** the caller\'s value.',
            'The struct is large, and copying it on every call would be wasteful.',
            'The value must not be copied, for example a struct holding a `sync.Mutex`.',
            'You need "no value" as an option, and `nil` is a natural way to say it.',
          ],
        },
        'Slices, maps and channels already contain a pointer inside them, so you almost never need a pointer to one of those. More on this in [Methods: value versus pointer receivers](/lesson/methods) and [Stack versus heap](/lesson/escape).',
      ],
    },
  ],
  pitfalls: [
    { title: 'Changing a copy', body: 'If a function takes `u User` and sets `u.Name`, only the copy changes. The caller sees nothing. Take `u *User` and call it with `&u` when you want the change to stick.' },
    { title: 'nil pointer dereference', body: 'A pointer variable you declared but never set is `nil`. Using `p.Name` on it panics. Check `if p != nil` when a pointer may be missing.' },
    { title: 'Returning a pointer to a local is fine', body: 'In C this is a bug. In Go it is normal and safe: `return &User{}` works. The compiler moves the value to the heap (memory that stays alive after the function returns) when it needs to outlive the function.' },
  ],
  deepDive: {
    q: 'If everything is copied, why does changing a slice inside a function sometimes affect the caller?',
    body: [
      'A slice value is a small struct: a pointer to an array, a length and a capacity. Copying the slice copies those three fields, but both copies point at the same array.',
      'So `s[0] = 99` inside a function changes the shared array and the caller sees it. But `s = append(s, 1)` may make a new array, and the caller will not see that. [Arrays versus slices](/lesson/slices) walks through it step by step.',
    ],
  },
  predict: {
    code: `func double(n int)   { n *= 2 }
func doubleP(n *int) { *n *= 2 }

func main() {
    x := 5
    double(x)
    doubleP(&x)
    fmt.Println(x)
}`,
    options: ['5', '10', '20', 'It does not compile'],
    answer: 1,
    why: '`double(x)` gets a copy of `x` and doubles the copy, so `x` is still `5`. `doubleP(&x)` gets a pointer to `x` and writes through it, so `x` becomes `10`.',
    trace: [
      ['line 5', 'x = 5', 'run'],
      ['line 6', 'double gets a copy, copy becomes 10, x stays 5', 'idle'],
      ['line 7', 'doubleP gets &x, *n = 10 changes x', 'run'],
      ['line 8', 'x is 10', 'run'],
      ['output', '10', 'out'],
    ],
  },
  challenge: {
    title: 'Write through the pointer',
    prompt: '`reset` gets a pointer to an `int`. Set the value it points to back to `0`, so the caller\'s variable changes.',
    code: `func reset(n *int) {
    ___ = 0
}

x := 42
reset(&x)
fmt.Println(x) // 0`,
    answers: ['*n'],
    success: '`*n = 0` follows the pointer and writes into `x` itself. `n` is the address, `*n` is the value at that address.',
    wrong: [
      { answers: ['n'], title: 'n is the pointer, not the int', body: '`n = 0` tries to store `0` in a pointer variable. The compiler says "cannot use 0 (untyped int constant) as *int value". You need to write to the value the pointer points at.' },
      { answers: ['&n'], title: 'That is the address of the pointer', body: '`&n` takes the address of `n`. You cannot assign to an address. Follow the pointer instead.' },
    ],
    hint: 'Use the operator that follows a pointer to the value it points at.',
  },
  recap: [
    'Go copies everything by default, including structs.',
    '`&x` makes a pointer, `*T` is a pointer type, `*p` reads or writes the value.',
    'Dot access follows pointers automatically: `p.Name` works on `*User`.',
    'Use pointers to share or change a value, not by default for speed.',
  ],
}

export const BASICS: LessonContent[] = [variables, types, control, functions, deferLesson, pointers]
