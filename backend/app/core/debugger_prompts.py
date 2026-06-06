"""
AI-Engineer-OS Debugger Prompt Engine
======================================
Centralized prompt architecture for the AI Debugging Mentor.
Provides structured, multi-section prompts that make the AI behave
like a senior software engineer, teach like a mentor, and explain
like a professor.
"""

import re
from typing import Dict, Any, List, Optional


# =============================================================================
# CORE SYSTEM PERSONA
# =============================================================================

DEBUGGER_SYSTEM_PROMPT = """ROLE & IDENTITY:
You are an elite AI Debugging Mentor embedded inside the AI-Engineer-OS platform.
You combine the precision of a senior staff software engineer, the patience of a university professor,
and the structured thinking of a root-cause analysis expert.

YOUR EXPERTISE:
- 15+ years of production debugging across Python, JavaScript/TypeScript, Node.js, and web frameworks
- Deep knowledge of runtime internals, memory models, type systems, and async patterns
- Expert in database systems (PostgreSQL, SQLite, SQLAlchemy), API design, and dependency management
- Specialist in teaching complex concepts using simple analogies and progressive disclosure

COMMUNICATION PHILOSOPHY:
1. BEGINNER-FIRST: Always explain as if the developer has 6 months of experience. Avoid unnecessary jargon.
   When you must use a technical term, define it in parentheses immediately.
2. ROOT CAUSE OVER SYMPTOMS: Never just describe what happened — explain WHY it happened and the chain of events.
3. ACTIONABLE FIXES: Every suggestion must be immediately executable — provide exact commands, exact code, exact file changes.
4. TEACH ONE THING: For every error, teach one fundamental concept that prevents this class of bugs forever.
5. ENCOURAGE: Frame errors as learning opportunities. Use phrases like "This is a common trap" not "You made a mistake."

OUTPUT FORMAT — You MUST use EXACTLY these markdown section headers in this order:

## Root Cause Chain
[Number each step in the failure chain from original trigger to visible error]
1. [First event that started the chain]
2. [What that caused]
3. [The visible error/symptom the developer sees]

## Beginner Explanation
[Explain the error in 2-3 sentences using a real-world analogy. No code jargon. Imagine explaining to someone who just started coding last month.]

## Recommended Fix
[The single best fix. Include the exact command or code change. Mark it clearly.]

## All Fixes
- [Fix 1 with exact command or code]
- [Fix 2 with exact command or code]
- [Fix 3 if applicable]

## Code Suggestions
[If the error involves code, show a BEFORE and AFTER comparison. If no code is involved, write "No code context available."]
BEFORE:
```
[the problematic code pattern]
```
AFTER:
```
[the improved, safer code]
```
WHY: [1-sentence explanation of why the new version is better]

## Best Practices
- [Practice 1 — a concrete, actionable habit]
- [Practice 2]

## Concept Deep-Dive
[Teach the fundamental CS/programming concept behind this error. 3-5 sentences. Include how it works under the hood.]

## Common Mistakes
- [Mistake 1 that leads to this error type]
- [Mistake 2]
- [Mistake 3]

## Prevention Techniques
- [Technique 1 to never see this error again]
- [Technique 2]

CRITICAL RULES:
- Do NOT skip any section. Every section must have content.
- Do NOT use placeholder text like "N/A" or "None". If a section is not applicable, explain why briefly.
- Keep code examples short and focused (under 10 lines each).
- Use backtick code formatting for any inline code references.
"""


# =============================================================================
# DYNAMIC PROMPT BUILDERS
# =============================================================================

def build_analysis_prompt(
    error_text: str,
    error_type: str,
    categories: list,
    severity: str,
    file_name: Optional[str] = None,
    line_number: Optional[int] = None,
    frames: Optional[list] = None
) -> str:
    """
    Builds the user-facing prompt for error analysis, enriched with
    local parsing context to help the AI produce more accurate results.
    """
    context_parts = [
        f"ERROR TYPE DETECTED: {error_type}",
        f"CATEGORIES: {', '.join(categories)}",
        f"SEVERITY: {severity}",
    ]

    if file_name:
        context_parts.append(f"FILE: {file_name}")
    if line_number:
        context_parts.append(f"LINE: {line_number}")

    if frames and len(frames) > 0:
        frame_lines = []
        for i, frame in enumerate(frames):
            fn = frame.get("function", "unknown")
            frame_lines.append(f"  Frame {i+1}: {frame.get('file', '?')} line {frame.get('line', '?')} in {fn}")
        context_parts.append("CALL STACK:\n" + "\n".join(frame_lines))

    context_block = "\n".join(context_parts)

    return (
        f"LOCAL ANALYSIS CONTEXT (from rule-based parser):\n"
        f"{context_block}\n\n"
        f"---\n\n"
        f"Analyze this error thoroughly using all section headers:\n\n"
        f"{error_text}"
    )


def build_code_review_prompt(code_snippet: str, language: str = "python") -> str:
    """
    Builds a prompt for standalone code review / improvement suggestions.
    """
    return (
        f"Review the following {language} code and provide improvement suggestions.\n\n"
        f"For each suggestion, show:\n"
        f"1. The problematic pattern (BEFORE)\n"
        f"2. The improved version (AFTER)\n"
        f"3. WHY the improvement matters (1 sentence)\n\n"
        f"Focus on:\n"
        f"- Safety (preventing crashes, handling edge cases)\n"
        f"- Clarity (readability, naming, structure)\n"
        f"- Best practices (idiomatic patterns for {language})\n"
        f"- Performance (only if there's a clear improvement)\n\n"
        f"Format each suggestion as:\n"
        f"### Suggestion N: [Brief title]\n"
        f"BEFORE:\n```{language}\n[code]\n```\n"
        f"AFTER:\n```{language}\n[code]\n```\n"
        f"WHY: [explanation]\n\n"
        f"---\n\n"
        f"```{language}\n{code_snippet}\n```"
    )


CODE_REVIEW_SYSTEM_PROMPT = """You are a senior code reviewer inside AI-Engineer-OS.
Your job is to find bugs, anti-patterns, and improvement opportunities in code snippets.

RULES:
1. Be constructive, not critical. Frame every suggestion as an improvement, not a mistake.
2. Prioritize: safety > clarity > performance.
3. Show exact BEFORE/AFTER code comparisons.
4. Keep explanations to 1-2 sentences each.
5. If the code is already good, say so and suggest only minor style improvements.
6. Provide at least 2 and at most 6 suggestions.
"""


# =============================================================================
# AI RESPONSE PARSER (Enhanced)
# =============================================================================

def parse_enhanced_ai_response(response_text: str) -> Dict[str, Any]:
    """
    Parses the structured AI response into individual components matching
    the enhanced analysis schema.

    Returns a dict with all mentor fields populated.
    """
    sections = {
        "root_cause_chain": [],
        "beginner_explanation": "",
        "recommended_fix": "",
        "suggested_fixes": [],
        "code_suggestions": [],
        "best_practices": [],
        "learning_concept": "",
        "common_mistakes": [],
        "prevention_tips": [],
        "root_cause": "",
        "explanation": "",
        "learning_notes": "",
    }

    if not response_text or not response_text.strip():
        return sections

    current_section = None
    current_code_block = None  # Track if we're inside a code block
    code_block_content = []
    code_suggestion_state = {"before": "", "after": "", "why": ""}
    lines = response_text.split("\n")

    for line in lines:
        line_stripped = line.strip()
        lower_line = line_stripped.lower()

        # Track code blocks to avoid parsing their content as sections
        if line_stripped.startswith("```"):
            if current_code_block is None:
                current_code_block = True
                code_block_content = [line]
                continue
            else:
                code_block_content.append(line)
                current_code_block = None
                # If we're in code_suggestions section, capture the block
                if current_section == "code_suggestions":
                    block_text = "\n".join(code_block_content)
                    # Determine if this is BEFORE or AFTER
                    if not code_suggestion_state["before"]:
                        code_suggestion_state["before"] = block_text
                    elif not code_suggestion_state["after"]:
                        code_suggestion_state["after"] = block_text
                code_block_content = []
                continue

        if current_code_block:
            code_block_content.append(line)
            continue

        # Section header detection
        if "## root cause chain" in lower_line:
            current_section = "root_cause_chain"
            continue
        elif "## beginner explanation" in lower_line:
            current_section = "beginner_explanation"
            continue
        elif "## recommended fix" in lower_line:
            current_section = "recommended_fix"
            continue
        elif "## all fixes" in lower_line or "## fixes" in lower_line:
            current_section = "all_fixes"
            continue
        elif "## code suggestion" in lower_line:
            current_section = "code_suggestions"
            code_suggestion_state = {"before": "", "after": "", "why": ""}
            continue
        elif "## best practice" in lower_line:
            current_section = "best_practices"
            continue
        elif "## concept deep" in lower_line or "## learning note" in lower_line:
            current_section = "concept_deepdive"
            continue
        elif "## common mistake" in lower_line:
            current_section = "common_mistakes"
            continue
        elif "## prevention" in lower_line:
            current_section = "prevention"
            continue
        elif lower_line.startswith("## "):
            # Unknown section — keep tracking but don't map
            current_section = None
            continue

        if not line_stripped:
            continue

        # Content accumulation per section
        if current_section == "root_cause_chain":
            # Parse numbered steps
            step_match = re.match(r'^\d+[\.\)]\s*(.*)', line_stripped)
            if step_match:
                sections["root_cause_chain"].append(step_match.group(1).strip())
            elif line_stripped.startswith(("-", "*")):
                clean = re.sub(r'^[-\*]\s*', '', line_stripped).strip()
                if clean:
                    sections["root_cause_chain"].append(clean)
            else:
                sections["root_cause_chain"].append(line_stripped)
            # Also build flat root_cause string
            sections["root_cause"] += line + "\n"

        elif current_section == "beginner_explanation":
            sections["beginner_explanation"] += line + "\n"
            sections["explanation"] += line + "\n"

        elif current_section == "recommended_fix":
            sections["recommended_fix"] += line + "\n"

        elif current_section == "all_fixes":
            if line_stripped.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
                clean_fix = re.sub(r'^[-\*\d\.\s]+', '', line_stripped).strip()
                if clean_fix:
                    sections["suggested_fixes"].append(clean_fix)
            else:
                if sections["suggested_fixes"]:
                    sections["suggested_fixes"][-1] += "\n" + line_stripped
                else:
                    sections["suggested_fixes"].append(line_stripped)

        elif current_section == "code_suggestions":
            # Capture WHY line
            if lower_line.startswith("why:"):
                code_suggestion_state["why"] = line_stripped[4:].strip()
                # Finalize this code suggestion
                if code_suggestion_state["before"] or code_suggestion_state["after"]:
                    sections["code_suggestions"].append({
                        "before": code_suggestion_state["before"],
                        "after": code_suggestion_state["after"],
                        "reason": code_suggestion_state["why"]
                    })
                    code_suggestion_state = {"before": "", "after": "", "why": ""}
            elif lower_line.startswith("before:") or lower_line.startswith("after:"):
                pass  # Labels, skip — the code blocks are captured above

        elif current_section == "best_practices":
            if line_stripped.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")):
                clean = re.sub(r'^[-\*\d\.\s]+', '', line_stripped).strip()
                if clean:
                    sections["best_practices"].append(clean)
            else:
                if sections["best_practices"]:
                    sections["best_practices"][-1] += " " + line_stripped

        elif current_section == "concept_deepdive":
            sections["learning_concept"] += line + "\n"
            sections["learning_notes"] += line + "\n"

        elif current_section == "common_mistakes":
            if line_stripped.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")):
                clean = re.sub(r'^[-\*\d\.\s]+', '', line_stripped).strip()
                if clean:
                    sections["common_mistakes"].append(clean)
            else:
                if sections["common_mistakes"]:
                    sections["common_mistakes"][-1] += " " + line_stripped

        elif current_section == "prevention":
            if line_stripped.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")):
                clean = re.sub(r'^[-\*\d\.\s]+', '', line_stripped).strip()
                if clean:
                    sections["prevention_tips"].append(clean)
            else:
                if sections["prevention_tips"]:
                    sections["prevention_tips"][-1] += " " + line_stripped

    # Finalize any pending code suggestion
    if code_suggestion_state["before"] or code_suggestion_state["after"]:
        sections["code_suggestions"].append({
            "before": code_suggestion_state["before"],
            "after": code_suggestion_state["after"],
            "reason": code_suggestion_state["why"]
        })

    # Clean whitespace
    sections["beginner_explanation"] = sections["beginner_explanation"].strip()
    sections["recommended_fix"] = sections["recommended_fix"].strip()
    sections["root_cause"] = sections["root_cause"].strip()
    sections["explanation"] = sections["explanation"].strip()
    sections["learning_concept"] = sections["learning_concept"].strip()
    sections["learning_notes"] = sections["learning_notes"].strip()

    # Clean list items
    sections["suggested_fixes"] = [x.strip() for x in sections["suggested_fixes"] if x.strip()]
    sections["best_practices"] = [x.strip() for x in sections["best_practices"] if x.strip()]
    sections["common_mistakes"] = [x.strip() for x in sections["common_mistakes"] if x.strip()]
    sections["prevention_tips"] = [x.strip() for x in sections["prevention_tips"] if x.strip()]

    return sections


def parse_code_review_response(response_text: str) -> List[Dict[str, str]]:
    """
    Parses the code review AI response into a list of suggestion objects.
    Each object has: title, before, after, reason.
    """
    suggestions = []
    if not response_text:
        return suggestions

    # Split by suggestion headers
    suggestion_blocks = re.split(r'###\s+Suggestion\s+\d+[:\s]*', response_text, flags=re.IGNORECASE)

    for block in suggestion_blocks:
        block = block.strip()
        if not block:
            continue

        suggestion = {"title": "", "before": "", "after": "", "reason": ""}

        # Extract title from first line
        first_line = block.split("\n")[0].strip()
        suggestion["title"] = first_line.rstrip(":")

        # Extract code blocks
        code_blocks = re.findall(r'```[\w]*\n(.*?)```', block, re.DOTALL)
        if len(code_blocks) >= 2:
            suggestion["before"] = code_blocks[0].strip()
            suggestion["after"] = code_blocks[1].strip()
        elif len(code_blocks) == 1:
            suggestion["after"] = code_blocks[0].strip()

        # Extract WHY
        why_match = re.search(r'WHY:\s*(.+?)(?:\n\n|\n###|\Z)', block, re.DOTALL | re.IGNORECASE)
        if why_match:
            suggestion["reason"] = why_match.group(1).strip()

        if suggestion["title"] or suggestion["before"] or suggestion["after"]:
            suggestions.append(suggestion)

    return suggestions
