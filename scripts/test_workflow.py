#!/usr/bin/env python3
"""Offline regression. Synthetic media + mocked CLI; never calls a paid service."""
import argparse
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import replica as r
import xyq_adapter as x


class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='replica-test-')
        cls.root = Path(cls.temp.name)
        cls.media = cls.root / 'source.mp4'
        r.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x568:rate=30',
               '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '2',
               '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', str(cls.media)])

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def setUp(self):
        self.work = Path(tempfile.mkdtemp(dir=self.root))

    def plan(self):
        return {'schema_version': 1, 'asset_root': str(self.root), 'product_id': 'private-pid',
                'capabilities': {'duration_min': 4, 'duration_max': 30, 'duration_step': 1},
                'strategies': [{'id': 'A', 'audio_policy': 'generated', 'jobs': [
                    {'id': 'p1', 'duration': 4, 'prompt': '展示商品', 'videos': ['source.mp4']}]}]}

    def request(self, **updates):
        data = {'asset_root': str(self.root), 'product_id': 'private-pid', 'prompt': '展示商品',
                'mode': 'reference_generation', 'model': 'Seedance_2.5', 'duration': 4,
                'ratio': '9:16', 'resolution': '720p', 'videos': ['source.mp4']}
        data.update(updates)
        path = self.work / 'request.json'
        r.save(path, data)
        return path

    def mock_submit(self):
        return patch.object(x, 'invoke', return_value=(0, {'thread_id': 't', 'run_id': 'r', 'web_thread_link': 'https://example.test/t'}))

    def test_duration_boundaries(self):
        self.assertEqual(r.ceil_duration(17.26667, 4, 30, 1), 18)
        self.assertEqual(r.ceil_duration(25.4, 4, 30, 1), 26)
        self.assertEqual(r.ceil_duration(2, 4, 30, 1), 4)
        self.assertEqual(r.ceil_duration(30, 4, 30, 1), 30)
        with self.assertRaises(ValueError):
            r.ceil_duration(30.01, 4, 30, 1)

    def test_strategy_count(self):
        plan = self.plan()
        self.assertTrue(r.validate_plan(plan, self.work)['valid'])
        for count in (0, 4):
            p = copy.deepcopy(plan)
            p['strategies'] = [dict(plan['strategies'][0], id=str(i)) for i in range(count)]
            with self.assertRaises(ValueError):
                r.validate_plan(p, self.work)

    def test_pid_leak_and_missing_assets(self):
        for change in ({'prompt': '展示 private-pid'}, {'images': ['missing.jpg']}, {'duration': 4.2}):
            p = self.plan()
            p['strategies'][0]['jobs'][0].update(change)
            with self.assertRaises(ValueError):
                r.validate_plan(p, self.work)

    def test_dependencies(self):
        p = self.plan()
        p['strategies'][0]['jobs'][0]['depends_on'] = ['not-ready']
        with self.assertRaises(ValueError):
            r.validate_plan(p, self.work)

    def test_unknown_mode_not_guessed(self):
        with self.assertRaises(ValueError):
            x.request_argv('mock', self.request(mode='video_edit'))

    def test_first_last_rejects_video(self):
        with self.assertRaises(ValueError):
            x.request_argv('mock', self.request(mode='first_last_frame'))

    def test_first_last_order(self):
        for name in ('first.png', 'last.png'):
            (self.root / name).write_bytes(b'fixture')
        cmd, _ = x.request_argv('mock', self.request(mode='first_last_frame', videos=[], images=['first.png', 'last.png']))
        self.assertLess(cmd.index(str((self.root / 'first.png').resolve())), cmd.index(str((self.root / 'last.png').resolve())))

    def test_no_shell_prompt_interpolation(self):
        prompt = '商品 `touch unexpected` $(echo secret) 引号"'
        cmd, _ = x.request_argv('mock', self.request(prompt=prompt))
        self.assertEqual(cmd[cmd.index('--prompt') + 1], prompt)

    def test_submit_once_and_download(self):
        request = self.request()
        job = self.work / 'job'
        with self.mock_submit() as mock:
            state = x.submit('mock', request, job)
            self.assertEqual(state['status'], 'submitted')
            with self.assertRaises(FileExistsError):
                x.submit('mock', request, job)
            self.assertEqual(mock.call_count, 1)
        downloads = job / 'downloads'
        downloads.mkdir()
        dest = downloads / 'result.mp4'
        dest.write_bytes(self.media.read_bytes())
        with patch.object(x, 'invoke', return_value=(0, {'completed': True, 'error_message': '', 'videos': [{'output_path': str(dest)}]})):
            self.assertEqual(x.query('mock', job)['status'], 'downloaded')
        self.assertTrue(r.validate_media(dest)['technical_pass'])

    def test_unknown_submission_blocks(self):
        job = self.work / 'job'
        request = self.request()
        with patch.object(x, 'invoke', return_value=(1, {'error_message': 'timeout'})):
            self.assertEqual(x.submit('mock', request, job)['status'], 'submission_unknown')
            with self.assertRaises(FileExistsError):
                x.submit('mock', request, job)
        with self.assertRaises(ValueError):
            x.query('mock', job)

    def test_completed_error_and_missing_output_not_success(self):
        job = self.work / 'job'
        with self.mock_submit():
            x.submit('mock', self.request(), job)
        for response in ({'completed': True, 'error_message': 'download failed'},
                         {'completed': True, 'videos': []},
                         {'completed': True, 'videos': [{'output_path': str(self.media)}]}):
            with patch.object(x, 'invoke', return_value=(0, response)):
                state = x.query('mock', job)
                self.assertEqual(state['status'], 'query_error')
                self.assertEqual(state['run_id'], 'r')

    def test_frame_sampling_and_budget(self):
        args = argparse.Namespace(input=str(self.media), out_dir=str(self.work / 'frames'), fps=2, start=0,
                                  end=None, width=180, max_frames=20)
        manifest = r.frames(args)
        self.assertEqual(len(manifest['frames']), 4)
        self.assertEqual(manifest['frames'][-1]['nominal_time'], 1.5)
        args.max_frames = 1
        with self.assertRaises(ValueError):
            r.frames(args)

    def test_cfr_assemble_exact_and_audio(self):
        spec = self.work / 'parts.json'
        r.save(spec, {'fps': 30, 'audio_policy': 'source', 'source_audio': str(self.media),
                      'parts': [{'file': str(self.media), 'frames': 24}, {'file': str(self.media), 'frames': 36}]})
        output = self.work / 'final.mp4'
        result = r.assemble(spec, output)
        self.assertEqual(result['frames'], 60)
        self.assertTrue(any(s['codec_type'] == 'audio' for s in result['probe']['streams']))
        a = r.run(['ffmpeg', '-v', 'error', '-i', self.media, '-map', '0:a:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-'])
        b = r.run(['ffmpeg', '-v', 'error', '-i', output, '-map', '0:a:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-'])
        self.assertEqual(a, b)

    def test_assemble_short_source_fails(self):
        spec = self.work / 'parts.json'
        r.save(spec, {'fps': 30, 'audio_policy': 'none', 'parts': [{'file': str(self.media), 'frames': 90}]})
        with self.assertRaises(ValueError):
            r.assemble(spec, self.work / 'final.mp4')
        self.assertFalse((self.work / 'final.mp4').exists())

    def test_segment_audio_concatenated_without_video_pts_gaps(self):
        spec = self.work / 'parts.json'
        r.save(spec, {'fps': 30, 'audio_policy': 'segments',
                      'parts': [{'file': str(self.media), 'frames': 17}, {'file': str(self.media), 'frames': 43}]})
        result = r.assemble(spec, self.work / 'final.mp4')
        self.assertEqual(result['frames'], 60)
        self.assertAlmostEqual(float(r.video(result['probe'])['duration']), 2, places=4)
        self.assertTrue(any(s['codec_type'] == 'audio' for s in result['probe']['streams']))

    def test_cut_and_verify(self):
        out = self.work / 'cut.mp4'
        result = r.cut(argparse.Namespace(input=str(self.media), output=str(out), start=0.5, end=1.5, mute=True))
        self.assertEqual(result['frames'], 30)
        self.assertFalse(any(s['codec_type'] == 'audio' for s in result['probe']['streams']))

    def test_manifest_preserves_reviews_and_idempotency(self):
        final = self.work / 'final.mp4'
        final.write_bytes(self.media.read_bytes())
        r.save(self.work / 'experiment.json', {'output': {'file': 'final.mp4'}})
        r.save(self.work / 'replica-experiments.json', [{'id': 'old', 'metadata': 'old.json', 'videoNumber': 1}])
        review = self.work / 'reviews.json'
        review.write_text('{"user":"keep"}')
        before = review.read_bytes()
        entry = {'id': 'new', 'metadata': 'experiment.json', 'videoNumber': 2}
        r.publish_import(self.work, entry)
        self.assertTrue(r.publish_import(self.work, entry)['unchanged'])
        self.assertEqual(len(r.read(self.work / 'replica-experiments.json')), 2)
        self.assertEqual(review.read_bytes(), before)
        with self.assertRaises(ValueError):
            r.publish_import(self.work, dict(entry, videoNumber=3))

    def test_redaction(self):
        data = x.scrub({'access_token': 'private', 'url': 'https://example.test/x?X-Signature=secret'})
        self.assertEqual(data['access_token'], '[REDACTED]')
        self.assertNotIn('secret', data['url'])
        self.assertEqual(x.redact_text('https://example.test/?thread_id=abc'), 'https://example.test/?thread_id=abc')


if __name__ == '__main__':
    unittest.main(verbosity=2)
