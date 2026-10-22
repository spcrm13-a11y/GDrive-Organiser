"""Offline tests for MoneypenneyAgent.

No network, no real Drive. A stub service records every call so we can assert
the things that actually matter: that a dry run mutates nothing, that the
ledger is written BEFORE a move, and that a revert restores the original
parents exactly.
"""
import json
import os
import sys
import tempfile
import unittest

import requests
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import agent_daemon as ad


class FakeExec:
    def __init__(self, result):
        self._r = result

    def execute(self):
        return self._r


class FakeFiles:
    def __init__(self, list_responses=None):
        self.list_queue = list(list_responses or [])
        self.list_calls, self.create_calls, self.update_calls = [], [], []

    def list(self, **kw):
        self.list_calls.append(kw)
        r = self.list_queue.pop(0) if self.list_queue else {"files": []}
        return FakeExec(r)

    def create(self, **kw):
        self.create_calls.append(kw)
        return FakeExec({"id": "newfolder-%d" % len(self.create_calls)})

    def update(self, **kw):
        self.update_calls.append(kw)
        return FakeExec({"id": kw.get("fileId")})


class FakeService:
    def __init__(self, files):
        self._files = files

    def files(self):
        return self._files


class FolderScopingTests(unittest.TestCase):
    def test_lookup_is_scoped_to_root_and_never_creates_in_dry_run(self):
        f = FakeFiles()
        folders, missing, dupes = ad.resolve_category_folders(
            FakeService(f), create=False)

        self.assertEqual(f.create_calls, [], "dry run must not create folders")
        self.assertEqual(sorted(missing), sorted(ad.CATEGORIES))
        self.assertEqual(folders, {})
        for call in f.list_calls:
            self.assertIn("'root' in parents", call["q"],
                          "folder lookup must be root-scoped")
            self.assertIn("trashed = false", call["q"])

    def test_duplicate_root_folders_are_reported_not_guessed(self):
        dupe = {"files": [{"id": "bbb", "name": "Personal"},
                          {"id": "aaa", "name": "Personal"}]}
        f = FakeFiles([dupe] + [{"files": []}] * (len(ad.CATEGORIES) - 1))
        folders, missing, dupes = ad.resolve_category_folders(
            FakeService(f), create=False)
        self.assertIn("Personal", dupes)
        self.assertEqual(sorted(dupes["Personal"]), ["aaa", "bbb"])
        self.assertEqual(folders["Personal"], "aaa", "must pick deterministically")

    def test_apply_creates_missing_folders(self):
        f = FakeFiles()
        folders, missing, _ = ad.resolve_category_folders(
            FakeService(f), create=True)
        self.assertEqual(len(f.create_calls), len(ad.CATEGORIES))
        self.assertEqual(missing, [])

    def test_category_name_with_apostrophe_is_escaped(self):
        f = FakeFiles()
        with mock.patch.object(ad, "CATEGORIES", ["Oliver's Stuff"]):
            ad.resolve_category_folders(FakeService(f), create=False)
        self.assertIn("\\'", f.list_calls[0]["q"])


class CandidateFilterTests(unittest.TestCase):
    def test_already_processed_files_are_skipped_client_side(self):
        page = {"files": [
            {"id": "1", "name": "new.pdf", "parents": ["p"]},
            {"id": "2", "name": "done.pdf", "parents": ["p"],
             "appProperties": {"processed_by": ad.AGENT_TAG}},
            {"id": "3", "name": "other.pdf", "parents": ["p"],
             "appProperties": {"processed_by": "SomeoneElse"}},
        ]}
        f = FakeFiles([page])
        out, scanned = ad.list_candidates(FakeService(f), 425, 25)
        self.assertEqual([x["id"] for x in out], ["1", "3"])
        self.assertEqual(scanned, 3)

    def test_default_query_omits_the_undocumented_has_negation(self):
        f = FakeFiles([{"files": []}])
        ad.list_candidates(FakeService(f), 425, 5, server_filter=False)
        self.assertNotIn("appProperties has", f.list_calls[0]["q"])

    def test_server_filter_opt_in_adds_it(self):
        f = FakeFiles([{"files": []}])
        ad.list_candidates(FakeService(f), 425, 5, server_filter=True)
        self.assertIn("not appProperties has", f.list_calls[0]["q"])

    def test_limit_is_honoured(self):
        page = {"files": [{"id": str(i), "name": "f%d" % i, "parents": ["p"]}
                          for i in range(100)]}
        f = FakeFiles([page])
        out, _ = ad.list_candidates(FakeService(f), 425, 7)
        self.assertEqual(len(out), 7)


class ClassificationTests(unittest.TestCase):
    def test_unknown_category_falls_back_to_others(self):
        f = FakeFiles([{"files": [{"id": "1", "name": "x.pdf", "parents": ["p"]}]}]
                      + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=5, server_filter=False, apply=False,
                         snippet_chars=0)
        with mock.patch.object(ad, "classify",
                               return_value=({"category": "Nonsense",
                                              "confidence": 0.9}, False)):
            rows = ad.classify_batch(FakeService(f), "k", args)
        self.assertEqual(rows[0]["target_category"], "Others")

    def test_api_failure_is_flagged_not_disguised(self):
        f = FakeFiles([{"files": [{"id": "1", "name": "x.pdf", "parents": ["p"]}]}]
                      + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=5, server_filter=False, apply=False,
                         snippet_chars=0)
        with mock.patch.object(ad, "classify",
                               return_value=({"category": "Others",
                                              "confidence": 0.0,
                                              "reason": "API_FAILURE: boom"}, True)):
            rows = ad.classify_batch(FakeService(f), "k", args)
        self.assertTrue(rows[0]["api_failed"])
        self.assertIn("API_FAILURE", rows[0]["reason"])


class LedgerAndRevertTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.p = mock.patch.object(ad, "BASE", self.tmp)
        self.p.start()

    def tearDown(self):
        self.p.stop()

    def _row(self):
        return {"file_id": "f1", "name": "tax.pdf",
                "original_parents": ["oldA", "oldB"],
                "target_category": "Personal", "target_folder_id": "catPersonal",
                "confidence": 0.9, "reason": "a tax document", "api_failed": False}

    def test_ledger_records_original_parents_before_the_move(self):
        f = FakeFiles()
        ad.apply_batch(FakeService(f), [self._row()])

        ledgers = os.listdir(os.path.join(self.tmp, "ledger"))
        self.assertEqual(len(ledgers), 1)
        with open(os.path.join(self.tmp, "ledger", ledgers[0])) as fh:
            entry = json.loads(fh.readline())
        self.assertEqual(entry["original_parents"], ["oldA", "oldB"])
        self.assertEqual(entry["new_parent"], "catPersonal")

        call = f.update_calls[0]
        self.assertEqual(call["addParents"], "catPersonal")
        self.assertEqual(call["removeParents"], "oldA,oldB")
        props = call["body"]["appProperties"]
        self.assertEqual(props["processed_by"], ad.AGENT_TAG)
        self.assertEqual(props["prior_parents"], "oldA,oldB")

    def test_revert_restores_exactly_what_was_recorded(self):
        f = FakeFiles()
        ad.apply_batch(FakeService(f), [self._row()])
        ledger = os.path.join(self.tmp, "ledger",
                              os.listdir(os.path.join(self.tmp, "ledger"))[0])

        f2 = FakeFiles()
        n = ad.revert_batch(FakeService(f2), ledger)
        self.assertEqual(n, 1)
        call = f2.update_calls[0]
        self.assertEqual(call["fileId"], "f1")
        self.assertEqual(call["addParents"], "oldA,oldB")
        self.assertEqual(call["removeParents"], "catPersonal")
        self.assertIsNone(call["body"]["appProperties"]["processed_by"])

    def test_row_without_target_folder_is_skipped_not_orphaned(self):
        row = self._row()
        row["target_folder_id"] = None
        f = FakeFiles()
        moved = ad.apply_batch(FakeService(f), [row])
        self.assertEqual(moved, 0)
        self.assertEqual(f.update_calls, [])


class DryRunIsInertTests(unittest.TestCase):
    """The property the whole design rests on."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.p = mock.patch.object(ad, "BASE", self.tmp)
        self.p.start()

    def tearDown(self):
        self.p.stop()

    def test_dry_run_performs_no_mutation_and_writes_a_report(self):
        files = {"files": [{"id": "1", "name": "invoice.pdf", "parents": ["p"]},
                           {"id": "2", "name": "deck.pptx", "parents": ["p"]}]}
        f = FakeFiles([files] + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=25, server_filter=False, apply=False,
                         snippet_chars=0)

        with mock.patch.object(ad, "classify",
                               return_value=({"category": "Personal",
                                              "confidence": 0.95,
                                              "reason": "invoice"}, False)):
            rows = ad.classify_batch(FakeService(f), "key", args)
            ad.write_report(rows, args)

        self.assertEqual(f.create_calls, [], "dry run created something")
        self.assertEqual(f.update_calls, [], "dry run modified something")
        reports = os.listdir(os.path.join(self.tmp, "reports"))
        self.assertTrue(any(r.endswith(".md") for r in reports))
        self.assertTrue(any(r.endswith(".json") for r in reports))


class BackoffTests(unittest.TestCase):
    def test_retries_on_429_then_succeeds(self):
        from googleapiclient.errors import HttpError
        calls = {"n": 0}

        def flaky():
            calls["n"] += 1
            if calls["n"] < 3:
                raise HttpError(mock.Mock(status=429), b"rate limited")
            return "ok"

        with mock.patch.object(ad.time, "sleep"):
            self.assertEqual(ad.with_backoff(flaky, "test"), "ok")
        self.assertEqual(calls["n"], 3)

    def test_does_not_retry_a_404(self):
        from googleapiclient.errors import HttpError
        calls = {"n": 0}

        def gone():
            calls["n"] += 1
            raise HttpError(mock.Mock(status=404), b"not found")

        with mock.patch.object(ad.time, "sleep"):
            with self.assertRaises(HttpError):
                ad.with_backoff(gone, "test")
        self.assertEqual(calls["n"], 1, "404 is not retryable")


if __name__ == "__main__":
    unittest.main(verbosity=2)


class BackendTests(unittest.TestCase):
    def test_default_backend_is_local(self):
        self.assertEqual(ad.CLASSIFIER_BACKEND, "ollama",
                         "default must keep personal documents on the tailnet")

    def test_dispatch_routes_to_ollama(self):
        with mock.patch.object(ad, "CLASSIFIER_BACKEND", "ollama"), \
             mock.patch.object(ad, "call_ollama",
                               return_value=({"category": "Personal"}, False)) as o, \
             mock.patch.object(ad, "call_gemini") as g:
            ad.classify("key", "tax.pdf", "")
        o.assert_called_once()
        g.assert_not_called()

    def test_dispatch_routes_to_gemini(self):
        with mock.patch.object(ad, "CLASSIFIER_BACKEND", "gemini"), \
             mock.patch.object(ad, "call_gemini",
                               return_value=({"category": "Personal"}, False)) as g, \
             mock.patch.object(ad, "call_ollama") as o:
            ad.classify("key", "tax.pdf", "")
        g.assert_called_once()
        o.assert_not_called()

    def test_unknown_backend_exits(self):
        with mock.patch.object(ad, "CLASSIFIER_BACKEND", "nonsense"):
            with self.assertRaises(SystemExit):
                ad.classify("key", "x.pdf", "")

    def test_ollama_failure_is_flagged_not_disguised(self):
        with mock.patch.object(ad, "_post_with_backoff",
                               side_effect=requests.RequestException("down")):
            verdict, failed = ad.call_ollama("x.pdf")
        self.assertTrue(failed)
        self.assertEqual(verdict["category"], "Others")
        self.assertIn("BACKEND_FAILURE", verdict["reason"])

    def test_ollama_has_no_daily_quota_path(self):
        """Ollama is local: a quota stop must never come from this backend."""
        with mock.patch.object(ad, "_post_with_backoff",
                               side_effect=requests.RequestException("x")):
            ad.call_ollama("x.pdf")   # returns, does not raise QuotaExhausted


class QuotaTests(unittest.TestCase):
    """A per-day cap must stop the run, not be retried into the ground."""

    def _resp(self, quota_id, value, delay):
        r = mock.Mock(status_code=429)
        r.json.return_value = {"error": {"details": [
            {"@type": "type.googleapis.com/google.rpc.QuotaFailure",
             "violations": [{"quotaId": quota_id, "quotaValue": value}]},
            {"@type": "type.googleapis.com/google.rpc.RetryInfo",
             "retryDelay": delay},
        ]}}
        return r

    def test_per_day_quota_is_fatal(self):
        r = self._resp("GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                       "20", "33092s")
        fatal = ad._classify_429(r)
        self.assertIsInstance(fatal, ad.QuotaExhausted)
        self.assertEqual(fatal.value, "20")
        self.assertEqual(fatal.retry_after_s, 33092)

    def test_short_per_minute_limit_stays_retryable(self):
        r = self._resp("GenerateRequestsPerMinutePerProject", "15", "8s")
        self.assertIsNone(ad._classify_429(r))

    def test_long_delay_is_fatal_even_without_a_perday_id(self):
        r = self._resp("SomeOtherQuota", "5", "600s")
        self.assertIsInstance(ad._classify_429(r), ad.QuotaExhausted)

    def test_backoff_never_retries_an_exhausted_quota(self):
        calls = {"n": 0}

        def boom():
            calls["n"] += 1
            raise ad.QuotaExhausted("PerDay", "20", 33092)

        with mock.patch.object(ad.time, "sleep"):
            with self.assertRaises(ad.QuotaExhausted):
                ad._post_with_backoff(boom)
        self.assertEqual(calls["n"], 1, "quota exhaustion must not be retried")

    def test_batch_stops_at_quota_and_keeps_earlier_rows(self):
        page = {"files": [{"id": str(i), "name": f"f{i}.pdf", "parents": ["p"]}
                          for i in range(5)]}
        f = FakeFiles([page] + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=5, server_filter=False, apply=False,
                         snippet_chars=0)

        seq = [({"category": "Personal", "confidence": 0.9, "reason": "x"}, False),
               ({"category": "Strategy", "confidence": 0.8, "reason": "y"}, False)]

        def fake_gemini(*a, **k):
            if seq:
                return seq.pop(0)
            raise ad.QuotaExhausted("PerDay", "20", 33092)

        with mock.patch.object(ad, "classify", side_effect=fake_gemini):
            rows = ad.classify_batch(FakeService(f), "key", args)

        self.assertEqual(len(rows), 2, "rows classified before the quota hit are kept")
        self.assertEqual(f.update_calls, [], "still a dry run")


class NoNetworkInTestsTests(unittest.TestCase):
    """classify_batch must be patched at classify(), not at a backend.

    Patching call_gemini alone used to let batch tests fall through to the
    real local model -- 49 seconds of live inference masquerading as a unit
    test.
    """

    def test_batch_never_calls_a_backend_directly(self):
        page = {"files": [{"id": "1", "name": "x.pdf", "parents": ["p"]}]}
        f = FakeFiles([page] + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=1, server_filter=False, apply=False,
                         snippet_chars=0)
        with mock.patch.object(ad, "classify",
                               return_value=({"category": "Others",
                                              "confidence": 0.1}, False)), \
             mock.patch.object(ad, "call_ollama") as o, \
             mock.patch.object(ad, "call_gemini") as g:
            ad.classify_batch(FakeService(f), "key", args)
        o.assert_not_called()
        g.assert_not_called()


class SnippetTests(unittest.TestCase):
    """97% of Drive files carry no description, so exported text is the only
    real signal the classifier gets."""

    def _svc(self, export_result=None, boom=None):
        f = FakeFiles()
        exp = mock.Mock()
        if boom:
            exp.execute.side_effect = boom
        else:
            exp.execute.return_value = export_result
        f.export = mock.Mock(return_value=exp)
        return FakeService(f), f

    def test_google_doc_is_exported_as_text(self):
        svc, files = self._svc(b"  Hello\n\n  world  ")
        out = ad.fetch_snippet(svc, {
            "id": "1", "name": "d", "description": "ignored",
            "mimeType": "application/vnd.google-apps.document"}, 4000)
        self.assertEqual(out, "Hello world", "whitespace must be collapsed")
        files.export.assert_called_once()
        self.assertEqual(files.export.call_args.kwargs["mimeType"], "text/plain")

    def test_spreadsheet_exports_as_csv(self):
        svc, files = self._svc(b"a,b\n1,2")
        ad.fetch_snippet(svc, {"id": "1", "name": "s", "mimeType":
                               "application/vnd.google-apps.spreadsheet"}, 4000)
        self.assertEqual(files.export.call_args.kwargs["mimeType"], "text/csv")

    def test_pdf_falls_back_to_description_without_exporting(self):
        svc, files = self._svc(b"never used")
        out = ad.fetch_snippet(svc, {"id": "1", "name": "p", "mimeType":
                                     "application/pdf",
                                     "description": "a desc"}, 4000)
        self.assertEqual(out, "a desc")
        files.export.assert_not_called()

    def test_export_failure_degrades_to_description(self):
        svc, _ = self._svc(boom=RuntimeError("too large"))
        out = ad.fetch_snippet(svc, {"id": "1", "name": "d", "description": "fb",
                                     "mimeType":
                                     "application/vnd.google-apps.document"}, 4000)
        self.assertEqual(out, "fb", "a failed export must not abort the run")

    def test_truncated_to_the_requested_length(self):
        svc, _ = self._svc(b"x" * 10000)
        out = ad.fetch_snippet(svc, {"id": "1", "name": "d", "mimeType":
                                     "application/vnd.google-apps.document"}, 500)
        self.assertEqual(len(out), 500)

    def test_zero_disables_export_entirely(self):
        svc, files = self._svc(b"nope")
        out = ad.fetch_snippet(svc, {"id": "1", "name": "d", "description": "d1",
                                     "mimeType":
                                     "application/vnd.google-apps.document"}, 0)
        self.assertEqual(out, "d1")
        files.export.assert_not_called()


class TitleOnlyTests(unittest.TestCase):
    """A verdict reached without readable text is a guess and must say so."""

    def _batch(self, snippet):
        page = {"files": [{"id": "1", "name": "x", "parents": ["p"],
                           "mimeType": "application/vnd.google-apps.site"}]}
        f = FakeFiles([page] + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=1, server_filter=False, apply=False,
                         snippet_chars=4000)
        with mock.patch.object(ad, "fetch_snippet", return_value=snippet), \
             mock.patch.object(ad, "classify",
                               return_value=({"category": "Personal",
                                              "confidence": 0.95,
                                              "reason": "r"}, False)):
            return ad.classify_batch(FakeService(f), "k", args)

    def test_empty_snippet_is_flagged_title_only(self):
        self.assertTrue(self._batch("")[0]["title_only"])

    def test_real_text_is_not_flagged(self):
        self.assertFalse(self._batch("x" * 500)[0]["title_only"])

    def test_apps_script_is_exportable(self):
        self.assertIn("application/vnd.google-apps.script", ad.EXPORTABLE)

    def test_sites_are_not_exportable(self):
        self.assertNotIn("application/vnd.google-apps.site", ad.EXPORTABLE)

    def test_report_marks_weak_verdicts(self):
        import tempfile
        tmp = tempfile.mkdtemp()
        with mock.patch.object(ad, "BASE", tmp):
            ad.write_report([{
                "file_id": "1", "name": "guessed", "target_category": "Personal",
                "confidence": 0.95, "reason": "r", "api_failed": False,
                "title_only": True, "original_parents": [], "target_folder_id": "f",
            }], mock.Mock())
            md = [x for x in os.listdir(os.path.join(tmp, "reports"))
                  if x.endswith(".md")][0]
            body = open(os.path.join(tmp, "reports", md)).read()
        self.assertIn("title only", body)


class CoercionTests(unittest.TestCase):
    """Model output is untrusted. A single bad field once killed a whole run."""

    def test_the_string_that_crashed_a_live_run(self):
        self.assertEqual(ad.coerce_confidence("High"), 0.9)

    def test_word_scale_is_case_insensitive(self):
        for word, want in [("HIGH", 0.9), ("medium", 0.6), ("Low", 0.3),
                           ("very high", 0.95), ("unknown", 0.0)]:
            self.assertEqual(ad.coerce_confidence(word), want, word)

    def test_unit_interval_passes_through(self):
        self.assertAlmostEqual(ad.coerce_confidence(0.85), 0.85)

    def test_percent_scale_is_normalised(self):
        self.assertAlmostEqual(ad.coerce_confidence(95), 0.95)
        self.assertAlmostEqual(ad.coerce_confidence("95%"), 0.95)
        self.assertAlmostEqual(ad.coerce_confidence("0.85"), 0.85)

    def test_garbage_and_none_become_zero(self):
        for bad in [None, "", "banana", {}, [], True, False]:
            self.assertEqual(ad.coerce_confidence(bad), 0.0, repr(bad))

    def test_clamped_to_unit_interval(self):
        self.assertEqual(ad.coerce_confidence(500), 1.0)
        self.assertEqual(ad.coerce_confidence(-3), 0.0)

    def test_category_matching_is_case_insensitive(self):
        self.assertEqual(ad.coerce_category("personal"), "Personal")
        self.assertEqual(ad.coerce_category("  AI Code Development "),
                         "AI Code Development")

    def test_unknown_or_non_string_category_is_others(self):
        for bad in ["Nonsense", None, 42, {}]:
            self.assertEqual(ad.coerce_category(bad), "Others", repr(bad))

    def test_batch_survives_a_string_confidence(self):
        page = {"files": [{"id": "1", "name": "x", "parents": ["p"]}]}
        f = FakeFiles([page] + [{"files": []}] * len(ad.CATEGORIES))
        args = mock.Mock(days=425, limit=1, server_filter=False, apply=False,
                         snippet_chars=0)
        with mock.patch.object(ad, "classify",
                               return_value=({"category": "Personal",
                                              "confidence": "High",
                                              "reason": "r"}, False)):
            rows = ad.classify_batch(FakeService(f), "k", args)
        self.assertEqual(rows[0]["confidence"], 0.9)


class ReviewGateTests(unittest.TestCase):
    """Personal, title-only and failed verdicts must never move on their own."""

    def _row(self, **kw):
        base = {"file_id": "1", "name": "f", "original_parents": ["p"],
                "target_category": "Strategy", "target_folder_id": "cat",
                "confidence": 0.9, "reason": "r", "api_failed": False,
                "title_only": False}
        base.update(kw)
        return base

    def test_personal_is_held(self):
        auto, held = ad.partition_for_review([self._row(target_category="Personal")])
        self.assertEqual(auto, [])
        self.assertIn("Personal", held[0]["hold_reason"])

    def test_title_only_is_held_even_for_a_safe_category(self):
        auto, held = ad.partition_for_review([self._row(title_only=True)])
        self.assertEqual(auto, [])
        self.assertIn("filename guess", held[0]["hold_reason"])

    def test_backend_failure_is_held(self):
        auto, held = ad.partition_for_review([self._row(api_failed=True)])
        self.assertEqual(auto, [])

    def test_a_clean_verdict_passes_through(self):
        auto, held = ad.partition_for_review([self._row()])
        self.assertEqual(len(auto), 1)
        self.assertEqual(held, [])

    def test_apply_moves_only_the_unheld_rows(self):
        tmp = tempfile.mkdtemp()
        rows = [self._row(file_id="ok", name="safe"),
                self._row(file_id="p", name="tax", target_category="Personal"),
                self._row(file_id="t", name="guess", title_only=True)]
        auto, held = ad.partition_for_review(rows)
        f = FakeFiles()
        with mock.patch.object(ad, "BASE", tmp):
            ad.apply_batch(FakeService(f), auto)
        moved = [c["fileId"] for c in f.update_calls]
        self.assertEqual(moved, ["ok"])
        self.assertEqual(len(held), 2)

    def test_review_list_names_every_held_file(self):
        tmp = tempfile.mkdtemp()
        _, held = ad.partition_for_review(
            [self._row(name="tax.pdf", target_category="Personal")])
        with mock.patch.object(ad, "BASE", tmp):
            path = ad.write_review_list(held, tag="t")
        body = open(path).read()
        self.assertIn("tax.pdf", body)
        self.assertIn("Personal", body)

    def test_review_list_survives_a_string_confidence(self):
        tmp = tempfile.mkdtemp()
        _, held = ad.partition_for_review(
            [self._row(target_category="Personal", confidence="High")])
        with mock.patch.object(ad, "BASE", tmp):
            ad.write_review_list(held, tag="t2")   # must not raise
