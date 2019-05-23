"""
Use the following examples to see the syntax used for adding update-able tags (id or class) to components:
<component id={/* tag<nameForTag>*/ "oldID" } />
    ---> <component id={/* tag<nameForTag>*/ "nameForTag_suffix" } /
<component className={/* tag<newNameForTag> */ "oldClassName" } />
    ---> <component className={/* tag<newNameForTag> */ "newNameForTag" } />
<component className={/* tag<otherClass OtherClass2 newInsertClass>*/ "otherClass OtherClass2 oldClass" } />
    ---> <component className={/* tag<otherClass newInsertClass>*/ "otherClass newInsertClass" } />
"""

import re
import argparse

desc = '''
Use the following example to see the syntax for adding update-able tags to components:
    <component id={/* tag<nameForTag>*/ "oldID" } />
result:
    <component id={/* tag<nameForTag>*/ "nameForTag_suffix" } /
'''
parser = argparse.ArgumentParser(description=desc)

# Add argument options
parser.add_argument('--log', '-l', help='<Optional> Specify the path where to save the log containing tag names, \
                    values and thier locations.',
                    default="tests/component_tags.txt")
parser.add_argument('--source', '-so', nargs='+',
                    help='<Required> The path of the file or files to update.', required=True)
parser.add_argument(
    '--suffix', '-s', help="<Required> The string value to attach to the end of the tags. Ex: -su='-1234' tagName' --> \
    'tagName-1234'", required=True)

args = parser.parse_args()


def updateFile(file, regex, suffix):
    try:
        hasTags = False
        message = ""

        with open(file, "r") as f:
            content = f.readlines()

        newContent = []
        for idx, line in enumerate(content):
            matches = re.finditer(regex, line)
            newLine = line
            for m in matches:
                hasTags = True
                base, old, new = updateTag(m, suffix)
                newLine = newLine.replace(old, new)
                pos = m.start() + 1
                message += '    Line {}, Col {}: "{}" --> {}\n'.format(
                    idx+1, pos, base, new)
            newContent.append(newLine)

        with open(file, "w") as f:
            f.seek(0)
            f.writelines(newContent)
            f.truncate()
        if hasTags:
            message = "Tag in: {}\n".format(file) + message
        else:
            message = "No tags found in: {}\n".format(file)

        return message

    except Exception as e:
        return e.message


def updateTag(match, suffix):
    baseName = match.group(2)
    oldTag = match.group(3)
    newTag = '"{}-{}"'.format(baseName, suffix)

    return [baseName, oldTag, newTag]


def main():

    regex = re.compile(r"(\/\*\s*@tag<(.*?)>\s*\*\/\s*)([\'\"].*?[\'\"])")
    logPath = args.log

    files = args.source
    suffix = args.suffix
    log = ""

    for file in files:
        log += updateFile(file, regex, suffix)

    with open(logPath, "w+") as f:
        f.seek(0)
        f.write(log)
        f.truncate()


if __name__ == '__main__':
    main()
