"""
AI-Engineer-OS Error Analysis Engine
=====================================
Pure-Python rule-based error parsing, classification, and analysis.
Handles Python tracebacks, Node.js/npm errors, API HTTP errors,
and dependency conflicts with structured output.
"""

import re
from typing import List, Optional, Dict, Any


# =============================================================================
# ERROR CATEGORY DEFINITIONS
# =============================================================================

CATEGORIES = {
    "Syntax Error": ["SyntaxError", "IndentationError", "TabError", "unexpected token", "parsing error"],
    "Runtime Error": [
        "ZeroDivisionError", "RecursionError", "OverflowError", "MemoryError",
        "RuntimeError", "StopIteration", "SystemExit", "RangeError", "ReferenceError"
    ],
    "Import Error": [
        "ImportError", "ModuleNotFoundError", "Cannot find module",
        "Module not found", "No module named"
    ],
    "Type Error": ["TypeError", "NaN", "undefined is not a function"],
    "Value Error": ["ValueError", "invalid literal"],
    "Key Error": ["KeyError"],
    "Index Error": ["IndexError", "list index out of range"],
    "Attribute Error": ["AttributeError", "has no attribute"],
    "Name Error": ["NameError", "is not defined"],
    "API Error": [
        "400", "401", "403", "404", "405", "408", "429", "500", "502", "503",
        "Bad Request", "Unauthorized", "Forbidden", "Not Found",
        "Too Many Requests", "Internal Server Error", "Bad Gateway",
        "Service Unavailable", "HTTPError", "ConnectionError", "TimeoutError",
        "CORS", "cors", "ECONNREFUSED"
    ],
    "Dependency Error": [
        "npm ERR!", "ERESOLVE", "peer dep", "version conflict",
        "could not resolve", "requires a peer", "WARN deprecated",
        "incompatible", "version mismatch"
    ],
    "Database Error": [
        "OperationalError", "IntegrityError", "ProgrammingError",
        "InternalError", "DataError", "DatabaseError", "psycopg2",
        "sqlalchemy", "relation .* does not exist", "duplicate key",
        "deadlock", "connection refused", "SQLITE_ERROR"
    ],
    "Authentication Error": [
        "AuthenticationError", "PermissionError", "AccessDenied",
        "401 Unauthorized", "403 Forbidden", "invalid token",
        "expired token", "JWT", "auth failed", "login failed"
    ],
    "Validation Error": [
        "ValidationError", "pydantic", "field required",
        "value is not a valid", "ensure this value", "schema validation"
    ],
    "File Error": [
        "FileNotFoundError", "IsADirectoryError", "PermissionError",
        "ENOENT", "no such file or directory"
    ],
}


# =============================================================================
# PYTHON ERROR KNOWLEDGE BASE
# =============================================================================

PYTHON_ERROR_KB: Dict[str, Dict[str, Any]] = {
    "NameError": {
        "explanation": "A variable or function name was used before it was defined or assigned.",
        "root_cause": "Referencing an identifier that hasn't been declared in the current scope — commonly caused by typos, using a variable before assignment, or forgetting to import a module.",
        "fixes": [
            "Check for typos in the variable or function name",
            "Ensure the variable is defined before it is referenced",
            "Verify required imports are present at the top of the file",
            "Check scope — variables defined inside a function aren't accessible outside it"
        ],
        "best_practices": [
            "Use an IDE with autocomplete to avoid typos",
            "Initialize variables at the top of their scope",
            "Run a linter (pylint, flake8) to catch undefined names early"
        ],
        "learning": "Python resolves names at runtime. The LEGB rule (Local → Enclosing → Global → Built-in) determines where Python searches for a name."
    },
    "TypeError": {
        "explanation": "An operation or function was applied to an object of the wrong type.",
        "root_cause": "Attempting an operation on incompatible types — like adding a string to an integer, calling a non-callable object, or passing wrong argument types to a function.",
        "fixes": [
            "Check the types of operands using type() or isinstance()",
            "Convert types explicitly: int(), str(), float(), list()",
            "Verify function signatures match the arguments you're passing",
            "Check for None values that might be passed to functions expecting other types"
        ],
        "best_practices": [
            "Use type hints to document expected parameter types",
            "Add runtime type checks for critical functions",
            "Use Python's typing module for complex type annotations"
        ],
        "learning": "Python is dynamically typed but strongly typed — you can't implicitly mix incompatible types like `'5' + 3`. Use explicit conversion: `int('5') + 3`."
    },
    "ValueError": {
        "explanation": "A function received an argument of the correct type but an inappropriate value.",
        "root_cause": "Passing a value that doesn't satisfy the function's constraints — like converting a non-numeric string to int, or passing a negative number where positive is required.",
        "fixes": [
            "Validate input data before processing",
            "Use try/except blocks around conversion operations",
            "Add input sanitization and boundary checks",
            "Check data format matches expected patterns"
        ],
        "best_practices": [
            "Always validate user inputs before passing them to core logic",
            "Use regex or parsing libraries for structured data validation",
            "Implement the 'fail fast' principle — check preconditions early"
        ],
        "learning": "ValueError differs from TypeError: TypeError means wrong type, ValueError means right type but wrong content. Example: `int('abc')` raises ValueError because 'abc' is a string (correct type for int()) but not a valid integer representation."
    },
    "KeyError": {
        "explanation": "A dictionary key was accessed that does not exist in the dictionary.",
        "root_cause": "Attempting to read a key from a dict using `dict[key]` syntax when that key hasn't been set. Common when processing JSON/API responses with missing fields.",
        "fixes": [
            "Use dict.get('key', default_value) instead of dict['key']",
            "Check if the key exists first: if 'key' in my_dict:",
            "Use try/except KeyError around dictionary access",
            "Use collections.defaultdict for dictionaries with default values"
        ],
        "best_practices": [
            "Always use .get() with a default when accessing optional keys",
            "Validate API response structure before accessing nested fields",
            "Use Pydantic models or TypedDict for structured data validation"
        ],
        "learning": "dict['key'] raises KeyError if missing, but dict.get('key') returns None. For nested dicts, chain .get() calls: `data.get('user', {}).get('name', 'Unknown')`."
    },
    "IndexError": {
        "explanation": "A sequence (list, tuple, string) was accessed with an index that is out of range.",
        "root_cause": "Accessing an index >= len(sequence) or < -len(sequence). Often caused by off-by-one errors in loops, empty lists, or incorrect assumptions about data length.",
        "fixes": [
            "Check the length of the sequence before accessing: if len(lst) > index:",
            "Use try/except IndexError for graceful handling",
            "Verify loop ranges don't exceed list boundaries",
            "Handle empty list/array edge cases explicitly"
        ],
        "best_practices": [
            "Use enumerate() instead of manual index tracking in loops",
            "Prefer 'for item in list' over 'for i in range(len(list))'",
            "Add boundary checks for any index-based access"
        ],
        "learning": "Python lists are 0-indexed. A list with 5 items has valid indices 0-4. Negative indices count from the end: lst[-1] is the last element."
    },
    "ImportError": {
        "explanation": "Python could not import a module or a specific name from a module.",
        "root_cause": "The module doesn't exist, isn't installed, or the specific name being imported doesn't exist within the module. Can also be caused by circular imports.",
        "fixes": [
            "Install the missing package: pip install <package_name>",
            "Check for typos in the module or attribute name",
            "Verify you're using the correct Python environment (venv)",
            "Check for circular imports between your own modules"
        ],
        "best_practices": [
            "Keep a requirements.txt updated with all dependencies",
            "Use virtual environments to isolate project dependencies",
            "Run 'pip freeze' to verify installed packages"
        ],
        "learning": "ImportError and ModuleNotFoundError are related: ModuleNotFoundError is a subclass of ImportError (added in Python 3.6). Both indicate missing modules, but ModuleNotFoundError specifically means the module couldn't be found at all."
    },
    "ModuleNotFoundError": {
        "explanation": "The specified Python module could not be found in any of the search paths.",
        "root_cause": "The package is not installed in the current Python environment, the module name is misspelled, or the PYTHONPATH doesn't include the module's directory.",
        "fixes": [
            "Install the package: pip install <package_name>",
            "Check if you're in the correct virtual environment",
            "Verify the package name — pip package names sometimes differ from import names (e.g., pip install Pillow, import PIL)",
            "Add the module's parent directory to PYTHONPATH or sys.path"
        ],
        "best_practices": [
            "Always activate your virtual environment before running code",
            "Pin exact versions in requirements.txt for reproducible builds",
            "Use 'pip list' to verify what's installed"
        ],
        "learning": "Common mismatches: install 'opencv-python' → import 'cv2', install 'Pillow' → import 'PIL', install 'PyMuPDF' → import 'fitz', install 'python-dotenv' → import 'dotenv'."
    },
    "AttributeError": {
        "explanation": "An object does not have the attribute (method or property) being accessed.",
        "root_cause": "Calling a method or accessing a property that doesn't exist on that object type. Often caused by None values, wrong object types, or version mismatches in libraries.",
        "fixes": [
            "Check the object's type using type(obj) — it may be None",
            "Verify the method/attribute exists using hasattr(obj, 'name')",
            "Check library documentation for correct API usage",
            "Ensure you haven't shadowed a module name with a local variable"
        ],
        "best_practices": [
            "Add None checks before chaining method calls",
            "Use optional chaining patterns: getattr(obj, 'attr', default)",
            "Check library version — APIs change between versions"
        ],
        "learning": "A common pattern: `result = some_function()` returns None on failure, then `result.process()` raises AttributeError because NoneType has no 'process' method. Always check return values."
    },
    "ZeroDivisionError": {
        "explanation": "A division or modulo operation was attempted with zero as the divisor.",
        "root_cause": "Dividing a number by zero or using the modulo operator (%) with zero. The denominator variable is 0, possibly from uninitialized data, empty aggregations, or edge case inputs.",
        "fixes": [
            "Add a zero check before dividing: if denominator != 0:",
            "Use a try/except ZeroDivisionError block",
            "Provide a default value when the denominator might be zero",
            "Validate input data to ensure non-zero denominators"
        ],
        "best_practices": [
            "Always validate denominators before division operations",
            "Consider what the 'correct' result should be when the denominator is 0 — is it 0? infinity? an error?",
            "Use math.inf or float('inf') for intentional infinity representations"
        ],
        "learning": "In mathematics, division by zero is undefined. Python raises ZeroDivisionError for integers. For floats, dividing by 0.0 returns inf or -inf (IEEE 754 standard) only if using numpy — standard Python still raises the error."
    },
    "RecursionError": {
        "explanation": "The maximum recursion depth was exceeded.",
        "root_cause": "A recursive function calls itself indefinitely because the base case is never reached, is incorrect, or the input size is too large for the default recursion limit (usually 1000).",
        "fixes": [
            "Verify the base case of your recursive function is correct",
            "Add print statements to trace recursive calls and find infinite loops",
            "Convert the recursive solution to an iterative one using a stack/queue",
            "Increase the limit with sys.setrecursionlimit() (use cautiously)"
        ],
        "best_practices": [
            "Always write the base case FIRST when implementing recursion",
            "Use iterative solutions for problems with deep recursion (>500 levels)",
            "Consider memoization (@functools.lru_cache) to avoid redundant recursive calls"
        ],
        "learning": "Python's default recursion limit is 1000 calls. Each recursive call adds a frame to the call stack. For problems like tree traversal, BFS with a queue is often safer than DFS with recursion."
    },
}


# =============================================================================
# API HTTP STATUS CODE KNOWLEDGE BASE
# =============================================================================

API_ERROR_KB: Dict[str, Dict[str, Any]] = {
    "400": {
        "status": "Bad Request",
        "explanation": "The server cannot process the request due to malformed syntax, invalid request message framing, or deceptive request routing.",
        "causes": [
            "Malformed JSON payload (missing quotes, trailing commas)",
            "Missing required fields in the request body",
            "Invalid data types (sending string where number expected)",
            "Request body exceeds size limits"
        ],
        "fixes": [
            "Validate JSON structure using a JSON validator before sending",
            "Check API documentation for required fields and data types",
            "Log the exact request body being sent for inspection",
            "Ensure Content-Type header matches the body format"
        ]
    },
    "401": {
        "status": "Unauthorized",
        "explanation": "Authentication is required and has failed or has not yet been provided. The request lacks valid authentication credentials.",
        "causes": [
            "Missing or empty Authorization header",
            "Expired access token or API key",
            "Invalid API key or credentials",
            "Token format is incorrect (missing 'Bearer ' prefix)"
        ],
        "fixes": [
            "Verify the API key or token is correct and not expired",
            "Ensure the Authorization header format is correct: 'Bearer <token>'",
            "Refresh the access token if using OAuth2 flow",
            "Check if the API key has been revoked or rotated"
        ]
    },
    "403": {
        "status": "Forbidden",
        "explanation": "The server understood the request but refuses to authorize it. Authentication alone is not sufficient — you lack the necessary permissions.",
        "causes": [
            "Insufficient permissions for the requested resource",
            "IP address is blocked or rate-limited",
            "API key doesn't have the required scope/role",
            "CORS policy blocking the request from your domain"
        ],
        "fixes": [
            "Check your API key's permission scopes",
            "Verify your IP is not blocked by firewall rules",
            "Contact the API provider to request elevated permissions",
            "For CORS issues: add your domain to the server's allowed origins"
        ]
    },
    "404": {
        "status": "Not Found",
        "explanation": "The server cannot find the requested resource. The URL path, endpoint, or resource ID does not exist.",
        "causes": [
            "Typo in the API endpoint URL",
            "Resource has been deleted or moved",
            "Using wrong API version (v1 vs v2)",
            "Missing trailing slash or incorrect path segments"
        ],
        "fixes": [
            "Double-check the endpoint URL against the API documentation",
            "Verify the resource ID exists",
            "Check if the API has been versioned or deprecated",
            "Look for URL encoding issues in path parameters"
        ]
    },
    "405": {
        "status": "Method Not Allowed",
        "explanation": "The HTTP method (GET, POST, PUT, DELETE) used is not supported for the requested endpoint.",
        "causes": [
            "Using GET when the endpoint expects POST (or vice versa)",
            "The endpoint doesn't support the HTTP method you're using",
            "Incorrect routing configuration"
        ],
        "fixes": [
            "Check the API documentation for the correct HTTP method",
            "Verify you're using POST for data submission and GET for retrieval",
            "Check the Allow header in the response for supported methods"
        ]
    },
    "429": {
        "status": "Too Many Requests",
        "explanation": "You have sent too many requests in a given time period. Rate limiting is being enforced.",
        "causes": [
            "Exceeding API rate limits (requests per minute/hour)",
            "Missing rate-limit handling in your code",
            "Burst of requests from a loop without delays",
            "Shared API key being used by multiple services"
        ],
        "fixes": [
            "Implement exponential backoff retry logic",
            "Add delays between sequential API calls: time.sleep(1)",
            "Check the Retry-After header for when to retry",
            "Cache responses to reduce redundant API calls",
            "Upgrade your API plan for higher rate limits"
        ]
    },
    "500": {
        "status": "Internal Server Error",
        "explanation": "The server encountered an unexpected condition that prevented it from fulfilling the request. This is a server-side error, not your fault.",
        "causes": [
            "Bug in the server-side code (unhandled exception)",
            "Server database is down or unreachable",
            "Server ran out of memory or disk space",
            "Deployment or configuration error on the server"
        ],
        "fixes": [
            "Retry the request after a short delay — it may be a transient issue",
            "Check the API's status page for ongoing incidents",
            "Reduce request payload size or complexity",
            "Contact the API provider with the request details and timestamp",
            "If it's your own server: check the server logs for the stack trace"
        ]
    },
    "502": {
        "status": "Bad Gateway",
        "explanation": "The server acting as a gateway received an invalid response from the upstream server.",
        "causes": [
            "Upstream server is down or crashed",
            "Network connectivity issues between servers",
            "Load balancer timeout",
            "Server deployment in progress"
        ],
        "fixes": [
            "Wait and retry — the upstream server may be restarting",
            "Check if the backend service is running",
            "Verify network connectivity between services",
            "Check deployment status on hosting platform"
        ]
    },
    "503": {
        "status": "Service Unavailable",
        "explanation": "The server is temporarily unable to handle the request, usually due to maintenance or overload.",
        "causes": [
            "Server is under maintenance",
            "Server is overloaded with too many concurrent requests",
            "Deployment rollout in progress",
            "Resource exhaustion (CPU, memory, connections)"
        ],
        "fixes": [
            "Implement retry with exponential backoff",
            "Check the service's status page",
            "Try again after a few minutes",
            "If it's your server: scale up resources or add load balancing"
        ]
    },
}


# =============================================================================
# STACK TRACE PARSER
# =============================================================================

def parse_stack_trace(error_text: str) -> Dict[str, Any]:
    """
    Parses error text to extract structured error information.
    Supports Python tracebacks, Node.js errors, and generic error formats.
    """
    result = {
        "error_type": None,
        "file": None,
        "line": None,
        "message": None,
        "frames": [],
        "raw_text": error_text.strip()
    }

    if not error_text or not error_text.strip():
        return result

    text = error_text.strip()

    # --- Python Traceback Parsing ---
    # Match: "ErrorType: message" at the end of a traceback
    py_error_match = re.search(
        r'^(\w+(?:\.\w+)*Error|Exception|Warning):\s*(.+)$',
        text, re.MULTILINE
    )
    if py_error_match:
        result["error_type"] = py_error_match.group(1)
        result["message"] = py_error_match.group(2).strip()

    # Match Python traceback frames: File "filename.py", line N
    py_frame_pattern = re.compile(
        r'File\s+"([^"]+)",\s+line\s+(\d+)(?:,\s+in\s+(\w+))?'
    )
    for match in py_frame_pattern.finditer(text):
        frame = {
            "file": match.group(1),
            "line": int(match.group(2)),
            "function": match.group(3)
        }
        result["frames"].append(frame)
        # Use the LAST frame as the primary file/line (closest to the error)
        result["file"] = frame["file"]
        result["line"] = frame["line"]

    # --- Node.js / JavaScript Error Parsing ---
    if not result["error_type"]:
        # Match: "ReferenceError: x is not defined"
        js_error_match = re.search(
            r'^(ReferenceError|TypeError|SyntaxError|RangeError|Error|'
            r'URIError|EvalError):\s*(.+)$',
            text, re.MULTILINE
        )
        if js_error_match:
            result["error_type"] = js_error_match.group(1)
            result["message"] = js_error_match.group(2).strip()

    # Node.js stack frames: at functionName (file:line:col)
    js_frame_pattern = re.compile(
        r'at\s+(?:(\S+)\s+)?\(?([\w./\\:-]+):(\d+):\d+\)?'
    )
    if not result["frames"]:
        for match in js_frame_pattern.finditer(text):
            frame = {
                "file": match.group(2),
                "line": int(match.group(3)),
                "function": match.group(1)
            }
            result["frames"].append(frame)
            if not result["file"]:
                result["file"] = frame["file"]
                result["line"] = frame["line"]

    # --- NPM Error Parsing ---
    npm_err_match = re.search(r'npm ERR!\s*(.+)', text)
    if npm_err_match and not result["error_type"]:
        result["error_type"] = "NpmError"
        result["message"] = npm_err_match.group(1).strip()

    # --- Module Not Found (Node.js) ---
    module_match = re.search(
        r"(?:Module not found|Cannot find module)[:\s]*['\"]?([^'\"\\n]+)",
        text, re.IGNORECASE
    )
    if module_match and not result["error_type"]:
        result["error_type"] = "ModuleNotFoundError"
        result["message"] = f"Cannot find module '{module_match.group(1).strip()}'"

    # --- HTTP Status Code Extraction ---
    http_match = re.search(
        r'(\d{3})\s+(Bad Request|Unauthorized|Forbidden|Not Found|'
        r'Method Not Allowed|Too Many Requests|Internal Server Error|'
        r'Bad Gateway|Service Unavailable)',
        text, re.IGNORECASE
    )
    if http_match and not result["error_type"]:
        result["error_type"] = f"HTTP {http_match.group(1)}"
        result["message"] = http_match.group(2).strip()

    # Standalone status code
    if not result["error_type"]:
        standalone_http = re.search(r'^(\d{3})\s+(\w[\w\s]+)$', text.strip(), re.MULTILINE)
        if standalone_http:
            result["error_type"] = f"HTTP {standalone_http.group(1)}"
            result["message"] = standalone_http.group(2).strip()

    # Direct HTTP 3-digit status code lookup fallback
    if not result["error_type"]:
        http_direct = re.search(r'(?:HTTP\s+)?\b(\d{3})\b', text, re.IGNORECASE)
        if http_direct and http_direct.group(1) in API_ERROR_KB:
            result["error_type"] = f"HTTP {http_direct.group(1)}"
            result["message"] = f"HTTP {http_direct.group(1)} {API_ERROR_KB[http_direct.group(1)]['status']}"

    # --- Generic fallback: use the first line as the error message ---
    if not result["message"]:
        first_line = text.split('\n')[0].strip()
        result["message"] = first_line
        # Try to extract an error type from the first word
        if ':' in first_line:
            potential_type = first_line.split(':')[0].strip()
            if re.match(r'^[A-Z]\w*(?:Error|Exception|Warning)$', potential_type):
                result["error_type"] = potential_type
                result["message"] = first_line.split(':', 1)[1].strip()

    if not result["error_type"]:
        result["error_type"] = "UnknownError"

    return result


# =============================================================================
# ERROR CLASSIFIER
# =============================================================================

def classify_error(error_text: str, parsed: Optional[Dict] = None) -> List[str]:
    """
    Classifies error text into one or more categories from CATEGORIES.
    Returns a list of matching category names.
    """
    if not error_text:
        return ["Unknown"]

    if parsed is None:
        parsed = parse_stack_trace(error_text)

    categories_found = []
    combined_text = f"{error_text} {parsed.get('error_type', '')} {parsed.get('message', '')}"
    lower_text = combined_text.lower()

    for category, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword.lower() in lower_text:
                if category not in categories_found:
                    categories_found.append(category)
                break

    if not categories_found:
        categories_found.append("Unknown")

    return categories_found


# =============================================================================
# SEVERITY ASSESSOR
# =============================================================================

def assess_severity(parsed: Dict, categories: List[str]) -> str:
    """
    Assigns a severity level based on error type and categories.
    Returns: 'low', 'medium', 'high', or 'critical'
    """
    error_type = (parsed.get("error_type") or "").lower()

    critical_patterns = ["database error", "authentication error", "operationalerror", "integrityerror"]
    high_patterns = ["import error", "dependency error", "file error", "recursionerror", "memoryerror"]
    medium_patterns = ["type error", "value error", "key error", "api error", "runtime error"]
    low_patterns = ["syntax error", "name error", "index error", "validation error"]

    for cat in categories:
        cat_lower = cat.lower()
        if any(p in cat_lower for p in critical_patterns) or any(p in error_type for p in critical_patterns):
            return "critical"

    for cat in categories:
        cat_lower = cat.lower()
        if any(p in cat_lower for p in high_patterns) or any(p in error_type for p in high_patterns):
            return "high"

    for cat in categories:
        cat_lower = cat.lower()
        if any(p in cat_lower for p in medium_patterns) or any(p in error_type for p in medium_patterns):
            return "medium"

    return "low"


# =============================================================================
# NPM / NODE.JS ANALYZER
# =============================================================================

def analyze_npm_error(error_text: str) -> Dict[str, Any]:
    """
    Analyzes npm/Node.js specific errors and returns structured guidance.
    """
    lower = error_text.lower()
    result = {
        "explanation": "",
        "root_cause": "",
        "fixes": [],
        "best_practices": [],
        "learning": ""
    }

    if "module not found" in lower or "cannot find module" in lower:
        # Extract the module name
        mod_match = re.search(r"(?:Module not found|Cannot find module)[:\s]*['\"]?([^'\"\\n]+)", error_text, re.IGNORECASE)
        mod_name = mod_match.group(1).strip() if mod_match else "the specified module"

        result["explanation"] = f"The Node.js module '{mod_name}' could not be resolved. It is either not installed or the import path is incorrect."
        result["root_cause"] = f"The package '{mod_name}' is missing from node_modules, the import path has a typo, or the package.json doesn't list it as a dependency."
        result["fixes"] = [
            f"npm install {mod_name}",
            f"yarn add {mod_name}",
            "Check for typos in the import statement",
            "Delete node_modules and package-lock.json, then run 'npm install' fresh",
            "Verify the package name in the npm registry: https://www.npmjs.com/"
        ]
        result["best_practices"] = [
            "Always commit package.json and package-lock.json to version control",
            "Run 'npm ci' in CI/CD for deterministic installs",
            "Use 'npm ls <package>' to verify a package is installed"
        ]
        result["learning"] = "Node.js resolves modules by checking: 1) core modules, 2) node_modules in the current directory, 3) node_modules in parent directories. If not found anywhere, you get this error."

    elif "npm err" in lower or "eresolve" in lower:
        result["explanation"] = "npm encountered an error during package installation, likely due to dependency resolution conflicts."
        result["root_cause"] = "Two or more packages require incompatible versions of a shared dependency, or the npm cache is corrupted."
        result["fixes"] = [
            "npm install --legacy-peer-deps (bypasses peer dependency conflicts)",
            "npm install --force (forces installation ignoring conflicts)",
            "Delete node_modules and package-lock.json, then 'npm install'",
            "npm cache clean --force (clears corrupted cache)",
            "Check which packages conflict: npm ls <conflicting-package>"
        ]
        result["best_practices"] = [
            "Keep packages updated regularly with 'npm outdated'",
            "Use 'npx npm-check-updates' to find upgradeable packages",
            "Pin exact versions in production deployments"
        ]
        result["learning"] = "npm v7+ enforces strict peer dependency resolution. If Package A needs React 18 but Package B needs React 17, npm can't automatically resolve the conflict. Use --legacy-peer-deps to use the older, more lenient resolution."

    else:
        result["explanation"] = "A Node.js or npm error occurred during package management or module resolution."
        result["root_cause"] = "The error could be caused by missing packages, version conflicts, corrupted cache, or incorrect Node.js version."
        result["fixes"] = [
            "Read the full error message carefully for specific instructions",
            "Delete node_modules and package-lock.json, then 'npm install'",
            "Check your Node.js version matches the project requirements",
            "Try 'npm cache clean --force' to clear corrupted cache"
        ]
        result["best_practices"] = [
            "Use an .nvmrc file to lock the Node.js version for your project",
            "Keep npm updated: 'npm install -g npm@latest'"
        ]
        result["learning"] = "Most npm errors can be resolved by clearing the cache and reinstalling. The nuclear option: delete node_modules, package-lock.json, and run 'npm install' from scratch."

    return result


# =============================================================================
# DEPENDENCY CONFLICT ANALYZER
# =============================================================================

def analyze_dependency_conflict(error_text: str) -> Dict[str, Any]:
    """
    Analyzes dependency version conflict patterns.
    """
    result = {
        "conflicts": [],
        "explanation": "Dependency version conflicts occur when two or more packages require incompatible versions of a shared dependency.",
        "fixes": [],
        "best_practices": []
    }

    # Look for version requirement patterns
    version_patterns = re.findall(
        r'([A-Za-z][\w-]*)\s+(?:requires?|needs?|expects?|peer\s+dep(?:endency)?)\s+'
        r'([A-Za-z][\w-]*)\s*(?:@|>=?|<=?|~|\^)?\s*([\d.]+\S*)',
        error_text, re.IGNORECASE
    )

    if version_patterns:
        for pkg, dep, version in version_patterns:
            result["conflicts"].append({
                "package": pkg,
                "requires": dep,
                "version": version
            })

    result["fixes"] = [
        "Identify the lowest common compatible version between conflicting packages",
        "Use 'npm ls <package>' or 'pip show <package>' to inspect current versions",
        "For npm: try 'npm install --legacy-peer-deps'",
        "For pip: try 'pip install <package>==<specific_version>'",
        "Consider using a lockfile (package-lock.json, Pipfile.lock) for deterministic builds",
        "Update all conflicting packages to their latest versions"
    ]

    result["best_practices"] = [
        "Regularly update dependencies to reduce version drift",
        "Use semantic versioning ranges wisely: ^1.0.0 allows minor updates, ~1.0.0 allows patches only",
        "Test dependency updates in a separate branch before merging"
    ]

    return result


# =============================================================================
# MAIN ANALYSIS ORCHESTRATOR
# =============================================================================

def analyze_error(error_text: str) -> Dict[str, Any]:
    """
    Complete error analysis pipeline.
    Parses, classifies, and generates structured analysis for any error input.
    Returns a comprehensive analysis dictionary.
    """
    if not error_text or not error_text.strip():
        return {
            "error_type": "EmptyInput",
            "file": None,
            "line": None,
            "message": "No error text provided",
            "categories": ["Validation Error"],
            "explanation": "The error input is empty. Please paste a stack trace, error log, or API response.",
            "root_cause": "No content was submitted for analysis.",
            "suggested_fixes": ["Paste a complete error message, stack trace, or log output"],
            "best_practices": ["Always copy the full error output, including the traceback"],
            "learning_notes": "A good error report includes: the full stack trace, what you were trying to do, and what you expected to happen.",
            "severity": "low",
            "frames": []
        }

    # Step 1: Parse the stack trace
    parsed = parse_stack_trace(error_text)

    # Step 2: Classify the error
    categories = classify_error(error_text, parsed)

    # Step 3: Assess severity
    severity = assess_severity(parsed, categories)

    # Step 4: Generate analysis based on error type and categories
    explanation = ""
    root_cause = ""
    suggested_fixes = []
    best_practices = []
    learning_notes = ""

    error_type = parsed.get("error_type", "")

    # Check Python error knowledge base
    if error_type in PYTHON_ERROR_KB:
        kb = PYTHON_ERROR_KB[error_type]
        explanation = kb["explanation"]
        root_cause = kb["root_cause"]
        suggested_fixes = kb["fixes"]
        best_practices = kb["best_practices"]
        learning_notes = kb["learning"]

    # Check API error knowledge base
    elif error_type.startswith("HTTP "):
        status_code = error_type.replace("HTTP ", "")
        if status_code in API_ERROR_KB:
            api_kb = API_ERROR_KB[status_code]
            explanation = api_kb["explanation"]
            root_cause = f"HTTP {status_code} {api_kb['status']}: " + ", ".join(api_kb["causes"][:2])
            suggested_fixes = api_kb["fixes"]
            best_practices = [
                "Always handle HTTP errors gracefully with try/except or .catch()",
                "Log the full response body for debugging — status codes alone aren't enough",
                "Implement retry logic with exponential backoff for transient errors (429, 500, 502, 503)"
            ]
            learning_notes = f"HTTP {status_code} is a {'client' if int(status_code) < 500 else 'server'}-side error. {'You need to fix your request.' if int(status_code) < 500 else 'The problem is on the server — try again later.'}"

    # Check NPM/Node.js patterns
    elif "Dependency Error" in categories or "NpmError" in error_type:
        npm_analysis = analyze_npm_error(error_text)
        explanation = npm_analysis["explanation"]
        root_cause = npm_analysis["root_cause"]
        suggested_fixes = npm_analysis["fixes"]
        best_practices = npm_analysis["best_practices"]
        learning_notes = npm_analysis["learning"]

    # Dependency conflict specific
    if "Dependency Error" in categories and not explanation:
        dep_analysis = analyze_dependency_conflict(error_text)
        explanation = dep_analysis["explanation"]
        root_cause = f"Version conflicts detected: {len(dep_analysis['conflicts'])} conflict(s)"
        suggested_fixes = dep_analysis["fixes"]
        best_practices = dep_analysis["best_practices"]
        learning_notes = "Dependency conflicts are one of the most common deployment issues. Using lockfiles and pinned versions prevents 'works on my machine' problems."

    # Generic fallback
    if not explanation:
        explanation = f"An error of type '{error_type}' was detected: {parsed.get('message', 'No message available')}."
        root_cause = f"The error '{error_type}' occurred" + (f" in file '{parsed.get('file')}' at line {parsed.get('line')}" if parsed.get("file") else "") + "."
        suggested_fixes = [
            "Read the error message carefully — it usually tells you exactly what went wrong",
            "Search the error message on Stack Overflow for community solutions",
            "Check the official documentation for the library or framework involved",
            "Add print/log statements around the error location to inspect variable states"
        ]
        best_practices = [
            "Always read the FULL stack trace from bottom to top",
            "Use a debugger (pdb, breakpoint(), or IDE debugger) to step through code",
            "Write unit tests to catch errors before they reach production"
        ]
        learning_notes = "Debugging is a skill that improves with practice. The key steps are: 1) Read the error message, 2) Find the file and line number, 3) Understand what the code was trying to do, 4) Fix the root cause, not just the symptom."

    return {
        "error_type": error_type,
        "file": parsed.get("file"),
        "line": parsed.get("line"),
        "message": parsed.get("message", ""),
        "categories": categories,
        "explanation": explanation,
        "root_cause": root_cause,
        "suggested_fixes": suggested_fixes,
        "best_practices": best_practices,
        "learning_notes": learning_notes,
        "severity": severity,
        "frames": parsed.get("frames", [])
    }
