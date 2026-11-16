"""Build the public research summary from actual evaluator JSON, never constants."""
import json
from collections import Counter
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]/'reports'
    summaries = []
    for filename, name, scope in (
        ('meld_text.json','MELD text transfer','Official test split; independent utterances without dialogue context.'),
        ('ravdess_actor01.json','RAVDESS actor-01 diagnostic','One actor; non-calm clips. Audio metrics include only its four supported labels. Not population evidence.'),
    ):
        path = root/filename
        report = json.loads(path.read_text())
        counts = Counter(row['true'] for row in report['predictions'])
        label, count = counts.most_common(1)[0]
        baseline = {'label':label,'accuracy':count/sum(counts.values())}
        report['majority_class_baseline'] = baseline
        path.write_text(json.dumps(report,indent=2)+'\n')
        summaries.append({'name':name,'scope':scope,'source':report['source'],'results':report['results'],
                          'majority_class_baseline':baseline,'runtime':report.get('runtime'), 'report':filename})
    (root/'evaluation.json').write_text(json.dumps({'evaluations':summaries,
        'limitations':['No clinical validation. Fusion is uncalibrated and has not demonstrated improvement.']},indent=2)+'\n')

if __name__ == '__main__': main()
