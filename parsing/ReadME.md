# 文件夹使用说明
### 第一步 粗筛
```
处理文件类型：.docx
处理文件地址：parsing/documents
运行python脚本：parsing/main.py
生成文件地址：parsing/extracted_texts
```

把需要处理的docx文件粘贴到parsing/documents文件夹中，运行parsing/main.py，在extracted_texts文件夹里生成同名粗筛文件。

### 人工处理步骤
```
处理文件类型：txt
处理文件地址：parsing/extracted_texts
处理后文件地址：parsing/extracted_texts/sourceName (e.g. parsing/extracted_texts/MS)
```

初步清理extracted_texts文件夹里生成的内容，数据以`ChineseName;EnglishName`的形式表现。处理后放入子文件夹暂存。

### 第二步 转换
```
处理文件类型：.txt
处理文件地址：parsing/extracted_texts
运行python脚本：parsing/extracted_texts/main.py
生成文件地址：parsing/conversed_texts
```

运行extracted_texts文件中的main.py，在conversed_texts的文件夹里生成结构完整的数据（结构完整但内容为空）:
`EnglishName;ChineseName;OtherNames;Description`

### 人工处理步骤
把parsing/conversed_texts目录下的文件按数据来源分类入各个文件夹（古典学期刊/个人译者），整理，增补数据：按照`EnglishName;ChineseName;OtherNames;Description`的结构，再分入三个文档：`01_ancientName.txt`, `02_terminology.txt`以及`03_modernResearcher`。

### 第三步 整理
```
处理文件类型：.txt
处理文件地址：parsing/conversed_texts/*/
运行python脚本：parsing/conversed_texts/main.py
生成文件地址：parsing/conversed_texts
```
运行conversed_texts文件中的main.py，将子文件夹中的三类信息汇总到parsing/conversed_texts的三个txt文件中，并整理排序。