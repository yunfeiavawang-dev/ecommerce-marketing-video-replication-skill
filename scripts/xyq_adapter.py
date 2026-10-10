#!/usr/bin/env python3
"""Single-operation XYQ adapter; conservative submission guard, no automatic resubmit."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from replica import read, save, digest


def now():
    return datetime.now(timezone.utc).isoformat()


def redact_text(text):
    # Presigned URL query strings and common secret assignments are not portable provenance.
    def url(match):
        u = urlsplit(match.group(0))
        sensitive = ('signature', 'credential', 'token', 'secret', 'authorization', 'security', 'expires', 'policy')
        params = [(k, v) for k, v in parse_qsl(u.query, keep_blank_values=True)
                  if not any(s in k.lower() for s in sensitive)]
        return urlunsplit((u.scheme, u.netloc, u.path, urlencode(params), u.fragment))
    text = re.sub(r'https?://[^\s"<>]+', url, text)
    return re.sub(r'(?i)(authorization|access_token|refresh_token|api_key|secret)(["\s:=]+)[^\s,}"]+', r'\1\2[REDACTED]', text)


def scrub(value):
    if isinstance(value, dict):
        return {k: '[REDACTED]' if k.lower() in ('authorization', 'access_token', 'refresh_token', 'api_key', 'secret') else scrub(v)
                for k, v in value.items()}
    if isinstance(value, list):
        return [scrub(v) for v in value]
    return redact_text(value) if isinstance(value, str) else value


def invoke(argv, log_prefix):
    result = subprocess.run(argv, capture_output=True, text=True)
    save(str(log_prefix) + '.argv.json', scrub(argv))
    Path(str(log_prefix) + '.stdout.txt').write_text(redact_text(result.stdout), encoding='utf-8')
    Path(str(log_prefix) + '.stderr.txt').write_text(redact_text(result.stderr), encoding='utf-8')
    try:
        data = json.loads(result.stdout)
    except ValueError:
        data = {'error_message': 'Non-JSON response; inspect redacted logs'}
    return result.returncode, data


def request_argv(cli, request_path):
    path = Path(request_path).resolve()
    r = read(path)
    root = (path.parent / r['asset_root']).resolve()
    if not r['prompt'].strip() or (r.get('product_id') and str(r['product_id']) in r['prompt']):
        raise ValueError('empty prompt or product PID in prompt')
    modes = {'reference_generation': 0, 'first_last_frame': 1}
    if r['mode'] not in modes:
        raise ValueError('mode not implemented by this adapter; inspect current CLI before extending')
    if not isinstance(r['duration'], int) or isinstance(r['duration'], bool) or r['duration'] <= 0:
        raise ValueError('this adapter requires positive integer duration; preflight actual model limits')
    if r['mode'] == 'first_last_frame' and (len(r.get('images', [])) != 2 or r.get('videos') or r.get('audios')):
        raise ValueError('implemented first_last_frame requires exactly two ordered images, no video/audio')
    cmd = [cli, 'generate-video', '--prompt', r['prompt'], '--model', r['model'], '--duration', str(r['duration']),
           '--ratio', r['ratio'], '--resolution', r['resolution'], '--generate-type', str(modes[r['mode']])]
    if r.get('source'):
        cmd += ['--source', r['source']]
    assets = []
    for key, flag in [('images', '--image'), ('videos', '--video'), ('audios', '--audio')]:
        for name in r.get(key, []):
            asset = (root / name).resolve()
            if not asset.is_file():
                raise ValueError('missing asset: ' + name)
            assets.append({'path': os.path.relpath(asset, path.parent), 'sha256': digest(asset), 'role': key})
            cmd += [flag, str(asset)]
    return cmd, assets


def submit(cli, request_path, job_dir):
    cmd, assets = request_argv(cli, request_path)
    job = Path(job_dir).resolve()
    job.mkdir(parents=True, exist_ok=True)
    state_path = job / 'state.json'
    state = {'schema_version': 1, 'status': 'submitting', 'created_at': now(),
             'request_sha256': digest(request_path), 'request_file': os.path.relpath(Path(request_path).resolve(), job),
             'assets_relative_to': 'request_file parent', 'assets': assets}
    # O_EXCL persists intent before network and excludes concurrent local submissions.
    fd = os.open(state_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    try:
        code, response = invoke(cmd, job / 'submit')
        save(job / 'submit.json', scrub(response))
        if response.get('thread_id') and response.get('run_id'):
            state.update({k: response[k] for k in ('thread_id', 'run_id', 'web_thread_link') if k in response})
            state['status'] = 'submitted'
        else:
            state['status'] = 'submission_unknown'
        state['returncode'] = code
        state['response'] = scrub(response)
    except BaseException:
        state['status'] = 'submission_unknown'
        save(state_path, scrub(state))
        raise
    state['updated_at'] = now()
    save(state_path, scrub(state))
    return scrub(state)


def query(cli, job_dir):
    job = Path(job_dir).resolve()
    state = read(job / 'state.json')
    if not state.get('thread_id') or not state.get('run_id'):
        raise ValueError('no known IDs; reconcile submission, do not resubmit')
    downloads = job / 'downloads'
    downloads.mkdir(exist_ok=True)
    n = len(list(job.glob('query-*.json'))) + 1
    prefix = job / ('query-%04d' % n)
    code, response = invoke([cli, 'query-result', '--thread-id', state['thread_id'], '--run-id', state['run_id'],
                             '--download-dir', str(downloads)], prefix)
    save(str(prefix) + '.json', scrub(response))
    paths = []
    if code or response.get('error_message'):
        state['status'] = 'query_error'  # Not enough information to assert provider terminal failure.
    elif response.get('completed'):
        for item in response.get('videos', []):
            path = Path(item.get('output_path') or '').resolve()
            if not path.is_relative_to(downloads) or not path.is_file() or not path.stat().st_size:
                state['status'] = 'query_error'
                break
            paths.append({'file': os.path.relpath(path, job), 'sha256': digest(path), 'size': path.stat().st_size})
        else:
            state['status'] = 'downloaded' if paths else 'query_error'
    else:
        state['status'] = 'running'
    state.update({'updated_at': now(), 'last_query': scrub(response), 'outputs': paths})
    save(job / 'state.json', scrub(state))
    return scrub(state)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--cli', default=shutil.which('pippit-tool-cli') or 'pippit-tool-cli')
    sub = p.add_subparsers(dest='operation', required=True)
    q = sub.add_parser('capabilities')
    q.add_argument('--model', required=True)
    q.add_argument('--out', required=True)
    q.add_argument('--refresh', action='store_true')
    q = sub.add_parser('submit')
    q.add_argument('--request', required=True)
    q.add_argument('--job-dir', required=True)
    q = sub.add_parser('query')
    q.add_argument('--job-dir', required=True)
    a = p.parse_args()
    if a.operation == 'capabilities':
        out = Path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        cmd = [a.cli, 'model', 'describe', a.model] + (['--refresh'] if a.refresh else [])
        code, result = invoke(cmd, out.with_suffix('.capabilities'))
        if code or result.get('error_message'):
            raise RuntimeError('capability discovery failed; inspect logs')
        result = {'adapter': 'xyq-cli', 'fetched_at': now(), 'raw': scrub(result)}
        save(out, result)
    elif a.operation == 'submit':
        result = submit(a.cli, a.request, a.job_dir)
    else:
        result = query(a.cli, a.job_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
