"""Reference canonical JSON/hash implementation for the Labbe receiver.

This file is intentionally dependency-free so it can be copied into the
Python Labbe service or used as a contract probe.  It implements the same
profile as StudentHub's CanonicalJson.js: UTF-16 object-key ordering, compact
JSON, UTF-8 hashing, and ECMAScript-compatible number spelling for JSON-safe
IEEE-754 values.
"""

from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any


MAX_SAFE_INTEGER = 9_007_199_254_740_991


def _utf16_key(value: str) -> bytes:
    return value.encode("utf-16-be", "surrogatepass")


def _assert_scalar_string(value: str) -> None:
    for character in value:
        code = ord(character)
        if 0xD800 <= code <= 0xDFFF:
            raise TypeError("CANONICAL_JSON_LONE_SURROGATE")


def _number(value: int | float) -> str:
    if isinstance(value, bool):
        raise TypeError("CANONICAL_JSON_BOOLEAN_IS_NOT_NUMBER")

    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            raise ValueError("CANONICAL_JSON_INTEGER_OUT_OF_SAFE_RANGE")
        return str(value)

    if not math.isfinite(value):
        raise ValueError("CANONICAL_JSON_NON_FINITE_NUMBER")
    if value == 0:
        return "0"

    text = repr(value).lower()
    sign = ""
    if text.startswith("-"):
        sign, text = "-", text[1:]

    if "e" in text:
        coefficient, exponent_text = text.split("e", 1)
        exponent = int(exponent_text)
    else:
        coefficient, exponent = text, 0

    if "." in coefficient:
        integer_part, fractional_part = coefficient.split(".", 1)
    else:
        integer_part, fractional_part = coefficient, ""
    digits = integer_part + fractional_part
    decimal_position = len(integer_part) + exponent

    # Remove coefficient padding while retaining the decimal position.
    while len(digits) > 1 and digits.startswith("0"):
        digits = digits[1:]
        decimal_position -= 1
    while len(digits) > 1 and len(digits) > decimal_position and digits.endswith("0"):
        digits = digits[:-1]

    # ECMAScript uses decimal notation for [1e-6, 1e21).
    if -6 < decimal_position <= 21:
        if decimal_position <= 0:
            body = "0." + ("0" * (-decimal_position)) + digits
        elif decimal_position >= len(digits):
            body = digits + ("0" * (decimal_position - len(digits)))
        else:
            body = digits[:decimal_position] + "." + digits[decimal_position:]
        return sign + body

    exponent = decimal_position - 1
    mantissa = digits[0] + (("." + digits[1:]) if len(digits) > 1 else "")
    return sign + mantissa + "e" + ("+" if exponent >= 0 else "") + str(exponent)


def canonical_json(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return _number(value)
    if isinstance(value, str):
        _assert_scalar_string(value)
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    if isinstance(value, list):
        return "[" + ",".join(canonical_json(item) for item in value) + "]"
    if isinstance(value, dict):
        for key in value:
            if not isinstance(key, str):
                raise TypeError("CANONICAL_JSON_OBJECT_KEY_REQUIRED")
            _assert_scalar_string(key)
        entries = []
        for key in sorted(value, key=_utf16_key):
            entries.append(
                json.dumps(key, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
                + ":"
                + canonical_json(value[key])
            )
        return "{" + ",".join(entries) + "}"
    raise TypeError("CANONICAL_JSON_UNSUPPORTED_VALUE")


def hash_canonical_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def verify_vectors(path: Path) -> int:
    vectors = json.loads(path.read_text(encoding="utf-8"))
    for vector in vectors:
        actual = canonical_json(vector["value"])
        digest = hashlib.sha256(actual.encode("utf-8")).hexdigest()
        if actual != vector["canonical"] or digest != vector["sha256"]:
            raise AssertionError(f"vector mismatch: {vector.get('name')}")
    return len(vectors)


if __name__ == "__main__":
    vector_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parents[2] / "docs" / "integrations" / "labbe-canonical-json-vectors.json"
    count = verify_vectors(vector_path)
    print(json.dumps({"status": "PASS", "vectors": count}, separators=(",", ":")))
