import type { LessonContent } from './types'

const slices: LessonContent = {
  id: 'slices',
  minutes: 18,
  lead: 'In JavaScript you reach for an array for almost everything. In Go you reach for a **slice**. A slice looks like a JS array. Under the hood it is a small window onto a fixed-size array stored somewhere else. Once you picture that window, the surprising slice behaviour makes sense.',
  fromTs: {
    title: 'Your everyday array, in Go',
    intro: 'Here is a list that grows, gets read, and gets sliced. The Go version uses a slice. The shape is familiar. The main change is that `append` returns a slice, and you must store it.',
    ts: `const nums: number[] = [1, 2, 3];
nums.push(4);

console.log(nums.length); // 4
console.log(nums[0]);     // 1

const firstTwo = nums.slice(0, 2);
console.log(firstTwo);    // [1, 2]`,
    go: `nums := []int{1, 2, 3}
nums = append(nums, 4)

fmt.Println(len(nums)) // 4
fmt.Println(nums[0])   // 1

firstTwo := nums[0:2]
fmt.Println(firstTwo)  // [1 2]`,
    facts: [
      ['`[]int` is a slice', 'No number in the brackets means a slice. That is what you use 99% of the time.'],
      ['`append` returns the result', 'There is no `push`. You write `nums = append(nums, 4)` and store what comes back, a bit like `arr = [...arr, 4]` in JS.'],
      ['`nums[0:2]` shares memory', 'In JS, `.slice()` makes a copy. In Go, `nums[0:2]` does **not** copy. Both slices read and write the same values.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Arrays',
      title: 'Arrays have a fixed size, and you rarely use them',
      blocks: [
        'Go also has real arrays, and they work differently from JS arrays. The size is part of the type: `[3]int` and `[4]int` are different types. An array can never grow. Assigning one to another variable copies every element, as if you had written `[...b]` in JS.',
        {
          code: `var a [3]int        // [0 0 0]
b := [3]int{1, 2, 3}
c := b              // full copy
c[0] = 99
fmt.Println(b, c)   // [1 2 3] [99 2 3]`,
        },
        'Because the size is fixed, arrays are awkward for everyday lists. You will mostly meet them as the hidden storage underneath slices.',
      ],
    },
    {
      eyebrow: 'The slice header',
      title: 'A slice is a pointer, a length and a capacity',
      blocks: [
        'A slice value is tiny. It holds three things: a **pointer** (the memory address of the backing array, where the items live), a **length** (how many items you can see) and a **capacity** (how much room the backing array has from your starting point).',
        {
          code: `s := make([]int, 2, 5)
fmt.Println(len(s), cap(s)) // 2 5

s = append(s, 7)            // fits: no new array
fmt.Println(s, len(s))      // [0 0 7] 3`,
        },
        {
          table: {
            head: ['Expression', 'What it gives you'],
            rows: [
              ['`len(s)`', 'Number of items you can index right now'],
              ['`cap(s)`', 'Room left before `append` must allocate a new array'],
              ['`make([]T, n)`', 'A slice of `n` zero values'],
              ['`make([]T, 0, n)`', 'Empty slice with room for `n` items'],
              ['`s[a:b]`', 'A new window on the **same** array'],
            ],
          },
        },
        'When `append` has room, it writes into the existing array. When it does not, it allocates (reserves memory for) a bigger array, roughly double the size. It copies everything over and returns a slice pointing at the new array. Your old variable still points at the old one. That is why you always assign the result.',
      ],
    },
    {
      eyebrow: 'Sharing',
      title: 'Two slices, one array',
      blocks: [
        'Assigning a slice copies the three-field header. The items stay where they are. So both variables see the same values, the same way two JS variables can point to one array object.',
        {
          compare: {
            ts: `const a = [1, 2, 3];
const b = a;      // same array
b[0] = 9;
console.log(a);   // [9, 2, 3]

const c = a.slice(); // a copy`,
            go: `a := []int{1, 2, 3}
b := a            // same array
b[0] = 9
fmt.Println(a)    // [9 2 3]

c := slices.Clone(a) // a copy`,
          },
        },
        'Sub-slicing is where Go and JS part ways. In JS, `arr.slice(0, 2)` returns a new array. In Go, `a[0:2]` is a window onto the same array. If you need an independent slice, use `slices.Clone` or `copy`.',
        {
          code: `src := []int{1, 2, 3}
dst := make([]int, len(src))
n := copy(dst, src) // copies min(len) items
fmt.Println(n, dst) // 3 [1 2 3]`,
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Forgetting to keep the result of append', body: '`append(s, x)` does not change the `s` variable you already have. If it had to grow, the new items live in a new array that only the returned slice knows about. Always write `s = append(s, x)`.' },
    { title: 'append writing into someone else\'s slice', body: 'If `b := a[:2]` and `a` has spare capacity, then `append(b, 99)` overwrites `a[2]`. The two slices share a backing array. Use `slices.Clone` when you want to grow a sub-slice safely.' },
    { title: 'Index out of range is a crash', body: 'In JS, reading past the end returns `undefined`. In Go, reading `s[10]` on a 3-item slice **panics** (stops the program, like an uncaught exception) with "index out of range". Check `len(s)` first.' },
  ],
  note: '`nil` is Go\'s version of `null`. A `nil` slice is safe to use: `len` is 0, `range` does nothing, and `append` works on it. You do not need to initialise a slice before appending to it.',
  deepDive: {
    q: 'How much does append grow the array?',
    body: [
      'For small slices the runtime roughly doubles the capacity. For large slices (above about 256 items) it grows by smaller steps, so it does not waste too much memory.',
      'If you already know how many items you will add, pre-size with `make([]T, 0, n)`. That avoids repeated allocations and copies. We look inside the slice header in [Inside a slice, a map, a channel](/lesson/internals).',
    ],
  },
  predict: {
    code: `a := []int{1, 2, 3}
b := a
b[0] = 9
c := append(a, 4)
c[1] = 7
fmt.Println(a, len(c))`,
    options: ['[1 2 3] 4', '[9 2 3] 4', '[9 7 3] 4', '[9 7 3 4] 4'],
    answer: 1,
    why: '`b := a` shares the array, so `b[0] = 9` changes `a`. But `a` is full (len 3, cap 3), so `append` allocates a **new** array for `c`. Changing `c[1]` does not touch `a`.',
    trace: [
      ['line 1', 'a: len 3, cap 3, array [1 2 3]', 'idle'],
      ['line 2', 'b copies the header: same array', 'run'],
      ['line 3', 'b[0] = 9   array is now [9 2 3]', 'run'],
      ['line 4', 'no room: append copies to a new array', 'runtime'],
      ['line 5', 'c[1] = 7 changes only the new array', 'run'],
      ['output', '[9 2 3] 4', 'out'],
    ],
  },
  challenge: {
    title: 'Make b a real copy',
    prompt: 'Changing `b` should leave `a` alone, so this must print `1 99`. Fill in the built-in function that copies items from one slice into another.',
    code: `a := []int{1, 2, 3}
b := make([]int, len(a))
___(b, a)
b[0] = 99
fmt.Println(a[0], b[0])`,
    answers: ['copy'],
    success: '`copy(dst, src)` copies items into an existing slice and returns how many it copied. `b` has its own array, so changing it leaves `a` alone. `slices.Clone(a)` does the same in one step.',
    wrong: [
      { answers: ['append'], title: 'append adds, it does not copy into', body: '`append(b, a)` does not compile: it expects single ints, and its result must be used. `append(b, a...)` would add 3 more items after the existing zeros.' },
      { answers: ['slices.Clone', 'clone'], title: 'Right idea, wrong shape', body: '`slices.Clone(a)` returns a new slice, so it would be `b := slices.Clone(a)`. Here `b` already exists, and you need the built-in that fills it.' },
    ],
    hint: 'The built-in is named after what it does, and its arguments are destination first, then source.',
  },
  recap: [
    'Use slices (`[]T`), not arrays (`[N]T`), for everyday lists.',
    'A slice is a pointer, a length and a capacity. Copying a slice shares the items.',
    'Always write `s = append(s, x)`.',
    'Sub-slicing shares memory. Use `copy` or `slices.Clone` for an independent copy.',
  ],
}

const maps: LessonContent = {
  id: 'maps',
  minutes: 12,
  lead: 'A Go map is what you use where JavaScript code uses a `Map` or a plain object as a dictionary. It is built into the language. All keys share one type, and all values share one type. A missing key gives you a zero value (`0`, `""`, `false`) instead of `undefined`.',
  fromTs: {
    title: 'A dictionary in both languages',
    intro: 'Here is a small lookup table: set a key, read a key, check if a key exists, delete one, and loop over all of them.',
    ts: `const ages = new Map<string, number>();
ages.set("ann", 31);

console.log(ages.get("ann"));  // 31
console.log(ages.has("bob"));  // false
ages.delete("ann");

for (const [name, age] of ages) {
  console.log(name, age);
}`,
    go: `ages := map[string]int{}
ages["ann"] = 31

fmt.Println(ages["ann"])  // 31
_, ok := ages["bob"]
fmt.Println(ok)           // false
delete(ages, "ann")

for name, age := range ages {
    fmt.Println(name, age)
}`,
    facts: [
      ['`map[K]V` is a type', 'Key type in the brackets, value type after: `map[string]int` maps strings to numbers. You read and write with `[]`, like an object.'],
      ['Missing keys give zero', 'Reading a key that is not there returns the zero value: `0`, `""`, `false`, or `nil`. Never `undefined`.'],
      ['Order is random', 'A JS `Map` keeps insertion order. A Go map does not: looping visits keys in a different order each run. Go does this on purpose.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Comma ok',
      title: 'Was the key there, or is the value just zero?',
      blocks: [
        'Since a missing key returns zero, `ages["bob"]` returning `0` could mean "Bob is 0" or "no Bob". To tell them apart, read with two variables. The second one is a `bool` that is `true` only when the key exists.',
        {
          code: `age, ok := ages["bob"]
if !ok {
    fmt.Println("no bob")
}

// Common short form:
if age, ok := ages["ann"]; ok {
    fmt.Println("ann is", age)
}`,
        },
        'You will see this "comma ok" pattern again with type assertions and channel receives. The second value always answers "did this really work?"',
      ],
    },
    {
      eyebrow: 'Zero values help',
      title: 'Counting without checking first',
      blocks: [
        'In JS you often write `counts[w] = (counts[w] ?? 0) + 1`. In Go a missing key already reads as `0`, so you can add to it directly.',
        {
          compare: {
            ts: `const counts: Record<string, number> = {};
for (const w of words) {
  counts[w] = (counts[w] ?? 0) + 1;
}`,
            go: `counts := map[string]int{}
for _, w := range words {
    counts[w]++
}`,
          },
        },
        'The same trick works for slices: `groups[k] = append(groups[k], v)` works even when `groups[k]` was never set, because a missing slice reads as `nil`, and `append` works on `nil`.',
      ],
    },
    {
      eyebrow: 'Rules',
      title: 'What can be a key, and how to make a map',
      blocks: [
        {
          table: {
            head: ['Thing', 'Allowed?'],
            rows: [
              ['`string`, `int`, `bool`, pointers', 'Yes'],
              ['Structs made of comparable fields', 'Yes, compared field by field'],
              ['Slices, maps, functions', 'No, they cannot be compared with `==`'],
            ],
          },
        },
        {
          code: `m1 := map[string]int{}           // empty, ready
m2 := make(map[string]int, 100)  // with size hint
var m3 map[string]int            // nil: read OK,
                                 // write panics`,
        },
        'A struct key replaces the JS habit of gluing values into a string key like "3,4". Use `map[Point]bool` with `type Point struct{ X, Y int }`. Two points with the same X and Y count as the same key.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Writing to a nil map panics', body: '`var m map[string]int` declares a map variable but does not create the map, so it is `nil`. Reading from it is fine (you get zeros). Writing crashes with "assignment to entry in nil map". Create it with `make` or `{}` first.' },
    { title: 'Depending on iteration order', body: 'Do not write tests that expect keys in a certain order. If you need order, collect the keys into a slice and sort it with `slices.Sorted(maps.Keys(m))`.' },
    { title: 'Maps are not safe across goroutines', body: 'Goroutines are functions running at the same time. Reading and writing the same map from two goroutines at once can crash the program with "concurrent map writes" or "concurrent map read and map write". Protect it with a mutex (a lock that lets one goroutine in at a time). See [sync](/lesson/sync).' },
  ],
  note: 'Like slices, a map variable refers to shared data, the way a JS variable refers to an object. Passing a map to a function lets that function change your map.',
  predict: {
    code: `ages := map[string]int{"ann": 31}
fmt.Println(ages["bob"])
v, ok := ages["bob"]
fmt.Println(v, ok)`,
    options: ['undefined, then undefined false', '0, then 0 false', 'panic: key not found', '0, then 0 true'],
    answer: 1,
    why: 'A missing key reads as the zero value of the value type, so `int` gives `0`. Nothing crashes. The `ok` value is `false` because "bob" is not actually in the map.',
    trace: [
      ['line 1', 'map with one key: "ann"', 'idle'],
      ['line 2', 'ages["bob"]: not found, zero value 0', 'run'],
      ['line 3', 'comma ok: v = 0, ok = false', 'run'],
      ['output', '0', 'out'],
      ['output', '0 false', 'out'],
    ],
  },
  challenge: {
    title: 'Count the words',
    prompt: 'This should print `2 1`. Fill in the blank so each word adds one to its count. You do not need to check if the key exists first.',
    code: `words := []string{"go", "ts", "go"}
count := map[string]int{}
for _, w := range words {
    count[w]___
}
fmt.Println(count["go"], count["ts"])`,
    answers: ['++', '+= 1', '+=1'],
    success: 'A missing key reads as `0`, so `count[w]++` turns it into `1` the first time and keeps adding after that. No `?? 0` needed.',
    wrong: [
      { answers: ['= 1', '=1'], title: 'That overwrites the count', body: 'Every word would be set to 1, so this prints `1 1`. You want to add to whatever is already there.' },
      { answers: ['+ 1', '+1'], title: 'That is an expression, not a statement', body: '`count[w] + 1` computes a value and throws it away. Go reports "is not used". Use `++` or `+= 1`.' },
    ],
    hint: 'Go has an increment statement that works directly on a map entry.',
  },
  recap: [
    '`map[K]V` is Go\'s dictionary. Create it with `{}` or `make` before writing.',
    'Missing keys read as the zero value. Use `v, ok := m[k]` to know if the key exists.',
    'Iteration order is random. Sort the keys if order matters.',
    'Maps are shared references and need a lock when used from several goroutines.',
  ],
}

const strings: LessonContent = {
  id: 'strings',
  minutes: 14,
  lead: 'A JavaScript string is a sequence of UTF-16 code units. A Go string is a sequence of **bytes** (a byte is a number from 0 to 255), usually holding UTF-8 text. For plain English the two feel the same. Once you meet an accent or an emoji, they behave differently. This lesson shows you how to handle that.',
  fromTs: {
    title: 'Length and indexing are about bytes',
    intro: 'Same word, same operations. Watch what `len` and indexing return in Go.',
    ts: `const s = "héllo";
console.log(s.length);  // 5
console.log(s[1]);      // "é"

for (const ch of s) {
  console.log(ch);
}`,
    go: `s := "héllo"
fmt.Println(len(s))  // 6 (bytes!)
fmt.Println(s[1])    // 195 (a byte)

for _, r := range s {
    fmt.Println(string(r))
}`,
    facts: [
      ['A string is bytes', '`len(s)` counts bytes. "é" takes 2 bytes in UTF-8, so "héllo" has length 6.'],
      ['Indexing gives a byte', 'In JS, `s[1]` is a one-letter string. In Go, `s[1]` is a `byte`, which is a number.'],
      ['`range` gives runes', 'A `for range` loop decodes UTF-8 and gives you each character as a `rune` (a number for one Unicode character), much like `for...of` on a JS string.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Three types',
      title: 'string, byte and rune',
      blocks: [
        {
          table: {
            head: ['Type', 'What it is', 'Example'],
            rows: [
              ['`string`', 'Read-only bytes, usually UTF-8', '`"héllo"`'],
              ['`byte`', 'Another name for `uint8` (an unsigned 8-bit number), one byte', '`s[0]` is `104`'],
              ['`rune`', 'Another name for `int32`, one Unicode code point', '`\'é\'` is `233`'],
            ],
          },
        },
        'In JS, single and double quotes both make strings. In Go, single quotes make a **rune**. `\'a\'` is the number 97. Double quotes make a string. Backticks make a raw string where `\\n` stays as two characters, and there is no `${}` interpolation.',
        {
          code: `r := 'é'                 // rune, 233
fmt.Println(r, string(r)) // 233 é

b := []byte("hi")        // [104 105]
rs := []rune("héllo")    // 5 runes
fmt.Println(len(rs))     // 5`,
        },
      ],
    },
    {
      eyebrow: 'Looping',
      title: 'range walks characters, indexing walks bytes',
      blocks: [
        'When you `range` over a string, the index is the **byte position** where each character starts. That is why it can jump by more than one.',
        {
          code: `for i, r := range "hé!" {
    fmt.Println(i, string(r))
}
// 0 h
// 1 é
// 3 !   <- é used bytes 1 and 2`,
        },
        'If you need "the third character", convert to `[]rune` first. If you are parsing ASCII-only formats like HTTP headers, working with bytes directly is fast and fine.',
      ],
    },
    {
      eyebrow: 'Building strings',
      title: 'Strings are immutable, so build them smartly',
      blocks: [
        'Like in JS, you cannot change a string in place. `s[0] = \'H\'` does not compile. Using `+=` in a loop copies the whole string each time. To build a long string, use `strings.Builder`. It grows one buffer, much like pushing parts into an array and calling `join` at the end.',
        {
          compare: {
            ts: `const parts: string[] = [];
for (const n of names) {
  parts.push(n.toUpperCase());
}
const out = parts.join(", ");`,
            go: `var sb strings.Builder
for i, n := range names {
    if i > 0 {
        sb.WriteString(", ")
    }
    sb.WriteString(strings.ToUpper(n))
}
out := sb.String()`,
          },
        },
        {
          list: [
            '`strings.Split`, `strings.Join`, `strings.Contains`, `strings.TrimSpace`: the string methods you know from JS, as package functions.',
            '`strconv.Itoa(42)` and `strconv.Atoi("42")` convert between numbers and text.',
            '`fmt.Sprintf("%s is %d", name, age)` fills in placeholders. It is Go\'s answer to template literals.',
          ],
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Using len for "number of characters"', body: '`len("héllo")` is 6. For characters, use `utf8.RuneCountInString(s)` or `len([]rune(s))`.' },
    { title: 'string(65) is not "65"', body: 'Converting an integer with `string(n)` gives the character with that code, like `String.fromCharCode(65)` in JS, so `string(65)` is "A". `go vet` warns about it. Use `strconv.Itoa(n)` to get "65".' },
    { title: 'Slicing in the middle of a character', body: '`s[0:2]` on "héllo" gives "h" plus half of "é", which prints as a broken character. Slice on rune boundaries when text may not be plain ASCII.' },
  ],
  deepDive: {
    q: 'Why are Go strings bytes and not UTF-16 like JavaScript?',
    body: [
      'Go was designed by people who also designed UTF-8 (Rob Pike and Ken Thompson). UTF-8 is what files, network protocols and most of the web use, so a Go string can hold data straight from a socket with no conversion.',
      'A string value is a small header: a pointer to the bytes (their memory address) and a length. Slicing a string makes a new header pointing into the same bytes, so `s[2:5]` is cheap.',
    ],
  },
  predict: {
    code: `s := "héllo"
fmt.Println(len(s), s[1])`,
    options: ['5 é', '6 195', '5 233', '6 é'],
    answer: 1,
    why: '"é" is 2 bytes in UTF-8 (195 and 169), so the string has 6 bytes. `s[1]` is the first byte of "é", which prints as the number 195. It is not a character and it is not the code point 233.',
    trace: [
      ['line 1', 'bytes: 104 195 169 108 108 111', 'idle'],
      ['len(s)', '6 bytes', 'run'],
      ['s[1]', 'byte at index 1: 195', 'run'],
      ['output', '6 195', 'out'],
    ],
  },
  challenge: {
    title: 'Count the characters, not the bytes',
    prompt: 'This should print `5`, the number of characters in "héllo". Fill in the conversion.',
    code: `s := "héllo"
fmt.Println(len(___(s)))`,
    answers: ['[]rune'],
    success: 'Converting to `[]rune` decodes the UTF-8 into one item per character, so `len` gives 5. For a count without making a slice, `utf8.RuneCountInString(s)` does the same.',
    wrong: [
      { answers: ['[]byte'], title: 'Still bytes', body: '`[]byte(s)` gives the raw bytes, so `len` is still 6.' },
      { answers: ['string'], title: 'Already a string', body: '`string(s)` changes nothing, so `len` is still 6. You need a slice of characters.' },
    ],
    hint: 'Convert to a slice of the type that holds one Unicode code point.',
  },
  recap: [
    'A Go string is read-only bytes, usually UTF-8.',
    '`len(s)` and `s[i]` work on bytes. `range` gives runes.',
    'A `rune` is one Unicode code point. Single quotes make a rune.',
    'Build big strings with `strings.Builder`, and convert numbers with `strconv`.',
  ],
}

const structs: LessonContent = {
  id: 'structs',
  minutes: 16,
  lead: 'Go has no classes. Data lives in **structs**: named groups of fields, where each field has a fixed type. Picture a JS object whose keys are declared up front and can never be added or removed. Instead of `extends`, Go lets you **embed** one struct in another and reuse its fields and methods.',
  fromTs: {
    title: 'An object type becomes a struct',
    intro: 'Here is a user type and a value of that type. In Go you declare the struct once, then create values with a struct literal. It looks like an object literal with the type name in front.',
    ts: `type User = {
  name: string;
  age: number;
  admin?: boolean;
};

const u: User = { name: "Ann", age: 31 };
u.age++;
console.log(u.name, u.age);`,
    go: `type User struct {
    Name  string
    Age   int
    Admin bool
}

u := User{Name: "Ann", Age: 31}
u.Age++
fmt.Println(u.Name, u.Age)`,
    facts: [
      ['No optional fields', 'Fields you leave out get their zero value. `Admin` is `false`, never `undefined`.'],
      ['Capital letter = public', '`Name` is visible to other packages, a bit like a named `export`. `name` would be private to this package.'],
      ['Assignment copies', '`v := u` copies every field, like `{ ...u }` in JS. The two values are then independent.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Values, not references',
      title: 'Assigning a struct makes a copy',
      blocks: [
        'This is the biggest change from JS. In JS, objects are always shared by reference. In Go, a struct is a **value**, like a number. Assigning it or passing it to a function copies all the fields.',
        {
          compare: {
            ts: `const p = { x: 1, y: 2 };
const q = p;   // same object
q.x = 10;
console.log(p.x); // 10`,
            go: `p := Point{X: 1, Y: 2}
q := p         // a copy
q.X = 10
fmt.Println(p.X) // 1`,
          },
        },
        'When you want sharing, take a pointer: `q := &p`. A pointer holds the memory address of `p`, so `q.X = 10` changes `p`. You write `q.X` the same way for a pointer and a value. See [Pointers](/lesson/pointers).',
        'Structs can be compared with `==` if all their fields can. In JS, `==` on two objects checks whether they are the same object. In Go, two `Point` values are equal when every field is equal. That makes structs handy as map keys.',
      ],
    },
    {
      eyebrow: 'Constructors',
      title: 'No constructor keyword, just functions',
      blocks: [
        'Go has no `constructor` and no `new MyClass()`. By convention you write a plain function named `NewThing` that returns a ready-to-use value, usually a pointer (`*Server`).',
        {
          code: `type Server struct {
    Addr    string
    Timeout time.Duration
}

func NewServer(addr string) *Server {
    return &Server{Addr: addr, Timeout: 30 * time.Second}
}`,
        },
        { note: 'Many Go types are designed so their zero value is already useful, like `sync.Mutex` or `bytes.Buffer`. For those you need no constructor: `var mu sync.Mutex` is ready to use.' },
      ],
    },
    {
      eyebrow: 'Embedding',
      title: 'Composition instead of extends',
      blocks: [
        'Put a type name inside a struct with no field name, and you **embed** it. The inner fields and methods are "promoted" to the outer struct, so you can use them directly, as if they were declared there.',
        {
          code: `type Animal struct{ Name string }

func (a Animal) Hello() string {
    return "hi, " + a.Name
}

type Dog struct {
    Animal        // embedded, no field name
    Breed string
}

d := Dog{Animal{"Rex"}, "lab"}
fmt.Println(d.Hello()) // hi, Rex
fmt.Println(d.Name)    // Rex`,
        },
        'This looks like inheritance, but it is composition. A `Dog` is not an `Animal`: you cannot pass a `Dog` where an `Animal` is expected. The `Dog` **has** an `Animal` inside, and Go writes the forwarding code for you. To share behaviour across types, use [interfaces](/lesson/interfaces).',
      ],
    },
  ],
  pitfalls: [
    { title: 'Expecting changes to show up after passing a struct', body: 'In JS, a function receives the same object you passed. In Go, a function that takes `u User` gets a copy. Changing `u.Age` inside does nothing for the caller. Take `*User` (a pointer) if the function should modify it.' },
    { title: 'Lowercase fields disappear in JSON', body: '`encoding/json` (Go\'s `JSON.stringify` and `JSON.parse`) only sees exported (capitalised) fields. A field named `name` is silently skipped. See [JSON and struct tags](/lesson/json).' },
    { title: 'Treating embedding as inheritance', body: 'There is no `super`, no overriding with dynamic dispatch, and no "is-a" relationship. If `Dog` defines its own `Hello`, it hides `Animal.Hello`, but `Animal` methods still call `Animal` code.' },
  ],
  predict: {
    code: `type Point struct{ X, Y int }

p := Point{1, 2}
q := p
q.X = 10
fmt.Println(p.X, q.X)`,
    options: ['10 10', '1 10', '1 1', 'It does not compile'],
    answer: 1,
    why: '`q := p` copies the whole struct. `q` is a separate value, so changing `q.X` leaves `p.X` at 1. In JS the answer would be "10 10", because objects are shared.',
    trace: [
      ['line 3', 'p = {X: 1, Y: 2}', 'idle'],
      ['line 4', 'q is a full copy of p', 'run'],
      ['line 5', 'q.X = 10, p untouched', 'run'],
      ['output', '1 10', 'out'],
    ],
  },
  challenge: {
    title: 'Embed Animal in Dog',
    prompt: 'This should print `hi, Rex`. Fill in the line inside `Dog` so it gets `Animal`\'s field and method.',
    code: `type Animal struct{ Name string }

func (a Animal) Hello() string {
    return "hi, " + a.Name
}

type Dog struct {
    ___
    Breed string
}

d := Dog{Animal{"Rex"}, "lab"}
fmt.Println(d.Hello())`,
    answers: ['Animal'],
    success: 'Writing just the type name embeds it. `Dog` now has `Name` and `Hello` promoted, so `d.Hello()` works directly.',
    wrong: [
      { answers: ['a Animal', 'animal Animal', 'Animal Animal'], title: 'That is a named field', body: 'With a field name, `Animal` is a normal field, so you would need `d.a.Hello()`. `d.Hello()` does not compile. Leave the name off.' },
      { answers: ['extends Animal'], title: 'That is TypeScript', body: 'Go has no `extends`. Put the type name on its own line inside the struct.' },
    ],
    hint: 'Embedding is a field with a type but no name.',
  },
  recap: [
    'A struct is a typed group of fields. Missing fields get zero values.',
    'Structs are values: assigning or passing them copies. Use a pointer to share.',
    'Use `NewThing` functions as constructors, or make the zero value useful.',
    'Embedding promotes fields and methods. It is composition, not inheritance.',
  ],
}

const methods: LessonContent = {
  id: 'methods',
  minutes: 15,
  lead: 'In JavaScript, methods live inside a class and use `this`. In Go, you write methods outside the struct and give the **receiver** a name yourself. The receiver is the value the method is called on, Go\'s version of `this`. The main decision is whether the receiver is a value or a pointer. That choice decides whether the method can change anything.',
  fromTs: {
    title: 'A class method becomes a function with a receiver',
    intro: 'Here is a counter with a method that changes it and one that reads it. In Go the receiver `(c *Counter)` goes before the method name.',
    ts: `class Counter {
  n = 0;

  inc() {
    this.n++;
  }

  value(): number {
    return this.n;
  }
}`,
    go: `type Counter struct {
    n int
}

func (c *Counter) Inc() {
    c.n++
}

func (c Counter) Value() int {
    return c.n
}`,
    facts: [
      ['The receiver is a parameter', '`c` is a normal named parameter. There is no `this`, so a method never loses its binding when you pass it around.'],
      ['`*Counter` can change it', 'A pointer receiver holds the address of the original struct, so changes stick.'],
      ['`Counter` gets a copy', 'A value receiver works on a copy. Good for read-only methods on small types.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Value vs pointer',
      title: 'Which receiver should I use?',
      blocks: [
        'Calling a method with a value receiver copies the struct, just like passing it to a function. Any change happens to the copy and is lost.',
        {
          code: `func (c Counter) IncVal()  { c.n++ } // copy
func (c *Counter) IncPtr() { c.n++ } // original

c := Counter{}
c.IncVal()
c.IncPtr()
fmt.Println(c.n) // 1`,
        },
        {
          table: {
            head: ['Use a pointer receiver when...', 'A value receiver is fine when...'],
            rows: [
              ['the method changes the struct', 'the method only reads'],
              ['the struct is large (avoid copying)', 'the type is small, like a `Point` or `time.Time`'],
              ['the struct holds a `sync.Mutex`', 'the value should act like a number'],
            ],
          },
        },
        'A common rule: if any method needs a pointer receiver, make them **all** pointer receivers, so the type behaves consistently.',
      ],
    },
    {
      eyebrow: 'Auto & and *',
      title: 'Go adds the & for you',
      blocks: [
        'You do not need to write `(&c).Inc()`. If `c` is a variable (Go calls this addressable), Go takes its address for you. It also follows a pointer to the value (dereferences it) to call value methods.',
        {
          code: `c := Counter{}   // a value
c.Inc()          // Go calls (&c).Inc()

p := &Counter{}  // a pointer
fmt.Println(p.Value()) // Go calls (*p).Value()`,
        },
        { pitfall: 'The automatic `&` only works on variables. `Counter{}.Inc()` does not compile, because a temporary value has no address. Interfaces follow the same rule: only `*Counter` has the `Inc` method in its method set (the list of methods a type has).', title: 'Where the magic stops' },
      ],
    },
    {
      eyebrow: 'Any named type',
      title: 'Methods are not only for structs',
      blocks: [
        'You can add methods to any type you define in your package, even one based on `int` or a slice. This lets plain values carry readable behaviour, like `Celsius(100).F()` below.',
        {
          code: `type Celsius float64

func (c Celsius) F() float64 {
    return float64(c)*9/5 + 32
}

fmt.Println(Celsius(100).F()) // 212`,
        },
        'You cannot add methods to built-in types like `string`, or to types from other packages like `time.Time`. There is no Go version of patching `String.prototype`. Define your own named type instead.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Value receiver that "does nothing"', body: 'A setter like `func (u User) SetName(n string) { u.Name = n }` compiles and runs, but changes a copy. The caller never sees it. Use `*User`.' },
    { title: 'Mixing receivers and interfaces', body: 'If `Inc` has a pointer receiver, then a `Counter` value does not satisfy an interface that needs `Inc`; only `*Counter` does. The error says "method Inc has pointer receiver". More in [Interfaces](/lesson/interfaces).' },
    { title: 'Copying a struct with a mutex', body: 'A value receiver copies the struct, including any `sync.Mutex` (a lock) inside. The copy has its own lock, so nothing is protected. `go vet` flags this as "passes lock by value".' },
  ],
  note: 'A method value like `f := c.Inc` remembers its receiver. You can pass `c.Inc` as a callback with no `.bind(this)`.',
  predict: {
    code: `type Counter struct{ n int }

func (c Counter) IncVal()  { c.n++ }
func (c *Counter) IncPtr() { c.n++ }

c := Counter{}
c.IncVal()
c.IncVal()
c.IncPtr()
fmt.Println(c.n)`,
    options: ['0', '1', '2', '3'],
    answer: 1,
    why: 'The two `IncVal` calls each change a copy of `c`, so they have no effect. Only `IncPtr` works on the original. The answer is 1.',
    trace: [
      ['line 6', 'c.n = 0', 'idle'],
      ['line 7', 'IncVal: copy.n = 1, copy thrown away', 'wait'],
      ['line 8', 'IncVal: copy.n = 1, copy thrown away', 'wait'],
      ['line 9', 'IncPtr: c.n = 1', 'run'],
      ['output', '1', 'out'],
    ],
  },
  challenge: {
    title: 'Make Inc actually count',
    prompt: 'This prints `0` right now. Fill in the receiver type so it prints `2`.',
    code: `type Counter struct{ n int }

func (c ___) Inc() { c.n++ }

c := Counter{}
c.Inc()
c.Inc()
fmt.Println(c.n)`,
    answers: ['*Counter'],
    success: 'With `*Counter`, the method gets a pointer to the original `c`. Go adds the `&` at the call site for you, so `c.Inc()` still reads naturally.',
    wrong: [
      { answers: ['Counter'], title: 'That is the value receiver', body: 'With `Counter` each call changes a copy, so this still prints `0`.' },
      { answers: ['&Counter'], title: 'Close, wrong symbol', body: '`&` takes an address of a value. In a type, a pointer is written with `*`.' },
    ],
    hint: 'The method needs a pointer to the struct, not a copy of it.',
  },
  recap: [
    'Methods are functions with a receiver written before the name.',
    'Pointer receivers can change the struct. Value receivers get a copy.',
    'If one method needs a pointer receiver, use pointer receivers for all of them.',
    'Go adds `&` and `*` for you when calling methods on variables.',
  ],
}

export const DATA: LessonContent[] = [slices, maps, strings, structs, methods]
