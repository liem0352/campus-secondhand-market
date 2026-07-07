import os
docs_dir = r'd:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\docs'
for root, _, files in os.walk(docs_dir):
    for f in sorted(files):
        if f.endswith('.md'):
            full = os.path.join(root, f)
            try:
                with open(full, encoding='utf-8') as fp:
                    n = sum(1 for _ in fp)
                rel = os.path.relpath(full, docs_dir)
                print(f'{n:5d}  {rel}')
            except Exception as e:
                print(f'ERR  {f}: {e}')
