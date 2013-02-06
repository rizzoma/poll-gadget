#/usr/bin/python

from base64 import b64encode
import os.path
import sys

TAG = '%%'

start_from = sys.argv[1] if len(sys.argv) > 1 else 'gadget.xml'
result = '%s %s %s'%(TAG, start_from, TAG)
while (True):
    start = result.find(TAG)
    if start == -1:
        break
    end = result.find(TAG, start + 1)
    command = result[start + len(TAG):end].strip()
    try:
        file_name, base64 = command.split(' ')
    except:
        file_name, base64 = command, False
    file_body = open(file_name).read()
    if base64:
        file_body = b64encode(file_body)
    result = result[0:start] + file_body + result[end + len(TAG):]

output_file = os.path.join('build', os.path.basename(start_from))
with open(output_file, 'w') as output:
    output.write(result)
