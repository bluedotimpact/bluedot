"""Exercise cancellation with local synthetic subprocesses; never call paid AI."""

import os
import signal
import sys
import tempfile
import threading
import time
import unittest
from concurrent.futures import CancelledError
from pathlib import Path
from unittest.mock import patch

from talent_sourcing.model import ask_claude

SCHEMA = {"type": "object", "properties": {"ok": {"type": "boolean"}}, "required": ["ok"]}


class ModelTests(unittest.TestCase):
    def test_completed_response_and_large_prompt_survive_polling(self):
        with tempfile.TemporaryDirectory() as temporary:
            binary = Path(temporary) / "fake-claude"
            binary.write_text(
                f"#!{sys.executable}\n"
                "import json, sys, time\n"
                "time.sleep(0.3)\n"
                "prompt = sys.stdin.read()\n"
                "print(json.dumps({'structured_output': {'ok': len(prompt) == 200000}}))\n"
            )
            binary.chmod(0o700)
            with patch("talent_sourcing.model.shutil.which", return_value=str(binary)):
                self.assertEqual(ask_claude("x" * 200000, SCHEMA), {"ok": True})

    def test_cancel_terminates_active_process_including_term_resistant_process(self):
        for ignore_term in (False, True):
            with self.subTest(ignore_term=ignore_term), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                marker = root / "started"
                binary = root / "fake-claude"
                binary.write_text(
                    f"#!{sys.executable}\n"
                    "import os, pathlib, signal, sys, time\n"
                    + ("signal.signal(signal.SIGTERM, signal.SIG_IGN)\n" if ignore_term else "")
                    + "sys.stdin.read()\n"
                    + f"pathlib.Path({str(marker)!r}).write_text(str(os.getpid()))\n"
                    + "time.sleep(30)\n"
                )
                binary.chmod(0o700)
                cancelled = threading.Event()
                failures = []

                def run():
                    try:
                        ask_claude("synthetic prompt", SCHEMA, cancel_event=cancelled)
                    except Exception as error:
                        failures.append(error)

                with patch("talent_sourcing.model.shutil.which", return_value=str(binary)):
                    worker = threading.Thread(target=run)
                    worker.start()
                    try:
                        deadline = time.monotonic() + 3
                        while not marker.exists() and time.monotonic() < deadline:
                            time.sleep(0.01)
                        self.assertTrue(marker.exists())
                        started = time.monotonic()
                        cancelled.set()
                        worker.join(4)
                        self.assertFalse(worker.is_alive())
                        self.assertLess(time.monotonic() - started, 4)
                        self.assertEqual(len(failures), 1)
                        self.assertIsInstance(failures[0], CancelledError)
                        with self.assertRaises(ProcessLookupError):
                            os.kill(int(marker.read_text()), 0)
                    finally:
                        cancelled.set()
                        worker.join(5)
                        if worker.is_alive() and marker.exists():
                            os.killpg(int(marker.read_text()), signal.SIGKILL)
                            worker.join(2)

    def test_assessment_effort_is_scoped_and_metrics_exclude_content(self):
        import json

        with tempfile.TemporaryDirectory() as temporary:
            binary = Path(temporary) / "fake-claude"
            binary.write_text(
                f"#!{sys.executable}\n"
                "import json, os, sys\n"
                "assert sys.argv[sys.argv.index('--effort')+1] == 'medium'\n"
                "assert os.environ['CLAUDE_CODE_EFFORT_LEVEL'] == 'medium'\n"
                "assert sys.argv[sys.argv.index('--model')+1] == 'claude-opus-5'\n"
                "assert json.loads(sys.argv[sys.argv.index('--settings')+1]) == {'fastMode': True}\n"
                "sys.stdin.read()\n"
                "print(json.dumps({'structured_output': {'ok': True}, 'duration_api_ms': 1250,"
                "'result': 'Do not persist this private answer', 'usage': {'input_tokens': 10,"
                "'cache_read_input_tokens': 20, 'output_tokens': 5, 'speed': 'fast', 'output_tokens_details': {'thinking_tokens': 2}},"
                "'modelUsage': {'synthetic-model': {}}}))\n"
            )
            binary.chmod(0o700)
            metrics = []
            with patch.dict(os.environ, {"CLAUDE_CODE_EFFORT_LEVEL": "xhigh"}):
                with patch("talent_sourcing.model.shutil.which", return_value=str(binary)):
                    result = ask_claude(
                        "Private synthetic prompt",
                        SCHEMA,
                        effort="medium",
                        model="claude-opus-5",
                        fast_mode=True,
                        on_metrics=metrics.append,
                    )
                self.assertEqual(os.environ["CLAUDE_CODE_EFFORT_LEVEL"], "xhigh")
            self.assertEqual(result, {"ok": True})
            self.assertEqual(metrics[0]["input_tokens"], 30)
            self.assertEqual(metrics[0]["api_seconds"], 1.25)
            self.assertEqual(metrics[0]["thinking_tokens"], 2)
            self.assertEqual(metrics[0]["models"], ["synthetic-model"])
            self.assertEqual(metrics[0]["requested_model"], "claude-opus-5")
            self.assertTrue(metrics[0]["fast_mode_requested"])
            self.assertEqual(metrics[0]["speed"], "fast")
            self.assertNotIn("private", json.dumps(metrics).lower())

    def test_cancel_before_launch_does_not_start_a_process(self):
        cancelled = threading.Event()
        cancelled.set()
        with patch("talent_sourcing.model.shutil.which", return_value=sys.executable):
            with patch("talent_sourcing.model.subprocess.Popen") as process:
                with self.assertRaises(CancelledError):
                    ask_claude("synthetic prompt", SCHEMA, cancel_event=cancelled)
                process.assert_not_called()
