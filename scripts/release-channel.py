"""Resolve one build workflow's publication choice without changing branch policy."""
import os
import re


def release_channel(version, branch, channel, development, run):
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Use major.minor.patch; leave Version blank to use package.json.')
    if channel not in ('auto', 'prerelease', 'stable', 'artifacts'):
        raise ValueError('Unknown release channel.')
    if development:
        return {'tag': f'dev-{version}-{run}', 'prerelease': 'true', 'publish': 'false'}
    stable = channel == 'stable' or channel == 'auto' and branch == 'main'
    if stable and branch != 'main':
        raise ValueError('Select main for a stable release. Integrate development into testing, then main first.')
    return {'tag': f'v{version}' if stable else f'v{version}-testing.{run}', 'prerelease': str(not stable).lower(), 'publish': str(channel != 'artifacts').lower()}


if __name__ == '__main__':
    import json
    version = os.environ.get('INPUT_VERSION') or json.load(open('package.json'))['version']
    result = release_channel(version, os.environ['GITHUB_REF_NAME'], os.environ.get('INPUT_CHANNEL') or 'auto', os.environ.get('APP_DEVELOPMENT_BUILD') == '1', os.environ['GITHUB_RUN_NUMBER'])
    print(f'version={version}')
    for key, value in result.items():
        print(f'{key}={value}')
