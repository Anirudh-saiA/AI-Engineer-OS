"""
AI-Engineer-OS Error Knowledge Base
=====================================
Centralized, curated knowledge base covering 8 error domains with
structured data for every common error type.  Acts as the foundation
of the intelligent debugging platform — powering semantic search,
confidence scoring, teaching cards, and recurring-error recommendations.
"""

from typing import Dict, Any, List

# Each entry follows a consistent schema:
#   error_name        – canonical name (e.g. "KeyError")
#   error_category    – broad domain category
#   root_cause        – one-paragraph technical root cause
#   beginner_explanation – plain-English analogy-based explanation
#   advanced_explanation – CS-level deep dive
#   fix_recommendations  – ordered list of fixes (most common first)
#   prevention_strategies – habits to avoid this error class
#   best_practices    – industry patterns
#   learning_resources – topic names for further study
#   related_errors    – siblings in the same error family
#   frameworks        – where this error is commonly seen

KnowledgeEntry = Dict[str, Any]

# ═══════════════════════════════════════════════════════════════════
# PYTHON ERRORS
# ═══════════════════════════════════════════════════════════════════

PYTHON_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "NameError",
        "error_category": "Python",
        "root_cause": "A variable or function name was referenced before being defined in the current scope. Python resolves names at runtime using the LEGB rule.",
        "beginner_explanation": "Imagine calling someone by a name they don't have. You said 'Hey, Alex!' but nobody named Alex is in the room. Your code used a variable that doesn't exist yet.",
        "advanced_explanation": "Python uses the LEGB (Local → Enclosing → Global → Built-in) scope resolution order. A NameError means the identifier wasn't found in any of these scopes. This can happen due to typos, using a variable before assignment, or missing imports. In closures, the variable must exist in an enclosing scope at definition time.",
        "fix_recommendations": [
            "Check for typos in the variable or function name",
            "Ensure the variable is defined before it is referenced",
            "Verify required imports are present at the top of the file",
            "Check scope — variables defined inside a function aren't accessible outside it"
        ],
        "prevention_strategies": [
            "Use an IDE with autocomplete to catch typos early",
            "Initialize variables at the top of their scope",
            "Run a linter (pylint, flake8) to catch undefined names"
        ],
        "best_practices": [
            "Follow consistent naming conventions (snake_case for variables)",
            "Use type hints to catch errors at development time",
            "Keep function scopes small and focused"
        ],
        "learning_resources": ["Python scoping rules", "LEGB rule", "Variable lifetime"],
        "related_errors": ["UnboundLocalError", "AttributeError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "TypeError",
        "error_category": "Python",
        "root_cause": "An operation or function was applied to an object of the wrong type. Python is dynamically typed but strongly typed.",
        "beginner_explanation": "It's like trying to add apples and oranges — literally. You asked Python to combine two things that don't mix, like adding a word to a number.",
        "advanced_explanation": "Python's type system doesn't allow implicit type coercion between incompatible types. Unlike JavaScript, '5' + 3 raises TypeError. This also occurs when calling non-callable objects, passing wrong argument counts, or using unsupported operand types. The __add__, __mul__, etc. dunder methods define valid operations per type.",
        "fix_recommendations": [
            "Check the types of operands using type() or isinstance()",
            "Convert types explicitly: int(), str(), float(), list()",
            "Verify function signatures match the arguments you're passing",
            "Check for None values that might be passed unexpectedly"
        ],
        "prevention_strategies": [
            "Use type hints to document expected parameter types",
            "Add runtime type checks for critical functions",
            "Use mypy or pyright for static type checking"
        ],
        "best_practices": [
            "Always validate external input types before processing",
            "Use Python's typing module for complex type annotations",
            "Prefer duck typing with hasattr() checks over isinstance()"
        ],
        "learning_resources": ["Python type system", "Duck typing", "Type coercion"],
        "related_errors": ["ValueError", "AttributeError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "ValueError",
        "error_category": "Python",
        "root_cause": "A function received an argument of the correct type but an inappropriate value.",
        "beginner_explanation": "Think of a vending machine that only accepts coins. You inserted a valid coin slot (right type), but the coin is from another country (wrong value).",
        "advanced_explanation": "ValueError indicates that while the argument's type is correct, its content violates the function's domain constraints. Common examples: int('abc'), math.sqrt(-1), list.remove(x) when x is not in list. This is distinct from TypeError which checks the type itself.",
        "fix_recommendations": [
            "Validate input data before processing",
            "Use try/except blocks around conversion operations",
            "Add input sanitization and boundary checks",
            "Check data format matches expected patterns"
        ],
        "prevention_strategies": [
            "Always validate user inputs before passing them to core logic",
            "Use regex or parsing libraries for structured data validation",
            "Implement the 'fail fast' principle — check preconditions early"
        ],
        "best_practices": [
            "Use Pydantic models for structured data validation",
            "Provide clear error messages when rejecting values",
            "Define value constraints as constants"
        ],
        "learning_resources": ["Input validation", "Data sanitization", "Domain constraints"],
        "related_errors": ["TypeError", "ValidationError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "KeyError",
        "error_category": "Python",
        "root_cause": "A dictionary key was accessed that does not exist in the dictionary using bracket notation.",
        "beginner_explanation": "Imagine looking for a book in a library by its title, but that title doesn't exist in the catalog. You asked for a specific key, but it was never added.",
        "advanced_explanation": "dict[key] calls __getitem__ which raises KeyError when the key is not in the hash table. This is common when processing JSON/API responses with missing optional fields, iterating over dicts while modifying them, or using user-provided keys without validation.",
        "fix_recommendations": [
            "Use dict.get('key', default_value) instead of dict['key']",
            "Check if the key exists first: if 'key' in my_dict:",
            "Use try/except KeyError around dictionary access",
            "Use collections.defaultdict for dicts with default values"
        ],
        "prevention_strategies": [
            "Always use .get() with a default when accessing optional keys",
            "Validate API response structure before accessing nested fields",
            "Use Pydantic models or TypedDict for structured data validation"
        ],
        "best_practices": [
            "Chain .get() for nested dicts: data.get('user', {}).get('name', 'Unknown')",
            "Use dataclasses or Pydantic for structured data",
            "Log the available keys when debugging KeyError"
        ],
        "learning_resources": ["Dictionary access patterns", "Hash tables", "JSON parsing"],
        "related_errors": ["IndexError", "AttributeError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "IndexError",
        "error_category": "Python",
        "root_cause": "A sequence (list, tuple, string) was accessed with an index that is out of range.",
        "beginner_explanation": "Picture a train with 5 cars numbered 0-4. You tried to board car #5, but it doesn't exist. You went past the end of the list.",
        "advanced_explanation": "Python sequences are 0-indexed, so a list of length N has valid indices 0 to N-1 (and -N to -1 for negative indexing). IndexError occurs when accessing index >= len(seq) or < -len(seq). Common in off-by-one loop errors, empty list access, and incorrect assumptions about data size.",
        "fix_recommendations": [
            "Check the length before accessing: if len(lst) > index:",
            "Use try/except IndexError for graceful handling",
            "Verify loop ranges don't exceed list boundaries",
            "Handle empty list/array edge cases explicitly"
        ],
        "prevention_strategies": [
            "Use enumerate() instead of manual index tracking",
            "Prefer 'for item in list' over 'for i in range(len(list))'",
            "Add boundary checks for any index-based access"
        ],
        "best_practices": [
            "Use slicing which never raises IndexError: lst[10:20] returns [] if out of range",
            "Use negative indexing for last elements: lst[-1]",
            "Consider itertools for safe sequence operations"
        ],
        "learning_resources": ["Array indexing", "Off-by-one errors", "Boundary conditions"],
        "related_errors": ["KeyError", "StopIteration"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "ImportError",
        "error_category": "Python",
        "root_cause": "Python could not import a module or a specific name from a module.",
        "beginner_explanation": "It's like trying to use a tool that isn't in your toolbox. You need to go buy it first (install the package) before you can use it.",
        "advanced_explanation": "ImportError indicates that the import machinery found the module but couldn't import the specific name, or encountered an error during module initialization. This can be caused by circular imports, missing __init__.py files, or importing a name that doesn't exist in the module.",
        "fix_recommendations": [
            "Install the missing package: pip install <package_name>",
            "Check for typos in the module or attribute name",
            "Verify you're using the correct Python environment (venv)",
            "Check for circular imports between your own modules"
        ],
        "prevention_strategies": [
            "Keep a requirements.txt updated with all dependencies",
            "Use virtual environments to isolate project dependencies",
            "Run 'pip freeze' to verify installed packages"
        ],
        "best_practices": [
            "Use absolute imports over relative imports",
            "Structure packages to avoid circular dependencies",
            "Pin dependency versions in production"
        ],
        "learning_resources": ["Python import system", "Virtual environments", "Package management"],
        "related_errors": ["ModuleNotFoundError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "ModuleNotFoundError",
        "error_category": "Python",
        "root_cause": "The specified Python module could not be found in any of the search paths (sys.path).",
        "beginner_explanation": "Imagine ordering a pizza from a restaurant that doesn't exist in your neighborhood. The delivery app can't find it. You need to install the package first.",
        "advanced_explanation": "ModuleNotFoundError (subclass of ImportError, added in Python 3.6) means the module couldn't be located in sys.path. Common mismatches: 'pip install Pillow' → 'import PIL', 'pip install PyMuPDF' → 'import fitz', 'pip install python-dotenv' → 'import dotenv'.",
        "fix_recommendations": [
            "Install the package: pip install <package_name>",
            "Check if you're in the correct virtual environment",
            "Verify the package name — pip names sometimes differ from import names",
            "Add the module's parent directory to PYTHONPATH or sys.path"
        ],
        "prevention_strategies": [
            "Always activate your virtual environment before running code",
            "Pin exact versions in requirements.txt",
            "Use 'pip list' to verify what's installed"
        ],
        "best_practices": [
            "Document pip-name-to-import-name mismatches in README",
            "Use pyproject.toml for modern dependency management",
            "Test imports in CI/CD pipelines"
        ],
        "learning_resources": ["Python path resolution", "pip vs import naming", "sys.path"],
        "related_errors": ["ImportError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "AttributeError",
        "error_category": "Python",
        "root_cause": "An object does not have the attribute (method or property) being accessed.",
        "beginner_explanation": "It's like asking a dog to fly. Dogs don't have wings (that attribute). Your object doesn't have the method you're trying to call.",
        "advanced_explanation": "AttributeError is raised when Python's attribute lookup (via __getattr__ or __getattribute__) fails. Common causes: calling methods on None (e.g., result.process() when result is None), version mismatches in libraries (API changed between versions), and shadowing module names with local variables.",
        "fix_recommendations": [
            "Check the object's type using type(obj) — it may be None",
            "Verify the method/attribute exists using hasattr(obj, 'name')",
            "Check library documentation for correct API usage",
            "Ensure you haven't shadowed a module name with a local variable"
        ],
        "prevention_strategies": [
            "Add None checks before chaining method calls",
            "Use getattr(obj, 'attr', default) for safe access",
            "Check library version — APIs change between versions"
        ],
        "best_practices": [
            "Use Optional type hints to mark nullable returns",
            "Implement the Null Object pattern for safe defaults",
            "Validate function return values before using them"
        ],
        "learning_resources": ["Python attribute lookup", "MRO", "Descriptor protocol"],
        "related_errors": ["NameError", "TypeError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "ZeroDivisionError",
        "error_category": "Python",
        "root_cause": "A division or modulo operation was attempted with zero as the divisor.",
        "beginner_explanation": "Imagine trying to split a pizza among zero people. It's mathematically impossible — you can't divide something into zero parts.",
        "advanced_explanation": "Division by zero is undefined in mathematics and most programming languages. In Python, this applies to /, //, and % operators. For floats, IEEE 754 defines inf and -inf, but Python still raises ZeroDivisionError (numpy/pandas may return inf instead).",
        "fix_recommendations": [
            "Add a zero check: if denominator != 0:",
            "Use try/except ZeroDivisionError",
            "Provide a default value when denominator might be zero",
            "Validate input data to ensure non-zero denominators"
        ],
        "prevention_strategies": [
            "Always validate denominators before division",
            "Consider what the 'correct' result should be when denominator is 0",
            "Use math.inf or float('inf') for intentional infinity"
        ],
        "best_practices": [
            "Wrap aggregation functions that might produce zero denominators",
            "Use numpy's np.divide with where parameter for safe element-wise division",
            "Document division-by-zero behavior in function docstrings"
        ],
        "learning_resources": ["IEEE 754", "Numerical stability", "Division algorithms"],
        "related_errors": ["OverflowError", "ArithmeticError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "RecursionError",
        "error_category": "Python",
        "root_cause": "The maximum recursion depth was exceeded because a function calls itself indefinitely.",
        "beginner_explanation": "Picture standing between two mirrors facing each other — you see infinite reflections. Your function keeps calling itself forever without a stopping point.",
        "advanced_explanation": "Python's default recursion limit is 1000 frames (sys.getrecursionlimit()). Each recursive call adds a frame to the call stack. RecursionError occurs when the base case is never reached, is incorrect, or the input requires more depth than the limit allows. Unlike tail-call optimized languages, Python doesn't optimize tail recursion.",
        "fix_recommendations": [
            "Verify the base case of your recursive function is correct",
            "Add print/logging to trace recursive calls and find infinite loops",
            "Convert to iterative solution using an explicit stack/queue",
            "Increase limit cautiously: sys.setrecursionlimit(N)"
        ],
        "prevention_strategies": [
            "Always write the base case FIRST when implementing recursion",
            "Use iterative solutions for problems with deep recursion (>500 levels)",
            "Apply memoization (@functools.lru_cache) to avoid redundant calls"
        ],
        "best_practices": [
            "Prefer BFS with a queue over DFS with recursion for deep graphs",
            "Use dynamic programming (bottom-up) instead of top-down recursion when possible",
            "Benchmark recursion depth against iterative alternatives"
        ],
        "learning_resources": ["Call stack", "Tail recursion", "Dynamic programming"],
        "related_errors": ["StackOverflowError", "MemoryError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "FileNotFoundError",
        "error_category": "Python",
        "root_cause": "The specified file or directory path does not exist on the filesystem.",
        "beginner_explanation": "Imagine looking for a file in a folder on your desk, but that folder is empty or doesn't exist. Your code is trying to open a file at a path that doesn't exist.",
        "advanced_explanation": "FileNotFoundError (subclass of OSError) is raised by open(), os.stat(), and similar filesystem operations when the path doesn't resolve to an existing file. Causes include relative vs absolute path confusion, working directory differences, platform-specific path separators, and race conditions.",
        "fix_recommendations": [
            "Check if the file exists: os.path.exists(path) or Path(path).exists()",
            "Use absolute paths or pathlib.Path for reliable path resolution",
            "Print os.getcwd() to verify the working directory",
            "Check for case-sensitivity issues (Linux is case-sensitive)"
        ],
        "prevention_strategies": [
            "Use pathlib.Path for cross-platform path handling",
            "Store file paths in configuration, not hardcoded",
            "Always use context managers (with open) for file operations"
        ],
        "best_practices": [
            "Use __file__ or Path(__file__).parent to build paths relative to the script",
            "Create directories with os.makedirs(path, exist_ok=True)",
            "Log the full resolved path in error messages"
        ],
        "learning_resources": ["Filesystem paths", "Working directory", "pathlib"],
        "related_errors": ["PermissionError", "IsADirectoryError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "SyntaxError",
        "error_category": "Python",
        "root_cause": "The Python parser encountered code that doesn't follow the language's grammar rules.",
        "beginner_explanation": "It's like writing a sentence without proper grammar. Python can't understand what you wrote because the structure doesn't follow the rules.",
        "advanced_explanation": "SyntaxError is raised during the parsing phase, before any code executes. The parser (CPython's PEG parser since 3.9) failed to match the token stream against any valid grammar production. Common causes: missing colons, unmatched brackets, invalid assignment targets, and mixing tabs/spaces.",
        "fix_recommendations": [
            "Check the line indicated AND the line before it (the error may be a missing bracket)",
            "Ensure all brackets (), [], {} are properly matched",
            "Add missing colons after if/for/while/def/class statements",
            "Check for unclosed string literals"
        ],
        "prevention_strategies": [
            "Use an IDE with syntax highlighting and bracket matching",
            "Configure your editor to show whitespace characters",
            "Run your code through a linter before executing"
        ],
        "best_practices": [
            "Use 4 spaces for indentation (PEP 8), never mix tabs and spaces",
            "Keep lines under 79-120 characters to catch missing brackets easier",
            "Use black or autopep8 for automatic formatting"
        ],
        "learning_resources": ["Python grammar", "AST", "Parser internals"],
        "related_errors": ["IndentationError", "TabError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "OverflowError",
        "error_category": "Python",
        "root_cause": "A numerical operation produced a result too large for the number type to represent.",
        "beginner_explanation": "Imagine trying to fill a glass with an ocean. The glass (number type) can't hold that much. The result is too large.",
        "advanced_explanation": "Python ints have arbitrary precision, so OverflowError primarily affects floats (IEEE 754 doubles max ~1.8e308) and C-extension types. It also occurs with math.exp() for large arguments, range() with huge values, and some numpy operations.",
        "fix_recommendations": [
            "Use Python's arbitrary-precision integers instead of floats",
            "Apply logarithmic transformations to large numbers",
            "Use numpy with appropriate dtypes (float128, int64)",
            "Check for exponential growth patterns in computations"
        ],
        "prevention_strategies": [
            "Validate numerical ranges before computation",
            "Use math.log for multiplicative operations to avoid overflow",
            "Apply numerical stability techniques"
        ],
        "best_practices": [
            "Use decimal.Decimal for precise large-number arithmetic",
            "Normalize values before mathematical operations",
            "Test with edge case values (very large, very small, negative)"
        ],
        "learning_resources": ["IEEE 754", "Numerical stability", "Arbitrary precision"],
        "related_errors": ["ZeroDivisionError", "MemoryError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "StopIteration",
        "error_category": "Python",
        "root_cause": "A generator or iterator has been exhausted and next() was called on it without a default value.",
        "beginner_explanation": "Imagine flipping through pages of a book and reaching the last page. There are no more pages to turn — the iterator is exhausted.",
        "advanced_explanation": "StopIteration signals that an iterator has no more items. It's raised by __next__() and caught automatically by for-loops. Manual next() calls without a default trigger this. In Python 3.7+, StopIteration inside a generator is converted to RuntimeError.",
        "fix_recommendations": [
            "Use next(iterator, default_value) with a default",
            "Use for-loops instead of manual next() calls",
            "Check if the iterator has items with any() or list()",
            "Re-create the iterator if you need to iterate again"
        ],
        "prevention_strategies": [
            "Prefer for-loops over manual iterator protocol",
            "Use itertools functions for safe iterator operations",
            "Remember iterators are single-pass — convert to list if needed"
        ],
        "best_practices": [
            "Use itertools.chain, islice, etc. for composing iterators",
            "Avoid catching StopIteration in generators (Python 3.7+)",
            "Use generator expressions for lazy evaluation"
        ],
        "learning_resources": ["Iterator protocol", "Generators", "itertools"],
        "related_errors": ["RuntimeError", "IndexError"],
        "frameworks": ["Python"]
    },
    {
        "error_name": "IndentationError",
        "error_category": "Python",
        "root_cause": "The code has incorrect or inconsistent indentation.",
        "beginner_explanation": "Python uses spaces at the start of lines to know which code belongs together — like nested bullet points. If the spacing is wrong, Python gets confused.",
        "advanced_explanation": "Python uses indentation to delimit code blocks (unlike {} in C/Java). IndentationError is a subclass of SyntaxError and is caught at parse time. It occurs when mixing tabs and spaces, inconsistent indentation levels, or missing indentation after compound statements.",
        "fix_recommendations": [
            "Configure your editor to use 4 spaces per indent (PEP 8)",
            "Convert all tabs to spaces in the file",
            "Use 'Show whitespace' in your editor to see the difference",
            "Run python -tt script.py to detect tab/space mixing"
        ],
        "prevention_strategies": [
            "Set editor to insert spaces on Tab key press",
            "Use an auto-formatter like black",
            "Never mix tabs and spaces in the same file"
        ],
        "best_practices": [
            "Use .editorconfig to enforce consistent settings across team",
            "Set up pre-commit hooks with black/autopep8",
            "Use 4 spaces per level — this is the universal Python standard"
        ],
        "learning_resources": ["PEP 8 style guide", "Code formatting", "Python blocks"],
        "related_errors": ["SyntaxError", "TabError"],
        "frameworks": ["Python"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# JAVASCRIPT / NODE.JS ERRORS
# ═══════════════════════════════════════════════════════════════════

JAVASCRIPT_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "ReferenceError",
        "error_category": "JavaScript",
        "root_cause": "A variable is referenced that has not been declared or is not accessible in the current scope.",
        "beginner_explanation": "You're trying to use a variable that JavaScript doesn't know about. It's like calling someone by a name that doesn't exist — JavaScript says 'who?'",
        "advanced_explanation": "ReferenceError occurs when the JavaScript engine can't resolve a reference during the identifier resolution phase. With 'let' and 'const', accessing a variable before its declaration causes a ReferenceError due to the Temporal Dead Zone (TDZ), unlike 'var' which hoists to undefined.",
        "fix_recommendations": [
            "Check for typos in variable or function names",
            "Ensure the variable is declared before use with let, const, or var",
            "Verify the variable is in scope (function, block, or module scope)",
            "Check for Temporal Dead Zone issues with let/const"
        ],
        "prevention_strategies": [
            "Use 'use strict' to catch undeclared variable usage",
            "Use ESLint with no-undef rule enabled",
            "Prefer const/let over var for block scoping"
        ],
        "best_practices": [
            "Declare variables at the top of their scope",
            "Use TypeScript for compile-time variable checking",
            "Enable ESLint in your editor for real-time feedback"
        ],
        "learning_resources": ["JavaScript scoping", "Hoisting", "Temporal Dead Zone"],
        "related_errors": ["TypeError", "SyntaxError"],
        "frameworks": ["JavaScript", "Node.js"]
    },
    {
        "error_name": "TypeError (JS)",
        "error_category": "JavaScript",
        "root_cause": "An operation is performed on a value of the wrong type, often calling undefined as a function or accessing properties of null/undefined.",
        "beginner_explanation": "JavaScript expected one kind of thing but got another. Like trying to call a number as if it were a phone — numbers aren't callable.",
        "advanced_explanation": "JavaScript TypeError occurs when: a non-function is invoked, a property of null/undefined is accessed, a read-only property is assigned in strict mode, or an argument doesn't match the expected type. The loose type system and truthy/falsy coercion make this especially common.",
        "fix_recommendations": [
            "Check if the value is null or undefined before accessing properties",
            "Use optional chaining: obj?.property?.method()",
            "Verify function existence before calling: typeof fn === 'function'",
            "Use nullish coalescing: value ?? defaultValue"
        ],
        "prevention_strategies": [
            "Use TypeScript for static type checking",
            "Enable strict mode: 'use strict'",
            "Use optional chaining (?.) and nullish coalescing (??) operators"
        ],
        "best_practices": [
            "Always validate API response data before accessing nested properties",
            "Use defensive checks at module boundaries",
            "Prefer TypeScript interfaces for function parameters"
        ],
        "learning_resources": ["JavaScript type coercion", "Optional chaining", "TypeScript"],
        "related_errors": ["ReferenceError", "RangeError"],
        "frameworks": ["JavaScript", "Node.js", "React"]
    },
    {
        "error_name": "RangeError",
        "error_category": "JavaScript",
        "root_cause": "A numeric value is outside the allowable range, such as exceeding the maximum call stack size or creating an invalid array length.",
        "beginner_explanation": "You asked JavaScript to do something with a number that's too big, too small, or doesn't make sense — like creating an array with -1 items.",
        "advanced_explanation": "RangeError is thrown when: recursion exceeds the call stack limit (typically ~10K frames), Array constructor receives an invalid length, Number.toFixed() gets precision > 100, or toExponential() receives invalid digits. The 'Maximum call stack size exceeded' variant indicates infinite recursion.",
        "fix_recommendations": [
            "For 'Maximum call stack size exceeded': find and fix the infinite recursion",
            "For Array length errors: validate length is a non-negative integer",
            "Convert recursive solutions to iterative with explicit stacks",
            "Check for circular references in JSON.stringify()"
        ],
        "prevention_strategies": [
            "Always define clear base cases in recursive functions",
            "Use iterative approaches for deep traversals",
            "Validate numeric inputs before array/buffer operations"
        ],
        "best_practices": [
            "Use trampolining or tail-call optimization patterns",
            "Set recursion depth limits in algorithms",
            "Use JSON.stringify replacer to handle circular references"
        ],
        "learning_resources": ["Call stack", "Recursion", "Stack overflow"],
        "related_errors": ["TypeError", "ReferenceError"],
        "frameworks": ["JavaScript", "Node.js"]
    },
    {
        "error_name": "SyntaxError (JS)",
        "error_category": "JavaScript",
        "root_cause": "The JavaScript parser encountered code that doesn't conform to the language grammar.",
        "beginner_explanation": "JavaScript can't understand what you wrote. It's like writing a sentence in a foreign language — the grammar rules don't match.",
        "advanced_explanation": "SyntaxError is thrown during parsing (before execution). Common causes: JSON.parse() with invalid JSON, unterminated string literals, missing brackets/parentheses, unexpected tokens, and using reserved words as identifiers. In modules, import/export syntax errors also trigger this.",
        "fix_recommendations": [
            "Check for unmatched brackets, parentheses, and braces",
            "Validate JSON strings before JSON.parse()",
            "Look for missing commas in object/array literals",
            "Check for reserved word conflicts"
        ],
        "prevention_strategies": [
            "Use a code editor with bracket matching",
            "Run ESLint to catch syntax issues before execution",
            "Use Prettier for consistent auto-formatting"
        ],
        "best_practices": [
            "Always use try/catch around JSON.parse()",
            "Use template literals for multi-line strings",
            "Configure ESLint + Prettier in your project"
        ],
        "learning_resources": ["JavaScript parsing", "JSON format", "AST"],
        "related_errors": ["ReferenceError", "URIError"],
        "frameworks": ["JavaScript", "Node.js"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# REACT ERRORS
# ═══════════════════════════════════════════════════════════════════

REACT_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "Invalid Hook Call",
        "error_category": "React",
        "root_cause": "React hooks were called outside a function component, inside a conditional, in a loop, or the React version doesn't support hooks.",
        "beginner_explanation": "React hooks (useState, useEffect, etc.) have strict rules about where they can be used. You called one in a place React doesn't allow.",
        "advanced_explanation": "React hooks rely on the order they are called to maintain state association across renders. Calling hooks conditionally, in loops, or in regular functions breaks this ordering invariant. React tracks hooks per fiber node using a linked list — skipping a call shifts all subsequent hooks.",
        "fix_recommendations": [
            "Only call hooks at the top level of function components",
            "Never call hooks inside if/else, loops, or nested functions",
            "Ensure you have only one copy of React in your bundle",
            "Check that react and react-dom versions match"
        ],
        "prevention_strategies": [
            "Install eslint-plugin-react-hooks for automatic rule checking",
            "Follow the Rules of Hooks strictly",
            "Prefix custom hook names with 'use' to enable linting"
        ],
        "best_practices": [
            "Extract conditional logic inside the hook, not around it",
            "Use custom hooks to encapsulate complex hook logic",
            "Check for duplicate React instances with npm ls react"
        ],
        "learning_resources": ["Rules of Hooks", "React fiber architecture", "Custom hooks"],
        "related_errors": ["Too many re-renders", "Invalid element type"],
        "frameworks": ["React", "Next.js"]
    },
    {
        "error_name": "Too Many Re-renders",
        "error_category": "React",
        "root_cause": "A component is caught in an infinite render loop, usually caused by calling setState directly in the render body.",
        "beginner_explanation": "Your component keeps updating itself non-stop, like a dog chasing its own tail. Setting state during render causes another render, which sets state again... forever.",
        "advanced_explanation": "React limits the number of re-renders to prevent infinite loops. This occurs when setState is called unconditionally during render, when useEffect dependencies cause cascading updates, or when event handlers are invoked instead of referenced (onClick={fn()} vs onClick={fn}).",
        "fix_recommendations": [
            "Wrap state updates in event handlers or useEffect",
            "Use onClick={fn} not onClick={fn()} — pass a reference, don't invoke",
            "Add proper dependency arrays to useEffect",
            "Use useCallback to memoize event handler functions"
        ],
        "prevention_strategies": [
            "Never call setState directly in the component body",
            "Always provide dependency arrays for useEffect",
            "Use React.StrictMode in development to catch issues"
        ],
        "best_practices": [
            "Derive computed values instead of using useEffect for transformations",
            "Use useMemo for expensive computations",
            "Keep component render functions pure (no side effects)"
        ],
        "learning_resources": ["React render cycle", "useEffect dependencies", "Memoization"],
        "related_errors": ["Invalid Hook Call", "Maximum update depth"],
        "frameworks": ["React", "Next.js"]
    },
    {
        "error_name": "Missing Key Prop",
        "error_category": "React",
        "root_cause": "When rendering a list of elements, each element must have a unique 'key' prop for React's reconciliation algorithm.",
        "beginner_explanation": "React needs a unique name tag for each item in a list — like student IDs in a classroom. Without them, React can't efficiently track which items changed.",
        "advanced_explanation": "React's virtual DOM diffing algorithm (reconciliation) uses keys to match old and new elements in a list. Without keys or with non-unique/index-based keys, React may incorrectly reuse or destroy component instances, causing UI bugs and performance issues.",
        "fix_recommendations": [
            "Add a unique key prop to each element in the array: key={item.id}",
            "Use unique identifiers from your data, not array indices",
            "Generate stable unique IDs if your data lacks them",
            "Use crypto.randomUUID() or nanoid for generated keys"
        ],
        "prevention_strategies": [
            "Always use unique, stable keys from data IDs",
            "Avoid using array index as key when list items can reorder",
            "Enable ESLint react/jsx-key rule"
        ],
        "best_practices": [
            "Use database IDs or stable unique identifiers as keys",
            "Index-as-key is acceptable ONLY for static, non-reorderable lists",
            "Never use Math.random() as a key — it changes every render"
        ],
        "learning_resources": ["React reconciliation", "Virtual DOM", "List rendering"],
        "related_errors": ["Too many re-renders", "Component unmounting"],
        "frameworks": ["React", "Next.js"]
    },
    {
        "error_name": "Cannot Update Unmounted Component",
        "error_category": "React",
        "root_cause": "A state update was attempted on a component that has already been unmounted from the DOM.",
        "beginner_explanation": "You're trying to change something that no longer exists — like trying to repaint a wall in a house that's been demolished. The component is gone.",
        "advanced_explanation": "This occurs when async operations (fetch, setTimeout, subscriptions) complete after the component unmounts. The state update targets a disposed fiber node. In React 18+, this warning is suppressed as React handles it gracefully, but it still indicates a potential memory leak from un-cleaned subscriptions.",
        "fix_recommendations": [
            "Use a cleanup function in useEffect to cancel async operations",
            "Use AbortController to cancel fetch requests on unmount",
            "Use a ref to track mounted state: const isMounted = useRef(true)",
            "Clear timeouts and intervals in useEffect cleanup"
        ],
        "prevention_strategies": [
            "Always return cleanup functions from useEffect",
            "Use AbortController for all fetch calls inside effects",
            "Prefer React Query or SWR for data fetching — they handle this automatically"
        ],
        "best_practices": [
            "Use the cleanup pattern: return () => { controller.abort(); }",
            "Move data fetching to parent components or custom hooks",
            "Use React Suspense for async rendering patterns"
        ],
        "learning_resources": ["useEffect cleanup", "AbortController", "Memory leaks"],
        "related_errors": ["Memory leak", "Too many re-renders"],
        "frameworks": ["React", "Next.js"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# NEXT.JS ERRORS
# ═══════════════════════════════════════════════════════════════════

NEXTJS_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "Hydration Mismatch",
        "error_category": "Next.js",
        "root_cause": "The HTML rendered on the server doesn't match what the client-side React expects, causing a hydration error.",
        "beginner_explanation": "The server built one version of the page, but the browser tried to build a different version. They need to match exactly — like two copies of the same blueprint.",
        "advanced_explanation": "Next.js uses server-side rendering (SSR) where React generates HTML on the server. During hydration, client-side React attaches event listeners to the existing DOM. If the DOM structure differs (e.g., due to browser extensions, Date/random values, conditional rendering based on window), React throws a hydration error.",
        "fix_recommendations": [
            "Wrap browser-only code in useEffect or check typeof window !== 'undefined'",
            "Use suppressHydrationWarning for intentionally dynamic content",
            "Avoid using Date.now() or Math.random() in render — use useEffect instead",
            "Check for browser extensions injecting elements"
        ],
        "prevention_strategies": [
            "Separate server-only and client-only logic clearly",
            "Use 'use client' directive for client-only components",
            "Test with SSR and client rendering in development"
        ],
        "best_practices": [
            "Use next/dynamic with ssr: false for client-only components",
            "Keep initial render deterministic — defer dynamic content to useEffect",
            "Use Next.js App Router's server/client component patterns"
        ],
        "learning_resources": ["SSR hydration", "Server components", "Client components"],
        "related_errors": ["Text content mismatch", "Invalid HTML nesting"],
        "frameworks": ["Next.js", "React"]
    },
    {
        "error_name": "Module Not Found (Next.js)",
        "error_category": "Next.js",
        "root_cause": "A module import could not be resolved during the Next.js webpack/turbopack build process.",
        "beginner_explanation": "Next.js can't find a file or package you're trying to import. Either the package isn't installed or the file path is wrong.",
        "advanced_explanation": "Next.js's bundler (webpack or turbopack) resolves modules during build. This error occurs when: a package isn't in node_modules, the import path has a typo, a server-only module is imported in a client component, or path aliases in tsconfig.json don't match.",
        "fix_recommendations": [
            "Install the missing package: npm install <package>",
            "Check for typos in the import path",
            "Verify tsconfig.json path aliases match the import",
            "Ensure server-only modules aren't imported in client components"
        ],
        "prevention_strategies": [
            "Use TypeScript for import validation at compile time",
            "Configure path aliases in tsconfig.json",
            "Keep package.json dependencies up to date"
        ],
        "best_practices": [
            "Use @/ prefix for project-root imports via tsconfig paths",
            "Separate server and client utility modules",
            "Run npm ls to verify dependency tree"
        ],
        "learning_resources": ["Module resolution", "Path aliases", "Server vs client"],
        "related_errors": ["Build error", "Compilation error"],
        "frameworks": ["Next.js"]
    },
    {
        "error_name": "API Route Error",
        "error_category": "Next.js",
        "root_cause": "A Next.js API route (/api/...) encountered an error during execution.",
        "beginner_explanation": "Your backend API endpoint in Next.js crashed while handling a request. Something went wrong in the server-side code.",
        "advanced_explanation": "Next.js API routes (pages/api/ or app/api/) run as serverless functions. Errors can occur from: unhandled exceptions, missing environment variables, database connection failures, incorrect request body parsing, or exceeding serverless function execution time limits.",
        "fix_recommendations": [
            "Wrap API handler logic in try/catch blocks",
            "Validate request body with Zod or yup",
            "Check that environment variables are set in .env.local",
            "Add proper error response formatting with status codes"
        ],
        "prevention_strategies": [
            "Always validate request input at the handler boundary",
            "Use middleware for authentication and error handling",
            "Log errors with request context for debugging"
        ],
        "best_practices": [
            "Use Next.js middleware for cross-cutting concerns",
            "Return proper HTTP status codes with error details",
            "Implement global error handling patterns"
        ],
        "learning_resources": ["API routes", "Error handling", "Serverless functions"],
        "related_errors": ["500 Internal Server Error", "Timeout"],
        "frameworks": ["Next.js"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# NPM ERRORS
# ═══════════════════════════════════════════════════════════════════

NPM_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "ERESOLVE",
        "error_category": "npm",
        "root_cause": "npm could not resolve the dependency tree due to conflicting peer dependency requirements.",
        "beginner_explanation": "Two packages you're trying to install disagree on which version of another package they need — like two friends who want to go to different restaurants.",
        "advanced_explanation": "npm v7+ uses a strict dependency resolution algorithm that enforces peer dependency contracts. ERESOLVE occurs when Package A requires dependency@^1.0 but Package B requires dependency@^2.0, creating an unsatisfiable constraint. The older npm v6 algorithm was more lenient and would silently install potentially incompatible versions.",
        "fix_recommendations": [
            "npm install --legacy-peer-deps (uses npm v6 resolution)",
            "npm install --force (forces install ignoring conflicts)",
            "Update the conflicting packages to compatible versions",
            "Use npm ls <package> to identify the conflict chain"
        ],
        "prevention_strategies": [
            "Keep all packages updated regularly with npm outdated",
            "Use npx npm-check-updates to find upgradeable packages",
            "Pin exact versions for critical dependencies"
        ],
        "best_practices": [
            "Understand the conflict before bypassing with --legacy-peer-deps",
            "Test thoroughly after resolving peer dependency conflicts",
            "Use package overrides in package.json for controlled resolution"
        ],
        "learning_resources": ["Semantic versioning", "Peer dependencies", "Dependency trees"],
        "related_errors": ["Version conflict", "Peer dependency warning"],
        "frameworks": ["npm", "Node.js"]
    },
    {
        "error_name": "ENOENT",
        "error_category": "npm",
        "root_cause": "npm could not find a required file — typically package.json, a script, or a module file.",
        "beginner_explanation": "npm is looking for a file that doesn't exist. Maybe you're in the wrong directory, or the file was deleted.",
        "advanced_explanation": "ENOENT (Error NO ENTry) is a POSIX error code indicating the file system entry doesn't exist. In npm context, this usually means: running npm commands outside a project directory, corrupted node_modules, missing package.json, or a referenced file in bin/scripts doesn't exist.",
        "fix_recommendations": [
            "Ensure you're in the correct project directory (check for package.json)",
            "Delete node_modules and package-lock.json, then npm install",
            "Check that referenced scripts in package.json exist",
            "Run npm cache clean --force to clear corrupted cache"
        ],
        "prevention_strategies": [
            "Always verify you're in the project root before running npm commands",
            "Commit package.json and package-lock.json to version control",
            "Use npm ci in CI/CD for deterministic installs"
        ],
        "best_practices": [
            "Add a .nvmrc file to lock Node.js version",
            "Document setup steps in README.md",
            "Use npm scripts instead of global CLI tools"
        ],
        "learning_resources": ["npm project structure", "package.json", "File system errors"],
        "related_errors": ["ERESOLVE", "Module not found"],
        "frameworks": ["npm", "Node.js"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# API / HTTP ERRORS
# ═══════════════════════════════════════════════════════════════════

API_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "400 Bad Request",
        "error_category": "API",
        "root_cause": "The server cannot process the request due to malformed syntax, invalid parameters, or missing required fields.",
        "beginner_explanation": "You sent a request to the server but it didn't make sense — like ordering food in a language the waiter doesn't speak.",
        "advanced_explanation": "HTTP 400 indicates the request is syntactically or semantically invalid. The server refuses to process it without modification. Common causes: malformed JSON, missing Content-Type header, invalid query parameters, request body exceeding size limits, or failing server-side validation.",
        "fix_recommendations": [
            "Validate JSON structure with a JSON validator",
            "Check API documentation for required fields and types",
            "Log the exact request body for inspection",
            "Ensure Content-Type header matches body format"
        ],
        "prevention_strategies": [
            "Use typed request builders or SDK methods",
            "Validate request data client-side before sending",
            "Test API calls with Postman or curl first"
        ],
        "best_practices": ["Use Pydantic/Zod for request validation", "Return detailed error messages from API", "Log request payloads for debugging"],
        "learning_resources": ["HTTP methods", "REST API design", "Request validation"],
        "related_errors": ["422 Unprocessable Entity", "405 Method Not Allowed"],
        "frameworks": ["REST API", "FastAPI", "Express"]
    },
    {
        "error_name": "401 Unauthorized",
        "error_category": "API",
        "root_cause": "Authentication is required and has failed. The request lacks valid credentials.",
        "beginner_explanation": "The server doesn't know who you are. You didn't show your ID card (token/API key), or the one you showed is expired.",
        "advanced_explanation": "401 means the request lacks valid authentication credentials. This differs from 403 (Forbidden) where you're authenticated but lack permissions. Common causes: missing Authorization header, expired JWT, invalid API key, or incorrect token format.",
        "fix_recommendations": [
            "Verify the API key or token is correct and not expired",
            "Ensure Authorization header format: 'Bearer <token>'",
            "Refresh the access token if using OAuth2",
            "Check if the API key has been revoked"
        ],
        "prevention_strategies": ["Implement automatic token refresh", "Store tokens securely", "Monitor token expiration"],
        "best_practices": ["Use environment variables for API keys", "Implement retry with token refresh", "Log authentication failures for debugging"],
        "learning_resources": ["JWT tokens", "OAuth2 flow", "API authentication"],
        "related_errors": ["403 Forbidden", "CORS errors"],
        "frameworks": ["REST API", "OAuth2", "JWT"]
    },
    {
        "error_name": "403 Forbidden",
        "error_category": "API",
        "root_cause": "The server understood the request but refuses to authorize it. You're authenticated but lack permissions.",
        "beginner_explanation": "You showed your ID card, but you don't have permission to enter. It's like having a gym membership but trying to access the VIP area.",
        "advanced_explanation": "403 means authentication succeeded but authorization failed. The server knows who you are but you don't have the required role/permission. Also used for CORS violations, IP blocking, and when accessing resources outside your scope.",
        "fix_recommendations": ["Check API key permission scopes", "Verify IP is not blocked", "Contact API provider for elevated permissions", "For CORS: add domain to allowed origins"],
        "prevention_strategies": ["Request minimum necessary permissions", "Monitor for permission changes", "Implement proper role-based access control"],
        "best_practices": ["Use least-privilege principle for API keys", "Separate read/write API keys", "Audit permissions regularly"],
        "learning_resources": ["RBAC", "CORS", "API authorization"],
        "related_errors": ["401 Unauthorized", "CORS error"],
        "frameworks": ["REST API", "OAuth2"]
    },
    {
        "error_name": "404 Not Found",
        "error_category": "API",
        "root_cause": "The requested resource or endpoint does not exist on the server.",
        "beginner_explanation": "The page or API endpoint you're looking for doesn't exist — like going to an address that has no building.",
        "advanced_explanation": "404 means the server can't find anything at the requested URI. Causes: typo in URL, deleted resource, wrong API version, missing trailing slash, or incorrect path parameter. Some APIs return 404 instead of 401/403 to hide resource existence.",
        "fix_recommendations": ["Double-check the endpoint URL against documentation", "Verify the resource ID exists", "Check API version (v1 vs v2)", "Look for URL encoding issues"],
        "prevention_strategies": ["Use API clients/SDKs with typed endpoint builders", "Validate resource existence before operations", "Keep API documentation bookmarked"],
        "best_practices": ["Use constants for API endpoint URLs", "Implement graceful 404 handling in the client", "Return helpful messages in 404 responses"],
        "learning_resources": ["URL structure", "REST resources", "API versioning"],
        "related_errors": ["405 Method Not Allowed", "400 Bad Request"],
        "frameworks": ["REST API", "GraphQL"]
    },
    {
        "error_name": "429 Too Many Requests",
        "error_category": "API",
        "root_cause": "Rate limiting is being enforced — you've sent too many requests in a given time window.",
        "beginner_explanation": "You're knocking on the door too fast. The server says 'slow down!' and stops answering until you calm down.",
        "advanced_explanation": "429 indicates the client has exceeded the rate limit (requests/minute or requests/hour). The server may include Retry-After header indicating when to retry. Rate limits protect server resources and ensure fair usage across all clients.",
        "fix_recommendations": ["Implement exponential backoff retry logic", "Add delays between API calls: await sleep(1000)", "Check Retry-After header", "Cache responses to reduce calls", "Upgrade API plan for higher limits"],
        "prevention_strategies": ["Implement request throttling in your client", "Cache API responses aggressively", "Use webhooks instead of polling"],
        "best_practices": ["Use exponential backoff: 1s, 2s, 4s, 8s...", "Implement circuit breaker pattern", "Monitor rate limit headers proactively"],
        "learning_resources": ["Rate limiting", "Exponential backoff", "Circuit breaker pattern"],
        "related_errors": ["503 Service Unavailable", "Timeout"],
        "frameworks": ["REST API", "GraphQL"]
    },
    {
        "error_name": "500 Internal Server Error",
        "error_category": "API",
        "root_cause": "The server encountered an unexpected condition. This is a server-side bug, not a client error.",
        "beginner_explanation": "Something broke on the server's side — not your fault. It's like calling a restaurant and they say 'our kitchen is on fire, call back later.'",
        "advanced_explanation": "500 is a catch-all for unhandled server exceptions. Causes: uncaught exceptions in handler code, database failures, OOM, misconfigured environment variables, deployment errors. The client should retry with backoff, as this may be transient.",
        "fix_recommendations": ["Retry the request after a short delay", "Check the API's status page", "Reduce request payload size", "Contact API provider with request details and timestamp"],
        "prevention_strategies": ["Implement retry with exponential backoff", "Monitor API health endpoints", "Use circuit breakers for critical API calls"],
        "best_practices": ["Always handle 5xx errors gracefully in the client", "Show user-friendly error messages", "Log the full response for debugging"],
        "learning_resources": ["Error handling", "Retry strategies", "Observability"],
        "related_errors": ["502 Bad Gateway", "503 Service Unavailable"],
        "frameworks": ["REST API", "GraphQL", "gRPC"]
    },
    {
        "error_name": "CORS Error",
        "error_category": "API",
        "root_cause": "The browser blocked a cross-origin request because the server's CORS headers don't allow your domain.",
        "beginner_explanation": "Your website tried to talk to a different website's server, but that server said 'I don't know you, go away.' The browser enforces this security rule.",
        "advanced_explanation": "Cross-Origin Resource Sharing (CORS) is a browser security mechanism. When a frontend at origin A makes a request to origin B, the browser sends a preflight OPTIONS request. If the server doesn't return proper Access-Control-Allow-Origin, Access-Control-Allow-Methods, and Access-Control-Allow-Headers headers, the browser blocks the response.",
        "fix_recommendations": [
            "Add your frontend domain to the server's CORS allowed origins",
            "For development: use a proxy in your dev server config",
            "Ensure the server handles OPTIONS preflight requests",
            "Check that credentials mode matches CORS configuration"
        ],
        "prevention_strategies": ["Configure CORS properly from the start", "Use a proxy in development", "Test CORS with curl before frontend integration"],
        "best_practices": ["Never use Access-Control-Allow-Origin: * in production with credentials", "Whitelist specific origins", "Handle preflight caching with max-age"],
        "learning_resources": ["CORS", "Same-origin policy", "Preflight requests"],
        "related_errors": ["401 Unauthorized", "403 Forbidden"],
        "frameworks": ["Browser APIs", "FastAPI", "Express"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# DATABASE ERRORS
# ═══════════════════════════════════════════════════════════════════

DATABASE_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "OperationalError",
        "error_category": "Database",
        "root_cause": "A database operation failed — usually a connection issue, table not existing, or SQL syntax error at the database level.",
        "beginner_explanation": "The database is having trouble. Either it can't connect (the library is closed), the table doesn't exist (the book isn't in the shelf), or the query is malformed.",
        "advanced_explanation": "OperationalError in SQLAlchemy/psycopg2 wraps database-level failures including: connection refused (server down), connection timeout (network issues), 'relation does not exist' (missing table), column does not exist, and SQL syntax errors. It also occurs when connection pools are exhausted.",
        "fix_recommendations": [
            "Check database server is running and accessible",
            "Verify DATABASE_URL is correct (host, port, credentials)",
            "Run migrations to create missing tables",
            "Check connection pool settings (pool_size, max_overflow)"
        ],
        "prevention_strategies": ["Use connection pooling with health checks", "Run migrations in CI/CD", "Monitor database connection counts"],
        "best_practices": ["Use pool_pre_ping=True for connection health checks", "Set connection timeouts", "Use Alembic for migration management"],
        "learning_resources": ["Connection pooling", "Database migrations", "SQL fundamentals"],
        "related_errors": ["IntegrityError", "ProgrammingError"],
        "frameworks": ["PostgreSQL", "SQLAlchemy", "SQLite"]
    },
    {
        "error_name": "IntegrityError",
        "error_category": "Database",
        "root_cause": "A database constraint was violated — such as a unique constraint, foreign key constraint, or not-null constraint.",
        "beginner_explanation": "You tried to add data that breaks a rule in the database — like trying to register two accounts with the same email when only one is allowed.",
        "advanced_explanation": "IntegrityError covers all constraint violations: UNIQUE (duplicate key), FOREIGN KEY (referencing non-existent parent row), NOT NULL (inserting null into required column), CHECK (custom value constraints). The error message contains the constraint name which identifies the exact violation.",
        "fix_recommendations": [
            "Check for duplicate values before inserting (use ON CONFLICT/UPSERT)",
            "Verify foreign key references exist before creating child records",
            "Ensure all NOT NULL columns have values",
            "Use database transactions with proper rollback handling"
        ],
        "prevention_strategies": ["Use UPSERT patterns for idempotent operations", "Validate data before database operations", "Design schemas with appropriate constraints"],
        "best_practices": ["Always handle IntegrityError in try/except with rollback", "Use database-level constraints as last line of defense", "Log the constraint name from the error for quick diagnosis"],
        "learning_resources": ["Database constraints", "ACID properties", "Transactions"],
        "related_errors": ["OperationalError", "DataError"],
        "frameworks": ["PostgreSQL", "SQLAlchemy", "MySQL"]
    },
    {
        "error_name": "Deadlock",
        "error_category": "Database",
        "root_cause": "Two or more database transactions are waiting for each other to release locks, creating a circular dependency.",
        "beginner_explanation": "Two transactions are stuck in a standoff — each is waiting for the other to finish first, like two people blocking each other in a narrow hallway.",
        "advanced_explanation": "Deadlocks occur in concurrent systems when Transaction A holds Lock 1 and waits for Lock 2, while Transaction B holds Lock 2 and waits for Lock 1. The database detects this cycle and kills one transaction (the victim). PostgreSQL's deadlock detection timeout is configurable (default 1s).",
        "fix_recommendations": [
            "Always acquire locks in a consistent order across all transactions",
            "Keep transactions short — minimize time between lock acquisition and commit",
            "Use SELECT ... FOR UPDATE SKIP LOCKED for queue-style processing",
            "Implement retry logic for deadlock victims"
        ],
        "prevention_strategies": ["Design schemas to minimize lock contention", "Use optimistic concurrency control when possible", "Batch operations to reduce lock duration"],
        "best_practices": ["Implement automatic retry with exponential backoff for deadlocks", "Monitor deadlock frequency as a system health metric", "Use row-level locking instead of table-level locking"],
        "learning_resources": ["Database locking", "Concurrency control", "Transaction isolation"],
        "related_errors": ["OperationalError", "Timeout"],
        "frameworks": ["PostgreSQL", "MySQL", "SQLAlchemy"]
    },
]

# ═══════════════════════════════════════════════════════════════════
# AUTHENTICATION ERRORS
# ═══════════════════════════════════════════════════════════════════

AUTH_ERRORS: List[KnowledgeEntry] = [
    {
        "error_name": "Invalid Token",
        "error_category": "Authentication",
        "root_cause": "The authentication token (JWT, API key, OAuth token) is malformed, expired, or has been revoked.",
        "beginner_explanation": "Your digital ID card has expired or is fake. The system can't verify who you are, so it blocks access.",
        "advanced_explanation": "Token validation can fail at multiple points: JWT signature verification (wrong secret/key), expiration check (exp claim in the past), audience mismatch (aud claim), issuer mismatch (iss claim), or the token has been revoked/blacklisted. Tokens are typically Base64-encoded JSON with a cryptographic signature.",
        "fix_recommendations": [
            "Refresh the token using the refresh token endpoint",
            "Check token expiration and implement proactive refresh",
            "Verify the token signing key/secret matches the server",
            "Clear cached tokens and re-authenticate"
        ],
        "prevention_strategies": ["Implement automatic token refresh before expiration", "Store tokens securely (httpOnly cookies or secure storage)", "Monitor token expiration times"],
        "best_practices": ["Use short-lived access tokens with long-lived refresh tokens", "Implement token revocation for logout", "Never log or expose tokens in URLs"],
        "learning_resources": ["JWT structure", "OAuth2 flow", "Token lifecycle"],
        "related_errors": ["401 Unauthorized", "403 Forbidden"],
        "frameworks": ["JWT", "OAuth2", "Firebase Auth"]
    },
    {
        "error_name": "OAuth2 Error",
        "error_category": "Authentication",
        "root_cause": "An OAuth2 authentication flow failed — misconfigured redirect URI, invalid client ID, or expired authorization code.",
        "beginner_explanation": "The login process through Google/GitHub broke somewhere. It's like the login handshake failed — the third-party service couldn't verify your identity properly.",
        "advanced_explanation": "OAuth2 errors occur in the authorization flow: invalid_client (wrong client_id/secret), invalid_grant (expired auth code), invalid_redirect_uri (mismatch with registered URIs), access_denied (user declined permission), or invalid_scope (requesting permissions not registered).",
        "fix_recommendations": [
            "Verify client_id and client_secret match the OAuth provider settings",
            "Check redirect_uri exactly matches the registered URI (including trailing slash)",
            "Ensure authorization code is used within its validity window",
            "Verify requested scopes are enabled in the OAuth app settings"
        ],
        "prevention_strategies": ["Register exact redirect URIs in the OAuth provider", "Use PKCE for public clients", "Implement proper state parameter for CSRF protection"],
        "best_practices": ["Store OAuth credentials in environment variables", "Use established OAuth libraries instead of manual implementation", "Implement proper error handling for each OAuth error type"],
        "learning_resources": ["OAuth2 authorization code flow", "PKCE", "OpenID Connect"],
        "related_errors": ["Invalid Token", "CORS Error"],
        "frameworks": ["OAuth2", "Firebase Auth", "NextAuth.js"]
    },
]


# ═══════════════════════════════════════════════════════════════════
# UNIFIED ACCESS API
# ═══════════════════════════════════════════════════════════════════

def _build_full_kb() -> Dict[str, KnowledgeEntry]:
    """Builds a single lookup dictionary keyed by error_name (lowercased)."""
    all_entries = (
        PYTHON_ERRORS
        + JAVASCRIPT_ERRORS
        + REACT_ERRORS
        + NEXTJS_ERRORS
        + NPM_ERRORS
        + API_ERRORS
        + DATABASE_ERRORS
        + AUTH_ERRORS
    )
    return {entry["error_name"].lower(): entry for entry in all_entries}


# Singleton KB dictionary
FULL_KNOWLEDGE_BASE: Dict[str, KnowledgeEntry] = _build_full_kb()

# All entries as a flat list (useful for search indexing)
ALL_KB_ENTRIES: List[KnowledgeEntry] = (
    PYTHON_ERRORS
    + JAVASCRIPT_ERRORS
    + REACT_ERRORS
    + NEXTJS_ERRORS
    + NPM_ERRORS
    + API_ERRORS
    + DATABASE_ERRORS
    + AUTH_ERRORS
)


def get_kb_entry(error_name: str) -> KnowledgeEntry | None:
    """Looks up a knowledge base entry by exact error name (case-insensitive)."""
    return FULL_KNOWLEDGE_BASE.get(error_name.lower())


def search_kb_by_category(category: str) -> List[KnowledgeEntry]:
    """Returns all KB entries matching a given category."""
    cat_lower = category.lower()
    return [e for e in ALL_KB_ENTRIES if e["error_category"].lower() == cat_lower]


def get_all_categories() -> List[str]:
    """Returns all unique categories in the KB."""
    return sorted(set(e["error_category"] for e in ALL_KB_ENTRIES))


def get_kb_stats() -> Dict[str, Any]:
    """Returns summary statistics about the knowledge base."""
    categories = {}
    for entry in ALL_KB_ENTRIES:
        cat = entry["error_category"]
        categories[cat] = categories.get(cat, 0) + 1
    return {
        "total_entries": len(ALL_KB_ENTRIES),
        "categories": categories,
        "category_count": len(categories),
    }
