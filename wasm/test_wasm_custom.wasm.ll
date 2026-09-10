; ModuleID = 'MantiqModule'
source_filename = "test"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-wasi-musl"

declare ptr @malloc(i32)
declare void @free(ptr)
declare void @mantiq_free(ptr)

declare i32 @mantiq_isa(ptr, i32)
declare ptr @mantiq_malloc(i64)
declare ptr @mantiq_realloc(ptr, i64)
declare i64 @mantiq_strlen(ptr)
declare ptr @mantiq_spawn(ptr, ptr)
declare ptr @mantiq_await(ptr)
declare void @mantiq_print_i32(i32)
declare void @mantiq_print_bool(i32)
declare void @mantiq_print_float(float)
declare void @mantiq_print_ptr(ptr)
declare void @mantiq_print_space()
declare void @mantiq_print_newline()
declare void @mantiq_print_str(ptr, i64)
declare void @mantiq_print_cstr(ptr)
declare void @__mantiq_list_append(ptr, ptr, i64)
declare void @__mantiq_list_extend(ptr, ptr, i64)
declare i32 @__mantiq_hash_string(ptr, i64)
declare i32 @__mantiq_hash_bytes(ptr, i64)
declare ptr @__mantiq_dict_create(i32, i32, i32)
declare void @__mantiq_dict_set(ptr, ptr, ptr, i32)
declare void @__mantiq_dict_merge(ptr, ptr)
declare ptr @__mantiq_dict_get(ptr, ptr, i32)
declare ptr @__mantiq_dict_get_or_insert(ptr, ptr, i32)
declare i8 @__mantiq_dict_remove(ptr, ptr, i32)
declare void @__mantiq_dict_clear(ptr)
declare void @__mantiq_dict_keys(ptr, ptr, i32)
declare i32 @mantiq_quantum_qbit(i32)
declare i32 @mantiq_quantum_h(i32)
declare i32 @mantiq_quantum_measure(i32)
declare void @mantiq_quantum_cnot(i32, i32)
declare i32 @mantiq_quantum_x(i32)
declare i32 @mantiq_quantum_y(i32)
declare i32 @mantiq_quantum_z(i32)
declare ptr @mantiq_concat_str(ptr, i64, ptr, i64)
declare ptr @mantiq_i32_to_str(i32, ptr)
declare ptr @mantiq_i64_to_str(i64, ptr)
declare ptr @mantiq_u64_to_str(i64, ptr)
declare ptr @mantiq_float_to_str(float, ptr)
declare ptr @mantiq_f64_to_str(double, ptr)
declare ptr @mantiq_char_to_str(i8, ptr)
declare ptr @mantiq_bool_to_str(i32, ptr)
declare i32 @strlen(ptr)
declare ptr @__mantiq_channel_new(i64, i64)
declare void @__mantiq_channel_send(ptr, ptr, i64)
declare ptr @__mantiq_channel_recv(ptr, i64)
declare i32 @__mantiq_channel_try_send(ptr, ptr, i64)
declare ptr @__mantiq_channel_try_recv(ptr, i64, ptr)
declare void @__mantiq_channel_close(ptr)
declare i32 @__mantiq_channel_is_closed(ptr)
declare i64 @__mantiq_channel_len(ptr)
declare i64 @__mantiq_channel_cap(ptr)
declare void @__mantiq_channel_free(ptr)
%MantiqDict = type { ptr, ptr, ptr, ptr, i32, i32, i32, i32 }
%Target = type { { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, i32, i32, { ptr, i32, i32 }, { ptr, i32, i32 } }

%Lowerer = type { { ptr, i32, i32 }, i32, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, i32 }

%Sema = type { ptr, ptr, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, i32, ptr, ptr, { ptr, i32, i32 } }

%TypeChecker = type { ptr, { i8, ptr }, ptr, ptr }

%BorrowRecord = type { { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, i8, %Span, i32, i8 }

%BorrowChecker = type { { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, ptr, i32, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, i32 }

%LLVMCodegen = type { { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, i32, i32, i32, i32, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, ptr, { ptr, i32, i32 }, %Target }

%Node = type { i32, %Span, { i8, ptr }, ptr, ptr }

%ProgramData = type { { ptr, i32, i32 } }

%ImportDeclData = type { i32, { ptr, i32, i32 }, { ptr, i32, i32 }, { i8, ptr } }

%FunDeclData = type { { ptr, i32, i32 }, { ptr, i32, i32 }, ptr, i8, i8, i8, ptr, ptr, i8, i8, { ptr, i32, i32 } }

%VarDeclData = type { { ptr, i32, i32 }, ptr, i8, ptr, { ptr, i32, i32 } }

%IfStmtData = type { ptr, ptr, { i8, ptr } }

%ClassDeclData = type { { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, ptr, i8, { ptr, i32, i32 } }

%InterfaceDeclData = type { { ptr, i32, i32 }, ptr, { ptr, i32, i32 } }

%BinaryExprData = type { { ptr, i32, i32 }, ptr, ptr }

%IdentifierData = type { { ptr, i32, i32 } }

%NumberLiteralData = type { double, i8 }

%StringLiteralData = type { { ptr, i32, i32 } }

%MacroDeclData = type { { ptr, i32, i32 }, { ptr, i32, i32 }, ptr }

%MacroInvocationData = type { { ptr, i32, i32 }, { ptr, i32, i32 } }

%CallExprData = type { ptr, { ptr, i32, i32 }, ptr }

%ReturnStmtData = type { ptr, { ptr, i32, i32 } }

%WhileStmtData = type { ptr, ptr }

%ForStmtData = type { { ptr, i32, i32 }, ptr, ptr, i8, i8 }

%MemberExprData = type { ptr, { ptr, i32, i32 } }

%UnaryExprData = type { { ptr, i32, i32 }, ptr }

%CastExprData = type { { ptr, i32, i32 }, ptr }

%BlockStmtData = type { { ptr, i32, i32 }, { ptr, i32, i32 } }

%ParamBlockStmtData = type { { ptr, i32, i32 }, ptr, { ptr, i32, i32 }, ptr, ptr, { ptr, i32, i32 } }

%WithStmtData = type { ptr, { ptr, i32, i32 }, ptr }

%MatchStmtData = type { ptr, { ptr, i32, i32 } }

%TryStmtData = type { ptr, { ptr, i32, i32 }, ptr }

%ThrowStmtData = type { ptr }

%ListLiteralData = type { { ptr, i32, i32 } }

%DictLiteralData = type { { ptr, i32, i32 } }

%IndexExprData = type { ptr, ptr }

%SpreadExprData = type { ptr }

%BooleanLiteralData = type { double }

%AwaitExprData = type { ptr }

%SpawnStmtData = type { ptr }

%ClosureExprData = type { { ptr, i32, i32 }, ptr, ptr, { ptr, i32, i32 } }

%StructDeclData = type { { ptr, i32, i32 }, ptr, { ptr, i32, i32 } }

%EnumDeclData = type { { ptr, i32, i32 }, { ptr, i32, i32 } }

%UnionDeclData = type { { ptr, i32, i32 }, ptr }

%FieldDeclData = type { { ptr, i32, i32 }, ptr }

%ColorLiteralData = type { double, i8, i8, i8, i8 }

%ListComprehensionData = type { { ptr, i32, i32 }, ptr, ptr, ptr, ptr }

%InterpolatedStringData = type { { ptr, i32, i32 } }

%Span = type { i32, i32, i32, i32, i32, i32 }

%Label = type { %Span, { ptr, i32, i32 }, i32 }

%Suggestion = type { %Span, { ptr, i32, i32 }, { ptr, i32, i32 } }

%Diagnostic = type { i32, { i8, ptr }, { ptr, i32, i32 }, { ptr, i32, i32 }, %Span, { ptr, i32, i32 }, { i8, ptr }, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 } }

%DiagnosticEngine = type { { ptr, i32, i32 }, i32, i32, i32, i8, { ptr, i32, i32 } }

%Set = type { { ptr, i32, i32 } }

%Type = type { i32, ptr, { ptr, i32, i32 }, { ptr, i32, i32 }, { ptr, i32, i32 }, ptr }

%Symbol = type { { ptr, i32, i32 }, i32, ptr, { i8, ptr }, i8, ptr }

%Scope = type { ptr, { ptr, i32, i32 }, ptr }

%TypeAnnotation = type { { ptr, i32, i32 }, i8, i8, { i8, ptr }, { i8, ptr }, { i8, ptr }, ptr }

%TSNode = type { i32, i32, i32, i32, ptr, ptr }

declare i32 @printf(ptr, ...)
@.str.1 = private unnamed_addr constant [33 x i8] c"Live Nizam WebAssembly Runtime!\0A\00"
@.str.2 = private unnamed_addr constant [19 x i8] c"factorial(6) = %d\0A\00"
define i32 @factorial(i32 %n_param) {
entry:
  %n = alloca i32
  store i32 %n_param, ptr %n
  %t.1 = load i32, ptr %n
  %t.2 = icmp sle  i32 %t.1, 1
  br i1 %t.2, label %label_1, label %label_3

label_1:
  ret i32 1
  br label %label_3

label_3:
  %t.3 = load i32, ptr %n
  %t.4 = load i32, ptr %n
  %t.5 = sub  i32 %t.4, 1
  %t.6 = call i32 @factorial(i32 %t.5)
  %t.7 = mul  i32 %t.3, %t.6
  ret i32 %t.7
}

define i32 @main() {
entry:
  %_ = alloca i32
  %t.8 = getelementptr [33 x i8], ptr @.str.1, i32 0, i32 0
  %t.9 = call i32 @printf(ptr %t.8)
  store i32 %t.9, ptr %_
  %fact = alloca i32
  %t.10 = call i32 @factorial(i32 6)
  store i32 %t.10, ptr %fact
  %__1 = alloca i32
  %t.11 = getelementptr [19 x i8], ptr @.str.2, i32 0, i32 0
  %t.12 = load i32, ptr %fact
  %t.13 = call i32 @printf(ptr %t.11, i32 %t.12)
  store i32 %t.13, ptr %__1
  ret i32 0
  ret i32 0
}

