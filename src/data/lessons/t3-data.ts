import type { LessonContent } from './types'

const slices: LessonContent = {
  id: 'slices',
  minutes: 18,
  lead: 'In JavaScript you reach for an array for almost every list. In Go you reach for a **slice**. On the surface a slice looks like a JS array. Underneath, it is a small window onto a fixed-size array stored somewhere else. Picture that window and every "weird" slice behaviour in this lesson starts to make sense.',
  fromTs: {
    title: 'Your everyday array, in Go',
    intro: 'Here is a list that grows, gets read, and gets sliced. The shape is familiar. The one change to watch: `append` gives you back a slice, and you have to store it.',
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
      ['`[]int` is a slice', 'Empty brackets mean a slice. That is what you will use 99% of the time.'],
      ['`append` returns the result', 'There is no `push`. You write `nums = append(nums, 4)` and keep what comes back, a bit like `arr = [...arr, 4]` in JS.'],
      ['`nums[0:2]` shares memory', 'In JS, `.slice()` makes a copy. In Go, `nums[0:2]` does **not** copy. Both slices read and write the same items.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Arrays',
      title: 'Arrays have a fixed size, and you rarely use them',
      blocks: [
        { note: 'A Go array is a fixed-size box of values, and copying it copies every value.', title: 'In one sentence' },
        'Go also has real arrays, and they are not like JS arrays. The size is part of the type: `[3]int` and `[4]int` are two different types. An array can never grow.',
        'Assigning an array to another variable copies every element, as if you had written `[...b]` in JS:',
        {
          code: `var a [3]int        // [0 0 0]
b := [3]int{1, 2, 3}
c := b              // full copy
c[0] = 99
fmt.Println(b, c)   // [1 2 3] [99 2 3]`,
        },
        'You might wonder why you would ever use one. Mostly you won\'t. A fixed size is awkward for everyday lists. You will meet arrays as the hidden storage underneath slices.',
      ],
    },
    {
      eyebrow: 'The slice header',
      title: 'A slice is a pointer, a length and a capacity',
      blocks: [
        { note: 'A slice is a tiny label that says "start here, I can see this many items, and there is room for this many".', title: 'In one sentence' },
        'A slice value holds just three things:',
        {
          list: [
            'a **pointer**: the memory address of the backing array, where the items actually live',
            'a **length**: how many items you can see and index right now',
            'a **capacity**: how much room the backing array has, counting from where your slice starts',
          ],
        },
        { note: 'Picture a long bookshelf (the backing array). A slice is a sticky note that says "start at shelf 0, I own 2 books, and there are 5 spaces before the shelf ends". Adding a book fills the next empty space. When the shelf is full, Go buys a bigger shelf and moves every book over.', title: 'Think of it like this' },
        'Here it is in code. `make([]int, 2, 5)` asks for length 2 and capacity 5:',
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
        'So what does `append` actually do? Step by step:',
        {
          list: [
            'If there is spare capacity, it writes the new item into the existing array.',
            'If there is no room, it allocates (reserves memory for) a bigger array, roughly double the size.',
            'It copies every old item into the new array.',
            'It returns a slice pointing at whichever array now holds the items.',
          ],
          ordered: true,
        },
        'Your old variable still points at the old array. That is why you always write `s = append(s, x)`.',
      ],
    },
    {
      eyebrow: 'Sharing',
      title: 'Two slices, one array',
      blocks: [
        { note: 'Copying a slice copies the sticky note, not the books.', title: 'In one sentence' },
        'Assigning a slice copies its three-field header. The items stay where they are. So both variables see the same values, the same way two JS variables can point at one array object:',
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
        'Sub-slicing is where Go and JS part ways. In JS, `arr.slice(0, 2)` returns a brand-new array. In Go, `a[0:2]` is another window onto the same array.',
        'When you need an independent slice, use `slices.Clone` or the built-in `copy`:',
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
    { title: 'append writing into someone else\'s slice', body: 'Say `b := a[:2]` and `a` has spare capacity. Then `append(b, 99)` writes into the spare spot, which is `a[2]`. The two slices share one backing array. Use `slices.Clone` when you want to grow a sub-slice safely.' },
    { title: 'Index out of range is a crash', body: 'In JS, reading past the end gives `undefined`. In Go, reading `s[10]` on a 3-item slice **panics** (stops the program, like an uncaught exception) with "index out of range". Check `len(s)` first.' },
  ],
  note: '`nil` is Go\'s version of `null`. A `nil` slice is safe to use: `len` is 0, `range` does nothing, and `append` works on it. You do not need to create a slice before appending to it.',
  deepDive: {
    q: 'How much does append grow the array?',
    body: [
      'For small slices the runtime (the code Go bundles into your program to manage memory and goroutines) roughly doubles the capacity. Above about 256 items it grows by smaller steps, so it does not waste too much memory.',
      'If you already know how many items you will add, pre-size with `make([]T, 0, n)`. That skips the repeated allocate-and-copy steps. We look inside the slice header in [Inside a slice, a map, a channel](/lesson/internals).',
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
    why: 'Two rules decide this. First, `b := a` copies only the header, so `b[0] = 9` changes the array `a` sees too. Second, `a` is full (len 3, cap 3), so `append` has no room and builds a **new** array for `c`. From then on `c` has its own items, and `c[1] = 7` never touches `a`.',
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
    prompt: 'Changing `b` should leave `a` alone, so this must print `1 99`. `b` already has its own array of the right size. Fill in the built-in function that copies items from one slice into another.',
    code: `a := []int{1, 2, 3}
b := make([]int, len(a))
___(b, a)
b[0] = 99
fmt.Println(a[0], b[0])`,
    answers: ['copy'],
    success: '`copy(dst, src)` copies items into a slice that already exists and returns how many it copied. Because `make` gave `b` its own array, changing `b[0]` leaves `a` alone. `slices.Clone(a)` does the make-and-copy in one step.',
    wrong: [
      { answers: ['append'], title: 'append adds, it does not copy into', body: '`append(b, a)` does not compile: it expects single ints, and its result must be used. Even `append(b, a...)` would add 3 more items after the existing zeros instead of filling them.' },
      { answers: ['slices.Clone', 'clone'], title: 'Right idea, wrong shape', body: '`slices.Clone(a)` returns a new slice, so you would write `b := slices.Clone(a)`. Here `b` already exists, and you need the built-in that fills it.' },
    ],
    hint: 'The built-in is named after what it does. Its arguments are destination first, then source.',
  },
  recap: [
    'Use slices (`[]T`), not arrays (`[N]T`), for everyday lists.',
    'A slice is a pointer, a length and a capacity. Copying a slice copies the label, not the items.',
    'Always write `s = append(s, x)`, because a full slice moves to a new array.',
    'Sub-slicing shares memory. Use `copy` or `slices.Clone` for an independent copy.',
  ],
}

const maps: LessonContent = {
  id: 'maps',
  minutes: 12,
  lead: 'Whenever JavaScript code uses a `Map`, or a plain object as a dictionary, Go code uses a **map**. It is built into the language, not a class you import. Every key has the same type, and every value has the same type. And a missing key gives you a zero value (`0`, `""`, `false`) instead of `undefined`.',
  fromTs: {
    title: 'A dictionary in both languages',
    intro: 'Here is a small lookup table doing the five things you always do: set a key, read a key, check whether a key exists, delete one, and loop over all of them.',
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
      ['Order is random', 'A JS `Map` keeps insertion order. A Go map does not: a loop visits keys in a different order each run. Go shuffles on purpose so nobody depends on an order it never promised.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Comma ok',
      title: 'Was the key there, or is the value just zero?',
      blocks: [
        { note: 'Read with two variables, `v, ok := m[k]`, and `ok` tells you whether the key really exists.', title: 'In one sentence' },
        'Here is the problem. A missing key returns zero, so `ages["bob"]` returning `0` could mean "Bob is 0 years old" or "there is no Bob".',
        'To tell them apart, read with two variables. The second one is a `bool` that is `true` only when the key exists, like calling `has` and `get` at once:',
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
        'This is called the **comma ok** pattern. You will see it again with type assertions and channel receives. The second value always answers the same question: "did this really work?"',
      ],
    },
    {
      eyebrow: 'Zero values help',
      title: 'Counting without checking first',
      blocks: [
        { note: 'Because a missing key reads as zero, you can add to it right away.', title: 'In one sentence' },
        'In JS you often write `counts[w] = (counts[w] ?? 0) + 1` to guard against `undefined`. In Go there is nothing to guard against. A missing key already reads as `0`:',
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
        'The same trick works when the values are slices. `groups[k] = append(groups[k], v)` works even when `groups[k]` was never set. A missing slice reads as `nil`, and `append` works on `nil`.',
      ],
    },
    {
      eyebrow: 'Rules',
      title: 'What can be a key, and how to make a map',
      blocks: [
        'A key has to be something Go can compare with `==`. That rules out a few types:',
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
        'There are three ways to get a map variable, and only two of them give you a map you can write to:',
        {
          code: `m1 := map[string]int{}           // empty, ready
m2 := make(map[string]int, 100)  // with size hint
var m3 map[string]int            // nil: read OK,
                                 // write panics`,
        },
        'A struct key replaces the JS habit of gluing values into a string key like `"3,4"`. Use `map[Point]bool` with `type Point struct{ X, Y int }`. Two points with the same X and Y count as the same key.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Writing to a nil map panics', body: '`var m map[string]int` declares a map variable but does not create the map, so it is `nil`. Reading from it is fine (you get zeros). Writing crashes with "assignment to entry in nil map". Create it with `make` or `{}` first.' },
    { title: 'Depending on iteration order', body: 'Do not write code or tests that expect keys in a certain order. If you need order, collect the keys into a slice and sort them with `slices.Sorted(maps.Keys(m))`.' },
    { title: 'Maps are not safe across goroutines', body: 'Goroutines are functions running at the same time. If two of them read and write the same map at once, the program can crash with "concurrent map writes" or "concurrent map read and map write". Protect the map with a mutex (a lock that lets one goroutine in at a time). See [sync](/lesson/sync).' },
  ],
  note: 'Like a slice, a map variable points to shared data, the way a JS variable points to an object. Pass a map to a function and that function can change your map.',
  predict: {
    code: `ages := map[string]int{"ann": 31}
fmt.Println(ages["bob"])
v, ok := ages["bob"]
fmt.Println(v, ok)`,
    options: ['undefined, then undefined false', '0, then 0 false', 'panic: key not found', '0, then 0 true'],
    answer: 1,
    why: 'Line 2 reads a key that is not there. Go hands back the zero value of the value type, and the value type is `int`, so it prints `0`. Nothing crashes. Line 3 uses comma ok: `v` is again `0`, and `ok` is `false` because "bob" was never put in the map.',
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
    prompt: 'This should print `2 1`. Fill in the blank so each word adds one to its count. You do not need to check whether the key exists first.',
    code: `words := []string{"go", "ts", "go"}
count := map[string]int{}
for _, w := range words {
    count[w]___
}
fmt.Println(count["go"], count["ts"])`,
    answers: ['++', '+= 1', '+=1'],
    success: 'The first time a word shows up, its key is missing and reads as `0`, so `count[w]++` makes it `1`. After that it keeps adding. No `?? 0` needed.',
    wrong: [
      { answers: ['= 1', '=1'], title: 'That overwrites the count', body: 'Every word would be set to 1 no matter how often it appears, so this prints `1 1`. You want to add to whatever is already there.' },
      { answers: ['+ 1', '+1'], title: 'That is an expression, not a statement', body: '`count[w] + 1` computes a value and throws it away, and Go refuses to compile it with "is not used". Use `++` or `+= 1`, which store the result.' },
    ],
    hint: 'Go has an increment statement that works directly on a map entry.',
  },
  recap: [
    '`map[K]V` is Go\'s dictionary. Create it with `{}` or `make` before writing to it.',
    'Missing keys read as the zero value. Use comma ok, `v, ok := m[k]`, to know if the key exists.',
    'Iteration order is random on purpose. Sort the keys if order matters.',
    'Maps are shared, and need a lock when several goroutines use them.',
  ],
}

const strings: LessonContent = {
  id: 'strings',
  minutes: 14,
  lead: 'For plain English text, Go strings and JS strings feel identical. Add an accent or an emoji and they start to disagree about length and indexing. The reason: a JavaScript string is a sequence of UTF-16 code units, while a Go string is a sequence of **bytes** (numbers from 0 to 255), usually holding UTF-8 text. This lesson shows you what changes and how to handle it.',
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
      ['A string is bytes', '`len(s)` counts bytes, not letters. "é" takes 2 bytes in UTF-8, so "héllo" has length 6.'],
      ['Indexing gives a byte', 'In JS, `s[1]` is a one-letter string. In Go, `s[1]` is a `byte`, which is a number.'],
      ['`range` gives runes', 'A `for range` loop decodes the UTF-8 and hands you each character as a `rune` (a number for one Unicode character), much like `for...of` on a JS string.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Three types',
      title: 'string, byte and rune',
      blocks: [
        { note: 'A `string` is a row of bytes, a `byte` is one of those bytes, and a `rune` is one whole character.', title: 'In one sentence' },
        {
          table: {
            head: ['Type', 'What it is', 'Example'],
            rows: [
              ['`string`', 'Read-only bytes, usually UTF-8', '`"héllo"`'],
              ['`byte`', 'Another name for `uint8` (an unsigned 8-bit number), one byte', '`s[0]` is `104`'],
              ['`rune`', 'Another name for `int32`, one Unicode code point (the number Unicode gives a character)', '`\'é\'` is `233`'],
            ],
          },
        },
        'Quotes mean different things in Go. In JS, single and double quotes both make strings. In Go:',
        {
          list: [
            'Double quotes make a string: `"a"`.',
            'Single quotes make a **rune**, which is a number: `\'a\'` is 97.',
            'Backticks make a raw string. `\\n` stays as two characters, and there is no `${}` interpolation.',
          ],
        },
        'You can convert between the three:',
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
        { note: 'Picture each character as a box, and the bytes as the box\'s width. "h" is 1 byte wide, "é" is 2. `range` steps from box to box. The index it gives you is where each box starts, measured in bytes.', title: 'Think of it like this' },
        'Run this and look at the indexes. They jump from 1 to 3:',
        {
          code: `for i, r := range "hé!" {
    fmt.Println(i, string(r))
}
// 0 h
// 1 é
// 3 !   <- é used bytes 1 and 2`,
        },
        'Which one should you use? If you need "the third character", convert to `[]rune` first. If you are parsing ASCII-only formats like HTTP headers, working with bytes directly is fast and fine.',
      ],
    },
    {
      eyebrow: 'Building strings',
      title: 'Strings are immutable, so build them smartly',
      blocks: [
        { note: 'To build a long string, collect the pieces in a `strings.Builder`, then turn it into a string once at the end.', title: 'In one sentence' },
        'Like in JS, you cannot change a string in place. `s[0] = \'H\'` does not compile.',
        'That has a cost: `+=` in a loop copies the whole string every time. `strings.Builder` avoids that by growing one buffer, much like pushing parts into an array and calling `join` at the end:',
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
        'You might wonder where the string methods went. In Go they are functions in packages:',
        {
          list: [
            '`strings.Split`, `strings.Join`, `strings.Contains`, `strings.TrimSpace`: the string methods you know from JS, as functions in the `strings` package.',
            '`strconv.Itoa(42)` and `strconv.Atoi("42")` convert between numbers and text.',
            '`fmt.Sprintf("%s is %d", name, age)` fills in placeholders. It is Go\'s answer to template literals.',
          ],
        },
      ],
    },
  ],
  pitfalls: [
    { title: 'Using len for "number of characters"', body: '`len("héllo")` is 6, because it counts bytes. For characters, use `utf8.RuneCountInString(s)` or `len([]rune(s))`.' },
    { title: 'string(65) is not "65"', body: 'Converting an integer with `string(n)` gives the character with that code, like `String.fromCharCode(65)` in JS. So `string(65)` is "A". `go vet` warns about it. Use `strconv.Itoa(n)` to get "65".' },
    { title: 'Slicing in the middle of a character', body: '`s[0:2]` on "héllo" gives "h" plus half of "é", which prints as a broken character. When text may not be plain ASCII, slice on rune boundaries.' },
  ],
  deepDive: {
    q: 'Why are Go strings bytes and not UTF-16 like JavaScript?',
    body: [
      'Two of Go\'s designers, Rob Pike and Ken Thompson, also designed UTF-8. UTF-8 is what files, network protocols and most of the web use, so a Go string can hold data straight from a socket with no conversion.',
      'A string value is a small header: a pointer to the bytes (their memory address) and a length. Slicing a string makes a new header pointing into the same bytes, so `s[2:5]` is cheap. Nothing is copied.',
    ],
  },
  predict: {
    code: `s := "héllo"
fmt.Println(len(s), s[1])`,
    options: ['5 é', '6 195', '5 233', '6 é'],
    answer: 1,
    why: 'Write out the bytes first: "é" is 2 bytes in UTF-8 (195 and 169), so the string is 6 bytes long. `len` counts bytes, so it prints 6. `s[1]` is the byte at index 1, which is the first half of "é". It prints as the number 195. It is not a character, and it is not the code point 233.',
    trace: [
      ['line 1', 'bytes: 104 195 169 108 108 111', 'idle'],
      ['len(s)', '6 bytes', 'run'],
      ['s[1]', 'byte at index 1: 195', 'run'],
      ['output', '6 195', 'out'],
    ],
  },
  challenge: {
    title: 'Count the characters, not the bytes',
    prompt: 'This should print `5`, the number of characters in "héllo". `len` of a string counts bytes, so first convert the string into something with one item per character.',
    code: `s := "héllo"
fmt.Println(len(___(s)))`,
    answers: ['[]rune'],
    success: 'Converting to `[]rune` decodes the UTF-8 into one item per character, so `len` gives 5. If you only need the count and not the slice, `utf8.RuneCountInString(s)` does the same without building one.',
    wrong: [
      { answers: ['[]byte'], title: 'Still bytes', body: '`[]byte(s)` gives the raw bytes, one item per byte, so `len` is still 6.' },
      { answers: ['string'], title: 'Already a string', body: '`string(s)` changes nothing, so `len` still counts bytes and gives 6. You need a slice of characters.' },
    ],
    hint: 'Convert to a slice of the type that holds one Unicode code point.',
  },
  recap: [
    'A Go string is read-only bytes, usually UTF-8.',
    '`len(s)` and `s[i]` work on bytes. `range` walks whole characters (runes).',
    'A `rune` is one Unicode character. Single quotes make a rune.',
    'Build big strings with `strings.Builder`, and convert numbers with `strconv`.',
  ],
}

const structs: LessonContent = {
  id: 'structs',
  minutes: 16,
  lead: 'Go has no classes, so where does your data go? Into **structs**: named groups of fields, where each field has a fixed type. Picture a JS object whose keys are declared up front and can never be added or removed. And instead of `extends`, Go lets you **embed** one struct inside another to reuse its fields and methods.',
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
      ['Capital letter = public', '`Name` is visible to other packages, a bit like a named `export`. A field called `name` would stay private to this package.'],
      ['Assignment copies', '`v := u` copies every field, like `{ ...u }` in JS. The two values are then independent.'],
    ],
  },
  sections: [
    {
      eyebrow: 'Values, not references',
      title: 'Assigning a struct makes a copy',
      blocks: [
        { note: 'A struct behaves like a number, not like a JS object: assign it and you get a copy.', title: 'In one sentence' },
        'This is the biggest change from JS. In JS, objects are always shared by reference. In Go, a struct is a **value**. Assigning it, or passing it to a function, copies all the fields:',
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
        { note: 'Handing someone a JS object is like sharing a Google Doc link: both of you edit the same file. Handing someone a Go struct is like emailing them a PDF: they get their own copy. A pointer (next paragraph) is how you share the link in Go.', title: 'Think of it like this' },
        'When you do want sharing, take a pointer: `q := &p`. A pointer holds the memory address of `p`, so `q.X = 10` changes `p`. You write `q.X` the same way whether `q` is a pointer or a value. See [Pointers](/lesson/pointers).',
        'Structs can also be compared with `==`, as long as all their fields can. In JS, `==` on two objects asks "are these the same object?". In Go, two `Point` values are equal when every field is equal. That makes structs handy as map keys.',
      ],
    },
    {
      eyebrow: 'Constructors',
      title: 'No constructor keyword, just functions',
      blocks: [
        { note: 'A Go "constructor" is an ordinary function, by convention named `NewThing`.', title: 'In one sentence' },
        'Go has no `constructor` and no `new MyClass()`. Instead you write a plain function called `NewThing` that returns a ready-to-use value. It usually returns a pointer (`*Server`), so callers share one value instead of copying it:',
        {
          code: `type Server struct {
    Addr    string
    Timeout time.Duration
}

func NewServer(addr string) *Server {
    return &Server{Addr: addr, Timeout: 30 * time.Second}
}`,
        },
        { note: 'Many Go types are designed so their zero value is already useful, like `sync.Mutex` or `bytes.Buffer`. Those need no constructor at all: `var mu sync.Mutex` is ready to use.' },
      ],
    },
    {
      eyebrow: 'Embedding',
      title: 'Composition instead of extends',
      blocks: [
        { note: 'Embedding puts one struct inside another and lets you use the inner one\'s fields and methods as if they were the outer one\'s.', title: 'In one sentence' },
        'To **embed** a type, write its name inside a struct with no field name. The inner fields and methods are "promoted" to the outer struct, so you can use them directly:',
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
        'This looks like inheritance, so you might ask: is a `Dog` an `Animal` now? No. You cannot pass a `Dog` where an `Animal` is expected. A `Dog` **has** an `Animal` inside it, and Go writes the forwarding code (`d.Hello()` means `d.Animal.Hello()`) for you.',
        'That is called composition. To share behaviour across different types, use [interfaces](/lesson/interfaces).',
      ],
    },
  ],
  pitfalls: [
    { title: 'Expecting changes to show up after passing a struct', body: 'In JS, a function receives the same object you passed. In Go, a function that takes `u User` gets a copy, so changing `u.Age` inside does nothing for the caller. Take `*User` (a pointer) if the function should change it.' },
    { title: 'Lowercase fields disappear in JSON', body: '`encoding/json` (Go\'s `JSON.stringify` and `JSON.parse`) only sees exported (capitalised) fields. A field named `name` is skipped without any error. See [JSON and struct tags](/lesson/json).' },
    { title: 'Treating embedding as inheritance', body: 'There is no `super`, no method overriding, and no "is-a" relationship. If `Dog` defines its own `Hello`, it hides `Animal.Hello` when you call `d.Hello()`. But code inside `Animal`\'s methods still calls `Animal`\'s own methods, never `Dog`\'s.' },
  ],
  predict: {
    code: `type Point struct{ X, Y int }

p := Point{1, 2}
q := p
q.X = 10
fmt.Println(p.X, q.X)`,
    options: ['10 10', '1 10', '1 1', 'It does not compile'],
    answer: 1,
    why: '`q := p` copies the whole struct, so `q` is a separate value with its own `X`. Changing `q.X` to 10 leaves `p.X` at 1. In JS the answer would be "10 10", because both names would point at one shared object.',
    trace: [
      ['line 3', 'p = {X: 1, Y: 2}', 'idle'],
      ['line 4', 'q is a full copy of p', 'run'],
      ['line 5', 'q.X = 10, p untouched', 'run'],
      ['output', '1 10', 'out'],
    ],
  },
  challenge: {
    title: 'Embed Animal in Dog',
    prompt: 'This should print `hi, Rex`. Fill in the line inside `Dog` so that `Dog` gets `Animal`\'s field and method.',
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
    success: 'Writing the type name alone embeds it. `Name` and `Hello` are promoted to `Dog`, so `d.Hello()` works directly.',
    wrong: [
      { answers: ['a Animal', 'animal Animal', 'Animal Animal'], title: 'That is a named field', body: 'With a field name, `Animal` is a normal field and nothing is promoted. You would have to write `d.a.Hello()`, and `d.Hello()` does not compile. Leave the name off.' },
      { answers: ['extends Animal'], title: 'That is TypeScript', body: 'Go has no `extends`. Put the type name on its own line inside the struct.' },
    ],
    hint: 'Embedding is a field with a type but no name.',
  },
  recap: [
    'A struct is a typed group of fields. Fields you leave out get zero values.',
    'Structs are values: assigning or passing one copies it. Use a pointer to share.',
    'Use `NewThing` functions as constructors, or make the zero value useful.',
    'Embedding promotes fields and methods. It is composition, not inheritance.',
  ],
}

const methods: LessonContent = {
  id: 'methods',
  minutes: 15,
  lead: 'In JavaScript, methods live inside a class and use `this`. In Go, you write methods outside the struct and name the **receiver** yourself. The receiver is the value the method is called on: Go\'s version of `this`. The one real decision is whether the receiver is a value or a pointer, because that decides whether the method can change anything.',
  fromTs: {
    title: 'A class method becomes a function with a receiver',
    intro: 'Here is a counter with one method that changes it and one that reads it. In Go the receiver, `(c *Counter)`, goes before the method name.',
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
        { note: 'A pointer receiver changes the original. A value receiver changes a copy that is thrown away.', title: 'In one sentence' },
        'A method call with a value receiver copies the struct, exactly like passing it to a function. Any change lands on the copy and is lost when the method returns:',
        {
          code: `func (c Counter) IncVal()  { c.n++ } // copy
func (c *Counter) IncPtr() { c.n++ } // original

c := Counter{}
c.IncVal()
c.IncPtr()
fmt.Println(c.n) // 1`,
        },
        'So how do you choose? Use this table:',
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
        'A common rule of thumb: if any method needs a pointer receiver, make them **all** pointer receivers. Then the type behaves the same way no matter which method you call.',
      ],
    },
    {
      eyebrow: 'Auto & and *',
      title: 'Go adds the & for you',
      blocks: [
        { note: 'When you call a method on a variable, Go adds `&` or `*` for you so the receiver type matches.', title: 'In one sentence' },
        'You might expect to write `(&c).Inc()` to call a pointer method. You don\'t have to. If `c` is a variable (Go calls this addressable: it has a place in memory), Go takes its address for you. In the other direction, it follows a pointer to its value (dereferences it) to call value methods:',
        {
          code: `c := Counter{}   // a value
c.Inc()          // Go calls (&c).Inc()

p := &Counter{}  // a pointer
fmt.Println(p.Value()) // Go calls (*p).Value()`,
        },
        { pitfall: 'The automatic `&` only works on variables. `Counter{}.Inc()` does not compile, because a temporary value has no address to take. Interfaces follow a similar rule: only `*Counter` has `Inc` in its method set (the list of methods a type has).', title: 'Where the magic stops' },
      ],
    },
    {
      eyebrow: 'Any named type',
      title: 'Methods are not only for structs',
      blocks: [
        { note: 'Any type you define in your own package can have methods, even one built on `float64`.', title: 'In one sentence' },
        'Methods are not tied to structs. You can add them to a type based on `int`, `float64` or a slice. That lets plain values carry readable behaviour, like `Celsius(100).F()` here:',
        {
          code: `type Celsius float64

func (c Celsius) F() float64 {
    return float64(c)*9/5 + 32
}

fmt.Println(Celsius(100).F()) // 212`,
        },
        'There is one limit. You cannot add methods to built-in types like `string`, or to types from other packages like `time.Time`. There is no Go version of patching `String.prototype`. Define your own named type instead.',
      ],
    },
  ],
  pitfalls: [
    { title: 'Value receiver that "does nothing"', body: 'A setter like `func (u User) SetName(n string) { u.Name = n }` compiles and runs, but it changes a copy. The caller never sees the new name. Use `*User`.' },
    { title: 'Mixing receivers and interfaces', body: 'If `Inc` has a pointer receiver, a `Counter` value does not satisfy an interface that needs `Inc`. Only `*Counter` does. The error says "method Inc has pointer receiver". More in [Interfaces](/lesson/interfaces).' },
    { title: 'Copying a struct with a mutex', body: 'A value receiver copies the struct, including any `sync.Mutex` (a lock) inside it. The copy has its own separate lock, so nothing is protected. `go vet` flags this as "passes lock by value".' },
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
    why: 'Go through the calls one at a time. Each `IncVal` gets a copy of `c`, bumps the copy to 1, and throws it away, so `c.n` stays 0. `IncPtr` gets a pointer to the real `c` and bumps it to 1. So it prints 1.',
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
    prompt: 'Right now this prints `0`, because each call changes a copy. Fill in the receiver type so it prints `2`.',
    code: `type Counter struct{ n int }

func (c ___) Inc() { c.n++ }

c := Counter{}
c.Inc()
c.Inc()
fmt.Println(c.n)`,
    answers: ['*Counter'],
    success: 'With `*Counter`, the method gets a pointer to the original `c`, so both increments stick. Go adds the `&` at the call site for you, which is why `c.Inc()` still reads naturally.',
    wrong: [
      { answers: ['Counter'], title: 'That is the value receiver', body: 'With `Counter`, each call changes a copy, so this still prints `0`.' },
      { answers: ['&Counter'], title: 'Close, wrong symbol', body: '`&` takes the address of a value. In a type, a pointer is written with `*`.' },
    ],
    hint: 'The method needs a pointer to the struct, not a copy of it.',
  },
  recap: [
    'Methods are functions with a receiver written before the name.',
    'Pointer receivers change the original. Value receivers change a copy.',
    'If one method needs a pointer receiver, use pointer receivers for all of them.',
    'Go adds `&` and `*` for you when you call methods on variables.',
  ],
}

export const DATA: LessonContent[] = [slices, maps, strings, structs, methods]
