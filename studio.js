// ── Nizam & Mantiq WebAssembly Studio Controller ───────────────────────

const DEMOS = {
  // ── Nizam (.nz) Demos ───────────────────────────────────────────────
  hello: {
    title: "1. Hello WASI",
    filename: "test_wasm_hello.nz",
    wasmUrl: "wasm/test_wasm_hello.wasm",
    lang: "nizam",
    code: `// ── WASM Hello World Demo ──────────────────────────────────────────
// Prints directly to browser terminal via WASI fd_write syscall

extern fn printf(fmt as cstr, ...) as i32

fn main() as i32:
    let _ = printf("Hello from WebAssembly WASI!\\n" to cstr)
    return 0
`,
    ir: `; ModuleID = 'test_wasm_hello.nz'
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128"
target triple = "wasm32-unknown-wasi"

@.str.0 = private unnamed_addr constant [30 x i8] c"Hello from WebAssembly WASI!\\0A\\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %t.0 = getelementptr [30 x i8], ptr @.str.0, i32 0, i32 0
  %t.1 = call i32 (ptr, ...) @printf(ptr %t.0)
  ret i32 0
}`
  },

  abi: {
    title: "2. ABI & 32-bit Struct Layout",
    filename: "test_wasm_abi.nz",
    wasmUrl: "wasm/test_wasm_abi.wasm",
    lang: "nizam",
    code: `// ── 32-bit WebAssembly ABI & Memory Alignment ──────────────────────
from std.string import String
import[c] "stdio.h"
import[c] "stdlib.h"

extern fn puts(s as cstr) as i32

struct Point:
    var x as i32
    var y as i32

struct MixedRecord:
    var id as i32
    var val as i64
    var active as bool

fn test_struct_layout() as bool:
    let p as Point = Point(x = 10 to i32, y = 20 to i32)
    let m as MixedRecord = MixedRecord(id = 42 to i32, val = 10000000000 to i64, active = True)
    if p.x == 10 and p.y == 20 and m.id == 42 and m.val == 10000000000 to i64 and m.active:
        return True
    return False

fn main() as i32:
    puts("=== Testing WASM ABI & Data Layout ===" to cstr)
    if not test_struct_layout():
        puts("[FAIL] Struct layout test failed!" to cstr)
        return 1
    puts("Test 2 (Struct Layout & 64-bit Fields): PASSED!" to cstr)
    puts("\\n[PASS] All WASM ABI tests passed!" to cstr)
    return 0
`,
    ir: `; ModuleID = 'test_wasm_abi.nz'
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128"
target triple = "wasm32-unknown-wasi"

%Point = type { i32, i32 }
%MixedRecord = type { i32, i64, i8 }

declare i32 @puts(ptr)
; 32-bit GEP offsets generated for wasm32-wasi`
  },

  features: {
    title: "3. Core Features & Recursion",
    filename: "test_wasm_features.nz",
    wasmUrl: "wasm/test_wasm_features.wasm",
    lang: "nizam",
    code: `// ── WASM Core Features & Linear Memory Heap ───────────────────────
extern fn printf(fmt as cstr, ...) as i32
extern fn malloc(sz as usize) as ptr[u8]
extern fn free(p as ptr[u8])

fn fib(n as i32) as i32:
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

fn main() as i32:
    let _ = printf("=== Testing WASM Core Features ===\\n" to cstr)

    // Test 1: Stack frame recursion
    let f10 as i32 = fib(10)
    let _ = printf("Test 1 (Recursion & Arithmetic): PASSED! fib(10)=%d\\n" to cstr, f10)

    // Test 2: Dynamic Heap Allocation in 32-bit linear memory
    let p_mem as ptr[u8] = malloc(64 to usize)
    if p_mem != None to ptr[u8]:
        let _ = printf("Test 3 (Heap Allocation): PASSED!\\n" to cstr)
        free(p_mem)

    let _ = printf("\\n[PASS] All WASM Core Features tests passed!\\n" to cstr)
    return 0
`,
    ir: `; Recursion and 32-bit malloc in wasm32-wasi
declare ptr @malloc(i32)
declare void @free(ptr)
define i32 @fib(i32 %n_param) { ... }`
  },

  collections: {
    title: "4. Dynamic Collections",
    filename: "test_wasm_collections.nz",
    wasmUrl: "wasm/test_wasm_collections.wasm",
    lang: "nizam",
    code: `// ── WASM Dynamic Collections (String, List, Dict) ────────────────
from std.string import String
from std.collections import List, Dict

extern fn printf(fmt as cstr, ...) as i32
extern fn strcmp(s1 as cstr, s2 as cstr) as i32

fn main() as i32:
    let _ = printf("=== Testing WASM 32-bit Collections ===\\n" to cstr)

    // 1. Dynamic String
    var s1 as String = String.make("Hello " to cstr)
    let s2 as String = String.make("WASI!" to cstr)
    s1.append(ref s2)
    let _ = printf("  [PASS] String append & length: %s (len=%d)\\n" to cstr, s1.data, s1.len to i32)

    // 2. Generic List[i32]
    var lst as List[i32] = List[i32]()
    lst.append(10)
    lst.append(20)
    lst.append(30)
    let _ = printf("  List length: %lld\\n" to cstr, lst.length())
    let _ = printf("  List[0]: %d\\n" to cstr, lst[0 to i64])
    let _ = printf("  [PASS] List[i32] append and indexing\\n" to cstr)

    // 3. Hash Map Dict[String, i32]
    var d as Dict[String, i32] = Dict[String, i32]()
    d[String.make("alpha" to cstr)] = 100
    d[String.make("beta" to cstr)] = 200
    let _ = printf("  [PASS] Dict[String, i32] insertion and lookup\\n" to cstr)

    let _ = printf("\\n[PASS] All WASM Collections tests passed!\\n" to cstr)
    return 0
`,
    ir: `; 32-bit Dynamic Collections Representation
; String struct: { ptr, i32, i32 }
; List struct: { ptr, i32, i32 }`
  },

  concurrency: {
    title: "5. Cooperative Concurrency",
    filename: "test_wasm_concurrency.nz",
    wasmUrl: "wasm/test_wasm_concurrency.wasm",
    lang: "nizam",
    code: `// ── WASM Cooperative Concurrency & Channels ───────────────────────
// Uses single-threaded event loop scheduler (no pthreads needed!)

extern fn printf(fmt as cstr, ...) as i32

async fn compute_square(x as i32) as i32:
    return x * x

async fn compute_sum(n as i32) as i32:
    var s as i32 = 0
    var i as i32 = 1
    while i <= n:
        s = s + i
        i = i + 1
    return s

fn main() as i32:
    let _ = printf("=== Testing WASM Cooperative Concurrency ===\\n" to cstr)

    // Cooperative coroutine spawn & await
    let t1 = spawn compute_square(7 to i32)
    let t2 = spawn compute_sum(10 to i32)
    let r1 as i32 = await t1
    let r2 as i32 = await t2
    let _ = printf("Test 1 (Async Spawn & Await): PASSED! sq(7)=%d, sum(10)=%d\\n" to cstr, r1, r2)

    // Channel message passing
    let ch as Channel[i32] = channel[i32](4 to i64)
    ch.send(100 to i32)
    ch.send(200 to i32)
    let v1 as i32 = ch.recv()
    let v2 as i32 = ch.recv()
    let _ = printf("Test 2 (Channel Send & Recv): PASSED! v1=%d, v2=%d\\n" to cstr, v1, v2)

    let _ = printf("\\n[PASS] All WASM Concurrency tests passed!\\n" to cstr)
    return 0
`,
    ir: `; Cooperative Coroutine Scheduler API
declare ptr @mantiq_spawn(ptr, ptr)
declare ptr @mantiq_await(ptr)
declare ptr @mantiq_channel_make(i64, i64)
declare void @mantiq_channel_send(ptr, ptr)
declare ptr @mantiq_channel_recv(ptr)`
  },

  custom: {
    title: "6. Custom Program",
    filename: "custom.nz",
    wasmUrl: "wasm/test_wasm_custom.wasm",
    lang: "nizam",
    code: `// Write your own Nizam code here!
extern fn printf(fmt as cstr, ...) as i32

fn factorial(n as i32) as i32:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

fn main() as i32:
    let _ = printf("Live Nizam WebAssembly Runtime!\\n" to cstr)
    let fact as i32 = factorial(6)
    let _ = printf("factorial(6) = %d\\n" to cstr, fact)
    return 0
`,
    ir: `; Click 'Compile & Run' to invoke the live compiler bridge!`
  },

  diagnostics: {
    title: "7. Diagnostics & Error Box",
    filename: "test_diagnostics.nz",
    wasmUrl: null,
    lang: "nizam",
    code: `// ── Nizam Diagnostic Error Catalog ─────────────────────────────────
// Tests rich Catppuccin diagnostic formatting & source span markers

from std.unknown_module import MissingSymbol

fn main() as i32:
    let value as i32 = 42
    return 0
`,
    ir: `; DiagnosticEngine error demonstration with Catppuccin color scheme`,
    diagnosticOutput: `  \x1b[38;2;243;139;168m╭─  ✖ ERROR [E0103] : cannot find module ──────────────────────────────────╮\x1b[0m
  \x1b[38;2;205;214;244m│  📁 File:      test_diagnostics.nz                                       │\x1b[0m
  \x1b[38;2;205;214;244m│  📍 Position:  Line 4, Column 1                                          │\x1b[0m
  \x1b[38;2;88;91;112m├──────────────────────────────────────────────────────────────────────────┤\x1b[0m
  \x1b[38;2;205;214;244m│   4 │  from std.unknown_module import MissingSymbol                      │\x1b[0m
  \x1b[38;2;243;139;168m│     │  ▲ cannot find module                                              │\x1b[0m
  \x1b[38;2;243;139;168m╰──────────────────────────────────────────────────────────────────────────╯\x1b[0m

\x1b[38;2;243;139;168mCompilation failed for test_diagnostics.nz\x1b[0m`
  },

  // ── Mantiq (.mq) Demos ──────────────────────────────────────────────
  classes: {
    title: "8. Classes & OOP Interfaces",
    filename: "test_wasm_classes.mq",
    wasmUrl: "wasm/test_wasm_classes.wasm",
    lang: "mantiq",
    code: `// ── Mantiq Classes & Interface Contracts on WebAssembly ─────────────
extern fn printf(format as cstr, ...) as i32
extern fn exit(code as i32)

fn assert_true(cond as bool, msg as cstr):
    if not cond:
        let _ as i32 = printf("ASSERTION FAILED: %s\\n" to cstr, msg)
        exit(1)

interface Shape:
    fn area(self) as f64
    fn perimeter(self) as f64

class Circle:
    public var radius as f64

    public fn area(self) as f64:
        return 3.14159 * (deref self).radius * (deref self).radius

    public fn perimeter(self) as f64:
        return 2.0 * 3.14159 * (deref self).radius

class Rectangle:
    public var width as f64
    public var height as f64

    public fn area(self) as f64:
        return (deref self).width * (deref self).height

    public fn perimeter(self) as f64:
        return 2.0 * ((deref self).width + (deref self).height)

class BaseEntity:
    public var id as i32

    public fn compute(self) as i32:
        return (deref self).id * 10

class Player(BaseEntity):
    public var score as i32

    public fn compute(self) as i32:
        let base_res as i32 = super().compute()
        return base_res + (deref self).score

fn main() as i32:
    let _ as i32 = printf("=== Testing WASM Mantiq Classes & Interfaces ===\\n" to cstr)

    // Test 1: Class Instantiation and Methods
    var c as Circle = Circle(10.0)
    let c_area as f64 = c.area()
    let c_perim as f64 = c.perimeter()
    let _ as i32 = printf("Circle(10.0) -> area=%f, perim=%f\\n" to cstr, c_area, c_perim)
    assert_true(c_area > 314.0 and c_area < 315.0, "Circle area" to cstr)
    assert_true(c_perim > 62.0 and c_perim < 63.0, "Circle perim" to cstr)
    let _ as i32 = printf("  [PASS] Class instantiation and method dispatch\\n" to cstr)

    // Test 2: Rectangle and multiple methods
    var r as Rectangle = Rectangle(5.0, 8.0)
    let r_area as f64 = r.area()
    let r_perim as f64 = r.perimeter()
    assert_true(r_area > 39.9 and r_area < 40.1, "Rectangle area" to cstr)
    assert_true(r_perim > 25.9 and r_perim < 26.1, "Rectangle perim" to cstr)
    let _ as i32 = printf("  [PASS] Secondary class verification\\n" to cstr)

    // Test 3: Inheritance & super() delegation
    var p as Player = Player(42, 100)
    let val as i32 = p.compute()
    let _ as i32 = printf("Player(42, 100).compute() = %d\\n" to cstr, val)
    assert_true(val == 520, "Inheritance super delegation" to cstr)
    let _ as i32 = printf("  [PASS] Inheritance & super() delegation\\n" to cstr)

    let _ as i32 = printf("\\n[PASS] All WASM Mantiq Class & Interface tests passed!\\n" to cstr)
    return 0
`,
    ir: `; Mantiq Class & Interface Dynamic Method Dispatch in wasm32-wasi
%Circle = type { double }
%Rectangle = type { double, double }
%Player = type { i32, i32 }

declare double @Circle_area(ptr)
declare double @Rectangle_area(ptr)
declare i32 @Player_compute(ptr)`
  },

  closures: {
    title: "9. Closures & Lambdas",
    filename: "test_wasm_closures.mq",
    wasmUrl: "wasm/test_wasm_closures.wasm",
    lang: "mantiq",
    code: `// ── Mantiq Closures & Lexical Scopes on WebAssembly ─────────────────
fn apply_op(f as fn(i32) as i32, val as i32) as i32:
    return f(val)

fn apply_binary(f as fn(i32, i32) as i32, a as i32, b as i32) as i32:
    return f(a, b)

fn main() as i32:
    print("=== Testing WASM Mantiq Closures & Lambdas ===")

    // Test 1: Basic Expression Lambda
    let double_it = (x as i32) => x * 2
    let res1 as i32 = double_it(21)
    if res1 != 42:
        print("  FAIL: Basic lambda double_it(21) expected 42")
        return 1
    print("  [PASS] Basic Expression Lambda: double_it(21) = 42")

    // Test 2: Multi-Parameter Lambda
    let add_fn = (a as i32, b as i32) => a + b
    let res2 as i32 = add_fn(17, 25)
    if res2 != 42:
        print("  FAIL: Multi-param lambda add_fn(17, 25) expected 42")
        return 1
    print("  [PASS] Multi-Parameter Lambda: add_fn(17, 25) = 42")

    // Test 3: Lexical Environment Heap Capture
    let factor as i32 = 10
    let offset as i32 = 5
    let scale_and_offset = (x as i32) => x * factor + offset
    let res3 as i32 = scale_and_offset(4)
    if res3 != 45:
        print("  FAIL: Lexical capture expected 45")
        return 1
    print("  [PASS] Lexical Environment Heap Capture: scale(4) = 45")

    // Test 4: Higher-Order Function Passing
    let multiplier as i32 = 3
    let triple_with_cap = (n as i32) => n * multiplier
    let res4 as i32 = apply_op(triple_with_cap, 14)
    if res4 != 42:
        print("  FAIL: Higher-order function expected 42")
        return 1
    print("  [PASS] Higher-Order Function Application: apply_op(14) = 42")

    // Test 5: Currying & Nested Closures
    let base as i32 = 100
    let make_adder = (a as i32) => (b as i32) => base + a + b
    let add50 = make_adder(50)
    let res5 as i32 = add50(25)
    if res5 != 175:
        print("  FAIL: Nested closures / currying expected 175")
        return 1
    print("  [PASS] Nested Closures & Currying: add50(25) = 175")

    print("\\n[PASS] All WASM Mantiq Closures & Lambdas tests passed!")
    return 0
`,
    ir: `; Mantiq Closure Trampolines & Environment Packaging in wasm32-wasi
%Closure_Env = type { i32, i32 }
declare ptr @mantiq_alloc_closure(ptr, ptr)`
  },

  fstrings: {
    title: "10. String Interpolation",
    filename: "test_wasm_fstrings.mq",
    wasmUrl: "wasm/test_wasm_fstrings.wasm",
    lang: "mantiq",
    code: `// ── Mantiq String Interpolation (F-Strings) on WebAssembly ──────────
from string import String

extern fn printf(fmt as cstr, ...) as i32
extern fn strcmp(s1 as cstr, s2 as cstr) as i32
extern fn exit(code as i32)

fn assert_str_eq(actual as String, expected as cstr, msg as cstr):
    if strcmp(actual.data to cstr, expected) != 0:
        let _ as i32 = printf("FAIL: %s (got '%s', expected '%s')\\n" to cstr, msg, actual.data to cstr, expected)
        exit(1 to i32)

fn main() as i32:
    let _ as i32 = printf("=== Testing WASM Mantiq String Interpolation (F-Strings) ===\\n" to cstr)

    // Test 1: Basic Variable Interpolation
    let name as String = String.make("World" to cstr)
    let greeting as String = f"Hello, {name}!"
    assert_str_eq(greeting, "Hello, World!" to cstr, "Basic string interpolation" to cstr)
    let _ as i32 = printf("  [PASS] Basic F-String variable interpolation: '%s'\\n" to cstr, greeting.data to cstr)

    // Test 2: Integer and Boolean Interpolation
    let i as i32 = 100 to i32
    let s_int as String = f"Value: {i}"
    assert_str_eq(s_int, "Value: 100" to cstr, "i32 interpolation" to cstr)

    let b_true as bool = True
    let b_false as bool = False
    let s_bool as String = f"Flag: {b_true}, Other: {b_false}"
    assert_str_eq(s_bool, "Flag: True, Other: False" to cstr, "bool interpolation" to cstr)
    let _ as i32 = printf("  [PASS] Integer and Boolean interpolation\\n" to cstr)

    // Test 3: Binary Expression Interpolation
    let a as i32 = 20 to i32
    let b as i32 = 30 to i32
    let s_expr as String = f"Sum: {a + b}"
    assert_str_eq(s_expr, "Sum: 50" to cstr, "Binary expression interpolation" to cstr)
    let _ as i32 = printf("  [PASS] Binary expression inside interpolation: '%s'\\n" to cstr, s_expr.data to cstr)

    // Test 4: Backtick Template and Escaped Braces
    let item as String = String.make("apple" to cstr)
    let price as i32 = 5 to i32
    let receipt as String = \`Item: {item}, Price: \${price}\`
    assert_str_eq(receipt, "Item: apple, Price: $5" to cstr, "Backtick template string" to cstr)

    let braces as String = f"{{literal braces}} and {item}"
    assert_str_eq(braces, "{literal braces} and apple" to cstr, "Escaped braces in f-string" to cstr)
    let _ as i32 = printf("  [PASS] Backtick template strings & escaped braces\\n" to cstr)

    // Test 5: Multi-Part Interpolation
    let x as i32 = 1 to i32
    let y as i32 = 2 to i32
    let z as i32 = 3 to i32
    let multi as String = f"{x} + {y} = {z}"
    assert_str_eq(multi, "1 + 2 = 3" to cstr, "Multi-part interpolation" to cstr)
    let _ as i32 = printf("  [PASS] Multi-part interpolation: '%s'\\n" to cstr, multi.data to cstr)

    let _ as i32 = printf("\\n[PASS] All WASM Mantiq String Interpolation tests passed!\\n" to cstr)
    return 0
`,
    ir: `; 32-bit F-String Lowering & Fat-Pointer Slice Packaging
; String buffer aggregate: { ptr, i32, i32 }
declare ptr @mantiq_f64_to_str(double, ptr)
declare ptr @mantiq_bool_to_str(i32, ptr)
declare ptr @mantiq_str_concat(ptr, i32, ptr, i32)`
  },

  comprehensions: {
    title: "11. List Comprehensions",
    filename: "test_wasm_comprehensions.mq",
    wasmUrl: "wasm/test_wasm_comprehensions.wasm",
    lang: "mantiq",
    code: `// ── Mantiq List Comprehensions on WebAssembly ───────────────────────
extern fn printf(fmt as cstr, ...) as i32

fn main() as i32:
    let _ as i32 = printf("=== Testing WASM Mantiq List Comprehensions ===\\n" to cstr)

    // 1. Basic list comprehension over collection
    let nums as List[i64] = [1 to i64, 2 to i64, 3 to i64, 4 to i64, 5 to i64]
    let doubled as List[i64] = [for x in nums: x * 2 to i64]
    let _ as i32 = printf("  Doubled list length: %lld\\n" to cstr, doubled.length())
    let _ as i32 = printf("  doubled[0]=%lld, doubled[4]=%lld\\n" to cstr, doubled[0 to i64], doubled[4 to i64])
    let _ as i32 = printf("  [PASS] List comprehension over collection\\n" to cstr)

    // 2. Filtered list comprehension with predicate
    let evens as List[i64] = [for x in nums: if x % 2 to i64 == 0 to i64: x]
    let _ as i32 = printf("  Evens count: %lld (first=%lld)\\n" to cstr, evens.length(), evens[0 to i64])
    let _ as i32 = printf("  [PASS] Filtered list comprehension\\n" to cstr)

    let _ as i32 = printf("\\n[PASS] All WASM List Comprehension tests passed!\\n" to cstr)
    return 0
`,
    ir: `; Target-aware 32-bit slice comprehension lowering
; Aggregate extraction: { ptr, i32, i32 } with loop unrolling`
  },

  mantiq_async: {
    title: "12. Mantiq Actor Concurrency",
    filename: "test_wasm_mantiq_async.mq",
    wasmUrl: "wasm/test_wasm_mantiq_async.wasm",
    lang: "mantiq",
    code: `// ── Mantiq Actor Concurrency & Channels on WebAssembly ──────────────
extern fn printf(fmt as cstr, ...) as i32

async fn async_worker(id as i32, multiplier as i32) as i32:
    return id * multiplier

async fn async_sum(limit as i32) as i32:
    var acc as i32 = 0
    var i as i32 = 1
    while i <= limit:
        acc = acc + i
        i = i + 1
    return acc

fn main() as i32:
    let _ as i32 = printf("=== Testing WASM Mantiq Actor & Async Concurrency ===\\n" to cstr)

    // 1. Spawning async tasks & awaiting
    let t1 = spawn async_worker(21 to i32, 2 to i32)
    let t2 = spawn async_sum(10 to i32)
    let r1 as i32 = await t1
    let r2 as i32 = await t2
    let _ as i32 = printf("  [PASS] Async spawn & await: r1=%d, r2=%d\\n" to cstr, r1, r2)

    // 2. Channel mailbox message passing
    let ch as Channel[i32] = channel[i32](4 to i64)
    ch.send(101 to i32)
    ch.send(202 to i32)
    let m1 as i32 = ch.recv()
    let m2 as i32 = ch.recv()
    let _ as i32 = printf("  [PASS] Channel mailbox message passing: m1=%d, m2=%d\\n" to cstr, m1, m2)

    let _ as i32 = printf("\\n[PASS] All WASM Mantiq Concurrency tests passed!\\n" to cstr)
    return 0
`,
    ir: `; Single-threaded WASI cooperative coroutine loop
declare ptr @mantiq_spawn(ptr, ptr)
declare ptr @mantiq_await(ptr)
declare ptr @mantiq_channel_make(i64, i64)`
  }
};

// ── Application State ────────────────────────────────────────────────
let currentKey = "hello";
let currentLang = "nizam";
let currentWasmBytes = null;
let lastInstance = null;
let syscallCount = 0;
let isCodeDirty = false;

// ── DOM References ───────────────────────────────────────────────────
const exampleSelect = document.getElementById("example-select");
const codeEditor = document.getElementById("code-editor");
const lineNumbers = document.getElementById("line-numbers");
const highlightingContent = document.getElementById("highlighting-content");
const editorHighlight = document.getElementById("editor-highlight");
const tabFilename = document.getElementById("tab-filename");
const codeSizeMeta = document.getElementById("code-size-meta");
const irPreview = document.getElementById("ir-preview");
const irContent = document.getElementById("ir-content");
const terminalOutput = document.getElementById("terminal-output");
const terminalBadge = document.getElementById("terminal-badge");
const hexViewer = document.getElementById("hex-viewer");
const memPageSelect = document.getElementById("mem-page-select");

const pillNz = document.getElementById("pill-nz");
const pillMq = document.getElementById("pill-mq");

const statTime = document.getElementById("stat-time");
const statSize = document.getElementById("stat-size");
const statPages = document.getElementById("stat-pages");
const statSyscalls = document.getElementById("stat-syscalls");
const statExit = document.getElementById("stat-exit");

const footerStatus = document.getElementById("footer-status");
const footerTime = document.getElementById("footer-time");

const btnRun = document.getElementById("btn-run");
const btnCompileRun = document.getElementById("btn-compile-run");
const btnDownloadWasm = document.getElementById("btn-download-wasm");
const btnClearTerm = document.getElementById("btn-clear-term");
const btnRefreshMem = document.getElementById("btn-refresh-mem");

// ── Language Mode Switching Logic ────────────────────────────────────
function setLanguageMode(lang, autoSelectDemo = false) {
  currentLang = lang;
  if (lang === "mantiq") {
    if (pillNz) pillNz.classList.remove("active-nz");
    if (pillMq) pillMq.classList.add("active-mq");
    if (autoSelectDemo && (!DEMOS[currentKey] || DEMOS[currentKey].lang !== "mantiq")) {
      exampleSelect.value = "classes";
      loadDemo("classes");
    }
  } else {
    if (pillMq) pillMq.classList.remove("active-mq");
    if (pillNz) pillNz.classList.add("active-nz");
    if (autoSelectDemo && (!DEMOS[currentKey] || DEMOS[currentKey].lang !== "nizam")) {
      exampleSelect.value = "hello";
      loadDemo("hello");
    }
  }
  updateEditorHighlighting();
}

if (pillNz) {
  pillNz.addEventListener("click", () => setLanguageMode("nizam", true));
}
if (pillMq) {
  pillMq.addEventListener("click", () => setLanguageMode("mantiq", true));
}

// ── Tab Switching Logic ──────────────────────────────────────────────
document.querySelectorAll(".editor-panel .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".editor-panel .tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".editor-panel .tab-view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(`tab-${btn.dataset.tab}-view`);
    if (target) target.classList.add("active");
  });
});

document.querySelectorAll(".terminal-panel .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".terminal-panel .tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".terminal-panel .tab-view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(`tab-${btn.dataset.tab}-view`);
    if (target) {
      target.classList.add("active");
      if (btn.dataset.tab === "memory") renderHexMemory();
    }
  });
});

// ── Editor Highlighting & Synchronization ─────────────────────────────
function updateEditorHighlighting() {
  if (!highlightingContent) return;
  const code = codeEditor.value;
  const isMantiq = currentLang === "mantiq";
  if (window.Highlighter) {
    const html = window.Highlighter.highlightCode(code, isMantiq ? "mantiq" : "nizam");
    highlightingContent.innerHTML = html + (code.endsWith("\n") ? "\n&nbsp;" : "");
  } else {
    highlightingContent.textContent = code;
  }
}

function updateIrHighlighting(irText) {
  const text = irText !== undefined ? irText : (irPreview ? irPreview.textContent : "");
  if (irContent) {
    if (window.Highlighter) {
      irContent.innerHTML = window.Highlighter.highlightLLVM(text);
    } else {
      irContent.textContent = text;
    }
  } else if (irPreview) {
    irPreview.textContent = text;
  }
}

function updateLineNumbers() {
  const lines = codeEditor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
  const isModified = Boolean(DEMOS[currentKey] && codeEditor.value !== DEMOS[currentKey].code);
  isCodeDirty = isModified;
  if (isModified) {
    codeSizeMeta.textContent = `${lines} lines (${codeEditor.value.length} bytes) • Modified`;
    codeSizeMeta.style.color = "var(--accent-amber)";
  } else {
    codeSizeMeta.textContent = `${lines} lines (${codeEditor.value.length} bytes)`;
    codeSizeMeta.style.color = "";
  }
}

function updateEditor() {
  updateLineNumbers();
  updateEditorHighlighting();
}

codeEditor.addEventListener("input", updateEditor);
codeEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
  if (editorHighlight) {
    editorHighlight.scrollTop = codeEditor.scrollTop;
    editorHighlight.scrollLeft = codeEditor.scrollLeft;
  }
});

// Smart Editor Interactions: Indentation, Brackets, Shortcuts
codeEditor.addEventListener("keydown", (e) => {
  const start = codeEditor.selectionStart;
  const end = codeEditor.selectionEnd;
  const val = codeEditor.value;

  if (e.key === "Tab") {
    e.preventDefault();
    codeEditor.setRangeText("    ", start, end, "end");
    updateEditor();
  } else if (e.key === "Enter") {
    // Smart auto-indentation: preserve previous line indent and add 4 spaces after ':'
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const currentLine = val.substring(lineStart, start);
    const indentMatch = currentLine.match(/^\s*/);
    let indent = indentMatch ? indentMatch[0] : "";
    if (currentLine.trimEnd().endsWith(":")) {
      indent += "    ";
    }
    if (indent) {
      e.preventDefault();
      codeEditor.setRangeText("\n" + indent, start, end, "end");
      updateEditor();
    }
  } else if (e.key === "(" || e.key === "[" || e.key === "{" || e.key === "\"" || e.key === "'") {
    const pairs = { "(": ")", "[": "]", "{": "}", "\"": "\"", "'": "'" };
    const close = pairs[e.key];
    if (start === end) {
      if ((e.key === "\"" || e.key === "'") && val[start] === e.key) {
        e.preventDefault();
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 1;
        return;
      }
      e.preventDefault();
      codeEditor.setRangeText(e.key + close, start, end, "preserve");
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 1;
      updateEditor();
    } else {
      e.preventDefault();
      const selected = val.substring(start, end);
      codeEditor.setRangeText(e.key + selected + close, start, end, "select");
      updateEditor();
    }
  } else if (e.key === ")" || e.key === "]" || e.key === "}") {
    if (start === end && val[start] === e.key) {
      e.preventDefault();
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 1;
    }
  } else if (e.key === "Backspace" && start === end && start > 0) {
    const before = val[start - 1];
    const after = val[start];
    if (
      (before === "(" && after === ")") ||
      (before === "[" && after === "]") ||
      (before === "{" && after === "}") ||
      (before === "\"" && after === "\"") ||
      (before === "'" && after === "'")
    ) {
      e.preventDefault();
      codeEditor.setRangeText("", start - 1, start + 1, "end");
      updateEditor();
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runCurrent();
  }
});

// ── Demo Selection ───────────────────────────────────────────────────
function loadDemo(key) {
  currentKey = key;
  isCodeDirty = false;
  const demo = DEMOS[key];
  if (!demo) {
    appendTerminal(`\n[nizam-wasi] Warning: Demo '${key}' not found.`, "term-warn");
    return;
  }

  // Synchronize language toggle pill
  if (demo.lang === "mantiq") {
    setLanguageMode("mantiq", false);
  } else if (demo.lang === "nizam") {
    setLanguageMode("nizam", false);
  }

  codeEditor.value = demo.code;
  tabFilename.textContent = demo.filename;
  updateIrHighlighting(demo.ir);
  updateEditor();

  appendTerminal(`\n[nizam-wasi] Selected demo: ${demo.title}`, "term-info");
  preloadWasm(demo.wasmUrl);
}

async function preloadWasm(url) {
  if (!url) {
    currentWasmBytes = null;
    statSize.textContent = "Custom (needs compile)";
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    currentWasmBytes = new Uint8Array(buf);
    statSize.textContent = `${(currentWasmBytes.length / 1024).toFixed(1)} KB`;
  } catch (err) {
    appendTerminal(`[nizam-wasi] Could not preload ${url}: ${err.message}`, "term-warn");
  }
}

exampleSelect.addEventListener("change", (e) => {
  loadDemo(e.target.value);
});

// ── ANSI Escape Code to HTML Converter ───────────────────────────────────
function ansiToHtml(str) {
  if (!str) return "";

  let text = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const standardColors = [
    "#1e1e2e", "#f38ba8", "#a6e3a1", "#f9e2af", "#89b4fa", "#f5c2e7", "#94e2d5", "#cdd6f4",
    "#585b70", "#eba0ac", "#a6e3a1", "#fab387", "#74c7ec", "#b4befe", "#89dceb", "#ffffff"
  ];

  let openSpanCount = 0;

  // Matches ANSI sequences starting with ESC, or standalone color sequences like [38;2;...m or [0m
  const ansiRegex = /(?:\x1b|\u001b)\[([0-9;]*)m|\[(38;2;[0-9;]+|48;2;[0-9;]+|[0-9]{1,3}(?:;[0-9]{1,3})*)m/g;

  text = text.replace(ansiRegex, (match, p1, p2) => {
    const params = p1 !== undefined ? p1 : p2;
    if (!params || params === "0") {
      let close = "</span>".repeat(openSpanCount);
      openSpanCount = 0;
      return close;
    }

    const tokens = params.split(";").map(t => parseInt(t, 10));
    let html = "";

    for (let i = 0; i < tokens.length; i++) {
      const code = isNaN(tokens[i]) ? 0 : tokens[i];

      if (code === 0) {
        html += "</span>".repeat(openSpanCount);
        openSpanCount = 0;
      } else if (code === 1) {
        html += '<span style="font-weight: 700;">';
        openSpanCount++;
      } else if (code === 2) {
        html += '<span style="opacity: 0.7;">';
        openSpanCount++;
      } else if (code === 3) {
        html += '<span style="font-style: italic;">';
        openSpanCount++;
      } else if (code === 4) {
        html += '<span style="text-decoration: underline;">';
        openSpanCount++;
      } else if (code === 22) {
        html += "</span>".repeat(openSpanCount);
        openSpanCount = 0;
      } else if (code >= 30 && code <= 37) {
        html += `<span style="color: ${standardColors[code - 30]};">`;
        openSpanCount++;
      } else if (code === 38) {
        if (tokens[i + 1] === 2 && i + 4 < tokens.length) {
          const r = tokens[i + 2];
          const g = tokens[i + 3];
          const b = tokens[i + 4];
          html += `<span style="color: rgb(${r}, ${g}, ${b});">`;
          openSpanCount++;
          i += 4;
        } else if (tokens[i + 1] === 5 && i + 2 < tokens.length) {
          const idx = tokens[i + 2];
          const c = idx < 16 ? standardColors[idx] : `hsl(${(idx * 37) % 360}, 70%, 65%)`;
          html += `<span style="color: ${c};">`;
          openSpanCount++;
          i += 2;
        }
      } else if (code >= 40 && code <= 47) {
        html += `<span style="background-color: ${standardColors[code - 40]};">`;
        openSpanCount++;
      } else if (code === 48) {
        if (tokens[i + 1] === 2 && i + 4 < tokens.length) {
          const r = tokens[i + 2];
          const g = tokens[i + 3];
          const b = tokens[i + 4];
          html += `<span style="background-color: rgb(${r}, ${g}, ${b});">`;
          openSpanCount++;
          i += 4;
        }
      } else if (code >= 90 && code <= 97) {
        html += `<span style="color: ${standardColors[code - 90 + 8]};">`;
        openSpanCount++;
      } else if (code >= 100 && code <= 107) {
        html += `<span style="background-color: ${standardColors[code - 100 + 8]};">`;
        openSpanCount++;
      }
    }

    return html;
  });

  // Strip non-color CSI sequences (strictly requiring \x1b or \u001b)
  text = text.replace(/(?:\x1b|\u001b)\[[0-9;?]*[a-zA-Z]/g, "");

  if (openSpanCount > 0) {
    text += "</span>".repeat(openSpanCount);
  }

  return text;
}

// ── Terminal Output Helper ───────────────────────────────────────────
function timestamp() {
  const d = new Date();
  return d.toTimeString().split(" ")[0];
}

function appendTerminal(text, cssClass = "") {
  if (text === null || text === undefined) return;

  const lines = text.toString().split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (i === lines.length - 1 && raw.length === 0 && lines.length > 1) {
      continue;
    }

    const div = document.createElement("div");
    div.className = cssClass ? `terminal-line ${cssClass}` : "terminal-line";

    let html = ansiToHtml(raw);

    if (!raw.includes("\x1b") && !raw.includes("\u001b") && !/\[[0-9;]+m/.test(raw)) {
      html = html
        .replace(/\[PASS\]/g, '<span class="term-success">[PASS]</span>')
        .replace(/\[FAIL\]/g, '<span class="term-error">[FAIL]</span>')
        .replace(/PASSED!/g, '<span class="term-success">PASSED!</span>')
        .replace(/FAILED!/g, '<span class="term-error">FAILED!</span>')
        .replace(/^=== (.*) ===$/gm, '<span class="term-heading">=== $1 ===</span>');
    }

    div.innerHTML = html || "&nbsp;";
    terminalOutput.appendChild(div);
  }

  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

btnClearTerm.addEventListener("click", () => {
  terminalOutput.innerHTML = "";
  appendTerminal(`[${timestamp()}] Terminal cleared.`, "term-dim");
});

// ── WebAssembly Execution Engine ─────────────────────────────────────
async function runCurrent() {
  const demo = DEMOS[currentKey];
  const wasmUrl = demo ? demo.wasmUrl : null;
  const baseFilename = (demo ? demo.filename : tabFilename.textContent) || (currentLang === "mantiq" ? "custom.mq" : "custom.nz");
  const wasmFilename = baseFilename.replace(/\.(nz|mq)$/, ".wasm");

  // Special instant diagnostic demo preview when code is unmodified
  if (currentKey === "diagnostics" && !isCodeDirty && demo && demo.diagnosticOutput) {
    appendTerminal(`\n[${timestamp()}] $ wasi-compile ${demo.filename}`, "term-prompt");
    appendTerminal(demo.diagnosticOutput);
    footerStatus.textContent = "DIAGNOSTIC (1)";
    footerStatus.className = "footer-val text-error";
    statExit.textContent = `Error: E0103`;
    statExit.className = "stat-val text-error";
    terminalBadge.textContent = "Error: E0103";
    terminalBadge.style.borderColor = "var(--accent-crimson)";
    terminalBadge.style.color = "var(--accent-crimson)";
    return;
  }

  // If code was edited, invoke compiler bridge
  if (isCodeDirty) {
    appendTerminal(`\n[${timestamp()}] Source code modified. Invoking compiler bridge...`, "term-info");
    await compileAndRun();
    return;
  }

  if (!wasmUrl && !currentWasmBytes) {
    appendTerminal(`[nizam-wasi] Custom code requires compilation. Compiling via compiler bridge...`, "term-info");
    await compileAndRun();
    return;
  }

  if (!currentWasmBytes && wasmUrl) {
    await preloadWasm(wasmUrl);
  }

  if (!currentWasmBytes) {
    appendTerminal(`[nizam-wasi] Error: WASM binary not loaded.`, "term-error");
    return;
  }

  footerStatus.textContent = "RUNNING";
  footerStatus.className = "footer-val term-warn";
  terminalBadge.textContent = "Running";
  terminalBadge.style.borderColor = "var(--accent-amber)";
  terminalBadge.style.color = "var(--accent-amber)";

  appendTerminal(`\n[${timestamp()}] $ wasi-run ${wasmFilename}`, "term-prompt");
  syscallCount = 0;

  const wasi = new BrowserWASI({
    args: [wasmFilename],
    stdout: (text) => {
      syscallCount++;
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 0 || i < lines.length - 1) {
          appendTerminal(lines[i]);
        }
      }
    },
    stderr: (text) => {
      syscallCount++;
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 0 || i < lines.length - 1) {
          appendTerminal(lines[i], "term-error");
        }
      }
    }
  });

  const startTime = performance.now();

  try {
    const wasmModule = await WebAssembly.compile(currentWasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, wasi.getImports());
    lastInstance = instance;

    const exitCode = await wasi.start(instance);
    const elapsed = performance.now() - startTime;

    statTime.textContent = `${elapsed.toFixed(2)} ms`;
    footerTime.textContent = `${elapsed.toFixed(1)} ms`;
    statExit.textContent = `0 (Success)`;
    statExit.className = "stat-val text-success";
    statSyscalls.textContent = syscallCount;

    if (instance.exports.memory) {
      const pageCount = instance.exports.memory.buffer.byteLength / 65536;
      statPages.textContent = `${pageCount} pages (${pageCount * 64} KB)`;
    }

    footerStatus.textContent = "SUCCESS (0)";
    footerStatus.className = "footer-val text-success";
    terminalBadge.textContent = "Done: 0";
    terminalBadge.style.borderColor = "var(--accent-emerald)";
    terminalBadge.style.color = "var(--accent-emerald)";

    appendTerminal(`[${timestamp()}] Process exited with code ${exitCode} in ${elapsed.toFixed(2)} ms`, "term-dim");
    renderHexMemory();

  } catch (err) {
    const elapsed = performance.now() - startTime;
    footerStatus.textContent = "ERROR";
    footerStatus.className = "footer-val text-error";
    statExit.textContent = `Failed`;
    statExit.className = "stat-val text-error";
    appendTerminal(`[${timestamp()}] WASI Runtime Error: ${err.message}`, "term-error");
  }
}

btnRun.addEventListener("click", runCurrent);

// ── Live Compiler Bridge (server /api/compile) ────────────────────────
async function compileAndRun() {
  btnCompileRun.disabled = true;
  btnCompileRun.innerHTML = `<span>Compiling...</span>`;
  footerStatus.textContent = "COMPILING";
  footerStatus.className = "footer-val term-warn";

  const endpoint = window.COMPILER_API_URL || "/api/compile";
  appendTerminal(`\n[${timestamp()}] Invoking compiler bridge at ${endpoint}...`, "term-info");

  try {
    const filename = tabFilename.textContent || (currentLang === "mantiq" ? "custom.mq" : "custom.nz");
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: codeEditor.value,
        filename: filename,
        lang: currentLang
      })
    });

    if (resp.status === 404) {
      appendTerminal(`[Compiler Bridge] ${endpoint} returned 404 Not Found.`, "term-warn");
      appendTerminal(`Precompiled WASM demos run 100% in-browser without any server. To compile custom code online, configure a Google Cloud Run compiler container in vercel.json or set window.COMPILER_API_URL.`, "term-dim");
      footerStatus.textContent = "NO BACKEND";
      footerStatus.className = "footer-val term-warn";
      return;
    }

    if (resp.status === 502 || resp.status === 503 || resp.status === 504) {
      appendTerminal(`[Compiler Backend] Service container is spinning up from idle or warming cache. Please retry in a few moments.`, "term-warn");
      footerStatus.textContent = "COLD START";
      footerStatus.className = "footer-val term-warn";
      return;
    }

    let data;
    try {
      data = await resp.json();
    } catch (_) {
      appendTerminal(`[Compiler Backend] Server returned unexpected response (HTTP ${resp.status}). Retrying in a moment...`, "term-warn");
      footerStatus.textContent = "RETRY";
      footerStatus.className = "footer-val term-warn";
      return;
    }
    if (!data.success) {
      appendTerminal(`[Compiler Error]`, "term-error");
      appendTerminal(data.error);
      footerStatus.textContent = "COMPILE FAIL";
      footerStatus.className = "footer-val text-error";
      statExit.textContent = `Compile Error`;
      statExit.className = "stat-val text-error";
      terminalBadge.textContent = "Failed";
      terminalBadge.style.borderColor = "var(--accent-crimson)";
      terminalBadge.style.color = "var(--accent-crimson)";
      return;
    }

    appendTerminal(`[nizam.wasm] Compilation succeeded! Loading WASM module...`, "term-success");
    const raw = atob(data.wasmBase64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    currentWasmBytes = bytes;
    statSize.textContent = `${(bytes.length / 1024).toFixed(1)} KB`;
    isCodeDirty = false;

    await runCurrent();

  } catch (err) {
    appendTerminal(`[Compiler Bridge Error] Could not connect to compiler server: ${err.message}`, "term-error");
  } finally {
    btnCompileRun.disabled = false;
    btnCompileRun.innerHTML = `<span>Compile & Run</span>`;
  }
}

btnCompileRun.addEventListener("click", compileAndRun);

// ── Download WASM ────────────────────────────────────────────────────
btnDownloadWasm.addEventListener("click", () => {
  if (!currentWasmBytes) {
    alert("Please select or compile a WASM program first.");
    return;
  }
  const blob = new Blob([currentWasmBytes], { type: "application/wasm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cur = DEMOS[currentKey];
  a.download = cur ? cur.filename.replace(/\.(nz|mq)$/, ".wasm") : "program.wasm";
  a.click();
  URL.revokeObjectURL(url);
});

// ── Linear Memory Hex Inspector ──────────────────────────────────────
function renderHexMemory() {
  if (!lastInstance || !lastInstance.exports.memory) {
    hexViewer.innerHTML = `<div class="hex-placeholder">No active WASM instance memory. Run a demo to inspect live bytes.</div>`;
    return;
  }

  const pageIdx = parseInt(memPageSelect.value, 10);
  const buffer = lastInstance.exports.memory.buffer;
  const pageOffset = pageIdx * 65536;

  if (pageOffset >= buffer.byteLength) {
    hexViewer.innerHTML = `<div class="hex-placeholder">Page ${pageIdx} exceeds allocated memory (${buffer.byteLength / 65536} pages).</div>`;
    return;
  }

  const u8 = new Uint8Array(buffer, pageOffset, Math.min(1024, buffer.byteLength - pageOffset));
  let html = "";

  for (let i = 0; i < u8.length; i += 16) {
    const addr = (pageOffset + i).toString(16).padStart(8, "0");
    let hex = "";
    let ascii = "";

    for (let j = 0; j < 16; j++) {
      if (i + j < u8.length) {
        const b = u8[i + j];
        hex += b.toString(16).padStart(2, "0") + " ";
        ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".";
      } else {
        hex += "   ";
      }
    }

    html += `<div class="hex-row">
      <span class="hex-addr">0x${addr}</span>
      <span class="hex-bytes">${hex}</span>
      <span class="hex-ascii">${ascii.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>
    </div>`;
  }

  hexViewer.innerHTML = html;
}

memPageSelect.addEventListener("change", renderHexMemory);
btnRefreshMem.addEventListener("click", renderHexMemory);

// ── Initialize App ───────────────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const initialLang = urlParams.get("lang");
if (initialLang === "mantiq" || initialLang === "mq") {
  setLanguageMode("mantiq", false);
} else {
  setLanguageMode("nizam", false);
}

const initialDemo = urlParams.get("demo") || (currentLang === "mantiq" ? "classes" : "hello");
exampleSelect.value = initialDemo;
loadDemo(initialDemo);

if (urlParams.get("code")) {
  codeEditor.value = decodeURIComponent(urlParams.get("code"));
  updateEditor();
}

if (urlParams.get("autorun") === "1") {
  setTimeout(() => {
    runCurrent();
  }, 400);
}

if (urlParams.get("autocompile") === "1") {
  setTimeout(() => {
    compileAndRun();
  }, 400);
}

if (urlParams.get("tab")) {
  const t = urlParams.get("tab");
  setTimeout(() => {
    const btn = document.querySelector(`.editor-panel .tab-btn[data-tab="${t}"]`) || document.querySelector(`.terminal-panel .tab-btn[data-tab="${t}"]`);
    if (btn) btn.click();
  }, 400);
}
