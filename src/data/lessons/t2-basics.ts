import type { LessonContent } from './types'

const variables: LessonContent = {
  id: 'variables',
  minutes: 12,
  lead: 'Forgot to set a variable in JavaScript? You get `undefined`, and that is where a lot of bugs start. Go removes that whole problem: every variable starts with a real, usable value called its **zero value**. In this lesson you\'ll learn the two ways to declare a variable and what that starting value is for each type.',
  fromTs: {
    title: 'let, const and their Go cousins',
    intro: 'Here are the declarations you already write, next to their Go versions. Go has a long form with `var` and a short form with `:=`. You\'ll use the short form most of the time.',
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
      ['`:=` declares and assigns', '`count := 0` is like `let count = 0`. Go looks at the value to pick the type, so `count` is an `int`.'],
      ['`var` when there is no value yet', '`var total int` is like `let total: number` in TypeScript. The difference: Go fills it with `0` right away.'],
      ['No undefined', 'An unset `string` is `""`, an `int` is `0`, a `bool` is `false`. Reading a variable is always safe.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Declaring',
      title: 'Three ways to say the same thing',
      blocks: [
        { note: 'Inside a function, write `x := value`. Use `var` when you have no value yet, or when you are outside a function.', title: 'In one sentence' },
        'Here are three lines that all do the same thing: each creates an `int` variable holding `5`. The only difference is how much you spell out.',
        {
          code: `var a int = 5 // type and value
var b = 5     // value only, Go infers the type
c := 5        // short form, only inside functions`,
        },
        {
          table: {
            head: ['Form', 'Where it works', 'Use it when'],
            rows: [
              ['`x := value`', 'Inside functions only', 'Almost always. It is the normal Go style.'],
              ['`var x Type`', 'Anywhere', 'You want the zero value and will set it later.'],
              ['`var x = value`', 'Anywhere', 'At the top of a file, outside any function (the **package level**). `:=` is not allowed there.'],
            ],
          },
        },
        'You can declare several variables in one line. A function can also hand back two values into two new variables at once. You\'ll see this all the time with errors.',
        {
          code: `x, y := 1, 2
x, y = y, x // swap, no temp variable needed

n, err := strconv.Atoi("42") // a number and an error`,
        },
        { note: '`:=` needs at least one **new** name on the left. `n, err := f()` is fine even if `err` already exists in the same scope, as long as `n` is new. In that case `err` gets the new value. Inside an inner block, though, the same line creates a brand new `err` (see shadowing below).', title: 'You might wonder: can I reuse err with :=?' },
      ],
    },
    {
      eyebrow: 'Zero values',
      title: 'Every type has a safe starting value',
      blocks: [
        'When you declare a variable without a value, Go fills in the **zero value** for its type: the "empty" version of that type.',
        { note: 'A new Go variable is like a brand new notebook. It is blank, but it is a real notebook you can write in right away. A JS variable left as `undefined` is more like having no notebook at all.', title: 'Think of it like this' },
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
        'Good Go code leans on this. A counter starts at `0` without you writing `= 0`.',
        'Some types go further: their zero value is ready to use with no setup. A `strings.Builder` or a `sync.Mutex` works without a constructor (no `new` call, no init function).',
        {
          compare: {
            ts: `let hits: number | undefined;
hits = (hits ?? 0) + 1;

let names: string[] = [];
names.push("Ada");`,
            go: `var hits int
hits++ // 1, no check needed

var names []string // nil slice, still usable
names = append(names, "Ada")`,
          },
        },
      ],
    },
    {
      eyebrow: 'Scope',
      title: 'Shadowing: the same name, a new variable',
      blocks: [
        'Curly braces make a new scope, as in JavaScript. If you use `:=` inside an inner scope with a name that already exists, you get a **new** variable that hides the outer one. This is called **shadowing**. The outer variable does not change.',
        {
          code: `x := 1
if true {
    x := 2 // a new x, only inside the if
    fmt.Println(x) // 2
}
fmt.Println(x) // 1`,
        },
        'JavaScript does the same thing with `let` inside a block, so the rule itself is not new.',
        'What is new is how easy it is to do by accident. `:=` and `=` differ by one character, and only one of them makes a new variable.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Using := when you meant =', body: 'Inside an `if` or `for` block, `err := doThing()` creates a new `err` that disappears at the closing brace. The outer `err` stays `nil`. To update an existing variable, use `=`.' },
    { title: ':= at package level', body: 'Outside a function you must use `var`. Writing `count := 0` at the top of a file gives "syntax error: non-declaration statement outside function body".' },
    { title: 'Declared and not used', body: 'Every local variable must be read somewhere, or the code does not compile. While you experiment, assign it to `_` or delete it.' },
  ],
  note: 'You never need to write `var x int = 0` or `s := ""`. Spelling out the zero value is noise. Write `var x int` and let Go fill it in.',
  predict: {
    code: `var n int
var s string
var ok bool
fmt.Println(n, s == "", ok)`,
    options: ['0 true false', 'undefined true undefined', '0 false false', 'It does not compile'],
    answer: 0,
    why: 'Each variable starts at its zero value. Step by step: `n` is an `int`, so it is `0`. `s` is a `string`, so it is `""`, which makes `s == ""` true. `ok` is a `bool`, so it is `false`. Nothing in Go is ever `undefined`.',
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
    prompt: 'Line 2 is missing the start of its declaration. Fill the blank so `total` becomes a new variable holding `3`.',
    code: `func main() {
    ___ 3
    total += 4
    fmt.Println(total)
}`,
    answers: ['total :=', 'var total =', 'var total int ='],
    success: '`total := 3` declares a new `int` and sets it to `3`. Then `+= 4` makes it `7`. The long form `var total = 3` works too, but inside functions Go code almost always uses `:=`.',
    wrong: [
      { answers: ['total ='], title: 'total does not exist yet', body: '`=` only assigns to a variable that already exists. Here `total` is brand new, so the compiler says "undefined: total". Use `:=` to declare and assign in one step.' },
      { answers: ['let total =', 'const total =', 'let total:number ='], title: 'That is TypeScript', body: 'Go has no `let`. And a Go `const` can never change, so `+= 4` would fail. Use the short form `:=`.' },
    ],
    hint: 'You need the short form: the variable name, then the operator that declares and assigns at the same time.',
  },
  recap: [
    'Inside functions, `x := value` declares and assigns. `var x Type` declares with the zero value.',
    'Zero values: `0`, `""`, `false`, and `nil` for pointers, slices, maps, channels and interfaces.',
    'There is no `undefined`. A declared variable is always safe to read.',
    '`:=` in an inner block creates a new variable (shadowing). Use `=` to update an existing one.',
  ],
}

const types: LessonContent = {
  id: 'types',
  minutes: 14,
  lead: 'JavaScript has one `number` type for everything. Go has a family of them: `int`, `int64`, `float64`, `byte` and more. And Go never converts between them for you. Why? So you always see where a value might lose precision. In this lesson you\'ll meet the basic types, learn how to convert, see how constants work, and use `iota` to build something close to an enum (a fixed set of named values).',
  fromTs: {
    title: 'One number type becomes many',
    intro: 'In TypeScript, `3` and `1.5` are both `number`, so you can multiply them. In Go they are different types, and you have to say how to combine them.',
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
      ['Many number types', '`int` for whole numbers, `float64` for decimals. Sized versions like `int32` and `uint8` exist for when the exact size matters.'],
      ['No automatic conversion', '`int` times `float64` does not compile. You write `float64(count)` to convert. It looks like calling a function named after the type.'],
      ['Named types', '`type Role string` makes a new type built on `string`. You cannot mix up a `Role` and a plain `string` by accident.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Basic types',
      title: 'The types you will use most',
      blocks: [
        'Go has many numeric types, but everyday code uses only a few. Start with `int` and `float64`, and reach for the others when you have a reason.',
        {
          table: {
            head: ['Go type', 'Holds', 'Use it for'],
            rows: [
              ['`int`', 'Whole numbers, 64-bit on modern machines', 'Counters, indexes, lengths. The default.'],
              ['`float64`', 'Decimal numbers', 'Math with fractions. Same as a JS `number`.'],
              ['`string`', 'Text, stored as UTF-8 bytes', 'Text. You cannot change a string in place.'],
              ['`bool`', '`true` or `false`', 'Conditions.'],
              ['`byte`', 'One byte (8 bits, a number from 0 to 255), same as `uint8`', 'Raw data, files, network.'],
              ['`rune`', 'One Unicode character, same as `int32`', 'Working with characters. See [Strings, bytes, runes](/lesson/strings).'],
              ['`int64`, `uint32`, ...', 'Fixed-size numbers', 'File formats, protocols, IDs from databases.'],
            ],
          },
        },
        { note: 'An `int` can **overflow** (go past its biggest value). If `n` is an `int` holding `math.MaxInt64`, then `n + 1` wraps around to a big negative number. JS numbers quietly lose precision when they get too big. Go integers quietly wrap. (Written as a constant, `math.MaxInt64 + 1` does not wrap: the compiler rejects it with "overflows int".)' },
      ],
    },
    {
      eyebrow: 'Conversion',
      title: 'Converting is always explicit',
      blocks: [
        { note: 'To change a value\'s type, write the type name like a function: `T(value)`.', title: 'In one sentence' },
        'You might wonder how this differs from TypeScript\'s `as`. The answer: `as` only changes what the type checker believes, and nothing happens when the code runs. A Go conversion really changes the value, a bit like `Math.trunc(f)` in JS.',
        'For text, use the `strconv` package. It is Go\'s version of `parseInt` and `String(n)`.',
        {
          code: `n := 7
f := float64(n) / 2   // 3.5
i := int(f)           // 3, the decimals are dropped
b := byte(300 % 256)  // 44

s := strconv.Itoa(n)          // "7"
m, err := strconv.Atoi("42")  // 42, nil`,
        },
        { pitfall: '`string(65)` does not give you `"65"`. It gives you `"A"`, the character whose code is 65. To turn a number into its text, use `strconv.Itoa(n)` or `fmt.Sprint(n)`. `go vet` warns about this one.', title: 'string(n) is not toString()' },
      ],
    },
    {
      eyebrow: 'Constants and iota',
      title: 'Constants, and enums without an enum keyword',
      blocks: [
        'In Go, `const` means a value known at **compile time** (when the compiler builds your program, before it ever runs). It can only be a number, a string or a bool.',
        'That is stricter than JavaScript\'s `const`, which only means "cannot be reassigned". So you cannot make a Go `const` from a function call.',
        'Go also has no `enum` keyword. TypeScript has one, and in plain JS you might use an object like `{ Pending: 0, Active: 1 }`. In Go you build one from two pieces:',
        {
          list: [
            'Make a named type, like `type Status int`.',
            'Open a `const ( ... )` block. Inside it, `iota` is `0` on the first line and goes up by one on each line.',
            'Lines with no value repeat the expression from the line above, with the new `iota`.',
          ],
          ordered: true,
        },
        { note: '`iota` is a line counter for a `const` block. It starts at 0 and ticks up once per line, like the row numbers in a spreadsheet.', title: 'Think of it like this' },
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
        'Because `Status` is its own type, a function that takes a `Status` will not accept a random `int` variable.',
        'Want `fmt.Println` to print `Active` instead of `1`? Add a `String() string` method to the type. You\'ll see how in [Methods](/lesson/methods).',
      ],
    },
  ],
  pitfalls: [
    { title: 'Mismatched types', body: 'The error "invalid operation: mismatched types int and float64" means you combined two different number types. Convert one side, usually to `float64`.' },
    { title: 'Integer division', body: 'When both sides are `int`, `7 / 2` is `3`. Go does not switch to decimals for you. Write `7.0 / 2` or `float64(a) / float64(b)` to get `3.5`.' },
    { title: 'Converting a number with string()', body: '`string(n)` turns a number into the character with that code. To get "7" from 7, use `strconv.Itoa(n)`.' },
  ],
  deepDive: {
    q: 'How can `const x = 1 << 100` compile when no int is that big?',
    body: [
      'A constant with no type written on it, like `const x = 1 << 100`, is an **untyped constant**. The compiler keeps it at very high precision until you actually use it.',
      'That is why `const half = 0.5` works with both a `float32` and a `float64`, with no conversion. The constant takes on whatever type it needs at the moment you use it. It only fails if the value does not fit that type.',
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
    why: 'Walk through the `const` block. On the `Sunday` line, `iota` is `0`. `Monday` has no value, so it repeats `Weekday = iota` with `iota` now `1`. `Tuesday` repeats it with `2`. `Weekday` has no `String` method, so `Println` has no name to show and prints the numbers.',
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
    success: '`float64(a)` turns `3` into `3.0`, so now both sides are `float64` and the sum is `4.5`. Go makes you pick the conversion yourself, so you always know where precision might change.',
    wrong: [
      { answers: ['int'], title: 'a is already an int', body: '`int(a)` changes nothing, and `b` is still a `float64`. The compiler says "mismatched types int and float64". Convert `a` to the type `b` has.' },
      { answers: ['Number', 'number', 'float', 'double'], title: 'Not a Go type', body: 'Go has no `number`, `float` or `double`. Its everyday decimal type has a size in its name.' },
    ],
    hint: 'Convert `a` to the same type as `b`. Look at how `b` is declared.',
  },
  recap: [
    'Use `int` for whole numbers and `float64` for decimals. Go never mixes them for you.',
    'Convert with `T(value)`, like `float64(n)`. For number to text, use `strconv.Itoa`.',
    '`const` is only for values known at compile time.',
    'An enum is a named type plus a `const` block with `iota`, the line counter.',
  ],
}

const control: LessonContent = {
  id: 'control',
  minutes: 12,
  lead: 'Go has fewer control keywords than JavaScript, so there is less to remember. One keyword, `for`, does every loop: counting, `while`, `for...of` and infinite. `if` and `switch` look familiar but drop the parentheses, and `switch` never falls into the next case. This lesson walks through all three.',
  fromTs: {
    title: 'Same ideas, fewer brackets',
    intro: 'Here is a loop, an `if` and a `switch` in both languages. Look for two things in the Go version: no parentheses around conditions, and no `break` in the switch.',
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
      ['No parentheses, braces required', '`if x > 0 {` has no `( )` around the condition. The `{ }` are never optional, even for one line.'],
      ['One loop keyword', '`for` does every kind of loop. There is no `while` and no `do...while`.'],
      ['switch breaks by itself', 'Each `case` stops at its end. To match several values, list them with commas instead of stacking cases.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Loops',
      title: 'Every loop is a for loop',
      blocks: [
        { note: 'Go has one loop keyword, `for`, and you change its shape to get every loop you know from JS.', title: 'In one sentence' },
        'Here are the JavaScript loops you already use, each next to its Go shape.',
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
        '`range` walks over slices, arrays, strings, maps and channels. For a slice, it gives you two things on each step: the index and the value.',
        {
          list: [
            'Want only the value? Put `_` where the index goes: `for _, v := range arr`.',
            'Want only the index? Leave the second name off: `for i := range arr`.',
            'Want a counter? Since Go 1.22 you can range over a number: `for i := range 3` runs with `i` = 0, 1, 2.',
          ],
        },
        { note: '`break` and `continue` work like in JavaScript. To break out of an outer loop, put a label on it (`outer:`) and write `break outer`.' },
      ],
    },
    {
      eyebrow: 'if',
      title: 'if with a short statement',
      blocks: [
        'Go lets you run one short statement before the condition, separated by a semicolon. A variable made there lives only inside that `if` and its `else`.',
        'Why is that useful? It keeps helper variables, like `err`, out of the rest of the function.',
        {
          code: `if n, err := strconv.Atoi(s); err != nil {
    fmt.Println("not a number:", s)
} else {
    fmt.Println("got", n)
}
// n and err do not exist here`,
        },
        'A condition must be a real `bool`. There is no **truthy** or **falsy** (JS turning values like `0` or `""` into true or false for you).',
        'So `if count {` does not compile when `count` is an `int`. Write `if count > 0 {`. Empty strings, `0` and `nil` are never treated as false.',
      ],
    },
    {
      eyebrow: 'switch',
      title: 'A switch that does not fall through',
      blocks: [
        'Go runs the first `case` that matches, then leaves the switch. You never write `break`.',
        'If you really want the next case to run too, write `fallthrough`. You will almost never need it.',
        { note: 'A JS switch is a slide: once you get on at a case, you keep going down until a `break`. A Go switch is a set of doors: you walk through one and you are out.', title: 'Think of it like this' },
        'A switch with nothing after the keyword is a clean way to write a long `if / else if` chain. Each case is its own condition.',
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
        'Cases do not have to be constants. They can be any expression, and Go checks them from top to bottom.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Looking for while', body: 'There is no `while` keyword. `for cond { }` is the while loop, and `for { }` is `while (true)`.' },
    { title: 'Truthy values', body: '`if user {` or `if len(list) {` do not compile, because a condition has to be a `bool`. Compare on purpose: `user != nil`, `len(list) > 0`.' },
    { title: 'break inside switch inside a loop', body: 'A `break` inside a `switch` ends the switch, not the loop around it. To leave the loop, use a labeled break like `break loop`.' },
    { title: 'The opening brace must be on the same line', body: 'Go adds a semicolon at the end of lines for you, a bit like JavaScript\'s automatic semicolon insertion. So putting `{` on its own line after `if x > 0` is a syntax error. `gofmt` keeps the brace where it belongs.' },
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
    why: 'Go checks the cases in order. `case 1` does not match. `case 2` matches, so it prints `"two"` and leaves the switch at the end of that case. Nothing falls through, so `"three"` never prints. In JavaScript, forgetting `break` would print both. In Go there is no `break` to forget.',
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
    success: '`for n < 100 { }` is Go\'s while loop. A `for` with only a condition repeats until the condition is false: 1, 2, 4, ... 64, 128, then it stops.',
    wrong: [
      { answers: ['while'], title: 'Go has no while', body: 'There is no `while` keyword in Go, so the compiler gives a syntax error. The loop keyword is the same one you use for counting loops.' },
      { answers: ['if'], title: 'That runs only once', body: '`if` checks the condition one time, so `n` would become `2` and the program would print `2`. You need something that repeats.' },
    ],
    hint: 'Go has exactly one loop keyword. Write it with only a condition after it.',
  },
  recap: [
    '`for` is the only loop: counting, condition-only (while), infinite, and `range`.',
    'No parentheses around conditions. Braces are always required.',
    'Conditions must be a `bool`. No truthy or falsy values.',
    '`switch` leaves after the matching case. A bare `switch {` replaces `if / else if` chains.',
  ],
}

const functions: LessonContent = {
  id: 'functions',
  minutes: 15,
  lead: 'Go functions feel close to JavaScript ones: they take typed parameters, you can pass them around as values, and they can be closures. The big new thing is that a function can return **more than one value**. That one feature shapes how Go handles errors everywhere, so it is worth getting comfortable with now.',
  fromTs: {
    title: 'Returning two things without an object',
    intro: 'In JavaScript, returning two values means returning an array or object and destructuring it. In Go, returning several values is built into the language.',
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
      ['Types after names', '`a, b int` means both are `int`. The result types come after the parentheses: `(int, error)`.'],
      ['Multiple results', 'A function can return two or more values. No array or object is created. They are separate values.'],
      ['Error goes last', 'By convention, a function that can fail returns its `error` as the last result. The caller checks it right away.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Signatures',
      title: 'Reading a Go function signature',
      blocks: [
        'Go puts the type after the name, everywhere. TypeScript writes `name: type`. Go writes `name type`, with no colon.',
        'The other difference: TypeScript\'s type labels are removed before the code runs, but Go\'s types are checked by the compiler and stay real. Once the order feels normal, signatures read easily:',
        {
          code: `func greet(name string) string
func add(a, b int) int
func split(s string) (string, string)
func save(path string, data []byte) error
func sum(nums ...int) int  // variadic, like ...nums`,
        },
        'The last one is **variadic**: it takes any number of arguments. Inside the function, `nums` is a slice (Go\'s growable list).',
        'To pass a slice you already have, spread it with `list...`. It is the mirror image of `...list` in JavaScript: the dots go after.',
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
        { note: 'Go has no default parameter values and no optional parameters, so callers pass every argument. Need lots of options? Pass a struct (a fixed group of named fields, similar to a plain object), like `Options{Timeout: 5}`. Any field you leave out gets its zero value.', title: 'You might wonder: where are optional parameters?' },
      ],
    },
    {
      eyebrow: 'Multiple results',
      title: 'Multiple results and named results',
      blocks: [
        'When a function returns two values, you take both. If you do not need one, put `_` in its place.',
        {
          code: `q, err := divide(7, 2)
if err != nil {
    return err
}
_, err = divide(1, 0) // only care about the error`,
        },
        'You can also give the results names. Named results start at their zero values, and a bare `return` (with nothing after it) returns them as they are.',
        'This is handy in short functions and doubles as documentation. In long functions, though, a bare `return` makes it hard to see what comes back.',
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
        'As in JavaScript, you can store a function in a variable, pass it as an argument, and return it.',
        'An anonymous function is written `func(x int) int { ... }`. There is no arrow syntax.',
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
        'A **closure** is a function that uses variables from the scope around it. Closures capture the variable itself, not a copy, and keep it alive as long as they need it. That is exactly how JavaScript closures work.',
        {
          code: `func counter() func() int {
    n := 0
    return func() int {
        n++ // the same n every call
        return n
    }
}`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Ignoring the second result', body: '`n := strconv.Atoi("x")` does not compile: the function returns two values and you only took one. Take both, or write `n, _ :=` to show you are ignoring the error on purpose.' },
    { title: 'Missing parentheses around multiple result types', body: '`func f() int, error` is a syntax error. Two or more result types need parentheses: `func f() (int, error)`.' },
    { title: 'Expecting optional parameters', body: 'Every parameter must be passed. If you want options, pass a struct or use a variadic parameter.' },
  ],
  deepDive: {
    q: 'Do multiple results create an array like `return [a, b]` does in JavaScript?',
    body: [
      'No. In JavaScript, `return [a, b]` creates a new array on the **heap** (the memory area for values that the garbage collector cleans up later). The caller then destructures it.',
      'In Go, the results come back in CPU registers (tiny storage slots inside the processor) or on the **stack** (fast memory for each function call, freed as soon as the call returns), the same way a single result does.',
      'So returning `(int, error)` costs about the same as returning one `int`. That is part of why the `value, err` pattern is cheap enough to use everywhere.',
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
    why: 'Each call to `counter` makes a brand new `n`, so `a` and `b` each have their own. `a` is called twice, bringing its `n` to 2. The third call in `Println` makes it `3`. `b` is called once, so it returns `1`. Same as closures in JavaScript.',
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
      { answers: ['int, error'], title: 'Needs parentheses', body: 'Two or more result types must go inside parentheses. Without them it is a syntax error.' },
      { answers: ['int', 'error'], title: 'One result is not enough', body: 'Every `return` here hands back two values, so the signature needs two result types.' },
      { answers: ['(error, int)'], title: 'Wrong order', body: 'The `return` lines give a number first and an error second, so the types must be in that same order. And by convention, the error always goes last.' },
    ],
    hint: 'Look at what each `return` hands back. Write those two types, in that order, inside parentheses.',
  },
  recap: [
    'Types come after names: `func add(a, b int) int`.',
    'A function can return several values. Put the `error` last and check it right away.',
    'No default or optional parameters. Use a struct for options.',
    'Functions are values, and closures capture variables the same way as in JavaScript.',
  ],
}

const deferLesson: LessonContent = {
  id: 'defer',
  minutes: 12,
  lead: 'Every time you open a file or take a lock, you have to remember to close it, on every path out of the function. JavaScript handles this with `try/finally`. Go uses `defer`: you write the cleanup right next to the setup, and Go runs it when the function returns, no matter how it returns.',
  fromTs: {
    title: 'finally, moved to the top',
    intro: 'Opening a file and making sure it gets closed is the classic example. In JavaScript the cleanup sits at the bottom, in `finally`. In Go it sits right under the open.',
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
      ['Runs on return', 'A deferred call runs when the surrounding function returns: a normal return, an early return, or a panic (Go\'s version of an uncaught thrown error).'],
      ['Next to the setup', 'You open and schedule the close on two lines in a row. Add a new `return` later and the close still happens.'],
      ['Last in, first out', 'Several defers run in reverse order, like a stack of plates. The last one you deferred runs first.'],
    ],
  },
  sections: [
    {
      eyebrow: 'How it works',
      title: 'What defer does',
      blocks: [
        { note: '`defer` means "run this call when the function ends", and you write it right where you made the mess.', title: 'In one sentence' },
        'Here is what happens, step by step:',
        {
          list: [
            'When Go reaches a `defer` line, it does not run the call. It adds it to a list for the current function.',
            'The function keeps running as normal.',
            'When the function is about to return, Go runs that list from the last item to the first.',
          ],
          ordered: true,
        },
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
        'The usual pattern has three steps: get a resource, check the error, then defer the release.',
        'Why check the error first? If `os.Open` failed, `f` is `nil` and there is nothing to close.',
        'You\'ll see this pattern with:',
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
        'This is the part that surprises people. The **arguments** of a deferred call are worked out when the `defer` line runs, not later. Only the call itself waits.',
        {
          code: `x := 1
defer fmt.Println("deferred:", x) // x is read now: 1
x = 2
fmt.Println("now:", x)
// now: 2
// deferred: 1`,
        },
        { note: '`defer` is like writing a sticky note: "print 1 at the end". The note holds the value you wrote on it. Changing `x` afterwards does not change the note.', title: 'Think of it like this' },
        'Want the deferred code to see the latest value? Defer a closure instead. A closure reads the variable when it runs, at the end.',
        {
          code: `x := 1
defer func() { fmt.Println("deferred:", x) }()
x = 2
// deferred: 2`,
        },
        { note: 'A deferred closure can also change the function\'s named results. That is how you add context to an error on the way out, or turn a `panic` into an error with `recover`. See [panic and recover](/lesson/panic).' },
      ],
    },
  ],
  pitfalls: [
    { title: 'defer inside a long loop', body: 'Defers run when the **function** returns, not when a loop iteration ends. Open 10,000 files in a loop with `defer f.Close()` and all of them stay open until the function finishes. Move the loop body into its own function, or close each file yourself.' },
    { title: 'Deferring before checking the error', body: 'If you write `defer f.Close()` before `if err != nil`, you may defer a call on a `nil` file. Check the error first, then defer.' },
    { title: 'Expecting the latest value', body: '`defer fmt.Println(x)` reads `x` on that line. If you need the value at return time, use `defer func() { ... }()`.' },
  ],
  predict: {
    code: `for i := 1; i <= 3; i++ {
    defer fmt.Println(i)
}
fmt.Println("done")`,
    options: ['done 1 2 3', 'done 3 2 1', '1 2 3 done', '3 2 1 done'],
    answer: 1,
    why: 'Two rules decide this. First, nothing deferred runs until the function returns, so `"done"` prints first. Second, each `defer` read `i` right away (1, 2, 3), and defers run last in, first out. So they print 3, 2, 1, each on its own line.',
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
    success: '`defer f.Close()` schedules the close for when the function returns. Any `return` you add later is covered automatically.',
    wrong: [
      { answers: ['finally'], title: 'That is TypeScript', body: 'Go has no `try/finally`. The Go keyword schedules a call to run when the function ends.' },
      { answers: ['go'], title: 'That starts a goroutine', body: '`go f.Close()` would close the file right now, in a goroutine (a lightweight background task), while you still need it. You want the close to happen later.' },
      { answers: ['await'], title: 'Go has no await', body: 'Go code waits on its own, so there is no `await`. You need the keyword that delays a call until the function returns.' },
    ],
    hint: 'The keyword is five letters and means "do this later, when the function ends".',
  },
  recap: [
    '`defer` runs a call when the surrounding function returns, even on a panic.',
    'Get the resource, check the error, then defer the release.',
    'Several defers run in reverse order: last in, first out.',
    'Arguments are read at the `defer` line, like a sticky note. Use a closure to see later values.',
  ],
}

const pointers: LessonContent = {
  id: 'pointers',
  minutes: 16,
  lead: 'In JavaScript the language decides for you: numbers and strings are copied, objects are shared. In Go, **everything is copied** by default, even structs (Go\'s fixed-shape objects) and arrays. When you want two places to share one value, you use a **pointer**: a value that holds the memory address (the spot in memory) of another value. Pointers are simpler than they sound, and there is no pointer math.',
  fromTs: {
    title: 'Copied or shared? In Go, you decide',
    intro: 'In JavaScript, passing an object to a function lets the function change it. In Go, passing a struct gives the function a copy. To let it change the original, you pass a pointer.',
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
        { note: 'A pointer is like a home address written on a card. Copying the card is cheap, and everyone holding a copy can visit the same house. `&` writes the card, and `*` walks to the house.', title: 'Think of it like this' },
        'There are only two operators to learn. Here is what each one means:',
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
        'A pointer\'s zero value is `nil`, like `null` in JavaScript.',
        'Following a `nil` pointer crashes the program with "invalid memory address or nil pointer dereference". It is the Go version of "Cannot read properties of null".',
      ],
    },
    {
      eyebrow: 'Structs',
      title: 'Pointers to structs feel like JS objects',
      blocks: [
        'With a pointer to a struct, you do not need to write `(*p).Name`. When you use a dot, Go follows the pointer for you. So `p.Name` works whether `p` is a struct or a pointer to one.',
        {
          code: `u := &User{Name: "Ada"} // pointer to a new User
u.Name = "Grace"          // same as (*u).Name
other := u                // copies the pointer, not the User
other.Name = "Linus"
fmt.Println(u.Name)       // Linus`,
        },
        'This is the closest match to how JavaScript objects behave. Pass pointers around, and everyone sees the same data. Pass plain structs, and everyone gets their own copy.',
        { note: '`new(T)` also gives you a pointer to a zero `T`. In practice `&T{...}` is more common, because you can set fields at the same time.' },
      ],
    },
    {
      eyebrow: 'When to use one',
      title: 'Pointer or value?',
      blocks: [
        { note: 'Use a value by default, and use a pointer when you need to share or change the original.', title: 'In one sentence' },
        'Beginners often use pointers everywhere "for speed". You usually do not need to, because copying a small struct is very cheap. Reach for a pointer when one of these is true:',
        {
          list: [
            'The function must **change** the caller\'s value.',
            'The struct is large, and copying it on every call would waste time.',
            'The value must not be copied, for example a struct holding a `sync.Mutex`.',
            'You need "no value" as an option, and `nil` is a natural way to say it.',
          ],
        },
        'Slices, maps and channels already hold a pointer inside them, so you almost never need a pointer to one of those. More on this in [Methods: value versus pointer receivers](/lesson/methods) and [Stack versus heap](/lesson/escape).',
      ],
    },
  ],
  pitfalls: [
    { title: 'Changing a copy', body: 'If a function takes `u User` and sets `u.Name`, only the copy changes and the caller sees nothing. Take `u *User` and call it with `&u` when you want the change to stick.' },
    { title: 'nil pointer dereference', body: 'A pointer variable you declared but never set is `nil`, and using `p.Name` on it panics. Check `if p != nil` when a pointer might be missing.' },
    { title: 'Returning a pointer to a local is fine', body: 'In C this is a bug. In Go it is normal and safe: `return &User{}` works. When a value needs to outlive the function, the compiler moves it to the heap (memory that stays alive after the function returns).' },
  ],
  deepDive: {
    q: 'If everything is copied, why does changing a slice inside a function sometimes affect the caller?',
    body: [
      'A slice value is a small struct with three fields: a pointer to an array, a length and a capacity. Copying the slice copies those three fields, but both copies still point at the same array.',
      'So `s[0] = 99` inside a function changes the shared array, and the caller sees it. But `s = append(s, 1)` may create a new array, and the caller will not see that. [Arrays versus slices](/lesson/slices) walks through it step by step.',
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
    why: 'Step by step: `double(x)` gets a copy of `x` and doubles the copy, so `x` is still `5`. Then `doubleP(&x)` gets a pointer to `x` and writes through it, so `x` itself becomes `10`.',
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
    success: '`*n = 0` follows the pointer and writes into `x` itself. Remember: `n` is the address card, and `*n` is the house it points to.',
    wrong: [
      { answers: ['n'], title: 'n is the pointer, not the int', body: '`n = 0` tries to store `0` in the pointer variable itself. The compiler says "cannot use 0 (untyped int constant) as *int value". You need to write to the value the pointer points at.' },
      { answers: ['&n'], title: 'That is the address of the pointer', body: '`&n` takes the address of `n`, and you cannot assign to an address. Follow the pointer instead.' },
    ],
    hint: 'Use the operator that follows a pointer to the value it points at.',
  },
  recap: [
    'Go copies everything by default, including structs.',
    '`&x` makes a pointer, `*T` is a pointer type, and `*p` reads or writes the value it points to.',
    'A dot follows pointers for you: `p.Name` works on a `*User`.',
    'Use a value by default. Use a pointer to share or change the original, not for speed.',
  ],
}

export const BASICS: LessonContent[] = [variables, types, control, functions, deferLesson, pointers]
