"""ICAO 9303 TD3 (passport) Machine-Readable Zone parsing and checksum
validation. Gives the frontend an independent confidence signal on
AI-transcribed passport data — the AI can misread a character, but the
MRZ's built-in check digits catch most of those mistakes on their own,
regardless of how the AI parsed the "clean" fields.
"""

_WEIGHTS = (7, 3, 1)


def _char_value(char: str) -> int:
    if char == "<":
        return 0
    if char.isdigit():
        return int(char)
    if char.isalpha():
        return ord(char.upper()) - ord("A") + 10
    raise ValueError(f"Invalid MRZ character: {char!r}")


def compute_check_digit(data: str) -> int:
    """Mod-10 weighted 7-3-1 checksum over an MRZ data field."""
    total = 0
    for i, char in enumerate(data):
        total += _char_value(char) * _WEIGHTS[i % 3]
    return total % 10


def _check_digit_valid(data: str, digit_char: str) -> bool:
    if digit_char == "<":
        # ICAO allows the filler character in place of a digit when the
        # field it covers is entirely blank (e.g. an unused personal
        # number field) — that's a valid, common case, not a failure.
        return all(c == "<" for c in data)
    if not digit_char.isdigit():
        return False
    return compute_check_digit(data) == int(digit_char)


def validate_td3_mrz(line1: str, line2: str) -> dict:
    """Validate the four ICAO check digits on a TD3 (passport) MRZ.

    Returns individual pass/fail flags for the passport number, date of
    birth, date of expiry, and composite checksums, plus an overall
    `valid` flag. Malformed input (wrong length) fails closed.
    """
    result = {
        "passport_number_valid": False,
        "dob_valid": False,
        "expiry_valid": False,
        "composite_valid": False,
        "valid": False,
    }
    if len(line1) != 44 or len(line2) != 44:
        return result

    passport_number = line2[0:9]
    passport_number_check = line2[9]
    dob = line2[13:19]
    dob_check = line2[19]
    expiry = line2[21:27]
    expiry_check = line2[27]
    optional_data = line2[28:42]
    optional_check = line2[42]
    composite_check = line2[43]

    try:
        result["passport_number_valid"] = _check_digit_valid(passport_number, passport_number_check)
        result["dob_valid"] = _check_digit_valid(dob, dob_check)
        result["expiry_valid"] = _check_digit_valid(expiry, expiry_check)

        composite_data = (
            passport_number
            + passport_number_check
            + dob
            + dob_check
            + expiry
            + expiry_check
            + optional_data
            + optional_check
        )
        result["composite_valid"] = _check_digit_valid(composite_data, composite_check)
    except ValueError:
        return result

    result["valid"] = all(
        [
            result["passport_number_valid"],
            result["dob_valid"],
            result["expiry_valid"],
            result["composite_valid"],
        ]
    )
    return result
