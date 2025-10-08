from django import forms

class UploadCSVForm(forms.Form):
    arquivo = forms.FileField(label="Selecione um arquivo CSV")
