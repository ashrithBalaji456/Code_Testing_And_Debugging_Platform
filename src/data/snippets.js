// Preset code snippets demonstrating review, debugging, and testing capabilities

export const SNIPPETS = [
  {
    id: 'fibonacci-buggy',
    name: 'Buggy Fibonacci (Recursion & Edge Case)',
    language: 'javascript',
    category: 'Algorithms & Logic',
    description: 'Exponential recursion with an off-by-one base case causing infinite loops or incorrect results on negative and zero inputs.',
    code: `// Computes the N-th Fibonacci number
function fibonacci(n) {
  // BUG 1: Missing check for negative numbers
  // BUG 2: Incorrect base case (fib(0) returns 1 instead of 0)
  if (n <= 1) {
    return 1;
  }
  
  // BUG 3: Unmemoized exponential recursion O(2^N)
  // BUG 4: Can cause stack overflow for large N
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example invocation
const result = fibonacci(6);
console.log("Fibonacci(6) =", result);
`,
    fixedCode: `// Computes the N-th Fibonacci number with memoization and input validation
function fibonacci(n, memo = {}) {
  if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
    throw new RangeError("Fibonacci input must be a non-negative integer.");
  }
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (memo[n] !== undefined) return memo[n];

  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

// Example invocation
const result = fibonacci(6);
console.log("Fibonacci(6) =", result);
`,
    simulatedTrace: `RangeError: Maximum call stack size exceeded
    at fibonacci (solution.js:10:10)
    at fibonacci (solution.js:10:28)
    at fibonacci (solution.js:10:28)`,
    testCases: [
      { id: 'fib-1', name: 'Base case fib(0)', input: '0', expected: '0', type: 'Edge' },
      { id: 'fib-2', name: 'Base case fib(1)', input: '1', expected: '1', type: 'Happy' },
      { id: 'fib-3', name: 'Small integer fib(6)', input: '6', expected: '8', type: 'Happy' },
      { id: 'fib-4', name: 'Double digits fib(10)', input: '10', expected: '55', type: 'Happy' },
      { id: 'fib-5', name: 'Negative input fib(-3)', input: '-3', expected: 'Error', type: 'Error' },
      { id: 'fib-6', name: 'High order fib(25)', input: '25', expected: '75025', type: 'Performance' },
    ],
    stepTrace: [
      { step: 1, line: 3, vars: { n: 4, memo: '{}', currentCall: 'fib(4)' } },
      { step: 2, line: 10, vars: { n: 4, branch: 'left', recursing: 'fib(3)' } },
      { step: 3, line: 3, vars: { n: 3, memo: '{}', currentCall: 'fib(3)' } },
      { step: 4, line: 10, vars: { n: 3, branch: 'left', recursing: 'fib(2)' } },
      { step: 5, line: 6, vars: { n: 2, branch: 'left', recursing: 'fib(1)' } },
      { step: 6, line: 5, vars: { n: 1, hitBaseCase: true, returned: 1 } },
      { step: 7, line: 10, vars: { n: 2, left: 1, recursing: 'fib(0)' } },
      { step: 8, line: 5, vars: { n: 0, hitBaseCase: true, returned: 0 } },
      { step: 9, line: 11, vars: { n: 2, memoized: '{2: 1}', returned: 1 } },
      { step: 10, line: 11, vars: { n: 4, memoized: '{2:1, 3:2, 4:3}', finalResult: 3 } }
    ]
  },
  {
    id: 'sql-injection-auth',
    name: 'Insecure Auth & SQL Query (Security Critical)',
    language: 'javascript',
    category: 'Security & Auth',
    description: 'Vulnerable backend endpoint with SQL Injection, plaintext credentials, hardcoded JWT secret, and missing error sanitization.',
    code: `// User authentication endpoint handler
const JWT_SECRET = "super_secret_key_12345"; // SECURITY BUG: Hardcoded secret!

async function authenticateUser(req, db) {
  const { username, password } = req.body;

  // SECURITY BUG: Dangerous raw SQL string concatenation (SQL Injection)
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  console.log("Executing query:", query);

  const user = await db.query(query);

  if (!user || user.length === 0) {
    // BUG: Revealing exact credentials existence to attackers
    return { status: 401, error: "User not found with username " + username };
  }

  // BUG: Weak token generation with no expiration
  return {
    status: 200,
    token: "token_" + user[0].id + "_" + JWT_SECRET,
    user: user[0]
  };
}
`,
    fixedCode: `// User authentication endpoint handler (Secured & Hardened)
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET; // Secured via Environment Variable

async function authenticateUser(req, db) {
  const { username, password } = req.body;
  if (!username || !password || typeof username !== 'string') {
    return { status: 400, error: "Invalid credentials format." };
  }

  // FIX: Parameterized query prevents SQL injection
  const query = "SELECT id, username, password_hash, salt FROM users WHERE username = $1 LIMIT 1";
  const user = await db.query(query, [username]);

  if (!user || user.length === 0) {
    // Constant-time generic error to prevent user enumeration
    return { status: 401, error: "Invalid username or password." };
  }

  // FIX: Secure hash comparison using timingSafeEqual
  const isValid = verifyPassword(password, user[0].password_hash, user[0].salt);
  if (!isValid) {
    return { status: 401, error: "Invalid username or password." };
  }

  return {
    status: 200,
    token: generateJwt({ sub: user[0].id }, JWT_SECRET, { expiresIn: '1h' }),
    user: { id: user[0].id, username: user[0].username }
  };
}
`,
    simulatedTrace: `SecurityAlert: SQL Injection Vector detected!
    Payload: username = "' OR '1'='1' --"
    Target line: solution.js:7
    Query rendered: SELECT * FROM users WHERE username = '' OR '1'='1' --' AND password = ''`,
    testCases: [
      { id: 'auth-1', name: 'Standard Valid Credentials', input: '{"username": "alice", "password": "correctPassword"}', expected: 'status: 200', type: 'Happy' },
      { id: 'auth-2', name: 'SQLi Exploit: 1=1 bypass', input: '{"username": "admin\' OR \'1\'=\'1", "password": "x"}', expected: 'status: 401', type: 'Security' },
      { id: 'auth-3', name: 'SQLi Exploit: Stacked queries', input: '{"username": "admin\'; DROP TABLE users;--", "password": "x"}', expected: 'status: 401', type: 'Security' },
      { id: 'auth-4', name: 'Empty Credentials', input: '{"username": "", "password": ""}', expected: 'status: 400', type: 'Edge' },
      { id: 'auth-5', name: 'Malformed JSON Payload', input: '{"username": null, "password": 12345}', expected: 'status: 400', type: 'Edge' }
    ],
    stepTrace: [
      { step: 1, line: 4, vars: { reqBody: '{ username: "admin\' OR \'1\'=\'1", password: "x" }', stage: 'Extracting inputs' } },
      { step: 2, line: 7, vars: { rawConcat: true, query: "SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'x'" } },
      { step: 3, line: 8, vars: { alert: 'VULNERABILITY: Unescaped single quotes bypass WHERE clause logic' } },
      { step: 4, line: 10, vars: { dbResultCount: 42, leakedAccounts: 'all rows returned' } }
    ]
  },
  {
    id: 'binary-search-buggy',
    name: 'Broken Binary Search (Off-by-One & Bounds)',
    language: 'javascript',
    category: 'Algorithms & Logic',
    description: 'Classic search algorithm with integer overflow on midpoint calculation and off-by-one boundary conditions failing on edge elements.',
    code: `// Performs Binary Search on a sorted array
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length; // BUG 1: Should be arr.length - 1

  // BUG 2: Condition < instead of <= misses the final boundary element
  while (low < high) {
    // BUG 3: Potential float or integer overflow without Math.floor
    let mid = (low + high) / 2;
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      low = mid; // BUG 4: Should be mid + 1, causes infinite loop
    } else {
      high = mid; // BUG 5: Should be mid - 1
    }
  }

  return -1; // Not found
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Index of 91:", binarySearch(numbers, 91));
`,
    fixedCode: `// Performs Binary Search on a sorted array (Robust & Safe)
function binarySearch(arr, target) {
  if (!Array.isArray(arr)) {
    throw new TypeError("First argument must be an array.");
  }

  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    // Safe bitwise right shift avoids float/overflow and truncates
    const mid = low + Math.floor((high - low) / 2);
    const midVal = arr[mid];

    if (midVal === target) {
      return mid;
    } else if (midVal < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Index of 91:", binarySearch(numbers, 91));
`,
    simulatedTrace: `InfiniteLoopWarning: Loop at line 7 exceeded 5000 iterations.
    State: low = 8, high = 9, mid = 8.5
    arr[mid] evaluated to undefined (float index)`,
    testCases: [
      { id: 'bs-1', name: 'Search Middle Element (23)', input: '([2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 23)', expected: '5', type: 'Happy' },
      { id: 'bs-2', name: 'Search First Element (2)', input: '([2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 2)', expected: '0', type: 'Boundary' },
      { id: 'bs-3', name: 'Search Last Element (91)', input: '([2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 91)', expected: '9', type: 'Boundary' },
      { id: 'bs-4', name: 'Element Not Present (42)', input: '([2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 42)', expected: '-1', type: 'Edge' },
      { id: 'bs-5', name: 'Single Element Array Match', input: '([100], 100)', expected: '0', type: 'Boundary' },
      { id: 'bs-6', name: 'Empty Array', input: '([], 5)', expected: '-1', type: 'Edge' }
    ],
    stepTrace: [
      { step: 1, line: 3, vars: { low: 0, high: 9, target: 91 } },
      { step: 2, line: 7, vars: { low: 0, high: 9, mid: 4, 'arr[4]': 16, comparison: '16 < 91' } },
      { step: 3, line: 12, vars: { low: 5, high: 9, updated: 'low = mid + 1' } },
      { step: 4, line: 7, vars: { low: 5, high: 9, mid: 7, 'arr[7]': 56, comparison: '56 < 91' } },
      { step: 5, line: 12, vars: { low: 8, high: 9, updated: 'low = mid + 1' } },
      { step: 6, line: 7, vars: { low: 8, high: 9, mid: 8, 'arr[8]': 72, comparison: '72 < 91' } },
      { step: 7, line: 12, vars: { low: 9, high: 9, updated: 'low = mid + 1' } },
      { step: 8, line: 7, vars: { low: 9, high: 9, mid: 9, 'arr[9]': 91, comparison: 'MATCH FOUND' } },
      { step: 9, line: 9, vars: { returnedIndex: 9, status: 'Completed in 4 iterations' } }
    ]
  },
  {
    id: 'memory-leak-event',
    name: 'Event Listener Memory Leak (Resource Bug)',
    language: 'javascript',
    category: 'Memory & Concurrency',
    description: 'DOM or WebSocket listener attached repeatedly inside a periodic timer or render loop without unregistering cleanup handlers.',
    code: `// Real-time metrics streaming subscriber
class MetricsFeed {
  constructor(socket) {
    this.socket = socket;
    this.cache = [];
  }

  subscribe(topic) {
    // BUG 1: Appending duplicate listeners every time subscribe is called
    // BUG 2: Unbounded memory growth in this.cache array
    this.socket.on("message", (payload) => {
      this.cache.push(payload); // Memory leak: never cleared
      console.log("Received telemetry for " + topic, payload.length);
    });

    // BUG 3: Interval timer created without being retained or cleared
    setInterval(() => {
      this.socket.emit("heartbeat", Date.now());
    }, 1000);
  }

  // BUG 4: Missing destroy() or unsubscribe() lifecycle method
}
`,
    fixedCode: `// Real-time metrics streaming subscriber (Leak-proof & Clean)
class MetricsFeed {
  constructor(socket, maxCacheSize = 500) {
    this.socket = socket;
    this.cache = [];
    this.maxCacheSize = maxCacheSize;
    this.heartbeatTimer = null;
    this.messageHandler = null;
  }

  subscribe(topic) {
    this.unsubscribe(); // Clean up previous listeners if any

    this.messageHandler = (payload) => {
      if (this.cache.length >= this.maxCacheSize) {
        this.cache.shift(); // Evict oldest entry (bounded ring buffer)
      }
      this.cache.push(payload);
    };

    this.socket.on("message", this.messageHandler);

    this.heartbeatTimer = setInterval(() => {
      this.socket.emit("heartbeat", Date.now());
    }, 1000);
  }

  unsubscribe() {
    if (this.messageHandler) {
      this.socket.off("message", this.messageHandler);
      this.messageHandler = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  destroy() {
    this.unsubscribe();
    this.cache = [];
  }
}
`,
    simulatedTrace: `MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
    11 message listeners added to [Socket]. Use emitter.setMaxListeners() to increase limit.
    Heap snapshot: Retained size 48.2 MB in (closure scope)`,
    testCases: [
      { id: 'mem-1', name: 'Subscribe and receive message', input: 'topic: "cpu_usage"', expected: 'cache.length === 1', type: 'Happy' },
      { id: 'mem-2', name: 'Multiple re-subscriptions leak test', input: 'subscribe("mem") x 20', expected: 'listeners === 1', type: 'Memory' },
      { id: 'mem-3', name: 'Unsubscribe stops heartbeats', input: 'unsubscribe()', expected: 'heartbeatTimer === null', type: 'Resource' },
      { id: 'mem-4', name: 'Ring buffer bound limit check', input: 'messages > 500', expected: 'cache.length <= 500', type: 'Boundary' }
    ],
    stepTrace: [
      { step: 1, line: 4, vars: { socketListeners: 1, cacheSize: 0 } },
      { step: 2, line: 8, vars: { socketListeners: 2, leakWarning: 'Listener added without prior removal' } },
      { step: 3, line: 14, vars: { activeIntervals: 1, timerRef: 'lost in local scope' } },
      { step: 4, line: 8, vars: { socketListeners: 3, activeIntervals: 2, state: 'CRITICAL MEMORY LEAK' } }
    ]
  }
];
