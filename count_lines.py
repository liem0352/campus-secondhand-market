import os
d = r'd:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\docs'
for f in sorted(os.listdir(d)):
    if f.endswith('.md'):
        fp = os.path.join(d, f)
        with open(fp, encoding='utf-8') as fh:
            lines = sum(1 for _ in fh)
        print(f'{f}: {lines} lines')
