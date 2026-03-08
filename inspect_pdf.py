import PyPDF2
path = r'd:\multi-disease\predict.pdf'
try:
    reader = PyPDF2.PdfReader(path)
    for i, page in enumerate(reader.pages):
        print('Page', i+1)
        print(page.extract_text())
except Exception as e:
    print('error', e)
