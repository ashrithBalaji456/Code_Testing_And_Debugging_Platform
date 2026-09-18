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
  },
  {
    id: 'python-fibonacci',
    name: 'Python: Buggy Recursion (RecursionLimit)',
    language: 'python',
    category: 'Algorithms & Logic',
    description: 'Python exponential recursion with off-by-one base cases causing RecursionError: maximum recursion depth exceeded.',
    code: `# Computes the N-th Fibonacci number in Python
def fibonacci(n):
    # BUG 1: Missing negative number guard
    # BUG 2: Incorrect base case (fib(0) should be 0, not 1)
    if n <= 1:
        return 1

    # BUG 3: Unmemoized exponential recursion O(2^N)
    # BUG 4: Exceeds default sys.getrecursionlimit() on large inputs
    return fibonacci(n - 1) + fibonacci(n - 2)

# Sample run
result = fibonacci(6)
print(f"Fibonacci(6) = {result}")
`,
    fixedCode: `# Computes the N-th Fibonacci number with functools.lru_cache and type guards
from functools import lru_cache

@lru_cache(maxsize=1024)
def fibonacci(n: int) -> int:
    if not isinstance(n, int) or n < 0:
        raise ValueError("Fibonacci input must be a non-negative integer.")
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)

# Sample run
result = fibonacci(6)
print(f"Fibonacci(6) = {result}")
`,
    simulatedTrace: `RecursionError: maximum recursion depth exceeded while calling a Python object
  File "solution.py", line 10, in fibonacci
  File "solution.py", line 10, in fibonacci
  File "solution.py", line 10, in fibonacci`,
    testCases: [
      { id: 'py-fib-1', name: 'Base case fib(0)', input: '0', expected: '0', type: 'Edge' },
      { id: 'py-fib-2', name: 'Base case fib(1)', input: '1', expected: '1', type: 'Happy' },
      { id: 'py-fib-3', name: 'Standard fib(6)', input: '6', expected: '8', type: 'Happy' },
      { id: 'py-fib-4', name: 'Double digit fib(10)', input: '10', expected: '55', type: 'Happy' },
      { id: 'py-fib-5', name: 'Negative value fib(-4)', input: '-4', expected: 'Error', type: 'Error' },
      { id: 'py-fib-6', name: 'High order fib(25)', input: '25', expected: '75025', type: 'Performance' }
    ],
    stepTrace: [
      { step: 1, line: 2, vars: { n: 4, depth: 1, func: 'fibonacci' } },
      { step: 2, line: 10, vars: { n: 4, branch: 'fib(3)', depth: 2 } },
      { step: 3, line: 2, vars: { n: 3, depth: 3, branch: 'fib(2)' } },
      { step: 4, line: 6, vars: { n: 1, reached_base: true, returned: 1 } },
      { step: 5, line: 10, vars: { n: 2, left_res: 1, recursing: 'fib(0)' } },
      { step: 6, line: 6, vars: { n: 0, bug_return: 1, expected: 0 } },
      { step: 7, line: 10, vars: { final_n_4: 3, call_count: 9 } }
    ]
  },
  {
    id: 'python-mutable-default',
    name: 'Python: Mutable Default Argument Gotcha',
    language: 'python',
    category: 'Language Quirks',
    description: 'A classic Python gotcha where a mutable list default argument accumulates state across independent function calls.',
    code: `# Task management helper with mutable default argument
def add_task(title, priority="medium", task_list=[]):
    # BUG: task_list=[] is evaluated ONCE at function definition time!
    # Subsequent calls share and mutate the exact same list instance in memory.
    task_list.append({"title": title, "priority": priority})
    return task_list

# Demonstration of the accumulation bug:
user1_tasks = add_task("Write unit tests")
print("User 1 tasks:", user1_tasks)

user2_tasks = add_task("Deploy to prod")
print("User 2 tasks:", user2_tasks) # BUG: Contains User 1's tasks!
`,
    fixedCode: `# Task management helper (Fixed with None default pattern)
from typing import Optional, List, Dict

def add_task(title: str, priority: str = "medium", task_list: Optional[List[Dict]] = None) -> List[Dict]:
    # FIX: Use None sentinel to instantiate a fresh list on each invocation
    if task_list is None:
        task_list = []
    
    task_list.append({"title": title, "priority": priority})
    return task_list

# Demonstration:
user1_tasks = add_task("Write unit tests")
print("User 1 tasks:", user1_tasks)

user2_tasks = add_task("Deploy to prod")
print("User 2 tasks:", user2_tasks)
`,
    simulatedTrace: `StateAccumulationError: Variable 'task_list' retained 2 items across isolated calls.
  Call 1 produced 1 items.
  Call 2 produced 2 items instead of 1.
  Default parameter evaluated at compile time: id(task_list) is shared.`,
    testCases: [
      { id: 'py-mut-1', name: 'First invocation length 1', input: '"Task A"', expected: '[{"title": "Task A", "priority": "medium"}]', type: 'Happy' },
      { id: 'py-mut-2', name: 'Second invocation isolation', input: '"Task B"', expected: '[{"title": "Task B", "priority": "medium"}]', type: 'Edge' },
      { id: 'py-mut-3', name: 'Explicit existing list', input: '("Task C", "high", [{"title": "Old"}])', expected: '2 items', type: 'Happy' }
    ],
    stepTrace: [
      { step: 1, line: 2, vars: { default_arg_id: '0x7f9a10', items_in_default: 0 } },
      { step: 2, line: 5, vars: { call_1: 'user1', default_arg_id: '0x7f9a10', count: 1 } },
      { step: 3, line: 2, vars: { call_2: 'user2', default_arg_id: '0x7f9a10', BUG_RETAINED_ITEMS: 1 } },
      { step: 4, line: 5, vars: { call_2_result_count: 2, leaked_data: 'Cross-call state pollution' } }
    ]
  },
  {
    id: 'python-flask-sqli',
    name: 'Python: Flask / SQLite f-string SQL Injection',
    language: 'python',
    category: 'Security & Auth',
    description: 'Python web endpoint using vulnerable f-string SQL query formatting, hardcoded SECRET_KEY, and bare except blocks.',
    code: `import sqlite3

# SECURITY BUG 1: Hardcoded cryptographic secret
SECRET_KEY = "insecure_dev_secret_key_998877"

def get_user_profile(db_connection, username):
    # SECURITY BUG 2: f-string SQL query string interpolation (SQL Injection)
    query = f"SELECT id, username, email FROM users WHERE username = '{username}'"
    print(f"Executing query: {query}")
    
    cursor = db_connection.cursor()
    
    # BUG 3: Bare except clause suppresses keyboard interrupt and critical errors
    try:
        cursor.execute(query)
        return cursor.fetchone()
    except:
        return None
`,
    fixedCode: `import sqlite3
import os

# Secured via environment variable
SECRET_KEY = os.environ.get("SECRET_KEY", "")

def get_user_profile(db_connection, username: str):
    if not username or not isinstance(username, str):
        raise ValueError("Invalid username parameter.")
        
    # FIX: Parameterized query using ? placeholder prevents SQL injection
    query = "SELECT id, username, email FROM users WHERE username = ?"
    cursor = db_connection.cursor()
    
    try:
        cursor.execute(query, (username,))
        return cursor.fetchone()
    except sqlite3.DatabaseError as err:
        print(f"Database query error: {err}")
        return None
`,
    simulatedTrace: `SecurityAlert: SQL Injection Vector detected in f-string query!
  File "solution.py", line 8, in get_user_profile
  Rendered query: SELECT id, username, email FROM users WHERE username = 'admin' OR '1'='1'
  Unescaped quotes bypass authentication filter.`,
    testCases: [
      { id: 'py-sql-1', name: 'Normal lookup', input: '(db, "alice")', expected: 'Valid profile', type: 'Happy' },
      { id: 'py-sql-2', name: 'SQLi attack payload: \' OR \'1\'=\'1', input: '(db, "admin\' OR \'1\'=\'1")', expected: 'None', type: 'Security' },
      { id: 'py-sql-3', name: 'SQLi stacked query attack', input: '(db, "admin\'; DROP TABLE users;--")', expected: 'None', type: 'Security' },
      { id: 'py-sql-4', name: 'Null or empty username', input: '(db, "")', expected: 'Error', type: 'Edge' }
    ],
    stepTrace: [
      { step: 1, line: 7, vars: { username: "admin' OR '1'='1", func: 'get_user_profile' } },
      { step: 2, line: 8, vars: { raw_fstring: "SELECT ... WHERE username = 'admin' OR '1'='1'" } },
      { step: 3, line: 15, vars: { alert: 'OWASP Top 10: A03 Injection via unescaped f-string' } },
      { step: 4, line: 16, vars: { db_compromised: true } }
    ]
  },
  {
    id: 'java-null-pointer',
    name: 'Java: Unsafe Unboxing & NullPointerException',
    language: 'java',
    category: 'Memory & Exceptions',
    description: 'Java method automatically unboxing wrapper types (Integer to int) without null validation, causing fatal NullPointerException at runtime.',
    code: `public class Solution {
    // BUG 1: Unsafe unboxing: if price or discount is null, JVM throws NullPointerException
    public static double calculateFinalPrice(Double price, Integer discountPercent) {
        // BUG 2: Direct arithmetic on nullable objects triggers auto-unboxing
        if (discountPercent > 100) {
            return 0.0;
        }
        
        // BUG 3: Missing validation for negative price
        double discountAmount = price * (discountPercent / 100.0);
        return price - discountAmount;
    }

    public static void main(String[] args) {
        System.out.println("Result: " + calculateFinalPrice(null, 20)); // Crashes with NPE!
    }
}
`,
    fixedCode: `import java.util.Optional;
import java.util.Objects;

public class Solution {
    /**
     * Calculates final price with defensive null guards and Optional pattern.
     */
    public static double calculateFinalPrice(Double price, Integer discountPercent) {
        // Defensive validation prevents NullPointerException
        Objects.requireNonNull(price, "Price cannot be null");
        int safeDiscount = Optional.ofNullable(discountPercent).orElse(0);

        if (price < 0.0) {
            throw new IllegalArgumentException("Price must be non-negative");
        }
        if (safeDiscount < 0 || safeDiscount > 100) {
            throw new IllegalArgumentException("Discount must be between 0 and 100");
        }

        double discountAmount = price * (safeDiscount / 100.0);
        return price - discountAmount;
    }

    public static void main(String[] args) {
        System.out.println("Result: " + calculateFinalPrice(100.0, 20));
    }
}
`,
    simulatedTrace: `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "java.lang.Double.doubleValue()" because "price" is null
    at Solution.calculateFinalPrice(Solution.java:9)
    at Solution.main(Solution.java:15)`,
    testCases: [
      { id: 'java-npe-1', name: 'Normal 20% discount on $100', input: '(100.0, 20)', expected: '80.0', type: 'Happy' },
      { id: 'java-npe-2', name: 'Null price handling', input: '(null, 20)', expected: 'Error', type: 'Edge' },
      { id: 'java-npe-3', name: 'Null discount defaults to 0%', input: '(100.0, null)', expected: '100.0', type: 'Edge' },
      { id: 'java-npe-4', name: 'Negative price guard', input: '(-50.0, 10)', expected: 'Error', type: 'Boundary' }
    ],
    stepTrace: [
      { step: 1, line: 3, vars: { price: 'null', discountPercent: 20 } },
      { step: 2, line: 5, vars: { check: 'discountPercent > 100', passed: false } },
      { step: 3, line: 9, vars: { unboxAttempt: 'price.doubleValue()', exception: 'NullPointerException' } }
    ]
  },
  {
    id: 'cpp-memory-leak',
    name: 'C++: Raw Pointer Memory Leak (Missing delete[])',
    language: 'cpp',
    category: 'Memory Management',
    description: 'Dynamic allocation using raw "new int[]" without corresponding "delete[]", causing persistent heap memory leaks and lack of RAII.',
    code: `#include <iostream>
#include <vector>

class DataBuffer {
private:
    int* buffer;
    size_t capacity;

public:
    DataBuffer(size_t size) : capacity(size) {
        // MEMORY BUG 1: Raw dynamic allocation on heap
        buffer = new int[capacity];
    }

    void fill(int value) {
        for (size_t i = 0; i <= capacity; ++i) { // BUG 2: Off-by-one buffer overflow (<= vs <)
            buffer[i] = value;
        }
    }

    // MEMORY BUG 3: Missing destructor ~DataBuffer() to call delete[] buffer!
};

int main() {
    for (int i = 0; i < 10000; ++i) {
        DataBuffer buf(1024); // Leaks 4KB on every iteration!
        buf.fill(42);
    }
    std::cout << "Done" << std::endl;
    return 0;
}
`,
    fixedCode: `#include <iostream>
#include <vector>
#include <memory>

// Modern C++20: Uses std::vector (RAII) to eliminate raw pointers and leaks completely
class DataBuffer {
private:
    std::vector<int> buffer;

public:
    explicit DataBuffer(size_t size) : buffer(size, 0) {}

    void fill(int value) {
        // Bounds-safe iteration with std::fill
        std::fill(buffer.begin(), buffer.end(), value);
    }

    size_t size() const noexcept {
        return buffer.size();
    }
};

int main() {
    for (int i = 0; i < 10000; ++i) {
        DataBuffer buf(1024); // Memory automatically deallocated at scope exit
        buf.fill(42);
    }
    std::cout << "Done: 0 bytes leaked." << std::endl;
    return 0;
}
`,
    simulatedTrace: `==31245==ERROR: LeakSanitizer: detected memory leaks
Direct leak of 40960000 byte(s) in 10000 object(s) allocated from:
    #0 0x7f88414 in operator new[](unsigned long)
    #1 0x40120b in DataBuffer::DataBuffer(unsigned long) solution.cpp:11
    #2 0x4012bb in main solution.cpp:24
SUMMARY: AddressSanitizer: 40.96 MB leaked in 10000 allocations.`,
    testCases: [
      { id: 'cpp-leak-1', name: 'Standard allocation & fill', input: '1024', expected: 'Allocated 1024 elements', type: 'Happy' },
      { id: 'cpp-leak-2', name: 'Scope exit leak verification', input: 'iterations: 10000', expected: '0 bytes leaked', type: 'Memory' },
      { id: 'cpp-leak-3', name: 'Boundary index guard', input: 'index == capacity', expected: 'No out-of-bounds access', type: 'Boundary' }
    ],
    stepTrace: [
      { step: 1, line: 11, vars: { allocated_bytes: 4096, pointer: '0x55a9b0' } },
      { step: 2, line: 15, vars: { index: 1024, max_valid_index: 1023, alert: 'BUFFER OVERFLOW WRITE' } },
      { step: 3, line: 24, vars: { scope_exit: true, destructor_called: false, leaked_bytes: 4096 } }
    ]
  }
];
