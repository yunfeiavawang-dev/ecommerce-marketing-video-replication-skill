#!/usr/bin/env python3
"""Portable deterministic media helpers. No inference or paid generation."""
import argparse
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import tempfile


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=str(path.parent), prefix='.' + path.name)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
            f.write('\n')
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def run(argv):
    result = subprocess.run([str(x) for x in argv], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-4000:] or 'command failed')
    return result.stdout


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def probe(path, count=False):
    args = ['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json']
    if count:
        args += ['-count_frames']
    return json.loads(run(args + [str(Path(path).resolve())]))


def video(data):
    return next(s for s in data['streams'] if s['codec_type'] == 'video')


def validate_media(path, expected_frames=None):
    path = Path(path)
    if not path.is_file() or not path.stat().st_size:
        raise ValueError('missing/empty output')
    data = probe(path, count=True)
    v = video(data)
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'])
    frames = int(v.get('nb_read_frames', v.get('nb_frames', '0')))
    if expected_frames is not None and frames != expected_frames:
        raise ValueError('frame count mismatch: %s != %s' % (frames, expected_frames))
    return {'technical_pass': True, 'file': path.name, 'sha256': digest(path),
            'size': path.stat().st_size, 'frames': frames, 'probe': data,
            'semantic_review': 'pending'}


def ceil_duration(value, minimum, maximum, step):
    if value <= 0 or step <= 0 or minimum <= 0 or maximum < minimum:
        raise ValueError('invalid duration limits')
    n = minimum + max(0, math.ceil((value - minimum) / step - 1e-9)) * step
    if n > maximum + 1e-9:
        raise ValueError('segment exceeds output limit; split or authorized rewrite')
    return n


def validate_plan(data, base):
    if data.get('schema_version') != 1:
        raise ValueError('schema_version must be 1')
    strategies = data['strategies']
    if not 1 <= len(strategies) <= 3:
        raise ValueError('plan requires 1 to 3 final strategies')
    if data.get('max_inflight_jobs', 1) not in (1, 2, 3):
        raise ValueError('max_inflight_jobs must be 1..3; provider may be lower')
    root = (Path(base) / data['asset_root']).resolve()
    cap = data['capabilities']
    ids = set()
    for s in strategies:
        if s['id'] in ids:
            raise ValueError('duplicate strategy id')
        ids.add(s['id'])
        if s['audio_policy'] not in ('generated', 'rewrite', 'preserve_source', 'none'):
            raise ValueError('invalid audio policy')
        if not s.get('jobs'):
            raise ValueError('each strategy needs jobs')
        seen = set()
        for j in s['jobs']:
            if j['id'] in seen or any(x not in seen for x in j.get('depends_on', [])):
                raise ValueError('duplicate, forward or missing dependency; topologically order jobs')
            seen.add(j['id'])
            prompt = j['prompt']
            if not prompt.strip() or (data.get('product_id') and str(data['product_id']) in prompt):
                raise ValueError('empty prompt or product PID leaked into prompt')
            n = ceil_duration(j['duration'], cap['duration_min'], cap['duration_max'], cap['duration_step'])
            if abs(n - j['duration']) > 1e-8:
                raise ValueError('requested duration not on model grid')
            if j.get('target'):
                start, end = j['target']['start'], j['target']['end']
                if start < 0 or end <= start or end - start > j['duration'] + 1e-8:
                    raise ValueError('invalid target range or target longer than generated segment')
            for key in ('images', 'videos', 'audios'):
                for p in j.get(key, []):
                    if not (root / p).is_file():
                        raise ValueError('missing input: ' + p)
    return {'valid': True, 'strategies': len(strategies),
            'note': 'Basic checks only; inspect provider mode limits, input roles and semantic plan.'}


def frames(args):
    data = probe(args.input)
    duration = float(video(data).get('duration') or data['format']['duration'])
    end = duration if args.end is None else min(args.end, duration)
    if args.fps <= 0 or args.start < 0 or end <= args.start or args.width < 2:
        raise ValueError('invalid sample range/fps/width')
    estimate = math.ceil((end - args.start) * args.fps) + 2
    if estimate > args.max_frames:
        raise ValueError('frame budget exceeded: lower fps or page into explicit ranges')
    out = Path(args.out_dir).resolve()
    if out.exists() and any(out.iterdir()):
        raise ValueError('frame directory must be new or empty')
    out.mkdir(parents=True, exist_ok=True)
    cmd = ['ffmpeg', '-v', 'error', '-i', str(Path(args.input).resolve()), '-ss', str(args.start),
           '-t', str(end - args.start), '-vf', 'fps=%s,scale=%d:-2' % (args.fps, args.width),
           '-q:v', '2', str(out / 'frame-%06d.jpg')]
    run(cmd)
    files = sorted(out.glob('frame-*.jpg'))
    manifest = {'source': os.path.relpath(Path(args.input).resolve(), out), 'source_sha256': digest(args.input),
                'sampling_fps': args.fps, 'start': args.start, 'end': end, 'argv': cmd,
                'timestamp_kind': 'nominal sampling grid, not exact original decoded frame PTS',
                'frames': [{'file': p.name, 'nominal_time': args.start + i / args.fps} for i, p in enumerate(files)]}
    save(out / 'manifest.json', manifest)
    (out / 'agent.md').write_text('# Sampled frames\nSee manifest.json for sampling/time mapping. Visual understanding is pending.\n')
    return manifest


def cut(args):
    if args.start < 0 or args.end <= args.start or Path(args.output).exists():
        raise ValueError('invalid cut range or existing output')
    cmd = ['ffmpeg', '-v', 'error', '-i', args.input, '-ss', str(args.start), '-t', str(args.end - args.start),
           '-map', '0:v:0', '-c:v', 'libx264', '-crf', '18']
    cmd += ['-an'] if args.mute else ['-map', '0:a?', '-c:a', 'aac']
    cmd += [args.output]
    run(cmd)
    result = validate_media(args.output)
    result['transformation'] = {'argv': cmd, 'source_sha256': digest(args.input), 'range': [args.start, args.end]}
    save(args.output + '.json', result)
    return result


def assemble(spec_path, output):
    spec_path, output = Path(spec_path).resolve(), Path(output).resolve()
    spec = read(spec_path)
    if output.exists():
        raise ValueError('refusing to overwrite final')
    fps = Fraction(str(spec['fps']))
    if fps <= 0 or spec['audio_policy'] not in ('source', 'segments', 'none'):
        raise ValueError('invalid fps/audio policy')
    parts = spec['parts']
    if not parts or any(not isinstance(p['frames'], int) or p['frames'] <= 0 for p in parts):
        raise ValueError('positive target frames required')
    output.parent.mkdir(parents=True, exist_ok=True)
    commands = []
    with tempfile.TemporaryDirectory(prefix='replica-', dir=output.parent) as tmp:
        tmp = Path(tmp)
        shape = None
        for i, part in enumerate(parts):
            path = (spec_path.parent / part['file']).resolve()
            info = probe(path)
            v = video(info)
            shape_i = (v['width'], v['height'])
            if shape is not None and shape_i != shape:
                raise ValueError('normalize dimensions explicitly before assembly')
            shape = shape_i
            target_duration = float(part['frames'] / fps)
            cmd = ['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0',
                   '-vf', 'fps=%s,trim=end_frame=%d,setpts=PTS-STARTPTS' % (fps, part['frames']),
                   '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p']
            cmd += ['-an']
            cmd += [str(tmp / ('part-%d.mp4' % i))]
            run(cmd)
            commands.append(cmd)
            validate_media(cmd[-1], part['frames'])
            if spec['audio_policy'] == 'segments':
                if not any(s['codec_type'] == 'audio' for s in info['streams']):
                    raise ValueError('segment missing audio')
                audio_cmd = ['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0',
                             '-af', 'atrim=duration=%s,asetpts=PTS-STARTPTS' % target_duration,
                             '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', str(tmp / ('audio-%d.wav' % i))]
                run(audio_cmd)
                commands.append(audio_cmd)
                audio_duration = float(probe(audio_cmd[-1])['format']['duration'])
                if abs(audio_duration - target_duration) > 1 / 48000 + 1e-6:
                    raise ValueError('segment audio shorter than target; explicit audio policy required')
        listing = tmp / 'concat.txt'
        listing.write_text(''.join("file 'part-%d.mp4'\n" % i for i in range(len(parts))))
        cmd = ['ffmpeg', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(listing)]
        if spec['audio_policy'] == 'source':
            audio = (spec_path.parent / spec['source_audio']).resolve()
            cmd += ['-i', str(audio), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy']
        elif spec['audio_policy'] == 'segments':
            audio_listing = tmp / 'audio-concat.txt'
            audio_listing.write_text(''.join("file 'audio-%d.wav'\n" % i for i in range(len(parts))))
            cmd += ['-f', 'concat', '-safe', '0', '-i', str(audio_listing), '-map', '0:v:0', '-map', '1:a:0',
                    '-c:v', 'copy', '-c:a', 'aac']
        else:
            cmd += ['-c', 'copy']
        cmd += ['-movflags', '+faststart', str(tmp / 'final.mp4')]
        run(cmd)
        commands.append(cmd)
        result = validate_media(tmp / 'final.mp4', sum(p['frames'] for p in parts))
        expected_duration = float(sum(p['frames'] for p in parts) / fps)
        if abs(float(video(result['probe'])['duration']) - expected_duration) > 1e-4:
            raise ValueError('assembled video PTS duration mismatch')
        os.replace(tmp / 'final.mp4', output)
    result.update({'file': output.name, 'commands': commands, 'assembly_spec': spec,
                   'assembly_spec_sha256': digest(spec_path), 'note': 'Review joins and audio; technical validation only.'})
    save(str(output) + '.json', result)
    return result


def publish_import(product_dir, entry):
    root = Path(product_dir).resolve()
    manifest = root / 'replica-experiments.json'
    metadata = (root / entry['metadata']).resolve()
    if not metadata.is_relative_to(root):
        raise ValueError('metadata outside product directory')
    if not isinstance(entry.get('videoNumber'), int) or entry['videoNumber'] < 1:
        raise ValueError('videoNumber must be >=1')
    meta = read(metadata)
    output = (root / meta['output']['file']).resolve()
    if not output.is_relative_to(root):
        raise ValueError('output outside product directory')
    validate_media(output)
    lock = root / '.replica-import.lock'
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        os.close(fd)
        entries = read(manifest) if manifest.exists() else []
        for old in entries:
            if old['id'] == entry['id']:
                if old != entry:
                    raise ValueError('conflicting experiment id')
                return {'published_local_manifest': True, 'unchanged': True, 'entry': old}
        entries.append(entry)
        save(manifest, entries)
        return {'published_local_manifest': True, 'entry': entry, 'platform_readback': 'pending'}
    finally:
        lock.unlink()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='command', required=True)
    for name in ('probe', 'verify'):
        q = sub.add_parser(name)
        q.add_argument('--input', required=True)
        q.add_argument('--out', required=True)
    q = sub.add_parser('validate-plan')
    q.add_argument('--plan', required=True)
    q = sub.add_parser('duration', help='Round a segment to allowed output duration; does not select cuts')
    for key in ('target', 'minimum', 'maximum', 'step'):
        q.add_argument('--' + key, type=float, required=True)
    q = sub.add_parser('frames')
    q.add_argument('--input', required=True)
    q.add_argument('--out-dir', required=True)
    q.add_argument('--fps', type=float, required=True)
    q.add_argument('--start', type=float, default=0)
    q.add_argument('--end', type=float)
    q.add_argument('--width', type=int, default=360)
    q.add_argument('--max-frames', type=int, default=200)
    q = sub.add_parser('cut', help='Time-based accurate decode/re-encode; strict frame cuts need explicit PTS/frame workflow')
    q.add_argument('--input', required=True)
    q.add_argument('--output', required=True)
    q.add_argument('--start', type=float, required=True)
    q.add_argument('--end', type=float, required=True)
    q.add_argument('--mute', action='store_true')
    q = sub.add_parser('assemble', help='CFR matching dimensions; JSON fps, parts[{file,frames}], audio_policy source/segments/none, source_audio')
    q.add_argument('--spec', required=True)
    q.add_argument('--output', required=True)
    q = sub.add_parser('publish-import')
    q.add_argument('--product-dir', required=True)
    q.add_argument('--entry', required=True, help='JSON file containing one manifest entry')
    a = p.parse_args()
    if a.command in ('probe', 'verify'):
        result = probe(a.input) if a.command == 'probe' else validate_media(a.input)
        save(a.out, result)
    elif a.command == 'validate-plan':
        result = validate_plan(read(a.plan), Path(a.plan).resolve().parent)
    elif a.command == 'duration':
        result = {'request_duration': ceil_duration(a.target, a.minimum, a.maximum, a.step)}
    elif a.command == 'frames':
        result = frames(a)
    elif a.command == 'cut':
        result = cut(a)
    elif a.command == 'assemble':
        result = assemble(a.spec, a.output)
    else:
        result = publish_import(a.product_dir, read(a.entry))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
