#!/usr/bin/env python3

## to execute run: python script.py
## Look for output.txt

import os

# Items to skip; you can keep updating this set as needed.
EXCLUDED_ITEMS = {
    'node_modules',
    'script.py',
    'scripts.py',
    '_scripts.py',
    'notes.md',
    'assets',
    '.expo',
    'package-lock.json',
    '.git',
    '.DS_Store',
}

OUTPUT_FILE = 'output.txt'

def should_skip(name):
    # skip anything explicitly excluded or any dot-file/folder
    return name in EXCLUDED_ITEMS or name.startswith('.')

def main():
    # Project root is directory containing this script
    root = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(root, OUTPUT_FILE)

    # This will create output.txt if missing, or truncate it if it exists
    with open(output_path, 'w', encoding='utf-8'):
        pass

    with open(output_path, 'a', encoding='utf-8') as out_file:
        for dirpath, dirnames, filenames in os.walk(root, topdown=True):
            # remove excluded or dot-dirs so we never descend into them
            dirnames[:] = [d for d in dirnames if not should_skip(d)]

            # filter files: drop excluded, dot-files, the script itself, and output.txt
            filenames = [
                f for f in filenames
                if not should_skip(f)
                and f not in {OUTPUT_FILE, os.path.basename(__file__)}
            ]

            for fname in filenames:
                file_path = os.path.join(dirpath, fname)
                rel_path = os.path.relpath(file_path, root)

                # write header: the relative path
                out_file.write(rel_path + '\n')

                # dump file contents (or note if unreadable)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        out_file.write(f.read())
                except Exception:
                    out_file.write('[binary or unreadable file skipped]\n')

                # separator before next file
                out_file.write('\n' + '-' * 80 + '\n')

if __name__ == '__main__':
    main()
