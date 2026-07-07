"""
读取 PDF 试卷内容并保存为文本文件，便于后续对比分析
"""
import pypdf
import sys

pdf_path = r"d:\文件\工作 作业\微信小程序\期末\A卷  6.广东工商职业技术大学期末技能考核试卷模版-有更新-（纯技能或技能+试卷考核的技能部分） .pdf"
out_path = r"d:\文件\工作 作业\微信小程序\期末\pdf_content.txt"

try:
    reader = pypdf.PdfReader(pdf_path)
    print(f"PDF 总页数: {len(reader.pages)}")
    all_text = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        all_text.append(f"\n{'='*80}\n[第 {i} 页]\n{'='*80}\n{text}")
    full = "".join(all_text)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(full)
    print(f"已写入: {out_path} (字符数: {len(full)})")
except Exception as e:
    print("读取 PDF 出错:", e)
    sys.exit(1)
