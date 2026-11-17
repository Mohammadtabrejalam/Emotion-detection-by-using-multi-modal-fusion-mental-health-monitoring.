"""Build the academic report from Markdown and verified committed metrics.

Requires python-docx, matplotlib and Pillow. Run the evidence verifier first.
The DOCX renderer is an external authoring tool, not an application dependency.
"""
import argparse
import json
import re
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parents[1]


def inline(paragraph, text):
    pos = 0
    for match in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', text):
        paragraph.add_run(text[pos:match.start()])
        relation = paragraph.part.relate_to(match[2], RT.HYPERLINK, is_external=True)
        link = OxmlElement('w:hyperlink'); link.set(qn('r:id'), relation)
        run = OxmlElement('w:r'); props = OxmlElement('w:rPr')
        color = OxmlElement('w:color'); color.set(qn('w:val'), '244B72'); props.append(color)
        run.append(props); label = OxmlElement('w:t'); label.text = match[1]
        run.append(label); link.append(run); paragraph._p.append(link)
        pos = match.end()
    paragraph.add_run(text[pos:])


def figure():
    report = json.loads((ROOT / 'reports/ravdess_actor01.json').read_text())
    fig, axes = plt.subplots(1, 2, figsize=(10.6, 4.0), layout='constrained')
    labels = report['results']['image']['labels']
    short = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral']
    for ax, mode, title in zip(axes, ['image', 'fusion'], ['Face only', 'Existing fusion']):
        matrix = report['results'][mode]['confusion_matrix']
        ax.imshow(matrix, cmap='Blues', vmin=0, vmax=8)
        ax.set_xticks(range(7), short, rotation=40, ha='right', fontsize=9)
        ax.set_yticks(range(7), short, fontsize=9)
        ax.set_title(title, fontsize=12, fontweight='bold')
        ax.set_xlabel('Predicted label', fontsize=10); ax.set_ylabel('True label', fontsize=10)
        for i in range(7):
            for j in range(7):
                ax.text(j, i, str(matrix[i][j]), ha='center', va='center', fontsize=10,
                        color='white' if matrix[i][j] >= 5 else '#15283b')
        for spine in ax.spines.values(): spine.set_visible(False)
    assets = ROOT / 'docs/report_assets'; assets.mkdir(exist_ok=True)
    fig.savefig(assets / 'actor01_confusions.png', dpi=220, facecolor='white')
    plt.close(fig)


def table(doc, lines):
    rows = [[c.strip() for c in line.strip().strip('|').split('|')] for line in lines]
    rows = [row for row in rows if not all(re.fullmatch(r'[-: ]+', c) for c in row)]
    n = len(rows[0]); t = doc.add_table(rows=1, cols=n); t.autofit = False
    if n == 2: widths = [2.0, 4.7]
    elif n == 3: widths = [1.18, 2.45, 3.07]
    elif n == 4: widths = [2.0, 1.15, 1.2, 2.35]
    else: widths = [2.65, 0.95, 0.75, 1.05, 1.3]
    if rows[0][0] == 'Class': widths = [2.7, 1.3, 1.3, 1.4]
    if rows[0][0] == 'RAVDESS filename': widths = [2.6, .65, .8, .8, 1.85]
    if rows[0][0] == 'Reported test method': widths = [2.4, 1.1, 1.1, 2.1]
    if rows[0][0] == 'Method' and n == 4: widths = [2.65, 1.35, 1.35, 1.35]
    if rows[0][0] == 'Actor' and n == 4: widths = [1.0, 1.9, 1.9, 1.9]
    if rows[0][0] == 'Condition' and n == 3: widths = [3.6, 1.55, 1.55]
    if rows[0][0] == 'Method family': widths = [1.8, 2.6, 2.3]
    for col, width in zip(t.columns, widths): col.width = Inches(width)
    props = t._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for name in ('top','left','bottom','right','insideH','insideV'):
        border = OxmlElement('w:'+name); border.set(qn('w:val'),'single')
        border.set(qn('w:sz'),'4'); border.set(qn('w:color'),'D9D9D9'); borders.append(border)
    props.append(borders)
    for i, row in enumerate(rows):
        cells = t.rows[0].cells if i == 0 else t.add_row().cells
        trpr = t.rows[i]._tr.get_or_add_trPr(); no_split = OxmlElement('w:cantSplit'); trpr.append(no_split)
        if i == 0: trpr.append(OxmlElement('w:tblHeader'))
        for j, (cell, value) in enumerate(zip(cells, row)):
            cell.width = Inches(widths[j]); cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            pr = cell._tc.get_or_add_tcPr()
            shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), 'DCE6EE' if i==0 else 'F6F8FA' if i%2==0 else 'FFFFFF'); pr.append(shd)
            margins = OxmlElement('w:tcMar')
            for side in ('top','bottom','left','right'):
                node = OxmlElement('w:'+side); node.set(qn('w:w'), '85'); node.set(qn('w:type'),'dxa'); margins.append(node)
            pr.append(margins)
            p = cell.paragraphs[0]; p.paragraph_format.space_after=Pt(0); p.paragraph_format.space_before=Pt(0)
            p.paragraph_format.line_spacing=1.05
            if j > 0 and re.fullmatch(r'[\d.,% -]+', value): p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            inline(p,value)
            for run in p.runs: run.font.size=Pt(9); run.bold=i==0
    p=doc.add_paragraph();p.paragraph_format.space_after=Pt(1);p.paragraph_format.space_before=Pt(0);p.paragraph_format.line_spacing=Pt(2)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'docs/MindSense_Academic_Report.docx');args=parser.parse_args()
    figure()
    text=(ROOT/'docs/ACADEMIC_REPORT.md').read_text()
    if '{{' in text: raise ValueError('Report contains unresolved placeholders')
    doc=Document();sec=doc.sections[0]
    sec.page_width=Inches(8.27);sec.page_height=Inches(11.69)
    sec.top_margin=Inches(.65);sec.bottom_margin=Inches(.65);sec.left_margin=Inches(.78);sec.right_margin=Inches(.78)
    sec.footer_distance=Inches(.3)
    for name in ('Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3','Caption'):
        st=doc.styles[name];st.font.name='Calibri';st.font.color.rgb=RGBColor(0,0,0)
    normal=doc.styles['Normal'];normal.font.size=Pt(10.5);normal.paragraph_format.line_spacing=1.1;normal.paragraph_format.space_after=Pt(6)
    for name,size in [('Title',25),('Heading 1',16),('Heading 2',12),('Heading 3',11)]:
        st=doc.styles[name];st.font.size=Pt(size);st.font.bold=True;st.paragraph_format.space_before=Pt(10);st.paragraph_format.space_after=Pt(6)
    doc.styles['Caption'].font.size=Pt(9);doc.styles['Caption'].font.italic=True
    for border in list(doc.styles.element.xpath('.//w:pBdr')):
        border.getparent().remove(border)
    footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    r=footer.add_run();fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');r._r.addnext(fld)
    lines=text.splitlines();i=0
    while i<len(lines):
        line=lines[i]
        if not line.strip():i+=1;continue
        if line=='<!-- PAGEBREAK -->':doc.add_page_break();i+=1;continue
        if line.startswith('|'):
            chunk=[]
            while i<len(lines) and lines[i].startswith('|'):chunk.append(lines[i]);i+=1
            table(doc,chunk);continue
        m=re.match(r'!\[(.*?)\]\((.*?)\)',line)
        if m:
            p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.keep_with_next=True
            width=6.1 if 'home.png' in m[2] else 5.5 if '/confusion_' in m[2] else 6.6
            picture=p.add_run().add_picture(str(ROOT/'docs'/m[2]),width=Inches(width))
            picture._inline.docPr.set('descr',m[1]);i+=1;continue
        if line.startswith('# '):p=doc.add_paragraph(line[2:],'Title')
        elif line.startswith('## '):p=doc.add_paragraph(line[3:],'Heading 1')
        elif line.startswith('### '):p=doc.add_paragraph(line[4:],'Heading 2')
        elif line.startswith('    '):
            p=doc.add_paragraph();p.paragraph_format.space_after=Pt(3);p.paragraph_format.left_indent=Inches(.12)
            run=p.add_run(line.strip());run.font.name='Liberation Mono';run.font.size=Pt(9)
        else:
            p=doc.add_paragraph(style='Caption' if line.startswith('Figure ') else 'Normal');inline(p,line)
        i+=1
    doc.core_properties.title='MindSense multimodal emotion recognition'
    doc.core_properties.subject='Academic report on implementation and fusion evaluation'
    doc.core_properties.author='Mohammad Tabrez Alam';doc.core_properties.keywords='multimodal emotion recognition; evaluation; fusion'
    args.output.parent.mkdir(parents=True,exist_ok=True);doc.save(args.output)
    print(args.output)


if __name__=='__main__':main()
