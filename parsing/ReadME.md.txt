# 文件夹使用说明
### 第一步 粗筛
把需要处理的docx文件粘贴到documents文件夹中，运行parsing根目录下的main.py，在extracted_texts文件夹里生成同名粗筛文件。

### 人工处理步骤
初步删改整理extracted_texts文件夹里生成的内容，数据以“中译名;外文“的形式表现

### 第二部 转换
运行extracted_texts文件中的main.py，在conversed_texts的文件夹里生成结构完整的数据（结构完整但内容为空）

### 人工处理步骤
把conversed_texts文件夹的文件按数据来源分类（古典学期刊/个人译者），整理，增补数据：按照”单一外文（以英文为主）;中译名;其他写法;注释“的结构，再分入三个文档：01_ancientName.txt, 02_terminology.txt以及03_modernResearcher。
