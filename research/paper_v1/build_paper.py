"""Convert the paper source to DOCX with editable equations via Pandoc.

Requires pandoc and python-docx. Render the DOCX to PDF with LibreOffice and
visually inspect it before distribution. No results are inferred by this script.
"""
import argparse
import subprocess
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(__file__).parent/'manuscript/paper.md')
    parser.add_argument('--output', type=Path, default=Path(__file__).parent/'manuscript/MindSense_Research_Paper.docx')
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['pandoc', str(args.source), '--from=markdown+tex_math_single_backslash',
                    '--to=docx', '--resource-path='+str(args.source.parent), '--output='+str(args.output)], check=True)
    doc = Document(args.output)
    styles = {style.name: style for style in doc.styles}
    for section in doc.sections:
        section.page_width, section.page_height = Inches(8.27), Inches(11.69)
        section.top_margin = section.bottom_margin = Inches(.7)
        section.left_margin = section.right_margin = Inches(.8)
        section.footer_distance = Inches(.3)
        p = section.footer.paragraphs[0]
        p.alignment = 1
        field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); p._p.append(field)
    for name in ['Normal', 'Body Text', 'First Paragraph', 'Title', 'Heading 1', 'Heading 2', 'Heading 3']:
        st = styles[name]
        st.font.name = 'Times New Roman'; st.font.color.rgb = RGBColor(0,0,0)
        st.font.size = Pt(11)
        st.paragraph_format.space_after = Pt(6)
        st.paragraph_format.line_spacing = 1.08
    for name, size in [('Title', 18), ('Heading 1', 13), ('Heading 2', 11.5), ('Heading 3', 11)]:
        st = styles[name]; st.font.size = Pt(size); st.font.bold = True
        st.paragraph_format.space_before = Pt(10); st.paragraph_format.keep_with_next = True
    doc.paragraphs[0].style = styles['Title']
    # Shift markdown's top-level section headings down to a consistent ladder.
    for p in doc.paragraphs[1:]:
        if p.style.name == 'Heading 2': p.style = styles['Heading 1']
        elif p.style.name == 'Heading 3': p.style = styles['Heading 2']
    for border in list(doc.styles.element.xpath('.//w:pBdr')):
        border.getparent().remove(border)
    for table in doc.tables:
        n = len(table.columns)
        widths = {2: [2.5,4.17], 4: [1.6,1.05,1.45,2.57], 5: [.65,.65,1.7,1.7,1.97], 6: [2.1,.9,.9,.9,.9,.97]}.get(n,[6.67/n]*n)
        table.autofit = False
        for col, width in zip(table.columns, widths): col.width = Inches(width)
        borders = OxmlElement('w:tblBorders')
        for side in ['top','left','bottom','right','insideH','insideV']:
            b=OxmlElement('w:'+side); b.set(qn('w:val'),'single');b.set(qn('w:sz'),'4');b.set(qn('w:color'),'D9D9D9');borders.append(b)
        table._tbl.tblPr.append(borders)
        for i, row in enumerate(table.rows):
            tr = row._tr.get_or_add_trPr(); tr.append(OxmlElement('w:cantSplit'))
            if i == 0: tr.append(OxmlElement('w:tblHeader'))
            for j, cell in enumerate(row.cells):
                cell.width=Inches(widths[j]);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
                props=cell._tc.get_or_add_tcPr()
                shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'E7E6E6' if i==0 else 'FFFFFF');props.append(shade)
                margins=OxmlElement('w:tcMar')
                for side in ['top','bottom','left','right']:
                    m=OxmlElement('w:'+side);m.set(qn('w:w'),'75');m.set(qn('w:type'),'dxa');margins.append(m)
                props.append(margins)
                for p in cell.paragraphs:
                    p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=1.03
                    for run in p.runs: run.font.size=Pt(9);run.bold=i==0
    doc.core_properties.title='Late Fusion with Partially Overlapping Emotion Labels'
    doc.core_properties.author=''
    doc.core_properties.comments=''
    doc.save(args.output)
    print(args.output)


if __name__ == '__main__':
    main()
