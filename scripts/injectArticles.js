import fs from 'fs';
const path = './src/data/jsPracticeMap.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const articles = {
  'Hr5iLG7sUa0': {
    overview: 'JavaScript is a dynamic, single-threaded, weakly-typed programming language executed by V8 (Chrome/Node) and SpiderMonkey (Firefox) engines.',
    keyPoints: [
      'Executes code synchronously from top to bottom on a single thread.',
      'Can run both in the browser (DOM manipulation) and server-side (Node.js).',
      'Uses console.log() to print outputs to developer tools.'
    ],
    codeSnippet: `// Hello World & Basic Console Output
console.log("Hello Foclyra!");
console.table([{ name: "Sameed", role: "JS Developer" }]);`,
    pitfalls: 'JS is case-sensitive! Console.log or CONSOLE.log will throw a ReferenceError.'
  },
  'yY0bKZNYmJs': {
    overview: 'Understanding the differences between var, let, and const is crucial for writing bug-free modern ES6+ JavaScript.',
    keyPoints: [
      'var: Function-scoped, can be re-declared and updated. Suffers from scope leaking outside block statements.',
      'let: Block-scoped ({}), can be updated but NOT re-declared within the same scope.',
      'const: Block-scoped ({}), CANNOT be updated or re-declared. Must be initialized upon declaration.'
    ],
    codeSnippet: `// Scope & Re-declaration rules
let score = 100;
score = 150; // ✅ Allowed

const API_KEY = "secret_123";
// API_KEY = "new"; // ❌ TypeError: Assignment to constant variable

// const with Objects allows property mutation:
const user = { name: "Sameed" };
user.name = "Developer"; // ✅ Allowed!
// user = {}; // ❌ TypeError`,
    pitfalls: 'Temporal Dead Zone (TDZ): Accessing let/const variables before initialization throws ReferenceError, unlike var which returns undefined.'
  },
  '-9knnv97wSc': {
    overview: 'JavaScript has 7 Primitive Data Types (stored in Stack) and Non-Primitive / Reference Type Objects (stored in Heap).',
    keyPoints: [
      'Primitives: Number, String, Boolean, Null, Undefined, Symbol, BigInt (Passed by Value).',
      'Reference: Object, Array, Function (Passed by Reference).',
      'typeof null is historically "object" — a famous JS design flaw!'
    ],
    codeSnippet: `const count = 42;             // Number
const name = "Foclyra";      // String
const isActive = true;        // Boolean
const empty = null;           // Null (typeof returns "object")
let unassigned;               // Undefined
const id = Symbol("id");      // Symbol (Unique value)`,
    pitfalls: 'typeof null === "object" returns true due to legacy 32-bit type tag representations in early V8 versions.'
  },
  'X7hDBhd_L5U': {
    overview: 'Implicit type coercion occurs when JS automatically converts datatypes during operations like string concatenation or comparison.',
    keyPoints: [
      'String + Number results in String concatenation: "1" + 2 === "12".',
      'String - Number converts String to Number: "5" - 2 === 3.',
      'Use explicit conversion: Number("123"), String(456), Boolean(1).'
    ],
    codeSnippet: `console.log("1" + 2 + 2);   // "122" ("1"+2 = "12", "12"+2 = "122")
console.log(1 + 2 + "2");   // "32"  (1+2 = 3, 3+"2" = "32")
console.log(+"");            // 0 (Empty string coerced to number 0)
console.log(+true);          // 1`,
    pitfalls: 'NaN === NaN returns false! Use Number.isNaN(val) or Object.is(val, NaN) to check for NaN.'
  },
  'giP2uXMlv4c': {
    overview: 'JavaScript provides Loose Equality (==) which performs type coercion, and Strict Equality (===) which checks both value and type.',
    keyPoints: [
      'Strict Equality (===): No type conversion. Compares value AND type.',
      'Loose Equality (==): Converts operands to same type before comparing.',
      'Always default to === in modern production code.'
    ],
    codeSnippet: `console.log(5 == "5");       // true (coerced string "5" to number 5)
console.log(5 === "5");      // false (different types: number vs string)
console.log(null == undefined); // true
console.log(null === undefined);// false`,
    pitfalls: '== comparison results can be wildly unintuitive: [] == false is true, but [] == ![] is also true!'
  },
  '7gwc-1czolw': {
    overview: 'Memory in JS is split into the Stack (fixed size, primitive values, fast) and the Heap (dynamic size, objects/arrays, garbage collected).',
    keyPoints: [
      'Stack: Primitive values stored directly. Copying creates an independent value.',
      'Heap: Objects stored dynamically. Copying duplicates reference address, NOT content.',
      'Garbage Collector uses Mark-and-Sweep algorithm to reclaim unreferenced Heap memory.'
    ],
    codeSnippet: `// Stack Copy (Independent)
let myName = "Hitesh";
let anotherName = myName;
anotherName = "Chai";
console.log(myName);      // "Hitesh" (unaffected!)

// Heap Copy (Reference Shared)
let userOne = { email: "user@google.com" };
let userTwo = userOne;
userTwo.email = "sameed@gmail.com";
console.log(userOne.email); // "sameed@gmail.com" (Mutated original!)`,
    pitfalls: 'Mutating shared object references causes unexpected side-effects across components. Use spread operator {...obj} or structuredClone(obj) for deep copies.'
  },
  'fozwNnFunlo': {
    overview: 'Strings are immutable sequences of UTF-16 code units with powerful built-in inspection and slicing methods.',
    keyPoints: [
      'Strings are immutable — methods return NEW strings rather than modifying originals.',
      'Template Literals (backticks ``) support string interpolation (${val}) and multi-line text.',
      'Use slice(start, end) for extract sub-strings (supports negative indices).'
    ],
    codeSnippet: `const str = "Chai aur Code";
console.log(str.length);             // 13
console.log(str.toUpperCase());      // "CHAI AUR CODE"
console.log(str.slice(-4));          // "Code" (Negative index from end)
console.log(str.includes("Chai"));    // true
console.log(str.replace("Chai", "Coffee")); // "Coffee aur Code"`,
    pitfalls: 'str[0] = "K" silently fails or throws error in strict mode because primitive strings are immutable.'
  },
  '_KqpeDc47Ro': {
    overview: 'JavaScript numbers are double-precision 64-bit binary format IEEE 754 values, including special values like Infinity and NaN.',
    keyPoints: [
      'Math.floor() rounds down, Math.ceil() rounds up, Math.round() rounds to nearest.',
      'Math.random() generates floating number between 0 (inclusive) and 1 (exclusive).',
      'Use (Math.random() * (max - min + 1)) + min for integer ranges.'
    ],
    codeSnippet: `const min = 10, max = 20;
const randomRange = Math.floor(Math.random() * (max - min + 1)) + min;
console.log(randomRange); // Random integer between 10 and 20

const balance = 123.4567;
console.log(balance.toFixed(2)); // "123.46" (returns String!)`,
    pitfalls: '0.1 + 0.2 === 0.30000000000000004 due to 64-bit binary floating point representation precision limit.'
  },
  'cejBux2gtEE': {
    overview: 'Arrays are resizable, zero-indexed collections that can contain mixed datatypes and reference objects.',
    keyPoints: [
      'Mutating methods: push(), pop(), shift(), unshift(), splice().',
      'Non-mutating methods: slice(), concat(), join(), includes().',
      'pop() removes last element, shift() removes first element.'
    ],
    codeSnippet: `const myArr = [0, 1, 2, 3, 4];
myArr.push(5);              // [0, 1, 2, 3, 4, 5]
myArr.pop();                // Removes 5

// Splice (mutates original array):
const removed = myArr.splice(1, 2); // Removes 2 elements starting at index 1
console.log(myArr);         // [0, 3, 4]`,
    pitfalls: 'splice() modifies the original array, whereas slice() returns a shallow copy without altering original array.'
  },
  'vVYOHmqQDCU': {
    overview: 'Objects store key-value pairs where keys are Strings or Symbols, and values can be any datatype including functions (methods).',
    keyPoints: [
      'Access properties via Dot notation (obj.name) or Bracket notation (obj["name"]).',
      'Use Bracket notation when key name has spaces, hyphens, or is dynamic variable.',
      'Object.freeze(obj) prevents adding, modifying, or deleting properties.'
    ],
    codeSnippet: `const sym = Symbol("key1");
const user = {
  name: "Sameed",
  [sym]: "mySymbolValue", // Symbol as key
  "full name": "Sameed Siddiqui"
};

console.log(user.name);
console.log(user["full name"]);
console.log(user[sym]); // Access symbol property`,
    pitfalls: 'Symbol keys are non-enumerable in standard for...in loops and Object.keys(). Use Object.getOwnPropertySymbols().'
  },
  'Bn56WahG_t0': {
    overview: 'Functions are first-class citizens in JS — they can be assigned to variables, passed as arguments, and returned from other functions.',
    keyPoints: [
      'Function Declarations are hoisted completely.',
      'Function Expressions (assigned to const/let) are NOT hoisted before initialization.',
      'Parameters are inputs defined in function signature; arguments are real values passed during invocation.'
    ],
    codeSnippet: `// Function Declaration (Hoisted)
sayHi(); // Works!
function sayHi() {
  console.log("Hi!");
}

// Function Expression (Not Hoisted)
// sayHello(); // ❌ ReferenceError!
const sayHello = function() {
  console.log("Hello!");
};`,
    pitfalls: 'Invoking a function without required arguments defaults missing parameters to undefined.'
  },
  '9ksqBa8_txM': {
    overview: 'The this keyword refers to the execution context object. Arrow functions do NOT have their own this binding.',
    keyPoints: [
      'In object methods: this points to the object calling the method.',
      'In standalone function: this points to global window (or undefined in strict mode).',
      'Arrow functions (() => {}): Inherit this lexically from parent enclosing scope.'
    ],
    codeSnippet: `const user = {
  username: "Hitesh",
  welcomeMessage: function() {
    console.log(\`\${this.username}, welcome!\`); // "Hitesh, welcome!"
  },
  arrowWelcome: () => {
    console.log(\`\${this.username}, welcome!\`); // undefined (inherits window this!)
  }
};`,
    pitfalls: 'Do NOT use arrow functions for object methods or DOM event listeners if you need this to refer to the object/element.'
  },
  '9MfwYoWKKVE': {
    overview: 'filter(), map(), and reduce() are higher-order functional array methods that return new values without mutating the source array.',
    keyPoints: [
      'map(): Transforms each item and returns a new array of same length.',
      'filter(): Returns a new array containing items that satisfy boolean condition.',
      'reduce(): Accumulates array items into a single final value (number, object, array).'
    ],
    codeSnippet: `const nums = [1, 2, 3, 4, 5];

// map: Multiply by 2
const doubled = nums.map(n => n * 2); // [2, 4, 6, 8, 10]

// filter: Even numbers
const evens = nums.filter(n => n % 2 === 0); // [2, 4]

// reduce: Sum total
const total = nums.reduce((acc, curr) => acc + curr, 0); // 15`,
    pitfalls: 'Always specify the initial accumulator value (0, {}, []) in reduce(), otherwise it defaults to first array element which breaks empty arrays.'
  },
  'NJwRQgsu1Q8': {
    overview: 'Promises represent eventual completion or failure of an asynchronous operation and its resulting value.',
    keyPoints: [
      'States: Pending (initial), Fulfilled (resolved successfully), Rejected (failed).',
      '.then() handles fulfilled result, .catch() handles error, .finally() runs always.',
      'Promise callbacks are placed into the Microtask Queue (executed before Macrotask setTimeout queue).'
    ],
    codeSnippet: `const myPromise = new Promise((resolve, reject) => {
  const success = true;
  setTimeout(() => {
    if (success) resolve({ data: "User fetched" });
    else reject("Network error");
  }, 1000);
});

myPromise
  .then(res => console.log(res.data))
  .catch(err => console.error(err))
  .finally(() => console.log("Operation finished"));`,
    pitfalls: 'Uncaught Promise Rejections crash Node.js processes! Always attach a .catch() block or wrap in try...catch with await.'
  },
  'VaH09NXQZ58': {
    overview: 'A closure is a function bundled together with references to its surrounding lexical environment, allowing inner functions to access outer scope variables even after parent function finishes execution.',
    keyPoints: [
      'Lexical Scoping: Inner functions have access to variables defined in outer parent scopes.',
      'Closure: Created every time a function is created at function creation time.',
      'Practical uses: Data privacy (encapsulation), factory functions, event handlers, memoization.'
    ],
    codeSnippet: `function outerCounter() {
  let count = 0; // Private variable via closure
  return function inner() {
    count++;
    return count;
  };
}

const counter = outerCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3 (count stays alive in memory!)`,
    pitfalls: 'Closures keep outer variables alive in memory, which can lead to memory leaks if unwanted large objects are held in closed scopes.'
  }
};

for (const [id, article] of Object.entries(articles)) {
  if (data[id]) {
    data[id].summaryArticle = article;
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Successfully injected diagnosed study articles into jsPracticeMap.json!');
