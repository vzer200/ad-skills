#!/usr/bin/env python3
"""Run all AD project tests."""
import sys
import os
import unittest
import warnings

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # Add all skill directories so tests can import their modules
    for skill in ("ad-ops", "ad-perception", "ad-check-analysis", "ad-blackbox-analysis"):
        _p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", skill, "scripts")
        sys.path.insert(0, os.path.realpath(_p))
    # Surface import errors during discover
    warnings.simplefilter('always', ImportWarning)
    loader = unittest.defaultTestLoader
    suite = loader.discover(".", pattern="test_*.py")
    if loader.errors:
        for e in loader.errors:
            print(f"Load error: {e}", file=sys.stderr)
        sys.exit(1)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
